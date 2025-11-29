import { supabase } from './client';

export interface UserBalance {
  id: string;
  user_id: string;
  token_symbol: string;
  token_address: string;
  decimals: number;
  balance: string; // bigint as string
  created_at: string;
  updated_at: string;
}

export interface BalanceTransaction {
  id: string;
  user_id: string;
  type: 'DEPOSIT' | 'WITHDRAW';
  amount: string; // bigint as string
  token_symbol: string;
  token_address: string;
  decimals: number;
  payment_id?: string;
  tx_hash?: string;
  balance_before: string;
  balance_after: string;
  note?: string;
  created_at: string;
}

export interface TreasuryConfig {
  id: string;
  treasury_address: string;
  chain: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Get user's balance for a specific token
 */
export async function getUserBalance(
  userId: string,
  tokenAddress: string
): Promise<UserBalance | null> {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .eq('token_address', tokenAddress)
      .maybeSingle();

    if (error) {
      console.error('Error getting user balance:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Error getting user balance:', error);
    return null;
  }
}

/**
 * Get all user balances
 */
export async function getUserBalances(userId: string): Promise<UserBalance[]> {
  try {
    const { data, error } = await supabase
      .from('user_balances')
      .select('*')
      .eq('user_id', userId)
      .order('balance', { ascending: false });

    if (error) {
      console.error('Error getting user balances:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting user balances:', error);
    return [];
  }
}

/**
 * Credit balance to user (when payment is received)
 */
export async function creditBalance(params: {
  userId: string;
  amount: bigint;
  tokenSymbol: string;
  tokenAddress: string;
  decimals: number;
  paymentId: string;
  note?: string;
}): Promise<{ success: boolean; transaction?: BalanceTransaction; error?: string }> {
  try {
    const { userId, amount, tokenSymbol, tokenAddress, decimals, paymentId, note } = params;

    // Get current balance
    let currentBalance = await getUserBalance(userId, tokenAddress);
    
    const balanceBefore = currentBalance ? BigInt(currentBalance.balance) : 0n;
    const balanceAfter = balanceBefore + amount;

    // Start a transaction
    if (!currentBalance) {
      // Create new balance record
      const { data: newBalance, error: balanceError } = await supabase
        .from('user_balances')
        .insert({
          user_id: userId,
          token_symbol: tokenSymbol,
          token_address: tokenAddress,
          decimals: decimals,
          balance: balanceAfter.toString(),
        })
        .select()
        .single();

      if (balanceError) {
        console.error('Error creating balance:', balanceError);
        return { success: false, error: balanceError.message };
      }

      currentBalance = newBalance;
    } else {
      // Update existing balance
      const { error: updateError } = await supabase
        .from('user_balances')
        .update({
          balance: balanceAfter.toString(),
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentBalance.id);

      if (updateError) {
        console.error('Error updating balance:', updateError);
        return { success: false, error: updateError.message };
      }
    }

    // Create balance transaction record
    const { data: transaction, error: txError } = await supabase
      .from('balance_transactions')
      .insert({
        user_id: userId,
        type: 'DEPOSIT',
        amount: amount.toString(),
        token_symbol: tokenSymbol,
        token_address: tokenAddress,
        decimals: decimals,
        payment_id: paymentId,
        balance_before: balanceBefore.toString(),
        balance_after: balanceAfter.toString(),
        note: note,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      return { success: false, error: txError.message };
    }

    // Mark payment as balance_credited
    await supabase
      .from('stealth_payments')
      .update({
        balance_credited: true,
        balance_transaction_id: transaction.id,
      })
      .eq('id', paymentId);

    return { success: true, transaction };
  } catch (error: any) {
    console.error('Error crediting balance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Debit balance from user (when withdrawal is made)
 */
export async function debitBalance(params: {
  userId: string;
  amount: bigint;
  tokenAddress: string;
  txHash: string;
  note?: string;
}): Promise<{ success: boolean; transaction?: BalanceTransaction; error?: string }> {
  try {
    const { userId, amount, tokenAddress, txHash, note } = params;

    // Get current balance
    const currentBalance = await getUserBalance(userId, tokenAddress);
    
    if (!currentBalance) {
      return { success: false, error: 'Balance not found' };
    }

    const balanceBefore = BigInt(currentBalance.balance);
    
    if (balanceBefore < amount) {
      return { success: false, error: 'Insufficient balance' };
    }

    const balanceAfter = balanceBefore - amount;

    // Update balance
    const { error: updateError } = await supabase
      .from('user_balances')
      .update({
        balance: balanceAfter.toString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', currentBalance.id);

    if (updateError) {
      console.error('Error updating balance:', updateError);
      return { success: false, error: updateError.message };
    }

    // Create balance transaction record
    const { data: transaction, error: txError } = await supabase
      .from('balance_transactions')
      .insert({
        user_id: userId,
        type: 'WITHDRAW',
        amount: amount.toString(),
        token_symbol: currentBalance.token_symbol,
        token_address: tokenAddress,
        decimals: currentBalance.decimals,
        tx_hash: txHash,
        balance_before: balanceBefore.toString(),
        balance_after: balanceAfter.toString(),
        note: note,
      })
      .select()
      .single();

    if (txError) {
      console.error('Error creating transaction:', txError);
      return { success: false, error: txError.message };
    }

    return { success: true, transaction };
  } catch (error: any) {
    console.error('Error debiting balance:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Get user's balance transaction history
 */
export async function getBalanceTransactions(
  userId: string,
  limit: number = 50
): Promise<BalanceTransaction[]> {
  try {
    const { data, error } = await supabase
      .from('balance_transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error getting balance transactions:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Error getting balance transactions:', error);
    return [];
  }
}

/**
 * Get active treasury address for a chain
 */
export async function getTreasuryAddress(chain: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('treasury_config')
      .select('treasury_address')
      .eq('chain', chain)
      .eq('is_active', true)
      .maybeSingle();

    if (error) {
      console.error('Error getting treasury address:', error);
      return null;
    }

    return data?.treasury_address || null;
  } catch (error) {
    console.error('Error getting treasury address:', error);
    return null;
  }
}

/**
 * Payment handler for processing incoming payments and crediting balances
 */

import { supabase } from './client';
import { creditBalance } from './balances';

export interface SavePaymentParams {
  userId: string;
  txHash: string;
  stealthAddress: string;
  payerAddress: string;
  amount: bigint;
  tokenSymbol: string;
  tokenAddress: string;
  decimals: number;
  label?: string;
  note?: string;
  ephemeralPubkey: string;
}

/**
 * Save payment to database and credit user balance
 * This combines payment recording with balance crediting in a single operation
 */
export async function savePaymentAndCreditBalance(
  params: SavePaymentParams
): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  const {
    userId,
    txHash,
    stealthAddress,
    payerAddress,
    amount,
    tokenSymbol,
    tokenAddress,
    decimals,
    label,
    note,
    ephemeralPubkey,
  } = params;

  try {
    // Check if payment already exists
    const { data: existing, error: checkError } = await supabase
      .from('stealth_payments')
      .select('id, balance_credited')
      .eq('tx_hash', txHash)
      .maybeSingle();

    if (checkError && checkError.code !== 'PGRST116') {
      console.error('Error checking payment:', checkError);
      return { success: false, error: checkError.message };
    }

    // If payment exists and balance already credited, skip
    if (existing) {
      if (existing.balance_credited) {
        console.log('Payment already processed and credited:', txHash);
        return { success: true, paymentId: existing.id };
      }
      
      // Payment exists but not credited yet - credit it now
      console.log('Payment exists but not credited, crediting now:', txHash);
      const creditResult = await creditBalance({
        userId,
        amount,
        tokenSymbol,
        tokenAddress,
        decimals,
        paymentId: existing.id,
        note: `Payment from ${payerAddress}${label ? ` - ${label}` : ''}`,
      });

      if (!creditResult.success) {
        console.error('Failed to credit balance:', creditResult.error);
        return { success: false, error: creditResult.error };
      }

      return { success: true, paymentId: existing.id };
    }

    // Insert new payment
    const { data: payment, error: insertError } = await supabase
      .from('stealth_payments')
      .insert({
        user_id: userId,
        tx_hash: txHash,
        stealth_address: stealthAddress,
        payer_address: payerAddress,
        amount: amount.toString(),
        token_symbol: tokenSymbol,
        token_address: tokenAddress,
        decimals: decimals,
        label: label || null,
        note: note || null,
        ephemeral_pubkey: ephemeralPubkey,
        status: 'CONFIRMED',
        confirmed_at: new Date().toISOString(),
        balance_credited: false, // Will be set to true after crediting
      })
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting payment:', insertError);
      return { success: false, error: insertError.message };
    }

    console.log('Payment saved:', payment.id);

    // Credit user balance
    const creditResult = await creditBalance({
      userId,
      amount,
      tokenSymbol,
      tokenAddress,
      decimals,
      paymentId: payment.id,
      note: `Payment from ${payerAddress}${label ? ` - ${label}` : ''}`,
    });

    if (!creditResult.success) {
      console.error('Failed to credit balance:', creditResult.error);
      // Payment is saved but balance not credited - this should be handled by monitoring
      return { 
        success: false, 
        error: 'Payment saved but balance credit failed',
        paymentId: payment.id 
      };
    }

    console.log('Balance credited successfully for payment:', payment.id);

    return { success: true, paymentId: payment.id };
  } catch (error: any) {
    console.error('Error in savePaymentAndCreditBalance:', error);
    return { success: false, error: error.message || 'Unknown error' };
  }
}

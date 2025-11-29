/**
 * Withdraw API endpoint
 * Handles withdrawal requests from user balance to their wallet
 * NOTE: This is a server-side API route
 */

import { NextRequest, NextResponse } from 'next/server';
import { getUserBalance } from '@/lib/supabase/balances';
import { Aptos, AptosConfig, Network, Account, Ed25519PrivateKey } from "@aptos-labs/ts-sdk";
import { debitBalance } from '@/lib/supabase/balances';

const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === 'true';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { userId, destinationAddress, amount, tokenAddress, tokenSymbol } = body;

    // Validate input
    if (!userId || !destinationAddress || !amount || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert amount to bigint
    const amountBigInt = BigInt(amount);

    // Check user balance
    const balance = await getUserBalance(userId, tokenAddress);
    if (!balance) {
      return NextResponse.json(
        { error: 'No balance found for this token' },
        { status: 404 }
      );
    }

    const currentBalance = BigInt(balance.balance);
    if (currentBalance < amountBigInt) {
      return NextResponse.json(
        { error: 'Insufficient balance' },
        { status: 400 }
      );
    }

    // Get treasury private key from environment
    const treasuryPrivateKey = process.env.TREASURY_PRIVATE_KEY;
    if (!treasuryPrivateKey) {
      console.error('Treasury private key not configured');
      return NextResponse.json(
        { error: 'Treasury not configured' },
        { status: 500 }
      );
    }

    // Setup Aptos client
    const network = isTestnet ? Network.TESTNET : Network.MAINNET;
    const config = new AptosConfig({ network });
    const aptos = new Aptos(config);

    // Create treasury account from private key
    const privateKey = new Ed25519PrivateKey(treasuryPrivateKey);
    const treasuryAccount = Account.fromPrivateKey({ privateKey });

    console.log('Treasury address:', treasuryAccount.accountAddress.toString());
    console.log('Withdrawing', amountBigInt.toString(), tokenSymbol, 'to', destinationAddress);

    // Build transfer transaction
    const transaction = await aptos.transaction.build.simple({
      sender: treasuryAccount.accountAddress,
      data: {
        function: "0x1::coin::transfer",
        typeArguments: [tokenAddress],
        functionArguments: [
          destinationAddress,
          amountBigInt.toString(),
        ],
      },
    });

    // Sign and submit
    const signedTx = await aptos.signAndSubmitTransaction({
      signer: treasuryAccount,
      transaction,
    });

    console.log('Transaction submitted:', signedTx.hash);

    // Wait for confirmation
    await aptos.waitForTransaction({ transactionHash: signedTx.hash });

    console.log('Transaction confirmed:', signedTx.hash);

    // Debit user's balance in Supabase
    const debitResult = await debitBalance({
      userId,
      amount: amountBigInt,
      tokenAddress,
      txHash: signedTx.hash,
      note: `Withdrawal to ${destinationAddress}`,
    });

    if (!debitResult.success) {
      console.error('Failed to debit balance:', debitResult.error);
      // Transaction succeeded but balance update failed
      // This should be handled by admin/monitoring
      return NextResponse.json(
        { error: 'Balance update failed after withdrawal' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      txHash: signedTx.hash,
      message: 'Withdrawal successful',
    });
  } catch (error: any) {
    console.error('Withdraw API error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * Payment recording API endpoint
 * Records incoming payments and credits user balance
 */

import { NextRequest, NextResponse } from 'next/server';
import { savePaymentAndCreditBalance } from '@/lib/supabase/payment-handler';
import { trackPaymentCompletion } from '@/lib/photon/rewards';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
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
    } = body;

    // Validate input
    if (!userId || !txHash || !stealthAddress || !payerAddress || !amount || !tokenAddress) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Convert amount to bigint
    const amountBigInt = BigInt(amount);

    // Save payment and credit balance
    const result = await savePaymentAndCreditBalance({
      userId,
      txHash,
      stealthAddress,
      payerAddress,
      amount: amountBigInt,
      tokenSymbol: tokenSymbol || 'APT',
      tokenAddress,
      decimals: decimals || 8,
      label,
      note,
      ephemeralPubkey: ephemeralPubkey || '',
    });

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to record payment' },
        { status: 500 }
      );
    }

    // Track payment completion with Photon (silently fail if tracking fails)
    if (result.paymentId) {
      try {
        // Convert amount from bigint to number for tracking
        const amountNumber = Number(amountBigInt) / Math.pow(10, decimals || 8);
        await trackPaymentCompletion(userId, result.paymentId, amountNumber, {
          tokenSymbol,
          tokenAddress,
          txHash,
          label,
        });
      } catch (error) {
        // Log error but don't fail the payment recording
        console.error('Failed to track payment completion with Photon:', error);
      }
    }

    return NextResponse.json({
      success: true,
      paymentId: result.paymentId,
      message: 'Payment recorded successfully',
    });
  } catch (error: any) {
    console.error('Payment recording error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal server error' },
      { status: 500 }
    );
  }
}

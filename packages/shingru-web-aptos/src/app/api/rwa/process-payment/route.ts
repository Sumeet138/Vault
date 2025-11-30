import { NextRequest, NextResponse } from 'next/server';
import { processRWAPurchase, isRWAAsset } from '@/lib/rwa/payment-processor';
import { getAssetById } from '@/lib/mongodb/rwa';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      userId,
      linkTag,
      transactionHash,
      amount,
    } = body;
    
    if (!userId || !linkTag || !transactionHash || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields',
        },
        { status: 400 }
      );
    }
    
    // Check if this is an RWA asset
    const isRWA = await isRWAAsset(linkTag);
    
    if (!isRWA) {
      return NextResponse.json({
        success: false,
        error: 'Not an RWA asset',
      });
    }
    
    // Get asset to get price
    const asset = await getAssetById(linkTag);
    
    if (!asset) {
      return NextResponse.json({
        success: false,
        error: 'Asset not found',
      });
    }
    
    // Calculate quantity from amount
    const amountInAPT = Number(amount) / 1e8;
    const quantity = Math.floor(amountInAPT / asset.pricePerShare);
    
    if (quantity <= 0) {
      return NextResponse.json({
        success: false,
        error: 'Amount too small to purchase any shares',
      });
    }
    
    // Process RWA purchase
    const result = await processRWAPurchase({
      userId,
      assetId: linkTag,
      quantity,
      transactionHash,
      amount: BigInt(amount),
      pricePerShare: asset.pricePerShare,
    });
    
    if (result.success) {
      return NextResponse.json({
        success: true,
        data: {
          assetId: linkTag,
          quantity,
        },
      });
    } else {
      return NextResponse.json(
        {
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Error processing RWA payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process RWA payment',
      },
      { status: 500 }
    );
  }
}


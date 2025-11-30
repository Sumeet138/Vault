import { NextRequest, NextResponse } from 'next/server';
import {
  getAssetById,
  updateAssetShares,
  addHolding,
  createTransaction,
} from '@/lib/mongodb/rwa';

/**
 * Reserve and process RWA purchase immediately when user clicks "Purchase Shares"
 * This happens before payment is completed
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      assetId,
      userId,
      quantity,
    } = body;
    
    // Validate input
    if (!assetId || !userId || !quantity) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: assetId, userId, quantity',
        },
        { status: 400 }
      );
    }
    
    if (quantity <= 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Quantity must be greater than 0',
        },
        { status: 400 }
      );
    }
    
    // Get asset details
    const asset = await getAssetById(assetId);
    if (!asset) {
      return NextResponse.json(
        {
          success: false,
          error: 'Asset not found',
        },
        { status: 404 }
      );
    }
    
    // Check availability
    if (asset.availableShares < quantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Only ${asset.availableShares} shares available, requested ${quantity}`,
        },
        { status: 400 }
      );
    }
    
    // Calculate total price
    const totalPrice = asset.pricePerShare * quantity;
    
    // Generate a temporary transaction hash (will be updated when payment completes)
    const tempTransactionHash = `pending-${Date.now()}-${userId}-${assetId}`;
    
    // Create transaction record with PENDING status
    const transactionCreated = await createTransaction({
      assetId,
      buyerUserId: userId,
      quantity,
      totalPrice,
      status: 'PENDING',
      transactionHash: tempTransactionHash,
    });
    
    if (!transactionCreated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create transaction record',
        },
        { status: 500 }
      );
    }
    
    // Update asset shares (deduct available shares)
    const sharesUpdated = await updateAssetShares(assetId, quantity);
    if (!sharesUpdated) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to update asset shares',
        },
        { status: 500 }
      );
    }
    
    // Add to user holdings immediately
    const holdingAdded = await addHolding({
      userId,
      assetId,
      quantity,
      purchasePrice: asset.pricePerShare,
      purchaseDate: new Date(),
      transactionHash: tempTransactionHash,
    });
    
    if (!holdingAdded) {
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to add holding',
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json({
      success: true,
      data: {
        assetId,
        quantity,
        totalPrice,
        transactionHash: tempTransactionHash,
        message: 'Purchase reserved successfully. Complete payment to finalize.',
      },
    });
  } catch (error) {
    console.error('Error reserving RWA purchase:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to reserve purchase',
      },
      { status: 500 }
    );
  }
}


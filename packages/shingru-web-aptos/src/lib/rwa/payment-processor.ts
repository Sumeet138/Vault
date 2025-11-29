/**
 * RWA Payment Processor
 * Handles processing RWA purchases when payments are detected
 */

import { getAssetById, updateAssetShares, addHolding, createTransaction } from '@/lib/mongodb/rwa';
import type { Asset } from '@/lib/mongodb/rwa-types';

export interface ProcessRWAPaymentParams {
  userId: string;
  assetId: string;
  quantity: number;
  transactionHash: string;
  amount: bigint; // Total amount in smallest unit (e.g., octas for APT)
  pricePerShare: number; // Expected price per share in APT
}

/**
 * Process an RWA purchase after payment is confirmed
 */
export async function processRWAPurchase(
  params: ProcessRWAPaymentParams
): Promise<{ success: boolean; error?: string }> {
  const { userId, assetId, quantity, transactionHash, amount, pricePerShare } = params;

  try {
    // Get asset details
    const asset = await getAssetById(assetId);
    if (!asset) {
      return { success: false, error: 'Asset not found' };
    }

    // Verify price matches (with small tolerance for rounding)
    const expectedTotal = asset.pricePerShare * quantity;
    const actualAmount = Number(amount) / 1e8; // Convert from octas to APT
    const priceDiff = Math.abs(actualAmount - expectedTotal);
    
    if (priceDiff > 0.01) { // Allow 0.01 APT tolerance
      console.warn(`Price mismatch for RWA purchase: expected ${expectedTotal} APT, got ${actualAmount} APT`);
      // Still process, but log the difference
    }

    // Check availability
    if (asset.availableShares < quantity) {
      return { 
        success: false, 
        error: `Only ${asset.availableShares} shares available, requested ${quantity}` 
      };
    }

    // Create transaction record
    const transactionCreated = await createTransaction({
      assetId,
      buyerUserId: userId,
      quantity,
      totalPrice: actualAmount,
      status: 'COMPLETED',
      transactionHash,
    });

    if (!transactionCreated) {
      return { success: false, error: 'Failed to create transaction record' };
    }

    // Update asset shares
    const sharesUpdated = await updateAssetShares(assetId, quantity);
    if (!sharesUpdated) {
      return { success: false, error: 'Failed to update asset shares' };
    }

    // Add to user holdings
    const holdingAdded = await addHolding({
      userId,
      assetId,
      quantity,
      purchasePrice: asset.pricePerShare,
      purchaseDate: new Date(),
      transactionHash,
    });

    if (!holdingAdded) {
      return { success: false, error: 'Failed to add holding' };
    }

    console.log(`✅ RWA purchase processed: ${quantity} shares of ${assetId} for user ${userId}`);
    return { success: true };
  } catch (error) {
    console.error('Error processing RWA purchase:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Check if a payment label/tag corresponds to an RWA asset
 */
export async function isRWAAsset(assetId: string): Promise<boolean> {
  try {
    const asset = await getAssetById(assetId);
    return asset !== null;
  } catch (error) {
    console.error('Error checking RWA asset:', error);
    return false;
  }
}

/**
 * Calculate quantity from payment amount and asset price
 */
export function calculateQuantityFromAmount(
  amount: bigint,
  pricePerShare: number
): number {
  const amountInAPT = Number(amount) / 1e8; // Convert from octas to APT
  return Math.floor(amountInAPT / pricePerShare);
}


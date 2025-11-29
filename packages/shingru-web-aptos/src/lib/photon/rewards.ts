/**
 * Photon Reward Tracking Utilities
 * 
 * Helper functions for tracking rewarded events.
 */

import { getPhotonClient } from './client';
import { PhotonCampaignEventResponse } from './types';

/**
 * Track payment link creation
 * Handles errors silently to avoid blocking user actions
 */
export async function trackPaymentLinkCreation(
  userId: string,
  linkId: string,
  metadata?: Record<string, any>
): Promise<PhotonCampaignEventResponse | null> {
  try {
    const client = getPhotonClient();
    
    if (!client.isConfigured()) {
      console.warn('Photon client not configured, skipping reward tracking');
      return null;
    }

    return await client.trackPaymentLinkCreation(userId, linkId, metadata);
  } catch (error) {
    console.error('Failed to track payment link creation:', error);
    return null;
  }
}

/**
 * Track payment completion
 * Handles errors silently to avoid blocking user actions
 */
export async function trackPaymentCompletion(
  userId: string,
  paymentId: string,
  amount: number,
  metadata?: Record<string, any>
): Promise<PhotonCampaignEventResponse | null> {
  try {
    const client = getPhotonClient();
    
    if (!client.isConfigured()) {
      console.warn('Photon client not configured, skipping reward tracking');
      return null;
    }

    return await client.trackPaymentCompletion(userId, paymentId, amount, metadata);
  } catch (error) {
    console.error('Failed to track payment completion:', error);
    return null;
  }
}

/**
 * Track generic user action
 * Handles errors silently to avoid blocking user actions
 */
export async function trackUserAction(
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<PhotonCampaignEventResponse | null> {
  try {
    const client = getPhotonClient();
    
    if (!client.isConfigured()) {
      console.warn('Photon client not configured, skipping action tracking');
      return null;
    }

    return await client.trackUserAction(userId, action, metadata);
  } catch (error) {
    console.error('Failed to track user action:', error);
    return null;
  }
}

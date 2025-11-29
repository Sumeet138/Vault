/**
 * Photon Attribution Tracking Utilities
 * 
 * Helper functions for tracking attribution events.
 */

import { getPhotonClient } from './client';
import { AttributionEvent } from './types';

/**
 * Track attribution for user actions
 * Handles errors silently to avoid blocking user functionality
 */
export async function trackAttribution(
  userId: string,
  action: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  try {
    const client = getPhotonClient();
    
    if (!client.isConfigured()) {
      console.warn('Photon client not configured, skipping attribution tracking');
      return false;
    }

    const event: AttributionEvent = {
      action,
      timestamp: Date.now(),
      userId,
      metadata,
    };

    // Use the generic user action tracking for attribution
    await client.trackUserAction(userId, action, metadata);
    
    return true;
  } catch (error) {
    console.error('Attribution tracking failed:', error);
    return false;
  }
}

/**
 * Track page view attribution
 */
export async function trackPageView(
  userId: string,
  page: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return trackAttribution(userId, 'page_view', { page, ...metadata });
}

/**
 * Track button click attribution
 */
export async function trackButtonClick(
  userId: string,
  buttonId: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return trackAttribution(userId, 'button_click', { buttonId, ...metadata });
}

/**
 * Track feature usage attribution
 */
export async function trackFeatureUsage(
  userId: string,
  feature: string,
  metadata?: Record<string, any>
): Promise<boolean> {
  return trackAttribution(userId, 'feature_usage', { feature, ...metadata });
}

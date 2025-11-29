/**
 * Hook for tracking attribution events
 * 
 * Provides convenient methods for tracking common user actions
 */

import { useCallback, useEffect } from 'react';
import { usePhoton } from '@/providers/PhotonProvider';
import { usePathname } from 'next/navigation';

export function useAttributionTracking() {
  const { trackAttribution, photonUserData } = usePhoton();
  const pathname = usePathname();

  // Track page views automatically
  useEffect(() => {
    if (photonUserData && pathname) {
      trackAttribution('page_view', { page: pathname });
    }
  }, [pathname, photonUserData, trackAttribution]);

  // Track button clicks
  const trackButtonClick = useCallback(
    (buttonId: string, metadata?: Record<string, any>) => {
      trackAttribution('button_click', { buttonId, ...metadata });
    },
    [trackAttribution]
  );

  // Track feature usage
  const trackFeatureUsage = useCallback(
    (feature: string, metadata?: Record<string, any>) => {
      trackAttribution('feature_usage', { feature, ...metadata });
    },
    [trackAttribution]
  );

  // Track link creation
  const trackLinkCreation = useCallback(
    (linkId: string, metadata?: Record<string, any>) => {
      trackAttribution('link_creation', { linkId, ...metadata });
    },
    [trackAttribution]
  );

  // Track payment initiation
  const trackPaymentInitiation = useCallback(
    (paymentId: string, metadata?: Record<string, any>) => {
      trackAttribution('payment_initiation', { paymentId, ...metadata });
    },
    [trackAttribution]
  );

  // Track wallet connection
  const trackWalletConnection = useCallback(
    (walletType: string, metadata?: Record<string, any>) => {
      trackAttribution('wallet_connection', { walletType, ...metadata });
    },
    [trackAttribution]
  );

  return {
    trackButtonClick,
    trackFeatureUsage,
    trackLinkCreation,
    trackPaymentInitiation,
    trackWalletConnection,
    trackAttribution,
  };
}

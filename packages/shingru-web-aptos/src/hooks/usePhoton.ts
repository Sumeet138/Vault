/**
 * usePhoton Hook
 * 
 * Custom hook to access Photon context and provide helper functions
 * for common Photon operations.
 */

import { usePhoton as usePhotonContext } from "@/providers/PhotonProvider";
import { useCallback } from "react";

export function usePhoton() {
  const context = usePhotonContext();

  // Helper function to track payment link creation
  const trackPaymentLinkCreation = useCallback(
    async (linkId: string, metadata?: Record<string, any>) => {
      await context.trackRewardEvent("link_created", {
        linkId,
        ...metadata,
      });
    },
    [context]
  );

  // Helper function to track payment completion
  const trackPaymentCompletion = useCallback(
    async (
      paymentId: string,
      amount: number,
      metadata?: Record<string, any>
    ) => {
      await context.trackRewardEvent("payment_completed", {
        paymentId,
        amount,
        ...metadata,
      });
    },
    [context]
  );

  // Helper function to track generic user action
  const trackUserAction = useCallback(
    async (action: string, metadata?: Record<string, any>) => {
      await context.trackAttribution(action, metadata);
    },
    [context]
  );

  // Helper function to check if Photon is ready
  const isPhotonReady = useCallback(() => {
    return context.isPhotonInitialized && !context.initializationError;
  }, [context.isPhotonInitialized, context.initializationError]);

  // Helper function to check if user is authenticated with Photon
  const isPhotonAuthenticated = useCallback(() => {
    return !!context.photonUser && !!context.photonUserData;
  }, [context.photonUser, context.photonUserData]);

  return {
    ...context,
    // Helper functions
    trackPaymentLinkCreation,
    trackPaymentCompletion,
    trackUserAction,
    isPhotonReady,
    isPhotonAuthenticated,
  };
}

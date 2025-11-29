"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useMemo,
} from "react";
import {
  PhotonClient,
  getPhotonClient,
  initializePhotonClient,
} from "@/lib/photon/client";
import {
  PhotonUser,
  PhotonWalletInfo,
  PhotonUserData,
  PhotonCampaignEventResponse,
} from "@/lib/photon/types";
import { RewardToast } from "@/components/common/RewardToast";
import { useSound, Sound } from "@/providers/SoundProvider";

interface PhotonContextType {
  isPhotonInitialized: boolean;
  photonUser: PhotonUser | null;
  photonUserData: PhotonUserData | null;
  authenticateWithPhoton: (jwtToken: string) => Promise<void>;
  trackRewardEvent: (
    eventType: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  trackAttribution: (
    action: string,
    metadata?: Record<string, any>
  ) => Promise<void>;
  getPhotonWalletInfo: () => Promise<PhotonWalletInfo | null>;
  photonClient: PhotonClient | null;
  initializationError: string | null;
}

const PhotonContext = createContext<PhotonContextType | undefined>(undefined);

interface PhotonProviderProps {
  children: ReactNode;
}

export function PhotonProvider({ children }: PhotonProviderProps) {
  const [isPhotonInitialized, setIsPhotonInitialized] = useState(false);
  const [photonUser, setPhotonUser] = useState<PhotonUser | null>(null);
  const [photonUserData, setPhotonUserData] = useState<PhotonUserData | null>(
    null
  );
  const [photonClient, setPhotonClient] = useState<PhotonClient | null>(null);
  const [initializationError, setInitializationError] = useState<string | null>(
    null
  );
  
  // Reward toast state
  const [showRewardToast, setShowRewardToast] = useState(false);
  const [rewardData, setRewardData] = useState<{
    tokenAmount: number;
    tokenSymbol: string;
    eventType: string;
  } | null>(null);
  
  const { playSound } = useSound();

  // Initialize Photon SDK on mount
  useEffect(() => {
    const initializePhoton = async () => {
      try {
        console.log("Initializing Photon SDK...");

        // Initialize the Photon client
        const client = initializePhotonClient({
          apiKey: process.env.NEXT_PUBLIC_PHOTON_API_KEY,
          baseUrl: process.env.NEXT_PUBLIC_PHOTON_BASE_URL,
          campaignId: process.env.NEXT_PUBLIC_PHOTON_CAMPAIGN_ID,
        });

        // Check if client is properly configured
        if (!client.isConfigured()) {
          const errorMsg =
            "Photon SDK not properly configured. Please check environment variables.";
          console.warn(errorMsg);
          setInitializationError(errorMsg);
          // Don't throw - allow app to continue without Photon
          setIsPhotonInitialized(false);
          return;
        }

        setPhotonClient(client);
        setIsPhotonInitialized(true);
        setInitializationError(null);
        
        if (client.isDemoMode()) {
          console.log("✅ Photon SDK initialized successfully (DEMO MODE)");
        } else {
          console.log("✅ Photon SDK initialized successfully");
        }

        // Try to restore session from localStorage
        const storedUserData = localStorage.getItem("photon-user-data");
        if (storedUserData) {
          try {
            const userData: PhotonUserData = JSON.parse(storedUserData);
            setPhotonUserData(userData);
            setPhotonUser({
              id: userData.photonId,
              name: "", // We don't store name in localStorage
              avatar: "", // We don't store avatar in localStorage
            });

            // Restore access token
            if (userData.tokens?.access_token) {
              client.setAccessToken(userData.tokens.access_token);
            }

            console.log("✅ Photon session restored from localStorage");
            
            // Track session initialization for restored sessions
            try {
              await client.trackUserAction(
                userData.photonId,
                'session_start',
                { restored: true }
              );
              console.log("✅ Session initialization tracked");
            } catch (error) {
              console.error("Error tracking session initialization:", error);
              // Don't throw - tracking failures should not block functionality
            }
          } catch (error) {
            console.error("Error restoring Photon session:", error);
            // Clear invalid data
            localStorage.removeItem("photon-user-data");
          }
        }
      } catch (error) {
        const errorMsg =
          error instanceof Error
            ? error.message
            : "Failed to initialize Photon SDK";
        console.error("Photon SDK initialization error:", error);
        setInitializationError(errorMsg);
        setIsPhotonInitialized(false);
        // Don't throw - allow app to continue without Photon
      }
    };

    initializePhoton();
  }, []);

  // Authenticate with Photon using JWT
  const authenticateWithPhoton = useCallback(
    async (jwtToken: string) => {
      if (!photonClient) {
        throw new Error("Photon client not initialized");
      }

      try {
        console.log("Authenticating with Photon...");

        const response = await photonClient.register(jwtToken);

        if (response.success && response.data) {
          const { user, tokens, wallet } = response.data;

          // Store user data
          setPhotonUser(user.user);

          // Create and store user data with tokens
          const userData: PhotonUserData = {
            photonId: user.user.id,
            walletAddress: wallet.walletAddress,
            createdAt: new Date().toISOString(),
            lastSeen: new Date().toISOString(),
            tokens: tokens,
          };

          setPhotonUserData(userData);

          // Persist to localStorage
          localStorage.setItem("photon-user-data", JSON.stringify(userData));

          console.log("✅ Photon authentication successful");
          
          // Track session initialization for new authentications
          try {
            await photonClient.trackUserAction(
              userData.photonId,
              'session_start',
              { newUser: true }
            );
            console.log("✅ Session initialization tracked");
          } catch (error) {
            console.error("Error tracking session initialization:", error);
            // Don't throw - tracking failures should not block functionality
          }
        } else {
          throw new Error("Photon authentication failed");
        }
      } catch (error) {
        console.error("Photon authentication error:", error);
        throw error;
      }
    },
    [photonClient]
  );

  // Track reward event
  const trackRewardEvent = useCallback(
    async (eventType: string, metadata?: Record<string, any>) => {
      if (!photonClient || !photonUserData) {
        console.warn("Photon not initialized or user not authenticated");
        return;
      }

      try {
        const eventId = `${eventType}-${Date.now()}`;
        const response: PhotonCampaignEventResponse = await photonClient.trackCampaignEvent(
          eventId,
          eventType,
          photonUserData.photonId,
          metadata
        );
        console.log(`✅ Reward event tracked: ${eventType}`);
        
        // Show reward confirmation if tokens were earned
        if (response.success && response.data.token_amount > 0) {
          // In demo mode, update the stored balance
          if (photonClient.isDemoMode()) {
            const currentBalance = await photonClient.getWalletBalance(photonUserData.photonId);
            const newBalance = currentBalance + response.data.token_amount;
            localStorage.setItem(`photon_demo_balance_${photonUserData.photonId}`, newBalance.toString());
            
            // Add to recent rewards
            const storedRewards = localStorage.getItem(`photon_demo_rewards_${photonUserData.photonId}`);
            const rewards = storedRewards ? JSON.parse(storedRewards) : [];
            rewards.unshift({
              event_type: eventType,
              timestamp: new Date().toISOString(),
              token_amount: response.data.token_amount,
              metadata: metadata || {},
            });
            // Keep only last 10 rewards
            localStorage.setItem(`photon_demo_rewards_${photonUserData.photonId}`, JSON.stringify(rewards.slice(0, 10)));
          }
          
          setRewardData({
            tokenAmount: response.data.token_amount,
            tokenSymbol: response.data.token_symbol,
            eventType,
          });
          setShowRewardToast(true);
          
          // Play success sound
          try {
            playSound(Sound.SUCCESS_POP);
          } catch (error) {
            console.error("Error playing reward sound:", error);
          }
        }
      } catch (error) {
        // Log error but don't throw - tracking failures should not block user actions
        console.error("Error tracking reward event:", error);
      }
    },
    [photonClient, photonUserData, playSound]
  );

  // Track attribution
  const trackAttribution = useCallback(
    async (action: string, metadata?: Record<string, any>) => {
      if (!photonClient || !photonUserData) {
        console.warn("Photon not initialized or user not authenticated");
        return;
      }

      try {
        await photonClient.trackUserAction(
          photonUserData.photonId,
          action,
          metadata
        );
        console.log(`✅ Attribution tracked: ${action}`);
      } catch (error) {
        // Log error but don't throw - tracking failures should not block user actions
        console.error("Error tracking attribution:", error);
      }
    },
    [photonClient, photonUserData]
  );

  // Get Photon wallet info
  const getPhotonWalletInfo = useCallback(async (): Promise<PhotonWalletInfo | null> => {
    if (!photonUserData || !photonClient) {
      console.warn("Photon user not authenticated or client not initialized");
      return null;
    }

    try {
      console.log("Fetching Photon wallet info...");
      
      // Fetch balance and recent rewards from Photon API
      const [balance, recentRewardsData] = await Promise.all([
        photonClient.getWalletBalance(photonUserData.photonId),
        photonClient.getRecentRewards(photonUserData.photonId, 5),
      ]);

      // Transform recent rewards data to match our interface
      const recentRewards = recentRewardsData.map((reward: any) => ({
        eventType: reward.event_type || 'CUSTOM',
        timestamp: reward.timestamp ? new Date(reward.timestamp).getTime() : Date.now(),
        patEarned: reward.token_amount || 0,
        metadata: reward.metadata || {},
      }));

      const walletInfo: PhotonWalletInfo = {
        address: photonUserData.walletAddress,
        balance: balance,
        recentRewards: recentRewards,
      };

      console.log("✅ Photon wallet info fetched successfully");
      return walletInfo;
    } catch (error) {
      console.error("Error fetching Photon wallet info:", error);
      // Return basic info on error to gracefully degrade
      return {
        address: photonUserData.walletAddress,
        balance: 0,
        recentRewards: [],
      };
    }
  }, [photonUserData, photonClient]);

  const value: PhotonContextType = useMemo(
    () => ({
      isPhotonInitialized,
      photonUser,
      photonUserData,
      authenticateWithPhoton,
      trackRewardEvent,
      trackAttribution,
      getPhotonWalletInfo,
      photonClient,
      initializationError,
    }),
    [
      isPhotonInitialized,
      photonUser,
      photonUserData,
      authenticateWithPhoton,
      trackRewardEvent,
      trackAttribution,
      getPhotonWalletInfo,
      photonClient,
      initializationError,
    ]
  );

  return (
    <PhotonContext.Provider value={value}>
      {children}
      {rewardData && (
        <RewardToast
          isOpen={showRewardToast}
          onClose={() => setShowRewardToast(false)}
          tokenAmount={rewardData.tokenAmount}
          tokenSymbol={rewardData.tokenSymbol}
          eventType={rewardData.eventType}
        />
      )}
    </PhotonContext.Provider>
  );
}

export function usePhoton(): PhotonContextType {
  const context = useContext(PhotonContext);
  if (context === undefined) {
    throw new Error("usePhoton must be used within a PhotonProvider");
  }
  return context;
}

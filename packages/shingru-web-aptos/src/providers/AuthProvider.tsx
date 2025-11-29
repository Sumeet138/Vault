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
import { useLocalStorage } from "usehooks-ts";
import {
  SUPPORTED_CHAINS,
  type SupportedChain,
} from "@/config/chains";
import { SecureMetaKeyStorage } from "@/lib/@shingru/core/secure-meta-keys-storage";
import dynamic from "next/dynamic";
import FullscreenLoader from "@/components/common/FullscreenLoader";
import { getUserByWallet, createUser } from "@/lib/supabase/users";

// Simple types for backend-less operation
export interface Wallet {
  address: string;
  chain: string;
}

export interface UserProfile {
  id: string;
  username: string | null;
  profileImage: {
    type: string;
    data: {
      emoji?: string;
      backgroundColor?: string;
    };
  } | null;
}

// Dynamically import MetaKeysProvider to avoid SSR issues
const DynamicMetaKeysProvider = dynamic(
  () =>
    import("@/providers/MetaKeysProvider").then((mod) => mod.MetaKeysProvider),
  {
    ssr: false,
    loading: () => <FullscreenLoader text="Just a moment" />,
  }
);

interface AuthContextType {
  // Chain selection
  selectedChain: SupportedChain;
  setSelectedChain: (chain: SupportedChain) => void;

  // Auth state
  isSignedIn: boolean;
  isSigningIn: boolean;
  backendToken: string | null;
  accessToken: string | null; // Alias for backendToken
  wallets: Wallet[];
  me: UserProfile | null;
  authMethod: 'PETRA' | 'PHOTON' | null;
  photonUser: any | null; // Photon user data

  // Actions
  disconnect: () => void;
  fetchMe: () => Promise<void>;
  updateMeProfile: (profile: Partial<UserProfile>) => void;

  // Aptos wallet authentication
  authenticateWithAptos: (walletAddress: string) => Promise<void>;
  
  // Photon authentication
  authenticateWithPhoton: () => Promise<void>;

  availableChains: SupportedChain[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  // Simplified state - only what we really need
  const [selectedChain, setSelectedChain] = useState<SupportedChain>(
    SUPPORTED_CHAINS.APTOS
  );
  const [backendToken, setBackendToken] = useLocalStorage<string | null>(
    "shingru-access-token",
    null
  );
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [me, setMe] = useState<UserProfile | null>(null);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);
  const [authMethod, setAuthMethod] = useLocalStorage<'PETRA' | 'PHOTON' | null>(
    "shingru-auth-method",
    null
  );
  const [photonUser, setPhotonUser] = useState<any | null>(null);

  const availableChains = useMemo(() => {
    return [SUPPORTED_CHAINS.APTOS];
  }, []);

  const isSignedIn = !!backendToken && !!me;

  // Disconnect function - simplified with hard redirect
  const disconnect = useCallback(async () => {
    try {
      // Clear all state immediately
      setBackendToken(null);
      setAuthMethod(null);
      setWallets([]);
      setMe(null);
      setPhotonUser(null);
      setIsSigningIn(false);

      // Clear meta keys
      SecureMetaKeyStorage.clearMetaKeys();

      // Clear onboarding data
      const keys = Object.keys(localStorage);
      keys.forEach((key) => {
        if (key.startsWith("shingru-onboarding-state")) {
          localStorage.removeItem(key);
        }
        // Also clear PIN step refresh flag
        if (key === "shingru-pin-step-refreshed") {
          localStorage.removeItem(key);
        }
        // Clear Photon data
        if (key === "shingru-photon-user" || key === "photon-user-data") {
          localStorage.removeItem(key);
        }
      });

      // Use hard redirect to completely reset the app state
      window.location.href = "/login";
    } catch (error) {
      console.error("Disconnect error:", error);
      // Even on error, force hard redirect to login
      window.location.href = "/login";
    }
  }, [setBackendToken, setAuthMethod]);

  // Fetch user profile from Supabase
  const fetchMe = useCallback(async () => {
    if (!backendToken) {
      console.log("fetchMe: No backend token, skipping");
      return;
    }

    if (!wallets.length) {
      console.log("fetchMe: No wallets, skipping");
      return;
    }

    try {
      // Get user from Supabase using wallet address
      const aptosWallet = wallets.find((w) => w.chain === "APTOS");
      if (!aptosWallet) {
        console.log("fetchMe: No Aptos wallet found");
        return;
      }

      console.log("fetchMe: Fetching user from Supabase for wallet:", aptosWallet.address);
      console.log("fetchMe: Normalized wallet address:", aptosWallet.address.toLowerCase());
      const user = await getUserByWallet(aptosWallet.address, "APTOS");
      
      if (user) {
        console.log("✅ fetchMe: User found in Supabase:", user.id);
        console.log("✅ fetchMe: User data:", user);
        const profile: UserProfile = {
          id: user.id,
          username: user.username,
          profileImage: user.profile_image_type && user.profile_image_data ? {
            type: user.profile_image_type,
            data: user.profile_image_data,
          } : null,
        };
        setMe(profile);
        // Store in local storage for backward compatibility
        localStorage.setItem("shingru-user-profile", JSON.stringify(profile));
        console.log("✅ fetchMe: Profile set successfully");
      } else {
        console.warn("❌ fetchMe: User NOT found in Supabase!");
        console.warn("❌ Searched for wallet:", aptosWallet.address.toLowerCase());
        console.warn("❌ Chain:", "APTOS");
        
        // Fallback to local storage if user not found
        const storedProfile = localStorage.getItem("shingru-user-profile");
        if (storedProfile) {
          const profile = JSON.parse(storedProfile);
          setMe(profile);
          console.log("⚠️ fetchMe: Profile loaded from local storage (FALLBACK)");
        } else {
          console.error("❌ fetchMe: No profile found in Supabase or local storage");
          console.error("❌ This will trigger onboarding flow");
        }
      }
    } catch (error) {
      console.error("Error fetching user profile:", error);
      // Don't redirect on error, just log it
      // The user might still be able to use the app with local storage data
    }
  }, [backendToken, wallets]);

  // Update me profile directly (for immediate state updates)
  const updateMeProfile = useCallback((profile: Partial<UserProfile>) => {
    if (!me) return;
    
    const updatedProfile: UserProfile = {
      ...me,
      ...profile,
    };
    
    setMe(updatedProfile);
    localStorage.setItem("shingru-user-profile", JSON.stringify(updatedProfile));
    console.log("✅ Me profile updated:", updatedProfile);
  }, [me]);

  // Safety: Reset isSigningIn if it's stuck for too long (10 seconds)
  useEffect(() => {
    if (isSigningIn) {
      const timeout = setTimeout(() => {
        console.warn("⚠️ isSigningIn stuck, resetting to false");
        setIsSigningIn(false);
      }, 10000); // 10 second timeout

      return () => clearTimeout(timeout);
    }
  }, [isSigningIn]);

  // Load wallets from localStorage on mount
  useEffect(() => {
    if (!wallets.length && backendToken) {
      const storedWallets = localStorage.getItem("shingru-wallets");
      if (storedWallets) {
        try {
          const parsed = JSON.parse(storedWallets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("Loading wallets from localStorage:", parsed);
            setWallets(parsed);
          }
        } catch (error) {
          console.error("Error loading wallets from localStorage:", error);
        }
      }
    }
  }, [wallets.length, backendToken]);

  // Auto-fetch profile when we have token and wallets but no user
  useEffect(() => {
    if (backendToken && wallets.length > 0 && !me && !isSigningIn) {
      console.log("🔄 Auto-fetching user profile");
      fetchMe();
    }
  }, [backendToken, wallets, me, isSigningIn, fetchMe]);

  // Load wallets and profile from localStorage on mount
  useEffect(() => {
    if (backendToken && !wallets.length) {
      const storedWallets = localStorage.getItem("shingru-wallets");
      if (storedWallets) {
        try {
          const parsed = JSON.parse(storedWallets);
          if (Array.isArray(parsed) && parsed.length > 0) {
            console.log("Loading wallets from localStorage:", parsed);
            setWallets(parsed);
          }
        } catch (error) {
          console.error("Error loading wallets from localStorage:", error);
        }
      }
    }

    // Also load profile from localStorage if available
    if (backendToken && !me) {
      const storedProfile = localStorage.getItem("shingru-user-profile");
      if (storedProfile) {
        try {
          const profile = JSON.parse(storedProfile);
          console.log("Loading profile from localStorage:", profile);
          setMe(profile);
        } catch (error) {
          console.error("Error loading profile from localStorage:", error);
        }
      }
    }

    // Load Photon user data if auth method is Photon
    if (authMethod === 'PHOTON' && !photonUser) {
      const storedPhotonUser = localStorage.getItem("shingru-photon-user");
      if (storedPhotonUser) {
        try {
          const parsed = JSON.parse(storedPhotonUser);
          console.log("Loading Photon user from localStorage:", parsed);
          setPhotonUser(parsed);
        } catch (error) {
          console.error("Error loading Photon user from localStorage:", error);
        }
      }
    }
  }, [backendToken, wallets.length, me, authMethod, photonUser]);

  // Mark as hydrated after first render to prevent hydration mismatches
  useEffect(() => {
    setIsHydrated(true);
  }, []);

  // Aptos wallet authentication with Supabase
  const authenticateWithAptos = useCallback(
    async (walletAddress: string) => {
      setIsSigningIn(true);
      try {
        console.log("Starting Aptos wallet authentication");

        if (!walletAddress) {
          throw new Error("No wallet address provided");
        }

        console.log("Wallet address:", walletAddress);

        // Check if user exists in Supabase
        let user = await getUserByWallet(walletAddress, "APTOS");
        
        if (!user) {
          // Create new user in Supabase
          console.log("Creating new user in Supabase...");
          user = await createUser({
            wallet_address: walletAddress,
            chain: "APTOS",
          });
          
          if (!user) {
            throw new Error("Failed to create user in Supabase");
          }
        }

        // Generate a token (use user ID from Supabase)
        const token = `aptos_${user.id}_${Date.now()}`;
        
        // Create wallet object
        const wallet: Wallet = {
          address: walletAddress,
          chain: "APTOS",
        };

        // Set auth data
        setBackendToken(token);
        setAuthMethod('PETRA');
        setWallets([wallet]);
        // Store wallets in localStorage
        localStorage.setItem("shingru-wallets", JSON.stringify([wallet]));

        // Create user profile from Supabase data (use fresh data from Supabase)
        // This ensures we have the latest username from database
        const userProfile: UserProfile = {
          id: user.id,
          username: user.username, // This will be null if not set, or the actual username if set
          profileImage: user.profile_image_type && user.profile_image_data ? {
            type: user.profile_image_type,
            data: user.profile_image_data,
          } : null,
        };
        
        // Store in local storage for backward compatibility
        localStorage.setItem("shingru-user-profile", JSON.stringify(userProfile));
        setMe(userProfile);

        // Fetch fresh data from Supabase after wallets are set
        // This ensures we have the absolute latest data
        // Use setTimeout to ensure wallets state is updated first
        setTimeout(async () => {
          try {
            // Only fetch if we have wallets (should be set by now)
            if (wallets.length > 0 || localStorage.getItem("shingru-wallets")) {
              await fetchMe();
            }
          } catch (error) {
            console.error("Error fetching user profile after auth:", error);
          }
        }, 100);

        console.log("✅ Aptos authentication complete");
      } catch (error) {
        console.error("Aptos authentication error:", error);
        throw error;
      } finally {
        setIsSigningIn(false);
      }
    },
    [setBackendToken, setAuthMethod]
  );

  // Photon authentication
  const authenticateWithPhoton = useCallback(async () => {
    setIsSigningIn(true);
    try {
      console.log("Starting Photon authentication");

      // Generate a simple JWT token
      // In production, this would come from your auth backend
      const jwtToken = `photon_jwt_${Date.now()}`;
      
      // Get the Photon client from window (it's initialized in PhotonProvider)
      // We need to access it through the global photon client instance
      const { getPhotonClient } = await import("@/lib/photon/client");
      const photonClient = getPhotonClient();
      
      // Register with Photon
      const response = await photonClient.register(jwtToken);
      
      if (!response.success || !response.data) {
        throw new Error("Photon registration failed");
      }
      
      const { user, tokens, wallet } = response.data;
      const photonUserId = user.user.id;
      const photonWalletAddress = wallet.walletAddress;
      
      // Check if user exists in Supabase with Photon wallet
      let dbUser = await getUserByWallet(photonWalletAddress, "PHOTON");
      
      if (!dbUser) {
        // Create new user in Supabase for Photon
        console.log("Creating new Photon user in Supabase...");
        dbUser = await createUser({
          wallet_address: photonWalletAddress,
          chain: "PHOTON",
        });
        
        if (!dbUser) {
          throw new Error("Failed to create Photon user in Supabase");
        }
      }

      // Generate a token
      const token = `photon_${dbUser.id}_${Date.now()}`;
      
      // Create wallet object
      const walletObj: Wallet = {
        address: photonWalletAddress,
        chain: "PHOTON",
      };

      // Set auth data
      setBackendToken(token);
      setAuthMethod('PHOTON');
      setWallets([walletObj]);
      setPhotonUser({ id: photonUserId, walletAddress: photonWalletAddress });
      
      // Store in localStorage
      localStorage.setItem("shingru-wallets", JSON.stringify([walletObj]));
      localStorage.setItem("shingru-photon-user", JSON.stringify({ id: photonUserId, walletAddress: photonWalletAddress }));

      // Store Photon user data for PhotonProvider
      const photonUserData = {
        photonId: photonUserId,
        walletAddress: photonWalletAddress,
        createdAt: new Date().toISOString(),
        lastSeen: new Date().toISOString(),
        tokens: tokens,
      };
      localStorage.setItem("photon-user-data", JSON.stringify(photonUserData));

      // Create user profile
      const userProfile: UserProfile = {
        id: dbUser.id,
        username: dbUser.username,
        profileImage: dbUser.profile_image_type && dbUser.profile_image_data ? {
          type: dbUser.profile_image_type,
          data: dbUser.profile_image_data,
        } : null,
      };
      
      localStorage.setItem("shingru-user-profile", JSON.stringify(userProfile));
      setMe(userProfile);

      console.log("✅ Photon authentication complete");
    } catch (error) {
      console.error("Photon authentication error:", error);
      throw error;
    } finally {
      setIsSigningIn(false);
    }
  }, [setBackendToken, setAuthMethod]);

  // Auto-authenticate if wallet is connected and we have stored token/wallet
  useEffect(() => {
    if (!isHydrated || isSigningIn || backendToken) return;

    const autoAuthenticate = async () => {
      // Check if we have stored token and wallet
      const storedToken = localStorage.getItem("shingru-access-token");
      const storedWallets = localStorage.getItem("shingru-wallets");
      
      if (!storedToken || !storedWallets) {
        return; // No stored auth data
      }

      try {
        const parsedWallets = JSON.parse(storedWallets);
        const aptosWallet = parsedWallets.find((w: any) => w.chain === "APTOS");
        if (!aptosWallet) {
          return; // No Aptos wallet stored
        }

        // Check if Petra wallet is connected
        if (typeof window === "undefined") return;
        const petra = (window as any).aptos;
        if (!petra) {
          return; // No wallet extension
        }

        try {
          const account = await petra.account();
          if (account?.address) {
            const connectedAddress = account.address.toLowerCase();
            const storedAddress = aptosWallet.address.toLowerCase();
            
            // If connected wallet matches stored wallet, auto-authenticate
            if (connectedAddress === storedAddress) {
              console.log("🔄 Auto-authenticating with connected wallet:", connectedAddress);
              await authenticateWithAptos(connectedAddress);
            }
          }
        } catch (error) {
          // Wallet not connected or error, skip auto-auth
          console.log("Wallet not connected, skipping auto-auth");
        }
      } catch (error) {
        console.error("Error in auto-authenticate:", error);
      }
    };

    autoAuthenticate();
  }, [isHydrated, isSigningIn, backendToken, authenticateWithAptos]);

  const value: AuthContextType = {
    selectedChain,
    setSelectedChain,
    isSignedIn,
    isSigningIn,
    backendToken,
    accessToken: backendToken,
    wallets,
    me,
    authMethod,
    photonUser,
    disconnect,
    fetchMe,
    updateMeProfile,
    availableChains,
    authenticateWithAptos,
    authenticateWithPhoton,
  };

  // Show consistent loading state during hydration to prevent SSR mismatches
  if (!isHydrated) {
    return (
      <AuthContext.Provider value={value}>
        <FullscreenLoader text="Just a moment" />
      </AuthContext.Provider>
    );
  }

  // Determine what to render based on auth state
  const renderContent = () => {
    if (isSignedIn && me) {
      // User is fully authenticated with profile loaded
      return <DynamicMetaKeysProvider>{children}</DynamicMetaKeysProvider>;
    }

    if (backendToken && !me && !isSigningIn) {
      // Have token but profile not loaded yet - auto-fetch will handle this
      return <FullscreenLoader text="Loading your profile" />;
    }

    if (!backendToken && !isSigningIn) {
      // No token, not signing in - show login/public pages
      return children;
    }

    return <FullscreenLoader text="Just a moment" />;
  };

  return (
    <AuthContext.Provider value={value}>{renderContent()}</AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

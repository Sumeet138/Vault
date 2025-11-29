"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { useIsMounted } from "@/hooks/use-is-mounted";
import { isTestnet } from "@/config/chains";

/* --------------------------------- Aptos ---------------------------------- */
import { AptosWalletProvider } from "./AptosWalletProvider";

import { COLOR_PICKS } from "@/config/styling";

// Backend-less types
interface AddressResponse {
  chains?: Record<string, any>;
  linkData?: any;
  userData?: any;
  supportedChains?: string[];
}

// Types
interface CollectInfoFormData {
  name: string;
  email: string;
  telegram: string;
}

// Context Types
interface PayContextType {
  // Address data
  addressData: any;
  isInitializing: boolean;
  error: string | null;

  // Chain selection
  selectedChain: string | null;
  availableChains: string[];
  setSelectedChain: (chain: string) => void;

  // UI state
  currentColor: string;
  enableColorRotation: boolean;
  setEnableColorRotation: (value: boolean) => void;

  // Wallet
  wallet: {
    connected: boolean;
    connecting: boolean;
    publicKey: string | null;
    address: string | null;
    chain: string | null;
    disconnect: () => void;
  };
  refreshWallet: () => Promise<void>;
  isWalletModalOpen: boolean;
  setIsWalletModalOpen: (value: boolean) => void;
  handleOpenWalletModal: () => void;

  // Payment data
  amount: string;
  setAmount: (value: string) => void;
  paymentNote: string;
  setPaymentNote: (value: string) => void;
  selectedToken: any;
  setSelectedToken: (token: any) => void;
  collectInfoData: CollectInfoFormData;
  setCollectInfoData: (data: CollectInfoFormData) => void;

  // Payment flow
  paymentSuccess: any;
  setPaymentSuccess: (details: any) => void;
  resetForNewPayment: () => void;
  submitPaymentInfoAndGetId: () => Promise<string | undefined>;
}

const PayContext = createContext<PayContextType | null>(null);

export function usePay() {
  const context = useContext(PayContext);
  if (!context) {
    throw new Error("usePay must be used within a PayProvider");
  }
  return context;
}

// Internal Pay Context Provider (wrapped by wallet providers)
function PayContextProvider({
  children,
  username,
  tag,
  initialData,
}: {
  children: React.ReactNode;
  username: string;
  tag: string;
  initialData?: AddressResponse | null;
}) {
  const isMounted = useIsMounted();

  // Address data
  const [addressData, setAddressData] = useState<any>(initialData || null);
  const [isInitializing, setIsInitializing] = useState(!initialData);
  const [error, setError] = useState<string | null>(null);

  // Fetch user data from Supabase if initialData is not provided (backend-less mode)
  useEffect(() => {
    if (initialData || !username) return;

    const fetchUserData = async () => {
      try {
        setIsInitializing(true);
        console.log("🔍 Fetching user data from Supabase for username:", username);
        
        // Import Supabase client dynamically
        const { supabase } = await import("@/lib/supabase/client");
        
        // Fetch user by username
        const { data: userData, error: userError } = await supabase
          .from("users")
          .select("*")
          .eq("username", username)
          .maybeSingle();

        console.log("👤 User query result:", { userData, userError });

        if (userError || !userData) {
          console.error("❌ User not found:", userError);
          setError("User not found");
          setIsInitializing(false);
          return;
        }

        // Fetch user's wallet with meta keys
        const { data: walletData, error: walletError } = await supabase
          .from("wallets")
          .select("*")
          .eq("user_id", userData.id)
          .eq("chain", "APTOS")
          .maybeSingle();

        console.log("💳 Wallet query result:", { walletData, walletError });

        // Handle case where wallet doesn't exist yet (new user)
        if (walletError || !walletData) {
          console.warn("⚠️ Wallet not found for user:", userData.id);
          console.warn("⚠️ This user may not have completed onboarding yet");
          
          // Construct addressData without meta keys (user needs to complete onboarding)
          const profileImageData = userData.profile_image_data || {
            emoji: "👻",
            backgroundColor: "blue",
          };

          if (!profileImageData.backgroundColor) {
            profileImageData.backgroundColor = "blue";
          }

          const constructedData = {
            userData: {
              username: userData.username,
              profileImageType: userData.profile_image_type || "emoji",
              profileImageData,
            },
            linkData: null,
            supportedChains: ["APTOS"],
            chains: {
              APTOS: {
                amount: null,
                mint: null,
                chainAmount: null,
                metaSpendPub: null, // No meta keys yet
                metaViewPub: null, // No meta keys yet
                isEnabled: false, // Disabled until wallet is set up
              },
            },
          };

          console.log("✅ Address data constructed (without wallet):", constructedData);
          setAddressData(constructedData);
          // Don't set error - let the page load and show a warning in the UI instead
          // The payment button will show an appropriate error when clicked
          setError(null);
          setIsInitializing(false);
          return;
        }

        // Construct addressData in the expected format
        const profileImageData = userData.profile_image_data || {
          emoji: "👻",
          backgroundColor: "blue",
        };

        // Ensure backgroundColor is valid
        if (!profileImageData.backgroundColor) {
          profileImageData.backgroundColor = "blue";
        }

        const constructedData = {
          userData: {
            username: userData.username,
            profileImageType: userData.profile_image_type || "emoji",
            profileImageData,
          },
          linkData: null, // No link data in backend-less mode
          supportedChains: ["APTOS"],
          chains: {
            APTOS: {
              amount: null,
              mint: null,
              chainAmount: null,
              metaSpendPub: walletData.meta_spend_pub,
              metaViewPub: walletData.meta_view_pub,
              isEnabled: true,
            },
          },
        };

        console.log("✅ Address data constructed:", constructedData);
        setAddressData(constructedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching user data:", err);
        setError("Failed to load user data");
      } finally {
        setIsInitializing(false);
      }
    };

    fetchUserData();
  }, [initialData, username]);

  const globallyAvailableChains = useMemo(() => {
    const chainsStr = process.env.NEXT_PUBLIC_AVAILABLE_CHAINS || "APTOS";
    return chainsStr.split(",").map((chain) => chain.trim().toUpperCase());
  }, []);

  // Chain selection
  const [selectedChain, setSelectedChain] = useState<string | null>(null);
  const [availableChains, setAvailableChains] = useState<string[]>([]);

  // UI state
  const [currentColor, setCurrentColor] = useState<string>("blue"); // Default color
  const [enableColorRotation, setEnableColorRotation] = useState(false); // Easy toggle for debugging

  // Color rotation for debugging (disabled by default)
  useEffect(() => {
    if (!enableColorRotation) return;

    const interval = setInterval(() => {
      setCurrentColor((prevColor) => {
        const currentIndex = COLOR_PICKS.findIndex((c) => c.id === prevColor);
        const nextIndex = (currentIndex + 1) % COLOR_PICKS.length;
        return COLOR_PICKS[nextIndex].id;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [enableColorRotation]);

  // Set color from API response when addressData is loaded
  useEffect(() => {
    if (addressData?.linkData?.backgroundColor) {
      const color = addressData.linkData.backgroundColor;
      // Verify color exists in COLOR_PICKS
      const colorExists = COLOR_PICKS.find((c) => c.id === color);
      if (colorExists) {
        setCurrentColor(color);
      } else {
        console.warn(`Color ${color} not found in COLOR_PICKS, using default`);
        setCurrentColor("blue");
      }
    } else if (addressData?.userData?.profileImageData?.backgroundColor) {
      // Fallback to user's profile color if link doesn't have one
      const color = addressData.userData.profileImageData.backgroundColor;
      const colorExists = COLOR_PICKS.find((c) => c.id === color);
      if (colorExists) {
        setCurrentColor(color);
      } else {
        console.warn(`Color ${color} not found in COLOR_PICKS, using default`);
        setCurrentColor("blue");
      }
    }
  }, [addressData]);

  // Wallet modal state
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  // Payment data
  const [amount, setAmount] = useState("");
  const [paymentNote, setPaymentNote] = useState("");
  const [selectedToken, setSelectedToken] = useState<any>(null);
  const [paymentSuccess, setPaymentSuccess] = useState<any>(null);
  const [collectInfoData, setCollectInfoData] = useState<CollectInfoFormData>({
    name: "",
    email: "",
    telegram: "",
  });

  const handleSetCollectInfoData = useCallback((data: CollectInfoFormData) => {
    setCollectInfoData(data);
  }, []);

  // Backend-less: Generate a local payment ID
  const submitPaymentInfoAndGetId = async (): Promise<string | undefined> => {
    const paymentData = [];
    if (paymentNote) {
      paymentData.push({
        type: "note",
        value: paymentNote,
      });
    }

    for (const [key, value] of Object.entries(collectInfoData)) {
      if (value) {
        paymentData.push({
          type: key,
          value: value as string,
        });
      }
    }

    if (paymentData.length === 0) {
      return undefined;
    }

    // Generate a local payment ID (backend-less)
    const paymentId = `local_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    return paymentId;
  };

  // Get Aptos wallet from window
  const getAptosWallet = useCallback(() => {
    if (typeof window === "undefined") return null;
    return (window as any).aptos;
  }, []);

  const [aptosAccount, setAptosAccount] = useState<string | null>(null);

  // Check wallet connection
  const checkWallet = useCallback(async () => {
    if (!isMounted) return;

    const wallet = getAptosWallet();
    if (wallet) {
      try {
        const account = await wallet.account();
        if (account) {
          setAptosAccount(account.address);
        } else {
          setAptosAccount(null);
        }
      } catch (error) {
        setAptosAccount(null);
      }
    } else {
      setAptosAccount(null);
    }
  }, [isMounted, getAptosWallet]);

  useEffect(() => {
    if (!isMounted) return;

    checkWallet();
    
    // Listen for wallet changes
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, [isMounted, checkWallet]);

  const refreshWallet = useCallback(async () => {
    await checkWallet();
  }, [checkWallet]);

  const handleDisconnect = useCallback(async () => {
    try {
      console.log("Disconnecting wallet...");
      const wallet = getAptosWallet();
      if (wallet) {
        await wallet.disconnect();
      }
      setAptosAccount(null);
      console.log("Wallet disconnected successfully");
    } catch (error) {
      console.error("Error disconnecting wallet:", error);
    }
  }, [getAptosWallet]);

  const wallet = useMemo(() => {
    if (!isMounted) {
      return {
        connected: false,
        connecting: false,
        publicKey: null,
        address: null,
        chain: null,
        disconnect: handleDisconnect,
      };
    }

    return {
      connected: !!aptosAccount,
      connecting: false,
      publicKey: aptosAccount,
      address: aptosAccount,
      chain: "APTOS",
      disconnect: handleDisconnect,
    };
  }, [
    isMounted,
    aptosAccount,
    handleDisconnect,
  ]);

  const handleOpenWalletModal = () => {
    if (!isMounted) return;
    setIsWalletModalOpen(true);
  };

  // Reset function for new payment
  const resetForNewPayment = useCallback(() => {
    setPaymentSuccess(null);
    setPaymentNote("");
    setCollectInfoData({
      name: "",
      email: "",
      telegram: "",
    });

    const isFixed = addressData?.linkData?.amountType === "FIXED";
    if (!isFixed) {
      setAmount("");
      setSelectedToken(null);
    }
  }, [addressData]);

  useEffect(() => {
    if (!addressData) return;

    const isFixed = addressData.linkData?.amountType === "FIXED";

    if (
      isFixed &&
      selectedChain &&
      addressData.chains[selectedChain]
    ) {
      const chainData = addressData.chains[selectedChain];
      setAmount(chainData.amount.toString());
      if (chainData.mint) {
        setSelectedToken({
          symbol: chainData.mint.symbol,
          decimals: chainData.mint.decimals,
          isNative: chainData.mint.isNative,
          address: chainData.mint.mintAddress,
        });
      }
    } else if (!isFixed) {
      setAmount("");
      setSelectedToken(null);
    }

    setPaymentNote("");
    setCollectInfoData({
      name: "",
      email: "",
      telegram: "",
    });
  }, [addressData, selectedChain]);

  // Backend-less: Load address data from initialData or create mock data
  useEffect(() => {
    let mounted = true;

    const loadAddressData = async () => {
      setIsInitializing(true);
      setError(null);

      try {
        // Use initialData if provided, otherwise create mock data for backend-less operation
        if (initialData) {
          if (!mounted) return;
          setAddressData(initialData);
          
          // Set available chains
          if (initialData.supportedChains) {
            const filteredChains = initialData.supportedChains.filter((chain: string) =>
              globallyAvailableChains.some((globalChain: string) =>
                chain.toUpperCase().includes(globalChain.toUpperCase())
              )
            );
            setAvailableChains(filteredChains);
            // Auto-select Aptos first if available
            if (filteredChains.length > 0) {
              const aptosChain = filteredChains.find((chain: string) =>
                chain.includes("APTOS")
              );
              setSelectedChain(aptosChain || filteredChains[0]);
            }
          } else {
            // Default to Aptos if no chains specified
            setAvailableChains(["APTOS"]);
            setSelectedChain("APTOS");
          }
        } else {
          // Backend-less: Create minimal mock data structure
          // In a real backend-less app, this would come from on-chain data or IPFS
          console.warn("No initial data provided - using mock data for backend-less operation");
          // Don't set error, just use default chain
          if (!mounted) return;
          setAvailableChains(["APTOS"]);
          setSelectedChain("APTOS");
        }
      } catch (err: any) {
        if (!mounted) return;
        console.error("Error loading address data:", err);
        setError(err.message || "Failed to load data");
      } finally {
        if (mounted) {
          setIsInitializing(false);
        }
      }
    };

    loadAddressData();

    return () => {
      mounted = false;
    };
  }, [username, tag, initialData, globallyAvailableChains]);

  const value: PayContextType = {
    // Address data
    addressData,
    isInitializing,
    error,

    // Chain selection
    selectedChain,
    availableChains,
    setSelectedChain,

    // UI state
    currentColor,
    enableColorRotation,
    setEnableColorRotation,

    // Wallet
    wallet,
    refreshWallet,
    isWalletModalOpen,
    setIsWalletModalOpen,
    handleOpenWalletModal,

    // Payment data
    amount,
    setAmount,
    paymentNote,
    setPaymentNote,
    selectedToken,
    setSelectedToken,
    collectInfoData,
    setCollectInfoData: handleSetCollectInfoData,

    // Payment flow
    paymentSuccess,
    setPaymentSuccess,
    resetForNewPayment,
    submitPaymentInfoAndGetId,
  };

  return (
    <PayContext.Provider value={value}>
      {children}
    </PayContext.Provider>
  );
}


// Wallet Provider Wrapper with Context
function PayWalletProviderWithContext({
  children,
  username,
  tag,
  initialData,
}: {
  children: React.ReactNode;
  username: string;
  tag: string;
  initialData?: AddressResponse;
}) {
  const isMounted = useIsMounted();

  // Only render wallet providers and context on client side to prevent SSR issues
  if (!isMounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center justify-center gap-1">
          <div className="loading loading-dots w-12 text-gray-600"></div>
          <div className="text-center text-gray-400  font-medium">
            Initializing Payment Link...
          </div>
        </div>
      </div>
    );
  }

  return (
    <AptosWalletProvider>
      <PayContextProvider
        username={username}
        tag={tag}
        initialData={initialData}
      >
        {children}
      </PayContextProvider>
    </AptosWalletProvider>
  );
}

// Main PayProvider export
export default function PayProvider({
  children,
  username,
  tag,
  initialData,
}: {
  children: React.ReactNode;
  username: string;
  tag: string;
  initialData?: AddressResponse;
}) {
  return (
    <PayWalletProviderWithContext
      username={username}
      tag={tag}
      initialData={initialData}
    >
      {children}
    </PayWalletProviderWithContext>
  );
}

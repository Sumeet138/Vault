"use client";

import React, {
  createContext,
  useContext,
  ReactNode,
  useState,
  useCallback,
  useEffect,
  useMemo,
  useRef,
} from "react";
import { useAuth } from "./AuthProvider";
import { useMetaKeys } from "./MetaKeysProvider";
// Backend-less types
type UserToken = any;
type UserBalancesSummary = any;
type UserActivity = any;
type ChainIdOrArray = string | string[];
type Link = any;
type CreateLinkRequest = any;
type UpdateLinkRequest = any;
import { EMOJI_PICKS } from "@/config/styling";
import { SupportedChain, isTestnet, CHAINS } from "@/config/chains";
import { AptosEventScanner } from "@/lib/aptos/event-scanner";
import { Buffer } from "buffer";
import bs58 from "bs58";

interface EnhancedPersonalLink extends Omit<Link, "emoji" | "backgroundColor"> {
  id: string;
  linkPreview: string;
  supportedChains: string[];
  backgroundColor: string;
  emoji: string;
}

interface UserContextType {
  // Stealth balances state
  stealthBalances: UserToken[];
  stealthBalancesSummary: UserBalancesSummary | null;
  stealthBalancesLoading: boolean;
  stealthBalancesInitialLoading: boolean;
  stealthBalancesError: string | null;

  // Activities state
  activities: UserActivity[];
  activitiesLoading: boolean;
  activitiesInitialLoading: boolean;
  activitiesError: string | null;
  activitiesLoadingAll: boolean;

  // Links state
  links: Link[];
  linksLoading: boolean;
  linksError: string | null;

  // Personal link state
  personalLink: EnhancedPersonalLink;
  personalLinkLoading: boolean;
  personalLinkError: string | null;

  // UI state
  showArchivedLinks: boolean;

  // Actions
  fetchStealthBalances: (chain?: ChainIdOrArray) => Promise<void>;
  refreshStealthBalances: () => Promise<void>;
  fetchActivities: (
    chain?: ChainIdOrArray,
    isInitial?: boolean,
    limit?: number
  ) => Promise<void>;
  refreshActivities: (limit?: number) => Promise<void>;
  withdrawFromStealth: (destinationAddress: string, amount: bigint) => Promise<any>;

  // Links actions
  fetchLinks: () => Promise<void>;
  refreshLinks: () => Promise<void>;
  createLink: (data: CreateLinkRequest) => Promise<Link | null>;
  updateLink: (id: string, data: UpdateLinkRequest) => Promise<Link | null>;
  archiveLink: (id: string) => Promise<Link | null>;
  unarchiveLink: (id: string) => Promise<Link | null>;
  deleteLink: (id: string) => Promise<boolean>;

  // Personal link actions
  fetchPersonalLink: () => Promise<void>;
  refetchPersonalLink: () => Promise<void>;

  // UI actions
  setShowArchivedLinks: (show: boolean) => void;

  // Available chains
  availableChains: SupportedChain[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export default function UserProvider({ children }: UserProviderProps) {
  const { backendToken, isSignedIn, me, availableChains } = useAuth();
  const { metaKeys } = useMetaKeys();

  const chainsToFetch = useMemo<ChainIdOrArray>(
    () => (isTestnet ? ["APTOS_TESTNET"] : ["APTOS_MAINNET"]),
    []
  );

  // Default placeholder personal link (memoized to prevent unnecessary re-renders)
  const defaultPersonalLink = useMemo<EnhancedPersonalLink>(
    () => ({
      id: "placeholder",
      userId: "",
      linkPreview: "",
      supportedChains: [],
      backgroundColor: "gray",
      emoji: "🔗",
      tag: "",
      label: "",
      description: null,
      specialTheme: "default",
      type: "SIMPLE_PAYMENT",
      amountType: "FIXED",
      goalAmount: null,
      isStable: false,
      stableToken: null,
      collectInfo: false,
      collectFields: null,
      viewCount: 0,
      status: "ACTIVE",
      archivedAt: null,
      isActive: false,
      createdAt: "",
      updatedAt: "",
      file: null,
      chainConfigs: [],
      user: {
        id: "",
        username: "",
      },
      activities: [],
      files: {
        thumbnail: null,
        deliverables: [],
      },
      isPersonalLink: true,
      stats: {
        viewCount: 0,
        totalPayments: 0,
        paymentStats: [],
      },
      template: "default",
    }),
    []
  );

  // Stealth balances state
  const [stealthBalances, setStealthBalances] = useState<UserToken[]>([]);
  const [stealthBalancesSummary, setStealthBalancesSummary] =
    useState<UserBalancesSummary | null>(null);
  const [stealthBalancesLoading, setStealthBalancesLoading] = useState(false);
  const [stealthBalancesInitialLoading, setStealthBalancesInitialLoading] =
    useState(true);
  const [stealthBalancesError, setStealthBalancesError] = useState<
    string | null
  >(null);

  // Activities state
  const [activities, setActivities] = useState<UserActivity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(false);
  const [activitiesInitialLoading, setActivitiesInitialLoading] =
    useState(true);
  const [activitiesError, setActivitiesError] = useState<string | null>(null);
  const [activitiesLoadingAll, setActivitiesLoadingAll] = useState(false);

  // Links state
  const [links, setLinks] = useState<Link[]>([]);
  const [linksLoading, setLinksLoading] = useState(false);
  const [linksError, setLinksError] = useState<string | null>(null);

  // Personal link state
  const [personalLink, setPersonalLink] =
    useState<EnhancedPersonalLink>(defaultPersonalLink);
  const [personalLinkLoading, setPersonalLinkLoading] = useState(false);
  const [personalLinkError, setPersonalLinkError] = useState<string | null>(
    null
  );

  // UI state
  const [showArchivedLinks, setShowArchivedLinks] = useState(false);

  // Refs to track if initial fetch has been done
  const initialFetchDone = React.useRef(false);

  // Refs to prevent double-calling APIs
  const isGettingLinks = useRef(false);
  const isGettingPersonalLink = useRef(false);
  const isGettingBalances = useRef(false);
  const isGettingActivities = useRef(false);

  // Backend-less: Fetch stealth balances from Supabase
  const fetchStealthBalances = useCallback(
    async (chain: ChainIdOrArray = chainsToFetch) => {
      console.log("🔍 fetchStealthBalances called:", {
        hasBackendToken: !!backendToken,
        hasMe: !!me?.id,
        hasMetaKeys: !!metaKeys?.APTOS,
        userId: me?.id,
        metaKeysLoaded: metaKeys?.APTOS ? "YES" : "NO",
      });

      if (!backendToken || !me?.id) {
        console.log("⚠️ fetchStealthBalances: Missing backendToken or me, skipping");
        setStealthBalances([]);
        setStealthBalancesSummary({
          totalBalanceUsd: 0,
          tokenCount: 0,
        });
        setStealthBalancesLoading(false);
        setStealthBalancesInitialLoading(false);
        return;
      }

      // If metaKeys are not loaded, we can still fetch from Supabase
      // but we can't scan for new payments
      if (!metaKeys?.APTOS) {
        console.log("⚠️ fetchStealthBalances: MetaKeys not loaded, only fetching from Supabase");
        // Still fetch existing payments from Supabase
        try {
          const { supabase } = await import("@/lib/supabase/client");
          const { data: payments, error } = await supabase
            .from("stealth_payments")
            .select("*")
            .eq("user_id", me.id)
            .in("status", ["CONFIRMED"]);

          if (error) {
            console.error("❌ Error fetching payments from Supabase:", error);
            throw error;
          }

          const totalAmount = payments?.reduce((sum, p) => sum + BigInt(p.amount), 0n) || 0n;
          const totalAPT = Number(totalAmount) / 10 ** 8;

          const tokenBalances: UserToken[] = totalAmount > 0n ? [{
            chain: isTestnet ? "APTOS_TESTNET" : "APTOS_MAINNET",
            name: "Aptos",
            symbol: "APT",
            decimals: 8,
            total: totalAPT,
            usdValue: 0,
            imageUrl: "/assets/tokens/apt.png",
            isNative: true,
            isVerified: true,
            mintAddress: "0x1::aptos_coin::AptosCoin",
          }] : [];

          setStealthBalances(tokenBalances);
          setStealthBalancesSummary({
            totalBalanceUsd: 0,
            tokenCount: tokenBalances.length,
          });
        } catch (error) {
          console.error("Error fetching balances from Supabase:", error);
          setStealthBalances([]);
          setStealthBalancesSummary({ totalBalanceUsd: 0, tokenCount: 0 });
        } finally {
          setStealthBalancesLoading(false);
          setStealthBalancesInitialLoading(false);
        }
        return;
      }

      setStealthBalancesLoading(true);
      setStealthBalancesError(null);

      try {
        console.log("🔍 fetchStealthBalances started:", {
          hasMetaKeys: !!metaKeys?.APTOS,
          userId: me.id,
          chain: chain,
        });

        // First, scan blockchain for new payments
        const chainIds = Array.isArray(chain) ? chain : [chain];
        const chainId = chainIds[0] || (isTestnet ? "APTOS_TESTNET" : "APTOS_MAINNET");
        const chainConfig = CHAINS[chainId as keyof typeof CHAINS];
        
        if (chainConfig?.stealthProgramId) {
          console.log("📡 Scanning for payment events...");
          const scanner = new AptosEventScanner(chainConfig.stealthProgramId);
          
          // Convert meta keys from hex strings to Uint8Array
          const metaViewPriv = Buffer.from(metaKeys.APTOS.metaViewPriv, "hex");
          const metaSpendPriv = Buffer.from(metaKeys.APTOS.metaSpendPriv, "hex");

          // Query payment events
          const coinType = "0x1::aptos_coin::AptosCoin";
          const paymentEvents = await scanner.queryPaymentEvents(coinType, 100);
          console.log(`📦 Found ${paymentEvents.length} payment events`);
          
          // Scan and decrypt payments
          const scannedPayments = await scanner.scanPaymentEvents(
            paymentEvents,
            metaViewPriv,
            metaSpendPriv
          );
          console.log(`✅ Scanned ${scannedPayments.length} payments for this user`);

          // Save new payments to Supabase
          const { supabase } = await import("@/lib/supabase/client");
          
          for (const payment of scannedPayments) {
            try {
              console.log("💾 Processing payment:", {
                txHash: payment.transactionHash,
                amount: payment.amount.toString(),
                stealthAddress: payment.stealthAddress,
              });

              // Check if payment already exists
              const { data: existing, error: checkError } = await supabase
                .from("stealth_payments")
                .select("id")
                .eq("tx_hash", payment.transactionHash)
                .maybeSingle();
              
              if (checkError && checkError.code !== 'PGRST116') {
                console.error("❌ Error checking payment existence:", checkError);
              }
              
              if (checkError && checkError.code !== 'PGRST116') {
                console.error("Error checking payment:", checkError);
              }
              
              if (!existing) {
                // Store ephemeral public key (base58) - needed for withdraw
                const ephemeralPubkey = payment.ephemeralPubkey || bs58.encode(new Uint8Array());
                
                // Use payment handler to save payment and credit balance
                const { savePaymentAndCreditBalance } = await import("@/lib/supabase/payment-handler");
                const result = await savePaymentAndCreditBalance({
                  userId: me.id,
                  txHash: payment.transactionHash,
                  stealthAddress: payment.stealthAddress,
                  payerAddress: payment.payer,
                  amount: payment.amount,
                  tokenSymbol: "APT",
                  tokenAddress: coinType,
                  decimals: 8,
                  label: payment.decryptedLabel || undefined,
                  note: payment.decryptedNote || undefined,
                  ephemeralPubkey: ephemeralPubkey,
                });
                
                if (result.success) {
                  console.log("✅ Payment saved and balance credited:", payment.transactionHash, "Amount:", payment.amount.toString());
                  
                  // Check if this is an RWA purchase
                  if (payment.decryptedLabel) {
                    try {
                      // The label contains the link ID, we need to check if it's an RWA asset
                      // For RWA, the link tag should match an assetId
                      const storedLinks = localStorage.getItem("shingru-links");
                      if (storedLinks) {
                        const links = JSON.parse(storedLinks);
                        const link = links.find((l: any) => l.id === payment.decryptedLabel);
                        
                        if (link && link.tag) {
                          // Call API route to process RWA purchase (server-side)
                          const rwaResponse = await fetch("/api/rwa/process-payment", {
                            method: "POST",
                            headers: {
                              "Content-Type": "application/json",
                            },
                            body: JSON.stringify({
                              userId: me.id,
                              linkTag: link.tag,
                              transactionHash: payment.transactionHash,
                              amount: payment.amount.toString(),
                            }),
                          });
                          
                          if (rwaResponse.ok) {
                            const rwaData = await rwaResponse.json();
                            if (rwaData.success) {
                              console.log(`✅ RWA purchase processed: ${rwaData.data.quantity} shares of ${rwaData.data.assetId}`);
                            } else {
                              // Not an RWA purchase or processing failed - that's okay
                              if (rwaData.error !== "Not an RWA asset") {
                                console.error("❌ Error processing RWA purchase:", rwaData.error);
                              }
                            }
                          }
                        }
                      }
                    } catch (rwaError) {
                      console.error("❌ Error checking RWA purchase:", rwaError);
                      // Don't fail the payment if RWA processing fails
                    }
                  }
                } else {
                  console.error("❌ Error saving payment:", result.error);
                }
              } else {
                console.log("ℹ️ Payment already exists:", payment.transactionHash);
              }
            } catch (error) {
              console.error("❌ Error saving payment to Supabase:", error);
            }
          }
        }

        // Now fetch confirmed payments from Supabase
        const { supabase } = await import("@/lib/supabase/client");
        console.log("📊 Fetching payments from Supabase for user:", me.id);
        const { data: payments, error } = await supabase
          .from("stealth_payments")
          .select("*")
          .eq("user_id", me.id)
          .in("status", ["CONFIRMED"]); // Only confirmed, not withdrawn

        if (error) {
          console.error("❌ Error fetching payments from Supabase:", error);
          throw error;
        }

        console.log(`📦 Found ${payments?.length || 0} confirmed payments in Supabase`);
        if (payments && payments.length > 0) {
          console.log("💰 Payment amounts:", payments.map(p => ({ tx: p.tx_hash, amount: p.amount })));
        }

        // Calculate total balance
        const totalAmount = payments?.reduce((sum, p) => sum + BigInt(p.amount), 0n) || 0n;
        const totalAPT = Number(totalAmount) / 10 ** 8; // Convert octas to APT
        console.log(`💵 Total balance: ${totalAPT} APT (${totalAmount.toString()} octas)`);

        // Create token balance object
        const tokenBalances: UserToken[] = totalAmount > 0n ? [{
          chain: isTestnet ? "APTOS_TESTNET" : "APTOS_MAINNET",
          name: "Aptos",
          symbol: "APT",
          decimals: 8,
          total: totalAPT,
          usdValue: 0, // TODO: Fetch price from API
          imageUrl: "/assets/tokens/apt.png",
          isNative: true,
          isVerified: true,
          mintAddress: "0x1::aptos_coin::AptosCoin",
        }] : [];

        setStealthBalances(tokenBalances);
        setStealthBalancesSummary({
          totalBalanceUsd: 0,
          tokenCount: tokenBalances.length,
        });
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Failed to fetch stealth balances";
        console.error("Error fetching stealth balances:", error);
        setStealthBalancesError(errorMessage);
        setStealthBalances([]);
        setStealthBalancesSummary({
          totalBalanceUsd: 0,
          tokenCount: 0,
        });
      } finally {
        setStealthBalancesLoading(false);
        setStealthBalancesInitialLoading(false);
      }
    },
    [backendToken, chainsToFetch, metaKeys, me]
  );

  // Refresh stealth balances (uses APTOS_TESTNET or APTOS_MAINNET by default)
  const refreshStealthBalances = useCallback(async () => {
    if (isGettingBalances.current) {
      return; // Skip if already fetching
    }
    isGettingBalances.current = true;
    try {
      await fetchStealthBalances();
    } finally {
      isGettingBalances.current = false;
    }
  }, [fetchStealthBalances]);

  // Fetch activities from Supabase (treasury-based)
  const fetchActivities = useCallback(
    async (
      chain: ChainIdOrArray = chainsToFetch,
      isInitial: boolean = false,
      limit: number = 50
    ) => {
      if (!backendToken || !me?.id) {
        setActivities([]);
        setActivitiesLoading(false);
        if (isInitial) setActivitiesInitialLoading(false);
        setActivitiesLoadingAll(false);
        return;
      }

      setActivitiesLoading(true);
      if (isInitial) setActivitiesInitialLoading(true);
      setActivitiesError(null);

      try {
        const { supabase } = await import("@/lib/supabase/client");
        
        // Fetch both balance transactions and stealth payments
        const [balanceResult, paymentsResult] = await Promise.all([
          // Fetch balance transactions with payment info
          supabase
            .from("balance_transactions")
            .select(`
              *,
              payment:payment_id (
                payer_address,
                stealth_address
              )
            `)
            .eq("user_id", me.id)
            .order("created_at", { ascending: false })
            .limit(limit),
          
          // Fetch stealth payments
          supabase
            .from("stealth_payments")
            .select("*")
            .eq("user_id", me.id)
            .order("created_at", { ascending: false })
            .limit(limit)
        ]);

        if (balanceResult.error) {
          console.error("Error fetching balance transactions:", balanceResult.error);
          throw balanceResult.error;
        }

        if (paymentsResult.error) {
          console.error("Error fetching stealth payments:", paymentsResult.error);
          // Don't throw - continue with balance transactions only
        }

        const transactions = balanceResult.data || [];
        const payments = paymentsResult.data || [];

        // Convert balance transactions to activity format
        const balanceActivities: UserActivity[] = transactions.map((tx) => {
          const payment = tx.payment as any;
          const stealthAddress = payment?.stealth_address;

          return {
            id: tx.id,
            type: tx.type === "DEPOSIT" ? "PAYMENT" : "WITHDRAWAL",
            chain: isTestnet ? "APTOS_TESTNET" : "APTOS_MAINNET",
            timestamp: new Date(tx.created_at).getTime(),
            txHash: tx.tx_hash || "",
            amount: tx.amount,
            uiAmount: Number(tx.amount) / Math.pow(10, tx.decimals),
            token: {
              symbol: tx.token_symbol,
              name: tx.token_symbol === 'APT' ? 'Aptos' : tx.token_symbol,
              decimals: tx.decimals,
              imageUrl: tx.token_symbol === 'APT' ? '/assets/tokens/apt.png' : null,
              mintAddress: tx.token_address,
              priceUsd: 0,
            },
            usdValue: 0,
            mintAddress: tx.token_address,
            from: tx.type === "DEPOSIT" ? payment?.payer_address : stealthAddress,
            to: tx.type === "DEPOSIT" ? stealthAddress : undefined,
            isAnnounce: false,
            status: "CONFIRMED",
            label: tx.type === "DEPOSIT" ? "Balance Deposit" : "Withdrawal",
          };
        });

        // Convert stealth payments to activity format
        const paymentActivities: UserActivity[] = payments.map((payment) => {
          return {
            id: payment.id,
            type: "PAYMENT",
            chain: isTestnet ? "APTOS_TESTNET" : "APTOS_MAINNET",
            timestamp: new Date(payment.created_at).getTime(),
            txHash: payment.tx_hash,
            amount: payment.amount,
            uiAmount: Number(payment.amount) / Math.pow(10, payment.decimals),
            token: {
              symbol: payment.token_symbol,
              name: payment.token_symbol === 'APT' ? 'Aptos' : payment.token_symbol,
              decimals: payment.decimals,
              imageUrl: payment.token_symbol === 'APT' ? '/assets/tokens/apt.png' : null,
              mintAddress: payment.token_address,
              priceUsd: 0,
            },
            usdValue: 0,
            mintAddress: payment.token_address,
            from: payment.payer_address,
            to: payment.stealth_address,
            isAnnounce: false,
            status: payment.status === "CONFIRMED" ? "CONFIRMED" : "PENDING",
            label: payment.label || "Payment Received",
            note: payment.note,
          };
        });

        // Combine and sort by timestamp
        const allActivities = [...balanceActivities, ...paymentActivities]
          .sort((a, b) => b.timestamp - a.timestamp)
          .slice(0, limit);

        setActivities(allActivities);
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : "Failed to fetch activities";
        console.error("Error fetching activities:", error);
        setActivitiesError(errorMessage);
        setActivities([]);
      } finally {
        setActivitiesLoading(false);
        if (isInitial) setActivitiesInitialLoading(false);
        setActivitiesLoadingAll(false);
      }
    },
    [backendToken, chainsToFetch, me]
  );

  // Refresh activities (uses APTOS_TESTNET or APTOS_MAINNET by default)
  const refreshActivities = useCallback(
    async (limit?: number) => {
      if (isGettingActivities.current) {
        return; // Skip if already fetching
      }
      isGettingActivities.current = true;
      try {
        await fetchActivities(undefined, false, limit);
      } finally {
        isGettingActivities.current = false;
      }
    },
    [fetchActivities]
  );

  // Withdraw from treasury (treasury-based system)
  const withdrawFromStealth = useCallback(
    async (destinationAddress: string, amount: bigint, tokenAddress: string = "0x1::aptos_coin::AptosCoin") => {
      if (!me?.id) {
        throw new Error("User not authenticated");
      }

      try {
        // Call treasury withdraw API
        const response = await fetch('/api/withdraw', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            userId: me.id,
            destinationAddress,
            amount: amount.toString(),
            tokenAddress,
            tokenSymbol: 'APT',
          }),
        });

        const result = await response.json();

        if (!response.ok || !result.success) {
          throw new Error(result.error || 'Withdrawal failed');
        }

        // Refresh balances
        await fetchStealthBalances();

        return { success: true, txHash: result.txHash };
      } catch (error) {
        console.error("Withdraw error:", error);
        throw error;
      }
    },
    [me, fetchStealthBalances]
  );

  // Backend-less: Fetch links from local storage
  const fetchLinks = useCallback(async () => {
    if (!backendToken) {
      return;
    }

    setLinksLoading(true);
    setLinksError(null);

    try {
      // Backend-less: Load links from local storage
      const storedLinks = localStorage.getItem("shingru-links");
      if (storedLinks) {
        let links: Link[];
        try {
          links = JSON.parse(storedLinks);
        } catch (parseError) {
          console.error("Failed to parse links from localStorage:", parseError);
          console.error("Corrupted data:", storedLinks.substring(0, 100));
          // Clear corrupted data and start fresh
          localStorage.removeItem("shingru-links");
          setLinks([]);
          setLinksLoading(false);
          return;
        }
        
        // Ensure all links have user object, linkPreview, and labels populated
        const normalizedLinks = links.map((link) => {
          // Generate linkPreview if missing
          if (!link.linkPreview || link.linkPreview.trim() === "") {
            const username = link.user?.username || me?.username;
            if (username) {
              link.linkPreview = `/${username}${link.tag ? `/${link.tag}` : ""}`;
            }
          }
          
          // Ensure user object exists
          if (!link.user || !link.user.username) {
            link.user = {
              id: me?.id || "",
              username: me?.username || "",
            };
          }
          
          // Ensure labels array exists
          if (!link.labels || !Array.isArray(link.labels)) {
            link.labels = [];
          }
          
          // Ensure payment status exists, default to "pending"
          if (!link.paymentStatus) {
            link.paymentStatus = "pending";
          }
          
          return link;
        });
        
        // Save normalized links back to localStorage
        localStorage.setItem("shingru-links", JSON.stringify(normalizedLinks));
        setLinks(normalizedLinks);
      } else {
        setLinks([]);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Failed to fetch links";
      console.error("Error fetching links:", error);
      setLinksError(errorMessage);
    } finally {
      setLinksLoading(false);
    }
  }, [backendToken, me]);

  // Refresh links
  const refreshLinks = useCallback(async () => {
    if (isGettingLinks.current) {
      return; // Skip if already fetching
    }
    isGettingLinks.current = true;
    try {
      await fetchLinks();
    } finally {
      isGettingLinks.current = false;
    }
  }, [fetchLinks]);

  // Backend-less: Create link and store in local storage
  const createLink = useCallback(
    async (data: CreateLinkRequest): Promise<Link | null> => {
      if (!backendToken || !me?.username) {
        console.error("Cannot create link: missing backendToken or username");
        return null;
      }

      try {
        // Generate linkPreview from username and tag
        const linkPreview = `/${me.username}${data.tag ? `/${data.tag}` : ""}`;
        
        // Extract deliverables if present (for digital products)
        const deliverables = (data as any).deliverables || [];
        // Extract labels if present
        const labels = (data as any).labels || [];
        // Extract payment status, default to "pending"
        const paymentStatus = (data as any).paymentStatus || "pending";
        
        // Backend-less: Create link locally
        const newLink: Link = {
          ...data,
          id: `local_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: backendToken,
          linkPreview: linkPreview, // Always set linkPreview
          user: {
            id: me.id || "",
            username: me.username, // Always set user object
          },
          files: {
            thumbnail: null,
            deliverables: deliverables, // Store uploaded deliverable files
          },
          labels: labels, // Store labels
          paymentStatus: paymentStatus, // Store payment status
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          status: "ACTIVE",
          isActive: true,
          activities: [], // Initialize activities array
          stats: {
            viewCount: 0,
            totalPayments: 0,
          },
        };
        
        // Log deliverables if present
        if (deliverables.length > 0) {
          console.log(`✅ Link created with ${deliverables.length} deliverable files`);
        }
        
        console.log("✅ Creating link with linkPreview:", linkPreview, "for user:", me.username);
        
        // Save to local storage
        const storedLinks = localStorage.getItem("shingru-links");
        const links = storedLinks ? JSON.parse(storedLinks) : [];
        links.push(newLink);
        localStorage.setItem("shingru-links", JSON.stringify(links));
        
        setLinks((prevLinks: Link[]) => [...prevLinks, newLink]);
        return newLink;
      } catch (error) {
        console.error("Error creating link:", error);
        return null;
      }
    },
    [backendToken, me]
  );

  // Backend-less: Update link in local storage
  const updateLink = useCallback(
    async (id: string, data: UpdateLinkRequest): Promise<Link | null> => {
      if (!backendToken) {
        return null;
      }

      try {
        // Backend-less: Update link in local storage
        const storedLinks = localStorage.getItem("shingru-links");
        if (!storedLinks) return null;
        
        const links = JSON.parse(storedLinks);
        const linkIndex = links.findIndex((link: Link) => link.id === id);
        if (linkIndex === -1) return null;
        
        // Preserve labels if not provided in update
        const updatedLink = {
          ...links[linkIndex],
          ...data,
          labels: (data as any).labels !== undefined ? (data as any).labels : links[linkIndex].labels,
          updatedAt: new Date().toISOString(),
        };
        
        links[linkIndex] = updatedLink;
        
        localStorage.setItem("shingru-links", JSON.stringify(links));
        await refreshLinks();
        return links[linkIndex];
      } catch (error) {
        console.error("Error updating link:", error);
        return null;
      }
    },
    [backendToken, refreshLinks]
  );

  // Backend-less: Delete link from local storage
  const deleteLink = useCallback(
    async (id: string): Promise<boolean> => {
      if (!backendToken) {
        return false;
      }

      try {
        // Backend-less: Delete link from local storage
        const storedLinks = localStorage.getItem("shingru-links");
        if (!storedLinks) return false;
        
        const links = JSON.parse(storedLinks);
        const filteredLinks = links.filter((link: Link) => link.id !== id);
        localStorage.setItem("shingru-links", JSON.stringify(filteredLinks));
        
        await refreshLinks();
        return true;
      } catch (error) {
        console.error("Error deleting link:", error);
        return false;
      }
    },
    [backendToken, refreshLinks]
  );

  // Backend-less: Archive link in local storage
  const archiveLink = useCallback(
    async (id: string): Promise<Link | null> => {
      if (!backendToken) {
        return null;
      }

      try {
        // Backend-less: Archive link in local storage
        const storedLinks = localStorage.getItem("shingru-links");
        if (!storedLinks) return null;
        
        const links = JSON.parse(storedLinks);
        const linkIndex = links.findIndex((link: Link) => link.id === id);
        if (linkIndex === -1) return null;
        
        links[linkIndex] = {
          ...links[linkIndex],
          archivedAt: new Date().toISOString(),
          status: "ARCHIVED",
          updatedAt: new Date().toISOString(),
        };
        
        localStorage.setItem("shingru-links", JSON.stringify(links));
        await refreshLinks();
        return links[linkIndex];
      } catch (error) {
        console.error("Error archiving link:", error);
        return null;
      }
    },
    [backendToken, refreshLinks]
  );

  // Backend-less: Unarchive link in local storage
  const unarchiveLink = useCallback(
    async (id: string): Promise<Link | null> => {
      if (!backendToken) {
        return null;
      }

      try {
        // Backend-less: Unarchive link in local storage
        const storedLinks = localStorage.getItem("shingru-links");
        if (!storedLinks) return null;
        
        const links = JSON.parse(storedLinks);
        const linkIndex = links.findIndex((link: Link) => link.id === id);
        if (linkIndex === -1) return null;
        
        links[linkIndex] = {
          ...links[linkIndex],
          archivedAt: null,
          status: "ACTIVE",
          updatedAt: new Date().toISOString(),
        };
        
        localStorage.setItem("shingru-links", JSON.stringify(links));
        await refreshLinks();
        return links[linkIndex];
      } catch (error) {
        console.error("Error unarchiving link:", error);
        return null;
      }
    },
    [backendToken, refreshLinks]
  );

  // Backend-less: Fetch personal link from local storage
  const fetchPersonalLink = useCallback(async () => {
    if (!backendToken) {
      return;
    }

    setPersonalLinkLoading(true);
    setPersonalLinkError(null);

    try {
      // Backend-less: Load personal link from local storage
      const storedPersonalLink = localStorage.getItem("shingru-personal-link");
      if (storedPersonalLink) {
        const personalLinkData = JSON.parse(storedPersonalLink);

        // Get profile data from me.profileImage.data and find the corresponding emoji from EMOJI_PICKS
        const emojiId =
          personalLinkData.emoji || me?.profileImage?.data?.emoji || "link";
        const emojiData = EMOJI_PICKS.find((pick) => pick.id === emojiId);
        const displayEmoji = emojiData?.emoji || personalLinkData.emoji || "🔗";
        const displayColor =
          personalLinkData.backgroundColor ||
          me?.profileImage?.data?.backgroundColor ||
          "gray";

        const enhancedPersonalLink: EnhancedPersonalLink = {
          ...personalLinkData,
          id: personalLinkData.id,
          linkPreview: personalLinkData.linkPreview,
          supportedChains: personalLinkData.supportedChains || ["APTOS"],
          backgroundColor: displayColor,
          emoji: displayEmoji,
        };

        setPersonalLink(enhancedPersonalLink);
      } else {
        // No personal link found, use default
        setPersonalLink(defaultPersonalLink);
      }
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Failed to fetch personal link";
      console.error("Error fetching personal link:", error);
      setPersonalLinkError(errorMessage);
      setPersonalLink(defaultPersonalLink);
    } finally {
      setPersonalLinkLoading(false);
    }
  }, [backendToken, me, defaultPersonalLink]);

  // Refetch personal link
  const refetchPersonalLink = useCallback(async () => {
    if (isGettingPersonalLink.current) {
      return; // Skip if already fetching
    }
    isGettingPersonalLink.current = true;
    try {
      await fetchPersonalLink();
    } finally {
      isGettingPersonalLink.current = false;
    }
  }, [fetchPersonalLink]);

  // Auto-fetch personal link when user profile changes
  const meRef = useRef(me);
  useEffect(() => {
    if (
      initialFetchDone.current &&
      meRef.current && // Check if there was a previous `me`
      JSON.stringify(me?.profileImage) !==
        JSON.stringify(meRef.current?.profileImage)
    ) {
      refetchPersonalLink();
    }
    meRef.current = me;
  }, [me, refetchPersonalLink]);

  // Auto-fetch stealth balances and activities when user is signed in
  useEffect(() => {
    if (isSignedIn && backendToken && !initialFetchDone.current) {
      initialFetchDone.current = true;
      fetchStealthBalances();
      fetchActivities(undefined, true, 50); // Initial load with reasonable limit
      fetchLinks(); // Add initial links fetch
      fetchPersonalLink(); // Add initial personal link fetch
    } else if (!isSignedIn || !backendToken) {
      initialFetchDone.current = false;
      // Clear balances and activities when user signs out
      setStealthBalances([]);
      setStealthBalancesSummary(null);
      setStealthBalancesError(null);
      setStealthBalancesInitialLoading(true);
      setActivities([]);
      setActivitiesError(null);
      setActivitiesInitialLoading(true);
      setActivitiesLoadingAll(false);
      // Clear links data
      setLinks([]);
      setLinksError(null);
      // Reset personal link to default placeholder
      setPersonalLink(defaultPersonalLink);
      setPersonalLinkError(null);
    }
  }, [
    isSignedIn,
    backendToken,
    fetchStealthBalances,
    fetchActivities,
    fetchLinks,
    fetchPersonalLink,
    defaultPersonalLink,
  ]);

  // Auto-refetch stealth balances, activities, and links when user is signed in
  useEffect(() => {
    if (!isSignedIn || !backendToken || !initialFetchDone.current) {
      return;
    }

    // Refresh links and personal link every 8 seconds
    const linksInterval = setInterval(() => {
      refreshLinks();
      refetchPersonalLink();
    }, 8_000);

    // Refresh stealth balances and activities every 5 seconds
    const balancesInterval = setInterval(() => {
      refreshStealthBalances();
      refreshActivities();
    }, 5_000);

    // Cleanup intervals on unmount or when user signs out
    return () => {
      clearInterval(linksInterval);
      clearInterval(balancesInterval);
    };
  }, [
    isSignedIn,
    backendToken,
    refreshStealthBalances,
    refreshActivities,
    refreshLinks,
    refetchPersonalLink,
  ]);

  // Debug logging for stealth balances and activities state
  // useEffect(() => {
  //   console.log("User data state changed:", {
  //     balancesCount: stealthBalances?.length || 0,
  //     balancesLoading: stealthBalancesLoading,
  //     balancesError: stealthBalancesError,
  //     summary: stealthBalancesSummary,
  //     activitiesCount: activities?.length || 0,
  //     activitiesLoading: activitiesLoading,
  //     activitiesError: activitiesError,
  //   });
  // }, [stealthBalances, stealthBalancesLoading, stealthBalancesError, stealthBalancesSummary, activities, activitiesLoading, activitiesError]);

  // Debug logging for links state
  // useEffect(() => {
  //   console.log("Links state changed:", {
  //     linksCount: links?.length || 0,
  //     linksLoading,
  //     linksError,
  //   });
  // }, [links, linksLoading, linksError]);

  const value: UserContextType = {
    stealthBalances,
    stealthBalancesSummary,
    stealthBalancesLoading,
    stealthBalancesInitialLoading,
    stealthBalancesError,
    activities,
    activitiesLoading,
    activitiesInitialLoading,
    activitiesError,
    activitiesLoadingAll,
    fetchStealthBalances,
    refreshStealthBalances,
    fetchActivities,
    refreshActivities,
    withdrawFromStealth,
    links,
    linksLoading,
    linksError,
    personalLink,
    personalLinkLoading,
    personalLinkError,
    showArchivedLinks,
    fetchLinks,
    refreshLinks,
    createLink,
    updateLink,
    archiveLink,
    unarchiveLink,
    deleteLink,
    fetchPersonalLink,
    refetchPersonalLink,
    setShowArchivedLinks,
    availableChains,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
}

export function useUser(): UserContextType {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}

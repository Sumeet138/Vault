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
import { useAuth } from "@/providers/AuthProvider";
import { SecureMetaKeyStorage } from "@/lib/@shingru/core/secure-meta-keys-storage";

import { Buffer } from "buffer";
import ShingruStealthAptos from "@/lib/@shingru/core/shingru-stealth-aptos";

interface MetaKeySet {
  address: string;
  metaSpendPriv: string;
  metaSpendPub: string;
  metaViewPriv: string;
  metaViewPub: string;
}

export interface AllMetaKeys {
  APTOS?: MetaKeySet;
}

interface MetaKeyResult {
  metaSpendPriv: string;
  metaViewPriv: string;
  metaSpendPub: string;
  metaViewPub: string;
  chain: "APTOS";
}

interface MetaKeysContextType {
  // State
  metaKeys: AllMetaKeys | null;
  isMetaKeysLoaded: boolean;
  isMetaKeyOperationInProgress: boolean;
  isSessionLoadingComplete: boolean;

  // Actions
  saveMetaKeys: (allMetaKeys: AllMetaKeys, pin: string) => Promise<boolean>;
  unlockMetaKeysWithPin: (pin: string) => Promise<boolean>;
  hasEncryptedMetaKeys: () => boolean;
  hasValidSession: () => boolean;
  clearMetaKeys: () => void;
  setMetaKeyOperationInProgress: (inProgress: boolean) => void;

  // Meta key generation
  generateAptosMetaKeys: (
    pin: string,
    wallets: Array<{ chain: string; address: string }>,
    signature?: string
  ) => Promise<{ aptos?: MetaKeyResult }>;
}

const MetaKeysContext = createContext<MetaKeysContextType | undefined>(
  undefined
);

interface MetaKeysProviderProps {
  children: ReactNode;
}

export function MetaKeysProvider({ children }: MetaKeysProviderProps) {
  const [metaKeys, setMetaKeys] = useState<AllMetaKeys | null>(null);
  const [isMetaKeysLoaded, setIsMetaKeysLoaded] = useState(false);
  const [isMetaKeyOperationInProgress, setIsMetaKeyOperationInProgress] =
    useState(false);
  const [isSessionLoadingComplete, setIsSessionLoadingComplete] =
    useState(false);

  // Auth context
  const { me, isSignedIn } = useAuth();

  const authValues = useMemo(() => ({
    me,
    isSignedIn,
  }), [me, isSignedIn]);

  // Cross-tab PIN state sharing
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'shingru-meta-keys-session') {
        console.log('🔑 Meta keys session changed in another tab');

        if (authValues.isSignedIn && authValues.me && !isMetaKeysLoaded) {
          const loadMetaKeysFromSession = async () => {
            try {
              const metaKeysData = await SecureMetaKeyStorage.retrieveMetaKeysWithSession();
              if (metaKeysData) {
                setMetaKeys(metaKeysData as AllMetaKeys);
                setIsMetaKeysLoaded(true);
                console.log('✅ Meta keys loaded from own session after cross-tab notification');
              } else {
                console.log('ℹ️ Cross-tab notification received but no session available in this tab');
                console.log('ℹ️ User will need to enter PIN in this tab if they want to unlock');
              }
            } catch (error) {
              console.error('Failed to load meta keys from cross-tab session:', error);
            }
          };

          loadMetaKeysFromSession();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [authValues.isSignedIn, authValues.me, isMetaKeysLoaded]);

  // Function to securely save meta keys with PIN
  const saveMetaKeys = useCallback(
    async (allMetaKeys: AllMetaKeys, pin: string): Promise<boolean> => {
      if (!pin) {
        console.error("PIN is required to save meta keys securely");
        return false;
      }

      setIsMetaKeyOperationInProgress(true);
      try {
        const sanitizedMetaKeys: { [chain: string]: MetaKeySet } = {};
        for (const chain in allMetaKeys) {
          if (Object.prototype.hasOwnProperty.call(allMetaKeys, chain)) {
            const keys = allMetaKeys[chain as keyof AllMetaKeys];
            if (keys) {
              sanitizedMetaKeys[chain] = keys;
            }
          }
        }
        const success = await SecureMetaKeyStorage.storeEncryptedMetaKeys(
          pin,
          sanitizedMetaKeys
        );
        if (success) {
          setMetaKeys(allMetaKeys);
          setIsMetaKeysLoaded(true);
          console.log("✅ Meta keys saved securely");

          localStorage.setItem('shingru-meta-keys-session', Date.now().toString());
        }
        return success;
      } finally {
        setIsMetaKeyOperationInProgress(false);
      }
    },
    []
  );

  // Function to unlock meta keys with PIN
  const unlockMetaKeysWithPin = useCallback(
    async (pin: string): Promise<boolean> => {
      setIsMetaKeyOperationInProgress(true);
      try {
        const metaKeysData = await SecureMetaKeyStorage.retrieveMetaKeysWithPin(
          pin
        );
        if (metaKeysData) {
          setMetaKeys(metaKeysData as AllMetaKeys);
          setIsMetaKeysLoaded(true);
          console.log("✅ Meta keys unlocked successfully");

          const hasSessionAfterUnlock = SecureMetaKeyStorage.hasValidSession();
          console.log("🔍 Session key after unlock:", { hasSessionAfterUnlock });

          localStorage.setItem('shingru-meta-keys-session', Date.now().toString());
          return true;
        }
        console.log("❌ Failed to unlock meta keys - incorrect PIN");
        return false;
      } finally {
        setIsMetaKeyOperationInProgress(false);
      }
    },
    []
  );

  const hasEncryptedMetaKeys = useCallback((): boolean => {
    return SecureMetaKeyStorage.hasEncryptedMetaKeys();
  }, []);

  const hasValidSession = useCallback((): boolean => {
    return SecureMetaKeyStorage.hasValidSession();
  }, []);

  const clearMetaKeys = useCallback((): void => {
    SecureMetaKeyStorage.clearMetaKeys();
    setMetaKeys(null);
    setIsMetaKeysLoaded(false);
    setIsSessionLoadingComplete(false);
    console.log("🧹 Meta keys cleared");
  }, []);

  const setMetaKeyOperationInProgressExternal = useCallback(
    (inProgress: boolean) => {
      setIsMetaKeyOperationInProgress(inProgress);
    },
    []
  );

  // Aptos meta key derivation - Using secp256k1 deterministic key generation
  const deriveAptosMetaKeysWithPin = useCallback(
    async (
      pinCode: string,
      wallets: Array<{ chain: string; address: string }>,
      signature?: string
    ): Promise<MetaKeyResult | null> => {
      console.log("🔐 Generating Aptos meta keys (secp256k1 deterministic)...");

      if (!isSignedIn) {
        throw new Error("User is not signed in. Please log in first.");
      }

      const aptosWallet = wallets.find((wallet) => wallet.chain === "APTOS");
      if (!aptosWallet) {
        throw new Error("No Aptos wallet found");
      }
      console.log("📱 Using Aptos wallet:", aptosWallet.address);

      // Create deterministic seed from wallet signature
      // Signature must be provided for deterministic key generation
      if (!signature) {
        throw new Error("Wallet signature is required for deterministic meta key generation");
      }

      const seed = signature;

      console.log("✅ Using wallet signature for deterministic key derivation");

      // Generate deterministic secp256k1 meta keys
      const shingru = new ShingruStealthAptos();
      const metaKeys = shingru.generateDeterministicMetaKeys(seed);

      console.log("✅ Aptos meta keys generated successfully (secp256k1 deterministic)");
      console.log(`   Spend Public Key: ${metaKeys.metaSpendPubB58}`);
      console.log(`   View Public Key: ${metaKeys.metaViewPubB58}`);

      return {
        metaSpendPriv: Buffer.from(metaKeys.metaSpend.privateKey).toString("hex"),
        metaViewPriv: Buffer.from(metaKeys.metaView.privateKey).toString("hex"),
        metaSpendPub: metaKeys.metaSpendPubB58,
        metaViewPub: metaKeys.metaViewPubB58,
        chain: "APTOS",
      };
    },
    [isSignedIn]
  );

  const generateAptosMetaKeys = useCallback(
    async (
      pin: string,
      wallets: Array<{ chain: string; address: string }>,
      signature?: string
    ): Promise<{ aptos?: MetaKeyResult }> => {
      const result: { aptos?: MetaKeyResult } = {};
      const hasAptosWallet = wallets.some(w => w.chain === "APTOS");

      if (hasAptosWallet) {
        console.log("🔐 Generating Aptos meta keys...");
        const aptosResult = await deriveAptosMetaKeysWithPin(pin, wallets, signature);
        if (aptosResult) {
          result.aptos = aptosResult;
        }
      }
      return result;
    },
    [deriveAptosMetaKeysWithPin]
  );

  useEffect(() => {
    if (!authValues.isSignedIn || !authValues.me) {
      console.log("🧹 User signed out, clearing meta keys state");
      setMetaKeys(null);
      setIsMetaKeysLoaded(false);
      setIsSessionLoadingComplete(true);
    }
  }, [authValues.isSignedIn, authValues.me]);

  useEffect(() => {
    const loadMetaKeysFromSession = async () => {
      if (!authValues.isSignedIn || !authValues.me) {
        console.log("🔍 Session load: User not signed in or no profile, skipping");
        setIsSessionLoadingComplete(true);
        return;
      }
      console.log("🔍 Attempting to load meta keys from session...");

      try {
        const hasEncrypted = SecureMetaKeyStorage.hasEncryptedMetaKeys();
        const hasSession = SecureMetaKeyStorage.hasValidSession();

        console.log("🔍 Session check:", { hasEncrypted, hasSession });

        if (!hasEncrypted) {
          console.log("ℹ️ No encrypted meta keys found");
          setIsSessionLoadingComplete(true);
          return;
        }

        if (!hasSession) {
          console.log("ℹ️ No valid session key found - will need PIN");
          setIsSessionLoadingComplete(true);
          return;
        }

        const metaKeysData =
          await SecureMetaKeyStorage.retrieveMetaKeysWithSession();
        if (metaKeysData) {
          setMetaKeys(metaKeysData as AllMetaKeys);
          setIsMetaKeysLoaded(true);
          console.log("✅ Meta keys loaded from session successfully");
        } else {
          console.log("❌ Failed to retrieve meta keys despite having valid session");
        }
      } catch (error) {
        console.error("Failed to load meta keys from session:", error);
      } finally {
        setIsSessionLoadingComplete(true);
      }
    };

    loadMetaKeysFromSession();
  }, [authValues.isSignedIn, authValues.me]);

  const value: MetaKeysContextType = {
    metaKeys,
    isMetaKeysLoaded,
    isMetaKeyOperationInProgress,
    isSessionLoadingComplete,
    saveMetaKeys,
    unlockMetaKeysWithPin,
    hasEncryptedMetaKeys,
    hasValidSession,
    clearMetaKeys,
    setMetaKeyOperationInProgress: setMetaKeyOperationInProgressExternal,
    generateAptosMetaKeys,
  };

  return (
    <MetaKeysContext.Provider value={value}>
      {children}
    </MetaKeysContext.Provider>
  );
}

export function useMetaKeys(): MetaKeysContextType {
  const context = useContext(MetaKeysContext);
  if (context === undefined) {
    throw new Error("useMetaKeys must be used within a MetaKeysProvider");
  }
  return context;
}

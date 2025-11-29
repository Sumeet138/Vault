import React, { useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMetaKeys } from "@/providers/MetaKeysProvider";
import { backend } from "@/lib/api";
import { motion, AnimatePresence } from "motion/react";
import Image from "next/image";
import { EASE_OUT_QUART } from "@/config/animation";
import { ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import CustomPinInput from "@/components/common/CustomPinInput";
import { Sound, useSound } from "@/providers/SoundProvider";
// Aptos wallet connection handled via window.aptos

interface PinStepProps {
  onNext?: () => void;
  savedPin?: string;
  onPinChange?: (pin: string) => void;
  onComplete?: () => void;
}

export function PinStep({
  onNext,
  savedPin,
  onPinChange,
  onComplete,
}: PinStepProps) {
  const { playSound } = useSound();
  const [pin, setPin] = useState(savedPin || "");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [waitingForSignature, setWaitingForSignature] = useState(false);

  const { wallets, accessToken, fetchMe, me } = useAuth();
  
  // Get Aptos wallet
  const getAptosWallet = () => {
    if (typeof window === "undefined") return null;
    return (window as any).aptos;
  };
  
  const [aptosAccount, setAptosAccount] = React.useState<string | null>(null);
  
  React.useEffect(() => {
    const checkWallet = async () => {
      const wallet = getAptosWallet();
      if (wallet) {
        try {
          const account = await wallet.account();
          setAptosAccount(account?.address || null);
        } catch {
          setAptosAccount(null);
        }
      } else {
        setAptosAccount(null);
      }
    };
    checkWallet();
    const interval = setInterval(checkWallet, 1000);
    return () => clearInterval(interval);
  }, []);
  const {
    saveMetaKeys,
    unlockMetaKeysWithPin,
    hasEncryptedMetaKeys,
    setMetaKeyOperationInProgress,
    generateAptosMetaKeys,
  } = useMetaKeys();

  const hasExistingKeys =
    me?.wallets &&
    me.wallets.length > 0 &&
    me.wallets.some(
      (wallet) => wallet.metaKeys?.metaSpendPub && wallet.metaKeys?.metaViewPub
    );
  const hasEncryptedKeys = hasEncryptedMetaKeys();
  const isNewAccount = !hasExistingKeys && !hasEncryptedKeys;

  const resetState = () => {
    setError("");
    setSuccess(false);
  };

  // Auto-refresh removed - not needed for wallet authentication

  React.useEffect(() => {
    // Only reset error when user is actively typing (pin length > 0)
    // Don't reset when pin is cleared programmatically after errors
    if (pin.length > 0) {
      resetState();
    }
  }, [pin]);

  const handlePinChange = (value: string) => {
    setPin(value);
    setError("");
    if (onPinChange) {
      onPinChange(value);
    }
  };

  // Request wallet signature for deterministic meta key generation
  const requestWalletSignature = async (pinCode: string): Promise<string> => {
    const wallet = getAptosWallet();
    if (!wallet || !aptosAccount) {
      throw new Error("No wallet connected");
    }

    const message = `SHINGRU | Deterministic Meta Keys | Aptos Network\nPIN: ${pinCode}`;

    console.log("🔐 Requesting wallet signature for meta key derivation...");
    console.log("📱 Please check your wallet extension for a signature request!");
    
    setWaitingForSignature(true);

    try {
      // Add timeout to prevent infinite waiting
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error("Wallet signature request timed out after 60 seconds. Please check your wallet extension."));
        }, 60000); // 60 second timeout
      });

      const signPromise = wallet.signMessage({
        message: message,
        nonce: Date.now().toString(),
      });

      const signResult = await Promise.race([signPromise, timeoutPromise]);

      if (!signResult?.signature) {
        throw new Error("Failed to get signature from wallet");
      }

      console.log("✅ Wallet signature received");
      setWaitingForSignature(false);

      return signResult.signature;
    } catch (error) {
      console.error("❌ Failed to get wallet signature:", error);
      setWaitingForSignature(false);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Failed to get wallet signature. Please try again.");
    }
  };

  const handleSetPIN = async () => {
    if (pin.length !== 6) {
      playSound(Sound.ERROR, {
        interrupt: true,
      });
      setError("Please enter a 6-digit PIN");
      return;
    }

    try {
      setIsLoading(true);
      setError("");

      const aptosWallet = wallets.find((w) => w.chain === "APTOS");

      if (hasEncryptedKeys && !hasExistingKeys) {
        const unlocked = await unlockMetaKeysWithPin(pin);
        if (!unlocked) {
          playSound(Sound.ERROR, {
            interrupt: true,
          });
          setError("Incorrect PIN. Please try again.");
          setPin("");
          return;
        }

        // Request signature immediately before meta key generation for Safari compatibility
        let signature: string;
        try {
          signature = await requestWalletSignature(pin);
          console.log(
            "Signature obtained for meta key regeneration:",
            signature
          );
        } catch (error) {
          console.error(
            "Failed to get wallet signature for regeneration:",
            error
          );
          playSound(Sound.ERROR, { interrupt: true });
          setError("Failed to get wallet signature. Please try again.");
          setPin("");
          return;
        }

        setMetaKeyOperationInProgress(true);
        let metaKeysResult;
        try {
          metaKeysResult = await generateAptosMetaKeys(pin, wallets, signature);
        } finally {
          setMetaKeyOperationInProgress(false);
        }
        console.log("Meta keys result", metaKeysResult);

        if (!metaKeysResult) {
          setError("Failed to regenerate meta keys for registration.");
          playSound(Sound.ERROR, {
            interrupt: true,
          });
          setPin("");
          return;
        }

        const { aptos: aptosMetaKeys } = metaKeysResult;

        const keysToSave = {
          APTOS:
            aptosWallet && aptosMetaKeys
              ? {
                  address: aptosWallet.address,
                  metaSpendPriv: aptosMetaKeys.metaSpendPriv,
                  metaSpendPub: aptosMetaKeys.metaSpendPub,
                  metaViewPriv: aptosMetaKeys.metaViewPriv,
                  metaViewPub: aptosMetaKeys.metaViewPub,
                }
              : undefined,
        };

        const saved = await saveMetaKeys(keysToSave, pin);
        if (!saved) {
          setError("Failed to save keys securely. Please try again.");
          setPin("");
          return;
        }

        const metaDataToSend = {
          metaKeys: [
            ...(aptosWallet && aptosMetaKeys
              ? [
                  {
                    chain: "APTOS" as const,
                    address: aptosWallet.address,
                    metaSpendPriv: aptosMetaKeys.metaSpendPriv,
                    metaSpendPub: aptosMetaKeys.metaSpendPub,
                    metaViewPub: aptosMetaKeys.metaViewPub,
                    metaViewPriv: aptosMetaKeys.metaViewPriv,
                  },
                ]
              : []),
          ],
        };

        const res = await backend.auth.registerMetaKeys(
          accessToken!,
          metaDataToSend
        );

        if (res.error && !res.error.includes("Backend not configured")) {
          throw new Error(`Meta keys registration failed: ${res.error}`);
        } else if (res.error) {
          console.warn("Skipping meta key registration (backend-less mode)");
          
          // Save to Supabase directly in backend-less mode
          try {
            const { supabase } = await import("@/lib/supabase/client");
            
            if (aptosWallet && aptosMetaKeys && me) {
              // Check if wallet already exists
              const { data: existingWallet } = await supabase
                .from("wallets")
                .select("*")
                .eq("user_id", me.id)
                .eq("chain", "APTOS")
                .single();

              if (existingWallet) {
                // Update existing wallet
                await supabase
                  .from("wallets")
                  .update({
                    meta_spend_pub: aptosMetaKeys.metaSpendPub,
                    meta_view_pub: aptosMetaKeys.metaViewPub,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", me.id)
                  .eq("chain", "APTOS");
                
                console.log("✅ Wallet meta keys updated in Supabase");
              } else {
                // Insert new wallet
                await supabase
                  .from("wallets")
                  .insert({
                    user_id: me.id,
                    chain: "APTOS",
                    wallet_address: aptosWallet.address,
                    meta_spend_pub: aptosMetaKeys.metaSpendPub,
                    meta_view_pub: aptosMetaKeys.metaViewPub,
                  });
                
                console.log("✅ Wallet created in Supabase");
              }
            }
          } catch (supabaseError) {
            console.error("Failed to save wallet to Supabase:", supabaseError);
          }
        }

        await fetchMe();
        setSuccess(true);
        playSound(Sound.SUCCESS_POP, {
          interrupt: true,
        });

        if (onNext && isNewAccount) {
          onNext();
        }
      } else {
        // Request signature immediately before meta key generation for Safari compatibility
        let signature: string;
        try {
          signature = await requestWalletSignature(pin);
          console.log(
            "Signature obtained for new meta key generation:",
            signature
          );
        } catch (error) {
          console.error(
            "Failed to get wallet signature for new generation:",
            error
          );
          playSound(Sound.ERROR, { interrupt: true });
          setError("Failed to get wallet signature. Please try again.");
          setPin("");
          return;
        }

        setMetaKeyOperationInProgress(true);
        let metaKeysResult;
        try {
          let retryCount = 0;
          const maxRetries = 3;

          while (retryCount < maxRetries) {
            try {
              metaKeysResult = await generateAptosMetaKeys(
                pin,
                wallets,
                signature
              );
              break;
            } catch (error) {
              retryCount++;
              if (
                error instanceof Error &&
                error.message.includes("Wallet not ready")
              ) {
                if (retryCount < maxRetries) {
                  await new Promise((resolve) => setTimeout(resolve, 2000));
                  continue;
                }
              }
              throw error;
            }
          }
        } finally {
          setMetaKeyOperationInProgress(false);
        }

        if (!metaKeysResult) {
          throw new Error(
            "Failed to generate meta keys after multiple attempts"
          );
        }

        const { aptos: aptosMetaKeys } = metaKeysResult;

        if (hasExistingKeys) {
          const aptosWallet = me?.wallets?.find(
            (wallet) => wallet.chain === "APTOS"
          );

          // Verify PIN by checking generated keys match existing keys
          let pinIsCorrect = true;

          // Check Aptos keys if they exist in both generated and stored
          if (aptosMetaKeys && aptosWallet?.metaKeys) {
            if (
              aptosMetaKeys.metaViewPub !== aptosWallet.metaKeys.metaViewPub ||
              aptosMetaKeys.metaSpendPub !== aptosWallet.metaKeys.metaSpendPub
            ) {
              pinIsCorrect = false;
            }
          }

          console.log("pinIsCorrect", pinIsCorrect);

          if (!pinIsCorrect) {
            console.log("Incorrect PIN. Please try again.");
            playSound(Sound.ERROR, {
              interrupt: true,
            });
            setError("Incorrect PIN. Please try again.");
            setPin("");
            return;
          }

          const keysToSave = {
            APTOS:
              aptosMetaKeys && aptosWallet
                ? {
                    address: aptosWallet.walletAddress,
                    metaSpendPriv: aptosMetaKeys.metaSpendPriv,
                    metaSpendPub: aptosMetaKeys.metaSpendPub,
                    metaViewPriv: aptosMetaKeys.metaViewPriv,
                    metaViewPub: aptosMetaKeys.metaViewPub,
                  }
                : undefined,
          };

          const saved = await saveMetaKeys(keysToSave, pin);
          if (saved) {
            setSuccess(true);
            playSound(Sound.SUCCESS_POP, {
              interrupt: true,
            });
            if (onNext && isNewAccount) {
              onNext();
            }
          } else {
            playSound(Sound.ERROR, {
              interrupt: true,
            });
            setError("Failed to save keys securely. Please try again.");
            setPin("");
          }
        } else {
          const keysToSave = {
            APTOS:
              aptosWallet && aptosMetaKeys
                ? {
                    address: aptosWallet.address,
                    metaSpendPriv: aptosMetaKeys.metaSpendPriv,
                    metaSpendPub: aptosMetaKeys.metaSpendPub,
                    metaViewPriv: aptosMetaKeys.metaViewPriv,
                    metaViewPub: aptosMetaKeys.metaViewPub,
                  }
                : undefined,
          };

          const saved = await saveMetaKeys(keysToSave, pin);
          if (!saved) {
            playSound(Sound.ERROR, {
              interrupt: true,
            });
            setError("Failed to save keys securely. Please try again.");
            setPin("");
            return;
          }

          const metaDataToSend = {
            metaKeys: [
              ...(aptosWallet && aptosMetaKeys
                ? [
                    {
                      chain: "APTOS" as const,
                      address: aptosWallet.address,
                      metaSpendPriv: aptosMetaKeys.metaSpendPriv,
                      metaSpendPub: aptosMetaKeys.metaSpendPub,
                      metaViewPub: aptosMetaKeys.metaViewPub,
                      metaViewPriv: aptosMetaKeys.metaViewPriv,
                    },
                  ]
                : []),
            ],
          };

          const res = await backend.auth.registerMetaKeys(
            accessToken!,
            metaDataToSend
          );

          if (res.error && !res.error.includes("Backend not configured")) {
            throw new Error(`Meta keys registration failed: ${res.error}`);
          } else if (res.error) {
            console.warn("Skipping meta key registration (backend-less mode)");
            
            // Save to Supabase directly in backend-less mode
            try {
              const { supabase } = await import("@/lib/supabase/client");
              
              if (aptosWallet && aptosMetaKeys && me) {
                // Check if wallet already exists
                const { data: existingWallet } = await supabase
                  .from("wallets")
                  .select("*")
                  .eq("user_id", me.id)
                  .eq("chain", "APTOS")
                  .single();

                if (existingWallet) {
                  // Update existing wallet
                  await supabase
                    .from("wallets")
                    .update({
                      meta_spend_pub: aptosMetaKeys.metaSpendPub,
                      meta_view_pub: aptosMetaKeys.metaViewPub,
                      updated_at: new Date().toISOString(),
                    })
                    .eq("user_id", me.id)
                    .eq("chain", "APTOS");
                  
                  console.log("✅ Wallet meta keys updated in Supabase");
                } else {
                  // Insert new wallet
                  await supabase
                    .from("wallets")
                    .insert({
                      user_id: me.id,
                      chain: "APTOS",
                      wallet_address: aptosWallet.address,
                      meta_spend_pub: aptosMetaKeys.metaSpendPub,
                      meta_view_pub: aptosMetaKeys.metaViewPub,
                    });
                  
                  console.log("✅ Wallet created in Supabase");
                }
              }
            } catch (supabaseError) {
              console.error("Failed to save wallet to Supabase:", supabaseError);
            }
          }

          await fetchMe();
          setSuccess(true);
          playSound(Sound.SUCCESS_POP, {
            interrupt: true,
          });
          if (onNext && isNewAccount) {
            onNext();
          }
        }
      }
    } catch (error) {
      playSound(Sound.ERROR, {
        interrupt: true,
      });
      console.error("❌ Error with meta keys:", error);
      setPin("");

      if (error instanceof Error) {
        if (
          error.message.includes("Too many concurrent authentication requests")
        ) {
          setError("Too many requests. Please wait a moment and try again.");
        } else if (error.message.includes("Wallet not ready")) {
          setError("Wallet initializing. Please wait a moment and try again.");
        } else if (error.message.includes("User must be authenticated")) {
          setError("Authentication issue. Redirecting to login...");
        } else if (error.message.includes("Wallet not found")) {
          setError("Wallet connection issue. Refreshing page...");
        } else {
          setError(
            "Something went wrong. Try refreshing the page or logging out and back in."
          );
        }
      } else {
        setError(
          "Something went wrong. Try refreshing the page or logging out and back in."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full">
      {/* Main content */}
      <div className="text-center mb-8 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, type: "tween", ease: EASE_OUT_QUART }}
          className="mb-6 flex justify-center"
        >
          <Image
            src="/assets/cute/login-cat-with-phone.png"
            width={80}
            height={80}
            alt="Cute cat"
            className="w-20 h-20 object-contain"
          />
        </motion.div>

        <motion.h1
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.05,
            duration: 0.5,
            type: "tween",
            ease: EASE_OUT_QUART,
          }}
          className="text-3xl md:text-4xl font-extrabold text-gray-900 mb-4"
        >
          {isNewAccount ? "Set Your PIN" : "Enter Your PIN"}
        </motion.h1>

        <motion.p
          initial={{ y: 10, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{
            delay: 0.1,
            duration: 0.5,
            type: "tween",
            ease: EASE_OUT_QUART,
          }}
          className="text-gray-500 text-base md:text-lg leading-tight max-w-sm mx-auto text-balance"
        >
          {isNewAccount
            ? "Create a 6-digit PIN to protect and recover your meta keys."
            : "Enter your PIN to unlock your meta keys and access your account."}
        </motion.p>
      </div>

      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.15,
          duration: 0.5,
          type: "tween",
          ease: EASE_OUT_QUART,
        }}
        className="mb-0"
      >
        <div className="w-full">
          <CustomPinInput
            value={pin}
            onChange={handlePinChange}
            onComplete={handleSetPIN}
            length={6}
            isLoading={isLoading}
            disabled={isLoading || success}
            hideNumbers={!isNewAccount}
          />
        </div>

        {/* Waiting for signature message */}
        <AnimatePresence initial={false}>
          {waitingForSignature && (
            <motion.div
              className="text-center mt-6 mb-4"
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <div className="flex flex-col items-center gap-3">
                <div className="loading loading-dots w-10 text-primary-600"></div>
                <div className="text-sm font-medium text-gray-700">
                  Waiting for wallet signature...
                </div>
                <div className="text-xs text-gray-500 max-w-xs">
                  Please check your Aptos wallet extension and approve the signature request.
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Error message with smooth height animation */}

        <div className="h-6"></div>

        <AnimatePresence initial={false}>
          {error && (
            <motion.div
              className="text-center relative flex items-end justify-center"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <p className="text-sm invisible">{error}</p>
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="text-red-500 text-sm font-medium inline-block absolute bottom-0 "
              >
                {error}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Success message with smooth height animation */}
        <AnimatePresence initial={false}>
          {success && (
            <motion.div
              className="text-center relative flex items-center justify-center"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 30,
              }}
            >
              <p className="text-primary-600 text-sm font-medium invisible">
                {isNewAccount
                  ? "Meta keys created successfully!"
                  : "PIN verified successfully!"}
              </p>
              <motion.p
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
                className="text-primary-600 text-sm font-medium inline-block absolute bottom-0 "
                onAnimationComplete={() => {
                  if (onComplete) {
                    setTimeout(() => {
                      onComplete();
                    }, 500);
                  }
                }}
              >
                {isNewAccount
                  ? "Meta keys created successfully!"
                  : "PIN verified successfully!"}
              </motion.p>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-6"></div>
      </motion.div>

      {/* Warning section */}
      <motion.div
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{
          delay: 0.2,
          duration: 0.5,
          type: "tween",
          ease: EASE_OUT_QUART,
        }}
      >
        <div className="flex items-start gap-4 rounded-3xl bg-gray-50 p-4">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-50">
            <ExclamationTriangleIcon className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-xs md:text-sm">
            <h3 className="font-semibold text-gray-800">Save Your PIN</h3>
            <p className="mt-1 text-gray-600 leading-relaxed">
              Your PIN cannot be changed or recovered. If you forget it, you
              will{" "}
              <span className="font-semibold text-red-600">lose access</span> to
              your account.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

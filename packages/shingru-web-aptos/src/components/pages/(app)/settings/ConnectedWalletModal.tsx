import { useAuth } from "@/providers/AuthProvider";
import { useMetaKeys } from "@/providers/MetaKeysProvider";
import CuteModal from "@/components/common/CuteModal";
import { shortenId } from "@/utils/misc";
import { getChainLogo } from "@/utils/misc";
import Image from "next/image";
import { useState, useEffect } from "react";
import { Check, Copy, AlertCircle } from "lucide-react";
import MainButton from "@/components/common/MainButton";
import CustomPinInput from "@/components/common/CustomPinInput";

interface ConnectedWalletModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function ConnectedWalletModal({
  isOpen,
  onClose,
}: ConnectedWalletModalProps) {
  const { me, wallets: authWallets } = useAuth();
  const { metaKeys, isMetaKeysLoaded, unlockMetaKeysWithPin } = useMetaKeys();
  
  // Debug: Log metaKeys changes
  useEffect(() => {
    console.log("🔍 ConnectedWalletModal - metaKeys state changed:", {
      isMetaKeysLoaded,
      hasMetaKeys: !!metaKeys?.APTOS,
      metaSpendPub: metaKeys?.APTOS?.metaSpendPub?.substring(0, 20) + "...",
      metaViewPub: metaKeys?.APTOS?.metaViewPub?.substring(0, 20) + "...",
    });
  }, [isMetaKeysLoaded, metaKeys]);
  
  const [copyingAddress, setCopyingAddress] = useState<string | null>(null);
  const [copiedAddress, setCopiedAddress] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasWalletInSupabase, setHasWalletInSupabase] = useState<boolean | null>(null);
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [unlockError, setUnlockError] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const wallets = me?.wallets || [];
  
  // Check if wallet exists in Supabase
  useEffect(() => {
    if (!isOpen || !me) return;
    
    const checkWallet = async () => {
      try {
        const { supabase } = await import("@/lib/supabase/client");
        const aptosWallet = authWallets?.find((w) => w.chain === "APTOS");
        
        if (!aptosWallet) {
          setHasWalletInSupabase(false);
          return;
        }

        const { data, error } = await supabase
          .from("wallets")
          .select("id, meta_spend_pub, meta_view_pub")
          .eq("user_id", me.id)
          .eq("chain", "APTOS")
          .maybeSingle();

        if (error && error.code !== 'PGRST116') {
          console.error("Error checking wallet:", error);
          setHasWalletInSupabase(null);
          return;
        }

        setHasWalletInSupabase(!!data && !!data.meta_spend_pub && !!data.meta_view_pub);
      } catch (error) {
        console.error("Error checking wallet in Supabase:", error);
        setHasWalletInSupabase(null);
      }
    };

    checkWallet();
  }, [isOpen, me, authWallets, isMetaKeysLoaded, refreshTrigger]);

  const handleCopyAddress = async (address: string) => {
    if (copiedAddress === address || copyingAddress === address) return;

    setCopyingAddress(address);

    await navigator.clipboard.writeText(address);
    setCopiedAddress(address);
    setTimeout(() => {
      setCopiedAddress(null);
      setCopyingAddress(null);
    }, 2000); // Reset after 2 seconds
  };

  const handleSaveWalletToSupabase = async () => {
    if (!me || !authWallets || !metaKeys?.APTOS) {
      setSaveError("Missing required data. Please make sure your wallet is connected and meta keys are unlocked.");
      return;
    }

    setIsSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      const { supabase } = await import("@/lib/supabase/client");
      const aptosWallet = authWallets.find((w) => w.chain === "APTOS");
      
      if (!aptosWallet) {
        throw new Error("No Aptos wallet found");
      }

      const aptosMetaKeys = metaKeys.APTOS;
      if (!aptosMetaKeys.metaSpendPub || !aptosMetaKeys.metaViewPub) {
        throw new Error("Meta keys not available. Please unlock your wallet first.");
      }

      // Check if wallet already exists
      const { data: existingWallet } = await supabase
        .from("wallets")
        .select("*")
        .eq("user_id", me.id)
        .eq("chain", "APTOS")
        .maybeSingle();

      if (existingWallet) {
        // Update existing wallet
        const { error: updateError } = await supabase
          .from("wallets")
          .update({
            wallet_address: aptosWallet.address,
            meta_spend_pub: aptosMetaKeys.metaSpendPub,
            meta_view_pub: aptosMetaKeys.metaViewPub,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", me.id)
          .eq("chain", "APTOS");

        if (updateError) {
          throw new Error(`Failed to update wallet: ${updateError.message}`);
        }

        console.log("✅ Wallet meta keys updated in Supabase");
      } else {
        // Insert new wallet
        const { error: insertError } = await supabase
          .from("wallets")
          .insert({
            user_id: me.id,
            chain: "APTOS",
            wallet_address: aptosWallet.address,
            meta_spend_pub: aptosMetaKeys.metaSpendPub,
            meta_view_pub: aptosMetaKeys.metaViewPub,
          });

        if (insertError) {
          throw new Error(`Failed to create wallet: ${insertError.message}`);
        }

        console.log("✅ Wallet created in Supabase");
      }

      setSaveSuccess(true);
      setHasWalletInSupabase(true);
      
      // Refresh after a moment
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (error: any) {
      console.error("Error saving wallet to Supabase:", error);
      setSaveError(error.message || "Failed to save wallet. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <>
      <CuteModal
        key={`wallet-modal-${refreshTrigger}-${isMetaKeysLoaded}-${!!metaKeys?.APTOS}`}
        isOpen={isOpen}
        onClose={onClose}
        title="Connected Wallets"
        size="lg"
        withHandle={true}
      >
        <div className="space-y-4">
          {/* Wallet Setup Warning */}
          {hasWalletInSupabase === false && (
            <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-2xl">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-yellow-900 mb-1">
                    Wallet Setup Required
                  </h3>
                  <p className="text-xs text-yellow-800 mb-3">
                    Your wallet is connected but not set up for payments. Save your public keys to enable payment links.
                  </p>
                  
                  {(() => {
                    // Debug logging
                    console.log("🔍 Render check:", {
                      isMetaKeysLoaded,
                      hasMetaKeys: !!metaKeys?.APTOS,
                      metaSpendPub: metaKeys?.APTOS?.metaSpendPub,
                      metaViewPub: metaKeys?.APTOS?.metaViewPub,
                    });

                    if (!isMetaKeysLoaded || !metaKeys?.APTOS) {
                      return (
                        <div className="space-y-3">
                          <div className="p-3 bg-white rounded-lg border border-yellow-200">
                            <p className="text-xs text-yellow-900 mb-3">
                              Please unlock your wallet with your PIN first to access your meta keys.
                            </p>
                            <MainButton
                              onClick={() => setIsUnlockModalOpen(true)}
                              className="w-full"
                            >
                              Unlock Wallet
                            </MainButton>
                          </div>
                        </div>
                      );
                    }

                    if (metaKeys.APTOS.metaSpendPub && metaKeys.APTOS.metaViewPub) {
                      return (
                        <div className="space-y-2 mb-3">
                          <div className="text-xs">
                            <span className="font-medium text-yellow-900">Meta Spend Pub:</span>
                            <div className="mt-1 p-2 bg-white rounded-lg border border-yellow-200 font-mono text-[10px] break-all">
                              {metaKeys.APTOS.metaSpendPub}
                            </div>
                          </div>
                          <div className="text-xs">
                            <span className="font-medium text-yellow-900">Meta View Pub:</span>
                            <div className="mt-1 p-2 bg-white rounded-lg border border-yellow-200 font-mono text-[10px] break-all">
                              {metaKeys.APTOS.metaViewPub}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="p-3 bg-white rounded-lg border border-yellow-200 mb-3">
                        <p className="text-xs text-yellow-900">
                          Meta keys not available. Please complete onboarding to generate your keys.
                        </p>
                      </div>
                    );
                  })()}
                  
                  {isMetaKeysLoaded && metaKeys?.APTOS?.metaSpendPub && metaKeys?.APTOS?.metaViewPub && (
                    <>
                      <MainButton
                        onClick={handleSaveWalletToSupabase}
                        isLoading={isSaving}
                        disabled={isSaving}
                        className="w-full"
                      >
                        {isSaving ? "Saving..." : "Save Wallet to Database"}
                      </MainButton>
                      {saveError && (
                        <p className="text-xs text-red-600 mt-2">{saveError}</p>
                      )}
                      {saveSuccess && (
                        <p className="text-xs text-green-600 mt-2">✅ Wallet saved successfully! Refreshing...</p>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>
          )}

          {wallets.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No connected wallets found
            </div>
          ) : (
            <div className="space-y-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="flex items-center justify-between p-4 rounded-2xl bg-white border border-black/10 shadow-supa-smooth"
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                        <Image
                          src={getChainLogo(wallet.chain, true) || ""}
                          alt={wallet.chain}
                          width={40}
                          height={40}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    </div>
                    <div className="flex flex-col">
                      <span className="font-medium text-gray-900">
                        {wallet.chain} Wallet
                      </span>
                      <button
                        onClick={() => handleCopyAddress(wallet.walletAddress)}
                        disabled={
                          copyingAddress === wallet.walletAddress ||
                          copiedAddress === wallet.walletAddress
                        }
                        className="mt-1 inline-flex items-center gap-1.5 self-start rounded-full bg-gray-100 px-2 py-1 text-xs text-gray-500 transition-colors hover:bg-gray-200 disabled:cursor-default disabled:bg-gray-100"
                      >
                        <span className="">
                          {copiedAddress === wallet.walletAddress
                            ? "Copied!"
                            : shortenId(wallet.walletAddress, 6, 4)}
                        </span>
                        {copiedAddress === wallet.walletAddress ? (
                          <Check className="h-3 w-3 text-emerald-500" />
                        ) : copyingAddress === wallet.walletAddress ? (
                          <Check className="h-3 w-3 text-gray-400" />
                        ) : (
                          <Copy className="h-3 w-3 text-gray-400" />
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {wallets.length > 0 && (
            <div className="mt-6 text-xs text-gray-400 text-center">
              Your connected wallets are only used to cryptographically generate
              your private payment address. They are never used for
              transactions, ensuring your payment activity remains separate and
              private.
            </div>
          )}
        </div>
      </CuteModal>

      {/* PIN Unlock Modal */}
      <CuteModal
        isOpen={isUnlockModalOpen}
        onClose={() => {
          setIsUnlockModalOpen(false);
          setPin("");
          setUnlockError(null);
        }}
        title="Unlock Wallet"
        size="md"
        withHandle={true}
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600 text-center">
            Enter your 6-digit PIN to unlock your wallet and access your meta keys.
          </p>

          <div className="flex justify-center">
              <CustomPinInput
              value={pin}
              onChange={setPin}
              length={6}
              disabled={isUnlocking}
              onComplete={async (enteredPin) => {
                setIsUnlocking(true);
                setUnlockError(null);

                try {
                  console.log("Unlocking wallet with PIN...");
                  const unlocked = await unlockMetaKeysWithPin(enteredPin);
                  
                  if (unlocked) {
                    console.log("✅ Wallet unlocked successfully");
                    // Wait a moment for state to propagate
                    await new Promise(resolve => setTimeout(resolve, 300));
                    
                    // Check if metaKeys are now available
                    console.log("🔍 After unlock - checking metaKeys:", {
                      isMetaKeysLoaded,
                      hasMetaKeys: !!metaKeys?.APTOS,
                    });
                    
                    // Close unlock modal and reset state
                    setIsUnlockModalOpen(false);
                    setPin("");
                    setUnlockError(null);
                    
                    // Force a re-render by updating refresh trigger
                    setRefreshTrigger(prev => prev + 1);
                    console.log("🔄 Refresh trigger updated, UI should refresh");
                  } else {
                    console.error("❌ Failed to unlock - incorrect PIN");
                    setUnlockError("Incorrect PIN. Please try again.");
                    setPin("");
                  }
                } catch (error: any) {
                  console.error("Error unlocking wallet:", error);
                  setUnlockError(error.message || "Failed to unlock wallet. Please try again.");
                  setPin("");
                } finally {
                  setIsUnlocking(false);
                }
              }}
            />
          </div>

          {unlockError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-600">{unlockError}</p>
            </div>
          )}

          {isUnlocking && (
            <div className="text-center">
              <p className="text-xs text-gray-500">Unlocking wallet...</p>
            </div>
          )}
        </div>
      </CuteModal>
    </>
  );
}

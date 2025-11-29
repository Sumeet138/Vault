import React, { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import TokenInput from "./TokenInput";
import AptosPayButton from "./AptosPayButton";
import CollectInfoForm from "./CollectInfoForm";
import WalletSelectModal from "./WalletSelectModal";
import { usePay } from "@/providers/PayProvider";
import { EASE_OUT_QUART } from "@/config/animation";
import { Textarea } from "@/components/ui/textarea";
import StaticTokenInput from "./StaticTokenInput";
import { userService, ChainId } from "@/lib/api/user";
import { SupportedChain } from "@/config/chains";
import { serializeFormattedStringToFloat } from "@/utils/formatting";

// Convert chain to API chain ID
const getChainId = (chain: SupportedChain): ChainId => {
  switch (chain) {
    case "APTOS":
      return process.env.NEXT_PUBLIC_IS_TESTNET === "true" ? "IOTA_TESTNET" : "IOTA_MAINNET";
    default:
      return "IOTA_TESTNET";
  }
};

export default function PaymentInterface() {
  const {
    selectedChain,
    wallet,
    amount,
    setAmount,
    paymentNote,
    setPaymentNote,
    selectedToken,
    setSelectedToken,
    addressData,
    paymentSuccess,
    setPaymentSuccess,
    currentColor,
    collectInfoData,
    setCollectInfoData,
    isWalletModalOpen,
    setIsWalletModalOpen,
  } = usePay();

  // Convert network-specific chains to wallet chains
  const getWalletChain = (chain: string): string => {
    if (
      chain === "IOTA_TESTNET" ||
      chain === "APTOS" ||
      chain === "IOTA_MAINNET"
    ) {
      return "APTOS";
    }
    return chain;
  };

  const walletChain = selectedChain ? getWalletChain(selectedChain) : null;

  const [collectInfoErrors, setCollectInfoErrors] = useState({});
  const [fixedTokenBalance, setFixedTokenBalance] = useState<number | null>(null);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);

  // Fundraisers should always allow open amounts, even with a goal
  const isFundraiser = addressData?.linkData?.template === "fundraiser";
  // Backend-less mode: always use open amount if no linkData
  const isFixedPrice = addressData?.linkData ? (addressData.linkData.amountType === "FIXED" && !isFundraiser) : false;
  const chainDataForFixedPrice = isFixedPrice
    ? addressData?.chains?.[selectedChain!]
    : null;
  const tokenForFixedPrice =
    chainDataForFixedPrice?.mint && isFixedPrice
      ? {
        name: chainDataForFixedPrice.mint.name,
        symbol: chainDataForFixedPrice.mint.symbol,
        address: chainDataForFixedPrice.mint.mintAddress,
        decimals: chainDataForFixedPrice.mint.decimals,
        image: chainDataForFixedPrice.mint.imageUrl,
        isNative: chainDataForFixedPrice.mint.isNative,
      }
      : null;

  // Fetch balance for fixed token
  useEffect(() => {
    const fetchBalance = async () => {
      if (
        !isFixedPrice ||
        !wallet.connected ||
        !wallet.publicKey ||
        !walletChain
      ) {
        setFixedTokenBalance(null);
        return;
      }

      const mintAddress = addressData?.chains?.[selectedChain!]?.mint?.mintAddress;
      if (!mintAddress) {
        setFixedTokenBalance(null);
        return;
      }

      setIsLoadingBalance(true);
      try {
        const chainId = getChainId(walletChain as SupportedChain);
        const response = await userService.getBalance(wallet.publicKey, chainId);

        if (response.data) {
          const tokenBalances =
            "tokenBalance" in response.data
              ? response.data.tokenBalance
              : response.data.splBalance;

          const allTokens = [
            {
              ...response.data.nativeBalance,
              isNative: true,
              tokenAmount: response.data.nativeBalance.amount,
            },
            ...tokenBalances,
          ];

          const foundToken = allTokens.find(
            (t) =>
              t.mint === mintAddress ||
              // Handle native APTOS case where mint address is "0x2::aptos::APTOS"
              ((t as any).isNative &&
                walletChain === "APTOS" &&
                mintAddress.includes("::aptos::APTOS"))
          );

          setFixedTokenBalance(foundToken ? foundToken.tokenAmount : 0);
        } else {
          setFixedTokenBalance(0);
        }
      } catch (error) {
        console.error("Failed to fetch balance for fixed token:", error);
        setFixedTokenBalance(null);
      } finally {
        setIsLoadingBalance(false);
      }
    };

    fetchBalance();
  }, [
    isFixedPrice,
    wallet.connected,
    wallet.publicKey,
    walletChain,
    selectedChain,
    addressData,
  ]);

  // Memoize the TokenInput onChange callback to prevent infinite re-renders for open payments
  const handleTokenInputChange = useCallback(
    (output: any) => {
      // This handler is for open payments only
      if (isFixedPrice) return;

      if (output) {
        setAmount(output.rawAmount);
        setSelectedToken({
          symbol: output.token.symbol,
          decimals: output.token.decimals,
          isNative: output.token.isNative,
          address: output.token.address,
        });
      } else {
        setAmount("");
        setSelectedToken(null);
      }
    },
    [isFixedPrice, setAmount, setSelectedToken]
  );

  // Check if collect info is required and validate it
  const collectInfoValidation = useMemo(() => {
    // Backend-less mode: no collect info required if no linkData
    const collectFields = addressData?.linkData?.collectFields;
    const isRequired =
      collectFields &&
      (collectFields.name || collectFields.email || collectFields.telegram);

    if (!isRequired || !addressData?.linkData) return { required: false, isValid: true, errors: {} };

    const errors: any = {};

    if (collectFields.name && !collectInfoData.name.trim()) {
      errors.name = "Name is required";
    }
    if (collectFields.email) {
      if (!collectInfoData.email.trim()) {
        errors.email = "Email is required";
      } else if (!/^\S+@\S+\.\S+$/.test(collectInfoData.email)) {
        errors.email = "Email address is invalid";
      }
    }
    if (collectFields.telegram && !collectInfoData.telegram.trim()) {
      errors.telegram = "Telegram is required";
    }

    const isValid = Object.keys(errors).length === 0;

    return {
      required: true,
      isValid,
      errors,
    };
  }, [addressData, collectInfoData]);

  // Handle collect info form changes
  const handleCollectInfoChange = useCallback(
    (data: any) => {
      setCollectInfoData(data);
      // Clear errors when user types
      setCollectInfoErrors({});
    },
    [setCollectInfoData]
  );

  // Handle payment error
  const handlePaymentError = useCallback((error: any) => {
    console.log("Payment error:", error);
    // Handle error state here if needed
  }, []);

  const handlePrePaymentValidation = useCallback(() => {
    if (collectInfoValidation.required && !collectInfoValidation.isValid) {
      setCollectInfoErrors(collectInfoValidation.errors);
      console.log("Payment blocked: collect info validation failed");
      return false;
    }
    return true;
  }, [collectInfoValidation, setCollectInfoErrors]);

  const handlePaymentSuccess = useCallback(
    async (txHash: string) => {
      console.log("Payment successful!", txHash);

      // Record payment with collect info data to backend
      try {
        const paymentData = {
          linkId: addressData?.linkData?.id || "",
          transactionSignature: txHash,
          amount: serializeFormattedStringToFloat(amount),
          tokenSymbol: selectedToken?.symbol || "",
          tokenAddress: selectedToken?.address || "",
          sourceChain: selectedChain || "",
          paymentNote: paymentNote,
          collectInfo: collectInfoValidation.required
            ? collectInfoData
            : undefined,
        };

        console.log("Recording payment:", paymentData);
        // const result = await backend.payments.recordPayment(paymentData);

        // if (result.data?.success) {
        //   console.log("Payment recorded successfully:", result.data);
        // } else {
        //   console.log("Payment recording failed:", result.error);
        // }
      } catch (error) {
        console.log("Error recording payment:", error);
        // Don't block the success flow if recording fails
      }

      setPaymentSuccess({
        signature: txHash,
        amount: serializeFormattedStringToFloat(amount),
        token: selectedToken,
        timestamp: Date.now(),
        sourceChain: selectedChain,
        collectInfo: collectInfoValidation.required
          ? collectInfoData
          : undefined,
      });
    },
    [
      amount,
      selectedToken,
      selectedChain,
      setPaymentSuccess,
      collectInfoData,
      addressData,
      paymentNote,
      collectInfoValidation,
    ]
  );

  if (paymentSuccess) return null;

  // Check if wallet is set up (meta keys available)
  const hasWalletSetup = addressData?.chains?.APTOS?.metaSpendPub && addressData?.chains?.APTOS?.metaViewPub;

  return (
    <>
      <AnimatePresence mode="wait">
        <div className="w-full max-w-lg mx-auto" key="payment-form">
          {/* Warning if wallet not set up */}
          {!hasWalletSetup && addressData && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-yellow-800">
                    This user hasn't set up their wallet yet
                  </p>
                  <p className="text-xs text-yellow-700 mt-1">
                    Payments cannot be processed until they complete onboarding.
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {wallet.connected && (
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.4, ease: EASE_OUT_QUART }}
              className="space-y-8"
            >
              {/* Amount Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.05 }}
                className="space-y-3"
              >
                {isFixedPrice && tokenForFixedPrice ? (
                  <StaticTokenInput
                    amount={amount}
                    token={tokenForFixedPrice}
                    balance={fixedTokenBalance}
                    isLoadingBalance={isLoadingBalance}
                  />
                ) : addressData?.linkData ? (
                  <TokenInput
                    chain={walletChain as any}
                    address={wallet.publicKey || ""}
                    defaultToken="APTOS"
                    onChange={handleTokenInputChange}
                  />
                ) : (
                  // Backend-less mode: use predefined tokens
                  <TokenInput
                    mode="predefined"
                    tokens={[
                      {
                        name: "Aptos",
                        symbol: "APT",
                        address: "0x1::aptos_coin::AptosCoin",
                        decimals: 8,
                        isNative: true,
                      },
                    ]}
                    defaultToken="APT"
                    onChange={handleTokenInputChange}
                    isShowMax={false}
                  />
                )}
              </motion.div>

              {/* Payment Note Section */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.1 }}
                className="space-y-2"
              >
                <div className="relative">
                  <Textarea
                    className="w-full min-h-28 rounded-2xl border border-gray-200 bg-white p-4 text-sm text-gray-900 placeholder:text-gray-400 focus-visible:border-primary-500 focus-visible:ring-2 focus-visible:ring-primary-100 transition-all resize-none"
                    placeholder="Add a note to this payment (optional)"
                    value={paymentNote}
                    onChange={(e) => setPaymentNote(e.target.value)}
                    rows={3}
                  />
                </div>
              </motion.div>

              {/* Collect Info Form */}
              {collectInfoValidation.required && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.15 }}
                >
                  <CollectInfoForm
                    formData={collectInfoData}
                    onFormChange={handleCollectInfoChange}
                    errors={collectInfoErrors}
                  />
                </motion.div>
              )}

              {/* Payment Button */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.2 }}
              >
                {walletChain === "APTOS" && (
                  <AptosPayButton
                    selectedToken={selectedToken}
                    amount={amount}
                    stealthData={addressData}
                    onSuccess={handlePaymentSuccess}
                    onError={handlePaymentError}
                    onValidate={handlePrePaymentValidation}
                  />
                )}
              </motion.div>

              {/* Footer */}
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.25 }}
                className="text-xs text-gray-400 text-center pt-2 border-t border-gray-100"
              >
                <div className="flex items-center justify-center gap-1.5 pt-4">
                  <svg className="w-3 h-3 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>
                  <span className="font-medium">Secured by VAULT</span>
                  <span className="text-gray-300">•</span>
                  <span>Private Self-custodial Payments</span>
                </div>
              </motion.div>
            </motion.div>
          )}
        </div>
      </AnimatePresence>

      {/* Wallet Selection Modal */}
      <WalletSelectModal
        isOpen={isWalletModalOpen}
        onClose={() => setIsWalletModalOpen(false)}
      />
    </>
  );
}

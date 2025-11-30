import React, { useCallback, useMemo, useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import TokenInput from "./TokenInput";
import AptosPayButton from "./AptosPayButton";
import CollectInfoForm from "./CollectInfoForm";
import WalletSelectModal from "./WalletSelectModal";
import { usePay } from "@/providers/PayProvider";
import { EASE_OUT_QUART } from "@/config/animation";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import StaticTokenInput from "./StaticTokenInput";
import { userService, ChainId } from "@/lib/api/user";
import { SupportedChain } from "@/config/chains";
import { serializeFormattedStringToFloat } from "@/utils/formatting";
import { useUserBalances } from "@/hooks/useUserBalance";
import { formatUiNumber } from "@/utils/formatting";
import { useContext } from "react";
import { AuthContext } from "@/providers/AuthProvider";

// Convert chain to API chain ID
const getChainId = (chain: SupportedChain): ChainId => {
  switch (chain) {
    case "APTOS":
      return process.env.NEXT_PUBLIC_IS_TESTNET === "true" ? "IOTA_TESTNET" : "IOTA_MAINNET";
    default:
      return "IOTA_TESTNET";
  }
};

// Safe useAuth hook that doesn't throw if AuthProvider is not available
function useAuthSafe() {
  const context = useContext(AuthContext);
  // If context is undefined, AuthProvider is not available (e.g., on public payment pages)
  if (context === undefined) {
    return { me: null };
  }
  return context;
}

export default function PaymentInterface() {
  const { me } = useAuthSafe();
  const balanceResult = useUserBalances(me?.id || null);
  const userBalances = balanceResult?.balances ?? [];
  const balancesLoading = balanceResult?.loading ?? false;

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

  // Get APT balance
  const aptBalance = useMemo(() => {
    if (!userBalances || !Array.isArray(userBalances) || userBalances.length === 0) {
      return 0;
    }
    try {
      const aptBalanceData = userBalances.find(
        (b) => b?.token_symbol === "APT" || b?.token_address === "0x1::aptos_coin::AptosCoin"
      );
      if (!aptBalanceData || !aptBalanceData.balance || typeof aptBalanceData.decimals !== 'number') {
        return 0;
      }
      const balanceNum = Number(aptBalanceData.balance);
      const decimalsNum = Number(aptBalanceData.decimals);
      if (isNaN(balanceNum) || isNaN(decimalsNum) || decimalsNum < 0) {
        return 0;
      }
      return balanceNum / Math.pow(10, decimalsNum);
    } catch (error) {
      console.error('Error calculating APT balance:', error);
      return 0;
    }
  }, [userBalances]);

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
  const [rwaPurchaseInfo, setRwaPurchaseInfo] = useState<{
    assetId: string;
    quantity: number;
    totalCost: number;
    pricePerShare: number;
  } | null>(null);

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

  // ALWAYS initialize APT token and check for RWA purchase on mount
  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Step 1: Always set APT token if not set
    if (!selectedToken) {
      const aptToken = {
        symbol: 'APT',
        name: 'Aptos',
        decimals: 8,
        isNative: true,
        address: '0x1::aptos_coin::AptosCoin',
      };
      console.log('✅ Auto-selecting APT token (backend-less mode)');
      setSelectedToken(aptToken);
    }

    // Step 2: Check for RWA purchase intent from sessionStorage
    try {
      const rwaIntent = sessionStorage.getItem('rwa-purchase-intent');
      if (rwaIntent) {
        const purchaseInfo = JSON.parse(rwaIntent);
        console.log('📦 Found RWA purchase intent:', purchaseInfo);

        // Validate purchase info structure
        if (purchaseInfo && typeof purchaseInfo === 'object' && purchaseInfo.assetId && typeof purchaseInfo.totalCost === 'number') {
          setRwaPurchaseInfo(purchaseInfo);

          // Always pre-fill amount for RWA purchases
          if (purchaseInfo.totalCost > 0) {
            // Format the amount properly - preserve all significant digits
            let formattedAmount: string;

            if (purchaseInfo.totalCost < 1) {
              formattedAmount = purchaseInfo.totalCost.toFixed(8);
              if (formattedAmount.split('.')[1]?.length > 4) {
                formattedAmount = formattedAmount.replace(/\.?0+$/, '');
              }
            } else {
              formattedAmount = purchaseInfo.totalCost.toFixed(6).replace(/\.?0+$/, '');
            }

            if (purchaseInfo.totalCost % 1 !== 0 && !formattedAmount.includes('.')) {
              formattedAmount = purchaseInfo.totalCost.toFixed(8);
            }

            if (!formattedAmount || formattedAmount === '0' || formattedAmount === '0.00') {
              formattedAmount = purchaseInfo.totalCost.toFixed(8);
            }

            // Always set token to APT for RWA purchases
            const aptToken = {
              symbol: 'APT',
              name: 'Aptos',
              decimals: 8,
              isNative: true,
              address: '0x1::aptos_coin::AptosCoin',
            };

            console.log('🔄 Setting RWA token and amount:', {
              token: aptToken,
              amount: formattedAmount,
              totalCost: purchaseInfo.totalCost
            });

            // Set both token and amount immediately
            setSelectedToken(aptToken);
            setAmount(formattedAmount);

            // Double-check after a brief delay to ensure it's set
            setTimeout(() => {
              if (!amount || amount === '') {
                console.log('⚠️ Amount was empty, re-setting:', formattedAmount);
                setAmount(formattedAmount);
              }
            }, 100);
          }
        } else {
          console.warn('Invalid RWA purchase intent data, clearing...');
          sessionStorage.removeItem('rwa-purchase-intent');
        }
      } else {
        console.log('ℹ️ No RWA purchase intent found in sessionStorage');
      }
    } catch (error) {
      console.error('Error reading RWA purchase intent:', error);
      try {
        sessionStorage.removeItem('rwa-purchase-intent');
      } catch (e) {
        // Ignore storage errors
      }
    }
  }, []); // Run only once on mount

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

      // For RWA purchases, always preserve the RWA amount
      if (rwaPurchaseInfo && rwaPurchaseInfo.totalCost > 0) {
        // If output is null or amount doesn't match, restore RWA amount
        if (!output || output.amount !== rwaPurchaseInfo.totalCost) {
          const formattedAmount = rwaPurchaseInfo.totalCost < 1
            ? rwaPurchaseInfo.totalCost.toFixed(8).replace(/\.?0+$/, '')
            : rwaPurchaseInfo.totalCost.toFixed(6).replace(/\.?0+$/, '');

          console.log('🔄 Restoring RWA amount:', formattedAmount);
          setAmount(formattedAmount);

          // Ensure token is set
          if (!selectedToken) {
            const aptToken = {
              symbol: 'APT',
              name: 'Aptos',
              decimals: 8,
              isNative: true,
              address: '0x1::aptos_coin::AptosCoin',
            };
            setSelectedToken(aptToken);
          }
          return;
        }

        // Allow the onChange if it's setting the correct RWA values
        if (output && output.amount === rwaPurchaseInfo.totalCost && output.token?.symbol === 'APT') {
          setAmount(output.rawAmount);
          setSelectedToken({
            symbol: output.token.symbol,
            decimals: output.token.decimals,
            isNative: output.token.isNative,
            address: output.token.address,
          });
          return;
        }
      }

      // Normal flow for non-RWA purchases
      // Always set token if provided (even if amount is 0) - ensures token is selected
      if (output && output.token) {
        setSelectedToken({
          symbol: output.token.symbol,
          decimals: output.token.decimals,
          isNative: output.token.isNative,
          address: output.token.address,
        });

        // Only set amount if it's provided and > 0
        if (output.rawAmount && output.amount > 0) {
          setAmount(output.rawAmount);
        }
      } else if (!output) {
        // Only clear if not an RWA purchase
        if (!rwaPurchaseInfo) {
          setAmount("");
          setSelectedToken(null);
        }
      }
    },
    [isFixedPrice, setAmount, setSelectedToken, rwaPurchaseInfo, selectedToken]
  );

  // Safeguard: Ensure amount is set if we have RWA purchase info but amount is empty
  useEffect(() => {
    if (rwaPurchaseInfo && rwaPurchaseInfo.totalCost > 0 && (!amount || amount === '')) {
      const formattedAmount = rwaPurchaseInfo.totalCost < 1
        ? rwaPurchaseInfo.totalCost.toFixed(8).replace(/\.?0+$/, '')
        : rwaPurchaseInfo.totalCost.toFixed(6).replace(/\.?0+$/, '');

      console.log('⚠️ Amount was empty, restoring from RWA purchase info:', formattedAmount);
      setAmount(formattedAmount);

      // Also ensure token is set
      if (!selectedToken) {
        const aptToken = {
          symbol: 'APT',
          name: 'Aptos',
          decimals: 8,
          isNative: true,
          address: '0x1::aptos_coin::AptosCoin',
        };
        setSelectedToken(aptToken);
      }
    }
  }, [rwaPurchaseInfo, amount, selectedToken, setAmount, setSelectedToken]);

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

      // Clear RWA purchase intent after successful payment
      if (rwaPurchaseInfo) {
        sessionStorage.removeItem('rwa-purchase-intent');
      }

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
      rwaPurchaseInfo,
    ]
  );

  if (paymentSuccess) return null;

  // Check if wallet is set up (meta keys available)
  const hasWalletSetup = addressData?.chains?.APTOS?.metaSpendPub && addressData?.chains?.APTOS?.metaViewPub;

  return (
    <>
      <AnimatePresence mode="wait">
        <div className="w-full max-w-lg mx-auto" key="payment-form">
          {/* RWA Purchase Info */}
          {rwaPurchaseInfo && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-2xl"
            >
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M10.394 2.08a1 1 0 00-.788 0l-7 3a1 1 0 000 1.84L5.25 8.051a.999.999 0 01.356-.257l4-1.714a1 1 0 11.788 1.838L7.667 9.088l1.94.831a1 1 0 00.787 0l7-3a1 1 0 000-1.838l-7-3zM3.31 9.397L5 10.12v4.102a8.969 8.969 0 00-1.05-.174 1 1 0 01-.89-.89 11.115 11.115 0 01.25-3.762zM9.3 16.573A9.026 9.026 0 007 14.935v-3.957l1.818.78a3 3 0 002.364 0l5.508-2.361a11.026 11.026 0 01.25 3.762 1 1 0 01-.89.89 8.968 8.968 0 00-5.35 2.524 1 1 0 01-1.4 0zM6 18a1 1 0 001-1v-2.065a8.935 8.935 0 00-2-.712V17a1 1 0 001 1z" />
                  </svg>
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-800">
                    Real World Asset Purchase
                  </p>
                  <p className="text-xs text-blue-700 mt-1">
                    {rwaPurchaseInfo.quantity && rwaPurchaseInfo.pricePerShare ? (
                      <>Purchasing {rwaPurchaseInfo.quantity} share{rwaPurchaseInfo.quantity !== 1 ? 's' : ''} at {rwaPurchaseInfo.pricePerShare} APT per share</>
                    ) : (
                      <>Real World Asset Purchase</>
                    )}
                  </p>
                </div>
              </div>
            </motion.div>
          )}

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
              className="space-y-6"
            >
              {/* Balance Display */}
              {me && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, ease: EASE_OUT_QUART, delay: 0.02 }}
                  className="bg-gradient-to-r from-primary-50 to-primary-100 rounded-xl p-4 border border-primary-200"
                >
                  <div className="flex items-center justify-between flex-wrap gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-primary-500 flex items-center justify-center shadow-sm flex-shrink-0">
                        <span className="text-white text-sm font-bold">APT</span>
                      </div>
                      <div>
                        <p className="text-xs text-gray-600 font-medium">Your Balance</p>
                        {balancesLoading ? (
                          <div className="h-6 w-24 bg-gray-200 rounded animate-pulse mt-1" />
                        ) : (
                          <p className="text-xl font-bold text-gray-900">
                            {formatUiNumber(aptBalance || 0, "APT", { maxDecimals: 6 })}
                          </p>
                        )}
                      </div>
                    </div>
                    {rwaPurchaseInfo && rwaPurchaseInfo.totalCost && (
                      <div className="text-right">
                        <p className="text-xs text-gray-600 font-medium">Required</p>
                        <p className="text-xl font-bold text-primary-600">
                          {formatUiNumber(rwaPurchaseInfo.totalCost, "APT", { maxDecimals: 6 })}
                        </p>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}

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
                    value={amount}
                    onChange={handleTokenInputChange}
                  />
                ) : (
                  // Backend-less mode: APT only - simple amount input (no token selector)
                  <div className="space-y-2">
                    {/* APT Token Display (read-only) */}
                    <div className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl border border-gray-200">
                      <div className="flex items-center gap-2 flex-1">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 flex items-center justify-center text-white font-bold text-sm">
                          APT
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">Aptos</div>
                          <div className="text-xs text-gray-500">Native token</div>
                        </div>
                      </div>
                      {aptBalance > 0 && (
                        <div className="text-right">
                          <div className="text-xs text-gray-500">Balance</div>
                          <div className="text-sm font-medium text-gray-900">{formatUiNumber(aptBalance, "", { maxDecimals: 4 })} APT</div>
                        </div>
                      )}
                    </div>

                    {/* Amount Input */}
                    <div className="relative">
                      <Input
                        type="text"
                        inputMode="decimal"
                        value={amount}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                          const value = e.target.value;
                          // Allow only numbers and decimal point
                          if (value === '' || /^\d*\.?\d*$/.test(value)) {
                            setAmount(value);
                            // Ensure token is set (should always be APT)
                            if (!selectedToken) {
                              const aptToken = {
                                symbol: 'APT',
                                name: 'Aptos',
                                decimals: 8,
                                isNative: true,
                                address: '0x1::aptos_coin::AptosCoin',
                              };
                              setSelectedToken(aptToken);
                            }
                            // Emit token change with new amount (only if amount is valid)
                            if (selectedToken && value && parseFloat(value) > 0) {
                              handleTokenInputChange({
                                token: {
                                  symbol: selectedToken.symbol,
                                  decimals: selectedToken.decimals,
                                  isNative: selectedToken.isNative,
                                  address: selectedToken.address,
                                },
                                amount: parseFloat(value),
                                rawAmount: value,
                              });
                            }
                          }
                        }}
                        placeholder="0.00"
                        className="w-full text-2xl font-semibold py-4 px-4 rounded-xl border-2 border-gray-200 focus:border-primary-500 focus:ring-2 focus:ring-primary-100 transition-all"
                      />
                      {aptBalance > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const maxAmount = aptBalance.toFixed(8);
                            setAmount(maxAmount);
                            if (selectedToken) {
                              handleTokenInputChange({
                                token: {
                                  symbol: selectedToken.symbol,
                                  decimals: selectedToken.decimals,
                                  isNative: selectedToken.isNative,
                                  address: selectedToken.address,
                                },
                                amount: aptBalance,
                                rawAmount: maxAmount,
                              });
                            }
                          }}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium text-primary-600 hover:text-primary-700 px-2 py-1 rounded-md hover:bg-primary-50 transition-colors"
                        >
                          MAX
                        </button>
                      )}
                    </div>
                  </div>
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

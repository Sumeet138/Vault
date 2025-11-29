import CuteModal from "@/components/common/CuteModal";
import { formatUiNumber } from "@/utils/formatting";
import {
  QrCode,
  WalletIcon,
  CheckIcon,
  X,
  Network,
  ReceiptText,
} from "lucide-react";
import { useState } from "react";
import { AVAILABLE_CHAINS, FEE_CONFIGS } from "@/config/chains";
import QRScannerModal from "./QRScannerModal";
import EmojiPicture from "@/components/common/EmojiPicture";
import { motion, AnimatePresence } from "framer-motion";
import { shortenId } from "@/utils/misc";
import TokenInput from "@/components/pages/(app)/username-pay/TokenInput";
import { ExternalLinkIcon } from "lucide-react";
import { getExplorerTxLink } from "@/utils/misc";
import { type UserToken as TokenBalance } from "@/lib/api/user";
import { useWithdraw } from "@/hooks/use-withdraw";
import { useAuth } from "@/providers/AuthProvider";
import { type SearchResult } from "@/lib/api/address";
import Image from "next/image";
import Spinner from "@/components/ui/spinner";
import InfoBadge from "@/components/common/InfoBadge";
import { Input } from "@/components/ui/input";
import MainButton from "@/components/common/MainButton";
import { EASE_OUT_QUART } from "@/config/animation";
import { Textarea } from "@/components/ui/textarea";

interface WithdrawModalProps {
  isOpen: boolean;
  onClose: () => void;
  token: TokenBalance | null | undefined;
  initialSearchQuery?: string | null;
}

export default function WithdrawModal({
  isOpen,
  onClose,
  token,
  initialSearchQuery,
}: WithdrawModalProps) {
  const { me } = useAuth();
  const {
    isSending: isSearchingStealth,
    error: stealthError,
    showSuccessDialog: stealthSuccess,
    lastTxSignature: stealthTxHash,
    currentTxNumber,
    totalTxCount,
    performWithdrawal,
    resetWithdrawState,
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedResult,
    handleResultSelect,
    handleClearSearch,
    withdrawAmount,
    setWithdrawAmount,
    feeDetails,
    getChainKey,
    predefinedTokenForInput,
  } = useWithdraw({ token, initialSearchQuery });

  const [note, setNote] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);

  // QR Scanner state
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);

  const processQRCode = (code: string): string | null => {
    const trimmedCode = code.trim();

    // Case 1: Vault link (https://vault.me/username or https://vault.me/username/anything)
    // Pass the full URL directly to backend
    const vaultLinkRegex = /^https?:\/\/vault\.me\/[a-zA-Z0-9_.-]+(?:\/.*)?$/i;
    if (vaultLinkRegex.test(trimmedCode)) {
      return trimmedCode; // Return full URL
    }

    // Case 2: APTOS address (starts with 0x)
    const iotaAddressRegex = /^0x[a-fA-F0-9]{1,64}$/;
    if (iotaAddressRegex.test(trimmedCode)) {
      return trimmedCode;
    }

    // Case 3: Plain username (fallback)
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    if (usernameRegex.test(trimmedCode) && trimmedCode.length > 0) {
      return trimmedCode;
    }

    return null;
  };

  const handleQRCodeScanned = (code: string) => {
    const processedCode = processQRCode(code);
    if (processedCode) {
      setSearchQuery(processedCode);
      setIsQRScannerOpen(false);
    } else {
      console.warn("Could not process QR code:", code);
    }
  };

  // handleWithdrawAmountChange is now provided by the hook

  const resetState = () => {
    resetWithdrawState();
    setNote("");
    onClose();
  };

  const handleWithdraw = async () => {
    // Treasury-based withdrawal
    if (!selectedResult || !withdrawAmount || !token) {
      setError("Please select a destination and amount");
      return;
    }

    setIsSending(true);
    setError(null);

    try {
      if (!me?.id) {
        throw new Error('User not authenticated');
      }
      
      // Calculate amount in smallest unit
      const amountInSmallestUnit = BigInt(Math.floor(withdrawAmount.amount * Math.pow(10, token.decimals)));

      // Call withdraw API
      const response = await fetch('/api/withdraw', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: me.id,
          destinationAddress: (selectedResult as any).address || (selectedResult as any).targetAddress,
          amount: amountInSmallestUnit.toString(),
          tokenAddress: token.mintAddress,
          tokenSymbol: token.symbol,
        }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Withdrawal failed');
      }

      setShowSuccessDialog(true);
      setLastTxSignature(result.txHash);
      
      // Refresh balances
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err: any) {
      console.error('Withdrawal error:', err);
      setError(err.message || 'Withdrawal failed');
    } finally {
      setIsSending(false);
    }
  };

  const getResultIcon = (result: SearchResult) => {
    switch (result.type) {
      case "ans":
        return (
          <div className="p-2 rounded-full bg-gray-50">
            <WalletIcon className="w-6 h-6 text-gray-600" />
          </div>
        );
      case "username":
      case "shingru":
        return (
          <EmojiPicture
            emoji={result.profileImageData.emoji}
            color={result.profileImageData.backgroundColor}
            size="md"
          />
        );
      case "address":
        return (
          <div className="p-2 rounded-full bg-gray-50">
            <WalletIcon className="w-6 h-6 text-gray-600" />
          </div>
        );
      default:
        return (
          <div className="p-2 rounded-full bg-gray-50">
            <WalletIcon className="w-6 h-6 text-gray-600" />
          </div>
        );
    }
  };

  const chainInfo = AVAILABLE_CHAINS.find((c) => token?.chain?.includes(c.id));

  let receiverDisplay = "";
  if (selectedResult) {
    switch (selectedResult.type) {
      case "address":
        receiverDisplay = shortenId(selectedResult.address);
        break;
      case "username":
      case "shingru":
        receiverDisplay = `@${selectedResult.username}`;
        break;
      case "ans":
        receiverDisplay = selectedResult.name;
        break;
      default:
        receiverDisplay = selectedResult.displayName;
        break;
    }
  }

  // Early return if no token
  if (!token) {
    return null;
  }

  return (
    <CuteModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        showSuccessDialog ? "Withdrawal Successful" : `Withdraw ${token.symbol}`
      }
      headerVariant="default"
    >
      <AnimatePresence mode="wait">
        {showSuccessDialog ? (
          <motion.div
            key="success"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
            className="p-4 flex flex-col items-center text-center"
          >
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <CheckIcon className="w-10 h-10 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Woohoo! 🎉</h2>
            {withdrawAmount && feeDetails && (
              <p className="text-gray-500 mb-4 text-lg">
                You successfully withdrew{" "}
                <span className="font-bold text-gray-800">
                  {formatUiNumber(feeDetails.amountToReceive, "", {
                    maxDecimals: 4,
                  })}{" "}
                  {withdrawAmount.token.symbol}
                </span>
                .
              </p>
            )}
            {lastTxSignature && (
              <div className="w-full bg-gray-50 p-3 rounded-lg">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-500">Transaction</span>
                  <div className="flex flex-col items-end gap-1">
                    {lastTxSignature.includes("|") ? (
                      lastTxSignature.split("|").map((hash) => (
                        <a
                          key={hash}
                          href={getExplorerTxLink(
                            hash,
                            getChainKey(token.chain) as any
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-gray-600"
                        >
                          {shortenId(hash, 3, 3)}
                          <ExternalLinkIcon className="w-3.5 h-3.5" />
                        </a>
                      ))
                    ) : (
                      <a
                        href={getExplorerTxLink(
                          lastTxSignature,
                          getChainKey(token.chain) as any
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 font-medium text-gray-900 hover:text-gray-600"
                      >
                        {shortenId(lastTxSignature, 3, 3)}
                        <ExternalLinkIcon className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )}
            <div className="w-full">
              <MainButton
                onClick={resetState}
                className="mt-6 w-full"
                color="primary"
              >
                Done
              </MainButton>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="form"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: EASE_OUT_QUART }}
          >
            {/* Destination input */}
            <div>
              <div className="flex flex-row items-center gap-2 bg-gray-50 rounded-xl p-3">
                <div className="font-semibold opacity-60 text-lg">To</div>
                <AnimatePresence mode="wait">
                  {selectedResult ? (
                    // Selected result pill
                    <motion.div
                      key="selected"
                      className="flex-1 flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <div className="flex items-center gap-2 bg-white/80 px-3 py-1 rounded-full border border-gray-200">
                        {getResultIcon(selectedResult)}
                        <div className="font-semibold text-sm">
                          {selectedResult.displayName}
                        </div>
                        <button
                          onClick={handleClearSearch}
                          className="ml-1 p-1 hover:bg-gray-100 rounded-full transition-colors"
                        >
                          <X className="w-3 h-3 text-gray-500" />
                        </button>
                      </div>
                    </motion.div>
                  ) : (
                    // Input field
                    <motion.div
                      key="input"
                      className="flex-1 flex items-center gap-2"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.15, ease: "easeOut" }}
                    >
                      <Input
                        className="text-smmd:text-lg flex-1 bg-transparent border-none focus-visible:ring-0 focus-visible:ring-offset-0"
                        placeholder="Address, Username, or SNS"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                      />
                      {isSearching ? (
                        <Spinner />
                      ) : (
                        <button
                          className={`p-2 rounded-lg transition-colors ${
                            searchQuery.trim()
                              ? "bg-black/10 hover:bg-background-700"
                              : "bg-black/10 px-3 text-sm font-medium hover:bg-background-700"
                          }`}
                          onClick={
                            searchQuery.trim() ? handleClearSearch : undefined
                          }
                        >
                          <AnimatePresence mode="wait">
                            <motion.div
                              key={searchQuery.trim() ? "clear" : "paste"}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -10 }}
                              transition={{ duration: 0.15, ease: "easeOut" }}
                            >
                              {searchQuery.trim() ? (
                                <X className="w-5 h-5 text-gray-600" />
                              ) : (
                                <span>Paste</span>
                              )}
                            </motion.div>
                          </AnimatePresence>
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            <AnimatePresence>
              {!selectedResult && (
                <motion.div
                  initial={{ opacity: 0, maxHeight: 0, marginTop: 0 }}
                  animate={{
                    opacity: 1,
                    maxHeight: "500px",
                    marginTop: "16px",
                    transition: { duration: 0.4, ease: EASE_OUT_QUART },
                  }}
                  exit={{
                    opacity: 0,
                    maxHeight: 0,
                    marginTop: 0,
                    transition: { duration: 0.3, ease: EASE_OUT_QUART },
                  }}
                  className="overflow-hidden"
                >
                  {/* Scan QR Code button */}
                  <button
                    className="flex flex-row items-center gap-2 text-left p-2 w-full rounded-xl hover:bg-gray-50 transition-colors"
                    onClick={() => setIsQRScannerOpen(true)}
                  >
                    <div className="p-2 rounded-full bg-gray-50">
                      <QrCode className="w-6 h-6 text-black/60" />
                    </div>
                    <div>
                      <div className="font-semibold">Scan QR Code</div>
                      <div className="text-xs opacity-60">
                        Tap to scan an address
                      </div>
                    </div>
                  </button>

                  {/* Search Results */}
                  <div className="min-h-[250px]">
                    {isSearching && (
                      <div className="text-sm my-4 opacity-60 px-2 text-center">
                        Searching...
                      </div>
                    )}

                    {!isSearching &&
                      searchQuery &&
                      searchResults.length === 0 && (
                        <div className="mt-4">
                          {/* Check if it's a valid Aptos address */}
                          {searchQuery.match(/^0x[a-fA-F0-9]{1,64}$/) ? (
                            <button
                              className="flex flex-row items-center gap-2 text-left p-2 w-full rounded-xl hover:bg-gray-50 transition-colors"
                              onClick={() => handleResultSelect({
                                type: 'address',
                                address: searchQuery,
                                displayName: searchQuery,
                              } as any)}
                            >
                              <div className="p-2 rounded-full bg-gray-50">
                                <WalletIcon className="w-6 h-6 text-gray-600" />
                              </div>
                              <div className="flex-1">
                                <div className="font-semibold">Use this address</div>
                                <div className="text-xs opacity-60">
                                  {searchQuery.slice(0, 10)}...{searchQuery.slice(-8)}
                                </div>
                              </div>
                            </button>
                          ) : (
                            <div className="text-sm my-8 opacity-60 px-2 text-center">
                              <Image
                                src="/assets/cute/cloud-sad.svg"
                                alt="No results"
                                width={80}
                                height={80}
                                className="mx-auto mb-2"
                              />
                              No results found
                            </div>
                          )}
                        </div>
                      )}
                    {!isSearching && searchResults.length > 0 && (
                      <div className="mt-4">
                        <div className="flex flex-row items-center gap-2">
                          <CheckIcon className="w-4 h-4 text-primary-600" />
                          <div className="font-semibold opacity-50">
                            Matching
                          </div>
                        </div>
                        <motion.div
                          className="mt-2 space-y-2"
                          variants={{
                            hidden: { opacity: 0 },
                            show: {
                              opacity: 1,
                              transition: {
                                staggerChildren: 0.08,
                              },
                            },
                          }}
                          initial="hidden"
                          animate="show"
                        >
                          {searchResults.map((result) => (
                            <motion.button
                              key={
                                result.type === "ans"
                                  ? result.name
                                  : result.type === "sns"
                                  ? result.name
                                  : result.type === "username" ||
                                    result.type === "shingru"
                                  ? result.username
                                  : result.address
                              }
                              variants={{
                                hidden: { opacity: 0, y: 20 },
                                show: { opacity: 1, y: 0 },
                              }}
                              transition={{
                                ease: EASE_OUT_QUART,
                                duration: 0.4,
                              }}
                              className="flex flex-row items-center gap-2 text-left p-2 w-full rounded-xl hover:bg-gray-50 transition-colors"
                              onClick={() => handleResultSelect(result)}
                            >
                              {getResultIcon(result)}
                              <div className="flex-1">
                                <div className="font-semibold">
                                  {result.displayName}
                                </div>
                                <div className="text-xs opacity-60">
                                  {result.type === "address" &&
                                    shortenId(result.address)}
                                  {(result.type === "username" ||
                                    result.type === "shingru") &&
                                    `shingru.me/${result.username}`}
                                  {result.type === "ans" &&
                                    result.targetAddress &&
                                    shortenId(result.targetAddress)}
                                  {result.type === "sns" &&
                                    result.targetAddress &&
                                    shortenId(result.targetAddress)}
                                </div>
                              </div>
                            </motion.button>
                          ))}
                        </motion.div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Amount Input - Show when destination is selected */}
            <AnimatePresence>
              {selectedResult && (
                <motion.div
                  initial={{ opacity: 0, maxHeight: 0 }}
                  animate={{
                    opacity: 1,
                    maxHeight: "1000px",
                    transition: {
                      maxHeight: { duration: 0.4, ease: EASE_OUT_QUART },
                      opacity: { duration: 0.4, ease: "easeOut", delay: 0.1 },
                    },
                  }}
                  exit={{
                    opacity: 0,
                    maxHeight: 0,
                    transition: {
                      maxHeight: { duration: 0.3, ease: EASE_OUT_QUART },
                      opacity: { duration: 0.2, ease: "easeIn" },
                    },
                  }}
                  className="mt-6"
                >
                  <div className="text-sm font-semibold opacity-60 mb-2">
                    Amount to withdraw
                  </div>
                  <TokenInput
                    mode="predefined"
                    tokens={predefinedTokenForInput}
                    balance={token.total}
                    defaultToken={token.symbol}
                    onChange={setWithdrawAmount}
                    isShowMax={true}
                    showDollarValue={true}
                    placeholder="0.00"
                  />
                  {selectedResult &&
                    (selectedResult.type === "shingru" ||
                      selectedResult.type === "username") && (
                      <div className="relative mt-4">
                        <div className="text-sm font-semibold opacity-60 mb-2">
                          Note (optional)
                        </div>
                        <Textarea
                          className="w-full min-h-24 rounded-2xl border-2 border-transparent bg-gray-100 p-3 pb-8 text-sm placeholder:text-gray-500 focus-visible:border-transparent focus-visible:ring-2 focus-visible:ring-primary"
                          placeholder="Add a note to your withdrawal 📋"
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          maxLength={200}
                          rows={1}
                        />
                        <div className="text-right text-xs text-gray-400 mt-1 pr-2">
                          {note.length} / 200
                        </div>
                      </div>
                    )}
                  <AnimatePresence>
                    {withdrawAmount &&
                      withdrawAmount.amount > 0 &&
                      feeDetails && (
                        <motion.div
                          variants={{
                            hidden: { opacity: 0, height: 0, marginTop: 0 },
                            show: {
                              opacity: 1,
                              height: "auto",
                              marginTop: "16px",
                              transition: {
                                duration: 0.4,
                                ease: EASE_OUT_QUART,
                                when: "beforeChildren",
                                staggerChildren: 0.1,
                              },
                            },
                          }}
                          initial="hidden"
                          animate="show"
                          exit="hidden"
                          className="p-1 bg-gray-100 rounded-2xl space-y-1 overflow-hidden"
                        >
                          {/* Top part */}
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              show: { opacity: 1, y: 0 },
                            }}
                            transition={{ ease: EASE_OUT_QUART, duration: 0.4 }}
                            className="bg-white p-4 rounded-xl"
                          >
                            {/* To */}
                            <div className="flex justify-between items-center">
                              <span className="text-black/40 text-sm">
                                Receiver
                              </span>
                              <div className="flex items-center gap-2">
                                {getResultIcon(selectedResult)}
                                <div className="text-right">
                                  <div className="font-semibold text-md truncate max-w-[150px]">
                                    {receiverDisplay}
                                  </div>
                                </div>
                              </div>
                            </div>

                            <div className="border-t border-gray-200 my-4" />

                            {/* Amount */}
                            <div className="flex justify-between items-center">
                              <span className="text-black/40 text-sm">
                                You send
                              </span>
                              <div className="text-right">
                                <div className="font-bold text-base">
                                  {formatUiNumber(
                                    feeDetails.amountToReceive,
                                    "",
                                    {
                                      maxDecimals: 4,
                                    }
                                  )}{" "}
                                  {withdrawAmount.token.symbol}
                                </div>
                                <div className="text-xs text-gray-400">
                                  ${" "}
                                  {formatUiNumber(
                                    feeDetails.amountToReceive *
                                      (token.priceUsd ?? 0),
                                    "",
                                    { maxDecimals: 2 }
                                  )}
                                </div>
                              </div>
                            </div>
                          </motion.div>

                          {/* Bottom part */}
                          <motion.div
                            variants={{
                              hidden: { opacity: 0, y: 20 },
                              show: { opacity: 1, y: 0 },
                            }}
                            transition={{ ease: EASE_OUT_QUART, duration: 0.4 }}
                            className="bg-background-600 p-4 rounded-xl space-y-4"
                          >
                            {/* Chain */}
                            {chainInfo && (
                              <div className="flex justify-between items-center">
                                <div className="flex items-center gap-2 text-black/40">
                                  <Network className="w-4 h-4" />
                                  <span className="text-sm">Network</span>
                                </div>
                                <div className="flex items-center gap-1 text-black/40">
                                  <Image
                                    src={chainInfo.logo}
                                    alt={chainInfo.name}
                                    width={20}
                                    height={20}
                                    className="rounded-full w-4 h-4"
                                  />
                                  <span className="font-semibold text-sm">
                                    {chainInfo.name}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Fee */}
                            {(() => {
                              const currentFeePercentage = FEE_CONFIGS.APTOS.WITHDRAWAL_FEE_PERCENTAGE;

                              if (currentFeePercentage === 0) {
                                return (
                                  <div className="bg-white rounded-xl p-3 border border-black/5 shadow-supa-smooth">
                                    <div className="flex items-center justify-between">
                                      <div className="flex items-center gap-2">
                                        <motion.div
                                          className="p-1.5 rounded-lg text-2xl"
                                          animate={{
                                            rotate: [0, 3, -3, 3, -3, 0],
                                            y: [0, -2, 0, -2, 0],
                                          }}
                                          transition={{
                                            duration: 1.5,
                                            repeat: Infinity,
                                            repeatType: "reverse",
                                          }}
                                        >
                                          🎉
                                        </motion.div>
                                        <div className="flex flex-col">
                                          <span className="text-sm font-semibold text-gray-900">
                                            No withdrawal fee &amp; gas paid for
                                            you!
                                          </span>
                                          <span className="text-xs text-primary-700">
                                            We got you covered ✨
                                          </span>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <div className="flex justify-between items-center">
                                  <div className="flex items-center gap-2 text-black/40">
                                    <ReceiptText className="w-4 h-4" />
                                    <span className="text-sm">
                                      Fee ({currentFeePercentage}%)
                                    </span>
                                  </div>
                                  <span className="font-semibold text-sm text-black/40">
                                    {formatUiNumber(
                                      feeDetails.fee,
                                      withdrawAmount.token.symbol,
                                      {
                                        maxDecimals: 6,
                                      }
                                    )}
                                  </span>
                                </div>
                              );
                            })()}
                          </motion.div>
                        </motion.div>
                      )}
                  </AnimatePresence>

                  {feeDetails?.mode === "DEDUCTED" && (
                    <InfoBadge variant="warning" className="mt-2">
                      Your balance is too low to cover the fee, so it was
                      deducted from the withdrawal amount.
                    </InfoBadge>
                  )}
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <InfoBadge variant="danger" className="mt-4">
                {error}
              </InfoBadge>
            )}
            {selectedResult && withdrawAmount && feeDetails ? (
              <div className="mt-6">
                <MainButton
                  onClick={handleWithdraw}
                  disabled={isSending}
                  isLoading={isSending}
                  color="primary"
                  className="w-full"
                >
                  {isSending
                    ? totalTxCount > 1
                      ? `Processing (${currentTxNumber}/${totalTxCount})...`
                      : "Processing..."
                    : `Withdraw ${formatUiNumber(
                        feeDetails.amountToReceive,
                        "",
                        {
                          maxDecimals: 4,
                        }
                      )} ${withdrawAmount.token.symbol}`}
                </MainButton>
              </div>
            ) : (
              <p className="mt-4">
                {/* {selectedResult
              ? "Enter the amount you want to withdraw"
              : `Hello! Withdraw functionality coming soon for ${token.name}.`} */}
              </p>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onCodeSolved={handleQRCodeScanned}
      />
    </CuteModal>
  );
}

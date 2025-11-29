"use client";

import TokenAvatar from "@/components/common/TokenAvatar";
import { useUser } from "@/providers/UserProvider";
import { formatUiNumber } from "@/utils/formatting";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import WithdrawModal from "./WithdrawModal";
import {
  CheckIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  PaperAirplaneIcon,
  ShieldCheckIcon,
} from "@heroicons/react/24/outline";
import QRScannerModal from "./QRScannerModal";
import { ScanLine, Send } from "lucide-react";
import { useIsMobile } from "@/hooks/use-is-mobile";
import { useAuth } from "@/providers/AuthProvider";
import { useUserBalances } from "@/hooks/useUserBalance";

type TokenBalance = ReturnType<typeof useUser>["stealthBalances"][0];

interface TokenBalanceItemProps {
  token: TokenBalance;
  onClick: () => void;
}

function TokenBalanceItem({
  token,
  onClick,
}: TokenBalanceItemProps) {
  const [isHovered, setIsHovered] = useState(false);


  return (
    <button
      className="w-full py-1 md:py-3 md:px-3 flex flex-col items-start text-start h-fit cursor-pointer relative"
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Cute hover indicator */}
      <motion.div
        className="absolute w-full h-full bg-background-500 rounded-2xl left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-0"
        animate={{
          scale: isHovered ? 1 : 0.4,
          opacity: isHovered ? 1 : 0,
        }}
        transition={{
          duration: 0.12,
          ease: "easeInOut",
        }}
      />
      <div className="flex flex-row items-center gap-4 justify-between w-full z-10 relative">
        <div className="flex items-center space-x-3">
          <TokenAvatar
            imageUrl={token.imageUrl}
            symbol={token.symbol}
            variant="default"
            isVerified={token.isVerified}
            chain={token.chain as any}
            isNative={token.isNative}
          />

          <div className="flex flex-col">
            <div className="flex flex-row items-center gap-1">
              <div className="font-semibold md:text-lg">
                <span>
                  {formatUiNumber(token.total, "", {
                    maxDecimals: 4,
                  })}{" "}
                </span>
                <span className="opacity-40 font-medium">{token.symbol}</span>
              </div>
              {/* TODO: warning on unverified tokens*/}
              {/* {token.isVerified && (
                <CheckIcon className="w-4 h-4 text-primary-600" />
              )} */}
            </div>
            <div className="text-sm -mt-1">
              <span className="opacity-50">{token.name}</span>
            </div>
          </div>
        </div>

        <div className="flex flex-row items-center gap-2">
          <span className="opacity-50 text-sm font-medium">
            $
            {formatUiNumber(token.usdValue, "", {
              maxDecimals: 2,
            })}
          </span>
          <Send className="size-4 opacity-50" />
        </div>
      </div>

    </button>
  );
}

function BalanceCard() {
  const { me } = useAuth();
  const {
    stealthBalancesSummary,
    stealthBalances,
    stealthBalancesInitialLoading,
  } = useUser();
  
  // Use treasury-based balances from Supabase
  const { balances: treasuryBalances, loading: treasuryLoading } = useUserBalances(me?.id || null);

  const [selectedToken, setSelectedToken] = useState<TokenBalance | null>();
  const [isWithdrawModalOpen, setIsWithdrawModalOpen] = useState(false);
  const [isQRScannerOpen, setIsQRScannerOpen] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const isMobile = useIsMobile();

  // Convert treasury balances to token balance format
  const displayBalances = treasuryBalances.map(balance => ({
    chain: 'APTOS_TESTNET',
    name: balance.token_symbol === 'APT' ? 'Aptos' : balance.token_symbol,
    symbol: balance.token_symbol,
    decimals: balance.decimals,
    total: Number(balance.balance) / Math.pow(10, balance.decimals),
    usdValue: 0, // TODO: Fetch price
    imageUrl: balance.token_symbol === 'APT' ? '/assets/tokens/apt.png' : null,
    isNative: balance.token_symbol === 'APT',
    isVerified: true,
    mintAddress: balance.token_address,
    priceUsd: 0,
  }));

  // Calculate total balance in APT (primary token)
  const totalBalanceAPT = displayBalances.reduce((sum, token) => {
    if (token.symbol === 'APT') {
      return sum + token.total;
    }
    return sum;
  }, 0);
  
  const isLoading = treasuryLoading || stealthBalancesInitialLoading;

  const handleTokenClick = (token: TokenBalance) => {
    setSelectedToken(token);
    setIsWithdrawModalOpen(true);
  };


  const processQRCode = (code: string): string | null => {
    const trimmedCode = code.trim();

    // Case 1: Vault link (matches current origin with /username or /username/anything pattern)
    if (typeof window !== "undefined") {
      const currentOrigin = window.location.origin;
      // Check if the code is a URL that matches the current origin
      try {
        const url = new URL(trimmedCode);
        if (url.origin === currentOrigin && /^\/[a-zA-Z0-9_.-]+(?:\/.*)?$/.test(url.pathname)) {
          return trimmedCode; // Return full URL
        }
      } catch {
        // Not a valid URL, continue to other checks
      }
    }

    // Case 2: Aptos address
    const aptosAddressRegex = /^0x[a-fA-F0-9]{64}$/;
    if (aptosAddressRegex.test(trimmedCode)) {
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
      setQrCodeData(processedCode);
      setIsQRScannerOpen(false);

      // If we have a selected token, open the withdraw modal
      if (selectedToken) {
        setIsWithdrawModalOpen(true);
      } else if (stealthBalances.length > 0) {
        // Auto-select the first token if none is selected
        setSelectedToken(stealthBalances[0]);
        setIsWithdrawModalOpen(true);
      }
    } else {
      console.warn("Could not process QR code:", code);
    }
  };

  return (
    <>
      <div className="rounded-3xl p-1.5 bg-primary-400 shadow-supa-smooth relative">
        <div className="bg-white rounded-[1.2rem] overflow-hidden transition-shadow ">
          <div className="p-5 sm:p-6">
            <div>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-1.5 text-sm font-medium">
                  <span>Your Balance</span>
                  <div
                    className="tooltip tooltip-bottom"
                    data-tip="Click on a token to withdraw to your wallet."
                    style={{ zIndex: 100 }}
                  >
                    <InformationCircleIcon className="size-4" />
                  </div>
                </div>
                {isMobile && (
                  <button
                    type="button"
                    onClick={() => setIsQRScannerOpen(true)}
                    className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer absolute right-5 top-5"
                    aria-label="Scan QR code"
                  >
                    <ScanLine className="size-6 md:size-8 text-gray-700" />
                  </button>
                )}
              </div>
              <div className="flex flex-row gap-1 items-end mt-2">
                {isLoading ? (
                  <div className="skeleton w-16 h-7"></div>
                ) : (
                  <div className="text-3xl md:text-4xl font-bold leading-none">
                    {formatUiNumber(
                      totalBalanceAPT,
                      "",
                      {
                        maxDecimals: 4,
                      }
                    )}
                  </div>
                )}
                {isLoading ? (
                  <div className="skeleton w-16 h-7"></div>
                ) : (
                  <div className="opacity-50 font-medium text-lg">APT</div>
                )}
              </div>
            </div>

            {/* Tokens Boxes */}
            <div className="mt-4">
              {displayBalances.length > 0 ? (
                <>
                  <div className="text-sm opacity-50 font-medium">Tokens</div>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {isLoading ? (
                      <div className="flex justify-center items-center py-8">
                        <div className="loading loading-spinner size-5" />
                      </div>
                    ) : (
                      displayBalances.map((token) => (
                        <TokenBalanceItem
                          key={token.mintAddress}
                          token={token}
                          onClick={() => handleTokenClick(token)}
                        />
                      ))
                    )}
                  </div>
                </>
              ) : (
                !isLoading && (
                  <div className="bg-gray-50 rounded-2xl p-4 w-full font-medium">
                    <div className="flex items-center justify-center gap-2 mb-2">
                      <ExclamationTriangleIcon className="w-4 h-4 text-gray-400" />
                      <div className="text-sm text-gray-500">
                        No balance yet
                      </div>
                    </div>
                    <div className="text-xs text-gray-400 text-center text-balance">
                      Share your payment link to receive funds. All payments are securely held in treasury.
                    </div>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5 text-primary-700 text-xs md:text-[0.8rem] font-medium select-none pt-1.5">
          <ShieldCheckIcon className="w-3.5 h-3.5 text-primary-700 stroke-2" />
          <span>Payments securely held in treasury</span>
        </div>
      </div>

      <WithdrawModal
        isOpen={isWithdrawModalOpen}
        onClose={() => {
          setIsWithdrawModalOpen(false);
          setQrCodeData(null); // Clear QR data when modal closes
        }}
        token={selectedToken}
        initialSearchQuery={qrCodeData}
      />
      <QRScannerModal
        isOpen={isQRScannerOpen}
        onClose={() => setIsQRScannerOpen(false)}
        onCodeSolved={handleQRCodeScanned}
      />
    </>
  );
}

export default BalanceCard;

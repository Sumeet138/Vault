import React, { useState } from "react";
import Image from "next/image";
import {
  ChevronDownIcon,
  CheckIcon,
  Square2StackIcon,
  DocumentIcon,
  LinkIcon,
} from "@heroicons/react/24/outline";
import { motion } from "motion/react";

import { CHAINS } from "@/config/chains";
import { getChainLogo, shortenId } from "@/utils/misc";
import TokenAvatar from "@/components/common/TokenAvatar";
import { ChainConfig, Activity } from "@/lib/api/links";
import { useAuth } from "@/providers/AuthProvider";
import { getFileUrl, formatFileSize } from "@/utils/file";

// Type adapter for TypeBadge component
interface FileData {
  id: string;
  type: string;
  category: string | null;
  filename: string;
  size: number;
  contentType: string;
}

interface ExtendedLink {
  id: string;
  userId: string;
  emoji: string;
  backgroundColor: string;
  tag: string;
  label: string;
  description: string | null;
  specialTheme: string;
  template: string;
  type: string;
  amountType: string;
  goalAmount: string | null;
  // Simplified stablecoin tracking
  isStable?: boolean;
  stableToken?: string | null;
  collectInfo: boolean;
  collectFields: Record<string, unknown> | null;
  supportedChains: string[];
  viewCount: number;
  status: "ACTIVE" | "ARCHIVED";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  chainConfigs: ChainConfig[];
  files?: {
    thumbnail?: FileData;
    deliverables?: FileData[];
  };
  // Digital product specific fields
  deliveryUrl?: string;
  thankYouMessage?: string;
  user: {
    id: string;
    username: string;
  };
  activities: Activity[];
  linkPreview: string;
  stats: {
    viewCount: number;
    totalPayments: number;
  };
}

interface LinkDetailContentProps {
  link: ExtendedLink;
}

// Payment Amount Item Component
const PaymentAmountItem: React.FC<{
  config: {
    id: string;
    chain: string;
    chainName: string;
    amount: number;
    mint?: {
      mintAddress: string;
      symbol: string;
      name: string;
      imageUrl?: string;
      isNative?: boolean;
    };
  };
  tokenSymbol: string;
}> = ({ config, tokenSymbol }) => {
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);
  const [copyingAddress, setCopyingAddress] = React.useState<string | null>(
    null
  );

  // Copy contract address function
  const handleCopyAddress = async (address: string) => {
    if (copiedAddress === address || copyingAddress === address) return;

    setCopyingAddress(address);

    try {
      await navigator.clipboard.writeText(address);
      setCopiedAddress(address);
      setTimeout(() => {
        setCopiedAddress(null);
        setCopyingAddress(null);
      }, 2000); // Reset after 2 seconds
    } catch {
      // Fallback for older browsers
      const textArea = document.createElement("textarea");
      textArea.value = address;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      setCopiedAddress(address);
      setTimeout(() => {
        setCopiedAddress(null);
        setCopyingAddress(null);
      }, 2000); // Reset after 2 seconds
    }
  };

  const mint =
    config.mint && typeof config.mint === "object" && "imageUrl" in config.mint
      ? config.mint
      : null;

  return (
    <div className="flex items-center gap-3 rounded-2xl">
      <div className="flex items-center gap-2">
        <TokenAvatar imageUrl={mint?.imageUrl} symbol={tokenSymbol} size="md" />
        <div>
          <div className="flex flex-row items-center gap-1">
            <span className="text-xl font-semibold text-gray-900">
              {config.amount}
            </span>
            <span className="text-xl font-semibold text-gray-900">
              {tokenSymbol}
            </span>
          </div>
          {config.mint && !config.mint.isNative && (
            <button
              onClick={() => handleCopyAddress(config.mint?.mintAddress || "")}
              className="flex items-center gap-1 bg-gray-100 rounded-full px-2 py-1 mt-1 hover:bg-gray-200 transition-colors cursor-pointer"
            >
              <span className="text-xs text-gray-600 font-mono">
                {copiedAddress === config.mint.mintAddress
                  ? "Copied!"
                  : shortenId(config.mint.mintAddress)}
              </span>
              {copiedAddress === config.mint.mintAddress ? (
                <CheckIcon className="w-3 h-3 text-green-600" />
              ) : copyingAddress === config.mint.mintAddress ? (
                <CheckIcon className="w-3 h-3 text-gray-500" />
              ) : (
                <Square2StackIcon className="w-3 h-3 text-gray-500" />
              )}
            </button>
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 ml-auto">
        <div className="flex items-center gap-1 bg-gray-200 rounded-full px-4 py-2">
          <Image
            src={getChainLogo(config.chain) || "/assets/tokens/default.png"}
            alt={config.chainName}
            width={14}
            height={14}
            className="w-3.5 h-3.5 rounded-full"
          />
          <span className="text-sm text-gray-600 capitalize font-medium">
            {config.chainName}
          </span>
        </div>
      </div>
    </div>
  );
};

const LinkDetailContent: React.FC<LinkDetailContentProps> = ({ link }) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);
  const { availableChains } = useAuth();

  // Handle description expansion
  const toggleDescription = () => {
    setDescriptionExpanded(!descriptionExpanded);
  };

  // Helper function to check if a chain config should be displayed
  const isChainAvailable = (chainConfig: string) => {
    // Check if the chain is in availableChains
    // chainConfig might be "IOTA_MAINNET", "IOTA_TESTNET", etc.
    // availableChains contains "APTOS", etc.
    return availableChains.some((availableChain) => {
      if (availableChain === "APTOS") {
        return (
          chainConfig === "IOTA_MAINNET" ||
          chainConfig === "IOTA_TESTNET" ||
          chainConfig.includes("APTOS")
        );
      }
      return false;
    });
  };

  // Check if token is USDC across chains
  const isUsdcToken = (mintAddress: string, symbol?: string, name?: string) => {
    // First check by mint address
    const usdcAddresses = [
      CHAINS.IOTA_MAINNET.tokens.find(
        (t: { symbol: string }) => t.symbol === "USDC"
      )?.address,
      CHAINS.IOTA_TESTNET.tokens.find(
        (t: { symbol: string }) => t.symbol === "USDC"
      )?.address,
    ].filter(Boolean);

    if (usdcAddresses.includes(mintAddress as any)) {
      return true;
    }

    // Fallback: check by symbol and name patterns
    if (
      symbol === "USDC" ||
      (name &&
        (name.toLowerCase().includes("usdc") ||
          name.toLowerCase().includes("usd coin")))
    ) {
      return true;
    }

    return false;
  };

  // Group payment amounts by token and chain - simplified using isStable
  const getGroupedPaymentAmounts = () => {
    if (!link || link.amountType !== "FIXED" || !link.chainConfigs) return null;

    const groupedPayments: { [key: string]: any[] } = {};

    link.chainConfigs.forEach((config: any) => {
      if (config.amount && config.isEnabled) {
        let tokenKey = "UNKNOWN";

        // Use simplified logic with isStable field
        if (link.isStable && link.stableToken) {
          tokenKey = link.stableToken; // e.g., "USDC"
        } else if (
          config.mint &&
          typeof config.mint === "object" &&
          "symbol" in config.mint
        ) {
          tokenKey = (config.mint as any).symbol;
        }

        if (!groupedPayments[tokenKey]) {
          groupedPayments[tokenKey] = [];
        }

        // Format chain name
        let chainName = config.chain.replace("_", " ").toLowerCase();

        groupedPayments[tokenKey].push({
          ...config,
          chainName,
        });
      }
    });

    return Object.keys(groupedPayments).length > 0 ? groupedPayments : null;
  };

  const getGroupedPaymentsSummary = () => {
    if (!link || !link.activities || link.activities.length === 0) return null;

    const groupedSummary: {
      [key: string]: {
        totalAmount: number;
        count: number;
        imageUrl: string | null;
        symbol: string;
      };
    } = {};

    link.activities.forEach((activity) => {
      if (activity.uiAmount > 0 && activity.token) {
        const token = activity.token;
        let tokenKey = "UNKNOWN";
        let imageUrl: string | null = null;
        let symbol: string = "UNKNOWN";

        // Use simplified logic with isStable field for consistent grouping
        if (link.isStable && link.stableToken) {
          // If this link uses stablecoins, check if the token is the expected stablecoin
          const isExpectedStablecoin = isUsdcToken(
            token.mintAddress,
            token.symbol,
            token.name
          );
          if (isExpectedStablecoin) {
            tokenKey = link.stableToken; // e.g., "USDC"
            symbol = link.stableToken;
            imageUrl = "/assets/tokens/usdc.png";
          } else {
            // Fall back to token's own symbol if it's not the expected stablecoin
            tokenKey = token.symbol;
            symbol = token.symbol;
            imageUrl = token.imageUrl;
          }
        } else {
          // For non-stable links, use token's own symbol
          tokenKey = token.symbol;
          symbol = token.symbol;
          imageUrl = token.imageUrl;
        }

        if (!groupedSummary[tokenKey]) {
          groupedSummary[tokenKey] = {
            totalAmount: 0,
            count: 0,
            imageUrl,
            symbol,
          };
        }

        groupedSummary[tokenKey].totalAmount += activity.uiAmount;
        groupedSummary[tokenKey].count += 1;
      }
    });

    return Object.keys(groupedSummary).length > 0 ? groupedSummary : null;
  };

  return (
    <div className="w-full">
      <div className="bg-white rounded-xl p4-8">
        {link.description ? (
          <div className="space-y-3">
            {/* Description Text */}
            <div className="relative rounded-xl">
              <motion.div
                initial={false}
                animate={{
                  height:
                    descriptionExpanded || link.description.length <= 200
                      ? "auto"
                      : "4rem",
                }}
                transition={{
                  height: { duration: 0.4, ease: [0.4, 0, 0.2, 1] },
                }}
                className="overflow-hidden"
              >
                <div className="text-md text-black/60 leading-relaxed">
                  {link.description}
                </div>
              </motion.div>

              {/* Fade overlay when collapsed and text is long enough */}
              {!descriptionExpanded &&
                link.description &&
                link.description.length > 200 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-white to-transparent pointer-events-none"
                  />
                )}
            </div>

            {/* Show More Button */}
            {link.description && link.description.length > 200 && (
              <motion.button
                onClick={toggleDescription}
                className="flex items-center gap-2 text-md font-medium text-gray-500 hover:text-gray-700 transition-colors duration-200 group ml-auto py-1"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <span>{descriptionExpanded ? "Show less" : "Show more"}</span>
                <motion.div
                  animate={{ rotate: descriptionExpanded ? 180 : 0 }}
                  transition={{ duration: 0.2, ease: "easeInOut" }}
                >
                  <ChevronDownIcon className="w-4 h-4" />
                </motion.div>
              </motion.button>
            )}
          </div>
        ) : (
          <div className="text-md py-6 text-black/30 text-center">
            No description for this link
          </div>
        )}
      </div>

      {/* Digital Product Deliverables - Only for digital-product template */}
      {link.template === "digital-product" &&
        (link.files?.deliverables || link.deliveryUrl) && (
          <div className="mt-2 rounded-xl p-4 bg-white">
            <div className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-900">
                Digital Deliverables
              </h4>

              {/* Deliverable Files */}
              {link.files?.deliverables &&
                link.files.deliverables.length > 0 && (
                  <div className="space-y-2">
                    {link.files.deliverables.map((file) => (
                      <a
                        key={file.id}
                        href={getFileUrl(file.id)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors group"
                      >
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                            <DocumentIcon className="w-5 h-5 text-gray-600" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {file.filename}
                            </p>
                            <p className="text-xs text-gray-500">
                              {formatFileSize(file.size)}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2 ml-2">
                          <span className="text-xs text-gray-500 hidden group-hover:block">
                            Download
                          </span>
                          <svg
                            className="w-4 h-4 text-gray-400 group-hover:text-gray-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                            />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

              {/* Delivery URL */}
              {link.deliveryUrl && (
                <a
                  href={link.deliveryUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center flex-shrink-0">
                      <LinkIcon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-gray-900">
                        Download Link
                      </p>
                      <p className="text-xs text-gray-500 truncate">
                        {link.deliveryUrl}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <span className="text-xs text-blue-600 hidden group-hover:block">
                      Open
                    </span>
                    <svg
                      className="w-4 h-4 text-blue-400 group-hover:text-blue-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </div>
                </a>
              )}
            </div>
          </div>
        )}

      {/* Payments Received Summary */}
      {getGroupedPaymentsSummary() && (
        <div className="mt-2 rounded-xl p-4 bg-white">
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Payments Received
            </h4>
            {Object.entries(getGroupedPaymentsSummary()!).map(
              ([tokenSymbol, summary]) => (
                <div key={tokenSymbol} className="flex items-center gap-2">
                  <TokenAvatar
                    imageUrl={summary.imageUrl}
                    symbol={summary.symbol}
                    size="md"
                  />
                  <div>
                    <div className="flex items-baseline gap-1.5">
                      <span className="text-lg font-semibold text-gray-900">
                        {summary.totalAmount.toLocaleString(undefined, {
                          minimumFractionDigits: 2,
                          maximumFractionDigits: 2,
                        })}
                      </span>
                      <span className="text-lg font-semibold text-gray-900">
                        {summary.symbol}
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">
                      from {summary.count} payment
                      {summary.count > 1 ? "s" : ""}
                    </p>
                  </div>
                </div>
              )
            )}
          </div>
        </div>
      )}

      {/* Payment Amount Display - Only for FIXED amount type */}
      {link.amountType === "FIXED" && getGroupedPaymentAmounts() && (
        <div className="mt-2 rounded-xl p-4 bg-white">
          <div className="space-y-3">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">
              Payment Amount
            </h4>
            {Object.entries(getGroupedPaymentAmounts()!).map(
              ([tokenSymbol, configs]) => {
                // Use simplified logic: if link.isStable is true, show unified display
                const isUnifiedStablecoin =
                  link.isStable && tokenSymbol === link.stableToken;

                if (isUnifiedStablecoin) {
                  // Show unified stablecoin display
                  const amount = configs[0]?.amount ?? 0;
                  const tokenImageUrl =
                    tokenSymbol === "USDC" ? "/assets/tokens/usdc.png" : null;
                  return (
                    <div
                      key={tokenSymbol}
                      className="flex items-center gap-3 rounded-2xl"
                    >
                      <div className="flex items-center gap-2">
                        <TokenAvatar
                          imageUrl={tokenImageUrl}
                          symbol={tokenSymbol}
                          size="md"
                        />
                        <span className="text-xl font-semibold text-gray-900">
                          {amount}
                        </span>
                        <span className="text-xl font-semibold text-gray-900">
                          {tokenSymbol}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 ml-auto">
                        {configs
                          .filter((config) => isChainAvailable(config.chain))
                          .map((config, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-1 bg-gray-200 rounded-full px-4 py-2"
                            >
                              <Image
                                src={
                                  getChainLogo(config.chain) ||
                                  "/assets/tokens/default.png"
                                }
                                alt={config.chainName}
                                width={14}
                                height={14}
                                className="w-3.5 h-3.5 rounded-full"
                              />
                              <span className="text-sm text-gray-600 capitalize font-medium">
                                {config.chainName}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  );
                } else {
                  // Show individual chain displays
                  return (
                    <div key={tokenSymbol} className="space-y-2">
                      {configs.map((config, index) => (
                        <PaymentAmountItem
                          key={index}
                          config={config}
                          tokenSymbol={tokenSymbol}
                        />
                      ))}
                    </div>
                  );
                }
              }
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default LinkDetailContent;

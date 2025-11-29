import React, { useMemo, useState } from "react";
import Image from "next/image";
import { motion } from "motion/react";
import { CHAINS } from "@/config/chains";
import { shortenId, getChainLogo } from "@/utils/misc";
import { Check, Copy } from "lucide-react";
import TokenAvatar from "@/components/common/TokenAvatar";
import TypeBadge from "../../username-pay/TypeBadge";
import { ChevronDownIcon } from "@heroicons/react/24/outline";

interface LinkDetailContentProps {
  link: any;
}

// Payment Amount Item Component
interface PaymentAmountItemProps {
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
}

const PaymentAmountItem: React.FC<PaymentAmountItemProps> = ({
  config,
  tokenSymbol,
}) => {
  const [copiedAddress, setCopiedAddress] = React.useState<string | null>(null);
  const [copyingAddress, setCopyingAddress] = React.useState<string | null>(
    null
  );

  // Copy contract address function
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

  const mint =
    config.mint && typeof config.mint === "object" && "imageUrl" in config.mint
      ? config.mint
      : null;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3 sm:flex-row sm:items-center">
      <div className="flex items-center gap-3">
        <TokenAvatar imageUrl={mint?.imageUrl} symbol={tokenSymbol} size="md" />
        <div className="flex flex-col">
          <span className="text-sm font-semibold text-gray-900">
            {config.amount} {tokenSymbol}
          </span>
          {config.mint && !config.mint.isNative && (
            <button
              onClick={() => handleCopyAddress(config?.mint?.mintAddress ?? "")}
              className="mt-1 inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-[11px] font-medium text-gray-500 hover:bg-gray-50"
            >
              <span className="font-mono">
                {copiedAddress === config.mint.mintAddress
                  ? "Copied!"
                  : shortenId(config.mint.mintAddress)}
              </span>
              {copiedAddress === config.mint.mintAddress ? (
                <Check className="h-3 w-3 text-emerald-500" />
              ) : copyingAddress === config.mint.mintAddress ? (
                <Check className="h-3 w-3 text-gray-400" />
              ) : (
                <Copy className="h-3 w-3 text-gray-400" />
              )}
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 sm:ml-auto">
        <div className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600">
          <Image
            src={getChainLogo(config.chain) || "/assets/tokens/default.png"}
            alt={config.chainName}
            width={18}
            height={18}
            className="h-4 w-4 rounded-full"
          />
          <span className="capitalize">{config.chainName}</span>
        </div>
      </div>
    </div>
  );
};

const LinkDetailContent: React.FC<LinkDetailContentProps> = ({ link }) => {
  const [descriptionExpanded, setDescriptionExpanded] = useState(false);

  // Handle description expansion
  const toggleDescription = () => {
    setDescriptionExpanded(!descriptionExpanded);
  };

  // Check if token is USDC across chains
  const isUsdcToken = (mintAddress: string, symbol?: string, name?: string) => {
    // First check by mint address
    const usdcAddresses = [
      CHAINS.IOTA_MAINNET.tokens.find((t) => t.symbol === "USDC")?.address,
      CHAINS.IOTA_TESTNET.tokens.find((t) => t.symbol === "USDC")?.address,
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

  // Group payment amounts by token and chain
  const groupedPaymentAmounts = useMemo(() => {
    if (!link || link.amountType !== "FIXED" || !link.chainConfigs) return null;

    const groupedPayments: { [key: string]: any[] } = {};

    link.chainConfigs.forEach((config: any) => {
      if (config.amount && config.isEnabled) {
        let tokenKey = "UNKNOWN";

        if (
          config.mint &&
          typeof config.mint === "object" &&
          "symbol" in config.mint
        ) {
          // Check if this is USDC first
          const isUsdc = isUsdcToken(
            (config.mint as any).mintAddress,
            (config.mint as any).symbol,
            (config.mint as any).name
          );
          tokenKey = isUsdc ? "USDC" : (config.mint as any).symbol;
        }

        if (!groupedPayments[tokenKey]) {
          groupedPayments[tokenKey] = [];
        }
        groupedPayments[tokenKey].push({
          ...config,
          chainName: config.chain.replace("_", " ").toLowerCase(),
        });
      }
    });

    return Object.keys(groupedPayments).length > 0 ? groupedPayments : null;
  }, [link]);

  return (
    <div className="space-y-4 text-sm">
      <div className="space-y-4">
        {link.description ? (
          <div className="space-y-3">
            <div className="relative">
              <motion.div
                initial={false}
                animate={{
                  height:
                    descriptionExpanded || link.description.length <= 220
                      ? "auto"
                      : "5rem",
                }}
                transition={{
                  height: { duration: 0.3, ease: [0.4, 0, 0.2, 1] },
                }}
                className="overflow-hidden"
              >
                <div className="text-sm leading-relaxed text-gray-700">
                  {link.description}
                </div>
              </motion.div>

              {!descriptionExpanded &&
                link.description &&
                link.description.length > 220 && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-white via-white/70 to-transparent"
                  />
                )}
            </div>

            {link.description && link.description.length > 220 && (
              <div className="flex justify-end">
                <motion.button
                  onClick={toggleDescription}
                  className="flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-gray-700"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <span>{descriptionExpanded ? "Show less" : "Read more"}</span>
                  <motion.div
                    animate={{ rotate: descriptionExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2, ease: "easeInOut" }}
                  >
                    <ChevronDownIcon className="h-3 w-3" />
                  </motion.div>
                </motion.button>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-gray-200 bg-gray-50/80 py-5 text-center text-xs text-gray-400">
            No description has been added for this link yet.
          </div>
        )}
      </div>

      <div className="flex justify-start">
        <TypeBadge linkData={link} variant="detail" />
      </div>

      {/* Payment Amount Display - Only for FIXED amount type */}
      {link.amountType === "FIXED" && groupedPaymentAmounts && (
        <div className="rounded-2xl border border-gray-200 bg-gray-50/70 p-1 text-sm">
          <div className="rounded-xl border border-white/60 bg-white p-4 shadow-xs">
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-gray-400">
                  Payment amount
                </p>
                <h4 className="text-sm font-semibold text-gray-900">
                  Accepted tokens & preset amounts
                </h4>
              </div>

              {Object.entries(groupedPaymentAmounts).map(
                ([tokenSymbol, configs]) => {
                  const isUnifiedUsdc =
                    configs.length > 1 &&
                    configs.every(
                      (config) =>
                        config.mint &&
                        typeof config.mint === "object" &&
                        "mintAddress" in config.mint &&
                        isUsdcToken(
                          config.mint.mintAddress,
                          config.mint.symbol,
                          config.mint.name
                        )
                    );

                  if (isUnifiedUsdc) {
                    // Show unified USDC display
                    const totalAmount = configs.reduce(
                      (sum, config) => sum + (config.amount || 0),
                      0
                    );
                    return (
                      <div
                        key={tokenSymbol}
                        className="flex flex-col gap-3 rounded-xl border border-gray-100 bg-gray-50/70 px-3 py-3"
                      >
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                          <div className="flex items-center gap-3">
                            <TokenAvatar
                              imageUrl="/assets/tokens/usdc.png"
                              symbol="USDC"
                              size="md"
                            />
                            <div className="space-y-1">
                              <span className="block text-sm font-semibold text-gray-900">
                                {totalAmount} USDC
                              </span>
                              <span className="text-[11px] font-medium uppercase tracking-[0.18em] text-gray-400">
                                unified amount across enabled chains
                              </span>
                            </div>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            {configs.map((config, index) => (
                              <div
                                key={index}
                                className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-2.5 py-1 text-xs font-medium text-gray-600"
                              >
                                <Image
                                  src={
                                    getChainLogo(config.chain) ||
                                    "/assets/tokens/default.png"
                                  }
                                  alt={config.chainName}
                                  width={18}
                                  height={18}
                                  className="h-4 w-4 rounded-full"
                                />
                                <span className="capitalize">
                                  {config.chainName}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    );
                  } else {
                    // Show individual chain displays
                    return (
                      <div key={tokenSymbol} className="space-y-3">
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
        </div>
      )}
    </div>
  );
};

export default LinkDetailContent;

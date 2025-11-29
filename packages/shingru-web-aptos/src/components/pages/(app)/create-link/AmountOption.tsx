import React, { useCallback, useEffect, useMemo } from "react";
import { Check } from "lucide-react";
import { CHAINS, isTestnet } from "@/config/chains";
import CuteTabs from "@/components/common/CuteTabs";
import TokenInput from "../username-pay/TokenInput";
import { cn } from "@/lib/utils";

const EMPTY_TOKENS: any[] = [];

const ChainTokenEditor = React.memo(function ChainTokenEditor({
  chainId,
  chain,
  tokens,
  onChainTokenChange,
  value,
}: {
  chainId: string;
  chain: any;
  tokens: any[];
  onChainTokenChange: (chainId: string, output: any) => void;
  value?: string;
}) {
  const handleChange = useCallback(
    (output: any) => {
      onChainTokenChange(chainId, output);
    },
    [chainId, onChainTokenChange]
  );

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <img
          src={chain?.logo}
          alt={`${chain?.name} logo`}
          className="w-5 h-5"
        />
        <h4 className="font-medium text-gray-900">{chain?.name}</h4>
      </div>
      <div className="p-1 bg-gray-50 rounded-3xl">
        <TokenInput
          mode="predefined"
          tokens={tokens}
          defaultToken="USDC"
          onChange={handleChange}
          value={value}
        />
      </div>
    </div>
  );
});
ChainTokenEditor.displayName = "ChainTokenEditor";

interface ChainTokenConfig {
  token: any | null;
  amount: string;
}

interface AmountOptionProps {
  pricingType: "fixed" | "open" | "free";
  onPricingTypeChange: (type: "fixed" | "open" | "free") => void;
  variant?: "payment" | "digital-product" | "fundraiser";
  useCustomTokens: boolean;
  onUseCustomTokensChange: (value: boolean) => void;
  stablecoinAmount: string;
  stablecoinToken: any | null;
  onStablecoinChange: (output: any) => void;
  chainTokenConfigs: Record<string, ChainTokenConfig>;
  onChainTokenChange: (chainId: string, output: any) => void;
  supportedChains: string[];
  availableChains: Array<{
    id: string;
    name: string;
    logo: string;
    testnetKey: string;
    mainnetKey: string;
  }>;
  goalAmount?: string;
  onGoalAmountChange?: (value: string) => void;
}

const AmountOption = React.memo(function AmountOption({
  pricingType,
  onPricingTypeChange,
  variant = "payment",
  useCustomTokens,
  onUseCustomTokensChange,
  stablecoinAmount,
  stablecoinToken,
  onStablecoinChange,
  chainTokenConfigs,
  onChainTokenChange,
  supportedChains,
  availableChains,
  goalAmount,
  onGoalAmountChange,
}: AmountOptionProps) {
  // Get available tokens for a specific chain (memoized to prevent re-creation)
  const getTokensForChain = useCallback((chainId: string) => {
    const mappedChainId =
      chainId === "APTOS"
        ? isTestnet
          ? "IOTA_TESTNET"
          : "IOTA_MAINNET"
        : chainId;

    const chainConfig = CHAINS[mappedChainId as keyof typeof CHAINS];
    return chainConfig ? chainConfig.tokens : EMPTY_TOKENS;
  }, []); // No dependencies needed as CHAINS and isTestnet are constants

  // Get USDC token for stablecoin mode
  const getStablecoinTokens = useCallback(() => {
    const stablecoins: any[] = [];
    for (const chainId of supportedChains) {
      const tokens = getTokensForChain(chainId);
      const usdc = tokens.find((token) => token.symbol === "USDC");
      if (usdc && !stablecoins.find((s) => s.symbol === usdc.symbol)) {
        stablecoins.push(usdc);
      }
    }
    return stablecoins;
  }, [supportedChains.join(",")]); // Stable dependency

  // Get available stablecoins (memoized)
  const availableStablecoins = useMemo(() => {
    return getStablecoinTokens();
  }, [getStablecoinTokens]);

  // Initialize default stablecoin token only once when component mounts
  useEffect(() => {
    if (
      !stablecoinToken &&
      availableStablecoins.length > 0 &&
      supportedChains.length > 0
    ) {
      onStablecoinChange({
        token: availableStablecoins[0],
        rawAmount: stablecoinAmount || "",
      });
    }
  }, []); // Empty dependency - only run once on mount

  // Pricing tabs (memoized to prevent re-creation)
  const pricingTabs = useMemo(() => {
    const baseTabs = [
      {
        id: "open",
        title: "Open Amount",
        content: <div></div>,
      },
      {
        id: "fixed",
        title: "Fixed Price",
        content: <div></div>,
      },
    ];

    // Add free option for digital products
    if (variant === "digital-product") {
      return [
        {
          id: "fixed",
          title: "Fixed Price",
          content: <div></div>,
        },
        {
          id: "open",
          title: "Open Amount",
          content: <div></div>,
        },
        {
          id: "free",
          title: "Free",
          content: <div></div>,
        },
      ];
    }

    // For fundraising, show set goal (primary) and open goal
    if (variant === "fundraiser") {
      return [
        {
          id: "fixed",
          title: "Set Goal",
          content: <div></div>,
        },
        {
          id: "open",
          title: "Open Goal",
          content: <div></div>,
        },
      ];
    }

    return baseTabs;
  }, [variant]);

  const handlePricingTypeChange = useCallback(
    (key: any) => {
      onPricingTypeChange(key as "fixed" | "open" | "free");
    },
    [onPricingTypeChange]
  );

  return (
    <div className="space-y-4">
      {/* <h2 className="text-xl font-bold">
        {variant === "digital-product"
          ? "Pricing"
          : variant === "fundraiser"
          ? "Fundraising Goal"
          : "Amount"}
      </h2> */}

      {/* Pricing Type Selection using CuteTabs */}
      <CuteTabs
        items={pricingTabs}
        selectedKey={pricingType}
        onSelectionChange={handlePricingTypeChange}
        size="lg"
        fullWidth
        className="w-full"
      />

      {/* Goal Amount Input for Fundraiser - Only show for "Set Goal" (fixed) pricing */}
      {variant === "fundraiser" && pricingType === "fixed" && (
        <div className="p-4 bg-gray-50 rounded-2xl">
          <label
            htmlFor="goal-amount"
            className="block text-sm font-medium text-gray-700"
          >
            Fundraising Goal
          </label>
          <div className="mt-1">
            <TokenInput
              mode="predefined"
              tokens={availableStablecoins}
              defaultToken="USDC"
              onChange={(output: any) =>
                onGoalAmountChange?.(output?.rawAmount)
              }
              value={goalAmount}
            />
          </div>
          <p className="mt-2 text-xs text-gray-500">
            Set a target amount for your campaign.
          </p>
        </div>
      )}

      {/* Pricing Type Descriptions */}
      <div className="">
        {pricingType === "free" && (
          <p className="text-sm text-gray-600">
            🎁{" "}
            <strong>
              Free{" "}
              {variant === "digital-product" ? "Digital Product" : "Payment"}:
            </strong>{" "}
            No payment required - perfect for{" "}
            {variant === "digital-product"
              ? "lead magnets, samples, or promotional content"
              : "collecting contact information"}
            !
          </p>
        )}
        {pricingType === "fixed" &&
          !useCustomTokens &&
          variant === "fundraiser" && (
            <p className="text-sm text-gray-600">
              🎯 <strong>Fundraising Goal:</strong> Set a target amount for your
              campaign. People can contribute any amount, and you&apos;ll track
              progress toward your goal!
            </p>
          )}
        {pricingType === "fixed" &&
          !useCustomTokens &&
          variant !== "fundraiser" && (
            <p className="text-sm text-gray-600">
              💵 <strong>Fixed Price + Stablecoin:</strong> Set one USDC amount
              that works across all selected chains - simple and consistent!
            </p>
          )}
        {pricingType === "fixed" &&
          useCustomTokens &&
          variant === "fundraiser" && (
            <p className="text-sm text-gray-600">
              🎯 <strong>Custom Token Goal:</strong> Set your fundraising goal
              using any token - maximum flexibility for your campaign!
            </p>
          )}
        {pricingType === "fixed" &&
          useCustomTokens &&
          variant !== "fundraiser" && (
            <p className="text-sm text-gray-600">
              ⚙️ <strong>Fixed Price + Custom Tokens:</strong> Configure
              different tokens and amounts for each chain - maximum flexibility!
            </p>
          )}
        {pricingType === "open" && variant === "fundraiser" && (
          <p className="text-sm text-gray-600">
            ♾️ <strong>Open Goal:</strong> No target amount - let your campaign
            grow infinitely as people contribute to your cause!
          </p>
        )}
        {pricingType === "open" && variant !== "fundraiser" && (
          <p className="text-sm text-gray-600">
            💰 <strong>Open Amount:</strong> Let customers choose their own
            amount - perfect for{" "}
            {variant === "digital-product"
              ? '"pay what you want" digital products'
              : "tips and donations"}
            !
          </p>
        )}
      </div>

      {/* Fixed Price Configuration */}
      {pricingType === "fixed" && (
        <div className="space-y-4">
          {/* Custom tokens toggle - hide for fundraising */}
          {variant !== "fundraiser" && (
            <div className="p-4 bg-gray-50 rounded-2xl opacity-50">
              <div className="flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-gray-900">
                      Use Custom Tokens
                    </h4>
                    <div className="px-2 py-0.5 text-xs font-medium text-gray-600 bg-gray-200 rounded-full">
                      Coming Soon
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Set any token for each supported chain.
                  </p>
                </div>
                <button
                  type="button"
                  disabled
                  className={cn(
                    "w-6 h-6 rounded-md border-2 transition-all flex items-center justify-center flex-shrink-0 cursor-not-allowed",
                    "focus-visible:ring-primary focus-visible:ring-2",
                    "border-gray-300 bg-transparent"
                  )}
                />
              </div>
            </div>
          )}

          {/* Stablecoin Mode - NOT shown for fundraisers (they use goal input instead) */}
          {variant !== "fundraiser" && !useCustomTokens && (
            <div>
              <TokenInput
                mode="predefined"
                tokens={availableStablecoins}
                defaultToken="USDC"
                onChange={onStablecoinChange}
                value={stablecoinAmount}
              />
            </div>
          )}

          {/* Custom Tokens Mode - only for non-fundraising */}
          {variant !== "fundraiser" && useCustomTokens && (
            <div className="space-y-4">
              {supportedChains.map((chainId) => {
                const chain = availableChains.find((c) => c.id === chainId);
                return (
                  <ChainTokenEditor
                    key={chainId}
                    chainId={chainId}
                    chain={chain}
                    tokens={getTokensForChain(chainId) as any[]}
                    onChainTokenChange={onChainTokenChange}
                    value={chainTokenConfigs[chainId]?.amount}
                  />
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Free Product Note */}
      {pricingType === "free" && variant === "digital-product" && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-2xl">
          <div className="flex items-start gap-3">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 mt-0.5">
              <span className="text-green-600 text-xs font-bold">✓</span>
            </div>
            <div className="flex-1">
              <p className="text-green-700 text-sm font-medium">
                Free Digital Product
              </p>
              <p className="text-green-600 text-sm mt-1">
                Customers will only need to provide their email to receive the
                digital files. No payment required!
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

export default AmountOption;

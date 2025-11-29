import React from "react";
import { Check } from "lucide-react";
import Image from "next/image";

interface Chain {
  id: string;
  name: string;
  logo: string;
  testnetKey: string;
  mainnetKey: string;
}

interface SelectChainOptionProps {
  availableChains: Chain[];
  supportedChains: string[];
  onChainToggle: (chainId: string) => void;
  showForFreeProducts?: boolean;
  pricingType?: "free" | "fixed" | "open";
}

export default function SelectChainOption({
  availableChains,
  supportedChains,
  onChainToggle,
  showForFreeProducts = false,
  pricingType = "fixed",
}: SelectChainOptionProps) {
  // Don't show for free products unless explicitly requested
  if (pricingType === "free" && !showForFreeProducts) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-lg bg-white">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h3 className="text-base font-semibold">Supported Chains</h3>
          <p className="text-sm text-gray-500">
            {pricingType === "free"
              ? "Select the chains you want to support"
              : "Select the chains you want to support for payments"}
          </p>
        </div>

        <div className="flex w-full flex-wrap items-center justify-start gap-2 md:w-auto md:shrink-0 md:justify-end">
          {availableChains.map((chain) => {
            const isSelected = supportedChains.includes(chain.id);

            return (
              <button
                key={chain.id}
                type="button"
                className={`cursor-pointer flex items-center gap-2 px-3 py-2 rounded-full transition-all ${
                  isSelected ? "bg-gray-100" : "bg-gray-50 hover:bg-gray-100"
                }`}
                onClick={() => onChainToggle(chain.id)}
              >
                <Image
                  src={chain.logo}
                  alt={`${chain.name} logo`}
                  width={16}
                  height={16}
                />
                <span className={`text-sm font-medium transition-colors`}>
                  {chain.name}
                </span>
                <div
                  className={`size-3 shrink-0 rounded-full border flex items-center justify-center transition-all ${
                    isSelected
                      ? "border-blue-500 bg-blue-500"
                      : "border-gray-300"
                  }`}
                >
                  {isSelected && <Check className="w-3 h-3 text-white" />}
                </div>
              </button>
            );
          })}
        </div>
      </div>
      {/* Error message when no chains selected for paid products */}
      {pricingType !== "free" && supportedChains.length === 0 && (
        <div className="rounded-lg bg-red-50 p-3 text-sm font-medium text-red-600">
          Please select at least one chain for paid products.
        </div>
      )}
    </div>
  );
}

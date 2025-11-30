"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import {
  userService,
  type ChainId,
  type BalanceResponse,
  type TokenBalance,
} from "@/lib/api/user";
import { SupportedChain } from "@/config/chains";
import {
  formatUiNumber,
  formatStringToNumericDecimals,
  serializeFormattedStringToFloat,
} from "@/utils/formatting";
import { WalletIcon, RefreshCw, ChevronDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import SkeletonLoader from "@/components/common/SkeletonLoader";
import CustomDropdown from "@/components/common/CustomDropdown";
import TokenAvatar from "@/components/common/TokenAvatar";

// Combined token type for easier handling
export interface CombinedToken {
  mint?: string;
  name: string;
  symbol: string;
  decimals: number;
  imageUrl?: string | null;
  amount: number;
  isNative?: boolean;
  priceUsd?: number;
}

// Predefined token type
export interface PredefinedToken {
  name: string;
  symbol: string;
  address?: string;
  mint?: string; // Allow both address and mint for compatibility
  decimals: number;
  image?: string;
  isNative?: boolean;
  priceUsd?: number;
}

// Output type for the component
export interface TokenInputOutput {
  token: {
    name: string;
    symbol: string;
    decimals: number;
    logo?: string | null;
    address?: string;
    isNative?: boolean;
  };
  amount: number;
  rawAmount: string;
}

interface TokenInputProps {
  address?: string;
  chain?: SupportedChain;
  onChange?: (output: TokenInputOutput | null) => void;
  placeholder?: string;
  defaultToken?: string; // symbol or mint address
  mode?: "balance" | "predefined";
  tokens?: PredefinedToken[]; // For predefined mode
  isShowMax?: boolean;
  balance?: number; // For predefined mode balance display
  showDollarValue?: boolean; // Show dollar value below amount input
  value?: string;
  disabled?: boolean; // Make the input read-only
}

// Convert chain to API chain ID
const getChainId = (chain: SupportedChain): ChainId => {
  switch (chain) {
    case "APTOS":
      return process.env.NEXT_PUBLIC_IS_TESTNET === "true"
        ? "IOTA_TESTNET"
        : "IOTA_MAINNET";
    default:
      return "IOTA_TESTNET";
  }
};

function TokenInput({
  address,
  chain,
  onChange,
  placeholder = "0.00",
  defaultToken,
  mode = "balance",
  tokens: predefinedTokens = [],
  isShowMax = false,
  balance,
  showDollarValue = false,
  value,
  disabled = false,
}: TokenInputProps) {
  const [tokens, setTokens] = useState<CombinedToken[]>([]);
  const [selectedToken, setSelectedToken] = useState<CombinedToken | null>(
    null
  );
  const [amount, setAmount] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [isChainSwitching, setIsChainSwitching] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [isRefreshingBalance, setIsRefreshingBalance] = useState(false);
  const hasInitializedPredefinedTokens = useRef(false);


  useEffect(() => {
    // Only update if value is different to prevent infinite loops
    if (value !== undefined && value !== null && value !== "") {
      setAmount((prev) => {
        // Only update if the value actually changed
        if (prev === value) {
          return prev;
        }
        return value;
      });
    } else if (value === "" || value === null) {
      // Only clear if explicitly set to empty/null (not undefined)
      setAmount((prev) => {
        if (prev === "") {
          return prev;
        }
        return "";
      });
    }
  }, [value]);

  const handleDropdownOpenChange = useCallback((open: boolean) => {
    setIsDropdownOpen(open);
  }, []);

  // Convert API response to combined tokens (no dependencies needed as it's a pure function)
  const convertToTokens = (data: BalanceResponse): CombinedToken[] => {
    const tokens: CombinedToken[] = [];

    // Add native token
    tokens.push({
      ...data.nativeBalance,
      isNative: true,
    });

    // Add other tokens
    const tokenBalances =
      "tokenBalance" in data ? data.tokenBalance : data.splBalance;
    tokenBalances.forEach((tokenBalance: TokenBalance) => {
      tokens.push({
        mint: tokenBalance.mint,
        name: tokenBalance.token.name,
        symbol: tokenBalance.token.symbol,
        decimals: tokenBalance.token.decimals,
        imageUrl: tokenBalance.token.imageUrl,
        amount: tokenBalance.tokenAmount,
        isNative: false,
      });
    });

    return tokens;
  };

  // Convert predefined tokens to combined tokens
  const convertPredefinedTokens = (
    predefinedTokens: PredefinedToken[],
    balanceValue?: number
  ): CombinedToken[] => {
    return predefinedTokens.map((token) => ({
      mint: token.address || token.mint, // Use address if available, fallback to mint
      name: token.name,
      symbol: token.symbol,
      decimals: token.decimals,
      imageUrl: token.image,
      amount: balanceValue || 0, // Use provided balance or 0
      isNative: token.isNative || false,
      priceUsd: token.priceUsd,
    }));
  };

  // Handle amount change with proper formatting
  const handleAmountChange = (value: string) => {
    // Use formatStringToNumericDecimals for input formatting
    const maxDecimals = selectedToken?.decimals || 9;
    const formattedValue = formatStringToNumericDecimals(value, maxDecimals);
    setAmount(formattedValue);
  };

  // Handle max button click
  const handleMaxClick = () => {
    if (!selectedToken) return;
    const maxAmount =
      mode === "predefined" && balance !== undefined
        ? balance
        : selectedToken.amount;
    const maxDecimals = selectedToken.decimals;
    const formattedValue = formatStringToNumericDecimals(
      maxAmount.toString(),
      maxDecimals
    );
    setAmount(formattedValue);
  };

  // Handle token selection
  const handleTokenSelect = (token: CombinedToken) => {
    setSelectedToken(token);
    setIsDropdownOpen(false);
  };

  // Emit changes to parent
  useEffect(() => {
    if (!onChange) return;

    // In predefined mode, don't emit changes until a token is selected during initialization
    if (mode === "predefined" && !selectedToken) {
      return;
    }

    // If we have a value prop set (controlled mode), don't emit null when token/amount is missing
    // This prevents clearing RWA purchase values
    if (value !== undefined && value !== null && value !== "" && (!selectedToken || !amount || amount === "0")) {
      // Value is being controlled externally (e.g., RWA purchase), wait for token to be set
      return;
    }

    if (!selectedToken || !amount || amount === "0") {
      // Use a ref or flag to prevent infinite loops when clearing
      const shouldEmitNull = !selectedToken || !amount || amount === "0";
      if (shouldEmitNull) {
        // Only emit null if we're not in a controlled mode with a value
        if (value === undefined || value === null || value === "") {
          onChange(null);
        }
      }
      return;
    }

    const numericAmount = serializeFormattedStringToFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      // Only emit null if we're not in a controlled mode
      if (value === undefined || value === null || value === "") {
        onChange(null);
      }
      return;
    }

    const output = {
      token: {
        name: selectedToken.name,
        symbol: selectedToken.symbol,
        decimals: selectedToken.decimals,
        logo: selectedToken.imageUrl,
        address: selectedToken.mint, // Use address instead of mint for consistency
        isNative: selectedToken.isNative,
      },
      amount: numericAmount,
      rawAmount: amount,
    };

    // Use a ref to track last emitted value to prevent duplicate emissions
    onChange(output);
  }, [selectedToken, amount, onChange, mode, value]);

  // Memoize converted predefined tokens
  const convertedPredefinedTokens = useMemo(() => {
    if (mode === "predefined") {
      return convertPredefinedTokens(predefinedTokens, balance);
    }
    return [];
  }, [mode, predefinedTokens, balance]);

  // Handle predefined tokens mode
  useEffect(() => {
    if (mode === "predefined" && convertedPredefinedTokens.length > 0) {
      // Only initialize once to prevent infinite loops
      if (hasInitializedPredefinedTokens.current) {
        return;
      }

      setTokens(convertedPredefinedTokens);

      // Auto-select default token or first token
      let tokenToSelect = convertedPredefinedTokens[0];

      if (defaultToken) {
        const foundToken = convertedPredefinedTokens.find(
          (t: CombinedToken) =>
            t.symbol.toLowerCase() === defaultToken.toLowerCase() ||
            t.mint === defaultToken
        );
        if (foundToken) {
          tokenToSelect = foundToken;
        }
      }

      // Only set if not already set to prevent infinite loops
      setSelectedToken((prev) => {
        if (prev?.mint === tokenToSelect.mint && prev?.symbol === tokenToSelect.symbol) {
          return prev; // No change needed
        }
        hasInitializedPredefinedTokens.current = true;
        return tokenToSelect;
      });
    } else if (mode !== "predefined") {
      // Reset flag when mode changes
      hasInitializedPredefinedTokens.current = false;
    }
  }, [mode, convertedPredefinedTokens, defaultToken]);

  // Handle chain/address changes and initial load (balance mode only)
  useEffect(() => {
    if (mode !== "balance" || !address || !chain) return;

    const fetchBalances = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const chainId = getChainId(chain);
        const response = await userService.getBalance(address, chainId);

        if (response.error) {
          // Don't show "Backend not configured" error - it's expected in backend-less mode
          // Instead, silently fall back to predefined mode behavior
          if (response.error.includes("Backend not configured") || response.error.includes("backend-less mode")) {
            // In backend-less mode, don't show error - just use empty tokens
            // The parent component should handle predefined mode
            setError(null);
            setTokens([]);
          } else {
            setError(response.error);
            setTokens([]);
          }
        } else if (response.data) {
          const convertedTokens = convertToTokens(response.data);
          setTokens(convertedTokens);

          // Auto-select default token or first token
          if (convertedTokens.length > 0) {
            let tokenToSelect = convertedTokens[0];

            // Try to match the default token
            if (defaultToken) {
              const foundToken = convertedTokens.find(
                (t) =>
                  t.symbol.toLowerCase() === defaultToken.toLowerCase() ||
                  t.mint === defaultToken
              );
              if (foundToken) {
                tokenToSelect = foundToken;
              }
            }

            setSelectedToken(tokenToSelect);
          }
        }
      } catch {
        setError("Failed to fetch balances");
        setTokens([]);
      } finally {
        setIsLoading(false);
        setIsInitialLoad(false); // Mark initial load as complete
      }
    };

    setIsChainSwitching(true);
    setIsInitialLoad(true); // Reset for new chain
    setTokens([]);
    setSelectedToken(null);
    // Don't clear amount if value prop is provided (e.g., for RWA purchases)
    if (value === undefined) {
      setAmount("");
    } else if (value) {
      // Preserve the value if it's provided
      setAmount(value);
    }
    setError(null);

    // Small delay to show the switching state, then fetch
    const timeoutId = setTimeout(() => {
      setIsChainSwitching(false);
      fetchBalances();
    }, 150);

    return () => clearTimeout(timeoutId);
  }, [chain, address, defaultToken, mode, value]);

  // Silent refresh for background updates (no loading states)
  const silentRefreshBalances = useCallback(async () => {
    if (mode !== "balance" || !address || !chain) return;
    
    // Skip if already refreshing
    if (isRefreshingBalance) return;

    setIsRefreshingBalance(true);

    try {
      const chainId = getChainId(chain);
      const response = await userService.getBalance(address, chainId);

      // Silently ignore backend-less mode errors in silent refresh
      if (response.error && (response.error.includes("Backend not configured") || response.error.includes("backend-less mode"))) {
        return; // Don't update anything, just return silently
      }

      if (response.data) {
        const convertedTokens = convertToTokens(response.data);
        
        // ONLY update tokens array - don't touch selectedToken
        // This prevents any onChange triggers and button flickering
        setTokens(convertedTokens);
        
        // If no token is currently selected, select one
        if (!selectedToken && convertedTokens.length > 0) {
          let tokenToSelect = convertedTokens[0];

          if (defaultToken) {
            const foundToken = convertedTokens.find(
              (t) =>
                t.symbol.toLowerCase() === defaultToken.toLowerCase() ||
                t.mint === defaultToken
            );
            if (foundToken) {
              tokenToSelect = foundToken;
            }
          }

          setSelectedToken(tokenToSelect);
        }
      }
    } catch {
      // Silently fail on background refresh
    } finally {
      setIsRefreshingBalance(false);
    }
  }, [address, chain, defaultToken, mode, selectedToken]);

  // Refresh function for manual retry (with loading states)
  const refreshBalances = useCallback(async () => {
    if (mode !== "balance" || !address || !chain) return;

    setIsLoading(true);
    setError(null);

    try {
      const chainId = getChainId(chain);
      const response = await userService.getBalance(address, chainId);

      if (response.error) {
        // Don't show "Backend not configured" error - it's expected in backend-less mode
        if (response.error.includes("Backend not configured") || response.error.includes("backend-less mode")) {
          setError(null);
          setTokens([]);
        } else {
          setError(response.error);
          setTokens([]);
        }
      } else if (response.data) {
        const convertedTokens = convertToTokens(response.data);
        setTokens(convertedTokens);

        // Preserve currently selected token or auto-select default/first token
        if (convertedTokens.length > 0) {
          let tokenToSelect = convertedTokens[0];

          // First, try to match the currently selected token
          if (selectedToken) {
            const foundCurrentToken = convertedTokens.find(
              (t) =>
                (selectedToken.isNative && t.isNative) ||
                (!selectedToken.isNative && t.mint === selectedToken.mint)
            );
            if (foundCurrentToken) {
              tokenToSelect = foundCurrentToken;
            }
          } 
          // Otherwise, try to match the default token
          else if (defaultToken) {
            const foundToken = convertedTokens.find(
              (t) =>
                t.symbol.toLowerCase() === defaultToken.toLowerCase() ||
                t.mint === defaultToken
            );
            if (foundToken) {
              tokenToSelect = foundToken;
            }
          }

          setSelectedToken(tokenToSelect);
        }
      }
    } catch {
      setError("Failed to fetch balances");
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, [address, chain, defaultToken, mode, selectedToken]);

  // Auto-refresh balances every 5 seconds (balance mode only)
  useEffect(() => {
    if (mode !== "balance" || !address || !chain) return;

    const intervalId = setInterval(() => {
      silentRefreshBalances();
    }, 5000); // Refresh every 5 seconds

    return () => clearInterval(intervalId);
  }, [mode, address, chain, silentRefreshBalances]);

  if (error && mode === "balance") {
    return (
      <div className="alert alert-error">
        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-error/20 flex items-center justify-center">
            <span className="text-error text-xs">!</span>
          </div>
          <span className="text-error text-sm font-medium">{error}</span>
        </div>
        <button
          onClick={refreshBalances}
          className="text-error mt-3 inline-flex items-center justify-center gap-1 text-xs"
        >
          <RefreshCw className="w-3 h-3" />
          Try again
        </button>
      </div>
    );
  }

  const showBalance = mode === "balance";
  const isLoadingState = mode === "balance" && isInitialLoad && (isLoading || isChainSwitching);
  const isSelectorDisabled =
    tokens.length === 0 || (showBalance ? isLoadingState : false);

  const tokenSelector = (
    <CustomDropdown
      open={isDropdownOpen}
      onOpenChange={handleDropdownOpenChange}
      disabled={isSelectorDisabled}
      align="right"
      sideOffset={12}
      triggerClassName="cursor-pointer shrink-0 rounded-full px-3 py-2 bg-gray-200 hover:bg-gray-300 transition-colors flex items-center gap-2 focus-visible:ring-gray-300"
      contentClassName="mt-0 w-fit max-h-64 overflow-y-auto border border-gray-100 p-2"
      wrapperClassName="w-fit"
      ariaLabel="Token selector"
      trigger={
        <>
          {selectedToken ? (
            <div className="flex flex-row items-center gap-2">
              <TokenAvatar
                imageUrl={selectedToken.imageUrl}
                symbol={selectedToken.symbol}
                size="sm"
                isNative={selectedToken.isNative}
                chain={chain}
              />
              <span className="font-semibold text-gray-900 text-sm">
                {selectedToken.symbol}
              </span>
            </div>
          ) : isLoadingState ? (
            <span className="loading loading-spinner loading-xs"></span>
          ) : (
            <div className="flex flex-row items-center gap-2">
              <div className="w-6 h-6 rounded-full bg-gray-200"></div>
              <span className="font-medium text-gray-500 text-sm">Select</span>
            </div>
          )}
          <ChevronDown
            className={`w-4 h-4 ml-6 flex-shrink-0 transition-transform ${
              isDropdownOpen ? "rotate-180" : ""
            }`}
          />
        </>
      }
    >
      {isLoadingState ? (
        <div className="p-3 space-y-2">
          <div className="skeleton h-12 w-full rounded-xl"></div>
          <div className="skeleton h-12 w-full rounded-xl"></div>
          <div className="text-center text-xs text-gray-500 py-2">
            {isChainSwitching ? "Switching chains..." : "Loading tokens..."}
          </div>
        </div>
      ) : tokens.length === 0 ? (
        <div className="p-4 text-center">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-2">
            <WalletIcon className="w-5 h-5 text-gray-400" />
          </div>
          <div className="text-sm text-gray-500">No tokens found</div>
        </div>
      ) : (
        <div className="space-y-1">
          {tokens.map((token, index) => (
            <button
              key={`${token.mint || "native"}-${index}`}
              type="button"
              onClick={() => handleTokenSelect(token)}
              className="w-full flex items-center gap-3 p-2 rounded-lg text-left hover:bg-gray-50 focus:bg-gray-50 focus-visible:outline-none"
              role="menuitem"
            >
              <TokenAvatar
                imageUrl={token.imageUrl}
                symbol={token.symbol}
                size="smd"
                isNative={token.isNative}
                chain={chain}
                className="flex-shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="font-medium text-gray-900 text-sm truncate">
                  {token.symbol}
                </div>
                <div className="text-xs text-gray-500 truncate">
                  {token.name}
                </div>
              </div>
              {showBalance && (
                <div className="text-right flex-shrink-0">
                  <div className="font-medium text-gray-900 text-sm">
                    {formatUiNumber(token.amount, "", {
                      maxDecimals: Math.min(4, token.decimals),
                      exactDecimals: true,
                    })}
                  </div>
                  {token.isNative && (
                    <div className="text-xs text-primary-700 font-medium">
                      Native
                    </div>
                  )}
                </div>
              )}
            </button>
          ))}
        </div>
      )}
    </CustomDropdown>
  );

  // Calculate dollar value
  const dollarValue =
    showDollarValue && amount && selectedToken && selectedToken.priceUsd
      ? serializeFormattedStringToFloat(amount) * selectedToken.priceUsd
      : null;


  // Different layouts for different modes
  if (mode === "balance") {
    // Original balance mode layout
    return (
      <div className="bg-gray-100 w-full rounded-[1.4rem] p-4 border border-gray-100 focus-within:ring-2 focus-within:ring-primary">
        <div className="flex flex-row items-center justify-between gap-4">
          {/* Amount and balance */}
          <div className="flex flex-col items-start flex-1">
            <SkeletonLoader
              isLoading={isLoadingState}
              skeletonClassName="h-8 w-full rounded-xl"
              className="h-8 w-full"
            >
              <input
                type="text"
                value={amount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder={placeholder}
                className="text-xl font-semibold outline-none w-full bg-transparent text-gray-900 placeholder-gray-400"
                disabled={!selectedToken}
              />
            </SkeletonLoader>
            {showBalance && (
              <div className="text-xs text-left text-gray-400 mt-1">
                <SkeletonLoader
                  isLoading={isLoadingState}
                  skeletonClassName="h-4 w-full rounded-xl"
                  className="h-4 min-w-[5rem]"
                >
                  {selectedToken ? (
                    <div className="flex items-center gap-1 whitespace-nowrap">
                      <WalletIcon className="w-3 h-3" />
                      {formatUiNumber(
                        selectedToken.amount,
                        selectedToken.symbol,
                        {
                          maxDecimals: 4,
                          exactDecimals: true,
                        }
                      )}
                    </div>
                  ) : (
                    <span>Select a token</span>
                  )}
                </SkeletonLoader>
              </div>
            )}
          </div>

          {/* Token Selection with Dropdown */}
          <SkeletonLoader
            isLoading={isLoadingState}
            skeletonClassName="h-10 w-full rounded-full"
            className="w-fit h-10"
          >
            {tokenSelector}
          </SkeletonLoader>
        </div>
      </div>
    );
  }

  // Predefined mode layout (tidy version)
  return (
    <div className="w-full rounded-2xl p-4 bg-gray-50 focus-within:ring-2 focus-within:ring-primary">
      {/* Top row - Amount input and Token selector */}
      <div className="flex flex-row items-center justify-between gap-4">
        {/* Left side - Amount input (bigger) */}
        <Input
          type="text"
          value={amount}
          onChange={(e) => handleAmountChange(e.target.value)}
          placeholder={placeholder}
          className={`text-2xl pl-2 font-semibold outline-none text-gray-900 placeholder-gray-400 focus-visible:ring-0 border-none ${disabled ? 'opacity-75 cursor-not-allowed' : ''}`}
          disabled={disabled || !selectedToken}
        />

        {/* Right side - Token selector */}
        {tokenSelector}
      </div>

      {/* Bottom row - USD value, Balance, and Max button */}
      {selectedToken &&
        (showDollarValue ||
          isShowMax ||
          (mode === "predefined" && balance !== undefined)) && (
          <div className="flex items-center justify-between mt-3">
            {/* Left side - USD value */}
            {showDollarValue && dollarValue !== null && (
              <div className="text-sm text-gray-500">
                ≈ ${formatUiNumber(dollarValue, "", { maxDecimals: 2 })}
              </div>
            )}
            {/* Right side - Balance and Max */}
            <div className="flex items-center gap-3 ml-auto">
              {(showBalance ||
                (mode === "predefined" && balance !== undefined)) && (
                <div className="flex items-center gap-1 text-xs text-gray-400">
                  <WalletIcon className="w-3 h-3" />
                  {formatUiNumber(
                    mode === "predefined" && balance !== undefined
                      ? balance
                      : selectedToken.amount,
                    selectedToken.symbol,
                    {
                      maxDecimals: 4,
                      exactDecimals: true,
                    }
                  )}
                </div>
              )}

              {isShowMax && selectedToken && (
                <button
                  onClick={handleMaxClick}
                  className="px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition-colors"
                  disabled={!selectedToken}
                >
                  Max
                </button>
              )}
            </div>
          </div>
        )}
    </div>
  );
}

export default TokenInput;

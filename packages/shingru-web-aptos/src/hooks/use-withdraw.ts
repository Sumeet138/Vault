import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useMetaKeys } from "@/providers/MetaKeysProvider";
import { useUser } from "@/providers/UserProvider";
import {
  type UserToken as TokenBalance,
} from "@/lib/api/user";
import { txService } from "@/lib/api/tx";
import { addressService, type SearchResult } from "@/lib/api/address";
import {
  FEE_CONFIGS,
  getFeeMultiplier,
} from "@/config/chains";
import { type TokenInputOutput } from "@/components/pages/(app)/username-pay/TokenInput";
import { useDebounce } from "@uidotdev/usehooks";
import { Sound, useSound } from "@/providers/SoundProvider";
import ShingruStealthAptos from "@/lib/@shingru/core/shingru-stealth-aptos";
import { Aptos, AptosConfig, Network, Account, AccountAddress, U64 } from "@aptos-labs/ts-sdk";
import { CHAINS, isTestnet } from "@/config/chains";
import { Buffer } from "buffer";

interface FeeDetails {
  fee: number;
  amountToReceive: number;
  totalDebit: number;
  mode: "EXACT" | "DEDUCTED";
  // Add BigInts for precision
  feeBigInt: bigint;
  amountToReceiveBigInt: bigint;
  totalDebitBigInt: bigint;
}

interface UseWithdrawArgs {
  token: TokenBalance | null | undefined;
  initialSearchQuery?: string | null;
}

export function useWithdraw({ token, initialSearchQuery }: UseWithdrawArgs) {
  const { accessToken, me } = useAuth();
  const { playSound } = useSound();
  const { metaKeys } = useMetaKeys();
  const { refreshActivities, refreshStealthBalances, stealthBalances } = useUser();

  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showSuccessDialog, setShowSuccessDialog] = useState(false);
  const [lastTxSignature, setLastTxSignature] = useState<string | null>(null);
  const [currentTxNumber, setCurrentTxNumber] = useState(0);
  const [totalTxCount, setTotalTxCount] = useState(0);

  // Search state
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedResult, setSelectedResult] = useState<SearchResult | null>(
    null
  );
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Set initial search query when provided
  useEffect(() => {
    if (initialSearchQuery && initialSearchQuery.trim()) {
      setSearchQuery(initialSearchQuery);
    }
  }, [initialSearchQuery]);

  // Amount and fee state
  const [withdrawAmount, setWithdrawAmount] = useState<TokenInputOutput | null>(
    null
  );
  const [feeDetails, setFeeDetails] = useState<FeeDetails | null>(null);

  // Get the chain key for the current token
  const getChainKey = (chain: string) => {
    return chain;
  };

  // Define handlers before they're used in effects
  const handleResultSelect = useCallback((result: SearchResult) => {
    setSelectedResult(result);
    setSearchQuery("");
    setSearchResults([]);
  }, []);

  const handleClearSearch = useCallback(() => {
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResult(null);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      setIsSearching(true);
      setSearchResults([]);
    } else {
      setIsSearching(false);
      setSearchResults([]);
    }
  }, [searchQuery]);

  // Search effect
  useEffect(() => {
    if (!debouncedSearchQuery.trim() || !token) {
      setSearchResults([]);
      if (!token && debouncedSearchQuery.trim()) {
        setIsSearching(false);
      }
      return;
    }

    const performSearch = async () => {
      if (debouncedSearchQuery.trim().length < 2) {
        setSearchResults([]);
        setIsSearching(false);
        return;
      }

      try {
        const response = await addressService.searchDestination(
          debouncedSearchQuery,
          token.chain
        );
        const results = response.data?.results || [];
        setSearchResults(results);

        // Auto-select if it's a Vault link and we found exactly one result
        const vaultLinkRegex =
          /^https?:\/\/vault-aptos\.vercel\.app\/[a-zA-Z0-9_.-]+(?:\/.*)?$/i;
        if (vaultLinkRegex.test(debouncedSearchQuery) && results.length === 1) {
          const result = results[0];
          // Only auto-select if it's a vault type result
          if (result.type === "vault" || result.type === "username") {
            handleResultSelect(result);
          }
        }
      } catch {
        setSearchResults([]);
      } finally {
        setIsSearching(false);
      }
    };

    performSearch();
  }, [debouncedSearchQuery, token, handleResultSelect]);

  // Fee calculation effect
  useEffect(() => {
    if (!withdrawAmount || !token || withdrawAmount.amount <= 0) {
      setFeeDetails(null);
      return;
    }

    const decimals = token.decimals;
    // Use BigInt for all calculations to avoid floating point errors
    const enteredAmountBigInt = BigInt(
      Math.round(withdrawAmount.amount * 10 ** decimals)
    );

    const chainKey = "APTOS";
    const feeConfig = FEE_CONFIGS[chainKey as keyof typeof FEE_CONFIGS];

    if (!feeConfig) {
      setFeeDetails(null);
      return;
    }

    // Calculate fee divisor from the centralized config
    const feeDivisor = getFeeMultiplier(feeConfig.WITHDRAWAL_FEE_PERCENTAGE);
    const totalBalanceBigInt = BigInt(Math.round(token.total * 10 ** decimals));

    // Special case: 0% fee (no fee charged)
    if (feeDivisor === 0n) {
      const totalDebitBigInt =
        enteredAmountBigInt <= totalBalanceBigInt
          ? enteredAmountBigInt
          : totalBalanceBigInt;

      setFeeDetails({
        fee: 0,
        amountToReceive: Number(totalDebitBigInt) / 10 ** decimals,
        totalDebit: Number(totalDebitBigInt) / 10 ** decimals,
        mode: "EXACT",
        feeBigInt: 0n,
        amountToReceiveBigInt: totalDebitBigInt,
        totalDebitBigInt: totalDebitBigInt,
      });
      return;
    }

    // EXACT mode calculation: total = sent / (1 - fee) = sent * divisor / (divisor - 1)
    let totalDebitExactBigInt =
      (enteredAmountBigInt * feeDivisor) / (feeDivisor - 1n);
    if ((enteredAmountBigInt * feeDivisor) % (feeDivisor - 1n) !== 0n) {
      totalDebitExactBigInt += 1n; // Round up to cover fee
    }

    if (totalDebitExactBigInt <= totalBalanceBigInt) {
      // "EXACT" mode
      const feeBigInt = totalDebitExactBigInt - enteredAmountBigInt;
      setFeeDetails({
        fee: Number(feeBigInt) / 10 ** decimals,
        amountToReceive: Number(enteredAmountBigInt) / 10 ** decimals,
        totalDebit: Number(totalDebitExactBigInt) / 10 ** decimals,
        mode: "EXACT",
        feeBigInt,
        amountToReceiveBigInt: enteredAmountBigInt,
        totalDebitBigInt: totalDebitExactBigInt,
      });
    } else {
      // "DEDUCTED" mode
      const totalDebitDeductedBigInt =
        totalBalanceBigInt < enteredAmountBigInt
          ? totalBalanceBigInt
          : enteredAmountBigInt;

      const feeBigInt = totalDebitDeductedBigInt / feeDivisor;
      const amountToReceiveBigInt = totalDebitDeductedBigInt - feeBigInt;

      setFeeDetails({
        fee: Number(feeBigInt) / 10 ** decimals,
        amountToReceive: Number(amountToReceiveBigInt) / 10 ** decimals,
        totalDebit: Number(totalDebitDeductedBigInt) / 10 ** decimals,
        mode: "DEDUCTED",
        feeBigInt,
        amountToReceiveBigInt,
        totalDebitBigInt: totalDebitDeductedBigInt,
      });
    }
  }, [withdrawAmount, token]);

  const performWithdrawal = async (note?: string) => {
    if (
      !accessToken ||
      !me ||
      !metaKeys ||
      isSending ||
      !feeDetails ||
      !token ||
      !selectedResult
    ) {
      setError("An unexpected error occurred. Please try again.");
      return;
    }

    let recipient = "";
    if (selectedResult.type === "address") {
      recipient = selectedResult.address;
    } else if (selectedResult.type === "ans") {
      recipient = selectedResult.targetAddress;
    } else if (
      selectedResult.type === "vault" ||
      selectedResult.type === "username"
    ) {
      // Use username for Vault-to-Vault transfers
      recipient = selectedResult.username;
    } else {
      setError("Withdrawing to this destination is not yet supported.");
      return;
    }

    const amountToWithdraw = feeDetails.totalDebitBigInt;

    if (
      amountToWithdraw > BigInt(Math.round(token.total * 10 ** token.decimals))
    ) {
      setError("Amount is greater than balance");
      return;
    }
    if (!recipient) {
      setError("Please select a valid destination address");
      return;
    }
    if (amountToWithdraw <= 0n) {
      setError("Amount must be greater than 0");
      return;
    }

    setError(null);
    setIsSending(true);

    try {
      if (token.chain === "APTOS_TESTNET" || token.chain === "APTOS_MAINNET") {
        // Aptos withdrawal flow
        console.log("Preparing Aptos withdrawal:", {
          chain: token.chain,
          recipient,
          token: token.mintAddress,
        });

        // Get user's stealth balances for this token
        const tokenBalance = stealthBalances?.find(
          (t) => t.mintAddress === token.mintAddress && t.chain === token.chain
        );

        if (!tokenBalance) {
          setError(`Token ${token.symbol} not found in your stealth balances. Please try refreshing.`);
          setIsSending(false);
          return;
        }

        const tokenStealthBalances = tokenBalance?.balances?.filter(
          (sb) => sb.amount > 0
        ) || [];

        if (tokenStealthBalances.length === 0) {
          setError("No stealth balances with available funds found for this token");
          setIsSending(false);
          return;
        }

        // Select stealth addresses to withdraw from
        const withdrawals: { fromStealthAddress: string; amount: string; ephemeralPubkey: string }[] = [];
        let remainingAmount = amountToWithdraw;

        for (const stealthBalance of tokenStealthBalances) {
          if (remainingAmount <= 0n) break;

          const availableAmount = BigInt(Math.round(stealthBalance.amount * 10 ** token.decimals));
          const amountFromThis = remainingAmount < availableAmount ? remainingAmount : availableAmount;

          if (!stealthBalance.ephemeralPubkey) {
            console.error("Stealth balance missing ephemeralPubkey:", stealthBalance);
            setError("Invalid stealth balance data. Please refresh and try again.");
            setIsSending(false);
            return;
          }

          withdrawals.push({
            fromStealthAddress: stealthBalance.address,
            amount: amountFromThis.toString(),
            ephemeralPubkey: stealthBalance.ephemeralPubkey,
          });

          remainingAmount -= amountFromThis;
        }

        if (remainingAmount > 0n) {
          setError("Insufficient balance across stealth addresses");
          setIsSending(false);
          return;
        }

        // Get Aptos meta keys
        if (!metaKeys.APTOS) {
          throw new Error("Aptos meta keys not found");
        }

        // Setup Aptos client
        const chainConfig = CHAINS[token.chain as keyof typeof CHAINS];
        if (!chainConfig?.stealthProgramId) {
          throw new Error(`Contract address not configured for ${token.chain}`);
        }

        const aptosConfig = new AptosConfig({
          network: isTestnet ? Network.TESTNET : Network.MAINNET,
        });
        const aptos = new Aptos(aptosConfig);
        const shingru = new ShingruStealthAptos();

        // Get main wallet account (for gas payment)
        if (!window.aptos) {
          throw new Error("Aptos wallet not found");
        }

        const mainAccountAddress = await window.aptos.account();
        const feePayerAddress = AccountAddress.fromString(mainAccountAddress.address);

        // Set total transaction count
        setTotalTxCount(withdrawals.length);
        setCurrentTxNumber(0);

        // Convert meta keys
        const metaViewPriv = Buffer.from(metaKeys.APTOS.metaViewPriv, "hex");
        const metaSpendPriv = Buffer.from(metaKeys.APTOS.metaSpendPriv, "hex");

        // Execute withdrawals
        const successfulTxHashes: string[] = [];
        const failedTransactions: { index: number; error: string }[] = [];

        for (let i = 0; i < withdrawals.length; i++) {
          const withdrawal = withdrawals[i];
          try {
            // Derive stealth private key
            const stealthPriv = await shingru.deriveStealthPriv(
              withdrawal.ephemeralPubkey,
              metaSpendPriv,
              metaViewPriv
            );

            // Create stealth account from private key
            const stealthAccount = Account.fromPrivateKey({ privateKey: stealthPriv });

            // Build transaction with fee payer
            // Set maxGasAmount to avoid "MAX_GAS_UNITS_BELOW_MIN_TRANSACTION_GAS_UNITS" error
            // Minimum is typically ~100,000, using 500,000 for safety
            const transaction = await aptos.transaction.build.simple({
              sender: stealthAccount.accountAddress,
              feePayerAddress,
              maxGasAmount: 500000n, // 500,000 gas units
              data: {
                function: `${chainConfig.stealthProgramId}::shingru_stealth::withdraw`,
                typeArguments: [token.mintAddress],
                functionArguments: [
                  U64.fromString(withdrawal.amount),
                  AccountAddress.fromString(recipient),
                ],
              },
            });

            // Sign with stealth account
            const senderAuthenticator = aptos.transaction.sign({
              signer: stealthAccount,
              transaction,
            });

            // Sign fee payer with wallet
            const feePayerAuthenticator = await window.aptos.signTransaction({
              transaction,
              senderAuthenticator,
            });

            // Submit transaction
            const pendingTxn = await aptos.transaction.submit.simple({
              transaction,
              senderAuthenticator,
              feePayerAuthenticator,
            });

            // Wait for confirmation
            const executedTxn = await aptos.waitForTransaction({
              transactionHash: pendingTxn.hash,
            });

            console.log(`Transaction ${i + 1}/${withdrawals.length} executed:`, executedTxn.hash);
            successfulTxHashes.push(executedTxn.hash);
            setCurrentTxNumber(successfulTxHashes.length);
          } catch (err: any) {
            console.error(`Error executing transaction ${i}:`, err);
            failedTransactions.push({ index: i, error: err.message || "Unknown error" });
          }
        }

        if (successfulTxHashes.length === 0) {
          throw new Error("No transactions were executed successfully");
        }

        // If some transactions failed but not all, log a warning
        if (failedTransactions.length > 0) {
          console.warn(`${failedTransactions.length} transaction(s) failed:`, failedTransactions);
        }

        // Set transaction signature(s)
        const txSignature = successfulTxHashes.join("|");
        setLastTxSignature(txSignature);

        // Refresh user data
        await refreshStealthBalances();
        await refreshActivities();

        // Play success sound and show dialog
        playSound(Sound.SUCCESS);
        setShowSuccessDialog(true);
      } else {
        throw new Error(`Unsupported chain: ${token.chain}`);
      }
    } catch (err: any) {
      console.error("Withdrawal error:", err);
      setError(`Transaction failed: ${err.message || "Unknown error"}`);
    } finally {
      setIsSending(false);
      setCurrentTxNumber(0);
      setTotalTxCount(0);
    }
  };

  const resetState = () => {
    // Reset withdrawal state
    setIsSending(false);
    setError(null);
    setShowSuccessDialog(false);
    setLastTxSignature(null);
    setCurrentTxNumber(0);
    setTotalTxCount(0);
    // Reset search and amount state
    setSearchQuery("");
    setSearchResults([]);
    setSelectedResult(null);
    setWithdrawAmount(null);
    setFeeDetails(null);
  };

  const predefinedTokenForInput = token ? [
    {
      name: token.name,
      symbol: token.symbol,
      address: token.mintAddress,
      decimals: token.decimals,
      image: token.imageUrl || undefined,
      isNative: token.isNative,
      priceUsd: token.priceUsd,
    },
  ] : [];

  return {
    isSending,
    error,
    showSuccessDialog,
    lastTxSignature,
    currentTxNumber,
    totalTxCount,
    performWithdrawal,
    resetWithdrawState: resetState,
    // Search
    searchQuery,
    setSearchQuery,
    searchResults,
    isSearching,
    selectedResult,
    handleResultSelect,
    handleClearSearch,
    // Amount & Fees
    withdrawAmount,
    setWithdrawAmount,
    feeDetails,
    getChainKey,
    predefinedTokenForInput,
  };
}

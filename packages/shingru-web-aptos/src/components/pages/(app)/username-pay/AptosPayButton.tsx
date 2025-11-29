import React, { useState, useMemo } from "react";
import { isTestnet } from "@/config/chains";
import { usePay } from "@/providers/PayProvider";
import MainButton from "@/components/common/MainButton";
import { 
  Aptos, 
  AptosConfig, 
  Network
} from "@aptos-labs/ts-sdk";
import { useAttributionTracking } from "@/hooks/useAttributionTracking";

interface AptosPayButtonProps {
  selectedToken: any;
  amount: string;
  stealthData: any;
  onSuccess?: (txHash: string) => void;
  onError?: (error: any) => void;
  className?: string;
  onValidate?: () => boolean;
}

export default function AptosPayButton({
  selectedToken,
  amount,
  stealthData,
  onSuccess,
  onError,
  className,
  onValidate,
}: AptosPayButtonProps) {
  const { submitPaymentInfoAndGetId, currentColor } = usePay();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackPaymentInitiation } = useAttributionTracking();

  // Get Aptos wallet from window
  const getAptosWallet = () => {
    if (typeof window === "undefined") return null;
    return (window as any).aptos;
  };

  // Memoize the disabled state to prevent infinite re-renders
  const isDisabled = useMemo(() => {
    const wallet = getAptosWallet();
    return (
      isPaying ||
      !selectedToken ||
      !amount ||
      parseFloat(amount) <= 0 ||
      !wallet
    );
  }, [isPaying, selectedToken, amount]);

  async function handlePay() {
    try {
      if (onValidate && !onValidate()) {
        return;
      }

      // Prevent multiple simultaneous calls
      if (isPaying) return;

      setIsPaying(true);
      setError(null); // Clear any previous errors

      // Track payment initiation
      trackPaymentInitiation('aptos-payment', {
        tokenSymbol: selectedToken?.symbol,
        amount: amount,
      });

      // Check wallet connection
      const wallet = getAptosWallet();
      if (!wallet) {
        throw new Error("Aptos wallet not found. Please install an Aptos wallet.");
      }

      // Connect wallet if not connected
      const account = await wallet.connect();
      if (!account) {
        throw new Error("Wallet not connected");
      }

      // Sanitize amount by removing commas (e.g., "1,000" -> "1000")
      const sanitizedAmount = amount.replace(/,/g, "");

      // Validate inputs
      if (!selectedToken || !sanitizedAmount || parseFloat(sanitizedAmount) <= 0) {
        throw new Error("Invalid payment parameters");
      }

      // Basic stealth data validation
      if (!stealthData) {
        console.error("Stealth data is required");
        throw new Error("Payment link data not loaded");
      }

      console.log("Full stealth data:", JSON.stringify(stealthData, null, 2));

      // Get userId from username via Supabase
      const username = stealthData?.username || stealthData?.userData?.username;
      console.log("Username from stealthData:", username);

      let receiverUserId = null;
      if (username) {
        const { supabase } = await import("@/lib/supabase/client");
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('id')
          .eq('username', username.toLowerCase())
          .single();

        if (userError) {
          console.error("Error fetching user:", userError);
        } else if (userData) {
          receiverUserId = userData.id;
          console.log("Found receiver userId:", receiverUserId);
        }
      }

      if (!receiverUserId) {
        console.error("Could not find receiver user ID");
        // Don't throw error, just log it - payment already succeeded
      }

      // Get stealth data for Aptos chain
      const getAptosChainData = () => {
        const chains = stealthData.chains || {};
        // Try APTOS_TESTNET first (testnet), then APTOS or APTOS_MAINNET (mainnet)
        if (isTestnet) {
          return chains.APTOS_TESTNET || chains.APTOS || null;
        }
        return chains.APTOS_MAINNET || chains.APTOS || null;
      };

      const aptosChainData = getAptosChainData();
      if (!aptosChainData) {
        console.error("Missing Aptos chain configuration in stealth data");
        throw new Error("Aptos payment not configured for this link");
      }
      if (!aptosChainData.metaSpendPub || !aptosChainData.metaViewPub) {
        console.error("Missing metaSpendPub or metaViewPub for Aptos chain");
        console.error("Aptos chain data:", aptosChainData);
        console.error("Stealth data:", stealthData);
        throw new Error("This user hasn't set up their wallet yet. Please ask them to complete onboarding first.");
      }

      // Initialize Aptos client
      const config = new AptosConfig({
        network: isTestnet ? Network.TESTNET : Network.MAINNET,
      });
      const aptos = new Aptos(config);

      // Convert amount to smallest unit based on decimals (octas for APT)
      const exactAmount = BigInt(
        Math.floor(parseFloat(sanitizedAmount) * 10 ** selectedToken.decimals)
      );

      // Validate the amount
      const MAX_U64 = BigInt("18446744073709551615"); // 2^64 - 1
      if (exactAmount > MAX_U64) {
        throw new Error("Amount too large");
      }
      if (exactAmount <= 0n) {
        throw new Error("Amount must be greater than 0");
      }

      console.log("Getting treasury address...");
      
      // Get treasury address from Supabase
      const { supabase } = await import("@/lib/supabase/client");
      const { data: treasuryConfig, error: treasuryError } = await supabase
        .from('treasury_config')
        .select('treasury_address')
        .eq('chain', isTestnet ? 'APTOS_TESTNET' : 'APTOS_MAINNET')
        .eq('is_active', true)
        .single();

      if (treasuryError || !treasuryConfig) {
        console.error("Treasury config error:", treasuryError);
        throw new Error("Treasury address not configured");
      }

      const paymentAddress = treasuryConfig.treasury_address;
      console.log("Treasury address:", paymentAddress);

      // Submit Payment info to get paymentInfoId (if needed)
      const paymentInfoId = await submitPaymentInfoAndGetId?.() || "";

      // Determine label (link ID) - use "personal" for backend-less mode
      const label = stealthData?.linkData?.id || "personal";
      console.log("LABEL:", label);

      console.log("Building transaction...");
      console.log("Transaction details:", {
        function: "0x1::coin::transfer",
        typeArgs: [selectedToken.address || "0x1::aptos_coin::AptosCoin"],
        amount: exactAmount.toString(),
        treasuryAddress: paymentAddress,
      });
      console.log("Signing and executing transaction...");

      // Use simple APT transfer (no stealth contract)
      const payload = {
        type: "entry_function_payload",
        function: "0x1::coin::transfer",
        type_arguments: [selectedToken.address || "0x1::aptos_coin::AptosCoin"],
        arguments: [
          paymentAddress, // Treasury address
          exactAmount.toString(), // Amount
        ],
      };

      // Sign and submit using wallet
      const response = await wallet.signAndSubmitTransaction(payload);
      
      console.log("Transaction submitted:", response.hash);

      // Wait for confirmation
      await aptos.waitForTransaction({ transactionHash: response.hash });

      console.log("Transaction confirmed!");

      // Record payment in database and credit balance
      try {
        if (!receiverUserId) {
          console.warn('Receiver user ID not found, skipping payment recording');
          onSuccess?.(response.hash);
          return;
        }

        const paymentData = {
          userId: receiverUserId,
          txHash: response.hash,
          stealthAddress: paymentAddress, // Treasury address (for display)
          payerAddress: account.address,
          amount: exactAmount.toString(),
          tokenSymbol: selectedToken.symbol || 'APT',
          tokenAddress: selectedToken.address || '0x1::aptos_coin::AptosCoin',
          decimals: selectedToken.decimals || 8,
          label: label,
          note: paymentInfoId || undefined,
          ephemeralPubkey: '', // Not needed for treasury-based system
        };

        console.log('Recording payment with data:', paymentData);

        const recordResponse = await fetch('/api/payment/record', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(paymentData),
        });

        const recordResult = await recordResponse.json();
        
        if (!recordResult.success) {
          console.error('Failed to record payment:', recordResult.error);
          console.error('Payment data sent:', paymentData);
          // Payment succeeded but recording failed - should be handled by monitoring
        } else {
          console.log('Payment recorded successfully:', recordResult.paymentId);
        }
      } catch (recordError) {
        console.error('Error recording payment:', recordError);
        // Payment succeeded but recording failed - should be handled by monitoring
      }

      onSuccess?.(response.hash);
    } catch (error: any) {
      console.error("Payment failed:", error);
      console.error("Error details:", JSON.stringify(error, null, 2));
      const errorMessage =
        error.message ||
        error.toString() ||
        "An unexpected error occurred during payment.";
      setError(errorMessage);
      onError?.(error);
    } finally {
      setIsPaying(false);
    }
  }

  return (
    <>
      <MainButton
        className={`w-full font-bold ${className || ""}`}
        onClick={handlePay}
        isLoading={isPaying}
        disabled={isDisabled}
        color={currentColor as any}
      >
        {isPaying
          ? "Processing..."
          : stealthData?.linkData?.type === "DOWNLOAD"
          ? "Pay & Download"
          : "Pay"}
      </MainButton>
      {error && (
        <p className="text-red-500 text-sm text-center mt-2">{error}</p>
      )}
    </>
  );
}


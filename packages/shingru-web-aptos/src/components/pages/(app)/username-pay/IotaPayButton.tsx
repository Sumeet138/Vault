import React, { useState, useMemo } from "react";
import bs58 from "bs58";
import { useCurrentAccount, useSignAndExecuteTransaction } from '@aptos/dapp-kit';
import { Transaction } from '@aptos/aptos-sdk/transactions';
import { IotaClient } from '@aptos/aptos-sdk/client';
import { CHAINS, isTestnet } from "@/config/chains";
import PivyStealthIota from "@/lib/@shingru/core/shingru-stealth-aptos";
import { usePay } from "@/providers/PayProvider";
import MainButton from "@/components/common/MainButton";

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
  const currentAccount = useCurrentAccount();
  const { mutate: signAndExecuteTransaction } = useSignAndExecuteTransaction();

  // Memoize the disabled state to prevent infinite re-renders
  const isDisabled = useMemo(() => {
    return (
      isPaying ||
      !selectedToken ||
      !amount ||
      parseFloat(amount) <= 0 ||
      !currentAccount
    );
  }, [isPaying, selectedToken, amount, currentAccount]);

  async function handlePay() {
    try {
      if (onValidate && !onValidate()) {
        return;
      }

      // Prevent multiple simultaneous calls
      if (isPaying) return;

      setIsPaying(true);
      setError(null); // Clear any previous errors

      // Check wallet connection
      if (!currentAccount) {
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

      // Get stealth data for APTOS chain
      const getIotaChainData = () => {
        const chains = stealthData.chains || {};
        // Try IOTA_TESTNET first (testnet), then APTOS or IOTA_MAINNET (mainnet)
        if (isTestnet) {
          return chains.IOTA_TESTNET || chains.APTOS || null;
        }
        return chains.IOTA_MAINNET || chains.APTOS || null;
      };

      const iotaChainData = getIotaChainData();
      if (!iotaChainData) {
        console.error("Missing APTOS chain configuration in stealth data");
        throw new Error("APTOS payment not configured for this link");
      }
      if (!iotaChainData.metaSpendPub || !iotaChainData.metaViewPub) {
        console.error("Missing metaSpendPub or metaViewPub for APTOS chain");
        throw new Error("Invalid payment configuration");
      }

      // Initialize APTOS client
      const chain = isTestnet ? CHAINS.IOTA_TESTNET : CHAINS.IOTA_MAINNET;
      const iotaClient = new IotaClient({ url: chain.rpcUrl });

      // Convert amount to smallest unit based on decimals (MIST for APTOS)
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

      // Initialize PivyStealthIota
      const shingru = new PivyStealthIota();

      // Generate ephemeral keypair using secp256k1
      const ephemeral = shingru.generateEphemeralKey();
      const ephPubB58 = ephemeral.publicKeyB58;

      console.log("Generating stealth address...");
      // Derive stealth address
      const stealthAddress = await shingru.deriveStealthPub(
        iotaChainData.metaSpendPub,
        iotaChainData.metaViewPub,
        ephemeral.privateKey
      );

      console.log("Stealth address:", stealthAddress.stealthIotaAddress);

      // Encrypt ephemeral private key
      const encryptedMemo = await shingru.encryptEphemeralPrivKey(
        ephemeral.privateKey,
        iotaChainData.metaViewPub
      );

      // Submit Payment info to get paymentInfoId
      const paymentInfoId = await submitPaymentInfoAndGetId();

      // Determine label (link ID)
      const label = stealthData.linkData.id;
      console.log("LABEL:", label);

      // Encrypt label
      const encryptedLabel = await shingru.encryptNote(
        label,
        ephemeral.privateKey,
        iotaChainData.metaViewPub
      );

      // Encrypt note if provided
      let encryptedNote = new Uint8Array(0);
      if (paymentInfoId) {
        const noteResult = await shingru.encryptNote(
          paymentInfoId,
          ephemeral.privateKey,
          iotaChainData.metaViewPub
        );
        encryptedNote = new Uint8Array(noteResult);
      }

      // Prepare data for transaction
      const encryptedLabelBytes = new Uint8Array(encryptedLabel);
      const ephPubBytes = bs58.decode(ephPubB58);
      const payloadBytes = bs58.decode(encryptedMemo);

      // Validate payload sizes
      if (encryptedLabelBytes.length > 256) {
        throw new Error(
          `Encrypted label too long: ${encryptedLabelBytes.length} bytes (max 256)`
        );
      }
      if (payloadBytes.length > 121) {
        throw new Error(
          `Payload too long: ${payloadBytes.length} bytes (max 121)`
        );
      }
      if (encryptedNote.length > 256) {
        throw new Error(
          `Note too long: ${encryptedNote.length} bytes (max 256)`
        );
      }

      // Configure stealth program
      const PACKAGE_ID = chain.stealthProgramId;
      const MODULE_NAME = "pivy_stealth";

      if (!PACKAGE_ID) {
        throw new Error("Stealth program not configured for this network");
      }

      console.log("Building transaction...");

      // Create transaction
      const tx = new Transaction();

      // For native APTOS payments, use the gas coin
      if (selectedToken.isNative) {
        // Split the exact amount from the gas coin
        const [paymentCoin] = tx.splitCoins(tx.gas, [exactAmount]);

        // Create a vector with the single payment coin
        const coinsVector = tx.makeMoveVec({
          elements: [paymentCoin],
        });

        // Call the pay function
        tx.moveCall({
          target: `${PACKAGE_ID}::${MODULE_NAME}::pay`,
          typeArguments: ["0x2::aptos::APTOS"],
          arguments: [
            coinsVector,
            tx.pure.u64(exactAmount),
            tx.pure.address(stealthAddress.stealthIotaAddress),
            tx.pure.vector("u8", Array.from(encryptedLabelBytes)),
            tx.pure.vector("u8", Array.from(ephPubBytes)),
            tx.pure.vector("u8", Array.from(payloadBytes)),
            tx.pure.vector("u8", Array.from(encryptedNote)),
          ],
        });
      } else {
        // For custom tokens, we need to handle differently
        // This would require getting token coins from the user's balance
        // For now, throw an error as custom tokens need additional implementation
        throw new Error("Custom token payments not yet implemented. Please use native APTOS.");
      }

      console.log("Signing and executing transaction...");

      // Sign and execute the transaction
      await new Promise<void>((resolve, reject) => {
        signAndExecuteTransaction(
          {
            transaction: tx,
          },
          {
            onSuccess: async (result) => {
              try {
                const txHash = result.digest;
                console.log("Transaction submitted:", txHash);

                // Wait for confirmation
                await iotaClient.waitForTransaction({
                  digest: txHash,
                });

                console.log("Transaction confirmed!");
                onSuccess?.(txHash);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            onError: (err) => {
              reject(err);
            },
          }
        );
      });
    } catch (error: any) {
      console.error("Payment failed:", error);
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

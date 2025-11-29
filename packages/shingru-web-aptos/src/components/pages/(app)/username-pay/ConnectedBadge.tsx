import { AnimatePresence, motion } from "motion/react";
import { usePay } from "@/providers/PayProvider";
import { EASE_SNAPPY_OUT } from "@/config/animation";
import { isTestnet } from "@/config/chains";
import { useState } from "react";
import axios from "axios";

export default function ConnectedBadge() {
  const { wallet } = usePay();
  const [faucetLoading, setFaucetLoading] = useState(false);
  const [faucetStatus, setFaucetStatus] = useState<
    "idle" | "success" | "error"
  >("idle");

  const showWallet = wallet.connected;
  const walletAddress = wallet.publicKey;
  const handleDisconnect = wallet.disconnect;

  const handleRequestFaucet = async () => {
    if (!walletAddress || !isTestnet) return;

    try {
      setFaucetLoading(true);
      setFaucetStatus("idle");

      await axios.post(
        "https://faucet.testnet.aptos.cafe/gas",
        {
          FixedAmountRequest: {
            recipient: walletAddress,
          },
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      setFaucetStatus("success");
      setTimeout(() => setFaucetStatus("idle"), 3000);
    } catch (error) {
      console.error("Faucet request failed:", error);
      setFaucetStatus("error");
      setTimeout(() => setFaucetStatus("idle"), 3000);
    } finally {
      setFaucetLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {showWallet && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{
            height: "auto",
            opacity: 1,
            transition: {
              height: {
                duration: 0.4,
                ease: EASE_SNAPPY_OUT,
              },
              opacity: {
                duration: 0.2,
                delay: 0.1,
              },
            },
          }}
          exit={{
            height: 0,
            opacity: 0,
            transition: {
              height: {
                duration: 0.2,
                ease: EASE_SNAPPY_OUT,
              },
              opacity: {
                duration: 0.1,
              },
            },
          }}
        >
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{
              y: 0,
              opacity: 1,
              transition: {
                duration: 0.4,
                ease: EASE_SNAPPY_OUT,
                delay: 0.1,
              },
            }}
            exit={{
              y: 20,
              opacity: 0,
              transition: {
                duration: 0.2,
                ease: EASE_SNAPPY_OUT,
              },
            }}
            className="px-4 py-3"
          >
            <div className="flex flex-col gap-3">
              {/* Wallet info row */}
              <div className="flex flex-row items-center justify-between">
                <div className="text-sm text-gray-500 flex items-center gap-2 font-medium">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{
                      scale: 1,
                      transition: {
                        duration: 0.4,
                        ease: EASE_SNAPPY_OUT,
                        delay: 0.2,
                      },
                    }}
                    className="w-2 h-2 rounded-full bg-green-500"
                  />
                  <span>Connected:</span>
                  <span className="font-mono">
                    {walletAddress?.slice(0, 4)}...
                    {walletAddress?.slice(-4)}
                  </span>
                </div>
                <button
                  className="cursor-pointer text-sm font-medium text-red-500 hover:bg-red-100 px-3 py-1 rounded-lg transition-colors"
                  onClick={() => handleDisconnect()}
                >
                  Disconnect
                </button>
              </div>

              {/* Faucet button - only on testnet */}
              {isTestnet && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: 0.1 }}
                  className="text-center"
                >
                  <div className="inline-flex items-center gap-2 text-xs text-gray-500 px-4 py-2 rounded-full border border-gray-200 bg-gray-50/50">
                    <span className="font-medium">Need testnet tokens?</span>
                    <button
                      onClick={handleRequestFaucet}
                      disabled={faucetLoading}
                      className="text-primary-700 hover:text-primary-800 font-semibold transition-colors inline-flex items-center gap-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {faucetLoading ? (
                        "Requesting..."
                      ) : faucetStatus === "success" ? (
                        "Success ✓"
                      ) : faucetStatus === "error" ? (
                        "Failed ✗"
                      ) : (
                        <>
                          Get APTOS
                          <svg
                            className="w-3 h-3"
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
                        </>
                      )}
                    </button>
                  </div>
                </motion.div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

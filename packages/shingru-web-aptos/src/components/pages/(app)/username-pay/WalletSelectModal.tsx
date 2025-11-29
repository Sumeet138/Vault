import React, { useEffect, useState } from "react";
import { usePay } from "@/providers/PayProvider";
import { ArrowRightIcon } from "@heroicons/react/24/solid";

interface WalletSelectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletSelectModal({
  isOpen,
  onClose,
}: WalletSelectModalProps) {
  const { refreshWallet } = usePay();
  const [isConnecting, setIsConnecting] = useState(false);

  // Get Aptos wallet from window
  const getAptosWallet = () => {
    if (typeof window === "undefined") return null;
    return (window as any).aptos;
  };

  // Connect wallet when modal opens
  useEffect(() => {
    if (!isOpen) return;

    const connectWallet = async () => {
      const wallet = getAptosWallet();
      if (!wallet) {
        alert("Please install an Aptos wallet (e.g., Petra, Pontem, Martian)");
        onClose();
        return;
      }

      setIsConnecting(true);
      try {
        // Connect wallet
        const account = await wallet.connect();
        if (account && account.address) {
          console.log("Wallet connected:", account.address);
          // Refresh wallet state in PayProvider
          await refreshWallet();
          onClose();
        }
      } catch (error) {
        console.error("Wallet connection failed:", error);
        alert("Failed to connect wallet. Please try again.");
      } finally {
        setIsConnecting(false);
      }
    };

    connectWallet();
  }, [isOpen, refreshWallet, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-bold mb-4">Connect Aptos Wallet</h2>
        {isConnecting ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading loading-spinner"></div>
            <span className="ml-3">Connecting...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Please approve the connection request in your wallet.
            </p>
            <button
              onClick={() => window.location.reload()}
              className="w-full bg-green-600 text-white font-semibold py-4 rounded-xl hover:bg-green-400 transition-all flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
            >
              <span>Retry Connection</span>
              <ArrowRightIcon className="w-5 h-5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


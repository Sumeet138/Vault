import React, { useEffect, useState } from "react";
import { useAuth } from "@/providers/AuthProvider";
import { useAttributionTracking } from "@/hooks/useAttributionTracking";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({
  isOpen,
  onClose,
}: WalletConnectModalProps) {
  const { authenticateWithAptos } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { trackWalletConnection } = useAttributionTracking();

  // Get Aptos wallet from window
  const getAptosWallet = () => {
    if (typeof window === "undefined") return null;
    return (window as any).aptos;
  };

  // Check if wallet is already connected
  useEffect(() => {
    if (!isOpen) return;

    const checkWallet = async () => {
      const wallet = getAptosWallet();
      if (!wallet) {
        setError("Please install an Aptos wallet (e.g., Petra, Pontem, Martian)");
        return;
      }

      // Check if already connected
      try {
        const account = await wallet.account();
        if (account && account.address) {
          // Already connected, authenticate
          console.log("Wallet already connected:", account.address);
          await authenticateWithAptos(account.address);
          onClose();
        }
      } catch (error) {
        // Not connected yet, wait for user to click button
        console.log("Wallet not connected yet");
      }
    };

    checkWallet();
  }, [isOpen, authenticateWithAptos, onClose]);

  const handleConnect = async () => {
    const wallet = getAptosWallet();
    if (!wallet) {
      setError("Please install an Aptos wallet (e.g., Petra, Pontem, Martian)");
      return;
    }

    setIsConnecting(true);
    setError(null);
    
    try {
      // Connect wallet
      const account = await wallet.connect();
      if (account && account.address) {
        console.log("Wallet connected:", account.address);
        
        // Track wallet connection
        trackWalletConnection('aptos', { address: account.address });
        
        await authenticateWithAptos(account.address);
        console.log("Authentication successful");
        onClose();
      } else {
        throw new Error("No account returned from wallet");
      }
    } catch (error: any) {
      console.error("Wallet connection failed:", error);
      setError(error.message || "Failed to connect wallet. Please try again.");
    } finally {
      setIsConnecting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-xl font-bold mb-4">Connect Aptos Wallet</h2>
        {isConnecting ? (
          <div className="flex items-center justify-center py-8">
            <div className="loading loading-spinner"></div>
            <span className="ml-3">Connecting...</span>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-gray-600">
              Click the button below to connect your Aptos wallet.
            </p>
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={handleConnect}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold"
              >
                Connect Wallet
              </button>
              <button
                onClick={onClose}
                className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

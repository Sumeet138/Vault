import { usePay } from "@/providers/PayProvider";
import MainButton from "@/components/common/MainButton";

export default function WalletConnectionOptions() {
  const {
    selectedChain,
    wallet,
    handleOpenWalletModal,
  } = usePay();

  // Convert network-specific chains to wallet chains
  const getWalletChain = (chain: string): string => {
    if (
      chain === "APTOS_TESTNET" ||
      chain === "APTOS" ||
      chain === "APTOS_MAINNET"
    ) {
      return "APTOS";
    }
    return chain;
  };

  const walletChain = selectedChain ? getWalletChain(selectedChain) : null;

  // Get display name for the wallet chain
  const getWalletDisplayName = (chain: string | null): string => {
    if (!chain) return "wallet";
    if (chain === "APTOS") return "Aptos";
    return chain;
  };

  if (!selectedChain || wallet.connected) return null;

  return (
    <MainButton
      className="w-full tracking-tight font-semibold px-5 py-3 text-lg rounded-2xl"
      onClick={handleOpenWalletModal}
    >
      Connect your {getWalletDisplayName(walletChain)} wallet
    </MainButton>
  );
}

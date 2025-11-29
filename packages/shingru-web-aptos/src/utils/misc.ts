export const sleep = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));

export const shortenId = (
  id: string | undefined | null,
  start: number = 5,
  end: number = 4
) => {
  if (!id) return "";
  return `${id.slice(0, start)}...${id.slice(-end)}`;
};

type IotaChain = "TESTNET" | "MAINNET";
export type ExplorerChain = "IOTA_TESTNET" | "IOTA_MAINNET" | "APTOS_TESTNET" | "APTOS_MAINNET" | "APTOS";

export const getIotaExplorerTxLink = (
  txHash: string,
  chain: IotaChain = "TESTNET"
): string => {
  if (chain === "TESTNET") {
    return `https://iotascan.com/testnet/tx/${txHash}`;
  }
  return `https://iotascan.com/mainnet/tx/${txHash}`;
};

export const getAptosExplorerTxLink = (
  txHash: string,
  chain: "APTOS_TESTNET" | "APTOS_MAINNET" | "APTOS" = "APTOS_TESTNET"
): string => {
  const isTestnet = chain === "APTOS_TESTNET" || (chain === "APTOS" && process.env.NEXT_PUBLIC_IS_TESTNET === "true");
  const network = isTestnet ? "testnet" : "mainnet";
  return `https://explorer.aptoslabs.com/txn/${txHash}?network=${network}`;
};

export const getExplorerTxLink = (
  txHash: string,
  chain: ExplorerChain | string
): string => {
  // Handle IOTA chains
  if (chain === "IOTA_TESTNET" || chain === "IOTA_MAINNET") {
    return getIotaExplorerTxLink(
      txHash,
      chain === "IOTA_TESTNET" ? "TESTNET" : "MAINNET"
    );
  }

  // Handle Aptos chains
  if (chain === "APTOS_TESTNET" || chain === "APTOS_MAINNET" || chain === "APTOS") {
    return getAptosExplorerTxLink(txHash, chain as "APTOS_TESTNET" | "APTOS_MAINNET" | "APTOS");
  }

  // Auto-detect Aptos if chain string contains "APTOS"
  if (typeof chain === "string" && chain.includes("APTOS")) {
    return getAptosExplorerTxLink(txHash, chain as "APTOS_TESTNET" | "APTOS_MAINNET" | "APTOS");
  }

  throw new Error(`Unsupported chain: ${chain}`);
};

export const getIotaExplorerAccountLink = (
  address: string,
  chain: IotaChain = "TESTNET"
): string => {
  if (chain === "TESTNET") {
    return `https://iotascan.com/testnet/account/${address}`;
  }
  return `https://iotascan.com/mainnet/account/${address}`;
};

export const getAptosExplorerAccountLink = (
  address: string,
  chain: "APTOS_TESTNET" | "APTOS_MAINNET" | "APTOS" = "APTOS_TESTNET"
): string => {
  const isTestnet = chain === "APTOS_TESTNET" || (chain === "APTOS" && process.env.NEXT_PUBLIC_IS_TESTNET === "true");
  const network = isTestnet ? "testnet" : "mainnet";
  return `https://explorer.aptoslabs.com/account/${address}?network=${network}`;
};

export const getExplorerAccountLink = (
  address: string,
  chain: ExplorerChain | string
): string => {
  // Handle IOTA chains
  if (chain === "IOTA_TESTNET" || chain === "IOTA_MAINNET") {
    return getIotaExplorerAccountLink(
      address,
      chain === "IOTA_TESTNET" ? "TESTNET" : "MAINNET"
    );
  }

  // Handle Aptos chains
  if (chain === "APTOS_TESTNET" || chain === "APTOS_MAINNET" || chain === "APTOS") {
    return getAptosExplorerAccountLink(address, chain as "APTOS_TESTNET" | "APTOS_MAINNET" | "APTOS");
  }

  // Auto-detect Aptos if chain string contains "APTOS"
  if (typeof chain === "string" && chain.includes("APTOS")) {
    return getAptosExplorerAccountLink(address, chain as "APTOS_TESTNET" | "APTOS_MAINNET" | "APTOS");
  }

  throw new Error(`Unsupported chain: ${chain}`);
};

export const getChainLogo = (chain: string, isFilled?: boolean): string | null => {
  let logoName: string | null = null;

  // Check for APTOS
  if (chain.includes("APTOS")) {
    logoName = "aptos";
  }

  if (!logoName) return null;

  return `/assets/chains/${logoName}${isFilled ? "_filled" : ""}.svg`;
};

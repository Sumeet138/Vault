export const SUPPORTED_CHAINS = {
  APTOS: "APTOS",
} as const;

export type SupportedChain =
  (typeof SUPPORTED_CHAINS)[keyof typeof SUPPORTED_CHAINS];

export const isTestnet = process.env.NEXT_PUBLIC_IS_TESTNET === "true";

export const CHAINS = {
  APTOS_MAINNET: {
    id: "APTOS_MAINNET",
    rpcUrl: process.env.NEXT_PUBLIC_APTOS_MAINNET_RPC_URL || "https://fullnode.mainnet.aptoslabs.com",
    stealthProgramId: process.env.NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_MAINNET,
    tokens: [
      {
        name: "APT",
        symbol: "APT",
        address: "0x1::aptos_coin::AptosCoin",
        decimals: 8,
        image: "/assets/tokens/apt.png",
        isNative: true,
      },
    ],
  },
  APTOS_TESTNET: {
    id: "APTOS_TESTNET",
    rpcUrl: process.env.NEXT_PUBLIC_APTOS_TESTNET_RPC_URL || "https://fullnode.testnet.aptoslabs.com",
    stealthProgramId: process.env.NEXT_PUBLIC_SHINGRU_STEALTH_PROGRAM_ID_APTOS_TESTNET,
    tokens: [
      {
        name: "APT",
        symbol: "APT",
        address: "0x1::aptos_coin::AptosCoin",
        decimals: 8,
        image: "/assets/tokens/apt.png",
        isNative: true,
      },
    ],
  },
} as const;

export type ChainId = keyof typeof CHAINS;

export const FEE_CONFIGS = {
  APTOS: {
    WITHDRAWAL_FEE_PERCENTAGE: 0, // 0%
    FEE_TREASURY_ADDRESS: process.env.NEXT_PUBLIC_SHINGRU_FEE_TREASURY_ADDRESS_APTOS,
    FEE_PAYER_ADDRESS: process.env.NEXT_PUBLIC_SHINGRU_FEE_PAYER_ADDRESS_APTOS,
  }
}

// Helper function to convert fee percentage to divisor for BigInt calculations
// e.g., 0.1% = 1000n, 0.5% = 200n, 1% = 100n
// Returns 0n for 0% fee (special case)
export const getFeeMultiplier = (feePercentage: number): bigint => {
  if (feePercentage === 0) return 0n;
  return BigInt(Math.round(1000 / feePercentage));
}

export const AVAILABLE_CHAINS = [
  {
    id: "APTOS",
    name: "Aptos",
    logo: "/assets/chains/aptos.svg",
    testnetKey: "APTOS_TESTNET",
    mainnetKey: "APTOS_MAINNET",
  },
] as const;

// Helper function to get display name for any chain variant
export const getChainDisplayName = (chain: string | null | undefined): string => {
  if (!chain) return "Aptos";
  // Map all Aptos variants to "Aptos"
  if (chain === "APTOS_TESTNET" || chain === "APTOS_MAINNET" || chain === "APTOS") {
    return "Aptos";
  }
  return chain;
};

// Helper function to get chain logo/icon name for any chain variant
export const getChainIconName = (chain: string | null | undefined): string => {
  if (!chain) return "aptos";
  // Map all Aptos variants to "aptos"
  if (chain === "APTOS_TESTNET" || chain === "APTOS_MAINNET" || chain === "APTOS") {
    return "aptos";
  }
  return chain.toLowerCase();
};

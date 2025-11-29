import { backendClient, ApiResponse } from "./client";

// Balance response types (existing)
export interface TokenInfo {
  name: string;
  symbol: string;
  decimals: number;
  imageUrl?: string | null;
  description?: string;
}

export interface NativeBalance {
  mint?: string;
  name: string;
  symbol: string;
  decimals: number;
  imageUrl?: string | null;
  amount: number;
}

export interface TokenBalance {
  mint: string;
  owner: string;
  tokenAmount: number;
  token: TokenInfo;
}

export interface SuiBalanceResponse {
  nativeBalance: NativeBalance;
  tokenBalance: TokenBalance[];
}

export interface SolanaBalanceResponse {
  nativeBalance: NativeBalance;
  splBalance: TokenBalance[];
}

export type BalanceResponse = SuiBalanceResponse | SolanaBalanceResponse;

// User stealth balances types (new)
export interface StealthBalance {
  address: string;
  ephemeralPubkey: string;
  memo: string;
  amount: number;
}

export interface UserToken {
  mintAddress: string;
  name: string;
  symbol: string;
  decimals: number;
  imageUrl?: string | null;
  total: number;
  usdValue: number;
  priceUsd: number;
  balances: StealthBalance[];
  isVerified: boolean;
  chain: ChainId;
  isNative: boolean;
}

export interface UserBalancesSummary {
  totalBalanceUsd: number;
  tokensCount: number;
  stealthAddressCount: number;
}

export interface UserBalancesResponse {
  tokens: UserToken[];
  summary: UserBalancesSummary;
}

// User activities types (new)
export type ActivityType = "PAYMENT" | "WITHDRAWAL";

export interface UserActivity {
  id: string;
  type: ActivityType;
  timestamp: number;
  amount: string;
  uiAmount: number;
  token: {
    symbol: string;
    name: string;
    decimals: number;
    imageUrl: string | null;
    mintAddress: string;
    priceUsd: number;
  };
  usdValue: number;
  link?: {
    label: string;
    emoji: string;
    backgroundColor: string;
    tag: string;
    type: string;
    amountType: string;
  };
  from?: string;
  isAnnounce: boolean;
  chain: string;
  destinationPubkey?: string;
  paymentInfo?: {
    collectedData: Array<{
      type: string;
      value: string;
    }>;
    id: string;
  };
}

// Update the response type to be an array of activities
export type UserActivitiesResponse = UserActivity[];

// Chain type for API calls
export type ChainId = "IOTA_MAINNET" | "IOTA_TESTNET";
export type ChainIdOrArray = ChainId | ChainId[];

export const userService = {
  // Get user token balances for a specific address and chain (existing)
  getBalance: async (
    address: string,
    chain: ChainId
  ): Promise<ApiResponse<BalanceResponse>> => {
    return backendClient.get<BalanceResponse>(
      `/user/balance/${address}?chain=${chain}`
    );
  },

  // Get user stealth balances (new)
  getBalances: async (
    token: string,
    chain: ChainIdOrArray
  ): Promise<ApiResponse<UserBalancesResponse>> => {
    backendClient.setAuthToken(token);
    const chainParam = Array.isArray(chain) ? chain.join(",") : chain;
    return backendClient.get<UserBalancesResponse>(
      `/user/balances?chain=${chainParam}`
    );
  },

  // Get user activities (new)
  getActivities: async (
    token: string,
    chain: ChainIdOrArray,
    limit?: number
  ): Promise<ApiResponse<UserActivitiesResponse>> => {
    backendClient.setAuthToken(token);
    const chainParam = Array.isArray(chain) ? chain.join(",") : chain;
    const limitParam = limit ? `&limit=${limit}` : "";
    return backendClient.get<UserActivitiesResponse>(
      `/user/activities?chain=${chainParam}${limitParam}`
    );
  },
};

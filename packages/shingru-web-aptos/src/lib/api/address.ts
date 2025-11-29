import { backendClient, ApiResponse } from './client';

// Types for the address response
export interface UserData {
  username: string;
  profileImageType: string;
  profileImageData: {
    emoji: string;
    backgroundColor: string;
  };
}

export interface LinkData {
  id: string;
  tag: string;
  label: string;
  description: string | null;
  emoji: string;
  backgroundColor: string;
  specialTheme: string;
  type: string;
  amountType: string;
  viewCount: number;
  file: string | null;
}

export interface ChainData {
  amount: number | null;
  mint: string | null;
  chainAmount: number | null;
  metaSpendPub: string;
  metaViewPub: string;
  isEnabled: boolean;
}

export interface AddressResponse {
  userData: UserData;
  linkData: LinkData;
  supportedChains: string[];
  chains: {
    [chainName: string]: ChainData;
  };
}

// Types for destination search
export interface SNSResult {
  type: "sns";
  name: string;
  targetAddress: string;
  nftId: string;
  expirationTimestampMs: string;
  data: Record<string, any>;
  displayName: string;
  displayType: "SNS";
}

export interface UsernameResult {
  type: "username";
  username: string;
  displayName: string;
  displayType: "USERNAME";
  profileImageType: string;
  profileImageData: {
    emoji: string;
    backgroundColor: string;
  };
}

export interface AddressResult {
  type: "address";
  address: string;
  displayName: string;
  displayType: "ADDRESS";
}

export interface PivyResult {
  type: "shingru";
  username: string;
  displayName: string;
  displayType: "SHINGRU";
  profileImageType: string;
  profileImageData: {
    emoji: string;
    backgroundColor: string;
  };
}

export interface ANSResult {
  type: "ans";
  name: string;
  targetAddress: string;
  displayName: string;
  displayType: "ANS";
}

export type SearchResult =
  | SNSResult
  | UsernameResult
  | AddressResult
  | PivyResult
  | ANSResult;

export interface DestinationSearchResponse {
  query: string;
  chain: string;
  results: SearchResult[];
  count: number;
}

export const addressService = {
  // Public route - no authentication required
  getAddressByUserTag: async (username: string, tag?: string): Promise<ApiResponse<AddressResponse>> => {
    const url = tag ? `/address/${username}/${tag}` : `/address/${username}`;
    return backendClient.get<AddressResponse>(url);
  },

  // Get link data by linkId
  getLinkById: async (linkId: string): Promise<ApiResponse<AddressResponse>> => {
    return backendClient.get<AddressResponse>(`/address/link/${linkId}`);
  },

  // Destination search for withdrawal
  searchDestination: async (query: string, chain: string): Promise<ApiResponse<DestinationSearchResponse>> => {
    return backendClient.get<DestinationSearchResponse>(`/address/destination-search?q=${encodeURIComponent(query)}&chain=${chain}`);
  },

  // Future address methods will be added here:
  // getAddressInfo: async (token: string, address: string): Promise<ApiResponse<AddressInfo>> => {
  //   backendClient.setAuthToken(token);
  //   return backendClient.get<AddressInfo>(`/address/${address}`);
  // },

  // getAddressBalance: async (token: string, address: string, chain: string): Promise<ApiResponse<AddressBalance>> => {
  //   backendClient.setAuthToken(token);
  //   return backendClient.get<AddressBalance>(`/address/${address}/balance?chain=${chain}`);
  // },

  // getAddressTransactions: async (token: string, address: string): Promise<ApiResponse<Transaction[]>> => {
  //   backendClient.setAuthToken(token);
  //   return backendClient.get<Transaction[]>(`/address/${address}/transactions`);
  // },
}; 
import { backendClient, ApiResponse } from "./client";

export interface ChainConfig {
  id: string;
  linkId: string;
  chain: string;
  amount: string | null;
  goalAmount: string | null;
  mintId: string | null;
  isEnabled: boolean;
  mint: string | null;
  isNative?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface TokenInfo {
  symbol: string;
  name: string;
  decimals: number;
  imageUrl: string | null;
  mintAddress: string;
  priceUsd: number;
  isVerified: boolean;
}

export interface CollectedData {
  type: "note" | "name" | "email" | "telegram";
  value: string;
}

export interface PaymentInfo {
  id: string;
  collectedData: CollectedData[];
}

export interface Activity {
  id: string;
  type: string;
  timestamp: number;
  amount: string;
  uiAmount: number;
  token: TokenInfo;
  usdValue: number;
  link: {
    label: string;
    emoji: string;
    backgroundColor: string;
    tag: string;
    type: string;
    amountType: string;
  };
  from: string;
  isAnnounce: boolean;
  chain: string;
  paymentInfo?: PaymentInfo;
}

export interface Files {
  thumbnail: string | null;
  deliverables: any[];
}

export interface Link {
  id: string;
  userId: string;
  emoji: string;
  backgroundColor: string;
  tag: string;
  label: string;
  description: string | null;
  specialTheme: string;
  template: string;
  type: string;
  amountType: string;
  goalAmount: string | null;
  isStable: boolean;
  stableToken: string | null;
  collectInfo: boolean;
  collectFields: Record<string, boolean> | null;
  supportedChains: string[];
  viewCount: number;
  status: "ACTIVE" | "ARCHIVED";
  archivedAt: string | null;
  createdAt: string;
  updatedAt: string;
  chainConfigs: ChainConfig[];
  files: Files;
  user: {
    id: string;
    username: string;
  };
  activities: Activity[];
  linkPreview: string;
  stats: {
    viewCount: number;
    totalPayments: number;
    totalRaised?: number; // For fundraisers - total amount raised in USD
  };
}

export interface CreateLinkRequest {
  emoji: string;
  backgroundColor: string;
  tag?: string;
  label: string;
  description?: string;
  specialTheme?: string;
  type?: string;
  amountType?: string;
  supportedChains: string[];
  chainConfigs: Omit<
    ChainConfig,
    "id" | "linkId" | "createdAt" | "updatedAt" | "mintId"
  >[];
}

export interface UpdateLinkRequest extends Partial<CreateLinkRequest> {
  isActive?: boolean;
}

export const linksService = {
  getLinks: async (token: string): Promise<ApiResponse<Link[]>> => {
    backendClient.setAuthToken(token);
    return backendClient.get<Link[]>("/links/my-links");
  },

  getPersonalLink: async (token: string): Promise<ApiResponse<Link>> => {
    backendClient.setAuthToken(token);
    return backendClient.get<Link>("/links/my-links?type=personal");
  },

  createLink: async (
    token: string,
    data: CreateLinkRequest
  ): Promise<ApiResponse<Link>> => {
    backendClient.setAuthToken(token);
    return backendClient.post<Link>("/links/create-link", data);
  },

  updateLink: async (
    token: string,
    id: string,
    data: UpdateLinkRequest
  ): Promise<ApiResponse<Link>> => {
    backendClient.setAuthToken(token);
    return backendClient.put<Link>(`/links/${id}`, data);
  },

  archiveLink: async (
    token: string,
    id: string
  ): Promise<ApiResponse<Link>> => {
    backendClient.setAuthToken(token);
    return backendClient.post<Link>(`/links/archive-link/${id}`);
  },

  unarchiveLink: async (
    token: string,
    id: string
  ): Promise<ApiResponse<Link>> => {
    backendClient.setAuthToken(token);
    return backendClient.post<Link>(`/links/unarchive-link/${id}`);
  },

  deleteLink: async (
    token: string,
    id: string
  ): Promise<ApiResponse<{ success: boolean }>> => {
    backendClient.setAuthToken(token);
    return backendClient.post<{ success: boolean }>(`/links/delete-link/${id}`);
  },

  getLink: async (token: string, id: string): Promise<ApiResponse<Link>> => {
    backendClient.setAuthToken(token);
    return backendClient.get<Link>(`/links/${id}`);
  },

  updateLinkFormData: async (
    token: string,
    linkId: string,
    data: FormData
  ): Promise<ApiResponse<Link>> => {
    backendClient.setAuthToken(token);
    return backendClient.post<Link>(`/links/update-link/${linkId}`, data, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      timeout: 60000,
    });
  },
};

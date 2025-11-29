import { backendClient, ApiResponse } from "./client";

export interface NfcTag {
  id: string;
  tagId: string;
  tagUrl: string;
  userId: string | null;
  status: "AVAILABLE" | "CLAIMED" | "INACTIVE";
  isInjected: boolean;
  viewedCount: number;
  claimedAt: string | null;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    username: string;
  } | null;
}

export interface NfcTagApiResponse {
  success: boolean;
  data: NfcTag;
}

export interface NfcTagClaimResponse {
  success: boolean;
  message: string;
  data: any; // Will be defined later when you provide the structure
  error?: {
    message: string;
  };
}

export const nfcTagService = {
  getTag: async (tagId: string): Promise<ApiResponse<NfcTagApiResponse>> => {
    return backendClient.get<NfcTagApiResponse>(`/nfc-tag/${tagId}`);
  },

  claimTag: async (
    tagId: string
  ): Promise<ApiResponse<NfcTagClaimResponse>> => {
    return backendClient.post<NfcTagClaimResponse>(`/nfc-tag/${tagId}/claim`);
  },
};

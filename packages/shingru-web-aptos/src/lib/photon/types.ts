/**
 * Photon API Type Definitions
 */

export interface PhotonUser {
  id: string;
  name: string;
  avatar: string;
}

export interface PhotonUserIdentity {
  id?: string;
  user_id: string;
  provider: string;
  provider_id: string;
  client_id?: string;
}

export interface PhotonTokens {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  scope: string;
  expires_at?: string;
}

export interface PhotonWallet {
  photonUserId?: string;
  walletAddress: string;
}

export interface PhotonRegisterResponse {
  success: boolean;
  data: {
    user: {
      user: PhotonUser;
      user_identities: PhotonUserIdentity[];
    };
    tokens: PhotonTokens;
    wallet: PhotonWallet;
  };
}

export interface PhotonCampaignEventRequest {
  event_id: string;
  event_type: string;
  user_id: string;
  campaign_id: string;
  metadata?: Record<string, any>;
  timestamp: string;
}

export interface PhotonCampaignEventResponse {
  success: boolean;
  data: {
    success: boolean;
    event_id: string;
    event_type: string;
    user_id: string;
    token_amount: number;
    token_symbol: string;
    campaign_id: string;
    timestamp: string;
    metadata?: Record<string, any>;
  };
}

export interface PhotonWalletInfo {
  address: string;
  balance: number;
  recentRewards: RewardEvent[];
}

export interface RewardEvent {
  eventType: 'LINK_CREATED' | 'PAYMENT_COMPLETED' | 'CUSTOM';
  timestamp: number;
  patEarned: number;
  metadata?: Record<string, any>;
}

export interface PhotonUserData {
  photonId: string;
  walletAddress: string;
  createdAt: string;
  lastSeen: string;
  tokens: PhotonTokens;
}

export interface AttributionEvent {
  action: string;
  timestamp: number;
  userId?: string;
  metadata?: Record<string, any>;
}

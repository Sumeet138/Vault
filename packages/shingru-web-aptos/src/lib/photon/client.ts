/**
 * Photon API Client
 * 
 * This module provides a client for interacting with the Photon API.
 * It handles authentication, reward tracking, and attribution.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  PhotonRegisterResponse,
  PhotonCampaignEventRequest,
  PhotonCampaignEventResponse,
  PhotonTokens,
} from './types';

export class PhotonClient {
  private client: AxiosInstance;
  private apiKey: string;
  private baseUrl: string;
  private campaignId: string;
  private accessToken: string | null = null;
  private demoMode: boolean = false;

  constructor(config?: {
    apiKey?: string;
    baseUrl?: string;
    campaignId?: string;
  }) {
    this.apiKey = config?.apiKey || process.env.NEXT_PUBLIC_PHOTON_API_KEY || '';
    this.baseUrl = config?.baseUrl || process.env.NEXT_PUBLIC_PHOTON_BASE_URL || '';
    this.campaignId = config?.campaignId || process.env.NEXT_PUBLIC_PHOTON_CAMPAIGN_ID || '';

    // Enable demo mode if API is not configured or explicitly enabled
    this.demoMode = !this.apiKey || !this.baseUrl || process.env.NEXT_PUBLIC_PHOTON_DEMO_MODE === 'true';

    if (this.demoMode) {
      console.log('🎭 Photon running in DEMO mode - using mock data');
    }

    if (!this.apiKey) {
      console.warn('Photon API key not configured - using demo mode');
    }

    if (!this.baseUrl) {
      console.warn('Photon base URL not configured - using demo mode');
    }

    this.client = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // Add response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * Set the access token for authenticated requests
   */
  setAccessToken(token: string) {
    this.accessToken = token;
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  /**
   * Clear the access token
   */
  clearAccessToken() {
    this.accessToken = null;
    delete this.client.defaults.headers.common['Authorization'];
  }

  /**
   * Register a user with Photon using JWT
   */
  async register(jwtToken: string): Promise<PhotonRegisterResponse> {
    // Demo mode - return mock data
    if (this.demoMode) {
      console.log('🎭 Demo: Registering user with mock data');
      const mockResponse: PhotonRegisterResponse = {
        success: true,
        data: {
          user: {
            user: {
              id: `demo_user_${Date.now()}`,
              name: 'Demo User',
              avatar: '👤',
            },
            user_identities: [],
          },
          tokens: {
            access_token: `demo_access_token_${Date.now()}`,
            refresh_token: `demo_refresh_token_${Date.now()}`,
            token_type: 'Bearer',
            expires_in: 3600,
            scope: 'all',
          },
          wallet: {
            walletAddress: `0xdemo${Date.now().toString(16)}`,
          },
        },
      };

      // Set the mock access token
      this.setAccessToken(mockResponse.data.tokens.access_token);
      
      return mockResponse;
    }

    // Real API mode
    try {
      const response = await this.client.post<PhotonRegisterResponse>(
        '/identity/register',
        {
          provider: 'jwt',
          data: {
            token: jwtToken,
          },
        }
      );

      // Automatically set the access token after successful registration
      if (response.data.success && response.data.data.tokens.access_token) {
        this.setAccessToken(response.data.data.tokens.access_token);
      }

      return response.data;
    } catch (error) {
      console.error('Photon registration failed:', error);
      throw error;
    }
  }

  /**
   * Track a campaign event (rewarded or unrewarded)
   */
  async trackCampaignEvent(
    eventId: string,
    eventType: string,
    userId: string,
    metadata?: Record<string, any>
  ): Promise<PhotonCampaignEventResponse> {
    // Demo mode - return mock data
    if (this.demoMode) {
      console.log(`🎭 Demo: Tracking event "${eventType}" for user ${userId}`);
      
      // Simulate different reward amounts based on event type
      const rewardAmounts: Record<string, number> = {
        'link_created': 10,
        'payment_completed': 25,
        'session_start': 5,
        'default': 1,
      };
      
      const tokenAmount = rewardAmounts[eventType] || rewardAmounts['default'];
      
      const mockResponse: PhotonCampaignEventResponse = {
        success: true,
        data: {
          success: true,
          event_id: eventId,
          event_type: eventType,
          user_id: userId,
          campaign_id: this.campaignId || 'demo_campaign',
          token_amount: tokenAmount,
          token_symbol: 'PAT',
          timestamp: new Date().toISOString(),
          metadata: metadata || {},
        },
      };
      
      return mockResponse;
    }

    // Real API mode
    try {
      const request: PhotonCampaignEventRequest = {
        event_id: eventId,
        event_type: eventType,
        user_id: userId,
        campaign_id: this.campaignId,
        metadata: metadata || {},
        timestamp: new Date().toISOString(),
      };

      const response = await this.client.post<PhotonCampaignEventResponse>(
        '/attribution/events/campaign',
        request
      );

      return response.data;
    } catch (error) {
      console.error('Photon campaign event tracking failed:', error);
      throw error;
    }
  }

  /**
   * Track a payment link creation event
   */
  async trackPaymentLinkCreation(
    userId: string,
    linkId: string,
    metadata?: Record<string, any>
  ): Promise<PhotonCampaignEventResponse> {
    const eventId = `link_created-${linkId}-${Date.now()}`;
    return this.trackCampaignEvent(
      eventId,
      'link_created',
      userId,
      { linkId, ...metadata }
    );
  }

  /**
   * Track a payment completion event
   */
  async trackPaymentCompletion(
    userId: string,
    paymentId: string,
    amount: number,
    metadata?: Record<string, any>
  ): Promise<PhotonCampaignEventResponse> {
    const eventId = `payment_completed-${paymentId}-${Date.now()}`;
    return this.trackCampaignEvent(
      eventId,
      'payment_completed',
      userId,
      { paymentId, amount, ...metadata }
    );
  }

  /**
   * Track a generic user action
   */
  async trackUserAction(
    userId: string,
    action: string,
    metadata?: Record<string, any>
  ): Promise<PhotonCampaignEventResponse> {
    const eventId = `${action}-${Date.now()}`;
    return this.trackCampaignEvent(eventId, action, userId, metadata);
  }

  /**
   * Get wallet balance for a user
   */
  async getWalletBalance(userId: string): Promise<number> {
    // Demo mode - return mock balance
    if (this.demoMode) {
      console.log('🎭 Demo: Fetching wallet balance for user:', userId);
      
      // Get stored demo balance or generate a random one
      const storedBalance = localStorage.getItem(`photon_demo_balance_${userId}`);
      if (storedBalance) {
        return parseFloat(storedBalance);
      }
      
      // Generate initial balance between 50-200 PAT
      const initialBalance = Math.floor(Math.random() * 150) + 50;
      localStorage.setItem(`photon_demo_balance_${userId}`, initialBalance.toString());
      return initialBalance;
    }

    // Real API mode
    try {
      console.log('Fetching wallet balance for user:', userId);
      // TODO: Replace with actual Photon API call when endpoint is available
      return 0;
    } catch (error) {
      console.error('Error fetching wallet balance:', error);
      return 0;
    }
  }

  /**
   * Get recent reward events for a user
   */
  async getRecentRewards(userId: string, limit: number = 5): Promise<any[]> {
    // Demo mode - return mock rewards
    if (this.demoMode) {
      console.log('🎭 Demo: Fetching recent rewards for user:', userId);
      
      // Get stored demo rewards or generate some
      const storedRewards = localStorage.getItem(`photon_demo_rewards_${userId}`);
      if (storedRewards) {
        const rewards = JSON.parse(storedRewards);
        return rewards.slice(0, limit);
      }
      
      // Generate some initial demo rewards
      const mockRewards = [
        {
          event_type: 'link_created',
          timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          token_amount: 10,
          metadata: { linkId: 'demo_link_1' },
        },
        {
          event_type: 'payment_completed',
          timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
          token_amount: 25,
          metadata: { paymentId: 'demo_payment_1', amount: 100 },
        },
        {
          event_type: 'session_start',
          timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
          token_amount: 5,
          metadata: { newUser: false },
        },
      ];
      
      localStorage.setItem(`photon_demo_rewards_${userId}`, JSON.stringify(mockRewards));
      return mockRewards.slice(0, limit);
    }

    // Real API mode
    try {
      console.log('Fetching recent rewards for user:', userId);
      // TODO: Replace with actual Photon API call when endpoint is available
      return [];
    } catch (error) {
      console.error('Error fetching recent rewards:', error);
      return [];
    }
  }

  /**
   * Handle API errors
   */
  private handleError(error: AxiosError) {
    if (error.response) {
      // Server responded with error status
      console.error('Photon API error:', {
        status: error.response.status,
        data: error.response.data,
      });
    } else if (error.request) {
      // Request made but no response
      console.error('Photon API no response:', error.request);
    } else {
      // Error setting up request
      console.error('Photon API request error:', error.message);
    }
  }

  /**
   * Check if the client is properly configured
   */
  isConfigured(): boolean {
    // In demo mode, always return true
    if (this.demoMode) {
      return true;
    }
    return !!(this.apiKey && this.baseUrl && this.campaignId);
  }

  /**
   * Check if running in demo mode
   */
  isDemoMode(): boolean {
    return this.demoMode;
  }

  /**
   * Get the current campaign ID
   */
  getCampaignId(): string {
    return this.campaignId;
  }
}

// Singleton instance
let photonClientInstance: PhotonClient | null = null;

/**
 * Get or create the Photon client instance
 */
export function getPhotonClient(): PhotonClient {
  if (!photonClientInstance) {
    photonClientInstance = new PhotonClient();
  }
  return photonClientInstance;
}

/**
 * Initialize the Photon client with custom configuration
 */
export function initializePhotonClient(config?: {
  apiKey?: string;
  baseUrl?: string;
  campaignId?: string;
}): PhotonClient {
  photonClientInstance = new PhotonClient(config);
  return photonClientInstance;
}

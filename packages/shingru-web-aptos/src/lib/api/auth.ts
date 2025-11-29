import { backendClient, ApiResponse } from "./client";

export interface Wallet {
  id?: string;
  chain: string;
  address: string;
  loginMethod?: string;
}

export interface LoginResponse {
  token: string;
  wallet: {
    id: string;
    chain: string;
    address: string;
    loginMethod: string;
  };
  wallets: Array<{
    chain: string;
    address: string;
  }>;
}

export interface WalletLoginRequest {
  walletAddress: string;
  signature: string;
  message: string;
  chain: string;
}

export interface RefreshTokenResponse {
  token: string;
}

export interface LogoutResponse {
  success: boolean;
}

export interface MetaKeyData {
  chain: "APTOS";
  address: string;
  metaSpendPriv: string;
  metaSpendPub: string;
  metaViewPub: string;
  metaViewPriv: string;
}

export interface RegisterMetaKeysRequest {
  metaKeys: MetaKeyData[];
}

export interface RegisterMetaKeysResponse {
  message: string;
  updatedWallets: Array<{
    id: string;
    walletAddress: string;
    chain: string;
    loginMethod: string;
    metaSpendPub: string;
    metaViewPub: string;
    hasMetaKeys: boolean;
  }>;
  totalProcessed: number;
  successCount: number;
  errorCount: number;
}

export interface UserProfile {
  id: string;
  username: string | null;
  email: string;
  profileImage?: {
    type: "EMOJI_AND_COLOR";
    data: {
      emoji: string;
      backgroundColor: string;
    };
  };
  createdAt: string;
  updatedAt: string;
  nfcTag?: {
    id: string;
    tagId: string;
    status: "AVAILABLE" | "CLAIMED" | "INACTIVE";
  };
  wallets: Array<{
    id: string;
    walletAddress: string;
    chain: string;
    loginMethod: string;
    isPrimary: boolean;
    isActive: boolean;
    hasMetaKeys?: boolean;
    metaKeys?: {
      metaSpendPub: string;
      metaViewPub: string;
    };
    createdAt: string;
    updatedAt: string;
  }>;
}

export interface SetProfileImageRequest {
  type: "EMOJI_AND_COLOR";
  data: {
    emoji: string;
    backgroundColor: string;
  };
}

export interface SetProfileImageResponse {
  message: string;
  profileImage: {
    type: "EMOJI_AND_COLOR";
    data: {
      emoji: string;
      backgroundColor: string;
    };
  };
}

export interface SIWAInput {
  nonce: string;
  domain: string;
  statement: string;
  uri: string;
  version: string;
  chainId: number | string;
}

export interface AptosNonceResponse {
  nonce: string;
  domain: string;
  statement: string;
  uri: string;
  version: string;
  network: string;
}

export interface SIWANonceResponse {
  data: SIWAInput;
}

export interface SIWACallbackRequest {
  output: string; // Serialized SignInOutput
  turnstileResponse: string; // Cloudflare Turnstile token
  input?: SIWAInput; // The original SIWA input used for signing
  domain?: string; // The domain used in the signing
  uri?: string; // The URI used in the signing
  email?: string; // Email from wallet Connect (Google login)
}

export interface SIWACallbackResponse {
  token: string;
  wallet: {
    id: string;
    chain: string;
    address: string;
    loginMethod: string;
  };
}

export const authService = {
  /**
   * Get nonce for Aptos wallet authentication (backend-less: returns mock data)
   * @returns Promise with nonce data including domain, statement, etc.
   * @example
   * ```typescript
   * const result = await authService.getNonce();
   * if (result.data) {
   *   console.log('Nonce:', result.data.nonce);
   *   console.log('Domain:', result.data.domain);
   * }
   * ```
   */
  getNonce: async (): Promise<ApiResponse<AptosNonceResponse>> => {
    // Backend-less: Return mock nonce
    return {
      data: {
        nonce: `shingru_${Date.now()}_${Math.random().toString(36).substring(7)}`,
        domain: typeof window !== "undefined" ? window.location.hostname : "shingru.app",
        statement: "Sign in to Shingru",
        uri: typeof window !== "undefined" ? window.location.origin : "https://shingru.app",
        version: "1",
        network: "aptos",
      },
      error: null,
    };
  },

  /**
   * Login with wallet signature (traditional wallet connection)
   * @param walletData - Wallet login data including signature and message
   * @returns Promise with login response containing JWT token and wallets
   * @example
   * ```typescript
   * const result = await authService.login({
   *   walletAddress: '0x123...',
   *   signature: 'signature-string',
   *   message: 'Sign in message',
   *   chain: 'APTOS'
   * });
   * ```
   */
  login: async (walletData: WalletLoginRequest): Promise<ApiResponse<LoginResponse>> => {
    return backendClient.post<LoginResponse>("/auth/login", walletData);
  },

  /**
   * Login with wallet signature (traditional wallet connection)
   * @deprecated Use login() instead
   * @param walletData - Wallet login data including signature and message
   * @returns Promise with login response containing JWT token and wallets
   * @example
   * ```typescript
   * const result = await authService.walletLogin({
   *   walletAddress: '0x123...',
   *   signature: 'signature-string',
   *   message: 'Sign in message',
   *   chain: 'APTOS'
   * });
   * ```
   */
  walletLogin: async (walletData: any): Promise<ApiResponse<LoginResponse>> => {
    return backendClient.post<LoginResponse>("/auth/login", walletData);
  },

  /**
   * Refresh authentication token
   * @param refreshToken - The refresh token
   * @returns Promise with new JWT token
   * @example
   * ```typescript
   * const result = await authService.refreshToken('refresh-token-123');
   * if (result.data) {
   *   console.log('New token:', result.data.token);
   * }
   * ```
   */
  refreshToken: async (
    refreshToken: string
  ): Promise<ApiResponse<RefreshTokenResponse>> => {
    return backendClient.post<RefreshTokenResponse>("/auth/refresh", {
      refreshToken,
    });
  },

  /**
   * Logout user and invalidate token
   * @param token - JWT token for authentication
   * @returns Promise with logout confirmation
   * @example
   * ```typescript
   * const result = await authService.logout('jwt-token-123');
   * if (result.data?.success) {
   *   console.log('Logout successful');
   * }
   * ```
   */
  logout: async (token: string): Promise<ApiResponse<LogoutResponse>> => {
    if (!token || typeof token !== "string" || token.trim() === "") {
      backendClient.removeAuthToken();
      return { data: { success: true } }; // Consider it successful if no token to logout
    }
    backendClient.setAuthToken(token);
    const result = await backendClient.post<LogoutResponse>("/auth/logout");
    backendClient.removeAuthToken(); // Clean up after logout
    return result;
  },

  /**
   * Get current user profile and data
   * @param token - JWT backend token for authentication
   * @returns Promise with user profile data including wallets and links
   * @example
   * ```typescript
   * const result = await authService.getMe('backend-jwt-token');
   * if (result.data) {
   *   console.log('User profile:', result.data);
   *   console.log('User wallets:', result.data.wallets);
   *   console.log('Current wallet:', result.data.currentWallet);
   * }
   * ```
   */
  getMe: async (token: string): Promise<ApiResponse<UserProfile>> => {
    if (!token || typeof token !== "string" || token.trim() === "") {
      return { error: "Invalid token provided" };
    }
    backendClient.setAuthToken(token);
    return backendClient.get<UserProfile>("/auth/me");
  },

  /**
   * Verify if the current token is still valid
   * @param token - JWT token to verify
   * @returns Promise with verification result
   * @example
   * ```typescript
   * const result = await authService.verifyToken('jwt-token-123');
   * if (result.data?.valid) {
   *   console.log('Token is valid');
   * }
   * ```
   */
  verifyToken: async (
    token: string
  ): Promise<ApiResponse<{ valid: boolean; expiresAt?: string }>> => {
    if (!token || typeof token !== "string" || token.trim() === "") {
      return { error: "Invalid token provided" };
    }
    backendClient.setAuthToken(token);
    return backendClient.get<{ valid: boolean; expiresAt?: string }>(
      "/auth/verify"
    );
  },

  /**
   * Register meta keys for multiple wallets/chains
   * @param token - JWT token for authentication
   * @param metaKeysData - Array of meta key data for different chains
   * @returns Promise with registration result showing updated wallets
   * @example
   * ```typescript
   * const result = await authService.registerMetaKeys('jwt-token-123', {
   *   metaKeys: [
   *     {
   *       chain: 'APTOS',
   *       address: '0x123...',
   *       metaSpendPub: '0xabc...',
   *       metaViewPub: '0xdef...',
   *       metaViewPriv: 'encrypted-private-key'
   *     },
   *   ]
   * });
   * if (result.data) {
   *   console.log(`Registered meta keys for ${result.data.successCount} wallets`);
   *   console.log('Updated wallets:', result.data.updatedWallets);
   * }
   * ```
   */
  registerMetaKeys: async (
    token: string,
    metaKeysData: RegisterMetaKeysRequest
  ): Promise<ApiResponse<RegisterMetaKeysResponse>> => {
    if (!token || typeof token !== "string" || token.trim() === "") {
      return { error: "Invalid token provided" };
    }
    backendClient.setAuthToken(token);
    return backendClient.post<
      RegisterMetaKeysResponse,
      RegisterMetaKeysRequest
    >("/auth/register-meta-keys", metaKeysData);
  },

  /**
   * Set user profile image (emoji and color)
   * @param token - JWT token for authentication
   * @param profileImageData - Profile image data with type and emoji/color info
   * @returns Promise with updated profile image data
   * @example
   * ```typescript
   * const result = await authService.setProfileImage('jwt-token-123', {
   *   type: 'emoji-and-color',
   *   data: {
   *     emoji: '☕',
   *     backgroundColor: '#DBEAFE'
   *   }
   * });
   * if (result.data) {
   *   console.log('Profile image updated:', result.data.profileImage);
   * }
   * ```
   */
  setProfileImage: async (
    token: string,
    profileImageData: SetProfileImageRequest
  ): Promise<ApiResponse<SetProfileImageResponse>> => {
    if (!token || typeof token !== "string" || token.trim() === "") {
      return { error: "Invalid token provided" };
    }
    backendClient.setAuthToken(token);
    return backendClient.post<SetProfileImageResponse, SetProfileImageRequest>(
      "/auth/set-profile-image",
      profileImageData
    );
  },

  /**
   * Get SIWA nonce for Sign-In with wallet authentication
   * @returns Promise with SIWA input containing nonce and domain info
   * @example
   * ```typescript
   * const result = await authService.getSIWANonce();
   * if (result.data) {
   *   console.log('SIWA nonce:', result.data.data.nonce);
   *   // Use this input with wallet adapter's signIn method
   * }
   * ```
   */
  getSIWANonce: async (): Promise<ApiResponse<SIWANonceResponse>> => {
    return backendClient.get<SIWANonceResponse>("/auth/siwa/nonce");
  },

  /**
   * Complete SIWA authentication by verifying signature
   * @param output - Serialized SignInOutput from wallet adapter
   * @param turnstileResponse - Cloudflare Turnstile response token
   * @returns Promise with login response containing JWT token and wallet
   * @example
   * ```typescript
   * const result = await authService.siwaCallback(
   *   serializedOutput,
   *   turnstileToken
   * );
   * if (result.data) {
   *   console.log('Login successful:', result.data.token);
   *   console.log('Wallet:', result.data.wallet);
   * }
   * ```
   */
  siwaCallback: async (
    output: any,
    turnstileResponse: string,
    additionalData?: {
      input?: SIWAInput;
      domain?: string;
      uri?: string;
      email?: string;
    }
  ): Promise<ApiResponse<SIWACallbackResponse>> => {
    return backendClient.post<SIWACallbackResponse, SIWACallbackRequest>(
      "/auth/siwa/callback",
      {
        output,
        turnstileResponse,
        input: additionalData?.input,
        domain: additionalData?.domain,
        uri: additionalData?.uri,
        email: additionalData?.email,
      }
    );
  },
} as const;

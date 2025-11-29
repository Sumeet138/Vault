// Export the base client and its types
export { backendClient, type ApiResponse, type RequestConfig } from "./client";

// Import services for internal use
import { authService } from "./auth";
import { userService } from "./user";
import { linksService } from "./links";
import { addressService } from "./address";
import { paymentsService } from "./payments";
import { nfcTagService } from "./nfcTag";

// Re-export individual services
export {
  authService,
  userService,
  linksService,
  addressService,
  paymentsService,
  nfcTagService,
};

// Export all types for better autocomplete
export type {
  // Auth types
  LoginResponse,
  WalletLoginRequest,
  RefreshTokenResponse,
  LogoutResponse,
  Wallet,
  UserProfile,
  AptosNonceResponse,
} from "./auth";

export type {
  // Payment types
  CollectInfo,
  RecordPaymentRequest,
  RecordPaymentResponse,
} from "./payments";
export type { NfcTag } from "./nfcTag";

/**
 * Main backend API object with all services organized by domain
 *
 * @example
 * ```typescript
 *
 * // Get user profile (future)
 * const userResult = await backend.user.getProfile('jwt-token');
 *
 * // Get wallet balance (future)
 * const balanceResult = await backend.address.getBalance('jwt-token', 'wallet-address', 'APTOS');
 * ```
 */
export const backend = {
  /** Authentication related endpoints */
  auth: authService,
  /** User profile and settings endpoints */
  user: userService,
  /** Payment links management endpoints */
  links: linksService,
  /** Address and wallet related endpoints */
  address: addressService,
  /** Payment recording endpoints */
  payments: paymentsService,
  /** NFC Tag endpoints */
  nfcTag: nfcTagService,
} as const;

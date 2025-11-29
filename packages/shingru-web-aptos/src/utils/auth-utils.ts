import { UserProfile } from "@/lib/api";

/**
 * Auth utility functions have been removed - auth flow is now handled by
 * the consolidated /login page which conditionally renders all states.
 * This eliminates redirect loops and provides a seamless user experience.
 */

/**
 * Determines the redirect path for authenticated users
 * @param _me User profile
 * @returns Redirect path string
 */
export function determineLoginRedirectPath(_me: UserProfile): string {
  // All authenticated users redirect to the main app
  return "/app";
}
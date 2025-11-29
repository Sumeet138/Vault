/**
 * URL utilities for generating dynamic URLs based on the current environment
 */

/**
 * Get the base URL (origin) for the current environment
 * Works in both client-side and server-side contexts
 * 
 * @returns The base URL (e.g., "http://localhost:3000" in dev, "https://vault-aptos.vercel.app" in prod)
 */
export function getBaseUrl(): string {
  // Client-side: use window.location
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  // Server-side: use environment variable or fallback
  if (process.env.NEXT_PUBLIC_APP_URL) {
    return process.env.NEXT_PUBLIC_APP_URL;
  }

  // Fallback for server-side rendering
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // Default fallback (shouldn't happen in production)
  return "https://vault-aptos.vercel.app";
}

/**
 * Get the base hostname (without protocol) for the current environment
 * Useful for display purposes where you don't want to show the full URL
 * 
 * @returns The hostname (e.g., "localhost:3000" in dev, "vault-aptos.vercel.app" in prod)
 */
export function getBaseHostname(): string {
  // Client-side: use window.location
  if (typeof window !== "undefined") {
    return window.location.host;
  }

  // Server-side: extract from environment variable
  if (process.env.NEXT_PUBLIC_APP_URL) {
    try {
      const url = new URL(process.env.NEXT_PUBLIC_APP_URL);
      return url.host;
    } catch {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
  }

  // Fallback for server-side rendering
  if (process.env.VERCEL_URL) {
    return process.env.VERCEL_URL;
  }

  // Default fallback
  return "vault-aptos.vercel.app";
}

/**
 * Generate a full URL for a path
 * 
 * @param path - The path to append (e.g., "/username" or "/username/link-name")
 * @returns The complete URL
 */
export function getUrlForPath(path: string): string {
  const baseUrl = getBaseUrl();
  // Ensure path starts with /
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}


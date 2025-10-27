/**
 * Get Base URL Helper
 * PRD-0016: Async Background Song Generation
 *
 * Provides the correct base URL for the application depending on environment.
 * Used for constructing callback URLs for Suno API webhooks.
 */

/**
 * Gets the base URL for the current deployment environment.
 *
 * Priority order:
 * 1. Browser: Use window.location.origin
 * 2. Vercel: Use VERCEL_URL environment variable
 * 3. Custom: Use NEXT_PUBLIC_BASE_URL environment variable
 * 4. Fallback: localhost:3000
 *
 * @returns The base URL including protocol (e.g., "https://songly-amber.vercel.app")
 *
 * @example
 * ```typescript
 * const callbackUrl = `${getBaseUrl()}/api/suno/lyrics/callback?songId=${songId}`;
 * // Returns: "https://songly-amber.vercel.app/api/suno/lyrics/callback?songId=123"
 * ```
 */
export function getBaseUrl(): string {
  // Client-side: Use window.location.origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // Server-side: Check environment variables

  // 1. Custom base URL (for testing or custom domains)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // 2. Vercel deployment
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 3. Fallback to localhost for local development
  return 'http://localhost:3000';
}

/**
 * Checks if the current environment is production.
 *
 * @returns True if running in production, false otherwise
 */
export function isProduction(): boolean {
  return process.env.NODE_ENV === 'production';
}

/**
 * Checks if the current environment is development.
 *
 * @returns True if running in development, false otherwise
 */
export function isDevelopment(): boolean {
  return process.env.NODE_ENV === 'development';
}

/**
 * Checks if running on Vercel.
 *
 * @returns True if deployed on Vercel, false otherwise
 */
export function isVercel(): boolean {
  return !!process.env.VERCEL;
}

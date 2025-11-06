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
 * Gets the callback URL for Suno API webhooks.
 * 
 * For development: Uses NEXT_PUBLIC_SUNO_CALLBACK_URL (client) or SUNO_CALLBACK_URL (server) from .env if set (e.g., ngrok URL)
 * For production: Uses getBaseUrl() which detects Vercel or custom domain
 *
 * Priority order:
 * 1. NEXT_PUBLIC_SUNO_CALLBACK_URL (client) / SUNO_CALLBACK_URL (server) (for development with ngrok/external URL)
 * 2. NEXT_PUBLIC_BASE_URL (for custom domains)
 * 3. VERCEL_URL (auto-detected on Vercel)
 * 4. window.location.origin (client-side fallback)
 * 5. localhost:3000 (server-side fallback)
 *
 * @param path - The API path to append (e.g., "/api/suno/lyrics/callback")
 * @param queryParams - Optional query parameters as object
 * @returns Full callback URL with path and query params
 *
 * @example
 * ```typescript
 * const callbackUrl = getSunoCallbackUrl('/api/suno/lyrics/callback', { songId: '123' });
 * // Returns: "https://abc123.ngrok.io/api/suno/lyrics/callback?songId=123" (dev)
 * // or: "https://songly-amber.vercel.app/api/suno/lyrics/callback?songId=123" (prod)
 * ```
 */
export function getSunoCallbackUrl(path: string, queryParams?: Record<string, string>): string {
  let baseUrl: string;

  // 1. Check for explicit callback URL (for development with ngrok)
  // Client-side: Use NEXT_PUBLIC_ prefix (exposed to browser)
  // Server-side: Use regular env var (more secure)
  const callbackUrl = typeof window !== 'undefined' 
    ? process.env.NEXT_PUBLIC_SUNO_CALLBACK_URL
    : process.env.SUNO_CALLBACK_URL;

  if (callbackUrl) {
    baseUrl = callbackUrl;
    // Remove trailing slash if present
    baseUrl = baseUrl.replace(/\/$/, '');
  } else {
    // 2. Use standard base URL detection
    baseUrl = getBaseUrl();
  }

  // Build URL with path
  let url = `${baseUrl}${path}`;

  // Add query parameters if provided
  if (queryParams && Object.keys(queryParams).length > 0) {
    const params = new URLSearchParams(queryParams);
    url += `?${params.toString()}`;
  }

  return url;
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

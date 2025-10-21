/**
 * Get the base URL for the application
 * Works in both server and client environments
 * Handles Vercel automatic deployment URLs
 */
export function getBaseUrl(): string {
  // 1. Explicitly set URL (highest priority)
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL;
  }

  // 2. Browser environment - use current origin
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }

  // 3. Vercel deployment URL (automatically set by Vercel)
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }

  // 4. Development fallback
  return 'http://localhost:3000';
}

/**
 * Get the full callback URL for Suno API
 * Server-side only
 */
export function getSunoCallbackUrl(songId?: string): string {
  const baseUrl = process.env.SUNO_CALLBACK_URL ||
                  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : null) ||
                  'http://localhost:3000';

  const callbackPath = '/api/suno/callback';
  const fullUrl = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) + callbackPath : baseUrl + callbackPath;

  return songId
    ? `${fullUrl}?songId=${encodeURIComponent(songId)}`
    : fullUrl;
}

/**
 * Get the lyrics callback URL
 * Client-side compatible
 */
export function getLyricsCallbackUrl(conversationId?: string): string {
  const baseUrl = getBaseUrl();
  const callbackPath = '/api/suno/lyrics/callback';
  const fullUrl = baseUrl + callbackPath;

  return conversationId
    ? `${fullUrl}?conversationId=${encodeURIComponent(conversationId)}`
    : fullUrl;
}

/**
 * Check if running in Vercel production environment
 */
export function isVercelProduction(): boolean {
  return process.env.VERCEL_ENV === 'production';
}

/**
 * Check if running in Vercel preview environment
 */
export function isVercelPreview(): boolean {
  return process.env.VERCEL_ENV === 'preview';
}

/**
 * Get the current Vercel environment
 */
export function getVercelEnv(): 'production' | 'preview' | 'development' | null {
  if (typeof process.env.VERCEL_ENV === 'string') {
    return process.env.VERCEL_ENV as 'production' | 'preview' | 'development';
  }
  return null;
}

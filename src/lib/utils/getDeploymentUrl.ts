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
  const callbackPath = '/api/suno/callback';
  
  // If SUNO_CALLBACK_URL is set, check if it already includes the path
  if (process.env.SUNO_CALLBACK_URL) {
    const envUrl = process.env.SUNO_CALLBACK_URL.trim();
    // Check if URL already ends with the callback path (with or without query string)
    const urlWithoutQuery = envUrl.split('?')[0];
    const normalizedUrl = urlWithoutQuery.endsWith('/') ? urlWithoutQuery.slice(0, -1) : urlWithoutQuery;
    
    if (normalizedUrl.endsWith(callbackPath)) {
      // URL already includes the callback path - use it as-is, just add songId if needed
      const baseUrl = envUrl.split('?')[0]; // Remove existing query params
      const baseUrlNormalized = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
      return songId
        ? `${baseUrlNormalized}?songId=${encodeURIComponent(songId)}`
        : baseUrlNormalized;
    }
    // Otherwise, treat it as a base URL and append the path
    const baseUrl = envUrl.endsWith('/') ? envUrl.slice(0, -1) : envUrl;
    const fullUrl = baseUrl + callbackPath;
    return songId
      ? `${fullUrl}?songId=${encodeURIComponent(songId)}`
      : fullUrl;
  }

  // Auto-detect from VERCEL_URL or use localhost
  const baseUrl = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : 'http://localhost:3000';
  
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

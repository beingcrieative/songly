/**
 * Application Configuration
 * PRD-0016: Async Background Song Generation
 *
 * Centralized configuration for generation limits, timeouts, and other constants.
 */

/**
 * Concurrent Generation Limits
 * Control how many songs a user can generate simultaneously based on their tier.
 */
export const CONCURRENT_GENERATION_LIMITS = {
  /** Maximum concurrent generations for free tier users */
  FREE: parseInt(process.env.NEXT_PUBLIC_MAX_CONCURRENT_FREE || '1'),

  /** Maximum concurrent generations for premium tier users */
  PREMIUM: parseInt(process.env.NEXT_PUBLIC_MAX_CONCURRENT_PREMIUM || '5'),
} as const;

/**
 * Generation Timeouts and Retry Limits
 */
export const GENERATION_CONFIG = {
  /** Maximum number of retry attempts for failed lyrics generation */
  MAX_LYRICS_RETRIES: 3,

  /** Maximum number of retry attempts for failed music generation */
  MAX_MUSIC_RETRIES: 3,

  /** Time in milliseconds before considering a generation stale (10 minutes) */
  STALE_GENERATION_TIMEOUT: 10 * 60 * 1000,

  /** Expected average time for lyrics generation in milliseconds (45 seconds) */
  EXPECTED_LYRICS_DURATION: 45 * 1000,

  /** Expected average time for music generation in milliseconds (90 seconds) */
  EXPECTED_MUSIC_DURATION: 90 * 1000,
} as const;

/**
 * User Tier Types
 */
export type UserTier = 'free' | 'premium';

/**
 * Song Generation Statuses
 * Re-exported from types/generation.ts for convenience
 */
export const SONG_STATUSES = {
  PENDING: 'pending',
  GENERATING_LYRICS: 'generating_lyrics',
  LYRICS_READY: 'lyrics_ready',
  GENERATING_MUSIC: 'generating_music',
  READY: 'ready',
  FAILED: 'failed',
  COMPLETE: 'complete',
} as const;

/**
 * Status labels for UI display (Dutch)
 */
export const STATUS_LABELS = {
  [SONG_STATUSES.GENERATING_LYRICS]: '🔄 Lyrics worden gemaakt...',
  [SONG_STATUSES.LYRICS_READY]: '📝 Kies variant',
  [SONG_STATUSES.GENERATING_MUSIC]: '🎵 Muziek wordt gemaakt...',
  [SONG_STATUSES.READY]: '✅ Klaar om te beluisteren',
  [SONG_STATUSES.FAILED]: '❌ Mislukt - Probeer opnieuw',
  [SONG_STATUSES.COMPLETE]: '✓ Voltooid',
  [SONG_STATUSES.PENDING]: '⏳ In wachtrij',
} as const;

/**
 * Actionable statuses that require user attention
 * Used for notification badge counting
 */
export const ACTIONABLE_STATUSES = [
  SONG_STATUSES.LYRICS_READY,
  SONG_STATUSES.FAILED,
  SONG_STATUSES.READY,
] as const;

/**
 * Generating statuses (in progress, not yet actionable)
 */
export const GENERATING_STATUSES = [
  SONG_STATUSES.GENERATING_LYRICS,
  SONG_STATUSES.GENERATING_MUSIC,
] as const;

/**
 * Toast Messages (Dutch)
 */
export const TOAST_MESSAGES = {
  GENERATION_STARTED: {
    title: 'Je liedje wordt gegenereerd! ✨',
    description: 'Je ontvangt een notificatie wanneer de lyrics klaar zijn.',
  },
  GENERATION_FAILED: {
    title: 'Er ging iets mis',
    description: 'Probeer het opnieuw.',
  },
  CONCURRENT_LIMIT_FREE: {
    title: 'Generatie limiet bereikt',
    description: 'Je hebt al een liedje in productie. Wacht tot deze klaar is of upgrade naar Premium voor meerdere gelijktijdige generaties! 🎵',
  },
  CONCURRENT_LIMIT_PREMIUM: {
    title: 'Generatie limiet bereikt',
    description: 'Je hebt het maximum aantal gelijktijdige generaties bereikt. Wacht tot een generatie klaar is.',
  },
  RETRY_STARTED: {
    title: 'Opnieuw proberen...',
    description: 'Je liedje wordt opnieuw gegenereerd.',
  },
  MAX_RETRIES_REACHED: {
    title: 'Maximaal aantal pogingen bereikt',
    description: 'Neem contact op met support als het probleem aanhoudt.',
  },
} as const;

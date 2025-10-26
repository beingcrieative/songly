/**
 * TypeScript types for async generation tracking (PRD-0014)
 */

/**
 * Song generation status values
 */
export type SongStatus =
  | 'pending'             // Initial state, not yet sent to Suno
  | 'generating_lyrics'   // Waiting for Suno lyrics callback
  | 'lyrics_ready'        // Lyrics received, waiting for user selection
  | 'generating_music'    // Waiting for Suno music callback
  | 'ready'               // Music ready, playable
  | 'failed'              // Generation failed
  | 'complete';           // User has played/saved the song

/**
 * Generation progress tracking for both lyrics and music
 * Stored as JSON string in songs.generationProgress field
 */
export interface GenerationProgress {
  // Lyrics generation tracking
  lyricsTaskId: string | null;
  lyricsStartedAt: number | null;
  lyricsCompletedAt: number | null;
  lyricsError: string | null;
  lyricsRetryCount: number;

  // Music generation tracking
  musicTaskId: string | null;
  musicStartedAt: number | null;
  musicCompletedAt: number | null;
  musicError: string | null;
  musicRetryCount: number;

  // Raw callback payload for debugging
  rawCallback: any | null;
}

/**
 * Lyric variant data structure
 * Stored as JSON array in songs.lyricsVariants field
 */
export interface LyricVariant {
  text: string;
  variantIndex: number;
  selected: boolean;
}

/**
 * Notification type sent to users
 */
export type NotificationType = 'lyrics_ready' | 'music_ready';

/**
 * Type guard to check if a value is a valid SongStatus
 */
export function isSongStatus(value: unknown): value is SongStatus {
  return (
    typeof value === 'string' &&
    [
      'pending',
      'generating_lyrics',
      'lyrics_ready',
      'generating_music',
      'ready',
      'failed',
      'complete',
    ].includes(value)
  );
}

/**
 * Type guard to check if a value is a valid NotificationType
 */
export function isNotificationType(value: unknown): value is NotificationType {
  return typeof value === 'string' && ['lyrics_ready', 'music_ready'].includes(value);
}

/**
 * Validate GenerationProgress object
 */
export function isValidGenerationProgress(value: unknown): value is GenerationProgress {
  if (!value || typeof value !== 'object') return false;

  const progress = value as any;

  // Check required structure
  return (
    (progress.lyricsTaskId === null || typeof progress.lyricsTaskId === 'string') &&
    (progress.lyricsStartedAt === null || typeof progress.lyricsStartedAt === 'number') &&
    (progress.lyricsCompletedAt === null || typeof progress.lyricsCompletedAt === 'number') &&
    (progress.lyricsError === null || typeof progress.lyricsError === 'string') &&
    typeof progress.lyricsRetryCount === 'number' &&
    (progress.musicTaskId === null || typeof progress.musicTaskId === 'string') &&
    (progress.musicStartedAt === null || typeof progress.musicStartedAt === 'number') &&
    (progress.musicCompletedAt === null || typeof progress.musicCompletedAt === 'number') &&
    (progress.musicError === null || typeof progress.musicError === 'string') &&
    typeof progress.musicRetryCount === 'number'
  );
}

/**
 * Validate LyricVariant object
 */
export function isValidLyricVariant(value: unknown): value is LyricVariant {
  if (!value || typeof value !== 'object') return false;

  const variant = value as any;

  return (
    typeof variant.text === 'string' &&
    typeof variant.variantIndex === 'number' &&
    typeof variant.selected === 'boolean'
  );
}

/**
 * Create an empty GenerationProgress object with safe defaults
 */
export function createEmptyGenerationProgress(): GenerationProgress {
  return {
    lyricsTaskId: null,
    lyricsStartedAt: null,
    lyricsCompletedAt: null,
    lyricsError: null,
    lyricsRetryCount: 0,
    musicTaskId: null,
    musicStartedAt: null,
    musicCompletedAt: null,
    musicError: null,
    musicRetryCount: 0,
    rawCallback: null,
  };
}

/**
 * Parse GenerationProgress from JSON string
 * Returns null if parsing fails or validation fails
 */
export function parseGenerationProgress(json: string | null | undefined): GenerationProgress | null {
  if (!json) return null;

  try {
    const parsed = JSON.parse(json);
    if (isValidGenerationProgress(parsed)) {
      return parsed;
    }
    console.warn('Invalid GenerationProgress structure:', parsed);
    return null;
  } catch (e) {
    console.warn('Failed to parse GenerationProgress:', e);
    return null;
  }
}

/**
 * Parse LyricVariant array from JSON string
 * Returns empty array if parsing fails
 */
export function parseLyricVariants(json: string | null | undefined): LyricVariant[] {
  if (!json) return [];

  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.every(isValidLyricVariant)) {
      return parsed;
    }
    console.warn('Invalid LyricVariant array structure:', parsed);
    return [];
  } catch (e) {
    console.warn('Failed to parse LyricVariants:', e);
    return [];
  }
}

/**
 * Parse notification types array from JSON string
 * Returns empty array if parsing fails
 */
export function parseNotificationsSent(json: string | null | undefined): NotificationType[] {
  if (!json) return [];

  try {
    const parsed = JSON.parse(json);
    if (Array.isArray(parsed) && parsed.every(isNotificationType)) {
      return parsed;
    }
    console.warn('Invalid NotificationsSent array:', parsed);
    return [];
  } catch (e) {
    console.warn('Failed to parse NotificationsSent:', e);
    return [];
  }
}

/**
 * Stringify GenerationProgress for database storage
 */
export function stringifyGenerationProgress(progress: GenerationProgress): string {
  return JSON.stringify(progress);
}

/**
 * Stringify LyricVariant array for database storage
 */
export function stringifyLyricVariants(variants: LyricVariant[]): string {
  return JSON.stringify(variants);
}

/**
 * Stringify notification types array for database storage
 */
export function stringifyNotificationsSent(types: NotificationType[]): string {
  return JSON.stringify(types);
}

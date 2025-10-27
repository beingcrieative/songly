/**
 * Concurrent Generation Checking
 * PRD-0016: Async Background Song Generation
 *
 * Functions to check how many songs a user currently has in generation state.
 */

import { GENERATING_STATUSES } from '@/lib/config';

/**
 * Song object from InstantDB query
 */
export interface Song {
  id: string;
  status?: string | null;
  createdAt?: number;
}

/**
 * Counts how many songs a user currently has in generating states.
 *
 * Generating states include:
 * - 'generating_lyrics'
 * - 'generating_music'
 *
 * @param songs - Array of user's songs from InstantDB query
 * @returns Count of songs currently generating
 *
 * @example
 * ```typescript
 * const generatingCount = countGeneratingSongs(userSongs);
 * console.log(`${generatingCount} songs currently generating`);
 * ```
 */
export function countGeneratingSongs(songs: Song[] | undefined | null): number {
  if (!songs || !Array.isArray(songs)) {
    return 0;
  }

  return songs.filter((song) => {
    if (!song.status) return false;
    return GENERATING_STATUSES.includes(song.status as any);
  }).length;
}

/**
 * Checks if a user has reached their concurrent generation limit.
 *
 * @param songs - Array of user's songs from InstantDB query
 * @param limit - Maximum allowed concurrent generations
 * @returns Object with status and count information
 *
 * @example
 * ```typescript
 * const check = checkConcurrentLimit(userSongs, 1);
 * if (check.limitReached) {
 *   console.log(`Already generating ${check.currentCount} songs`);
 * }
 * ```
 */
export function checkConcurrentLimit(
  songs: Song[] | undefined | null,
  limit: number
): {
  limitReached: boolean;
  currentCount: number;
  limit: number;
  remaining: number;
} {
  const currentCount = countGeneratingSongs(songs);
  const remaining = Math.max(0, limit - currentCount);

  return {
    limitReached: currentCount >= limit,
    currentCount,
    limit,
    remaining,
  };
}

/**
 * Gets a list of songs currently in generating state.
 *
 * @param songs - Array of user's songs from InstantDB query
 * @returns Array of songs in generating states
 *
 * @example
 * ```typescript
 * const generatingSongs = getGeneratingSongs(userSongs);
 * generatingSongs.forEach(song => {
 *   console.log(`${song.id}: ${song.status}`);
 * });
 * ```
 */
export function getGeneratingSongs(songs: Song[] | undefined | null): Song[] {
  if (!songs || !Array.isArray(songs)) {
    return [];
  }

  return songs.filter((song) => {
    if (!song.status) return false;
    return GENERATING_STATUSES.includes(song.status as any);
  });
}

/**
 * Checks if a user can start a new generation based on their current load.
 *
 * @param songs - Array of user's songs from InstantDB query
 * @param limit - Maximum allowed concurrent generations
 * @returns True if user can start a new generation, false otherwise
 *
 * @example
 * ```typescript
 * if (canStartNewGeneration(userSongs, 5)) {
 *   await generateLyrics();
 * } else {
 *   showToast({ title: 'Limit reached', variant: 'error' });
 * }
 * ```
 */
export function canStartNewGeneration(
  songs: Song[] | undefined | null,
  limit: number
): boolean {
  const currentCount = countGeneratingSongs(songs);
  return currentCount < limit;
}

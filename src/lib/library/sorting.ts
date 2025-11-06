/**
 * Smart sorting utilities for Library songs
 * Prioritizes action-required items (lyrics_ready, ready)
 */

export interface SongForSorting {
  id: string;
  status?: string | null;
  lastViewedAt?: number | null;
  updatedAt?: number | null;
  createdAt?: number | null;
}

/**
 * Get priority for action-based sorting
 * Lower number = higher priority (appears first)
 */
function getActionPriority(status: string | null | undefined): number {
  switch (status) {
    case 'lyrics_ready':
      return 1; // Highest priority - user needs to choose lyrics
    case 'ready':
      return 2; // High priority - song ready to play
    case 'generating_lyrics':
      return 3; // Medium priority - in progress
    case 'generating_music':
      return 4; // Medium priority - in progress
    case 'failed':
      return 5; // Needs attention but lower priority
    case 'complete':
      return 6; // Lowest priority - already handled
    case 'pending':
      return 7; // Very low priority
    default:
      return 99; // Unknown status goes last
  }
}

/**
 * Sort songs by action priority, then by recent activity
 * Action items (lyrics_ready, ready) appear first
 *
 * Generic function preserves the full type of input songs
 */
export function sortSongsByPriority<T extends SongForSorting>(songs: T[]): T[] {
  return [...songs].sort((a, b) => {
    // 1. Sort by action priority
    const aPriority = getActionPriority(a.status);
    const bPriority = getActionPriority(b.status);

    if (aPriority !== bPriority) {
      return aPriority - bPriority;
    }

    // 2. Ties broken by recent activity (most recent first)
    const aTime = a.lastViewedAt || a.updatedAt || a.createdAt || 0;
    const bTime = b.lastViewedAt || b.updatedAt || b.createdAt || 0;

    return bTime - aTime; // DESC (most recent first)
  });
}

/**
 * Count songs that require user action
 * Returns count of songs with status 'lyrics_ready' or 'ready'
 */
export function getActionItemsCount(songs: SongForSorting[]): number {
  return songs.filter(
    (s) => s.status === 'lyrics_ready' || s.status === 'ready'
  ).length;
}

/**
 * Check if a song requires user action
 */
export function requiresAction(status: string | null | undefined): boolean {
  return status === 'lyrics_ready' || status === 'ready';
}

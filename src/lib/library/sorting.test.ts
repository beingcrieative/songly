import { describe, it, expect } from 'vitest';
import { sortSongsByPriority, getActionItemsCount, requiresAction } from './sorting';

describe('sortSongsByPriority', () => {
  it('should prioritize lyrics_ready status first', () => {
    const songs = [
      { id: '1', status: 'ready', updatedAt: 100 },
      { id: '2', status: 'lyrics_ready', updatedAt: 50 },
      { id: '3', status: 'complete', updatedAt: 200 },
    ];

    const sorted = sortSongsByPriority(songs);

    expect(sorted[0].id).toBe('2'); // lyrics_ready
    expect(sorted[1].id).toBe('1'); // ready
    expect(sorted[2].id).toBe('3'); // complete
  });

  it('should prioritize ready status second', () => {
    const songs = [
      { id: '1', status: 'generating_music', updatedAt: 100 },
      { id: '2', status: 'ready', updatedAt: 50 },
      { id: '3', status: 'failed', updatedAt: 200 },
    ];

    const sorted = sortSongsByPriority(songs);

    expect(sorted[0].id).toBe('2'); // ready
  });

  it('should sort by recent activity when priorities are equal', () => {
    const songs = [
      { id: '1', status: 'ready', updatedAt: 100 },
      { id: '2', status: 'ready', updatedAt: 300 },
      { id: '3', status: 'ready', updatedAt: 200 },
    ];

    const sorted = sortSongsByPriority(songs);

    expect(sorted[0].id).toBe('2'); // Most recent
    expect(sorted[1].id).toBe('3');
    expect(sorted[2].id).toBe('1'); // Oldest
  });

  it('should use lastViewedAt over updatedAt when available', () => {
    const songs = [
      { id: '1', status: 'ready', updatedAt: 300, lastViewedAt: 100 },
      { id: '2', status: 'ready', updatedAt: 100, lastViewedAt: 400 },
    ];

    const sorted = sortSongsByPriority(songs);

    expect(sorted[0].id).toBe('2'); // Higher lastViewedAt
  });

  it('should handle empty array', () => {
    const sorted = sortSongsByPriority([]);
    expect(sorted).toEqual([]);
  });

  it('should handle songs with null status', () => {
    const songs = [
      { id: '1', status: null, updatedAt: 100 },
      { id: '2', status: 'ready', updatedAt: 50 },
    ];

    const sorted = sortSongsByPriority(songs);

    expect(sorted[0].id).toBe('2'); // ready has priority
    expect(sorted[1].id).toBe('1'); // null status goes last
  });
});

describe('getActionItemsCount', () => {
  it('should count songs with lyrics_ready status', () => {
    const songs = [
      { id: '1', status: 'lyrics_ready' },
      { id: '2', status: 'ready' },
      { id: '3', status: 'generating_music' },
    ];

    expect(getActionItemsCount(songs)).toBe(2);
  });

  it('should count songs with ready status', () => {
    const songs = [
      { id: '1', status: 'ready' },
      { id: '2', status: 'ready' },
      { id: '3', status: 'complete' },
    ];

    expect(getActionItemsCount(songs)).toBe(2);
  });

  it('should return 0 for empty array', () => {
    expect(getActionItemsCount([])).toBe(0);
  });

  it('should return 0 when no action items', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'complete' },
    ];

    expect(getActionItemsCount(songs)).toBe(0);
  });
});

describe('requiresAction', () => {
  it('should return true for lyrics_ready status', () => {
    expect(requiresAction('lyrics_ready')).toBe(true);
  });

  it('should return true for ready status', () => {
    expect(requiresAction('ready')).toBe(true);
  });

  it('should return false for other statuses', () => {
    expect(requiresAction('generating_lyrics')).toBe(false);
    expect(requiresAction('generating_music')).toBe(false);
    expect(requiresAction('failed')).toBe(false);
    expect(requiresAction('complete')).toBe(false);
  });

  it('should return false for null/undefined', () => {
    expect(requiresAction(null)).toBe(false);
    expect(requiresAction(undefined)).toBe(false);
  });
});

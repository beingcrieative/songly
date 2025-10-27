/**
 * Unit Tests for Concurrent Generation Checking
 * PRD-0016: Async Background Song Generation
 */

import { describe, it, expect } from 'vitest';
import {
  countGeneratingSongs,
  checkConcurrentLimit,
  getGeneratingSongs,
  canStartNewGeneration,
} from './concurrentGenerations';

describe('countGeneratingSongs', () => {
  it('returns 0 for null songs', () => {
    expect(countGeneratingSongs(null)).toBe(0);
  });

  it('returns 0 for undefined songs', () => {
    expect(countGeneratingSongs(undefined)).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(countGeneratingSongs([])).toBe(0);
  });

  it('counts songs with status "generating_lyrics"', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'ready' },
    ];
    expect(countGeneratingSongs(songs)).toBe(1);
  });

  it('counts songs with status "generating_music"', () => {
    const songs = [
      { id: '1', status: 'generating_music' },
      { id: '2', status: 'lyrics_ready' },
    ];
    expect(countGeneratingSongs(songs)).toBe(1);
  });

  it('counts multiple generating songs', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'generating_music' },
      { id: '3', status: 'ready' },
      { id: '4', status: 'generating_lyrics' },
    ];
    expect(countGeneratingSongs(songs)).toBe(3);
  });

  it('ignores songs without status', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2' },
    ];
    expect(countGeneratingSongs(songs)).toBe(1);
  });

  it('ignores songs with null status', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: null },
    ];
    expect(countGeneratingSongs(songs)).toBe(1);
  });

  it('does not count non-generating statuses', () => {
    const songs = [
      { id: '1', status: 'ready' },
      { id: '2', status: 'failed' },
      { id: '3', status: 'lyrics_ready' },
      { id: '4', status: 'complete' },
    ];
    expect(countGeneratingSongs(songs)).toBe(0);
  });
});

describe('checkConcurrentLimit', () => {
  it('returns limitReached false when under limit', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
    ];
    const result = checkConcurrentLimit(songs, 2);
    expect(result.limitReached).toBe(false);
    expect(result.currentCount).toBe(1);
    expect(result.limit).toBe(2);
    expect(result.remaining).toBe(1);
  });

  it('returns limitReached true when at limit', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'generating_music' },
    ];
    const result = checkConcurrentLimit(songs, 2);
    expect(result.limitReached).toBe(true);
    expect(result.currentCount).toBe(2);
    expect(result.limit).toBe(2);
    expect(result.remaining).toBe(0);
  });

  it('returns limitReached true when over limit', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'generating_music' },
      { id: '3', status: 'generating_lyrics' },
    ];
    const result = checkConcurrentLimit(songs, 2);
    expect(result.limitReached).toBe(true);
    expect(result.currentCount).toBe(3);
    expect(result.limit).toBe(2);
    expect(result.remaining).toBe(0);
  });

  it('handles empty songs array', () => {
    const result = checkConcurrentLimit([], 1);
    expect(result.limitReached).toBe(false);
    expect(result.currentCount).toBe(0);
    expect(result.limit).toBe(1);
    expect(result.remaining).toBe(1);
  });

  it('handles null songs', () => {
    const result = checkConcurrentLimit(null, 1);
    expect(result.limitReached).toBe(false);
    expect(result.currentCount).toBe(0);
    expect(result.remaining).toBe(1);
  });
});

describe('getGeneratingSongs', () => {
  it('returns empty array for null songs', () => {
    expect(getGeneratingSongs(null)).toEqual([]);
  });

  it('returns empty array for undefined songs', () => {
    expect(getGeneratingSongs(undefined)).toEqual([]);
  });

  it('returns only songs in generating states', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'ready' },
      { id: '3', status: 'generating_music' },
      { id: '4', status: 'failed' },
    ];
    const result = getGeneratingSongs(songs);
    expect(result).toHaveLength(2);
    expect(result.map(s => s.id)).toEqual(['1', '3']);
  });

  it('returns empty array when no songs are generating', () => {
    const songs = [
      { id: '1', status: 'ready' },
      { id: '2', status: 'failed' },
    ];
    expect(getGeneratingSongs(songs)).toEqual([]);
  });
});

describe('canStartNewGeneration', () => {
  it('returns true when under limit', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
    ];
    expect(canStartNewGeneration(songs, 2)).toBe(true);
  });

  it('returns false when at limit', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'generating_music' },
    ];
    expect(canStartNewGeneration(songs, 2)).toBe(false);
  });

  it('returns false when over limit', () => {
    const songs = [
      { id: '1', status: 'generating_lyrics' },
      { id: '2', status: 'generating_music' },
      { id: '3', status: 'generating_lyrics' },
    ];
    expect(canStartNewGeneration(songs, 2)).toBe(false);
  });

  it('returns true for empty songs array', () => {
    expect(canStartNewGeneration([], 1)).toBe(true);
  });

  it('returns true for null songs', () => {
    expect(canStartNewGeneration(null, 1)).toBe(true);
  });
});

/**
 * PRD-0016 Task 3.5: Integration tests for concurrent generation management
 * Tests the full flow of concurrent generation limits in realistic scenarios
 */

import { describe, it, expect } from 'vitest';
import { checkConcurrentLimit, countGeneratingSongs, type Song } from './concurrentGenerations';
import { getConcurrentLimit, getUserTier } from './userTier';

describe('Concurrent Generation - Integration Scenarios', () => {
  describe('Free User Scenarios', () => {
    const freeUser = { id: 'user-1', email: 'free@example.com' };
    const freeLimit = getConcurrentLimit(freeUser);

    it('should allow first generation for free user', () => {
      const songs: Song[] = [];
      const result = checkConcurrentLimit(songs, freeLimit);

      expect(result.limitReached).toBe(false);
      expect(result.currentCount).toBe(0);
      expect(result.limit).toBe(1);
      expect(result.remaining).toBe(1);
    });

    it('should block second generation when first is still generating', () => {
      const songs: Song[] = [
        {
          id: 'song-1',
          status: 'generating_lyrics',
          title: 'First Song',
          createdAt: Date.now(),
        } as Song,
      ];

      const result = checkConcurrentLimit(songs, freeLimit);

      expect(result.limitReached).toBe(true);
      expect(result.currentCount).toBe(1);
      expect(result.limit).toBe(1);
      expect(result.remaining).toBe(0);
    });

    it('should allow new generation when previous completed', () => {
      const songs: Song[] = [
        {
          id: 'song-1',
          status: 'ready',
          title: 'Completed Song',
          createdAt: Date.now() - 1000,
        } as Song,
      ];

      const result = checkConcurrentLimit(songs, freeLimit);

      expect(result.limitReached).toBe(false);
      expect(result.currentCount).toBe(0);
      expect(result.remaining).toBe(1);
    });

    it('should allow new generation when previous failed', () => {
      const songs: Song[] = [
        {
          id: 'song-1',
          status: 'failed',
          title: 'Failed Song',
          createdAt: Date.now() - 1000,
        } as Song,
      ];

      const result = checkConcurrentLimit(songs, freeLimit);

      expect(result.limitReached).toBe(false);
      expect(result.currentCount).toBe(0);
      expect(result.remaining).toBe(1);
    });

    it('should count all generating statuses correctly', () => {
      const songs: Song[] = [
        { id: 'song-1', status: 'generating_lyrics' } as Song,
      ];

      const count = countGeneratingSongs(songs);
      expect(count).toBe(1);

      // Should still block even with generating_lyrics status
      const result = checkConcurrentLimit(songs, freeLimit);
      expect(result.limitReached).toBe(true);
    });
  });

  describe('Premium User Scenarios', () => {
    const premiumUser = { id: 'user-2', email: 'premium@example.com', type: 'premium' };
    const premiumLimit = getConcurrentLimit(premiumUser);

    it('should allow multiple concurrent generations for premium users', () => {
      const songs: Song[] = [
        { id: 'song-1', status: 'generating_lyrics' } as Song,
        { id: 'song-2', status: 'generating_lyrics' } as Song,
        { id: 'song-3', status: 'generating_music' } as Song,
      ];

      const result = checkConcurrentLimit(songs, premiumLimit);

      expect(result.limitReached).toBe(false);
      expect(result.currentCount).toBe(3);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(2);
    });

    it('should block when premium limit reached', () => {
      const songs: Song[] = [
        { id: 'song-1', status: 'generating_lyrics' } as Song,
        { id: 'song-2', status: 'generating_lyrics' } as Song,
        { id: 'song-3', status: 'generating_music' } as Song,
        { id: 'song-4', status: 'generating_music' } as Song,
        { id: 'song-5', status: 'generating_music' } as Song,
      ];

      const result = checkConcurrentLimit(songs, premiumLimit);

      expect(result.limitReached).toBe(true);
      expect(result.currentCount).toBe(5);
      expect(result.limit).toBe(5);
      expect(result.remaining).toBe(0);
    });

    it('should only count generating songs, not completed ones', () => {
      const songs: Song[] = [
        { id: 'song-1', status: 'generating_lyrics' } as Song,
        { id: 'song-2', status: 'generating_music' } as Song,
        { id: 'song-3', status: 'ready' } as Song,
        { id: 'song-4', status: 'ready' } as Song,
        { id: 'song-5', status: 'failed' } as Song,
      ];

      const result = checkConcurrentLimit(songs, premiumLimit);

      expect(result.limitReached).toBe(false);
      expect(result.currentCount).toBe(2);
      expect(result.remaining).toBe(3);
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty song list', () => {
      const result = checkConcurrentLimit([], 1);

      expect(result.limitReached).toBe(false);
      expect(result.currentCount).toBe(0);
      expect(result.remaining).toBe(1);
    });

    it('should handle null/undefined song list', () => {
      const result1 = checkConcurrentLimit(null as any, 1);
      const result2 = checkConcurrentLimit(undefined as any, 1);

      expect(result1.currentCount).toBe(0);
      expect(result2.currentCount).toBe(0);
    });

    it('should handle songs without status field', () => {
      const songs = [
        { id: 'song-1', title: 'No Status' } as Song,
        { id: 'song-2' } as Song,
      ];

      const count = countGeneratingSongs(songs);
      expect(count).toBe(0);
    });

    it('should handle mixed valid and invalid songs', () => {
      const songs = [
        { id: 'song-1', status: 'generating_lyrics' } as Song,
        { id: 'song-2', title: 'No Status' } as Song,
        { id: 'song-3', status: null } as any,
        { id: 'song-4', status: 'ready' } as Song,
      ];

      const count = countGeneratingSongs(songs);
      expect(count).toBe(1);
    });
  });

  describe('User Tier Detection', () => {
    it('should correctly identify free users', () => {
      const user1 = { id: 'user-1', email: 'test@example.com' };
      const user2 = { id: 'user-2', email: 'test@example.com', type: 'free' };
      const user3 = null;
      const user4 = undefined;

      expect(getUserTier(user1)).toBe('free');
      expect(getUserTier(user2)).toBe('free');
      expect(getUserTier(user3)).toBe('free');
      expect(getUserTier(user4)).toBe('free');
    });

    it('should correctly identify premium users', () => {
      const user1 = { id: 'user-1', email: 'test@example.com', type: 'premium' };
      const user2 = { id: 'user-2', email: 'test@example.com', type: 'Premium' };
      const user3 = { id: 'user-3', email: 'test@example.com', type: 'PREMIUM' };
      const user4 = { id: 'user-4', email: 'test@example.com', type: 'pro' };
      const user5 = { id: 'user-5', email: 'test@example.com', type: 'paid' };

      expect(getUserTier(user1)).toBe('premium');
      expect(getUserTier(user2)).toBe('premium');
      expect(getUserTier(user3)).toBe('premium');
      expect(getUserTier(user4)).toBe('premium');
      expect(getUserTier(user5)).toBe('premium');
    });

    it('should return correct limits for each tier', () => {
      const freeUser = { id: 'user-1', email: 'test@example.com' };
      const premiumUser = { id: 'user-2', email: 'test@example.com', type: 'premium' };

      expect(getConcurrentLimit(freeUser)).toBe(1);
      expect(getConcurrentLimit(premiumUser)).toBe(5);
    });
  });

  describe('Real-World Scenarios', () => {
    it('should handle rapid generation attempts from free user', () => {
      const freeUser = { id: 'user-1', email: 'free@example.com' };
      const limit = getConcurrentLimit(freeUser);

      // First generation starts
      let songs: Song[] = [
        { id: 'song-1', status: 'generating_lyrics', createdAt: Date.now() } as Song,
      ];

      let result = checkConcurrentLimit(songs, limit);
      expect(result.limitReached).toBe(true); // Should block second attempt

      // First generation completes
      songs = [
        { id: 'song-1', status: 'ready', createdAt: Date.now() - 30000 } as Song,
      ];

      result = checkConcurrentLimit(songs, limit);
      expect(result.limitReached).toBe(false); // Should allow new generation
    });

    it('should handle premium user with queue management', () => {
      const premiumUser = { id: 'user-2', email: 'premium@example.com', type: 'premium' };
      const limit = getConcurrentLimit(premiumUser);

      // Start 3 generations
      let songs: Song[] = [
        { id: 'song-1', status: 'generating_lyrics', createdAt: Date.now() - 10000 } as Song,
        { id: 'song-2', status: 'generating_lyrics', createdAt: Date.now() - 5000 } as Song,
        { id: 'song-3', status: 'generating_lyrics', createdAt: Date.now() } as Song,
      ];

      let result = checkConcurrentLimit(songs, limit);
      expect(result.limitReached).toBe(false);
      expect(result.remaining).toBe(2);

      // First one completes
      songs = [
        { id: 'song-1', status: 'ready', createdAt: Date.now() - 10000 } as Song,
        { id: 'song-2', status: 'generating_lyrics', createdAt: Date.now() - 5000 } as Song,
        { id: 'song-3', status: 'generating_lyrics', createdAt: Date.now() } as Song,
      ];

      result = checkConcurrentLimit(songs, limit);
      expect(result.currentCount).toBe(2);
      expect(result.remaining).toBe(3);

      // Add 3 more to hit limit
      songs.push(
        { id: 'song-4', status: 'generating_music', createdAt: Date.now() } as Song,
        { id: 'song-5', status: 'generating_music', createdAt: Date.now() } as Song,
        { id: 'song-6', status: 'generating_music', createdAt: Date.now() } as Song
      );

      result = checkConcurrentLimit(songs, limit);
      expect(result.limitReached).toBe(true);
      expect(result.currentCount).toBe(5);
    });
  });
});

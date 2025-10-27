/**
 * PRD-0016 Task 4.3: Tests for action items count (notification badge)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useActionItemsCount } from './useActionItemsCount';
import { db } from '@/lib/db';

// Mock the db module
vi.mock('@/lib/db', () => ({
  db: {
    useQuery: vi.fn(),
  },
}));

describe('useActionItemsCount', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should return 0 when userId is undefined', () => {
    vi.mocked(db.useQuery).mockReturnValue({ data: undefined });

    const { result } = renderHook(() => useActionItemsCount(undefined));

    expect(result.current).toBe(0);
  });

  it('should return 0 when no songs are returned', () => {
    vi.mocked(db.useQuery).mockReturnValue({ data: { songs: [] } });

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    expect(result.current).toBe(0);
  });

  it('should count songs with lyrics_ready status', () => {
    // InstantDB filters on backend, so mock returns only filtered songs
    vi.mocked(db.useQuery).mockReturnValue({
      data: {
        songs: [
          { id: 'song-1', status: 'lyrics_ready' },
        ],
      },
    });

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    expect(result.current).toBe(1);
  });

  it('should count songs with ready status', () => {
    // InstantDB filters on backend, so mock returns only filtered songs
    vi.mocked(db.useQuery).mockReturnValue({
      data: {
        songs: [
          { id: 'song-1', status: 'ready' },
        ],
      },
    });

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    expect(result.current).toBe(1);
  });

  it('should count songs with failed status (PRD-0016)', () => {
    vi.mocked(db.useQuery).mockReturnValue({
      data: {
        songs: [
          { id: 'song-1', status: 'failed' },
        ],
      },
    });

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    expect(result.current).toBe(1);
  });

  it('should count all actionable statuses: lyrics_ready, ready, failed', () => {
    // InstantDB filters on backend, so mock returns only actionable songs
    vi.mocked(db.useQuery).mockReturnValue({
      data: {
        songs: [
          { id: 'song-1', status: 'lyrics_ready' },
          { id: 'song-2', status: 'ready' },
          { id: 'song-3', status: 'failed' },
        ],
      },
    });

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    expect(result.current).toBe(3);
  });

  it('should NOT count generating statuses', () => {
    // InstantDB filters on backend, generating statuses are excluded
    vi.mocked(db.useQuery).mockReturnValue({
      data: {
        songs: [],
      },
    });

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    expect(result.current).toBe(0);
  });

  it('should return correct count for edge case with 10+ actionable items', () => {
    const songs = Array.from({ length: 12 }, (_, i) => ({
      id: `song-${i}`,
      status: i % 3 === 0 ? 'lyrics_ready' : i % 3 === 1 ? 'ready' : 'failed',
    }));

    vi.mocked(db.useQuery).mockReturnValue({ data: { songs } });

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    // All 12 songs have actionable statuses
    expect(result.current).toBe(12);
  });

  it('should handle null/undefined data gracefully', () => {
    vi.mocked(db.useQuery).mockReturnValue({ data: null } as any);

    const { result } = renderHook(() => useActionItemsCount('user-123'));

    expect(result.current).toBe(0);
  });

  it('should call useQuery with correct filter', () => {
    const userId = 'test-user-456';

    vi.mocked(db.useQuery).mockReturnValue({ data: { songs: [] } });

    renderHook(() => useActionItemsCount(userId));

    expect(db.useQuery).toHaveBeenCalledWith({
      songs: {
        $: {
          where: {
            'user.id': userId,
            status: { in: ['lyrics_ready', 'ready', 'failed'] },
          },
        },
      },
    });
  });

  it('should return empty query when userId is undefined', () => {
    vi.mocked(db.useQuery).mockReturnValue({ data: undefined });

    renderHook(() => useActionItemsCount(undefined));

    expect(db.useQuery).toHaveBeenCalledWith({});
  });
});

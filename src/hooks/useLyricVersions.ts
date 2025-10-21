import { useEffect, useState, useRef } from 'react';
import { db } from '@/lib/db';
import { InstaQLEntity } from '@instantdb/react';
import { type AppSchema } from '@/instant.schema';

type LyricVersion = InstaQLEntity<AppSchema, 'lyric_versions'>;

interface UseLyricVersionsOptions {
  conversationId?: string;
  songId?: string;
  pollingInterval?: number; // milliseconds
  enabled?: boolean;
}

interface UseLyricVersionsResult {
  versions: LyricVersion[];
  latestVersion: LyricVersion | null;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
}

export function useLyricVersions({
  conversationId,
  songId,
  pollingInterval = 4000, // 4 seconds default
  enabled = true,
}: UseLyricVersionsOptions): UseLyricVersionsResult {
  const [lastHash, setLastHash] = useState<string | null>(null);
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const pollingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Build query based on available IDs
  let queryConfig = null;

  if (conversationId) {
    queryConfig = {
      lyric_versions: {
        $: {
          where: { 'conversation.id': conversationId },
          order: { createdAt: 'desc' as const },
        } as any,
      },
    };
  } else if (songId) {
    queryConfig = {
      lyric_versions: {
        $: {
          where: { 'song.id': songId },
          order: { createdAt: 'desc' as const },
        } as any,
      },
    };
  }

  // Use InstantDB query
  const { data, isLoading, error } = db.useQuery(
    enabled && queryConfig ? queryConfig : null
  );

  const versions = (data?.lyric_versions || []) as LyricVersion[];
  const latestVersion = versions.length > 0 ? versions[0] : null;

  // Hash-based deduplication and change detection
  useEffect(() => {
    if (latestVersion?.hash) {
      if (lastHash && lastHash !== latestVersion.hash) {
        setHasNewVersion(true);
        // Auto-clear the "new" indicator after 3 seconds
        setTimeout(() => setHasNewVersion(false), 3000);
      }
      setLastHash(latestVersion.hash);
    }
  }, [latestVersion?.hash, lastHash]);

  // Polling mechanism
  useEffect(() => {
    if (!enabled || !queryConfig) {
      return;
    }

    // Clear any existing timer
    if (pollingTimerRef.current) {
      clearInterval(pollingTimerRef.current);
    }

    // Set up polling interval
    pollingTimerRef.current = setInterval(() => {
      // Force re-fetch by updating a dummy state
      // InstantDB will handle the actual refetch through its subscription system
      setLastHash((prev) => prev);
    }, pollingInterval);

    return () => {
      if (pollingTimerRef.current) {
        clearInterval(pollingTimerRef.current);
      }
    };
  }, [enabled, pollingInterval, queryConfig]);

  const refetch = () => {
    setLastHash(null); // Reset to force detection of changes
  };

  return {
    versions,
    latestVersion,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

// Export a version that includes the "hasNewVersion" flag
export function useLyricVersionsWithNotification(
  options: UseLyricVersionsOptions
) {
  const [hasNewVersion, setHasNewVersion] = useState(false);
  const [lastHash, setLastHash] = useState<string | null>(null);

  const result = useLyricVersions(options);

  useEffect(() => {
    if (result.latestVersion?.hash) {
      if (lastHash && lastHash !== result.latestVersion.hash) {
        setHasNewVersion(true);
        setTimeout(() => setHasNewVersion(false), 3000);
      }
      setLastHash(result.latestVersion.hash);
    }
  }, [result.latestVersion?.hash, lastHash]);

  return {
    ...result,
    hasNewVersion,
  };
}

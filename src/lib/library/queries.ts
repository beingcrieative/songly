import * as React from "react";
import { db } from "@/lib/db";

type SortOption = "recent" | "az" | "played" | "action";
type SongStatus =
  | "all"
  | "pending"
  | "generating_lyrics"
  | "lyrics_ready"
  | "generating_music"
  | "ready"
  | "complete"
  | "failed"
  | "generating"; // Legacy backward compatibility

export interface LibrarySongsOptions {
  search?: string;
  status?: SongStatus;
  sort?: SortOption;
  limit?: number;
  offset?: number;
}

export interface LibraryConversationsOptions {
  search?: string;
  status?: ConversationStatusFilter;
  sort?: "recent" | "az";
  limit?: number;
  offset?: number;
}

type ConversationStatusFilter = "all" | "gathering" | "generating" | "refining" | "complete";

function mergeWhere(clauses: Record<string, unknown>[]) {
  if (!clauses.length) return undefined;
  if (clauses.length === 1) return clauses[0];
  return { and: clauses };
}

function buildOrder(sort: SortOption | undefined) {
  switch (sort) {
    case "az":
      return { title: "asc" } as const;
    case "played":
      return { lastPlayedAt: "desc" } as const;
    case "recent":
    default:
      return { updatedAt: "desc" } as const;
  }
}

function buildConversationOrder(sort: "recent" | "az" | undefined) {
  switch (sort) {
    case "az":
      return { conceptTitle: "asc" } as const;
    case "recent":
    default:
      return { updatedAt: "desc" } as const;
  }
}

export function useLibrarySongs(
  userId: string | undefined,
  options: LibrarySongsOptions
) {
  const limit = options.limit ?? 24;
  const offset = options.offset ?? 0;

  // Build where clauses - only execute query when userId is available
  const whereClauses: Record<string, unknown>[] = [];

  console.log('[LibraryQueries] useLibrarySongs called with userId:', userId);

  // Only add user filter when userId exists (prevents permission errors on mobile)
  if (userId) {
    whereClauses.push({ "user.id": userId });
  } else {
    // Return empty query when no userId (conditional execution)
    console.log('[LibraryQueries] No userId, returning empty');
    return { data: { songs: [] }, isLoading: false, error: null };
  }

  if (options.status && options.status !== "all") {
    whereClauses.push({ status: options.status });
  }

  if (options.search) {
    const term = `%${options.search.trim()}%`;
    whereClauses.push({
      or: [
        { title: { $ilike: term } },
        { lyricsSnippet: { $ilike: term } },
      ],
    });
  }

  console.log('[LibraryQueries] Building query with:', {
    whereClauses,
    status: options.status,
    sort: options.sort,
    search: options.search,
  });

  const query = {
    songs: {
      $: {
        where: mergeWhere(whereClauses),
        order: buildOrder(options.sort),
        limit,
        offset,
      } as any,
      variants: {
        $: {
          order: { order: "asc" as const },
        } as any,
      },
      user: {},
      conversation: {},
    },
  } as const;

  // Always call the hook with the same query structure (Rules of Hooks)
  return db.useQuery(query);
}

export function useLibraryConversations(
  userId: string | undefined,
  options: LibraryConversationsOptions
) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  // Build where clauses - only execute query when userId is available
  const whereClauses: Record<string, unknown>[] = [];

  // Only add user filter when userId exists (prevents permission errors on mobile)
  if (userId) {
    whereClauses.push({ "user.id": userId });
  } else {
    // Return empty query when no userId (conditional execution)
    return { data: { conversations: [] }, isLoading: false, error: null };
  }

  if (options.status && options.status !== "all") {
    whereClauses.push({ conversationPhase: options.status });
  }

  if (options.search) {
    const term = `%${options.search.trim()}%`;
    whereClauses.push({
      or: [
        { conceptTitle: { $ilike: term } },
        { conceptLyrics: { $ilike: term } },
      ],
    });
  }

  const query = {
    conversations: {
      $: {
        where: mergeWhere(whereClauses),
        order: buildConversationOrder(options.sort),
        limit,
        offset,
      } as any,
      messages: {
        $: {
          order: { createdAt: "asc" as const },
        } as any,
      },
    },
  } as const;

  // Always call the hook with the same query structure (Rules of Hooks)
  return db.useQuery(query);
}

// Mobile-specific hooks for library data access (API-based with polling)
export function useMobileLibrarySongs(userId: string | undefined, options: LibrarySongsOptions) {
  const [data, setData] = React.useState<{ songs: any[] }>({ songs: [] });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [refreshCount, setRefreshCount] = React.useState(0);

  // Fetch function
  const fetchSongs = React.useCallback(() => {
    console.log('[useMobileLibrarySongs] Fetching songs:', {
      userId,
      status: options.status,
      sort: options.sort,
      search: options.search,
      limit: options.limit,
      offset: options.offset,
    });

    if (!userId) {
      console.log('[useMobileLibrarySongs] No userId - returning empty');
      setData({ songs: [] });
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      search: options.search || '',
      status: options.status || 'all',
      sort: options.sort || 'recent',
      limit: String(options.limit || 24),
      offset: String(options.offset || 0),
    });

    const url = `/api/mobile/library/songs?${params}`;
    console.log('[useMobileLibrarySongs] Fetching from:', url);

    fetch(url)
      .then(res => {
        console.log('[useMobileLibrarySongs] Response status:', res.status);
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(result => {
        console.log('[useMobileLibrarySongs] Response data:', {
          songsCount: result.songs?.length || 0,
          songs: result.songs?.slice(0, 3).map((s: any) => ({
            id: s.id,
            title: s.title,
            status: s.status,
            userId: s.user?.id,
          })),
        });
        setData({ songs: result.songs || [] });
        setError(null);
      })
      .catch(err => {
        console.error('[useMobileLibrarySongs] Error:', err);
        setError(err);
        setData({ songs: [] });
      })
      .finally(() => setIsLoading(false));
  }, [userId, options.search, options.status, options.sort, options.limit, options.offset]);

  // Initial fetch and polling
  React.useEffect(() => {
    fetchSongs();

    // Poll every 5 seconds for updates
    const intervalId = setInterval(() => {
      fetchSongs();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchSongs, refreshCount]);

  return { data, isLoading, error, refresh: () => setRefreshCount(c => c + 1) };
}

export function useMobileLibraryConversations(userId: string | undefined, options: LibraryConversationsOptions) {
  const [data, setData] = React.useState<{ conversations: any[] }>({ conversations: [] });
  const [isLoading, setIsLoading] = React.useState(false);
  const [error, setError] = React.useState<any>(null);
  const [refreshCount, setRefreshCount] = React.useState(0);

  // Fetch function
  const fetchConversations = React.useCallback(() => {
    if (!userId) {
      setData({ conversations: [] });
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    const params = new URLSearchParams({
      search: options.search || '',
      status: options.status || 'all',
      sort: options.sort || 'recent',
      limit: String(options.limit || 20),
      offset: String(options.offset || 0),
    });

    fetch(`/api/mobile/library/conversations?${params}`)
      .then(res => {
        if (!res.ok) {
          throw new Error(`HTTP ${res.status}: ${res.statusText}`);
        }
        return res.json();
      })
      .then(result => {
        setData({ conversations: result.conversations || [] });
        setError(null);
      })
      .catch(err => {
        console.error('[useMobileLibraryConversations] Error:', err);
        setError(err);
        setData({ conversations: [] });
      })
      .finally(() => setIsLoading(false));
  }, [userId, options.search, options.status, options.sort, options.limit, options.offset]);

  // Initial fetch and polling
  React.useEffect(() => {
    fetchConversations();

    // Poll every 5 seconds for updates
    const intervalId = setInterval(() => {
      fetchConversations();
    }, 5000);

    return () => clearInterval(intervalId);
  }, [fetchConversations, refreshCount]);

  return { data, isLoading, error, refresh: () => setRefreshCount(c => c + 1) };
}

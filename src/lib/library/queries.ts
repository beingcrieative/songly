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

  // Build where clauses only if userId exists
  const whereClauses: Record<string, unknown>[] = [];

  if (userId) {
    whereClauses.push({ "user.id": userId });
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

  // Always call the hook (Rules of Hooks)
  // If no userId, query will have no user filter and return empty results
  return db.useQuery(userId ? query : { songs: {} });
}

export function useLibraryConversations(
  userId: string | undefined,
  options: LibraryConversationsOptions
) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  // Build where clauses only if userId exists
  const whereClauses: Record<string, unknown>[] = [];

  if (userId) {
    whereClauses.push({ "user.id": userId });
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
    },
  } as const;

  // Always call the hook (Rules of Hooks)
  // If no userId, query will have no user filter and return empty results
  return db.useQuery(userId ? query : { conversations: {} });
}

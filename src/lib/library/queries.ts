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

  // Build where clauses - include a filter that will never match if no userId
  const whereClauses: Record<string, unknown>[] = [];

  // If userId is undefined, add an impossible condition to return no results
  // This ensures the query structure remains consistent
  if (userId) {
    whereClauses.push({ "user.id": userId });
  } else {
    // Add impossible condition to return no results but keep query structure consistent
    whereClauses.push({ id: "__never_match__" });
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

  // Always call the hook with the same query structure (Rules of Hooks)
  return db.useQuery(query);
}

export function useLibraryConversations(
  userId: string | undefined,
  options: LibraryConversationsOptions
) {
  const limit = options.limit ?? 20;
  const offset = options.offset ?? 0;

  // Build where clauses - include a filter that will never match if no userId
  const whereClauses: Record<string, unknown>[] = [];

  // If userId is undefined, add an impossible condition to return no results
  // This ensures the query structure remains consistent
  if (userId) {
    whereClauses.push({ "user.id": userId });
  } else {
    // Add impossible condition to return no results but keep query structure consistent
    whereClauses.push({ id: "__never_match__" });
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

  // Always call the hook with the same query structure (Rules of Hooks)
  return db.useQuery(query);
}

import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

export async function GET(request: NextRequest) {
  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  // Parse query parameters
  const searchParams = request.nextUrl.searchParams;
  const search = searchParams.get('search') || '';
  const status = searchParams.get('status') || 'all';
  const sort = searchParams.get('sort') || 'recent';
  const limit = parseInt(searchParams.get('limit') || '24', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Build where clause
    const whereClauses: Record<string, any>[] = [
      { "user.id": session.userId }
    ];

    // Status filter
    if (status !== 'all') {
      whereClauses.push({ status });
    }

    // Search filter
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push({
        or: [
          { title: { $ilike: term } },
          { lyricsSnippet: { $ilike: term } },
        ],
      });
    }

    const where = whereClauses.length === 1 
      ? whereClauses[0] 
      : { and: whereClauses };

    // Build order clause
    let order: Record<string, 'asc' | 'desc'>;
    switch (sort) {
      case 'az':
        order = { title: 'asc' };
        break;
      case 'played':
        order = { lastPlayedAt: 'desc' };
        break;
      case 'recent':
      default:
        order = { updatedAt: 'desc' };
        break;
    }

    // For "action" sort, we need all songs to sort client-side
    // For other sorts, we can use limit/offset
    const shouldFetchAll = sort === 'action';
    const queryLimit = shouldFetchAll ? 1000 : limit; // Fetch more for action sort
    const queryOffset = shouldFetchAll ? 0 : offset;

    // Query songs with variants, user, and conversation
    const { songs } = await admin.query({
      songs: {
        $: {
          where,
          order,
          limit: queryLimit,
          offset: queryOffset,
        } as any,
        variants: {
          $: {
            order: { order: 'asc' },
          } as any,
        },
        user: {},
        conversation: {},
      },
    });

    // Log detailed info for debugging
    const songsWithTimestamps = (songs || []).map((s: any) => ({
      id: s.id,
      title: s.title,
      status: s.status,
      updatedAt: s.updatedAt ? new Date(s.updatedAt).toISOString() : null,
      createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : null,
      variantsCount: s.variants?.length || 0,
    }));

    console.log('[Mobile Library Songs] Query result:', {
      userId: session.userId,
      count: songs?.length || 0,
      status,
      sort,
      search,
      limit: queryLimit,
      offset: queryOffset,
      shouldFetchAll,
      firstSong: songsWithTimestamps[0],
      lastSong: songsWithTimestamps[songsWithTimestamps.length - 1],
    });

    return NextResponse.json({ songs: songs || [] });
  } catch (error: any) {
    console.error("[Mobile Library Songs] Query failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch songs" },
      { status: 500 }
    );
  }
}


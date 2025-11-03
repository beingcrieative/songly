import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

export async function GET(req: NextRequest) {
  const session = parseSessionFromRequest(req);
  if (!session?.userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || undefined;
  const status = searchParams.get("status") || "all";
  const sort = searchParams.get("sort") || "recent";
  const limit = Number(searchParams.get("limit")) || 24;
  const offset = Number(searchParams.get("offset")) || 0;

  // Build where clauses
  const whereClauses: any[] = [{ "user.id": session.userId }];
  
  if (status !== "all") {
    whereClauses.push({ status });
  }
  
  if (search) {
    const term = `%${search.trim()}%`;
    whereClauses.push({
      or: [
        { title: { $ilike: term } },
        { lyricsSnippet: { $ilike: term } },
      ],
    });
  }

  // Build order map
  const orderMap: Record<string, any> = {
    az: { title: "asc" },
    played: { lastPlayedAt: "desc" },
    recent: { updatedAt: "desc" },
    action: { updatedAt: "desc" }, // Action sort is handled client-side with priority sorting
  };

  const order = orderMap[sort] || orderMap.recent;

  const query = {
    songs: {
      $: {
        where: whereClauses.length > 1 ? { and: whereClauses } : whereClauses[0],
        order,
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
  };

  try {
    console.log('[mobile/library/songs] Querying songs:', {
      userId: session.userId,
      status,
      sort,
      search,
      limit,
      offset,
      whereClauses,
      queryWhere: query.songs.$?.where,
    });

    // First, verify that songs exist for this user (without status filter)
    const verifyQuery = {
      songs: {
        $: {
          where: { "user.id": session.userId },
          limit: 100,
        } as any,
        user: {},
      },
    };
    
    const verifyResult = await admin.query(verifyQuery);
    console.log('[mobile/library/songs] VERIFICATION - All songs for user:', {
      totalSongsForUser: verifyResult.songs?.length || 0,
      songs: verifyResult.songs?.slice(0, 10).map((s: any) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        userId: s.user?.id,
        userLinkCorrect: s.user?.id === session.userId,
        createdAt: s.createdAt ? new Date(s.createdAt).toISOString() : 'unknown',
      })),
    });

    const result = await admin.query(query);
    
    console.log('[mobile/library/songs] Query result:', {
      songsCount: result.songs?.length || 0,
      songs: result.songs?.slice(0, 5).map((s: any) => ({
        id: s.id,
        title: s.title,
        status: s.status,
        userId: s.user?.id,
        conversationId: s.conversation?.id,
      })),
    });

    // If query returns 0 but verification shows songs exist, there's a filter issue
    if (result.songs?.length === 0 && verifyResult.songs?.length > 0) {
      console.warn('[mobile/library/songs] ⚠️ WARNING: Filter returns 0 songs but user has songs!');
      console.warn('   This suggests the status filter or search is too restrictive.');
      console.warn('   User has songs with statuses:', [...new Set(verifyResult.songs.map((s: any) => s.status || 'null'))]);
    }

    return NextResponse.json({ songs: result.songs || [] });
  } catch (error: any) {
    console.error("[mobile/library/songs] Query failed:", error);
    console.error("   Query:", JSON.stringify(query, null, 2));
    console.error("   Error message:", error?.message);
    console.error("   Error code:", error?.code);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch songs" },
      { status: 500 }
    );
  }
}


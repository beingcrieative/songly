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
  const limit = parseInt(searchParams.get('limit') || '20', 10);
  const offset = parseInt(searchParams.get('offset') || '0', 10);

  try {
    // Build where clause
    const whereClauses: Record<string, any>[] = [
      { "user.id": session.userId }
    ];

    // Status filter (conversationPhase)
    if (status !== 'all') {
      whereClauses.push({ conversationPhase: status });
    }

    // Search filter
    if (search.trim()) {
      const term = `%${search.trim()}%`;
      whereClauses.push({
        or: [
          { conceptTitle: { $ilike: term } },
          { conceptLyrics: { $ilike: term } },
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
        order = { conceptTitle: 'asc' };
        break;
      case 'recent':
      default:
        // Use createdAt instead of updatedAt as a workaround for InstantDB schema caching
        order = { createdAt: 'desc' };
        break;
    }

    console.log('[Mobile Library Conversations] Querying with:', {
      userId: session.userId,
      where,
      order,
      limit,
      offset,
    });

    // Query conversations with messages
    const { conversations } = await admin.query({
      conversations: {
        $: {
          where,
          order,
          limit,
          offset,
        } as any,
        messages: {
          $: {
            order: { createdAt: 'asc' },
          } as any,
        },
      },
    });

    console.log('[Mobile Library Conversations] Query result:', {
      userId: session.userId,
      count: conversations?.length || 0,
      status,
      sort,
      search,
      firstConversation: conversations?.[0] ? {
        id: conversations[0].id,
        conceptTitle: conversations[0].conceptTitle,
        conversationPhase: conversations[0].conversationPhase,
      } : null,
    });

    return NextResponse.json({ conversations: conversations || [] });
  } catch (error: any) {
    console.error("[Mobile Library Conversations] Query failed:", {
      error: error.message,
      status: error.status,
      body: error.body,
      stack: error.stack,
    });
    return NextResponse.json(
      { error: error?.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}


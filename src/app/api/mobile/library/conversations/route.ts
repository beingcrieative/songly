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
  const limit = Number(searchParams.get("limit")) || 20;
  const offset = Number(searchParams.get("offset")) || 0;

  // Build where clauses
  const whereClauses: any[] = [{ "user.id": session.userId }];
  
  if (status !== "all") {
    whereClauses.push({ conversationPhase: status });
  }
  
  if (search) {
    const term = `%${search.trim()}%`;
    whereClauses.push({
      or: [
        { conceptTitle: { $ilike: term } },
        { conceptLyrics: { $ilike: term } },
      ],
    });
  }

  // Build order map
  const orderMap: Record<string, any> = {
    az: { conceptTitle: "asc" },
    recent: { updatedAt: "desc" },
  };

  const order = orderMap[sort] || orderMap.recent;

  const query = {
    conversations: {
      $: {
        where: whereClauses.length > 1 ? { and: whereClauses } : whereClauses[0],
        order,
        limit,
        offset,
      } as any,
      messages: {
        $: {
          order: { createdAt: "asc" as const },
        } as any,
      },
    },
  };

  try {
    const result = await admin.query(query);
    return NextResponse.json({ conversations: result.conversations || [] });
  } catch (error: any) {
    console.error("[mobile/library/conversations] Query failed:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch conversations" },
      { status: 500 }
    );
  }
}


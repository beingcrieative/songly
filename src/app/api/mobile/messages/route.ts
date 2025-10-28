import { NextRequest, NextResponse } from "next/server";
import { id as createId } from "@instantdb/admin";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

/**
 * GET /api/mobile/messages
 * Fetch messages for a conversation with pagination support
 * Query params:
 * - conversationId: string (required)
 * - limit: number (optional, default 50)
 * - offset: number (optional, default 0)
 */
export async function GET(request: NextRequest) {
  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const conversationId = searchParams.get("conversationId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100); // Max 100 per request
  const offset = Math.max(parseInt(searchParams.get("offset") || "0"), 0);

  if (!conversationId) {
    return NextResponse.json({ error: "conversationId is required" }, { status: 400 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  try {
    // Verify the conversation belongs to the user
    const { conversations } = await admin.query({
      conversations: {
        $: {
          where: {
            id: conversationId,
            "user.id": session.userId,
          },
        } as any,
      },
    });

    if (!conversations || conversations.length === 0) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    // Fetch messages for this conversation
    // Note: InstantDB Admin SDK doesn't support offset/limit directly,
    // so we fetch all and slice in memory (acceptable for typical conversation sizes)
    const { messages } = await admin.query({
      messages: {
        $: {
          where: {
            "conversation.id": conversationId,
          },
        } as any,
      },
    });

    if (!messages) {
      return NextResponse.json({ messages: [], total: 0 });
    }

    // Sort by createdAt ascending (oldest first)
    const sortedMessages = messages.sort((a: any, b: any) => {
      const aTime = a.createdAt || 0;
      const bTime = b.createdAt || 0;
      return aTime - bTime;
    });

    // Apply pagination
    const total = sortedMessages.length;
    const paginatedMessages = sortedMessages.slice(offset, offset + limit);

    return NextResponse.json({
      messages: paginatedMessages,
      total,
      limit,
      offset,
      hasMore: offset + limit < total,
    });
  } catch (error: any) {
    console.error("Failed to fetch messages", error);
    return NextResponse.json(
      { error: error?.message || "Failed to fetch messages" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  const conversationId = typeof body.conversationId === "string" ? body.conversationId : null;
  const role = body.role === "assistant" || body.role === "user" ? body.role : null;
  const content = typeof body.content === "string" ? body.content : null;
  const composerContext =
    typeof body.composerContext === "string" ? body.composerContext : undefined;

  if (!conversationId || !role || !content) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  // Ensure the conversation belongs to the active user
  const { conversations } = await admin.query({
    conversations: {
      $: {
        where: {
          id: conversationId,
          "user.id": session.userId,
        },
      } as any,
    },
  });

  if (!conversations || conversations.length === 0) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  const messageId = createId();
  const updateData: Record<string, unknown> = {
    role,
    content,
    createdAt: Date.now(),
  };
  if (composerContext !== undefined) {
    updateData.composerContext = composerContext;
  }

  try {
    await admin.transact([
      admin.tx.messages[messageId]
        .update(updateData)
        .link({ conversation: conversationId }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to create message", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create message" },
      { status: 500 }
    );
  }
}

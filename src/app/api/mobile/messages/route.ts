import { NextRequest, NextResponse } from "next/server";
import { id as createId } from "@instantdb/admin";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

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

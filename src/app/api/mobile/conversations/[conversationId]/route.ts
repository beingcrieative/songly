import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";
import { serializeConversation, type RawConversation } from "../utils";

async function fetchConversation(
  admin: NonNullable<ReturnType<typeof getAdminDb>>,
  conversationId: string,
  userId: string
): Promise<RawConversation | null> {
  const { conversations } = await admin.query({
    conversations: {
      $: {
        where: {
          id: conversationId,
          "user.id": userId,
        },
      } as any,
    },
  });

  return conversations?.[0] ?? null;
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const resolvedParams = await context.params;
  const conversationId = resolvedParams?.conversationId;
  if (!conversationId) {
    return NextResponse.json({ error: "Conversation ID is required" }, { status: 400 });
  }

  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  const existing = await fetchConversation(admin, conversationId, session.userId);
  if (!existing) {
    return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  const updateData: Record<string, unknown> = { updatedAt: Date.now() };

  if (typeof body.conversationPhase === "string") {
    updateData.conversationPhase = body.conversationPhase;
  }
  if (typeof body.roundNumber === "number" && Number.isFinite(body.roundNumber)) {
    updateData.roundNumber = body.roundNumber;
  }
  if (
    typeof body.readinessScore === "number" &&
    Number.isFinite(body.readinessScore)
  ) {
    updateData.readinessScore = body.readinessScore;
  }
  if (body.extractedContext) {
    updateData.extractedContext = JSON.stringify(body.extractedContext);
  }
  if (body.songSettings) {
    updateData.songSettings = JSON.stringify(body.songSettings);
  }
  if (typeof body.selectedTemplateId === "string") {
    updateData.selectedTemplateId = body.selectedTemplateId;
  }
  if (body.templateConfig) {
    updateData.templateConfig = JSON.stringify(body.templateConfig);
  }
  if (typeof body.lyricsTaskId === "string" || body.lyricsTaskId === null) {
    updateData.lyricsTaskId = body.lyricsTaskId;
  }
  if (typeof body.conceptTitle === "string" || body.conceptTitle === null) {
    updateData.conceptTitle = body.conceptTitle;
  }
  if (body.conceptLyrics !== undefined) {
    updateData.conceptLyrics = body.conceptLyrics ? JSON.stringify(body.conceptLyrics) : null;
  }
  if (body.conceptHistory !== undefined) {
    updateData.conceptHistory = body.conceptHistory
      ? JSON.stringify(body.conceptHistory)
      : null;
  }

  try {
    if (Object.keys(updateData).length > 0) {
      await admin.transact([
        admin.tx.conversations[conversationId].update(updateData),
      ]);
    }

    const merged: RawConversation = {
      ...existing,
      ...updateData,
    };

    return NextResponse.json(serializeConversation(merged));
  } catch (error: any) {
    console.error("Failed to update conversation", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update conversation" },
      { status: 500 }
    );
  }
}

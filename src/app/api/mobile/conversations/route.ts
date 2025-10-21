import { NextRequest, NextResponse } from "next/server";
import { id as createId } from "@instantdb/admin";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";
import { serializeConversation, type RawConversation } from "./utils";

export async function GET(request: NextRequest) {
  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  try {
    const { conversations } = await admin.query({
      conversations: {
        $: {
          where: {
            "user.id": session.userId,
          },
          order: { createdAt: "desc" },
        } as any,
      },
    });

    const conversation = conversations?.[0];
    if (!conversation) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    return NextResponse.json(serializeConversation(conversation));
  } catch (error: any) {
    console.error("Failed to load conversation", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load conversation" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const session = parseSessionFromRequest(request);
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  let body: Partial<RawConversation> = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  const now = Date.now();
  const conversationId = createId();

  const updateData: Record<string, unknown> = {
    createdAt: now,
    updatedAt: now,
    status: typeof body.status === "string" ? body.status : "active",
    conversationPhase:
      typeof body.conversationPhase === "string" ? body.conversationPhase : "gathering",
    roundNumber:
      typeof body.roundNumber === "number" && Number.isFinite(body.roundNumber)
        ? body.roundNumber
        : 0,
    readinessScore:
      typeof body.readinessScore === "number" && Number.isFinite(body.readinessScore)
        ? body.readinessScore
        : 0,
  };

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
  if (typeof body.lyricsTaskId === "string") {
    updateData.lyricsTaskId = body.lyricsTaskId;
  }
  if (typeof body.conceptTitle === "string") {
    updateData.conceptTitle = body.conceptTitle;
  }
  if (body.conceptLyrics) {
    updateData.conceptLyrics = JSON.stringify(body.conceptLyrics);
  }
  if (body.conceptHistory) {
    updateData.conceptHistory = JSON.stringify(body.conceptHistory);
  }

  try {
    await admin.transact([
      admin.tx.conversations[conversationId]
        .update(updateData)
        .link({ user: session.userId }),
    ]);

    return NextResponse.json(
      serializeConversation({
        id: conversationId,
        ...updateData,
      } as RawConversation)
    );
  } catch (error: any) {
    console.error("Failed to create conversation", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create conversation" },
      { status: 500 }
    );
  }
}

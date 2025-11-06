import { NextRequest, NextResponse } from "next/server";
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

  const songId = typeof body.songId === "string" ? body.songId : null;
  const conversationId =
    typeof body.conversationId === "string" ? body.conversationId : null;
  const title = typeof body.title === "string" ? body.title : null;
  const lyrics = typeof body.lyrics === "string" ? body.lyrics : "";
  const musicStyle = typeof body.musicStyle === "string" ? body.musicStyle : "";
  const lyricsSnippet =
    typeof body.lyricsSnippet === "string" ? body.lyricsSnippet : "";
  const generationParams =
    typeof body.generationParams === "object" && body.generationParams !== null
      ? body.generationParams
      : null;
  const templateId =
    typeof body.templateId === "string" ? body.templateId : undefined;
  const status = typeof body.status === "string" ? body.status : "generating";
  const prompt = typeof body.prompt === "string" ? body.prompt : undefined;
  const taskId = typeof body.taskId === "string" ? body.taskId : undefined;

  if (!songId || !conversationId || !title) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  // Ensure conversation belongs to user
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

  const now = Date.now();

  const updateData: Record<string, unknown> = {
    title,
    lyrics,
    musicStyle,
    status,
    createdAt: now,
    updatedAt: now,
    lyricsSnippet,
    selectedVariantId: null,
    isPublic: false,
  };

  if (generationParams) {
    updateData.generationParams = JSON.stringify(generationParams);
  }
  if (templateId) {
    updateData.templateId = templateId;
  }
  if (prompt) {
    updateData.prompt = prompt;
  }
  if (taskId) {
    updateData.sunoTaskId = taskId;
  }

  try {
    await admin.transact([
      admin.tx.songs[songId]
        .update(updateData)
        .link({ conversation: conversationId, user: session.userId }),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to create song", error);
    return NextResponse.json(
      { error: error?.message || "Failed to create song" },
      { status: 500 }
    );
  }
}

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
  // Lyrics is now optional for async generation flows where lyrics come later via webhook
  const lyrics = typeof body.lyrics === "string" ? body.lyrics : (typeof body.lyrics === "undefined" ? "" : "");
  const musicStyle = typeof body.musicStyle === "string" ? body.musicStyle : "";
  const lyricsSnippet =
    typeof body.lyricsSnippet === "string" ? body.lyricsSnippet : "";
  const generationParams =
    typeof body.generationParams === "object" && body.generationParams !== null
      ? body.generationParams
      : null;
  const templateId =
    typeof body.templateId === "string" ? body.templateId : undefined;
  const prompt = typeof body.prompt === "string" ? body.prompt : undefined;

  // For async generation flows (lyrics come later via webhook), lyrics and generationParams may be optional
  // But we still need songId, conversationId, and title
  if (!songId || !conversationId || !title) {
    return NextResponse.json({ error: "Invalid payload: songId, conversationId, and title are required" }, { status: 400 });
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
    // Lyrics may be empty for async generation flows where lyrics come later via webhook
    lyrics: lyrics || "",
    musicStyle: musicStyle || "",
    status: "generating_lyrics", // Set initial status for async generation
    createdAt: now,
    updatedAt: now,
    lyricsSnippet: lyricsSnippet || "",
    selectedVariantId: null,
    isPublic: false,
  };

  // GenerationParams may be optional for async flows
  if (generationParams) {
    updateData.generationParams = JSON.stringify(generationParams);
  }

  // Prompt is used for async generation flows
  if (prompt) {
    updateData.prompt = prompt;
  }

  if (templateId) {
    updateData.templateId = templateId;
  }

  try {
    await admin.transact([
      admin.tx.songs[songId]
        .update(updateData)
        .link({ conversation: conversationId, user: session.userId }),
    ]);

    console.log('✅ Song created successfully:', {
      songId,
      userId: session.userId,
      conversationId,
      status: updateData.status,
      title: updateData.title,
    });

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("❌ Failed to create song:", error);
    console.error("   Song ID:", songId);
    console.error("   User ID:", session.userId);
    console.error("   Conversation ID:", conversationId);
    console.error("   Error message:", error?.message);
    console.error("   Error code:", error?.code);
    
    return NextResponse.json(
      { error: error?.message || "Failed to create song" },
      { status: 500 }
    );
  }
}

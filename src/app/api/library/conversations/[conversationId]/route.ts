import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ conversationId: string }> }
) {
  const { conversationId } = await context.params;

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

  try {
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

    if (!conversations?.length) {
      return NextResponse.json({ error: "Conversation not found" }, { status: 404 });
    }

    const { lyric_versions } = await admin.query({
      lyric_versions: {
        $: {
          where: {
            "conversation.id": conversationId,
          },
        } as any,
      },
    });

    const lyricDeletes = (lyric_versions || []).map((entry: any) =>
      admin.tx.lyric_versions[entry.id].delete()
    );

    await admin.transact([
      ...lyricDeletes,
      admin.tx.conversations[conversationId].delete(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to delete conversation", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete conversation" },
      { status: 500 }
    );
  }
}


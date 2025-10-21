import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ songId: string }> }
) {
  const { songId } = await context.params;

  if (!songId) {
    return NextResponse.json({ error: "Song ID is required" }, { status: 400 });
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
    const { songs } = await admin.query({
      songs: {
        $: {
          where: {
            id: songId,
            "user.id": session.userId,
          },
          limit: 1,
        },
        variants: {},
      },
    });

    const song = songs?.[0];
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    const variantDeletes = (song.variants || []).map((variant: any) =>
      admin.tx.sunoVariants[variant.trackId].delete()
    );

    await admin.transact([
      ...variantDeletes,
      admin.tx.songs[songId].delete(),
    ]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to delete song", error);
    return NextResponse.json(
      { error: error?.message || "Failed to delete song" },
      { status: 500 }
    );
  }
}


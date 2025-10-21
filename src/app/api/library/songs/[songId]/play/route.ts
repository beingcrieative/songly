import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

export async function POST(
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
    await admin.transact([
      admin.tx.songs[songId].update({
        lastPlayedAt: Date.now(),
        updatedAt: Date.now(),
      }),
    ]);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to update play timestamp", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update play timestamp" },
      { status: 500 }
    );
  }
}


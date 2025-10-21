import { NextRequest, NextResponse } from "next/server";
import { id as createId } from "@instantdb/admin";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

async function loadSong(
  songId: string,
  userId: string,
  admin: NonNullable<ReturnType<typeof getAdminDb>>
) {
  const { songs } = await admin.query({
    songs: {
      $: {
        where: {
          id: songId,
          "user.id": userId,
        },
      } as any,
      variants: {},
    },
  });

  return songs?.[0];
}

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

  let body: { action?: string } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  const song = await loadSong(songId, session.userId, admin);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const now = Date.now();

  if (body.action === "disable") {
    await admin.transact([
      admin.tx.songs[songId].update({
        isPublic: false,
        publicId: null,
        updatedAt: now,
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  const publicId = song.publicId || createId();
  await admin.transact([
    admin.tx.songs[songId].update({
      isPublic: true,
      publicId,
      updatedAt: now,
    }),
  ]);

  return NextResponse.json({ ok: true, publicId });
}

export async function PATCH(
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

  let body: { selectedVariantId?: string } = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  if (!body.selectedVariantId) {
    return NextResponse.json({ error: "selectedVariantId is required" }, { status: 400 });
  }

  const song = await loadSong(songId, session.userId, admin);
  if (!song) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  const variantExists = (song.variants || []).some(
    (variant: any) => variant.trackId === body.selectedVariantId
  );

  if (!variantExists) {
    return NextResponse.json({ error: "Variant not found" }, { status: 400 });
  }

  await admin.transact([
    admin.tx.songs[songId].update({
      selectedVariantId: body.selectedVariantId,
      updatedAt: Date.now(),
    }),
  ]);

  return NextResponse.json({ ok: true });
}


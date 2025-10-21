import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";
import { parseSessionFromRequest } from "@/lib/session";

type VariantInput = {
  trackId: string;
  title?: string;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  sourceAudioUrl?: string | null;
  sourceStreamAudioUrl?: string | null;
  imageUrl?: string | null;
  durationSeconds?: number | null;
  modelName?: string | null;
  prompt?: string | null;
  tags?: string | null;
  order?: number | null;
  streamAvailableAt?: number | null;
  downloadAvailableAt?: number | null;
};

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ songId: string }> }
) {
  const resolvedParams = await context.params;
  const songId = resolvedParams?.songId;
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

  // Ensure the song belongs to the active user
  const { songs } = await admin.query({
    songs: {
      $: {
        where: {
          id: songId,
          "user.id": session.userId,
        },
      } as any,
    },
  });

  if (!songs || songs.length === 0) {
    return NextResponse.json({ error: "Song not found" }, { status: 404 });
  }

  let body: Record<string, unknown> = {};
  try {
    body = (await request.json()) ?? {};
  } catch {
    body = {};
  }

  const transactions: any[] = [];
  const updateData: Record<string, unknown> = { updatedAt: Date.now() };

  if (typeof body.status === "string") {
    updateData.status = body.status;
  }
  if (typeof body.errorMessage === "string" || body.errorMessage === null) {
    updateData.errorMessage = body.errorMessage;
  }
  if (typeof body.sunoTaskId === "string" || body.sunoTaskId === null) {
    updateData.sunoTaskId = body.sunoTaskId;
  }
  if (typeof body.lyrics === "string") {
    updateData.lyrics = body.lyrics;
  }
  if (typeof body.lyricsSnippet === "string" || body.lyricsSnippet === null) {
    updateData.lyricsSnippet = body.lyricsSnippet;
  }
  if (typeof body.selectedVariantId === "string" || body.selectedVariantId === null) {
    updateData.selectedVariantId = body.selectedVariantId;
  }
  if (typeof body.lastPlayedAt === "number" || body.lastPlayedAt === null) {
    updateData.lastPlayedAt = body.lastPlayedAt;
  }

  if (Object.keys(updateData).length > 0) {
    transactions.push(admin.tx.songs[songId].update(updateData));
  }

  if (Array.isArray(body.variants)) {
    const now = Date.now();
    for (const variantRaw of body.variants as VariantInput[]) {
      if (!variantRaw || typeof variantRaw.trackId !== "string") continue;

      const variantData: Record<string, unknown> = {
        songId,
        trackId: variantRaw.trackId,
      };

      if (typeof variantRaw.title === "string") {
        variantData.title = variantRaw.title;
      }
      if ("streamAudioUrl" in variantRaw) {
        variantData.streamAudioUrl = variantRaw.streamAudioUrl ?? null;
      }
      if ("audioUrl" in variantRaw) {
        variantData.audioUrl = variantRaw.audioUrl ?? null;
      }
      if ("sourceAudioUrl" in variantRaw) {
        variantData.sourceAudioUrl = variantRaw.sourceAudioUrl ?? null;
      }
      if ("sourceStreamAudioUrl" in variantRaw) {
        variantData.sourceStreamAudioUrl = variantRaw.sourceStreamAudioUrl ?? null;
      }
      if ("imageUrl" in variantRaw) {
        variantData.imageUrl = variantRaw.imageUrl ?? null;
      }
      if ("durationSeconds" in variantRaw) {
        variantData.durationSeconds = variantRaw.durationSeconds ?? null;
      }
      if ("modelName" in variantRaw) {
        variantData.modelName = variantRaw.modelName ?? null;
      }
      if ("prompt" in variantRaw) {
        variantData.prompt = variantRaw.prompt ?? null;
      }
      if ("tags" in variantRaw) {
        variantData.tags = variantRaw.tags ?? null;
      }
      if (typeof variantRaw.order === "number" && Number.isFinite(variantRaw.order)) {
        variantData.order = variantRaw.order;
      }
      if ("streamAvailableAt" in variantRaw) {
        variantData.streamAvailableAt =
          typeof variantRaw.streamAvailableAt === "number" ||
          variantRaw.streamAvailableAt === null
            ? (variantRaw.streamAvailableAt as number | null)
            : null;
      }
      if ("downloadAvailableAt" in variantRaw) {
        variantData.downloadAvailableAt =
          typeof variantRaw.downloadAvailableAt === "number" ||
          variantRaw.downloadAvailableAt === null
            ? (variantRaw.downloadAvailableAt as number | null)
            : null;
      }

      variantData.createdAt = now;

      transactions.push(
        admin.tx.sunoVariants[variantRaw.trackId].update(variantData).link({ song: songId })
      );
    }
  }

  if (transactions.length === 0) {
    return NextResponse.json({ ok: true });
  }

  try {
    await admin.transact(transactions);
    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to update song", error);
    return NextResponse.json(
      { error: error?.message || "Failed to update song" },
      { status: 500 }
    );
  }
}

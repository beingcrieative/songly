import { NextRequest, NextResponse } from "next/server";
import { id } from "@instantdb/core";
import { getAdminDb } from "@/lib/adminDb";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const ADMIN_TOKEN = process.env.INSTANT_APP_ADMIN_TOKEN;
const ADMIN_SECRET = process.env.BACKFILL_SECRET || ADMIN_TOKEN;

if (!APP_ID) {
  throw new Error("NEXT_PUBLIC_INSTANT_APP_ID is required for backfill endpoint");
}

type SongRecord = {
  id: string;
  title?: string;
  status?: string;
  callbackData?: string | null;
  variants?: any[];
  sunoTaskId?: string | null;
  audioUrl?: string | null;
  streamAudioUrl?: string | null;
  sourceAudioUrl?: string | null;
  sourceStreamAudioUrl?: string | null;
  imageUrl?: string | null;
  durationSeconds?: number | null;
  modelName?: string | null;
  prompt?: string | null;
};

type IncomingTrack = {
  id?: string;
  trackId?: string;
  track_id?: string;
  title?: string;
  audio_url?: string;
  audioUrl?: string;
  stream_audio_url?: string;
  streamAudioUrl?: string;
  source_audio_url?: string;
  sourceAudioUrl?: string;
  source_stream_audio_url?: string;
  sourceStreamAudioUrl?: string;
  image_url?: string;
  imageUrl?: string;
  duration?: number;
  durationSeconds?: number;
  model_name?: string;
  modelName?: string;
  prompt?: string;
  tags?: string;
  createTime?: number;
};

function normalizeTrack(track: IncomingTrack, index: number) {
  const trackId = String(track.trackId || track.track_id || track.id || id());
  const durationValue =
    typeof track.durationSeconds === "number"
      ? track.durationSeconds
      : typeof track.duration === "number"
      ? track.duration
      : null;

  return {
    trackId,
    title: track.title || null,
    audioUrl: track.audioUrl || track.audio_url || null,
    streamAudioUrl: track.streamAudioUrl || track.stream_audio_url || null,
    sourceAudioUrl: track.sourceAudioUrl || track.source_audio_url || null,
    sourceStreamAudioUrl:
      track.sourceStreamAudioUrl || track.source_stream_audio_url || null,
    imageUrl: track.imageUrl || track.image_url || null,
    durationSeconds: durationValue,
    modelName: track.modelName || track.model_name || null,
    prompt: track.prompt || null,
    tags: track.tags || null,
    createdAt: track.createTime || Date.now(),
    order: index,
  };
}

async function fetchSongs(limit = 2000): Promise<SongRecord[]> {
  const adminDb = getAdminDb();
  if (!adminDb) return [];

  const { songs } = await adminDb.query({
    songs: {
      $: {
        limit,
        order: { createdAt: "desc" },
      },
      variants: {
        $: {
          order: { order: "asc" },
        },
      },
    },
  });

  return (songs || []) as SongRecord[];
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token =
      request.headers.get("x-admin-token") || searchParams.get("token") || "";

    if (ADMIN_SECRET && token !== ADMIN_SECRET) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const adminDb = getAdminDb();

    if (!ADMIN_TOKEN || !adminDb) {
      return NextResponse.json(
        { error: "INSTANT_APP_ADMIN_TOKEN is required" },
        { status: 500 },
      );
    }

    const songs = await fetchSongs();
    let songsProcessed = 0;
    let variantsCreated = 0;
    let songsUpdated = 0;

    for (const song of songs) {
      const hasVariants = Array.isArray(song.variants) && song.variants.length > 0;
      const hasCallback = Boolean(song.callbackData);

      if (!hasCallback) {
        continue;
      }

      let tracks: ReturnType<typeof normalizeTrack>[] = [];
      try {
        const parsed = JSON.parse(song.callbackData!);
        const rawArray = Array.isArray(parsed)
          ? parsed
          : parsed && Array.isArray(parsed.data)
          ? parsed.data
          : [];
        tracks = rawArray.map((track: IncomingTrack, index: number) =>
          normalizeTrack(track, index),
        );
      } catch (error) {
        console.warn("Kon callbackData niet parsen voor song", song.id, error);
        continue;
      }

      if (!tracks.length) {
        continue;
      }

      const existingVariantIds = new Set(
        (song.variants || []).map((variant: any) => variant.trackId || variant.id),
      );

      const variantTx = tracks
        .filter((track) => !existingVariantIds.has(track.trackId))
        .map((track) =>
          adminDb.tx.sunoVariants[track.trackId]
            .update({
              songId: song.id,
              trackId: track.trackId,
              title: track.title,
              audioUrl: track.audioUrl,
              streamAudioUrl: track.streamAudioUrl,
              sourceAudioUrl: track.sourceAudioUrl,
              sourceStreamAudioUrl: track.sourceStreamAudioUrl,
              imageUrl: track.imageUrl,
              durationSeconds: track.durationSeconds,
              modelName: track.modelName,
              prompt: track.prompt,
              tags: track.tags,
              createdAt: track.createdAt,
              order: track.order,
            })
            .link({ song: song.id }),
        );

      const primaryTrack = tracks[0];

      const songUpdate = adminDb.tx.songs[song.id].update({
        audioUrl: primaryTrack.audioUrl ?? song.audioUrl ?? null,
        streamAudioUrl:
          primaryTrack.streamAudioUrl ?? song.streamAudioUrl ?? null,
        sourceAudioUrl:
          primaryTrack.sourceAudioUrl ?? song.sourceAudioUrl ?? null,
        sourceStreamAudioUrl:
          primaryTrack.sourceStreamAudioUrl ?? song.sourceStreamAudioUrl ?? null,
        imageUrl: primaryTrack.imageUrl ?? song.imageUrl ?? null,
        durationSeconds:
          primaryTrack.durationSeconds ?? song.durationSeconds ?? null,
        modelName: primaryTrack.modelName ?? song.modelName ?? null,
        prompt: primaryTrack.prompt ?? song.prompt ?? null,
        callbackData: JSON.stringify(tracks),
        status: 'ready',
        errorMessage: null,
      });

      if (variantTx.length) {
        variantsCreated += variantTx.length;
        await adminDb.transact([...variantTx, songUpdate]);
        songsUpdated += 1;
      } else if (
        !song.audioUrl &&
        (primaryTrack.audioUrl || primaryTrack.streamAudioUrl)
      ) {
        await adminDb.transact([songUpdate]);
        songsUpdated += 1;
      }

      songsProcessed += 1;
    }

    return NextResponse.json({
      ok: true,
      songsProcessed,
      songsUpdated,
      variantsCreated,
      totalSongs: songs.length,
    });
  } catch (error: any) {
    console.error("Backfill failed", error);
    return NextResponse.json(
      { error: error.message || "Backfill failed" },
      { status: 500 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

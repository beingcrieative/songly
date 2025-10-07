import { NextRequest, NextResponse } from "next/server";
import { validate as isUuid, v5 as uuidv5 } from "uuid";
import { getAdminDb, getAdminEnvSnapshot } from "@/lib/adminDb";

const APP_ID = process.env.NEXT_PUBLIC_INSTANT_APP_ID;
const VARIANT_NAMESPACE = uuidv5.URL;

if (!APP_ID) {
  throw new Error("NEXT_PUBLIC_INSTANT_APP_ID is required for Suno callback handling");
}

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

function normalizeTrack(track: IncomingTrack, index: number, songId: string) {
  const rawIdCandidate = track.trackId || track.track_id || track.id;
  const rawIdString = rawIdCandidate ? String(rawIdCandidate) : null;
  const deterministicSeed = `${songId}:${rawIdString ?? ""}:${index}`;
  const trackId =
    rawIdString && isUuid(rawIdString) ? rawIdString : uuidv5(deterministicSeed, VARIANT_NAMESPACE);
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

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const songIdFromUrl = searchParams.get("songId");
    const payload = await request.json();
    console.log("=== SUNO CALLBACK RECEIVED ===");
    console.log(JSON.stringify(payload, null, 2));

    const taskId = payload?.data?.task_id || payload?.data?.taskId;
    const callbackType = payload?.data?.callbackType;
    const tracksRaw = Array.isArray(payload?.data?.data) ? payload.data.data : [];
    const adminDb = getAdminDb();

    if (!adminDb) {
      console.error("Suno callback: admin client niet beschikbaar", getAdminEnvSnapshot());
      return NextResponse.json(
        { ok: false, warning: "admin token not configured" },
        { status: 200 },
      );
    }

    let targetSongId = songIdFromUrl;

    if (!targetSongId && taskId) {
      const { songs } = await adminDb.query({
        songs: {
          $: { where: { sunoTaskId: taskId } },
        },
      });
      targetSongId = songs?.[0]?.id ?? null;
    }

    if (!targetSongId) {
      console.warn("Suno callback zonder gekoppelde song", { taskId, payload });
      return NextResponse.json({ ok: false, warning: "song not found" });
    }

    const normalizedTracks = tracksRaw.map((track: IncomingTrack, index: number) =>
      normalizeTrack(track, index, targetSongId),
    );

    const shouldProcessAudio =
      callbackType === 'complete' ||
      callbackType === 'first' ||
      normalizedTracks.some((track: any) => track.streamAudioUrl || track.audioUrl);

    if (!shouldProcessAudio) {
      return NextResponse.json({ ok: true, info: "no audio payload yet" });
    }

    if (!normalizedTracks.length) {
      return NextResponse.json({ ok: true, info: "no tracks" });
    }

    const variantTx = normalizedTracks.map((track: any) =>
      adminDb.tx.sunoVariants[track.trackId]
        .update({
          songId: targetSongId,
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
        .link({ song: targetSongId }),
    );

    const primaryTrack = normalizedTracks[0] || null;

    const songUpdate = adminDb.tx.songs[targetSongId].update({
      status: callbackType === 'complete' ? 'ready' : 'generating',
      audioUrl: primaryTrack?.audioUrl ?? null,
      streamAudioUrl: primaryTrack?.streamAudioUrl ?? null,
      sourceAudioUrl: primaryTrack?.sourceAudioUrl ?? null,
      sourceStreamAudioUrl: primaryTrack?.sourceStreamAudioUrl ?? null,
      videoUrl: null,
      imageUrl: primaryTrack?.imageUrl ?? null,
      durationSeconds: primaryTrack?.durationSeconds ?? null,
      modelName: primaryTrack?.modelName ?? null,
      prompt: primaryTrack?.prompt ?? null,
      callbackData: normalizedTracks.length ? JSON.stringify(normalizedTracks) : null,
      errorMessage: null,
      sunoTaskId: taskId || null,
    });

    await adminDb.transact([...variantTx, songUpdate]);

    return NextResponse.json({ ok: true });
  } catch (error: any) {
    console.error("Failed to process Suno callback", error);
    if (error?.body) {
      console.error("Instant response body", JSON.stringify(error.body));
    }
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Callback processing failed",
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  return NextResponse.json({ ok: true });
}

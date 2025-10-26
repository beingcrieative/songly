/**
 * Suno Music Generation Callback Handler (PRD-0014: Task 2.2)
 *
 * Receives callbacks from Suno when music is generated.
 * Updates song entity with track variants and triggers push notifications.
 *
 * Key Changes (PRD-0014):
 * - Idempotency checks to prevent duplicate processing
 * - Validates minimum 1 track required
 * - Updates generationProgress field with timestamps and raw callback
 * - Sets status to "ready" when complete, "generating" when partial
 * - Triggers push notifications (fire-and-forget)
 * - Progressive loading tracking (streamAvailableAt, downloadAvailableAt)
 *
 * Security Note:
 * This endpoint is publicly accessible (exempted from session auth in middleware.ts)
 * to allow Suno webhooks to deliver results. Current security measures:
 * - Request metadata logging (User-Agent, Origin) for monitoring
 * - Payload structure validation
 * - Database verification (songId/taskId must exist before updates)
 * - Idempotency checks to prevent duplicate processing
 * - 200 responses on all errors to prevent retries
 *
 * Recommended Future Enhancements:
 * - HMAC signature verification if Suno provides webhook signatures
 * - IP allowlist for known Suno webhook sources
 * - Rate limiting per IP/taskId to prevent abuse
 * - Timestamp validation to prevent replay attacks
 */

import { NextRequest, NextResponse } from "next/server";
import { validate as isUuid, v5 as uuidv5 } from "uuid";
import { getAdminDb, getAdminEnvSnapshot } from "@/lib/adminDb";
import {
  parseGenerationProgress,
  stringifyGenerationProgress,
} from '@/types/generation';

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
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const songIdFromUrl = searchParams.get("songId");

    // Security: Log request metadata for monitoring
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown';

    console.log("=== SUNO MUSIC CALLBACK RECEIVED ===");
    console.log("User-Agent:", userAgent);
    console.log("Origin:", origin);
    console.log("Song ID:", songIdFromUrl);

    const payload = await request.json();

    // Security: Validate payload structure
    if (!payload || typeof payload !== 'object') {
      console.warn("⚠️ Invalid callback payload structure");
      return NextResponse.json(
        { ok: false, error: 'Invalid payload' },
        { status: 200 } // Task 2.2.5: Always return 200
      );
    }

    console.log('Payload:', JSON.stringify(payload, null, 2));

    const taskId = payload?.data?.task_id || payload?.data?.taskId;
    const callbackType = payload?.data?.callbackType;
    const tracksRaw = Array.isArray(payload?.data?.data) ? payload.data.data : [];

    console.log('Callback type:', callbackType);
    console.log('Task ID:', taskId);
    console.log('Tracks received:', tracksRaw.length);

    const adminDb = getAdminDb();

    if (!adminDb) {
      console.error("❌ Admin DB not available - cannot update song", getAdminEnvSnapshot());
      return NextResponse.json(
        { ok: false, error: "Admin token not configured" },
        { status: 200 } // Task 2.2.5: Always return 200
      );
    }

    // Task 2.2.1: Find song by songId or taskId
    let targetSongId = songIdFromUrl;
    let song: any = null;

    if (targetSongId) {
      const result = await adminDb.query({
        songs: {
          $: { where: { id: targetSongId } } as any,
          conversation: { user: {} },
        },
      });
      if (result.songs.length > 0) {
        song = result.songs[0];
        console.log('✅ Found song by songId:', targetSongId);
      }
    }

    if (!targetSongId && taskId) {
      const result = await adminDb.query({
        songs: {
          $: { where: { sunoTaskId: taskId } } as any,
          conversation: { user: {} },
        },
      });
      if (result.songs.length > 0) {
        song = result.songs[0];
        targetSongId = song.id;
        console.log('✅ Found song by sunoTaskId:', taskId, '-> songId:', targetSongId);
      }
    }

    if (!targetSongId || !song) {
      console.warn("⚠️ No song found for songId:", songIdFromUrl, "or taskId:", taskId);
      return NextResponse.json(
        { ok: false, error: "Song not found" },
        { status: 200 } // Task 2.2.5: Always return 200
      );
    }

    // Task 2.2.1: Idempotency check
    const currentProgress = parseGenerationProgress(song.generationProgress);

    if (
      callbackType === 'complete' &&
      song.status === 'ready' &&
      currentProgress?.musicCompletedAt
    ) {
      const completedAt = new Date(currentProgress.musicCompletedAt).toISOString();
      console.log('⏭️ Music already processed for taskId:', taskId);
      console.log('   Status:', song.status);
      console.log('   Completed at:', completedAt);

      return NextResponse.json({
        ok: true,
        message: 'Music already processed (idempotent)',
        completedAt,
      });
    }

    // Task 2.2.2: Validate tracks (must have at least 1)
    const normalizedTracks = tracksRaw.map((track: IncomingTrack, index: number) =>
      normalizeTrack(track, index, targetSongId),
    );

    const shouldProcessAudio =
      callbackType === 'complete' ||
      callbackType === 'first' ||
      normalizedTracks.some((track: any) => track.streamAudioUrl || track.audioUrl);

    if (!shouldProcessAudio) {
      console.log('⏳ No audio payload yet - callback acknowledged but not processed');
      return NextResponse.json({ ok: true, info: "No audio payload yet" });
    }

    // Task 2.2.2: Validate minimum tracks
    if (!normalizedTracks.length) {
      console.error('❌ No tracks received in callback');

      const updatedProgress = {
        lyricsTaskId: currentProgress?.lyricsTaskId || null,
        lyricsStartedAt: currentProgress?.lyricsStartedAt || null,
        lyricsCompletedAt: currentProgress?.lyricsCompletedAt || null,
        lyricsError: currentProgress?.lyricsError || null,
        lyricsRetryCount: currentProgress?.lyricsRetryCount || 0,
        musicTaskId: currentProgress?.musicTaskId || taskId || null,
        musicStartedAt: currentProgress?.musicStartedAt || null,
        musicCompletedAt: Date.now(),
        musicError: 'No tracks received from Suno',
        musicRetryCount: (currentProgress?.musicRetryCount || 0) + 1,
        rawCallback: payload,
      };

      await adminDb.transact([
        adminDb.tx.songs[targetSongId].update({
          status: 'failed',
          errorMessage: updatedProgress.musicError,
          generationProgress: stringifyGenerationProgress(updatedProgress),
          updatedAt: Date.now(),
        }),
      ]);

      console.log('✅ Updated song status to failed due to no tracks');

      return NextResponse.json(
        { ok: false, error: 'No tracks received' },
        { status: 200 } // Task 2.2.5: Always return 200
      );
    }

    // Task 6.2-6.7: Handle progressive loading timestamps
    const now = Date.now();
    const variantTx = normalizedTracks.map((track: any) => {
      const updateData: any = {
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
      };

      // Task 6.4, 6.5: Set streamAvailableAt when streaming URL is available
      if (callbackType === 'first' && track.streamAudioUrl) {
        updateData.streamAvailableAt = now;
      }

      // Task 6.6, 6.7: Set downloadAvailableAt when download URL is available
      if (callbackType === 'complete' && track.audioUrl) {
        updateData.downloadAvailableAt = now;
      }

      return adminDb.tx.sunoVariants[track.trackId]
        .update(updateData)
        .link({ song: targetSongId });
    });

    const primaryTrack = normalizedTracks[0] || null;

    // Task 2.2.3: Update generationProgress
    const isComplete = callbackType === 'complete';
    const updatedProgress = {
      lyricsTaskId: currentProgress?.lyricsTaskId || null,
      lyricsStartedAt: currentProgress?.lyricsStartedAt || null,
      lyricsCompletedAt: currentProgress?.lyricsCompletedAt || null,
      lyricsError: currentProgress?.lyricsError || null,
      lyricsRetryCount: currentProgress?.lyricsRetryCount || 0,
      musicTaskId: currentProgress?.musicTaskId || taskId || null,
      musicStartedAt: currentProgress?.musicStartedAt || null,
      musicCompletedAt: isComplete ? Date.now() : currentProgress?.musicCompletedAt || null,
      musicError: null,
      musicRetryCount: currentProgress?.musicRetryCount || 0,
      rawCallback: payload,
    };

    const songUpdate = adminDb.tx.songs[targetSongId].update({
      status: isComplete ? 'ready' : 'generating',
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
      generationProgress: stringifyGenerationProgress(updatedProgress),
      updatedAt: Date.now(),
    });

    await adminDb.transact([...variantTx, songUpdate]);

    console.log('✅ Updated song with music tracks');
    console.log('   Status:', isComplete ? 'ready' : 'generating');
    console.log('   Callback type:', callbackType);
    console.log('   Tracks:', normalizedTracks.length);
    if (isComplete) {
      console.log('   Completed at:', new Date(updatedProgress.musicCompletedAt!).toISOString());
    }
    console.log('   Primary track audio:', primaryTrack?.audioUrl ? 'yes' : 'no');
    console.log('   Primary track stream:', primaryTrack?.streamAudioUrl ? 'yes' : 'no');

    // Task 2.2.4: Send push notification (fire-and-forget)
    if (isComplete) {
      try {
        const ownerId = song.conversation?.[0]?.user?.[0]?.id;
        if (ownerId) {
          const { sendMusicReadyNotification } = await import('@/lib/push');
          const result = await sendMusicReadyNotification(ownerId, targetSongId);
          if (result.ok) {
            console.log(`📬 Music ready notification sent: ${result.sent} sent, ${result.failed} failed`);
          } else {
            console.error('⚠️ Failed to send music ready notification:', result.error);
          }
        } else {
          console.log('📬 No owner ID found - skipping push notification');
        }
      } catch (error) {
        console.error('⚠️ Push notification error:', error);
        // Don't fail the callback if notification fails
      }
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Music callback processed successfully in ${processingTime}ms`);

    // Task 2.2.5: Return 200 OK
    return NextResponse.json({
      ok: true,
      message: 'Music callback processed successfully',
      tracksCount: normalizedTracks.length,
      callbackType,
      processingTimeMs: processingTime,
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error("=== SUNO MUSIC CALLBACK ERROR ===");
    console.error("Error:", error);
    console.error("Stack:", error.stack);
    console.error(`Processing time: ${processingTime}ms`);
    if (error?.body) {
      console.error("InstantDB response body:", JSON.stringify(error.body));
    }

    // Task 2.2.5: Return 200 to prevent retries (error is logged)
    return NextResponse.json(
      {
        ok: false,
        error: error.message || "Internal error processing callback",
      },
      { status: 200 }
    );
  }
}

export async function GET() {
  // Security: GET is only for health checks, not for webhook processing
  return NextResponse.json({
    ok: true,
    message: 'Suno callback endpoint is active',
    method: 'POST required for webhooks'
  });
}

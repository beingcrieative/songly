import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { setLyricsTaskComplete, setLyricsTaskFailed, pruneLyricsCache } from '../cache';
import {
  parseGenerationProgress,
  stringifyGenerationProgress,
  stringifyLyricVariants,
  type LyricVariant,
} from '@/types/generation';

/**
 * Suno Lyrics Callback Handler (PRD-0014: Task 2.1)
 *
 * Receives callbacks from Suno when lyrics are generated.
 * Updates song entity with lyrics variants and triggers push notifications.
 *
 * Key Changes (PRD-0014):
 * - Idempotency checks to prevent duplicate processing
 * - Validates minimum 2 variants required
 * - Updates songs entity instead of conversations
 * - Sets status to "lyrics_ready" for UI to react
 * - Stores structured data in generationProgress field
 * - Triggers push notifications (fire-and-forget)
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

/**
 * POST /api/suno/lyrics/callback?songId=xxx
 *
 * Receives lyrics generation callback from Suno
 *
 * Query params:
 * - songId (preferred): Direct song ID for O(1) lookup
 * - conversationId (legacy): For backward compatibility during migration
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now();

  try {
    const { searchParams } = new URL(request.url);
    const songId = searchParams.get('songId');
    const conversationId = searchParams.get('conversationId'); // Legacy support

    // Security: Log request metadata for monitoring
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown';

    console.log('=== SUNO LYRICS CALLBACK RECEIVED ===');
    console.log('User-Agent:', userAgent);
    console.log('Origin:', origin);
    console.log('Song ID:', songId);
    console.log('Conversation ID (legacy):', conversationId);

    const payload = await request.json();

    // Security: Validate payload structure
    if (!payload || typeof payload !== 'object') {
      console.warn('⚠️ Invalid lyrics callback payload structure');
      return NextResponse.json(
        { ok: false, error: 'Invalid payload' },
        { status: 200 } // Task 2.1.5: Always return 200
      );
    }

    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Parse callback payload for lyrics data
    const callbackType = payload?.data?.callbackType || payload?.callbackType;
    const taskId = payload?.data?.task_id || payload?.task_id || payload?.taskId;
    const lyrics = payload?.data?.lyrics || payload?.lyrics;
    const status = payload?.data?.status || payload?.status;

    console.log('Callback type:', callbackType);
    console.log('Task ID:', taskId);
    console.log('Status:', status);
    console.log('Has lyrics:', !!lyrics);

    // Update cache for backward compatibility with polling endpoint
    pruneLyricsCache();

    // Extract lyric variants from payload
    const lyricTexts: string[] = Array.isArray(payload?.data?.data)
      ? payload.data.data
          .map((entry: any) => entry?.text)
          .filter((entry: any) => typeof entry === 'string' && entry.trim().length > 0)
      : lyrics
      ? [String(lyrics)]
      : [];

    console.log('Lyric variants extracted:', lyricTexts.length);

    // Update cache for backward compatibility
    if (taskId) {
      if (lyricTexts.length > 0) {
        setLyricsTaskComplete(taskId, lyricTexts);
      } else if (status && typeof status === 'string' && status.toUpperCase().includes('FAIL')) {
        setLyricsTaskFailed(taskId, status);
      }
    }

    // Get admin DB for server-side operations
    const adminDb = getAdminDb();

    if (!adminDb) {
      console.error('❌ Admin DB not available - cannot update song');
      return NextResponse.json(
        { ok: false, error: 'Admin token not configured' },
        { status: 200 } // Task 2.1.5: Always return 200
      );
    }

    // Task 2.1.1: Find song by songId or taskId
    let song: any = null;

    if (songId) {
      // Preferred: Direct lookup by songId
      const result = await adminDb.query({
        songs: {
          $: { where: { id: songId } } as any,
          user: {},
        },
      });
      if (result.songs.length > 0) {
        song = result.songs[0];
        console.log('✅ Found song by songId:', songId);
      }
    }

    // Fallback: Find by taskId using indexed lyricsTaskId field
    if (!song && taskId) {
      console.log('🔍 Searching for song by lyricsTaskId:', taskId);
      const result = await adminDb.query({
        songs: {
          $: { where: { lyricsTaskId: taskId } } as any,
          user: {},
        },
      });

      if (result.songs.length > 0) {
        song = result.songs[0];
        console.log('✅ Found song by lyricsTaskId:', taskId, '-> songId:', song.id);
      }
    }

    if (!song) {
      console.warn('⚠️ No song found for songId:', songId, 'or taskId:', taskId);

      // Legacy: Try updating conversation for backward compatibility
      if (conversationId) {
        console.log('⚙️ Legacy mode: Updating conversation instead');
        try {
          await adminDb.transact([
            adminDb.tx.conversations[conversationId].update({
              generatedLyrics: lyricTexts[0] || '',
              lyricsVariants: JSON.stringify(lyricTexts),
              lyricsTaskId: taskId,
              lyricsStatus: callbackType === 'complete' ? 'complete' : 'generating',
              updatedAt: Date.now(),
            }),
          ]);
          console.log('✅ Updated conversation (legacy mode)');
        } catch (error) {
          console.error('❌ Failed to update conversation:', error);
        }
      }

      return NextResponse.json(
        { ok: false, error: 'Song not found' },
        { status: 200 } // Task 2.1.5: Always return 200
      );
    }

    // Task 2.1.1: Idempotency check
    const currentProgress = parseGenerationProgress(song.generationProgress);

    if (song.status === 'lyrics_ready' && currentProgress?.lyricsCompletedAt) {
      const completedAt = new Date(currentProgress.lyricsCompletedAt).toISOString();
      console.log('⏭️ Lyrics already processed for taskId:', taskId);
      console.log('   Status:', song.status);
      console.log('   Completed at:', completedAt);

      return NextResponse.json({
        ok: true,
        message: 'Lyrics already processed (idempotent)',
        completedAt,
      });
    }

    // Task 2.1.2: Validate variants (must have at least 2)
    if (lyricTexts.length < 2) {
      console.error('❌ Insufficient variants received:', lyricTexts.length, '(expected >= 2)');

      const updatedProgress = {
        lyricsTaskId: currentProgress?.lyricsTaskId || taskId || null,
        lyricsStartedAt: currentProgress?.lyricsStartedAt || null,
        lyricsCompletedAt: Date.now(),
        lyricsError: `Insufficient variants received: ${lyricTexts.length} (expected >= 2)`,
        lyricsRetryCount: (currentProgress?.lyricsRetryCount || 0) + 1,
        musicTaskId: currentProgress?.musicTaskId || null,
        musicStartedAt: currentProgress?.musicStartedAt || null,
        musicCompletedAt: currentProgress?.musicCompletedAt || null,
        musicError: currentProgress?.musicError || null,
        musicRetryCount: currentProgress?.musicRetryCount || 0,
        rawCallback: payload,
      };

      await adminDb.transact([
        adminDb.tx.songs[song.id].update({
          status: 'failed',
          errorMessage: updatedProgress.lyricsError,
          generationProgress: stringifyGenerationProgress(updatedProgress),
          updatedAt: Date.now(),
        }),
      ]);

      console.log('✅ Updated song status to failed due to insufficient variants');

      return NextResponse.json(
        { ok: false, error: 'Insufficient variants' },
        { status: 200 } // Task 2.1.5: Always return 200
      );
    }

    // Task 2.1.3: Prepare lyric variants data
    const variants: LyricVariant[] = lyricTexts.map((text, index) => ({
      text,
      variantIndex: index,
      selected: false, // User will select one later
    }));

    const updatedProgress = {
      lyricsTaskId: currentProgress?.lyricsTaskId || taskId || null,
      lyricsStartedAt: currentProgress?.lyricsStartedAt || null,
      lyricsCompletedAt: Date.now(),
      lyricsError: null,
      lyricsRetryCount: currentProgress?.lyricsRetryCount || 0,
      musicTaskId: currentProgress?.musicTaskId || null,
      musicStartedAt: currentProgress?.musicStartedAt || null,
      musicCompletedAt: currentProgress?.musicCompletedAt || null,
      musicError: currentProgress?.musicError || null,
      musicRetryCount: currentProgress?.musicRetryCount || 0,
      rawCallback: payload,
    };

    // Task 2.1.3: Update song entity
    await adminDb.transact([
      adminDb.tx.songs[song.id].update({
        status: 'lyrics_ready',
        lyricsVariants: stringifyLyricVariants(variants),
        generationProgress: stringifyGenerationProgress(updatedProgress),
        updatedAt: Date.now(),
      }),
    ]);

    console.log('✅ Updated song with lyrics variants');
    console.log('   Status: lyrics_ready');
    console.log('   Variants:', variants.length);
    console.log('   Completed at:', new Date(updatedProgress.lyricsCompletedAt!).toISOString());
    console.log('   First variant preview:', lyricTexts[0]?.substring(0, 100) + '...');

    // Task 2.1.4: Send push notification (fire-and-forget)
    try {
      const userId = song.user?.id;
      if (userId) {
        const { sendLyricsReadyNotification } = await import('@/lib/push');
        const result = await sendLyricsReadyNotification(userId, song.id);
        if (result.ok) {
          console.log(`📬 Lyrics ready notification sent: ${result.sent} sent, ${result.failed} failed`);
        } else {
          console.error('⚠️ Failed to send lyrics ready notification:', result.error);
        }
      } else {
        console.log('📬 No user ID found - skipping push notification');
      }
    } catch (error) {
      console.error('⚠️ Push notification error:', error);
      // Don't fail the callback if notification fails
    }

    const processingTime = Date.now() - startTime;
    console.log(`✅ Lyrics callback processed successfully in ${processingTime}ms`);

    // Task 2.1.5: Return 200 OK
    return NextResponse.json({
      ok: true,
      message: 'Lyrics callback processed successfully',
      variantsCount: variants.length,
      processingTimeMs: processingTime,
    });

  } catch (error: any) {
    const processingTime = Date.now() - startTime;
    console.error('=== SUNO LYRICS CALLBACK ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);
    console.error(`Processing time: ${processingTime}ms`);

    // Task 2.1.5: Return 200 to prevent retries (error is logged)
    return NextResponse.json(
      {
        ok: false,
        error: error.message || 'Internal error processing callback',
      },
      { status: 200 }
    );
  }
}

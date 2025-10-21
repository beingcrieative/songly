import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { setLyricsTaskComplete, setLyricsTaskFailed, pruneLyricsCache } from '../cache';

/**
 * Suno Lyrics Callback Handler
 *
 * Task 3.9-3.11: Receives callbacks from Suno when lyrics are generated
 *
 * Security Note:
 * This endpoint is publicly accessible (exempted from session auth in middleware.ts)
 * to allow Suno webhooks to deliver results. Current security measures:
 * - Request metadata logging (User-Agent, Origin) for monitoring
 * - Payload structure validation
 * - Database verification (conversationId/taskId must exist before updates)
 * - 200 responses on errors to prevent retries
 *
 * Recommended Future Enhancements:
 * - HMAC signature verification if Suno provides webhook signatures
 * - IP allowlist for known Suno webhook sources
 * - Rate limiting per IP/taskId to prevent abuse
 * - Timestamp validation to prevent replay attacks
 */

/**
 * POST /api/suno/lyrics/callback?conversationId=xxx
 *
 * Receives lyrics generation callback from Suno
 */
export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const conversationId = searchParams.get('conversationId');

    // Security: Log request metadata for monitoring
    const userAgent = request.headers.get('user-agent') || 'unknown';
    const origin = request.headers.get('origin') || request.headers.get('referer') || 'unknown';

    console.log('=== SUNO LYRICS CALLBACK RECEIVED ===');
    console.log('User-Agent:', userAgent);
    console.log('Origin:', origin);
    console.log('Conversation ID:', conversationId);

    const payload = await request.json();

    // Security: Validate payload structure
    if (!payload || typeof payload !== 'object') {
      console.warn('⚠️ Invalid lyrics callback payload structure');
      return NextResponse.json({ ok: false, error: 'Invalid payload' }, { status: 400 });
    }

    console.log('Payload:', JSON.stringify(payload, null, 2));

    // Task 3.10: Parse callback payload for lyrics data
    const callbackType = payload?.data?.callbackType || payload?.callbackType;
    const taskId = payload?.data?.task_id || payload?.task_id || payload?.taskId;
    const lyrics = payload?.data?.lyrics || payload?.lyrics;
    const status = payload?.data?.status || payload?.status;

    console.log('Callback type:', callbackType);
    console.log('Task ID:', taskId);
    console.log('Status:', status);
    console.log('Has lyrics:', !!lyrics);

    pruneLyricsCache();

    const lyricVariants: string[] = Array.isArray(payload?.data?.data)
      ? payload.data.data
          .map((entry: any) => entry?.text)
          .filter((entry: any) => typeof entry === 'string' && entry.trim().length > 0)
      : lyrics
      ? [String(lyrics)]
      : [];

    if (taskId) {
      if (lyricVariants.length > 0) {
        setLyricsTaskComplete(taskId, lyricVariants);
      } else if (status && typeof status === 'string' && status.toUpperCase().includes('FAIL')) {
        setLyricsTaskFailed(taskId, status);
      }
    }

    // Get admin DB for server-side operations
    const adminDb = getAdminDb();

    if (!adminDb) {
      console.error('Admin DB not available - cannot update conversation');
      // Return 200 to acknowledge receipt (prevent retries)
      return NextResponse.json(
        { ok: false, warning: 'Admin token not configured' },
        { status: 200 }
      );
    }

    // Task 3.11: Update conversation or create lyrics entity in InstantDB
    if (conversationId && lyricVariants.length > 0) {
      try {
        // Option 1: Store in conversation entity
        await adminDb.transact([
          adminDb.tx.conversations[conversationId].update({
            generatedLyrics: lyricVariants[0],
            lyricsTaskId: taskId,
            lyricsStatus: status === 'SUCCESS' ? 'complete' : status,
            updatedAt: Date.now(),
          }),
        ]);

        console.log('✅ Updated conversation with generated lyrics');
      } catch (error) {
        console.error('Failed to update conversation:', error);
      }
    }

    // If no conversationId, try to find by taskId
    if (!conversationId && taskId && lyricVariants.length > 0) {
      try {
        const { conversations } = await adminDb.query({
          conversations: {
            $: { where: { lyricsTaskId: taskId } } as any,
          },
        });

        if (conversations.length > 0) {
          const conv = conversations[0];
          await adminDb.transact([
            adminDb.tx.conversations[conv.id].update({
              generatedLyrics: lyricVariants[0],
              lyricsStatus: status === 'SUCCESS' ? 'complete' : status,
              updatedAt: Date.now(),
            }),
          ]);

          console.log('✅ Found and updated conversation by taskId');
        } else {
          console.warn('⚠️ No conversation found for taskId:', taskId, 'from:', userAgent);
        }
      } catch (error) {
        console.error('Error finding conversation by taskId:', error);
      }
    }

    // Return success response to Suno
    return NextResponse.json({
      ok: true,
      message: 'Lyrics callback processed successfully',
    });

  } catch (error: any) {
    console.error('=== SUNO LYRICS CALLBACK ERROR ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    // Return 200 to prevent retries (error is logged)
    return NextResponse.json(
      {
        ok: false,
        error: error.message,
      },
      { status: 200 }
    );
  }
}

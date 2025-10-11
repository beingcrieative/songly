import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';

/**
 * Suno Lyrics Callback Handler
 *
 * Task 3.9-3.11: Receives callbacks from Suno when lyrics are generated
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

    const payload = await request.json();

    console.log('=== SUNO LYRICS CALLBACK RECEIVED ===');
    console.log('Conversation ID:', conversationId);
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
    if (conversationId && lyrics) {
      try {
        // Option 1: Store in conversation entity
        await adminDb.transact([
          adminDb.tx.conversations[conversationId].update({
            generatedLyrics: lyrics,
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
    if (!conversationId && taskId) {
      try {
        const { conversations } = await adminDb.query({
          conversations: {
            $: { where: { lyricsTaskId: taskId } },
          },
        });

        if (conversations.length > 0) {
          const conv = conversations[0];
          await adminDb.transact([
            adminDb.tx.conversations[conv.id].update({
              generatedLyrics: lyrics,
              lyricsStatus: status === 'SUCCESS' ? 'complete' : status,
              updatedAt: Date.now(),
            }),
          ]);

          console.log('✅ Found and updated conversation by taskId');
        } else {
          console.warn('No conversation found for taskId:', taskId);
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

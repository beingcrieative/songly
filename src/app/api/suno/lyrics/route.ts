import { NextRequest, NextResponse } from 'next/server';
import { buildLyricsRefinementPrompt } from '@/lib/utils/sunoLyricsPrompt';
import { getTemplateById } from '@/templates/music-templates';
import type { ExtractedContext } from '@/types/conversation';
import {
  getLyricsTask,
  pruneLyricsCache,
  setLyricsTaskComplete,
  setLyricsTaskFailed,
  setLyricsTaskGenerating,
} from './cache';

/**
 * Suno Lyrics Generation API Route
 *
 * Task 3.4-3.8: POST endpoint for generating lyrics via Suno API
 * Task 3.12: Error handling for Suno API errors
 * Task 3.13: Request/response logging
 */

const SUNO_API_BASE = "https://api.sunoapi.org/api/v1";

function getSunoApiKey() {
  return process.env.SUNO_API_KEY || "";
}

/**
 * POST /api/suno/lyrics
 *
 * Generate lyrics using Suno's lyrics generation endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      prompt: incomingPrompt,
      previousLyrics,
      feedback,
      callBackUrl,
      templateId,
      context,
    } = body;

    const hasRawPrompt = typeof incomingPrompt === 'string' && incomingPrompt.trim().length > 0;

    let normalizedPreviousLyrics: string | null = null;
    if (previousLyrics !== undefined) {
      if (typeof previousLyrics === 'string') {
        normalizedPreviousLyrics = previousLyrics;
      } else if (
        previousLyrics &&
        typeof previousLyrics === 'object' &&
        typeof previousLyrics.lyrics === 'string'
      ) {
        normalizedPreviousLyrics = previousLyrics.lyrics;
      } else {
        return NextResponse.json(
          { error: 'previousLyrics must be a string or an object containing a lyrics field' },
          { status: 400 }
        );
      }
    }

    const trimmedFeedback =
      typeof feedback === 'string' ? feedback.trim() : feedback === undefined ? '' : null;

    if (trimmedFeedback === null) {
      return NextResponse.json(
        { error: 'feedback must be a string when provided' },
        { status: 400 }
      );
    }

    let finalPrompt: string | null = hasRawPrompt ? incomingPrompt : null;

    if (normalizedPreviousLyrics && trimmedFeedback) {
      if (!templateId || typeof templateId !== 'string') {
        return NextResponse.json(
          { error: 'templateId is required to refine lyrics' },
          { status: 400 }
        );
      }

      const template = getTemplateById(templateId);
      if (!template) {
        return NextResponse.json(
          { error: `Template not found for id "${templateId}"` },
          { status: 404 }
        );
      }

      if (!context || typeof context !== 'object') {
        return NextResponse.json(
          { error: 'context is required to build refinement prompt' },
          { status: 400 }
        );
      }

      finalPrompt = buildLyricsRefinementPrompt(
        normalizedPreviousLyrics,
        trimmedFeedback,
        context as ExtractedContext,
        template
      );
    }

    if (!finalPrompt) {
      return NextResponse.json(
        { error: 'Prompt is required to generate lyrics' },
        { status: 400 }
      );
    }

    const minChars = Number(process.env.SUNO_LYRICS_PROMPT_MIN_CHARS || '60');
    // Suno API has a strict 200 character limit for lyrics prompts
    const maxChars = Number(process.env.SUNO_LYRICS_PROMPT_CHAR_LIMIT || '200');
    const promptLength = finalPrompt.length;

    if (promptLength < minChars) {
      return NextResponse.json(
        {
          error: `Prompt is too short. Minimum ${minChars} characters required.`,
          promptLength,
        },
        { status: 400 }
      );
    }

    if (promptLength > maxChars) {
      return NextResponse.json(
        {
          error: `Prompt is too long. Maximum ${maxChars} characters allowed.`,
          promptLength,
        },
        { status: 400 }
      );
    }

    const apiKey = getSunoApiKey();

    if (!apiKey) {
      console.error('SUNO_API_KEY not configured');
      return NextResponse.json(
        { error: 'Suno API key not configured' },
        { status: 500 }
      );
    }

    // Task 3.13: Log request
    console.log('=== SUNO LYRICS GENERATION REQUEST ===');
    console.log('Prompt length:', promptLength);
    console.log('Has previous lyrics:', !!normalizedPreviousLyrics);
    console.log('Has feedback:', !!trimmedFeedback);
    console.log('Callback URL:', callBackUrl || 'none');

    // Build request body
    const requestBody: Record<string, any> = {
      prompt: finalPrompt,
    };

    if (callBackUrl) {
      // Send multiple casings to maximize compatibility with Suno API variants
      requestBody.callBackUrl = callBackUrl;
      requestBody.callbackUrl = callBackUrl;
      requestBody.callback_url = callBackUrl;
    }

    // Task 3.6: Call Suno /api/v1/lyrics endpoint
    const apiUrl = `${SUNO_API_BASE}/lyrics`;
    console.log('Calling Suno API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Suno API Response Status:', response.status);

    const responseText = await response.text();
    console.log('Suno API Response:', responseText);

    // Task 3.12: Error handling for Suno API errors
    if (!response.ok) {
      console.error('=== SUNO LYRICS API ERROR ===');
      console.error('Status:', response.status);
      console.error('Response:', responseText);

      let errorMessage = 'Failed to generate lyrics';

      // Handle specific error codes
      if (response.status === 400) {
        errorMessage = 'Invalid request to Suno API';
      } else if (response.status === 401) {
        errorMessage = 'Suno API authentication failed';
      } else if (response.status === 429) {
        errorMessage = 'Rate limit exceeded. Please try again later.';
      } else if (response.status === 500) {
        errorMessage = 'Suno API server error';
      }

      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.msg || errorMessage;
      } catch (e) {
        // Response is not JSON, use status-based message
      }

      return NextResponse.json(
        {
          error: errorMessage,
          details: responseText,
          statusCode: response.status,
        },
        { status: response.status }
      );
    }

    // Parse response
    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      console.error('Failed to parse Suno response:', e);
      return NextResponse.json(
        { error: 'Invalid JSON response from Suno API', details: responseText },
        { status: 500 }
      );
    }

    // Task 3.7: Extract task_id from response
    const taskId = data.task_id || data.taskId || data.data?.task_id || data.data?.taskId;

    if (!taskId) {
      console.error('No task_id in Suno response:', data);
      return NextResponse.json(
        {
          error: 'Suno API did not return a task ID',
          details: data,
        },
        { status: 500 }
      );
    }

    console.log('=== SUNO LYRICS GENERATION SUCCESS ===');
    console.log('Task ID:', taskId);

    setLyricsTaskGenerating(taskId);
    pruneLyricsCache();

    // Task 3.8: Return task_id and status to client
    return NextResponse.json({
      taskId,
      status: 'generating',
      message: data.msg || data.message || 'Lyrics generation started',
    });

  } catch (error: any) {
    // Task 3.12: Catch-all error handling
    console.error('=== SUNO LYRICS API EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      {
        error: error.message || 'Failed to generate lyrics',
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}

/**
 * GET /api/suno/lyrics?taskId=xxx
 *
 * Poll for lyrics generation status (alternative to callback)
 *
 * PRD-0014 Task 2.3: Updated to check songs entity first
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    if (!taskId) {
      return NextResponse.json(
        { error: 'Task ID is required' },
        { status: 400 }
      );
    }

    const apiKey = getSunoApiKey();

    if (!apiKey) {
      return NextResponse.json(
        { error: 'Suno API key not configured' },
        { status: 500 }
      );
    }

    // FIRST: Check songs entity for callback results (PRD-0014 Task 2.3.1)
    const { getAdminDb } = await import('@/lib/adminDb');
    const adminDb = getAdminDb();

    if (adminDb) {
      try {
        console.log('[Lyrics Poll] Checking songs entity for lyricsTaskId:', taskId);
        const { songs } = await adminDb.query({
          songs: {
            $: { where: { lyricsTaskId: taskId } } as any,
          },
        });

        if (songs.length > 0) {
          const song = songs[0];
          console.log('[Lyrics Poll] Found song:', {
            id: song.id,
            status: song.status,
            hasVariants: !!song.lyricsVariants,
          });

          // Task 2.3.4: Handle new status values - map "lyrics_ready" to "complete"
          if (song.status === 'lyrics_ready' && song.lyricsVariants) {
            try {
              const { parseLyricVariants } = await import('@/types/generation');
              const variants = parseLyricVariants(song.lyricsVariants);

              if (variants && variants.length > 0) {
                console.log('[Lyrics Poll] ✅ Found', variants.length, 'variants in songs entity');

                // Extract text for backward-compatible format
                const variantTexts = variants.map(v => v.text);

                // Also update cache for future requests
                setLyricsTaskComplete(taskId, variantTexts);

                return NextResponse.json({
                  status: 'complete', // Map lyrics_ready → complete for client
                  lyrics: variantTexts.join('\n\n---\n\n'),
                  variants: variantTexts, // Backward compatible: array of strings
                  variantObjects: variants, // New format: array of LyricVariant objects
                  taskId,
                });
              }
            } catch (e) {
              console.warn('[Lyrics Poll] Failed to parse lyricsVariants from songs entity:', e);
            }
          }

          // Task 2.3.4: Map "failed" status
          if (song.status === 'failed') {
            console.log('[Lyrics Poll] ❌ Song generation failed');
            return NextResponse.json({
              status: 'failed',
              error: song.errorMessage || 'Lyrics generation failed',
              taskId,
            });
          }

          // Task 2.3.4: Map "generating_lyrics" status
          if (song.status === 'generating_lyrics') {
            console.log('[Lyrics Poll] ⏳ Still generating lyrics');
            return NextResponse.json({
              status: 'generating',
              taskId,
            });
          }
        }

        // Task 2.3.5: Backward compatibility - check conversations if songs query empty
        console.log('[Lyrics Poll] No song found, checking conversations (legacy)');
        const { conversations } = await adminDb.query({
          conversations: {
            $: { where: { lyricsTaskId: taskId } } as any,
          },
        });

        if (conversations.length > 0) {
          const conv = conversations[0];
          console.log('[Lyrics Poll] Found conversation (legacy):', {
            id: conv.id,
            lyricsStatus: conv.lyricsStatus,
            hasVariants: !!conv.lyricsVariants,
          });

          // Check if we have variants from callback (legacy format)
          if (conv.lyricsVariants && conv.lyricsStatus === 'complete') {
            try {
              const variants = JSON.parse(conv.lyricsVariants);
              if (Array.isArray(variants) && variants.length > 0) {
                console.log('[Lyrics Poll] ✅ Found', variants.length, 'variants in conversation (legacy)');
                // Also update cache for future requests
                setLyricsTaskComplete(taskId, variants);
                return NextResponse.json({
                  status: 'complete',
                  lyrics: variants.join('\n\n---\n\n'),
                  variants,
                  taskId,
                });
              }
            } catch (e) {
              console.warn('[Lyrics Poll] Failed to parse lyricsVariants from conversation:', e);
            }
          }
        }
      } catch (error) {
        console.warn('[Lyrics Poll] Error checking DB for lyrics:', error);
      }
    }

    // SECOND: Check cache (may have been populated by previous poll or callback)
    pruneLyricsCache();
    const cached = getLyricsTask(taskId);

    if (cached?.status === 'complete' && cached.lyrics?.length) {
      console.log('[Lyrics Poll] ✅ Found', cached.lyrics.length, 'variants in cache');
      return NextResponse.json({
        status: 'complete',
        lyrics: cached.lyrics.join('\n\n---\n\n'),
        variants: cached.lyrics,
        taskId,
      });
    }

    if (cached?.status === 'failed') {
      console.log('[Lyrics Poll] ❌ Lyrics generation failed (from cache)');
      return NextResponse.json({
        status: 'failed',
        error: cached.error || 'Lyrics generation failed',
        taskId,
      });
    }

    const endpoints = [
      // Most likely variants
      { method: 'POST' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-details`, body: { taskId } },
      { method: 'POST' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-details`, body: { task_id: taskId } },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-details?taskId=${taskId}` },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-details?task_id=${taskId}` },
      // Alternate endpoints observed in some deployments
      { method: 'POST' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-result`, body: { taskId } },
      { method: 'POST' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-result`, body: { task_id: taskId } },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-result?taskId=${taskId}` },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/get-lyrics-generation-result?task_id=${taskId}` },
      { method: 'POST' as const, url: `${SUNO_API_BASE}/lyrics/get-generation-details`, body: { taskId } },
      { method: 'POST' as const, url: `${SUNO_API_BASE}/lyrics/get-generation-details`, body: { task_id: taskId } },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/get-generation-details?taskId=${taskId}` },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/get-generation-details?task_id=${taskId}` },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/details?taskId=${taskId}` },
      { method: 'GET' as const, url: `${SUNO_API_BASE}/lyrics/details?task_id=${taskId}` },
    ];

    let data: any = null;
    let lastBody = '';

    for (const endpoint of endpoints) {
      try {
        console.log('Polling Suno lyrics status:', endpoint.method, endpoint.url);
        const response = await fetch(endpoint.url, {
          method: endpoint.method,
          headers: {
            Authorization: `Bearer ${apiKey}`,
            ...(endpoint.body ? { 'Content-Type': 'application/json' } : {}),
          },
          ...(endpoint.body ? { body: JSON.stringify(endpoint.body) } : {}),
        });

        lastBody = await response.text();
        console.log('Suno lyrics status response:', lastBody);

        if (response.status === 404) {
          // Try next candidate endpoint on 404
          continue;
        }

        if (!response.ok) {
          return NextResponse.json(
            { error: 'Failed to get lyrics status', details: lastBody },
            { status: response.status }
          );
        }

        try {
          data = JSON.parse(lastBody);
        } catch (e) {
          return NextResponse.json(
            { error: 'Invalid JSON response', details: lastBody },
            { status: 500 }
          );
        }

        break;
      } catch (error) {
        console.error('Error polling Suno lyrics status:', error);
      }
    }

    if (!data) {
      console.warn('No lyrics status data found, assuming still generating');
      return NextResponse.json({ status: 'generating', taskId });
    }

    // Check status
    const status =
      data.status ||
      data.state ||
      data.data?.status ||
      data.data?.state ||
      data.data?.record?.status ||
      data.data?.record?.state ||
      data.data?.data?.status ||
      (Array.isArray(data.data) ? data.data[0]?.status || data.data[0]?.state : null) ||
      (Array.isArray(data.data?.data) ? data.data.data[0]?.status || data.data.data[0]?.state : null);

    const lyrics =
      data.lyrics ||
      data.data?.lyrics ||
      data.data?.record?.lyrics ||
      data.data?.data?.lyrics ||
      (Array.isArray(data.data) ? data.data[0]?.lyrics : null) ||
      (Array.isArray(data.data?.data) ? data.data.data[0]?.lyrics : null);

    const successStates = ['SUCCESS', 'COMPLETE', 'DONE', 'COMPLETED'];
    const normalizedStatus = String(status || '').toUpperCase();

    if (successStates.includes(normalizedStatus) && lyrics) {
      const lyricsArray = Array.isArray(lyrics)
        ? lyrics.filter((item: any) => typeof item === 'string')
        : [String(lyrics)];

      setLyricsTaskComplete(taskId, lyricsArray);

      return NextResponse.json({
        status: 'complete',
        lyrics: lyricsArray.join('\n\n---\n\n'),
        variants: lyricsArray,
        taskId,
      });
    } else if (['FAILED', 'FAIL', 'CREATE_TASK_FAILED', 'ERROR'].includes(normalizedStatus)) {
      const errorMessage = data.message || data.msg || data.error || 'Lyrics generation failed';
      setLyricsTaskFailed(taskId, errorMessage);
      return NextResponse.json({
        status: 'failed',
        error: errorMessage,
        taskId,
      });
    }

    // Still generating
    return NextResponse.json({
      status: 'generating',
      taskId,
    });

  } catch (error: any) {
    console.error('Lyrics status check error:', error);

    return NextResponse.json(
      { error: error.message || 'Failed to check lyrics status' },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * Suno Lyrics Generation API Route
 *
 * Task 3.4-3.8: POST endpoint for generating lyrics via Suno API
 * Task 3.12: Error handling for Suno API errors
 * Task 3.13: Request/response logging
 */

const SUNO_API_BASE = "https://api.sunoapi.org/api/v1";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";

/**
 * POST /api/suno/lyrics
 *
 * Generate lyrics using Suno's lyrics generation endpoint
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, previousLyrics, feedback, callBackUrl } = body;

    // Task 3.5: Request validation
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json(
        { error: 'Prompt is required and must be a string' },
        { status: 400 }
      );
    }

    // Validate prompt length (Suno limits: ~200 words for fast results)
    // Note: Suno docs mention character limits per model, we'll use a conservative limit
    const MAX_PROMPT_LENGTH = 3000;
    if (prompt.length > MAX_PROMPT_LENGTH) {
      return NextResponse.json(
        {
          error: `Prompt is too long. Maximum ${MAX_PROMPT_LENGTH} characters allowed.`,
          promptLength: prompt.length,
        },
        { status: 400 }
      );
    }

    if (!SUNO_API_KEY) {
      console.error('SUNO_API_KEY not configured');
      return NextResponse.json(
        { error: 'Suno API key not configured' },
        { status: 500 }
      );
    }

    // Task 3.13: Log request
    console.log('=== SUNO LYRICS GENERATION REQUEST ===');
    console.log('Prompt length:', prompt.length);
    console.log('Has previous lyrics:', !!previousLyrics);
    console.log('Has feedback:', !!feedback);
    console.log('Callback URL:', callBackUrl || 'none');

    // Build request body
    const requestBody: Record<string, any> = {
      prompt: prompt,
    };

    if (callBackUrl) {
      requestBody.callBackUrl = callBackUrl;
    }

    // Task 3.6: Call Suno /api/v1/lyrics endpoint
    const apiUrl = `${SUNO_API_BASE}/lyrics`;
    console.log('Calling Suno API:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUNO_API_KEY}`,
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

    if (!SUNO_API_KEY) {
      return NextResponse.json(
        { error: 'Suno API key not configured' },
        { status: 500 }
      );
    }

    // Poll Suno API for lyrics status
    const apiUrl = `${SUNO_API_BASE}/get-lyrics-generation-details?task_id=${taskId}`;
    console.log('Polling Suno lyrics status:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
      },
    });

    const responseText = await response.text();
    console.log('Suno lyrics status response:', responseText);

    if (!response.ok) {
      console.error('Lyrics status check failed:', responseText);

      if (response.status === 404) {
        return NextResponse.json({ status: 'generating' });
      }

      return NextResponse.json(
        { error: 'Failed to get lyrics status', details: responseText },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (e) {
      return NextResponse.json(
        { error: 'Invalid JSON response', details: responseText },
        { status: 500 }
      );
    }

    // Check status
    const status = data.status || data.data?.status;
    const lyrics = data.lyrics || data.data?.lyrics;

    if (status === 'SUCCESS' && lyrics) {
      return NextResponse.json({
        status: 'complete',
        lyrics,
        taskId,
      });
    } else if (status === 'FAILED' || status === 'CREATE_TASK_FAILED') {
      return NextResponse.json({
        status: 'failed',
        error: data.message || data.msg || 'Lyrics generation failed',
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

import { NextRequest, NextResponse } from 'next/server';

const SUNO_API_BASE = 'https://api.sunoapi.org/api/v1';
const SUNO_API_KEY = process.env.SUNO_API_KEY || '';

/**
 * Add Vocals - Enhance an instrumental track by generating AI vocals and lyrics on top
 * Docs: https://docs.sunoapi.org/suno-api/add-vocals.md
 */
export async function POST(request: NextRequest) {
  try {
    const { audioFileUrl, prompt, tags, styleWeight } = await request.json();

    console.log('=== ADD VOCALS REQUEST ===');
    console.log('Audio File URL:', audioFileUrl);
    console.log('Prompt:', prompt);
    console.log('Tags:', tags);
    console.log('Style Weight:', styleWeight);

    if (!SUNO_API_KEY) {
      return NextResponse.json(
        { error: 'Suno API key not configured' },
        { status: 500 }
      );
    }

    if (!audioFileUrl) {
      return NextResponse.json(
        { error: 'Audio file URL is required' },
        { status: 400 }
      );
    }

    // Prepare request body
    const requestBody: any = {
      audio_file_url: audioFileUrl,
      prompt: prompt || '',
      mv: 'V4_5PLUS', // Suno v4.5+ model
    };

    // Optional parameters
    if (tags) requestBody.tags = tags;
    if (styleWeight !== undefined) requestBody.style_weight = styleWeight;

    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    const apiUrl = `${SUNO_API_BASE}/generate/add-vocals`;
    console.log('API URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUNO_API_KEY}`,
      },
      body: JSON.stringify(requestBody),
    });

    console.log('Response Status:', response.status);

    const responseText = await response.text();
    console.log('Response Text:', responseText);

    if (!response.ok) {
      console.error('=== ADD VOCALS ERROR ===');
      console.error('Status:', response.status);
      console.error('Response:', responseText);

      let errorMessage = 'Failed to add vocals';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }

      return NextResponse.json(
        { error: errorMessage, details: responseText },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed Response Data:', data);
    } catch (e) {
      console.error('Failed to parse JSON:', e);
      return NextResponse.json(
        { error: 'Invalid JSON response from Suno API', details: responseText },
        { status: 500 }
      );
    }

    console.log('=== ADD VOCALS SUCCESS ===');
    console.log('Task ID:', data.task_id);

    return NextResponse.json({
      taskId: data.task_id,
      status: 'generating',
      message: data.message,
    });
  } catch (error: any) {
    console.error('=== ADD VOCALS EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { error: error.message || 'Er is iets misgegaan bij het toevoegen van vocals' },
      { status: 500 }
    );
  }
}

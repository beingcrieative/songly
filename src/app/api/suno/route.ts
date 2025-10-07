import { NextRequest, NextResponse } from 'next/server';

const SUNO_API_BASE = "https://api.sunoapi.org/api/v1";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";
const SUNO_CALLBACK_URL = process.env.SUNO_CALLBACK_URL || "";
const DEFAULT_MODEL = "V5";

export async function POST(request: NextRequest) {
  try {
    const {
      songId,
      lyrics,
      title,
      musicStyle,
      model,
      makeInstrumental,
      instrumental,
    } = await request.json();

    if (!lyrics) {
      return NextResponse.json(
        { error: 'Lyrics are required to generate music' },
        { status: 400 }
      );
    }

    console.log('=== SUNO API REQUEST DEBUG ===');
    console.log('Title:', title);
    console.log('Music Style:', musicStyle);
    console.log('Lyrics length:', lyrics?.length);
    console.log('API Key present:', !!SUNO_API_KEY);
    console.log('API Key (first 10 chars):', SUNO_API_KEY.substring(0, 10));
    console.log('Requested Model:', model || DEFAULT_MODEL);
    console.log('Requested Instrumental:', makeInstrumental ?? instrumental ?? false);

    if (!SUNO_API_KEY) {
      return NextResponse.json(
        { error: "Suno API key not configured" },
        { status: 500 }
      );
    }

    if (!SUNO_CALLBACK_URL) {
      return NextResponse.json(
        {
          error: "SUNO_CALLBACK_URL is not set. Configure it to a publicly reachable endpoint to receive Suno callbacks.",
        },
        { status: 500 }
      );
    }

    const resolvedModel = (model || DEFAULT_MODEL).toUpperCase();
    const wantsInstrumental = Boolean(makeInstrumental ?? instrumental ?? false);

    // Prepare request body volgens Suno API docs
    const requestBody = {
      custom_mode: true,
      prompt: lyrics,
      title: title || 'Untitled Love Song',
      tags: musicStyle || 'romantic ballad',
      model: resolvedModel,
      mv: resolvedModel, // compat voor oudere API versies
      make_instrumental: wantsInstrumental,
      instrumental: wantsInstrumental,
      callBackUrl: songId
        ? `${SUNO_CALLBACK_URL}?songId=${encodeURIComponent(songId)}`
        : SUNO_CALLBACK_URL,
    };

    console.log('Request Body:', JSON.stringify(requestBody, null, 2));

    // Create music with Suno API
    // Docs: https://docs.sunoapi.org/suno-api/generate-music.md
    const apiUrl = `${SUNO_API_BASE}/generate`;
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
    console.log('Response Headers:', Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log('Response Text:', responseText);

    if (!response.ok) {
      console.error('=== SUNO API ERROR ===');
      console.error('Status:', response.status);
      console.error('Response:', responseText);

      let errorMessage = "Failed to create music";
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
        console.error('Parsed Error:', errorData);
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

    const taskId = data.task_id || data.taskId || data.data?.taskId || data.data?.task_id;
    const modelName = data.model || data.model_name || data.data?.model || data.data?.model_name;

    if ((typeof data.code !== 'undefined' && ![0, 200].includes(Number(data.code))) || !taskId) {
      console.error('=== SUNO API RESPONSE ERROR ===');
      console.error('Code:', data.code);
      console.error('Message:', data.msg || data.message);

      return NextResponse.json(
        {
          error: data.msg || data.message || "Suno API gaf een fout terug",
          details: data,
        },
        { status: 400 }
      );
    }

    console.log('=== SUNO API SUCCESS ===');
    console.log('Task ID:', taskId);

    return NextResponse.json({
      taskId,
      status: 'generating',
      message: data.msg || data.message,
      model: modelName || resolvedModel,
      instrumental: wantsInstrumental,
    });
  } catch (error: any) {
    console.error('=== SUNO API EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { error: error.message || 'Er is iets misgegaan bij het genereren van muziek' },
      { status: 500 }
    );
  }
}

// GET endpoint to check the status of a music generation task
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const taskId = searchParams.get('taskId');

    console.log('=== SUNO STATUS CHECK ===');
    console.log('Task ID:', taskId);

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

    // Get music task status
    // Docs: https://docs.sunoapi.org/suno-api/get-music-generation-details.md
    const apiUrl = `${SUNO_API_BASE}/generate/get-music-generation-details?task_id=${taskId}`;
    console.log('Status Check URL:', apiUrl);

    const response = await fetch(apiUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${SUNO_API_KEY}`,
      },
    });

    console.log('Status Response:', response.status);

    const responseText = await response.text();
    console.log('Status Response Text:', responseText);

    if (!response.ok) {
      if (response.status === 404) {
        console.warn('Status 404 voor task', taskId, '- markeren als generating');
        return NextResponse.json({ status: 'generating' });
      }
      console.error('Status check failed:', responseText);
      let errorMessage = 'Failed to get music status';
      try {
        const errorData = JSON.parse(responseText);
        errorMessage = errorData.message || errorData.error || errorMessage;
      } catch (e) {
        errorMessage = responseText || errorMessage;
      }

      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    let data;
    try {
      data = JSON.parse(responseText);
      console.log('Parsed Status Data:', data);
    } catch (e) {
      console.error('Failed to parse status JSON:', e);
      return NextResponse.json(
        { error: 'Invalid JSON response', details: responseText },
        { status: 500 }
      );
    }

    const tracksArray = Array.isArray(data.data)
      ? data.data
      : Array.isArray(data.data?.data)
      ? data.data.data
      : [];
    const tracks = tracksArray || [];
    console.log('Number of tracks:', tracks.length);

    if (tracks.length === 0) {
      return NextResponse.json({
        status: 'generating',
      });
    }

    const track = tracks[0];
    console.log('Track state:', track.state);
    console.log('Track audio_url:', track.audio_url || track.stream_audio_url || track.source_stream_audio_url);

    const audioUrl =
      track.audio_url || track.stream_audio_url || track.source_stream_audio_url || null;
    const status = track.state
      ? track.state === 'complete'
        ? 'ready'
        : track.state === 'failed'
        ? 'failed'
        : 'generating'
      : audioUrl
      ? 'ready'
      : 'generating';

    const mappedTracks = tracks.map((t: any) => ({
      status: t.state
        ? t.state === 'complete'
          ? 'ready'
          : t.state === 'failed'
          ? 'failed'
          : 'generating'
        : t.audio_url || t.stream_audio_url
        ? 'ready'
        : 'generating',
      audioUrl: t.audio_url || null,
      streamAudioUrl: t.stream_audio_url || t.source_stream_audio_url || null,
      sourceAudioUrl: t.source_audio_url || null,
      sourceStreamAudioUrl: t.source_stream_audio_url || null,
      videoUrl: t.video_url || t.source_video_url || null,
      imageUrl: t.image_url || t.cover_url || null,
      title: t.title,
      lyrics: t.lyrics,
      durationSeconds: typeof t.duration === 'number' ? t.duration : null,
      modelName: t.model_name || null,
      prompt: t.prompt || null,
      tags: t.tags || null,
      trackId: t.id,
    }));

    return NextResponse.json({
      status,
      audioUrl,
      videoUrl: track.video_url || track.source_video_url || null,
      imageUrl: track.image_url || track.cover_url || null,
      title: track.title,
      lyrics: track.lyrics,
      streamAudioUrl: track.stream_audio_url || track.source_stream_audio_url || null,
      sourceAudioUrl: track.source_audio_url || null,
      sourceStreamAudioUrl: track.source_stream_audio_url || null,
      durationSeconds: typeof track.duration === 'number' ? track.duration : null,
      modelName: track.model_name || null,
      prompt: track.prompt || null,
      tags: track.tags || null,
      tracks: mappedTracks,
    });
  } catch (error: any) {
    console.error('=== STATUS CHECK EXCEPTION ===');
    console.error('Error:', error);
    console.error('Stack:', error.stack);

    return NextResponse.json(
      { error: error.message || 'Er is iets misgegaan' },
      { status: 500 }
    );
  }
}

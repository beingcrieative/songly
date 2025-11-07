import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import { parseExtractedContext } from '@/lib/utils/contextExtraction';
import { buildVocalDescription, buildVocalTags, mergeVocalPreferences } from '@/lib/utils/vocalDescriptionBuilder';
import { VocalPreferences } from '@/types/conversation';
import { getSunoCallbackUrl } from '@/lib/utils/getDeploymentUrl';

const SUNO_API_BASE = "https://api.sunoapi.org/api/v1";
const SUNO_API_KEY = process.env.SUNO_API_KEY || "";
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
      // Task 5.6: Accept template configuration
      templateConfig,
      vocalPreferences: requestVocalPreferences,
    } = await request.json();

    if (!lyrics) {
      return NextResponse.json(
        { error: 'Lyrics are required to generate music' },
        { status: 400 }
      );
    }

    // Fetch vocal preferences and user mood/language from database if songId is provided
    let mergedVocalPreferences: VocalPreferences = {};
    let userMoodTags: string[] = [];

    if (songId) {
      try {
        const admin = getAdminDb();
        if (admin) {
          // Fetch song with its conversation relationship
          const songQuery = await admin.query({
            songs: {
              $: { where: { id: songId } } as any,
              conversation: {},
            },
          });

          const song = songQuery.songs?.[0];

          if (song) {
            // Try to get preferences from song's generationParams
            let songPrefs: VocalPreferences = {};
            if (song.generationParams) {
              try {
                const parsed = JSON.parse(song.generationParams);
                songPrefs = {
                  language: parsed.language,
                  vocalGender: parsed.vocalGender,
                  vocalAge: parsed.vocalAge,
                  vocalDescription: parsed.vocalDescription,
                };
              } catch (e) {
                console.warn('Failed to parse song generationParams:', e);
              }
            }

            // Try to get preferences from conversation's extractedContext
            let conversationPrefs: VocalPreferences = {};
            const conversation = Array.isArray(song.conversation) ? song.conversation[0] : song.conversation;
            if (conversation?.extractedContext) {
              const context = parseExtractedContext(conversation.extractedContext);
              if (context) {
                conversationPrefs = {
                  language: context.language,
                  vocalGender: context.vocalGender,
                  vocalAge: context.vocalAge,
                  vocalDescription: context.vocalDescription,
                };
              }
            }

            // Try to get explicit song settings from conversation.songSettings
            if (conversation?.songSettings) {
              try {
                const s = JSON.parse(conversation.songSettings);
                conversationPrefs = {
                  language: s.language ?? conversationPrefs.language,
                  vocalGender: s.vocalGender ?? conversationPrefs.vocalGender,
                  vocalAge: s.vocalAge ?? conversationPrefs.vocalAge,
                  vocalDescription: s.vocalDescription ?? conversationPrefs.vocalDescription,
                };
                if (Array.isArray(s.mood)) {
                  userMoodTags = s.mood.filter((x: any) => typeof x === 'string');
                }
              } catch (e) {
                console.warn('Failed to parse conversation.songSettings:', e);
              }
            }

            // Merge preferences (song-level takes precedence)
            mergedVocalPreferences = mergeVocalPreferences(conversationPrefs, songPrefs);
            console.log('Merged vocal preferences (conversation/song):', mergedVocalPreferences);
          }
        }
      } catch (error) {
        console.error('Error fetching vocal preferences:', error);
        // Continue with empty preferences rather than failing
      }
    }

    if (requestVocalPreferences && typeof requestVocalPreferences === "object") {
      const sanitizedRequestPrefs: VocalPreferences = {
        language:
          typeof requestVocalPreferences.language === "string"
            ? requestVocalPreferences.language
            : undefined,
        vocalGender:
          requestVocalPreferences.vocalGender === "male" ||
          requestVocalPreferences.vocalGender === "female" ||
          requestVocalPreferences.vocalGender === "neutral"
            ? requestVocalPreferences.vocalGender
            : undefined,
        vocalAge:
          requestVocalPreferences.vocalAge === "young" ||
          requestVocalPreferences.vocalAge === "mature" ||
          requestVocalPreferences.vocalAge === "deep"
            ? requestVocalPreferences.vocalAge
            : undefined,
        vocalDescription:
          typeof requestVocalPreferences.vocalDescription === "string"
            ? requestVocalPreferences.vocalDescription
            : undefined,
      };
      mergedVocalPreferences = mergeVocalPreferences(mergedVocalPreferences, sanitizedRequestPrefs);
      console.log('Merged vocal preferences (request override):', sanitizedRequestPrefs);
    }

    console.log('=== SUNO API REQUEST DEBUG ===');
    console.log('Title:', title);
    console.log('Music Style:', musicStyle);
    console.log('Lyrics length:', lyrics?.length);
    console.log('Vocal Preferences:', mergedVocalPreferences);
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

    // Get callback URL - supports both explicit env var and auto-detection on Vercel
    const callbackUrl = getSunoCallbackUrl(songId);

    console.log('[Suno API] Callback URL construction:', {
      SUNO_CALLBACK_URL: process.env.SUNO_CALLBACK_URL ? 'set' : 'not set',
      VERCEL_URL: process.env.VERCEL_URL || 'not set',
      callbackUrl,
      songId,
    });

    // Validate that we have a callback URL
    if (!callbackUrl || (callbackUrl.includes('localhost') && !process.env.SUNO_CALLBACK_URL)) {
      console.warn('No production callback URL configured. Suno callbacks may not work.');
      // Don't block in development, but warn
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          {
            error: "SUNO_CALLBACK_URL not configured. Set this to your deployment URL (e.g., https://songly.vercel.app/api/suno/callback)",
          },
          { status: 500 }
        );
      }
    }

    // Task 5.7: Use template config to override model and tags
    const resolvedModel = 'V5';
    const wantsInstrumental = Boolean(makeInstrumental ?? instrumental ?? false);

    // Build vocal description and tags from preferences
    const vocalDescription = buildVocalDescription(mergedVocalPreferences);
    const vocalTags = buildVocalTags(mergedVocalPreferences);

    // Enhance prompt with vocal description
    let enhancedPrompt = lyrics;
    if (vocalDescription && !wantsInstrumental) {
      enhancedPrompt = `${lyrics}\n\n${vocalDescription}`;
      console.log('Enhanced prompt with vocal description:', vocalDescription);
    }

    // Task 5.8: Enhance tags with template config and vocal characteristics
    let enhancedTags = templateConfig?.tags || musicStyle || 'romantic ballad';
    const extraTags: string[] = [];
    if (!wantsInstrumental) {
      if (vocalTags.length > 0) extraTags.push(...vocalTags);
      if (userMoodTags.length > 0) extraTags.push(...userMoodTags);
    }
    if (extraTags.length > 0) {
      enhancedTags = `${enhancedTags}, ${extraTags.join(', ')}`;
      console.log('Enhanced tags with extras:', extraTags);
    }

    // Prepare request body volgens Suno API docs
    const requestBody: any = {
      custom_mode: true,
      prompt: enhancedPrompt,
      title: title || 'Untitled Love Song',
      tags: enhancedTags,
      model: resolvedModel,
      mv: resolvedModel, // compat voor oudere API versies
      make_instrumental: wantsInstrumental,
      instrumental: wantsInstrumental,
    };
    // Add callback URL (already includes songId if provided)
    if (callbackUrl) {
      // Send multiple casings to maximize compatibility with different Suno API versions
      requestBody.callBackUrl = callbackUrl;
      requestBody.callbackUrl = callbackUrl;
      requestBody.callback_url = callbackUrl;
      console.log('Callback URL configured:', callbackUrl);
    }

    // Task 5.9-5.11: Add advanced Suno parameters from template config
    if (templateConfig?.styleWeight !== undefined) {
      requestBody.style_weight = templateConfig.styleWeight;
    }
    if (templateConfig?.weirdnessConstraint !== undefined) {
      requestBody.weirdness_constraint = templateConfig.weirdnessConstraint;
    }
    if (templateConfig?.audioWeight !== undefined) {
      requestBody.audio_weight = templateConfig.audioWeight;
    }

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

    // Helper: fallback by checking DB for callback results (when upstream 404s)
    const tryDbFallback = async () => {
      try {
        const admin = getAdminDb();
        if (!admin) return null;
        const { songs } = await admin.query({
          songs: { $: { where: { sunoTaskId: taskId } } },
        });
        const song = songs?.[0];
        if (!song) return null;
        const parsed = song.callbackData ? JSON.parse(song.callbackData) : [];
        if (!Array.isArray(parsed) || parsed.length === 0) return null;
        const mappedTracks = parsed.map((t: any) => ({
          status: t.audioUrl || t.streamAudioUrl ? 'ready' : 'generating',
          audioUrl: t.audioUrl || null,
          streamAudioUrl: t.streamAudioUrl || t.sourceStreamAudioUrl || null,
          sourceAudioUrl: t.sourceAudioUrl || null,
          sourceStreamAudioUrl: t.sourceStreamAudioUrl || null,
          videoUrl: null,
          imageUrl: t.imageUrl || null,
          title: t.title || song.title || 'Versie',
          lyrics: song.lyrics || undefined,
          durationSeconds: typeof t.durationSeconds === 'number' ? t.durationSeconds : null,
          modelName: t.modelName || null,
          prompt: t.prompt || null,
          tags: t.tags || null,
          trackId: t.trackId,
        }));
        const primary = mappedTracks[0];
        return NextResponse.json({
          status: 'ready',
          audioUrl: primary.audioUrl,
          videoUrl: primary.videoUrl || null,
          imageUrl: primary.imageUrl || null,
          title: primary.title,
          lyrics: primary.lyrics,
          streamAudioUrl: primary.streamAudioUrl,
          sourceAudioUrl: null,
          sourceStreamAudioUrl: null,
          durationSeconds: primary.durationSeconds,
          modelName: primary.modelName,
          prompt: primary.prompt,
          tags: primary.tags,
          tracks: mappedTracks,
        });
      } catch (_) {
        return null;
      }
    };

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
        console.warn('Status 404 voor task', taskId, '- proberen via DB callback fallback');
        const fallback = await tryDbFallback();
        if (fallback) return fallback;
        console.warn('Geen DB callback gevonden; markeren als generating');
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

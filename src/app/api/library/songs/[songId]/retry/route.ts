import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import {
  parseGenerationProgress,
  stringifyGenerationProgress,
} from '@/types/generation';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { phase } = await req.json();
    const { songId } = await params;

    if (!['lyrics', 'music'].includes(phase)) {
      return NextResponse.json(
        { error: 'phase must be "lyrics" or "music"' },
        { status: 400 }
      );
    }

    // Get song
    const admin = getAdminDb();
    if (!admin) {
      return NextResponse.json(
        { error: 'Admin not configured' },
        { status: 500 }
      );
    }

    const { songs } = await admin.query({
      songs: {
        $: { where: { id: songId } },
      },
    });

    const song = songs[0];
    if (!song) {
      return NextResponse.json(
        { error: 'Song not found' },
        { status: 404 }
      );
    }

    // Check retry count
    const progress = parseGenerationProgress(song.generationProgress);
    const retryCountField = phase === 'lyrics'
      ? 'lyricsRetryCount'
      : 'musicRetryCount';
    const currentRetries = (progress as any)?.[retryCountField] ?? 0;

    if (currentRetries >= 3) {
      return NextResponse.json(
        { error: 'Maximum retries (3) exceeded' },
        { status: 429 }
      );
    }

    // Update progress
    const updatedProgress = {
      ...progress,
    };

    if (phase === 'lyrics') {
      updatedProgress.lyricsRetryCount = currentRetries + 1;
      updatedProgress.lyricsError = null;
      updatedProgress.lyricsStartedAt = Date.now();
    } else {
      updatedProgress.musicRetryCount = currentRetries + 1;
      updatedProgress.musicError = null;
      updatedProgress.musicStartedAt = Date.now();
    }

    // Update status
    const newStatus = phase === 'lyrics'
      ? 'generating_lyrics'
      : 'generating_music';

    await admin.transact([
      admin.tx.songs[songId].update({
        status: newStatus,
        generationProgress: stringifyGenerationProgress(updatedProgress as any),
      }),
    ]);

    // Call appropriate API
    const baseUrl = process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';

    let taskId: string;
    if (phase === 'lyrics') {
      // Call lyrics API
      const res = await fetch(`${baseUrl}/api/suno/lyrics`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: song.prompt || 'Romantic love song',
          callBackUrl: `${baseUrl}/api/suno/lyrics/callback?songId=${songId}`,
        }),
      });
      const data = await res.json();
      taskId = data.taskId;
    } else {
      // Call music API
      const res = await fetch(`${baseUrl}/api/suno`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          songId,
          title: song.title,
          lyrics: song.lyrics,
          musicStyle: song.musicStyle,
        }),
      });
      const data = await res.json();
      taskId = data.taskId;
    }

    return NextResponse.json({
      ok: true,
      message: 'Retry started',
      taskId,
      retryCount: currentRetries + 1,
    });
  } catch (error: any) {
    console.error('Retry error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

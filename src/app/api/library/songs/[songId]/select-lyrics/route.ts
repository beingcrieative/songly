import { NextRequest, NextResponse } from 'next/server';
import { getAdminDb } from '@/lib/adminDb';
import {
  parseLyricVariants,
  stringifyLyricVariants,
  parseGenerationProgress,
  stringifyGenerationProgress,
} from '@/types/generation';
import { getBaseUrl } from '@/lib/utils/getDeploymentUrl';

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ songId: string }> }
) {
  try {
    const { variantIndex } = await req.json();
    const { songId } = await params;

    // Validate
    if (typeof variantIndex !== 'number') {
      return NextResponse.json(
        { error: 'variantIndex required' },
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

    // Parse variants
    const variants = parseLyricVariants(song.lyricsVariants);
    if (!variants || variantIndex >= variants.length) {
      return NextResponse.json(
        { error: 'Invalid variant index' },
        { status: 400 }
      );
    }

    // Update variants: mark selected
    const updatedVariants = variants.map((v, i) => ({
      ...v,
      selected: i === variantIndex,
    }));

    // Update progress
    const progress = parseGenerationProgress(song.generationProgress);
    const updatedProgress = {
      ...progress,
      musicStartedAt: Date.now(),
      musicError: null,
    };

    // Update song
    await admin.transact([
      admin.tx.songs[songId].update({
        status: 'generating_music',
        lyrics: updatedVariants[variantIndex].text,
        lyricsVariants: stringifyLyricVariants(updatedVariants),
        generationProgress: stringifyGenerationProgress(updatedProgress as any),
      }),
    ]);

    // Start music generation
    const baseUrl = getBaseUrl();
    const sunoUrl = `${baseUrl}/api/suno`;

    console.log('[Select Lyrics] Starting music generation:', {
      songId,
      baseUrl,
      sunoUrl,
      title: song.title,
      lyricsLength: updatedVariants[variantIndex].text?.length,
    });

    const musicRes = await fetch(sunoUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        songId,
        title: song.title || 'Jouw Liedje',
        lyrics: updatedVariants[variantIndex].text,
        musicStyle: song.musicStyle || 'romantic ballad',
        model: 'V4',
      }),
    });

    if (!musicRes.ok) {
      const errorText = await musicRes.text();
      let errorMessage = 'Failed to start music generation';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || errorMessage;
      } catch (e) {
        errorMessage = errorText || errorMessage;
      }
      console.error('[Select Lyrics] Music generation failed:', {
        status: musicRes.status,
        statusText: musicRes.statusText,
        error: errorMessage,
        response: errorText,
      });
      throw new Error(errorMessage);
    }

    const musicData = await musicRes.json();

    return NextResponse.json({
      ok: true,
      message: 'Variant selected, music generation started',
      taskId: musicData.taskId,
    });
  } catch (error: any) {
    console.error('Select lyrics error:', error);
    return NextResponse.json(
      { error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}

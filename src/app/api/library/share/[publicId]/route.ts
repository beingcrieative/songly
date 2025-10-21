import { NextRequest, NextResponse } from "next/server";
import { getAdminDb } from "@/lib/adminDb";

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ publicId: string }> }
) {
  const { publicId } = await context.params;
  if (!publicId) {
    return NextResponse.json({ error: "Public ID is required" }, { status: 400 });
  }

  const admin = getAdminDb();
  if (!admin) {
    return NextResponse.json({ error: "Admin not configured" }, { status: 500 });
  }

  try {
    const { songs } = await admin.query({
      songs: {
        $: {
          where: {
            publicId,
            isPublic: true,
          },
        } as any,
        variants: {
          $: {
            order: { order: "asc" as const },
          } as any,
        },
      },
    });

    const song = songs?.[0];
    if (!song) {
      return NextResponse.json({ error: "Song not found" }, { status: 404 });
    }

    return NextResponse.json({
      id: song.id,
      title: song.title,
      imageUrl: song.imageUrl,
      lyricsSnippet: song.lyricsSnippet,
      streamAudioUrl: song.streamAudioUrl,
      audioUrl: song.audioUrl,
      variants: song.variants?.map((variant: any) => ({
        trackId: variant.trackId,
        title: variant.title,
        streamAudioUrl: variant.streamAudioUrl,
        audioUrl: variant.audioUrl,
        imageUrl: variant.imageUrl,
      })),
    });
  } catch (error: any) {
    console.error("Failed to load public song", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load song" },
      { status: 500 }
    );
  }
}


"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";

function guessAudioMimeType(url?: string | null) {
  if (!url) return "audio/mpeg";
  const base = url.split("?")[0]?.toLowerCase() ?? "";
  if (base.endsWith(".m3u8") || base.endsWith(".m3u")) return "application/vnd.apple.mpegurl";
  if (base.endsWith(".aac")) return "audio/aac";
  if (base.endsWith(".wav")) return "audio/wav";
  if (base.endsWith(".ogg") || base.endsWith(".oga")) return "audio/ogg";
  if (base.endsWith(".webm")) return "audio/webm";
  if (base.endsWith(".mp4") || base.endsWith(".m4a")) return "audio/mp4";
  return "audio/mpeg";
}

export default function ShareSongPage() {
  const params = useParams<{ publicId: string }>();
  const publicId = params?.publicId || "";

  // Query for the public song - no auth required
  const { data, isLoading, error } = db.useQuery({
    songs: {
      $: {
        where: {
          publicId,
          isPublic: true,
        },
        limit: 1,
      } as any,
      variants: {
        $: {
          order: { order: "asc" as const },
        },
      },
    },
  });

  const song = data?.songs?.[0];

  // Process variants with proper URL fallbacks
  const variants = useMemo(() => {
    if (!song?.variants || !Array.isArray(song.variants)) return [];

    return song.variants.map((v: any, index: number) => ({
      key: v.id || `variant-${index}`,
      trackId: v.trackId || v.id || `variant-${index}`,
      title: v.title || `${song?.title} – variant ${index + 1}`,
      playbackUrl: v.streamAudioUrl || v.audioUrl || v.sourceStreamAudioUrl || v.sourceAudioUrl || null,
      audioUrl: v.audioUrl || null,
      imageUrl: v.imageUrl || song?.imageUrl || null,
      duration: v.durationSeconds ?? null,
      order: v.order ?? index,
    }));
  }, [song?.variants, song?.imageUrl, song?.title]);

  // Get primary playback URL
  const primaryVariant = variants[0];
  const playbackUrl =
    primaryVariant?.playbackUrl ||
    song?.streamAudioUrl ||
    song?.audioUrl ||
    song?.sourceStreamAudioUrl ||
    song?.sourceAudioUrl ||
    null;

  const coverImage = primaryVariant?.imageUrl || song?.imageUrl;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-20">
          <div className="text-sm text-slate-600">Laden...</div>
        </main>
      </div>
    );
  }

  if (error || !song) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
        <main className="mx-auto flex w-full max-w-3xl flex-col items-center justify-center gap-6 px-4 py-20">
          <div className="text-center">
            <h1 className="text-2xl font-bold text-slate-900">Lied niet gevonden</h1>
            <p className="mt-2 text-sm text-slate-600">
              Dit lied bestaat niet of is niet meer gedeeld.
            </p>
            <Link
              href="/studio"
              className="mt-6 inline-block rounded-full bg-rose-500 px-6 py-2.5 text-sm font-semibold text-white shadow-md hover:bg-rose-600"
            >
              Ga naar Studio
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-12">
        <header className="text-center">
          <h1 className="text-3xl font-bold text-slate-900">{song.title || "Gedeeld lied"}</h1>
          <p className="mt-2 text-sm text-slate-600">
            Luister naar dit liefdesliedje. Wil je jouw eigen versie maken?{" "}
            <Link href="/studio" className="font-semibold text-rose-600 hover:text-rose-700">
              Ga naar studio
            </Link>
            .
          </p>
        </header>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
          {coverImage ? (
            <img
              src={coverImage}
              alt={song.title || "Cover"}
              className="h-64 w-full object-cover"
            />
          ) : null}

          <div className="space-y-4 p-6">
            {song.status === 'generating' ? (
              <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                🎵 Dit lied wordt nog gegenereerd. De pagina wordt automatisch bijgewerkt wanneer het klaar is.
              </div>
            ) : song.status === 'failed' ? (
              <div className="rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
                ❌ Er is een fout opgetreden bij het genereren van dit lied.
              </div>
            ) : null}

            {playbackUrl ? (
              <>
                <audio
                  controls
                  className="w-full"
                  src={playbackUrl}
                  preload="metadata"
                >
                  <source src={playbackUrl} type={guessAudioMimeType(playbackUrl)} />
                  Je browser ondersteunt geen audio afspelen.
                </audio>

                {song.musicStyle && (
                  <p className="text-xs text-slate-500">
                    <span className="font-semibold">Stijl:</span> {song.musicStyle}
                  </p>
                )}
              </>
            ) : (
              <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Audio nog niet beschikbaar. De pagina wordt automatisch bijgewerkt.
              </div>
            )}

            {song.lyricsSnippet && (
              <div className="border-t border-slate-100 pt-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {song.lyricsSnippet}
                </p>
              </div>
            )}

            {song.lyrics && !song.lyricsSnippet && (
              <div className="border-t border-slate-100 pt-4">
                <p className="max-h-60 overflow-y-auto whitespace-pre-line text-sm leading-relaxed text-slate-700">
                  {song.lyrics}
                </p>
              </div>
            )}
          </div>
        </div>

        <div className="text-center">
          <Link
            href="/studio"
            className="inline-block rounded-full bg-rose-500 px-8 py-3 text-sm font-semibold text-white shadow-md hover:bg-rose-600"
          >
            Maak jouw eigen liefdesliedje
          </Link>
        </div>
      </main>
    </div>
  );
}

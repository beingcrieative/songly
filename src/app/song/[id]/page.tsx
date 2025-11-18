"use client";

import { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { db } from "@/lib/db";
import NavTabs from "@/components/mobile/NavTabs";
import ChatHeader from "@/components/mobile/ChatHeader";
import SongStatusBadge from "@/components/SongStatusBadge";
import type { SongStatus } from "@/types/generation";

type Song = any;

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

function parseCallbackTracks(song: any) {
  if (!song?.callbackData) return [] as any[];
  try {
    const parsed = JSON.parse(song.callbackData);
    const raw = Array.isArray(parsed) ? parsed : Array.isArray(parsed?.data) ? parsed.data : [];
    return (raw || []).map((track: any, index: number) => ({
      key: track.trackId || track.track_id || `${song.id}-cb-${index}`,
      trackId: track.trackId || track.track_id || `${song.id}-cb-${index}`,
      title: track.title || `${song.title} – variant ${index + 1}`,
      playbackUrl: track.streamAudioUrl || track.stream_audio_url || track.audioUrl || track.audio_url || track.sourceStreamAudioUrl || track.source_stream_audio_url || track.sourceAudioUrl || track.source_audio_url || null,
      imageUrl: track.imageUrl || track.image_url || song.imageUrl || null,
      duration: typeof track.durationSeconds === 'number' ? track.durationSeconds : (typeof track.duration === 'number' ? track.duration : null),
      model: track.modelName || track.model_name || song.modelName || null,
      sourceAudioUrl: track.sourceAudioUrl || track.source_audio_url || null,
      audioUrl: track.audioUrl || track.audio_url || null,
      order: index,
    }));
  } catch {
    return [] as any[];
  }
}

export default function SongDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const songId = (params?.id as string) || "";
  const auth = db.useAuth();

  const { data, isLoading, error } = db.useQuery(
    auth.user?.id ? {
      songs: {
        $: { where: { id: songId }, limit: 1 } as any,
        variants: { $: { order: { order: 'asc' } } },
      },
    } : {}
  );

  const song: Song | undefined = data?.songs?.[0];
  const relationVariants = useMemo(() => {
    const arr = Array.isArray((song as any)?.variants) ? ((song as any).variants as Array<any>) : [];
    return arr.map((v: any, index: number) => ({
      key: v.id || `${songId}-rel-${index}`,
      trackId: v.trackId || v.id || `${songId}-rel-${index}`,
      title: v.title || `${song?.title} – versie ${index + 1}`,
      playbackUrl: v.streamAudioUrl || v.audioUrl || v.sourceStreamAudioUrl || v.sourceAudioUrl || null,
      imageUrl: v.imageUrl || song?.imageUrl || null,
      duration: v.durationSeconds ?? song?.durationSeconds ?? null,
      model: v.modelName || song?.modelName || null,
      sourceAudioUrl: v.sourceAudioUrl || null,
      audioUrl: v.audioUrl || null,
      order: v.order ?? index,
    }));
  }, [songId, song?.variants, song?.imageUrl, song?.modelName, song?.durationSeconds, song?.title]);

  const callbackVariants = useMemo(() => parseCallbackTracks(song), [song?.callbackData]);
  const basePlaybackUrl = song?.streamAudioUrl || song?.audioUrl || song?.sourceStreamAudioUrl || song?.sourceAudioUrl || null;

  const mergedVariants = useMemo(() => {
    const map = new Map<string, any>();
    relationVariants.forEach((v) => map.set(v.trackId || v.key, v));
    callbackVariants.forEach((t: any) => {
      const key = t.trackId || t.key;
      const ex = map.get(key) || t;
      map.set(key, {
        ...ex,
        title: t.title || ex.title,
        playbackUrl: t.playbackUrl || ex.playbackUrl || basePlaybackUrl,
        imageUrl: t.imageUrl || ex.imageUrl,
        duration: typeof t.duration === 'number' ? t.duration : ex.duration,
        model: t.model || ex.model,
        audioUrl: t.audioUrl || ex.audioUrl,
        sourceAudioUrl: t.sourceAudioUrl || ex.sourceAudioUrl,
        order: typeof t.order === 'number' ? t.order : ex.order,
      });
    });
    if (!map.size && song) {
      const key = song.sunoTrackId || song.id;
      map.set(key, {
        key,
        trackId: key,
        title: song.title,
        playbackUrl: basePlaybackUrl,
        imageUrl: song.imageUrl,
        duration: song.durationSeconds,
        model: song.modelName,
        audioUrl: song.audioUrl,
        sourceAudioUrl: song.sourceAudioUrl,
        order: 0,
      });
    }
    return Array.from(map.values()).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  }, [relationVariants, callbackVariants, basePlaybackUrl, song]);

  const playable = mergedVariants.filter((v) => v.playbackUrl || v.audioUrl || v.sourceAudioUrl);
  const heroVariant = playable[0] || mergedVariants[0];
  const heroPlaybackUrl =
    heroVariant?.playbackUrl || heroVariant?.audioUrl || heroVariant?.sourceAudioUrl || basePlaybackUrl;
  const heroImage = heroVariant?.imageUrl || song?.imageUrl;
  const secondaryVariants = mergedVariants.filter((variant) => variant !== heroVariant);

  const [isSharing, setIsSharing] = useState(false);
  const [shareMessage, setShareMessage] = useState<string | null>(null);

  if (isLoading) {
    return (
      <>
        <div className="flex min-h-[70vh] items-center justify-center text-slate-500">Laden...</div>
        <NavTabs />
      </>
    );
  }

  if (error || !song) {
    return (
      <>
        <div className="flex min-h-[70vh] items-center justify-center text-rose-600">Kon lied niet laden</div>
        <NavTabs />
      </>
    );
  }

  const handleShare = async () => {
    if (typeof window === "undefined") return;
    const url = song.publicId
      ? `${window.location.origin}/library/share/${song.publicId}`
      : window.location.href;
    try {
      setIsSharing(true);
      if (navigator.share) {
        await navigator.share({ title: song.title || "Liefdesliedje", url });
      } else {
        await navigator.clipboard?.writeText(url);
        setShareMessage("Link gekopieerd naar klembord");
        setTimeout(() => setShareMessage(null), 3000);
      }
    } catch (error) {
      console.warn("Share annulled", error);
    } finally {
      setIsSharing(false);
    }
  };

  const handleMakeAnother = () => {
    const templateParam = song.templateId ? `?templateId=${song.templateId}` : "";
    router.push(`/studio${templateParam}`);
  };

  return (
    <>
      <div className="min-h-[100svh] bg-white pb-28">
        <ChatHeader
          title={song.title || "Liedje"}
          subtitle={song.musicStyle || "Persoonlijk lied"}
        />

        <main className="mx-auto max-w-md space-y-6 px-4 py-5">
          <section className="rounded-4xl border border-[rgba(31,27,45,0.08)] bg-gradient-to-b from-rose-500/10 via-white to-white p-5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-[rgba(31,27,45,0.45)]">
                  Versie {song.version}
                </p>
                <h1 className="text-2xl font-semibold text-[rgba(31,27,45,0.95)]">
                  {song.title || "Liefdesliedje"}
                </h1>
                <p className="text-sm text-[rgba(31,27,45,0.6)]">{song.musicStyle}</p>
              </div>
              {song.status && <SongStatusBadge status={song.status as SongStatus} />}
            </div>
            {heroImage && (
              <img
                src={heroImage}
                alt="Song cover"
                className="mt-4 h-48 w-full rounded-3xl object-cover"
              />
            )}
            {heroPlaybackUrl ? (
              <audio
                controls
                preload="metadata"
                className="mt-4 w-full rounded-3xl"
              >
                <source src={heroPlaybackUrl} type={guessAudioMimeType(heroPlaybackUrl)} />
              </audio>
            ) : (
              <div className="mt-4 rounded-3xl border border-dashed border-[rgba(31,27,45,0.15)] px-4 py-3 text-sm text-[rgba(31,27,45,0.6)]">
                Audio nog niet beschikbaar.
              </div>
            )}
          </section>

          {secondaryVariants.length ? (
            <section className="space-y-3">
              <h2 className="text-sm font-semibold text-[rgba(31,27,45,0.8)]">Andere versies</h2>
              <div className="space-y-3">
                {secondaryVariants.map((variant: any) => {
                  const playbackUrl = variant.playbackUrl || variant.audioUrl || variant.sourceAudioUrl;
                  return (
                    <div
                      key={variant.key || variant.trackId}
                      className="rounded-3xl border border-[rgba(31,27,45,0.08)] bg-white/95 p-4 shadow-sm"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold text-[rgba(31,27,45,0.9)]">
                            {variant.title}
                          </p>
                          <p className="text-xs text-[rgba(31,27,45,0.5)]">
                            {variant.model || "Suno variant"}
                          </p>
                        </div>
                        {variant.duration && (
                          <span className="text-xs text-[rgba(31,27,45,0.5)]">
                            {Math.floor(variant.duration / 60)}:{String(Math.floor(variant.duration % 60)).padStart(2, "0")}
                          </span>
                        )}
                      </div>
                      {playbackUrl ? (
                        <audio controls preload="metadata" className="mt-3 w-full rounded-2xl">
                          <source src={playbackUrl} type={guessAudioMimeType(playbackUrl)} />
                        </audio>
                      ) : (
                        <div className="mt-3 rounded-2xl border border-dashed border-[rgba(31,27,45,0.15)] px-3 py-2 text-xs text-[rgba(31,27,45,0.55)]">
                          Audio nog niet beschikbaar
                        </div>
                      )}
                      <div className="mt-3 flex gap-2">
                        <a
                          href={variant.audioUrl || variant.sourceAudioUrl || undefined}
                          download
                          className={`flex-1 rounded-full px-3 py-2 text-center text-xs font-semibold ${
                            variant.audioUrl || variant.sourceAudioUrl
                              ? "border border-[rgba(31,27,45,0.12)] text-[rgba(31,27,45,0.75)]"
                              : "cursor-not-allowed border border-dashed border-[rgba(31,27,45,0.12)] text-[rgba(31,27,45,0.4)]"
                          }`}
                          onClick={(event) => {
                            if (!(variant.audioUrl || variant.sourceAudioUrl)) event.preventDefault();
                          }}
                        >
                          Download
                        </a>
                        {variant.streamAudioUrl && (
                          <a
                            href={variant.streamAudioUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="flex-1 rounded-full border border-[rgba(31,27,45,0.12)] px-3 py-2 text-center text-xs font-semibold text-[rgba(31,27,45,0.75)]"
                          >
                            Open stream
                          </a>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          ) : null}

          {song.lyrics && (
            <section className="rounded-4xl border border-[rgba(31,27,45,0.08)] bg-white/95 p-5 shadow-sm">
              <h2 className="text-sm font-semibold text-[rgba(31,27,45,0.8)]">Lyrics</h2>
              <div className="mt-2 max-h-[360px] overflow-y-auto whitespace-pre-wrap text-sm leading-relaxed text-[rgba(31,27,45,0.85)]">
                {song.lyrics}
              </div>
            </section>
          )}

          <div className="space-y-3">
            {shareMessage && (
              <div className="rounded-full bg-emerald-50 px-4 py-2 text-center text-xs font-semibold text-emerald-600">
                {shareMessage}
              </div>
            )}
            <button
              type="button"
              onClick={handleShare}
              disabled={isSharing}
              className="w-full rounded-full bg-gradient-to-r from-rose-500 to-amber-400 px-4 py-3 text-sm font-semibold text-white shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSharing ? "Delen…" : "Deel dit liedje"}
            </button>
            <button
              type="button"
              onClick={handleMakeAnother}
              className="w-full rounded-full border border-[rgba(31,27,45,0.12)] px-4 py-3 text-sm font-semibold text-[rgba(31,27,45,0.8)]"
            >
              Maak nog een liedje
            </button>
          </div>
        </main>

        <NavTabs />
      </div>
    </>
  );
}


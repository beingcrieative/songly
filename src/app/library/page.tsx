"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import LoginScreen from "@/components/auth/LoginScreen";
import AudioMiniPlayer from "@/components/AudioMiniPlayer";
import NavTabs from "@/components/mobile/NavTabs";
import ChatHeader from "@/components/mobile/ChatHeader";
import SongStatusBadge from "@/components/SongStatusBadge";
import { useLibrarySongs, useLibraryConversations } from "@/lib/library/queries";
import { sortSongsByPriority } from "@/lib/library/sorting";
import LyricsChoiceModal from "@/components/LyricsChoiceModal";
import { parseLyricVariants, parseGenerationProgress } from "@/types/generation";
import type { SongStatus } from "@/types/generation";
import {
  trackLibraryDelete,
  trackLibraryOpen,
  trackLibraryPlay,
  trackLibraryShare,
  trackGenerationRetry,
} from "@/lib/analytics/events";
import { useI18n } from "@/providers/I18nProvider";
import { createSnippet } from "@/lib/library/utils";

interface CurrentPlaybackState {
  id: string;
  title: string;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

const STATUS_CHIPS = [
  { value: "all", label: "Alles" },
  { value: "ready", label: "Klaar" },
  { value: "lyrics_ready", label: "Lyrics" },
  { value: "generating_music", label: "Bezig" },
  { value: "failed", label: "Mislukt" },
];

type SongVariant = {
  trackId: string;
  title?: string | null;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
};

export default function LibraryPage() {
  const router = useRouter();
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const { strings } = useI18n();

  const [songSearch, setSongSearch] = useState("");
  const [songStatus, setSongStatus] = useState("all");
  const [songSort, setSongSort] = useState("action");
  const [shareLoadingId, setShareLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null);
  const [currentPlayback, setCurrentPlayback] = useState<CurrentPlaybackState | null>(null);
  const [lyricsModalOpen, setLyricsModalOpen] = useState(false);
  const [selectedSongForLyrics, setSelectedSongForLyrics] = useState<any>(null);

  const songsQuery = useLibrarySongs(userId, {
    search: songSearch,
    status: songStatus as any,
    sort: songSort as any,
  });

  const conversationsQuery = useLibraryConversations(userId, {
    search: undefined,
    status: "all",
    sort: "recent",
  });

  const songs = useMemo(() => {
    const rawSongs = songsQuery.data?.songs ?? [];
    if (songSort === "action") {
      return sortSongsByPriority(rawSongs);
    }
    return rawSongs;
  }, [songsQuery.data?.songs, songSort]);

  const conversations = conversationsQuery.data?.conversations ?? [];

  useEffect(() => {
    if (userId) {
      trackLibraryOpen({ userId });
    }
  }, [userId]);

  const handleChooseLyrics = (song: any) => {
    setSelectedSongForLyrics(song);
    setLyricsModalOpen(true);
  };

  const handleSelectVariant = async (variantIndex: number) => {
    if (!selectedSongForLyrics) return;

    const res = await fetch(`/api/library/songs/${selectedSongForLyrics.id}/select-lyrics`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ variantIndex }),
    });

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || "Failed to select lyrics");
    }
  };

  const handleRetry = async (songId: string, phase: "lyrics" | "music") => {
    setRetryLoadingId(songId);
    try {
      const res = await fetch(`/api/library/songs/${songId}/retry`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phase }),
      });

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Retry mislukt");
      }

      const data = await res.json();

      trackGenerationRetry({
        songId,
        phase,
        retryCount: data.retryCount || 1,
      });

      alert("Opnieuw proberen gestart!");
    } catch (error: any) {
      alert(error.message || "Retry mislukt");
    } finally {
      setRetryLoadingId(null);
    }
  };

  const handlePlay = async (songId: string, variant: SongVariant) => {
    setCurrentPlayback({
      id: variant.trackId,
      title: variant.title || "Versie",
      streamAudioUrl: variant.streamAudioUrl,
      audioUrl: variant.audioUrl,
      imageUrl: variant.imageUrl,
    });

    trackLibraryPlay({ songId, variantId: variant.trackId });

    try {
      await fetch(`/api/library/songs/${songId}/play`, { method: "POST" });
    } catch (error) {
      console.warn("Failed to update play timestamp", error);
    }
  };

  const handleDeleteSong = async (songId: string) => {
    setDeleteLoadingId(songId);
    try {
      const res = await fetch(`/api/library/songs/${songId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Verwijderen mislukt");
      }
      trackLibraryDelete({ songId });
    } catch (error: any) {
      alert(error.message || "Verwijderen mislukt");
    } finally {
      setDeleteLoadingId(null);
    }
  };

  const handleShareSong = async (song: any) => {
    setShareLoadingId(song.id);
    try {
      if (!song.isPublic) {
        const res = await fetch(`/api/library/songs/${song.id}/share`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "enable" }),
        });
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body.error || "Link delen mislukt");
        }
        const result = await res.json();
        const publicId = result.publicId || result.song?.publicId;
        if (publicId) {
          const shareUrl = `${window.location.origin}/library/share/${publicId}`;
          await navigator.clipboard?.writeText(shareUrl);
          trackLibraryShare({ songId: song.id, publicId });
          alert("Deelbare link gekopieerd naar klembord");
        }
      } else if (song.publicId) {
        const shareUrl = `${window.location.origin}/library/share/${song.publicId}`;
        await navigator.clipboard?.writeText(shareUrl);
        trackLibraryShare({ songId: song.id, publicId: song.publicId });
        alert("Deelbare link gekopieerd naar klembord");
      }
    } catch (error: any) {
      alert(error.message || "Link delen mislukt");
    } finally {
      setShareLoadingId(null);
    }
  };

  const handleSelectAudioVariant = async (songId: string, variantId: string) => {
    try {
      await fetch(`/api/library/songs/${songId}/share`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ selectedVariantId: variantId }),
      });
    } catch (error) {
      console.warn("Failed to set selected variant", error);
    }
  };

  const groupedSongs = useMemo(() => {
    if (!songs || songs.length === 0) return [] as Array<{ key: string; title: string; songs: any[] }>;
    const map = new Map<string, { key: string; title: string; songs: any[] }>();
    songs.forEach((song: any) => {
      const raw = song.conversation?.conceptTitle?.trim();
      const key = (raw || "losse-liedjes").toLowerCase();
      if (!map.has(key)) {
        map.set(key, {
          key,
          title: raw || "Losse liedjes",
          songs: [],
        });
      }
      map.get(key)!.songs.push(song);
    });
    return Array.from(map.values()).map((group) => ({
      ...group,
      songs: group.songs.sort((a, b) => (b.updatedAt || 0) - (a.updatedAt || 0)),
    }));
  }, [songs]);

  const activeConversations = useMemo(() => {
    return conversations.filter((conversation: any) => conversation.conversationPhase !== "complete");
  }, [conversations]);

  const librarySubtitle = songs.length
    ? `${songs.length} ${songs.length === 1 ? "liedje" : "liedjes"} opgeslagen`
    : "Nog geen liedjes opgeslagen";

  if (auth.isLoading) {
    return (
      <>
        <div className="flex min-h-[70vh] items-center justify-center text-slate-500">
          {strings.library.loading}
        </div>
        <NavTabs />
      </>
    );
  }

  if (!auth.user) {
    return (
      <>
        <LoginScreen />
        <NavTabs />
      </>
    );
  }

  return (
    <>
      <div className="min-h-[100svh] bg-gradient-to-b from-rose-50 via-white to-white pb-32">
        <ChatHeader
          title="Bibliotheek"
          subtitle={librarySubtitle}
          onNew={() => router.push("/studio")}
        />

        <main className="mx-auto max-w-md space-y-6 px-4 py-5">
          <section className="rounded-3xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-4 shadow-sm">
            <label className="text-[11px] font-semibold uppercase tracking-[0.2em] text-[rgba(15,23,42,0.45)]">
              Zoek liedjes
            </label>
            <input
              type="search"
              value={songSearch}
              onChange={(event) => setSongSearch(event.target.value)}
              placeholder={strings.library.searchSongsPlaceholder}
              className="mt-2 w-full rounded-2xl border border-[rgba(15,23,42,0.12)] px-4 py-2 text-sm"
            />
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1">
              {STATUS_CHIPS.map((chip) => (
                <button
                  key={chip.value}
                  type="button"
                  onClick={() => setSongStatus(chip.value)}
                  className={`rounded-full px-3 py-1 text-xs font-semibold transition ${
                    songStatus === chip.value
                      ? "bg-rose-500 text-white"
                      : "border border-[rgba(15,23,42,0.15)] text-[rgba(15,23,42,0.8)]"
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </section>

          {activeConversations.length ? (
            <section className="space-y-3">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-[rgba(15,23,42,0.85)]">Concepten om te vervolgen</h2>
                <button
                  type="button"
                  onClick={() => router.push("/studio")}
                  className="text-xs font-semibold text-rose-500"
                >
                  Open studio
                </button>
              </div>
              <div className="space-y-3">
                {activeConversations.slice(0, 3).map((conversation: any) => (
                  <ConversationPeek
                    key={conversation.id}
                    conversation={conversation}
                    onOpen={() => router.push(`/studio?conversationId=${conversation.id}`)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {groupedSongs.length ? (
            groupedSongs.map((group) => (
              <section key={group.key} className="space-y-3">
                <div className="flex items-center justify-between">
                  <h2 className="text-sm font-semibold text-[rgba(15,23,42,0.85)]">{group.title}</h2>
                  <span className="text-xs text-[rgba(15,23,42,0.55)]">{group.songs.length}×</span>
                </div>
                <div className="space-y-3">
                  {group.songs.map((song: any) => (
                    <MobileSongRow
                      key={song.id}
                      song={song}
                      onPlay={(variant) => handlePlay(song.id, variant)}
                      onOpen={() => router.push(`/studio?songId=${song.id}`)}
                      onShare={() => handleShareSong(song)}
                      onDelete={() => handleDeleteSong(song.id)}
                      onChooseLyrics={() => handleChooseLyrics(song)}
                      onRetry={() => handleRetry(song.id, song.status === "failed" ? "music" : "lyrics")}
                      onSelectVariant={(variantId) => handleSelectAudioVariant(song.id, variantId)}
                      actionState={{
                        isSharing: shareLoadingId === song.id,
                        isDeleting: deleteLoadingId === song.id,
                        isRetrying: retryLoadingId === song.id,
                      }}
                    />
                  ))}
                </div>
              </section>
            ))
          ) : (
            <div className="rounded-3xl border border-dashed border-[rgba(15,23,42,0.12)] bg-white/70 p-6 text-center text-sm text-[rgba(15,23,42,0.6)]">
              {strings.library.emptySongs}
            </div>
          )}
        </main>

        {currentPlayback && (
          <div className="fixed inset-x-0 bottom-[96px] z-40 px-4">
            <AudioMiniPlayer
              src={currentPlayback.streamAudioUrl || currentPlayback.audioUrl || ""}
              title={currentPlayback.title}
              imageUrl={currentPlayback.imageUrl || undefined}
              fixed={false}
            />
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push("/studio")}
          className="fixed bottom-[120px] right-4 z-40 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-rose-500 to-amber-400 px-5 py-3 text-sm font-semibold text-white shadow-lg"
        >
          Nieuw liedje
        </button>
      </div>

      <LyricsChoiceModal
        isOpen={lyricsModalOpen}
        onClose={() => setLyricsModalOpen(false)}
        variants={parseLyricVariants(selectedSongForLyrics?.lyricsVariants)}
        songId={selectedSongForLyrics?.id || ""}
        songTitle={selectedSongForLyrics?.title || "Ongetiteld"}
        onSelectVariant={handleSelectVariant}
      />

      <NavTabs />
    </>
  );
}

interface MobileSongRowProps {
  song: any;
  onPlay: (variant: SongVariant) => void;
  onOpen: () => void;
  onShare: () => void;
  onDelete: () => void;
  onChooseLyrics: () => void;
  onRetry: () => void;
  onSelectVariant: (variantId: string) => void;
  actionState?: {
    isSharing?: boolean;
    isDeleting?: boolean;
    isRetrying?: boolean;
  };
}

function MobileSongRow({
  song,
  onPlay,
  onOpen,
  onShare,
  onDelete,
  onChooseLyrics,
  onRetry,
  onSelectVariant,
  actionState,
}: MobileSongRowProps) {
  const variants: SongVariant[] = song.variants || [];
  const selectedVariant =
    variants.find((variant) => variant.trackId === song.selectedVariantId) || variants[0];
  const snippet = createSnippet(song.lyricsSnippet, 120);
  const hasAudio = Boolean(selectedVariant?.streamAudioUrl || selectedVariant?.audioUrl);
  const primaryCTA = getPrimaryCTA(song.status, hasAudio);
  const metadataText = getMetadataText(song);

  const handlePrimaryAction = () => {
    switch (primaryCTA.action) {
      case "play":
        if (selectedVariant) onPlay(selectedVariant);
        break;
      case "choose_lyrics":
        onChooseLyrics();
        break;
      case "retry":
        onRetry();
        break;
      case "view_details":
        onOpen();
        break;
    }
  };

  return (
    <div className="flex gap-3 rounded-3xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-3 shadow-sm">
      <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-2xl bg-rose-100">
        {song.imageUrl ? (
          <img src={song.imageUrl} alt={song.title || "cover"} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-[11px] font-semibold text-rose-600">
            Cover
          </div>
        )}
      </div>
      <div className="flex-1">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-semibold text-[rgba(15,23,42,0.9)] line-clamp-1">
              {song.title || "Ongetiteld lied"}
            </h3>
            <p className="text-[11px] text-[rgba(15,23,42,0.6)]">{metadataText}</p>
          </div>
          {song.status && <SongStatusBadge status={song.status as SongStatus} />}
        </div>
        {snippet && <p className="mb-2 text-xs text-[rgba(15,23,42,0.7)] line-clamp-2">{snippet}</p>}

        {variants.length > 1 && (
          <label className="mb-2 block text-[11px] font-medium text-[rgba(15,23,42,0.6)]">
            Versie
            <select
              className="mt-1 w-full rounded-2xl border border-[rgba(15,23,42,0.12)] px-3 py-1 text-xs"
              value={selectedVariant?.trackId || ""}
              onChange={(event) => onSelectVariant(event.target.value)}
            >
              {variants.map((variant, index) => (
                <option key={variant.trackId} value={variant.trackId}>
                  {variant.title || `Versie ${index + 1}`}
                </option>
              ))}
            </select>
          </label>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={primaryCTA.disabled || actionState?.isRetrying}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              primaryCTA.color === "emerald"
                ? "bg-emerald-500 text-white"
                : primaryCTA.color === "rose"
                  ? "bg-rose-500 text-white"
                  : primaryCTA.color === "rose-outline"
                    ? "border border-rose-200 text-rose-600"
                    : "border border-[rgba(15,23,42,0.12)] text-[rgba(15,23,42,0.8)]"
            }`}
          >
            {actionState?.isRetrying && primaryCTA.action === "retry" ? "Bezig…" : primaryCTA.label}
          </button>

          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1.5 text-xs font-semibold text-[rgba(15,23,42,0.75)]"
          >
            Studio
          </button>

          {song.status === "ready" && (
            <button
              type="button"
              onClick={onShare}
              disabled={actionState?.isSharing}
              className="rounded-full border border-[rgba(15,23,42,0.12)] px-3 py-1.5 text-xs font-semibold text-[rgba(15,23,42,0.75)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionState?.isSharing ? "Delen…" : "Deel"}
            </button>
          )}

          <button
            type="button"
            onClick={onDelete}
            disabled={actionState?.isDeleting}
            className="ml-auto rounded-full border border-rose-100 px-3 py-1.5 text-xs font-semibold text-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState?.isDeleting ? "Verwijderen…" : "Verwijder"}
          </button>
        </div>
      </div>
    </div>
  );
}

function getMetadataText(song: {
  status?: string | null;
  updatedAt?: number | null;
  generationProgress?: string | null;
}) {
  const progress = parseGenerationProgress(song.generationProgress);
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "zojuist";
    if (minutes === 1) return "1 minuut geleden";
    if (minutes < 60) return `${minutes} minuten geleden`;
    if (hours === 1) return "1 uur geleden";
    if (hours < 24) return `${hours} uur geleden`;
    if (days === 1) return "gisteren";
    return `${days} dagen geleden`;
  };

  switch (song.status) {
    case "lyrics_ready":
      if (progress?.lyricsCompletedAt) {
        return `Teksten klaar ${formatTimeAgo(progress.lyricsCompletedAt)}`;
      }
      break;
    case "ready":
      if (progress?.musicCompletedAt) {
        return `Klaar ${formatTimeAgo(progress.musicCompletedAt)}`;
      }
      break;
    case "generating_lyrics":
      if (progress?.lyricsStartedAt) {
        return `Tekst genereren sinds ${formatTimeAgo(progress.lyricsStartedAt)}`;
      }
      break;
    case "generating_music":
      if (progress?.musicStartedAt) {
        return `Muziek genereren sinds ${formatTimeAgo(progress.musicStartedAt)}`;
      }
      break;
  }

  if (song.updatedAt) {
    return `Bijgewerkt ${formatTimeAgo(song.updatedAt)}`;
  }

  return "Bijgewerkt onbekend";
}

interface StatusCTA {
  label: string;
  action: "play" | "choose_lyrics" | "retry" | "view_details";
  color: "rose" | "emerald" | "rose-outline" | "ghost";
  disabled?: boolean;
}

function getPrimaryCTA(status: string | null | undefined, hasAudio: boolean): StatusCTA {
  switch (status) {
    case "lyrics_ready":
      return { label: "Kies lyrics", action: "choose_lyrics", color: "rose" };
    case "ready":
      return { label: "▶️ Speel", action: "play", color: "emerald", disabled: !hasAudio };
    case "failed":
      return { label: "Probeer opnieuw", action: "retry", color: "rose-outline" };
    case "generating_lyrics":
    case "generating_music":
      return { label: "Bekijk", action: "view_details", color: "ghost" };
    default:
      return { label: "Afspelen", action: "play", color: "rose", disabled: !hasAudio };
  }
}

function ConversationPeek({ conversation, onOpen }: { conversation: any; onOpen: () => void }) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className="w-full rounded-3xl border border-[rgba(15,23,42,0.08)] bg-white/90 p-3 text-left shadow-sm"
    >
      <div className="text-xs font-semibold text-[rgba(15,23,42,0.55)]">{conversation.conversationPhase}</div>
      <div className="mt-1 text-sm font-semibold text-[rgba(15,23,42,0.9)] line-clamp-1">
        {conversation.conceptTitle || "Nieuw verhaal"}
      </div>
      {conversation.conceptLyrics && (
        <p className="mt-1 text-xs text-[rgba(15,23,42,0.65)] line-clamp-2">
          {conversation.conceptLyrics}
        </p>
      )}
      <div className="mt-2 text-[11px] text-[rgba(15,23,42,0.5)]">
        Laatste update: {new Date(conversation.updatedAt || Date.now()).toLocaleDateString()}
      </div>
    </button>
  );
}

"use client";

import { useEffect, useMemo, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { db } from "@/lib/db";
import LoginScreen from "@/components/auth/LoginScreen";
import AudioMiniPlayer from "@/components/AudioMiniPlayer";
import NavTabs from "@/components/mobile/NavTabs";
import { useMobileLibrarySongs, useMobileLibraryConversations } from "@/lib/library/queries";
import { sortSongsByPriority } from "@/lib/library/sorting";
import SongCard from "./components/SongCard";
import ConversationCard from "./components/ConversationCard";
import Filters from "./components/Filters";
import LyricsChoiceModal from "@/components/LyricsChoiceModal";
import { parseLyricVariants } from "@/types/generation";
import {
  trackLibraryDelete,
  trackLibraryOpen,
  trackLibraryPlay,
  trackLibraryShare,
  trackGenerationRetry,
} from "@/lib/analytics/events";
import { useI18n } from "@/providers/I18nProvider";

interface CurrentPlaybackState {
  id: string;
  title: string;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

/**
 * Notification Deep Link Handler
 * Handles songId query parameter from push notifications
 * Must be wrapped in Suspense because it uses useSearchParams()
 */
function NotificationHandler({
  songs,
  onOpenLyricsModal,
  onPlaySong,
}: {
  songs: any[];
  onOpenLyricsModal: (song: any) => void;
  onPlaySong: (songId: string, variant: any) => void;
}) {
  const searchParams = useSearchParams();

  useEffect(() => {
    const songId = searchParams.get('songId');
    if (!songId || !songs.length) return;

    // Find the song by ID
    const song = songs.find((s: any) => s.id === songId);
    if (!song) return;

    // If lyrics are ready, auto-open the lyrics choice modal
    if (song.status === 'lyrics_ready' && song.lyricsVariants) {
      onOpenLyricsModal(song);

      // Clear the songId from URL to prevent re-opening on refresh
      const url = new URL(window.location.href);
      url.searchParams.delete('songId');
      window.history.replaceState({}, '', url.toString());
    }
    // If music is ready, auto-play the first variant
    else if (song.status === 'ready' && song.variants?.length > 0) {
      const variant = song.variants[0];
      onPlaySong(song.id, {
        trackId: variant.trackId,
        streamAudioUrl: variant.streamAudioUrl,
        audioUrl: variant.audioUrl,
        title: song.title,
        imageUrl: variant.imageUrl,
      });

      // Clear the songId from URL
      const url = new URL(window.location.href);
      url.searchParams.delete('songId');
      window.history.replaceState({}, '', url.toString());
    }
  }, [searchParams, songs, onOpenLyricsModal, onPlaySong]);

  return null;
}

export default function LibraryPage() {
  const router = useRouter();
  const auth = db.useAuth();
  const userId = auth.user?.id;
  const { strings } = useI18n();

  const SONG_STATUS_OPTIONS = [
    { value: "all", label: "Alle" },
    { value: "lyrics_ready", label: "Klaar om te kiezen" },
    { value: "ready", label: "Klaar om te spelen" },
    { value: "generating_lyrics", label: "Tekst genereren" },
    { value: "generating_music", label: "Muziek genereren" },
    { value: "failed", label: "Mislukt" },
    { value: "complete", label: "Voltooid" },
  ];

  const SONG_SORT_OPTIONS = [
    { value: "action", label: "Actie vereist" },
    { value: "recent", label: strings.library.sortRecent },
    { value: "az", label: strings.library.sortAZ },
    { value: "played", label: strings.library.sortPlayed },
  ];

  const CONVERSATION_STATUS_OPTIONS = [
    { value: "all", label: strings.library.phaseAll },
    { value: "gathering", label: strings.library.phaseGathering },
    { value: "generating", label: strings.library.phaseGenerating },
    { value: "refining", label: strings.library.phaseRefining },
    { value: "complete", label: strings.library.phaseComplete },
  ];

  const CONVERSATION_SORT_OPTIONS = [
    { value: "recent", label: strings.library.sortRecent },
    { value: "az", label: strings.library.sortAZ },
  ];

  const [songSearch, setSongSearch] = useState("");
  const [songStatus, setSongStatus] = useState("all");
  const [songSort, setSongSort] = useState("action");
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationStatus, setConversationStatus] = useState("all");
  const [conversationSort, setConversationSort] = useState("recent");
  const [shareLoadingId, setShareLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null);
  const [currentPlayback, setCurrentPlayback] = useState<CurrentPlaybackState | null>(null);
  const [lyricsModalOpen, setLyricsModalOpen] = useState(false);
  const [selectedSongForLyrics, setSelectedSongForLyrics] = useState<any>(null);

  const songsQuery = useMobileLibrarySongs(userId, {
    search: songSearch,
    status: songStatus as any,
    sort: songSort as any,
  });

  const conversationsQuery = useMobileLibraryConversations(userId, {
    search: conversationSearch,
    status: conversationStatus as any,
    sort: conversationSort as any,
  });

  const songs = useMemo(() => {
    const rawSongs = songsQuery.data?.songs ?? [];

    // Apply smart sorting when "action" sort is selected
    if (songSort === 'action') {
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

    const res = await fetch(
      `/api/library/songs/${selectedSongForLyrics.id}/select-lyrics`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ variantIndex }),
      }
    );

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || 'Failed to select lyrics');
    }
  };

  const handleRetry = async (songId: string, phase: 'lyrics' | 'music') => {
    setRetryLoadingId(songId);
    try {
      const res = await fetch(
        `/api/library/songs/${songId}/retry`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ phase }),
        }
      );

      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || 'Retry mislukt');
      }

      const data = await res.json();

      // Track retry
      trackGenerationRetry({
        songId,
        phase,
        retryCount: data.retryCount || 1,
      });

      // Success feedback
      alert('Opnieuw proberen gestart!');
    } catch (error: any) {
      alert(error.message || 'Retry mislukt');
    } finally {
      setRetryLoadingId(null);
    }
  };

  // All remaining handlers and useMemos BEFORE early returns to ensure consistent hook order
  const handlePlay = async (songId: string, variant: { trackId: string; streamAudioUrl?: string | null; audioUrl?: string | null; title?: string | null; imageUrl?: string | null }) => {
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

  const handleDeleteConversation = async (conversationId: string) => {
    setDeleteLoadingId(conversationId);
    try {
      const res = await fetch(`/api/library/conversations/${conversationId}`, { method: "DELETE" });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error || "Verwijderen mislukt");
      }
      trackLibraryDelete({ conversationId });
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

  const songCards = useMemo(
    () => {
      if (!songs || songs.length === 0) return [];
      return songs.map((song: any) => (
        <SongCard
          key={song.id}
          song={song}
          onPlay={(variant) => handlePlay(song.id, variant)}
          onOpen={() => router.push(`/studio?songId=${song.id}`)}
          onShare={() => handleShareSong(song)}
          onDelete={() => handleDeleteSong(song.id)}
          onSelectVariant={(variantId) => handleSelectAudioVariant(song.id, variantId)}
          onChooseLyrics={() => handleChooseLyrics(song)}
          onRetry={() => {
            const phase = song.status === 'failed' ? 'music' : 'lyrics';
            handleRetry(song.id, phase);
          }}
          actionState={{
            isSharing: shareLoadingId === song.id,
            isDeleting: deleteLoadingId === song.id,
            isRetrying: retryLoadingId === song.id,
          }}
        />
      ));
    },
    [songs, router, shareLoadingId, deleteLoadingId, retryLoadingId]
  );

  const conversationCards = useMemo(
    () => {
      if (!conversations || conversations.length === 0) return [];
      return conversations.map((conversation: any) => (
        <ConversationCard
          key={conversation.id}
          title={conversation.conceptTitle || null}
          conceptLyrics={conversation.conceptLyrics || null}
          updatedAt={conversation.updatedAt}
          readinessScore={conversation.readinessScore}
          phase={conversation.conversationPhase}
          messages={conversation.messages}
          onOpen={() => router.push(`/studio?conversationId=${conversation.id}`)}
          onDelete={() => handleDeleteConversation(conversation.id)}
          isDeleting={deleteLoadingId === conversation.id}
        />
      ));
    },
    [conversations, router, deleteLoadingId]
  );

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
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      {/* Notification Deep Link Handler - wrapped in Suspense for useSearchParams() */}
      <Suspense fallback={null}>
        <NotificationHandler
          songs={songs}
          onOpenLyricsModal={(song) => {
            setSelectedSongForLyrics(song);
            setLyricsModalOpen(true);
          }}
          onPlaySong={handlePlay}
        />
      </Suspense>

      <main className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4 py-8 md:py-12">
        <header className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">{strings.library.title}</h1>
            <p className="text-sm text-slate-600">
              {strings.library.description}
            </p>
          </div>
        </header>

        {/* Songs Section */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Liedjes</h2>
          <Filters
            search={songSearch}
            onSearchChange={setSongSearch}
            status={songStatus}
            onStatusChange={setSongStatus}
            statusOptions={SONG_STATUS_OPTIONS}
            sort={songSort}
            onSortChange={setSongSort}
            sortOptions={SONG_SORT_OPTIONS}
            placeholder={strings.library.searchSongsPlaceholder}
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {songCards.length ? songCards : <EmptyState message={strings.library.emptySongs} />}
          </div>
        </section>

        {/* Conversations Section */}
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold text-slate-900">Gesprekken</h2>
          <Filters
            search={conversationSearch}
            onSearchChange={setConversationSearch}
            status={conversationStatus}
            onStatusChange={setConversationStatus}
            statusOptions={CONVERSATION_STATUS_OPTIONS}
            sort={conversationSort}
            onSortChange={setConversationSort}
            sortOptions={CONVERSATION_SORT_OPTIONS}
            placeholder="Zoek gesprekken..."
          />
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {conversationCards.length ? conversationCards : <EmptyState message="Nog geen gesprekken opgeslagen" />}
          </div>
        </section>
      </main>

      {currentPlayback && (
        <div className="fixed inset-x-0 bottom-4 z-40 mx-auto w-full max-w-xl px-4">
          <AudioMiniPlayer
            src={currentPlayback.streamAudioUrl || currentPlayback.audioUrl || ""}
            title={currentPlayback.title}
            imageUrl={currentPlayback.imageUrl || undefined}
            fixed={false}
          />
        </div>
      )}

      {/* Lyrics Choice Modal */}
      <LyricsChoiceModal
        isOpen={lyricsModalOpen}
        onClose={() => setLyricsModalOpen(false)}
        variants={parseLyricVariants(selectedSongForLyrics?.lyricsVariants)}
        songId={selectedSongForLyrics?.id || ''}
        songTitle={selectedSongForLyrics?.title || 'Ongetiteld'}
        onSelectVariant={handleSelectVariant}
      />

      <NavTabs />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div className="col-span-full flex min-h-[200px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white/60 text-sm text-slate-500">
      {message}
    </div>
  );
}

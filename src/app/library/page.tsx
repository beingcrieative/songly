"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { db } from "@/lib/db";
import LoginScreen from "@/components/auth/LoginScreen";
import AudioMiniPlayer from "@/components/AudioMiniPlayer";
import ServiceWorkerRegister from "@/components/pwa/ServiceWorkerRegister";
import NavTabs from "@/components/mobile/NavTabs";
import { useLibrarySongs, useLibraryConversations } from "@/lib/library/queries";
import SongCard from "./components/SongCard";
import ConversationCard from "./components/ConversationCard";
import Filters from "./components/Filters";
import {
  trackLibraryDelete,
  trackLibraryOpen,
  trackLibraryPlay,
  trackLibraryShare,
} from "@/lib/analytics/events";

type TabKey = "songs" | "conversations";

const SONG_STATUS_OPTIONS = [
  { value: "all", label: "Alle statussen" },
  { value: "ready", label: "Klaar" },
  { value: "generating", label: "Bezig" },
  { value: "failed", label: "Mislukt" },
];

const SONG_SORT_OPTIONS = [
  { value: "recent", label: "Laatst bijgewerkt" },
  { value: "az", label: "Naam A-Z" },
  { value: "played", label: "Recent afgespeeld" },
];

const CONVERSATION_STATUS_OPTIONS = [
  { value: "all", label: "Alle fases" },
  { value: "gathering", label: "Context" },
  { value: "generating", label: "Genereren" },
  { value: "refining", label: "Verfijnen" },
  { value: "complete", label: "Afgerond" },
];

const CONVERSATION_SORT_OPTIONS = [
  { value: "recent", label: "Laatst bijgewerkt" },
  { value: "az", label: "Naam A-Z" },
];

interface CurrentPlaybackState {
  id: string;
  title: string;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
}

export default function LibraryPage() {
  const router = useRouter();
  const auth = db.useAuth();
  const userId = auth.user?.id;

  const [activeTab, setActiveTab] = useState<TabKey>("songs");
  const [songSearch, setSongSearch] = useState("");
  const [songStatus, setSongStatus] = useState("all");
  const [songSort, setSongSort] = useState("recent");
  const [conversationSearch, setConversationSearch] = useState("");
  const [conversationStatus, setConversationStatus] = useState("all");
  const [conversationSort, setConversationSort] = useState("recent");
  const [shareLoadingId, setShareLoadingId] = useState<string | null>(null);
  const [deleteLoadingId, setDeleteLoadingId] = useState<string | null>(null);
  const [currentPlayback, setCurrentPlayback] = useState<CurrentPlaybackState | null>(null);

  const songsQuery = useLibrarySongs(userId, {
    search: songSearch,
    status: songStatus as any,
    sort: songSort as any,
  });

  const conversationsQuery = useLibraryConversations(userId, {
    search: conversationSearch,
    status: conversationStatus as any,
    sort: conversationSort as any,
  });

  const songs = songsQuery.data?.songs ?? [];
  const conversations = conversationsQuery.data?.conversations ?? [];

  useEffect(() => {
    if (userId) {
      trackLibraryOpen({ userId });
    }
  }, [userId]);

  if (auth.isLoading) {
    return (
      <>
        <div className="flex min-h-[70vh] items-center justify-center text-slate-500">
          Bibliotheek laden…
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

  const handleSelectVariant = async (songId: string, variantId: string) => {
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
    () =>
      songs.map((song: any) => (
        <SongCard
          key={song.id}
          song={song}
          onPlay={(variant) => handlePlay(song.id, variant)}
          onOpen={() => router.push(`/studio?songId=${song.id}`)}
          onShare={() => handleShareSong(song)}
          onDelete={() => handleDeleteSong(song.id)}
          onSelectVariant={(variantId) => handleSelectVariant(song.id, variantId)}
          actionState={{
            isSharing: shareLoadingId === song.id,
            isDeleting: deleteLoadingId === song.id,
          }}
        />
      )),
    [songs, router, shareLoadingId, deleteLoadingId]
  );

  const conversationCards = useMemo(
    () =>
      conversations.map((conversation: any) => (
        <ConversationCard
          key={conversation.id}
          title={conversation.conceptTitle || null}
          conceptLyrics={conversation.conceptLyrics || null}
          updatedAt={conversation.updatedAt}
          readinessScore={conversation.readinessScore}
          phase={conversation.conversationPhase}
          onOpen={() => router.push(`/studio?conversationId=${conversation.id}`)}
          onDelete={() => handleDeleteConversation(conversation.id)}
          isDeleting={deleteLoadingId === conversation.id}
        />
      )),
    [conversations, router, deleteLoadingId]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-rose-50 via-white to-white">
      <ServiceWorkerRegister />
      <main className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8 md:py-12">
        <header className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Je bibliotheek</h1>
            <p className="text-sm text-slate-600">
              Herbeluister je liedjes en open eerdere gesprekken om verder te verfijnen.
            </p>
          </div>
          <div className="flex rounded-full bg-white p-1 shadow">
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "songs"
                  ? "bg-rose-500 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("songs")}
            >
              Liedjes
            </button>
            <button
              type="button"
              className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                activeTab === "conversations"
                  ? "bg-rose-500 text-white"
                  : "text-slate-600 hover:text-slate-900"
              }`}
              onClick={() => setActiveTab("conversations")}
            >
              Gesprekken
            </button>
          </div>
        </header>

        {activeTab === "songs" ? (
          <>
            <Filters
              search={songSearch}
              onSearchChange={setSongSearch}
              status={songStatus}
              onStatusChange={setSongStatus}
              statusOptions={SONG_STATUS_OPTIONS}
              sort={songSort}
              onSortChange={setSongSort}
              sortOptions={SONG_SORT_OPTIONS}
              placeholder="Zoek op titel of lyrics"
            />
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {songCards.length ? songCards : <EmptyState message="Nog geen liedjes opgeslagen" />}
            </section>
          </>
        ) : (
          <>
            <Filters
              search={conversationSearch}
              onSearchChange={setConversationSearch}
              status={conversationStatus}
              onStatusChange={setConversationStatus}
              statusOptions={CONVERSATION_STATUS_OPTIONS}
              sort={conversationSort}
              onSortChange={setConversationSort}
              sortOptions={CONVERSATION_SORT_OPTIONS}
              placeholder="Zoek naar concept lyrics"
            />
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {conversationCards.length ? (
                conversationCards
              ) : (
                <EmptyState message="Nog geen gesprekken opgeslagen" />
              )}
            </section>
          </>
        )}
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

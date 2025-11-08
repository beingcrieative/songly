"use client";

import { memo, useMemo, useCallback } from "react";
import { createSnippet } from "@/lib/library/utils";
import SongStatusBadge from "@/components/SongStatusBadge";
import { parseGenerationProgress } from "@/types/generation";
import type { SongStatus } from "@/types/generation";
import ProgressBar from "./ProgressBar";

interface SongVariant {
  trackId: string;
  title?: string | null;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  order?: number | null;
}

interface SongCardProps {
  song: {
    id: string;
    title?: string | null;
    status?: string | null;
    imageUrl?: string | null;
    updatedAt?: number | null;
    lastViewedAt?: number | null;
    lyricsSnippet?: string | null;
    variants?: SongVariant[];
    selectedVariantId?: string | null;
    isPublic?: boolean | null;
    publicId?: string | null;
    // Async generation fields
    generationProgress?: string | null;
    lyricsVariants?: string | null;
    notificationsSent?: string | null;
  };
  onPlay: (variant: SongVariant) => void;
  onOpen: () => void;
  onSelectVariant: (variantId: string) => void;
  onShare: () => void;
  onDelete: () => void;
  onChooseLyrics?: () => void; // NEW
  onRetry?: () => void; // NEW
  actionState?: {
    isSharing?: boolean;
    isDeleting?: boolean;
    isRetrying?: boolean; // NEW
  };
}

interface StatusCTA {
  label: string;
  action: 'play' | 'choose_lyrics' | 'retry' | 'view_details';
  color: 'rose' | 'emerald' | 'rose-outline' | 'ghost';
  disabled?: boolean;
}

function getPrimaryCTA(status: string | null | undefined, hasAudio: boolean): StatusCTA {
  switch (status) {
    case 'lyrics_ready':
      return { label: 'Kies Lyrics →', action: 'choose_lyrics', color: 'rose' };
    case 'ready':
      return { label: '▶️ Speel af', action: 'play', color: 'emerald', disabled: !hasAudio };
    case 'failed':
      return { label: '🔄 Probeer opnieuw', action: 'retry', color: 'rose-outline' };
    case 'generating_lyrics':
    case 'generating_music':
      return { label: 'Details bekijken', action: 'view_details', color: 'ghost' };
    default:
      return { label: 'Afspelen', action: 'play', color: 'rose', disabled: !hasAudio };
  }
}

function getMetadataText(
  song: { status?: string | null; updatedAt?: number | null; lastViewedAt?: number | null; generationProgress?: string | null }
): string {
  const progress = parseGenerationProgress(song.generationProgress);

  // Format relative time in Dutch
  const formatTimeAgo = (timestamp: number): string => {
    const now = Date.now();
    const diff = now - timestamp;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return 'zojuist';
    if (minutes === 1) return '1 minuut geleden';
    if (minutes < 60) return `${minutes} minuten geleden`;
    if (hours === 1) return '1 uur geleden';
    if (hours < 24) return `${hours} uur geleden`;
    if (days === 1) return 'gisteren';
    return `${days} dagen geleden`;
  };

  switch (song.status) {
    case 'lyrics_ready':
      if (progress?.lyricsCompletedAt) {
        return `Teksten klaar ${formatTimeAgo(progress.lyricsCompletedAt)}`;
      }
      break;
    case 'ready':
      if (progress?.musicCompletedAt) {
        return `Klaar ${formatTimeAgo(progress.musicCompletedAt)}`;
      }
      break;
    case 'generating_lyrics':
      if (progress?.lyricsStartedAt) {
        return `Tekst genereren sinds ${formatTimeAgo(progress.lyricsStartedAt)}`;
      }
      break;
    case 'generating_music':
      if (progress?.musicStartedAt) {
        return `Muziek genereren sinds ${formatTimeAgo(progress.musicStartedAt)}`;
      }
      break;
  }

  // Fallback to updatedAt
  if (song.updatedAt) {
    return `Bijgewerkt ${formatTimeAgo(song.updatedAt)}`;
  }

  return 'Bijgewerkt onbekend';
}

function SongCardComponent({
  song,
  onPlay,
  onOpen,
  onSelectVariant,
  onShare,
  onDelete,
  onChooseLyrics,
  onRetry,
  actionState,
}: SongCardProps) {
  const variants = useMemo(() => song.variants || [], [song.variants]);
  const selectedVariant = useMemo(
    () => variants.find((v) => v.trackId === song.selectedVariantId) || variants[0],
    [variants, song.selectedVariantId]
  );
  const snippet = useMemo(() => createSnippet(song.lyricsSnippet, 140), [song.lyricsSnippet]);
  const hasAudio = useMemo(
    () => !!(selectedVariant?.streamAudioUrl || selectedVariant?.audioUrl),
    [selectedVariant]
  );
  const primaryCTA = useMemo(() => getPrimaryCTA(song.status, hasAudio), [song.status, hasAudio]);
  const metadataText = useMemo(() => getMetadataText(song), [song.status, song.updatedAt, song.lastViewedAt, song.generationProgress]);
  const progress = useMemo(() => parseGenerationProgress(song.generationProgress), [song.generationProgress]);

  const handlePlay = useCallback(() => {
    if (selectedVariant) {
      onPlay(selectedVariant);
    }
  }, [selectedVariant, onPlay]);

  const handlePrimaryAction = useCallback(() => {
    switch (primaryCTA.action) {
      case 'play':
        handlePlay();
        break;
      case 'choose_lyrics':
        onChooseLyrics?.();
        break;
      case 'retry':
        onRetry?.();
        break;
      case 'view_details':
        onOpen();
        break;
    }
  }, [primaryCTA.action, handlePlay, onChooseLyrics, onRetry, onOpen]);

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white/90 shadow-sm transition hover:shadow-md">
      <div className="relative h-44 w-full bg-slate-100">
        {song.imageUrl ? (
          <img
            src={song.imageUrl}
            alt={song.title || "Song cover"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            Geen cover
          </div>
        )}
        <div className="absolute left-3 top-3 flex items-center gap-2 text-xs">
          {song.status && (
            <SongStatusBadge status={song.status as SongStatus} />
          )}
          {song.isPublic ? (
            <span className="rounded-full bg-indigo-50 px-3 py-1 font-semibold text-indigo-600">
              Gedeeld
            </span>
          ) : null}
        </div>
      </div>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {song.title || "Ongetiteld lied"}
          </h3>
          {snippet && <p className="mt-1 text-sm text-slate-600 line-clamp-3">{snippet}</p>}
        </div>

        {variants.length > 1 && (
          <label className="text-xs font-medium text-slate-500">
            Variant
            <select
              className="mt-1 w-full rounded-lg border border-slate-200 px-2 py-1 text-sm"
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

        {/* Progress indicator for generating songs */}
        {(song.status === 'generating_lyrics' || song.status === 'generating_music') && (
          <div className="flex items-center gap-2">
            <div className="animate-spin">⚡</div>
            <ProgressBar
              value={50}
              label={song.status === 'generating_lyrics' ? 'Tekst genereren' : 'Muziek genereren'}
              showPercentage={false}
              color="primary"
              className="flex-1"
            />
          </div>
        )}

        {/* Error display for failed state */}
        {song.status === 'failed' && (progress?.lyricsError || progress?.musicError) && (
          <div className="rounded-lg bg-red-50 p-2 text-xs text-red-700">
            <p className="font-semibold">Fout opgetreden:</p>
            <p className="mt-1 line-clamp-2">
              {progress.musicError || progress.lyricsError}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {/* Primary CTA based on status */}
          <button
            type="button"
            onClick={handlePrimaryAction}
            disabled={primaryCTA.disabled || actionState?.isRetrying}
            className={`rounded-full px-3 py-2 text-xs font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
              primaryCTA.color === 'emerald'
                ? 'bg-emerald-500 text-white hover:bg-emerald-600'
                : primaryCTA.color === 'rose'
                  ? 'bg-rose-500 text-white hover:bg-rose-600'
                  : primaryCTA.color === 'rose-outline'
                    ? 'border border-rose-300 text-rose-600 hover:bg-rose-50'
                    : 'border border-slate-200 text-slate-700 hover:border-slate-300'
            }`}
          >
            {actionState?.isRetrying && primaryCTA.action === 'retry' ? 'Bezig…' : primaryCTA.label}
          </button>

          {/* Open in Studio (only if not primary action) */}
          {primaryCTA.action !== 'view_details' && (
            <button
              type="button"
              onClick={onOpen}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
            >
              Open in Studio
            </button>
          )}

          {/* Share button (only for ready songs) */}
          {song.status === 'ready' && (
            <button
              type="button"
              onClick={onShare}
              disabled={actionState?.isSharing}
              className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {actionState?.isSharing ? "Bezig…" : song.isPublic ? "Deel link kopiëren" : "Deel link"}
            </button>
          )}

          {/* Delete button */}
          <button
            type="button"
            onClick={onDelete}
            disabled={actionState?.isDeleting}
            className="ml-auto rounded-full border border-rose-100 px-3 py-2 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState?.isDeleting ? "Verwijderen…" : "Verwijderen"}
          </button>
        </div>

        <div className="mt-auto text-xs text-slate-500">
          {metadataText}
        </div>
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const SongCard = memo(SongCardComponent);

export default SongCard;

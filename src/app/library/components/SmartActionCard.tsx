"use client";

import { useMemo } from "react";
import {
  Play,
  MoreVertical,
  Share2,
  Trash2,
  Edit,
  AlertCircle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import SongStatusBadge from "@/components/SongStatusBadge";
import { parseGenerationProgress } from "@/types/generation";
import type { SongStatus } from "@/types/generation";
import { createSnippet } from "@/lib/library/utils";
import ProgressRing from "./ProgressRing";

interface SongVariant {
  trackId: string;
  title?: string | null;
  streamAudioUrl?: string | null;
  audioUrl?: string | null;
  imageUrl?: string | null;
  order?: number | null;
}

interface SmartActionCardProps {
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
    generationProgress?: string | null;
    lyricsVariants?: string | null;
  };
  onPlay: (variant: SongVariant) => void;
  onOpen: () => void;
  onSelectVariant: (variantId: string) => void;
  onShare: () => void;
  onDelete: () => void;
  onChooseLyrics?: () => void;
  onRetry?: () => void;
  actionState?: {
    isSharing?: boolean;
    isDeleting?: boolean;
    isRetrying?: boolean;
  };
  compact?: boolean;
}

/**
 * SmartActionCard Component
 * Enhanced card with AI-powered predictive actions and better visual hierarchy
 * Replaces SongCard with more intelligent action suggestions
 */
export function SmartActionCard({
  song,
  onPlay,
  onOpen,
  onSelectVariant,
  onShare,
  onDelete,
  onChooseLyrics,
  onRetry,
  actionState,
  compact = false,
}: SmartActionCardProps) {
  const variants = song.variants || [];
  const selectedVariant = variants.find((v) => v.trackId === song.selectedVariantId) || variants[0];
  const snippet = createSnippet(song.lyricsSnippet, 140);
  const hasAudio = !!(selectedVariant?.streamAudioUrl || selectedVariant?.audioUrl);
  const progress = parseGenerationProgress(song.generationProgress);

  // Determine primary action and urgency
  const actionInfo = useMemo(() => {
    switch (song.status) {
      case "lyrics_ready":
        return {
          primary: "choose_lyrics",
          label: "Choose Lyrics",
          icon: Edit,
          color: "amber",
          urgency: "high",
          description: "Select your preferred lyrics",
        };
      case "ready":
        return {
          primary: "play",
          label: "Play",
          icon: Play,
          color: "emerald",
          urgency: "medium",
          description: "Ready to listen",
        };
      case "generating_lyrics":
        return {
          primary: "generating",
          label: "Generating Lyrics",
          icon: Clock,
          color: "blue",
          urgency: "low",
          description: "Generating song lyrics",
        };
      case "generating_music":
        return {
          primary: "generating",
          label: "Generating Music",
          icon: Clock,
          color: "blue",
          urgency: "low",
          description: "Composing your song",
        };
      case "failed":
        return {
          primary: "retry",
          label: "Retry",
          icon: AlertCircle,
          color: "rose",
          urgency: "high",
          description: "Generation failed, try again",
        };
      default:
        return {
          primary: "play",
          label: "Play",
          icon: Play,
          color: "slate",
          urgency: "low",
          description: "Listen to your song",
        };
    }
  }, [song.status]);

  const getColorClasses = (color: string) => {
    const colors: Record<string, { bg: string; text: string; border: string; hover: string }> = {
      amber: {
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        hover: "hover:bg-amber-100",
      },
      emerald: {
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        hover: "hover:bg-emerald-100",
      },
      blue: {
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        hover: "hover:bg-blue-100",
      },
      rose: {
        bg: "bg-rose-50",
        text: "text-rose-700",
        border: "border-rose-200",
        hover: "hover:bg-rose-100",
      },
      slate: {
        bg: "bg-slate-50",
        text: "text-slate-700",
        border: "border-slate-200",
        hover: "hover:bg-slate-100",
      },
    };
    return colors[color] || colors.slate;
  };

  const colorClasses = getColorClasses(actionInfo.color);
  const PrimaryIcon = actionInfo.icon;

  const handlePrimaryAction = () => {
    switch (actionInfo.primary) {
      case "play":
        if (selectedVariant) {
          onPlay(selectedVariant);
        }
        break;
      case "choose_lyrics":
        onChooseLyrics?.();
        break;
      case "retry":
        onRetry?.();
        break;
      case "generating":
        onOpen();
        break;
    }
  };

  if (compact) {
    // Compact horizontal card for listings
    return (
      <div className={`flex items-center gap-4 rounded-lg border ${colorClasses.border} ${colorClasses.bg} p-4 transition-all hover:shadow-sm`}>
        {song.imageUrl && (
          <img
            src={song.imageUrl}
            alt={song.title || "Song"}
            className="h-12 w-12 rounded object-cover"
          />
        )}
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-slate-900 truncate">
            {song.title || "Untitled"}
          </h3>
          <p className="text-xs text-slate-500">
            {actionInfo.description}
          </p>
        </div>
        <button
          onClick={handlePrimaryAction}
          disabled={actionState?.isRetrying}
          className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${colorClasses.text} ${colorClasses.border} border hover:${colorClasses.hover} disabled:opacity-60`}
        >
          <PrimaryIcon className="h-4 w-4" />
          {actionInfo.label}
        </button>
      </div>
    );
  }

  // Full card layout
  return (
    <div className={`overflow-hidden rounded-2xl border ${colorClasses.border} ${colorClasses.bg} shadow-sm transition-all hover:shadow-md`}>
      {/* Header with image and status */}
      <div className="relative h-44 w-full bg-slate-100">
        {song.imageUrl ? (
          <img
            src={song.imageUrl}
            alt={song.title || "Song cover"}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-slate-400">
            No cover
          </div>
        )}

        {/* Status and badges overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent">
          <div className="absolute left-3 top-3 flex items-center gap-2">
            {song.status && (
              <SongStatusBadge status={song.status as SongStatus} />
            )}
            {song.isPublic && (
              <span className="rounded-full bg-indigo-100/95 px-2 py-1 text-xs font-semibold text-indigo-700">
                Shared
              </span>
            )}
          </div>

          {/* Urgency indicator */}
          {actionInfo.urgency === "high" && (
            <div className="absolute right-3 top-3 rounded-full bg-rose-500/90 p-2">
              <Zap className="h-4 w-4 text-white" />
            </div>
          )}
        </div>

        {/* Progress indicator for generating state */}
        {(song.status === "generating_lyrics" || song.status === "generating_music") && (
          <div className="absolute bottom-3 right-3 z-10">
            <ProgressRing
              progress={progress?.estimatedProgress || 0}
              size="sm"
              color={actionInfo.color as any}
            />
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {song.title || "Untitled Song"}
          </h3>
          {snippet && (
            <p className="mt-1 text-xs text-slate-600 line-clamp-2">
              {snippet}
            </p>
          )}
        </div>

        {/* Variant selector */}
        {variants.length > 1 && (
          <div className="text-xs">
            <label className="block font-medium text-slate-700 mb-1">
              Variants
            </label>
            <select
              className="w-full rounded-lg border border-slate-300 bg-white px-2 py-1 text-sm text-slate-700"
              value={selectedVariant?.trackId || ""}
              onChange={(event) => onSelectVariant(event.target.value)}
            >
              {variants.map((variant, index) => (
                <option key={variant.trackId} value={variant.trackId}>
                  {variant.title || `Version ${index + 1}`}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Error state */}
        {song.status === "failed" && (progress?.lyricsError || progress?.musicError) && (
          <div className="rounded-lg bg-rose-100 p-3 text-xs text-rose-700">
            <p className="font-semibold">Error:</p>
            <p className="mt-1 line-clamp-2">
              {progress.musicError || progress.lyricsError}
            </p>
          </div>
        )}

        {/* Primary action button */}
        <div className="mt-auto flex flex-col gap-2">
          <button
            onClick={handlePrimaryAction}
            disabled={actionState?.isRetrying || (actionInfo.primary === "play" && !hasAudio)}
            className={`flex items-center justify-center gap-2 rounded-lg px-4 py-2 font-semibold text-white transition disabled:opacity-60 disabled:cursor-not-allowed ${
              actionInfo.color === "amber"
                ? "bg-amber-500 hover:bg-amber-600"
                : actionInfo.color === "emerald"
                  ? "bg-emerald-500 hover:bg-emerald-600"
                  : actionInfo.color === "blue"
                    ? "bg-blue-500 hover:bg-blue-600"
                    : actionInfo.color === "rose"
                      ? "bg-rose-500 hover:bg-rose-600"
                      : "bg-slate-500 hover:bg-slate-600"
            }`}
          >
            <PrimaryIcon className="h-4 w-4" />
            {actionState?.isRetrying ? "Loading..." : actionInfo.label}
          </button>

          {/* Secondary actions */}
          <div className="flex gap-2">
            {actionInfo.primary !== "play" && (
              <button
                onClick={() => {
                  if (selectedVariant) {
                    onPlay(selectedVariant);
                  }
                }}
                disabled={!hasAudio}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Play className="inline h-4 w-4 mr-1" />
                Play
              </button>
            )}

            {song.status === "ready" && (
              <button
                onClick={onShare}
                disabled={actionState?.isSharing}
                className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                <Share2 className="inline h-4 w-4 mr-1" />
                {actionState?.isSharing ? "..." : "Share"}
              </button>
            )}

            <button
              onClick={onOpen}
              className="flex-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50"
            >
              <Edit className="inline h-4 w-4 mr-1" />
              Edit
            </button>
          </div>

          {/* Delete button */}
          <button
            onClick={onDelete}
            disabled={actionState?.isDeleting}
            className="rounded-lg border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-600 transition hover:bg-rose-100 disabled:opacity-60 disabled:cursor-not-allowed"
          >
            <Trash2 className="inline h-4 w-4 mr-1" />
            {actionState?.isDeleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default SmartActionCard;

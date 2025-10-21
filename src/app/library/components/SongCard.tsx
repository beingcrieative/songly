"use client";

import { createSnippet } from "@/lib/library/utils";

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
    lyricsSnippet?: string | null;
    variants?: SongVariant[];
    selectedVariantId?: string | null;
    isPublic?: boolean | null;
    publicId?: string | null;
  };
  onPlay: (variant: SongVariant) => void;
  onOpen: () => void;
  onSelectVariant: (variantId: string) => void;
  onShare: () => void;
  onDelete: () => void;
  actionState?: {
    isSharing?: boolean;
    isDeleting?: boolean;
  };
}

const STATUS_LABELS: Record<string, { label: string; className: string }> = {
  ready: { label: "Klaar", className: "bg-emerald-50 text-emerald-600" },
  generating: { label: "Bezig", className: "bg-amber-50 text-amber-600" },
  failed: { label: "Mislukt", className: "bg-rose-50 text-rose-600" },
};

export function SongCard({
  song,
  onPlay,
  onOpen,
  onSelectVariant,
  onShare,
  onDelete,
  actionState,
}: SongCardProps) {
  const variants = song.variants || [];
  const selectedVariant = variants.find((v) => v.trackId === song.selectedVariantId) || variants[0];
  const statusInfo = song.status ? STATUS_LABELS[song.status] : undefined;
  const snippet = createSnippet(song.lyricsSnippet, 140);
  const updatedLabel = song.updatedAt
    ? new Date(song.updatedAt).toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  const handlePlay = () => {
    if (selectedVariant) {
      onPlay(selectedVariant);
    }
  };

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
          {statusInfo && (
            <span className={`rounded-full px-3 py-1 font-semibold ${statusInfo.className}`}>
              {statusInfo.label}
            </span>
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

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handlePlay}
            className="rounded-full bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-600"
            disabled={!selectedVariant?.streamAudioUrl && !selectedVariant?.audioUrl}
          >
            Afspelen
          </button>
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900"
          >
            Open in Studio
          </button>
          <button
            type="button"
            onClick={onShare}
            disabled={actionState?.isSharing}
            className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {actionState?.isSharing ? "Bezig…" : song.isPublic ? "Deel link kopiëren" : "Deel link"}
          </button>
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
          {updatedLabel ? `Bijgewerkt ${updatedLabel}` : "Bijgewerkt onbekend"}
        </div>
      </div>
    </div>
  );
}

export default SongCard;

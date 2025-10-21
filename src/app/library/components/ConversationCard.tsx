"use client";
import type { ConceptLyrics, ConversationPhase } from "@/types/conversation";
import { createSnippet } from "@/lib/library/utils";

interface ConversationCardProps {
  title: string | null;
  conceptLyrics?: ConceptLyrics | null;
  updatedAt?: number;
  readinessScore?: number | null;
  phase?: ConversationPhase | null;
  onOpen: () => void;
  onDelete?: () => void;
  isDeleting?: boolean;
}

const PHASE_LABELS: Record<ConversationPhase, string> = {
  gathering: "Context verzamelen",
  generating: "Lyrics genereren",
  refining: "Lyrics verfijnen",
  complete: "Afgerond",
};

export function ConversationCard({
  title,
  conceptLyrics,
  updatedAt,
  readinessScore,
  phase,
  onOpen,
  onDelete,
  isDeleting,
}: ConversationCardProps) {
  const snippet = createSnippet(conceptLyrics?.lyrics, 140);
  const readinessPercent = readinessScore != null ? Math.round(readinessScore * 100) : null;
  const phaseLabel = phase ? PHASE_LABELS[phase] : "Onbekende fase";
  const lastUpdate = updatedAt
    ? new Date(updatedAt).toLocaleDateString("nl-NL", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <div className="flex flex-col rounded-2xl border border-slate-200 bg-white/90 p-4 shadow-sm transition hover:shadow-md">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-slate-900">
            {title || conceptLyrics?.title || "Concept lyrics"}
          </h3>
          <p className="text-xs uppercase tracking-wide text-slate-500">{phaseLabel}</p>
        </div>
        {readinessPercent != null && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-600">
            Ready {readinessPercent}%
          </span>
        )}
      </div>
      {snippet && (
        <p className="mt-3 line-clamp-4 text-sm text-slate-600 whitespace-pre-line">{snippet}</p>
      )}
      <div className="mt-4 flex items-center justify-between text-xs text-slate-500">
        <span>{lastUpdate ? `Bijgewerkt ${lastUpdate}` : "Bijgewerkt onbekend"}</span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpen}
            className="rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white transition hover:bg-rose-600"
          >
            Open in Studio
          </button>
          {onDelete && (
            <button
              type="button"
              onClick={onDelete}
              disabled={isDeleting}
              className="rounded-full border border-rose-100 px-3 py-1 text-xs font-semibold text-rose-600 transition hover:border-rose-200 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isDeleting ? "Verwijderen…" : "Verwijderen"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default ConversationCard;

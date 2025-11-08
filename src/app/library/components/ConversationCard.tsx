"use client";
import { memo, useMemo, useCallback } from "react";
import type { ConceptLyrics, ConversationPhase } from "@/types/conversation";
import { createSnippet } from "@/lib/library/utils";
import ProgressBar from "./ProgressBar";

interface ConversationCardProps {
  title: string | null;
  conceptLyrics?: ConceptLyrics | null;
  updatedAt?: number;
  readinessScore?: number | null;
  phase?: ConversationPhase | null;
  messages?: Array<{ role: string; content: string; createdAt: number }>;
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

function ConversationCardComponent({
  title,
  conceptLyrics,
  updatedAt,
  readinessScore,
  phase,
  messages,
  onOpen,
  onDelete,
  isDeleting,
}: ConversationCardProps) {
  const snippet = useMemo(() => createSnippet(conceptLyrics?.lyrics, 140), [conceptLyrics?.lyrics]);
  const readinessPercent = useMemo(() => readinessScore != null ? Math.round(readinessScore * 100) : null, [readinessScore]);
  const phaseLabel = useMemo(() => phase ? PHASE_LABELS[phase] : "Onbekende fase", [phase]);
  const lastUpdate = useMemo(() => 
    updatedAt
      ? new Date(updatedAt).toLocaleDateString("nl-NL", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : null,
    [updatedAt]
  );

  // Show recent conversation messages if available
  const recentMessages = useMemo(() => messages?.slice(-2) || [], [messages]);

  const handleDelete = useCallback(() => {
    onDelete?.();
  }, [onDelete]);

  return (
    <div className="flex flex-col gap-3 rounded-2xl bg-[#F9FAFB] p-4 transition hover:shadow-sm">
      {/* Horizontal layout: image (left), content (center), action (right) */}
      <div className="flex items-start gap-4">
        {/* Cover image placeholder */}
        <div className="h-16 w-16 shrink-0 rounded-lg bg-[#E5E7EB] flex items-center justify-center text-2xl">
          💬
        </div>

        {/* Content section */}
        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-[#262626] truncate">
            {title || conceptLyrics?.title || "Concept lyrics"}
          </h3>
          <p className="text-xs uppercase tracking-wide text-[#6B7280] mt-1">{phaseLabel}</p>
        </div>

        {/* Action arrow */}
        <button
          onClick={onOpen}
          className="shrink-0 text-[#6B7280] hover:text-[#262626] transition"
          aria-label="Open conversation"
        >
          →
        </button>
      </div>

      {/* Progress bar */}
      {readinessPercent != null && (
        <ProgressBar
          value={readinessPercent}
          label="Progress"
          showPercentage={true}
          color="primary"
        />
      )}

      {/* Last 2 messages preview */}
      {recentMessages.length > 0 && (
        <div className="bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-3 space-y-1">
          <p className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-2">
            Last 2 messages
          </p>
          {recentMessages.map((message, idx) => (
            <p key={idx} className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1">
              <span className="font-medium">
                {message.role === 'user' ? 'Jij' : 'AI'}:
              </span>{' '}
              {message.content.replace(/\n/g, ' ')}
            </p>
          ))}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={onOpen}
          className="flex-1 rounded-full bg-[#84CC16] px-4 py-2 text-xs font-semibold text-white transition hover:bg-[#65A30D]"
          aria-label={`Continue conversation: ${title || 'Untitled'}`}
        >
          Continue
        </button>
        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="rounded-full border border-[#FEE2E2] px-3 py-2 text-xs font-semibold text-[#DC2626] transition hover:border-[#FECACA] hover:bg-[#FEF2F2] disabled:cursor-not-allowed disabled:opacity-60"
            aria-label="Delete conversation"
          >
            {isDeleting ? "..." : "×"}
          </button>
        )}
      </div>
    </div>
  );
}

// Memoize the component to prevent unnecessary re-renders
export const ConversationCard = memo(ConversationCardComponent);

export default ConversationCard;

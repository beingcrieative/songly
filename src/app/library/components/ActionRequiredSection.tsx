"use client";

import { useActionItems } from "@/hooks/useActionItems";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";
import ProgressBar from "./ProgressBar";

interface ActionRequiredSectionProps {
  songs: any[];
  conversations: any[];
  onChooseLyrics?: (song: any) => void;
  onRetry?: (songId: string, phase: "lyrics" | "music") => void;
  onContinue?: (conversationId: string) => void;
}

export default function ActionRequiredSection({
  songs,
  conversations,
  onChooseLyrics,
  onRetry,
  onContinue,
}: ActionRequiredSectionProps) {
  const { actionItems, hasActions } = useActionItems(songs, conversations);

  const getActionLabel = (status: string) => {
    switch (status) {
      case "lyrics_ready":
        return "Kies Lyrics →";
      case "failed":
        return "🔄 Probeer opnieuw";
      default:
        return "Actie vereist";
    }
  };

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case "lyrics_ready":
        return "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300";
      case "failed":
        return "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300";
      default:
        return "bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300";
    }
  };

  const handleActionClick = (item: any) => {
    if (item.status === "lyrics_ready" && onChooseLyrics) {
      onChooseLyrics(item);
    } else if (item.status === "failed" && onRetry) {
      onRetry(item.id, "music");
    }
  };

  return (
    <section className="flex flex-col gap-4 px-4">
      <SectionHeader title="Action Required" />

      {!hasActions ? (
        <EmptyState
          icon="🎉"
          title="All Caught Up!"
          message="No songs require your action right now."
        />
      ) : (
        <div className="space-y-3">
          {actionItems.map((item) => (
            <div
              key={item.id}
              className="flex items-center justify-between rounded-2xl bg-[#F9FAFB] p-4 text-[#262626]"
            >
              <div>
                <p className="text-sm font-medium text-[#6B7280]">{item.title || "Your Song"}</p>
                <span className="mt-1 inline-block rounded-md bg-[#84CC16]/80 px-2 py-1 text-xs font-semibold uppercase tracking-wider text-white">
                  {item.status === "lyrics_ready"
                    ? "Ready to Choose"
                    : item.status === "failed"
                    ? "Failed"
                    : item.status}
                </span>
              </div>
              <button
                onClick={() => handleActionClick(item)}
                className="flex items-center gap-1 text-sm font-semibold text-[#84CC16]"
              >
                {getActionLabel(item.status)}
                <span className="text-base">→</span>
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
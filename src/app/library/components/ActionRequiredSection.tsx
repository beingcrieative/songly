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
              className="flex flex-col gap-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition"
            >
              <div className="flex items-start gap-4">
                {item.imageUrl && (
                  <img
                    src={item.imageUrl}
                    alt={item.title}
                    className="h-16 w-16 rounded-lg object-cover shrink-0"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white truncate">
                    {item.title}
                  </h3>
                  <span
                    className={`inline-block mt-1 px-2 py-1 rounded text-xs font-semibold uppercase ${getStatusBadgeColor(
                      item.status
                    )}`}
                  >
                    {item.status === "lyrics_ready"
                      ? "Klaar om te kiezen"
                      : item.status === "failed"
                      ? "Mislukt"
                      : item.status}
                  </span>
                </div>
                <button
                  onClick={() => handleActionClick(item)}
                  className="rounded-full bg-gradient-to-r from-[var(--color-library-primary)] to-[var(--color-library-accent)] px-3 py-2 text-xs font-semibold text-white transition hover:shadow-lg shrink-0"
                >
                  {getActionLabel(item.status)}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
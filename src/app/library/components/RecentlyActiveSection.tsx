"use client";

import { useRecentActivity } from "@/hooks/useRecentActivity";
import SectionHeader from "./SectionHeader";
import EmptyState from "./EmptyState";
import ProgressBar from "./ProgressBar";

interface RecentlyActiveSectionProps {
  songs: any[];
  conversations: any[];
  onOpenSong?: (songId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
}

export default function RecentlyActiveSection({
  songs,
  conversations,
  onOpenSong,
  onOpenConversation,
}: RecentlyActiveSectionProps) {
  const { recentItems } = useRecentActivity(songs, conversations);

  const getPhaseLabel = (phase: string) => {
    const labels: Record<string, string> = {
      gathering: "Context verzamelen",
      generating: "Lyrics genereren",
      refining: "Lyrics verfijnen",
      complete: "Afgerond",
    };
    return labels[phase] || phase;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "gathering":
        return "text-amber-600 dark:text-amber-400";
      case "generating":
        return "text-blue-600 dark:text-blue-400";
      case "refining":
        return "text-purple-600 dark:text-purple-400";
      case "complete":
        return "text-emerald-600 dark:text-emerald-400";
      case "ready":
        return "text-emerald-600 dark:text-emerald-400";
      default:
        return "text-slate-600 dark:text-slate-400";
    }
  };

  return (
    <section className="flex flex-col gap-4 px-4">
      <SectionHeader title="Recently Active" />

      {recentItems.length === 0 ? (
        <EmptyState
          icon="💬"
          title="No Recent Activity"
          message="Start a new conversation to create your next love song."
        />
      ) : (
        <div className="space-y-3">
          {recentItems.map((item) => (
            <div
              key={`${item.type}-${item.id}`}
              className="flex flex-col gap-3 rounded-lg bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 p-4 shadow-sm hover:shadow-md transition cursor-pointer"
              onClick={() => {
                if (item.type === "song" && onOpenSong) {
                  onOpenSong(item.id);
                } else if (item.type === "conversation" && onOpenConversation) {
                  onOpenConversation(item.id);
                }
              }}
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
                  <p
                    className={`text-xs font-semibold uppercase tracking-wide mt-1 ${getStatusColor(
                      item.status
                    )}`}
                  >
                    {item.type === "conversation"
                      ? getPhaseLabel(item.status)
                      : item.status}
                  </p>
                </div>
              </div>

              {/* Last 2 messages for conversations */}
              {item.type === "conversation" && item.messages && item.messages.length > 0 && (
                <div className="bg-slate-100/50 dark:bg-slate-900/50 rounded-lg p-3 space-y-1">
                  <p className="text-xs font-semibold text-slate-900 dark:text-white uppercase tracking-wide mb-2">
                    Last 2 messages
                  </p>
                  {item.messages.slice(-2).map((msg: any, idx: number) => (
                    <p
                      key={idx}
                      className="text-xs text-slate-600 dark:text-slate-400 line-clamp-1"
                    >
                      <span className="font-medium">
                        {msg.role === "user" ? "Jij" : "AI"}:
                      </span>{" "}
                      {msg.content}
                    </p>
                  ))}
                </div>
              )}

              {/* Progress bar for conversations */}
              {item.type === "conversation" && item.readinessScore !== undefined && (
                <ProgressBar
                  value={Math.round((item.readinessScore || 0) * 100)}
                  label="Readiness Score"
                  showPercentage={true}
                  color="primary"
                />
              )}

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (item.type === "song" && onOpenSong) {
                    onOpenSong(item.id);
                  } else if (item.type === "conversation" && onOpenConversation) {
                    onOpenConversation(item.id);
                  }
                }}
                className="rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF00A5] px-4 py-2 text-xs font-semibold text-white transition hover:shadow-lg w-full"
              >
                {item.type === "conversation" ? "Continue" : "Open"}
              </button>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
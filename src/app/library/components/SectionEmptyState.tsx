"use client";

import { ReactNode } from "react";
import type { SectionType } from "./SmartSection";

interface SectionEmptyStateProps {
  type: SectionType;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  icon?: ReactNode;
}

/**
 * SectionEmptyState Component
 * Displays contextual empty states for each section type
 * Includes helpful guidance and action buttons
 */
export function SectionEmptyState({
  type,
  message,
  action,
  icon,
}: SectionEmptyStateProps) {
  const getEmptyStateContent = (
    sectionType: SectionType
  ): {
    icon: string;
    title: string;
    defaultMessage: string;
    color: string;
  } => {
    switch (sectionType) {
      case "action_required":
        return {
          icon: "✨",
          title: "All caught up!",
          defaultMessage:
            "No songs need your attention right now. Keep creating!",
          color: "text-amber-600",
        };
      case "in_progress":
        return {
          icon: "⏳",
          title: "Nothing generating",
          defaultMessage:
            "Create a new song to see the generation progress here",
          color: "text-blue-600",
        };
      case "completed":
        return {
          icon: "🎵",
          title: "No completed songs yet",
          defaultMessage:
            "Your finished songs will appear here once you've created some",
          color: "text-emerald-600",
        };
      case "discovery":
        return {
          icon: "🎹",
          title: "Ready to explore?",
          defaultMessage:
            "Start creating your first love song and watch it appear here",
          color: "text-slate-600",
        };
      default:
        return {
          icon: "📝",
          title: "No items",
          defaultMessage: "No items to display in this section",
          color: "text-slate-600",
        };
    }
  };

  const content = getEmptyStateContent(type);

  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-lg bg-white/40 px-6 py-12 text-center">
      <div className="mb-4 text-5xl">{icon || content.icon}</div>
      <h3 className="mb-2 text-lg font-semibold text-slate-900">
        {content.title}
      </h3>
      <p className={`mb-6 text-sm ${content.color}`}>
        {message || content.defaultMessage}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className={`rounded-lg px-6 py-2 text-sm font-semibold text-white transition-all ${
            type === "action_required"
              ? "bg-amber-600 hover:bg-amber-700"
              : type === "in_progress"
                ? "bg-blue-600 hover:bg-blue-700"
                : type === "completed"
                  ? "bg-emerald-600 hover:bg-emerald-700"
                  : "bg-slate-600 hover:bg-slate-700"
          }`}
        >
          {action.label}
        </button>
      )}
    </div>
  );
}

export default SectionEmptyState;

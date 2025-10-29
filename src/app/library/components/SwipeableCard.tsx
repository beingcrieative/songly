"use client";

import { ReactNode, useRef, useState } from "react";
import { useSwipeGesture } from "@/lib/hooks/useSwipeGesture";
import { Play, Archive, Trash2 } from "lucide-react";

interface SwipeableCardProps {
  children: ReactNode;
  onPlay?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  enabled?: boolean;
}

/**
 * SwipeableCard Component
 * Wraps content with swipe gesture support
 * Shows action hints on swipe with quick action buttons
 */
export function SwipeableCard({
  children,
  onPlay,
  onArchive,
  onDelete,
  enabled = true,
}: SwipeableCardProps) {
  const [swipeActive, setSwipeActive] = useState<"left" | "right" | null>(null);
  const containerRef = useSwipeGesture({
    onSwipeLeft: () => {
      setSwipeActive("left");
      if (onArchive) {
        onArchive();
      } else if (onDelete) {
        onDelete();
      }
      setTimeout(() => setSwipeActive(null), 300);
    },
    onSwipeRight: () => {
      setSwipeActive("right");
      onPlay?.();
      setTimeout(() => setSwipeActive(null), 300);
    },
    threshold: 40,
    enabled,
  }) as React.RefObject<HTMLDivElement>;

  return (
    <div
      ref={containerRef}
      className={`relative transition-all duration-200 ${
        swipeActive === "left" ? "bg-rose-50" : swipeActive === "right" ? "bg-emerald-50" : ""
      }`}
    >
      {/* Swipe indicators */}
      {swipeActive === "right" && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center pl-4 pointer-events-none">
          <div className="flex items-center gap-2 text-emerald-600">
            <Play className="h-5 w-5 fill-current" />
            <span className="text-sm font-semibold">Play</span>
          </div>
        </div>
      )}

      {swipeActive === "left" && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center pr-4 pointer-events-none">
          <div className="flex items-center gap-2 text-rose-600">
            <span className="text-sm font-semibold">
              {onArchive ? "Archive" : "Delete"}
            </span>
            {onArchive ? (
              <Archive className="h-5 w-5" />
            ) : (
              <Trash2 className="h-5 w-5" />
            )}
          </div>
        </div>
      )}

      {/* Content */}
      <div className={swipeActive ? "opacity-50" : ""}>{children}</div>
    </div>
  );
}

export default SwipeableCard;

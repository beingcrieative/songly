"use client";

import { ReactNode, useState, useRef, useEffect } from "react";
import { RefreshCw } from "lucide-react";

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  threshold?: number;
  enabled?: boolean;
}

/**
 * PullToRefresh Component
 * Implements iOS-style pull-to-refresh functionality
 * Shows progress indicator as user pulls down
 */
export function PullToRefresh({
  children,
  onRefresh,
  threshold = 60,
  enabled = true,
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startYRef = useRef(0);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      // Only track if at top of scroll
      if (containerRef.current && containerRef.current.scrollTop === 0) {
        startYRef.current = e.touches[0].clientY;
      }
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!containerRef.current || isRefreshing) return;

      const currentY = e.touches[0].clientY;
      const distance = currentY - startYRef.current;

      // Only track positive pulls
      if (distance > 0 && containerRef.current.scrollTop === 0) {
        setPullDistance(Math.min(distance, threshold + 20));
      }
    };

    const handleTouchEnd = async () => {
      if (pullDistance >= threshold && !isRefreshing) {
        setIsRefreshing(true);
        setPullDistance(0);

        try {
          await onRefresh();
        } finally {
          setIsRefreshing(false);
        }
      } else {
        setPullDistance(0);
      }
    };

    const element = containerRef.current;
    if (element) {
      element.addEventListener("touchstart", handleTouchStart, { passive: true });
      element.addEventListener("touchmove", handleTouchMove, { passive: true });
      element.addEventListener("touchend", handleTouchEnd, { passive: true });

      return () => {
        element.removeEventListener("touchstart", handleTouchStart);
        element.removeEventListener("touchmove", handleTouchMove);
        element.removeEventListener("touchend", handleTouchEnd);
      };
    }
  }, [onRefresh, threshold, pullDistance, isRefreshing, enabled]);

  const progress = Math.min((pullDistance / threshold) * 100, 100);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div ref={containerRef} className="relative overflow-y-auto">
      {/* Pull indicator */}
      {showIndicator && (
        <div
          className="sticky top-0 z-20 flex items-center justify-center overflow-hidden bg-gradient-to-b from-blue-50 to-transparent transition-all"
          style={{
            height: `${Math.max(50, pullDistance)}px`,
            opacity: Math.min(progress / 50, 1),
          }}
        >
          <div className="flex flex-col items-center gap-2">
            <RefreshCw
              className={`h-5 w-5 text-blue-600 transition-transform ${
                isRefreshing ? "animate-spin" : ""
              }`}
              style={{
                transform: `rotate(${(progress / 100) * 180}deg)`,
              }}
            />
            <span className="text-xs font-semibold text-blue-600">
              {isRefreshing
                ? "Refreshing..."
                : progress >= 100
                  ? "Release to refresh"
                  : "Pull to refresh"}
            </span>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ transform: `translateY(${pullDistance * 0.5}px)` }}>
        {children}
      </div>
    </div>
  );
}

export default PullToRefresh;

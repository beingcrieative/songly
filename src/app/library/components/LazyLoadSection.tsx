"use client";

import { ReactNode, useCallback, useEffect, useRef, useState } from "react";

interface LazyLoadSectionProps {
  items: any[];
  renderItem: (item: any, index: number) => ReactNode;
  initialVisibleCount?: number;
  itemsPerLoad?: number;
  loading?: boolean;
  className?: string;
}

/**
 * LazyLoadSection Component
 * Implements lazy loading for large lists within sections
 * Shows initial items and loads more on demand via intersection observer
 */
export function LazyLoadSection({
  items,
  renderItem,
  initialVisibleCount = 6,
  itemsPerLoad = 6,
  loading = false,
  className = "",
}: LazyLoadSectionProps) {
  const [visibleCount, setVisibleCount] = useState(initialVisibleCount);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Set up intersection observer for lazy loading
  useEffect(() => {
    if (!loadMoreRef.current) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          setVisibleCount((prev) => prev + itemsPerLoad);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(loadMoreRef.current);

    return () => observer.disconnect();
  }, [loading, itemsPerLoad]);

  const visibleItems = items.slice(0, visibleCount);
  const hasMore = visibleCount < items.length;

  return (
    <div className={className}>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {visibleItems.map((item, index) => (
          <div key={item.id || index}>{renderItem(item, index)}</div>
        ))}
      </div>

      {hasMore && (
        <div
          ref={loadMoreRef}
          className="mt-8 flex items-center justify-center py-4"
        >
          {loading ? (
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 animate-bounce rounded-full bg-slate-400"></div>
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="h-2 w-2 animate-bounce rounded-full bg-slate-400"
                style={{ animationDelay: "0.4s" }}
              ></div>
            </div>
          ) : (
            <div className="text-sm text-slate-500">
              Scroll to load more ({visibleCount} of {items.length})
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default LazyLoadSection;

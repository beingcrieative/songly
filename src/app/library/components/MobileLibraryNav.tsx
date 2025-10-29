"use client";

import { ReactNode } from "react";
import { Search, Filter, Plus } from "lucide-react";

interface MobileLibraryNavProps {
  onSearchOpen?: () => void;
  onFilterOpen?: () => void;
  onCreateNew?: () => void;
  actionCount?: number;
  searchPlaceholder?: string;
  compact?: boolean;
}

/**
 * MobileLibraryNav Component
 * Bottom navigation bar for mobile library with context-aware shortcuts
 * Shows action counters and quick access buttons
 */
export function MobileLibraryNav({
  onSearchOpen,
  onFilterOpen,
  onCreateNew,
  actionCount = 0,
  searchPlaceholder = "Search songs...",
  compact = false,
}: MobileLibraryNavProps) {
  if (compact) {
    // Minimal bottom bar
    return (
      <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white px-4 py-3 flex items-center justify-between gap-2 md:hidden">
        <button
          onClick={onSearchOpen}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
        >
          <Search className="h-4 w-4" />
          Search
        </button>

        <button
          onClick={onFilterOpen}
          className="relative flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2 text-slate-700 transition hover:bg-slate-50"
        >
          <Filter className="h-4 w-4" />
          {actionCount > 0 && (
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
              {actionCount}
            </span>
          )}
        </button>

        <button
          onClick={onCreateNew}
          className="flex items-center justify-center rounded-lg bg-rose-500 px-3 py-2 text-white transition hover:bg-rose-600"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>
    );
  }

  // Full navigation
  return (
    <div className="fixed bottom-0 left-0 right-0 border-t border-slate-200 bg-white/95 backdrop-blur-sm px-4 py-4 md:hidden">
      <div className="mx-auto max-w-6xl flex items-center justify-between gap-3">
        {/* Search button */}
        <button
          onClick={onSearchOpen}
          className="flex-1 flex items-center justify-center gap-2 rounded-lg border border-slate-200 px-4 py-3 text-sm font-medium text-slate-700 transition active:bg-slate-100 hover:bg-slate-50"
        >
          <Search className="h-5 w-5" />
          <span className="hidden sm:inline">{searchPlaceholder}</span>
        </button>

        {/* Filter button with badge */}
        <button
          onClick={onFilterOpen}
          className="relative flex items-center justify-center rounded-lg border border-slate-200 px-4 py-3 text-slate-700 transition active:bg-slate-100 hover:bg-slate-50"
        >
          <Filter className="h-5 w-5" />
          {actionCount > 0 && (
            <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white shadow-lg">
              {actionCount > 9 ? "9+" : actionCount}
            </span>
          )}
        </button>

        {/* Create button */}
        <button
          onClick={onCreateNew}
          className="flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-rose-500 to-rose-600 px-4 py-3 font-semibold text-white transition active:shadow-lg hover:shadow-md"
        >
          <Plus className="h-5 w-5" />
          <span className="hidden sm:inline">New Song</span>
        </button>
      </div>
    </div>
  );
}

export default MobileLibraryNav;

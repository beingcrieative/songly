"use client";

import { useMemo } from "react";
import { X, Search, SlidersHorizontal } from "lucide-react";

interface FilterOption {
  value: string;
  label: string;
  icon?: string;
  description?: string;
}

interface ConversationalFiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
  sort: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterOption[];
  placeholder?: string;
  onReset?: () => void;
  showAdvanced?: boolean;
}

/**
 * ConversationalFilters Component
 * AI-enhanced filtering with natural language suggestions
 * Replaces basic filters with contextual guidance and suggestions
 */
export function ConversationalFilters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  sort,
  onSortChange,
  sortOptions,
  placeholder = "Search songs...",
  onReset,
  showAdvanced = false,
}: ConversationalFiltersProps) {
  // Get helpful suggestions based on current filters
  const suggestion = useMemo(() => {
    if (status === "all" && sort === "action") {
      return "Showing songs that need your attention first";
    }
    if (status === "generating_lyrics" || status === "generating_music") {
      return "Keep exploring while your songs are being created";
    }
    if (status === "ready") {
      return "Your completed songs ready to listen and share";
    }
    if (status === "failed") {
      return "Songs that encountered issues - try generating again";
    }
    if (sort === "played") {
      return "Your favorite and most-played songs";
    }
    return null;
  }, [status, sort]);

  const isFiltered = search !== "" || status !== "all" || sort !== "action";
  const selectedStatusLabel = statusOptions.find((o) => o.value === status)?.label;
  const selectedSortLabel = sortOptions.find((o) => o.value === sort)?.label;

  return (
    <div className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-gradient-to-br from-white/90 to-slate-50/90 p-4 shadow-sm">
      {/* Search bar */}
      <div className="flex items-center gap-2">
        <Search className="h-5 w-5 text-slate-400" />
        <input
          type="search"
          value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-sm placeholder-slate-400 focus:outline-none"
        />
        {search && (
          <button
            onClick={() => onSearchChange("")}
            className="rounded-full p-1 hover:bg-slate-200"
            title="Clear search"
          >
            <X className="h-4 w-4 text-slate-500" />
          </button>
        )}
      </div>

      {/* Filter chips and controls */}
      <div className="flex flex-wrap items-center gap-2">
        {/* Status filter */}
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="h-4 w-4 text-slate-500" />
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.icon ? `${option.icon} ${option.label}` : option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Sort filter */}
        <select
          value={sort}
          onChange={(event) => onSortChange(event.target.value)}
          className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 focus:border-slate-500 focus:outline-none focus:ring-2 focus:ring-slate-200"
        >
          {sortOptions.map((option) => (
            <option key={option.value} value={option.value}>
              {option.icon ? `${option.icon} ${option.label}` : option.label}
            </option>
          ))}
        </select>

        {/* Reset filters */}
        {isFiltered && onReset && (
          <button
            onClick={onReset}
            className="rounded-full border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-100"
          >
            Reset
          </button>
        )}
      </div>

      {/* Suggestion message */}
      {suggestion && (
        <div className="rounded-lg bg-blue-50 px-3 py-2 text-sm text-blue-700">
          💡 <strong>Tip:</strong> {suggestion}
        </div>
      )}

      {/* Advanced filter toggle (optional) */}
      {showAdvanced && (
        <details className="text-sm text-slate-600">
          <summary className="cursor-pointer font-medium hover:text-slate-900">
            More options
          </summary>
          <div className="mt-3 flex flex-col gap-2 pt-3 border-t border-slate-200">
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Only public songs</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>With cover art</span>
            </label>
            <label className="flex items-center gap-2">
              <input type="checkbox" className="rounded" />
              <span>Multiple variants</span>
            </label>
          </div>
        </details>
      )}
    </div>
  );
}

export default ConversationalFilters;

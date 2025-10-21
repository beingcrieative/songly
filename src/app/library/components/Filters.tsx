"use client";

interface FilterOption {
  value: string;
  label: string;
}

interface FiltersProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: string;
  onStatusChange: (value: string) => void;
  statusOptions: FilterOption[];
  sort: string;
  onSortChange: (value: string) => void;
  sortOptions: FilterOption[];
  placeholder?: string;
}

export default function Filters({
  search,
  onSearchChange,
  status,
  onStatusChange,
  statusOptions,
  sort,
  onSortChange,
  sortOptions,
  placeholder = "Zoeken",
}: FiltersProps) {
  return (
    <div className="flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/80 p-4 shadow-sm md:flex-row md:items-center md:justify-between">
      <input
        type="search"
        value={search}
        onChange={(event) => onSearchChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-full border border-slate-200 px-4 py-2 text-sm focus:border-rose-400 focus:outline-none focus:ring-2 focus:ring-rose-100 md:w-64"
      />
      <div className="flex flex-wrap items-center gap-2">
        <label className="text-xs font-medium text-slate-500">
          Status
          <select
            value={status}
            onChange={(event) => onStatusChange(event.target.value)}
            className="mt-1 rounded-full border border-slate-200 px-3 py-2 text-sm"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium text-slate-500">
          Sorteren
          <select
            value={sort}
            onChange={(event) => onSortChange(event.target.value)}
            className="mt-1 rounded-full border border-slate-200 px-3 py-2 text-sm"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  );
}


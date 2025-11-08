"use client";

interface EmptyStateProps {
  icon?: string; // emoji or SVG
  title: string;
  message: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function EmptyState({
  icon,
  title,
  message,
  action,
  className = "",
}: EmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 dark:border-slate-700 bg-white/60 dark:bg-slate-900/30 p-6 text-center ${className}`}
    >
      {icon && (
        <div className="text-5xl mb-3">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">
        {title}
      </h3>
      <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
        {message}
      </p>
      {action && (
        <button
          onClick={action.onClick}
          className="rounded-full bg-gradient-to-r from-[var(--color-library-primary)] to-[var(--color-library-accent)] px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg"
        >
          {action.label}
        </button>
      )}
    </div>
  );
}
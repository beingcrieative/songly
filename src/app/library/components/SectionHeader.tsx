"use client";

interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: string;
  };
  className?: string;
}

export default function SectionHeader({
  title,
  subtitle,
  action,
  className = "",
}: SectionHeaderProps) {
  return (
    <div className={`flex items-center justify-between px-4 pb-3 pt-5 ${className}`}>
      <div className="flex-1">
        <h2 className="text-2xl font-bold text-slate-900 dark:text-white leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-4 rounded-full bg-gradient-to-r from-[#6A11CB] to-[#FF00A5] px-4 py-2 text-sm font-semibold text-white transition hover:shadow-lg flex items-center gap-2"
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </button>
      )}
    </div>
  );
}

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
    <div className={`flex items-center justify-between mb-4 ${className}`}>
      <div className="flex-1">
        <h2 className="text-xl font-bold text-[#262626] leading-tight tracking-tight">
          {title}
        </h2>
        {subtitle && (
          <p className="text-sm text-[#6B7280] mt-1">
            {subtitle}
          </p>
        )}
      </div>
      {action && (
        <button
          onClick={action.onClick}
          className="ml-4 rounded-full bg-[#84CC16] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#65A30D] flex items-center gap-2"
        >
          {action.icon && <span>{action.icon}</span>}
          {action.label}
        </button>
      )}
    </div>
  );
}

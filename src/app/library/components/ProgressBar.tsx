"use client";

interface ProgressBarProps {
  value: number; // 0-100
  label?: string;
  showPercentage?: boolean;
  color?: "primary" | "accent" | "secondary";
  className?: string;
}

export default function ProgressBar({
  value,
  label,
  showPercentage = true,
  color = "primary",
  className = "",
}: ProgressBarProps) {
  const clampedValue = Math.min(Math.max(value, 0), 100);
  
  const colorClasses = {
    primary: "bg-gradient-to-r from-[var(--color-library-primary)] to-[var(--color-library-accent)]",
    accent: "bg-[var(--color-library-accent)]",
    secondary: "bg-[var(--color-library-secondary)]",
  };

  return (
    <div className={`w-full ${className}`}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center mb-1">
          {label && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {label}
            </span>
          )}
          {showPercentage && (
            <span className="text-xs font-medium text-slate-600 dark:text-slate-400">
              {clampedValue}%
            </span>
          )}
        </div>
      )}
      <div
        className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2 overflow-hidden"
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label || "Progress"}
      >
        <div
          className={`h-full ${colorClasses[color]} transition-all duration-500 ease-out`}
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
}
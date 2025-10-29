"use client";

interface ProgressRingProps {
  progress: number; // 0-100
  size?: "sm" | "md" | "lg";
  color?: "amber" | "emerald" | "blue" | "rose" | "slate";
  showLabel?: boolean;
}

/**
 * ProgressRing Component
 * Circular progress indicator for generating states
 * Shows percentage completion visually
 */
export function ProgressRing({
  progress = 0,
  size = "md",
  color = "blue",
  showLabel = false,
}: ProgressRingProps) {
  const sizeMap = {
    sm: { outer: 40, inner: 32, strokeWidth: 2, fontSize: 10 },
    md: { outer: 60, inner: 52, strokeWidth: 3, fontSize: 12 },
    lg: { outer: 80, inner: 68, strokeWidth: 4, fontSize: 14 },
  };

  const colorMap = {
    amber: { stroke: "#f59e0b", bg: "#fef3c7" },
    emerald: { stroke: "#10b981", bg: "#d1fae5" },
    blue: { stroke: "#3b82f6", bg: "#dbeafe" },
    rose: { stroke: "#f43f5e", bg: "#ffe4e6" },
    slate: { stroke: "#94a3b8", bg: "#f1f5f9" },
  };

  const config = sizeMap[size];
  const colors = colorMap[color];
  const radius = (config.outer - config.strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <div className="inline-flex items-center justify-center" style={{ width: config.outer, height: config.outer }}>
      <svg width={config.outer} height={config.outer} className="drop-shadow-lg">
        {/* Background circle */}
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          stroke={colors.bg}
          strokeWidth={config.strokeWidth}
        />
        {/* Progress circle */}
        <circle
          cx={config.outer / 2}
          cy={config.outer / 2}
          r={radius}
          fill="none"
          stroke={colors.stroke}
          strokeWidth={config.strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-500 ease-out"
          style={{ transform: "rotate(-90deg)", transformOrigin: "50% 50%" }}
        />
        {/* Center label */}
        {showLabel && (
          <text
            x={config.outer / 2}
            y={config.outer / 2}
            textAnchor="middle"
            dy="0.3em"
            fill={colors.stroke}
            fontSize={config.fontSize}
            fontWeight="bold"
            className="pointer-events-none"
          >
            {Math.round(progress)}%
          </text>
        )}
      </svg>
    </div>
  );
}

export default ProgressRing;

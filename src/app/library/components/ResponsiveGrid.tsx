"use client";

import { ReactNode, useMemo } from "react";

interface ResponsiveGridProps {
  children: ReactNode;
  variant?: "cards" | "list" | "compact";
  minColumns?: number;
  maxColumns?: number;
  gap?: "sm" | "md" | "lg";
}

/**
 * ResponsiveGrid Component
 * Optimized responsive grid layouts for mobile and desktop
 * Automatically adjusts grid columns based on screen size and variant
 */
export function ResponsiveGrid({
  children,
  variant = "cards",
  minColumns = 1,
  maxColumns = 3,
  gap = "md",
}: ResponsiveGridProps) {
  const gridClasses = useMemo(() => {
    // Gap classes
    const gapMap = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    };

    // Column classes based on variant
    const variantClasses: Record<string, string> = {
      cards: `grid ${gapMap[gap]} grid-cols-${minColumns} md:grid-cols-2 lg:grid-cols-${maxColumns}`,
      list: `flex flex-col ${gapMap[gap]}`,
      compact: `grid ${gapMap[gap]} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`,
    };

    return variantClasses[variant];
  }, [variant, minColumns, maxColumns, gap]);

  // Generate proper Tailwind classes
  const generateGridClass = () => {
    const gapMap: Record<string, string> = {
      sm: "gap-3",
      md: "gap-4",
      lg: "gap-6",
    };

    if (variant === "list") {
      return `flex flex-col ${gapMap[gap]}`;
    }

    if (variant === "compact") {
      return `grid ${gapMap[gap]} grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4`;
    }

    // Default cards variant
    if (maxColumns === 1) {
      return `grid ${gapMap[gap]} grid-cols-1`;
    } else if (maxColumns === 2) {
      return `grid ${gapMap[gap]} grid-cols-1 md:grid-cols-2`;
    } else {
      return `grid ${gapMap[gap]} grid-cols-1 md:grid-cols-2 lg:grid-cols-3`;
    }
  };

  return <div className={generateGridClass()}>{children}</div>;
}

/**
 * MobileOptimizedGrid Component
 * Pre-configured grid for mobile library display
 * Automatically handles touch targets and spacing
 */
export function MobileOptimizedGrid({
  children,
  variant = "cards",
  gap = "md",
}: Omit<ResponsiveGridProps, "minColumns" | "maxColumns">) {
  return (
    <ResponsiveGrid
      variant={variant}
      minColumns={1}
      maxColumns={3}
      gap={gap}
    >
      {children}
    </ResponsiveGrid>
  );
}

export default ResponsiveGrid;

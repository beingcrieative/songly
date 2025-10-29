"use client";

import { ReactNode, useMemo } from "react";
import { ChevronDown } from "lucide-react";

export type SectionType =
  | "action_required"
  | "in_progress"
  | "completed"
  | "discovery";

export interface SmartSectionProps {
  type: SectionType;
  title: string;
  description?: string;
  icon?: ReactNode;
  children: ReactNode;
  itemCount: number;
  isExpanded?: boolean;
  onToggleExpanded?: (expanded: boolean) => void;
  emptyStateMessage?: string;
  showEmptyState?: boolean;
  badge?: string | number;
}

/**
 * SmartSection Component
 * Displays a section with dynamic headers, icons, and optional expansion
 * Used for organizing songs by priority/status in the library
 */
export function SmartSection({
  type,
  title,
  description,
  icon,
  children,
  itemCount,
  isExpanded = true,
  onToggleExpanded,
  emptyStateMessage = "No items in this section",
  showEmptyState = false,
  badge,
}: SmartSectionProps) {
  const sectionStyles = useMemo(() => {
    switch (type) {
      case "action_required":
        return {
          headerBg: "bg-gradient-to-r from-amber-50 to-orange-50",
          titleColor: "text-amber-900",
          descColor: "text-amber-700/70",
          badgeBg: "bg-amber-100",
          badgeColor: "text-amber-900",
          borderColor: "border-amber-200",
        };
      case "in_progress":
        return {
          headerBg: "bg-gradient-to-r from-blue-50 to-cyan-50",
          titleColor: "text-blue-900",
          descColor: "text-blue-700/70",
          badgeBg: "bg-blue-100",
          badgeColor: "text-blue-900",
          borderColor: "border-blue-200",
        };
      case "completed":
        return {
          headerBg: "bg-gradient-to-r from-emerald-50 to-green-50",
          titleColor: "text-emerald-900",
          descColor: "text-emerald-700/70",
          badgeBg: "bg-emerald-100",
          badgeColor: "text-emerald-900",
          borderColor: "border-emerald-200",
        };
      case "discovery":
        return {
          headerBg: "bg-gradient-to-r from-slate-50 to-gray-50",
          titleColor: "text-slate-900",
          descColor: "text-slate-700/70",
          badgeBg: "bg-slate-100",
          badgeColor: "text-slate-900",
          borderColor: "border-slate-200",
        };
      default:
        return {
          headerBg: "bg-white",
          titleColor: "text-slate-900",
          descColor: "text-slate-700/70",
          badgeBg: "bg-slate-100",
          badgeColor: "text-slate-900",
          borderColor: "border-slate-200",
        };
    }
  }, [type]);

  const hasItems = itemCount > 0;
  const shouldShowEmptyState = showEmptyState && !hasItems;

  return (
    <section className={`overflow-hidden rounded-xl border ${sectionStyles.borderColor}`}>
      {/* Header */}
      <button
        onClick={() => onToggleExpanded?.(!isExpanded)}
        className={`w-full ${sectionStyles.headerBg} px-6 py-4 transition-colors hover:opacity-80`}
        disabled={!onToggleExpanded}
      >
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            {icon && <span className="text-xl">{icon}</span>}
            <div className="text-left">
              <h2 className={`text-lg font-semibold ${sectionStyles.titleColor}`}>
                {title}
              </h2>
              {description && (
                <p className={`text-sm ${sectionStyles.descColor}`}>
                  {description}
                </p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {badge !== undefined && (
              <span
                className={`${sectionStyles.badgeBg} ${sectionStyles.badgeColor} inline-flex min-w-fit rounded-full px-3 py-1 text-sm font-semibold`}
              >
                {badge}
              </span>
            )}
            {onToggleExpanded && (
              <ChevronDown
                className={`h-5 w-5 transition-transform ${
                  isExpanded ? "rotate-0" : "-rotate-90"
                } ${sectionStyles.titleColor}`}
              />
            )}
          </div>
        </div>
      </button>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-inherit bg-white">
          {shouldShowEmptyState ? (
            <div className="flex min-h-[200px] items-center justify-center px-6 py-8">
              <div className="text-center">
                <p className="text-sm text-slate-500">{emptyStateMessage}</p>
              </div>
            </div>
          ) : (
            <div className="px-6 py-4">{children}</div>
          )}
        </div>
      )}
    </section>
  );
}

export default SmartSection;

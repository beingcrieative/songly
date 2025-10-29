"use client";

import { ReactNode } from "react";
import { ChevronDown } from "lucide-react";
import type { SectionType } from "./SmartSection";

interface SectionHeaderProps {
  type: SectionType;
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string | number;
  isExpanded?: boolean;
  onToggle?: (expanded: boolean) => void;
  isCollapsible?: boolean;
}

/**
 * SectionHeader Component
 * Reusable header for smart sections with conversational titles
 * Supports dynamic styling based on section type
 */
export function SectionHeader({
  type,
  title,
  description,
  icon,
  badge,
  isExpanded = true,
  onToggle,
  isCollapsible = true,
}: SectionHeaderProps) {
  const getHeaderStyles = (sectionType: SectionType) => {
    switch (sectionType) {
      case "action_required":
        return {
          bg: "bg-gradient-to-r from-amber-50 to-orange-50",
          border: "border-amber-200",
          title: "text-amber-900",
          desc: "text-amber-700/70",
          badge: "bg-amber-100 text-amber-900",
          icon: "text-amber-600",
          hover: "hover:bg-gradient-to-r hover:from-amber-100 hover:to-orange-100",
        };
      case "in_progress":
        return {
          bg: "bg-gradient-to-r from-blue-50 to-cyan-50",
          border: "border-blue-200",
          title: "text-blue-900",
          desc: "text-blue-700/70",
          badge: "bg-blue-100 text-blue-900",
          icon: "text-blue-600",
          hover: "hover:bg-gradient-to-r hover:from-blue-100 hover:to-cyan-100",
        };
      case "completed":
        return {
          bg: "bg-gradient-to-r from-emerald-50 to-green-50",
          border: "border-emerald-200",
          title: "text-emerald-900",
          desc: "text-emerald-700/70",
          badge: "bg-emerald-100 text-emerald-900",
          icon: "text-emerald-600",
          hover: "hover:bg-gradient-to-r hover:from-emerald-100 hover:to-green-100",
        };
      case "discovery":
        return {
          bg: "bg-gradient-to-r from-slate-50 to-gray-50",
          border: "border-slate-200",
          title: "text-slate-900",
          desc: "text-slate-700/70",
          badge: "bg-slate-100 text-slate-900",
          icon: "text-slate-600",
          hover: "hover:bg-gradient-to-r hover:from-slate-100 hover:to-gray-100",
        };
      default:
        return {
          bg: "bg-white",
          border: "border-slate-200",
          title: "text-slate-900",
          desc: "text-slate-700/70",
          badge: "bg-slate-100 text-slate-900",
          icon: "text-slate-600",
          hover: "hover:opacity-80",
        };
    }
  };

  const styles = getHeaderStyles(type);

  return (
    <div
      className={`flex items-center justify-between gap-4 px-6 py-4 ${styles.bg} border-b ${styles.border} ${
        isCollapsible ? `cursor-pointer transition-all ${styles.hover}` : ""
      }`}
      onClick={() => isCollapsible && onToggle?.(!isExpanded)}
      role={isCollapsible ? "button" : undefined}
      tabIndex={isCollapsible ? 0 : undefined}
    >
      <div className="flex items-center gap-3 flex-1">
        {icon && (
          <span className={`text-2xl ${styles.icon} flex-shrink-0`}>{icon}</span>
        )}
        <div className="flex-1 min-w-0">
          <h2 className={`text-lg font-semibold ${styles.title} truncate`}>
            {title}
          </h2>
          {description && (
            <p className={`text-sm ${styles.desc} truncate`}>
              {description}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 flex-shrink-0">
        {badge !== undefined && (
          <span
            className={`${styles.badge} inline-flex min-w-fit rounded-full px-3 py-1 text-sm font-semibold whitespace-nowrap`}
          >
            {badge}
          </span>
        )}
        {isCollapsible && (
          <ChevronDown
            className={`h-5 w-5 transition-transform ${
              isExpanded ? "rotate-0" : "-rotate-90"
            } ${styles.title} flex-shrink-0`}
          />
        )}
      </div>
    </div>
  );
}

export default SectionHeader;

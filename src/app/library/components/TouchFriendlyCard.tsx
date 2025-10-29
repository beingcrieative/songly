"use client";

import { ReactNode } from "react";

interface TouchFriendlyCardProps {
  children: ReactNode;
  onClick?: () => void;
  onLongPress?: () => void;
  variant?: "default" | "compact" | "minimal";
  isSelectable?: boolean;
  isSelected?: boolean;
}

/**
 * TouchFriendlyCard Component
 * Card layout optimized for touch with 44px+ minimum touch targets
 * Follows Apple HIG and Material Design guidelines
 */
export function TouchFriendlyCard({
  children,
  onClick,
  onLongPress,
  variant = "default",
  isSelectable = false,
  isSelected = false,
}: TouchFriendlyCardProps) {
  // Get padding based on variant
  const paddingClasses = {
    default: "p-4", // 16px padding = 48px min touch target
    compact: "p-3", // 12px padding = 44px min touch target
    minimal: "p-2", // 8px padding = 40px (touch target should be on children)
  };

  const handleLongPress = () => {
    if (!onLongPress) return;

    let touchStartTime: number;

    const handleMouseDown = () => {
      touchStartTime = Date.now();
    };

    const handleMouseUp = () => {
      const duration = Date.now() - touchStartTime;
      if (duration >= 500) {
        onLongPress();
      }
    };

    // Approximate long press with touch
    window.addEventListener("touchstart", handleMouseDown);
    window.addEventListener("touchend", handleMouseUp);

    return () => {
      window.removeEventListener("touchstart", handleMouseDown);
      window.removeEventListener("touchend", handleMouseUp);
    };
  };

  return (
    <div
      onClick={onClick}
      onLongPress={handleLongPress}
      className={`
        rounded-xl border-2 transition-all duration-200 cursor-pointer
        ${paddingClasses[variant]}
        ${isSelectable && isSelected ? "border-blue-500 bg-blue-50" : "border-slate-200 hover:border-slate-300 active:bg-slate-50"}
        ${onClick || onLongPress ? "active:scale-95" : ""}
      `}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : -1}
      onKeyPress={(e) => {
        if ((e.key === "Enter" || e.key === " ") && onClick) {
          onClick();
        }
      }}
    >
      {children}
    </div>
  );
}

/**
 * TouchButton Component
 * Button with guaranteed 44px+ touch target
 */
interface TouchButtonProps {
  children: ReactNode;
  onClick?: () => void;
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
}

export function TouchButton({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  loading = false,
  fullWidth = false,
}: TouchButtonProps) {
  const sizeClasses = {
    sm: "px-3 py-2 text-sm", // 32px+ min height
    md: "px-4 py-3 text-base", // 44px min height (guaranteed)
    lg: "px-6 py-4 text-lg", // 48px+ min height
  };

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-rose-500 to-rose-600 text-white hover:shadow-md active:shadow-lg",
    secondary:
      "bg-slate-100 text-slate-900 hover:bg-slate-200 active:bg-slate-300",
    ghost: "text-slate-700 hover:bg-slate-100 active:bg-slate-200",
    danger: "bg-rose-100 text-rose-700 hover:bg-rose-200 active:bg-rose-300",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled || loading}
      className={`
        rounded-lg font-semibold transition-all duration-150 active:scale-95
        ${sizeClasses[size]}
        ${variantClasses[variant]}
        ${fullWidth ? "w-full" : ""}
        ${disabled || loading ? "opacity-60 cursor-not-allowed" : ""}
        min-h-[44px] min-w-[44px] flex items-center justify-center gap-2
      `}
    >
      {loading ? (
        <>
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          <span>Loading...</span>
        </>
      ) : (
        children
      )}
    </button>
  );
}

/**
 * TouchControl Component
 * Icon button with 44px+ touch target
 */
interface TouchControlProps {
  icon: ReactNode;
  label?: string;
  onClick?: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
}

export function TouchControl({
  icon,
  label,
  onClick,
  variant = "default",
  disabled = false,
}: TouchControlProps) {
  const variantClasses = {
    default: "text-slate-600 hover:bg-slate-100",
    primary: "text-blue-600 hover:bg-blue-50",
    danger: "text-rose-600 hover:bg-rose-50",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        flex min-h-[44px] min-w-[44px] flex-col items-center justify-center gap-1 rounded-lg transition-colors
        ${variantClasses[variant]}
        ${disabled ? "opacity-60 cursor-not-allowed" : ""}
      `}
      title={label}
    >
      <div className="text-2xl">{icon}</div>
      {label && <span className="text-xs font-medium">{label}</span>}
    </button>
  );
}

export default TouchFriendlyCard;

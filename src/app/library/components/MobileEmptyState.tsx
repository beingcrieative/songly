"use client";

import { ReactNode } from "react";

interface MobileEmptyStateProps {
  icon: string | ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  secondaryAction?: {
    label: string;
    onClick: () => void;
  };
}

/**
 * MobileEmptyState Component
 * Mobile-optimized empty state with large touch targets
 * Designed for smaller screens with clear call-to-action
 */
export function MobileEmptyState({
  icon,
  title,
  description,
  action,
  secondaryAction,
}: MobileEmptyStateProps) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 text-center md:min-h-[50vh]">
      {/* Icon */}
      <div className="mb-6 text-6xl">{icon}</div>

      {/* Title */}
      <h2 className="mb-3 text-2xl font-bold text-slate-900">{title}</h2>

      {/* Description */}
      <p className="mb-8 max-w-sm text-base text-slate-600">{description}</p>

      {/* Actions */}
      {(action || secondaryAction) && (
        <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-center">
          {action && (
            <button
              onClick={action.onClick}
              className="rounded-xl bg-gradient-to-r from-rose-500 to-rose-600 px-6 py-3 text-base font-semibold text-white transition active:shadow-lg hover:shadow-md"
            >
              {action.label}
            </button>
          )}

          {secondaryAction && (
            <button
              onClick={secondaryAction.onClick}
              className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 text-base font-semibold text-slate-700 transition active:bg-slate-50 hover:border-slate-400"
            >
              {secondaryAction.label}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

/**
 * MobileLoadingState Component
 * Mobile-optimized loading state
 */
export function MobileLoadingState({
  message = "Loading your songs...",
}: {
  message?: string;
} = {}) {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-6 py-12 md:min-h-[50vh]">
      <div className="mb-6 flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-slate-200 border-t-rose-500" />
      </div>
      <p className="text-center text-base text-slate-600">{message}</p>
    </div>
  );
}

/**
 * MobileErrorState Component
 * Mobile-optimized error state with retry option
 */
export function MobileErrorState({
  title = "Something went wrong",
  description = "We couldn't load your library. Please try again.",
  onRetry,
}: {
  title?: string;
  description?: string;
  onRetry?: () => void;
} = {}) {
  return (
    <MobileEmptyState
      icon="⚠️"
      title={title}
      description={description}
      action={
        onRetry
          ? {
              label: "Try Again",
              onClick: onRetry,
            }
          : undefined
      }
    />
  );
}

export default MobileEmptyState;

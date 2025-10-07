"use client";

import { useState, useEffect } from "react";

interface ComposerContext {
  mood?: string[];
  sections?: string[];
  tone?: string[];
  suggested_action?: string;
}

interface ComposerControlsProps {
  composerContext?: string | null;
  onSuggestionClick?: (suggestion: string) => void;
  className?: string;
  // Two-agent system props
  roundNumber?: number;
  readinessScore?: number;
  onGenerateNow?: () => void;
}

export function ComposerControls({
  composerContext,
  onSuggestionClick,
  className = "",
  roundNumber = 0,
  readinessScore = 0,
  onGenerateNow,
}: ComposerControlsProps) {
  const [context, setContext] = useState<ComposerContext | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Show "Genereer nu" button after round 4 when readiness > 0.5
  const MIN_ROUNDS_FOR_EARLY_TRIGGER = 4;
  const MIN_READINESS_FOR_EARLY_TRIGGER = 0.5;
  const showGenerateButton =
    roundNumber >= MIN_ROUNDS_FOR_EARLY_TRIGGER &&
    readinessScore >= MIN_READINESS_FOR_EARLY_TRIGGER &&
    onGenerateNow;

  // Parse composer context JSON
  useEffect(() => {
    if (composerContext) {
      try {
        const parsed = JSON.parse(composerContext);
        setContext(parsed);

        // Trigger refresh animation
        setIsRefreshing(true);
        setTimeout(() => setIsRefreshing(false), 600);

        // Track analytics event
        trackAnalyticsEvent("composer_context_loaded", {
          hasMood: !!parsed.mood,
          hasSections: !!parsed.sections,
          hasTone: !!parsed.tone,
        });
      } catch (e) {
        console.warn("Failed to parse composer context:", e);
        setContext(null);
      }
    } else {
      setContext(null);
    }
  }, [composerContext]);

  const handleSuggestionClick = (suggestion: string, type: string) => {
    if (onSuggestionClick) {
      onSuggestionClick(suggestion);
    }

    // Track analytics
    trackAnalyticsEvent("composer_suggestion_clicked", {
      type,
      suggestion,
    });
  };

  // Fallback UI when no context exists
  if (!context) {
    return (
      <div className={`rounded-lg border border-gray-200 bg-gray-50 p-4 ${className}`}>
        {/* Generate Now button */}
        {showGenerateButton && (
          <button
            onClick={onGenerateNow}
            className="mb-4 w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:from-pink-600 hover:to-purple-600"
          >
            ✨ Genereer nu het liedje
          </button>
        )}

        <div className="flex items-center gap-3">
          <div className="flex-shrink-0">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-200">
              <svg
                className="h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3"
                />
              </svg>
            </div>
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-600">
              Snelle aanpassingen
            </p>
            <p className="text-xs text-gray-500">
              Suggesties verschijnen tijdens het gesprek
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-lg border border-pink-200 bg-gradient-to-br from-pink-50 to-purple-50 p-4 shadow-sm ${
        isRefreshing ? "animate-pulse" : ""
      } ${className}`}
    >
      {/* Header */}
      <div className="mb-3 flex items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-pink-200">
          <svg
            className="h-4 w-4 text-pink-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-800">
            Snelle aanpassingen
          </h3>
          {context.suggested_action && (
            <p className="text-xs text-gray-600">{context.suggested_action}</p>
          )}
        </div>
      </div>

      {/* Generate Now button */}
      {showGenerateButton && (
        <button
          onClick={onGenerateNow}
          className="mb-4 w-full rounded-lg bg-gradient-to-r from-pink-500 to-purple-500 px-4 py-3 text-sm font-bold text-white shadow-md transition-all hover:shadow-lg hover:from-pink-600 hover:to-purple-600"
        >
          ✨ Genereer nu het liedje
        </button>
      )}

      {/* Mood suggestions */}
      {context.mood && context.mood.length > 0 && (
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600">
            Sfeer
          </label>
          <div className="flex flex-wrap gap-2">
            {context.mood.map((mood, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(mood, "mood")}
                className="rounded-full border border-pink-300 bg-white px-3 py-1.5 text-sm font-medium text-pink-700 transition-all hover:border-pink-500 hover:bg-pink-50 hover:shadow-sm"
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Tone suggestions */}
      {context.tone && context.tone.length > 0 && (
        <div className="mb-3">
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600">
            Toon
          </label>
          <div className="flex flex-wrap gap-2">
            {context.tone.map((tone, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(tone, "tone")}
                className="rounded-full border border-purple-300 bg-white px-3 py-1.5 text-sm font-medium text-purple-700 transition-all hover:border-purple-500 hover:bg-purple-50 hover:shadow-sm"
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Section suggestions */}
      {context.sections && context.sections.length > 0 && (
        <div>
          <label className="mb-1.5 block text-xs font-medium uppercase tracking-wide text-gray-600">
            Secties
          </label>
          <div className="flex flex-wrap gap-2">
            {context.sections.map((section, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(section, "section")}
                className="rounded-full border border-blue-300 bg-white px-3 py-1.5 text-sm font-medium text-blue-700 transition-all hover:border-blue-500 hover:bg-blue-50 hover:shadow-sm"
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Refresh indicator */}
      {isRefreshing && (
        <div className="mt-3 flex items-center gap-2 text-xs text-pink-600">
          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-pink-500"></div>
          <span>Bijgewerkt</span>
        </div>
      )}
    </div>
  );
}

// Analytics tracking helper
function trackAnalyticsEvent(eventName: string, properties?: Record<string, any>) {
  // Log to console in development
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", eventName, properties);
  }

  // In production, you would send to your analytics service
  // Example: analytics.track(eventName, properties);

  // For now, we'll use a simple event dispatch that could be captured
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("composer-analytics", {
        detail: { eventName, properties, timestamp: Date.now() },
      })
    );
  }
}

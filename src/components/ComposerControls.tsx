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
  roundNumber?: number;
  readinessScore?: number;
  onGenerateNow?: () => void;
  isKeyboardOpen?: boolean;
  hideOnKeyboard?: boolean;
}

export function ComposerControls({
  composerContext,
  onSuggestionClick,
  className = "",
  roundNumber = 0,
  readinessScore = 0,
  onGenerateNow,
  isKeyboardOpen = false,
  hideOnKeyboard = true,
}: ComposerControlsProps) {
  const [context, setContext] = useState<ComposerContext | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const MIN_ROUNDS_FOR_EARLY_TRIGGER = 4;
  const MIN_READINESS_FOR_EARLY_TRIGGER = 0.5;
  const showGenerateButton =
    roundNumber >= MIN_ROUNDS_FOR_EARLY_TRIGGER &&
    readinessScore >= MIN_READINESS_FOR_EARLY_TRIGGER &&
    onGenerateNow;

  useEffect(() => {
    if (composerContext) {
      try {
        const parsed = JSON.parse(composerContext);
        setContext(parsed);
        setIsRefreshing(true);
        const timeout = setTimeout(() => setIsRefreshing(false), 600);
        trackAnalyticsEvent("composer_context_loaded", {
          hasMood: !!parsed.mood,
          hasSections: !!parsed.sections,
          hasTone: !!parsed.tone,
        });
        return () => clearTimeout(timeout);
      } catch (error) {
        console.warn("Failed to parse composer context:", error);
        setContext(null);
      }
    } else {
      setContext(null);
    }
  }, [composerContext]);

  const handleSuggestionClick = (suggestion: string, type: string) => {
    onSuggestionClick?.(suggestion);
    trackAnalyticsEvent("composer_suggestion_clicked", {
      type,
      suggestion,
    });
  };

  const renderGenerateButton = () =>
    showGenerateButton ? (
      <button
        onClick={onGenerateNow}
        className="mb-4 w-full rounded-full px-4 py-3 text-sm font-bold text-white shadow-lg transition-all hover:shadow-xl"
        style={{ backgroundImage: 'var(--gradient-primary)' }}
      >
        ✨ Genereer nu het liedje
      </button>
    ) : null;

  if (hideOnKeyboard && isKeyboardOpen) {
    return null;
  }

  if (!context) {
    return (
      <div
        className={`rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/85 p-4 shadow-sm backdrop-blur ${className}`}
      >
        {renderGenerateButton()}
        <div className="flex items-center gap-3">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-full"
            style={{ backgroundColor: 'rgba(32,178,170,0.12)', color: 'var(--color-secondary)' }}
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
          </div>
          <div className="flex-1">
            <p className="text-sm font-semibold" style={{ color: 'var(--color-secondary)' }}>
              Snelle aanpassingen
            </p>
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              Suggesties verschijnen tijdens het gesprek
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-[rgba(15,23,42,0.08)] bg-white/85 p-4 shadow-sm backdrop-blur transition-shadow ${
        isRefreshing ? 'animate-pulse' : ''
      } ${className}`}
    >
      <div className="mb-3 flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-full"
          style={{ backgroundColor: 'rgba(32,178,170,0.15)', color: 'var(--color-primary)' }}
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--color-secondary)' }}>
            Snelle aanpassingen
          </h3>
          {context.suggested_action && (
            <p className="text-xs" style={{ color: 'var(--color-muted)' }}>
              {context.suggested_action}
            </p>
          )}
        </div>
      </div>

      {renderGenerateButton()}

      {context.mood && context.mood.length > 0 && (
        <div className="mb-3">
          <label
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-muted)' }}
          >
            Sfeer
          </label>
          <div className="flex flex-wrap gap-2">
            {context.mood.map((mood, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(mood, 'mood')}
                className="rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm"
                style={{
                  borderColor: 'rgba(74, 222, 128, 0.35)',
                  color: 'var(--color-secondary)',
                  background: 'rgba(255,255,255,0.85)',
                }}
              >
                {mood}
              </button>
            ))}
          </div>
        </div>
      )}

      {context.tone && context.tone.length > 0 && (
        <div className="mb-3">
          <label
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-muted)' }}
          >
            Toon
          </label>
          <div className="flex flex-wrap gap-2">
            {context.tone.map((tone, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(tone, 'tone')}
                className="rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm"
                style={{
                  borderColor: 'rgba(32, 178, 170, 0.3)',
                  color: 'var(--color-secondary)',
                  background: 'rgba(255,255,255,0.9)',
                }}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>
      )}

      {context.sections && context.sections.length > 0 && (
        <div>
          <label
            className="mb-1.5 block text-xs font-medium uppercase tracking-wide"
            style={{ color: 'var(--color-muted)' }}
          >
            Secties
          </label>
          <div className="flex flex-wrap gap-2">
            {context.sections.map((section, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(section, 'section')}
                className="rounded-full border px-3 py-1.5 text-sm font-medium transition-all hover:shadow-sm"
                style={{
                  borderColor: 'rgba(15, 23, 42, 0.12)',
                  color: '#0f172a',
                  background: 'rgba(255,255,255,0.9)',
                }}
              >
                {section}
              </button>
            ))}
          </div>
        </div>
      )}

      {isRefreshing && (
        <div className="mt-3 flex items-center gap-2 text-xs" style={{ color: 'var(--color-primary)' }}>
          <div
            className="h-1.5 w-1.5 animate-pulse rounded-full"
            style={{ backgroundColor: 'var(--color-primary)' }}
          ></div>
          <span>Bijgewerkt</span>
        </div>
      )}
    </div>
  );
}

function trackAnalyticsEvent(eventName: string, properties?: Record<string, any>) {
  if (process.env.NODE_ENV === "development") {
    console.log("[Analytics]", eventName, properties);
  }

  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("composer-analytics", {
        detail: { eventName, properties, timestamp: Date.now() },
      })
    );
  }
}

export default ComposerControls;

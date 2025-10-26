"use client";

import { useState, useEffect } from 'react';
import { useSwipeable } from 'react-swipeable';
import type { LyricsChoiceModalProps } from '@/types/library';
import { trackLyricsVariantSelected, trackLyricsSwipe } from '@/lib/analytics/events';

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(' ');
}

export default function LyricsChoiceModal({
  isOpen,
  onClose,
  variants,
  songId,
  songTitle,
  onSelectVariant,
  isSubmitting = false,
}: LyricsChoiceModalProps) {
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [modalOpenTime] = useState(Date.now());
  const [localSubmitting, setLocalSubmitting] = useState(false);

  // Reset selected index when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Keyboard navigation for desktop
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft' && selectedIndex > 0) {
        setSelectedIndex((i) => i - 1);
      } else if (e.key === 'ArrowRight' && selectedIndex < variants.length - 1) {
        setSelectedIndex((i) => i + 1);
      } else if (e.key === 'Enter' && !isSubmitting && !localSubmitting) {
        handleSelect(selectedIndex);
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, selectedIndex, isSubmitting, localSubmitting, variants.length]);

  const handleSelect = async (index: number) => {
    setLocalSubmitting(true);
    try {
      await onSelectVariant(index);

      // Track selection
      trackLyricsVariantSelected({
        songId,
        variantIndex: index,
        timeToSelect: Date.now() - modalOpenTime,
      });

      onClose();
    } catch (error) {
      console.error('Failed to select variant:', error);
      alert('Er ging iets mis bij het kiezen van de lyrics.');
    } finally {
      setLocalSubmitting(false);
    }
  };

  const nextVariant = () => {
    if (selectedIndex < variants.length - 1) {
      const fromIndex = selectedIndex;
      const toIndex = selectedIndex + 1;
      trackLyricsSwipe({ songId, direction: 'left', fromIndex, toIndex });
      setSelectedIndex(toIndex);
    }
  };

  const prevVariant = () => {
    if (selectedIndex > 0) {
      const fromIndex = selectedIndex;
      const toIndex = selectedIndex - 1;
      trackLyricsSwipe({ songId, direction: 'right', fromIndex, toIndex });
      setSelectedIndex(toIndex);
    }
  };

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => nextVariant(),
    onSwipedRight: () => prevVariant(),
    preventScrollOnSwipe: true,
    trackMouse: false,
    delta: 50,
  });

  if (!isOpen) return null;

  const submitting = isSubmitting || localSubmitting;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60" />

      {/* Modal Content */}
      <div
        className="relative z-10 w-full max-w-4xl rounded-2xl bg-white p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-start justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">
                Kies je favoriete lyrics
              </h2>
              <p className="mt-1 text-sm text-slate-600">
                Voor: <span className="font-semibold">{songTitle}</span>
              </p>
            </div>
            <button
              onClick={onClose}
              className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              aria-label="Sluiten"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Desktop: Side by side */}
        <div className="hidden md:grid md:grid-cols-2 md:gap-4">
          {variants.map((variant, index) => (
            <div
              key={index}
              className={cn(
                "cursor-pointer rounded-xl border p-4 transition",
                selectedIndex === index
                  ? "border-rose-500 bg-rose-50/50 ring-2 ring-rose-500/20"
                  : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"
              )}
              onClick={() => setSelectedIndex(index)}
            >
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-semibold text-slate-900">
                  Variant {index + 1}
                </h3>
                {selectedIndex === index && (
                  <span className="rounded-full bg-rose-500 px-2 py-0.5 text-xs font-semibold text-white">
                    Geselecteerd
                  </span>
                )}
              </div>
              <div className="max-h-96 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
                {variant.text}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleSelect(index);
                }}
                disabled={submitting}
                className="mt-4 w-full rounded-lg bg-rose-500 py-2.5 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? 'Bezig...' : '✓ Kies deze variant'}
              </button>
            </div>
          ))}
        </div>

        {/* Mobile: Swipeable */}
        <div className="md:hidden" {...swipeHandlers}>
          {/* Indicator */}
          <div className="mb-4 flex items-center justify-center gap-4">
            <div className="flex gap-1.5">
              {variants.map((_, i) => (
                <div
                  key={i}
                  className={cn(
                    "h-2 w-2 rounded-full transition-all",
                    i === selectedIndex
                      ? "scale-125 bg-rose-500"
                      : "bg-slate-300"
                  )}
                />
              ))}
            </div>
            <span className="text-sm font-medium text-slate-600">
              Variant {selectedIndex + 1} van {variants.length}
            </span>
          </div>

          {/* Content */}
          <div className="rounded-xl border border-slate-200 p-4">
            <h3 className="mb-3 font-semibold text-slate-900">
              Variant {selectedIndex + 1}
            </h3>
            <div className="max-h-80 overflow-y-auto whitespace-pre-wrap text-sm text-slate-700">
              {variants[selectedIndex]?.text}
            </div>
          </div>

          {/* Swipe Hint */}
          <p className="mt-2 text-center text-xs text-slate-500">
            {selectedIndex === 0 && variants.length > 1
              ? "← Swipe voor variant 2"
              : selectedIndex === variants.length - 1
                ? "Swipe voor variant 1 →"
                : "← Swipe om te wisselen →"}
          </p>

          {/* CTA */}
          <button
            onClick={() => handleSelect(selectedIndex)}
            disabled={submitting}
            className="mt-4 w-full rounded-lg bg-rose-500 py-3 text-sm font-semibold text-white transition hover:bg-rose-600 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {submitting ? 'Bezig...' : '✓ Kies deze variant'}
          </button>
        </div>

        {/* Helper text */}
        <p className="mt-4 hidden text-center text-xs text-slate-500 md:block">
          Gebruik de pijltjestoetsen (← →) om te wisselen · Enter om te bevestigen · Esc om te sluiten
        </p>
      </div>
    </div>
  );
}

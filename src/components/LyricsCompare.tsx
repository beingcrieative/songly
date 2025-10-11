"use client";

import React, { useMemo, useRef, memo, useCallback } from "react";

interface LyricsCompareProps {
  options: string[];
  selectedIndex: number | null;
  onSelect: (index: number) => void;
  onUseSelected: () => void;
  isRefining?: boolean;
  isSaving?: boolean;
}

const LyricsCompareComponent = memo(function LyricsCompare({
  options,
  selectedIndex,
  onSelect,
  onUseSelected,
  isRefining = false,
  isSaving = false,
}: LyricsCompareProps) {
  const labels = ["Versie A", "Versie B", "Versie C", "Versie D"]; // fallback labels
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  const baseCardClasses =
    "flex flex-col rounded-xl border bg-white/95 shadow-sm transition-colors";
  const selectedClasses = "border-pink-500";
  const unselectedClasses = "border-gray-200";

  const isStickyEnabled = selectedIndex !== null && !isRefining;

  const effectiveSelected = useMemo(() => {
    if (selectedIndex === null) {
      return options.length > 0 ? 0 : null;
    }
    return selectedIndex;
  }, [selectedIndex, options.length]);

  const handleTouchStart = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    const touch = event.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
  }, []);

  const handleTouchEnd = useCallback((event: React.TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null || touchStartY.current === null) return;
    const touch = event.changedTouches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = touch.clientY - touchStartY.current;

    // Ignore mostly vertical swipes to avoid interfering with scroll
    if (Math.abs(deltaY) > Math.abs(deltaX)) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const threshold = 40;
    if (Math.abs(deltaX) < threshold || options.length < 2) {
      touchStartX.current = null;
      touchStartY.current = null;
      return;
    }

    const currentIndex = effectiveSelected ?? 0;
    const direction = deltaX < 0 ? 1 : -1; // swipe left -> next (index+1)
    let nextIndex = currentIndex + direction;
    if (nextIndex < 0) nextIndex = 0;
    if (nextIndex >= options.length) nextIndex = options.length - 1;

    if (nextIndex !== currentIndex) {
      onSelect(nextIndex);
    }

    touchStartX.current = null;
    touchStartY.current = null;
  }, [effectiveSelected, options.length, onSelect]);

  const handleKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    // Arrow key navigation between variants
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const currentIndex = selectedIndex ?? 0;
      const direction = event.key === "ArrowRight" ? 1 : -1;
      let nextIndex = currentIndex + direction;
      if (nextIndex < 0) nextIndex = 0;
      if (nextIndex >= options.length) nextIndex = options.length - 1;
      if (nextIndex !== currentIndex) {
        onSelect(nextIndex);
      }
    }
    // Enter to confirm selection
    if (event.key === "Enter" && selectedIndex !== null && !isRefining && !isSaving) {
      event.preventDefault();
      onUseSelected();
    }
  }, [selectedIndex, options.length, onSelect, isRefining, isSaving, onUseSelected]);

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col px-4 py-6">
      <h2 id="lyrics-compare-heading" className="mb-4 text-center text-lg font-bold text-gray-800">
        Kies je favoriete lyrics
      </h2>

      <div
        role="group"
        aria-labelledby="lyrics-compare-heading"
        aria-describedby="lyrics-compare-description"
        className="grid gap-4 md:grid-cols-2"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onKeyDown={handleKeyDown}
        tabIndex={0}
      >
        <div id="lyrics-compare-description" className="sr-only">
          Vergelijk twee lyrics varianten en selecteer je favoriet. Gebruik pijltjestoetsen om te navigeren, Enter om te bevestigen, of swipe links/rechts op mobiel.
        </div>
        {options.map((text, idx) => (
          <div
            key={idx}
            role="article"
            aria-labelledby={`lyrics-option-${idx}`}
            className={`${baseCardClasses} ${selectedIndex === idx ? selectedClasses : unselectedClasses}`}
          >
            <div className="flex items-center justify-between border-b border-gray-200 px-4 py-2">
              <div className="flex items-center gap-2">
                <input
                  type="radio"
                  name="lyricsOption"
                  id={`lyrics-option-${idx}`}
                  checked={selectedIndex === idx}
                  onChange={() => onSelect(idx)}
                  className="h-4 w-4 text-pink-600 focus:ring-pink-500"
                  aria-label={`Selecteer ${labels[idx] || `Versie ${idx + 1}`}`}
                />
                <label
                  htmlFor={`lyrics-option-${idx}`}
                  className="text-sm font-semibold text-gray-700 cursor-pointer"
                >
                  {labels[idx] || `Versie ${idx + 1}`}
                </label>
              </div>
              {selectedIndex === idx && (
                <span className="rounded-full bg-pink-100 px-2 py-0.5 text-xs font-semibold text-pink-700">
                  Geselecteerd
                </span>
              )}
            </div>

            <div
              className="max-h-96 flex-1 overflow-y-auto px-4 py-3"
              tabIndex={0}
              aria-label={`Lyrics tekst voor ${labels[idx] || `Versie ${idx + 1}`}`}
            >
              <div className="whitespace-pre-wrap font-serif text-sm leading-relaxed text-gray-800">
                {text}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div
        className={`mt-5 flex items-center justify-center gap-3 md:static md:mt-6 ${
          isStickyEnabled ? "sticky bottom-4" : "sticky bottom-4"
        }`}
      >
        <div className="w-full max-w-sm rounded-full bg-white/80 p-2 shadow-md backdrop-blur md:bg-transparent md:p-0 md:shadow-none">
          <button
            type="button"
            disabled={selectedIndex === null || isRefining || isSaving}
            onClick={onUseSelected}
            aria-label={
              selectedIndex === null
                ? "Selecteer eerst een lyrics variant"
                : isSaving
                  ? "Bezig met opslaan..."
                  : isRefining
                    ? "Bezig met verfijnen..."
                    : `Gebruik ${labels[selectedIndex] || `Versie ${selectedIndex + 1}`}`
            }
            className="w-full rounded-full bg-pink-600 px-6 py-3 text-sm font-semibold text-white shadow hover:bg-pink-700 disabled:cursor-not-allowed disabled:bg-gray-300"
          >
            {isSaving ? "Bezig met opslaan..." : isRefining ? "Bezig met verfijnen..." : "Gebruik geselecteerde lyrics"}
          </button>
        </div>
      </div>
    </div>
  );
});

export { LyricsCompareComponent as LyricsCompare };
export default LyricsCompareComponent;

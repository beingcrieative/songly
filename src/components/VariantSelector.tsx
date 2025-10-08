"use client";

import { useState, useRef } from "react";

/**
 * VariantSelector Component
 * Task 4.0: Build Variant Selection System
 *
 * Displays a modal for users to preview and select between two Suno music variants
 */

// Task 4.2: Props interface
interface Variant {
  id: string;
  trackId: string;
  title: string;
  streamAudioUrl: string;
  audioUrl: string;
  imageUrl: string;
  durationSeconds: number;
}

interface VariantSelectorProps {
  variants: Variant[];
  onSelect: (variantId: string) => void;
  onClose: () => void;
}

export function VariantSelector({ variants, onSelect, onClose }: VariantSelectorProps) {
  // Task 4.7, 4.10: Audio playback state
  const [playingVariantId, setPlayingVariantId] = useState<string | null>(null);
  const audioRefs = useRef<{ [key: string]: HTMLAudioElement | null }>({});

  // Task 4.10: Play/pause control (pause other variant when playing one)
  const handlePlayPause = (variantId: string) => {
    // If this variant is playing, pause it
    if (playingVariantId === variantId) {
      audioRefs.current[variantId]?.pause();
      setPlayingVariantId(null);
    } else {
      // Pause any currently playing variant
      if (playingVariantId) {
        audioRefs.current[playingVariantId]?.pause();
      }
      // Play this variant
      audioRefs.current[variantId]?.play();
      setPlayingVariantId(variantId);
    }
  };

  // Task 4.11: Handle variant selection
  const handleSelectVariant = (variantId: string) => {
    // Pause any playing audio
    if (playingVariantId) {
      audioRefs.current[playingVariantId]?.pause();
    }
    // Call onSelect callback and close modal
    onSelect(variantId);
    onClose();
  };

  return (
    // Task 4.3: Modal overlay with semi-transparent background
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      {/* Task 4.4: Modal content with heading */}
      <div
        className="w-full max-w-4xl rounded-2xl bg-white p-8 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-8 text-center text-3xl font-bold text-gray-800">
          Kies je favoriete versie
        </h2>

        {/* Task 4.5: Side-by-side variant cards (responsive grid) */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {variants.map((variant, index) => (
            <div
              key={variant.id}
              className="rounded-xl border-2 border-gray-200 bg-gray-50 p-6 transition-all hover:border-purple-300 hover:shadow-lg"
            >
              {/* Task 4.6: Display title, duration, and album art */}
              <div className="mb-4 text-center">
                <h3 className="text-xl font-bold text-gray-800">
                  Versie {index + 1}
                </h3>
                <p className="text-sm text-gray-500">
                  {Math.floor(variant.durationSeconds / 60)}:
                  {String(variant.durationSeconds % 60).padStart(2, "0")}
                </p>
              </div>

              {/* Album art thumbnail */}
              <div className="mb-4 flex justify-center">
                <img
                  src={variant.imageUrl}
                  alt={`Versie ${index + 1}`}
                  className="h-48 w-48 rounded-lg object-cover shadow-md"
                />
              </div>

              {/* Task 4.7: Mini audio player with play/pause button */}
              <audio
                ref={(el) => {
                  audioRefs.current[variant.id] = el;
                }}
                src={variant.streamAudioUrl}
                onEnded={() => setPlayingVariantId(null)}
              />

              <div className="mb-4 flex justify-center">
                <button
                  onClick={() => handlePlayPause(variant.id)}
                  className="flex h-16 w-16 items-center justify-center rounded-full bg-purple-600 text-white shadow-lg transition-all hover:bg-purple-700 hover:scale-110"
                >
                  {playingVariantId === variant.id ? (
                    <svg
                      className="h-8 w-8"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <rect x="6" y="4" width="4" height="16" />
                      <rect x="14" y="4" width="4" height="16" />
                    </svg>
                  ) : (
                    <svg
                      className="h-8 w-8"
                      fill="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  )}
                </button>
              </div>

              {/* Task 4.8: Waveform visualization with animated bars */}
              <div className="mb-4 flex items-center justify-center gap-1 h-16">
                {[...Array(6)].map((_, barIndex) => (
                  <div
                    key={barIndex}
                    className={`w-2 rounded-full bg-purple-400 transition-all ${
                      playingVariantId === variant.id ? "animate-waveform" : "h-4"
                    }`}
                    style={{
                      animationDelay: `${barIndex * 0.1}s`,
                      height: playingVariantId === variant.id ? undefined : "16px",
                    }}
                  />
                ))}
              </div>

              {/* Task 4.9, 4.11: "Selecteer deze versie" button */}
              <button
                onClick={() => handleSelectVariant(variant.id)}
                className="w-full rounded-lg bg-purple-600 py-3 font-semibold text-white transition-all hover:bg-purple-700 hover:shadow-lg"
              >
                Selecteer deze versie
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Task 4.8: Waveform animation styles */}
      <style jsx>{`
        @keyframes waveform {
          0%,
          100% {
            height: 16px;
          }
          50% {
            height: 48px;
          }
        }

        .animate-waveform {
          animation: waveform 0.8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
}

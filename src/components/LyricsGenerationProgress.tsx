"use client";

import React from 'react';

interface LyricsGenerationProgressProps {
  isGenerating: boolean;
  isRefining?: boolean;
  pollingAttempts?: number;
  onCancel?: () => void;
}

export function LyricsGenerationProgress({
  isGenerating,
  isRefining = false,
  pollingAttempts = 0,
  onCancel,
}: LyricsGenerationProgressProps) {
  if (!isGenerating) return null;

  const maxAttempts = 24; // 24 * 5s = 120s
  const showCancelButton = pollingAttempts > 12; // After 60s
  const estimatedTime = isRefining ? "30-40" : "30-45";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4">
        {/* Gradient background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-pink-50 via-purple-50 to-pink-50 opacity-60 rounded-2xl" />

        {/* Floating pen/pencil icons */}
        <div className="absolute inset-0 pointer-events-none rounded-2xl overflow-hidden">
          <div className="floating-icon icon-1">✍️</div>
          <div className="floating-icon icon-2">📝</div>
          <div className="floating-icon icon-3">✨</div>
          <div className="floating-icon icon-4">🎼</div>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center gap-6 w-full">
          {/* Icon */}
          <div className="text-6xl animate-pulse">
            {isRefining ? "🔄" : "✨"}
          </div>

          {/* Title */}
          <h2 className="text-2xl font-bold text-gray-800 text-center">
            {isRefining ? "Lyrics worden verfijnd" : "Lyrics worden gegenereerd"}
          </h2>

          {/* Description */}
          <p className="text-gray-600 text-center">
            {isRefining
              ? "Suno verwerkt je feedback..."
              : "Suno AI schrijft 2 unieke versies van je liedje..."}
          </p>

          {/* Estimated time */}
          <p className="text-sm text-gray-500 text-center">
            Dit duurt ongeveer {estimatedTime} seconden
          </p>

          {/* Progress bar */}
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-pink-500 to-purple-500 animate-progress"
            />
          </div>

          {/* Polling attempts indicator */}
          {pollingAttempts > 0 && (
            <p className="text-xs text-gray-400">
              Poging {pollingAttempts} van {maxAttempts}
            </p>
          )}

          {/* Cancel button (after timeout) */}
          {showCancelButton && onCancel && (
            <button
              onClick={onCancel}
              className="mt-4 px-6 py-2 text-sm font-semibold text-pink-600 hover:text-pink-700 hover:bg-pink-50 rounded-lg transition-colors"
            >
              Annuleren
            </button>
          )}
        </div>

        {/* CSS animations */}
        <style jsx>{`
          .floating-icon {
            position: absolute;
            font-size: 1.5rem;
            opacity: 0.3;
            animation: float-up 10s infinite ease-in-out;
          }

          .icon-1 {
            left: 10%;
            animation-delay: 0s;
          }
          .icon-2 {
            left: 40%;
            animation-delay: 2.5s;
          }
          .icon-3 {
            left: 65%;
            animation-delay: 5s;
          }
          .icon-4 {
            left: 85%;
            animation-delay: 7.5s;
          }

          @keyframes float-up {
            0% {
              bottom: -10%;
              opacity: 0;
              transform: translateX(0) rotate(0deg);
            }
            20% {
              opacity: 0.3;
            }
            80% {
              opacity: 0.3;
            }
            100% {
              bottom: 110%;
              opacity: 0;
              transform: translateX(10px) rotate(10deg);
            }
          }

          @keyframes progress {
            0% {
              width: 0%;
            }
            100% {
              width: 100%;
            }
          }

          .animate-progress {
            animation: progress 45s linear infinite;
          }
        `}</style>
      </div>
    </div>
  );
}

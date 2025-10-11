"use client";

import { useState, useRef, useEffect } from "react";
import { MusicTemplate } from "@/templates/music-templates";

/**
 * TemplateCard Component
 *
 * Displays a single music template with preview audio and selection state.
 * Part of Task 2.0: Build Template Selector UI Component
 */

interface TemplateCardProps {
  template: MusicTemplate;
  isSelected: boolean;
  onSelect: (templateId: string) => void;
}

export function TemplateCard({ template, isSelected, onSelect }: TemplateCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Task 2.3: Mini audio player with play/pause
  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card selection when clicking play button

    if (!template.previewAudioUrl) {
      console.warn(`No preview audio for template: ${template.id}`);
      return;
    }

    if (!audioRef.current) {
      // Create audio element if it doesn't exist
      audioRef.current = new Audio(template.previewAudioUrl);

      audioRef.current.addEventListener('playing', () => {
        setIsPlaying(true);
        setIsLoading(false);
      });

      audioRef.current.addEventListener('pause', () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener('ended', () => {
        setIsPlaying(false);
      });

      audioRef.current.addEventListener('loadstart', () => {
        setIsLoading(true);
      });

      audioRef.current.addEventListener('canplay', () => {
        setIsLoading(false);
      });
    }

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      setIsLoading(true);
      audioRef.current.play().catch((error) => {
        console.error('Audio playback failed:', error);
        setIsLoading(false);
      });
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
    };
  }, []);

  // Task 2.2: Template name, description, and image display
  return (
    <div
      onClick={() => onSelect(template.id)}
      className={`
        relative cursor-pointer rounded-xl p-4 transition-all duration-200
        ${isSelected
          ? 'border-2 border-pink-500 bg-pink-50 shadow-lg'
          : 'border-2 border-gray-200 bg-white hover:border-pink-300 hover:shadow-md'
        }
      `}
    >
      {/* Task 2.4: Visual selection state */}
      {isSelected && (
        <div className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-pink-500 flex items-center justify-center">
          <svg className="h-4 w-4 text-white" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </div>
      )}

      {/* Template Icon/Image */}
      <div className="mb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {template.icon && (
            <div className="text-3xl">{template.icon}</div>
          )}
          {template.imageUrl && !template.icon && (
            <img
              src={template.imageUrl}
              alt={template.name}
              className="h-12 w-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h3 className="font-semibold text-gray-800">{template.name}</h3>
          </div>
        </div>

        {/* Play/Pause Button */}
        {template.previewAudioUrl && (
          <button
            onClick={handlePlayPause}
            disabled={isLoading}
            className={`
              flex h-10 w-10 items-center justify-center rounded-full transition-colors
              ${isSelected
                ? 'bg-pink-500 text-white hover:bg-pink-600'
                : 'bg-gray-100 text-gray-600 hover:bg-pink-100 hover:text-pink-600'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
            aria-label={isPlaying ? 'Pause preview' : 'Play preview'}
          >
            {isLoading ? (
              <svg className="h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
            ) : isPlaying ? (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
              </svg>
            )}
          </button>
        )}
      </div>

      {/* Template Description */}
      <p className="text-sm text-gray-600 leading-relaxed">{template.description}</p>

      {/* Suno Config Info (optional, shows when selected) */}
      {isSelected && (
        <div className="mt-3 pt-3 border-t border-pink-200">
          <div className="flex flex-wrap gap-2 text-xs text-pink-700">
            <span className="bg-pink-100 px-2 py-1 rounded">
              Model: {template.sunoConfig.model}
            </span>
            {template.sunoConfig.styleWeight !== undefined && (
              <span className="bg-pink-100 px-2 py-1 rounded">
                Style: {Math.round(template.sunoConfig.styleWeight * 100)}%
              </span>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

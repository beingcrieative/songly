"use client";

import { useState, useRef, useEffect } from "react";

/**
 * MusicPlayer Component
 * Task 5.0: Integrate Music Player with Album Art and Controls
 *
 * Displays a full-featured music player with album art, playback controls, and progress tracking
 */

// Task 5.2: Props interface
interface MusicPlayerProps {
  title: string;
  albumArt: string;
  audioUrl: string;
  streamUrl: string;
  onDownload?: () => void;
}

export function MusicPlayer({
  title,
  albumArt,
  audioUrl,
  streamUrl,
  onDownload,
}: MusicPlayerProps) {
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);

  // Task 5.4: Play/pause handler
  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  // Task 5.6, 5.8: Seek functionality (click/drag on progress bar)
  const handleSeek = (e: React.MouseEvent<HTMLDivElement>) => {
    if (audioRef.current) {
      const progressBar = e.currentTarget;
      const rect = progressBar.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const percentage = clickX / rect.width;
      const newTime = percentage * duration;
      audioRef.current.currentTime = newTime;
      setCurrentTime(newTime);
    }
  };

  // Task 5.7: Format time to MM:SS
  const formatTime = (seconds: number): string => {
    if (isNaN(seconds)) return "0:00";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <div className="w-full">
      {/* Task 5.3: Player layout with album art at top */}
      <div className="flex flex-col items-center">
        {/* Title */}
        <h3 className="mb-4 text-center text-2xl font-bold text-gray-800">
          {title}
        </h3>

        {/* Album art container */}
        <div className="relative mb-6">
          <img
            src={albumArt}
            alt={title}
            className="h-80 w-80 rounded-2xl object-cover shadow-xl"
          />

          {/* Task 5.4: Play/pause button overlaid on album art */}
          <button
            onClick={handlePlayPause}
            className="absolute left-1/2 top-1/2 flex h-20 w-20 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-white/50 backdrop-blur-sm transition-all hover:bg-white/70 hover:scale-110"
          >
            {isPlaying ? (
              <svg
                className="h-10 w-10 text-purple-700"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <rect x="6" y="4" width="4" height="16" />
                <rect x="14" y="4" width="4" height="16" />
              </svg>
            ) : (
              <svg
                className="ml-1 h-10 w-10 text-purple-700"
                fill="currentColor"
                viewBox="0 0 24 24"
              >
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
        </div>

        {/* Task 5.6: Progress bar (full width, 8px height, purple fill, draggable seek) */}
        <div className="w-full max-w-md">
          <div
            onClick={handleSeek}
            className="relative h-2 w-full cursor-pointer rounded-full bg-gray-200"
          >
            <div
              className="absolute h-full rounded-full bg-purple-600 transition-all"
              style={{ width: `${duration ? (currentTime / duration) * 100 : 0}%` }}
            />
          </div>

          {/* Task 5.7: Display current time and total duration in MM:SS format */}
          <div className="mt-2 flex justify-between text-sm text-gray-600">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>

      {/* Task 5.5, 5.11: HTML5 audio element with event listeners */}
      <audio
        ref={audioRef}
        src={streamUrl}
        preload="metadata"
        onLoadedMetadata={() => {
          if (audioRef.current) {
            setDuration(audioRef.current.duration);
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          setCurrentTime(0);
          if (audioRef.current) {
            audioRef.current.currentTime = 0;
          }
        }}
        onError={(e) => {
          console.error("Audio playback error:", e);
          setIsPlaying(false);
        }}
      />
    </div>
  );
}

"use client";

import { type SongStatus } from '@/types/generation';

/**
 * SongStatusBadge Component (PRD-0014 Task 4.1)
 *
 * Displays a status badge for songs with different states during async generation.
 */

interface SongStatusBadgeProps {
  status: SongStatus | string | null | undefined;
  className?: string;
}

export default function SongStatusBadge({ status, className = '' }: SongStatusBadgeProps) {
  // Task 4.1.2: Render badge for each status
  if (!status || status === 'complete' || status === 'pending') {
    // No badge for complete or pending states
    return null;
  }

  const config = getStatusConfig(status);

  return (
    <div
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-medium ${config.bgColor} ${config.textColor} ${className}`}
      role="status"
      aria-label={config.ariaLabel}
    >
      {config.icon}
      <span>{config.label}</span>
    </div>
  );
}

function getStatusConfig(status: string) {
  switch (status) {
    case 'generating_lyrics':
      return {
        label: 'Tekst genereren...',
        bgColor: 'bg-blue-100 dark:bg-blue-900/30',
        textColor: 'text-blue-700 dark:text-blue-300',
        icon: <SpinnerIcon />,
        ariaLabel: 'Generating lyrics',
      };

    case 'lyrics_ready':
      return {
        label: 'Klaar om te kiezen',
        bgColor: 'bg-pink-100 dark:bg-pink-900/30 animate-pulse-subtle',
        textColor: 'text-pink-700 dark:text-pink-300',
        icon: <CheckIcon />,
        ariaLabel: 'Lyrics ready to review',
      };

    case 'generating_music':
    case 'generating':
      return {
        label: 'Muziek genereren...',
        bgColor: 'bg-purple-100 dark:bg-purple-900/30',
        textColor: 'text-purple-700 dark:text-purple-300',
        icon: <SpinnerIcon />,
        ariaLabel: 'Generating music',
      };

    case 'ready':
      return {
        label: 'Klaar om te spelen',
        bgColor: 'bg-green-100 dark:bg-green-900/30 animate-pulse-subtle',
        textColor: 'text-green-700 dark:text-green-300',
        icon: <MusicIcon />,
        ariaLabel: 'Ready to play',
      };

    case 'failed':
      return {
        label: 'Mislukt',
        bgColor: 'bg-red-100 dark:bg-red-900/30',
        textColor: 'text-red-700 dark:text-red-300',
        icon: <ErrorIcon />,
        ariaLabel: 'Generation failed',
      };

    default:
      return {
        label: status,
        bgColor: 'bg-gray-100 dark:bg-gray-900/30',
        textColor: 'text-gray-700 dark:text-gray-300',
        icon: null,
        ariaLabel: `Status: ${status}`,
      };
  }
}

// Task 4.1.3: Animated icons
function SpinnerIcon() {
  return (
    <svg
      className="h-3.5 w-3.5 animate-spin"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M16.704 4.153a.75.75 0 01.143 1.052l-8 10.5a.75.75 0 01-1.127.075l-4.5-4.5a.75.75 0 011.06-1.06l3.894 3.893 7.48-9.817a.75.75 0 011.05-.143z"
        clipRule="evenodd"
      />
    </svg>
  );
}

function MusicIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path d="M18.721 3.445a.75.75 0 00-.889-.264l-9.5 4a.75.75 0 00-.471.695v8.498a2.5 2.5 0 10.75 1.77V9.22l8.5-3.579v5.733a2.5 2.5 0 101.389-2.236V3.445z" />
    </svg>
  );
}

function ErrorIcon() {
  return (
    <svg
      className="h-3.5 w-3.5"
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden="true"
    >
      <path
        fillRule="evenodd"
        d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z"
        clipRule="evenodd"
      />
    </svg>
  );
}

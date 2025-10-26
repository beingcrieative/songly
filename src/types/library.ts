/**
 * TypeScript types for Library components and views
 */

import { SongStatus, LyricVariant } from './generation';

/**
 * Song entity with async generation fields
 * Extended from InstantDB songs entity
 */
export interface SongWithAsyncStatus {
  id: string;
  title?: string | null;
  status?: SongStatus | null;
  imageUrl?: string | null;
  audioUrl?: string | null;
  streamAudioUrl?: string | null;
  videoUrl?: string | null;
  lyrics?: string | null;
  lyricsSnippet?: string | null;
  musicStyle?: string | null;
  createdAt?: number | null;
  updatedAt?: number | null;
  lastViewedAt?: number | null;
  lastPlayedAt?: number | null;

  // Async generation fields
  generationProgress?: string | null; // JSON string
  lyricsVariants?: string | null; // JSON string
  notificationsSent?: string | null; // JSON string

  // Error tracking
  errorMessage?: string | null;

  // Relations
  user?: { id: string; email?: string } | null;
  conversation?: { id: string } | null;
  variants?: Array<{
    id: string;
    trackId?: string;
    audioUrl?: string;
    streamAudioUrl?: string;
    order?: number;
  }>;
}

/**
 * Props for LyricsChoiceModal component
 */
export interface LyricsChoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  variants: LyricVariant[];
  songId: string;
  songTitle: string;
  onSelectVariant: (variantIndex: number) => Promise<void>;
  isSubmitting?: boolean;
}

/**
 * Props for enhanced SongCard component
 */
export interface SongCardProps {
  song: SongWithAsyncStatus;
  onPlay?: (variantId?: string) => void;
  onOpen?: () => void;
  onShare?: () => void;
  onDelete?: () => void;
  onSelectVariant?: (variantId: string) => void;
  onChooseLyrics?: () => void;
  onRetry?: () => void;
  actionState?: {
    isPlaying?: boolean;
    isSharing?: boolean;
    isDeleting?: boolean;
    isRetrying?: boolean;
  };
}

/**
 * Action state for tracking loading states
 */
export interface ActionState {
  isPlaying: boolean;
  isSharing: boolean;
  isDeleting: boolean;
  isRetrying: boolean;
}

/**
 * CTA button configuration based on song status
 */
export interface StatusCTA {
  label: string;
  action: 'play' | 'choose_lyrics' | 'retry' | 'view_details' | 'none';
  color: 'rose' | 'emerald' | 'rose-outline' | 'ghost';
  disabled?: boolean;
}

/**
 * Empty state configuration
 */
export interface EmptyStateConfig {
  icon: string;
  message: string;
  cta?: string;
  ctaAction?: () => void;
}

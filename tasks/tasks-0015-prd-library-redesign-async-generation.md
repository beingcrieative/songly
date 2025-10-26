# Task List: PRD-0015 Library Redesign for Async Generation Flow

**Source PRD**: `tasks/0015-prd-library-redesign-async-generation.md`
**Status**: In Progress
**Created**: 2025-10-26

## Overview

This task list implements the complete Library redesign to support async generation flow with:
- Realtime status tracking and badges
- Swipeable lyrics comparison modal (mobile + desktop)
- Smart sorting (action items first)
- Badge counter on Library tab
- Studio redirect flow (no blocking modals)
- Three new API endpoints

## Relevant Files

### Core Components
- `src/app/library/page.tsx` - Main Library page (remove tabs, add smart sorting)
- `src/app/library/components/SongCard.tsx` - Song card (enhance with status badges)
- `src/app/library/components/Filters.tsx` - Filters (update status options)
- `src/components/LyricsCompare.tsx` - Existing comparison (reference for new modal)
- `src/components/SongStatusBadge.tsx` - Status badge component (✓ DONE in PRD-0014)
- `src/components/mobile/NavTabs.tsx` - Bottom nav (add badge counter)

### Data Layer
- `src/lib/library/queries.ts` - InstantDB queries (add new fields)
- `src/types/generation.ts` - Type definitions (✓ DONE in PRD-0014)

### Studio Integration
- `src/app/studio/StudioClient.tsx` - Studio client (remove blocking modals)
- `src/components/LyricsGenerationProgress.tsx` - Progress modal (remove usage)

### API Routes
- `src/app/api/library/songs/[songId]/select-lyrics/route.ts` - NEW
- `src/app/api/library/songs/[songId]/retry/route.ts` - NEW
- `src/app/api/library/songs/[songId]/view/route.ts` - NEW

### Analytics
- `src/lib/analytics/events.ts` - Analytics tracking (add new events)

---

## Tasks

### ✅ Task 0.0: Pre-requisites (COMPLETED in PRD-0014)

**Status**: ✅ Complete

- [x] 0.1 - Database schema updated with new fields (generationProgress, lyricsVariants, notificationsSent, lastViewedAt)
- [x] 0.2 - Type definitions created in `src/types/generation.ts`
- [x] 0.3 - SongStatusBadge component created with all 6 states
- [x] 0.4 - Callback handlers updated for async flow

---

### ✅ Task 1.0: Update Database Queries and Type Definitions

**Description**: Update InstantDB queries to include new async generation fields and implement smart sorting algorithm.

**Dependencies**: None (pre-requisites completed)

**Estimated Time**: 2 hours

#### Sub-tasks:

- [x] **1.1 - Update useLibrarySongs query**
  - **File**: `src/lib/library/queries.ts`
  - **Description**: Add new fields to songs query: `generationProgress`, `lyricsVariants`, `notificationsSent`, `lastViewedAt`
  - **Implementation**:
    ```typescript
    songs: {
      $: { where, order, limit, offset },
      // Add these fields:
      generationProgress: {},
      lyricsVariants: {},
      notificationsSent: {},
      lastViewedAt: {},
      // Existing:
      variants: { ... },
      user: {},
      conversation: {},
    }
    ```
  - **Acceptance Criteria**:
    - Query includes all 4 new fields
    - Query still works with existing filters
    - No breaking changes to existing code

- [x] **1.2 - Update status filter options**
  - **File**: `src/lib/library/queries.ts`
  - **Description**: Update `SongStatus` type to include new states: `generating_lyrics`, `lyrics_ready`, `generating_music`
  - **Implementation**:
    ```typescript
    type SongStatus =
      | "all"
      | "pending"
      | "generating_lyrics"
      | "lyrics_ready"
      | "generating_music"
      | "ready"
      | "complete"
      | "failed";
    ```
  - **Acceptance Criteria**:
    - TypeScript types updated
    - Filter handles all new status values
    - Backward compatible with existing "generating" filter

- [x] **1.3 - Create smart sorting utilities**
  - **File**: `src/lib/library/sorting.ts` (NEW)
  - **Description**: Implement priority-based sorting algorithm from PRD
  - **Implementation**:
    ```typescript
    export function sortSongsByPriority(songs: Song[]): Song[] {
      return songs.sort((a, b) => {
        // 1. Action priority
        const aPriority = getActionPriority(a.status);
        const bPriority = getActionPriority(b.status);
        if (aPriority !== bPriority) return aPriority - bPriority;

        // 2. Recent activity
        const aTime = a.lastViewedAt || a.updatedAt || 0;
        const bTime = b.lastViewedAt || b.updatedAt || 0;
        return bTime - aTime; // DESC
      });
    }

    function getActionPriority(status: string): number {
      switch (status) {
        case 'lyrics_ready': return 1; // Highest
        case 'ready': return 2;
        case 'generating_lyrics': return 3;
        case 'generating_music': return 4;
        case 'failed': return 5;
        case 'complete': return 6; // Lowest
        default: return 99;
      }
    }

    export function getActionItemsCount(songs: Song[]): number {
      return songs.filter(s =>
        s.status === 'lyrics_ready' || s.status === 'ready'
      ).length;
    }
    ```
  - **Acceptance Criteria**:
    - Sorting puts action items first (lyrics_ready, ready)
    - Ties broken by lastViewedAt or updatedAt
    - Counter correctly counts action items
    - Unit tests passing

- [x] **1.4 - Add TypeScript interfaces for new components**
  - **File**: `src/types/library.ts` (NEW)
  - **Description**: Create type definitions for LyricsChoiceModal and enhanced SongCard
  - **Implementation**:
    ```typescript
    import { SongStatus, LyricVariant } from './generation';

    export interface SongWithAsyncStatus {
      id: string;
      title?: string | null;
      status?: SongStatus | null;
      imageUrl?: string | null;
      updatedAt?: number | null;
      lastViewedAt?: number | null;
      generationProgress?: string | null; // JSON
      lyricsVariants?: string | null; // JSON
      notificationsSent?: string | null; // JSON
      // ... existing fields
    }

    export interface LyricsChoiceModalProps {
      isOpen: boolean;
      onClose: () => void;
      variants: LyricVariant[];
      songId: string;
      songTitle: string;
      onSelectVariant: (variantIndex: number) => Promise<void>;
      isSubmitting?: boolean;
    }
    ```
  - **Acceptance Criteria**:
    - All new component props typed
    - Extends existing types correctly
    - No TypeScript errors

---

### ✅ Task 2.0: Enhance SongCard Component with New Status States

**Description**: Update SongCard to display all 6 status states with appropriate badges, CTAs, and metadata.

**Dependencies**: Task 1.0 (types and queries)

**Estimated Time**: 3 hours

#### Sub-tasks:

- [x] **2.1 - Import and integrate SongStatusBadge**
  - **File**: `src/app/library/components/SongCard.tsx`
  - **Description**: Replace basic status labels with SongStatusBadge component
  - **Implementation**:
    ```typescript
    import SongStatusBadge from '@/components/SongStatusBadge';

    // In render:
    <div className="absolute left-3 top-3">
      <SongStatusBadge status={song.status} />
    </div>
    ```
  - **Acceptance Criteria**:
    - Badge shows correct color/icon for each status
    - Animations work (spinner for generating, pulse for ready states)
    - Replaces old STATUS_LABELS constant

- [x] **2.2 - Add status-specific CTAs**
  - **File**: `src/app/library/components/SongCard.tsx`
  - **Description**: Show different primary action based on status
  - **Implementation**:
    ```typescript
    function getPrimaryCTA(status: string | null) {
      switch (status) {
        case 'lyrics_ready':
          return { label: 'Kies Lyrics →', action: 'choose_lyrics', color: 'rose' };
        case 'ready':
          return { label: '▶️ Speel af', action: 'play', color: 'emerald' };
        case 'failed':
          return { label: '🔄 Probeer opnieuw', action: 'retry', color: 'rose-outline' };
        case 'generating_lyrics':
        case 'generating_music':
          return { label: 'Details bekijken', action: 'view_details', color: 'ghost' };
        default:
          return { label: 'Afspelen', action: 'play', color: 'rose' };
      }
    }
    ```
  - **Acceptance Criteria**:
    - Each status shows correct CTA
    - CTAs are disabled during loading states
    - Colors match PRD design (rose primary, emerald success)

- [x] **2.3 - Add onChooseLyrics and onRetry handlers**
  - **File**: `src/app/library/components/SongCard.tsx`
  - **Description**: Add new prop handlers for lyrics selection and retry actions
  - **Implementation**:
    ```typescript
    interface SongCardProps {
      // ... existing props
      onChooseLyrics?: () => void; // NEW
      onRetry?: () => void; // NEW
    }

    // In button click:
    {cta.action === 'choose_lyrics' && (
      <button onClick={onChooseLyrics}>
        {cta.label}
      </button>
    )}
    ```
  - **Acceptance Criteria**:
    - Handlers optional (backward compatible)
    - Called when respective buttons clicked
    - Loading states prevent multiple clicks

- [x] **2.4 - Display generation metadata**
  - **File**: `src/app/library/components/SongCard.tsx`
  - **Description**: Show relevant timestamps based on status
  - **Implementation**:
    ```typescript
    import { parseGenerationProgress } from '@/types/generation';

    function getMetadataText(song: SongWithAsyncStatus): string {
      const progress = parseGenerationProgress(song.generationProgress);

      switch (song.status) {
        case 'lyrics_ready':
          if (progress?.lyricsCompletedAt) {
            const elapsed = formatTimeAgo(progress.lyricsCompletedAt);
            return `Teksten klaar ${elapsed}`;
          }
          break;
        case 'ready':
          if (progress?.musicCompletedAt) {
            const elapsed = formatTimeAgo(progress.musicCompletedAt);
            return `Klaar ${elapsed}`;
          }
          break;
        // ... other cases
      }

      return formatTimeAgo(song.updatedAt);
    }
    ```
  - **Acceptance Criteria**:
    - Shows relevant timestamp for each status
    - Uses Dutch relative time ("2 minuten geleden")
    - Falls back to updatedAt if progress data missing

- [x] **2.5 - Add error display for failed state**
  - **File**: `src/app/library/components/SongCard.tsx`
  - **Description**: Show error message from generationProgress when status is "failed"
  - **Implementation**:
    ```typescript
    {song.status === 'failed' && progress?.lyricsError && (
      <p className="text-xs text-red-600 mt-1">
        {progress.lyricsError}
      </p>
    )}
    ```
  - **Acceptance Criteria**:
    - Error message displayed for failed songs
    - Truncated if too long (max 100 chars)
    - Distinguishes between lyrics and music errors

---

### ✅ Task 3.0: Create LyricsChoiceModal Component

**Description**: Build new swipeable modal for lyrics variant selection with desktop side-by-side and mobile swipeable layouts.

**Dependencies**: Task 1.0 (types)

**Estimated Time**: 4 hours

#### Sub-tasks:

- [x] **3.1 - Create base modal component**
  - **File**: `src/components/LyricsChoiceModal.tsx` (NEW)
  - **Description**: Create modal shell with responsive layout
  - **Implementation**:
    ```typescript
    import { Dialog, DialogContent, DialogHeader } from '@/components/ui/dialog';
    import { useState, useEffect } from 'react';
    import { LyricVariant } from '@/types/generation';

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

      return (
        <Dialog open={isOpen} onOpenChange={onClose}>
          <DialogContent className="max-w-4xl">
            <DialogHeader>
              <h2 className="text-xl font-bold">
                Kies je favoriete lyrics
              </h2>
              <p className="text-sm text-slate-600">
                Voor: {songTitle}
              </p>
            </DialogHeader>

            {/* Desktop: Side by side */}
            <div className="hidden md:block">
              {/* Task 3.2 */}
            </div>

            {/* Mobile: Swipeable */}
            <div className="md:hidden">
              {/* Task 3.3 */}
            </div>
          </DialogContent>
        </Dialog>
      );
    }
    ```
  - **Acceptance Criteria**:
    - Modal opens/closes correctly
    - Responsive layout (desktop vs mobile)
    - Props properly typed

- [x] **3.2 - Implement desktop side-by-side layout**
  - **File**: `src/components/LyricsChoiceModal.tsx`
  - **Description**: Show both variants side by side on desktop
  - **Implementation**:
    ```typescript
    <div className="hidden md:grid md:grid-cols-2 gap-4">
      {variants.map((variant, index) => (
        <div
          key={index}
          className={cn(
            "border rounded-xl p-4 cursor-pointer transition",
            selectedIndex === index
              ? "border-pink-500 bg-pink-50"
              : "border-slate-200 hover:border-slate-300"
          )}
          onClick={() => setSelectedIndex(index)}
        >
          <h3 className="font-semibold mb-2">
            Variant {index + 1}
          </h3>
          <div className="whitespace-pre-wrap text-sm text-slate-700 max-h-96 overflow-y-auto">
            {variant.text}
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleSelect(index);
            }}
            className="mt-4 w-full bg-rose-500 text-white py-2 rounded-lg"
            disabled={isSubmitting}
          >
            ✓ Kies deze variant
          </button>
        </div>
      ))}
    </div>
    ```
  - **Acceptance Criteria**:
    - Both variants visible side by side
    - Click to select (visual feedback)
    - Button to confirm selection
    - Scrollable lyrics content

- [x] **3.3 - Implement mobile swipeable layout**
  - **File**: `src/components/LyricsChoiceModal.tsx`
  - **Description**: Swipeable cards on mobile with clear indicators
  - **Implementation**:
    ```typescript
    import { useSwipeable } from 'react-swipeable';

    const swipeHandlers = useSwipeable({
      onSwipedLeft: () => nextVariant(),
      onSwipedRight: () => prevVariant(),
      preventScrollOnSwipe: true,
      trackMouse: false,
      delta: 50,
    });

    <div className="md:hidden" {...swipeHandlers}>
      {/* Indicator */}
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex gap-1.5">
          {variants.map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-2 w-2 rounded-full transition-all",
                i === selectedIndex
                  ? "bg-rose-500 scale-125"
                  : "bg-slate-300"
              )}
            />
          ))}
        </div>
        <span className="text-sm text-slate-600">
          Variant {selectedIndex + 1} van {variants.length}
        </span>
      </div>

      {/* Content */}
      <div className="border rounded-xl p-4">
        <div className="whitespace-pre-wrap text-sm max-h-80 overflow-y-auto">
          {variants[selectedIndex]?.text}
        </div>
      </div>

      {/* Hint */}
      <p className="text-center text-xs text-slate-500 mt-2">
        {selectedIndex === 0
          ? "← Swipe voor variant 2"
          : "Swipe voor variant 1 →"}
      </p>

      {/* CTA */}
      <button
        onClick={() => handleSelect(selectedIndex)}
        className="mt-4 w-full bg-rose-500 text-white py-3 rounded-lg"
        disabled={isSubmitting}
      >
        ✓ Kies deze variant
      </button>
    </div>
    ```
  - **Acceptance Criteria**:
    - Swipe left/right changes variant
    - Dot indicators show current variant (◉ ○)
    - Text counter shows "Variant 1 van 2"
    - Swipe hint visible
    - Vertical scroll for lyrics, horizontal swipe for variants

- [x] **3.4 - Implement handleSelect logic**
  - **File**: `src/components/LyricsChoiceModal.tsx`
  - **Description**: Call API to select variant and start music generation
  - **Implementation**:
    ```typescript
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSelect = async (index: number) => {
      setIsSubmitting(true);
      try {
        await onSelectVariant(index);
        onClose();
      } catch (error) {
        console.error('Failed to select variant:', error);
        alert('Er ging iets mis bij het kiezen van de lyrics.');
      } finally {
        setIsSubmitting(false);
      }
    };
    ```
  - **Acceptance Criteria**:
    - Loading state while submitting
    - Closes modal on success
    - Shows error on failure
    - Button disabled during submission

- [x] **3.5 - Add keyboard navigation (desktop)**
  - **File**: `src/components/LyricsChoiceModal.tsx`
  - **Description**: Arrow keys to navigate, Enter to confirm
  - **Implementation**:
    ```typescript
    useEffect(() => {
      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'ArrowLeft' && selectedIndex > 0) {
          setSelectedIndex(i => i - 1);
        } else if (e.key === 'ArrowRight' && selectedIndex < variants.length - 1) {
          setSelectedIndex(i => i + 1);
        } else if (e.key === 'Enter' && !isSubmitting) {
          handleSelect(selectedIndex);
        }
      };

      if (isOpen) {
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
      }
    }, [isOpen, selectedIndex, isSubmitting]);
    ```
  - **Acceptance Criteria**:
    - Arrow keys navigate between variants
    - Enter confirms selection
    - Only active when modal open
    - Disabled during submission

---

### ✅ Task 4.0: Update Library Page with Smart Sorting and Realtime Subscriptions

**Description**: Remove tabs, implement smart sorting, add realtime updates, and integrate LyricsChoiceModal.

**Dependencies**: Tasks 1.0, 2.0, 3.0

**Estimated Time**: 4 hours

#### Sub-tasks:

- [x] **4.1 - Remove Songs/Conversations tabs**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Remove tab switcher and conversations view
  - **Changes**:
    - Remove `activeTab` state
    - Remove tab buttons UI (lines 259-282)
    - Remove `conversationsQuery` and conversations filtering
    - Remove `conversationCards` rendering
    - Keep only songs grid
  - **Acceptance Criteria**:
    - No tabs visible in UI
    - Only songs displayed
    - Conversations code removed (but ConversationCard.tsx kept for future)
    - No TypeScript errors

- [x] **4.2 - Update status filter options**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Add new status filter values
  - **Implementation**:
    ```typescript
    const SONG_STATUS_OPTIONS = [
      { value: "all", label: "Alle" },
      { value: "lyrics_ready", label: "Klaar om te kiezen" },
      { value: "ready", label: "Klaar om te spelen" },
      { value: "generating_lyrics", label: "Tekst genereren" },
      { value: "generating_music", label: "Muziek genereren" },
      { value: "failed", label: "Mislukt" },
      { value: "complete", label: "Voltooid" },
    ];
    ```
  - **Acceptance Criteria**:
    - All 6 status values available
    - Dutch labels
    - Filtering works correctly

- [x] **4.3 - Add smart sorting dropdown**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Add "Action Required" sort option
  - **Implementation**:
    ```typescript
    const SONG_SORT_OPTIONS = [
      { value: "action", label: "Actie vereist" }, // NEW
      { value: "recent", label: "Nieuwste eerst" },
      { value: "az", label: "A-Z" },
      { value: "played", label: "Laatst afgespeeld" },
    ];
    ```
  - **Acceptance Criteria**:
    - New sort option visible in dropdown
    - Selecting it triggers smart sorting
    - Default sort option is "action"

- [x] **4.4 - Implement client-side smart sorting**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Apply smart sorting to songs after query
  - **Implementation**:
    ```typescript
    import { sortSongsByPriority } from '@/lib/library/sorting';

    const songs = useMemo(() => {
      const rawSongs = songsQuery.data?.songs ?? [];

      if (songSort === 'action') {
        return sortSongsByPriority(rawSongs);
      }

      // Other sorts handled by InstantDB query
      return rawSongs;
    }, [songsQuery.data, songSort]);
    ```
  - **Acceptance Criteria**:
    - Action items appear first when "action" sort selected
    - Other sorts still work (recent, az, played)
    - No performance issues with 50+ songs

- [x] **4.5 - Add LyricsChoiceModal state and handler**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Open modal when user clicks "Kies Lyrics" on song card
  - **Implementation**:
    ```typescript
    import LyricsChoiceModal from '@/components/LyricsChoiceModal';
    import { parseLyricVariants } from '@/types/generation';

    const [lyricsModalOpen, setLyricsModalOpen] = useState(false);
    const [selectedSongForLyrics, setSelectedSongForLyrics] = useState<any>(null);

    const handleChooseLyrics = (song: any) => {
      setSelectedSongForLyrics(song);
      setLyricsModalOpen(true);
    };

    const handleSelectVariant = async (variantIndex: number) => {
      if (!selectedSongForLyrics) return;

      const res = await fetch(
        `/api/library/songs/${selectedSongForLyrics.id}/select-lyrics`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ variantIndex }),
        }
      );

      if (!res.ok) throw new Error('Failed to select lyrics');
    };

    // In render:
    <LyricsChoiceModal
      isOpen={lyricsModalOpen}
      onClose={() => setLyricsModalOpen(false)}
      variants={parseLyricVariants(selectedSongForLyrics?.lyricsVariants)}
      songId={selectedSongForLyrics?.id}
      songTitle={selectedSongForLyrics?.title || 'Ongetiteld'}
      onSelectVariant={handleSelectVariant}
    />
    ```
  - **Acceptance Criteria**:
    - Modal opens when "Kies Lyrics" clicked
    - Correct song and variants passed to modal
    - API called on selection
    - Modal closes on success

- [x] **4.6 - Add retry handler**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Handle retry for failed songs
  - **Implementation**:
    ```typescript
    const [retryLoadingId, setRetryLoadingId] = useState<string | null>(null);

    const handleRetry = async (songId: string, phase: 'lyrics' | 'music') => {
      setRetryLoadingId(songId);
      try {
        const res = await fetch(
          `/api/library/songs/${songId}/retry`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ phase }),
          }
        );

        if (!res.ok) {
          const body = await res.json();
          throw new Error(body.error || 'Retry mislukt');
        }

        // Success feedback
        alert('Opnieuw proberen gestart!');
      } catch (error: any) {
        alert(error.message || 'Retry mislukt');
      } finally {
        setRetryLoadingId(null);
      }
    };
    ```
  - **Acceptance Criteria**:
    - Retry button triggers API call
    - Loading state shown during retry
    - Success/error feedback displayed
    - Song status updates after retry

- [x] **4.7 - Update SongCard props in mapping**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Pass new handlers to SongCard
  - **Implementation**:
    ```typescript
    <SongCard
      key={song.id}
      song={song}
      onPlay={(variant) => handlePlay(song.id, variant)}
      onOpen={() => router.push(`/studio?songId=${song.id}`)}
      onShare={() => handleShareSong(song)}
      onDelete={() => handleDeleteSong(song.id)}
      onSelectVariant={(variantId) => handleSelectVariant(song.id, variantId)}
      onChooseLyrics={() => handleChooseLyrics(song)} // NEW
      onRetry={() => handleRetry(song.id, determinePhase(song.status))} // NEW
      actionState={{
        isSharing: shareLoadingId === song.id,
        isDeleting: deleteLoadingId === song.id,
        isRetrying: retryLoadingId === song.id, // NEW
      }}
    />
    ```
  - **Acceptance Criteria**:
    - All handlers passed correctly
    - No TypeScript errors
    - Handlers called when buttons clicked

- [x] **4.8 - Update empty state**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Improve empty state messaging
  - **Implementation**:
    ```typescript
    function getEmptyStateMessage(
      songs: any[],
      status: string
    ): { icon: string; message: string; cta?: string } {
      if (status !== 'all' && songs.length === 0) {
        return {
          icon: '🔍',
          message: `Geen liedjes met status "${status}"`,
        };
      }

      if (songs.length === 0) {
        return {
          icon: '🎵',
          message: 'Je hebt nog geen liedjes',
          cta: 'Maak je eerste liedje',
        };
      }

      // Check if all generating
      const allGenerating = songs.every(s =>
        s.status?.includes('generating')
      );

      if (allGenerating) {
        return {
          icon: '⏳',
          message: 'Je liedjes worden gegenereerd. Je ontvangt een notificatie zodra ze klaar zijn.',
        };
      }

      return { icon: '🎵', message: 'Geen liedjes gevonden' };
    }
    ```
  - **Acceptance Criteria**:
    - Different messages for different scenarios
    - CTA button when no songs exist
    - Helpful guidance for users

---

### ✅ Task 5.0: Add Badge Counter to NavTabs

**Description**: Show badge with count of action-required items on Library tab icon.

**Dependencies**: Task 1.3 (getActionItemsCount function)

**Estimated Time**: 1 hour

#### Sub-tasks:

- [x] **5.1 - Create badge counter hook**
  - **File**: `src/hooks/useActionItemsCount.ts` (NEW)
  - **Description**: Hook to count action items from songs query
  - **Implementation**:
    ```typescript
    import { db } from '@/lib/db';
    import { useMemo } from 'react';

    export function useActionItemsCount(userId: string | undefined) {
      const query = useMemo(() => {
        if (!userId) return {};

        return {
          songs: {
            $: {
              where: {
                'user.id': userId,
                status: { in: ['lyrics_ready', 'ready'] },
              },
            },
          },
        };
      }, [userId]);

      const { data } = db.useQuery(query);

      return data?.songs?.length ?? 0;
    }
    ```
  - **Acceptance Criteria**:
    - Returns count of songs with status lyrics_ready or ready
    - Updates in realtime via InstantDB subscription
    - Returns 0 if no user

- [x] **5.2 - Update NavTabs component**
  - **File**: `src/components/mobile/NavTabs.tsx`
  - **Description**: Add badge to Library tab
  - **Implementation**:
    ```typescript
    import { useActionItemsCount } from '@/hooks/useActionItemsCount';
    import { db } from '@/lib/db';

    export default function NavTabs() {
      const auth = db.useAuth();
      const actionCount = useActionItemsCount(auth.user?.id);
      const p = usePathname();

      return (
        <nav>
          {/* ... other tabs ... */}

          <Link href="/library" className="relative">
            {actionCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-rose-500 text-xs font-bold text-white">
                {actionCount > 9 ? '9+' : actionCount}
              </span>
            )}
            <img src="/icons/library.svg" alt="" />
            <span>{strings.nav.library}</span>
          </Link>

          {/* ... other tabs ... */}
        </nav>
      );
    }
    ```
  - **Acceptance Criteria**:
    - Badge shows count when > 0
    - Badge hidden when count is 0
    - Shows "9+" when count > 9
    - Updates in realtime
    - Positioned correctly on Library icon

- [x] **5.3 - Add pulse animation to badge**
  - **File**: `src/components/mobile/NavTabs.tsx`
  - **Description**: Make badge pulse to draw attention
  - **Implementation**:
    ```typescript
    <span className="... animate-pulse-subtle">
      {actionCount > 9 ? '9+' : actionCount}
    </span>
    ```
  - **Acceptance Criteria**:
    - Badge pulses smoothly (2s loop)
    - Animation doesn't affect performance
    - Uses existing `animate-pulse-subtle` from globals.css

---

### ✅ Task 6.0: Implement New API Endpoints

**Description**: Create three new API routes for lyrics selection, retry, and view tracking.

**Dependencies**: None (can work in parallel)

**Estimated Time**: 3 hours

#### Sub-tasks:

- [x] **6.1 - Create select-lyrics endpoint**
  - **File**: `src/app/api/library/songs/[songId]/select-lyrics/route.ts` (NEW)
  - **Description**: Select a lyric variant and start music generation
  - **Implementation**:
    ```typescript
    import { NextRequest, NextResponse } from 'next/server';
    import { getAdminDb } from '@/lib/adminDb';
    import {
      parseLyricVariants,
      stringifyLyricVariants,
      parseGenerationProgress,
      stringifyGenerationProgress,
    } from '@/types/generation';

    export async function POST(
      req: NextRequest,
      { params }: { params: { songId: string } }
    ) {
      try {
        const { variantIndex } = await req.json();
        const { songId } = params;

        // Validate
        if (typeof variantIndex !== 'number') {
          return NextResponse.json(
            { error: 'variantIndex required' },
            { status: 400 }
          );
        }

        // Get song
        const admin = getAdminDb();
        const { songs } = await admin.query({
          songs: {
            $: { where: { id: songId } },
          },
        });

        const song = songs[0];
        if (!song) {
          return NextResponse.json(
            { error: 'Song not found' },
            { status: 404 }
          );
        }

        // Parse variants
        const variants = parseLyricVariants(song.lyricsVariants);
        if (!variants || variantIndex >= variants.length) {
          return NextResponse.json(
            { error: 'Invalid variant index' },
            { status: 400 }
          );
        }

        // Update variants: mark selected
        const updatedVariants = variants.map((v, i) => ({
          ...v,
          selected: i === variantIndex,
        }));

        // Update progress
        const progress = parseGenerationProgress(song.generationProgress);
        const updatedProgress = {
          ...progress,
          musicStartedAt: Date.now(),
          musicError: null,
        };

        // Update song
        await admin.transact([
          admin.tx.songs[songId].update({
            status: 'generating_music',
            lyrics: updatedVariants[variantIndex].text,
            lyricsVariants: stringifyLyricVariants(updatedVariants),
            generationProgress: stringifyGenerationProgress(updatedProgress),
          }),
        ]);

        // Start music generation
        const musicRes = await fetch(`${process.env.VERCEL_URL || 'http://localhost:3000'}/api/suno`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            songId,
            title: song.title || 'Jouw Liedje',
            lyrics: updatedVariants[variantIndex].text,
            musicStyle: song.musicStyle || 'romantic ballad',
            model: 'V4',
          }),
        });

        if (!musicRes.ok) {
          throw new Error('Failed to start music generation');
        }

        const musicData = await musicRes.json();

        return NextResponse.json({
          ok: true,
          message: 'Variant selected, music generation started',
          taskId: musicData.taskId,
        });
      } catch (error: any) {
        console.error('Select lyrics error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    }
    ```
  - **Acceptance Criteria**:
    - Validates variantIndex
    - Updates lyricsVariants with selected flag
    - Sets status to generating_music
    - Calls /api/suno to start music generation
    - Returns taskId on success
    - Error handling for all edge cases

- [x] **6.2 - Create retry endpoint**
  - **File**: `src/app/api/library/songs/[songId]/retry/route.ts` (NEW)
  - **Description**: Retry failed lyrics or music generation
  - **Implementation**:
    ```typescript
    export async function POST(
      req: NextRequest,
      { params }: { params: { songId: string } }
    ) {
      try {
        const { phase } = await req.json(); // 'lyrics' | 'music'
        const { songId } = params;

        if (!['lyrics', 'music'].includes(phase)) {
          return NextResponse.json(
            { error: 'phase must be "lyrics" or "music"' },
            { status: 400 }
          );
        }

        // Get song
        const admin = getAdminDb();
        const { songs } = await admin.query({
          songs: {
            $: { where: { id: songId } },
          },
        });

        const song = songs[0];
        if (!song) {
          return NextResponse.json(
            { error: 'Song not found' },
            { status: 404 }
          );
        }

        // Check retry count
        const progress = parseGenerationProgress(song.generationProgress);
        const retryCountField = phase === 'lyrics'
          ? 'lyricsRetryCount'
          : 'musicRetryCount';
        const currentRetries = progress?.[retryCountField] ?? 0;

        if (currentRetries >= 3) {
          return NextResponse.json(
            { error: 'Maximum retries (3) exceeded' },
            { status: 429 }
          );
        }

        // Update progress
        const updatedProgress = {
          ...progress,
          [retryCountField]: currentRetries + 1,
          [`${phase}Error`]: null,
          [`${phase}StartedAt`]: Date.now(),
        };

        // Update status
        const newStatus = phase === 'lyrics'
          ? 'generating_lyrics'
          : 'generating_music';

        await admin.transact([
          admin.tx.songs[songId].update({
            status: newStatus,
            generationProgress: stringifyGenerationProgress(updatedProgress),
          }),
        ]);

        // Call appropriate API
        let taskId: string;
        if (phase === 'lyrics') {
          // Call lyrics API
          const res = await fetch('http://localhost:3000/api/suno/lyrics', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              prompt: song.prompt || 'Romantic love song',
              callBackUrl: `http://localhost:3000/api/suno/lyrics/callback?songId=${songId}`,
            }),
          });
          const data = await res.json();
          taskId = data.taskId;
        } else {
          // Call music API
          const res = await fetch('http://localhost:3000/api/suno', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              songId,
              title: song.title,
              lyrics: song.lyrics,
              musicStyle: song.musicStyle,
            }),
          });
          const data = await res.json();
          taskId = data.taskId;
        }

        return NextResponse.json({
          ok: true,
          message: 'Retry started',
          taskId,
          retryCount: currentRetries + 1,
        });
      } catch (error: any) {
        console.error('Retry error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    }
    ```
  - **Acceptance Criteria**:
    - Validates phase parameter
    - Checks retry count (max 3)
    - Increments retry count
    - Resets error fields
    - Calls appropriate Suno API
    - Returns taskId and retry count

- [x] **6.3 - Create view tracking endpoint**
  - **File**: `src/app/api/library/songs/[songId]/view/route.ts` (NEW)
  - **Description**: Update lastViewedAt when user opens song
  - **Implementation**:
    ```typescript
    export async function PATCH(
      req: NextRequest,
      { params }: { params: { songId: string } }
    ) {
      try {
        const { songId } = params;

        const admin = getAdminDb();
        await admin.transact([
          admin.tx.songs[songId].update({
            lastViewedAt: Date.now(),
          }),
        ]);

        return NextResponse.json({ ok: true });
      } catch (error: any) {
        console.error('View tracking error:', error);
        return NextResponse.json(
          { error: error.message || 'Internal error' },
          { status: 500 }
        );
      }
    }
    ```
  - **Acceptance Criteria**:
    - Updates lastViewedAt timestamp
    - Returns success
    - Error handling

- [x] **6.4 - Add endpoint tests**
  - **File**: `src/app/api/library/songs/__tests__/endpoints.test.ts` (NEW)
  - **Description**: Unit tests for all 3 endpoints
  - **Tests**:
    - select-lyrics: valid variant, invalid variant, song not found
    - retry: lyrics retry, music retry, max retries exceeded
    - view: successful tracking
  - **Acceptance Criteria**:
    - All tests passing
    - Edge cases covered
    - Mock InstantDB and Suno API calls

---

### 🎨 Task 7.0: Update Studio Flow for Async Generation

**Description**: Remove blocking modals from Studio and redirect to Library after generation starts.

**Dependencies**: Tasks 4.0, 8.0 (toast system)

**Estimated Time**: 2 hours

#### Sub-tasks:

- [ ] **7.1 - Remove LyricsGenerationProgress modal**
  - **File**: `src/app/studio/StudioClient.tsx`
  - **Description**: Remove modal from render and state
  - **Changes**:
    - Remove `isGeneratingLyrics` state (line ~312)
    - Remove `lyricsPollingAttempts` state
    - Remove `<LyricsGenerationProgress>` component from render (line ~2800)
    - Remove import for LyricsGenerationProgress
  - **Acceptance Criteria**:
    - Modal no longer rendered
    - No TypeScript errors
    - No unused state variables

- [ ] **7.2 - Update generateLyrics function**
  - **File**: `src/app/studio/StudioClient.tsx`
  - **Description**: Create song early and don't wait for polling
  - **Implementation**:
    ```typescript
    const generateLyrics = async () => {
      try {
        // Get template
        const template = selectedTemplateId
          ? getTemplateById(selectedTemplateId)
          : getTemplateById('romantic-ballad');

        if (!template) throw new Error('No template selected');

        // Build prompt
        const prompt = buildSunoLyricsPrompt(
          extractedContext,
          template,
          songSettings.language || 'Nederlands'
        );

        // Create song entity EARLY with status 'generating_lyrics'
        const newSongId = id();
        db.transact([
          db.tx.songs[newSongId]
            .update({
              title: extractedContext?.occasionType || 'Jouw Liedje',
              status: 'generating_lyrics',
              generationProgress: stringifyGenerationProgress({
                lyricsTaskId: null, // Will be set by API
                lyricsStartedAt: Date.now(),
                lyricsCompletedAt: null,
                lyricsError: null,
                lyricsRetryCount: 0,
                musicTaskId: null,
                musicStartedAt: null,
                musicCompletedAt: null,
                musicError: null,
                musicRetryCount: 0,
                rawCallback: null,
              }),
              extractedContext: stringifyExtractedContext(extractedContext),
              songSettings: JSON.stringify(songSettings),
              prompt,
            })
            .link({
              conversation: conversationId,
              user: auth.user.id,
            }),
        ]);

        // Start generation (don't wait)
        const response = await fetch('/api/suno/lyrics', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            prompt,
            callBackUrl: getLyricsCallbackUrl(newSongId),
          }),
        });

        const data = await response.json();

        if (data.error) throw new Error(data.error);

        // Show toast (Task 8.0)
        showToast({
          title: 'Je liedje wordt gegenereerd! ✨',
          description: 'Je ontvangt een notificatie wanneer de lyrics klaar zijn.',
        });

        // Redirect to Library
        router.push(`/library?songId=${newSongId}`);

      } catch (error: any) {
        console.error('Lyrics generation error:', error);
        showToast({
          title: 'Er ging iets mis',
          description: error.message || 'Probeer het opnieuw.',
          variant: 'error',
        });
      }
    };
    ```
  - **Acceptance Criteria**:
    - Song created immediately with status 'generating_lyrics'
    - No polling logic
    - Toast shown
    - Redirects to Library
    - Error handling with toast

- [ ] **7.3 - Remove pollForLyrics function**
  - **File**: `src/app/studio/StudioClient.tsx`
  - **Description**: Delete entire pollForLyrics function (lines ~1350-1450)
  - **Acceptance Criteria**:
    - Function removed
    - No references to pollForLyrics
    - No TypeScript errors

- [ ] **7.4 - Update conversation completion handler**
  - **File**: `src/app/studio/StudioClient.tsx`
  - **Description**: Remove transition message, just call generateLyrics
  - **Changes**:
    - In handleConversationComplete (line ~1240)
    - Remove transition message "Geef me een momentje..."
    - Directly call generateLyrics()
  - **Acceptance Criteria**:
    - No transition message
    - Immediately starts generation and redirects

---

### ✅ Task 8.0: Add Toast Notification System

**Description**: Install and configure toast library (sonner) for user feedback.

**Dependencies**: None

**Estimated Time**: 1 hour

#### Sub-tasks:

- [x] **8.1 - Install sonner**
  - **Command**: `npm install sonner`
  - **Description**: Install lightweight toast library
  - **Acceptance Criteria**:
    - Package installed
    - No dependency conflicts

- [x] **8.2 - Add Toaster to root layout**
  - **File**: `src/app/layout.tsx`
  - **Description**: Add Toaster component to app root
  - **Implementation**:
    ```typescript
    import { Toaster } from 'sonner';

    export default function RootLayout({ children }) {
      return (
        <html>
          <body>
            {children}
            <Toaster position="top-center" richColors />
          </body>
        </html>
      );
    }
    ```
  - **Acceptance Criteria**:
    - Toaster renders without errors
    - Positioned at top center
    - Styled with rich colors

- [x] **8.3 - Create toast utility wrapper**
  - **File**: `src/lib/toast.ts` (NEW)
  - **Description**: Wrapper for consistent toast usage
  - **Implementation**:
    ```typescript
    import { toast } from 'sonner';

    export function showToast({
      title,
      description,
      variant = 'default',
    }: {
      title: string;
      description?: string;
      variant?: 'default' | 'success' | 'error';
    }) {
      const message = description
        ? `${title}\n${description}`
        : title;

      switch (variant) {
        case 'success':
          return toast.success(message);
        case 'error':
          return toast.error(message);
        default:
          return toast(message);
      }
    }

    export { toast };
    ```
  - **Acceptance Criteria**:
    - Wrapper function created
    - Supports title + description
    - Supports variants (default, success, error)
    - Re-exports toast for direct usage

- [x] **8.4 - Add toast to Studio generation start**
  - **File**: `src/app/studio/StudioClient.tsx`
  - **Description**: Use toast in generateLyrics (already in Task 7.2)
  - **Acceptance Criteria**:
    - Toast shows on generation start
    - Toast shows on error
    - Messages in Dutch

- [x] **8.5 - Add toast to Library actions**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Replace alert() calls with toast
  - **Changes**:
    - Replace `alert("Deelbare link gekopieerd")` with toast
    - Replace error alerts with error toasts
    - Add toast for lyrics selection success
    - Add toast for retry success
  - **Acceptance Criteria**:
    - No more alert() calls
    - All user feedback via toast
    - Appropriate variants used (success/error)

---

### 📊 Task 9.0: Implement Analytics Events

**Description**: Add tracking for all new user interactions.

**Dependencies**: Tasks 3.0, 4.0, 6.0

**Estimated Time**: 1.5 hours

#### Sub-tasks:

- [ ] **9.1 - Add new event definitions**
  - **File**: `src/lib/analytics/events.ts`
  - **Description**: Define new tracking events
  - **Implementation**:
    ```typescript
    // Library opened
    export function trackLibraryOpen(props: {
      userId?: string;
      source?: 'nav_tab' | 'notification' | 'studio_redirect';
    }) {
      track('library_open', props);
    }

    // Status badge shown
    export function trackStatusBadgeShown(props: {
      status: string;
      songId: string;
    }) {
      track('status_badge_shown', props);
    }

    // Lyrics variant selected
    export function trackLyricsVariantSelected(props: {
      songId: string;
      variantIndex: number;
      timeToSelect: number; // ms since lyrics_ready
    }) {
      track('lyrics_variant_selected', props);
    }

    // Swipe between variants
    export function trackLyricsSwipe(props: {
      songId: string;
      direction: 'left' | 'right';
      fromIndex: number;
      toIndex: number;
    }) {
      track('lyrics_swipe', props);
    }

    // Retry generation
    export function trackGenerationRetry(props: {
      songId: string;
      phase: 'lyrics' | 'music';
      retryCount: number;
    }) {
      track('generation_retry', props);
    }

    // Notification click
    export function trackNotificationClick(props: {
      type: 'lyrics_ready' | 'music_ready';
      songId: string;
      timeToClick: number; // ms since notification sent
    }) {
      track('notification_click', props);
    }
    ```
  - **Acceptance Criteria**:
    - All 6 new events defined
    - Consistent naming convention
    - Type-safe parameters

- [ ] **9.2 - Track Library open with source**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Track how user arrived at Library
  - **Implementation**:
    ```typescript
    import { useSearchParams } from 'next/navigation';

    useEffect(() => {
      if (userId) {
        const searchParams = useSearchParams();
        const fromStudio = searchParams.get('fromStudio');
        const songId = searchParams.get('songId');

        const source = fromStudio
          ? 'studio_redirect'
          : songId
            ? 'notification'
            : 'nav_tab';

        trackLibraryOpen({ userId, source });
      }
    }, [userId]);
    ```
  - **Acceptance Criteria**:
    - Tracks source correctly
    - Differentiates between nav_tab, studio_redirect, notification

- [ ] **9.3 - Track lyrics variant selection**
  - **File**: `src/components/LyricsChoiceModal.tsx`
  - **Description**: Track when user selects a variant
  - **Implementation**:
    ```typescript
    const handleSelect = async (index: number) => {
      setIsSubmitting(true);

      const startTime = Date.now();

      try {
        await onSelectVariant(index);

        // Track selection
        trackLyricsVariantSelected({
          songId,
          variantIndex: index,
          timeToSelect: startTime - modalOpenTime, // Calculate time since modal opened
        });

        onClose();
      } catch (error) {
        // ...
      }
    };
    ```
  - **Acceptance Criteria**:
    - Tracks variant index
    - Calculates time to select
    - Only tracks on successful selection

- [ ] **9.4 - Track swipe gestures**
  - **File**: `src/components/LyricsChoiceModal.tsx`
  - **Description**: Track when user swipes between variants
  - **Implementation**:
    ```typescript
    const handleSwipe = (direction: 'left' | 'right') => {
      const fromIndex = selectedIndex;
      const toIndex = direction === 'left'
        ? Math.min(selectedIndex + 1, variants.length - 1)
        : Math.max(selectedIndex - 1, 0);

      if (fromIndex !== toIndex) {
        trackLyricsSwipe({
          songId,
          direction,
          fromIndex,
          toIndex,
        });

        setSelectedIndex(toIndex);
      }
    };
    ```
  - **Acceptance Criteria**:
    - Tracks swipe direction
    - Tracks from/to indices
    - Only tracks when index changes

- [ ] **9.5 - Track retry attempts**
  - **File**: `src/app/library/page.tsx`
  - **Description**: Track when user retries failed generation
  - **Implementation**:
    ```typescript
    const handleRetry = async (songId: string, phase: 'lyrics' | 'music') => {
      // ... existing code ...

      if (res.ok) {
        const data = await res.json();

        trackGenerationRetry({
          songId,
          phase,
          retryCount: data.retryCount,
        });
      }
    };
    ```
  - **Acceptance Criteria**:
    - Tracks phase (lyrics vs music)
    - Tracks retry count
    - Only tracks on successful retry start

- [ ] **9.6 - Track notification clicks**
  - **File**: `src/lib/push.ts`
  - **Description**: Include tracking data in notification payload
  - **Implementation**:
    ```typescript
    export async function sendLyricsReadyNotification(userId, songId) {
      // ... existing code ...

      const payload = {
        title: 'Je songteksten zijn klaar! 🎵',
        body: 'Kies je favoriete variant',
        url: `/library?songId=${songId}&notifType=lyrics_ready&sentAt=${Date.now()}`,
        // ... other fields
      };
    }
    ```
  - **Track in Library**:
    ```typescript
    // In Library page.tsx
    useEffect(() => {
      const params = new URLSearchParams(window.location.search);
      const notifType = params.get('notifType');
      const sentAt = params.get('sentAt');
      const songId = params.get('songId');

      if (notifType && sentAt && songId) {
        trackNotificationClick({
          type: notifType as any,
          songId,
          timeToClick: Date.now() - parseInt(sentAt),
        });

        // Clean up URL
        window.history.replaceState({}, '', '/library');
      }
    }, []);
    ```
  - **Acceptance Criteria**:
    - Notification URL includes tracking params
    - Library tracks click when params present
    - Calculates time from notification to click
    - Cleans up URL after tracking

---

### ✅ Task 10.0: Testing and QA

**Description**: Comprehensive testing of all new features.

**Dependencies**: All previous tasks

**Estimated Time**: 4 hours

#### Sub-tasks:

- [ ] **10.1 - Unit tests for sorting utilities**
  - **File**: `src/lib/library/sorting.test.ts` (NEW)
  - **Tests**:
    - sortSongsByPriority: action items first, then by time
    - getActionPriority: correct priority for each status
    - getActionItemsCount: counts only lyrics_ready and ready
  - **Acceptance Criteria**:
    - All tests passing
    - Edge cases covered (empty array, all same status)

- [ ] **10.2 - Unit tests for LyricsChoiceModal**
  - **File**: `src/components/LyricsChoiceModal.test.tsx` (NEW)
  - **Tests**:
    - Renders with 2 variants
    - Side-by-side layout on desktop
    - Swipeable layout on mobile
    - Swipe left/right changes variant
    - Indicator updates correctly
    - Selection calls onSelectVariant
    - Keyboard navigation works
  - **Acceptance Criteria**:
    - All tests passing
    - Uses @testing-library/react
    - Mocks swipe events

- [ ] **10.3 - Unit tests for enhanced SongCard**
  - **File**: `src/app/library/components/SongCard.test.tsx` (UPDATE)
  - **Tests**:
    - Shows correct badge for each status (6 states)
    - Shows correct CTA for each status
    - Calls onChooseLyrics when clicked
    - Calls onRetry when clicked
    - Displays error message for failed state
  - **Acceptance Criteria**:
    - All existing tests still pass
    - New tests for 6 status states
    - New tests for new handlers

- [ ] **10.4 - Integration test for lyrics selection flow**
  - **File**: `src/app/library/__tests__/lyrics-flow.test.tsx` (NEW)
  - **Test Flow**:
    1. Song with status 'lyrics_ready'
    2. Click "Kies Lyrics" button
    3. Modal opens with 2 variants
    4. Select variant 1
    5. API called with variantIndex: 0
    6. Modal closes
    7. Song status updates to 'generating_music'
  - **Acceptance Criteria**:
    - Complete flow tested
    - Mocks API calls
    - Mocks InstantDB

- [ ] **10.5 - Integration test for retry flow**
  - **File**: `src/app/library/__tests__/retry-flow.test.tsx` (NEW)
  - **Test Flow**:
    1. Song with status 'failed'
    2. Click "Probeer opnieuw" button
    3. API called with phase
    4. Song status updates to 'generating_lyrics' or 'generating_music'
    5. Success toast shown
  - **Acceptance Criteria**:
    - Both lyrics and music retry tested
    - Max retry limit tested
    - Error handling tested

- [ ] **10.6 - E2E test for complete async flow**
  - **File**: `tests/e2e/library-async-generation.spec.ts` (NEW)
  - **Test Flow**:
    1. User completes Studio conversation
    2. Redirected to Library
    3. See song with "Tekst genereren..." badge
    4. Mock callback arrives (status → lyrics_ready)
    5. Badge changes to "Klaar om te kiezen"
    6. Click card → Modal opens
    7. Swipe between variants (mobile)
    8. Select variant → Modal closes
    9. Badge changes to "Muziek genereren..."
    10. Mock callback arrives (status → ready)
    11. Badge changes to "Klaar om te spelen"
    12. Click play → Audio player opens
  - **Acceptance Criteria**:
    - Complete flow works end-to-end
    - Both desktop and mobile tested
    - Mocks Suno callbacks

- [ ] **10.7 - Manual QA checklist**
  - **Checklist**:
    - [ ] All 6 status badges show correct colors/icons
    - [ ] Badge counter on Library tab updates realtime
    - [ ] Smart sorting: action items appear first
    - [ ] Swipe works smooth on mobile (iOS + Android)
    - [ ] Indicator "1/2, 2/2" clearly visible
    - [ ] Deep linking from notifications works
    - [ ] Retry button works for failed songs
    - [ ] Empty states show correct content
    - [ ] Toasts show for all user actions
    - [ ] Analytics events fire correctly
    - [ ] No tabs visible (Songs only)
    - [ ] No blocking modals in Studio
    - [ ] Redirect to Library after generation start
    - [ ] Performance: < 3s initial load
    - [ ] Accessibility: ARIA labels, keyboard nav
  - **Acceptance Criteria**:
    - All items checked
    - Screenshots/videos captured for evidence

- [ ] **10.8 - Performance testing**
  - **Tests**:
    - Library load time with 50+ songs
    - Smart sorting performance with 100+ songs
    - InstantDB subscription memory usage
    - Toast performance (multiple toasts)
  - **Acceptance Criteria**:
    - Library loads in < 3s
    - Sorting completes in < 100ms
    - No memory leaks
    - Smooth 60fps scrolling

---

## Summary

**Total Tasks**: 10 parent tasks, 65 sub-tasks

**Estimated Total Time**: 21 hours (~3 days)

**Critical Path**:
1. Task 1.0 (queries) → Task 2.0 (SongCard) → Task 4.0 (Library page)
2. Task 1.0 (queries) → Task 3.0 (Modal) → Task 4.0 (Library page)
3. Task 8.0 (toast) → Task 7.0 (Studio)
4. All → Task 10.0 (testing)

**Implementation Phases** (from PRD):
- **Phase 1** (Week 1): Tasks 1.0, 2.0, 3.0, 5.0
- **Phase 2** (Week 1-2): Tasks 4.0, 6.0, 9.0
- **Phase 3** (Week 2): Tasks 7.0, 8.0
- **Phase 4** (Week 2-3): Task 10.0

---

**Status**: ✅ Task list complete - Ready for implementation

**Next Steps**:
1. Review and approve task list
2. Create feature branch: `feature/library-redesign-async-flow`
3. Begin with Task 1.0
4. Track progress in this document

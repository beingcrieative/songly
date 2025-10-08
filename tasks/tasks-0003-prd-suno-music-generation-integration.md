# Tasks: Suno Music Generation Integration for Studio Page

Based on PRD-0003: Suno Music Generation Integration

## Relevant Files

### New Files to Create
- `src/components/MusicGenerationProgress.tsx` - Multi-stage progress animation component
- `src/components/VariantSelector.tsx` - Modal for selecting between two Suno variants
- `src/components/MusicPlayer.tsx` - Reusable music player with album art and controls
- `src/hooks/useMusicGeneration.ts` - Custom hook for music generation state and polling logic
- `src/lib/utils/audioHelpers.ts` - Helper functions for audio format detection and download

### Existing Files to Modify
- `src/components/LyricsPanel.tsx` - Add "Genereer Muziek" button and integrate music player
- `src/app/studio/page.tsx` - Add music generation state management and handlers
- `src/app/api/suno/route.ts` - Verify payload structure matches PRD requirements
- `src/app/api/suno/callback/route.ts` - Ensure proper variant creation and song updates
- `src/instant.schema.ts` - Verify songs entity has `selectedVariantId` field (if needed)

### Reference Files
- `src/app/page.tsx` - Reference for audio player patterns and variant handling

### Notes
- Suno API returns 2 variants per generation - both should be saved as `sunoVariants` entities
- Use InstantDB subscriptions (via `db.useQuery()`) to detect song status changes from callbacks
- Progress animation should use CSS animations for performance (GPU-accelerated)
- Audio player should prefer `streamAudioUrl` over `audioUrl` for faster playback start

## Tasks

- [x] 1.0 Add Music Generation Button and State Management
  - [x] 1.1 Add `onGenerateMusic` prop to LyricsPanel component interface (optional callback function)
  - [x] 1.2 Add "Genereer Muziek" button in LyricsPanel below "Verfijn lyrics" button
  - [x] 1.3 Style button to match existing design system (similar styling to "Verfijn lyrics")
  - [x] 1.4 Add `isGeneratingMusic` prop to LyricsPanel to control button disabled state
  - [x] 1.5 Update button text to "Muziek genereren..." when `isGeneratingMusic` is true
  - [x] 1.6 Add state to studio page: `isGeneratingMusic: boolean`, `generationStage: 1 | 2 | 3 | null`, `currentSong: any | null`, `showVariantSelector: boolean`, `selectedVariantId: string | null`
  - [x] 1.7 Create `handleGenerateMusic` function in studio page
  - [x] 1.8 Pass `handleGenerateMusic` and `isGeneratingMusic` as props to LyricsPanel

- [x] 2.0 Create Multi-Stage Progress Animation Component
  - [x] 2.1 Create file `src/components/MusicGenerationProgress.tsx` with TypeScript
  - [x] 2.2 Add props interface: `stage: 1 | 2 | 3`, `estimatedTimeRemaining: number`
  - [x] 2.3 Create horizontal stage indicator with 3 nodes (Stage 1, 2, 3)
  - [x] 2.4 Style nodes: inactive=gray, active=purple, completed=green with checkmark
  - [x] 2.5 Add stage-specific messages: "🎵 Melodie wordt gemaakt...", "🎤 Vocals worden toegevoegd...", "✨ Laatste details..."
  - [x] 2.6 Create SVG musical notes (♪ ♫ ♬) with floating animation (bottom-left to top-right)
  - [x] 2.7 Use CSS keyframe animations for note movement with fade-in/fade-out
  - [x] 2.8 Add time remaining display: "Nog ongeveer {X} seconden..."
  - [x] 2.9 Add subtle purple/pink gradient background overlay
  - [x] 2.10 Ensure animations use `transform` and `opacity` for GPU acceleration (60fps)

- [ ] 3.0 Implement Music Generation Trigger and Status Checking
  - [ ] 3.1 In `handleGenerateMusic`, generate new `songId` using `id()` from InstantDB
  - [ ] 3.2 Extract title from `latestLyrics.title`, lyrics from `latestLyrics.lyrics`, style from `latestLyrics.style`
  - [ ] 3.3 Create song entity in InstantDB with status "generating", link to conversation and user (skip in DEV_MODE)
  - [ ] 3.4 Call POST `/api/suno` with payload: `{ songId, title, lyrics, musicStyle, model: "V4" }`
  - [ ] 3.5 Update `isGeneratingMusic` to true, set `generationStage` to 1, store `currentSong` with songId
  - [ ] 3.6 Set up InstantDB query subscription on `songs` entity filtered by `songId`
  - [ ] 3.7 Add useEffect to watch for song status changes (when status becomes "ready")
  - [ ] 3.8 Implement timer-based stage transitions: Stage 1→2 after 20s, Stage 2→3 after 40s
  - [ ] 3.9 After 10 seconds with no callback update, start polling GET `/api/suno?taskId={taskId}` every 5 seconds
  - [ ] 3.10 Stop polling when InstantDB subscription detects status change to "ready"
  - [ ] 3.11 Implement 120-second timeout - if no update after 2 minutes, show timeout error
  - [ ] 3.12 When status becomes "ready", stop timers, set `showVariantSelector` to true

- [ ] 4.0 Build Variant Selection System
  - [ ] 4.1 Create file `src/components/VariantSelector.tsx` with TypeScript
  - [ ] 4.2 Add props interface: `variants: Array<{ id, trackId, title, streamAudioUrl, audioUrl, imageUrl, durationSeconds }>`, `onSelect: (variantId: string) => void`, `onClose: () => void`
  - [ ] 4.3 Create modal overlay with semi-transparent background
  - [ ] 4.4 Create modal content with heading "Kies je favoriete versie"
  - [ ] 4.5 Build side-by-side variant cards (50/50 on desktop, stacked on mobile using responsive grid)
  - [ ] 4.6 For each variant, display: title ("Versie 1", "Versie 2"), duration, album art thumbnail
  - [ ] 4.7 Add mini audio player to each card with play/pause button
  - [ ] 4.8 Implement waveform visualization using 5-7 animated bars (simple div elements with height animation)
  - [ ] 4.9 Add "Selecteer deze versie" button below each variant card
  - [ ] 4.10 Implement audio playback control (pause other variant when playing one)
  - [ ] 4.11 On selection, call `onSelect(variantId)`, close modal, proceed to full player

- [ ] 5.0 Integrate Music Player with Album Art and Controls
  - [ ] 5.1 Create file `src/components/MusicPlayer.tsx` with TypeScript
  - [ ] 5.2 Add props interface: `title: string`, `albumArt: string`, `audioUrl: string`, `streamUrl: string`, `onDownload?: () => void`
  - [ ] 5.3 Create player layout: album art (320x320px, rounded corners) at top
  - [ ] 5.4 Add play/pause button overlaid on album art (80px diameter, white with 50% opacity background)
  - [ ] 5.5 Implement HTML5 `<audio>` element with `streamUrl` as source (prefer stream over full file)
  - [ ] 5.6 Add progress bar below album art (full width, 8px height, purple fill, draggable seek)
  - [ ] 5.7 Display current time and total duration in MM:SS format below progress bar
  - [ ] 5.8 Implement seek functionality (click/drag on progress bar updates audio currentTime)
  - [ ] 5.9 Update LyricsPanel to expand and show MusicPlayer at top when song is ready
  - [ ] 5.10 Keep lyrics visible below player (scrollable if content overflows)
  - [ ] 5.11 Add audio event listeners: onTimeUpdate for progress, onEnded for completion, onError for failures

- [ ] 6.0 Add Error Handling and Post-Generation Actions
  - [ ] 6.1 Add error state to studio page: `generationError: string | null`
  - [ ] 6.2 In music generation handler, wrap API call in try-catch and set error state on failure
  - [ ] 6.3 Create error display UI in LyricsPanel when `generationError` is set
  - [ ] 6.4 Show user-friendly Dutch message: "Er ging iets mis met het genereren van je muziek"
  - [ ] 6.5 Add "Probeer opnieuw" button that calls `handleGenerateMusic` again with same params
  - [ ] 6.6 Add "Pas lyrics aan" button that returns to lyrics refinement (set phase to 'refining')
  - [ ] 6.7 Update songs entity status to "failed" with errorMessage when error occurs
  - [ ] 6.8 Add timeout error handling: if polling exceeds 120s, show "Generatie duurt langer dan verwacht"
  - [ ] 6.9 Create file `src/lib/utils/audioHelpers.ts` with `downloadAudioFile(url, filename)` function
  - [ ] 6.10 Add "Download MP3" button below music player
  - [ ] 6.11 Implement download handler: generate filename `{song-title}-liefdesliedje.mp3`, trigger download using audioUrl
  - [ ] 6.12 Add "Deel je liedje" button (placeholder for future feature, show coming soon message)
  - [ ] 6.13 Add "Maak nieuwe versie" button that shows options to change style or refine lyrics first
  - [ ] 6.14 Verify all error messages are in Dutch and user-friendly (no technical jargon)

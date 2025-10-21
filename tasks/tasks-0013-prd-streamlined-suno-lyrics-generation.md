# Tasks: Streamlined Suno Lyrics Generation

Based on PRD: `0013-prd-streamlined-suno-lyrics-generation.md`

## Relevant Files

### Files to DELETE
- `src/app/api/chat/generate-lyrics/route.ts` - OpenRouter lyrics generation endpoint (to be removed)
- `src/lib/prompts/lyricsAgent.ts` - OpenRouter lyrics prompts (to be removed)

### Files to CREATE
- `src/components/LyricsGenerationProgress.tsx` - Modal overlay for lyrics generation progress
- `src/components/LyricsGenerationProgress.test.tsx` - Unit tests for progress modal
- `src/components/RefinementOptions.tsx` - Refinement and manual edit UI
- `src/components/RefinementOptions.test.tsx` - Unit tests for refinement options
- `src/components/ManualEditModal.tsx` - Modal for manual lyrics editing
- `src/components/ManualEditModal.test.tsx` - Unit tests for manual edit modal
- `src/components/LyricsCard.tsx` - Individual variant card component (optional - may enhance LyricsCompare instead)

### Files to MODIFY
- `src/app/studio/StudioClient.tsx` - Main studio flow - remove OpenRouter, add Suno-only flow with 2-variant comparison
- `src/components/LyricsCompare.tsx` - Enhance for new flow (may already have most features)
- `src/components/LyricsPanel.tsx` - Update to show refinement options after selection
- `src/lib/analytics/events.ts` - Add new event types (generation_started, proceeded_to_music, manually_edited)
- `src/lib/utils/sunoLyricsPrompt.ts` - Already has refinement support, may need minor enhancements
- `src/app/api/suno/lyrics/route.ts` - Ensure handles 2 variants correctly
- `src/app/api/suno/lyrics/callback/route.ts` - Ensure stores 2 variants in conceptLyrics

### Test Files
- `src/components/LyricsCompare.test.tsx` - Update tests for new selection flow
- `src/components/LyricsPanel.test.tsx` - Update tests for refinement options
- `tests/e2e/lyrics-generation.spec.ts` - E2E test for complete flow (to be created)

### Notes
- Use existing `MusicGenerationProgress.tsx` as template for `LyricsGenerationProgress.tsx`
- Analytics events already partially defined in `src/lib/analytics/events.ts`
- Suno prompt builder already supports refinement via `buildLyricsRefinementPrompt()`
- LyricsCompare already has swipe functionality for mobile

## Tasks

- [x] 1.0 Remove OpenRouter Lyrics Generation System
  - [x] 1.1 Delete `/src/app/api/chat/generate-lyrics/route.ts` file
  - [x] 1.2 Delete `/src/lib/prompts/lyricsAgent.ts` file
  - [x] 1.3 Search and remove all imports/references to deleted files in StudioClient.tsx
  - [x] 1.4 Remove any OpenRouter-specific state variables and functions from StudioClient
  - [x] 1.5 Verify no broken imports or references remain

- [x] 2.0 Create Lyrics Generation Progress UI
  - [x] 2.1 Create `src/components/LyricsGenerationProgress.tsx` component (based on MusicGenerationProgress)
  - [x] 2.2 Add props: `isGenerating`, `isRefining`, `pollingAttempts`, `onCancel`
  - [x] 2.3 Implement progress messages for generation vs refinement
  - [x] 2.4 Add estimated time display and cancel button (after timeout)
  - [x] 2.5 Create unit tests in `LyricsGenerationProgress.test.tsx`

- [x] 3.0 Enhance Lyrics Comparison and Selection Flow
  - [x] 3.1 Update StudioClient to call Suno lyrics API after conversation readiness
  - [x] 3.2 Implement state management for 2 lyrics variants (variantA, variantB)
  - [x] 3.3 Show LyricsGenerationProgress modal during generation
  - [x] 3.4 Implement callback + polling mechanism for lyrics (10s callback wait, then 5s polling)
  - [x] 3.5 Update LyricsCompare to handle 2 variants from Suno response
  - [x] 3.6 Ensure "Gebruik geselecteerde lyrics" button is disabled until selection
  - [x] 3.7 Store selected variant in state and InstantDB (conceptLyrics)
  - [x] 3.8 Update LyricsCompare tests for new selection flow

- [ ] 4.0 Implement Refinement and Manual Editing
  - [ ] 4.1 Create `src/components/RefinementOptions.tsx` component
  - [ ] 4.2 Add feedback textarea with "Verfijn lyrics" button (disabled after 1 use)
  - [ ] 4.3 Implement refinement API call with previousLyrics + feedback + context
  - [ ] 4.4 Add refinementUsed state flag to enforce one-time limit
  - [ ] 4.5 Create `src/components/ManualEditModal.tsx` for manual editing
  - [ ] 4.6 Implement manual save with isManual flag in lyric_versions
  - [ ] 4.7 Add "Genereer Muziek" button after selection/refinement
  - [ ] 4.8 Create unit tests for RefinementOptions and ManualEditModal

- [ ] 5.0 Integrate with Parameters and Music Generation
  - [ ] 5.1 Update "Genereer Muziek" button to open ParameterSheet
  - [ ] 5.2 Pre-fill ParameterSheet with values from conversation context (language, vocalGender)
  - [ ] 5.3 Ensure template config carries through from conversation to parameters
  - [ ] 5.4 Update onConfirm handler to pass all parameters to /api/suno music endpoint
  - [ ] 5.5 Verify activeLyrics are used in music generation request
  - [ ] 5.6 Test end-to-end flow: Conversation → Lyrics → Selection → Parameters → Music

- [ ] 6.0 Add Analytics Tracking and Error Handling
  - [ ] 6.1 Add LYRICS_GENERATION_STARTED event to analytics/events.ts
  - [ ] 6.2 Add LYRICS_MANUALLY_EDITED event to analytics/events.ts
  - [ ] 6.3 Add LYRICS_PROCEEDED_TO_MUSIC event to analytics/events.ts
  - [ ] 6.4 Implement trackLyricsGenerationStarted() function
  - [ ] 6.5 Implement trackLyricsManuallyEdited() function
  - [ ] 6.6 Implement trackLyricsProceededToMusic() function
  - [ ] 6.7 Add error modal for timeouts and API failures
  - [ ] 6.8 Implement retry logic with "Probeer opnieuw" and "Terug naar gesprek" options
  - [ ] 6.9 Add comprehensive error logging for debugging

- [ ] 7.0 Testing and Documentation
  - [ ] 7.1 Run all existing unit tests and fix any broken tests
  - [ ] 7.2 Create E2E test for complete flow (conversation → lyrics → selection → music)
  - [ ] 7.3 Test mobile responsiveness (swipe gestures, sticky CTA)
  - [ ] 7.4 Test error scenarios (timeout, API failures, network errors)
  - [ ] 7.5 Update CLAUDE.md to remove OpenRouter references
  - [ ] 7.6 Update CLAUDE.md with new Suno-only flow documentation
  - [ ] 7.7 Add code comments to complex state transitions
  - [ ] 7.8 Verify all analytics events fire correctly

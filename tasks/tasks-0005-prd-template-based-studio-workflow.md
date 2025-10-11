# Tasks: Template-Based Studio Workflow met Suno Lyrics Generatie

Based on: `0005-prd-template-based-studio-workflow.md`

## Relevant Files

### New Files to Create
- ✅ `src/templates/music-templates.ts` - Template configurations with Suno parameters (CREATED)
- ✅ `public/templates/.gitkeep` - Template assets directory (CREATED)
- ✅ `genereermuziek.md` - Audio generation instructions (CREATED)
- ✅ `src/components/TemplateSelector.tsx` - Template selection component (left pane) (CREATED)
- ✅ `src/components/TemplateCard.tsx` - Individual template display card (CREATED)
- ✅ `src/lib/utils/sunoLyricsPrompt.ts` - Lyrics prompt builder utility (CREATED)
- ✅ `src/app/api/suno/lyrics/route.ts` - Suno lyrics generation endpoint (CREATED)
- ✅ `src/app/api/suno/lyrics/callback/route.ts` - Suno lyrics callback handler (CREATED)
- `src/components/AdvancedControlsPanel.tsx` - Advanced Suno parameters panel
- `src/components/KaraokeLyrics.tsx` - Synchronized lyrics display component
- `src/components/ErrorModal.tsx` - Error handling modal with recovery options
- `src/app/api/suno/lyrics/route.ts` - Suno lyrics generation endpoint
- `src/app/api/suno/lyrics/callback/route.ts` - Suno lyrics callback handler
- `src/app/api/suno/lyrics-timestamped/route.ts` - Timestamped lyrics endpoint
- `src/lib/utils/sunoLyricsPrompt.ts` - Lyrics prompt builder utility
- `src/lib/utils/errorMessages.ts` - Error message translations (Dutch)
- `src/lib/analytics/events.ts` - Analytics event definitions and tracking
- `public/templates/` - Template preview audio files (directory)

### Existing Files to Modify
- ✅ `src/app/studio/page.tsx` - Main studio page (add template selection, new state) (MODIFIED)
- ✅ `src/components/ConversationalStudioLayout.tsx` - Update to 3-column layout (MODIFIED)
- `src/components/LyricsPanel.tsx` - Add karaoke mode, advanced controls toggle
- `src/components/VariantSelector.tsx` - Enhance with progressive loading states
- `src/components/MusicPlayer.tsx` - Add karaoke mode support
- `src/app/api/suno/route.ts` - Accept template config, handle advanced params
- `src/app/api/suno/callback/route.ts` - Handle 'first' vs 'complete' callbacks
- `src/instant.schema.ts` - Add musicTemplates entity, update songs/variants
- `src/instant.perms.ts` - Add permissions for new entities
- `src/types/conversation.ts` - Add template-related types

### Test Files
- `src/templates/music-templates.test.ts` - Template configuration validation
- `src/lib/utils/sunoLyricsPrompt.test.ts` - Prompt builder unit tests
- `src/lib/utils/errorMessages.test.ts` - Error translation tests
- `src/components/TemplateSelector.test.tsx` - Template selection component tests
- `src/components/KaraokeLyrics.test.tsx` - Karaoke synchronization tests

### Notes
- Template preview audio files need to be generated manually via Suno first (see PRD Appendix A)
- All new API endpoints require `SUNO_API_KEY` environment variable
- InstantDB schema push required after schema changes: `npx instant-cli push`
- Use existing `db.useQuery()` pattern for InstantDB subscriptions
- Follow existing pink/romantic theme for UI components

---

## Tasks

### Phase 1: Foundation (Template Selection + Suno Lyrics)

- [x] 1.0 Create Template System Infrastructure
  - [x] 1.1 Create `src/templates/music-templates.ts` with `MusicTemplate` interface
  - [x] 1.2 Define three template configurations (Romantische Ballad, Vrolijke Pop, Akoestisch Intiem) with Suno parameters
  - [x] 1.3 Add "Verras Me" template configuration with minimal constraints
  - [ ] 1.4 Generate 3 template preview audio files via Suno API (manual task, ~30 seconds each) - See genereermuziek.md
  - [x] 1.5 Save preview files to `public/templates/` directory (directory created, awaiting audio files)
  - [x] 1.6 Add template cover images to `public/templates/` directory (directory created, awaiting images)
  - [x] 1.7 Create template getter utility function `getTemplateById(id: string)`
  - [x] 1.8 Create template validation function to ensure all required fields present

- [x] 2.0 Build Template Selector UI Component
  - [x] 2.1 Create `src/components/TemplateCard.tsx` component
  - [x] 2.2 Add template name, description, and image display to TemplateCard
  - [x] 2.3 Add mini audio player to TemplateCard with play/pause button
  - [x] 2.4 Add visual selection state (highlight border when selected)
  - [x] 2.5 Create `src/components/TemplateSelector.tsx` parent component
  - [x] 2.6 Map all templates to TemplateCard components
  - [x] 2.7 Add "Verras Me" card with special styling (sparkle icon ✨)
  - [x] 2.8 Implement template selection handler with state update
  - [x] 2.9 Add responsive layout for template cards (stack on mobile)
  - [x] 2.10 Style with existing pink/romantic theme (pink-500 for selected state)

- [x] 3.0 Implement Suno Lyrics Generation API
  - [x] 3.1 Create `src/lib/utils/sunoLyricsPrompt.ts` with `buildSunoLyricsPrompt()` function
  - [x] 3.2 Implement prompt builder using ExtractedContext and template config
  - [x] 3.3 Format prompt with memories, emotions, partner traits, and music style
  - [x] 3.4 Create `src/app/api/suno/lyrics/route.ts` POST endpoint
  - [x] 3.5 Add request validation (prompt required, character limits)
  - [x] 3.6 Call Suno `/api/v1/lyrics` endpoint with Authorization header
  - [x] 3.7 Handle response and extract task_id
  - [x] 3.8 Return task_id and status to client
  - [x] 3.9 Create `src/app/api/suno/lyrics/callback/route.ts` POST endpoint
  - [x] 3.10 Parse callback payload for lyrics data
  - [x] 3.11 Update conversation or create lyrics entity in InstantDB
  - [x] 3.12 Add error handling for Suno API errors (400, 429, 500)
  - [x] 3.13 Log all requests/responses for debugging

- [x] 4.0 Integrate Template Selection with Studio Workflow
  - [x] 4.1 Update `src/app/studio/page.tsx` to add `selectedTemplateId` state
  - [x] 4.2 Add `templateConfig` state to store selected template's Suno config
  - [x] 4.3 Update `ConversationalStudioLayout` to accept template selector as left pane
  - [x] 4.4 Pass template selection handler from page to TemplateSelector
  - [x] 4.5 Update template selection to store config in state and persist to InstantDB conversation
  - [x] 4.6 Modify lyrics generation to include template context in prompt
  - [x] 4.7 Update `transitionToLyricsGeneration()` to call Suno lyrics API instead of DeepSeek
  - [x] 4.8 Parse Suno lyrics response and update UI (with polling)
  - [x] 4.9 Test end-to-end: Select template → Chat → Suno lyrics displayed (ready for testing)

### Phase 2: Music Generation Enhancement (Progressive Loading)

- [x] 5.0 Enhance Music Generation with Template Config
  - [x] 5.1 Update `src/instant.schema.ts` to add `templateId` field to `songs` entity
  - [x] 5.2 Update `songs` entity to add `lyricsTaskId` field (track Suno lyrics task)
  - [x] 5.3 Update `sunoVariants` entity to add `streamAudioUrl` field (nullable)
  - [x] 5.4 Add `streamAvailableAt` and `downloadAvailableAt` timestamp fields to variants
  - [ ] 5.5 Run `npx instant-cli push` to sync schema changes (USER ACTION REQUIRED)
  - [x] 5.6 Update `src/app/api/suno/route.ts` POST to accept `templateConfig` in request body
  - [x] 5.7 Merge template config with any user overrides (advanced controls)
  - [x] 5.8 Add template tags to Suno `tags` parameter
  - [x] 5.9 Add template `styleWeight`, `weirdnessConstraint`, `audioWeight` to request
  - [x] 5.10 Save `templateId` to song entity in InstantDB
  - [x] 5.11 Test: Generate music with template config → verify parameters sent to Suno (ready for testing)

- [x] 6.0 Implement Progressive Variant Loading System
  - [x] 6.1 Update `src/app/api/suno/callback/route.ts` to detect `callbackType` field
  - [x] 6.2 Handle `callbackType: 'first'` callback (streaming URL available)
  - [x] 6.3 Handle `callbackType: 'complete'` callback (all URLs available)
  - [x] 6.4 Update variant entity with `streamAudioUrl` when first callback arrives
  - [x] 6.5 Set `streamAvailableAt` timestamp when stream URL is added
  - [x] 6.6 Update variant entity with `audioUrl` when complete callback arrives
  - [x] 6.7 Set `downloadAvailableAt` timestamp when download URL is added
  - [x] 6.8 Update `src/components/VariantSelector.tsx` to show progressive loading states
  - [x] 6.9 Add disabled play button state when streamAudioUrl is null
  - [x] 6.10 Enable play button when streamAudioUrl becomes available (via InstantDB subscription)
  - [x] 6.11 Add download button that appears when audioUrl is available
  - [x] 6.12 Add status indicator text: "Laden...", "Klaar om af te spelen", "Download beschikbaar"
  - [ ] 6.13 Test: Verify stream URL enables playback within 30-40 seconds (ready for testing)

- [ ] 7.0 Add Polling Fallback Mechanism
  - [ ] 7.1 Add `startPollingForLyrics()` function in studio page for lyrics tasks
  - [ ] 7.2 Add `startPollingForMusic()` function in studio page for music tasks
  - [ ] 7.3 Implement 10-second delay before starting music polling (wait for callback first)
  - [ ] 7.4 Poll Suno `/api/v1/generate/record-info?task_id={taskId}` every 5 seconds
  - [ ] 7.5 Parse polling response for `stream_audio_url` and `audio_url`
  - [ ] 7.6 Update InstantDB with URLs when found via polling
  - [ ] 7.7 Stop polling when status is 'complete' or 'SUCCESS'
  - [ ] 7.8 Implement 120-second timeout with user-friendly error message
  - [ ] 7.9 Clear polling interval when component unmounts or callback arrives
  - [ ] 7.10 Add polling state indicator in UI ("Controleren op updates...")
  - [ ] 7.11 Test: Disable callbacks and verify polling works as fallback

### Phase 3: Advanced Controls & Refinement

- [ ] 8.0 Build Advanced Controls Panel
  - [ ] 8.1 Create `src/components/AdvancedControlsPanel.tsx` component
  - [ ] 8.2 Add toggle switch "Geavanceerde Opties" (default: off)
  - [ ] 8.3 Add Vocal Gender radio buttons (m / f / neutral)
  - [ ] 8.4 Add Style Weight range slider (0-100, default from template)
  - [ ] 8.5 Add Weirdness Constraint range slider (0-100, default from template)
  - [ ] 8.6 Add Audio Weight range slider (0-100, default from template)
  - [ ] 8.7 Add Negative Tags textarea input
  - [ ] 8.8 Add Model dropdown (V4, V4_5, V4_5PLUS, V5, default from template)
  - [ ] 8.9 Add Dutch tooltips for each parameter (using title attribute or custom tooltip component)
  - [ ] 8.10 Create `advancedSettings` state in studio page
  - [ ] 8.11 Initialize advanced settings with template defaults
  - [ ] 8.12 Update advanced settings when user changes values
  - [ ] 8.13 Merge advanced settings with template config before music generation
  - [ ] 8.14 Add "Reset naar Template" button to restore template defaults
  - [ ] 8.15 Style panel with collapsible animation (expand/collapse smoothly)

- [ ] 9.0 Implement Lyrics Refinement with Suno
  - [ ] 9.1 Update `src/app/api/suno/lyrics/route.ts` to accept `previousLyrics` and `feedback` parameters
  - [ ] 9.2 Build refinement prompt: original context + previous lyrics + user feedback
  - [ ] 9.3 Add instruction to Suno: "Verbeter de vorige lyrics op basis van deze feedback: {feedback}"
  - [ ] 9.4 Update `handleRefineLyrics()` in studio page to call Suno lyrics API
  - [ ] 9.5 Replace previous lyrics with refined version in UI
  - [ ] 9.6 Create new lyric version in InstantDB (use existing lyricVersions system)
  - [ ] 9.7 Show loading state during refinement ("Lyrics worden verfijnd...")
  - [ ] 9.8 Add refinement count tracking (for analytics)
  - [ ] 9.9 Test: Refine lyrics → verify new version uses feedback → verify version saved

- [ ] 10.0 Add "Verras Me" Template Mode
  - [ ] 10.1 Ensure "Verras Me" template has minimal Suno constraints (style: '', tags: 'love song')
  - [ ] 10.2 Set high `weirdnessConstraint` (0.8) for max creativity
  - [ ] 10.3 Add special handling in lyrics prompt builder for surprise mode
  - [ ] 10.4 Use more open-ended prompts when surprise template is selected
  - [ ] 10.5 Skip template-specific style guidance in surprise mode
  - [ ] 10.6 Add analytics tracking when surprise mode is used
  - [ ] 10.7 Test: Select "Verras Me" → generate → verify varied, unpredictable results

### Phase 4: Karaoke Mode & Error Handling

- [ ] 11.0 Implement Timestamped Lyrics (Karaoke Mode)
  - [ ] 11.1 Create `src/app/api/suno/lyrics-timestamped/route.ts` POST endpoint
  - [ ] 11.2 Accept `taskId` and `audioId` parameters
  - [ ] 11.3 Call Suno `/api/v1/lyrics/timestamped` endpoint
  - [ ] 11.4 Parse response for lyrics array with `text`, `start`, `end` timestamps
  - [ ] 11.5 Return timestamped lyrics to client
  - [ ] 11.6 Create `src/components/KaraokeLyrics.tsx` component
  - [ ] 11.7 Accept `timestampedLyrics` array and `currentTime` (from audio player) as props
  - [ ] 11.8 Highlight current lyric line based on audio position
  - [ ] 11.9 Implement auto-scroll to keep current line visible
  - [ ] 11.10 Add smooth transition animations for line highlighting
  - [ ] 11.11 Update `MusicPlayer` component to expose `currentTime` state
  - [ ] 11.12 Add "Karaoke Modus" toggle in LyricsPanel
  - [ ] 11.13 Fetch timestamped lyrics when karaoke mode is enabled
  - [ ] 11.14 Handle fallback when timestamps not available (show static lyrics)
  - [ ] 11.15 Test: Play music → enable karaoke → verify sync within 500ms accuracy

- [ ] 12.0 Build Comprehensive Error Handling System
  - [ ] 12.1 Create `src/lib/utils/errorMessages.ts` with Dutch error translations
  - [ ] 12.2 Map Suno error codes to user-friendly messages (see PRD Appendix C)
  - [ ] 12.3 Create `translateSunoError()` utility function
  - [ ] 12.4 Create `src/components/ErrorModal.tsx` component
  - [ ] 12.5 Add error message display with icon
  - [ ] 12.6 Add "Probeer Opnieuw" button
  - [ ] 12.7 Add "Pas Lyrics Aan" button (triggers refinement flow)
  - [ ] 12.8 Add "Terug naar Chat" button (returns to gathering phase)
  - [ ] 12.9 Add `generationError` state to studio page
  - [ ] 12.10 Wrap all Suno API calls with try-catch and set error state
  - [ ] 12.11 Handle rate limiting (429) with retry-after countdown
  - [ ] 12.12 Handle timeout errors (120s polling) with continue/cancel options
  - [ ] 12.13 Handle network errors with automatic retry (max 3x, exponential backoff)
  - [ ] 12.14 Update all API routes to return standardized error format
  - [ ] 12.15 Test all error scenarios: API error, timeout, rate limit, network failure

- [ ] 13.0 Add Analytics Tracking
  - [ ] 13.1 Create `src/lib/analytics/events.ts` with event definitions
  - [ ] 13.2 Define analytics event constants (TEMPLATE_SELECTED, LYRICS_GENERATION_STARTED, etc.)
  - [ ] 13.3 Create `trackEvent()` utility function (wrapper around analytics provider)
  - [ ] 13.4 Track template selection event with template ID and name
  - [ ] 13.5 Track lyrics generation start event with conversation rounds and readiness score
  - [ ] 13.6 Track lyrics generation completed event with duration and lyrics length
  - [ ] 13.7 Track lyrics refinement event with refinement number and feedback length
  - [ ] 13.8 Track music generation start event with template ID and advanced controls flag
  - [ ] 13.9 Track music generation first playback event (**PRIMARY METRIC**: time to first playback)
  - [ ] 13.10 Track music generation completed event with total duration and variants count
  - [ ] 13.11 Track variant selection event with variant index and stream played flag
  - [ ] 13.12 Track advanced controls enabled event
  - [ ] 13.13 Track karaoke mode enabled event
  - [ ] 13.14 Track error encountered event with error type, stage, and recovery action
  - [ ] 13.15 Add console logging for all events in development mode

### Phase 5: Testing & Optimization

- [ ] 14.0 Write Comprehensive Test Suite
  - [ ] 14.1 Create `src/templates/music-templates.test.ts` for template validation
  - [ ] 14.2 Test all templates have required fields (name, description, sunoConfig, etc.)
  - [ ] 14.3 Test template Suno config has valid parameter ranges (styleWeight 0-1, etc.)
  - [ ] 14.4 Create `src/lib/utils/sunoLyricsPrompt.test.ts` for prompt builder
  - [ ] 14.5 Test prompt includes all context elements (memories, emotions, traits)
  - [ ] 14.6 Test prompt formatting with different template configs
  - [ ] 14.7 Test surprise mode generates different prompt structure
  - [ ] 14.8 Create `src/lib/utils/errorMessages.test.ts` for error translations
  - [ ] 14.9 Test all Suno error codes map to Dutch messages
  - [ ] 14.10 Test fallback message for unknown error codes
  - [ ] 14.11 Create `src/components/TemplateSelector.test.tsx` for UI component
  - [ ] 14.12 Test template selection updates state correctly
  - [ ] 14.13 Test audio preview play/pause functionality
  - [ ] 14.14 Create `src/components/KaraokeLyrics.test.tsx` for karaoke component
  - [ ] 14.15 Test lyric highlighting based on current time
  - [ ] 14.16 Test auto-scroll behavior
  - [ ] 14.17 Write E2E test for happy path: Template select → Chat → Lyrics → Generate → Play
  - [ ] 14.18 Write E2E test for error recovery: Force error → Retry → Success

- [ ] 15.0 Performance Optimization
  - [ ] 15.1 Run Lighthouse audit on studio page
  - [ ] 15.2 Optimize template preview audio files (compress to ~200KB each)
  - [ ] 15.3 Add lazy loading for AdvancedControlsPanel (only load when toggled)
  - [ ] 15.4 Add lazy loading for KaraokeLyrics component (only load when enabled)
  - [ ] 15.5 Optimize InstantDB queries to only subscribe to active song
  - [ ] 15.6 Use React.memo() for TemplateCard to prevent unnecessary re-renders
  - [ ] 15.7 Debounce advanced control sliders (wait 300ms before updating state)
  - [ ] 15.8 Preload template preview audio on hover (for faster playback)
  - [ ] 15.9 Add service worker caching for template assets (preview audio, images)
  - [ ] 15.10 Optimize image assets with Next.js Image component
  - [ ] 15.11 Verify streaming URL playback starts within 45 seconds (95% success rate)
  - [ ] 15.12 Monitor InstantDB subscription update latency (<1 second)
  - [ ] 15.13 Test page load time (<3 seconds on 3G network)
  - [ ] 15.14 Check for memory leaks during extended use (30+ minutes session)

- [ ] 16.0 Documentation & Deployment Prep
  - [ ] 16.1 Create user-facing guide: "Hoe gebruik je de Studio" (in Dutch)
  - [ ] 16.2 Document each template's style and when to use it
  - [ ] 16.3 Create advanced controls explanation guide (what each parameter does)
  - [ ] 16.4 Create troubleshooting guide for common errors
  - [ ] 16.5 Create developer documentation for template creation process
  - [ ] 16.6 Document Suno API integration architecture (flow diagrams)
  - [ ] 16.7 Document callback vs polling strategy decisions
  - [ ] 16.8 Document InstantDB schema relationships (entity diagram)
  - [ ] 16.9 Add inline code comments for complex state transitions
  - [ ] 16.10 Add comments for progressive loading state machine logic
  - [ ] 16.11 Update README.md with new environment variables (if any)
  - [ ] 16.12 Create deployment checklist (schema push, env vars, asset upload)
  - [ ] 16.13 Prepare rollout plan: Alpha (dev team) → Beta (50 users) → Production
  - [ ] 16.14 Set up monitoring for primary success metric (time to first playback)
  - [ ] 16.15 Create runbook for common production issues and fixes

---

**Status:** ✅ All tasks generated with detailed sub-tasks

**Total Tasks:** 16 parent tasks, 243 sub-tasks

**Estimated Timeline:** 5 weeks (per PRD implementation phases)

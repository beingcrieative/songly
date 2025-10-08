# PRD-0003: Suno Music Generation Integration for Studio Page

## Introduction/Overview

This feature integrates Suno AI music generation into the `/studio` page, allowing users to convert their AI-generated lyrics into professional music tracks. After the two-agent conversation system generates personalized lyrics, users can click a "Genereer Muziek" button to trigger music composition via the Suno API. The system will display an elegant multi-stage progress animation with musical notes, then present the generated track with album art and streaming playback capabilities.

**Problem Solved:** Currently, the `/studio` page generates high-quality personalized lyrics but has no way to convert them into actual music. Users want to hear their love song come to life, not just read the lyrics.

**Goal:** Seamlessly integrate Suno music generation into the studio workflow, providing visual feedback during generation and an elegant playback experience once complete.

## Goals

1. Add "Genereer Muziek" button to studio page after lyrics generation
2. Implement multi-stage progress animation showing generation phases
3. Display generated music with streaming player, album art, and download capability
4. Handle both success and failure cases gracefully
5. Support Suno's 2-variant generation system with user preview/selection
6. Save generated songs to InstantDB linked to conversations
7. Provide options to regenerate with different styles or refine lyrics further

## User Stories

1. **As a user**, I want to click "Genereer Muziek" after seeing my generated lyrics, so that I can hear my personalized love song.

2. **As a user**, I want to see engaging progress animations during music generation, so that I know the system is working and approximately how long it will take.

3. **As a user**, I want to preview both generated variants before choosing my favorite, so that I can pick the version that sounds best.

4. **As a user**, I want to play the generated music with album art visible, so that I have a complete, professional-looking music experience.

5. **As a user**, I want to download my song or refine the lyrics and regenerate, so that I have flexibility in the creative process.

6. **As a user**, if generation fails, I want clear options to retry or refine my lyrics, so that I'm not stuck with a broken experience.

## Functional Requirements

### FR1: Button Integration
1.1. Add "Genereer Muziek" button to LyricsPanel component
1.2. Button must appear alongside "Verfijn lyrics" button (both visible simultaneously)
1.3. Button must be disabled while music is generating
1.4. Button must display loading state: "Muziek genereren..." when clicked
1.5. Button styling must match existing design system (similar to "Verfijn lyrics")

### FR2: Music Generation Trigger
2.1. Clicking "Genereer Muziek" must call `/api/suno` POST endpoint
2.2. Payload must include: `{ songId, title, lyrics, musicStyle, model: "V4" }`
2.3. System must create a new `songs` entity in InstantDB with status: "generating"
2.4. System must link the song to the current conversation
2.5. System must extract music style from `latestLyrics.style` field
2.6. System must use conversation title as song title

### FR3: Progress Animation - Multi-Stage
3.1. Display animated stage indicators when generation starts
3.2. **Stage 1 (0-20s):** "🎵 Melodie wordt gemaakt..." with floating musical notes
3.3. **Stage 2 (20-40s):** "🎤 Vocals worden toegevoegd..." with microphone icon pulse
3.4. **Stage 3 (40-60s):** "✨ Laatste details..." with sparkle animation
3.5. Progress animation must replace the lyrics panel content temporarily
3.6. Must show estimated time remaining (e.g., "Nog ongeveer 45 seconden...")
3.7. Must include animated musical notes floating across the screen
3.8. Animation must be smooth (60fps) and non-jarring

### FR4: Status Checking (Hybrid Approach)
4.1. **Primary:** Set up Suno webhook callback at `/api/suno/callback?songId={id}`
4.2. **Fallback:** If no callback received within 10s, start polling `/api/suno?taskId={id}` every 5s
4.3. Polling must stop after callback is received
4.4. Maximum polling duration: 120 seconds (2 minutes)
4.5. Must update `songs` entity status based on Suno response
4.6. Must store `taskId` in songs entity for status tracking

### FR5: Variant Preview System
5.1. When generation completes, display "Kies je favoriete versie" modal
5.2. Show both variants with mini-players: "Versie 1" and "Versie 2"
5.3. Each variant must have: play button, waveform preview, duration display
5.4. User can play/pause each variant to compare
5.5. Include "Selecteer deze versie" button under each variant
5.6. Once selected, proceed to full player view (FR6)
5.7. Store selected variant ID in songs entity

### FR6: Music Player Display
6.1. Expand right panel (LyricsPanel) to show both lyrics + player
6.2. Player must display at top of expanded panel
6.3. Player must include:
   - Large album art (square, rounded corners)
   - Play/Pause button (large, centered)
   - Progress bar with current time / total duration
   - Track title above player
6.4. Lyrics must remain visible below player (scrollable if needed)
6.5. Player must use Suno's `streamAudioUrl` for streaming playback
6.6. Album art must use Suno's `imageUrl` field
6.7. Player controls must be styled to match design system

### FR7: Download Functionality
7.1. Add "Download MP3" button below player
7.2. Download must use `audioUrl` field (full quality)
7.3. Downloaded file must be named: `{song-title}-liefdesliedje.mp3`
7.4. Must trigger browser download (no external redirect)

### FR8: Error Handling & Retry
8.1. If Suno API returns error, display error message in Dutch
8.2. Show user-friendly message: "Er ging iets mis met het genereren van je muziek"
8.3. Provide two action buttons:
   - "Probeer opnieuw" - retry with same lyrics/style
   - "Pas lyrics aan" - return to lyrics refinement
8.4. Log detailed error to console for debugging
8.5. Update songs entity status to "failed" with errorMessage field
8.6. If callback never arrives and polling times out, show timeout error

### FR9: Database Storage
9.1. Create `songs` entity with fields: `id`, `title`, `lyrics`, `musicStyle`, `status`, `sunoTaskId`, `audioUrl`, `streamAudioUrl`, `imageUrl`, `durationSeconds`, `createdAt`
9.2. Link song to conversation: `song.conversation = conversationId`
9.3. Link song to user: `song.user = userId`
9.4. Create `sunoVariants` entities for both generated tracks
9.5. Link variants to song: `variant.song = songId`
9.6. Store selected variant ID in song entity

### FR10: Post-Generation Options
10.1. After playback starts, show three action buttons:
   - "Download MP3" (see FR7)
   - "Deel je liedje" - generate shareable link (future feature placeholder)
   - "Maak nieuwe versie" - regenerate with different style or refined lyrics
10.2. "Maak nieuwe versie" must show options:
   - "Andere muziekstijl" - input field to change style, regenerate
   - "Verfijn lyrics eerst" - return to refinement, then regenerate
10.3. All options must preserve conversation history

## Non-Goals (Out of Scope)

1. **Creating instrumental-only or vocal-only versions** - These are advanced Suno features that can be added later
2. **Lyrics sync/karaoke mode** - Timestamped lyrics require additional Suno API integration
3. **Social sharing with embedded player** - Shareable links will be a separate feature
4. **Music editing/remixing** - Post-generation editing is beyond MVP scope
5. **Multiple music styles in one generation** - User must regenerate to try different styles
6. **Real-time collaboration** - Only one user can generate music per conversation
7. **Payment integration** - Assume Suno API credits are pre-configured

## Design Considerations

### Progress Animation Design
- **Stage Indicators:** Horizontal timeline with 3 nodes (inactive gray → active purple → complete green)
- **Musical Notes:** SVG animated notes (♪ ♫ ♬) floating from bottom-left to top-right with fade-in/fade-out
- **Background:** Subtle gradient overlay (purple/pink) during generation
- **Font:** Match existing Liefdesliedje Studio typography
- **Timing:** Smooth CSS transitions (0.3s ease) between stages

### Variant Selection Modal
- **Layout:** Side-by-side cards (50/50 split on desktop, stacked on mobile)
- **Card Style:** Rounded border, hover effect (subtle shadow), purple accent on selected
- **Waveform:** Simple animated bars (5-7 bars) simulating audio visualization
- **Play Button:** Large circular button (60px) with play/pause icon

### Music Player Design
- **Album Art:** 320x320px square, rounded corners (12px), subtle drop shadow
- **Play Button:** Overlaid on album art, 80px diameter, white with 50% opacity background
- **Progress Bar:** Full width, 8px height, purple fill, gray background, draggable seek
- **Time Display:** `MM:SS / MM:SS` format, small gray text below progress bar
- **Action Buttons:** Secondary style (outlined), evenly spaced below player

### Expanded Panel Layout
```
┌─────────────────────────────────────┐
│  🎵 Jouw Lach Geeft Hoop           │
│  intimate acoustic ballad...        │
├─────────────────────────────────────┤
│         [ALBUM ART 320x320]         │
│              ▶ PLAY                 │
│  ────────●─────────────── 1:23/3:45 │
│                                     │
│  [Download MP3] [Deel] [Nieuwe ver.]│
├─────────────────────────────────────┤
│  📝 Lyrics (scrollable)             │
│  [Couplet 1]                        │
│  Die eerste keer dat ik je zag...   │
│  ...                                │
└─────────────────────────────────────┘
```

## Technical Considerations

### Existing Code References
- **Suno Integration Example:** `/src/app/api/suno/route.ts` (POST and GET endpoints already exist)
- **Callback Handler:** `/src/app/api/suno/callback/route.ts` (webhook receiver implemented)
- **Music Player Component:** Check `/src/app/page.tsx` for existing player implementation to reuse
- **Songs Entity:** Already defined in `instant.schema.ts` with all required fields

### Dependencies
- **InstantDB:** Use existing `db` client from `/src/lib/db.ts` for client-side queries
- **Admin SDK:** Use `getAdminDb()` from `/src/lib/adminDb.ts` for server-side song creation
- **Suno API:** Endpoint `https://api.sunoapi.com/api/v1/gateway/generate` (POST) and `/query` (GET)
- **Environment Variables:** `SUNO_API_KEY`, `SUNO_CALLBACK_URL` must be configured

### State Management
- Add state to `/src/app/studio/page.tsx`:
  - `isGeneratingMusic: boolean` - tracks generation status
  - `generationStage: 1 | 2 | 3` - current progress stage
  - `currentSong: Song | null` - generated song data
  - `showVariantSelector: boolean` - variant selection modal visibility
  - `selectedVariantId: string | null` - user's chosen variant

### API Flow
1. User clicks "Genereer Muziek"
2. Frontend creates song entity (status: "generating") via InstantDB
3. Frontend calls `/api/suno` POST with songId, title, lyrics, musicStyle
4. Backend calls Suno API, receives `taskId`, stores in song entity
5. Backend returns `{ taskId, status: "generating" }` to frontend
6. Frontend starts progress animation and hybrid status checking:
   - Registers callback listener via InstantDB query on songs entity
   - After 10s, starts polling `/api/suno?taskId={id}` every 5s
7. Suno webhook calls `/api/suno/callback?songId={id}` when complete
8. Callback updates song entity with `audioUrl`, `streamAudioUrl`, `imageUrl`, status: "ready"
9. Frontend detects update via InstantDB subscription, stops polling
10. Frontend shows variant selector modal with both tracks
11. User selects variant, frontend shows full player

### Performance Considerations
- **Audio Streaming:** Use `<audio>` element with `streamAudioUrl` for faster playback start
- **Progress Animation:** Use CSS animations (GPU-accelerated) instead of JS setInterval
- **Polling Optimization:** Use exponential backoff if generation takes longer (5s → 7s → 10s intervals)
- **Image Loading:** Preload album art while generation is in progress using `imageUrl` from callback

### Error Scenarios
- **Suno API down:** Show "Service tijdelijk niet beschikbaar" with retry button
- **Rate limit (429):** Show "Momenteel veel vraag, probeer over 1 minuut opnieuw"
- **Invalid credentials:** Log error, show generic "Er ging iets mis" to user
- **Timeout (120s):** Show "Generatie duurt langer dan verwacht" with options to keep waiting or cancel
- **Callback never arrives:** Polling will catch final status after timeout

## Success Metrics

1. **Generation Success Rate:** >95% of music generation requests complete successfully
2. **User Satisfaction:** >90% of users select a variant (don't abandon at selection stage)
3. **Time to Playback:** Average time from click to playback start <75 seconds
4. **Error Recovery:** >80% of users retry after error (don't abandon)
5. **Regeneration Rate:** 20-30% of users create multiple versions (indicates engagement)
6. **Download Rate:** >60% of users download their generated song

## Open Questions

1. **Webhook Reliability:** Should we implement a webhook health check before relying on callbacks?
2. **Concurrent Generations:** What happens if user clicks "Genereer Muziek" twice rapidly? Should we prevent or queue?
3. **Storage Limits:** Should we limit number of songs per user/conversation to manage database size?
4. **Style Override:** Should users be able to manually edit music style before generation, or always use AI-suggested style?
5. **Variant Storage:** Should we store both variants' audio URLs, or only the selected one?
6. **Progress Timing:** Should stage transitions be time-based (20s/40s/60s) or triggered by actual Suno progress events?
7. **Mobile Experience:** Should variant selection be swipe-based on mobile instead of side-by-side cards?
8. **Analytics:** Should we track which variant users prefer (1 vs 2) to improve future generations?

---

## Implementation Notes for Developer

### Phase 1: Core Generation (Must Have)
- FR1: Button integration
- FR2: API trigger
- FR3: Progress animation
- FR4: Hybrid status checking
- FR6: Basic player (play/pause/progress only)
- FR8: Error handling
- FR9: Database storage

### Phase 2: Enhanced UX (Should Have)
- FR5: Variant preview system
- FR7: Download functionality
- FR10: Post-generation options

### Phase 3: Polish (Nice to Have)
- Refined animations
- Mobile-optimized layouts
- Advanced error recovery

### Key Files to Modify
1. `/src/components/LyricsPanel.tsx` - Add "Genereer Muziek" button, expand for player
2. `/src/app/studio/page.tsx` - Add state management and generation logic
3. `/src/app/api/suno/route.ts` - Verify existing implementation matches requirements
4. `/src/app/api/suno/callback/route.ts` - Ensure proper song entity updates
5. `/src/instant.schema.ts` - Verify songs/sunoVariants entities have all fields

### Testing Checklist
- [ ] Button appears after lyrics generation
- [ ] Progress animation displays all 3 stages
- [ ] Callback updates song entity correctly
- [ ] Polling starts after 10s if no callback
- [ ] Variant selector shows both tracks
- [ ] Music player streams audio correctly
- [ ] Download button triggers MP3 download
- [ ] Error messages display in Dutch
- [ ] Retry button regenerates music
- [ ] Songs linked to conversation in database

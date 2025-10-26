# Tasks: PRD-0014 Async Background Generation with Push Notifications

## Relevant Files

### Schema & Database
- `src/instant.schema.ts` - Add new fields to songs entity for generation tracking
- `src/instant.perms.ts` - Update permissions for new fields
- `scripts/migrate-async-generation.ts` - Data migration script for existing songs
- `scripts/migrate-async-generation.test.ts` - Tests for migration script

### Backend: Callback Handlers
- `src/app/api/suno/lyrics/callback/route.ts` - Enhance for status-based flow and push notifications
- `src/app/api/suno/callback/route.ts` - Enhance music callback for status updates
- `src/app/api/suno/lyrics/route.ts` - Update GET endpoint to check new status fields
- `src/app/api/suno/route.ts` - Update music generation to use new status flow

### Backend: Push Notifications
- `src/app/api/push/send/route.ts` - **NEW** Server-side push delivery endpoint
- `src/lib/push.ts` - Update with send notification helper
- `public/sw.js` - Enhance service worker with better notification handling
- `src/components/pwa/ServiceWorkerRegister.tsx` - Update registration logic

### Frontend: Library UI
- `src/app/library/page.tsx` - Add real-time status tracking and action buttons
- `src/app/library/components/SongCard.tsx` - Update with status badges
- `src/components/SongStatusBadge.tsx` - **NEW** Status badge component
- `src/components/SongStatusBadge.test.tsx` - **NEW** Tests for status badge
- `src/components/GenerationToast.tsx` - **NEW** Toast notification component
- `src/components/GenerationToast.test.tsx` - **NEW** Tests for toast
- `src/lib/library/queries.ts` - Update queries for new status filtering

### Frontend: Generation Flow
- `src/app/studio/StudioClient.tsx` - Remove polling, add async initiation
- `src/components/LyricsGenerationProgress.tsx` - **DEPRECATE** (to be removed)
- `src/components/MusicGenerationProgress.tsx` - **DEPRECATE** (to be removed)

### Types & Utilities
- `src/types/generation.ts` - **NEW** TypeScript types for GenerationProgress
- `src/lib/utils/generationStatus.ts` - **NEW** Status helper functions
- `src/lib/utils/generationStatus.test.ts` - **NEW** Tests for status helpers

### Configuration
- `.env.example` - Add VAPID keys and feature flag
- `.env.production` - Add VAPID keys (manual step)
- `next.config.js` - Update if needed for service worker

### Notes

- Feature flag `NEXT_PUBLIC_ENABLE_ASYNC_GENERATION` controls rollout
- VAPID keys generated once: `npx web-push generate-vapid-keys`
- Migration script runs before feature flag enabled
- All callbacks must be idempotent (safe to run multiple times)
- Database transactions ensure data integrity

---

## Tasks

### Phase 1: Database Schema & Core Infrastructure

- [x] **1.0 Update Database Schema for Async Generation Tracking**
  - [x] 1.1 Add `generationProgress` field to `songs` entity (type: `string`, optional)
    - JSON structure: `{ lyricsTaskId, lyricsStartedAt, lyricsCompletedAt, lyricsError, lyricsRetryCount, musicTaskId, musicStartedAt, musicCompletedAt, musicError, musicRetryCount, rawCallback }`
    - File: `src/instant.schema.ts`
  - [x] 1.2 Update `songs.status` field values to include new states
    - Add: `"pending"`, `"generating_lyrics"`, `"lyrics_ready"`, `"generating_music"` (in addition to existing `"ready"`, `"failed"`, `"complete"`)
    - Ensure field is indexed for efficient filtering
    - File: `src/instant.schema.ts`
  - [x] 1.3 Add `lyricsVariants` field to `songs` entity (type: `string`, optional)
    - JSON structure: `[{ text: string, variantIndex: number, selected: boolean }, ...]`
    - Replaces storing variants in `conversations` entity
    - File: `src/instant.schema.ts`
  - [x] 1.4 Add `notificationsSent` field to `songs` entity (type: `string`, optional)
    - JSON array: `["lyrics_ready", "music_ready"]`
    - Prevents duplicate notifications
    - File: `src/instant.schema.ts`
  - [x] 1.5 Add `lastViewedAt` field to `songs` entity (type: `number`, indexed, optional)
    - Timestamp for "Recently Viewed" sorting in Library
    - Updates when user opens song details
    - File: `src/instant.schema.ts`
  - [x] 1.6 Create TypeScript types for new schema structures
    - Create `src/types/generation.ts` with interfaces: `GenerationProgress`, `LyricVariant`, `SongStatus`
    - Export type guards and validators
  - [x] 1.7 Push schema changes to InstantDB
    - Run: `npx instant-cli push`
    - Commit both `instant.schema.ts` and `instant.perms.ts`
  - [x] 1.8 Update permissions in `instant.perms.ts` for new fields
    - Server-only fields: `generationProgress`, `lyricsVariants`, `notificationsSent` (added to bind list)
    - Client-updatable field: `lastViewedAt` (NOT in bind list)

---

### Phase 2: Backend Callback & Notification System

- [x] **2.0 Enhance Suno Callback Handlers for Status-Based Flow**
  - [x] 2.1 Update lyrics callback handler (`/api/suno/lyrics/callback`)
    - [x] 2.1.1 Add idempotency check using `taskId`
      - Query for song with matching `generationProgress.lyricsTaskId`
      - If `status === "lyrics_ready"` and `lyricsCompletedAt` exists, return early
      - Log: "Lyrics already processed for taskId: ..."
    - [x] 2.1.2 Extract and validate lyrics variants from callback payload
      - Parse `payload.data.data` array for variant texts
      - Validate: must have at least 2 non-empty variants
      - If validation fails, set status to `"failed"` with error message
    - [x] 2.1.3 Update song with lyrics data
      - Set `status: "lyrics_ready"`
      - Store variants in `lyricsVariants` field as JSON
      - Update `generationProgress.lyricsCompletedAt: Date.now()`
      - Store raw callback in `generationProgress.rawCallback` for debugging
      - Use InstantDB transaction for atomic update
    - [x] 2.1.4 Call push notification helper
      - Import `sendLyricsReadyNotification` from `src/lib/push.ts`
      - Call with: `{ userId: song.userId, songId: song.id }`
      - Don't await - fire and forget (notifications are best-effort)
    - [x] 2.1.5 Add comprehensive error logging
      - Log all callback attempts with timestamps
      - Log validation failures with payload preview
      - Log database update success/failure
    - [x] 2.1.6 Return 200 OK for all cases (prevent Suno retries)
      - Even on errors, return success to prevent infinite retries
      - Errors are logged for debugging
  - [x] 2.2 Update music callback handler (`/api/suno/callback`)
    - [x] 2.2.1 Add idempotency check using `taskId`
      - Query for song with matching `generationProgress.musicTaskId`
      - If `status === "ready"` and `musicCompletedAt` exists, return early
    - [x] 2.2.2 Validate track data from callback
      - Ensure at least one variant has valid `audioUrl` or `streamAudioUrl`
      - If validation fails, set status to `"failed"`
    - [x] 2.2.3 Update song and create variant entities
      - Set `status: "ready"`
      - Update `generationProgress.musicCompletedAt: Date.now()`
      - Create `sunoVariants` entities for each track (existing pattern)
      - Store raw callback in `generationProgress.rawCallback`
    - [x] 2.2.4 Call push notification helper
      - Call: `sendMusicReadyNotification(userId, songId)`
    - [x] 2.2.5 Add comprehensive logging
    - [x] 2.2.6 Return 200 OK for all cases
  - [x] 2.3 Update lyrics polling endpoint (`/api/suno/lyrics` GET)
    - [x] 2.3.1 Check database first for song status
      - Query song by `lyricsTaskId` field (indexed)
      - If `status === "lyrics_ready"`, return variants from `lyricsVariants` field
      - If `status === "failed"`, return error from `errorMessage` field
    - [x] 2.3.2 Keep existing Suno API fallback for backward compatibility
      - Only poll Suno API if database has no result
      - This supports transition period before full migration
      - Falls back to conversations entity for legacy support
  - [ ] 2.4 Add error handling for callback failures
    - [ ] 2.4.1 If callback payload indicates failure (status: FAILED)
      - Set song `status: "failed"`
      - Store error message in `generationProgress.[lyrics|music]Error`
      - Do NOT send push notification
    - [ ] 2.4.2 Add retry logic for database write failures
      - Retry up to 3 times with exponential backoff (1s, 2s, 4s)
      - Log each retry attempt
      - If all retries fail, log critical error

- [x] **3.0 Implement Push Notification Delivery System**
  - [x] 3.1 Generate VAPID keys for Web Push API
    - [x] 3.1.1 Run: `npx web-push generate-vapid-keys`
    - [x] 3.1.2 Add to `.env.example`:
      ```
      VAPID_PUBLIC_KEY=<public-key>
      VAPID_PRIVATE_KEY=<private-key>
      VAPID_SUBJECT=mailto:your-email@example.com
      ```
    - [x] 3.1.3 Add to production environment variables (manual Vercel step - documented)
    - [x] 3.1.4 Document in `CLAUDE.md` how to regenerate if needed
  - [ ] 3.2 Create `/api/push/send` endpoint
    - [ ] 3.2.1 Create new route file: `src/app/api/push/send/route.ts`
    - [ ] 3.2.2 Implement POST handler with payload validation
      - Accept: `{ userId: string, songId: string, type: 'lyrics_ready' | 'music_ready' }`
      - Validate all required fields are present
      - Return 400 if validation fails
    - [ ] 3.2.3 Query user's push subscriptions from database
      - Query: `push_subscriptions` where `user.id === userId`
      - Handle case where user has no subscriptions (graceful skip)
    - [ ] 3.2.4 Check if notification already sent
      - Query song's `notificationsSent` field
      - If `type` already in array, skip sending (idempotency)
    - [ ] 3.2.5 Build notification payload based on type
      - **Lyrics Ready**:
        - Title: "Your love song lyrics are ready! 💕"
        - Body: "Choose between 2 beautiful versions"
        - Icon: App logo URL
        - Tag: `lyrics-${songId}`
        - Data: `{ type: 'lyrics_ready', songId, url: '/library?highlight=${songId}' }`
      - **Music Ready**:
        - Title: "Your love song is ready! 🎵"
        - Body: "Tap to listen to your personalized song"
        - Icon: Song cover image URL (or app logo)
        - Tag: `music-${songId}`
        - Data: `{ type: 'music_ready', songId, url: '/library?highlight=${songId}' }`
    - [ ] 3.2.6 Send push notification using `web-push` library
      - Import: `import webPush from 'web-push'`
      - Set VAPID details: `webPush.setVapidDetails(subject, publicKey, privateKey)`
      - Send to each subscription: `webPush.sendNotification(subscription, payload)`
      - Handle expired subscriptions (410 Gone) - remove from database
      - Log successful sends and failures
    - [ ] 3.2.7 Update song's `notificationsSent` array
      - Append notification type to array
      - Prevents duplicate notifications for same event
    - [ ] 3.2.8 Return success response
      - Return: `{ ok: true, sent: number, failed: number }`
    - [ ] 3.2.9 Add comprehensive error handling and logging
      - Catch and log all errors without failing entire request
      - Individual subscription failures don't affect others
  - [ ] 3.3 Create helper function in `src/lib/push.ts`
    - [ ] 3.3.1 Export `sendPushNotification(params)` function
      - Wrapper around `/api/push/send` endpoint
      - Can be called from callback handlers
      - Fire-and-forget pattern (don't await)
    - [ ] 3.3.2 Add JSDoc documentation with examples
  - [ ] 3.4 Enhance service worker (`public/sw.js`)
    - [ ] 3.4.1 Improve `push` event handler
      - Parse `event.data.json()` with error handling
      - Extract notification options from payload
      - Show notification with proper icon, badge, vibration
      - Add notification actions: [{ action: 'view', title: 'View Song' }]
    - [ ] 3.4.2 Improve `notificationclick` event handler
      - Close notification on click
      - Extract deep link URL from notification data
      - Focus existing window if app already open
      - Open new window to deep link URL if not open
      - Handle action button clicks (view vs dismiss)
    - [ ] 3.4.3 Add notification close/dismiss handler
      - Track dismissals for analytics (optional)
    - [ ] 3.4.4 Cache notification icons and badges
      - Pre-cache app logo and badge in service worker install
      - Ensures notifications work offline
  - [ ] 3.5 Update `ServiceWorkerRegister` component
    - [ ] 3.5.1 Add permission request logic
      - After first successful song creation, show permission prompt
      - Use `Notification.requestPermission()` API
      - Store permission status in localStorage: `push_permission_status`
    - [ ] 3.5.2 Handle permission states
      - `granted`: Subscribe user to push
      - `denied`: Show in-app message, don't ask again
      - `default`: Show prompt with clear benefits
    - [ ] 3.5.3 Add "Enable Notifications" banner (if denied/default)
      - Show in Library when user has generating songs
      - Dismissible banner explaining benefits
      - Button to re-request permission

---

### Phase 3: Frontend UI & Real-time Updates

- [ ] **4.0 Create Library UI with Real-time Status Tracking**
  - [ ] 4.1 Create `SongStatusBadge` component
    - [ ] 4.1.1 Create new component file: `src/components/SongStatusBadge.tsx`
    - [ ] 4.1.2 Implement badge rendering for each status
      - `"generating_lyrics"` → Animated spinner + "Generating lyrics..."
      - `"lyrics_ready"` → Pink badge + "Ready to review"
      - `"generating_music"` → Animated spinner + "Generating music..."
      - `"ready"` → Green badge + "Ready to play"
      - `"failed"` → Red badge + "Failed"
      - `"complete"` → No badge (default state)
    - [ ] 4.1.3 Add CSS animations for generating states
      - Spinning icon animation
      - Pulsing effect for "ready" states
    - [ ] 4.1.4 Make badges responsive (mobile vs desktop)
    - [ ] 4.1.5 Add accessibility attributes (aria-label, role)
    - [ ] 4.1.6 Create test file: `src/components/SongStatusBadge.test.tsx`
      - Test each status renders correct text/color
      - Test animations are applied
      - Test accessibility
  - [ ] 4.2 Update `SongCard` component with status UI
    - [ ] 4.2.1 Import and render `SongStatusBadge` component
      - Pass song status as prop
      - Position badge in top-right corner
    - [ ] 4.2.2 Add action buttons based on status
      - `"lyrics_ready"`: "Choose Lyrics" button → Opens LyricsCompare
      - `"ready"`: "Play" button → Opens music player
      - `"failed"`: "Retry" button → Triggers retry logic
      - `"generating_*"`: "Cancel" button (optional, see Open Questions)
    - [ ] 4.2.3 Add timestamp display
      - "Generated 5 minutes ago" using relative time
      - Update on interval for real-time feeling
      - Use `date-fns` library for formatting
    - [ ] 4.2.4 Add error message display for failed songs
      - Show error from `generationProgress.lyricsError` or `musicError`
      - Truncate long errors with "Show more" link
    - [ ] 4.2.5 Add loading states for actions
      - Disable buttons while action in progress
      - Show spinner on button
    - [ ] 4.2.6 Update card styling for different states
      - Different border colors for different statuses
      - Highlight "ready" items with subtle glow
  - [ ] 4.3 Update Library page with real-time subscriptions
    - [ ] 4.3.1 Update `useLibrarySongs` query to include new fields
      - Add `generationProgress`, `lyricsVariants`, `notificationsSent`, `lastViewedAt` to query
      - Query will auto-update via InstantDB subscription
    - [ ] 4.3.2 Add status filter for new states
      - Update filter dropdown to include: "Generating", "Ready to Review", "Ready to Play"
      - Map to new status values
    - [ ] 4.3.3 Implement smart sorting
      - Primary: Status priority (lyrics_ready/ready → generating → complete → failed)
      - Secondary: lastViewedAt DESC (most recently viewed first)
      - Tertiary: createdAt DESC
    - [ ] 4.3.4 Add badge counter to Library tab
      - Count songs with `status === "lyrics_ready"` or `status === "ready"`
      - Display count on NavTabs Library icon
      - Update in real-time via subscription
    - [ ] 4.3.5 Implement "highlight" query param
      - If URL has `?highlight=songId`, scroll to and highlight that song
      - Used when user clicks notification deep link
      - Add subtle animation/glow effect
    - [ ] 4.3.6 Add pull-to-refresh on mobile
      - Use `react-pull-to-refresh` library or custom implementation
      - Shows "Checking for updates..." message
      - Force re-query of songs
    - [ ] 4.3.7 Update empty states
      - "No songs yet": "Start creating your first love song"
      - "Only generating": "Your song is being created... Feel free to explore!"
      - "Only failed": "Some songs failed. Tap Retry to try again."
  - [ ] 4.4 Create `GenerationToast` component
    - [ ] 4.4.1 Create new component: `src/components/GenerationToast.tsx`
    - [ ] 4.4.2 Implement toast for "Generation Started"
      - Show: "✨ Generating your love song..."
      - Subtext: "You'll be notified when ready! Feel free to explore the app."
      - Auto-dismiss after 5 seconds
      - Swipeable to dismiss on mobile
    - [ ] 4.4.3 Use toast library (e.g., `react-hot-toast` or `sonner`)
      - Install and configure
      - Add provider to app layout
    - [ ] 4.4.4 Add different toast variants
      - Success: Green with checkmark
      - Info: Blue with info icon
      - Error: Red with error icon
    - [ ] 4.4.5 Create test file: `src/components/GenerationToast.test.tsx`
      - Test toast appears and auto-dismisses
      - Test swipe-to-dismiss
  - [ ] 4.5 Implement "Choose Lyrics" modal from Library
    - [ ] 4.5.1 When "Choose Lyrics" button clicked on `lyrics_ready` song
      - Open LyricsCompare component in modal/drawer
      - Load variants from `song.lyricsVariants` JSON
      - Allow user to select favorite
    - [ ] 4.5.2 On variant selection
      - Update `lyricsVariants` array with `selected: true` on chosen variant
      - Update song `status` to `"generating_music"`
      - Call `/api/suno` to start music generation
      - Close modal and show "Generating music..." toast
    - [ ] 4.5.3 Add "Skip" option
      - Allow user to defer selection
      - Keeps status as `lyrics_ready`
  - [ ] 4.6 Update song detail page for deep linking
    - [ ] 4.6.1 Update `src/app/song/[id]/page.tsx`
      - Handle `lyrics_ready` status: Auto-open LyricsCompare
      - Handle `ready` status: Auto-play music
      - Handle `generating_*` status: Show progress message
      - Handle `failed` status: Show error and retry button

- [ ] **5.0 Migrate Generation Initiation to Async Pattern**
  - [ ] 5.1 Update `StudioClient` lyrics generation flow
    - [ ] 5.1.1 Remove `LyricsGenerationProgress` modal import and usage
      - Delete state: `isGeneratingLyrics`, `lyricsPollingAttempts`
      - Delete function: `pollForLyrics()`
      - Remove modal from JSX
    - [ ] 5.1.2 Update `generateLyrics()` function
      - Create song entity immediately with `status: "generating_lyrics"`
      - Set `generationProgress.lyricsStartedAt: Date.now()`
      - Set `generationProgress.lyricsTaskId: taskId`
      - Call `/api/suno/lyrics` with callback URL (no polling)
      - Show toast: "Generating lyrics... You'll be notified when ready!"
      - Do NOT wait for response - fire and forget
    - [ ] 5.1.3 Add navigation after generation starts
      - Option A: Stay on current page (Studio)
      - Option B: Navigate to Library
      - Decision: Ask user preference or make it configurable
    - [ ] 5.1.4 Update music generation flow similarly
      - Remove `MusicGenerationProgress` modal
      - Remove polling logic
      - Create/update song with `status: "generating_music"`
      - Show toast: "Generating music... You'll be notified when ready!"
  - [ ] 5.2 Create song entity earlier in flow
    - [ ] 5.2.1 Move song creation from "when lyrics ready" to "when conversation completes"
      - Create song entity when transitioning to `generating` phase
      - Store conversation ID, template ID, settings
      - Initial status: `"pending"` until lyrics generation starts
    - [ ] 5.2.2 Link conversation to song
      - Add song to conversation relationship
      - Allows user to see "In Progress" songs in Library
  - [ ] 5.3 Update conversation completion message
    - [ ] 5.3.1 Change final assistant message
      - Old: "Give me a moment while I write your song..."
      - New: "Thanks for sharing! I'm starting to create your song. You'll get a notification when it's ready!"
    - [ ] 5.3.2 Add link to Library in message
      - "You can check progress in your [Library](/library)"
  - [ ] 5.4 Add feature flag for gradual rollout
    - [ ] 5.4.1 Add to `.env.example` and production env:
      ```
      NEXT_PUBLIC_ENABLE_ASYNC_GENERATION=false
      ```
    - [ ] 5.4.2 Wrap new logic in feature flag checks
      - `if (process.env.NEXT_PUBLIC_ENABLE_ASYNC_GENERATION === 'true')`
      - Keep old polling logic as fallback when flag is off
    - [ ] 5.4.3 Document flag in `README.md`

---

### Phase 4: Error Handling & Migration

- [ ] **6.0 Implement Retry Mechanism for Failed Generations**
  - [ ] 6.1 Create retry handler function
    - [ ] 6.1.1 Create `src/lib/utils/generationRetry.ts`
    - [ ] 6.1.2 Implement `retryGeneration(songId, type: 'lyrics' | 'music')`
      - Query song from database
      - Check current retry count from `generationProgress`
      - If retry count >= 5, show "Contact Support" message
      - Otherwise, increment retry count
      - Reset status to appropriate `generating_*` state
      - Clear error message
      - Re-call appropriate Suno API endpoint
      - Return updated song
    - [ ] 6.1.3 Add rate limiting
      - Prevent more than 3 retries per hour per song
      - Store last retry timestamp
    - [ ] 6.1.4 Create test file: `src/lib/utils/generationRetry.test.ts`
  - [ ] 6.2 Connect retry button in Library
    - [ ] 6.2.1 In `SongCard`, when "Retry" button clicked
      - Call `retryGeneration(song.id, type)`
      - Show loading state on button
      - Show toast: "Retrying generation..."
    - [ ] 6.2.2 Update UI optimistically
      - Change status badge to "Generating..." immediately
      - Don't wait for database update
    - [ ] 6.2.3 Handle retry errors
      - If retry fails, show error toast
      - Revert status to "Failed"
  - [ ] 6.3 Implement automatic retry in callbacks
    - [ ] 6.3.1 In callback handlers, detect retryable errors
      - Network timeouts
      - Temporary Suno API errors (5xx)
      - Rate limit errors (429)
    - [ ] 6.3.2 Automatically retry up to 3 times
      - Use exponential backoff: 30s, 2min, 5min
      - Store retry attempts in `generationProgress`
      - Only auto-retry if `retryCount < 3`
    - [ ] 6.3.3 After 3 auto-retries, set status to `"failed"`
      - Requires manual user retry from Library
  - [ ] 6.4 Add analytics for retry tracking
    - [ ] 6.4.1 Track event: `generation_retry_attempted`
      - Properties: `{ type, retryCount, reason }`
    - [ ] 6.4.2 Track event: `generation_retry_success`
    - [ ] 6.4.3 Track event: `generation_retry_failed`

- [ ] **7.0 Create Data Migration Script and Feature Flag System**
  - [ ] 7.1 Create migration script
    - [ ] 7.1.1 Create `scripts/migrate-async-generation.ts`
    - [ ] 7.1.2 Implement migration logic
      - Query all existing songs (paginated, 100 at a time)
      - For each song:
        - If `status` is null or `"ready"` → Set to `"complete"`
        - If `status === "generating"` → Set to `"generating_music"` (assume music)
        - Initialize `generationProgress` with null values
        - Initialize `lyricsVariants` as empty array
        - Initialize `notificationsSent` as empty array
        - Set `lastViewedAt` to `updatedAt` or `createdAt`
      - Use transactions for safety
      - Log progress every 100 songs
    - [ ] 7.1.3 Add dry-run mode
      - Flag: `--dry-run`
      - Logs what would be changed without committing
    - [ ] 7.1.4 Add rollback capability
      - Store original values before update
      - Create rollback script if needed
    - [ ] 7.1.5 Add progress reporting
      - Log: "Migrated 100/500 songs..."
      - Show estimated time remaining
    - [ ] 7.1.6 Create test file: `scripts/migrate-async-generation.test.ts`
      - Test with mock data
      - Verify all statuses are migrated correctly
  - [ ] 7.2 Document migration process
    - [ ] 7.2.1 Create `docs/migration-async-generation.md`
      - Prerequisites
      - Step-by-step instructions
      - Rollback procedure
      - Expected duration
      - Known issues
    - [ ] 7.2.2 Add migration checklist to PRD
  - [ ] 7.3 Create feature flag config
    - [ ] 7.3.1 Update `.env.example`:
      ```bash
      # Async Generation Feature Flag
      NEXT_PUBLIC_ENABLE_ASYNC_GENERATION=false
      ```
    - [ ] 7.3.2 Document flag behavior in `README.md`
      - When `false`: Old polling behavior (default)
      - When `true`: New async + notifications behavior
    - [ ] 7.3.3 Add flag check helper in `src/lib/featureFlags.ts`
      - Export: `isAsyncGenerationEnabled()`
      - Centralize flag checks
  - [ ] 7.4 Create rollout plan document
    - [ ] 7.4.1 Create `docs/rollout-async-generation.md`
    - [ ] 7.4.2 Define phases:
      - **Phase 1**: Deploy with flag OFF, run migration (Week 1)
      - **Phase 2**: Test internally with flag ON (Week 2)
      - **Phase 3**: Enable for 10% of users (A/B test) (Week 3)
      - **Phase 4**: Enable for 50% if metrics good (Week 3)
      - **Phase 5**: Enable for 100% (Week 4)
      - **Phase 6**: Remove old polling code (Week 5)
    - [ ] 7.4.3 Define success criteria for each phase
      - Success rate >= 95%
      - Notification delivery >= 90%
      - No increase in support tickets
      - User satisfaction score >= 4.5/5
    - [ ] 7.4.4 Define rollback triggers
      - Success rate drops below 85%
      - Critical bugs affecting >5% of users
      - Database performance degradation
  - [ ] 7.5 Create monitoring dashboard queries
    - [ ] 7.5.1 Document key metrics to track:
      - Generation success rate by type (lyrics/music)
      - Average generation time
      - Notification delivery rate
      - Retry rate
      - Songs stuck in "generating" state > 5 minutes
    - [ ] 7.5.2 Create database queries for metrics
      - Add to analytics endpoints or admin dashboard
  - [ ] 7.6 Plan backward compatibility removal
    - [ ] 7.6.1 Create issue for Phase 6 cleanup
      - Remove `LyricsGenerationProgress.tsx`
      - Remove `MusicGenerationProgress.tsx`
      - Remove polling functions from StudioClient
      - Remove feature flag checks
      - Remove old status handling
    - [ ] 7.6.2 Schedule cleanup for 2 weeks after 100% rollout
      - Allows time to detect issues and rollback if needed

---

## Implementation Order Recommendation

1. **Start with Phase 1** (Database Schema)
   - Critical foundation, must be stable
   - Test thoroughly before proceeding

2. **Then Phase 2** (Backend Callbacks)
   - Backend can be deployed and tested independently
   - Can coexist with old polling system

3. **Then Phase 3** (Frontend UI)
   - UI changes are visible but non-breaking
   - Can be developed in parallel with Phase 2

4. **Finally Phase 4** (Migration & Rollout)
   - Depends on all previous phases
   - Execute carefully with monitoring

## Testing Strategy

- **Unit Tests**: Each new component and utility function
- **Integration Tests**: Callback handlers with mock Suno responses
- **E2E Tests**: Full flow from conversation → notification → Library
- **Manual Testing**:
  - Test on real mobile device for notifications
  - Test app behavior when closed/minimized
  - Test notification permissions in different states
  - Test retry after various failure scenarios

## Success Criteria

- [ ] All 7 parent tasks completed
- [ ] All tests passing
- [ ] Migration script tested on staging data
- [ ] Feature flag controls behavior correctly
- [ ] Notifications work on Chrome, Safari, Firefox
- [ ] Library updates in real-time without refresh
- [ ] No breaking changes to existing flows
- [ ] Documentation complete

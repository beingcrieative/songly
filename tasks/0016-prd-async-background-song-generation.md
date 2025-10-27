# PRD-0016: Async Background Song Generation

**Status**: Draft
**Created**: 2025-10-27
**Related**: PRD-0015 Task 7.0
**Difficulty**: HIGH

---

## 1. Introduction/Overview

Currently, the Studio interface blocks users during lyrics generation by showing a modal for 30-45 seconds while polling the Suno API. This creates a poor user experience by preventing users from:
- Starting a new conversation while waiting
- Browsing their library
- Performing any other actions in the app

This PRD defines an **async background generation system** where song generation happens entirely in the background, allowing users to immediately continue using the app while their songs are being created.

**The Problem**: Users are forced to wait and watch a progress modal, unable to interact with the app during lyrics and music generation.

**The Solution**: Implement a "fire-and-forget" generation pattern where:
1. Songs are created immediately with a `generating_lyrics` status
2. Users are instantly redirected to the Library
3. Generation happens in the background via webhook callbacks
4. Users can monitor progress through real-time status badges in the Library
5. Users can start new songs while previous ones are still generating

---

## 2. Goals

1. **Eliminate blocking modals**: Remove the 30-45 second `LyricsGenerationProgress` modal that prevents user interaction
2. **Enable concurrent generation**: Allow users to start new songs while others are generating (with tiered limits)
3. **Improve perceived performance**: Users feel the app is faster because they're not waiting
4. **Increase engagement**: Users can create multiple songs in a session without waiting for each to complete
5. **Provide clear status feedback**: Users always know what's happening with their songs through Library status badges
6. **Support tiered access**: Free users limited to 1 concurrent generation, premium users can generate multiple songs simultaneously

---

## 3. User Stories

### Primary User Stories

**US-1: As a free user creating a song**
> I want to click "Generate Lyrics" and immediately move on to other tasks, so that I don't have to wait and watch a progress bar.

**US-2: As a user with multiple song ideas**
> I want to start a second song conversation while my first song is still generating, so that I can capture all my ideas without losing momentum.

**US-3: As a user waiting for generation**
> I want to see clear status indicators in my Library, so that I know when my song is ready to listen to.

**US-4: As a user experiencing a generation failure**
> I want to be notified when something goes wrong and have a clear way to retry, so that I don't lose my song or have to start over.

**US-5: As a premium user**
> I want to generate multiple songs simultaneously without waiting, so that I can maximize my creative output.

### Secondary User Stories

**US-6: As a mobile user**
> I want to close the app and come back later to find my song ready, so that generation doesn't require me to keep the app open.

**US-7: As a user browsing the Library**
> I want to see a notification badge when any of my generating songs are ready, so that I'm immediately aware of completed generations.

**US-8: As a user managing songs**
> I want to cancel or delete a song that's currently generating, so that I can clean up mistakes or change my mind.

---

## 4. Functional Requirements

### 4.1 Studio Flow Changes

**FR-1.1**: When user clicks "Generate Lyrics" in the Studio, the system MUST immediately create a song entity with `status: 'generating_lyrics'` without waiting for the Suno API response.

**FR-1.2**: The system MUST display a success toast notification with message: "Je liedje wordt gegenereerd! ✨" and description: "Je ontvangt een notificatie wanneer de lyrics klaar zijn."

**FR-1.3**: The system MUST redirect the user to `/library?songId=<newSongId>` immediately after creating the song entity (within 500ms of button click).

**FR-1.4**: The system MUST call the Suno lyrics API asynchronously without blocking the UI or waiting for a response.

**FR-1.5**: The system MUST remove all polling logic from the `StudioClient.tsx` component.

**FR-1.6**: The system MUST remove the `LyricsGenerationProgress` modal component from the Studio render flow.

### 4.2 Concurrent Generation Management

**FR-2.1**: The system MUST enforce a concurrent generation limit based on user tier:
- Free users: Maximum 1 song generating at a time
- Premium users: Configurable limit (default: 5 concurrent generations)

**FR-2.2**: The concurrent limit setting MUST be easily configurable via environment variable or code constant (e.g., `MAX_CONCURRENT_GENERATIONS_FREE=1`, `MAX_CONCURRENT_GENERATIONS_PREMIUM=5`).

**FR-2.3**: When a free user attempts to generate lyrics while another song is generating, the system MUST display a friendly toast notification: "Je hebt al een liedje in productie. Wacht tot deze klaar is of upgrade naar Premium voor meerdere gelijktijdige generaties! 🎵"

**FR-2.4**: The system MUST allow users to start a new conversation and chat flow even when at the concurrent generation limit (only the actual generation is blocked).

**FR-2.5**: Premium users MUST NOT see any blocking messages when within their concurrent limit.

### 4.3 Library Status Display

**FR-3.1**: The Library page MUST display real-time status badges for each song:
- `generating_lyrics`: "🔄 Lyrics worden gemaakt..."
- `lyrics_ready`: "📝 Kies variant" (with action button)
- `generating_music`: "🎵 Muziek wordt gemaakt..."
- `ready`: "✅ Klaar om te beluisteren"
- `failed`: "❌ Mislukt - Probeer opnieuw"

**FR-3.2**: Songs with status `generating_lyrics` or `generating_music` MUST be non-interactive except for a cancel/delete action.

**FR-3.3**: Songs with status `lyrics_ready` MUST show a prominent "Pick Variant" button that opens the `LyricsChoiceModal`.

**FR-3.4**: Songs with status `failed` MUST show a "Retry" button that restarts the generation from the last successful point.

### 4.4 Notification System

**FR-4.1**: The Library navigation menu item MUST display a notification badge (red dot or number) when any song has an actionable status (`lyrics_ready`, `ready`, `failed`).

**FR-4.2**: The notification badge count MUST show the total number of songs requiring user action.

**FR-4.3**: Clicking the Library menu item MUST clear the notification badge (mark as viewed).

**FR-4.4**: When a song status changes to `lyrics_ready` or `ready`, the system SHOULD trigger a browser notification (if permissions granted) with the message: "Je liedje '[Song Title]' is klaar! 🎵"

### 4.5 Error Handling and Recovery

**FR-5.1**: If the Suno lyrics API call fails to initiate, the system MUST show an error toast and NOT create the song entity.

**FR-5.2**: If the Suno webhook callback indicates a failure, the system MUST update the song status to `failed` and set `generationProgress.lyricsError` with the error message.

**FR-5.3**: Users MUST be able to click a "Retry" button on failed songs, which restarts the generation process from the beginning.

**FR-5.4**: The system MUST track retry attempts in `generationProgress.lyricsRetryCount` and limit retries to a maximum of 3 attempts.

**FR-5.5**: After 3 failed retry attempts, the system MUST show a persistent error state with a "Contact Support" message.

**FR-5.6**: If a user closes the browser during generation, the generation MUST continue in the background via the webhook system.

### 4.6 Song Management

**FR-6.1**: Users MUST be able to delete a song with any status (`generating_lyrics`, `lyrics_ready`, `generating_music`, `ready`, `failed`) from the Library.

**FR-6.2**: Deleting a generating song MUST remove it from the database but NOT cancel the Suno API request (webhook callback will handle gracefully if song is missing).

**FR-6.3**: Users MUST be able to cancel a generating song, which sets its status to `cancelled` and stops tracking.

### 4.7 Data Structure

**FR-7.1**: The song entity MUST include a `generationProgress` JSON field with the following structure:
```typescript
{
  lyricsTaskId: string | null,
  lyricsStartedAt: number | null,
  lyricsCompletedAt: number | null,
  lyricsError: string | null,
  lyricsRetryCount: number,
  musicTaskId: string | null,
  musicStartedAt: number | null,
  musicCompletedAt: number | null,
  musicError: string | null,
  musicRetryCount: number,
  rawCallback: any | null
}
```

**FR-7.2**: The system MUST serialize this object using `stringifyGenerationProgress()` before storing in InstantDB.

**FR-7.3**: The system MUST deserialize this object using `parseGenerationProgress()` when reading from InstantDB.

---

## 5. Non-Goals (Out of Scope)

**NG-1**: **Push notifications to mobile devices** - This PRD focuses on in-app notifications only. Web push notifications are handled by existing PWA infrastructure.

**NG-2**: **Pausing/resuming generation** - Once generation starts, it cannot be paused. Users can only cancel/delete.

**NG-3**: **Progress percentage indicators** - We show status stages only, not granular progress percentages (e.g., "30% complete").

**NG-4**: **Email notifications** - Users are not notified via email when songs are ready.

**NG-5**: **Generation queue management UI** - Users cannot reorder or prioritize their generating songs.

**NG-6**: **Cancelling Suno API requests** - Deleting a song doesn't cancel the actual Suno API call, only stops tracking it.

---

## 6. Design Considerations

### 6.1 Toast Notifications

- Use the existing `sonner` toast system (already implemented in PRD-0015 Task 8.0)
- Success toasts: Green with checkmark icon
- Error toasts: Red with error icon
- Info toasts: Blue with info icon
- All toasts should auto-dismiss after 4 seconds

### 6.2 Library Status Badges

- Status badges should be visually distinct (emoji + text)
- Actionable statuses (`lyrics_ready`, `failed`) should have a different color (e.g., amber/orange) to draw attention
- Generating statuses should use a subtle animation (spinner or pulse)
- Status badges should be positioned consistently (top-right of song card)

### 6.3 Notification Badge

- Library menu item should show a red dot for 1 actionable item
- For 2+ items, show the count in a red circle badge
- Badge should be positioned top-right of the menu icon
- Badge should clear when user visits Library page

### 6.4 Retry/Cancel Actions

- Retry button: "🔄 Opnieuw proberen"
- Cancel button: "❌ Annuleren"
- Delete button: "🗑️ Verwijderen"
- All actions should require confirmation for songs with `ready` status

### 6.5 Responsive Considerations

- Mobile: Toast notifications should be full-width at bottom of screen
- Mobile: Status badges should be smaller but still readable
- Mobile: Notification badge should be visible in mobile tab bar
- Desktop: Toast notifications should be positioned top-right

---

## 7. Technical Considerations

### 7.1 Code Changes

**Primary Target**: `src/app/studio/StudioClient.tsx` (2840 lines)

**Functions to Modify**:
1. `generateLyrics()` - Complete rewrite for async flow
2. `handleConversationComplete()` - Remove transition message, call generateLyrics directly
3. **DELETE**: `pollForLyrics()` - Entire function removed
4. **DELETE**: Any `useEffect` that sets up polling
5. **REMOVE**: `LyricsGenerationProgress` component from render

**State to Remove**:
- `isGeneratingLyrics`
- `lyricsPollingAttempts`
- Any `lyricsProgress` related state

**Imports to Add**:
```typescript
import { id } from '@instantdb/react';
import { stringifyGenerationProgress, stringifyExtractedContext } from '@/types/generation';
import { buildSunoLyricsPrompt } from '@/lib/utils/sunoLyricsPrompt';
import { showToast } from '@/lib/toast';
```

**Imports to Remove**:
```typescript
import { LyricsGenerationProgress } from '@/components/LyricsGenerationProgress';
```

### 7.2 New `generateLyrics()` Implementation Pattern

```typescript
const generateLyrics = async () => {
  try {
    // 1. Validate template
    const template = selectedTemplateId
      ? getTemplateById(selectedTemplateId)
      : getTemplateById('romantic-ballad');

    if (!template) throw new Error('No template selected');

    // 2. Build prompt
    const prompt = buildSunoLyricsPrompt(
      extractedContext,
      template,
      songSettings.language || 'Nederlands'
    );

    // 3. Check concurrent limit
    const generatingSongs = await checkConcurrentGenerations(auth.user.id);
    const limit = userTier === 'premium'
      ? MAX_CONCURRENT_PREMIUM
      : MAX_CONCURRENT_FREE;

    if (generatingSongs >= limit) {
      showToast({
        title: 'Generatie limiet bereikt',
        description: userTier === 'free'
          ? 'Upgrade naar Premium voor meerdere gelijktijdige generaties!'
          : 'Je hebt het maximum aantal gelijktijdige generaties bereikt.',
        variant: 'warning',
      });
      return;
    }

    // 4. Create song entity immediately
    const newSongId = id();
    await db.transact([
      db.tx.songs[newSongId]
        .update({
          title: extractedContext?.occasionType || 'Jouw Liedje',
          status: 'generating_lyrics',
          generationProgress: stringifyGenerationProgress({
            lyricsStartedAt: Date.now(),
            lyricsRetryCount: 0,
            // ... other fields
          }),
          // ... other fields
        })
        .link({ conversation: conversationId, user: auth.user.id }),
    ]);

    // 5. Call Suno API (fire and forget)
    fetch('/api/suno/lyrics', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        callBackUrl: `${getBaseUrl()}/api/suno/lyrics/callback?songId=${newSongId}`,
      }),
    }).catch(error => {
      console.error('Suno lyrics request error:', error);
    });

    // 6. Show success toast
    showToast({
      title: 'Je liedje wordt gegenereerd! ✨',
      description: 'Je ontvangt een notificatie wanneer de lyrics klaar zijn.',
      variant: 'success',
    });

    // 7. Redirect immediately
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

### 7.3 Dependencies

**Existing Infrastructure** (Already Complete):
- ✅ Toast system (`showToast()` from PRD-0015 Task 8.0)
- ✅ Library redesign (PRD-0015 Tasks 1-6)
- ✅ API endpoints for retry/select/view (PRD-0015 Task 6.0)
- ✅ `LyricsChoiceModal` component (PRD-0015 Task 4.0)
- ✅ Database schema with `generationProgress` field (PRD-0015 Tasks 1-3)

**New Requirements**:
- Concurrent generation checking logic
- User tier detection (free vs premium)
- Notification badge component for Library menu
- Helper functions: `getBaseUrl()`, `checkConcurrentGenerations()`

### 7.4 Webhook Callback Updates

**File**: `src/app/api/suno/lyrics/callback/route.ts`

The callback MUST:
1. Update song status to `lyrics_ready` when Suno completes
2. Store the lyrics variants in the database
3. Update `generationProgress.lyricsCompletedAt` timestamp
4. Handle errors by updating status to `failed` and setting `lyricsError`

No changes to the callback logic are required if it already follows this pattern.

### 7.5 InstantDB Queries

The Library page query MUST include:
```typescript
{
  songs: {
    $: {
      where: { 'user.id': userId },
      order: { createdAt: 'desc' }
    }
  }
}
```

Real-time updates will automatically reflect status changes because InstantDB provides reactive queries.

### 7.6 User Tier Detection

Create a helper function to detect user tier:
```typescript
const getUserTier = (user: User): 'free' | 'premium' => {
  // Check user.type or user.subscription field
  return user.type === 'premium' ? 'premium' : 'free';
};
```

**Configuration**:
```typescript
// In config or constants file
export const MAX_CONCURRENT_FREE = 1;
export const MAX_CONCURRENT_PREMIUM = 5; // Configurable
```

---

## 8. Success Metrics

### 8.1 Primary Metrics

**M-1: Reduced perceived wait time**
- **Target**: Reduce average time-to-second-song by 60% (from ~60s to ~24s)
- **Measurement**: Track time from first "Generate Lyrics" click to second song generation start

**M-2: Increased song creation rate**
- **Target**: Increase average songs created per user session by 40%
- **Measurement**: Track songs created per session before/after implementation

**M-3: User satisfaction**
- **Target**: 90% of users rate async flow as "better" or "much better" than modal flow
- **Measurement**: In-app survey after 3 song creations

### 8.2 Secondary Metrics

**M-4: Error recovery rate**
- **Target**: 80% of failed songs successfully retried
- **Measurement**: Track retry button clicks vs. successful completions

**M-5: Library engagement**
- **Target**: 50% increase in Library page visits per session
- **Measurement**: Track /library route visits per user session

**M-6: Concurrent generation usage**
- **Target**: 20% of free users attempt concurrent generation (see upgrade prompt)
- **Measurement**: Track "concurrent limit reached" toast displays

**M-7: Premium conversion**
- **Target**: 5% of users who see concurrent limit message upgrade to premium within 7 days
- **Measurement**: Track upgrade conversions from users who triggered limit warning

### 8.3 Technical Metrics

**M-8: Polling reduction**
- **Target**: Eliminate 100% of client-side polling requests to `/api/suno/lyrics`
- **Measurement**: Monitor API logs for polling patterns

**M-9: Webhook reliability**
- **Target**: 98% of Suno webhook callbacks successfully update song status
- **Measurement**: Track webhook success rate in logs

**M-10: Generation completion time**
- **Target**: Maintain current 30-45 second average completion time (no regression)
- **Measurement**: Track `lyricsCompletedAt - lyricsStartedAt` delta

---

## 9. Open Questions

**Q1**: Should the notification badge persist across sessions (e.g., user closes browser, comes back, sees badge)?
- **Proposed Answer**: Yes - badge should show any actionable songs regardless of when they were created

**Q2**: How should we handle stale generating songs (e.g., stuck in `generating_lyrics` for >5 minutes)?
- **Proposed Answer**: Implement a cleanup job that auto-fails songs stuck in generating state for >10 minutes

**Q3**: Should premium concurrent generation limit be configurable per-user or globally?
- **Proposed Answer**: Global config initially, per-user override in future

**Q4**: What happens if Suno webhook never arrives (network failure, timeout)?
- **Proposed Answer**: Implement fallback polling from a server-side cron job (not client-side) that checks stale songs

**Q5**: Should we show estimated time remaining for generating songs?
- **Proposed Answer**: No - status stage is sufficient. Suno API doesn't provide reliable ETAs

**Q6**: Can users edit song settings (language, vocal gender) while generating?
- **Proposed Answer**: No - settings locked once generation starts. User must cancel and restart

**Q7**: Should the Library automatically scroll to the newly created song?
- **Proposed Answer**: Yes - if `?songId=<id>` query param present, scroll to and highlight that song card

**Q8**: How do we prevent duplicate song creation if user double-clicks "Generate Lyrics"?
- **Proposed Answer**: Disable button after first click, add debounce, check for existing generating song for same conversation

---

## 10. Implementation Phases

### Phase 1: Core Async Flow (High Priority)
- Remove `LyricsGenerationProgress` modal
- Rewrite `generateLyrics()` for async pattern
- Implement immediate redirect to Library
- Verify webhook updates work correctly
- **Estimated Effort**: 6-8 hours

### Phase 2: Concurrent Generation Management (High Priority)
- Implement concurrent limit checking
- Add user tier detection
- Show friendly "upgrade to premium" messages
- Make limits configurable
- **Estimated Effort**: 4-6 hours

### Phase 3: Notification System (Medium Priority)
- Add notification badge to Library menu
- Implement badge count logic
- Add badge clear on page visit
- Optional: Browser push notifications
- **Estimated Effort**: 4-5 hours

### Phase 4: Error Handling (Medium Priority)
- Implement retry logic
- Add retry attempt tracking
- Add "Contact Support" state after 3 failures
- Handle edge cases (stale songs, missing webhooks)
- **Estimated Effort**: 3-4 hours

### Phase 5: Testing & Polish (Required)
- Write unit tests for new logic
- Manual testing across all scenarios
- Mobile testing
- Performance testing
- **Estimated Effort**: 4-6 hours

**Total Estimated Effort**: 21-29 hours

---

## Appendix: Related Files

### Files to Modify
1. `src/app/studio/StudioClient.tsx` - Primary target (2840 lines)
2. `src/app/library/page.tsx` - Add notification badge logic
3. `src/types/generation.ts` - Verify stringify/parse functions exist
4. `src/lib/config.ts` - Add concurrent generation limits

### Files to Reference (No Changes)
1. `src/lib/toast.ts` - Toast utility (already exists)
2. `src/app/api/suno/lyrics/route.ts` - Lyrics API endpoint
3. `src/app/api/suno/lyrics/callback/route.ts` - Webhook handler
4. `src/components/LyricsChoiceModal.tsx` - Modal for variant selection
5. `src/lib/utils/sunoLyricsPrompt.ts` - Prompt builder

### New Files to Create
1. `src/lib/utils/concurrentGenerations.ts` - Helper for checking concurrent limits
2. `src/components/NotificationBadge.tsx` - Badge component for Library menu

---

**End of PRD-0016**

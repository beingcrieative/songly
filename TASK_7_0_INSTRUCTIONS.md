# Task 7.0 Instructions: Update Studio Flow for Async Generation

**For**: AI Coder completing PRD-0015 Task 7.0
**Status**: Pending (80% of PRD complete - Tasks 1-6, 8-10 done)
**Date**: 2025-10-27
**Branch**: `fix/lyrics-variants-storage`
**Difficulty**: HIGH (Complex refactoring of 2840-line component)

---

## 📋 Executive Summary

**Task 7.0** requires refactoring the `StudioClient.tsx` component to remove blocking modals and implement a fully asynchronous generation flow. Instead of showing a modal while lyrics generate, the studio should:

1. ✅ Create the song entity immediately with status `'generating_lyrics'`
2. ✅ Show a toast notification ("Your song is being created...")
3. ✅ Redirect the user to `/library` without waiting for generation to complete
4. ✅ The Library page will show the song with async status updates
5. ✅ Users can retry or cancel generation from the Library

This is a **critical refactoring** because it:
- Removes the 30-45 second blocking modal that prevents user interaction
- Enables concurrent generation (users can create multiple songs without waiting)
- Provides better UX with background progress tracking
- Integrates with the new Library redesign (Tasks 1-6)

**Status of Related Tasks**:
- ✅ Task 8.0 (Toast system) - COMPLETE (sonner installed, showToast() utility exists)
- ✅ Task 6.0 (API endpoints) - COMPLETE (select-lyrics, retry, view endpoints exist)
- ✅ Task 4.0 (UI components) - COMPLETE (LyricsChoiceModal exists)
- ✅ Task 1.0-3.0 (Database) - COMPLETE (schema, queries, sorting done)

---

## 🎯 Core Requirements

### Current Problem
The `StudioClient` component currently:
- Shows `LyricsGenerationProgress` modal (~30-45 seconds)
- **Blocks user interaction** during modal display
- Polls the Suno API waiting for lyrics to complete
- Only redirects AFTER lyrics are ready
- Prevents starting another song generation until current one completes

### Required Solution
Implement async flow where:
- Song created immediately with `status: 'generating_lyrics'`
- User **immediately redirected** to Library
- Generation happens in background (via Suno webhook callback)
- Library shows real-time status updates
- User can start another song while first one generates

### User Flow (NEW)

```
Studio Chat Completed
    ↓
Click "Generate Lyrics"
    ↓
CreateSongEntity(status: 'generating_lyrics') ← NEW
    ↓
CallSunoLyricsAPI(async, don't wait)  ← CHANGE
    ↓
ShowToast("Lyrics generating...")
    ↓
Redirect to Library → /library?songId=<newSongId>  ← NEW
    ↓
Library Page Shows Song Card with:
  - Status badge: "🔄 Generating Lyrics..."
  - No interaction available yet
  - Action Items badge shows count
    ↓
[Background] Suno API completes → Webhook calls /api/suno/lyrics/callback
    ↓
Song status updates to: 'lyrics_ready'
    ↓
Library page shows:
  - Status badge: "📝 Pick Variant" (with action button)
  - User clicks card → LyricsChoiceModal opens
  - User selects variant → Music generation starts automatically
    ↓
Music generation in background
    ↓
Status updates to 'ready'
    ↓
Library shows:
  - Status badge: "✅ Ready to listen"
  - User can play, download, share
```

---

## 🗂️ Files to Modify

### PRIMARY TARGET: `src/app/studio/StudioClient.tsx` (2840 lines)

**Why**: This is the main Studio component containing all generation logic.

**Key Functions to Modify**:
1. `handleConversationComplete()` - Currently shows transition message
2. `generateLyrics()` - Currently polls for lyrics (REMOVE POLLING)
3. `pollForLyrics()` - Entire function should be DELETED
4. `setupLyricsPolling()` - If exists, DELETE
5. Render section with `LyricsGenerationProgress` - REMOVE

**Key State to Remove**:
- `isGeneratingLyrics` (boolean flag)
- `lyricsPollingAttempts` (attempt counter)
- Any `lyricsProgress` related state

**Key Imports to Remove**:
- `LyricsGenerationProgress` component import

### SECONDARY TARGETS

**`src/app/api/suno/lyrics/callback/route.ts`** (Optional)
- Review to ensure status updates work correctly
- Ensure `generationProgress` is updated properly when lyrics ready

**`src/app/api/suno/lyrics/route.ts`** (Optional)
- Review to ensure `taskId` is returned and can be stored

**`src/app/studio/page.tsx`** (Optional)
- Verify no routing changes needed

---

## 📝 Step-by-Step Implementation

### STEP 1: Understand Current Code (1 hour)

**Read these sections of StudioClient.tsx**:

```bash
# Imports (top 50 lines)
grep -n "import.*LyricsGenerationProgress" src/app/studio/StudioClient.tsx

# Find state declarations (around lines 300-350)
grep -n "isGeneratingLyrics\|lyricsPollingAttempts\|lyricsProgress" src/app/studio/StudioClient.tsx

# Find handleConversationComplete (around line 1240)
grep -n "handleConversationComplete\|handleGenerateLyrics" src/app/studio/StudioClient.tsx

# Find pollForLyrics function (around line 1350-1450)
grep -n "pollForLyrics\|setupLyricsPolling" src/app/studio/StudioClient.tsx

# Find LyricsGenerationProgress in render (around line 2800)
grep -n "<LyricsGenerationProgress" src/app/studio/StudioClient.tsx
```

**Questions to Answer**:
- [ ] Where is `isGeneratingLyrics` initialized?
- [ ] What does `handleConversationComplete` currently do?
- [ ] How long is the `pollForLyrics` function?
- [ ] Are there any useEffect hooks watching generation status?
- [ ] How is the modal currently being triggered?

### STEP 2: Remove LyricsGenerationProgress Modal (30 minutes)

**2.1 Remove Import**:
```bash
# Find the import line
grep -n "import.*LyricsGenerationProgress" src/app/studio/StudioClient.tsx

# Remove the entire import statement
```

**2.2 Remove State Variables**:
```bash
# Find these states and remove them:
# - isGeneratingLyrics
# - lyricsPollingAttempts
# - Any other lyrics-related polling state
```

**2.3 Remove from Render**:
```bash
# Find the JSX block that renders LyricsGenerationProgress
# Look for: {showLyricsProgress && <LyricsGenerationProgress ... />}
# Delete the entire conditional block
```

**Acceptance Criteria**:
- [ ] No TypeScript errors about undefined components
- [ ] No console warnings about unused state
- [ ] Build succeeds: `npm run build`
- [ ] No references to `LyricsGenerationProgress` in file

### STEP 3: Understand generateLyrics Current Implementation (30 minutes)

**Find and read the entire function**:
```bash
grep -n "const generateLyrics\|const handleGenerateLyrics" src/app/studio/StudioClient.tsx
```

**Extract these details**:
- Does it create a song entity? Where?
- Does it call `/api/suno/lyrics`? How?
- Does it poll for status? How often?
- Does it show modal/wait before redirecting?
- How does it handle errors?

**Current Pattern** (Approximate):
```typescript
const generateLyrics = async () => {
  try {
    // 1. Build prompt from conversation context
    const prompt = buildPrompt(context);

    // 2. Call Suno API (POSSIBLY WAITS HERE)
    const response = await fetch('/api/suno/lyrics', {
      method: 'POST',
      body: JSON.stringify({ prompt })
    });

    const data = await response.json();

    // 3. PROBLEMATIC: Might poll here waiting for lyrics
    // OR might show modal here

    // 4. Eventually redirects
  } catch (error) {
    // Error handling
  }
};
```

### STEP 4: Rewrite generateLyrics Function (1.5 hours)

**IMPORTANT**: This is the most critical change. Follow this pattern **exactly**:

```typescript
const generateLyrics = async () => {
  try {
    // ============================================
    // STEP A: Get template and validate
    // ============================================
    const template = selectedTemplateId
      ? getTemplateById(selectedTemplateId)
      : getTemplateById('romantic-ballad');

    if (!template) {
      throw new Error('No template selected');
    }

    // ============================================
    // STEP B: Build Suno prompt
    // ============================================
    const prompt = buildSunoLyricsPrompt(
      extractedContext,
      template,
      songSettings.language || 'Nederlands'
    );

    // ============================================
    // STEP C: Create song entity IMMEDIATELY
    // ============================================
    // THIS IS NEW - Create song with 'generating_lyrics' status
    const newSongId = id();

    await db.transact([
      db.tx.songs[newSongId]
        .update({
          title: extractedContext?.occasionType || 'Jouw Liedje',
          status: 'generating_lyrics',
          generationProgress: stringifyGenerationProgress({
            lyricsTaskId: null, // Will be set by callback
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

    // ============================================
    // STEP D: Call Suno API (DON'T WAIT FOR POLLING)
    // ============================================
    // Fire and forget - don't use await
    // Just start the generation, the callback will update the DB
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

    // ============================================
    // STEP E: Show success toast
    // ============================================
    showToast({
      title: 'Je liedje wordt gegenereerd! ✨',
      description: 'Je ontvangt een notificatie wanneer de lyrics klaar zijn.',
      variant: 'success',
    });

    // ============================================
    // STEP F: Redirect to Library IMMEDIATELY
    // ============================================
    // User goes to Library right away - can see song card with status
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

**Key Points**:
- ✅ Create song with `status: 'generating_lyrics'` immediately
- ✅ Call Suno API without awaiting or polling
- ✅ Don't wait for Suno response
- ✅ Show success toast
- ✅ Redirect immediately
- ✅ Error handling shows error toast
- ⚠️ Song will be updated by webhook callback later

**Imports You'll Need**:
```typescript
import { id } from '@instantdb/react';
import { stringifyGenerationProgress } from '@/types/generation';
import { stringifyExtractedContext } from '@/types/generation';
import { buildSunoLyricsPrompt } from '@/lib/utils/sunoLyricsPrompt';
import { showToast } from '@/lib/toast';
```

**Helper Functions to Use**:
- `id()` - Generate unique ID from InstantDB
- `stringifyGenerationProgress()` - Serialize progress object
- `stringifyExtractedContext()` - Serialize context object
- `buildSunoLyricsPrompt()` - Already exists in codebase
- `showToast()` - Already implemented in Task 8.0
- `getBaseUrl()` - Should exist or create it

**If getBaseUrl() doesn't exist, add it**:
```typescript
const getBaseUrl = () => {
  if (typeof window === 'undefined') {
    return process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : 'http://localhost:3000';
  }
  return window.location.origin;
};
```

### STEP 5: Remove pollForLyrics Function (30 minutes)

**Find the entire function**:
```bash
grep -n "const pollForLyrics\|function pollForLyrics" src/app/studio/StudioClient.tsx
```

**Delete**:
- The entire `pollForLyrics` function definition
- Any calls to `pollForLyrics()`
- Any useEffect hooks that set up polling

**Verify No References**:
```bash
grep "pollForLyrics\|setupLyricsPolling" src/app/studio/StudioClient.tsx
# Should return 0 results
```

### STEP 6: Remove setupLyricsPolling useEffect (30 minutes)

**Find any useEffect that starts polling**:
```bash
grep -n "useEffect.*pollForLyrics\|useEffect.*lyricsPolling" src/app/studio/StudioClient.tsx
```

**Delete the entire useEffect block** if it exists.

**Typical pattern to remove**:
```typescript
useEffect(() => {
  if (!isGeneratingLyrics || !taskId) return;

  const interval = setInterval(() => {
    pollForLyrics(taskId);
  }, 5000);

  return () => clearInterval(interval);
}, [isGeneratingLyrics, taskId]);
```

### STEP 7: Update handleConversationComplete (30 minutes)

**Find the function**:
```bash
grep -n "handleConversationComplete" src/app/studio/StudioClient.tsx
```

**Current behavior** (approximate):
```typescript
const handleConversationComplete = async () => {
  // Send transition message: "Geef me een momentje..."
  // Add message to chat
  // Wait a bit
  // Call generateLyrics
}
```

**New behavior**:
```typescript
const handleConversationComplete = async () => {
  // Directly call generateLyrics
  // NO transition message
  // NO waiting
  await generateLyrics();
};
```

**Changes**:
- [ ] Remove any message being added ("Geef me een momentje...")
- [ ] Remove any setTimeout/waiting logic
- [ ] Call `generateLyrics()` directly
- [ ] Keep error handling if present

### STEP 8: Verify Imports and Dependencies (30 minutes)

**Add these imports** (if not already present):

```typescript
import { id } from '@instantdb/react';
import { stringifyGenerationProgress, stringifyExtractedContext } from '@/types/generation';
import { buildSunoLyricsPrompt } from '@/lib/utils/sunoLyricsPrompt';
import { showToast } from '@/lib/toast';
```

**Remove these imports** (if present):

```typescript
// DELETE THIS:
import { LyricsGenerationProgress } from '@/components/LyricsGenerationProgress';
```

**Verify these exist in your codebase**:
- [ ] `src/lib/toast.ts` exists with `showToast()` function
- [ ] `src/types/generation.ts` has stringify functions
- [ ] `src/lib/utils/sunoLyricsPrompt.ts` exists
- [ ] `/api/suno/lyrics/callback` endpoint exists

---

## 🧪 Testing Checklist

After making changes, run through this checklist:

### Type Safety
- [ ] `npx tsc --noEmit` - No TypeScript errors
- [ ] No ESLint warnings
- [ ] All imports resolved

### Build
- [ ] `npm run build` succeeds
- [ ] No webpack errors
- [ ] No runtime errors

### Functionality (Manual Testing)

**Test Scenario 1: Generate Lyrics Async**
- [ ] Open Studio in browser
- [ ] Complete conversation (or use test data)
- [ ] Click "Generate Lyrics" button
- [ ] Verify toast appears: "Je liedje wordt gegenereerd! ✨"
- [ ] Verify redirected to /library immediately
- [ ] Verify song card appears with status badge "🔄 Generating Lyrics..."
- [ ] Open browser DevTools → Network tab
- [ ] Verify NO polling requests to `/api/suno` happening
- [ ] Wait for Suno webhook to complete (30-45 seconds)
- [ ] Verify status badge updates to "📝 Pick Variant"

**Test Scenario 2: Error Handling**
- [ ] (Optional) Mock `/api/suno/lyrics` to fail
- [ ] Click "Generate Lyrics"
- [ ] Verify error toast appears
- [ ] Verify NOT redirected to /library
- [ ] Stay in Studio

**Test Scenario 3: Multiple Concurrent Songs**
- [ ] (Advanced) Generate lyrics for Song A
- [ ] While generating, start new conversation
- [ ] Generate lyrics for Song B
- [ ] Both should generate simultaneously
- [ ] Both should appear in Library with async status
- [ ] Should be able to track both in real-time

**Test Scenario 4: Library Integration**
- [ ] From /library, verify action items badge shows count
- [ ] Click on "📝 Pick Variant" song
- [ ] Verify LyricsChoiceModal opens
- [ ] Select a variant
- [ ] Verify music generation starts
- [ ] Verify status updates to "🎵 Generating Music..."
- [ ] Wait for music generation
- [ ] Verify status updates to "✅ Ready"

**Test Scenario 5: Mobile Testing**
- [ ] Test on mobile device (or mobile emulation)
- [ ] Verify toast shows correctly
- [ ] Verify redirect works
- [ ] Verify Library responsive layout works
- [ ] Verify LyricsChoiceModal responsive on mobile

### Regression Testing
- [ ] Existing Studio features still work (chat, settings, etc.)
- [ ] Can still manually generate music (from existing songs)
- [ ] Can still retry from Library
- [ ] Can still select audio variants
- [ ] No broken UI elements

### Tests
- [ ] `npm run test` - All unit tests pass
- [ ] `npm run test:e2e` - All E2E tests pass (if applicable)

---

## 📊 Acceptance Criteria

A PR will be merged when:

1. ✅ **Code Quality**
   - No TypeScript errors (`tsc --noEmit` passes)
   - No ESLint warnings
   - Clean build (`npm run build` succeeds)

2. ✅ **Functionality**
   - Song created immediately with `status: 'generating_lyrics'`
   - No blocking modal (user immediately redirected)
   - Toast notification shows
   - Library page updated in real-time
   - No polling from Studio component
   - Webhook callback still updates song correctly

3. ✅ **User Experience**
   - Smooth redirect to /library?songId=<id>
   - Status updates visible in real-time on Library page
   - Toast messages clear and helpful
   - No console errors during generation

4. ✅ **Testing**
   - All unit tests pass: `npm test`
   - Manual testing checklist completed
   - Regression: Existing features still work
   - No memory leaks from removed polling

5. ✅ **Documentation**
   - Task 7.0 marked complete in task list
   - Code comments explain async flow
   - Commit message references PR-0015 Task 7.0

---

## 🔍 Debugging Tips

### Issue: "Module not found" errors

**Solution**: Verify all imports exist:
```bash
ls -la src/lib/toast.ts
ls -la src/lib/utils/sunoLyricsPrompt.ts
ls -la src/types/generation.ts
```

### Issue: Toast not showing

**Verify**:
- [ ] `<Toaster />` in layout.tsx
- [ ] `showToast()` called correctly
- [ ] sonner package installed: `npm list sonner`

### Issue: Redirect not happening

**Debug**:
```typescript
// Add console logs
console.log('About to redirect to:', `/library?songId=${newSongId}`);
await router.push(`/library?songId=${newSongId}`);
console.log('Redirect called');
```

**Verify**:
- [ ] Using `useRouter` from `'next/navigation'` (client component)
- [ ] Component is client component (`'use client'`)
- [ ] songId is valid UUID

### Issue: Song not appearing in Library

**Verify**:
- [ ] Song created in InstantDB (check admin console)
- [ ] Status is `'generating_lyrics'`
- [ ] User relationship is set correctly
- [ ] Library query filters match status

**Check Database**:
```bash
# View song in InstantDB console
# https://console.instantdb.com
# Look for song with status: 'generating_lyrics'
```

### Issue: Callback not updating song

**Verify**:
- [ ] Suno webhook being called (check API logs)
- [ ] `/api/suno/lyrics/callback` is working
- [ ] songId in callback URL matches created song
- [ ] Callback is updating `generationProgress` field

---

## 🎯 Summary of Changes

| Area | Change | Why |
|------|--------|-----|
| **Imports** | Remove `LyricsGenerationProgress` | No longer used |
| **State** | Remove `isGeneratingLyrics`, polling state | No polling needed |
| **generateLyrics()** | Complete rewrite | Async flow without blocking |
| **pollForLyrics()** | Delete entire function | Not needed |
| **Polling useEffect** | Delete if exists | Not needed |
| **handleConversationComplete()** | Call generateLyrics directly | Immediate generation |
| **Render** | Remove `<LyricsGenerationProgress>` JSX | Clean up |
| **Flow** | Song → Toast → Redirect → Library | Better UX |

---

## 🚀 Final Steps

Once all changes are complete:

```bash
# 1. Verify build
npm run build

# 2. Run tests
npm test

# 3. Stage changes
git add src/app/studio/StudioClient.tsx [other files]

# 4. Commit with conventional message
git commit -m "feat(studio): implement async generation flow without blocking modals

- Remove LyricsGenerationProgress modal and polling logic
- Create song entity immediately with 'generating_lyrics' status
- Redirect to /library immediately after Suno API call
- Generation happens in background via webhook callback
- Library shows real-time status updates
- Enables concurrent song generation

Completes PRD-0015 Task 7.0"

# 5. Push to branch
git push origin fix/lyrics-variants-storage

# 6. PR will automatically update with new commits
```

---

## 📚 Reference Materials

### Files Mentioned
- `src/app/studio/StudioClient.tsx` - Main file to edit (2840 lines)
- `src/lib/toast.ts` - Toast utility (already created)
- `src/types/generation.ts` - Type definitions
- `src/lib/utils/sunoLyricsPrompt.ts` - Prompt builder
- `/api/suno/lyrics/callback` - Webhook handler
- `src/app/library/page.tsx` - Target redirect page

### Key Functions to Use
- `db.transact()` - Create song entity
- `fetch()` - Call Suno API (don't await)
- `showToast()` - Show notification
- `router.push()` - Redirect to Library
- `buildSunoLyricsPrompt()` - Build prompt
- `stringifyGenerationProgress()` - Serialize progress

### PRD-0015 Task Dependencies
- **Depends On**: Task 4.0 ✅, Task 8.0 ✅
- **Enables**: Tasks 9.0 ✅, 10.0 ✅

---

## 💡 Pro Tips

1. **Break into smaller chunks** - Don't try to do everything at once
2. **Test after each step** - Build after removing modal, before rewriting function
3. **Use git diff** - See exactly what changed: `git diff src/app/studio/StudioClient.tsx`
4. **Check browser console** - Most issues will show errors there
5. **Ask for help** - This is complex; don't hesitate to debug step-by-step
6. **Reference complete songs** - Songs created via Library already have proper flow
7. **Keep version control clean** - Commit frequently with clear messages

---

## ❓ FAQ

**Q: Why not wait for Suno to complete?**
A: Creates better UX - user doesn't wait 30-45 seconds. Generation happens in background.

**Q: What if Suno fails?**
A: Callback will update `status: 'failed'`. Library shows error state. User can retry.

**Q: Can users start multiple songs?**
A: Yes! That's the whole point. Each song generates independently in background.

**Q: What about the transition message?**
A: Remove it. User sees instant redirect which is clearer.

**Q: Do I need to change the callback?**
A: Probably not - just verify it's working. The callback will update the song when ready.

**Q: How long should this take?**
A: 4-6 hours for careful implementation with testing. Less if you're experienced with React/Next.js.

---

**Good luck! This is a significant but important refactoring. Feel free to reference this document throughout the implementation.** 🚀

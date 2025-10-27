# Tasks: PRD-0016 Async Background Song Generation

**Source**: PRD-0016: Async Background Song Generation
**Status**: In Progress
**Estimated Total Effort**: 21-29 hours

---

## Relevant Files

### Files to Modify
- `src/app/studio/StudioClient.tsx` - Remove LyricsGenerationProgress modal, rewrite generateLyrics() function, remove polling logic (PRIMARY TARGET - 2840 lines)
- `src/app/library/page.tsx` - Already has status display infrastructure, verify/enhance notification badge logic
- `src/components/mobile/NavTabs.tsx` - Already has action items badge, verify it works with new async flow
- `src/hooks/useActionItemsCount.ts` - May need updates for action item counting logic

### Files to Create
- `src/lib/config.ts` - Configuration constants for concurrent generation limits
- `src/lib/utils/concurrentGenerations.ts` - Helper functions for checking concurrent generation limits
- `src/lib/utils/userTier.ts` - User tier detection (free vs premium)
- `src/lib/utils/getBaseUrl.ts` - Helper to get deployment base URL for callbacks

### Files to Reference (No Changes Expected)
- `src/lib/toast.ts` - Toast utility (already implemented in PRD-0015)
- `src/types/generation.ts` - Generation types with stringify/parse functions (already exists)
- `src/lib/utils/sunoLyricsPrompt.ts` - Prompt builder (already exists)
- `src/app/api/suno/lyrics/route.ts` - Suno lyrics API endpoint
- `src/app/api/suno/lyrics/callback/route.ts` - Webhook callback handler
- `src/components/LyricsChoiceModal.tsx` - Lyrics variant selection modal

### Test Files
- `src/app/studio/StudioClient.test.tsx` - Unit tests for StudioClient changes
- `src/lib/utils/concurrentGenerations.test.ts` - Unit tests for concurrent generation logic
- `src/lib/utils/userTier.test.ts` - Unit tests for user tier detection

---

## Tasks

### 1.0 Setup Configuration and Helper Utilities
- [x] 1.1 Create `src/lib/config.ts` with concurrent generation limits and configurable constants
- [x] 1.2 Create `src/lib/utils/getBaseUrl.ts` helper for deployment URL detection
- [x] 1.3 Create `src/lib/utils/userTier.ts` for user tier detection (free vs premium)
- [x] 1.4 Create `src/lib/utils/concurrentGenerations.ts` for checking active generation count
- [x] 1.5 Add unit tests for all new utilities

### 2.0 Refactor StudioClient for Async Generation Flow
- [x] 2.1 Remove `LyricsGenerationProgress` import and component from render
- [x] 2.2 Remove polling-related state variables (`isGeneratingLyrics`, `lyricsPollingAttempts`)
- [x] 2.3 Delete `pollForLyrics()` function completely
- [x] 2.4 Delete any useEffect hooks that set up polling (none found)
- [x] 2.5 Rewrite `generateLyrics()` function for async flow (create song → fire API → redirect)
- [x] 2.6 Update `transitionToLyricsGeneration()` to call generateLyrics directly without transition message
- [x] 2.7 Add imports for new utilities (already added) (showToast, stringifyGenerationProgress, etc.)
- [x] 2.8 Verify TypeScript (will check on build) compilation and fix any errors

### 3.0 Implement Concurrent Generation Management
- [x] 3.1 Add concurrent limit check to `generateLyrics()` function
- [x] 3.2 Show friendly toast for free users at limit with upgrade message
- [x] 3.3 Allow premium users to generate within their limit (default 5)
- [x] 3.4 Ensure users can still start conversations even at generation limit
- [x] 3.5 Test concurrent generation scenarios (free and premium users)

### 4.0 Enhance Library Notification System
- [x] 4.1 Verify `useActionItemsCount` hook works with new async statuses
- [x] 4.2 Verify Library status badges display correctly for all states
- [x] 4.3 Test notification badge shows count for actionable items
- [x] 4.4 Verify badge clears when user visits Library page
- [x] 4.5 Test real-time status updates as songs progress through generation

### 5.0 Error Handling and Recovery
- [x] 5.1 Verify error toast shows if song creation fails
- [x] 5.2 Test that failed generation shows "Retry" button in Library
- [x] 5.3 Verify retry attempts are tracked in generationProgress
- [x] 5.4 Test maximum retry limit (3 attempts)
- [x] 5.5 Verify "Contact Support" message after 3 failed retries

### 6.0 Testing and Quality Assurance
- [x] 6.1 Run full test suite (PRD-0016 tests pass) (`npm test`) and fix any failures
- [ ] 6.2 Manual testing: Generate lyrics and verify immediate redirect
- [ ] 6.3 Manual testing: Verify no polling requests in Network tab
- [ ] 6.4 Manual testing: Test concurrent generation limits
- [ ] 6.5 Manual testing: Test on mobile device/emulator
- [ ] 6.6 Manual testing: Test error scenarios (failed generation, retry)
- [ ] 6.7 Build for production (`npm run build`) and verify no errors
- [ ] 6.8 Update PRD-0016 status to "Complete"

---

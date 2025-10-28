# Tasks 0018: Chat UX & Message Recovery Implementation

## Relevant Files

### Core Components
- `src/app/studio/StudioClient.tsx` - Main chat component; requires extensive changes for message loading, non-blocking sends, scroll management, and keyboard viewport handling
- `src/components/ComposerBar.tsx` - Mobile input component; needs loading state indicator visibility
- `src/components/ConversationalStudioLayout.tsx` - Layout wrapper; may need viewport height adjustments
- `src/components/ChatBubble.tsx` - Message display component; no changes expected but review for accessibility

### Hooks & Utilities
- `src/hooks/useKeyboardOpen.ts` - Existing keyboard detection hook; verify functionality and enhance if needed
- `src/lib/utils/scrollHelpers.ts` - **NEW FILE** - Utility functions for scroll detection, sentinel management, and auto-scroll logic
- `src/lib/api/messageApi.ts` - **NEW FILE** (optional) - Centralized message API helpers for desktop and mobile

### API Routes
- `src/app/api/mobile/messages/route.ts` - Existing mobile message API; verify it can fetch all messages with pagination
- `src/app/api/chat/route.ts` - Existing chat route; review for message persistence

### Tests
- `src/app/studio/StudioClient.test.tsx` - **NEW FILE** - Unit tests for message loading, scroll logic, and non-blocking behavior
- `src/lib/utils/scrollHelpers.test.ts` - **NEW FILE** - Unit tests for scroll utility functions
- `tests/e2e/chat-ux.spec.ts` - **NEW FILE** - Playwright E2E tests for mobile keyboard, message loading, and auto-scroll

### Configuration
- `tailwind.config.ts` - May need adjustments for `100svh` support or safe-area-inset utilities

---

## Tasks

### 1.0 Implement Mobile Keyboard Viewport Management (CRITICAL)

Mobile keyboard overlap is the most critical issue preventing users from reading messages. This task ensures the chat container resizes when the keyboard opens and prevents content overlap.

- [x] **1.1 Enhance useKeyboardOpen Hook**
  - Review current `src/hooks/useKeyboardOpen.ts` implementation
  - Verify it correctly detects keyboard open/close on iOS and Android
  - Add optional callbacks for keyboard events (onKeyboardOpen, onKeyboardClose)
  - Test the hook with real devices or Chrome DevTools mobile emulation
  - Document threshold parameter and any limitations
  - *Files: `src/hooks/useKeyboardOpen.ts`*

- [x] **1.2 Modify Chat Container Layout for Keyboard Awareness**
  - Change chat container from fixed/percentage height to `height: 100svh` (small viewport height)
  - Add `paddingBottom` to chat messages container that dynamically increases when keyboard opens
  - Measure composer height using `ResizeObserver` (already exists at line 763)
  - Add extra padding (e.g., 24px) when keyboard is detected
  - Ensure padding prevents keyboard from hiding last visible message
  - *Files: `src/app/studio/StudioClient.tsx` (lines 2229-2240)*

- [x] **1.3 Make Composer Sticky When Keyboard Is Open**
  - Update composer wrapper CSS classes to use `sticky` positioning when `isKeyboardOpen`
  - Set `bottom: 0` and high `z-index` when keyboard is open
  - Ensure input field remains always visible above keyboard
  - Add subtle visual indicator (shadow/border) to distinguish sticky state
  - *Files: `src/app/studio/StudioClient.tsx` (lines 2324-2332)*

- [ ] **1.4 Test Keyboard Viewport Management on Real Devices**
  - Test on iOS Safari with real iPhone or simulator (Xcode)
  - Test on Android Chrome with real device or emulator
  - Test on Chrome DevTools mobile emulation (Pixel 7)
  - Verify last message is visible when keyboard is open
  - Verify input field is not obscured by keyboard
  - Verify scroll is still functional with keyboard open
  - Document any device-specific issues
  - *Testing: Manual QA on iOS and Android*

---

### 2.0 Add Message History Loading with "Load More" Button (HIGH)

Users currently cannot scroll back beyond messages in the current session because messages are never loaded from the database. This task implements persistent message history with pagination.

- [x] **2.1 Create Message Fetching Function**
  - Add helper function `fetchConversationMessages(conversationId, limit, offset)` in `StudioClient.tsx`
  - For mobile: Use `/api/mobile/messages?conversationId=...&limit=30&offset=0`
  - For desktop: Use `db.useQuery()` with pagination or implement custom fetch
  - Handle pagination: track total message count and current offset
  - Return messages in correct chronological order (oldest first for prepending)
  - Add error handling with user-friendly error messages
  - *Files: `src/app/studio/StudioClient.tsx` (new section ~150 lines)*

- [x] **2.2 Load All Messages on Conversation Hydration**
  - In the existing `useEffect` that hydrates conversation (around line 646), after conversation ID is set:
    - Immediately fetch all messages for that conversation
    - Show "Loading messages..." indicator if fetch takes > 1 second
    - Add fetched messages to local `messages` state
    - Store total message count to know when all are loaded
  - For mobile: wait until `hasHydratedConversation` is true before fetching
  - For desktop: fetch immediately after `conversationId` is set
  - Log fetch duration and message count for debugging
  - *Files: `src/app/studio/StudioClient.tsx` (lines 646-752 + new)*

- [x] **2.3 Create "Load More History" UI Button**
  - Add button component that appears at the top of the messages list
  - Button shows: "📜 Meer berichten laden" or similar
  - Disable button while loading, show spinner
  - Hide button when all messages are loaded
  - Add button only if `!allMessagesLoaded && messages.length > 0`
  - Style to match chat bubble design (subtle, not intrusive)
  - *Files: `src/app/studio/StudioClient.tsx` (new button JSX ~30 lines)*

- [x] **2.4 Implement Batch Message Loading**
  - When "Load More History" is clicked, fetch next batch of 30 older messages
  - Prepend fetched messages to beginning of `messages` array
  - Update offset tracker and total message count
  - Update `allMessagesLoaded` flag when offset reaches total count
  - Maintain scroll position: scroll to where the oldest previously-loaded message was
  - *Files: `src/app/studio/StudioClient.tsx` (new onClick handler ~50 lines)*

- [x] **2.5 Preserve Scroll Position When Loading History**
  - Before loading, get the scroll height and current scroll position
  - After prepending new messages, calculate how much height was added
  - Scroll back to the same relative position (old messages + new height)
  - Use `chatContainerRef.current?.scrollTop` to restore position
  - Ensure no jank: use `requestAnimationFrame` for scroll adjustment
  - *Files: `src/app/studio/StudioClient.tsx` (scroll logic ~40 lines)*

- [ ] **2.6 Verify Message API Endpoints**
  - Check `/api/mobile/messages` endpoint can return all messages with pagination
  - Verify message ordering is correct (oldest to newest)
  - Check error responses are handled properly
  - Test with 100+ message conversations
  - *Files: `src/app/api/mobile/messages/route.ts` (review only)*

- [ ] **2.7 Test Message History Loading**
  - Create a test conversation with 50+ messages (or use existing)
  - Scroll to top and click "Load More History" - verify older messages appear
  - Click multiple times - verify pagination works
  - Verify scroll position is preserved
  - Verify button disappears when all messages loaded
  - Test on slow network (Chrome throttling)
  - *Testing: E2E tests + Manual*

---

### 3.0 Implement Non-Blocking Message Sending (HIGH)

Currently, when users send a message, the UI freezes while waiting for the API to respond. This task makes sending non-blocking by showing the user's message immediately.

- [x] **3.1 Refactor handleSendMessage for Non-Blocking Behavior**
  - Extract current `handleSendMessage` logic (line ~948)
  - **NEW FLOW:**
    1. Immediately add user message to local `messages` state
    2. Set `isLoading = true` with a loading indicator
    3. Call API in background (don't await)
    4. On API response: add AI message to state and clear loading
    5. On API error: show error message in chat with "Retry" button
  - User's message should appear in chat within 100ms (before API call)
  - Keep input field focused (don't blur or disable completely)
  - *Files: `src/app/studio/StudioClient.tsx` (refactor ~100 lines)*

- [x] **3.2 Create Loading Indicator Component**
  - Add visual loading indicator (animated dots or spinner) that shows while waiting for AI response
  - Indicator appears as a chat bubble below user's message
  - Options:
    - Option A: Three animated dots (like existing "Schrijven..." indicator at line 2289)
    - Option B: Spinner icon from icon library
    - Option C: Skeleton message bubble
  - Choose based on design consistency
  - Make sure it's visually distinct from actual messages
  - *Files: `src/app/studio/StudioClient.tsx` (new indicator JSX ~20 lines)*

- [x] **3.3 Keep Input Field Enabled During Loading**
  - Modify input field `disabled` prop: don't disable during loading
  - Optionally: show a subtle visual cue that message is sending (e.g., dimmed send button)
  - Allow user to type next message while AI is responding
  - Ensure multiple rapid sends don't cause issues (optional: add slight debounce)
  - *Files: `src/components/ComposerBar.tsx` (check current disabled logic), `src/app/studio/StudioClient.tsx` (check input disabled state)*

- [x] **3.4 Handle API Errors with Retry Option**
  - When API call fails (network error, server error, etc):
    - Keep user's message in the chat
    - Show error message as special chat bubble (e.g., red background)
    - Provide "Retry" button that re-sends the request
    - Log error for debugging
  - Don't remove the user's message on error (preserve it for retry)
  - *Files: `src/app/studio/StudioClient.tsx` (error handling ~40 lines)*

- [ ] **3.5 Test Non-Blocking Message Sending**
  - Send message and verify it appears before AI responds
  - Verify loading indicator appears
  - Wait for AI response and verify it appears below loading indicator
  - Test rapid message sending (multiple sends in quick succession)
  - Test on slow network (throttle to 3G) - verify UI remains responsive
  - Test error handling: send message while API is down, verify error + retry works
  - *Testing: E2E tests + Manual on mobile*

---

### 4.0 Implement Auto-Scroll with Sticky Scroll Behavior (HIGH)

Auto-scroll is essential for notifying users of new AI responses. "Sticky scroll" means we only auto-scroll if the user is already at the bottom, not forcing them when they've scrolled up to read history.

- [x] **4.1 Create Scroll Utility Functions**
  - Create new file `src/lib/utils/scrollHelpers.ts` with utilities:
    - `isNearBottom(container, threshold = 200): boolean` - Check if scroll is within threshold of bottom
    - `scrollToBottom(element, behavior = 'smooth'): void` - Smooth scroll to bottom
    - `scrollToElement(element, behavior = 'smooth'): void` - Scroll to specific element
  - Add JSDoc comments for each function
  - Test utilities independently with unit tests
  - *Files: `src/lib/utils/scrollHelpers.ts` (new, ~80 lines)*

- [x] **4.2 Create Scroll Sentinel Element**
  - Add a hidden `<div ref={bottomRef} />` at the end of messages list (already exists at line 2319)
  - This element marks the "bottom" of the chat for scroll targeting
  - Ensure it's always the last element even when messages update
  - Use it as the target for `scrollIntoView()` calls
  - *Files: `src/app/studio/StudioClient.tsx` (already partially done, verify at line 2319)*

- [x] **4.3 Implement Auto-Scroll on New Messages**
  - Create `useEffect` hook that triggers when `messages.length` changes
  - On each message addition:
    - Call `isNearBottom(chatContainerRef)` to check if user is at bottom
    - If near bottom: call `scrollToBottom(bottomRef, 'smooth')`
    - If not near bottom: do NOT scroll (preserve user's scroll position)
  - Use `requestAnimationFrame` to batch scroll updates
  - Ensure scroll happens AFTER DOM updates
  - *Files: `src/app/studio/StudioClient.tsx` (new useEffect ~40 lines)*

- [x] **4.4 Implement Sticky Scroll (No Force-Scroll When Scrolled Up)**
  - Track whether user has scrolled away from bottom
  - Only trigger auto-scroll if `isNearBottom()` returns true
  - If user manually scrolls up (away from bottom), pause auto-scroll
  - Resume auto-scroll when user scrolls back to near bottom
  - This is the "sticky" behavior - scroll follows user naturally
  - Smooth animations ensure pleasant UX
  - *Files: `src/app/studio/StudioClient.tsx` (logic in existing effect ~20 lines)*

- [x] **4.5 Handle Keyboard Open/Close for Scroll Adjustment**
  - Existing effect at line 795 (`useEffect(() => { ... }, [isKeyboardOpen, composerHeight])`)
  - When keyboard opens/closes, recalculate viewport height
  - If user is near bottom, re-scroll to keep bottom visible
  - Accounts for the fact that viewport height changes when keyboard appears/disappears
  - Use same `isNearBottom` check + `scrollToBottom` pattern
  - *Files: `src/app/studio/StudioClient.tsx` (lines 795-807, enhance existing effect)*

- [ ] **4.6 Test Auto-Scroll Behavior**
  - Send messages and verify automatic scroll to bottom
  - Manually scroll up, send message - verify NO forced scroll
  - Scroll back to bottom area, send message - verify scroll resumes
  - Test keyboard open/close - verify scroll adjusts
  - Test on slow network - verify smooth animation even with delay
  - Test rapid messages - verify scroll catches up correctly
  - *Testing: E2E tests + Manual*

---

### 5.0 Optimize Chat Scroll Performance (HIGH)

With many messages loaded, scroll performance can suffer. This task ensures buttery-smooth scrolling.

- [ ] **5.1 Enable Native Scroll Performance on Mobile**
  - Ensure `WebkitOverflowScrolling: 'touch'` is set on chat container (already at line 2236)
  - Verify it's applied correctly to `chatContainerRef` element
  - This enables hardware-accelerated scrolling on iOS
  - Document why this is important
  - *Files: `src/app/studio/StudioClient.tsx` (lines 2230-2238, verify)*

- [ ] **5.2 Batch Message Updates to Reduce Reflows**
  - When loading history (task 2.4), batch prepend messages to avoid multiple re-renders
  - Use a single `setMessages()` call instead of multiple
  - Group all state updates together before rendering
  - Use React's batching capabilities properly
  - *Files: `src/app/studio/StudioClient.tsx` (message loading logic)*

- [ ] **5.3 Test Scroll Performance with Large Message Lists**
  - Create or use a conversation with 100+ messages
  - Load all messages (use "Load More History" repeatedly)
  - Scroll rapidly up and down
  - Measure frame rate (should be 60fps on modern devices)
  - Check for jank using Chrome DevTools Performance tab
  - Test on mobile device or Chrome mobile emulation
  - Document findings and any performance issues
  - *Testing: Manual performance testing + Chrome DevTools*

- [ ] **5.4 Ensure Smooth Scroll Animations**
  - All scroll animations use `behavior: 'smooth'`
  - Verify smooth scroll doesn't cause jank (60fps)
  - Consider animation duration (300ms recommended)
  - Test on slow devices (e.g., older Android phones)
  - Optimize scroll animation if needed (adjust duration, use transform instead of scroll-top)
  - *Files: `src/lib/utils/scrollHelpers.ts` (scroll function implementations)*

- [ ] **5.5 Add Performance Monitoring (Optional)**
  - Log message loading time and count
  - Log scroll performance metrics
  - Consider using existing analytics system if available
  - Help identify performance bottlenecks for future optimization
  - *Files: `src/app/studio/StudioClient.tsx` (debug logging)*

---

## Testing Strategy

### Unit Tests (`src/app/studio/StudioClient.test.tsx`)
- [ ] Test `isNearBottom()` with various scroll positions
- [ ] Test message loading logic with mocked API
- [ ] Test batch message prepending preserves order
- [ ] Test scroll position restoration after loading
- [ ] Test loading indicator appearance/disappearance

### Integration Tests
- [ ] Test complete flow: open conversation → load messages → scroll → send new message
- [ ] Test error scenarios: API fails, retry works
- [ ] Test edge cases: empty conversation, single message, 1000+ messages

### E2E Tests (`tests/e2e/chat-ux.spec.ts`)
- [ ] **Mobile Chrome (Pixel 7):**
  - [ ] Send message - appears immediately
  - [ ] AI response - auto-scrolls into view
  - [ ] Scroll to top - "Load More History" appears and works
  - [ ] Keyboard opens - content not hidden
  - [ ] Keyboard closes - layout returns to normal

- [ ] **Desktop Chrome:**
  - [ ] Send message - non-blocking behavior works
  - [ ] Rapid sends - no UI freeze
  - [ ] Scroll performance - no jank with 100+ messages

### Manual QA Checklist
- [ ] Test on iOS Safari (iPhone 12+)
- [ ] Test on Android Chrome (physical device)
- [ ] Test on desktop Chrome, Safari, Firefox
- [ ] Test with slow network (3G throttling)
- [ ] Test with dozens of rapid messages
- [ ] Test conversation with 200+ messages
- [ ] Verify no console errors or warnings

---

## Implementation Notes

### Dependencies & Constraints
- No new external packages required
- Uses existing: React hooks, InstantDB/mobile APIs, Tailwind CSS
- `useKeyboardOpen` hook already exists and should be working
- `ResizeObserver` is already used at line 763 for composer height

### Codebase Patterns to Follow
- **CLAUDE.md requirements:** Check `instant-rules.md` for InstantDB patterns
- **Message storage:** Messages are already persisted in InstantDB, just need to fetch them
- **Mobile vs Desktop:** Use existing `isMobile` prop to differentiate API calls
- **Scroll refs:** Pattern already established at lines 755-756, extend for sentinel
- **State management:** Use React state, not external stores

### Potential Challenges & Mitigations
| Challenge | Mitigation |
|-----------|-----------|
| Scroll position lost when loading | Use `scrollHeight` delta to maintain position |
| Keyboard detection unreliable on some devices | Enhance hook with additional heuristics; test on real devices |
| Many messages = slow renders | Batch updates; consider virtualization in future |
| Race conditions with scroll updates | Use `requestAnimationFrame` to ensure DOM is ready |
| API pagination inconsistency | Verify API returns messages in correct order |

### Performance Considerations
- Loading 30 messages at a time balances UX and performance
- `WebkitOverflowScrolling: 'touch'` provides hardware acceleration on iOS
- Avoid layout thrashing: batch DOM reads/writes
- Smooth scroll animation should be 300ms for natural feel

### Accessibility
- Ensure loading indicator has `aria-live="polite"` for screen readers
- Message bubbles use semantic HTML and ARIA labels (already done in ChatBubble)
- Keyboard navigation should work (Enter to send, Tab to focus)
- Ensure color contrast meets WCAG standards

### Documentation & Code Comments
- Add JSDoc comments to new utility functions
- Document scroll behavior and threshold values
- Add inline comments explaining non-obvious logic (e.g., "sticky scroll" behavior)
- Update CLAUDE.md if new patterns are introduced

---

## Rollout & Deployment

### Phased Approach
1. **Phase 1 (Deploy immediately):** Mobile keyboard viewport (1.0) - most critical, lowest risk
2. **Phase 2 (Deploy together):** Message loading (2.0) + Non-blocking sends (3.0) - interdependent
3. **Phase 3 (Deploy together):** Auto-scroll (4.0) + Scroll performance (5.0) - final polish

### Testing Before Merge
- [ ] All unit tests pass (`npm run test`)
- [ ] All E2E tests pass (`npm run test:e2e`)
- [ ] No console errors in Chrome DevTools
- [ ] Manual QA sign-off on mobile and desktop
- [ ] Performance is acceptable (60fps scrolling)

### Rollback Plan
- Each phase can be rolled back independently via git revert
- Feature flags could be added to `CLAUDE.md` if risk is high (low priority)

---

## Future Enhancements

Beyond this PRD's scope, but worth noting:

1. **Virtual scrolling:** For conversations with 1000+ messages
2. **Message reactions & editing:** Once stability is proven
3. **Search within messages:** For long conversations
4. **Message persistence across devices:** Sync across browser sessions
5. **Offline message drafting:** Queue messages when offline


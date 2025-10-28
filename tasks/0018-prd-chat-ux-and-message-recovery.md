# PRD 0018: Chat UX & Message Recovery Improvements

## Introduction/Overview

The chat interface in the Liefdesliedje Studio suffers from critical usability issues that significantly degrade the user experience, especially on mobile devices. Users cannot scroll back through their conversation history beyond what's visible in the current session, the UI freezes while waiting for AI responses, and the auto-scroll behavior is unreliable. Additionally, the on-screen keyboard on mobile devices overlaps critical content, making it difficult or impossible to read recent messages.

This PRD addresses these issues holistically by:
1. Implementing persistent message history recovery
2. Providing non-blocking UI feedback during message sending
3. Improving auto-scroll reliability with multiple scroll triggers
4. Fixing keyboard overlap issues on mobile devices

**Goal:** Create a responsive, smooth chat experience where users can review past conversations, see immediate visual feedback when sending messages, and always have access to recent AI responses even when the mobile keyboard is open.

---

## Goals

1. **Persistent Chat History:** Users can load and view the full conversation history within a session using a "Load History" UI element
2. **Non-Blocking Responsiveness:** When a user sends a message, the message appears immediately in the chat and the UI remains responsive (no freezing)
3. **Reliable Auto-Scroll:** New messages (both user and AI) automatically scroll into view with smooth animation
4. **Mobile Keyboard Safety:** On mobile devices, the on-screen keyboard never overlaps or hides recent chat messages or the input field
5. **Smooth Scroll Performance:** Chat scrolling is buttery smooth with no jank or stuttering, especially when scrolling through many messages

---

## User Stories

### Story 1: Viewing Conversation History
**As a** mobile user who has been chatting with the AI agent
**I want to** scroll up and view all my previous messages in the conversation
**So that** I can review what I've already shared and see the context of the conversation

**Acceptance:**
- When I scroll to the top of the chat, a "Load More History" button appears
- Clicking it fetches and displays older messages
- Once all messages are loaded, the button disappears
- The scroll position is maintained after loading

### Story 2: Sending a Message Without Freezing
**As a** mobile or desktop user
**I want to** see my message appear in the chat immediately after I hit send
**And** see a loading indicator that the AI is responding
**So that** I have immediate visual feedback and don't think the app is broken

**Acceptance:**
- When I type and send a message, it appears in the chat within 100ms (before API responds)
- A visual loading indicator (spinner, dots, or skeleton) appears below my message
- The input field is NOT disabled (or is disabled with very clear indication)
- Once the AI response arrives, it smoothly scrolls into view and the loader disappears

### Story 3: Auto-Scrolling to New Messages
**As a** user
**I want to** automatically see new AI responses appear at the bottom of the screen
**And** have the scroll position smoothly animate to show the latest message
**So that** I don't miss the AI's response and don't have to manually scroll

**Acceptance:**
- When a new message arrives (AI response), the chat automatically scrolls to show it
- If I manually scroll up to read older messages, new messages still arrive but DON'T force scroll (sticky scroll)
- If I scroll back to near the bottom, the auto-scroll resumes
- Scroll animation is smooth (not instant) and feels natural

### Story 4: Using the App While Keyboard Is Open
**As a** mobile user with the on-screen keyboard visible
**I want to** see recent AI messages and my questions
**Without** the keyboard hiding them
**So that** I can read the conversation while typing my response

**Acceptance:**
- The chat container adjusts when the keyboard opens (does not get covered)
- Recent messages are always visible above the keyboard
- The input field stays above the keyboard
- Scrolling works smoothly even with keyboard open

---

## Functional Requirements

### FR-1: Message History Loading
1. When a conversation is loaded (on mount or via URL parameter), fetch all previously stored messages for that conversation from the database
2. Display messages in the correct chronological order (oldest to newest)
3. Implement a "Load More History" button that appears when:
   - User scrolls to the very top of the chat
   - More messages exist in the database that haven't been loaded yet
4. Clicking "Load More History" fetches the next batch of older messages (e.g., 20-30 messages)
5. Once all messages from the database are loaded, the button disappears
6. The scroll position should NOT jump when new messages are loaded above

### FR-2: Non-Blocking Message Sending
1. When the user clicks send (or presses Enter), immediately:
   - Add their message to the local `messages` state and render it in the chat
   - Clear the input field
   - Show a visual loading indicator (e.g., animated spinner, pulsing dots)
   - Keep the input field enabled and focused (for rapid follow-up messages)
2. While the API call is in progress:
   - The chat remains fully interactive (scrollable, readable)
   - The input field remains enabled for the user to type another message if they wish
   - A loading state is visible near the sent message or in the chat footer
3. When the API responds with the AI's message:
   - Display the AI response below the user's message
   - Remove the loading indicator
   - Trigger auto-scroll to the new AI message
4. If the API call fails:
   - Show an error message in the chat (as a special message bubble)
   - Optionally provide a "Retry" button
   - Keep the user's original message in the chat

### FR-3: Auto-Scroll to New Messages
1. Implement a scroll sentinel (a hidden element at the bottom of the chat) that tracks scroll position
2. When a new message is added to the chat:
   - If the user is already near the bottom (within 200px), automatically scroll the sentinel into view with smooth animation
   - If the user is far from the bottom (scrolled up to read history), do NOT force-scroll (sticky scroll behavior)
3. When the on-screen keyboard opens/closes on mobile:
   - Recalculate the chat container height
   - If the user was near the bottom, re-scroll to keep the latest message visible
4. Smooth scroll should use `scrollIntoView({ behavior: 'smooth', block: 'end' })` for consistent, pleasant animations

### FR-4: Mobile Keyboard Viewport Management
1. Detect when the mobile on-screen keyboard is open using the existing `useKeyboardOpen` hook
2. Adjust the chat container's layout to prevent keyboard overlap:
   - Set the chat container to use `height: 100svh` (small viewport height) instead of fixed pixel heights
   - Set the composer (input + send button) to `position: sticky; bottom: 0;` when keyboard is open
   - Add padding or margin to the chat messages to ensure the last message is never hidden behind the keyboard
3. When keyboard opens:
   - The chat container should remain scrollable above the keyboard
   - The input field should remain visible above the keyboard
4. When keyboard closes:
   - The layout should smoothly return to normal
5. Ensure this works correctly on iOS and Android by testing with real devices (or Chrome DevTools mobile emulation)

### FR-5: Scroll Performance Optimization
1. Ensure chat scrolling is smooth and performant:
   - Use `WebkitOverflowScrolling: 'touch'` on mobile for native scrolling performance
   - Batch DOM updates when loading many messages at once
   - Consider virtualizing very long message lists (low priority, can be deferred)
2. Test scroll performance with 100+ messages in the chat
3. Ensure no jank or stuttering when scrolling rapidly

---

## Non-Goals (Out of Scope)

- **Virtual scrolling / infinite scroll optimization:** While not explicitly included, this can be added in a future iteration if performance issues arise with 1000+ messages
- **Message reactions, editing, or deletion:** This feature only focuses on displaying and navigating messages
- **Search/filtering within messages:** Out of scope for this feature
- **Message timestamps or read receipts:** Not required at this stage
- **Offline message queuing:** Messages must be sent online; offline drafts are not in scope
- **Message persistence across browser sessions (desktop):** Only mobile requires persistence; desktop can refresh and lose chat history
- **Export or backup of conversations:** Not included in this scope

---

## Design Considerations

### Mobile-First Approach
- Primary focus is fixing mobile (iOS and Android) user experience
- Desktop improvements are secondary but should be consistent
- Test primarily on mobile Chrome emulation and real iOS/Android devices

### UI Components Affected
- **ChatBubble.tsx:** Will display messages as-is (no changes needed)
- **ComposerBar.tsx:** Input stays enabled during loading; may show a subtle loading indicator
- **StudioClient.tsx (chat pane):** Major changes:
  - Add message loading logic in `useEffect`
  - Add "Load More History" button near top of chat
  - Implement sticky scroll logic
  - Add keyboard-aware viewport height management
  - Improve scroll sentinel implementation
- **ConversationalStudioLayout.tsx:** May need viewport height adjustments for mobile

### Visual Indicators
- **Loading spinner:** When message is being sent, show animated dots or spinner in a chat bubble below user's message
- **Load More Button:** Subtle button at the top of the chat with an icon and text "Cargar más mensajes" (Dutch: "Meer berichten laden")
- **Keyboard indicator:** When keyboard is open, visually distinguish the sticky input area (subtle shadow or border)

---

## Technical Considerations

### Data Loading
- **Mobile vs Desktop:**
  - Mobile API uses session-based authentication (`/api/mobile/messages`)
  - Desktop uses InstantDB queries
  - Ensure both fetch messages correctly on conversation load
- **Message fetching:**
  - On conversation hydration, immediately fetch all messages via the appropriate API
  - If this takes > 2 seconds, show a "Loading messages..." indicator
  - For very large conversations (100+ messages), consider pagination

### State Management
- Keep messages in local React state (`messages` array)
- When loading history, prepend older messages to the top (don't replace)
- Track whether all messages have been loaded to know when to hide the "Load More" button

### Scroll Management
- Use `useRef` for chat container and bottom sentinel element
- Implement a "isNearBottom" helper function to determine scroll position
- Use `requestAnimationFrame` to batch scroll updates
- Track previous message length to trigger scrolls only on new additions

### Keyboard Detection
- Use existing `useKeyboardOpen` hook to detect keyboard state
- Adjust `paddingBottom` on chat container when keyboard is open
- Consider using a `ResizeObserver` on the composer to measure its height and adjust padding dynamically

### Error Handling
- If message loading fails, show a friendly error message and a "Retry" button
- If API call fails when sending a message, show error and allow retry
- Log all errors to console for debugging

### Dependencies
- No new external libraries required
- Uses existing: React hooks, InstantDB/mobile APIs, `useKeyboardOpen` hook

---

## Success Metrics

1. **Message History Retention:** Users can load and view all messages from the current conversation session
2. **UI Responsiveness:** Message sending takes < 100ms to show the user's message in the chat (before API responds)
3. **Scroll Reliability:** 95% of the time, new messages automatically scroll into view when they arrive
4. **Keyboard Safety:** On mobile, the on-screen keyboard never covers the input field or the last 2 visible messages
5. **Smooth Scrolling:** No jank detected when scrolling through 50+ messages on mobile devices
6. **User Satisfaction:** (If possible) Gather feedback from beta testers that the chat feels "responsive and smooth"

---

## Open Questions

1. **Batch size for "Load More":** Should we load 20, 30, or 50 messages per click? Recommendation: 30 to balance performance and user expectations
2. **Load all messages on startup vs on-demand:** Should we auto-load ALL messages when conversation starts, or only load them when user scrolls up? Recommendation: Load on-demand (with Load More button) to avoid slow startup on long conversations
3. **Message list virtualization:** If a conversation gets very long (500+ messages), should we virtualize the list? Recommendation: Defer to future iteration unless performance issues arise
4. **Keyboard duration detection:** How to reliably detect keyboard open/close on both iOS and Android? Recommendation: Use existing `useKeyboardOpen` hook; test on real devices
5. **Sticky scroll threshold:** Should "near bottom" be 200px, 100px, or device-height dependent? Recommendation: Use 200px initially; adjust based on testing
6. **Smooth scroll animation duration:** Should smooth scroll be instant, 300ms, or 500ms? Recommendation: 300ms for natural feel

---

## Implementation Priority / Phases

### Phase 1 (CRITICAL - Mobiel toetsenbord overlap)
- FR-4: Mobile keyboard viewport management
- Ensures content is never hidden by keyboard

### Phase 2 (HIGH - Message recovery & responsiveness)
- FR-1: Message history loading with "Load More" button
- FR-2: Non-blocking message sending
- Ensures users can review past conversations and see immediate feedback

### Phase 3 (HIGH - Scroll improvements)
- FR-3: Auto-scroll to new messages
- FR-5: Scroll performance optimization
- Ensures new messages are always visible and scrolling is smooth

---

## Files to Modify

- **src/app/studio/StudioClient.tsx** (primary - ~80% of changes)
- **src/components/ComposerBar.tsx** (minor - loading state UI)
- **src/components/ChatBubble.tsx** (no changes likely needed)
- **src/components/ConversationalStudioLayout.tsx** (minor - viewport height adjustments)
- **src/hooks/useKeyboardOpen.ts** (verify it works correctly; may need enhancement)

## Testing Plan

### Unit Tests
- Test scroll position detection (`isNearBottom` helper function)
- Test message batching logic when loading history
- Test auto-scroll triggers with different scroll positions

### Integration/E2E Tests (Playwright)
- **Mobile Chrome (Pixel 7):**
  - Send a message and verify it appears immediately
  - Verify AI response scrolls into view within 1 second
  - Scroll to top and click "Load More History" - verify older messages load
  - Open mobile keyboard and verify no content is hidden
  - Close keyboard and verify layout returns to normal
- **Desktop Chrome:**
  - Send a message and verify non-blocking behavior
  - Scroll rapidly through a long conversation (100+ messages)
  - Verify smooth scroll with no stuttering

### Manual Testing Checklist
- [ ] iOS Safari on iPhone 12/13 with mobile keyboard
- [ ] Android Chrome with mobile keyboard
- [ ] Desktop Chrome at 1920x1080
- [ ] Desktop Safari (if applicable)
- [ ] Slow network conditions (test with Chrome throttling)
- [ ] Rapid message sending (spam send button)

---

## Related Documents & Context

- **CLAUDE.md:** Existing architecture and patterns for InstantDB queries, mobile API usage, and component structure
- **Chat API Routes:** `/api/chat`, `/api/mobile/messages`
- **Existing Hooks:** `useKeyboardOpen()` in `src/hooks/`
- **Scroll Utilities:** See `StudioClient.tsx` lines 754-807 for existing scroll management attempts


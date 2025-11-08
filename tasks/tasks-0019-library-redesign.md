# Tasks: Library Page Complete Redesign (PRD-0019)

## Relevant Files

- `src/app/library/page.tsx` - Main library page component (will be refactored)
- `src/app/library/components/DashboardStats.tsx` - New dashboard statistics component
- `src/app/library/components/ActionRequiredSection.tsx` - New action required section component
- `src/app/library/components/RecentlyActiveSection.tsx` - New recently active section component
- `src/app/library/components/SongCard.tsx` - Existing song card (will be enhanced)
- `src/app/library/components/ConversationCard.tsx` - Existing conversation card (will be redesigned)
- `src/app/library/components/ProgressBar.tsx` - New reusable progress bar component
- `src/app/library/components/EmptyState.tsx` - New flexible empty state component
- `src/app/library/components/SectionHeader.tsx` - New consistent section header component
- `src/hooks/useLibraryStats.ts` - New custom hook for dashboard statistics
- `src/hooks/useActionItems.ts` - New custom hook for action items
- `src/hooks/useRecentActivity.ts` - New custom hook for recent activity
- `src/lib/library/queries.ts` - Library data queries (may need updates)
- `src/lib/library/sorting.ts` - Sorting utilities (may need priority sorting updates)
- `src/app/globals.css` - Global styles (gradient system and design tokens)

### Notes

- This is a complete redesign following PRD-0019
- Focus on mobile-first responsive design
- Implement new gradient-based design system
- Ensure all components work in light and dark mode
- Use existing mobile API endpoints for data fetching

## Instructions for Completing Tasks

**IMPORTANT:** As you complete each task, you must check it off in this markdown file by changing `- [ ]` to `- [x]`. This helps track progress and ensures you don't skip any steps.

Example:
- `- [ ] 1.1 Read file` → `- [x] 1.1 Read file` (after completing)

Update the file after completing each sub-task, not just after completing an entire parent task.

## Tasks

- [x] 0.0 Create feature branch
  - [ ] 0.1 Create and checkout a new branch: `git checkout -b feature/library-redesign-prd-0019`
  - [ ] 0.2 Verify you're on the correct branch: `git branch --show-current`

- [x] 1.0 Set up new design system and foundational components
  - [x] 1.1 Read [`src/app/globals.css`](src/app/globals.css:1) to understand current design tokens
  - [x] 1.2 Add new CSS variables for gradient system to `globals.css`:
    - `--gradient-primary: linear-gradient(135deg, #6A11CB 0%, #FF00A5 50%, #f43e47 100%)`
    - `--gradient-card: linear-gradient(135deg, rgba(106, 17, 203, 0.1) 0%, rgba(255, 0, 165, 0.05) 100%)`
    - `--gradient-progress: linear-gradient(90deg, #6A11CB 0%, #FF00A5 100%)`
    - `--color-accent: #FF00A5`
    - `--color-primary: #6A11CB`
    - `--color-secondary: #f43e47`
  - [x] 1.3 Create [`src/app/library/components/ProgressBar.tsx`](src/app/library/components/ProgressBar.tsx:1) component:
    - Accept props: `value` (0-100), `label`, `showPercentage`, `color` (optional)
    - Render horizontal bar with gradient fill
    - Include accessibility attributes (role="progressbar", aria-valuenow, etc.)
  - [x] 1.4 Create [`src/app/library/components/EmptyState.tsx`](src/app/library/components/EmptyState.tsx:1) component:
    - Accept props: `icon`, `title`, `message`, `action` (optional button)
    - Support both emoji and SVG icons
    - Center-aligned layout with proper spacing
  - [x] 1.5 Create [`src/app/library/components/SectionHeader.tsx`](src/app/library/components/SectionHeader.tsx:1) component:
    - Accept props: `title`, `subtitle` (optional), `action` (optional button/link)
    - Use consistent typography (text-2xl font-bold)
    - Include proper spacing (px-4 pb-3 pt-5)

- [x] 2.0 Implement dashboard statistics section
  - [x] 2.1 Read [`src/lib/library/queries.ts`](src/lib/library/queries.ts:1) to understand current data structure
  - [x] 2.2 Create [`src/hooks/useLibraryStats.ts`](src/hooks/useLibraryStats.ts:1) custom hook:
    - Calculate total songs count
    - Calculate total conversations count
    - Calculate generating items count (songs with status `generating_lyrics` or `generating_music`)
    - Return `{ totalSongs, totalConversations, generating, isLoading }`
  - [x] 2.3 Create [`src/app/library/components/DashboardStats.tsx`](src/app/library/components/DashboardStats.tsx:1) component:
    - Render three stat cards in a flex-wrap layout
    - First card: "Total Songs" with count
    - Second card: "Total Conversations" with count
    - Third card: "Generating" with count (highlighted with border and bg color)
    - Use Tailwind classes for responsive grid (flex flex-wrap gap-4)
    - Each card should have: label, large number, appropriate padding
  - [x] 2.4 Add icon support to stat cards (optional Material Icons or emoji)
  - [ ] 2.5 Test that stats update in real-time when items are created/deleted
  - [ ] 2.6 Ensure cards are responsive and work on mobile (min-w-[158px] flex-1)

- [x] 3.0 Implement action required section
  - [x] 3.1 Create [`src/hooks/useActionItems.ts`](src/hooks/useActionItems.ts:1) custom hook:
    - Filter songs with status `lyrics_ready` or `failed`
    - Sort by priority: `lyrics_ready` first, then `failed`
    - Use `updatedAt` for tie-breaking (most recent first)
    - Return `{ actionItems, hasActions, isLoading }`
  - [x] 3.2 Create [`src/app/library/components/ActionRequiredSection.tsx`](src/app/library/components/ActionRequiredSection.tsx:1) component:
    - Use `useActionItems` hook to get filtered items
    - Render [`SectionHeader`](src/app/library/components/SectionHeader.tsx:1) with title "Action Required"
    - If no actions: render [`EmptyState`](src/app/library/components/EmptyState.tsx:1) with celebratory message
    - If actions exist: map through items and render action cards
  - [x] 3.3 Create action card sub-component within `ActionRequiredSection`:
    - Horizontal layout: cover image (left), content (center), button (right)
    - Cover image: 64x64px rounded-lg
    - Display title, status badge, and primary action button
    - Status badge should be uppercase with appropriate color
    - Primary button: "Choose Lyrics" for `lyrics_ready`, "Retry" for `failed`
  - [ ] 3.4 Wire up button actions:
    - "Choose Lyrics" → open lyrics choice modal
    - "Retry" → call retry API endpoint
  - [ ] 3.5 Test empty state displays correctly when no actions
  - [ ] 3.6 Test priority ordering works correctly

- [x] 4.0 Implement recently active section
  - [x] 4.1 Create [`src/hooks/useRecentActivity.ts`](src/hooks/useRecentActivity.ts:1) custom hook:
    - Get most recent 5 items (songs + conversations) sorted by `updatedAt`
    - Filter out items that are in "Action Required" section
    - Return `{ recentItems, isLoading }`
  - [x] 4.2 Create [`src/app/library/components/RecentlyActiveSection.tsx`](src/app/library/components/RecentlyActiveSection.tsx:1) component:
    - Use `useRecentActivity` hook
    - Render [`SectionHeader`](src/app/library/components/SectionHeader.tsx:1) with title "Recently Active"
    - If no recent activity: render motivational [`EmptyState`](src/app/library/components/EmptyState.tsx:1)
    - Map through items and render activity cards
  - [x] 4.3 For conversation activity cards, display:
    - Cover image (64x64px rounded-lg)
    - Title and status label (uppercase)
    - Last 2 messages in compact format with "You:" and "AI:" prefixes
    - [`ProgressBar`](src/app/library/components/ProgressBar.tsx:1) showing readiness score
    - Primary action button ("Continue")
  - [x] 4.4 For song activity cards, display:
    - Cover image
    - Title and status
    - Progress indicator if generating
    - Primary action button based on status
  - [x] 4.5 Style last messages section:
    - Use bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-3
    - Truncate long messages with ellipsis (line-clamp-1)
    - Show role labels with distinct styling
  - [ ] 4.6 Test that recent activity updates when songs/conversations change

- [ ] 5.0 Enhance song cards with progress indicators
  - [ ] 5.1 Read current [`src/app/library/components/SongCard.tsx`](src/app/library/components/SongCard.tsx:1)
  - [ ] 5.2 Add progress indicator for songs with status `generating_lyrics` or `generating_music`:
    - Parse `generationProgress` JSON field
    - Calculate time since generation started
    - Display message like "Tekst genereren sinds [time ago]"
  - [ ] 5.3 Add visual spinner or progress animation for generating states
  - [ ] 5.4 Update card styling to use new gradient system for highlights
  - [ ] 5.5 Ensure rounded corners are consistent (rounded-2xl for cards)
  - [ ] 5.6 Test progress indicators update correctly during polling

- [ ] 6.0 Redesign conversation cards to horizontal layout
  - [ ] 6.1 Read current [`src/app/library/components/ConversationCard.tsx`](src/app/library/components/ConversationCard.tsx:1)
  - [ ] 6.2 Refactor layout from vertical to horizontal:
    - Left: Cover image (64x64px rounded-lg shrink-0)
    - Middle: Title, status, messages (flex-1)
    - Right: Action arrow or button
  - [ ] 6.3 Add last 2 messages preview section:
    - Display in bg-slate-100/50 dark:bg-slate-800/50 rounded-lg p-3
    - Format: "Jij: [message]" and "AI: [message]"
    - Truncate long messages appropriately
  - [ ] 6.4 Add [`ProgressBar`](src/app/library/components/ProgressBar.tsx:1) component showing readiness score:
    - Label: "Readiness Score" or "Progress"
    - Display percentage value
    - Use gradient fill for bar
  - [ ] 6.5 Update status label styling to uppercase and colored
  - [ ] 6.6 Test horizontal layout is responsive on mobile devices

- [ ] 7.0 Implement responsive design and accessibility
  - [ ] 7.1 Update [`src/app/library/page.tsx`](src/app/library/page.tsx:1) main layout:
    - Implement mobile-first breakpoints
    - Mobile: single column (default)
    - Tablet: two column grid (md:grid-cols-2)
    - Desktop: three column grid (lg:grid-cols-3)
  - [ ] 7.2 Ensure all touch targets are minimum 44x44px on mobile
  - [ ] 7.3 Add ARIA labels to all interactive elements:
    - Buttons should have descriptive labels
    - Progress bars need role="progressbar" and aria attributes
    - Status badges need aria-label
  - [ ] 7.4 Implement keyboard navigation:
    - Tab order should be logical
    - Focus indicators should be visible
    - Enter/Space should activate buttons
  - [ ] 7.5 Test with screen reader (if available)
  - [ ] 7.6 Verify color contrast ratios meet WCAG AA standards
  - [ ] 7.7 Test dark mode for all new components
  - [ ] 7.8 Verify bottom navigation remains sticky and accessible

- [ ] 8.0 Add performance optimizations
  - [ ] 8.1 Add `React.memo` to card components:
    - Memoize [`SongCard`](src/app/library/components/SongCard.tsx:1)
    - Memoize [`ConversationCard`](src/app/library/components/ConversationCard.tsx:1)
    - Memoize new stat cards
  - [ ] 8.2 Implement `useMemo` for expensive computations:
    - Priority sorting in action items
    - Recent activity filtering
    - Stats calculations
  - [ ] 8.3 Add `useCallback` for event handlers passed as props
  - [ ] 8.4 Verify polling rate is appropriate (10 seconds as per PRD)
  - [ ] 8.5 Test with React DevTools Profiler to identify bottlenecks
  - [ ] 8.6 Add smooth animations using Tailwind transitions:
    - Progress bar fills (transition-all duration-500)
    - Card hover effects (hover:shadow-md)
    - Button state changes
  - [ ] 8.7 Implement skeleton states for loading:
    - Show placeholder stat cards while loading
    - Show placeholder cards in sections while fetching

- [ ] 9.0 Testing, documentation, and final polish
  - [ ] 9.1 Test all new components individually:
    - Dashboard stats with various counts
    - Action required with 0, 1, and multiple items
    - Recently active with various states
    - Progress bars with different values
    - Empty states with different messages
  - [ ] 9.2 Test complete page flow:
    - Fresh user (no songs/conversations)
    - User with only songs
    - User with only conversations
    - User with both songs and conversations
    - User with items requiring action
  - [ ] 9.3 Test state transitions:
    - Song going from generating → lyrics_ready → ready
    - Conversation progressing through phases
    - Retry after failed generation
  - [ ] 9.4 Cross-browser testing:
    - Chrome/Edge
    - Firefox
    - Safari (if available)
    - Mobile browsers (Chrome Mobile, Safari iOS)
  - [ ] 9.5 Performance testing:
    - Test with 1, 10, 50, 100+ songs
    - Verify page load < 2 seconds
    - Check memory usage with many items
  - [ ] 9.6 Add comments to complex logic:
    - Priority sorting algorithm
    - Recent activity filtering
    - Progress calculation logic
  - [ ] 9.7 Update component exports in index files if needed
  - [ ] 9.8 Clean up any console.logs or debug code
  - [ ] 9.9 Verify all TypeScript types are correct
  - [ ] 9.10 Run linter: `npm run lint` and fix any issues
  - [ ] 9.11 Final visual review comparing to design examples in `docs/example/`
  - [ ] 9.12 Commit changes: `git add -A && git commit -m "feat: complete library page redesign (PRD-0019)"`
  - [ ] 9.13 Push branch: `git push -u origin feature/library-redesign-prd-0019`
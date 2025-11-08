# PRD-0019: Library Page Complete Redesign

## Introduction/Overview

The current library page serves as a central hub for users to view their songs and conversations, but lacks the visual hierarchy and user-centric organization needed for optimal engagement. This PRD outlines a complete redesign of the library page that will transform it into an intuitive dashboard that provides users with a comprehensive overview of their creative journey.

**Problem:** Users currently need to scroll through long lists to find items requiring action, cannot quickly assess their overall activity, and miss important status updates about their generating songs and ongoing conversations.

**Goal:** Create a modern, information-rich library page that combines dashboard statistics, smart sectioning, and enhanced visual design to help users quickly understand their content status and take appropriate actions.

## Goals

1. **Improve User Awareness**: Provide immediate visibility into total songs, active conversations, and items requiring attention
2. **Reduce Friction**: Eliminate the need for users to search through lists to find actionable items
3. **Enhance Visual Appeal**: Implement a modern gradient-based design system that aligns with contemporary music app aesthetics
4. **Increase Engagement**: Make it easier for users to continue their creative work by surfacing relevant items at the right time
5. **Improve Information Density**: Display more useful information without overwhelming the user

## User Stories

### Primary User Stories

1. **As a user**, I want to see at a glance how many songs I have, how many conversations are active, and how many items need my attention, so that I can quickly assess my overall activity.

2. **As a user**, I want to immediately see which songs or conversations require my action (like choosing lyrics or reviewing failed generations), so that I don't miss important steps in the creation process.

3. **As a user**, I want to see my recently active conversations with their progress indicators and last messages, so that I can easily continue where I left off.

4. **As a user**, I want a visually appealing interface that makes browsing my library enjoyable, so that I'm encouraged to engage with my content more often.

5. **As a user**, I want to see the progress of ongoing generations (lyrics and music) with clear visual indicators, so that I know what's happening with my songs.

### Secondary User Stories

6. **As a user**, I want to quickly access filtering and sorting options, so that I can find specific content when needed.

7. **As a user**, I want the interface to work smoothly on mobile devices, so that I can manage my library on the go.

8. **As a user**, I want consistent visual feedback for all actions (play, share, delete), so that I understand what's happening.

## Functional Requirements

### 1. Dashboard Statistics Section

1.1. Display three stat cards at the top of the library page showing:
   - Total Songs count
   - Total Active Conversations count
   - Currently Generating items count (highlighted)

1.2. Each stat card must display:
   - Label text (e.g., "Total Songs")
   - Large numeric value
   - Appropriate icon or visual indicator

1.3. The "Generating" stat card must have a distinct visual treatment (border, background color) to draw attention

1.4. Stats must update in real-time as items are created, deleted, or change status

### 2. Action Required Section

2.1. Display a dedicated "Action Required" section below the dashboard stats

2.2. Show items that need user action in the following priority order:
   - Songs with status `lyrics_ready` (choose lyrics variant)
   - Songs with status `failed` (retry generation)
   - Conversations waiting for user input

2.3. When no actions are required, display a celebratory empty state:
   - Emoji or icon (e.g., 🎉)
   - Message: "All Caught Up!"
   - Subtext: "No songs require your action right now."

2.4. Each action item card must display:
   - Cover image or avatar
   - Title
   - Status badge with clear call-to-action label
   - Primary action button (e.g., "Choose Lyrics", "Retry", "Continue")

### 3. Recently Active Section

3.1. Display a "Recently Active" section showing the most recent 5 conversations or songs

3.2. For conversation cards, display:
   - Cover image (64x64px)
   - Title
   - Status label (e.g., "CONTEXT VERZAMELEN", "LYRICS REVIEW")
   - Last 2 messages preview
   - Readiness score with visual progress bar
   - Primary action button

3.3. Progress indicators must show:
   - Label "Readiness Score" or "Progress"
   - Percentage value
   - Horizontal progress bar with colored fill

3.4. When no recent activity exists, show motivational empty state

### 4. Enhanced Song Cards

4.1. Maintain existing song card functionality with visual improvements:
   - Cover image with rounded corners
   - Title and lyrics snippet
   - Status badge
   - Variant selector (when multiple variants exist)
   - Action buttons

4.2. Add progress indicators for songs in generation:
   - Time since generation started
   - Visual progress representation (spinner or bar)
   - Estimated completion time (if available)

### 5. Enhanced Conversation Cards

5.1. Redesign conversation cards to horizontal layout:
   - Left: Cover image (64x64px, rounded)
   - Middle: Title, status, last messages
   - Right: Action arrow or button

5.2. Include progress bar showing readiness score

5.3. Display last 2 messages in a compact format:
   - "You: [message preview]"
   - "AI: [message preview]"
   - Truncate long messages with ellipsis

### 6. New Design System

6.1. Implement modern gradient color scheme:
   - Primary gradients combining warm and cool tones
   - Example: Purple (#6A11CB) to Pink (#FF00A5) to Rose (#f43e47)
   - Gradient backgrounds for cards, buttons, and progress bars

6.2. Typography hierarchy:
   - Use Plus Jakarta Sans or similar modern font family
   - Bold headings (2xl for page title, xl for sections)
   - Medium weight for card titles
   - Regular for body text

6.3. Spacing and layout:
   - Consistent padding (4 units = 16px)
   - Gap between sections (8 units = 32px)
   - Rounded corners (lg = 24px for cards, full for buttons)

6.4. Dark mode support:
   - All components must work in both light and dark modes
   - Appropriate contrast ratios for accessibility

### 7. Responsive Design

7.1. Mobile-first approach with breakpoints:
   - Mobile: Single column layout
   - Tablet: Two column grid for cards
   - Desktop: Three column grid for cards

7.2. Bottom navigation must remain sticky and accessible

7.3. Touch targets must be minimum 44x44px for mobile

### 8. Performance & UX

8.1. Implement lazy loading for song and conversation lists

8.2. Show skeleton states during data fetching

8.3. Maintain 10-second polling for status updates

8.4. Smooth animations for:
   - Progress bar updates
   - Card hover effects
   - Section expansions/collapses

### 9. Filtering & Search

9.1. Maintain existing filter functionality:
   - Search input
   - Status filter dropdown
   - Sort order dropdown

9.2. Position filters in a sticky header or collapsible section

9.3. Apply filters to relevant sections (not to "Action Required" which auto-prioritizes)

## Non-Goals (Out of Scope)

1. **Playlist Creation**: This redesign does not include the ability to create playlists or collections
2. **Collaborative Features**: No sharing conversations or collaborative editing
3. **External Integrations**: No Spotify, Apple Music, or other service integrations
4. **Advanced Analytics**: No detailed usage statistics or listening history beyond basic counts
5. **Bulk Operations**: No multi-select for batch delete or actions
6. **Custom Themes**: No user-customizable color schemes (only light/dark mode)
7. **Library Organization**: No folders, tags, or custom categorization beyond existing filters
8. **Export Features**: No bulk export of songs or lyrics

## Design Considerations

### Visual Design References

**Reference Examples Provided:**
- `docs/example/screen1.md`: Dashboard with stats, action required section, recently active conversations
- `docs/example/screen2.md`: Simplified library view with progress indicators

### Component Hierarchy

```
Library Page
├── Header (Sticky)
│   ├── Title "My Library"
│   ├── Filter button
│   └── Sort button
├── Dashboard Stats
│   ├── Total Songs Card
│   ├── Total Conversations Card
│   └── Generating Card (highlighted)
├── Action Required Section
│   ├── Section Title
│   └── Action Cards (or Empty State)
├── Recently Active Section
│   ├── Section Title
│   └── Activity Cards
├── All Songs Section
│   ├── Section Title
│   ├── Filters (collapsible)
│   └── Song Cards Grid
├── All Conversations Section
│   ├── Section Title
│   ├── Filters (collapsible)
│   └── Conversation Cards Grid
└── Bottom Navigation (Sticky)
```

### Key UI Components to Create/Update

1. **DashboardStats**: New component for stat cards
2. **ActionRequiredSection**: New component for priority items
3. **RecentlyActiveSection**: New component for recent activity
4. **SongCard**: Update with progress indicators
5. **ConversationCard**: Redesign to horizontal layout
6. **ProgressBar**: New reusable component
7. **EmptyState**: Flexible empty state component
8. **SectionHeader**: Consistent section headers

### Color Palette (Gradient System)

```css
--gradient-primary: linear-gradient(135deg, #6A11CB 0%, #FF00A5 50%, #f43e47 100%);
--gradient-card: linear-gradient(135deg, rgba(106, 17, 203, 0.1) 0%, rgba(255, 0, 165, 0.05) 100%);
--gradient-progress: linear-gradient(90deg, #6A11CB 0%, #FF00A5 100%);
--color-accent: #FF00A5;
--color-primary: #6A11CB;
--color-secondary: #f43e47;
```

## Technical Considerations

### Data Structure Requirements

1. **New Query Fields**: Ensure mobile/desktop queries fetch:
   - Total counts for dashboard stats
   - Status-based filtering for action items
   - Recent activity sorting (by `updatedAt`)

2. **Progress Tracking**: `generationProgress` JSON must include:
   - `lyricsStartedAt`, `lyricsCompletedAt`
   - `musicStartedAt`, `musicCompletedAt`
   - `lyricsError`, `musicError`

3. **Priority Sorting**: Implement smart sorting algorithm that:
   - Prioritizes `lyrics_ready` and `failed` statuses
   - Considers `updatedAt` for tie-breaking
   - Separates action items from regular items

### Component Architecture

1. **Shared Components**: Create reusable components in `src/app/library/components/`
2. **Hooks**: Consider custom hooks for:
   - `useLibraryStats()`: Get dashboard statistics
   - `useActionItems()`: Get items requiring action
   - `useRecentActivity()`: Get recent songs/conversations

3. **State Management**: Use existing React state + InstantDB queries
4. **Mobile API**: Continue using `/api/mobile/library/*` endpoints for mobile access

### Performance Optimizations

1. Implement virtual scrolling for large lists (100+ items)
2. Memoize expensive computations (priority sorting, filtering)
3. Debounce search input (300ms)
4. Use `React.memo` for card components

### Accessibility (a11y)

1. ARIA labels for all interactive elements
2. Keyboard navigation support
3. Screen reader friendly status announcements
4. High contrast mode support
5. Focus indicators for all focusable elements

## Success Metrics

1. **Engagement**: 30% increase in users returning to library page
2. **Action Completion**: 50% reduction in time to complete required actions (choosing lyrics, retrying failed)
3. **User Satisfaction**: 4.5+ rating on library page usability survey
4. **Performance**: Page load time < 2 seconds on 4G connection
5. **Discovery**: 40% increase in users playing songs from library
6. **Adoption**: 80% of active users interact with new dashboard stats within first week

### Measurement Plan

- Track library page visits via analytics
- Measure time-to-action for songs with `lyrics_ready` status
- Monitor click-through rates on action buttons
- A/B test old vs new design (if feasible)
- User surveys after 2 weeks of usage

## Implementation Phases

### Phase 1: Foundation (Weeks 1-4)
- New component architecture
- Dashboard stats section
- Action required section
- Basic gradient design system

### Phase 2: Enhanced Cards (Weeks 5-8)
- Redesigned conversation cards with progress
- Enhanced song cards with progress
- Recently active section
- Empty states

### Phase 3: Polish & Performance (Weeks 9-12)
- Animations and transitions
- Performance optimizations
- Accessibility improvements
- Dark mode refinements

### Phase 4: Testing & Iteration (Weeks 13-16)
- User testing sessions
- Bug fixes
- UI refinements based on feedback
- Documentation

## Open Questions

1. **Analytics Integration**: Which analytics events should we track for the new sections?
2. **Notification Deep Links**: Should action required items be linkable from push notifications?
3. **Personalization**: Should we remember user's preferred sort/filter settings?
4. **Empty States**: Do we want different empty states for first-time users vs returning users?
5. **Mobile Navigation**: Should we add shortcuts to "Action Required" in the bottom nav?
6. **Performance Targets**: What's the acceptable rendering time for library with 100+ songs?
7. **Progressive Enhancement**: Should we show basic version for older browsers?
8. **Caching Strategy**: How aggressively should we cache library data on mobile?

## Dependencies

- Existing InstantDB schema and permissions
- Mobile API endpoints (`/api/mobile/library/*`)
- Current authentication system
- NavTabs component
- AudioMiniPlayer component
- Existing song status types and progression

## References

- Current Library Page: `src/app/library/page.tsx`
- Song Card Component: `src/app/library/components/SongCard.tsx`
- Conversation Card Component: `src/app/library/components/ConversationCard.tsx`
- Library Queries: `src/lib/library/queries.ts`
- Design Examples: `docs/example/screen1.md`, `docs/example/screen2.md`
- Previous PRDs: `tasks/0015-prd-library-redesign-async-generation.md`
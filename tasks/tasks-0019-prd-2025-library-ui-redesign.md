## Relevant Files

### Existing Files
- `src/app/library/page.tsx` - Main library page component (will be refactored to use new components)
- `src/app/library/components/SongCard.tsx` - Original song card component (kept for backward compatibility)
- `src/app/library/components/ConversationCard.tsx` - Current conversation card component
- `src/app/library/components/Filters.tsx` - Original filter component (kept for reference)
- `src/lib/library/queries.ts` - Library data fetching hooks (backward compatible)
- `src/lib/library/sorting.ts` - Current sorting logic with AI-powered prioritization
- `src/lib/library/utils.ts` - Utility functions for snippets and serialization
- `src/components/AudioMiniPlayer.tsx` - Audio player component for mobile playback
- `src/components/LyricsChoiceModal.tsx` - Modal for lyrics selection
- `src/types/generation.ts` - Type definitions for songs and lyrics variants
- `src/lib/analytics/events.ts` - Analytics tracking for new user actions
- `src/instant.schema.ts` - Database schema (updated with projects entity)

### New Files Created (Tasks 1.0-4.0)
- `src/app/library/components/SmartSection.tsx` - Smart section with dynamic headers and icons
- `src/app/library/components/SectionHeader.tsx` - Reusable section header component
- `src/app/library/components/SectionEmptyState.tsx` - Empty states for each section type
- `src/app/library/components/LazyLoadSection.tsx` - Lazy loading implementation for large lists
- `src/lib/library/useSmartLibrary.ts` - Hook for AI-driven section logic and prioritization
- `src/app/library/components/SmartActionCard.tsx` - AI-powered card with predictive actions
- `src/app/library/components/ProgressRing.tsx` - Circular progress indicator for generating states
- `src/app/library/components/ConversationalFilters.tsx` - Natural language filtering interface
- `src/lib/library/animations.ts` - Animation utilities for micro-interactions and transitions
- `src/app/library/components/LyricsPreviewModal.tsx` - Quick preview modal for lyrics
- `src/app/library/components/ProjectSelector.tsx` - Project navigation and selection
- `src/app/library/components/ProjectCreationForm.tsx` - Form for creating new projects
- `src/app/library/components/ProjectVisualization.tsx` - Visualization of project relationships
- `src/app/library/components/ProjectManagementPanel.tsx` - Project management UI (rename, delete, archive)
- `src/lib/hooks/useSwipeGesture.ts` - Hook for touch swipe gesture detection
- `src/app/library/components/SwipeableCard.tsx` - Card with swipe gesture support
- `src/app/library/components/MobileLibraryNav.tsx` - Mobile bottom navigation bar
- `src/app/library/components/ResponsiveGrid.tsx` - Responsive grid layout component
- `src/app/library/components/PullToRefresh.tsx` - Pull-to-refresh functionality
- `src/app/library/components/MobileEmptyState.tsx` - Mobile-optimized empty states
- `src/app/library/components/TouchFriendlyCard.tsx` - Touch-friendly components with 44px+ targets

## Implementation Summary (Tasks 1.0-4.0 Complete ✅)

### Task 1.0: Smart Sections Architecture ✅
Implemented a comprehensive section-based organization system with:
- **SmartSection**: Collapsible sections with dynamic colors and icons
- **useSmartLibrary**: Hook that intelligently categorizes songs (action_required > in_progress > completed > discovery)
- **SectionHeader**: Reusable header with conversational titles and descriptions
- **SectionEmptyState**: Context-aware empty states for each section type
- **LazyLoadSection**: Intersection observer-based lazy loading for large lists

### Task 2.0: AI-Powered Components ✅
Created intelligent card and filter components:
- **SmartActionCard**: Enhanced card showing predictive actions based on song status
- **ProgressRing**: SVG-based circular progress indicator for generation status
- **ConversationalFilters**: Natural language filtering with helpful tips and suggestions
- **LyricsPreviewModal**: Quick-preview modal for viewing/copying lyrics
- **animations.ts**: Utilities for smooth transitions and micro-interactions

### Task 3.0: Project-Based Organization ✅
Implemented project management system:
- **Database Schema**: Added `projects` entity with relationships to songs and conversations
- **ProjectSelector**: Navigation component for selecting and switching between projects
- **ProjectCreationForm**: Form with auto-suggestions for project setup
- **ProjectVisualization**: Shows connections between conversations and songs
- **ProjectManagementPanel**: UI for renaming, archiving, duplicating, and deleting projects

### Task 4.0: Mobile Optimizations ✅
Mobile-first design implementations:
- **useSwipeGesture**: Hook for detecting swipe gestures on touch devices
- **SwipeableCard**: Card wrapper with swipe action indicators
- **MobileLibraryNav**: Bottom navigation bar with action counters
- **PullToRefresh**: iOS-style pull-to-refresh functionality
- **TouchFriendlyCard/Button/Control**: Components with guaranteed 44px+ touch targets (Apple HIG)
- **MobileEmptyState**: Mobile-optimized empty/loading/error states
- **ResponsiveGrid**: Mobile-first responsive grid layout system

## Notes

- All components are TypeScript with strict typing
- Components use Tailwind CSS for styling (Tailwind v4 compatible)
- Touch targets meet Apple HIG (44px minimum) and Material Design standards
- Database schema updated with project support (backward compatible)
- All existing components kept for backward compatibility
- Ready for integration into library page and testing
- Unit tests should be placed alongside code files (e.g., `SmartSection.test.tsx`)
- Use `npx vitest` to run tests
- Consider feature flags for gradual rollout of AI features

## Tasks

- [x] 1.0 Implement Smart Sections Architecture
  - [x] 1.1 Create SmartSection component with dynamic headers and icons
  - [x] 1.2 Implement useSmartLibrary hook for AI-driven section logic
  - [x] 1.3 Add section priority calculation (action_required > in_progress > completed > discovery)
  - [x] 1.4 Create SectionHeader component with conversational titles
  - [x] 1.5 Add empty states for each section type
  - [x] 1.6 Implement lazy loading for large libraries within sections

- [x] 2.0 Create AI-Powered Components
  - [x] 2.1 Build SmartActionCard component to replace SongCard
  - [x] 2.2 Implement predictive action buttons based on song status
  - [x] 2.3 Create ConversationalFilters component to replace Filters
  - [x] 2.4 Add micro-interactions and status transitions
  - [x] 2.5 Implement quick preview modals for lyrics
  - [x] 2.6 Create ProgressRing component for generating states

- [x] 3.0 Add Project-Based Organization
  - [x] 3.1 Design project data structure (optional grouping feature)
  - [x] 3.2 Create ProjectSelector component for navigation
  - [x] 3.3 Add project creation workflow with auto-suggestions
  - [x] 3.4 Implement project filtering and organization
  - [x] 3.5 Add conversation-song linking visualization
  - [x] 3.6 Create project management actions (rename, delete, archive)

- [x] 4.0 Implement Mobile Optimizations
  - [x] 4.1 Add swipe gesture support for cards (play, archive, delete)
  - [x] 4.2 Implement bottom navigation with context-aware shortcuts
  - [x] 4.3 Create touch-friendly card layouts (44px+ touch targets)
  - [x] 4.4 Add mobile-specific empty states and loading indicators
  - [x] 4.5 Implement pull-to-refresh for library updates
  - [x] 4.6 Optimize responsive grid layouts for mobile screens

- [ ] 5.0 Add AI Features & Guidance
  - [ ] 5.1 Implement conversational guidance messages
  - [ ] 5.2 Add smart prioritization algorithm (rule-based AI)
  - [ ] 5.3 Create predictive action suggestions
  - [ ] 5.4 Implement AI-powered empty state suggestions
  - [ ] 5.5 Add feature discovery hints and onboarding
  - [ ] 5.6 Create analytics tracking for AI feature usage
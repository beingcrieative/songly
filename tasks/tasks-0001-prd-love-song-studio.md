# Task List: Love Song Studio Conversational Flow

Generated from: `tasks/0001-prd-love-song-studio.md`

**Status: ✅ ALL TASKS COMPLETED (5/5)**

Last updated: 2025-01-07

## Current State Assessment

### Existing Infrastructure
- **Conversational UI**: Basic chat interface exists in `src/app/page.tsx` with message history and input field
- **InstantDB Entities**: `conversations`, `messages`, and `songs` entities already defined in `src/instant.schema.ts`
- **AI Integration**: OpenRouter (DeepSeek) integration exists in `/api/chat/route.ts` with concept lyrics generation
- **Lyrics Display**: Current implementation shows lyrics in a sidebar with hidden `###CONCEPT_LYRICS###` format
- **Polling**: No real-time updates currently implemented for lyrics changes

### Gaps Identified
- No `lyric_versions` entity for tracking version history
- No `composerContext` field on messages for adaptive controls
- No context-aware composer controls in UI
- No version comparison or history UI
- No quasi-real-time polling mechanism for lyrics updates
- Desktop split-view layout needs refinement
- Mobile responsive stacking not optimized

## Tasks

### 1.0 Extend InstantDB Schema for Lyric Versioning and Composer Context ✅
- [x] 1.1 Add `lyric_versions` entity to `instant.schema.ts` with fields: `content` (string), `label` (string), `createdAt` (number, indexed), `hash` (string, indexed), `version` (number)
- [x] 1.2 Add `composerContext` field (string, optional) to `messages` entity for storing LLM-generated composer suggestions
- [x] 1.3 Add links: `lyric_versions` → `conversations` (one), `lyric_versions` → `songs` (one)
- [x] 1.4 Run `npx instant-cli push` to sync schema changes to InstantDB (requires user to login)
- [x] 1.5 Update TypeScript types by creating `LyricVersion` type using `InstaQLEntity<AppSchema, "lyric_versions">`

### 2.0 Implement Two-Step LLM Workflow with Composer Context ✅
- [x] 2.1 Refactor `/api/chat/route.ts` to extract composer context generation into separate function `generateComposerContext()`
- [x] 2.2 Modify POST handler to call `generateComposerContext()` after generating AI reply
- [x] 2.3 Store composer context in `composerContext` field when creating message entity (returned in API response)
- [x] 2.4 Create new API endpoint `/api/lyric-versions` for lyric version generation
- [x] 2.5 Implement conversation delta + previous lyrics handling in lyric version endpoint
- [x] 2.6 Parse LLM response and create new `lyric_versions` entity with auto-generated label (e.g., "Versie 1 – 14:32")
- [x] 2.7 Calculate content hash for deduplication using SHA-256 and store in `hash` field
- [x] 2.8 Link new lyric version to conversation and song entities using Admin SDK
- [x] 2.9 Add comprehensive error handling for LLM calls and JSON parsing

### 3.0 Build Version-Aware Lyrics Panel with Polling ✅
- [x] 3.1 Create `useLyricVersions` custom hook that polls InstantDB every 4 seconds using `db.useQuery()`
- [x] 3.2 Implement hash-based deduplication in hook to prevent unnecessary re-renders
- [x] 3.3 Create `<LyricsPanel>` component that displays latest lyric version with highlighted styling
- [x] 3.4 Add version history list showing previous versions with timestamps
- [x] 3.5 Implement expandable/collapsible previous versions for comparison view
- [x] 3.6 Add loading spinner with animated icon and "Lyrics laden..." message
- [x] 3.7 Display "No lyrics yet" state with emoji and helpful message
- [x] 3.8 Add visual indicators: "Nieuw bijgewerkt" badge, current version dot, version count

### 4.0 Create Context-Aware Composer Controls UI ✅
- [x] 4.1 Create `<ComposerControls>` component that reads `composerContext` from props
- [x] 4.2 Parse composer context JSON to extract suggested controls (mood, tone, section prompts)
- [x] 4.3 Render dynamic UI controls as pill buttons with color-coded categories
- [x] 4.4 Implement click handlers that call `onSuggestionClick` callback with suggestion text
- [x] 4.5 Add visual refresh animation (pulse effect) when controls update after new AI message
- [x] 4.6 Component designed to be positioned near chat input (flexible via className prop)
- [x] 4.7 Add fallback UI with music icon and helpful message when no composer context exists
- [x] 4.8 Track analytics events via CustomEvent system for suggestion clicks and context loads

### 5.0 Implement Responsive Split-View Layout (Desktop/Mobile) ✅
- [x] 5.1 Create ConversationalStudioLayout component with desktop split-view: left pane (chat/composer), right pane (lyrics)
- [x] 5.2 Use CSS Grid (`md:grid-cols-2`) with responsive breakpoints at md (768px)
- [x] 5.3 Implement mobile stacked layout: chat/composer on top, collapsible lyrics panel below
- [x] 5.4 Add collapsible accordion with toggle button and smooth expand/collapse animation (300ms)
- [x] 5.5 Ensure smooth transitions with Tailwind transition-all duration-300 ease-in-out
- [x] 5.6 Layout tested across breakpoints: mobile (<768px stacked), tablet/desktop (≥768px split)
- [x] 5.7 Optimize scroll behavior: independent overflow-y-auto on both panes, h-full containers
- [x] 5.8 Add visual separators: border-r on left pane, border-t on mobile panel, gradient backgrounds

## Relevant Files

- `src/instant.schema.ts` - Extended with `lyric_versions` entity and `composerContext` field on messages
- `src/app/page.tsx` - Added `LyricVersion` TypeScript type definition
- `src/app/api/chat/route.ts` - Added `generateComposerContext()` function and integrated composer context into responses
- `src/app/api/lyric-versions/route.ts` - New endpoint for generating and storing lyric versions with hash-based deduplication
- `src/hooks/useLyricVersions.ts` - Custom hook for polling lyric versions with hash-based change detection
- `src/components/LyricsPanel.tsx` - Full-featured lyrics display component with version history and comparison
- `src/components/ComposerControls.tsx` - Context-aware UI controls component with dynamic suggestions and analytics
- `src/components/ConversationalStudioLayout.tsx` - Responsive split-view layout wrapper with mobile accordion
- `src/components/StudioExample.tsx` - Reference implementation showing complete integration

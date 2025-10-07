# Task List: Love Song Studio Conversational Flow

Generated from: `tasks/0001-prd-love-song-studio.md`

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

### 1.0 Extend InstantDB Schema for Lyric Versioning and Composer Context
- [x] 1.1 Add `lyric_versions` entity to `instant.schema.ts` with fields: `content` (string), `label` (string), `createdAt` (number, indexed), `hash` (string, indexed), `version` (number)
- [x] 1.2 Add `composerContext` field (string, optional) to `messages` entity for storing LLM-generated composer suggestions
- [x] 1.3 Add links: `lyric_versions` → `conversations` (one), `lyric_versions` → `songs` (one)
- [x] 1.4 Run `npx instant-cli push` to sync schema changes to InstantDB (requires user to login)
- [x] 1.5 Update TypeScript types by creating `LyricVersion` type using `InstaQLEntity<AppSchema, "lyric_versions">`

### 2.0 Implement Two-Step LLM Workflow with Composer Context
- [ ] 2.1 Refactor `/api/chat/route.ts` to extract composer context generation into separate function `generateComposerContext()`
- [ ] 2.2 Modify POST handler to call `generateComposerContext()` after generating AI reply
- [ ] 2.3 Store composer context in `composerContext` field when creating message entity
- [ ] 2.4 Create new function `generateLyricVersion()` that triggers after AI reply completes
- [ ] 2.5 Implement `generateLyricVersion()` to send conversation delta + previous lyrics to LLM
- [ ] 2.6 Parse LLM response and create new `lyric_versions` entity with auto-generated label (e.g., "Verse Update – 14:32")
- [ ] 2.7 Calculate content hash for deduplication and store in `hash` field
- [ ] 2.8 Link new lyric version to conversation and song entities
- [ ] 2.9 Add error handling and retry logic for LLM calls

### 3.0 Build Version-Aware Lyrics Panel with Polling
- [ ] 3.1 Create `useLyricVersions` custom hook that polls InstantDB every 3-5 seconds using `db.useQuery()`
- [ ] 3.2 Implement hash-based deduplication in hook to prevent unnecessary re-renders
- [ ] 3.3 Create `<LyricsPanel>` component that displays latest lyric version with highlighted styling
- [ ] 3.4 Add version history list showing previous versions with timestamps
- [ ] 3.5 Implement expandable/collapsible previous versions for comparison view
- [ ] 3.6 Add loading spinner/toast during polling updates
- [ ] 3.7 Display "No lyrics yet" state when no versions exist
- [ ] 3.8 Add visual indicator showing which version is currently displayed (latest vs historical)

### 4.0 Create Context-Aware Composer Controls UI
- [ ] 4.1 Create `<ComposerControls>` component that reads `composerContext` from latest message
- [ ] 4.2 Parse composer context JSON to extract suggested controls (mood, tone, section prompts)
- [ ] 4.3 Render dynamic UI controls based on context (toggles, buttons, select dropdowns)
- [ ] 4.4 Implement click handlers that inject composer adjustments into chat input
- [ ] 4.5 Add visual refresh animation when controls update after new AI message
- [ ] 4.6 Position controls near chat input in conversational pane
- [ ] 4.7 Add fallback UI when no composer context exists (show generic controls)
- [ ] 4.8 Track analytics events when users interact with composer suggestions

### 5.0 Implement Responsive Split-View Layout (Desktop/Mobile)
- [ ] 5.1 Create desktop split-view layout in `page.tsx`: left pane (chat/composer), right pane (lyrics)
- [ ] 5.2 Use CSS Grid or Flexbox with responsive breakpoints (e.g., `md:grid-cols-2`)
- [ ] 5.3 Implement mobile stacked layout: chat/composer on top, lyrics panel below
- [ ] 5.4 Add collapsible accordion or swipe gesture for lyrics panel on mobile
- [ ] 5.5 Ensure smooth transitions between desktop and mobile layouts
- [ ] 5.6 Test layout on various screen sizes (mobile, tablet, desktop)
- [ ] 5.7 Optimize scroll behavior: independent scrolling for chat and lyrics panels
- [ ] 5.8 Add visual separators and padding for clear zone distinction

## Relevant Files

- `src/instant.schema.ts` - Extended with `lyric_versions` entity and `composerContext` field on messages
- `src/app/page.tsx` - Added `LyricVersion` TypeScript type definition

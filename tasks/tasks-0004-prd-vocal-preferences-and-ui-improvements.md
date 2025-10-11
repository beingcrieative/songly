# Tasks for PRD-0004: Vocal Preferences System & UI Improvements

## Current State Assessment

### Existing Infrastructure
- **Context System**: `ExtractedContext` interface already exists in `src/types/conversation.ts` with memories, emotions, partnerTraits, musicStyle
- **Context Extraction**: AI-powered extraction in `src/lib/utils/contextExtraction.ts` using OpenRouter
- **Database Schema**: InstantDB schema has `conversations.extractedContext` (JSON string) and `songs.generationParams` (JSON string)
- **Suno Integration**: Working API integration in `src/app/api/suno/route.ts` with custom_mode, prompt, tags, model parameters
- **Layout**: Responsive grid layout exists: `lg:grid-cols-[minmax(0,1.75fr)_minmax(320px,1fr)]` for desktop two-column
- **Concept Panel**: `ConceptLyricsPanel` component in `src/app/page.tsx` displays draft lyrics

### Gaps Identified
- ❌ No vocal preference fields in ExtractedContext (language, vocalGender, vocalAge, vocalDescription)
- ❌ Context extraction prompt doesn't detect vocal characteristics
- ❌ No UI controls for users to select/adjust preferences
- ❌ Suno API integration doesn't enhance prompts with vocal descriptions
- ❌ Lyrics display shows raw JSON instead of formatted content
- ❌ Layout doesn't handle long chat conversations well (concept panel gets pushed down on desktop)

### Key Architecture Patterns
- TypeScript with strict types
- React 19 with "use client" components
- InstantDB for reactive queries and mutations
- OpenRouter for AI (Gemini 2.5 Flash Lite model)
- Tailwind CSS for styling with custom color scheme (#7f5af0 primary)
- JSON storage for complex data structures (extractedContext, generationParams)

## Relevant Files

### To Modify
- `src/types/conversation.ts` - Extend ExtractedContext and UserPreferences interfaces with vocal preference fields
- `src/lib/utils/contextExtraction.ts` - Update EXTRACTION_PROMPT to detect vocal preferences; parse and store them
- `src/app/api/chat/conversation/route.ts` - Ensure vocal preferences are included in context extraction flow
- `src/app/page.tsx` - Enhance ConceptLyricsPanel with AudioPreferencesSection; fix layout responsiveness
- `src/app/api/suno/route.ts` - Build vocal description string and enhance prompt/tags with preferences
- `src/instant.schema.ts` - (Optional) Document expected JSON structure in comments; no schema changes needed

### To Create
- `src/components/AudioPreferencesPanel.tsx` - New component for language, gender, tone selectors
- `src/lib/utils/vocalDescriptionBuilder.ts` - Utility to construct natural language vocal descriptions for Suno
- `src/lib/utils/lyricsFormatter.ts` - Utility to parse JSON lyrics and format for display

### Related Files (Reference)
- `src/app/api/chat/generate-lyrics/route.ts` - May need vocal preferences for final lyrics generation
- `src/components/LyricsPanel.tsx` - Existing lyrics display component for reference
- `src/lib/prompts/lyricsAgent.ts` - System prompt for lyrics agent
- `prompts/sunomanual.md` - Suno API documentation reference

## Tasks

- [x] 1.0 Extend Data Model for Vocal Preferences
  - [x] 1.1 Update `src/types/conversation.ts` to add vocal preference fields to `ExtractedContext` interface:
    - Add `language?: string` - Preferred song language (e.g., "Nederlands", "English", "Français")
    - Add `vocalGender?: 'male' | 'female' | 'neutral'` - Preferred voice gender
    - Add `vocalAge?: 'young' | 'mature' | 'deep'` - Preferred voice age/tone category
    - Add `vocalDescription?: string` - Freeform description (e.g., "soulful", "powerful", "warm")
  - [x] 1.2 Extend `UserPreferences` interface in same file with same vocal fields for explicit user selections
  - [x] 1.3 Create new type `VocalPreferences` that consolidates these fields for reuse across codebase
  - [x] 1.4 Add JSDoc comments to all new fields explaining their purpose and expected values
  - [x] 1.5 Export new types and ensure they're properly imported where needed

- [x] 2.0 Implement Intelligent Vocal Preference Detection
  - [x] 2.1 Update `EXTRACTION_PROMPT` in `src/lib/utils/contextExtraction.ts` to include vocal preference detection:
    - Add section 6: "**Language**: Preferred song language detected from conversation (Nederlands, English, etc.)"
    - Add section 7: "**Vocal Gender**: Preferred voice gender if mentioned (male, female, neutral)"
    - Add section 8: "**Vocal Age/Tone**: Voice age or tone characteristics (young, mature, deep)"
    - Update return format example to include: `"language": "English"`, `"vocalGender": "female"`, `"vocalAge": "mature"`, `"vocalDescription": "warm and soulful"`
  - [x] 2.2 Update the JSON sanitization logic to handle new vocal preference fields (around line 84-96)
  - [x] 2.3 Add default inference logic: if user types in English, default `language` to "English"; if conversation in Dutch, default to "Nederlands"
  - [x] 2.4 Update `parseExtractedContext` function to validate and parse vocal preference fields with fallbacks
  - [x] 2.5 Test extraction with sample conversations containing vocal preferences in different languages

- [x] 3.0 Create Interactive Audio Preferences UI Component
  - [x] 3.1 Create new file `src/components/AudioPreferencesPanel.tsx` with base component structure:
    - Accept props: `preferences: VocalPreferences`, `onChange: (prefs: VocalPreferences) => void`, `disabled?: boolean`
    - Use "use client" directive
    - Import necessary types from `@/types/conversation`
  - [x] 3.2 Implement Language Selector section:
    - For ≤3 languages: Create toggle button group (Nederlands | English | Français) using Tailwind
    - Style active button with `bg-[#7f5af0] text-white`, inactive with `bg-white/80 text-[rgba(31,27,45,0.7)]`
    - Add hover states with `hover:bg-[#7f5af0]/10`
    - Include "Auto" option that shows detected language
  - [x] 3.3 Implement Voice Gender Toggle:
    - Create two-button toggle (Male | Female)
    - Use same styling pattern as language selector
    - Include icon indicators (♂️ | ♀️) for visual clarity
    - Add "Neutral" option that defers to AI
  - [x] 3.4 Implement Voice Tone Dropdown:
    - Create select element with options: "Young & Bright (20-30)", "Mature & Warm (30-40)", "Deep & Soulful (40+)"
    - Style dropdown to match existing design system (white background, subtle border, shadow on focus)
    - Use `<select className="rounded-xl border border-white/60 bg-white/90 px-3 py-2 text-sm outline-none focus:border-[#7f5af0]">`
  - [x] 3.5 Add preference change handlers that call `onChange` prop with updated preferences
  - [x] 3.6 Add visual "detected" badge for AI-inferred preferences vs user-selected ones
  - [x] 3.7 Add responsive design: stack controls vertically on mobile (<768px)
  - [x] 3.8 Integrate component into `ConceptLyricsPanel` in `src/app/page.tsx`:
    - Add `AudioPreferencesPanel` above lyrics display section
    - Pass conversation's `extractedContext` vocal preferences as props
    - Add onChange handler that updates conversation's extractedContext via `db.transact`
  - [x] 3.9 Add collapsible section with "Audio Preferences ▼" header to save space

- [x] 4.0 Enhance Suno API Integration with Vocal Descriptions
  - [x] 4.1 Create new file `src/lib/utils/vocalDescriptionBuilder.ts`:
    - Export function `buildVocalDescription(preferences: VocalPreferences): string`
    - Build natural language description: "Sung in [language] by a [age] [gender] voice with a [description] tone"
    - Handle undefined/partial preferences gracefully with sensible defaults
    - Example output: "Sung in English by a mature female voice with a warm, soulful tone"
  - [x] 4.2 Add helper function `buildVocalTags(preferences: VocalPreferences): string[]` that returns array of tags
    - Example: `["female vocals", "English", "soulful", "mature voice"]`
  - [x] 4.3 Update `src/app/api/suno/route.ts` POST handler:
    - Read `songId` parameter and fetch corresponding song from database using admin SDK
    - Parse `song.generationParams` JSON to extract vocal preferences
    - If no song-level preferences, read from `conversation.extractedContext` via song's conversation link
    - Merge conversation-level and song-level preferences (song-level takes precedence)
  - [x] 4.4 Enhance Suno API request body in same route:
    - Append vocal description to `prompt` parameter: `${lyrics}\n\n${vocalDescription}`
    - Enhance `tags` parameter: `${musicStyle}, ${vocalTags.join(', ')}`
    - Log enhanced prompt and tags for debugging
  - [x] 4.5 Update `generateFromDraft` function in `src/app/page.tsx` to pass vocal preferences to API:
    - Before calling `/api/suno`, save current preferences to `song.generationParams`
    - Use `db.transact` to update song with merged conversation + user preferences
  - [x] 4.6 Test with various preference combinations and verify Suno generates correct vocal characteristics

- [x] 5.0 Fix UI Layout and Lyrics Formatting Issues
  - [x] 5.1 Create new file `src/lib/utils/lyricsFormatter.ts`:
    - Export function `parseLyricsJSON(jsonString: string): { title: string, lyrics: string, style: string } | null`
    - Use try-catch for safe JSON parsing
    - Handle both plain JSON and JSON wrapped in code blocks
    - Return null on parse failure
  - [x] 5.2 Add helper function `formatLyricsText(lyrics: string): string`:
    - Preserve line breaks (`\n` → `<br>` or whitespace-pre-wrap)
    - Make section labels bold: `[Verse 1]`, `[Chorus]`, `[Bridge]` → wrap in `<strong>` or use CSS
    - Return formatted HTML or structured text
  - [x] 5.3 Update `ConceptLyricsPanel` in `src/app/page.tsx` to use lyrics formatter:
    - Import `parseLyricsJSON` utility
    - Check if `draft.lyrics` is JSON (starts with `{` or contains `"title"`)
    - If JSON, parse and display formatted view with separate title/style/lyrics sections
    - If plain text, display as-is
    - Add error boundary/fallback for parsing failures
  - [x] 5.4 Fix desktop layout scrolling in `src/app/page.tsx`:
    - Find the main studio content section (line ~984)
    - Ensure chat column has `overflow-y-auto` and max-height constraint
    - Make concept lyrics panel (right column) `sticky top-6` or fixed height
    - Test that chat scrolls independently while concept panel stays visible
  - [x] 5.5 Add mobile tab interface for chat vs concept:
    - Create state: `const [mobileActiveTab, setMobileActiveTab] = useState<'chat' | 'concept'>('chat')`
    - Add tab buttons above content on mobile: `<div className="flex gap-2 border-b md:hidden">`
    - Show chat messages when `mobileActiveTab === 'chat'`
    - Show concept panel when `mobileActiveTab === 'concept'`
    - Add smooth transition classes
  - [x] 5.6 Update responsive layout CSS:
    - Desktop (≥1024px): Two columns with `grid-cols-[60%_40%]`, both visible
    - Tablet (768-1023px): Two columns with `grid-cols-2`, slightly smaller gap
    - Mobile (<768px): Single column with tab switching
    - Test on various screen sizes and ensure no content overflow
  - [x] 5.7 Add visual indicator for active tab on mobile (border-bottom with primary color)

---

## Testing Checklist

After completing all tasks, verify:

- [ ] Vocal preferences are correctly detected from conversations in multiple languages
- [ ] Preferences panel displays correctly on desktop, tablet, and mobile
- [ ] User can manually adjust all preference controls
- [ ] Changes to preferences are saved to database and persist across page reloads
- [ ] Suno API receives enhanced prompts with vocal descriptions
- [ ] Generated songs match specified vocal characteristics (verify with test generations)
- [ ] Lyrics display shows formatted text, not raw JSON
- [ ] Desktop layout keeps both chat and concept panel visible during long conversations
- [ ] Mobile tab interface works smoothly with proper transitions
- [ ] No console errors or TypeScript compilation errors

---

**Status:** Phase 2 - Detailed Sub-Tasks Generated ✅
**Next Step:** Begin implementation starting with Task 1.0
**Estimated Time:** 15-20 hours total (3-4 hours per major task)

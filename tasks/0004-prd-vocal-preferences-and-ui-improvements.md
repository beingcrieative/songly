# PRD-0004: Vocal Preferences System & UI Improvements

## Introduction/Overview

This PRD addresses critical issues with the current love song generation platform where user vocal preferences (language, voice gender, age/tone) are not being captured, stored, or passed to the Suno AI music generation API. Additionally, the UI has layout problems where the chat interface crowds out the concept lyrics panel, and refined lyrics display raw JSON instead of formatted text.

**Current Problems:**
1. User requests specific vocal characteristics (e.g., "female voice, 30-40 years old, dark tone, English") but the system generates music with incorrect characteristics (Dutch lyrics with male voice)
2. Vocal preferences collected during conversation are not persisted or used during music generation
3. Chat interface pushes concept lyrics panel out of view as conversation grows
4. Refined lyrics show raw JSON instead of formatted, human-readable text
5. No way for users to review or adjust detected preferences before generation

**Goal:** Create an intelligent system that captures, displays, and correctly applies user vocal preferences throughout the song creation process, while improving the UI to maintain visibility of all important information.

## Goals

1. **Intelligent Preference Capture**: AI automatically detects vocal preferences (language, gender, age/tone) from conversation context
2. **User Control & Visibility**: Display detected preferences in an interactive UI panel where users can review and adjust before generation
3. **Persistent Storage**: Store preferences at both conversation and song level for reuse and refinement
4. **Accurate Music Generation**: Pass preferences correctly to Suno API to ensure generated music matches user expectations
5. **Improved Layout**: Maintain visibility of both chat and concept lyrics throughout the conversation flow
6. **Professional Lyrics Display**: Show formatted, readable lyrics instead of raw JSON

## User Stories

### Story 1: Language & Voice Specification
**As a** user creating a love song
**I want to** specify the language and vocal characteristics I prefer
**So that** the generated song matches my vision and the recipient's preferences

**Acceptance Criteria:**
- User can mention preferences naturally in conversation (e.g., "I want English lyrics with a mature female voice")
- System detects and highlights these preferences in a visible panel
- User can modify detected preferences before generating music
- Final generated song matches the specified preferences

### Story 2: Smart Preference Detection
**As a** user having a conversation about my relationship
**I want** the system to intelligently infer preferences from my conversation
**So that** I don't have to explicitly answer tedious forms

**Acceptance Criteria:**
- If user types in English, system assumes English lyrics by default
- If user mentions "for my girlfriend" or "for my boyfriend", system infers appropriate voice gender
- System asks confirmation questions when preferences are ambiguous
- Detected preferences appear in real-time as conversation progresses

### Story 3: Preference Adjustment
**As a** user reviewing my draft lyrics
**I want to** easily change the voice type or language before generating music
**So that** I have full control over the final output

**Acceptance Criteria:**
- Preferences panel shows toggles for gender (Male/Female)
- Language selector with common options (Nederlands, English, Français, Español)
- Voice tone/age dropdown (Young 20-30, Mature 30-40, Warm/Deep 40+)
- Changes are saved and immediately reflected in generation parameters

### Story 4: Consistent Layout
**As a** user engaged in a conversation
**I want** to see both the chat history and my evolving lyrics concept simultaneously
**So that** I can reference both while providing feedback

**Acceptance Criteria:**
- Desktop: Split screen with scrollable chat (left) and fixed concept panel (right)
- Mobile: Tabbed interface to switch between chat and concept
- No content is pushed off-screen during normal conversation flow
- Both panels are accessible at all times

### Story 5: Readable Lyrics
**As a** user viewing refined lyrics
**I want** to see formatted, readable text with proper structure
**So that** I can evaluate the quality before generating music

**Acceptance Criteria:**
- Lyrics display shows title, style description, and formatted lyrics text
- Section labels like [Verse], [Chorus], [Bridge] are clearly visible
- No raw JSON or technical formatting is exposed to the user
- Text is properly line-broken and spaced for readability

## Functional Requirements

### FR1: Extended Context Extraction
**Priority: High**

1.1. The system MUST extend the `ExtractedContext` interface to include:
   - `language?: string` - Preferred song language (ISO code or full name)
   - `vocalGender?: 'male' | 'female' | 'neutral'` - Preferred voice gender
   - `vocalAge?: 'young' | 'mature' | 'deep'` - Preferred voice age/tone
   - `vocalDescription?: string` - Freeform description (e.g., "soulful", "powerful")

1.2. The context extraction AI agent MUST analyze conversation messages for vocal preference keywords:
   - Language indicators: "English", "Nederlands", "Français", language of user input
   - Gender indicators: "female voice", "man singing", "vrouwenstem", "male vocals"
   - Age/tone indicators: "mature", "young", "20-30 years", "dark voice", "warm tone"

1.3. The extraction system MUST store detected preferences in `conversations.extractedContext` as JSON

### FR2: Interactive Preferences Panel
**Priority: High**

2.1. The concept lyrics panel MUST include an "Audio Preferences" section above the lyrics display

2.2. The preferences section MUST display:
   - **Language Toggle/Selector**:
     - For ≤3 options: Toggle buttons (Nederlands | English | Français)
     - For >3 options: Dropdown select menu
     - Default: Auto-detected from conversation

   - **Voice Gender**: Toggle buttons (Male | Female)
     - Default: Auto-detected or neutral

   - **Voice Tone**: Dropdown selector
     - Options: "Young & Bright (20-30)", "Mature & Warm (30-40)", "Deep & Soulful (40+)"
     - Default: "Mature & Warm (30-40)"

2.3. All controls MUST show the currently detected/selected value with visual highlighting

2.4. Changes to preferences MUST immediately update the stored `extractedContext` in the database

2.5. Preferences MUST be editable at any time before music generation

### FR3: Enhanced Suno API Integration
**Priority: High**

3.1. The system MUST construct enhanced Suno API requests that include vocal preferences in the `prompt` parameter

3.2. The `prompt` parameter MUST be enriched with natural language descriptions:
   - Language: "Sung in English" or "In het Nederlands gezongen"
   - Gender: "female vocals" or "male singer"
   - Tone: "mature voice, 30-40 years old" or "young energetic vocals"

3.3. Example prompt format:
   ```
   [Original Lyrics]

   Sung in English by a mature female voice (30-40 years old) with a warm, soulful tone.
   ```

3.4. The `tags` parameter MUST also reference vocal characteristics:
   - Example: "romantic ballad, female vocals, soulful, English"

3.5. When Suno API adds `vocalGender` parameter support, the system MUST use it in addition to text descriptions

### FR4: Dual-Level Preference Storage
**Priority: Medium**

4.1. The system MUST store preferences at the conversation level:
   - Location: `conversations.extractedContext` JSON field
   - Purpose: Default preferences for all songs in this conversation

4.2. The system MUST store preferences at the song level:
   - Location: `songs.generationParams` JSON field
   - Purpose: Song-specific overrides and generation history

4.3. Song-level preferences MUST take precedence over conversation-level defaults

4.4. When generating music, the system MUST:
   - Read conversation-level preferences as defaults
   - Check for song-level overrides
   - Merge both into final generation parameters

### FR5: Responsive Two-Column Layout
**Priority: High**

5.1. **Desktop Layout (≥1024px):**
   - The interface MUST use a two-column grid layout
   - Left column (60% width): Scrollable chat message history
   - Right column (40% width): Fixed/sticky concept lyrics panel with preferences
   - Both columns MUST be visible simultaneously at all times
   - Chat container MUST have `overflow-y: auto` with max-height constraint

5.2. **Tablet Layout (768px - 1023px):**
   - Similar to desktop but with 50/50 column split
   - Option to collapse concept panel into overlay

5.3. **Mobile Layout (<768px):**
   - The interface MUST switch to a tabbed view
   - Tab 1: "Chat" - Full-width chat interface
   - Tab 2: "Concept" - Full-width concept lyrics panel
   - Active tab indicator with smooth transitions
   - Tab state persists during session

5.4. The layout MUST use modern CSS:
   - CSS Grid for desktop columns
   - Flexbox for mobile tabs
   - Smooth transitions between breakpoints
   - No content hidden or pushed off-screen

### FR6: Formatted Lyrics Display
**Priority: High**

6.1. When displaying lyrics from JSON response, the system MUST:
   - Parse the JSON string safely with error handling
   - Extract `title`, `lyrics`, and `style` fields
   - Display them in a formatted view

6.2. The formatted display MUST include:
   - **Title**: Displayed as heading (h3) with prominent styling
   - **Style**: Displayed as subtitle with muted color
   - **Lyrics**: Displayed with preserved line breaks and section labels

6.3. Section labels in lyrics (e.g., [Verse 1], [Chorus]) MUST be:
   - Visually distinct (bold or colored)
   - Properly spaced from content
   - Not removed or hidden

6.4. The system MUST handle parsing errors gracefully:
   - If JSON parsing fails, display raw text as fallback
   - Log error for debugging but don't crash UI

6.5. No raw JSON or technical metadata MUST be visible to end users

## Non-Goals (Out of Scope)

1. **Voice Cloning**: We will NOT implement custom voice cloning or sample uploads (Suno API limitation)
2. **Multi-Language Mixing**: We will NOT support songs with mixed languages in same track
3. **Voice Effects**: We will NOT add reverb, pitch, or other audio effects (handled by Suno)
4. **Preference Profiles**: We will NOT store user preference profiles across multiple conversations (future enhancement)
5. **Advanced Voice Customization**: We will NOT support fine-grained voice tuning beyond gender/age/tone
6. **Real-Time Voice Preview**: We will NOT preview voice changes before full generation

## Design Considerations

### UI Component Structure

```
ConceptLyricsPanel
├─ AudioPreferencesSection
│  ├─ LanguageSelector (toggle/dropdown)
│  ├─ GenderToggle (male/female)
│  └─ ToneSelector (dropdown)
├─ LyricsDisplay
│  ├─ Title (h3)
│  ├─ Style (subtitle)
│  └─ FormattedLyrics (pre-wrap)
└─ ActionButtons
   └─ GenerateMusicButton
```

### Responsive Layout Sketch

**Desktop:**
```
┌──────────────────┬───────────────────┐
│  Chat Messages   │  Concept Panel    │
│  (scrollable)    │  - Preferences    │
│                  │  - Lyrics         │
│  [input box]     │  [Generate Btn]   │
└──────────────────┴───────────────────┘
```

**Mobile:**
```
┌─────────────────────────────────────┐
│  [ Chat | Concept ]  <-- Tabs      │
├─────────────────────────────────────┤
│                                     │
│  Active Tab Content                 │
│  (full width)                       │
│                                     │
└─────────────────────────────────────┘
```

### Color/Style Guidelines

- **Preferences Panel**: Light background (white/90 opacity), subtle border
- **Active Toggle**: Primary color (#7f5af0 purple gradient)
- **Inactive Toggle**: Neutral gray with hover effect
- **Dropdowns**: Match existing design system (white background, subtle shadow)
- **Section Labels**: Uppercase, letter-spaced, muted color (existing pattern)

## Technical Considerations

### Database Schema Changes

1. **Add fields to `conversations` entity:**
   ```typescript
   // Already exists: extractedContext: i.string().optional()
   // Extend JSON structure to include vocal preferences
   ```

2. **Extend `songs` entity (if needed):**
   ```typescript
   // Already exists: generationParams: i.string().optional()
   // Use this for song-specific preference overrides
   ```

3. **No new entities required** - use existing JSON fields for storage

### Context Extraction Prompt Update

Update `EXTRACTION_PROMPT` in `src/lib/utils/contextExtraction.ts` to include:

```
6. **Language**: Detected language preference (Nederlands, English, etc.)
7. **Vocal Gender**: Preferred voice gender if mentioned (male, female)
8. **Vocal Tone**: Preferred voice age/tone (young, mature, deep)
```

Return format:
```json
{
  ...existing fields...,
  "language": "English",
  "vocalGender": "female",
  "vocalAge": "mature",
  "vocalDescription": "warm and soulful"
}
```

### Suno API Enhancement

Update `src/app/api/suno/route.ts` to:

1. Read preferences from `songs.generationParams` or `conversations.extractedContext`
2. Construct enhanced prompt with vocal descriptions
3. Add vocal keywords to `tags` parameter

Example:
```typescript
const vocalDescription = buildVocalDescription(preferences);
const enhancedPrompt = `${lyrics}\n\n${vocalDescription}`;
const enhancedTags = `${musicStyle}, ${preferences.vocalGender} vocals, ${preferences.language}`;
```

### InstantDB Query Updates

Update queries to fetch `extractedContext`:

```typescript
conversations: {
  $: { where: { id: conversationId } },
  messages: {},
  songs: {}
}
```

Parse and use the extracted context for preferences panel.

### Error Handling

1. **JSON Parsing Errors**: Wrap all `JSON.parse()` calls in try-catch
2. **Missing Preferences**: Provide sensible defaults (English, Female, Mature)
3. **API Failures**: Show user-friendly error messages
4. **Layout Breakpoints**: Test on multiple screen sizes

## Success Metrics

1. **Preference Accuracy**: ≥95% of songs match user-specified vocal characteristics
2. **User Satisfaction**: ≥90% of users report preferences were correctly applied (survey)
3. **Reduced Iterations**: Average refinement rounds decrease from 3 to 1.5
4. **Layout Usability**: ≥95% of users can see both chat and concept simultaneously on desktop
5. **Error Rate**: <1% of lyrics displays show raw JSON
6. **Mobile Adoption**: ≥80% of mobile users successfully use tab interface

## Open Questions

1. **Preference Persistence**: Should we store user's preferred voice across conversations (user profile)?
2. **Language Detection**: Should we auto-detect language from user's browser/IP, or always ask?
3. **Voice Samples**: Would short voice samples help users choose tone? (Suno API limitation)
4. **Preference Suggestions**: Should AI suggest voice type based on song mood/genre?
5. **Accessibility**: Do we need voice descriptions for screen readers?
6. **Testing**: How do we validate that Suno correctly interprets our vocal descriptions?
7. **Cost**: Does adding vocal descriptions to prompts increase Suno API usage/cost?

## Implementation Notes

### Phase 1: Core Functionality (Week 1)
- Extend ExtractedContext interface
- Update context extraction AI prompt
- Add vocal preference storage to database
- Build Suno API parameter enrichment

### Phase 2: UI Components (Week 1-2)
- Create AudioPreferencesSection component
- Implement language selector
- Implement gender toggle
- Implement tone dropdown
- Add preference change handlers

### Phase 3: Layout Redesign (Week 2)
- Implement responsive two-column layout
- Add mobile tab interface
- Test across breakpoints
- Add smooth transitions

### Phase 4: Lyrics Display Fix (Week 2)
- Add JSON parsing utility
- Create FormattedLyricsDisplay component
- Add error boundaries
- Test with various JSON structures

### Phase 5: Testing & Refinement (Week 3)
- Integration testing
- User acceptance testing
- Performance optimization
- Bug fixes

## Related Documents

- Suno API Documentation: `/prompts/sunomanual.md`
- InstantDB Schema: `/src/instant.schema.ts`
- Context Types: `/src/types/conversation.ts`
- Existing Layout: `/src/app/page.tsx`

---

**Document Version:** 1.0
**Created:** 2025-01-09
**Status:** Draft - Pending Review
**Next Steps:** Review with team → Approve → Begin Implementation

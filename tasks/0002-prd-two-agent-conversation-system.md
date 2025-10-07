# PRD-0002: Two-Agent Conversation System for Love Song Generation

## Introduction/Overview

The current single-agent chat system generates song lyrics too early (after 1-2 user messages) with insufficient context, resulting in generic, non-personalized songs. This PRD defines a **two-agent architecture** that separates conversation intelligence from lyrics generation, ensuring high-quality, deeply personalized love songs.

**Problem**: Users receive generic lyrics after minimal interaction because one LLM tries to both conduct conversation AND generate lyrics, leading to premature generation.

**Solution**: Split responsibilities between two specialized agents:
1. **Conversation Agent**: Expert interviewer that gathers rich, detailed relationship information through 6-8+ rounds of natural dialogue
2. **Lyrics Agent**: Expert songwriter that transforms gathered context into high-quality, personalized Suno-ready lyrics

## Goals

1. **Gather Rich Context**: Collect 6-8+ conversation rounds of detailed information before lyrics generation
2. **Natural Conversation Flow**: Conversation agent asks follow-up questions, probes deeper, builds rapport
3. **High-Quality Lyrics**: Lyrics agent receives comprehensive context to create truly personalized songs
4. **Clear Separation**: Each agent has a specialized role with optimized system prompts
5. **User Control**: User can trigger lyrics generation early if desired, or continue refining

## User Stories

1. **As a user**, I want to have a natural conversation about my relationship so that the AI understands what makes it special
2. **As a user**, I want the AI to ask me specific questions about memories, emotions, and moments so that the song feels personal
3. **As a user**, I want to see the AI building understanding over multiple messages so that I feel heard and the song reflects our unique story
4. **As a user**, I want the option to say "I'm ready" to generate lyrics early if I've shared enough
5. **As a user**, I want to refine lyrics by providing more context after initial generation

## Functional Requirements

### 1. Conversation Agent

**System Prompt Requirements**:
- Role: Empathetic relationship interviewer specialized in extracting songwriting-worthy details
- Tone: Warm, curious, encouraging (Dutch language)
- Goals:
  - Ask about specific memories (first meeting, favorite moments, challenges overcome)
  - Probe for sensory details (sights, sounds, feelings)
  - Identify unique characteristics of the partner
  - Discover emotional themes (gratitude, longing, joy, comfort)
  - Determine preferred music style/mood
- Constraints:
  - Never generate lyrics
  - Ask 1-2 focused questions per response
  - Build on previous answers
  - Use conversational markers ("Wat mooi!", "Vertel me meer over...")
  - Minimum 6 conversation rounds before considering transition to lyrics agent

**API Integration**:
- Model: `deepseek/deepseek-chat-v3.1:free` (via OpenRouter)
- Endpoint: `/api/chat/conversation`
- Input: Full conversation history
- Output:
  ```json
  {
    "type": "conversation",
    "message": "AI response text",
    "roundNumber": 3,
    "readinessScore": 0.4,  // 0-1 scale, how ready for lyrics generation
    "extractedContext": {
      "memories": ["..."],
      "emotions": ["..."],
      "characteristics": ["..."],
      "musicStyle": "..."
    }
  }
  ```

### 2. Lyrics Generation Agent

**System Prompt Requirements**:
- Role: Professional songwriter for romantic, personal love songs
- Input: Complete conversation transcript + extracted context
- Expertise:
  - Suno-optimized lyrics structure ([Couplet], [Refrein], [Bridge])
  - Emotional authenticity without clichés
  - Incorporation of specific details from conversation
  - Natural Dutch phrasing and meter
  - Style-appropriate language (acoustic ballad vs upbeat pop)
- Output: Complete song with title, lyrics, style tags

**API Integration**:
- Model: `deepseek/deepseek-chat-v3.1:free` (via OpenRouter)
- Endpoint: `/api/chat/generate-lyrics`
- Input:
  ```json
  {
    "conversationTranscript": "Full conversation text",
    "extractedContext": {
      "memories": [...],
      "emotions": [...],
      "characteristics": [...],
      "musicStyle": "..."
    },
    "userPreferences": {
      "tempo": "slow/medium/upbeat",
      "instrumentation": "acoustic/electronic/orchestral"
    }
  }
  ```
- Output:
  ```json
  {
    "type": "lyrics_generated",
    "title": "Song Title",
    "lyrics": "Full lyrics with sections",
    "style": "Suno style description",
    "reasoning": "Why these themes were chosen (for transparency)"
  }
  ```

### 3. Conversation Flow Logic

**Minimum Rounds Before Lyrics**:
- Default: 6 rounds (configurable via `MIN_CONVERSATION_ROUNDS` env var)
- Conversation agent calculates `readinessScore` based on:
  - Number of distinct memories shared
  - Emotional depth of responses
  - Specificity of details
  - Music style clarity

**Transition Triggers**:
1. **Auto-trigger**: `roundNumber >= MIN_CONVERSATION_ROUNDS AND readinessScore >= 0.7`
2. **User-trigger**: User says "maak het liedje" or "ik ben klaar" or similar intent
3. **Max-rounds**: After `MAX_CONVERSATION_ROUNDS` (default: 10), always transition

**Transition Message**:
```
"Dank je wel voor het delen van deze mooie herinneringen! 💕
Ik heb nu genoeg inspiratie om een persoonlijk liefdesliedje voor [partner] te schrijven.
Geef me een momentje..."
```

### 4. UI Integration

**Chat Display**:
- Show conversation agent responses normally
- When transitioning to lyrics agent, show loading indicator: "Lyrics worden gegenereerd..."
- Display generated lyrics in formatted card (NOT raw JSON)

**Lyrics Panel Updates**:
- Show "Gathering inspiration..." during conversation phase
- Display generated lyrics with sections clearly marked
- Show version history if lyrics are refined

**User Controls**:
- "Genereer nu" button appears after round 4
- "Meer vertellen" to continue conversation
- "Verfijn lyrics" after generation to provide more context

### 5. Context Extraction & Storage

**Extracted Context Schema** (stored in conversation entity):
```typescript
interface ExtractedContext {
  memories: string[];           // Specific memories shared
  emotions: string[];           // Emotional themes (warmth, longing, joy)
  partnerTraits: string[];      // Characteristics of partner
  relationshipLength?: string;  // Duration if mentioned
  musicStyle?: string;          // Preferred style/mood
  specialMoments?: string[];    // Birthdays, anniversaries, etc.
}
```

**Storage**:
- Update conversation entity's `extractedContext` field after each conversation agent response
- Pass cumulative context to lyrics agent when transitioning

## Non-Goals (Out of Scope)

1. Voice input/output (text only for now)
2. Multi-language support (Dutch only in v1)
3. Multiple song versions generated simultaneously
4. Integration with third-party lyric databases
5. Advanced music theory validation (trust Suno's interpretation)

## Design Considerations

**UI/UX**:
- Keep chat interface simple and familiar
- Use visual indicators to show conversation progress (e.g., "3/6 rounds")
- Display extracted context in sidebar as conversation progresses (optional transparency feature)
- Clear visual distinction between "gathering info" and "generating lyrics" phases

**Components**:
- `ConversationAgent.tsx` - Handles conversation flow UI
- `LyricsAgent.tsx` - Displays lyrics generation status
- `ContextSidebar.tsx` - Optional: shows extracted themes in real-time

## Technical Considerations

**API Routes**:
```
/api/chat/conversation  - POST - Conversation agent endpoint
/api/chat/generate-lyrics  - POST - Lyrics generation endpoint
/api/chat/refine-lyrics  - POST - Lyrics refinement with additional context
```

**State Management**:
- Track `conversationPhase`: 'gathering' | 'generating' | 'refining' | 'complete'
- Store `extractedContext` in conversation state
- Maintain `roundNumber` counter

**Error Handling**:
- If conversation agent fails: "Sorry, ik kon je niet goed verstaan. Kun je het opnieuw proberen?"
- If lyrics agent fails: "Er ging iets mis bij het genereren. Laten we nog een detail toevoegen en opnieuw proberen."

**Performance**:
- Conversation agent: Target <2s response time
- Lyrics agent: Target <5s response time (more complex generation)
- Use streaming responses for better perceived performance

**Backwards Compatibility**:
- Keep existing `/api/chat` route for fallback
- Migrate incrementally to new two-agent system
- Use feature flag `ENABLE_TWO_AGENT_SYSTEM=true`

## Success Metrics

1. **Conversation Depth**: Average conversation rounds before lyrics generation ≥ 6
2. **User Satisfaction**: Post-generation survey asking "Does this song feel personal?" - target 80%+ yes
3. **Lyrics Quality**: Reduced instances of generic phrases (measure via keyword analysis)
4. **Completion Rate**: % of users who complete full conversation flow and generate lyrics - target 70%+
5. **Refinement Rate**: % of users who refine lyrics after initial generation - target 30%+ (shows engagement)

## Open Questions

1. **Context Extraction Method**: Should we use a third micro-agent to extract/summarize context from conversation, or have the conversation agent self-extract?
2. **Multi-turn Refinement**: How many refinement rounds should we allow before suggesting the user is satisfied?
3. **Context Visualization**: Should users see the extracted context (transparency) or keep it hidden (magic)?
4. **Conversation Templates**: Should we create conversation "paths" based on song type (romantic, funny, nostalgic) or keep it fully dynamic?
5. **Quality Assurance**: Should we validate lyrics before showing to user (e.g., check for proper Suno formatting)?

## Implementation Phases

**Phase 1 - Core Two-Agent System** (Week 1):
- Create conversation agent system prompt and `/api/chat/conversation` endpoint
- Create lyrics agent system prompt and `/api/chat/generate-lyrics` endpoint
- Implement conversation flow logic with round counting and transition triggers
- Update UI to handle two-phase flow

**Phase 2 - Context Extraction & Enhancement** (Week 2):
- Build context extraction logic
- Store extracted context in conversation entity
- Display context in lyrics panel during conversation
- Add "Genereer nu" early trigger button

**Phase 3 - Refinement & Polish** (Week 3):
- Implement lyrics refinement endpoint
- Add version history tracking
- Improve conversation agent prompts based on testing
- Add progress indicators and better loading states

**Phase 4 - Testing & Optimization** (Week 4):
- User testing with real conversations
- Optimize system prompts based on feedback
- Fine-tune readiness score calculation
- Performance optimization

## Example Conversation Flow

**Round 1**:
- User: "ik wil een lied maken voor mijn vriendin"
- Conversation Agent: "Wat leuk! Vertel me eens, hoe hebben jullie elkaar ontmoet?"

**Round 2**:
- User: "we ontmoetten elkaar in de trein naar Amsterdam"
- Conversation Agent: "Wat romantisch! Wat was het eerste wat je opviel aan haar?"

**Round 3**:
- User: "haar lach, ze lachte om iets grappigs buiten"
- Conversation Agent: "Prachtig! Kun je me een moment vertellen waarop je dacht: dit is de ware?"

**Round 4**:
- User: "toen ze bij me bleef tijdens mijn ziekenhuisopname"
- Conversation Agent: "Wat bijzonder dat ze er toen voor je was. Welke eigenschap van haar waardeer je het meest?"

**Round 5**:
- User: "haar geduld en positiviteit"
- Conversation Agent: "Mooi! Als je het liedje in een woord zou beschrijven, wat zou dat zijn? (bijv. romantisch, dankbaar, vrolijk)"

**Round 6**:
- User: "dankbaar"
- Conversation Agent: "Perfect! Wil je een rustig akoestisch liedje, of iets met meer tempo?"

**Round 7**:
- User: "rustig akoestisch"
- Conversation Agent: "Dank je wel voor deze mooie herinneringen! 💕 Ik ga nu een persoonlijk liefdesliedje schrijven..."
- *[Transitions to Lyrics Agent]*

**Lyrics Generated**:
```
Title: "Jouw Lach in de Trein"
Style: "intimate acoustic ballad with fingerpicked guitar and warm vocals"

[Couplet 1]
Die dag in de trein naar Amsterdam
Zag ik je lachen om iets buiten
En zonder dat ik het toen begreep
Veranderde mijn hele leven

[Refrein]
Jouw geduld, jouw licht in donkere dagen
Toen ik ziek was, bleef je bij me waken
Jouw positiviteit houdt me staande
Ik ben zo dankbaar dat je van me houdt
...
```

## Conclusion

This two-agent system will dramatically improve song personalization by:
1. Gathering rich, detailed context through natural conversation
2. Separating conversation intelligence from creative lyrics generation
3. Giving each agent a specialized role with optimized prompting
4. Ensuring users feel heard and understood before lyrics are created

The result: deeply personal, emotionally resonant love songs that users will be proud to share with their partners.

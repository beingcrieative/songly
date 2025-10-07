# Tasks: Two-Agent Conversation System for Love Song Generation

Based on PRD-0002: Two-Agent Conversation System

## Relevant Files

### New Files to Create
- `src/types/conversation.ts` - TypeScript types for ExtractedContext, ConversationPhase, and API responses
- `src/app/api/chat/conversation/route.ts` - Conversation agent endpoint for gathering context
- `src/app/api/chat/generate-lyrics/route.ts` - Lyrics generation agent endpoint
- `src/app/api/chat/refine-lyrics/route.ts` - Lyrics refinement endpoint
- `src/lib/prompts/conversationAgent.ts` - Conversation agent system prompt
- `src/lib/prompts/lyricsAgent.ts` - Lyrics generation agent system prompt
- `src/lib/utils/contextExtraction.ts` - Context extraction utilities
- `src/lib/utils/readinessScore.ts` - Readiness score calculation logic
- `src/types/conversation.ts` - TypeScript types for conversation flow

### Existing Files to Modify
- `src/instant.schema.ts` - Add extractedContext, conversationPhase, roundNumber, and readinessScore fields to conversations entity
- `src/app/studio/page.tsx` - Update to use two-agent system with phase tracking
- `src/components/LyricsPanel.tsx` - Update to show context extraction progress
- `src/components/ComposerControls.tsx` - Add "Genereer nu" early trigger button
- `src/app/api/chat/route.ts` - Keep as fallback, add feature flag check
- `.env` - Add MIN_CONVERSATION_ROUNDS, MAX_CONVERSATION_ROUNDS, ENABLE_TWO_AGENT_SYSTEM

### Notes
- Environment variables should be added to `.env` with sensible defaults
- Feature flag `ENABLE_TWO_AGENT_SYSTEM=true` allows gradual rollout
- Keep existing `/api/chat` route functional as fallback
- InstantDB schema changes require `npx instant-cli push` after modification

## Tasks

- [x] 1.0 Update Database Schema and Environment Configuration
  - [x] 1.1 Add `extractedContext` field to conversations entity in `src/instant.schema.ts` (type: `i.string().optional()` to store JSON)
  - [x] 1.2 Add `conversationPhase` field to conversations entity (type: `i.string().indexed().optional()` - values: 'gathering' | 'generating' | 'refining' | 'complete')
  - [x] 1.3 Add `roundNumber` field to conversations entity (type: `i.number().optional()`)
  - [x] 1.4 Add `readinessScore` field to conversations entity (type: `i.number().optional()`)
  - [x] 1.5 Create TypeScript types file at `src/types/conversation.ts` with ExtractedContext interface matching PRD schema
  - [x] 1.6 Add environment variables to `.env`: `MIN_CONVERSATION_ROUNDS=6`, `MAX_CONVERSATION_ROUNDS=10`, `ENABLE_TWO_AGENT_SYSTEM=true`
  - [x] 1.7 Run `npx instant-cli push` to sync schema changes to InstantDB (NOTE: Requires manual `npx instant-cli login` first if not already logged in)
  - [x] 1.8 Verify schema changes in InstantDB dashboard (User action required)

- [x] 2.0 Create Conversation Agent System
  - [x] 2.1 Create `src/lib/prompts/conversationAgent.ts` with detailed system prompt (based on PRD requirements: empathetic interviewer, asks 1-2 questions, builds on answers, minimum 6 rounds, never generates lyrics)
  - [x] 2.2 Create `src/lib/utils/contextExtraction.ts` with function to extract structured context from conversation history (memories, emotions, characteristics, musicStyle)
  - [x] 2.3 Create `src/lib/utils/readinessScore.ts` with function to calculate readiness score (0-1) based on: number of memories, emotional depth, specificity, music style clarity
  - [x] 2.4 Create API route `src/app/api/chat/conversation/route.ts` that accepts POST with conversation history
  - [x] 2.5 In conversation route, call OpenRouter with conversation agent system prompt and full message history
  - [x] 2.6 After receiving AI response, call contextExtraction to update extracted context
  - [x] 2.7 Calculate readinessScore using readinessScore utility
  - [x] 2.8 Return JSON response: `{ type: 'conversation', message, roundNumber, readinessScore, extractedContext }`
  - [x] 2.9 Add error handling for OpenRouter API failures with user-friendly Dutch error messages

- [x] 3.0 Create Lyrics Generation Agent System
  - [x] 3.1 Create `src/lib/prompts/lyricsAgent.ts` with detailed system prompt (based on PRD: professional songwriter, Suno-optimized structure, incorporates specific details, natural Dutch phrasing)
  - [x] 3.2 Create API route `src/app/api/chat/generate-lyrics/route.ts` that accepts POST with conversationTranscript and extractedContext
  - [x] 3.3 Build comprehensive prompt combining conversation transcript + extracted context + user preferences
  - [x] 3.4 Call OpenRouter with lyrics agent system prompt and generation request
  - [x] 3.5 Parse response to extract title, lyrics, style, and reasoning
  - [x] 3.6 Validate lyrics format (check for proper sections: [Couplet], [Refrein], [Bridge])
  - [x] 3.7 Return JSON response: `{ type: 'lyrics_generated', title, lyrics, style, reasoning }`
  - [x] 3.8 Add error handling with fallback to simpler prompt if validation fails

- [x] 4.0 Implement Conversation Flow Logic and State Management
  - [x] 4.1 Update `src/app/studio/page.tsx` to track conversationPhase state ('gathering' | 'generating' | 'refining' | 'complete')
  - [x] 4.2 Add roundNumber counter state that increments after each user message
  - [x] 4.3 Add extractedContext state to store cumulative context from conversation agent
  - [x] 4.4 Add readinessScore state to track when ready for lyrics generation
  - [x] 4.5 Implement transition logic: check if `roundNumber >= MIN_CONVERSATION_ROUNDS AND readinessScore >= 0.7`
  - [x] 4.6 Implement user-triggered transition: detect intent phrases ("maak het liedje", "ik ben klaar", "genereer nu") in user messages
  - [x] 4.7 Implement max-rounds trigger: force transition after MAX_CONVERSATION_ROUNDS
  - [x] 4.8 When transitioning, show transition message: "Dank je wel voor het delen van deze mooie herinneringen! 💕..."
  - [x] 4.9 Update conversation entity in InstantDB with phase, roundNumber, extractedContext, readinessScore after each message
  - [x] 4.10 Add feature flag check: if `ENABLE_TWO_AGENT_SYSTEM !== 'true'`, fall back to existing `/api/chat` route

- [x] 5.0 Update UI Components for Two-Phase Flow
  - [x] 5.1 Update `src/app/studio/page.tsx` handleSendMessage to call `/api/chat/conversation` instead of `/api/chat` when in 'gathering' phase
  - [x] 5.2 Update message handling to store extractedContext and readinessScore from conversation agent response
  - [x] 5.3 Update `src/components/LyricsPanel.tsx` to show "Gathering inspiration..." message during 'gathering' phase
  - [x] 5.4 Add progress indicator in LyricsPanel showing "Round X/6" during gathering phase
  - [x] 5.5 Display extracted context themes in LyricsPanel as conversation progresses (optional transparency feature)
  - [x] 5.6 Update `src/components/ComposerControls.tsx` to show "Genereer nu" button after round 4 when readinessScore > 0.5
  - [x] 5.7 Add onClick handler for "Genereer nu" button that triggers transition to lyrics generation
  - [x] 5.8 Update chat display in studio page to properly format and display generated lyrics (NOT raw JSON) in a card component
  - [x] 5.9 Add loading indicator "Lyrics worden gegenereerd..." when transitioning to 'generating' phase
  - [x] 5.10 Update LyricsPanel to display generated lyrics with sections clearly marked ([Couplet], [Refrein], [Bridge])

- [ ] 6.0 Add Lyrics Refinement Capability
  - [ ] 6.1 Create API route `src/app/api/chat/refine-lyrics/route.ts` that accepts POST with previous lyrics and user feedback
  - [ ] 6.2 Build refinement prompt that includes previous lyrics + user feedback + conversation context
  - [ ] 6.3 Call OpenRouter with lyrics agent system prompt and refinement request
  - [ ] 6.4 Parse and validate refined lyrics response
  - [ ] 6.5 Create new lyric_version entity in InstantDB with incremented version number
  - [ ] 6.6 Link lyric_version to conversation and update hash for deduplication
  - [ ] 6.7 Update `src/components/LyricsPanel.tsx` to show "Verfijn lyrics" button after lyrics are generated
  - [ ] 6.8 Add refinement input UI in LyricsPanel for users to describe desired changes
  - [ ] 6.9 Display version history in LyricsPanel showing all previous lyric versions
  - [ ] 6.10 Allow users to switch between lyric versions and select preferred version

- [ ] 7.0 Testing and Optimization
  - [ ] 7.1 Test conversation flow with minimal input (1-2 word responses) - should ask follow-up questions
  - [ ] 7.2 Test conversation flow with detailed input (paragraph responses) - should build on details
  - [ ] 7.3 Test auto-transition trigger at round 6 with high readiness score
  - [ ] 7.4 Test user-triggered transition with "maak het liedje" phrase before round 6
  - [ ] 7.5 Test max-rounds trigger at round 10 even with low readiness score
  - [ ] 7.6 Test context extraction accuracy - verify memories, emotions, characteristics are captured
  - [ ] 7.7 Test readiness score calculation with various conversation qualities
  - [ ] 7.8 Test lyrics generation quality - verify specific details from conversation appear in lyrics
  - [ ] 7.9 Test lyrics formatting - verify proper Suno sections ([Couplet], [Refrein], [Bridge])
  - [ ] 7.10 Test error handling: OpenRouter API failures, invalid responses, network issues
  - [ ] 7.11 Test refinement flow: generate lyrics → provide feedback → verify refined lyrics incorporate feedback
  - [ ] 7.12 Performance test: measure conversation agent response time (target <2s)
  - [ ] 7.13 Performance test: measure lyrics generation response time (target <5s)
  - [ ] 7.14 Test feature flag: verify fallback to old `/api/chat` route when ENABLE_TWO_AGENT_SYSTEM=false
  - [ ] 7.15 Test in development mode (DEV_MODE=true) without authentication
  - [ ] 7.16 User acceptance testing: conduct 3-5 real conversations and gather feedback on naturalness and lyrics quality

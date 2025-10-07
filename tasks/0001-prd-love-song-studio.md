# PRD: Love Song Studio Conversational Flow

## Introduction / Overview
Design an AI-assisted studio experience that helps someone compose a personalized love song for a partner, spouse, or significant other. The feature replaces static e-cards with a guided conversation that captures the sender's sentiments and continuously sculpts lyrics in real time. It must create a clear, compassionate interaction model where conversation, composer controls, and evolving lyrics feel tightly connected.

## Goals
- Deliver an uninterrupted back-and-forth between user and AI that feels like co-writing a love letter in song form.
- Surface context-aware composer controls that adapt to the latest conversation intent.
- Keep the concept lyrics panel transparently synchronized with the most recent AI lyric revision.

## User Stories
- As a romantic gift-giver, I want to chat with the AI in natural language so it can learn about my loved one and craft a tailored song message.
- As a user refining the song, I want composer options to shift based on the latest conversation so I can adjust tone, mood, or structure without hunting through menus.
- As someone previewing the result, I want the lyrics panel to update after each exchange so I can see how the song evolves before sharing it.

## Functional Requirements
1. Provide a conversational UI with an input field and send affordances, ensuring message history is always visible.
2. Desktop layout uses a split view: left pane for chat/composer, right pane for lyrics & version list; mobile stacks chat/composer above the lyrics panel with smooth transitions.
3. Persist every chat turn (user and AI) to InstantDB with metadata for speaker, timestamp, and an optional composer-context payload stored on the existing `messages` entity.
4. Trigger a first LLM call on each user message to craft the AI reply and recommended composer adjustments; store those recommendations alongside the message entry’s composer-context payload.
5. Trigger a second LLM call after the AI reply completes that receives the prior accepted lyric version plus conversation delta, returns an updated lyric draft, and writes it to a new `lyric_versions` collection.
6. Auto-name lyric versions using localized timestamps (e.g., "Verse Update – 14:32") and link them to the conversation/session record and associated `songs` entry.
7. Update the concept lyrics panel by polling InstantDB for the latest lyric version at a quasi real-time cadence (target 3–5s) to comply with current realtime capabilities.
8. Highlight the most recent lyric version in the UI; allow users to expand previous versions for comparison but not manually rename them in this release.
9. Refresh composer controls after each AI response to reflect context-aware suggestions (e.g., mood toggles, section prompts) derived from stored recommendations.
10. Ensure all writes respect InstantDB rules (indexed timestamp fields, proper entity typing) and guard against concurrent writes through optimistic UI or loading states.

## Non-Goals (Out of Scope)
- Audio synthesis or playback of the generated song.
- Manual editing of lyric versions or custom naming beyond the automated timestamp labels.
- Multi-user real-time collaboration; focus on a single user session.
- Offline support or local draft caching beyond InstantDB persistence.

## Design Considerations
- Emphasize emotional clarity: warm palette, prominent love-themed imagery consistent with existing Studio but allow refined patterns for clarity (affordance-first approach).
- Introduce distinct visual zones: conversational pane with message bubbles and composer suggestions clustered near the input, lyrics pane with typographic hierarchy and version chips.
- Maintain mobile-first responsiveness: collapsible lyric preview accessible via swipe/accordion when stacked.
- Provide clear system status cues (typing indicators, polling refresh toasts/spinners) so updates feel alive without appearing jittery.

## Technical Considerations
- Extend the current InstantDB schema: retain existing `conversations`, `messages`, and `songs` entities, add an optional `composerContext` field to `messages`, and introduce a `lyric_versions` entity (`content`, `label`, `createdAt`, `hash`) linked to both `conversations` and `songs`.
- Coordinate schema and rules updates with Instant CLI, ensuring new timestamp/status fields are indexed before deployment.
- Implement two-step LLM workflow with queueing or promise chaining to ensure lyric regeneration waits for the latest conversation delta; budget token usage accordingly.
- Use client-side polling (3–5s) for lyric updates; consider upgrading to WebSocket subscriptions when InstantDB or infrastructure permits.
- Guard against duplicate writes during rapid polling by storing an `updatedAt` hash on lyric versions and checking before rendering.
- Provide analytics hooks to capture how often composer suggestions are applied for future tuning.

## Success Metrics
- 90% of sessions show the latest lyric version within 5 seconds of the most recent AI reply.
- <5% of users abandon before submitting the initial conversation prompt (indicates conversational clarity).
- ≥50% of sessions interact with at least one adaptive composer suggestion.
- User feedback/NPS for this flow exceeds baseline Studio flows by +10 points.

## Open Questions
- What safeguards are needed to keep LLM costs manageable during long conversations (e.g., rate limits, summarization strategies)?
- Should users be able to bookmark or export specific lyric versions mid-flow?
- How will we authenticate and attribute sessions if the sender is unregistered? (e.g., magic link vs. guest tracking)
- Do we need consent or disclaimers when referencing personal details about the loved one in lyrics?

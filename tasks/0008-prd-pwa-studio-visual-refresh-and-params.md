# PRD — PWA Visual Refresh + Parameter Screen Integration (Suno V5)

## 1) Summary
Update the PWA’s visual language (colors, typography, radii, shadows, backgrounds) to match the provided Stitch‑style sample and integrate a dedicated Parameters screen that appears after a lyric variant is chosen and before sending to Suno for audio generation. This work changes look & feel only; no new business logic or flow changes.

## 2) Goals
- Apply the new house style app‑wide (Inter font, primary `#4ade80`, secondary `#20b2aa`, light background, rounded XL, soft shadows, subtle gradients).
- Add a Parameters screen consistent with the provided HTML (Title, Template carousel, Instrumental toggle, Voice selects, Advanced sliders, Confirm).
- Keep existing flows intact: user selects lyrics → Parameters → confirm → existing audio generation path.

## 3) Non‑Goals
- No changes to server routes, Suno API mapping, or conversation logic.
- No redesign of navigation structure or chat interactions.
- No new music parameters beyond those already supported by backend.

## 4) Users & Use Cases
- Mobile users finalizing a song: adjust language/voice/advanced settings prior to generation.
- Desktop users: see updated theme without functional differences.

## 5) Information Architecture & Entry
- Entry: after lyric selection in Studio, open Parameters (sheet/modal on mobile; panel/modal on desktop). Return path: back to lyrics if needed.
- Components reused: existing `ParameterSheet` (styled to match sample), template carousel UI added (cosmetic only).

## 6) UX & UI Requirements
- Typography: Inter (400/500/700/900). Update global layout to load and apply.
- Colors: `primary=#4ade80`, `secondary=#20b2aa`, `background-light=#ffffff`, `background-dark=#211119`. Prefer Tailwind tokens / CSS vars.
- Radii & Shadows: rounded‑xl, card shadows (subtle), soft rings on focus.
- Background: optional light SVG pattern on large surfaces (as in sample) where appropriate.
- Controls:
  - Title: input.
  - Template: horizontal carousel of cards (purely visual; selecting updates current template id).
  - Instrumental: switch.
  - Voice: Language, Gender, Age/Timbre selects.
  - Advanced: sliders for style_weight, weirdness_constraint, audio_weight (0.0–1.0, step 0.1). Show current numeric value.
  - Footer: sticky Confirm button.
- Accessibility: focus states visible; labels associated; minimum contrast 4.5:1 for text.

## 7) Technical Approach
- Theme
  - Add CSS variables in `globals.css` or Tailwind theme extension for primary/secondary/background/radii.
  - Update font stack to Inter in `src/app/layout.tsx` and ensure preload.
  - Sweep core components (buttons, inputs, cards) to adopt tokens.
- Parameters screen
  - Reuse `ParameterSheet` component: restyle with new tokens and structure the layout to mirror provided HTML (no logic changes).
  - Add template carousel UI: map to existing `selectedTemplateId` setter; purely visual cards with image/title.
  - Ensure `Confirm` calls the existing `startMusicGeneration(values)` path with current mapping to `/api/suno`.
- Mobile behavior
  - Present as bottom sheet overlay (80vh max) over chat; sticky footer Confirm. Desktop can use centered modal.

## 8) Analytics & Telemetry
- Log parameter sheet open/close, confirm, and adjustments (coarse‑grained). Reuse existing analytics wrapper if present; otherwise console logs (no new backend).

## 9) Localization
- Dutch baseline; English strings permissible in code comments only. All user‑visible strings to Dutch.

## 10) Acceptance Criteria
- House style applied across Studio, Lyrics overlay, Variant selector, Library shell, basic forms.
- Parameters screen matches supplied design: typography, colors, spacing, radii, shadows, controls, sticky footer.
- Confirm triggers existing music generation; no regressions in flow.
- Voice selects and sliders reflect/set the same values currently sent to backend (language, vocalGender, vocalAge, style_weight, weirdness_constraint, audio_weight, instrumental).
- Mobile: sheet overlays chat without pushing it; input remains reachable; safe‑area respected.

## 11) Rollout Plan
- Feature flag off → develop styles.
- Visual QA on iOS Safari, Android Chrome, desktop Chrome/Firefox.
- Remove flag and ship once parity confirmed.

## 12) Risks & Mitigations
- Visual regressions: snapshot screenshots before/after in key screens.
- Accessibility: verify focus rings & contrast; adjust tokens as needed.
- Overflow in small devices: enforce responsive typography, scrollable content inside sheet.

## 13) Dependencies
- Tailwind theme updates, Inter font import.
- Existing ParameterSheet/Studio flow.

## 14) Open Questions
- Should we persist parameter defaults per template vs per conversation? (Current behavior persists per conversation.)
- Do we show the background pattern globally or only on large sheets/cards?

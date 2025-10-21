# PRD — PWA Visual Refresh (Mobile) + Parameters Screen (Suno V5)

## 1) Introduction / Overview
Refresh the mobile PWA visual language to the provided “Stitch” style and integrate a Parameters screen that appears after a lyric variant is chosen and before sending to Suno for audio generation. This update changes only look & feel; interaction design and data flows remain the same. The app must be primarily Dutch with a secondary English option via a language switcher.

## 2) Goals
- Apply the new house style across all mobile PWA screens (Studio chat + composer, Lyrics overlay/sheet, Variant selector/modal, Library, Auth/Hydration/Error, Mini‑player, NavTabs, forms/modals).
- Add a Parameters screen matching the reference HTML (Title, Template carousel, Instrumental toggle, Voice selects, Advanced sliders, sticky Confirm).
- Provide a language switcher (NL default, EN optional) affecting UI labels only.
- Keep backend mapping and flows intact (consult prompts/sunoapireal.md + src/app/api/suno/route.ts).

## 3) User Stories
- As a mobile user, after selecting lyrics I can adjust parameters (instrumental, language, vocal gender/age, sliders) and confirm to generate audio.
- As a user, I can switch UI labels between Dutch and English.
- As a user, I see a unified, modern style across all screens with unchanged behavior.

## 4) Functional Requirements
1. Theme tokens
   - Colors: primary `#4ade80`, secondary `#20b2aa`, background‑light `#ffffff`, background‑dark `#211119`.
   - Typography: Inter 400/500/700/900; update global font in layout.
   - Radii/Shadows: rounded‑xl, soft shadows; visible focus rings.
   - Background pattern: subtle light SVG only on large sheets/cards (not global).
2. Apply styles (mobile scope)
   - Restyle targeted screens/components without altering behavior.
3. Parameters screen (mobile sheet)
   - Controls: Title, Template carousel (visual and actually updates selected template), Instrumental toggle, Language, Vocal Gender, Vocal Age/Timbre, sliders for `style_weight`, `weirdness_constraint`, `audio_weight` (0.0–1.0 step 0.1; show numeric value), sticky Confirm.
   - Sheet overlays chat; safe‑area respected; input remains reachable.
   - Confirm triggers existing generation path; no mapping changes.
4. Language switcher
   - NL default; EN optional; labels only; lightweight persistence (session/localStorage).
5. Accessibility
   - Contrast ≥ 4.5:1; labels bound to inputs; keyboard/focus accessible.
6. Feature flag & QA
   - Gate under a feature flag; visual QA on iOS Safari, Android Chrome, plus smoke check on desktop for regressions.

## 5) Non‑Goals
- No new Suno parameters (BPM/Key/TimeSig) until backend supports them.
- No server/API/flow changes; desktop refresh is out of scope for this phase.

## 6) Design Considerations
- Match the provided sample HTML style (colors, rounded corners, slider look, shadows, Inter).
- Preserve existing flows; avoid logic changes; mobile‑first; scroll inside sheet, not page.
- Copy primarily Dutch; ensure English variant exists for labels.

## 7) Technical Considerations
- Tailwind theme extension or CSS variables for tokens; update globals + layout.
- Restyle existing ParameterSheet; add a template carousel UI bound to `selectedTemplateId`.
- Confirm reuses current `/api/suno` call; mapping per prompts/sunoapireal.md and api route.
- Language switcher: simple client state + i18n labels (NL/EN); default NL.

## 8) Success Metrics
- 100% targeted mobile screens restyled; no functional regressions.
- Parameters screen matches reference visually (typography, spacing, sliders, sticky footer).
- Accessibility checks (contrast/focus) pass; QA sign‑off on iOS/Android.

## 9) Open Questions
- Persist language switcher in session or localStorage (default to localStorage)?
- Template carousel images: reuse placeholders or provide new assets?
- Background pattern scope: only sheets/cards or also top‑level app surfaces?

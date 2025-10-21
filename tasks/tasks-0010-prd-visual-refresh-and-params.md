## Relevant Files

- `src/app/layout.tsx` - Apply Inter font globally; ensure preconnect/preload and font family updates.
- `src/app/globals.css` - Add theme tokens (colors, radii, shadows), optional background pattern, base form styles.
- `src/components/ParameterSheet.tsx` - Restyle to match provided Parameters design; keep logic/mapping intact.
- `src/components/ConversationalStudioLayout.tsx` - Ensure sheet overlay behavior and updated styling.
- `src/components/mobile/NavTabs.tsx` - Update styles (colors, radii, focus rings) per new tokens.
- `src/components/AudioMiniPlayer.tsx` - Update visual style only (no behavior change).
- `src/components/*` (buttons/inputs/cards/modals) - Sweep for color/radius/shadow classes; replace with tokens.
- `src/templates/music-templates.ts` - Visual only (template carousel assets/titles), no logic change.
- `src/app/studio/StudioClient.tsx` - Wire Parameters sheet entry (styling only) after lyric selection; preserve flow.
- `prompts/sunoapireal.md` - Reference for parameter mapping; no code changes here.

### Notes

- Keep all flows/logic unchanged; this is a visual refresh and parameter screen integration only.
- Verify parameter UI → backend mapping against `prompts/sunoapireal.md` and `src/app/api/suno/route.ts`.

## Tasks

- [x] 1.0 Establish theme tokens and global typography
  - [x] 1.1 Add Tailwind/theme tokens (colors: primary `#4ade80`, secondary `#20b2aa`, background light/dark) in `globals.css` or Tailwind config; expose CSS vars if needed.
  - [x] 1.2 Switch global font to Inter (400/500/700/900) in `src/app/layout.tsx`; remove legacy Playfair usage from headings.
  - [ ] 1.3 Add focus ring utility and soft shadow presets (e.g., `shadow`, `ring-primary/30`).
  - [x] 1.4 Implement optional light SVG background pattern helper (apply only to large sheets/cards).
  - [ ] 1.5 Verify darkMode class support remains compatible (no behavioral change).

- [x] 2.0 Restyle core UI components to new house style
  - [ ] 2.1 Buttons: adopt rounded‑xl, gradient (primary→secondary) variant, hover/active states.
  - [x] 2.2 Inputs/selects/toggles: border colors to primary/40, focus `ring-primary`, rounded‑xl, subtle shadows; update any form helpers.
  - [x] 2.3 Cards/modals/sheets: rounded‑2xl, soft shadow, inner padding per sample.
  - [x] 2.4 Update `src/components/mobile/NavTabs.tsx` styles (tokens, focus states, z‑index).
  - [ ] 2.5 Update `src/components/AudioMiniPlayer.tsx` visuals (padding, rounded, shadow) only.
  - [ ] 2.6 Sweep Studio, Lyrics overlay, Variant selector, Library shells for legacy color classes (e.g., pink) and replace with tokens.

- [x] 3.0 Integrate Parameters screen (post‑lyrics selection)
  - [x] 3.1 Restyle `ParameterSheet` to match sample layout: header/title, spacing, rounded, shadows.
  - [x] 3.2 Add Title input (prepopulated from latest lyrics title; editable).
  - [x] 3.3 Add Template carousel (horizontal, card images/titles); bind item click to `selectedTemplateId` (visual + state only).
  - [x] 3.4 Add Instrumental toggle; bind to existing instrumental flag used in generation.
  - [x] 3.5 Add Voice section: Language, Vocal Gender, Vocal Age/Timbre selects (labels localized via i18n).
  - [x] 3.6 Add Advanced sliders: Style Weight, Weirdness Constraint, Audio Weight (range 0.0–1.0 step 0.1) with numeric readouts.
  - [x] 3.7 Add sticky footer Confirm button (gradient primary→secondary) that invokes existing generation function; do not change mapping.
  - [x] 3.8 Ensure the sheet overlays chat (80vh max) with scrollable interior; composer and nav remain accessible beneath.
  - [x] 3.9 Cross‑check UI → backend mapping against `prompts/sunoapireal.md` and `src/app/api/suno/route.ts`.

- [x] 4.0 Add language switcher (NL default, EN optional) for labels
  - [x] 4.1 Introduce a lightweight i18n labels map (NL, EN) for UI text used in Studio/Parameters/Overlays.
  - [x] 4.2 Persist selection (localStorage preferred) and default to NL; fallback to NL on missing keys.
  - [x] 4.3 Add a small UI control to toggle language (location: Settings or header—confirm placement) without reloading flows.
  - [x] 4.4 Verify all new Parameter labels and control text support NL/EN.

- [x] 5.0 Ensure mobile sheet overlay behavior and accessibility
  - [x] 5.1 Verify focus management (opening focuses first field; ESC/backdrop closes if appropriate).
  - [x] 5.2 Ensure ARIA roles/labels for sheet/modal controls; associate labels with inputs.
  - [x] 5.3 Respect safe‑area insets; ensure sticky footer is not obstructed by system bars/keyboard.
  - [x] 5.4 Confirm only transcript scrolls; header/composer/nav remain fixed.
  - [x] 5.5 Contrast checks (≥ 4.5:1) for text on backgrounds.

- [x] 6.0 Visual QA, feature flag, and rollout preparation
  - [x] 6.1 Add feature flag (e.g., `NEXT_PUBLIC_VISUAL_REFRESH=true`) to gate new theme/screens.
  - [ ] 6.2 Test on iOS Safari, Android Chrome, desktop Chrome/Firefox viewport emulation; capture before/after screenshots.
  - [ ] 6.3 Fix any regressions and edge cases; finalize tokens.
  - [ ] 6.4 Remove or flip feature flag when approved; document changes in CHANGELOG/PR.

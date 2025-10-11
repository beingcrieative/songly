## Relevant Files

- `src/app/studio/page.tsx` - Orchestrates studio state; gate music by selection; mounts compare UI; builds callback URL from `NEXT_PUBLIC_BASE_URL`.
- `src/components/LyricsCompare.tsx` - Two‑variant lyrics comparison UI (desktop two columns, mobile stacked with CTA).
- `src/components/LyricsCompare.test.tsx` - Component tests for rendering, selection events, and CTA enablement.
- `src/components/LyricsPanel.tsx` - Post‑selection lyric display; refine/manual edit entry points; compact spacing tweaks; gating indicators.
- `src/components/LyricsPanel.test.tsx` - Component tests for gating, refine disabled state, and manual edit save.
- `src/components/ConversationalStudioLayout.tsx` - Remove/hide left pane when compare UI is active; responsive adjustments.
- `src/app/api/suno/lyrics/route.ts` - Lyrics POST + GET; callback/caching integration; return variants in GET when available.
- `src/app/api/suno/lyrics/callback/route.ts` - Parse variants from callback; write to cache; (optionally) persist to InstantDB.
- `src/app/api/suno/lyrics/cache.ts` - In‑memory cache for lyric tasks; stores status and variants for fast GET.
- `src/instant.schema.ts` - Ensure lyric_versions schema/links cover selection metadata (variant index/source, refined/manual flags).
- `src/lib/analytics/events.ts` - Define and track LYRICS_OPTIONS_SHOWN, LYRICS_OPTION_SELECTED, LYRICS_REGENERATED, LYRICS_REFINED.
- `src/components/ParameterSheet.tsx` - New compact modal/sheet for language, vocalGender, (optional vocalAge) before music generation.
- `src/components/ParameterSheet.test.tsx` - Tests for parameter sheet behavior and gating.
- `package.json` - Dev dependency list (testing libraries) and scripts.
- `vitest.config.ts` / `vitest.setup.ts` - Test runner configuration (jsdom environment, jest-dom setup).

### Notes

- Mobile: stacked cards for compare; sticky “Gebruik geselecteerde lyrics” CTA; optional swipe to switch focus.
- Feature flag: `NEXT_PUBLIC_ENABLE_LYRICS_COMPARE` to enable the new experience.
- Keep chat compact; allow collapsing when compare UI is shown.

## Tasks

- [x] 1.0 Build Lyrics Compare UI and responsive layout
- [x] 1.1 Create `LyricsCompare.tsx` with props: `options: string[]`, `selectedIndex`, `onSelect`, `onUseSelected`
  - [x] 1.2 Desktop layout: two cards side‑by‑side (grid cols‑2), card max height with internal scroll
  - [x] 1.3 Mobile layout: stacked cards (one per row), sticky bottom CTA enabled only when selected
  - [x] 1.4 Add simple swipe gesture on mobile to switch A/B focus (touchstart/move/end)
  - [x] 1.5 Integrate into `studio/page.tsx`: show compare when `variants.length >= 2`; otherwise fallback to single lyric
  - [x] 1.6 Hide/remove left pane (TemplateSelector) when compare UI is shown
  - [x] 1.7 Tighten spacing around chat area when compare is active (reduced margins/padding)
  - [x] 1.8 Tests: render two options, select toggling, CTA enable state (component test)

- [x] 2.0 Implement selection, one‑time refine, and manual edit workflow (gating before music)
  - [x] 2.1 Add `lyricsOptions` and `selectedLyricIndex` state; set `latestLyrics` only after user confirms selection
  - [x] 2.2 Disable “Genereer Muziek” until selection is made (and after any manual edit/refine completes)
  - [x] 2.3 One‑time refine: add a `refineUsed` flag; block further refine attempts after first use
  - [x] 2.4 Manual edit modal: editable textarea for chosen lyrics; Save updates `latestLyrics` and marks manual_edit flag
  - [x] 2.5 Handle callback payload with multiple variants; display two best options; single variant fallback supported
  - [x] 2.6 Error states: timeout → show Retry / Terug naar chat; retry re‑issues GET or awaits callback
  - [x] 2.7 Tests: gating behavior (music disabled before selection), refineUsed blocking, manual edit save path

- [x] 3.0 Add compact Parameter Sheet to confirm vocal settings before music generation
  - [x] 3.1 Create `ParameterSheet.tsx` (modal/sheet) with fields: language, vocalGender (m/v/neutral), optional vocalAge
  - [x] 3.2 Initialize with template/advanced defaults; reflect into state separate from compare UI
  - [x] 3.3 Merge params with existing template/advanced config before calling `/api/suno` music endpoint
  - [x] 3.4 Wire open/close from "Genereer Muziek" button; validate selection required first
  - [x] 3.5 Tests: open/close, field updates, validation, merge correctness

- [x] 4.0 Backend: callback/cache → UI wiring and InstantDB persistence for selected lyric version
  - [x] 4.1 Ensure callback parses multiple variants (payload.data.data[].text) and writes them to in‑memory cache keyed by taskId
  - [x] 4.2 `GET /api/suno/lyrics` returns variants from cache when complete; include both `lyrics` (joined) and `variants` array
  - [x] 4.3 Persist only the selected lyric to `lyric_versions`; include metadata: variant index, refined/manual flags
  - [x] 4.4 Schema: confirm `lyric_versions` is sufficient; if needed, add optional fields (variantIndex, flags)
  - [x] 4.5 Tests (API): simulate callback → cache fill → GET returns variants; selecting persists only chosen lyric

- [x] 5.0 Analytics + Feature Flag + compact chat adjustments
  - [x] 5.1 Add analytics events: `LYRICS_OPTIONS_SHOWN`, `LYRICS_OPTION_SELECTED`, `LYRICS_REGENERATED`, `LYRICS_REFINED`
  - [x] 5.2 Fire events from `studio/page.tsx` on show/selection/refine/regenerate
  - [x] 5.3 Add `NEXT_PUBLIC_ENABLE_LYRICS_COMPARE` guard; fallback to old panel when disabled
  - [x] 5.4 Compact chat spacing and allow collapsing while compare UI is visible
  - [x] 5.5 Text labels remain Dutch; English toggle deferred (out of scope)

- [ ] 6.0 QA: mobile behavior (swipe/CTA), accessibility, and error/timeout paths
  - [ ] 6.1 Mobile: two variants stacked; swipe works; sticky CTA visible; selection required
  - [ ] 6.2 Keyboard nav: radio focus, CTA activation, ARIA labels for cards
  - [ ] 6.3 Error handling: callback missing, polling timeout, refine blocked after first use
  - [ ] 6.4 Verify callback path uses NEXT_PUBLIC_BASE_URL; lyrics appear without relying on details endpoints
  - [ ] 6.5 Performance: no unnecessary re‑renders; compare UI unmounts after selection

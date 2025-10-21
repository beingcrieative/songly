## Relevant Files

- `src/app/studio/StudioClient.tsx` - Integrate the native shell on mobile: header with plus, chat bubbles with avatars, composer bar, mini-player metadata wiring.
- `src/components/ConversationalStudioLayout.tsx` - Ensure sticky header/composer and scrollable chat region; safe-area paddings.
- `src/components/mobile/NavTabs.tsx` - Bottom nav styling (icons/labels), safe-area padding, focus states.
- `src/components/AudioMiniPlayer.tsx` - Update to card layout with cover + metadata; no logic changes.
- `src/app/library/page.tsx` - Refresh Library page shell (header + list cards) and include bottom nav.
- `src/app/settings/page.tsx` - New Settings screen (language toggle and basic preferences) with the same shell.
- `src/app/globals.css` - Add safe-area utilities and minor token tweaks to support sticky regions.
- `src/components/Avatar.tsx` - New reusable avatar with image/initial fallback and accessible alt.
- `src/components/ChatBubble.tsx` - New message bubble component (user/assistant variants) with optional avatar.
- `src/components/mobile/ChatHeader.tsx` - New sticky header with title and "+" action.
- `src/components/mobile/ComposerBar.tsx` - New input bar with trailing icon button, keyboard-friendly.
- `public/*.svg` - Icon assets for bottom nav/header (placeholders if final assets pending).
- `src/components/Avatar.test.tsx` - Unit tests for avatar fallbacks/alt text.
- `src/components/ChatBubble.test.tsx` - Unit tests for role-based alignment/semantics.
- `src/components/mobile/NavTabs.test.tsx` - Unit tests for active tab styling and icons.
- `src/components/AudioMiniPlayer.test.tsx` - Unit tests for rendering card with metadata when `src` is present. (added later)

### Notes

- Tests: use Vitest + RTL. Run with `npx vitest` or `npx vitest -u` to update snapshots.
- Keep behavior unchanged (no server/API logic updates). This is a visual refresh and mobile shell polish only.
- Apply changes conditionally for mobile (preserve desktop layout), using responsive utilities and existing `isMobile` checks.
- Respect safe areas using `env(safe-area-inset-*)`; verify keyboard doesn’t obscure the composer or nav.
- If final SVG icon set is unavailable, ship with current placeholders and track replacement as a follow-up.

## Tasks

- [x] 1.0 Scaffold native shell components and theme polish (mobile)
  - [x] 1.1 Create `src/components/mobile/ChatHeader.tsx` with title and a right-aligned "+" button; sticky with `pt-[env(safe-area-inset-top)]` and focus ring states.
  - [x] 1.2 Create `src/components/Avatar.tsx` supporting `photoUrl`, `name` → initial fallback, size variants, and accessible `alt` text.
  - [x] 1.3 Create `src/components/ChatBubble.tsx` with `role: 'user' | 'assistant'`, left/right alignment, tokenized colors, optional avatar slot, and `aria-label` semantics.
  - [x] 1.4 Create `src/components/mobile/ComposerBar.tsx` wrapping an input with trailing icon button; props: `value`, `onChange`, `onSubmit`, `disabled`, `placeholder`.
  - [x] 1.5 Add safe-area utility classes in `src/app/globals.css` (e.g., `.pt-safe`, `.pb-safe`, `.insetb-safe`) using `env(safe-area-inset-*)` and document usage.
  - [x] 1.6 Wire placeholder icons from `public/*.svg` for nav/header until final assets are provided.

- [x] 2.0 Apply native chat layout to Studio (header, avatars, bubbles, composer)
  - [x] 2.1 Replace the Studio mobile header block with `ChatHeader` (title: "Studio", `onNew` → focus composer or start fresh flow without logic changes).
  - [x] 2.2 Render the messages list using `ChatBubble` for consistent spacing, rounded bubbles, and avatar display (assistant: app avatar; user: initial or photo if available).
  - [x] 2.3 Replace the inline input area with `ComposerBar`; maintain Enter-to-send and disabled/loading states; keep existing handlers.
  - [x] 2.4 Ensure the header and composer are sticky; the chat body scrolls; adjust paddings for bottom nav (`pb-safe`) and mini-player overlap.
  - [x] 2.5 A11y: add `aria-live="polite"` for typing indicator bubble; ensure buttons/links have visible focus and labels.

- [x] 3.0 Restyle mini‑player to card design with cover and metadata
  - [x] 3.1 Extend `AudioMiniPlayer` props to accept `title?` and `imageUrl?`; render cover thumbnail, title, and the audio control within a card.
  - [x] 3.2 Update `StudioClient.tsx` to pass `title` and `imageUrl` from `selectedSongForPlayer`; continue choosing `streamAudioUrl` over `audioUrl`.
  - [x] 3.3 Add safe-area spacing so the player floats above bottom nav (`bottom-[calc(64px+env(safe-area-inset-bottom))]` on mobile).
  - [x] 3.4 Preserve existing autoplay/playback logic; no API or generation changes.

- [x] 4.0 Refresh Library and add Settings screens with consistent bottom nav
  - [x] 4.1 Update `src/app/library/page.tsx` to a mobile-friendly shell: `ChatHeader` ("Bibliotheek"), list of items as cards with cover, title, and subtle actions.
  - [x] 4.2 Add `src/app/settings/page.tsx` with the same shell: `ChatHeader` ("Instellingen"), include `LanguageToggle` and any basic app prefs (visual-only).
  - [x] 4.3 Include `<NavTabs />` on Library and Settings (convert to client components or add a small client wrapper) and apply safe-area padding.
  - [x] 4.4 Ensure styles, radii, colors, and focus states match the Studio shell for visual consistency.

- [x] 5.0 Ensure safe‑area, keyboard behavior, and accessibility (focus/contrast)
  - [x] 5.1 Apply `.pb-safe`/`.pt-safe` utilities to header, composer, nav, and mini-player; verify overlapped elements on iOS Safari and Android Chrome.
  - [x] 5.2 Ensure the composer stays above the keyboard (use `h-[100svh]` container and sticky footer). Verify no layout jumps on focus.
  - [x] 5.3 Verify text contrast (≥ 4.5:1) for bubbles, header, and nav; adjust tokens if necessary.
  - [x] 5.4 Add/verify ARIA labels for "+" button, send button, and audio controls; confirm focus order with keyboard navigation.
  - [x] 5.5 Smoke tests on small iOS/Android viewports; record any edge cases as follow-ups (icons, avatar source, long titles).

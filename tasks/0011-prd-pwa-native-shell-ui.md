# PRD — PWA Native Shell UI Refresh (Studio, Library, Settings)

## 1) Introduction / Overview
We will restyle the mobile PWA to match the provided native-style template (header, chat bubbles, bottom nav, mini-player, composer) while preserving the existing interaction flows and logic. The update spans Studio, Library, and Settings screens, keeping the current green house style. Desktop remains unchanged.

## 2) Goals
- Apply the native-like layout to Studio (sticky header, chat bubbles with avatars, FAB “plus” button, mini-player card, bottom nav) using the green theme.
- Extend the visual refresh to Library and Settings for consistency.
- Maintain existing flows (lyrics->parameters->generation), only updating look & feel.
- Ensure mobile safe-area/keyboard-friendly layouts reminiscent of native PWA behavior.

## 3) User Stories
- As a mobile user, I see a native-feeling chat interface with avatars, rounded bubbles, and sticky header/action button.
- As a user, I can access the library and settings with the same house style and navigation pattern.
- As a user, when the mini-player appears, it adopts the new card design without breaking playback controls.

## 4) Functional Requirements
1. Chat shell
   - Sticky header (title + “+” button), scrollable chat body with avatars (real or placeholder), modern bubbles for user/assistant.
   - Composer input with trailing icon button inside the field (per template).
2. Mini-player
   - Card layout with cover preview, metadata, and play control matching template.
   - Works with current streaming/playback logic; no functional change.
3. Navigation
   - Bottom nav with icons + labels, styled per template; safe-area padding; sticky.
4. Library & Settings
   - Apply same style language (cards, headers, nav) to lists and controls.
5. Live data integration
   - Avatars: use existing photo/url if available, otherwise fallback initial/color.
   - Background images/covers: use actual Suno-provided URLs; fallback to gradient placeholder.
6. Accessibility
   - All text meets contrast minimum (4.5:1); interactive elements have focus states.
7. Mobile behavior
   - Input stays above keyboard; nav & mini-player respect `safe-area` insets; composer remains accessible.

## 5) Non-Goals
- No desktop restyle in this phase.
- No changes to audio generation logic, parameters, or server APIs.
- No additional Suno controls beyond current mapping.

## 6) Design Considerations
- Follow the supplied HTML template structure (header, chat list, footer). Replace pink palette with greens (#4ade80 primary, #20b2aa secondary).
- Dark mode out of scope for now; ensure styling works in light theme only.
- Use CSS grid/flexbox to reproduce mobile layout while keeping React structure manageable.

## 7) Technical Considerations
- Update or create shared components (ChatBubble, Avatar, Header, Nav) to encapsulate template design.
- Ensure existing data sources (messages, avatars, covers, nav routes) feed the new components without structural changes.
- Safe-area handling via CSS (`env(safe-area-inset-*)`).

## 8) Success Metrics
- Studio, Library, Settings visually match the native-like template with green palette.
- Mini-player and composer remain functional on mobile with no regressions.
- QA confirms nav/header/footer behavior around keyboard/safe-area.

## 9) Open Questions
- Provide final icon assets (SVG) for bottom nav and header plus button? (Else use current material icons.)
- Library/Settings content structure: keep existing sections or revisit layout?
- Avatar fallbacks: use initials/gradient or a default image?

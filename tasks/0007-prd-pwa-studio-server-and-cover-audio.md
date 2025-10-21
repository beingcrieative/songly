# PRD — Mobile PWA Studio (Server‑Only Data, InstantDB Auth, Suno V5, Push)

## 1) Introduction / Overview
We will provide a mobile‑first PWA experience for the Studio that prioritizes security (all data operations happen on the server), clear conversational onboarding, and a predictable UI tailored for small screens with gestures. Desktop retains the current Studio UI; mobile users (iOS/Android) are served a PWA with install capability and push notifications. Login is via InstantDB; after login, users chat with the agent, choose lyrics from a card stack, and fine‑tune Suno generation parameters (V5 only). Users can optionally record a 15‑second reference clip (queued offline, uploaded when online in Phase 2). A Library view shows previously generated songs and lyrics grouped by conversation.

This PRD covers Phase 1 delivery; the cover‑audio flow (upload + Suno “upload‑cover”) is planned for Phase 2 but is scoped here for future alignment.

## 2) Goals
- Secure data model: route all reads/writes through server with Instant Admin SDK; client talks directly to Instant only for login.
- Mobile PWA: installable app for iOS/Android with offline support focused on recording + queued upload (Phase 2), and sensible caching.
- Conversational flow: chat with the agent on first screen; info/options panels redesigned for mobile with gestures and feature flags.
- Lyrics selection: present returned lyrics as card stack with quick select; allow parameter adjustments before music generation.
- Suno integration: use Suno V5 exclusively; accept parameters for stronger user control; stream playback without storing by default.
- Push notifications: notify for song ready, auth/magic code (where possible), and marketing/updates.
- Library: show user’s songs and lyrics grouped by conversation with mobile gesture affordances.

Success metrics (top 3, per input):
- Song completion rate (user starts → gets a playable result).
- Install rate (PWA installs on supported devices).
- Return usage within 7 days.

## 3) User Stories
- As a mobile user, I can sign in via InstantDB so my data and conversations are saved to my account.
- As a mobile user, I can chat with the assistant to provide context and quickly reach a generated lyric.
- As a mobile user, I can swipe through lyric options presented as cards and quickly choose my favorite.
- As a mobile user, I can adjust Suno parameters (model V5, tags, vocals, etc.) to influence the sound before generating music.
- As a mobile user, I receive a push notification when my song is ready, even if the app is in the background.
- As a mobile user, I can navigate via bottom tabs and access side drawers or sheets with gestures to keep the UI uncluttered.
- As a mobile user, I can view all my previous songs and lyrics in a single Library grouped by conversation, with swipe/long‑press actions.
- As a mobile user on flaky networks, I can still interact; audio previews stream when available; in Phase 2 I can record a 15s reference and it will queue for upload when back online.
- As a desktop user, nothing changes — I keep using the current Studio UI.

## 4) Functional Requirements
FR‑1 PWA Delivery (Mobile Only)
1. Detect mobile user agent and serve the PWA experience; desktop users get the current Studio UX unchanged.
2. Provide a valid Web App Manifest with app name, icons, theme colors, display=standalone.
3. Register a Service Worker on mobile capable browsers; degrade gracefully on unsupported.

FR‑2 Authentication (InstantDB)
1. Support Instant magic code sign‑in; client may call Instant only for auth.
2. On success, establish a server‑side session (NextAuth) that ties the Next.js session to the Instant user.
3. Store session via HttpOnly cookies; no tokens in localStorage. Refresh/validate session server‑side.

FR‑3 Server‑Only Data Access
1. All database reads/writes go through Next.js server routes using Instant Admin SDK.
2. Instant permissions: default deny for public; no direct client read/write of app data. Allow auth endpoints only as needed.
3. All server routes check the session and enforce per‑user scoping.

FR‑4 Chat + Info/Options UX (Mobile)
1. Primary screen is Chat with the agent.
2. Replace desktop side panels with mobile patterns controlled via feature flags:
   - Option A: Bottom sheets for info/options, invoked by swipe‑up or FAB.
   - Option B: Horizontal swipe between Chat/Lyrics/Params panels.
   - Option C: FAB toggling a sheet for options; sheet can contain tabbed sections.
3. Support gestures: swipe left/right to switch panels, pull‑up bottom sheet, long‑press to favorite a lyric, swipe to delete in Library.

FR‑5 Lyrics Presentation and Selection
1. Present returned lyrics as a card stack (carousel). Show title/sections, compact styling.
2. “Select” action confirms one lyric; store selection in DB linked to conversation + song.
3. Allow “Regenerate options” and “Refine” actions; track selection and refinements in analytics.

FR‑6 Parameter Controls (Suno V5)
1. Support only model V5 for generation.
2. Parameters include: prompt/tags (incl. negative tags), vocals (gender/age), style weight, weirdness constraint, and any V5‑supported flags.
3. Show a clear, mobile‑friendly parameter sheet. Persist last‑used parameters per conversation.

FR‑7 Music Generation and Playback
1. Trigger server route to call Suno for generation (V5) with the selected lyric and parameters.
2. Receive streaming URL(s) from Suno and present a playable audio player; do not persist audio files by default.
3. If streaming URLs change to downloadable assets later, update UI accordingly; consider optional offline caching (feature flag).

FR‑8 Library (Songs + Lyrics)
1. Show a unified list grouped by conversation: each conversation item expands to show selected lyric and generated songs/variants.
2. Support search/filter by date/style/tag optionally (Phase 1: simple recent‑first sort).
3. Gesture support: swipe to delete, long‑press to favorite.

FR‑9 Push Notifications
1. Topics: song ready, auth/magic code (device capability permitting), marketing/updates (user opt‑in).
2. Implement Web Push for Android/desktop PWA; iOS support only when PWA is installed and permission granted (platform constraints apply).
3. Settings screen allows granular notification toggles and unsubscribe.

FR‑10 Offline & Queueing (Phase 2)
1. Offline: record up to 15s reference audio; store locally and queue upload on reconnection.
2. Background sync on Android/desktop where supported; iOS fallback: prompt to retry when online.
3. Once uploaded, server completes Suno “upload‑cover” flow and links result to conversation.

FR‑11 Cover‑Audio (Phase 2 — Plan Only)
1. Implement server endpoint to orchestrate Suno `POST /api/v1/generate/upload-cover` using fields per docs/coveraudio.md.
2. Ensure clip length limit (15s client‑side) and show rights confirmation before upload.
3. Use callback URL to update song task status; push notification when ready.

## 5) Non‑Goals (Out of Scope in Phase 1)
- Full cover‑audio generation pipeline (upload + callbacks) — planned for Phase 2.
- Desktop redesign — desktop continues to use the existing Studio UI.
- Multi‑model support — only Suno V5 in Phase 1.
- Long‑term offline audio caching by default — default is stream‑only; caching behind a flag.

## 6) Design Considerations
- Navigation (Hybrid): bottom tab bar (Chat, Library, Settings) + drawers/sheets for secondary info/options. Tabs enable predictable nav; drawers/sheets keep primary view clean.
- Panels via feature flags: enable A/B testing on real devices (bottom sheet vs horizontal swipes vs FAB sheet).
- Lyrics cards: focus on fast scan; emphasize chorus; allow expand for full text.
- Gesture hints: brief on‑boarding tooltips showing swipe areas and long‑press actions.
- Audio player: compact sticky mini‑player at bottom with expand‑to‑full.
- iOS constraints: limited background sync; push requires installed PWA; input audio constraints; ensure Safari media policies are respected.

## 7) Technical Considerations
PWA
- Manifest: name/short_name, icons (512/256/192/180), theme/background color, display=standalone, scope/start_url.
- Service Worker: runtime cache for API GETs (stale‑while‑revalidate), audio streaming passthrough, precache shell routes, offline fallback page.
- Background Sync: use when available; iOS fallback prompts.

Auth & Sessions
- Instant magic code on client; NextAuth session created after verifying Instant user.
- HttpOnly cookies; CSRF enabled; session checked on all API routes.

Server‑Only Data Access
- Next.js App Router API routes call Instant Admin SDK.
- Enforce per‑user access at server via session.user.id checks.
- Instant perms: default deny; no public reads/writes to app entities.

Suno Integration (V5)
- Env: `SUNO_API_KEY` server‑only; `NEXT_PUBLIC_INSTANT_APP_ID` for client init.
- Generation endpoint: server calls Suno, stores minimal task metadata, returns stream URL(s) to client.
- Callbacks: preferred for readiness → triggers push notification → client updates UI.

Schema (verify / extend)
- Conversations: already includes createdAt/status/round/readiness/songSettings; add if missing: `selectedTemplateId` (string, indexed), `templateConfig` (string JSON). Run `npx instant-cli push` after updates.
- Songs: V5 params captured in `generationParams` JSON; stream URLs stored transiently.
- Lyric versions: selection flags and timestamps already present.

Permissions
- Lock down everything by default. Allow only server‑side service accounts (admin SDK). Client only for `db.auth.*`.

Analytics
- Track: lyric selection rate, regeneration/refinements, time‑to‑ready, install events, session return within 7 days, library engagement and gestures.

iOS/Android nuances
- iOS: Web Push requires installed PWA; background sync limited; getUserMedia prompts; autoplay policy requires user gesture to start audio.
- Android: Full Web Push and Background Sync support on Chrome; larger storage quota; audio recording stable.

## 8) Acceptance Criteria
- PWA
  - Mobile shows install prompt on Android and iOS (Add to Home Screen) with a valid manifest and icons.
  - Service Worker registers; offline fallback page works; no broken navigation when offline.
- Security
  - No client‑side data reads/writes to Instant entities (verified by network panel and perms).
  - All API routes reject unauthenticated access; sessions stored in HttpOnly cookies only.
- Chat & Panels
  - Chat loads and sends messages; info/options accessible via at least one flagged pattern; gestures work (swipe panels, pull‑up sheet).
- Lyrics
  - Card stack shows multiple options; “Select” persists choice; “Refine” regenerates; analytics events fire.
- Parameters
  - Parameter sheet opens, updates V5 parameters, persists per conversation; generation uses these values.
- Music
  - Triggering generation returns a streaming URL; mini‑player plays; push notification arrives when song is ready.
- Library
  - Shows grouped by conversation; swipe to delete, long‑press to favorite work.
- Push
  - User can opt‑in/out; song‑ready notification received on supported devices.

## 9) Open Questions
- NextAuth provider: finalize adapter strategy to bind Instant users cleanly (map Instant userId → session subject; decide on DB adapter or JWT‑only).
- Exact push vendor: native Web Push via VAPID, or service (e.g., FCM web) for better delivery analytics?
- How much parameter surface of V5 to expose in Phase 1 without overwhelming the UI?
- Do we add offline caching for N recent audio items as a toggle in Settings in Phase 1, or defer behind a feature flag entirely?

## 10) Rollout Plan
- Phase 1 (this PRD)
  - Security hardening (server‑only data, perms deny‑all), NextAuth sessions.
  - PWA manifest + SW, push (song ready, auth, marketing), Chat + Lyrics cards + Params + Library.
  - Suno V5 integration and streaming playback.
- Phase 2 (Cover‑Audio)
  - 15s record + queue + upload; server “upload‑cover” orchestration with callback handling per docs/coveraudio.md.
  - Rights confirmation gate; improved background sync paths and iOS fallbacks.

## 11) Implementation Notes (Dev Checklist)
- Env: ensure `NEXT_PUBLIC_INSTANT_APP_ID`, `SUNO_API_KEY`, push keys (VAPID), NextAuth secrets are set.
- Manifest + icons under `public/`; register SW in `src/app/layout.tsx`.
- API routes under `src/app/api/*` use Instant Admin SDK; no client `db.useQuery` for app data on mobile PWA screens.
- Update `src/instant.perms.ts` to default deny; push with `npx instant-cli push`.
- If adding `selectedTemplateId`/`templateConfig`, update `src/instant.schema.ts` and push schema.
- Add analytics events for all critical actions.

## 12) Dependencies
- Next.js App Router, Tailwind CSS.
- InstantDB (React client for auth only; Admin SDK on server) and Instant CLI for schema/perms sync.
- Suno API (V5) for music generation.
- Web Push, Service Worker, Background Sync (where supported).

---

Document owner: Engineering
Status: Draft ready for implementation

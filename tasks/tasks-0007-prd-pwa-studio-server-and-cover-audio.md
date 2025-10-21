## Relevant Files

- `src/instant.perms.ts` - Lock down InstantDB permissions (default deny; client only uses `db.auth.*`).
- `src/instant.schema.ts` - Add missing conversation fields (`selectedTemplateId`, `templateConfig`) if not present; keep Suno V5 params on songs.
- `src/lib/adminDb.ts` - Server-only Instant Admin SDK client for reads/writes from API routes.
- `src/lib/session.ts` - Minimal signed-cookie session utilities for server routes and middleware.
- `src/app/api/auth/[...nextauth]/route.ts` - NextAuth session binding to Instant user (HttpOnly cookies, CSRF).
- `src/components/auth/SessionBridge.tsx` - Exchanges Instant login for server session cookie client-side.
- `src/components/ClientBoot.tsx` - Client-only bootstrap rendering SW registration and session bridge.
- `src/app/api/auth/logout/route.ts` - Clears server session cookie when user signs out.
- `src/app/api/auth/exchange/route.ts` - Session exchange endpoint (verifies Instant user, sets HttpOnly cookie).
- `src/middleware.ts` - Optional route protection/headers for API security and PWA caching controls.
- `public/manifest.webmanifest` - PWA manifest (name, icons, theme/display, start_url, scope).
- `public/sw.js` - Service Worker for install, offline fallback, runtime caching, push event handling.
- `src/lib/push.ts` - Web Push utilities (VAPID keys, subscribe/unsubscribe, send helpers).
- `src/app/api/push/subscribe/route.ts` - Save push subscriptions per user/session.
- `src/app/api/push/test/route.ts` - Test endpoint for sending notifications (dev-only).
- `public/offline.html` - Offline fallback page for navigation requests.
- `src/components/pwa/ServiceWorkerRegister.tsx` - Client-side SW registration component.
- `src/components/pwa/InstallPrompt.tsx` - In-app install prompt UX for Android and iOS A2HS guidance.
- `src/components/mobile/NavTabs.tsx` - Bottom tab navigation (Chat, Library, Settings) for mobile.
- `src/components/mobile/DrawerSheet.tsx` - Feature-flagged info/options sheet (gestures: pull-up, swipe).
- `src/components/mobile/LyricsCardStack.tsx` - Card-stack UI for lyric options and selection.
- `src/components/AudioMiniPlayer.tsx` - Sticky mini-player with expand-to-full for stream URLs.
- `src/app/library/page.tsx` - Library view (songs + lyrics grouped by conversation; gestures: swipe delete, long-press favorite).
- `src/components/recorder/AudioRecorder.tsx` - 15s recording component (feature-flagged for Phase 2).
- `src/app/api/cover/upload/route.ts` - Phase 2 stub endpoint for cover-audio upload orchestration.
- `docs/recording-e2e-plan.md` - Manual E2E scenarios for offline recording & queue.
- `src/app/studio/page.tsx` - Server entrypoint that reads mobile cookie and renders the Studio client shell.
- `src/app/studio/StudioClient.tsx` - Studio UI logic with mobile-aware server API data flows and desktop Instant hooks.
- `src/app/api/mobile/conversations/route.ts` - Provide mobile endpoints to fetch or create user conversations via admin client.
- `src/app/api/mobile/conversations/[conversationId]/route.ts` - Update conversation metadata (phase, settings, template) for mobile requests.
- `src/app/api/mobile/messages/route.ts` - Persist chat messages to InstantDB through server-side admin access.
- `src/app/api/mobile/songs/route.ts` - Create song records linked to the session user for mobile generation requests.
- `src/app/api/mobile/songs/[songId]/route.ts` - Update song status and variant metadata from mobile polling callbacks.
- `src/app/api/suno/route.ts` - Ensure V5 usage, param mapping, callback hooks, and push trigger on ready.
- `src/app/api/suno/callback/route.ts` - Update status/variants on callback; push ‘song ready’ notifications.
- `src/app/api/chat/*` - Existing chat endpoints; ensure they route server-only and respect sessions.
- `src/app/api/lyric-versions/route.ts` - Persist lyric selections and refinements from mobile UI.

- `src/components/mobile/LyricsCardStack.test.tsx` - Tests for card stack interactions and selection events.
- `src/lib/push.test.ts` - Tests for VAPID setup and payload building.
- `public/sw.test.ts` - SW integration tests (mocked) for caching strategy and push events.
- `src/app/api/push/subscribe/route.test.ts` - API tests for subscriptions.
- `src/app/api/suno/callback/route.test.ts` - Callback flow tests updating DB and enqueuing notifications.
- `src/lib/session.test.ts` - Tests for session cookie sign/verify roundtrip.

### Notes

- Tests run with Vitest: use `npx vitest` (or `npx vitest run` in CI). Place tests alongside files (`*.test.ts`/`*.test.tsx`).
- When schema or permissions change, run `npx instant-cli push` and commit updated artifacts.
- Mobile-only PWA: desktop keeps existing Studio UX; feature flags control mobile panels/gestures.

## Tasks

- [ ] 1.0 Security & Sessions: server-only data model
- [x] 1.1 Add server-only Instant Admin SDK client `src/lib/adminDb.ts` (reads/writes with `@instantdb/admin` using env admin token)
- [x] 1.2 Lock down permissions in `src/instant.perms.ts` (default deny: no public read/write; allow nothing except auth). Run `npx instant-cli push`
- [x] 1.3 Implement session bridge (client → server) that exchanges Instant login for HttpOnly cookie
  - [x] 1.4 Implement `/api/auth/exchange` step in Credentials provider: verify provided Instant user via Admin SDK `$users` lookup; reject if not found
  - [x] 1.5 Configure HttpOnly cookies, CSRF, `NEXTAUTH_SECRET`; store `{ userId, email }` in JWT/session
  - [x] 1.6 Add `src/middleware.ts` to protect `/api/**` (require session) and set security headers (CORS policy for app origin, no sniff, frame-ancestors none)
  - [x] 1.7 Refactor mobile data flows to call server API routes only (no client `db.useQuery`/`db.transact` for app data on mobile)
  - [x] 1.8 Add unit tests for auth exchange flow and session guard middleware

- [ ] 2.0 PWA foundations: manifest, SW, offline, mobile gating
  - [x] 2.1 Add `public/manifest.webmanifest` (name/short_name, icons 512/256/192/180, theme/background, display=standalone, start_url, scope)
  - [ ] 2.2 Add icons under `public/icons/` and reference in manifest
  - [x] 2.3 Create `public/offline.html` fallback page (light shell and guidance)
  - [x] 2.4 Create `public/sw.js` with install/activate, routing: precache shell, stale-while-revalidate for GET API, no-cache for audio streams, offline fallback
  - [x] 2.5 Register SW in a small client component, include in `src/app/layout.tsx`; add `src/components/pwa/InstallPrompt.tsx`
- [x] 2.6 Implement mobile gating: set `isMobile` cookie via UA in middleware (client hook pending)
  - [x] 2.7 iOS A2HS UX: show instructions banner; Android: show beforeinstallprompt handler in InstallPrompt
  - [ ] 2.8 Add basic SW tests (mocked) for cache strategies and offline route

- [ ] 3.0 Push notifications: subscription, server send, song-ready
  - [x] 3.1 Add schema entity `push_subscriptions` and links to `$users` (endpoint, keys, ua, platform, allowMarketing, createdAt). Run `npx instant-cli push`
  - [x] 3.2 Implement `src/app/api/push/subscribe/route.ts` (POST/DELETE) to save/remove subscriptions for the logged-in user
  - [x] 3.3 Add `src/lib/push.ts` using `web-push` with VAPID (document generating keys and setting env vars)
  - [x] 3.4 Add `src/app/api/push/test/route.ts` (dev-only) to send a test notification to caller
  - [ ] 3.5 Client: prompt + subscribe flow (request Notification permission, register service worker, send subscription to server)
  - [x] 3.6 Integrate push in Suno callback: on `ready/complete` send song-ready notification with deep link to song
  - [ ] 3.7 Add tests for subscription API and push payload construction

- [ ] 4.0 Mobile UI & gestures: navigation, panels, lyrics cards, params, player, library
  - [x] 4.1 Add `src/components/mobile/NavTabs.tsx` with three tabs: Chat, Library, Settings
  - [x] 4.2 Add `src/components/mobile/DrawerSheet.tsx` with gesture support (swipe, pull-up), behind feature flags; integrate with Studio page
  - [x] 4.3 Add `src/components/mobile/LyricsCardStack.tsx` to display lyric options; actions: Select, Regenerate, Refine; analytics hooks
  - [ ] 4.4 Integrate Parameter sheet (reuse existing `ParameterSheet`) opened via FAB; persist per conversation via server API
  - [x] 4.5 Add `src/components/AudioMiniPlayer.tsx` for streaming URLs; sticky with expand-to-full; respects autoplay policies
  - [x] 4.6 Implement `src/app/library/page.tsx` fetching server data grouped by conversation; gestures: swipe delete, long-press favorite
  - [ ] 4.7 Wire mobile shell in `src/app/studio/page.tsx` behind `isMobile` + feature flags; remove direct client DB calls on mobile path
  - [ ] 4.8 Add unit tests: card stack interactions, parameter persistence, mini-player behavior (mocked), library gesture handlers

- [ ] 5.0 Suno V5 integration: server endpoints, streaming playback, analytics
  - [x] 5.1 Update `src/app/api/suno/route.ts` to force model V5; validate params (styleWeight, weirdness, vocals)
  - [ ] 5.2 Ensure generationParams saved on `songs` and variants linked; do not persist audio files, use stream URLs
  - [x] 5.3 On callback (`src/app/api/suno/callback/route.ts`), mark status ready/complete, attach variants, and trigger push
  - [ ] 5.4 Client: consume streaming URL with `AudioMiniPlayer`; handle fallback retry if stream 403/expired
  - [ ] 5.5 Add analytics events: lyric selection, refinement, time-to-ready, playback start/complete, install events
  - [ ] 5.6 Add tests for server param validation and callback DB updates

- [ ] 6.0 Phase 2 prep: 15s cover-audio recording, queueing, server scaffolding
  - [x] 6.1 Add recording module (feature flag): MediaRecorder wrapper, 15s cap, permissions UX; store blobs in IndexedDB
  - [ ] 6.2 Add Background Sync tag (Android/desktop): queue upload tasks; iOS fallback: retry prompt
  - [x] 6.3 Server scaffolding: stub endpoint to accept uploads and orchestrate Suno `upload-cover` per docs/coveraudio.md
  - [ ] 6.4 Rights confirmation modal (must-accept) before enabling upload; store consent timestamp
  - [x] 6.5 Telemetry for recording flows (start, cancel, queued, uploaded, failure)
  - [x] 6.6 E2E plan: device tests for recording and queue behavior (documented manual QA steps)

## Relevant Files

- `src/instant.schema.ts` - InstantDB schema; add indexes/fields needed for Library queries (updatedAt, title indexes, isPublic/publicId, selectedVariantId, lyricsSnippet, conversation concept fields).
- `src/instant.perms.ts` - Client-side permissions; allow user-scoped view/update for own conversations/songs/variants; keep default-deny for others.
- `src/app/library/page.tsx` - New Library page with tabs (Gesprekken/Liedjes), lists, search/sort/filter, and mini-player integration.
- `src/app/library/components/ConversationCard.tsx` - Card for conversation summaries (concept-lyrics title/snippet, readiness, updatedAt).
- `src/app/library/components/SongCard.tsx` - Card/grid item for songs with cover, status, actions (play/open/share/delete/select variant).
- `src/app/library/components/Filters.tsx` - Shared controls for search/sort/filter.
- `src/app/api/library/share/[publicId]/route.ts` - Public, read-only API for shared song metadata/variants (limited fields).
- `src/app/api/library/conversations/[id]/route.ts` - DELETE route (user-owned) to hard-delete a conversation and its lyric_versions.
- `src/app/api/library/songs/[id]/route.ts` - DELETE route (user-owned) to hard-delete a song and cascade variants.
- `src/app/api/library/songs/[songId]/share/route.ts` - Share toggle + variant selection updates via POST/PATCH.
- `src/app/api/library/songs/[songId]/play/route.ts` - Update `lastPlayedAt` for analytics and sorting.
- `src/app/library/share/[publicId]/page.tsx` - Read-only share page rendered server-side for public links.
- `src/lib/library/queries.ts` - Encapsulate db.useQuery patterns for Library lists (top-level pagination, order by indexed fields).
- `src/lib/analytics/events.ts` - Add events: open_from_library, play_from_library, delete_from_library, share_song.
- `public/sw.js` or `src/app/(pwa)/service-worker.ts` - Add basic cache for covers and recent audio streams (stale-while-revalidate; range requests pass-through).
- `src/components/AudioMiniPlayer.tsx` - Reuse or extend for Library playback.
- `src/lib/library/queries.test.ts` - Unit tests for Library query helpers (search/sort/paginate constraints).
- `src/app/api/library/share/[publicId]/route.test.ts` - Read-only API tests for shareable songs.
- `src/app/api/library/songs/[id]/route.test.ts` - Delete flow tests for songs (ownership enforced).
- `src/app/api/library/conversations/[id]/route.test.ts` - Delete flow tests for conversations.

### Notes

- Unit tests should typically be placed alongside the code files they are testing (e.g., `MyComponent.tsx` and `MyComponent.test.tsx` in the same directory).
- Use `npx vitest` to run tests.

### Notes

- Index all fields used for filtering/ordering (Instant rule):
  - conversations: `updatedAt` (indexed), `status` (indexed), `conceptTitle` (indexed) or `title` alias; optionally `conversationPhase` (already indexed), `selectedTemplateId` (already indexed).
  - songs: `updatedAt` (indexed), `status` (indexed), `title` (indexed), `isPublic` (indexed), `publicId` (indexed, unique), optional `lastPlayedAt` (indexed) for sort.
  - songs search: add lightweight `lyricsSnippet` (indexed) for `$ilike` search; avoid full text on large `lyrics`.
  - sunoVariants: `songId` (indexed), `trackId` (indexed), `order` display only (no order by nested).
- Pagination only at top-level collections (conversations, songs). No pagination within nested variants.
- Client: use `@instantdb/react` (`db.useQuery`/`db.transact`) with user-scoped perms. Server: `@instantdb/admin` only in route handlers (share/read-only, deletes), env token required.
- Session enforcement: keep middleware APP_ENFORCE_SESSION=true for `/library` and related APIs.

Proposed schema additions (reference only; implement as part of Task 1):

```ts
// conversations
updatedAt: i.number().indexed().optional(),
// summaries
conceptTitle: i.string().indexed().optional(),
conceptLyrics: i.string().optional(),
conceptHistory: i.string().optional(),

// songs
updatedAt: i.number().indexed().optional(),
title: i.string().indexed().optional(),
isPublic: i.boolean().indexed().optional(),
publicId: i.string().indexed().optional(),
selectedVariantId: i.string().optional(),
lyricsSnippet: i.string().indexed().optional(),
lastPlayedAt: i.number().indexed().optional(),
```

## Tasks

- [ ] 1.0 Update Instant schema and indexes for Library
  - [x] 1.1 Conversations: add `updatedAt (indexed)`, `conceptTitle (indexed)`, `conceptLyrics`, `conceptHistory`
  - [ ] 1.2 Songs: add `updatedAt (indexed)`, `title (indexed)`, `isPublic (indexed)`, `publicId (indexed)`, `selectedVariantId`, `lyricsSnippet (indexed)`, `lastPlayedAt (indexed)`
  - [ ] 1.3 Verify existing indexes: `status (indexed)` on songs/conversations; `sunoVariants.songId (indexed)`, `sunoVariants.trackId (indexed)`
  - [ ] 1.4 Create helper to derive `lyricsSnippet` (first N chars/section) and `conceptTitle` from concept‑lyrics
  - [ ] 1.5 Update server writes to set `updatedAt` on conversations/songs (creation, callback updates, selection changes)
  - [ ] 1.6 On conversation finalize/refine, persist summary fields (`conceptTitle`, `conceptLyrics`, `conceptHistory`, `readinessScore`)
  - [ ] 1.7 On playback start, update `songs.lastPlayedAt` (server mutation)
  - [ ] 1.8 Run `npx instant-cli push` and validate queries for order/filter constraints

- [x] 2.0 Configure Instant permissions for user-scoped access
  - [x] 2.1 Allow `view` for conversations/songs/variants/lyric_versions where `user.id == session.userId`
  - [x] 2.2 Allow `delete` for user-owned conversations and songs; cascade deletes handled by server/admin route
  - [x] 2.3 Keep default‑deny for others; no public writes from client
  - [x] 2.4 Document that server routes continue to use `@instantdb/admin` for writes and sharing

- [ ] 3.0 Build `/library` UI (tabs, lists, search/sort/filter, playback)
  - [x] 3.1 Scaffold page at `src/app/library/page.tsx` with tabs (Gesprekken/Liedjes)
  - [x] 3.2 Conversations tab: list summaries (title/snippet/readiness/updatedAt), top‑level pagination
  - [x] 3.3 Songs tab: grid of covers with status badges; show selected variant if set
  - [x] 3.4 Search (`$ilike`): by title and lyricsSnippet; Sort (updatedAt desc default; A–Z; recently played)
  - [x] 3.5 Filters: status, language, template/tags (where available); ensure indexed fields only *(template/tag filters pending)*
  - [ ] 3.6 Actions: Open in Studio (preload by id); inline rename (songs.title)
  - [x] 3.7 Playback: integrate `AudioMiniPlayer`; set `lastPlayedAt` on play
  - [x] 3.8 Variant selection: UI to set `selectedVariantId` (server mutation)
  - [x] 3.9 Responsive/mobile layouts and empty/loading states
  - [x] 3.10 Extract shared query helpers in `src/lib/library/queries.ts` + tests *(tests pending)*

- [x] 4.0 Implement sharing for songs (public read-only link)
  - [x] 4.1 Add share toggle/action: generate `publicId` (UUID/slug), set `isPublic=true` on song *(disable toggle TBD)*
  - [x] 4.2 API: `POST /api/library/songs/[id]/share` (create/clear publicId)
- [x] 4.3 API: `GET /api/library/share/[publicId]` returns limited, read‑only fields + variants
  - [x] 4.4 UI: copy share link; optional lightweight share page or deep‑link back to Library player
  - [x] 4.5 Security review: ensure no private fields leak; perms deny non‑owner on internal reads

- [ ] 5.0 Implement delete flows and client mutations (hard-delete)
  - [x] 5.1 API: `DELETE /api/library/conversations/[id]` (ownership check; delete conversation + lyric_versions)
  - [x] 5.2 API: `DELETE /api/library/songs/[id]` (ownership check; delete song + cascade variants)
  - [x] 5.3 UI: add delete buttons with confirmation; optimistic update of lists *(optimistic removal pending)*
  - [ ] 5.4 Error handling and toasts for failure cases

- [ ] 6.0 Add basic PWA caching for covers/audio and analytics events
  - [ ] 6.1 Update/implement `public/sw.js`: stale‑while‑revalidate for covers, pass‑through range requests for audio; short TTL
  - [ ] 6.2 Ensure `ServiceWorkerRegister` loads on Library; test mobile playback offline behavior (best‑effort)
  - [ ] 6.3 Analytics: emit `open_from_library`, `play_from_library`, `delete_from_library`, `share_song`
  - [ ] 6.4 Accessibility/QA pass: keyboard nav, focus states, reduced motion

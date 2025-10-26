# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 app called "Liefdesliedje Maker" (Love Song Maker) - a Progressive Web App (PWA) that generates personalized love songs through an AI-powered conversational interface. The app combines:

- **AI Conversational Agent**: Multi-turn chat that gathers relationship context
- **Lyrics Generation**: Suno AI API lyrics generation with 2-variant comparison and one-time refinement
- **Music Generation**: Suno AI API (v4) integration with variant management
- **Realtime Database**: InstantDB for storing conversations, messages, songs, and lyrics versions
- **PWA Features**: Mobile-optimized UI, offline support, push notifications, installable
- **Session Management**: Custom JWT-based session system for mobile API routes

## Critical Dependencies

**IMPORTANT**: Before writing ANY InstantDB code, read `instant-rules.md` completely. Also review `AGENTS.md` for repository-wide coding conventions.

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **React 19** (all components must use `"use client"`)
- **TypeScript 5** with strict mode
- **Tailwind CSS 4** for styling
- **InstantDB** for realtime database with type-safe queries
- **Suno AI API** (v4 - lyrics and music generation)
- **Vitest** for unit/integration tests
- **Playwright** for E2E tests
- **npm 11.5.1** as package manager

## Common Commands

All commands run from the project root:

```bash
npm run dev         # Start dev server with Turbopack (port 3000)
npm run dev:3001    # Start dev server on port 3001
npm run build       # Production build
npm start           # Start production server
npm run lint        # Run Next.js linter
npm run test        # Run Vitest unit tests
npm run test:e2e    # Run Playwright E2E tests
```

## Git Workflow (Pull Request Model)

This repository uses a professional pull request workflow. **Never push directly to main.**

### Creating a New Feature Branch

```bash
# Ensure you're on main and up to date
git checkout main
git pull origin main

# Create a new feature branch with descriptive name
git checkout -b feature/your-feature-name
# Examples: feature/add-recording, fix/lyrics-bug, refactor/song-api
```

### Working on Your Feature

```bash
# Make changes to your code
# ...

# Stage and commit changes
git add .
git commit -m "feat: descriptive commit message"

# Push your branch to remote
git push -u origin feature/your-feature-name
```

### Creating a Pull Request

```bash
# Create PR using GitHub CLI
gh pr create --title "Add your feature" --body "Description of changes"

# Or create PR via GitHub web interface
# Visit: https://github.com/beingcrieative/songly/compare
```

### Before Creating a PR

Always ensure:
1. Code builds successfully: `npm run build`
2. Linter passes: `npm run lint`
3. Tests pass: `npm run test`
4. Schema changes are pushed: `npx instant-cli push` (if applicable)

### Merging Pull Requests

```bash
# After PR is approved and all checks pass:
gh pr merge <pr-number> --squash  # Squash and merge
# OR
gh pr merge <pr-number> --merge   # Regular merge
# OR use GitHub web interface
```

### Branch Naming Conventions

- `feature/` - New features (e.g., `feature/add-voice-recording`)
- `fix/` - Bug fixes (e.g., `fix/lyrics-generation-error`)
- `refactor/` - Code refactoring (e.g., `refactor/extract-suno-client`)
- `docs/` - Documentation updates (e.g., `docs/update-readme`)
- `test/` - Test additions/updates (e.g., `test/add-lyrics-tests`)
- `chore/` - Maintenance tasks (e.g., `chore/update-dependencies`)

### InstantDB Schema Management

```bash
npx instant-cli login  # Login to InstantDB (first time)
npx instant-cli push   # Push local schema to InstantDB
npx instant-cli pull   # Pull remote schema from InstantDB
```

After any schema changes, always push and commit both `instant.schema.ts` and `instant.perms.ts`.

## Environment Variables

Required in `.env`:

```bash
# InstantDB
NEXT_PUBLIC_INSTANT_APP_ID=<uuid>
INSTANT_APP_ADMIN_TOKEN=<uuid>  # For admin SDK operations

# Session Management (choose one)
SESSION_SECRET=<random-string>  # Primary session secret
NEXTAUTH_SECRET=<random-string> # Fallback if SESSION_SECRET not set

# AI Services
SUNO_API_KEY=<key>                # For lyrics and music generation

# Suno Webhook (for local dev, use ngrok)
SUNO_CALLBACK_URL=https://<domain>/api/suno/callback

# Optional Configuration
MAX_CONVERSATION_ROUNDS=8         # Default conversation length before lyrics
APP_ENFORCE_SESSION=false         # Set to 'true' to require session cookies
```

### Local Development with Suno Callbacks

Suno webhooks require a public URL. For local dev:

```bash
ngrok http 3000
export SUNO_CALLBACK_URL="https://<ngrok-id>.ngrok-free.app/api/suno/callback"
npm run dev
```

For mobile testing on LAN:

```bash
npm run dev:3001  # Run on port 3001 to avoid conflicts
# Then access via http://<your-ip>:3001 from mobile device
```

## Architecture

### Database Schema (`src/instant.schema.ts`)

Core entities with relationships:

- **conversations** - User chat sessions with status tracking
  - `status`: 'active' | 'generating_lyrics' | 'generating_music' | 'completed'
  - `conversationPhase`: 'gathering' | 'generating' | 'refining' | 'complete'
  - `currentStep`, `roundNumber`, `readinessScore`: Conversation flow tracking
  - `extractedContext`: JSON of ExtractedContext (relationship details)
  - `songSettings`: JSON of UserPreferences (language, vocalGender, mood)
  - `selectedTemplateId`, `templateConfig`: Template-based generation
  - Links to: user ($users), messages, songs, lyricVersions

- **messages** - Chat messages in conversations
  - `role`: 'user' | 'assistant'
  - `composerContext`: Optional metadata for UI context
  - Links to: conversation

- **songs** - Generated songs with metadata
  - `status`: 'generating' | 'ready' | 'failed'
  - `sunoTaskId`, `sunoTrackId`: Suno API identifiers
  - `audioUrl`, `streamAudioUrl`, `videoUrl`, `imageUrl`: Media URLs
  - `lyrics`, `title`, `musicStyle`, `prompt`: Song content
  - `templateId`, `lyricsTaskId`: Template and Suno lyrics generation
  - `version`: Version tracking for iterative generation
  - Links to: conversation, user, variants, lyricVersions

- **sunoVariants** - Multiple versions from Suno (2 tracks per generation)
  - `trackId`, `songId`: Identifiers
  - `streamAvailableAt`, `downloadAvailableAt`: Progressive loading timestamps
  - Links to: song

- **lyric_versions** - Lyrics iteration history
  - `content`, `label`, `hash`: Version content and metadata
  - `version`, `variantIndex`, `variantSource`: Source tracking
  - `isManual`, `isRefined`, `isSelection`: Type flags
  - Links to: conversation, song

- **push_subscriptions** - PWA push notification subscriptions
  - `endpoint`, `p256dh`, `auth`: Web Push credentials
  - `ua`, `platform`, `allowMarketing`: User agent and preferences
  - Links to: user

- **$users** - Built-in user entity
  - `email`: User email (indexed)
  - `type`: Optional user type
  - `linkedPrimaryUser`: Link to primary account for guest user consolidation

All indexed fields are marked `.indexed()` in schema. Do not filter or order by non-indexed fields.

### InstantDB Client Setup

- **Client-side**: `src/lib/db.ts` - Exports `db` for React hooks
- **Admin SDK**: `src/lib/adminDb.ts` - Exports `getAdminDb()` for server-side operations

Use `useDateObjects: true` for automatic date handling.

### Session Management

Custom JWT-based session system in `src/lib/session.ts`:

- `createSessionCookie(user, ttlMs)` - Creates signed JWT cookie
- `parseSessionCookie(cookieValue)` - Verifies and parses session
- `getSessionFromRequest(req)` - Extracts session from Next.js request

Middleware in `src/middleware.ts`:
- Sets security headers
- Detects mobile user agents
- Optionally enforces session cookies on protected routes (if `APP_ENFORCE_SESSION=true`)

Session bridging: `src/components/auth/SessionBridge.tsx` syncs InstantDB auth to session cookies.

### API Routes

#### Chat & Conversation APIs

**`/api/chat` (POST)** - Legacy chat endpoint
- Handles conversational lyrics generation with streaming refinements
- Manages multi-turn conversations
- Returns: `{ type: 'message' | 'message_lyrics', content, lyrics?, round }`

**`/api/chat/conversation` (POST)** - Create new conversation

#### Suno Music Generation APIs

**`/api/suno` (POST)** - Creates music generation task
- Input: `{ songId, title, lyrics, musicStyle, model?, instrumental? }`
- Calls Suno API `/api/v1/gateway/generate`
- Returns: `{ taskId, status: 'generating', model }`

**`/api/suno` (GET)** - Polls music generation status
- Query: `?taskId=<taskId>`
- Calls Suno API `/api/v1/gateway/query?ids={taskId}`
- Returns: `{ status, audioUrl, videoUrl, tracks: [...] }`

**`/api/suno/callback` (POST)** - Webhook receiver for Suno updates
- Updates song entity with track URLs and metadata
- Creates `sunoVariants` entities for each track
- Tracks progressive loading timestamps
- Query param: `?songId=<id>`

**`/api/suno/lyrics` (POST)** - Suno AI lyrics generation
- Uses Suno's lyrics model with caching
- Input: `{ prompt, conversationId }`
- Returns: `{ id, text, title }`

**`/api/suno/lyrics/callback` (POST)** - Webhook for lyrics generation

**`/api/suno/add-vocals` (POST)** - Adds vocals to instrumental track

**`/api/suno/add-instrumental` (POST)** - Creates instrumental version from vocal track

**`/api/admin/backfill-suno` (POST)** - Re-fetches song data for existing Suno tasks (admin only)

#### Mobile APIs (Session-based)

**`/api/mobile/conversations` (GET/POST)** - List/create conversations
**`/api/mobile/conversations/[id]` (GET)** - Get conversation details
**`/api/mobile/messages` (GET/POST)** - List/create messages
**`/api/mobile/songs` (GET/POST)** - List/create songs
**`/api/mobile/songs/[id]` (GET/PUT)** - Get/update song details

All mobile routes use session cookies instead of InstantDB auth.

#### Other APIs

**`/api/lyric-versions` (POST)** - Create/update lyrics versions
**`/api/auth/exchange` (POST)** - Exchange InstantDB token for session cookie
**`/api/auth/logout` (POST)** - Clear session cookie
**`/api/push/subscribe` (POST)** - Register push notification subscription
**`/api/push/test` (POST)** - Send test push notification
**`/api/cover/upload` (POST)** - Upload cover images for songs

### Frontend Architecture

#### Main Pages

**`src/app/page.tsx`** - Legacy main chat UI (original conversational interface)

**`src/app/studio/page.tsx`** - Modern studio interface
- Primary UI for creating songs
- Template-based workflow with `TemplateSelector`
- Conversational flow with context extraction
- Lyrics comparison and refinement with `LyricsCompare`
- Music generation with variant selection
- Integrated parameter controls

**`src/app/library/page.tsx`** - Library of created songs
- Browse user's song history
- Play/manage songs

**`src/app/settings/page.tsx`** - User settings and preferences

**`src/app/song/[id]/page.tsx`** - Song detail page
- Music player
- Lyrics display
- Share/download functionality

#### Key Components

**Conversational UI:**
- `ConversationalStudioLayout.tsx` - Main studio layout with chat interface
- `ChatBubble.tsx` - Chat message display
- `Avatar.tsx` - User/assistant avatars
- `ComposerControls.tsx` - Message input and controls

**Lyrics Management:**
- `LyricsPanel.tsx` - Display and edit lyrics
- `LyricsCompare.tsx` - Side-by-side lyrics comparison for refinement
- `ParameterSheet.tsx` - Music generation parameters

**Music Playback:**
- `MusicPlayer.tsx` - Full-featured audio player
- `AudioMiniPlayer.tsx` - Compact player for mobile
- `VariantSelector.tsx` - Choose between Suno-generated variants

**Templates & Settings:**
- `TemplateSelector.tsx` - Choose song templates
- `TemplateCard.tsx` - Template preview card
- `SongSettingsPanel.tsx` - Language, vocal, mood settings
- `AudioPreferencesPanel.tsx` - Audio-specific preferences
- `AdvancedControlsPanel.tsx` - Advanced generation controls
- `LanguageToggle.tsx` - Language switcher

**PWA Components:**
- `pwa/InstallPrompt.tsx` - PWA install prompt
- `pwa/ServiceWorkerRegister.tsx` - Service worker registration
- `ClientBoot.tsx` - Client-side initialization

**Mobile Components:**
- `mobile/NavTabs.tsx` - Bottom navigation tabs
- `mobile/ChatHeader.tsx` - Mobile chat header
- `mobile/ComposerBar.tsx` - Mobile message composer
- `mobile/DrawerSheet.tsx` - Mobile drawer/sheet UI
- `mobile/LyricsCardStack.tsx` - Swipeable lyrics cards

**Other:**
- `recorder/AudioRecorder.tsx` - Voice input recorder
- `MusicGenerationProgress.tsx` - Progress indicator

#### Utilities & Libraries

**`src/lib/utils/`:**
- `contextExtraction.ts` - Extract relationship context from conversations
- `readinessScore.ts` - Calculate conversation readiness for lyrics generation
- `lyricsFormatter.ts` - Format lyrics for display/generation
- `sunoLyricsPrompt.ts` - Build Suno lyrics generation prompts
- `vocalDescriptionBuilder.ts` - Generate vocal style descriptions
- `audioHelpers.ts` - Audio utility functions
- `sunoLyricsPrompt.ts` - Suno lyrics prompt builder

**`src/lib/prompts/`:**
- `conversationAgent.ts` - Conversation agent system prompts

**`src/lib/analytics/`:**
- `events.ts` - Analytics event definitions
- `recording.ts` - Audio recording analytics

**`src/lib/i18n/`:**
- `ui.ts` - Internationalization utilities

### Authentication

InstantDB magic code authentication with session bridging:

- Use `<db.SignedIn>` and `<db.SignedOut>` components
- Access current user with `db.useUser()` (only inside `<db.SignedIn>`)
- Send codes: `db.auth.sendMagicCode({ email })`
- Verify codes: `db.auth.signInWithMagicCode({ email, code })`
- Sign out: `db.auth.signOut()`
- Session bridging: `SessionBridge` component creates session cookies for mobile APIs

### PWA Features

**Manifest:** `public/manifest.webmanifest` - App manifest for installability
**Service Worker:** `public/sw.js` - Offline caching and push notifications
**Offline Page:** `public/offline.html` - Fallback page when offline

## InstantDB Patterns

### Writing Data

Always use transactions with generated IDs:
```typescript
import { id } from "@instantdb/react";

db.transact(
  db.tx.songs[id()]
    .update({ title, lyrics, status: 'generating' })
    .link({ conversation: conversationId, user: userId })
);
```

### Querying with Filters

Fields used in `where` or `order` MUST be indexed:
```typescript
db.useQuery({
  songs: {
    $: {
      where: { status: 'ready', 'user.id': userId },
      order: { createdAt: 'desc' }
    }
  }
})
```

### Admin Operations

For server-side operations (seeding, backfills, webhooks):
```typescript
import { getAdminDb } from '@/lib/adminDb';

const admin = getAdminDb();
if (!admin) {
  return NextResponse.json({ error: 'Admin not configured' }, { status: 500 });
}

await admin.transact(
  admin.tx.songs[songId].update({ audioUrl, status: 'ready' })
);
```

### Type Safety

Extract types from schema for type-safe queries:
```typescript
import { InstaQLEntity } from "@instantdb/react";
import { type AppSchema } from "@/instant.schema";

type Song = InstaQLEntity<AppSchema, "songs">;
type ConversationWithRelations = InstaQLEntity<
  AppSchema,
  "conversations",
  { messages: {}, songs: {}, lyricVersions: {} }
>;
```

## Suno API Integration

### Music Generation Flow

1. POST to `/api/suno` → receives `taskId`
2. Client polls GET `/api/suno?taskId=...` every 5 seconds
3. Suno webhook calls `/api/suno/callback?songId=...` with variant data
4. Callback updates song status and creates variant entities with progressive loading timestamps

### Lyrics Generation Flow

1. POST to `/api/suno/lyrics` → receives `taskId`
2. Poll or wait for webhook at `/api/suno/lyrics/callback`
3. Lyrics stored with caching in `src/app/api/suno/lyrics/cache.ts`

### Key Suno API Fields

**Music Request**:
- `custom_mode: true` - Use custom lyrics
- `prompt`: Lyrics text
- `title`: Song title
- `tags`: Music style description
- `model`: "V4" or "V5"
- `make_instrumental`: Boolean flag
- `callBackUrl`: Webhook endpoint with songId query param

**Response** (from callback):
- Each task returns ~2 track variants
- Track fields: `audio_url`, `stream_audio_url`, `video_url`, `image_url`, `duration`, `title`
- Progressive loading: `stream_audio_url` available first, then `audio_url`

See `prompts/sunomanual.md` for full API documentation.

## Suno Lyrics Integration

The app uses Suno's native lyrics generation API to create 2 lyric variants from conversation context. After the conversation reaches a readiness score ≥ 70%, the system:

1. **Generates 2 Variants**: Calls `/api/suno/lyrics` with context-based prompt
2. **Shows Progress**: `LyricsGenerationProgress` modal displays during generation (~30-45s)
3. **Compares Variants**: `LyricsCompare` component shows both variants side-by-side
4. **User Selects**: User must choose one variant before proceeding
5. **One-Time Refinement**: Optional feedback-based refinement via same API
6. **Manual Editing**: Users can manually edit selected lyrics
7. **Music Generation**: Selected lyrics flow to music generation via ParameterSheet

Key implementation files:
- `src/lib/utils/sunoLyricsPrompt.ts`: Builds Suno-optimized prompts with context
- `src/components/LyricsGenerationProgress.tsx`: Progress modal during generation
- `src/components/LyricsCompare.tsx`: 2-variant comparison UI
- `src/app/api/suno/lyrics/`: Suno lyrics API routes with callback support

Context extraction pattern in `src/lib/utils/contextExtraction.ts`:
- Extracts relationship details from conversation
- Calculates readiness score for lyrics generation
- Stores as JSON in `conversations.extractedContext`

## Testing

### Unit Tests (Vitest)

Run with: `npm run test`

Test files are colocated with components: `*.test.tsx`, `*.test.ts`

Examples:
- `src/components/LyricsCompare.test.tsx`
- `src/components/LyricsPanel.test.tsx`
- `src/components/ParameterSheet.test.tsx`
- `src/components/Avatar.test.tsx`
- `src/components/ChatBubble.test.tsx`
- `src/components/mobile/NavTabs.test.tsx`
- `src/lib/session.test.ts`
- `src/app/api/suno/lyrics/__tests__/lyrics-api.test.ts`

Mock InstantDB and external APIs in tests. Use React Testing Library for component tests.

### E2E Tests (Playwright)

Run with: `npm run test:e2e`

Configuration: `playwright.config.ts`
- Mobile Chrome profile (Pixel 7)
- Desktop Chrome profile
- Base URL: `http://192.168.77.222:3001` (configurable via `BASE_URL` env var)

Test directory: `tests/e2e/`

## Development Patterns

### Adding New Entities

1. Update `src/instant.schema.ts` with entity definition
2. Add links to relate entities
3. Run `npx instant-cli push` to sync schema
4. Update TypeScript types in components
5. Commit both schema and perms files

### Modifying Conversation Flow

- Update prompt templates in `src/lib/prompts/`
- Adjust context extraction logic in `src/lib/utils/contextExtraction.ts`
- Modify readiness scoring in `src/lib/utils/readinessScore.ts`
- Update chat API routes in `src/app/api/chat/`

### Adding Mobile API Routes

1. Create route in `src/app/api/mobile/`
2. Use session management: `getSessionFromRequest(req)`
3. Use admin SDK for database operations
4. Return JSON responses (no InstantDB hooks in server routes)

### Debugging Suno Issues

Check logs in these locations:
- `/api/suno/route.ts` - Generation request logs
- `/api/suno/callback/route.ts` - Webhook receiver logs
- Network tab for polling status responses

Use backfill endpoint to re-fetch song data:
```bash
curl -X POST "http://localhost:3000/api/admin/backfill-suno?token=$INSTANT_APP_ADMIN_TOKEN"
```

## File Organization

```
src/
├── app/
│   ├── page.tsx                  # Legacy main chat UI
│   ├── studio/page.tsx           # Modern studio interface
│   ├── library/page.tsx          # Song library
│   ├── settings/page.tsx         # User settings
│   ├── song/[id]/page.tsx        # Song detail page
│   ├── layout.tsx                # Root layout with InstantDB provider
│   ├── globals.css               # Global styles
│   └── api/
│       ├── chat/                 # Chat & conversation APIs
│       │   ├── route.ts          # Legacy chat endpoint
│       │   └── conversation/route.ts
│       ├── suno/                 # Suno music generation APIs
│       │   ├── route.ts
│       │   ├── callback/route.ts
│       │   ├── lyrics/route.ts
│       │   ├── lyrics/callback/route.ts
│       │   ├── add-vocals/route.ts
│       │   └── add-instrumental/route.ts
│       ├── mobile/               # Mobile session-based APIs
│       │   ├── conversations/route.ts
│       │   ├── conversations/[conversationId]/route.ts
│       │   ├── messages/route.ts
│       │   ├── songs/route.ts
│       │   └── songs/[songId]/route.ts
│       ├── auth/                 # Auth APIs
│       │   ├── exchange/route.ts
│       │   └── logout/route.ts
│       ├── push/                 # Push notification APIs
│       │   ├── subscribe/route.ts
│       │   └── test/route.ts
│       ├── cover/upload/route.ts
│       ├── lyric-versions/route.ts
│       └── admin/backfill-suno/route.ts
├── components/
│   ├── ConversationalStudioLayout.tsx
│   ├── ChatBubble.tsx
│   ├── Avatar.tsx
│   ├── ComposerControls.tsx
│   ├── LyricsPanel.tsx
│   ├── LyricsCompare.tsx
│   ├── ParameterSheet.tsx
│   ├── MusicPlayer.tsx
│   ├── AudioMiniPlayer.tsx
│   ├── VariantSelector.tsx
│   ├── TemplateSelector.tsx
│   ├── TemplateCard.tsx
│   ├── SongSettingsPanel.tsx
│   ├── AudioPreferencesPanel.tsx
│   ├── AdvancedControlsPanel.tsx
│   ├── LanguageToggle.tsx
│   ├── MusicGenerationProgress.tsx
│   ├── ClientBoot.tsx
│   ├── pwa/                      # PWA components
│   │   ├── InstallPrompt.tsx
│   │   └── ServiceWorkerRegister.tsx
│   ├── mobile/                   # Mobile components
│   │   ├── NavTabs.tsx
│   │   ├── ChatHeader.tsx
│   │   ├── ComposerBar.tsx
│   │   ├── DrawerSheet.tsx
│   │   └── LyricsCardStack.tsx
│   ├── recorder/
│   │   └── AudioRecorder.tsx
│   └── auth/
│       └── SessionBridge.tsx
├── lib/
│   ├── db.ts                     # InstantDB client (client-side)
│   ├── adminDb.ts                # InstantDB Admin SDK (server-side)
│   ├── session.ts                # Session management
│   ├── push.ts                   # Push notification utilities
│   ├── prompts/                  # AI agent prompts
│   │   └── conversationAgent.ts
│   ├── utils/                    # Utility functions
│   │   ├── contextExtraction.ts
│   │   ├── readinessScore.ts
│   │   ├── lyricsFormatter.ts
│   │   ├── sunoLyricsPrompt.ts
│   │   ├── vocalDescriptionBuilder.ts
│   │   ├── audioHelpers.ts
│   │   └── openrouterClient.ts
│   ├── analytics/                # Analytics
│   │   ├── events.ts
│   │   └── recording.ts
│   └── i18n/                     # Internationalization
│       └── ui.ts
├── middleware.ts                 # Next.js middleware (security, sessions)
├── instant.schema.ts             # Database schema with type safety
└── instant.perms.ts              # Access control rules

public/
├── manifest.webmanifest          # PWA manifest
├── sw.js                         # Service worker
├── offline.html                  # Offline fallback
└── icons/                        # PWA icons

tests/
└── e2e/                          # Playwright E2E tests

tasks/                            # Product requirement docs (PRDs)
├── 0001-prd-love-song-studio.md
├── 0002-prd-two-agent-conversation-system.md
├── 0003-prd-suno-music-generation-integration.md
├── 0004-prd-vocal-preferences-and-ui-improvements.md
├── 0005-prd-template-based-studio-workflow.md
├── 0006-prd-lyrics-compare-and-selection.md
├── 0007-prd-pwa-studio-server-and-cover-audio.md
├── 0010-prd-visual-refresh-and-params.md
└── 0011-prd-pwa-native-shell-ui.md

prompts/                          # API documentation
├── sunomanual.md                 # Suno API docs
└── sunoapi.md                    # Suno API parameters reference

instant-rules.md                  # Critical InstantDB usage rules (READ FIRST)
AGENTS.md                         # Repository coding guidelines (READ FIRST)
```

## Common Pitfalls

1. **Non-indexed fields**: Cannot filter/order by fields without `.indexed()` in schema
2. **Conditional hooks**: InstantDB hooks like `db.useQuery()` cannot be conditional
3. **Client vs Admin SDK**: Use client SDK (`@instantdb/react`) in components, Admin SDK (`@instantdb/admin`) in API routes
4. **Seeding data**: Never seed from client, always use Admin SDK in scripts
5. **Suno callbacks**: Require public URL - use ngrok for local dev
6. **Polling timeout**: Songs may take 60-90 seconds to generate
7. **Progressive loading**: Suno provides `stream_audio_url` first, then `audio_url` - handle both
8. **Session management**: Mobile APIs use session cookies, not InstantDB auth - use `getSessionFromRequest()`
9. **Guest users**: Guest users can be linked to primary users via `$users.linkedPrimaryUser`
10. **Test mocking**: Always mock InstantDB and external APIs in tests

## Reference Documentation

- InstantDB: https://instantdb.com/docs (read `instant-rules.md` first)
- Suno API: https://docs.sunoapi.com (see `prompts/sunomanual.md` and `sunoapi.md`)
- Next.js 15: https://nextjs.org/docs
- Vitest: https://vitest.dev/
- Playwright: https://playwright.dev/
- PWA: https://web.dev/progressive-web-apps/

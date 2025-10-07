# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Next.js 15 app that generates personalized love songs through an AI-powered chat interface. It's called "Liefdesliedje Maker" (Love Song Maker) and combines:

- **AI Chat Agent**: Conversational flow that asks questions about relationships
- **Lyrics Generation**: Uses OpenRouter (DeepSeek Chat v3.1) to write personalized lyrics
- **Music Generation**: Integrates with Suno AI API (v4) to compose music
- **Realtime Database**: InstantDB for storing conversations, messages, and songs

## Critical Dependencies

Before writing ANY InstantDB code, read `instant-rules.md` completely. It contains critical information about:
- Query operators and field indexing requirements
- Hook usage constraints
- Data seeding with Admin SDK
- Authentication patterns

## Tech Stack

- **Next.js 15** with App Router and Turbopack
- **React 19** (all components must use `"use client"`)
- **TypeScript 5** with strict mode
- **Tailwind CSS 4** for styling
- **InstantDB** for realtime database with type-safe queries
- **OpenRouter API** (DeepSeek Chat v3.1 - free tier)
- **Suno AI API** (v4 - music generation)
- **npm 11.5.1** as package manager

## Common Commands

All commands run from the project root:

```bash
npm run dev       # Start dev server with Turbopack
npm run build     # Production build
npm start         # Start production server
npm run lint      # Run Next.js linter
```

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

# AI Services
OPENROUTER_API_KEY=sk-or-v1-...  # For lyrics generation (DeepSeek)
SUNO_API_KEY=<key>                # For music generation

# Suno Webhook (for local dev, use ngrok)
SUNO_CALLBACK_URL=https://<domain>/api/suno/callback

# Optional
MAX_CONVERSATION_ROUNDS=8  # Default conversation length before lyrics
```

### Local Development with Suno Callbacks

Suno webhooks require a public URL. For local dev:

```bash
ngrok http 3000
export SUNO_CALLBACK_URL="https://<ngrok-id>.ngrok-free.app/api/suno/callback"
npm run dev
```

## Architecture

### Database Schema (`src/instant.schema.ts`)

Core entities with relationships:

- **conversations** - User chat sessions with status tracking
  - `status`: 'active' | 'generating_lyrics' | 'generating_music' | 'completed'
  - `currentStep`: Conversation progress counter
  - Links to: user ($users), messages, songs

- **messages** - Chat messages in conversations
  - `role`: 'user' | 'assistant'
  - Links to: conversation

- **songs** - Generated songs with metadata
  - `status`: 'generating' | 'ready' | 'failed'
  - `sunoTaskId`: Task ID for status polling
  - `audioUrl`, `streamAudioUrl`, `videoUrl`, `imageUrl`: Media URLs
  - Links to: conversation, user

- **sunoVariants** - Multiple versions from Suno (2 tracks per generation)
  - Links to: song

All indexed fields are marked `.indexed()` in schema. Do not filter or order by non-indexed fields.

### InstantDB Client Setup

- **Client-side**: `src/lib/db.ts` - Exports `db` for React hooks
- **Admin SDK**: `src/lib/adminDb.ts` - Exports `getAdminDb()` for server-side operations

Use `useDateObjects: true` for automatic date handling.

### API Routes

#### `/api/chat` (POST)
Handles conversational lyrics generation with streaming refinements:
- Manages multi-turn conversations
- Generates hidden concept lyrics in parallel with visible chat
- Uses `###CONCEPT_LYRICS v{N}###` format for iterative refinement
- Returns: `{ type: 'message' | 'message_lyrics', content, lyrics?, round }`

Key pattern: After each user message, returns both visible chat text AND updated concept lyrics (hidden from user in chat UI, but shown in sidebar).

#### `/api/suno` (POST)
Creates music generation task:
- Input: `{ songId, title, lyrics, musicStyle, model?, instrumental? }`
- Calls Suno API `/api/v1/gateway/generate`
- Returns: `{ taskId, status: 'generating', model }`

#### `/api/suno` (GET)
Polls music generation status:
- Query: `?taskId=<taskId>`
- Calls Suno API `/api/v1/gateway/query?ids={taskId}`
- Returns: `{ status, audioUrl, videoUrl, tracks: [...] }`

#### `/api/suno/callback` (POST)
Webhook receiver for Suno variant updates:
- Updates song entity with track URLs and metadata
- Creates `sunoVariants` entities for each track
- Query param: `?songId=<id>`

#### `/api/suno/add-vocals` (POST)
Adds vocals to instrumental track

#### `/api/suno/add-instrumental` (POST)
Creates instrumental version from vocal track

#### `/api/admin/backfill-suno` (POST)
Re-fetches song data for existing Suno tasks (admin only)

### Frontend Architecture (`src/app/page.tsx`)

Main page is a large client component with:

- **Multi-step conversational UI** with FLOW_STEPS and PROMPT_LIBRARY
- **Real-time InstantDB queries** for conversations, messages, songs
- **Polling mechanism** for Suno task status (checks every 5s)
- **Lyrics refinement flow** - user can iterate on concept lyrics before generating music
- **Music player component** with download/share functionality

Key pattern: Uses `db.useQuery()` with nested relations:
```typescript
db.useQuery({
  conversations: {
    $: { where: { 'user.id': user.id }, order: { createdAt: 'desc' } },
    messages: { $: { order: { createdAt: 'asc' } } },
    songs: { $: { order: { createdAt: 'desc' } } }
  }
})
```

### Song Detail Page (`src/app/song/[id]/page.tsx`)

Displays individual song with:
- Music player
- Lyrics display
- Share functionality
- Download options

### Authentication

InstantDB magic code authentication:
- Use `<db.SignedIn>` and `<db.SignedOut>` components
- Access current user with `db.useUser()` (only inside `<db.SignedIn>`)
- Send codes: `db.auth.sendMagicCode({ email })`
- Verify codes: `db.auth.signInWithMagicCode({ email, code })`
- Sign out: `db.auth.signOut()`

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
  { messages: {}, songs: {} }
>;
```

## Suno API Integration

### Music Generation Flow

1. POST to `/api/suno` → receives `taskId`
2. Client polls GET `/api/suno?taskId=...` every 5 seconds
3. Suno webhook calls `/api/suno/callback?songId=...` with variant data
4. Callback updates song status and creates variant entities

### Key Suno API Fields

**Request**:
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

See `prompts/sunomanual.md` for full API documentation.

## OpenRouter / DeepSeek Integration

Uses DeepSeek Chat v3.1 (free tier) via OpenRouter for lyrics generation.

Key prompts in `/api/chat/route.ts`:
- `SYSTEM_PROMPT`: Guides conversational flow with hidden concept lyrics
- `lyricsPrompt`: Final lyrics generation when conversation complete
- `refineLyrics`: Iterative improvements to concept lyrics

Concept lyrics use special format:
```
###CONCEPT_LYRICS v{N}###
{ "version": N, "title": "...", "lyrics": "...", "style": "...", "notes": "..." }
###END###
```

This block is parsed out and shown in UI sidebar, hidden from main chat.

## Development Patterns

### Adding New Entities

1. Update `src/instant.schema.ts` with entity definition
2. Add links to relate entities
3. Run `npx instant-cli push` to sync schema
4. Update TypeScript types in components
5. Commit both schema and perms files

### Modifying Conversations Flow

- Update `FLOW_STEPS` and `PROMPT_LIBRARY` in `page.tsx`
- Adjust `MAX_CONVERSATION_ROUNDS` in `.env` or `/api/chat/route.ts`
- Modify `SYSTEM_PROMPT` to change AI behavior

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
│   ├── page.tsx              # Main chat UI
│   ├── song/[id]/page.tsx    # Song detail page
│   ├── layout.tsx            # Root layout with InstantDB provider
│   ├── globals.css           # Global styles
│   └── api/
│       ├── chat/route.ts     # OpenRouter lyrics generation
│       ├── suno/route.ts     # Suno music generation & status
│       ├── suno/callback/route.ts     # Suno webhook receiver
│       ├── suno/add-vocals/route.ts   # Add vocals to track
│       ├── suno/add-instrumental/route.ts # Create instrumental
│       └── admin/backfill-suno/route.ts   # Re-fetch Suno data
├── lib/
│   ├── db.ts                 # InstantDB client (client-side)
│   └── adminDb.ts            # InstantDB Admin SDK (server-side)
├── instant.schema.ts         # Database schema with type safety
└── instant.perms.ts          # Access control rules

prompts/                      # API documentation and references
├── sunomanual.md            # Suno API docs
├── openrouter.md            # OpenRouter API docs
└── instantmanual.md         # InstantDB patterns

instant-rules.md             # Critical InstantDB usage rules (READ FIRST)
```

## Common Pitfalls

1. **Non-indexed fields**: Cannot filter/order by fields without `.indexed()` in schema
2. **Conditional hooks**: InstantDB hooks like `db.useQuery()` cannot be conditional
3. **Client vs Admin SDK**: Use client SDK (`@instantdb/react`) in components, Admin SDK (`@instantdb/admin`) in API routes
4. **Seeding data**: Never seed from client, always use Admin SDK in scripts
5. **Suno callbacks**: Require public URL - use ngrok for local dev
6. **Polling timeout**: Songs may take 60-90 seconds to generate
7. **Hidden lyrics format**: Must use exact `###CONCEPT_LYRICS v{N}###` delimiters

## Reference Documentation

- InstantDB: https://instantdb.com/docs (read `instant-rules.md` first)
- Suno API: https://docs.sunoapi.com (see `prompts/sunomanual.md`)
- OpenRouter: https://openrouter.ai/docs
- DeepSeek Model: https://openrouter.ai/models/deepseek/deepseek-chat-v3.1:free
- Next.js 15: https://nextjs.org/docs

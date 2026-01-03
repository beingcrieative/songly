# GEMINI.md - Songly / Love Song Studio

## Project Overview
Songly is a personalized AI music generation platform, specifically featuring a "Love Song Studio". It guides users through a conversational interface to capture sentiments and memories, which are then transformed into lyrics and eventually full-blown songs using the Suno API.

### Main Technologies
- **Framework:** [Next.js](https://nextjs.org/) (App Router, React 19)
- **Database & Real-time:** [InstantDB](https://www.instantdb.com/) (Real-time graph database)
- **Music Generation:** [Suno API](https://sunoapi.org/)
- **Styling:** [Tailwind CSS v4](https://tailwindcss.com/)
- **Icons:** [Lucide React](https://lucide.dev/)
- **Testing:** [Vitest](https://vitest.dev/) (Unit), [Playwright](https://playwright.dev/) (E2E)

### Architecture
- **Conversational AI:** A two-agent system (Gathering context -> Generating lyrics).
- **Asynchronous Workflow:** Music generation is handled asynchronously via Suno with status tracking and webhook callbacks (`/api/suno/callback`).
- **Real-time Sync:** InstantDB ensures that the UI (lyrics, song status, variants) stays updated across devices without manual refreshes.
- **Mobile First:** Strong emphasis on mobile UX with specific components located in `src/components/mobile/`.

## Core Entities (InstantDB)
- `conversations`: Stores the state of a user's song creation session.
- `messages`: Individual chat messages between the user and AI agents.
- `songs`: The primary entity for a generated song, including metadata and status.
- `lyric_versions`: History of generated and refined lyrics.
- `sunoVariants`: Different audio versions produced for a single song.
- `projects`: Organizational units for grouping songs (e.g., for a specific person).
- `push_subscriptions`: Web push tokens for notifications when generation completes.

## Key Directories
- `src/app/studio/`: The core workspace where users interact with the AI to create songs.
- `src/app/api/suno/`: Integration logic for lyrics and music generation with the Suno API.
- `src/components/`: Reusable UI components, including specialized panels for lyrics and music progress.
- `src/lib/`: Shared utilities, database initialization (`db.ts`), and API helpers.
- `tasks/`: Comprehensive PRDs and task lists documenting the feature evolution.

## Building and Running
### Local Development
```bash
# Install dependencies
pnpm install

# Run development server
pnpm dev

# Run on a specific port (e.g., for mobile testing)
pnpm dev:3001
```

### Database Management (InstantDB)
```bash
# Push schema changes to production/preview
npx instant-cli push

# Pull schema changes from the dashboard
npx instant-cli pull
```

### Testing & Quality
```bash
# Run unit tests
pnpm test

# Run E2E tests
pnpm test:e2e

# Run linter
pnpm lint
```

## Development Conventions
- **Hydration:** For mobile devices, hydration often happens via API calls (`/api/mobile/`) to handle Admin SDK permissions that the client-side `db` cannot.
- **Environment Variables:**
    - `NEXT_PUBLIC_INSTANT_APP_ID`: Required for database connection.
    - `SUNO_API_KEY`: Required for music generation.
    - `NEXT_PUBLIC_DEV_MODE`: If `true`, bypasses authentication.
- **Phase Management:** The studio uses a state-based phase system: `gathering` -> `generating` -> `complete`.
- **Styling:** Adheres to Tailwind CSS v4 patterns. Avoid using legacy CSS where possible.
- **Real-time:** Use `db.useQuery` for real-time data needs on desktop, but prefer API-based updates for mobile to manage complex permissions.

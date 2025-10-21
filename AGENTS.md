# Repository Guidelines

## Project Structure & Module Organization
- App Router under `src/app/` (e.g., `src/app/studio`, `src/app/library`).
- Domain contracts in `src/instant.schema.ts` and access policy in `src/instant.perms.ts` (edit together, then sync).
- Server-only Instant admin client in `src/lib/adminDb.ts`; session helpers in `src/lib/session.ts`.
- Shared utilities in `src/lib/`; UI in `src/components/`; static assets in `public/`.
- Tests colocated as `*.test.ts`/`*.test.tsx` next to features.

## Build, Test, and Development Commands
- `npm run dev` — Start Next.js (Turbopack) with hot reload.
- `npm run build` — Create a production build.
- `npm run start` — Run the production server locally.
- `npm run lint` — Apply/check the Next.js ESLint rules.
- `npx vitest` — Run unit/integration tests.
- After schema/perm edits: `npx instant-cli push` (or `pull`) to sync with InstantDB.

## Coding Style & Naming Conventions
- TypeScript, two-space indentation, semicolons required.
- Components in `src/app/` use PascalCase (e.g., `TemplateSelector.tsx`); utilities use camelCase.
- Prefer Tailwind utility classes or `globals.css`; avoid ad‑hoc inline styles.
- Use absolute imports via configured path aliases (e.g., `@/lib/db`).

## Testing Guidelines
- Framework: Vitest (with React Testing Library where relevant).
- Place tests beside code: `Button.test.tsx`, `lib/session.test.ts`.
- Keep tests deterministic; mock InstantDB and external APIs.
- Focus coverage on core flows: session, mobile API routes, lyrics/music orchestration.

## Commit & Pull Request Guidelines
- Commits: short, imperative subjects (optionally scoped), e.g. `feature: add mobile songs API`.
- Before opening a PR: ensure `npm run lint` and `npm run build` succeed.
- PR description: include context, linked issues, notable UI changes (screenshots/GIFs), and any schema/permission updates (with `instant-cli` transcript).

## Security & Configuration Tips
- Required env: `NEXT_PUBLIC_INSTANT_APP_ID`, `INSTANT_APP_ADMIN_TOKEN` (admin), `NEXTAUTH_SECRET`/`SESSION_SECRET`, and Suno keys as applicable.
- Never hardcode admin tokens; server routes must use `src/lib/adminDb.ts`.
- Mobile data flows should use `/api/mobile/**` routes; avoid client writes to Instant entities on PWA screens.


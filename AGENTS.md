# Repository Guidelines

## Project Structure & Module Organization
- Core Next.js App Router code lives in `src/app`; `page.tsx` drives the UI and `layout.tsx` wires shared providers and global styles.
- Domain primitives are defined in `src/instant.schema.ts` and access rules in `src/instant.perms.ts`; keep schema and rules changes coordinated with the InstantDB backend.
- Shared clients and utilities belong in `src/lib` (currently `db.ts` bootstraps the InstantDB client). Add reusable helpers here instead of inside feature folders.
- Static assets stay in `public/`; prompt templates and reference flows live in `prompts/` and `examples/`. This separation keeps the TypeScript sources in `src/` focused on application code.

## Build, Test, and Development Commands
- `npm run dev` starts the dev server with Turbopack for hot reloading.
- `npm run build` compiles the production bundle; run before shipping infra changes.
- `npm run start` serves the built app locally; use to verify production behavior.
- `npm run lint` executes the Next.js/ESLint ruleset; fix reported issues before opening a PR.
- `npx instant-cli push` / `npx instant-cli pull` sync schema updates with InstantDB; always commit schema and permissions changes alongside CLI runs.

## Coding Style & Naming Conventions
- Use TypeScript everywhere, with two-space indentation and semicolons. Keep React components as `PascalCase` files in `src/app` and utility modules in `camelCase`.
- Co-locate styles via Tailwind utility classes or `globals.css`; avoid inline style objects unless dynamic.
- Prefer absolute imports from `src/` when adding `tsconfig` path aliases, and keep hooks/components small and declarative.

## Testing Guidelines
- No automated test harness ships yet; when adding features, include targeted Jest or React Testing Library specs (`*.test.ts(x)`) under the relevant feature folder.
- For flows that hit InstantDB, mock network calls where possible; confirm schema interactions by running against a dev app before merging.

## Commit & Pull Request Guidelines
- History currently uses short imperative subjects (e.g., `Initial commit (create-instant-app)`). Follow that tone, optionally adding a scope (`feat: conversation composer`).
- Squash work into logically grouped commits, and ensure lint/build succeed locally.
- PRs should describe the change, note required env vars or migrations, and add screenshots or CLI transcripts for UI or schema updates.

## InstantDB & Configuration Tips
- Set `NEXT_PUBLIC_INSTANT_APP_ID` in `.env.local` before running the app.
- After updating schema or permissions, rerun the Instant CLI and include regenerated files in the PR so reviewers can trace data contract changes.

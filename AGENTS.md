# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` hosts the Next.js App Router; `page.tsx` and `layout.tsx` orchestrate UI and shared providers.
- Domain schema lives in `src/instant.schema.ts`; access rules in `src/instant.perms.ts`. Update both in sync with InstantDB.
- Shared clients and utilities go under `src/lib/` (e.g., `db.ts` for bootstrapping the InstantDB client). Place reusable helpers here instead of feature folders.
- Static assets belong in `public/`; prompt templates in `prompts/`; reference flows in `examples/`. Keep TypeScript-only code in `src/`.

## Build, Test, and Development Commands
- `npm run dev` — start the dev server with Turbopack hot reload.
- `npm run build` — compile the production bundle; run before shipping infra changes.
- `npm run start` — serve the built bundle locally to verify production behavior.
- `npm run lint` — execute the Next.js/ESLint ruleset; fix all reported issues pre-PR.
- `npx instant-cli push` / `npx instant-cli pull` — sync schema and permissions with InstantDB; commit regenerated files alongside code.

## Coding Style & Naming Conventions
- Use TypeScript, two-space indentation, and semicolons throughout.
- Keep React components in `PascalCase` under `src/app/`; utilities use `camelCase` filenames.
- Favor Tailwind utility classes or `globals.css` for styling; avoid inline style objects unless dynamic.
- Prefer absolute imports configured via `tsconfig` path aliases when available.

## Testing Guidelines
- Add targeted Jest or React Testing Library specs (`*.test.ts(x)`) next to the feature they cover.
- Mock InstantDB calls where possible; verify schema interactions against a dev app before merging.
- Keep tests concise and deterministic; prioritize critical flows touching the database or shared clients.

## Commit & Pull Request Guidelines
- Follow short, imperative commit subjects (optionally `scope: message`).
- Ensure lint/build succeed locally before pushing.
- In PRs, describe the change, note schema or perm updates, list env tweaks, and attach screenshots or CLI transcripts for UI/data contract changes.

## InstantDB & Configuration Tips
- Set `NEXT_PUBLIC_INSTANT_APP_ID` in `.env.local` before running the app.
- After schema or permissions edits, rerun Instant CLI commands and commit the updated artifacts so reviewers can trace data contract changes.

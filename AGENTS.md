# Repository Guidelines

## Project Structure & Module Organization
Keep feature logic in `src/` with the App Router under `src/app/`; `page.tsx` files render entry points while `layout.tsx` hosts shared providers. Domain contracts live in `src/instant.schema.ts` and access policy in `src/instant.perms.ts`; edit them together and sync with InstantDB. Shared utilities such as the database client belong in `src/lib/`, and static assets go in `public/`. Store prompt templates in `prompts/` and example flows in `examples/` to keep the core app lean.

## Build, Test, and Development Commands
Run `npm run dev` for a Turbopack-powered development server with hot reload. Use `npm run build` before shipping infra changes, and `npm run start` to validate the production bundle locally. Execute `npm run lint` to apply the Next.js ESLint ruleset, and only commit once it passes. When schema or permission files change, run `npx instant-cli push` or `npx instant-cli pull` to sync with InstantDB.

## Coding Style & Naming Conventions
Write TypeScript with two-space indentation and semicolons. Components in `src/app/` should use PascalCase filenames, while utilities prefer camelCase. Favor Tailwind utility classes or `globals.css` for styling; avoid ad-hoc inline style objects unless the value is dynamic. Prefer absolute imports configured in `tsconfig` path aliases to keep import trees predictable.

## Testing Guidelines
Place Jest or React Testing Library specs alongside the features they cover using the `*.test.ts` or `*.test.tsx` suffix. Keep tests deterministic and concise, mocking InstantDB requests where possible. Target the core data flows and shared clients; ensure critical paths are covered before merging.

## Commit & Pull Request Guidelines
Use short, imperative commit subjects, optionally scoping them like `feature: describe change`. Before opening a PR, verify `npm run lint` and `npm run build` succeed, and summarize the change, schema or permission updates, environment tweaks, and any relevant screenshots or CLI transcripts.

## InstantDB & Configuration Tips
Set `NEXT_PUBLIC_INSTANT_APP_ID` in `.env.local` before running the app. After editing `instant.schema.ts` or `instant.perms.ts`, rerun the Instant CLI sync and commit regenerated artifacts so reviewers can trace data contract adjustments. Confirm schema interactions against a development app prior to merge.

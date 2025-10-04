# Repository Guidelines

## Project Structure & Module Organization
Source lives under `src/` with the App Router in `src/app`, reusable UI in `src/components`, and Supabase clients in `src/lib` and `src/utils/supabase`. Static assets reside in `public/`. Root-level configs (`next.config.ts`, `eslint.config.mjs`, `postcss.config.mjs`, `tsconfig.json`) should stay aligned with framework upgrades. Place new server utilities alongside existing ones in `src/utils/supabase` to share typing and connection helpers.

## Build, Test, and Development Commands
Run `npm run dev` for the Turbopack-powered dev server, `npm run build` to produce the optimized Next.js output, and `npm run start` to verify the production build locally. Always lint before pushing with `npm run lint`, which applies the `next/core-web-vitals` ruleset. Install dependencies with `npm install` so everyone stays aligned with the committed `package-lock.json`.

## Coding Style & Naming Conventions
This codebase is TypeScript-first; keep types explicit for Supabase payloads and API responses. Follow the existing 2-space indentation, prefer double quotes in TSX, and order JSX attributes logically (structural props before styling). Component files should use PascalCase such as `SupabasePublicDemo.tsx`, while hooks and utilities stay camelCase. Tailwind utility groupings should read from layout > color > effects. Defer to ESLint for formatting disputes and avoid adding lint disables without discussion.

## Testing Guidelines
There is no automated test harness yet; new features must at least expand coverage through targeted lint checks and manual verification notes in the PR. If you introduce automated tests, colocate them beside the module (for example, `FileName.test.tsx`) and prefer Playwright or Testing Library for UI flows, mocking Supabase interactions with seeded data. Document any SQL fixtures required for reproducible scenarios.

## Commit & Pull Request Guidelines
Write commit subjects in the imperative mood (for example, `Add Supabase realtime handler`) and keep them under 72 characters. Group related changes to reduce noise in the history. Pull requests should link issues, outline Supabase schema or policy changes, and attach screenshots or terminal output for user-visible updates. Confirm that `.env.local` secrets stay out of version control and note any migration steps in the description.

## Security & Configuration Tips
Store Supabase keys in `.env.local`; never hard-code them. When new env vars are required, document their purpose in the PR and update onboarding docs. Review `src/middleware.ts` changes for authentication impact, and audit database policies before enabling anon access.

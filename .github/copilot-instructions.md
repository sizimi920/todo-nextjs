# Copilot Project Instructions

Concise, project-specific guidance for AI coding agents. Focus on these conventions and patterns before proposing changes.

## Architecture & Data Flow
- Next.js App Router project (`src/app`). Single demo page `src/app/page.tsx` renders `SupabasePublicDemo`.
- Supabase integration has two layers:
  - Simple public client: `src/lib/supabaseClient.ts` used in client components with anon/publishable keys.
  - SSR-aware helpers: `src/utils/supabase/{client,server,middleware}.ts` wrapping `@supabase/ssr` for cookie-based auth continuity (currently only session refresh + redirect logic, login page not implemented yet).
- Middleware (`src/middleware.ts`) delegates to `updateSession` for session sync + optional redirect to `/login` (placeholder). Keep logic minimal between client creation and `auth.getUser()`.
- UI: Tailwind CSS utility-first styling inside components. No global component library. "Todo" feature uses realtime channel + CRUD against `todos` table.

## Supabase Usage Patterns
- Environment vars required (must exist in `.env.local`):
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY` (used in `src/lib/supabaseClient.ts`)
  - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (used in SSR helpers) — keep naming consistent; do NOT mix anon vs publishable variable names when extending.
- Realtime: In `SupabasePublicDemo` a channel `supabase.channel('db-changes')` registers separate handlers for INSERT/DELETE/UPDATE on `public.todos`. Follow this pattern (compose chained `.on` calls and finalize with `.subscribe`). Always clean up with `supabase.removeChannel(channel)` in `useEffect` cleanup.
- CRUD: Limit selects (`.limit(50)`) and explicitly order by `created_at DESC`. Mirror this when adding new list queries.
- Optimistic UI: Toggle and delete mutate state locally after successful response; insert relies on realtime refresh + clearing input.

## Coding Conventions
- TypeScript-first. Explicit domain types (e.g., `type Todo`). Add new types near usage or centralize if reused.
- Components: PascalCase in `src/components`. Utilities/hooks: camelCase.
- Use double quotes in TS/TSX. 2-space indentation. Tailwind class order: layout/spacing > color/background > effects > state.
- Avoid disabling ESLint; run `npm run lint` before commits.

## Adding Features Safely
- For new Supabase tables: document the SQL in README or commit message, and note RLS expectations (public vs auth required). If adding auth-only features ensure middleware matcher paths include/exclude appropriately.
- Reuse `createBrowserClient` / `createServerClient` patterns; do not instantiate raw clients ad hoc in many files.
- When adding server components requiring auth, import server `createClient()` from `src/utils/supabase/server.ts` inside the function body (avoid top-level awaits interfering with edge runtime).
- Keep middleware changes minimal and return the mutated `supabaseResponse` to prevent session cookie desync.

## Build & Dev Workflow
- Install deps: `npm install` (lockfile present; prefer npm to stay consistent).
- Dev: `npm run dev` (Turbopack). Production check: `npm run build` then `npm run start`.
- Lint: `npm run lint` (uses `next/core-web-vitals`). Fix style issues before proposing refactors.

## Common Pitfalls (Avoid)
- Mixing `NEXT_PUBLIC_SUPABASE_ANON_KEY` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` incorrectly — follow existing file usage.
- Forgetting cleanup of realtime channels -> memory leaks / duplicate events.
- Executing logic between Supabase server client creation and `auth.getUser()` in middleware (can break sessions).
- Returning a fresh `NextResponse` instead of the modified `supabaseResponse` without copying cookies.

## Example Extensions
- Add pagination: copy `fetchTodos` pattern, add `.range(offset, offset+limit-1)`; keep ordering.
- Add optimistic insert: push new item to state before insert, rollback on error (currently not implemented but consistent with toggle/delete approach).
- Add filtering (e.g., completed): add `.eq("isCompleted", true)` and keep existing order + limit.

## When Unsure
- Prefer mirroring patterns from `SupabasePublicDemo.tsx` for client interactions and `server.ts` for server interactions.
- Keep changes small and provide rationale tied to these conventions.

(End of instructions — update this file if project structure or Supabase integration strategy changes.)

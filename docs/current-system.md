# Current System

## Runtime

- one TanStack Start application lives at the repo root
- the imported baseline structure remains preserved in `src/`, including generated route tree, shell, components, UI primitives, and styles
- build and dev commands come from `package.json`
- the canonical deployment runtime is now Nitro for Vercel:
  `npm run build` emits `.output/` locally
  `vercel build` emits `.vercel/output/` with Vercel functions
- request middleware in `src/start.ts` now resolves either:
  a temporary local account session from an httpOnly cookie when the local bypass env contract is enabled
  or a Supabase session through `supabase.auth.getUser()` when auth env exists
  and otherwise falls back to signed-out preview context instead of crashing preview routes

## Implemented Route Contract

- `src/routes/index.tsx`
  renders one of three states behind the same route:
  login-first unauthenticated entry
  authenticated onboarding gate
  authenticated persisted weekly plan
- `src/routes/login.tsx`
  renders either:
  a minimal `Hito.` auth-first entry screen with visible temporary local username/password login as the primary path and Magic Link as a secondary option
  or the email magic-link entry flow when local credentials are not configured
- `src/routes/api.auth.confirm.tsx`
  exchanges the Supabase auth code into a cookie-backed session
- `src/routes/api.auth.local-login.tsx`
  validates the temporary local account credentials contract and sets the local auth cookie
- `src/routes/api.auth.logout.tsx`
  clears the temporary local auth cookie and signs out Supabase sessions when present
- `src/routes/workout.$date.tsx`
  renders workout detail for preview or persisted data, treats the route search as the source of truth for the active tab, preserves `tab=complete`, and logs results through the canonical backend mutation when saved mode is active
- `src/routes/progress.tsx`
  renders the preserved analytics shell using preview or persisted aggregates from the same data seam
- `src/routes/body.tsx`
  renders a preserved body-note preview shell
- `src/routes/integrations.tsx`
  renders a preserved integration preview shell

## Data Contract

- `src/data/training-plan.json`
  remains the imported template for signed-out preview and first-plan assignment
- `src/lib/training.ts`
  is now the canonical normalized seam for:
  preview snapshot creation
  persisted snapshot shape
  workout lookup
  status derivation
  weekly aggregates
- `src/lib/training-api.ts`
  owns server-backed loading and mutation entry points for home, workout detail, progress, login, JSON-first onboarding, and workout logging
- `src/lib/imported-plan.ts`
  owns the observed JSON onboarding schema and the mapping from imported week data into the canonical saved workout shape
- `src/lib/local-auth.ts`
  owns the temporary local account credential contract, account discovery, and cookie session helpers
- `src/lib/local-auth-store.ts`
  owns the temporary local persisted state used only when the local bypass session is active
- `supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql`
  defines the minimum persisted schema and RLS posture for runner profiles, plan cycles, planned workouts, and workout logs

## State And Lifecycle Rules

- signed-out users now hit a login-first entry surface on `/` and do not create trusted history
- signed-out preview routes can still render on direct route access when real Supabase env values are absent, but they are no longer the primary entry experience
- temporary local-bypass users enter saved mode through visible credentials login or Magic Link and write only to the local bypass state store
- authenticated users without `runner_profile` are routed into setup on `/`
- onboarding now imports one JSON plan shape, creates or updates one `runner_profile`, and creates one active `plan_cycle`
- the imported JSON week creates the saved `planned_workouts` directly instead of shifting the preview template onto today
- workout completion is the canonical mutation and upserts one `workout_log` per planned workout
- saved workout logs can be overwritten from `completed` to `partial` or `skipped`, and skipped truth persists with null actual metrics instead of backfilled planned defaults
- past-due planned workouts without a saved log are treated as `skipped` until the user overwrites them with a real result
- `week_status` is derived on the backend-facing seam from persisted workout state, not from client-only heuristics

## Trusted-Output Contract

- authenticated profile, plan, workout logs, and week status are trusted product output
- temporary local-bypass profile, plan, workout logs, and week status are trusted only for the local account-backed unblock path and remain a removal target
- signed-out preview mode remains untrusted and clearly labeled as preview
- `/progress`, `/body`, and `/integrations` still preserve shell breadth without claiming provider, AI, OCR, weather, or readiness truth

## Persistence And Storage Rules

- Supabase auth remains the intended long-term session source of truth
- a temporary local-only credentials bypass may become the active session source when `LOCAL_AUTH_BYPASS_ENABLED=true`
- `VITE_APP_NAME` falls back to `Hito Running` when unset so preview routes can still boot locally
- preferred public env usage is `NEXT_PUBLIC_APP_NAME`, `NEXT_PUBLIC_SUPABASE_URL`, and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- legacy `VITE_APP_NAME`, `VITE_SUPABASE_URL`, and `VITE_SUPABASE_ANON_KEY` remain supported as compatibility aliases
- `APP_BASE_URL` is an optional server-only override for auth redirects; when it is unset, the magic-link request and callback derive origin from the incoming runtime request
- `SUPABASE_SERVICE_ROLE_KEY` remains server-only and is not required by the currently implemented Vercel runtime path
- temporary local-only auth env now prefers `LOCAL_AUTH_BYPASS_ACCOUNTS_FILE` for an untracked local account list
- legacy single-account fallback env remains supported through `LOCAL_AUTH_BYPASS_IDENTIFIER`, `LOCAL_AUTH_BYPASS_PASSWORD`, optional `LOCAL_AUTH_BYPASS_EMAIL`, optional `LOCAL_AUTH_BYPASS_USER_ID`, and optional `LOCAL_AUTH_BYPASS_STATE_PATH`
- required Vercel env for the live Supabase-backed auth path is `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- temporary local-only auth env must stay unset on Vercel because the bypass store is a local unblock mechanism, not a production deployment contract
- server-side writes and persisted reads flow through one backend seam rather than direct client DB access

## Runtime Invariants

- one app runtime only
- one canonical data seam only
- one canonical deployment path only: Vercel via Nitro
- one temporary local bypass path only while Supabase email auth is intentionally paused
- no framework migration from TanStack Start
- preview shells remain honest about not being wired to future capabilities

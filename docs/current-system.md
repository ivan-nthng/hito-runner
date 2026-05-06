# Current System

## Runtime

- one TanStack Start application lives at the repo root
- the imported baseline structure remains preserved in `src/`, including generated route tree, shell, components, UI primitives, and styles
- build and dev commands come from `package.json`
- the canonical deployment runtime is now Nitro for Vercel:
  `npm run build` emits `.output/` locally
  `vercel build` emits `.vercel/output/` with Vercel functions
- request middleware in `src/start.ts` now resolves either:
  a temporary local single-user session from an httpOnly cookie when the local bypass env contract is enabled
  or a Supabase session through `supabase.auth.getUser()` when auth env exists
  and otherwise falls back to signed-out preview context instead of crashing preview routes

## Implemented Route Contract

- `src/routes/index.tsx`
  renders one of three states behind the same route:
  preview weekly plan
  authenticated onboarding gate
  authenticated persisted weekly plan
- `src/routes/login.tsx`
  renders either:
  a temporary local single-user credentials form when the local bypass env contract is enabled
  or the email magic-link entry flow with loading, sent, callback-error, and retry states
- `src/routes/api.auth.confirm.tsx`
  exchanges the Supabase auth code into a cookie-backed session
- `src/routes/api.auth.local-login.tsx`
  validates the temporary local single-user credentials contract and sets the local auth cookie
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
  owns server-backed loading and mutation entry points for home, workout detail, progress, login, onboarding, and workout logging
- `src/lib/local-auth.ts`
  owns the temporary local single-user credential contract and cookie session helpers
- `src/lib/local-auth-store.ts`
  owns the temporary local persisted state used only when the local bypass session is active
- `supabase/migrations/20260506025058_phase_2_phase_3_backend_foundation.sql`
  defines the minimum persisted schema and RLS posture for runner profiles, plan cycles, planned workouts, and workout logs

## State And Lifecycle Rules

- signed-out users stay in preview mode and do not create trusted history
- signed-out preview routes still render even when real Supabase env values are absent
- temporary local-bypass users enter saved mode without magic-link email flow and write only to the local bypass state store
- authenticated users without `runner_profile` are routed into setup on `/`
- onboarding creates or updates one `runner_profile` and seeds one active `plan_cycle`
- the active plan seeds `planned_workouts` from the imported template shifted onto the current start date
- workout completion is the canonical mutation and upserts one `workout_log` per planned workout
- saved workout logs can be overwritten from `completed` to `partial` or `skipped`, and skipped truth persists with null actual metrics instead of backfilled planned defaults
- past-due planned workouts without a saved log are treated as `skipped` until the user overwrites them with a real result
- `week_status` is derived on the backend-facing seam from persisted workout state, not from client-only heuristics

## Trusted-Output Contract

- authenticated profile, plan, workout logs, and week status are trusted product output
- temporary local-bypass profile, plan, workout logs, and week status are trusted only for the local single-user unblock path and remain a removal target
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
- temporary local-only auth env is `LOCAL_AUTH_BYPASS_ENABLED`, `LOCAL_AUTH_BYPASS_IDENTIFIER`, `LOCAL_AUTH_BYPASS_PASSWORD`, optional `LOCAL_AUTH_BYPASS_EMAIL`, optional `LOCAL_AUTH_BYPASS_USER_ID`, and optional `LOCAL_AUTH_BYPASS_STATE_PATH`
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

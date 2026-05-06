# Changelog

Completed implementation history only.

## 2026-05-06

- Replaced the old Cloudflare-oriented build shape with a Nitro-backed Vercel deployment path so the app now builds into `.output/` locally and `.vercel/output/` under `vercel build`.
- Removed the canonical Worker/Wrangler deploy shape from the repo and documented the Vercel env contract, including that the temporary local auth bypass must stay disabled on Vercel.
- Added a temporary local-only single-user auth bypass behind env-backed credentials and an httpOnly cookie so one local runner can enter saved mode without Magic Link delivery.
- Added a temporary local saved-mode store used only by the bypass path so onboarding, plan assignment, workout logging, and backend-derived week status can still be exercised without widening client-side mock truth.
- Fixed the auth runtime contract so magic-link callbacks and login redirects resolve against the live app origin instead of silently falling back to `localhost:3000`, with `APP_BASE_URL` kept as an optional server-only override.
- Fixed `/login?next=...` shell CTA behavior so `Save with login` preserves the original safe destination instead of nesting `/login` into `next`.
- Polished `/login` into an intentional magic-link surface with clearer send, success, callback-error, and retry states while preserving the imported shell and motion language.
- Upgraded authenticated onboarding into a compact two-step setup flow with clearer submission and completion feedback before returning to the weekly plan.
- Replaced the preview-first unauthenticated root with a login-first `Hito.` entry surface, added a password visibility toggle to the temporary local login form, and kept the existing local single-user auth path intact.
- Replaced the old goal/baseline onboarding wizard with a JSON-first onboarding flow that validates the observed uploaded template shape and creates the saved calendar directly from the imported week.
- Tightened `/`, `/workout/$date`, and `/progress` edge-state messaging with explicit pending, error, empty, setup-required, and no-plan states.
- Improved workout logging feedback so preview-only drafts, persisted saves, overwrite edits, and save failures are clearly distinguished inside the preserved completion panel.
- Fixed the saved-mode workout logging flow so `partial` and `skipped` outcomes persist truthfully, completed results can be overwritten to either state, skipped reloads no longer backfill planned metrics as actuals, and route-level week status follows the saved truth after reload.
- Made preview routes boot without real Supabase env values by falling back to signed-out preview auth context, while keeping live auth and persisted verification dependent on real Supabase configuration.
- Added honest signed-in copy that JSON export is a later capability, not a live feature in the current slice.

## 2026-05-05

- Imported the `adaptive-run-coach` TanStack Start frontend baseline into the repo root as the only app runtime.
- Preserved the route structure, shell, planning layout, workout detail hierarchy, and interaction patterns from the imported baseline.
- Rebranded visible product copy and metadata from `Stride`/`Lovable` to `Hito Running`.
- Reworked `/progress`, `/body`, and `/integrations` into explicit preview shells instead of fake connected capability surfaces.
- Tightened the single mock seam in `src/lib/training.ts` and added `.env.example` for the current phase contract.
- Added Supabase foundation, including env contract hardening, request auth middleware, magic-link login, and auth callback handling.
- Added the persisted backend schema for `runner_profile`, `plan_cycle`, `planned_workout`, and `workout_log` with RLS and lifecycle triggers.
- Replaced deterministic mock plan status with one canonical preview-or-persisted seam and backend-derived week status for saved mode.
- Wired onboarding, persisted plan assignment, workout-log upsert, and progress aggregates into the preserved frontend route structure without route churn.

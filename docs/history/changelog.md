# Changelog

Completed implementation history only.

## 2026-05-07

- Hardened saved-mode home return navigation so shell links reopen `/` through a fresh request, and fixed the grouped `Tomorrow` summary so interval-style workouts no longer render broken `nullkm · 0′` text.
- Refined the saved-mode Calendar page so the main `Today` workout card stays intact, the right-side support content is now one grouped card with dividers, the lower hero metadata strip is removed, and completed days are easier to spot in the calendar grid.

## 2026-05-06

- Repaired the live saved-mode `Upload JSON` continuity seam so already-orphaned workout logs from older broken replacements are recovered onto the active matching plan before same-template preserve or mismatch-block checks run.
- Fixed the saved-mode `Upload JSON` replace contract so logged workout history now carries forward only for exact deterministic workout matches on logged dates; unsafe replacements are rejected before apply instead of silently resetting visible progress.
- Added `npm run test-user -- ...` as the canonical tester-account lifecycle path, including create, reset, optional plan seeding, and delete against the real Supabase auth/data model, and documented the exact contract in `docs/process/test-user-lifecycle.md`.
- Tightened the saved-mode shell and workout detail UI: the sidebar profile trigger now shows runner name plus active plan, owns `Upload JSON` and sign-out, and rest-day detail now stays sparse with a grouped right-side context panel and calmer fueling surface.
- Switched local multi-tester credentials toward one ignored accounts file path so newly created tester accounts can use the visible username/password login without dashboard-only setup.
- Applied the base persisted Supabase migration to the linked `dltfjwexyctmihclcjqj` project, imported `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json` as the active canonical plan for the current local admin path, and verified saved-mode SSR now resolves `/progress` and `/workout/2026-05-08` from Supabase.
- Simplified the local-auth-to-Supabase cutover path to resolve the temporary local account into `auth.users` by email and import directly into the existing canonical tables, removing the extra mapping/snapshot schema dependency from the live cutover flow.
- Added a canonical Supabase plan-import path for the JSON-first onboarding flow, including local-account-to-Supabase-user mapping, raw imported JSON snapshots, and a narrow current-plan import script for `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json`.
- Switched the temporary local bypass to prefer Supabase-backed plan reads and workout-log writes whenever a server-side Supabase key is configured, while keeping the local state file only as a fallback when that key is absent.
- Replaced the old Cloudflare-oriented build shape with a Nitro-backed Vercel deployment path so the app now builds into `.output/` locally and `.vercel/output/` under `vercel build`.
- Removed the canonical Worker/Wrangler deploy shape from the repo and documented the Vercel env contract, including that the temporary local auth bypass must stay disabled on Vercel.
- Fixed a local auth regression where `npm run start` did not load `.env.local`, causing the built server path to miss the temporary admin credentials even though `vite dev` still worked.
- Added a temporary local-only single-user auth bypass behind env-backed credentials and an httpOnly cookie so one local runner can enter saved mode without Magic Link delivery.
- Refined the temporary local auth path into a small local account model, made username/password login the clearly visible primary path, moved the real admin credential source into an untracked local accounts file, and kept Magic Link available as a secondary option.
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
- Replaced the remaining frozen home/calendar date assumption with the real runtime local date, removed stale preview-date caching, and added an explicit home state for days outside the current plan window.
- Made preview routes boot without real Supabase env values by falling back to signed-out preview auth context, while keeping live auth and persisted verification dependent on real Supabase configuration.
- Added honest signed-in copy that JSON export is a later capability, not a live feature in the current slice.
- Fixed the Supabase-backed saved workout overwrite path so a reloaded saved result becomes dirty again on outcome, notes, and actual-metric edits, and overwrite now targets the existing `workout_logs` row through `planned_workout_id` instead of leaving the CTA stuck in a false saved state.

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

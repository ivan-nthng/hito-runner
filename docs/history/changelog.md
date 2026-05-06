# Changelog

Completed implementation history only.

## 2026-05-06

- Polished `/login` into an intentional magic-link surface with clearer send, success, callback-error, and retry states while preserving the imported shell and motion language.
- Upgraded authenticated onboarding into a compact two-step setup flow with clearer submission and completion feedback before returning to the weekly plan.
- Tightened `/`, `/workout/$date`, and `/progress` edge-state messaging with explicit pending, error, empty, setup-required, and no-plan states.
- Improved workout logging feedback so preview-only drafts, persisted saves, overwrite edits, and save failures are clearly distinguished inside the preserved completion panel.
- Made preview routes boot without real Supabase env values by falling back to signed-out preview auth context, while keeping live auth and persisted verification dependent on real Supabase configuration.

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

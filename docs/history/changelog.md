# Changelog

Completed implementation history only.

## 2026-05-09

- Completed the final Phase 5 legacy-removal slice by deleting deprecated `week_1_preview[]` compatibility from the active runtime, CLI tooling, and visible advanced-import contract, so `training-plan-v2` is now the only supported import format.
- Continued the final Phase 5 deletion window by removing deprecated single-account local auth env support from the active runtime and local tooling, cleaning `.env.example`, and making the accounts-file path the only remaining local bypass input contract.
- Continued the final Phase 5 deletion window by removing `SUPABASE_SERVICE_ROLE_KEY` from the active runtime and CLI env contract, cleaning `.env.example`, and making `SUPABASE_SECRET_KEY` the only documented server-side Supabase admin/write key.
- Started the final Phase 5 deletion window by removing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` from the active runtime and CLI env contract, cleaning `.env.example`, and making `NEXT_PUBLIC_SUPABASE_URL` plus `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` the only documented public Supabase browser env names.
- Continued Phase 5 by quarantining the remaining legacy compatibility: the deprecated `week_1_preview[]` parser and seed mapping now live in dedicated compatibility helpers instead of staying mixed into the canonical `training-plan-v2` import path, and the tester lifecycle tool no longer merges deprecated single-account admin env into the normal accounts-file path when that file already exists.

## 2026-05-08

- Started Phase 5 carefully instead of deleting compatibility outright: `training-plan-v2` is now the explicit canonical file contract in the advanced import surface, legacy `week_1_preview[]` now surfaces as deprecated compatibility, `VITE_APP_NAME` is no longer part of the active runtime env contract, and the tester lifecycle script no longer materializes deprecated single-account local auth env into the canonical accounts file automatically.
- Demoted remaining visible non-primary authoring paths for the Phase 4 cleanup slice: no-plan setup and shell copy now present text-first plan creation as the primary product path, while JSON stays available only as an advanced import/fallback for existing Hito plan files, migration, and testing.
- Removed the production-facing local credentials path from deploy-visible auth: loopback local runtimes may still use the temporary bypass for development, but deploy-like requests now expose only the real email auth surface and `/api/auth/local-login` no longer behaves like a product login path there.
- Fixed the first richer-plan truth leaks after Phase 3: the live `training-plan-v2` validator and normalizer now accept the fuller segment DSL used by the richer reference files, route-facing target rendering suppresses opaque structured metadata instead of leaking `[object Object]`, and richer imported `intervals` workouts keep an honest visible interval identity instead of collapsing to easy-run labeling.
- Tightened canonical persisted richer-plan truth without adding a second runtime model: `plan_cycles` now preserves `schema_version`, `source_kind`, `target_date`, `goal_metadata`, and `plan_preferences`, while `planned_workouts` now preserves source workout identity, source workout type, planned RPE, estimated fatigue, and recovery priority across JSON import, structured authoring, and OpenAI text authoring.
- Removed fresh-write target alias duplication from richer plan normalization so new persisted `steps jsonb` rows keep only canonical target keys such as `hr_bpm_range` and `pace_min_per_km_range`, while older rows remain read-compatible.
- Removed preview-derived active-plan bootstrap from the authenticated saved-mode seam so accounts without an active plan now stay honestly in setup until text authoring, structured authoring, or advanced JSON import creates canonical persisted plan truth.

## 2026-05-07

- Removed `src/lib/local-auth-store.ts` from the authenticated saved-mode path so local auth now acts only as a temporary identity bridge, while all authenticated saved-mode reads, plan writes, and workout-log writes resolve through the canonical Supabase seam.
- Removed the now-dead `temporary_local` saved-mode backend branch and the obsolete local fallback state-file contract from the active runtime and tester lifecycle tooling.

- Simplified the text-first onboarding and `Upload JSON` surfaces by removing nested card chrome, flattening the advanced import layout, swapping the no-plan header CTA to `Create a Plan`, and removing the visible backend label from the home shell status area.
- Replaced the visible JSON-first onboarding entry on `/` with a compact text-first request surface wired into the live OpenAI-backed `completeTextOnboarding` seam, while keeping `Upload JSON` available as a secondary advanced fallback path.
- Added the first OpenAI-backed text-to-plan backend slice: the service now accepts one bounded free-text request, asks OpenAI for structured authoring input, validates that model output deterministically, generates canonical `training-plan-v2` plan data server-side, and persists it through the same Supabase `plan_cycles` plus `planned_workouts` seam as JSON import and structured authoring.
- Added the first structured plan-authoring backend slice: the service now accepts one bounded structured input contract, generates canonical `training-plan-v2` plan data server-side, persists it through the same Supabase `plan_cycles` plus `planned_workouts` seam as JSON import, and exposes a narrow `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>` ops path for validation before the frontend wizard exists.
- Fixed the remaining first-pass `training-plan-v2` rendering-truth gaps by keeping distance-first interval reps distance-first in workout structure UI, resolving tempo-backed quality workouts to a visible `Tempo` identity on home and workout detail, and rounding visible distance totals through one shared formatter instead of leaking floating precision.
- Tightened the live `training-plan-v2` import seam toward the approved template contract by preserving canonical segment metadata and prescription structure inside `planned_workouts.steps jsonb`, keeping bounded target keys, and normalizing both interval-by-distance and interval-by-time into the same repeat-unit DSL without adding a second storage path.
- Added the first viable `training-plan-v2` integration slice so both the legacy `week_1_preview[]` import and the richer `training-plan-v2` import now validate and normalize into the same canonical `plan_cycles` plus `planned_workouts` seam, with richer segment structure persisted in `planned_workouts.steps jsonb` and current saved-mode home plus workout-detail rendering reading the v2-backed rows through the unchanged snapshot seam.
- Finished the remaining upload-flow/template UI slice by adding a real `Download template` affordance in `Upload JSON`, shipping a static future `training-plan-v2` template artifact, and clarifying that current applied imports still use the legacy `week_1_preview[]` shape.
- Implemented the first workout-page refinement pass: preserved the three-block workout-detail layout, added richer surface treatment, surfaced check/dash/cross saved-result markers, changed `Week Status` into a progress-driven completed-workouts bar, and added an honest placeholder-only `Upload result` seam in the log-result notes area.
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

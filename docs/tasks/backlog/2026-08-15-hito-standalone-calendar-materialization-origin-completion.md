# Hito Standalone Calendar Materialization Origin Completion

## Work Item ID

2026-08-15-hito-standalone-calendar-materialization-origin-completion

## Status

completed

## Type

Tracked — Backend serial migration completion

## Priority

high

## Owner

BACKEND

## Epic

runner-core-readiness

## Stage

Backend Slice 2 complete — source materialization and canonical fixture migration

## Next Recommended Role

PRODUCT

## Parent

[Runner Core Roadmap](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Standalone Calendar Write Foundation](./2026-08-15-hito-runner-core-standalone-calendar-write-foundation.md)

## Evidence From

[Calendar Workout Standalone Entity And Plan Source Decoupling Discovery](./2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md)

## Scope

Only the existing reviewed source-materialization functions, their canonical local fixture, generated types if required, and directly related Backend proofs. No Product UI, Design System, Admin, source-plan authoring policy, exports, hosted state, provider, or Git lifecycle work.

## Archive Intent

Retain through standalone Calendar runtime admission and focused cross-origin proof; then compact to the completed materialization contract and Frontend integration boundary.

## Task

Complete the serial standalone Calendar migration by making all reviewed AI and future-schedule source materialization supply truthful immutable `origin_kind` while preserving source artifacts only as provenance. The Slice 1 database constraint intentionally has no compatibility default; this task must make the existing materializers and fixture conform rather than weakening that invariant.

## Confirmed Evidence

Slice 1 proved that direct manual Calendar Add creates zero dummy plan rows, and that existing Calendar mutations now use runner/workout authority. Its source is intentionally not runtime-ready because `apply_reviewed_plan_persistence` and `apply_reviewed_future_schedule_persistence` do not yet provide the required `origin_kind`. The affected source plans themselves remain valid initial-placement artifacts and must continue to materialize workout rows with preserved immutable provenance.

## Required Outcome

- Every reviewed AI and future-schedule materialization produces runner-owned workouts with exact immutable provenance and `origin_kind`.
- The canonical local fixture converges under the new constraint without ad hoc database shaping.
- Existing manual direct Add remains source-container-free.
- No mutation, review, visibility, evidence, or permission authority returns to a mutable plan container.
- The repository reaches local runtime/build admission only if all required materializers and generated contracts genuinely conform; no fallback/default bypass is permitted.

## What Not To Touch

The completed Slice 1 migration, active Calendar/Product UI, Design System, Admin, source-plan generation quality, export/read-model redesign, hosted Supabase, providers, dependencies, Git lifecycle, and unrelated dirty hunks. Stop and return to PRODUCT if a new Product contract, cross-owner implementation, or a data migration beyond the stated materialization paths becomes necessary.

## Validation Expectations

Run clean and incremental local migration/materialization replay; AI/file/manual provenance matrix; fixture reset/seed/reseed convergence; source identity/content checksum preservation; zero dummy plan rows for manual Add; RLS/ACL and evidence/Rest protection; generated type parity; focused Backend validators; Prettier, ESLint, and diff hygiene. ARCHITECT may independently review no-container retention and QA may review the final proof inventory, both read-only. Browser, hosted, Global QA, release, and deployment are out of scope.

## Backend Execution Preflight — 2026-08-15

- **Mode / owner:** Tracked / BACKEND. Slice 1 is `completed`; the Git index is empty. Local
  Supabase is healthy at migration `20260816004652` with zero `plan_cycles`, `planned_workouts`, and
  `calendar_workout_mutation_events` rows. The managed `qa_fixture` process is healthy but its build
  artifact is stale/broken; this task will not use or mutate it.
- **Demonstrated discriminator:** the live `apply_reviewed_plan_persistence` and
  `apply_reviewed_future_schedule_persistence` functions still accept `p_plan`, create a second
  `plan_cycles` row, and insert workouts without `origin_kind`. The live workout column is `NOT NULL`
  with no default, so both materializers are incompatible with the completed Slice 1 invariant.
- **Existing seams reused:** immutable saved-plan payload/checksum records, the two named reviewed
  persistence functions, their existing server wrappers and workout-row builder, candidate retention,
  and the canonical design-profile reset/seed/status/reseed lifecycle.
- **Reuse-first budget:** one appended function-only migration is required because historical
  migrations and the completed Slice 1 migration are immutable. New table, RPC name, store,
  scheduler, helper/validator/fixture framework, compatibility default, dependency, provider path,
  and production runtime artifact: **none**.
- **Responsibility removed/simplified:** both effective materializers will stop inserting duplicate
  mutable/materialized plan rows. They will accept one existing same-runner immutable source record,
  derive and strictly validate `manual | ai | file_import`, preserve that record by identity and
  checksum, and insert only runner-owned Calendar rows referencing it as provenance.
- **Focused proof:** clean and incremental migration/materialization; AI, file-import, and direct
  manual provenance; canonical fixture reset -> seed -> status -> reseed convergence; source and
  workout identity/content checksums; zero dummy plan rows for direct manual Add; RLS/ACL and
  evidence/Rest protections; generated type parity; focused validators; Prettier, ESLint, and diff
  hygiene.
- **Stop boundary:** return to PRODUCT before any Product UI, read-model, export, Admin, source-plan
  quality, hosted, provider, dependency, Git lifecycle, new persistence shape, compatibility path, or
  unresolved product decision.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Standalone Calendar Materialization Origin Completion
Stage: Backend Slice 2 — source materialization and canonical fixture migration
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-standalone-calendar-materialization-origin-completion.md
Depends On: docs/tasks/backlog/2026-08-15-hito-runner-core-standalone-calendar-write-foundation.md
Epic: runner-core-readiness

Ivan explicitly authorized immediate execution. Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this complete item, the completed Slice 1 receipt, and the standalone Calendar architecture discovery before the first write. Re-check the dirty/local-Supabase/runtime boundary and preserve unrelated bytes.

Complete the serial standalone Calendar migration. Update only the existing `apply_reviewed_plan_persistence` and `apply_reviewed_future_schedule_persistence` materialization seams, their canonical local fixture, generated types if required, and directly necessary Backend proofs. Every reviewed source materialization must supply truthful immutable `origin_kind` and preserve source provenance while producing runner-owned Calendar workouts.

Do not introduce a compatibility default, weaken Slice 1 constraints, recreate mutable plan authority, add a second workout table, or alter source-plan creation semantics. Manual, AI-authored, and imported workouts remain one Calendar entity after confirmation; source plans remain valid initial-placement artifacts only. Preserve direct manual Calendar Add with zero dummy plan rows, stored-Rest Move/Undo, evidence protection, RLS/ACL, and fixture cleanup.

Do not modify Product UI, Design System, Admin, source-plan quality policy, exports/read models, hosted state, providers, dependencies, or Git lifecycle. Stop and return to PRODUCT if the required change reaches a cross-owner implementation or needs a new product decision.

Use existing named ARCHITECT only for a bounded read-only no-container invariant review and existing named QA only for a bounded read-only final proof-inventory review if each materially reduces risk. Do not delegate Backend code, mutate shared runtime through a reviewer, or use a compatibility path to pass validation.

Prove clean and incremental local migration/materialization; AI/file/manual provenance; fixture reset/seed/reseed convergence; content/identity checksums; zero dummy plan rows; RLS/ACL; evidence/Rest protections; type parity; focused validators; Prettier, ESLint, and diff hygiene. Return the exact Frontend integration boundary. Update only this canonical item with a compact English tracked receipt. Do not claim browser, hosted, Global QA, release, or deployment acceptance.
```

## Backend Implementation Receipt — 2026-08-15

### Task, Stage, And Outcome

- **Task / mode:** Hito Standalone Calendar Materialization Origin Completion / Tracked.
- **Stage:** Backend Slice 2 — source materialization and canonical fixture migration.
- **Implementation DoD:** passed for this bounded Slice 2. The two effective reviewed
  materializers now consume one existing same-runner immutable source record and insert only
  runner-owned Calendar workouts with strict `manual | ai | file_import` origin. They create no
  second plan row and do not mutate the source record.
- **Lifecycle:** this bounded item is `completed`. Whole Backend-suite/runtime admission remains
  pending on the explicitly excluded Calendar export and remaining runner-activity fixture/read-model
  migration described below. Global QA remains pending.

### Demonstrated Root Cause And Correction

- Before the correction, the canonical design-profile seed and the mutation-enabled running-plan
  confirm proof both reached `null value in column "origin_kind" of relation "planned_workouts"`.
  The live reviewed materializers still accepted a client-shaped `p_plan`, inserted a duplicate
  `plan_cycles` row, and omitted the required standalone Calendar origin.
- The function-only migration replaces those signatures with `p_source_plan_id`. Each function
  locks and validates one archived same-runner source with an immutable saved payload/checksum,
  derives the Calendar origin from the canonical source class, validates row/source identity, and
  inserts only `planned_workouts`.
- AI and manual sources require exact payload/source-kind agreement. Imported sources retain their
  original external `source_kind`/`source_status` in the immutable payload and normalized import
  provenance while the persisted source class remains `training_plan_v2_import`.
- Future replacement remains explicit and atomically refuses logs, FIT assets, actual metrics,
  comparisons, AI insights, and activity matches. The completed Slice 1 standalone Add/Edit/Copy/
  Clear/Move/Undo authority remains runner/workout-owned.

### Files Changed

- `supabase/migrations/20260816020328_standalone_calendar_materialization_origin_completion.sql`
  — replaces only the two existing materializer functions and their grants; no table, second RPC,
  default, compatibility mode, or data rewrite was added.
- `src/lib/active-plan-lifecycle-persistence.ts`, `src/lib/active-plan-persistence.ts`,
  `src/lib/manual-workout-authoring/persistence.ts`, and `src/lib/supabase/database.ts` — pass the
  immutable source ID, require explicit origin in Calendar rows, remove the unused dummy empty-plan
  writer/build path, and align the generated RPC argument contract.
- `scripts/lib/runner-design-profile-fixture.ts`, `scripts/test-user.mjs`,
  `scripts/running-plan-engine-confirm/persistence-proof.ts`, and
  `scripts/validate-calendar-overflow-future-actions.ts` — retain before materialization, verify the
  same immutable source on readback, enforce zero duplicate/active authority, and migrate directly
  necessary materialization proof setup.
- This canonical item — preflight, lifecycle, validation inventory, boundaries, and receipt.

All other concurrent dirty and untracked work was preserved. The Git index remained empty. No stage,
commit, push, deployment, hosted mutation, provider call, dependency change, or managed-runtime
action occurred.

### Validation Inventory

| Check                              | Scenario / environment                                                                   | Result                            | Evidence                                                                                                                                                                                                                                                                                                                                      |
| ---------------------------------- | ---------------------------------------------------------------------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red discriminator                  | Pre-fix design-profile seed and running-plan confirm persistence                         | Passed                            | Both independently failed at the missing required `planned_workouts.origin_kind`; no direct SQL or compatibility default manufactured fixture state.                                                                                                                                                                                          |
| Clean migration replay             | Local loopback Supabase, complete migration chain through `20260816020328`               | Passed                            | `npx supabase db reset --local --no-seed` applied the full current migration set without error.                                                                                                                                                                                                                                               |
| Incremental migration replay       | Local loopback reset to Slice 1 `20260816004652`, then normal migration-up               | Passed                            | `npx supabase db reset --local --no-seed --version 20260816004652` followed by `npx supabase migration up --local` applied exactly the Slice 2 function migration.                                                                                                                                                                            |
| Effective function/ACL contract    | Local PostgreSQL catalog and anonymous client                                            | Passed                            | Only source-ID signatures exist; both are security-invoker and executable only by `postgres`/`service_role`; anonymous calls failed with `42501`.                                                                                                                                                                                             |
| AI reviewed materialization        | Mutation-enabled running-plan confirm proof                                              | Passed                            | Source library, nine persistence scenarios, leading-day omission, immutable source equality, stale/historical/malformed rejection, explicit future replacement, protected future refusal, zero provider calls, and cleanup passed. The QA fixture persisted 55 AI Calendar rows against one source.                                           |
| File-import materialization        | Canonical `test-user create` with `public/templates/hito-training-plan-v2-template.json` | Passed                            | One archived `training_plan_v2_import` source retained original `ml_generated_template_v2` provenance; four exact 2026-05-05..10 rows read back with `origin_kind=file_import`, all linked to that source; full reset returned all owned counts to zero.                                                                                      |
| Manual standalone contract         | Mutation-enabled manual-workout validator                                                | Passed                            | Direct manual Add created no dummy plan row; same-row edit, prescription-only copy, clear, empty-target move, stored-Rest Move -> Undo -> two reloads, evidence race rejection, RLS isolation, and cleanup passed.                                                                                                                            |
| Canonical design-profile lifecycle | Reset -> seed -> status -> reseed -> status -> reset                                     | Passed                            | Both reads returned zero duplicate materialized plans, one saved AI source, zero active authority, 55 workouts, 30 activities, exact 11 matched / 19 unplanned, 11 FIT-completed / zero future FIT-completed, and unchanged source/content hashes. Final reset removed all owned rows and storage objects while preserving the Auth user.     |
| Source/content identity            | Before and after design-profile reseed                                                   | Passed                            | Review checksum `152c3d08...baacd`, source payload SHA-256 `9cb1e13e...9023a`, and normalized Calendar content SHA-256 `9e13e78a...c894` were identical; all 55 rows linked the current immutable source and had AI origin. Random row/source IDs were intentionally regenerated after full reset.                                            |
| Generated type parity              | Fresh formatted local Supabase type generation                                           | Passed                            | `supabase gen types typescript --local` piped through the repository formatter matched `src/lib/supabase/database.ts` exactly.                                                                                                                                                                                                                |
| Schema lint                        | Local Supabase                                                                           | Passed                            | `npx supabase db lint --local --level warning` returned no schema warnings.                                                                                                                                                                                                                                                                   |
| Focused static hygiene             | Task-owned TypeScript/JavaScript/Markdown plus whole diff whitespace                     | Passed                            | Targeted Prettier and ESLint passed; `git diff --check` passed. Reverse search found no task-owned `p_plan`, plan insertion, active-status authority, or removed dummy-plan writer.                                                                                                                                                           |
| Full local Backend DB suite        | `npm run validate:backend:local-db`                                                      | Failed outside this bounded slice | Checks 1-14 passed. Check 15 reached successful standalone materialization, then `calendar-overflow-actions` failed because `exportFutureCalendarWorkoutsForUser` still requires legacy null-payload container provenance. Later checks did not run in that invocation.                                                                       |
| Remaining local DB checks          | Individually replayed after the suite stop                                               | Mixed / later boundary            | Running-plan confirm and manual persistence passed; UI-locale persistence passed. Runner-activity foundation, Gate 4, read-model scale, and runner-calendar-context persistence fixtures failed because they still directly insert container-shaped workouts without required origin; their plan-gated read model is excluded from this item. |
| Final cleanup                      | Local loopback Supabase after all disposable checks                                      | Passed                            | Profiles, sources, workouts, mutation events, logs, assets, metrics, comparisons, insights, activity matches, and activities all counted zero.                                                                                                                                                                                                |
| Independent ARCHITECT review       | Read-only no-container/source review                                                     | Passed                            | Confirmed strict source/origin/provenance checks, no plan-row write, complete future evidence guards, and no materialization-slice blocker. Classified export and runner-activity reds as later Backend read-model/fixture owners.                                                                                                            |
| Independent QA review              | Read-only proof-inventory review                                                         | Passed for Slice 2                | Found no missing mandatory in-scope check or concrete materialization defect; independently classified both broader reds as truthful later boundaries. QA made no source, data, or runtime writes.                                                                                                                                            |

### Preserved Boundaries And Omitted Checks

- The production build and managed runtime were not run after the broader Backend suite stopped at
  an excluded legacy export owner. Consequence: build/runtime admission is not claimed even though
  the focused materializers, migration, fixtures, and generated contracts pass.
- `src/lib/calendar-overflow-actions.ts` still obtains future Calendar export provenance through a
  null-payload materialized-plan query. `src/lib/training-api.ts` and the remaining runner-activity
  proof fixtures still use a global/container-shaped provenance owner. They were not weakened,
  bypassed, or partially migrated here. Consequence: the complete 22-check local Backend DB suite is
  not green.
- Browser, Product UI, Frontend consumer behavior, hosted Supabase, providers, production data,
  release, deployment, and Global QA were not exercised and are not accepted by this receipt.

### Next Owner And Exact Frontend Integration Boundary

PRODUCT should route a separate bounded BACKEND slice for the origin-neutral Calendar export,
runner-owned snapshot/read-model, and remaining runner-activity fixture migration. That owner must
remove null-payload/current-plan selection rather than recreate a container, then restore the full
local Backend suite.

Only after that Backend contract is green should FRONTEND Product consume: runner-owned Calendar
workouts as the primary collection; `originKind` plus optional per-workout immutable `sourcePlanId`
as provenance only; and no global `planMeta`, active/current plan, or plan-gated mutation capability.
No Frontend handoff or Global QA claim is made by this Slice 2 receipt.

# Hito Runner Core Standalone Calendar Write Foundation

Work Item ID: `2026-08-15-hito-runner-core-standalone-calendar-write-foundation`
Status: completed
Type: Tracked
Priority: high
Owner: BACKEND
Epic: runner-core-readiness
Stage: Backend Slice 1 implementation complete; serial Slice 2 required before runtime admission
Next Recommended Role: BACKEND
Scope: Backend Slice 1 only: move Calendar workout write authority, review protection, and Undo
evidence from mutable plan containers to runner-owned Calendar rows. No Product UI, source
materialisation/read model/export, Admin measure, Design System, hosted, or release work.
Archive Intent: Retain through the serial Backend migration and local persistence proof; compact to
the accepted contract, migration result, and next-owner boundary on terminal closeout.
Parent: [Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Calendar Workout Standalone Entity And Plan Source Decoupling Discovery](./2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md)

## Task

Implement the accepted first standalone-Calendar write slice. Add, Edit, Move, Copy, Clear, content
edit, and Undo must operate atomically on runner-owned Calendar workouts without plan ID, plan
version, or mutable plan metadata as a permission or write authority. Preserve the completed
stored-Rest Move/Undo recovery exactly.

## Required Contract

- Before any migration, inventory local rows for runner/date collisions, cross-user source links,
  source kinds, payload/checksum gaps, active-plan-shaped review codes, stored-Rest before-images,
  logs/FIT/evidence, and direct authenticated write callers. Stop on unexplained data.
- Add one appended, fail-closed migration only. It may add the justified append-only
  `calendar_workout_mutation_events` relation, make the source reference optional/same-user/
  non-cascading, record immutable `origin_kind`, and enforce runner/date occupancy.
- Replace effective Calendar mutation/content-edit RPC arguments with runner, row, occupancy,
  evidence, and review discriminators. Migrate the existing manual-authoring policy and transport;
  do not maintain an active-plan compatibility writer.
- Regenerate database types and migrate focused proofs. Direct manual Calendar Add must prove zero
  dummy plan rows.

## Required Proof

Run clean-local migration apply/replay; count and checksum equality; RLS/ACL negatives; manual,
AI-provenance, imported-provenance, mixed-origin, logged/evidence-backed, Rest, concurrent-review,
and Move -> stored Rest -> Undo -> reload persistence cases. This slice is Backend proof only: no
browser, hosted, release, or deployment claim.

## Boundaries

- Reuse `planned_workouts` and the existing `WorkoutDocument`; do not create a second workout table,
  an active replacement container, a client cache, or a compatibility write path.
- Preserve immutable source creation/materialisation reads, Product UI consumers, exports, Admin
  measures, and current product documents for their named later slices.
- Do not rewrite the completed stored-Rest migration or hide an integration type break outside this
  slice. Return the exact owner boundary to PRODUCT.

## Next Action

PRODUCT may dispatch BACKEND only after the current independent workout-flow QA replay has started
or reached a terminal result, so shared local fixture/runtime ownership remains serialized.

## Backend Execution Preflight — 2026-08-15

- **Mode / owner:** Tracked / BACKEND. The independent Workout Core QA record is terminal and the
  completed Frontend Calendar recovery is fixed read-only input. The Git index is empty. No other
  repository, local-database, fixture, or managed-runtime writer is active.
- **Accepted outcome:** move effective Add, Edit, Move, Copy, Clear, content-edit, and Undo authority
  to runner identity, Calendar row/date occupancy, exact row snapshots, evidence, and review truth.
  A source record remains optional immutable provenance only.
- **Demonstrated cause:** the current physical workout row is already runner-owned, but its non-null
  cascading `plan_cycle_id`, plan/date uniqueness, plan-version review tokens, plan-scoped RPC
  predicates, and mutable plan metadata events still make a source container effective write
  authority. Direct manual setup creates an empty plan solely to satisfy that coupling.
- **Fail-closed local census:** 108 workout rows; 0 runner/date collision groups; 0 cross-user or
  orphan source links. All 3 materialized source rows link by valid ID, same runner, and exact review
  checksum to 3 immutable saved-source rows; all 108 workouts are attributable through those exact
  links. Six canonical mutation events share one validated shape and stable hash; the scalar event
  is the exact mirror of the array tail. Five protected log/FIT/evidence relation rows are present.
  Missing or reconstructed source truth is not required for this local migration.
- **Stable pre-migration evidence:** workout content hash
  `97356eb22c57188ca6cd14d52c8fb652`; workout identity/date hash
  `5b4af832dd62b0253ad2b22c1442b043`; immutable saved-source hash
  `74df49fcb99d6d7b50adbc998b6c4d8d`; canonical mutation-event hash
  `40df0d47637e6672630642076d3e13d3`.
- **Existing seams reused:** `planned_workouts`, `WorkoutDocument`, the runner advisory lock, exact
  workout/occupancy fingerprints, existing reviewed manual actions, the two effective Calendar RPC
  owners, generated database types, and current manual-authoring persistence proofs.
- **Reuse-first budget:** one appended migration and its single justified
  `calendar_workout_mutation_events` relation. The relation is required because deleted/displaced
  workout before-images and review evidence cannot live on an immutable source record or a deleted
  workout row. New workout table, active/replacement container, compatibility writer, client cache,
  runtime/helper/fixture/validator framework, dependency, and parallel truth: **none**.
- **Responsibility removed/simplified:** direct manual Add no longer creates an empty plan; Calendar
  writes no longer lock, version, update, or predicate on a plan; accepted stored-Rest recovery moves
  from mutable plan metadata to the append-only Calendar mutation event owner. Source materialization,
  read models, exports, Admin facts, and Frontend consumers remain explicit later-slice boundaries.
- **Managed runtime boundary:** the existing managed loopback process is healthy and compatible but
  its artifact is stale/broken because the private snapshot marker moved. This Backend slice will not
  build, restart, stop, or use that runtime for acceptance.
- **Focused proof:** clean local migration replay; pre/post count and checksum equality; generated
  type parity; ACL/RLS negatives; direct manual/null-source, AI, imported, mixed-origin, Rest,
  logged/FIT/evidence, stale/concurrent review, copy/move/clear/content-edit, and stored-Rest Undo
  persistence; zero dummy plan rows for direct manual Add; focused static and diff hygiene.
- **Stop boundary:** return to PRODUCT before any Product UI/read-model/materialization/export change,
  second persistence shape, compatibility mode, hosted action, provider, dependency, release, or
  unresolved data classification.

## Backend Tracked Implementation Receipt — 2026-08-15

### Outcome

Backend Slice 1 Implementation DoD is **passed**. Effective Calendar Add, Edit, Move, Copy, Clear,
content-edit, and Undo writes now authorize from the authenticated runner, authoritative workout
row, runner/date occupancy, exact review fingerprints, evidence relations, and append-only mutation
events. They no longer require, lock, version, update, or predicate on a mutable plan record. Direct
manual Add creates a standalone workout and zero dummy plan rows. Immutable AI/file-import source
records remain optional provenance only.

This slice is intentionally **not independently runtime-admissible**. The serial Slice 2 source
materialization owners `apply_reviewed_plan_persistence` and
`apply_reviewed_future_schedule_persistence` do not yet provide the required `origin_kind` for their
workout inserts. Adding a default, nullable escape, trigger, or compatibility writer here would
weaken the accepted invariant. Slice 2 must update those existing materialization seams and the
canonical fixture before any production build or managed-runtime acceptance.

### Root Cause And Change

The physical workout row was runner-owned, but the non-null cascading source reference,
plan/date uniqueness, plan-version review tokens, plan-scoped RPC predicates, and mutable plan
metadata event history still made a plan container effective Calendar write authority. The appended
migration makes source provenance nullable, same-runner, and non-cascading; adds required immutable
`origin_kind`; establishes runner/date occupancy; migrates validated legacy event truth into the one
append-only `calendar_workout_mutation_events` relation; removes direct authenticated writes; and
replaces the two effective mutation RPC signatures with runner/workout/occupancy/evidence/review
discriminators.

The existing `planned_workouts`, `WorkoutDocument`, reviewed action seams, runner advisory lock,
generated types, and manual-authoring proof owners were reused. No second workout table, active
replacement container, compatibility writer, client cache, helper framework, fixture framework,
dependency, or provider path was added.

### Files Changed

- Migration and generated contract:
  `supabase/migrations/20260816004652_standalone_calendar_write_foundation.sql`,
  `src/lib/supabase/database.ts`.
- Effective Calendar persistence/policy:
  `src/lib/active-plan-lifecycle-persistence.ts`,
  `src/lib/active-plan-workout-editing/policy.ts`,
  `src/lib/active-plan-workout-editing/source-capabilities.ts`,
  `src/lib/manual-workout-authoring/actions.ts`,
  `src/lib/manual-workout-authoring/active-plan-add.ts`,
  `src/lib/manual-workout-authoring/copy-paste-reconstruction.ts`,
  `src/lib/manual-workout-authoring/copy-paste.ts`,
  `src/lib/manual-workout-authoring/delete-clear.ts`,
  `src/lib/manual-workout-authoring/edit-workout-review-token.ts`,
  `src/lib/manual-workout-authoring/edit-workout.ts`,
  `src/lib/manual-workout-authoring/move-workout.ts`,
  `src/lib/manual-workout-authoring/schema.ts`, and
  `src/lib/persisted-plan-replacement.ts`.
- Focused lifecycle/proof owners:
  `scripts/lib/qa-test-user-lifecycle.mjs`,
  `scripts/validate-manual-workout-authoring.ts`, and the existing files under
  `scripts/manual-workout-authoring/` for add, copy/paste, clear, edit, move, persistence, empty-plan,
  and source-capability coverage.
- Lifecycle record: this canonical item.

All other concurrent dirty and untracked paths were preserved. The Git index remained empty; no
stage, commit, push, deployment, hosted mutation, provider call, or managed-runtime action occurred.

### Validation Inventory

| Check                        | Scenario / environment                                                  | Result                      | Evidence                                                                                                                                                                                                                               |
| ---------------------------- | ----------------------------------------------------------------------- | --------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pre-migration census         | Existing local loopback data                                            | Passed                      | 108 workouts; zero runner/date collisions; zero cross-user/orphan source links; three exact immutable source links; six validated legacy events; five protected evidence relations. Stable hashes were recorded in the preflight.      |
| Clean migration replay       | Local Supabase reset through `20260816004652`                           | Passed                      | `npx supabase db reset --local --no-seed` applied the complete migration chain without error.                                                                                                                                          |
| Incremental upgrade          | Prior schema `20260815212107` with canonical AI/imported source records | Passed                      | Six workout identities, dates, and content remained byte-equivalent by hashes; three AI and three file-import origins linked to same-runner immutable saved sources; zero active records/collisions; legacy mutation metadata removed. |
| Direct manual Add            | Authenticated local persistence                                         | Passed                      | Created one standalone manual workout, zero plan rows, and durable same-runner readback.                                                                                                                                               |
| Edit / Copy / Clear / Move   | Authenticated local persistence                                         | Passed                      | Same-row full-document edit, prescription-only copy, runner-owned clear, and empty-target move passed without plan mutation authority.                                                                                                 |
| Stored-Rest Undo             | Authenticated local persistence                                         | Passed                      | Move onto stored Rest, atomic Undo, and two reloads restored both original rows without identity/date/order/provenance drift or duplicates.                                                                                            |
| Protection race              | Local service action plus relation insertion                            | Passed                      | A reviewed row became evidence-backed before confirm; both server and database layers rejected mutation with no partial write.                                                                                                         |
| Auth / RLS / ACL             | Owner and second authenticated runner                                   | Passed                      | Owner read succeeded; cross-user rows remained hidden; direct authenticated workout/event writes and effective RPC execution were denied. RPC execution is service-role-only and functions are security-invoker.                       |
| Cleanup convergence          | Disposable local lifecycle                                              | Passed                      | Plans, workouts, events, logs, result assets, actual metrics, comparisons, insights, and activity matches all returned to zero.                                                                                                        |
| Generated type parity        | Fresh local Supabase generation                                         | Passed                      | Formatted generated output matched `src/lib/supabase/database.ts`.                                                                                                                                                                     |
| Database lint                | Local Supabase                                                          | Passed                      | `npx supabase db lint --local --level warning` reported no schema warnings.                                                                                                                                                            |
| Focused validator            | Source and persistence contract                                         | Passed                      | `npm run validate-manual-workout-authoring` and the mutation-enabled `--require-persistence` run both passed.                                                                                                                          |
| Static hygiene               | Task-owned TypeScript/JavaScript/Markdown                               | Passed                      | Targeted Prettier, targeted ESLint, and `git diff --check` passed.                                                                                                                                                                     |
| Independent ARCHITECT review | Read-only migration/invariant review                                    | Passed with serial boundary | Confirmed nullable same-runner non-cascading provenance, required origin, and no plan authority. Required the explicit non-runnable Slice 2 boundary; rejected compatibility/default weakening.                                        |
| Independent QA review        | Read-only proof-inventory review                                        | Passed for Slice 1          | Confirmed no-container mutation authority, replay hashes, ACL/isolation, protection, stored-Rest Undo, and cleanup. No source/data/runtime writes were made by QA.                                                                     |

### Omitted Checks And Consequences

- The production build and managed loopback runtime were not run. Both legacy source-materialization
  RPCs named above are intentionally incompatible with required `origin_kind` until serial Slice 2;
  therefore this intermediate source is not deployable or runtime-accepted.
- A fresh canonical design-profile pre-migration seed was attempted, proved incompatible because its
  materialized AI rows lacked immutable saved-source linkage, and was reset. Slice 2 owns legal
  materialization and fixture alignment; no direct SQL, compatibility default, or weakened migration
  was used to manufacture a pass.
- Repository-wide TypeScript checking remains red with broad concurrent checkout diagnostics,
  including existing serialization/type boundaries in manual authoring and plan materialization.
  Targeted task lint passed, but whole-tree type acceptance is not claimed.
- Browser, real-device/iPad, hosted Supabase, provider, release, deployment, and Global QA checks were
  not run. No corresponding acceptance is claimed.

### Next Owner And Lifecycle

This bounded Backend Slice 1 item is `completed`. `BACKEND` is the immediate serial next owner for
Slice 2: update the existing reviewed plan and future-schedule materialization RPCs, canonical
fixture, and their focused validators so all created rows supply truthful immutable origin/provenance
without recreating plan authority. PRODUCT UI/read models/exports remain later explicit slices.
Global QA Acceptance remains pending.

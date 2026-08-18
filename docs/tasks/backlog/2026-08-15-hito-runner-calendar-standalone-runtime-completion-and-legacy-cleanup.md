# Hito Runner Calendar Standalone Runtime Completion And Legacy Cleanup

## Work Item ID

2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup

## Status

completed

## Type

Tracked — Backend completion batch and legacy cleanup

## Priority

high

## Owner

BACKEND

## Epic

runner-core-readiness

## Stage

BACKEND implementation complete — Frontend Product consumer adoption remains separate

## Next Recommended Role

PRODUCT

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Standalone Calendar Materialization Origin Completion](./2026-08-15-hito-standalone-calendar-materialization-origin-completion.md)

## Evidence From

[Calendar Workout Standalone Entity And Plan Source Decoupling Discovery](./2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md)

[Proof Script Reachability And Documentation Source-Of-Truth Consolidation](./2026-08-15-hito-proof-script-reachability-and-documentation-source-of-truth-consolidation.md)

## Scope

Finish all currently demonstrated Backend-owned legacy coupling left after the completed standalone
Calendar write and materialization slices: origin-neutral Calendar export, runner-owned Calendar
context/read models, directly affected runner-activity and canonical-fixture paths, and the two
proven legacy proof identities. Update generated types and focused Backend proofs only where the
existing contract requires it. This is one completion batch, not a new Calendar persistence model.

## Archive Intent

Retain through full local Backend-suite and fixture convergence proof, then compact to the accepted
runner-owned read/export contract, deleted legacy proof paths, and exact Frontend integration
boundary.

## Task

Complete the remaining Backend-owned work required for the runner calendar to be truly standalone.
Calendar export and Calendar context must read selected runner-owned workouts across mixed origins;
source plans remain optional immutable provenance per workout and never become a global current-plan
envelope. Migrate the remaining canonical fixtures and runner-activity read-model paths to the same
contract, then remove only the proven obsolete validation/proof identities whose equivalent coverage
has passed.

## Confirmed Evidence

The completed Slice 2 item proved AI, imported, and manual source materialization creates
runner-owned `planned_workouts` with immutable `origin_kind` and no duplicate mutable plan
container. The full local Backend DB suite still stops at check 15 because
`src/lib/calendar-overflow-actions.ts` queries null-payload container provenance for future
Calendar export. `src/lib/training-api.ts` and runner-activity/Calendar-context fixture paths still
assume a global/container-shaped provenance owner. The architecture audit independently identified
`scripts/validate-active-plan-schedule-edit-preview.ts` as a merge candidate and
`scripts/manual-workout-authoring/empty-plan-proof.ts` as removable only after equivalent
standalone proof and manifest reachability are demonstrated.

## Required Outcome

- Calendar export returns selected runner-owned workout truth across manual, AI, and file-import
  origins; per-workout immutable source provenance is optional metadata, never a first-source or
  current-plan authority.
- Calendar context, runner-activity read models, and their canonical local fixtures use the same
  runner/workout contract and converge through reset, seed, status, reseed, and cleanup.
- The full local Backend DB suite passes, including the former check-15 export/read-model boundary.
- Any surviving assertions from `validate-active-plan-schedule-edit-preview.ts` live in an existing
  canonical standalone Calendar/source-decoupling guard before that obsolete identity is deleted and
  the manifest is updated.
- `empty-plan-proof.ts` and its aggregate import are removed only after direct manual Add proves
  zero dummy plan rows through the replacement proof and current aggregate suite.
- No active/current plan authority, dummy plan writer, compatibility default, or parallel workout
  persistence path remains in the admitted Backend seams.

## What Not To Touch

Product UI or copy, Design System, Admin, source-plan authoring/quality policy, Past Plans product
experience, hosted Supabase, providers, dependencies, Git lifecycle, release, or unrelated dirty
hunks. Do not create a new table, RPC family, fixture framework, state layer, compatibility branch,
or data backfill. Stop and return to PRODUCT if a required change reaches a Frontend or Design
System implementation owner, requires a product decision, or reveals a legacy coupling outside the
named Backend seams.

## Validation Expectations

Run clean and incremental local migration replay; complete local Backend DB suite; mixed-origin
Calendar export/context/read-model matrix; exact source/provenance and content checksum checks;
direct manual Add with zero dummy plan rows; Rest, logged/evidence, replacement, RLS/ACL, and
cross-runner negatives; canonical fixture reset/seed/status/reseed/reset convergence; type parity;
proof/manifest reachability before every deletion; focused formatting/lint/diff checks. Use existing
named ARCHITECT for one bounded read-only no-container/deletion review and existing named QA for a
bounded read-only final proof-inventory review when useful. No browser, hosted, Global QA, release,
or deployment claim is in scope.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Runner Calendar Standalone Runtime Completion And Legacy Cleanup
Stage: Backend completion batch — runner-owned read models, Calendar export, fixtures, validators, and obsolete proof removal
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup.md
Parent: docs/plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md
Depends On: docs/tasks/backlog/2026-08-15-hito-standalone-calendar-materialization-origin-completion.md
Evidence From: docs/tasks/backlog/2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md and docs/tasks/backlog/2026-08-15-hito-proof-script-reachability-and-documentation-source-of-truth-consolidation.md
Epic: runner-core-readiness

Ivan explicitly authorized immediate execution and asked that this currently demonstrated Backend legacy be finished as one cohesive batch, using existing named Hito reviewers where they materially reduce risk. Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this entire canonical item, the completed Slice 1 and Slice 2 receipts, and the standalone Calendar architecture discovery before the first write. Re-check the current dirty, local-Supabase, fixture, and runtime boundaries; preserve unrelated bytes and serialize shared mutations.

Complete every currently evidenced Backend-owned no-container boundary together: origin-neutral Calendar export; runner-owned Calendar context/read models; directly affected runner-activity and canonical-fixture paths; type/proof alignment; and deletion of only the two legacy proof identities whose replacement coverage and manifest reachability are proven. This is a completion batch for the existing runner/workout contract, not a new persistence model.

The accepted product rule is mandatory: a plan is only an immutable AI, file-import, or manual source artifact for initial placement. After confirmation, manual, AI-authored, and imported workouts are the same independently runner-owned Calendar entity. `origin_kind` and optional immutable source identity are provenance only. Calendar export, context, visibility, mutations, permissions, review, and fixtures must never select, infer, restore, or recreate a global/current/mutable plan container.

Reuse existing export, Calendar-context, runner-activity, fixture, type, validator, and proof owners. Do not add a table, RPC family, fixture framework, state layer, compatibility default/branch, data backfill, dependency, provider path, or active-plan replacement. Do not modify Product UI/copy, Design System, Admin, source-plan authoring/quality, Past Plans experience, hosted state, Git lifecycle, release, or unrelated work. Stop and return to PRODUCT if the first required production change is FRONTEND or DESIGN SYSTEM, or if a product decision is required.

Before deleting `scripts/validate-active-plan-schedule-edit-preview.ts`, move every surviving necessary assertion into an existing canonical standalone Calendar/source-decoupling guard, run the old and replacement guards against identical source, update the manifest, and prove there is no remaining caller. Before deleting `scripts/manual-workout-authoring/empty-plan-proof.ts` and its aggregate import, prove direct manual Add creates zero dummy plan rows through the replacement proof and the current manual aggregate suite. Do not replace either with a second legacy-named compatibility proof.

Use existing named ARCHITECT only for one bounded read-only review of no-container semantics and proposed deletions; use existing named QA only for a bounded read-only final proof-inventory review if helpful. Reviewers must read AGENTS.md, their own role file, and their directly matching skill; they make no source, database, fixture, runtime, Git, or hosted mutations. Do not delegate Backend implementation.

Definition of Done: the full local Backend DB suite is green, including the former check-15 Calendar export/read-model failure; mixed manual/AI/file-import export/context matrix passes with exact row/source provenance; fixture reset -> seed -> status -> reseed -> status -> reset converges; direct manual Add proves zero dummy plan rows; Rest, evidence/logged, replacement, RLS/ACL, cross-runner, type parity, and source/content checksum protections pass; deletions are reachability/manifest-proven; Prettier, focused ESLint, and git diff --check pass. Update only this canonical item with a compact English tracked receipt. Do not claim browser, real-iPad, hosted, Global QA, release, or deployment acceptance.
```

## Backend Execution Preflight — 2026-08-15

- **Mode / owner:** Tracked / BACKEND. PRODUCT already placed this item in `in_progress`. The Git
  index is empty; all concurrent dirty and untracked work remains excluded. No other repository,
  local-database, fixture, or managed-runtime writer is active.
- **Demonstrated discriminator:** the terminal Slice 2 receipt and current source agree. Future
  Calendar export still accepts only null-payload materialized-plan provenance; the persisted
  snapshot still requires one latest materialized provenance record before it will expose Calendar
  rows; and the runner-activity plus Calendar-context fixtures still create container-shaped rows
  without the required standalone `origin_kind`. The old retirement validator and current manual
  aggregate both pass on the identical pre-change source, proving their live baseline before
  replacement/deletion work begins.
- **First incorrect owners:** `src/lib/calendar-overflow-actions.ts`, the legacy provenance readers in
  `src/lib/active-plan-persistence.ts`, the persisted read-model mapping in
  `src/lib/training-api.ts`, and the directly affected runner-activity/Calendar-context fixture
  setup. They select or manufacture a global mutable container even though `planned_workouts` plus
  per-row immutable source provenance are already canonical.
- **Existing seams reused:** runner-owned `planned_workouts`, optional per-row immutable source IDs,
  `origin_kind`, the existing Calendar export document builder, persisted snapshot/read-model
  mapping, runner-local Calendar date context, runner-activity fixtures, manual authoring aggregate,
  Backend manifest, and canonical design-profile lifecycle.
- **Reuse-first budget:** new production runtime artifacts, migration, table, RPC, state layer,
  compatibility path, fixture framework, validator framework, dependency, provider path, and data
  backfill: **none**. Existing owners can carry the complete contract.
- **Responsibility removed/simplified:** remove null-payload/latest-plan selection from Calendar
  export and readback; make source provenance optional and per workout; make fixture setup legal and
  origin-explicit; migrate every surviving retirement assertion into an existing standalone guard;
  then delete only `scripts/validate-active-plan-schedule-edit-preview.ts` and
  `scripts/manual-workout-authoring/empty-plan-proof.ts` with their manifest/import edges after
  replacement parity and zero remaining callers are proven.
- **Local boundaries:** Supabase loopback is healthy at the current migration set. The managed
  `qa_fixture` process is healthy but its private build artifact is stale/broken with
  `artifact_missing`; this source/local-persistence task will not build, restart, stop, or use it.
- **Focused proof:** reproduce the recorded local DB reds; mixed manual/AI/file-import Calendar
  export/context with exact per-row provenance; authenticated/cross-runner and protected-history
  negatives; runner-activity and Calendar-context readback; direct manual Add with zero dummy plan
  rows; old/replacement guard parity and reachability; design-profile reset -> seed -> status ->
  reseed -> status -> reset; complete Backend local DB suite; type/checksum protections; targeted
  Prettier/ESLint and `git diff --check`.
- **Stop boundary:** return to PRODUCT before any Frontend or Design System implementation, new
  persistence shape, product decision, hosted/provider action, dependency change, Git lifecycle,
  release, or deployment action.

## Backend Tracked Implementation Receipt — 2026-08-16

### Outcome

Backend Implementation DoD passed. Calendar export, persisted Calendar readback, mutation context,
runner-activity fixtures, and the canonical design profile now use runner-owned workout rows across
manual, AI-authored, and file-import origins. A source record is optional immutable per-workout
provenance only. Persisted snapshots return `planMeta: null`, expose runner-level
`calendarContext.workoutEditing`, and attach exact nullable `sourceProvenance` to each workout.

The former Calendar export failure is green. The complete local Backend source/database suite passes
21/21 checks. The canonical design-profile lifecycle converges through reset, seed, status, reseed,
status, and reset with exact 55 workouts, 30 activities, 11 matched activities, 19 unplanned
activities, zero active authority, and zero final owned rows. Direct manual Add persists a standalone
`origin_kind = manual` workout with `plan_cycle_id = null` and creates zero plan rows.

### Root-Cause Discriminator And Correction

- **Original red:** `validate-calendar-overflow-future-actions.ts` reported that future Calendar
  provenance was unavailable because export selected a null-payload materialized plan
  before it read future Calendar rows. Runner-activity and Calendar-context validators separately
  failed the current `origin_kind` constraint because their fixtures still manufactured container-
  shaped rows.
- **First incorrect owners:** the latest/materialized-plan readers in
  `src/lib/active-plan-persistence.ts`, the export envelope in
  `src/lib/calendar-overflow-actions.ts`, the plan-gated persisted snapshot in
  `src/lib/training-api.ts`, and the directly affected fixtures.
- **Correction:** export now builds one origin-neutral document from selected future Calendar rows;
  context/readback load all same-runner workouts and resolve only their optional same-runner source
  IDs; editing capability depends on the workout, date, occupancy, evidence, and document safety;
  fixtures persist explicit standalone origins. No new runtime artifact, migration, table, RPC,
  compatibility path, fixture framework, dependency, or provider path was added.
- **Clean-reset discriminator:** an initial design-profile reset failed when the disposable identity
  did not yet exist. The existing reset handler now treats that already-empty state as a truthful
  idempotent reset; status still requires a seeded identity, and final reset preserves the created
  authenticated fixture identity while removing all owned data and raw objects.

### Files

Production-source seams changed:

- `src/lib/active-plan-persistence.ts`
- `src/lib/active-plan-workout-editing/source-capabilities.ts`
- `src/lib/manual-workout-authoring/edit-workout.ts`
- `src/lib/calendar-overflow-actions.ts`
- `src/lib/plan-export.ts`
- `src/lib/training-api.ts`
- `src/lib/training.ts`

Existing proof/fixture owners changed:

- `scripts/test-user.mjs`
- `scripts/validate-backend.mjs`
- `scripts/validate-calendar-overflow-future-actions.ts`
- `scripts/validate-manual-workout-authoring.ts`
- `scripts/validate-runner-activity-foundation.ts`
- `scripts/lib/runner-activity-gate-4-fixture.ts`
- `scripts/validate-runner-activity-gate-4.ts`
- `scripts/validate-runner-activity-read-models.ts`
- `scripts/validate-runner-calendar-context.ts`
- `scripts/manual-workout-authoring/copy-paste-proof.ts`
- `scripts/manual-workout-authoring/move-proof-fixtures.ts`
- `scripts/manual-workout-authoring/persisted-edit-proof.ts`

Obsolete proof identities deleted after replacement parity and reachability proof:

- `scripts/validate-active-plan-schedule-edit-preview.ts`
- `scripts/manual-workout-authoring/empty-plan-proof.ts`

This canonical item is the only task artifact changed. Existing concurrent dirty hunks in shared
files remain outside this task's ownership and were preserved.

### Validation Inventory

| Check                               | Scenario / environment                             | Result | Evidence                                                                                                                                                                                                                                                                                                                  |
| ----------------------------------- | -------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red discriminators                  | Pre-change loopback validators                     | Passed | Calendar export reproduced the missing-provenance failure; runner-activity, Gate 4, read-model, and Calendar-context fixtures reproduced missing standalone `origin_kind`/container coupling.                                                                                                                             |
| Clean and incremental schema replay | Local Supabase                                     | Passed | Pre-reset focused checks exercised the incremental current database; `supabase db reset --local --no-seed` then applied the complete migration history through `20260816020328` without error. This task added no migration.                                                                                              |
| Mixed-origin export/readback        | Local disposable authenticated runner              | Passed | Eight Calendar rows included manual, AI, and file-import origins; five future exported rows were exactly manual 1 / AI 3 / file import 1, with two immutable source records, zero active authority, no internal source IDs in export, and zero provider calls.                                                            |
| Runner-owned mutation contract      | Local disposable authenticated runner              | Passed | Manual Add created zero plan rows; content edit, prescription-only Copy, Clear, empty-target Move, stored-Rest Move/Undo/two reloads, evidence-race refusal, cross-runner isolation, and cleanup passed.                                                                                                                  |
| Runner activity foundation          | Local Supabase                                     | Passed | Foundation, Gate 4, and scaled 3,000-activity read-model validators passed; canonical readback reported zero active authority, one immutable source, zero materialized containers, and 55 workouts.                                                                                                                       |
| Canonical fixture lifecycle         | Local `qa-saved-plan`, as-of 2026-08-16            | Passed | Reset -> seed -> status -> reseed -> status -> reset preserved 55/30/11/19, 11/11/0 FIT completion, source lifecycle coverage, providers off, identical row counts after reseed, retained auth identity, zero raw objects, and zero final owned rows.                                                                     |
| Complete Backend DB suite           | Local loopback                                     | Passed | `npm run validate:backend:local-db`: 21/21 source + local DB checks passed, including the former Calendar export stop, reviewed materialization, manual persistence, RLS/ACL, protected replacement, checksums, and runner-activity checks. Runtime and release groups were intentionally skipped by the canonical suite. |
| Schema/type parity                  | Local Supabase                                     | Passed | Generated local types, formatted in-memory, were byte-identical to `src/lib/supabase/database.ts`; local DB lint reported no schema errors; local migration history matched all repository versions.                                                                                                                      |
| Legacy proof replacement            | Identical source before deletion plus final source | Passed | The old retirement validator and replacement manual aggregate both passed before deletion. The current aggregate retains effective no-container/RPC/type/export assertions; mutation proof retains zero-plan Add. Manifest/source reachability has no executable caller or import for either deleted path.                |
| Static hygiene                      | Task-owned source and item                         | Passed | Targeted Prettier and ESLint passed; `git diff --check` passed.                                                                                                                                                                                                                                                           |
| ARCHITECT review                    | Independent read-only final source review          | Passed | No global/latest plan selection or plan-gated capability remains in the changed seams; per-row source identity is provenance only; both deletions have replacement coverage and no live edge.                                                                                                                             |
| QA review                           | Independent read-only proof-inventory review       | Passed | Verdict: Passed for Backend implementation evidence; no concrete defect or missing in-scope must-run check found.                                                                                                                                                                                                         |

### Preserved Boundaries And Omitted Proof

- Product UI/copy, Design System, Admin, source-plan authoring/quality, Past Plans, providers,
  dependencies, hosted state, Git lifecycle, release, and deployment were not changed.
- Repo-wide `tsc --noEmit` was not green. Its remaining reported errors in `training-api.ts` originate
  from the pre-existing `RouteDataLoaders.loadViewer(): Promise<unknown>` serializability contract in
  `route-data-actions.ts`, plus unrelated broad checkout errors. Generated database type parity,
  targeted ESLint, runtime source validators, and all 21 Backend DB checks are green; no whole-tree
  TypeScript-clean claim is made.
- A production build was not run. The serial Frontend Product consumer migration is still required,
  so this checkpoint is not claimed as an integrated deployable candidate.
- Managed-runtime/browser, real-iPad, hosted Supabase, paid-provider, Global QA, release, and
  deployment acceptance were not run and remain unclaimed.

### Next Owner And Consumer Contract

Return to PRODUCT to route the separate **FRONTEND Product** adoption. Persisted consumers must use
`snapshot.calendarContext.workoutEditing` and each workout's `sourceEditing` / `sourceProvenance`.
They must remove dependencies on `snapshot.planMeta`, `activePlanId`, plan date bounds, and plan-keyed
Undo state. The first read-only identified consumers are Calendar projection/actions, Workout detail,
and AppShell. This separate Frontend implementation boundary does not reopen Backend completion.

Global QA Acceptance remains pending and was not claimed.

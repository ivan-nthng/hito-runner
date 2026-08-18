# Hito Workout Move Undo Stored Rest Reversibility

## Work Item ID

2026-08-15-hito-workout-move-undo-stored-rest-reversibility

## Status

completed

## Type

Tracked — Backend atomic Calendar move/Undo persistence recovery

## Priority

high

## Owner

BACKEND

## Epic

runner-core-readiness

## Stage

Backend Implementation DoD complete; return to PRODUCT for any later browser or real-iPad acceptance

## Next Recommended Role

PRODUCT

## Parent

[Hito iPad Calendar Drag, Sidebar, And Move Recovery](./2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md)

## Evidence From

[Hito iPad Calendar Drag, Sidebar, And Move Recovery](./2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md)

## Scope

Make a Calendar Move to a persisted Rest day fully reversible within the existing Undo contract. The
stored Rest must remain durable after Undo and reload, without a client-created second persistence path.

## Archive Intent

Retain through independent local Calendar replay, then compact at terminal closeout.

## Task

Repair the first Backend owner of the demonstrated Move → stored Rest → Undo data loss. Preserve the
current explicit Calendar interaction while restoring the complete pre-move durable state atomically.

## User Report

On iPad, selecting Move produced an unclear error. Frontend replay did not reproduce that error, but it
did reproduce a more severe persistence defect: moving an ordinary workout onto an existing Rest day,
then pressing Undo, restores the workout while permanently deleting the prior Rest row.

## Observed Behavior

The move action replaces a stored Rest. Browser Undo retains only the moved workout identity and reverse
dates. Its reverse move cannot restore the replaced Rest. After reload, the target is empty and offers
Add rest day.

## Expected Behavior

Within the existing Undo window, Move → persisted Rest → Undo → reload restores exactly the original
workout at its source and exactly the original Rest at its target, with no duplicates, lost rows, or
plan/schedule/provenance drift. Empty-target and occupied-workout replacement behavior remains unchanged.

## Demonstrated Source Investigation

The completed iPad task shows that resolveMoveTargetDay identifies a persisted Rest replacement and
persistManualWorkoutMove supplies it to the atomic move mutation. The current Undo state contains only
the moved workout and reverse dates. The first owner capable of retaining/recovering the displaced Rest
inside the same durable mutation contract is src/lib/manual-workout-authoring/move-workout.ts. Calendar
is a consumer and must not serialize a Rest row to compensate.

## Existing Seams To Reuse

- src/lib/manual-workout-authoring/move-workout.ts
- Existing move review/confirm, active-plan metadata, previous-workout/event, and optimistic move seams
- Current Calendar Undo window and request path as read-only consumer evidence
- Existing manual authoring persistence and Calendar validators/proofs

## Required Outcome

- Preserve enough authoritative pre-move state to atomically restore a displaced Rest during a valid Undo.
- Keep identity, owner, plan, date, display order, provenance, and Rest semantics correct after reload.
- Reject stale, expired, cross-user, incompatible-plan, or concurrently modified undo attempts without
  a partial mutation or silent loss.
- Retain current valid empty-target and occupied-workout replacement contracts without changing Frontend
  persistence behavior.

## What Not To Touch

- No Calendar UI, browser Undo storage shape, touch/drag behavior, AppShell, Design System code, or
  client-side Rest reconstruction.
- No manual creation, content editing, copy/delete, FIT ingestion, sidebar, provider, hosted state,
  blanket backfill, new fixture framework, or unrelated dirty hunks.
- Do not add a second persistence model, generic Undo framework, compatibility path, or table unless
  existing canonical move/event truth demonstrably cannot represent the required atomic recovery.

## Definition Of Done

- The persisted Rest survives Move → Undo and at least two reloads exactly once at the target date.
- The moved workout returns exactly once to its source; both row identities and plan/schedule metadata
  remain correct, and no duplicate/empty phantom day appears.
- Expired/stale/cross-user/concurrent undo and incompatible source/target conditions fail closed with
  no partial write. Existing empty-target and occupied-workout move/review/Undo behavior remains true.
- Backend source and local disposable persistence proof cover the positive, negative, race, and
  cleanup matrix. A named ARCHITECT read-only transaction review and named QA independent read-only
  replay are integrated before closure.

## Validation Expectations

Use existing local disposable data and migration/persistence proof seams. Run focused static checks,
formatting, lint, diff hygiene, and proportional build/browser checks only where the changed contract
requires them. Do not claim Global QA, hosted, release, or deployment readiness.

## Backend Execution Preflight — 2026-08-15

- **Mode / owner:** Tracked / BACKEND. The Git index was empty before the first task-owned write.
  No other repository or runtime writer was active; the required ARCHITECT reviewer is read-only.
- **Outcome:** preserve a displaced persisted Rest in existing server-owned move audit truth and
  atomically restore it when the current reverse Move matches the valid Undo invariant.
- **Root-cause discriminator:** `apply_calendar_workout_mutation` deletes and returns the reviewed
  target Rest, but `move-workout.ts` discards that row. The current renamed function also ignores the
  already-supplied `p_plan_update`, so the existing move event / `previous_workout` truth is not
  durable.
- **Existing seams reused:** move review/confirm/direct actions, `active_plan_user_edit`, its
  `previous_workout` field, server-built plan metadata, the existing RPC signature, runner advisory
  lock and row fingerprints, and the current manual-authoring proof lifecycle.
- **Reuse-first change budget:** new production runtime artifacts, table, column, RPC, persisted
  model, client compatibility path, fixture framework, dependency, and generated type: **none**. One
  append-only function-only migration is required because historical migrations are immutable and
  only the existing database transaction can move the source and restore the displaced Rest without
  a partial write.
- **Simplification:** replace the ignored deleted-Rest / ignored-plan-update branch with one durable
  move event and one optional atomic restore branch. Empty-target and occupied-workout behavior
  remain unchanged.
- **Focused proof:** exact Rest/source identity, ownership, plan, date, display order, provenance,
  and two readbacks; empty and occupied preservation; expired, stale token/fingerprint, concurrent
  target, cross-user, incompatible-plan, and forced-failure byte equivalence; complete disposable
  cleanup; focused formatting, lint, type, migration, and diff hygiene.
- **Stop boundary:** no Frontend/UI/session-storage change, new persistence shape, Rest authoring
  rewrite, content edit, FIT/provider/hosted action, or unresolved Product decision is admitted.

## Historical Execution Prompt

```text
ROLE: BACKEND

Task: Hito Workout Move Undo Stored Rest Reversibility
Stage: Backend atomic Calendar move/Undo recovery with independent review
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md
Parent evidence: docs/tasks/backlog/2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md

Ivan explicitly authorized implementation. Read AGENTS.md, agents/backend.agent.md,
skills/hito-backend-supabase-contract/SKILL.md, the complete canonical item, and the completed iPad
receipt before the first write. Re-check dirty state, active writers, current move contract, and
existing proof seams. Preserve unrelated dirty hunks byte-for-byte.

Observed fact: Move onto a persisted Rest replaces that row. Current browser Undo stores only the moved
workout identity/reverse dates, so reverse movement restores the workout but not the original Rest.
The first incorrect owner is the Backend move contract in move-workout.ts. The client must not persist
or reconstruct a Rest row to hide this defect.

Outcome: make the complete pre-move state durable and atomically reversible through the existing Undo
contract. Within the existing valid Undo window, Move -> stored Rest -> Undo -> two reloads must retain
one original workout at its source and one original Rest at its target, without duplicates, loss, or
identity/plan/date/order/provenance drift. Empty-target and occupied-workout replacement behavior must
remain unchanged. Expired, stale, cross-user, incompatible-plan, and concurrently changed cases must
fail closed without a partial mutation.

Reuse the existing move review/confirm, active-plan metadata, move/event/previous-workout truth, and
manual-authoring persistence proof seams. Choose the smallest canonical server-side representation
that can carry the displaced Rest through the authoritative operation; do not create a generic undo
framework, a second persistence model, a table, a client compatibility path, or a fixture framework
without demonstrating that the existing truth cannot represent it. A function-only migration is
permitted only if the existing atomic operation requires it; do not access hosted state.

Do not change Calendar/UI/browser Undo storage, touch drag, AppShell, Hito DS, manual creation,
content editing, copy/delete, Rest authoring policy, FIT/provider flows, sidebar, or unrelated dirty
work. Stop and return to PRODUCT if this needs a client contract change, a new persisted shape, an
unproven product decision, or another owner.

Use existing named specialists for independent evidence: ask ARCHITECT for one bounded read-only review
of the proposed atomic state/recovery invariant before closing implementation; ask QA for one bounded
read-only local replay after your focused proof. Neither reviewer may edit source, data, or runtime.
Do not delegate Backend implementation.

Validate source and disposable local persistence: stored-Rest round trip and two reloads; source/target
identity/order/provenance; empty target and occupied replacement preservation; expiry, stale/review,
concurrency/race, cross-user, and failure no-partial-write cases; complete cleanup. Run focused
validators, migration proof if changed, Prettier, ESLint, and diff hygiene. Record an English Tracked
receipt in this item, including the Architect/QA findings and any real-iPad coverage gap. Do not claim
Global QA, hosted, release, or deployment readiness.
```

## Backend Tracked Implementation Receipt — 2026-08-15

### Product Outcome

The existing server-owned Move transaction now preserves a displaced persisted Rest as authoritative
audit truth and restores that exact row when the current inverse Move is a valid Undo. The client still
sends only the moved workout identity and inverse dates. Move → stored Rest → Undo → two independent
readbacks preserves one original workout at its source and one original Rest at its target, including
row identity, runner ownership, provenance plan, schedule order, source metadata, and `created_at`.
Empty-target and occupied non-Rest replacement behavior remains unchanged.

### Root Cause And Correction

The existing RPC deleted and returned a reviewed target Rest, but `move-workout.ts` discarded that row,
and the current database function ignored the already-supplied plan metadata update. The first incorrect
owner was the Backend move persistence contract, not the Calendar Undo consumer.

The correction reuses `active_plan_user_edit.previous_workout`, the existing plan metadata update, the
existing ten-argument `apply_calendar_workout_mutation` RPC, and the existing review/confirm/direct Move
actions. The initial Move records the exact locked Rest plus a server-owned expiry. A matching reverse
Move resolves only the latest authoritative event and asks the same transaction to restore the exact
row. Full-row fingerprints, plan revision locking, database-time expiry, ownership/provenance checks,
and evidence protections reject stale, expired, cross-user, concurrent, or mismatched requests before
mutation. Plan identity remains provenance rather than Calendar authority.

### Files Changed

- `src/lib/manual-workout-authoring/move-workout.ts` — durable displaced-Rest resolution, exact review
  fingerprints, expiry/stale handling, and restore projection through the existing move contract.
- `src/lib/active-plan-lifecycle-persistence.ts` — parse the optional restored workout returned by the
  existing RPC.
- `supabase/migrations/20260815212107_workout_move_undo_stored_rest_reversibility.sql` — one
  same-signature, function-only migration restoring plan locking/audit persistence and atomic Rest
  recovery; no new RPC, table, column, policy, or persisted model.
- `scripts/manual-workout-authoring/move-proof.ts` and
  `scripts/manual-workout-authoring/move-proof-fixtures.ts` — deterministic source proof for valid,
  expired, superseded, concurrent, and full-row fingerprint cases.
- Task-specific hunks in `scripts/manual-workout-authoring/persistence-proof.ts` — exact disposable
  persisted round trip, two readbacks, occupied-target preservation, rollback, and cleanup evidence.
- This canonical item — lifecycle, preflight, validation inventory, and closure receipt.

Unrelated dirty hunks and later checkout movement were preserved byte-for-byte. No Frontend, Calendar,
Design System, provider, hosted, dependency, lockfile, staging, commit, push, or deployment change was
made.

### Independent Review

- **ARCHITECT:** conditionally approved the reuse-first representation and required plan locking/update,
  full-row fingerprints, exact initial/reverse event validation, no stale fallthrough,
  provenance-not-authority handling, database-time expiry, activity-match deletion protection, and
  exact transaction ordering. Every listed correction was integrated before persistence proof.
- **QA:** independent read-only focused verdict **Passed**. QA reran the source validator, inspected the
  source/migration/live function and privileges, reviewed the completed disposable proof, confirmed the
  local migration history, and independently read back zero owned rows across the 20-relation QA pool.
  QA made no source, fixture, runtime, database, Git-index, or hosted mutation.

### Validation Inventory

| Check                        | Scenario / environment                                                 | Result     | Evidence                                                                                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Red discriminator            | Existing source and historical RPC                                     | Passed     | The target Rest was deleted/returned but discarded, while `p_plan_update` and expected plan revision were ignored; a reverse client Move therefore had no authoritative Rest to restore.                                                         |
| Focused source contract      | `npm run validate-manual-workout-authoring`                            | Passed     | Existing manual authoring invariants plus exact restore, expiry, superseded event, concurrent target, and full-row fingerprint cases passed.                                                                                                     |
| Exact positive persistence   | Local loopback Supabase; canonical disposable proof                    | Passed     | Stored-Rest round trip, two stable reloads, exact source/Rest identities, runner ownership, provenance, order, and `created_at` all passed.                                                                                                      |
| Existing move behavior       | Empty and occupied non-Rest targets                                    | Passed     | Empty-target Move remained durable; occupied workout replacement remained unchanged after the stored-Rest round trip.                                                                                                                            |
| Atomic negative matrix       | Local disposable persistence and source proof                          | Passed     | Stale plan/review/fingerprint, expired/superseded Undo, concurrent target, cross-user/foreign ownership, protected evidence, and forced invalid update rejected without partial mutation.                                                        |
| Evidence protection          | Function source and live local RPC                                     | Passed     | Logs, result assets, actual metrics, comparisons, AI insights, and activity-to-planned-workout matches block destructive replacement.                                                                                                            |
| Migration application        | Local Supabase migration history                                       | Passed     | `20260815212107` is applied locally with no pending local migration delta. Historical migrations were not rewritten.                                                                                                                             |
| Database lint                | `npx supabase db lint --local --level error`                           | Passed     | No local database lint error.                                                                                                                                                                                                                    |
| Live function and privileges | Read-only local `pg_proc` / ACL inspection                             | Passed     | Exact ten-argument RPC is security-invoker, carries restore/activity-match/expiry guards, and execute remains limited to `postgres` and `service_role`.                                                                                          |
| Cleanup convergence          | Disposable lifecycle plus independent read-only QA count               | Passed     | All 20 owned persistence relations returned to zero; the retained auth identity remained and the lease was released.                                                                                                                             |
| Focused formatting/lint      | Targeted Prettier and ESLint                                           | Passed     | Task-owned TypeScript, proof, migration, and receipt formatting/lint checks exited zero.                                                                                                                                                         |
| Diff hygiene                 | `git diff --check`, migration whitespace check, empty-index inspection | Passed     | No whitespace errors; the Git index remained empty.                                                                                                                                                                                              |
| Production build             | `npm run build`                                                        | Passed     | Fresh production build completed with existing non-blocking directive/chunk-size warnings. The build cleanup left the QA server stopped; no browser claim is made.                                                                               |
| Repository TypeScript        | `npx tsc --noEmit`                                                     | Not passed | The dirty checkout reports 447 broad pre-existing diagnostics, including the known existing server-function serializability diagnostic for `ManualWorkoutDraftInput.block.nestedRepeatGroup`. No repository-wide TypeScript-green claim is made. |
| Independent QA               | Named QA read-only replay                                              | Passed     | Source contract, migration history, live RPC/ACL, protection matrix, completed persistence receipt, and zero-row cleanup were independently verified.                                                                                            |

### Omitted Checks And Consequences

- No browser or real-iPad replay was run. The original iPad/Safari interaction and visual acceptance
  remain unverified by this Backend item.
- QA did not repeat the mutating disposable lifecycle because its assignment was read-only; it reviewed
  the Backend owner's completed exact output and independently corroborated cleanup through zero-row
  readback.
- No hosted Supabase migration, hosted data, provider, Global QA, release, or deployment check was run.
  This receipt proves local Backend Implementation DoD only.
- Repository-wide TypeScript is not green for the current dirty checkout, so this item relies on the
  focused validator, focused ESLint, local persistence proof, database lint, and successful production
  build rather than claiming whole-tree strict type acceptance.

### Lifecycle And Next Owner

Backend Implementation DoD is complete. The item is `completed`. PRODUCT owns any decision to resume
the parent iPad/browser acceptance flow; Global QA, hosted parity, release, and deployment remain
separate and unclaimed.

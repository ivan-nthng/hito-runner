# Hito Runner Calendar FIT-Preserving Schedule Rebase Discovery

Work Item ID: `2026-08-17-hito-runner-calendar-fit-preserving-schedule-rebase-discovery`
Status: completed
Type: Tracked
Priority: high
Owner: ARCHITECT
Epic: runner-core-readiness
Parent: [Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Runner Core Baseline And Risk-Derived Regression Gate](./2026-08-17-hito-runner-core-baseline-and-risk-derived-regression-gate.md)
Scope: Define one safe, runner-workout-owned bulk rebase that moves a selected current schedule by
an exact whole-week offset, preserves weekday alignment, and never automatically deletes FIT-backed
history. This discovery does not mutate Ivan's account or implement any UI, Backend, fixture, or
source change.
Archive Intent: Retain through the resulting implementation and independent acceptance; compact to
the accepted contract and terminal receipt afterwards.

## Task

Establish the canonical product and architecture contract for a runner who missed part of a
schedule and wants to resume it on a same-weekday anchor. The example is `Monday 2026-08-03` to
`Monday 2026-08-17`, an exact `+14 day` rebase. The old date positions are cleared because their
eligible calendar rows are moved forward; the cadence and weekdays remain intact.

This is not a sequence of individual Move actions and not a replacement active-plan container. It
is one reviewed Calendar mutation over independent runner-owned workout rows. A past source may be
displayed as provenance only; it must not control the current Calendar.

## User Report

Ivan needs to restart his current calendar after missed runs: align the prior Monday to the current
Monday and move the current sequence by two weeks. He explicitly requires that no workout with an
uploaded FIT file is ever automatically deleted. Missed, unlogged rows may leave their old past
dates as part of the rebase.

## Accepted Product Direction

- A rebase anchor and its target must share the same weekday. The permitted offset is a non-zero
  whole number of weeks; `2026-08-03` to `2026-08-17` is `+14 days`.
- Eligible runner-owned Calendar rows in the selected schedule scope move by that exact offset,
  preserving weekday and relative spacing. Their original dates are consequently cleared.
- Any FIT-backed workout is immutable history: it is neither deleted nor moved automatically.
- Missed rows with no protected result/evidence may move; the final eligibility treatment for other
  persisted result states must reuse the existing protection contract rather than silently discard
  facts.
- The operation must present a complete preview: affected rows, fixed FIT/history rows, target
  collisions, exclusions, and its exact date delta. Confirmation must be atomic; cancel is a
  durable no-op.
- A conflict with a protected FIT/history row fails closed and is shown in preview. The feature may
  not replace, delete, or hide that row to make the rebase succeed.
- The existing per-workout Move and durable Undo semantics remain intact. Batch undo/rollback, if
  admitted, must restore the exact pre-rebase row set rather than reconstruct workouts on the
  client.

## Evidence

- The captured personal Calendar shows a Monday schedule anchor on August 3 and the desired current
  Monday on August 17. It also visibly contains an existing August 17 row, so an individual Move
  would create a target-replacement decision rather than shift the schedule.
- `resolveManualWorkoutMoveDatePolicy` currently permits a missed source only for a target of today
  or later. `resolveManualWorkoutMoveTarget` accepts one unprotected target row as a replacement
  target, while protected target history/evidence fails closed. This proves that the current
  single-row action is not the requested bulk operation.
- Runner Core local acceptance is complete for manual, AI-authored, imported, FIT, Move/Undo,
  export/import, History, and factual Progress flows. It does not cover a schedule-wide rebase.

## Required Discriminator

ARCHITECT must inspect the existing Calendar mutation, protection, source-reuse, and audit seams to
prove:

1. the minimal runner-workout selection boundary that represents one rebased schedule without
   using plan-container authority;
2. which existing persisted states are protected in addition to FIT and how the accepted FIT rule
   composes with them;
3. whether a single atomic server mutation and existing audit/Undo seams can safely express the
   preview/confirm operation, or the narrow new invariant required; and
4. the owner-separated implementation sequence and risk-derived proof matrix.

## What Not To Touch

- Ivan's personal or hosted account, uploaded FIT files, production data, providers, billing, or
  deployment.
- Current Calendar source-of-truth: no active-plan authority, duplicate workout model, client-side
  reconstruction, or source-plan permission/schedule ownership.
- Per-workout Move, Copy, Clear, Delete, FIT ingestion, Progress, and Past Plans contracts unless
  a demonstrated shared owner is required by the discovery.
- No implementation, schema, migration, fixture, source, or Design System change in this discovery.

## Validation Expectations

The discovery must be source-backed and identify a deterministic local replay matrix covering:

- same-weekday whole-week offsets and invalid weekday/zero/negative inputs;
- exact candidate selection and no duplicate/omitted eligible rows;
- FIT-backed rows remaining at their original identity/date with no deletion;
- protected-state and target-collision failures with no partial writes;
- preview/cancel/confirm and, if admitted, exact-once undo across reload;
- cross-user isolation, cleanup, and preservation of existing individual Move/Undo behavior.

## Architecture Receipt

### Preflight and evidence boundary

- **Mode / owner:** Tracked, read-only discovery owned by ARCHITECT. No release freeze was active;
  the Git index was empty. The only task-owned write was this receipt.
- **Concurrent boundary:** the current standalone Calendar, mutation, generated database type, and
  proof files were already dirty or untracked. They were inspected as the current candidate and
  left byte-for-byte unchanged; this receipt makes no released-state claim for them.
- **Source authority:** [current-product.md](../../current-product.md) and the mandatory Runner
  Calendar Source Boundary in [AGENTS.md](../../../AGENTS.md) control the decision. Historical
  plan names and `plan_cycle_id` are provenance/temporary implementation facts only.
- **Subagent:** none. The decision was resolvable from the current source and accepted product
  contract without interrupting another owner.

### Demonstrated current system

1. `planned_workouts` is the current Calendar row store. The standalone migration makes
   `(user_id, workout_date)` unique, permits a nullable same-user `plan_cycle_id`, and records
   `origin_kind` as `manual`, `ai`, or `file_import`. Calendar reads fetch every runner row first;
   source plans are fetched separately only to project provenance.
2. [move-workout.ts](../../../src/lib/manual-workout-authoring/move-workout.ts) resolves one
   runner-owned non-Rest source by workout identity/date, rebuilds review server-side, and passes
   one expected source and at most one expected target to `apply_calendar_workout_mutation`.
   A missed past unlogged source may move to today or later. Origin does not gate eligibility.
3. The TypeScript preflight treats a log or any `workout_result_assets` row as protected. The
   effective database function is deliberately stronger: source and replacement rows fail closed
   for any `workout_logs`, `workout_result_assets`, `workout_actual_metrics`,
   `workout_comparisons`, `workout_ai_insights`, or
   `runner_activity_planned_workout_matches` relation. A log covers completed, partial, and skipped
   outcomes. Any uploaded FIT/ZIP asset is therefore protected even before successful parsing.
4. The current mutation RPC takes a per-runner transaction advisory lock, verifies full row
   fingerprints, rejects protected evidence and stale occupancy, and mutates exactly one row. It
   cannot represent a complete multi-row selection or one batch confirm.
5. `calendar_workout_mutation_events` already stores per-workout before/after images, checksums,
   displaced state, server expiry, and `undo_of_event_id`. The current UI persists one reversed
   single-workout request in session storage; it does not own authoritative recovery. The relation
   can retain one event per rebased row, but the existing RPC and UI Undo shape cannot group or
   restore a batch.
6. FIT/result attachment is written outside the Calendar mutation RPC. The rebase confirm must
   therefore re-check every protection relation under the runner mutation lock, and the Backend
   slice must serialize creation/removal of those protection roots through that same lock. Without
   that shared discriminator, an evidence write racing a rebase is not provably ordered.

### Decision: one runner Calendar tail rebase

The smallest schedule selection is the **runner-owned Calendar tail**, not a plan or an origin
group:

- Input is `anchorWorkoutId`, its expected `anchorDate`, and `targetDate`. The anchor must be an
  owned, non-Rest, unprotected Calendar workout.
- `targetDate` must be today or later, later than `anchorDate`, and the same weekday. The delta is
  positive and exactly `7 * n` days for integer `n >= 1`; zero, negative, malformed, and
  different-weekday inputs fail before preview.
- The authoritative scope is every runner Calendar row whose source date is on or after
  `anchorDate`, through the latest row present in the server snapshot. This is deterministic,
  origin-neutral, and makes the selected anchor the explicit boundary. A user-selected subset or
  source-plan grouping is a different product contract and is not admitted here.
- A **candidate** is each non-Rest row in that tail with none of the protected relations above.
  Its identity and every content/provenance field remain byte-equivalent; only `workout_date`
  changes by the exact delta and `weekday` is server-derived to the same weekday. Legacy
  `week_number` is not recomputed because it is not Calendar schedule authority.
- A **fixed/protected row** is any non-Rest tail row with a log, asset, metrics, comparison, insight,
  or runner-activity match. It remains at the same ID/date. FIT-backed rows are never moved,
  replaced, deleted, or hidden.
- A persisted Rest row is an **exclusion**, because Rest is not a workout. Rows before the anchor
  are outside scope. Neither class is deleted as a side effect.
- Candidate-to-candidate destination occupancy is an internal translation, not a collision. Any
  candidate destination occupied by a fixed row, Rest row, or other non-candidate is a blocking
  collision. The rebase does not reuse single-Move replacement semantics and never clears an
  occupant to succeed.

This tail rule is the minimum complete answer to “move the current sequence from this anchor.” It
avoids a hidden plan container and lets the preview make every affected row explicit before the
runner accepts the operation.

### Review, confirm, audit, and Undo contract

**Preview** is a read-only server result containing the anchor/target, delta days/weeks, scope end,
sorted candidate before/after dates, fixed rows with factual protection reasons, Rest/out-of-scope
exclusions, all destination occupancy, collisions, and `confirmable`. The exactness payload binds
the runner, current Calendar date, complete sorted row fingerprints, protection classification,
destinations, and collisions. Cancel writes no event and changes no row.

**Confirm** accepts identifiers plus the review checksum/token only. It reruns the same server
resolver, then calls one narrow service-role RPC. That RPC must:

1. take the existing per-runner transaction advisory lock and lock/re-read the complete affected
   workout/evidence snapshot;
2. reject a stale row, new/removed protection relation, new/removed scope row, changed target
   occupancy, invalid delta, or blocking collision before any write;
3. update positive-delta candidates in descending source-date order so the existing immediate
   runner/date uniqueness constraint is preserved without temporary dates or a replacement model;
4. insert one `user_moved_workout` event per moved row with full before/after images, one shared
   rebase operation UUID, review/mutation checksum, and server-time expiry; and
5. return the authoritative moved rows, operation ID, counts, and expiry. Any failure rolls back all
   row and event writes.

The existing event relation is sufficient: the shared operation UUID may live in its extensible
`event_payload`, while `planned_workout_id` and `undo_of_event_id` keep row-level audit identity.
No new table, workout entity, active container, or event ledger is justified. A new batch RPC is
required because the existing single-row RPC signature and single-row Undo cannot safely express
the invariant.

**Undo** is admitted and reuses the existing 45-second server-time window. One request names the
rebase operation, not individual reverse moves. Under the same runner lock, it verifies that every
original event is latest and un-undone, every current row equals its recorded after-image, every
source date is available, and all original event IDs belong to the same checksum/runner. It restores
all rows in ascending current-date order, inserts one paired event per row with
`undo_of_event_id`, and succeeds exactly once. Any mismatch or expiry is a durable no-op. The client
stores only the operation ID/expiry affordance and reloads authoritative Calendar truth; it never
reconstructs rows.

### Exact implementation sequence

1. **BACKEND — first implementation owner.** Append one fail-closed migration that adds the narrow
   rebase confirm/Undo RPCs, reuses `calendar_workout_mutation_events`, and serializes the canonical
   log/evidence/match roots with the existing runner mutation lock. Reuse the Calendar context,
   review-exactness, mutation-event builder, and low-level persistence transport; add the
   origin-neutral preview/confirm server contract and regenerate database types. Extend the existing
   manual-workout/Calendar validation entry point with database cases. Do not modify UI, create a
   plan scope, or change individual Move behavior.
2. **FRONTEND (Product lane).** Add one Calendar entry point for selecting the anchor and same-weekday
   target, render the Backend-shaped preview with candidates/fixed/collisions/exclusions, require
   explicit confirm, and expose the operation-level Undo across reload. Reuse current Calendar and
   dialog primitives; no Design System change is demonstrated.
3. **QA.** Independently replay the matrix below against isolated disposable runners, including a
   race injected between preview and confirm. Global QA and release remain separate gates.

PRODUCT remains the sole dispatcher. No Product decision blocks the recommended contract. A request
to move only a hand-picked subset instead of the tail must return to PRODUCT because it changes the
selection contract.

### Risk-derived acceptance matrix

| Check              | Required scenario                                                                                                           | Acceptance                                                                                               |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Input              | Same weekday `+1` and `+2` weeks; malformed, zero, negative, and different weekday                                          | Valid offsets preview exactly; all invalid inputs write nothing                                          |
| Selection          | Mixed manual/AI/import rows before, at, and after anchor                                                                    | Every unprotected non-Rest tail row appears once; origin never changes eligibility                       |
| Spacing            | Sparse and multiweek candidate tail                                                                                         | Every candidate moves by identical delta; weekday, order, identity, content, and provenance remain exact |
| FIT/history        | Uploaded, failed-parse, and parsed FIT/ZIP; completed/partial/skipped logs; metrics/comparison/insight/match-only sentinels | Each is fixed at the same ID/date and appears with a factual protection reason                           |
| Rest/outside scope | Persisted Rest in tail and rows before anchor                                                                               | Reported as exclusions and never deleted or moved                                                        |
| Occupancy          | Candidate chain, empty destination, protected destination, and Rest/non-candidate destination                               | Internal chain succeeds; every external occupancy is a blocking preview collision                        |
| Review race        | Add/remove/change a row, log, asset, match, or occupancy after preview                                                      | Confirm returns stale/protected conflict; zero rows and zero events change                               |
| Atomicity          | Inject failure after first planned update/event                                                                             | Transaction leaves the complete pre-rebase row/event set intact                                          |
| Undo               | Confirm, reload, undo once; repeat, expire, mutate one row, or occupy one source date                                       | Exact batch restores once; every stale/expired case is a no-op                                           |
| Isolation          | Two runners with overlapping dates/IDs attempted through wrong identity                                                     | Only authenticated runner rows are read/mutated; cross-user input fails closed                           |
| Regression         | Individual empty-target Move, occupied Move, stored-Rest Undo, Copy, Clear, Edit, FIT ingestion/removal                     | Existing operation-level contracts and proof suites remain unchanged                                     |

### Rollback and residual boundary

- Before any accepted rebase exists, the feature can be rolled back by withdrawing its UI/server
  entry points and revoking the new RPCs in a forward migration; existing single-Move behavior and
  event history remain intact.
- After an accepted event exists, rollback must retain its row events and Undo interpretation and
  fix forward. It must not delete audit evidence, restore plan authority, or rebuild workouts from a
  source plan.
- This discovery did not implement or validate the RPC, migration, UI, fixtures, browser flow,
  hosted parity, release, or deployment. Those remain with the serial owners above.

## Stage

ARCHITECT discovery completed — contract and first implementation boundary established; no
implementation started.

## Next Recommended Role

BACKEND, after PRODUCT dispatches one bounded implementation item for the contract above.

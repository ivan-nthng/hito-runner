# Planned Workout FIT Completion Lifecycle

## Work Item ID

2026-08-05-planned-workout-fit-completion-lifecycle

## Status

completed

## Type

defect

## Priority

high

## Owner

backend

## Scope

planned-workout-result-projection

## Stage

Backend implementation, release integration, and production verification

## Related Records

- [Runner Activity Intelligence Foundation](./2026-07-30-runner-activity-intelligence-foundation-architecture.md)
- [Runner Activity Backend Simplification And Metric Scalability](./2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md)
- [Hito Stack Complexity Reduction Program](./2026-08-04-hito-stack-complexity-reduction-program.md)

## Demonstrated Root Cause

The persisted training snapshot projects a planned-workout status from `workout_logs` and the calendar
date only. The same snapshot already reads the canonical persisted Garmin feedback marker, but that
evidence is not part of completion projection. A past planned workout can therefore have a complete
matched FIT projection and still read as `skipped` when no manual workout log exists.

Independent lifecycle and security review found that the feedback marker alone is not a sufficient
replacement discriminator. Completion must verify one exact current running chain: parsed asset,
current source and activity revision, unique planned-workout match, unique active actual metrics, and
its canonical comparison. The existing projection also returns early without refreshing match source
revision provenance, can mark an already parsed reused asset failed after a retry fault, and leaves
`workout_logs` directly mutable through the authenticated Data API. Those paths can bypass or hide the
same canonical completion truth and therefore belong to this first-owner correction.

## Accepted Contract

- A complete matched FIT projection is the canonical objective completion fact and reads as
  `completed` by default.
- An explicit runner-authored `partial` result remains an allowed correction for a partly completed
  planned workout.
- A FIT-backed workout never reads as `skipped`; a contradictory saved legacy skipped log is retained
  as historical subjective input but does not control the runner-facing completion projection.
- FIT-derived distance, duration, and interval facts replace manual objective fields in the read
  model. Notes, body notes, and RPE remain runner-authored evidence.
- A past workout without FIT and without a saved manual result reads as the non-persisted default
  `skipped`. Manual completed, partial, and skipped paths remain available when FIT evidence is absent.
- Raw-source removal preserves normalized activity facts and therefore preserves completion. Deleting
  the canonical activity removes that FIT completion evidence through the existing activity lifecycle.
- Feedback remains available only through the existing persisted actual-metrics/comparison boundary.
- Missing, non-running, stale-revision, orphaned, ambiguous, failed, or incomplete evidence does not
  establish FIT completion.
- Exact-source retries preserve a previously complete projection if a later reconciliation attempt
  fails, and a reimported source revision refreshes match provenance.
- Authenticated clients cannot bypass the canonical workout-log save boundary or create multiple
  current planned-workout projections.

## Canonical Owner

The existing planned-workout read projection and workout-log save boundary reuse the canonical
Runner Activity source/revision, planned-workout match, actual-metrics, and comparison owners. No new
completion table, activity model, compatibility branch, or Product-side status rule is admitted.

## Required Proof

- Past no-FIT workout: computed skipped state with no inserted workout log.
- Manual no-FIT completed, partial, and skipped results: exact persisted/readback behavior.
- Complete FIT upload: completed snapshot/readback plus feedback.
- Late FIT upload over computed or saved skipped: completed readback without loss of notes/body notes.
- Explicit partial with FIT: partial readback while FIT objective facts remain authoritative.
- FIT retry, raw-source removal, plan replacement/carry-forward, and activity deletion: truthful
  completion transitions through existing lifecycle owners.
- Manual objective fields do not override FIT distance, duration, or intervals; RPE remains attributable.
- Non-running/incomplete/stale projection negatives, unique match/active-metrics enforcement, direct
  Data API mutation denial, exact-retry fault preservation, and source-revision provenance refresh.
- Privacy/RLS, unplanned intake, Gate 1-4, comparison, build/integrity, loopback runtime, and cleanup.

## Completion Receipt

Completed on 2026-08-05.

- The persisted training read model now derives FIT completion only from one exact current running
  chain. A broad feedback marker can no longer turn non-running or incomplete evidence into a
  completed workout.
- Planned projection finalization now atomically reconciles the current match, active metrics,
  comparison, and parsed asset. Database uniqueness rejects duplicate current match or metrics
  truth, while exact retries preserve an already valid projection and repair incomplete work.
- FIT completion overrides a saved or inferred skipped state, preserves an explicit runner-authored
  partial correction, hides manual objective fields, and retains notes, body notes, and RPE.
- Past no-FIT workouts remain computed skipped without a write. Manual no-FIT completed, partial,
  and skipped outcomes remain available through the canonical server action.
- Authenticated Data API writes to `workout_logs` are closed; the service-owned save boundary and
  the two new `SECURITY INVOKER` RPCs retain least-privilege access.
- Local clean migration, Gate 1-4 lifecycle, Plan vs Run, replacement carry-forward, exact-retry
  fault matrix, privacy/RLS, provider isolation, cleanup, build/integrity, built-runtime, and release
  suites passed. Independent architecture, QA, and security findings were integrated before final
  validation.
- Hosted Supabase target `dltfjwexyctmihclcjqj` is at repository migration parity (34/34), with no
  duplicate current projection groups and one existing strict FIT-completed match proven through
  aggregate readback without runner-data mutation.

Implementation DoD: Passed. Global QA Acceptance: Pending.

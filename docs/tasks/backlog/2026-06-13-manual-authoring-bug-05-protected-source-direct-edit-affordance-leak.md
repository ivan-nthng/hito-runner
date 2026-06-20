# Bug 05: Protected Source Workout Still Exposes Direct Edit Affordances

## Status

closed

## Type

bug

## Priority

high

## Next Recommended Role

product

## Task

Preserve closure of the protected-source direct-edit affordance leak and keep minor aria-label
follow-up work separate.

## Stage

PRODUCT closeout / QA-passed protected-source affordance gating.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Preserve Bug 05 as closed and keep the move-target aria-label mismatch, if pursued, as a separate
non-blocking follow-up rather than reopening protected-source affordance gating.

Stage:
PRODUCT closure guard / regression-only reopen.

Context:
QA passed this bug on 2026-06-15. Protected/logged/skipped/evidence-backed rows no longer expose
dead-end direct Copy/Move/drag affordances, while eligible future and accepted recent
missed-unlogged manual rows still expose the correct direct-edit paths. A small move-target
aria-label mismatch was observed, but it does not reopen this gating contract.
```

## Severity

high

## Owner

PRODUCT

## Reported

2026-06-13

## User Report

The user tried to use direct manual calendar editing, but the interaction failed instead of
completing:

- drag-and-drop in the calendar feels broken
- paste/insert did not succeed
- the UI ended up showing a bounded blocked state:
  `This source workout has protected history or evidence and cannot be copied here.`

## Evidence

- Screenshot:
  [paste-blocked-protected-source.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-13-manual-authoring-bug-05-protected-source-direct-edit-affordance-leak/paste-blocked-protected-source.png)

## Observed Behavior

- A manual workout day can still be treated like a direct-edit source in the calendar.
- Only after the runner starts the interaction does backend block it as protected/evidence-backed.
- The backend message is bounded and truthful, but the runner should not be led into a dead-end
  direct manipulation gesture for a source row that is not actually eligible.

## Expected Behavior

- Protected, logged, or evidence-backed source workouts should not expose direct copy/move
  affordances in the same way as eligible editable sources.
- If Product intentionally keeps the affordance visible, the ineligible state must be obvious before
  the runner starts dragging or pasting.
- Eligible manual sources should continue to support direct copy/paste and direct move.

## Source Investigation

- The blocked copy message is already canonicalized in
  [copy-paste-reconstruction.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/copy-paste-reconstruction.ts).
- Direct manual mutation seams already exist in:
  [copy-paste.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/copy-paste.ts)
  and
  [move-workout.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/move-workout.ts).
- Runner-facing source actions and drag entry points live in:
  [Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx),
  [ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx),
  and
  [ManualWorkoutMoveControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutMoveControls.tsx).
- This points to a source-capability mismatch more than a raw backend crash: backend is already
  blocking truthfully, but the runner-facing affordance boundary is not aligned.

## Likely Root Cause

The direct manual edit contract is backend-safe at mutation time, but source-row eligibility is not
yet exposed or consumed as one canonical capability contract before the runner starts copy/move.

## Architecture Contract — 2026-06-15

Direct source affordances must be driven by row-level source capability truth, not by plan-level
editability alone and not by local `status === "skipped"` guesses.

The canonical distinction is:

- persisted skipped/completed/partial result means logged history and is protected
- provider evidence, comparison-backed state, AI-insight/recommendation-backed state, unsafe metric
  truth, unreadable legacy metadata, or unsupported source shape means protected/unsupported
- auto-inferred missed status with no log, no provider evidence, no protected history, no unsafe
  metric truth, and supported source shape may be eligible only for the accepted missed-unlogged
  move-to-today path

Eligible source states:

- direct copy: future, non-rest, supported manual source row with no log, no provider evidence, no
  protected history, no unsafe metric truth, and reconstructable manual source metadata
- direct move: future eligible source row, plus the accepted recent missed-unlogged manual source
  when moving to today
- direct drag initiation: same as direct move source eligibility; a protected/logged/evidence-backed
  row must not be draggable

Ineligible source states:

- persisted skipped log
- completed or partial log
- provider-evidence-backed row
- comparison-backed row
- AI-insight/recommendation-protected row
- protected active-plan lifecycle state
- unsupported source kind or unsupported/manual-unreadable source metadata
- unsafe metric truth
- rest row unless a separate rest-specific lifecycle is accepted later
- past/today source rows except the bounded missed-unlogged move-to-today source case

Affordance behavior:

- Ineligible source rows must not start drag. No `draggable`, no grab cursor, no move source
  selection, and no dataTransfer payload.
- Direct `Copy workout` and `Move workout` actions should be hidden by default for ineligible rows.
- If a menu remains visible for other reasons, ineligible copy/move may be shown only as disabled
  with a clear pre-interaction explanation such as `Logged or evidence-backed workouts cannot be
  moved or copied.`
- The runner should not discover source ineligibility only after drop/paste.
- Backend blocked responses must remain unchanged as the authoritative safety net.

Recommended row-level readback shape:

```text
sourceEditing: {
  canDirectCopy: boolean;
  canDirectMove: boolean;
  canDragInitiate: boolean;
  eligibility: "eligible_future_unlogged" | "eligible_missed_unlogged_recent" | "blocked";
  reason: "logged_workout" | "skipped_logged_workout" | "evidence_backed_workout" |
    "comparison_backed_workout" | "protected_history" | "unsafe_metric_truth" |
    "unsupported_source_metadata" | "unsupported_source_workout" | "rest_day" |
    "past_not_missed_unlogged" | "missed_window_expired" | "unsupported_active_plan_source" | null;
  message: string | null;
}
```

The exact shape may differ if Backend finds an existing readback model that fits better, but it must
be explicit enough for Frontend to render row affordances without reimplementing protection policy.

## Recommended Fix Direction

- Decide one canonical owner for source-row eligibility:
  - reuse existing backend editability/capability metadata if it already contains enough truth, or
  - extend the backend policy seam with explicit source-row copy/move/drag eligibility metadata,
    then render from that metadata instead of local guessing.
- Do not solve this with route-local booleans or a purely cosmetic toast change.
- Keep the backend blocked state truthful even after affordance gating is improved.

## Closeout Note — 2026-06-15

Closed. QA proved that protected/logged/skipped/evidence-backed rows no longer expose dead-end
direct source affordances, while eligible future rows and the accepted recent missed-unlogged
move-to-today path still work. A move-target aria-label mismatch remains a separate small
accessibility follow-up only.

## What Not To Touch

- universal Copy/Paste for generated/preset/imported plans
- workout constructor structure editing
- manual setup onboarding flow
- rest-day lifecycle proof

## Validation Expectations

- a protected/evidence-backed manual source row should not present the same direct copy/move
  affordance as an eligible row, or should be visibly disabled/explained before interaction starts
- an eligible manual source row should still support successful direct copy/paste and direct move
- no raw JS errors should appear
- backend protected-state truth must remain intact

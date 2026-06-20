# Bug 10: Direct Move Shows Success Toast Before The Calendar Visually Reconciles

## Status

backlog

## Type

bug

## Priority

high

## Next Recommended Role

frontend

## Task

Remove the visible post-success move lag so the workout appears moved in the calendar immediately
after a successful direct move.

## Stage

FRONTEND implementation / direct move optimistic visual reconciliation.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Eliminate the visible post-success lag in direct manual move so the calendar visually reflects the
moved workout immediately after success, while backend persistence and reconciliation continue under
the canonical move lifecycle.

Stage:
FRONTEND implementation / direct move optimistic visual reconciliation.

Context:
The runner currently sees a success/loading toast and then waits for the day to physically move
later. Product wants the move to feel immediate in the UI once the backend has accepted the direct
move, without exposing a confusing stale calendar state. Reuse the existing move state and
backend-shaped mutation result path; do not create a parallel local schedule owner.
```

## Severity

high

## Owner

FRONTEND

## Reported

2026-06-15

## User Report

After a move succeeds, the UI shows a success/loading toast first, but the calendar visually updates
later with a noticeable lag. The runner should see the workout appear moved immediately instead of
watching the stale day layout linger.

## Evidence

- Chat report from 2026-06-15:
  success toast appears first, and the physical calendar move shows up later with visible lag.

## Observed Behavior

- Backend accepts the move.
- Toast/status feedback appears.
- The calendar view continues to show the old placement briefly before it visually reconciles.

## Expected Behavior

- Once the direct move succeeds, the calendar should visually reflect the moved workout immediately.
- Backend persistence, refresh, and reconciliation may still continue under the hood, but the runner
  should not see a stale old placement after a successful move.
- If reconciliation fails after optimistic display, the UI must still return to canonical backend
  truth cleanly.

## Source Investigation

- Direct move UI state is owned by
  [Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx)
  and
  [ManualWorkoutMoveControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutMoveControls.tsx).
- The likely issue is not backend acceptance, but frontend timing between success state, route
  invalidation, and the visible calendar reconciliation.
- This should be solved through one bounded frontend visual-reconciliation strategy, not a separate
  local persistence model.

## Likely Root Cause

After success, the frontend still waits too visibly for route invalidation or snapshot refresh
before the calendar reflects the accepted move, so the runner sees success feedback and stale layout
at the same time.

## Recommended Fix Direction

- Use one bounded optimistic visual reconciliation path after backend success.
- Keep backend as the source of truth.
- Ensure rollback or refresh still lands on canonical persisted truth if the next fetch disagrees.
- Do not broaden this into general optimistic local schedule ownership.

## What Not To Touch

- backend move semantics
- copy/paste semantics
- shell label cleanup
- delete/clear presentation

## Validation Expectations

- after successful direct move, the calendar visually reflects the move immediately
- stale old placement is not left onscreen after success
- eventual refresh still reconciles to backend truth
- failed/blocked move paths do not fake success

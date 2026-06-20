# Bug 09: Missed-Unlogged Move-To-Today Contract Is Still Not Exposed In The Calendar UI

## Status

backlog

## Type

bug

## Priority

urgent

## Next Recommended Role

frontend

## Task

Expose the accepted missed-unlogged move target contract in calendar drag/drop and menu move UI.

## Stage

FRONTEND implementation / missed-unlogged move target exposure.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Expose the accepted missed-unlogged manual move contract in the calendar UI so an eligible missed
workout from yesterday or the recent missed window can actually be moved to today or to a valid
future empty day.

Stage:
FRONTEND implementation / missed-unlogged move target exposure.

Context:
Backend owns the accepted missed-unlogged move contract for `manual_user_built_plan_v1`: a bounded
recent missed-unlogged source may target today or a valid future empty day. If the runner still
cannot drag or move a missed unlogged workout onto a backend-allowed target, the remaining issue is
frontend target exposure/gating rather than local schedule truth. Reuse the existing calendar move
state, move controls, and backend-shaped result handling; do not reintroduce local schedule truth or
a parallel move lifecycle.
```

## Severity

blocker

## Owner

FRONTEND

## Reported

2026-06-15

## User Report

Even after the accepted backend move contract, the runner still cannot drag-and-drop a missed past
workout onto today.

Product expectation remains:

- if the workout was missed
- if it is fully unlogged and unprotected
- it should be movable from yesterday, or the accepted missed window, to today or to a valid future
  empty day

## Evidence

- Chat report from 2026-06-15 after the backend move-to-today contract was implemented:
  the runner still cannot drag-and-drop a missed past workout onto today.

## Observed Behavior

- The backend contract allows the missed-unlogged move target case.
- Runner-facing calendar interaction still does not expose or complete that move in the UI.
- This makes the product feel broken even though the canonical backend rule now exists.

## Expected Behavior

- When the source workout is inside the accepted missed-unlogged window and otherwise eligible,
  today and valid future empty days should be visible valid move targets in drag/drop and menu move
  flows.
- Ineligible sources should still remain blocked.
- Frontend should render the real backend contract, not the older future-only target assumption.

## Source Investigation

- The accepted contract now lives in
  [2026-06-09-manual-workout-authoring-and-user-built-plans.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md)
  and
  [2026-06-11-unified-plan-creation-lifecycle.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md).
- Remaining runner-facing gating is likely in:
  [Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx)
  and
  [ManualWorkoutMoveControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutMoveControls.tsx).
- Root cause is no longer the backend resolver. It is frontend gating or calendar target-state
  logic still assuming future-only move targets.

## Likely Root Cause

Frontend move-target exposure still follows the older future-empty-day rule and has not yet been
updated to the accepted missed-unlogged move backend contract.

## Recommended Fix Direction

- Update the canonical calendar move-target exposure logic to reflect the accepted backend contract.
- Keep drag/drop and menu move aligned.
- Keep ineligible sources and occupied/protected targets blocked.
- Do not invent optimistic local move truth beyond normal bounded UI feedback.

## What Not To Touch

- backend move semantics already accepted and implemented
- copy/paste contract
- constructor/template bugs
- clear/delete toast-only behavior

## Validation Expectations

- an eligible missed-unlogged source workout can visibly target today and valid future empty days
- drag/drop and menu move expose the same allowed today target
- ineligible/logged/evidence/protected sources still do not expose today as valid
- no regression to future-empty-day move behavior

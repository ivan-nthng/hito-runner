# Bug 07: Clear Blocked Should Use Top Toast, Not A Blocking Dialog

## Status

backlog

## Type

bug

## Priority

high

## Next Recommended Role

frontend

## Task

Replace the runner-facing `Clear blocked` modal with a top toast in the saved manual calendar clear
flow.

## Stage

FRONTEND implementation / clear-blocked feedback simplification.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Simplify the saved manual calendar clear failure UX so blocked clear attempts show only a top toast,
not a blocking `Clear blocked` dialog.

Stage:
FRONTEND implementation / clear-blocked feedback simplification.

Context:
Product direction changed here: when a runner tries to delete/clear a workout and backend blocks the
action, Hito should not open another blocking modal. Keep backend truth and blocked reason handling,
but surface the failure as the existing top toast pattern only.
```

## Severity

high

## Owner

FRONTEND

## Reported

2026-06-13

## User Report

When deleting a workout, the runner should not get another `Clear blocked` modal. The blocked
result should be surfaced as a top toast only.

## Evidence

- Chat product-direction override from 2026-06-13:
  blocked clear should not open a new modal; use the top toast only.

## Observed Behavior

- The clear flow still contains a runner-facing `Clear blocked` dialog path.
- This adds a second heavy interruption on top of an already failed action.

## Expected Behavior

- If backend blocks clear/delete, Hito shows a top toast only.
- No separate `Clear blocked` modal should open for that blocked state.
- Successful clear and any required happy-path review/confirm behavior can remain separate unless
  product changes that contract too.

## Source Investigation

- Runner-facing clear/delete state lives in
  [ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx).
- The file already contains both:
  - toast handling via `MANUAL_DELETE_CLEAR_TOAST_ID`
  - a dialog titled `Clear blocked`
- This points to a frontend interaction/presentation decision, not a backend delete-clear truth
  problem.

## Likely Root Cause

The clear flow still treats blocked delete results as a dialog-level lifecycle instead of reusing
the lighter toast feedback contract the user now wants.

## Recommended Fix Direction

- Keep backend blocked reason truth intact.
- Reuse the existing top toast feedback path for blocked clear outcomes.
- Remove or bypass the runner-facing `Clear blocked` dialog in this blocked branch.
- Do not broaden this slice into changing success-path clear review/confirm unless product selects
  that separately.

## What Not To Touch

- backend delete-clear validation or persistence semantics
- manual copy/paste and move direct-mutation flows
- constructor or template submenu issues
- universal active-plan delete/clear contract beyond this runner-facing blocked-state presentation

## Validation Expectations

- blocked clear attempt results in a top toast only
- no `Clear blocked` modal appears
- successful clear behavior does not regress
- backend blocked reasons remain truthful and visible in the toast copy

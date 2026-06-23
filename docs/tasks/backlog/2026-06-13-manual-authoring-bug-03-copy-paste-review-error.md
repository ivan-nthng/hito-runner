# Bug 03: Copy/Paste Review Raw Error Leak

## Status

in_progress

## Type

bug

## Priority

high

## Next Recommended Role

qa

## Task

Validate the manual workout copy/paste review lifecycle fix on a disposable manual active-plan
fixture.

## Stage

QA validation / copy-paste review fix.

## Exact Handoff Prompt

```text
ROLE: QA

Task:
Validate the manual workout copy/paste review lifecycle fix on a disposable manual active-plan
fixture.

Stage:
QA validation / copy-paste review fix.

Context:
Frontend claims raw `reading 'ok'` paste-review failures are now normalized into bounded reviewed or
blocked states. Prove the browser flow and DB boundaries on a disposable manual-plan fixture.
```

## Severity

high

## Owner

QA

## Reported

2026-06-13

## User Report

The runner copied a workout and then could not paste it. The UI showed:

- `Paste review failed`
- `Cannot read properties of undefined (reading 'ok')`

## Evidence

- Screenshot:
  [paste-review-failed.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-13-manual-authoring-bug-03-copy-paste-review-error/paste-review-failed.png)
- Recent frontend report says a guarded result-handling fix was implemented in
  `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx` and is awaiting QA proof.

## Observed Behavior

Paste review crashed into raw runner-facing JS error text instead of reaching a bounded reviewed or
blocked state.

## Expected Behavior

Paste review should:

- reach reviewed state and wait for confirm
- or reach bounded blocked/rejected state
- never leak raw JS error text into runner UI

## Source Investigation

- Paste review lifecycle is owned mainly by
  `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`.
- Backend seam exists in `src/lib/manual-workout-authoring/copy-paste.ts`.
- Recent frontend report says the likely first incorrect owner was frontend result handling that
  read `result.ok` without guarding malformed or missing responses.

## Likely Root Cause

Frontend async result handling assumed a shaped response and leaked raw error state into runner UI.

## Recommended Fix Direction

Treat this item as QA-ready unless QA proves the true failure is still present or the backend
response shape is wrong.

## What Not To Touch

- copy/paste persistence semantics
- backend authority over review/confirm
- unrelated move interaction bugs
- constructor template submenu work

## Validation Expectations

- copy an eligible manual workout
- paste into an eligible future day
- confirm there is no raw `reading 'ok'` leak
- confirm reviewed or bounded blocked state
- confirm no silent persistence before backend confirm

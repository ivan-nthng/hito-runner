# Bug 02: Calendar Move Drag UX And Move Review Raw Error Leak

## Status

ready

## Type

bug

## Severity

high

## Priority

now

## Owner

FRONTEND

## Reported

2026-06-13

## User Report

When moving a workout in the calendar:

- the drag interaction lights things up in an ugly browserish way
- the runner should feel like they are dragging a workout tile, not a link
- target days should light up clearly while hovering
- there should not be yellow/native-looking stripes
- move review also leaked a raw error instead of a bounded product state

## Evidence

- Screenshot:
  [move-review-broken-ui.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-13-manual-authoring-bug-02-calendar-move-drag-ux-and-review-error/move-review-broken-ui.png)

## Observed Behavior

- Move interaction does not feel like moving a workout tile.
- Native-looking highlight artifacts appear in the calendar.
- Runner-facing UI leaked `Cannot read properties of undefined (reading 'ok')`.

## Expected Behavior

- moving a workout should feel like dragging a workout tile/card
- valid target days should highlight clearly
- no browserish yellow/native drag artifacts
- blocked/review errors should stay bounded and runner-facing

## Source Investigation

- Move interaction and move review surface live in:
  - `src/components/Calendar.tsx`
  - `src/components/manual-workout/ManualWorkoutMoveControls.tsx`
  - `src/components/ui/hito-calendar-day.tsx`
- The error text strongly suggests frontend result handling or guarded-state failure in the move
  review lifecycle before assuming a backend mutation issue.

## Likely Root Cause

Frontend move interaction and move-review rendering are leaking native drag behavior and unguarded
error state into runner UI.

## Recommended Fix Direction

Fix the frontend move surface first:

- controlled drag visualization
- clear target-day highlighting
- bounded blocked/review UI

Only escalate to backend if the actual response shape or move contract is proven wrong.

## What Not To Touch

- backend schedule truth unless proven broken
- manual constructor UI
- copy/paste review path
- onboarding/manual setup lifecycle

## Validation Expectations

- no link-like drag behavior
- clear target-day highlight
- no raw `reading 'ok'` text in runner-facing move UI
- blocked states remain truthful

## Next Recommended Role

FRONTEND

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Fix manual workout move interaction so dragging looks like moving a workout tile, target days
highlight clearly, and raw move-review errors do not leak into runner-facing UI.

Stage:
FRONTEND implementation / move interaction and review-surface cleanup.

Context:
The move flow currently shows browserish drag artifacts and leaks raw `reading 'ok'` error text.
Fix the frontend move interaction and guarded review handling before assuming a backend contract
failure.
```

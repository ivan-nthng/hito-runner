# Bug 08: Missed Unlogged Workout Cannot Be Moved To Today

## Status

backlog

## Type

bug

## Priority

urgent

## Next Recommended Role

backend

## Task

Implement the accepted direct manual move contract so a missed unlogged workout can be moved from a
bounded recent past window, including yesterday, to today or to a valid future empty day.

## Stage

BACKEND implementation / missed-unlogged-workout move semantics.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement the missed-unlogged manual workout direct move contract so a runner can move an eligible
missed workout from a recent past day, including yesterday, to today or to a valid future empty day.

Stage:
BACKEND implementation / missed-unlogged-workout move semantics.

Context:
Product/Architecture accepted a contract change: manual direct move may move a fully unlogged
missed workout from the recent missed window to today or to a valid future empty day. The canonical
backend mutation policy must own this rule so frontend drag/drop/menu fixes do not invent local
schedule truth. Reuse the existing direct manual move seam, active-plan editability policy,
source-row protection checks, persisted workout reconstruction, and audit metadata before adding
anything new.

Scope:
- Apply this only to `manual_user_built_plan_v1` direct move in this slice.
- Allow target `today` or a future empty day only when the source workout date is from seven
  calendar days before today through yesterday.
- Keep normal future-empty-day move behavior.
- Keep target dates before today blocked.
- Keep source dates older than the missed window blocked.
- Require the source workout to be fully unlogged: no workout log, provider evidence,
  comparison-backed state, AI-insight/recommendation-backed state, protected history, unsafe metric
  truth, unreadable metadata, or unsupported source shape.
- Keep target occupancy strict: target must be empty; explicit Rest rows and any planned workout
  row are not replaceable in this slice.
- Make drag/drop and menu move share the same backend rule and result shape.

Validation:
- Run targeted ESLint for changed manual authoring and validator files.
- Run `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- Add deterministic coverage for yesterday-to-today success, target-today rejection when the source
  is not missed/unlogged, old missed source rejection, logged/evidence/protected source rejection,
  occupied or Rest target rejection, stale source/date rejection, non-manual active-plan rejection,
  client payload rejection, no fake pace, no fake personal HR, and audit metadata readback.
```

## Severity

blocker

## Owner

ARCHITECT

## Reported

2026-06-14

## User Report

The runner still cannot honestly use drag-and-drop move the way the product expects. Product
direction is explicit:

- if a workout was scheduled yesterday
- the runner did not run it
- the runner should be able to move it to today

The user is frustrated because drag-and-drop and move have already been "fixed" many times, but the
actual runner goal still does not work.

## Evidence

- Screenshot:
  [missed-workout-drag-state.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-14-manual-authoring-bug-08-missed-unlogged-workout-move-contract/missed-workout-drag-state.png)
- Product-direction override from chat on 2026-06-14:
  a missed unlogged workout from yesterday should be movable to today.

## Observed Behavior

- Drag-and-drop move still does not produce the expected runner outcome.
- The current product behaves as if move is only for future empty dates.
- Repeated UI fixes have not solved the core behavior because the allowed move window itself is too
  narrow for the desired runner workflow.

## Expected Behavior

- A missed workout from yesterday should be movable to today or to a valid future empty day if it
  has no logged result, provider evidence, comparison-backed state, or other protected history.
- Logged/evidence-backed/protected history should remain non-movable.
- Runner-facing move UX should match the real allowed contract instead of pretending a narrower
  rule is the final product.

## Source Investigation

- The accepted product brief now allows bounded recent missed-unlogged manual sources to move to
  today or to a valid future empty day in
  [2026-06-11-unified-plan-creation-lifecycle.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md).
- The active manual authoring plan records the same backend-owned direct move contract in
  [2026-06-09-manual-workout-authoring-and-user-built-plans.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md).
- That means the recurring runner-facing failure is not only a frontend bug. The backend move
  contract and source capability truth must allow the full missed-workout target set before UI
  target exposure can be considered correct.

## Likely Root Cause

The repeated drag/drop fixes are patching a visible symptom, but the canonical move contract still
blocks the missed-workout use case. Backend and frontend cannot fully satisfy the desired runner
behavior until Product/Architect explicitly changes same-day move semantics for unlogged manual
workouts.

## Recommended Fix Direction

## Architecture Decision — 2026-06-14

- Source date may be any date from seven calendar days before today through yesterday. This includes
  the explicit yesterday-to-today use case while keeping the missed-workout window bounded.
- Target date may be today or a future empty date inside the active plan.
- Target dates before today remain blocked.
- Target today is allowed only when the source workout is fully unlogged.
- Fully unlogged means no workout log, provider evidence, comparison-backed state,
  AI-insight/recommendation-backed state, protected history, unsafe metric truth, unreadable legacy
  metadata, or unsupported source shape.
- Rest-day occupancy is not replaceable in this slice. Explicit Rest rows and any planned workout
  row count as occupied targets.
- Drag/drop move and menu move must share exactly the same backend rule and result shape.
- The first implementation owner is BACKEND because the current backend move resolver blocks
  `targetDate <= currentDate`; frontend must not add a route-local exception.

## Recommended Fix Direction

- Update the existing backend direct manual move seam instead of patching drag/drop locally.
- Preserve hard blocking for logged, evidence-backed, comparison-backed, occupied-target, stale,
  non-manual, or otherwise protected cases.
- Route a small frontend follow-up only if current UI gating still hides today after backend exposes
  the accepted rule/result.

## What Not To Touch

- universal generated-plan move semantics
- copy/paste contract
- constructor/template bugs
- delete/clear toast-only presentation

## Validation Expectations

- yesterday -> today move succeeds for an eligible fully unlogged manual source workout
- target-today move is blocked when the source is not in the bounded missed-unlogged window
- protected/logged/evidence-backed workouts stay blocked
- occupied targets, including explicit Rest rows, stay blocked
- drag/drop and menu move share the same backend rule

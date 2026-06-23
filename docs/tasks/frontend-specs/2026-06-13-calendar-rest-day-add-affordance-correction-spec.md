# Hito Calendar Rest-Day Add Affordance Correction Spec

## Status

in_progress

## Type

frontend_spec

## Priority

high

## Next Recommended Role

frontend

## Task

Restore and normalize `Add activity` affordances on future editable calendar days so rest days remain editable and visually consistent with the Hito calendar day contract.

## Stage

DESIGN SYSTEM audit / product calendar correction spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Restore and normalize `Add activity` affordances on future editable calendar days so rest days
remain editable and visually consistent with the Hito calendar day contract.

Stage:
FRONTEND implementation / calendar rest-day add affordance correction.

Context:
This spec defines the source-of-truth correction for editable future rest/empty days. Preserve
backend editability and protected-history truth; do not change manual authoring persistence,
generated-plan behavior, or unrelated calendar actions.
```

## Owner

Design System

## Last Updated

2026-06-13

## Related Sources

- [docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)
- [docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md>)
- [docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md>)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:1)
- [src/components/ui/hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:1)
- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:694)
- [src/components/onboarding/ManualUserBuiltPlanPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/ManualUserBuiltPlanPanel.tsx:503)
- [docs/current-product.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md>)

## Problem Statement

The current calendar behavior has drifted into an inconsistent state:

- hover/add affordance does not appear on some future editable days
- `rest` days do not show `Add activity`, even though the product should allow changing an intentional rest day into a non-rest day
- visually, some days are treated as `rest`, some as `empty`, and the DS semantics are no longer clear to the user

The user requirement is explicit:

- all empty future editable days should read as rest days visually
- those days must still expose `Add activity`
- a future rest day must not be treated as locked just because it currently has `workout.type === "rest"`

## Current Implemented Root Cause

The main logic is in [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:915):

- `getManualAddContext(...)` returns `null` when `workout` exists
- this blocks the add affordance for any day already represented by a rest workout row

Current code:

- future add context appears only when the day has no `workout`
- `calendarBaseState(workout)` returns `"rest"` when `!workout`
- therefore visual semantics and editability semantics are split in a confusing way

In other words:

- empty/no-workout days are rendered as `rest`
- but only truly `undefined` workout days get `Add activity`
- persisted or explicit `rest` rows lose the same affordance

That mismatch is the root cause of the bug.

## Product Contract Drift

Current docs still describe Add as applying to eligible future empty days:

- [docs/current-product.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md>)
- [docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)

The new user requirement changes that contract slightly:

- future editable rest days must remain editable through the same Add activity entry point
- empty future editable days should visually read like rest days, not like a second unrelated day type

Frontend should implement the correction first, then update any affected docs if the final behavior changes from `empty-day only` to `editable rest-or-empty day`.

## Design System Decision

For runner-facing calendar semantics:

- non-workout future editable day = calm rest-day visual state
- editable future rest day = same calm rest-day visual state plus Add activity affordance
- Add activity is an editability affordance, not a separate calendar state family

This means:

- `rest` visual state and `editable` affordance must be allowed together
- the Add affordance must not require `state === "empty"` only

## Required Product Behavior

For eligible future editable days:

1. If the day is currently blank/unplanned, it should visually read as a rest day.
2. If the day is an explicit/persisted rest day, it should also visually read as a rest day.
3. In both cases, if the backend/product editability rules allow mutation, the day should expose `Add activity`.
4. Hover/focus should reveal the Add affordance consistently on desktop month/week cells.
5. Mobile row treatment should also keep the same editability affordance in a calm way.

## What Must Stay Unchanged

- past/today protection rules
- non-editable generated/protected day rules
- backend mutation ownership
- manual workout add/move/copy lifecycle
- real workout and feedback markers

This is not permission to make every rest day editable universally. It only applies where the existing product editability seam says the day is eligible.

## Exact Frontend Corrections

## 1. Fix editability owner logic

In [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:915), `getManualAddContext(...)` should stop treating all `workout` presence as non-editable.

Required change:

- differentiate between:
  - non-rest planned workout
  - explicit/persisted rest workout
  - no workout row
- allow Add context for eligible future rest-or-empty days

Preferred logic direction:

- block Add for non-rest planned workouts
- allow Add for no-workout or rest workout when the same plan/source/editability rules otherwise allow it

## 2. Keep one calm visual rest state

In [src/components/ui/hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:1):

- rest visual state should remain the calm background/state label family
- Add is an action overlay/hover affordance, not a separate base-state visual redesign

Do not reintroduce a loud `empty` day appearance just to make Add visible.

## 3. Ensure Add affordance can appear on rest visuals

The action slot on `HitoCalendarDayCell` and `HitoWorkoutDayRow` must be able to coexist with `state="rest"`.

That means:

- future editable rest day can render `state="rest"` plus `action={calendarAddAction()}`
- hover/focus behavior should still reveal the action

## 4. Align DS calendar specimen

`/hitoDS#calendar-workout-playground` should reflect the corrected product truth:

- rest visual state can coexist with Add affordance when the day is editable
- the specimen should not imply that only `empty` days can show Add

If the playground currently binds Add only to `empty`, Frontend should correct that specimen too.

## Current Code References

### Product calendar add affordance

- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:531)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:792)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:915)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:1022)

### Calendar primitive semantics

- [src/components/ui/hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:73)
- [src/components/ui/hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:350)
- [src/components/ui/hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:425)

### Existing Add menu content

- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:694)

### Existing no-plan/manual-builder demo calendar

- [src/components/onboarding/ManualUserBuiltPlanPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/ManualUserBuiltPlanPanel.tsx:503)

## Validation Requirements

- prove desktop month cell rest day shows Add on hover when eligible
- prove week-strip rest day shows Add on hover when eligible
- prove mobile row equivalent still exposes editability correctly
- prove non-rest planned workouts do not wrongly show Add
- prove protected/past/today days still stay blocked
- verify no regression in move-target state
- verify Add menu still offers `Start from scratch`, `Choose template`, and `Add rest day`
- if `/hitoDS` specimen is touched, inspect `/hitoDS#calendar-workout-playground`

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Restore and normalize `Add activity` affordances on future editable calendar days so rest days remain editable and visually consistent with the Hito calendar day contract.

Stage:
FRONTEND implementation / calendar add-affordance correction

Context:
- Source path: docs/tasks/frontend-specs/2026-06-13-calendar-rest-day-add-affordance-correction-spec.md
- Related DS/calendar spec: docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md
- Related active plan: docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
- User requirement: empty future editable days should visually read as rest days, and both blank and explicit rest days must expose `Add activity` when the calendar editability seam allows it.

Root cause and architecture fit:
- The visible symptom is that hover/Add disappeared on some days and rest days no longer expose Add.
- The deeper cause is split ownership between visual state and editability state:
  `calendarBaseState()` treats no-workout days as rest, while `getManualAddContext()` blocks Add whenever any workout row exists, including rest rows.
- Reuse the existing calendar editability seam, `HitoCalendarDayCell`, `HitoWorkoutDayRow`, and Add menu flow.
- Do not invent a new calendar state family or change backend mutation rules.
- Fix the canonical owner first: eligible future rest-or-empty day detection and its action mapping.

Required reading:
1. AGENTS.md
2. skills/hito-frontend-design-system/SKILL.md
3. docs/context.md
4. docs/glossary.md
5. docs/current-product.md
6. docs/current-system.md
7. docs/current-state.md
8. docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
9. docs/tasks/frontend-specs/2026-06-13-calendar-rest-day-add-affordance-correction-spec.md
10. src/components/Calendar.tsx
11. src/components/ui/hito-calendar-day.tsx
12. src/components/manual-workout/ManualWorkoutAuthoringControls.tsx
13. src/components/onboarding/ManualUserBuiltPlanPanel.tsx
14. src/components/hito-ds/calendar-workout-playground.tsx if specimen alignment is needed

Scope:
- `src/components/Calendar.tsx`
- `src/components/ui/hito-calendar-day.tsx` only if action/rest coexistence needs a small primitive adjustment
- `/hitoDS` calendar specimen only if needed to match the corrected product truth

Requirements:
- eligible future rest-or-empty days must expose `Add activity`
- those days should visually remain in the calm rest-day family
- non-rest planned workouts must not wrongly expose Add
- keep past/today/protected day blocks intact
- keep move-target behavior intact
- keep the existing Add menu options intact

Validation:
- git diff --check -- src/components/Calendar.tsx src/components/ui/hito-calendar-day.tsx src/components/hito-ds/calendar-workout-playground.tsx src/styles.css
- npm exec eslint -- src/components/Calendar.tsx src/components/ui/hito-calendar-day.tsx src/components/hito-ds/calendar-workout-playground.tsx
- inspect product calendar desktop month cell
- inspect product calendar week strip
- verify eligible future rest day hover/focus shows Add
- verify protected days still do not show Add

Output:
Use the project role output format.
```

## Blockers

No hard blockers.

The only important caution:

- if current docs still say `empty day only`, Frontend should not silently leave that drift behind; report the docs follow-up explicitly if the implemented behavior now becomes `editable future rest-or-empty day`.

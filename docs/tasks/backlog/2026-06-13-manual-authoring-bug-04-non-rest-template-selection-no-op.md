# Bug 04: Non-Rest Template Selection Closes Without Opening Constructor

## Status

closed

## Type

bug

## Severity

high

## Priority

now

## Owner

PRODUCT

## Reported

2026-06-13

## User Report

In the saved manual-plan calendar, choosing a non-rest template from `Add activity -> Choose
template` closes the submenu and does not open the constructor.

## Evidence

- QA rerun evidence from
  `/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-06-12/manual-workout-constructor-step-reorder-qa/`
- QA artifact names called out in the report:
  - `27-template-submenu-visible-dom.txt`
  - `31-easy-template-rect.json`
  - `32-after-pointer-template-click-dom.txt`
  - `33-template-submenu-issue.png`
- QA closeout on 2026-06-15 proved that `Easy aerobic run` and another non-rest template now open
  the constructor directly from the saved manual calendar, while `Add rest day` still works.

## Observed Behavior

Repro from QA:

1. saved manual calendar
2. `Add activity`
3. `Choose template`
4. select `Easy aerobic run`
5. submenu closes
6. constructor does not open

`Add rest day` still opens a constructor, so the regression appears specific to non-rest registry
template submenu selection.

## Expected Behavior

Selecting a non-rest template should open the constructor directly.

## Source Investigation

- This path lives in:
  - `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
  - `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`
  - `src/components/manual-workout/manual-workout-authoring-utils.ts`
- The failure likely sits in submenu event handling, constructor open-state wiring, or template
  selection callback flow after `Choose template` was converted into a submenu path.

## Likely Root Cause

Frontend submenu selection flow is closing/resetting state before the non-rest template constructor
open sequence completes.

## Recommended Fix Direction

Fix the submenu-to-constructor wiring without broadening into backend template taxonomy or unrelated
constructor redesign.

## Closeout Note — 2026-06-15

Closed. QA proved that non-rest template selection now opens the constructor directly and no longer
fails through a submenu-close no-op. Reopen only if a fresh browser regression shows that selecting
non-rest templates stops opening the constructor again.

## What Not To Touch

- backend template taxonomy
- copy/paste review bug
- move drag UX bug
- manual setup lifecycle

## Validation Expectations

- `Easy aerobic run` and another non-rest template should open constructor directly
- `Add rest day` should stay working
- accepted step-order honesty fix should not regress

## Next Recommended Role

product

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Preserve Bug 04 as closed unless a fresh browser regression shows that non-rest template selection
stops opening the constructor again.

Stage:
PRODUCT closure guard / regression-only reopen.

Context:
QA passed this bug on 2026-06-15: `Add activity -> Choose template -> Easy aerobic run` and another
non-rest template now open the constructor directly, and `Add rest day` still works. Do not reopen
this item for unrelated constructor, menu, or calendar issues.
```

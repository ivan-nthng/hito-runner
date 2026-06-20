# Bug 01: Saved-Calendar Template Flow And Constructor Grammar Cleanup

## Status

triaged

## Type

improvement

## Severity

medium

## Priority

next

## Owner

FRONTEND

## Reported

2026-06-13

## User Report

In the saved manual-plan calendar:

- the `Add activity` dropdown did not feel like Hito DS
- menu rows were too small
- `Choose template` should behave as a second-level choice
- the runner should choose the workout type/template family there and then go directly into the
  constructor
- the constructor should feel like a normal Hito page with inputs, spacing, and dividers, not a
  pile of cards and borders

## Evidence

- Screenshot:
  [choose-template-flow.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-13-manual-authoring-bug-01-template-flow-and-constructor-grammar/choose-template-flow.png)

## Observed Behavior

The saved-calendar add flow felt too generic and card-heavy:

- tiny dropdown/menu rows
- unclear template hop
- constructor visual grammar felt boxed and non-Hito

## Expected Behavior

- calmer Hito DS menu sizing
- `Choose template` as a second-level selection
- direct jump into constructor after choosing the template family
- constructor with page-like spacing and dividers instead of heavy bordered cards

## Source Investigation

- Recent frontend work moved `Choose template` toward a submenu structure in
  `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`.
- Constructor visual grammar lives mainly in
  `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`.
- This report is broader than the later no-op regression in Bug 04; Bug 04 should stay separate as
  the specific broken capability.

## Likely Root Cause

Frontend interaction and visual grammar in the saved-calendar add flow drifted away from the calmer
Hito menu/page rhythm.

## Recommended Fix Direction

Keep the DS/menu/page cleanup bounded to the saved-calendar add flow and constructor surface. Do not
turn this into backend taxonomy or persistence work.

## What Not To Touch

- backend template taxonomy
- backend review/confirm semantics
- manual plan persistence
- unrelated move/copy-paste bugs

## Validation Expectations

- menu rows should be larger and clearer
- `Choose template` should feel like a second-level choice
- constructor should feel calmer and less card-heavy
- any follow-up regression should be captured separately, not folded back into this broad UI item

## Next Recommended Role

FRONTEND

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Clean up the saved-calendar `Add activity -> Choose template -> constructor` flow so it matches the
Hito DS and calmer page grammar.

Stage:
FRONTEND implementation / template-flow and constructor-grammar cleanup.

Context:
Saved manual-plan calendar add flow feels too generic and card-heavy. Improve menu row sizing,
second-level template choice, direct jump into constructor, and constructor visual rhythm without
changing backend review/confirm or template taxonomy.
```

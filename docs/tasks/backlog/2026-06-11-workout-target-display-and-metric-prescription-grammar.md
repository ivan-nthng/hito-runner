# Workout Target Display And Metric-Prescription Grammar Cleanup

## Status

completed

## Type

bug

## Priority

high

## Next Recommended Role

frontend

## Task

Record the completed workout target display and metric-prescription grammar cleanup as accepted
history.

## Stage

ARCHITECT acceptance closeout / completed workout target display cleanup.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Use this completed backlog item only as historical context if a future workout target display
regression appears.

Stage:
FRONTEND implementation / future bounded regression fix.

Context:
This item is completed and QA-passed. Current target display truth should come from current docs and
source, not from reopening this backlog item by inertia.
```

## Historical Outcome

This item fixed runner-facing workout target display grammar after saved-calendar and interval
surfaces exposed raw/internal prescription values. It is closed as a QA-passed display/source-of-
truth cleanup.

Original evidence is preserved in backlog assets under
`docs/tasks/backlog/assets/2026-06-11-workout-target-display-and-metric-prescription-grammar/`.

## Accepted Behavior

- Calendar/detail/interval surfaces must not show raw float durations or decimal-prime shorthand.
- Internal target labels such as `Target: Structure-only executable target` must not appear to the
  runner.
- Duration, distance, repeat, recovery, warmup, cooldown, and step grammar should be formatted
  through shared rendering helpers rather than route-local string assembly.
- Pace appears only when pace truth exists.
- Personal HR appears only when personal HR-zone truth exists.
- Editable/default HR guidance remains advisory and must not be presented as personal HR target
  truth.

## Validation Evidence

QA passed on 2026-06-11 with saved active-plan browser proof. The accepted proof verified:

- no raw `0.999...` duration or decimal-prime shorthand;
- no internal `Target:` label leak;
- fake pace did not appear;
- fake personal HR did not appear;
- mobile `375px` did not horizontally overflow;
- disposable auth/local data cleanup returned to zero.

Implementation validation also included targeted source checks, build/lint proof, and
`node --import tsx ./scripts/validate-manual-workout-authoring.ts`.

## What Not To Touch

- Do not weaken metric-truth guardrails.
- Do not add fake pace.
- Do not add fake personal HR.
- Do not make frontend invent schedule, metric, or prescription truth.
- Do not reopen this completed item unless a fresh regression is source- or QA-proved.

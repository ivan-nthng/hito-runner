# First-Plan Calendar Pre-Start Rendering Polish

## Status

completed

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Keep saved-mode calendar pre-start rendering polish as completed historical source context.

## Stage

ARCHITECT closeout / QA-passed historical spec

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Use the completed saved-mode calendar pre-start rendering spec as historical source context only.

STAGE:
ARCHITECT reference / completed pre-start spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- Archived plan: docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- QA evidence: docs/tasks/qa-reports/2026-05-30-long-horizon-first-plan-monthly-audit.md
- Final QA passed for the narrow pre-start rendering polish track on 2026-06-04.
- Generic Hito DS calendar/workout playground work remains separate:
  docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md

CONSTRAINTS:
- Treat this spec as completed source context.
- Do not reopen implementation from this spec unless a new concrete regression is found.
- Do not merge this narrow pre-start behavior with the generic DS calendar/workout playground.
- Do not change backend generation, persisted rows, row counts, review/confirm, workout sequencing, or fixed rest-day semantics from this completed spec.

OUTPUT:
1. Task
2. Stage
3. Historical evidence referenced
4. Current active owner, if any
5. Blockers
```

## Compression Note

Compressed conservatively during Slice D21 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. This file was treated as guarded because it preserves a concrete QA-passed behavior contract.

## Final Behavior Preserved

- Dates before the plan start render as outside-plan pre-start days.
- Pre-start days show no workout/rest semantics, links, tooltips, status markers, feedback markers,
  or completion affordances.
- The first actual plan day keeps normal workout/rest rendering and may show a compact `Plan starts`
  affordance.
- Mobile month list may collapse consecutive pre-start dates into a quiet `Before plan starts`
  range row.
- Rest-day semantics begin only once the plan has started.

## Scope Boundary Preserved

This was rendering polish only. It did not change backend generation, persisted rows, row counts,
review/confirm, workout sequencing, fixed rest-day semantics, or generic Hito DS calendar playground
ownership.

## Validation Evidence Preserved

Final QA passed for the narrow pre-start rendering polish track on 2026-06-04. The archived plan and
QA evidence remain linked in the handoff block above.

## Current Owner Links

- [Archived pre-start plan](../../plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Hito DS calendar playground spec](./2026-06-04-hito-ds-calendar-workout-playground-spec.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not reopen this completed spec unless a new concrete regression is found. Use current Calendar
source and current docs for any new behavior work.

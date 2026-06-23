# Plan Preset Library And Custom Authoring Escape Hatch

## Status

completed

## Type

change_request

## Priority

high

## Next Recommended Role

architect

## Task

Completed intake and implementation track for a backend-owned Plan Preset library with a custom
authoring escape hatch.

## Stage

ARCHITECT historical closeout / Plan Preset accepted boundary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this completed Plan Preset backlog item only as historical context if future source proof shows
Plan Preset discovery, selected-plan creation, or custom authoring boundaries have regressed.

Stage:
ARCHITECT source-of-truth guard / completed Plan Preset history.

Context:
This item is complete. Do not reopen old Plan Preset create/review/confirm behavior by inertia.
Current Plan Presets own card discovery only; selected running-plan preview/create owns generated
plan creation and persistence.
```

## Historical Outcome

This backlog item started the architecture track for a backend-owned first-plan preset library with
custom authoring as an explicit escape hatch. The accepted outcome is narrower than the original
exploration: Plan Presets became canonical card discovery, while selected running-plan preview and
confirm remained the generated-plan creation owner.

The completed implementation history and validation evidence are preserved in
`docs/plans/archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md` and
the compact product-history digest.

## Durable Decisions

- Presets must be backend-owned recipe/program truth, not route-local UI templates.
- Preset card discovery stays separate from first-plan mutation and selected running-plan create.
- Custom authoring remains an explicit escape path, not a hidden fallback inside preset discovery.
- Manual workout creation/editing was not shipped by this item and belongs to the canonical manual
  authoring plan.
- Presets must preserve metric-truth rules: no fake pace, no fake personal HR, and no target-time
  pace unless a canonical truth seam supports it.

## Preserved Boundaries

- Current Plan Preset card eligibility/card discovery lives in the current Plan Preset source.
- Generated selected-plan preview/create lives in the running-plan engine action flow.
- Old Plan Preset draft review/confirm actions are historical and must not be revived.
- Future manual editing of preset-generated workouts must go through canonical manual authoring and
  active-plan lifecycle contracts.

## Validation And Evidence

Accepted validation was captured in the archived plan closeout, source audits, validator runs, build
proof, and browser QA around Plan Preset card discovery and selected-plan creation. This compressed
backlog item intentionally keeps only the durable product/architecture contract and points to the
archive for detailed historical execution logs.

## What Not To Change

- Do not make Plan Presets the owner of active-plan persistence.
- Do not create route-local workout templates outside backend/model ownership.
- Do not mark manual workout creation/editing as completed because of this item.
- Do not store fake pace/HR precision in preset recipes.
- Do not use target time alone as pace truth.
- Do not bundle this historical item with future envelope/default switches.

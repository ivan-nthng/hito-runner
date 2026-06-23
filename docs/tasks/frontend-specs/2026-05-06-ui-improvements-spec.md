# Hito Running UI Improvements Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Keep the early UI improvements spec as historical refinement context; do not run it as a current implementation prompt.

## Stage

ARCHITECT reference / superseded UI refinement spec

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Use the early Hito Running UI improvements spec as historical refinement context only.

STAGE:
ARCHITECT reference / superseded UI refinement spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-06-ui-improvements-spec.md
- Much of this spec's durable intent has since been implemented, superseded, or split into more precise current specs/plans.
- Current implemented behavior lives in docs/current-product.md, docs/current-system.md, docs/current-state.md, changelog, and source.

CONSTRAINTS:
- Do not run the old broad FRONTEND implementation prompt from this file.
- Do not use this spec to reopen broad UI redesign, upload/import behavior, workout-detail behavior, or runner profile behavior without a new current source-of-truth decision.
- Preserve explicit review/confirm and backend-owned import truth for any future JSON/import work.

OUTPUT:
Use the project role output format.
```

## Compression Note

Compressed during Slice D22 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original file mixed early refinement goals, future import questions, implementation
handoff text, and broad UI direction. Current product truth now lives in current docs, changelog,
source, and more focused specs.

## Durable Intent Preserved

- Rest days should be visually calmer and should not pretend to be full workout days.
- Workout-detail surfaces should avoid stacked card clutter and favor grouped, scannable sections.
- Runner profile chrome should show truthful runner/plan context and keep secondary actions in the
  dropdown.
- Sign out should remain available, but not compete as duplicate top-level chrome.
- JSON/import flows should be lightweight and explicit, reusing backend/import truth rather than
  creating a parallel onboarding logic branch.
- Applying/replacing plan data requires clear confirmation; no silent mutation or fake connected
  state should be introduced.

## Current/Future Boundary

This spec is not the current implementation owner for:

- active-plan lifecycle or replacement semantics;
- manual workout authoring;
- advanced import/replacement behavior;
- workout-detail lifecycle IA;
- Hito DS rollout;
- runner profile product logic.

Use current docs and active specs for those surfaces instead of reviving this broad 2026-05-06
handoff.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Current state](../../current-state.md)
- [Changelog](../../history/changelog.md)
- [Product history digest](../../history/product-history-digest.md)
- [Active-plan lifecycle IA spec](./2026-06-20-active-plan-lifecycle-ia-and-actions-spec.md)
- [Workout detail lifecycle IA spec](./2026-06-15-workout-detail-lifecycle-ia-spec.md)

## Do Not Continue By Default

Do not treat this file as an active frontend implementation request. If a concept here becomes
important again, open a new bounded spec or route to the current canonical owner.

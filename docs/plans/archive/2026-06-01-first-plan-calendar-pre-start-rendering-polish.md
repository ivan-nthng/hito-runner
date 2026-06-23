# First-Plan Calendar Pre-Start Rendering Polish

## Status

archived

## Type

plan

## Priority

medium

## Next Recommended Role

architect

## Task

Archived: first-plan calendar pre-start rendering polish completed and QA-passed.

## Stage

ARCHITECT archived calendar pre-start polish reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived pre-start calendar polish plan as historical QA evidence only.

Stage:
ARCHITECT archived plan reference.

Context:
The narrow first-plan / active-plan pre-start rendering polish is complete. Generic calendar/workout playground work belongs to Hito DS or current frontend specs, not this archive.
```

## Archive Note

This file was compressed during D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The archive keeps final behavior, QA proof, and boundaries while removing obsolete prompt
detail.

## Final Outcome

Pre-start calendar cells before the plan start render as quiet date-only outside-plan cells. They
do not show workout/rest semantics, links, tooltips, status markers, or feedback markers. The start
date keeps normal workout/rest rendering and adds a compact `Plan starts` marker. Narrow month view
collapses consecutive pre-start dates into a quiet `Before plan starts` range row.

## Key Decisions Preserved

- The change was rendering polish only; it did not change backend generation, persistence, row
  counts, schedule semantics, or first-plan authoring.
- The broader calendar/workout state playground was split to Hito DS instead of being owned by this
  narrow archive.
- The behavior belongs to calendar rendering, not plan creation or DS specimen ownership.

## Validation Evidence Preserved

QA accepted the slice after source proof, targeted lint, build, desktop browser proof, mobile
`375px` overflow proof, semantic checks for pre-start cells, and screenshot artifacts. The shipped
history is also represented in [changelog](../../history/changelog.md).

## Current Owner Links

- [Current product](../../current-product.md)
- [Current functional map](../../current-functional-map.md)
- [Hito DS IA plan](../active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not reopen this plan for generic calendar state anatomy, Hito DS playground work, backend
generation, persistence, or first-plan authoring changes. Start from current docs/source if a new
calendar regression appears.

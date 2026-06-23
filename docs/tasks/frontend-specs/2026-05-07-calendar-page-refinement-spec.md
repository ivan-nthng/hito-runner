# Hito Running Calendar Page Refinement Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Advance Hito Running Calendar Page Refinement Spec.

## Stage

FRONTEND implementation spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Advance Hito Running Calendar Page Refinement Spec.

STAGE:
FRONTEND implementation spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-07-calendar-page-refinement-spec.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Compression Note

Compressed during Slice D21 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original spec described early saved-mode calendar refinement before later calendar,
manual authoring, DS, and active-plan work matured.

## Preserved Intent

The saved-mode home route was the effective calendar page. The goal was to preserve the strong main
workout card and calendar surface while reducing clutter, consolidating the right column, and
creating a future seam for training insight.

## Key Decisions Preserved

- Main workout card remains primary; supporting info should not compete with it.
- Right-column support should be grouped and calm rather than split into noisy mini-cards.
- Lower hero/clutter could be removed when it duplicated calendar/product state.
- Completed-day signals should coexist with planned/rest semantics without overloading day cells.
- Planning Note was a future insight seam, not live AI or silent plan adjustment.
- Calendar refinement must not redefine workout detail, auth, onboarding, or app shell ownership.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Current state](../../current-state.md)
- [Hito DS IA and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not implement from this old calendar spec directly. Use current Calendar source, current product
docs, manual authoring plans, and Hito DS contracts for any new calendar work.

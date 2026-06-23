# Hito DS Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Advance Hito DS Spec.

## Stage

FRONTEND implementation spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Advance Hito DS Spec.

STAGE:
FRONTEND implementation spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-06-hito-ds-spec.md
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
track. The original file contained a long early design-system inventory. Current Hito DS truth now
lives in source, `/hitoDS`, current docs, and the active Hito DS IA/specimen plan.

## Preserved Intent

This was the first internal Hito design-system definition. It aimed to turn the imported baseline
and early auth/onboarding/weekly-plan/workout flows into one calm, editorial, athletic, low-chrome
product language.

## Key Decisions Preserved

- Keep Hito DS small and product-shaped, not a generic enterprise component library.
- Prefer shared primitives, semantic typography roles, spacing rhythm, calm surfaces, and restrained
  state treatment over route-local styling.
- Normalize buttons, inputs, tabs, dropdowns, cards/surfaces, alerts, badges/status, calendar/day
  cells, navigation, modals/drawers, and empty/loading/error states through live primitives.
- Treat `/hitoDS` as the internal specimen/reference surface, but use current implementation as the
  source of truth for exact tokens and component APIs.
- Do not preserve old token tables, color lists, or component inventories as current authority.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Current state](../../current-state.md)
- [Hito DS IA and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not implement from this old spec directly. If Hito DS work resumes, start from live `/hitoDS`,
`src/styles.css`, shared primitives, current docs, and the active Hito DS IA plan.

# Admin Capture Backlog Page Design

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Implement the admin Backlog page design using existing Hito admin patterns.

## Stage

FRONTEND implementation

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Implement the admin Backlog page design using existing Hito admin patterns.

STAGE:
FRONTEND implementation

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-design.md
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
track. The original design spec described the first Admin Backlog page anatomy in detail.

## Preserved Intent

Admin Backlog needed to read as a normal Hito Admin workbench surface: a utility row, status tabs,
compact rows, detail/disclosure, quick note capture, and prompt copy actions built from existing
admin/Hito DS patterns.

## Key Decisions Preserved

- Backend owns backlog truth, capture assets, prompt generation, and admin authorization.
- Frontend renders allowed admin interactions and should not create a parallel backlog data model.
- Quick notes and visual captures share the same backend backlog concept.
- Prompt copy should be easy to access without dominating the whole page hierarchy.
- Loading, empty, error, saved, and copy-success states should match existing admin surfaces.

## Current Owner Links

- [Admin UI capture/backlog plan](../../plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md)
- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not implement this old design spec directly. Use current Admin routes, active admin/debugger
plan, current docs, and live Hito DS/admin primitives.

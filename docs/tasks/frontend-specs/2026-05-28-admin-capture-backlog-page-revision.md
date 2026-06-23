# Admin Capture Backlog Page Revision

## Status

backlog

## Type

frontend_spec

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Revise the admin Backlog page so it reads as a normal Hito Admin workbench surface.

## Stage

FRONTEND implementation

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Revise the admin Backlog page so it reads as a normal Hito Admin workbench surface.

STAGE:
FRONTEND implementation

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-page-revision.md
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
track. The original revision spec refined the Admin Backlog page after early feedback.

## Preserved Intent

The revision made Backlog a normal Admin surface instead of a nested-card mini-app. It emphasized a
visible `Backlog` label, normal sidebar placement, compact header/action layout, dense list rows,
quiet detail panels, and prompt/code content as the primary detail value.

## Key Decisions Preserved

- Use normal admin navigation and workbench rhythm.
- Reduce duplicated headers, metadata, nested card shells, and mini-app visual hierarchy.
- Keep prompt content readable and copyable, but do not make copy actions the only visual focus.
- Metadata editing should stay compact and backend-shaped.
- Do not expand into backend/schema changes, screenshot ingestion, auto-dispatch, or task execution.

## Current Owner Links

- [Admin UI capture/backlog plan](../../plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md)
- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not implement this revision without first checking current Admin UI/source and active admin
plans. It is historical design direction, not current implementation truth.

# Admin Capture Backlog DS Reuse Correction Spec

## Status

backlog

## Type

frontend_spec

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Correct the admin Backlog UI to reuse Hito DS and admin workbench primitives.

## Stage

FRONTEND implementation

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Correct the admin Backlog UI to reuse Hito DS and admin workbench primitives.

STAGE:
FRONTEND implementation

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-28-admin-capture-backlog-ds-reuse-correction-spec.md
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
track. The original spec documented a detailed DS audit of Admin Backlog UI drift.

## Preserved Intent

The admin Backlog page worked functionally but looked like a backlog-specific mini-app. The
correction direction was to reuse existing Hito Admin workbench and Hito DS primitives instead of
inventing custom search/filter/detail/prompt layouts.

## Key Decisions Preserved

- Reuse admin search, filter, row density, status pill, dropdown metadata, disclosure/detail, prompt
  block, and secondary button patterns.
- Remove duplicate search controls, separate apply-form filters, repeated expanded-detail titles,
  full second triage forms, over-promoted orange prompt CTAs, and always-visible append forms.
- Keep prompt copy visible/selectable, but make it part of normal detail content.
- Repo-derived rows remain markdown-owned and read-only in Admin; UI must not become a source editor.
- Do not create a second backlog UI kit.

## Current Owner Links

- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Admin UI capture/backlog plan](../../plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not implement from this old correction spec without checking current Admin source and active
admin/debugger plans. Preserve backend ownership of Backlog truth and prompt generation.

# Active Plan PDF Export Plan

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Plan a runner-facing PDF export for active training plans.

## Stage

ARCHITECT plan

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan a runner-facing PDF export for active training plans.

STAGE:
ARCHITECT plan

CONTEXT:
- Source path: docs/tasks/backlog/2026-05-15-plan-export-pdf.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Last Updated

2026-06-22

## Compression Note

D24 compressed this future export backlog item. Current saved-mode export already ships JSON and
Markdown from one backend-owned active-plan export payload. PDF remains a later runner-facing
format, not part of the accepted export surface.

## Durable Decision

PDF export should reuse the existing backend active-plan export payload rather than creating a
second plan-read model. It should appear in the existing `Open plan` export menu when an active plan
exists and stay absent in no-plan state.

## Future PDF Scope

V1 should be a readable week-list PDF for the current active plan only:

- no archived-plan export
- no multi-plan export
- no reporting dashboard
- no second planning interface
- no unsupported dense print semantics

PDF should omit unsupported details rather than inventing precision.

## Validation Boundary

The future implementation should prove payload reuse, filename/content-type behavior, authenticated
download behavior, no-plan hiding, Markdown/JSON regression safety, and readable PDF output. Browser
QA should cover the export menu and actual file download only after backend shaping is validated.

## Links

- Current active-plan export truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`

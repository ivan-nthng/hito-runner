# Admin UI Capture And Backlog Brief

## Status

backlog

## Type

product_brief

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Advance Admin UI Capture And Backlog Brief.

## Stage

ARCHITECT product brief

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Advance Admin UI Capture And Backlog Brief.

STAGE:
ARCHITECT product brief

CONTEXT:
- Source path: docs/tasks/product-briefs/2026-05-25-admin-ui-capture-and-backlog-brief.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

PRODUCT

## Last Updated

2026-06-22

## Compression Note

D24 compressed this product brief after later admin capture/backlog work made the durable product
shape clearer. Current implemented admin behavior belongs in `docs/current-product.md` and
`docs/current-system.md`; this brief remains historical/future context for route-spanning visual
capture.

## Durable Product Decision

Hito should have one internal admin-only capture workflow:

1. a browser capture mode for selecting UI context
2. an Admin backlog panel where captured items are stored, triaged, and copied into Codex prompts

The browser capture mode is not a live editor and should not automatically send work to Codex.
Admin backlog is the canonical triage surface after capture.

## Current Boundary

Implemented admin capture/backlog features already support text-only captured items, quick notes,
filter/search, status/type/priority/role updates, notes, archive, delete for manual quick notes, and
deterministic prompt copy. Screenshot upload and route-spanning overlay capture remain later slices.

## Access And Safety Rules

- admin-only access
- no runner/tester/public backlog access
- no production mutation from capture mode
- no automatic implementation routing
- captured context must be structured enough for Product triage and role handoff

## Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Active admin capture plan: `docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md`

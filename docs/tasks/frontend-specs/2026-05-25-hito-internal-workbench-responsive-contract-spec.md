# Hito Internal Workbench Responsive Contract Spec

## Status

completed

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Keep the completed internal workbench responsive contract as historical DS/source context.

## Stage

ARCHITECT reference / implemented workbench responsive contract

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Use the completed internal workbench responsive contract as historical source context only.

STAGE:
ARCHITECT reference / completed DS workbench responsive contract

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-25-hito-internal-workbench-responsive-contract-spec.md
- The implemented current truth is in docs/current-state.md, docs/current-system.md, docs/history/changelog.md, source, and the active Hito DS IA plan.
- `/hitoDS` and `/admin/analytics` now share internal workbench shell/sidebar/topbar/current-location/quick-link/summary-grid recipes.

CONSTRAINTS:
- Do not reopen implementation from this old spec without a concrete responsive/workbench regression.
- Preserve the distinction between internal workbench shell behavior and runner-facing product shell behavior.
- Do not treat optional sticky-table-column guidance as shipped unless a future QA slice proves it.

OUTPUT:
Use the project role output format.
```

## Compression Note

Compressed during Slice D22 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original file contained a full implementation handoff and detailed responsive inventory.
Current implementation truth now lives in current docs, changelog, `/hitoDS`, admin source, and Hito
DS primitives.

## Implemented Contract Preserved

- Internal workbench surfaces share one responsive shell family rather than route-local navigation
  fixes.
- Desktop workbench widths keep left navigation/sidebar.
- Tablet and mobile widths use sticky top/current-location navigation with contained quick-link
  rails.
- `/hitoDS` preserves grouped IA and scrollspy-driven current section/group state.
- `/admin/analytics` preserves admin tab IA and uses the same workbench orientation pattern.
- Tables remain semantic tables inside contained horizontal scroll regions; the page canvas must not
  overflow horizontally.
- Summary/stat grids use explicit workbench reflow: desktop multi-column, tablet two-column, mobile
  one-column.
- One active-state source should drive both desktop and narrow navigation. Do not duplicate route
  state just to support responsive chrome.

## Boundary Notes

- This contract is for internal workbench/admin/DS surfaces, not the runner-facing shell.
- It did not change admin auth, analytics data shape, table semantics, product runtime behavior, or
  Hito DS IA semantics.
- Sticky first table columns were optional/cautious guidance only and require separate Safari/layering
  proof before being treated as current behavior.

## Current Owner Links

- [Current state](../../current-state.md)
- [Current system](../../current-system.md)
- [Current functional map](../../current-functional-map.md)
- [Changelog](../../history/changelog.md)
- [Product history digest](../../history/product-history-digest.md)
- [Hito DS IA and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)

## Do Not Continue By Default

Do not run the old FRONTEND implementation handoff from this file. Future workbench changes should
start from live source, current docs, and the active Hito DS IA plan.

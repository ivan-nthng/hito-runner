# Hito DS Figma Export Surface Spec

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

product

## Task

Preserve the completed code-owned Hito DS Figma export surface as historical DS bridge context.

## Stage

DESIGN SYSTEM / implemented and QA-passed export surface

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Preserve the Hito DS Figma export surface spec as completed internal design-system history unless a fresh Figma bridge regression appears.

Stage:
PRODUCT closure guard / Hito DS Figma export surface.

Context:
The `/hitoDS/export/figma` bridge surface is implemented and QA-passed as a code-owned downstream Figma capture surface. Do not reopen implementation from this spec unless source or QA proof shows a fresh regression in the accepted Hito DS Figma bridge boundary.
```

## Owner

Design System

## Last Updated

2026-06-22

## Compression Note

This file was compressed in Slice D23. The original implementation prompt, state matrices, and
validation logs were reduced because `/hitoDS/export/figma` is already implemented and QA-passed.
Current DS/Figma bridge truth lives in:

- [current-product.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md>)
- [current-system.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md>)
- [product-history-digest.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/product-history-digest.md>)
- [Hito DS IA plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1)
- [figma-export-board.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/figma-export-board.tsx:1)

## Final Outcome

Implemented and QA-passed:

- `/hitoDS/export/figma` exists as a code-owned downstream bridge surface for html.to.design / Figma capture.
- `/hitoDS#dropdowns` and the export board include the canonical dropdown/list-item family and matching export states.
- The export board covers the intended DS foundations, buttons, inputs, dropdown/menu rows, status/tag surfaces, and color foundations needed for design-system capture.
- The route remains an internal design-system artifact, not a runner-facing feature and not a second source of runtime truth.

## Durable Decisions

- Hito runtime code and `/hitoDS` remain the source of implemented DS truth.
- Figma is downstream of code truth: capture/import target, review surface, and handoff aid.
- The project should not hand-author `.h2d`, commit binary bridge artifacts, or build a bidirectional Figma sync from this historical spec.
- The export surface should stay deterministic and specimen-board-like: visible state matrices, minimal route chrome, no private data, and no backend/admin payloads.
- Future Figma bridge changes should route through the current Hito DS IA/specimen owner and current `/hitoDS/export/figma` source, not this closed implementation prompt.

## Preserved Validation Evidence

Accepted validation included:

- source/build proof for the dedicated export route and board;
- QA proof that `/hitoDS/export/figma` was discoverable and rendered as the code-owned bridge surface;
- dropdown family parity between `/hitoDS#dropdowns` and the export board;
- desktop and mobile no-overflow checks in the accepted DS rollout;
- no product runtime, backend, Supabase, auth, OpenAI, persistence, or package-command changes.

## Changelog Decision

No changelog entry was added for this spec because it was internal DS specimen/export-surface
coverage, not a runner-facing product release.

## Boundary

Keep this spec closed. Reopen only for a fresh source-proved regression in the accepted Figma bridge
surface or for an explicitly scoped future Figma synchronization plan.

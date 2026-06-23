## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Modal Anatomy Header Footer System plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed historical summary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Modal Anatomy Header Footer System plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed historical summary.

Context:
This artifact is archived history. Do not continue it by default. If modal anatomy work returns, start from current Hito DS primitives, /hitoDS, and current product dialogs.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. Compressed during D12 of the docs/artifact compression track.

Current truth now lives in:

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Hito DS IA plan](../active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Product history digest](../../history/product-history-digest.md)

## Final Outcome

This plan defined the canonical Hito product-dialog anatomy and fixed the `/hitoDS` modal specimen dead-zone problem. It clarified that Hito dialogs use a bounded overlay/panel/header/body/footer model, with explicit body modes instead of one stretchable middle zone.

## Key Decisions Preserved

- Required dialog parts: overlay, panel, header, body, footer, and close affordance.
- Optional parts: header meta/action row, body sections, footer note/status row, and disclosure area.
- Canonical structure is `overlay -> panel -> header -> body -> footer`; no extra permanent tier should sit between body and footer.
- Header variants are bounded: simple task, labeled task, status/metadata, secondary action, and complex lifecycle.
- Body modes are explicit:
  - `content-fit` for short content where the footer follows the content naturally.
  - `scroll-fill` for tall content where the body scrolls internally and the footer stays reachable.
- Footer variants are bounded: close only, cancel plus primary, secondary plus primary, destructive confirmation, proposal reject/apply pair, and footer note plus actions.

## Implementation History

The plan closed with implementation evidence:

- shared CSS named the Hito product-dialog header, content-fit panel/body, scroll-fill panel/body, footer, footer note, and footer action row anatomy
- `/hitoDS#modals` showed a short content-fit modal and a tall scroll-fill modal
- `/hitoDS#modals` documented allowed header and footer variants through compact grouped rows
- `Open plan`, `Import plan`, and `Body notes` used named shared header/body/footer helpers while preserving workflows and stable overlay/content behavior

## Current Boundary

- This archive is not the live modal spec. Current modal work should start from `/hitoDS`, current Hito DS primitives, and live product dialogs.
- Do not introduce a huge modal abstraction component tree from this archive.
- Do not use `scroll-fill` as the default for short dialogs.
- Product mutation, import/export behavior, body-note persistence, toast behavior, app shell, and mobile sheet behavior were out of scope.

## Validation Evidence

The original exit criteria were marked complete: canonical modal parts, header/footer variants, `content-fit` vs `scroll-fill`, `/hitoDS` short-content dead-zone fix, and clean mapping for current product dialogs.

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Calendar Cell Semantics Correction as historical context.

## Stage

ARCHITECT archived-plan reference / compressed calendar-cell semantics history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Calendar Cell Semantics Correction as historical context.

Stage:
ARCHITECT archived-plan reference / compressed calendar-cell semantics history.

Context:
This artifact is archived history. Do not continue it by default. Start from current calendar source, Hito DS, and current docs before changing saved-mode month-cell semantics.
```

# Calendar Cell Semantics Correction

## Archive Note

This archive records the correction after saved-mode calendar simplification removed too much
workout identity from month cells. The accepted fix restored scanability without returning to
dashboard-like cell density.

## Final Outcome

Saved-mode month cells restored the smallest useful semantic layer:

- one broad workout-family glyph;
- one short workout-type label;
- completion marker in the date/status row;
- separate quiet feedback/evidence marker;
- restrained semantic color on type identity only.

Distance, duration, target data, metric triplets, progress bars, hover-only metrics, dense badge
clusters, and dashboard-style stacks stayed out of month cells.

## Key Decisions

- Completion truth stays primary.
- Feedback/evidence is useful but secondary.
- Semantic color supports type identity, not the whole cell.
- Richer details belong in week strip, hero, tooltip, or workout detail surfaces.

## Validation Evidence

Historical QA expectations covered today emphasis, completed-day treatment, family scanability,
feedback marker secondary weight, desktop/tablet density, and `/hitoDS` examples for the
implemented calendar type identity pattern.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Hito DS IA plan: `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not revive dense calendar cells from this archive. Future calendar work must preserve shared
calendar-day ownership and the current completion/evidence hierarchy.

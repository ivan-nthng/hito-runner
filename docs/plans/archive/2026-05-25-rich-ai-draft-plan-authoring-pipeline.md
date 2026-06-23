# Rich Canonical Workout Model And AI Draft Plan Authoring Pipeline

## Status

archived

## Type

plan

## Priority

medium

## Next Recommended Role

architect

## Task

Archived: rich canonical workout model and non-voice AI draft authoring pipeline completed.

## Stage

ARCHITECT archived plan reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived plan only as historical context for rich workout truth and AI draft authoring.

Stage:
ARCHITECT archived plan reference.

Context:
Current implemented truth lives in current docs, changelog, source, and validators. Do not resume this plan directly.
```

## Archive Note

This archive was compressed in D2 and metadata-normalized in D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original seam inventories and slice handoffs are historical.

## Final Outcome

Hito moved from broad workout labels and frontend inference toward backend-owned rich workout truth:
rich workout taxonomy, persistence/readback, import/export/template roundtrips, calendar/detail
rendering, disposable saved-mode QA, and text-authoring rich draft normalization all became
backend-shaped.

## Key Decisions Preserved

- Backend owns rich workout validation, normalization, and draft compatibility.
- Frontend renders rich workout truth instead of guessing from titles or steps.
- AI may draft rich workouts but does not silently mutate trusted plans.
- Deterministic fallback and voice parity stayed bounded; future voice parity or refresh observation
  requires a fresh active plan.
- Fake metrics, unsupported targets, and frontend-invented workout truth remain disallowed.

## Validation Evidence Preserved

The archive preserves source/validator coverage for rich workout shape, import/export/template
roundtrips, saved-mode QA fixture proof, and non-voice OpenAI rich draft normalization.

## Current Owner Links

- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current functional map](../../current-functional-map.md)
- [Changelog](../../history/changelog.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not use this archive to reopen voice parity, metric copy polish, or live refresh observation.
Create a fresh plan from current source truth if Product selects that work.

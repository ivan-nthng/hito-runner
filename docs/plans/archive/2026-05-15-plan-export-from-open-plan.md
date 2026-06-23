## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Plan Export From Open Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed active-plan export history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Plan Export From Open Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed active-plan export history.

Context:
This artifact is archived history. Do not continue it by default. Start from current active-plan export source/docs before changing export behavior.
```

# Plan Export From Open Plan

## Archive Note

This plan defined export from the `Open plan` saved-mode management surface. It is archived because
current active-plan export behavior is now owned by source/current docs.

## Final Outcome

Export was anchored to one backend-owned active-plan export payload, with JSON and Markdown shipped
from that shared truth. PDF was intentionally simpler/pending until a separate scoped slice.

## Key Decisions

- `Open plan` is the discovery point for saved active-plan export.
- JSON, Markdown, and any future PDF must derive from one canonical backend payload.
- Active saved schedule dates and normalized planned-workout fields are export truth.
- Route-local UI state, raw imported files, preview data, archived plans, Garmin/comparison/AI
  runtime state, and user settings are excluded from v1 export truth unless separately scoped.

## Validation Evidence

Historical validation covered active-plan export availability, JSON/Markdown shaping, download
behavior, Safari iframe/download reliability, no export with no active plan, and preservation of
plan-management behavior.

## Current Owner Links

- Current system truth: `docs/current-system.md`
- Current product truth: `docs/current-product.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not create separate export serializers from this archive. Future export formats must project from
the canonical backend export payload or explicitly replace it.

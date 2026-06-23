# AI-Authored First-Plan Pipeline

## Status

archived

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Archived: production blueprint first-plan wave completed and split into future tracks.

## Stage

ARCHITECT archived plan reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived production blueprint first-plan wave only as historical evidence.

Stage:
ARCHITECT archived plan reference.

Context:
The production blueprint wave is complete and archived. Current first-plan authoring truth lives in current docs, active plans, source, and validators.
```

## Archive Note

This plan was first compressed during D1 and lightly normalized again during D19 of the
[Hito Docs and Artifact Compression](../active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original implementation ledger and repeated handoffs are historical; current agents
should use this file only for preserved decisions and validation boundaries.

## Final Outcome

The production blueprint wave established goal-specific first-plan behavior for supported half
marathon and marathon paths without changing frontend, persistence, OpenAI contract, database,
review/confirm, or production envelope adoption.

## Key Decisions Preserved

- `ai_first_plan_blueprint_v1` became the production-direction first-plan contract.
- Half-marathon and marathon plans gained supported specificity while respecting metric support.
- `steady_aerobic_run` remained support-only.
- One moderate/specific stimulus per week remained the cap.
- Unsupported race pace, intervals, aggressive specificity, fake pace, and personal HR targets were
  repaired or rejected.
- The non-default envelope path remained internal/non-live.
- Remaining long-horizon, run/walk, beginner cadence, refresh, ultra/mountain, failure-path, and
  envelope-adoption topics were split into separate future tracks.

## Validation Evidence Preserved

The closeout preserved QA-passed supported half and marathon blueprint behavior, healthy
long-horizon and failure-path invariants, and no production envelope switch. Detailed proof now
lives in current source/validators and the [product history digest](../../history/product-history-digest.md).

## Current Owner Links

- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current functional map](../../current-functional-map.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not reopen this archived plan for production envelope adoption, advanced/performance cadence,
calendar polish, malformed-date QA, or unrelated first-plan work. Create a fresh active plan from
current source truth if Product selects one of those tracks.

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Next Product Track Refresh as historical context.

## Stage

ARCHITECT archived-plan reference / compressed product-prioritization history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Next Product Track Refresh as historical context.

Stage:
ARCHITECT archived-plan reference / compressed product-prioritization history.

Context:
This artifact is archived and superseded history. Do not continue it by default. Start from current docs/current-* truth before selecting product tracks or Garmin comparison work.
```

# Next Product Track Refresh

## Archive Note

This archive captured a prioritization refresh after saved-mode plan management became real. It is
preserved because it explains why richer deterministic comparison was selected before OCR,
similar-run comparison, or plan-adjustment workflows.

## Final Outcome

The selected track deepened the existing Garmin evidence loop rather than adding a new evidence
source:

- backend added `difference_payload.supportMatrix`;
- backend added trustworthy segment grouping in `difference_payload.segmentSummary`;
- frontend exposed those facts in workout-detail `Feedback`;
- pace and heart-rate remained explicitly unsupported until comparable units existed.

## Key Decisions

- Deterministic comparison stays primary.
- Bounded recommendation remains secondary.
- Screenshot OCR and similar-run comparison wait until the comparison contract is stronger.
- Plan-adjustment workflow should not be driven from a single-workout comparison refinement.

## Validation Evidence

Historical QA expectations covered the `Feedback` readback, support matrix, segment summary,
unsupported pace/heart-rate messaging, and deterministic verdict priority.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not restart this prioritization artifact. Future comparison/evidence work must start from current
Garmin/evidence truth and current product priorities.

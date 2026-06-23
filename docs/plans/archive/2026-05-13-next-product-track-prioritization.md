## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Next Product Track Prioritization as historical context.

## Stage

ARCHITECT archived-plan reference / compressed product-prioritization history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Next Product Track Prioritization as historical context.

Stage:
ARCHITECT archived-plan reference / compressed product-prioritization history.

Context:
This artifact is archived and superseded history. Do not continue it by default. Start from current docs/current-* truth before changing Garmin comparison, OCR, similar-run comparison, or plan-adjustment priorities.
```

# Next Product Track Prioritization

## Archive Note

This archive preserves the earlier predecessor to the May 14 product-track refresh. It selected
richer deterministic comparison before OCR, similar-run comparison, and plan adjustment.

## Final Outcome

The recommendation was superseded by the May 14 refresh and then implemented through deterministic
comparison support-matrix and segment-summary work.

## Key Decisions

- Improve live Garmin comparison depth before adding a second evidence source.
- Keep deterministic comparison primary and AI secondary.
- Defer screenshot OCR, similar-run comparison, and broader plan adjustment until the base evidence
  loop was stronger.
- Treat QA tails as targeted follow-up, not the next main product track.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not use this archive for current prioritization. It is useful only as the predecessor rationale
for later Garmin comparison decisions.

# Garmin FIT Upload, Comparison, And Recommendation Plan

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Archived: Garmin FIT upload/comparison/AI insight foundation is complete in the proved scope.

## Stage

Complete / archived historical reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived Garmin FIT plan only as historical provider/evidence context.

Stage:
ARCHITECT historical reference

Context:
The file-based Garmin FIT/ZIP evidence path, deterministic comparison, and bounded AI insight layer
were implemented in later current source. Future provider sync, screenshot/OCR, calendar evidence
markers, or plan-adjustment proposals require a fresh active plan from current product truth.
```

## Owner

BACKEND / FRONTEND / QA / ARCHITECT

## Last Updated

2026-06-20

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup and compressed during Slice D3 of the
docs/artifact compression track. The original file contained a full provider/evidence implementation
plan. The preserved record keeps the decisions that still matter: deterministic parsing/comparison
before AI, additive AI interpretation, and no silent plan mutation.

See also:

- [Product history digest](../../history/product-history-digest.md)
- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Changelog](../../history/changelog.md)

## Final Outcome

The accepted scope became a narrow file-based Garmin evidence pipeline:

- upload is live only for Garmin `.fit` and Garmin `.zip` containing exactly one FIT activity file;
- backend truth includes workout result assets, actual metrics, and workout comparisons;
- deterministic comparison covers trustworthy facts first: planned date versus actual date, duration,
  explicit planned distance, actual distance, and simple structured-step counts when honest;
- comparison payloads include explicit signals, missing/not-applicable reasons, delta/tolerance
  metadata, session facts, and conservative step summary when comparison is trustworthy;
- workout detail separates manual `Log result` from a dedicated `Feedback` surface;
- bounded AI insight readback is additive and uses planned truth, normalized actual metrics,
  deterministic comparison, current-week context, and next-workout summary.

## Key Decisions Preserved

- OpenAI must not be the primary parser for Garmin exports.
- Uploaded evidence and normalized actual metrics must exist before AI interpretation.
- Deterministic comparison owns computed difference; AI may explain or suggest, not replace it.
- Plan changes must not happen silently from workout evidence.
- Provider sync/OAuth/background ingestion stayed out of this file-based slice.
- Screenshot/OCR evidence remained a separate future track.

## Deferred / Future Only

- Provider API sync and OAuth.
- Background ingestion.
- Calendar evidence markers beyond accepted current surfaces.
- Screenshot/OCR extraction.
- Suggestion-to-plan-adjustment workflow.
- Multi-sport generalization.

## Validation Evidence Preserved

Historical validation included source and behavior proof for:

- FIT and single-FIT ZIP upload boundaries;
- parser/normalizer behavior;
- deterministic comparison payloads;
- feedback tab readback;
- bounded AI insight generation from deterministic context;
- no silent plan mutation.

## Current Owner References

- Current provider/evidence behavior: `docs/current-product.md`.
- Current architecture owners: `docs/current-system.md`.
- Shipped history: `docs/history/changelog.md`.
- Historical narrative: `docs/history/product-history-digest.md`.

## Boundaries

- Do not reopen provider sync from this archive.
- Do not turn AI insight into trusted metric or mutation truth.
- Do not delete or compress QA evidence through this plan.
- Do not treat screenshot/OCR as implemented because this FIT pipeline exists.

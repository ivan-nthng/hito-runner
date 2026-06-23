# Workout Screenshot OpenAI Verdict Plan

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Archived: screenshot/OCR workout evidence remains future-only and must be replanned from current truth.

## Stage

Backlog / archived historical reference.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived screenshot/OCR verdict plan only as historical evidence-pipeline context.

Stage:
ARCHITECT historical reference

Context:
This early plan predates the live Garmin-backed result-asset, actual-metrics,
deterministic-comparison, and AI-insight pipeline. If screenshot/OCR evidence returns, write a fresh
active plan from current product/system truth.
```

## Owner

ARCHITECT

## Last Updated

2026-06-20

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup and compressed during Slice D3 of the
docs/artifact compression track. Screenshot/OCR evidence remains a possible future product track,
but this early plan is superseded by the later Garmin result-asset/actual-metrics/comparison/AI
insight pipeline.

See also:

- [Product history digest](../../history/product-history-digest.md)
- [Current product](../../current-product.md)
- [Current system](../../current-system.md)

## Historical Intent

The plan proposed one narrow evidence chain for a planned workout day:

- screenshot upload from Strava or Garmin Connect;
- storage of original evidence;
- OpenAI extraction of workout result fields;
- normalization into actual metrics;
- deterministic planned-vs-actual comparison;
- AI-assisted verdict/insight generation;
- canonical Supabase storage of the chain.

It was intentionally not a generalized provider-sync, multi-sport, adaptive-plan, or AI-coaching
platform.

## Key Decisions Preserved

- Raw screenshot evidence must remain distinct from extracted fields and normalized metrics.
- Deterministic comparison must own trusted planned-vs-actual differences.
- AI may interpret or summarize but must not become opaque product truth.
- Confidence/uncertainty and review state are required before any runner-facing verdict.
- Plan rewriting must not happen silently from evidence interpretation.

## Superseded By Later Work

Later accepted work implemented a more trustworthy file-based Garmin evidence path first:

- workout result assets;
- normalized actual metrics;
- deterministic workout comparisons;
- bounded AI insight readback;
- feedback surface separation from manual logging.

Because that current path exists, screenshot/OCR should be replanned as a future evidence input that
feeds the same trusted pipeline rather than as a separate product system.

## Deferred / Future Only

- Screenshot/OCR ingestion.
- Strava/Garmin Connect screenshot parsing.
- Extraction jobs/results tables specific to OCR.
- OCR confidence review UI.
- Screenshot-derived verdicts.
- Automatic plan adjustment from screenshot evidence.

## Validation Evidence Preserved

This was architecture planning only. It did not ship a screenshot/OCR feature. Validation is the
archive/source-of-truth decision that current docs and the Garmin evidence pipeline own implemented
behavior.

## Current Owner References

- Current evidence/comparison behavior: `docs/current-product.md`.
- Current evidence/comparison architecture: `docs/current-system.md`.
- Historical narrative: `docs/history/product-history-digest.md`.

## Boundaries

- Do not mark screenshot/OCR evidence as implemented.
- Do not create a second evidence/comparison pipeline.
- Do not let OpenAI extraction bypass deterministic normalization and comparison.
- Do not delete QA/provider evidence from this archive-only compression track.

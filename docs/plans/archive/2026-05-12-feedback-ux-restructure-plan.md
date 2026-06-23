## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Feedback UX Restructure Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed historical summary.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Feedback UX Restructure Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed historical summary.

Context:
This artifact is archived history. Do not continue it by default. If workout feedback UX work returns, start from current product/system docs and the current workout detail implementation.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. Compressed during D12 of the docs/artifact compression track.

Current truth now lives in:

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Final Outcome

This plan clarified the UX boundary between manual workout logging and richer Garmin-backed feedback. Phase 1 was implemented, and the product gained a lightweight path from `Log result` into `Feedback` without moving detailed evidence ownership away from `Feedback`.

## Key Decisions Preserved

- `Log result` owns manual completion truth: completion state, manual notes, manual actuals, and the first optional invitation to add richer evidence.
- `Feedback` owns detailed evidence truth: FIT/ZIP upload, upload status, parsed summary, deterministic comparison, bounded AI interpretation, and explanation of evidence use.
- Garmin FIT/ZIP was the only live evidence source in this slice; screenshot/OCR remained later-only.
- Deterministic comparison remains the primary factual layer; AI remains secondary interpretation.
- Upload must not be required in order to log a workout.
- Absence of upload must not imply failure or bad performance.
- Similar-run comparison, OCR, provider sync, plan auto-adjustment, and historical AI regeneration were future ideas, not part of the cleanup slice.

## UX Direction Preserved

- Reduce nested-card density in `Feedback`.
- Prefer one calmer parent surface with internal dividers.
- Explain upload, factual comparison, and AI recommendation in plain runner language.
- Keep `Feedback` as the detailed evidence home.
- Add only a light upload invitation from `Log result` so the runner's natural flow is respected.

## Implementation And Validation History

The archived plan recorded that Phase 1 was implemented. The accepted product direction was to restore upload button clarity, flatten the feedback hierarchy, improve plain-language explanations, and keep the Garmin truth path intact.

QA expectations preserved from the original plan:

- upload button/icon clarity
- `Feedback` reads more clearly at first glance
- no change to Garmin truth behavior
- no screenshot/OCR implication
- no replacement of deterministic truth with AI summary

## Current Boundary

- Do not use this archive as the current workout-detail source of truth.
- Any future feedback UX work should inspect current `workout.$date`, current product/system docs, and live QA evidence first.
- Do not blur manual completion truth with evidence truth.

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Workout Page And Detailed JSON Contract Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed workout-detail and JSON-contract history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived Workout Page And Detailed JSON Contract Plan only as background for future workout-detail or import/export contract work.

Stage:
ARCHITECT archive reference / workout page and JSON contract history.

Context:
This artifact is archived history. Do not continue it by default. Current workout-detail, import/export, and evidence truth live in current docs and source.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. Implemented behavior is reflected in current docs or newer archived closeout plans.

## Final Outcome

This plan clarified early workout-detail structure and moved the JSON contract toward richer planned-workout data while preserving the imported product shell.

## Key Decisions

- Workout detail should keep a main workout content area, tabbed detail surface, and right-side context stack.
- Completion status semantics were centered on `completed`, `partial`, and `skipped`.
- `training-plan-v2` should carry detailed planned workout structure instead of relying on shallow `week_1_preview[]`.
- Segment/repeat structure should become canonical planned-workout truth; descriptive fields should not override structured truth.
- Template download and detailed JSON examples were needed to make imports reproducible.
- Screenshot/OCR and upload-result placeholders were future-only and later superseded by Garmin FIT/ZIP evidence, actual metrics, comparison, and bounded AI insight work.

## Validation Evidence

The archived plan captured the early detailed JSON direction and workout-page refinement split. Later implementation tracks superseded the long checklist and handoff blocks, so this compressed version preserves only the accepted historical boundaries.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not revive screenshot/OCR or raw upload placeholder assumptions from this archive. Start from current workout-detail, Garmin evidence, and import/export contracts.

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Feedback Loaded-State Design Pass as historical context.

## Stage

ARCHITECT archived-plan reference / compressed Feedback loaded-state history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Feedback Loaded-State Design Pass as historical context.

Stage:
ARCHITECT archived-plan reference / compressed Feedback loaded-state history.

Context:
This artifact is archived history. Do not continue it by default. Start from current Feedback/Garmin docs and Hito DS patterns before changing workout-detail loaded states.
```

# Feedback Loaded-State Design Pass

## Archive Note

This design pass refined the loaded state after Garmin evidence is already attached. It is archived
because the loaded-state hierarchy is now part of current product/UI behavior.

## Final Outcome

The loaded `Feedback` state shifted from upload-first framing to attached-evidence review:

- an attached-file owner row replaces upload intro copy when evidence exists;
- `Plan vs run` is the primary deterministic comparison layer;
- evidence/confidence/checks are grouped into calmer readback;
- recommendation remains secondary and bounded;
- removal affordance belongs to attached evidence and does not imply deleting manual log truth.

## Key Decisions

- Deterministic comparison stays visually and semantically primary.
- Recommendation/AI remains secondary and must not look like mutation authority.
- Future-only metrics such as HR, pace, segment comparison, screenshot OCR, or broader provider
  support must not be faked in the loaded state.
- Technical caveats should be quieter but not hidden when they affect trust.

## Validation Evidence

Historical validation covered attached-evidence display, remove affordance behavior, comparison
hierarchy, recommendation secondary placement, desktop/mobile readability, and no new runtime or
backend behavior.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not reopen Feedback loaded-state redesign from this archive. Future UI work should start from
current Feedback behavior and Hito DS primitives.

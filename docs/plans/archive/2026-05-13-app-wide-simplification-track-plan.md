## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived App-Wide Simplification Track Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed app-wide simplification history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived App-Wide Simplification Track Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed app-wide simplification history.

Context:
This artifact is archived history. Do not continue it by default. Start from current docs/current-* truth before changing product navigation, route hierarchy, or app-wide simplification.
```

# App-Wide Simplification Track Plan

## Archive Note

This archived plan captured the early route-simplification pass after saved mode, Garmin evidence,
manual logging, and feedback surfaces became real enough to reduce imported-baseline chrome. It is
preserved as historical product-shape context, not as current execution guidance.

## Final Outcome

The track simplified product navigation and route hierarchy:

- `/integrations` was demoted from primary navigation while remaining reachable.
- `/body` was treated as lower-priority side utility rather than core route gravity.
- `/progress` stayed visible but was simplified to match the amount of current product truth.
- Home/calendar, progress, body, integrations, and `/hitoDS` were pulled toward calmer hierarchy,
  fewer cards, less placeholder language, and stronger truth-first route composition.

## Key Decisions

- Product route prominence should match real current capability, not future promise.
- `Feedback` remained the canonical evidence surface, while `Log result` remained manual
  completion.
- Garmin evidence and AI feedback should be discoverable without turning every route into a dense
  dashboard.
- App-wide simplification should reduce chrome, card stacking, disabled shell rows, and placeholder
  promises before adding new surface area.

## Validation Evidence

Historical validation focused on navigation visibility, route reachability after demotion, desktop
and mobile layout checks, and preserving saved-mode/Garmin/manual logging behavior while reducing
chrome.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not use this archive to reopen broad app-wide UI cleanup. New simplification should start from
current product capability, current Hito DS primitives, and one bounded route or navigation owner.

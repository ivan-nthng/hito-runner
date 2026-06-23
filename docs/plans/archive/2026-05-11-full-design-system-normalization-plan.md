## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Full Design System Normalization Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed DS normalization history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived Full Design System Normalization history only as background for future DS cleanup.

Stage:
ARCHITECT archive reference / DS normalization evidence.

Context:
This artifact is archived history. Do not continue it by default. Current Hito DS truth lives in current docs, `src/styles.css`, `/hitoDS`, and the active Hito DS IA/specimen plan.
```

# 2026-05-11 Full Design System Normalization Plan

## Archive Note

Final Safari QA in the visible runner-facing scope found no obvious stray custom UI drift. The normalization track is effectively complete from the visible product perspective, with `/hitoDS` retained as the reference baseline and visualization geometry exceptions documented as intentionally outside shared Hito component families.

## Final Outcome

This plan was not a redesign. It established the rule that runner-facing Hito UI should not contain unowned custom UI when a shared Hito DS primitive or pattern exists.

Visible normalization preserved the calm, editorial, athletic, premium, low-chrome, low-card direction while moving route-local styling toward shared tokens and primitives.

## Key Decisions

- Hito DS primitives own product UI grammar: buttons, fields, tabs, surfaces, rows, metric rows, status pills, labels, captions, helpers, dividers, dialogs, and overlays.
- `/hitoDS` is the internal reference surface for DS inspection and QA.
- Custom UI is only acceptable when it is a documented exception, a visualization geometry case, internal playground chrome, or a shell-specific family with an explicit owner.
- Normalization should replace repeated drift with shared primitives, not create a second design system.
- DS cleanup should remain bounded and QA-safe because many UI surfaces are browser-sensitive.

## Preserved Exceptions

- Chart or route-map geometry may remain custom when no generic primitive can express it.
- Internal `/hitoDS` playground scaffolding may differ from runner-facing product chrome.
- Shell/navigation anatomy may keep purpose-built wrappers when they are documented and reused.

## Validation Evidence

The archived rollout included visible product review, Safari QA, and a final no-stray audit in the runner-facing scope. Detailed per-surface handoff logs were removed from this compressed archive because current DS truth now lives in current docs and `/hitoDS`.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not restart this plan as a broad DS rewrite. If DS drift returns, create a new bounded active plan from current `/hitoDS`, current source, and current product surfaces.

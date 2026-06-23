## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Modal Architecture and Design System Audit as historical context.

## Stage

ARCHITECT archived-plan reference / compressed modal architecture history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Modal Architecture and Design System Audit as historical context.

Stage:
ARCHITECT archived-plan reference / compressed modal architecture history.

Context:
This artifact is archived history. Do not continue it by default. Use current Hito DS and product-dialog contracts before changing modal behavior.
```

# Modal Architecture and Design System Audit

## Archive Note

This archived audit captured the move away from route-local modal anatomy toward a bounded Hito
product-dialog recipe. It is historical design-system evidence, not a license to invent a broad
overlay subsystem.

## Final Outcome

The accepted direction was a shared dialog recipe with stable anatomy:

- `hito-product-dialog`
- `hito-product-dialog-body`
- `hito-product-dialog-footer`
- scoped overlay behavior only where needed
- Safari-stable internal scrolling and reachable footer actions

Plan management and JSON import dialogs were key proof surfaces, with `/hitoDS` used to document
the canonical anatomy.

## Key Decisions

- Prefer one Hito dialog recipe over route-local modal styling.
- Keep modal scroll/focus/footer behavior predictable on desktop and mobile.
- Do not create a mega overlay abstraction when a bounded product-dialog contract solves the drift.
- New modal work should start from current Hito DS primitives and route-specific product needs.

## Validation Evidence

Historical validation focused on dialog anatomy, internal scroll behavior, footer reachability,
mobile overflow, and route-specific adoption without changing persistence or backend behavior.

## Current Owner Links

- Current Hito DS route and primitives: `/hitoDS`
- Current styling contract: `src/styles.css`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not reopen this archived modal audit as a broad redesign. If modal drift returns, create a fresh
bounded DS cleanup slice from the current shared primitives.

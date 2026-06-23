## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Plan Authoring Flow Redesign as historical context.

## Stage

ARCHITECT archived-plan reference / compressed plan-authoring history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived Plan Authoring Flow Redesign only as background for future plan-authoring architecture.

Stage:
ARCHITECT archive reference / plan-authoring flow history.

Context:
This artifact is archived history. Do not continue it by default. Current plan-authoring truth lives in current docs and current backend/frontend source.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. This artifact no longer represents an active execution track; future work should start from current docs and a fresh active plan if the need returns.

## Final Outcome

This plan shifted Hito away from user-provided JSON as the primary first-plan UX and toward structured, form-driven plan authoring backed by the same canonical plan output.

Implemented historical slices included:

- a server-side structured authoring input contract
- deterministic generation of one canonical `training-plan-v2` plan object
- persistence through existing `plan_cycles` plus `planned_workouts`
- a narrow ops validation path through `npm run author-structured-plan`

## Key Decisions

- Primary path: structured questionnaire and generated plan.
- Secondary path: JSON import remains advanced/internal migration tooling.
- The internal generation output must map into the canonical template/plan contract, not create a parallel runtime format.
- First-time onboarding could evolve away from JSON-first without changing core persisted truth.
- Future editability should build on generated canonical plans rather than raw JSON.

## Validation Evidence

The archived implementation status and phase notes showed backend contract and persistence slices completed while visible onboarding replacement was deferred and later superseded by richer first-plan tracks. Long phase and handoff sections were compressed because current docs now own active behavior.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not revive JSON-first onboarding or parallel plan-authoring paths from this archive. Start from current first-plan, selected-plan, AI blueprint, Plan Preset, and manual-plan owners.

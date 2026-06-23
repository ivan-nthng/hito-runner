# Structured First Plan Onboarding

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived structured first-plan onboarding history as context for current first-plan creation.

## Stage

ARCHITECT archived-plan reference / compressed onboarding history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived structured first-plan onboarding history only as background for future first-plan creation work.

Stage:
ARCHITECT archive reference / structured onboarding evidence.

Context:
This artifact is archived history. Do not continue it by default. Current first-plan creation truth lives in current docs, active running-plan plans, and current backend/frontend source.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. The structured-first baseline was implemented and later superseded by richer first-plan, selected-plan, Plan Preset, and manual-plan creation tracks.

## Final Outcome

Structured first-plan onboarding became the normal visible baseline after JSON-first onboarding was demoted.

Accepted behavior preserved:

- structured constructor as the normal first-plan creation path
- old free-text-first onboarding no longer visible by default
- optional comment as supporting context only
- no sex/gender field
- Advanced JSON demoted but preserved separately
- valid structured submission succeeds
- bounded errors for missing target-time fields
- fixed rest-day invariants persisted and respected
- age, weight, and height persisted
- benchmark, terrain, and comment did not leak into long-lived profile truth
- mobile layout remained bounded at the QA baseline

## Key Decisions

- Backend owned the structured onboarding contract and bounded validation.
- Age, weight, and height became required bounded inputs.
- Fixed rest days flowed into plan preferences and weekday invariants.
- Goal, goal style, terrain, target time/date, benchmark, and strength/mobility were generation context, not all stable profile truth.
- Mountain running implied mountain terrain; normal goals defaulted terrain conservatively.
- Recent 5K pace/time could become internal authoring pace truth while fake pace/HR remained forbidden.

## Validation Evidence

The archived implementation updates recorded backend contract tightening, frontend control refinement, benchmark branch follow-up, and QA proof for the structured-first baseline. Detailed prompt chains were removed because current first-plan truth is now represented in current docs and later active/archived plans.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not reopen this plan for current first-plan work. Start from current first-plan, selected-plan, Plan Preset, and manual-plan source-of-truth instead.

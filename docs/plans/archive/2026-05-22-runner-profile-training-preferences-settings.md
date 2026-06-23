# Runner Profile And Training Preferences Settings

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived runner profile and training-preference settings history as context.

## Stage

ARCHITECT archived-plan reference / compressed settings history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived runner profile and training-preference settings history only as background for future settings or first-plan prefill work.

Stage:
ARCHITECT archive reference / settings and preference truth boundary.

Context:
This artifact is archived history. Do not continue it by default. Current settings and active-plan truth live in current docs and source.
```

## Owner

Architect / Backend / Frontend / QA

## Last Updated

2026-05-22

## Closeout Note

Backend storage/settings contract, shared training-preference mapping, Settings/Onboarding progressive controls, Quick setup prefill, structured review modal, explicit confirm, and core QA for persistence/rest-day/non-mutating flows were completed.

Residual QA hygiene items were non-blocking: invalid/correction UI, custom 5K invalid-range Safari exercise, voice-to-plan re-smoke, and Advanced JSON re-smoke.

## Final Outcome

Hito established runner-level profile and training-preference truth so future plan creation could prefill known runner data without silently rewriting the current active plan.

## Key Decisions

- Personal data and stable weekly training preferences belong to runner profile/settings.
- Active-plan preferences remain the truth for the currently active plan.
- Settings edits must not silently rewrite existing active plans.
- Saved runner defaults may prefill future plan creation, import, and refresh flows.
- `runner_profiles.training_preferences` became the storage owner for stable defaults.
- Fitness benchmark and training context are generation context unless explicitly promoted to a stable settings field.
- Shared validation/mapping should prevent Settings and Onboarding from diverging.
- Structured review/confirm must show what will be used before mutation.

## Validation Evidence

The archived plan recorded backend shared contract slices, frontend shared controls, review modal work, and QA proof for persistence, rest-day, and non-mutating behavior. Detailed prompt chains and matrix rows were compressed because current docs and source now own live settings behavior.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not use this archive to approve silent active-plan rewrites, broad settings redesign, billing/account expansion, or hidden mutation of plan preferences. Create a new active plan for any future settings lifecycle change.

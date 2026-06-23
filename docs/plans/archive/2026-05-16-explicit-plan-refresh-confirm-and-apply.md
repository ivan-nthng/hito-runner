## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Explicit Plan Refresh Confirm And Apply plan as mutation-safety history.

## Stage

ARCHITECT archived-plan reference / compressed active-plan refresh apply history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Explicit Plan Refresh Confirm And Apply plan as mutation-safety history.

Stage:
ARCHITECT archived-plan reference / compressed active-plan refresh apply history.

Context:
This artifact is archived history. Do not continue it by default. Start from current active-plan refresh lifecycle contracts before changing refresh apply behavior.
```

# Explicit Plan Refresh Confirm And Apply

## Archive Note

This plan defined the safety boundary between viewing an AI-assisted refresh proposal and applying
it. It is compressed carefully because it explains current mutation-safety doctrine.

## Final Outcome

The accepted refresh apply model:

- proposal generation never mutates;
- `Apply update` is the only mutation path;
- `Keep current plan` is a safe reject path;
- stale proposals block before generation or database mutation;
- apply uses archive/replace, creating `active_plan_refresh_v1`;
- fixed past/logged workout truth carries forward into the replacement active plan;
- fixed weekday rest-day invariants and remaining-schedule fingerprints participate in staleness
  and validation;
- malformed generated output returns bounded blocked states and leaves the active plan unchanged.

## Key Decisions

- The runner must understand “nothing has changed yet” before apply.
- Backend owns proposal fingerprints, stale checks, repair hooks, validation, and persistence.
- Refresh changes only mutable future schedule; protected history is fixed truth.
- The UI may present review/confirm state but cannot infer lifecycle semantics locally.

## Validation Evidence

Historical validation covered stale proposal reuse blocking, archive/replace success, fixed rest-day
preservation, double-submit blocking, bounded `invalid_refresh_plan`, repair-before-validation, and
unchanged active-plan state after unsafe generated output.

## Current Owner Links

- Current system truth: `docs/current-system.md`
- Current product truth: `docs/current-product.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not weaken refresh apply into silent automation. Any future active-plan refresh work must preserve
explicit review/confirm, staleness checks, backend validation, and protected-history safety.

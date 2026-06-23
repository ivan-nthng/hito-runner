## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived First Plan Constructor Architecture Audit as historical context.

## Stage

ARCHITECT archived-plan reference / compressed constructor architecture history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived First Plan Constructor Architecture Audit as historical context.

Stage:
ARCHITECT archived-plan reference / compressed constructor architecture history.

Context:
This artifact is archived history. Do not continue it by default. Start from current first-plan and running-plan source owners before changing onboarding or authoring architecture.
```

# First Plan Constructor Architecture Audit

## Archive Note

This audit inspected early structured first-plan onboarding after the feature was already live. It is
archived because later cleanup slices removed several old `training-api.ts` compatibility seams and
current first-plan ownership is documented elsewhere.

## Final Outcome

The audit identified that the first-plan problem was primarily ownership, not visible UI:

- `OnboardingGate` should remain orchestration, not domain logic.
- Canonical write paths must stay sequential: validate input, generate canonical plan, review if
  needed, apply safely, then persist.
- First-plan actions should not keep accumulating in a mixed `training-api.ts` kitchen-sink facade.
- Shared weekday, goal, parsing, and formatting helpers should be extracted only where they remove
  real duplication.

## Key Decisions

- Do not parallelize validation/generation/apply/persistence boundaries.
- Keep voice/transcript-specific sufficiency and review copy local to voice.
- Keep JSON import as a separate secondary path, not the architectural owner of first-plan creation.
- Temporary compatibility re-exports are acceptable only with a removal plan.

## Validation Evidence

Historical validation expectations covered structured constructor, voice review/confirm, Advanced
JSON import, saved-mode authoring, and source proof that first-plan runtime wrappers no longer
depended on stale `training-api.ts` ownership.

## Current Owner Links

- Current system truth: `docs/current-system.md`
- Current product truth: `docs/current-product.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not reopen broad first-plan decomposition from this archive. If authoring files become hotspots
again, select one current source-proved ownership seam and validate the accepted onboarding paths.

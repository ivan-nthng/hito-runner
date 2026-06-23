## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Text-First Plan Creation and Start-Date Policy Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed start-date policy history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Text-First Plan Creation and Start-Date Policy Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed start-date policy history.

Context:
This artifact is archived history. Do not continue it by default. Start from current product/system docs before changing plan creation or start-date behavior.
```

# Text-First Plan Creation and Start-Date Policy Plan

## Archive Note

This plan captured the historical pivot from template-first onboarding toward text/import-driven plan
creation and the start-date conflict rules needed to apply imported or generated plans safely. The
text-first UX itself has since been superseded by current onboarding/plan creation flows; the durable
rule is the backend-owned apply policy.

## Final Outcome

The work established that plan application must normalize effective start dates and protect existing
history before persistence:

- Future explicit start dates can be honored.
- Past or unusable dates are normalized by the backend apply layer.
- If a plan starts today and today already has a saved workout, the runner must choose an explicit
  conflict decision instead of receiving a silent overwrite.
- Accepted decisions included replacing the first day or ignoring/skipping it, depending on the
  backend-shaped review state.

## Key Decisions

- Backend apply policy owns start-date normalization and first-day conflict safety.
- Frontend may present the conflict decision, but must not infer mutation semantics locally.
- History continuity wins over making an imported/generated plan look perfectly intact.
- Text, JSON, and later voice-like input paths must end in the same validated canonical plan shape
  before apply.

## Validation Evidence

Historical validation covered shared apply-policy behavior, first-day conflict review state,
frontend decision serialization, import-path reuse, and safeguards against silent active-plan
rewrites.

## Current Owner Links

- Current system truth: `docs/current-system.md`
- Current product truth: `docs/current-product.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not revive text-first onboarding from this archive. If plan creation/start-date behavior changes,
start from current active-plan lifecycle contracts and backend review/confirm ownership.

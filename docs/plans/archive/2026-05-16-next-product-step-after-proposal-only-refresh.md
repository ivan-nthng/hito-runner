## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Next Product Step After Proposal-Only Refresh as historical context.

## Stage

ARCHITECT archived-plan reference / compressed refresh-sequencing history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Next Product Step After Proposal-Only Refresh as historical context.

Stage:
ARCHITECT archived-plan reference / compressed refresh-sequencing history.

Context:
This artifact is archived and superseded history. Do not continue it by default. Start from current active-plan refresh docs and current source before changing proposal/apply semantics.
```

# Next Product Step After Proposal-Only Refresh

## Archive Note

This archive captured the decision that proposal-only refresh was not enough: the next bounded step
was explicit apply/confirm for approved refresh proposals.

## Final Outcome

The selected path was to complete the plan-refresh loop with explicit `Apply update` / `Keep current
plan` controls against a backend apply seam.

## Key Decisions

- Proposal generation may explain how Hito would revise the plan, but mutation requires explicit
  runner approval.
- Apply must preserve past truth and replace only the remaining active schedule through the
  accepted lifecycle.
- No silent plan mutation, coach chat, screenshot OCR, similar-run comparison, PDF export, or broad
  plan editing belonged in the same slice.
- Screenshot OCR, richer comparison refinement, similar-run comparison, and runner-settings/profile
  follow-up waited behind the apply contract.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not use this archive to design current refresh behavior. It only records why explicit apply was
selected after proposal-only refresh.

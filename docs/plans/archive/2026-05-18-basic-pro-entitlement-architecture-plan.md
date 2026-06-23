## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Basic/Pro Entitlement Architecture Plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed entitlement architecture history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Basic/Pro Entitlement Architecture Plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed entitlement architecture history.

Context:
This artifact is archived history. Do not continue it by default. Start from current entitlement source/docs before changing gating, billing, or usage limits.
```

# Basic/Pro Entitlement Architecture Plan

## Archive Note

This plan defined the early entitlement architecture direction before billing/pricing existed. It is
preserved as historical architecture context; current entitlement behavior and capability keys are
owned by current source/docs.

## Final Outcome

The accepted direction was backend-owned entitlement truth:

- tiers and capability access are resolved server-side;
- frontend may hide, explain, or upsell but cannot be the authority;
- pre-billing users behave effectively as Pro;
- metered allowances such as one included Basic AI-backed update require backend usage accounting;
- future billing can attach to entitlement truth without rewriting product flows.

## Key Decisions

- No UI-only premium gating.
- Capability registry and usage accounting should be explicit.
- Core saved-mode data remains visible regardless of premium gating.
- Billing/pricing copy and payment integration were future product decisions, not shipped by this
  architecture plan.

## Validation Evidence

Historical validation expectations included backend denial for unauthorized direct requests,
successful Pro execution, usage decrement only on successful qualifying actions, effective Pro
pre-billing defaults, and no corruption when changing tier state.

## Current Owner Links

- Current system truth: `docs/current-system.md`
- Current product truth: `docs/current-product.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not infer billing/pricing implementation from this archive. Any future entitlement work must
start from current capability keys, backend enforcement, and a fresh product decision for commercial
behavior.

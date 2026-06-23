# Basic / Pro Entitlement Backend Foundation Slice

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Basic/Pro entitlement backend foundation history as context.

## Stage

ARCHITECT archived-plan reference / compressed entitlement history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Use this archived entitlement foundation history only as background for future capability gating or billing work.

Stage:
ARCHITECT archive reference / entitlement backend foundation evidence.

Context:
This artifact is archived history. Do not continue it by default. Current entitlement truth lives in current docs and backend source.
```

## Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup. The backend entitlement foundation was implemented without shipping billing, pricing, or visible commercial enforcement.

## Final Outcome

The slice added backend-owned capability truth for future Basic/Pro gating while preserving the pre-billing product behavior where real users effectively behaved as Pro.

Implemented outcomes:

- `runner_entitlements` stored explicit backend-owned entitlement rows.
- `runner_capability_usage` stored lifetime metered usage.
- Missing entitlement rows resolved to effective `Pro` with `prebilling_default_pro`.
- Capability keys covered `ai_plan_update`, `voice_to_plan`, and `garmin_ai_interpretation`.
- `ai_plan_update` was checked before active-plan refresh proposal generation and counted only after successful proposal generation for explicit Basic users.
- Approved refresh proposal apply did not increment usage.
- `garmin_ai_interpretation` gated only AI insight generation, not upload, parsing, actual metrics, deterministic comparison, or deterministic feedback readback.
- RLS allowed authenticated clients to read their own entitlement/usage rows; writes remained server/admin-owned.

## Key Decisions

- Gating must be backend-owned.
- Billing and subscription UI were deliberately out of scope.
- Basic should eventually include one AI-backed plan update.
- Deterministic Garmin evidence and comparison must remain available even when AI interpretation is gated.

## Validation Evidence

Archived evidence recorded migration application to the linked Supabase project, regenerated database types, backend validation, product-path validation, and storage validation. Detailed validation logs were compressed because current source and current docs now own live entitlement behavior.

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Changelog](../../history/changelog.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not add billing, pricing UI, or commercial enforcement from this archive. Start any future entitlement rollout from current source and a fresh active plan.

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Full Product Capability and QA Spec as historical baseline context.

## Stage

ARCHITECT archived-plan reference / compressed QA baseline history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Full Product Capability and QA Spec as historical baseline context.

Stage:
ARCHITECT archived-plan reference / compressed QA baseline history.

Context:
This artifact is archived history. Do not treat it as current QA truth; use current docs, active plans, and changelog for implemented behavior.
```

# Full Product Capability and QA Spec

## Archive Note

This document was an early product-capability and QA baseline after the first training-plan,
Supabase, and text/import milestones. It is now stale historical context. Current behavior is owned
by `docs/current-*`, active plans, changelog, and the product history digest.

## Final Outcome

The spec organized the product into major capability areas for QA coverage:

- auth and no-plan states
- setup/import/saved-plan flows
- workout detail and progress views
- feedback and body/composition surfaces
- integration/logging readiness
- error and mobile/responsive states

It helped expose the need for explicit QA paths and product-source ownership, but many details were
superseded by later architecture, DS, manual authoring, active-plan lifecycle, and cleanup tracks.

## Key Decisions

- QA should validate end-to-end product capability, not only isolated components.
- Current implemented truth must live in current docs and changelog, not in historical QA matrices.
- Historical capability specs should be compressed once they stop owning active execution.

## Validation Evidence

The original plan gathered early QA expectations and scenario coverage. Later accepted QA evidence
lives in slice reports, current plans, changelog, and protected `qa-artifacts/`.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Shipped-history source: `docs/history/changelog.md`
- Product evolution digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not use this archive as a live QA checklist. For new QA, start from the current active plan,
current docs, and the relevant QA skill.

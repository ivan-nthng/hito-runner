# Hito Current-System Modular Boundary Reconciliation

Work Item ID: `2026-08-21-hito-current-system-modular-boundary-reconciliation`
Notion Task: [HITO-240](https://app.notion.com/p/Reconcile-Current-System-Modular-Boundaries-3c4fe5f58cf5813fa18fe505182434c0)
Type: Maintenance
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Feedback Marker Presentation Owner Extraction](./2026-08-21-hito-feedback-marker-presentation-owner-extraction.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md#phase-6--shared-facade-reduction-and-truth-reconciliation)

## Scope

Reconcile only `docs/current-system.md` and `docs/current-state.md` with accepted Calendar,
Result/Evidence, Progress, Identity/Admin and presentation boundaries. Legacy implementation names
may remain recorded as temporary facts, but must not be represented as current product authority or
as reasons to cross a public domain boundary.

## Archive Intent

Retain the concise current-architecture map as technical input for HITO-218. Operational lifecycle,
delivery steps, handoffs and history live only in the linked Notion task.

## Task

Document the accepted modular-monolith reality so an owner can load only its direct domain boundary:

- Runner Calendar owns independently confirmed Calendar workouts; sources are immutable provenance.
- Result/Evidence owns provider-neutral factual lineage and normalized evidence; FIT is one adapter.
- Progress consumes the factual public contract and never provider-private read models.
- Identity owns actor classification; Admin consumes its explicit result.
- Feedback-marker labels are Frontend presentation, not `training.ts` authority.

Mark retained legacy table or module names precisely as temporary implementation facts. Link to the
existing public contracts where useful; do not recreate their detail or lifecycle history.

## What Not To Touch

Do not change `docs/current-product.md`, `docs/context.md`, `docs/glossary.md`, plans, product
decisions, source, schema/RLS/RPC, runtime, fixtures, providers, hosted state, credentials, Notion
schema or Git lifecycle. Do not convert this documentation work into a source refactor, a new
architecture framework or a mass documentation rewrite.

## Proof

Every changed current-state claim must resolve to an accepted current source owner or linked public
contract. Prove local Markdown links, absence of active-plan/runner-facing-plan authority in the
edited documents, Prettier, whitespace and diff hygiene. Stop and return to PRODUCT for a missing
accepted contract, a conflict with a controlling product decision or a required source migration.

## Implementation Receipt — 2026-08-21

### Outcome

`docs/current-system.md` and `docs/current-state.md` now describe the accepted modular-monolith
boundaries without promoting a source artifact, provider adapter, private read model, Admin module or
shared presentation facade into product authority. No missing contract or conflicting Product
decision was found.

| Reconciled claim                                                                                          | Accepted owner/evidence                                                                                           |
| --------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| Confirmed workouts are independently runner-owned; source records are provenance only                     | [HITO-232 Calendar snapshot boundary](./2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md)               |
| Result/Evidence public facts are provider-neutral; FIT/upload/parser/storage mechanics are private        | [HITO-235 Result/Evidence public contract](./2026-08-21-hito-result-evidence-public-contract.md)                  |
| Progress and factual visualizations consume one Product contract rather than provider-private read models | [HITO-236 Evidence/Progress Product contract](./2026-08-21-hito-evidence-progress-product-contract.md)            |
| Identity owns actor classification; Runner and Admin consume the result                                   | [HITO-237 Identity actor-classification boundary](./2026-08-21-hito-identity-owned-actor-classification.md)       |
| Result/Evidence owns marker state; Frontend owns the unchanged labels                                     | [HITO-239 feedback-marker presentation owner](./2026-08-21-hito-feedback-marker-presentation-owner-extraction.md) |

Physical names including `planned_workouts`, `plan_cycles` and `active-plan-*` remain documented only
as temporary storage/module facts. They grant no Calendar authority, permission, visibility or
lifecycle ownership. `training.ts` retains shared snapshot types/utilities but not persisted Calendar
assembly or feedback-marker labels; `training-api.ts` remains transport/authentication composition.

The same focused pass also removed stale Markdown-queue claims from the two edited current documents:
Notion remains operational lifecycle truth under `AGENTS.md`, while repository Markdown remains
technical documentation/evidence.

### Validation And Boundary

- Task-local Markdown links, scoped Prettier, direct whitespace and `git diff --check`: PASS.
- Active-plan/runner-facing-plan authority scan and all five accepted boundary links in both current
  documents: PASS; temporary legacy-name statements remain explicitly qualified.
- All 53 unrelated dirty/untracked paths: preserved byte-for-byte; the before/after aggregate
  fingerprint remained `3a79ba6a0fe638f59867d428fdac9fed91da6b19d4cdd2fe0243068e996c81ba`.
- Runtime, source, schema/RLS/RPC, fixtures, tests, browser, providers, hosted state, release,
  deployment and Git lifecycle: not changed or claimed.

PRODUCT owns concise acceptance of this current-architecture map. Phase 6 completion, Epic QA and
release remain separate.

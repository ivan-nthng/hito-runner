# Hito Evidence And Progress Product Contract

Work Item ID: `2026-08-21-hito-evidence-progress-product-contract`
Notion Task: [HITO-236](https://app.notion.com/p/Complete-Evidence-and-Progress-Product-Contract-3c3fe5f58cf581aa8c03d528da2f61c5)
Type: Maintenance
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Result And Evidence Public Contract](./2026-08-21-hito-result-evidence-public-contract.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md#phase-4--evidence-and-progress-contract-completion)

## Scope

Complete Phase 4 of the modular-monolith plan through serialized owners: BACKEND establishes the
provider contract, FRONTEND in the Design System lane migrates shared factual visualizations, FRONTEND Product migrates
the Progress route, BACKEND adds the narrow boundary guard, and QA accepts the observable Progress
surface. Each owner acts only after the preceding handoff proves its public contract.

## Archive Intent

Retain the final Evidence/Progress public boundary, removal proof and accepted Progress evidence as
technical input for HITO-218. Operational lifecycle, delivery steps and handoffs live only in Notion
HITO-236.

## Task

`src/lib/runner-activity/product-contract.ts` must be the only read contract used by current
Product and Design System consumers. Backend-private read models, fact snapshots, formulas, FIT
source joins and scale mechanics remain private. Progress presents accepted factual data; it does
not calculate, sample, interpolate or invent missing facts.

The first slice is BACKEND-only: determine the minimal provider fields directly required by current
Product/DS consumers, complete the existing product contract and map all runtime/type-only consumers.
Do not move a UI consumer until the contract represents its factual need losslessly.

## What Not To Touch

Do not change activity collection/ingestion, Calendar or authoring behavior, formulas, fact
selection, evidence policy, schema/RLS/RPC, provider APIs, storage, hosted state, credentials, Git
lifecycle or prior HITO-224/HITO-232/HITO-235 boundaries. Do not introduce another projection,
registry, dependency framework, fallback data path or client-side calculation.

## Proof

Before each owner write, map direct consumer needs and recursively verify runtime plus type-only
direction. The final removal condition is zero route/component/DS imports of
`read-model-types.ts`; Backend/proof imports may remain private. Reuse the existing Runner Activity
foundation/read-model scale, Product projection, DS factual visualization, responsive Progress,
missingness and focused boundary proofs. Whole-product replay waits for Epic/release.

Stop and return to PRODUCT if an existing Product contract cannot represent a real consumer need
without leaking persistence/formula details, or if scope requires a policy, schema, provider or
third-domain decision.

## Handoff Prompt

```text
ROLE: BACKEND

Task: HITO-236 — Complete Evidence and Progress Product Contract
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-21-hito-evidence-progress-product-contract.md
Plan: /Users/ivan/Developer/hito-running/docs/plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 4 only)
Stage: Phase 4A — Backend provider-contract completion

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this item,
the Phase-4 plan section, and only runner-activity/product-contract.ts, its direct production and
focused-proof consumers, provider read-model types, and existing Runner Activity validators.

Before the first write, map every direct Product/Design System consumer and recursively prove runtime
plus type-only dependency direction. Complete product-contract.ts only with fields those current
consumers need. Keep read-model.ts, read-model-types.ts, fact snapshots, formulas, FIT source joins
and scale mechanics Backend-private. Do not migrate DS or Product UI in this slice and do not change
activity collection, Calendar, authoring, formulas, fact selection, evidence policy, schema/RLS/RPC,
providers, storage, hosted state, credentials, Git lifecycle or the accepted HITO-224/HITO-232/HITO-235
boundaries.

Prove the provider contract, direct consumer field parity and negative dependency direction with the
existing focused Runner Activity evidence. Run focused TypeScript, Prettier and diff hygiene. When
and only when the contract is lossless for the named shared factual visualizations, hand off the same
Task directly to FRONTEND in the Design System lane with its exact public imports and proof boundary. Stop and return to
PRODUCT for a missing lossless field, persistence/formula leak, policy/schema/provider decision,
third-domain implementation or compatibility projection.
```

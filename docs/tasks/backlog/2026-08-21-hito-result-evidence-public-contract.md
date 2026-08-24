# Hito Result And Evidence Public Contract

Work Item ID: `2026-08-21-hito-result-evidence-public-contract`
Notion Task: [HITO-235](https://app.notion.com/p/Isolate-Result-and-Evidence-Public-Contract-3c3fe5f58cf58131af77c6f143ab9e11)
Type: Maintenance
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Measured Delivery Context Corrections Adoption](./2026-08-21-hito-measured-delivery-context-corrections-adoption.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md#phase-3--result-and-evidence-public-contract)

## Scope

Complete Phase 3 of the accepted modular-monolith plan. Establish one safe public Result/Evidence
contract and move FIT/upload/parser/provider/storage implementation detail behind the Backend
boundary, without changing runner-visible behavior or evidence policy.

## Archive Intent

Retain the final Result/Evidence public boundary, deleted exports and focused evidence as technical
input for HITO-218. Operational lifecycle, delivery steps and handoffs live only in Notion HITO-235.

## Task

`src/lib/workout-result-import/types.ts` currently carries public product projections alongside
private upload, raw parsed FIT, provider failure and observability mechanics. Keep it as the public
contract while it serves routes and Product consumers. Move only Backend-private implementation
types to `src/lib/workout-result-import/internal-types.ts`, update direct Backend consumers and
remove those exports from the public contract after runtime and type-only reachability proof.

The public contract may expose only safe action errors, `WorkoutResultFeedbackSummary`, completion
and evidence markers, comparison, availability and persisted insight projections. Calendar consumes
only a protection/completion decision; Progress consumes only accepted factual evidence.

## What Not To Touch

Do not change Calendar/authoring behavior, UI/Design System, schema/RLS/RPC, storage shape,
migrations, evidence policy, providers, hosted state, credentials, Git lifecycle or the accepted
HITO-224/HITO-232 boundaries. Do not introduce a second evidence DTO, fallback query, compatibility
export or a new cross-domain facade.

## Proof

Before the first write, map direct production and focused-proof consumers of the public Result/Evidence
types and recursively check both runtime and type-only direction. Reuse and extend
`scripts/validate-workout-evidence-comparison.ts` only for provider/consumer examples required by
the changed boundary. Run existing upload/remove/retry and manual/FIT-precedence proof only when the
change affects them. Run focused TypeScript, Prettier and diff hygiene. QA is required only if the
observable result contract changes; FRONTEND Product is required only if a public import changes.

Stop and return to PRODUCT for a new storage shape, migration, evidence-policy decision,
third-domain implementation, missing lossless public fact, or compatibility projection.

## Handoff Prompt

```text
ROLE: BACKEND

Task: HITO-235 — Isolate Result and Evidence Public Contract
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-21-hito-result-evidence-public-contract.md
Plan: /Users/ivan/Developer/hito-running/docs/plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 3 only)
Stage: Phase 3 — Result and Evidence public contract

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this item,
the Phase-3 plan section, and only the direct Result/Evidence public types, their production and
focused-proof consumers, and the existing evidence-comparison/upload/remove/retry proof seams.

Before the first write, map all direct public consumers and recursively verify runtime plus type-only
dependency direction. Keep workout-result-import/types.ts as the safe public product contract. Move
only upload/storage constants, raw parsed FIT shapes, provider-only failures and observability
mechanics into one Backend-private internal-types owner; migrate its direct Backend consumers
atomically, then remove the corresponding public exports after zero-reachability proof.

Preserve the accepted domain boundary: Calendar receives only a protection/completion decision and
Progress only accepted factual evidence. Do not change Calendar/authoring behavior, Frontend/DS,
schema/RLS/RPC/storage shape, migrations, evidence policy, providers, hosted state, credentials,
Git lifecycle, or accepted HITO-224/HITO-232 paths. Do not add a second DTO, fallback query,
compatibility export or cross-domain facade.

Prove the changed public contract, negative dependency direction, affected provider/consumer examples
and direct existing behavioral proofs only where changed. Run focused TypeScript, Prettier and diff
hygiene. If an observable public contract changes, dispatch the named FRONTEND Product owner only
for that direct consumer; after stable ownership, dispatch independent QA for the changed contract.
Stop and return to PRODUCT for a new storage shape, migration, evidence-policy decision, third-domain
implementation, missing lossless public fact or compatibility projection.
```

# Hito Runner Calendar Public Snapshot Cleanup

Work Item ID: `2026-08-21-hito-runner-calendar-public-snapshot-cleanup`
Status: ready
Type: Maintenance
Priority: highest
Owner: BACKEND
Epic: platform-and-operations
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Runner Calendar Mutation Owner Extraction](./2026-08-21-hito-runner-calendar-mutation-owner-extraction.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md)

## Scope

Complete Phase 2C of the accepted modular-monolith plan. Make the Runner Calendar own persisted
Calendar snapshot assembly; keep `training-api.ts` as transport/composition only. Remove
plan-shaped assumptions from the public signed-in Calendar snapshot only when their direct
consumers are proved plan-neutral.

## Archive Intent

Retain the direct-consumer map, deleted public assumption, and focused proof as Phase-2C technical
evidence for the finite HITO-218 domain-isolation outcome. Operational status and delivery-step
progress live in Notion task HITO-232.

## Task

`TrainingSnapshot` still exposes nullable `PlanMeta`, while `training-api.ts` still assembles the
persisted Calendar snapshot. Phase 2A established the Calendar query/context owner and Phase 2B
established its mutation owner. This slice makes the public snapshot align with that ownership
without changing runner behavior or creating a replacement plan authority.

## Accepted Constraints

- Reuse `runner-calendar-persistence.ts`, `training.ts`, and `training-api.ts`; add a runtime file
  only if the direct ownership map proves a distinct responsibility cannot live in the existing
  Calendar owner.
- Calendar workout and immutable source provenance remain the only public concerns. A source plan
  cannot become required for current Calendar permissions, visibility, or lifecycle.
- Remove `PlanMeta` and any non-null active-plan capability assumption only after every signed-in
  production consumer of the persisted snapshot is proved plan-neutral.
- Signed-out preview/marketing code is not silently converted. Stop for PRODUCT if it still needs
  plan-shaped copy or a changed public contract.
- Do not change Frontend, Design System, database schema/RLS/RPC names, templates, AI/file
  providers, results/FIT/history, hosted state, build/deployment, or Git state.
- Do not rename physical `active-plan-*` storage/RPC names or add aliases, adapters, a second DTO,
  a cache, or a plan container.

## Required Discriminator Before Write

Map the direct signed-in and signed-out consumers of `TrainingSnapshot`, `PlanMeta`, and
`getPersistedSnapshot`. Record which Calendar fields they actually consume and whether a
signed-out preview needs a Product decision. Stop if removal requires an unadmitted Frontend
consumer change, new persistence shape, cross-owner implementation, or compatibility projection.

## Validation Expectations

Prove Calendar snapshot ownership and zero removed-public-assumption imports; direct signed-in
consumer contract; source provenance without plan authority; manual/AI/import parity; protection,
stored-Rest/Undo, reload, and focused persistence only where the moved assembly affects them.
Run focused TypeScript, Prettier, and diff hygiene. Use independent QA after Backend proof passes.
Browser, Global QA, hosted, provider, release, deployment, and Git actions are out of scope unless
the changed public contract demonstrably requires them.

## Stage

Phase 2C — Runner Calendar public snapshot cleanup

## Next Recommended Role

BACKEND

## Handoff Prompt

```text
ROLE: BACKEND

Task: HITO-232 — Clean Up Runner Calendar Public Snapshot
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md
Plan: /Users/ivan/Developer/hito-running/docs/plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md (Phase 2C only)
Stage: Phase 2C — Runner Calendar public snapshot cleanup

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this
item, and only the direct `training-api.ts`, `training.ts`, Runner Calendar persistence/query,
signed-in snapshot consumers, signed-out preview consumers, and existing focused proof seams.

Before the first write, map every direct consumer of `TrainingSnapshot`, `PlanMeta`, and
`getPersistedSnapshot`; distinguish signed-in Calendar consumers from signed-out preview/marketing
consumers. Make the Calendar owner assemble the persisted Calendar projection and make
`training-api.ts` consume it as transport/composition. Remove public `PlanMeta` and non-null
active-plan assumptions only after the signed-in map proves they are not consumed.

Preserve runner-owned Calendar truth: source provenance is immutable input/history only; Calendar
permissions, visibility, schedule, and lifecycle must not require a live plan. Reuse existing
owners. Do not add aliases, adapters, duplicate DTO/state, a table, migration, RPC rename,
Frontend/Design System change, provider call, hosted action, Git action, or release work.

Stop and return to PRODUCT if signed-out preview needs plan-shaped marketing copy, or if a direct
consumer needs a Product decision, Frontend implementation, a new persistence shape, a second
writer, or a compatibility projection. Otherwise prove ownership and zero removed imports, direct
consumer parity, source provenance/no-plan authority, affected manual/AI/import behavior,
protection, stored-Rest/Undo, reload, atomic failure/cleanup as applicable, focused types,
Prettier, and diff hygiene. After implementation proof, dispatch the named QA role directly for
independent acceptance under the existing autonomous chain.
```

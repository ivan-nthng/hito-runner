# Hito Modular Monolith Domain-Boundary Transformation Plan

Work Item ID: `2026-08-18-hito-modular-monolith-domain-boundary-transformation-plan`
Status: completed
Type: Tracked
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: [Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Hito Product Domain Boundaries And Efficient Delivery Architecture Audit](./2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md)

## Scope

Prepare the implementation-ready, Hito-native transformation plan for the accepted modular-monolith
domain-boundary decision. The plan must make future changes naturally local to their business domain
and direct public contracts, without artificial reading limits, microservices, a generic framework,
or a second source of truth.

## Archive Intent

Retain through Product approval and the final implementation/QA handoff. The plan supports this
canonical item and never replaces its lifecycle.

## Task

Turn the completed architecture audit into a phased, dependency-safe execution plan. Define the
initial domain boundaries, public commands/projections, private internals, migration order,
contract/regression evidence, and rollback boundaries. Distinguish immediate code moves from
document/validator changes and future work; preserve the standalone runner Calendar model.

## User Report

Ivan wants the product divided into real business-process domains so that a feature touching one
domain reads and tests that domain plus its declared contracts only; an Epic or release alone runs
cross-product critical journeys. He wants to review and confirm the plan before implementation,
then have its execution proceed autonomously.

## Evidence

- The completed audit identifies concrete coupling in `training-api.ts`, `training.ts`, legacy
  plan-container vocabulary, identity classification, current documents, and aggregated Backend
  validation.
- The active roadmap already records the modular-monolith direction as the accepted architecture.
- The implementation-ready supporting plan is
  [Hito Modular Monolith Domain-Boundary Transformation](../../plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md).

## Observed Behavior

Current shared facades and legacy vocabulary force owners to read unrelated implementation and
proof paths before narrow work can be trusted.

## Expected Behavior

Each business context owns its truth, invariants, operations, projections, UI boundary, and focused
regression/contract evidence. Cross-context access is explicit and narrow; unaffected contexts are
protected by their accepted evidence rather than rediscovered per task.

## Required Discriminator

The plan must identify the smallest first transformation slice, its source-backed ownership and
consumers, and a safe sequence that never leaves duplicate authority or a compatibility projection
as the live product path.

## What Not To Touch

Do not implement source changes, migrations, fixtures, runtime, build, browser/QA, hosted state,
providers, Git lifecycle, Notion integration, or a repository-wide rewrite. Do not introduce a
new framework, tracker, registry, microservice, reading quota, or alternate runner/plan authority.

## Validation Expectations

- The detailed plan names exact source evidence and current owners for each proposed phase.
- Every proposed extraction states its public contract, deleted/superseded responsibility, proof,
  migration/rollback condition, and cross-owner handoff.
- Validate only task-local Markdown links, formatting, whitespace, and diff hygiene; preserve all
  unrelated dirty work.

## Stage

Architecture plan complete; Product/Ivan approval required before implementation

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Modular Monolith Domain-Boundary Transformation Plan
Stage: Architecture-plan authoring before Product approval
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-modular-monolith-domain-boundary-transformation-plan.md
Roadmap: docs/plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md
Evidence: docs/tasks/backlog/2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md

Ivan explicitly authorized autonomous plan authoring, but not implementation. Read AGENTS.md,
agents/architect.agent.md, skills/hito-architecture-audit/SKILL.md, the canonical item, roadmap,
and completed audit. Inspect only sources directly needed to turn the accepted decision into an
implementation-ready plan.

Create one supporting plan under docs/plans/active/ and update only it plus the canonical item.
Provide phased vertical slices with exact current seams/owners, public contracts, private internals,
consumer migration order, removals, domain-level and boundary-level proof, rollback/stop conditions,
and a clear first implementation handoff. Keep Hito a modular monolith; preserve standalone
runner-owned Calendar workouts; do not introduce microservices, generic frameworks, compatibility
projections, duplicate authority, Notion work, or reading quotas.

This is read-only architecture planning: no runtime source, migration, fixture, build, browser,
database, hosted, provider, Git, or implementation work. Preserve unrelated dirty bytes. Return the
plan to PRODUCT for Ivan's review and explicit approval before any implementation dispatch.
```

## Blockers

Planning is complete. Implementation is blocked on Product/Ivan approval of the detailed plan.

## ARCHITECT Tracked Planning Receipt — 2026-08-18

### Outcome And Decision

The supporting plan translates the accepted modular-monolith decision into six serial,
implementation-ready phases. It starts with one behavior-preserving BACKEND contract isolation,
then separates Runner Calendar from source provenance, narrows Result/Evidence, completes the
existing Progress Product contract, corrects Identity/Admin dependency direction, and only then
reduces the shared `training-api.ts`/`training.ts` facades from proven consumer evidence.

The plan preserves the standalone runner Calendar model and forbids active-plan replacement,
compatibility projections, dual authority, microservices, a generic framework, a dependency
registry, Notion work, reading quotas, and size-led rewriting. Commercial/finance, locale, Admin Work
Items, and Marketing remain unchanged until real Product work supplies a contract discriminator.

### Execution Preflight And Source Evidence

- **Role / mode / writable boundary:** ARCHITECT / Tracked planning. Only this canonical item and
  its one supporting plan were writable. No subagent was used.
- **Required sources:** `AGENTS.md`, `agents/architect.agent.md`, both matching skills, this item,
  the roadmap, completed domain audit, current owner receipts, and only the direct source/import
  seams needed for the sequence were read.
- **Git/release boundary:** branch `main`, local `HEAD` and local `origin/main` were
  `14ccfbfe8742d5d894e9629169a946d144a4d06f`; the index was empty. The release-admission item was
  already `blocked`, so no repository-wide freeze was active. No remote-freshness claim is made.
- **Concurrent preservation:** the separately created, ready hosted migration/deploy item was
  detected before the first write and remained outside this task. Runtime, source, migrations,
  fixtures, scripts, plans other than the new supporting plan, history, hosted state, providers,
  and Git lifecycle were not touched.
- **Discriminator:** the first slice moves five already accepted semantic sidebar DTO types from a
  493-line server-only query owner to one focused public contract, updates its two current owners,
  and removes the old exports without a compatibility re-export. It is the smallest current seam
  that proves the architecture rule without a behavior or cross-owner change.

### Phase And Owner Summary

| Phase | Outcome                                                                                     | Serial owner                                                             |
| ----- | ------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| 1     | Workout detail sidebar public contract isolated from server query internals                 | BACKEND                                                                  |
| 2     | Runner Calendar queries/mutations separated from source provenance/materialisation          | BACKEND -> FRONTEND Product if required -> QA if behavior changes        |
| 3     | Result/evidence DTO separated from storage/parser/provider internals                        | BACKEND -> FRONTEND Product if required                                  |
| 4     | Progress/DS/Product consumers use `runner-activity/product-contract.ts` only                | BACKEND -> FRONTEND Design System -> FRONTEND Product -> BACKEND -> QA   |
| 5     | Shared actor classification moves upstream of Admin and runner identity                     | FRONTEND Product -> BACKEND -> focused QA if observable behavior changes |
| 6     | Shared facades shrink from proven replacements; current-system truth follows implementation | BACKEND/consumer owner -> ARCHITECT -> Epic QA/release                   |

### First Implementation Handoff — Awaiting Ivan Approval

```text
ROLE: BACKEND

Task: Hito Workout Detail Sidebar Public Contract Isolation
Stage: Phase 1 of the approved modular-monolith domain-boundary transformation
Mode: Tracked
Parent architecture item: docs/tasks/backlog/2026-08-18-hito-modular-monolith-domain-boundary-transformation-plan.md
Supporting plan: docs/plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, the
canonical implementation item created by PRODUCT, the supporting plan's Phase 1, and the completed
Workout sidebar owner receipt. Preserve unrelated dirty bytes and stop if a release freeze is active.

Isolate the already accepted Workout detail sidebar DTO from its server-only query implementation.
Add `src/lib/workout-detail-sidebar-contract.ts` and move only
`WorkoutSidebarScheduledDistance`, `WorkoutSidebarRecordedDistance`,
`WorkoutSidebarWeekSummary`, `WorkoutSidebarLatestInsight`, and
`WorkoutDetailSidebarReadModel` into it. Update
`src/lib/workout-detail-sidebar-read-model.ts` and `src/lib/route-data-actions.ts` to consume the
new contract; keep database row picks, acquisition, eligibility, aggregation, and builder/test input
types private to the read-model implementation. Remove the moved semantic exports from the
server-only file and do not add a re-export, alias, fallback, compatibility path, or second query.

Keep runtime behavior and the DTO byte-for-byte equivalent. Do not change Frontend, route rendering,
database/schema/RLS/RPC, fixtures, providers, hosted state, dependencies, aggregate architecture, or
Git lifecycle. Run the existing Workout evidence/comparison proof, focused TypeScript/formatting,
reverse-import proof, and diff hygiene. Return to PRODUCT if DTO semantics or another owner must
change. Do not claim browser, Global QA, release, deployment, or production acceptance.
```

PRODUCT must present the plan to Ivan and receive explicit approval before creating/dispatching the
Phase 1 implementation item. This ARCHITECT item does not authorize implementation.

### Validation Inventory

| Check                                         | Result            | Evidence / consequence                                                                                                                                      |
| --------------------------------------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Task-local Markdown links                     | Passed            | All six local links in the two task-owned documents resolve.                                                                                                |
| Scoped formatting and whitespace              | Passed            | Scoped Prettier and direct trailing-whitespace checks passed.                                                                                               |
| Diff scope and unrelated preservation         | Passed            | Only the two task-owned files changed; the disjoint hosted-deploy item retained SHA-256 `9b149518ab71bc09e9e152125ff9d0663d7aa95f2f5925d9c33fcd4d97a17ebd`. |
| Runtime/build/browser/database/hosted/release | Not run by design | Architecture planning only; no implementation or acceptance is claimed.                                                                                     |

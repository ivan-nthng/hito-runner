# Hito Workout Detail Weekly Count Backend Contract Reduction

Work Item ID: `2026-08-18-hito-workout-detail-weekly-count-backend-contract-reduction`
Status: completed
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: runner-core-readiness
Parent: [Hito Workout Detail Static Right Panel And Query Elimination](./2026-08-18-hito-workout-detail-right-panel-removal-and-query-elimination.md)
Depends On: [Hito Workout Detail Right Panel Static Placeholder](./2026-08-18-hito-workout-detail-right-panel-visual-removal.md)
Evidence From: [Hito Workout Detail Sidebar Contract Isolation](./2026-08-18-hito-workout-detail-sidebar-contract-isolation.md)

## Scope

Reduce the existing Workout-detail sidebar provider to exactly the current-week completed and
scheduled workout counts consumed by the static right panel. Remove all unused distance, result,
FIT, and insight data work from that provider and its contract.

## Task

Keep only the Backend-shaped `completedWorkoutCount` and `scheduledWorkoutCount` readback needed by
`src/routes/workout.$date.tsx`. Delete the unused sidebar DTO variants, query selections, builders,
and loader responsibility without adding a second DTO, compatibility response, client calculation,
new query, schema change, or persistence path. Main Workout, Calendar, result, FIT, and source-plan
behavior remain unchanged.

## Stage

BACKEND count-only provider/query reduction completed; Phase 1 closure ready for PRODUCT.

## Next Recommended Role

PRODUCT

## Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Workout Detail Weekly Count Backend Contract Reduction
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-workout-detail-weekly-count-backend-contract-reduction.md
Parent: docs/tasks/backlog/2026-08-18-hito-workout-detail-right-panel-removal-and-query-elimination.md
Plan: docs/plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, this item,
and only these direct seams before acting:
- src/lib/workout-detail-sidebar-contract.ts
- src/lib/workout-detail-sidebar-read-model.ts
- src/lib/route-data-actions.ts
- src/lib/training-api.ts
- scripts/validate-workout-evidence-comparison.ts

Before the first production write, use the existing named ARCHITECT role as one bounded read-only
subagent. Its question is limited to: confirm the final count-only public contract, all direct
consumers of this sidebar provider, and the exact obsolete responsibility to delete. ARCHITECT must
read AGENTS.md, its role file, and skills/hito-architecture-audit/SKILL.md; it must not edit source,
task files, or run a broad audit. Integrate the result; do not create another implementation owner.

Outcome: the static right panel consumes only the existing Backend-shaped current-week
`completedWorkoutCount` and `scheduledWorkoutCount`. Remove every distance, result/FIT, insight,
and other sidebar DTO/query/builder/load responsibility. Keep no compatibility export, fallback,
second DTO, client calculation, new helper, new query, migration, schema/RLS change, fixture, or
provider path.

Preserve the main Workout route payload, authentication, Calendar/workout persistence, source
provenance, result upload/removal, FIT evidence, and all FRONTEND/DS files. Do not alter hosted
state, stage, commit, push, deploy, or run Global QA.

Use the existing focused validator and direct reverse-import/query proof; add only the smallest
task-owned test adjustment required for count-only behavior. Validate both a workout without a
result and a FIT-result case through existing proof where available. Run focused types, formatting,
and diff hygiene. Fix focused failures within this task. If a non-Workout consumer or material
product decision appears, return the exact boundary to PRODUCT; otherwise complete the item with an
English receipt and report the Phase 1 closure to PRODUCT.
```

## Blockers

None.

## Implementation Receipt — 2026-08-18

### Preflight And Outcome

- BACKEND executed this Tracked slice on `main` at
  `14ccfbfe8742d5d894e9629169a946d144a4d06f` with an empty index and preserved the existing dirty
  checkout boundary.
- The required read-only ARCHITECT review found one rendered consumer only:
  `src/routes/workout.$date.tsx`. It confirmed the final public shape as one
  `WorkoutDetailSidebarReadModel` containing only `week.scheduledWorkoutCount` and
  `week.completedWorkoutCount`; no unexpected owner or non-Workout consumer was found.
- The contract and provider now expose and acquire only those counts. The minimal existing FIT
  completion-membership read remains solely to preserve truthful completion counting; distance,
  actual-metrics, result-detail, and insight acquisition/projection were deleted.

### Changed And Removed Responsibility

- `src/lib/workout-detail-sidebar-contract.ts`: removed four obsolete semantic DTO exports and the
  insight dependency; retained one count-only public DTO.
- `src/lib/workout-detail-sidebar-read-model.ts`: reduced planned-workout and log selections,
  deleted actual-metrics and insight queries, pagination, projections, distance calculations, and
  related row/helper types; retained the existing count builder and provider seam.
- `scripts/validate-workout-evidence-comparison.ts`: reduced the sidebar proof to weekly counts,
  including no-result, manual-completion, FIT-completion, partial-FIT, rest, date, and user
  boundaries.
- No new runtime artifact, helper, query, compatibility export, fallback, or second DTO was added.

### Validation

| Check                         | Scenario / environment                                              | Result | Evidence                                                                            |
| ----------------------------- | ------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------- |
| ARCHITECT boundary review     | Direct provider/consumer reverse map                                | Passed | One Workout renderer; no unexpected consumer                                        |
| Existing focused validator    | `node --import tsx scripts/validate-workout-evidence-comparison.ts` | Passed | `Workout evidence comparison contract passed.`                                      |
| Obsolete contract/query proof | Targeted reverse search across the five direct seams                | Passed | No distance/insight DTO, actual-metrics query, insight query, or projection remains |
| Focused TypeScript            | Checkout `tsc --noEmit`, filtered to task-changed files             | Passed | Zero diagnostics in contract, read model, and validator                             |
| Formatting and diff hygiene   | Prettier plus `git diff --check`                                    | Passed | No formatting or whitespace errors                                                  |

The normal `npx tsx` CLI attempt was omitted as evidence because the managed sandbox rejected its
Unix IPC listener with `EPERM`; the distinct supported `node --import tsx` execution passed the same
validator. Repository-wide TypeScript remains red with 145 pre-existing diagnostics; the only
diagnostics in the named unchanged seams are four existing `training-api.ts` server-function typing
errors. Browser, database, hosted, schema, migration, fixture, Global QA, staging, commit, push,
deploy, and release checks were not run because this source-only Backend slice did not change or
authorize those layers.

### Preserved Boundaries And Return

- `src/lib/route-data-actions.ts`, `src/lib/training-api.ts`, the main Workout payload,
  authentication, Calendar/workout persistence, provenance, result upload/removal, FIT evidence,
  and all FRONTEND/Design System files remain unchanged by this slice.
- Phase 1 Backend contract reduction is complete. Return to PRODUCT to reconcile the parent and
  select the next approved phase; no release or Global QA claim is made.

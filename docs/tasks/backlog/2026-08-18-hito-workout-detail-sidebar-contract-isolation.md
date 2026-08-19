# Hito Workout Detail Sidebar Contract Isolation

Work Item ID: `2026-08-18-hito-workout-detail-sidebar-contract-isolation`
Status: completed
Type: Tracked
Priority: highest
Owner: BACKEND
Epic: platform-and-operations
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md), [Hito Workout Sidebar Week Summary And Latest Insight](./2026-08-15-hito-workout-sidebar-week-summary-and-latest-insight.md)

## Scope

Phase 1 of the approved modular-monolith transformation. Isolate the existing semantic Workout-detail
sidebar DTO from the server-only Supabase query owner. The shared route composer imports the public
contract; query rows, Supabase acquisition, precedence rules, eligibility, and proof builder types
remain private to the read-model implementation. This is a behavior-preserving dependency-direction
move only.

## Archive Intent

Retain through Backend completion and Product verification that the next sidebar consumer uses the
contract without reading the query implementation.

## Task

Add exactly one production contract file:
`src/lib/workout-detail-sidebar-contract.ts`. Move only
`WorkoutSidebarScheduledDistance`, `WorkoutSidebarRecordedDistance`,
`WorkoutSidebarWeekSummary`, `WorkoutSidebarLatestInsight`, and
`WorkoutDetailSidebarReadModel` into it. Update
`src/lib/workout-detail-sidebar-read-model.ts` to import that contract while retaining its private
row/builder proof types. Update `src/lib/route-data-actions.ts` to import only the contract.
Remove the moved semantic exports from the read-model file; do not add re-exports, aliases, fallbacks,
or a second query path.

## What Not To Touch

Do not change DTO fields/discriminants, rendered Workout behavior, route loading behavior, dynamic
server loading in `training-api.ts`, Calendar/source provenance, results/evidence, Progress,
fixtures, schemas, migrations, RLS, providers, hosted state, browser QA, Design System, or Git
release state. A need to touch any of these stops this slice and returns to PRODUCT.

## Validation Expectations

- Reuse `scripts/validate-workout-evidence-comparison.ts`.
- Run focused type/import checks and formatting for changed paths.
- Prove by reverse import search that `route-data-actions.ts` no longer imports the server-only
  read-model implementation.
- Prove the five semantic types are no longer exported from that implementation.
- Run diff hygiene and report exact changed production paths. No browser replay is required unless
  the DTO or rendered behavior changes.

## Stage

Phase 1 Backend provider/consumer contract isolation completed

## Next Recommended Role

PRODUCT

## Blockers

None.

## Implementation Receipt — 2026-08-18

### Preflight And Outcome

- Branch `main` remained at `14ccfbfe8742d5d894e9629169a946d144a4d06f`; the index was empty,
  and the four existing task owners were clean before implementation. Unrelated dirty documentation
  remained untouched.
- The demonstrated dependency problem was a shared route composer importing its semantic sidebar
  DTO from a module marked `server-only`, while the focused validator also consumed named database
  row proof types from that implementation.
- Added the one approved production owner, `src/lib/workout-detail-sidebar-contract.ts`, containing
  only the five unchanged semantic DTO exports. The read-model now imports those DTOs and keeps its
  database rows and builder input types private. `route-data-actions.ts` imports only the contract;
  no re-export, alias, fallback, dual query, or compatibility path remains.
- The existing validator derives its private fixture row shapes from the two builder signatures
  instead of importing implementation row types. `training-api.ts` remained byte-identical and its
  dynamic server loader is unchanged.

### Files Changed

- `src/lib/workout-detail-sidebar-contract.ts` — new semantic DTO owner.
- `src/lib/workout-detail-sidebar-read-model.ts` — private query/proof implementation consuming the
  contract.
- `src/lib/route-data-actions.ts` — contract-only type import.
- `scripts/validate-workout-evidence-comparison.ts` — private fixture-type inference for the existing
  proof.
- This canonical receipt only; no parent plan or other documentation was changed.

### Validation

| Check                      | Scenario / environment                                           | Result                   | Evidence                                                                                                                   |
| -------------------------- | ---------------------------------------------------------------- | ------------------------ | -------------------------------------------------------------------------------------------------------------------------- |
| Evidence comparison        | Existing `validate-workout-evidence-comparison.ts` via `tsx`     | Passed                   | `Workout evidence comparison contract passed.`                                                                             |
| Reverse dependency         | Repository import search                                         | Passed                   | Route composer imports only the contract; only the unchanged server loader and focused validator import the implementation |
| Export isolation           | Exact export search                                              | Passed                   | Contract exports exactly the five DTOs; implementation exports none of the moved semantic or named row/builder types       |
| Focused TypeScript         | Diagnostics filtered to the four changed source/validator paths  | Passed                   | Zero task-owned diagnostics                                                                                                |
| Formatting                 | Prettier check on all changed source/validator paths             | Passed                   | All matched files use Prettier style                                                                                       |
| Diff hygiene               | `git diff --check`, exact diff review, `training-api.ts` SHA-256 | Passed                   | No whitespace errors; dynamic loader file retained its preflight digest                                                    |
| Repository-wide TypeScript | Full `tsc --noEmit`                                              | Existing baseline failed | Diagnostics are outside the changed paths; four diagnostics remain in byte-unchanged `training-api.ts`                     |

### Preserved Boundaries And Return

DTO fields and discriminants, Supabase acquisition, eligibility/precedence, route behavior,
persistence, fixtures, schema/migrations/RLS, providers, hosted state, Design System, browser state,
Git, and release state were unchanged. Browser QA was omitted because no DTO or rendered behavior
changed. The existing repository-wide TypeScript baseline prevents a whole-checkout type-pass claim,
but it produced no diagnostic in a changed path.

Return to PRODUCT for Phase 1 verification and selection of the next approved transformation phase.

# Hito Stack Complexity Reduction Program

## Work Item ID

2026-08-04-hito-stack-complexity-reduction-program

## Status

backlog

## Type

plan

## Priority

medium

## Owner

product

## Scope

cross-stack-simplification

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Reduce demonstrated Hito Running complexity without changing the retained product stack, creating a
second truth path, or treating line count as proof of a defect. This is the canonical operational
record for cross-owner simplification work; each executable slice must remain separately owned and
evidence-gated.

## Stage

Frontend residue cleanup is complete. Backend Runner Activity optimization remains an independent
active stream and must not be interrupted by this program. The next cross-stack slice stays queued
until its owner is explicitly dispatched while idle.

## Target Stack

Retain one React/TanStack Start/Vite application, Supabase Auth/Postgres/Storage, Tailwind with Hito
DS and Radix, Zod, generated Supabase types, Nitro, and Vercel. Reject a framework migration,
microservices, GraphQL, a second state manager, a second backend, and a second product-data truth
unless a future measured requirement establishes a need.

## Current Evidence And Admission Rules

- Complexity is concentrated in broad owners, build/runtime coordination, proof tooling, and
  duplicated operational documentation, not in an excessive number of product frameworks.
- The legacy source-size plan is supporting history, not an operational queue. Its claim that
  `use-mobile.tsx` is unconsumed is stale: current Product consumers include onboarding and Progress.
- The initial zero-consumer review is closed: `IntervalsViz`, `weeklyMileage`, `statsTotals`,
  `@tanstack/react-query`, and `@radix-ui/react-progress` were removed with source, lockfile,
  build, runtime, and independent-QA proof. `date-fns` remains only as the required transitive
  dependency of `react-day-picker`.
- Large modules such as `training.ts`, `ManualWorkoutConstructorEditor.tsx`, `CompletionPanel.tsx`,
  and `workout.$date.tsx` require a demonstrated state, lifecycle, or ownership boundary before any
  extraction. `CompletionPanel.tsx` is concurrent Product work and excluded from this program until
  its owner closes it.
- iCloud checkout and custom Vite/Nitro workarounds require a measured build/runtime discriminator;
  do not replace or remove them from a source-only audit.

## Owner-Scoped Roadmap

| Slice | Owner | Outcome | Required proof | Stop condition |
| --- | --- | --- | --- | --- |
| 1. Frontend residue | Frontend Product | **Completed:** removed `IntervalsViz`, two unused `training.ts` exports, and two direct unused dependencies. `date-fns` remains only as the required transitive dependency of `react-day-picker`. | Consumer graph, dependency reverse scan, lint, build/integrity, loopback runtime/browser smoke, and independent QA passed. | Closed without touching live consumers or concurrent Product work. |
| 2. Build and proof surface | Architect with QA/tooling | Measure the canonical build path, decide which managed-runtime workarounds remain, and propose one small public verification command surface. | Current build traces, command-consumer inventory, independent review. | A proposal would alter the canonical runtime without a replacement proof. |
| 3. Broad module boundaries | Respective owner | Split only a demonstrated coherent lifecycle/state owner from a broad module. | Root-cause evidence, preserved contract replay, focused browser or runtime proof. | The work becomes a line-count-driven rewrite or crosses owners. |
| 4. Local auth and fixtures | Backend/auth | Simplify only after canonical local-auth, local Supabase, fixture, and runner-session ownership is reconciled. | Session/readback, isolation, cleanup, and browser proof. | A product-only fixture UI or second session truth would be introduced. |
| 5. Current-truth compression | Product/docs with Architect | Keep the backlog as the operational queue and reduce overlapping current documentation. | Link/status inventory and local-link validation. | A completed receipt or active item loses discoverability. |

## Existing Supporting Records

- [Source-size governance and cleanup plan](../../plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md) remains retained supporting history; it is not an execution queue.
- [Runner Activity Backend Optimization Plan](2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md) remains the separate Backend owner for accepted Runner Activity lifecycle optimization.

## Preserved Boundaries

Do not reopen accepted Runner Activity Gates 1-4, planned-workout projection reconciliation, FIT
ingestion truth, metric provenance, RLS/privacy, fixture isolation, or the generated-plan
preview/review/confirm lifecycle. Do not delete dependencies, exports, files, validators, fixture
paths, or compatibility behavior from size, age, or a stale document claim alone.

## Next Admission

The initial Frontend candidate is complete. No broad Frontend decomposition is admitted from this
result: `use-mobile`, `CompletionPanel`, large-module restructuring, build configuration, auth,
fixtures, and Backend-owned work remain outside the completed slice. The next program slice is
Architect measurement of the build/proof surface, but it remains queued until the active Backend task
has completed and the user explicitly dispatches it.

# Hito Stack Complexity Reduction Program

## Work Item ID

2026-08-04-hito-stack-complexity-reduction-program

## Status

in_progress

## Type

plan

## Priority

medium

## Owner

architect

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

Slice 5 is completed by the atomic release commit containing this receipt: explicit Product-facing
Progress and generated-preview DTOs replace accidental internal serialization, and Product receives
one `signals` comparison truth with strict historical normalization. The parent program remains
`in_progress` because `/hitoDS` representation reduction requires a separate Product decision and
documentation compression remains later documentation-only hygiene.

## Next Recommended Role

product

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Decide whether `/hitoDS` remains a production-shipped reference surface in the canonical Hito Stack
Complexity Reduction Program. Slices 1-5 are complete, but `/hitoDS` remains statically shipped and
linked from the Hub while current documentation also describes it as internal. Record one truthful
production role and the resulting Architecture/Design System admission boundary without implementing
the route or generated-manifest change in this Product decision slice.

Approval policy: Routine source inspection and Product documentation proceed under standing
authorization. Implementation and external mutation remain separately owned.
```

## Target Stack

Retain one React/TanStack Start/Vite application, Supabase Auth/Postgres/Storage, Tailwind with Hito
DS and Radix, Zod, generated Supabase types, Nitro, and Vercel. Reject a framework migration,
microservices, GraphQL, a second state manager, a second backend, and a second product-data truth
unless a future measured requirement establishes a need.

## Current Evidence And Admission Rules

- Complexity is concentrated in broad owners, build/runtime coordination, proof tooling, and
  duplicated operational documentation, not in an excessive number of product frameworks.
- The maintained-text baseline at `dec2e226387bbc71985a593cbc3dd8d3f7cd36d7` is 768 files and
  233,646 lines: `src/` owns 114,251, `scripts/` 43,224, `docs/` 52,723, and `supabase/` 5,078.
  The live dirty tree is larger, but it mixes several accepted and concurrent scopes and is not a
  deletion manifest.
- The application has one reachable framework chain: React -> TanStack Start/Router -> Vite ->
  Nitro -> Vercel, with Supabase, Tailwind/Radix, and Zod. No second application framework,
  backend, ORM, state manager, or test framework is present.
- `@lovable.dev/vite-tanstack-config` is the only demonstrated framework-convergence candidate. Its
  sole repository consumer is `vite.config.ts`; despite `cloudflare: false`, it owns the optional
  Cloudflare/Wrangler/Miniflare/Workerd graph and `lovable-tagger`, which brings Tailwind 3 beside
  canonical Tailwind 4. It may be removed only through direct-config replacement and build,
  development, loopback-runtime, and Vercel parity proof. Nitro remains canonical.
- A zero direct-import count is not deletion proof for compiler, generated-type, or wrapper-owned
  packages. Direct Vite/TanStack/React/Tailwind/path plugins remain intentional inputs to a future
  wrapper replacement.
- Proof sprawl is custom code, not an extra test framework: the live tree has 86 script files and
  about 43,621 lines, with 46 files using `node:assert` and no Vitest, Jest, Playwright, Cypress, or
  Mocha dependency. Consolidate entrypoints and shared lifecycle owners before considering another
  framework.
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

## Complexity Budget And Retirement Rule

- Reuse a reachable canonical owner before adding a dependency, helper, validator, fixture,
  generated representation, or operational document.
- Every implementation slice must name what becomes smaller or disappears. A new permanent layer is
  admitted only when a measured requirement cannot be met by an existing owner.
- Count product runtime, generated code, proof tooling, and retained evidence separately. Line count
  identifies an audit target; it never proves dead code or a defect.
- Keep operation-specific safety contracts separate. Shared serialization, metadata, fixture,
  runtime, and lifecycle plumbing belongs in the existing shared owner only after consumer parity is
  proven.
- Do not trade away persistence readback, privacy/RLS, cleanup, browser behavior, release parity, or
  historical evidence to improve a size metric.

## Verified Reuse And Retirement Inventory

| Surface                 | Verified owner or finding                                                                                                                                                                                  | Decision                                                                                                                                                                                                                                                               |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend validation      | `scripts/validate-backend.mjs` is the correct thin group manifest; shared runtime, test-user, persistence, Runner Activity, and generated-plan helpers have multiple consumers.                            | Integrate the manifest and its four currently untracked canonical helpers with their importing changes before further proof cleanup. Reconcile its live 13 default / 16 local-db / 15 runtime / 16 release / 21 combined inventory against stale 18/17 receipt counts. |
| QA server commands      | Bare `qa:server` has zero consumers and is semantically identical to documented `qa:server:status`.                                                                                                        | Retire the alias after the active package-manifest bundle is integrated and source checks reconfirm zero consumers.                                                                                                                                                    |
| Local account fixtures  | `scripts/fixtures/` is empty, while four proofs name `scripts/fixtures/local-auth-users.json`; the canonical registry is `.tanstack/hito-running-local-accounts.json`.                                     | Prove whether the environment setting is read, then remove the dead setting or route it to the existing registry. Do not recreate a second fixture.                                                                                                                    |
| Manual Workout metadata | `src/lib/active-plan-workout-editing/policy.ts` has ten consumers, but Add/Edit/Move/Delete repeat JSON conversion and the same manual-plan metadata shell; Copy/Edit/Move repeat `inputHasClientPayload`. | After the current TanStack server-function migration is integrated, move only shared metadata/JSON plumbing into this existing policy owner. Preserve every operation-specific review, stale, protected-history, transaction, and persisted-payload contract.          |
| Build lifecycle         | Eight live build/QA lifecycle files retain required iCloud/Nitro coordination but repeat generated-sibling conflict helpers and PID liveness checks.                                                       | Reuse one existing tooling helper only after call-site parity; do not remove the lifecycle workaround from static inspection.                                                                                                                                          |
| Hito DS manifests       | One generator emits a 712-line TypeScript manifest used by three runtime consumers and an 874-line JSON manifest used by one validator.                                                                    | Design System may converge to one generated representation after consumer and validator parity. This is a separate DS-owned slice.                                                                                                                                     |
| Orphan proofs           | Two unique Frontend Product proofs and one tooling artifact-hygiene proof have no package, import, or current-doc entrypoint.                                                                              | Retain and assign them to their existing Frontend Product and Architecture/tooling validation owners before any move or deletion.                                                                                                                                      |
| `/hitoDS` and DevTools  | DevTools is lazy and loopback-gated; `/hitoDS` is statically shipped although documentation calls it internal.                                                                                             | No deletion is admitted. Product must decide whether `/hitoDS` is a production route before Architecture can reduce this surface.                                                                                                                                      |

## Owner-Scoped Roadmap

| Slice                                    | Owner                          | Outcome                                                                                                                                                                                                        | Required proof                                                                                                                                               | Stop condition                                                                                                                                         |
| ---------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1. Frontend residue                      | Frontend Product               | **Completed:** removed `IntervalsViz`, two unused `training.ts` exports, and two direct unused dependencies. `date-fns` remains only as the required transitive dependency of `react-day-picker`.              | Consumer graph, dependency reverse scan, lint, build/integrity, loopback runtime/browser smoke, and independent QA passed.                                   | Closed without touching live consumers or concurrent Product work.                                                                                     |
| 2. Backend runtime and proof convergence | Backend                        | **Implemented locally under its separate canonical backlog item:** npm-only toolchain, one Backend validation manifest, shared proof/runtime helpers, local-account registry, and selected response narrowing. | Exact source-control manifest, truthful manifest inventory, source/local-db/runtime groups, release-only parity under release authority, and independent QA. | Any untracked canonical helper, stale receipt count, missing import, failed group, or mixed concurrent hunk keeps the slice open.                      |
| 3. Lovable wrapper convergence           | Backend/tooling                | Replace the single managed Vite wrapper with direct configuration of the already retained plugins; remove only wrapper-owned dependency residue proven absent from the regenerated graph.                      | Lockfile ownership diff, dev server, production build/integrity, built loopback runtime, Vercel parity, and independent review.                              | Do not start until active package/build changes are integrated; stop if external Lovable-editor behavior or deployment parity lacks replacement proof. |
| 4. Manual Workout metadata reuse         | Backend                        | Consolidate only repeated metadata/JSON plumbing into the existing active-plan editing policy owner.                                                                                                           | Exact clone removal, operation-contract validator, local-DB persisted readback, build/lint, and independent QA.                                              | Do not start while Add/Copy/Edit/Move/Delete are concurrently dirty or if operation-specific safety would be generalized.                              |
| 5. Proof and build helper retirement     | Backend/tooling with Architect | Retire the zero-consumer QA alias and dead fixture-path settings; converge repeated build lifecycle helpers without removing required iCloud/Nitro behavior.                                                   | Consumer scan, machine-listed validator groups, fixture-registry parity, build/runtime evidence, and scoped diff hygiene.                                    | Unique assertions, missing release integration, or an unproven runtime workaround remain retained and explicitly owned.                                |
| 6. Design System representation          | Design System                  | Decide production ownership of `/hitoDS`, then converge duplicate generated manifest representations if retained consumers can use one truth.                                                                  | Product decision, route/build proof, runtime and validator consumer parity, DS QA.                                                                           | No Product route decision or loss of reference/validator behavior.                                                                                     |
| 7. Current-truth compression             | Product/docs with Architect    | Keep the backlog as the operational queue and reduce overlapping current documentation.                                                                                                                        | Link/status inventory and local-link validation.                                                                                                             | A completed receipt or active item loses discoverability.                                                                                              |

## Existing Supporting Records

- [Source-size governance and cleanup plan](../../plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md) remains retained supporting history; it is not an execution queue.
- [Runner Activity Backend Optimization Plan](2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md) remains the separate Backend owner for accepted Runner Activity lifecycle optimization.
- [Backend runtime contract and proof simplification](2026-08-04-backend-runtime-contract-and-proof-simplification.md) owns the already implemented local npm/runtime/proof convergence and its release boundary; this program must not duplicate or absorb it.

## Preserved Boundaries

Do not reopen accepted Runner Activity Gates 1-4, planned-workout projection reconciliation, FIT
ingestion truth, metric provenance, RLS/privacy, fixture isolation, or the generated-plan
preview/review/confirm lifecycle. Do not delete dependencies, exports, files, validators, fixture
paths, or compatibility behavior from size, age, or a stale document claim alone.

## Next Admission

Slice 5 is closed by its atomic release receipt. The next boundary is the explicit Product decision
for Slice 6: whether `/hitoDS` remains a production-shipped reference surface. No Design System route
or generated-representation implementation is admitted before that decision. Documentation hygiene
remains later work; no broad rewrite, framework migration, new queue, or line-count deletion is admitted.

## Slice 5 Closure Receipt

- Backend now projects explicit Product DTOs at the existing Activity History, factual Progress,
  activity-mutation, and generated-preview response owners; canonical lineage and reviewed-plan
  truth remain internal to their existing owners.
- Product consumers use those DTOs directly. Generated preview no longer receives the full canonical
  reviewed draft, Progress no longer imports the internal read model, and workout comparison has no
  live `facts` fallback.
- New comparison writes and Product readback use `signals` only. The evidenced exact historical dual
  representation normalizes to `signals`; facts-only, contradictory, duplicate, malformed, and
  extra-key forms reject without repair or hosted-data rewriting.
- Provider-shaped preview, signed review/confirm, local persistence/RLS, representative and
  3,000-activity read models, Gate 4, comparison carry-forward, payload/privacy, production build,
  Vercel parity, built loopback runtime, desktop and exact 375px light/dark Product QA,
  keyboard/focus, failure/retry, and independent source review passed. Provider calls and hosted
  data/schema mutations were neither required nor performed.
- The exact atomic release excludes concurrent `AGENTS.md` and build-finalizer work. Global QA
  remains separate; this receipt closes only the Slice 5 owner-level and integrated release boundary.

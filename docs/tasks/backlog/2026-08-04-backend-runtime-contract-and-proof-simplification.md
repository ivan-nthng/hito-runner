# Backend Runtime Contract And Proof Simplification

## Work Item ID

2026-08-04-backend-runtime-contract-and-proof-simplification

## Status

completed

## Type

plan

## Priority

medium

## Owner

backend

## Scope

cross-stack-simplification

## Frontend Lane

product

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task And Decision

Reduce demonstrated Backend runtime, API, proof, and local-infrastructure complexity without
changing accepted product behavior or adding a second truth path. The accepted React, TanStack
Start, Vite, Nitro, Supabase, Zod, FIT, and Vercel stack was retained; framework migration,
microservices, GraphQL, caching, and a second persistence or test model were not supported by the
evidence.

The cleanup preserved one provider/compiler/review/confirm path, canonical activity and revision
truth, canonical WorkoutDocument/import/export truth, and one discoverable Backend validation
surface. File size alone was never deletion evidence.

## Completed Outcome

- Added one explicit Backend validation manifest with separate source, local-database,
  built-runtime, and release groups. The shared Runner Activity proof runtime became deliberate
  tracked proof source; repeated fixture/review setup and the superseded source-regex proof were
  removed without collapsing unique assertions.
- Narrowed FIT upload/remove and other Product-facing response boundaries to consumed fields,
  removed an unnecessary activity-readback query, consolidated local-auth account parsing, and
  preserved loopback, logout, runner/admin separation, privacy, and provider isolation.
- Deleted zero-consumer entitlement enforcement source and the stale Bun toolchain truth while
  retaining migrations, tables, Admin analytics, and QA support with live consumers. Npm remained
  the sole package-manager owner; the dependency graph fell by 59 packages.
- Migrated 36 deprecated TanStack server-function declarations, removed 39 false exports, one
  duplicate Gate 4 invocation, unreachable imported-plan constants, and duplicate manual proof
  cases. Contradictory comparison representations now fail closed.
- Removed two demonstrated runtime import cycles through pure existing owners and deleted a
  duplicate Progress route-data helper. The final executable runtime/proof change was net `-26`
  maintained lines; the accepted result was ownership simplification, not a line target.

## Canonical Sources And Evidence

- [Hito Stack Complexity Reduction Program](./2026-08-04-hito-stack-complexity-reduction-program.md)
- [Runner Activity Backend Optimization Plan](./2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md)
- [Hito Source-Size Governance And Cleanup Plan](../../plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md)
- [Current Functional Map](../../current-functional-map.md)

The coordinated Frontend Product DTO/comparison cutover was subsequently released through
`5e0edd48d4d7676470d7bed4cc24ae268996ef26` and is not an unfinished slice of this plan.

Two accepted Runner Activity least-privilege migrations were applied to the linked production
project after ordered hash/ledger proof. Hosted history was `33/33`; direct authenticated/public
grants and policies on private activity/projection tables were zero, while expected service-role
operations remained available. A read-only hosted comparison inventory found one exact canonical
dual-representation row and no unsupported, contradictory, duplicate, or identity-mismatched row;
no hosted runner payload was retained in evidence.

## Validation Level

- `validate:backend:local-db`: 16 accepted persistence, authoring, activity, RLS/privacy, cleanup,
  and 3,000-activity scale checks passed.
- `validate:backend:runtime`: 15 built-loopback response, auth, provider-isolation, and activity
  lifecycle checks passed.
- Fresh Vite/Nitro production build, output integrity, focused lint/formatting, and diff hygiene
  passed. Independent review findings were integrated.
- Provider/compiler/review/confirm, manual authoring, FIT, Runner Activity Gates 1/2/4,
  import/export, privacy, and historical readback coverage remained distinct.
- Global QA Acceptance remained a separate gate and was not claimed by this cleanup record.

## Residual Boundary

`training.ts`, active-plan legacy-log recovery, lower-level export hardening, public/server
environment separation, Lovable/Cloudflare integration, and semantically distinct provider/FIT/
auth/proof owners were retained because deletion or consolidation evidence was insufficient. Any
future feature, legacy-data retirement, toolchain removal, or cross-owner hardening is separate
work, not an unfinished lifecycle slice here.

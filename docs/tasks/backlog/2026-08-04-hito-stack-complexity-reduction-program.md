# Hito Stack Complexity Reduction Program

## Work Item ID

2026-08-04-hito-stack-complexity-reduction-program

## Status

completed

## Type

plan

## Priority

high

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
second truth path, or treating line count as proof of a defect. This item is the canonical record for
the admitted cross-owner cleanup sequence; completed child receipts and Git history retain execution
detail.

## Stage

Slices 8A-8H are closed. Backend/security and Slices 8A-8G are released; Slice 8H reconciles current
documentation and safe backlog metadata in the source-control closeout containing this receipt. The
blocked FIT Product presentation, Global QA, Local Inspector evidence, Product decision gates, and
Developer Velocity implementation remain separate and are not accepted by this completion.

## Closure Decision

The admitted cleanup queue is complete. Every admitted executable slice either removed a
source-proven obsolete owner, converged an exact duplicate into an existing owner, made retained proof
discoverable, or recorded that no safe Product source change existed. Slice 8H restores current docs
to current truth and closes this parent without inventing another framework, queue, or migration
program.

This status means `8A-8H cleanup completed`. It does not mean broad Product acceptance or Global QA.
Remaining Product decisions, blocked browser evidence, and future capability work stay in their own
canonical backlog items.

## Retained Stack Decision

Keep one React/TanStack Start/Router -> Vite -> Nitro -> Vercel application with Supabase
Auth/Postgres/Storage, Tailwind, Radix-backed Hito DS primitives, Zod, generated Supabase types, and
the npm/TypeScript toolchain. Current evidence does not justify a framework migration, service split,
GraphQL layer, ORM, second state manager, second backend, or second test framework.

Large reachable owners, migration history, operation-specific safety contracts, generated
representations with distinct consumers, managed QA/runtime infrastructure, and public `/hitoDS`
remain intentional. Size alone is not deletion proof.

## Released Foundation Boundaries

| Boundary                                                                                   | Release              | Retained truth                                                            |
| ------------------------------------------------------------------------------------------ | -------------------- | ------------------------------------------------------------------------- |
| Backend runtime/proof cleanup                                                              | `79d5c85`            | One Backend validation manifest and shared runtime/proof owners           |
| Lovable wrapper convergence                                                                | `cca4f7c`            | Direct Vite/TanStack configuration; Nitro dependencies remain intentional |
| Proof/build helper cleanup                                                                 | `809644d`            | Ambiguous proof aliases retired; iCloud/Nitro finalization retained       |
| DTO/comparison cutover                                                                     | `5e0edd4`            | Explicit Product DTOs and one `signals` comparison representation         |
| Hito DS public-reference alignment                                                         | `96ce0d6`, `92b3a32` | Public `/hitoDS`, Product isolation, and distinct parity-proven manifests |
| [Backend codebase reduction](2026-08-05-backend-codebase-reduction-cycle.md)               | `c0e4a29`            | Zero-consumer and exact-duplicate Backend cleanup only                    |
| [Backend FIT completion lifecycle](2026-08-05-planned-workout-fit-completion-lifecycle.md) | `e5939bd`            | Exact current running-evidence chain can establish Backend completion     |
| [Product API hardening](2026-08-05-product-api-request-boundary-hardening.md)              | `5a9debb`, `87bb2f3` | Auth-before-body and runner-safe public failures                          |

These releases are ancestors of the 8H starting baseline `d5dccef`. They are not reopened by this
documentation closeout.

## Slices 8A-8H

| Slice                                                                                              | Owner                 | Release / lifecycle        | Accepted outcome                                                                                                  |
| -------------------------------------------------------------------------------------------------- | --------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------- |
| [8A Admin lifecycle projection](2026-08-05-admin-backlog-lifecycle-convergence.md)                 | Backend/Admin tooling | `0630edd`, completed       | Deleted the deprecated dashboard generator/aliases and made backlog documents the only dispatchable mirror source |
| [8B source-size machinery](2026-08-05-source-size-ledger-retirement.md)                            | Backend/tooling       | `df796cc`, completed       | Deleted the zero-reader writer, alias, and generated ledger; Git retains history                                  |
| [8C neutral selection mechanics](2026-08-05-hito-ds-neutral-selection-mechanics.md)                | Design System         | `726933f`, completed       | One neutral Tabs/Radio mechanics owner; component semantics remain separate                                       |
| [8D workbench controls/proof](2026-08-05-hito-ds-workbench-controls-and-validation-convergence.md) | Design System         | `df939e7`, completed       | One reference settings owner and one package-reachable DS proof owner                                             |
| [8E generated-plan setup state](2026-08-05-generated-plan-setup-state-convergence.md)              | Frontend Product      | `c850655`, completed       | One setup-state owner; first-plan and replacement lifecycles remain separate                                      |
| [8F Product module-public seams](2026-08-05-product-module-public-seam-reduction.md)               | Frontend Product      | `6a9dc9f`, completed       | Audit found no safe Product source removal; live seams were retained                                              |
| [8G Product proof reachability](2026-08-05-product-contract-proof-reachability.md)                 | Frontend Product      | `d5dccef`, completed       | Existing unique Product proofs became discoverable through one entrypoint                                         |
| 8H current-truth compression                                                                       | Architect/docs        | completed by this closeout | Current docs, parent status, safe canonical metadata, history, and successor eligibility reconciled               |

## Released Cleanup Accounting

The 8A-8G boundary `87bb2f3..d5dccef` must be read by maintained category, not by one headline line
count:

| Maintained category                           | Additions | Deletions |      Net |
| --------------------------------------------- | --------: | --------: | -------: |
| Product / Design System runtime source        |       412 |       483 |      -71 |
| Scripts, validators, and package tooling      |       536 |     1,179 |     -643 |
| Documentation, excluding the generated ledger |       690 |        41 |     +649 |
| Generated line-count ledger                   |         0 |       156 |     -156 |
| Lock artifacts                                |         0 |         0 |        0 |
| **Total maintained diff**                     | **1,638** | **1,859** | **-221** |

This is a net maintained reduction, but not every slice is a code reduction:

- 8C reduced runtime source by 2 lines while its total maintained diff grew by 287 lines because
  recurrence validation and the canonical receipt were added.
- 8D reduced runtime source by 75 lines while its total maintained diff grew by 269 lines for the
  same ownership/proof reason.
- 8E added 6 runtime lines and 72 maintained lines while removing duplicated state ownership.
- 8F was documentation-only and deliberately changed no executable source.
- 8G added one discoverable validator entrypoint and its receipt; it was not a runtime reduction.

Accordingly, 8C-8G are described as ownership, lifecycle, or proof convergence where appropriate.
Only evidence-backed category and total-maintained measurements support a reduction claim.

## Slice 8H Closure Receipt

- [Current state](../../current-state.md) is reduced from 644 to 78 lines and now contains only the
  released baseline, current Product truth, truthful unavailable/blocked boundaries, backlog-only
  operational ownership, and canonical references.
- [Current system](../../current-system.md) is reduced from 592 to 153 lines and now contains the
  retained stack, authority, canonical data/lifecycle owners, validation owners, invariants, and
  truthful unavailable states.
- Release chronology and technical detail remain discoverable in child backlog receipts, Git, and
  the [technical log](../../history/technical-log.md). The log now carries compact 8E-8H and Backend
  FIT entries; the public changelog is unchanged because no new public capability or Global QA is
  accepted here.
- Ten clean canonical metadata records were repaired without changing their lifecycle outcome.
  Importer dry-run has zero duplicate IDs/concepts and one explicit remaining malformed item: the
  untracked blocked FIT Product record, preserved byte-for-byte under its concurrent Frontend Product
  owner.
- `current-functional-map.md` remains byte-identical and belongs exclusively to the Developer
  Velocity successor.
- No runtime, UI, CSS, API, schema, migration, package dependency, validator behavior, fixture,
  generated artifact, provider, hosted data, or deployment state changed.

## Separate Blocked And Decision Boundaries

- FIT-backed planned-workout Product presentation remains `blocked` in the uncommitted record at
  `docs/tasks/backlog/2026-08-05-fit-backed-planned-workout-product-presentation.md`. Backend FIT
  completion is accepted, but no approved browser attached the safe FIT fixture through the native
  file input; no FIT bytes, completed upload request, or runner-facing end-to-end readback was
  proven. The untracked record and candidate source remain outside this release.
- Runner Activity Gate 5 and provider sync remain future work. Gate 5 continues to report
  `normalized_stream_not_persisted`.
- Canonical Loopback Local Inspector Availability remains `in_progress` under Frontend DevTools until
  task-specific loopback and non-loopback browser proof passes.
- Product must decide whether advanced artifact archive/compression remains supported before that
  capability can be reduced.
- Product + Running Coach + Design System must decide whether the public Workout Library retains all
  32 identities before any representation reduction.
- Global QA remains whatever each child receipt states; parent closure does not promote pending
  owner-level evidence into Global QA Acceptance.

## Operational Queue And Successor

`docs/tasks/backlog/` remains the only operational task queue. Supporting specs, briefs, plans,
current documents, dashboards, technical history, and Admin mirrors do not dispatch work.

With this parent complete,
[Developer Velocity And Proportional Verification](2026-08-05-developer-velocity-and-proportional-verification.md)
becomes the next `ready` Architect-owned item. It may refresh `current-functional-map.md`, reconcile
the proportional verification matrix with existing policy, and measure the current local feedback
loop. No Developer Velocity implementation was started by Slice 8H.

## Preserved Concurrent Work

The 8H source-control manifest excludes and preserves byte-for-byte:

- `AGENTS.md`;
- `scripts/finalize-build-output.mjs`;
- the blocked FIT Product backlog record;
- `scripts/validate-runner-activity-foundation.ts`;
- `src/components/CompletionPanel.tsx`;
- `src/components/TodayHero.tsx`;
- `src/lib/training-api.ts`;
- `src/lib/training.ts`;
- `src/routes/workout.$date.tsx`.

No source or lifecycle conclusion may be inferred from those concurrent diffs in this receipt.

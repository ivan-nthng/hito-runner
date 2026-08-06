# Developer Velocity And Proportional Verification

## Work Item ID

2026-08-05-developer-velocity-and-proportional-verification

## Status

backlog

## Type

plan

## Priority

high

## Owner

product

## Scope

scripts-validators-qa-infrastructure

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Make ordinary Hito changes fast to navigate and verify without weakening persistence, auth,
provider, FIT, schema, browser, or release evidence. Reuse the existing functional map, Vite,
managed QA runtime, validators, and `AGENTS.md` policy; do not introduce a second map, runtime, test
framework, or process layer.

## Stage

The [Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)
is complete and remains closed. Backend Slice 1, Managed QA source freshness and phase timings,
completed at `4568f04`; Architect Slice 2, Patch Pack and Fast Visual Lane policy, is complete.
No real evidence-backed Product visual Pack is admitted today, so this parent is retained as
`backlog` rather than falsely ready. The blocked FIT Product presentation and its native
file-attachment gate remain separate and uncommitted.

## Next Recommended Role

product

## Historical Slice 2 Handoff

```text
ROLE: ARCHITECT

Task:
Implement Developer Velocity Slice 2: the canonical Patch Pack and Fast Visual Lane operating
contract without creating another task system, runtime, or validation framework.

Stage:
ARCHITECT documentation and execution-policy implementation with independent review.

Canonical child:
docs/tasks/backlog/2026-08-06-developer-velocity-patch-pack-fast-visual-lane.md

Required outcome:
Use the existing functional map, managed QA lifecycle, direct Vite iteration, and AGENTS evidence
policy to make one bounded same-owner visual adjustment pack executable without broad rediscovery or
weaker acceptance evidence. Keep the first real Product pack unselected until an existing
evidence-backed item qualifies.

Boundaries:
Do not change runtime, Product behavior, APIs, schemas, fixtures, providers, deployment, or the
blocked FIT browser-evidence task. Preserve concurrent dirty work. Do not stage, commit, push,
deploy, mutate hosted state, or call providers.

Definition of Done:
One canonical same-owner visual Pack convention selects narrow proof, fixture/context reuse, and
escalation without another task registry or a weaker acceptance boundary. The first real Product
pilot remains unselected until an existing evidence-backed item qualifies. Global QA Acceptance is
not claimed.

Approval policy:
Routine local inspection, documentation edits, independent review, and validation proceed under
standing authorization. Do not request routine approval. Do not stage, commit, push, deploy, mutate
hosted state, or call providers.
```

## Root Cause And Current Measurements

The demonstrated root cause is distributed navigation plus managed-runtime freshness ambiguity, not
framework count and not Vite/HMR performance. `AGENTS.md` already owns risk-based evidence rules;
package scripts already expose the needed validators.

| Measured loop                          | Current result                                                                                                                                                                                             | Architectural consequence                                                                                                                                      |
| -------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership/navigation before this slice | `current-functional-map.md`: 253 lines, 13 sections, four tables, stale 2026-07-21 status, zero references to the four canonical Product/DS/Backend/dev entrypoints; `/progress` required five source hops | Refresh the one existing map; do not create another registry                                                                                                   |
| Ownership/navigation after this slice  | 94 lines, five sections, one route/owner/verifier table and one command legend                                                                                                                             | A normal lookup starts from one row and then confirms live reachability                                                                                        |
| Approval wait                          | The earlier reported approximately 2,462-second first render included a user-facing approval wait                                                                                                          | Invalid performance evidence; excluded from every recommendation                                                                                               |
| Direct Vite, two no-approval starts    | Ready in 1.122 seconds and 1.024 seconds                                                                                                                                                                   | Retain Vite; no dev-framework change is justified                                                                                                              |
| First browser render without approval  | `/hitoDS/components`: 4.031 seconds on the first measured dependency-cache state and 0.275 seconds after restart with warm cache                                                                           | Observed cache-sensitive range, not a demonstrated major bottleneck                                                                                            |
| Normal HMR without approval            | 1.251 seconds to module update; 1.429 seconds through CSS update                                                                                                                                           | Retain direct HMR for iteration                                                                                                                                |
| Targeted built-browser proof           | 1.454-second navigation, 0.085-second DOM snapshot, 0.031-second exact heading assertion                                                                                                                   | Reuse the managed runtime for focused acceptance; response time is not the main delay                                                                          |
| Focused source checks                  | file ESLint 1.24 seconds; Product contract 0.48 seconds; DS contract 0.27 seconds                                                                                                                          | Run the affected owner check, not unrelated global suites                                                                                                      |
| Backend source group                   | 13 checks in 17.57 seconds                                                                                                                                                                                 | Use affected validator first; use the group for shared source boundaries                                                                                       |
| Higher-risk group reach                | `B:DB` 16 checks, `B:RT` 15, `B:REL` 16 by read-only manifest listing                                                                                                                                      | Retain deeper groups only when the changed contract reaches them; no duration is claimed because DB/runtime/release groups were not executed in this docs task |
| Managed build-to-ready evidence        | Artifact mtimes show a 55.486-second build-output lower bound; recorded finalized artifact to server start is 8.544 seconds                                                                                | One truthful reuse can avoid at least 64.030 seconds; stale reuse remains forbidden                                                                            |
| Managed status                         | 0.33 seconds in the current checkout                                                                                                                                                                       | Source-aware freshness must stay at or below 1.0 second per run                                                                                                |

The original build figures are filesystem/recorded lower bounds, not a direct end-to-end build timer.
[Managed QA Source Freshness And Phase Timings](2026-08-06-managed-qa-source-freshness-and-phase-timings.md)
now provides the direct phase-timing receipt for later optimization decisions.

## Proportional Verification Matrix

This table selects existing proof; it does not replace `AGENTS.md` Definition-of-Done, independent
review, browser, or release policy.

| Change class                                               | Required first proof                                                                                                                                                               | Proof retained only when reached                                                                            |
| ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| Documentation only                                         | `DOC`: backlog metadata/importer when applicable, links, Prettier, scoped diff                                                                                                     | No Product runtime, browser, DB, provider, or build                                                         |
| Product presentation                                       | owner/source reachability, affected-file ESLint, Vite HMR iteration, targeted states/viewports, independent QA; `PC` when its contract changes                                     | One fresh build before browser-visible acceptance/integration; no Backend DB/provider matrix unless reached |
| Shared Design System                                       | `DS`, representative Product and `/hitoDS` browser proof, independent DS QA                                                                                                        | Manifest parity only when its source/projection changes; no unrelated Backend matrix                        |
| Backend/public contract without persisted-lifecycle change | affected leaf validator; `B:S` for a shared source boundary; exact consumer/route proof when public output changes                                                                 | Fresh managed runtime when transport/readback changes; DB/RLS only when data access is reached              |
| Persistence, auth, FIT, schema, provider                   | targeted source plus `B:DB` / `B:RT`, readback, RLS/privacy, isolation, and cleanup appropriate to the contract                                                                    | Provider/deployment/schema parity only when reached; no evidence downgrade for speed                        |
| Release integration                                        | exact manifest and remote parity; add `B:REL` or equivalent fresh build/integrity plus already-required browser/runtime evidence when the manifest reaches executable/build output | Documentation-only release uses `DOC`; no unrelated global ceremony                                         |

There is no standalone canonical `typecheck` command. Do not claim file-scoped TypeScript proof;
current integration typing is exercised by the affected validator/import boundary and required build.

## Architecture Slice Receipt

- [Current functional map](../../current-functional-map.md) now owns concise route -> presentation
  owner -> truth owner -> verifier navigation and current service-domain slugs.
- Historical cleanup rules, future-feature inventories, supporting-plan lists, and duplicated
  evidence policy were removed from that map; their canonical owners remain current docs, backlog,
  `AGENTS.md`, history, and Git.
- Direct Vite, the managed QA server, Backend validation groups, Product/DS validators, build
  integrity, and the single application stack are retained.
- No runtime, API, UI, CSS, schema, migration, package, fixture, provider, deployment, or hosted-data
  behavior changed.
- Admin presentation ownership remains an explicit Product/Architecture decision; Backend/Admin
  tooling remains its truth owner. Historical Scope normalization is not invented in this slice.

## Completed Slice 1: Managed QA Source Freshness And Phase Timings

Backend/tooling completed the source-aware managed QA lifecycle in `4568f04`. Its canonical receipt,
[Managed QA Source Freshness And Phase Timings](2026-08-06-managed-qa-source-freshness-and-phase-timings.md),
records fail-closed executable-input freshness, 0.43-second unchanged artifact reuse, 0.25-0.27
second status runs, direct phase timings, integrity/loopback preservation, and independent QA. Vite
remains iteration-only; the managed built runtime remains browser/runtime acceptance.

## Completed Slice 2: Patch Pack And Fast Visual Lane

[Developer Velocity Patch Pack And Fast Visual Lane](2026-08-06-developer-velocity-patch-pack-fast-visual-lane.md)
completed the universal operating contract and the `AGENTS.md` policy update. It establishes
same-owner visual batching, proof selection, fixture/context reuse, Design System and Backend/FIT
escalation, and one final build/integrity boundary. The first real Product Pack remains unselected
until an existing evidence-backed item meets the contract. Fresh build/integrity remains mandatory at
the completed Pack boundary when its final changed contract reaches browser-visible
acceptance/integration or executable release output.

## Program Definition Of Done

The repository has one compact route/owner/verifier surface; ordinary Product/DS work uses direct
HMR and affected proof; risky work keeps its stronger lifecycle/security evidence; and managed
runtime reuse is both faster and source-aware. Each implementation slice must demonstrate measured
before/after improvement without a second process layer or weaker product truth.

Global QA Acceptance is not claimed by this architecture slice.

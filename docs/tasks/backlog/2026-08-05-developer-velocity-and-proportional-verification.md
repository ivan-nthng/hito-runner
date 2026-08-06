# Developer Velocity And Proportional Verification

## Work Item ID

2026-08-05-developer-velocity-and-proportional-verification

## Status

ready

## Type

plan

## Priority

high

## Owner

architect

## Scope

developer-experience-and-delivery-safety

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Make ordinary Hito changes fast to navigate, implement, and verify without weakening the higher
assurance required for persistence, auth, provider, FIT, schema, or cross-owner lifecycle changes.
The target is not a cosmetic line-count reduction. It is one smaller ownership map, one
proportionate verification model, and one stable local feedback loop so a bounded visual change does
not require reconstructing the whole repository or performing a release-sized validation ceremony.

## Stage

The [Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)
has closed Slices 8A-8H truthfully. This Architect-owned item is now ready for its first
evidence-and-measurement slice; no Developer Velocity implementation has started. Blocked FIT
Product presentation and other active owners remain separate and must not be interrupted or
absorbed.

## Next Recommended Role

architect

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Admit and plan the first evidence-backed Developer Velocity And Proportional Verification slice after
the Hito Stack Complexity Reduction Program closes Slices 8A-8H truthfully.

Canonical backlog item:
docs/tasks/backlog/2026-08-05-developer-velocity-and-proportional-verification.md

Evidence before code:
`docs/current-functional-map.md`, Vite HMR, the managed QA server, the Backend validation groups, and
the global proportional evidence policy already exist. Their current setup and feedback costs have
not been measured as one workflow. Reuse those owners; do not introduce another map, runtime, test
framework, or policy layer.

Required outcome:
- Refresh the existing functional map as the concise route/owner/verifier navigation surface.
- Measure ownership lookup, direct HMR, targeted browser, managed-runtime rebuild, and release-check
  cost before admitting any tooling change.
- Reconcile the risk-class matrix in this item with the existing global evidence policy and commands;
  delete duplicated guidance only with parity.
- Name the first smallest owner-scoped implementation slice and its before/after measure.

Boundaries:
- Do not start while the parent cleanup remains active, interrupt another owner, reopen accepted
  releases, or make Product, schema, provider, or deployment changes in this architecture task.
- Preserve the distinction between focused visual verification and deeper lifecycle/security proof.
- Do not recommend a framework migration or code deletion based only on file size.

Definition of Done:
The first implementation slice is evidence-backed, owns one clear bottleneck, names its canonical
owner, has a proportionate required test inventory, and leaves the user with one autonomous execution
handoff rather than a chain of manual decisions.

Approval policy:
Routine local inspection, source analysis, and documentation validation proceed under standing
authorization. Do not interrupt an active role, stage, commit, push, deploy, mutate hosted data, or
call providers in this architecture task.
```

## User Outcome

- A small runner-facing visual or spacing change has an obvious canonical owner and a short,
  trustworthy feedback loop.
- A low-risk UI change is checked at the actual affected surfaces and viewports, rather than being
  delayed by unrelated database, provider, or release validation.
- Risky changes retain their full persistence, security, runtime, and release proof. Fast work never
  becomes an excuse to bypass evidence.
- Agents can find the route, component, token/CSS owner, and appropriate verifier quickly without
  rereading broad historical material.

## Evidence

The repository already has the correct building blocks, but they are not one discoverable delivery
path:

- `docs/current-functional-map.md` is the existing ownership/navigation owner; it is stale, but a new
  map would be a competing truth.
- `scripts/validate-backend.mjs` already separates source, local-DB, runtime, and release groups.
- `npm run dev` already provides direct Vite HMR, while the managed built QA server remains the
  acceptance/runtime owner. A new dev framework is unnecessary.
- Frontend Product and Design System checks are spread across task prose and several proof roots;
  ordinary presentation work therefore lacks a concise selection rule even though the global agent
  policy already requires proportional validation.
- Concurrent `AGENTS.md` and `scripts/finalize-build-output.mjs` changes are separate owners and must
  settle before their guidance or lifecycle can be changed.

This is an ownership and discoverability issue, not permission to skip evidence.

## Root-Cause Direction

The demonstrated cause is distributed navigation and verification selection around already-existing
canonical owners. Runtime speed itself is not yet measured. The first implementation slice must
measure setup, HMR, targeted browser, managed-runtime rebuild, and release-check cost before changing
tooling; a source audit cannot turn an assumed performance gain into a contract.

## Admitted Sequence

1. **Refresh the existing navigation owner — Architect/docs.** Shorten and update
   `docs/current-functional-map.md` after cleanup; link routes, Product/DS/Backend owners, and their
   verifier class. Do not create another ownership map.
2. **Reconcile one proportional matrix — Architect with role-policy owners.** Express the risk classes
   below through the existing global evidence/DoD policy and existing commands. Remove duplicated
   task prose only after parity; do not create a second validation framework.
3. **Measure and stabilize the existing local loop — Backend/tooling with Frontend Product and Design
   System consumer review.** Measure direct Vite HMR and targeted browser feedback versus managed
   built-runtime acceptance. Admit a tooling change only when it removes measured contention or
   repeated setup; retain a fresh production build for integration/release.
4. **Adopt and measure — scoped owners.** Use the refreshed map and matrix on representative
   Product-presentation, shared-DS, Backend-source, and persistence/FIT changes; compare setup and
   feedback cost without weakening required evidence.

## Proportional Verification Matrix

| Change class                             | Required owner proof                                                                                                                                                   | Checks deliberately outside the ordinary slice                        |
| ---------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| Documentation only                       | Metadata/importer dry-run when backlog is affected, links, formatting, scoped diff                                                                                     | Product runtime, browser, DB, provider                                |
| Product presentation                     | Owner/source reachability, file-scoped lint/type, HMR iteration, targeted browser states/viewports, independent QA; one production build before acceptance/integration | Backend DB/provider matrices unless the changed contract reaches them |
| Shared Design System                     | DS contract validator, manifest check when applicable, representative Product and `/hitoDS` browser proof, independent DS QA                                           | Unrelated Backend persistence/provider checks                         |
| Backend source contract                  | Affected validator first; full Backend source matrix only for shared/release boundaries                                                                                | Browser proof when no Product behavior or public response changes     |
| Persistence, auth, FIT, schema, provider | Targeted source plus local DB/RLS/runtime evidence; provider/deployment proof only when reached                                                                        | No evidence downgrade for speed                                       |
| Release integration                      | Exact manifest, fresh build/integrity, required integrated runtime/browser evidence, remote parity                                                                     | No unrelated global ceremony                                          |

## Boundaries

- Do not start before the parent cleanup closes or interrupt the active FIT Product owner.
- Do not create another framework, runtime, state manager, test framework, task tracker, or second
  source of truth.
- Do not downgrade RLS/privacy, persistence, auth, FIT, provider, schema, review/confirm, or release
  checks to make them faster.
- Do not require a full Backend matrix or deployment for a presentation-only change unless the
  changed contract actually reaches those boundaries; retain one production build before
  acceptance/integration.
- Preserve Hito DS token ownership: visual values continue to derive from primitives and canonical
  semantic/component tokens rather than route-local magic numbers.

## Required Evidence Before Each Implementation Slice

- Measured current setup, feedback, and validation cost for the chosen change class.
- Current consumer and owner reachability showing what can be consolidated or bypassed safely.
- A concrete proof that the retained fast path covers the changed contract and that omitted checks are
  outside that contract.
- An independent reviewer for every behavior-changing implementation slice.

## Definition Of Done

The repository has a compact, discoverable owner/navigation surface; agents can select a
proportionate validation path from the changed contract; low-risk Product/DS changes have a stable
local feedback loop; and risky Backend/lifecycle work keeps its existing stronger proof. Each adopted
slice demonstrates a measured reduction in setup or feedback cost without creating a new process
layer or weakening product truth. The work item records completed slices, retained constraints, and
remaining owner boundaries truthfully.

## Current Boundary

The parent cleanup is complete. The next Architect task refreshes and measures existing owners before
choosing one bounded tooling change; readiness is not permission for an automatic broad rewrite or
for changing `current-functional-map.md` outside this successor item.

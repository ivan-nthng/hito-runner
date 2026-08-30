# Hito Scalable Delivery Architecture Rewrite Decision

Work Item ID: `2026-08-18-hito-scalable-delivery-architecture-rewrite-decision`
Status: completed
Type: Tracked
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: [Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation Plan](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-plan.md), [Runner Core Release Freeze And Candidate Admission](./2026-08-18-hito-runner-core-release-freeze-and-candidate-admission.md)

## Scope

Decide whether Hito needs a controlled rewrite of any delivery-critical boundary or an incremental
modular-monolith transformation, and provide the smallest evidence-backed plan that stops repeated
whole-product rereading and multi-hour release handling without weakening correctness.

## Archive Intent

Retain through Product/Ivan's decision and the first approved implementation batch. This item does
not supersede source-of-truth or domain-boundary decisions without explicit evidence.

## Task

Diagnose why a small, user-visible change and a checkpoint release required repeated broad context,
multiple handoffs, and avoidable delay. Compare a clean-slate rewrite against incremental boundary
extraction using the actual Hito seams, task/receipt structure, release procedure, and test model.
State plainly if a rewrite would worsen delivery risk; do not recommend it merely to simplify an
explanation.

Produce an amended, execution-ready strategy: target modules/domains, public contracts, stable
baseline and release mechanics, focused validation ownership, migration/removal sequence, and the
specific first batch that produces a measurable reduction in rereading and elapsed delivery time.

## User Report

Ivan is dissatisfied that a checkpoint took hours after repeated preparation and a trivial Markdown
whitespace defect. He wants the service to scale without agents repeatedly reading the same code or
historical task material. If a rewrite is necessary, he wants a plan; if it is not, he wants a clear
reason and the better alternative. He does not want artificial token, time, file-count, or checklist
limits.

## Evidence

- The completed domain-boundary plan identifies structural coupling in `training-api.ts`,
  `training.ts`, Calendar/source provenance, result/evidence, Progress, and Identity/Admin.
- The checkpoint release record shows a separate operational failure mode: a whole-checkout
  checkpoint was delayed by staged hygiene and repeated freeze/census work rather than a Runner
  product defect.

## Observed Behavior

Product boundaries, source ownership, terminal receipts, release candidate mapping, and validation
responsibilities are not yet compact enough to make routine work naturally local and fast.

## Expected Behavior

The product remains safe as it grows: a task has a physically bounded implementation and proof
surface; baseline acceptance is reusable until an explicit contract changes; release uses a
repeatable candidate path without rediscovery; a rewrite is chosen only when an incremental path
cannot reach those properties honestly.

## Required Discriminator

Establish whether the current model has an irreducible structural obstacle that requires a rewrite,
or whether a serial set of bounded moves/removals can reach the target faster and with lower risk.
Every recommendation must cite a current seam, consumer set, or release/process artifact.

## What Not To Touch

Do not implement source changes, migrations, fixtures, runtime, QA, hosted resources, Git actions,
Notion integration, role-policy rewrites, a new process framework, a second task system, or a
generic registry. Do not prescribe arbitrary reading quotas or retain compatibility paths as an
alternative to a real migration.

## Validation Expectations

- Compare rewrite and incremental paths with explicit scope, risks, stopping conditions, and exit
  evidence.
- Reuse the completed architecture audit/plan and inspect only direct decision seams; do not repeat
  a repository-wide source audit.
- Produce one compact supporting decision plan only if it adds detail beyond the current domain plan.
- Validate task-local Markdown links, formatting, whitespace, and diff hygiene; preserve all
  concurrent work.

## Stage

No-rewrite decision complete; Product/Ivan approval required before implementation

## Product Decision — 2026-08-18

Ivan accepted the incremental modular-monolith transformation and explicitly rejected a rewrite.
It is Hito's highest-priority implementation track immediately after the active hosted Runner Core
reconciliation and deployment chain reaches a truthful terminal state. The work starts with the
bounded Phase 1 Workout sidebar contract isolation and then proceeds serially through the accepted
plan; it does not reopen a whole-product rewrite or create a second product architecture.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Scalable Delivery Architecture Rewrite Decision
Stage: Rewrite-versus-incremental delivery architecture decision and amended plan
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-scalable-delivery-architecture-rewrite-decision.md
Existing plan: docs/plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md
Evidence: docs/tasks/backlog/2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md and docs/tasks/backlog/2026-08-18-hito-runner-core-release-freeze-and-candidate-admission.md

Ivan explicitly authorizes autonomous architecture planning, not implementation. Read AGENTS.md,
agents/architect.agent.md, skills/hito-architecture-audit/SKILL.md, this item, the existing plan,
and only direct source/process seams necessary for the decision. Do not repeat a repository-wide
audit or reread unrelated product code.

Give an evidence-backed verdict: controlled rewrite only if an incremental route cannot honestly
reach bounded ownership, stable public contracts, reusable focused regression evidence, and fast
repeatable release mechanics. If rewrite is wrong, say so plainly and specify the smaller
alternative. Amend the existing domain-boundary plan or create one compact supporting decision plan
only when needed. Define the first measurable batch and the exact before/after signals that prove
less rereading and less release delay without artificial quotas.

Do not implement source, migrations, fixtures, runtime, QA, hosted work, Git, Notion, a new task
system, policy framework, or generic registry. Preserve concurrent hosted-deploy work and all
unrelated bytes. Return to PRODUCT for Ivan's explicit decision before any implementation dispatch.
```

## Blockers

Decision planning is complete. Implementation remains blocked on Product/Ivan approval and must be
serialized with the current hosted duplicate-occupancy reconciliation/deploy chain.

## ARCHITECT Tracked Decision Receipt — 2026-08-18

### Verdict

**Do not rewrite Hito.** Continue the controlled modular-monolith responsibility migration in the
existing plan, now amended with explicit rewrite triggers, a stable delivery baseline, repeatable
release mechanics, and measurable first-batch signals.

Incremental migration can reach the target honestly. Current positive boundaries already exist;
the remaining mixed seams have finite direct consumers and deletion orders; the first contract
isolation is atomic and behavior-preserving. A rewrite would enlarge the candidate, invalidate
accepted Calendar/Evidence/Progress proof, and still leave the current hosted data conflict to be
reconciled.

### Demonstrated Delivery Causes

| Evidence                                                                                                                                                                                                             | Decision consequence                                                                                                                                |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `training-api.ts`, `training.ts`, Calendar/source persistence, Result/Evidence types, Progress provider types, and Identity/Admin classification mix responsibilities but have known importers and replacement seams | Use serial provider/consumer migration and removal; no clean-slate runtime is required                                                              |
| Existing Product contracts and focused proofs already protect Runner Activity, Workout results, manual authoring, Admin projections, and the accepted sidebar read model                                             | Reuse them; a rewrite would discard rather than improve proven evidence                                                                             |
| The checkpoint accumulated 470 paths with 45,099 insertions and 8,686 deletions and recorded four admission attempts before Git checkpointing                                                                        | Release delay was amplified by candidate size and mixed lifecycle ownership, not by an inability to modularize the monolith                         |
| Staged hygiene found eight whitespace defects only after the whole candidate was assembled                                                                                                                           | Run tracked/untracked formatting and whitespace hygiene inside each owner batch before terminal handoff; retain staged verification as confirmation |
| Hosted migration `20260816004652` stopped after two earlier migrations because existing runner/date occupancy is not unique                                                                                          | The guard exposed a real data decision. Rewriting application source neither resolves nor safely bypasses it                                        |

No irreducible rewrite discriminator was found. A later seam-specific replacement returns to
ARCHITECT only if the existing persistence cannot express the invariant, a final contract cannot be
migrated without duplicate authority, observable parity cannot be proven, or a clean single-owner
batch still requires unrelated domain reconstruction.

### Existing Plan Amendment

The existing
[Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md)
now records:

- the explicit no-rewrite verdict and four evidence-based rewrite triggers;
- a clean terminal-batch delivery baseline and owner-level hygiene before release;
- fresh release identity on every retry while reusing current terminal domain evidence instead of
  repeating architecture discovery;
- separation of source, migration, hosted-data, and deployment gates; and
- the exact before/after signals for Phase 1.

No second plan, framework, tracker, registry, validator, role, or policy document was created.

### First Measurable Batch

Phase 1 remains a BACKEND-only Workout sidebar contract isolation. Passing requires all of the
following, not merely a file move:

1. shared route composition imports the semantic contract, never the server-only query owner;
2. database/query/proof internals remain private;
3. the five moved DTO exports and every compatibility alias/re-export are absent from the old file;
4. the existing focused evidence proof and source/type/format/whitespace checks pass;
5. the receipt shows only direct seam reading or explains evidence-driven expansion;
6. every changed production path has one terminal BACKEND owner; and
7. any separately authorized checkpoint/release reaches candidate hygiene without repeated owner
   reconciliation or late whitespace repair for unchanged bytes.

This measures dependency direction, proof reuse, candidate ownership, and gate repetition. It sets
no artificial time, token, file, or test quota. The detailed implementation prompt remains in the
completed parent architecture item and is not dispatched by ARCHITECT.

### Execution Preflight And Preservation

- **Role / mode / skills:** ARCHITECT / Tracked planning;
  `hito-architecture-audit` and `hito-plan-writing-and-closeout`.
- **Writable boundary:** this canonical item and the existing supporting plan only. No subagent was
  used.
- **Git baseline:** branch `main`; local `HEAD` and local `origin/main`
  `14ccfbfe8742d5d894e9629169a946d144a4d06f`; index empty. No remote-freshness or release claim.
- **Concurrent boundary:** the blocked hosted deploy receipt and the ready duplicate-occupancy
  discovery were stable before the first write and remained outside this task. During final
  validation, BACKEND advanced both records independently to `in_progress`; this task did not edit
  either file. No hosted access or mutation occurred here.
- **Implementation budget:** runtime source, migrations, fixtures, scripts, validators, product
  documents, QA/runtime, providers, Git lifecycle, Notion, and unrelated bytes were not changed.

### Validation Inventory

| Check                                                | Result            | Evidence / consequence                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------------------- | ----------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required decision sources and direct seams           | Passed            | Policy, role, skills, canonical item, existing plan, completed audit, release receipts, current hosted blocker, and the direct Phase 1 imports/proof were inspected.                                                                                                                                                                                                                                                                  |
| Task-local Markdown links                            | Passed            | All eight local links in the amended plan and this receipt resolve.                                                                                                                                                                                                                                                                                                                                                                   |
| Scoped formatting, whitespace, and diff hygiene      | Passed            | Scoped Prettier, direct trailing-whitespace scan, and `git diff --check` passed.                                                                                                                                                                                                                                                                                                                                                      |
| Unrelated/concurrent byte preservation               | Passed            | The prior architecture item retained SHA-256 `570511ad7e9fa5ca0752802f7f312f884c9c2898993dbd351e26e37a8fbc6a41`. BACKEND independently advanced the hosted deploy and duplicate-discovery receipts during validation; their stable final observed hashes were `0913ff5c4a7c40f179b6014e0f3c870734ec4e830e5703bb522e071a2e4a37e1` and `26c444c60d9e761918fb09874ad9dedfbb1b57d552a66a4ceb80b4663b7a214a`. This task did not edit them. |
| Runtime/build/browser/database/hosted/Git/QA/release | Not run by design | Architecture decision only; no implementation or acceptance layer is claimed.                                                                                                                                                                                                                                                                                                                                                         |

### Return

PRODUCT is the next owner. Present the no-rewrite verdict and amended plan to Ivan, obtain his
explicit decision, and do not dispatch Phase 1 until the concurrent hosted reconciliation/deploy
chain has a truthful terminal boundary or Ivan explicitly serializes it.

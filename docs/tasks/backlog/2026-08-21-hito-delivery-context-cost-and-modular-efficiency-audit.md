# Hito Delivery Context Cost And Modular Efficiency Audit

Work Item ID: `2026-08-21-hito-delivery-context-cost-and-modular-efficiency-audit`
Status: ready
Type: Research / Decision
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Evidence From: [Hito Unified Workout Authoring Contract And Editor Consolidation](./2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md), [Hito Runner Calendar Mutation Owner Extraction](./2026-08-21-hito-runner-calendar-mutation-owner-extraction.md), [Hito Runner Calendar Public Snapshot Cleanup](./2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md)

## Scope

Measure whether the accepted modular-monolith and progressive-context operating model is reducing
actual delivery context, repeated rediscovery, and elapsed handoff overhead. Use only HITO-224,
HITO-230, and in-progress HITO-232 as the current evidence set. Recommend the smallest structural
corrections required to make a bounded task normally read and validate only its owner plus direct
contracts.

## Archive Intent

Retain the measurement method, baseline, causes, target signals, and accepted correction plan as
technical evidence for the finite HITO-218 foundation outcome. Operational status and delivery-step
progress live in Notion task HITO-233.

## User Report

Ivan observes that Codex still consumes too many tokens and time despite the new modular-boundary
programme. The intended outcome was not an artificial token limit: a small task should not need to
re-read unrelated product areas, rediscover previous decisions, or create unnecessary role loops.

## Evidence And Source Investigation

- Phase 0 reduced the root instruction map and separated role cards from durable contracts.
- HITO-224 removed duplicate authoring models but crossed multiple legacy editor, command, proof,
  and persistence seams over several serial slices.
- HITO-230 isolated Calendar mutation ownership and required one focused cycle repair before QA
  could accept it.
- HITO-232 already exposed a new snapshot-owner boundary; the required ARCHITECT review found that
  moving assembly mechanically into low-level persistence would create a cycle.

These facts establish that the programme has not yet reached its intended end-state. They do not by
themselves identify which remaining cost is structural coupling, operating-process overhead, or an
environment interruption.

## Required Decision

Produce a read-only, source-backed answer to all of the following:

1. A compact baseline for HITO-224, HITO-230, and HITO-232: direct files/contracts read, repeated
   rediscovery, handoffs/fix-forward loops, proof cost, and environment interruptions.
2. A classification of each material cost: unresolved source ownership, oversized shared contract,
   duplicate or stale documentation, task/handoff mechanics, or execution-environment friction.
3. Measurable structural success signals for a future bounded task. These are observation signals,
   not hard caps on tokens, files, time, or test count.
4. The smallest sequence of process, contract, documentation, or owner-boundary changes that removes
   demonstrated cost. Reuse the current progressive-loading hierarchy; do not propose a second
   tracker, a new agent framework, a generated registry, or a repository rewrite.
5. What must wait until the current HITO-232 boundary is terminal, and what can be adopted
   immediately without altering its scope.

## What Not To Touch

Runtime source, tests, package/dependency configuration, Supabase/Docker, providers, hosted
services, credentials, Notion schema/views, task ownership outside HITO-233, Git lifecycle, and the
active HITO-232 implementation. Do not impose an artificial token or reading limit, introduce a
dashboard, or turn the audit into a whole-repository rediscovery.

## Validation Expectations

Validate only the audit record: direct evidence links, local Markdown links, Prettier, whitespace,
and `git diff --check`. No runtime, browser, database, provider, build, release, deployment, or Git
action is expected.

## Stage

Discovery — current delivery-context baseline and structural efficiency decision

## Next Recommended Role

ARCHITECT

## Handoff Prompt

```text
ROLE: ARCHITECT

Task: HITO-233 — Audit Delivery Context Cost and Modular Efficiency
Mode: Tracked, read-only discovery
Canonical repository document: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-21-hito-delivery-context-cost-and-modular-efficiency-audit.md
Notion task: HITO-233
Evidence tasks: HITO-224, HITO-230, HITO-232

Read AGENTS.md, agents/architect.agent.md, skills/hito-architecture-audit/SKILL.md, HITO-233 in
Notion, this document, the root progressive-context/routing contract, and only the direct evidence
from HITO-224, HITO-230, and the current HITO-232 boundary review. Do not read unrelated history or
restart a repository audit.

Ivan's outcome: establish whether the modular programme is actually reducing delivery context and
elapsed waste. Do not propose artificial token, file, time, or test-count limits. Separate real
structural coupling from process overhead and environment interruptions. Measure the actual read
envelope, repeated rediscovery, handoff/fix-forward loops, and proof effort of the three evidence
tasks. Then recommend the smallest structural corrections, measurable success signals, and a serial
adoption order that preserves the current HITO-232 scope.

Do not implement code, edit existing task ownership, alter Notion schema/views, create a new
tracker/framework/registry, call providers, run runtime/build/browser/database work, or perform Git
actions. Update only HITO-233's technical audit record and Notion lifecycle/checklist. Return the
evidence-backed decision and next owner to PRODUCT in Russian; durable receipt/history remain
English.
```

## Architecture Decision Receipt — 2026-08-21

### Verdict

The modular programme is producing a measurable improvement, but it has not yet removed all delivery
cost. HITO-230 and HITO-232 were bounded Calendar-owner slices; HITO-232 reached Backend proof and
independent QA without a fix-forward return. HITO-224 was a transitional multi-owner reform over
several still-duplicated authoring contracts, so its large read and proof envelope was mostly real
structural debt. It also accumulated avoidable lifecycle, documentation and environment overhead.

No token, file, elapsed-time or test-count cap is recommended. The target signal is that a bounded
owner can establish truth from one current domain contract, its public owner, direct callers and
direct proofs without reconstructing decisions from lifecycle history.

### Evidence Baseline

| Task     | Actual evidence/read envelope                                                                                                                                                                                                                                                                                                               | Rediscovery and owner loops                                                                                                                                                                                                                                                                                                                                                                                                                                | Proof effort                                                                                                                                                                                                                                                                                                                      | Environment interruption                                                                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| HITO-224 | 973-line repository record and 105 Notion blocks: 89 event/receipt paragraphs and seven delivery steps. The outcome genuinely crossed scratch/built-in, saved-template, Calendar and AI/file initializers; two Frontend controllers; the seven-operation sealed command family; template and Calendar persistence; protection and evidence. | Seven explicit Frontend stops or exact reverts exposed missing canonical initializers or interaction semantics before the final model was complete. Architecture re-baselining and a later root-cause audit were required. The real gaps were saved-template and Calendar initializers, nested Repeat identity, Target validation and the final saved-template reader. Later stale proof imports and formatting were an execution defect, not a model gap. | Repeated static/reverse-import, disposable persistence, protection, reload and cleanup proof was necessary while duplicate contracts were removed. Independent domain and focused browser QA eventually passed. Several earlier reruns repeated broad origin/protection coverage because the canonical boundary was still moving. | Two QA attempts failed before product validation because Notion/provider transport was unavailable. A stale managed artifact and a later local inventory guard delayed browser proof. These were not product defects. |
| HITO-230 | 110-line technical item, 21 Notion blocks and three delivery steps. The direct boundary was three Calendar mutation operations, the legacy owner, the new mutation owner, source provenance and a corrected 12-module reachable import graph.                                                                                               | One same-task QA return found a genuine type-only cycle: mutations -> imported plan -> training -> mutations. The bounded Backend fix removed the reverse edge. A proof fixture also selected an unsupported built-in key; it did not widen product scope.                                                                                                                                                                                                 | Initial mutation/protection/Rest/Undo proof was broad enough for the moved owner. Re-acceptance correctly reran only the repaired dependency graph and the missing occupied durable-Undo branch; previously accepted branches were not replayed.                                                                                  | None demonstrated. Docker Desktop used the already admitted trusted-private local seam and stopped project-qualified.                                                                                                 |
| HITO-232 | 106-line technical item and 11 Notion blocks with three delivery steps. The boundary review needed five core source seams, ten direct runtime `TrainingSnapshot` consumers and five direct proof callers.                                                                                                                                   | One pre-write Architecture decision prevented a mechanical move into low-level persistence from creating another cycle. Backend then implemented once and QA accepted once; there was no fix-forward return.                                                                                                                                                                                                                                               | Focused ownership/import proof, four inherited `training-api` TypeScript baseline checks, mixed-origin provenance, protection, stored-Rest/Undo, atomic failure, reload and cleanup passed. Browser and release layers stayed omitted.                                                                                            | None demonstrated.                                                                                                                                                                                                    |

The progression is therefore not “large task versus small task” alone. HITO-224 carried unresolved
authority and duplicate live contracts. HITO-230 had one missed dependency-direction defect.
HITO-232 started from named owners, mapped consumers before write and reached terminal acceptance in
one implementation/QA path.

### Cost Classification

| Cost                                                                                            | Demonstrated cause                                                                                                                                                    | Classification and correction                                                                                                                                                                                        |
| ----------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Missing authoring initializers, Repeat identity, Target validity and saved-template read parity | Frontend repeatedly reached facts that the server or canonical document could not yet represent.                                                                      | Structural coupling. A consumer migration starts only after every admitted origin has a lossless canonical initializer and the public command contract represents the required interaction.                          |
| Calendar mutation type cycle                                                                    | The new mutation owner retained a type-only edge through imported-plan and training.                                                                                  | Structural coupling. Every owner extraction proves recursive dependency direction including type-only imports before implementation handoff.                                                                         |
| Snapshot assembly placement ambiguity                                                           | Low-level persistence already supplied mutation types while snapshot composition needed mutation policy and training projections.                                     | Structural coupling caught before write. Keep raw persistence below one acyclic Calendar snapshot composition owner; transport imports the snapshot owner, never the reverse.                                        |
| Repeated handoff prompts and stale repository lifecycle fields                                  | The three repository evidence files still say `in_progress` or `ready` while live Notion says Done; HITO-224 also retains consumed prompts and intermediate receipts. | Documentation/process overhead. Notion remains the only lifecycle truth. A touched terminal technical record should retain the accepted contract and evidence, not operational status narration or consumed prompts. |
| Product relay during bounded fix-forward                                                        | Several HITO-224 returns predated or bypassed the current direct unchanged-edge rule.                                                                                 | Process overhead. Preserve one Task and direct owner-to-owner return when the accepted boundary is unchanged; use Product only for a real decision or scope/authority change.                                        |
| Notion transport, stale managed artifact and local inventory admission failures                 | Validation did not reach the product contract.                                                                                                                        | Execution-environment friction. Prove lifecycle access and fresh managed-artifact identity before transferring verification ownership; fail before product/source work and do not relabel the failure as a defect.   |
| Broad repeated validation                                                                       | HITO-224's owner contract was still changing; HITO-230 re-acceptance did not repeat unaffected proofs.                                                                | Mixed. Broad replay was justified while authority moved, but after a stable boundary only the changed contract, its direct consumers and risk-derived integration branches should rerun.                             |

### Smallest Structural Corrections

1. **Make the final domain contract, not a task transcript, the normal input.** After Product accepts
   this decision, compact the terminal HITO-224 repository record in place to its final
   `WorkoutDocument` authority, initializer/command contracts, deletion proof, acceptance and
   residual release boundary. Retain unique evidence; remove consumed prompts, superseded slice
   numbering and intermediate lifecycle narration. HITO-230 and HITO-232 are already compact enough.
2. **Remove lifecycle ambiguity when technical records are next touched.** Keep Work Item identity,
   Notion link, technical scope and evidence. Do not treat Markdown `Status`, `Owner`, stage,
   handoff or next-role text as current, and do not add another mirror or generated index.
3. **Express dependency direction in the affected domain contract and prove it at the owner edge.**
   A Backend boundary extraction maps direct production/proof consumers and recursively checks both
   runtime and type imports before claiming implementation complete. Reuse the existing focused
   import-graph technique; add no registry, framework or repository-wide validator.
4. **Make consumer readiness a source discriminator.** Frontend starts only when the server-owned
   initializer and command family can losslessly supply every admitted origin and interaction.
   Temporary aliases must name their exact direct consumer and deletion phase; no compatibility
   state or client reconstruction is accepted.
5. **Keep QA proportional after a stable owner exists.** QA proves the changed public contract,
   negative dependency direction and risk-derived persistence/UI boundary. It references accepted
   evidence for unaffected branches and reruns them only when the changed edge can invalidate them.
6. **Use existing environment seams before ownership transfer.** Confirm local Notion access and a
   fresh managed artifact before Verification ownership changes. Environment failure returns to
   Product without source churn, a new Task or a fake product blocker.

### Observable Success Signals

- A new single-domain task resolves ownership from its current Notion task, one stable domain
  contract, the public owner module and direct callers/proofs; no historical receipt is needed to
  decide where the change belongs.
- The first implementation preflight identifies all direct consumers and required source facts;
  another role does not later discover a missing initializer, DTO or authority needed to begin.
- The resulting import graph has one public owner, declared dependency direction, no runtime or
  type-only reverse cycle, and zero imports of each removed legacy export.
- Planned owner transitions remain the accepted serial edges. Any extra return contains either one
  reproduced source defect or one factual environment failure, rather than another round of broad
  discovery.
- Focused QA can state which terminal evidence remains valid and why; it does not replay an
  unrelated domain or the whole product as a substitute for a stable contract.
- Verification starts from a current managed artifact and admitted environment identity. Stale
  artifact or provider transport failure is detected before product validation begins.
- A later bounded Calendar slice matches or improves on the HITO-232 pattern: consumer map before
  write, one coherent owner implementation, proportional proof and independent QA without an
  architecture/ownership correction after implementation.

These are observed architectural outcomes, not quotas. A task still reads and tests everything
genuinely required by its changed domain and direct contracts.

### Serial Adoption And Boundary

HITO-232 is now terminal in live Notion after independent QA. Nothing in this audit changes or
reopens its source, proof or lifecycle.

1. PRODUCT accepts, rejects or narrows this audit decision.
2. If accepted, ARCHITECT performs one documentation-only HITO-224 contract/receipt compaction and
   removes only demonstrated stale lifecycle narration from the directly touched technical record.
3. The next admitted BACKEND domain slice applies the direct-consumer and recursive import-direction
   proof before implementation handoff; no standalone framework task is created.
4. QA applies focused contract/boundary acceptance and returns only reproduced same-task defects to
   the implementation owner.
5. PRODUCT compares that next terminal slice with this baseline and decides whether any further
   structural correction is warranted. No dashboard or recurring measurement system is needed.

### Validation And Omission

The audit used only live HITO-224/HITO-230/HITO-232 lifecycle/readback, their three linked technical
records, the current HITO-232 boundary review and the progressive-context/routing contracts. Runtime,
build, browser, database, hosted, provider-product, Git lifecycle, release and Global QA work were
not run. No source, evidence-task lifecycle or Notion schema/view was changed.

Next owner: **PRODUCT** for the finite adoption decision.

# Hito Progressive Context And Module Interaction Readiness

Work Item ID: `2026-08-21-hito-progressive-context-and-module-interaction-readiness`
Notion Task: [HITO-242](https://app.notion.com/p/Verify-Progressive-Context-and-Module-Interaction-Readiness-3c4fe5f58cf581cb925dfafa09c11834)
Type: Research / Decision
Parent: [Hito Delivery Context Cost And Modular Efficiency Audit](./2026-08-21-hito-delivery-context-cost-and-modular-efficiency-audit.md)
Evidence From: [Measured Delivery Context Corrections Adoption](./2026-08-21-hito-measured-delivery-context-corrections-adoption.md), [Current-System Modular Boundary Reconciliation](./2026-08-21-hito-current-system-modular-boundary-reconciliation.md), [Foundation Domain Boundaries Epic Acceptance](./2026-08-21-hito-foundation-domain-boundaries-epic-acceptance.md)

## Scope

Verify after the completed Foundation programme that a new bounded Product UI task can load only
its direct context, use the accepted public contracts, and avoid rediscovering unrelated system
history. This is a documentation and operating-model readiness check, not a runtime, UI or
architecture-extraction implementation.

## Archive Intent

Retain one concise evidence-backed answer about progressive context, current documentation authority
and the module-to-module interaction map. Operational lifecycle, delivery steps and short handoffs
remain only in the linked Notion task.

## Task

Establish whether the currently mandatory load path is actually progressive:

1. Measure the required root, role and routing context for a normal Backend, Frontend and QA task;
   distinguish mandatory instructions from directly relevant on-demand contracts.
2. Verify that the current documentation map, source-of-truth split and HITO-233/HITO-234 operating
   corrections still match the accepted HITO-232/HITO-235/HITO-236/HITO-237/HITO-239/HITO-240/HITO-241
   boundaries.
3. Verify the public interaction direction needed for a UI change: Source Authoring -> Runner
   Calendar -> Result/Evidence -> Progress, Identity -> Admin/Runner, and Result/Evidence ->
   Frontend marker presentation. This is an owner/contract readback, not a new runtime test suite.
4. If a demonstrable documentation or routing contradiction forces an owner to load unnecessary
   global material, correct only the responsible instruction/document seam. Otherwise state that no
   change is needed.
5. Record one short UI-entry context map: what a Product Frontend task reads by default, what it
   loads only when its task crosses a named public contract, and which evidence remains reusable.

## What Not To Touch

Do not change runtime source, tests, validators, schema/RLS/RPC, Supabase/Docker, providers, hosted
state, Notion schema/views, credentials, task authority, Git lifecycle, or existing terminal task
lifecycle. Do not restart a repository-wide audit, create a tracker/framework/registry, introduce
reading or token caps, or reopen accepted domain contracts without a demonstrated conflict.

## Proof

Use direct instruction and contract links, targeted import/owner readback only where a claimed module
edge requires it, and the existing accepted HITO-240/HITO-241 evidence. Run local Markdown links,
Prettier, whitespace and `git diff --check` for task-owned documentation edits. No browser, build,
database, provider, hosted, release or deployment proof is required because none is changed.

## Architecture Decision Receipt — 2026-08-21

### Verdict

The accepted Foundation public contracts are ready for bounded Product UI work. One operating defect
did remain: Backend, Frontend and QA role cards required every task to read the complete routing
contract even when ownership, environment and handoff were already admitted. The documentation map
also retained one obsolete statement that operational status lived in backlog metadata.

The smallest correction makes the full routing contract conditional on an actual admission,
owner/lane, handoff/QA-return, concurrency, external-authority or release question. Root `AGENTS.md`
remains the mandatory lifecycle and safety minimum. No public domain contract or task authority
changed.

### Static Instruction Envelope

The counts below measure only the fixed root/role/routing files. The selected Notion Task, its linked
technical record, one matching skill and the affected public contract remain necessary task-specific
context and are intentionally not treated as overhead.

| Role     | Before: mandatory root + role + routing | After: mandatory root + role | Routing loaded on demand |
| -------- | --------------------------------------: | ---------------------------: | -----------------------: |
| BACKEND  |                 483 lines / 3,953 words |      169 lines / 1,249 words |  320 lines / 2,761 words |
| FRONTEND |                 487 lines / 3,995 words |      173 lines / 1,292 words |  320 lines / 2,761 words |
| QA       |                 486 lines / 3,979 words |      172 lines / 1,273 words |  320 lines / 2,761 words |

This is progressive disclosure, not a reading cap. An owner still loads the routing contract and
every factual contract genuinely required by its task.

### UI-Entry Context Map

| Product UI task boundary             | Load by default                                                                                                                                          | Load only when the named edge changes                                                                                                                                           | Evidence that may be reused without replay                                                           |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Any bounded Frontend task            | `AGENTS.md`, `frontend.agent.md`, selected Notion Task and Repository document, matching Frontend skill, affected source and nearest UI/product contract | Full routing contract for admission, lane/owner transition, QA return, concurrency, external action or release; `current-system.md` only for runtime ownership/current behavior | HITO-240 current architecture and HITO-241 Foundation acceptance remain valid for unchanged edges    |
| Workout create/edit/review           | [Unified authoring contract](./2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md)                                           | [Runner Calendar snapshot boundary](./2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md) only when Calendar materialisation/readback changes                           | Accepted canonical `WorkoutDocument`, initializer, command, interaction and focused browser evidence |
| Calendar completion/evidence UI      | Calendar public DTO plus [Result/Evidence public contract](./2026-08-21-hito-result-evidence-public-contract.md)                                         | Private ingestion/parser/storage contracts only for a separately owned Backend change                                                                                           | Provider-neutral marker, comparison, availability and protection evidence                            |
| Progress UI or factual visualization | [Evidence/Progress Product contract](./2026-08-21-hito-evidence-progress-product-contract.md)                                                            | Backend-private read models only for a Backend provider-contract change                                                                                                         | Accepted factual projection, missingness and zero Product/DS private imports                         |
| Admin/Runner actor presentation      | [Identity actor-classification contract](./2026-08-21-hito-identity-owned-actor-classification.md)                                                       | Provider metadata/account mechanics only for an Identity-owned Backend change                                                                                                   | Accepted Identity ownership and removed Admin classifier                                             |
| Workout feedback labels              | [Frontend marker presentation contract](./2026-08-21-hito-feedback-marker-presentation-owner-extraction.md) and public marker type                       | Result/Evidence internals only if factual marker semantics change                                                                                                               | Exact `null`, `Evidence attached` and `Feedback ready` mapping plus two-consumer proof               |

QA starts from the selected Task's accepted contract, changed public boundary and current managed
artifact. It cites HITO-241 for unchanged Foundation direction and reruns only evidence that the new
edge can invalidate; Global QA and release remain separate.

### Public Interaction Readback

| Direction                                       | Current owner/readback                                                                                                                                   | Result                                                               |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Source Authoring -> Runner Calendar             | `workout-authoring-review.ts` owns the canonical command family; authoring operations consume Calendar persistence/mutations                             | Accepted one-way product authority; source origin remains provenance |
| Runner Calendar -> Result/Evidence              | `runner-calendar-snapshot.ts` asks the Result/Evidence readback for factual feedback/completion while Calendar retains workout lifecycle                 | Accepted; no provider/parser authority enters Calendar               |
| Result/Evidence -> Progress                     | Product and DS consumers import only `runner-activity/product-contract.ts`; no route/component/DS import of private read-model types remains             | Accepted factual projection boundary                                 |
| Identity -> Admin/Runner                        | `actor-classification.ts` is consumed by Runner persisted-user and Admin owners; the Admin-named classifier has zero reachability                        | Accepted single Identity owner                                       |
| Result/Evidence -> Frontend marker presentation | `workout-feedback-marker-presentation.ts` has one type-only public marker dependency and exactly `TodayHero.tsx` plus `calendar-projection.ts` consumers | Accepted one-way presentation edge; no Backend reverse import        |

HITO-241 already accepted the combined runtime and type-only graph after the bounded signed-out
preview fix. This task found no conflicting owner, duplicate domain truth or reason to reopen those
contracts.

### Documentation Corrections

- aligned the routing load order with root `AGENTS.md` and made the full routing contract on-demand;
- updated Backend, Frontend and QA role cards to use that conditional route;
- corrected `docs/README.md` and `docs/current-system.md` so implemented/release state is distinct
  from Notion operational lifecycle.

### Validation And Boundary

- Local Markdown links, scoped Prettier, direct whitespace and whole-worktree `git diff --check`:
  PASS.
- Task-owned writes are limited to this record, the routing contract, three delivery role cards and
  the two corrected documentation-map sentences.
- Unrelated AI/source-authoring files moved under another active owner during this audit. This task
  did not touch those paths and therefore claims no stable checkout-wide fingerprint for them.
- Runtime source, tests, validators, schemas, Supabase, browser, providers, hosted state, Git
  lifecycle, Notion schema and accepted Task lifecycles were not changed or claimed.

PRODUCT owns final acceptance; no UI implementation is dispatched.

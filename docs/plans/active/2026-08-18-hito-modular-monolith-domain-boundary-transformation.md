# Hito Modular Monolith Domain-Boundary Transformation

## Status

in_progress — Phase 1 is complete; Phase 2A separates Runner Calendar query ownership from legacy
source provenance persistence

## Canonical Item

[Hito Modular Monolith Domain-Boundary Transformation Plan](../../tasks/backlog/2026-08-18-hito-modular-monolith-domain-boundary-transformation-plan.md)

## Evidence And Roadmap

- [Product Domain Boundaries And Efficient Delivery Architecture Audit](../../tasks/backlog/2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md)
- [Runner Product Readiness And Progressive Materialization Roadmap](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
- [Scalable Delivery Architecture Rewrite Decision](../../tasks/backlog/2026-08-18-hito-scalable-delivery-architecture-rewrite-decision.md)

## Outcome

Evolve the existing Hito monolith through small business-capability slices so each domain owns its
truth, invariants, operations, projections, Product-facing contract, and focused regression proof.
A normal change then reads and proves its domain plus the explicit contracts it crosses. An Epic or
release remains the only default cross-product replay.

This is an incremental responsibility migration, not a folder rewrite. Hito remains one
TanStack/Supabase/Vercel deployable, one database, one canonical Markdown backlog, and one release
candidate. No microservice, generic domain framework, dependency registry, compatibility
projection, second workout model, or replacement active-plan container is introduced.

## Accepted Invariants

1. A plan is an AI, file-import, or manual source artifact used only to propose initial placement.
   Explicit confirmation materialises independently runner-owned Calendar workouts. Origin is
   immutable provenance, not lifecycle authority.
2. One domain owns each factual decision. A consumer receives a typed command result or projection;
   it does not query, join, or reconstruct another domain's private state.
3. Public contracts contain only behavior another domain uses. Provider payloads, database rows,
   RLS/RPC mechanics, fixtures, migrations, query algorithms, and calculation internals remain
   private.
4. A slice migrates consumers in a recorded order and removes the superseded import or
   responsibility. It does not leave an old and new live path for convenience.
5. Existing focused proof is extended before a new validator is considered. The aggregate Backend
   suite remains an Epic/release gate, not the default proof for a narrow domain change.
6. Reading and testing follow actual affected contracts. There is no token, file, elapsed-time, or
   checklist quota.

## Current Baseline

The completed audit and a fresh source census establish these immediate seams:

| Current seam                                                                              | Direct evidence                                                                                                                                                                                        | Transformation consequence                                                                                                                                                                                   |
| ----------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `src/lib/workout-detail-sidebar-read-model.ts`                                            | A 493-line server-only query owner also exports the semantic sidebar DTO consumed by `route-data-actions.ts`; its raw database row types and calculation inputs are exported for focused proof.        | The accepted sidebar pilot has one small provider/consumer boundary that can be isolated atomically without changing behavior.                                                                               |
| `src/lib/active-plan-persistence.ts`                                                      | A 652-line module exports source-plan retention/library operations and Calendar workout rows, mutation context, and Calendar queries to 15 source/script consumers.                                    | Calendar persistence and source provenance remain behaviorally decoupled but structurally mixed. Calendar query/mutation responsibility can move first while the source library remains intact.              |
| `src/lib/active-plan-lifecycle-persistence.ts` and `src/lib/active-plan-workout-editing/` | Atomic Calendar mutations and reviewed source materialisation share legacy active-plan names even though completed acceptance proves runner-owned Calendar behavior.                                   | Move Calendar operations behind a Calendar owner; keep source materialisation separate. Storage/RPC names remain temporary implementation facts until a separately proven migration justifies changing them. |
| `src/lib/workout-result-import/types.ts`                                                  | A 353-line export surface combines UI result/evidence summaries with upload limits, storage identifiers, raw parser structures, and provider/observability errors. Seven UI/route consumers import it. | Retain one public evidence DTO surface and move provider/storage/parser-only types behind Backend internals without changing the result contract.                                                            |
| `src/lib/runner-activity/product-contract.ts` and `read-model-types.ts`                   | A Product projection already exists, but six route/component/DS paths still import provider read-model types directly.                                                                                 | Complete the existing Progress boundary instead of introducing another model or framework.                                                                                                                   |
| `src/lib/admin-user-classification.ts`                                                    | Runner persisted-user resolution depends on an Admin-named classifier; Admin Backend, Admin Frontend, and QA lifecycle code also consume it.                                                           | First remove the Frontend deep import through the existing Admin DTO, then move shared actor classification under Backend identity and delete the Admin-named authority.                                     |
| `src/lib/training-api.ts` and `src/lib/training.ts`                                       | `training-api.ts` is 503 lines with 11 UI/route consumers and composes several domains. `training.ts` is 1,548 lines with 58 source/script importers.                                                  | Shrink them only after the preceding contracts have real consumers. Size alone does not authorize a split, and no repository-wide rewrite is admitted.                                                       |

The Product model is already correct in `AGENTS.md` and `docs/current-product.md`. The remaining
active-plan language in `docs/current-system.md` and `docs/current-state.md` is a later truth
reconciliation after implementation proof, not authority to preserve the old model.

## Rewrite Decision — 2026-08-18

Do **not** rewrite Hito or any whole product domain now. The incremental route can honestly reach
bounded ownership, stable public contracts, reusable focused regression evidence, and a small
repeatable release candidate. The current obstacles are finite consumer migrations, not an
irreducible runtime or data-model boundary.

The evidence is affirmative rather than aspirational:

- `runner-activity/product-contract.ts`, the Workout result route/ingestion boundary, Admin's typed
  read model, manual authoring's operation proofs, and the completed Workout sidebar read model
  already demonstrate provider/consumer contracts inside the current monolith.
- The first planned sidebar isolation has one semantic DTO, one server implementation, one shared
  route consumer, one dynamic server loader, and one existing focused proof. It can move atomically
  without schema, behavior, Frontend, or compatibility work.
- Calendar/source mixing, Progress deep imports, and Identity/Admin direction each have finite direct
  consumer sets and a deletion order. None requires two live authorities or a replacement model.
- The accepted standalone Calendar behavior and its focused persistence/browser evidence would have
  to be re-proved by a rewrite even though the current representation already supports it.

A rewrite would also attack the wrong release failure. The checkpoint accumulated 470 paths before
one Git operation, required repeated whole-file ownership reconciliation, and reached staged hygiene
only after that census; eight trailing-whitespace findings then stopped the checkpoint. The current
hosted deployment is blocked by real pre-existing duplicate Calendar occupancy after two committed
migrations applied safely. Rewriting source would enlarge the candidate, invalidate accepted domain
proof, and still require the same data reconciliation and hosted migration safety.

### Rewrite Trigger, If Later Evidence Changes

Return to ARCHITECT for one seam-specific replacement decision only if a planned slice proves at
least one of these conditions:

1. The existing persisted representation cannot express the accepted invariant without competing
   truth and no evidence-preserving migration is possible.
2. Provider and consumers cannot move to one final contract in an owner-correct serial batch without
   a permanent compatibility path or a second live authority.
3. Existing observable behavior cannot be protected by a domain regression plus boundary example,
   so the old and replacement implementations cannot be compared safely.
4. A clean, single-owner terminal batch still requires unrelated domain source or historical
   reconstruction to compile, validate, or admit to release.

Meeting a trigger authorizes discovery, not a blanket rewrite. The resulting proposal must preserve
the public contract where possible, replace one proven owner, remove the old implementation, and
retain rollback/data evidence. Until such evidence exists, the incremental phases below control.

## Delivery Baseline And Repeatable Release Mechanics

The architecture plan is paired with a smaller delivery shape; no new policy, tracker, service, or
registry is required.

1. **Stable baseline first.** Do not begin Phase 1 during the current hosted reconciliation/deploy
   chain or a repository-wide freeze. After that chain reaches a truthful terminal state and Ivan
   approves implementation, record `main`, `HEAD`, remote baseline, empty index, active writers, and
   the exact task-owned source set.
2. **One terminal batch at a time.** A batch owns explicit whole files and one contract outcome.
   Other domains remain accepted by their existing evidence. A cross-owner contract stays
   nonterminal until its immediate provider and consumer slices both finish.
3. **Hygiene belongs to the owner batch.** Before returning a source slice as terminal, cover every
   tracked and untracked task-owned file with formatting, direct whitespace, diff hygiene, focused
   contract proof, and the exact changed-path receipt. Staged hygiene still runs later when Ivan
   authorizes Git, but it should confirm rather than discover ordinary document/source defects.
4. **Checkpoint bounded outcomes.** When Ivan separately authorizes Git, checkpoint the terminal
   batch on `main` rather than accumulating unrelated Epics into another whole-checkout checkpoint.
   This recommendation grants no current stage/commit/push authority and creates no branch or PR
   rule.
5. **Release from current terminal truth.** A release retry always recomputes fresh candidate bytes,
   index, remote baseline, locks, writers, and digests as AGENTS.md requires. It may consume current
   terminal owner receipts and focused acceptance instead of rediscovering architecture or replaying
   unrelated domains. Actual movement or a failed contract invalidates the candidate; unchanged
   domain evidence is not rewritten as a new audit.
6. **Separate source, migration, and hosted gates.** A source batch can be locally complete while
   hosted parity remains unavailable. Migration work must preflight live data invariants and stop on
   conflicts, as the current duplicate-occupancy guard correctly did. A rewrite must never be used
   to bypass that data decision.

## First Measurable Batch

Phase 1 remains the first batch because it is both safe and falsifiable. It is not considered a
success merely because files moved.

### Before

- `route-data-actions.ts` imports `WorkoutDetailSidebarReadModel` from the 493-line server-only
  `workout-detail-sidebar-read-model.ts` implementation.
- That implementation exports both the five semantic Product DTO types and database-shaped
  row/builder proof types.
- `training-api.ts` dynamically loads the implementation, and the existing Workout evidence
  validator imports its private builder/test surface.
- The historical checkpoint release had no small task baseline: 470 paths, 45,099 insertions,
  8,686 deletions, four recorded admission attempts, and a later eight-line whitespace failure were
  handled as one candidate chain.

### Required After Signals

| Signal                 | Passing observation                                                                                                                                                        | Failure meaning                                                        |
| ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Public edge            | `route-data-actions.ts` and the provider import the new semantic contract; no shared route/component imports the server-only implementation                                | The boundary is not real or still leaks query ownership                |
| Private implementation | Database row picks, Supabase acquisition, FIT/manual precedence, insight eligibility, and builder inputs remain only with the read-model/proof owner                       | The new contract duplicated or exposed internals                       |
| Removal                | The five DTO exports no longer exist in the server-only file and no alias/re-export/fallback remains                                                                       | Incremental work created compatibility debt instead of migration       |
| Focused regression     | Existing Workout evidence/comparison proof, focused types/formatting, reverse import search, direct whitespace, and diff hygiene pass                                      | The slice is not behavior-preserving or release-ready at owner level   |
| Reading evidence       | The implementation receipt names only the direct contract, provider, route composer, dynamic loader, focused proof, and any evidence-driven expansion                      | Architecture still forces unrelated domain rediscovery                 |
| Ownership evidence     | Every changed production path maps to the one BACKEND implementation item; there is no mixed/nonterminal source path                                                       | The batch cannot become a small candidate                              |
| Release evidence       | If separately authorized for checkpoint/release, fresh admission reaches candidate hygiene once without owner reconciliation or late whitespace repair for unchanged bytes | Delivery mechanics, rather than Product code, still require correction |

These signals measure actual dependency direction, removal, proof reuse, ownership, and repeated
gate work. They are not time, token, file-count, or test-count limits. A later consumer-only Workout
sidebar change supplies the second confirmation: it should need the public contract and consumer,
not the Backend query internals, unless it explicitly changes that contract.

## Target Domain Edges

| Domain                      | Public contract                                                                                                          | Private internals                                                                             | Allowed outgoing edge                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Identity/profile/locale     | Authenticated subject resolution; actor classification result; runner profile, settings, locale, and timezone projection | Provider/admin clients, metadata inspection, local-account registry, profile queries          | Supplies subject/preferences to authenticated domains; never depends on Admin Analytics or plan state |
| Source authoring/provenance | Review result, immutable `WorkoutDocument`, materialisation request, saved-source/provenance projection                  | AI/import compiler, review-token implementation, source records, provider payloads            | Calls one Calendar materialisation command after explicit confirmation                                |
| Runner Calendar             | Materialise/Add/Edit/Move/Copy/Clear/Undo results; Calendar snapshot; workout detail; protection decision                | `planned_workouts` row shape, Calendar queries, RLS/RPC/audit mechanics, legacy storage names | Reads identity/timezone and evidence protection; exposes workout identity/context to results          |
| Result/evidence             | Save/upload/remove/retry results; completion, comparison, insight, and protection projections                            | Asset/revision rows, storage, parser, normalization, reconciliation, provider details         | Attributes evidence to a Calendar workout and supplies factual projections to Progress                |
| Evidence/Progress           | Product history/progress DTOs, period request, missingness, mutation readback                                            | Fact selection, formulas, source joins, persistence/cache internals                           | Read-only toward evidence, Calendar, and profile                                                      |
| Commercial/finance          | Effective access and attributable actuals only after Product decisions                                                   | Grant resolution, billing/settlement, reconciliation, forecast calculations                   | May gate a source operation; never manufactures revenue from entitlement                              |
| Admin/Owner                 | Authenticated Admin projections and read-only canonical Work Item mirror                                                 | Cross-domain acquisition, repository parsing, capture persistence                             | Reads accepted domain outputs; never becomes their authority                                          |
| Presentation/DS             | Domain DTO consumption, route state, tokens/primitives/accessibility                                                     | Business persistence and policy                                                               | Consumes public Product contracts only                                                                |
| Platform/QA/release         | Focused owner proof, independent acceptance, exact candidate evidence                                                    | Product repair and lifecycle ownership                                                        | Consumes terminal evidence; never repairs another domain during release                               |

## Delivery Rules

- PRODUCT creates or reuses one bounded canonical item for each numbered implementation slice and
  dispatches its named role only after Ivan approves this plan.
- Slices are serial when they touch a shared module, shared validator, database/runtime, or an
  intentionally changing provider/consumer contract. Disjoint domain work may run concurrently only
  under the existing AGENTS.md rule.
- Provider first defines the final contract. Consumers migrate directly to it. The old export is
  removed in the same owner slice when possible; where roles differ, the parent batch remains
  nonterminal and release-ineligible until the immediate consumer slice removes the old import. No
  compatibility alias, re-export, dual query, fallback, or shadow projection is added.
- Each phase stops at the first new product decision, persistence representation, migration, RLS
  policy, third domain, or unowned consumer. PRODUCT then routes a separate decision or owner.
- A behavior-preserving contract move can use focused source/type proof. Observable or persisted
  behavior requires the risk-derived domain/browser/database proof owned by the implementation
  item. Global QA and release remain separate.

## Autonomous Phase Operating Model

Each numbered phase has one retained parent item and one accountable implementation owner at a
time. PRODUCT advances the approved sequence without asking Ivan to relay routine handoffs or
approve ordinary investigation, fix-forward, validation, or the next owner slice.

1. The phase owner reads `AGENTS.md`, its canonical role file, the matching project skill, the
   phase item, and only the direct provider, consumer, and existing focused proof named by that
   phase. It does not restart a repository audit or read unaffected domains.
2. The owner asks the existing named ARCHITECT role for one bounded, read-only boundary review:
   the final public contract, direct callers, old responsibility to delete, and any unexpected
   owner. ARCHITECT reads its own instructions and the architecture skill before reviewing. This
   is not a second implementation or a broad redesign.
3. The phase owner implements its own domain diff, removes the superseded live path in the same
   slice, and runs the existing focused proof plus the direct provider/consumer contract check.
   UI changes add focused browser proof; persistence or auth changes add their focused durable
   proof. A full repository or Global QA replay is reserved for the Epic/release layer.
4. After the implementation owner passes its focused proof, PRODUCT automatically dispatches the
   named QA role for independent phase acceptance. QA reads only the phase contract, changed
   boundary, and risk-derived acceptance inventory; it never implements a fix. A QA finding returns
   directly to the same implementation owner for a focused fix-forward, then QA reruns the affected
   acceptance. Ivan is not a handoff point in this loop.
5. A failed owner proof or QA acceptance is fixed forward by the same implementation owner. An
   unexpected caller or cross-owner dependency is mapped by the bounded ARCHITECT review, then
   PRODUCT creates and dispatches the immediate serial owner slice automatically. It is not a reason
   to leave an undefined `blocked` state or ask Ivan to coordinate routine technical work.
6. The phase is terminal only when every required owner slice and its independent QA acceptance are
   complete, the old import/query/responsibility is absent, and the parent item records one English
   receipt. PRODUCT then gives Ivan one concise Russian report: outcome, deleted legacy,
   validation, remaining coverage gap, and the next phase.

An owner may not implement another role's production code. Therefore a phase with one domain has
one owner end-to-end; a phase crossing BACKEND, DESIGN SYSTEM, and FRONTEND remains one autonomous
phase parent with serial owner slices and one final report, rather than a cross-role code change or
a series of user-facing approval pauses. PRODUCT returns to Ivan only for a material product
choice, an irreversible hosted/data/security action not already authorized, or a scope change that
the approved plan does not cover.

## Phase 1 — Workout Detail Sidebar Contract Isolation

**Owner:** BACKEND. This is the first implementation handoff.

**Outcome:** the shared route composer consumes a semantic Workout sidebar DTO without importing a
server-only query owner or its database-shaped test types.

**Exact seams and change:**

1. Add `src/lib/workout-detail-sidebar-contract.ts` as the one justified new production file. Move
   only `WorkoutSidebarScheduledDistance`, `WorkoutSidebarRecordedDistance`,
   `WorkoutSidebarWeekSummary`, `WorkoutSidebarLatestInsight`, and
   `WorkoutDetailSidebarReadModel` into it.
2. Update `src/lib/workout-detail-sidebar-read-model.ts` to consume that contract while retaining the
   Supabase row picks, query, eligibility, and aggregation internals. Its pure builder/test input
   types stay with the implementation proof.
3. Update `src/lib/route-data-actions.ts` to import only the new contract. The dynamic server loader
   in `src/lib/training-api.ts` continues to call the query implementation.
4. Remove the moved semantic exports from the server-only file. Do not re-export them.

**Public contract:** the discriminated week/distance/insight DTO already accepted by the completed
sidebar item. **Private internals:** database row picks, Supabase acquisition, FIT/manual precedence,
latest-insight eligibility, and builder fixtures.

**Proof:** run the existing `scripts/validate-workout-evidence-comparison.ts`; run focused TypeScript
and formatting checks appropriate to the changed imports; prove by reverse search that shared route
composition no longer imports the server-only implementation. No browser replay is required unless
the DTO or rendered behavior changes.

**Rollback/stop:** revert the bounded file/import move if type or contract parity fails. Stop before
changing DTO semantics, persistence, route behavior, fixtures, or Frontend source. A need for any of
those promotes a separate Product-routed slice.

## Phase 2 — Runner Calendar Persistence Versus Source Provenance

**Serial owners:** BACKEND query boundary -> BACKEND mutation boundary -> FRONTEND Product only if a
public consumer import must change -> QA only for behavior-changing proof.

### 2A-0. Source provenance lookup prerequisite

The initial five-export Calendar query move exposed one real direction error: source
materialisation needs Calendar listing, while Calendar mutation context needs source provenance.
Before the Calendar move, extract only `getSourcePlanProvenancesForUser` into
`src/lib/source-plan-provenance-persistence.ts` with the narrow
`SourcePlanProvenanceRow` (`id`, `source_kind`, `goal_metadata`). The new owner queries source
records directly and imports neither Calendar nor `active-plan-persistence.ts`.

Keep the full `PersistedPlanCycleRow` and all source retention/library/materialisation operations in
`active-plan-persistence.ts`. Migrate only source-provenance parameters in Calendar mutation policy,
source capabilities, and the future Calendar mutation context. This establishes the one-way edge:
source materialisation -> Calendar query -> source provenance. It is a prerequisite, not a new
source model or a replacement plan container.

### 2A. Calendar query owner

- Move `PersistedPlannedWorkoutRow`, `PersistedWorkoutLogRow`, `CalendarWorkoutContext`,
  `getCalendarWorkoutsWithLogsForUser`, and `getCalendarWorkoutMutationContext` from
  `active-plan-persistence.ts` into `src/lib/runner-calendar-persistence.ts`. This new file has the
  distinct responsibility of owning Calendar rows and query/mutation context; it is not a facade.
- Migrate the direct Backend consumers in `training-api.ts`, Calendar/manual authoring operations,
  Calendar overflow, editability/protection policy, and their focused scripts. Do not re-export the
  moved names from `active-plan-persistence.ts`.
- Leave source candidate retention, immutable provenance, saved-source library, and source
  materialisation in their existing owner until the Calendar imports are zero.

### 2B. Calendar mutation owner

- Move `applyAtomicCalendarWorkoutMutation`, `applyAtomicCalendarWorkoutContentEdit`, and
  `clearAtomicCalendarFutureWorkouts` out of `active-plan-lifecycle-persistence.ts` into
  `src/lib/runner-calendar-mutations.ts`. Keep `applyAtomicReviewedPlanPersistence` and
  `applyAtomicReviewedFutureSchedulePersistence` with source materialisation.
- Move the Calendar mutation constants, event payload, editability, root-provenance readback, and
  source-capability decision out of `active-plan-workout-editing/` only after every direct caller is
  accounted for. Provenance remains an input; no operation consults a plan for permission or
  visibility.

### 2C. Public snapshot cleanup

- Keep `training-api.ts` as server transport/composition. Move persisted Calendar snapshot assembly
  behind the Calendar owner, then have transport consume its projection.
- Remove `PlanMeta` and non-null active-plan capability assumptions from the public persisted
  snapshot only after reverse search proves all signed-in consumers are already plan-neutral.
  Signed-out preview data must receive an explicit Product decision if it still needs plan-shaped
  marketing copy; it must not dictate authenticated Calendar authority.
- Rename or retire remaining `active-plan-*` source modules only after their actual responsibilities
  are singular and all consumers can move directly. Physical database/RPC names are not renamed in
  this architecture batch without a separately authorized migration.

**Public contracts:** runner-owned Calendar commands/results/snapshot and immutable source
provenance/materialisation request. **Private internals:** current table rows, audit payload storage,
RLS/RPC implementation, source records, and legacy physical names.

**Proof:** use the existing manual authoring, Runner Calendar context, Calendar overflow, reviewed
source materialisation, stored-Rest/Undo, protection, and reload proofs affected by each slice. The
boundary example must prove that confirmed AI/import/manual workouts have identical Calendar
permissions and that deleting/hiding a source cannot alter them.

**Rollback/stop:** each move is source-only and behavior-preserving unless its own item explicitly
admits persistence work. Roll back the current slice if caller parity, atomicity, source history, or
Calendar reload truth changes. Stop rather than adding a compatibility module or replacement
container.

## Phase 3 — Result And Evidence Public Contract

**Owner:** BACKEND, then FRONTEND Product only if a public import must change; independent QA only
when observable result behavior changes.

1. Retain `src/lib/workout-result-import/types.ts` as the current public result/evidence contract
   while it still serves route and Product consumers.
2. Move upload/storage constants, raw parsed FIT structures, provider-only failure details, and
   observability mechanics into `src/lib/workout-result-import/internal-types.ts`. The new file is
   Backend-private and owns only data exchanged among upload, parser, ingestion, storage, and
   observability implementations. Update Backend consumers atomically and remove those exports from
   the public contract.
3. Keep only safe action errors plus `WorkoutResultFeedbackSummary`, completion/evidence marker,
   comparison, availability, and persisted insight projections public.
4. Preserve `workout-result-import` acquisition/normalization/reconciliation as private. Calendar
   consumes only a protection/completion decision; Progress consumes only accepted factual evidence.

**Removal:** UI/routes no longer import storage/parser/provider shapes, and Calendar code no longer
reconstructs evidence eligibility. No second evidence DTO or fallback query remains.

**Proof:** extend `scripts/validate-workout-evidence-comparison.ts` for provider/consumer examples;
use existing upload/remove/retry and manual/FIT precedence proof when behavior changes. Stop on a new
storage shape, migration, evidence policy, or third-domain requirement.

## Phase 4 — Evidence And Progress Contract Completion

**Serial owners:** BACKEND provider -> DESIGN SYSTEM shared consumers -> FRONTEND Product route
consumers -> BACKEND boundary guard -> QA for the accepted Progress surface.

1. BACKEND completes the existing `src/lib/runner-activity/product-contract.ts` only for fields
   directly required by current Product/DS consumers. `read-model.ts`, `read-model-types.ts`, fact
   snapshots, formulas, FIT source joins, and scale mechanics remain provider-private.
2. DESIGN SYSTEM migrates `hito-factual-bar-chart.tsx`,
   `hito-factual-activity-point-sequence.tsx`, and the `/hitoDS` factual playground from
   `read-model-types.ts` to the Product contract without changing chart truth.
3. FRONTEND Product migrates `/progress` and its view-model/components from provider types to the
   Product contract. It does not recalculate, sample, interpolate, or infer missing facts.
4. BACKEND extends the existing Runner Activity focused validator to reject new Product/DS deep
   imports of `read-model-types.ts`. Do not add a dependency framework or global registry.

**Removal:** all route/component/DS imports of provider read-model types are zero. Internal Backend
and proof imports remain allowed. **Proof:** existing Runner Activity foundation/read-model scale,
Product projection, DS factual visualization, Product responsive surface, missingness, and focused
boundary examples; full cross-product replay waits for Epic/release.

**Rollback/stop:** keep the old internal provider types private and unchanged until every public
consumer compiles against the Product contract. If the Product contract cannot express a real
consumer need without leaking persistence/formula details, stop and return the boundary to PRODUCT.

## Phase 5 — Identity And Admin Classification Direction

**Serial owners:** FRONTEND Product Admin presentation -> BACKEND Identity/Admin -> focused QA if
rendered Admin behavior changes.

1. FRONTEND removes `admin-analytics-view-model.ts`'s direct import of
   `admin-user-classification.ts`. It derives its presentation classification type from the existing
   `AdminAnalyticsView`/row DTO in `admin-analytics.ts` and changes no classification behavior.
2. BACKEND moves the shared account/actor classification decision into
   `src/lib/actor-classification.ts`, updates `request-persisted-user.ts`, Admin Analytics, local
   test-account owners, and `scripts/lib/qa-test-user-lifecycle.mjs`, then deletes
   `admin-user-classification.ts` in the same slice. No re-export or legacy alias remains.
3. Admin becomes a consumer of Identity's explicit actor classification. Persisted runner subject
   resolution no longer depends on an Admin-named source.

**Public contracts:** authenticated subject resolution and actor classification result; Admin's own
analytics DTO. **Private internals:** Supabase app metadata, local account file, provider admin
lookup, and classification heuristics.

**Proof:** existing Admin auth, QA test-user lifecycle, local admin/test account protection, runner
persisted-user resolution, and Admin view-model cases. Stop if the classification policy itself,
hosted auth, credentials, or account mutation must change.

## Phase 6 — Shared Facade Reduction And Truth Reconciliation

**Serial owners:** BACKEND per demonstrated responsibility -> FRONTEND/DS consumer only where
required -> ARCHITECT current-system documentation -> QA/Epic/release gates.

- Reduce `training-api.ts` toward transport only as the preceding domain loaders become canonical.
  It may authenticate, validate transport input, invoke a domain command/query, and return the
  domain result; it must not derive Calendar, evidence, Progress, profile, or commercial policy.
- Treat `route-data-actions.ts` as route composition only. It may join accepted domain projections
  for one route but must not query foreign persistence or reconstruct policy.
- Do not split `training.ts` by size. For each responsibility, first prove one canonical domain
  contract and all consumers, migrate them in an owner-correct slice, then delete only the
  superseded exports. Candidate responsibilities are Calendar snapshot/types, WorkoutDocument
  aliases, result marker display, and locale/date presentation; none is pre-authorized without that
  caller proof.
- After Calendar/source implementation proof, ARCHITECT reconciles `docs/current-system.md` and
  `docs/current-state.md` so legacy table/module names are explicitly temporary implementation
  facts. `docs/current-product.md`, `docs/context.md`, and `docs/glossary.md` remain controlling and
  are not rewritten merely for consistency.
- Keep `scripts/validate-backend.mjs` as the aggregate Epic/release suite. Domain items call the
  existing focused scripts directly; add no new orchestration layer.

**Exit evidence:** `training-api.ts` contains transport/composition rather than business rules;
cross-domain UI imports resolve to public contracts; reverse searches show no retired deep imports;
current-system documentation matches accepted implementation; each domain's focused proof is green;
and independent Epic QA plus release admission remain explicitly separate.

## Domains Held Until Real Product Work

- **Commercial/finance:** existing entitlement/usage reads in Admin remain factual inputs, not a
  complete commercial or revenue authority. No restructuring begins before the recorded Product
  decisions on durable actuals, grants, provider, currency, and forecast persistence.
- **Admin Work Items:** `docs/tasks/backlog/` remains authority and `admin-work-items.ts` its read-only
  projection. This plan does not create another tracker or migrate to Notion.
- **Locale:** `ui-locale.ts`, `ui-locale-messages.ts`, and `user-settings-actions.ts` already form a
  bounded profile/locale contract. Change them only with a locale outcome, not as architecture
  churn.
- **Marketing:** no demonstrated authenticated-domain dependency requires migration.

## Acceptance And Rollback

| Layer            | Required evidence                                                                                                                                   | Not claimed                                   |
| ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| Owner slice      | Changed domain invariant, final public contract, direct consumer examples, reverse-import/removal proof, and proportional source/type/runtime proof | Other domains, Global QA, release, deployment |
| Two-domain batch | Both owner regressions plus the one provider/consumer integration; parent item stays nonterminal between serialized owners                          | A third domain or cross-product stability     |
| Epic             | Terminal domain receipts plus independent QA over accepted Runner Core or Evidence/Progress journeys                                                | Release or hosted parity                      |
| Release          | Fresh candidate freeze, exact whole-file owners, staged hygiene when authorized, build/integrity, hosted gates, and deployment authority            | Architecture repair during freeze             |

Before each implementation slice, record the unchanged baseline and exact old exports/callers. A
failed slice rolls back its own uncommitted diff or reverts its own isolated commit through the
authorized Git workflow; it never restores an old product authority through a compatibility path.
Database migrations, when separately approved, require forward/backward data proof and their own
rollback. No phase starts while a repository-wide candidate freeze is active.

## Approval And First Action

Ivan approved this no-rewrite plan after the hosted reconciliation/deploy chain became terminal.
Phase 1 began with the bounded BACKEND contract isolation and is complete. Its static right-panel
consumer retains only its existing Backend-shaped weekly workout count; the unused insight/metric
query responsibility was removed. PRODUCT now dispatches Phase 2A.

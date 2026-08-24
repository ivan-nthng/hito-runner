# Hito Product Domain Boundaries And Efficient Delivery Architecture Audit

Work Item ID: `2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit`
Status: completed
Type: Tracked
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: [Hito Runner Product Readiness And Progressive Materialization Roadmap](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Current Worktree Volume And Legacy Cleanup Follow-Up](./2026-08-17-hito-current-worktree-volume-and-legacy-cleanup-follow-up.md), [Runner Core Release Freeze And Candidate Admission](./2026-08-18-hito-runner-core-release-freeze-and-candidate-admission.md)

## Scope

Define the smallest evidence-backed product-domain and delivery-boundary model that lets Hito work
on one business process without rereading or destabilising unrelated product areas. This is a
read-only architecture decision, not a rewrite, code cleanup, new tracker, or process framework.

## Archive Intent

Retain until PRODUCT accepts a bounded operating model and routes any necessary follow-up. Compact
to the domain map, reading/validation budget, pilot sequence, and decisive evidence.

## Task

Ivan reports that repeated broad task preflights, repository-wide rediscovery, and oversized QA
matrices consume the working budget and make simple work unpredictable. Hito needs clear logical
product slices based on business processes, source-of-truth owners, dependency directions, and
proportional reading/validation scope.

The result must make the current runner product safer and cheaper to evolve: a change to one domain
must not silently rewrite, reread, or retest the whole product. Sources only propose initial
placement; confirmed Calendar workouts remain independently runner-owned.

## Required Decision

Establish from current source and canonical task evidence:

1. A compact map of business-process domains, canonical owners, direct input/output contracts, and
   permitted dependency directions.
2. A minimal change envelope for each domain: normal reading set, adjacent contracts requiring
   inspection, and the promotion condition for cross-owner work.
3. Validation tiers for Lite, domain-level Tracked, Epic acceptance, and release admission. Full
   cross-product QA is an Epic/release gate, not a default for route or copy work.
4. Only source-proven duplicate/stale/overbroad contracts that can be removed or consolidated with
   consumer and replacement proof.
5. One smallest pilot slice if a durable mapping or procedure is genuinely needed.

## Evidence And Constraints

- The current roadmap names Runner Core, Runner Evidence and Progress, adaptive planning,
  commercial/financial work, owner analytics, and platform work, but has no bounded envelope for
  ordinary task reading and proof.
- Completed Runner Core QA was an appropriate Epic gate; repeating it for a one-route UI change is
  not accepted as a default.
- The release-freeze audit proves shared files need explicit owner boundaries, but is not a
  substitute for normal product modularity.
- Inspect only direct product/domain seams and active canonical records. Do not treat every source
  file or historical backlog record as required reading.

## What Not To Touch

Runtime source, migrations, scripts, fixtures, generated types, Design System code, QA runtime,
providers, hosted data, Git lifecycle, active Frontend implementation, credentials, and user data.
Do not create a tracker, generated index, taxonomy, database truth, plan, or documentation corpus.

## Validation Expectations

Validate only this canonical item: local links, Prettier, whitespace, and `git diff --check`. No
build, runtime, browser, database, provider, or Git action is expected.

## Stage

Architecture decision complete; PRODUCT acceptance and owner routing are next

## Next Recommended Role

PRODUCT

## Original Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Product Domain Boundaries And Efficient Delivery Architecture Audit
Stage: Read-only architecture audit of product domains, bounded change envelopes, and validation tiers
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md
Plan: docs/plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md

Ivan explicitly authorized immediate research. Read AGENTS.md, agents/architect.agent.md,
skills/hito-architecture-audit/SKILL.md, this canonical item, the active roadmap, the latest
release-freeze receipt, and only source/docs directly needed for the decision.

Produce an evidence-backed, read-only decision for logical business-process domains that prevents
a narrow change from rediscovering or retesting the whole product. Preserve standalone Calendar
authority: source artifacts propose initial placement only and never regain current-workout control.

Map current domain boundaries, source-of-truth owners, direct contracts, and permitted dependency
directions. Define minimal read envelopes and validation tiers for Lite, domain Tracked, Epic, and
release work. Distinguish cross-owner facts from history that must not be reread. Identify only
source-proven consolidation candidates with consumer/replacement proof.

Recommend at most one smallest pilot if genuinely necessary. Do not implement code, build, run
browser/QA/database work, create a framework/tracker/dashboard/registry, or propose a repository
rewrite. Preserve active source and dirty work. Update only this canonical item with an English
architecture receipt, non-goals, and one next owner. Do not claim QA, release, deployment, or
production readiness.
```

## ARCHITECT Final Receipt — 2026-08-18

### Decision

Hito should treat a **business-process domain** as the smallest coherent unit that owns its factual
state, invariants, commands, read projections, Product-facing boundary, and acceptance contract.
Directories, routes, Epics, roles, and database tables are evidence about that unit, but none of
them alone defines it. At a domain edge, another domain consumes an explicit command or projection;
it does not reach through that boundary to reconstruct the producer's persistence or policy.

This is not a token, file-count, elapsed-time, or checklist budget. An owner still reads everything
genuinely required to finish safely. The goal is to remove duplicate authority and mixed ownership
so the genuinely required set normally consists of the owning domain plus the direct contracts it
crosses. Historical discovery is read only when the current item names it as evidence or current
source cannot establish the required discriminator.

No registry, generated map, framework, service split, or parallel task system is required. The
existing policy, current product truth, canonical backlog item, source modules, focused validators,
and owner receipts are sufficient once authority is coherent.

### External Principles Versus The Hito Decision

The research supports the direction but does not prescribe Hito's file layout or tooling:

- Fowler's [Bounded Context](https://martinfowler.com/bliki/BoundedContext.html) summary describes
  DDD's answer to one contradictory global model: internally unified models with explicit
  relationships between contexts.
- Fowler's [Microservice Premium](https://martinfowler.com/bliki/MicroservicePremium.html) explicitly
  recommends good modularity inside a monolith unless distributed-system complexity is justified.
  Hito has no demonstrated need for that premium.
- Bogard's original
  [Vertical Slice Architecture](https://www.jimmybogard.com/vertical-slice-architecture/) article
  groups the concerns needed for one use case and couples along the axis of change instead of
  coupling every feature through horizontal layers.
- Fowler's [Contract Test](https://martinfowler.com/bliki/ContractTest.html) and
  [Integration Test](https://martinfowler.com/bliki/IntegrationTest.html) descriptions separate a
  provider/consumer contract from a full-system replay and note that integration can be narrow.
  Pact's [consumer-driven contract documentation](https://docs.pact.io/) further illustrates that
  only behavior used by consumers needs to be frozen; this is a principle here, not a Pact adoption.
- Google's
  [risk-based testing guidance](https://testing.googleblog.com/2021/06/how-much-testing-is-enough.html)
  recommends small integration groups and reserves end-to-end proof for critical user journeys.

**Hito implementation decision:** remain one TanStack/Supabase/Vercel deployable and one operational
backlog. Inside that modular monolith, organise authority around the business capabilities below.
Each context owns a vertical state -> invariant -> command/query -> projection -> UI-contract ->
regression chain and exposes only the contracts another context actually consumes. This adopts the
principles without microservices, CQRS infrastructure, Pact, a domain registry, or a repository
rewrite.

### Execution Preflight

- **Role / mode / seam:** ARCHITECT / Tracked read-only discovery. This canonical item was the only
  writable path; no subagent was used.
- **Release boundary:** the latest release-freeze item is `blocked`, so no admitted sole-writer
  freeze was active. Branch `main`, local `HEAD` and `origin/main` were
  `abd4fe8355e3c644095111a654c1560aa265d104`; the index was empty. No remote-freshness claim is made.
- **Dirty preservation:** immediately before the first write, the 468 changed/untracked paths
  outside this item had status/type/content SHA-256
  `82b74b1268b46fe33ec623fe98caaed3be4a38f6c9536a43aab3c80fd16ec7bf`.
- **Reuse-first budget:** existing source, contracts, validators, roadmap, and this item were reused.
  New runtime artifact, documentation mechanism, registry, compatibility path, or cleanup: `none`.

### Demonstrated Causes Of Broad Rereading

| Evidence                                                                                                                                                                                                                                                                                             | Architectural consequence                                                                                                                                                                                                                                      |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/lib/training-api.ts` is 503 lines, is imported by 11 UI/routes, and directly composes profile, source provenance, Calendar rows, logs, FIT completion, feedback, editability, sidebar data, and transport.                                                                                      | The documented claim that it is only a transport wrapper is not currently true. A change in one process can require checking several unrelated facts and owners.                                                                                               |
| `src/lib/training.ts` is 1,548 lines and has 59 source/script importers in the focused census. It combines the Product snapshot, workout/provenance/evidence types, status derivation, target readback, formatting, and date helpers.                                                                | It is a high-coupling shared vocabulary, not a safely removable legacy file. Until consumers have proven replacements, any change to it requires wider direct-consumer inspection.                                                                             |
| Fifty-five current source/proof files still mention `plan_cycles`, `plan_cycle_id`, `active-plan`, or active-plan language. Calendar operations still carry provenance IDs through add, edit, move, copy, and clear code.                                                                            | Retired container vocabulary remains implementation coupling. It forces each Calendar change to prove that provenance has not regained authority. The existing standalone-Calendar migration programme owns this removal; no replacement container is allowed. |
| The latest release freeze stopped because terminal Runner Core and nonterminal Runner Evidence responsibility coexist in `route-data-actions.ts` and `training-api.ts`; the new sidebar read model is also nonterminal.                                                                              | Whole-file release ownership is mixed even though the business outcomes are distinct. Release mapping is exposing a domain-edge problem, not creating authority to repair it during release.                                                                   |
| `request-persisted-user.ts`, a runner identity seam, imports `admin-user-classification.ts` to recognise an admin identity.                                                                                                                                                                          | A foundational identity decision depends on an Admin Analytics-named owner. Shared actor metadata classification belongs upstream of both runner and Admin consumers, not inside analytics.                                                                    |
| `current-product.md` and `AGENTS.md` make Calendar workouts independently runner-owned, while `current-system.md` and `current-state.md` still describe reviewed plans, active plan cycles, and planned workouts as canonical current authority without consistently marking them as legacy storage. | Roles must reconcile contradictory current documents before touching source. Product truth is controlling; system/state docs must describe remaining names only as temporary implementation facts until migration proof permits deletion.                      |
| `validate-backend.mjs` aggregates 15 source checks spanning source authoring, Calendar, evidence, auth, locale, Admin, observability, and QA lifecycle, while focused commands already exist for those domains.                                                                                      | The aggregate is appropriate for Epic/release risk, not the default proof for every narrow owner change. Existing focused validators can prove a domain without creating a new validation framework.                                                           |

There are also positive boundaries worth preserving. `runner-activity/read-model.ts` projects through
`runner-activity/product-contract.ts` before API consumption; workout-result upload/removal routes
delegate to the `workout-result-import` owner; Admin Analytics separates server acquisition from its
typed result; and manual authoring has operation-focused proof modules behind one domain suite.
These demonstrate that stable domain contracts fit the current monolith.

### Canonical Domain Map

| Business-process domain                           | Canonical truth and invariants                                                                                                                  | Operations, read model, UI and owner                                                                                                                                                          | Permitted dependencies; forbidden reverse authority                                                                                                                                                         |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity, runner profile, preferences, and locale | Authenticated subject ID, `runner_profiles`, saved settings, calendar timezone, explicit local/test/admin metadata                              | BACKEND owns auth/profile/settings truth and projections; FRONTEND Product owns `/settings`, onboarding, and shell consumption                                                                | May be consumed by every authenticated domain. It must not depend on Admin Analytics classification, a plan, Calendar content, evidence, or commercial inference.                                           |
| Source authoring, review, and provenance          | `WorkoutDocument`, accepted AI/import/manual source payload, signed review exactness, immutable source history and export scope                 | BACKEND owns generation/import/review/materialisation input; FRONTEND Product owns proposal/review UI                                                                                         | May read profile authoring inputs and an explicit commercial capability decision. It sends reviewed documents plus provenance to Calendar materialisation. It never controls confirmed workouts afterward.  |
| Runner Calendar and workout lifecycle             | Runner-owned scheduled workout, sparse Rest state, operation-specific safety, atomic Add/Edit/Move/Copy/Clear/Undo, reload truth                | BACKEND owns persistence/RLS/RPCs, protection decisions, and Calendar/workout projections; FRONTEND Product owns `/`, `/workout/$date`, and interactions; QA owns independent flow acceptance | Reads identity/timezone, a confirmed materialisation command, and evidence protection state. Source IDs are provenance only. Calendar never asks a plan for visibility, permission, schedule, or lifecycle. |
| Workout result and evidence lifecycle             | Runner log truth; immutable uploaded source/revision; normalized actual metrics; comparison; attributable completion and evidence removal/retry | BACKEND owns `workout_logs`, activity/source/revision, ingestion and evidence projections; FRONTEND Product owns result/evidence interaction                                                  | Requires runner/workout identity. Emits result, protection, comparison, and availability projections. It never rewrites source proposals or Calendar schedule policy.                                       |
| Runner Evidence and Progress                      | Factual history, snapshots, periods, records, missingness, and evidence-backed comparisons                                                      | BACKEND owns activity read models and Product projections; FRONTEND Design System owns factual visualization primitives; FRONTEND Product owns `/progress`; QA owns acceptance                | Reads evidence truth plus only the Calendar/profile context required for attribution or display. It is read-only toward Calendar, source, profile, and commercial actuals.                                  |
| Commercial access and financial actuals           | Effective grants, usage operations, receipts/expenses/cash and their provenance remain separate authorities; missing is not zero                | BACKEND owns durable grants/actuals and projections after Product decisions; Owner Console UI is later FRONTEND work                                                                          | Uses identity as subject and may admit a source-generation capability. Entitlement never proves revenue; forecast never mutates actuals; product usage never manufactures payment.                          |
| Admin and Owner operations                        | Canonical product/commercial projections, explicit identity classification, and `docs/tasks/backlog/` for operational work items                | BACKEND owns Admin read models/import projections; FRONTEND owns Admin presentation; PRODUCT alone owns dispatch and Markdown lifecycle                                                       | Consumes projections from other domains and mirrors backlog rows read-only. It cannot become runner, finance, work-item, or release authority.                                                              |
| Product presentation and Design System            | Shared tokens/primitives/accessibility contracts; route UI state is downstream of Backend-shaped truth                                          | FRONTEND Design System owns primitives/tokens/CSS/`/hitoDS`; FRONTEND lanes own route composition; DESIGN SYSTEM INTEGRATION owns approved Figma only                                         | UI imports stable domain DTOs/commands and DS primitives. DS and Figma never own business state; routes do not reconstruct Backend rules.                                                                   |
| Public acquisition and marketing                  | Approved public claims and acquisition behavior, with no authenticated runner mutation                                                          | PRODUCT/DESIGNER define claims; FRONTEND Marketing implements public surfaces                                                                                                                 | May consume Product positioning and DS primitives. It does not import saved-mode internals merely to express marketing copy or layout.                                                                      |
| Platform, local QA, and release                   | Build/runtime integrity, fixture ownership, acceptance evidence, exact candidate identity, Git/external authority                               | Domain owners prove implementation; QA proves assigned acceptance; release owner admits only a frozen candidate                                                                               | Consumes terminal owner receipts and exact candidate bytes. It never repairs product source, infers ownership, or turns historical evidence into current product truth.                                     |

The allowed business direction is:

`identity/profile -> source review -> explicit Calendar materialisation -> runner-owned Calendar -> result/evidence -> factual Progress`.

Commercial access may gate the source operation before a provider call. Admin/Owner projections read
across accepted domain outputs. Presentation consumes projections and commands. Platform/QA/release
consumes proof. No arrow reverses ownership, and Past Plans remain a provenance/history read only.

### Hito Public Contracts And Isolation

The public surface is semantic, not a requirement to create one new file per row. Existing seams
such as `manual-workout-authoring/index.ts`, `runner-activity/product-contract.ts`, typed action
results, and focused read models should be reused. Implementation helpers, table rows, provider
payloads, and migration details remain internal to their owner.

| Context                    | May expose to another context                                                                                                                | Must remain internal                                                                                                     |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Identity/profile           | Authenticated subject resolution; runner profile/settings/locale/timezone projections; explicit actor/test metadata result                   | Auth provider mechanics, Admin client, profile table queries, local-account provisioning                                 |
| Source authoring           | Review command/result; immutable `WorkoutDocument` source payload; materialisation request; provenance/history/export projection             | Provider prompts/responses, compiler steps, review-token implementation, saved-source persistence                        |
| Runner Calendar            | Materialise/Add/Edit/Move/Copy/Clear/Undo commands with explicit failure unions; Calendar snapshot; workout-detail base; protection decision | `planned_workouts`/`plan_cycles` row shapes, RLS/RPC internals, audit payload storage, legacy source-container mechanics |
| Result/evidence            | Result-save and evidence upload/remove/retry commands; evidence/completion/comparison/availability projection                                | Raw source/revision storage, parsing, normalization, reconciliation and provider-specific payloads                       |
| Evidence/Progress          | Factual history/progress DTOs, period input, missingness and mutation readback                                                               | Snapshot formulas, record selection queries, source-revision joins and cache/invalidation details                        |
| Commercial/finance         | Effective-access decision, attributable operation/actual projection and explicit unavailable result after those authorities exist            | Grant resolution, provider billing events, money reconciliation, forecast calculation internals                          |
| Admin/Owner                | Authenticated Admin projections and read-only Work Item mirror; capture inbox commands remain separately labelled                            | Cross-domain table scans, repository parser/import mechanics, runner mutation and financial inference                    |
| Design System/presentation | Tokens, primitives, accessibility behavior, Product DTO consumption and route-specific view state                                            | Runner persistence, policy decisions, fixture truth and Figma-only representation                                        |
| Platform/QA/release        | Focused proof result, independent acceptance receipt and exact release candidate evidence                                                    | Product decisions, repair logic, old candidate snapshots and another owner's lifecycle                                   |

The smallest source rule is **private by default, public contract by evidence**:

1. A context may import another context's public command/result or projection type, not its query
   implementation, table types, provider adapter, migration, fixture, or internal helper.
2. The single database remains shared operational infrastructure, but only the owning Backend
   context reads or mutates its authoritative tables. Cross-context composition calls owner queries
   or consumes their projections rather than joining foreign persistence ad hoc.
3. A vertical feature slice may include Backend and Frontend work serially under their canonical
   roles, but the slice's contract remains one business outcome. Shared transport and route shells
   may compose contracts; they must not reimplement domain policy.
4. When a context gains a proven public boundary, extend its existing focused validator to reject
   new deep imports and to verify provider/consumer examples. Do not create a global dependency
   registry or new test framework. Existing legacy imports are migrated only with caller and
   replacement proof.
5. The owning domain regression suite protects unaffected behavior. A one-domain feature changes
   and runs that domain plus its public-contract proof; a two-domain feature runs those two domain
   suites plus their boundary integration. Every other accepted domain is presumed correct by
   default. Cross-product replay is reserved for Epic acceptance or release.

### Change Envelope As An Architectural Consequence

An envelope follows the contexts affected by behavior; it is not a separate reading policy or an
arbitrary maximum.

1. **Controlling context:** `AGENTS.md`, the assigned role, the active canonical item, and the
   relevant accepted Product invariant.
2. **Owning domain:** the authoritative state/schema or current persistence representation, its
   invariant/policy owner, the affected command or projection, the consuming UI boundary when
   changed, and its focused acceptance proof.
3. **Direct edges:** only imported or invoked contracts whose inputs, outputs, failure modes, or
   side effects can change. Inspect the adjacent owner's internals only when the contract is
   insufficient or the discriminator shows that owner is first incorrect.
4. **Conditional evidence:** current migration/RLS when persistence or authority changes; current
   browser/runtime evidence when observable behavior changes; named `Evidence From` records when
   source alone cannot establish a prior accepted fact.
5. **Not normal input:** terminal lifecycle narration, superseded prompts, unrelated Epic receipts,
   generated output, historical release inventories, and broad current documents outside the
   affected section. They remain available evidence, not recurring implementation prerequisites.

Examples follow directly from the domain map: a Calendar move change reads Calendar state,
operation policy, atomic mutation/audit/Undo, its projection and interaction plus the evidence-
protection edge; it does not read Progress formulas or Admin analytics. A Progress formatter reads
the Progress product contract, formatter/component and DS primitive; it does not read FIT ingestion
or Calendar mutations unless it changes the edge contract. A marketing copy edit reads the accepted
claim and Marketing/DS surface, not authenticated persistence.

For one-context work, the envelope ends at that context's public edges. For two-context work, it is
the union of both contexts plus the one connecting contract. An owner expands farther only when a
failed contract or missing discriminator proves that another context is actually involved. This is
domain isolation, not permission to ignore evidence.

### Validation Tiers

| Tier               | Required proof boundary                                                                                                                                                                                        | What is deliberately not inferred                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------ |
| Lite               | The focused owner check that proves the known seam or accepted decision; source/type/format checks and representative UI proof only when the changed behavior needs them                                       | No persistence, cross-owner, Global QA, Epic, release, or production claim                                         |
| Domain Tracked     | The domain invariant and affected state -> operation -> projection -> UI chain, with database/RLS/reload/browser checks only when those layers changed; direct boundary-contract checks for every crossed edge | Does not rerun unrelated domains or read terminal history merely for confidence                                    |
| Two-domain Tracked | Both affected domain regression chains plus provider and consumer examples for the declared boundary; focused integration proves the interaction                                                               | Does not activate or replay a third domain unless evidence promotes the scope                                      |
| Epic acceptance    | Terminal proofs from each participating domain plus independent QA over the accepted cross-domain journeys, failure states, persistence, reload, and supported device/browser matrix derived from Epic risk    | Does not substitute one owner's local proof for cross-flow acceptance                                              |
| Release admission  | Fresh freeze, writer/runtime serialization, exact whole-file ownership, remote/index baseline, stable bytes, staged hygiene when authorized, production build/integrity and the release inventory              | Does not discover product architecture, absorb nonterminal work, repair source, or reuse an old candidate snapshot |

These tiers select the proof implied by risk; they do not cap investigation. A failed focused proof,
an unknown cause, persisted-state change, crossed contract, or changed owner promotes the task under
the existing Lite/Tracked policy.

### Consolidation Decisions

| Candidate                                                              | Consumer/replacement proof                                                                                                                                                                                 | Decision                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Legacy plan authority in Calendar operations and current documentation | Fifty-five current code/proof paths retain legacy vocabulary; `AGENTS.md`, `current-product.md`, standalone migrations, terminal Runner Core receipts, and accepted QA establish the replacement invariant | Continue the existing serial BACKEND migration/removal programme. Relabel remaining storage names as implementation facts and reconcile `current-system.md`/`current-state.md` only after the corresponding implementation proof. Do not create a compatibility container. |
| Business composition inside `training-api.ts`                          | Eleven consumers need route entry points, but focused profile, Calendar persistence, evidence, and sidebar owners already exist                                                                            | Reduce it toward transport/composition as domain owners mature. Do not delete or split it wholesale; shift a responsibility only with caller parity and a focused replacement contract.                                                                                    |
| Admin-named identity classification used by runner identity            | Direct imports prove both runner identity and Admin analytics consume the same actor-metadata decision                                                                                                     | Move that decision under the existing Backend identity/auth authority in a later same-owner slice, then make Admin a consumer. Preserve test/admin classifications and prove both callers before retiring the Admin-owned export.                                          |
| Aggregate Backend validation as default narrow proof                   | The aggregate invokes 15 cross-domain checks, while focused validator entry points already exist                                                                                                           | Keep the aggregate for Epic/release and use existing focused validators for domain work. No new runner, manifest, or framework is needed.                                                                                                                                  |
| `training.ts` decomposition                                            | Its size and 59 consumers prove coupling, but no complete replacement or consumer migration exists                                                                                                         | Hold. Size is not deletion proof. Extract only a responsibility whose new canonical owner and all consumers are demonstrated by a later task.                                                                                                                              |

### One Existing-Work Pilot

Do not create a new pilot item. If PRODUCT continues the existing
`2026-08-15-hito-workout-sidebar-week-summary-and-latest-insight` work, use it as the single pilot:

- BACKEND owns the factual workout-detail sidebar projection in the existing
  `workout-detail-sidebar-read-model.ts` seam and returns one stable DTO;
- shared route files remain transport/composition and contain no new evidence or Calendar policy;
- FRONTEND Product consumes that DTO without reading Backend query internals;
- focused Backend read-model proof, focused Product UI proof, and independent QA for that sidebar
  close the slice; Runner Core or cross-product replay remains an Epic/release decision, not the
  default owner check.

This pilot is necessary because the latest freeze already found the same ready responsibility mixed
into terminal Runner Core whole files. It tests the boundary without adding a framework, file-count
rule, new domain registry, new role, or synthetic task.

### Non-Goals And Preserved Boundaries

No runtime source, migration, schema, RLS, fixture, script, validator, package entry, route, Design
System file, plan, history, release receipt, hosted state, provider, browser/runtime, database, Git
lifecycle, or user data changed. This audit does not rename folders, prescribe microservices,
terminalize another owner's item, admit a candidate, or claim QA, Global QA, release, deployment, or
production readiness.

### Validation Inventory

| Check                                                            | Result            | Evidence / consequence                                                                                                                                                                                   |
| ---------------------------------------------------------------- | ----------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required policy, role, skill, item, roadmap, and release receipt | Passed            | Current controlling sources were read; the blocked freeze is evidence, not a reusable candidate baseline.                                                                                                |
| Authoritative modularity and testing research                    | Passed            | Bounded contexts, modular monoliths, vertical slices, contract tests, narrow integration, and critical-journey principles were separated from the Hito decision.                                         |
| Focused source/import/consumer census                            | Passed            | Direct imports, callers, line ownership, legacy-plan references, validators, route boundaries, and positive domain seams support the decision.                                                           |
| Clarification against artificial limits                          | Passed            | The decision explicitly requires all genuinely necessary reading and reduces that set through authority and contracts, not caps.                                                                         |
| Unrelated dirty-byte and index preservation                      | Passed            | All 468 external paths retained the exact pre-write digest; the Git index remained empty.                                                                                                                |
| Links, formatting, whitespace, and diff hygiene                  | Passed            | Three local links resolved and seven researched sources were recorded; scoped Prettier, direct whitespace scan, and `git diff --check` passed. The task file remains untracked and was covered directly. |
| Runtime/build/browser/database/QA/release                        | Not run by design | Read-only architecture audit; none of these acceptance layers is claimed.                                                                                                                                |

PRODUCT is the single next owner: accept this domain model, reconcile the current ready sidebar
responsibility as the one existing-work pilot if still desired, and dispatch its demonstrated named
owner. No additional architecture artifact is required.

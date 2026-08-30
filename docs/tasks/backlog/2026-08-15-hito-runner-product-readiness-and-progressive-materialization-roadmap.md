# Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness

Work Item ID: `2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap`
Status: backlog
Type: Tracked
Priority: high
Owner: PRODUCT
Epic: runner-core-readiness
Scope: One ordered product roadmap: first reliable source-independent Calendar workouts and runner
flows, then runner Evidence and Progress, then a fresh Product decision on adaptive planning, then
paid-product, financial, and owner-analytics work.
Archive Intent: Retain while it guides open epics; compact to the accepted sequence and terminal
outcomes once all linked work is complete.
Evidence From: [Calendar Workout Standalone Entity And Plan Source Decoupling Discovery](./2026-08-15-hito-calendar-workout-standalone-entity-and-plan-source-decoupling-discovery.md)

## Task

Make the runner product coherent before adaptive planning or commercial implementation: users can
create a source, confirm independent calendar workouts, manage those workouts directly, browse and
reuse historical sources, and receive a truthful Evidence and Progress experience. Adaptive
continuation is a separate Product decision only after those two completed epics.

The supporting roadmap is
[Runner Product Readiness And Progressive Materialization Roadmap](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md).

## Accepted Direction

- A source plan is a blueprint and initial placement proposal, never a live calendar container.
- Calendar workouts remain runner-owned and origin-neutral. Past Plans are source history/provenance
  and reusable input, not a permission or scheduling owner.
- The later adaptive engine has one accepted product direction: a long-horizon blueprint plus
  exactly four detailed Calendar weeks, followed by runner-reviewed continuations. It replaces the
  all-at-once detailed-plan product path and does not run beside it.
- Hito is a modular monolith organised by business-process domains. A normal change proves its own
  domain and only explicit direct contracts; a cross-product replay is reserved for Epic or release
  acceptance. This is an operating architecture, not a new product Epic or reading limit. See
  [Hito Product Domain Boundaries And Efficient Delivery Architecture Audit](./2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md).
- Notion Task Tracker Integration follows the current release as a separate Platform Epic. Notion
  tasks and Epics will link to the repository's supporting Markdown artifacts; it does not reorder
  runner product work. See
  [Hito Notion Project Management Interface And Canonical Backlog Discovery](./2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery.md).

## Roadmap Order

1. **Runner Core: Standalone Calendar foundation** — remove legacy plan-container authority from writes, reads,
   permissions, Undo, and current vocabulary. Existing architecture decision is the prerequisite.
2. **Runner Core: schedule and source reuse** — make source confirmation, manual creation,
   Add/Edit/Move/Copy/Clear,
   result/evidence, and source-independent calendar context reliable through one workout entity.
3. **Runner Core: Past Plans and reuse** — browse immutable sources, inspect their blueprint, choose a source or
   selected block for new dates, review conflicts, and materialise independent workouts without
   replacing the user's calendar.
4. **Runner Core: readiness acceptance** — run cross-flow local and real-device QA for creation,
   editing, movement, source reuse, privacy, failure/retry, and responsive accessibility.
5. **Runner Evidence And Progress** — make activity/evidence lifecycle durable; show only supported
   factual volume, completion, load, records, coverage, and missing-state Progress. Provide an
   accessible visual/data-table contract and never infer readiness or physiology from weak data.
6. **Adaptive Blueprint Planning** — after Evidence and Progress acceptance, implement the
   accepted blueprint contract, four-week detailed horizon, continuation preview, and next-block
   confirmation. Do not silently generate or overwrite workouts.
7. **Paid Product And Financial Foundation** — establish commercial grants, payments, actual
   revenue/cost history, and data-health truth only after product facts and usage events are stable.
8. **Owner Analytics And Scenario Lab** — build decision analytics, forecasts, and scenarios on top
   of factual commercial history; forecasts never mutate actuals.

### Platform Operating Model (does not reorder product Epics)

- **Domain-isolated delivery:** apply the accepted modular-monolith domain map to each new slice;
  protect unaffected domains through their accepted regression and contract evidence instead of
  rediscovering the whole product.
- **Notion Task Tracker Integration:** after the current release, make Notion the human task and
  Epic orchestration surface, with every task linking to its repository Markdown artifacts. The
  integration transition itself remains separately scoped and must not alter runner truth.

## Open Product Decisions

- Source-library lifecycle: discard an unconfirmed draft; archive/hide a materialised source while
  retaining required provenance; reserve hard deletion for a separately defined privacy policy.
- Evidence and Progress v1: which factual cards and chart/data-table combinations first ship from
  the accepted metric doctrine, and which FIT facts need a persistent lifecycle before they appear.
- Adaptive planning has an accepted four-week horizon and a single replacement engine. Continuation
  trigger, evidence threshold, candidate-retention policy, and check-in details remain dedicated
  implementation inputs after the architecture transformation.

## Boundaries

- Do not restore an active-plan container, duplicate workout table, automatic schedule replacement,
  deterministic fallback coaching plan, or guaranteed-result copy.
- Each implementation epic receives its own canonical owner, task, proof, and QA layer. This item
  orders work; it is not an implementation authority.
- Existing financial, Admin, Design System, provider, and release work remains separate until its
  named Epic dependency is actually complete.
- Notion work belongs to `platform-and-operations`; it changes project-management orchestration and
  does not grant Notion authority over runner, commercial, or release truth.

## Product Sequencing Decision — 2026-08-16

Ivan accepted the order: `runner-core-readiness` -> `runner-evidence-and-progress` -> Product
decision on `adaptive-blueprint-planning` -> commercial and owner analytics. This item and its
supporting roadmap are the only sequence authority; the resulting implementation tasks retain their
own owners and statuses.

## Product Sequencing Update — 2026-08-18

Ivan confirmed the next release route: finish the active modular-monolith domain-boundary
transformation; replace all-at-once detailed plan generation with the adaptive blueprint and
four-week detail engine; run its full product acceptance; then begin one authorized commit/push
candidate. The retained Product contract is [Hito Adaptive Blueprint And Four-Week Detail
Engine](./2026-08-18-hito-adaptive-blueprint-four-week-detail-engine.md). This changes neither the
runner-owned Calendar authority nor the later commercial/owner-analytics sequence.

# Product Roadmap: Runner Core, Evidence And Progress, And Commercial Readiness

## Status

backlog

## Canonical Item

[Hito Runner Product Readiness And Progressive Materialization Roadmap](../../tasks/backlog/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Product Outcome

A runner can trust one personal calendar: create workouts from a source or manually, manage each
confirmed workout directly, reuse historical sources safely, and understand truthful personal
evidence and Progress before Hito considers a later adaptive-planning product decision.

## Product Model

```text
AI / imported / manual source
  -> review and explicit confirmation
  -> independently owned Calendar workouts
  -> result, evidence, edits, moves, and history
  -> factual runner Evidence and Progress
  -> [future Product decision] adaptive next-block preview
  -> explicit confirmation of additional independent workouts, if that later product is accepted
```

A source plan is never a live calendar container. Manual, AI-authored, and imported workouts are the
same entity; origin remains provenance. Past Plans preserve immutable source history and can supply
new reviewed materialisation, but cannot own, lock, replace, or hide existing calendar workouts.

## Delivery Architecture

Hito remains one modular monolith. Its product is divided into business-process domains: identity
and runner profile; source authoring and provenance; Runner Calendar; results and evidence; Evidence
and Progress; commercial and financial actuals; Admin and Owner operations; Design System and
presentation; Marketing; and platform, QA, and release.

Each domain owns its factual state, invariants, commands, projections, UI contract, and focused
regression proof. A feature reads and validates its owning domain plus only explicit contracts it
crosses. Two-domain work proves both domains and their boundary. Full product replay is reserved for
Epic acceptance and release; it is not a substitute for modularity. This is an operating
architecture, not a new Epic, framework, source registry, or artificial reading limit.

The accepted decision and the current coupling-removal priorities are recorded in
[Hito Product Domain Boundaries And Efficient Delivery Architecture Audit](../../tasks/backlog/2026-08-18-hito-product-domain-boundaries-and-efficient-delivery-architecture-audit.md).

## Registered Epics And Sequencing

| Order | Epic slug                          | Product result                                                                                                                                          | Primary owners                                                 | Exit evidence                                                                                            |
| ----- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 0     | `runner-core-readiness`            | Legacy source-container authority is removed; a runner can create, edit, move, copy, clear, complete, inspect, and reuse independent Calendar workouts. | BACKEND -> FRONTEND Product -> QA                              | Source, persistence, browser, durable reload, and supported-device acceptance pass.                      |
| 1     | `runner-evidence-and-progress`     | Runner evidence is durably captured and Progress presents only supported personal facts, coverage, and comparisons.                                     | BACKEND -> DESIGN SYSTEM -> FRONTEND Product -> QA             | Evidence lifecycle, factual metric, chart/data-table, and missing-state acceptance pass.                 |
| 2     | `adaptive-blueprint-planning`      | A later Product decision may admit bounded initial source detail and reviewable continuation from factual runner evidence and an immutable blueprint.   | RUNNING COACH + ARCHITECT -> BACKEND -> FRONTEND Product -> QA | Product decision plus blueprint, continuation, failure, stale-review, and evidence-absent matrices pass. |
| 3     | `commercial-financial-foundation`  | Paid grants, payments, actual revenue/cost history, and data health have separate durable truth.                                                        | CFO / ARCHITECT -> BACKEND -> FRONTEND                         | Commercial authority and finance-input acceptance pass.                                                  |
| 4     | `owner-analytics-and-scenario-lab` | Owner analytics and configurable forecasts use factual product and commercial history without mutating actuals.                                         | CFO / ARCHITECT -> BACKEND -> FRONTEND                         | Formula, fixture, and decision-surface acceptance pass.                                                  |
| —     | `platform-and-operations`          | Shared Design System, Admin tooling, reliability, release, and process work support the product without becoming a second product roadmap.              | DESIGN SYSTEM / BACKEND / FRONTEND / QA                        | Bounded owner proof for each item.                                                                       |
| —     | `marketing-and-growth`             | Marketing surfaces and growth experiments have a truthful acquisition/activation boundary.                                                              | DESIGNER / FRONTEND Marketing / PRODUCT                        | Bounded product and marketing acceptance.                                                                |
| —     | `legacy-history`                   | Completed non-bug historical records are classifiable without inventing a new product outcome.                                                          | ARCHITECT / PRODUCT                                            | Controlled metadata migration and Admin projection.                                                      |

## Notion Task Tracker Epic After The Current Release

Notion is the planned human task tracker and orchestration surface: tasks and Epics live there and
link to the relevant Markdown briefs, specifications, receipts, and evidence in the repository.
Markdown remains where it is as linked product documentation, not a competing user-facing project
management interface.

No Notion connection exists yet. The first bounded task after this release defines the safe
transition from the current Markdown backlog to a Notion-led task tracker, including how an agent
receives a Notion task and updates its linked repository artifacts. This is a Platform Epic and does
not change the order of runner product Epics.

Canonical task: [Hito Notion Project Management Interface And Canonical Backlog Discovery](../../tasks/backlog/2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery.md).

## Deferred Adaptive Blueprint Contract

- **Blueprint:** the runner sees phases, dates, workout family/cadence, goal assumptions, and the
  current detailed horizon. Future undeveloped sessions never pretend to be prescribed workouts.
- **Initial horizon:** accommodation plus the first normal training week. Its exact duration is a
  Running Coach decision, not a frontend constant.
- **Continuation input:** only persisted workout outcome, runner edits/misses, supported evidence,
  profile constraints, and the original immutable blueprint. Missing or contradictory evidence must
  result in an honest check-in or review state, not invented adaptation.
- **Continuation output:** a time-bounded detailed-block preview that reports its basis, preserved
  goal assumptions, conflicts, and what it will add/change. The runner explicitly confirms it.
- **Safety:** no performance guarantee, automatic overwriting, or reclassification of historical
  workout/evidence truth.

## Decisions Needed Before Any `adaptive-blueprint-planning` Dispatch

1. Choose the exact initial detailed horizon.
2. Choose whether continuation is runner-initiated, horizon-initiated, or both.
3. Define the smallest evidence/check-in threshold that permits a continuation preview.
4. Define how archive/hide differs from permanent source deletion after materialisation.

## Risks And Guardrails

- Finishing `runner-core-readiness` and `runner-evidence-and-progress` is mandatory before an
  adaptive-continuation decision; otherwise the feature would deepen the retired container model or
  act without sufficient factual runner evidence.
- A goal is a runner intention and model assumption, not a promised performance outcome.
- Future source reuse must resolve date conflicts explicitly and preserve existing calendar rows.
- Financial work must consume factual generated/confirmed/used records only after these lifecycle
  boundaries settle.

## Next Action

Complete the current Runner Core release admission. The product sequence then remains Runner
Evidence and Progress, a Product decision on adaptive blueprint planning, commercial and financial
foundation, and owner analytics. Separately, start the Notion Task Tracker Epic after the release;
it does not delay the Evidence and Progress outcome.

## Product Sequencing Decision — 2026-08-16

Ivan confirmed the order: Runner Core first, then Runner Evidence and Progress, then a fresh Product
decision on Adaptive Blueprint Planning. Commercial and owner-analytics work remain downstream.

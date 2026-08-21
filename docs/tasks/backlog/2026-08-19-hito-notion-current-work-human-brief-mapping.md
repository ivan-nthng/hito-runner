# Hito Notion Current Work Human Brief Mapping

Work Item ID: `2026-08-19-hito-notion-current-work-human-brief-mapping`
Status: completed
Type: change_request
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: `2026-08-19-hito-notion-operational-task-control-pilot-and-cutover`
Depends On: `2026-08-19-hito-canonical-backlog-legacy-reachability-prune`
Evidence From: `2026-08-19-hito-notion-task-workflow-and-human-taxonomy-discovery`

## Scope

Prepare the human-facing Notion brief for exactly the Product-admitted current work-item set. One
Notion task represents one retained product outcome and carries one human Epic; task pages link to
repository evidence rather than copying it.

## Archive Intent

Retain the 12-row mapping as the source for the current-only Notion import. Do not retain a parallel
tracker, copied research, or new task records for handoffs, QA retries, plans, or evidence.

## Task

Map each admitted source key to a short human title, summary, human Epic, category, factual lifecycle
status, current phase, owner, priority, latest meaningful update, next action, and one repository
document link. Preserve uncertainty: do not infer completion, ownership, or a replacement. The mapping
must be understandable to Ivan without decoding a filename or technical slug.

## Admitted Source Set

Use only the exact 12 source keys listed in
[the current-work reconciliation task](2026-08-19-hito-notion-human-workflow-schema-and-current-work-reconciliation.md).

## Boundaries

- Read-only discovery and task-owned documentation only. Do not mutate Notion, Markdown source tasks,
  runtime, Supabase, hosted services, Git, or task lifecycle outside this item.
- Do not read the historical backlog or re-run the reachability audit. Read only the 12 admitted
  records and their directly linked current evidence when needed.
- Do not use technical slugs, dates, or filenames as user-facing titles; retain them only as Source
  key mapping identity.
- Do not manufacture a state. A genuine ambiguity becomes a concise `Blocked`/`Decision` entry with
  its missing condition.

## Definition Of Done

- Provide one compact 12-row English import mapping with: Source key; Human title; Summary; Epic;
  Category; Priority; Status; Phase; Owner; Latest update; Next action; Repository document.
- Use only the accepted human Status, Phase, Epic, and Category vocabulary.
- Every title is action/outcome-oriented and every summary is legible without repository context.
- Identify any entry that cannot be truthfully mapped and explain the exact missing discriminator.
- Link the mapping to the current Notion reconciliation item without changing its state. No Notion
  write is performed.

## Stage

ARCHITECT current-work humanisation for the Notion import.

## Next Recommended Role

PRODUCT

## Human Import Mapping Receipt — 2026-08-19

The mapping below uses the accepted human workflow vocabulary and the exact Product-admitted source
set. Source keys remain hidden import identity; titles and summaries are human-facing. Status and
owner come from each source task's current lifecycle, while Phase is the smallest factual
description of its current work. No handoff, plan, retry, or receipt becomes another task row.

| Source key                                                                            | Human title                                 | Plain-language summary                                                                                                                                | Epic                        | Category            | Priority | Status      | Phase          | Owner     | Latest meaningful update                                                                                                                                                          | Next action                                                                                                                                                             | Repository document                                                                                          |
| ------------------------------------------------------------------------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | ------------------- | -------- | ----------- | -------------- | --------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| `2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap`    | Make the Runner Product Reliable            | Order the product work from independent Calendar workouts through evidence, adaptive planning, commercial readiness, and owner analytics.             | Runner Core                 | Research / Decision | High     | Backlog     | Decision       | PRODUCT   | Product accepted the sequence: finish the modular-monolith transformation, then the adaptive four-week engine and its acceptance before release.                                  | Keep the roadmap as sequencing authority while the active transformation finishes.                                                                                      | [Open source record](2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)    |
| `2026-08-18-hito-adaptive-blueprint-four-week-detail-engine`                          | Build Adaptive Four-Week Training           | Replace all-at-once plan generation with an immutable long-horizon blueprint and runner-confirmed four-week workout blocks.                           | Adaptive Training Blueprint | Feature             | Highest  | Blocked     | Implementation | ARCHITECT | Architecture, projection, continuation, persistence, rollback, and proof boundaries are complete.                                                                                 | Wait for the modular-monolith transformation to become terminal, then route the first BACKEND slice.                                                                    | [Open source record](2026-08-18-hito-adaptive-blueprint-four-week-detail-engine.md)                          |
| `2026-08-18-hito-hosted-fit-retaining-calendar-cleanup-and-release-continuation`      | Complete the Safe Hosted Calendar Migration | Finish hosted cleanup and migration without deleting the one retained FIT-backed workout or its evidence.                                             | Platform & Operations       | Release             | Highest  | Blocked     | Release        | BACKEND   | Cleanup removed 380 unprotected workouts and retained the protected evidence graph; the first migration stopped on missing immutable saved-plan provenance.                       | PRODUCT must decide the truthful provenance of the retained workout before BACKEND retries the three migrations, parity, and deployment.                                | [Open source record](2026-08-18-hito-hosted-fit-retaining-calendar-cleanup-and-release-continuation.md)      |
| `2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation`      | Isolate Hito Product Domains                | Establish modular-monolith ownership and stable domain boundaries without changing the runner-owned Calendar model.                                   | Platform & Operations       | Maintenance         | Highest  | In progress | Verification   | PRODUCT   | Phase 2A removed duplicate Calendar row-type ownership and is ready for an independent QA rerun.                                                                                  | QA verifies the bounded Phase 2A result; PRODUCT then continues the accepted serial plan.                                                                               | [Open source record](2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)      |
| `2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery` | Define Notion Task Control                  | Decide the safe boundary between human task orchestration in Notion and linked technical evidence in the repository.                                  | Platform & Operations       | Research / Decision | High     | Backlog     | Discovery      | PRODUCT   | A newer pilot now owns live schema and current-only reconciliation, but this older discovery has no explicit Supersedes decision.                                                 | PRODUCT must either retain a distinct unresolved discovery outcome or mark it Superseded by the active pilot before import; do not merge the rows silently.             | [Open source record](2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery.md) |
| `2026-08-18-hito-recover-failed-half-marathon-preview-as-import-json`                 | Recover the Half-Marathon Draft             | Recover the already-generated 63-workout draft through the normal private retention and review boundary without changing Calendar data automatically. | Runner Core                 | Bug                 | Highest  | Ready       | Implementation | BACKEND   | The exact pasted response was verified as valid JSON with 63 workouts; earlier Downloads, clipboard, browser-log, and network attempts produced no import artifact.               | Reuse the completed private response-capture contract, validate through the existing importer, and present the draft for explicit runner confirmation.                  | [Open source record](2026-08-18-hito-recover-failed-half-marathon-preview-as-import-json.md)                 |
| `2026-08-18-hito-runner-core-release-freeze-and-candidate-admission`                  | Admit the Runner Core Release Candidate     | Prove one stable whole-file candidate with terminal ownership before any authorized Git or deployment action.                                         | Platform & Operations       | Release             | Highest  | Blocked     | Release        | BACKEND   | The latest checkpoint staged the authorized checkout but failed whitespace hygiene in a foreign task record; the index was restored empty and no commit or push occurred.         | PRODUCT routes the exact foreign-document hygiene owner and later seeks fresh checkpoint authority; all release admission evidence must be recomputed.                  | [Open source record](2026-08-18-hito-runner-core-release-freeze-and-candidate-admission.md)                  |
| `2026-08-19-hito-canonical-backlog-legacy-reachability-prune`                         | Reconcile Legacy Backlog Records            | Separate current work and required evidence from stale, archiveable, and zero-reachability backlog history.                                           | Platform & Operations       | Research / Decision | Highest  | Done        | Acceptance     | ARCHITECT | The completed audit classified 346 items: 84 KEEP, 63 RECONCILE, 109 ARCHIVE, and 90 DELETE-CANDIDATE.                                                                            | PRODUCT decides the lifecycle of the 63 reconciliation items before any separately authorized archive or deletion batch.                                                | [Open source record](2026-08-19-hito-canonical-backlog-legacy-reachability-prune.md)                         |
| `2026-08-19-hito-manual-template-target-selection-noop`                               | Restore Manual Workout Target Selection     | Ensure a runner can choose a workout target and preserve it through review, save, and reload.                                                         | Runner Core                 | Bug                 | Highest  | Blocked     | Release        | PRODUCT   | Local interaction, persistence, focus, build, and focused QA passed; production remains on an older bundle and further local target patches were superseded by unified authoring. | PRODUCT accepts the unified-authoring route and separately resolves exact migration/deployment parity before a non-personal post-deploy replay.                         | [Open source record](2026-08-19-hito-manual-template-target-selection-noop.md)                               |
| `2026-08-19-hito-notion-operational-task-control-pilot-and-cutover`                   | Establish Notion Task Control               | Reconcile exactly the admitted current work into one human Notion surface while Markdown remains the sole writer until cutover.                       | Platform & Operations       | Maintenance         | Highest  | In progress | Implementation | PRODUCT   | Native Hito identity and the 12 source keys are accepted; BACKEND stopped because no credential-bearing Notion API seam was available.                                            | Accept this human mapping, provide the bounded API execution seam, complete snapshot/reconciliation/idempotency proof, then make a separate authority-cutover decision. | [Open source record](2026-08-19-hito-notion-operational-task-control-pilot-and-cutover.md)                   |
| `2026-08-19-hito-phase-zero-supabase-environment-admission`                           | Admit Hito Data Environments                | Prove which local, preview, and hosted Supabase environments exist and what each may safely do before the clean baseline.                             | Platform & Operations       | Maintenance         | Highest  | Blocked     | Discovery      | BACKEND   | Configuration proves preview is not isolated from hosted; live local identity and migration history remain unavailable because Docker and local Supabase are stopped.             | PRODUCT decides whether to authorize a bounded BACKEND runtime-admission pass that starts only local Docker/Supabase and reruns identity checks without reset.          | [Open source record](2026-08-19-hito-phase-zero-supabase-environment-admission.md)                           |
| `2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation`         | Unify Workout Creation and Editing          | Give manual, template, AI, imported, and edited Calendar workouts one document, editor, review, and server-confirmation contract.                     | Runner Core                 | Feature             | Highest  | In progress | Decision       | PRODUCT   | The source and Supabase persistence ledgers, migration sequence, deletion prerequisites, rollback, and proof boundaries are complete.                                             | PRODUCT accepts the combined contract; implementation waits for the active Calendar boundary work before the first BACKEND slice.                                       | [Open source record](2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md)         |

### Import Stop Condition

The older **Define Notion Task Control** discovery and the active **Establish Notion Task Control**
pilot overlap, but neither source declares `Supersedes`. They remain two factual rows in this mapping
because PRODUCT admitted both. Before provider import, PRODUCT must either identify the older task's
distinct remaining outcome or explicitly supersede it with the pilot. Import must stop rather than
create two live rows for one outcome.

### Product Resolution After Mapping

PRODUCT resolved the stop condition on 2026-08-19. The older
`2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery` record has
no remaining independent outcome: it is `superseded` and retained only as repository evidence. The
active pilot now declares `Supersedes` for that discovery. The mapping's 12 rows remain the factual
point-in-time discovery result; the exact current Notion import set is now 11 records and is owned
by [Hito Notion Human Workflow Schema And Current-Work Reconciliation](2026-08-19-hito-notion-human-workflow-schema-and-current-work-reconciliation.md).
No provider import may create a Notion page for the superseded discovery.

### Boundary And Validation

This task changed only this mapping item. It did not update the 12 source records, Notion, runtime,
Supabase, hosted state, plans, Git lifecycle, or any acceptance layer. The mapping uses exactly 12
unique source keys and the accepted Status, Phase, Epic, Category, Priority, and five-role owner
vocabulary. PRODUCT is the next owner for mapping acceptance and the explicit overlapping-outcome
decision; no successor was dispatched.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Notion Current Work Human Brief Mapping
Mode: Tracked, read-only discovery
Canonical item: docs/tasks/backlog/2026-08-19-hito-notion-current-work-human-brief-mapping.md
Evidence: docs/tasks/backlog/2026-08-19-hito-notion-task-workflow-and-human-taxonomy-discovery.md
Source set: docs/tasks/backlog/2026-08-19-hito-notion-human-workflow-schema-and-current-work-reconciliation.md

Read AGENTS.md, agents/architect.agent.md, and only skills/hito-architecture-audit/SKILL.md. Read
the canonical item, workflow decision, exact 12-item source set, then only those 12 Markdown tasks
and directly linked current evidence needed to state factual lifecycle truth.

Outcome: one compact 12-row human import mapping for Notion. For each source key provide a short
human title, plain-language summary, human Epic, Category, Priority, factual Status, current Phase,
Owner, latest meaningful update, next action, and repository document link. Preserve one task per
outcome: handoffs, research, plans, QA retries, and receipts are not tasks.

Use the accepted vocabulary exactly. Do not invent status, completion, owner, or product decisions;
mark an actual gap as Blocked/Decision with its exact missing discriminator. Do not use dates,
filenames, or technical slugs as user-facing names.

Boundaries: documentation-only. Do not mutate Notion, existing Markdown tasks, source, Supabase,
hosted services, Git, runtime, or other task lifecycles. Do not reread historical backlog or repeat
the reachability audit. Return Russian commentary to Ivan and append an English mapping receipt to
this canonical item. Do not dispatch a successor.
```

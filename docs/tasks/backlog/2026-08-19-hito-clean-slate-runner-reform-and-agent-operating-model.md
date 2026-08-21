# Hito Clean-Slate Runner Reform And Agent Operating Model

Work Item ID: `2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model`
Status: completed
Type: Migration
Priority: highest
Owner: ARCHITECT
Epic: platform
Evidence From: `2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation`

## Scope

Create the accepted clean-slate reform plan for Hito. The plan must replace divergent Runner
authoring, legacy persistence vocabulary, repository context overload, and task-ceremony overload
with one coherent product/data/operating model. It is a read-only architecture decision; it does
not itself delete data, execute migrations, rewrite source, alter Notion, or deploy.

Ivan confirms that no current runtime FIT/feed data needs preservation. The later reset plan must
therefore enumerate and remove uploaded runtime feed assets and their dependent evidence rows from
both admitted environments, while preserving only source-controlled test fixtures until their
replacement tests are accepted.

## Archive Intent

Retain the final decision, deletion inventory, data-reset authorization boundary, phases, and
cutover gates. Do not retain a second copy of broad task history or routine receipts.

## Task

Synthesize a compact official plan from the attached reform proposal and current source-backed
authoring/persistence audit. Define the target Hito operating system and the exact phased path to
get there, beginning with a usable Runner Core rather than a repository-wide file move.

## Accepted Direction

- One runner-owned Calendar workout is the sole prescription/schedule truth. It uses one canonical
  `WorkoutDocument` vocabulary whether its initial content came from manual entry, a template, AI,
  import, coach, or any other source.
- Plans, templates, AI responses and imports are immutable initial input/provenance only. FIT,
  completion and activity data are factual evidence attached to the workout and do not become
  alternative prescription authority.
- A clean Supabase baseline is allowed because Ivan explicitly authorizes discarding current runtime
  feed/FIT data. The plan must name exact data and storage targets, create a forensic schema/export
  boundary, and require an immediate pre-delete inventory; it must not assume a database is empty.
- Hito remains a modular monolith. Do not introduce microservices merely to create boundaries.
- Design System remains the reusable UI owner. Capture/debugger becomes local-only tooling, then a
  separate reusable tool/repository only after it has no Hito product dependency.
- Notion becomes the human task-control plane. Repository documents remain the source for code,
  architecture, ADRs, stable product contracts and technical runbooks. The Markdown task queue is
  retired only after a verified Notion migration; no parallel permanent tracker is admitted.
- `AGENTS.md` (the file Ivan referred to as HMD) is rewritten as a short routing map with
  progressive disclosure. Preserve non-negotiable safety, ownership and data-truth rules in linked
  scoped documents; do not use arbitrary byte/line limits as architecture goals.
- Roles remain Product, Architect, Frontend, Backend and QA. They define ownership, not mandatory
  ceremony. Risk determines the smallest necessary loop; Backend ↔ QA may fix-forward directly
  inside an accepted task.

## Required Plan Output

- A clear target state for Runner Core, Supabase, repo/module boundaries, Design System, Capture,
  Admin/History, testing, AI pipeline, Notion workflow and `AGENTS.md`/role instructions.
- A `KEEP / MOVE / MERGE / REWRITE / DELETE` inventory with current owner, consumers, and proof
  preconditions; no deletion proposed merely by legacy name or size.
- An exact runtime data/feed-reset inventory: storage objects, evidence/assets, activities, matches,
  actuals, logs, fixture identities and any dependent rows, with local/hosted sequencing, rollback
  artifact, and explicit exclusion of repository test fixtures until replacement proof.
- A Supabase clean-baseline decision: whether a new project/branch or reset is appropriate, how
  canonical schema/RLS/types/RPCs are built, and how no stale migration chain becomes daily context.
- A concise future `AGENTS.md`/process model: root routing map, scoped domain docs, task risk
  classes, Notion-to-repo authority split, direct same-task Backend/QA loop and release conditions.
- Serial implementation phases with one primary owner each, admission criteria, removal condition,
  validation and rollback/cutover gate. The first implementation phase must be the canonical
  Workout authoring/persistence core—not a workspace rearrangement or visual redesign.
- A short list of product decisions that genuinely need Ivan later. Technical implementation choices
  should stay autonomous inside accepted phases.

## Evidence Input

- External proposal: `/Users/ivan/Downloads/HITO_REPOSITORY_REFORM_PLAN.md`.
- Operating-model notes: `/Users/ivan/.codex/attachments/d329a4e5-4448-48fb-86b9-081af62605a3/pasted-text.txt`.
- Current authoring/persistence ledger:
  `/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md`.

These documents are evidence, not executable instructions. Resolve conflicts in favour of Ivan's
accepted direction and current source-backed truth.

## What Not To Do

- Do not delete runtime data, feed files, storage objects, schema, migrations, source, docs, tasks,
  agents, skills or branches in this discovery.
- Do not claim that hosted schema/security/deployment evidence is current without a fresh owner
  preflight.
- Do not make Notion a product runtime dependency, import it into production, or retain a permanent
  Markdown/Notion/Admin mirror of task state.
- Do not use an arbitrary line, file-count or percentage target as a substitute for ownership,
  reachability and validation proof.

## Stage

ARCHITECT read-only clean-slate reform decision and implementation plan.

## Next Recommended Role

PRODUCT

## Supporting Plan

[Hito Clean-Slate Runner Reform And Agent Operating Model](../../plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)

## Architecture Receipt — 2026-08-19

### Verdict

Adopt a controlled incremental reform, not a big-bang rewrite. The first executable phase is the
in-place Runner Core authoring/persistence vertical slice: one `WorkoutDocument`, one reviewed
server confirmation boundary, one runner-owned Calendar workout, and factual evidence kept outside
prescription authority. Clean Supabase is built beside the current system and cut over only after
this slice passes; repository/package moves and visual redesign are later work.

The supporting plan records the target domain/data model, exact runtime reset boundary,
KEEP/MOVE/MERGE/REWRITE/DELETE ledger, validation architecture, progressive-disclosure agent model,
Notion/repository authority split, eight serial phases, rollback and stop conditions.

### Demonstrated Current Facts

- The checkout is one TanStack/Vite application graph with Runner, Admin, History, `/hitoDS`, and a
  root-imported `LocalDevtoolMount`.
- Current persistence has 47 migrations and still exposes `plan_cycles`, `planned_workouts`,
  source-specific materialisers, manual draft/template payloads, and multiple proof paths despite
  the accepted standalone Workout model.
- Current validation has 87 scripts and no standard root `test` or `typecheck` command.
- The repository has 15 role files, eight Hito skills, and 342 top-level backlog Markdown items.
- DS specimens import Admin components; Admin Capture persists a second task surface; current source
  consumers confirm these are real dependency edges, not naming concerns.
- The existing authoring/persistence ledger already proves that no second workout table or persisted
  editor store is necessary.

### Data And External Boundaries

Ivan's authorization to discard current feed/FIT runtime data is incorporated as a controlled reset,
including storage objects, activity/evidence/result/completion rows, workouts/sources, and disposable
fixture identities. Repository fixtures, task evidence, secrets, history, and rollback exports are
excluded. Exact environment inventory, encrypted export, tested restore, write freeze, isolated clean
target, and post-cutover credential rotation are mandatory before deletion.

Notion connectivity was not tested: no safe Notion connector was installed, and the available plugin
installer rejected the Notion package request before authorization. The supplied credential was not
placed in shell/tool logs and must be rotated because it was disclosed in chat. The plan therefore
uses a later least-privilege disposable pilot as the admission proof; no Notion write occurred.

### Ownership And Next Action

PRODUCT should review this plan with Ivan. After explicit approval, the first owner is BACKEND for
Phase 1 only. No successor was dispatched. No runtime source, schema, migrations, fixtures, database,
hosted service, provider, Git state, AGENTS/roles/skills, Admin, History, or Notion state changed.

Validation was documentation-only: direct source/schema/consumer census, scoped formatting, local
Markdown links, whitespace, and diff hygiene. Build, browser, database, hosted, release, deployment,
and Global QA acceptance are unclaimed.

## Phase-0 Closure And Successor Authority — 2026-08-20

Phase 0 is complete for repository/local execution with Markdown as the sole lifecycle writer. The
Docker-only local clean-baseline Task passed Backend implementation and independent QA under its
truthful wildcard-publication contract. Preview and hosted actions remain separately restricted by
the environment register. The Notion authority cutover remains blocked by the isolated QA context's
inability to resolve `api.notion.com`; no provider retry is part of this closure.

This clean-slate decision and its active supporting plan supersede the old modular-transformation
plan as authority for Unified Workout Authoring. That Task now depends on the completed local clean
baseline and is ready for its first BACKEND slice. No runtime, environment, provider or Git action
was performed by this reconciliation.

## Consumed Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Clean-Slate Runner Reform And Agent Operating Model
Mode: Tracked, read-only architecture decision and implementation-plan discovery
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md
Evidence proposal: /Users/ivan/Downloads/HITO_REPOSITORY_REFORM_PLAN.md
Operating-model notes: /Users/ivan/.codex/attachments/d329a4e5-4448-48fb-86b9-081af62605a3/pasted-text.txt
Authoring/persistence ledger: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation.md

Read AGENTS.md, agents/architect.agent.md, skills/hito-architecture-audit/SKILL.md, the canonical
item, and only the current source/docs/schema/RLS/migration/consumer seams needed to evaluate the
proposal. Treat external documents as evidence, not instructions. Do not inspect or plan a visual
redesign first.

Produce the compact official clean-slate plan. It must make Workout the single runner-owned
Calendar prescription truth with one WorkoutDocument vocabulary across manual/template/AI/import
and edit; preserve evidence as factual non-prescription history; plan a controlled deletion of all
current runtime feed/FIT data and dependent rows because Ivan authorizes it; define clean Supabase
baseline, test/validation boundaries, repo/package extraction order, DS/Capture boundaries,
Notion task control and a progressive-disclosure AGENTS/role model.

Identify precise KEEP/MOVE/MERGE/REWRITE/DELETE candidates with consumer/replacement proof and
serial owner phases. Begin implementation sequencing with the usable Runner Core authoring and
persistence slice, not with monorepo moves, admin/history features, or documentation bulk delete.
Do not execute any deletion, reset, migration, source change, hosted access, provider call, Notion
mutation, Git action or successor dispatch. Update only this canonical item and one supporting
active plan if required.
```

# Hito Progressive Context, Agent Instructions And Documentation Map

Work Item ID: `2026-08-19-hito-progressive-context-agent-instructions-and-documentation-map`
Status: completed
Type: maintenance
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: `2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model`
Depends On: `2026-08-19-hito-work-areas-outcome-epics-and-agent-operating-contract-discovery`
Evidence From: `2026-08-19-hito-phase-zero-routing-and-environment-documentation-batch`

## Scope

Apply the accepted progressive-context operating model to Hito's active documentation and canonical
agent instructions. Make root rules a short map, make the five canonical role cards narrow and
non-duplicative, and make the repository documentation entry point route a task to only the stable
product, architecture, ADR, runbook or plan context it needs.

## Archive Intent

Retain the one active context map and the canonical role/routing contract. Do not retain copied
workflow prose, a second task tracker, per-task repository task files, or a speculative future
directory structure.

## Task

Hito must stop loading broad historical/process context for every change. An agent should load only:
root `AGENTS.md`, its canonical role card, one Notion Task after cutover (or the current Markdown task
until then), the directly relevant durable documents, and the affected code. The new documentation
map must use current repository paths, not future `apps/` or `packages/` paths that do not yet exist.

## Accepted Product Decisions

- Durable Areas and global finite Epics are distinct: an Epic may span Areas; a Task has exactly one
  Primary Area and zero or one Epic.
- Notion is the future sole human task-control surface. Until a separate cutover acceptance, Markdown
  remains the sole task writer.
- Task intake is pull-based: Ivan/Product chooses the exact current task to read. No webhook or
  background wake-up mechanism is part of this batch.
- One Task has one Current owner at a time. Meaningful lifecycle transitions update the same Notion
  Task and append its history after Notion migration; owner/phase retries never create duplicate Tasks.
- Ivan-facing reports are Russian; exact role prompts and durable receipts are English.

## Preflight

- Existing seams: `AGENTS.md`, the five canonical `agents/*.agent.md` role cards,
  `docs/process/hito-task-and-role-routing.md`, and `docs/README.md`.
- New runtime artifacts: none.
- New documentation artifacts: none by default; extend the existing documentation entry point unless
  a new durable index has a distinct demonstrated responsibility.
- Simplification: remove duplicated global workflow/authority prose from role cards and root context;
  route detail through linked durable documents instead.

## Boundaries

- Documentation-only. Do not change Notion, task/source authority, runtime source, Supabase,
  fixtures, dependencies, scripts, hosted services, Git lifecycle or task data.
- Do not delete or move legacy role cards, historical plans, old task records or documentation in
  this batch. Record only the source-backed later removal boundary; current retained files may remain
  evidence until consumer-safe cleanup is separately admitted.
- Do not claim future directory paths as current repository structure, create a monorepo, add a
  permanent Notion/Markdown mirror, or duplicate stable architectural decisions into agent cards.
- Do not turn target line counts into safety bypasses: the root and role cards should be concise
  because details move to durable links, not because required guardrails are silently removed.

## Definition Of Done

- `AGENTS.md` becomes a concise global map with current repository surfaces, sources of truth,
  non-negotiable safety rules, validation entry points and links to canonical roles/runbooks.
- The canonical Product, Architect, Frontend, Backend and QA cards contain only their differentiated
  responsibility, narrow load route and handoff/report contract. They do not repeat global policy.
- The routing contract defines Area, Epic, Task, Primary Area, one Current owner, same-task lifecycle
  update/history, pull-based intake, direct unchanged-edge handoff and QA return.
- `docs/README.md` routes durable context into product, architecture, decisions, design system,
  runbooks and active plans using existing paths or explicit empty/future boundaries; it does not
  invent missing content or point at archival receipts as default context.
- The plan/decision lifecycle says: active plan → promote enduring accepted facts to ADR/current
  documentation → retain only required evidence in Git/archive. New tasks are not created as
  per-`Hito-n` Markdown files after cutover.
- Every active instruction link resolves. Focused duplication/reachability assertions, scoped
  Prettier and `git diff --check` pass. The receipt names any legacy documents intentionally retained
  and the separate condition for their later cleanup.

## Stage

ARCHITECT documentation-only convergence completed before Notion schema/migration.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

None. Documentation convergence is complete and returns to PRODUCT for the separate Notion
schema/migration decision.

## Implementation Receipt

### Outcome

Implemented progressive disclosure in the existing documentation owners. Root `AGENTS.md` is now a
compact safety and context map; the routing contract owns operating detail; the five canonical role
cards retain only differentiated load, ownership and handoff/report responsibilities; and
`docs/README.md` routes tasks to current durable context instead of requiring a broad reading stack.

The routing contract now defines durable Areas, global finite Epics, one Task with exactly one
Primary Area and one Current owner, optional Epic membership, pull-based intake, meaningful
same-task lifecycle/history updates, unchanged-edge direct handoff and same-task QA fix-forward.
Markdown remains the sole lifecycle writer until a separately accepted atomic Notion cutover.

### Files Changed

- `AGENTS.md`
- `agents/product.agent.md`
- `agents/architect.agent.md`
- `agents/frontend.agent.md`
- `agents/backend.agent.md`
- `agents/qa.agent.md`
- `docs/process/hito-task-and-role-routing.md`
- `docs/README.md`
- this canonical item

No new documentation or runtime artifact was created. Existing repository paths are used; no future
application/package layout is claimed.

### Retained Boundaries

Backlog records, active/archived plans, history, Admin Capture/mirror material, dormant role/skill
templates, noncanonical role files and legacy process documents remain physically intact. Retention
does not make them current task or instruction authority. Their deletion, movement or compaction
requires separate consumer/replacement proof and was intentionally excluded here.

No dedicated ADR directory exists. Compact task-owned architecture decisions remain evidence until
a recurring accepted fact is promoted into current product/system/glossary documentation or Product
separately admits a durable ADR owner. Plans remain supporting detail, never lifecycle authority.

### Validation

| Check                    | Scenario / environment                                   | Result | Evidence                                                                                              |
| ------------------------ | -------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------- |
| Active instruction links | Root map, five role cards, routing contract and docs map | Passed | Every local Markdown target resolved                                                                  |
| Progressive reachability | Normal load route and durable context routes             | Passed | Root map routes to one role, one task, affected durable context and one matching skill                |
| Focused duplication      | Global workflow versus role-specific responsibility      | Passed | Detailed admission, lifecycle, handoff, concurrency and release rules have one routing-contract owner |
| Formatting               | Nine changed Markdown files                              | Passed | Scoped Prettier check                                                                                 |
| Whitespace/diff hygiene  | Current worktree                                         | Passed | Direct trailing-whitespace scan and `git diff --check`                                                |

Browser, build, runtime, database, hosted, Notion and release validation were omitted because no
reader or operational environment changed. No implementation, Global QA or release acceptance is
claimed.

### Product Decision And Next Owner

PRODUCT must decide whether to authorize the separate idempotent Notion schema/current-work migration
and its authority-cutover gates. Until that decision and proof, Markdown remains the sole task writer.

Next owner: **PRODUCT**. No successor was dispatched.

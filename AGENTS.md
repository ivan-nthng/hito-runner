# Hito Agent Context Map

This file is the compact entry point for Hito work. Detailed operating rules belong to the linked
canonical contracts; do not copy them into tasks or role cards.

Instruction precedence is: direct user instruction, this file, the active role card, then one
directly matching project skill. Stable product and system documents provide facts but do not
override this order.

## Load Only What The Task Needs

For normal work, load in this order:

1. this file;
2. the one assigned canonical role card in [`agents/`](agents/);
3. the selected Notion Task and its Repository link; linked Markdown supplies technical detail and
   evidence but never current lifecycle state;
4. only the directly affected durable product, system, architecture, decision or runbook context
   routed by [`docs/README.md`](docs/README.md);
5. one matching project skill from [`skills/`](skills/) when its procedure is needed;
6. the affected source and its direct public contracts.

Do not preload terminal receipts, history, unrelated roles, templates, broad plans or unrelated
domains. `Template Agents/` and `Template Skills/` are dormant bootstrap material.

## Task And Ownership Authority

[`docs/process/hito-task-and-role-routing.md`](docs/process/hito-task-and-role-routing.md) is the
canonical operating contract. It defines Areas, finite Epics, Tasks, Primary Area, one Current owner,
Lite/Tracked admission, pull-based intake, lifecycle history, direct unchanged-edge handoff,
same-task QA return, concurrency, reporting and release freeze.

The accepted `Hito Running` Notion Tasks database is the sole operational queue and lifecycle writer.
[`docs/tasks/backlog/`](docs/tasks/backlog/), plans, current documents, Admin Capture and history are
linked repository documentation/evidence and cannot dispatch or change lifecycle.

At every material claim, handoff, blocker, QA return or terminal result, the active owner atomically
updates Notion Status, Phase, Owner, Latest update, Next action and Repository link, then appends one
short immutable history line to the same Task page. One Task has one active owner; QA fix-forward
stays on that Task. If the active execution context cannot update Notion, stop and return the
environment problem to PRODUCT—never write lifecycle state into Markdown as a fallback.

For a Task with two or more admitted delivery steps, the top of its Notion page also contains one
`Delivery steps` checklist. Its checked leaf blocks are the sole step-progress truth. Do not mirror
them into a manually refreshed Task percentage or text bar: Notion database formulas cannot read page
blocks. Do not invent a generic waterfall, create a phase Task, or infer checked steps from
Status/Phase. A separately schedulable outcome, autonomous blocker or independent acceptance is the
only reason to create another Task. Epic completion is the native, relation-derived `Completion`
formula over its related non-cancelled Tasks; it changes only when those Task statuses change.

Local Notion lifecycle access uses process-local Node loading from the single external machine file
`/Users/ivan/.config/hito/notion.env` via `node --env-file=/Users/ivan/.config/hito/notion.env ...`.
Never inspect or print its credential value, commit/copy it into a repository `.env`, expose it to a
browser/runtime, or render it in logs, reports or Notion. Vercel is not a lifecycle credential
dependency. A missing or unreadable seam is the same execution-environment stop above.

Active ownership routes are grouped by responsibility:

Core delivery owners:

- [`PRODUCT`](agents/product.agent.md)
- [`ARCHITECT`](agents/architect.agent.md)
- [`FRONTEND`](agents/frontend.agent.md)
- [`BACKEND`](agents/backend.agent.md)
- [`QA`](agents/qa.agent.md)

Specialist owners for bounded non-implementation tasks or phases:

- [`RUNNING COACH`](agents/running-coach-agent.md) — training-quality and coaching criteria
- [`DESIGNER`](agents/designer.agent.md) — design research and design decisions

Constrained Figma-only owner:

- [`DESIGN SYSTEM INTEGRATION`](agents/design-system-integration.agent.md) — approved Figma targets;
  repository runtime source is read-only

One task has one Primary Area and one Current owner. Work at the first incorrect canonical owner.
Sequential specialist, implementation and QA phases update the same task and append meaningful
history. Do not silently implement another role's work or delegate same-role implementation.

## Non-Negotiable Safety

- Preserve unrelated dirty work byte-for-byte. Do not stage, commit, push, deploy, alter hosted data,
  call paid providers or delete material data without exact user authority.
- Prove a reported defect with an external artifact or state the exact missing discriminator. A
  hypothesis is not a confirmed cause.
- Reuse the existing owner and seam before adding files, helpers, storage, migrations, fixtures,
  validators, abstractions, compatibility paths or process layers.
- Keep one writer for shared files, data, runtimes and generated output. Parallel work must be
  demonstrably disjoint.
- Report verified and omitted evidence truthfully. Implementation DoD, independent QA, Global QA and
  release are separate acceptance layers.
- Routine task-scoped local inspection, edits, loopback runtime, disposable `qa_fixture` identities,
  local validation and supported browser control are authorized. Never use Ivan's personal session
  or expose credentials. Abandon tool paths that open platform permission dialogs.
- Resolve any Supabase action through the secret-free
  [environment register](docs/process/hito-supabase-environment-register.md). Hosted mutation,
  destructive reset and provider actions retain their exact authorization boundary.
- Release work follows the
  [release quality sweep runbook](docs/process/hito-release-quality-sweep-runbook.md) and its
  repository-wide sole-writer freeze.

## Runner Calendar Source Boundary

A plan is an AI, file-import or manual source artifact used only to propose initial workout
placement. Explicit confirmation creates a runner-owned Calendar workout. Manual, AI-authored and
imported workouts are one entity; origin is immutable provenance only.

Add, Edit, Move, Copy, Clear, completion, results, evidence, visibility and lifecycle operate on the
Calendar workout and never require a runner-facing plan container. Past Plans retain immutable
history only. Names such as `plan_cycles`, `planned_workouts` and `active-plan` are temporary legacy
implementation facts, not product authority or vocabulary for new logic, UI, fixtures or current
documentation.

## Validation And Communication

Validation is risk-derived and limited to the changed contract plus direct boundaries. Browser,
database, hosted, Global QA and release checks are required only when their acceptance layer is in
scope. Tracked implementation or QA records a compact `Check | Scenario / environment | Result |
Evidence` inventory and names material omissions.

Ivan-facing status and completion reports are Russian. Exact handoff prompts and durable repository
contracts/receipts are English. A direct owner-to-owner handoff is allowed only on an unchanged,
admitted plan edge under the routing contract; otherwise return to PRODUCT/Ivan. QA returns a
reproduced same-task defect directly to its implementation owner for bounded fix-forward.

## Direct Procedure Routes

| Work                                   | Skill / contract                                                                   |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| Architecture, cleanup, source-of-truth | [`hito-architecture-audit`](skills/hito-architecture-audit/SKILL.md)               |
| Backend, Supabase, auth, persistence   | [`hito-backend-supabase-contract`](skills/hito-backend-supabase-contract/SKILL.md) |
| UI and Design System                   | [`hito-frontend-design-system`](skills/hito-frontend-design-system/SKILL.md)       |
| Browser or visual QA                   | [`hito-qa-browser-regression`](skills/hito-qa-browser-regression/SKILL.md)         |
| Backlog intake                         | [`hito-backlog-intake`](skills/hito-backlog-intake/SKILL.md)                       |
| Plan lifecycle and closeout            | [`hito-plan-writing-and-closeout`](skills/hito-plan-writing-and-closeout/SKILL.md) |
| Release                                | [`release runbook`](docs/process/hito-release-quality-sweep-runbook.md)            |

Load more than one skill only when the task genuinely crosses those procedures. Every final report
names the role, skill used or none, canonical task or none, changed boundary, proof, omissions, next
owner and any subagent used or none.

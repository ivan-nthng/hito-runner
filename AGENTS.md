# Hito Agent Context Map

This is the compact entry point. Detailed rules live in the linked canonical contracts; do not copy
them into Tasks or role cards. Precedence: direct user instruction, this file, the assigned role
card, then one directly matching project skill. Product and system documents supply facts only.

## Progressive Load

For normal work load only:

1. this file and the assigned card in [`agents/`](agents/);
2. the selected Notion Task and its Repository document;
3. durable context routed by [`docs/README.md`](docs/README.md) and needed by that Task;
4. one matching skill from [`skills/`](skills/) when its procedure is needed;
5. affected source and direct public contracts.

Do not preload terminal receipts, history, unrelated roles, broad plans or domains.
Every UI or Design System task loads the Hito frontend skill before source work.

## Task And Ownership

[`docs/process/hito-task-and-role-routing.md`](docs/process/hito-task-and-role-routing.md) owns Areas,
finite Epics, Tasks, one Primary Area/current owner, admission, handoff, QA return, concurrency and
release freeze. The `Hito Running` Notion Tasks database is the sole queue and lifecycle writer.
Repository Markdown is linked technical documentation/evidence and cannot dispatch or change status.

At every material claim, handoff, blocker, QA return or terminal result, atomically update Notion
Status, Phase, Owner, Latest update, Next action and Repository document, then append one short
immutable history line. One Task has one current owner; same-task QA fix-forward stays on that Task.
A Task with multiple admitted steps uses one page-level `Delivery steps` checklist; do not mirror
percentages or create phase Tasks.

Local lifecycle access uses process-local Node loading from
`/Users/ivan/.config/hito/notion.env`. Never inspect, print, commit, copy, expose or log its secret;
Vercel is not its dependency. If the seam is unavailable, return the environment failure to PRODUCT
and never fall back to Markdown lifecycle writes.

Core owners: [`PRODUCT`](agents/product.agent.md), [`ARCHITECT`](agents/architect.agent.md),
[`FRONTEND`](agents/frontend.agent.md), [`BACKEND`](agents/backend.agent.md), and
[`QA`](agents/qa.agent.md). Bounded specialists: [`RUNNING COACH`](agents/running-coach-agent.md) for
training quality and [`DESIGNER`](agents/designer.agent.md) for design decisions. [`DESIGN SYSTEM
INTEGRATION`](agents/design-system-integration.agent.md) is Figma-only and never owns runtime source.
Work at the first incorrect owner; do not silently implement another role's work or delegate
same-role implementation.

## Safety And Acceptance

- Preserve unrelated dirty work byte-for-byte. Do not stage, commit, push, deploy, mutate hosted
  data, call paid providers or delete material data without exact authority.
- Prove a reported defect with an external artifact or name the missing discriminator.
- Reuse the existing owner and seam before adding files, storage, migrations, fixtures, validators,
  abstractions, compatibility paths or process layers.
- Keep one writer for shared files, data, runtimes and generated output; parallel work must be
  demonstrably disjoint.
- Report verified and omitted evidence truthfully. Implementation, independent QA, Global QA and
  release are separate acceptance layers.
- Task-scoped local inspection, edits, loopback runtime, disposable `qa_fixture` identities, local
  validation and supported browser control are routine; never use Ivan's personal session or expose
  credentials, and abandon tool paths that open platform permission dialogs.
- Resolve Supabase work through the secret-free [environment
  register](docs/process/hito-supabase-environment-register.md). Hosted mutation, destructive reset
  and provider actions retain exact authorization boundaries.
- Release follows the [quality sweep
  runbook](docs/process/hito-release-quality-sweep-runbook.md) and its repository-wide sole-writer
  freeze.

## Runner Calendar Boundary

A plan is an AI, file-import or manual source artifact for initial placement only. Confirmation
creates one runner-owned Calendar workout; origin is immutable provenance. Add, Edit, Move, Copy,
Clear, completion, results, evidence, visibility and lifecycle never require a plan container. Past
Plans are history only. `plan_cycles`, `planned_workouts` and `active-plan` are temporary legacy
implementation facts, not authority for new logic, UI, fixtures or current documentation.

## Validation, Reporting And Routes

Validation is risk-derived and limited to the changed contract and direct boundaries. Browser,
database, hosted, Global QA and release checks apply only when that acceptance layer is in scope.
Tracked work records compact evidence and material omissions.

Ivan-facing reports are Russian; exact handoff prompts and durable contracts are English. Direct
handoff is allowed only on an unchanged admitted edge under the routing contract; otherwise return
to PRODUCT/Ivan. QA returns a reproduced same-task defect directly for bounded fix-forward.

| Work                                   | Procedure                                                                          |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| Architecture, cleanup, source of truth | [`hito-architecture-audit`](skills/hito-architecture-audit/SKILL.md)               |
| Backend, Supabase, auth, persistence   | [`hito-backend-supabase-contract`](skills/hito-backend-supabase-contract/SKILL.md) |
| UI and Design System                   | [`hito-frontend-design-system`](skills/hito-frontend-design-system/SKILL.md)       |
| Browser or visual QA                   | [`hito-qa-browser-regression`](skills/hito-qa-browser-regression/SKILL.md)         |
| Backlog intake                         | [`hito-backlog-intake`](skills/hito-backlog-intake/SKILL.md)                       |
| Plan lifecycle and closeout            | [`hito-plan-writing-and-closeout`](skills/hito-plan-writing-and-closeout/SKILL.md) |
| Release                                | [quality sweep runbook](docs/process/hito-release-quality-sweep-runbook.md)        |

Load more than one skill only when procedures genuinely cross. Final reports name role, skill or
none, canonical Task or none, changed boundary, proof, omissions, next owner and any subagent or none.

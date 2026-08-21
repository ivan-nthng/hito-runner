# Hito Phase Zero Routing And Environment Documentation Batch

Work Item ID: `2026-08-19-hito-phase-zero-routing-and-environment-documentation-batch`
Status: completed
Type: Migration
Priority: highest
Owner: ARCHITECT
Epic: platform
Parent: `2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model`
Depends On: `2026-08-19-hito-operating-model-documentation-and-supabase-environment-reset`

## Scope

Implement the documentation-only first slice of Phase 0: progressive task/role routing, Russian
user-facing reports with English execution prompts, and an explicit Supabase environment register
without secrets. Rewrite the root instruction map and five canonical role cards only after their
replacement documents exist and link correctly.

## Archive Intent

Retain the accepted routing and environment contracts as stable runbooks. Do not retain duplicate
process prose or a permanent task-state mirror.

## Task

Make focused work load only the root safety map, its current task, one role card, the nearest domain
contract and a direct boundary runbook. Establish direct, bounded owner-to-owner handoff and
Backend/QA fix-forward. Record the real local environment and unresolved preview/hosted identities
without guessing values or changing any provider state.

## Evidence

- [Phase-0 decision](2026-08-19-hito-operating-model-documentation-and-supabase-environment-reset.md)
- [Clean-slate plan](../../plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)
- Existing release runbook: `docs/process/hito-release-quality-sweep-runbook.md`

## What Not To Touch

- No product/runtime source, migrations, data, FIT/feed assets, Supabase project, Vercel target,
  credentials, Notion state, dependencies, package moves, staging, commit, push, deployment, or
  deletion of existing documents, roles, skills, templates, prompts, backlog, Admin mirror or
  Capture.
- Do not make Notion authoritative or attempt the Notion pilot.
- Do not claim preview and hosted are different until their project identity is evidenced.

## Definition Of Done

- One concise task/role routing contract defines transitional Markdown authority, final Notion
  authority, five roles, direct unchanged-scope handoff, Backend/QA fix-forward, exception return,
  Russian reports and English prompts.
- One secret-free environment register/runbook contains the factual local row and explicit unknown
  preview/hosted rows, admission fields and fail-closed lifecycle rules.
- `AGENTS.md` becomes a progressive-disclosure routing/safety map linking the contracts; safety,
  runner-truth, dirty-work, external mutation, validation and release rules remain reachable.
- Exactly five canonical role cards retain only unique ownership and links to direct guidance.
- No active execution reference is broken; preserved material has a migration/replacement owner,
  not a speculative deletion claim.

## Validation

Validate links, Markdown formatting, direct instruction/role reference resolution, whitespace,
`git diff --check`, and a source-backed inventory of retained versus superseded process material.
No build, browser, database, Notion, hosted, provider, Git lifecycle or Global QA claim is required.

## Stage

Phase 0A documentation-only operating-model implementation.

## Next Recommended Role

PRODUCT

## Implementation Receipt — 2026-08-19

### Outcome

Phase 0A documentation is implemented. The repository now has one progressive task/role contract,
one secret-free Supabase environment register, a short root routing/safety map, and five reduced
canonical role cards. Markdown remains the sole task authority; Notion remains a future pilot.

The target owner chain no longer makes Product a routine relay. An active owner executes, validates,
fixes forward and reports to Ivan in Russian. It may dispatch one exact English prompt directly to
the accepted plan's unambiguous next owner only when scope/acceptance are unchanged, write ownership
is released, files/data/environment and rollback are admitted, and no external authority is missing.
QA returns a reproduced same-task failure directly to its implementation owner. Product/Ivan retains
new decisions, exceptions, unsafe/external authority, failed recovery and final acceptance.

### Files Changed

- [`AGENTS.md`](../../../AGENTS.md) — progressive routing and non-negotiable safety/Runner truth map.
- [Task And Role Routing](../../process/hito-task-and-role-routing.md) — current authority, five
  roles, admission/risk, bounded direct handoff, concurrency, local/external safety, validation,
  reporting and release routing.
- [Supabase Environment Register](../../process/hito-supabase-environment-register.md) — admitted
  local row, unresolved preview/hosted rows, secret-free evidence fields and fail-closed lifecycle.
- `agents/product.agent.md`, `agents/architect.agent.md`, `agents/frontend.agent.md`,
  `agents/backend.agent.md`, and `agents/qa.agent.md` — unique ownership, load order, Russian visible
  reports and English exact prompts.
- This canonical item — truthful lifecycle and receipt.

### Retained And Superseded Inventory

| Material                                                  | State after this batch                                                         | Later owner/gate                                                        |
| --------------------------------------------------------- | ------------------------------------------------------------------------------ | ----------------------------------------------------------------------- |
| `docs/tasks/backlog/`, plans, briefs/specs and history    | Retained byte-for-byte; backlog remains authority                              | Product Notion pilot/cutover and later evidence-safe documentation task |
| Admin mirror/importer/Quick Notes/Capture data and source | Retained byte-for-byte; not task authority                                     | Product migration proof, then Backend/Frontend removal task             |
| Ten prompt files, eight Hito skills                       | Retained; general duplicated operating prose is superseded by linked contracts | Architect consumer/reference audit after stable pilot                   |
| Noncanonical role files                                   | Retained for existing task/chat continuity; no new canonical ownership         | Product/Architect active-reference and unique-guidance reconciliation   |
| `Template Agents/`, `Template Skills/`                    | Retained dormant and explicitly excluded from execution                        | Later move/delete task with manifest/hash and zero-reference proof      |
| Existing release runbook                                  | Retained and directly linked from root/routing/environment contracts           | Release owner; no behavior change in this batch                         |
| Environment and secret files                              | Retained unchanged; values never copied                                        | Backend identity admission/rotation tasks                               |

No document, role, skill, prompt, task, mirror, data row or environment was deleted or archived.

### Validation

| Check                   | Scenario / environment                                               | Result | Evidence                                                                     |
| ----------------------- | -------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------- |
| Markdown format         | Nine task-owned Markdown files                                       | Passed | Scoped Prettier                                                              |
| Local links             | Root, two contracts, five role cards and receipt                     | Passed | Every relative target resolved                                               |
| Instruction resolution  | Root -> routing/environment/release -> five roles -> matching skills | Passed | Direct path inventory; no canonical role or required runbook missing         |
| Authority discriminator | Transitional queue and future Notion boundary                        | Passed | Root and routing contract both name Markdown as sole current authority       |
| Secret safety           | Environment register and changed diff                                | Passed | No credential values added; unknown hosted/preview identity remains explicit |
| Whitespace/diff hygiene | Changed documentation only                                           | Passed | Direct trailing-whitespace scan and `git diff --check`                       |

No build, browser, runtime, database, hosted, Notion, provider, dependency, Git lifecycle, release or
Global QA validation was run or claimed. PRODUCT is the next owner for Phase-0 review and the future
Notion pilot decision; no successor was dispatched from this task.

## Consumed Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Phase Zero Routing And Environment Documentation Batch
Mode: Tracked, documentation-only implementation
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-phase-zero-routing-and-environment-documentation-batch.md
Phase-0 decision: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-19-hito-operating-model-documentation-and-supabase-environment-reset.md
Parent plan: /Users/ivan/Developer/hito-running/docs/plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md
Existing release runbook: /Users/ivan/Developer/hito-running/docs/process/hito-release-quality-sweep-runbook.md

Read AGENTS.md, agents/architect.agent.md, skills/hito-architecture-audit/SKILL.md, the canonical
item, Phase-0 decision, parent plan, and only the current instruction/role/importer/environment
seams needed to implement the admitted documentation batch.

Create one concise task-and-role routing contract and one secret-free Supabase environment
register/runbook. Rewrite AGENTS.md as their progressive-disclosure map. Reduce only the five
canonical role cards to unique ownership, current load order, Russian user-facing reports and exact
English handoff prompts. Preserve every required safety, runner-truth, dirty-work, external-action,
validation and release rule through direct links. Keep Markdown as current task authority; Notion is
only a future pilot. Direct owner-to-owner dispatch is allowed only for an unchanged plan edge with
one named owner, released write ownership, admitted files/data/environment, rollback and no external
authority gap; otherwise return to Product/Ivan. QA must return a reproduced same-task defect directly
to its implementation owner for fix-forward.

Do not delete or archive any material, mutate source/schema/data/environments/Notion, expose or
change secrets, create packages, alter dependencies, run hosted actions, or stage/commit/push/deploy.
Update this canonical item and only the task-owned documentation/role artifacts. Validate links,
formatting, instruction resolution, retained/superseded inventory and diff hygiene. If a requested
document change requires a product or irreversible policy decision, stop and report it.
```

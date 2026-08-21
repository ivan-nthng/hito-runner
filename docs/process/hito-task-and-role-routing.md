# Hito Task And Role Routing

## Status And Authority

Active operating contract after the accepted Notion authority cutover on 2026-08-20.

The `Hito Running` Notion Tasks database is the sole operational task authority and lifecycle writer.
Admin Capture, repository Markdown, plans, briefs, specifications, prompts and history are intake,
linked technical documentation or evidence; none may independently dispatch or change lifecycle.
Permanent dual writing and a Markdown lifecycle fallback are prohibited.

## Instruction Precedence And Load Order

Precedence is direct user instruction, root [`AGENTS.md`](../../AGENTS.md), the assigned canonical
role card, then a directly matching project skill. Stable product/domain contracts and operation
runbooks supply facts; they do not override that order.

A normal task loads only:

1. root `AGENTS.md`;
2. its one Notion Task and linked Repository document when present;
3. its one canonical role card;
4. the nearest stable domain/product contract;
5. a direct boundary or operation runbook only when affected;
6. one matching skill when its procedure is actually needed.

Do not read terminal receipts, historical plans, unrelated roles, templates or broad documentation
to reconstruct authority unless the task names a factual discriminator that requires them.

## Task Admission And Risk

### Work Vocabulary

- **Area** is an enduring business or delivery capability and has no completion state. The controlled
  human set is Runner, Admin & Business Operations, History, Marketing, Design System, Platform and
  Developer Tools. A new Area requires Product evidence of durable independent ownership; a package,
  provider or technology name is insufficient.
- **Epic** is one finite, globally visible outcome. It may span multiple Areas and is never contained
  by one Area. An enduring responsibility is not an Epic. Area labels are never copied into Epics
  merely to group work; current Epic identity and lifecycle live only in Notion.
- **Task** is one admitted, owned unit of work. It declares exactly one **Primary Area** for ownership
  and focused validation, zero or one Epic, and one **Current owner** at a time. A narrow patch or
  standalone operational task may have no Epic.

Plans, prompts, handoffs, QA retries and receipts are evidence or lifecycle events inside the same
Task, not new Tasks. Research becomes its own Task only when the research decision is the admitted
outcome.

### Pull-Based Intake And Admission

Ivan or Product selects the exact current Notion Task. Agents do not poll the database, infer work
from dirty files, wake from webhooks or scan unrelated backlog/history for something to execute. One
Task has one Primary Area, Current owner, admitted outcome, files/data/environment, proof boundary,
rollback and Repository link. Supporting Markdown and plans add technical detail but never own
status.

Use Lite only for one known owner, one known seam, no persisted/auth/external/release risk and one
focused proof. Use Tracked for unknown causes, multiple surfaces or owners, persistence/schema/RLS,
auth/security, provider/hosted work, destructive/reset/release work or Global QA. Promote immediately
when a Lite assumption fails; do not demote behavior-changing work.

Before a write, state the accepted outcome or demonstrated cause, owner and existing seam, smallest
change, proposed new artifact or `none`, removed/simplified responsibility, proof and stop condition.
A reported defect needs a reproducing artifact or exact missing discriminator; a hypothesis is not a
confirmed cause.

### Same-Task Lifecycle And History

At each material claim, owner/phase handoff, blocker, QA return, implementation result, release result
or final acceptance, the active owner performs one lifecycle update on the same Notion Task:

1. atomically set truthful `Status`, `Phase`, `Owner`, `Latest update`, `Next action` and
   `Repository link` values; and
2. append one concise, timestamped, immutable history line to that Task page.

Routine commands, commentary and unchanged retries do not create history entries. A retry changes
Phase or Current owner on the same Task; it never clones the Task or creates a handoff Task. Same-task
QA fix-forward uses the same rule. Repository Markdown holds linked technical contracts, plans,
ADRs/current truth and evidence only; it never receives lifecycle updates after cutover.

### Delivery-Step Visibility

When a Task has two or more admitted delivery steps, its Notion page begins with one `Delivery steps`
checklist. Checked leaf blocks are the only source of step-progress truth. Do not add a manually
refreshed Task percentage or text bar: formulas and rollups operate on database properties, not page
body blocks. At every material lifecycle update, the active owner updates the relevant checkbox(es)
only; it does not maintain a duplicate projection.

`Phase` continues to mean the current kind of work, such as Implementation or Verification. It is
not a numbered delivery sequence. Do not create a phase Task, fixed waterfall checklist or second
tracker. Add a separate Task only for a separately schedulable outcome, an autonomous blocker or an
independently accepted result.

The `Hito Epics` native numeric `Completion` formula is derived from its related non-cancelled Task
statuses: `Done / (all related Tasks except Cancelled)`. It is a navigation projection, not an Epic
lifecycle state. Notion owns any percentage/bar presentation of that computed number; agents never
write a text bar. A Task without an admitted delivery checklist shows no invented percentage.

If an active role context cannot update the live Notion Task, stop before execution or handoff and
return that execution-environment gap to PRODUCT. Do not silently change a Markdown `Status`, owner,
stage or receipt as a fallback.

### Local Notion Lifecycle Seam

Every named local Hito role reads and writes Notion lifecycle only through process-local Node loading
from `/Users/ivan/.config/hito/notion.env`:

```text
node --env-file=/Users/ivan/.config/hito/notion.env ...
```

The machine file is the sole local credential owner. Never inspect or print its value, commit or copy
it into a repository `.env` file, pass the credential as a command argument, expose it to browser or
product runtime code, or render it in logs, reports or Notion content. Vercel is not a Notion
lifecycle credential dependency. Missing/unreadable local loading is an execution-environment failure
returned to PRODUCT; it never authorizes Markdown lifecycle writes.

The seam changes no lifecycle semantics: one Current owner remains mandatory, and each material
transition atomically updates Status, Phase, Owner, Latest update, Next action and Repository link,
then appends one history line on the same live Notion Task.

## Active Role Matrix

A role may be Current owner only for the bounded responsibility below. Ownership changes are
sequential transitions on the same Task; they never create parallel lifecycle authority.

### Core Delivery Owners

| Role      | Unique ownership                                                                                                    |
| --------- | ------------------------------------------------------------------------------------------------------------------- |
| PRODUCT   | Intake, priority, product intent/acceptance, new decisions, exceptions and final acceptance                         |
| ARCHITECT | Cross-domain boundaries, source-of-truth decisions, data architecture, migration sequencing and ADR-level plans     |
| FRONTEND  | Runner/Admin/History/Marketing UI, interaction, accessibility and all repository Design System implementation       |
| BACKEND   | Domain/application truth, validation, persistence, Supabase, auth/entitlement, server/API, imports/providers and AI |
| QA        | Independent risk-based acceptance and reproducible regression evidence; never product implementation                |

### Specialist Owners

| Role          | Admitted ownership                                                                                                | Repository boundary                                           |
| ------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------- |
| RUNNING COACH | Bounded training-quality reviews, safety criteria and coaching-rule decisions                                     | No runtime implementation or technical QA                     |
| DESIGNER      | Bounded design research, information architecture, interaction/visual decisions and implementation specifications | No runtime implementation or backend/product-policy invention |

Specialist work may be the Task outcome or one named phase in an accepted plan. When a specialist
phase finishes, its decision and evidence are appended to the same Task before Current owner moves to
the next named role.

### Figma-Only Work

| Role                      | Admitted ownership                                                                                         | Repository boundary                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| DESIGN SYSTEM INTEGRATION | Product-approved Figma target discovery, code-to-Figma mapping, Figma mutation and Figma-side verification | Repository runtime source, CSS, tokens, components, scripts and configuration are read-only |

Design System repository implementation is the FRONTEND Design System lane, not a separate engineer
owner. `agents/design-system.agent.md` is a retained legacy instruction file and cannot receive new
Task ownership. Other non-matrix role files, chats, prompts, skills and templates remain retained
legacy material until consumer-safe cleanup; physical retention does not activate them.

## Bounded Autonomous Owner Chain

Product is not the routine message relay. The active phase owner owns execution, focused validation,
same-task fix-forward, truthful lifecycle and the visible Russian status/completion report.

A completed owner may write one exact English prompt and dispatch it directly to the plan's next
named canonical owner only when all are true:

- the accepted plan names exactly one next owner and unchanged outcome/acceptance;
- the previous writer has released the relevant files, data, runtime and generated outputs;
- the next slice's files, data and environment are admitted and its rollback is recorded;
- no Product/design decision, new scope/owner, destructive or irreversible action is introduced;
- no hosted mutation, paid provider, deployment, staging/commit/push or other external authority is
  missing;
- no candidate freeze or shared-runtime ownership forbids the handoff.

Otherwise return to Product/Ivan. The chain may not create tasks, invent owners, absorb unrelated
defects, widen deletion, create an unplanned package/framework/state/compatibility layer, reinterpret
acceptance or claim final acceptance.

QA sends a reproduced same-task failure directly to the primary implementation owner. That owner may
fix forward without Product redispatch while scope, owner domain, risk, environment and acceptance
remain unchanged. QA stays read-only for product code. Return to Product/Ivan for ambiguity, changed
scope/owner/risk, product/design choice, unsafe/external action, failed recovery/rollback or final
acceptance.

Current owner changes only after the prior owner records a truthful outcome/stop boundary and
releases the admitted files, data, runtime and generated outputs. The receiving owner confirms the
same Task identity, Primary Area, Epic if any, unchanged outcome and admitted boundary before its
first write.

## Execution And Concurrency

- Preserve unrelated dirty work byte-for-byte. One production writer owns a shared boundary at a
  time. Parallel work requires demonstrably disjoint files, data, runtimes, generated output and
  validation side effects.
- Work at the first incorrect canonical owner. Reuse an existing seam before adding a helper, file,
  migration, validator, fixture, store, abstraction or compatibility path.
- An owner implements its own domain and does not delegate same-role implementation. Cross-owner
  implementation is a named plan edge, not a subtask.
- Bounded read-only assistance may use an existing named Hito role only when it materially resolves
  evidence. No invented roles, generic implementation subagents, secrets, hosted/destructive work or
  overlapping writers.
- Stop expansion when a second owner, new persistence shape, external action, product decision,
  release gate or unplanned mechanism is required.

## Product Surfaces And Frontend Boundaries

Production deployable surfaces are Runner, Admin and History. Debugger/Capture is local-only and must
have no production import, route, bundle, server or observability path. If it later reads Runner
state, it uses a narrow read-only debug contract, never private product imports.

Design System is shared Frontend ownership. Reusable tokens, primitives, components, canonical DS
CSS, accessibility contracts and `/hitoDS` belong to the Design System specialization. Product
features compose them without creating competing primitives. Domain, AI, data or observability
become packages only when source-backed multi-surface consumers require a stable public contract;
directory shape alone is not a reason.

Every FRONTEND task names one lane: Product, Marketing, DevTools (local-only), or Design System.
Mixed-lane production changes are separate named plan edges.

## Local, External And Secret Safety

Routine source inspection, local edits, loopback runtime control, disposable `qa_fixture` identities,
local validation and supported local browser use are standing-authorized inside the assigned task.
Do not ask Ivan for local test credentials or browser choice. Never use Ivan's personal session or
hosted account for local QA. Abandon a tool path that opens a platform permission dialog and use a
supported non-prompting local path.

Never print or persist secrets. Hosted/production mutation, provider calls, new recurring cost,
staging, commit, push, deployment, material deletion and destructive reset require exact authority.
Every Supabase action must first resolve through the
[environment register](hito-supabase-environment-register.md) and fail closed on identity conflict.

## Validation And Reporting

Validation is risk-derived and proves the changed contract. Record required checks not run and their
coverage consequence. Implementation DoD, independent QA, Global QA and release are separate layers;
none implies another.

Tracked implementation/QA uses a compact `Check | Scenario / environment | Result | Evidence`
inventory. Browser proof is required only for affected visible behavior. Database/auth proof is
required only when those contracts are affected. Do not run unrelated known-red checks as ceremony.

Messages and reports visible to Ivan are Russian. Exact execution handoff prompts and durable
repository contracts/receipts are English. Every completion states outcome, changed files, proof,
omissions, residual boundary and next owner or final-acceptance return.

## Release

Release work follows the [Hito Release Quality Sweep Runbook](hito-release-quality-sweep-runbook.md).
A freeze begins only with one in-progress release item, all other writers idle, and a recorded branch,
HEAD, remote baseline, empty index, completed owners, admitted paths/exclusions, environment and stable
content digests. During the freeze the release owner is the sole repository/runtime writer.

When staging is exactly authorized, stage only the admitted inventory, verify path/content identity
and run `git diff --cached --check` before expensive release work. If staging is not authorized, stop;
do not simulate the gate. Recompute candidate identity before commit and push. Unexpected source,
index, remote, runtime, generated output or environment movement invalidates the candidate.

At a failed gate, restore an empty index without changing working-tree bytes, record the first
incorrect owner and do not repair another owner's work. A retry creates a fresh freeze and digests.
The freeze ends only with a truthful terminal release receipt. Agents do not stage, commit, push,
deploy, apply hosted migrations or delete production data without exact authority; Ivan/Product owns
final acceptance.

## Retained And Superseded Material

The following remain retained until later consumer-safe work: all backlog records, plans, history,
Admin mirror/Capture data and code, prompt files, skills, noncanonical role files, `Template Agents/`
and `Template Skills/`. Backlog metadata and receipts are frozen linked evidence, not current
lifecycle. Their old general operating prose is superseded for new work by `AGENTS.md`, this contract,
the environment register and the active role cards. Retention does not grant competing task or role
authority.

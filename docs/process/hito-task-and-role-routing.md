# Hito Task And Role Routing

## Status And Authority

Active operating contract after the accepted Notion authority cutover on 2026-08-20.

The `Hito Running` Notion Tasks database is the sole operational task authority and lifecycle writer.
Admin Capture, repository Markdown, plans, briefs, specifications, prompts and history are intake,
linked technical documentation or evidence; none may independently dispatch or change lifecycle.
Permanent dual writing and a Markdown lifecycle fallback are prohibited.

### Source-Of-Truth Split

- **Notion owns operational lifecycle and routing only:** current Status, Phase, Owner, concise Latest
  update and Next action, short immutable history, Delivery steps and links. A Notion page must not
  become the technical contract or require an agent to read a long lifecycle transcript before work.
- **Repository Markdown owns technical documentation:** final domain contracts, plans, ADRs,
  runbooks, technical evidence and residual boundaries. A terminal technical task record keeps one
  compact final summary, final contract/evidence links and unresolved boundary; it does not retain
  consumed prompts or intermediate lifecycle chronology as current context.
- **Git owns code history.** Do not reproduce an implementation diary in Notion or Markdown to
  replace the repository's version history.
- **Supabase owns runtime data truth** for its admitted environment. Notion and Markdown may link to
  evidence but cannot substitute for current database, RLS, RPC or fixture readback.

This split is applied when a document is directly touched. It does not authorize a retroactive
mass-compaction, another mirror, generated export, registry or second tracker.

### Portable Contract Adoption

Hito adopts version `1.0.1` of the
[Portable Project Agent Operating Model](portable-project-agent-operating-model.md). That file is a
pure cross-project bootstrap contract and has no Hito lifecycle authority. This routing document is
the sole Hito adapter: its existing sections continue to own Hito's vocabulary, Areas, roles,
reporting convention, lifecycle credential boundary, environment routes and release route without
copying them into the portable core. A future local deviation is recorded here only after Product
acceptance and names the portable version it adopts; do not create a second adapter document.

## Instruction Precedence And Load Order

Root [`AGENTS.md`](../../AGENTS.md) owns instruction precedence and progressive loading. Load this
contract only when admission/classification, owner or lane selection, handoff, same-task QA return,
concurrency, external authority or release freeze is materially in scope. Do not reconstruct
authority from terminal receipts, historical plans, unrelated roles or broad documentation.

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
rollback and Repository document. Supporting Markdown and plans add technical detail but never own
status.

Use Lite only for one known owner, one known seam, no persisted/auth/external/release risk and one
focused proof. Use Tracked for unknown causes, multiple surfaces or owners, persistence/schema/RLS,
auth/security, provider/hosted work, destructive/reset/release work or Global QA. Promote immediately
when a Lite assumption fails; do not demote behavior-changing work.

Before a write, state the accepted outcome or demonstrated cause, owner and existing seam, smallest
change, proposed new artifact or `none`, removed/simplified responsibility, proof and stop condition.
A reported defect needs a reproducing artifact or exact missing discriminator; a hypothesis is not a
confirmed cause.

### Owner-Boundary Admission

Before extracting or moving an owner, map every direct production and focused-proof consumer, then
recursively prove the intended dependency direction across runtime and type-only imports. The move
is not admitted while an unexpected reverse edge, unowned consumer, second writer or compatibility
projection remains. Remove the old export/responsibility only after its direct imports are zero; do
not hide it behind a re-export, alias or facade.

A Frontend consumer migration starts only after the server-owned initializer and command contract
losslessly represent every origin and interaction admitted by the Task. A partial route/read model,
client reconstruction, compatibility state or source-specific DTO cannot fill a missing canonical
fact. If the initializer or command cannot carry that fact, return the exact Backend or Product
discriminator before Frontend source work.

### Same-Task Lifecycle And History

At each material claim, owner/phase handoff, blocker, QA return, implementation result, release result
or final acceptance, the active owner performs one lifecycle update on the same Notion Task:

1. atomically set truthful `Status`, `Phase`, `Owner`, `Latest update`, `Next action` and
   `Repository document` values; and
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

For an already admitted Task, first distinguish a missing or changed lifecycle decision from a
broken execution host. The former stops before execution and returns to PRODUCT. The latter—a role
context that cannot reach the approved Notion API, admitted worktree, fixture or managed
runtime—is a same-Task QA-environment defect returned directly to BACKEND for recovery or re-homing,
not a Product blocker. The same acceptance may continue from a canonical local context with the same
Task identity and approved seam; only that context may write the terminal Notion result. Never use
Markdown lifecycle state, an unapproved secret path or destructive/hosted mutation as a fallback.

### Local Notion Lifecycle Seam

Root [`AGENTS.md`](../../AGENTS.md) owns the single process-local credential seam and its secret
boundary. This contract adds no alternate credential source. Missing access on an already admitted
Task follows the execution-host recovery rule above and never authorizes Markdown lifecycle writes.
One Current owner remains mandatory; each material transition atomically updates Status, Phase,
Owner, Latest update, Next action and Repository document, then appends one history line on the same
live Task.

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

Design System repository implementation belongs solely to the FRONTEND Design System lane; no
separate repository engineer role may own it.

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

Root [`AGENTS.md`](../../AGENTS.md) owns the shared local/external/secret safety boundary. Supabase
work additionally resolves through the
[environment register](hito-supabase-environment-register.md); release work uses its separate
runbook. This contract introduces no alternate authorization or credential path.

## Validation And Reporting

After ownership and the public contract are stable, independent QA proves the changed contract,
negative dependency direction and risk-derived direct boundary. Previously accepted evidence for an
unaffected branch remains valid unless the changed edge can invalidate it; QA states that reason
instead of replaying an unrelated domain or the whole product. This is proportional evidence, not a
token, file, elapsed-time, checklist or test-count limit.

Before Verification ownership moves, the sending owner proves that the receiving context can read
and update the same Notion Task and that any required managed artifact is fresh, healthy, compatible
and tied to the current source receipt. A missing Notion seam, stale/missing artifact or environment
identity conflict is an execution-environment stop before product validation. It does not create a
new Task, authorize a Markdown lifecycle fallback or prove a product defect.

Root [`AGENTS.md`](../../AGENTS.md) owns shared validation layers, evidence inventory and reporting
language. Do not run unrelated known-red checks as ceremony.

## Release

The [Hito Release Quality Sweep Runbook](hito-release-quality-sweep-runbook.md) exclusively owns
candidate admission, sole-writer freeze, staging, invalidation, retry and terminal release proof.
Nothing in this contract weakens its explicit authority boundary.

## Retained And Superseded Material

Backlog metadata, plans, history and receipts are linked evidence, not current lifecycle. Their old
operating prose is superseded by `AGENTS.md`, this contract, the environment register and active role
cards. Physical retention never grants task or role authority.

## HITO-245 Recovery Evidence

The three recoverable cleanup slices retain their path/hash/mode manifests and consumer originals
outside the repository under
`/Users/ivan/Developer/hito-running-hito245-recovery/HITO-245-slice-{1,2,3}-2026-08-22` until
independent QA and Product acceptance are terminal. This operating contract does not duplicate
those recovery manifests.

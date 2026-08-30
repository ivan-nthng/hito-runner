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
or final acceptance, the active owner supplies one truthful lifecycle transition for the approved
broker operation to apply to the same Notion Task:

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

For an already admitted Task, distinguish a changed lifecycle/product decision from a missing host
capability. The former returns to PRODUCT; the latter follows the single
[broker stop/re-home protocol](#ivan-operator-profile-and-capability-broker) without changing Task or
source ownership. Never use Markdown lifecycle state, an unapproved secret path or
destructive/hosted mutation as a fallback.

### Local Notion Lifecycle Seam

Root [`AGENTS.md`](../../AGENTS.md) owns the single process-local credential seam and its secret
boundary. This contract adds no alternate credential source. Missing access on an already admitted
Task follows the broker protocol below and never authorizes Markdown lifecycle writes. One Current
owner remains mandatory; the owner supplies each truthful transition and the approved lifecycle
operation atomically updates Status, Phase, Owner, Latest update, Next action and Repository
document, then appends one history line on the same live Task.

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

| Role              | Admitted ownership                                                                                                    | Repository boundary                                                      |
| ----------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| RUNNING COACH     | Bounded training-quality reviews, safety criteria and coaching-rule decisions                                         | No runtime implementation or technical QA                                |
| DESIGNER          | Bounded design research, information architecture, interaction/visual decisions and implementation specifications     | No runtime implementation or backend/product-policy invention            |
| MARKETING MANAGER | Bounded audience, market, competitor, positioning, messaging and marketing feature-opportunity research and decisions | No product acceptance, pricing, campaign spend or runtime implementation |

Specialist work may be the Task outcome or one named phase in an accepted plan. When a specialist
phase finishes, its decision and evidence are appended to the same Task before Current owner moves to
the next named role.

### Active Figma-Only Work

| Role                      | Admitted ownership                                                                                         | Repository boundary                                                                         |
| ------------------------- | ---------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| DESIGN SYSTEM INTEGRATION | Product-approved Figma target discovery, code-to-Figma mapping, Figma mutation and Figma-side verification | Repository runtime source, CSS, tokens, components, scripts and configuration are read-only |

DESIGN SYSTEM INTEGRATION is an active Task owner and handoff destination for bounded Figma-only
work through the canonical thread recorded in [`PROJECT_PROFILE.md`](../../PROJECT_PROFILE.md).
Active role or thread identity never authorizes an unspecified Figma mutation: every mutation must
bind an explicitly admitted target and scope on the same Task.

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

## Ivan Operator Profile And Capability Broker

The capability broker is a local Platform execution boundary of the current orchestration host. It
is not a role, service, daemon, database, queue, tracker, source owner or technology stack. Roles
continue to decide and write only their admitted source. The broker may perform only one privileged
operation already authorized by the same live Task and must return its exact receipt to that Task.

### Static Project Identity And Operator Rules

[`PROJECT_PROFILE.md`](../../PROJECT_PROFILE.md) is the sole owner of verified non-secret project,
repository, environment, service, deployment and canonical sidebar-thread identifiers. It records
explicit gaps but is not a capability registry, secret store or source of execution authority.

This routing contract continues to own behavior:

- Ivan through PRODUCT owns intake, scope, exceptions, external/destructive authority and final
  acceptance.
- Ivan-facing reports are Russian; durable contracts, receipts and exact execution intents are
  English.
- The Hito Notion Task is lifecycle truth and uses the root-owned process-local credential seam;
  secret values never enter manifests, logs or reports.
- Every operation binds one admitted repository/worktree real path, base revision, branch,
  dirty-owner set and path allowlist.
- Existing environment and release runbooks own runtime behavior. Hosted, destructive, provider,
  commit, push and deployment authority remains explicit per Task; the broker cannot infer it.

Dynamic capability results are probed for each execution intent and retained only in that
operation's receipt. A previous successful host or tool result is never current authority.

### Role, Source And Capability Matrix

| Role        | Sole decision/source boundary                                                              | Privileged effects it may request after Task admission                          |
| ----------- | ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------- |
| PRODUCT     | Intent, priority, scope, exceptions, external authority and final acceptance               | Lifecycle transition, cancellation or explicitly authorized external action     |
| ARCHITECT   | Boundaries, ADRs, data/migration plans, reachability and rollback decisions                | Lifecycle transition and documentation evidence publication                     |
| BACKEND     | Domain/server truth, persistence, auth, providers, environments and release implementation | Docker/Supabase/runtime lease, server proof and exact Git/release operation     |
| FRONTEND    | Product UI, Design System runtime, interaction, accessibility and local DevTools UI        | Build/artifact publication and admitted browser-runtime preparation             |
| QA          | Independent read-only acceptance and reproducible evidence                                 | Artifact/runtime acquisition, browser control, evidence publication and cleanup |
| Specialists | Their existing bounded decision or Figma-only boundary                                     | Only the admitted specialist tool action; never product source or release       |

The broker has no owner row. It cannot edit product source, choose scope, reinterpret acceptance,
approve its own output or change the Task owner. Privileged capabilities resolve as follows:

| Capability                      | Decision owner                                                                 | Broker gate                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| Notion lifecycle                | Current owner; PRODUCT for final acceptance                                    | Compare live revision, apply the owner-supplied transition atomically, append one history line and read back. No Markdown fallback.  |
| Role delivery                   | Current owner on one unchanged admitted edge                                   | Deliver one immutable intent and require the named destination turn to acknowledge the same Task and manifest before owner transfer. |
| Git / release / deploy          | BACKEND release owner under explicit Product authority and the release runbook | Verify base/index/allowlist, perform the exact operation and read back revision/deployment evidence.                                 |
| Docker / Supabase / runtime     | BACKEND environment owner; QA may request an admitted fixture                  | Verify project/context/data boundary, acquire one lease and prove cleanup.                                                           |
| Build / cache / artifact        | Implementation owner publishes; QA consumes                                    | Prove cache write capability and bind the output hash to the exact input manifest.                                                   |
| Browser                         | QA for acceptance; FRONTEND only for admitted implementation proof             | Bind browser evidence to the manifest-backed runtime without Ivan's personal session.                                                |
| Provider / hosted / destructive | PRODUCT authorizes; existing domain owner defines the operation                | Fail closed without exact target, authority, rollback and evidence; re-home never expands authority.                                 |

### Immutable Execution Intent

`ExecutionIntentV1` is immutable after acknowledgement and contains:

- Notion Task/page identity, expected lifecycle revision, current owner, operation kind and named
  destination owner when applicable;
- repository/worktree real path, base revision, branch, exact path allowlist, pre-operation
  hashes/modes and declared unrelated dirty owners;
- requested capability and environment identity, external-action authority, rollback, cleanup and
  required proof; and
- the source owner's factual claim or handoff receipt, without an inferred QA or acceptance claim.

The broker reads back the live Task, resolves repository and working-directory real paths, rejects
scope/owner/revision or dirty-boundary drift, and probes only the requested capability. It records
availability and tool/version identity but never a credential, cookie, private provider payload or
personal session.

If the named role host lacks the capability, the broker may bind the unchanged intent once to the
canonical capable executor. Task identity, Current owner, source writer, scope, authority and proof
do not move. If no executor acknowledges the exact intent, the operation stops as
`blocked(capability_unavailable)`; repeated cross-role retries are forbidden.

### Acknowledged Delivery

```text
prepared -> dispatched -> acknowledged -> running -> completed
                    \-> undelivered
acknowledged|running -> rehome_required -> acknowledged -> running
any nonterminal state -> blocked|cancelled
```

- `prepared`: live Task, unchanged edge, source release, rollback and manifest are valid.
- `dispatched`: transport accepted one delivery ID; ownership has not transferred.
- `acknowledged`: the named destination turn confirms the same Task, role, manifest hash and
  admitted boundary. `waitingOnApproval` is not acknowledgement.
- `running`: the acknowledged owner or broker executor started the exact operation.
- `completed`: an execution receipt exists; it proves only that operation, not another acceptance
  layer.
- `undelivered`: no destination acknowledgement exists, so the current owner remains unchanged.
- `rehome_required`: one requested capability failed; the broker may re-home the unchanged
  operation once.
- `blocked`: no truthful capable executor or rollback exists; return the exact discriminator to
  PRODUCT without another delivery attempt.

After destination acknowledgement, the broker applies the owner-supplied Notion transition and
readback. A message send, queued prompt or approval wait alone never changes Current owner.

### Exact Artifact Manifest

`ExecutionArtifactManifestV1` binds proof to:

| Group     | Required facts                                                                                                                              |
| --------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Task      | Task/page ID, expected lifecycle revision, owner, intent ID and admitted proof layer                                                        |
| Source    | repository identity, worktree/root real path, base commit, branch, index state, exact path SHA-256/mode set and unrelated dirty fingerprint |
| Execution | command/tool identity, resolved cwd, approved environment key names only, toolchain versions, executor host/session and start/end           |
| Runtime   | Docker context/project or `none`, Supabase/environment or `none`, ports, fixture/data class, provider mode, lease and cleanup requirement   |
| Artifact  | source-manifest hash, build/proof command, artifact hash, runtime receipt and browser route/viewport when applicable                        |
| Result    | exit/result, redacted evidence paths, omissions, rollback/cleanup result and next accepted boundary                                         |

Freshness requires the current path hashes, resolved cwd, manifest hash, artifact hash, runtime
receipt and active lease to agree. Source motion, wrong cwd, expired lease, rebuilt artifact or
environment mismatch invalidates the claim. A timestamp, branch name, source fingerprint, health
response or verbal `fresh` claim alone is not evidence.

### Technology Ownership And Stop Conditions

- Supabase, Auth, providers and server persistence remain BACKEND-owned domain implementations.
- Runner/Admin/History/Marketing UI and repository Design System remain FRONTEND-owned.
- BACKEND owns local fixture/runtime lifecycle; QA owns independent acceptance and evidence, never a
  second fixture implementation.
- Git-backed release/deployment remains with the existing BACKEND release owner and runbook.
- Notion remains PRODUCT/operator lifecycle authority even when the broker performs the API write.
- Browser, capture and debugger tooling remain local-only with no production import, route, bundle
  or observability path.

A second runtime, datastore, task system, deployment route, fixture, provider writer, Design System
or automation path requires PRODUCT to accept one owner, finite replacement/migration, rollback and
deletion of the superseded path. Permanent parallel operation is forbidden.

The broker fails closed before side effects when Task revision/owner, manifest, authority, target,
rollback, capability, acknowledgement or lease is missing or contradictory. Manual execution is
allowed only as the same broker operation with the same intent, manifest and receipt; it is not an
independent fallback. A broker failure never authorizes role-host retries, Markdown lifecycle, a new
Task, broader source access or invented evidence.

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

Before Verification ownership moves, the broker proves destination acknowledgement, live Task
read/write capability and a fresh, healthy, compatible managed artifact tied to the current source
manifest. A missing lifecycle capability, stale/missing artifact or environment identity conflict
is an execution stop before product validation and may use the one-time unchanged-operation re-home.
It does not create a Task, authorize a Markdown lifecycle fallback or prove a product defect.

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

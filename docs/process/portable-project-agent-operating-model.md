# Portable Project Agent Operating Model

Contract version: `1.0.1`

Status: maintained portable bootstrap contract

Owner: the adopting project's architecture/process owner, with Product/operator acceptance

## Purpose

This document is the one portable artifact an operator may give to an agent in another repository.
It defines how to establish a compact, project-local agent operating model without copying the
source project's product, task history, credentials, runtime data or provider configuration.

The target is a working system with:

- a compact root instruction map and differentiated role cards;
- progressive technical context loaded from repository Markdown;
- one project-local Notion task lifecycle with finite Epics;
- one current owner, exact handoffs, same-task QA returns and immutable transition history;
- explicit evidence, credential, environment, model-selection, validation and release boundaries.

This is an operating contract, not a framework, package, generator, central service or universal
product template. An adopting project uses its own names, owners, product boundaries, environments,
providers and acceptance criteria.

## Non-Transfer Boundary

Copy this contract only. Never transfer:

- credentials, environment files, tokens, cookies, provider keys or secret fingerprints;
- source-project terms, Areas, role names, database IDs, task IDs, task pages or lifecycle history;
- source code, runtime schema, migrations, fixtures, personal data or provider payloads;
- raw prompts/responses, private user content, QA artifacts or release receipts;
- the source project's Notion Tasks/Epics databases or a relation to any central cross-project
  database.

Each project creates its own repository instructions, role cards, technical documentation and
Notion databases inside its own authority boundary.

## Portable Authority Invariants

| Concern                       | Sole authority                                                    | Forbidden duplicate                                                              |
| ----------------------------- | ----------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| Operational work              | One project-local Notion Tasks data source after accepted cutover | Markdown status, another tracker, central cross-project queue or silent fallback |
| Technical truth               | Repository Markdown linked from the Task                          | Long Notion technical specification or copied lifecycle transcript               |
| Code history                  | Git                                                               | Implementation diaries maintained in Tasks or technical docs                     |
| Runtime data                  | The project's admitted runtime datastore/environment              | Notion, Markdown, fixtures or screenshots treated as current data                |
| Product intent and acceptance | Product/operator                                                  | Implementation owner silently changing scope or self-accepting                   |
| One source/domain fact        | Its named canonical owner                                         | Route-local reconstruction, compatibility state or a second writer               |

Further invariants:

1. One Task has exactly one Current owner. Sequential implementation, review, QA and fix-forward
   remain events on that Task unless Product admits a genuinely separate outcome.
2. Load progressively: root map -> current role -> selected Task -> linked technical document ->
   affected public contract/source. Do not preload history, unrelated roles or whole repositories.
3. Work at the first incorrect owner. A symptom does not authorize a local workaround.
4. Preserve unrelated dirty work. One writer owns a shared source, environment or artifact boundary.
5. Implementation, independent QA, release acceptance and production deployment are separate claims.
6. External, destructive, irreversible, paid-provider and hosted actions require explicit authority.
7. A missing lifecycle credential is an execution-environment stop, never permission to write
   lifecycle state into Markdown.

## Project Configuration Record

Before adoption, Product/operator decides and records these values in the project's own current
operating document. They are configuration, not portable defaults:

| Setting              | Required decision                                                                                       |
| -------------------- | ------------------------------------------------------------------------------------------------------- |
| Project identity     | Repository and product name; one operator/Product authority                                             |
| Operator language    | Language for user-facing reports; durable contracts and exact prompts may use another declared language |
| Areas                | Small enduring ownership/capability set; not technologies or temporary outcomes                         |
| Roles                | Core owners and only demonstrated bounded specialists                                                   |
| Task vocabulary      | Status, Phase, Priority and Category option sets                                                        |
| Technical topology   | Current product/system docs, domain contracts, plans, runbooks and evidence paths                       |
| Notion boundary      | Project-local workspace parent, Tasks database/data source and Epics database/data source               |
| Credential seam      | One external machine-local file, environment-variable name, owner and rotation rule                     |
| Runtime environments | Identity, data classification, allowed actions, writer, rollback and evidence owner                     |
| Validation/release   | Focused proof layers, independent QA and candidate-freeze/release owner                                 |
| Model policy         | Approved capability tiers, default tier, escalation owner and paid-provider boundary                    |

Do not begin lifecycle migration while any authority decision is unresolved.

## Safe Adoption Sequence

### 1. Read-Only Inventory

Inventory without writes:

- root instructions, role cards, skills and process documents;
- current task trackers, plans, receipts and inbound links;
- current product/system/domain truth and duplicate authorities;
- Git/dirty ownership, runtimes, environments, fixtures and generated artifacts;
- credential locations by key name and owner only, never values;
- validation, QA, release and rollback procedures.

Output one factual map: keep, reconcile, supersede later or unresolved. Age, size and naming do not
prove legacy. Do not delete during inventory.

### 2. Decide Project-Local Authority

Product/operator accepts:

- Notion as the future sole operational lifecycle writer;
- Markdown as technical truth, Git as code history and the runtime datastore as data truth;
- one Area, optional one Epic and one Current owner per Task;
- the role matrix, operator language, external-action boundaries and final acceptance owner.

Until the cutover proof passes, the existing tracker remains the sole writer. Never dual-write.

### 3. Create The Compact Root Map

Create one root `AGENTS.md` that contains only:

- instruction precedence and progressive load order;
- links to the routing contract, role cards, docs map and matching skills;
- one-current-owner and Notion lifecycle rule;
- dirty-work, secret, environment, external-action and acceptance safety;
- project-defining source-of-truth invariant(s);
- reporting language and direct-handoff boundary;
- validation and release routes.

Detailed procedures stay behind links. Do not paste role cards, task prompts or product history into
the root map. Compactness is achieved by single ownership, not by deleting safety rules to meet an
arbitrary line count.

### 4. Create Role Cards And Documentation Topology

Start with only roles needed by current work. A core set usually separates:

- Product/operator: intake, priority, new decisions and final acceptance;
- Architect: boundaries, source of truth, migration and rollback;
- Backend/domain: server/domain truth, validation, persistence and providers;
- Frontend/product interface: presentation, interaction and accessibility;
- QA: independent evidence and same-task defect return.

Add a specialist only for a durable bounded responsibility that cannot be owned by a core role.
Every role card has four short sections: Load, Own, Boundaries, Handoff/Report. It links shared rules
instead of copying them and never creates a second task hierarchy.

Use a route-first documentation map:

```text
AGENTS.md
agents/<role>.agent.md
docs/README.md
docs/current-product.md
docs/current-system.md
docs/current-state.md
docs/domains/<domain-contract>.md       # only when a stable public boundary exists
docs/plans/active/<task-plan>.md        # only while linked from live work
docs/process/<project-runbook>.md
docs/history/<accepted-history>.md
```

Exact names may differ. The invariant is one current owner per fact and direct links from the Task;
folders do not create authority by themselves.

### 5. Create Project-Local Notion Tasks And Epics

Create two databases/data sources inside the adopting project's own Notion workspace. Current
Notion API versions distinguish a database container from its data sources; discover and retain the
exact project-local `data_source_id` rather than treating a database URL as a table ID. See the
[data-source reference](https://developers.notion.com/reference/data-source) and
[2025-09-03 upgrade guide](https://developers.notion.com/guides/get-started/upgrade-guide-2025-09-03).

#### Tasks schema

| Property                        | Type                    | Rule                                                                                                                                        |
| ------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Task                            | Title                   | Short human outcome; no date or filename slug                                                                                               |
| Project ID                      | Native unique ID        | Immutable human code with a project prefix; never reused                                                                                    |
| Status                          | Select                  | `Backlog`, `Ready`, `In progress`, `Blocked`, `Done`, `Cancelled`                                                                           |
| Phase                           | Select                  | `Intake`, `Discovery`, `Decision`, `Implementation`, `Verification`, `Release`, `Acceptance`; add a phase only when it changes work meaning |
| Owner                           | Select                  | Exactly one current role                                                                                                                    |
| Primary Area                    | Select                  | Exactly one enduring capability                                                                                                             |
| Epic                            | Relation to Epics       | Zero or one finite outcome                                                                                                                  |
| Priority                        | Select                  | Small Product-owned ordered set                                                                                                             |
| Category                        | Select                  | Small human set such as Feature, Bug, Research/Decision, Maintenance, Release                                                               |
| Latest update                   | Rich text               | One concise factual current result                                                                                                          |
| Next action                     | Rich text               | One exact next boundary/action                                                                                                              |
| Repository document             | URL                     | Technical contract/evidence, not lifecycle authority                                                                                        |
| Created time / Last edited time | Native timestamps       | Not task IDs and not rewritten import dates                                                                                                 |
| Source key                      | Rich text, import-only  | Stable idempotency key for migration; absent for normal new work                                                                            |
| Depends on                      | Self-relation, optional | Only when execution is genuinely blocked by another outcome                                                                                 |

If a Task has multiple admitted steps, keep one page-level `Delivery steps` checklist. Do not add a
manual percentage. Append short immutable history paragraphs to the same page.

#### Epics schema

| Property            | Type                | Rule                                           |
| ------------------- | ------------------- | ---------------------------------------------- |
| Epic                | Title               | Finite human outcome, never an Area name       |
| Status              | Select              | `Proposed`, `Active`, `Done`, `Cancelled`      |
| Outcome             | Rich text           | One observable result                          |
| Acceptance          | Rich text           | Terminal acceptance boundary                   |
| Areas               | Multi-select        | One or more affected enduring capabilities     |
| Tasks               | Reciprocal relation | Current and terminal Tasks for this outcome    |
| Product owner       | Select/person       | Final outcome owner                            |
| Repository document | URL, optional       | Stable roadmap/decision evidence               |
| Completion          | Formula, optional   | Derived navigation only; never lifecycle truth |

An Epic may span Areas. A Task names one Primary Area for focused ownership. Plans, prompts, handoffs,
QA retries and receipts are not Tasks.

Manual and API bootstrap are both valid. If API bootstrap is admitted, use an integration scoped to
this project's parent page/database, current Notion data-source semantics, idempotent discovery and
readback. Views are presentation only: create a current-work table/board, owner view, blocked view
and Epic view manually or through the current [Views API](https://developers.notion.com/guides/data-apis/working-with-views).
No lifecycle rule may depend on one view, sort or filter.

### 6. Apply One Lifecycle And History Contract

Status answers whether work is queued, executable, active, blocked or terminal. Phase answers what
kind of work the current owner is doing. Do not encode the delivery sequence in Phase.

| Event                     | Required lifecycle result                                                     |
| ------------------------- | ----------------------------------------------------------------------------- |
| Product admits outcome    | `Backlog` or `Ready`; exact Area, owner, boundary and evidence route          |
| Owner begins              | `In progress`; truthful Phase and Owner                                       |
| Material claim or blocker | Update all current fields and append one history line                         |
| Unchanged owner handoff   | Same Task becomes `Ready` or `In progress` for the next owner; no retry Task  |
| Reproduced QA failure     | Same Task returns to first implementation owner with expected/actual evidence |
| Recovery                  | Same Task returns to QA after focused fix-forward                             |
| Terminal result           | Product/operator records `Done` or `Cancelled` after required acceptance      |

At each material transition, update Status, Phase, Owner, Latest update, Next action and Repository
document together, then append one timestamped immutable English history line (or the project's
declared durable language). Routine commands and commentary do not create history.

Direct owner-to-owner handoff is allowed only when the accepted plan names one next owner, outcome
and acceptance are unchanged, prior write ownership is released, files/data/environment/rollback
are admitted and no Product, destructive, hosted, paid-provider, deployment or release authority is
missing. Otherwise return to Product/operator.

### 7. Establish The Credential Seam

Create one project-specific, machine-local, external environment file, for example:

```text
<operator-config-root>/<project-slug>/notion.env
```

It contains only the project-local integration credential and is loaded into the lifecycle process
without printing or copying it. The repository records only the path convention, environment key
name, owner, rotation rule and required Notion capabilities. The file is never committed, copied to
repository `.env` files, exposed to application/browser code, stored in Notion or rendered in logs,
reports, screenshots or prompts.

Scope the integration to this project's Notion parent and data sources. Do not reuse one credential
as a central cross-project task authority. Missing/unreadable credentials, inaccessible data sources
or schema drift stop execution and return to Product/operator; do not fall back to Markdown writes.
Rotate a disclosed credential before adoption resumes.

### 8. Select Models By Capability And Risk

The project records approved capability tiers, not a permanent vendor/model name in every Task:

- **Standard execution:** bounded implementation, documentation and deterministic validation with
  clear contracts and rollback.
- **High-reasoning:** cross-domain architecture, security/auth, destructive migration, ambiguous
  root cause, release blockers or irreversible external impact.
- **Tool-specialist:** visual/browser, data, document or platform work requiring a specific verified
  tool capability.
- **Fast/low-cost:** mechanical, fully bounded transformations only when deterministic proof catches
  loss; never security, migration, architecture or final acceptance.

Use the project's configured default unless task risk or a required capability proves an escalation.
Record a material override in lifecycle history/evidence. Model choice never changes authorization,
ownership, validation, secret rules or acceptance and never substitutes for domain evidence. Do not
use token, file-count or elapsed-time quotas to stop before the necessary boundary is understood.

### 9. Migrate And Cut Over Without Dual Truth

1. Snapshot the old tracker/schema and count every nonterminal item.
2. Map one old item to one Notion Task outcome; do not import prompts, retries or receipts as Tasks.
3. Use a collision-safe immutable Source key for idempotent imports and native project IDs for new
   work. Never reuse IDs.
4. Import concise current fields and link technical Markdown; keep historical source dates labelled
   as source dates rather than Notion creation time.
5. Read back counts, identities, relations, owners, statuses, links and history.
6. Replay the import: zero duplicate pages and zero semantic changes.
7. Product/operator accepts the visual/current-work map, then declares one cutover timestamp.
8. After cutover, only Notion writes lifecycle. Old tracker fields become read-only history/evidence.

Do not delete the old source during cutover. Reconcile consumers first; retirement is a separate
recoverable, zero-reference action.

### 10. Validate, Roll Back And Release

#### Adoption validation

- every root/role/process link resolves;
- root and role cards contain no duplicate task authority;
- every live Task has one owner, one Area, correct optional Epic and Repository document;
- one sample Task completes owner handoff, same-task QA return and immutable history;
- a second migration/bootstrap replay is idempotent;
- the lifecycle fails closed when its credential or data-source identity is absent;
- scans find no copied secrets, source-product terms, local paths or cross-project IDs in the
  portable core;
- Markdown formatting, whitespace and diff hygiene pass;
- an independent QA dry run can bootstrap a blank project from this document alone.

If validation fails before cutover, keep the old tracker as sole writer and remove/recover only the
new project-local Notion objects and documentation pointers created by the failed attempt. After
cutover, never silently dual-write: Product/operator must authorize a single-writer rollback, record
the cutover event and verify a complete readback before resuming work.

#### Validation and release layers

Each implementation Task defines focused contract proof, changed boundary, negative cases, evidence
location, cleanup and omissions. Independent QA validates stable ownership and adjacent regression
risk. A release runbook separately owns candidate admission, exact revision/environment, sole-writer
freeze, invalidation, retry, required proof inventory, rollback and final human/Product acceptance.
Local, preview, hosted and production evidence are distinct.

Never call a focused validator Global QA or release acceptance. Paid-provider evidence needs an
explicit reason, dispatch/model limit, redaction and cleanup; raw provider material and private user
content do not enter routine artifacts.

### 11. Maintain And Version The Contract

The portable contract uses semantic versioning:

- major: changes authority, lifecycle, ownership or cutover meaning;
- minor: adds a backward-compatible adoption or safety capability;
- patch: clarifies wording without changing behavior.

The adopting project links the version it accepted and records local values and deviations in its
existing project-local routing document. That routing document is the adapter; do not add a second
adapter file or fork the portable core. Review the adapter when Notion/API semantics, roles,
authority, credential handling, environment admission or release practice changes. Promote a
portable change only when it is useful beyond one product and carries no local names, identifiers,
paths, receipts or data.

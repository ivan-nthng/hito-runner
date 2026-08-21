# Hito Notion Operational Task Control Pilot And Cutover

Work Item ID: `2026-08-19-hito-notion-operational-task-control-pilot-and-cutover`
Status: completed
Type: change_request
Priority: highest
Owner: PRODUCT
Epic: platform
Parent: `2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model`
Depends On: `2026-08-19-hito-phase-zero-routing-and-environment-documentation-batch`
Supersedes: `2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery`

## Scope

Use the user-authorized Notion `Hito Running` database as the operational human task-control plane.
Create the minimum task schema and import only the reconciled current work-item set from Markdown
with stable identity and repository paths. During pilot and reconciliation, Markdown remains the sole
writer.

## Archive Intent

Retain the source-to-Notion mapping, count/reconciliation evidence, authority cutover decision and
rollback export reference. Do not retain a credential, token or a permanent second task tracker.

## Task

Give Ivan a single Notion interface for current tasks, Epics, owners, status, dependencies, concise
outcome, current stage and repository documents. Do not mirror terminal history or stale legacy
records. Plans, specs, briefs, receipts and Admin mirrors remain linked evidence rather than duplicate
task pages.

## Evidence

- Notion API authentication and read-only data-source discovery passed on 2026-08-19.
- The user-authorized `Hito Running` data source is reachable and initially contains only its title
  field.
- [Phase-0 routing contract](../../process/hito-task-and-role-routing.md)
- [Clean-slate plan](../../plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)

## Boundaries

- The token is never written to files, task records, shell output or Notion pages.
- No runtime product, Supabase, Admin Capture, Git, deployment, provider or credential mutation.
- No Markdown task deletion or authority transfer until source/Notion identity counts, fields, links,
  pagination, permissions, update behavior and rollback export are verified.
- The pilot writes only the user-authorized Notion database; it does not create a repository mirror
  or make Notion a product runtime dependency.

## Definition Of Done

- Notion has an accessible single task database with stable ID, title, human summary, status,
  priority, type, Epic, owner, stage, dependencies, repository path/link, acceptance/result and
  unresolved-risk fields.
- Every reconciled current Markdown work item is represented exactly once with its source ID/path;
  terminal history and legacy records are excluded until a source-backed keep/delete audit admits
  them. Supporting documents are linked rather than promoted to tasks.
- The imported schema supports the required views: Now, By Epic, Blocked, QA, Completed and All
  tasks. Creating or managing saved Notion views is an explicit post-import Notion-app action because
  the public API does not expose that operation.
- Read/query/create/update/pagination/denial behavior and a source mapping/export are verified.
- PRODUCT records a separate authority-cutover decision. Until then Markdown stays the sole writer
  and Notion has no automated bi-directional synchronization.

## Stage

Completed. Notion is the sole operational lifecycle writer; Markdown is retained only as linked
technical documentation and evidence.

## Next Recommended Role

PRODUCT for routine update-seam admission and final acceptance.

## Product Autonomous Phase-0 Completion Authorization — 2026-08-20

Ivan authorizes completion of the accepted Phase-0 chain without routine Product/Ivan handoffs.
This authorization is limited to the existing canonical Tasks, accepted outcomes and boundaries; it
does not authorize a reset, migration apply, fixture/data mutation, hosted Supabase mutation,
provider call other than the already-admitted Notion reconciliation, Vercel setting change, new
recurring cost, Git action, deployment, or broader deletion.

The direct owner chain is:

1. BACKEND completes the current Notion reconciliation, fixes only same-task validation failures,
   and dispatches independent QA.
2. QA returns a reproduced failure directly to BACKEND for same-task fix-forward. On a pass, QA
   dispatches ARCHITECT for the documentation-only authority-cutover update below.
3. ARCHITECT changes only the root routing/role documentation needed to make Notion the sole
   operational task writer, keeps Markdown as linked read-only evidence, and preserves rollback
   instructions. It then dispatches BACKEND to the existing Phase-0 Supabase environment-admission
   Task.
4. BACKEND performs only the separately bounded local runtime admission; QA independently verifies
   its read-only environment evidence and returns a failure directly to BACKEND.
5. If both QA verdicts pass and the required documentation transition is complete, the accepted
   Phase-0 exit criteria are met under this Product authorization. Any changed scope, unproven
   identity, failed restore/rollback, external/hosted action, destructive operation, cost, or new
   product decision stops the chain and returns to PRODUCT.

The Notion import QA must prove the exact legacy-trash scope, Tasks/Epics schema, nine current task
pages, eight finite Epic records, Source-key/page-UUID/HITO identities, links, relations and second
replay. The documentation cutover occurs only after that pass; it never creates a permanent
Markdown/Notion dual writer.

## Provider Reconciliation Admission Update — 2026-08-20

BACKEND accepted the Product-authorized disposition of the fixed 19-page legacy mirror batch but
stopped before any provider request or mutation. The named accepted discovery contains the Area and
finite-Epic rules only; it does not contain the required nine-row Source key → Primary Area / optional
Epic mapping or the provider-ready finite Epic records. The allowed read set also omits the nine
current task records needed for factual lifecycle/update values.

No legacy page, schema, data source, relation, view, HITO identity or trash state changed; no fresh
rollback export was created and Markdown remains the sole lifecycle writer. PRODUCT must record the
exact row-level Area/Epic mapping and Epic payloads, then provide the current lifecycle import values
or authorize reading the nine admitted source tasks before provider reconciliation can resume.

## Provider Reconciliation Completion Update — 2026-08-20

BACKEND completed the admitted provider reconciliation through the Vercel Production in-memory
credential seam. A fresh private rollback export was captured before mutation at
`/private/tmp/hito-notion-reconcile-ZmXnQ9/notion-before.json` with SHA-256
`0750091c764003661cde7eb35fd7f88c6bcf5440475b20d903286f9c09011c59` and mode `0600`.

The fixed 19-page Product-disposed batch matched its prior identity snapshot immediately before
write; only those 19 UUIDs were trashed. The accepted 15-property Tasks schema, one eight-property
`Hito Epics` data source, eight finite Epic pages and exactly nine mapped Task pages now exist. A
separate read-only exact-payload replay reported zero creates and zero updates while preserving page
UUID, native HITO ID and Source-key identity. The child credential and raw provider payloads were not
printed or retained.

Markdown remains the sole lifecycle writer. Saved views and authority cutover are not part of this
provider mutation. The child task now belongs to QA for the authorized independent read-only
acceptance; ARCHITECT cutover remains contingent on that pass.

## Product Acceptance Adjustment — 2026-08-20

Ivan accepted a direct human-facing Notion check in place of the unavailable independent QA provider
readback. The isolated QA sandbox could not resolve or reach `api.notion.com`; this is retained as a
coverage gap, not treated as a defect in the reconciled Notion state.

The active gate is now PRODUCT visual acceptance of the nine current Task pages, eight Epic pages,
human fields/relations, native HITO codes and absence of the fixed legacy batch from current work.
No additional provider mutation is permitted. On Ivan's acceptance, ARCHITECT receives the existing
documentation-only authority-cutover slice. Notion then becomes the sole lifecycle writer, with
Markdown retained only for linked documentation and evidence.

## Product Visual Acceptance — 2026-08-20

Ivan directly confirmed that `Hito Running` shows the expected nine current Tasks and eight Epic
records. The task-control pilot is accepted for human use. The independent QA sandbox DNS failure
remains a documented omitted transport observation, not a reopened implementation defect.

ARCHITECT now owns the already-scoped documentation-only authority cutover. It must make Notion the
sole lifecycle writer and retain Markdown only as linked repository documentation/evidence. No new
Notion provider mutation is admitted by this transition.

## Authority Cutover Receipt — 2026-08-20

Product acceptance, the nine-Task/eight-Epic identity set, BACKEND reconciliation and its second
zero-delta replay satisfy the cutover boundary. The isolated QA context's DNS failure is retained as
an omitted provider-transport observation; it is not a defect and did not trigger another provider
request.

The `Hito Running` Notion Tasks database is now the sole operational lifecycle writer. At every
material claim, handoff, blocker, QA return or terminal result, the active owner atomically updates
Status, Phase, Owner, Latest update, Next action and Repository link, and appends one concise
immutable history line to the same Task page. One active owner and same-Task QA fix-forward remain
mandatory. Repository Markdown remains linked technical documentation, decisions, plans and
evidence; its lifecycle metadata is frozen historical context.

The repository maps and routing policy were aligned without a Notion/provider call, secret, runtime
change, mirror, daemon, custom counter, Git action or deletion. A role context unable to update
Notion must stop and return the execution-environment gap to PRODUCT; Markdown is not a fallback.
Routine execution still requires an admitted supported Notion update seam for the active role
context. PRODUCT owns that bounded operational follow-up and final acceptance: admit one supported,
least-privilege Task-page update capability for every active role context; prove read of the selected
Task, one atomic six-field lifecycle update, one appended history line, denial outside the Hito Tasks
scope and a no-op replay. It may not change schema, create a mirror/fallback, expose credentials or
mutate any non-task provider state.

## Finite Epic Taxonomy Cutover Receipt — 2026-08-21

Product replaced narrow or Area-shaped Epic grouping with enduring Areas and finite outcome Epics.
The live census contained 12 Task pages: exactly nine current Tasks (`HITO-216`–`HITO-224`) and three
terminal historical Tasks (`HITO-225`–`HITO-227`). Historical Task lifecycle and evidence were left
unchanged.

The stable `Cut Over Task Control to Notion` Epic page became the active **Rebuild Hito’s Product
Foundation** outcome. `Ship Adaptive Four-Week Training` was retained as Proposed. Two Proposed
future outcomes were added without Tasks: **Launch Runner Payments and Financial Operations** and
**Launch the Admin Operations Console**. The Epic lifecycle vocabulary is Proposed, Active, Done and
Cancelled.

| Current Task | Primary Area | Finite Epic                       |
| ------------ | ------------ | --------------------------------- |
| HITO-216     | Runner       | Ship Adaptive Four-Week Training  |
| HITO-217     | Platform     | Rebuild Hito’s Product Foundation |
| HITO-218     | Platform     | Rebuild Hito’s Product Foundation |
| HITO-219     | Runner       | Rebuild Hito’s Product Foundation |
| HITO-220     | Platform     | Rebuild Hito’s Product Foundation |
| HITO-221     | Runner       | Rebuild Hito’s Product Foundation |
| HITO-222     | Platform     | Rebuild Hito’s Product Foundation |
| HITO-223     | Platform     | Rebuild Hito’s Product Foundation |
| HITO-224     | Runner       | Rebuild Hito’s Product Foundation |

Six superseded pages were retained, not deleted, with Status Cancelled: `Complete the Safe Hosted
Calendar Migration`, `Establish Modular Domain Boundaries`, `Establish the Clean Data Baseline`,
`Release Runner Core`, `Restore Reliable Plan Recovery` and `Unified Workout Authoring`. Their nine
nonterminal Task relations moved to the finite outcomes. The terminal `HITO-225` and `HITO-226`
relations remain on their cancelled historical Epic pages, while terminal `HITO-227` remains valid
foundation evidence.

Readback proved nine current Tasks, four operational finite Epics, one Primary Area and one expected
Epic relation per current Task, and no current Task related to a cancelled Epic. `HITO-224` retained
BACKEND ownership and its Implementation phase; this task wrote no lifecycle field or page-history
block there. Repository links for the four operational Epics resolve to existing documents on the
canonical Git origin. A second declarative replay reported zero schema updates, creates, Epic
updates, retired-page updates and Task updates.

No runtime, source, Supabase, Vercel, deployment, Git lifecycle, product QA, mirror, export or task
database was changed. The next owner is QA for an independent read-only count, relation and visible
label verification on this same Task.

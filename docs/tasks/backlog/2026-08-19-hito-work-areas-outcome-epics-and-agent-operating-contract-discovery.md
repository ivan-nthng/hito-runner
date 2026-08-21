# Hito Work Areas, Outcome Epics And Agent Operating Contract Discovery

Work Item ID: `2026-08-19-hito-work-areas-outcome-epics-and-agent-operating-contract-discovery`
Status: completed
Type: research
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: `2026-08-19-hito-notion-operational-task-control-pilot-and-cutover`
Evidence From: `2026-08-19-hito-notion-task-workflow-and-human-taxonomy-discovery`, `2026-08-19-hito-notion-current-work-human-brief-mapping`

## Scope

Decide the durable Hito work taxonomy and agent operating contract before the Notion task-control
pilot imports current work. Separate enduring product work areas from outcome-bounded Epics and
from individual tasks. Propose the smallest coherent Notion and repository contract for agent
collaboration, handoffs, lifecycle updates and human-readable planning.

## Archive Intent

Retain the accepted taxonomy, definitions, agent-update contract, migration sequence and explicit
decision. Do not retain copied research, a parallel tracker, or a speculative new process framework.

## Task

Ivan needs Notion to show understandable current work: durable product areas or modules, finite
Epics with tangible ends, and the tasks that deliver those Epics. An Epic may cross multiple Areas;
it is not a child of one technical or operational module. `Platform & Operations` currently mixes an
enduring area with finite outcomes, so it must be evaluated rather than treated as a final Epic
taxonomy. The agents also need one concise, canonical way to create, execute, hand off, return from
QA, report and update the same task without turning ordinary work into a long Product relay.

## User Direction

- Notion is the future human task-control surface; Markdown remains the repository home for plans,
  research, contracts, receipts and evidence.
- An Epic is a finite outcome and may span multiple durable Areas or modules. A task advances one
  Epic and declares its primary Area for ownership and focused validation.
- Areas may include product/runtime domains and non-product work such as Platform, DevTools,
  Integrations, Design System or Marketing only when source- and workflow-backed; do not adopt an
  example list as an untested taxonomy.
- Epic names must describe a bounded, understandable outcome rather than an endless operational
  responsibility.
- The resulting process must make agent collaboration faster and safer, with direct owner-to-owner
  handoff inside an admitted plan and clear return conditions for Product/Ivan.
- Ivan-facing reports are Russian. Exact role prompts and repository receipts remain English.

## Evidence

- [Notion operational task-control pilot](2026-08-19-hito-notion-operational-task-control-pilot-and-cutover.md)
- [Notion workflow and human-taxonomy discovery](2026-08-19-hito-notion-task-workflow-and-human-taxonomy-discovery.md)
- [Current-work human mapping](2026-08-19-hito-notion-current-work-human-brief-mapping.md)
- [Phase-0 routing contract](../../process/hito-task-and-role-routing.md)
- [Clean-slate operating-model plan](../../plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)

## Boundaries

- Read-only discovery. Do not change Notion schema/pages/views, `AGENTS.md`, role cards, source,
  Supabase, runtime, dependencies, hosted services, Git or lifecycle records other than this item.
- Do not create an additional tracker, force an Area → Epic containment hierarchy, require a
  mandatory waterfall, create a permanent mirror, or create role-specific duplicate tasks.
- Do not rename or migrate existing Notion/Markdown taxonomy before a Product decision and an
  explicit idempotent migration plan.
- Markdown remains the sole task writer until the existing Notion pilot completes a separate
  authority-cutover decision.

## Definition Of Done

- Define Area, Epic and Task precisely, including their allowed cardinality, lifecycle ownership,
  labels, how a cross-Area Epic is represented, and an explicit rule for work that does not merit an
  Epic.
- Audit the current registered Epic taxonomy and the 11 admitted current-work rows against the
  proposed distinction. Identify which current labels are true Areas, which remain valid Epics, and
  where a finite outcome must replace an enduring label.
- Propose the smallest human-readable Area set, with source-backed inclusion/exclusion rationale for
  Platform, DevTools, Integrations, Design System, Marketing, Runner, Admin and History.
- Define the minimal Notion properties, views and relationships needed to display Area → Epic → Task
  without duplicating Markdown documents or adding a second lifecycle authority.
- Audit `AGENTS.md`, the five canonical role cards and the routing contract only for workflow rules
  that conflict with the accepted collaboration model. Propose concrete edits, ownership and
  migration order; do not apply them.
- Define the expected agent update/handoff loop, including owner-to-owner continuation, QA return,
  blocker escalation, Russian reports and English durable records/prompts.
- Provide current primary-source evidence, a recommendation with alternatives rejected, a rollback
  path, stop conditions and the smallest serial implementation sequence. No implementation is
  performed.

## Stage

ARCHITECT read-only taxonomy and operating-contract discovery completed before Notion provider
reconciliation.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

None. The discovery is complete and returns to PRODUCT for decision and any separately authorized
implementation dispatch.

## Decision Receipt

### Outcome

Adopt durable **Areas**, global finite **Epics**, and executable **Tasks** as three distinct concepts.
An Area is an enduring business or delivery capability and has no completion state. An Epic is one
finite outcome and may span one or more Areas. A Task is one owned unit of work, has exactly one
Primary Area for ownership and focused validation, and may link to zero or one Epic when the work
does not justify a larger outcome. Area must not contain Epic as lifecycle authority.

### Recommended Human Taxonomy

The smallest evidence-backed Area set is: `Runner`, `Admin & Business Operations`, `History`,
`Marketing`, `Design System`, `Platform`, and `Developer Tools`. `Integrations`, `AI`, and `Data`
remain capabilities inside the owning business Area until source-backed multi-area ownership makes
one of them a durable independent Area. `Platform & Operations` is therefore retired as an Epic
label: it describes enduring responsibility, not a finishable outcome. Existing Epic labels remain
only when they state a finite accepted result; enduring labels must be replaced by the actual
bounded outcome during controlled reconciliation.

### Current-Work Disposition

The 11 admitted current-work rows resolve to 9 operational Tasks. The clean-slate roadmap remains
linked portfolio/plan evidence rather than a Task, and the completed backlog-reachability audit
remains terminal evidence rather than current work. Each retained Task receives one factual Primary
Area and either one finite Epic or no Epic; research, plans, handoffs, QA retries, and receipts do not
become separate Tasks for the same outcome.

### Smallest Notion Model

Keep one Tasks data source for operational work and add one small Epics data source for finite
outcomes. Tasks expose human title, Status, Phase, Owner, Primary Area, optional Epic relation,
Priority, concise latest update, next action, and repository evidence link. Epics expose title,
outcome, lifecycle, owner, and their related Tasks. Areas remain a controlled human-readable
property rather than a third database. Views group Tasks by Primary Area, Epic, Status, or Owner;
they do not create another authority or copy repository documents. Markdown remains authoritative
until the separately approved Notion cutover proves idempotent migration and rollback.

### Agent Operating Contract

One Task retains one lifecycle and one active owner. Product owns intake, priority, new decisions,
exceptions, and final acceptance. An execution owner updates the same Task, performs focused proof,
fixes forward inside the admitted boundary, reports to Ivan in Russian, and keeps durable receipts
and exact prompts in English. It may hand off directly only across an unchanged plan edge with one
named next owner, released write ownership, admitted seams, rollback, and no external-authority or
Product-decision gap. QA returns a reproduced same-task defect directly to the implementation owner.
Any owner, scope, risk, destructive/external authority, rollback, or product-decision change returns
to Product/Ivan.

### Migration, Rollback, And Stop Conditions

After Product acceptance: reconcile the controlled Area values and finite Epic outcomes; create the
minimal Epics relation; map the 9 operational Tasks idempotently while retaining repository links;
then prove views, lifecycle updates, direct handoffs, QA fix-forward, and rollback before any
authority cutover. Rollback removes the new projections/relations and leaves Markdown authority and
source evidence unchanged. Stop on an ambiguous current outcome, duplicate task identity, missing
owner, unresolved Product decision, credential gap, failed idempotency, or any requirement to make
Notion and Markdown concurrent lifecycle writers.

### Rejected Alternatives And Residual Boundary

Rejected: Area → Epic containment, one endless operational Epic per Area, a separate Areas database,
role-specific task trees, permanent Markdown/Notion dual writing, and mandatory waterfall phases.
This task made no Notion, policy, role-card, routing, source, Supabase, runtime, hosted, dependency,
or Git change. Product must accept the taxonomy and authorize the separate schema/migration batch;
implementation and Notion cutover remain unclaimed.

Next owner: **PRODUCT**.

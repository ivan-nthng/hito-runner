# Hito Documentation Map

Start with root [`AGENTS.md`](../AGENTS.md), the assigned role card and the selected Notion Task.
Follow its Repository document, then load only the durable context directly required by that task.
This page is a router, not a mandatory reading list.

## Durable Context Routes

| Need                                    | Current canonical path                                                                           | Load when                                                  |
| --------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------- |
| Product purpose and pipeline            | [`context.md`](context.md)                                                                       | The outcome or system boundary needs project context       |
| Product behavior and accepted rules     | [`current-product.md`](current-product.md)                                                       | Product truth is affected                                  |
| Implemented system behavior             | [`current-system.md`](current-system.md)                                                         | Runtime ownership or existing behavior is affected         |
| Current release/implementation boundary | [`current-state.md`](current-state.md)                                                           | Current-state or release claims are affected               |
| Canonical vocabulary                    | [`glossary.md`](glossary.md)                                                                     | A term is ambiguous or user-facing vocabulary changes      |
| Current functional ownership map        | [`current-functional-map.md`](current-functional-map.md)                                         | A cross-surface consumer or owner must be located          |
| Future direction                        | [`future-roadmap.md`](future-roadmap.md)                                                         | Product explicitly asks about unimplemented direction      |
| Linked task evidence                    | [`tasks/backlog/`](tasks/backlog/)                                                               | The selected Notion Task links retained technical evidence |
| Multi-step execution detail             | [`plans/active/`](plans/active/)                                                                 | The selected Task links an active plan                     |
| Reusable operational procedures         | [`process/`](process/)                                                                           | The affected environment, QA or release boundary names one |
| Cross-project operating-model adoption  | [`portable-project-agent-operating-model.md`](process/portable-project-agent-operating-model.md) | A new repository must bootstrap its own local authority    |
| Accepted history                        | [`history/`](history/)                                                                           | A factual historical discriminator is explicitly required  |

Do not read every current document by default. Follow direct links from the selected Task and stop
when the accepted decision, owner, public boundary and proof route are established.

## Folder Purposes

- `docs/context.md`
  - high-level project and pipeline context
- `docs/current-system.md`
  - implemented system behavior only
- `docs/current-product.md`
  - implemented product behavior only
- `docs/current-state.md`
  - implemented-state and release-boundary summary; operational lifecycle stays in Notion
- `docs/future-roadmap.md`
  - not-yet-implemented direction only
- `docs/glossary.md`
  - canonical terms
- `docs/history/changelog.md`
  - completed implementation history
- `docs/plans/active/`
  - supporting execution detail for one linked canonical Task; not an operational queue
- `docs/plans/archive/`
  - closed or superseded plans
- `docs/tasks/product-briefs/`
  - supporting product-definition artifacts; legacy `backlog` metadata is artifact context only
- `docs/tasks/frontend-specs/`
  - supporting implementation-facing design specs; a spec cannot dispatch without one linked
    Notion Task
- `docs/tasks/backlog/`
  - retained linked technical documentation and evidence; never current lifecycle authority
- `docs/process/`
  - reusable workflow rules

## Plan, Decision And History Lifecycle

An active plan exists only when a multi-step or cross-surface Task needs durable execution detail.
The Task owns lifecycle; the plan owns sequence, boundaries, rollback and proof detail. When the plan
finishes, promote enduring accepted facts into the affected current product/system/glossary document.

There is no dedicated ADR directory today. A task-owned architecture decision remains in its compact
canonical receipt until a demonstrated recurring decision needs a separately approved durable ADR
location. Do not invent that location or treat terminal receipts as default context.

After accepted facts are promoted, retain only evidence required for traceability, rollback, release
or unresolved dependencies in Git/history; archive or compact anything else only through separately
admitted consumer-safe work. After an accepted Notion authority cutover, new Tasks are created in
Notion rather than as per-task Markdown files, while plans, durable contracts, decisions and evidence
remain linked repository documents.

## Operational Classification Rule

Only the selected Notion Task can answer current Status, Phase, Owner, Latest update and Next action.
A `Status`, `Task`, `Stage`, `Next Recommended Role`, `Suggested Next Step` or role prompt in
repository Markdown describes frozen artifact maturity or retained history and cannot dispatch work.
If a document is not the Repository document of an admitted Notion Task, do not infer current work
from it; PRODUCT must select or create the Task in Notion.

`/admin/capture` is a capture inbox and read-only repository mirror surface. Editable Admin-created
row states are intake/triage state, not the operational lifecycle. Retained work must resolve to one
Notion Task before dispatch.

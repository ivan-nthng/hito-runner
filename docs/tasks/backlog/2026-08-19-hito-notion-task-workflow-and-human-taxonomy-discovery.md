# Hito Notion Task Workflow And Human Taxonomy Discovery

Work Item ID: `2026-08-19-hito-notion-task-workflow-and-human-taxonomy-discovery`
Status: ready
Type: change_request
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: `2026-08-19-hito-notion-operational-task-control-pilot-and-cutover`
Evidence From: `2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery`

## Scope

Define the smallest human-readable Notion task workflow for Hito. It must show where a task is,
what it has already passed, who owns the next step, and which Epic it advances—without turning every
handoff, retry, research document or QA receipt into a new task.

## Archive Intent

Retain the accepted workflow, vocabulary, field contract, transition matrix and migration rules as
the operating-model decision. Do not retain copied research or a parallel workflow tracker.

## Task

Research established task-lifecycle practice and propose one Hito-specific model. Separate task
state from workflow phase, make the status/phase names understandable to Ivan, humanise the existing
Epic names, and preserve a concise history of transitions. The model must support both a full
feature path (research → architecture → implementation → QA) and a short urgent bug path without
forcing a fake waterfall.

## User Direction

- Notion is the human task-orchestration surface; it is not a documentation repository.
- Repository Markdown remains the source for research, decisions, plans, QA receipts and evidence;
  Notion pages link to them.
- Ivan creates and follows work in Notion. The same task changes phase/owner/status through its
  lifetime rather than spawning role- or retry-specific duplicates.
- Epic, category and status labels must be human-readable; machine slugs may remain internal.

## Evidence

- [Existing Notion discovery](2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery.md)
- The prior broad Notion import was halted; terminal and legacy mirrors were moved to the Notion
  trash so the current workflow can be defined before current-only reconciliation resumes.

## Boundaries

- Read-only discovery. Do not change Notion schema/pages/views, Markdown authority, source/runtime,
  Supabase, Git, dependencies or hosted state.
- Do not make Research, Architecture, Frontend, Backend or QA separate task types.
- Do not prescribe a mandatory multi-stage workflow for a Lite bug or narrowly admitted patch.
- Do not duplicate repository documentation into Notion.

## Definition Of Done

- Define one minimal task-state vocabulary, distinct workflow-phase vocabulary and permitted
  transitions, including blocked, superseded and acceptance paths.
- Define a concise transition-history model and the exact facts an agent must update after each
  handoff or outcome.
- Propose human labels, descriptions and non-colour-only display mapping for the registered Hito
  Epics and the minimum meaningful task categories.
- Map full feature, bug fix, research-only and release paths, including when a task returns from QA
  to the same implementation owner rather than becoming a new item.
- Specify the smallest Notion field/view model and API/manual-view boundary, plus a serial migration
  from the current pilot.
- Record source-backed best-practice evidence, stop conditions and the smallest implementation
  sequence. No implementation is performed.

## Stage

ARCHITECT workflow, lifecycle and human-taxonomy discovery.

## Next Recommended Role

ARCHITECT

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Notion Task Workflow And Human Taxonomy Discovery
Mode: Tracked, read-only discovery

Read AGENTS.md, agents/architect.agent.md, and only skills/hito-architecture-audit/SKILL.md. Read
the canonical task, its three linked evidence items, and the current Notion pilot schema only as
needed. Use current primary sources for task-lifecycle and Notion API/view capability research.

Outcome: define one Hito task workflow that separates state from phase, presents human-readable
Epics/categories, records concise transition history, and works for both a complete feature path and
a short bug/patch path. The Notion page must orchestrate the work while repository Markdown remains
the linked technical documentation and evidence.

Provide: state/phase vocabulary; permitted transition matrix; agent update contract; human Epic and
category labels; full-feature, bug, research-only and release examples; smallest Notion field/view
model; API versus manual Notion-view boundary; migration/rollback and stop conditions; and one
owner-separated implementation sequence.

Boundaries: read-only. Do not change Notion, Markdown, code, Supabase, hosted state, Git, runtime,
dependencies or current pilot data. Do not create a second tracker, make every handoff a new task,
or make a heavyweight waterfall mandatory for a narrow patch.

Return: Russian report to Ivan; English canonical decision receipt with direct evidence links,
unresolved decisions and next owner. Do not dispatch implementation.
```

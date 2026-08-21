# Hito Canonical Backlog Legacy Reachability Prune

Work Item ID: `2026-08-19-hito-canonical-backlog-legacy-reachability-prune`
Status: completed
Type: change_request
Priority: highest
Owner: ARCHITECT
Epic: platform-and-operations
Parent: `2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model`
Evidence From: `2026-08-19-hito-notion-operational-task-control-pilot-and-cutover`

## Scope

Produce a source-backed, minimal keep/delete/supersede inventory for historical and stale canonical
backlog records. Treat Markdown documents, plans, code comments, scripts and current work items as
potential consumers. The result must distinguish records needed for live navigation or unique
evidence from removable terminal history and stale duplicate/retry records.

## Archive Intent

Retain one compact ledger and any unique evidence records that remain referenced. Archive or delete
only records with proven replacement or zero reachability through separately authorised cleanup
slices.

## Task

Reduce the human operating queue to the current product work without breaking Markdown links,
release evidence, source references or still-needed decisions. Give PRODUCT an exact, serial deletion
plan rather than a broad date-based purge.

## Evidence

- The first Notion pilot exposed 196 non-current records among 215 initially mirrored pages; those
  Notion mirrors were moved reversibly to the Notion trash on 2026-08-19.
- Repository parsing still identifies 50 declared, nonterminal records, including stale retry and
  legacy-format candidates.
- [Notion pilot](2026-08-19-hito-notion-operational-task-control-pilot-and-cutover.md)
- [Clean-slate reform plan](../../plans/active/2026-08-19-hito-clean-slate-runner-reform-and-agent-operating-model.md)

## Boundaries

- Read-only discovery: do not delete, compact, rename, move, stage or mutate repository, Notion,
  Supabase, fixtures, runtime or hosted data.
- Do not infer a record is disposable from age, terminal status, title, or an absent current owner.
- Preserve the current Notion pilot and active Phase-0 environment work.
- Do not create a parallel task index, generated database, or migration.

## Definition Of Done

- Every candidate has reachability, canonical replacement/supersession, unique-evidence and
  lifecycle findings.
- The report separates: retain, terminal archive, confirmed deletion candidate, stale current-state
  reconciliation and unresolved-reference candidates.
- The report gives the smallest owner-separated cleanup sequence and validation needed after each
  deletion batch.
- No deletion is performed by this task.

## Stage

ARCHITECT read-only reachability and canonical-replacement inventory.

## Next Recommended Role

PRODUCT

## Architecture Receipt — 2026-08-19

### Decision

The read-only discovery is complete. The inventory covered `346` canonical backlog items, excluding
`README.md`: `245` completed, `26` closed, `41` backlog, `17` blocked, `9` ready, and `8`
in_progress. The declared nonterminal set is therefore exactly `75` items.

| Classification   |   Count | Evidence-led boundary                                                                                                                                      |
| ---------------- | ------: | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| KEEP             |      84 | `12` current nonterminal items plus `72` terminal records reached from a nonterminal item or active plan                                                   |
| RECONCILE        |      63 | Older nonterminal items whose lifecycle, owner, supersession, or current-product authority is not safe to infer                                            |
| ARCHIVE          |     109 | Terminal records with historical inbound references but no live operational dependency; relink before any move                                             |
| DELETE-CANDIDATE |      90 | Git-tracked compact terminal closeouts with zero inbound repository reference; deletion still requires a separate recoverable, explicitly authorized batch |
| **Total**        | **346** | Mutually exclusive partition                                                                                                                               |

The `12` current nonterminal KEEP items are:

- `2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap`
- `2026-08-18-hito-adaptive-blueprint-four-week-detail-engine`
- `2026-08-18-hito-hosted-fit-retaining-calendar-cleanup-and-release-continuation`
- `2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation`
- `2026-08-18-hito-notion-project-management-interface-and-canonical-backlog-discovery`
- `2026-08-18-hito-recover-failed-half-marathon-preview-as-import-json`
- `2026-08-18-hito-runner-core-release-freeze-and-candidate-admission`
- `2026-08-19-hito-canonical-backlog-legacy-reachability-prune`
- `2026-08-19-hito-manual-template-target-selection-noop`
- `2026-08-19-hito-notion-operational-task-control-pilot-and-cutover`
- `2026-08-19-hito-phase-zero-supabase-environment-admission`
- `2026-08-19-hito-unified-workout-authoring-contract-and-editor-consolidation`

### Reconciliation Buckets

The `63` nonterminal reconciliation candidates remain current Markdown authority until PRODUCT
decides each lifecycle. They divide into these minimum owner-correct buckets:

1. stale release retries from 2026-08-12 through 2026-08-15, whose blocked state must be reconciled
   against later terminal release evidence;
2. old `in_progress` Admin Capture, Inspector, analytics, and cleanup/audit records with no proven
   active writer;
3. records owned by retired or mixed role vocabulary (`DESIGN SYSTEM`, `DESIGNER`, `RUNNING COACH`,
   or multi-owner strings), which require mapping to one of the five current roles or terminalization;
4. active-plan or plan-authority work that conflicts with the accepted runner-owned Calendar
   boundary and needs explicit supersession rather than silent deletion; and
5. remaining older backlog/ready product ideas that need PRODUCT retain, supersede, cancel, or
   re-admit decisions.

No record in these buckets is a deletion candidate merely because of age, title, length, or stale
ownership.

### Reachability And Replacement Basis

- Exact filename and stem reachability was checked across backlog Markdown, other documentation,
  active plans, runtime source, scripts, package/configuration files, and migrations.
- No runtime source or script directly depends on a terminal backlog record.
- The `72` live-referenced terminal records remain KEEP evidence.
- The `109` ARCHIVE records retain historical inbound links; those links are the removal blocker.
- All `90` DELETE-CANDIDATE records are Git-tracked and have no inbound repository reference. Git
  preserves their detailed transcript, but this audit does not authorize deletion.
- The active Notion pilot and Phase-0 environment work remain KEEP and were not modified.

### Product Decision Boundary And Serial Cleanup

PRODUCT must first decide the truthful lifecycle and one current owner or successor for each of the
`63` RECONCILE items, then complete the current-only Notion reconciliation and make the separate task
authority cutover decision. Only afterward may ARCHITECT receive separately authorized documentation
batches to (1) relink and archive the `109` historical records and (2) recoverably remove the `90`
zero-reachability records.

Each later batch must recheck repository-wide links and removed IDs/stems, current-task counts,
Notion mapping/export parity, formatting, whitespace, and `git diff --check`. This discovery changed
no record except its own lifecycle/receipt and claims no Notion, runtime, Supabase, Git lifecycle,
browser, QA, release, or deployment acceptance.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Canonical Backlog Legacy Reachability Prune
Mode: Tracked, read-only discovery

Read AGENTS.md, agents/architect.agent.md, and only skills/hito-architecture-audit/SKILL.md. Then
inspect the canonical task and clean-slate plan named there.

Outcome: produce a source-backed KEEP / ARCHIVE / DELETE-CANDIDATE / RECONCILE inventory for stale
or historical backlog records. Prove reachability from Markdown, plans, source, scripts and current
items; prove a canonical replacement or supersession before recommending deletion. Identify the
smallest serial owner-separated cleanup sequence and validation.

Boundaries: read-only. Do not delete, compact, move, rename, stage, commit, change Notion, use
Supabase, start runtimes, or create a tracker/index. Preserve all dirty work, the Notion pilot, and
the active Phase-0 environment work byte-for-byte.

Return: Russian report to Ivan; English canonical receipt with counts, evidence, proposed batches,
unresolved references, and an exact next-owner recommendation. Do not dispatch implementation.
```

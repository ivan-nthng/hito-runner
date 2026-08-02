# Operational Backlog Normalization

## Work Item ID

2026-07-31-operational-backlog-normalization

## Status

completed

## Type

plan

## Priority

urgent

## Owner

product

## Scope

work-item-governance

## Archive Intent

retain_in_place

## Task

Establish one operational source of truth for Hito work and remove false active-task signals without deleting linked project history.

## Stage

PRODUCT documentation and lifecycle normalization complete.

## Accepted Result

- `docs/tasks/backlog/` is now the only operational queue for retained Hito work.
- `AGENTS.md` requires a backlog item before any non-trivial request is dispatched, queued, or marked active.
- A work report must update the same item rather than create a parallel successor.
- Bug reports remain individually traceable and are batched only when their confirmed owner, root cause, risk, and validation story match.
- `docs/tasks/backlog/README.md` is the human queue index; the individual item metadata remains the canonical status.
- The only currently active execution item is `2026-07-31-activity-file-plan-vs-run-local-acceptance` under QA.
- The previously false `in_progress` branded-auth email plan was moved into the backlog and marked deferred.
- `docs/work-dashboard.md` is explicitly a legacy projection, not a second task queue.

## Safe Cleanup Boundary

No completed plan or historical evidence was deleted. Four completed plans under `docs/plans/active/` and several legacy nonterminal specs still have inbound documentation links. They are migration/archival work, not active tasks. A future archive pass must reconcile those links before moving files; age or folder name alone is not deletion authority.

## Evidence

- [Operational queue](README.md)
- [Project execution policy](../../../AGENTS.md)
- [Legacy dashboard projection](../../work-dashboard.md)

## Remaining Legacy Migration Candidates

- Completed plans under `docs/plans/active/` that need link-safe moves to `docs/plans/archive/`.
- Legacy nonterminal specs under `docs/tasks/frontend-specs/` that need Product triage before they may become backlog work again.

No item from this list is dispatched by this normalization record.

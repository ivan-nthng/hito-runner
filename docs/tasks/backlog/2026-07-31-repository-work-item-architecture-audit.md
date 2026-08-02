# Repository Work-Item Architecture Audit

## Work Item ID

2026-07-31-repository-work-item-architecture-audit

## Status

completed

## Type

plan

## Priority

urgent

## Owner

architect

## Scope

work-item-governance

## Archive Intent

retain_in_place

## Task

Audit and normalize the repository’s work-item lifecycle so `docs/tasks/backlog/` remains the one operational task source and no stale document, instruction, or dashboard creates a competing active queue.

## Stage

Completed / ARCHITECT documentation architecture normalization.

## Preserved Boundaries

- The active QA item `2026-07-31-activity-file-plan-vs-run-local-acceptance` remains in progress and must not be interrupted or reclassified without its final QA report.
- Do not edit application source, runtime configuration, migrations, product data, QA evidence, or thread state.
- Preserve accepted historical plans and evidence unless an inbound-link audit proves a safe archival move.
- Do not create a second registry, tracker, dashboard, or task hierarchy.

## Root-Cause Context

Prior policy allowed multiple documentation roots to appear operational at once. The current policy now names `docs/tasks/backlog/` as the single operational queue, but legacy plans, specs, and dashboard entries need a source-backed audit so their metadata, status, and archive placement do not contradict that rule.

## Accepted Outcome

- `docs/tasks/backlog/` is the only operational queue and lifecycle authority.
- Plans, specs, briefs, running-coach doctrine, and the work dashboard are supporting or historical
  projections. Their status cannot dispatch work.
- The active Frontend correction and QA acceptance retain their original canonical backlog records.
- Completed supporting records were normalized only where implementation/history evidence was
  explicit. Ambiguous legacy records remain visible migration debt rather than guessed tasks.
- Four completed plans remain under `docs/plans/active/` because the inbound-link audit found 63
  referencing locations. Their retained-in-place boundary is explicit; no history was moved.
- The dashboard is labeled as a deprecated legacy plan projection. Its generator remains a separate
  Backend/Admin tooling boundary and must not be used to infer operational status.

## Closeout Inventory

| Root | Classification at closeout | Count |
| --- | --- | ---: |
| `docs/tasks/backlog/` | canonical queue: 29 backlog, 2 ready, 2 in progress, 7 closed, 18 completed | 58 |
| `docs/tasks/frontend-specs/` | supporting: 25 terminal, 13 active-looking legacy records, 1 missing legacy status | 39 |
| `docs/tasks/product-briefs/` | supporting: 3 terminal, 9 legacy backlog records | 12 |
| `docs/tasks/running-coach/` | supporting doctrine/history; 21 descriptive statuses, 2 missing legacy statuses | 23 |
| `docs/plans/active/` | supporting: 4 completed link-retained records, 4 legacy backlog records | 8 |
| `docs/plans/archive/` | historical: 75 archived, 1 closed | 76 |

The nonterminal-looking metadata outside `docs/tasks/backlog/` is migration debt. It does not create
current work. If Product resumes one of those requests, it must first create or select exactly one
canonical backlog item and link the supporting record.

## Validation Boundary

The non-mutating importer dry-run has zero duplicate IDs and reduced malformed canonical records
from three to two. The remaining records are the active Frontend correction and active QA acceptance;
both were deliberately preserved byte-for-byte under the concurrent-owner and active-QA boundary.
Their owners must reconcile the conditional handoff metadata when closing their current work.

`npm run work:dashboard:no-admin` was not run because the current generator still reads only
`docs/plans/active/` and would overwrite the truthful deprecated-projection warning. The static
dashboard is non-operational; migrating the generator is a separate Backend/Admin tooling gate.

## Exact Handoff Prompt

None. This Architect documentation batch is complete. A later Backend/Admin gate may migrate the
legacy dashboard generator and refresh the Admin mirror, but neither is part of this closeout.

## Dispatch

Sent to the existing ARCHITECT task after confirming that it was idle. The active QA item remains independent.

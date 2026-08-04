# Runner Activity Gate Dependency Reconciliation

## Work Item ID

2026-08-02-runner-activity-gate-dependency-reconciliation

## Status

completed

## Type

plan

## Priority

high

## Owner

architect

## Scope

athlete-profile-progress

## Archive Intent

archive_when_closed

## Task

Reconcile the contradictory Gate 1 Global QA prerequisite in the Activity History task with the
canonical foundation's phased delivery and Gate 7 Global QA boundary.

## Stage

Completed / ARCHITECT documentation reconciliation.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Reconcile the runner-activity Gate 1, Gate 2, and Global QA dependency boundary.

Stage:
ARCHITECT documentation reconciliation.

Canonical task:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-08-02-runner-activity-gate-dependency-reconciliation.md

Evidence:
The canonical Runner Activity Intelligence Foundation records Gate 1 implementation and owner-level
QA as complete, defines Gate 2 as the next read-model stage, and places Global QA Acceptance at Gate
7. The later Activity History task instead says Backend Gate 2 must wait for Gate 1 Global QA. Those
claims create a blocking circular dependency because the intended runner-facing History/Progress
surfaces are themselves downstream of Gate 2.

Required outcome:
Establish one source-backed dependency rule across the foundation plan, Activity History canonical
task, and supporting design specification. Distinguish Gate 1 owner-level acceptance from the later
release-wide Global QA gate. Preserve the existing implementation evidence and do not change product
code, schema, migrations, runtime state, task ownership, or accepted metric policy.

Definition of Done:
The canonical docs have one unambiguous next implementation gate; no active task requires a later
Global QA gate before the functionality it is supposed to test exists. Validate local links and
affected task metadata, use a bounded independent documentation review if useful, and report the
result in the standard Check inventory. Routine local documentation work is standing-authorized.
Do not request routine approval, create a new chat, mutate product data, stage, commit, or push.
```

## Dispatch

Sent to the existing ARCHITECT task after confirming it was idle.

## Accepted Dependency Rule

Gate 1 owner-level implementation and QA acceptance unlocks Backend Gate 2. Gate 2 unlocks the
first Activity History and factual Progress read models, which then enable Frontend Product
implementation. Global QA is Gate 7: it validates the selected integrated release boundary after
the relevant gates exist and does not block Gate 2.

The foundation plan, Activity History task, and its design specification now use this same rule.
The accepted Gate 1 implementation evidence, metric policy, ownership, runtime, schema, and
migrations remain unchanged.

## Next Handoff

None. This closes the documentation contradiction; the existing Backend Gate 2 item remains the
next implementation gate under its own canonical task.

## Validation

| Check | Result | Evidence |
| --- | --- | --- |
| Dependency scan | passed | No current source retains the former Gate 1 Global QA prerequisite. |
| Canonical metadata parse | passed | Gate 2 item is `ready` with a Backend prompt; this item is terminal. |
| Importer dry-run | passed | 0 malformed canonical items, 0 duplicate Work Item IDs, no Supabase write. |
| Scoped diff hygiene | passed | No whitespace errors in the touched Markdown. |

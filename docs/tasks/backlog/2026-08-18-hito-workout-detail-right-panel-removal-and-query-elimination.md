# Hito Workout Detail Static Right Panel And Query Elimination

Work Item ID: `2026-08-18-hito-workout-detail-right-panel-removal-and-query-elimination`
Status: completed
Type: Tracked
Priority: highest
Owner: PRODUCT
Epic: runner-core-readiness
Evidence From: [Hito Workout Detail Sidebar Contract Isolation](./2026-08-18-hito-workout-detail-sidebar-contract-isolation.md)

## Scope

Retain a small right-hand placeholder on persisted Workout detail with only the factual count of
workouts in the current week. Remove its now-unused insight and metric data path. The remaining
placeholder must not derive or wait on any other workout data.

## Task

FRONTEND Product first replaces the data-driven right-side content with factual static future-feature
copy and the existing Backend-shaped weekly workout count, using the current panel anatomy. BACKEND
then narrows the loader/payload/read model to exactly that count and removes all insight and other
metric responsibility. Preserve the main Workout detail, result upload/removal flow, Calendar
navigation, and all non-sidebar contracts.

## Stage

Phase 1 closed: the retained static panel receives only the factual weekly workout count.

## Phase 1 Completion Receipt — 2026-08-18

The complete right-panel cleanup is terminal. FRONTEND retained the existing panel anatomy with
static future-feature copy and the Backend-shaped completed/scheduled weekly workout count. BACKEND
then reduced the provider to that count-only contract and removed all distance, result/FIT detail,
and insight responsibility.

Focused route smoke, Backend count behavior proof, ARCHITECT boundary review, reverse-import/query
checks, task-scoped TypeScript diagnostics, Prettier, and diff hygiene passed. No schema,
persistence, fixture, hosted, Git, release, or Global QA work was performed.

## Next Recommended Role

None. This parent is terminal.

## Blockers

None.

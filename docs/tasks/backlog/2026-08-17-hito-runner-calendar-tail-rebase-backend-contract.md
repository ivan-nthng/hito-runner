# Hito Runner Calendar Tail Rebase Backend Contract

Work Item ID: `2026-08-17-hito-runner-calendar-tail-rebase-backend-contract`
Status: closed
Type: Tracked
Priority: high
Owner: BACKEND
Epic: runner-core-readiness
Parent: [Hito Runner Calendar FIT-Preserving Schedule Rebase Discovery](./2026-08-17-hito-runner-calendar-fit-preserving-schedule-rebase-discovery.md)
Evidence From: [Hito Runner Calendar FIT-Preserving Schedule Rebase Discovery](./2026-08-17-hito-runner-calendar-fit-preserving-schedule-rebase-discovery.md)
Scope: Retire the superseded unfinished Calendar-tail rebase spike without implementing a
replacement feature or disturbing established Calendar/FIT behavior.
Archive Intent: Retain as the terminal supersession and cleanup record; any future batch-shift
feature requires a new minimal Product contract and canonical item.

## Supersession Notice — 2026-08-17

Ivan withdrew the unfinished rebase implementation before it was applied, committed, or adopted.
The accepted work is now Backend cleanup only: remove every task-owned rebase file and exact shared
hunk, preserve unrelated dirty work and all established Calendar/FIT behavior, and do not implement
a replacement batch-shift feature in this item. The original implementation text below is retained
only as historical decision evidence and must not be followed.

Cleanup-owned paths are:

- `supabase/migrations/20260818011255_calendar_workout_tail_rebase.sql`;
- `src/lib/manual-workout-authoring/rebase-workout.ts`;
- `scripts/manual-workout-authoring/rebase-proof.ts`;
- rebase-only additions in `src/lib/manual-workout-authoring/index.ts`,
  `src/lib/active-plan-lifecycle-persistence.ts`, `src/lib/supabase/database.ts`, and
  `scripts/validate-manual-workout-authoring.ts`.

Do not use reset, checkout, or a broad generated-type rewrite. Prove task ownership in every shared
file before deletion and return exact path/line accounting plus focused reachability, type, format,
lint, and diff-hygiene evidence.

## Cleanup Receipt — 2026-08-17

Stage: BACKEND cleanup completed; the superseded implementation was removed without replacement.

### Preflight and disposition

- The Supersession Notice was the accepted decision and sole cleanup authority.
- The task-owned boundary was three untracked spike files plus uniquely named rebase-only blocks in
  four shared files. Repository search found no consumer outside that exact boundary.
- Proposed new runtime artifacts: none. No replacement mutation, compatibility path, fixture,
  validator, migration, or Product consumer was introduced.
- The spike was never committed, hosted, released, or adopted. An earlier task run did replay the
  unfinished migration only into disposable local Supabase; this cleanup did not reset or mutate
  that local database because reset and fixture/database mutation were explicitly excluded.

### Exact removal inventory

| Path / hunk                                                           | Lines removed | Ownership evidence                                                                              |
| --------------------------------------------------------------------- | ------------: | ----------------------------------------------------------------------------------------------- |
| `supabase/migrations/20260818011255_calendar_workout_tail_rebase.sql` |           764 | Untracked task-only migration containing the preview, confirm, Undo, evidence triggers, and ACL |
| `src/lib/manual-workout-authoring/rebase-workout.ts`                  |           629 | Untracked task-only server owner                                                                |
| `scripts/manual-workout-authoring/rebase-proof.ts`                    |           666 | Untracked task-only proof                                                                       |
| `src/lib/active-plan-lifecycle-persistence.ts`                        |            63 | Three uniquely named tail-rebase transport wrappers only                                        |
| `src/lib/manual-workout-authoring/index.ts`                           |            22 | One export block referencing only the deleted server owner                                      |
| `src/lib/supabase/database.ts`                                        |            26 | Three generated function signatures matching only the deleted migration                         |
| `scripts/validate-manual-workout-authoring.ts`                        |            41 | One proof import/invocation plus migration-only source assertions                               |
| **Total**                                                             |     **2,211** | No foreign dirty hunk was admitted                                                              |

Two task-owned temporary pgTAP scratch files under `/tmp` (345 lines total) were also removed;
they were never repository or Product source and are excluded from the 2,211-line repository
accounting.

Shared-file preservation was checked before deletion with SHA-256 snapshots and exact named-hunk
inspection. After deletion, the manual-authoring barrel returned to no task-owned diff, while the
other three shared files retained their unrelated pre-existing modifications. No reset, checkout,
bulk generation, or broad rewrite was used.

### Validation inventory

| Check                            | Scenario / environment                                    | Result                | Evidence                                                                                                                     |
| -------------------------------- | --------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Reachability                     | Repository source excluding this historical item          | Passed                | Zero `calendar_workout_tail_rebase`, `CalendarWorkoutTailRebase`, `rebase-workout`, proof, or operation-ID references remain |
| Deleted paths                    | Working tree                                              | Passed                | All three untracked spike files are absent                                                                                   |
| Existing manual-workout contract | Non-mutating source validator                             | Passed                | `npm run validate-manual-workout-authoring`                                                                                  |
| Formatting                       | Three retained modified cleanup seams                     | Passed                | Focused Prettier check                                                                                                       |
| Lint                             | Retained TypeScript implementation and validator seams    | Passed                | Focused ESLint                                                                                                               |
| Type diagnostics                 | Repository-wide `tsc --noEmit`, filtered to cleanup seams | Passed for this scope | Repository command exits 2 with 145 unrelated diagnostics; zero diagnostic names a deleted or shared cleanup seam            |
| Diff hygiene                     | Exact retained shared files                               | Passed                | `git diff --check`                                                                                                           |
| Git/hosted/provider              | Out of scope                                              | Not run               | No staging, commit, push, deployment, hosted access, or provider call occurred                                               |

### Preserved boundaries and remaining work

Standalone runner-owned Calendar behavior, individual Move/Undo, Copy, Clear, Edit, FIT
ingestion/removal, source provenance, fixtures, Frontend, Design System, hosted state, and all
foreign dirty hunks were left unchanged. The disposable local database can retain the earlier
unreleased spike functions until its next separately authorized normal reset; it is not repository,
hosted, or release truth and was not used for validation after cleanup.

This item is closed as superseded cleanup, not completed feature delivery. PRODUCT is the next
owner only if a new minimal restart/batch-shift contract is desired; that work must use a new
canonical item. No Global QA, hosted parity, release, or deployment acceptance is claimed.

## Task

Add one origin-neutral Calendar-tail rebase operation. The runner selects an owned unprotected
non-Rest anchor and a later same-weekday target. All eligible non-Rest Calendar rows from the anchor
through the authoritative server snapshot move by that one positive whole-week delta. FIT/ZIP,
logged, metrics, comparison, insight, and activity-match-backed rows remain fixed history. Rest
rows and pre-anchor rows are exclusions, not delete targets.

Preview is read-only. Confirm must be one atomic server transaction, fail closed on stale or
protected truth, and record one auditable operation that can be undone exactly once within the
existing server-time expiry. The client receives only authoritative review/confirm results and an
operation ID/expiry; it never chooses a row set, calculates a move, or reconstructs rows.

## Accepted Contract

- Valid input has an exact anchor identity/date, target date, and same weekday; the offset is
  positive `7 * n` days for integer `n >= 1`. Invalid, zero, negative, past-target, malformed, or
  mismatched-weekday input writes nothing.
- Scope is all runner-owned Calendar rows dated on/after the eligible anchor through the server
  snapshot. Selection is never a plan, origin, or client-provided subset.
- Candidate rows retain stable ID, order, content, provenance, and origin; only date changes by the
  shared delta. Candidate-to-candidate destination occupancy is a valid internal translation.
- The protection boundary is the existing durable database truth: any log, result asset, actual
  metrics, comparison, AI insight, or runner-activity planned-workout match fixes that row at its
  original ID/date. FIT/ZIP assets are therefore never removed, replaced, hidden, or moved.
- Any fixed row, persisted Rest, or non-candidate occupying a candidate destination is a factual,
  blocking collision. Confirm cannot use the single-workout replacement behaviour to clear it.
- Reuse `calendar_workout_mutation_events` with one shared rebase operation identifier and full
  row before/after images. No new table, workout model, plan container, or client-side recovery
  state is allowed.

## Source Facts

- The existing `apply_calendar_workout_mutation` transaction verifies only one source and optional
  replacement target, so it cannot atomically express a complete tail or operation-level Undo.
- Existing runner transaction locks, mutation-event ledger, row fingerprints, and evidence guards
  are canonical reuse seams.
- Current FIT/result attachment lies outside the single-workout mutation path. Rebase must serialize
  relevant evidence attachment/removal with Calendar mutations, then re-read all protection roots
  under the runner lock before writing.

## What Not To Touch

- Frontend entry points, dialogs, client session state, Design System, product copy, or individual
  Move/Undo behavior.
- Source-plan or `plan_cycle` authority; source provenance remains optional historical data only.
- Ivan's personal/hosted account, retained FIT evidence, providers, billing, deployment, or Git
  lifecycle.
- Do not introduce a generic batch-mutation framework or compatibility projection.

## Validation Expectations

Risk-derived local proof must cover valid `+1/+2` week rebase; invalid dates; mixed manual/AI/import
tail selection; spacing/identity/provenance preservation; FIT/failed-parse/parsed asset and every
other protected relation; Rest/outside scope; candidate chain versus protected/Rest occupancy;
preview-to-confirm races; atomic injected failure; exact-once expiry/stale Undo after reload; and
cross-runner isolation/cleanup. Existing individual Move/Undo, Copy, Clear, Edit, FIT ingestion,
and removal proofs must remain green.

## Historical Stage (superseded)

BACKEND implementation in progress — architecture has proved the contract; Frontend adoption and QA
are explicit later owners.

## Next Recommended Role

PRODUCT

## Historical Exact Handoff Prompt (superseded; do not dispatch)

```text
ROLE: BACKEND

Task: Hito Runner Calendar Tail Rebase Backend Contract
Stage: Backend implementation
Canonical item: docs/tasks/backlog/2026-08-17-hito-runner-calendar-tail-rebase-backend-contract.md
Architecture evidence: docs/tasks/backlog/2026-08-17-hito-runner-calendar-fit-preserving-schedule-rebase-discovery.md

Read AGENTS.md, agents/backend.agent.md, and skills/hito-backend-supabase-contract/SKILL.md before
acting. This is a Tracked Backend task. Run the required preflight and preserve unrelated dirty
work byte-for-byte. You own server truth, migrations, generated types, local disposable fixtures,
and Backend proof only; do not implement Frontend, Design System, hosted/personal-account, provider,
release, or Git lifecycle work.

Implement the accepted same-weekday positive whole-week Calendar-tail rebase contract from the
canonical items. Reuse the existing runner lock, server resolver/fingerprints, mutation-event
ledger, Calendar persistence transport, and durable evidence protections. Add only the narrow
server-owned preview, atomic confirm, and exact-once operation-level Undo necessary because the
current RPC is strictly single-workout. The server determines the complete tail beginning at an
eligible runner-owned non-Rest anchor; the client supplies no subset or computed move list.

All logged, FIT/ZIP-backed, metrics, comparison, insight, and activity-match-backed rows are fixed
history. Rebase never moves, deletes, replaces, hides, or weakens protection for them. Persisted
Rest and external/non-candidate destination occupancy are exclusions or blocking collisions. A
candidate-to-candidate chain succeeds atomically. Serialize evidence attachment/removal with the
Calendar mutation lock and re-check the complete protection snapshot at confirm so races fail with
zero partial writes. Do not introduce plan-container authority, a new workout model/audit table,
generic batch framework, client reconstruction, compatibility projection, or any UI.

Update the same canonical item with an English implementation receipt. Prove the risk-derived
matrix from the item, local migration/ACL/type parity, disposable cleanup, existing single-Move
regression, and focused formatting/lint/diff hygiene. Use any bounded independent ARCHITECT or QA
review only when it materially closes a source or persistence evidence gap. Return to PRODUCT if a
new product decision or cross-owner implementation is required.
```

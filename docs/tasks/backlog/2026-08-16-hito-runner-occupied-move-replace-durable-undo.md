# Hito Runner Occupied Move Replace Durable Undo

## Work Item ID

2026-08-16-hito-runner-occupied-move-replace-durable-undo

## Status

completed

## Type

Bug — Backend data-loss recovery

## Priority

critical

## Owner

BACKEND

## Stage

Backend implementation complete; Frontend visible Undo adoption remains separate

## Next Recommended Role

FRONTEND

## Evidence From

[Runner Core Full Local QA Audit And Defect Ledger](./2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md)

## Scope

The existing runner-owned Calendar Move/Undo persistence and audit contract when a confirmed Move replaces an occupied non-Rest target. The task is limited to durable source/target restoration and the existing audit/move function seams.

## Task

Make an occupied-target **Replace workout** reversible through the same durable, exact-once Move Undo contract already used for empty and stored-Rest targets. On Undo, both the moved source workout and the displaced occupied workout must return with their original identities, content, dates, and provenance across reloads. A failed, stale, unauthorized, expired, or duplicate Undo must make no partial mutation.

## Demonstrated Cause

QA reproduced a destructive sequence: Move A to occupied date B, cancel once, repeat and confirm Replace, reload. A survives on B, A's source is empty, and B is gone with no Undo affordance.

The existing Move audit/restore contract already stores `displaced_workout`, but the authoritative reverse lookup in `supabase/migrations/20260816004652_standalone_calendar_write_foundation.sql` accepts it only when `displaced_workout->>'workout_type' = 'rest'`. That excludes ordinary occupied workouts. This is the first incorrect Backend owner. Frontend cannot invent a reversible state for a server-deleted row.

## Reuse And Boundaries

- Reuse the current Move RPC/function, existing move audit event, `displaced_workout` payload, exact-once expiry/ownership/fingerprint checks, and existing move persistence/proof seams.
- A function-only migration is allowed only if the historical function must be replaced; do not rewrite historical migrations.
- Add no new table, RPC family, client cache, duplicate Undo model, plan container, fixture shape, provider, dependency, or compatibility default.
- Do not modify Frontend controls, Design System, source-plan authority, FIT/import behavior, hosted state, or unrelated dirty work. Return the changed readback/consumer contract to PRODUCT for a separate Frontend adoption if one is required.

## Definition Of Done

1. Occupied non-Rest replacement, empty target, and stored-Rest target all satisfy Move → reload → Undo → reload exactly once.
2. Both occupied replacement rows retain their original IDs, content, dates, source provenance, and runner ownership after restoration; no duplicates or phantom rows appear.
3. Cancel remains a durable no-op; protected/evidence-backed/expired/stale/cross-user/raced Undo calls remain atomic failures with no partial state.
4. Existing manual, AI, imported, and Rest move behavior stays runner-owned and source-plan-neutral.
5. Local migration, generated types if affected, persistence proofs, ACL/RLS, formatting/lint/diff hygiene, and focused independent ARCHITECT/QA read-only reviews pass.

## Execution Preflight — 2026-08-16

- **Mode:** Tracked.
- **Observed outcome:** an occupied ordinary workout displaced by confirmed Move/Replace must be restored exactly once with the moved workout through the existing durable Undo transaction.
- **Live discriminator:** the current local `apply_calendar_workout_mutation` function already writes every deleted replacement row to `calendar_workout_mutation_events.displaced_workout`, but reverse lookup, expiry assignment, validation, and restoration are restricted to `workout_type = 'rest'`.
- **Existing seam reused:** the current function signature, mutation event table/payload, `move-workout.ts` review/confirm path, and existing move persistence proofs.
- **Change budget:** no new production runtime artifact, table, RPC, type shape, fixture, dependency, provider, client state, or compatibility branch. One appended function-only migration is necessary because the authoritative PostgreSQL function body is migration-owned.
- **Obsolete responsibility simplified:** the Rest-only restoration branch becomes one origin-neutral authoritative displaced-workout branch while retaining runner ownership, row fingerprints, evidence protection, expiry, and exact-once audit linkage.
- **Focused proof:** static contract checks first; after shared local persistence ownership is re-confirmed, clean/incremental migration proof plus occupied cancel/confirm/Undo/two-reload, empty and Rest regressions, provenance/content equality, protected/stale/expired/raced/cross-runner negatives, ACL/RLS, and cleanup. ARCHITECT and QA are bounded read-only reviewers.
- **Stop boundary:** return to PRODUCT if the correction needs Frontend source, a new persisted shape/RPC/table, a product decision, or another owner. None is currently demonstrated.

## Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Runner Occupied Move Replace Durable Undo

Mode: Tracked. Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, and the canonical item before acting.

Canonical item:
docs/tasks/backlog/2026-08-16-hito-runner-occupied-move-replace-durable-undo.md

QA evidence:
docs/tasks/backlog/2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md (AUD-02)

Outcome:
Replace workout on an occupied Calendar date must have the same durable exact-once Undo contract as empty and stored-Rest targets. Undo restores both the moved workout and displaced ordinary workout, including ID, document, date, provenance, and ownership, across reloads.

Confirmed cause:
The current authoritative reverse lookup only accepts audit `displaced_workout` when its `workout_type` is `rest`. The existing audit payload already owns displaced state; ordinary targets are excluded. Inspect the live current Move persistence and function definitions before changing anything.

Reuse the existing Move RPC/function, audit event, displaced_workout payload, exact-once expiry, fingerprint, ownership, and persistence/proof seams. If a function replacement is necessary, use one function-only migration; never rewrite historical migrations. Add no new table, RPC family, client cache, plan container, fixture shape, provider, dependency, or compatibility path.

Preserve manual, AI, imported, Rest, empty-target, cancellation, protected/evidence, stale, race, ACL/RLS, and cleanup contracts. Do not modify Frontend or Design System source. If a changed server readback needs a UI adoption, document the exact consumer contract and return it to PRODUCT.

Validation:
Run the full focused persistence matrix: occupied replacement cancel; confirm → reload → Undo → two reloads; empty and stored-Rest regressions; identity/provenance/content equality; expiry/stale/race/cross-user/protected failures; cleanup; local migration and ACL/RLS. Use named ARCHITECT and QA sidebar roles only for bounded read-only independent review/acceptance where it adds evidence; do not delegate Backend production code. Do not stop at one failed subcase: keep the one task receipt updated and fix forward within this owned seam.

Return:
Update only this canonical item with an English receipt, changed migration/source/proof seams, full validation table, precise Frontend consumer implication or explicit none, omitted-check consequence, and no Global QA/release claim.
```

## Backend Tracked Implementation Receipt — 2026-08-16

### Product Outcome

The existing runner-owned Calendar Move transaction now gives an occupied ordinary-workout
replacement the same durable exact-once Undo contract as a stored-Rest replacement. The server
captures the complete locked target row before deletion, assigns the existing database-owned Undo
expiry, and restores that authoritative row during a valid inverse Move. Move → occupied Replace →
reload → Undo → two reloads preserves both original workout rows with their IDs, documents, dates,
ordering, origins, optional source provenance, ownership, and `created_at` values. Empty-target and
stored-Rest behavior remains intact.

### Root Cause And Correction

The live `apply_calendar_workout_mutation` function already wrote every deleted replacement row to
`calendar_workout_mutation_events.displaced_workout`, but its reverse lookup, expiry assignment,
validation, and restoration accepted only `workout_type = 'rest'`. The first incorrect owner was the
Backend database function, not the Calendar consumer.

Migration `20260816171845_occupied_move_replace_durable_undo.sql` replaces only that existing
function. It keeps the signature, runner advisory lock, row/evidence checks, security-invoker mode,
and service-role-only execution. Reverse resolution now accepts the latest unconsumed authoritative
displaced-workout object, verifies server time, runner ownership, inverse dates and ID, current enum,
and optional same-runner source provenance, then restores every current `planned_workouts` column in
the same transaction. The Undo event links through `undo_of_event_id`; expired, stale, protected,
unauthorized, duplicate, or raced requests reject without a partial mutation. Source-plan status is
never consulted and provenance remains non-authoritative.

### Files Changed

- `supabase/migrations/20260816171845_occupied_move_replace_durable_undo.sql` — one appended,
  same-signature, function-only migration generalizing authoritative displaced-row expiry and restore
  from Rest-only to every valid workout type; no new table, column, policy, RPC, or persistence model.
- Task-owned additions in `src/lib/manual-workout-authoring/move-workout.ts` — expose the already
  returned server `undoExpiresAt` on successful reviewed and direct Move results.
- Task-owned additions in `scripts/manual-workout-authoring/persistence-proof.ts` — occupied cancel,
  stale review, confirm, authoritative audit capture, Undo, two reloads, duplicate, expiry, evidence
  race, identity/content/provenance equality, isolation, and cleanup proof.
- Task-owned additions in `scripts/manual-workout-authoring/move-proof-fixtures.ts`,
  `move-proof.ts`, and `move-proof-missed-scenarios.ts` — deterministic any-replacement expiry and
  ordinary/manual/AI plus stored-Rest source-contract coverage.
- Task-owned additions in `scripts/validate-manual-workout-authoring.ts` — function-only migration,
  generic displaced-object, any-target expiry, dynamic workout-type restore, Rest-only removal, and
  ACL guards.
- This canonical item — preflight, lifecycle, validation inventory, and closure receipt.

These files already contained unrelated dirty work from completed standalone-Calendar slices. Only
the task-owned additions above were made; all other dirty bytes were preserved. No Frontend, Design
System, provider, dependency, lockfile, hosted, Git staging, commit, push, or deployment change was
made.

### Independent Review

- **ARCHITECT:** read-only review approved the existing-RPC/event representation and found no
  blocking invariant. It verified the advisory lock, latest unconsumed event, full-row capture and
  restoration, exact audit linkage, transaction rollback, provenance-not-authority rule, and
  service-role-only ACL. It identified only the non-blocking proof gaps recorded below.
- **QA:** read-only verdict **Passed — Backend implementation proof inventory only**. QA independently
  reviewed the correction, focused/full Backend output, live function/ACL facts, cleanup, and
  consumer contract. QA made no source, database, fixture, runtime, browser, Git, or hosted mutation.

### Validation Inventory

| Check                            | Scenario / environment                                                                                         | Result     | Evidence                                                                                                                                                                                                  |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------- | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red discriminator                | Live local pre-migration function                                                                              | Passed     | `displaced_workout` stored ordinary targets, while reverse lookup, expiry, validation, and restore were Rest-only.                                                                                        |
| Incremental migration            | Local loopback Supabase                                                                                        | Passed     | Only `20260816171845` was pending, `npx supabase migration up --local` applied it, and post-apply history aligned. Historical migrations were not rewritten.                                              |
| Live function contract           | Local `pg_proc` and function definition                                                                        | Passed     | Signature unchanged; generic displaced object and dynamic enum restore present; Rest-only predicate absent; security invoker and `postgres`/`service_role` execution retained.                            |
| Occupied cancellation            | Disposable local persistence                                                                                   | Passed     | Review without confirm left source and occupied target rows byte-equivalent.                                                                                                                              |
| Occupied replacement and Undo    | Disposable local persistence                                                                                   | Passed     | Confirm → reload → inverse Move → two reloads restored both full rows exactly once with stable identity, content, dates, order, origin, source provenance, ownership, and audit linkage.                  |
| Existing target behavior         | Empty target and persisted Rest                                                                                | Passed     | Empty Move and stored-Rest Move/Undo/two-reload regressions remained green.                                                                                                                               |
| Stale and concurrency protection | Reviewed target changed before confirm                                                                         | Passed     | Original review rejected; re-review succeeded; no stale partial mutation occurred.                                                                                                                        |
| Protected target race            | Evidence added after review                                                                                    | Passed     | Reviewed and direct persistence calls rejected `protected_day`; workout and evidence rows remained unchanged.                                                                                             |
| Expiry and exact-once            | Server expiry plus repeated inverse Move                                                                       | Passed     | Expired Undo rejected `undo_expired`; a second sequential Undo rejected `source_date_changed`; neither changed rows.                                                                                      |
| Auth and RLS                     | Authenticated and cross-runner local checks                                                                    | Passed     | Direct table/RPC mutation was denied and foreign rows remained isolated.                                                                                                                                  |
| Focused validator                | `node --env-file=.env.local --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence` | Passed     | Full focused source and disposable persistence matrix completed, including cleanup.                                                                                                                       |
| Complete Backend DB suite        | `node --env-file=.env.local ./scripts/validate-backend.mjs --local-db`                                         | Passed     | Source plus local database suite passed all 21 checks; provider calls remained zero.                                                                                                                      |
| Database lint                    | `npx supabase db lint --local --schema public --level warning --fail-on error`                                 | Passed     | No local schema errors.                                                                                                                                                                                   |
| Cleanup convergence              | Read-only post-suite pool inventory                                                                            | Passed     | Task-owned rows and leases returned to zero; retained unrelated profile data was unchanged.                                                                                                               |
| Static source checks             | Targeted Prettier, targeted ESLint, non-mutating manual-authoring validator                                    | Passed     | All focused commands exited zero.                                                                                                                                                                         |
| Diff hygiene                     | `git diff --check` plus untracked migration/item checks                                                        | Passed     | No whitespace errors; Git index remained empty.                                                                                                                                                           |
| Repository TypeScript            | `npx tsc --noEmit --pretty false`                                                                              | Not passed | The dirty checkout retains broad existing diagnostics. The only task-file diagnostic was the pre-existing TanStack serializability issue for nested repeat data; no `undoExpiresAt` diagnostic was found. |
| ARCHITECT review                 | Named read-only no-container/atomic review                                                                     | Passed     | No blocking SQL or ownership invariant; approval recommended.                                                                                                                                             |
| QA review                        | Named read-only Backend proof-inventory review                                                                 | Passed     | No concrete defect found; Backend inventory verdict passed.                                                                                                                                               |

### Omitted Checks And Consequences

- Simultaneous duplicate Undo contention was not dynamically exercised; exact-once concurrency is
  covered by the per-runner PostgreSQL advisory transaction lock, authoritative row fingerprint, and
  sequential duplicate replay.
- The occupied dynamic restore used a manual target with null source provenance. AI/file-import and
  non-null source-provenance restoration are source-validated and included in the broader mixed-origin
  suite, but were not repeated as separate occupied persistence cases.
- Latest-event invalidation was source-validated through the latest unconsumed-event predicate but was
  not isolated as a dedicated occupied runtime replay.
- No production build was run. The task changed a same-signature database function, server result
  typing, and proof code; focused lint/validators and the full local Backend DB suite cover this slice,
  while shared build output remained serialized with other work. No build or release claim is made.
- No browser or real-iPad replay was run. The visible occupied-replacement Undo affordance remains a
  separate Frontend Product adoption and QA acceptance layer.
- No hosted Supabase, provider, Global QA, release, or deployment validation was performed. This
  receipt proves local Backend Implementation DoD only.

### Frontend Consumer Contract

After a successful occupied replacement, `ManualWorkoutMoveConfirmResult` returns the moved workout
identity, source/target dates, title, and server-owned `undoExpiresAt`. A Frontend consumer may retain
only those inverse-Move identifiers and expiry to expose Undo, then invoke the existing inverse Move
action. It must not cache, reconstruct, or resend the displaced workout row: the Backend restores the
authoritative audit payload. No Product DTO expansion or new endpoint is required.

### Lifecycle And Ownership

Backend Implementation DoD is complete and this item is `completed`. The next owner is **FRONTEND
Product** for the visible occupied-replacement Undo consumer, followed by separately assigned QA if
PRODUCT admits that acceptance work. Global QA, hosted parity, release, and deployment remain pending
and unclaimed.

Role file: `agents/backend.agent.md`. Project skill: `skills/hito-backend-supabase-contract/SKILL.md`.
Installed skills used: `supabase` and `supabase-postgres-best-practices`. Reused named read-only
subagents: ARCHITECT and QA; both completed without mutation.

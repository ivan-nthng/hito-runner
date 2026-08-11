# Calendar Workouts Independent From Plans And Simple Copy/Paste

## Work Item ID

2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste

## Status

completed

## Type

product-contract-correction

## Priority

high

## Owner

frontend

## Scope

calendar-workout-independence-and-simple-copy-paste

## Archive Intent

retain_in_place

## Task

Make a confirmed plan a one-time creator of calendar workouts, not an active calendar owner. Then
make every non-Rest calendar workout copyable as a workout prescription and allow that prescription
to be pasted into a truly empty editable calendar day.

## Stage

Frontend Product empty-versus-Rest Paste eligibility and focused browser closure are complete.
Backend and Frontend Implementation DoD have passed; independent Global QA remains pending.

## User Report

The runner should create a plan once and then work with its created workouts exactly as with manual
workouts. A plan must disappear from active calendar behavior after materialization. Every non-Rest
workout should be copyable; Paste belongs on an empty day, not on a Rest workout.

## Product Contract

- `plan_cycles` may remain as the saved record/provenance of creation, but it is not a current-plan
  container and cannot determine what calendar workouts exist, show, or permit.
- A materialized workout is independent calendar truth. Its original plan may be readable as
  provenance only. Calendar move, edit, copy, skip, and explicit Delete-training behavior must not
  depend on the plan's status or replacement lifecycle.
- `Copy workout` is available for every persisted non-Rest workout. It copies only the workout
  prescription; never its log, FIT asset, actual metrics, comparison, feedback, AI insight, or
  completion truth.
- `Paste copied workout` is available only for a truly empty editable day under the existing
  runner-local calendar rules. A persisted Rest row is not empty: Paste must not delete, replace,
  or mutate it. Existing past/protected target rules remain in force.
- A saved plan remains a library record for later browse/download/apply work, but no library UI or
  new plan-management feature belongs to this task.

## Evidence

- [`training-api.ts`](../../../src/lib/training-api.ts:383) currently makes `getActivePlan()` the
  calendar entry point and reads workouts through that one plan.
- [`active-plan-persistence.ts`](../../../src/lib/active-plan-persistence.ts:528) fetches workouts
  by `plan_cycle_id`; its replacement path can carry forward/relink history.
- Calendar already has a copied-workout buffer and menu consumers. The old policy restricted Copy
  by plan origin rather than by the workout itself.
- The superseded Copy/Paste checkpoint proved that treating a persisted Rest row as an empty target
  requires a new replacement mutation. The user explicitly rejects that path.

## Demonstrated Cause

One technical `active plan` currently conflates saved plan provenance, visible calendar schedule,
workout-editing authority, and replacement/history behavior. The manual-only Copy policy is another
expression of that coupling. This is a Backend source-of-truth problem, not a Calendar-menu defect.

## Required Outcome

The existing Backend persistence and Calendar read/write seams represent a user calendar of
independent workouts. Plan materialization and non-Rest Copy/Paste operate through those existing
seams without an active-plan owner, special Rest replacement operation, parallel store, scheduler,
or compatibility framework.

## What Not To Touch

- Do not add or extend the unaccepted `apply_active_plan_workout_copy` RPC or its migration.
- Do not create a second mutation/RPC, table, runtime file, fixture framework, scheduler, plan
  library UI, compatibility layer, or broad generic validator. Updating the existing canonical
  persistence function through its required migration is permitted when it is the smallest way to
  remove active-plan ownership; it must replace rather than sit beside the old behavior.
- Do not alter actual workout truth, FIT/evidence, logs, comparisons, feedback, provider/AI,
  auth/RLS, runner-local timezone, Design System, hosted state, or unrelated dirty work.
- Do not stage, commit, push, deploy, call paid providers, or delete the interrupted checkpoint
  without separately proving a safe, task-owned cleanup path.

## Definition Of Done

- Confirming a plan materializes durable calendar workouts; there is no governing active-plan
  lifecycle after that point.
- Calendar reads and row-level actions operate on independent workout truth. Plan provenance is
  never mutation authority and plan replacement/archive cannot rewrite or relink existing workout
  truth.
- Every non-Rest workout supplies the existing copy capability. Its prescription can be pasted once
  into an actually empty editable day, while a persisted Rest row and protected targets are refused
  unchanged.
- The pre-existing broad Copy/Paste checkpoint is either safely reduced to these seams or explicitly
  left unaccepted; no new large path is retained merely because it already exists locally.

## Validation Expectations

- Establish one local persistence discriminator for the active-plan owner coupling and one for the
  former manual-only Copy policy.
- Verify plan materialization, cross-origin non-Rest copy, empty-day paste, source preservation,
  copied-prescription-only truth, protected/past target refusal, Rest-target refusal, local
  persistence/readback, and auth/RLS isolation.
- Use exactly two bounded read-only subagents: one for existing seam/diff reduction and one for
  independent local QA. Do not create further workers unless a real new owner is demonstrated.
- Run only focused Backend and runtime checks needed by the changed seams. Browser proof is the
  existing Calendar Copy → empty-day Paste flow; no broad matrix or Global QA claim is required.

## Next Recommended Role

qa

## Scope Correction

The former blocker was caused by an inconsistent Product instruction, not by a user prohibition.
The Backend slice may change the existing database persistence contract through its canonical
migration path. It may not add a dedicated Copy/Paste RPC or special Rest replacement path. The
known small Frontend distinction between an absent workout and a persisted Rest row is an admitted
later slice in this same work item; it is not a reason for Backend to block its own scope.

## Superseded Blocker Receipt

On 2026-08-10, Backend stopped before executable implementation because the accepted source-only
scope cannot satisfy the independent-workout and empty-day Paste contract through the existing
canonical seams:

- `apply_active_plan_workout_mutation` requires `plan_cycles.status = 'active'`, scopes source,
  target, and date occupancy to one `plan_cycle_id`, and always updates that plan. It cannot mutate
  archived-provenance workouts, prove runner-wide empty-date truth, or leave the saved plan
  immutable without an RPC contract change or a noncanonical privileged CRUD path.
- `apply_reviewed_plan_persistence` requires complete log/evidence transfer during replacement and
  recreates/relinks that truth under new workout IDs. The local red discriminator produced two rows
  on the same date and a new active-readback workout ID (`identityPreserved: false`) before its
  disposable QA lease converged to zero.
- Calendar currently groups an absent workout and a persisted Rest row into the same add/paste
  consumer. Backend can reject a Rest target, but making Paste available only on a truly empty day
  requires a bounded Frontend contract distinction.

| Check                          | Scenario / environment                          | Result             | Evidence                                                                                                            |
| ------------------------------ | ----------------------------------------------- | ------------------ | ------------------------------------------------------------------------------------------------------------------- |
| Copy policy red                | Source replay, archived unknown-origin non-Rest | Failed as expected | Rejected as `unsupported_active_plan_source` before workout prescription truth                                      |
| Replacement identity red       | Disposable loopback Supabase user               | Failed as expected | Two same-date rows; new active clone ID; `identityPreserved: false`; cleanup zero                                   |
| Existing atomic mutation       | Migration/source audit                          | Blocker confirmed  | Active-plan status, same-plan occupancy, and plan-update requirements are inseparable in the current RPC            |
| Replacement completeness       | Migration/source audit                          | Blocker confirmed  | Complete logs/assets/metrics/comparisons/insights must be cloned or relinked                                        |
| Empty versus Rest target       | Read-only Calendar consumer audit               | Blocker confirmed  | Current consumer deliberately exposes the same add/paste context for empty and Rest                                 |
| Interrupted checkpoint cleanup | Shared dirty diff plus local migration history  | Left untouched     | Migration `20260810034530` is already applied locally; deleting only source files would create schema/history drift |
| Independent blocker review     | Bounded read-only QA                            | Passed             | QA independently confirmed both stop boundaries and the no-partial-cleanup decision                                 |

No Backend, migration, fixture, database, browser, or Frontend implementation was changed for this
item. The earlier unaccepted Copy/Paste checkpoint remains byte-for-byte present and unaccepted.
Its safe removal requires a separately authorized whole-cluster reconciliation that also handles
the already-applied local migration; deleting isolated files or hunks is not cleanup.

Omitted by stop condition: implementation, authenticated green persistence/readback, runtime
consumer replay, and Global QA. Consequently Backend Implementation DoD and Global QA Acceptance
remain unpassed.

Task subagents used exactly as requested: one bounded read-only persistence/diff mapper and one
bounded independent read-only QA blocker reviewer; both are complete.

## Backend Completion Receipt — 2026-08-10

Backend applied the Tracked Execution preflight before implementation. The Reuse-First Change
Budget reused the runner Calendar read seam, `apply_active_plan_workout_mutation`, existing
server-side workout reconstruction, local fixture lifecycle, and existing validators. Expected new
artifacts were `none`: the already-present interrupted migration timestamp was reconciled in place,
the dedicated Copy RPC/type/wrapper was removed, and the separate Rest-replacement proof path was
deleted.

The red discriminator was the old active-plan coupling: archived-provenance workouts were not
eligible, the mutation RPC required an active plan and same-plan occupancy, and replacement could
clone/relink historical truth. The green discriminator reads and mutates workouts runner-wide,
uses plan identity only as immutable foreign-key provenance, serializes runner Calendar mutations,
and checks target occupancy by runner plus date without updating `plan_cycles`.

Implementation result:

- Calendar readback includes all runner-owned materialized workouts independent of plan status.
- Move, clear, edit, and Copy address a workout by runner ownership. Their existing history/FIT
  protections remain, except Copy intentionally accepts every persisted non-Rest prescription.
- Direct Copy rebuilds the inserted `planned_workouts` row from the persisted source prescription,
  accepts identifiers only, and uses the one existing atomic mutation function. It never reads or
  writes source logs, FIT assets, metrics, comparisons, feedback, or AI insights.
- Paste rejects past dates and any runner-owned row on the target date. A persisted Rest row is
  occupied truth and remains unchanged.
- Applying a later plan archives the prior plan record and materializes new future workouts without
  carrying, cloning, rewriting, or relinking prior workout/history identities.

| Check                               | Scenario / environment                                                     | Result              | Evidence                                                                                                                                                                                    |
| ----------------------------------- | -------------------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Active-plan coupling discriminator  | Existing source/migration plus disposable local replacement replay         | Passed red-to-green | Old path rejected archived/arbitrary provenance and changed replacement identity; corrected path is runner-owned and preserves prior IDs/history                                            |
| Reuse-First Change Budget           | Shared dirty checkout                                                      | Passed              | One existing mutation/content-edit function pair retained; no table, second RPC, store, scheduler, runtime file, compatibility path, or proof framework added                               |
| Canonical migration replay          | `npx supabase db reset`, loopback Supabase                                 | Passed              | All migrations replayed through `20260810034530`                                                                                                                                            |
| Live schema parity                  | Docker-local `pg_proc`, migration history, privileges/function definitions | Passed              | Only `apply_active_plan_workout_mutation` and content edit remain; dedicated Copy RPC absent; runner locking and `service_role`-only execution confirmed                                    |
| Auth and RLS persistence            | Complete local Backend database suite                                      | Passed              | Authenticated persistence/readback and cross-user/RLS checks passed inside all 19 checks                                                                                                    |
| Universal non-Rest Copy             | Real canonical FIT-backed/logged workout, arbitrary archived provenance    | Passed              | 2026-07-04 source copied to empty 2026-08-24; server accepted persisted non-Rest truth without source-plan status authority                                                                 |
| Prescription-only truth             | Same direct persistence replay                                             | Passed              | Prescription fields matched; source asset count remained 1; target logs/assets/metrics/comparisons/insights were all 0                                                                      |
| Exactly-once and target protection  | Repeat, Rest, occupied, and past target replay                             | Passed              | Repeat and Rest/occupied targets refused without mutation; past target returned protected; runner-wide occupancy rechecked atomically                                                       |
| Saved-plan immutability             | Same direct persistence replay                                             | Passed              | Plan `updated_at` and `end_date` remained unchanged                                                                                                                                         |
| Replacement independence            | Existing manual-workout persistence proof, loopback Supabase               | Passed              | Later plan materialized distinct rows; old workout/log/FIT/metric/comparison/insight identities remained; no clone/relink path executed                                                     |
| Manual authoring persistence        | `validate-manual-workout-authoring --require-persistence`                  | Passed              | Add/move/clear/edit/Copy and protected-state contracts passed through local persistence                                                                                                     |
| Runner activity readback            | `validate-runner-activity-read-models.ts`                                  | Passed              | Archived provenance remained readable; later materialization did not hide or rewrite earlier Calendar/history truth                                                                         |
| Complete local Backend DB inventory | `npm run validate:backend:local-db`                                        | Passed              | All 19 checks passed; runtime/release checks truthfully skipped by that named suite                                                                                                         |
| Canonical fixture convergence       | reset-to-zero, seed, reseed, named status                                  | Passed              | Restored 55 workouts, 30 activities, exact 11 matched / 19 unplanned, source lifecycle, Gate 4, and truthful Gate 5 without accumulation                                                    |
| Production integrity                | `npm run build`                                                            | Passed              | Fresh client/server production build and postbuild completed                                                                                                                                |
| Static integrity                    | Targeted Prettier, ESLint, `git diff --check`, competing-path search       | Passed              | Clean; only the reconciliation migration's defensive `drop function if exists apply_active_plan_workout_copy` reference remains                                                             |
| Independent Backend QA review       | Bounded read-only source/live-schema audit                                 | Passed              | Reviewer independently confirmed immutable plan provenance, runner-wide target truth, universal direct Copy, no evidence-copy path, no dedicated RPC, and untouched Calendar consumer files |

Omitted checks and consequences:

- No browser Calendar replay was run for this Backend slice. The existing Frontend currently still
  needs its admitted bounded empty-versus-Rest Paste visibility adjustment before Product behavior
  can be accepted end to end.
- No hosted Supabase, provider, deployment, staging, commit, push, or release verification was run.
  This receipt proves local loopback Backend Implementation DoD only.
- Full repo-wide `tsc --noEmit` remains outside the focused proof because the shared checkout has
  unrelated known errors; introduced-file filtering was clean and the fresh production build
  passed. This does not establish repo-wide TypeScript baseline health.
- Global QA Acceptance was not run or claimed and remains Pending.

The Backend slice is complete with no blocker. Lifecycle is `ready` for Product to route the
already-admitted bounded Frontend Product follow-up; no role was dispatched by Backend.

## Frontend Completion Receipt — 2026-08-10

Frontend applied the Tracked execution preflight before task-owned writes. The Reuse-First Change
Budget reused `CalendarDaySlot`, `ManualWorkoutAddMenu`, the existing in-memory copy buffer, the
existing direct-copy server action, and the existing `onAdded` Calendar invalidation. Expected new
runtime artifacts were `none`; none were added. The superseded active-plan Paste eligibility and
Rest-target copy were removed without adding client state, a menu, a helper, or a compatibility
path.

The red discriminator used the menu's existing `Add rest day` capability to distinguish the two
visually identical card states: that action is present only when no workout row exists. Before the
change, the persisted Rest target on 2026-08-12 had no `Add rest day` action but still offered
`Paste copied workout` and described Paste as targeting a Rest day. The first incorrect owner was
the Frontend Calendar-to-`ManualWorkoutAddMenu` eligibility seam.

Implementation result:

- `CalendarDaySlot` now passes whether the projected target truly has no workout row.
- `ManualWorkoutAddMenu` exposes Paste only when both a copied source and that empty-target
  capability are present. Active-plan identity is no longer a client Paste condition or request
  input; Backend remains the sole mutation authority.
- Copy and Paste messages now promise an empty target and saved workout truth, not Rest replacement
  or saved-plan authority.
- Existing source Copy/Move/Clear actions, Rest/manual-add actions, Calendar invalidation, and
  materialized workout links remain in their existing owners.

| Check                               | Scenario / environment                                       | Result              | Evidence                                                                                                                                                                 |
| ----------------------------------- | ------------------------------------------------------------ | ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Empty-versus-Rest red discriminator | Authenticated built loopback Calendar                        | Passed red-to-green | Persisted Rest 2026-08-12: `Add rest day` 0; before correction Paste 1 with Rest-day copy; final build Paste 0 with the same copied buffer                               |
| Non-Rest Copy eligibility           | Tempo workout, 2026-08-11                                    | Passed              | Source menu retained Copy, Move, and Clear; copy toast says the source is ready for an empty day                                                                         |
| Empty Paste eligibility             | Week view, empty 2026-09-01 and final-build empty 2026-09-02 | Passed              | `Add rest day` 1 proved absence; Paste 1; menu copy says `Save the copied workout into this empty day.`                                                                  |
| Paste persistence and refresh       | Tempo 2026-08-11 -> empty 2026-09-01                         | Passed              | `Workout pasted`; after invalidation the add trigger became a Tempo workout link; after full runtime rebuild/reload it remained `data-hito-calendar-day-state="workout"` |
| Materialized workout navigation     | Reloaded 2026-09-01 Calendar link                            | Passed              | Normal Link opened `/workout/2026-09-01?tab=overview`; workout heading was `Tempo`                                                                                       |
| Rest and manual-add preservation    | Persisted Rest 2026-08-12 and empty 2026-09-02               | Passed              | Rest retained Start from scratch and Choose template but no Paste; empty retained those actions plus Add rest day and Paste                                              |
| Focused static validation           | Task-owned TSX and lifecycle file                            | Passed              | Prettier check, focused ESLint, and `git diff --check` clean                                                                                                             |
| Existing authoring validator        | `npm run validate-manual-workout-authoring`                  | Passed              | Non-mutating manual-workout authoring review invariants passed                                                                                                           |
| Production build/runtime freshness  | Managed `http://127.0.0.1:3000` real-provider runtime        | Passed              | Production build completed; managed loopback server healthy; artifact freshness `receipt_matches`                                                                        |

Omitted checks and consequences:

- Exact mobile browser replay was not run because Month, Week, and mobile slots all use the same
  `CalendarDaySlot` target capability with no viewport eligibility branch. This receipt does not
  provide separate mobile visual coverage.
- Full repo-wide `tsc --noEmit` was not run because the shared checkout has unrelated known errors;
  the focused ESLint and fresh production build passed. This does not establish repo-wide
  TypeScript baseline health.
- No hosted/production state, paid provider, deployment, staging, commit, push, or release check
  was run. Global QA Acceptance was not run or claimed and remains Pending.

Frontend Product Implementation DoD is complete with no blocker. No subagent was used; the focused
runtime discriminator and managed browser replay directly covered the changed consumer seam.

## Exact Frontend Handoff — 2026-08-10

```text
ROLE: FRONTEND

Frontend lane: Product
Mode: Tracked

Task: Complete Calendar Empty-versus-Rest Paste visibility after the runner-owned Copy/Paste backend correction.

Stage: Bounded user-facing closure

Canonical work item:
docs/tasks/backlog/2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md

Accepted Backend contract:
- Materialized workouts are runner-owned Calendar truth; `plan_cycles` is provenance only.
- Any persisted non-Rest workout is a Copy source; only its prescription is copied.
- The existing backend mutation accepts a Paste only into a truly empty editable date and rejects
  an occupied, Rest, past, or otherwise protected target without mutation.

Visible issue and source discriminator:
- `src/components/Calendar.tsx` currently sends both an absent workout and a persisted Rest row to
  the same `ManualWorkoutAddMenu` consumer.
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx` currently derives Paste
  eligibility from the copied source and active-plan context, then describes its action as saving
  into a Rest day. That is superseded by the accepted backend contract.

Required outcome:
- When the user has copied a non-Rest workout, Calendar exposes “Paste copied workout” on a truly
  empty editable day only.
- A persisted Rest day never offers Paste and remains unchanged. Preserve its existing unrelated
  actions and all existing past/protected behavior.
- The user can complete the focused Calendar Copy -> empty Paste flow and see the resulting
  workout after refresh. Do not infer a second calendar truth on the client.

Ownership, reuse, and boundary:
- Reuse the existing Calendar and `ManualWorkoutAddMenu` capability/refresh seam. Make the
  smallest consumer change required by the backend-shaped contract.
- Expected new runtime artifacts: none. Do not add client state, a menu, persistence, a plan or
  active-plan workaround, a compatibility path, a DS primitive, or a generic test framework.
- Do not change Backend code, migrations, active-plan/plan lifecycle, source prescription,
  workout/FIT/log/evidence truth, auth, timezone, Design System, DevTools, or unrelated dirty work.

Definition of Done:
- Copy eligibility remains available for a backend-capable non-Rest source.
- Paste is visible and succeeds once for an empty editable target, then refreshes to its materialized workout.
- With the same copied buffer, a persisted Rest target does not expose Paste and no target mutation occurs.
- Existing move and manual-add options retain their intended eligibility; no broad Calendar redesign.

Focused proof:
- Establish the smallest rendered or runtime discriminator for empty versus persisted Rest before
  writing. Run focused formatting/lint and the smallest relevant existing validation.
- Use a supported local browser/control surface to prove Copy -> empty Paste and Rest exclusion;
  do not ask for browser approval or stop at a platform dialog. Exact mobile coverage is needed
  only if the eligibility branch differs by viewport.
- Update this work item to `in_progress` before task-owned writes and record a compact truthful
  closure receipt. Do not claim Global QA Acceptance.

Stop only for a demonstrated missing Backend contract or a new cross-owner requirement. A local
browser preference, a platform permission dialog, or the lack of a preferred browser is not a
stop condition; use another supported local path.

Authorization:
Routine local edits, loopback runtime/browser control, focused validation, and one bounded
read-only review only if it materially improves confidence are authorized. Do not access hosted or
production state, stage, commit, push, deploy, call paid providers, or modify unrelated work.
```

## Historical Blocked Prompt — Do Not Dispatch

```text
ROLE: BACKEND

Mode: Tracked

Task: Make plan-created calendar workouts independent, then deliver simple Copy/Paste for every
non-Rest workout.

Stage: Backend contract correction

Canonical work item:
docs/tasks/backlog/2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md

Product contract:
- A confirmed plan creates workouts once. After that it is only saved provenance, never a current
  calendar owner or mutation authority.
- Every persisted non-Rest workout is a Copy source. Copy means workout prescription only: never
  logs, FIT, actuals, comparisons, feedback, AI, or completion truth.
- Paste is available only on a truly empty editable day. A persisted Rest row is not empty and must
  not be deleted or replaced for Paste. Preserve existing protected/past target rules.

Evidence before code:
The current active-plan seam conflates plan provenance, calendar reads, row permissions, and
replacement/history behavior. The stopped prior task also proves that Rest replacement creates a
new RPC/migration path the user does not want. Establish the smallest local discriminator for both
facts before writing.

Required outcome:
Reuse and simplify the existing Backend calendar read/write seams so materialized workouts are
independent truth and Copy/Paste is based on the workout and an empty target day, not plan origin.
Do not build a new plan system, scheduler, store, RPC, migration, UI, compatibility layer, or broad
proof framework. Treat the interrupted Copy/Paste diff as unaccepted: retain only what directly
serves this smaller contract.

Definition of Done:
- A plan no longer governs its materialized workouts after creation.
- Existing Calendar actions operate on independent workouts; provenance is read-only.
- Every non-Rest workout copies its prescription into a truly empty editable day exactly once.
- Rest targets and protected targets remain unchanged; source result/FIT/evidence truth is never
  copied or moved.

Required proof:
Use exactly two bounded read-only subagents: one to identify the smallest reusable seam and reduce
the interrupted checkpoint, and one for independent local QA. Run only the focused persistence,
readback/auth, and Calendar consumer proof needed for this contract. Update this work item before
implementation and at closeout. Do not claim Global QA Acceptance.

Stop condition:
Stop if this cannot be achieved without a new persistence shape, migration, RPC, or a separate
Frontend/Design System contract. Report the demonstrated invariant; do not expand the task.

Approval policy:
Routine local source work, loopback fixtures, disposable local data/cleanup, validation, and safe
bounded subagents are authorized. Do not access hosted/production systems, stage, commit, push,
deploy, call paid providers, or perform material deletion.
```

## Exact Backend Handoff

```text
ROLE: BACKEND

Mode: Tracked

Task: Remove active-plan authority from materialized calendar workouts and implement simple
non-Rest Copy/Paste through the existing calendar persistence seam.

Stage: Backend implementation slice

Canonical work item:
docs/tasks/backlog/2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md

Product contract:
- A confirmed plan creates workouts once; afterward its record is provenance only, never calendar
  ownership or mutation authority.
- Any persisted non-Rest workout is a Copy source. Copy includes prescription only, never results,
  FIT, evidence, feedback, AI, comparisons, or completion truth.
- Paste is only for a truly empty editable day. A persisted Rest row stays unchanged and is never a
  Paste target.

Demonstrated source facts:
- Current queries and mutations require one active plan and one plan_cycle_id.
- The prior unaccepted checkpoint added a separate Rest-replacement RPC/migration. Do not extend or
  accept that path.

Authorized smallest change:
Reuse and modify the existing calendar persistence/query seam. If its database definition must
change, update it through its one canonical migration path; this is authorized. Do not create a
second RPC, table, scheduler, store, runtime file, compatibility layer, or proof framework.
Before writing, apply the Reuse-First Change Budget and state the expected new artifacts; `none` is
the expected result. Reduce the interrupted checkpoint to only code required by this contract and
reconcile its local migration state safely; do not leave competing copy paths.

Backend Definition of Done:
- Materialized workouts are read and mutated as independent runner calendar truth; plan provenance
  does not gate Calendar actions or trigger history cloning/relinking.
- Existing copy capability is available for every non-Rest workout and persists prescription-only
  into an actually empty editable day exactly once.
- Rest, past, and other protected targets are rejected without mutation; source result/FIT/evidence
  truth remains unchanged.

Scope:
Backend persistence, server read/write truth, necessary canonical migration update, existing
validators, local fixture proof, and this item lifecycle. A later Frontend condition that hides
Paste on persisted Rest is already admitted in this same item; do not call your Backend slice
blocked because of it and do not edit Frontend files.

Proof:
Run only the focused red/green persistence, authenticated readback, Rest-target refusal, and
existing Calendar consumer-contract checks needed by this slice. Use one bounded read-only QA or
persistence reviewer after the local pass; do not create additional workers or a broad test harness.
Report all omitted checks honestly. No Global QA claim.

Stop condition:
Stop only if this requires a new table, a second RPC, a parallel truth path, or a change outside the
existing Backend persistence seam. A necessary edit to the existing migration/function is not a
stop condition.

Approval policy:
Routine local source work, canonical local migration reconciliation, loopback fixtures, validation,
and one safe read-only reviewer are authorized. Do not access hosted/production systems, stage,
commit, push, deploy, call paid providers, or perform material deletion outside this task-owned
checkpoint reconciliation.
```

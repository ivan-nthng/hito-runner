# Calendar Overflow Actions For Future Workouts And Plans

## Work Item ID

2026-08-11-calendar-overflow-future-workout-actions

## Status

completed

## Type

product_workflow

## Priority

high

## Owner

backend

## Frontend Lane

Product

## Mode

Tracked

## Stage

Backend and bounded Frontend implementation complete; local implementation acceptance recorded.
Global QA Acceptance remains pending.

## Next Recommended Role

QA, only if Product schedules Global QA Acceptance

## Archive Intent

retain_in_place

## Task

Add one Calendar-header overflow menu at the far right without rearranging any existing header
controls. The menu gives a runner access to four factual actions:

1. **Download future workouts JSON** — export the runner's current eligible future Calendar truth,
   not an inferred saved-plan payload.
2. **Upload plan JSON** — validate a runner-provided existing Hito plan JSON and retain it as a
   saved plan. Upload itself must not modify Calendar workouts.
3. **Start a new plan** — after a clear explanation and explicit confirmation, remove only
   replaceable upcoming Calendar workouts and open the existing plan-creation flow.
4. **Delete future workouts** — a destructive menu item, visually destructive, which requires
   explicit confirmation and removes only replaceable upcoming Calendar workouts.

Plans remain provenance/library records; no action may restore a current/active-plan authority.

## User Report

Ivan requests that the current Calendar header retain its exact layout and gain only one far-right
ghost icon button with an ellipsis. The dropdown must contain Download JSON, Upload JSON, Start a
new plan, and destructive Delete future workouts. Start must warn that future workouts will be
deleted. Past workouts must never be touched. A runner should be able to upload a Hito plan or
template JSON and retain it for later use.

## Source Investigation And Demonstrated Facts

- `src/components/Calendar.tsx:104-150` owns the current header. It contains the existing Month/
  Week control, previous/Today/next navigation, and no overflow action. Those existing controls
  are out of scope; the only header addition is the far-right menu trigger.
- The canonical saved-plan Start contract already exists at
  `src/lib/active-plan-export-actions.ts:45-101` and
  `src/lib/active-plan-persistence.ts:409-475`. It requires explicit
  `replace_future_workouts` when the relevant schedule is occupied; it uses runner-local date and
  leaves the saved record immutable.
- The existing parser for an uploaded Hito plan is `validateImportedPlanJson` in
  `src/lib/imported-plan.ts:555-609`. It must be reused; do not create a second JSON format.
- Existing `exportSavedPlanForUser` / `/api/plan/export` export a **selected saved-plan record**.
  They do not export the current Calendar's independent future workout truth and must not be
  relabelled as if they did.
- The legacy Upload JSON dialog was removed with active-plan UI. It is not a candidate to revive.
- `src/routes/index.tsx:46-52` only renders `OnboardingGate` for `snapshot.mode === "onboarding"`.
  Starting a new plan from an authenticated Calendar therefore needs a narrow Product consumer
  route/state seam that reuses the existing plan-creation experience; do not reintroduce active
  plan lifecycle UI.
- Existing Start treats dates on or after the runner-local calendar date as its replaceable
  schedule window (`workout_date >= currentDate`). Preserve that date convention for this workflow
  unless the canonical backend seam proves a stricter protected-record invariant is required.

## Backend Execution Preflight

- **Classification:** Tracked. The approved workflow crosses authenticated persistence, import/
  export, destructive mutation, and a bounded Frontend Product consumer.
- **Canonical owners to reuse:** `validateImportedPlanJson` remains the sole plan-JSON parser;
  saved-plan retention remains in `active-plan-persistence`; `buildActivePlanExportPayload` and
  `activePlanExportToTrainingPlanV2` remain the sole `training-plan-v2` export path; runner-local
  date remains `getRunnerCalendarDateForUserId`; and saved-plan Start continues through
  `applySavedPlanRecordForUser` plus `apply_reviewed_future_schedule_persistence`.
- **Source discriminator:** `apply_reviewed_future_schedule_persistence` cannot represent a pure
  clear because it always inserts a new materialized `plan_cycles` row. `apply_calendar_workout_
mutation` cannot represent a bulk clear because it operates on exactly one row. A browser loop
  would therefore lose atomicity and bypass the existing protected-record transaction boundary.
- **Smallest backend change:** add one service-role-only atomic future-schedule-clear RPC and its
  thin lifecycle wrapper; add private server actions that parse/retain an existing plan JSON,
  export eligible Calendar truth, and call that clear seam. Retention will generalize the existing
  saved-plan owner rather than create a second record shape.
- **New production artifacts:** one append-only migration and one thin server-action module only
  if no existing action owner can carry the final request contract. No table, storage model, JSON
  schema, provider call, current-plan authority, or compatibility path is proposed.
- **Removal/simplification:** no retired active-plan or UploadJson UI path will be restored. Any
  generator-specific retention naming made generic by the reused owner will be updated at all live
  callers rather than retained as a compatibility alias.

## Product Contract

- **Calendar header:** Month, Week, Previous, Today, and Next stay exactly where they are. Add one
  far-right ghost icon-only ellipsis trigger using the existing Dropdown and Hito Button contracts.
- **Download:** produce a private JSON download representing the runner's actual eligible upcoming
  Calendar workouts. Do not pretend a saved plan is the calendar and do not export history/FIT/raw
  activity evidence.
- **Upload:** accept only the existing validated Hito plan JSON format. A successful upload adds an
  immutable saved-plan record to the existing Plans library. It does not create, replace, move, or
  delete Calendar workouts; a later existing Start action remains explicit.
- **Start a new plan:** confirmation clearly says that eligible upcoming workouts will be removed.
  Cancel is a no-op. Confirm removes only eligible upcoming schedule rows, then opens the existing
  Generated/Build myself plan-creation surface for the authenticated runner. No new current-plan
  entity or provider call is introduced.
- **Delete future workouts:** confirmation is destructive, Cancel is a no-op, and Confirm deletes
  only eligible upcoming schedule rows. It does not open plan creation.
- **Protection:** past rows, completed/skipped rows, logs, FIT/raw assets, metrics, comparisons,
  feedback, AI insight, and any protected workout/evidence identity remain unchanged. Runner-local
  date, auth isolation, and concurrency protections are canonical backend responsibilities.

## Required Ownership And Boundaries

- **BACKEND (lead):** truth, import validation/retention, calendar-future export, authenticated
  destructive/Start mutation, date/protection policy, and local persistence proof.
- **FRONTEND Product (bounded subagent):** the Calendar header menu, file selection/feedback,
  existing dropdown/dialog composition, confirmation flows, cache refresh/navigation, and the
  narrow authenticated plan-creation entry. It must consume only the final backend contract.
- **QA (bounded read-only subagent):** loopback browser proof after both slices are integrated.
- Shared Hito primitives, tokens, canonical DS CSS, `/hitoDS`, Figma, hosted state, paid providers,
  and unrelated dirty work are not in scope.

## Reuse-First Change Budget

- Reuse: `Calendar`, existing Dropdown/Hito Button/Dialog primitives, `imported-plan` validation,
  saved-plan persistence/library, runner-calendar timezone context, existing plan Start alignment,
  and existing authenticated persistence seams.
- New production artifacts: only if the source audit proves a missing canonical authenticated
  calendar-future export or atomic bulk-clear seam. No new table, storage model, plan authority,
  JSON format, generic framework, compatibility layer, or duplicate UI family is authorized.
- Required removal/simplification: do not revive the retired active-plan/UploadJson UI or route
  compatibility exports. Any superseded legacy branch discovered in the exact changed seam must be
  removed rather than kept as a shim.

## Definition Of Done

1. The existing header controls are unchanged; a far-right ghost ellipsis dropdown is usable at
   desktop and narrow widths.
2. Download yields a private valid JSON document for current eligible future Calendar truth.
3. Upload validates only the existing JSON contract, stores one saved-plan record, and leaves
   Calendar truth unchanged.
4. Start new plan and Delete future workouts both require a clear explicit confirmation; cancel is
   an exact no-op.
5. Confirmed destructive actions touch only eligible rows in the runner-local upcoming window;
   protected past/FIT/log/evidence truth is exactly unchanged and users remain isolated.
6. Start new plan opens the existing plan creation experience without creating a current-plan
   authority or calling a provider.
7. Existing saved-plan Start, plan library, Calendar month/week navigation, workout copy/paste,
   and manual editing remain functional.

## Validation Expectations

| Check                 | Scenario / environment                                               | Required evidence                                                                                                                 |
| --------------------- | -------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| Backend discriminator | Loopback Supabase, disposable users                                  | Existing saved-plan export is distinguished from live Calendar-future export; upload and bulk actions have canonical truth owners |
| Upload/retention      | Valid and invalid existing Hito JSON                                 | Valid input creates one library record only; invalid input creates nothing; no Calendar mutation                                  |
| Download              | Future schedule with independent manual modifications                | JSON reflects current future calendar facts and omits past/raw FIT/activity evidence                                              |
| Deletion/Start safety | Occupied future plus protected past/FIT/log fixture                  | Cancel is no-op; confirmed operation affects only eligible upcoming rows; protected identities/hashes remain unchanged            |
| Auth/concurrency      | Two local users and concurrent mutation attempt                      | User isolation and existing atomic/concurrency guarantees hold                                                                    |
| Browser               | Managed loopback `qa_fixture`, desktop and 375×812, available themes | Header controls stay stable; menu, upload, confirmations, download and plan-entry flow are usable with no overflow/console errors |
| Regression            | Existing saved-plan Start/library and Calendar interactions          | No active-plan authority or stale legacy consumer returns                                                                         |
| Static/build          | Focused lint/format/diff and current build when uncontended          | Task-owned source clean                                                                                                           |

## What Not To Touch

- Do not rearrange Month, Week, Previous, Today, or Next; do not replace the Calendar header.
- Do not add a second plan JSON schema, new plan table, current/active status, automatic merge,
  hidden schedule rewrite, provider call, or browser-owned calendar truth.
- Do not delete history, raw FIT files, logged/completed/skipped workouts, metric/comparison/
  feedback/insight records, or any protected identity.
- Do not use hosted Supabase, deployment, production user data, paid providers, staging, commit,
  push, or deployment.

## Stop Conditions

- Stop and report if safe bulk deletion cannot be expressed through an existing atomic persistence
  owner without a schema/RPC migration that changes a protected-record invariant.
- Stop and report if a proposed upload needs a second JSON format, a new storage table, or direct
  browser persistence.
- Do not stop merely because the retired UI no longer exists; reuse its surviving canonical
  backend contracts and recompose only the narrow new Product consumer.

## Exact Backend-Led Handoff

```text
ROLE: BACKEND

Task: Calendar overflow actions for future workouts and plans
Mode: Tracked
Canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-calendar-overflow-future-workout-actions.md`

You are the lead owner because this task includes authenticated Calendar truth, import/export, and
destructive future-schedule mutation. Read `AGENTS.md`, `agents/backend.agent.md`,
`skills/hito-backend-supabase-contract/SKILL.md`, and the canonical item before the first write.
Read the existing saved-plan, imported-plan, calendar-persistence, timezone, and Calendar consumer
seams named in the item. Classify and record the existing owner before adding anything.

Implement the approved product contract in the item. Reuse existing Hito plan JSON validation,
saved-plan retention, runner-local date context, explicit saved-plan replacement policy, and
authenticated persistence. Do not revive retired active-plan authority or the deleted UploadJson
UI. Upload must retain a validated plan as a saved-library record and must not change Calendar
workouts. Download must represent actual eligible future Calendar truth, not a saved-plan payload.
Start new plan and destructive delete require explicit confirmation in the consumer and must be
canonical, atomic, runner-local, auth-isolated mutations that preserve all protected past/FIT/log/
evidence truth.

Use two bounded subagents:
1. a FRONTEND Product subagent with disjoint-write authority only after you define the final
   backend-shaped contract. It owns the far-right Calendar overflow trigger/menu, JSON picker and
   feedback, confirmation dialogs, cache refresh/navigation, and reuse of the existing
   plan-creation experience. It must not change backend truth or Design System source.
2. a read-only QA subagent after integration for loopback browser proof.

Keep the existing Month/Week/Previous/Today/Next header controls exactly where they are. The only
header addition is a far-right existing Hito ghost icon-only ellipsis trigger. Its dropdown offers
Download future workouts JSON, Upload plan JSON, Start a new plan, and destructive Delete future
workouts. The UI uses existing Dropdown, Button, Dialog, file-input, and feedback patterns only;
no custom primitive, arbitrary pixels, compatibility layer, or new generic framework.

Before adding a migration/RPC/helper/file, demonstrate that the existing seam cannot own the exact
contract. No new table, JSON schema, storage model, plan authority, provider call, hosted action,
or data deletion outside disposable local proof is allowed. Preserve unrelated dirty work exactly.

Validate backend truth, valid/invalid upload, factual export, cancel/no-op, protected history/FIT,
auth isolation/concurrency, existing Start/library/Calendar behaviors, and the frontend browser
matrix at managed loopback qa_fixture. Run proportional static/build checks when uncontended.
Do not stage, commit, push, deploy, access hosted state, call providers, or delete material data.
Use Russian for visible progress commentary. The canonical task and final formal receipt must be
English and distinguish Implementation DoD from Global QA/release claims.
```

## Blocked Integration Receipt — 2026-08-11

**Implementation DoD: Not passed.** The Backend and bounded Frontend slices are integrated, but
the required stable loopback regression and browser acceptance could not be completed without
misrepresenting shared infrastructure state. **Global QA Acceptance and release readiness are not
claimed.**

### Delivered source outcome

- One private future-Calendar export path returns the runner's actual upcoming rows through the
  existing `training-plan-v2` document owner; it is distinct from selected saved-plan export.
- Existing JSON validation and saved-plan retention now accept a valid imported plan as an
  immutable library record without materializing Calendar workouts.
- One service-role-only atomic clear RPC removes only runner-local eligible future rows, refuses
  protected future evidence before any deletion, and preserves past/FIT/log/evidence truth.
- Existing materialization seams now accept retained past history when no future rows exist, so
  both generated Start and profile-backed Build myself can enter the existing creation experience
  without reviving active-plan authority.
- The bounded Product consumer adds only the far-right ghost ellipsis menu, exact menu actions,
  existing file input/dialog/feedback composition, explicit no-op cancellation, and the narrow
  `?createPlan=true` entry to the existing onboarding experience.

### Root-cause and ownership evidence

The canonical `apply_reviewed_future_schedule_persistence` seam always creates a materialized
plan row, while `apply_calendar_workout_mutation` mutates one workout only. Neither can express an
atomic pure future clear. The first incorrect owner was therefore missing Backend persistence
coverage; the minimal new owner is
`supabase/migrations/20260811125538_clear_calendar_future_workouts.sql`. The consumer itself
remains a route-local Frontend Product responsibility.

### Files changed

- `supabase/migrations/20260811125538_clear_calendar_future_workouts.sql`
- `src/lib/supabase/database.ts`
- `src/lib/active-plan-lifecycle-persistence.ts`
- `src/lib/active-plan-persistence.ts`
- `src/lib/running-plan-engine-actions.ts`
- `src/lib/calendar-overflow-actions.ts`
- `src/routes/api.plan.export.tsx`
- `scripts/running-plan-engine-confirm/persistence-proof.ts`
- `scripts/validate-calendar-overflow-future-actions.ts`
- `scripts/validate-backend.mjs`
- `src/components/Calendar.tsx`
- `src/components/calendar/CalendarOverflowActions.tsx`
- `src/routes/index.tsx`

### Validation inventory

| Check                          | Scenario / environment                                       | Result       | Evidence                                                                                                                                                |
| ------------------------------ | ------------------------------------------------------------ | ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Direct new persistence proof   | Disposable loopback users before shared service interruption | Passed       | Valid/invalid upload, factual export, past FIT preservation, clear, protected refusal, concurrency, future-only Start, and zero active-plan rows passed |
| Backend source suite           | Current source tree                                          | Passed 15/15 | Existing source contracts, including Calendar authority retirement, passed                                                                              |
| Frontend focused static checks | Consumer and route slice                                     | Passed       | Prettier, ESLint, and `git diff --check` passed in the bounded Frontend handoff                                                                         |
| Full local DB suite            | First replay after service outage                            | Blocked      | Checks 1–13 passed; check 14 could not acquire a disposable user because local Supabase transport was unavailable earlier in the same run               |
| Full local DB suite            | Replay during repeated local-service restart                 | Blocked      | Checks 1–13 passed; check 14 correctly refused an already-leased pool role; inventory could not safely verify/clear it because Auth/Kong was restarting |
| Fresh production artifact      | Shared local build output                                    | Blocked      | Integrity refused a missing private Admin repository snapshot marker; no current managed artifact exists                                                |
| Browser QA                     | Managed `qa_fixture`, desktop and 375px                      | Not run      | No healthy fresh managed loopback runtime was obtainable; independent QA issued no verdict                                                              |

### Preserved boundaries and next condition

No hosted state, provider, schema table, storage model, active-plan authority, compatibility
layer, staging, commit, push, deployment, or material user-data deletion was introduced. The only
local cleanup was owned disposable proof state and leases while the local service was healthy.

To resume, first restore a stable local Hito Supabase/Auth endpoint and a current build artifact
whose private Admin snapshot marker validates. Then run the named QA-pool inventory/reset path to
resolve only the demonstrably stale lease, rerun `npm run validate:backend:local-db`, start the
managed `qa_fixture`, and ask QA to execute the existing browser inventory. No source workaround
is authorized for either infrastructure blocker.

## Superseding Completion Receipt — 2026-08-11

**Implementation DoD: Passed.** This receipt supersedes the earlier infrastructure-blocked state.
**Global QA Acceptance, hosted parity, deployment, and release readiness are not claimed.**

### Outcome and root cause

The Calendar keeps Month, Week, Previous, Today, and Next in their original order and adds one
far-right ghost ellipsis menu. Download exports current runner-owned future Calendar truth. Upload
reuses the canonical `training-plan-v2` parser and immutable saved-plan record. Start and Delete
share one authenticated, runner-local, service-role-only atomic future-clear function; they refuse
protected future evidence before mutation and never restore active-plan authority.

The demonstrated missing owner was an atomic pure-clear operation: the existing reviewed-future
schedule function always materializes a plan, while the existing Calendar mutation function owns
one row. The focused migration adds only that missing bulk transaction. The same migration also
updates the existing reviewed-plan persistence signature to carry `currentDate`, allowing ordinary
plan/manual entry when protected history exists but no future schedule exists. No second parser,
plan store, persistence path, provider path, or compatibility layer was added.

### Task-owned paths

- `supabase/migrations/20260811125538_clear_calendar_future_workouts.sql`
- `src/lib/calendar-overflow-actions.ts`
- `src/lib/active-plan-lifecycle-persistence.ts`
- `src/lib/active-plan-persistence.ts`
- `src/lib/running-plan-engine-actions.ts`
- `src/lib/supabase/database.ts`
- `src/routes/api.plan.export.tsx`
- `src/components/Calendar.tsx`
- `src/components/calendar/CalendarOverflowActions.tsx`
- `scripts/validate-calendar-overflow-future-actions.ts`
- `scripts/validate-active-plan-schedule-edit-preview.ts`
- `scripts/running-plan-engine-confirm/persistence-proof.ts` (current-date RPC calls only)
- `scripts/validate-backend.mjs`
- this canonical item

`src/routes/index.tsx` was inspected and reused as the existing `?createPlan=true` entry; it was
not changed by this task. All unrelated dirty work was preserved.

### Validation inventory

| Check                       | Scenario / environment                                   | Result                                                           | Evidence                                                                                                                                                                                                                                                                                                                             |
| --------------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Backend discriminator       | Loopback Supabase, disposable users                      | Passed                                                           | Saved-plan export and live future-Calendar export remained distinct; pure clear used one atomic canonical owner                                                                                                                                                                                                                      |
| Upload and retention        | Invalid JSON plus valid downloaded `training-plan-v2`    | Passed                                                           | Invalid UI upload showed `Plan not saved` and created no record; valid UI upload created exactly one archived `training_plan_v2_import` record and did not change the 55-row Calendar                                                                                                                                                |
| Download                    | Authenticated Admin Calendar                             | Passed                                                           | Private browser download parsed as `training-plan-v2`, 54 rows dated 2026-08-11 through 2026-10-03, with no raw FIT/storage markers                                                                                                                                                                                                  |
| Clear safety                | Protected past FIT/log plus replaceable future rows      | Passed                                                           | Focused replay preserved protected past identity/hash; browser Delete cleared exactly 54 eligible future rows and refreshed Calendar                                                                                                                                                                                                 |
| Protected refusal           | Future row with protected evidence                       | Passed                                                           | Transaction rejected before mutation; all three fixture Calendar rows remained unchanged                                                                                                                                                                                                                                             |
| Auth and concurrency        | Two disposable users and concurrent clear                | Passed                                                           | Runner isolation held; advisory-locked replay cleared once and converged to zero                                                                                                                                                                                                                                                     |
| Existing plan/manual entry  | Protected past history, no future schedule               | Passed                                                           | Generated plan entry and Build myself both materialized without active-plan authority                                                                                                                                                                                                                                                |
| Calendar restoration        | Admin browser fixture after destructive QA               | Passed                                                           | Existing immutable saved-plan Start restored exactly 54 rows; selected record stayed unchanged; OpenAI was not called                                                                                                                                                                                                                |
| Desktop browser             | Chrome, 1470x801, authenticated Admin                    | Passed                                                           | Header/menu order, private download, both confirmations, exact cancel no-op, focus return, and zero console errors                                                                                                                                                                                                                   |
| Narrow browser              | Chrome, exact 375x812, System/Light/Dark                 | Passed                                                           | Header/menu/dialog containment; confirmed Delete and Start; no horizontal overflow; original Dark preference restored                                                                                                                                                                                                                |
| Protected past readback     | Authenticated FIT Product Acceptance                     | Passed                                                           | Valid upload left 55 Calendar rows, the original past workout ID, and its existing log unchanged                                                                                                                                                                                                                                     |
| Backend focused contract    | `validate-calendar-overflow-future-actions.ts`           | Passed                                                           | Upload 1, export 3, clear 3, protected past FIT true, protected future refusal true, active plan rows 0, provider calls false                                                                                                                                                                                                        |
| Backend source suite        | `npm run validate:backend`                               | Passed 15/15                                                     | All registered source-contract checks passed                                                                                                                                                                                                                                                                                         |
| Existing focused regression | Schedule-edit and running-plan confirm source validators | Passed                                                           | Both affected validators passed after the canonical signature update                                                                                                                                                                                                                                                                 |
| Static checks               | Targeted Prettier, ESLint, and `git diff --check`        | Passed                                                           | All task-owned TypeScript/TSX/Markdown source clean; SQL checked by diff/whitespace because Prettier has no SQL parser                                                                                                                                                                                                               |
| Production build            | Current shared checkout while stable                     | Passed                                                           | `npm run build` and `validate-build-output-integrity.mjs` passed; integrity recorded 209 runtime MJS files and 3,075 relative imports                                                                                                                                                                                                |
| Managed runtime             | Fresh `qa_fixture` artifact used for browser proof       | Passed, later stale                                              | Loopback server started healthy, compatible, provider-isolated, and `receipt_matches`; later unrelated repository writes made the artifact stale while the process remained healthy                                                                                                                                                  |
| Independent review          | Reused read-only QA subagent                             | Passed source and exercised browser; completeness verdict failed | No Product defect found. QA independently covered source, download, confirmations, destructive actions, themes, responsive layout, and console; its Chrome bridge could not attach a file and its Admin fixture lacked protected past, so the owner subsequently executed those two exact gaps in the in-app browser and FIT fixture |

### Omitted checks and consequences

- The full `validate:backend:local-db` run passed checks 1-14, then stopped at the pre-existing
  running-plan-confirm fixture drift `55 !== 56`; checks 16-20 did not run in that invocation.
  The task-specific database replay and all 15 source checks passed, but this receipt does not
  claim a completely green repository-wide local DB suite.
- The final `qa:server:status` observed a healthy process with a stale/missing artifact receipt
  after unrelated concurrent repository writes changed the Admin snapshot. The task had already
  passed a fresh build and the browser matrix on a fresh managed artifact; no claim is made that
  the later shared dirty checkout remained frozen.
- Hosted Supabase, paid/real providers, deployment, production data, staging, commit, push, and
  release checks were not run. Their coverage remains absent by scope.

### Preserved boundaries and lifecycle

One active/current plan authority was not reintroduced. Past/logged/FIT/evidence/comparison truth,
runner timezone, auth/RLS, saved-plan immutability, Calendar copy/move/edit behavior, provider
isolation, dependencies, lockfiles, hosted state, and unrelated dirty work remain intact. The local
Admin future Calendar was restored through the canonical saved-plan Start lifecycle after QA.

Exactly two existing subagents were reused and are complete: a bounded Frontend Product owner for
the disjoint Calendar consumer and a bounded read-only QA reviewer. No additional subagent was
created. This work item is `completed`; Global QA Acceptance remains pending and QA-owned.

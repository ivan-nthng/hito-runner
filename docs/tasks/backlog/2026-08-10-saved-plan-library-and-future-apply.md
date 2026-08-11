# Saved Plan Library And Future Schedule Apply

## Work Item ID

2026-08-10-saved-plan-library-and-future-apply

## Status

completed

## Type

product-contract-and-library

## Priority

high

## Owner

backend

## Scope

saved-plan-library-and-future-schedule-apply

## Archive Intent

retain_in_place

## Task

Give a runner a simple library of every saved plan and let the runner download or apply one without
turning a plan back into a calendar owner.

## Stage

Backend source-of-truth implementation and focused local persistence proof are complete. The
required discriminator found no existing generated-plan payload owner, so the single permitted
`plan_cycles` payload migration owns immutable library records without a new table or RPC path.
Frontend Product integration and Global QA Acceptance remain pending.

## User Report

Every successful AI-generated plan candidate is a runner record, even when the runner dislikes it
or never applies it. The runner wants a Progress-area library that can search, filter, and sort
these records; each row shows its title, created date, workout count, and other factual basics. A
runner can download a selected plan, hide/delete it from the ordinary library view, or choose
Apply. Applying asks whether to replace future workouts. Past workouts are never changed; a
workout with a FIT file is never changed without the runner's explicit `Delete training` action.
Plans are records of creation, not a current calendar controller.

## Product Decision

- A saved plan is an immutable library/provenance record. A plan does not become current and never
  governs, edits, removes, or relinks materialized workouts.
- Every successfully generated structured plan candidate is stored before the runner decides
  whether to apply it. Failed/invalid provider responses and non-plan AI features are outside this
  item; this rule covers running-plan candidates only.
- The library retains created, previous, and user-removed plan records. User Delete is logical
  removal/hiding: it affects only the plan record's library visibility, never Calendar workouts or
  their history. Removed records remain available to a filter and are not physically discarded.
- Each library row exposes the smallest useful factual summary: title, created date, schedule/date
  range when available, non-Rest workout count, and a non-authoritative record state/source label
  when available from existing data. Do not derive training claims that the data does not contain.
- The library supports simple title/goal text search, record-state/source filtering, and factual
  sort by creation date or title. This is ordinary database query behavior, not a search service,
  full-text infrastructure, or a second index unless real scale evidence later requires one.
- Download exports the selected saved-plan record, not an inferred current Calendar.
- Applying a library plan creates future calendar workouts using the runner's persisted schedule
  preferences and runner-local date. It never calls a provider or OpenAI.
- If the runner has future workouts, Apply requires an explicit replacement choice. Choosing
  `Replace future workouts` removes only eligible future schedule rows, then materializes the
  selected plan. Choosing not to replace makes no schedule mutation. There is deliberately no
  automatic merge, collision resolution, or heuristic reshuffling in this first slice.
- If there is no future schedule to replace, applying proceeds with the existing schedule/date
  alignment policy. It chooses the earliest compatible future runner-local start and may omit
  leading plan days rather than move workout types to arbitrary weekdays. Past, logged,
  FIT/evidence-backed, completed, skipped, comparison, feedback, and other protected workout truth
  remains untouched in every path.
- Applying a plan never mutates the selected library record. Any newly materialized plan record is
  provenance for that creation only and never becomes Calendar authority.

## Evidence

- [`plan_cycles`](../../../src/lib/active-plan-persistence.ts) is the existing persisted plan-record
  owner, while the completed Calendar correction makes materialized workouts runner-owned truth.
- The original `plan_cycles` schema has only `active`/`archived` state plus summary fields, while
  its `planned_workouts` rows are Calendar rows. It cannot preserve an exportable AI candidate that
  was generated but never materialized without either falsely making it active or writing Calendar
  workouts. This is the demonstrated distinct persistence invariant for one minimal saved-plan
  record/payload if no existing canonical payload owner is found.
- [`active-plan-export-actions.ts`](../../../src/lib/active-plan-export-actions.ts) and
  [`api.plan.export.tsx`](../../../src/routes/api.plan.export.tsx) already build private JSON or
  Markdown downloads, but currently resolve only `getActivePlan()`.
- [`plan-replacement-actions.ts`](../../../src/lib/plan-replacement-actions.ts),
  [`plan-apply-policy.ts`](../../../src/lib/plan-apply-policy.ts), and
  [`active-plan-lifecycle-actions.ts`](../../../src/lib/active-plan-lifecycle-actions.ts) are the
  existing authenticated apply, runner-calendar-date, and future-schedule seams to inspect before
  adding anything.
- [`RunnerCalendarTimezonePreference.tsx`](../../../src/components/settings/RunnerCalendarTimezonePreference.tsx)
  and runner calendar context already establish the runner-local date used for calendar decisions.
- There is no demonstrated user-facing library list. Existing `/api/plan/export` is active-plan
  only, so it cannot download a selected historical record.

## Observed Behavior

The product contains singular “Saved plan” and active-plan export/replacement paths. It does not
persist every generated candidate independently from Calendar materialization, and a runner cannot
browse, search, sort, filter, download, hide, or apply a selected record by its identity.

## Expected Behavior

A runner can eventually browse their saved AI plan records in Progress, search/filter/sort them,
download or hide a selected record, and explicitly apply one to an empty future schedule or replace
eligible future schedule rows after confirmation, without touching past or protected workout truth.

## Source Investigation

The existing read/export/apply pieces are real reusable seams. The source already proves that
`plan_cycles` plus materialized `planned_workouts` cannot retain an un-applied generated plan as an
exportable library record: that would either consume the single legacy `active` state or create
Calendar truth. Backend must first locate any existing canonical generated-plan payload owner. If
none exists, one small saved-plan record with the canonical plan payload is justified; it must be
the sole library record, not a plan subsystem or a copy of Calendar rows.

## Required Discriminator

For one authenticated local runner with more than one saved plan record, establish:

- whether an existing generated-plan payload already owns un-applied candidates; otherwise, prove
  that one saved-plan record/payload can preserve the canonical candidate without Calendar rows;
- whether selected library records yield the required factual summaries, search/filter/sort, and
  selected-record export;
- whether the existing import/apply and clear-upcoming lifecycle can apply a chosen record using
  runner-local date and saved schedule preferences without a plan becoming Calendar authority; and
- whether every protected past/evidence-bearing row remains unchanged through an explicit
  future-only replacement replay.

If any answer is no, name the exact missing invariant. One minimal migration is permitted only for
the demonstrated generated-but-unapplied plan-record invariant; do not infer a plan subsystem from
legacy `active` naming.

## What Not To Touch

- Do not reintroduce an active/current plan as Calendar owner, a second plan store, a scheduler,
  background job, merge engine, collision heuristic, state manager, compatibility layer, provider,
  or OpenAI call. One demonstrated canonical saved-plan record/payload is not a second store.
- Do not alter materialized Calendar workout ownership; never clone, relink, delete, or mutate
  past or protected logs/FIT assets/evidence/metrics/comparisons/feedback/completion truth as part
  of Apply or library removal.
- Do not build the Progress UI, a new Design System primitive, or broad Calendar redesign in the
  Backend slice. The later Frontend Product slice consumes only an honest backend-shaped contract.
- Do not access hosted or production data, stage, commit, push, deploy, call paid providers, or
  change unrelated dirty work.

## Validation Expectations

- Establish the required local source/persistence discriminator before writing.
- Reuse the smallest existing plan-record read/export/apply/runner-calendar seams. The only
  permitted new runtime artifact is one canonical saved-plan record/payload if no existing owner
  can retain an un-applied generated candidate; do not add plan-item tables, a second calendar,
  search infrastructure, or compatibility machinery.
- Prove authenticated ownership/RLS, generated-but-unapplied retention, logical removal,
  plan-list ordering/summaries/search/filter, selected-record private export, no-future apply,
  explicit replace-future apply, runner-local date/weekday alignment with permitted leading-day
  omission, and preservation of past/protected workout identities and dependent truth. Run only
  focused existing Backend checks.
- Use at most one bounded read-only persistence reviewer if it materially reduces risk; do not
  create a proof framework or a subagent ceremony. No Global QA or hosted/release claim.

## Next Recommended Role

product

## Backend Completion Receipt — 2026-08-10

- The preflight demonstrated `payload_owner_tables = 0`: `plan_cycles` had only factual summary
  fields, `planned_workouts` were Calendar truth, and the AI ledger explicitly retained no payload.
- Reuse-first change budget: existing `plan_cycles`, running-plan preview/confirm, reviewed
  persistence, plan apply policy, export route, request auth, and runner calendar context were
  reused. The only new artifact is the permitted migration
  `20260810114649_saved_plan_library_payload.sql`; it adds no table, second RPC, scheduler, store,
  provider path, or runtime file.
- Successful authenticated previews now retain the reviewed canonical payload before optional
  confirmation. Saved records are archived immutable provenance, expose factual list/search/filter/
  sort summaries, support logical removal and selected private export, and never materialize
  Calendar rows merely by being saved.
- Apply has explicit empty-future, replace-future, and keep-future intents. It uses runner-local
  date and current persisted schedule preferences, omits incompatible leading past days without
  weekday remapping, calls no provider, archives materialized provenance immediately, and rejects
  protected future truth without changing past workout/log/FIT/evidence identities.
- Database constraints, RLS, and the immutability trigger reject active saved records, direct
  authenticated saved-record insert/conversion, service-role conversion of existing plan rows,
  saved-record ID changes, and all immutable-field changes. Logical removal is the only supported
  record mutation.
- The existing `apply_reviewed_import_persistence` function remains the single reviewed import RPC.
  Its legacy mode preserves the existing import lifecycle; its saved-plan mode performs the new
  strict future-only apply. No competing persistence path remains.

| Check                     | Scenario / environment                                          | Result    | Evidence                                                                                                                                                                                                    |
| ------------------------- | --------------------------------------------------------------- | --------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator      | Local source plus live local schema                             | Passed    | No payload owner table existed; one `plan_cycles` payload invariant was required                                                                                                                            |
| Fresh migration           | `npx supabase db reset`                                         | Passed    | All migrations through `20260810114649` applied; no seed file                                                                                                                                               |
| Migration parity          | `npx supabase migration list --local`                           | Passed    | Local migration is applied                                                                                                                                                                                  |
| Live schema/privileges    | Docker-local PostgreSQL introspection                           | Passed    | Three payload/state columns, zero saved-plan tables, one reviewed import RPC, service-role execute only                                                                                                     |
| Focused persistence       | `validate-running-plan-engine-confirm.ts --require-persistence` | Passed    | 2 retained records, 0 unapplied Calendar rows, RLS/export isolation, removal, empty apply, replace, decline no-op, zero active provenance, protected-history refusal, provider calls 0, cleanup convergence |
| Product projection        | Existing generated-plan exact-key validator                     | Passed    | `savedPlanId` is an explicit supported projected field                                                                                                                                                      |
| Auth/export boundary      | Existing runner-auth validator                                  | Passed    | Selected private export plus safe public error mapping                                                                                                                                                      |
| Legacy reviewed import    | Existing manual-workout persistence check                       | Passed    | Legacy replacement remained independent and evidence was not relinked                                                                                                                                       |
| Production integrity      | `npm run build`                                                 | Passed    | Fresh client, SSR, and Nitro production build completed                                                                                                                                                     |
| Formatting/lint/diff      | Targeted Prettier, targeted ESLint, `git diff --check`          | Passed    | No findings                                                                                                                                                                                                 |
| Independent review        | One bounded read-only QA reviewer                               | Passed    | Initial DB invariant gap was fixed; final source/live-schema verdict passed                                                                                                                                 |
| Broad local Backend suite | `npm run validate:backend:local-db`                             | Not green | Checks 1–17 passed; check 18 fails because the retrospective design-profile fixture still requires exactly one `status = active` plan; check 19 did not run                                                 |
| Repository TypeScript     | `npx tsc --noEmit --pretty false`                               | Not green | Existing repo-wide errors remain; targeted output contains prior errors in untouched portions of `ai-generated-running-plan.ts` and `plan-apply-policy.ts`                                                  |

Omitted by scope: no Progress UI/browser library flow, hosted Supabase, provider/OpenAI transport,
deployment, staging, commit, push, or release parity. The stale design-profile active-plan fixture
must be realigned and the fail-fast checks 18–19 rerun before anyone claims the complete Backend
suite green. These omissions do not weaken the focused persisted library/apply proof, but they keep
Global QA Acceptance Pending.

## Original Backend Handoff

```text
ROLE: BACKEND

Mode: Tracked

Task: Persist every successful AI-generated running-plan candidate and establish the smallest
saved-plan library, selected-plan export, and future-only apply contract without restoring plan
authority over Calendar workouts.

Stage: Backend source-of-truth and persistence slice

Canonical work item:
docs/tasks/backlog/2026-08-10-saved-plan-library-and-future-apply.md

Product contract:
- A plan is an immutable library/provenance record. It never becomes a current Calendar owner.
- Every successful structured running-plan candidate is retained before the runner applies it or
  rejects it. Failed/invalid provider responses and non-plan AI work are out of scope.
- The library supports factual selected-plan summaries, private download, title/goal text search,
  record-state/source filtering, and factual creation-date/title sorting. User Delete is logical
  removal/hiding, not physical deletion; it never removes workouts and a removed record remains
  discoverable through the state filter.
- Apply uses the runner's existing schedule preferences and runner-local date; it calls neither a
  provider nor OpenAI. It never alters past or protected workout/FIT/evidence/completion truth.
- If future schedule rows exist, the caller must explicitly select `Replace future workouts`.
  Replacement removes only eligible future schedule rows and then materializes the selected plan.
  If replacement is declined, make no schedule mutation. Do not build a merge or alignment
  heuristic for an occupied calendar.
- If there is no future schedule, apply the selected record using the existing date/schedule policy:
  choose the earliest compatible future runner-local start and, when necessary, omit leading plan
  days rather than move workout types to arbitrary weekdays. Applying does not mutate the selected
  record and does not make it Calendar authority.

Evidence and required discriminator before code:
- `plan_cycles`, the completed runner-owned Calendar correction, active-plan export, existing
  plan-apply policy, lifecycle actions, and runner calendar context are existing seams.
- The export endpoint is currently active-plan only; a user-visible historical list has not been
  demonstrated. `plan_cycles` has only summary fields and `planned_workouts` are Calendar rows, so
  it cannot retain an un-applied, exportable candidate without falsely materializing it. First
  locate any existing generated-plan payload owner; if none exists, this is the demonstrated reason
  for one minimal canonical saved-plan record/payload.
- For an authenticated local runner with multiple records, prove the selected-record list/export
  and future-only apply can meet the policy without hidden relinking.

Required outcome:
- Supply a minimal authenticated backend-shaped contract for a later Frontend Progress library:
  selected-record identity, factual library summaries/search/filter/sort, and selected-record
  export/apply intent.
- Retain a successful generated candidate before optional application. Reuse an existing canonical
  payload owner if one exists; otherwise add exactly one minimal saved-plan record/payload. Do not
  add a plan-item table, duplicate Calendar rows, or a second store.
- Preserve runner-owned workout truth. Library removal affects only the plan record, never Calendar
  rows. Apply is explicit and future-only; protected truth is unchanged by identity and relation.
- Reuse existing read/export/apply/context seams. Expected new runtime artifacts: none. Before any
  exception, explain why an existing artifact cannot own that responsibility and what superseded
  active-plan path will be simplified or removed.

Scope and non-goals:
- Backend persistence, authenticated read/export/apply actions, existing focused validators, and
  this work-item lifecycle only.
- Do not implement Progress UI, confirmation dialogs, Design System work, Calendar interaction,
  providers, OpenAI, hosted access, or a new plan subsystem, RPC, scheduler, state store, merge
  engine, compatibility layer, or generic proof framework. A single canonical saved-plan record
  and its required migration are permitted only if the source discriminator confirms no existing
  payload owner can retain generated-but-unapplied plan truth.

Definition of Done:
- A successful generated plan candidate is retained independently from Calendar materialization. A
  runner can retrieve factual summaries of their own records, search/filter/sort them, logically
  remove one, and privately export a selected record through an existing-format download seam.
- Applying a selected record has an explicit empty-future or replace-future intent; it uses
  runner-local date/preferences and never lets a plan govern materialized workouts.
- No library or apply path changes past or protected workout/FIT/evidence/log/completion truth.
- The later Frontend needs only the returned contract; it does not reconstruct plan authority or
  make privileged persistence calls.

Focused proof:
- Start with the required authenticated local discriminator, then use existing focused persistence
  and RLS/readback checks. Verify generated-but-unapplied retention, logical removal, ordered
  summaries/search/filter, selected export isolation, empty future apply, explicit future
  replacement, runner-local weekday alignment with leading-day omission when required, and
  protected-history preservation.
- Run focused formatting/lint/build only as affected. One bounded read-only persistence review is
  permitted only when it materially improves confidence. Update this item to `in_progress` before
  task-owned writes and leave a compact truthful receipt. Do not claim Global QA or hosted/release
  parity.

Stop only for a demonstrated new product-policy decision or a contract that cannot be represented
through an existing canonical seam or the single demonstrated saved-plan record invariant. A desire
for a broad library UI, heuristic merge, a plan-item table, or an active-plan compatibility
workaround is not a reason to expand scope.

Authorization:
Routine local source work, loopback runtime/fixtures, focused validation, and safe bounded review
are authorized. Do not access hosted or production state, stage, commit, push, deploy, call paid
providers, or modify unrelated work.
```

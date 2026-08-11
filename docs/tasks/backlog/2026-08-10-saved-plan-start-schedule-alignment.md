# Saved Plan Start With Schedule Alignment

- **Work Item ID:** `saved-plan-start-schedule-alignment`
- **Status:** `completed`
- **Type:** `saved-plan-start-contract`
- **Priority:** `high`
- **Owner:** `backend`
- **Scope:** `saved-plan Start server contract and deterministic future-calendar schedule projection`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Backend schedule-aligned Start contract complete`
- **Next Recommended Role:** `product`

## Task

Extend the existing saved-plan Start path so a selected immutable saved record
can materialize a runner's future Calendar using an explicit start and a simple
runner-weekday alignment. This is a deterministic projection of an existing
plan into independent workouts, not a plan editor, current-plan lifecycle, or
new scheduling system.

## User Report / Product Decision

The runner needs a future Plans table with a Start action. Start must use the
runner's local date and preferences, may skip leading plan days when the chosen
start makes them unavailable, and can align rest days and a preferred long-run
day. It must never use OpenAI or providers.

The plan's weekly number of non-Rest workouts is fixed source content. Start
must **not** add/remove workouts to turn a four-day plan into five days, or the
reverse. The persisted `max_running_days_per_week` remains an upper-bound
validity constraint, not a target count to synthesize. Rest-day and long-run
choices decide weekday placement only.

Start defaults to the runner's persisted preferences. A Start request may carry
a one-time rest-day/long-run/start-date override; it governs only that
materialization and must not overwrite Settings. Permanent preference changes
remain Settings work.

## Evidence

- The completed [saved-plan library contract](./2026-08-10-saved-plan-library-and-future-apply.md)
  already owns immutable records, list/remove/export, runner-local date,
  future-only replacement protection, and a single persistence seam.
- [`prepareSavedPlanFutureApplyPolicy`](../../../src/lib/plan-apply-policy.ts)
  currently shifts an old plan by calendar week and then rejects fixed-rest or
  preferred-long-run conflicts. It does not yet project them onto compatible
  weekdays.
- [`mapImportedSeedAcrossAllowedWeekdays`](../../../src/lib/weekday-rest-invariants.ts)
  is the existing weekday projection seam to inspect before adding anything.
- [`applySavedPlanRecordForUser`](../../../src/lib/active-plan-persistence.ts)
  is the current selected-record materialization owner, but it is not exposed
  through the selected-record server-action module; list/remove already are in
  [`active-plan-export-actions.ts`](../../../src/lib/active-plan-export-actions.ts).

## Observed Behavior

Saved-plan Start is backend-capable but has no Frontend server action and only
accepts an intent. It does not accept a requested start or one-time scheduling
resolution. A preference conflict is rejected instead of being deterministically
aligned.

## Expected Behavior

1. A selected saved record has one authenticated Start server action alongside
   the existing list/remove actions. It reuses the existing selected-record
   apply and atomic future-calendar persistence seam; no new database RPC,
   table, store, or scheduler is added.
2. The action accepts only the existing replacement intent plus optional
   runner-local start date, fixed rest days, and preferred long-run day. Inputs
   are strict and validated server-side; omitted fields use persisted runner
   preferences and none of these one-time choices are saved to Settings.
3. Projection preserves each source week's ordered non-Rest workouts and count.
   It places them only on allowed weekdays, respects explicit fixed rest days,
   and places long runs on the chosen compatible preferred day. It may omit
   leading source days that precede the requested/earliest compatible future
   start. It must reject an impossible configuration plainly rather than merge,
   alter weekly frequency, create duplicate workouts, or invent a heuristic.
4. Existing future-calendar confirmation remains strict: `keep` is no-op,
   replacement requires the explicit replacement intent, and protected future
   truth is rejected untouched. Past/logged/FIT/evidence history is never
   changed. The immutable saved record remains byte-for-byte unchanged.
5. The response exposes only factual start receipt data needed by a later
   Frontend: resolved start, omitted leading day count, materialized workout
   count, and replacement outcome. It does not create a current/active plan.

## Source Investigation

The existing saved-plan apply policy explicitly avoids weekday remapping and
therefore validates preferred-long-run/fixed-rest conflicts as failures. The
first incorrect owner is Backend policy and server-contract exposure. A
Frontend table cannot truthfully implement Start options until this contract is
ready; it is the next phase, not part of this slice.

## Reuse-First Budget

Reuse `applySavedPlanRecordForUser`, `prepareSavedPlanFutureApplyPolicy`,
`mapImportedSeedAcrossAllowedWeekdays`, runner calendar context, persisted
runner preferences, existing selected-record server-action module, and atomic
future-calendar persistence. Expected new production runtime artifacts:
**none**. Do not add a table, migration, RPC, background job, schedule editor,
AI/provider call, persistence shape, or compatibility path.

## What Not To Touch

- The immutable library payload/list/remove/export contract or logical removal.
- Current-plan authority, Calendar workout ownership, manual editing,
  copy/paste/move, or past/FIT/log/evidence protections.
- Settings persistence, profile preferences, authentication/RLS, Design System,
  routes, the upcoming Plans UI, hosted systems, deployments, or unrelated
  dirty work.

## Validation Expectations

- Red-to-green local proof for a saved plan whose original weekday schedule
  conflicts with selected rest and long-run placement.
- Prove five source workouts per week remain five after projection; a source
  plan is never padded or reduced to match `max_running_days_per_week`.
- Prove runner-local date, explicit requested start, leading-day omission,
  one-time override non-persistence, rest/long-run placement, invalid/impossible
  rejection, empty-future start, explicit future replacement, keep no-op,
  protected history, record immutability, auth/RLS, and zero providers.
- Reuse focused existing validators where possible; run the complete local
  Backend DB suite, targeted static checks, and a production build. Browser,
  hosted, release, and Global QA are outside this Backend phase.

## Execution Preflight

- Reuse `prepareSavedPlanFutureApplyPolicy`,
  `mapImportedSeedAcrossAllowedWeekdays`, `applySavedPlanRecordForUser`, the
  selected-record server-action module, runner calendar context, persisted
  preferences, and atomic future-calendar persistence.
- New production runtime artifacts: **none**.
- Replace the saved-plan no-weekday-remapping and rejection-only rest/long-run
  branch with deterministic projection through the existing weekday seam.
- Focused proof covers realignable red-to-green behavior, source weekly count
  and order, explicit/default start, one-time override non-persistence,
  impossible/no-mutation boundaries, saved-record immutability, future replace
  protection, auth/RLS, provider isolation, full local Backend DB validation,
  static checks, and production build.

## Completion Receipt

- **Completed:** 2026-08-10
- **Implementation DoD:** Passed.
- **Product outcome:** The authenticated selected-record Start action now accepts
  strict replacement intent plus optional runner-local start, fixed-rest, and
  preferred-long-run inputs. It preserves each source week's ordered non-Rest
  workouts and count, materializes independent Calendar truth, and returns a
  factual receipt without creating active-plan authority or calling a provider.
- **Root-cause discriminator:** The prior policy shifted a saved seed by whole
  weeks and then rejected rest-day or long-run conflicts that were safely
  realignable. A deterministic Monday/Wednesday-rest plus Sunday-long-run replay
  failed before the change. The existing weekly projection seam now owns this
  alignment and rejects only impossible capacity/order combinations.
- **Changed canonical seams:** `mapImportedSeedAcrossAllowedWeekdays`,
  `prepareSavedPlanFutureApplyPolicy`, `applySavedPlanRecordForUser`, the
  selected-record action module, and the existing running-plan persistence
  proof. The superseded no-remapping/rejection-only branch was removed.
- **New production runtime artifacts:** None. No migration, table, RPC, provider
  path, scheduler, store, compatibility layer, or Frontend file was added.
- **Proof:** Deterministic five-workout projection passed; strict input,
  explicit/default start, leading omission, one-time preference
  non-persistence, impossible/no-mutation, keep/replace, protected-history,
  saved-record immutability, auth/RLS, and zero-provider checks passed against
  loopback Supabase. The full local Backend database suite passed all 19 checks;
  targeted formatting/lint/diff checks and a fresh production build plus build
  integrity validation passed.
- **Preserved boundaries:** The selected saved record remains immutable and
  non-active; runner Settings are unchanged by one-time choices; past/logged/FIT/
  evidence/comparison truth remains untouched; future replacement remains
  explicit and atomic.
- **Omitted acceptance:** Browser/Plans-table UI, hosted/deployment/release
  parity, and Global QA were not run or claimed. Product must route the later UI
  phase, and Global QA Acceptance remains pending.
- **Next owner:** PRODUCT for the Plans-table UI phase.

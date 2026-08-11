# Canonical Fixture Future-Materialization Contract Repair

## Work Item ID

2026-08-11-canonical-fixture-future-materialization-contract-repair

## Status

completed

## Type

backend-repair

## Priority

urgent

## Owner

backend

## Mode

Tracked

## Scope

Repair the two Backend truth failures that blocked final local Global QA: the generated-plan
persistence proof's stale row-count assumption and the design-profile fixture's invalid use of the
future-only reviewed-schedule persistence seam.

This is a backend fixture/validator/persistence-contract alignment task. It is not a redesign of
saved plans, Calendar, plan application, user-facing behavior, or the future-only protection.

## Stage

Backend Implementation DoD complete; fresh final Global QA remains the next independent stage.

## Next Recommended Role

qa

## Archive Intent

retain_in_place

## Task

Make canonical persisted truth, the generated-plan confirmation validator, and the runner
design-profile fixture agree with the current rule:

- a saved plan is immutable provenance/payload;
- Calendar rows are runner-owned materialized truth; and
- `apply_reviewed_future_schedule_persistence` accepts only reviewed rows dated on or after the
  runner-local `currentDate`.

The corrected proof must not claim that every canonical saved-plan row is necessarily materialized
when a supported leading-day omission applies. The corrected fixture must not submit historical
reviewed rows to the future-only seam merely to recreate a profile with past activity/FIT evidence.

## Global QA Failure Evidence

The failed Global QA receipt is in
[Current Release Candidate Final Global QA](2026-08-11-current-release-candidate-final-global-qa.md).

1. `scripts/running-plan-engine-confirm/persistence-proof.ts:180` asserts
   `persisted.workouts.length === draft.canonicalRowCount`. In the current contract the reviewed
   source may include a leading row before the runner-local materialization date. QA reproduced
   `55 !== 56` at this assertion.
2. `scripts/lib/runner-design-profile-fixture.ts:187-198` calls
   `materializeFirstReviewedPlanForUser` with a canonical plan that spans the as-of date and
   contains historical rows. That calls the current persistence boundary at
   `src/lib/active-plan-persistence.ts:137-172` and ultimately the current
   `apply_reviewed_future_schedule_persistence` rule, which truthfully rejects it as
   `Future schedule materialization accepts only reviewed future rows.`
3. The future-only rejection is not the bug. It is a required Calendar safety boundary and must
   remain enforced for Start/import/current user actions.

## Existing Seams To Reuse

- Generated-plan validator: `scripts/running-plan-engine-confirm/persistence-proof.ts`, especially
  the existing reviewed-draft confirm/readback assertions at `:164-214`.
- Canonical fixture: `scripts/lib/runner-design-profile-fixture.ts`, especially
  `createRunnerDesignProfilePlan` and its existing reset/seed/status/reseed lifecycle.
- Current runner-owned persistence owner:
  `src/lib/active-plan-persistence.ts:123-172` and
  `src/lib/active-plan-lifecycle-persistence.ts:68-128`.
- Current schema truth: `supabase/migrations/20260810132840_retire_active_plan_calendar_authority.sql`
  and `supabase/migrations/20260811125538_clear_calendar_future_workouts.sql`.

Before adding anything, trace the exact canonical historical fixture setup or completion path that
can legally establish retained past truth. Reuse it if it exists. If no existing owner can legally
represent the fixture's historical state, prove that constraint and stop for Product rather than
weakening the future-only RPC or inventing a second persistence path.

## Required Root-Cause Discriminators

Before the fix, reproduce both failures against the current local database:

- the precise source-row / materialized-row difference responsible for `55 !== 56`, including the
  runner-local date and leading omitted row; and
- the fixture payload's historical rows reaching the future-only RPC and its unchanged rejection.

After the fix, prove that a user-facing first-plan/Start attempt with a historical reviewed row is
still rejected by the same future-only contract. The fixture must not obtain its result by bypassing
or weakening that rule.

## Reuse-First Change Budget

- Reuse existing persistence, plan/Calendar entities, fixture lifecycle, and validators.
- Proposed new production runtime artifact: **none**.
- Proposed migration/RPC/table/provider/dependency/lockfile: **none**, unless a demonstrated
  existing-shape impossibility requires Product re-authorization.
- Remove/simplify the stale all-source-rows-equal-materialized-rows assertion and any obsolete
  fixture use of first-plan materialization for historical rows, if proven superseded.
- A large fixture rewrite, compatibility shim, direct database shaping, a second persistence RPC,
  or an assertion-only count change without source/readback evidence is out of scope.

## Definition Of Done

1. The validator distinguishes immutable saved-plan source row count from Calendar materialized row
   count and derives each expectation from the actual current date/leading-omission contract; it
   does not hard-code `55` or `56`.
2. The design-profile fixture converges reset → seed → status → reseed while preserving the intended
   `55 workouts / 30 activities / 11 matched / 19 unplanned` profile evidence and its historical
   FIT/readback facts.
3. The future-only schedule RPC still rejects historical user payloads with no mutation.
4. No active-plan authority, legacy replacement path, provider dispatch, raw-FIT loss, privacy
   regression, or retained acceptance-record mutation is introduced.
5. The stale Global QA failure is resolved by evidence, not skipped.

## Validation Expectations

| Check              | Required proof                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ |
| Red discriminators | Both QA failures reproduced before source changes with payload/date/readback evidence                                    |
| Validator contract | Generated-plan confirmation proof covers source versus materialized Calendar cardinality and leading omission            |
| Fixture lifecycle  | Local reset → seed → status → reseed; exact 55/30/11/19, completion, readback, and no accumulation                       |
| Protection         | Historical reviewed user payload still rejected by future-only persistence; no mutation                                  |
| Backend suites     | `npm run validate:backend:local-db` and `npm run validate:backend:runtime` complete, including previously skipped checks |
| Boundaries         | Retained FIT source/checksum/elevation and protected historical records preserved; provider dispatch remains zero        |
| Static/build       | Focused lint/format/diff and an uncontended production build if task-owned runtime source changes                        |

Record omissions truthfully. Do not claim final Global QA; its next run belongs to QA after this item
is complete.

## Execution Preflight — 2026-08-11

- **Mode / owner:** Tracked / Backend.
- **Outcome:** Align immutable saved-plan source cardinality, runner-local future materialization,
  and the canonical historical design-profile fixture without weakening the future-only schedule
  boundary.
- **Demonstrated cause:** Final local Global QA reproduced a stale source-equals-Calendar assertion
  (`55 !== 56`) and a separate fixture attempt to submit historical rows to the correctly
  future-only reviewed-schedule RPC.
- **Existing seams reused:** `prepareSavedPlanFutureApplyPolicy`, selected saved-record and
  materialized Calendar readback, `materializeFirstReviewedPlanForUser`, the runner calendar
  context's controlled instant input, and the existing reset/seed/status/reseed fixture lifecycle.
- **Change budget:** No new runtime artifact, migration, RPC, table, provider, dependency, lockfile,
  fixture framework, or compatibility path. Simplify the all-source-rows-equal-Calendar-rows
  validator assumption and the fixture's implicit attempt to materialize an old plan at today's
  runner date.
- **Focused proof:** Reproduce both failures before implementation; then prove derived source versus
  materialized counts, unchanged historical-row rejection/no mutation, exact `55 / 30 / 11 / 19`
  fixture convergence, full local DB/runtime suites, provider isolation, focused static checks, and
  a build only if task-owned production runtime source changes require it.
- **Stop boundary:** Stop for Product if the existing controlled runner-calendar context cannot
  legally represent the fixture's original materialization instant without exposing a
  client-controlled clock or changing the persistence shape.

## What Not To Touch

- No Frontend, Design System, product copy, route, or browser implementation change.
- Do not weaken or special-case `apply_reviewed_future_schedule_persistence` for the fixture.
- No migration, new RPC, direct SQL fixture shaping, hosted Supabase/Vercel action, provider call,
  deployment, commit, push, or deletion of retained FIT/history evidence.
- Preserve unrelated dirty work byte-for-byte and do not repair a separate QA/DS/browser issue.

## Exact Backend Handoff

```text
ROLE: BACKEND

Mode: Tracked
Task: Repair the canonical fixture/validator alignment that failed final local Global QA.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-canonical-fixture-future-materialization-contract-repair.md`

Read `AGENTS.md`, `agents/backend.agent.md`,
`skills/hito-backend-supabase-contract/SKILL.md`, the complete canonical item, and the failed QA
receipt in:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-current-release-candidate-final-global-qa.md`
before the first task-owned write or fixture mutation.

This is a narrow Backend repair. Reproduce both documented red discriminators first. The current
future-only reviewed schedule rejection is correct and must remain: do not weaken it, add a
fixture-only RPC, direct-SQL shape data, reintroduce active-plan authority, or alter Frontend/DS.

Find the existing legal canonical path for historical fixture truth. Make the validator distinguish
saved-plan provenance rows from Calendar-materialized rows whenever leading-day omission applies;
derive the expectation from the runner-local date and actual contract rather than hard-coding a
count. Make the design-profile lifecycle converge through that legal path while retaining exact
55/30/11/19 historical FIT/readback evidence.

Reuse existing seams. Proposed new runtime artifacts, migrations, tables, RPCs, providers,
dependencies, and lockfile changes are none. If no current canonical path can establish the fixture
truth legally, stop after proof and report the minimum Product decision rather than extending the
persistence model.

Run the required red/green discriminators, fixture reset→seed→status→reseed, the complete local DB
and runtime suites, focused static checks, and an uncontended build when source changes require it.
Preserve retained FIT/history evidence and providers-off boundaries. Use a bounded independent
read-only reviewer only if it materially helps validate the fixture/persistence contract; do not
delegate implementation.

Use Russian in-progress commentary. Append an English tracked implementation receipt to the item
with `Check | Scenario / environment | Result | Evidence`, omitted-check consequences, next owner
QA, and no Global QA claim. Do not stage, commit, push, deploy, apply hosted migrations, or touch
Vercel.
```

## Backend Tracked Implementation Receipt — 2026-08-11

### Task and stage

- **Task:** Repair the canonical fixture/validator alignment that failed final local Global QA.
- **Mode / owner:** Tracked / Backend.
- **Implementation status:** Completed.
- **Global QA Acceptance:** Pending; not claimed by this receipt.

### Product outcome and root-cause discriminator

The current future-only schedule protection remains unchanged. The repair separates immutable
saved-plan source truth from runner-local Calendar materialization truth and recreates the canonical
historical fixture through the existing server-controlled runner-calendar instant seam.

Before implementation, the generated-plan persistence proof reproduced a saved source of 56 rows
and a runner-local `2026-08-11` Calendar materialization of 55 rows. The policy reported one leading
omission: source workout `ai-plan-first-easy-aerobic-run-2026-06-08`, which would align to
`2026-08-10`, before the runner-local date. The design-profile replay separately reproduced the
unchanged `invalid_input` rejection because its historical rows reached the future-only RPC.

The validator now reads the selected immutable saved record, obtains the runner-local date and
persisted schedule preferences, and independently derives expected Calendar rows through
`prepareSavedPlanFutureApplyPolicy`. Source export assertions remain on the selected saved-plan
export; Calendar export assertions remain on materialized rows. No count is hard-coded.

The design fixture now supplies its original plan-start instant only to the existing internal
materialization helper. Normal callers provide no instant and continue to derive the actual
authenticated runner date. A direct historical-row persistence proof still receives
`invalid_input` with no plan/workout mutation.

### Files changed

- `scripts/running-plan-engine-confirm/persistence-proof.ts` — derives source/materialized
  cardinality, keeps source-export truth on the saved record, proves historical rejection and
  cleanup, and makes the impossible-schedule no-op discriminator date-independent.
- `scripts/validate-running-plan-engine-confirm.ts` — reports saved-source rows, materialized rows,
  omitted rows, and runner-local date.
- `scripts/lib/runner-design-profile-fixture.ts` — uses the reviewed plan's historical start instant
  through the existing runner-calendar context before the ordinary atomic persistence seam.
- `src/lib/active-plan-persistence.ts` — accepts an internal optional calendar instant for the
  existing materialization helper and fixes the directly dependent idempotent saved-candidate
  comparison to use `input.canonicalPlan`.
- `docs/tasks/backlog/2026-08-11-canonical-fixture-future-materialization-contract-repair.md` —
  lifecycle, preflight, and this receipt.

No migration, RPC, table, fixture framework, compatibility layer, provider, dependency, lockfile,
Frontend, Design System, hosted, or Vercel artifact was added or changed by this task.

### Preserved boundaries

- `apply_reviewed_future_schedule_persistence` still rejects rows before the supplied server-derived
  runner date.
- Saved records remain immutable provenance; materialized workouts remain runner-owned Calendar
  truth; active authority remains zero.
- The canonical profile remains exactly 55 workouts, 30 activities, 11 matched, and 19 unplanned,
  with 11 FIT completions and zero future FIT completions.
- Provider dispatch stayed zero; the runtime used loopback `qa_fixture` mode.
- Gate 5 remains `normalized_stream_not_persisted`; raw private fields remain absent from Product
  readback.
- The retained FIT acceptance record remained available at 80,050 bytes with SHA-256
  `bb2737da162532126808613d6ae7a69655b5175be0964a3311f60d89c2bc58d6`, 25 m elevation gain,
  5.11 km, 45.16 min, and its planned-workout match intact.

### Validation inventory

| Check                          | Scenario / environment                                                        | Result     | Evidence                                                                                                                                                           |
| ------------------------------ | ----------------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Red discriminator: cardinality | Loopback disposable Supabase, pre-fix focused confirm persistence             | Reproduced | `55 !== 56`; source 56, runner date `2026-08-11`, materialized 55, one leading omission                                                                            |
| Red discriminator: fixture     | Canonical `qa-saved-plan` reset then pre-fix seed                             | Reproduced | Future-only RPC returned `CalendarPersistenceRejection` / `invalid_input`; reset returned all owned counts to zero                                                 |
| Source/materialized validator  | Focused confirm persistence after repair                                      | Passed     | Saved-source and Calendar counts are derived through the current policy; representative 56 → 55 and 364 → 363 cases reported one omission and zero cleanup residue |
| Historical protection          | Atomic reviewed-plan persistence, row `2026-07-19`, current date `2026-07-20` | Passed     | Same `invalid_input` rejection; no plan/workout row persisted                                                                                                      |
| Saved-source export            | Personal HR source row omitted from current Calendar projection               | Passed     | Selected private saved-plan export retained the `121-130 bpm` subrange and parent `116-135 bpm` band; Calendar export asserted only materialized truth             |
| Fixture lifecycle              | Reset → seed → status → reseed → status                                       | Passed     | Stable `55 / 30 / 11 / 19`; one saved record, one materialized provenance, zero active authority, no row accumulation                                              |
| Fixture completion/readback    | Local DB status                                                               | Passed     | 11 matched = 11 FIT-completed; zero future FIT completion; 30 assets; 11 metrics; 11 comparisons; retained raw source reprocessable                                |
| Fixture runtime status         | Fresh managed `qa_fixture` at `http://127.0.0.1:3000`                         | Passed     | Authenticated pages `20 + 10`; unauthenticated 401; Gate 5 unavailable reason truthful; no raw private fields                                                      |
| Full Backend local DB suite    | `npm run validate:backend:local-db`                                           | Passed     | 20/20 checks, including all checks previously omitted by fail-fast                                                                                                 |
| Full Backend runtime suite     | `npm run validate:backend:runtime -- --runtime-url=http://127.0.0.1:3000`     | Passed     | 17/17 checks, including the formerly failing runtime design-profile path                                                                                           |
| Production build               | Uncontended canonical managed rebuild                                         | Passed     | Client, SSR, Nitro, postbuild, fresh artifact receipt, and healthy loopback start passed; standard chunk/directive warnings were non-gating                        |
| Retained FIT guard             | Read-only local acceptance-record readback                                    | Passed     | Raw state available; bytes/checksum/elevation/distance/duration and planned match exactly preserved                                                                |
| Provider/hosted safety         | Whole execution                                                               | Passed     | Provider calls 0; loopback only; no hosted access, migration application, Vercel action, dependency mutation, stage, commit, push, or deploy                       |
| Focused static checks          | Task-owned TypeScript/Markdown and whole diff                                 | Passed     | Targeted Prettier, targeted ESLint, `git diff --check`, zero stale source-equals-materialized assertions, and unchanged future-only rejection search               |
| Independent review             | Reused bounded QA reviewer, read-only                                         | Passed     | No contract defect found; controlled instant is internal-only, expectations reuse canonical policy, and fixture/profile boundaries remain intact                   |

### Omitted checks and consequences

- Browser and cross-surface final Global QA were not run. Backend Implementation DoD is complete,
  but the release candidate still requires the fresh QA-owned acceptance run.
- Hosted Supabase parity, Vercel deployment, production, release validation, commit, and push were
  outside this task. No hosted or release readiness is claimed.
- Dependency/advisory checks were not run and package state was not changed; dependency risk is not
  covered by this receipt.

### Ownership and next step

Role file: `agents/backend.agent.md`.

Skills used: `skills/hito-backend-supabase-contract/SKILL.md` and the mandatory installed Supabase
procedure.

Subagent reused: the existing `fixture_alignment_qa` agent performed one bounded independent
read-only source/static review; it made no edits or state mutations.

Next owner: **QA**, to rerun the final local Global QA acceptance inventory against this completed
Backend repair. No blocker remains in the Backend slice.

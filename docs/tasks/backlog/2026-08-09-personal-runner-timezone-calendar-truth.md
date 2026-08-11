# Personal Runner Timezone Calendar Truth

## Work Item ID

2026-08-09-personal-runner-timezone-calendar-truth

## Status

ready

## Type

bug

## Task

Make the runner's calendar date a persisted, validated personal IANA timezone contract so each
authenticated user sees and mutates their own local day, independent of server, UTC, or another
user's timezone.

## Stage

Backend Implementation DoD passed — owner-level independent QA passed; Global QA Acceptance
pending.

## Execution Preflight

- **Outcome:** persist and validate one IANA timezone per authenticated runner, derive the runner's
  current date server-side, and reuse that date across snapshot, lifecycle, mutation, and Activity
  defaults while a bounded Frontend Product consumer initialises and updates the same preference.
- **Root-cause discriminator:** at fixed instant `2026-08-09T23:30:00Z`, the unchanged
  `todayIso()` returned `2026-08-09` under `TZ=America/Sao_Paulo` and `2026-08-10` under
  `TZ=Asia/Tokyo`; its result follows the deployment process timezone rather than runner identity.
- **Owner and boundary:** Backend owns profile persistence, validation, server calendar context,
  generated database types, and date-sensitive policy injection. Frontend Product may change only
  the authenticated timezone capture/settings consumer on disjoint files. Historical activity
  timezone, date-only persisted facts, auth/RLS, providers, hosted data, and Design System remain
  unchanged.
- **Proof:** deterministic two-zone and DST source replay, invalid-zone rejection, local profile
  persistence/readback and auth isolation, affected date-decision agreement, local migration and
  Backend checks, fresh build/integrity, and independent runtime/browser review.
- **Stop boundary:** stop only for a demonstrated Product policy/contract conflict or a required
  owner change outside the bounded Frontend consumer; do not manufacture a result through host
  clocks, manual database shaping, hosted services, or weakened assertions.

## Issue Category

calendar_truth_defect

## Severity

high

## Priority

urgent

## Human Priority

urgent

## Owner

backend

## Scope

personal-runner-timezone-calendar-truth

## Archive Intent

retain_in_place

## Reported

2026-08-09

## User Report

The runner is still on Sunday, 2026-08-09, while Hito already treats the calendar as Monday. The
product must use each user's own timezone rather than a global clock.

## Evidence

- [todayIso](../../../src/lib/training.ts:1503) derives `YYYY-MM-DD` from `new Date()` and the host
  process locale. It receives no user or timezone input.
- [persisted snapshot](../../../src/lib/training-api.ts:393) uses that global value as `currentDate`,
  which drives workout status, calendar presentation, editing eligibility, and week status.
- The generated [`runner_profiles` row](../../../src/lib/supabase/database.ts:340) has no timezone
  field, and [UserSettingsSummary](../../../src/lib/user-settings-actions.ts:38) exposes none.
- Historical activity timezone is separate evidence attached to an individual imported activity; it
  is not the runner's current calendar timezone.

## Observed Behavior

At a date boundary, the product can call tomorrow `Today`, mark Sunday's workout as past, or make
Monday rules active for a runner whose local date is still Sunday. Server-side schedule mutations can
make the same incorrect calendar-day decision.

## Expected Behavior

Every authenticated runner has one validated IANA timezone that determines their current calendar
date. At the same instant, different users may legitimately have different local dates. The same
user's snapshot, calendar, workout lifecycle, schedule mutations, plan creation/clearing, and
date-bounded Activity defaults agree on that local date across DST transitions and independent of
the server's timezone.

## Source Investigation

`todayIso()` is a host-clock helper used throughout Backend-owned request and mutation seams. Its
value flows directly into `getPersistedSnapshot()` and into active-plan persistence, schedule
editing, manual authoring, lifecycle operations, Activity read-model defaults, and facts. The
profile persistence contract has no personal timezone, so the server cannot derive a correct runner
day. This is a canonical Backend calendar-context defect, not a Calendar rendering, AppShell, or
single-route defect.

## Likely Root Cause

Confirmed: calendar-sensitive Backend work relies on one host-process local date instead of a
persisted user-specific timezone and derived local date.

## Product Contract

- The canonical preference is a validated IANA timezone owned by the authenticated runner profile.
- A browser/device timezone may initialise or update that preference only through the authenticated
  profile contract; the server must validate it and remain the canonical date resolver.
- Existing profiles need a deterministic, explicit fallback/recovery path rather than silently
  inheriting the deployment machine timezone forever.
- Planned workout dates remain date-only runner-calendar facts. Do not reinterpret historic plan or
  activity dates merely because this current-day policy changes.
- Imported activity `historical_timezone` and `local_date` remain historical evidence, not a
  substitute for the runner profile timezone.

## What Not To Touch

- Do not solve this with client-only calendar formatting, a per-route `Date` workaround, or a fixed
  project timezone.
- Do not rewrite immutable migrations, silently shift persisted workout dates, weaken auth/RLS, or
  mutate hosted/production data.
- Do not change provider contracts, Gate 5 truth, AI behavior, Design System primitives, or unrelated
  DevTools work.

## Definition Of Done

At one controlled instant near midnight, a runner in `America/Sao_Paulo` still receives
`2026-08-09` while a runner whose local date is Monday receives Monday. All date-sensitive
authenticated Backend decisions for each runner agree with that runner's canonical timezone, and
the product has an authenticated path to establish and change the preference without trusting an
unvalidated arbitrary value.

## Validation Expectations

- Establish a deterministic red replay for the Sunday/Monday boundary and prove the fixed contract
  for at least two valid IANA zones, including a DST-sensitive case.
- Verify snapshot `currentDate`, Calendar/Workout lifecycle status, plan create/apply/clear, schedule
  edit or manual-authoring date gates, and Activity read-model/fact defaults use the same per-user
  date context where they are in scope.
- Verify profile persistence/readback, validation of invalid zones, auth/RLS isolation, existing-user
  fallback/recovery, and no shift of planned or historical date-only facts.
- Use bounded Frontend Product and QA subagents where their independent client-capture or browser
  evidence materially helps. Run focused local Supabase and runtime checks, then a proportional
  authenticated browser proof. This item is not Global QA Acceptance or hosted release parity.

## Backend Completion Receipt

Completed on 2026-08-10. Backend Implementation DoD is **Passed**; Global QA Acceptance remains
**Pending**.

### Product Outcome

Each persisted runner profile now carries one database-validated IANA calendar timezone and source.
The authenticated server derives `currentDate` from that preference and reuses it for snapshots,
plan/lifecycle policy, schedule edits, manual workout authoring, and Activity defaults. Existing
profiles recover explicitly as `UTC` / `fallback_utc`; an authenticated onboarding runner without a
profile is initialized through the same server action. Browser initialization is one-shot and
compare-and-set, while explicit Settings choices remain authoritative.

### Root-Cause Discriminator

Before the fix, fixed instant `2026-08-09T23:30:00Z` produced `2026-08-09` or `2026-08-10` from the
same `todayIso()` call solely by changing the host process timezone. After the fix, two disposable
runners at that instant resolve São Paulo to Sunday and Tokyo to Monday from their persisted
profiles; browser QA reproduced the same Sunday/Monday split through ordinary Settings saves on one
fresh loopback runtime.

The live rollover to 2026-08-10 also proved the fixture-preservation discriminator: the prior
minimum-only alignment produced 12 matched / 18 unplanned activities and the strict named lifecycle
rejected it. The canonical helper now demotes only surplus oldest matches to a free non-plan date in
the same calendar week, fills only same-week deficits, and hard-asserts the exact accepted 11/19
split. Reset, seed, and reseed then converged without accumulation on the new runner-local day.

### Files And Canonical Seams

- Added one append-only migration, generated profile types, and the shared
  `runner-calendar-timezone` / server `runner-calendar-context` seams.
- Extended the existing authenticated profile action and snapshot projection; no route-local clock,
  parallel date model, or unvalidated client authority was added.
- Injected the runner date into the existing plan, schedule, manual-authoring, lifecycle, and
  Activity owners. Date-only workouts and imported activity dates were not shifted.
- Frontend Product subagent added one AppShell bootstrap and one Settings section using existing
  components and styles. Backend retained canonical validation, persistence, and date derivation.
- Existing deterministic fixtures now persist their process-zone preference through the ordinary
  settings contract, preserving their intended date-relative facts without weakening assertions.

### Validation Inventory

| Check                                 | Scenario / environment                                                          | Result | Evidence                                                                                                                                                                             |
| ------------------------------------- | ------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Red discriminator                     | Fixed instant under `TZ=America/Sao_Paulo` and `TZ=Asia/Tokyo`                  | Passed | Pre-fix `todayIso()` followed the host and returned different dates for the same instant                                                                                             |
| Timezone source contract              | `npm run validate-runner-calendar-context`                                      | Passed | São Paulo/Tokyo midnight split, alias canonicalization, invalid-zone rejection, DST repeated-hour case, and authenticated host-clock source inventory                                |
| Local persistence contract            | `npm run validate-runner-calendar-context:local`                                | Passed | UTC fallback, profile/no-profile initialization, two-user snapshots, invalid app/DB writes, browser CAS, RLS isolation, Activity agreement, date-only preservation, cleanup          |
| Migration application                 | Local Supabase CLI `migration up` and `migration list --local`                  | Passed | `20260810022136_runner_calendar_timezone` is applied in local migration history                                                                                                      |
| Schema integrity                      | `supabase db lint --local`                                                      | Passed | No schema errors                                                                                                                                                                     |
| Complete local Backend database suite | `npm run validate:backend:local-db`                                             | Passed | Source + local DB suite passed all 19 checks; disposable persistence and cleanup converged                                                                                           |
| Complete loopback runtime suite       | `npm run validate:backend:runtime`                                              | Passed | Source + runtime suite passed all 17 checks                                                                                                                                          |
| Rollover fixture discriminator        | First 2026-08-10 named seed before exact-cap fix                                | Red    | Strict readback rejected 12 matched / 18 unplanned rather than hiding the surplus match                                                                                              |
| Canonical fixture lifecycle           | 2026-08-10 reset-to-zero, seed, reseed, and named status                        | Passed | 1 active plan, 55 workouts, 30 activities, exact 11 matched / 19 unplanned, completion 11/11/0, source 27/1/2, no accumulation                                                       |
| Privacy / provider / Gate 5           | Named status, runtime logs, request-auth suite                                  | Passed | Unauthenticated 401; raw private fields absent; provider identifiers null; Gate 5 remains `normalized_stream_not_persisted`                                                          |
| Fresh production artifact             | `npm run local:fixture`; build post-step; `validate-build-output-integrity.mjs` | Passed | Fresh compatible build; integrity digest recorded; managed runtime healthy on `127.0.0.1:3000` in `qa_fixture` mode                                                                  |
| Desktop personal-day behavior         | Safari, authenticated `qa-saved-plan`                                           | Passed | São Paulo/user showed Sunday Aug 9; Tokyo/user showed Monday Aug 10 after ordinary save and reload; invalid IANA preserved Tokyo; ordinary restore returned Sunday                   |
| Exact 375px behavior                  | Safari Responsive Design Mode, 375×812                                          | Passed | Settings source/readback and restored Sunday Calendar contained with no horizontal overflow                                                                                          |
| Bootstrap and race ownership          | Source review plus local persistence proof                                      | Passed | Only `fallback_utc` bootstraps; per-mount/session dedupe; stale browser write cannot replace browser/user choice; missing-profile insert handles unique race through the same action |
| Static integrity                      | Targeted Prettier, ESLint, and `git diff --check`                               | Passed | All supported task-owned files formatted; no lint or whitespace findings                                                                                                             |

### Omitted Checks And Consequences

- Repo-wide `tsc --noEmit` remains red on pre-existing broad router/search and unrelated source
  errors. Filtered output contained no error in the new timezone modules/component; the fresh
  production build and targeted lint are green, but this task does not claim a repo-wide TypeScript
  baseline repair.
- A full local `supabase db reset` was not run. The new migration was applied incrementally, listed,
  linted, and exercised by the full local database suite; no from-zero migration replay is claimed.
- QA did not manually shape or independently browser-create a missing-profile runner. That edge has
  deterministic local persistence proof and independent source review, not a second browser proof.
- Built-in browser was unavailable; Safari supplied the complete authenticated desktop and exact
  375px interaction matrix. Chrome was not used.
- Hosted Supabase, paid providers, deployment, production, staging, dependency state/advisories,
  commit, and push were not touched. No hosted, release, or Global QA claim follows.

### Independent Review And Subagents

- `FRONTEND Product` subagent `timezone_frontend` was used, reused for the authenticated no-profile
  follow-up, integrated, and closed. It changed only the approved three-file Product boundary and
  spawned no subagents.
- `QA` subagent `fixture_alignment_qa` was reused for independent source/runtime/browser evidence,
  reused again for the date-rollover exactness review, then closed with Verdict **Passed**. Its
  evidence is under
  `qa-artifacts/screenshots/2026-08-09/personal-runner-timezone-calendar-truth/`; it spawned no
  subagents.
- No ARCHITECT subagent was used because no canonical-owner or Product-contract ambiguity remained.

### Preserved Boundaries

Auth/RLS ownership, persisted date-only plan/activity facts, provider/AI/Gate 5 truth, Design System,
hosted data, dependencies, lockfiles, recovery material, staging, commits, pushes, and deployment
remain unchanged. Concurrent dirty work outside this task was preserved.

## Next Recommended Role

qa

## Exact Handoff Prompt

```text
ROLE: QA

Mode: Tracked

Task: Personal Runner Timezone Calendar Truth

Stage: Resume Global QA Acceptance after Backend Implementation DoD

Canonical work item:
docs/tasks/backlog/2026-08-09-personal-runner-timezone-calendar-truth.md

Validate the completed personal runner timezone contract as the separate Global QA gate. Reuse the
fresh loopback `qa_fixture` runtime and the exact Backend receipt in the canonical item. Exercise the
cross-flow authenticated Calendar, workout lifecycle, Activity, plan/schedule/manual-authoring date
decisions, existing-user fallback/recovery, invalid-zone persistence, auth/privacy/provider
boundaries, and exact 375px behavior proportionate to release risk. Preserve the canonical
`qa-saved-plan` profile and restore any ordinary UI preference mutation. Do not use hosted Supabase,
paid providers, dependency mutations, staging, commit, push, or deployment. Record Global QA
Acceptance truthfully in this same item; do not infer hosted or release parity.
```

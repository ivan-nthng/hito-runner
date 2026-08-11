# Canonical Local Runner Design Profile Fixture

## Work Item ID

2026-08-04-canonical-local-runner-design-profile-fixture

## Status

completed

## Stage

Global QA Acceptance passed — local qa_fixture ready for Product review

## Exact Handoff Prompt

```text
ROLE: QA

Task:
Resume and complete Global QA Acceptance for the canonical local runner design profile after the
Backend matched-completion coherence repair.

Stage:
Global QA Acceptance resume. Backend Implementation DoD is passed; Global QA remains pending.

Required outcome:
Independently prove one coherent Product truth across Calendar, workout detail, Activity History,
and Progress at desktop and exact 375 px, plus deterministic reset/seed/reseed convergence. Preserve
the local qa_fixture, authentication/privacy, source-lifecycle, Gate 4, Gate 5, provider-isolation,
loopback-only, dirty-worktree, dependency, recovery, and hosted boundaries. Use one bounded
independent read-only browser subagent and integrate its executed-test inventory. Update only the
canonical Global QA lifecycle and receipt, then report Global QA Acceptance as Passed, Failed, or
Pending from complete local evidence.

Approval policy:
Routine local inspection, managed loopback runtime control, fixture lifecycle, browser QA, and
bounded subagent work proceed under standing authorization. Do not access hosted Supabase, call paid
providers, mutate dependencies, delete recovery material, stage, commit, push, or deploy.
```

## Previous Backend Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Restore one coherent completed-workout truth for the canonical local runner design profile and close
the Backend-owned gate that failed Global QA Acceptance.

Stage:
BACKEND fix-forward after Global QA Acceptance failure.

Canonical work item:
/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-04-canonical-local-runner-design-profile-fixture.md

Product problem:
The same matched past run currently tells two incompatible stories. Activity History identifies the
2026-07-27 activity as planned `Easy Run`, while Calendar and workout detail show that planned
workout as `Skipped` / `Not logged yet` and offer result-upload actions. This makes the local
`qa_fixture` profile unsuitable for user-facing Product review even though its broad Calendar,
History, Progress, source-lifecycle, privacy, Gate 4, and Gate 5 coverage otherwise passed.

Root cause and architecture fit:
Global QA established that the fixture persists activity-to-planned-workout matches without the
complete canonical FIT completion projection required by the ordinary Product readback. The first
incorrect owner is Backend fixture/persistence projection, not Frontend: product consumers render
the status returned by the Backend contract. The named status lifecycle also reports the accepted
55-workout, 30-activity, 11-matched, and 19-unplanned profile without strictly enforcing all four
values. Reuse the existing canonical completion and fixture/readback seams; do not create a second
fixture, Product-side fallback, mock response, or parallel completion truth.

Read before changing code:
- /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-04-canonical-local-runner-design-profile-fixture.md
- /Users/ivan/Developer/hito-running/scripts/lib/runner-design-profile-fixture.ts
- /Users/ivan/Developer/hito-running/scripts/validate-runner-activity-read-models.ts
- /Users/ivan/Developer/hito-running/src/lib/training-api.ts
- /Users/ivan/Developer/hito-running/src/lib/workout-result-import/read-workout-result-feedback.ts
- /Users/ivan/Developer/hito-running/supabase/migrations/20260805174650_finalize_planned_workout_fit_completion.sql
- /Users/ivan/Developer/hito-running/qa-artifacts/screenshots/2026-08-09/canonical-local-runner-design-profile-global-qa-resume/

Scope and preserved boundaries:
- Every accepted matched past activity must have the ordinary completed Product readback on Activity
  History, Calendar, and workout detail; future workouts remain planned-only.
- Preserve the supported Product DTO and privacy boundary, the existing authenticated fixture
  identity and 30-activity corpus, one active 55-workout plan, exact 11 matched / 19 unplanned
  split, source lifecycle states, Gate 4 facts, Gate 5 `normalized_stream_not_persisted`, loopback
  operation, provider isolation, and reset/reseed convergence.
- Treat frontend routes, components, styles, Hito DS, authentication behavior, providers, hosted
  Supabase, deployment, dependencies, lockfiles, recovery material, staging, commits, and pushes as
  out of scope. Inspect consumers read-only. If a required consumer contract is truly inconsistent,
  stop with evidence and return the exact owner boundary rather than changing Frontend code.

Autonomous execution:
Publish the mandatory Execution preflight and update this canonical item to `in_progress` before the
first task-owned write. Complete the owner-scoped investigation, implementation, validation, and
fix-forward loop without sending routine work back to Product or the user. Use a small reusable
subagent pool: require one independent role-prefixed QA subagent for browser/persistence
cross-surface evidence, and use an ARCHITECT read-only subagent only if a genuine canonical-owner or
contract ambiguity appears. Keep all subagent scopes bounded, reuse them for follow-ups, integrate
their evidence, and close them before the final report.

Definition of Done:
The fixture produces one coherent persisted truth: every accepted matched past activity is completed
wherever the product presents that workout, while unplanned activities and future planned workouts
remain truthful. The named status lifecycle rejects any drift from the exact accepted 55 / 30 / 11 /
19 profile. The canonical fixture remains deterministic and convergent after its named lifecycle.

Required proof:
Establish the red-to-green root-cause discriminator; verify the exact persisted fixture profile and
completion coherence across History, Calendar, and workout detail at desktop and exact 375px; run the
named reset-to-zero, seed, reseed, and no-accumulation lifecycle; and complete the relevant Backend
source/local-DB/runtime and fresh build/integrity checks. The QA subagent must independently exercise
the cross-surface result and provide its executed-test list. Preserve the unauthenticated/privacy and
provider-isolation discriminators. In the final integrated report, include the complete
`Check | Scenario / environment | Result | Evidence` inventory, all omitted checks with coverage
consequences, subagents used/reused/closed, and the truthful canonical work-item lifecycle state.

Stop conditions:
Stop only for a demonstrated Product DTO, frontend-consumer, auth, provider, hosted/deployment, or
schema/migration ownership boundary that cannot be resolved inside this Backend fixture/persistence
slice. Do not weaken status assertions or manufacture a passing state with manual database shaping.
Do not claim Global QA Acceptance passed; after Backend Implementation DoD, record the exact residual
Global QA gate truthfully.

Approval policy:
Routine local inspection, loopback fixture lifecycle, implementation, validation, canonical-item
lifecycle updates, and bounded subagent work proceed under standing authorization. Do not stage,
commit, push, deploy, call paid providers, access hosted Supabase, mutate dependencies, or delete
recovery material.
```

## Type

change_request

## Priority

high

## Owner

qa

## Next Recommended Role

product

## Scope

local-qa-feature-fixture

## Archive Intent

retain_in_place

## Task

Provide one permanent, loopback-only, deterministic runner design profile that makes the local
Calendar, workout detail, Activity History, and Progress surfaces useful for Product and design
review without using a real runner, an AI provider, or Product-side mocks.

## User Outcome

The existing managed `qa_fixture` server and its existing authenticated runner session remain
unchanged. Within that accepted session, the local reviewer sees the canonical design profile rather
than an empty or legacy calendar. If the reviewer deleted its active plan, the ordinary Create Plan
flow accepts the normal form input, shows the real loading/review behavior, and deterministically
creates the QA plan without calling an AI provider. The entered runner details are interaction input,
not a claim that this fictional plan is personalised coaching.

The resulting active calendar is a coherent, date-current two-month fictional programme that includes
past and future dates. It has rest, recovery, easy, interval, tempo, long-run, and other
already-supported workout structures with realistic sections. Its historical planned days reconcile
with a substantial canonical FIT-backed runner record; its future days remain planned only. Activity
History and Progress show the corresponding persisted running facts.

The profile is fictional but functional: all visible data flows through the ordinary plan, workout,
FIT parser, activity/source/revision, History, and Progress seams. It is not a visual fallback or a
second product model.

## Fixture Lifecycle

1. The designated local QA runner may have no active plan after the reviewer deliberately deletes it.
   Its existing canonical activity history remains runner truth; deleting a plan must not silently
   delete recorded running evidence.
2. The normal qa_fixture Create Plan request performs the existing loading and persistence lifecycle,
   then creates or replaces the deterministic two-month fictional plan for that same runner.
3. The fixture ensures a substantial, stable set of historical generated-FIT activities is present for
   the runner. Matched past plan days show their ordinary completed-result readback; a bounded mix of
   unplanned and source-lifecycle states remains available for History/Progress review.
4. Future workouts are ordinary planned workouts without invented actual results. The reviewer can
   navigate the calendar, inspect workout detail, History, and Progress as in the product.
5. Reseeding converges to the same review profile without accumulation. A separate existing reset
   remains available for deliberate QA cleanup, but ordinary design review leaves the profile loaded.

## Root Cause

The existing `runner_activity_progress_review_v3` fixture seeds a strong historical activity corpus,
but does not maintain a current active calendar programme for the existing local QA runner session.
The local browser shown in the Product report therefore presented an old, mostly-rest calendar with no
matching activity history. The correct owner is fixture data alignment, not the already-working managed
server, origin, cookie, or authentication mechanism.

## Canonical Owners

- Existing fixture plan generation and persisted QA-test-user mapping.
- Existing plan/workout persistence for the rolling current programme.
- Existing generated FIT fixture, parser, canonical activity/source/revision persistence, and
  authenticated History/Progress read models for completed activities.

## Boundaries

- Strictly loopback-only and `qa_fixture` only. Do not alter the managed local server, server mode,
  host/origin, cookies, local-auth code, authentication routes, real mode, hosted data, production
  accounts, providers, OpenAI calls, schemas, migrations, or deployment.
- Do not create a Product-side seeder, fake API response, mock UI, second activity/profile truth, or
  an automatic re-login after explicit Logout.
- Use the existing authenticated fixture-runner mapping. Do not change how the browser enters,
  persists, switches, or exits that session.
- Preserve the accepted 30-activity history corpus, source lifecycle coverage, Gate 4 facts, and
  Gate 5 unavailable boundary unless a replacement proves the same coverage.
- Seed/reseed must be deterministic, idempotent, lease-protected, cleanup-capable, and must leave the
  requested design profile loaded after successful review.
- Do not interrupt an active Backend task. This item is dispatched only after the current Backend
  Slice 3 closes and the role is confirmed idle.

## Required Fixture Cleanup

The implementation must leave one canonical feature-QA design-profile path rather than accumulating
old plan seeds, duplicate fixture roles, stale activity rows, unused commands, or superseded fixture
helpers.

- Inventory existing local fixture data, commands, roles, and source consumers before adding or
  retaining a path.
- Delete or consolidate a candidate only after its current consumer reachability is zero and the
  canonical replacement has passed the same seed/readback/reset lifecycle. Do not retain duplicate
  fixture paths solely because they are old.
- Remove stale fixture rows and raw objects through the existing named reset/cleanup owner, not manual
  database shaping or raw shell deletion. Prove deliberate reset reaches zero owned rows/objects and
  reseed recreates only the accepted design profile.
- Preserve the current authenticated fixture identity, all current-session owners, accepted source
  lifecycle coverage, and unrelated concurrent data. Do not delete an identity or artifact merely
  because its name predates this task.
- Record every deliberately retained legacy-looking item with its active consumer and reason; an item
  with no consumer and an accepted replacement must be removed in this bounded slice.

## Acceptance

- Deleting the QA runner's active plan, then using the normal Create Plan flow with arbitrary valid
  runner input, presents the ordinary loading/review lifecycle and recreates the deterministic local
  two-month QA plan without AI or provider activity.
- One `QA Saved Plan` local review profile exposes an active, date-current two-month fictional calendar
  programme spanning past and future dates, with varied already-supported workout types, rich existing
  workout sections, and explicit rest days.
- Past completed sessions use canonical persisted FIT evidence and reconcile honestly with their
  planned workout where they are matched; Activity History and Progress remain populated from ordinary
  authenticated APIs.
- The same profile is directly reviewable on Calendar, workout detail, Activity History, and Progress
  at desktop and exact 375px without manual database shaping or a provider call.
- Reseed produces the same coherent profile without accumulation; reset is still capable of returning
  all fixture-owned rows and raw objects to zero, while normal review completion intentionally leaves
  the profile loaded.
- The final source and fixture inventory has one active design-profile owner; superseded zero-consumer
  fixture data paths, helpers, and commands are removed or explicitly retained with proven consumers.
- A bounded independent QA replay verifies the existing fixture session's active-plan visibility,
  calendar and history/progress coherence, source privacy, provider isolation, no overflow, runtime
  health, and fixture retention.

## Accepted Implementation

Completed on 2026-08-04 through the canonical `saved-plan-readback` QA identity and the existing
`qa_fixture` provider boundary.

- `local:design-profile:seed`, `local:design-profile:status`, and
  `local:design-profile:reset` are the single named lifecycle. Seed uses the ordinary signed review,
  explicit confirm, plan persistence, Garmin FIT parser, activity/source/revision persistence, and
  authenticated History/Progress read models.
- The date-current plan spans eight weeks with 55 persisted calendar rows, explicit rest days, and
  easy, recovery, tempo, hills, intervals, long-run, strides, and selected-distance structures.
- The profile contains 30 canonical generated-FIT activities across nine calendar weeks. Eleven are
  truthfully matched to runnable planned workouts and nineteen remain unplanned; rest rows are never
  used as activity matches.
- Deliberate Product plan clearing preserves all 30 recorded activities. The normal 15-second
  provider-free Create Plan flow returns a signed review and recreates the active calendar only after
  explicit confirmation.
- Full reset reaches zero fixture-owned database rows and retained storage objects while preserving
  the reusable Auth identity. Reseed removes accumulated archived plans and leaves one active profile
  loaded.
- The superseded activity-only command aliases, private archived-plan seed, static rich-workout JSON,
  and zero-consumer `pool-plan-readback` command were removed. The separate local activity-file design
  fixture and the general QA pool lifecycle remain because they have active Product and validator
  consumers.
- Independent owner-level QA passed source reachability, runtime/API readback, privacy, provider
  isolation, scoped source quality, and build-integrity review. Desktop and exact 375 px browser proof
  passed without horizontal overflow. Global QA Acceptance remains separate.

## 2026-08-09 Fixture Alignment Receipt

- **Implementation DoD:** Passed. **Global QA Acceptance:** Pending.
- The red discriminator reproduced the date-current regression: the first 16 local database checks
  passed and `runner-activity-read-models` failed because static activity offsets produced only nine
  matched workouts against the generated plan while the assertion still required at least ten.
- The canonical fixture now preserves its offset corpus but deterministically aligns only the missing
  planned candidates to free, past, non-rest workout dates in the same calendar week. The ordinary
  2026-08-09 seed/readback reports 30 unique activities, 11 matched and 19 unplanned, with one active
  55-row plan and no provider dispatch.
- The surfaced Sunday-only read-model measurement expectation now derives its exact calendar-week
  count from the same 28-day/as-of boundary as the production fact-snapshot owner. Exact cold/warm
  request and persisted-row assertions remain; the product read model was not changed.
- Named reset reached zero fixture-owned rows and zero retained raw objects while preserving the Auth
  identity. Seed, status, and reseed converged to the same plan/history/progress and source-lifecycle
  counts, and the accepted profile was left loaded.
- Targeted 30-activity and 3,000-activity reconciliation passed; the full local backend database suite
  passed all 17 checks; targeted ESLint, Prettier, `git diff --check`, production build, and build
  integrity passed. One bounded independent read-only QA review passed with no issues.
- Preserved boundaries include the existing authenticated `saved-plan-readback` identity, one fixture
  lifecycle and three named commands, the 30-activity corpus, source available/removal-pending/removed
  coverage, Gate 4 facts, truthful Gate 5 `normalized_stream_not_persisted`, loopback-only operation,
  provider isolation, and cleanup/reseed convergence. No fallback, mock, schema, migration, UI, auth,
  provider, dependency, lockfile, workspace-cutover, hosted, or deployment path was added or changed.
- Browser/runtime API acceptance and hosted deployment parity were not run because this owner-level
  backend slice changed only local fixture/validator alignment and forbids hosted access; those remain
  Global QA/release evidence rather than an Implementation DoD gap. Dependency advisories were not
  inspected or mutated and remain out of scope.

## 2026-08-09 Global QA Acceptance Receipt

- **Global QA Acceptance:** Failed. This is local acceptance only; no hosted or production readiness
  claim was made.
- The minimized replay `npm run local:design-profile:status -- --runtime-url
http://127.0.0.1:3000` authenticates the existing fixture identity, reads both History pages and the
  Product Progress response, then throws at `scripts/lib/runner-design-profile-fixture.ts:668` because
  `progress.interpretation` is absent from the canonical Product projection. A second stale assertion
  at line 701 still expects `advancedMetrics.streamDependentMetrics`; the supported Product DTO exposes
  the truthful Gate 5 boundary through `advancedMetrics.detailedMetrics`.
- Source and independent read-only review confirm the persisted/internal read-model phase completes
  before runtime verification. The API intentionally projects only `status`, `asOfDate`,
  `rolling28Day`, `calendarWeeks`, and `advancedMetrics`; changing Product or persistence truth would
  patch the wrong owner. The first incorrect owner is the Backend fixture runtime verifier.
- A fresh canonical build passed and the managed built server remained healthy, loopback-bound, and
  `providerMode: qa_fixture` at `http://127.0.0.1:3000/`. `.env.local` targeted only
  `http://127.0.0.1:54321`. Current-run observability reported null provider identity and no provider
  dispatch.
- The built-in Codex browser reached the existing authenticated `QA Saved Plan` Calendar at desktop
  1280 px. Past and future workout rows were visible and the document measured 1280/1280 with no
  horizontal overflow. Screenshot evidence is stored under
  `qa-artifacts/screenshots/2026-08-09/canonical-local-runner-design-profile-global-qa/`.
- Per the Backend stop condition, deliberate reset/reseed, stable no-accumulation readback, exact
  375 px, workout-detail agreement, and full Activity History/Progress browser acceptance were not
  run after the required status gate failed. Those omissions prevent local Product-review acceptance;
  they are not represented as passing coverage.
- The two uncommitted Backend implementation files retained their initial SHA-256 hashes throughout
  QA. No source, package, dependency, auth, provider, hosted, deployment, staging, commit, push, or
  recovery-material mutation occurred.

## 2026-08-09 Runtime Verifier Repair Receipt

- **Backend Implementation DoD:** Passed. **Global QA Acceptance:** Pending; the item is `ready` for
  QA to resume the interrupted acceptance inventory.
- The exact red replay authenticated the canonical fixture identity, read both History pages, and
  received Product Progress `200`, then failed at the runtime verifier's internal-only
  `progress.interpretation` access. Source inspection also confirmed its stale
  `advancedMetrics.streamDependentMetrics` path while the supported Product DTO exposes Gate 5
  through `advancedMetrics.detailedMetrics`.
- The existing runtime verifier now reads only supported Product projection fields and asserts both
  `detailedMetrics.status = unavailable` and
  `detailedMetrics.reason = normalized_stream_not_persisted`. The Product DTO, persisted/internal
  read model, frontend, fixture data model, Auth, and user-facing behavior were not changed.
- Stronger internal assertions remain in the non-runtime fixture readback and runner-activity
  validator, including interpretation truth, exact Product projection keys, internal-field omission,
  and the smaller Product payload discriminator. No helper, parallel contract, fallback, or assertion
  weakening was introduced.
- Named reset reached zero fixture-owned rows and raw objects while preserving the authenticated QA
  identity. Seed, runtime status, reseed, and repeated runtime status converged to one active 55-row
  plan, 30 activities, 11 matched and 19 unplanned activities, 27 available / 1 removal-pending / 2
  removed sources, Gate 4 facts, and truthful Gate 5 unavailability with zero provider dispatch.
- The focused 30/3,000-activity read-model validator and the complete local backend database suite
  passed. One first full-suite attempt encountered a local PostgREST transport response during check
  15; local health and the isolated foundation check passed, and a complete clean rerun passed all 17
  checks.
- Targeted Prettier, ESLint, and diff checks passed. Production build and build integrity passed. One
  bounded independent read-only QA review passed after identifying and verifying the formatting
  fix-forward; it confirmed the verifier owner, preserved internal assertions, unchanged canonical
  contracts, and unchanged 30/11/19 fixture alignment.
- Hosted Supabase, deployment parity, provider calls, browser/viewport acceptance, dependency
  advisories, staging, commit, push, and deployment were not run or mutated. Those omissions do not
  weaken this Backend verifier repair, but browser/global and hosted/release acceptance remain
  unproven; Global QA Acceptance is therefore not claimed.

## 2026-08-09 Global QA Acceptance Resume Receipt

- **Global QA Acceptance:** Failed. This verdict covers only the local `qa_fixture` Product-review
  profile; no hosted, deployment, or production-release readiness is claimed.
- The repaired authenticated runtime-status gate passed against the fresh managed loopback build and
  observed one active 55-workout plan, 30 activities, 11 matched and 19 unplanned activities, 27
  available / 1 removal-pending / 2 removed sources, Gate 4 facts, truthful Gate 5
  `normalized_stream_not_persisted`, no private source fields, and no provider identity or dispatch.
- Desktop and exact 375 px browser checks reached the existing authenticated `QA Saved Plan` on
  Calendar, workout detail, Activity History, and Progress. All inspected surfaces were contained
  without horizontal overflow. History exposed all 30 activities after normal pagination, including
  exactly 19 `Unplanned run` rows and 11 named plan relationships; source available,
  removal-pending, and removed presentation was truthful. Progress agreed with the persisted 28-day
  facts and showed Gate 4 record/load plus truthful Gate 5 unavailability.
- The blocking replay is cross-surface: Activity History identifies the 2026-07-27 activity as the
  planned `Easy Run`, while Calendar renders `27 Skipped Easy Easy Run` and workout detail renders
  `Skipped`, `Not logged yet`, `Add result`, and `Add activity file`. The same contradiction is
  independently reproducible at desktop and exact 375 px. Screenshot evidence is stored under
  `qa-artifacts/screenshots/2026-08-09/canonical-local-runner-design-profile-global-qa-resume/`
  and its independent `-browser-crosscheck/` sibling.
- Source discrimination returns the defect to Backend fixture/persistence projection. Frontend
  renders the Backend-shaped workout status and the History DTO's plan relationship directly. The
  fixture persists activity matches without the complete canonical FIT completion projection, so
  matched past workouts do not enter the ordinary completed Product readback.
- Independent contract audit also found that status reports but does not strictly assert the exact
  accepted 55-workout and 11/19 match split; it could pass with 54 workouts or 10 matched / 20
  unplanned activities. Product DTO, stronger internal read-model assertions, privacy checks,
  Gate 5 checks, loopback tripwires, and provider tripwires remain intact.
- Named reset, zero readback, seed, reseed, and final no-accumulation status were deliberately not run
  after the Backend fixture/persistence disagreement triggered the required stop condition. The
  already-loaded accepted-count profile remains intact, but lifecycle convergence is not accepted by
  this run.
- The two Backend implementation files retained their initial SHA-256 hashes throughout QA. No
  source, package, dependency, authentication, hosted Supabase, provider, deployment, staging,
  commit, push, compatibility-symlink, or recovery-material mutation occurred.

## 2026-08-09 Matched Completion Coherence Repair Receipt

- **Backend Implementation DoD:** Passed. **Global QA Acceptance:** Pending; the item is `ready` for
  QA to resume acceptance. This Backend result is not a Global QA pass.
- The red root-cause discriminator first made the accepted 11/19 history split exact, then failed on
  the canonical completion RPC with zero FIT-completed workout IDs against all 11 matched IDs. This
  distinguished the incomplete Backend fixture projection from the already-correct Product DTO,
  persisted read model, and frontend consumers.
- The single canonical fixture now sends each generated FIT source through the existing
  `readRunnerActivityProjection` and `reconcileWorkoutResultProjection` seam. Unplanned activities
  receive only their ordinary parsed evidence asset; matched activities additionally receive the
  canonical actual-metrics, deterministic-comparison, and atomic match/completion projection. No
  manual workout log, AI insight, fallback status, second fixture, mock, or parallel completion truth
  was added.
- The named readback now rejects drift from exactly one active 55-workout plan, 30 unique activities,
  11 matched and 19 unplanned activities, and 11 matched / 11 FIT-completed / zero future
  FIT-completed workouts. Every matched active workout must project `completed`, `fit_activity`, and
  `feedback_ready`; every unmatched workout must remain outside the FIT-completion projection.
- Reset reached zero fixture-owned rows and zero retained raw objects while preserving the existing
  authenticated identity. Seed, status, reseed, and repeated authenticated runtime status converged
  without accumulation to 30 assets, 11 actual-metrics rows, 11 comparisons, zero workout logs, zero
  AI insights, 27 available / 1 removal-pending / 2 removed sources, Gate 4 facts, and truthful Gate 5
  `normalized_stream_not_persisted`. Provider dispatch remained zero and runtime events carried no
  provider identity.
- The focused 30/3,000-activity read-model validator passed; the complete local Backend database
  suite passed all 17 checks; the complete managed runtime suite passed all 16 checks; targeted
  Prettier, ESLint, `git diff --check`, fresh production build, build integrity, privacy/unauthenticated
  status, and loopback/runtime-health checks passed.
- One reused independent read-only QA reviewer passed ordinary authenticated Calendar, Activity
  History, workout Result/Feedback, future-workout, unplanned-history, and overflow checks at desktop
  and exact 375 x 812. July 27 Easy Run and August 4 Tempo were completed and FIT-feedback-ready across
  surfaces; August 10 remained planned. Evidence is under
  `qa-artifacts/screenshots/2026-08-09/canonical-local-runner-design-profile-backend-completion-fix/`.
  The built-in browser was unavailable, so QA exhausted the safe fallback through Safari; no Product
  coverage remained missing. The QA reviewer made no source, database, profile, or runtime mutation
  and is closed. No ARCHITECT reviewer was needed because canonical ownership was unambiguous.
- Hosted Supabase, deployment parity, the release suite containing hosted parity, paid providers,
  dependency advisories, staging, commit, push, and deployment were not run or mutated. Consequently
  no hosted/release claim is made. Product source, frontend, Auth, provider configuration, schemas,
  migrations, dependencies, lockfiles, recovery packages, and workspace-cutover topology remain
  unchanged.

## 2026-08-09 Final Global QA Acceptance Receipt

- **Backend Implementation DoD:** Passed. **Global QA Acceptance:** Passed for the canonical local
  `qa_fixture` Product-review profile. This receipt does not claim hosted, deployment, production, or
  release readiness.
- The former mismatch discriminator is green through ordinary authenticated Product interaction.
  Activity History relates the July 27 activity to `Easy Run`; Calendar renders that workout
  `Completed`; Result and Feedback render the attached Garmin FIT activity, completed-file state,
  and matched comparison. August 4 independently agrees as completed `Tempo`. August 10 remains an
  ordinary planned-only future workout, and the August 9 activity remains truthfully unplanned.
- The named destructive lifecycle converged without manual database shaping. Reset preserved the
  reusable Auth identity while reaching zero fixture-owned rows and zero retained raw objects. Seed,
  status, reseed, final status, and repeated status returned the same one active 55-workout plan,
  30 unique activities, exact 11 matched / 19 unplanned split, 11 FIT-completed matched workouts,
  zero future FIT completions, 30 result assets, 11 actual-metrics rows, 11 comparisons, zero workout
  logs, and zero AI insights. The accepted profile remains loaded.
- The existing `saved-plan-readback` fixture identity reached the real authenticated loopback flow.
  Unauthenticated runtime readback returned `401`; raw private source fields were absent. The final
  managed server was healthy, compatible, freshness-current, bound to `127.0.0.1`, and reported
  `providerMode: qa_fixture`. The status provider tripwire passed, and the last 200 runtime events
  contained no non-null provider identity.
- Desktop 1280 x 720 and exact 375 x 812 acceptance passed on Calendar, workout Result/Feedback,
  Activity History, and Progress. Calendar exposed all 11 distinct completed-feedback workout dates,
  including the repaired July 27 and August 4 cases. History loaded all 30 activities through normal
  pagination and exposed exactly 19 `Unplanned run` rows. Progress agreed with the persisted 28-day
  facts (`15` sessions, `12 h 43 min`, `124.3 km`, `540 m`), the Gate 4 5K/500 AU evidence, and the
  Gate 5 `normalized_stream_not_persisted` unavailable presentation.
- Available, removal-pending, and removed source lifecycle states remained truthful in the browser:
  retained raw data remained reprocessable, pending removal exposed retry, and removed raw data kept
  normalized facts without offering reprocessing. Every primary page measured document/body width
  equal to its exact viewport with zero horizontal overflow.
- One bounded independent read-only QA/browser subagent passed and closed. Its built-in IAB binding
  was unavailable, so it exhausted the supported local fallback through an existing Safari Responsive
  Design Mode window without using Chrome. It independently replayed the July 27, August 4, August 10,
  and unplanned History cases at 1280 x 720 and 375 x 812 with no visible clipping or horizontal
  scrollbar. Its omitted numeric Safari per-element overflow enumeration has no integrated coverage
  consequence because the primary built-in-browser run supplied exact DOM width measurements for all
  four required surfaces.
- Primary screenshots are stored under
  `qa-artifacts/screenshots/2026-08-09/canonical-local-runner-design-profile-global-qa-final/`;
  independent screenshots are stored under the sibling
  `canonical-local-runner-design-profile-global-qa-final-independent/` directory. A fresh production
  build passed before browser acceptance; final build/integrity and canonical-link validation were
  rerun after this receipt update.
- No required local acceptance check was omitted. Hosted Supabase, real/provider mode, paid provider
  calls, deployment parity, dependency remediation, production data, staging, commit, push, and
  release validation were intentionally out of scope and were neither accessed nor mutated. The two
  uncommitted Backend implementation files retained their entry SHA-256 hashes throughout QA;
  authentication, source, DTOs, schema, migrations, packages, lockfiles, recovery material,
  compatibility symlink, and workspace topology were not changed.

## Dependencies

- [Runner Activity Progress Review Fixture](2026-08-02-runner-activity-progress-review-fixture.md)
- [Runner Activity Intelligence Foundation Architecture](2026-07-30-runner-activity-intelligence-foundation-architecture.md)
- [Runner Activity History And Explainable Progress Experience](2026-08-02-runner-activity-history-and-explainable-progress-experience.md)
- [Runner Activity Backend Optimization Plan](2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md)

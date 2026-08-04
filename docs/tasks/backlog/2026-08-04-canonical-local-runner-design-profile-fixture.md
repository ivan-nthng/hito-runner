# Canonical Local Runner Design Profile Fixture

## Work Item ID

2026-08-04-canonical-local-runner-design-profile-fixture

## Status

completed

## Type

change_request

## Priority

high

## Owner

backend

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

## Dependencies

- [Runner Activity Progress Review Fixture](2026-08-02-runner-activity-progress-review-fixture.md)
- [Runner Activity Intelligence Foundation Architecture](2026-07-30-runner-activity-intelligence-foundation-architecture.md)
- [Runner Activity History And Explainable Progress Experience](2026-08-02-runner-activity-history-and-explainable-progress-experience.md)
- [Runner Activity Backend Optimization Plan](2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md)

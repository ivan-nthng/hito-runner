# Hito Workout Sidebar Week Summary And Latest Insight — 2026-08-15

## Work Item ID

2026-08-15-hito-workout-sidebar-week-summary-and-latest-insight

## Status

completed

## Type

Tracked — Product read-model and Workout detail presentation

## Priority

high

## Owner

QA

## Epic

runner-evidence-and-progress

## Scope

Replace the remaining Workout Overview sidebar `Execution` target block in
`src/routes/workout.$date.tsx` with a truthful weekly summary and a latest uploaded-workout
insight readback. In the existing AppShell auxiliary note, replace the legacy Calendar note copy
with the Beta-user entitlement copy. The first stage is a bounded server read-model contract; the
current FRONTEND Product slice renders it and applies the AppShell copy correction.

## Archive Intent

Compact terminal closeout after the Backend contract, Frontend rendering, and focused acceptance
are complete.

## Task

Remove the sidebar's `Execution` content, including `Estimated HR` and `Easy full band`. Keep the
existing `This week` subject and make it answer:

- completed non-rest workouts out of scheduled non-rest workouts;
- scheduled kilometres for that week; and
- kilometres actually recorded against those scheduled workouts.

Add a second sidebar subject for the runner's most recent eligible uploaded-workout insight. It must
render the canonical saved insight when one exists and a truthful no-insight state when it does not.
It must never generate, infer, or fabricate an insight during page rendering.

## User Report

Inspector item `70c88f68-8583-400a-8fd4-b339d75d5434`, captured
`2026-08-15T18:55:33.065Z` on `/workout/2026-08-15?tab=overview`, Light `1470×801`, selected
`div.hito-row-group.bg-background`.

Ivan asks to remove the `Estimated HR · Easy full band` Execution block entirely. In its place, the
right sidebar should show This week: the count of three scheduled workouts, total planned kilometres,
and the portion already run. It should also show an insight from the most recently uploaded workout,
or explicitly say that no insight is available.

## Observed Behavior

- The route-local `SidebarPanel` renders a non-rest `Execution` section from
  `workoutSidebarTargetRows()`, which presents the existing HR/pace target readbacks.
- The route already renders This week using `weekProgressFor()`, but that helper counts workouts only.
- The previous completed item
  `2026-08-15-hito-workout-overview-sidebar-summary-deduplication` correctly removed duplicate
  Duration, Distance, Repeats, Blocks, and Workout type. It explicitly kept executable targets and
  excluded insight/data work; this request supersedes only that residual target block.

## Source Investigation

- `src/routes/workout.$date.tsx` is the sole rendered owner of the selected sidebar wrapper. Its
  `SidebarPanel` is route-local; the `hito-row-group` class is not evidence that a shared Design
  System primitive should change.
- `weekProgressFor()` already derives completed/total non-rest workouts from
  `TrainingSnapshot.workouts` and can remain the count owner.
- `workoutDistanceKm()` can derive a planned-distance display, but it falls back to a pace estimate
  for duration-based workouts. It is therefore not sufficient by itself to label every sum as exact
  planned distance without an explicit metric rule.
- `Workout.log.actualDistanceKm` is available for manual log results. For FIT-completed workouts,
  `projectWorkoutCompletionLog()` intentionally projects `actualDistanceKm` as `null` in the
  snapshot, while canonical actual metrics remain in `workout_actual_metrics`. A Frontend-only sum
  would silently exclude FIT kilometres.
- `getWorkoutRouteData()` currently fetches `WorkoutResultFeedbackSummary` only for the selected
  workout. `latestAiInsight` is therefore not a runner-wide latest-insight source. The existing
  `workout_ai_insights` data is canonical, but a scoped authenticated server query/read model is
  required before the sidebar can display the last uploaded result truthfully.

## Accepted Product Decisions

- The weekly summary and latest-insight subjects render on **every** Workout detail page, including
  planned, completed, skipped, and rest workouts. They are not conditional on the currently selected
  workout having targets or feedback.
- “Latest uploaded-workout insight” means the latest eligible final insight from **any workout owned
  by the authenticated runner**, regardless of active-plan membership. It includes enough workout
  date/title context to prevent false attribution. Superseded and incomplete insights are
  ineligible.
- Do not reserve an artificial empty `Execution` panel. The existing `SidebarPanel` remains the
  compact extensible composition owner for future subjects; only truthful rendered content occupies
  it now.

## Expected Behavior

- No `Execution`, `Estimated HR`, `Easy full band`, pace target, or heart-rate target section is
  rendered in this sidebar.
- This week retains its completion count and status, and also presents scheduled and recorded weekly
  distance according to one documented metric contract. Unknown or inapplicable distance must be
  shown as unavailable, not as zero or an estimate presented as fact.
- The latest-insight section renders one persisted final insight for the authenticated runner, with
  enough date/workout context to avoid false attribution. If no eligible persisted insight exists,
  it states that no uploaded-workout insight is available.
- Result/Saved result, skipped, rest Assignment, route navigation, activity import, detail tabs, and
  shared row-group chrome retain their existing behavior.

## Stage Plan

1. **BACKEND — contract:** add the smallest authenticated server read model for weekly
   planned/recorded distance and the eligible latest insight. Reuse existing
   planned workouts, manual workout logs, actual metrics, and insight records. Do not add a
   migration, materialized aggregate, provider call, AI generation, or synthetic client fallback.
2. **FRONTEND — Product:** consume only the accepted read model in the existing route-local
   `SidebarPanel`; delete the now-obsolete Execution target branch and helper/imports. Do not change
   shared `hito-row-group`/DS chrome.
3. **QA:** replay planned-only, manual logged, FIT-completed, no-insight, existing-insight,
   skipped/rest, and mobile/desktop theme cases against a fresh local fixture.

## What Not To Touch

Weather, weather providers, AI generation, insight authoring, existing insight persistence rules,
shared Design System primitives or tokens, AppShell, calendar move/edit behavior, plan schema,
migrations, hosted data, Figma, staging, commit, push, deployment, and unrelated dirty hunks.

## Validation Expectations

The Backend contract must prove the distance source and null semantics for manual logs, FIT actual
metrics, absent values, rest days, and status exclusions. Frontend proof must cover all listed
sidebar states, responsive containment, keyboard/navigation preservation, console health, focused
formatting/lint, and `git diff --check`. Independent QA is required after both implementation
slices. This task does not itself claim Global QA or release readiness.

## Promotion Condition

The task remains Tracked. Return to PRODUCT if the selected insight scope changes, if existing
records cannot express a truthful distance/insight contract, or if persistence/schema/provider work
is actually required.

## Product Scope Amendment — 2026-08-18

Ivan resumed this Frontend Product delivery before the requested commit/push. The existing left-side
AppShell auxiliary note is part of the same authenticated product surface and must use the exact
copy:

- title: `Beta User`;
- body: `All features are free for you.`

This is a factual temporary entitlement message only. Reuse the existing note anatomy, placement,
dismissal behavior, typography, and Design System styles; do not create an entitlement model,
settings state, new component, or alternate navigation surface. It is a copy correction alongside
the already accepted Workout sidebar delivery, not a new commercial feature.

## Stage

Independent focused QA completed; return to PRODUCT for release-freeze routing

## Next Recommended Role

PRODUCT

## Completed QA Dispatch

```text
ROLE: QA

Task: Hito Workout Sidebar Week Summary And Latest Insight
Stage: Independent focused browser acceptance
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-sidebar-week-summary-and-latest-insight.md

Independently replay the completed Backend and Frontend implementation on a fresh managed
`qa_fixture`. Verify the Workout sidebar on planned, manual-result, FIT-completed, skipped, and Rest
pages at desktop and 375px in Light/Dark: no Execution target section, truthful This week count and
distance discriminated states, explicit absent or factual available latest insight, preserved
Result/Assignment/navigation, containment, and console health. Verify the AppShell auxiliary note
shows `Beta User` and `All features are free for you.` and keeps its existing dismissal behavior.
Use only admitted disposable fixture truth; do not fabricate an eligible insight or a Rest-only
week. Return exact fixture coverage gaps to PRODUCT. Do not edit source or claim Global QA, hosted,
release, or deployment readiness.
```

## Backend Execution Preflight — 2026-08-15

- **Mode and owner:** Tracked Backend route read-model contract. The index is empty. The active Frontend writer owns disjoint Calendar/AppShell Product paths; Backend will not edit the dirty Workout route, control the managed runtime, or run a shared build during that work.
- **Demonstrated boundary:** the current route payload loads feedback only for the selected workout, while `TrainingSnapshot` intentionally projects FIT completion distance as `null`. A Frontend sum would therefore omit canonical FIT kilometres, and no runner-wide latest-insight source currently exists.
- **Existing seams reused:** `loadWorkoutRouteData`, the authenticated `training-api` server-only loader, runner-owned `planned_workouts` and `workout_logs`, `list_runner_fit_completed_planned_workouts`, non-superseded `workout_actual_metrics`, `getLatestWorkoutResultFeedback`, and `workoutDistanceKm`.
- **Change budget:** one focused server-only runtime file, `src/lib/workout-detail-sidebar-read-model.ts`, because `training-api.ts` is transport and the selected-workout feedback reader must not become a weekly/runner-wide aggregation owner. No new validator file; extend the existing workout evidence validator. No migration, table, RPC, materialized aggregate, provider call, AI generation, fixture truth path, client fallback, dependency, or lockfile change.
- **Metric contract:** aggregate the runner-local Monday–Sunday non-Rest rows. Preserve canonical manual/FIT completion precedence. Scheduled distance is available only when every scheduled workout has a current display distance and reports whether duration estimates are included. Recorded distance uses canonical FIT metrics before manual actuals; a completed/partial result with no recorded distance is unavailable rather than zero.
- **Insight contract:** return only a runner-owned `final` insight that survives the existing complete uploaded-result evidence projection, regardless of plan status, with workout ID/date/title; otherwise return `no_eligible_uploaded_workout_insight`.
- **Focused proof:** pure manual/FIT/missing/Rest/status/insight matrix; canonical loopback manual-log lifecycle and cross-user zero readback; read-only canonical FIT actual-metric readback; absent insight; targeted route/static checks and diff hygiene.
- **Stop boundary:** return before any schema/provider/UI change, parallel truth path, or overlap with the active Frontend owner.

## Backend Tracked Implementation Receipt — 2026-08-15

### Outcome And Root Cause

Backend Implementation DoD is **Passed**. The Workout route now returns one authenticated,
route-specific `sidebarReadModel` for every persisted workout page, including Rest. It combines the
runner-local Monday–Sunday non-Rest schedule with canonical manual/FIT actuals and returns the latest
complete final uploaded-workout insight across the runner's plans, or an explicit absent state.

The demonstrated first incorrect owner was the route read contract: it exposed only selected-workout
feedback, while `TrainingSnapshot` deliberately nulls FIT actual distance. A Frontend-only aggregate
would therefore omit FIT kilometres and could not retrieve a runner-wide latest insight truthfully.

### Consumer Contract

- `sidebarReadModel.week` returns `weekStartDate`, `weekEndDate`, `scheduledWorkoutCount`, and
  `completedWorkoutCount` for non-Rest rows.
- `scheduledDistance` is `available` with kilometres plus basis
  `explicit_prescriptions | includes_duration_estimates`, `unavailable` with a missing-row count, or
  `not_applicable` for a Rest-only/empty week.
- `recordedDistance` is `available` with canonical source basis and kilometres, `unavailable` when a
  completed/partial result lacks distance, or `not_applicable` for a Rest-only/empty week. Canonical
  FIT completion and non-superseded FIT metrics take precedence over the deliberately-null snapshot
  projection; skipped rows do not contribute actual distance.
- `latestInsight` is either `available` with the persisted final insight plus workout ID/date/title,
  or `absent` with `no_eligible_uploaded_workout_insight`. Eligibility requires the complete current
  asset → metrics → comparison → final-insight evidence chain and same-runner ownership.
- Onboarding or a non-existent workout continues to return `sidebarReadModel: null`; no alternate
  query, client fallback, or generation path was introduced.

### Files

- Added `src/lib/workout-detail-sidebar-read-model.ts` as the focused server-only aggregate owner.
- Extended `src/lib/route-data-actions.ts` and `src/lib/training-api.ts` only to authenticate, load,
  and return the route-specific contract.
- Extended `scripts/validate-workout-evidence-comparison.ts`; no validator or fixture file was added.
- Updated this canonical lifecycle record. No Frontend, schema, migration, generated type,
  dependency, provider, hosted, or runtime-control file was changed by this slice.

### Validation Inventory

| Check                         | Scenario / environment                                                                               | Result                      | Evidence                                                                                                                                                                                                                    |
| ----------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Weekly contract matrix        | Existing workout-evidence validator                                                                  | Passed                      | Exact and estimated scheduled distance, manual/FIT precedence, partial/completed/missing/skipped/superseded states, Rest-only week, date bounds, and cross-user rows passed.                                                |
| Insight eligibility matrix    | Existing workout-evidence validator                                                                  | Passed                      | Complete final chain returned workout date/title context; superseded, incomplete, and cross-user candidate/workout inputs returned the explicit absent state.                                                               |
| Manual actual persistence     | Loopback Supabase; canonical `qa-isolation-a` reset → template materialization → ordinary log action | Passed                      | Week `2026-05-04..10` returned 3 scheduled, 1 completed, 23.55 scheduled km with `includes_duration_estimates`, and 5.25 recorded km from `manual_logs`.                                                                    |
| Cross-user isolation          | Same loopback replay; `qa-isolation-b`                                                               | Passed                      | While runner A owned the schedule/log, runner B returned zero counts, both distances `not_applicable`, and no insight.                                                                                                      |
| Canonical FIT actual readback | Existing `fit-product-acceptance` fixture; read-only                                                 | Passed                      | Week `2026-08-10..16` returned 5.11 recorded km from `fit_actual_metrics`; no snapshot-distance inference was used.                                                                                                         |
| Absent persisted insight      | Both loopback users                                                                                  | Passed                      | With no eligible persisted insight, the server contract returned `no_eligible_uploaded_workout_insight`.                                                                                                                    |
| Disposable cleanup            | Canonical `test-user reset` after manual proof                                                       | Passed                      | `qa-isolation-a` returned profile, plan, four workouts, log, assets, metrics, comparisons, insights, activities, and all other owned lifecycle counts to zero.                                                              |
| Auth and route ownership      | Focused source inspection                                                                            | Passed                      | `training-api` derives the user ID through `requirePersistedUserIdForCurrentRequest`; all service-role reads also filter that ID; the route loads the model for any persisted existing workout without a workout-type gate. |
| Focused static checks         | Prettier, ESLint, validator, task-file TypeScript filter, `git diff --check`                         | Passed with baseline caveat | Formatting/lint/contract/diff checks passed. The new module, route loader, and validator emitted no TypeScript error.                                                                                                       |

### Omitted Checks And Consequences

- Repository-wide `tsc --noEmit` was run and remains red on pre-existing broad errors, including the
  existing `training-api` `viewer: unknown` server-function serializability baseline and unrelated
  active Frontend/Admin/Design System files. This receipt does not claim a green repository-wide
  TypeScript baseline.
- The complete Backend suite, production build, and managed runtime/browser checks were not run:
  another Frontend Product owner was actively mutating and exercising the shared checkout/runtime,
  and this bounded contract was covered by its registered focused validator plus local persistence
  proof. No whole-suite, build, runtime, or browser acceptance follows.
- The local database contains no retained final AI insight. Available/superseded/incomplete insight
  behavior is therefore deterministic source-contract proof; the real loopback query proves the
  absent state. Frontend and independent QA must exercise a retained eligible insight fixture before
  user-facing acceptance.
- Hosted Supabase, providers, staging, commit, push, deployment, Global QA, and release readiness
  were not exercised or claimed.

### Preserved Boundaries And Next Owner

`TrainingSnapshot`, selected-workout feedback, result import, RLS/auth ownership, activity/FIT
evidence, provider behavior, shared Design System, Figma, hosted data, and unrelated dirty work were
preserved. No active-plan predicate was added. No migration, RPC, materialized aggregate, provider
call, AI generation, dependency, client fallback, or alternate fixture path exists.

PRODUCT should dispatch the prepared `FRONTEND Product` consumer stage above. Independent QA remains
required after that stage; Global QA remains unclaimed. Role file: `agents/backend.agent.md`. Skill:
`skills/hito-backend-supabase-contract/SKILL.md`. No subagent was used.

## FRONTEND Product Execution Preflight — 2026-08-18

- **Task / mode / lane:** Hito Workout Sidebar Week Summary And Latest Insight / Tracked / FRONTEND
  Product.
- **Accepted source discriminator:** the completed Backend contract is already returned as
  `sidebarReadModel` by the persisted Workout route loader, including Rest. The current
  `WorkoutPage` does not consume it and still renders route-local `Execution` target content plus a
  second client-owned `weekProgressFor()` count. The first incorrect consumer owner is therefore
  `src/routes/workout.$date.tsx`, not the Backend read model or shared row-group styling.
- **Existing seam reused:** the existing `SidebarPanel`, `SidebarSection`, route loader data,
  `formatDistanceKm`, `formatDate`, and established Hito typography/semantic text roles. The
  smallest change is to render the Backend week and latest-insight discriminated states in that
  existing sidebar composition.
- **New runtime artifacts:** none. No file, component, helper framework, query, store, cache, state
  layer, endpoint, fixture, CSS recipe, Design System primitive, provider path, or compatibility
  branch is proposed.
- **Obsolete responsibility:** remove the route-local `Execution` branch,
  `workoutSidebarTargetRows()`, its HR-key filter/imports, and the client-owned `weekProgressFor()`
  aggregation once the Backend counts are rendered. Preserve Result/Saved result, Skipped,
  Assignment, activity-file, navigation, tabs, and shared `hito-row-group` chrome.
- **Dirty boundary:** preserve every existing Product hunk in `src/routes/workout.$date.tsx` outside
  this sidebar consumer. `src/lib/route-data-actions.ts`, `src/lib/training-api.ts`, and
  `src/lib/workout-detail-sidebar-read-model.ts` are accepted Backend-owned current bytes and are
  read-only for this slice. Their preflight SHA-256 values are respectively
  `2fd5a72bbc2732e79b2130c3eb707f5a8cfe026b4d5de3241a784b81b9072514`,
  `46ff4216a4eed33fd7227881f7b9e821e0ca7a29c8a0da913273ac64b51c08d2`, and
  `6d02f423a003017605af192a5ab28a18b78bdeff50b5e870d3fa7b8864ceda28`.
- **Focused proof:** source reachability and obsolete-helper deletion; available,
  `includes_duration_estimates`, unavailable, and not-applicable weekly distances; explicit absent
  and eligible latest insight; planned/manual/FIT/skipped/Rest rendering; Result/Assignment and
  navigation preservation; desktop and exact 375px Light/Dark containment; keyboard/focus;
  console; focused formatting/lint/type/build/diff hygiene. Missing truthful fixture states will be
  reported rather than fabricated.
- **Stop boundary:** return to PRODUCT before any Backend/read-model, provider, persistence,
  fixture-contract, Design System, Calendar, or cross-owner change.

### Resumed Scope Delta — 2026-08-18

- **Release-freeze re-admission:** Ivan explicitly resumed this same Tracked slice before the
  repository-wide commit/push freeze. The previously interrupted route candidate was reverted in
  full; current `src/routes/workout.$date.tsx` SHA-256 is
  `0c2b60268b384f656d92d224e8bcc5e31ead1adf7c56affb66c7934cf5571ca1` before this delivery.
- **Additional accepted seam:** reuse the existing dismissible auxiliary note in
  `src/components/AppShell.tsx`; change only its persisted-mode title/body and matching dismiss
  accessibility copy to the accepted Beta-user wording. Preserve its preview copy, anatomy,
  placement, state, styles, and dismissal behavior. Preflight SHA-256 is
  `d07e3dacdf950e673d1270960841a5259ecae62f1c38513b75182ebf069114a6`.
- **Change budget remains unchanged:** no new runtime artifact. The Workout route consumes the
  existing Backend DTO in the existing sidebar, and AppShell reuses its existing note. Obsolete
  route-local target/week aggregation is deleted; no entitlement state, helper framework, query,
  storage, component, CSS, Backend, or Design System responsibility is added.

## FRONTEND Product Tracked Implementation Receipt — 2026-08-18

### Outcome And Demonstrated Cause

Frontend Implementation DoD is **Passed**. Every persisted Workout detail page now renders the
existing Backend `sidebarReadModel` in the route-local `SidebarPanel`, including Rest. The obsolete
`Execution` target subject and its client-owned target/week aggregation are gone. `This week`
renders Backend counts plus scheduled/recorded distance without turning estimated, unavailable, or
not-applicable truth into an exact zero. `Latest workout insight` renders the persisted workout
context and saved summary/difference/recommendation when available, or the explicit no-insight
state. No query, generation request, fallback, or client aggregation was added.

The demonstrated first incorrect consumer was `src/routes/workout.$date.tsx`: the loader already
returned the accepted DTO, while the rendered owner ignored it and retained `Execution` plus
`weekProgressFor()`. The AppShell correction reused its existing dismissible auxiliary note and
changed only persisted-mode copy to `Beta User` / `All features are free for you.`, together with
the matching dismiss accessibility label.

### Files Changed

- `src/routes/workout.$date.tsx` — consumes `sidebarReadModel`; removes the `Execution` branch,
  `workoutSidebarTargetRows()`, HR-key filtering, `weekProgressFor()`, their imports, and the
  signal-only `SidebarSection` props left unreachable by that deletion; composes Backend-shaped
  weekly and latest-insight states inside the existing sidebar.
- `src/components/AppShell.tsx` — changes only the existing persisted auxiliary-note title, body,
  and dismiss label; preview copy, state, placement, styles, and behavior are unchanged.
- This canonical item — resumed preflight, lifecycle, independent-QA handoff, and this receipt.

No production file, component, API, state layer, query, fixture path, CSS recipe, Design System
contract, dependency, or other runtime artifact was added. The accepted Backend files remained
byte-identical to their preflight SHA-256 values.

### Validation Inventory

| Check                             | Scenario / environment                                       | Result | Evidence                                                                                                                                                                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------ | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source discriminator and deletion | Current route/source census                                  | Passed | `sidebarReadModel` is consumed once; `Execution`, `weekProgressFor`, target-row filtering, signal-only `SidebarSection` props, and their imports have zero reachability in the route.                                                                                                      |
| Formatting and lint               | Prettier on both source owners and this item; focused ESLint | Passed | All touched files are formatted; both TSX owners lint without findings.                                                                                                                                                                                                                    |
| Product contracts                 | `npm run validate-product-contracts`                         | Passed | Heart-rate guidance editor and workout comparison readback contracts passed unchanged.                                                                                                                                                                                                     |
| Production build                  | `npm run build`; repeated after final dead-prop cleanup      | Passed | Client, SSR, Nitro, and postbuild completed successfully on the final source bytes; only existing bundle/directive warnings were emitted.                                                                                                                                                  |
| Managed browser admission         | Canonical `127.0.0.1:3000`, PIDs 17527 and 19985             | Passed | Both evidence passes began managed, healthy, loopback-only, `qa_fixture`, and `artifactFreshness: fresh` / `receipt_matches`; PID 19985 was rebuilt from the final source bytes.                                                                                                           |
| Persisted state coverage          | Canonical runner design profile, desktop Light               | Passed | Planned (`2026-08-20`), skipped (`2026-08-17`), FIT-completed (`2026-08-18`), and Rest (`2026-08-19`) all rendered `This week` and `Latest workout insight`, with no `Execution`. FIT truth rendered 1 of 4, About 21.49 km scheduled, 16.2 km recorded, and uploaded-activity provenance. |
| Manual-result coverage            | Ordinary disposable result save and reload                   | Passed | A 5.1 km manual result updated the same week to 2 of 4 and 21.3 km with `manual results and uploaded activity files`; reload preserved the factual readback.                                                                                                                               |
| Unavailable distance              | Ordinary disposable result without distance                  | Passed | Settled readback rendered `Recorded — Unavailable` and `Recorded distance is missing for 1 result.` rather than zero.                                                                                                                                                                      |
| Explicit no-insight               | Design profile with `workout_ai_insights: 0`                 | Passed | Every tested page rendered `No uploaded-workout insight is available yet.`; no client request or fallback appeared.                                                                                                                                                                        |
| Responsive themes                 | 1470x801 and exact 375x812; Light and Dark                   | Passed | Planned, skipped, FIT-completed, and Rest pages retained both sidebar subjects; body/document scroll width equalled the viewport at every measured case, and the mobile bottom navigation remained visible.                                                                                |
| Final current-source smoke        | PID 19985; FIT desktop Light and Rest 375x812 Dark           | Passed | Final source bytes rendered both sidebar subjects, explicit no-insight, no `Execution`, exact viewport-width containment, the mobile bottom navigation, and empty browser console/error readback. The desktop AppShell retained the exact Beta-user title/body.                            |
| AppShell note                     | Desktop Light/Dark; pointer dismissal and reload             | Passed | Exact Beta-user title/body rendered. Dismiss removed the note; reload restored the existing in-memory note behavior. Preview branch source remained unchanged.                                                                                                                             |
| Navigation and semantics          | Workout detail to Calendar                                   | Passed | `Back to Calendar` remained a native focusable `A` (`href=/`, `tabIndex=0`); pointer activation navigated to `/`.                                                                                                                                                                          |
| Console and cleanup               | Browser log readback; canonical design-profile reset         | Passed | No warning/error console entries. Reset removed all owned rows and raw storage objects; the disposable auth identity was preserved.                                                                                                                                                        |
| Diff hygiene and ownership        | `git diff --check`; read-only Backend SHA-256 replay         | Passed | Diff hygiene is clean. `route-data-actions.ts`, `training-api.ts`, and `workout-detail-sidebar-read-model.ts` retained their recorded hashes.                                                                                                                                              |

### Coverage Gaps And Consequences

- The admitted design profile contains zero `workout_ai_insights`, and the completed Backend receipt
  already records the absence of a retained final local insight. The available-insight UI branch is
  source/type/build covered but was not browser-rendered; independent QA still needs an already
  admitted eligible insight fixture before accepting that branch. No row or payload was fabricated.
- The admitted profile's current Monday-Sunday interval always contains non-Rest workouts, so the
  weekly `not_applicable` rendering branch was not browser-observed. It is source/build covered and
  backed by the accepted Backend validator receipt; a Rest-only current-week fixture remains the
  browser discriminator.
- Background browser keyboard injection did not advance focus from `BODY`; therefore this slice
  records native anchor semantics and pointer navigation, not a synthesized Enter activation. The
  route did not change navigation markup or focus behavior. Independent QA should include ordinary
  keyboard navigation in its supported browser path.
- After the final canonical receipt write, PID 19985 remained managed, healthy, loopback-only, and
  running in `qa_fixture`, while admission freshness changed to `stale/artifact_missing` because the
  repository-derived private Admin snapshot marker no longer matched the task-record digest. The
  final current-source smoke was captured before that drift on `fresh/receipt_matches`; no rebuild
  loop or post-receipt browser claim was made.
- No hosted, provider, Global QA, release, deployment, staging, commit, push, or Figma acceptance is
  claimed.

### Preserved Boundaries And Next Owner

Result/Saved result, Assignment, skipped/Rest behavior, activity import, workout tabs, Calendar,
AppShell layout, preview note copy, Backend persistence/read-model behavior, shared Design System,
fixtures, providers, and unrelated dirty work were preserved. The named QA role is next for the
bounded independent browser replay above; PRODUCT remains the lifecycle owner and Global QA remains
separate.

Role file: `agents/frontend.agent.md`. Skills used:
`skills/hito-frontend-design-system/SKILL.md`, `skills/hito-qa-browser-regression/SKILL.md`, and the
Browser local-control skill for the focused loopback replay. No subagent was used.

## QA Tracked Focused Acceptance Receipt — 2026-08-18

### Stage, Layer, And Browser Preflight

- **Stage / validation layer:** Independent focused acceptance of the completed Frontend Product
  Workout-sidebar and AppShell-copy slice. This is not Global QA, hosted, release, deployment, or
  production acceptance.
- **Managed artifact admission:** the inherited PID `19985` was managed, compatible, healthy, and
  loopback-bound but stale. Two serialized rebuild attempts correctly stopped at postbuild integrity
  while another repository-derived Admin Markdown source was moving. After the Admin snapshot
  digest remained stable for four checks over approximately 46 seconds, the canonical lifecycle
  admitted PID `31200` as `managed: true`, `healthy: true`, `providerMode: qa_fixture`,
  `artifactFreshness: fresh`, and `freshnessReason: receipt_matches` on
  `http://127.0.0.1:3000/`. No stale or ad hoc artifact supplied browser evidence.
- **Fixture admission:** the named `saved-plan-readback` disposable identity reset to zero, seeded
  through the existing design-profile lifecycle, and passed authenticated runtime status. The
  admitted readback contained 55 workouts, 30 activities, 11 FIT-completed matched workouts, zero
  `workout_ai_insights`, a separate 401 unauthenticated API boundary, no private raw fields, and no
  provider-backed runtime mode.
- **Browser path:** Codex in-app local browser, desktop `1470x801` and exact `375x812`, Light and
  Dark. Browser state came from rendered DOM, native controls, computed viewport/scroll widths,
  visual screenshots inspected during the run, console readback, and durable reloads. No screenshot
  file was added because this assignment allowed only the canonical-item repository update.

### Validation Inventory

| Check                                         | Scenario / environment                                             | Result                   | Evidence                                                                                                                                                                                                                                                                                                               |
| --------------------------------------------- | ------------------------------------------------------------------ | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed runtime and isolation                 | Canonical lifecycle, `127.0.0.1:3000`                              | Passed                   | Final admission was PID `31200`, fresh/receipt-matching, healthy, loopback-only, and `qa_fixture`. Runtime events contained no non-null `providerKind`.                                                                                                                                                                |
| Fixture reset, seed, and authenticated status | Disposable design profile                                          | Passed                   | Initial reset reached zero rows/objects; seed restored 55 workouts, 30 activities, 11 FIT completions, and zero insights; authenticated status passed while unauthenticated API readback remained 401.                                                                                                                 |
| Planned persisted Workout                     | `2026-08-20`, desktop Light and mobile Light/Dark                  | Passed                   | `This week` rendered `1 of 4`, `About 21.49 km`, and `16.2 km`; `Latest workout insight` rendered the explicit absent state; the sidebar had no exact `Execution` heading or `Easy full band`.                                                                                                                         |
| FIT-completed persisted Workout               | `2026-08-18`, desktop Light/Dark and mobile Dark                   | Passed                   | Existing Result presentation remained, and the sidebar used uploaded-activity distance: `16.2 km` / `Recorded from uploaded activity files.` with no sidebar Execution section.                                                                                                                                        |
| Skipped persisted Workout                     | `2026-08-17` before mutation, desktop Light and `375x812` Dark     | Passed                   | Existing skipped/Saved result truth remained while both new sidebar subjects rendered the same Backend-shaped week and absent-insight state. The workout document's prescribed HR text remained outside the removed sidebar target section.                                                                            |
| Rest persisted Workout                        | `2026-08-19`, desktop Light and mobile Light/Dark                  | Passed                   | Rest rendered both new sidebar subjects with no sidebar Execution section and retained the normal Rest overview/navigation.                                                                                                                                                                                            |
| Manual-result available distance              | Ordinary browser save on `2026-08-17`, then reload                 | Passed                   | A disposable 5.1 km completed result changed the current week to `2 of 4`, `21.3 km`, and `Recorded from manual results and uploaded activity files.`; reload preserved the same visible truth.                                                                                                                        |
| Ordinary unavailable distance                 | Clean reseed, completed result saved without distance, then reload | Passed                   | The same route rendered `Recorded — Unavailable` and `Recorded distance is missing for 1 result.`; it did not show zero or invent a distance.                                                                                                                                                                          |
| Explicit no-insight state                     | All five persisted Workout types                                   | Passed                   | With durable `workout_ai_insights: 0`, every page rendered `No uploaded-workout insight is available yet.`. No non-null provider event or browser fallback/generation result appeared.                                                                                                                                 |
| AppShell persisted note                       | Desktop Light/Dark                                                 | Passed                   | Exact `Beta User` / `All features are free for you.` rendered. Pointer dismissal removed the note and reload restored the existing in-memory behavior. Persisted mode did not render preview-body copy.                                                                                                                |
| Navigation, focus, and Escape                 | Workout route and profile menu                                     | Passed with control note | `Back to Calendar` remained a native `href=/` link and pointer navigation reached `/`. Native Enter opened the profile menu; Escape closed it and returned focus to the profile trigger. Synthetic Enter on the Back link did not navigate through this control surface, so it is not claimed as product evidence.     |
| Responsive containment and themes             | `1470x801` and `375x812`, Light/Dark                               | Passed                   | At every measured state, `documentElement.scrollWidth` and `body.scrollWidth` equalled the exact viewport width. The mobile sidebar, bottom navigation, week readback, and insight state remained contained and usable.                                                                                                |
| Console and request health                    | Full focused browser session                                       | Passed                   | Browser warning/error readback was empty. Expected local login/logout and Workout reads/actions completed successfully; no provider dispatch was observed.                                                                                                                                                             |
| Cleanup and runtime release                   | Final reset repeated twice; managed stop                           | Passed                   | First final reset removed the task-owned manual result and all fixture rows/objects; the repeated reset began and ended at zero with zero retained storage objects. PID `31200` was stopped, lifecycle status reported `pid: none`, and port 3000 had no listener.                                                     |
| Source/diff preservation                      | Read-only source discriminator and focused diff hygiene            | Passed                   | `src/routes/workout.$date.tsx` retains only Backend-shaped sidebar composition; `src/components/AppShell.tsx` keeps the preview-body branch unchanged. Focused `git diff --check` passed; no production, fixture-source, schema, migration, DS, dependency, hosted, provider, or Git-lifecycle file was changed by QA. |

### Issues And Coverage Gaps

No Product, Backend, or Design System defect was reproduced.

- The admitted fixture has zero eligible final insights. The explicit absent state is independently
  accepted, but the available-insight UI remains a browser coverage gap until a normal admitted
  fixture owns an eligible persisted insight. No insight was fabricated.
- The current fixture week always contains non-Rest workouts. The `not_applicable` Rest-only-week
  presentation was not browser-observed; no Rest-only week was fabricated.
- The admitted Rest rows use generic Rest notes that intentionally normalize to no distinct
  assignment. Rest page preservation passed, but the conditional non-empty `Assignment` block was
  not browser-rendered in this fixture.
- The persisted design-profile identity cannot expose the AppShell preview note; logout correctly
  reached the unauthenticated auth screen. The preview-body branch was therefore verified by the
  unchanged source discriminator rather than a second fabricated browser profile.
- The in-app control surface did not activate `Back to Calendar` through synthetic Enter. Native
  link semantics, pointer navigation, and a separate real Enter/Escape focus-return path passed, so
  this remains a control-surface evidence gap rather than a reproduced product defect.

### Preserved Boundaries And Route

The Backend completion receipt and Frontend Implementation DoD remain separate from this focused
QA result. The disposable fixture is zeroed, the managed runtime is stopped, and no release freeze
or Git action was started. PRODUCT is the next owner and may re-enter the requested release-freeze
admission from an idle local-runtime boundary.

Role file: `agents/qa.agent.md`. Skills used:
`skills/hito-qa-browser-regression/SKILL.md`,
`skills/hito-backend-supabase-contract/SKILL.md`, and the in-app browser control skill. No subagent
was used.

**Verdict: Passed**

# Hito Workout Detail Right Panel Static Placeholder

Work Item ID: `2026-08-18-hito-workout-detail-right-panel-visual-removal`
Status: completed
Type: Tracked
Priority: highest
Owner: FRONTEND
Epic: runner-core-readiness
Parent: [Hito Workout Detail Right Panel Removal And Query Elimination](./2026-08-18-hito-workout-detail-right-panel-removal-and-query-elimination.md)

## Scope

Replace the data-backed right-hand Workout detail panel with one mostly static future-insights
placeholder using its existing route-local anatomy. Retain only the existing Backend-shaped current
week workout count at the bottom. The main Workout detail remains usable and contained.

## Task

Change only the Product route seam required to render factual static copy: there is not enough data
yet to provide these inputs/insights, and this is a future feature. Consume only
`sidebarReadModel.week.completedWorkoutCount` and `scheduledWorkoutCount` for the factual weekly
count. Do not calculate it in the client, add a query, or render any insight, FIT/result-derived
fact, additional metric, or data branch. Preserve the main content, FIT upload/removal, result
actions, navigation, focus behavior, responsive layout, and all backend-shaped truths. Do not touch
shared Design System, backend loaders, schema, persistence, fixtures, or hosted state.

## Validation Expectations

Run the focused Product/route checks, formatting and diff hygiene. Browser proof covers a persisted
workout with and without a result at desktop and 375px; confirm the same static placeholder and
Backend-shaped weekly count, no horizontal overflow, console errors, or loss of main workout
actions. Record the precise Backend handoff for reducing the loader/read-model work to this count.

## Stage

Frontend Implementation DoD passed; Backend count-only provider reduction is next.

## Next Recommended Role

BACKEND

## Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Workout Detail Right Panel Removal And Query Elimination
Stage: Reduce the Workout sidebar loader/read-model chain to the retained weekly count
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-18-hito-workout-detail-right-panel-removal-and-query-elimination.md

Frontend now renders a route-local static `Future insights` placeholder and consumes only
`sidebarReadModel.week.completedWorkoutCount` and `scheduledWorkoutCount` for the factual count at
the bottom. Reduce the existing server provider/query/read-model chain to exactly those retained
current-week count fields after refreshing consumer reachability. Remove the unused distance,
FIT/result, insight, and other sidebar work without changing the count contract required by
`src/routes/workout.$date.tsx`. Preserve the core Workout route payload, authentication,
Calendar/workout persistence, results, FIT evidence, and all Frontend source. Add no compatibility
response, replacement query, or client calculation. Run focused Backend route/read-model checks
and update the parent item truthfully. Do not claim Global QA, hosted, release, or deployment
readiness.
```

## Blockers

None. The removed data-backed branches contained no action unavailable from the main content.

## Frontend Execution Preflight — 2026-08-18

- **Superseded outcome:** Ivan replaced complete visual removal with a retained static
  future-insights placeholder. `src/routes/workout.$date.tsx` remains the sole Frontend owner; the
  existing `aside`, `SidebarPanel`, `SidebarSection`, and two-column composition are reused.
- **Preserved action proof:** Calendar navigation remains in `WorkoutDetailTopBar`; edit and local
  activity-file access remain in its existing actions menu; result and activity-file actions remain
  in `CompletionActionPanel`, `CompletionPanel`, and the existing detail tabs.
- **Reuse/change budget:** new runtime artifacts: none. Replace the data-backed sidebar body with
  static factual copy and retain only the existing Backend-shaped completed/scheduled workout count.
  No fetch, calculation, state, additional data branch, metric, component, helper, CSS, or fallback
  is added.
- **Boundary and proof:** Backend loaders/read models, shared CSS/Design System, persistence, and
  fixtures are read-only. Run focused route formatting/lint/diff checks and one concise persisted
  workout smoke with and without a saved result at desktop and 375px. Return the server
  query/read-model reduction to the retained count to BACKEND through PRODUCT after this Frontend
  slice.

## Frontend Tracked Implementation Receipt — 2026-08-18

### Outcome

Frontend Implementation DoD is **Passed**. Ivan superseded complete panel removal with one retained
mostly static placeholder. The persisted Workout detail now uses the existing right-panel anatomy
to show `Future insights` and the factual copy `There isn't enough data yet to provide these inputs
and insights. This is a future feature.` At the bottom it retains only the existing Backend-shaped
completed-versus-scheduled workout count for the current week. The panel does not fetch, calculate,
or branch on insight, FIT/result, distance, or other metric data.

The route consumes only `sidebarReadModel.week.completedWorkoutCount` and
`scheduledWorkoutCount`. Its former distance, result-status, assignment, and latest-insight
rendering branches plus their route-local derived values are removed. The existing main content
remains the action owner.

### Files Changed

- `src/routes/workout.$date.tsx` — replaces the data-backed sidebar body with the static placeholder,
  retains only the Backend-shaped weekly workout count, and removes obsolete sidebar-only
  derivation.
- This canonical child item — records the superseded decision, validation, lifecycle, and exact
  Backend count-only reduction handoff.

No component, helper, CSS, token, API, loader, state, fixture, dependency, or runtime artifact was
added. Backend, shared Design System, persistence, schema, hosted state, and unrelated dirty files
were not modified.

### Validation Inventory

| Check                        | Scenario / environment                                                            | Result | Evidence                                                                                                                                                                            |
| ---------------------------- | --------------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Consumer reduction           | Focused source census                                                             | Passed | The route consumes only `completedWorkoutCount` and `scheduledWorkoutCount`; the static placeholder is unconditional and no insight/distance/FIT/result branch remains.             |
| Main actions                 | Direct route ownership plus browser smoke                                         | Passed | `Back to Calendar`, workout actions, `Add result`, the Result tab, and the existing `Activity file` menu entry remained available; Escape returned focus to `Open workout actions`. |
| Desktop without saved result | Fresh managed `qa_fixture`, `2026-08-17`, 1470x801                                | Passed | The placeholder and `1 of 4 workouts completed` rendered once; `Add result` and Calendar/menu actions remained; document width equalled 1470.                                       |
| Mobile with saved FIT result | Same artifact, `2026-08-18?tab=complete`, 375x812                                 | Passed | The same placeholder/count rendered once; Result, Activity file, Calendar, and bottom navigation remained available; document width equalled 375.                                   |
| Console and errors           | Both smoke states                                                                 | Passed | Browser console and page-error readbacks were empty.                                                                                                                                |
| Static validation            | Prettier, focused ESLint, Product contracts, production build, `git diff --check` | Passed | Route/task formatting, route lint, existing Product contract proofs, client/SSR/Nitro build, and diff hygiene completed successfully.                                               |
| Fixture cleanup              | Canonical design-profile reset                                                    | Passed | All disposable owned rows and retained storage objects returned to zero; the local auth identity was preserved.                                                                     |

### Boundary And Next Owner

The Product route still requires only the server-provided completed and scheduled current-week
workout counts. BACKEND is the next owner to reduce the existing provider/query/read-model chain to
exactly those fields and remove all unused distance, result/FIT, insight, and other sidebar work
through the parent item. No Backend source was changed in this Frontend slice.

Browser evidence was captured on managed PID 14215 while it was fresh and `receipt_matches`. After
this repository-derived receipt write, the same server remains healthy, loopback-only, and running
in `qa_fixture`, while freshness is `stale/artifact_missing` because the private Admin snapshot
marker no longer matches the task-record digest. No rebuild loop or post-receipt browser claim was
made.

No Global QA, hosted, release, deployment, staging, commit, or push claim is made. Role file:
`agents/frontend.agent.md`. Skill used: `skills/hito-frontend-design-system/SKILL.md`. No subagent
was used.

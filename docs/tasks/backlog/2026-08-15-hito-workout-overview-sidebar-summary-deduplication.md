# Hito Workout Overview Sidebar Summary Deduplication — 2026-08-15

## Work Item ID

2026-08-15-hito-workout-overview-sidebar-summary-deduplication

## Status

completed

## Type

Lite — Product presentation cleanup

## Priority

high

## Owner

FRONTEND

## Epic

runner-core-readiness

## Frontend Lane

Product

## Scope

Only the Workout Overview right `SidebarPanel` rendered by `src/routes/workout.$date.tsx`. Apply the change to every state of this one shared panel; no shared `hito-row-group` primitive changes.

## Archive Intent

Compact terminal closeout after focused source and browser proof.

## Task

Remove duplicated workout facts from the right summary: the `Workout type` section and `Execution` rows for Duration, Distance, Repeats, and Blocks. Retain Saved result/Result, executable target rows where present, skipped/rest assignment states, and This week progress. Do not add weather, AI insight, placeholder, or invented data in this slice.

## User Report

Inspector item `e5a1f23b-b4ba-47bd-9573-bb21603dd024`, captured `2026-08-15T12:45:18.622Z` on `/workout/2026-08-13?tab=overview`, Light `1470×801`, selected `div.hito-row-group.bg-background`. Ivan says Duration, Distance, Blocks, and Workout type already appear in the document and make the sidebar redundant; Saved result may remain. He asked to consider weather or insights later.

## Source Investigation

- `SidebarPanel` has one route-local owner in `src/routes/workout.$date.tsx`.
- `workoutIdentityRows()` produces the sole `Type` row for `Workout type`.
- `workoutSidebarExecutionRows()` produces Duration, Distance, Repeats, and Blocks; primary targets come separately from `workoutSidebarTargetRows()`.
- `Result`, Skipped, Assignment, and This week have distinct state/feedback roles and are not part of the removal request.

## Expected Behavior

The sidebar no longer repeats basic plan structure already visible in the Overview. It shows only distinct status/progress or executable-target information. If no unique Execution data remains, its empty-state behavior stays truthful. Weather and generated insight are absent until a separate Product/Backend-backed decision establishes their source and semantics.

## What Not To Touch

`hito-row-group` shared chrome, Workout document content, result persistence, route/navigation behavior, rest-day semantics, backend contracts, weather providers, AI generation, Design System primitives, Figma, hosted state, and Git lifecycle.

## Lite Preflight

- **Decision/evidence:** direct user decision plus source-proven rows in one Product route seam.
- **Existing seam:** `SidebarPanel`, `workoutIdentityRows`, and `workoutSidebarExecutionRows` in the Workout route.
- **Smallest change:** remove unused readback sections/rows and simplify dead helper paths; preserve unique summary state.
- **New runtime artifacts:** none.
- **Focused proof:** representative planned, saved-result, skipped, rest, and target-bearing states; responsive containment, link/keyboard preservation, console health, focused formatting/lint/diff checks.
- **Promotion:** promote if weather/insight requires new persisted/backend truth, another route must change, or a shared DS primitive is implicated.

## Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Workout Overview Sidebar Summary Deduplication
Mode: Lite
Frontend lane: Product
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-overview-sidebar-summary-deduplication.md

Ivan explicitly asked to start. Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md. Re-check the item, dirty files, and the current route seam before writing.

In `src/routes/workout.$date.tsx`, remove the Overview sidebar's duplicate `Workout type` section and the `Execution` readbacks for Duration, Distance, Repeats, and Blocks. Preserve Result/Saved result, executable target rows, skipped/rest assignment state, This week progress, route behavior, and all shared `hito-row-group` chrome. If removal makes a helper unused, delete only the proven dead local helper path.

Do not introduce weather, AI insight, placeholder content, new data, backend calls, a shared primitive, tokens, Figma work, hosted changes, staging, commit, push, or deployment. Weather/insight is a later Product decision requiring an established source.

Run focused source checks plus representative local browser proof for planned, saved-result, skipped, rest, and target-bearing states when the managed fixture can truthfully render them. Verify Light/Dark responsive containment, navigation/keyboard preservation, console health, Prettier, focused ESLint, and `git diff --check`. Promote to Tracked and return to PRODUCT if a different owner or state contract is required. Record an English Lite receipt in this item; do not claim Global QA or release readiness.
```

## Frontend Lite Receipt — 2026-08-15

- **Task / mode:** Hito Workout Overview Sidebar Summary Deduplication; Frontend Product; Lite.
- **Outcome and evidence:** the route-owned Overview sidebar no longer repeats the `Workout type`
  section or Duration, Distance, Repeats, and Blocks. The current managed `qa_fixture` rendered the
  distinct Result/Saved result, executable target, Skipped, rest Assignment, and This week content
  unchanged across representative states.
- **Existing seam reused:** the existing `SidebarPanel`, `SidebarSection`,
  `workoutSidebarTargetRows()`, and shared `hito-row-group` / `hito-list-row` chrome remain the sole
  owners. No shared primitive, token, CSS, data, state, provider, or Backend path was added.
- **Net deletion:** removed the duplicate render branches plus the now-unreachable local
  `workoutIdentityRows()`, `workoutSidebarExecutionRows()`, and `ReadbackRow` helpers and their three
  exclusive imports. The non-rest Execution section now renders only existing executable targets or
  the existing truthful no-target message.

### Files Changed

- `src/routes/workout.$date.tsx`
- `docs/tasks/backlog/2026-08-15-hito-workout-overview-sidebar-summary-deduplication.md`

### Focused Proof

| Check                      | Scenario / environment                                            | Result | Evidence                                                                                                                                                                            |
| -------------------------- | ----------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source deletion            | Workout route                                                     | Passed | Zero reachability for `Workout type`, `workoutIdentityRows`, `workoutSidebarExecutionRows`, `primaryStructureMetrics`, and the local `ReadbackRow`; exclusive imports were removed. |
| Planned and target-bearing | `2026-08-15`, desktop Light plus 375x812 Light/Dark               | Passed | Sidebar contained only Execution with `Estimated HR · Easy full band` and This week; page width stayed `1470/1470` and `375/375`.                                                   |
| Saved Result               | Completed FIT-backed `2026-08-10`, desktop Light and 375x812 Dark | Passed | Result / Activity file, target-only Execution, and This week remained; duplicate structure labels were absent.                                                                      |
| Skipped                    | `2026-08-13`, desktop Light and 375x812 Dark                      | Passed | Saved result, target-only Execution, Skipped explanation, and This week remained; duplicate structure labels were absent.                                                           |
| Rest assignment            | `2026-08-12`, desktop Light and 375x812 Dark                      | Passed | Assignment (`Fixed weekday rest day.`) and This week remained; no non-rest Execution or Workout type section rendered.                                                              |
| Responsive containment     | Desktop 1470x801 and exact 375x812, Light/Dark                    | Passed | Page scroll width equalled viewport width in every recorded state; mobile sidebar measured `343px` within the 375px page and did not overflow.                                      |
| Navigation and keyboard    | Completed Result/Feedback tabs and planned Previous/Next cards    | Passed | ArrowRight/ArrowLeft changed and restored the selected result tab; Next opened `/workout/2026-08-16`, browser Back restored `/workout/2026-08-15`.                                  |
| Console                    | Complete focused replay                                           | Passed | Browser warning/error log was empty.                                                                                                                                                |
| Static and build           | Route and canonical item                                          | Passed | Focused Prettier and ESLint passed; managed client/SSR/Nitro build completed and the loopback fixture was fresh and healthy before this receipt.                                    |

The current fixture did not expose a non-rest workout with zero executable targets, so the no-target
message was source-proven rather than separately browser-replayed. Its existing copy and branch were
preserved, and this limitation does not promote the one-owner presentation deletion to Tracked.

Weather, generated insight, placeholder content, persistence, Backend, Design System, Figma, hosted,
Git lifecycle, Global QA, and release readiness remain outside this completed Lite result.

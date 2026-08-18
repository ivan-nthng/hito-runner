# Hito Workout Interaction Recovery — 2026-08-15

## Work Item ID

2026-08-15-hito-workout-interaction-recovery

## Status

completed

## Type

Tracked — Frontend Product interaction recovery

## Priority

high

## Owner

FRONTEND

## Epic

runner-core-readiness

## Stage

Product implementation completed; independent QA replay pending Product dispatch

## Frontend Lane

Product

## Depends On

`2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery`

## Evidence From

`2026-08-15-hito-workout-core-flow-qa-scenario-catalog`

## Scope

Only two failed interaction contracts: calendar Move Undo survives immediate reload inside its documented grace window, and Workout Detail's `Back to Calendar` action activates through native Enter.

## Task

Find and fix the first Product owner for each failed contract. `manual-calendar-actions.ts` already persists a last-move undo candidate to session storage; QA proved that it disappears immediately after reload. The Workout Detail Back link uses `HitoButton asChild` and a route `Link`; determine whether its ignored Enter is route-local or a shared primitive defect. Fix only the proven local Product seam; return a shared-button cause to PRODUCT for Design System routing.

## Required Outcome

1. A successful manual move displays Undo, persists across immediate reload while unexpired, then restores the original date exactly once; expiry/other plan changes remain truthful.
2. `Back to Calendar` has native keyboard activation equal to pointer activation, without changing its route destination, focus behavior, or visual composition.
3. The focused QA retry can cover WC-04, desktop drag if deterministically supported, and WC-08 after the Backend fixture recovery is available.

## Boundaries

Do not change active-plan persistence, Rest/FIT fixture lifecycle, HitoButton/shared Design System code without a demonstrated shared cause, QA fixtures, hosted state, providers, Git lifecycle, or unrelated dirty work.

## Validation

Reproduce both failures against a fresh managed local fixture after the dependency completes. Run focused source checks and Product browser proof at 1470×801 and 375×812, Light/Dark where the changed flows render; verify reload/readback, expiry, focus, Enter, pointer navigation, console, and containment. Request a bounded read-only QA retry after implementation. Record an English tracked receipt without Global QA or release claims.

## Frontend Execution Preflight — 2026-08-15

- **Mode and owner:** Tracked Frontend Product implementation. The Backend dependency is completed;
  the task reuses the existing Calendar interaction and Workout Detail route seams and does not
  admit a second production writer.
- **Current discriminators:** the failed QA artifact proves that a persisted manual move remains on
  its target after reload while the visible Undo disappears, and that the visible workout-detail
  link ignores native Enter while pointer activation reaches Calendar. Fresh managed browser replay
  will distinguish client hydration/readback loss from expiry for Undo and route composition from
  shared `HitoButton` behavior for Enter before production source is changed.
- **Existing seams reused:** the single `manual-calendar-actions.ts` session-state owner for the
  transient move candidate, and the existing route `Link`/`HitoButton asChild` composition in
  `workout.$date.tsx`. Existing Calendar projection, storage key, mutation callers, router
  destination, Hito Button contract, and visual classes remain the only owners.
- **Change budget:** new runtime artifacts: none. No state map, helper file, component, wrapper,
  storage key, persistence path, fixture path, or compatibility behavior will be added. Only an
  obsolete reload-loss path or route composition proven incorrect by the focused replay may be
  simplified.
- **Dirty boundary:** `workout.$date.tsx` already contains accepted unrelated Overview-sidebar
  deduplication hunks; this task will preserve those bytes and touch only the separate Back action
  if its route-local ownership is demonstrated. `manual-calendar-actions.ts` is clean before this
  task.
- **Focused proof:** fresh managed `qa_fixture`; Move -> immediate reload -> Undo -> reload with one
  restored row and no duplicate; expiry/other-plan-change source truth; pointer and native Enter
  parity; exact desktop/mobile Light/Dark containment, focus, overflow, and console health; focused
  formatting, lint, Product validation, and diff hygiene.
- **Stop boundary:** return to PRODUCT without a route workaround if the Enter defect belongs to
  shared `HitoButton`; stop before Backend, fixture, shared Design System, hosted, provider, or Git
  lifecycle changes.

## Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Workout Interaction Recovery
Stage: Product implementation after Backend fixture recovery
Mode: Tracked
Frontend lane: Product
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-interaction-recovery.md
Depends on: docs/tasks/backlog/2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery.md
Evidence from: docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md

Do not start until the dependency is completed and the fresh local fixture is admissible. Read AGENTS.md, agents/frontend.agent.md, and skills/hito-frontend-design-system/SKILL.md. Re-check the canonical item, source, and dirty boundary before writing.

Reproduce and repair only these Product contracts: (1) calendar Move Undo must survive an immediate reload while its documented grace window remains unexpired, then restore the original date exactly once; and (2) Workout Detail's `Back to Calendar` must respond to native Enter as pointer activation does. Inspect `src/components/calendar/manual-calendar-actions.ts` for inappropriate cache/reset/readback behavior. Inspect the route-local `HitoButton asChild`/`Link` composition; if the first incorrect cause is shared HitoButton behavior, stop and return that Design System boundary to PRODUCT instead of patching around it locally.

Do not modify Backend Rest/FIT lifecycle, QA fixture logic, shared Design System source absent a proven shared root cause, hosted state, providers, Git lifecycle, or unrelated dirty hunks. Run focused browser/readback proof only when the dependency fixture is ready, then ask the existing QA sidebar role for bounded read-only WC-04/WC-08 replay. Record an English tracked receipt; do not claim Global QA or release readiness.
```

## Frontend Tracked Implementation Receipt — 2026-08-15

### Preflight And Outcome

- **Role / lane / mode:** FRONTEND / Product / Tracked.
- **Canonical owner reused:** `src/components/calendar/manual-calendar-actions.ts` remains the one
  owner for the transient move/Undo projection and its existing `sessionStorage` record. No new
  runtime artifact, state map, storage key, helper, wrapper, persistence path, or compatibility
  behavior was added.
- **Product outcome:** Move Undo now survives an immediate reload while its existing window is
  unexpired, restores the workout to the original date, and leaves one visible workout card with no
  target-date duplicate after repeated readback reloads. The existing expiry and plan-identity
  invalidation remain in force.
- **Back action outcome:** the reported native-Enter failure did not reproduce in the supported
  Chrome control path. The existing route composition is a valid native anchor and already provides
  pointer/Enter parity, so no route or shared Design System change was made.

### Demonstrated Cause And Fix

- The server cannot read origin-scoped `sessionStorage`, while the existing client state initializer
  attempted to read the stored Undo candidate during hydration. The red replay lost the visible
  affordance after reload; an intermediate restore-effect-only candidate exposed the same timing
  defect as React hydration error `#418` because client and server markup differed.
- `lastMoveUndo` now starts from the same factual `null` value on server and client. The existing
  plan-backed hook restores the already persisted candidate after hydration, once the active plan id
  is available. Invalid, expired, or other-plan candidates now clear the existing cache and storage
  together instead of leaving a stale stored value.
- The first browser control surface ignored Enter for all tested anchors, including an unrelated
  native 404-page link, while activating native buttons. Chrome then activated the unchanged
  `Back to Calendar` anchor through physical Tab followed by Enter. This discriminates a browser
  control limitation from a Product route or `HitoButton` defect.

### Files Inspected / Changed

- Changed: `src/components/calendar/manual-calendar-actions.ts`.
- Lifecycle receipt only: this canonical item.
- Inspected but not changed for this task: `src/routes/workout.$date.tsx` and shared `HitoButton`.
  The route's pre-existing Overview-sidebar deduplication hunks were preserved byte-for-byte.

### Validation Inventory

| Check                      | Scenario / environment                       | Result                     | Evidence                                                                                                                                                                                                                    |
| -------------------------- | -------------------------------------------- | -------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh artifact admission   | Managed loopback `qa_fixture`                | Passed before final replay | Rebuilt runtime was healthy, compatible, loopback-bound, and `artifactFreshness: fresh` / `receipt_matches` (PID 60341).                                                                                                    |
| Red discriminator          | Calendar Move, then immediate reload         | Passed                     | Persisted workout remained on the target date while the pre-fix visible Undo disappeared. The first restore candidate exposed React hydration error `#418`, identifying the server/client initializer mismatch.             |
| Move reload survival       | Chrome, manual plan, Aug 17 -> Aug 18        | Passed                     | After mutation: source absent, target present, Undo showed 6 seconds. After reload, the same target and Undo returned after the plan snapshot became available (500 ms), with no new console warning/error.                 |
| Undo exactly-once readback | Chrome, Undo followed by two reloads         | Passed                     | Both reloads showed one visible Aug 17 card in the active responsive composition and no Aug 18 card. The responsive desktop/mobile duplicate DOM branches each retained the same single record; no second workout appeared. |
| Expiry / plan truth        | Existing timer and plan-id guard             | Passed                     | Runtime proved the existing 7-second affordance expires; source keeps the existing active-plan-id comparison and now clears mismatched/expired session state atomically.                                                    |
| Back pointer activation    | Chrome, Workout Detail                       | Passed                     | Rendered owner was `A[href="/"]`, `tabIndex=0`, with the existing Hito button composition. Pointer reached Calendar and left focus on `BODY`.                                                                               |
| Back native Enter          | Chrome, physical keyboard path               | Passed                     | Physical Tab sequence reached `Back to Calendar`; Enter reached the same `/` destination and the same post-navigation `BODY` focus. The first browser's anchor-wide Enter failure was not reproduced.                       |
| Desktop presentation       | 1470x801, Light and Dark                     | Passed                     | Calendar retained one visible source card, no target duplicate, and `scrollWidth === innerWidth`; navigation remained available.                                                                                            |
| Mobile presentation        | Exact 375x812, Light and Dark                | Passed                     | Calendar and Workout Detail stayed at 375 px page width with no horizontal overflow; the source card and Back action remained visible and operable.                                                                         |
| Console health             | Final corrected replay and responsive matrix | Passed                     | No new warnings or errors after the final build; the earlier timestamped hydration error belonged to the discarded intermediate candidate and was not present after the owner fix.                                          |
| Focused static checks      | Changed source and repository diff           | Passed                     | Prettier, focused ESLint, and `git diff --check` passed.                                                                                                                                                                    |
| Production build           | Managed fixture restart                      | Passed                     | Final production build completed and the fresh managed server started successfully before browser proof.                                                                                                                    |

### Preserved Boundaries

Backend Rest/FIT lifecycle, fixture implementation, move mutation semantics, active-plan
persistence, shared Design System source, `HitoButton`, Workout Detail destination/composition,
hosted/provider state, Git lifecycle, and unrelated dirty work were unchanged. No fixture row was
hand-shaped; the local Product-acceptance identity was exercised only through ordinary UI actions.

### Coverage And Freshness Notes

- Independent QA was intentionally not self-dispatched. PRODUCT should route the existing QA role
  for the separate WC-04/WC-08 replay; this receipt claims Implementation DoD only, not Global QA,
  release, hosted, or production readiness.
- Desktop pointer drag was not required to prove the repaired reload/Undo contract; the ordinary
  accessible Move menu path exercised the same canonical action owner. Independent QA may retain
  drag as a catalog-specific coverage item when its control surface is deterministic.
- After all browser evidence completed, unrelated checkout movement changed the private Admin
  repository snapshot digest. The managed server remained running and healthy, but checkout-wide
  status became stale (`artifact_missing`, digest
  `c04da3dfeea08cc3d9cb4b577cb4acac4b000e042aeb5cfb535cca99c6c32bdf`). This does not rewrite the
  fresh admitted artifact used for the focused proof, but the next QA owner must rebuild/admit a
  fresh artifact after repository writers are quiet before claiming current-checkout browser proof.

### Next Owner And Blockers

- **Next owner:** PRODUCT, to dispatch independent QA replay of WC-04 and WC-08.
- **Blockers:** none for the Frontend Product implementation slice.

# HITO-295 — Remove Legacy Adaptive Surfaces From Calendar

- **Work Item ID:** HITO-295
- **Status:** In progress
- **Type:** Bug
- **Priority:** Highest
- **Primary Area:** Runner
- **Owner:** BACKEND
- **Stage:** Release
- **Canonical Task:** [HITO-295 in Notion](https://app.notion.com/p/Remove-legacy-adaptive-check-in-and-future-blueprint-from-Calendar-3ccfe5f58cf581a89c64c20eb2102485)
- **Epic:** none

## Scope

Remove the two legacy adaptive-planning presentations that currently render before the real runner
Calendar:

1. `Next training block` / `Next block check-in` from `AdaptiveContinuationPanel`;
2. `Future training blueprint` provisional rows from `BlueprintProjectionReadback`.

The Calendar must start with its real month/week controls and runner-owned Calendar days. Preserve
the accepted HITO-292 plus/overflow day-action contract and every real confirmed workout.

## Archive Intent

Retain through production acceptance, then compact to the final source change, focused QA receipt
and any deliberately preserved non-UI adaptive boundary.

## Task

FRONTEND removes both production render paths from the existing `Calendar` composition without
adding a flag, replacement panel, second Calendar route or client-side product state. Independent
QA proves the panels are absent and the Calendar/day actions remain usable. Release follows only
after explicit authority.

## User Report

On 2026-08-30 Ivan supplied production screenshots showing that the large adaptive continuation
form and the full future Blueprint list still occupy the Calendar page after HITO-292 was released.
Ivan expected the unnecessary surfaces to have been removed.

## Evidence

- Screenshot 1: production dark mode renders `Next training block`, `Planned` and the complete
  `Next block check-in` form before Calendar.
- Screenshot 2: production dark mode renders `Future training blueprint` with provisional rows
  labelled `Planned · details closer to the date`.
- `src/components/Calendar.tsx` unconditionally renders `AdaptiveContinuationPanel` and, when
  projections exist, `BlueprintProjectionReadback` before the month/week Calendar.
- `git blame` binds both render paths to `1eb0b280` (`feat(runner): establish adaptive training
foundation`). HITO-292 did not touch or claim these surfaces.

## Observed Behavior

The accepted adaptive engine's continuation and provisional projection UI is still a top-level
Calendar consumer. It can consume most of the viewport before the runner reaches actual Calendar
days.

## Expected Behavior

- Calendar begins with the month/week header followed by the real Calendar grid/list.
- Neither legacy adaptive panel is rendered at any continuation/projection state.
- Confirmed runner-owned workouts, plan creation, Saved review/Restore, FIT/activity ingestion and
  the HITO-292 plus/overflow actions remain unchanged.
- English/Portuguese and Light/Dark retain existing Calendar behavior; removing the panels adds no
  replacement copy.

## Source Investigation

`Calendar.tsx` imports and renders `AdaptiveContinuationPanel` unconditionally. It also renders the
route-local `BlueprintProjectionReadback` whenever `blueprintReadModel.projections.length > 0`.
Both appear before the real Calendar branch. The adaptive read model is still server-shaped input,
but visible rendering is owned solely by this Frontend composition.

## Confirmed Root Cause

This is not stale Vercel output or a theme/layout issue. Production is faithfully executing two
legacy render paths that remain in `Calendar.tsx`. The earlier HITO-292 change was scoped only to
day add/overflow actions, so those paths were never removed.

## What Not To Touch

- Do not change plan creation, AI authoring, compiler, persistence, Supabase, migrations, provider
  calls, adaptive data lineage or confirmed Calendar workouts.
- Do not delete adaptive server/domain code or historical evidence merely because the two UI
  consumers are removed.
- Do not change HITO-292 day eligibility, plus/overflow menus, FIT review/confirm or manual workout
  actions.
- Do not introduce a feature flag, second Calendar route, replacement dashboard or compatibility
  UI.
- Preserve all unrelated dirty work byte-for-byte.

## Validation Expectations

1. Focused source proof shows zero production render/import of the two legacy Calendar surfaces.
2. Existing Calendar projection/action validators and Design System validator pass.
3. Browser QA with a runner whose read model contains an active continuation and future projections
   proves both surfaces absent at desktop and mobile widths, in Light/Dark and English/Portuguese.
4. Browser QA verifies one past Rest plus action, one past workout overflow action, one today action
   and one future action still open the accepted HITO-292 paths.
5. Build passes; console and relevant HTTP requests remain healthy. Production is not claimed until
   the exact Git-backed deployment is READY and independently rechecked.

## Next Recommended Role

BACKEND

## Implementation And Independent QA Receipt

- FRONTEND removed both Calendar render paths, their now-unreachable component, the route prop
  plumbing and the zero-inbound projection status helper. No backend, persistence, plan-authoring,
  confirmed-workout or HITO-292 day-action contract changed.
- Changed source boundary: `src/components/Calendar.tsx`,
  `src/components/calendar/AdaptiveContinuationPanel.tsx` (deleted),
  `src/components/calendar/calendar-projection.ts` and `src/routes/index.tsx`.
- Focused manual-workout and Calendar-context validators, focused ESLint, diff hygiene and a clean
  task-only production build passed. The dirty-checkout build remains blocked by unrelated
  documentation migration work outside HITO-295.
- Independent QA passed on a fresh managed artifact at exact 1470x801 and 375x812 viewports: both
  legacy surfaces were absent, the Calendar rendered first, containment held, and accepted plus
  and overflow actions remained reachable.
- The disposable fixture reset returned all 26 task-owned counts and storage objects to zero; the
  managed server and project-qualified local Supabase runtime were stopped. No production data,
  provider or hosted persistence mutation occurred.
- A separate existing `continuation_actions` fixture assertion still expects 28 rows while the
  current compiler emits 29. It failed before browser execution, cleaned itself and is not evidence
  of a HITO-295 product regression.

Production remains unproven until the exact accepted paths are committed, pushed and the
Git-backed Vercel deployment is READY with canonical HTTP 200.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: HITO-295 — Remove Legacy Adaptive Surfaces From Calendar
Mode: Tracked release
Notion: https://app.notion.com/p/Remove-legacy-adaptive-check-in-and-future-blueprint-from-Calendar-3ccfe5f58cf581a89c64c20eb2102485
Repository document: docs/tasks/backlog/2026-08-30-hito-remove-legacy-adaptive-calendar-surfaces.md

Read AGENTS.md, agents/backend.agent.md, the release quality-sweep runbook, the live Notion Task and
this repository document. Ivan has explicitly authorized commit, push and deployment. Preserve all
unrelated dirty work byte-for-byte and keep the repository-wide release freeze as sole writer.

Release only these accepted HITO-295 paths:
- src/components/Calendar.tsx
- src/components/calendar/AdaptiveContinuationPanel.tsx (deletion)
- src/components/calendar/calendar-projection.ts
- src/routes/index.tsx
- docs/tasks/backlog/2026-08-30-hito-remove-legacy-adaptive-calendar-surfaces.md

Classify the full dirty inventory, exact-stage only those paths, and validate the staged patch plus
a clean task-only production build. Commit to main, push, confirm main == origin/main, then prove the
Git-backed Vercel production deployment is READY and the canonical production URL returns HTTP 200.
Do not include HITO-290 documentation migration bytes, create a branch/worktree/runtime, or mutate
Supabase, hosted data or providers. Check the Release Delivery step only after exact production
proof, then return HITO-295 to PRODUCT with the compact release receipt.
```

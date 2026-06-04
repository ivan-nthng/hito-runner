# First-Plan Calendar Pre-Start Rendering Polish

## Status

archived

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Close out first-plan calendar pre-start rendering polish after QA pass.

## Stage

ARCHITECT closeout / calendar pre-start polish

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Use the archived first-plan calendar pre-start rendering polish plan as historical QA evidence only.

STAGE:
ARCHITECT reference / archived calendar pre-start polish

CONTEXT:
- Source path: docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- This narrow pre-start rendering polish track is complete and QA-passed.
- The generic Hito DS calendar/workout playground remains separate:
  docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md

GOAL:
Do not reopen this archived plan unless a new concrete product regression is found.

REQUIREMENTS:
- Treat this plan as historical evidence for the implemented pre-start rendering behavior.
- Keep generic calendar/workout state playground work in the separate Hito DS playground spec.
- Do not change backend generation, persistence, row counts, schedule semantics, first-plan
  authoring, or DS playground implementation from this archived plan.

OUTPUT:
1. Task
2. Stage
3. Historical evidence referenced
4. Current active owner, if any
5. Blockers
```

## Owner

DESIGNER / FRONTEND / QA

## Last Updated

2026-06-04

## Implementation Notes

- 2026-06-01: FRONTEND implemented the pre-start display state in `src/components/Calendar.tsx`
  using `snapshot.planMeta?.startDate`. Month/week cells before the plan start now render as
  date-only outside-plan cells with no workout/rest semantics, links, tooltips, status markers, or
  feedback markers. The start date keeps normal workout/rest rendering and adds a compact `Plan
  starts` marker. Narrow month view collapses consecutive pre-start dates into one quiet
  `Before plan starts` range row.
- 2026-06-04: ARCHITECT scope correction: this plan remains the narrow first-plan / active-plan
  pre-start rendering polish QA track. The broader Hito DS calendar/workout day playground was split
  into `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md` so this
  plan does not become the owner of generic calendar/workout state anatomy.
- 2026-06-04: Final QA passed and the track was closed. The built-in Codex browser was used first.
  A disposable saved-mode fixture used `plan.startDate = 2026-05-29`. May 2026 showed
  `Plan starts May 29. Earlier days are outside this plan.` Dates before `2026-05-29` rendered as
  outside-plan/pre-start cells with no `Rest`, rest glyphs, workout titles, status markers,
  feedback markers, tooltips, or workout-detail links. The actual plan start date rendered normally
  with a compact `Plan starts` marker; in-plan rest and workout days remained normal; week view used
  muted non-interactive pre-start cells; mobile collapsed `May 1-28` into `Before plan starts`.
  Narrow viewport proof had `innerWidth = 375`, `documentElement.scrollWidth = 375`, and
  `body.scrollWidth = 375`. CLI validation passed:
  `npm exec eslint -- src/components/Calendar.tsx`, `git diff --check`, and `npm run build`.
  Screenshot evidence:
  `qa-artifacts/screenshots/2026-06-04/calendar-pre-start-closeout/`.

## QA Closeout Evidence

- Verdict: Passed.
- Browser Path Preflight: built-in Codex browser was used first.
- Disposable saved-mode fixture: `plan.startDate = 2026-05-29`.
- Partial first-month proof: May 2026 displayed
  `Plan starts May 29. Earlier days are outside this plan.`
- Pre-start cells before `2026-05-29` rendered as outside-plan/pre-start cells with no `Rest`, rest
  glyphs, workout titles, status markers, feedback markers, tooltips, or workout-detail links.
- Plan start date rendered normally with a compact `Plan starts` marker.
- In-plan rest and workout days remained normal.
- Week view rendered pre-start cells as muted non-interactive cells.
- Mobile/narrow viewport had no horizontal overflow: `innerWidth = 375`,
  `documentElement.scrollWidth = 375`, `body.scrollWidth = 375`.
- Mobile collapsed the pre-start range into `May 1-28` / `Before plan starts`.
- CLI passed: `npm exec eslint -- src/components/Calendar.tsx`, `git diff --check`, `npm run build`.
- Screenshot folder: `qa-artifacts/screenshots/2026-06-04/calendar-pre-start-closeout/`.

## Context

The long-horizon monthly audit passed persistence and safety checks, but the first partial calendar
month looked visually noisy because pre-start rest placeholders appeared before the actual plan start
date.

This belongs to frontend/design polish because the backend schedule truth was correct.

## Problem Definition

Calendar users can misread the first partial month when many days before plan start render as rest
placeholders. The product should make it clearer that those days are outside the plan window without
changing canonical plan rows or schedule semantics.

## Scope

- noisy pre-start rest placeholders before plan start
- first partial month readability
- calendar display polish
- Hito DS reuse for labels, muted states, empty states, and calendar cell rhythm

General calendar day and workout-day playground coverage is out of scope for this plan. That work is
tracked separately in `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`.

## Non-Goals

- no backend schedule semantics changes unless later proven necessary
- no persistence changes
- no first-plan generation changes
- no production envelope adoption
- no route redesign outside the relevant calendar surface

## Suggested Slice Order

1. DESIGNER audit and recommendation.
2. FRONTEND implementation using existing Hito DS primitives.
3. QA browser proof for partial first month, normal full month, and narrow viewport.

## QA Expectations

- first partial month should not look like a long rest block before the plan starts
- dates inside the plan window must still render normally
- fixed rest days inside the plan window must remain visible as rest
- month navigation, hover/focus tooltips, workout links, and narrow layout must remain stable

## Exit Criteria

- selected design behavior is documented
- frontend slice is bounded
- backend semantics remain untouched unless a future plan proves otherwise
- QA passed for month, week, and mobile/narrow pre-start rendering
- plan is archived because it no longer guides active execution

## Suggested Next Step

None for this archived track. Related generic Hito DS calendar/workout state playground work remains
separate in `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`.

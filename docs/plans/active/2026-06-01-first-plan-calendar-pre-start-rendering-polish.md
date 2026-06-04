# First-Plan Calendar Pre-Start Rendering Polish

## Status

in_progress

## Type

plan

## Priority

medium

## Next Recommended Role

QA

## Task

Validate first-plan calendar pre-start rendering polish for partial first months.

## Stage

QA validation / calendar pre-start days

## Exact Handoff Prompt

```text
ROLE: QA

TASK:
Validate first-plan calendar pre-start rendering polish for partial first months.

STAGE:
QA validation / calendar pre-start days

CONTEXT:
- Source path: docs/plans/active/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- The completed production blueprint wave is archived at docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md.
- Frontend implemented the pre-start display state in `src/components/Calendar.tsx` using
  `snapshot.planMeta?.startDate`.
- Month/week cells before plan start should render as date-only outside-plan cells with no workout
  or rest semantics, links, tooltips, status markers, or feedback markers.
- Narrow month view should collapse consecutive pre-start dates into one quiet `Before plan starts`
  range row.

GOAL:
Validate that pre-start calendar dates no longer look like planned rest days and that normal in-plan
calendar behavior remains stable.

REQUIREMENTS:
- Use built-in Codex browser first unless blocked.
- Test a partial first month where plan start is near month end.
- Test a normal full in-plan month.
- Test week view.
- Test narrow/mobile layout.
- Verify pre-start dates do not show `Rest`, rest glyphs, workout labels, links, tooltips, status
  markers, or feedback markers.
- Verify actual plan start date and in-plan rest/workout dates still render normally.
- Store routine screenshots under
  `qa-artifacts/screenshots/YYYY-MM-DD/first-plan-calendar-pre-start-polish-qa/`.
- Do not edit product code.
- Do not run migrations.

OUTPUT:
1. Task
2. Stage
3. Browser Path Preflight
4. Scope tested
5. Partial first-month evidence
6. Full in-plan month evidence
7. Week-view evidence
8. Narrow/mobile evidence
9. Issues found
10. Screenshot/artifact evidence
11. Verdict
12. Blockers
```

## Owner

DESIGNER / FRONTEND / QA

## Last Updated

2026-06-03

## Implementation Notes

- 2026-06-01: FRONTEND implemented the pre-start display state in `src/components/Calendar.tsx`
  using `snapshot.planMeta?.startDate`. Month/week cells before the plan start now render as
  date-only outside-plan cells with no workout/rest semantics, links, tooltips, status markers, or
  feedback markers. The start date keeps normal workout/rest rendering and adds a compact `Plan
  starts` marker. Narrow month view collapses consecutive pre-start dates into one quiet
  `Before plan starts` range row.

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

## Suggested Next Step

Run QA browser proof for a partial first month, a normal in-plan month, week view, and narrow
viewport.

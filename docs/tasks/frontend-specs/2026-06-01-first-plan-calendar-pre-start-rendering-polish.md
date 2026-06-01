# First-Plan Calendar Pre-Start Rendering Polish

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Polish saved-mode calendar rendering for days before the active plan start date.

## Stage

FRONTEND implementation

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Polish saved-mode calendar rendering for days before the active plan start date.

STAGE:
FRONTEND implementation

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- Active plan: docs/plans/active/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- QA evidence: docs/tasks/qa-reports/2026-05-30-long-horizon-first-plan-monthly-audit.md
- Current calendar surface: src/components/Calendar.tsx
- Current snapshot truth includes snapshot.planMeta?.startDate.

CONSTRAINTS:
- Treat this as rendering polish only.
- Do not change backend plan generation, persisted rows, row counts, review/confirm, workout sequencing, or fixed rest-day semantics.
- Pre-start dates are outside the active plan window, not planned rest days.
- Reuse existing Hito DS calendar, typography, marker, muted, divider, and status primitives where possible.
- Keep calendar navigation, month/week switching, workout links, completion markers, feedback markers, and normal in-plan rest days stable.

OUTPUT:
Use the project role output format.
```

## Owner

DESIGNER

## Last Updated

2026-06-01

## Related Sources

- `docs/plans/active/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md`
- `docs/tasks/qa-reports/2026-05-30-long-horizon-first-plan-monthly-audit.md`
- `docs/current-product.md`
- `docs/current-system.md`
- `src/components/Calendar.tsx`
- `src/lib/training.ts`
- `src/styles.css`
- `qa-artifacts/screenshots/2026-05-30/long-horizon-plan-monthly-audit/`

## Problem Summary

Long-horizon first plans can start near the end of the first visible calendar month. When earlier dates in that month read as rest placeholders, users can misread the calendar as if the plan already started earlier and assigned many rest days.

This is not a backend issue:

- the plan start date is persisted correctly
- the target date and row counts are correct
- workout sequencing and fixed rest-day invariants are correct
- the confusing part is display semantics before `plan.start_date`

Design root cause:

The calendar currently does not clearly distinguish `outside the plan window` from `inside the plan window, planned rest`.

## UX Decision

Days before `snapshot.planMeta.startDate` must render as an `outside-plan / pre-start` state, not as rest days.

Canonical rule:

`pre-start date < plan start date` means `calendar date exists, plan has not started, no workout/rest semantics apply`.

This preserves persisted schedule truth while making the first partial month easier to scan.

## State Model

Calendar date states should resolve in this order:

1. Outside visible month.
2. Before active plan start date.
3. After active plan end date, if an end boundary is available.
4. Today.
5. In-plan workout day.
6. In-plan rest day.
7. Completed / skipped / partial result state.
8. Feedback/evidence marker state.

For this slice, the required new state is only `before active plan start date`.

Implementation should derive the state from `snapshot.planMeta?.startDate` and the cell date. If `planMeta` is missing, do not apply pre-start behavior.

## Pre-Start Day State

### Desktop Month Grid

Pre-start in-month cells should remain visible to preserve calendar geometry, but they should be visually quiet.

Render:

- date number only
- muted foreground
- lower opacity than normal in-plan dates, but still readable
- no workout title
- no workout type label
- no workout glyph
- no rest label
- no rest glyph
- no status marker
- no feedback/evidence marker
- no tooltip
- no route link to workout detail

Do not render:

- `Rest`
- `Rest day`
- fixed-rest styling
- rest glyph
- completion marker
- feedback marker
- hover tooltip content

Recommended visual treatment:

- Keep grid border/hairline so the month layout remains stable.
- Use date-only muted style similar to outside-month cells, but slightly more readable than outside-month dates.
- Hover may be disabled or reduced to a very faint wash; it must not imply a workout detail is available.
- Cursor should not imply action.

### Desktop Week Strip

If week view contains pre-start dates:

- render the same date-only muted state
- do not show `Rest`
- do not link to workout detail
- keep the week row geometry stable

### Mobile Month List

Mobile should not render a long stack of repeated pre-start empty rows when a plan starts late in the month.

Recommended mobile behavior:

- Collapse consecutive pre-start dates into one quiet range row.
- Example: `May 1-28` plus `Before plan starts`.
- The collapsed row is non-interactive.
- After the collapsed row, render plan start date and later dates normally.

If implementation risk is lower with date-only rows, date-only pre-start rows are acceptable for the first frontend slice, but they must not say `Rest` or `Rest day`. The preferred final behavior is the collapsed range row because it is more scannable on narrow screens.

## Start-Day Affordance

The actual plan start date should be understandable without shouting.

Recommended start-day treatment:

- Keep the normal workout/rest rendering for the start date.
- Add one compact `Plan starts` marker on the start date.
- Use existing Hito status pill or micro-label treatment with `signal` or muted signal tone.
- Place the marker near the date number or above the workout type line, depending on available space.
- Do not replace the workout title or type label.
- Do not make the start-day marker compete with today/completion states.

Priority if states overlap:

- Today outline remains the strongest positional state.
- Completion marker remains attached to completion truth.
- `Plan starts` is a small contextual marker, not a status result.

For mobile:

- Show `Plan starts` as quiet metadata in the start-day row.
- Keep the primary row title as the workout/rest title.

## Month-Level Context

Use a short note only when it prevents misunderstanding.

Show a month-level note when the visible month includes the active plan start date and the start date is not the first day of that month.

Recommended copy:

`Plan starts May 29. Earlier days are outside this plan.`

Placement:

- Under the month title / calendar controls.
- Above the calendar grid.
- Use `hito-caption` or equivalent quiet support text.
- Do not put this inside a heavy card.

Do not show the note:

- on months after the plan start month
- when the plan starts on the first day of the visible month
- when no `planMeta.startDate` exists

For months before the plan start month, if navigation allows them:

- show a quiet note: `Plan starts May 29.`
- render all dates as outside-plan date-only cells
- do not show rest semantics

## Rest-Day Semantics

Fixed rest days before the plan start date are not planned rest days.

Rules:

- Fixed rest-day styling applies only on and after `plan.start_date`.
- Rest labels/glyphs apply only to persisted or derived in-plan rest days.
- Pre-start weekdays that happen to match fixed rest days stay visually identical to other pre-start days.
- After the plan starts, current rest-day presentation remains meaningful and should not be reduced by this slice.

This distinction is important because `Rest` means the plan has assigned recovery or non-running space. Before the start date, the plan has not assigned anything yet.

## Visual Behavior

Use existing Hito DS primitives:

- `hito-technical-mono` for date numbers
- muted foreground for pre-start dates
- hairline grid borders
- `hito-caption` for month-level note
- `hito-status-pill` or quiet micro-label for `Plan starts`
- existing calendar glyph/status/feedback treatments only inside the active plan window

Avoid:

- new card wrappers
- warning colors
- disabled-button styling that makes the calendar look broken
- large empty-state panels inside the month grid
- per-cell `Before plan starts` labels on desktop
- rendering pre-start days as rest days

## Interaction Behavior

Pre-start desktop cells:

- not tappable/selectable as workout links
- no workout tooltip
- no feedback marker link
- no completion/status marker
- optional hover is purely visual and quiet

Pre-start mobile collapsed row:

- not tappable
- no chevron
- no route
- no detail panel

If implementation must keep links for structural reasons in the first slice:

- clicking a pre-start date must not open a fake workout detail that says `Rest day`
- the route should either be disabled or land on a clear non-plan empty state
- preferred behavior remains no link

If a user clicks/selects a pre-start date in any future selectable calendar model:

- detail should read `Before plan starts`
- supporting copy: `Your plan begins on May 29. No workout is scheduled for this date.`
- no logging, feedback, or completion actions should appear

## Edge Cases

### Plan Starts On First Day Of Month

- No pre-start cells inside that month.
- Do not show the month-level pre-start note.
- Start-day marker may still appear, but it can be omitted if it creates clutter.

### Plan Starts Mid-Month

- Dates before start are date-only muted cells.
- Month-level note appears.
- Start date gets `Plan starts`.
- Dates after start render normally.

### Plan Starts On Last Day Of Month

- Desktop: most of the month is date-only muted pre-start cells.
- Mobile: collapse the pre-start range into one row if possible.
- Start date gets `Plan starts` and normal workout/rest content.
- Month-level note is required because the month is otherwise easy to misread.

### Target Date Falls Mid-Month

- Target date does not define the plan start boundary.
- Do not treat dates before target date as special for this slice.
- If the plan continues after target date for taper/recovery rows, keep those rows normal unless a separate target/end-date marker spec is created.

### User Views Months Before Start Date

- All dates are outside-plan date-only cells.
- Show quiet month-level note: `Plan starts May 29.`
- No workout/rest chips, no feedback markers, no detail links.

### User Views Months After Plan End

- If the frontend has a reliable plan end boundary, use the same outside-plan date-only principle after the final plan date.
- If no reliable end boundary is available in the current snapshot, do not invent one in the calendar.
- This slice should not block on post-end polish.

### Current Date Before Plan Start

- Today may still be outlined, but it must not imply an active planned workout.
- If today is pre-start, the today outline can coexist with date-only pre-start rendering.
- Month-level note remains the source of explanation.

## Acceptance Criteria

- Pre-start dates do not look like generated rest days.
- Pre-start dates do not show `Rest`, rest glyphs, workout type labels, status markers, feedback markers, or workout detail tooltips.
- Fixed rest-day styling applies only on and after the plan start date.
- The plan start date is visually understandable through a compact `Plan starts` marker or equivalent.
- The first partial month shows a short note when the plan does not start on the first day of that month.
- Mobile avoids a noisy stack of pre-start rest rows; preferred behavior is one collapsed pre-start range row.
- Desktop grid geometry remains stable.
- Week view follows the same pre-start semantics.
- No backend schedule semantics, persisted rows, generation, review/confirm, or workout sequencing changes are required.
- Existing in-plan workout links, completion states, feedback markers, month/week navigation, and normal rest-day rendering remain stable.

## Frontend Implementation Notes

Likely implementation targets:

- `src/components/Calendar.tsx`
- `src/styles.css`

Recommended implementation shape:

- Add a local derived boolean like `isBeforePlanStart = Boolean(snapshot.planMeta?.startDate && iso < snapshot.planMeta.startDate)`.
- Apply it before workout/rest rendering.
- For pre-start cells, render a non-link cell or a link-disabled equivalent.
- Keep `findWorkout(...)` and persisted workout truth unchanged.
- Add one small helper to decide whether the current month should show the start note.
- Add one compact mobile collapsed pre-start range helper if feasible.

Do not:

- filter or delete persisted workouts
- mutate `snapshot.workouts`
- add backend fields unless Frontend proves `planMeta.startDate` is insufficient
- create a new calendar component family

## QA Notes

QA should verify:

- Plan starting late in first month, e.g. 2026-05-29.
- Plan starting mid-month.
- Plan starting on the first day of the month.
- Month before plan start, if navigation allows it.
- Week view crossing the plan start date.
- Mobile/narrow layout.
- Today before start date if testable.
- Normal in-plan fixed rest days after start date.
- Existing workout links, completion markers, feedback markers, and tooltips inside the plan window.

## Blockers

None for design.

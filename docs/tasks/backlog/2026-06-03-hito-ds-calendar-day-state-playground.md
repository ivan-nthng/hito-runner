# Hito DS Calendar And Workout Day State Playground Intake

## Status

completed

## Type

change_request

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Closed: Hito DS calendar/workout playground accepted after final QA.

## Stage

Complete / QA-passed

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Use the completed Hito DS calendar/workout playground backlog intake as historical evidence only.

STAGE:
ARCHITECT reference / completed Hito DS calendar-workout playground

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-03-hito-ds-calendar-day-state-playground.md
- Canonical frontend spec: docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md
- This backlog intake has been converted and the canonical frontend spec is implemented / QA-passed.
- Final QA accepted the shared visual seam after calendar slot action/marker fixes.
- The related first-plan/pre-start QA track remains separate and is archived at docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md.
- Future manual workout authoring remains separate:
  docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md

GOAL:
Do not reopen this completed backlog intake unless a new concrete design-system regression is found.

WHAT NOT TO TOUCH:
- Do not change backend schedule semantics.
- Do not change workout identity, status, feedback, or persistence rules.
- Do not describe visual-only manual-authoring specimen states as shipped manual workout product
  functionality.
- Do not create a new design-system layer or custom controls when existing Hito DS controls cover
  the job.

OUTPUT:
1. Task
2. Stage
3. Historical evidence referenced
4. Current active owner, if any
5. Blockers
```

## Severity

medium

## Owner

DESIGNER / FRONTEND

## Reported

2026-06-03

## QA Closeout Evidence

2026-06-05: Final QA accepted the corrected shared calendar/workout day visual seam.

- Built-in Codex browser was used first; Safari fallback was not needed.
- `/hitoDS#calendar-workout-playground` passed desktop, intermediate, and `375px` checks.
- No visible `More` text appears in cells or mobile rows.
- Occupied activity actions use icon-only ellipsis with
  `aria-label="More activity actions"`.
- The more-action wrapper is absolute and does not participate in slot layout.
- Empty day shows compact `Add` placeholder and no more action.
- Result marker aligns with the date/header row: `centerDeltaY: 0`.
- Mobile/narrow viewport had no horizontal overflow: `innerWidth: 375`, `scrollWidth: 375`,
  `bodyScrollWidth: 375`.
- Product calendar source smoke confirmed no fake manual action props are passed from
  `src/components/Calendar.tsx`; product links/tooltips/feedback routing remain product-owned.
- Product saved-mode live browser smoke remained out of scope because local `/` was unauthenticated.
- Targeted ESLint, `git diff --check`, and `npm run build` passed.
- Screenshot folder:
  `qa-artifacts/screenshots/2026-06-04/calendar-slot-action-marker-final-qa/`.

Accepted architecture boundary:

- `HitoCalendarDayCell` and `HitoWorkoutDayRow` are the shared visual source of truth.
- Product calendar maps real backend/snapshot/workout truth into display props.
- `/hitoDS` maps controls/specimen state into the same display props.
- The shared component stays presentational and must not own routes, persistence, server actions,
  manual workout mutations, raw `TrainingSnapshot`, raw `Workout`, recurrence, copy/paste, or
  backend schedule truth.

2026-06-04: FRONTEND implemented `/hitoDS#calendar-workout-playground`, and QA passed the
visual/specimen validation.

- Built-in Codex browser was used first and validated
  `http://127.0.0.1:8082/hitoDS#calendar-workout-playground`.
- The section is reachable from `/hitoDS` Patterns.
- The section is framed as `Specimen only`, `Static display only`, and
  `No CRUD, recurrence, or production route wiring`.
- Coverage passed for desktop month-cell specimen, mobile workout-row specimen, dense month-grid
  stress specimen, planned workout/rest, empty day, outside-month, outside-plan/pre-start, today,
  selected/focused, completed/partial/skipped, evidence/feedback marker, identity display, and title
  overflow/wrapping.
- Future manual-authoring states are visual/specimen-only and passed: `Add workout`, `More menu`,
  `Editing`, `Copied source`, `Paste here`, `Repeats`, `Protected`, and `Fixed rest`.
- Source proof showed static specimen data only and no server action/backend mutation/persistence
  seam.
- No new route-local CSS family was introduced; existing Hito DS primitives/classes were reused.
- Narrow viewport proof passed: `innerWidth: 375`, `scrollWidth: 375`, `bodyScrollWidth: 375`,
  `hasHorizontalOverflow: false`.
- CLI passed:
  `npm exec eslint -- src/routes/hitoDS.tsx src/components/hito-ds/calendar-workout-playground.tsx src/components/hito-ds/calendar-workout-playground-data.ts`,
  `git diff --check`, and `npm run build`.
- Screenshot folder: `qa-artifacts/screenshots/2026-06-04/hito-ds-calendar-workout-playground/`.

## User Report

The user wants a design-system task for a calendar/workout day demo: calendar days and workout-day
states should be visible in `/hitoDS` for both desktop and mobile, with side controls using radio
buttons, dropdowns, or similar controls to choose what exists in that day. The goal is to inspect all
possible day states and evaluate visual layout variants centrally.

2026-06-04 scope correction:

- This is not primarily a first-plan pre-start task.
- First-plan pre-start/outside-plan is only one optional example state.
- Canonical implementation spec now lives at:
  `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`.

## Evidence

Current source references:

- `src/components/Calendar.tsx` contains desktop `DayCell`, `PreStartDayCell`, mobile
  `MobileMonthList`, and `PreStartMobileRangeRow`.
- `src/routes/hitoDS.tsx` already includes selection controls, dropdown/menu examples, feedback
  marker examples, tooltip shell examples, and calendar type identity examples.
- `src/components/ui/radio-group.tsx` and `src/components/ui/dropdown-menu.tsx` provide existing
  primitives for the requested side controls.

No screenshot was attached for this backlog item.

## Observed Behavior

Hito has live calendar day rendering in the product and several related DS examples, but there is no
focused `/hitoDS` playground where calendar days and workout-day rows/cards can be previewed across
desktop/mobile and state combinations.

## Expected Behavior

Future `/hitoDS` should include a calendar/workout day playground that lets designers, frontend
engineers, QA, and product quickly inspect:

- desktop calendar day cell
- mobile calendar day row
- empty/rest/workout days
- today and plan-start states
- selected/focused states
- completed/partial/skipped states
- feedback/evidence marker states
- pre-start and out-of-month states as optional examples
- planned/completed/skipped status treatment
- feedback marker presence
- workout identity glyph/color/label combinations
- long-title wrapping/truncation stress

The playground should be visual/specimen-only and should not become a second calendar product.

## Source Investigation

Likely implementation surfaces:

- `src/components/Calendar.tsx`
- `src/routes/hitoDS.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/icon.tsx`

The current calendar day anatomy already exists in product code, so the future implementation should
extract or reuse a stable visual specimen seam rather than copy-pasting divergent local markup into
`/hitoDS`.

## Likely Root Cause

The design system has related calendar tokens and examples, but it lacks a dedicated state playground
for the actual calendar day component. That makes it hard to compare desktop/mobile day states,
stress-test labels, or evaluate layout variants without navigating real plan data.

## Recommended Fix Direction

Use the completed canonical frontend spec and implemented `/hitoDS` playground as the design-system
reference for calendar/workout day states.

Completed approach:

- Frontend implemented from `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`.
- Frontend added the playground under `/hitoDS#calendar-workout-playground`.
- QA validated desktop/mobile states, dense stress, visual-only manual-authoring states, and no
  horizontal overflow.

## What Not To Touch

- Do not change schedule generation, persistence, active-plan truth, workout identity truth, or
  calendar navigation semantics.
- Do not redesign the product calendar in this backlog item.
- Do not add one-off controls outside existing Hito DS radio/dropdown/toggle primitives.
- Do not expose this as a runner-facing feature.

## Validation Result

Final QA validated:

- `/hitoDS` renders the new playground.
- Desktop preview covers the required day-cell states.
- Mobile preview covers the required day-row states.
- Narrow viewport has no horizontal overflow.
- Targeted ESLint, `git diff --check`, and build passed.

## Blockers

None.

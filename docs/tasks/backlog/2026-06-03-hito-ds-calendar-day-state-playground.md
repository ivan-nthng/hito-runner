# Hito DS Calendar And Workout Day State Playground Intake

## Status

completed

## Type

change_request

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Converted backlog intake into the canonical Hito DS calendar/workout playground frontend spec.

## Stage

ARCHITECT cleanup / converted to frontend spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Implement the canonical Hito DS calendar/workout day playground from the frontend spec.

STAGE:
FRONTEND implementation / Hito DS calendar-workout playground

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-03-hito-ds-calendar-day-state-playground.md
- Canonical frontend spec: docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md
- This backlog intake has been converted. Use the frontend spec as the source of truth.
- The related first-plan/pre-start QA track remains separate and is archived at docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md.

GOAL:
Implement the `/hitoDS` calendar/workout day playground described in the canonical frontend spec.

FILES/SURFACES TO INSPECT:
- `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`
- `src/components/Calendar.tsx`
- `src/routes/hitoDS.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/icon.tsx`
- existing Hito DS selection-control and calendar identity examples

WHAT NOT TO TOUCH:
- Do not change backend schedule semantics.
- Do not change workout identity, status, feedback, or persistence rules.
- Do not introduce a separate route outside `/hitoDS` unless Architect explicitly approves.
- Do not create a new design-system layer or custom controls when existing Hito DS controls cover the job.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## Severity

medium

## Owner

DESIGNER / FRONTEND

## Reported

2026-06-03

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

Use the canonical frontend spec, then implement a `/hitoDS` calendar/workout day state playground
using existing Hito DS controls and current calendar day anatomy.

Recommended approach:

- Frontend implements from `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`.
- Frontend implements the playground under `/hitoDS`, preferably by extracting a reusable presentational
  calendar-day specimen seam from current calendar anatomy if safe.
- QA validates desktop/mobile states, no horizontal overflow, and that product calendar behavior is
  unchanged.

## What Not To Touch

- Do not change schedule generation, persistence, active-plan truth, workout identity truth, or
  calendar navigation semantics.
- Do not redesign the product calendar in this backlog item.
- Do not add one-off controls outside existing Hito DS radio/dropdown/toggle primitives.
- Do not expose this as a runner-facing feature.

## Validation Expectations

Future implementation should validate:

- `/hitoDS` renders the new playground.
- Desktop preview covers the required day-cell states.
- Mobile preview covers the required day-row states.
- Side controls update the preview without page reload.
- Narrow viewport has no horizontal overflow.
- Existing product calendar still renders unchanged.
- Targeted ESLint, `git diff --check`, and build pass if product code changes.

## Blockers

None.

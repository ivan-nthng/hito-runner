# Hito DS Calendar Day State Playground

## Status

backlog

## Type

change_request

## Priority

medium

## Next Recommended Role

DESIGNER

## Task

Define a Hito DS calendar-day state playground for desktop and mobile calendar day layouts.

## Stage

DESIGNER backlog / design-system specimen spec

## Exact Handoff Prompt

```text
ROLE: DESIGNER

TASK:
Define a Hito DS calendar-day state playground for desktop and mobile calendar day layouts.

STAGE:
DESIGNER spec / Hito DS calendar day specimen

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-03-hito-ds-calendar-day-state-playground.md
- The product calendar already has desktop day cells and mobile day rows in `src/components/Calendar.tsx`.
- `/hitoDS` already documents calendar type identity, feedback markers, selection controls, dropdowns, and date-picker primitives, but it does not yet provide a focused interactive specimen for a single calendar day across all states.

GOAL:
Specify a `/hitoDS` calendar-day playground where the user can preview one calendar day on desktop and mobile and adjust its state through side controls such as radio buttons, toggles, and dropdowns.

ARCHITECTURE FIT:
- This is a design-system/spec task first, not product implementation.
- The later frontend implementation must reuse existing Hito DS primitives and current calendar anatomy.
- Do not create a new mini calendar UI kit.
- Do not move schedule truth, workout identity truth, or status truth into `/hitoDS`; the playground is visual/specimen-only.

SPEC REQUIREMENTS:
- Define the specimen surface:
  - desktop day cell preview
  - mobile day row preview
  - optional side-by-side or stacked responsive preview
  - controls rail/sidebar for state selection
- Define controls for at least:
  - viewport mode: desktop / mobile / both
  - date relation: in-month / out-of-month / today / plan start / pre-start
  - content type: empty, rest, easy, recovery, steady, long, quality, interval, tempo, hill, trail, ultra/mountain
  - workout status: planned, completed, skipped, partial if visible in the calendar contract
  - feedback marker: none, has feedback, issue/attention if supported by current markers
  - title length: short, normal, long wrapping/truncation stress
  - glyph/family visibility
  - plan-start marker visibility
  - density or layout variant only if it is a DS exploration control, not a product behavior change
- Define expected copy and labels for the playground.
- Define which existing primitives/patterns FRONTEND must reuse.
- Define which current calendar states should be considered canonical and which are only stress-test/demo states.
- Define mobile and desktop no-overflow expectations.

FILES/SURFACES TO INSPECT:
- `src/components/Calendar.tsx`
- `src/routes/hitoDS.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/icon.tsx`
- existing Hito DS selection-control and calendar identity examples

WHAT NOT TO TOUCH:
- Do not implement product code in this design spec pass.
- Do not change backend schedule semantics.
- Do not change workout identity, status, feedback, or persistence rules.
- Do not introduce a separate route outside `/hitoDS` unless Architect explicitly approves.
- Do not create a new design-system layer or custom controls when existing Hito DS controls cover the job.

OUTPUT:
1. Task
2. Stage
3. Spec file created or updated
4. Calendar states covered
5. Control model
6. Desktop and mobile layout guidance
7. Hito DS reuse requirements
8. Frontend handoff prompt
9. Blockers
```

## Severity

medium

## Owner

DESIGNER / FRONTEND

## Reported

2026-06-03

## User Report

The user wants a design-system task for a single calendar day demo: one day from the calendar should
be visible in `/hitoDS` for both desktop and mobile, with side controls using radio buttons,
dropdowns, or similar controls to choose what exists in that day. The goal is to inspect all possible
day states and potentially evaluate visual layout variants.

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
focused `/hitoDS` playground where a single calendar day can be previewed across desktop/mobile and
state combinations.

## Expected Behavior

Future `/hitoDS` should include a calendar-day playground that lets designers, frontend engineers,
QA, and product quickly inspect:

- desktop calendar day cell
- mobile calendar day row
- empty/rest/workout days
- today and plan-start states
- pre-start and out-of-month states
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

Create a design spec first, then a frontend implementation slice that adds a `/hitoDS` calendar-day
state playground using existing Hito DS controls and current calendar day anatomy.

Recommended approach:

- Designer defines canonical states and controls.
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

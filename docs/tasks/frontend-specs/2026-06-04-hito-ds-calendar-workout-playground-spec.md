# Hito DS Calendar And Workout Day Playground

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Implement a `/hitoDS` calendar and workout-day state playground for desktop and mobile visual states.

## Stage

FRONTEND implementation / Hito DS calendar-workout playground

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Implement a `/hitoDS` calendar and workout-day state playground for desktop and mobile visual states.

STAGE:
FRONTEND implementation / Hito DS calendar-workout playground

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md
- Converted backlog intake: docs/tasks/backlog/2026-06-03-hito-ds-calendar-day-state-playground.md
- Related narrow pre-start QA track: docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- Future manual workout authoring backlog: docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md
- The product calendar already has desktop day cells, week cells, mobile day rows, pre-start cells, result states, and feedback markers in `src/components/Calendar.tsx`.
- `/hitoDS` already documents selection controls, dropdown/menu examples, feedback markers, tooltips, date/time inputs, icon registry, and calendar type identity.

GOAL:
Add a design-system playground/reference in `/hitoDS` where product/design/frontend can inspect one calendar day and one workout-day row/card across canonical visual states, with side controls for state selection.

ROOT CAUSE AND ARCHITECTURE FIT:
- The missing piece is not first-plan pre-start rendering. That is only one state.
- Hito needs one DS-owned reference for calendar day anatomy, mobile workout-day rows, result overlays, evidence markers, workout identity display, and layout stress.
- Keep the playground visual/specimen-only. Backend plan truth, schedule semantics, workout identity truth, persistence, and row counts remain out of scope.
- Reuse existing Hito DS controls and current calendar anatomy. Do not create a mini calendar UI kit.

REQUIREMENTS:
- Add the playground under `/hitoDS`, not a runner-facing route.
- Include desktop month-cell preview.
- Include mobile day-row preview.
- Include optional compact workout-day card/row anatomy if current product anatomy makes that useful.
- Provide side controls using existing Hito DS radio/toggle/dropdown/select primitives.
- Cover canonical states:
  - planned workout
  - rest day
  - today
  - selected/focused
  - completed
  - partial
  - skipped
  - feedback/evidence marker
  - long run
  - recovery/easy/steady/quality identity display
  - workout title overflow/wrapping
  - dense month grid stress
  - mobile row layout
  - empty/no-plan date if useful
  - outside-month
  - outside-plan/pre-start as one optional state
- Include future manual-workout action affordance examples as visual-only states:
  - empty day can show an optional add-workout affordance
  - existing workout can show an optional edit affordance
  - copied workout / paste target / recurring workout markers can be represented as future stress states
- Keep outside-plan/pre-start as one example state, not the main objective.
- Use backend-shaped sample data only; do not invent new product truth rules.
- Preserve product calendar behavior unless explicitly extracting a presentational helper is safe and behavior-preserving.

FILES/SURFACES TO INSPECT:
- `src/routes/hitoDS.tsx`
- `src/components/Calendar.tsx`
- `src/components/ui/radio-group.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/icon.tsx`
- `src/styles.css`
- existing Hito DS calendar identity and feedback marker examples

WHAT NOT TO DO:
- Do not change first-plan generation.
- Do not change backend schedule semantics.
- Do not change persistence, row counts, active-plan truth, workout identity truth, or feedback truth.
- Do not expose this as a runner-facing feature.
- Do not implement manual workout creation, editing, copy/paste, or recurrence in this DS slice.
- Do not create custom controls when existing Hito DS controls cover the job.
- Do not create a new calendar framework.

VALIDATION:
- Run targeted frontend lint for touched files.
- Run `git diff --check`.
- Run build if product code changes.
- Browser-check `/hitoDS` in the built-in Codex browser if practical.
- Verify narrow viewport has no horizontal overflow.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## Owner

FRONTEND / DESIGN SYSTEM

## Last Updated

2026-06-04

## Why This Exists

The calendar UI has accumulated several meaningful states across desktop month cells, week cells,
mobile day rows, workout completion truth, and Garmin feedback/evidence markers. Those states are
currently inspectable only by navigating real product data or reading `Calendar.tsx`.

The earlier `First-Plan Calendar Pre-Start Rendering Polish` work solved one narrow display issue:
dates before the plan start date should not look like planned rest days. That is only one example of
a larger DS need.

This spec defines the canonical `/hitoDS` playground for calendar/workout day anatomy so layout,
markers, titles, density, and mobile behavior can be reviewed centrally.

## Scope Decision

Decision: split cleanly.

- Keep `docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md` as the
  completed narrow first-plan / active-plan pre-start QA track.
- Keep `docs/tasks/frontend-specs/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md` as
  the narrow pre-start validation/spec source.
- Use this file as the canonical general Hito DS calendar/workout playground spec.
- Mark the older backlog intake as converted so the admin Backlog does not show two active tasks for
  the same DS playground objective.

## Canonical Playground Objective

`/hitoDS` should expose a controlled playground where a user can:

- see a desktop calendar day cell
- see a mobile calendar day row
- optionally see a compact workout-day row/card specimen if useful
- change day state through a side control rail
- stress-test title length, identity labels, result markers, feedback/evidence markers, and dense
  month layout
- compare desktop and mobile behavior without needing a seeded plan

This playground is visual/specimen-only. It must not become a second source of schedule truth.

## Future Manual Workout Authoring Compatibility

Future manual workout creation/editing is tracked separately in:

- `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`

The `/hitoDS` playground should account for that future direction visually, but must not implement
product behavior.

Optional visual-only states to include or leave clear room for:

- empty in-plan date with an `Add workout` affordance
- existing workout date with an `Edit workout` affordance
- copied workout source state
- paste-target date state
- recurring/repeated workout marker state
- disabled/protected action state for logged or evidence-backed workouts

These are display/control anatomy examples only. Backend mutation, persistence, copy/paste,
recurrence expansion, conflict handling, and review/confirm behavior belong to the separate manual
workout authoring architecture task.

## State Model

Use a frontend view-model grammar. Do not create a backend enum.

Recommended base states:

- `planned-workout`
- `planned-rest`
- `empty-no-plan`
- `outside-month`
- `outside-plan-pre-start`
- `outside-plan-after-end`

Recommended overlays:

- `today`
- `selected`
- `focused`
- `completed`
- `partial`
- `skipped`
- `feedback-ready`
- `evidence-attached`

Recommended identity variants:

- `easy`
- `recovery`
- `steady`
- `long`
- `tempo`
- `threshold`
- `interval`
- `progression`
- `race`
- `hill`
- `trail`
- `ultra`
- `mountain`
- `rest`

State composition rules:

- `planned-workout` and `planned-rest` are mutually exclusive.
- `empty-no-plan`, `outside-month`, and outside-plan states suppress workout/rest semantics.
- `today`, `selected`, and `focused` are positional/interaction overlays.
- `completed`, `partial`, and `skipped` apply only to in-plan workout days.
- `feedback-ready` and `evidence-attached` apply only to workout days with backend feedback marker
  truth.
- `outside-plan-pre-start` is one optional state in the playground, not the main objective.

## Control Model

The `/hitoDS` playground should use existing Hito DS controls:

- viewport: `desktop`, `mobile`, `both`
- base date state: planned workout, planned rest, empty/no-plan, outside month, outside plan/pre-start
- interaction overlay: none, today, selected, focused
- result state: none, completed, partial, skipped
- feedback marker: none, evidence attached, feedback ready
- workout identity: easy, recovery, steady, long, tempo, threshold, interval, progression, race,
  hill, trail, ultra, mountain
- title length: short, normal, long, extreme overflow
- density: normal, dense month stress
- plan marker: none, plan starts, optional outside-plan note
- future action affordance: none, add workout, edit workout, copied source, paste target, recurring,
  protected/disabled

Use radio/toggle groups for small mutually exclusive choices and dropdown/select controls for long
option sets. Do not invent custom side-control styling.

## Desktop Day Cell Anatomy

The desktop specimen should cover:

- date number
- type glyph
- short type label
- compact workout title
- quiet rest-day treatment
- today outline
- selected/focused treatment
- completed/partial/skipped treatment
- feedback/evidence marker
- title wrapping/truncation
- dense-grid stress
- outside-month and outside-plan/pre-start muted treatment

The month-cell specimen should avoid unsupported metric stacks. Metrics belong in detail/tooltip
surfaces unless the current product calendar already supports them.

## Mobile Day Row Anatomy

The mobile specimen should cover:

- date block
- type glyph and label
- workout title
- result state treatment
- feedback/evidence marker placement
- today outline
- long-title wrapping
- quiet rest-day row
- collapsed outside-plan/pre-start range example if useful
- no horizontal overflow at 375px width

Mobile rows should stay readable without turning each day into a heavy card.

## Workout-Day Row/Card Anatomy

If Frontend determines the current product anatomy supports it cleanly, include one compact
workout-day row/card specimen alongside the calendar cell/row previews. This is useful for testing
the same state grammar outside a strict month grid.

Keep this optional. Do not create a new component family solely for this specimen.

## DS Reuse Requirements

Use existing DS/product primitives and classes first:

- Hito typography roles for labels, captions, titles, and mono date numbers
- Hito low-card/open surface rhythm
- existing feedback marker treatment
- existing workout glyph treatment
- existing Hito radio/toggle/select/dropdown controls
- existing tooltip shell if hover/readback examples are included
- existing focus ring behavior

Do not introduce a separate calendar UI kit. If a reusable presentational seam is needed, extract the
smallest stable anatomy from current `Calendar.tsx` and keep behavior unchanged.

## What Remains First-Plan Specific

Only the pre-start/outside-plan state remains related to first-plan or active-plan boundaries.

First-plan-specific details that stay out of this general DS playground:

- plan generation
- target date handling
- first-plan row counts
- reviewed draft persistence
- active-plan creation
- fixed rest-day schedule semantics

## Acceptance Criteria

- `/hitoDS` includes a calendar/workout day playground section.
- Desktop month-cell preview updates from controls.
- Mobile row preview updates from controls.
- Required states and overlays are covered.
- Long-title overflow/wrapping can be stress-tested.
- Dense month-grid stress can be previewed.
- Outside-plan/pre-start exists as one optional state, not the main framing.
- Future manual action affordances can be previewed or are explicitly reserved without becoming
  product behavior.
- No backend schedule truth, persistence, generation, or row-count logic changes.
- No runner-facing route is added.
- Narrow viewport has no page-level horizontal overflow.

## QA Expectations

QA should verify:

- built-in browser path first
- `/hitoDS` playground renders
- side controls update previews
- desktop and mobile examples are visible
- pre-start/outside-plan does not dominate the framing
- title overflow/wrapping stress works
- result and feedback/evidence states are secondary and readable
- 375px viewport has no horizontal overflow
- existing product calendar route still renders normally if product code was touched

## Blockers

None.

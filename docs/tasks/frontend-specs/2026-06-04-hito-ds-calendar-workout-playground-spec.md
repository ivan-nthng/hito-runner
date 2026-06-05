# Hito DS Calendar And Workout Day Playground

## Status

in_progress

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Correct the `/hitoDS` calendar/workout playground visual direction after user review failed.

## Stage

FRONTEND implementation / DS calendar-workout playground simplification

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Correct `/hitoDS#calendar-workout-playground` so it becomes one native Hito DS playground instead of a stack of nested specimen cards.

STAGE:
FRONTEND implementation / DS calendar-workout playground simplification

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md
- Converted backlog intake: docs/tasks/backlog/2026-06-03-hito-ds-calendar-day-state-playground.md
- Related narrow pre-start QA track: docs/plans/archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md
- Future manual workout authoring backlog: docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md
- The current implementation covered states, but user visual review failed.
- The failure is visual/systemic: the playground reads as nested custom cards/panels, not as a real Hito DS reference for calendar/workout day anatomy.
- Prior QA evidence proves state coverage only. It does not approve the current visual direction.
- Architecture audit found no dangerous cross-import yet: `/hitoDS` does not import the real
  `Calendar.tsx`, and the product calendar does not import playground components or specimen data.
- The current risk is visual/anatomy drift and oversized duplicated presentation logic, not a live
  schedule-truth leak.
- The playground remains specimen-only: no CRUD, recurrence, backend mutation, persistence, generation, or product route wiring.

GOAL:
Rebuild the playground direction around one controlled DS playground: a compact always-available control area plus one main preview area that looks like the real Hito calendar/workout day UI.

REQUIREMENTS:
- Preserve the component boundary:
  - `src/components/Calendar.tsx` remains the product schedule renderer for backend-shaped
    `TrainingSnapshot` truth.
  - `/hitoDS#calendar-workout-playground` remains a static specimen/playground with local specimen
    state and sample data.
  - Product calendar must not import playground components, playground data, or future manual-action
    specimen states.
  - The playground must not import `Calendar.tsx`, `TrainingSnapshot`, product route loaders, workout
    mutation actions, or persistence helpers.
- Remove the current direction that creates many nested cards, framed panels, decorative borders, or fake specimen wrappers.
- Do not show desktop, mobile, dense grid, and contract tiles as a stack of separate card-like panels.
- Use one main preview area. The user should switch between desktop and mobile preview modes instead of scanning multiple decorative specimens.
- Keep controls always reachable. Controls may move from a side rail to a top strip/collapsible control region on smaller screens, but they must not become hover-only.
- Controls must use existing Hito DS controls only: existing choice toggles, select/dropdown, input sizing, buttons, icon buttons, menu triggers, tokens, typography, spacing, radius, and border rules.
- Do not introduce local/custom controls, fake select styling, or a separate backlog/calendar UI kit.
- Preserve state coverage:
  - desktop view and mobile view
  - base day state: workout, rest, empty, outside month, pre-start/outside plan
  - workout identity/type
  - result/evidence/feedback markers
  - future authoring affordance: add, more menu, edit, copied, paste target, recurring, protected
  - density/title stress only where it helps expose real layout breakage
- The preview must reuse the real calendar/workout visual grammar: open calendar grid, hairline rhythm, mobile row rhythm, restrained markers, workout glyph semantics, and low-card Hito DS language.
- Do not hide content problems with `overflow:hidden`. Long titles must clamp/wrap by explicit rules, and markers/labels must not overlap.
- On narrow screens, do not force a cramped 7-column desktop grid if the cell content cannot fit. Use the mobile/list preview mode.
- Keep future manual-workout states visual-only. Do not imply product behavior is implemented.
- Do not change product calendar wiring, backend mutations, generation, persistence, row counts, or schedule semantics.
- If extracting a shared primitive, extract only a pure presentational seam with primitive props
  such as date label, glyph, display title, visual state, and marker presence. The shared primitive
  must not accept `TrainingSnapshot`, `Workout`, route `Link` destinations, server actions,
  persistence objects, specimen-only future actions, or mutation callbacks.
- If no clean pure seam emerges during the visual simplification, keep product and playground
  renderers separate and reuse only shared Hito DS primitives/classes.
- Reusable CSS classes must be generic and documented as DS/product primitives. Playground-only
  classes should be clearly specimen/playground-scoped; product-only classes must not be renamed as
  global DS primitives unless they are deliberately made reusable.

VALIDATION:
- Run targeted lint/type checks for touched frontend files.
- Run `git diff --check`.
- Browser-check `/hitoDS#calendar-workout-playground` in the built-in Codex browser.
- Verify no page-level horizontal overflow at roughly 375px.
- Capture before/after screenshots for the corrected section.
- Confirm `/hitoDS` still frames this as specimen-only and not shipped manual workout behavior.

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

## Prior QA State-Coverage Evidence

This evidence remains useful, but it is not visual approval. The current implementation is reopened
because user visual review failed the playground direction.

- Verdict: Passed.
- Browser Path Preflight: built-in Codex browser was used first and validated
  `http://127.0.0.1:8082/hitoDS#calendar-workout-playground`.
- `/hitoDS` Patterns navigation reaches the calendar/workout playground section.
- The section is explicitly framed as `Specimen only`, `Static display only`, and
  `No CRUD, recurrence, or production route wiring`.
- Coverage passed for desktop month-cell specimen, mobile workout-row specimen, dense month-grid
  stress specimen, planned workout/rest, empty day, outside-month, outside-plan/pre-start, today,
  selected/focused overlays, completed/partial/skipped, evidence/feedback marker, and
  easy/recovery/steady/long/tempo/intervals/hills/trail/quality/rest identity display.
- Title overflow/wrapping coverage passed.
- Future manual-authoring visual-only states passed: `Add workout`, `More menu`, `Editing`,
  `Copied source`, `Paste here`, `Repeats`, `Protected`, and `Fixed rest`.
- Source proof showed static specimen data only and no server action, backend mutation, or
  persistence seam.
- No new route-local CSS family was introduced; existing Hito DS primitives/classes were reused.
- Narrow viewport proof passed: `innerWidth: 375`, `scrollWidth: 375`, `bodyScrollWidth: 375`,
  `hasHorizontalOverflow: false`.
- CLI passed:
  `npm exec eslint -- src/routes/hitoDS.tsx src/components/hito-ds/calendar-workout-playground.tsx src/components/hito-ds/calendar-workout-playground-data.ts`,
  `git diff --check`, and `npm run build`.
- Screenshot folder: `qa-artifacts/screenshots/2026-06-04/hito-ds-calendar-workout-playground/`.

## Current Implementation Visual Failure

User visual review failed the current `/hitoDS#calendar-workout-playground` implementation on
2026-06-04.

The failure is not missing state coverage. The failure is that the playground now behaves like a
separate decorative specimen surface instead of a real Hito DS control surface for calendar/workout
day anatomy.

Observed issues:

- The section creates a ladder of frames: outer specimen, preview panel, inner specimen surface,
  then another bordered day/card/grid treatment.
- Desktop cell, mobile row, dense stress, and contract notes appear as separate card-like panels
  instead of one controlled playground.
- The preview looks larger, darker, and more decorative than the real product calendar.
- Large empty regions inside preview cards make day cells feel broken or artificially spacious.
- Borders and rounded frames compete with the actual calendar-cell border rules that the playground
  is supposed to inspect.
- Control groups feel like their own framed control panel, not a compact DS-owned tool area.
- The current view can make future manual-workout affordances feel like shipped product actions,
  even though they are visual-only stress states.
- The visual structure risks hiding layout failures by placing specimens inside forgiving wrappers.

This implementation should be treated as visually rejected until the corrected model below is
implemented and reviewed.

## Component Boundary Audit

2026-06-04 ARCHITECT audit result: the current implementation is visually rejected, but the
dependency direction is not currently corrupted.

Current dependency map:

- `src/components/Calendar.tsx` imports `WorkoutGlyph`, `Icon`, `cn`, and backend-shaped training
  helpers/types from `src/lib/training`; it owns real schedule rendering from `TrainingSnapshot`.
- `src/components/hito-ds/calendar-workout-playground.tsx` imports `WorkoutGlyph`, `Icon`, Hito
  `Select`, `cn`, and static specimen data from
  `src/components/hito-ds/calendar-workout-playground-data.ts`.
- `src/components/hito-ds/calendar-workout-playground-data.ts` imports only the `WorkoutGlyphKind`
  type from `src/lib/workout-glyph`.
- `src/routes/hitoDS.tsx` imports and renders `CalendarWorkoutPlayground`.
- No product route imports the playground component or playground data.
- `/hitoDS` does not import the real `Calendar.tsx`.
- Manual-workout future states exist only as specimen data/actions inside the playground; no product
  calendar behavior currently consumes them.

Canonical boundary:

- Product calendar owns backend-shaped schedule truth, route links, tooltips, feedback destinations,
  pre-start behavior, workout/rest semantics, and rendering of persisted `TrainingSnapshot` data.
- `/hitoDS` owns static specimen controls and static display states for design inspection only.
- Shared Hito DS primitives may own only presentational atoms/anatomy: typography, surfaces,
  buttons, select/dropdown controls, status markers, feedback markers, workout glyphs, date labels,
  and optionally a pure calendar-cell/mobile-row shell.
- Shared primitives must not own business truth: no `TrainingSnapshot`, no `Workout` entity, no
  `findWorkout`, no route `Link`, no backend actions, no persistence, no recurrence, and no manual
  workout mutation semantics.

Forbidden dependency directions:

- Product calendar must not import specimen/playground data or future-action affordance state.
- Product calendar must not treat `/hitoDS` controls as product state.
- `/hitoDS` must not import `Calendar.tsx` just to get the product renderer.
- `/hitoDS` must not fake a `TrainingSnapshot` and pass it through live product calendar logic.
- CSS classes that are only for this playground must not be named like broad reusable product/DS
  primitives.
- Future manual-workout affordances must not appear in product calendar behavior until the separate
  manual workout authoring architecture defines the mutation model.

Shared primitive decision:

- Do not extract the full product calendar into a DS component.
- Do not make one component own both real schedule rendering and playground knobs.
- A small shared presentational seam is allowed only if it reduces duplication without carrying
  business truth. Acceptable candidates are marker/glyph/label atoms or a pure day-cell/mobile-row
  shell that receives already-shaped display props.
- If extraction would require passing product entities, route links, or mutation semantics into the
  shared component, keep product `Calendar.tsx` and the `/hitoDS` specimen renderer separate.

## Corrected Playground Model

The playground should be one controlled reference surface, not a stack of sample cards.

Recommended structure:

- Compact section intro: title, one-line purpose, and `Specimen only` status.
- One always-reachable control area.
- One main preview area.
- Optional contract notes as plain text rows or compact dividers, not tiles.

The preview should switch modes instead of showing many panels at once:

- `Desktop`: show the real desktop calendar cell/grid anatomy at a believable product width.
- `Mobile`: show the real mobile day-row/list anatomy at a believable narrow width.
- `Density stress`: optional toggle inside the active preview, not a separate permanent card.

The preview should answer one question: “Will this state render correctly in the real calendar?”

It should not try to be a dashboard, gallery, or branded illustration.

## DS Control Requirements

Controls must use existing Hito DS patterns only.

Required controls:

- View mode: `Desktop` / `Mobile`.
- Base day state: `Workout`, `Rest`, `Empty`, `Outside month`, `Pre-start`.
- Workout identity/type: existing workout identity dropdown or DS select.
- Result/evidence state: `None`, `Completed`, `Partial`, `Skipped`, `Evidence`, `Feedback`.
- Future authoring affordance: `None`, `Add`, `More`, `Edit`, `Copied`, `Paste target`,
  `Recurring`, `Protected`.
- Density/title stress: include only if useful for exposing layout limits.

Control rules:

- Choice toggles should be used for short mutually exclusive choices.
- Select/dropdown should be used for long identity/action lists.
- Inputs/selects/buttons must use existing Hito DS sizing, radius, border, focus, and disabled
  states.
- Controls must not be hover-only.
- Controls must not introduce local one-off classes when existing Hito DS primitives cover the job.
- The control area may be a low-chrome rail/strip, but it should not become a bordered card stack.

## Preview Content Rules

The preview must use real Hito calendar/workout visual language.

Cell and row rules:

- Content must fit within the intended cell width and height.
- Date, type glyph, type label, title, result marker, feedback marker, and future action affordance
  must not overlap.
- Long titles should clamp or wrap by a deliberate rule:
  - desktop month cells: preserve date and marker legibility first; title may clamp.
  - mobile rows: title may wrap more naturally, but metadata should remain scannable.
  - dense stress: hide or clamp lower-priority title detail rather than breaking cell geometry.
- Do not use `overflow:hidden` as a fake success if the remaining visible content is not readable.
- Rounded borders must not have missing segments or broken corner joins.
- Desktop grid border ownership should belong to the grid/cell system, not nested wrappers.
- Pre-start/outside-plan dates must still read as calendar dates, not rest days.
- Future manual-workout affordances must be visibly secondary and specimen-only.

What must stay primary:

- date recognition
- workout/rest/empty/outside-plan semantics
- current/today/selected/focus state
- completion/evidence markers when enabled

What must stay secondary:

- long descriptive title text
- future authoring affordances
- contract explanation copy
- density stress controls

## Responsive And Layout Rules

Desktop preview:

- Use a product-believable desktop width.
- A side control rail is acceptable only when there is enough horizontal space.
- The preview should resemble the product calendar grid/row rhythm rather than a separate framed
  example card.

Intermediate width:

- Move controls above the preview as a compact strip or disclosure region.
- Keep the preview single-column.
- Do not keep a desktop 7-column grid if cell content can no longer fit.

Mobile/narrow width:

- Default to the mobile/list preview.
- Controls may collapse into a DS disclosure, but the control entry point must stay visible.
- Avoid horizontal page overflow.
- Avoid tiny multi-column grids that make state semantics unreadable.

Control behavior:

- Playground controls are always reachable.
- Hover may reveal secondary actions inside the preview on pointer devices, but not core controls.
- Keyboard/focus-visible behavior should remain inspectable in the playground.

## What To Remove From Current UI

Remove or substantially flatten these current implementation patterns:

- stacked `PreviewPanel` sections as the primary layout
- separate permanent cards for desktop, mobile, dense stress, and contract notes
- decorative inner specimen wrappers around individual cells
- large framed control-panel treatment
- contract tiles as bordered mini-cards
- artificial borders that make the playground look different from the product calendar
- any local control styling that is not clearly mapped to Hito DS primitives

## Future Manual Authoring Boundary

Manual workout creation/edit/copy/paste/recurrence remains visual-only in this playground.

The playground may show stress states for future authoring affordances, but must not imply:

- product CRUD exists
- recurrence expansion exists
- copy/paste workout behavior exists
- backend conflict handling exists
- schedule mutation is wired from the playground

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

- switch between desktop calendar preview and mobile calendar preview
- change day state through a compact DS control area
- stress-test title length, identity labels, result markers, feedback/evidence markers, and dense
  month layout without opening seeded product data
- compare product-like desktop and mobile behavior without seeing a gallery of decorative cards

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

- viewport: `desktop`, `mobile`
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
option sets. Do not invent custom control styling.

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

## Workout-Day Preview Anatomy

If Frontend determines the current product anatomy supports it cleanly, include one compact workout
day preview mode or inline row inside the main preview area. This can help test the same state
grammar outside a strict month grid.

Keep this optional. Do not create a new card/component family solely for this specimen.

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

- `/hitoDS` includes one corrected calendar/workout playground section, not a stack of specimen
  cards.
- The section has one compact always-reachable control area and one main preview area.
- Desktop preview updates from controls and resembles the real product calendar grid/cell rhythm.
- Mobile preview updates from controls and resembles the real product mobile row/list rhythm.
- Required states and overlays are covered.
- Long-title overflow/wrapping can be stress-tested.
- Dense month-grid stress can be previewed without becoming a separate permanent card.
- Outside-plan/pre-start exists as one optional state, not the main framing.
- Future manual action affordances can be previewed or are explicitly reserved without becoming
  product behavior.
- There are no nested preview-card ladders, contract tiles, or decorative specimen wrappers that
  fight the real calendar anatomy.
- Controls reuse existing Hito DS primitives and are not hover-only.
- No backend schedule truth, persistence, generation, or row-count logic changes.
- No runner-facing route is added.
- Narrow viewport has no page-level horizontal overflow.
- QA covers visual direction as well as state coverage.

## QA Coverage Required After Correction

The prior QA pass is now considered state-coverage evidence only. A new QA/design review pass should
verify:

- built-in browser path first
- `/hitoDS` playground renders
- the corrected section no longer looks like nested custom cards or a decorative specimen gallery
- desktop and mobile preview modes are visible and controllable
- pre-start/outside-plan does not dominate the framing
- title overflow/wrapping stress works
- result and feedback/evidence states are secondary and readable
- 375px viewport has no horizontal overflow
- controls remain reachable on narrow screens
- screenshots show the preview matching real Hito calendar/workout visual grammar
- no product calendar route behavior, backend mutation, persistence, generation, or schedule
  semantics changed in this specimen-only slice

## Blockers

None.

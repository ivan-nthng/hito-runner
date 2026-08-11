# Selected Plan Calendar Flat Day And Legend Chrome

## Work Item ID

2026-08-11-selected-plan-calendar-flat-day-and-legend-chrome

## Status

completed

## Type

visual-polish

## Priority

medium

## Owner

frontend

## Frontend Lane

Product

## Mode

Lite

## Scope

Only the reviewed-plan preview calendar in
`src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx` and its route-local stylesheet
contract in `src/styles/forms-onboarding.css`. The scope is the existing calendar day active chrome
and its legend swatches; it is not a global shadow-removal pass or a Calendar/Design System change.

## Archive Intent

retain_in_place

## Task

Make reviewed-plan preview calendar days and legend swatches flat by removing only their existing
inset shadow/border chrome. Preserve the semantic identity colours, calendar geometry, hover,
focus-visible affordance, popover selection behaviour, and all preview data. Do not replace the
removed chrome with another border, outline, shadow, or local recipe.

## User Report

Inspector captured `/`, dark, `1470×801`, targeting the Rest preview day button for Friday,
2026-08-07. Ivan requests that these calendar-day components have no shadows and are flat. He also
requests removal of the visible border treatment from the intent/Rest legend items.

## Evidence

- Inspector item: `aa181603-3a31-4b38-b2ab-8fd2b29f7161`, captured
  `2026-08-11T11:48:22.307Z`.
- Target class: `hito-selected-plan-calendar-day`; computed radius is the existing
  `--radius-md` 6px. Radius is not part of the request.
- `src/styles/forms-onboarding.css:129-145` gives the day its background and a `box-shadow`
  transition.
- `src/styles/forms-onboarding.css:165-172` adds the visible inset `box-shadow` to the active
  (`aria-expanded="true"`) day.
- `src/styles/forms-onboarding.css:100-107` gives every
  `hito-selected-plan-calendar-legend-swatch` an inset `box-shadow`, which is the reported legend
  border treatment.
- `SelectedTenKPlanPreviewDialog.tsx:614-645` owns day interaction and
  `:662-690` owns the legend markup. Neither needs a markup or behaviour change for this request.

## Source Investigation And Demonstrated Cause

The visible day shadow is not owned by the inspector-selected button's markup or a shared Hito
primitive. It is the active-state inset `box-shadow` in the route-local onboarding stylesheet. The
legend's apparent border is likewise an inset `box-shadow` in the same stylesheet. Both have the
same first canonical owner: FRONTEND Product's reviewed-plan preview calendar chrome.

## Expected Behavior

- Rest and workout preview days remain square, colour-coded, interactive, and popover-capable, but
  have no inset or external shadow in their active state.
- Legend swatches preserve their dimensions, semantic colours, and circular geometry with no inset
  shadow/border.
- Existing background hover treatment, keyboard focus-visible outline, selected row/popover state,
  `aria-*` semantics, and all plan preview data remain unchanged.

## Reuse-First Change Budget

- Existing seam: the two route-local CSS selectors in `forms-onboarding.css`.
- Existing behaviour: background hover and focus-visible outline already communicate interaction.
- New production artifacts: none.
- Removed responsibility: only active-day and legend-swatch inset chrome, including the obsolete
  `box-shadow` transition.

## What Not To Touch

- Do not change the product Calendar, its day/legend components, `HitoCalendarDayCell`, shared
  Design System source/tokens, colour identities, radius, hover backgrounds, focus outline,
  Popover, preview rendering, plan data, BPM/onboarding state, backend, or unrelated dirty work.
- Do not remove shadows from any other component, dialog, popover, or page based on this one
  Inspector item.
- Do not add a replacement border, shadow, outline, literal value, utility class, component, or
  compatibility selector.

## Focused Validation Expectations

- Reviewed plan preview on desktop and exact 375×812 in light/dark: Rest and workout days plus
  every legend swatch are flat; identity colours, grid geometry, and no overflow hold.
- Pointer and keyboard activation of one workout/rest day still opens its current summary/popover;
  focus-visible remains observable.
- Focused formatter/lint/diff checks; build only if shared output is uncontended.

## Promotion Condition

Promote and stop only if removing the route-local inset shadows makes current active/focus or
calendar-readability behaviour insufficient without changing a shared Calendar or Design System
contract.

## Frontend Lite Receipt — 2026-08-11

- **Task / mode:** Selected Plan Calendar Flat Day And Legend Chrome / Lite.
- **Outcome:** The reviewed-plan preview calendar now uses flat active-day and legend-swatch
  chrome. The two route-local inset shadows and the obsolete day `box-shadow` transition were
  removed; semantic colours, radii, grid geometry, hover, focus-visible outline, Popover behaviour,
  ARIA state, and preview data rendering remain unchanged.
- **Owner and reused seam:** FRONTEND Product reused the existing selectors in
  `src/styles/forms-onboarding.css`; no shared Calendar or Design System contract was changed.
- **New runtime artifacts:** None.
- **Files changed:** `src/styles/forms-onboarding.css` and this canonical item only.
- **Subagent:** None; the bounded measurable CSS contract was verified directly.

| Check               | Scenario / environment                                    | Result | Evidence                                                                                                                                                                                        |
| ------------------- | --------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source scope        | Route-local stylesheet                                    | Passed | Diff removes only the legend inset shadow, active-day inset-shadow selector, and `box-shadow` transition entry. Preview TSX, shared Calendar, and DS source are unchanged.                      |
| Desktop light       | Reviewed 10K plan preview, 1470×801                       | Passed | Active Rest day, representative workout/rest days, and all seven legend swatches computed `box-shadow: none`; colours, 6px day radius, circular swatches, and zero-width borders remained.      |
| Desktop dark        | Same preview and viewport                                 | Passed | Active Rest/workout chrome and all swatches remained flat with semantic colours; document horizontal overflow was `0`.                                                                          |
| Mobile light/dark   | Exact 375×812                                             | Passed | Calendar bounds were 25–350px inside the 375px viewport, `scrollWidth === clientWidth === 325`, document overflow was `0`, and active days/swatches computed `box-shadow: none` in both themes. |
| Pointer and Popover | Reported 2026-08-07 Rest day                              | Passed | Ordinary activation set `aria-expanded="true"` and opened the existing workout-summary Popover without adding shadow chrome.                                                                    |
| Keyboard and focus  | Tab from the active Rest day to the following workout day | Passed | The workout day received native focus, `:focus-visible`, the existing 2px semantic outline with 2px offset, `aria-expanded="true"`, and its summary Popover while retaining `box-shadow: none`. |
| Console/runtime     | Managed loopback browser session                          | Passed | Browser console and page-error inventories were empty. Runtime was managed, loopback-only, healthy, fresh, and `qa_fixture`; no hosted or paid-provider path was used.                          |
| Static/build        | Focused source validation                                 | Passed | Prettier, `git diff --check`, exact selector review, and an uncontended production build passed. Standard dependency/chunk warnings remained non-gating.                                        |

The normal local `qa_fixture` preview produced its existing saved-plan provenance side effect for
`qa-provider-engine@local.test`; `Add to Calendar` was not invoked, so this proof did not
materialize Calendar workouts. No data was hand-shaped or deleted. The browser theme was restored
to `System` and the session was closed. Screenshots were not retained because DOM geometry and
computed-style evidence directly proved the bounded chrome contract. This is Implementation DoD
only; Global QA Acceptance and release readiness remain unclaimed.

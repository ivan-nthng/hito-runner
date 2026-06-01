# Hito DS Date Picker Correction

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Closed: corrected the reusable Hito DS Date Picker interaction and visual contract.

## Stage

Complete / QA-passed

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
No immediate implementation handoff. This spec is complete and QA-passed.

STAGE:
ARCHITECT closeout / completed frontend spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-30-hito-ds-date-picker-correction.md
- Active plan: docs/plans/active/2026-05-26-ai-authored-first-plan-pipeline.md
- Hito DS Date Picker correction is implemented and QA-passed.
- Keep this file as historical frontend spec evidence.

CONSTRAINTS:
- Do not reopen implementation without a concrete regression.
- Do not claim keyboard-only focus-open or disabled-day styling as exhaustively browser-proven.
- If those non-blocking gaps are elevated, create a separate QA/backlog task.

OUTPUT:
Use the project role output format if a follow-up is explicitly selected.
```

## Owner

FRONTEND / QA

## Last Updated

2026-05-30

## Related Sources

- `docs/plans/active/2026-05-26-ai-authored-first-plan-pipeline.md`
- `src/components/ui/hito-date-time-input.tsx`
- `src/components/ui/hito-date-time-utils.ts`
- `src/components/ui/calendar.tsx`
- `src/components/ui/popover.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/routes/hitoDS.tsx`
- `src/styles.css`
- `qa-artifacts/screenshots/2026-05-29/first-plan-date-time-ds-inputs-qa/target-date-picker-december-view.png`
- `qa-artifacts/screenshots/2026-05-29/first-plan-date-time-ds-inputs-qa/target-date-picker-selected-date.png`
- `qa-artifacts/screenshots/2026-05-30/hito-ds-date-picker-correction-qa/`

## Problem Summary

The current `HitoDateField` is functionally useful, but its interaction anatomy is wrong for a canonical DS primitive.

Observed issues:

- The visible date field does not open the calendar directly; the adjacent calendar button is the main trigger.
- The field and button read as two competing controls instead of one coherent date picker.
- Month navigation inside the calendar can close the popover, which makes the component feel fragile.
- The current input/button/popover border stack creates awkward visual seams and double-control weight.
- `/hitoDS` currently documents the old behavior, saying the calendar button opens the picker.

Root cause:

The component is currently built as `text input + separate PopoverTrigger button + calendar`, while the desired Hito DS pattern is `date input field as primary trigger + inline affordance + connected popover`.

## Current Implementation Reality

Current live seam:

- `HitoDateField` stores controlled `YYYY-MM-DD` text and converts valid ISO values through `hitoDateFromIso` / `hitoIsoFromDate`.
- `HitoDateField` renders an input and a separate secondary button with `Icon name="calendar"`.
- The `PopoverTrigger` wraps only the button, not the field.
- The calendar uses `Calendar mode="single"` and closes on `onSelect`.
- `StructuredPlanConstructor` uses `HitoEditableDateChip` for optional plan start date and `HitoDateField` for target date.
- `/hitoDS#inputs` shows the same primitives and needs to become the reference for corrected behavior.

This is enough to correct the DS pattern without backend changes.

## Intended Interaction Model

### Canonical Anatomy

The Hito DS Date Picker should be one field control, not a field plus a separate primary button.

Required anatomy:

- Form label using existing Hito form label role.
- A single Hito field shell using `hito-field` sizing, radius, hover, focus, error, and disabled states.
- Text input area for typed `YYYY-MM-DD` entry.
- Optional inline calendar icon on the right as an affordance.
- Calendar popover anchored to the field.
- Calendar grid with month navigation.
- Helper, error, and success text using existing Hito field feedback classes.

The inline icon may be clickable only if it behaves as part of the same field. It must not be the only obvious way to open the calendar.

### Input Interaction

Rules:

- Clicking anywhere in the date field opens the calendar popover.
- Focusing the date field may open the calendar by default for `HitoDateField`; if Frontend finds this too aggressive for keyboard users, keep `openOnFocus` configurable and use `true` in onboarding and `/hitoDS` examples.
- Typing must remain possible while the popover is open.
- Typing should not be interrupted or overwritten until the user selects a calendar date.
- The input remains the primary visible control.
- A separate always-visible calendar button should be removed or visually folded into the field as an inline icon affordance.
- If the field already has a valid value, opening the calendar should show the selected date's month.
- If the field is empty, opening the calendar should show the current month or the nearest allowed `minDate`.
- If the field contains an invalid typed value, opening the calendar should not crash or select a fake date; show the current month and keep the invalid field state.

Recommended defaults:

- `openOnClick = true`
- `openOnFocus = true`, with implementation permission to make it configurable if keyboard QA shows surprise or focus trap risk
- `allowTyping = true`
- `closeOnSelect = true`

### Calendar Popover Behavior

Rules:

- Previous/next month controls must not close the popover.
- Month/year controls, if used, must not close the popover.
- Selecting a date updates the input value and closes the popover by default.
- Clicking outside closes the popover.
- Pressing `Escape` closes the popover.
- Pressing `Tab` should move focus predictably through the field/calendar flow without trapping the user.
- Reopening the picker after selection should show the selected date.
- Internal calendar clicks must be treated as inside-popover interactions, not outside-click dismissal.

Preferred calendar navigation:

- Use Hito-styled previous/next icon controls and a quiet month label as the default.
- Avoid native-looking month/year dropdowns unless they can be fully styled as Hito DS controls and proven not to close the popover accidentally.
- If dropdown caption mode remains, its controls must inherit Hito field/button styling and preserve popover open state.

## Visual States

### Field States

Default:

- Use existing `hito-field hito-field-primary hito-field-md`.
- Right icon uses muted foreground and does not add a separate border.

Hover:

- Field border/background follows `hito-field:hover`.
- Inline icon may move from muted to foreground mix, but should stay quiet.

Focus:

- Field focus ring follows existing `hito-field:focus`.
- Focus ring belongs to the field shell, not a separate icon button.

Open:

- Open state should look like focused state.
- Do not add a second loud active border around the popover trigger.

Error:

- Use `hito-field-feedback-error`.
- Error text uses `hito-field-error`.
- The popover may still open so the user can correct the value by selecting a date.

Valid selected:

- The input simply shows the selected ISO value.
- Optional success styling should be used only when a broader form state calls for it, not for every selected date by default.

Disabled:

- Field uses disabled/read-only Hito field treatment.
- Calendar popover does not open.
- Inline icon is muted and non-interactive.

### Popover Surface

The calendar popover should feel connected to the field, but not fused into a double-border object.

Rules:

- Use existing popover surface tokens: `--color-popover`, `--color-popover-foreground`, `--color-hairline`, Hito radius, and Hito shadow rhythm.
- Prefer `radius-xl` or the nearest current popover radius already used by Hito tooltip/dialog surfaces.
- Use one border around the popover, not nested calendar borders.
- Remove extra padding/borders that make the calendar look like a small card inside another card.
- Align the popover to the input start or width depending on available space; it should not appear detached from the field.
- No purple, browser-default, or shadcn-default visual leakage.

### Calendar Day States

Default date:

- Quiet foreground, transparent or very low-chrome background.

Hover date:

- Subtle muted wash.

Today:

- Distinct but secondary to selected state.
- Recommended treatment: small ring, dot, or muted outline using signal mix.

Selected date:

- Most prominent day state.
- Use `signal` fill or strong signal outline with readable foreground.
- Must be distinguishable from today without relying on color only.

Keyboard focus:

- Separate from selected state.
- Use a focus ring consistent with Hito DS focus-visible treatment.

Disabled/unavailable date:

- Muted text and no hover lift.
- Must not look selectable.

Outside-month date:

- Muted and secondary.
- If outside dates are selectable, selection state still wins; if not selectable, use disabled treatment.

## Accessibility And Keyboard Behavior

Requirements:

- The input has a programmatic label through `label` / `id`.
- The field exposes `aria-invalid` when the typed value is invalid.
- Helper/error text connects through `aria-describedby`.
- The field or field wrapper exposes `aria-expanded` when the calendar is open.
- The trigger relationship should be screen-reader legible as a date picker.
- Calendar grid semantics should come from the existing calendar primitive or accessible DayPicker behavior.
- Previous/next month controls need explicit labels.
- `Escape` closes the popover and returns focus predictably.
- Selecting a date should return focus to the input unless the surrounding form flow has a stronger reason not to.
- The inline calendar icon should not create a redundant tab stop unless it performs a distinct accessible action.

Keyboard expectations:

- `Enter` or `ArrowDown` on the focused field may open the popover.
- Typed entry remains possible without forcing keyboard users into the grid.
- Calendar navigation should support arrow-key movement if the underlying calendar primitive supports it.
- `Tab` should not trap users inside the popover.

## Responsive Behavior

Rules:

- The component must work in the structured onboarding two-column layout.
- The component must work in `/hitoDS#inputs`.
- On narrow viewports, the popover must fit within `100vw` with safe side padding.
- Popover collision behavior should flip or shift rather than overflow.
- The calendar should stay readable at mobile width without becoming a dashboard-like surface.
- The input remains full width in form contexts.
- If an optional date chip opens into editing mode, the embedded `HitoDateField` should follow the same date picker behavior.

## Validation States

Typed date policy:

- Canonical stored value remains `YYYY-MM-DD`.
- Invalid typed dates should show inline error state at form validation boundaries.
- If live validation is used, do not show error on the first keystroke unless the field has been blurred or submitted.
- Calendar selection always writes a valid ISO date.
- Clearing optional date fields should be possible where the product already allows an optional date.

Unavailable dates:

- `minDate` and `maxDate` should be supported when the product needs them.
- Disabled dates must be visibly disabled and non-selectable.
- Do not encode training schedule rules locally in the date picker; product-specific date validity belongs outside the DS primitive.

## Component API Guidance

Recommended reusable API shape:

- `id`
- `name`
- `label`
- `value`
- `onChange`
- `placeholder`
- `helper`
- `error`
- `disabled`
- `required`
- `minDate`
- `maxDate`
- `allowTyping`
- `openOnClick`
- `openOnFocus`
- `closeOnSelect`
- `className`

Optional future API only if needed:

- `calendarLabel`
- `disabledDates`
- `formatDisplay`
- `parseInput`
- `onOpenChange`

Do not add product-specific schedule props to the DS primitive.

## Implementation Notes For Frontend

Recommended implementation direction:

- Make the field itself the popover trigger or control `open` from input `onFocus` / `onClick`.
- Keep the input editable; do not replace it with a button-only trigger.
- Move the calendar icon inside the field shell as a right affordance using existing right-icon field spacing.
- Avoid a separate visible secondary button next to the field.
- Ensure calendar previous/next controls do not call `setOpen(false)` and are not interpreted as outside clicks.
- Keep `setOpen(false)` only for date selection, outside click, `Escape`, disabled state, or explicit close behavior.
- Prefer a controlled popover state so internal calendar interactions cannot accidentally dismiss the surface.
- Update `/hitoDS#inputs` copy to stop saying the calendar button opens the picker.
- Add `/hitoDS#inputs` examples for default, selected, invalid typed value, disabled, and min/max disabled dates.
- Keep `HitoEditableDateChip` on top of the same corrected `HitoDateField`; do not create a second date picker behavior for chips.

Likely implementation targets:

- `src/components/ui/hito-date-time-input.tsx`
- `src/components/ui/hito-date-time-utils.ts` only if parsing helpers need a small safe extension
- `src/components/ui/calendar.tsx` only for Hito DS visual state alignment
- `src/routes/hitoDS.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx` only if usage props need adjustment
- `src/styles.css`

## Explicit Non-Goals

- Do not change first-plan backend authoring or persistence.
- Do not redesign structured onboarding.
- Do not introduce a route-local date picker.
- Do not introduce a new UI library or broad calendar system.
- Do not add scheduling/business rules into the DS Date Picker.
- Do not remove typed date entry in this pass.
- Do not make a fake native date input; the Hito DS picker should own its visual language.

## Acceptance Criteria

- Clicking the date input opens the calendar.
- Focusing the date input opens the calendar if `openOnFocus` is enabled for that usage.
- Typing `YYYY-MM-DD` remains possible.
- The separate adjacent calendar button is removed or demoted into an inline field affordance.
- Previous/next month navigation does not close the popover.
- Selecting a date updates the input and closes the popover.
- Clicking outside closes the popover.
- Pressing `Escape` closes the popover.
- Invalid typed date state uses Hito field error styling and remains correctable through calendar selection.
- Selected, today, hover, disabled, outside-month, and keyboard-focus day states are visually distinct and quiet.
- Popover border/radius/shadow aligns with Hito DS and avoids double-border/card soup.
- The component works in structured onboarding and `/hitoDS#inputs`.
- Narrow viewport behavior avoids horizontal overflow.
- `/hitoDS` documents the corrected Date Picker behavior and states.
- No backend, persistence, or training schedule logic changes are required.

## QA Closeout

Status: Passed / complete.

Closed on: 2026-05-30.

Implemented behavior verified:

- `HitoDateField` is input-owned.
- Clicking the input opens the calendar popover.
- No separate adjacent calendar trigger button acts as the main control.
- Inline calendar icon is not exposed as a separate primary button.
- Month navigation stays open.
- Selecting a date updates the field and closes the popover.
- Typed ISO `YYYY-MM-DD` still works.
- `Escape` closes the popover.
- Outside click closes the popover.
- Narrow viewport has no horizontal overflow.
- Optional start-date chip no longer cancels edit state on picker interaction.

Command validation passed:

- targeted ESLint
- `git diff --check`
- `npm run build`

`/hitoDS#inputs` browser proof:

- input click opened popover
- month navigation stayed open from December 2026 to January 2027
- selecting date updated field to `2027-01-11` and closed popover
- typed ISO date retained `2026-12-11`
- `Escape` and outside click close worked
- narrow viewport: `innerWidth 375 / scrollWidth 375`

Structured onboarding browser proof:

- compact `Add Plan Start Date` state was visible
- start-date edit state used the shared picker
- selecting Friday, May 29th, 2026 set `schedule.startDate=2026-05-29`
- edit mode stayed active after calendar click and Save remained visible
- target date picker opened from input itself
- selecting Friday, December 11th, 2026 set `schedule.targetDate=2026-12-11`
- masked target time typing `35000` produced `3:50:00`
- validation messages were empty
- no plan/profile/workout/log mutation occurred before confirm

Screenshot folder:

- `qa-artifacts/screenshots/2026-05-30/hito-ds-date-picker-correction-qa/`

Screenshots:

- `hitods-input-open-calendar.png`
- `hitods-month-navigation-stays-open.png`
- `hitods-selected-date-state.png`
- `hitods-narrow-viewport-open.png`
- `onboarding-compact-add-plan-start-date.png`
- `onboarding-start-date-edit-state.png`
- `onboarding-start-date-picker-open.png`
- `onboarding-target-date-picker-fullscreen.png`

Closeout boundaries:

- Do not claim review/confirm was tested in this slice.
- Do not claim keyboard-only focus-open was separately browser-proven.
- Do not claim disabled-day styling was exhaustively browser-proven.
- Do not reopen implementation without a concrete regression.

Non-blocking QA notes:

- Simple built-in browser click path was flaky on the long onboarding optional start-date chip flow,
  but the same built-in browser session completed via Playwright handle.
- One onboarding screenshot needed local full-screen screenshot fallback because
  `Page.captureScreenshot` timed out.
- Keyboard-only focus-open was not separately browser-proven.
- Disabled-day styling was source/CSS-inspected, not exhaustively browser-proven.

## Risks

- Opening on focus can surprise keyboard users if implemented too eagerly. Keep it configurable and validate with browser QA.
- Month/year dropdown caption mode may retain browser-looking controls or accidental close behavior. Prefer Hito-styled previous/next month navigation unless dropdowns are made fully DS-safe.
- If the input and popover both own focus incorrectly, typing, Escape, and outside-click behavior can fight each other.

## QA Notes

QA passed the corrected Date Picker interaction on 2026-05-30. Future QA should only reopen this
spec for concrete regressions or explicitly elevated non-blocking gaps.

Previously verified:

- `/hitoDS#inputs` Date Picker examples.
- Structured onboarding target date field.
- Optional plan start date chip editing state.
- Mouse click, typing, Escape, outside click, month navigation, selection, and narrow viewport.
- No submit-boundary mutation before confirm in the structured first-plan flow.

Not fully browser-proven in this closeout:

- keyboard-only focus-open
- exhaustive disabled-day visual behavior

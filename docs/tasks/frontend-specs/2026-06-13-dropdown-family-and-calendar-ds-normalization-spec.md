# Hito Dropdown Family And Calendar DS Normalization Spec

## Status

paused — dropdown-family half is implemented and QA-passed; the remaining calendar-specimen work is
now superseded by the canonical
[Hito DS Information Architecture And Specimen Contract](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>).
This spec remains source context for dropdown/menu anatomy and calendar drift, but it is no longer
the immediate execution owner.

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

product

## Task

Close out this section-specific dropdown/calendar normalization spec now that the accepted
canonical `/hitoDS` IA pilot has absorbed and validated its intended behavior.

## Stage

DESIGN SYSTEM closeout / subordinate spec accepted under canonical `/hitoDS` IA pilot

## Owner

Design System

## Last Updated

2026-06-15

## Related Sources

- [docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>)
- [docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md>)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1)
- [src/components/ui/dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx:1)
- [src/components/ui/select.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/select.tsx:1)
- [src/components/ui/hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:1)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:1)
- [src/components/hito-ds/calendar-workout-playground.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/calendar-workout-playground.tsx:1)
- [src/components/hito-ds/workout-library-playground.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/workout-library-playground.tsx:1)
- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:1)
- [src/components/onboarding/ManualUserBuiltPlanPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/ManualUserBuiltPlanPanel.tsx:1)

## Why This Exists

The user feedback is correct in two places:

1. Hito already has dropdown/select wrapper chrome, but `/hitoDS` does not clearly document one canonical menu-item family with the variants that product/admin now actually use.
2. `/hitoDS` still gives too much visual weight to the later workout-library/fake-calendar playground direction, while the true reusable calendar primitives already live in product and in `HitoCalendarDayCell` / `HitoWorkoutDayRow`.

The result is a confusing reference surface:

- engineers can find dropdown wrappers, but not one clear family of row anatomy
- calendar/product work can drift because the most truthful calendar specimen is not the clearest thing on the page

This spec keeps the fix bounded:

- normalize one dropdown/menu family
- improve documentation and playground coverage
- keep real product behavior unchanged unless Frontend is only swapping route-local menu anatomy for the canonical family

## Closeout Snapshot - 2026-06-15

This spec is now fully satisfied by the accepted IA pilot.

Accepted proof now exists for:

- `/hitoDS#dropdowns` as one canonical dropdown/list-item family
- explicit `Interactive demo` and `Dropdown anatomy` modes
- a DS-aligned right settings panel
- real interactive `DropdownMenu` opening from the visible trigger
- selected/destructive/disabled/submenu/footer coverage
- matching dropdown family coverage on the export surface
- local `375px` overflow closure inside `#dropdowns`
- `/hitoDS#calendar-workout-playground` as a product-aligned day/workout-row specimen inside the
  shared `Demo` / `Variants` workbench

This spec is now completed as subordinate history/context. Any future dropdown/calendar follow-up
must route from the canonical `/hitoDS` IA plan, not from this older section-level spec.

## Current Audit

## 1. What Already Exists

Hito already has a real wrapper-level menu foundation:

- `DropdownMenuContent` and related primitives use `hito-ui-menu-surface` and `hito-ui-menu-item`
- `SelectContent` and `SelectItem` share that same menu surface family

References:

- [src/components/ui/dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx:1)
- [src/components/ui/select.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/select.tsx:1)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1019)

There is also a second product-facing row family:

- `hito-shell-menu`
- `hito-shell-menu-item`
- `hito-menu-text`
- `hito-menu-meta`

References:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:4047)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3517)

## 2. What Is Missing

What is missing is not menu chrome.

What is missing is a documented canonical item anatomy for:

- label-only item
- item with left icon
- item with left icon plus description
- item with right meta / shortcut / count
- item with selected check state
- item with submenu chevron
- destructive item
- disabled item

Today those appear across the app, but not as one explicit DS family.

## 3. Where Drift Is Visible

### Simplified DS specimen

The current `/hitoDS#dropdowns` section is too simple:

- it shows a trigger button
- it shows a static list of `MenuRow`
- it does not show actual Radix dropdown content anatomy
- it does not show description rows, trailing metadata, selected state, submenu, or destructive state

Reference:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3552)
- [src/components/hito-ds/specimen-previews.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/specimen-previews.tsx:609)

### Real product/admin patterns

The actual app already uses richer menu rows:

- admin filter menus with icon + label + optional second line
- manual calendar add menu with icon + title + helper copy
- manual template submenu with status pill + title + helper copy

References:

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:1024)
- [src/routes/admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx:701)
- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:694)

### Calendar DS truth is visually diluted

The real shared calendar primitives already exist:

- `HitoCalendarDayCell`
- `HitoWorkoutDayRow`

References:

- [src/components/ui/hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:1)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:572)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:833)

`/hitoDS` already has a `CalendarWorkoutPlayground` based on those primitives, which is good.

But the separate `WorkoutLibraryPlayground` still reads like a competing owner and pushes attention toward a less canonical fake-library view.

References:

- [src/components/hito-ds/calendar-workout-playground.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/calendar-workout-playground.tsx:1)
- [src/components/hito-ds/workout-library-playground.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/workout-library-playground.tsx:1)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:133)

## Root Cause

The system was normalized at the wrapper level, but not yet at the specimen and row-anatomy level.

So today we have:

- one shared dropdown/select wrapper family
- multiple real row compositions built on top of it
- no single explicit DS contract saying which row compositions are canonical

The calendar issue is similar:

- the real primitives are correct
- the product calendar uses them
- `/hitoDS` still contains a secondary playground direction that competes with the real specimen owner

## Design System Decision

Do not invent a new dropdown system.

Do not redesign the calendar.

Do this instead:

1. keep `DropdownMenu` and `Select` wrappers as the shared menu infrastructure
2. define one Hito menu-item family on top of that infrastructure
3. document the family in `/hitoDS` with an interactive explorer
4. align the manual calendar and nearby menus to that family where they are currently custom
5. make the real calendar day primitives the clearest calendar specimen in `/hitoDS`
6. demote or remove the competing workout-library playground from primary DS ownership

## Canonical Menu Family

## Family Name

Use one explicit Hito menu family for dropdown/select content rows.

Recommended naming:

- `Hito menu surface`
- `Hito menu item`
- `Hito menu item with description`
- `Hito menu item with trailing meta`
- `Hito menu item destructive`
- `Hito menu item selected`
- `Hito menu subgroup trigger`

Frontend may implement this either as:

- CSS-class compositions on current wrappers
- or one tiny presentational helper for row content only

Do not build a new menu framework.

## Allowed Item Anatomies

Canonical item variants should cover these only:

1. simple label
2. left icon + label
3. left icon + label + description
4. left icon + label + trailing meta
5. left icon + label + description + trailing meta
6. selected item with check state
7. destructive item
8. submenu trigger
9. disabled item

Trailing meta may be:

- shortcut text
- status word
- compact count
- chevron/right affordance

Do not introduce broad combinatorial variants beyond these proven cases.

## Visual Rules

- one shared menu surface tone
- one shared row height rhythm, with compact and detail row heights only
- left icon and right meta stay restrained
- description is secondary, never louder than the title
- destructive state uses semantic destructive tone only
- selected state uses check/signal treatment, not a second visual language

## DS Documentation Requirements

Update `/hitoDS` dropdown coverage so it shows:

- real `DropdownMenuContent`
- real `DropdownMenuItem`
- real `DropdownMenuSubTrigger`
- real `SelectContent` / `SelectItem` parity
- interactive knobs for:
  - left icon on/off
  - description on/off
  - trailing meta type
  - selected/unselected
  - destructive/default
  - disabled/enabled
  - submenu/simple row

Do not keep the current section as a static trigger plus `MenuRow` list only.

## Calendar Specimen Decision

The canonical calendar DS owner is:

- `HitoCalendarDayCell`
- `HitoWorkoutDayRow`
- `CalendarWorkoutPlayground`

The real product calendar in [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:1) is the behavior truth.

`/hitoDS` should show the shared presentational truth clearly and directly.

That means:

- keep `CalendarWorkoutPlayground` as the primary calendar DS section
- ensure its specimens reflect the actual product day states and labels used in `Calendar.tsx`
- demote or remove `WorkoutLibraryPlayground` from primary DS navigation if it still reads like a competing calendar owner

The user feedback here matches the active plan from June 9: the fake-library direction should not overpower the true calendar specimen.

## Exact Calendar Corrections

1. The calendar section in `/hitoDS` should clearly lead with the real day-cell and workout-row primitives.
2. The available states in the playground should mirror the product calendar states first:
   - workout
   - rest
   - empty/manual add
   - outside month
   - today
   - selected
   - focused
   - planned
   - completed
   - partial
   - skipped
   - evidence attached
   - feedback ready
3. Any later fake workout-library matrix should be demoted to a secondary note/link or removed from top-level DS navigation.
4. `/hitoDS` should not make a reader wonder which calendar is canonical.

## Exact Frontend Scope

Inspect and normalize:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1)
- [src/components/hito-ds/specimen-previews.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/specimen-previews.tsx:1)
- [src/components/ui/dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx:1)
- [src/components/ui/select.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/select.tsx:1)
- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:1)
- [src/components/onboarding/ManualUserBuiltPlanPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/ManualUserBuiltPlanPanel.tsx:1)
- [src/components/hito-ds/calendar-workout-playground.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/calendar-workout-playground.tsx:1)
- [src/components/hito-ds/workout-library-playground.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/workout-library-playground.tsx:1)
- [src/components/Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx:1)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1019)

## What To Normalize First

### Slice 1

`/hitoDS` dropdown explorer:

- completed / QA-passed
- replaced the static dropdown demo with a real two-mode explorer
- documented one menu family with the proven row variants
- closed the local `375px` overflow defect inside `Interactive demo`

### Slice 2

Calendar DS truth:

- completed / QA-passed under the accepted IA pilot
- keep `CalendarWorkoutPlayground` as primary
- demote/remove `WorkoutLibraryPlayground` from top-level DS emphasis
- make sure playground states reflect actual product calendar day types

### Slice 3

Real consumer cleanup:

- optional future follow-up only if the broader IA rollout later proves consumer drift remains
- align manual calendar add/copy/template menus and nearby onboarding calendar menus to the canonical item family if they still diverge after Slice 1

## What Not To Touch

- do not redesign real calendar layout
- do not change backend or manual-plan behavior
- do not invent a new menu framework
- do not create a second calendar DS primitive
- do not turn fake-library review into the primary DS calendar owner
- do not broaden this into a full `/test-calendar` redesign

## Validation

- `git diff --check -- src/routes/hitoDS.tsx src/components/hito-ds/specimen-previews.tsx src/components/hito-ds/calendar-workout-playground.tsx src/components/hito-ds/workout-library-playground.tsx src/components/ui/dropdown-menu.tsx src/components/ui/select.tsx src/components/manual-workout/ManualWorkoutAuthoringControls.tsx src/components/onboarding/ManualUserBuiltPlanPanel.tsx src/styles.css`
- `npm exec eslint -- src/routes/hitoDS.tsx src/components/hito-ds/*.tsx src/components/ui/dropdown-menu.tsx src/components/ui/select.tsx src/components/manual-workout/ManualWorkoutAuthoringControls.tsx src/components/onboarding/ManualUserBuiltPlanPanel.tsx`
- inspect `/hitoDS#dropdowns`
- inspect `/hitoDS#calendar-workout-playground`
- confirm the dropdown explorer now documents the actual family used by product/admin
- confirm the calendar section clearly presents the real shared primitives instead of a competing fake-library owner

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Close out this subordinate dropdown/calendar normalization spec after the canonical /hitoDS IA Slice 1 pilot is accepted.

Stage:
PRODUCT closeout / subordinate DS spec reconciliation.

Context:
This spec remains useful source context for dropdown/menu row anatomy and calendar specimen drift,
but it no longer owns the immediate implementation slice. The canonical /hitoDS IA and shared
Demo / Variants / Settings specimen-page contract now live in:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md

Root cause and architecture fit:
- Visible symptom: section-specific DS specs can still route Frontend around the new canonical IA.
- Underlying cause: older calendar-only normalization prompt predates the global specimen contract.
- Canonical owner: /hitoDS IA plan first; this spec is subordinate context only.

Decision:
Keep this spec completed. Do not route a standalone dropdown-only or calendar-only Frontend slice
from this file now that the canonical /hitoDS IA pilot has already accepted the intended behavior.

Expected next action:
If future dropdown/calendar follow-up appears, route it from the canonical /hitoDS IA plan rather
than reviving this section-level spec as the primary owner.
```

## Blockers

No hard blockers.

The only caution is scope: do not mix this with broader test-calendar, manual-workout feature, or fake product-flow redesign work.

# HITO-292 — Unify Calendar Add Actions Behind the Existing Plus Trigger

- **Date:** 2026-08-28
- **Mode:** Tracked
- **Type:** Bug
- **Primary Area:** Runner
- **Priority:** High
- **Canonical Task:** [HITO-292 in Notion](https://app.notion.com/p/Unify-Calendar-Add-Actions-Behind-the-Existing-Plus-Trigger-3cbfe5f58cf581a892bfdce0529f2279)
- **Initial intake receipt:** `Ready / Implementation / FRONTEND`; live lifecycle remains Notion-only.
- **Archive intent:** retain as the compact interaction contract and terminal focused evidence.

## Task

Use one Calendar add path. An empty Rest day uses the existing icon-only `+`; an occupied past or
current day keeps Activity-file intake in the existing `…` actions. Remove the old text/chevron
`Add workout` branch, keep the menu context-specific, allow an Activity file on the runner's exact
current date, preserve the future-date rejection for Activity files, and remove the separate Rest
action.

## User Report And Evidence

Ivan reported that past Calendar days already use an icon-only `+`, while other eligible days show
an `Add workout` dropdown. He selected the existing past-day `+` as the common trigger.

[HITO-255](./2026-08-25-hito-unplanned-fit-calendar-materialization.md) confirms the source of the
inconsistency: it introduced `+ -> Add activity` for past days but explicitly preserved the older
today/future `Add workout` interaction. The visible trigger inconsistency is therefore confirmed;
no Design System cause needs to be invented. Ivan's newly accepted exact-today Activity-file action
does cross the existing Backend eligibility boundary described below.

## Expected Behavior

- Every empty Rest day uses the same Design System icon-only `+` trigger. The old text/chevron
  `Add workout` trigger is removed rather than repaired as a second path.
- A past Rest day exposes `Add Activity`.
- A current-date Rest day exposes `Add Activity`, `Start from Scratch` and `Choose Template`.
- A future Rest day exposes `Start from Scratch` and `Choose Template`; it does not expose an
  Activity-file action.
- An occupied past or current day shows no `+`; its existing `…` menu retains Activity-file intake.
- `Add Rest Day` is absent. An empty Calendar date is already Rest and creates no separate Rest
  entity.
- Existing occupied-day and manual/template eligibility remains unchanged. The only Activity-date
  eligibility change is the exact current date; future Activity dates remain rejected.
- Desktop preserves hover/focus discovery. Touch layouts keep the eligible trigger visible. The
  control has a localized accessible name and restores focus after menu dismissal or selection.

## Source Investigation And Existing Seam

Reuse the existing owners already identified by HITO-255:

- `src/components/Calendar.tsx` for Calendar action/menu composition;
- `src/components/calendar/calendar-projection.ts` for day-action eligibility;
- `src/components/ui/hito-calendar-day.tsx` for day anatomy;
- `HitoButton` and `DropdownMenu` for the icon-only trigger, keyboard navigation, collision handling
  and focus return.

The source confirms two separate causes on production commit `ed30bd6`:

1. `CalendarDaySlot` renders historical Activity intake through `PastActivityAddMenu`, whose
   Design System icon-only `+` is revealed by desktop hover/focus and remains visible on touch.
   Eligible today/future empty days take a different `addAction` branch and render a text
   `Add workout` action inside `CalendarDaySurface`. HITO-292 was admitted for this known split but
   never implemented, so the missing future-day top `+` is not a new CSS regression. Ivan now also
   reports that the old text/chevron trigger does not open its actions in production. FRONTEND must
   reproduce that interaction failure, but the accepted repair still removes the obsolete branch
   rather than adding another event or compatibility handler.
2. `canAddPastActivity` requires `iso < currentDate`, and the canonical Activity review currently
   classifies every FIT local date `>= currentDate` as `today_or_future`. Therefore the newly
   accepted exact-today Activity action is not a Frontend-only menu change: BACKEND must first
   extend the existing owner-bound review/confirm seam for `activityLocalDate === currentDate` while
   preserving future rejection, idempotency, ownership and Calendar atomicity.

`ManualWorkoutAddMenu` still renders `Add Rest Day` because Calendar passes
`showRestDayOption={workout?.type !== "rest"}`. No new primitive, route, menu owner or compatibility
path is required. FRONTEND must consolidate `PastActivityAddMenu` and the today/future trigger
composition behind one Calendar-owned add menu while reusing `HitoButton`, `DropdownMenu` and the
existing Activity/manual/template commands.

## Scope And What Not To Touch

BACKEND owns only the exact-current-date Activity eligibility correction, then FRONTEND owns the
smallest presentation and menu-composition correction. Do not change:

- future Activity rejection;
- occupied-day `…` ownership and past Activity upload, factual Review, Confirm or Activity
  association semantics;
- manual/template authoring commands or routes;
- Calendar persistence shape, RLS, provenance or readback ownership;
- empty-date Rest semantics or create a persisted Rest replacement;
- shared Design System primitives unless a genuine cross-consumer primitive defect is first proven;
- fixtures, providers, hosted data, migrations, deployment or unrelated dirty work.

## Validation Expectations

Focused source and browser evidence must prove:

1. one consistent `+` anatomy on every eligible empty past/current/future Rest day and no `+` on an
   occupied day;
2. past Rest contains `Add Activity`; current Rest contains `Add Activity`, `Start from Scratch`
   and `Choose Template`; future Rest contains only `Start from Scratch` and `Choose Template`;
3. `Add Rest Day` is absent and ineligible dates gain no action;
4. an Activity whose canonical local date is exactly today completes through the existing factual
   Review/Confirm path, while a future Activity remains rejected and duplicate/foreign inputs remain
   idempotent and owner-bound;
5. occupied past/current days retain Activity-file intake through `…`, and underlying Activity,
   scratch and template workflows still receive the same date and command;
6. desktop pointer/keyboard, mobile/touch, focus return, English/Portuguese, Light/Dark and
   responsive containment pass without console errors.

Browser acceptance remains separate from source/build checks. Implementation, independent QA and
release remain separate acceptance layers; this intake does not claim any of them.

## Frontend Implementation Receipt — 2026-08-30

- **Role / lane:** `FRONTEND` / Product.
- **Demonstrated cause:** `CalendarDaySlot` had two ordinary add owners: the historical
  `PastActivityAddMenu` plus and the today/future `ManualWorkoutAddMenu` text/chevron surface. The
  historical branch also rendered beside an occupied day's `…`, while `Add Rest Day` remained a
  separate manual-menu action.
- **Implemented boundary:** Calendar projection now supplies separate `canAddActivity` and
  `canAddWorkout` facts. One Calendar-owned `CalendarAddMenu` renders the existing icon-only Hito
  `+` in the canonical top-right slot for eligible Rest surfaces. Its menu delegates to the existing
  Activity workflow and canonical scratch/template command owner. Occupied past/current workouts
  expose Activity intake inside the existing source-action `…`; occupied future workouts retain
  their existing eligible source actions without Activity. Move-target composition remains
  separate and unchanged.
- **Removed responsibilities:** deleted the `PastActivityAddMenu` implementation, the ordinary
  text/chevron `Add workout` render branch, its non-move target-label helper, and the live
  `Add Rest Day` menu branch. No compatibility trigger, alternate importer, Calendar writer, state
  store, Design System primitive, token, route, fixture or runtime artifact was added.
- **Changed paths:** `src/components/Calendar.tsx`,
  `src/components/calendar/calendar-projection.ts`,
  `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`,
  `src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx`, and
  `src/lib/ui-locale-messages.ts`, plus this receipt.
- **Focused proof:** a direct projection assertion passed the past/current/future Rest and occupied
  matrix; source assertions passed for one add owner, exact Activity/manual callback dates, trigger
  ref focus return, zero old text/chevron path and zero `Add Rest Day` render path; English and
  Portuguese accessible add labels passed. `npm run validate-manual-workout-authoring`,
  `npm run validate-runner-calendar-context`, the source-only UI locale validator, focused ESLint,
  focused Prettier and `git diff --check` passed. The manual validator intentionally omitted local
  persistence because the task did not admit a database replay.
- **Build and baseline:** the production client compilation passed. The checkout-wide SSR build was
  then blocked by the unrelated repository-document migration leaving `docs/plans/active` empty for
  the Admin repository snapshot plugin. The shared DS validator also retained its existing factual
  chart and current-doc failures. Focused TypeScript output contains only the pre-existing
  `calendar-projection.ts:518` `WorkoutDocumentSection`/`WorkoutSegmentLike` mismatch outside this
  diff. These baseline failures were not changed or hidden.
- **Preservation:** Backend-owned hashes remain
  `30f16828a627a0f5f37976dacc202bc318888284d482277b11a8af3cc55af53d` for
  `unplanned-review.server.ts` and
  `97f49a21c75193a856c039c9eefd0eee86728cb4c533eda32b88b7ea03c53aeb` for
  `validate-runner-activity-foundation.ts`. The unrelated tracked and untracked dirty fingerprints
  at handoff are `33b3817b383d1d591e487fdb3bde14407e45cb439afa0a9e91f0e61f75bd3adf` and
  `1f5af7c1d0c83db05b158e7775ee258cec886b3ad52d3bc1d882cc547f280c11`.
- **Omitted acceptance:** no browser, fixture, provider, hosted, persistence, Global QA, release or
  deployment claim is made. Independent QA owns the full past/current/future × Rest/occupied × FIT
  absent/current/duplicate browser matrix after a serialized fresh artifact is admissible.
- **Next owner:** `QA` for the unchanged proportional browser acceptance; same-task Frontend defects
  return to `FRONTEND`.

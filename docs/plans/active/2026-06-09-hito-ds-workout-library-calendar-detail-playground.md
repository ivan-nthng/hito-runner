# Hito DS Workout Library Calendar And Detail Playground

## Status

frontend_implemented_awaiting_qa

## Type

plan

## Priority

high

## Next Recommended Role

QA

## Task

Create a Hito DS fake workout-library calendar with drilldown detail specimens for every canonical
workout type and provider-feedback overlay state.

## Stage

FRONTEND implementation / static DS workout library playground.

## Previous Handoff Prompt

Historical prompt used to create the Running Coach specimen matrix; superseded by the Frontend
implementation status above.

```text
ROLE: RUNNING COACH

Task:
Create the canonical workout specimen matrix for the Hito DS workout-library calendar/detail
playground.

Stage:
RUNNING COACH source-of-truth / workout library specimen matrix.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md

Context:
- The user wants a design-system sandbox that avoids creating real plans just to inspect workout
  visuals.
- `/hitoDS#calendar-workout-playground` already proves day-cell/mobile-row states, but it does not
  provide a full fake calendar of canonical workout identities or drilldown workout-detail examples.
- The new playground must show all canonical workout identities one after another in a fake calendar
  and let the user open a static detail specimen for each workout.
- Every specimen workout must be fully populated with detailed watch-executable segments.
- Provider/feedback overlay controls should let QA/design inspect no evidence, Garmin evidence,
  feedback-ready, and future Strava/provider visual states without creating real uploaded activity
  data.

Your job:
1. Produce a backend/frontend-ready markdown or CSV matrix under `docs/tasks/running-coach/`.
2. Cover every canonical workout identity currently accepted by Hito, including rest, recovery,
   easy, steady, long, cutback, taper, tempo, threshold, intervals, progression, race/endpoint,
   hills, trail, ultra, and mountain identities.
3. For each identity define:
   - family
   - display label
   - calendar label
   - detail title
   - primary purpose
   - segment sequence
   - segment prescription values
   - secondary cues
   - target truth mode
   - allowed provider/feedback overlay expectations
   - what the specimen proves
4. Preserve the accepted product contract:
   - watch/app execution is assumed
   - no 5K benchmark dependency in the normal happy path
   - no fake precise pace
   - no fake personal HR
   - Hito default HR zones are editable defaults only, not personal HR truth
   - cues are secondary to numeric structure
5. Do not design product mutations, manual workout CRUD, persistence, active-plan replacement, or
   provider sync behavior.

Validation:
- `git diff --check -- docs/tasks/running-coach`

Report:
1. Task
2. Stage
3. Files changed
4. Workout identities covered
5. Segment/anatomy contract
6. Provider overlay assumptions
7. What remains visual-only
8. Validation results
9. Blockers
```

## Owner

ARCHITECT / RUNNING COACH / DESIGNER / FRONTEND / QA

## Last Updated

2026-06-09

## Reference Links

- [Project operating rules](../../../AGENTS.md)
- [Project context](../../context.md)
- [Glossary](../../glossary.md)
- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Current state](../../current-state.md)
- [Completed calendar/workout playground spec](../../tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md)
- [Shared calendar-day component](../../../src/components/ui/hito-calendar-day.tsx)
- [Existing calendar/workout playground](../../../src/components/hito-ds/calendar-workout-playground.tsx)
- [Existing calendar/workout playground data](../../../src/components/hito-ds/calendar-workout-playground-data.ts)
- [Hito DS route](../../../src/routes/hitoDS.tsx)
- [Hito DS playground shell](../../../src/components/hito-ds/playground.tsx)
- [Rich workout model](../../../src/lib/rich-workout-model.ts)
- [Workout glyph mapping](../../../src/lib/workout-glyph.ts)
- [Workout detail route](../../../src/routes/workout.$date.tsx)
- [Intervals visualization](../../../src/components/IntervalsViz.tsx)
- [Workout feedback panel](../../../src/components/CompletionPanel.tsx)
- [Running Plan Engine Watch-Executable Workout Library](../../tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md)
- [Running Plan Creation Engine Rebuild](2026-06-08-running-plan-creation-engine-rebuild.md)

## User Need

The user wants a stable design-system sandbox for workout-day and workout-detail visual testing.

Today, validating a calendar cell, workout detail page, Garmin/Strava feedback marker, or segment
layout often requires creating or importing a real plan. That slows design, QA, and product review
and encourages one-off fixtures.

The requested solution is a dedicated `/hitoDS` playground:

- a fake calendar filled with every canonical workout type in sequence
- every fake day has a fully populated exemplar workout
- clicking a fake day opens the static exemplar workout detail
- controls can toggle result/evidence/feedback provider states
- the playground has its own sidebar item in the Hito DS navigation
- the playground uses Hito DS primitives and shared calendar-day anatomy
- no backend mutation, persistence, provider sync, or real plan creation is involved

## Architecture Decision

Create a new Hito DS section:

`/hitoDS#workout-library-playground`

Suggested sidebar label:

`Workout library`

This is separate from the completed `/hitoDS#calendar-workout-playground`.

Reason:

- The existing calendar/workout playground proves state anatomy for one controlled day cell or
  mobile row.
- The new playground proves a full library of workout identities plus drilldown workout-detail
  specimen readback.
- Combining them would make the accepted state playground too large and blur two different jobs.

## Canonical Boundary

### Shared Visual Primitives

Allowed reuse:

- `HitoDsPlayground` for section anatomy.
- `HitoCalendarDayCell` and `HitoWorkoutDayRow` for fake calendar day and mobile row anatomy.
- `WorkoutGlyph` / icon primitives for canonical identity visuals.
- Hito DS controls, buttons, selects, choice toggles, labels, dividers, status pills, grouped rows,
  tooltips, and dialog/sheet primitives.
- Presentational workout-structure components only if they do not own route, loader, persistence,
  or server-action behavior.

### Playground-Only Ownership

The new playground owns:

- static specimen data
- fake dates
- selected specimen state
- fake provider/evidence overlay state
- fake result state
- static drilldown behavior inside `/hitoDS`
- visual stress states for detail page segments

### Product-Only Ownership

The real product calendar and workout detail continue to own:

- persisted `TrainingSnapshot` and `Workout` truth
- real route links
- real `/workout/$date` route behavior
- real Garmin upload/remove actions
- real comparison/AI insight readback
- workout log mutation
- active-plan lifecycle
- provider sync
- manual workout creation/edit/copy/paste/recurrence

## Required Specimen Inventory

The first implementation must cover every currently accepted canonical workout identity from
`src/lib/rich-workout-model.ts`.

Required identity coverage:

| Family | Required identities |
|---|---|
| Rest | `rest_and_recovery` |
| Recovery | `recovery_jog` |
| Easy | `easy_aerobic_run`, `cutback_aerobic_run`, `easy_run_with_strides` |
| Steady | `steady_aerobic_run`, `marathon_steady_specificity` |
| Long | `long_aerobic_run`, `long_run_with_steady_finish`, `base_endpoint_marker`, `cutback_long_run`, `taper_long_run`, `ultra_time_on_feet_durability` |
| Tempo | `controlled_tempo_session`, `half_marathon_threshold_durability`, `half_readiness_marker` |
| Intervals | `distance_intervals`, `time_intervals`, `5k_sharpening_repeats`, `10k_rhythm_intervals`, `quality_session` |
| Progression | `progression_run` |
| Race / endpoint | `race_pace_session`, `taper_tuneup_run`, `tenk_completion_or_checkpoint` |
| Hills | `uphill_repeats`, `rolling_hills_session`, `controlled_downhill_durability`, `climbing_steady_run` |
| Trail / mountain | `technical_trail_easy`, `hike_run_endurance`, `mountain_long_run_time_on_feet` |

If backend or Running Coach adds new canonical identities before implementation, the specimen matrix
must add them before QA passes.

## Playground UX Contract

### Calendar View

The playground should render a fake filled calendar, not a real persisted plan.

Requirements:

- show all workout identities sequentially
- use believable fake dates, such as one reference month plus spillover weeks
- avoid implying these are generated rows from a real plan
- group visually by week or phase only when useful for scanning
- use real shared day-cell/mobile-row anatomy
- desktop view shows a dense calendar grid
- mobile view shows the corresponding row/list anatomy
- each workout cell is clickable/selectable
- selected cell opens or updates the drilldown detail panel
- cells should include representative title, family glyph, result marker, and provider/evidence
  marker based on controls

### Detail View

Clicking a fake workout opens the static exemplar detail.

Allowed UI patterns:

- desktop split view: calendar left, detail right
- mobile: selected detail below calendar or in a Hito DS sheet/dialog
- optional `Back to library` control on mobile

Detail specimen must show:

- workout family and identity
- workout title
- purpose
- watch-executable segment list
- segment prescription values
- secondary cues
- metric truth mode
- editable default HR note when applicable
- result/evidence/feedback overlay state
- provider note row
- what this proves / what this does not imply

Do not import the real `WorkoutPage` route or fake the route loader.

### Provider / Feedback Overlay Controls

The first playground control set should include:

- Provider state:
  - `None`
  - `Garmin evidence attached`
  - `Garmin feedback ready`
  - `Strava activity attached` as future visual-only
  - `Provider comparison ready` as future visual-only if useful
- Result state:
  - `Planned`
  - `Completed`
  - `Partial`
  - `Skipped`
- Detail density:
  - `Compact`
  - `Full segments`
- View:
  - `Desktop`
  - `Mobile`
- Filter:
  - all families
  - family-specific filter if the full calendar becomes too dense

Provider control rules:

- Garmin states may reuse current evidence/feedback marker language because Garmin upload/readback
  exists.
- Strava/provider states must be labelled future/specimen-only until provider sync ships.
- Provider overlays must never imply real uploaded data, real comparison rows, real AI insight, or
  connected account state.

## Static Data Contract

The implementation should introduce a focused fixture module, for example:

`src/components/hito-ds/workout-library-playground-data.ts`

The fixture should not be a second product plan model.

It may contain:

- canonical identity key
- family
- glyph
- display label
- title
- purpose
- fake date
- segment rows
- target truth mode
- provider overlay compatibility notes
- specimen-only notes

It must not contain:

- user ids
- plan ids
- persisted workout ids
- raw provider payloads
- real Garmin/Strava account truth
- server actions
- active-plan lifecycle behavior
- generated plan recipe logic

## Implementation Slices

### Slice 1: Running Coach Specimen Matrix

Owner:

RUNNING COACH

Scope:

- Create a canonical workout specimen matrix under `docs/tasks/running-coach/`.
- Cover every identity listed in this plan.
- Fill each workout with detailed watch-executable segments.
- Include provider/feedback overlay assumptions.
- Keep the matrix implementation-ready for frontend fixtures.

Acceptance:

- every canonical identity has a specimen row
- every non-rest identity has at least warmup/opener, main/work, and cooldown/finish style anatomy
  unless Running Coach explicitly documents why a different structure is safer
- repeat workouts include repeat count, work unit, recovery unit, and cooldown
- long runs over 60 minutes are never a single anonymous block
- cues stay secondary to numeric structure
- no fake precise pace or fake personal HR
- default HR zones, if used, are labelled editable defaults

### Slice 2: Designer Interaction Spec

Owner:

DESIGNER

Scope:

- Define the `/hitoDS#workout-library-playground` layout.
- Choose desktop split layout and mobile drilldown behavior.
- Define control placement using `HitoDsPlayground`.
- Define provider/result overlay styling.
- Define how the new sidebar item appears without disrupting existing Hito DS navigation.

Acceptance:

- no nested card soup
- fake calendar and detail read as one workbench
- click-to-detail behavior is obvious
- provider overlay states are clear and bounded
- Strava/provider-future states are visibly specimen-only
- 375px mobile behavior is specified

### Slice 3: Frontend Static Playground Implementation

Owner:

FRONTEND

Scope:

- Add the new `/hitoDS` section and sidebar item.
- Add static specimen data from the Running Coach matrix.
- Render the fake calendar using `HitoCalendarDayCell` / `HitoWorkoutDayRow`.
- Render selected detail using Hito DS primitives and, only if safe, presentational structure
  helpers.
- Add controls for view, family filter, result state, provider state, and detail density.
- Preserve existing `/hitoDS#calendar-workout-playground`.

Acceptance:

- all canonical identities are represented
- selecting every specimen opens a detail readback
- all specimen details show full segment structure
- provider/result controls update calendar and detail visuals
- no product route, loader, server action, persistence, or provider upload action is imported
- no real plan creation is required to inspect the states
- existing `/hitoDS` anchors still work
- desktop, intermediate, and 375px mobile have no horizontal overflow

### Slice 4: QA Acceptance

Owner:

QA

Scope:

- Source inspect dependency boundaries.
- Browser-test `/hitoDS#workout-library-playground`.
- Click through representative and edge identities.
- Verify all identities are present.
- Verify provider/result controls.
- Verify mobile no-overflow.
- Verify existing `/hitoDS#calendar-workout-playground` was not regressed.

Required validation:

- targeted ESLint for changed `/hitoDS` and DS playground files
- `git diff --check`
- `npm run build`
- browser proof with built-in Codex browser first
- screenshot or DOM/JSON fallback artifacts if PNG capture times out

### Post-QA Frontend Fix

QA found two acceptance failures after the initial static playground implementation:

- direct-loading `/hitoDS#workout-library-playground` could hydrate with a server/client active-nav
  mismatch
- switching to `Mobile` view and selecting `Provider compare future` could create desktop
  page-level horizontal overflow from the provider control layout

Frontend fixed both without changing specimen data, product calendar behavior, provider semantics,
or the static/specimen-only boundary. The next owner remains QA for focused re-validation of the
deep-link hydration path and the provider-control overflow scenario.

## What Remains Forbidden

- Do not implement manual workout creation, editing, copy, paste, recurrence, or templates.
- Do not implement provider sync or Strava ingestion.
- Do not upload, parse, or compare real provider activity data.
- Do not mutate Supabase.
- Do not create or persist plans, workouts, logs, comparisons, or AI insights.
- Do not import product `Calendar.tsx` into `/hitoDS`.
- Do not import the real `WorkoutPage` route into `/hitoDS`.
- Do not make frontend own backend plan-generation truth.
- Do not use this playground as a replacement for backend validation harnesses.
- Do not add a new visual system outside Hito DS.
- Do not change the completed calendar/workout state playground except for shared imports if needed.

## Validation For This Architect Plan

- `git diff --check -- docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md`
- If untracked, also run:
  `git diff --check --no-index /dev/null docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md`
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run validate-admin-capture-backlog`

## Next Decision

Send to QA for focused browser/source validation.

Reason:

The Running Coach specimen matrix now exists and Frontend implemented the static
`/hitoDS#workout-library-playground` from that matrix. QA should verify identity coverage, provider
and result controls, static-only boundaries, existing calendar playground non-regression, and
375px no-overflow behavior before this plan moves toward closeout.

# Manual Workout Creation, Editing, Copy, Templates, And Recurrence

## Status

in_progress

## Type

change_request

## Priority

high

## Next Recommended Role

BACKEND

## Task

Define the product, coaching, backend, and design-system architecture for user-built plans and manual
workout authoring.

## Stage

ARCHITECT plan / manual workout authoring backend handoff ready.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement Backend Slice 1 for manual workout authoring: non-mutating draft/review contract and
backend-owned template registry.

Stage:
BACKEND implementation / manual workout authoring draft contract.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md

Running Coach source of truth:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md

Backlog source:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md

Context:
Hito needs a backend-owned manual workout authoring path for runners who choose `Build my plan
myself` instead of generated/preset/custom plan creation. The first backend slice is review-only:
no DB writes, no schema changes, no frontend route, no active empty plan persistence, no copy/paste
persistence, no recurrence, no OpenAI.

Implement a focused backend module for typed constructor input, template registry, block/repeat
validation, metric-truth validation, canonical draft normalization, protected-date/conflict result
shape, frontend-ready review output, and token/checksum exactness data for a later confirm slice.

Do not persist, mutate Supabase, add schema, edit frontend, add recurrence, implement copy/paste
persistence, edit generated/preset plan content, or call OpenAI.

Report using the standard Implementation Report format from AGENTS.md.
```

## Active Plan

[Manual Workout Authoring And User-Built Plans](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)

## Accepted Running Coach Source

[Manual Workout Constructor Taxonomy And Template Library](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md>)

## Historical Running Coach Handoff Prompt

```text
ROLE: RUNNING COACH

Task:
Create the coaching source-of-truth taxonomy for manual workout construction and template-based
user-built plans.

Stage:
RUNNING COACH source-of-truth / manual workout block taxonomy and template library.

Source backlog item:
docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md

Context:
The user wants a separate path for runners who do not want Hito to generate a full plan. In the
no-plan flow, the runner should be able to choose something like "I want to build my plan myself."
Hito then opens an empty calendar. The runner can click `Add` on a date and choose from a menu:
create a new workout, choose from a template, copy/paste a workout, or later create a repeating
pattern. Selecting a template or creating from scratch opens a workout constructor.

This is not a frontend-only card gallery. Hito needs a canonical coaching/workout-block source of
truth that the backend can later validate and the frontend can render through Hito DS.

Required source context:
1. docs/context.md
2. docs/glossary.md
3. docs/current-product.md
4. docs/current-system.md
5. docs/current-state.md
6. docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md
7. docs/tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md
8. docs/tasks/running-coach/2026-06-09-running-plan-engine-advanced-workout-reference-matrix.csv
9. docs/tasks/running-coach/2026-06-09-hito-ds-workout-library-specimen-matrix.md

Your job:
Create a backend/frontend-ready markdown or CSV source-of-truth artifact under
`docs/tasks/running-coach/` that defines:

1. Workout constructor block taxonomy:
   - warm-up
   - cooldown
   - easy run
   - steady run
   - progression block
   - tempo block
   - threshold block
   - interval work block
   - interval recovery block
   - hill work block
   - downhill/control block where safe
   - rest/walk/jog recovery block
   - long-run body block
   - long-run finish block
   - strides
   - drills/mobility note if product-supported
   - freeform coach cue / note block, as secondary only

2. Loop/repeat model:
   - repeat group anatomy
   - repeat count
   - work unit
   - recovery unit
   - nested repeat rules, if allowed or forbidden
   - examples such as `5 x 1500m / 500m jog`, hill repeats, tempo repeats, run/walk repeats

3. Template library:
   - all currently safe Hito workout template families
   - beginner-safe templates
   - recreational/sometimes-runs templates
   - runs-a-lot templates
   - professional/competitive templates
   - templates that are future-only or advanced-only
   - which values the user may edit: duration, distance, repeats, recovery, pace-like labels,
     default HR-zone labels, cues, intensity, and notes

4. Safety and eligibility:
   - which templates are not safe for beginner_new_runner
   - which templates need recovery protection
   - which templates should be blocked or warned if the runner stacks hard sessions
   - which templates are allowed when Hito only has default HR zones
   - no fake precise pace
   - no fake personal HR
   - watch/app execution is assumed

5. Constructor semantics:
   - what blocks can be reordered
   - what blocks are required for each template
   - which workouts must include warm-up/cooldown
   - which long runs must not be a single anonymous block
   - when cues are allowed to be secondary support but not executable target truth

6. Template examples:
   - create clear examples for easy, recovery, steady, long, progression, tempo, threshold,
     intervals, hills, run/walk, strides, rest, and advanced workouts
   - include editable fields and fixed fields
   - include display labels suitable for a template picker

What not to do:
- Do not design the UI layout in detail.
- Do not implement code.
- Do not define DB schema.
- Do not create frontend-only template truth.
- Do not make every concept a card. Cards are allowed only when they help selection; the constructor
  should be compact, structured, and Hito DS-native.
- Do not weaken metric-truth rules.
- Do not claim manual workout CRUD is implemented.

Output:
1. Task
2. Stage
3. Current training/workout quality
4. Workout block taxonomy
5. Loop/repeat model
6. Template library matrix
7. Editable values and fixed values
8. Safety concerns
9. Product rules to encode
10. What not to change
11. Next recommended role
12. Blockers
```

## Severity

high

## Owner

RUNNING COACH / ARCHITECT / BACKEND / FRONTEND / DESIGN SYSTEM / QA

## Reported

2026-06-04

## Last Updated

2026-06-09

## User Report

The user wants runners to be able to manually create and customize workouts:

- if a day already has a workout, open it and edit it
- if a day is empty, create a new workout
- copy old workouts and paste them into new days
- create repeated/recurring workouts
- start from Hito workout templates and then edit the values
- build a plan manually when they do not want a Hito-generated plan

Clarification on 2026-06-09:

If the runner does not want to use Hito's generated plans, Hito should offer an explicit
user-built-plan path. The runner chooses something like `I want to build my plan myself`, gets an
empty calendar, clicks `Add` on any allowed date, and chooses from an Add menu:

- create new workout
- choose from template
- paste copied workout
- create or apply repeat/recurrence later

Choosing a template or creating from scratch opens a workout constructor. The constructor should use
structured columns/sections for workout entities such as warm-up, intervals, hill work, recovery,
rest, cooldown, and repeat/loop groups. Hito must avoid turning the constructor into a pile of
cards. Cards are acceptable only where they are justified for selection; the rest should be compact,
structured, and built from Hito DS components.

## Evidence

Architecture status:

- Running Coach source-of-truth taxonomy is accepted as the coaching input for Backend.
- Architecture moved into active plan:
  [Manual Workout Authoring And User-Built Plans](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md>)
- Next implementation gate is Backend Slice 1:
  non-mutating manual workout draft/review contract and backend-owned template registry.

Current source orientation:

- `src/lib/active-plan-persistence.ts` owns plan creation/replacement and planned workout insertion
  from canonical plan seeds.
- `src/lib/workout-log-actions.ts` owns logging existing planned workouts, not editing planned
  workout content.
- `src/lib/active-plan-schedule-edit-preview.ts` owns date/schedule reflow, not workout content
  authoring.
- `src/routes/workout.$date.tsx` renders workout detail/logging for an existing date.
- `src/components/Calendar.tsx` renders calendar cells, mobile day rows, pre-start states, result
  states, and feedback/evidence markers.
- `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md` tracks
  visual/specimen coverage for calendar/workout day states and keeps manual CRUD visual-only.
- `docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md`
  links this future manual authoring track to preset-generated workout customization.
- `docs/tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md`
  already contains watch-executable workout doctrine that should seed the manual template library.
- `docs/tasks/running-coach/2026-06-09-running-plan-engine-advanced-workout-reference-matrix.csv`
  captures future richer workout identities that should inform advanced templates later, but should
  not be exposed to unsafe runner levels by default.

No implementation proof was run for this backlog update.

## Observed Behavior

Hito currently has safe canonical paths for:

- generated first-plan creation
- Plan Preset / selected-plan preview work
- JSON import/apply
- active-plan refresh proposal/apply
- active-plan schedule reflow
- workout result logging

There is no canonical product path for:

- creating a blank user-built active plan from an empty calendar
- creating planned workouts manually
- editing planned workout content
- copying/pasting workouts
- selecting workout templates
- constructing workouts from editable blocks/segments
- creating recurrence/repeat patterns for planned workouts

## Expected Behavior

Future Hito should support a backend-owned user-built-plan and manual workout authoring flow where a
runner can:

- choose a no-plan path such as `Build my plan myself`
- open an empty calendar that is ready for planned workout authoring
- click `Add` on an allowed date
- choose `Create new workout`, `Choose from template`, `Paste copied workout`, or later
  `Create repeating workout`
- use a template library containing Hito's safe workout families and future advanced templates where
  eligible
- open a workout constructor that edits canonical blocks/segments rather than freeform text
- edit values such as duration, distance, repeat count, recovery, cues, intensity, pace-like labels,
  speed, and HR-zone/default-HR labels only where product rules allow
- preserve or intentionally adjust workout identity, segment anatomy, metric mode, source metadata,
  and notes
- avoid silent conflicts with logs, Garmin evidence, fixed rest days, active-plan refresh, import,
  export, and plan history

## Manual Plan Builder Flow Contract

The future product flow should be:

1. Runner has no active plan or explicitly chooses an approved user-built-plan entry point.
2. Hito offers `Build my plan myself` separately from generated/preset/custom plan creation.
3. Hito creates or opens a non-persisted empty calendar draft first.
4. Runner clicks `Add` on an allowed day.
5. Add menu offers:
   - `Create new workout`
   - `Choose from template`
   - `Paste copied workout` when a copy buffer exists
   - `Repeat workout` or `Create recurring pattern` only after recurrence architecture is approved
6. Template selection opens the same constructor as create-new, prefilled with editable canonical
   blocks.
7. Saving a workout must call a backend-owned mutation/review seam; frontend must not directly
   write schedule truth.
8. The user-built calendar becomes an active plan only through an explicit review/confirm boundary
   if the backend determines that plan-level persistence is risky.

Open architecture decision:

- Whether Hito should create an active empty plan immediately, or keep a draft calendar until the
  runner confirms at least one workout or a reviewed weekly structure. The default bias is draft
  first, explicit confirm before active-plan persistence.

## Workout Constructor Requirements

The constructor should support:

- block/segment rows, not freeform-only text
- warm-up, main work, recovery, cooldown, and note/cue sections
- repeat/loop groups with repeat count and work/recovery children
- editable values for time, distance, repeats, recovery, cues, intensity labels, and allowed metric
  targets
- template-specific required blocks
- validation warnings when a required warm-up/cooldown/recovery block is removed
- compact Hito DS layout with structured controls
- cards only where they help selection or summarizing a template, not as the default editor grammar

Example constructor shapes:

- Easy run:
  warm-up / easy body / optional strides / cooldown or easy finish
- Intervals:
  warm-up / repeat loop / recovery rules / cooldown
- Hills:
  warm-up / hill repeat loop / jog-down or easy recovery / cooldown
- Long run:
  opening / body / optional steady/progression finish / cooldown or finish notes
- Run/walk:
  warm-up / repeat run-walk loop / easy finish

## Template Library Requirements

The template picker should eventually include all Hito-safe workout families, with eligibility and
editable fields defined by backend/coaching truth:

- rest / fixed rest
- recovery jog
- easy aerobic run
- easy run with strides
- steady aerobic run
- progression run
- long aerobic run
- long run with steady finish
- cutback long run
- taper long run
- controlled tempo
- threshold durability
- intervals
- 10K rhythm intervals
- 5K sharpening repeats if product-supported
- hill repeats
- rolling hills
- trail / technical easy
- hike-run endurance
- advanced distance-repeat workouts from the advanced workout reference matrix, future/eligible only

Templates must define:

- display name
- workout identity/family
- short purpose
- required blocks
- optional blocks
- default editable values
- blocked values
- allowed runner levels
- safety warnings
- metric policy
- whether it can be copied/repeated
- whether it is allowed on fixed rest days

## Running Coach Source-Of-Truth Needed

Before Backend or Frontend implementation, Running Coach should create a source-of-truth artifact
for manual constructor blocks and templates under `docs/tasks/running-coach/`.

That artifact should answer:

- what workout block types exist
- which blocks are executable
- which blocks are cues/notes only
- which blocks can be inside repeat loops
- which loops are allowed or forbidden
- which templates exist in v1
- which templates are future-only
- which templates are safe for each runner level
- which editable values are allowed
- which templates should warn or block when stacked too close to other hard sessions

## Source Investigation

Likely implementation owners:

- Backend architecture and mutation safety:
  - `src/lib/active-plan-persistence.ts`
  - `src/lib/active-plan-schedule-edit-preview.ts`
  - `src/lib/active-plan-refresh-actions.ts`
  - `src/lib/imported-plan.ts`
  - `src/lib/plan-export.ts`
  - `src/lib/training.ts`
  - `src/lib/workout-log-actions.ts`
- Frontend surfaces:
  - `src/components/Calendar.tsx`
  - `src/routes/workout.$date.tsx`
  - `src/components/PlanManagementDialog.tsx`
  - `src/components/ui/hito-calendar-day.tsx`
- DS reference:
  - `src/routes/hitoDS.tsx`
  - `src/components/hito-ds/calendar-workout-playground.tsx`
  - `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`
- Coaching source:
  - `docs/tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md`
  - `docs/tasks/running-coach/2026-06-09-running-plan-engine-advanced-workout-reference-matrix.csv`
  - `docs/tasks/running-coach/2026-06-09-hito-ds-workout-library-specimen-matrix.md`

## Likely Root Cause

Manual workout authoring is a new mutation class. It cannot be safely added as a calendar-only UI
button because it touches canonical active-plan truth, history protection, copy/paste semantics,
recurrence expansion, export/import compatibility, future plan-refresh behavior, workout-log
evidence, and provider feedback.

It also should not become the source of preset truth. Preset recipes and running-plan builders
remain backend-owned plan-generation truth. Manual authoring edits already-created canonical
workouts or constructs user-authored workouts through the same canonical block/segment model.

## Recommended Fix Direction

Recommended sequence:

1. RUNNING COACH defines the workout block taxonomy, loop model, and template library matrix.
2. ARCHITECT uses that source of truth to define the mutation model:
   - empty calendar draft vs immediately active empty plan
   - planned workout create/edit semantics
   - copy/paste semantics
   - recurrence expansion semantics
   - conflict and history protection
   - source metadata
   - review/confirm boundary
3. BACKEND implements a canonical manual workout draft/validation/mutation seam.
4. FRONTEND implements the calendar Add menu and workout constructor using Hito DS primitives.
5. QA validates calendar flow, constructor behavior, conflict cases, export/import/readback, mobile,
   and no frontend-owned truth.

Recommended architecture bias:

- backend owns planned-workout mutation, conflict detection, validation, persistence, and lifecycle
- frontend owns add/edit/copy/paste interaction and renders backend-shaped draft/review states
- Running Coach owns safe workout block/template taxonomy
- Hito DS owns visual primitives and constructor controls
- recurrence should likely expand through a reviewed batch operation before persistence, unless a
  later architecture pass proves recurrence-rule storage is necessary
- manual editing should reuse the same canonical workout identity, segment, executable-target, and
  metric-truth model used by presets, imports, refreshes, and generated plans

## DS And Visual Constraints

The future UI must:

- use Hito DS components and primitives only
- reuse `HitoCalendarDayCell` / `HitoWorkoutDayRow` for calendar/day anatomy where safe
- reuse existing dialog/sheet/select/button/toggle/status primitives
- avoid a page full of cards
- use cards only for template selection or compact summaries where they are clearly useful
- keep the constructor structured, compact, and scannable
- keep mobile behavior first-class
- avoid a second route-local visual system

## Related High-Priority Tracks

- `docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md`
- `docs/tasks/backlog/2026-06-09-advanced-workout-identity-library-enrichment.md`
- `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`
- `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

Sequencing decision:

- Plan Presets shipped first and manual workout authoring no longer needs to wait on preset
  creation.
- Manual workout authoring should start with Running Coach taxonomy now, then Architect mutation
  planning.
- Advanced workout identities should inform future templates, but should not be exposed to unsafe
  runners by default.

## What Not To Touch

- Do not implement manual workout CRUD from this backlog item.
- Do not change DB schema yet.
- Do not mutate active-plan truth from route-local UI.
- Do not silently overwrite logged or Garmin-backed workouts.
- Do not weaken existing import, refresh, export, first-plan, Plan Preset, or schedule-edit safety.
- Do not turn `/hitoDS` into product behavior.
- Do not create frontend-only workout templates.
- Do not make every constructor part a card.
- Do not create a new UI kit outside Hito DS.
- Do not expose advanced workouts to beginner or low-support runners without coaching/backend
  eligibility.

## Validation Expectations

Future implementation should validate:

- user-built-plan entry point from no-active-plan state
- empty calendar draft or reviewed empty-plan creation boundary
- add workout on empty allowed date
- create workout from blank constructor
- create workout from template
- edit future unlogged workout
- copy/paste workout to a different date
- repeat workout across multiple allowed dates
- loop/repeat constructor behavior
- template eligibility by runner level
- conflict handling for rest days, fixed rest days, existing workouts, logged workouts, and
  evidence-backed workouts
- export/import compatibility for manual workouts
- active-plan refresh behavior after manual edits
- no mutation before explicit confirm where needed
- calendar/workout detail rendering after manual mutation
- Hito DS reuse proof
- no route-local template truth
- desktop and 375px mobile no-overflow behavior

## Blockers

- Backend Slice 1 must implement the non-mutating review contract before frontend implementation.
- Persistence/confirm remains blocked until the review contract is implemented and accepted.
- Recurrence remains blocked until a separate batch-review architecture decision.

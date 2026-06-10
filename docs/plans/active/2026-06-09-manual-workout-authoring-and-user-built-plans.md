# Manual Workout Authoring And User-Built Plans

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

BACKEND

## Task

Implement Backend Slice 1 for manual workout authoring: non-mutating draft/review contract and
backend-owned template registry.

## Stage

BACKEND implementation / manual workout authoring draft contract.

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

Implement:
- typed manual workout constructor input/schema
- backend-owned template registry derived from Running Coach source truth
- block/repeat validation
- metric-truth validation
- canonical draft normalization
- protected-date/conflict result shape
- review result shape suitable for frontend rendering
- token/checksum or equivalent exactness data for a later confirm slice
- harness fixtures for accepted/rejected rest, easy, long, interval, hill, run-walk, nested repeat,
  missing recovery, fake pace, and fake personal HR cases

What not to do:
- Do not write to Supabase.
- Do not add DB schema.
- Do not persist an empty active plan.
- Do not edit frontend.
- Do not add recurrence.
- Do not implement copy/paste persistence.
- Do not edit generated/preset plan content.
- Do not call OpenAI.

Report using the standard Implementation Report format from AGENTS.md.
```

## Owner

ARCHITECT / BACKEND / FRONTEND / RUNNING COACH / QA

## Last Updated

2026-06-09

## Source Links

- Backlog source: [Manual Workout Creation, Editing, Copy, Templates, And Recurrence](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md>)
- Running Coach source of truth: [Manual Workout Constructor Taxonomy And Template Library](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md>)
- Current product: [current-product.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md>)
- Current system: [current-system.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md>)
- Current state: [current-state.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-state.md>)

## Product Intent

Some runners do not want Hito to generate a plan for them. They should be able to choose a separate
path such as `Build my plan myself`, see an empty calendar-like planning surface, click `Add` on an
allowed date, and create a workout from scratch, from a Hito template, or by pasting a copied
workout.

This is not a frontend-only calendar button. Manual authoring touches canonical active-plan truth,
planned workout identity, workout history protection, provider evidence, export/import, future
refresh behavior, copy/paste semantics, and recurrence. Backend must own validation, normalization,
conflict detection, lifecycle rules, source metadata, and persistence.

## Current Architecture Gap

Implemented Hito has canonical paths for generated plans, Plan Presets, import/apply, active-plan
refresh, schedule reflow, and workout result logging. It does not yet have a canonical path for:

- user-built plan creation from a no-active-plan state
- adding a planned workout on an empty day
- editing planned workout content
- creating a workout from a template
- copying/pasting a workout to another date
- validating user-edited workout blocks/repeat groups
- recurrence or repeat-pattern expansion

Existing schedule-edit logic can move future workouts, but it does not author workout content.
Existing workout-log logic can save result truth, but it does not mutate planned workout truth.

## Architecture Decision

Use one backend-owned manual authoring pipeline:

`frontend input -> backend draft validation -> canonical workout draft -> explicit review/confirm when risky -> canonical planned_workouts mutation`

The first product path is a no-active-plan `Build my plan myself` flow. The UI may show an empty
calendar immediately, but that calendar is a non-persisted draft surface until the runner confirms
at least one valid manual workout or an explicit user-built plan start boundary.

Do not create a silently active empty plan by default in v1. Persisting an empty `plan_cycle` would
make saved mode look active without training truth and would block generated/preset creation. If
Backend later proves an active empty plan is necessary, it must be explicitly reviewed, sourced, and
reversible.

Use source kind:

- `manual_user_built_plan_v1` for the user-built active plan cycle
- `manual_workout_authoring_v1` for individual authored workout source metadata where useful

No new DB schema is required for Backend Slice 1 unless source audit proves existing
`plan_cycles.goal_metadata`, `plan_cycles.plan_preferences`, `planned_workouts.goal_context`,
`planned_workouts.metric_mode`, `planned_workouts.steps`, and rich workout columns cannot carry the
reviewed canonical truth safely.

## Canonical Manual Authoring Pipeline

1. Runner enters a no-active-plan state.
2. Frontend offers `Build my plan myself` separately from generated, preset, import, and advanced
   custom paths.
3. Frontend opens a draft calendar surface with fake/draft empty-day affordances only.
4. Runner clicks `Add` on an allowed date.
5. Add menu offers:
   - `Create new workout`
   - `Choose from template`
   - `Paste copied workout` when a copy buffer exists
   - recurrence only as disabled/future copy until recurrence architecture is implemented
6. Frontend sends a backend-shaped draft request. It never sends trusted rows for persistence.
7. Backend validates:
   - date and lifecycle
   - no-active-plan or approved user-built-plan context
   - template eligibility
   - block grammar
   - repeat/loop grammar
   - metric truth
   - fixed-rest and hard-session warnings where available
   - history/evidence protection for edit/paste operations
8. Backend returns a canonical manual workout draft with normalized steps, identity, family, icon,
   metric mode, warnings, review copy, and mutation readiness.
9. Frontend renders review and constructor state from backend-shaped truth.
10. Confirm persists through one canonical active-plan/planned-workout mutation seam.
11. The persisted workout is readable by the existing calendar, workout detail, export, import,
    logging, evidence, and feedback surfaces.

## Reused Existing Seams

- [active-plan-persistence.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-persistence.ts>)
  for active-plan lifecycle, no-active-plan guard, transaction/rollback patterns, plan insertion,
  and active-plan conflict behavior.
- [persisted-plan-replacement.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/persisted-plan-replacement.ts>)
  for mapping canonical workout truth into `planned_workouts` rows and preserving exact row/step
  semantics where applicable.
- [imported-plan.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/imported-plan.ts>)
  for canonical `training-plan-v2` workout shape, executable step normalization, and segment
  validation vocabulary.
- [training.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training.ts>)
  for route-readable workout/step shape and existing helper behavior.
- [active-plan-schedule-edit-preview.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts>)
  for protected-workout, logged-workout, evidence-backed, and reflow conflict concepts.
- [workout-log-actions.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/workout-log-actions.ts>)
  as the boundary that owns workout result logging and must not be bypassed by planned-workout edits.
- [Calendar.tsx](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx>)
  and [hito-calendar-day.tsx](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx>)
  for eventual day-cell anatomy, without moving product truth into the frontend.

## New Seams Proposed

Backend should introduce a focused manual authoring module instead of expanding route-local UI or
overloading the existing generated-plan builders.

Proposed module boundary:

- `src/lib/manual-workout-authoring/schema.ts`
  owns typed draft inputs, block keys, repeat group payloads, template ids, and review result types.
- `src/lib/manual-workout-authoring/templates.ts`
  owns backend template registry translated from the Running Coach source-of-truth artifact.
- `src/lib/manual-workout-authoring/validator.ts`
  owns block/repeat/metric/safety validation and canonical draft normalization.
- `src/lib/manual-workout-authoring/actions.ts`
  owns server-side review/confirm orchestration for manual workout drafts.

Public server-action names should stay narrow:

- `reviewManualWorkoutDraft(...)`
- `confirmManualWorkoutDraft(...)`
- later `copyManualWorkoutDraft(...)` or `reviewManualWorkoutPaste(...)`
- later `reviewManualWorkoutRecurrence(...)`

If `training-api.ts` needs compatibility exports, keep them as wrappers only. Do not make
`training-api.ts` the implementation owner.

## Mutation And Review Boundary

### Non-Mutating Review Required

Review is required before persistence for:

- first manual workout in a no-active-plan user-built draft
- creating the user-built active plan cycle
- replacing an existing planned workout
- converting rest to workout or workout to rest
- paste operations that regenerate date-specific metadata
- editing today
- any fixed-rest conflict
- any hard-session stacking warning
- any future recurrence or batch expansion

### Direct Confirm May Be Allowed After Review

Confirm may persist only when Backend proves:

- authenticated user owns the target context
- no active plan exists for initial user-built plan creation, or the active plan is explicitly in
  an allowed user-built/manual-edit state
- target date is allowed
- target workout is not protected by logs, Garmin/FIT evidence, actual metrics, comparison, or AI
  insight
- canonical draft token/checksum still matches server-rebuilt draft
- no client-sent rows are trusted

### Hard Blocks

Manual content mutation must be blocked for:

- past protected workouts
- logged workouts unless a separate history-detach flow is approved
- evidence-backed workouts
- workouts with actual metrics, comparisons, or AI insights
- active-plan replacement or refresh behavior
- generated/preset plan bulk rewrites
- recurrence persistence before recurrence architecture is approved

## Template Ownership Decision

Running Coach owns the source-of-truth taxonomy and safety matrix in:

[Manual Workout Constructor Taxonomy And Template Library](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md>)

Backend owns the executable registry derived from that artifact. Frontend must not define route-local
templates, eligibility, metric policy, required blocks, repeat caps, or safety warnings.

V1 template registry should include safe families already defined by Running Coach:

- rest
- recovery jog
- easy aerobic run
- steady aerobic run
- easy run with strides
- progression run
- controlled tempo
- time intervals
- distance intervals where eligible
- long aerobic run
- long run with steady finish
- cutback long run
- taper long run
- uphill repeats
- rolling hills
- run-walk adaptation
- technical trail easy where eligible

Advanced templates such as `long_intervals_5x1500m_500m_jog`,
`cruise_intervals_4x2k_2min_jog`, and `threshold_3x3k_1k_float` should remain source-tracked but
future/advanced-only until Backend adds explicit eligibility and QA fixtures.

## Copy/Paste Lifecycle Decision

Copy/paste should be implemented as draft reconstruction, not raw row duplication.

Copy captures a canonical workout draft:

- title and notes
- workout family, identity, icon, and source metadata
- metric mode
- planned RPE, estimated fatigue, recovery priority when present
- normalized steps and segment anatomy
- goal context
- editable template fields where recoverable

Paste regenerates:

- workout date
- weekday
- week number or draft display grouping
- display order
- date-specific source metadata
- conflict warnings

Paste must not reuse the original `planned_workouts.id` or pretend the copied workout is the same
historical event. If useful, store `copied_from_planned_workout_id` in bounded metadata, not as the
primary workout identity.

Frontend may keep a transient copy buffer for interaction, but Backend must revalidate the copied
payload before any paste review or confirm.

## Recurrence Lifecycle Decision

Recurrence is future-only in v1. Do not create recurrence-rule storage yet.

The safest future direction is:

1. User chooses a recurrence pattern.
2. Backend expands it into a reviewed batch of concrete workout drafts.
3. Frontend renders the affected dates, conflicts, skipped dates, and protected dates.
4. Confirm persists concrete `planned_workouts` rows only.

Only add persistent recurrence rules later if Product proves runners need ongoing editable patterns
instead of one-time batch expansion.

## User-Built Plan Lifecycle Rules

- `Build my plan myself` is available only when no active plan exists in v1.
- It must not silently replace an existing generated, preset, imported, or refreshed active plan.
- Existing active-plan replacement/refresh remains separate.
- Manual editing of generated or preset plans is future work unless Backend explicitly scopes a
  smaller future unprotected-workout edit gate.
- User-built plans should become active only after explicit confirmation of the first valid manual
  workout or an approved plan-start boundary.
- Deleting or clearing a user-built plan should reuse existing active-plan lifecycle actions unless
  Backend finds a source-kind-specific reason not to.

## Backend Slice 1 Scope

Implement the non-mutating manual workout draft contract.

Backend Slice 1 includes:

- typed manual workout constructor input schema
- template registry skeleton from Running Coach source truth
- block/repeat validation for a bounded v1 template set
- draft review for `Create new workout` and `Choose from template`
- canonical normalized steps and metadata output
- metric-truth enforcement:
  - watch/app assumed
  - no fake precise pace
  - no fake personal HR
  - default HR guidance clearly marked as editable default only
- no-active-plan draft context support
- protected-date/conflict result shape, without persistence
- token/checksum or equivalent exactness mechanism for future confirm
- harness fixtures for easy, long, interval, hill, run-walk, rest, and invalid repeat cases

Backend Slice 1 excludes:

- DB writes
- DB schema changes
- frontend route changes
- empty active plan persistence
- copy/paste persistence
- recurrence
- generated/preset plan editing
- provider sync
- OpenAI
- manual workout CRUD UI

## Backend Slice 1 Implementation Notes

Status: implemented for non-mutating review contract; awaiting Architect checkpoint before any
confirm/persist slice.

Implemented module boundary:

- `src/lib/manual-workout-authoring/schema.ts`
  owns manual draft input, constructor entry/block/repeat types, bounded review result types,
  source metadata, protected conflict shape, and target-truth enums.
- `src/lib/manual-workout-authoring/templates.ts`
  owns the backend template registry derived from the Running Coach artifact and maps each supported
  template to existing canonical workout identities/families/icons.
- `src/lib/manual-workout-authoring/validator.ts`
  owns pure block/repeat/metric validation and rejects unsafe constructor shapes before canonical
  draft assembly.
- `src/lib/manual-workout-authoring/normalize.ts`
  owns normalization into existing `Step[]`, canonical workout identity, and canonical metric-mode
  JSON after validation has passed.
- `src/lib/manual-workout-authoring/actions.ts`
  owns non-mutating `reviewManualWorkoutDraft(...)`, bounded rejection shapes, protected context
  conflicts, and stable review token/checksum exactness payloads.
- `scripts/validate-manual-workout-authoring.ts`
  owns the deterministic Slice 1 fixtures.

Behavior implemented:

- Accepted fixtures:
  rest day, easy aerobic run, long-run multi-block anatomy, time intervals with recovery, uphill
  repeats with recovery, and run-walk repeat anatomy.
- Rejected fixtures:
  nested repeats, repeated intensity without recovery, fake precise pace, fake personal HR, unknown
  manual-only template identity, and protected logged workout context.
- Non-rest drafts normalize to existing watch-executable numeric `Step[]` structure.
- Review output is non-mutating with `persisted: false`, `sourceKind:
manual_workout_authoring_v1`, `source_kind: manual_workout_authoring_v1`, stable
  `reviewToken`, and stable `reviewChecksum`.
- Stable exactness payload changes when confirm-relevant content such as workout date changes.

Mapping gaps recorded:

- `run_walk_adaptation` exists in the Running Coach taxonomy but not as a dedicated canonical
  runtime workout identity. Backend Slice 1 maps it to existing `recovery_jog` identity with
  explicit run/walk repeat anatomy and reports the mapping gap instead of creating a duplicate
  manual-only identity.
- `technical_trail_easy` has an existing canonical workout identity, but no dedicated executable
  trail-body block exists in the current `Step[]` vocabulary. The registry uses existing
  `easy_run_block` structure with technical trail identity metadata and reports the mapping gap.

Validation evidence:

- `npm exec eslint -- src/lib/manual-workout-authoring/*.ts scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`

## Later Slice Order

1. BACKEND Slice 1:
   manual workout non-mutating draft/review contract and template registry.
2. ARCHITECT checkpoint:
   accept/reject Backend Slice 1 and decide persistence exactness.
3. BACKEND Slice 2:
   confirm/persist first manual workout and create `manual_user_built_plan_v1` active plan through
   canonical plan/workout persistence.
4. FRONTEND Slice 1:
   no-active-plan `Build my plan myself`, draft calendar, Add menu, template picker, constructor
   scaffold, and review display using backend-shaped truth.
5. QA:
   browser, source, and harness validation for initial user-built plan creation.
6. BACKEND/FRONTEND later:
   edit future unprotected workouts, copy/paste, and recurrence review batch expansion.

## Frontend Boundaries For Later

Frontend must:

- reuse Hito DS primitives, dialogs/sheets, selects, buttons, toggles, status markers, and calendar
  day anatomy
- avoid a page full of cards
- use cards only for template selection or compact summaries when justified
- render backend-shaped template fields and warnings
- collect follow-up answers and request backend recomputation/review
- never compute template eligibility, schedule truth, metric truth, recurrence expansion, protected
  history, or persistence locally

## Exit Criteria

This plan can close when:

- Backend has a canonical manual authoring review/confirm/persist seam.
- No-active-plan user-built plan creation is implemented and QA-passed.
- Frontend can create at least one valid manual workout from scratch and one from template.
- Manual workouts render correctly in calendar and workout detail.
- Protected logged/evidence-backed workouts cannot be silently overwritten.
- Copy/paste and recurrence are either implemented and QA-passed or preserved as separate backlog
  follow-ups.
- Current docs and changelog are updated only for shipped behavior.

## Backend Slice 1 Full Handoff Detail

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

Required preflight:
1. Read AGENTS.md.
2. Read agents/backend.agent.md.
3. Load matching project skills, especially hito-backend-supabase-contract.
4. Read the plan and Running Coach source artifact above.
5. Inspect existing seams before adding new code:
   - src/lib/active-plan-persistence.ts
   - src/lib/persisted-plan-replacement.ts
   - src/lib/imported-plan.ts
   - src/lib/training.ts
   - src/lib/active-plan-schedule-edit-preview.ts
   - src/lib/workout-log-actions.ts
   - src/lib/training-api.ts

Implement:
1. A focused `src/lib/manual-workout-authoring/` backend module with:
   - typed draft input/schema
   - backend-owned template registry derived from Running Coach source truth
   - block/repeat validation
   - metric-truth validation
   - canonical draft normalization
   - protected-date/conflict result shape
   - review result shape suitable for frontend rendering
   - token/checksum or equivalent exactness data for a later confirm slice
2. A non-mutating review function such as `reviewManualWorkoutDraft(...)`.
3. Harness fixtures proving accepted and rejected drafts for:
   - rest
   - easy aerobic
   - long run with multi-block anatomy
   - interval repeat group
   - hill repeat group
   - run-walk repeat group
   - invalid nested repeat
   - missing recovery for repeated intensity
   - fake precise pace attempt
   - fake personal HR attempt
4. Public compatibility wrapper only if needed. Do not make `training-api.ts` the implementation owner.

Required contract:
- watch/app execution is assumed
- every non-rest workout must have numeric watch-executable structure
- cues are secondary only
- no fake precise pace
- no fake personal HR
- Hito default HR labels may be editable defaults only, not personal HR truth
- long runs over 60 minutes must not normalize into one anonymous block
- quality sessions must preserve warmup, work/recovery where relevant, and cooldown
- frontend must not own templates or eligibility

What not to do:
- Do not write to Supabase.
- Do not add DB schema.
- Do not persist an empty active plan.
- Do not edit frontend.
- Do not add recurrence.
- Do not implement copy/paste persistence.
- Do not edit generated/preset plan content.
- Do not call OpenAI.
- Do not weaken existing plan creation, Plan Preset, import, refresh, export, logging, or schedule-edit safety.

Validation:
- Run targeted TypeScript/ESLint for changed backend/script files.
- Run the new manual workout authoring harness.
- Run `git diff --check -- <changed files>`.
- Run build only if the project policy or changed imports make it necessary.

Report using the standard Implementation Report format from AGENTS.md.
```

## Blockers

- Backend Slice 1 must run before frontend implementation.
- Persistence/confirm remains intentionally undefined until the review contract is implemented and
  accepted.
- Recurrence remains blocked until a separate batch-review architecture decision.

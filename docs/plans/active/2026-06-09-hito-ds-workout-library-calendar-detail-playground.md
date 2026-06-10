# Hito DS Day-State Specimen And Test Calendar Sandbox

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Re-scope the workout-library playground into two separate surfaces: a Hito DS day-state specimen and
a product-like `/test-calendar` sandbox.

## Stage

FRONTEND implementation / Hito DS specimen cleanup plus fake product calendar sandbox.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Implement the re-scoped calendar/workout design sandbox as two separate surfaces: keep Hito DS as a
quiet day-state specimen and create a product-like `/test-calendar` fake calendar sandbox.

Stage:
FRONTEND implementation / Hito DS specimen cleanup and `/test-calendar` product-design sandbox.

Context:
The previous `/hitoDS#workout-library-playground` direction is superseded. The full fake workout
calendar must not live as a Hito DS workout-library playground. Hito DS should keep only reusable
day-cell/workout-row state specimens. The product-like fake calendar belongs on `/test-calendar`.

Active plan:
docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md

Root cause and architecture fit:
- The current direction mixes two different jobs:
  1. Hito DS component/state proof.
  2. Product-flow design review for a fake calendar and workout detail.
- Fix the ownership boundary rather than polishing the wrong `/hitoDS` destination.
- Reuse existing Hito DS primitives, product calendar visual language, workout-detail anatomy, modal/sheet/dialog primitives, feedback/evidence markers, and static fixture data.
- Do not create a new UI kit, frontend-owned product truth, server action path, provider seam, or persistence model.

Required reading:
1. AGENTS.md
2. agents/frontend.agent.md
3. skills/hito-frontend-design-system/SKILL.md
4. docs/context.md
5. docs/glossary.md
6. docs/current-product.md
7. docs/current-system.md
8. docs/current-state.md
9. docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md
10. docs/tasks/running-coach/2026-06-09-hito-ds-workout-library-specimen-matrix.md

Inspect and reuse:
- src/routes/hitoDS.tsx
- src/components/hito-ds/calendar-workout-playground.tsx
- src/components/hito-ds/calendar-workout-playground-data.ts
- src/components/hito-ds/workout-library-playground.tsx
- src/components/hito-ds/workout-library-playground-data.ts
- src/components/ui/hito-calendar-day.tsx
- src/components/Calendar.tsx
- src/routes/workout.$date.tsx
- src/components/CompletionPanel.tsx
- src/components/IntervalsViz.tsx
- src/components/ui/dialog.tsx
- src/components/ui/sheet.tsx
- src/components/ui/select.tsx
- src/components/ui/icon.tsx
- src/styles.css

Scope:
1. `/hitoDS`:
   - Preserve `/hitoDS#calendar-workout-playground` as the canonical day-state/component specimen.
   - Remove/demote the full `/hitoDS#workout-library-playground` fake calendar as the accepted
     product sandbox.
   - If a workout-library import/sidebar item exists in `/hitoDS`, remove it or convert it into a
     non-primary note/link that points to `/test-calendar`; do not keep it as a full DS section.
   - Make the day-state specimen feel like one quiet black specimen block, not a page full of cards.
   - Keep useful mobile/desktop preview controls.
   - Preserve `HitoCalendarDayCell` / `HitoWorkoutDayRow` as shared presentational primitives.

2. `/test-calendar`:
   - Add a product-design sandbox route at `/test-calendar`.
   - It should feel like the real Hito calendar page, using fake data only.
   - Every calendar day is either a fake workout or rest.
   - Clicking a fake day opens a fake workout-day detail modal/sheet.
   - The detail modal/sheet shows workout structure/segments, feedback, evidence, provider state,
     and recommendation copy.
   - Add a floating top-right settings button.
   - Settings must toggle fake states:
     - completed / not completed / partial / skipped
     - feedback exists / no feedback
     - FIT file uploaded / not uploaded
     - Garmin attached / not attached
     - Strava attached as future/specimen-only
     - future provider comparison / recommendation state

Fixture rules:
- Use static/fake fixtures only.
- The existing Running Coach specimen matrix can be reused as fixture source, but its old
  `/hitoDS#workout-library-playground` target language is superseded by this plan.
- Keep fixture data focused; do not introduce user ids, plan ids, persisted workout ids, raw provider
  payloads, server actions, active-plan lifecycle, provider upload, OpenAI, or generated plan recipe
  logic.

What not to do:
- Do not mutate Supabase.
- Do not create plans.
- Do not log workouts.
- Do not upload, parse, compare, or sync real provider files.
- Do not call OpenAI.
- Do not generate real recommendations.
- Do not import real product route loaders into `/test-calendar`.
- Do not make `/test-calendar` a replacement source of truth for product calendar behavior.
- Do not add manual workout CRUD, copy/paste, recurrence, active-plan replacement, or provider sync.
- Do not create another design system outside Hito DS.

Validation:
- `npm exec eslint -- src/routes/hitoDS.tsx src/components/hito-ds/*.tsx src/components/hito-ds/*.ts src/routes/test-calendar.tsx`
  Adjust the route path in the command if TanStack filename differs.
- `git diff --check -- src/routes src/components src/styles.css docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md`
- `npm run build`
- Built-in Codex browser proof first:
  - `/hitoDS` loads.
  - `/hitoDS#calendar-workout-playground` remains useful.
  - `/hitoDS` no longer presents the full workout-library fake calendar as the accepted product sandbox.
  - `/test-calendar` loads directly.
  - `/test-calendar` uses fake data only.
  - clicking fake days opens fake workout detail.
  - settings toggles result/evidence/provider/recommendation states.
  - desktop and 375px mobile have no horizontal overflow.

Report format:
1. Task
2. Stage
3. Root cause
4. Files inspected
5. Files changed
6. What changed
7. Reused Hito DS/product primitives
8. Static-only boundary proof
9. Validation results
10. Blockers
```

## Owner

ARCHITECT / FRONTEND / QA

## Last Updated

2026-06-09

## Root Cause

The previous plan mixed two different surfaces:

- `/hitoDS` as a design-system component/state reference.
- a product-like fake calendar and workout-detail flow for product/design review.

That made the implementation drift toward a full fake workout calendar inside `/hitoDS`, which is
not the accepted product direction. `/hitoDS` should not become a product-flow sandbox. It should
prove reusable day-cell and workout-row states only.

## Architecture Decision

Keep one plan, but split the target into two surfaces:

| Surface | Owner | Purpose | Acceptance target |
|---|---|---|---|
| `/hitoDS#calendar-workout-playground` | Hito DS | reusable day-cell/workout-row state specimen | quiet component specimen only |
| `/test-calendar` | Product-design sandbox | fake product calendar and fake workout detail review | full fake calendar/detail flow |
| real `/` calendar and `/workout/$date` | Product runtime | persisted saved-mode behavior | unchanged |

The old `/hitoDS#workout-library-playground` direction is superseded. It must not be the acceptance
target for this plan.

## Hito DS Day-State Specimen Contract

`/hitoDS#calendar-workout-playground` remains the accepted DS specimen for reusable calendar/workout
day anatomy.

It should cover:

- desktop month-cell anatomy
- mobile workout-row anatomy
- planned workout
- rest day
- empty/no-plan date
- outside-month
- outside-plan/pre-start where useful
- today
- selected/focused overlays
- completed/partial/skipped result states
- feedback/evidence marker
- provider marker language where it is a small reusable visual state
- easy/recovery/steady/long/tempo/intervals/hills/trail/quality/rest identities
- title overflow/wrapping
- dense month-grid stress
- visual-only future affordances if they remain clearly specimen-only

Design direction:

- one quiet black specimen block
- no full product-like calendar
- no page full of nested cards
- keep useful desktop/mobile preview controls
- preserve `HitoCalendarDayCell` and `HitoWorkoutDayRow` as presentational shared primitives

## `/test-calendar` Product-Design Sandbox Contract

`/test-calendar` is the accepted target for the fake full calendar.

It should:

- feel like the real Hito calendar page
- use fake static data only
- render every day as either fake workout or rest
- use real product calendar visual rhythm where safe
- let Product/Design click a fake day
- open fake workout detail in a modal/sheet
- show workout structure/segments
- show result state
- show feedback/evidence/provider states
- show recommendation copy as static fake copy
- include a floating top-right settings button
- let settings toggle fake visual states without mutation

Settings must include:

- completion state: not completed / completed / partial / skipped
- feedback: exists / none
- FIT file: uploaded / not uploaded
- Garmin: attached / not attached
- Strava: attached as future/specimen-only
- future provider comparison state
- future recommendation state

The route exists for design clarification only.

## Source And Primitive Reuse

Frontend should reuse existing product/DS seams before adding anything new:

- real calendar visual language from `src/components/Calendar.tsx`
- shared `HitoCalendarDayCell` / `HitoWorkoutDayRow` from
  `src/components/ui/hito-calendar-day.tsx` where safe
- workout-detail route anatomy from `src/routes/workout.$date.tsx` as visual reference
- presentational pieces from `CompletionPanel` and feedback readback where safe
- `IntervalsViz` or segment-list anatomy where safe
- Hito DS dialog/sheet primitives
- Hito DS buttons/selects/toggles/status pills/markers
- existing feedback/evidence/result marker language
- existing workout glyph/icon primitives
- static fixture data from `docs/tasks/running-coach/2026-06-09-hito-ds-workout-library-specimen-matrix.md`
  as a source reference, while treating its old `/hitoDS#workout-library-playground` target wording
  as superseded

## Old `/hitoDS` Behavior To Remove Or Demote

If present in implementation, Frontend must remove or demote:

- `WorkoutLibraryPlayground` as a full `/hitoDS` section
- `workout-library-playground` sidebar item as a primary DS acceptance target
- full fake workout calendar grid inside `/hitoDS`
- fake product drilldown detail inside `/hitoDS`
- provider/result settings intended for product-flow review inside `/hitoDS`
- any `/hitoDS` copy that says the workout-library fake calendar is the accepted product sandbox

Frontend may reuse useful static fixture data and presentational subpieces after moving ownership to
`/test-calendar`, but the full product-like surface should not stay under `/hitoDS`.

## Product Boundary

Hito DS owns:

- primitive/state proof
- shared visual component anatomy
- reusable markers, controls, state badges, and layout primitives
- static specimen explanation

`/test-calendar` owns:

- fake product-flow design review
- fake calendar page composition
- fake workout detail modal/sheet
- fake provider/result/recommendation toggles
- static fixture state only

Real product routes own:

- persisted `TrainingSnapshot` and `Workout` truth
- route loaders
- real `/workout/$date` navigation
- real workout log mutation
- real Garmin upload/remove
- real deterministic comparison
- real AI insight readback
- active-plan lifecycle
- provider sync
- manual workout creation/edit/copy/paste/recurrence when later implemented

## What Remains Forbidden

- no Supabase mutation
- no real plan creation
- no real workout log mutation
- no real provider upload/parse/sync
- no OpenAI call
- no real AI recommendation generation
- no frontend-owned schedule/product truth
- no real route loader import into the fake sandbox
- no provider credentials or user/account data
- no manual workout CRUD/copy/paste/recurrence
- no new UI kit outside Hito DS
- no QA closeout against the old `/hitoDS#workout-library-playground` target

## Implementation Slices

### Slice 1: Re-scope Existing Hito DS Work

Owner:

FRONTEND

Scope:

- keep `/hitoDS#calendar-workout-playground`
- make it a quiet single-specimen day-state block
- preserve useful mobile/desktop controls
- remove/demote full workout-library product-flow UI from `/hitoDS`
- preserve existing `/hitoDS` anchors and navigation

### Slice 2: Add `/test-calendar`

Owner:

FRONTEND

Scope:

- add a product-like fake calendar route at `/test-calendar`
- use fake static fixtures
- reuse product calendar visual language
- every fake day is workout or rest
- click opens fake workout detail modal/sheet
- add floating settings
- wire static toggles for result/evidence/provider/recommendation states
- keep fake/future/specimen labels visible for Strava/provider comparison/recommendations

### Slice 3: QA Acceptance

Owner:

QA

Scope:

- source boundary proof
- built-in browser proof first
- `/hitoDS` day-state specimen proof
- `/test-calendar` direct-load proof
- fake day click/detail proof
- settings toggle proof
- static-only/no mutation proof
- desktop and 375px no-overflow proof

## Validation For This Architect Plan

- `git diff --check -- docs/plans/active/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md`
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run validate-admin-capture-backlog`

No build or browser QA is required for this Architect replan because product source was not changed.

## Next Decision

Send to FRONTEND.

Reason:

The source-of-truth boundary is now clear enough for implementation. The next slice is not design
exploration and not QA. It is a bounded frontend re-scope: remove/demote the wrong `/hitoDS` full
calendar direction and create `/test-calendar` as a static product-design sandbox.

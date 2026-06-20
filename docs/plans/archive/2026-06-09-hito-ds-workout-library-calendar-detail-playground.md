# Hito DS Day-State Specimen And Test Calendar Sandbox

## Status

archived — `/test-calendar` TC1 and TC2 are QA-passed, shared calendar-day presentation parity is
accepted, and no TC3 implementation slice is selected. This plan is now historical sandbox evidence.
The active DS/specimen/Figma bridge owner remains the canonical
[Hito DS Information Architecture And Specimen Contract](../active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md).

## Type

plan

## Priority

high

## Next Recommended Role

product

## Task

Use this archived `/test-calendar` sandbox plan as historical evidence only; reopen sandbox work only
from a concrete Product/Design question.

## Stage

ARCHITECT archive / paused `/test-calendar` sandbox history.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Use this archived `/test-calendar` sandbox plan as historical evidence only; reopen sandbox work only
from a concrete Product/Design question.

Stage:
ARCHITECT archive / paused `/test-calendar` sandbox history.

Context:
This archived plan preserves the accepted `/test-calendar` fake product-calendar sandbox history.
The current `/hitoDS` IA and component-specimen grammar are owned by:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md

The `/hitoDS` IA Slice 1, Slice 2, Slice 3, Slice 4, Slice 5, and Slice 6 rollouts are accepted. `/test-calendar` is QA-passed through TC2:

- direct `/test-calendar` route
- static fake fixtures only
- desktop and mobile calendar rendering
- selected fake-day review surface
- fake settings dropdown
- fake workout-detail dialog
- coherent scenario presets
- shared calendar-day presentation parity with the real product calendar
- no backend/runtime/persistence mutation path
- no overflow at desktop or `375px`

Architecture decision:
- TC1 and TC2 are accepted.
- The original reactivation blocker, scenario-coherence gap, and shared-presentation drift are closed.
- `/test-calendar` should pause as sufficient for now.
- No TC3 implementation slice is selected.

Canonical boundary:
- `/test-calendar` owns fake product-flow design review.
- `/hitoDS` owns DS/specimen/Figma bridge truth.
- Real product routes own persisted behavior and backend-shaped product truth.

Root cause and architecture fit:
Visible symptom: future sandbox work could restart by inertia after TC2.

Underlying cause: the major technical and presentation risks are closed, so additional work needs a concrete Product/Design question before implementation resumes.

Canonical owner: Product triage for future design questions, with Architecture required before any new implementation gate.

Required reading:
1. AGENTS.md
2. agents/product.agent.md
3. skills/hito-architecture-audit/SKILL.md
4. skills/hito-plan-writing-and-closeout/SKILL.md
5. skills/hito-prompt-handoff/SKILL.md
6. docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md
7. docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md
8. docs/tasks/frontend-specs/2026-06-13-dropdown-family-and-calendar-ds-normalization-spec.md
9. docs/current-product.md
10. docs/current-system.md
11. src/routes/test-calendar.tsx
12. src/components/test-calendar/test-calendar-sandbox.tsx
13. src/routes/hitoDS.tsx
14. src/components/hito-ds/playground.tsx
15. src/components/hito-ds/specimen-previews.tsx

Scope:
1. Do not route another `/test-calendar` implementation slice by default.
2. Keep `/test-calendar` available as a static fake-only review surface.
3. Reopen only if Product/Design names a concrete missing design question that TC1/TC2 cannot answer.
4. If reopened, route through one new Architecture checkpoint before implementation.
5. Keep `/hitoDS` stable as DS/specimen/Figma bridge owner and keep real product routes as owners of persisted behavior.

What must not be touched:
- Do not reopen accepted `/hitoDS` IA Slice 1-6 without a concrete regression.
- Do not reopen accepted `/test-calendar` TC1/TC2 without a concrete regression or a new Product/Design question.
- Do not redesign product runtime calendar/workout behavior.
- Do not add Supabase, provider sync, OpenAI, auth, persistence, or real mutation paths into the sandbox.
- Do not move sandbox ownership back into `/hitoDS`.
- Do not broaden into QR/share/import, recurrence, edit workout, Restore UI, generated-plan mutation, or active-plan replacement unless Product first opens a concrete brief and Architecture selects one bounded slice.

Validation:
- No implementation or browser QA is required while paused.
- If this plan is updated, run `git diff --check -- docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`.
```

## Owner

ARCHITECT / DESIGNER / FRONTEND / QA

## Last Updated

2026-06-16

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

Current sequencing note:

The `/hitoDS` IA Slice 1-6 rollout is accepted. The slices below are now the active execution path
for the separate `/test-calendar` product-design sandbox, starting with Slice 2 as the first
implementation slice. Slice 1 is already covered by the accepted canonical `/hitoDS` IA rollout and
the day-state specimen boundary.

### Slice 1: Re-scope Existing Hito DS Work

Owner:

FRONTEND

Status:

Superseded as an immediate execution slice by the accepted canonical `/hitoDS` IA pilot.

Scope:

- keep `/hitoDS#calendar-workout-playground`
- make it a quiet single-specimen day-state block
- preserve useful mobile/desktop controls
- remove/demote full workout-library product-flow UI from `/hitoDS`
- preserve existing `/hitoDS` anchors and navigation

### Slice 2: Add `/test-calendar`

Owner:

FRONTEND

Status:

Implemented and QA-passed as TC1.

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

Status:

Passed.

Scope:

- source boundary proof
- built-in browser proof first
- `/hitoDS` day-state specimen proof
- `/test-calendar` direct-load proof
- fake day click/detail proof
- settings toggle proof
- static-only/no mutation proof
- desktop and 375px no-overflow proof

## Post-TC1 Architecture Decision - 2026-06-16

TC1 is accepted. The old blocker for reactivating `/test-calendar` is closed, and the route now
exists as a static fake-only product-design sandbox.

Decision:

- Continue `/test-calendar` through `DESIGNER Slice TC2: product-design review and next-slice
  specification`.
- Do not route immediately to Frontend for more sandbox implementation.
- Do not pause the sandbox indefinitely after TC1; instead, require Product/Design to decide whether
  TC1 is enough or what exactly TC2 must add.
- Keep `/hitoDS` stable as the DS/specimen/Figma bridge owner.

Why this is the safest next gate:

- TC1 proved the static sandbox boundary, so the next risk is not implementation correctness.
- The unresolved question is product-design usefulness: whether fake state presets, richer detail
  anatomy, review copy, or comparison states are needed before designers can use the sandbox well.
- `src/components/test-calendar/test-calendar-sandbox.tsx` is already near the 700-line hotspot
  threshold, so additional frontend work should not be assigned until a spec names the exact value
  and requires decomposition before substantial growth.
- This keeps `/test-calendar` from drifting into a product runtime route and keeps `/hitoDS` from
  becoming a fake product calendar.

Selected next gate:

`DESIGNER Slice TC2: /test-calendar product-design review and next-slice specification`.

## Post-TC2 Architecture Decision - 2026-06-16

TC2 is accepted. The active risk is no longer sandbox existence, scenario coherence, static-only
boundary proof, or shared calendar-day presentation drift.

Decision:

- Pause `/test-calendar` as sufficient for now.
- Do not select a TC3 implementation slice.
- Keep `/test-calendar` as a static fake product-design review sandbox.
- Keep `/hitoDS` as the DS/specimen/Figma bridge owner.
- Keep real product calendar/workout routes as the owners of persisted behavior.

Why this is the safest next decision:

- TC1 proved the sandbox could exist without backend, auth, provider, OpenAI, persistence, or
  product-runtime mutation paths.
- TC2 proved coherent scenario presets and shared calendar-day presentation parity with the real
  product calendar.
- Additional sandbox work now needs a concrete Product/Design question; otherwise it risks expanding
  a fake route by inertia and growing `test-calendar-sandbox.tsx` without a product reason.

Future reopen rule:

- Reopen only if Product/Design identifies a concrete review gap that TC1/TC2 cannot answer.
- Any future reopen must preserve static/fake-only fixtures and must pass through one bounded
  Architecture checkpoint before Frontend implementation.

## Validation For This Architect Plan

- `git diff --check -- docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`

No build or browser QA is required for this Architect checkpoint because product source was not
changed.

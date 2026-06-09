# Running Plan Creation Engine Rebuild

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

QA

## Task

Validate backend R6B Half Marathon and Marathon Base deterministic preview expansion.

## Stage

QA Slice R6C / backend Half Marathon and Marathon Base acceptance.

## Exact Handoff Prompt

```text
ROLE: QA

Task:
Validate backend R6B Half Marathon and Marathon Base deterministic preview expansion.

Stage:
QA Slice R6C / backend Half Marathon and Marathon Base acceptance.

PLAN:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md

Context:
- The previous Plan Preset builder and product flow are product-failed / not accepted.
- The rebuilt 10K selected-plan vertical is accepted.
- Running Coach R6A created the canonical doctrine for `Half Marathon` and `Marathon Base`:
  `docs/tasks/running-coach/2026-06-09-running-plan-engine-r6-half-marathon-marathon-base-doctrine.md`.
- Backend R6B implemented family-specific deterministic preview builders:
  - `buildHalfMarathonPlanPreviewDraft(...)`
  - `buildMarathonBasePlanPreviewDraft(...)`
- R6B output is preview-only:
  - `persisted: false`
  - `mutates: false`
  - `callsOpenAi: false`
  - `confirmPathImplemented: false`
- Half Marathon backend proof:
  - source kind: `running_plan_engine_half_marathon_builder_v1`
  - `14` weeks / `98` calendar rows / `70` non-rest rows for the 5-days/week fixture
  - final non-rest row: `final_selected_distance_day`
  - endpoint/main segment: exact `21100m`
  - `beginner_new_runner` is blocked
  - `sometimes_runs` has no `threshold`
  - higher-support standard-load runners include `threshold`
- Marathon Base backend proof:
  - source kind: `running_plan_engine_marathon_base_builder_v1`
  - `16` weeks / `112` calendar rows / `80` non-rest rows for the 5-days/week fixture
  - final non-rest row: `marathon_base_endpoint`
  - no selected-distance `42195m` endpoint
  - no `intervals`
  - no full marathon race-readiness claim
  - `beginner_new_runner` is blocked
- Existing 10K harness still passes.
- `npm run build` passes.

Your job:
1. Run backend/source validation for R6B.
2. Prove Half Marathon exact endpoint behavior and runner-level gates.
3. Prove Marathon Base honest base endpoint behavior and no full-marathon overclaim.
4. Prove existing 10K behavior is preserved.
5. Prove no fake pace, no fake personal HR, no 5K benchmark dependency, and no watch/no-watch gate.
6. Preserve no Supabase mutation unless a separate disposable validation fixture is explicitly
   scoped.

Constraints:
- Do not implement product fixes.
- Do not mutate DB/Supabase.
- Do not add persistence, confirm/create, or active-plan creation.
- Do not call OpenAI.
- Do not add shipped 5K.
- Do not add target-time support.
- Do not require or consume 5K benchmark.
- Do not reintroduce no-watch/no-app as a normal input.
- Do not invent precise pace targets.
- Do not invent personal HR targets.
- Do not weaken any existing R2/R3/R4C/R6B invariant or accepted Running Coach doctrine.
- Do not approve frontend/browser selected-plan behavior for Half/Marathon Base unless a separate
  frontend slice wires those families into the UI.

Validation:
- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- `npm run build`

Report:
1. Task
2. Stage
3. Files inspected
4. Validation commands
5. Half Marathon endpoint and eligibility proof
6. Marathon Base endpoint and overclaim proof
7. Existing 10K preservation proof
8. Metric-truth proof
9. Mutation-safety proof
10. Blockers
```

## Owner

ARCHITECT / RUNNING COACH / BACKEND / FRONTEND / QA

## Last Updated

2026-06-09

## R5B Frontend Visual Cleanup Note

- QA R5 accepted the rebuilt 10K selected-plan vertical for functional, source, browser, and mobile
  behavior.
- Product requested a focused R5B frontend cleanup before R6 expansion:
  - selected-plan preview uses normal DS labels for ordinary content labels
  - `hito-micro-label` remains only for true shell/chrome metadata
  - compact calendar preview keeps backend rows while showing workout-type colors and an orange
    final 10K trophy state
- Next recommended role after R5B implementation remains QA for focused visual re-validation.

## Reference Links

- [Project operating rules](../../../AGENTS.md)
- [Project context](../../context.md)
- [Glossary](../../glossary.md)
- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Hito Stack Simplification Strike](2026-06-07-hito-stack-simplification-strike.md)
- [Archived Plan Preset plan](../archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [Plan Presets library](../../../src/lib/plan-presets/)
- [Active plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Training API facade](../../../src/lib/training-api.ts)
- [Running Plan Engine Coach Doctrine](../../tasks/running-coach/2026-06-08-running-plan-engine-coach-doctrine.md)
- [Running Plan Engine Scenario Matrix](../../tasks/running-coach/2026-06-08-running-plan-engine-scenario-matrix.md)
- [Running Plan Engine Watch-Executable Workout Library](../../tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md)

## Context

The previous Plan Preset vertical slice passed several technical gates, but it failed real product
acceptance.

We are stopping the patch cycle:

- do not keep patching individual symptom rows
- do not continue service-size cleanup now
- do not start Backend implementation before coaching/source-of-truth reset
- do not treat the current algorithmic builder as an accepted product foundation

This plan replaces Plan Preset rebuild ownership inside the Hito Stack Simplification Strike. The
simplification strike remains available only for future cleanup after this rebuild passes product
acceptance.

## Failure Evidence

Evidence files:

- `/Users/ivan/Downloads/10k-foundation-plan-preset-2026-06-08.json`
- `/Users/ivan/Downloads/half-marathon-balanced-plan-preset-2026-06-08.json`
- `/Users/ivan/Downloads/half-marathon-balanced-plan-preset-2026-06-11.json`

Observed failures:

- `10K Foundation Plan Preset` exported `70` rows / `10` weeks, but the final row was
  `long_aerobic_run`, summarized as `8 km long aerobic run`; it did not clearly culminate in a 10K
  endpoint.
- `Half Marathon Balanced Plan Preset` exported `119` rows / `17` weeks and ended with
  `half_readiness_marker`, summarized as `68 min half readiness marker`, without explicit `21.1K`
  endpoint behavior.
- A later Half Marathon export also had `119` rows / `17` weeks but the final row was
  `rest_and_recovery`, which is unacceptable as selected-distance endpoint behavior.
- Workout/readback language can foreground effort labels such as `Effort: threshold steady` and
  `Mode: Executable structure`, which is not acceptable as the primary watch-facing execution model.
- The selected-plan flow did not ask rest days or preferred long-run day in the right modal/screen.
- Important review content was hidden below cards instead of living inside a clear selected-plan
  flow.

## Reset Decision

The current Plan Preset builder is product-failed / not accepted.

Technical slices passed, but product acceptance failed. Passing harnesses around the wrong doctrine
does not make the plan creation engine correct.

The new running plan creation engine must be built from first principles:

`runner basics -> load/progression context -> selected distance goal -> days/week capacity -> coach-authored reference doctrine -> phase plan -> weekly calendar preview -> workout placement -> watch-executable segment construction -> review modal -> confirm/persist`

## Source-Of-Truth Correction

This plan is not a text-tuning task.

AI must not directly author the plan calendar, weekly structure, long runs, intervals, metric modes,
or progression. AI can help with:

- interpreting messy runner input into backend-owned parameters
- explaining the reviewed plan in human language
- handling explicit Advanced/custom edge cases after the deterministic contract exists

AI must not own:

- weekly schedule structure
- selected-distance endpoint behavior
- workout segment anatomy
- long-run structure
- pace/HR target policy
- recovery/cutback/taper rules
- review/confirm persistence truth

Normal plan creation is recipe-led and engine-owned:

`runner input -> backend normalization -> selected recipe -> deterministic expansion -> hard workout rules -> metric/default-zone resolver -> non-mutating review -> explicit confirm/persist`

The old loop of "generate, enrich, validate, QA finds weak workouts, then ask for richer wording" is
explicitly rejected.

## R1 Boundary Decision

Architect accepts the docs-owned Running Coach Slice R1 artifacts as the only canonical coaching
source of truth for Backend Slice R2:

- [Running Plan Engine Coach Doctrine](../../tasks/running-coach/2026-06-08-running-plan-engine-coach-doctrine.md)
- [Running Plan Engine Scenario Matrix](../../tasks/running-coach/2026-06-08-running-plan-engine-scenario-matrix.md)
- [Running Plan Engine Watch-Executable Workout Library](../../tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md)

Boundary decision:

- Backend must translate the docs-owned R1 artifacts into typed source; Backend must not treat any
  source-layer draft files as canonical unless they are created from those accepted docs.
- The untracked files under `src/lib/plan-creation-engine/` were inspected and deleted in this
  boundary pass because they contained stale/conflicting language around benchmark-backed pace
  truth, personal HR-zone truth, and old runner-level labels.
- Deleted stale draft files:
  - `src/lib/plan-creation-engine/watch-executable-workout-doctrine.md`
  - `src/lib/plan-creation-engine/watch-segment-prescription-model.csv`
  - `src/lib/plan-creation-engine/coach-workout-day-examples.csv`
- Those deleted files are not archived because archiving unaccepted source-layer drafts would create
  another source-of-truth candidate. Their useful ideas are already superseded by the accepted
  docs-owned Running Coach artifacts.

Canonical Backend source hierarchy for Slice R2:

1. This active rebuild plan.
2. Docs-owned Running Coach R1 artifacts under `docs/tasks/running-coach/`.
3. Existing canonical persistence/review seams only for boundary awareness; do not change
   persistence in Slice R2.
4. New typed backend source-of-truth files created from the accepted docs.

## Preserved Parts

Preserve where useful:

- visual direction of cards
- backend-owned truth principle
- non-mutating review before confirm
- review/confirm/persistence safety
- existing canonical persistence seam if still valid
- Hito DS primitives and card styling when they support the corrected interaction
- `plan_preset_v1` source-kind lineage if metadata clearly identifies the rebuilt engine/version

## Deleted / Demoted / Frozen Candidates

Do not blindly delete anything in this Architect pass.

Candidates for controlled deletion, demotion, or freeze:

- current algorithmic builder if it encodes failed doctrine
- current source-of-truth CSVs if they encode failed behavior
- quality gates that allowed readiness-only outcomes
- effort-primary segment model
- hidden below-card review flow
- stale Plan Preset code that exists only to support the failed builder
- old failed outputs, preserved only as negative/regression fixtures if useful

Deletion boundary:

- every deletion must name exact file/symbol/surface
- every deletion must prove replacement coverage
- every deletion must preserve review/confirm/persistence safety
- no broad `git reset`, mass revert, or unscoped source removal

## New Product Contract

### Runner Inputs

The runner enters:

- age
- height
- weight
- running level:
  - beginner/new runner
  - sometimes runs
  - runs a lot
  - professional/competitive
- days/week, with a safe backend-owned default if omitted

Age, height, and weight must materially influence safe load/progression through neutral context, not
body-shaming, medical claims, or injury inference.

The runner does not need to enter:

- watch/app ownership, because supported new-plan creation assumes watch/app execution
- 5K benchmark, because v1 normal plan creation must not depend on benchmark collection
- personal HR zones, because Hito uses conservative default HR-zone assumptions until the runner
  edits zones later
- target time/date, because those remain Advanced/custom inputs, not normal preset/recipe inputs

The level model replaces the old benchmark-first gate. Backend uses the selected level, age/load
context, body context, days/week, rest preferences, selected distance, and coach-owned recipe rules
to choose the safe plan shape.

### Distance Cards

The runner sees three shipped distance cards:

- `10K`
- `Half Marathon`
- `Marathon` or honestly renamed/repositioned `Marathon Base`

Cards show backend-owned expected outcome:

- selected-distance endpoint
- expected finish outcome band or completion category
- training duration/runway
- days/week

Cards must not ask for or require 5K benchmark truth.

Outcome copy should be level/recipe-based and honest:

- completion/checkpoint category
- broad readiness band where coach-approved
- no precise race-time promise
- no benchmark-derived pace dependency in the normal path

If the runner wants a faster outcome after selecting a plan, backend should adjust safely:

- more days/week
- longer runway
- appropriate quality work
- or route to Advanced/custom if unsupported

### Selected-Plan Interaction

- Primary card CTA is `Select Plan`.
- Remove separate `Learn more` as a competing CTA.
- `Select Plan` opens a modal or selected-plan screen.
- Important review must not be hidden below cards.
- Selected-plan modal/screen shows:
  - simple plan summary
  - mini calendar / microcalendar
  - colored workout types
  - expected finish/outcome
  - final selected-distance day
  - editable/confirmable days/week
  - rest-day selection
  - preferred long-run day
  - flexible/default option if runner does not choose
- If runner selects `5` running days/week, they can choose `2` rest days.
- Backend owns calendar and schedule logic.
- Frontend only renders backend-shaped state and collects preferences.

### Watch-Executable Contract

- Watch/app execution is assumed.
- No-watch / no-app is removed as a normal product option.
- Workouts must be watch-executable.
- Primary prescription must be structured sports parameters:
  - duration
  - distance
  - repeats
  - work block
  - recovery block
  - segment order
  - target mode
- Effort/coaching wording is secondary, not the primary target.
- Normal plan creation must not require a 5K benchmark to become executable.
- Pace must not be presented as precise performance truth unless a future explicit pace-truth source
  is approved; v1 can use coach-owned broad level/recipe cues only where they do not imply fake
  precision.
- HR uses conservative Hito default zones in v1, not personal HR truth.
- Hito default HR zones must be labeled/handled as editable defaults and must not be described as
  personalized zones.
- Target time alone does not unlock precise pace.
- No fake personal HR.
- No fake pace.
- If a workout cannot be expressed with watch-executable structure, it must fail quality gates or
  route to custom/review.

## Coaching Source-Of-Truth Requirements

Running Coach must create canonical examples before Backend implementation.

Required source-of-truth coverage:

- reference plans for 10K, Half Marathon, and Marathon/Base
- age/load contexts
- height/weight contexts
- running levels:
  beginner/new runner, sometimes runs, runs a lot, professional/competitive
- days/week options
- conservative default HR-zone assumptions and how they appear as editable defaults
- selected-distance final endpoint behavior
- canonical workout day examples:
  recovery, easy, long run, cutback, strides, tempo, threshold, intervals, hills if in scope, and
  final selected-distance day
- segment anatomy for each workout type:
  warmup, main work, repeats, recoveries, cooldown
- how segments should display in product UI
- safety cue copy as secondary language

Large matrices should become repo source artifacts, not chat walls.

## Slice Plan

### Slice R0: Architect Reset Map And Deletion Boundary

Owner:

ARCHITECT.

Status:

complete.

Scope:

- mark previous Plan Preset builder as product-failed
- stop simplification cleanup from owning plan-creation work
- define preserved seams
- define deletion/demotion/freeze candidates
- create this dedicated rebuild plan

### Slice R1: Running Coach Reference Doctrine And Workout Examples

Owner:

RUNNING COACH.

Status:

complete / Product-accepted / Architect-accepted.

Scope:

- create coach-authored benchmark plans before code
- treat "benchmark" here as coach-authored reference programs, not user-provided 5K benchmark input
- define selected-distance endpoint behavior
- define watch-executable workout day and segment examples
- define safe load/progression interpretation for age/height/weight/level/days/week
- define conservative default HR-zone usage without calling it personal HR truth
- define UI display/readback guidance for segments

Exit criteria:

- backend-ready markdown/CSV artifacts exist
- every shipped distance has endpoint doctrine
- every canonical workout type has segment anatomy examples
- effort/cue copy is explicitly secondary

### Slice R2: Backend Source-Of-Truth Model

Owner:

BACKEND.

Status:

complete / Backend-validated / Architect-accepted with pre-R3 cleanup note.

Scope:

- translate Running Coach artifacts into typed backend source-of-truth
- model load/progression/outcomes/segments
- define builder input/output contract
- define quality gates that reject failed old behaviors
- preserve no fake pace and no fake personal HR
- remove normal-path dependency on watch-choice, 5K benchmark, or personal HR-zone collection
- do not use deleted/stale `src/lib/plan-creation-engine/` draft files as canonical source
- no persistence semantic changes

Implementation notes:

- Added a new typed backend source owner under `src/lib/plan-creation-engine/`, created from the
  accepted R1 docs only.
- Added source contracts for supported families, runner levels, builder inputs, watch-executable
  segment templates, metric/default-HR policy, endpoint gates, scenario rules, and forbidden output
  gates.
- Added `scripts/validate-running-plan-engine-source.ts` as the bounded source invariant harness.
- The source model intentionally does not build multi-week calendars, open frontend seams, call
  OpenAI, mutate persistence, or reintroduce watch/no-watch, 5K benchmark, target-time, fake pace,
  or personal-HR normal-path dependencies.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- Invariant summary: `3` distance families, `4` runner levels, `11` workout templates, `12`
  scenario rules, `10` forbidden gates.

Next acceptance gate:

- Backend must complete Slice R2B before Slice R3 builds the first 10K deterministic expansion
  engine.

Architect acceptance notes:

- R2 correctly preserves the accepted product contract:
  - no normal-path 5K benchmark dependency
  - no watch/no-watch gate
  - accepted runner levels only
  - editable Hito default HR zones, not personal HR truth
  - no fake precise pace
  - no fake personal HR
  - 10K / Half / Marathon Base endpoint gates
- The invariant harness is strong enough for R2 because it validates input boundaries, metric/HR
  policy, endpoint gates, workout segment numeric structure, scenario coverage, stale file absence,
  and forbidden output gates.
- `src/lib/plan-creation-engine/source-model.ts` is acceptable as a data-heavy R2 landing file, but
  not acceptable as the file that receives the 10K builder or more source responsibilities.
- The shared `final_selected_distance_day` template is acceptable as an abstract R2 concept only.
  It must be resolved into family-specific endpoint exactness before the 10K builder can use it.

### Slice R2B: Source Model Decomposition And Endpoint Exactness

Owner:

BACKEND.

Status:

complete / Backend-validated / Architect-accepted / R3-ready.

Scope:

- no-behavior-change decomposition of `src/lib/plan-creation-engine/source-model.ts` by real
  ownership seams:
  - family contracts
  - builder input contract
  - metric/default-HR policy
  - workout-day templates
  - endpoint gates
  - scenario rules
  - forbidden output gates
- preserve the public `src/lib/plan-creation-engine/index.ts` facade
- keep accepted R2 model values stable unless endpoint exactness requires a targeted correction
- replace/refine the shared `final_selected_distance_day` template so 10K builder cannot consume a
  generic `10000-21100m` range
- require source validation to prove:
  - 10K endpoint resolves exactly `10000m`
  - Half endpoint resolves exactly `21100m`
  - Marathon Base remains a base endpoint, not selected-distance race readiness
- do not build the multi-week plan expansion engine in this slice

Exit criteria:

- source model is split by ownership, not arbitrary line count
- no source file receives broad unrelated responsibilities
- source invariant harness still passes and is strengthened for endpoint exactness
- ESLint and `git diff --check` pass

Implementation notes:

- Split the R2 source model by real ownership seams:
  - `family-contracts.ts`
  - `input-contract.ts`
  - `metric-policy.ts`
  - `workout-templates.ts`
  - `endpoint-contracts.ts`
  - `scenario-rules.ts`
  - `forbidden-output-gates.ts`
  - `source-shared.ts`
- Kept `source-model.ts` as the stable source-model aggregator/facade instead of a data-heavy
  landing file.
- Preserved the public `src/lib/plan-creation-engine/index.ts` facade and added the explicit
  `resolveRunningPlanEndpointTemplate(...)` export for future builders.
- Moved selected-distance endpoint anatomy out of generic workout templates into family-specific
  endpoint templates:
  - `10K` resolves to exactly `10000m`
  - `Half Marathon` resolves to exactly `21100m`
  - `Marathon Base` resolves to an honest base durability endpoint with no selected-distance race
    meters.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- Invariant summary: `3` distance families, `4` runner levels, `9` non-endpoint workout templates,
  `3` endpoint templates, `12` scenario rules, `10` forbidden gates.
- `git diff --check -- <changed files>`

Architect acceptance notes:

- R2B is accepted as the final source boundary before Slice R3.
- Decomposition is acceptable because `source-model.ts` is now a small source aggregator and the
  source ownership moved into focused files for family contracts, input contract, metric/default-HR
  policy, workout templates, endpoint contracts, scenario rules, forbidden output gates, shared
  helpers, and source types.
- Endpoint exactness is acceptable for the first builder because `final_selected_distance_day` and
  `marathon_base_endpoint` no longer live in generic workout templates, and builders must use
  `resolveRunningPlanEndpointTemplate(...)`.
- The invariant harness is strong enough for R3 entry because it proves:
  - `10K` endpoint template kind is `final_selected_distance_day`
  - `10K` endpoint distance and main segment are exactly `10000m`
  - `Half Marathon` endpoint distance and main segment are exactly `21100m`
  - `Marathon Base` endpoint is `marathon_base_endpoint`
  - Marathon Base has no selected-distance race main segment
  - stale unaccepted source-layer `.md` / `.csv` files remain absent
  - watch/no-watch, 5K benchmark, target-time, fake pace, and fake personal-HR dependencies remain
    forbidden in the normal path.
- Slice R3 may now start, but only for the smallest backend-owned 10K deterministic builder.

### Slice R3: Backend Minimal New Builder For One Distance

Owner:

BACKEND.

Status:

complete / Backend-validated / Architect-accepted / R4-ready.

Recommended first distance:

10K.

Scope:

- build the smallest new backend-owned selected-distance builder for 10K
- produce calendar preview rows before confirm
- produce watch-executable segments
- end with clear 10K behavior
- use review/confirm safety
- keep failed old outputs as negative fixtures where useful

Implementation notes:

- Added an isolated 10K deterministic preview builder in
  `src/lib/plan-creation-engine/ten-k-builder.ts`.
- Kept `source-model.ts` as source truth only; the builder consumes the accepted source model,
  generic workout-day templates, and `resolveRunningPlanEndpointTemplate("10K")`.
- The R3 builder returns a non-mutating preview/review draft contract with:
  - `sourceKind` / `source_kind`: `running_plan_engine_10k_builder_v1`
  - `sourceStatus` / `source_status`: `preview_ready` or `preview_unavailable`
  - `persisted: false`
  - `mutates: false`
  - `callsOpenAi: false`
- Added backend defaults for omitted `daysPerWeek`, `fixedRestDays`, and preferred long-run day.
- Added hard failure before review when the selected family is not `10K` or the runner-selected
  preferred long-run day conflicts with fixed rest days.
- Generated 10-week / 70-row calendar previews for the 10K slice, with every non-rest row using
  watch-executable numeric segment anatomy from the accepted source templates.
- Ensured the final non-rest row is the family-specific `final_selected_distance_day` endpoint,
  with the endpoint template and main segment both resolving to exactly `10000m`.
- Added `scripts/validate-running-plan-engine-10k-builder.ts` as the bounded R3 harness.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- 10K builder harness summary:
  - `sourceKind`: `running_plan_engine_10k_builder_v1`
  - weeks: `10`
  - calendar rows: `70`
  - non-rest rows: `50` for the 5-days/week fixed-rest fixture
  - endpoint meters: `10000`
  - final date: `2026-08-16`
  - validation: `ok`

Architect acceptance notes:

- R3 is accepted as a bounded backend preview contract for FRONTEND Slice R4.
- R3 deliberately implements only the 10K builder. Half Marathon and Marathon Base remain out of
  scope until the 10K vertical is accepted.
- R3 does not add frontend, persistence, confirm/create behavior, OpenAI calls, Supabase
  mutations, target-time support, 5K benchmark dependency, or watch/no-watch selection.
- `ten-k-builder.ts` is large at roughly `943` lines, but it is acceptable for R4 because it owns
  one bounded 10K preview path, exports a small public contract, and keeps normalization, schedule
  construction, endpoint proof, and validation private to that preview builder.
- No R3B decomposition is required before frontend starts. However, this file must not receive Half
  Marathon, Marathon Base, confirm/persistence, OpenAI, or frontend-facing schedule truth. Before
  adding another family or mutation path, BACKEND must extract focused seams for normalization,
  schedule selection, row construction, endpoint proof, and validation/test fixtures.
- R3 keeps the old failed behavior as negative harness checks:
  - no final generic long run
  - no final rest/recovery day
  - no metadata-only endpoint
  - no fake precise pace
  - no fake personal HR
  - no user-provided 5K benchmark dependency
  - no watch/no-watch gate

### Slice R4: Frontend Select Plan Modal And Calendar Preview

Owner:

FRONTEND.

Status:

ready for FRONTEND implementation.

Scope:

- preserve useful visual card direction
- primary CTA is `Select Plan`
- remove competing `Learn more`
- selected-plan modal/screen shows backend-shaped details, mini calendar, colored workout types,
  rest days, long-run day, days/week, endpoint, and runner-facing copy
- no frontend schedule logic
- no frontend-generated rows/workouts

### Slice R4C: Backend 10K Diversity Policy Before QA

Owner:

BACKEND.

Status:

behavior and build validated / ready for QA acceptance.

Scope:

- implement the accepted 10K diversity doctrine from
  `docs/tasks/running-coach/2026-06-09-running-plan-engine-10k-diversity-doctrine.md`
- keep the deterministic 10K builder backend-owned
- do not add frontend, persistence, OpenAI, Half Marathon, Marathon Base, target-time, 5K
  benchmark, or watch/no-watch behavior

Implementation notes:

- Added `src/lib/plan-creation-engine/ten-k-diversity-policy.ts` as the focused owner for the 10K
  development-touch matrix and validation gates.
- Replaced the previous week-number-only development selector with a deterministic policy keyed by
  `runnerLevel`, `loadContext`, and `weekNumber`.
- Preserved beginner safety:
  - `beginner_new_runner` receives `strides` as the only development touch
  - no beginner `tempo`, `intervals`, `hills`, or `threshold`
- Added supported standard-load diversity:
  - `sometimes_runs`: `strides`, `tempo`, `intervals`
  - `runs_a_lot`: `strides`, `tempo`, `intervals`, `hills`
  - `professional_competitive`: `strides`, `tempo`, `intervals`, `hills`
- Added conservative-load downgrade:
  - no forced `intervals`
  - no forced `hills`
  - `strides` remain present
  - `tempo` remains allowed for supported non-beginner profiles
- Preserved week shape:
  - weeks `4` and `8` remain `cutback_long_run` weeks
  - week `9` includes `strides` and excludes `tempo`, `intervals`, `hills`, and `threshold`
  - week `10` remains the exact `10000m` endpoint week
- Extended recovery validation after sharper work:
  - next actual running slot after `long_run`, `cutback_long_run`, `intervals`, or `hills` must be
    `recovery` or `easy`
  - no week may contain more than one development touch
- Fixed the local default-start endpoint placement bug where an omitted start date on Tuesday could
  leave an easy/recovery row after the endpoint and fail final endpoint proof.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `git diff --check -- src/lib/plan-creation-engine scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- Builder harness summary after R4C:
  - `sourceKind`: `running_plan_engine_10k_builder_v1`
  - weeks: `10`
  - calendar rows: `70`
  - non-rest rows: `50` for the 5-days/week fixed-rest fixture
  - endpoint meters: `10000`
  - final date: `2026-08-16`
  - validation: `ok`
- `npm run build` was attempted twice after the R4C changes and failed in Nitro SSR bundling with
  missing hashed chunk imports from `node_modules/.nitro/vite/services/ssr/assets/*`:
  - first failure: missing `./router-Cq4T7KLJ.js` from `admin.capture-MVpXAmvc.js`
  - second failure: missing `./local-auth-DQHdAfx4.js` from `plan-refresh-proposal-hubUz90U.js`
  - this appears to be the existing build-output lifecycle/Nitro chunk-resolution seam, not the 10K
    diversity policy, but it blocks release-style QA until fixed.
- Build blocker recheck:
  - `npm run build` passed from the normal prebuild cleanup path.
  - a second consecutive `npm run build` also passed.
  - no runtime/product files were changed for the build recheck.
  - diagnosis: the previous missing hashed chunk failures were stale/transient generated-output
    state, not an R4C import/export regression.

### Slice R5: QA Acceptance For 10K Vertical

Owner:

QA.

Scope:

- exported JSON proof
- browser flow proof
- workout detail/readback proof
- final selected-distance endpoint proof
- watch-executable segment structure proof
- no vague effort-primary targets
- mobile no-overflow
- no Supabase mutation unless explicitly scoped

### Slice R6: Expand To Half And Marathon/Base

Owner:

RUNNING COACH / BACKEND / FRONTEND / QA.

Scope:

- expand from accepted 10K vertical into Half Marathon
- decide Marathon vs Marathon Base honestly
- add selected-distance endpoint or base-only repositioning
- repeat export/browser/workout-detail acceptance

### Slice R6B: Backend Half Marathon And Marathon Base Preview Expansion

Owner:

BACKEND.

Status:

backend behavior and build validated / ready for QA source acceptance.

Scope:

- implement deterministic preview expansion for `Half Marathon`
- implement deterministic preview expansion for `Marathon Base`
- preserve accepted 10K behavior
- do not add frontend, persistence, confirm/create, OpenAI, shipped 5K, target-time, or DB behavior

Implementation notes:

- Added `src/lib/plan-creation-engine/preview-builder-shared.ts` as the focused owner for common
  preview calendar assembly, input normalization, endpoint/workout row shaping, recovery repair, and
  shared watch-executable/metric-truth checks used by the new R6 family builders.
- Added `src/lib/plan-creation-engine/half-marathon-diversity-policy.ts` as the Half Marathon
  family policy owner.
- Added `src/lib/plan-creation-engine/marathon-base-diversity-policy.ts` as the Marathon Base
  family policy owner.
- Added `src/lib/plan-creation-engine/half-marathon-builder.ts`.
- Added `src/lib/plan-creation-engine/marathon-base-builder.ts`.
- Exported the new builders through `src/lib/plan-creation-engine/index.ts` without changing
  `buildTenKPlanPreviewDraft(...)`.
- Added `scripts/validate-running-plan-engine-r6-builders.ts` for deterministic R6 backend proof.

Half Marathon proof:

- source kind: `running_plan_engine_half_marathon_builder_v1`
- horizon: `14` weeks
- rows for the 5-days/week fixed-rest fixture: `98` calendar rows / `70` non-rest rows
- final non-rest row: `final_selected_distance_day`
- endpoint/main segment: exact `21100m`
- `beginner_new_runner` is blocked before review
- `sometimes_runs` has no `threshold`
- `runs_a_lot` / `professional_competitive` standard-load previews include `threshold`

Marathon Base proof:

- source kind: `running_plan_engine_marathon_base_builder_v1`
- horizon: `16` weeks
- rows for the 5-days/week fixed-rest fixture: `112` calendar rows / `80` non-rest rows
- final non-rest row: `marathon_base_endpoint`
- no selected-distance `42195m` endpoint
- no `intervals`
- no full marathon readiness, race-peak, target-time, or race-pace overclaim
- `beginner_new_runner` is blocked before review

Shared proof:

- preview only: `persisted: false`, `mutates: false`, `callsOpenAi: false`,
  `confirmPathImplemented: false`
- fixed rest days are protected
- long-run day remains on the preferred long-run day where feasible
- next actual running slot after long runs, cutback long runs, and sharper work remains
  `recovery` or `easy`
- one development touch max per week
- no fake pace, no fake personal HR, no 5K benchmark dependency, and no watch/no-watch gate

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- `npm run build`

### Slice R6D: Frontend Selected-Plan Preview Wiring For Half Marathon And Marathon Base

Owner:

FRONTEND.

Status:

implemented / ready for QA validation.

Scope:

- wire accepted R6 backend preview builders into the preset-first selected-plan preview flow
- preserve the accepted 10K selected-plan preview path
- keep create/confirm/persistence unavailable in this preview-only slice
- keep frontend as a renderer of backend-shaped preview truth only

Implementation notes:

- Replaced the 10K-only selected-plan preview server action seam with a shared
  `previewRunningPlanDraft(...)` action that dispatches to the accepted 10K, Half Marathon, or
  Marathon Base backend preview builder by `distanceFamily`.
- Updated the preset onboarding panel so 10K, Half Marathon, and Marathon Base cards can open the
  same selected-plan preview dialog when backend card state marks them selectable.
- Updated the selected-plan preview dialog readback so Half Marathon shows exact `21100m` endpoint
  proof and Marathon Base shows `marathon_base_endpoint` / no selected-distance `42195m` /
  no full-marathon-readiness language.
- Preserved preview-only behavior: no rows/workouts are sent from the client, no persistence path is
  added, no OpenAI path is added, and create remains unavailable.

Validation evidence:

- `npm exec eslint -- src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx src/components/onboarding/PlanPresetPanel.tsx src/components/OnboardingGate.tsx src/lib/running-plan-engine-actions.ts src/lib/training-api.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- inline `node --import tsx` source proof for Half Marathon and Marathon Base builders:
  - Half Marathon: `98` rows, exact `21100m`, source kind
    `running_plan_engine_half_marathon_builder_v1`
  - Marathon Base: `112` rows, `endpointMainDistanceMeters: null`, final kind
    `marathon_base_endpoint`, source kind `running_plan_engine_marathon_base_builder_v1`
- `npm run build`

### Slice R7: Controlled Deletion Of Failed Builder Artifacts

Owner:

BACKEND.

Scope:

- delete/demote only failed builder/source/gate pieces with proof
- preserve accepted new builder
- preserve review/confirm/persistence
- preserve negative fixtures that prove the failure cannot recur

### Slice R8: Resume Service-Size Cleanup

Owner:

ARCHITECT / BACKEND.

Scope:

- return to Hito Stack Simplification Strike only after plan creation passes product acceptance
- re-audit hotspots after accepted rebuild
- select the next safe deletion/demotion gate

## What Remains Forbidden

- no shipped 5K
- no target-time support as a happy path
- no 5K benchmark as a normal happy-path input
- no no-watch / no-app selectable normal path
- no fake pace
- no fake personal HR
- no frontend-owned schedule logic
- no DB/Supabase mutation in planning/coaching slices
- no persistence semantic changes in this plan unless separately approved
- no OpenAI runtime generation for normal plan creation
- no broad deletion without a deletion boundary
- no current product/system docs update as if the rebuild is shipped

## QA Expectations

Acceptance QA must prove:

- exported JSON contains final selected-distance behavior
- exported JSON contains watch-executable segment prescriptions
- no vague effort-primary targets appear as primary execution truth
- browser flow opens selected-plan modal/screen from `Select Plan`
- mini calendar renders backend-shaped rows and colored workout types
- rest-day and preferred long-run preferences are collected or defaulted by backend
- workout detail/readback renders primary structured prescription before secondary cue
- mobile 375px has no horizontal overflow
- no Supabase mutation unless explicitly scoped

## Risks

- Reusing the failed builder too heavily may preserve the same wrong doctrine under new names.
- Letting frontend own calendar/schedule preview would create a second plan truth.
- Treating weight/height as medical/injury inference would be unsafe and unacceptable.
- Letting target time create precise pace truth would reintroduce fake precision.
- Requiring 5K benchmark or personal HR-zone setup would make the new engine feel like the old
  over-gated flow.
- Treating Hito default HR zones as personal truth would create fake personalization.
- Deleting accepted runtime/persistence artifacts before replacement coverage exists could break
  review/confirm paths.
- Expanding beyond the smallest 10K builder before R3 proves endpoint/readback quality would likely
  recreate the patch cycle.

## Exit Criteria

- Running Coach source-of-truth exists for shipped distances and workout segment anatomy.
- Backend source-of-truth model is implemented from coach doctrine.
- At least 10K passes exported JSON, browser, selected-plan modal, workout detail, endpoint, and
  watch-executable segment acceptance.
- Half Marathon passes the same acceptance before it is considered product-ready again.
- Marathon/Base is either honestly repositioned or passes an explicit endpoint contract.
- Frontend selected-plan flow uses backend-shaped calendar/review truth.
- Failed old builder artifacts are deleted/demoted or frozen as negative fixtures.
- Service-size cleanup remains paused until product acceptance is complete.

## Blockers

- Backend Slice R2 is accepted.
- Backend Slice R2B is accepted.
- Backend Slice R3 10K builder is accepted.
- Backend Slice R4C 10K diversity policy behavior is implemented, harness-validated, and build
  validated.
- QA Slice R5 accepted the rebuilt 10K selected-plan vertical.
- Backend Slice R6B Half Marathon and Marathon Base preview expansion is implemented,
  harness-validated, and build validated.
- QA Slice R6C is ready for backend acceptance.
- Frontend Slice R6D selected-plan preview wiring is implemented and ready for QA validation.
- Service-size cleanup is blocked until this rebuild passes product acceptance.

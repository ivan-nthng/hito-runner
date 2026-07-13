# Hito Compiler Architecture Rebuild Plan

## Status

backlog

## Type

plan

## Priority

high

## Next Recommended Role

backend

## Task

Implement the PlanCreation Engine Kernel rebuild from the Phase 0 compiler architecture decisions.

## Stage

BACKEND implementation / PlanCreation Engine Kernel and generated-plan contract rebuild.

## Exact Handoff Prompt

```md
ROLE: BACKEND

Task:
Implement the PlanCreation Engine Kernel rebuild from the Phase 0 compiler architecture decisions.

Stage:
BACKEND implementation / PlanCreation Engine Kernel and generated-plan contract rebuild.

Plan:
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-07-13-hito-compiler-architecture-plan.md`

Context:
ARCHITECT Phase 0 is complete. Product approved starting the compiler architecture track now. The first implementation gate is BACKEND-owned `PlanCreation Engine Kernel Rebuild`.

Root cause and architecture fit:
Visible symptom: generated plans can be schema-safe and QA-accepted but still feel weak, generic, or over-dependent on AI/local-fixture authoring.
Likely underlying cause: the current path lets AI/local fixture own too much dated rhythm, progression, cutback, taper, endpoint placement, and workout specificity while backend mostly validates or repairs after the fact.
Canonical owner: backend plan-creation engine validation/normalization/AI contract. Frontend must keep rendering backend-shaped truth only.

Current product truth to preserve:
- Quick setup generated plan preview/create/readback for 10K, 21.1K, 42.195K, and Custom 15K.
- Manual workout authoring and persisted edit behavior.
- Saved calendar and workout detail/readback/logging.
- Review/confirm exactness: confirm must persist the reviewed canonical draft and must not call AI or trust client rows.
- Child-first repeat `children[]`, structural-only Repeat parents, no `repeat_unit` / `recovery_unit`.
- Target time/outcome pace are goal/review truth only, not executable pace targets.
- No fake executable pace, no fake personal HR, no parent repeat targets.
- Import/export/provider comparison seams remain preservation boundaries unless explicitly touched.

Scope:
1. Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, skills/hito-architecture-audit/SKILL.md, this backlog plan, the running-plan rebuild plan, current product/system/state/functional-map docs, and relevant source seams.
2. Reuse existing plan-creation seams first:
   - `src/lib/ai-generated-running-plan.ts`
   - `src/lib/plan-creation-engine/*`
   - `src/lib/ai-first-plan-blueprint-*`
   - `src/lib/running-plan-engine-actions.ts`
   - `src/lib/running-plan-engine-review.ts`
   - `src/lib/imported-plan.ts`
   - `src/lib/plan-export.ts`
   - `src/lib/workout-result-import/compare-workout-result.ts`
3. Introduce or consolidate one deterministic backend kernel contract:
   `PlanGoalIntent -> TrainingOutcomeContract -> TrainingProcessPlan -> dated workout document slots -> AI/local-fixture authored detail inside constraints -> reviewed canonical training-plan-v2`.
4. Define `TrainingOutcomeContract` from normalized `planGoalIntent`, runner setup, benchmark truth, horizon, feasibility, target date, target finish time/outcome pace, and metric policy.
5. Define `TrainingProcessPlan` with phases, week goals, training-day rhythm, long-run role, development touch, cutbacks, taper, endpoint, warning/impossible status, and allowed workout/block atoms.
6. Make AI/local fixture authoring consume the process contract instead of inventing the whole dated rhythm/progression/endpoint. Backend may still validate, normalize, and repair details, but the process contract owns the skeleton.
7. Add or strengthen machine-readable validation for the intermediate kernel contract before dated workouts are emitted. Do not rely only on final output validators.
8. Delete or collapse stale generated-plan values/compatibility when source proof shows no current product/safety/audit/recovery/import/export/provider/validator consumer. Audit at minimum:
   - old single-main-block endpoint templates in `plan-creation-engine/endpoint-contracts.ts`;
   - compatibility fallback `normalizeWorkoutDayKind -> easy`;
   - unused or ambiguous source-model values such as `threshold`;
   - `editable_default_hr` naming/semantics, preserving only non-personal bounded HR guidance if still current;
   - internal/non-default envelope or deterministic-support branches that no current validator/product path needs.
9. Preserve import/export/provider comparison boundaries unless the kernel work directly changes their planned-workout input shape.
10. Use or reuse subagents for read-only source audit, Running Coach doctrine review, and QA/validator inventory where useful. Close them and integrate findings yourself; do not return micro-prompts to Product for routine same-lane checks.

Validation:
- `node --import tsx ./scripts/validate-plan-goal-intent-contract.ts`
- `node --import tsx ./scripts/validate-ai-generated-running-plan-creation.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
- `node --import tsx ./scripts/validate-planned-workout-language.ts`
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `npm run validate-manual-workout-authoring`
- Targeted ESLint for touched backend/script files.
- `npm run build` if public imports/runtime contracts change.
- `git diff --check -- <touched files>`
- Use mock/local-fixture AI probes only; do not call live OpenAI unless a later explicit Product-approved task scopes that.

Stop conditions:
- Stop if the work would require Supabase schema/data mutation, live OpenAI/provider calls, browser QA as part of backend implementation, or frontend UI changes in the same slice.
- Stop if preserving current Quick setup, manual authoring, calendar, workout detail/logging, import/export, provider comparison, or review/confirm safety would require a Product breaking-change decision.
- Stop if the implementation starts creating a second workout language, second plan persistence model, or frontend-owned feasibility/target truth.
- Stop if Running Coach doctrine cannot decide whether a scenario should warn, block, or proceed safely.

Required final report:
- Explain the new kernel in plain language.
- List files changed.
- Name existing seams reused.
- Name deleted/collapsed stale values or explain why they were kept.
- Report validation commands and results.
- Report subagents used/reused/closed.
- State whether a QA/browser follow-up is required.
```

## Issue Category

improvement

## Severity

high

## Human Priority

next

## Human Status

triaged

## Owner

ARCHITECT first, then BACKEND / FRONTEND / QA / RUNNING COACH / DESIGNER by phase.

## Reported

2026-07-13

## User Report

Product likes the idea of making Hito a compiler-style service, but the current functionality must
not break. Product also wants this track to fix the still-weak generated-plan engine, not simply
wrap the current behavior in nicer architecture words. Product wants a detailed backlog plan that
preserves context and names the participants, gates, implementation path, engine rebuild point, and
legacy/value cleanup policy.

## Product Direction

Hito should become a domain-process system, not a pile of screens and feature slices.

The target architecture:

`runner/provider/manual/AI intent -> backend validation -> normalized intent -> canonical compiled plan/workout documents -> persisted entities -> read-model projections -> UI rendering -> provider/evidence comparison`

AI, manual authoring, import, templates, selected distance-goal creation, and future provider input
should become different authoring frontends into the same compiler, not separate product systems.

## Why Now

Current accepted work already moved Hito toward this model:

- unified planned-workout language;
- child-first repeat blocks;
- manual target inputs;
- generated plan goal intent;
- workout document readback;
- review/confirm safety;
- source-size and deletion-first cleanup;
- service-domain ownership map.

The risk is that future work keeps adding route-local helpers, feature-specific validators, and
compatibility branches instead of consolidating around the canonical compile pipeline.

The second risk is that Hito preserves the accepted block system while the generated-plan engine
continues to author weak plans. The compiler rebuild must therefore include a real engine rebuild:
plans should be composed from accepted atomic pieces, not patched after the fact by UI readback or
proof scripts.

## Current Accepted Behavior To Preserve

- Quick setup generated plan creation and readback.
- Manual workout authoring, templates, target inputs, persisted future-row edit, Add/Clear/Move,
  manual Copy/Paste, and backend review/confirm safety.
- Saved calendar readback and row-state capabilities.
- Workout detail readback and workout logging.
- JSON import/export as the current advanced fallback.
- Garmin/FIT/provider evidence stays actual-evidence input, not planned-workout truth.
- Generated rows remain read-only unless backend explicitly accepts editability.
- No fake executable pace, no fake personal HR, no second workout language, and no frontend-owned
  persistence truth.

## Proposed Compiler Model

### Process Kernels

| Kernel | Owns | Current source roots to map first |
| --- | --- | --- |
| `PlanCreation` | first plan, selected distance-goal, import, replacement, review/confirm | `first-plan-actions`, `running-plan-engine-actions`, `running-plan-engine-review`, `plan-replacement-actions`, `active-plan-transition-actions` |
| `WorkoutAuthoring` | manual constructor, templates, target inputs, copy/paste reconstruction, persisted edit drafts | `manual-workout-authoring/*`, manual workout components, manual validators |
| `PlanLifecycle` | active plan archive/replace/clear schedule/schedule edit/add plan | `active-plan-*`, `Calendar.tsx`, plan-management components |
| `WorkoutDocument` | canonical block/target/note/readback document for manual/generated/imported workouts | `planned-workout-block-contract`, `planned-workout-language`, `training`, `workout-structure/*`, manual grammar |
| `EvidenceComparison` | provider uploads, actual metrics, comparison and AI insight from evidence | `workout-result-import/*`, `workout-log-actions`, comparison/readback seams |
| `ProofInfrastructure` | validators, fixtures, source-size ledger, QA runtime, artifact hygiene | `scripts/*`, `qa-artifacts/`, current validator commands |

### Canonical Inputs

- `PlanGoalIntent`: distance, optional finish time, optional outcome pace, optional race day, setup
  context, training preferences, execution mode, and benchmark truth.
- `ManualWorkoutDraftIntent`: runner-authored workout type, blocks, repeat children, targets,
  notes, provenance, and template source.
- `ImportPlanIntent`: parsed external or Hito JSON with source metadata and start-date policy.
- `ProviderEvidenceIntent`: raw FIT/ZIP/API evidence normalized into actual metrics and result
  assets, never directly into planned workout truth.
- `LifecycleMutationIntent`: Add/Clear/Move/Edit/Refresh/Replace request plus actor, row state,
  capability, revision, and safety metadata.

### Canonical Compiled Artifacts

- `CompiledPlanDocument`: normalized plan goal, schedule, workouts, preferences, source metadata,
  review checksum, and persistence-ready rows.
- `CompiledWorkoutDocument`: workout type, ordered blocks, one-level repeat children, optional
  runner-entered/generated-safe targets, notes/cues, metric policy, source/provenance, and readback
  language.
- `CompiledCalendarProjection`: date rows, row-state capability, visible actions, protected-history
  state, and UI-safe summaries.
- `CompiledComparisonDocument`: planned expectation plus actual evidence fields that are safe to
  compare.

### Atomic Composition Ladder

The compiler track must preserve the useful "cubes" Hito already has and make them the engine's
native building blocks:

`plan -> start benchmark -> target benchmark/outcome -> phase -> week -> day -> workout -> section -> value`

Accepted atoms include:

- goal intent: distance, optional finish time, optional outcome pace, optional target date, runner
  setup, available days, fixed rest days, benchmark truth, and execution preference;
- workout roles: Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills,
  Run/Walk;
- block roles: Warm-up, Run, Walk, Work, Recover, Finish, Cooldown, structural-only Repeat set;
- block structure: ordered sections, one-level repeat `children[]`, duration/distance, safe target
  guidance, notes/cues, provenance;
- metric policy: no fake executable pace, no fake personal HR, no parent repeat targets, and no
  target comparison without actual evidence truth.

Unused atoms and legacy values must be audited before or during each engine gate. If a value is not
used by current product flows, validators, safety/audit/recovery, import/export, provider
comparison, or accepted QA proof, it should be deleted or explicitly marked with a removal
condition.

### Mandatory Generated-Plan Engine Rebuild

This compiler track is not complete unless the generated-plan engine is rebuilt around the atomic
composition ladder.

The target engine flow:

`PlanGoalIntent -> TrainingOutcomeContract -> TrainingProcessPlan -> weekly phase/stimulus plan -> dated workout documents -> review/confirm -> persistence/readback`

The engine should own:

- start benchmark and target outcome interpretation;
- horizon and feasibility classification;
- phase planning, including base/adaptation, build, specificity, cutback, taper, and endpoint;
- weekly load/rhythm and long-run progression;
- workout stimulus selection using accepted workout roles;
- section/block composition using accepted block roles and child-first repeats;
- safety policy for target-time goals, no-benchmark plans, beginner plans, and impossible plans;
- rejection or warning when a credible plan cannot be created.

AI/local fixtures may still help author dated workout detail, but they should operate inside this
engine contract. They must not be the sole owner of progression, specificity, endpoint logic, or
metric truth.

## Phase 0 Decision - 2026-07-13

Verdict: Phase 0 complete. Start BACKEND `PlanCreation Engine Kernel Rebuild`.

Root cause confirmed:

- visible symptom: generated plans can pass schema/review/readback gates while still feeling weak or
  over-dependent on AI-authored dated output;
- underlying cause: current source splits plan quality across AI/local-fixture authoring,
  post-generation validators, review/persistence exactness, and scattered `plan-creation-engine`
  atoms instead of one deterministic process kernel;
- canonical owner: BACKEND plan-creation engine contract, with RUNNING COACH doctrine review and QA
  validator corpus.

Current pipeline:

`Quick setup input -> planGoalIntent -> ai-generated authoring input -> AI/local-fixture blueprint -> backend blueprint validation/repair/normalization -> canonical training-plan-v2 -> running-plan review token/checksum -> confirm without AI -> active-plan persistence -> readback/export/comparison consumers`.

Process-kernel source map:

| Kernel | Current source proof | Phase 0 read |
| --- | --- | --- |
| `PlanCreation` | `ai-generated-running-plan.ts`, `plan-creation-engine/*`, `ai-first-plan-blueprint-*`, `running-plan-engine-actions.ts`, `running-plan-engine-review.ts` | First implementation owner; needs deterministic process contract before AI detail authoring. |
| `WorkoutDocument` | `planned-workout-block-contract.ts`, `planned-workout-language.ts`, `training.ts`, `workout-structure/*`, `plan-export.ts`, `imported-plan.ts` | Preserve child-first/readback/export truth; do not rebuild first. |
| `WorkoutAuthoring` | `manual-workout-authoring/*`, manual constructor/review components, manual validators | Preservation target; no manual rewrite in first engine gate. |
| `PlanLifecycle` | `active-plan-*`, `active-plan-workout-editing/*`, calendar/plan-management UI | Preserve review/confirm and row-state capabilities; not first gate. |
| `EvidenceComparison` | `workout-result-import/*`, comparison proof inside planned-workout language validation | Preserve actual-evidence boundary; only touch if planned-workout input shape changes. |
| `ProofInfrastructure` | generated-plan, plan-goal, confirm, planned-workout-language, doctrine, manual validators | Must gain first-class kernel corpus for `TrainingOutcomeContract` and `TrainingProcessPlan`. |

Accepted atom/value inventory for the engine:

- goal/outcome atoms: selected/custom distance, optional target date, optional finish time, optional
  outcome pace, runner level, age/height/weight, running days, fixed rest days, preferred long-run
  day, benchmark truth, execution preference/metric policy;
- process atoms: horizon, feasibility, adaptation/base/build/specific/cutback/taper/endpoint,
  weekly rhythm, long-run role, one quality touch max, hard-day spacing, warning/impossible outcome;
- workout atoms: Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills,
  Run/Walk, plus internal exact identities only as backend secondary truth;
- block atoms: Warm-up, Run, Walk, Work, Recover, Finish, Cooldown, structural-only Repeat set;
- structure atoms: ordered sections, one-level repeat `children[]`, duration/distance/repeat values,
  child-owned targets/cues, no parent repeat target;
- metric atoms: target time/outcome pace are goal truth only; pace targets need benchmark/user truth;
  personal HR needs personal HR truth; default HR guidance may remain only as non-personal bounded
  guidance if current validators/docs still consume it.

Preservation matrix:

| Flow | Preserve in first engine gate |
| --- | --- |
| Quick setup generated plan | 10K, 21.1K, 42.195K, Custom 15K preview/create/readback; generated rows read-only. |
| Review/confirm | Confirm persists the reviewed canonical draft, calls no AI, trusts no client rows, and keeps token/checksum exactness. |
| Manual authoring | Manual constructor/review, target inputs, templates, Add/Clear/Move/Copy/Edit, and manual validators remain untouched except as validation smoke. |
| Calendar/workout detail/logging | Saved calendar, workout detail readback, and logging remain behavior-preservation targets. |
| Import/export | `training-plan-v2` import/export remains canonical compatibility when touched; no new export shape. |
| Provider comparison | Planned workout truth remains separate from actual evidence; no pace/HR/RPE comparison without normalized actual evidence. |

Deletion and cleanup candidates for BACKEND audit:

| Candidate | Classification | Removal condition |
| --- | --- | --- |
| Old single-main-block endpoint templates in `plan-creation-engine/endpoint-contracts.ts` | likely collapse/delete | Remove if replaced by process-kernel endpoint dynamics and no validator/export consumer needs them. |
| `normalizeWorkoutDayKind` fallback to `easy` | compatibility smell | Replace with explicit validation/unavailable outcome if current consumers do not need silent fallback. |
| Ambiguous/internal source values such as `threshold` | needs mapping or retirement | Map to accepted runner-facing/internal identity, or delete if no current scenario uses it. |
| `editable_default_hr` value wording | needs policy audit | Keep only if represented as non-personal default guidance; rename/collapse if it implies personal HR truth. |
| Internal `ai-first-plan-envelope-v1` and deterministic-support branches | keep unless unused | Remove only with source proof that no ops/validator/current fallback path consumes them. |
| Review tokens, import/export, provider comparison, manual validators | keep | Preservation gates until the kernel proves equivalent or stronger coverage. |

Phase 0 product decisions:

- target date is hard when supplied: endpoint must land on that date; do not silently auto-extend;
- target finish time and outcome pace remain outcome/review truth, not executable workout pace;
- normal v1 may keep the current watch/app execution assumption unless Product changes setup later;
- Marathon Completion may use an exact `42195m` endpoint but must not imply target-time readiness
  when support is weak;
- aggressive, low-support, or no-benchmark target-time goals should warn when a safe honest plan is
  possible and block/unavailable when endpoint honesty, load safety, or metric truth cannot be met.

First BACKEND gate:

Build a deterministic `TrainingOutcomeContract -> TrainingProcessPlan -> dated workout document
slots` seam, then make AI/local-fixture authoring fill detail inside that contract before existing
review/confirm/persistence.

Minimum validation corpus:

- accepted scenarios: 10K no benchmark, beginner/low-support 10K target time, benchmark-backed 10K,
  Half credible target time, Half unsupported target-time warning, Marathon target-date/finish-time
  warning, beginner Marathon durability build, Custom 15K exact endpoint, Custom 30K warning,
  awkward start-date/long-run placement;
- failure scenarios: generic endpoint, rest endpoint, wrong endpoint date, flat endpoint dynamics,
  early hard workouts in no-benchmark W1-W4, low-support overload, target-time-derived executable
  pace, fake HR, hard-day adjacency, long-run jump or taper peak violation, identity deserts,
  preview/confirm/export richness drift, and unavailable AI fallback becoming product truth.

## Implementation Phases

### Phase 0 - Architecture Map And First Gate Selection

Owner: ARCHITECT.

Goal: map current code to process kernels and select one safe first gate.

Deliverables:

- compact compiler architecture map in an existing current/source-of-truth doc or active plan;
- first implementation owner and gate;
- explicit non-goals and stop conditions;
- no runtime code changes.

### Phase 1 - PlanCreation Engine Kernel Rebuild

Likely owner: BACKEND, with RUNNING COACH doctrine review and QA corpus validation.

Goal: rebuild generated-plan creation around a canonical engine contract instead of relying on AI
drafts plus repair/validation as the primary coaching model.

This is the point where the project transitions from architecture planning into engine work. Do not
start this phase until Phase 0 has produced:

- a source map of the current generated-plan path;
- an inventory of accepted workout/block/value atoms;
- a current-flow preservation matrix;
- a deletion list for unused/legacy generated-plan values;
- a validation corpus covering accepted and failure scenarios.

Expected work:

- define `TrainingOutcomeContract` from `planGoalIntent`;
- define `TrainingProcessPlan` with phases, week goals, day rhythm, workout stimulus, endpoint,
  cutback, taper, and warning/impossible outcomes;
- make AI/local fixture authoring consume the process contract rather than invent the whole plan;
- require backend validation to check process quality, not only schema safety;
- delete old generated-plan compatibility, stale values, and proof branches that no longer map to
  current product truth;
- preserve review/confirm exactness and current persistence/readback semantics.

Validation:

- generated-plan creation validator;
- plan goal intent validator;
- Running Coach corpus for 10K, 21.1K, 42.195K, Custom 15K, target-time, no-benchmark, beginner,
  aggressive, and impossible scenarios;
- source proof that generated plans use accepted workout/block/value atoms;
- browser proof after implementation for Quick setup preview/create/readback on desktop and exact
  375px;
- build.

### Phase 2 - WorkoutDocument Kernel Contract

Likely owner: BACKEND, with RUNNING COACH doctrine review.

Goal: make `CompiledWorkoutDocument` the single canonical internal/readback artifact across manual,
generated, selected preview, import/export, and provider comparison.

Expected work:

- audit `planned-workout-block-contract`, `planned-workout-language`, `training`, manual grammar,
  export/import, provider comparison, and selected preview adapters;
- identify fields that are already canonical vs display-only;
- create or consolidate one typed contract/read-model if source proof shows current seams are still
  duplicated;
- keep child-first repeats and target truth intact;
- delete old display adapters only when all current consumers use the canonical read-model.

Validation:

- manual authoring validator;
- generated plan validator;
- planned workout language validator;
- import/export doctrine proof;
- provider comparison source proof;
- build.

### Phase 3 - Reusable Review/Confirm Lifecycle

Likely owner: BACKEND.

Goal: one reusable mutation lifecycle for risky operations:
`draft -> review artifact -> signed token/checksum -> confirm -> persisted mutation -> readback`.

Candidate flows:

- generated plan confirm;
- manual workout confirm;
- selected active-plan transition;
- schedule edit/reflow;
- plan refresh;
- manual move/delete/edit review.

Expected work:

- audit token/checksum/stable-json patterns;
- reuse `review-token-signing` where possible;
- consolidate duplicated review exactness helpers without weakening per-flow safety;
- keep domain-specific policies separate from shared signing/lifecycle mechanics.

Validation:

- touched validators;
- build;
- stale-token and mismatched-checksum proof for at least one representative flow.

### Phase 4 - Calendar Projection Kernel

Likely owner: FRONTEND first, then BACKEND only if capability readback is insufficient.

Goal: calendar renders one backend-shaped projection instead of owning manual action logic locally.

Expected work:

- keep backend capability truth untouched;
- move route-local manual action context/view-model helpers from `Calendar.tsx` into a focused
  calendar/manual action owner;
- keep `Calendar.tsx` as shell;
- reuse Hito calendar DS primitives;
- preserve Add/Clear/Move/Copy/Undo/feedback behavior.

Validation:

- lint/build;
- manual authoring validator if manual imports change;
- browser proof for saved calendar desktop and exact 375px.

### Phase 5 - PlanCreation Entry-Point Consolidation

Likely owner: BACKEND with RUNNING COACH and QA.

Goal: generated/manual/import/text/selected plan creation entrypoints converge around one
compile/apply model without losing product-specific entrypoints. This phase is after the engine
kernel rebuild; it is about entrypoint cleanup, not the first coaching-engine fix.

Expected work:

- map selected distance-goal, structured Quick setup, free-text replacement, JSON import, and manual
  first-plan creation;
- keep separate UI entrypoints but converge review/persistence artifacts;
- delete stale `PlanPreset` source names only after current distance-goal semantics are preserved;
- avoid resurrecting deterministic product builders or voice-to-plan.

Validation:

- generated plan creation validator;
- plan goal intent validator;
- import/export proof;
- browser proof for Quick setup and manual setup if UI touched.

### Phase 6 - EvidenceComparison Kernel

Likely owner: BACKEND / QA.

Goal: provider upload and comparison become a compiled actual-evidence document compared against
compiled workout expectation.

Expected work:

- audit FIT/ZIP/result asset/actual metrics/comparison boundaries;
- ensure planned workout truth and actual evidence truth remain separate;
- define what can be compared now and what remains blocked without normalized actual evidence.

Validation:

- provider import/comparison validators;
- source proof that pace/HR/RPE are not compared without actual evidence truth.

### Phase 7 - UI Design And Product Language Projection

Likely owner: DESIGNER / FRONTEND.

Goal: UI becomes read-model rendering: plan creation, workout detail, calendar, progress, and
manual editor use the same product language and DS primitives.

Expected work:

- unify readback names and copy;
- keep generated rows read-only;
- keep manual edit affordances scoped;
- avoid route-local one-off UI grammar.

Validation:

- browser proof on desktop and exact 375px for touched flows;
- no raw backend/debug labels in runner-facing UI.

## Safety Strategy

Do not Big Bang rewrite.

Use one gate at a time:

1. Map current owner.
2. Pick one kernel seam.
3. Add or consolidate a canonical contract only if it removes a larger duplicate path.
4. Port one or two consumers.
5. Delete the replaced local path.
6. Validate current accepted flows.
7. Continue only if the owner/risk/validation story stays coherent.

## Participants

| Role | Responsibility |
| --- | --- |
| PRODUCT | Keep product boundaries honest; decide when a future-only capability becomes current. |
| ARCHITECT | Own process-kernel map, gate sequencing, compatibility/deletion policy, and stop conditions. |
| BACKEND | Own compiler contracts, validation, normalization, persistence, review/confirm, import/export, provider comparison. |
| FRONTEND | Own UI collection/rendering, DS reuse, route-state simplification, and read-model projection. |
| QA | Prove accepted flows still work with CLI/source/browser evidence; own regression matrix per gate. |
| RUNNING COACH | Approve coaching doctrine, plan specificity, target realism, workout identity, and progression safety. |
| DESIGNER | Shape runner-facing language and UI around compiled read-models, not backend/debug implementation truth. |
| DEVTOOLS | Keep validators, metrics, artifact hygiene, local QA runtime, and source-size governance small and useful. |

## First Recommended Gate

ARCHITECT should start with Phase 0 and choose the smallest high-leverage kernel seam.

Current likely first implementation candidates:

1. `PlanCreation Engine Kernel Rebuild`: default first implementation gate after Phase 0, because
   Product's current root pain is plan quality and weak generated training logic.
2. `WorkoutDocument` backend/read-model consolidation: next if Phase 0 proves engine quality is
   blocked by duplicated workout-document adapters.
3. `CalendarProjection` frontend cleanup: defer unless source proof says UI projection complexity is
   the first blocker after engine contract work.

## Engine Transition Rule

The project moves to engine implementation immediately after Phase 0, but only when Phase 0 has
answered these questions:

- Which accepted atoms are the engine allowed to compose?
- Which legacy/generated-plan values are unused and safe to delete?
- Which accepted flows must remain green during the rebuild?
- Which coach-quality scenarios define "good enough" for v1?
- Which validation corpus proves the engine is better, not just differently shaped?

If those answers exist, the next owner is BACKEND for `PlanCreation Engine Kernel Rebuild`.
If they do not exist, stay in ARCHITECT/RUNNING COACH Phase 0 rather than starting a vague rewrite.

## What Not To Touch

- Do not change Supabase schema or mutate data in architecture planning.
- Do not remove accepted generated-plan, manual-authoring, calendar, workout logging, import/export,
  or provider comparison behavior.
- Do not create a second plan persistence model.
- Do not create a second workout language.
- Do not let frontend own feasibility, target truth, mutation safety, or persistence.
- Do not call live OpenAI/provider services in architecture planning.
- Do not preserve legacy compatibility solely because it exists before real user data.

## Validation Expectations

Each implementation gate must name its own validation, but the full architecture cannot be called
accepted until these current flows still pass:

- Quick setup generated plan preview/create/readback.
- Manual workout authoring, templates, target inputs, Add/Clear/Move/Copy/Edit where accepted.
- Saved calendar and workout detail.
- Workout logging.
- JSON import/export if touched.
- Provider evidence/comparison if touched.
- Source-size/readability checks for touched hotspots.
- Browser proof for runner-facing frontend gates at desktop and exact 375px.

## Success Criteria

- Hito has a compact source-of-truth map of process kernels.
- Every new plan/workout path compiles into the same canonical artifacts.
- UI surfaces render read-models instead of rebuilding product truth locally.
- Review/confirm logic is reusable where mechanics are shared and domain-specific where safety
  differs.
- Old aliases, compatibility branches, route-local helpers, and proof-only duplicate logic are
  deleted after consumers move.
- Existing accepted product behavior still works.

## Blockers

None for backlog capture. Implementation must wait for ARCHITECT Phase 0 source audit and one
selected first gate.

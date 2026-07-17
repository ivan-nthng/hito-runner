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

Implement the simplified AI-authored plan-first Hito compiler v1.

## Stage

BACKEND implementation / AI-authored plan draft parser, atomizer, review, and confirm.

## Exact Handoff Prompt

```md
ROLE: BACKEND

Task:
Implement the simplified AI-authored plan-first Hito compiler v1.

Stage:
BACKEND implementation / AI-authored full-plan draft parser, atomizer, calendar review, and confirm.

Plan:
`/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-07-13-hito-compiler-architecture-plan.md`

Reference specimen:
`/tmp/codex-remote-attachments/019f6114-ae28-7023-8534-09e8709ad15a/3DD0DD37-D6C8-4A60-A10E-505E69A25C4D/1-marathon_plan_22_weeks.json`

Context:
Product corrected the v1 gate. Hito still uses structured Hito atoms and a backend compiler, but v1 must not block useful AI-authored plans by requiring a perfect strict internal atom document before the runner can see a calendar draft. The first gate is: runner facts -> one AI-authored full plan draft shaped like the specimen -> backend parse/atomize/compile -> calendar preview -> review/confirm -> persistence/readback.

Root cause and architecture fit:
Visible symptom: live provider work timed out and failed before a runner could review a useful plan.
Wrong fix: make backend author the training plan deterministically, or make backend reject coach-authored pace/HR/workout choices just because they are not perfect Atom DSL.
Likely underlying cause: backend validation was acting like a coaching permission system instead of a parser/compiler/review safety boundary.
Canonical owner split: AI owns the coach-authored full plan draft, including workout mix, paces, HR-zone labels, progression, long runs, intervals, tempo, hills, strides, and control workouts. Backend owns parsing, atomization, structural validation, calendar/date integrity, review token/checksum, confirm exactness, persistence, and readback. Frontend renders backend-shaped review/readback only.

Current product truth to preserve:
- Quick setup generated plan preview/create/readback for 10K, 21.1K, 42.195K, and Custom 15K.
- Manual workout authoring and persisted edit behavior.
- Saved calendar and workout detail/readback/logging.
- Review/confirm exactness: confirm must persist the reviewed canonical draft and must not call AI or trust client rows.
- Child-first repeat `children[]`, structural-only Repeat parents, no `repeat_unit` / `recovery_unit`.
- AI-authored pace targets are allowed, including short interval targets such as `2 min @ 5:15-5:30/km`, when they are presented as coach-authored plan guidance and the runner context can plausibly support them.
- AI-authored HR zone labels such as `Z1`, `Z2`, `Z5`, or `Z1-Z2` are allowed as Garmin/user-zone guidance. Unsupported raw personal BPM claims remain blocked unless personal HR-zone truth exists.
- Backend must not rewrite the draft into a different training plan because it thinks a pace, workout identity, or training mix is suboptimal.
- Import/export/provider comparison seams remain preservation boundaries unless explicitly touched.

Scope:
1. Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, skills/hito-architecture-audit/SKILL.md, this backlog plan, the running-plan rebuild plan, current product/system/state/functional-map docs, and relevant source seams.
2. Reuse existing plan-creation seams first:
   - `src/lib/ai-generated-running-plan.ts`
   - `src/lib/plan-creation-engine/*`
   - `src/lib/ai-first-plan-draft-service.ts`
   - `src/lib/ai-authored-plan-first-compiler.ts`
   - `src/lib/running-plan-engine-actions.ts`
   - `src/lib/running-plan-engine-review.ts`
   - `src/lib/imported-plan.ts`
   - `src/lib/plan-export.ts`
   - `src/lib/workout-result-import/compare-workout-result.ts`
3. Build the smallest backend-owned v1 seam:
   `runner facts -> one AI-authored full plan draft -> backend parser/atomizer/compiler -> calendar preview -> review/confirm -> persistence/readback`.
4. Accept a specimen-shaped AI draft for v1. It can include metadata, weeks, weekday objects, workout types, steps, blocks, repeat intervals, recoveries, pace strings, HR-zone strings, distances, durations, notes, warnings, and assumptions. Do not require the provider to emit the final strict Hito Atom JSON shape in the first gate.
5. Preserve Hito atoms by atomizing the AI draft into backend-owned plan, week, day, workout, section/block, repeat, target/value, note/cue, warning, and assumption atoms before review/persistence.
6. Compile the atomized draft into current Hito calendar/workout structures and a reviewable calendar draft. Confirm must persist exactly the reviewed draft and must not call AI again.
7. Hard-reject only safety/display/persistence failures:
   - malformed JSON;
   - missing weeks/days/workout steps;
   - impossible or contradictory calendar/date structure;
   - fixed rest days not respected;
   - broken Repeat/step structure that cannot be displayed or converted;
   - unsupported raw personal BPM claims when no HR-zone truth exists;
   - medical claims;
   - wildly impossible load/progression;
   - review/confirm/persistence safety failures.
8. Warn or annotate instead of rejecting when the issue is coaching quality/suboptimality, rough workout identity naming, or coach-authored target guidance that can still be displayed safely.
9. Keep stricter atom-level validation as future hardening for import/export/Garmin/readback quality. Do not make strict atom purity the blocker for the first live-provider reviewable plan.
10. Delete or collapse stale generated-plan compatibility when the simplified parser/atomizer/compiler replaces it and no current product/safety/audit/recovery/import/export/provider/validator consumer remains.
11. Preserve import/export/provider comparison boundaries unless the compiler work directly changes their planned-workout input shape.
12. Use or reuse subagents for read-only source audit, Running Coach doctrine review, and QA/validator inventory where useful. Close them and integrate findings yourself; do not return micro-prompts to Product for routine same-lane checks.

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
- Use the attached specimen and mock/local-fixture AI probes first. Do not call live OpenAI unless a later explicit Product-approved task scopes that.

Stop conditions:
- Stop if the work would require Supabase schema/data mutation, live OpenAI/provider calls, browser QA as part of backend implementation, or frontend UI changes in the same slice.
- Stop if preserving current Quick setup, manual authoring, calendar, workout detail/logging, import/export, provider comparison, or review/confirm safety would require a Product breaking-change decision.
- Stop if the implementation starts creating a second workout language, second plan persistence model, backend-authored flat fallback plan, backend-authored target/horizon product truth, frontend-owned feasibility/target truth, or a strict atom-purity gate that blocks useful specimen-shaped plans before review.
- Stop if Running Coach doctrine cannot decide whether a scenario should warn, block, or proceed safely.

Required final report:
- Explain the new AI/backend split in plain language: AI authors the coach plan; backend parses, atomizes, compiles, validates hard safety boundaries, reviews, confirms, and persists.
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

Product correction for v1:

- AI is the coach author of the full training plan draft.
- Backend is the parser, atomizer, compiler, review/confirm safety boundary, persistence owner, and
  readback owner.
- Hito atoms stay: workouts still become structured computer-readable training documents before
  review and persistence.
- Strict atom purity is not the first live-provider blocker. The first blocker is whether a useful
  AI-authored full-plan draft can become a safe reviewable calendar.
- The attached marathon specimen is a product-direction example for authorship speed and richness,
  not a final schema contract.

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
- AI-authored pace targets and HR-zone labels can be displayed as coach-authored plan guidance when
  they are structurally safe and labeled as plan guidance.
- No backend-invented training plan, no unsupported raw personal BPM truth, no second workout
  language, and no frontend-owned persistence truth.

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
- metric policy: AI-authored pace guidance is allowed as plan guidance; HR zones such as `Z1`,
  `Z2`, `Z5`, or `Z1-Z2` are allowed as zone guidance; unsupported raw personal BPM claims remain
  blocked without HR-zone truth; no parent repeat targets; no target comparison without actual
  evidence truth.

Unused atoms and legacy values must be audited before or during each engine gate. If a value is not
used by current product flows, validators, safety/audit/recovery, import/export, provider
comparison, or accepted QA proof, it should be deleted or explicitly marked with a removal
condition.

### Mandatory Generated-Plan Engine Rebuild

This compiler track is not complete unless the generated-plan engine is rebuilt around the atomic
composition ladder.

The v1 target engine flow:

`runner facts -> one AI request -> AI-authored full plan draft -> backend parse/atomize/compile -> calendar preview -> review/confirm -> persistence/readback`

The AI authoring contract should ask for a useful full training plan draft, not a backend-authored
flat skeleton. The draft may be shaped like the attached marathon specimen before backend
atomization:

- plan metadata, goal, target date/time, runner facts, rest days, long-run day, notes;
- week objects and estimated weekly load;
- weekday objects with rest days and workout types;
- steps/phases such as warm-up, work, cooldown, strides, intervals, hills, tempo, marathon pace,
  medium-long, and long run;
- repeat/interval/recovery blocks that backend can convert to structural Repeat with ordered
  children;
- AI-authored pace guidance, including short interval targets, when presented as plan guidance;
- AI-authored HR-zone guidance such as `Z1`, `Z2`, `Z5`, and `Z1-Z2`;
- recovery, cutback, taper, and endpoint/race-week logic;
- warnings, assumptions, or unable-to-author states when goal/context is weak or impossible.

The backend parser/atomizer/compiler owns trust and canonical truth:

- parse the AI draft without trusting it;
- atomize specimen-style fields into Hito plan/week/day/workout/section/repeat/target/note/warning
  atoms;
- normalize names, icons, labels, readback fields, source metadata, and canonical identities without
  rewriting the plan into a different training plan;
- convert valid repeat/interval/recovery blocks into structural Repeat parents with ordered
  children;
- preserve AI-authored pace and HR-zone guidance as plan guidance when structurally safe;
- block unsupported raw personal BPM claims when no personal HR-zone truth exists;
- enforce review/confirm exactness and persistence safety;
- preserve import/export/provider comparison boundaries;
- return correction-required, warning, or unavailable states only for hard failures.

Hard failures for v1:

- malformed JSON;
- missing weeks/days/workout steps;
- impossible or contradictory calendar/date structure;
- fixed rest days not respected;
- broken Repeat/step structure that cannot be displayed or converted;
- unsupported raw personal BPM claims when no HR-zone truth exists;
- medical claims;
- wildly impossible load/progression;
- review/confirm/persistence safety failures.

Backend must not become a deterministic flat-plan author, deterministic target/horizon author, or
coach-quality permission system. It may provide examples, constraints, parser diagnostics, warnings,
canonical atomization, and review safety. Stricter atom-level validation remains future hardening
around import/export/Garmin/readback quality after the first reviewable live-provider plan works.

## Product Decision Update - 2026-07-14

Verdict: simplify the first gate. Start BACKEND `AI-authored plan draft parser, atomizer, review,
and confirm`.

Root cause confirmed:

- visible symptom: live-provider gates timed out or failed before a runner could review a useful
  plan;
- wrong fix: make backend author deterministic plans, or make backend reject useful coach-authored
  targets because they are not strict internal atom DSL;
- underlying cause: backend validation was acting like a coaching permission system instead of a
  parser/compiler/review safety boundary;
- canonical owner split: AI owns the coach-authored full plan draft; BACKEND owns parsing,
  atomization, structural validation, calendar/date integrity, review/confirm exactness,
  persistence, import/export compatibility, and readback truth; RUNNING COACH owns doctrine review;
  QA owns validation evidence.

Current pipeline:

`Quick setup input -> planGoalIntent -> ai-generated authoring input -> AI/local-fixture full plan draft -> backend parser/atomizer/compiler -> canonical training-plan-v2 -> running-plan review token/checksum -> confirm without AI -> active-plan persistence -> readback/export/comparison consumers`.

Corrected v1 target pipeline:

`runner facts -> one AI request -> AI-authored full plan draft -> backend parse/atomize/compile -> calendar preview -> review/confirm -> persistence/readback`.

Process-kernel source map:

| Kernel | Current source proof | Phase 0 read |
| --- | --- | --- |
| `PlanCreation` | `ai-generated-running-plan.ts`, `plan-creation-engine/*`, `ai-first-plan-draft-service.ts`, `ai-authored-plan-first-compiler.ts`, `running-plan-engine-actions.ts`, `running-plan-engine-review.ts` | First implementation owner; needs specimen-shaped AI draft parsing, Hito atomization, calendar review, and confirm exactness before stricter atom hardening. |
| `WorkoutDocument` | `planned-workout-block-contract.ts`, `planned-workout-language.ts`, `training.ts`, `workout-structure/*`, `plan-export.ts`, `imported-plan.ts` | Preserve child-first/readback/export truth; do not rebuild first. |
| `WorkoutAuthoring` | `manual-workout-authoring/*`, manual constructor/review components, manual validators | Preservation target; no manual rewrite in first engine gate. |
| `PlanLifecycle` | `active-plan-*`, `active-plan-workout-editing/*`, calendar/plan-management UI | Preserve review/confirm and row-state capabilities; not first gate. |
| `EvidenceComparison` | `workout-result-import/*`, comparison proof inside planned-workout language validation | Preserve actual-evidence boundary; only touch if planned-workout input shape changes. |
| `ProofInfrastructure` | generated-plan, plan-goal, confirm, planned-workout-language, doctrine, manual validators | Must gain first-class corpus for specimen parsing, Hito atomization, hard-failure rejection paths, and review/confirm output. |

Accepted atom/value inventory for the engine:

- goal/outcome atoms: selected/custom distance, optional runner-entered target date, optional
  runner-entered finish time, optional runner-entered outcome pace, AI-estimated outcome target,
  AI-proposed horizon, runner level, age/height/weight, current base, running days, fixed rest days,
  preferred long-run day, benchmark truth, execution preference/metric policy;
- process atoms: horizon, feasibility, adaptation/base/build/specific/cutback/taper/endpoint,
  weekly rhythm, long-run role, one quality touch max, hard-day spacing, warning/impossible outcome;
- workout atoms: Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills,
  Run/Walk, plus internal exact identities only as backend secondary truth;
- block atoms: Warm-up, Run, Walk, Work, Recover, Finish, Cooldown, structural-only Repeat set;
- structure atoms: ordered sections, one-level repeat `children[]`, duration/distance/repeat values,
  child-owned targets/cues, no parent repeat target;
- metric atoms: target time/outcome pace are goal truth; AI-authored workout pace targets are
  allowed as coach-authored plan guidance; HR-zone labels are allowed as Garmin/user-zone guidance;
  unsupported raw personal BPM claims need personal HR-zone truth.

Hito atom contract:

- plan goal atoms: selected distance, custom distance, runner-entered target date,
  runner-entered target finish time, runner-entered outcome pace, AI-estimated outcome target,
  AI-proposed horizon, goal mode, warning/impossible status;
- benchmark/context atoms: runner level, age/height/weight, recent benchmark, explicit
  no-benchmark status, current base, available days, fixed rest days, preferred long-run day,
  training constraints, source confidence, backend safety/load constraints;
- phase atoms: adaptation, base, build, specific, cutback, taper, endpoint/race week;
- week atoms: week intent, load intent, focus stimulus, recovery emphasis, cutback/taper marker;
- day atoms: training day, rest day, long-run day, quality day, recovery day, endpoint day;
- workout role atoms: Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo, Intervals, Hills,
  Run/Walk, plus backend-only canonical identities as secondary/internal truth;
- section/block atoms: Warm-up, Run, Walk, Work, Recover, Finish, Cooldown, structural-only Repeat
  set;
- repeat atoms: one-level repeat group with ordered `children[]`; children own duration, distance,
  targets, notes, cues, and comparison semantics;
- target/value atoms: no target, runner-entered goal target, AI-estimated goal target,
  AI-authored pace guidance, AI-authored HR-zone guidance, RPE when present, duration, distance,
  count, notes, cues, warning, assumption;
- prohibited atoms: malformed or unconvertible workout/section/repeat structures, unsupported raw
  personal BPM claims without HR-zone truth, medical claims, parent Repeat targets, legacy
  `repeat_unit` / `recovery_unit`, and raw/internal labels as runner-facing primary language.

AI-authored full plan draft:

- non-persisted and non-trusted;
- may include phases, weeks, days, workout roles, block structure, repeat children, endpoint logic,
  recovery/cutback/taper logic, AI-estimated outcome, AI-proposed horizon, warnings, and
  assumptions;
- may be specimen-shaped before backend atomization; it does not need to be the final internal Atom
  JSON shape in v1;
- must not become canonical truth until compiled, normalized, reviewed, and confirmed by backend;
- should return correction-required or unable-to-author state when it cannot produce a useful plan,
  but backend should also convert safe imperfect drafts into warnings instead of blocking display.

Backend parser/compiler responsibilities:

- parse and atomize the AI draft into Hito atoms before review/persistence;
- validate structural/calendar/display/persistence safety;
- reject hard failures such as malformed JSON, missing weeks/days/steps, impossible calendar
  structure, broken repeats, unsupported raw personal BPM claims, medical claims, wildly impossible
  load/progression, parent Repeat targets, or review/confirm safety failures;
- warn or annotate coaching suboptimality instead of rejecting merely because backend disagrees with
  the AI's pace, workout identity, or mix;
- normalize names, icons, readback labels, canonical identities, source metadata, and
  training-plan-v2/export/import-compatible fields;
- compile valid draft atoms into canonical `TrainingPlanDocument` and workout documents;
- produce review checksum/token truth and preserve confirm exactness;
- preserve provider comparison boundaries by keeping planned truth separate from actual evidence.

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
| Old single-main-block endpoint templates in `plan-creation-engine/endpoint-contracts.ts` | deleted | Plan-first compiler plus selected-distance endpoint exactness own the current contract. |
| `normalizeWorkoutDayKind` fallback to `easy` | deleted | Unsupported canonical workout identity now fails before review instead of being relabeled. |
| Ambiguous/internal source values such as `threshold` | needs mapping or retirement | Map to accepted runner-facing/internal identity, or delete if no current scenario uses it. |
| `editable_default_hr` value wording | needs policy audit | Keep only if represented as non-personal default guidance; rename/collapse if it implies personal HR truth. |
| Deleted compact/internal generated-plan authoring branches | removed from current path | Keep deleted unless a real current product boundary proves a new plan-first adapter is required. |
| Review tokens, import/export, provider comparison, manual validators | keep | Preservation gates until the atom compiler proves equivalent or stronger coverage. |

Current product decisions:

- target date is hard when supplied: endpoint must land on that date; do not silently auto-extend;
- runner-entered target finish time and outcome pace remain goal/review truth;
- AI-authored workout paces are allowed as coach-authored plan guidance and should not be rejected
  merely because there is no fresh formal benchmark;
- short interval targets such as `2 min @ 5:15-5:30/km` may be accepted when runner context says
  the runner previously ran regularly, even if currently returning after a break;
- AI-authored HR zone labels such as `Z1`, `Z2`, `Z5`, or `Z1-Z2` are allowed as Garmin/user-zone
  guidance;
- if runner target finish time or date/horizon is missing, AI may propose outcome/horizon
  assumptions; backend labels them and blocks only hard contradictions or safety failures;
- backend must not provide deterministic target/horizon or deterministic plan-shape product truth
  as a hidden fallback;
- normal v1 may keep the current watch/app execution assumption unless Product changes setup later;
- Marathon Completion may use an exact `42195m` endpoint but must not imply target-time readiness
  when support is weak;
- aggressive, low-support, or no-benchmark goals should warn when a safe honest plan is possible
  and block/unavailable only when calendar/display/persistence safety, endpoint honesty, or wildly
  impossible load/progression cannot be met.

First BACKEND gate:

Build the `runner facts -> one AI-authored full plan draft -> backend parse/atomize/compile ->
calendar preview -> review/confirm -> persistence/readback` seam. Use the attached marathon JSON as
the product specimen for v1 authoring shape. Backend should atomize the draft into Hito structures,
hard-reject only safety/display/persistence failures, warn on softer coaching concerns, and persist
exactly the reviewed compiled draft on confirm.

Minimum validation corpus:

- accepted scenarios: attached 22-week marathon specimen, 10K no benchmark, 21.1K target time,
  42.195K target date/finish time, Custom 15K exact endpoint, returning runner with interval pace
  targets, AI HR-zone guidance, fixed rest days, long-run day placement, structural repeats, tempo,
  intervals, hills, strides, and endpoint week;
- warning scenarios: suboptimal workout identity, rough target guidance, weak benchmark context,
  aggressive but not structurally impossible progression, AI assumptions about horizon/outcome;
- hard-failure scenarios: malformed JSON, missing weeks/days/steps, wrong or contradictory dates,
  fixed rest day violation, unconvertible Repeat/step structure, unsupported raw personal BPM
  claims, medical claims, wildly impossible load/progression, review/confirm checksum drift,
  confirm calling AI again, and persistence/readback shape loss.

## Implementation Phases

### Phase 0 - Architecture Map And First Gate Selection

Owner: ARCHITECT.

Goal: map current code to process kernels and select one safe first gate.

Deliverables:

- compact compiler architecture map in an existing current/source-of-truth doc or active plan;
- first implementation owner and gate;
- explicit non-goals and stop conditions;
- no runtime code changes.

### Phase 1 - AI-Authored Plan-First Compiler V1

Likely owner: BACKEND, with RUNNING COACH doctrine review and QA corpus validation.

Goal: rebuild generated-plan creation so AI authors a rich full-plan draft first, while backend
parses, atomizes, compiles, reviews, confirms, and persists canonical Hito truth.

This is the point where the project transitions from architecture planning into engine work. Do not
start this phase until Phase 0 has produced:

- a source map of the current generated-plan path;
- an inventory of Hito atoms needed for plan/week/day/workout/section/repeat/target/readback;
- a current-flow preservation matrix;
- a deletion list for unused/legacy generated-plan values;
- a validation corpus covering specimen-shaped accepted drafts, warning scenarios, and hard
  failures.

Expected work:

- define the v1 AI draft input shape using the attached specimen as the product example, while
  keeping the internal compiled output in Hito atoms;
- build or consolidate a backend parser/atomizer that converts specimen-style weeks/days/types/
  steps/blocks/targets into Hito atoms;
- compile the atomized draft into reviewable calendar/workout documents;
- require backend validation to check hard safety boundaries, calendar integrity, displayability,
  repeat/step convertibility, unsupported raw BPM claims, medical claims, wildly impossible load,
  and review/confirm exactness;
- allow AI-authored pace targets and HR-zone labels as plan guidance when structurally safe;
- turn softer coaching-quality doubts into warnings/annotations instead of blocking review;
- remove backend deterministic plan-shape, target, or horizon authoring when it becomes duplicate
  truth rather than a safety constraint;
- pause strict internal atom purity validation until after the first useful reviewable AI-authored plan is
  working; keep it as future hardening for import/export/Garmin/readback quality;
- delete old generated-plan compatibility, stale values, and proof branches that no longer map to
  current product truth after the parser/atomizer/compiler replaces them safely;
- preserve review/confirm exactness and current persistence/readback semantics.

Validation:

- generated-plan creation validator;
- plan goal intent validator;
- attached marathon specimen parse/atomize/compile proof;
- Running Coach corpus for 10K, 21.1K, 42.195K, Custom 15K, target-time, returning-runner,
  aggressive-warning, and impossible hard-failure scenarios;
- source proof that compiled generated plans use accepted Hito workout/block/value atoms;
- source proof that backend does not persist untrusted AI draft fields directly;
- source proof that backend does not silently fall back to a deterministic flat plan,
  deterministic finish time, deterministic horizon, or backend-authored workout structure;
- proof that AI-authored pace/HR-zone guidance is labeled as plan guidance and does not become
  provider comparison truth without actual evidence;
- proof that unsupported raw personal BPM claims are blocked without HR-zone truth;
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

ARCHITECT selected the first implementation gate after the product correction.

Current likely first implementation candidates:

1. `AI-authored Plan-First Compiler V1`: selected first implementation gate. Backend accepts a
   useful AI-authored full-plan draft shaped like the specimen, parses/atomizes it into Hito
   structures, shows a reviewable calendar draft, and persists exactly the reviewed draft on
   confirm.
2. `WorkoutDocument` backend/read-model consolidation: next only if engine quality is
   blocked by duplicated workout-document adapters.
3. `CalendarProjection` frontend cleanup: defer unless source proof says UI projection complexity is
   the first blocker after engine contract work.

## Engine Transition Rule

The project moves to engine implementation now. The engine work begins with a narrow v1 gate:
AI-authored full-plan draft -> backend parser/atomizer/compiler -> calendar review -> confirm
persistence.

The first gate must answer these questions:

- Can the attached specimen-style draft be parsed and atomized into Hito structures?
- Which legacy/generated-plan values are unused and safe to delete?
- Which accepted flows must remain green during the rebuild?
- Which hard failures block review, and which softer coaching doubts become warnings?
- Which validation corpus proves the plan is reviewable, persistable, and readback-safe?

The next owner is BACKEND for `AI-authored Plan-First Compiler V1`. Strict Atom hardening,
provider/Garmin precision, and broader plan-quality gates follow only after this reviewable-plan
path works.

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

None for backlog capture. The next implementation gate is selected: BACKEND `AI-authored Plan-First
Compiler V1`.

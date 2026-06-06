# Watch-Executable Workout Targets And Metric Truth Contract

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Clean up runner-facing readback for watch-executable workout targets.

## Stage

FRONTEND implementation / watch-executable target readback cleanup

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Clean up runner-facing readback for watch-executable workout targets after backend Slice 1.

STAGE:
FRONTEND implementation / watch-executable target readback cleanup

CONTEXT:
- Source path: docs/plans/active/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md
- BACKEND Slice 1 is implemented and QA-passed.
- New generated non-rest workouts now resolve through explicit executable modes instead of vague effort-only happy-path output.
- `structure_only_executable` means the workout has numeric duration/distance/repeat/recovery anatomy but no pace/HR target truth.
- Pace targets require execution support plus validated pace truth.
- Target time alone is not pace truth.
- Executable HR targets require personal HR-zone truth.
- Age-estimated HR is advisory/readback only, not executable HR target truth.
- Legacy `effort_only`, `none`, and `unknown` remain readable for older rows/diagnostics, but are not normal new primary structured output.

GOAL:
Make workout detail, calendar/today, export, and first-plan review/readback copy reflect backend executable target truth clearly, without asking runners to infer a structured workout from vague purpose copy when executable segment target data exists.

SCOPE:
- Inspect runner-facing readback surfaces that summarize or display planned workout targets:
  - workout detail
  - Today/home
  - calendar compact readback/tooltips
  - first-plan review copy
  - JSON/Markdown export copy if visible labels still imply effort-only execution
- Render backend-shaped executable mode/segment targets without inventing frontend target rules.
- Prefer existing Hito DS primitives, existing workout structure rows, existing target formatting helpers, and shared display seams before adding new UI.
- Replace or suppress vague "use workout purpose" / cue-only style copy only when canonical executable segment target data exists.
- Preserve legacy rows that only have effort/cue-style data by labelling them honestly instead of pretending they have executable targets.
- Keep backend generation, validation, persistence, DB schema, AI contracts, and review/confirm mutation behavior unchanged.

REQUIREMENTS:
- Do not create local frontend metric truth.
- Do not infer pace from target time.
- Do not display age-estimated HR as a personal executable HR target.
- Do not hide backend correction states behind generic errors.
- Do not add a broad calendar/workout redesign.
- Do not wire manual workout CRUD, watch-provider export, or new persistence.
- Reuse existing shared Hito DS and workout readback components; avoid route-local one-off UI.
- If the true issue is missing backend display data, report the exact backend seam instead of patching symptoms in copy.

VALIDATION:
- Run targeted ESLint for touched frontend/readback files.
- Run `git diff --check`.
- Run `npm run build`.
- Use the built-in Codex browser first for relevant local UI proof when product surfaces changed.
- Prove at least one structure-only executable workout shows numeric executable anatomy instead of vague purpose-only copy.
- Prove at least one pace-target workout still shows pace only when backend target data exists.
- Prove age-estimated HR is not presented as a personal executable HR target.
- Prove legacy effort-only/readback rows remain readable if covered by touched surfaces.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Readback proof
8. Blockers
```

## Owner

ARCHITECT / RUNNING COACH / BACKEND / FRONTEND / QA

## Last Updated

2026-06-06

## Context

Hito has been moving toward rich, structured workouts: saved workouts now carry segment arrays,
metric mode, goal context, workout identity, calendar glyphs, and review/confirm boundaries. The
current implementation already protects against fake pace in many places, but it still treats
effort-only guidance as a valid normal output when execution truth is missing.

That creates a product contradiction:

- the runner expects a structured workout they can execute from the app, watch, or export
- the workout can still fall back to prose such as purpose/cue/hint
- the runner is then forced to interpret the workout manually instead of following clear segment
  targets

This plan defines the architecture contract needed to remove that ambiguity.

## Current State

Known current seams:

- `src/components/OnboardingGate.tsx` defaults `watchAccess` to `unknown` and `guidancePreference`
  to `effort`.
- `src/lib/first-plan-authoring-utils.ts` allows `watchAccess` values:
  `none`, `watch_or_app`, and `unknown`.
- `src/lib/structured-first-plan-onboarding.ts` accepts optional execution mode and currently
  returns bounded correction for primary structured generation when execution support is missing.
- `src/lib/structured-plan-authoring-metrics.ts` allows pace targets only when watch/app plus
  pace/mixed guidance plus recent 5K truth exist; Slice 1 now separates executable modes from
  legacy-readable effort-only states.
- `src/lib/structured-plan-authoring-metrics.ts` may preserve age-estimated HR as advisory/readback
  context only; it is not executable personal HR target truth.
- `src/lib/rich-workout-model.ts` derives `metric_mode` from emitted target keys and can represent
  legacy-readable `effort_only` without making it the normal new structured generation path.
- `src/routes/workout.$date.tsx`, `src/components/TodayHero.tsx`, `src/components/Calendar.tsx`,
  `src/lib/plan-export.ts`, active-plan refresh, and first-plan draft paths all consume the same
  segment/metric truth after generation.

## Architecture Decision

Primary Hito structured training should be watch-executable.

That means:

- every non-rest workout must be decomposed into clear executable segment instructions
- every segment must have numeric duration or distance
- repeat blocks must have repeat count, work target, and recovery target
- pace targets may appear only from backend-approved pace truth
- HR targets may appear only from backend-approved HR truth
- cues, purpose, RPE, and hints may explain intent, but must not substitute for the executable target
  contract when the product is presenting a structured workout

The product should not keep a normal first-plan path where the runner selects no/unknown execution
and Hito silently creates vague effort-only workouts.

## Running Coach Doctrine Checkpoint

Running Coach doctrine is complete for the backend-scope decision:

- primary structured workouts must be executable through watch/app-style instructions
- every non-rest workout needs duration or distance structure
- repeat-oriented workouts need repeat counts plus work/recovery structure
- pace targets require validated pace truth
- personal HR targets require personal HR-zone truth
- cues, purpose, and RPE can explain intent but cannot replace executable targets
- `target_time` alone is not pace truth
- age-estimated HR is not personal HR truth
- `watchAccess: none|unknown`, `effort_only`, and vague notes should stop being normal defaults
  for primary structured plan generation

## Backend Scope Decision

Architect approves **Option A: explicit backend-owned `structure_only_executable` mode**.

This mode preserves the user's requirement for executable workouts without inventing fake pace or
fake HR precision. It is allowed only when the workout can be followed from numeric structure:

- durations
- distances
- repeat counts
- work blocks
- recovery blocks
- run/walk or hike/run timing

`structure_only_executable` is not a copy fallback and not the old `effort_only` mode under a new
name. A structure-only workout must still be watch/app/export executable. It simply does not pretend
to have pace or HR truth.

Rejected option:

- Option B, blocking all primary structured plans unless pace truth or personal HR truth exists, is
  too restrictive for beginner, recovery, long aerobic, trail, ultra, mountain, and timing-first
  workouts where pace/HR can be inappropriate or unavailable.

## Approved Executable Modes

New backend generation should distinguish these modes:

- `pace_executable`
  for workouts with validated pace truth and a workout family that safely supports pace targets.
- `hr_executable`
  for workouts with personal HR-zone truth and a workout family that safely supports HR targets.
- `mixed_metric_executable`
  for workouts with both validated pace truth and personal HR-zone truth.
- `structure_only_executable`
  for workouts with executable numeric structure but no pace/HR target truth.
- `correction_required` or bounded blocked generation state
  when the requested primary structured plan cannot produce any valid executable mode.

Legacy/readback compatibility:

- existing persisted `effort_only` rows remain readable
- rest rows may continue to represent no execution metric targets
- diagnostics may still mention missing target truth
- new primary structured generation should not produce vague effort-only non-rest workouts as the
  normal happy path

## Backend Slice 1 Closeout

Status: implemented and QA-passed on 2026-06-05.

Accepted backend contract:

- new generated non-rest workouts must resolve to explicit executable modes instead of vague
  effort-only happy-path output
- `structure_only_executable` requires numeric duration, distance, repeat, work, or recovery
  anatomy and must never collapse into cue-only prose
- pace targets require an execution surface plus validated pace truth
- target time alone is goal context, not pace truth
- executable HR targets require personal HR-zone truth
- age-estimated HR may remain advisory/readback-only but is not executable HR target truth
- legacy `effort_only`, `none`, and `unknown` remain readable for older rows and diagnostics, but
  are not normal new primary structured output

QA evidence recorded:

- Browser Path Preflight: browser was not used because this was backend/service contract validation.
- Targeted ESLint passed.
- Doctrine validator passed.
- Blueprint valid, invalid, timeout, and partial mocks passed.
- Full envelope mock matrix passed.
- Envelope invalid, timeout, and partial mocks passed.
- Local in-memory target-time half-marathon harness with `watch_or_app` + `mixed`, age present, and
  no recent 5K benchmark produced:
  - `65` non-rest rows as `structure_only_executable`
  - `26` rest rows as `none`
  - `0` structure-only violations
  - `0` single-segment non-rest rows
  - cue-only segment derived `correction_required`
- Repeat-oriented mountain harness proved `uphill_repeats`, `rolling_hills_session`, and
  `controlled_downhill_durability` each had repeat count, time-based repeat unit, time-based
  recovery unit, and `structure_only_executable`.
- Target time alone emitted `0` pace targets without benchmark.
- Age-estimated HR emitted `0` executable HR targets and `0` personal HR targets.
- Blueprint default remained `ai_first_plan_blueprint_v1`.
- Envelope remained internal/non-default.
- `git diff --check` and `npm run build` passed.
- No metric-truth contract issues were found.

Non-slice QA observation:

- Some envelope success traces still report recovery-first violation counts even though the
  canonical validator passes. This is not a blocker for metric-truth Slice 1 and should be triaged
  separately only if envelope trace semantics become a release gate.

Changelog decision:

- Slice 1 is shipped backend contract work and belongs in `docs/history/changelog.md`, with the
  frontend readback cleanup recorded as the next visible follow-up rather than as completed UI.

## Frontend Readback Cleanup Closeout

Status: implemented on 2026-06-06; awaiting focused QA.

Implemented behavior:

- shared target readback now separates executable target entries from support/cue/source copy
- workout detail foregrounds segment duration, distance, repeat, work, recovery, and backend-shaped
  target entries before guidance/cue/hint
- `structure_only_executable` reads as executable structure instead of vague effort-only guidance
- calendar tooltip, Today hero, interval timeline, markdown export, and first-plan review copy no
  longer promote cue-only/default-HR wording as executable target truth
- HR targets render as executable only when `metricMode.hrTargetsAllowed` is true
- age-estimated/default HR remains advisory readback only

Next recommended role:

- QA for focused readback validation on structure-only, pace-target, advisory-HR, and legacy
  effort/readable rows.

## Metric Truth Contract

### Pace Truth

Pace targets are allowed only when all of these are true:

- the runner has an execution surface that can follow pace targets, such as watch, app, or export
- the backend has a recent, validated pace benchmark or future provider-derived equivalent
- the workout family supports pace targets safely
- the target range is broad enough to avoid false precision

Current acceptable source:

- recent 5K time or recent 5K pace collected through the first-plan benchmark contract

Future acceptable sources need their own doctrine before implementation:

- recent provider-derived race/workout evidence
- manually entered verified benchmark history
- explicit coach-reviewed pace profile

Not acceptable as pace truth:

- target race time by itself
- user ambition copy
- AI inference from vague fitness level
- calendar goal labels
- optional comments

### HR Truth

Personal HR targets are allowed only when backend-owned HR-zone truth exists.

Acceptable future source:

- runner-level manual HR zones or deterministic test-derived zones, stored as canonical profile truth

Current age-estimated HR may remain as labelled education or provisional guidance only, but it must
not count as personal watch-target truth for this contract. If the product needs HR-executable plans
before personal zones exist, that requires a separate HR-zone implementation slice.

Not acceptable as HR truth:

- age-estimated max HR presented as personalized precision
- target race time
- effort preference
- AI inference
- user-editable claims without backend validation

## No-Watch Policy

`no watch`, `no app`, and `unknown` execution are not acceptable defaults for the primary structured
first-plan path.

Near-term policy:

- primary setup must ask for an execution surface explicitly
- missing execution support should produce `correction_required`, not a silent effort-only plan
- if a runner cannot provide watch/app/export support, Hito should not pretend the resulting plan is
  watch-executable
- a lightweight non-executable coaching-note mode may be considered later, but it must be a separate
  product path with separate copy and expectations

Backward compatibility:

- existing persisted effort-only plans should continue to render
- old `none` / `unknown` values may remain readable for legacy data and diagnostics
- new first-plan and refresh generation should stop creating new normal-path effort-only structured
  plans once the implementation slice lands

## Families Allowed For Structure-Only Executable

`structure_only_executable` is allowed when numeric structure is sufficient and metric precision
would be fake or inappropriate:

- run/walk adaptation
- recovery jogs and easy support runs
- conservative cutback support runs
- long aerobic runs when target intent is time/distance durability rather than pace specificity
- ultra time-on-feet and hike/run durability
- mountain/trail time-on-feet, controlled descent, and technical-terrain sessions
- hill repeats and climbing steady work when work/recovery durations or distances are explicit and
  pace is intentionally not authoritative
- strides only when stride duration/distance, repeat count, and recovery duration are explicit

Structure-only is allowed for steady support only when the workout remains supportive and not a
race-specific, tempo, threshold, or target-time specificity session.

## Families Not Allowed For Structure-Only Primary Path

These must not be accepted as structure-only in the primary path when their coaching meaning depends
on pace or personal HR truth:

- tempo sessions
- threshold sessions
- race-pace sessions
- road intervals that require pace truth
- unsupported target-time specificity
- advanced/performance cadence that depends on metric truth

If these are requested without metric truth, the backend should either:

- downgrade to an allowed support/structure-only family when the coaching intent remains safe, or
- return a bounded correction/blocking reason when downgrading would misrepresent the workout.

## Correction Behavior

Backend should use explicit correction/blocking behavior instead of vague output:

- missing watch/app/export-style execution support:
  return `correction_required` before primary structured generation
- `watchAccess: none` or `watchAccess: unknown` in new primary structured setup:
  reject as missing execution truth, while preserving legacy readback
- pace requested without validated pace truth:
  do not emit pace targets; downgrade to allowed `structure_only_executable` support work or block
  if the requested workout family requires pace truth
- HR requested without personal HR-zone truth:
  do not emit personal HR targets; age-estimated HR may remain advisory/default copy only and must
  not count as executable HR truth
- target-time requested without benchmark/pace truth:
  treat target time as goal context only; do not emit race-pace or target-pace targets
- AI-authored blueprint/envelope output with unsupported target gaps:
  repair only into allowed executable modes; otherwise reject with bounded validation issue
- active-plan refresh for old effort-only plans:
  preserve legacy rows when not regenerated, but regenerated future rows should use the new
  executable mode contract

## Workout Segment Target Contract

Every non-rest structured workout must include:

- workout title and backend-owned workout identity
- segment array with warm-up/main/cooldown or equivalent run/walk/repeat anatomy
- numeric duration or distance for each executable segment
- at least one backend-approved target channel for each work segment:
  pace range, HR range, or `structure_only_executable` numeric structure
- segment guidance/cue/hint as secondary explanation only
- `metric_mode` that accurately reflects actual emitted target keys
- no raw AI target truth that bypasses backend validation

Repeat or interval blocks must include:

- repeat count
- work duration or distance
- work target
- recovery duration or distance
- recovery target
- clear total structure readable by export/watch/provider adapters

Rest days remain separate:

- rest days have no execution metric targets
- rest copy should not be used to justify vague non-rest workouts

## Source-Of-Truth Ownership

Backend owns:

- execution-surface validation
- pace/HR truth validation
- target eligibility by workout family
- segment target normalization
- generated target keys
- review/confirm safety
- persistence
- export/watch-provider-ready canonical shape

Frontend owns:

- collecting required setup truth
- showing missing-truth corrections clearly
- rendering backend-shaped targets without inventing local target rules
- avoiding misleading effort-only copy when numeric target truth is missing

AI owns:

- optional drafting within backend constraints only
- no direct authority to create unsupported metric targets
- no silent mutation of canonical workout truth

## Proposed Slice Order

1. RUNNING COACH doctrine:
   complete.
2. ARCHITECT backend-scope decision:
   complete; `structure_only_executable` approved.
3. BACKEND implementation slice 1:
   complete; explicit executable modes, first-plan execution-surface correction, no-fake pace/HR
   truth gates, and structure-only numeric execution proof are implemented.
4. BACKEND implementation slice 2:
   partially complete where required by slice 1; generated segment contracts, blueprint metric
   normalization, and envelope metric validation now respect executable modes. Active-plan refresh
   regeneration remains a separate follow-up if product scope requires regenerated future rows.
5. FRONTEND implementation:
   complete; workout detail, Today/calendar readback, export copy, and first-plan review copy now
   explain executable targets without asking runners to guess from vague purpose copy.
6. QA validation:
   prove first-plan, refresh, workout detail, export, and legacy-read compatibility.

## Backend Follow-Up Boundaries

Backend should not patch only the review copy. The implementation must trace the root cause to the
metric-truth resolver and generation contracts.

Backend must evaluate:

- whether `FIRST_PLAN_WATCH_ACCESS_VALUES` should keep `none` / `unknown` only for legacy readback
- whether structured onboarding should require an executable target channel
- whether any route still presents age-estimated HR as executable target truth instead of labelled
  advisory/readback-only context
- whether `effort_only` remains valid only for legacy rows, rest rows, diagnostics, or future
  explicitly non-executable plan mode
- how active-plan refresh handles older effort-only plans
- how blueprint/envelope validators reject unsupported target gaps
- how canonical export can depend on segment targets without route-local fixes

## Backend Implementation Slices

### Slice 1: Execution Mode And Metric Resolver

Owner: BACKEND.

Status: complete on 2026-06-05.

Scope:

- define the canonical executable mode values or equivalent backend-owned representation
- require explicit execution support for primary structured setup/new generation
- keep `none` / `unknown` readable for legacy rows and snapshots
- change metric resolver semantics so structure-only executable is distinct from `effort_only`
- stop treating age-estimated HR as executable personal HR target truth
- ensure target-time alone does not unlock pace targets

Validation:

- fixture with missing execution support returns correction
- fixture with target time but no benchmark emits no pace
- fixture with age only emits no personal HR executable mode
- fixture with allowed run/walk/easy/long structure-only plan remains executable through numeric
  segment structure

Implementation notes:

- `rich-workout-model` now owns canonical executable modes:
  `pace_executable`, `hr_executable`, `mixed_metric_executable`,
  `structure_only_executable`, `correction_required`, plus legacy-readable `effort_only`,
  `none`, and `unknown`.
- `structured-plan-authoring-metrics` no longer treats age-estimated HR as personal HR target truth
  and only unlocks pace targets from execution support plus backend pace benchmark truth.
- Structured first-plan action parsing returns a bounded correction for missing watch/app execution
  support before attempting AI generation.
- Doctrine now asserts structure-only rows have numeric executable segment anatomy and that
  age-estimated HR does not emit HR target ranges.

### Slice 2: Segment Builders And Family Eligibility

Owner: BACKEND.

Status: partially complete on 2026-06-05 for generated first-plan paths.

Scope:

- update segment builders so allowed structure-only families emit duration/distance/repeat/recovery
  structure
- downgrade unsupported target-time specificity into allowed support families only when honest
- block tempo/threshold/race-pace/road-interval specificity without metric truth
- preserve fixed rest days, preferred long-run day, recovery-first sequencing, run/walk adaptation,
  cadence ladder, and supported half/marathon specificity where metric truth exists

Validation:

- allowed structure-only families never collapse into cue-only prose
- forbidden families do not pass as structure-only
- existing no-fake-pace/no-fake-personal-HR checks remain green

Implementation notes:

- Existing generated segment builders already emit numeric duration, distance, repeat, work, and
  recovery structure for the validated structure-only families.
- Unsupported road-specific half/10K specificity without metric truth is downgraded to
  progression/strides-style support rather than tempo, threshold, race pace, or interval work.
- Broader active-plan refresh regeneration policy is intentionally left out of this slice.

### Slice 3: Blueprint / Envelope / Refresh Enforcement

Owner: BACKEND.

Status: partially complete on 2026-06-05 for first-plan blueprint and non-live envelope paths.

Scope:

- update AI blueprint validation and repair to enforce executable modes
- update envelope expansion/validation to align with the same contract
- update active-plan refresh regeneration so future rows follow the new contract while preserved
  legacy rows remain readable
- keep `structured_authoring_v1` from leaking as successful first-plan fallback

Validation:

- blueprint valid/invalid/timeout/partial behavior remains bounded
- envelope mock matrix remains bounded
- active-plan refresh doctrine remains green
- no raw AI target truth bypasses backend validation

Implementation notes:

- Blueprint normalization and metric generation no longer emit default-estimated HR target ranges
  and now stamp explicit executable modes on generated workout rows.
- Non-live envelope expansion validation rejects HR target keys and missing executable modes, while
  preserving the internal/non-default envelope contract.
- Refresh regeneration enforcement remains a later backend slice if/when active-plan refresh scope
  is reopened.

### Slice 4: Frontend / Copy / Readback Cleanup

Owner: FRONTEND after backend.

Status: next bounded follow-up.

Scope:

- render backend corrections for missing executable target truth without inventing frontend target
  rules
- update workout-detail, Today/home, calendar tooltip/readback, first-plan review, and export copy
  so cues explain intent but never tell the runner to infer the workout from purpose when executable
  segment targets exist
- keep Hito DS target/readback primitives aligned with backend fields
- preserve legacy effort/cue-only rows as readable legacy data without presenting them as the new
  structured happy path

Validation:

- browser setup correction proof if setup surfaces change
- workout-detail readback proof for `structure_only_executable`
- calendar/today compact readback proof where those surfaces summarize targets
- export/readable plan proof if export labels are touched
- no misleading no-watch/effort-only happy-path copy when executable target data exists

## Frontend Follow-Up Boundaries

Frontend should not create a route-local workaround such as hiding the watch wording.

Frontend must evaluate:

- setup controls for explicit execution surface and target channel
- inline correction states when target truth is missing
- review modal wording for executable targets
- workout-detail target hierarchy
- Today/calendar compact target readback
- Hito DS states for target chips only after backend target semantics are fixed

## QA Expectations

QA must prove:

- primary setup no longer defaults to unknown/effort-only execution
- missing execution truth returns correction instead of creating a vague structured plan
- target-time alone does not create pace targets
- no personal HR target appears without personal HR-zone truth
- age-estimated HR, if still visible, is labelled as advisory/default and not counted as executable
  HR truth
- pace-only, HR-only, and mixed modes behave according to doctrine
- first-plan, active-plan refresh, workout detail, and export paths consume the same canonical target
  truth
- legacy effort-only persisted rows remain readable without becoming the new generation default

## Explicit Non-Goals

- no code changes in this architecture pass
- no watch/provider integration implementation yet
- no HR-zone schema or guided AeT test implementation in this slice
- no advanced-performance cadence changes
- no frontend redesign before backend target contract is decided
- no product claim that all existing saved workouts are already watch-executable

## Risks / Open Questions

- HR-executable plans probably require prioritizing runner-level HR-zone truth before HR can be a
  first-class target channel.
- Pace truth currently relies on a recent 5K benchmark, which may be too narrow for all goal
  families and experience levels.
- Some low-support beginner plans need run/walk timing-first targets before pace/HR targets are
  available; `structure_only_executable` covers this only when duration/repeat/recovery structure is
  explicit.
- Legacy effort-only rows must remain readable without keeping effort-only generation as the normal
  path.

## Exit Criteria

- Running Coach doctrine defines executable target rules. Complete.
- Backend contract can distinguish executable, blocked, and legacy effort-only states. Complete for
  first-plan/authoring generation paths.
- Frontend setup no longer silently defaults to no/unknown execution for primary structured plans.
- Workout detail and export can rely on canonical target truth.
- QA can prove no fake pace, no fake personal HR, and no vague effort-only new structured plans.
  Backend doctrine proof is complete; browser/frontend proof remains pending frontend work.

## Suggested Next Step

Run the next bounded FRONTEND readback cleanup now that QA accepted the backend contract: make
workout detail, Today/home, calendar, first-plan review, and export copy display executable segment
targets from backend-shaped data, while preserving legacy readability and avoiding any local metric
truth invention.

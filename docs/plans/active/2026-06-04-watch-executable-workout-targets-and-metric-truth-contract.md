# Watch-Executable Workout Targets And Metric Truth Contract

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

BACKEND

## Task

Implement the backend contract for watch-executable workout targets.

## Stage

BACKEND implementation / watch-executable metric truth contract slice 1

## Exact Handoff Prompt

```text
ROLE: BACKEND

TASK:
Implement the backend contract for watch-executable workout targets, starting with explicit executable modes and metric-truth gating.

STAGE:
BACKEND implementation / watch-executable metric truth contract slice 1

CONTEXT:
- Source path: docs/plans/active/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md
- The user rejected effort-only ambiguity for workouts that are supposed to be executable.
- Running Coach doctrine is complete.
- Architect approved `structure_only_executable` as a backend-owned mode for timer/distance/repeat-based workouts where pace/HR truth is unavailable or inappropriate.
- `structure_only_executable` is not `effort_only`; it requires numeric duration/distance/repeat structure and must never collapse into vague prose.
- Pace targets require validated pace truth.
- Personal HR targets require personal HR-zone truth.
- Target time alone is not pace truth.
- Age-estimated HR is not personal HR truth.

GOAL:
Implement the first no-fake-precision backend slice that stops primary structured generation from treating `watchAccess: none|unknown`, `effort_only`, or vague cues as normal executable workout output.

SCOPE:
- Add or model explicit backend executable modes:
  - `pace_executable`
  - `hr_executable`
  - `mixed_metric_executable`
  - `structure_only_executable`
  - blocked/correction state when no executable mode is valid.
- Keep old `effort_only`, `none`, and `unknown` readable for legacy rows/snapshots, but stop using them as normal new primary structured generation output.
- Require explicit watch/app/export-style execution support before primary structured first-plan generation.
- Update metric-mode resolver semantics so `structure_only_executable` is distinct from missing metric truth.
- Update segment builders so allowed structure-only families still emit numeric duration/distance/repeat/recovery targets.
- Update first-plan blueprint/envelope validation and repair so unsupported metric gaps are rejected or downgraded to allowed structure-only families.
- Keep review/confirm, persistence, DB schema, frontend routes, and current public blueprint/envelope defaults unchanged unless a tiny backend view-model/copy field is required.

REQUIREMENTS:
- Do not rename `effort_only` locally and call it done.
- Do not fix only runner-facing copy.
- Do not introduce fake pace from target time alone.
- Do not treat default age-estimated HR as personal HR target truth.
- Do not add broad frontend redesign or watch/provider integration.
- Reuse existing metric resolver, segment builders, blueprint/envelope validation, plan authoring snapshot, and rich workout model seams before adding new code.
- If a file is already large, extract by a real seam instead of adding another responsibility inline.
- Clean up dead/replaced code from failed approaches when safe.

VALIDATION:
- Run targeted ESLint for touched backend files and relevant authoring scripts.
- Run doctrine validator.
- Run first-plan blueprint mock valid/invalid/timeout/partial fixtures.
- Run envelope mock matrix if envelope validation/expansion changes.
- Run at least one fixture that proves structure-only executable output has numeric duration/distance/repeat structure and no fake pace/HR.
- Run at least one fixture that proves unsupported tempo/threshold/race-pace/road-interval specificity blocks or downgrades correctly without vague effort-only output.
- Run `git diff --check`.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Behavior-preservation proof
8. Blockers
```

## Owner

ARCHITECT / RUNNING COACH / BACKEND / FRONTEND / QA

## Last Updated

2026-06-04

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
  reviews missing metric truth as effort/cue-based guidance.
- `src/lib/structured-plan-authoring-metrics.ts` allows pace targets only when watch/app plus
  pace/mixed guidance plus recent 5K truth exist, but it can still emit effort-only workouts.
- `src/lib/structured-plan-authoring-metrics.ts` can emit `default_estimated_hr` from profile age,
  explicitly not personalized HR-zone truth.
- `src/lib/rich-workout-model.ts` derives `metric_mode` from emitted target keys and can represent
  `effort_only`.
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
   add explicit executable modes and tighten first-plan/new-generation metric truth gates.
4. BACKEND implementation slice 2:
   update segment builders, blueprint validation/repair, envelope expansion/validation, and active
   plan refresh regeneration behavior.
5. FRONTEND implementation:
   remove no/unknown execution defaults from primary setup, add missing-truth correction states, and
   update workout detail/review copy to explain executable targets without asking runners to guess.
6. QA validation:
   prove first-plan, refresh, workout detail, export, and legacy-read compatibility.

## Backend Follow-Up Boundaries

Backend should not patch only the review copy. The implementation must trace the root cause to the
metric-truth resolver and generation contracts.

Backend must evaluate:

- whether `FIRST_PLAN_WATCH_ACCESS_VALUES` should keep `none` / `unknown` only for legacy readback
- whether structured onboarding should require an executable target channel
- whether `default_estimated_hr` should be removed from executable target emission and kept as
  labelled advisory readback only
- whether `effort_only` remains valid only for legacy rows, rest rows, diagnostics, or future
  explicitly non-executable plan mode
- how active-plan refresh handles older effort-only plans
- how blueprint/envelope validators reject unsupported target gaps
- how canonical export can depend on segment targets without route-local fixes

## Backend Implementation Slices

### Slice 1: Execution Mode And Metric Resolver

Owner: BACKEND.

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

### Slice 2: Segment Builders And Family Eligibility

Owner: BACKEND.

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

### Slice 3: Blueprint / Envelope / Refresh Enforcement

Owner: BACKEND.

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

### Slice 4: Frontend / Copy / Readback Cleanup

Owner: FRONTEND after backend.

Scope:

- remove primary setup defaults that imply unknown/no execution is normal
- render backend corrections for missing executable target truth
- update workout-detail/review copy so cues explain intent but never tell the runner to infer the
  workout from purpose instead of executable instructions
- keep Hito DS target/readback primitives aligned with backend fields

Validation:

- browser setup correction proof
- workout-detail readback proof
- no misleading no-watch/effort-only happy-path copy

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
- Backend contract can distinguish executable, blocked, and legacy effort-only states.
- Frontend setup no longer silently defaults to no/unknown execution for primary structured plans.
- Workout detail and export can rely on canonical target truth.
- QA can prove no fake pace, no fake personal HR, and no vague effort-only new structured plans.

## Suggested Next Step

Run the BACKEND implementation slice described in the handoff prompt.

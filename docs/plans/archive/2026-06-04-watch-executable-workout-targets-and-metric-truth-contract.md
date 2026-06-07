# Watch-Executable Workout Targets And Metric Truth Contract

## Status

completed

## Type

plan

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Archive the completed watch-executable workout targets and metric truth contract plan.

## Stage

ARCHITECT closeout / archived watch-executable metric truth plan

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Decide whether to archive the watch-executable workout targets and metric truth contract plan or split residual follow-ups.

STAGE:
ARCHITECT decision / watch-executable metric truth plan closeout

CONTEXT:
- Source path: docs/plans/active/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md
- BACKEND Slice 1 is implemented and QA-passed.
- FRONTEND readback cleanup is implemented and QA-passed.
- Generated non-rest workouts now resolve through explicit executable modes instead of vague effort-only happy-path output.
- Frontend readback surfaces render backend-shaped executable target entries and keep cues/focus/RPE/source copy secondary.
- `structure_only_executable` reads as numeric executable anatomy.
- Pace targets require backend target data; target time alone is not pace truth.
- Executable HR targets require personal HR-zone truth; age-estimated/default HR is advisory/readback-only.
- Legacy `effort_only`, `none`, and `unknown` remain readable but do not produce preferred executable target entries.
- Authenticated browser saved-mode UI smoke was blocked by no safe existing session/fixture; source/helper/build QA passed.

GOAL:
Decide whether this plan's core objective is complete enough to archive, or whether residual work should be split into smaller follow-ups instead of keeping this active plan open.

ASSESS:
- whether all release-relevant backend/frontend/QA gates are complete
- whether authenticated saved-mode UI smoke should become a small QA fixture task or remain optional hygiene
- whether active-plan refresh regeneration policy belongs to a separate backend follow-up
- whether HR-zone truth implementation belongs to a separate future plan
- whether this plan should be archived now with residuals split out

REQUIREMENTS:
- Do not change product code.
- Do not rerun QA unless a concrete evidence gap requires it.
- Do not mark HR-zone implementation, watch-provider export, or active-plan refresh regeneration as complete unless separate evidence exists.
- Do not keep this active plan open only for broad future ideas.
- If archiving, update `docs/history/changelog.md` only for shipped implementation not already recorded.

VALIDATION:
- If docs are changed, run targeted `git diff --check`.
- If archive/backlog docs change, include active/archive/backlog/current docs in validation.

OUTPUT:
1. Task
2. Stage
3. Decision
4. Rationale
5. Plan changes
6. Residual follow-ups
7. Validation results
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

Status: implemented and QA-passed on 2026-06-06.

Implemented behavior:

- shared target readback now separates executable target entries from support/cue/source copy
- workout detail foregrounds segment duration, distance, repeat, work, recovery, and backend-shaped
  target entries before guidance/cue/hint
- `structure_only_executable` reads as executable structure instead of vague effort-only guidance
- calendar tooltip, Today hero, interval timeline, markdown export, and first-plan review copy no
  longer promote cue-only/default-HR wording as executable target truth
- HR targets render as executable only when `metricMode.hrTargetsAllowed` is true
- age-estimated/default HR remains advisory readback only

Accepted readback contract:

- frontend renders backend-shaped executable targets
- frontend does not compute metric truth locally
- cues, focus, RPE, purpose, and source copy are secondary support, not executable target truth
- `structure_only_executable` is shown as numeric executable anatomy
- legacy `effort_only`, `none`, and `unknown` modes remain readable but visibly distinct from
  preferred executable targets

QA evidence recorded:

- Browser Path Preflight: built-in Codex browser was used first against `http://127.0.0.1:8082/`.
- Browser loaded but was unauthenticated and showed login, so workout detail/calendar readback
  surfaces were blocked by auth/no safe existing fixture.
- Safari was not used because the blocker was auth/fixture state, not browser tooling.
- Source inspection covered:
  - `src/lib/training.ts`
  - `src/routes/workout.$date.tsx`
  - `src/components/TodayHero.tsx`
  - `src/components/Calendar.tsx`
  - `src/components/IntervalsViz.tsx`
  - `src/lib/plan-export.ts`
  - `src/lib/structured-first-plan-onboarding.ts`
- Targeted ESLint passed.
- `git diff --check` passed.
- `npm run build` passed with existing warnings only.
- Deterministic helper harness proved:
  - `structure_only_executable` reads as executable numeric structure
  - structure-only fixture included `duration: 42`, `repeatCount: 6`, `work: 2 min`, and
    `recovery: 2 min`
  - support cue was preserved separately
  - blocked mode did not expose pace/HR executable entries
  - pace-allowed mode exposed pace readback
  - pace-only mode did not leak HR
  - personal-HR-allowed mode exposed HR range
  - default/age-estimated HR was not treated as executable HR target truth
- Legacy `effort_only`, `none`, and `unknown` remain readable but do not produce preferred
  executable target entries.

Bounded coverage gap:

- Authenticated browser saved-mode UI smoke was blocked by no safe existing session/fixture. This is
  not a blocker for the source/helper/build QA pass, but it can become a small future QA fixture
  task if release confidence requires a real saved-mode visual smoke.

Changelog decision:

- Frontend readback cleanup is shipped implementation and is recorded in `docs/history/changelog.md`
  for 2026-06-06, with the authenticated saved-mode browser smoke gap kept explicit as
  non-blocking QA fixture hygiene.

## Final Closeout And Archive Decision

Decision: archive this plan as complete on 2026-06-06.

Rationale:

- Running Coach doctrine, backend executable-mode contract, frontend readback cleanup, and
  backend/service/source/helper/build QA are complete.
- The current vertical slice achieved its objective: generated structured workouts now avoid vague
  effort-only happy-path output, preserve fake-precision guardrails, and read back executable target
  anatomy without frontend metric invention.
- Remaining work is future/specialized and should not keep this plan active.

Residual follow-ups split to backlog:

- `docs/tasks/backlog/2026-06-06-authenticated-saved-mode-workout-readback-browser-smoke-fixture.md`
- `docs/tasks/backlog/2026-06-06-active-plan-refresh-executable-target-regeneration-policy.md`
- `docs/tasks/backlog/2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md`
- `docs/tasks/backlog/2026-06-06-provider-derived-pace-truth-implementation.md`
- `docs/tasks/backlog/2026-06-06-watch-export-integration-polish.md`

Final changelog status:

- Shipped backend metric-truth contract was recorded in `docs/history/changelog.md` on 2026-06-05.
- Shipped frontend executable target readback cleanup was recorded in `docs/history/changelog.md` on
  2026-06-06.
- No additional final-archive changelog entry is needed because archiving only records project state
  and does not ship new behavior beyond the already recorded implementation.

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
   complete for backend/service/source/helper/build coverage. Authenticated saved-mode UI smoke is
   a non-blocking fixture gap, not a release blocker for this closeout.

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

Status: complete / QA-passed on 2026-06-06.

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

- source/helper proof covered workout detail, calendar/today, interval timeline, export, and
  first-plan review readback seams
- deterministic helper harness proved `structure_only_executable`, pace, personal HR, blocked,
  advisory/default HR, and legacy readable cases
- browser setup/workout-detail saved-mode smoke was blocked by no safe authenticated session/fixture
  and remains a non-blocking QA fixture gap
- no misleading no-watch/effort-only happy-path copy remains in the covered readback helpers when
  executable target data exists

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
- Frontend setup/readback no longer treats no/unknown execution or vague effort-only copy as normal
  executable target truth in the covered source/helper seams. Complete for backend correction and
  frontend readback source coverage.
- Workout detail and export can rely on canonical target truth. Complete for source/helper/build
  coverage.
- QA can prove no fake pace, no fake personal HR, and no vague effort-only new structured plans.
  Complete for backend/service/source/helper/build coverage; authenticated saved-mode browser smoke
  remains a non-blocking fixture gap.

## Suggested Next Step

Run a final ARCHITECT closeout decision: archive this plan if the non-blocking authenticated
saved-mode smoke gap and optional active-plan refresh regeneration policy can move to separate
follow-ups, or split those residuals before archiving.

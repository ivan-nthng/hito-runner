# Advanced Workout Identity Library Enrichment

## Status

backlog

## Type

change_request

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Preserve the Running Coach advanced workout reference matrix as a future backend-owned workout
identity library enrichment track.

## Stage

ARCHITECT backlog / advanced workout identity library intake

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Convert the advanced workout identity reference matrix into a bounded implementation plan.

Stage:
ARCHITECT plan / advanced workout identity library enrichment.

Context:
The Running Coach reference matrix exists at:
docs/tasks/running-coach/2026-06-09-running-plan-engine-advanced-workout-reference-matrix.csv

This backlog item exists because Hito's current deterministic plan engine still lacks granular
advanced workout identities such as:
- long_intervals_5x1500m_500m_jog
- cruise_intervals_4x2k_2min_jog
- half_specific_3x3k_90sec_jog
- ten_k_specific_6x1k_200m_jog
- progression_long_run_last_30min_steady

Goal:
Define exactly which advanced workout identities should be implemented first, which goal families
and runner levels may receive them, and what backend validation must prove before implementation.

Constraints:
- Do not implement code in this pass.
- Do not start before baseline running-plan engine acceptance is confirmed.
- Do not weaken metric-truth guardrails.
- Do not fake pace or personal HR truth.
- Do not give advanced sessions to beginner_new_runner.
- Do not make frontend own workout templates.
- Do not change persistence, provider sync, manual workout CRUD, or active-plan replacement.

Required output:
1. Task
2. Stage
3. Source matrix readiness
4. Selected first identity slice
5. Goal-family and runner-level gates
6. Backend source seams
7. QA golden scenarios
8. What remains forbidden
9. Next recommended role
10. Blockers
```

## Owner

ARCHITECT / RUNNING COACH / BACKEND / QA

## Reported

2026-06-09

## Severity

medium

## User Report

The current running plan engine still does not have enough granular, expressive workout identities.
Future plan enrichment should preserve the Running Coach reference matrix so Hito can later add
stronger workout types once baseline plan creation is already varied, dynamic, understandable, and
safe.

The user specifically wants this captured as future backlog work, not implemented immediately.

## Evidence

Source artifact:

- [Running Plan Engine Advanced Workout Reference Matrix](../running-coach/2026-06-09-running-plan-engine-advanced-workout-reference-matrix.csv)

The matrix identifies stronger workout patterns that are missing or only partially represented in
Hito today, including:

- `long_intervals_5x1500m_500m_jog`
- `cruise_intervals_4x2k_2min_jog`
- `half_specific_3x3k_90sec_jog`
- `ten_k_specific_6x1k_200m_jog`
- `progression_long_run_last_30min_steady`

## Observed Behavior

The current deterministic engine is intentionally narrower and more conservative:

- `intervals` remains too generic for many performance-oriented cases.
- `threshold` is mostly compact and time-based.
- Long runs are improving but still lack enough finish-specific variants.
- Some exact workout shapes can only be approximated through broad identities.
- Hito does not yet own advanced distance-repeat identities such as `5 x 1500m / 500m jog`,
  `3 x 3km / 90 sec jog`, or richer long-run finish structures.

This is not a failure of the current safe baseline. It is a library granularity gap that should be
addressed after the rebuilt plan creation engine can reliably produce normal varied plans.

## Expected Behavior

Hito should eventually support a richer backend-owned workout identity library where advanced
sessions are represented as explicit canonical identities with:

- clear coaching purpose
- allowed goal families
- allowed runner levels
- explicit watch-executable segment anatomy
- load and recovery guardrails
- metric-truth rules
- review/readback copy
- validation fixtures

The goal is not to make every plan harder. The goal is to let the engine choose more specific and
more useful workouts only when the runner profile and goal context make that safe.

## Source Investigation

No existing backlog item was found for these exact advanced workout identity gaps or the newly
created Running Coach CSV matrix.

Nearby related backlog exists for broader future preset-family expansion, but that item does not
capture this specific workout-identity enrichment contract or the safety-gated advanced session
matrix.

## Likely Root Cause

The plan engine has been constrained by broad safe templates and a small identity library. That made
early deterministic generation safer, but it also means later plans can feel less specific because
different training purposes collapse into generic identities such as `intervals`, `threshold`, or
plain long run variants.

The fix should not be prompt-led. It should be a backend-owned source-model expansion with Running
Coach doctrine, deterministic selection rules, and hard validation gates.

## Sequencing Gate

Do not start this implementation until the rebuilt running plan creation engine has reached baseline
product acceptance for normal plan creation:

- plans are varied enough
- plans are dynamic enough
- plans are understandable to runners
- review/preview behavior is stable
- existing safe plan families still pass QA

This task is important, but it should follow the baseline engine rescue rather than distract from it.

## Recommended Fix Direction

When this becomes active, use the reference matrix to define a backend-owned advanced workout
identity library slice:

1. Running Coach confirms the exact allowed identities, safety rules, goal families, and runner
   levels.
2. Architect converts the matrix into a bounded implementation plan and decides which identities are
   in v1 versus future-only.
3. Backend adds canonical identities and segment builders through existing plan-creation source
   seams.
4. Backend updates policy gates so advanced workouts open only for appropriate runner levels and
   goal families.
5. QA validates golden scenarios proving advanced sessions appear only when safe and never leak into
   beginner or low-support paths.

Preferred first implementation candidates:

- `long_intervals_5x1500m_500m_jog`
- `cruise_intervals_4x2k_2min_jog`
- `half_specific_3x3k_90sec_jog`
- `ten_k_specific_6x1k_200m_jog`
- `progression_long_run_last_30min_steady`

## Product Rules To Encode

- Advanced workout identities must be explicit; do not hide them under generic `intervals` or
  `threshold`.
- Watch/app execution is assumed for supported new plan creation, but watch support alone does not
  create pace or personal HR truth.
- No fake precise pace.
- No fake personal HR.
- Hito default HR zones are editable defaults and must not be treated as personal HR-zone truth.
- Advanced identities should generally be blocked for `beginner_new_runner`.
- Heavy performance sessions should be restricted to `runs_a_lot` and
  `professional_competitive`, unless Running Coach explicitly approves a safer lower-level variant.
- Current conservative templates must remain available and should not be replaced prematurely.
- Marathon Base v1 must not become a full aggressive marathon-specific performance family by
  accident.

## What Not To Touch

- Do not implement this before baseline running plan creation is accepted.
- Do not use this to add heavy workouts to every runner.
- Do not weaken metric-truth guardrails.
- Do not add target-time promises.
- Do not rely on OpenAI to author these sessions directly.
- Do not create frontend-only workout templates.
- Do not change persistence, provider sync, manual workout CRUD, or active-plan replacement.
- Do not replace current safe templates until backend selection rules prove the advanced identity is
  appropriate.

## Validation Expectations

Future implementation must prove:

- each new identity has canonical segment anatomy
- each identity has explicit allowed and forbidden goal-family rules
- each identity has explicit allowed and forbidden runner-level rules
- beginner and low-support scenarios do not receive advanced sessions
- no fake pace is emitted without accepted pace truth
- no executable personal HR target is emitted without personal HR-zone truth
- review/readback copy explains the workout purpose without pretending unsupported metric precision
- golden scenarios cover 10K, Half Marathon, Marathon Base, and any future advanced/performance
  track that uses the new identities
- existing safe plan outputs remain valid

## Future Execution Owner

ARCHITECT after baseline running-plan engine acceptance. BACKEND only after Architect converts the
matrix into a bounded implementation slice.

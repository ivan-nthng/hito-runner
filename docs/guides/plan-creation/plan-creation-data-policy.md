# Plan Creation Data Policy

Last updated: 2026-07-14

## Purpose

This policy defines which data Hito needs before it can create a safe generated running plan, which
data may stay optional, what AI may author, and what the backend must derive or validate.

Inventory companion: [Plan Creation Data Inventory](./plan-creation-data-inventory.md).

This is product policy, not implemented behavior. Backend and frontend must still enforce it before
it can be treated as shipped runtime truth.

## Root Policy

Hito should not create a generated plan from a weak request such as "I want to run a marathon" plus
a date. The minimum viable plan context must include the runner's selected distance, schedule,
experience, body context, current running base, availability, constraints, and benchmark status.

Hito may make conservative training assumptions only when the runner explicitly chooses an
`unknown` state. Hito must not silently invent personal facts.

## Mandatory User-Entered Data

These fields should be required before generated plan review:

| Data | Requirement |
| --- | --- |
| Selected distance | Exact meters/km from card or custom input. Cards are shortcuts only. |
| Target date or preparation horizon | One is required. |
| Runner experience level | Required as a bounded choice. |
| Age | Required. |
| Height | Required. |
| Weight | Required. |
| Current weekly running frequency | Required. |
| Baseline long run | Required as distance or duration. |
| Available running days / fixed rest days | Required as explicit weekday choices. |
| Max running days per week | Required. |
| Injury/health constraint state | Required as actual constraints, none, or unknown. |
| Benchmark status | Required as recent result, known pace, or explicit no benchmark. |

Product decision: missing age, height, or weight should block generated plan creation in the normal
flow. If Hito later supports an "unknown body context" path, it must be explicit, conservative, and
visibly labeled before review, and separate from the normal plan path.

## Strongly Recommended Data

These improve plan quality but should not block a conservative plan:

- recent race result;
- recent 5K pace;
- current easy pace range;
- current training load summary;
- preferred long run day;
- terrain context;
- watch/app access;
- preferred guidance mode: pace, heart rate, RPE, or mixed.

If these are missing, Hito should stay effort/RPE-first and conservative.

## Optional Preference Data

These shape the plan but must not override safety:

- target finish time;
- target event name;
- strength/mobility interest;
- treadmill OK;
- notes/comment.

Target finish time is outcome intent. It is not executable pace truth.

## Data AI May Author

AI may author the training structure inside Hito Atom Vocabulary:

- phases;
- week themes;
- microcycle intent;
- workouts;
- sections;
- one-level repeat children;
- cues and guidance;
- conservative assumptions when the runner explicitly selected unknown or omitted optional data.

AI output is an untrusted draft. It is not canonical until backend compilation and review.

## Data AI Must Not Invent

AI must not invent:

- age;
- height;
- weight;
- injury status;
- BMI or body-composition interpretation;
- personal HR zones;
- current fitness benchmark;
- recent race result;
- actual training history;
- executable pace targets without benchmark truth;
- executable HR targets without personal HR-zone truth.

## Backend-Derived Data

Backend should derive and expose assumptions for:

- `distanceMeters` from selected card or custom distance;
- weight-height context;
- age/load risk band;
- baseline capacity band;
- availability/load capacity;
- hard-day budget;
- long-run progression cap;
- weekly load progression cap;
- taper/race-week budget;
- feasibility status;
- runner-facing assumptions shown before confirm.

## Safety / Load Modifier Contract

The v1 product contract should produce one named safety/load band. This is not medical diagnosis
and should not be displayed as a body verdict; it is a neutral training-load safety input.

Inputs:

- age band;
- weight-height context;
- experience level;
- baseline long run;
- weekly sessions;
- injury/constraint state;
- target horizon;
- selected distance;
- benchmark confidence.

Outputs:

| Band | Meaning |
| --- | --- |
| `standard_progression` | Runner context supports normal conservative Hito progression for the selected distance. |
| `conservative_progression` | Plan is allowed, but volume/intensity progression should be reduced. |
| `low_impact_progression` | Plan is allowed only with lower impact, more recovery, less intensity, and slower long-run growth. |
| `extended_horizon_required` | Runner can pursue the goal, but the requested date/horizon is too compressed. |
| `not_reviewable_without_more_data` | Plan should not reach review because mandatory safety context is missing or contradictory. |

Suggested v1 decision logic:

1. If critical data is missing, output `not_reviewable_without_more_data`.
2. If injury/health constraints are unknown, use at most `conservative_progression`.
3. If benchmark is missing, allow plan creation but keep effort/RPE-first and do not emit executable
   pace/HR targets.
4. If age band, weight-height context, baseline, and horizon combine into elevated load risk, use
   `low_impact_progression` or `extended_horizon_required`.
5. If target time is aggressive without benchmark support, warn or block depending on feasibility.
6. Never show BMI, weight category, or body-size judgment to the runner as plan rationale. If a
   weight-height context is used, phrase runner-facing assumptions around load management and
   recovery only.

Backend implementation should keep the exact thresholds in one canonical owner, not scattered
through prompt text, fixtures, and validators.

## UI Policy

- Weak or undefined setup should not create a generated plan.
- Missing mandatory fields should block draft generation and explain exactly what is missing.
- Explicit "no benchmark" is valid, but it forces conservative effort/RPE guidance.
- Missing target time is valid; Hito creates a completion/default plan based on distance, level,
  baseline, and safety band.
- Unsupported target time should produce a warning or block before review.
- Missing age/height/weight blocks normal generated plan creation.
- Any "unknown" path must be explicit and conservative, not silent defaulting.

## Current Implementation Mismatch

Current source does not yet fully enforce this policy:

- `structuredPlanAuthoringInputSchema` still has legacy `goalType` values such as
  `half_marathon`, `marathon`, and `distance_build`.
- `PlanGoalIntent` already supports distance-first normalization, but old goal types still feed
  distance mapping.
- Current generated structured schema includes `age`, but not direct `height` or `weight`.
- The generated-plan request DTO requires age, height, and weight, while the structured authoring
  schema carries only age into provider-facing runner facts.
- Product/current docs indicate age, weight, and height are required in onboarding/profile flows,
  but generated-plan backend policy still needs direct enforcement.
- Date-grid and hard-day budget still contain legacy checks tied to `goal.goalType`.

## Follow-Up Owner

Recommended next owner: `BACKEND`.

The next backend gate should remove canonical legacy `goalType` truth, make distance meters the
generated-plan goal contract, add direct age/height/weight policy enforcement, and implement one
canonical safety/load modifier owner before another live-provider retry.

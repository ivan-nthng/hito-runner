# Plan Creation Data Policy

Last updated: 2026-07-27

## Purpose

This policy defines which data Hito needs before it can create a safe generated running plan, which
data may stay optional, what AI may author, and what the backend must derive or validate.

Inventory companion: [Plan Creation Data Inventory](./plan-creation-data-inventory.md).

## Root Policy

AI is the sole author of plan horizon, density, progression, workout mix, targets, and coaching
guidance. Backend carries explicit runner facts and constraints, requests one self-describing full
provider draft that maps directly to compiler truth, and enforces only
structural/calendar/review/persistence contracts. It does not derive a coaching safety band,
progression cap, feasibility veto, or fallback plan.

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
| Fitness level | Required as an explicit runner selection. |
| Availability ceiling | Optional and independent from fixed rest days. |
| Fixed rest days | Optional and independent from weekly capacity. |
| Benchmark status | Optional; absence must remain absence. |

Product decision: missing age, height, or weight should block generated plan creation in the normal
flow. If Hito later supports an "unknown body context" path, it must be explicit, conservative, and
visibly labeled before review, and separate from the normal plan path.

## Strongly Recommended Data

These improve AI precision but do not grant Backend coaching authority:

- recent race result;
- recent 5K pace;
- current easy pace range;
- current training load summary;
- preferred long run day;
- terrain context;
- watch/app access;
- personal plan context for this request only.

## Optional Preference Data

These shape the plan but must not override safety:

- target finish time;
- target event name;
- strength/mobility interest;
- treadmill OK;
- notes/comment.

Target finish time is outcome intent. It is not executable pace truth.

## Data AI May Author

AI may author the complete training structure inside the canonical provider vocabulary:

- phases;
- week themes;
- microcycle intent;
- workouts;
- sections;
- one-level repeat children;
- cues and guidance;
- numeric pace targets, including honestly marked AI estimates when no benchmark exists;
- named-band BPM targets from the accepted effective HR profile.

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
- a measured benchmark or measured pace when the runner supplied none;
- personal HR truth outside the accepted effective HR profile snapshot.

An absent benchmark does not block numeric pace. It requires `no_benchmark_ai_estimate` provenance
instead of presenting the command as measured. Accepted estimated HR guidance remains estimated
when AI selects it.

## Backend-Derived Data

Backend derives only deterministic technical truth:

- `distanceMeters` from selected card or custom distance;
- exact selected goal identity and date grid;
- optional weekly ceiling and fixed-rest constraints;
- effective HR profile snapshot and its estimated/personal provenance;
- direct provider-response parsing into the compiler draft;
- compiler, signed review, confirm, and persistence exactness.

## UI Policy

- Missing mandatory fields should block draft generation and explain exactly what is missing.
- Missing benchmark is valid; AI may author a numeric estimated pace with explicit provenance.
- Missing target time is valid.
- Missing age/height/weight blocks normal generated plan creation.

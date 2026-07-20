# First-Session Adaptation Doctrine

Date: 2026-07-19
Owner: Running Coach
Status: Implemented and deterministically validated
Plan: None

## Decision

The runner-selected levels `new_to_running` and `beginner` require an AI-authored adaptation
opening. The AI owns the complete bridge and later progression. Backend passes the selected level,
runner constraints, and this doctrine into the single plan-first authoring contract, then compiles
the returned calendar without moving, replacing, shortening, or synthesizing workouts.

This is an AI coaching instruction, not a backend coaching veto. Backend does not infer readiness
from age, height, weight, goal distance, target time, or benchmark performance. It does not add a
long-run classifier or pretend that future adaptation sessions are already completed evidence.

## Selected Levels

| Selected level | AI authoring contract |
| --- | --- |
| `new_to_running` | Author the adaptation opening before the first true long-run or quality role |
| `beginner` | Author the same adaptation opening, regardless of whether a benchmark was supplied |
| `running_regularly` | Author directly from the explicit runner facts; do not apply a beginner downgrade |
| `performance_focused` | Author directly from the explicit runner facts; do not apply a beginner downgrade |

The selected level is runner truth. Benchmarks may inform the AI's later coaching decisions but do
not change the selected level or disable the required opening.

## Adaptation Opening

For `new_to_running` and `beginner`, the first 14 calendar days must:

- contain at least four authored running contacts;
- keep at least one recovery or rest day between contacts;
- use only the runner-facing identities `Run/Walk`, `Easy`, or `Recovery`;
- use conservative, displayable duration and Repeat-child structure;
- use conversational effort cues without invented pace or personal heart-rate targets;
- contain no Long Run, tempo, threshold, interval, hill, progression, steady-finish, or
  selected-distance endpoint workout.

The first true Long Run may appear no earlier than calendar day 15. AI authors its structure and all
later density, progression, phases, targets, and warnings.

Availability is a ceiling, not a demand to fill every available day. Fixed rest days remain fixed.
When the requested target date would compress the adaptation bridge, AI authors a later endpoint and
keeps the selected distance goal visible. Backend preserves that authored horizon and identifies it
as AI-authored provenance.

## Canonical Authoring Context

The plan-first provider context carries:

- the explicit selected fitness level;
- doctrine version `first_session_adaptation_v1`;
- whether the adaptation opening is required;
- the 14-day opening window and four-contact minimum;
- the one-day recovery-spacing minimum;
- the allowed opening identities;
- the earliest first true Long Run day;
- the effort-only opening target policy;
- permission for AI to extend its authored horizon instead of compressing load;
- runner-selected availability, fixed rest days, goal distance, and requested date as facts.

The provider response remains the same canonical AI-authored full-plan draft. There is no beginner
planner, deterministic fallback, post-authoring replacement pass, or second persistence model.

## Backend Boundary

Backend continues to enforce technical integrity only:

- parseable provider response shape;
- valid future calendar dates and declared fixed-rest constraints;
- displayable workout and ordered Repeat-child structure;
- metric-claim, medical-claim, review-token, checksum, and persistence safety;
- exact reviewed-to-confirmed plan truth.

Backend does not reject or rewrite a structurally valid plan because it disagrees with its coaching
content. Prompt and deterministic provider-fixture validation prove this doctrine at the AI
authoring boundary; the compiler remains a preservation boundary rather than a coaching permission
system.

## Validation Evidence

`scripts/plan-authoring-doctrine/first-plan-release-gates.ts` proves:

- `new_to_running` and `beginner` both receive four spaced adaptation contacts in the first 14
  calendar days;
- a beginner with a recent 5K benchmark remains a beginner;
- awkward three-day availability retains the required contacts without violating fixed rest days;
- `Run/Walk` keeps its canonical recovery identity and ordered Repeat children;
- the first true Long Run is no earlier than day 15;
- opening contacts contain no pace or HR targets;
- an AI-authored extended endpoint survives compiler, review, and confirm provenance;
- provider-authored workout dates and titles equal compiled non-rest rows, proving no backend
  substitution;
- `running_regularly` and `performance_focused` retain directly AI-authored openings.

## Coaching Basis

The conservative opening shape is consistent with beginner programmes that use alternating
run/walk contacts, rest between sessions, and gradual progression:

- [NHS Couch to 5K plan](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/couch-to-5k-running-plan/)
- [NHS Couch to 5K overview](https://www.nhs.uk/better-health/get-active/get-running-with-couch-to-5k/)
- [Berkshire Healthcare return-to-running programme](https://www.berkshirehealthcare.nhs.uk/advice/return-to-running-programme)

These sources support the product doctrine; they are not medical clearance rules and do not
authorize backend coaching inference.

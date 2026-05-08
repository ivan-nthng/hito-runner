## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-07

## Implementation Status

- [x] Phase 1 backend slice is implemented:
      one bounded structured authoring input contract now validates server-side in `src/lib/structured-plan-authoring.ts`.
- [x] Phase 2 backend slice is implemented:
      structured input now generates one deterministic canonical `training-plan-v2` plan object and persists it through the existing `plan_cycles` plus `planned_workouts` seam.
- [x] One narrow ops validation path now exists:
      `npm run author-structured-plan -- --email <tester-email> --input-file <absolute-json-path>`.
- [ ] Phase 3 visible onboarding replacement is still deferred:
      `/` remains JSON-first in the current shipped UI.

## Context

The current saved-mode onboarding path is still centered on user-provided JSON:

- `src/components/OnboardingGate.tsx` is the first-plan creation surface
- `src/components/UploadJsonDialog.tsx` is the saved-mode replacement surface
- `src/lib/imported-plan.ts` validates and normalizes legacy and `training-plan-v2` JSON into one canonical saved-plan seam
- `src/lib/training-api.ts` persists the normalized result into `plan_cycles` plus `planned_workouts`

The system now has an important structural advantage:

- JSON already works as a canonical internal authoring and import contract
- saved-mode rendering already depends on normalized persisted plan data, not on raw JSON files at runtime

That means the product can safely change the primary UX without changing the core truth path.

This plan defines one canonical redesign:

- normal users create plans through structured inputs
- the system generates the canonical plan object internally
- JSON remains a canonical internal contract and a secondary advanced import or export path

## Product Decision

### Primary path

The primary plan-creation path should become:

- structured user input
- internal plan generation
- persistence into canonical storage

### Secondary path

JSON should remain:

- the canonical internal plan contract
- a secondary advanced import path
- a future export and debugging artifact
- a tooling or ops path for controlled migrations and QA

### Why this is better for the current product

This is a better fit for Hito Running because:

- normal runners should not need to understand or author a JSON DSL
- the product promise is guidance and orientation, not manual data modeling
- structured input reduces malformed authoring and reduces trust leakage from user-edited raw plan objects
- the service can keep one internal canonical contract while offering a simpler onboarding experience
- future editability becomes safer when the system owns normalization and generation rather than relying on free-form user JSON

Canonical product rule:

- user intent should be collected as structured input
- plan truth should be produced by the system
- raw JSON authoring should no longer be the default expectation for normal users

## Canonical User Input Model

The system should collect one bounded input set that is sufficient to generate a first useful plan without requiring the user to author workout-by-workout structure.

### 1. Goal or event type

Required fields:

- `goal_type`
  examples:
  `build_consistency`
  `5k`
  `10k`
  `half_marathon`
  `marathon`
- `goal_label`
  user-facing summary
- optional `target_event_name`

### 2. Target date or preparation duration

Required fields:

- one of:
  `target_date`
  or
  `preparation_horizon_weeks`

Optional:

- `preparation_horizon_months` as a friendly UX convenience field

Canonical rule:

- the backend should normalize this into one exact scheduling horizon

### 3. Runner profile

Minimum required fields:

- `experience_level`
- `baseline_sessions_per_week`
- `baseline_long_run_km` or `baseline_long_run_duration_min`

Optional:

- `age`
- `recent_injury_recovery_context`
- `preferred_effort_language`

### 4. Current level or recent results

Recommended structured fields:

- `recent_race_results[]`
  optional structured entries with:
  distance
  result_time
  result_date
- `current_easy_pace_range`
  optional
- `current_training_load_summary`
  optional

Rule:

- these are generation inputs
- they are not runtime completion truth

### 5. Available days

Required fields:

- `preferred_running_days[]`
- optional `unavailable_days[]`
- `max_running_days_per_week`

Optional:

- `allow_back_to_back_days`
- `preferred_long_run_day`

### 6. Constraints and injuries

Required support:

- `injury_constraints[]`
- `hard_constraints[]`

Examples:

- no speed work yet
- no running on Wednesdays
- keep long run under 90 minutes for now
- avoid downhill intensity

### 7. Preferences

Recommended fields:

- `preferred_workout_mix`
- `strength_or_mobility_interest`
- `indoor_treadmill_ok`
- `notes`

Canonical input principle:

- keep this model bounded and practical
- do not turn it into a free-form chatbot memory schema

## Canonical System Flow

One canonical path:

1. collect structured user input
2. validate and normalize input server-side
3. generate canonical plan object internally
4. persist canonical plan into Supabase
5. render home, calendar, and workout detail from canonical storage

### Detailed flow

#### Step 1. Collect user input

The UI collects bounded structured fields only.

The form state is temporary UX state, not canonical plan truth.

#### Step 2. Normalize user input

Server-side normalization should:

- validate required fields
- resolve scheduling horizon
- normalize day preferences
- normalize baseline context
- reject impossible or contradictory combinations early

Output:

- one canonical plan-generation input object

#### Step 3. Generate canonical plan object

The generator should produce:

- one internal plan object that conforms to the canonical training-plan template contract
- not a UI-specific object
- not route-specific view models

Canonical output:

- `training-plan-v2` or its direct successor contract as internal truth

#### Step 4. Persist to Supabase

Persist through the existing canonical seam:

- plan-level metadata -> `plan_cycles`
- workout-level normalized rows -> `planned_workouts`
- structured segments -> `planned_workouts.steps jsonb`

#### Step 5. Render from canonical storage

The app continues to render through:

- `TrainingSnapshot`
- `Workout`
- derived week status from `workout_logs`

Routes must not read temporary form state or raw generator output directly.

## Relationship To JSON Contract

### How internal generation maps to the canonical template contract

The internal generator should output the same canonical structured plan contract already defined by the template spec.

That means:

- structured user input is not the plan itself
- it is the input to plan generation
- the generated result becomes the canonical plan object

Canonical relationship:

`structured user input -> normalized generation input -> canonical plan template object -> persisted plan rows`

### When JSON still matters

JSON still matters for:

- canonical internal generation output
- advanced import path
- future export path
- debugging and QA
- deterministic fixture generation
- migration and admin tooling

### Whether `Upload JSON` remains

`Upload JSON` should remain, but only as:

- an advanced path for power users, testers, ops, and migrations
- a saved-mode replacement or import utility
- not the default onboarding expectation

Product copy rule:

- onboarding should no longer point normal users toward JSON first
- JSON should move behind an advanced affordance

## UX Transition

### What the current JSON-first onboarding should evolve into

The current `/` onboarding flow should evolve from:

- `Upload one JSON file`

to:

- `Tell us about your goal, level, availability, and constraints`

Then:

- the system creates the plan internally

### What can remain temporarily

Can remain during transition:

- existing JSON import seam in backend
- existing `Upload JSON` dialog in saved mode
- template download for advanced or ops use
- the same canonical persistence path after normalization

### What should become secondary

Should become secondary:

- JSON upload in first-time onboarding
- JSON-first copy
- expectation that users understand template structure

Recommended temporary posture:

- keep JSON import available behind a smaller “Advanced import” entry
- make structured onboarding the visible default

## Migration Phases

### Phase 0: Freeze the product decision and input contract

Goal:

- approve structured input as the primary plan-authoring path
- freeze the minimum user-input model

Dependency:

- agreement on the bounded input set

Risk:

- expanding the input form into a vague discovery interview before the generator contract is stable

Rollback posture:

- keep current JSON onboarding live until the structured input contract is approved

Next likely role:

- BACKEND

### Phase 1: Define the server-side generation input contract

Goal:

- create one canonical normalized input object for plan generation

Dependency:

- approved user-input model

Risk:

- duplicated truth between client form state and backend generation input

Rollback posture:

- structured onboarding can remain hidden or incomplete while JSON onboarding still works

Next likely role:

- BACKEND

### Phase 2: Implement internal plan generation using the canonical plan template output

Goal:

- generate the canonical plan object internally from normalized user input

Dependency:

- Phase 1 input contract
- existing canonical template contract

Risk:

- overbuilding generator intelligence before basic deterministic plan output is proven

Rollback posture:

- keep first generator narrow and deterministic if needed
- JSON import remains the fallback creation path

Next likely role:

- BACKEND

### Phase 3: Replace first-time onboarding UI with structured input

Goal:

- make structured onboarding the primary visible plan-creation flow

Dependency:

- working server-side generation path

Risk:

- shipping form UX before the generated plan path is reliable

Rollback posture:

- keep `Advanced import` available
- keep JSON-backed replacement flow for admin and fallback use

Next likely role:

- BACKEND

### Phase 4: Reposition JSON as advanced import and internal contract

Goal:

- move JSON out of the default user journey while preserving it as a secondary capability

Dependency:

- structured onboarding in production

Risk:

- hiding JSON too early before generator parity is sufficient

Rollback posture:

- keep saved-mode JSON replacement available in the profile area

Next likely role:

- BACKEND

### Phase 5: Prepare editability on top of generated canonical plans

Goal:

- ensure later plan edits operate on canonical stored plan data, not on reauthored raw JSON

Dependency:

- generated plans already persist through the canonical storage seam

Risk:

- introducing a separate editable truth path outside the canonical plan model

Rollback posture:

- editing remains deferred until provenance and edit-state fields are ready

Next likely role:

- BACKEND

## Anti-overengineering

Explicitly avoid:

- building a huge chatbot onboarding flow first
- overdesigning the generator before the input contract is stable
- duplicating truth between form state and canonical plan state
- inventing a second plan representation for structured onboarding
- bypassing the existing normalization and persistence seam

Canonical simplicity rule:

- one input contract
- one generated plan contract
- one persistence path
- one rendering path

## Risks

- if the structured input model is too thin, the generated plan may feel generic
- if the structured input model is too broad, onboarding becomes burdensome before the generator is mature
- current JSON-first copy and components may create transitional confusion if the advanced path is not clearly demoted
- plan generation must not silently encode runtime fields such as completion or readiness state into the generated plan object
- future editability will be harder if stable source keys are not preserved from the generated plan output

## Exit Criteria

- structured user input is approved as the primary plan-authoring path
- JSON is clearly defined as secondary, advanced, and internal
- one canonical user-input model is defined
- one canonical system flow is defined from input to persisted plan
- the relationship between structured input and the canonical JSON plan contract is explicit
- migration sequencing is clear and backward-safe
- one next implementation role is named

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement the smallest real slice behind this redesign:
define the normalized server-side generation input contract and a narrow first deterministic generator that converts structured onboarding input into the canonical plan template output, while keeping the existing JSON import path available as an advanced fallback.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one canonical product/system plan for moving Hito Running from user-authored JSON onboarding to structured user input with internal canonical plan generation.

### Key Decisions

- Structured user input becomes the primary plan-creation path.
- JSON remains the canonical internal plan contract plus a secondary advanced import/export path.
- The system should generate the canonical plan object internally and then persist it through the existing normalized seam.
- Runtime rendering must continue to read from persisted plan data, not form state or raw JSON.

### Current State

- The app already has a working JSON import seam and canonical saved-mode rendering path.
- `training-plan-v2` is already a supported import contract.
- Onboarding and plan replacement are still visibly centered on JSON today.

### Constraints

- Do not create split truth between structured input and plan storage.
- Do not build a large chatbot flow first.
- Do not remove JSON entirely; demote it to advanced and internal usage.

### Risks / Open Questions

- The structured input model must be strong enough for useful plan generation without becoming too burdensome.
- The first generator should stay narrow and deterministic until the input contract is proven.
- Transitional UX needs to demote JSON clearly without cutting off fallback plan creation too early.

### Next Recommended Role

BACKEND

### Suggested Next Step

Define and implement the normalized server-side generation input contract, then produce canonical plan objects internally from that input while keeping existing JSON import as the fallback path.
```

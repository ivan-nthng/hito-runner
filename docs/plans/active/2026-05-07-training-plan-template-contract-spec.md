## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-07

## Implementation Status

- Current saved-mode imports already normalize both legacy and first-pass `training-plan-v2` inputs into one canonical persisted seam.
- The latest backend slice now preserves canonical segment metadata, bounded target keys, and repeat-based prescription structure inside `planned_workouts.steps jsonb` while keeping current route compatibility.
- Plan-level provenance fields such as stable `plan_id`, source-kind persistence, and richer editability-oriented storage remain intentionally deferred.

## Context

The current service already has one canonical runtime path:

- JSON import
- normalization into persisted `plan_cycles` and `planned_workouts`
- route rendering through `TrainingSnapshot`
- execution truth through `workout_logs`
- derived `week_status`

The current codebase and real examples show two realities:

- the legacy file `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json` is too shallow for long-term plan generation and comparison
- the richer file `/Users/ivan/Downloads/ivan_complete_half_marathon_plan.json` is closer to the needed structure, but it mixes canonical plan truth with runtime state and placeholder noise

This artifact defines one canonical next-generation JSON contract that should act as the ML-readable constructor and DSL for training plans.

## Purpose

### What this contract is for

This template is the canonical source contract for:

- ML-assisted plan generation
- import into the service
- normalization into canonical storage
- rendering on home, calendar, and workout-detail pages
- future workout editability
- future planned-vs-actual comparison

Canonical role:

- the file describes the intended planned training structure
- it is authoring and import truth
- it is not live runtime state

### What this contract is not for

This template must not carry:

- session or auth state
- workout completion state
- week-status state
- sync state
- OCR state
- AI verdict state
- UI-only placeholders
- speculative “connected” capability flags

Core rule:

- the template defines plan intent
- the app and database define runtime execution truth

## Canonical Entities

The minimum canonical entities are:

### 1. Plan metadata

Purpose:

- identify the plan artifact
- define versioning and provenance at authoring level

Minimum fields:

- `schema_version`
- `plan_name`
- `plan_id`
- `source_kind`
- `created_at`

### 2. Goal or event

Purpose:

- describe the training destination the plan is built for

Minimum fields:

- `goal_type`
- `goal_label`
- optional `target_event`

Keep it narrow:

- race and goal description are allowed
- do not build a broad event-management system into the contract

### 3. Runner profile

Purpose:

- provide generation context for the plan

Allowed examples:

- training age or experience label
- recent weekly frequency
- long-run baseline
- optional physical metrics if genuinely used for generation

Rule:

- this is source-facing generation context
- it is not authenticated identity truth

### 4. Plan preferences and constraints

Purpose:

- constrain generation and future editing safely

Examples:

- preferred running days
- unavailable days
- maximum weekly sessions
- no-double-days
- injury or recovery constraints

### 5. Preparation horizon and timeline

Purpose:

- support both short plans and long plans

Required note:

- the same contract must handle a short single-week or few-week plan and a longer multi-month plan
- this should be done through the same ordered `planned_weeks[]` and `planned_workouts[]` model, not through a different schema

Recommended fields:

- `start_date`
- `preparation_horizon_weeks`
- optional `preparation_horizon_months`
- optional `target_date`

Canonical guidance:

- weeks are the most operationally useful unit for app rendering and progression
- months may remain a planning convenience field, but weeks should be the more exact scheduling unit

### 6. Phases, weeks, and days

Purpose:

- preserve training progression structure in a way ML systems and the app can both understand

Recommended structure:

- plan-level phase metadata
- workout-level `phase`
- workout-level `week_number`
- workout-level `date`

Do not require a separate nested day object if workout rows already provide:

- date
- weekday
- week number
- phase

### 7. Workouts

Purpose:

- represent one planned training day as a stable unit for import, rendering, editing, and comparison

Minimum workout fields:

- `workout_id`
- `date`
- `weekday`
- `week_number`
- `phase`
- `workout_type`
- `title`
- optional `summary`
- ordered `segments[]`

### 8. Workout segments

Purpose:

- represent the executable structure of the workout

Segments are the canonical planned-execution unit.

### 9. Segment targets

Purpose:

- describe how each segment should be executed

Examples:

- pace range
- heart-rate range
- effort or intensity
- cadence cue
- recovery cue

### 10. Optional guidance and notes

Purpose:

- preserve useful human-readable instructions without making them the primary truth

Allowed examples:

- fueling note
- recovery note
- optional execution hint

Rule:

- guidance supports rendering and human use
- it must not replace the structured segment DSL

## Segment DSL

### Canonical segment model

Use one canonical ordered `segments[]` array per workout.

Each segment should include:

- `segment_id`
- `segment_type`
- optional `label`
- optional `sequence`
- one primary prescription block
- optional `target`
- optional `guidance`

### Canonical segment types

Recommended allowed `segment_type` values:

- `warmup`
- `main`
- `cooldown`
- `recovery`
- `interval_block`
- `rest`
- `mobility`
- `strength`

Keep this list bounded. Do not turn it into an unbounded taxonomy engine.

### Prescription model

Each segment should use one `prescription` object.

Recommended forms:

- duration-based
- distance-based
- repeat-based interval block
- no-load rest or optional support block

Recommended `prescription.mode` values:

- `time`
- `distance`
- `repeats`
- `none`

### Duration-based segment

Example use:

- warmup for 10 minutes
- main aerobic run for 35 minutes
- cooldown for 5 minutes

Recommended fields:

- `prescription.mode: "time"`
- `prescription.duration_min`

### Distance-based segment

Example use:

- 2 km warmup
- 8 km steady block

Recommended fields:

- `prescription.mode: "distance"`
- `prescription.distance_km`

### Repeats and interval blocks

Interval blocks must use the same schema whether they are time-based or distance-based.

Explicit coexistence rule:

- interval-by-time and interval-by-distance must coexist inside the same `interval_block` schema by using a `repeat_unit.mode`
- do not create separate incompatible interval object families

Recommended shape:

- `segment_type: "interval_block"`
- `prescription.mode: "repeats"`
- `prescription.repeat_count`
- `prescription.repeat_unit`
- optional `prescription.recovery_unit`

Time-based interval example:

- `repeat_unit.mode: "time"`
- `repeat_unit.duration_min: 3`
- `recovery_unit.mode: "time"`
- `recovery_unit.duration_min: 2`

Distance-based interval example:

- `repeat_unit.mode: "distance"`
- `repeat_unit.distance_km: 0.4`
- `recovery_unit.mode: "time"`
- `recovery_unit.duration_min: 2`

This gives one consistent DSL for:

- `6 x 3 min`
- `4 x 400m`
- `5 x 1 km`

### Recovery blocks

Recovery can appear as:

- a standalone segment
- the recovery unit inside an interval block

Use standalone `segment_type: "recovery"` only when recovery is part of the authored workout structure outside repeat units.

### Rest, mobility, and strength

Use:

- `segment_type: "rest"` with `prescription.mode: "none"`
- `segment_type: "mobility"` with optional time prescription
- `segment_type: "strength"` with optional time prescription

Rule:

- optional mobility or strength can exist in the plan
- they must not force a multi-sport abstraction

### Segment targets

Each segment may include `target`.

Recommended target keys:

- `intensity`
- `hr_bpm_range`
- `pace_min_per_km_range`
- `rpe`
- `cadence_spm_range`
- `hint`

Rule:

- use bounded named keys for known target types
- allow a small `extra` object only if a genuinely needed target does not fit the stable core keys

## Plan Truth Vs Runtime State

### Fields that belong in the template

Belong in the template:

- plan identity and metadata
- goal or event metadata
- runner generation context
- constraints and preferences
- plan horizon and schedule
- workouts
- workout segments
- targets
- guidance and notes

### Fields that do not belong in the template

Do not belong in the template:

- `status`
- `completion_state`
- `week_status`
- `garmin_sync_placeholder`
- `strava_sync_placeholder`
- `pain_tracking_placeholder`
- `user_feedback_placeholder`
- `ai_adjustable`
- upload state
- extraction state
- verdict state
- UI tab state
- render state

Explicit rule:

- a plan template says what should be done
- runtime state says what has happened

### Trusted boundary

Canonical separation:

- template truth: planned structure
- persisted runtime truth: logs, completion, derived week status
- AI or external-provider truth: future subsystems, not part of the plan contract

## Rendering Requirements

The template must support normalization into a structure that can render:

### Calendar cells

Must provide enough to render:

- one workout per date
- workout family
- title
- day position

### Home and today card

Must provide enough to render:

- current workout title
- summary
- primary duration or distance cues
- phase and week context

### Workout detail page

Must provide enough to render:

- segment breakdown
- targets
- notes or guidance
- rest-day sparse presentation
- quality or interval structure without reparsing prose

### Week status context

The template must support week grouping through:

- `week_number`
- ordered dates

But it must not encode execution state.

### Future upload or result comparison context

The template must preserve enough planned structure to compare later:

- total duration or distance
- interval prescription
- segment ordering
- targets per segment

## Editability Requirements

The contract and storage mapping must preserve enough structure so later we can:

- edit a workout title or summary
- edit one segment without rewriting the whole plan artifact
- distinguish imported baseline truth from later user-edited truth
- preserve auditability and provenance

Template-side requirements:

- stable `plan_id`
- stable `workout_id`
- stable `segment_id`

Why:

- editing and diffing need stable identifiers
- planned-vs-actual comparison benefits from stable per-workout structure

Storage-side implication:

- imported normalized rows should preserve source keys
- later edits should not destroy the imported baseline snapshot

## Suggested JSON Skeleton

```json
{
  "schema_version": "training-plan-v3",
  "plan_id": "plan_001",
  "plan_name": "Half Marathon Build",
  "source_kind": "ml_generated_template",
  "created_at": "2026-05-07T00:00:00Z",
  "start_date": "2026-05-12",
  "preparation_horizon_weeks": 12,
  "preparation_horizon_months": 3,
  "goal": {
    "goal_type": "half_marathon",
    "goal_label": "Sub-2 half marathon",
    "target_event": {
      "event_name": "Half Marathon",
      "event_date": "2026-08-02"
    }
  },
  "runner_profile": {
    "experience_level": "returning_runner",
    "baseline_sessions_per_week": 4,
    "baseline_long_run_km": 10
  },
  "plan_preferences": {
    "preferred_run_days": ["Tuesday", "Thursday", "Friday", "Sunday"],
    "blocked_days": [],
    "max_running_days_per_week": 4
  },
  "planned_workouts": [
    {
      "workout_id": "wk_001_d1",
      "date": "2026-05-12",
      "weekday": "Tuesday",
      "week_number": 1,
      "phase": "Base",
      "workout_type": "easy",
      "title": "Easy Aerobic Run",
      "summary": "Aerobic endurance run",
      "planned_rpe": 4,
      "guidance": {
        "fueling_note": null,
        "recovery_note": "Keep the next day easy."
      },
      "segments": [
        {
          "segment_id": "seg_001",
          "sequence": 1,
          "segment_type": "warmup",
          "prescription": {
            "mode": "time",
            "duration_min": 10
          },
          "target": {
            "intensity": "easy",
            "hr_bpm_range": "120-135"
          }
        },
        {
          "segment_id": "seg_002",
          "sequence": 2,
          "segment_type": "main",
          "prescription": {
            "mode": "time",
            "duration_min": 35
          },
          "target": {
            "intensity": "easy_aerobic",
            "hr_bpm_range": "135-145",
            "pace_min_per_km_range": "6:50-7:40"
          }
        },
        {
          "segment_id": "seg_003",
          "sequence": 3,
          "segment_type": "cooldown",
          "prescription": {
            "mode": "time",
            "duration_min": 5
          },
          "target": {
            "hint": "Walk if needed"
          }
        }
      ]
    },
    {
      "workout_id": "wk_001_d2",
      "date": "2026-05-15",
      "weekday": "Friday",
      "week_number": 1,
      "phase": "Base",
      "workout_type": "quality",
      "title": "Intervals Session",
      "summary": "Structured intervals",
      "planned_rpe": 7,
      "segments": [
        {
          "segment_id": "seg_101",
          "sequence": 1,
          "segment_type": "warmup",
          "prescription": {
            "mode": "time",
            "duration_min": 15
          }
        },
        {
          "segment_id": "seg_102",
          "sequence": 2,
          "segment_type": "interval_block",
          "prescription": {
            "mode": "repeats",
            "repeat_count": 4,
            "repeat_unit": {
              "mode": "distance",
              "distance_km": 0.4
            },
            "recovery_unit": {
              "mode": "time",
              "duration_min": 2
            }
          },
          "target": {
            "intensity": "5k_effort",
            "hr_bpm_range": "155-168",
            "pace_min_per_km_range": "5:10-5:35"
          }
        },
        {
          "segment_id": "seg_103",
          "sequence": 3,
          "segment_type": "cooldown",
          "prescription": {
            "mode": "time",
            "duration_min": 12
          }
        }
      ]
    }
  ]
}
```

## Mapping Notes

Recommended future mapping:

- plan-level metadata -> `plan_cycles`
- one normalized workout row per planned workout -> `planned_workouts`
- `segments[]` -> `planned_workouts.steps jsonb`

Recommended mapping posture:

- normalized columns for core render and ownership fields
- JSONB for structured segment payload and less-stable metadata

Suggested column mapping direction:

- `plan_id` -> `plan_cycles.source_plan_key`
- `plan_name` -> `plan_cycles.title`
- `start_date` -> `plan_cycles.start_date`
- plan horizon and goal metadata -> additive `plan_cycles` fields or JSONB
- `workout_id` -> `planned_workouts.source_workout_key`
- `date` -> `planned_workouts.workout_date`
- `week_number` -> `planned_workouts.week_number`
- `phase` -> `planned_workouts.phase`
- `workout_type` -> `planned_workouts.workout_type`
- `title` -> `planned_workouts.title`
- `summary` -> additive `planned_workouts.summary`
- `segments[]` -> `planned_workouts.steps`

Minimal future schema expansion that this contract anticipates:

- source keys for plan, workout, and segment provenance
- richer plan metadata storage
- richer workout summary and edit-state fields

## Anti-overengineering

Explicitly avoid:

- runtime UI flags inside the template
- speculative multi-sport abstraction
- OCR or verdict logic inside the plan contract
- an unbounded generic rules engine
- free-form arbitrary nested command languages when a bounded DSL is enough

Canonical principle:

- make the contract expressive enough for generation and rendering
- keep it narrow enough to normalize predictably

## Risks / Open Questions

- current runtime `WorkoutType` enum is narrower than possible future authored labels, so normalization rules must stay bounded
- `preparation_horizon_weeks` is operationally stronger than months, but product may still want months as a user-facing convenience field
- some generation use cases may want richer constraint metadata later, but that should expand through bounded additive fields, not a general policy engine
- optional mobility and strength need to remain within the running-plan scope rather than turning the template into a full training-operating-system schema

## Exit Criteria

- one approved canonical template contract exists for ML generation, import, rendering, and future comparison
- plan truth is clearly separated from runtime or placeholder state
- one segment DSL supports time-based, distance-based, and repeat-based intervals
- the contract supports both short and long plans through the same schema
- the contract maps cleanly to `plan_cycles`, `planned_workouts`, and `steps jsonb`
- one next implementation role is identified

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement the next smallest real slice:
freeze this contract as the supported downloadable template version, align `src/lib/imported-plan.ts` validation and normalization to it, and add only the minimal schema fields needed so imported source keys and richer workout summaries can persist without creating a second runtime path.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one canonical schema/spec artifact for the ML-readable training-plan template that should become the constructor and DSL for future plan generation, import, rendering, and comparison.

### Key Decisions

- The template is planned-structure truth only, not runtime or UI state.
- One ordered `segments[]` DSL should handle time-based, distance-based, and repeat-based intervals.
- Stable `plan_id`, `workout_id`, and `segment_id` are required for editability and comparison.
- The contract should normalize into `plan_cycles`, `planned_workouts`, and `steps jsonb` rather than driving routes directly from raw JSON.

### Current State

- The service already has one canonical runtime seam through `TrainingSnapshot`.
- Legacy and first-pass `training-plan-v2` imports already normalize into the same saved-mode path.
- The richer real draft still contains runtime-noise fields that must not become template truth.

### Constraints

- Do not mix completion or sync state into the template.
- Do not broaden into OCR, verdict, or multi-sport systems.
- Keep one canonical contract path that ML systems and the app can both use.

### Risks / Open Questions

- Future authored workout labels may outgrow the current narrow runtime workout-type enum.
- Weeks versus months must stay consistent without duplicating timeline truth.
- Additional constraint metadata may be requested later and should remain bounded.

### Next Recommended Role

BACKEND

### Suggested Next Step

Freeze the downloadable template on this contract and align validation plus normalization to it with only minimal additive persistence changes.
```

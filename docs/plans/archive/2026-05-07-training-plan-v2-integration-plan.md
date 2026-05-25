Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-07

## Checklist

- [x] Extend the import seam so it validates both legacy `week_1_preview[]` and `training-plan-v2`.
- [x] Normalize both accepted import shapes into the same canonical `plan_cycles` plus `planned_workouts` storage model.
- [x] Persist richer structured segment detail into `planned_workouts.steps jsonb`.
- [x] Tighten stored `steps jsonb` toward the canonical segment DSL with segment metadata, prescription structure, and bounded target keys while preserving current route compatibility.
- [x] Keep saved-mode `/` and `/workout/$date` rendering on the existing `TrainingSnapshot` seam.
- [x] Exclude runtime-only v2 fields such as `status`, `completion_state`, and placeholder booleans from canonical plan truth.
- [ ] Add import-batch provenance or editability-specific schema expansion.
- [ ] Persist richer plan-level metadata beyond what the current routes already use.

## Context

The current service already has one working saved-mode path:

- authenticated user
- `runner_profiles`
- one active `plan_cycle`
- `planned_workouts`
- `workout_logs`
- one normalized `TrainingSnapshot` seam in `src/lib/training.ts`
- server-owned loading and mutation in `src/lib/training-api.ts`

The current import path now supports both accepted shapes:

- `src/lib/imported-plan.ts` validates both `week_1_preview[]` and `training-plan-v2`
- `completeOnboarding` in `src/lib/training-api.ts` accepts either validated import shape and normalizes it through the same persisted seam
- `replaceActivePlanWithImportedInput()` creates one normalized plan shape regardless of source format
- `dbWorkoutToView()` maps persisted rows into the shared route rendering contract without a separate runtime path for v2

The current richer draft at `/Users/ivan/Downloads/ivan_complete_half_marathon_plan.json` proves the next need clearly:

- planned workouts are more detailed than the current legacy import can express
- the richer file mixes real plan truth with runtime states and placeholder capability flags
- the service needs one canonical migration path so saved-mode home, calendar, and workout detail can be driven from richer planned structure without split truth

This plan defines that migration path.

## Scope

In scope:

- integrate `training-plan-v2` into the current service as an importable contract
- keep current saved-mode routes working during migration
- drive saved-mode home and calendar data from normalized `training-plan-v2` imports
- drive workout-detail rendering from normalized `training-plan-v2` imports
- prepare storage semantics for later manual workout and segment edits
- preserve one canonical normalized backend path rather than reading raw JSON directly in routes

Out of scope:

- OCR or screenshot ingestion
- OpenAI extraction
- verdict generation
- multi-sport generalization
- new queueing or workflow subsystems
- replacing the current TanStack Start rendering architecture

Smallest viable first implementation slice:

- accept `training-plan-v2`
- normalize it into the current `plan_cycles` plus `planned_workouts` model without creating split runtime truth
- render the imported richer workouts through the existing `TrainingSnapshot` seam
- keep editing, provenance expansion, and advanced plan preferences as later non-UI follow-up work

## Current Contract

### Current legacy baseline

Observed legacy source file:

- `/Users/ivan/Desktop/corrected_half_marathon_start_2026-05-05.json`

Observed root shape:

- `plan_name`
- `generated_for`
- `start_date`
- `week_1_preview[]`

Observed workout item shape:

- `date`
- `weekday`
- `workout`
- `details`
- `target`

Current architectural behavior:

- `details` and `target` are parsed heuristically
- interval structure is inferred from strings like `6x400m`
- workout type is inferred from display labels like `Easy Run` or `Intervals`
- only one visible week is carried
- no explicit segment ordering, repeat metadata beyond regex parsing, preparation horizon, or structured workout targets exist

### Current runtime contract

The current UI does not read raw JSON. It reads:

- `TrainingSnapshot`
- `Workout`
- `Step[]`

Current rendering truths come from persisted rows normalized into:

- `planMeta`
- `profile`
- `workouts[]`
- `weekStatus`

This invariant should stay intact during migration.

## Target Contract

### Observed richer draft

Observed richer draft file:

- `/Users/ivan/Downloads/ivan_complete_half_marathon_plan.json`

Observed root keys:

- `schema_version`
- `plan_name`
- `generated_for`
- `runner_profile`
- `start_date`
- `preparation_horizon_months`
- `planned_workouts[]`

Observed workout-level keys:

- `workout_id`
- `date`
- `weekday`
- `week_number`
- `phase`
- `status`
- `completion_state`
- `ai_adjustable`
- `garmin_sync_placeholder`
- `strava_sync_placeholder`
- `user_feedback_placeholder`
- `pain_tracking_placeholder`
- `segments`
- `workout_type`
- `title`
- `summary`
- `planned_rpe`
- `estimated_fatigue`
- `recovery_priority`

Observed segment-level keys across the file:

- `segment_type`
- `duration_min`
- `target`
- `repeat_count`
- `work_distance_km`
- `recovery_duration_min`

### Canonical target schema direction

Recommended canonical import contract:

- `schema_version: "training-plan-v2"`
- plan-level metadata
- optional source-facing runner-profile hints
- ordered `planned_workouts[]`
- each workout expressed through structured `segments[]`

Recommended canonical interpretation:

- the file is an import artifact
- the database remains canonical runtime truth
- routes must keep rendering from normalized persisted entities, not directly from raw JSON files

### Plan truth vs runtime or app state

Treat as plan truth:

- `schema_version`
- `plan_name`
- `start_date`
- `preparation_horizon_months`
- `planned_workouts[].workout_id`
- `planned_workouts[].date`
- `planned_workouts[].weekday`
- `planned_workouts[].week_number`
- `planned_workouts[].phase`
- `planned_workouts[].workout_type`
- `planned_workouts[].title`
- `planned_workouts[].summary`
- `planned_workouts[].planned_rpe`
- `planned_workouts[].estimated_fatigue`
- `planned_workouts[].recovery_priority`
- `planned_workouts[].segments[]`

Treat as source-facing but not auth or runtime truth:

- `generated_for`
- `runner_profile`

Treat as not canonical template truth:

- `planned_workouts[].status`
- `planned_workouts[].completion_state`
- `planned_workouts[].ai_adjustable`
- `planned_workouts[].garmin_sync_placeholder`
- `planned_workouts[].strava_sync_placeholder`
- `planned_workouts[].user_feedback_placeholder`
- `planned_workouts[].pain_tracking_placeholder`

Explicit note:

Those fields from `/Users/ivan/Downloads/ivan_complete_half_marathon_plan.json` must not become template truth because they represent runtime state, future capability flags, or speculative product promises. Saved workout result truth must continue to come from `workout_logs`, and week state must continue to be derived in the backend seam.

## Canonical Storage Mapping

### Canonical storage principle

Keep one normalized path:

`training-plan-v2 raw import -> validation -> normalization -> canonical Supabase entities -> TrainingSnapshot -> routes`

Do not let calendar or workout-detail routes read raw import JSON directly.

### Plan-level metadata

Map into `plan_cycles`:

- `plan_name` -> `plan_cycles.title`
- derived plan description -> `plan_cycles.goal_summary`
- `start_date` -> `plan_cycles.start_date`
- last normalized workout date -> `plan_cycles.end_date`

Schema expansion recommended on `plan_cycles`:

- `source_schema_version text not null`
- `origin_import_batch_id uuid null`
- `preparation_horizon_months integer null`
- `goal_metadata jsonb null`
- `plan_preferences jsonb null`
- `revision_number integer not null default 1`
- `supersedes_plan_cycle_id uuid null`

Column vs JSONB guidance:

- keep `title`, `start_date`, `end_date`, `source_schema_version`, `preparation_horizon_months`, `revision_number` as normalized columns
- keep `goal_metadata` and `plan_preferences` as JSONB because they are not fully stabilized and are not currently queried in hot rendering paths

### Goal metadata

Observed richer draft does not contain a separate goal object. For now:

- derive coarse goal summary from `plan_name`
- keep any future richer goal payload in `plan_cycles.goal_metadata jsonb`
- do not block `training-plan-v2` rollout on an invented goal subsystem

### Runner-profile metadata

Observed richer draft includes:

- `runner_profile.age`
- `runner_profile.height_cm`
- `runner_profile.weight_kg`

Canonical decision:

- do not map those fields into `runner_profiles` in the first migration slice
- keep them only in the raw import artifact
- optionally mirror them later into a dedicated health or profile extension only when the product actually uses them

Reason:

- current runtime does not need them for calendar or workout rendering
- they should not silently overwrite user-owned profile truth
- they are source hints, not authenticated identity truth

### Plan preferences

Observed richer draft does not yet include explicit plan-preference keys. Prepare one location now:

- `plan_cycles.plan_preferences jsonb null`

Current rule:

- leave it null in first `training-plan-v2` imports
- do not create a separate preferences table now

### Planned workouts

Map into `planned_workouts`:

- `workout_id` -> `source_workout_key text null`
- `date` -> `workout_date`
- `weekday` -> `weekday`
- `week_number` -> `week_number`
- `phase` -> `phase`
- normalized workout family -> `workout_type`
- `title` -> `title`
- `summary` -> `summary text null`
- normalized structured segments -> `steps jsonb`
- stable route ordering -> `display_order`

Schema expansion recommended on `planned_workouts`:

- `source_workout_key text null`
- `source_schema_version text not null`
- `origin_import_batch_id uuid null`
- `summary text null`
- `planned_rpe smallint null`
- `estimated_fatigue text null`
- `recovery_priority text null`
- `edit_state text not null default 'imported'`
- `source_snapshot jsonb null`
- `updated_at timestamptz not null default now()`

Column vs JSONB guidance:

- keep `workout_date`, `weekday`, `week_number`, `phase`, `workout_type`, `title`, `summary`, `display_order`, `planned_rpe`, `estimated_fatigue`, and `recovery_priority` as normalized columns because they directly support rendering and future filtering
- keep structured segment data in `steps jsonb`
- keep `source_snapshot jsonb` as the normalized imported workout copy used for editability provenance, not as route runtime state

### Workout segments

Canonical mapping direction:

- `training-plan-v2.planned_workouts[].segments[]` normalizes into `planned_workouts.steps jsonb`

Recommended normalized `steps` posture:

- keep one ordered array
- preserve segment ordering explicitly
- preserve `segment_type`
- support duration-based steps
- support distance-based steps
- support repeat-aware interval blocks
- preserve `target` payloads as structured objects

Recommended segment normalization examples:

- `warmup` -> one `step` with `type: "warmup"`
- `main` -> one `step` with `type: "run"` or `type: "main"` and target payload
- `cooldown` -> one `step` with `type: "cooldown"`
- `interval_block` -> one repeat-aware `step` with `repeats`, `work`, and `recovery`
- `rest` -> empty or explicit restful step payload, but the workout still normalizes to `workout_type: "rest"`

### What current schema already supports

Already supports:

- one active plan per user
- per-user plan ownership
- one planned workout row per scheduled day
- `steps jsonb`
- date and week ordering
- backend-derived completion and week status through `workout_logs`

Needs schema expansion:

- import provenance layer
- `source_schema_version`
- richer plan metadata
- richer planned workout metadata
- editability provenance fields
- `updated_at` on `planned_workouts`

## Rendering Integration

### Home and calendar

Home and calendar should continue to render from `TrainingSnapshot`, but that snapshot should now be able to represent a richer imported plan.

Rendering integration rules:

- `getPersistedSnapshot()` remains the server load entry point
- `dbWorkoutToView()` remains the place where persisted rows become route-readable `Workout` objects
- the calendar continues to read normalized `Workout[]`
- `TodayHero` continues to read normalized `Workout` data from the same seam

What changes:

- duration and distance must come from normalized `steps` instead of regex-derived shallow imports
- titles and summaries should reflect richer imported truth
- interval and quality workouts should display from structured repeat-aware steps rather than inferred strings

### Workout detail page

Workout detail should read richer planned structure through the existing `Workout` contract.

Integration rules:

- `Workout.steps` becomes the primary structured source for the detail page
- targets should be derived from structured step targets, not only from `workout.steps[0].target`
- overview rendering should support multi-segment workouts cleanly
- current result-state badges, progress-driven week status, and placeholder upload seam stay intact

### Rest days

Rest day rules remain:

- `workout_type: "rest"` is canonical
- rest days stay sparse on home and workout-detail
- optional segment hints such as mobility notes may be preserved in `steps` or notes, but must not create fake completion affordances

### Interval and quality workouts

Canonical rendering rule:

- interval and quality workouts render from normalized repeat-aware segment structure
- summary text can assist presentation
- the route must not depend on reparsing a human-written summary string

### Week status and completion semantics

Keep current state boundaries:

- completion truth stays in `workout_logs`
- `completed`, `partial`, and `skipped` remain runtime execution states
- week progress remains derived from current persisted logs
- `training-plan-v2` import must not preload fake completion state from source JSON

### Future template download and import UX

Canonical UX during migration:

- `Download template` continues to point to `training-plan-v2`
- upload flow validates legacy and v2 explicitly by schema version or key shape
- the UI should state which contracts are currently accepted
- once v2 is live, the upload flow should move from “future template” messaging to “supported canonical template” messaging

## Editability Preparation

The goal is to prepare the model now without building the editor now.

Storage must support:

- editing a workout title or summary
- editing segment structure
- editing a future planned workout without destroying imported baseline provenance
- telling whether visible workout truth is still imported or has been user-adjusted

Recommended minimum editability semantics:

- `planned_workouts.edit_state`
  recommended values:
  `imported`
  `user_edited`
- `planned_workouts.source_snapshot jsonb`
  stores the normalized imported workout payload before any manual edit
- `planned_workouts.updated_at`
  tracks last mutation
- `planned_workouts.source_workout_key`
  preserves stable source identity across imports and later edits

Canonical edit rule:

- manual edits update the active normalized workout row
- imported baseline provenance remains visible through `source_snapshot` and import-batch linkage
- do not build a separate editor-specific shadow table in this slice

Plan-level revision preparation:

- `plan_cycles.revision_number`
- `plan_cycles.supersedes_plan_cycle_id`

These fields prepare for future plan-wide revisioning, but manual editing does not need to become a full plan-versioning subsystem in the first implementation slice.

## Migration Phases

### Phase 0: Finalize target contract

Goal:

- freeze one canonical `training-plan-v2` import contract and one normalization target

Dependency:

- agreement on which richer-draft fields are plan truth versus runtime-only noise

Risk:

- letting runtime fields like `status` or placeholder booleans leak into template truth

Rollback posture:

- no code migration yet; keep legacy import as the only applied path until the contract is approved

Next likely role:

- BACKEND

### Phase 1: Parser and validator support for v2

Goal:

- extend `src/lib/imported-plan.ts` so it can detect and validate both legacy and `training-plan-v2`

Dependency:

- finalized v2 contract

Risk:

- ambiguous shape detection causing one file to parse incorrectly

Rollback posture:

- keep legacy parser untouched and gate v2 parser behind explicit `schema_version`

Next likely role:

- BACKEND

### Phase 2: Storage and schema expansion

Goal:

- add the minimum Supabase columns and import-batch storage needed for v2 normalization and editability preparation

Dependency:

- v2 validator and approved field mapping

Risk:

- schema churn that introduces fields not used by current rendering or provenance needs

Rollback posture:

- additive migration only
- do not drop or repurpose current columns
- keep current rendering path reading old columns until new import path is verified

Next likely role:

- BACKEND

### Phase 3: Import normalization into canonical entities

Goal:

- normalize validated `training-plan-v2` into `plan_cycles`, `planned_workouts`, and raw import batch storage

Dependency:

- Phase 2 schema

Risk:

- mismatch between segment normalization and current exact-match replacement logic

Rollback posture:

- keep plan replacement transactional
- if v2 normalization or log carry-forward fails, the current active plan remains unchanged

Next likely role:

- BACKEND

### Phase 4: Rendering integration on calendar and workout pages

Goal:

- render v2-imported workouts through current `TrainingSnapshot`, `TodayHero`, `Calendar`, and `workout.$date` without route redesign

Dependency:

- successful v2 import into canonical storage

Risk:

- current UI helpers assuming only one simple step or only current enum labels

Rollback posture:

- preserve route structure and rendering seam
- if richer segment rendering is incomplete, fall back to summary-level rendering while keeping stored normalized data intact

Next likely role:

- BACKEND

### Phase 5: Editability preparation

Goal:

- land provenance and source-snapshot semantics so later workout editing can happen without destructive truth loss

Dependency:

- stable v2 normalized storage rows

Risk:

- overbuilding a revisioning system before there is an actual editing UI

Rollback posture:

- add only provenance and edit-state fields now
- defer UI editing flows and heavy revision orchestration

Next likely role:

- BACKEND

## Backward Compatibility

Legacy support during migration:

- keep `week_1_preview[]` import working as `json-import-v1`
- keep the current legacy validation path in `src/lib/imported-plan.ts`
- keep the current legacy onboarding flow functional while v2 ships behind explicit schema recognition

Canonical compatibility rule:

- both legacy and v2 imports normalize into the same canonical Supabase entities
- routes continue reading only canonical normalized rows
- no route should branch into “legacy rendering” versus “v2 rendering” based on raw file type

Deprecation path:

- v2 becomes the recommended authoring format as soon as import and rendering parity are verified
- legacy import remains accepted for a bounded compatibility window
- legacy should be deprecated only after:
  v2 import is stable
  template download points to v2
  at least one real user path is validated end to end

Avoid split truth:

- do not keep both raw legacy-derived display fields and v2-derived canonical fields as competing render sources
- once normalized, all plan display must come from the same persisted workout shape

## Risks

- richer draft workout types such as `tempo` and `recovery` do not match the current narrow `workout_type` enum, so a normalization decision is required early
- current workout-detail target rendering assumes `workout.steps[0]?.target`, which is too shallow for richer multi-segment plans
- imported runtime fields like `status` and `completion_state` could incorrectly override backend execution truth if not filtered out
- importing richer data without import-batch provenance would make future editability and debugging weaker
- over-expanding schema now could create a heavier model than the current service actually needs

Recommended enum decision:

- keep one canonical normalized workout-family path for the first implementation slice
- map richer labels such as `tempo` into the existing family used for UI grouping if needed
- preserve the original source workout key and source snapshot so display semantics are not lost

## Exit Criteria

- one approved `training-plan-v2` contract exists
- validator support is specified for both legacy and v2
- one canonical mapping into current Supabase entities is defined
- the first implementation slice either uses the existing schema cleanly or documents any deferred schema expansion explicitly
- rendering integration path is defined for home, calendar, and workout-detail
- runtime state and placeholder fields from the richer draft are explicitly excluded from template truth
- editability-preparation semantics are defined without building a full editor subsystem
- one next implementation role is named

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement the smallest viable slice:
done for the first viable backend slice: `training-plan-v2` validation now ships alongside legacy validation, both normalize into the existing canonical rows, and the saved-mode home plus workout-detail routes render from persisted v2-backed data through the unchanged `TrainingSnapshot` seam. Next backend follow-up is additive provenance or editability-oriented schema work only if later slices truly need it.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created one implementation-ready migration plan for integrating `training-plan-v2` into the current Hito Running service without changing the fundamental route or rendering architecture.

### Key Decisions

- Keep one canonical path: raw `training-plan-v2` import normalizes into Supabase, then routes render only from the persisted normalized seam.
- Treat `status`, `completion_state`, and all placeholder booleans in `/Users/ivan/Downloads/ivan_complete_half_marathon_plan.json` as non-canonical runtime noise, not template truth.
- Keep `planned_workouts.steps jsonb` as the main structured workout payload target.
- Prepare editability through provenance and edit-state fields instead of building a full editor or revision subsystem now.

### Current State

- Legacy `week_1_preview[]` import works today and drives the canonical saved-mode plan path.
- The richer draft already exists and contains structured segments, but it is not importable yet.
- Current routes already render through one `TrainingSnapshot` seam and should continue to do so after migration.

### Constraints

- Do not let routes read raw JSON directly.
- Do not introduce split truth between legacy and v2 render paths.
- Keep current service behavior working during migration.
- Do not broaden into OCR, AI verdict, or multi-sport systems now.

### Risks / Open Questions

- Current workout-type enum is narrower than the richer draft labels.
- Current workout-detail helpers still assume shallow target access in places.
- Editability provenance must be added carefully without overbuilding a full revision engine.

### Next Recommended Role

BACKEND

### Suggested Next Step

Start with parser and schema work for `training-plan-v2`, then import one real v2 file into canonical Supabase entities and verify saved-mode rendering through the existing route seam.
```

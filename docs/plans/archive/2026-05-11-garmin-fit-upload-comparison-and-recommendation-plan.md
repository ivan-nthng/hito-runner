Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Garmin FIT Upload, Comparison, And Recommendation Plan

## Status

In progress

## Owner

Backend Agent

## Last Updated

2026-05-11

## Current Slice Note

The current implementation is still intentionally narrower than the full plan:

- upload is live only for Garmin `.fit` and Garmin `.zip` with exactly one FIT activity file
- canonical backend truth now includes `workout_result_assets`, `workout_actual_metrics`, and `workout_comparisons`
- deterministic comparison is now live only for already-trustworthy facts:
  planned workout date vs actual local date
  planned duration vs actual duration
  explicit planned distance vs actual distance when the plan defines one
  structured-step count only when the workout shape is simple enough to compare honestly
- the deterministic comparison payload now also carries richer structured truth for readback:
  explicit signal objects
  honest `missing_actual` and `not_applicable` reasons
  bounded delta/tolerance metadata when the metric supports it
  session-summary facts plus a conservative step-summary block when ordered per-step duration comparison is trustworthy
- workout detail now splits manual `Log result` from a dedicated `Feedback` tab that owns Garmin upload, parsed evidence summary, and deterministic comparison readback
- the first bounded AI interpretation layer is now also live in `Feedback`:
  one `workout_ai_insights` row is generated only from planned workout truth, normalized Garmin actual metrics, deterministic comparison payload, current week context, and next-workout summary
  it stays additive to deterministic comparison instead of replacing it
- screenshot OCR, provider sync, calendar evidence markers, and suggestion-only plan adjustment remain later phases

## Goal

Add one canonical saved-mode capability for a planned workout day:

1. user uploads a Garmin export archive
2. backend extracts and parses the contained FIT file deterministically
3. system normalizes actual workout metrics and workout-step structure
4. system compares planned vs actual deterministically
5. AI explains the workout outcome, recommends how to handle the next workout, and suggests whether the current plan should be adjusted

This plan is intentionally narrower than a general integrations platform. It is for one file-based Garmin ingest path only.

## Why This Scope

The current product already has:

- canonical planned workout truth in `plan_cycles` and `planned_workouts`
- canonical saved workout completion truth in `workout_logs`
- a visible `Upload result` placeholder seam on workout detail
- an existing OpenAI backend seam for text-to-plan authoring

The missing layer is not “AI can parse workouts.” The missing layer is a trustworthy actual-workout pipeline between:

- uploaded evidence
- deterministic parsed result
- deterministic planned-vs-actual comparison
- AI interpretation and recommendation

## Non-Negotiables

- Do not make OpenAI the primary parser for Garmin exports.
- Do not auto-change the plan silently.
- Do not build provider sync, OAuth, or background ingestion in this slice.
- Do not broaden into multi-sport support.
- Do not create a second competing planned workout model.
- Keep one canonical truth path:
  uploaded archive -> extracted FIT -> normalized actual metrics -> deterministic comparison -> AI interpretation

## Current Relevant Truth

Current planned workout truth already supports:

- `planned_workouts.workout_date`
- `planned_workouts.workout_type`
- `planned_workouts.source_workout_type`
- `planned_workouts.planned_rpe`
- `planned_workouts.steps jsonb`

Current saved workout log truth supports:

- `workout_logs.outcome`
- `workout_logs.actual_distance_km`
- `workout_logs.actual_duration_min`
- `workout_logs.rpe`
- `workout_logs.notes`
- `workout_logs.intervals_completed`

Observed Garmin FIT reality from the sample archive:

- archive contains one `*_ACTIVITY.fit`
- file contains session-level metrics
- file contains lap/split data
- file contains GPS points
- file contains HR, cadence, power, temperature
- file contains running dynamics
- file contains `workout` and `workout_step` messages
- laps expose `wkt_step_index`, which creates a viable bridge between planned workout structure and actual workout segments

## Canonical Product Decision

For this feature, AI should be limited to three interpretation jobs:

1. explain the difference between planned and actual
2. recommend how to handle the next workout
3. suggest whether the current plan should be adjusted

AI should not be the primary source of:

- parsed Garmin facts
- numeric workout metrics
- completion classification
- planned-vs-actual difference scoring

This feature also needs one explicit product distinction:

- `completion state`
  the user marked the workout outcome such as `completed`, `partial`, or `skipped`
- `feedback evidence state`
  the user optionally attached a richer result artifact such as a Garmin archive, FIT file, or later a screenshot-based input

Both paths must remain valid:

- completed without a result file
- completed with an attached result file and richer analysis

## Delivery Shape

This should be implemented in four narrow phases:

1. file ingest and deterministic parsing
2. normalized actual metrics and deterministic comparison
3. AI analysis and recommendation output
4. optional plan-adjustment proposal workflow

The first released user value should come from Phases 1 through 3. Phase 4 should remain suggestion-first, not auto-apply.

## Backend Plan

### Phase 1: Ingest And Parse

#### Accepted inputs

Support only these upload formats at first:

- `.zip`
- `.fit`

Defer for later:

- `.tcx`
- `.gpx`
- `.csv`

Reason:

- Garmin archive plus FIT already covers the target use case
- FIT carries the richest structured signal
- broader format support would slow the first trustworthy path

#### Upload pipeline

Canonical backend flow:

1. user uploads archive or FIT for one `planned_workout`
2. backend stores the original asset
3. if the asset is a ZIP, backend extracts it into a temp workspace
4. backend looks for supported files inside the archive
5. backend chooses one primary parse target using this priority:
   `FIT > TCX > GPX > CSV`
6. backend parses the file deterministically
7. backend stores:
   original asset metadata
   parse metadata
   normalized actual metrics
   structured actual step payload

#### Storage direction

Use one narrow evidence table first rather than a broad evidence platform.

Recommended new table:

- `workout_result_assets`

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `workout_log_id uuid null`
- `asset_kind text not null`
  initial values:
  `garmin_zip`
  `garmin_fit`
- `storage_bucket text not null`
- `storage_path text not null`
- `original_file_name text not null`
- `mime_type text not null`
- `file_size_bytes bigint not null`
- `parse_status text not null`
  values:
  `uploaded`
  `extracted`
  `parsed`
  `failed`
- `primary_file_kind text null`
  initial values:
  `fit`
- `primary_file_name text null`
- `parse_error text null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

This keeps the evidence layer small while still handling ZIP uploads honestly.

#### Parser direction

Create one backend parser seam, for example:

- `src/lib/workout-result-import/parse-garmin-fit.ts`

It should output one canonical internal structure such as:

```ts
interface ParsedGarminWorkout {
  sourceKind: "garmin_fit";
  activityStartAt: string;
  activityLocalDate: string | null;
  totalDistanceKm: number | null;
  totalDurationMin: number | null;
  avgHeartRate: number | null;
  maxHeartRate: number | null;
  avgPower: number | null;
  maxPower: number | null;
  totalCalories: number | null;
  totalAscentM: number | null;
  totalDescentM: number | null;
  avgCadence: number | null;
  avgTemperatureC: number | null;
  gpsPointCount: number;
  lapCount: number;
  workoutName: string | null;
  workoutSteps: ParsedActualWorkoutStep[];
  laps: ParsedLap[];
  rawSummary: Json;
}
```

Keep the full GPS trace and high-frequency streams out of the first user-facing product contract unless they are needed for visible comparison. Preserve only what is needed for current product decisions.

### Phase 2: Normalize Actual Metrics And Compare Deterministically

#### Data model

Do not overload `workout_logs` with every Garmin metric. Keep `workout_logs` as the concise saved completion surface and add a new normalized actual table.

Recommended new table:

- `workout_actual_metrics`

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `workout_log_id uuid null`
- `result_asset_id uuid not null`
- `source_kind text not null`
  initial value:
  `garmin_fit`
- `status text not null`
  values:
  `normalized`
  `reviewed`
  `superseded`
- `activity_started_at timestamptz null`
- `activity_local_date date null`
- `actual_duration_min numeric(6,2) null`
- `actual_distance_km numeric(6,2) null`
- `actual_avg_hr integer null`
- `actual_max_hr integer null`
- `actual_avg_power integer null`
- `actual_max_power integer null`
- `actual_avg_cadence integer null`
- `actual_calories integer null`
- `actual_elevation_gain_m integer null`
- `actual_elevation_loss_m integer null`
- `actual_interval_count integer null`
- `actual_step_payload jsonb null`
- `lap_payload jsonb null`
- `summary_payload jsonb not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

#### Relation to `workout_logs`

`workout_logs` should remain the concise visible completion layer.

On successful Garmin normalization:

- fill `actual_distance_km`
- fill `actual_duration_min`
- optionally fill `intervals_completed`
- do not auto-fill `rpe` from FIT unless the Garmin field is mapped safely and intentionally

Completion state should still be computed through deterministic rules, not a blind import.

Recommended first completion rules:

- `completed`
  workout has enough matching evidence for the planned structure and no major shortfall
- `partial`
  workout exists but shows significant shortfall or incomplete structure
- `skipped`
  should never be auto-assigned from a parsed FIT upload alone

#### Deterministic comparison table

Recommended new table:

- `workout_comparisons`

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `actual_metrics_id uuid not null`
- `comparison_status text not null`
  values:
  `complete`
  `partial`
  `insufficient_data`
- `completion_state text not null`
  values:
  `matched`
  `partially_matched`
  `unclear`
- `difference_payload jsonb not null`
- `comparison_confidence numeric(5,4) not null`
- `created_at timestamptz not null default now()`

`difference_payload` should include only deterministic facts such as:

- planned total duration vs actual total duration
- planned total distance vs actual total distance
- planned target type vs observed metric availability
- planned step count vs actual step count
- per-step duration match
- per-step HR target match where available
- missing or uncertain fields

#### Matching logic

Matching order:

1. same `planned_workout_id`
2. verify uploaded activity local date is plausibly aligned with `planned_workout.workout_date`
3. compare planned workout structure in `steps`
4. compare actual workout steps from FIT `workout_step` plus lap grouping via `wkt_step_index`
5. fallback to total workout comparison if step-level compare is incomplete

Important rule:

If step-level matching is weak but session-level matching is strong, keep the comparison valid but lower confidence. Do not invent exact step success.

Route-facing derived booleans should make this distinction easy to render:

- `hasCompletionLog`
- `hasResultAsset`
- `hasNormalizedActualMetrics`
- `hasAiInsight`

### Phase 3: AI Analysis And Recommendation

#### AI input boundary

OpenAI should receive:

- planned workout summary
- normalized actual metrics
- deterministic comparison payload
- current week context
- next scheduled workout summary

OpenAI should not receive raw FIT binary and should not be asked to infer the base metrics from scratch in this path.

Recommended AI input contract:

```ts
interface WorkoutAnalysisPromptInput {
  plannedWorkout: Json;
  actualMetrics: Json;
  comparison: Json;
  currentWeekContext: Json;
  nextWorkout: Json | null;
}
```

#### AI output boundary

Recommended new table:

- `workout_ai_insights`

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `actual_metrics_id uuid not null`
- `comparison_id uuid not null`
- `model text not null`
- `status text not null`
  values:
  `draft`
  `final`
  `superseded`
- `analysis_summary text not null`
- `difference_explanation text not null`
- `next_workout_recommendation text not null`
- `plan_adjustment_suggestion text null`
- `recommendation_level text not null`
  values:
  `keep`
  `soft_adjust`
  `review`
- `confidence numeric(5,4) not null`
- `created_at timestamptz not null default now()`

Recommended AI response contract:

```ts
interface WorkoutAnalysisOutput {
  analysisSummary: string;
  differenceExplanation: string;
  nextWorkoutRecommendation: string;
  planAdjustmentSuggestion: string | null;
  recommendationLevel: "keep" | "soft_adjust" | "review";
  confidence: number;
  cautionFlags: string[];
}
```

#### Safety rules

- `keep`
  next workout can proceed as planned
- `soft_adjust`
  recommendation may suggest a lighter or simpler next workout
- `review`
  recommendation suggests plan review, but does not auto-apply changes

The first release must not let AI overwrite `planned_workouts` directly.

### Phase 4: Plan Adjustment Proposal Workflow

This phase is recommendation-first only.

If AI or deterministic rules indicate meaningful mismatch:

- show a suggestion
- optionally offer `Apply suggested adjustment later`
- do not mutate the active plan automatically

If product later wants one-click plan updates, that should be a separate plan after the current suggestion workflow is stable.

## Frontend Plan

### Entry point

Use the existing `Upload result` seam in [`src/components/CompletionPanel.tsx`](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/CompletionPanel.tsx:327).

Replace the placeholder with a real upload flow for saved mode only.

### Core workout-detail information architecture

Workout detail should split the current completion area into three clear surfaces:

1. `Overview`
2. `Log result`
3. `Feedback`

`Log result` remains the simple workout outcome surface:

- mark `completed`, `partial`, or `skipped`
- optional simple notes
- optional simple RPE

`Feedback` becomes the richer evidence and analysis surface:

- upload Garmin ZIP or FIT now
- support screenshot input later as a separate follow-on path
- show upload or parse status
- show deterministic actual summary
- show deterministic planned-vs-actual comparison
- show AI analysis and recommendation

This keeps the basic completion path fast while giving richer post-run analysis one obvious place to live.

### Phase 1 UX

Add one lightweight upload surface inside the `Feedback` tab:

- file picker accepting `.zip,.fit`
- short explanation:
  `Upload a Garmin export archive or FIT file for this workout.`
- clear note:
  `We compare the file against this planned workout.`

Required states:

- idle
- uploading
- parsing
- parse failed
- parsed successfully

Even before file upload exists, `Feedback` should still be a real surface with honest empty-state copy:

- result file upload is optional
- simple workout completion still works without a file
- richer analysis appears only after evidence is attached

### Phase 2 UX

After parse success, show a deterministic summary block:

- activity date and time
- duration
- distance
- avg HR
- avg power when available
- lap count
- step count when available

Then show a planned-vs-actual compare block:

- planned duration vs actual duration
- planned distance vs actual distance
- planned targets vs actual signals
- confidence label

Required comparison states:

- strong match
- partial match
- insufficient data

Also show one visible evidence-status block:

- `No feedback file yet`
- `Feedback file uploaded`
- `Analysis ready`
- `Analysis needs review`

### Phase 3 UX

Add one AI interpretation block below the deterministic summary:

- `Training analysis`
- `Recommendation for next workout`
- `Plan adjustment suggestion`

Important copy rule:

The deterministic facts should remain visibly separate from the AI interpretation.

The user should always be able to tell:

- what was measured
- what was inferred
- what was recommended

### Frontend information architecture

Inside `Feedback`, workout detail should show these sections in this order:

1. upload/import status
2. parsed actual result summary
3. deterministic planned-vs-actual comparison
4. AI analysis and recommendation

Do not bury the deterministic comparison below the AI text.

`Log result` should remain separate and should not be buried under the richer import flow.

### Calendar state refinement for result evidence

Calendar needs to distinguish:

- workout completion
- richer feedback evidence attached to that workout

Completion remains the primary state.

Feedback evidence is a secondary enhancement signal only.

First-release calendar rules:

- completed without result file
  show the existing completion treatment only
- completed with result file
  show the existing completion treatment plus one small secondary green data or graph marker
- partial or skipped without result file
  do not show the richer-evidence marker
- failed upload or failed parse
  do not show the richer-evidence marker

The richer-evidence marker should not replace the primary completion signal. It should behave like a compact attached-proof indicator.

### Calendar loader requirements

The calendar route should eventually know, per workout day:

- `status`
- `hasResultAsset`
- `hasAiInsight`

For the first release, the calendar only needs `hasResultAsset` in addition to the existing completion state.

### Deferred frontend work

Do not build now:

- Garmin account connection
- upload history browser
- map replay
- full charting for pace/HR traces
- multi-file comparison UI

## API And Server Actions

Recommended first server actions:

- `uploadWorkoutResultAsset(plannedWorkoutId, file)`
- `parseWorkoutResultAsset(assetId)`
- `generateWorkoutComparison(plannedWorkoutId, actualMetricsId)`
- `generateWorkoutAiInsight(plannedWorkoutId, comparisonId)`

Recommended first loaders:

- extend workout route data to include:
  latest asset
  latest normalized actual metrics
  latest comparison
  latest AI insight
- extend calendar or home route day data to include:
  `hasResultAsset`

## Suggested File Organization

Recommended new backend modules:

- `src/lib/workout-result-import/archive.ts`
- `src/lib/workout-result-import/parse-garmin-fit.ts`
- `src/lib/workout-result-import/normalize-actual-metrics.ts`
- `src/lib/workout-result-import/compare-workout-result.ts`
- `src/lib/workout-result-import/generate-ai-insight.ts`
- `src/lib/workout-result-import/types.ts`

Recommended frontend modules:

- `src/components/WorkoutResultUpload.tsx`
- `src/components/WorkoutActualSummary.tsx`
- `src/components/WorkoutComparisonSummary.tsx`
- `src/components/WorkoutAiInsight.tsx`

## Validation Plan

### Backend validation

- parse the provided Garmin sample archive successfully
- confirm ZIP upload with one FIT file chooses FIT correctly
- reject ZIP with no supported file
- reject oversized file
- reject malformed FIT cleanly
- confirm normalized actual metrics write correctly
- confirm deterministic comparison output is stable across repeated runs

### Product validation

- upload archive from workout detail
- complete a workout without uploading any file
- see the separate `Feedback` tab or section remain available but optional
- see parsed actual summary
- see deterministic comparison
- see AI analysis
- see calendar distinguish a completed workout with attached result evidence from a completed workout without one
- confirm recommendation does not auto-edit the plan

### Comparison validation

Test these workout shapes:

- simple easy run
- long run
- time-based 3-step workout
- interval workout with repeats
- partial completion
- activity on adjacent local date near midnight

## Risks

- Garmin FIT fields are rich but device-specific, so some metrics may vary across devices
- local date matching can be wrong if timezone handling is sloppy
- overconfident AI wording could overstate weak comparison evidence
- trying to support FIT, TCX, GPX, screenshot OCR, and sync together would bloat the first slice

## Recommended Sequencing

1. Add Supabase schema for result asset, actual metrics, comparison, and AI insight tables.
2. Build ZIP and FIT ingest plus deterministic parser seam.
3. Normalize parsed data into canonical actual metrics.
4. Build deterministic planned-vs-actual comparison.
5. Split workout detail into `Log result` and `Feedback`, then replace the `Upload result` placeholder with a real upload plus deterministic summary UI.
6. Add AI interpretation only after deterministic comparison is stored and visible.
7. Add calendar result-evidence marker after `hasResultAsset` is available in route data.
8. Add suggestion-only plan-adjustment output after next-workout recommendation is stable.

## Checklist

- [x] confirm the narrow first release is `ZIP/FIT only`
- [x] add additive Supabase migration for result asset and actual metrics tables
- [x] implement archive extraction and primary file selection
- [x] implement deterministic Garmin FIT parser seam
- [x] implement normalization from parsed FIT into canonical actual metrics
- [x] wire the first saved-mode upload flow into the existing `Log result` surface with parsed-summary readback
- [x] fix Safari file-picker compatibility by validating `.fit` and `.zip` after selection instead of relying on native MIME/UTI filtering
- [x] align the visible upload surface so FIT/ZIP reads as live and screenshot remains clearly later-only
- [x] implement deterministic planned-vs-actual comparison
- [x] define confidence and partial-match rules
- [x] enrich deterministic comparison payload/readback with structured signal truth before AI interpretation
- [x] replace plain-text comparison readback with a factual signal-by-signal layout in the current `Log result` surface
- [x] split workout detail into `Log result` and `Feedback`
- [x] wire upload flow into workout detail `Feedback` surface in saved mode
- [x] show deterministic actual summary and comparison UI inside the current `Log result` surface
- [ ] expose `hasResultAsset` to calendar and render a secondary evidence marker
- [x] define and implement OpenAI input/output contract for bounded workout analysis and recommendation
- [x] show AI analysis and next workout recommendation separately from deterministic facts
- [ ] verify no path auto-edits the plan
- [x] validate the provided sample archive end to end

## Exit Criteria

- A saved-mode user can upload a Garmin ZIP or FIT file for one planned workout.
- A saved-mode user can still complete a workout without any attached result file.
- The richer upload and analysis flow lives in a dedicated `Feedback` surface, separate from simple completion logging.
- The backend deterministically parses and normalizes the workout result.
- The system stores a deterministic planned-vs-actual comparison for that workout.
- The UI shows the deterministic comparison clearly before any AI interpretation.
- The system stores one bounded AI interpretation linked to the deterministic comparison and reads it back separately inside `Feedback`.
- The calendar can distinguish completed workouts that include richer feedback evidence from completed workouts that do not.
- OpenAI generates workout analysis and next-workout guidance from structured comparison context, not raw binary upload.
- Any plan-adjustment output is suggestion-only and never silently mutates the active plan.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the implementation-ready plan for Garmin archive upload, deterministic FIT parsing, planned-vs-actual comparison, and AI recommendation generation, keeping AI strictly on top of structured comparison rather than raw extraction.

### Key Decisions

- Narrow the first release to `.zip` and `.fit` instead of broad format support.
- Keep `workout_logs` as the concise completion surface and add separate normalized actual/comparison/AI insight tables.
- Keep deterministic comparison as factual truth and AI as interpretation only.
- Keep any plan adjustment suggestion-only in the first implementation.

### Current State

- The current app already has canonical planned workout storage, a compact workout log model, and an `Upload result` placeholder in workout detail.
- A Garmin FIT sample archive has been inspected and confirmed to contain enough structured session, lap, and workout-step data for a trustworthy first compare pipeline.

### Constraints

- Do not broaden this slice into provider sync, multi-sport ingestion, or auto-adaptive plan rewriting.
- Do not let OpenAI become the primary source of numeric workout truth.
- Do not silently mutate `planned_workouts` from imported result analysis.

### Risks / Open Questions

- Device-specific FIT field variability may require a few parser guards.
- The exact threshold rules for `completed` vs `partial` need deterministic product tuning.
- The app may later need a dedicated reviewed/manual-correction path, but it should not be required for the first release.

### Next Recommended Role

BACKEND

### Suggested Next Step

Draft the additive Supabase migration and backend parser/normalization/comparison seams for the `ZIP/FIT only` slice, using the inspected Garmin sample as the first validation fixture.
```

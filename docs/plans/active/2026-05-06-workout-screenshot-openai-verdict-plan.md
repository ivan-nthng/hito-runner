# Workout Screenshot OpenAI Verdict Plan

## Status

Active

## Owner

Architect Agent

## Last Updated

2026-05-06

## Context

The current product already has a canonical saved-mode path for:

- authenticated runner identity
- `runner_profiles`
- `plan_cycles`
- `planned_workouts`
- `workout_logs`
- backend-derived `week_status`

The current onboarding flow also imports JSON into normalized planned workouts, and the current workout detail route already assumes that one planned workout day can contain structured `steps`, duration or distance expectations, and lightweight target payloads.

That makes one boundary clear:

- planned workout structure is becoming the canonical source of truth
- actual workout evidence, extraction, comparison, and verdict generation do not exist yet as first-class backend entities

This plan defines the future architecture for one narrow capability:

- one planned workout day
- screenshot upload from Strava or Garmin Connect
- OpenAI extraction of structured workout result data
- deterministic planned-vs-actual comparison
- AI-assisted verdict and insight generation
- canonical storage of the entire chain in Supabase

This is a future-feature plan only. It is not a build-now implementation task.

## Scope

In scope:

- one planned workout day at a time
- detailed planned structure with stages, durations or distances, and targets
- screenshot evidence upload from Strava or Garmin Connect
- storage of the uploaded evidence
- OpenAI extraction of workout result fields from the screenshot
- normalization of extracted values into canonical actual metrics
- deterministic comparison against the planned workout
- verdict and actionable insight generation
- Supabase persistence for all major states in the chain

Out of scope:

- multi-sport generalization
- live provider API sync
- OCR ingestion outside this screenshot workflow
- generalized AI coaching engine
- adaptive plan rewriting
- full moderation platform
- export pipelines

## Canonical Pipeline

Canonical pipeline for this feature:

1. Planned workout exists
   One canonical `planned_workout` row already exists and includes stable normalized plan structure.

2. User uploads screenshot evidence
   The user attaches one or more screenshots for that specific planned workout from Strava or Garmin Connect.

3. Evidence is stored
   The original screenshot asset is stored in canonical evidence storage and linked to the target planned workout.

4. Extraction request is created
   One extraction attempt record is created for the evidence asset and queued for processing.

5. OpenAI extracts structured fields
   OpenAI receives the screenshot plus constrained extraction instructions and returns provisional structured fields.

6. Extraction is normalized
   The system maps provisional extracted fields into canonical actual workout metrics and interval or stage outcomes.

7. Planned-vs-actual comparison runs
   Deterministic comparison logic computes differences between planned structure and normalized actual metrics.

8. Verdict and insights are generated
   AI may generate verdict wording and actionable insights using the deterministic comparison result plus normalized workout context.

9. Trusted user-visible result is stored
   The user sees only the stored canonical result states:
   evidence received
   extraction success or uncertainty
   normalized actual metrics
   comparison result
   verdict and insight output with confidence state

10. Review and retry remain possible
   Low-confidence or mismatched cases can be retried or manually reviewed without rewriting the original evidence.

Pipeline invariant:

- the product must never jump directly from screenshot upload to user-visible AI verdict without passing through stored evidence, structured extraction, normalized metrics, and deterministic comparison.

## Supabase Data Model Direction

This feature should extend the canonical training data path already planned for:

- `plan_cycles`
- `planned_workouts`
- `plan_import_batches`

It should not introduce a second competing workout-truth model.

### A. Planned workout detail and stages

Current direction:

- keep `planned_workouts` as the canonical planned workout row
- keep `planned_workouts.steps jsonb` as the initial normalized workout-structure payload

Prerequisite expansion for this feature:

- `planned_workouts.steps` must become stable enough to represent:
  warmup
  main work
  recovery segments
  cooldown
  target pace
  target HR
  target duration
  target distance
  repeats where relevant

Do not create separate relational stage tables yet unless query pressure proves that `steps jsonb` is no longer enough.

### B. `workout_evidence_assets`

Role:

- canonical record for uploaded screenshot evidence tied to one planned workout

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `workout_log_id uuid null`
  optional link if a log row already exists or is created later
- `asset_kind text not null`
  initial values:
  `strava_screenshot`
  `garmin_connect_screenshot`
- `storage_bucket text not null`
- `storage_path text not null`
- `mime_type text not null`
- `file_size_bytes bigint null`
- `image_width integer null`
- `image_height integer null`
- `uploaded_at timestamptz not null default now()`
- `created_at timestamptz not null default now()`
- `deleted_at timestamptz null`

Canonical rule:

- the raw screenshot is the evidence source
- it is immutable once stored
- retries must point back to the same evidence asset unless the user uploads a new screenshot

### C. `workout_extraction_jobs`

Role:

- process and state owner for screenshot extraction attempts

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `evidence_asset_id uuid not null`
- `provider text not null`
  initial value:
  `openai`
- `model text not null`
- `status text not null`
  recommended values:
  `queued`
  `processing`
  `succeeded`
  `failed`
  `superseded`
- `attempt_number integer not null default 1`
- `requested_at timestamptz not null default now()`
- `completed_at timestamptz null`
- `error_summary text null`
- `error_details jsonb null`
- `created_at timestamptz not null default now()`

Canonical rule:

- each extraction attempt is explicit
- retries create a new job row
- the current trusted extraction does not overwrite job history

### D. `workout_extraction_results`

Role:

- structured but still provisional extraction output from OpenAI

Recommended columns:

- `id uuid primary key`
- `extraction_job_id uuid not null unique`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `evidence_asset_id uuid not null`
- `source_app text null`
  expected values later:
  `strava`
  `garmin_connect`
  `unknown`
- `raw_model_output jsonb not null`
- `provisional_fields jsonb not null`
- `field_confidence jsonb null`
- `overall_confidence numeric(5,4) null`
- `requires_review boolean not null default false`
- `created_at timestamptz not null default now()`

Canonical rule:

- this table stores extracted structure, not trusted product truth
- it remains the AI-facing provisional layer

### E. `workout_actual_metrics`

Role:

- canonical normalized actual workout result derived from extraction or later manual correction

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `workout_log_id uuid null`
- `evidence_asset_id uuid null`
- `extraction_result_id uuid null`
- `source_kind text not null`
  initial values:
  `ai_extracted`
  `manual_entry`
  `manual_reviewed_ai`
- `status text not null`
  recommended values:
  `provisional`
  `normalized`
  `reviewed`
  `superseded`
- `actual_duration_min numeric(6,2) null`
- `actual_distance_km numeric(6,2) null`
- `actual_avg_pace_text text null`
- `actual_avg_hr integer null`
- `actual_avg_power integer null`
- `actual_calories integer null`
- `actual_elevation_gain_m integer null`
- `actual_interval_count integer null`
- `actual_stage_payload jsonb null`
- `missing_fields jsonb null`
- `uncertain_fields jsonb null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Canonical rule:

- this table is the normalized actual-workout surface for the feature
- it should hold normalized metrics, not raw screenshot text

### F. `workout_comparisons`

Role:

- deterministic comparison output between planned workout and normalized actual metrics

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `actual_metrics_id uuid not null`
- `comparison_status text not null`
  recommended values:
  `complete`
  `partial`
  `insufficient_data`
  `requires_review`
- `completion_state text not null`
  recommended values:
  `matched`
  `partially_matched`
  `missed`
  `unclear`
- `difference_payload jsonb not null`
- `matched_stage_count integer null`
- `planned_stage_count integer null`
- `actual_stage_count integer null`
- `missing_metric_count integer not null default 0`
- `uncertain_metric_count integer not null default 0`
- `comparison_confidence numeric(5,4) null`
- `created_at timestamptz not null default now()`

Canonical rule:

- this table should be deterministic-first
- it is the main structured basis for verdict generation

### G. `workout_verdicts`

Role:

- stored user-visible verdict and insight output

Recommended columns:

- `id uuid primary key`
- `user_id uuid not null`
- `planned_workout_id uuid not null`
- `actual_metrics_id uuid not null`
- `comparison_id uuid not null`
- `source_kind text not null`
  initial values:
  `ai_generated_with_deterministic_context`
  `rule_only`
- `status text not null`
  recommended values:
  `draft`
  `final`
  `superseded`
- `verdict_label text not null`
  example future values:
  `matched well`
  `partially completed`
  `unclear result`
- `summary_text text not null`
- `insight_items jsonb not null`
- `warning_items jsonb null`
- `confidence numeric(5,4) null`
- `requires_review boolean not null default false`
- `created_at timestamptz not null default now()`

Canonical rule:

- this is the user-facing interpretation layer
- it must always point back to deterministic comparison state

### H. Review and confidence fields

Do not create a broad moderation subsystem now.

Instead, keep review state local to the relevant tables:

- `workout_extraction_results.requires_review`
- `workout_actual_metrics.status`
- `workout_comparisons.comparison_status`
- `workout_verdicts.requires_review`

That is enough for this feature without inventing a generic review platform.

### I. Audit and version direction

Keep minimal but explicit history:

- evidence assets are immutable
- extraction jobs are append-only
- extraction results are append-only per job
- actual metrics can be superseded
- comparison rows can be superseded
- verdict rows can be superseded

This preserves traceability without requiring a broad event-sourcing system.

## OpenAI Boundary

### Where OpenAI should be used

OpenAI is appropriate for:

- screenshot content extraction into structured provisional fields
- interpretation of ambiguous screenshot layouts
- verdict wording and insight phrasing after deterministic comparison already exists

OpenAI may assist with:

- field confidence estimation
- uncertainty explanation
- actionable wording such as “you completed the interval set but ran shorter recoveries”

### Where deterministic logic must remain primary

Deterministic logic must remain primary for:

- linking evidence to one specific planned workout
- parsing and validating the extraction contract shape
- normalization into canonical metrics
- unit handling
- planned-vs-actual difference computation
- completion-state classification
- review-required thresholds
- out-of-range and impossible-value rejection

### What must not become opaque AI-only truth

The product must not let OpenAI become the only source of truth for:

- whether a workout matched the plan
- how much of the planned duration or distance was completed
- whether interval counts matched
- whether confidence is too low to trust the result

AI-generated verdicts must always sit on top of:

- stored evidence
- stored extraction result
- stored normalized metrics
- stored deterministic comparison output

### Confidence, moderation, and uncertainty handling

Recommended rule:

- OpenAI can suggest confidence
- the system decides whether the result is trusted enough for user-visible finalization

Examples of hard review triggers:

- extracted duration or distance is missing
- extracted values are impossible or out of range
- interval workout has no clear interval completion signal
- planned workout is detailed but actual extraction is too coarse
- screenshot appears unrelated to the targeted planned workout

## Comparison Model

The comparison engine should work from:

- planned workout structure in `planned_workouts.steps`
- normalized actual metrics in `workout_actual_metrics`

### Planned fields to compare

Compare where available:

- total duration
- total distance
- target pace
- target HR
- interval count
- stage or repeat structure
- long-run vs easy-run vs quality classification

### Actual fields to compare

Compare extracted or normalized actual values such as:

- actual duration
- actual distance
- average pace
- average HR
- interval count
- extracted stage payload where available

### Missing fields

If an expected field is absent:

- do not fake a full comparison
- record the missing field explicitly
- reduce comparison confidence
- allow verdict generation only if enough deterministic evidence remains

### Uncertain extraction

If extraction is uncertain:

- keep provisional fields
- mark `requires_review`
- permit a partial comparison if some fields are reliable
- prevent overconfident final verdicts

### Partial workout completion

Comparison must support:

- planned workout mostly completed but shortened
- interval set partially completed
- easy or long run completed at lower distance or duration than planned
- actual workout done but not clearly matching the intended structure

This should produce structured states like:

- `matched`
- `partially_matched`
- `missed`
- `unclear`

### Out-of-range results

The comparison layer must reject or downgrade cases such as:

- impossible duration or distance
- impossible HR or pace combinations
- too-large mismatch between planned workout type and extracted activity pattern

These should lower trust and often trigger review.

### Verdict quality and confidence

Verdict quality must depend on:

- completeness of the extracted fields
- confidence of the extraction
- determinism of the comparison
- structural match quality between plan and actual

Practical rule:

- high-confidence verdicts require high-confidence comparison
- low-confidence comparisons can still produce cautious user text, but only labeled as uncertain or provisional

## Trusted Output Boundary

### Raw screenshot evidence

Raw screenshot evidence is:

- the original uploaded asset
- useful for reprocessing and audit
- not directly user-visible truth

### Provisional extracted fields

Provisional extracted fields are:

- OpenAI output in `workout_extraction_results`
- structured but still provisional
- not yet trusted product output by themselves

### Normalized metrics

Normalized metrics are:

- the canonical actual-workout values in `workout_actual_metrics`
- more trustworthy than raw extraction
- still not sufficient alone for full user interpretation until comparison is run

### Trusted product output

Trusted user-visible output begins at:

- normalized actual metrics with acceptable review state
- deterministic comparison result
- final stored verdict or insight record

### AI-generated interpretation vs deterministic computed difference

Separate them explicitly:

- deterministic computed difference belongs in `workout_comparisons`
- AI-generated interpretation belongs in `workout_verdicts`

The user-visible summary can be AI-authored, but its factual basis must come from the stored deterministic comparison.

## Dependency Notes

This feature depends directly on the prior Supabase training-data structure direction.

Before this feature begins implementation, the following must be true:

- the canonical training-plan storage path is stable
- `plan_cycles` remains the single plan header truth path
- `planned_workouts` remains the single planned-workout truth path
- raw plan import provenance is settled through the planned import-batch model
- `planned_workouts.steps` is stable enough to represent detailed workout stages and targets

What must be true before Phase 1:

- the training-data structure work has decided how raw plan import and normalized plan storage coexist

What must be true before Phase 3:

- upload evidence storage and linking to planned workouts are already stable

What must be true before verdict generation:

- deterministic normalization and comparison exist first

Dependency constraint:

- do not build screenshot extraction or verdict storage on top of a moving planned-workout schema

## Checklist By Phase

### Phase 0: Finalize workout detail schema prerequisites

- Goal:
  ensure the canonical planned-workout structure can represent detailed stages and target fields well enough for later comparison
- Dependency:
  the current training-data storage direction and `planned_workouts.steps` contract
- Main risk:
  starting screenshot ingestion before planned workout detail is stable enough to compare against
- Rollback posture:
  stop at schema clarification and do not begin evidence or AI work until workout detail shape is trustworthy
- Next likely role:
  BACKEND

### Phase 1: Evidence storage model

- Goal:
  define and implement canonical storage for screenshot evidence assets linked to one planned workout
- Dependency:
  stable planned-workout identifiers and ownership rules
- Main risk:
  storing evidence without a strong link to a specific planned workout day
- Rollback posture:
  keep uploaded evidence immutable and append-only so processing logic can change later without losing source artifacts
- Next likely role:
  BACKEND

### Phase 2: Upload flow contract

- Goal:
  define the upload path, accepted file types, storage bucket direction, and evidence-to-workout linking contract
- Dependency:
  evidence storage model from Phase 1
- Main risk:
  ambiguous upload semantics where one screenshot is not clearly tied to one workout
- Rollback posture:
  keep upload separate from extraction so the product can still store evidence even if extraction is disabled
- Next likely role:
  BACKEND

### Phase 3: OpenAI extraction contract

- Goal:
  define the exact extraction input and output contract, job tracking, retry behavior, and provisional result storage
- Dependency:
  evidence assets and upload contract already exist
- Main risk:
  allowing arbitrary model output shape to leak directly into product truth
- Rollback posture:
  extraction jobs can fail or be retried without losing evidence assets or existing planned-workout truth
- Next likely role:
  BACKEND

### Phase 4: Normalization and comparison engine

- Goal:
  normalize extracted fields into canonical actual metrics and compute deterministic planned-vs-actual differences
- Dependency:
  stable extraction contract and stable planned workout detail contract
- Main risk:
  over-relying on AI interpretation before deterministic comparison is ready
- Rollback posture:
  keep provisional extraction stored even if comparison fails, and mark comparison as `insufficient_data` or `requires_review`
- Next likely role:
  BACKEND

### Phase 5: Verdict and insight generation

- Goal:
  generate user-facing verdict and insight records from deterministic comparison plus normalized actual metrics
- Dependency:
  comparison engine must already produce stored structured differences
- Main risk:
  overconfident AI verdicts masking weak or incomplete comparison evidence
- Rollback posture:
  fall back to rule-only or minimal deterministic summaries if AI generation is unavailable or too uncertain
- Next likely role:
  BACKEND

### Phase 6: UI and review states

- Goal:
  surface upload progress, extraction pending, uncertainty, review-needed, final verdict, and retry states inside the existing workout-detail experience
- Dependency:
  evidence, extraction, normalization, comparison, and verdict records all exist
- Main risk:
  collapsing provisional and final states into one misleading UI state
- Rollback posture:
  keep the UI capable of showing stored intermediate states even if verdict generation is disabled
- Next likely role:
  FRONTEND

## Risks

- The current planned-workout schema may still be too coarse for high-quality stage-by-stage comparison if `steps` remains underspecified.
- Screenshot evidence may be visually inconsistent across Strava and Garmin Connect, making extraction quality highly variable.
- If the system treats AI extraction as immediate truth, the user may receive confident but unsupported verdicts.
- If evidence, extraction, normalized metrics, and verdicts are not separated, retries and auditability will become brittle.
- Building this before the training-data import and canonical plan storage are settled would create a second unstable data boundary.

## Exit Criteria

- One explicit pipeline exists from planned workout to screenshot evidence to extraction to normalized metrics to comparison to verdict.
- One canonical Supabase storage direction exists for evidence, extraction jobs, extraction results, actual metrics, comparisons, and verdicts.
- The plan clearly separates deterministic comparison from AI-generated interpretation.
- The trusted-output boundary is explicit at every stage.
- Dependencies on current training-data storage work are documented.
- One clear next role is chosen.

## Next Recommended Role

BACKEND

## Suggested Next Step

Translate this future-feature plan into a dependency-checked backend schema proposal that first stabilizes detailed `planned_workouts.steps` and then defines the Supabase tables for evidence assets, extraction jobs, extraction results, normalized actual metrics, comparisons, and verdicts.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the future-feature architecture plan for workout screenshot ingestion, OpenAI extraction, planned-vs-actual comparison, and verdict generation, all anchored to one canonical planned-workout contract and stored in Supabase.

### Key Decisions

- Keep one explicit pipeline: planned workout -> evidence asset -> extraction job -> extraction result -> normalized actual metrics -> deterministic comparison -> AI verdict.
- Keep deterministic comparison as the factual truth layer and AI verdict generation as a separate interpretation layer.

### Current State

- The current app already has canonical planned workout and workout-log storage, but it does not yet have first-class evidence, extraction, comparison, or verdict entities.
- This new plan now defines the future storage and boundary model without requiring implementation now.

### Constraints

- Do not broaden this work into unrelated AI capabilities, multi-sport abstraction, or generalized workflow engines.
- Do not begin this feature before the canonical training-plan storage path and detailed planned workout structure are stable.

### Risks / Open Questions

- The current `planned_workouts.steps` contract may need strengthening before stage-level comparison becomes reliable.
- Screenshot variability and extraction uncertainty will require explicit review and confidence handling even in the narrow first version.

### Next Recommended Role

BACKEND

### Suggested Next Step

Draft the schema-first backend proposal for the prerequisite planned-workout detail contract and the new Supabase tables for evidence, extraction, normalization, comparison, and verdict storage.
```

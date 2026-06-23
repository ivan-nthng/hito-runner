# Provider Activity Ingestion And Comparison Contract

Date: 2026-06-09
Owner: Product / Backend / Data contract

## Status

backlog

## Type

product_brief

## Priority

medium

## Next Recommended Role

backend

## Task

Use the provider activity ingestion and comparison contract when future provider sync work is
selected.

## Stage

PRODUCT brief / future provider ingestion contract.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Use the provider activity ingestion and comparison contract when future provider sync work is
selected.

Stage:
BACKEND backlog / provider activity ingestion contract implementation.

Context:
This product brief defines a future provider-agnostic ingestion and plan-vs-actual comparison
contract. Preserve the current local Garmin upload behavior and do not implement provider sync
unless a bounded provider-ingestion slice is explicitly selected.
```

## Brief Status

Proposed source-of-truth for future provider ingestion and plan-vs-actual comparison.

## Purpose

Define one canonical contract for:

- local Garmin `.fit` / `.zip` upload
- future Garmin API activity ingestion
- future other provider API ingestion
- normalized activity truth inside Hito
- planned-vs-actual comparison
- recommendation inputs

This document exists so Hito does not end up with:

- one contract for FIT files
- another contract for Garmin API
- a third contract for other providers
- a fourth contract for runner-facing comparison

The system should normalize all sources into one canonical activity truth first, then compare that truth against the planned workout.

## Current Implemented Reality

Today Hito already has:

- local Garmin `.fit` and `.zip` upload
- parsed activity summary
- normalized actual metrics persistence
- lap payload persistence
- conservative deterministic comparison
- bounded AI recommendation on top of deterministic comparison

Today Hito does not yet have:

- Garmin API sync
- other provider sync
- canonical provider-agnostic activity ingestion contract
- canonical pace comparison truth
- canonical heart-rate target comparison truth
- robust repeated-interval block reconstruction as first-class comparison truth

This spec is for the future-ready canonical contract, while explicitly preserving current implemented behavior.

## Canonical Principles

1. One normalized activity contract for all provider inputs.
2. Preserve raw source payload separately from normalized truth.
3. Compare only trustworthy facts.
4. Derived pace is allowed from duration plus distance.
5. Personal heart-rate target truth must remain separate from observed actual HR data.
6. Provider-specific step/workout metadata is optional, not the foundation of the system.
7. The comparison layer must work even when official structured workout step indexes are missing.
8. Recommendation input must consume deterministic normalized truth, not raw provider payloads.

## Non-Goals

This contract does not:

- invent pace targets from goal time
- invent personal HR targets
- require Garmin `workoutStepIndex` to exist
- require every provider to expose workout execution metadata
- define plan generation
- define watch export delivery
- define silent adaptive plan mutation

## Canonical Ingestion Pipeline

All sources should follow one pipeline:

`provider input -> raw payload preservation -> provider-specific parse -> canonical normalized activity -> block reconstruction -> deterministic comparison -> bounded recommendation inputs`

## Source Kinds

Hito should recognize these input kinds:

- `garmin_fit_upload`
- `garmin_zip_upload`
- `garmin_api_activity`
- `coros_api_activity`
- `polar_api_activity`
- `suunto_api_activity`
- `apple_health_activity`
- `strava_activity_import`
- `unknown_provider_activity`

Source kind should describe where the activity came from, not whether comparison succeeded.

## Normalized Activity Contract

Every ingested activity should normalize into one canonical record with these sections.

### A. Activity Identity

Required:

- `source_kind`
- `provider_name`
- `provider_activity_id` if available
- `provider_workout_id` if available
- `original_file_name` for uploaded files if available
- `ingested_at`

### B. Activity Session Summary

Required:

- `activity_started_at`
- `activity_local_date`
- `sport`
- `sub_sport` if available
- `total_duration_sec`
- `total_distance_m`

Optional:

- `moving_duration_sec`
- `elapsed_duration_sec`
- `avg_heart_rate_bpm`
- `max_heart_rate_bpm`
- `avg_cadence_spm`
- `max_cadence_spm`
- `avg_power_w`
- `max_power_w`
- `total_calories`
- `total_ascent_m`
- `total_descent_m`
- `avg_temperature_c`
- `gps_point_count`

Derived:

- `avg_pace_sec_per_km` when duration and distance both exist

### C. Lap / Split Payload

Required for comparison-ready ingestion:

- `sequence`
- `lap_trigger`
- `duration_sec`
- `distance_m`

Optional:

- `started_at`
- `avg_heart_rate_bpm`
- `max_heart_rate_bpm`
- `avg_cadence_spm`
- `avg_power_w`
- `max_power_w`
- `calories`
- `elevation_gain_m`
- `elevation_loss_m`
- `provider_step_index`
- `provider_intensity`

Derived:

- `pace_sec_per_km`

### D. Record / Stream Payload

Optional but preferred for future richer analysis:

- `time_offset_sec`
- `timestamp`
- `distance_m`
- `heart_rate_bpm`
- `cadence_spm`
- `power_w`
- `pace_sec_per_km`
- `elevation_m`
- `latitude`
- `longitude`

This stream layer is not required for first comparison success, but it is the best future source for drift, fade, and stability analysis.

### E. Workout Execution Metadata

Optional:

- `provider_workout_name`
- `provider_workout_step_count`
- `provider_step_index` per lap if available
- `provider_structured_workout_present`

Important:

- this metadata is helpful
- it is not required for block-level reconstruction
- absence of this metadata must not make interval comparison impossible if laps clearly express the structure

## Required Data From Local FIT Upload

For local `.fit` ingestion, Hito must extract at minimum:

- session start time
- local activity date
- total duration
- total distance
- average HR if present
- max HR if present
- average cadence if present
- average power if present
- total ascent and descent if present
- lap count
- lap payload
- record count

For each lap:

- sequence
- trigger type
- duration
- distance
- average HR if present
- max HR if present
- average cadence if present
- average power if present
- ascent and descent if present

If available, also extract:

- provider workout name
- provider step index
- structured workout step count

If unavailable, ingestion must still succeed.

## Required Data From Garmin API

When Garmin API becomes available, Hito should request enough data to reconstruct the same contract as FIT upload, not less.

Required Garmin API fields:

- provider activity id
- activity start time
- local date or timezone-adjusted timestamp
- sport / activity type
- total duration
- total distance
- calories if available
- ascent / descent if available
- average and max heart rate if available
- average cadence if available
- average power if available
- laps or splits with per-lap duration and distance

Preferred Garmin API fields:

- per-lap avg/max HR
- per-lap cadence
- per-lap power
- explicit structured workout metadata
- workout name
- workout step count
- step index per lap
- time-series records

Future-rich Garmin fields if available:

- pace stream
- power stream
- grade / elevation stream
- GPS stream
- weather or temperature metadata

Rule:

If Garmin API cannot provide laps or equivalent splits, the activity should not be treated as comparison-complete for structured workouts.

## Strava API Mapping

If the runner explicitly connects Hito to Strava and grants OAuth access, Strava should be treated as a first-class provider source for normalized activity ingestion.

### Strava Access Requirements

Strava access requires:

- a Strava developer application
- user OAuth authorization
- bearer access token handling
- refresh token handling

Required scopes for the activity read path:

- `activity:read`
- `activity:read_all` when the runner expects Hito to access private or "Only Me" activities

### Strava Endpoints Hito Should Use

Required endpoints:

- athlete activity list
- detailed activity
- activity laps
- activity streams

Recommended near-real-time sync support:

- webhooks for activity create/update/delete events

### Strava Data Hito Should Pull

From detailed activity:

- activity id
- name
- start date
- local start date
- sport type
- distance
- moving time
- elapsed time
- total elevation gain
- average speed
- max speed
- average heartrate if available
- max heartrate if available
- average cadence if available
- calories if available
- device name if available

From activity laps:

- lap index
- start date
- local start date
- elapsed time
- moving time
- distance
- average speed
- max speed
- average cadence if available
- total elevation gain
- start index
- end index

From activity streams when available:

- `time`
- `distance`
- `latlng`
- `altitude`
- `velocity_smooth`
- `heartrate`
- `cadence`
- `watts`

### What Strava Is Good Enough For

Strava is sufficient for:

- session summary normalization
- lap-based structured compare
- derived pace reconstruction
- HR trend analysis
- cadence trend analysis
- power trend analysis when available
- interval block reconstruction from laps and streams

### What Strava Should Not Be Assumed To Provide

Do not assume Strava will provide:

- Garmin-style official workout step indexes
- full provider-authored structured workout execution metadata
- exact plan-step fidelity markers

Hito must therefore treat Strava as:

- strong session summary truth
- strong lap truth
- strong stream truth
- optional workout-metadata truth

## Required Data From Other Provider APIs

Other providers should be mapped to the same minimum contract.

Required provider-agnostic fields:

- provider activity id
- start time
- local date
- sport / subtype if available
- total duration
- total distance
- laps or splits if the provider exposes them

Preferred provider-agnostic fields:

- avg/max HR
- cadence
- power
- ascent / descent
- workout name
- workout execution metadata
- time-series records

If a provider only gives session summary and no laps:

- session summary compare may still succeed
- structured interval block compare must remain `not_applicable`

Provider-specific note:

- Strava already qualifies as a strong provider source because it exposes activity details, laps, and streams through the public developer API after user OAuth consent.

## Derived Fields Hito Should Compute

Hito should derive these fields after ingestion:

- `avg_pace_sec_per_km`
- `lap.pace_sec_per_km`
- `actual_interval_like_pattern_present`
- `block_reconstruction_confidence`
- `provider_structured_workout_confidence`

Derived fields are canonical computed truth, not raw provider truth.

## Canonical Block Reconstruction Contract

Hito needs one provider-agnostic block reconstruction layer so interval workouts can be compared even without provider step indexes.

### Block Types

Canonical reconstructed blocks:

- `warmup`
- `work`
- `recovery`
- `main`
- `cooldown`
- `unknown`

### Reconstruction Inputs

Block reconstruction may use:

- planned workout structure
- lap durations
- lap distances
- lap order
- lap triggers
- observed HR progression
- observed pace progression
- provider workout metadata if available

### Reconstruction Rules

For repeated interval workouts:

- detect opening warmup block before repeating pattern
- detect repeating `work/recovery` pairs
- count repeats
- detect final cooldown block

For tempo or steady workouts:

- detect warmup
- detect main sustained block
- detect cooldown

For long runs:

- preserve session summary truth
- lap grouping is optional unless the plan includes distinct steady-finish structure

### Reconstruction Confidence

Every reconstructed workout should receive one confidence label:

- `high`
- `medium`
- `low`
- `not_reconstructed`

Examples:

- provider step indexes present and align with laps: `high`
- laps clearly show `6 x 120s / 60s` pattern but no step indexes: `medium`
- only session summary exists: `not_reconstructed`

## Planned Workout Comparison Contract

The comparison layer should compare these classes of truth separately.

### A. Session-Level Signals

Compare when trustworthy:

- date alignment
- total duration
- total distance when planned distance truth exists
- total observed HR summary
- total observed cadence summary

### B. Structure-Level Signals

Compare when reconstruction is trustworthy:

- warmup duration
- cooldown duration
- repeat count
- work block duration
- recovery block duration
- work block distance
- recovery block distance

### C. Performance-Level Signals

Compare when actual data exists:

- work block pace trend
- work block HR trend
- recovery block HR drop
- cadence stability

### D. Unsupported Or Deferred Signals

Do not pretend to compare unless the canonical truth exists:

- planned pace target vs actual pace
- planned HR target vs actual HR
- exact provider workout step execution fidelity
- route matching
- terrain matching

These should be marked:

- `unsupported`
- `not_applicable`
- `missing_actual`

## Recommendation Input Contract

The recommendation layer should consume normalized comparison facts, not raw activity payloads.

Minimum recommendation inputs:

- completion of planned structure
- repeat count match or miss
- warmup and cooldown adequacy
- work-block pace consistency
- work-block HR drift
- recovery HR drop adequacy
- session date alignment
- total session duration and distance deltas

This makes it possible to generate runner-facing summaries like:

- "Structure matched well."
- "You completed 5 of 6 repeats."
- "Recovery blocks stayed too hard."
- "Work pace faded across the last third of the session."
- "Warm-up was shorter than planned."

## What Hito Must Store

Store separately:

### Raw

- original file asset or provider payload reference
- provider response envelope if policy allows

### Normalized

- activity summary
- lap payload
- optional record payload
- optional workout metadata

### Derived

- reconstructed blocks
- comparison payload
- recommendation input summary

Hito must not force downstream comparison or recommendation layers to reparse raw provider payloads.

## Provider Capability Matrix

| Capability | FIT upload | Garmin API | Other provider APIs |
| --- | --- | --- | --- |
| Session summary | required | required | required |
| Laps / splits | required for structured compare | required for structured compare | preferred |
| Avg/max HR | preferred | preferred | preferred |
| Cadence | preferred | preferred | preferred |
| Power | optional | optional | optional |
| Workout name | optional | optional | optional |
| Step index metadata | optional | optional | optional |
| Record stream | optional | preferred future | optional |
| Block reconstruction | yes if laps exist | yes if laps exist | yes if laps exist |

## Ambiguous Cases

### Case 1: No laps, only session summary

Allowed:

- session summary compare

Not allowed:

- interval block reconstruction

### Case 2: Laps exist but no provider step metadata

Allowed:

- block reconstruction from lap pattern

### Case 3: Laps exist but are polluted by auto-laps

Allowed:

- compare only if the pattern still reconstructs honestly

Otherwise:

- mark structure-level compare as low-confidence or not applicable

### Case 4: HR missing

Allowed:

- structure and pace compare

Not allowed:

- HR-based recommendation claims

### Case 5: Distance missing on some laps

Allowed:

- duration-based compare

Not allowed:

- pace truth on those laps

## FIT Upload And API Must Converge

Important product rule:

- Garmin API ingestion must not create a second richer comparison model that FIT upload cannot use.
- FIT upload and Garmin API should both normalize into the same internal schema.
- The only acceptable difference is confidence, completeness, and optional metadata richness.

## Practical Minimum For The Next Slice

If Hito wants the smallest future-safe implementation target, the next canonical comparison slice should require:

- session summary
- lap payload
- derived lap pace
- block reconstruction
- repeat count compare
- warmup/work/recovery/cooldown duration compare
- work-block HR and pace trend summary when present

That is enough to make interval plan-vs-actual comparison genuinely useful before provider step indexes or full API sync are perfect.

## Suggested Next Use

This document should become the source of truth for:

- backend provider ingestion seams
- future Garmin API field requests
- future provider adapter mapping
- QA fixture design
- runner-facing comparison coverage rules

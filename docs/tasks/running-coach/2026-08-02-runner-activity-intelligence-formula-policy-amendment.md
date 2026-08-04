# Runner Activity Intelligence Formula Policy Amendment

**Date:** 2026-08-02
**Version:** 1.0
**Owner:** Running Coach for metric meaning; Architect for canonical evidence boundaries; Backend for
deterministic computation
**Status:** Canonical amendment to the
[Hito Runner Profile Constitution](2026-07-30-hito-runner-profile-constitution.md) for Runner
Activity Intelligence Gates 4 and 5
**Plan:**
[Runner Activity Intelligence Foundation Architecture](../backlog/2026-07-30-runner-activity-intelligence-foundation-architecture.md)

## 1. Purpose and authority

This amendment resolves the formula-policy choices that Backend must not make ad hoc for personal
bests, runner-reported session-RPE load, aerobic efficiency, pace at comparable heart rate, heart
rate at comparable pace, aerobic durability/HR-speed decoupling, and controlled aerobic duration.

It does not create another activity truth. Every metric consumes accepted canonical activity
revisions and, where required, a persisted normalized sample-set revision. Raw FIT/provider payloads,
planned targets, Frontend calculations, provider estimates, and AI interpretation are not metric
inputs.

This amendment supersedes constitution text where the constitution permits a summary-only aerobic
fallback, describes completed-session RPE as `0-10` rather than `1-10`, or leaves PB interpolation,
comparable cohorts, duration basis, confidence, and invalidation open.

## 2. Gate split

| Capability                                        | Gate 4                                                                                                                        | Gate 5 dependency                                                    |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Session-RPE load                                  | May ship after one runner-reported RPE is immutably attributable to one canonical activity revision                           | None                                                                 |
| User-confirmed official record                    | May ship only after Product/Architecture accept exact-distance, result-time, provenance, correction, and withdrawal semantics | None                                                                 |
| Provider-attributed record                        | May ship only as an attributed record fact normalized into canonical activity truth                                           | None                                                                 |
| Whole-activity exact-distance record              | May ship when canonical elapsed duration and exact accepted distance constitute the claimed result                            | None                                                                 |
| Calculated best effort inside a longer activity   | Not available from summary truth                                                                                              | Requires persisted elapsed-time and cumulative-distance samples      |
| Aerobic efficiency and comparable-HR/pace metrics | Not available from summary truth                                                                                              | Requires persisted versioned HR and distance/time streams            |
| Durability, decoupling, controlled duration       | Not available from summary truth                                                                                              | Requires the same stream foundation plus continuous-segment evidence |

`normalized_stream_not_persisted` is the truthful state until the stream prerequisite exists. FIT
records being readable during upload, a record count, laps, or summary mean HR do not satisfy it.

## 3. Common observation contract

Every derived observation must retain:

- runner ID and canonical activity ID;
- canonical activity revision;
- source revision and, for stream metrics, normalized sample-set revision;
- metric name, value, unit, and `metric_formula_version`;
- analyzed time/distance bounds;
- eligibility and exclusion results;
- comparability cohort and reference-series ID where applicable;
- evidence confidence, observation count, and stable unavailable reason;
- calculation timestamp.

One activity contributes at most one observation to one metric/cohort/window. For an aerobic metric,
use the longest eligible continuous segment; ties select the earliest segment. PB calculation scans
all valid distance candidates and retains the fastest eligible result. This prevents interval count
or long duration from overweighting one session.

Common unavailable reasons are `canonical_activity_missing`, `activity_not_running`,
`activity_deleted`, `activity_revision_invalidated`, `formula_version_mismatch`, and
`metric_recalculation_pending`. Metric-specific reasons below are used instead when they describe
the first failed gate more precisely.

Formula versions are metric-specific constants, not configurable formulas:

| Metric                      | Initial formula version             |
| --------------------------- | ----------------------------------- |
| Personal best effort        | `personal_best_elapsed_v1`          |
| Session-RPE load            | `session_rpe_load_v1`               |
| Aerobic efficiency          | `aerobic_efficiency_stream_v1`      |
| Pace at comparable HR       | `pace_at_comparable_hr_v1`          |
| HR at comparable pace       | `hr_at_comparable_pace_v1`          |
| Durability / decoupling     | `aerobic_decoupling_v1`             |
| Controlled aerobic duration | `controlled_aerobic_duration_v1`    |
| Multi-metric interpretation | `aerobic_profile_interpretation_v1` |

`personal_best_elapsed_v2` preserves the v1 elapsed-time formula and adds the already-required
running context to record identity so track, road, treadmill, and trail/mountain records do not
replace one another.

`personal_best_elapsed_v3` preserves the elapsed-time formula and corrects observed whole-activity
projection so its normalized stored running context participates in the same identity contract as
runner-confirmed official records. Missing or unsupported source context remains unknown.

An eligibility, threshold, cohort, normalization, confidence, or arithmetic change requires a new
version for the affected metric. Historical results remain attributable; they are not silently
overwritten.

## 4. Personal best policy

### 4.1 Eligible records

The standard distances remain those in the constitution. Hito keeps these record classes separate:

- `calculated_training_best`;
- `calculated_race_best` when race provenance is explicit;
- `provider_attributed_best`;
- `runner_confirmed_official_result`;
- longest continuous distance and duration.

Hito may show a best across accepted Hito-observed activity evidence, but it must not relabel a
training effort or provider claim as an official race result.

### 4.2 Required evidence and formula

For a calculated record inside an activity, required stream fields are strictly increasing elapsed
timestamp/offset, non-decreasing cumulative distance, activity/source/sample-set revisions, and
explicit gap/pause evidence where available.

```text
personal_best_elapsed_seconds =
  interpolated_elapsed_time_at_end_distance
  - interpolated_elapsed_time_at_start_distance
```

Use elapsed time, including an explicit pause. Linear interpolation is permitted only between two
adjacent valid samples that bracket a boundary. It is not permitted through an invalid gap,
distance regression, or implausible jump.

V1 stream-quality boundaries for record calculation:

- no adjacent valid-sample gap greater than `15 seconds` while cumulative distance changes;
- no negative cumulative-distance delta;
- no implied speed greater than `12 m/s` between adjacent samples;
- no interpolation across a source-marked missing interval;
- a pause with no distance gain remains elapsed time and is not removed.

These are conservative product data-quality rules, not claims about human physiological limits.

Summary-only truth may create a whole-activity record only when accepted canonical distance exactly
matches the record distance and accepted elapsed duration exists. It must not estimate shorter best
efforts from average pace. An attributed provider best remains attributed and does not become a
calculated Hito best.

### 4.3 Confidence and claims

| Evidence                                             | Confidence                                     | Runner-facing claim                  |
| ---------------------------------------------------- | ---------------------------------------------- | ------------------------------------ |
| Valid normalized stream and exact calculated segment | `complete`                                     | "Fastest Hito-observed 5K effort"    |
| Accepted whole-activity exact-distance result        | `complete`                                     | "Fastest Hito-observed 10K activity" |
| Provider-attributed best without normalized stream   | `partial`                                      | "Best reported by Garmin/Strava"     |
| Runner-confirmed official result                     | `partial` unless independently source-verified | "Official result entered by you"     |
| Summary of a longer activity                         | `unavailable`                                  | No inferred record                   |

Trail/mountain, treadmill, track, and outdoor road records remain separately labelled contexts.
They may coexist; they must not silently replace one another as if conditions were identical.

### 4.4 PB unavailable reasons

- `normalized_stream_not_persisted`
- `elapsed_distance_evidence_missing`
- `missing_elapsed_time`
- `missing_cumulative_distance`
- `insufficient_distance`
- `non_monotonic_stream`
- `recording_gap_at_boundary`
- `implausible_distance_jump`
- `official_result_not_confirmed`
- `unsupported_record_class`
- `source_revision_invalidated`
- `metric_recalculation_pending`

## 5. Session-RPE load policy

### 5.1 Runner report and eligibility

Session RPE is the runner's whole-session report on an integer `1-10` scale. `0` means no exertion
and is not an accepted value for a completed or partial runnable activity. A skipped workout has no
session load. Planned segment RPE, AI-authored effort, HR, pace, and inferred exertion must never
substitute for runner-reported session RPE.

Eligible outcomes are:

- `completed`: use actual observed duration and actual reported RPE;
- `partial`: use actual observed duration and actual reported RPE without extrapolation or
  completion-ratio adjustment;
- `skipped`: unavailable, not zero load.

A future `stopped` outcome follows the `partial` rule only after it exists as accepted canonical
truth. Until then, Backend must not create that state.

The RPE evidence must be uniquely and immutably attributable to the same canonical activity
revision. A mutable planned-workout log without an accepted activity link cannot contribute to the
activity profile. Editing RPE creates or points to a new attributable RPE revision; historical
snapshots retain the value/revision they used.

### 5.2 Duration basis and formula

Duration priority is:

1. canonical observed timer duration;
2. canonical observed elapsed duration, with `partial` evidence confidence;
3. otherwise unavailable.

Do not use planned duration, moving time, estimated duration from distance/pace, or a manual
completion duration that is not accepted as canonical activity truth.

```text
session_rpe_load_au = actual_duration_minutes * runner_reported_session_rpe
```

Preserve calculation precision; runner-facing readback may round to the nearest whole arbitrary
unit (`AU`). Weekly and rolling-28-day load are sums of eligible activity loads.

### 5.3 Confidence and claims

| Evidence                                                    | Confidence    |
| ----------------------------------------------------------- | ------------- |
| Pinned direct activity RPE plus observed timer duration     | `complete`    |
| Pinned activity RPE plus observed elapsed-duration fallback | `partial`     |
| Ambiguous activity/workout link or unpinned mutable RPE     | `unavailable` |

Allowed claim: "Your reported training load was 168 AU, based on 42 minutes and RPE 4."

Forbidden claims include calories, injury risk, overtraining, recovery status, cross-runner ranking,
or an automatic plan veto.

### 5.4 Session-load unavailable reasons

- `runner_rpe_not_recorded`
- `rpe_out_of_range`
- `actual_duration_not_observed`
- `activity_rpe_link_missing`
- `activity_rpe_link_ambiguous`
- `outcome_ineligible`
- `skipped_has_no_session_load`
- `source_revision_invalidated`
- `metric_recalculation_pending`

## 6. Gate 5 normalized-stream contract

Gate 5 consumes a persisted normalized sample set. It must not reparse a retained raw FIT file at
metric-read time.

### 6.1 Minimum fields and quality

Required fields are ordered sample ID/sequence, elapsed timestamp/offset, cumulative distance for
distance/speed metrics, observed BPM for HR metrics, timer/movement/pause/missing state when the
source supplies it, source/activity/sample-set revisions, and field provenance/quality flags.
Planned-step/lap boundaries, terrain, elevation, temperature, and sensor class are preserved when
available.

Required quality for an analyzed segment:

- timestamps strictly increase;
- cumulative distance does not decrease;
- observed HR is inside the technical-quality envelope `30-240 BPM`;
- implied running speed does not exceed `12 m/s`;
- HR and distance/speed each cover at least `90%` of analyzed timer-running seconds;
- no unexplained valid-sample gap exceeds `15 seconds`;
- no single pause exceeds `30 seconds` and total paused time is at most `5%` of analyzed duration.

The BPM and speed envelopes are corruption filters, not physiological or medical statements. Do
not carry a sample forward beyond its actual adjacent interval or fabricate missing samples. There
is no summary-only fallback in v1.

### 6.2 Aerobic intent and analysis segment

Eligible intent is recovery/easy continuous running, steady aerobic running, or plain continuous
long aerobic running. Intent must come from a unique accepted planned-workout match or an explicit
runner classification. Backend must not infer intent from title, average HR, pace shape, or provider
workout name.

Exclude intervals, strides, hills, races, progression runs, deliberate steady/fast finishes,
run/walk transitions, and unclassified activities.

If accepted planned-step boundaries exist, analyze the continuous main aerobic leaves only. For an
explicitly runner-classified unstructured continuous run, exclude the first `10 minutes` and final
`5 minutes`; at least `20 continuous timer-running minutes` must remain.

### 6.3 Comparability cohort

Each observation belongs to:

```text
intent_class x environment_terrain_class x HR_sensor_class x formula_version
```

V1 classes are:

- intent: `easy_recovery`, `steady_aerobic`, `long_aerobic`;
- environment/terrain: `outdoor_road_flat_rolling`, `outdoor_road_hilly`, `track`, `treadmill`,
  `trail_mountain`, `unknown`;
- HR sensor: `chest_electrode`, `wrist_optical`, `unknown`.

Unknown terrain or sensor may produce a per-activity observation, but any trend using it is capped at
`provisional`. Do not infer either class from the workout title. Known materially different weather
or surface is retained as context and caps confidence at `provisional`; missing weather alone does
not block calculation.

## 7. Gate 5 metric formulas

### 7.1 Aerobic efficiency

For each adjacent valid sample interval:

```text
heartbeats_i = ((hr_i + hr_i+1) / 2) * interval_seconds / 60
distance_i = cumulative_distance_i+1 - cumulative_distance_i

activity_efficiency_m_per_beat =
  sum(distance_i) / sum(heartbeats_i)
```

The rolling-window value is the median of eligible activity observations, not one pooled total.
This gives each run one observation rather than allowing one long run to dominate.

Runner-facing claim: "Across comparable aerobic runs, you covered more distance per observed
heartbeat." Do not call it VO2max, laboratory running economy, heart strength, or race readiness.

### 7.2 Pace at comparable heart rate

Create a fixed reference series from the first qualifying baseline window:

```text
activity_reference_hr = time_weighted_median_hr_of_eligible_segment
reference_hr = round_to_nearest_5_bpm(
  median(activity_reference_hr across baseline activities)
)
accepted_interval = observed_hr inside reference_hr +/- 3 BPM
activity_speed_at_reference_hr =
  accepted_distance_m / accepted_timer_seconds
```

Each activity requires at least `10 cumulative timer-running minutes` inside the accepted HR bucket.
The window value is the median of activity speeds. Do not extrapolate to unobserved HR.

The fixed reference remains unchanged for the life of that series. A new accepted reference creates
a new series; it does not rewrite the old one. How a runner initiates a re-baseline is Product-owned.

```text
speed_change_pct =
  (current_median_speed / baseline_median_speed - 1) * 100
```

### 7.3 Heart rate at comparable pace

Create a fixed pace reference from the first qualifying baseline window:

```text
activity_reference_pace = median_pace_of_eligible_segment
reference_pace = round_to_nearest_5_seconds_per_km(
  median(activity_reference_pace across baseline activities)
)
accepted_interval = observed_pace inside reference_pace +/- 15 seconds_per_km
activity_hr_at_reference_pace =
  time_weighted_median_hr(accepted_intervals)
```

Each activity requires at least `10 cumulative timer-running minutes` inside the accepted pace
bucket. `observed_pace` is the trailing `30-second` pace calculated from valid cumulative-distance
and timer samples, not a source's unsmoothed instantaneous pace field. The window value is the
median of activity HR values. Reference pace comes from observed aerobic running, never a
finish-time goal, planned target, or generated pace.

```text
hr_change_bpm = current_median_hr - baseline_median_hr
```

### 7.4 Durability and HR-speed decoupling

The eligible continuous analyzed segment must be at least `40 timer-running minutes`. Split it into
equal timer-running halves. Both halves must independently pass stream coverage.

```text
efficiency_first = speed_m_per_min_first / mean_hr_bpm_first
efficiency_second = speed_m_per_min_second / mean_hr_bpm_second
decoupling_pct =
  (efficiency_first - efficiency_second) / efficiency_first * 100
```

Positive values describe lower second-half efficiency. Negative values are retained rather than
forced to zero. One session is an observation, not a good/bad verdict. Compare only inside the same
cohort and duration band:

- `40-59 minutes`;
- `60-89 minutes`;
- `90-119 minutes`;
- `120+ minutes`.

Do not calculate for deliberate progression, race, fast-finish, interval, hill, or run/walk
structures.

### 7.5 Controlled aerobic duration and distance

This metric uses the fixed reference-HR series from pace-at-comparable-HR. It measures the longest
continuous eligible span where the runner sustains the reference effort without a defined external
output collapse. It is eligible only for `outdoor_road_flat_rolling`, `track`, or `treadmill`
cohorts; road-hilly and trail/mountain observations remain durability context but do not produce
controlled-duration truth in v1.

Rules:

1. Evaluate consecutive rolling `5-minute` blocks after the accepted warm-up exclusion.
2. A block is HR-controlled when at least `80%` of its valid seconds are inside
   `reference_hr +/- 5 BPM`.
3. The first eligible `20 minutes` establish the activity's reference median speed.
4. The controlled span ends at a pause/quality failure or after two consecutive blocks whose median
   speed is below `85%` of that first-20-minute speed while HR remains controlled.
5. Report controlled duration and distance separately.

This is a versioned Hito coaching definition of material output loss, not a universal physiological
threshold. It must not be presented as maximum capacity or a medical limit.

## 8. Windows, confidence, and interpretation

Baseline and current comparisons use adjacent non-overlapping `28-day` windows. An observation is
one eligible activity-derived value.

| Evidence in each window   | Coaching evidence level |
| ------------------------- | ----------------------- |
| Fewer than 3 observations | `insufficient`          |
| 3-5 observations          | `provisional`           |
| At least 6 observations   | `established`           |

Runtime availability and coaching evidence are separate:

- `complete`: the individual metric observation passed all evidence/quality gates;
- `partial`: attributed or context-limited evidence allowed by that metric;
- `unavailable`: no value is emitted;
- `insufficient/provisional/established`: confidence in a multi-activity comparison.

An unknown/mixed sensor, terrain mismatch, materially different known conditions, or non-adjacent
windows caps a comparison at `provisional`; it never upgrades weak evidence.

V1 personal-variability thresholds use the larger of a fixed floor and the baseline median absolute
deviation (`MAD`). Relative MAD is `baseline_MAD / abs(baseline_median) * 100`:

| Metric                 | Meaningful favorable/unfavorable change floor                   |
| ---------------------- | --------------------------------------------------------------- |
| Aerobic efficiency     | `max(2%, baseline relative MAD)`                                |
| Speed at comparable HR | `max(2%, baseline relative MAD)`                                |
| HR at comparable pace  | `max(3 BPM, baseline MAD)`                                      |
| Decoupling             | `max(2 percentage points, baseline MAD)`                        |
| Controlled duration    | Descriptive only in v1; it does not independently set direction |

Interpretation rules:

- `improving`: established evidence, at least two metrics beyond favorable thresholds, and no
  comparable metric beyond an unfavorable threshold;
- `provisional_improving`: favorable direction with provisional evidence or only one qualifying
  metric;
- `stable`: all available comparable metrics remain inside personal thresholds;
- `mixed`: available metrics disagree or context comparability is capped;
- `declining_observation`: established evidence, at least two metrics beyond unfavorable thresholds;
- `insufficient_evidence`: fewer than three comparable observations in either window.

No state is a diagnosis, readiness score, injury prediction, or automatic plan mutation.

## 9. Gate 5 unavailable reasons

All stream metrics may use:

- `normalized_stream_not_persisted`
- `stream_quality_below_threshold`
- `heart_rate_not_observed`
- `distance_not_observed`
- `aerobic_intent_unverified`
- `workout_structure_excluded`
- `stable_segment_too_short`
- `pause_threshold_exceeded`
- `reference_series_not_established`
- `reference_bucket_insufficient_time`
- `comparison_window_insufficient_observations`
- `comparability_cohort_mismatch`
- `source_revision_invalidated`
- `formula_version_mismatch`
- `metric_recalculation_pending`

`terrain_class_unknown` and `sensor_provenance_unknown` cap comparison confidence rather than making
a valid per-activity observation unavailable. If their absence prevents the requested same-cohort
comparison, use `comparability_cohort_mismatch`.

## 10. Correction, deletion, and recalculation

| Canonical change                                          | Invalidated metrics                                                                       |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| RPE correction                                            | Session-RPE load and aggregate load snapshots only                                        |
| Planned-workout match or explicit intent correction       | Intent-dependent Gate 5 metrics; session load only if its activity-RPE link changed       |
| Distance, elapsed/timer time, pause, or sample correction | Relevant PB and every dependent Gate 5 observation                                        |
| HR sample or sensor-provenance correction                 | Every HR-dependent Gate 5 observation                                                     |
| Terrain/environment correction                            | Cohort assignment and affected comparisons                                                |
| Sport corrected away from running                         | PB, session load, and every running metric contribution                                   |
| Canonical activity deletion                               | Remove current contribution and recompute affected records, windows, and reference series |
| Raw source file removal after accepted normalization      | No metric invalidation when required normalized evidence and provenance remain            |
| Formula amendment                                         | Produce new-version observations; do not overwrite old-version history                    |

If the activity that established a reference HR/pace is invalidated, close that reference series and
recompute a new series from the remaining eligible baseline evidence. Do not silently reuse the old
reference. Whether deleted-source audit attribution is retained is a Product/Architecture policy;
current runner-facing metrics must stop using deleted canonical truth.

## 11. Deterministic acceptance fixtures

| Fixture                                                           | Expected result                                                                    |
| ----------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Completed run, 42 timer minutes, runner RPE 4                     | `168 AU`, complete                                                                 |
| Partial run, 28 timer minutes, runner RPE 7                       | `196 AU`, no completion-ratio scaling                                              |
| Skipped workout with RPE absent                                   | `skipped_has_no_session_load`                                                      |
| Planned 60 minutes, observed 38 timer minutes, RPE 5              | `190 AU`; planned duration ignored                                                 |
| Longer activity with valid exact 5K segment                       | Elapsed segment PB may qualify after stream persistence                            |
| Longer summary-only activity averaging 5K pace                    | No inferred 5K PB: `normalized_stream_not_persisted`                               |
| PB boundary bracketed by 1-second valid samples                   | Linear boundary interpolation allowed                                              |
| PB boundary crosses a 20-second recording gap                     | Excluded: `recording_gap_at_boundary`                                              |
| 6,000 m in 40 min at constant 145 BPM                             | 5,800 estimated heartbeats; `1.034 m/beat`                                         |
| Comparable pace changes 7:00/km to 6:30/km at fixed HR            | Speed change approximately `+7.69%`; favorable if confidence gates pass            |
| Comparable HR changes 150 to 145 BPM at fixed observed pace       | `-5 BPM`; favorable evidence, not a standalone fitness claim                       |
| First half 150 m/min at 140 BPM; second half 145 m/min at 145 BPM | Decoupling approximately `6.67%`; descriptive observation only                     |
| Valid HR but only activity summary is persisted                   | Every Gate 5 metric unavailable: `normalized_stream_not_persisted`                 |
| Intervals with excellent HR and pace streams                      | PB may qualify; comparable-aerobic and decoupling metrics excluded                 |
| Unclassified outdoor run with smooth data                         | `aerobic_intent_unverified`; Backend does not infer easy intent                    |
| Six comparable observations in both adjacent windows              | Evidence may be `established` if cohort/context gates pass                         |
| One fast comparable run                                           | Record may update; profile trend remains `insufficient_evidence`                   |
| Activity distance correction                                      | Old PB/aerobic observations invalidated; recalculated values cite the new revision |
| RPE-only correction                                               | PB and Gate 5 observations unchanged; load recomputes                              |

## 12. Runner-facing claim limits

Hito may say:

- "Your fastest Hito-observed 5K effort is 27:18.";
- "Your reported load was higher this week because you ran longer and rated sessions harder.";
- "Across comparable aerobic runs, your pace at approximately 145 BPM improved.";
- "Second-half efficiency loss was lower across comparable long aerobic runs.".

Hito must not say:

- "Your fitness increased 12%.";
- "Your heart is stronger.";
- "You are recovered / overtrained / at injury risk.";
- "You can now race X time.";
- "Your provider VO2max proves this trend.";
- "Your planned HR/pace target was observed.".

Every trend claim names the metric, units, windows, evidence count, confidence, cohort/context, and
material exclusions. Frontend and AI may explain accepted truth; neither may calculate a competing
value.

## 13. Remaining non-coaching decisions and next owner

This amendment completes coaching/formula meaning. It intentionally does not decide:

- whether a manual workout completion is itself a canonical activity;
- the technical entity/link that pins one RPE report to one activity revision;
- official-result confirmation, correction, and withdrawal lifecycle;
- retained audit behavior after deletion;
- runner-facing re-baseline interaction.

The next owner is **Architect** for a bounded readiness reconciliation: preserve Gate 4 as a
summary/activity-revision capability where honest, introduce the minimum canonical normalized
sample-set boundary required by calculated PB and Gate 5, and assign the remaining Product
lifecycle decisions without creating a competing activity truth. Backend implements only after that
boundary is accepted.

## 14. Evidence basis

### Source capability

- Current Hito source evidence in
  [garmin-fit-source.ts](../../../src/lib/runner-activity/garmin-fit-source.ts) declares
  `normalized_samples_persisted: false`; records being decoded by
  [parse-garmin-fit.ts](../../../src/lib/workout-result-import/parse-garmin-fit.ts) therefore do not
  yet satisfy Gate 5.
- Current
  [workout-log-actions.ts](../../../src/lib/workout-log-actions.ts) accepts saved completion RPE
  `1-10` and links it to planned-workout logging. Gate 4 still needs immutable attribution to one
  canonical activity revision before that value becomes profile-load truth.
- Current
  [runner-activity read model](../../../src/lib/runner-activity/read-model-types.ts) exposes factual
  Gate 1-3 truth and explicitly leaves derived coaching metrics unavailable. This amendment does
  not change that implementation state.
- [Garmin FIT Protocol](https://developer.garmin.com/fit/protocol/) establishes FIT as a structured,
  extensible activity format; Hito still requires its own normalized sample truth and provenance.
- [Garmin FIT activity decoding guidance](https://developer.garmin.com/fit/cookbook/decoding-activity-files/)
  describes record/session/lap and related message use; reading records is not equivalent to
  persisting a normalized stream.

### Research informing interpretation

- Buchheit et al.,
  [Minimally Invasive Ways to Monitor Changes in Cardiocirculatory Fitness in Running-based Sports](https://pubmed.ncbi.nlm.nih.gov/36332619/):
  standardized submaximal running HR can inform longitudinal monitoring, while protocol and context
  materially affect interpretation.
- Smyth et al.,
  [Decoupling of Internal and External Workload During a Marathon](https://pubmed.ncbi.nlm.nih.gov/35511416/):
  HR-speed decoupling is a useful endurance-durability observation with meaningful individual
  variation.
- Foster et al.,
  [Session-RPE method review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5673663/) and
  [25 Years of Session Rating of Perceived Exertion](https://pubmed.ncbi.nlm.nih.gov/33508782/):
  whole-session RPE multiplied by session duration is a practical internal-load estimate.
- Düking et al.,
  [Wearable optical HR validity review](https://pubmed.ncbi.nlm.nih.gov/32552580/), and
  [GNSS wearable validity review](https://pmc.ncbi.nlm.nih.gov/articles/PMC10007219/): sensor and
  environment limitations justify quality gates and metric-specific confidence rather than
  invented precision.

### Hito v1 product-policy choices

The interpolation limits, stream coverage, pause limits, reference buckets, duration bands,
observation counts, MAD floors, and controlled-duration threshold are conservative explainability
rules selected for Hito v1. They are not universal physiological laws. Changing any of them requires
a formula-version amendment and historical-readback decision.

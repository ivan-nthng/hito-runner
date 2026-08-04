# Hito Runner Profile Constitution

**Date:** 2026-07-30  
**Version:** 1.1
**Amended:** 2026-08-02
**Owner:** Running Coach for athlete-profile and progress meaning; Architect for system boundaries;
Backend for canonical computation  
**Status:** Canonical normative contract for athlete-profile and progress semantics; future
capabilities in this document are not implemented behavior  
**Plan file:** none

## 1. Authority

This document defines what an athlete profile means in Hito, which normalized runner and activity
facts may contribute to it, how progress is calculated, and how confidence and provenance must be
shown.

The constitution governs the athlete-profile and progress meaning consumed by:

- runner onboarding and settings;
- FIT and archive uploads;
- future Garmin, Strava, Polar, COROS, Suunto, Apple Health, and other provider ingestion;
- planned-versus-actual workout comparison;
- progress and record surfaces;
- AI coaching context and recommendations;
- future profile snapshots and comparisons.

Backend and Frontend must not introduce alternative progress formulas or redefine a profile metric
locally. A material change to a formula, eligibility rule, progress-source use, or runner-facing
meaning requires a versioned amendment to this constitution.

The
[Runner Activity Intelligence Formula Policy Amendment](2026-08-02-runner-activity-intelligence-formula-policy-amendment.md)
is the canonical v1 formula contract for personal bests, session-RPE load, and stream-dependent
aerobic metrics. It supersedes any less-specific or conflicting formula language below.

This document does not define a database schema, API shape, UI layout, medical assessment, or
training-plan algorithm.

### Related source-of-truth boundaries

- The
  [Provider Activity Ingestion And Comparison Contract](../product-briefs/2026-06-09-provider-activity-ingestion-and-comparison-contract.md)
  continues to own provider intake, raw preservation, normalization, source lifecycle,
  deduplication implementation, and planned-versus-actual requirements.
- The
  [Watch Execution Primary Target Doctrine](2026-07-20-watch-execution-primary-target-doctrine.md)
  continues to own planned workout pace/BPM command semantics, named guidance-band identity,
  accepted-profile revisions, contained custom subranges, and immutable target snapshots.
- This constitution owns longitudinal athlete-profile metrics, snapshot comparison, confidence, and
  runner-facing progress meaning.

If these documents appear to conflict, use the owner above rather than allowing a downstream layer
to reinterpret another layer's truth. Observed activity HR is never a planned HR target, and a
planned target is never evidence that the runner actually achieved that HR or pace.

## 2. Constitutional Principles

1. **The profile is longitudinal, not a label.** It describes how one runner changes over time; it
   is not a ranking against other runners.
2. **Observed facts stay separate from derived estimates.** Distance, duration, pace samples, and
   heart-rate samples are observations. Aerobic efficiency, durability, and load are calculations.
3. **No single metric is fitness.** Hito reports a small explainable profile: performance,
   aerobic efficiency, durability, consistency, load, and confidence.
4. **Comparable evidence before conclusions.** Faster running at the same heart rate is meaningful
   only when the activity portions and conditions are sufficiently comparable.
5. **Personal trend before population norm.** Hito compares the runner with their own prior
   profile. It does not shame, grade, or rank body size, pace, age, or experience.
6. **Missing data stays missing.** Hito does not invent pace, heart rate, elevation, weather,
   sensor quality, or physiological truth.
7. **Provider-neutral truth.** FIT upload, Garmin, Strava, and future integrations normalize into
   one activity language before metrics are calculated.
8. **One activity is counted once.** Multiple provider copies may support one canonical activity;
   they must not duplicate distance, sessions, records, or load.
9. **Provenance is part of every result.** Every derived metric retains its source activities,
   formula version, eligibility decisions, and confidence.
10. **Non-medical posture.** Hito describes training observations and trends. It does not diagnose,
    predict injury, prescribe treatment, or claim laboratory-equivalent fitness.

### Implementation reality

Current Hito supports local Garmin FIT/ZIP upload, workout-scoped actual summaries and laps,
planned-versus-actual comparison, and compact plan/log progress. It does not yet implement the
provider-neutral multi-source activity lifecycle, record-stream progress analysis, immutable
fitness snapshots, or the metrics defined below. All `must` statements for those capabilities are
normative future requirements, not claims about current runtime behavior.

## 3. Canonical Profile Layers

The canonical athlete-profile model must be composed of five linked layers.

| Layer | Meaning | Mutability |
| --- | --- | --- |
| Runner facts | User-approved identity, setup, goals, availability, and preferences | Versioned when changed |
| Activity truth | Canonical recorded or manually entered training events | Immutable event plus explicit corrections |
| Observation streams | Time-aligned distance, speed, heart rate, movement, elevation, and related samples | Immutable source evidence |
| Fitness snapshot | Derived state for a defined date/window using a named formula version | Immutable and reproducible |
| Progress comparison | Difference between two compatible snapshots | Recomputed only under an explicit metric-version amendment |

The current profile is the latest valid snapshot plus the latest runner facts. Historical snapshots
must remain readable after runner settings, body mass, heart-rate guidance, goals, or formulas
change.

## 4. Runner Facts

### 4.1 Required for every runner

| Fact | Why Hito needs it | Rule |
| --- | --- | --- |
| Stable Hito runner ID | Ownership and longitudinal continuity | Never use provider identity as the primary runner ID |
| Local timezone | Correct activity day and weekly aggregation | Preserve the timezone used for each historical activity |
| Running-history category | Coaching context and honest interpretation | User-approved, versioned |
| Current goal and goal style | Plan and recommendation context | Not physiological truth |
| Available running days and fixed rest constraints | Plan feasibility and completion interpretation | Explicit runner preference |
| Preferred units | Runner-facing readback | Never alter stored canonical units |
| Consent and connected-source state | Data-use boundary | Source-specific and revocable |

### 4.2 Optional but useful

| Fact | Allowed use | Prohibited use |
| --- | --- | --- |
| Date of birth or age | Age-aware coaching context and explicitly estimated HR guidance | Medical risk score or proof of fitness |
| Height | Descriptive profile and future biomechanics context | Pace correction or fitness ranking |
| Body mass | Optional time series and contextual interpretation | Fitness score, punishment, or automatic load verdict |
| Personal HR guidance profile | Workout target context when explicitly accepted | Retrospective rewriting of observed HR |
| Resting HR | Contextual trend when measured consistently | Diagnosis or readiness veto |
| Device-reported VO2max | Clearly attributed external estimate | Hito physiological truth or cross-device comparison without warning |
| Sleep, HRV, readiness | Optional context when source and measurement method are stable | Medical conclusion or automatic plan mutation |
| Notes and RPE | Runner-reported context | Objective physiological measurement |

Height and body mass are not required to calculate pace-at-heart-rate, aerobic efficiency,
durability, personal records, consistency, or volume. Body-mass change must be shown as its own
user-controlled time series, not folded into the primary running-progress result.

## 5. Canonical Activity Truth

### 5.1 Required for every canonical activity

| Group | Required facts |
| --- | --- |
| Identity | canonical activity ID, runner ID, source kind, provider name, provider activity ID or upload fingerprint |
| Time | started-at instant, local date, timezone, elapsed duration, timer duration when available |
| Sport | sport, sub-sport or running subtype when available, manual/recorded marker |
| Work | total distance, active duration when available |
| Provenance | ingestion time, source revision, device/provider metadata, data-quality state |
| Plan relation | planned workout ID when matched, otherwise explicitly unassigned |
| Deduplication | canonical fingerprint and links to all supporting source records |

An activity without a time stream may contribute to session count, duration, distance, and manually
verified race results. It must not contribute to stream-dependent physiology proxies.

### 5.2 Required for full progress analysis when available

Each ordered record should preserve:

- timestamp or time offset;
- cumulative distance;
- instantaneous or smoothed speed;
- heart rate;
- moving state and pause events;
- lap and planned-step references where available.

Garmin FIT record messages can carry timestamped heart rate, distance, speed, and cadence. Strava
activity streams can expose time, distance, velocity, heart rate, movement, altitude, grade, and
related series. Hito must normalize available fields without assuming every source supplies every
stream.

### 5.3 Contextual streams

Preserve when available:

- elevation or altitude;
- grade;
- cadence;
- running power and whether it was measured or estimated;
- temperature;
- GPS quality;
- sensor/device type;
- treadmill or indoor marker;
- terrain or surface classification;
- workout step, lap, and repeat boundaries.

Precise route coordinates are not required for the athlete progress profile. They are sensitive
location data and require an explicit product privacy purpose. Derived terrain, elevation, and route
class may be retained without exposing a home or exact route.

### 5.4 Runner-reported result

Hito should request after a completed or partial recorded session:

- whole-session RPE on a stable integer `1-10` scale; `0` is not a completed-run RPE;
- completion state: completed, partial, stopped, or skipped;
- optional short feeling/note;
- explicit correction when the imported activity is the wrong sport or incorrectly matched.

Absence of RPE must not invalidate device-derived activity truth.

## 6. Source Hierarchy and Deduplication

One real-world run may arrive from a FIT upload, Garmin sync, and Strava. The future provider-neutral
ingestion lifecycle must create one canonical activity and attach multiple source references.

Use the richest trustworthy source per field while preserving all provenance:

1. original device record stream or full-resolution FIT evidence;
2. provider full-resolution stream;
3. provider lap/split detail;
4. provider session summary;
5. user-confirmed manual result.

The hierarchy is field-specific, not activity-wide. For example, FIT may provide the best HR stream
while a user correction supplies the proper activity type. A lower-ranked source must not silently
overwrite a higher-quality observation.

Potential duplicates should be compared using runner, start time, elapsed duration, distance,
provider linkage, and file fingerprint. Hito must surface uncertainty rather than double count or
silently merge materially different activities.

Profile metrics must consume only canonical normalized activity truth. They must never calculate
directly from a raw FIT/provider payload or create a second provider-specific metric path.

The provider lifecycle owner must preserve:

- idempotent re-ingestion of the same source revision;
- explicit provider update/delete and source-supersession semantics;
- disconnect and retention behavior chosen by Product;
- reversible runner correction of a wrong merge or wrong plan assignment;
- reproducible metric invalidation/recalculation when canonical activity truth changes.

This constitution requires those properties for trustworthy profile metrics but does not define
their storage or implementation.

## 7. Metric Families

### 7.1 Participation and consistency

These metrics work without heart-rate streams.

| Metric | Definition |
| --- | --- |
| Completed sessions | Count of canonical completed running activities |
| Running frequency | Completed running activities per calendar week |
| Running time | Sum of timer duration for running activities |
| Distance | Sum of canonical running distance |
| Elevation gain | Sum only where elevation evidence exists |
| Longest run | Maximum canonical activity distance and duration, shown separately |
| Planned completion | Completed eligible planned sessions divided by eligible planned sessions |
| Current streak | Consecutive qualifying periods with at least one completed run; never a health score |

Planned completion must distinguish completed, partial, skipped, cancelled, and plan-changed
workouts. Rest days and workouts removed before their due date are not failed sessions.

### 7.2 Personal best efforts

Hito may calculate best continuous elapsed-time efforts for:

- `1 km`;
- `1 mile`;
- `5 km`;
- `10 km`;
- `15 km`;
- Half Marathon: `21,097.5 m`;
- Marathon: `42,195 m`;
- `50 km`;
- `50 mile`;
- `100 km`;
- `100 mile`;
- longest continuous distance.

Rules:

1. Use elapsed time for the continuous segment, not moving time with stops removed.
2. Use timestamped cumulative-distance evidence or a user-confirmed official result.
3. Do not interpolate across a recording gap, teleport, or implausible GPS jump.
4. Keep `race result`, `training best effort`, and `provider-reported best` distinct.
5. Preserve source, activity, segment start/end, elevation context, and confidence.
6. A manually entered result may be a record only when visibly labelled user-entered.
7. “Ultra” is not one distance. Show standard-distance records plus longest distance/duration.

### 7.3 Aerobic efficiency proxy

This is Hito's primary longitudinal physiology-adjacent running metric. It is a coaching proxy, not
VO2max, running economy measured in a laboratory, or a diagnosis.

For one eligible steady aerobic segment:

```text
estimated_heartbeats =
  sum(heart_rate_bpm[i] * sample_duration_seconds[i] / 60)

aerobic_efficiency_m_per_beat =
  segment_distance_m / estimated_heartbeats
```

V1 requires the stream-integrated formula and the quality gates in the formula-policy amendment.
Summary-only evidence is unavailable because it cannot prove coverage, pauses, stable intent, or
within-session behavior. A higher personal value means the runner covered more distance per
observed heartbeat in that eligible context.

Runner-facing wording:

> At a similar aerobic effort, you are covering more distance per heartbeat.

Hito must not claim:

> Your heart is X% stronger.

### 7.4 Pace at comparable heart rate

This is the clearest runner-facing expression of aerobic progress.

Establish a runner-specific reference HR bucket from eligible aerobic observations. The initial
reference is the rounded median heart rate from the first valid baseline window. Use one fixed
bucket for a comparison series; changing the bucket begins a new series.

V1 bucket rule:

```text
reference_hr = round_to_nearest_5_bpm(baseline_median_hr)
accepted_samples = reference_hr +/- 3 bpm
pace_at_reference_hr =
  accepted_sample_time / accepted_sample_distance
```

At least ten cumulative minutes of stable accepted samples are required inside an otherwise
eligible aerobic segment. Do not extrapolate to a heart rate the runner did not actually record.

Progress:

```text
pace_progress_pct =
  (baseline_speed_at_reference_hr / current_speed_at_reference_hr - 1) * -100
```

For implementation and display, prefer the less error-prone speed form:

```text
speed_progress_pct =
  (current_speed_at_reference_hr / baseline_speed_at_reference_hr - 1) * 100
```

Runner-facing example:

> At approximately 145 BPM, your comparable pace improved from 7:00/km to 6:30/km.

The result is omitted when the fixed bucket lacks enough recorded samples.

### 7.5 Heart rate at comparable pace

For a fixed personal pace bucket:

```text
hr_change_bpm =
  current_median_hr_at_reference_pace -
  baseline_median_hr_at_reference_pace
```

A lower observed HR at the same comparable pace may support an improving aerobic trend. It is not
interpreted alone because temperature, fatigue, hydration, terrain, sensor behavior, and other
conditions can change HR.

The reference pace must come from repeated observed aerobic running, not a desired race time.

### 7.6 Aerobic durability and decoupling

Durability describes how well external output is maintained relative to internal load as a
continuous aerobic session progresses.

For an eligible continuous session or main segment of at least 40 minutes, divide the analysis
portion into equal elapsed-time halves after excluding the entry/warm-up and non-running events.

```text
efficiency_first =
  speed_m_per_min_first / mean_hr_bpm_first

efficiency_second =
  speed_m_per_min_second / mean_hr_bpm_second

decoupling_pct =
  (efficiency_first - efficiency_second) / efficiency_first * 100
```

Positive decoupling means efficiency fell in the second half. Lower personal decoupling across
comparable sessions generally supports improved durability. Negative or unusually large values
must be treated cautiously because terrain, stops, progressive workout intent, weather, and sensor
noise can dominate the calculation.

Do not:

- calculate this for intervals, progression runs, races, or deliberate steady finishes;
- compare flat road with trail, mountain, or treadmill;
- present one universal pass/fail threshold;
- treat decoupling as injury, recovery, or race-readiness proof.

### 7.7 Controlled aerobic duration and distance

Measure the longest continuous eligible aerobic duration and distance achieved within the fixed
reference-HR series without a material pace collapse or data-quality failure.

This metric answers:

> How long can the runner sustain comparable aerobic work?

It complements pace-at-HR. A runner may improve by running faster at the same HR, longer at the same
HR, or both.

### 7.8 Session load

When whole-session RPE exists, Hito may calculate session-RPE load:

```text
session_load_au = actual_observed_duration_minutes * runner_reported_session_rpe_1_to_10
```

This is an arbitrary-unit internal-load estimate. It is useful for comparing the same runner's
training pattern and for showing that two sessions of equal distance may feel different.

It must not:

- be converted into calories or physiological stress;
- predict injury;
- silently veto a plan;
- be compared as an absolute score between runners;
- replace the observed duration, distance, HR, or runner comment.

### 7.9 Body and contextual trends

Optional body mass, resting HR, sleep, HRV, and provider readiness must be displayed as separate
contextual time series with source and measurement method.

They may explain why confidence is lower or why two activities differ. They must not be silently
combined into an opaque Hito fitness or readiness score.

## 8. Comparable-Aerobic Segment Eligibility

An activity portion is eligible for aerobic efficiency, pace-at-HR, and HR-at-pace only when all
applicable conditions pass.

| Gate | V1 rule |
| --- | --- |
| Intent | Easy, recovery, steady-aerobic, continuous long aerobic, or an unstructured run classified as steady aerobic |
| Stable duration | At least 20 continuous minutes after warm-up |
| HR coverage | At least 90% of analyzed time has plausible HR samples |
| Speed/distance coverage | At least 90% of analyzed time has usable speed or cumulative distance |
| Pauses | No pause longer than 30 seconds; total paused time no more than 5% of analyzed duration |
| Structure | Exclude intervals, strides, hills, races, progression, deliberate fast finish, and run/walk transitions |
| Terrain class | Compare road-flat/rolling, trail/mountain, treadmill, and track separately |
| Grade | Exclude materially hilly segments from flat-road pace-at-HR unless the same route class is used |
| Environment | Preserve temperature and weather when available; reduce confidence for materially different conditions |
| Sensor continuity | Reject obvious dropouts, impossible values, and GPS jumps; never fabricate samples |
| Fatigue context | Preserve prior-day/plan context when available, but do not automatically invalidate the observation |

The numeric gates above are product coaching policy, chosen for an explainable conservative v1.
They are not universal physiological laws. Any change requires a formula-version amendment and
backfill decision.

For true beginners using Run/Walk, Hito must initially show consistency, total runnable time,
run/walk completion, and RPE. Pace-at-HR begins only after eligible continuous aerobic segments
exist.

## 9. Snapshot Windows

The future profile lifecycle must maintain compatible snapshots rather than continually mutating one
score.

| Snapshot | Window | Purpose |
| --- | --- | --- |
| Weekly activity | Calendar week | Frequency, time, distance, elevation, completion |
| Current training | Rolling 28 days | Volume, consistency, RPE load, current comparable-aerobic evidence |
| Baseline fitness | First qualifying 28-day window or explicit re-baseline | Personal reference for efficiency, pace-at-HR, HR-at-pace |
| Current fitness | Latest qualifying 28-day window | Current aerobic proxy and durability |
| Long trend | Rolling 90 days | Direction and stability, not an additional fitness score |
| Lifetime records | Entire accepted history | Personal bests and longest efforts |

A 28-day window without enough eligible activities still produces volume and consistency. It must
show aerobic metrics as unavailable rather than carrying forward an old value as current.

## 10. Confidence

Every derived metric has its own confidence; the profile does not have one universal confidence.

### 10.1 Evidence count

| Level | Comparable evidence |
| --- | --- |
| Insufficient | Fewer than 3 eligible observations in either comparison snapshot |
| Provisional | 3-5 eligible observations in each snapshot |
| Established | At least 6 eligible observations in each snapshot |

### 10.2 Confidence modifiers

Reduce confidence for:

- attributed/manual evidence rather than normalized source evidence, where the metric permits it;
- mixed optical and chest-strap HR sources;
- materially different terrain, temperature, or elevation;
- substantial GPS smoothing or stream downsampling;
- treadmill pace without calibrated distance;
- mixed workout intent;
- changed reference HR or pace;
- long gaps between comparison windows.

Do not reduce confidence merely because the runner is slow, new, older, heavier, or has no race
result.

### 10.3 Trend states

| State | Meaning |
| --- | --- |
| `insufficient_evidence` | Hito cannot establish direction |
| `provisional_improving` | Direction is favorable but evidence is limited |
| `improving` | Multiple compatible metrics and established evidence support improvement |
| `stable` | Change is within personal measurement variability |
| `mixed` | Metrics move in different directions or contexts differ |
| `declining_observation` | Repeated comparable observations moved unfavorably; not a diagnosis |

Hito must not assign “declining” from one activity. The runner-facing explanation must name the
metrics and comparison windows that produced the state.

## 11. Profile Comparison

A progress comparison contains:

- baseline snapshot ID and date range;
- current snapshot ID and date range;
- metric name and formula version;
- baseline value;
- current value;
- absolute and percentage change where meaningful;
- eligible activity IDs;
- excluded activity count and reason classes;
- confidence;
- contextual differences;
- plain-language explanation.

Recommended runner-facing summary:

```text
Aerobic progress: improving

At approximately 145 BPM:
6:58/km -> 6:31/km

Controlled aerobic duration:
42 min -> 68 min

Durability:
less second-half efficiency loss

Confidence: established
Based on 7 comparable runs in each period.
```

Never show a positive percentage without the original units and comparison context.

## 12. Hito Athlete Progress Summary

Hito may present one summary state, but it is a narrative classification, not a hidden arithmetic
score.

The summary considers:

- pace at comparable HR;
- HR at comparable pace;
- aerobic efficiency;
- durability;
- controlled aerobic duration;
- recent performance records;
- consistency and training continuity;
- confidence and context.

The summary must not average unlike metrics into `0-100`, assign a league, predict race time without
a separate accepted prediction contract, or imply that more weekly load always means better
fitness.

## 13. Planned-versus-Actual and Coaching Recommendations

Activity progress and workout compliance are related but different:

- `planned-versus-actual` asks whether the runner executed the assigned session;
- `athlete progress` asks how the runner's observed capabilities change over time.

A session may miss its planned target but still provide useful progress evidence. A perfectly
completed workout may be excluded from aerobic comparison because it was intervals or hills.

Recommendations may use profile metrics only when:

- the metric is not `insufficient_evidence`;
- source and confidence are supplied;
- the recommendation names the observed fact;
- no medical or injury conclusion is made;
- no plan is silently mutated.

AI may explain accepted profile truth. It must not calculate a competing metric, invent missing
samples, overwrite the canonical snapshot, or treat an estimated provider value as measured Hito
truth.

## 14. Heart-Rate Truth

Observed activity HR and planned HR guidance are separate:

- observed HR comes from the activity source and retains sensor provenance;
- estimated or personal guidance bands come from the runner's accepted HR profile;
- confirmed workout BPM commands retain immutable profile snapshots;
- changing HR guidance does not rewrite past workouts or past activity observations.

Aerobic progress calculations use observed HR. They do not require the observed HR to fall inside a
named guidance band, and they do not relabel estimated bands as personal physiology.

Planned-target band names, revisions, full-band versus contained-subrange rules, and immutable
confirmed target snapshots remain governed by the Watch Execution Primary Target Doctrine and
heart-rate profile contract. This profile constitution does not redefine them.

## 15. Privacy and Runner Control

Hito must follow data minimization:

- request only data needed for a visible product purpose;
- make connected-provider scopes clear;
- allow revocation and provider disconnection;
- preserve already accepted activity truth according to explicit retention policy;
- protect exact routes and home-adjacent coordinates;
- distinguish user-entered, device-observed, provider-derived, and Hito-derived values;
- allow the runner to correct an activity match without silently changing source evidence;
- never expose private profile or activity data to another runner without explicit product consent.

Deletion, export, retention, and provider revocation are Product/Architecture decisions that must
preserve this semantic separation.

## 16. Prohibited Behavior

Hito must not:

- call aerobic efficiency `VO2max`;
- diagnose cardiovascular health, overtraining, injury, illness, or recovery status;
- claim body-mass loss is automatically improved running fitness;
- invent precise pace, HR, elevation, temperature, cadence, power, or GPS samples;
- merge activities merely because their dates match;
- count a Garmin/Strava/FIT duplicate more than once;
- compare treadmill, trail, mountain, and flat-road pace as one homogeneous series;
- use moving time to create an inflated personal best;
- treat an age-estimated HR range as measured personal physiology;
- present one activity as a confirmed fitness trend;
- hide uncertainty behind an opaque score;
- backfill historical metrics under a new formula without recording the new version;
- let Frontend, AI, or a provider independently redefine a canonical metric.

## 17. Metric Versioning and Amendments

Every calculated snapshot records:

- `constitution_version`;
- `metric_formula_version`;
- calculation timestamp;
- source activity IDs and source revisions;
- eligibility/exclusion results;
- reference HR or pace series ID where applicable;
- confidence inputs;
- calculation owner.

An amendment that changes arithmetic, eligibility, source priority, or runner-facing meaning must:

1. update this constitution;
2. assign a new metric formula version;
3. state whether historical snapshots remain frozen or are recomputed;
4. preserve the old formula description for historical readback;
5. include Backend fixtures for boundary cases;
6. include QA proof that Backend, export/readback, and Frontend show the same values.

Copy, layout, and explanation improvements that do not alter meaning do not require a formula
version.

## 18. Ownership

| Owner | Responsibility |
| --- | --- |
| Running Coach | Coaching meaning, metric interpretation, comparability, safety language |
| Product | Consent, runner-facing purpose, retention, correction and deletion policy |
| Architect | Canonical entities, source hierarchy, lifecycle, provider-neutral boundaries |
| Backend | Normalization, deduplication, metric computation, versioning, immutable snapshots |
| Frontend | Render backend-owned truth, confidence, context, and unavailable states |
| QA | Cross-source fixtures, formula parity, deduplication, export/readback, boundary validation |
| AI authoring/recommendation | Explain supplied profile truth without redefining it |

The first implementation owner after this doctrine is **Architect**, because activity truth,
observation streams, snapshots, source revisions, privacy, and deduplication cross the existing
provider-import and runner-profile boundaries.

## 19. Backend and QA Acceptance Fixtures

The future implementation must cover at minimum:

| Fixture | Expected result |
| --- | --- |
| Same run from FIT and Strava | One canonical activity, two sources, one contribution to totals |
| 5 km then 10 km at similar HR with faster current pace | Improved efficiency and controlled duration when contexts qualify |
| Faster hot-weather run at higher HR | Context shown; no automatic aerobic improvement conclusion |
| Flat road versus hilly trail | Separate comparison classes |
| Interval workout with excellent pace | Personal best may qualify; aerobic efficiency comparison does not |
| Run/Walk beginner | Consistency and duration available; pace-at-HR unavailable until continuous evidence exists |
| Missing HR stream | Volume and records available; HR-dependent metrics unavailable |
| HR dropout or GPS teleport | Affected segment excluded with reason |
| One exceptionally fast run | Record may update; fitness trend remains provisional or unchanged |
| Deliberate progressive long run | Excluded from plain decoupling comparison |
| Same pace with lower HR across comparable windows | HR-at-pace supports improvement with confidence |
| Lower body mass with unchanged running evidence | Body trend changes; running progress does not change automatically |
| Provider VO2max changes | Shown only as provider estimate; Hito profile metrics remain independent |
| Formula amendment | Old snapshot remains attributable; new snapshot uses new formula version |

## 20. Evidence Basis

### Established technical source capability

- [Garmin FIT Protocol](https://developer.garmin.com/fit/protocol/) documents timestamped record
  messages containing heart rate, distance, speed, cadence, and extensible fields.
- [Garmin FIT activity decoding guidance](https://developer.garmin.com/fit/cookbook/decoding-activity-files/)
  describes activity files containing record, session, lap, sensor, GPS, target, and related
  messages.
- [Strava API reference](https://developers.strava.com/docs/reference/) documents detailed
  activities, laps, best efforts, and time, distance, velocity, heart-rate, movement, altitude,
  grade, and other streams.

### Scientific evidence informing the metrics

- Buchheit et al.,
  [Minimally Invasive Ways to Monitor Changes in Cardiocirculatory Fitness in Running-based Sports](https://pubmed.ncbi.nlm.nih.gov/36332619/),
  systematic review: standardized submaximal running HR can help monitor fitness changes, but
  protocol and context affect interpretation.
- Smyth et al.,
  [Decoupling of Internal and External Workload During a Marathon](https://pubmed.ncbi.nlm.nih.gov/35511416/):
  HR-speed decoupling provides a useful endurance-durability construct in recreational runners.
- Foster et al.,
  [A New Approach to Monitoring Exercise Training](https://pubmed.ncbi.nlm.nih.gov/11708692/),
  and the later
  [session-RPE review](https://pmc.ncbi.nlm.nih.gov/articles/PMC5673663/):
  session duration multiplied by whole-session RPE is a practical internal-load estimate.

### Coaching and product-policy choices

The following are conservative, explainable Hito v1 rules rather than universal physiological
laws:

- 20-minute minimum comparable aerobic segment;
- 40-minute minimum durability segment;
- 90% HR and speed coverage;
- 30-second maximum individual pause and 5% total paused time;
- fixed `reference_hr +/- 3 BPM` sample bucket;
- three observations for provisional and six for established confidence;
- 28-day fitness windows;
- no opaque composite fitness score.

These choices require product evidence and versioned amendment before they are relaxed or changed.

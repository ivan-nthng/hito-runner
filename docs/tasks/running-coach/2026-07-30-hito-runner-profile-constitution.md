# Hito Runner Profile Constitution

**Date:** 2026-07-30  
**Version:** 1.2
**Amended:** 2026-08-23
**Owner:** Running Coach for athlete-profile and progress meaning; Architect for system boundaries;
Backend for canonical computation  
**Status:** Canonical normative contract for runner-profile, progress, future Fitness Index and
Training Readiness semantics. The public Snapshot v1 contract is implemented; explicitly future
capabilities remain non-implementation policy.
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

The current implemented factual boundary is
[`RunnerFitnessProfileSnapshotV1`](../../../src/lib/runner-activity/product-contract.ts) and its
purpose-limited projections in the Runner Activity Product contract. The
[Dynamic Continuation Authoring Decision](../backlog/2026-08-18-hito-adaptive-blueprint-four-week-detail-engine.md#dynamic-continuation-authoring-decision--2026-08-22)
retains `ContinuationProgressProfileV1` as historical pre-HITO-253 decision vocabulary. It is
superseded for current consumers by `RunnerFitnessProfileContinuationProjectionV1`, as defined by
the HITO-253 Architecture Receipt below and implemented in the public contract. The engine consumes
that frozen factual projection and versioned policy inputs; it never consumes Progress UI
aggregates, a Fitness Index, a Training Readiness label, or an AI-created score as source truth.

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
3. **No raw metric or opaque composite is fitness.** Hito reports an explainable factual profile.
   A future optional Fitness Index may derive a long-term view only under one Product-accepted,
   versioned and fully attributable formula; it never replaces the profile.
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

Current Hito implements one provider-neutral `RunnerFitnessProfileSnapshotV1` public factual
contract and accepted purpose-limited projections from existing Calendar, Result/Evidence, Runner
Activity and Identity/Profile facts. FIT remains the current actual-evidence adapter. Normalized
record streams, stream-derived comparable performance, a Fitness Index formula and a named Training
Readiness product contract are not established by this coaching policy. Their `must` statements
below are normative future requirements unless a later accepted source receipt proves otherwise.

## 3. Canonical Profile Layers

The canonical athlete-profile model is composed of seven linked layers. The last two are derived
consumers and never become a second factual profile.

| Layer | Meaning | Mutability |
| --- | --- | --- |
| Runner facts | User-approved identity, setup, goals, availability, and preferences | Versioned when changed |
| Activity truth | Canonical recorded or manually entered training events | Immutable event plus explicit corrections |
| Observation streams | Time-aligned distance, speed, heart rate, movement, elevation, and related samples | Immutable source evidence |
| Runner Fitness Profile Snapshot | Provider-neutral factual and derived metric state for a defined cutoff/window using named formula versions | Immutable and reproducible |
| Progress comparison | Difference between two compatible snapshots | Recomputed only under an explicit metric-version amendment |
| Fitness Index | Future optional explainable long-term view derived from one frozen Snapshot and an accepted Index formula | Immutable result per Snapshot/formula version; may be unavailable |
| Training Readiness | Short-term decision state for one requested planning action using a frozen Snapshot plus fresh check-in and current decision facts | Recomputed per request; retained only as decision provenance, never as mutable fitness state |

The current Profile is the latest valid Snapshot. A newer runner fact creates a new Snapshot rather
than being joined as mutable side state. Historical snapshots must remain readable after runner
settings, body mass, heart-rate guidance, goals, or formulas change. Fitness Index is not an input
to the Profile, and Training Readiness is not a long-term metric.

### 3.1 Profile, Fitness Index and Training Readiness

- **Runner Fitness Profile** answers `What factual runner, training, evidence, coverage and
  constraint state did Hito know at this cutoff?` It is the single source of reusable factual input.
- **Fitness Index** may later answer `What long-term direction do the accepted comparable components
  support?` It is a transparent derived view tied to one Snapshot, reference/current windows,
  formula version, source coverage, exclusions, confidence and reasons. It may be unavailable and
  must not feed the engine as a stronger fact than its components.
- **Training Readiness** answers `Does Hito have current, non-conflicting facts and a fresh runner
  check-in to prepare this specific proposal for review?` It is a purpose-versioned admission or
  abstention state, not a claim that the runner is healthy, recovered, safe to train or fit for a
  race.

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

The profile lifecycle maintains compatible snapshots rather than continually mutating one score.

| Snapshot | Window | Purpose |
| --- | --- | --- |
| Weekly activity | Calendar week | Frequency, time, distance, elevation, completion |
| Current training | Rolling 28 days | **Primary evidence for current training:** volume, consistency, outcomes, RPE-load coverage and current comparable-performance eligibility |
| Latest-five inspection | Latest five eligible accepted actual activities, regardless of the exact date span | Fresh context and factual inspection only; never a standalone trend, confidence denominator or current-state replacement |
| Comparable baseline | First qualifying 28-day window or explicit re-baseline | Personal reference for efficiency, pace-at-HR, HR-at-pace and a future accepted Fitness Index |
| Current comparable | Current qualifying rolling 28-day window | Current comparable metric evidence against the fixed reference |
| Long context | Rolling 90 days | Baseline/stability, weekly-distribution and observed-longest context; never a mechanical average or an additional fitness score |
| Lifetime records | Entire accepted history | Personal bests and longest efforts |

A 28-day window without enough eligible activities still produces volume and consistency. It must
show aerobic metrics as unavailable rather than carrying forward an old value as current.

Window precedence is unambiguous:

1. The rolling current 28 days owns the current-training statement.
2. Latest five may explain what happened most recently, but it cannot create an independent trend,
   denominator, confidence level or override of the 28-day state.
3. Rolling 90 days supplies baseline, stability, weekly-distribution and observed-ceiling context.
   It must not average older weak or strong weeks into a conclusion that outweighs current 28-day
   evidence.

Current Calendar outcomes and runner constraints participate as attributed factual context. A
completion-only outcome does not become actual performance evidence, and a missed/skipped outcome
is not a negative pace or fitness value. Comparable performance participates only when its
metric-specific intent, stream, terrain/context, duration and coverage gates pass. Missingness and
confidence remain per component or metric; no window can silently repair another window's missing
fact.

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

### 10.4 Fitness Index availability and confidence

The future Fitness Index uses its own state, not the Profile component-state vocabulary as a hidden
score:

| State | Required meaning |
| --- | --- |
| `unavailable` | No Product-accepted Index formula exists, or a formula-required component/window is missing, updating, contradictory or below its admitted evidence floor. Show the exact reason. |
| `provisional` | An accepted formula can be evaluated, but at least one required contributing comparison is provisional or has a declared material coverage/context limitation. Name the limiting components and counts. |
| `established` | Every formula-required component meets its established evidence rule in the named reference/current windows, required coverage is present and no material conflict remains. This is still a training-evidence classification, not physiological certainty. |

An optional component may be absent without blocking the Index only when the accepted formula names
it as optional and defines the missing-data behavior. Frontend or AI cannot make that decision at
runtime. The Index result retains Snapshot ID, Index formula version, component formula versions,
current/reference windows, source coverage, eligible/excluded counts, confidence inputs and every
unavailable/provisional reason.

**Undecided Product gate:** before any Fitness Index implementation or runner-facing label, PRODUCT
must accept the user question and output form (categorical or numeric), required versus optional
components, exact combination arithmetic and any weights/scaling, reference and re-baseline rules,
minimum coverage, missing/conflict propagation, historical freeze versus recomputation policy, and
safe explanatory wording. Until that complete versioned decision exists, the Fitness Index is
`unavailable` with `fitness_index_formula_not_accepted`; no Backend, Frontend or AI fallback is
permitted.

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

## 12. Fitness Index And Runner Progress Explanation

The former `Hito Athlete Progress Summary` is the runner-facing explanation layer for the future
Fitness Index, not a fourth profile/readiness concept. Until PRODUCT accepts the complete Index gate
in Section 10.4, Progress may narrate individual factual components but must not label a composite
Fitness Index or imply one was calculated.

An accepted Index formula may consider:

- pace at comparable HR;
- HR at comparable pace;
- aerobic efficiency;
- durability;
- controlled aerobic duration;
- recent performance records;
- consistency and training continuity;
- confidence and context.

The explanation must show whether the Index is unavailable, provisional or established; name the
current and reference windows; list the components used and missing; retain formula/source coverage
and confidence; and say why the state was produced. It must not average unlike metrics into `0-100`
without the undecided Product formula gate, assign a league, predict race time, or imply that more
weekly load always means better fitness.

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

### 13.1 Training Readiness

Training Readiness is a short-term Training Decision state for one named request, such as an
adaptive continuation or one-off workout. It answers whether Hito has sufficient current factual
and runner-entered context to prepare a proposal for review. It does not answer whether the runner
is medically safe, recovered, injury-free or physiologically ready, and it is independent of
whether a Fitness Index is available.

Every readiness evaluation requires:

1. one current `RunnerFitnessProfileSnapshotV1` assembled and frozen at the request's runner-local
   cutoff, with current source fingerprints and policy/formula versions;
2. the rolling current 28-day component as primary training evidence, latest-five as complete
   inspection context through that cutoff, and rolling 90 days only as baseline/stability/observed-
   ceiling context;
3. every purpose-required recent Calendar outcome and evidence fact resolved according to that
   decision policy; an absent result is never inferred as missed or completed;
4. one request-specific check-in submitted on the same runner-local date as the decision and after
   the latest relevant Calendar, Result/Evidence or constraint revision. It must explicitly confirm
   current goal/intent, availability/constraints and whether injury, sickness, pain or a clinician
   restriction currently affects running as `no`, `yes` or `unsure`.

A new relevant outcome, evidence correction/removal, Calendar mutation, constraint change or local-
date rollover makes the readiness input stale. A reviewed candidate retains the old decision only
as provenance and must be re-evaluated before confirmation under the existing freshness contract.

The purpose-versioned decision returns one of these non-medical states:

| State | Meaning and permitted behavior |
| --- | --- |
| `review_ready_factual` | All request-required facts and check-in fields are current and non-contradictory, and the purpose-specific factual evidence floor passes. Hito may prepare a reviewable proposal and cite the exact facts used. |
| `review_ready_constraint_only` | The purpose policy explicitly allows a conservative/Blueprint-faithful proposal from current constraints and check-in while performance evidence is unavailable or insufficient. Hito must say that no performance adaptation occurred. |
| `follow_up_required` | A resolvable explicit choice, recent outcome or check-in field is missing, or a required factual component is updating. Ask one exact question or wait for refresh; create no candidate. |
| `no_prescription` | The check-in is `yes`/`unsure` for a current limitation, required evidence is stale/contradictory, or the request is unsupported by its accepted policy. Explain the exact reason; create no candidate and make no AI/provider call. |

Purpose-specific evidence floors remain distinct. Adaptive continuation retains its accepted
complete-outcome/check-in and bounded fact-shaped change gates. The Section 21 Rest-day one-off rule
retains its stricter current-duration evidence gate. A missing Fitness Index never blocks an
otherwise admitted constraint-only decision, and an established Fitness Index never overrides a
missing check-in, current constraint or `no_prescription` result.

The decision record retains Snapshot ID, readiness policy version, check-in revision/time, Calendar
and Result/Evidence fingerprints, facts used, facts missing, conflicts and abstention reasons. The
engine consumes the frozen Profile projection plus these explicit decision inputs. Progress UI
aggregates, Fitness Index output and AI-generated conclusions are never engine evidence. Readiness
cannot mutate a plan or Calendar; only the existing Review and explicit Confirm flow may
materialise a runner-owned workout.

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

## 21. HITO-253 Runner Fitness Profile Snapshot v1 Decision — 2026-08-23

### Decision

Hito uses one immutable, provider-neutral **Runner Fitness Profile Snapshot v1** public contract. It
is the reusable factual context envelope for Progress, adaptive continuation and future planning
decisions. It is not a Fitness Index, health/readiness score, injury-risk model or race prediction.

The Snapshot reuses accepted Result/Evidence and Calendar facts. It must not parse raw provider
content, calculate a second version of an existing metric, treat a Blueprint projection as a
workout, or authorize a Calendar mutation. Current Progress facts are available through the
[Evidence and Progress Product contract](../backlog/2026-08-21-hito-evidence-progress-product-contract.md),
while normalized record streams and stream-derived aerobic metrics remain unavailable in the
[current system](../../current-system.md). The continuation engine consumes the frozen
`RunnerFitnessProfileContinuationProjectionV1`, not a competing profile, Fitness Index or UI
aggregate.

### Minimum Snapshot Components

| Component | Minimum factual content | Coaching meaning and boundary |
| --- | --- | --- |
| Identity and cutoff | Runner ID; runner-local timezone; `as_of` and inclusive cutoff; snapshot/profile-definition version; runner-facts revision | Fixes whose facts and which historical day the snapshot represents. It carries no coaching conclusion. |
| Constraints and self-report | Running-history category; current goal/style; availability and fixed/flexible Rest constraints; preferred units; current check-in limitation state; source, consent and last-confirmed time for every runner-entered fact | Self-report stays attributed and separate from device observation. Stale, missing or contradictory constraints are explicit. |
| Recent state | Current rolling 28 days and immediately preceding 28 days: accepted running days/sessions, timer duration, distance, evidence-backed elevation gain, longest observed distance/duration, weekly distribution, factual Calendar outcomes and session-RPE-load coverage | Describes recent recorded training. It does not assert fitness, readiness or safe capacity. Missing actual evidence is not zero. |
| Recent activity inspection | The latest five eligible accepted actual-running activities, in runner-local chronological order, with date, outcome/evidence state and only the observed duration, distance, average pace/HR, elevation and reported RPE that are present | **Valid only as a recent-facts inspection slice.** Five activities are not a time window, denominator, trend or confidence threshold. Show fewer when fewer exist, state the exact covered dates and never silently replace the 28-day view. |
| Observed training history and load | Rolling 90-day weekly running-day/duration/distance distribution; longest accepted actual duration and distance with date; current/prior 28-day session-RPE load with activity and RPE coverage; accepted record facts with date and evidence source | This is evidence of what was recorded, not proof of what the runner can now sustain. A record is not a current-fitness conclusion. Session-RPE load remains an internal-load estimate, never an injury-risk model. |
| Comparable performance | Accepted pace/HR, HR/pace, aerobic-efficiency or durability observations only inside a versioned comparable cohort with required stream quality, workout intent, duration and terrain/context gates | Current v1 must return `unavailable` for stream-derived comparisons while normalized streams are absent. Per-activity summary pace or average HR may be shown as an observation, but must not be converted into a trend or improvement claim. |
| Missingness and confidence | Per component: `available`, `partial`, `unavailable`, `updating`, `not_applicable` or `contradictory`; included/excluded counts and reasons; source coverage and staleness | Factual totals use completeness/coverage, not a confidence score. Comparative metrics alone use the existing `<3 insufficient`, `3–5 provisional`, `6+ established` rule in each cohort/window. There is no overall profile confidence. |

At current product capability, an actual-performance observation must be accepted current
Result/Evidence. FIT is the current actual-evidence adapter; its raw shape never enters the profile.
A non-FIT completed, partial, skipped or missed Calendar workout may contribute only its factual
outcome and runner-reported RPE/check-in. It must not manufacture actual duration, distance, pace,
HR, terrain or execution quality.

### Permitted Evidence And Prohibited Inference

The snapshot may use canonical activity identity and revision, timer duration, distance, accepted
average pace/HR observations, normalized terrain/context when a future provider-neutral fact owns
them, elevation, Calendar outcome, runner-reported RPE, and provider-neutral provenance/quality
states created from the available FIT/provider structure. Comparable metrics may use record-stream
facts only after the accepted normalization, quality and cohort gates are satisfied.

It must never infer or backfill:

- health, illness, injury, recovery, readiness, safe training capacity or medical clearance;
- VO2max, threshold, maximum HR, race time, body-composition effect or an opaque fitness score;
- workout intent, terrain, surface, weather, RPE, completion or effort from pace, title or absence
  of evidence;
- a zero from a missing observation, a trend from one activity, or improvement from unrelated
  workout types, terrain, duration or conditions;
- a prescription from a Blueprint projection, a provider estimate, an unmatched activity, or a
  scheduled completion without accepted actual evidence.

Contradictory evidence is retained as a conflict between attributed revisions. Hito must not choose
the more convenient value or ask AI to reconcile it.

### Formula, Provenance And Reuse Rules

Every snapshot is immutable and reproducible from one complete cutoff. A new or corrected fact
creates a new snapshot/revision; there is no mutable `current fitness` row. Each calculated field
records its formula version independently. The snapshot also records the profile-definition and
constitution versions, `as_of`, timezone/cutoff, runner-facts revision, contributing canonical
activity/evidence/outcome revisions or their deterministic fingerprints, eligibility/exclusion
results, missing/conflict reasons, calculation time and calculation owner.

Provider source remains provenance, not model structure. Equivalent normalized facts produce the
same profile meaning regardless of source. A formula, eligibility or meaning change requires a new
version and preserves the historical snapshot under its original version.

Progress, continuation and future one-off authoring receive purpose-limited projections of the same
snapshot, with the same fact values, versions and missing states. Backend owns calculation. A
deterministic policy gate decides whether an authoring request is admitted before AI is called. AI
may explain or compose from supplied admitted facts; it may not calculate the profile, fill missing
facts, reinterpret a conflict or override a `no_prescription` result.

### Future Rest-Day Request Policy

For a request such as `I want to run 90 minutes`, the number `90` is a runner preference, not proof
that the duration is suitable. Before a reviewable preview can be prepared, Hito needs these
explicit runner choices:

1. the intended Calendar date, unless the runner invoked the request from one unambiguous date;
2. the intended effort/purpose; automatic v1 admission is limited to a runner-selected
   easy/conversational run, with no pace or HR target inferred;
3. confirmation that the Rest constraint is flexible for this one request; existing nearby
   Calendar workouts remain unchanged regardless;
4. a current limitation check-in of `none`; `present`, `unsure` or unanswered is not medical input
   for Hito to interpret and produces no prescription.

Hito may safely reuse timezone, units, selected-date occupancy, current goal/constraints and the
accepted snapshot. It must not infer why the Rest day exists, that the runner can safely tolerate
90 minutes, a suitable pace/HR, or permission to move another workout.

The deterministic v1 gate may return a reviewable **easy-duration preview** only when all explicit
inputs above are resolved, the snapshot is current and non-contradictory, at least three accepted
actual-duration runs exist in the current 28-day window, and the requested duration does not exceed
the longest accepted actual duration in the rolling 90-day window. These are conservative Hito
product admission rules, not physiological laws or safety guarantees. The preview must cite the
dates/counts used and continue through the existing server-owned Review and explicit Confirm flow
before one runner-owned Calendar workout exists.

Ask one focused follow-up when a user choice is missing or when the runner says a recent qualifying
activity is absent and may need factual correction. Return `no_prescription`, create no review
candidate and explain the exact reason when the limitation check is `present`/`unsure`, the snapshot
is stale or contradictory, fewer than three current actual-duration runs exist, the requested
duration exceeds the accepted 90-day longest duration, or the only support is a schedule,
projection, self-estimate or missing evidence. Hito may offer a shorter runner-chosen duration or
stop, but must not invent a substitute prescription.

### Runner Explanation And Coach Acceptance

The runner-facing explanation should remain one compact evidence card:

> Based on [count] accepted recorded runs from [date] to [date]. Duration is available for [count]
> and RPE for [count]. Your longest accepted recorded duration in the last 90 days is [value] on
> [date]. [Metric] is unavailable because [specific missing/comparability reason]. This is recorded
> training context, not a health or readiness score.

For a one-off request, add the requested date/duration, the Rest override, the exact admission or
abstention reason, and `No Calendar workout is created until you review and confirm.` Do not expose
raw provider fields, internal fingerprints or formula internals.

RUNNING COACH acceptance requires all of the following:

- the same versioned normalized facts produce the same snapshot and explanation;
- the latest-five slice names its exact dates/count and never drives a trend, load or fitness claim;
- non-FIT completion never creates actual performance evidence, and missing never becomes zero;
- absent streams keep pace/HR efficiency and durability unavailable rather than estimated;
- conflicting revisions remain visible and block affected advice;
- every comparison shows cohort, denominator, window, exclusions, confidence and factual wording;
- the 90-minute policy has review-ready, focused-follow-up and no-prescription fixtures at every
  boundary, with no pace/HR inference;
- a preview, rejected request or future Blueprint projection cannot write or mutate Calendar;
- only explicit confirmation materialises the reviewed one-off WorkoutDocument as one runner-owned
  Calendar workout.

The scientific support and conservative metric thresholds remain those in
[Section 20](#20-evidence-basis). The 28/90-day composition, latest-five inspection rule and
one-off admission floor above are explicit Hito product/coaching policies; they must not be
presented as universal physiology.

### Finite Delivery Sequence

After PRODUCT accepts this decision:

1. **ARCHITECT** defines one public, immutable snapshot boundary and its consumer projections,
   reconciles it with the existing continuation progress packet, and proves that Result/Evidence,
   Calendar, Source/Blueprint and authoring retain their existing authorities. Do not create a
   parallel profile or metric owner.
2. **BACKEND** computes and versions the snapshot from current public factual packets, exposes
   purpose-limited Progress/continuation/one-off projections, implements deterministic admission
   and abstention, and leaves unsupported stream metrics explicitly unavailable. AI is downstream
   of admission and cannot be a fallback.
3. **FRONTEND** renders Backend-owned facts, coverage, conflicts and explanations; collects only the
   missing Rest-day choices; and uses the existing Review/Confirm command family without client
   formulas, hidden scheduling changes or projection interactivity.
4. **QA** independently proves provider-neutral equivalence, revision reproducibility, dedupe,
   missing/partial/updating/contradictory states, latest-five versus window truth, current
   FIT/non-FIT boundaries, one-off abstention and explicit-confirm-only Calendar materialisation.

The next owner of HITO-253 is **PRODUCT** for decision acceptance. If accepted unchanged, PRODUCT
should route the first delivery step to **ARCHITECT**; this coaching receipt claims no architecture,
schema, implementation, runtime, provider, browser, database or QA acceptance.

### HITO-253 Architecture Receipt — Snapshot v1 Public Boundary

**Decision.** Backend's existing Runner Activity product-contract owner,
`src/lib/runner-activity/product-contract.ts`, owns one immutable, provider-neutral
`RunnerFitnessProfileSnapshotV1`. It is a factual read value, not a score, diagnosis, prediction,
Calendar authority or second persistence model. Identity/Profile, Runner Calendar and
Result/Evidence remain the sole owners of their source facts; the Snapshot owner only composes their
public contracts. Progress, adaptive continuation and a future one-off workout flow receive
purpose-limited projections from this same Snapshot. No second profile module or public read facade
is admitted.

#### Existing Continuation Consumer Census

| Current seam                                 | Responsibility                                                                                                    | v1 disposition                                                                                                                                          |
| -------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `adaptive-training-decision.ts`              | Defines and builds `ContinuationProgressProfileV1`; applies the two-relevant-FIT-days plus compatible-RPE policy. | Replace factual input with the continuation projection; keep the threshold in versioned Training Decision policy; then delete the old type and builder. |
| `adaptive-blueprint-read-model.ts`           | Supplies Calendar and Result/Evidence packets to the builder and passes the result to Training Decision.          | Request one Snapshot at the same cutoff and pass only its continuation projection.                                                                      |
| `adaptive-blueprint-actions.server.ts`       | Maps profile quality, reasons and cohort counts into the continuation authoring brief and receipt.                | Consume the sealed Training Decision result and Snapshot identity; do not reconstruct facts.                                                            |
| `adaptive-continuation-authoring.ts`         | Carries the old profile quality in the server-owned authoring brief.                                              | Carry the purpose projection state and Snapshot identity only.                                                                                          |
| `adaptive-training-decision-golden-proof.ts` | Proves missing, eligible and incompatible-RPE decisions.                                                          | Rebase fixtures on Snapshot/projection inputs before deleting the old builder.                                                                          |

No Calendar, Result/Evidence, Progress or Frontend production consumer imports
`ContinuationProgressProfileV1` directly. It is therefore a continuation-private duplicate owner,
not the reusable public profile.

#### Canonical Snapshot Contract

`RunnerFitnessProfileSnapshotV1` contains:

- `snapshotId`: SHA-256 of canonical serialized v1 content; identical input facts and versions yield
  the same identity;
- `runnerId`, runner timezone, `asOf`, inclusive runner-local `cutoffDate`, and `calculatedAt`;
- `profileDefinitionVersion`, component formula versions and a composite `runnerFactsRevision`;
- upstream revision/fingerprint provenance for Identity/Profile, Calendar outcomes and
  Result/Evidence facts, with covered dates, included/excluded counts and factual exclusion reasons;
- separately stateful components for confirmed constraints/self-report, current and preceding
  rolling 28 days, latest five eligible accepted activities, rolling 90 days and comparable
  performance cohorts;
- for every component, exactly one of `available`, `partial`, `unavailable`, `updating`,
  `not_applicable` or `contradictory`, plus coverage, staleness and reason codes. There is no overall
  confidence or readiness score.

The Snapshot is an immutable content-addressed value. V1 needs no new mutable profile row or second
store. A changed/corrected upstream revision or cutoff produces a new Snapshot identity. A reviewed
continuation or one-off candidate freezes the Snapshot identity, definition/formula versions and its
purpose projection in the existing review lineage; later facts cannot rewrite that decision input.

Latest-five is an inspection-only, runner-local chronological slice. It may contain fewer than five
eligible activities, retains exact covered dates and never supplies a denominator, trend or
threshold. `removed` evidence remains provenance/exclusion detail and maps to the appropriate
component state; it is not a seventh public state.

#### Reuse And Explicit Unavailability

- Reuse Calendar's cutoff-bound workout outcome, outcome revision, session-RPE and lifecycle facts;
  the Snapshot neither schedules nor mutates a workout.
- Reuse only accepted provider-neutral Result/Evidence actuals and their revision, quality,
  missingness and lineage. FIT is the current adapter, not a public type.
- Reuse existing factual rolling-window, weekly, load and record calculations from the Runner
  Activity product contract. One formula has one owner; the Snapshot must not recalculate a second
  version.
- Non-FIT completed, partial, skipped or missed work contributes outcome and compatible RPE only,
  never invented distance, duration, pace, heart rate or elevation.
- Stream-derived terrain cohorts, aerobic efficiency, durability and reliable comparable-context
  pace/heart-rate change remain `unavailable` with
  `normalized_stream_not_persisted` until a separately accepted normalized-stream contract exists.
  Any per-activity field absent from an upstream public contract remains explicitly unavailable; the
  Snapshot may not read private provider rows to fill it.

#### Purpose-Limited Projections

1. `RunnerFitnessProfileProgressProjectionV1` supplies the current Progress presentation with the
   same dated window, history, load, record and availability facts. Progress remains a presentation
   consumer, not a second calculator.
2. `RunnerFitnessProfileContinuationProjectionV1` supplies dated Calendar outcomes, factual
   accepted-activity cohorts, RPE coverage, constraints and component states. Training Decision owns
   the versioned eligibility/adaptation policy and produces an authoring brief or explicit
   no-prescription result; the projection does not carry `detailChangeEligible` as factual truth.
3. `RunnerFitnessProfileOneOffProjectionV1` supplies only current constraints, accepted-duration
   coverage and the dated rolling-90-day longest-duration fact. The future one-off decision combines
   it with the explicit request and a current Calendar occupancy read; it never writes Calendar and
   cannot bypass Review/Confirm.

All projections retain `snapshotId`, cutoff and definition/formula versions. They may omit facts but
cannot rename, recompute or strengthen them.

#### Dependency Direction And Removal Gate

`Identity/Profile public facts + Calendar outcome packet + Result/Evidence and Runner Activity public
facts -> Runner Fitness Profile Snapshot -> purpose projection -> Progress or Source Training
Decision -> reviewed authoring -> explicit confirmation -> Calendar materialisation`.

There are no reverse imports: the Snapshot owner does not import Source/Blueprint, provider request
or raw-retention code, UI, Calendar mutations or private Result/Evidence storage. Calendar and
Result/Evidence never import the Snapshot. Frontend never computes profile or training policy.

`ContinuationProgressProfileV1` has one final disposition: **remove**, without alias or compatibility
projection. Deletion is admitted only after all five direct seams above consume the v1 continuation
projection, golden proofs preserve missing/updating/contradictory and eligible/ineligible outcomes,
and recursive runtime plus type-only import census is zero for the old type and builder.

#### Smallest Delivery Sequence

1. **BACKEND:** extend `src/lib/runner-activity/product-contract.ts` with the single v1 public types
   and pure purpose projections; assemble them in the existing private Runner Activity read-model
   owner from public upstream facts. Prove deterministic identity, cutoff/revision reproduction,
   provider-neutral equivalence, state and latest-five/window separation. Add no table, second
   public profile module or Calendar mutation.
2. **BACKEND:** migrate the continuation read model, Training Decision and authoring receipt to the
   purpose projection; preserve the two-FIT-day plus compatible-RPE rule in policy; migrate golden
   fixtures; delete `ContinuationProgressProfileV1` and its builder after the zero-consumer proof.
3. **BACKEND:** project the same Snapshot into Progress and define the future one-off read/admission
   seam only where accepted public fields are lossless. Stop on a missing upstream public fact rather
   than reading private storage or inventing a value.
4. **QA:** independently prove reproducibility, correction/new-revision behavior, provider-neutral
   equivalence, latest-five inspection isolation, missing/partial/updating/contradictory states,
   non-FIT limits, continuation parity and no Calendar/source-authority regression.

Rollback is source-level: revert the not-yet-released consumer slice together with its new contract.
Do not retain both factual profile owners. This receipt changes architecture documentation only; it
claims no implementation, schema, persistence, runtime, provider, UI or QA acceptance.

## 22. HITO-262 Initial-Plan Projection Decision — 2026-08-23

### Decision

Initial plan authoring must consume one
`RunnerFitnessProfileInitialPlanProjectionV1` projected from the existing immutable
`RunnerFitnessProfileSnapshotV1`. The projection is a purpose-limited factual input to the existing
server-owned first-plan review/confirm pipeline. It is not another snapshot, calculator, persistence
row, provider DTO or authoring authority.

The existing explicit initial request remains the sole owner of the selected plan start, distance,
target date/finish time, optional runner-entered benchmark, runner comment and explicit per-plan
schedule choices. Age, height, weight and an accepted heart-rate guidance profile remain attributed,
review-sealed runner-entered facts required by the current initial request; the fitness projection
does not copy or reinterpret them. Persisted `fitnessLevel` is owned once by the Snapshot constraints
component and replaces request-derived `runnerLevel` as authoring truth. Persisted training
preferences remain settings-owned constraints: Backend must reconcile them with explicit per-plan
choices before authoring and send only one resolved availability value to the provider.

### Minimum Public Contract

`RunnerFitnessProfileInitialPlanProjectionV1` contains exactly:

- `version: runner_fitness_profile_initial_plan_projection_v1`;
- `snapshotDefinitionVersion`, `snapshotId`, `runnerFactsRevision`, `asOf`, runner-local inclusive
  `cutoffDate`, `timeZone` and all Snapshot `formulaVersions`;
- component `state`, `coverage` and sorted `reasonCodes` for constraints, recent 28 days, latest five,
  rolling 90 days and comparable performance; there is no aggregate quality/readiness score;
- settings-owned `fitnessLevel` and training preferences from the constraints component, with their
  source revision/fingerprint; null stays null and cannot be filled by AI;
- current and preceding 28-day windows with accepted activity count and the existing factual
  sessions, running-time, distance, elevation, longest-distance and longest-duration metrics,
  including each metric's availability, coverage and missing reasons;
- current-window Calendar outcome counts and session-RPE coverage, plus accepted/completion-only/
  missing/updating/removed evidence counts; it carries no Calendar mutation identity;
- rolling-90-day weekly distribution, dated longest accepted duration/distance and current/prior
  session-RPE-load facts with coverage;
- latest-five state, coverage and exact covered dates with `inspectionOnly: true`, but no activity
  items in the authoring projection; they cannot become a trend, threshold or provider shortcut;
- comparable-performance state and reason codes only. V1 keeps it `unavailable` with
  `normalized_stream_not_persisted` and supplies no inferred pace/HR trend.

The pure projection may omit Snapshot detail, but it cannot rename, recompute or strengthen a fact.
The reviewed candidate freezes the complete projection plus its Snapshot identity and versions.
Confirmation reassembles the Snapshot at that same cutoff and rejects a changed identity, runner
facts revision or formula version as stale. A later cutoff is a new request, not an in-place update.

### Deterministic Admission Before Provider Authoring

Backend returns one of four policy results before retained-response lookup or a paid provider call:

| Result                            | Exact discriminator                                                                                                                                                                             | Authoring behavior                                                                                                                                |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| `authoring_ready_factual`         | Required explicit request/settings facts are present; constraints are usable; recent/90-day components are `available` or usable `partial`; no relevant contradiction or updating input exists. | Supply only present facts and every missing/coverage reason. Provider may shape detail within the accepted goal but cannot infer missing history. |
| `authoring_ready_constraint_only` | Required explicit request/settings facts are present, while observed recent/90-day facts are honestly `unavailable`, `not_applicable` or insufficient to establish a baseline.                  | Preserve the existing conservative no-observed-baseline policy. Do not invent volume, longest run, pace, HR response or capacity.                 |
| `follow_up_required`              | A required explicit choice or settings-owned fact is absent, request availability conflicts with persisted constraints, or a required component is `updating`.                                  | Ask one exact question or wait for factual refresh; create no candidate and make no provider call.                                                |
| `no_prescription`                 | Required constraints or current factual packets are `contradictory`, the projection/Snapshot identity is stale, or accepted request facts cannot be verified losslessly.                        | State the exact conflicting/stale fact; create no candidate and make no provider call.                                                            |

A `partial` component is not automatically failure: present facts remain usable only with their
coverage and missing reasons. An unavailable comparable-performance component never becomes an AI
estimate. No numeric minimum activity threshold is introduced for initial-plan admission: zero or
insufficient accepted history selects the conservative constraint-only path rather than pretending
fitness evidence exists. Medical, injury, readiness and race-performance inference remain forbidden.

### Direct Consumer And Deletion Census

| Current owner/consumer                                                                                                 | Current settings-only responsibility                                                                                           | Required migration                                                                                                                                                                                               |
| ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `user-settings-actions.ts`                                                                                             | Defines and loads `RunnerPlanAuthoringProfileSnapshot` from age/body/level/HR settings.                                        | Keep settings getters and accepted runner facts; delete this composite snapshot type/getter after all consumers move.                                                                                            |
| `running-plan-engine-actions.ts`                                                                                       | Loads the old snapshot for preview and compares it again at confirm.                                                           | Assemble one Fitness Snapshot/projection for preview; at confirm reassemble at the frozen cutoff and compare Snapshot identity/versions plus the sealed explicit request.                                        |
| `ai-generated-running-plan.ts`                                                                                         | Requires the old snapshot, duplicates age/body/level equality checks, supplies HR and stores the object in normalized summary. | Accept explicit request plus initial-plan projection; use Snapshot-owned fitness level, run deterministic admission, and retain the projection identity/content in review input.                                 |
| `plan-creation-engine/preview-builder-shared.ts` and `running-plan-engine-review.ts`                                   | Carry and sign the old snapshot in normalized/review payloads.                                                                 | Carry and sign the explicit request plus initial-plan projection; do not retain both objects.                                                                                                                    |
| `structured-plan-authoring-schema.ts`, `ai-authored-plan-first-provider-contract.ts`, `ai-first-plan-draft-service.ts` | Indirectly receive only settings/request facts and unconditionally declare that no recent-volume baseline exists.              | Add the admitted initial-plan projection to the same structured request; branch factual versus constraint-only instructions deterministically and retain it in the existing exact request hash/response lineage. |
| Focused scripts/fixtures                                                                                               | Construct, load or persist the old snapshot in provider, confirmation and design-profile proofs.                               | Rebuild fixtures from immutable Snapshot/projection inputs and delete the helper after zero imports.                                                                                                             |

`RunnerPlanAuthoringProfileSnapshot` and
`getRunnerPlanAuthoringProfileSnapshotForUserId` have one final disposition: **delete**, without an
alias, adapter or compatibility field. Deletion is admitted only when production preview, structured
input, provider context, review payload and confirm freshness checks consume the new projection;
provider/confirmation/design fixtures prove parity; and recursive runtime plus type-only search is
zero for the old type, getter, normalized-summary field and proof helper. Settings persistence and
its accepted HR/body/profile facts remain; only the duplicate authoring snapshot responsibility is
removed.

### Backend Slice, Proof And Rollback

One serial **BACKEND** slice must:

1. add the pure initial-plan projection beside the other Snapshot projections in
   `runner-activity/product-contract.ts` and assemble the existing Snapshot through the current
   private Runner Activity read model at an explicit cutoff;
2. add the deterministic four-result admission to the existing first-plan normalization boundary;
3. migrate preview, structured provider request, retained-response request context, review payload
   and confirmation freshness to explicit request plus the frozen projection;
4. remove the unconditional `no_recent_volume_or_longest_run_baseline` responsibility when factual
   inputs are available, preserve it only for constraint-only admission, then delete every old
   settings-only snapshot consumer in the same slice.

Focused zero-provider proof covers deterministic projection replay; available, partial,
unavailable, updating and contradictory components; settings/request conflict; no-call follow-up and
no-prescription; conservative zero-history authoring; exact request-hash change when Snapshot facts
change; stale review after fact/formula revision; same-cutoff confirm parity; provider payload
missingness; and recursive runtime/type-only zero reachability for the retired snapshot. Existing
schema/compiler, retained raw response, Running Coach review, signed explicit confirmation and
runner-owned Calendar materialisation remain downstream and unchanged.

Rollback is one unreleased source revert of the whole consumer migration. Do not retain both input
paths as fallback. Stop before implementation if the existing explicit request cannot carry a
currently required runner-entered fact losslessly or if the Snapshot cannot be assembled at the
review cutoff without private provider storage. No Product decision remains for this bounded
contract. HITO-263 may begin only after PRODUCT accepts this decision.

This is an architecture/documentation decision only. It claims no source, schema, persistence,
provider, fixture, runtime, UI, browser, QA, hosted or release acceptance.

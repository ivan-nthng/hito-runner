# Hito Transparent Runner Fitness Index And Capability Profile Research

**Date:** 2026-08-28

**Canonical Task:** HITO-279 — Define a Transparent Runner Fitness Index

**Primary Area:** Runner

**Research owner:** RUNNING COACH

**Decision owner:** PRODUCT

**Status:** Decision-ready research; no Fitness Index formula or product implementation is accepted by this document

**Canonical parent policy:** [Hito Runner Profile Constitution](2026-07-30-hito-runner-profile-constitution.md)

**Implemented factual boundary:** `RunnerFitnessProfileSnapshotV1`; this research does not change it

## Executive Recommendation

Do not make one number serve three different jobs. Hito should separate:

1. **Runner Capability Profile** — six factual, evidence-gated dimensions for the runner-facing
   strengths/context view;
2. **Fitness Direction** — one simple categorical progress result (`insufficient`, `provisional`,
   `improving`, `stable`, `mixed`, or `declining observation`) derived only from comparable personal
   evidence;
3. **Plan Authoring Tier** — one deterministic authority state (`constraint-only`, `base-supported`,
   `performance-provisional`, or `performance-established`) that tells a plan builder which factual
   inputs it may use.

The plan engine must consume the frozen Profile components and explicit constraints, not the visual
hexagon, Fitness Direction, or a composite score. A future numeric `Fitness Index` can be evaluated
as a presentation layer only after Product accepts a complete versioned formula, evidence floors,
missing-data policy, re-baseline policy, and safe wording.

The recommended first product is therefore **not an opaque 0–100 score**. It is a compact six-axis
profile plus one categorical direction. This gives the runner something understandable and dynamic
without allowing missing HR, extra mileage, one fast run, or an arbitrary weight to become hidden
training authority.

## 1. The User Question

The desired experience has two legitimate needs:

- `What kind of runner am I becoming, and where are my current strengths?`
- `What can Hito safely use when constructing or adapting my plan?`

Those questions are related but not identical. A runner can accumulate more training load without
becoming faster. A fast 5K does not establish long-run durability. A high weekly distance does not
prove readiness, health, or safe progression. An interval session proves exposure to intervals, not
short-distance performance. Any design that multiplies distance, pace, HR, RPE, and body facts into
one unqualified number hides these distinctions.

This research evaluates models that are simple enough for product use while preserving Hito's
existing principles: provider-neutral facts, personal comparison, explicit missingness, versioned
formula provenance, and no medical or race-prediction claim.

## 2. What “Fitness” May Mean — And Must Not Mean

| Concept                   | Honest question                                                                 | Typical evidence                                        | May influence plans?             | Must not be called                        |
| ------------------------- | ------------------------------------------------------------------------------- | ------------------------------------------------------- | -------------------------------- | ----------------------------------------- |
| Training exposure         | How much and how often has the runner trained?                                  | Sessions, duration, distance, RPE load                  | Yes, as factual capacity context | Fitness, health, readiness                |
| Demonstrated capacity     | What duration, frequency and long-run demand has the runner actually completed? | Current 28-day work and rolling 90-day observed ceiling | Yes, conservatively              | Guaranteed tolerance or injury protection |
| Comparable performance    | Did pace/HR/efficiency change in sufficiently similar running?                  | Normalized HR-speed streams, intent and context         | Yes, only when eligible          | VO₂max, race prediction, laboratory truth |
| Performance evidence      | What best efforts or races were actually observed?                              | Valid records, races or controlled tests                | Yes, for compatible targets      | Universal fitness or current readiness    |
| Short-term decision state | Is there enough fresh, non-conflicting evidence for this proposal?              | Frozen Profile, outcomes, constraints and check-in      | Yes, for that request only       | Fitness Index, health clearance           |

The Hito Fitness Index may summarize long-term personal direction. It must not become a substitute
for any row above.

## 3. Research Findings

### 3.1 No single training-load marker measures fitness

Session-RPE (`duration × whole-session RPE`) is practical and broadly supported for monitoring
internal training load. It says how demanding a session was reported to be; it does not measure
fitness. Reviews of training-load models similarly conclude that no single physiological marker
accurately captures fitness and fatigue or reliably predicts performance. This is the central reason
not to treat accumulated load as a universal athlete score.

Commercial products illustrate the attraction and the limitation:

- Strava models “Fitness” from accumulated Training Load/Relative Effort and explicitly says the
  number is personal, trend-oriented, and can continue rising as the athlete trains more.
- TrainingPeaks CTL is an exponentially weighted average of daily training stress, normally with a
  42-day time constant. It is useful exposure history, but it remains a load model.
- Garmin Training Status combines proprietary VO₂max/HRV/load inputs and device rules. It is not a
  provider-neutral, reproducible Hito formula.

Hito may learn from the usability of those trends, but it should label its equivalent `Training
Load` or `Training Base`, not physiological fitness.

### 3.2 Comparable submaximal running is useful, but context is decisive

Evidence supports standardized submaximal running HR as a way to monitor personal changes, while
also showing that protocol, intensity and context materially affect interpretation. Hito's existing
pace-at-comparable-HR, HR-at-comparable-pace and distance-per-heartbeat policies are therefore strong
future Profile components. They require persisted normalized streams, stable aerobic intent, sensor
coverage and comparable context. Summary pace and average HR are not sufficient.

### 3.3 Durability is a real endurance dimension

HR-speed decoupling during prolonged running is a useful durability construct and varies materially
between runners. It is more appropriate for the “long endurance” side of a profile than simply
counting long-run kilometres. It still requires sufficiently long, comparable aerobic segments and
must not be interpreted as diagnosis, hydration status, or guaranteed race performance.

### 3.4 Critical speed can describe sustained speed, but casual history is not enough

Critical speed (`CS`) and finite work capacity above it (`D′`) provide a meaningful performance
profile when derived from appropriate maximal efforts or controlled tests. Recent reviews find CS
useful for intensity-domain and performance modelling, while also finding no consensus on one
optimal measurement/model protocol and noting that protocol choices change the estimate.

Therefore:

- a valid race/time trial may support a future `Sustained speed` or `Speed reserve` component;
- ordinary easy runs and incomplete interval repetitions must not be fitted as maximal performance;
- CS/D′ may be unavailable for most new runners;
- it must not silently generate a race prediction or executable target without the separate target
  doctrine and Review/Confirm flow.

### 3.5 Wearable VO₂max is not a safe canonical score

Meta-analysis finds material individual-level error in consumer wearable VO₂max estimates even when
population-level bias appears modest. Hito may retain a device-reported value as an attributed
external estimate, but it should not normalize multiple provider estimates into one Hito truth or
use them as the central Index.

### 3.6 Load ratios are not injury or readiness formulas

Acute:chronic workload ratio research has substantial conceptual and methodological controversy.
Critical work finds no basis for using ACWR as a causal injury-prevention prescription and describes
ratio artefacts that can produce misleading recommendations. Hito may show factual recent/prior
load with coverage, but must not turn a ratio into `safe`, `ready`, `overtrained`, or injury-risk
language.

### 3.7 A hexagon is an overview, not a calculator

Radar charts are engaging and compact, but experimental visualization research generally finds
bars and position/length encodings easier and more accurate for comparison. The polygon area also
changes when axis order changes even if the underlying values do not.

If Hito uses a hexagon:

- the axis order is fixed and versioned;
- the polygon area has no meaning and is never displayed as a total;
- missing axes remain gaps, not zero;
- current and reference are the maximum two series;
- every point exposes the raw value, unit, window, evidence state and missing reason;
- an equivalent ordered bar/profile table is the accessible source of truth;
- no cross-runner comparison or population percentile is implied.

## 4. Option Catalogue

| Option                      | Simple formula                                        | What it really measures                     | Strength                                      | Material problem                                                            | Hito disposition                                      |
| --------------------------- | ----------------------------------------------------- | ------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------- | ----------------------------------------------------- |
| Accumulated load / CTL      | `EWMA(today_load)`                                    | Recent weighted training exposure           | Simple, dynamic, works with RPE/HR load       | More training generally raises the score; load is not fitness               | Use as factual Training Load, never the Fitness Index |
| Session-RPE base            | `Σ(duration_min × RPE)`                               | Reported internal load                      | Provider-neutral and practical                | Missing RPE; hard and long sessions can tie; not performance                | Use with coverage in Profile and continuation         |
| Volume score                | Distance or time relative to prior window             | Training volume/capacity                    | Available to many runners                     | Rewards “more”; ignores intensity and recovery                              | Show raw capacity and personal trend only             |
| PB/race score               | Best pace at standard distance                        | Observed performance                        | Intuitive, factual                            | Opportunity, terrain and intent bias; becomes stale                         | One Performance axis with source/date/context         |
| Critical speed + D′         | Fit maximal distance-time efforts                     | Sustained speed and finite work above CS    | Scientifically meaningful performance profile | Needs valid maximal efforts; model/protocol sensitivity                     | Gated future axes, not default v1                     |
| Comparable HR-speed metrics | Pace at fixed HR, HR at fixed pace, m/heartbeat       | Aerobic efficiency change                   | Personal and actionable                       | Needs normalized streams and comparable context                             | Preferred future performance component                |
| Durability/decoupling       | Change in HR-speed ratio across a long steady segment | Resistance to efficiency loss over duration | Captures long-run strength                    | Needs long stable runs; affected by conditions                              | Preferred gated Long endurance component              |
| Wearable VO₂max             | Provider algorithm                                    | External physiological estimate             | Familiar single number                        | Provider-specific and individually noisy                                    | Attributed context only; never canonical Hito score   |
| ACWR / “form” ratio         | Recent load ÷ chronic load                            | A ratio of load windows                     | Appears actionable                            | Statistical/causal problems; unsafe injury/readiness interpretation         | Out of scope for fitness or injury decisions          |
| Weighted 0–100 composite    | `Σ(weight × normalized component)`                    | Whatever the weights encode                 | Easy to display                               | Arbitrary scale, duplicated metrics, missing-data pressure                  | Future only behind complete Product formula gate      |
| ML/Bayesian latent fitness  | Model-inferred hidden state                           | Model prediction                            | Can combine noisy/missing inputs              | Opaque, difficult to reproduce/explain, can encode provider/population bias | Out of scope for first Index                          |

## 5. Recommended Six-Axis Runner Capability Profile

The axes answer different runner questions. A low or missing axis is never labelled a weakness unless
the evidence actually supports a comparable personal conclusion.

| Axis                            | Runner question                                                              | Minimum factual inputs                                                                 | Primary raw readback                                                              | Evidence state                                                                        | Deterministic planning use                                                       |
| ------------------------------- | ---------------------------------------------------------------------------- | -------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Continuity**                  | Am I training regularly?                                                     | Accepted activity dates/outcomes and timezone                                          | Sessions, active weeks and weekly distribution in rolling 28 days                 | Available with factual activities; completeness shown                                 | Choose feasible contact pattern with declared availability; do not infer fitness |
| **Training capacity**           | What amount of running have I recently demonstrated?                         | Actual duration/distance; current 28 days and rolling 90 days                          | Weekly duration/distance distribution and RPE-load coverage                       | Factual even without HR; planning authority needs sufficient actual-duration evidence | Starting volume and progression ceiling use raw values, never the visual score   |
| **Long endurance / durability** | How much steady running remains controlled as duration grows?                | Longest actual duration; later eligible HR-speed streams and context                   | Observed long-run duration plus decoupling/controlled-aerobic duration when valid | Factual capacity first; performance interpretation gated                              | Starting long run uses observed ceiling; target-specific growth remains reviewed |
| **Aerobic efficiency**          | At a similar aerobic effort, am I covering more distance?                    | Stable aerobic segments with normalized speed/distance and observed HR                 | Pace at comparable HR, HR at comparable pace, and m/heartbeat                     | `<3` insufficient, `3–5` provisional, `6+` established in each compared cohort        | May calibrate aerobic work only when compatible and established                  |
| **Sustained speed**             | What pace has been demonstrated over longer hard efforts?                    | User-confirmed race/time trial or eligible performance curve evidence                  | Factual PBs; future CS where protocol is accepted                                 | Unavailable without valid maximal/comparable evidence                                 | Tempo/threshold specificity only when the target doctrine admits it              |
| **Speed reserve**               | What short-duration performance has been demonstrated above sustained speed? | Valid short maximal efforts or structured evidence with complete work/recovery anatomy | Future D′ or short-distance best efforts                                          | Usually unavailable for casual history                                                | Short repetitions stay controlled effort unless benchmark authority exists       |

### Important category rule

Workout type is not capability. Completing intervals means `interval exposure observed`; it does not
prove speed reserve. Completing an easy short run means `short easy run observed`; it does not prove
short-distance strength. A long run contributes to duration capacity, but only an eligible stable
segment contributes to durability or aerobic efficiency.

## 6. Three Output Forms

### 6.1 Output A — Profile facts and categorical axis states (recommended v1)

Each axis shows:

- current raw value and unit;
- current/reference windows;
- factual change where comparable;
- evidence state and included/excluded counts;
- one plain-language explanation;
- the exact missing or conflict reason.

Recommended axis vocabulary:

```text
unavailable
insufficient evidence
provisional favorable observation
stable observation
mixed observation
established favorable observation
established unfavorable observation
```

Do not map `unavailable` to the centre of a radar chart or to zero.

### 6.2 Output B — One categorical Fitness Direction (recommended simple indicator)

Reuse the accepted component-comparison doctrine:

```text
insufficient_evidence
provisional_improving
improving
stable
mixed
declining_observation
```

Direction is set only by comparable performance components. Volume, frequency and load explain the
training context but do not vote that fitness improved merely because the runner did more.

Recommended logic:

- `improving`: established evidence, at least two eligible performance components exceed favorable
  personal-variability thresholds, and none exceeds an unfavorable threshold;
- `provisional_improving`: one favorable component or provisional coverage;
- `stable`: eligible components remain within personal variability;
- `mixed`: eligible components disagree or material contexts differ;
- `declining_observation`: at least two established components move unfavorably;
- otherwise `insufficient_evidence`.

This is simple enough for the runner and honest enough to preserve component truth.

### 6.3 Output C — Numeric Fitness Index (future evaluation only)

A transparent prototype can normalize each eligible component into personal meaningful-change
units:

```text
effect_j = clamp(
  direction_j * change_j / max(product_floor_j, baseline_MAD_j),
  -2,
  +2
)

prototype_index = round(
  clamp(0, 100, 50 + 12.5 * median(effect_j))
)
```

For positive ratio metrics, use the symmetric log change `ln(current/reference)` before dividing by
the admitted meaningful-change floor. For BPM and decoupling percentage points, use their admitted
absolute change rules. Do not include both pace-at-HR and its mathematically redundant inverse as
two independent votes.

Interpretation of the prototype:

- `50` is the accepted personal reference, not average-human fitness;
- one meaningful-change unit moves the prototype by `12.5` points;
- the median limits one extreme component from dominating;
- missing required components make the Index unavailable; they never become zero or have their
  weight redistributed at runtime;
- `12.5`, required components and all scaling are Product choices, not scientific constants.

This formula is useful for testing explainability, but **it is not recommended for implementation
until Product validates that users understand it better than Fitness Direction**.

### Alternative numeric display — personal historical percentile

For a runner with enough compatible non-overlapping snapshots, an axis may show where the current
value sits within that runner's own history:

```text
personal_percentile_j =
  100 * (count(history < current) + 0.5 * count(history == current)) / history_count
```

This is more honest than a population percentile, but it answers `How high is this versus my own
history?`, not `How fit am I?`. It needs a minimum history rule and historical-freeze decision and
must not control plans.

## 7. Plan Authoring Tier — The Simple Engine Parameter

If Product needs one simple deterministic parameter for plan authoring, use authority, not fitness:

| Tier                      | Evidence meaning                                                                                    | Permitted authoring                                                                        |
| ------------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| `constraint_only`         | Recent actual performance is absent, insufficient or contradictory                                  | Goal/availability/limitation-aware conservative time/effort plan; no performance precision |
| `base_supported`          | Current 28-day actual duration/frequency and 90-day observed ceiling meet the factual capacity gate | Start frequency, duration and long-run demand from supported raw capacity facts            |
| `performance_provisional` | At least `3–5` eligible comparable observations in required reference/current cohorts               | Explain provisional direction; avoid precise performance-led prescription                  |
| `performance_established` | At least `6` eligible comparable observations in each required cohort with no material conflict     | Allow compatible performance-informed authoring under the target doctrine                  |

The tier says what Hito is allowed to know. It does not say the runner is healthy, ready, advanced,
or better than another runner.

### Deterministic plan uses

- **Frequency:** use declared availability and observed current distribution; never derive days per
  week from the Fitness Index.
- **Starting volume:** use actual current 28-day duration/distance distribution and outcomes.
- **Long-run start:** use accepted current/90-day actual-duration evidence; do not exceed an observed
  ceiling merely because an Index is high.
- **Progression and cutback:** use reviewed outcomes, RPE/manageability and Blueprint intent.
- **Intensity:** use effort/time by default. Executable pace/HR requires its own benchmark and
  comparability authority.
- **Continuation:** use the frozen Profile plus current outcomes and check-in; Fitness Direction can
  explain the result but cannot mutate Calendar truth.
- **Limitation/sickness/injury context:** the accepted limitation policy always overrides the tier;
  the Index never provides medical clearance.

## 8. Hexagon And Progress Experience

### Recommended default

Use six ordered horizontal profile rows or small bars, because runners can compare lengths and read
raw values more accurately. Each row shows current, reference, state and coverage.

### Optional hexagon overview

Use the same six fixed axes clockwise:

1. Continuity
2. Training capacity
3. Long endurance
4. Aerobic efficiency
5. Sustained speed
6. Speed reserve

Rules:

- show no filled polygon area total;
- show at most `current` and `reference` outlines;
- never rearrange axes to make a shape look stronger;
- render missing dimensions as an explicit break with `Not enough comparable evidence`;
- include direct point labels or an accessible disclosure and a data-table equivalent;
- show raw values and units beside the chart;
- use line style/markers in addition to colour;
- do not call the centre `bad` or the outside `elite`;
- do not compare two runners on the same chart.

The hexagon is a navigation summary. Axis details remain the factual product.

## 9. Safety And Language Boundaries

Allowed:

- `Your current 28-day running time is higher than the prior comparable period.`
- `Across six comparable aerobic runs, pace at approximately the same observed HR improved.`
- `Long-run durability is unavailable because no eligible run reached the analysis duration.`
- `Your recent training supports four running contacts per week.`
- `Fitness direction: mixed — aerobic efficiency improved while durability evidence was stable.`

Prohibited:

- `Your fitness is 82/100` without the accepted formula, windows and explanation;
- `You are 14% fitter` from distance, load, CTL, VO₂max, one PB or one provider estimate;
- `Intervals are your strength` merely because interval workouts exist;
- `Your endurance is weak` when long-run evidence is missing;
- `You are recovered`, `safe to train`, `overtrained`, or `at injury risk` from the Index or ACWR;
- `You can race a Half Marathon in X` from the profile;
- body mass, age, sex or experience as reward/penalty weights;
- AI-filled pace, HR, terrain, effort, limitation state or missing activities;
- silent plan, prescription or Calendar changes caused by a score.

## 10. Missingness, Confidence And Provenance

Every Profile/Index result retains:

- frozen Snapshot ID and cutoff;
- Profile definition and component formula versions;
- current/reference windows and re-baseline identity;
- eligible activity/segment IDs and source revisions;
- included/excluded counts and reason codes;
- observed versus reported versus attributed source state;
- stream coverage, sensor/context limitations and staleness;
- `unavailable`, `provisional`, or `established` state and every reason;
- historical freeze/recomputation policy.

No component may borrow evidence from another component. Missing HR does not become average HR;
completion-only Calendar truth does not become pace or duration; a device VO₂max does not repair an
unavailable comparable-performance cohort; the latest five activities do not replace the rolling
28-day denominator.

## 11. Recommended Product Decision

Accept the following bounded direction for HITO-279:

1. The user-facing product question is `How is my evidence-backed running profile changing?`
2. V1 output is a six-axis Runner Capability Profile plus categorical Fitness Direction.
3. The plan system uses Plan Authoring Tier and raw frozen Profile components, never the visual
   profile or Fitness Direction as stronger truth.
4. The numeric Fitness Index remains `unavailable: fitness_index_formula_not_accepted` until Product
   explicitly accepts its arithmetic and user comprehension evidence.
5. The hexagon is optional secondary presentation; ordered bars/data table are the truth surface.
6. Critical speed/D′, comparable HR-speed and durability metrics are gated future components when
   their evidence contracts are satisfied.

This decision gives Hito an implementation path now without pretending that one formula can measure
training exposure, performance, endurance, recovery and health simultaneously.

## 12. Exact Product Questions Still Open

1. Should Product accept the categorical `Fitness Direction` as the simple headline, or require a
   numeric prototype study?
2. Are all six recommended axes accepted, and is `Speed reserve` worth showing when it will often be
   unavailable?
3. Should the first UI use bars only, or bars plus an optional hexagon summary?
4. Which components are required for a future numeric Index, and which are optional?
5. Should numeric normalization use meaningful-change units or personal historical percentile?
6. What is the minimum historical window and re-baseline interaction?
7. Are historical Index values frozen under their formula versions or recomputed after corrections?
8. What exact user research proves that `0–100` adds understanding rather than false certainty?
9. Does Product want the Index purely for Progress, or also as an explanation attached to reviewed
   plan decisions? It must not become the plan input in either case.

## 13. Finite Next Sequence

1. **PRODUCT:** accept the user question, output form, six axes, and whether numeric research
   continues.
2. **ARCHITECT:** define one derivative boundary from the existing immutable Snapshot; no second
   mutable profile or UI-owned calculation.
3. **BACKEND:** specify component values, versioned formula/provenance, missingness, confidence and
   historical policy; retain current stream-gated unavailable states.
4. **DESIGNER / DESIGN SYSTEM:** compare ordered profile bars with an optional unfilled hexagon and
   define accessible missing-data behavior.
5. **FRONTEND:** compose the accepted factual read model without recalculation.
6. **QA + RUNNING COACH:** validate exact formulas, missing/conflict fixtures, runner-facing claims,
   visual equivalence and the absence of score-driven plan mutation.

No implementation is admitted by this research.

## 14. Evidence And References

### Research evidence

- Buchheit et al., [Minimally Invasive Ways to Monitor Changes in Cardiocirculatory Fitness in
  Running-based Sports](https://pubmed.ncbi.nlm.nih.gov/36332619/): standardized submaximal running
  HR can support longitudinal monitoring, but protocol and context affect interpretation.
- Smyth et al., [Decoupling of Internal and External Workload During a
  Marathon](https://pubmed.ncbi.nlm.nih.gov/35511416/): HR-speed decoupling supports a distinct
  durability construct with substantial individual variation.
- Anderson et al., [The Measurement and Application of Critical Speed and D′ in
  Running](https://pubmed.ncbi.nlm.nih.gov/41931241/): CS/D′ are useful performance constructs, but
  protocols and models vary and no single optimal approach is established.
- Lipková et al., [Field-based tests for determining critical speed among
  runners](https://pubmed.ncbi.nlm.nih.gov/40134905/): reliable field estimation requires controlled
  protocols rather than arbitrary training-history fitting.
- Foster-method review, [Session-RPE Method for Training Load
  Monitoring](https://pubmed.ncbi.nlm.nih.gov/29163016/): duration × RPE is practical for load
  monitoring, not a universal fitness measure.
- Borresen and Lambert, [The quantification of training load, the training response and the effect
  on performance](https://pubmed.ncbi.nlm.nih.gov/19691366/): no single marker accurately captures
  fitness/fatigue and theoretical performance models have limited accuracy.
- Molina-Garcia et al., [Validity of Estimating VO₂max by Consumer
  Wearables](https://pubmed.ncbi.nlm.nih.gov/35072942/): individual-level wearable estimation error
  remains material.
- Impellizzeri et al., [Acute:Chronic Workload Ratio: Conceptual Issues and Fundamental
  Pitfalls](https://pubmed.ncbi.nlm.nih.gov/32502973/): ACWR should not be used as a causal
  injury-prevention or training prescription rule.
- Cleveland and McGill, [Graphical Perception](https://doi.org/10.1080/01621459.1984.10478080), and
  the later experimental comparison [Efficacy of information extraction from bar, line, circular,
  bubble and radar graphs](https://www.sciencedirect.com/science/article/pii/S0003687023000340):
  position/length encodings generally support more accurate comparisons than radar shapes.

### Current market patterns — context, not Hito authority

- [Strava Fitness & Freshness](https://support.strava.com/en-us/articles/15402032-fitness-freshness)
  uses training load/relative effort with an impulse-response model and emphasizes personal trends.
- [TrainingPeaks Fitness (CTL)](https://help.trainingpeaks.com/hc/en-us/articles/204071884-Fitness-CTL-)
  uses a default 42-day exponentially weighted training-stress average.
- [Garmin Training Status](https://support.garmin.com/en-GB/?faq=VxKazDQ2mkAmDoQbJriEBA) combines
  device-dependent VO₂max/HRV/load evidence and is therefore not a provider-neutral Hito source.

### Hito policy basis

- [Runner Fitness Profile Constitution](2026-07-30-hito-runner-profile-constitution.md)
- [Runner Activity Intelligence Formula Policy Amendment](2026-08-02-runner-activity-intelligence-formula-policy-amendment.md)

## 15. Evidence Limitations

- The research evaluates coaching/product meaning, not implementation feasibility or current UI.
- No personal runner data, provider API, database, browser, production state or proprietary formula
  was accessed.
- A numeric prototype requires retrospective validation against runner understanding and compatible
  factual outcomes before Product acceptance.
- Scientific associations do not convert any component into a medical marker, injury predictor,
  race guarantee or universal training prescription.

## Operational addendum — motivating sparse-history authoring (2026-08-28)

### Accepted authority model

For plan authoring, replace any single `Fitness Index` or scalar tier with one versioned capability
vector:

```text
Recent7
Base28
Capacity90
PerformanceEvidence
EvidenceConfidence
```

`Recent7` is the exact trailing seven local dates ending at the frozen cutoff and is the primary
current-behavior window. `Base28` is the same cutoff expressed as four explicit, non-overlapping
seven-day slices. `Capacity90` is historical demonstrated capacity and attributable records. The
other two components say what comparable performance evidence exists and how much authority each
fact has. None is a medical, recovery, readiness, injury-risk or race-prediction score.

The earlier feasibility proposal to use `current28 sessions / 4`, `current28 duration / 4` or
`current28 distance / 4` as observed weekly behavior is superseded by this Product decision. It can
turn two real recent runs into a fictional half-run-per-week baseline. Every accepted run and its
valid duration/distance remains whole in its actual seven-day slice.

### Exact `Recent7` sparse-history semantics

| Accepted actual runs in `Recent7` | Factual meaning                                                                                                           | Permitted authoring authority                                                                                                                                                                                                                     |
| --------------------------------: | ------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
|                               `0` | No current running behavior was observed in this exact window. It does not mean zero fitness or zero historical capacity. | Do not derive frequency, weekly volume, long-run demand, pace or HR. `Base28`/`Capacity90` may explain prior capacity, but starting demand requires the existing constraint/re-entry policy and, where that policy requires it, a fresh check-in. |
|                               `1` | One complete contact and its exact valid facts are current evidence. It is not a weekly trend.                            | Preserve the contact as one whole observation. It may anchor the same type/unit of easy demand; no performance precision and no extra contact unless the deterministic `+1` gate below passes.                                                    |
|                               `2` | Two complete contacts, their exact sum, spacing, outcomes and longest demand are current evidence.                        | Treat current frequency as two contacts, not `28-day sessions / 4`. Start from those exact facts; a third easy/recovery contact is permitted only through the `+1` gate.                                                                          |
|                              `3+` | The exact count, total, distribution and outcomes form an observed current pattern.                                       | Use the observed pattern subject to declared availability and limitations. This still does not establish fitness, readiness, intensity authority or comparable performance; one additional contact still requires the same `+1` gate.             |

Completion-only workouts can support scheduled-completion truth but never enter these actual-run
counts or supply duration, distance, pace, HR, long-run or performance facts.

### Base support and confidence without dilution

Number the `Base28` slices as `S0 = cutoff−6…cutoff`, `S1 = cutoff−13…cutoff−7`, `S2`, and `S3`.
`S0` is exactly `Recent7`. Retain for every slice its accepted-run count, exact duration and distance
coverage, exact totals, longest actual demand, outcomes and exclusions. Report how many slices are
complete, non-empty, and at or above the current contact pattern. Do not average the four slices,
impute zeroes, redistribute missing values, or let older high/low weeks alter the `Recent7` fact.

`EvidenceConfidence` is component-specific and categorical:

- `unavailable`: no eligible fact, an updating/contradictory source, or required coverage is absent;
- `observed_sparse`: one or two accepted `Recent7` runs, retained at full value;
- `observed_pattern`: three or more accepted `Recent7` runs with complete required facts;
- `repeated_support`: the relevant frequency or demand also occurs in at least one prior complete
  `Base28` slice;
- `historical_capacity_only`: support exists only in `Capacity90`, so it is a ceiling/context fact,
  not current-behavior authority.

`Capacity90` retains all complete seven-day slices plus an explicitly partial boundary remainder;
the remainder is never normalized into a full week or used to prove recurrence. Exact historical
longest runs and standard-distance records retain their dates, source/activity revisions and
formula provenance. Repetition may raise confidence that a current pattern has precedent, but can
never erase sparse current work, mechanically average old weeks into `Recent7`, or turn a historical
maximum into today's starting demand.

### Deterministic one-contact progression gate

An opening week may contain at most one more running contact than the accepted `Recent7` count, and
that additional contact may be easy/recovery only, when every condition below is true:

1. `Recent7` contains at least one accepted actual run; the zero-run state uses the existing
   constraint/re-entry policy instead of pretending `0 + 1` is evidence-based progression.
2. The runner's declared availability accommodates the proposed count, the existing limitation
   admission permits normal authoring, and no current outcome/check-in evidence is updating,
   contradictory or unresolved in a way that blocks prescription.
3. At least one of `S1–S3` reached the proposed contact count **and** at least two complete
   seven-day slices in `Capacity90` reached it. This proves both recent precedent and recurrence
   without dividing any aggregate.
4. The added contact uses the same unit and is no longer than the shortest accepted easy/recovery
   contact in complete `Base28` evidence. If workout intent or that demand is unavailable, no
   deterministic additional contact is authorized.
5. Placement preserves the engine's accepted recovery-spacing and hard-session rules. The added
   contact cannot be a long run, interval, tempo, hill or other quality session.

Failure of any condition keeps the observed contact count; it never invites AI to fill the gap.
This gate is a bounded coaching recommendation for Product acceptance, not an implemented formula
or a claim that an additional run is medically safe.

### Starting demand and long-run demand

- With one or more accepted `Recent7` runs, the opening weekly duration and distance anchors are the
  exact eligible `Recent7` sums in their own units. Missing distance does not invalidate complete
  time evidence, and missing time does not authorize a time-distance conversion.
- The author may begin below an anchor when declared availability, an accepted limitation,
  unresolved outcomes, target timing or the existing conservative engine policy requires it. It may
  exceed the anchor only by the demand of an additional contact admitted by the `+1` gate, and may
  not exceed an actually demonstrated complete `Base28` slice at the proposed contact count.
- `Capacity90` supplies dated ceilings and records, not a lower bound. A 90-day maximum cannot
  replace a lower `Recent7` anchor merely because it is larger.
- The initial long-run anchor is the longest eligible easy/long accepted actual in `Recent7`, at or
  below its observed duration/distance. A comparable `Base28` long run may support a ceiling; a
  `Capacity90` long-run record remains historical context. If `Recent7` contains no eligible
  easy/long demand, the profile supplies no precise initial long-run value.
- A target such as a Half Marathon explains why long-run capacity may need to grow; it does not
  authorize starting above demonstrated current demand or jumping directly to a historical record.

The profile owns only factual anchors, ceilings, coverage and reasons. The existing reviewed plan
engine owns the week-to-week progression curve, cutback placement, target-phase sequencing,
workout-family selection, intensity, recovery spacing and later adaptation from outcomes/check-ins.
No universal `10%` rule belongs in either the Profile or this addendum.

### Exact standard-distance segment evidence

For an accepted target distance `D`, any accepted activity with valid recorded distance `>= D` may
produce one candidate fastest contiguous exact-distance segment. A valid `5.1 km` activity may
therefore supply its **actual fastest contiguous `5.0 km` segment**; Hito must never multiply the
whole-activity elapsed time by `5 / 5.1`, derive the result from average pace, or assume the first or
last `5.0 km` was fastest.

Eligibility requires timestamped monotonic distance/time samples, explicit timer/pause events,
accepted gap/reset/jump and stream-coverage rules, and deterministic interpolation at both exact
distance boundaries. For every continuous candidate interval `[s, s + D]`, boundary times are
interpolated only between valid bracketing samples in the same continuous stream; interpolation may
not cross an unaccounted gap, distance reset or invalid pause transition. The recommended record
duration is chronological elapsed time between those boundaries, including recorded pauses; any
different official-time basis must remain separately attributable and versioned.

Choose the minimum eligible duration, retain tie policy and boundary/interpolation facts, and bind
the result to target distance, activity/source revision, sample revision, timer semantics, coverage,
exclusions and formula version. If the samples or semantics are unavailable, the segment record is
`unavailable`; summary pace or whole-activity scaling cannot repair it. Exact whole-activity records
and runner-confirmed official records remain separate, named evidence sources.

### HR, RPE and context comparability

HR can affect `PerformanceEvidence` only through an eligible exact segment or a controlled aerobic
observation with sufficient observed HR/distance/time coverage. Comparable cohorts must match the
accepted formula's workout intent/structure, terrain/surface and elevation behavior, duration or
segment band, timer/pause basis, HR sensor class, environment/conditions when known, stream quality
and formula version. Hills, intervals, races, progressive runs and ordinary aerobic runs are not
silently pooled.

Allowed future observations include pace at comparable observed HR, observed HR at comparable
pace, distance per observed heartbeat and durability within eligible controlled aerobic work.
Whole-activity average HR is inspection context only and never a performance shortcut. Missing HR
stays missing. RPE remains subjective load/manageability context: it may explain or reduce
confidence under the existing outcome policy, but it cannot upgrade capability, performance
precision, benchmark truth or positive progression authority.

### Fail-closed missingness and staleness

- `updating`, `contradictory`, foreign-owner, invalid revision, incomplete required coverage or an
  unknown formula version produces no affected value or prescription authority.
- Every result freezes cutoff/timezone, exact windows/slices, included and excluded activity and
  sample revisions, coverage, reasons and formula provenance. A correction creates a new result; it
  does not rewrite old provenance.
- `Recent7` is recomputed at each accepted cutoff. When it becomes empty, `Capacity90` remains
  historical evidence only; neither a historical maximum nor the latest five activities is current
  behavior.
- Missing limitation, workout-intent, pause, terrain, environment or sensor context is never
  inferred by AI. The existing admission policy decides whether a constraint-only proposal or a
  follow-up is permitted; the capability vector cannot grant medical clearance.
- No Profile component may borrow another component's evidence, and missing components never become
  zero or receive redistributed weight.

### Recommendation to Product and unresolved choices

**Recommendation:** accept this five-component capability vector and the exact `Recent7`/slice
semantics as the plan-authoring doctrine. Reject the prior divide-by-four baseline, keep a numeric
Fitness Index unavailable, and admit Architecture/Backend work only after Product accepts the
deterministic `+1` contact gate and segment-record policy. The engine should receive frozen facts,
coverage and reason codes rather than a visual hexagon, categorical direction or AI-created score.

Product still must decide:

1. whether the proposed recurrence floor for one additional easy/recovery contact is accepted or
   should require an explicit runner check-in in every sparse-history case;
2. the canonical standard-distance set, elapsed-versus-official duration bases, tie policy and exact
   stream gap/jump/coverage thresholds;
3. the accepted workout-intent, terrain/environment and HR-sensor cohort vocabularies;
4. whether the partial six-day boundary in `Capacity90` is displayed as context or omitted from
   recurrence readback;
5. the user-facing naming and explanation of `EvidenceConfidence`, while preserving component-level
   missingness rather than one confidence score.

This addendum did not inspect the supplied private ZIP files, personal routes or raw samples. It did
not call a product provider, database, browser or hosted product runtime beyond the authorized
Notion lifecycle update; implement code/schema/storage/UI; mutate a plan or Calendar; or stage,
commit, push or deploy. Architecture, Backend implementation, independent QA and release remain
separate unchecked delivery edges.

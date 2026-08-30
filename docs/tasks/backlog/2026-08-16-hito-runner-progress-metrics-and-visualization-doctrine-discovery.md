# Hito Runner Progress Metrics And Visualization Doctrine Discovery

## Work Item ID

2026-08-16-hito-runner-progress-metrics-and-visualization-doctrine-discovery

## Status

completed

## Type

Tracked — Running Coach metric-discovery and product contract

## Priority

high

## Owner

PRODUCT

## Epic

runner-evidence-and-progress

## Stage

Product acceptance complete — Designer chart-and-records discovery dispatched

## Next Recommended Role

DESIGNER

## Parent

[Runner Core Roadmap](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Evidence From

[Runner Activity History And Explainable Progress Experience](./2026-08-02-runner-activity-history-and-explainable-progress-experience.md)

## Scope

Define the runner-facing metric product for the existing Progress tab: what is useful, safe, and
truthful to calculate now; which metrics require future data; how every result should behave when
evidence is partial or missing; and what visual/period/interaction contract the later Design System
work must support. This discovery writes no runtime source, no charts, no production formulas, and
no fixtures.

## Archive Intent

Retain through Product acceptance and the downstream Backend/Design System planning; compact to the
accepted metric catalogue, evidence rules, and successor boundaries afterwards.

## Task

Define a coherent Progress experience that helps a runner understand volume, consistency, workload,
and supported signs of improvement without pretending to diagnose health or calculate a fictional
overall condition score. It must start from current factual data rather than proposed UI patterns.

## Confirmed Evidence

The existing Progress product already surfaces factual 28-day sessions, running time, distance,
elevation gain, longest distance, longest duration, accepted records, reported session-RPE load,
and weekly reported-load windows. Per-activity pace and observed average heart rate can be present.
The current product explicitly declares detailed pace/heart-rate/aerobic-efficiency/durability
metrics unavailable when required activity samples are absent. The earlier Progress task is
completed and has no active successor defining a new metric catalogue or a chart interaction
system.

## Required Outcome

- A prioritized v1 catalogue of runner-value metrics available now, grouped into volume,
  consistency, completion/adherence, training load, and factual performance evidence.
- For every candidate: runner question answered, exact input facts, unit, calculation window,
  denominator, inclusion/exclusion rules, evidence-confidence state, safe plain-language wording,
  recommended visual form, and whether it is a current fact, a gated future metric, or out of scope.
- A clear answer on whether any non-medical "current state" summary is warranted; do not invent a
  score where current evidence cannot support it.
- An explicit distinction between zero, partial evidence, unavailable, updating, and not-applicable
  states.
- A brief chart-system brief for later DESIGN SYSTEM work: suitable period presets/custom range,
  single/multi-series behavior, hover/focus/keyboard equivalent, tooltip/data-table disclosure,
  units, missing-data gaps, responsive behavior, and no-colour-only meaning.
- A data-gap and ownership map: what Backend must expose or calculate, what FRONTEND Product should
  render, and what DESIGN SYSTEM must make reusable. Do not make those roles' changes yourself.

## What Not To Touch

No schema, queries, formulas, local fixtures, activity data, health diagnosis, injury treatment,
medical readiness claims, AI/provider calls, Progress UI, Design System source, Figma, Admin,
Marketing, hosted state, dependencies, Git lifecycle, or unrelated dirty work. A plan is only an
immutable source artifact; no Progress metric may restore a global active-plan/container authority.

## Validation Expectations

Inspect only existing Progress source/product contracts and accepted activity evidence. Ground
recommendations in running-coach reasoning and current evidence availability; cite external guidance
only where it directly changes a safety or metric recommendation. Verify every proposed v1 metric
against an existing input or mark it gated/unavailable. Run Markdown formatting, link validation,
and diff hygiene. Return one concise implementation-ready matrix and a single recommended sequencing
decision; do not claim implementation, browser, QA, hosted, release, or deployment acceptance.

## Running Coach Discovery Receipt — 2026-08-16

### Tracked Preflight

- **Task / mode:** Hito Runner Progress Metrics And Visualization Doctrine Discovery / Tracked.
- **Accepted input:** Ivan requested the discovery now. This is a product/coaching decision task,
  not a reported defect; no root-cause claim is invented.
- **Canonical seam:** this backlog item is the only changed artifact. The existing Progress product
  contract, factual and Gate 4 read models, and accepted formula policy are reused as evidence.
- **New runtime artifacts:** none.
- **Obsolete path removed:** none. The current text-first Progress presentation remains valid until
  Product accepts and dispatches a later implementation slice.
- **Role boundary:** no formula, persistence, UI, chart primitive, fixture, provider, or Calendar
  implementation was performed. No subagent was used.

### Evidence Inspected And Preserved

- The current Product contract exposes adjacent current/previous rolling-28-day factual snapshots,
  Monday-based calendar-week snapshots, reported session-RPE load windows, accepted records, and
  explicit advanced-metric unavailable/updating states.
- Current facts are: sessions, observed timer-based running time, canonical distance, evidence-backed
  elevation gain, longest observed distance, and longest observed timer duration. Every fact carries
  its own availability, confidence, included count, missing count, and missing reasons.
- Reported load is the accepted `actual observed duration × runner-reported whole-session RPE 1-10`
  arbitrary-unit measure. Partial sessions use observed duration without scaling; skipped workouts
  have no zero load. Aggregate windows retain included and unavailable observation counts.
- Current records include accepted exact whole-activity Hito-observed results and runner-confirmed
  official results with provenance/confidence. Calculated efforts inside longer activities and all
  detailed aerobic metrics remain unavailable while normalized streams are not persisted.
- Per-activity pace and average heart rate are observed summary facts when present. They are not by
  themselves comparable longitudinal metrics.
- The standalone Calendar model is mandatory: imported, AI-authored, and manual source artifacts are
  provenance only. A completion metric may use independent Calendar workouts only and may not depend
  on, reconstruct, or grant authority to a plan/container.

Primary current contracts inspected:

- [Runner Core roadmap detail](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
- [Progress Product specification](../frontend-specs/2026-08-02-runner-activity-history-and-explainable-progress-experience.md)
- [Runner Activity Intelligence formula policy](../running-coach/2026-08-02-runner-activity-intelligence-formula-policy-amendment.md)
- [Runner Profile Constitution](../running-coach/2026-07-30-hito-runner-profile-constitution.md)
- `src/lib/runner-activity/read-model-types.ts`
- `src/lib/runner-activity/product-contract.ts`
- `src/lib/runner-activity/fact-snapshots.ts`
- `src/lib/runner-activity/metric-formulas.ts`
- `src/components/progress/FactualProgressPanel.tsx`

No new external guidance was needed to admit a v1 metric. The accepted Hito formula policy already
contains the material research basis for session-RPE and future comparable-aerobic metrics; this
receipt narrows presentation and evidence eligibility rather than changing those formulas.

### Classification

- **`v1-now`:** the current canonical Progress model already contains the value and its evidence
  state. A later implementation may present it differently but must not create new arithmetic in
  Frontend or Design System.
- **`gated-future`:** the runner question is useful, but an accepted canonical input, denominator,
  historical contract, or persisted stream is absent.
- **`out-of-scope`:** the candidate is misleading, medically suggestive, behaviorally unsafe, or
  superseded by a more truthful metric even if some raw inputs exist.

### Implementation-Ready Metric Catalogue

#### Volume

| Metric / class                   | Runner question                                               | Exact evidence and input                                                                                                                                                | Unit, window, denominator                                                                                               | Inclusion / exclusion and missing behavior                                                                                                                                                                                                             | Safe wording                                                                                            | Recommended visual                                                                               |
| -------------------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| **Recorded sessions — `v1-now`** | How often did I run recently?                                 | `rolling28Day.current/previous.facts.sessions` and weekly `facts.sessions`, from accepted canonical recorded running activity revisions dated by historical local date. | Sessions; current and previous adjacent 28-day windows plus returned Monday-based weeks; no ratio denominator.          | Include matched and unmatched accepted runs equally. Exclude deleted/non-running activities and rows lacking a historical local date or current accepted revision. No-activity Progress uses the existing empty state rather than six fake zero cards. | “8 recorded runs in the last 28 days.” Never “8 successful workouts” or “fitness improved.”             | 28-day headline; weekly vertical bars with exact counts and dates.                               |
| **Running time — `v1-now`**      | How much observed running time did I accumulate?              | `facts.runningTime`; sum of canonical observed timer duration only.                                                                                                     | Minutes/hours; same windows; denominator is activities with observed timer duration, reported as `included / eligible`. | Missing timer duration is omitted, not estimated from distance, pace, elapsed time, or prescription. Partial when any eligible activity lacks timer duration; unavailable when none has it.                                                            | “5 h 12 min recorded running time · based on 7 of 8 runs.” Not “time trained” when coverage is partial. | Default candidate for one weekly single-series bar chart; current/previous 28-day paired values. |
| **Distance — `v1-now`**          | How far did I run?                                            | `facts.distance`; sum of accepted canonical observed distance.                                                                                                          | Canonical kilometers, localized to km/mi for display; same windows; denominator is activities with observed distance.   | Missing distance is omitted, never zero or derived from pace/time. Show partial coverage and missing count.                                                                                                                                            | “49.6 km recorded · 8 of 8 runs.” A larger value is “more distance,” not “better fitness.”              | Weekly bars or current/previous paired bars; never share an axis with time or load.              |
| **Elevation gain — `v1-now`**    | How much climbing was recorded?                               | `facts.elevationGain`; sum only where elevation gain has accepted evidence/provenance.                                                                                  | Canonical meters, localized to m/ft; same windows; denominator is activities with observed elevation gain.              | Missing elevation is not flat/zero. Partial coverage must remain visible; unavailable when no activity has elevation evidence.                                                                                                                         | “620 m recorded elevation gain · based on 5 of 8 runs.”                                                 | Optional weekly bars; hidden rather than empty when unavailable.                                 |
| **Longest distance — `v1-now`**  | What was my longest recorded run in this period?              | `facts.longestDistance` plus its contributing activity/revision.                                                                                                        | km/mi; each 28-day window; maximum over activities with observed distance, not a ratio.                                 | Same accepted-run boundary; missing distance is excluded with partial coverage. This is a period fact, not a lifetime record or quality verdict.                                                                                                       | “Longest recorded run: 14.2 km.”                                                                        | Current/previous value pair with activity link when supported; no trend line.                    |
| **Longest duration — `v1-now`**  | What was my longest observed running duration in this period? | `facts.longestDuration` plus its contributing activity/revision; observed timer duration.                                                                               | Minutes/hours; each 28-day window; maximum over activities with timer duration.                                         | Do not substitute planned, elapsed, or estimated duration. Missing timer duration produces partial/unavailable state.                                                                                                                                  | “Longest recorded running time: 1 h 24 min.”                                                            | Current/previous value pair; no combined “longest run score.”                                    |

#### Weekly And Monthly Consistency

| Metric / class                                                      | Runner question                                               | Exact evidence and input                                                                                                                                                                                                                                             | Unit, window, denominator                                                                                                                                        | Inclusion / exclusion and missing behavior                                                                                                                                                                                                                                                                                                                                                                                | Safe wording                                                                                                                                             | Recommended visual                                                                   |
| ------------------------------------------------------------------- | ------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| **Calendar-week frequency — `v1-now`**                              | Is my running spread across recent weeks?                     | `calendarWeeks[].facts.sessions` with exact week dates and historical-local-date basis.                                                                                                                                                                              | Sessions per returned Monday-Sunday bucket; each week is its own count, not a percentage.                                                                        | Same accepted-run boundary as sessions. A Backend-confirmed available zero is a real zero-height bar; unavailable is a gap. A partial current week must be labelled “to date.”                                                                                                                                                                                                                                            | “2, 3, 1, and 2 runs across the last four completed weeks.” Avoid “consistent/inconsistent” labels unless Product later defines a transparent criterion. | Single-series weekly bars; exact value/date on focus, hover, and data table.         |
| **Rolling-28-day participation comparison — `v1-now`**              | Did my recent participation change from the preceding period? | Current and previous `facts.sessions`, with running time/distance available as separate selectable facts.                                                                                                                                                            | Absolute session count and optional signed difference between adjacent non-overlapping 28-day windows; no percentage denominator is needed.                      | Compare only the same fact and formula version. Do not compare a complete value with an unavailable value; partial field coverage blocks a field-level conclusion.                                                                                                                                                                                                                                                        | “2 more recorded runs than in the previous 28 days.” Never “more consistent,” “on track,” or “improving” from count alone.                               | Paired bars or two-value comparison; one metric/unit at a time.                      |
| **Calendar-month totals — `gated-future`**                          | What did I do in each named month?                            | Requires canonical `calendar_month` fact snapshots or a Backend-approved custom-range bucket contract; current rolling 28 days must not be relabelled as a month.                                                                                                    | Sessions, minutes, km/mi, or m/ft per local calendar month; denominator follows each factual field's evidence coverage.                                          | Gate until month boundaries, partial current month, timezone, corrections, and coverage are explicit.                                                                                                                                                                                                                                                                                                                     | “August to date,” not “last month” when the bucket is rolling or partial.                                                                                | Monthly single-series bars after Backend support.                                    |
| **Active days / active weeks ratio — `gated-future`**               | On how many days or completed weeks did I run?                | Requires Backend-owned unique historical local dates and an explicit completed-week selection; Frontend must not deduplicate activities or choose the denominator.                                                                                                   | Active days / days in range, or active completed weeks / completed weeks; never mix the two.                                                                     | Double-session days count once only after Backend emits the fact. Current partial week is excluded from a completed-week ratio. Missing/undated activities prevent complete confidence.                                                                                                                                                                                                                                   | “Ran on 9 of 28 days” or “active in 4 of 4 completed weeks.” No moral or health judgment.                                                                | Compact count plus weekly occupancy bars; not a calendar heatmap in the first slice. |
| **Calendar workout completion — `gated-future`**                    | How many due Calendar workouts did I complete?                | Requires immutable historical lifecycle truth for independent Calendar workouts: due date at the accepted historical state, completed/partial/skipped/cancelled/cleared/moved state, and optional explicit activity match. Source-plan provenance is never an input. | Counts first; optional completed / eligible-due percentage for a named week or range. Denominator is independent Calendar workouts that became due in the range. | Completed is numerator. Partial and skipped remain separate counts; skipped stays in denominator but is not completed. Rest and workouts cancelled/cleared before due are excluded. Moved/edited/cleared-after-due semantics require Product acceptance and historical evidence. Unplanned activity contributes volume but not completion without an explicit match. No due workouts is `not_applicable`, not 0% failure. | “3 of 4 due Calendar workouts completed · 1 partial.” Never “plan adherence,” “failed the plan,” or a source-container score.                            | Segmented counts plus exact table; no single success ring.                           |
| **Streak, compliance grade, or consistency score — `out-of-scope`** | Am I “good” or “on track”?                                    | Would compress schedule, illness, travel, edits, partials, and unplanned runs into a behavioral score.                                                                                                                                                               | No accepted unit or honest denominator.                                                                                                                          | Do not calculate from sessions, completed weeks, or source-plan targets.                                                                                                                                                                                                                                                                                                                                                  | None. Keep factual frequency and completion counts instead.                                                                                              | None; no flame, league, grade, or ring.                                              |

#### Reported Training Load

| Metric / class                                                                                        | Runner question                                              | Exact evidence and input                                                                                                                                                                                             | Unit, window, denominator                                                                                                                                                       | Inclusion / exclusion and missing behavior                                                                                                                                                                                                                                           | Safe wording                                                                                                                                            | Recommended visual                                                                                                       |
| ----------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| **Reported session-RPE load — `v1-now`**                                                              | How much internal effort did I report across recent running? | Current Gate 4 observation: canonical observed timer duration, or accepted elapsed fallback with partial confidence, multiplied by immutable runner-reported whole-session RPE `1-10` on the same activity revision. | AU; current/previous adjacent 28-day windows and calendar weeks. Coverage denominator is all Gate 4 activity observations in the window: `included / (included + unavailable)`. | Include completed and partial activities with accepted duration/RPE; partial uses actual duration without scaling. Exclude skipped, missing/ambiguous links, invalid RPE, or absent duration as unavailable observations. If none qualifies, the aggregate is unavailable, not 0 AU. | “Reported load: 620 AU · based on 6 of 8 runs.” “Higher/lower” is allowed only with comparable coverage; never “better,” “recovered,” or “overtrained.” | Weekly single-series bars plus current/previous paired values; tooltip/table must show coverage and unavailable reasons. |
| **Average RPE or ‘hard weeks’ label — `out-of-scope`**                                                | Was the period hard?                                         | Raw RPE exists only for some sessions and does not represent duration on its own.                                                                                                                                    | No accepted aggregate/denominator for Progress.                                                                                                                                 | Do not average across unequal session durations or infer missing RPE. The accepted load metric already preserves duration and report provenance.                                                                                                                                     | None beyond per-activity reported RPE where already appropriate.                                                                                        | None in Progress v1.                                                                                                     |
| **Acute:chronic ratio, monotony, strain, readiness, recovery, or injury-risk score — `out-of-scope`** | Am I safe or ready?                                          | Current facts lack the medical, recovery, long-history, and validated decision context required for such claims.                                                                                                     | No accepted unit, window, or individual threshold.                                                                                                                              | Do not derive from reported load, volume, HR, missed workouts, or plan targets.                                                                                                                                                                                                      | None. Hito may show factual load and coverage only.                                                                                                     | None; no gauge, zone, warning color, or automatic plan veto.                                                             |

#### Factual Performance Evidence

| Metric / class                                                                                                         | Runner question                                                                   | Exact evidence and input                                                                                                                                                                                               | Unit, window, denominator                                                                                                                                                  | Inclusion / exclusion and missing behavior                                                                                                                                                                                                                                      | Safe wording                                                                                                                             | Recommended visual                                                                          |
| ---------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| **Accepted whole-activity and official records — `v1-now`**                                                            | What accepted performance record do I currently hold?                             | `advancedMetrics.records.items`: exact whole-activity accepted distance plus elapsed time, or runner-confirmed official result, each with activity/evidence revision, class, context, confidence, and formula version. | Elapsed time for an exact named distance; entire accepted history through `asOfDate`; no ratio denominator. Fastest item is selected inside record class/distance/context. | Keep Hito-observed and runner-confirmed official records distinct. Keep road/track/treadmill/trail context distinct when known. Exclude an inferred shorter-distance best from a longer summary, unsupported provider record, withdrawn/deleted evidence, or updating snapshot. | “Fastest Hito-observed 5K activity: 27:18” or “Official 10K result entered by you.” Never imply an official race from training evidence. | Ordered record list/table with provenance, date, context, and confidence; not a line chart. |
| **Per-activity average pace and observed average HR trend — `out-of-scope` for Progress aggregation**                  | Am I getting faster or fitter?                                                    | Individual history items may contain backend-derived average pace and observed average HR.                                                                                                                             | Pace and BPM per activity; no honest cross-activity denominator or comparable window from summary values alone.                                                            | Preserve as activity facts. Do not average or draw a trend across mixed distance, terrain, intent, stops, sensor, weather, or missing HR. Missing HR does not remove volume facts.                                                                                              | “Average pace on this activity” / “Observed average HR,” never “pace trend improved.”                                                    | Activity History/detail only. No Progress line or regression from summary averages.         |
| **Calculated best effort inside a longer activity — `gated-future`**                                                   | What was my fastest observed segment at a standard distance?                      | Persisted versioned elapsed-time and cumulative-distance samples with quality/gap/pause evidence and accepted activity revision.                                                                                       | Elapsed time by standard distance; lifetime accepted history; fastest eligible segment per record class/context.                                                           | Gate while normalized streams are not persisted. Never estimate from whole-activity average pace.                                                                                                                                                                               | “Fastest Hito-observed 5K effort” only after Gate 5-quality evidence.                                                                    | Record list with source activity/segment disclosure; no chart required.                     |
| **Pace at comparable heart rate — `gated-future`**                                                                     | At a similar observed HR, was my comparable aerobic pace different?               | Accepted fixed-HR series, persisted HR/distance/time samples, eligible continuous aerobic intent, same cohort/context/formula, and activity observations in adjacent 28-day windows.                                   | min/km or min/mi plus original speed comparison; median per-activity observations. Denominator is eligible observations per window, minimum 3 each for any direction.      | Gate at `normalized_stream_not_persisted` or any eligibility/cohort failure. `3-5` per window is provisional; `6+` established. Exclude intervals, hills, races, progression, run/walk, unclassified intent, and extrapolation.                                                 | “At approximately 145 BPM, comparable pace was faster/slower.” Not “fitness +X%.”                                                        | Paired baseline/current values and optional same-unit dot/line series with evidence counts. |
| **Heart rate at comparable pace — `gated-future`**                                                                     | At the same observed pace, was average HR different?                              | Accepted fixed-pace series and the same persisted-stream, intent, cohort, quality, and window evidence.                                                                                                                | BPM; median per-activity observation in adjacent 28-day windows; same evidence-count denominator.                                                                          | Same confidence and exclusion gates; never use target pace or goal race time as the reference.                                                                                                                                                                                  | “At approximately 6:30/km, observed HR was 5 BPM lower.” Not “heart stronger” or recovery/readiness language.                            | Paired values or same-unit dot/line series with the fixed pace shown in text.               |
| **Aerobic efficiency — `gated-future`**                                                                                | Across comparable aerobic runs, did distance per observed heartbeat change?       | Persisted valid HR and distance/time intervals, eligible continuous aerobic intent, same cohort/context/formula, one observation per activity, adjacent 28-day windows.                                                | meters per heartbeat; median of eligible activity observations; minimum 3 per window for direction.                                                                        | No summary-only fallback. Context/sensor/terrain uncertainty caps confidence; missing stream/HR/distance makes it unavailable.                                                                                                                                                  | “Across comparable aerobic runs, you covered more distance per observed heartbeat.” Never VO2max, economy lab result, or race readiness. | Paired values plus optional same-unit series; textual direction remains primary.            |
| **Durability / HR-speed decoupling — `gated-future`**                                                                  | Did I maintain external output relative to HR through comparable continuous runs? | Persisted valid stream; eligible continuous segment at least 40 timer-running minutes; equal-half efficiency; same intent/terrain/sensor/formula and duration band.                                                    | Percentage-point decoupling; median per-activity observations in adjacent 28-day windows; minimum 3 each.                                                                  | Exclude structured/fast-finish/progression/race/hill/run-walk sessions and mismatched duration bands. One run is descriptive only.                                                                                                                                              | “Second-half efficiency loss was lower across comparable long aerobic runs.” Never “endurance capacity” or “fatigue resistance score.”   | Paired values or distribution dots; zero reference line labelled, not colored as good/bad.  |
| **Controlled aerobic duration and distance — `gated-future`**                                                          | How long/far did I sustain the accepted comparable aerobic condition?             | Persisted valid stream plus accepted fixed-HR series and eligible flat/rolling road, track, or treadmill cohort under the versioned Hito rule.                                                                         | Minutes and km/mi as separate facts; per-activity and adjacent-window comparison; eligible observation counts per window.                                                  | Descriptive only in v1; hilly/trail, insufficient duration, quality failure, or absent reference series is unavailable. Do not call it maximum capacity.                                                                                                                        | “Longest controlled aerobic duration in this window: 68 min.”                                                                            | Two small multiples or separate rows; never a dual-axis chart.                              |
| **Universal fitness/current-state score, VO2max proxy, race prediction, or health/readiness verdict — `out-of-scope`** | How fit/healthy/ready am I?                                                       | No current accepted evidence can truthfully compress these claims.                                                                                                                                                     | No accepted unit, denominator, or calibration.                                                                                                                             | Do not infer from volume, records, reported load, average HR/pace, body data, missed sessions, or future Gate 5 metrics.                                                                                                                                                        | None. A future race prediction would require a separate accepted contract.                                                               | None; no score, gauge, ring, grade, league, or diagnostic color.                            |

### Current-State Summary Decision

A **factual recent-training summary is warranted; a “current state” classification is not**.
The first Progress viewport should remain:

1. `Last 28 days: {sessions} runs · {running time} · {distance}` with exact dates and coverage.
2. At most one neutral comparison of the same complete fact against the preceding 28 days, for
   example `2 more recorded runs than in the previous 28 days`.
3. Optional quiet lines for reported load coverage and a newly accepted record when present.

Do not label the runner `ready`, `fit`, `improving`, `declining`, `on track`, `consistent`, or
`undertrained` from v1 facts. The summary must not average unlike metrics or choose an internal
score. When detailed comparable evidence eventually exists, its metric-specific narrative remains
separate and names windows, units, observations, context, and confidence.

### Exact Evidence-State Semantics

| State              | Meaning                                                                                                             | Rendering rule                                                                                                                                                               |
| ------------------ | ------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Zero**           | Backend explicitly returned an available value of `0` for a complete, known bucket.                                 | Plot/display zero. Do not infer zero from an empty array, null, or missing field. The all-time no-activity experience may remain one empty state instead of a grid of zeros. |
| **Partial**        | A value exists, but some eligible activities/observations lack the field or use an accepted lower-confidence basis. | Show value plus `included / eligible` or `included / total observations`, a `Partial evidence` label, and grouped missing reasons. Use pattern/marker/text, not color alone. |
| **Unavailable**    | No eligible value can be emitted because the input, denominator, stream, or evidence minimum is absent.             | Emit/render `null`, no point/bar, and one stable runner-safe reason. Never plot it at zero or carry forward an older value as current.                                       |
| **Updating**       | A correction/deletion/recalculation is in progress and stale values are not current.                                | Replace the affected summary/chart with one updating state; do not plot stale values behind a spinner.                                                                       |
| **Not applicable** | The metric does not apply to the factual situation, such as Calendar completion when no workout became due.         | Omit from the summary; in a requested detail/table, say `Not applicable` with the reason. Never convert it to 0% or failure.                                                 |

### Shared Chart-System Brief For DESIGN SYSTEM

| Requirement                      | Shared contract                                                                                                                                                                                                                                                                                                                 |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source boundary**              | Charts receive already-shaped Backend/Product points: series ID, metric label, exact bucket dates, value or state, unit, coverage, confidence, and missing reason. DESIGN SYSTEM does not calculate buckets, deltas, confidence, eligibility, or coaching meaning.                                                              |
| **Period control**               | Support `28 days` as the first enabled preset. Architecturally allow Product to add server-supported `12 weeks`, `6 months`, and `Custom` later. The UI exposes only periods Backend advertises. Always show exact inclusive dates and label a partial current bucket `to date`; never call rolling 28 days a calendar month.   |
| **Custom range**                 | Accept Product/Backend-provided start/end and bucket resolution. The control validates selection only; it does not fetch, aggregate, pad, or reinterpret data. A retention/max-range decision remains Product/Backend-owned.                                                                                                    |
| **Single series**                | Default and first implementation. Weekly bars for discrete volume/load, paired values/bars for adjacent 28-day comparisons, and record lists outside the chart primitive.                                                                                                                                                       |
| **Multiple series**              | Maximum two only when values share the same unit, window, and evidence meaning. No dual axes. Different units use small multiples or a selector, so sessions, minutes, distance, elevation, AU, pace, and BPM are never overlaid as if comparable.                                                                              |
| **Pointer, touch, and keyboard** | Hover is enhancement only. Hover, focus, tap, and activation reveal the same disclosure. Keyboard users can enter the plot, use arrow keys to move by point, Home/End to reach bounds, Escape to close, and retain visible focus. Do not put every dense point in the page tab order.                                           |
| **Tooltip truth**                | Show series name, exact bucket dates, formatted value/unit, complete/partial/unavailable state, included/eligible coverage, and grouped missing reason where applicable. A tooltip never hides the only explanation or uses an unlabeled percentage.                                                                            |
| **Data-table equivalent**        | Every chart has a reachable `View data` disclosure/table containing period, value, unit, state, coverage, and missing reason. The table is the keyboard/screen-reader truth and remains available at every viewport.                                                                                                            |
| **Missing data**                 | Available zero is a zero mark; unavailable is a gap; partial is a labelled/patterned mark; updating replaces stale series; not-applicable is omitted. Line charts break across gaps. No interpolation, carry-forward, or decorative smoothing that implies observations.                                                        |
| **Units and axes**               | One unit per axis, printed in the axis title and every tooltip/table value. Localize distance/elevation display without changing canonical truth. Duration is formatted consistently. Pace never silently switches to speed; lower pace values must be explained textually rather than by color or inverted “better” semantics. |
| **Responsive behavior**          | At 375px, use one chart column, readable minimum plot height, reduced tick density, and 44px touch targets without page-level horizontal overflow. Preserve the same period, values, states, and data table; simplify labels, not evidence.                                                                                     |
| **Non-colour meaning**           | Different series/states use labels, marker shapes, line styles, patterns, and explicit text in addition to color. Direction and confidence are always written. Warning/destructive color is reserved for a real data error, not a lower value or missed workout.                                                                |
| **Motion**                       | Animation is non-essential and never delays value disclosure. Reduced-motion users receive immediate updates; no celebratory counters, line drawing, or health-like pulsing.                                                                                                                                                    |

Recommended visual mapping:

- **Weekly volume/frequency/load:** single-series vertical bars.
- **Current versus previous 28 days:** paired bars or two-value comparison with both originals.
- **Longest facts and records:** text/list/table, not charts.
- **Future comparable aerobic metrics:** paired values or quiet dot/line series only after Gate 5;
  the evidence statement remains primary.
- **Never use:** gauge, ring, radar, dual-axis chart, league/grade, compliance donut, or a chart whose
  only disclosure is hover.

### Ownership And Handoff Boundaries

#### PRODUCT — next owner

- Accept or amend the catalogue, factual-summary limit, first enabled period, and visual order.
- Keep Calendar completion gated until its independent-workout denominator and historical lifecycle
  are accepted under the standalone Calendar model.
- Decide whether the first implementation is only the existing 28-day/weekly facts and reported load
  (recommended) before dispatching any owner.
- Do not implement source or dispatch a successor without Ivan's required current-discussion consent.

#### BACKEND — later contract/read-model owner

- Confirm that the existing weekly facts, adjacent 28-day facts, load coverage, records, and state
  metadata are sufficient for the first chart series; add only a missing chart-neutral fact/state
  contract that Product explicitly accepts.
- Own any future period/bucket support, explicit zero semantics, custom-range response, field-level
  coverage, correction/updating behavior, and all deterministic calculations.
- Own a future Calendar completion denominator only from independently owned Calendar workout
  lifecycle truth. Plan/source provenance must not affect eligibility, denominator, or permissions.
- Continue to emit `normalized_stream_not_persisted` for detailed aerobic metrics until the accepted
  persisted-stream gate exists. Do not create a summary fallback.

#### DESIGN SYSTEM — later shared-primitive owner

- Build the generic accessible chart, period selector, tooltip/focus disclosure, legend, axes,
  zero/partial/gap/updating treatment, data-table equivalent, responsive behavior, and non-colour
  series semantics from the accepted brief.
- Keep metric names, formulas, thresholds, coaching claims, period availability, and Product page
  hierarchy outside the primitive.
- Reuse existing Hito typography, tokens, focus, disclosure, table, skeleton, and reduced-motion
  owners; do not create a Progress-only visual language.

#### FRONTEND Product — later composition owner

- Compose the accepted Progress hierarchy and map Backend-returned points/states into DESIGN SYSTEM
  primitives without local aggregation, deltas, eligibility, confidence, or completion arithmetic.
- Keep the factual 28-day summary and textual/data-table truth available with charts; charts are not
  a replacement for evidence and missing-state explanations.
- Preserve Activity History as the home for per-activity average pace/observed HR. Do not turn those
  summaries into a longitudinal Progress trend.
- Render Calendar completion only after Backend returns the accepted independent-workout contract;
  never query or infer a source plan/container.

### One Recommended First Implementation Sequence

1. **PRODUCT accepts this v1 subset:** sessions, running time, distance, elevation, longest facts,
   weekly factual series, reported load with coverage, and accepted record list. It explicitly keeps
   Calendar completion, custom/long periods, Gate 5, and scores out of the first slice.
2. **BACKEND performs a bounded contract-readiness pass:** reuse the current Progress product model;
   either confirm it already supplies the exact weekly points/states or return one narrowly scoped
   missing field/state contract. No new coaching formula or plan authority is admitted.
3. **DESIGN SYSTEM implements one accessible single-series weekly bar primitive** plus the shared
   tooltip/focus/data-table and zero/partial/gap/updating contracts. Use current 28-day support only;
   keep longer/custom periods dormant.
4. **FRONTEND Product adds the weekly chart beneath the existing factual 28-day summary**, with a
   selector for one fact at a time, preserves the current records/load disclosures, and performs no
   metric arithmetic.
5. **PRODUCT may later route independent QA.** Calendar completion and Gate 5 return as separate
   Product decisions and owner handoffs, not scope absorbed into this first sequence.

### Validation Inventory

| Check                                              | Scenario / environment                                                                                      | Result                      | Evidence                                                                                                                                                                                 |
| -------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Policy and role preflight                          | Current `AGENTS.md`, Running Coach role, matching skill, canonical item                                     | Passed                      | Read completely before the only task-owned write.                                                                                                                                        |
| Current Progress facts                             | Factual snapshots, Product projection, current Progress presentation                                        | Passed for discovery        | Each `v1-now` candidate maps to an existing current value/state and no new physiology is inferred.                                                                                       |
| Gate 4/5 realism                                   | Records, reported load, pace/HR, aerobic efficiency, durability                                             | Passed for discovery        | Current records/load remain evidence-bounded; stream-dependent candidates remain gated with no summary fallback.                                                                         |
| Calendar source boundary                           | Completion/adherence candidate                                                                              | Passed for discovery        | Completion is gated to independent Calendar workout lifecycle truth; source plan/provenance never owns denominator or permission.                                                        |
| Catalogue completeness                             | Question, input, unit, window, denominator, inclusion/exclusion, missing/confidence, wording, visual, class | Passed                      | Every candidate row supplies the requested fields.                                                                                                                                       |
| Chart doctrine                                     | Period, series, interaction, tooltip/table, missing data, units, responsive, non-colour meaning             | Passed                      | Shared requirements are explicit and owner-neutral.                                                                                                                                      |
| Runtime/browser/database/hosted/release validation | Outside Running Coach discovery scope                                                                       | Not run — required omission | No SQL, scripts, browser QA, migrations, providers, fixtures, implementation, hosted mutation, staging, commit, push, release, or deployment work occurred; no acceptance claim follows. |

### Discovery Outcome

The coaching discovery slice is complete. The item is `ready` for Product acceptance; no
implementation or QA is accepted. **Recommended next owner: PRODUCT.** The first implementation
should visualize current weekly facts through one shared accessible bar primitive after a bounded
Backend contract check. Calendar completion, longer/custom periods, and Gate 5 remain explicit
future gates.

## Product Acceptance Decision — 2026-08-16

Ivan accepted the factual Progress direction and added two requirements:

- keep the existing **Longest recorded distance** fact and make its period/evidence basis visible;
- add a future **verified best-time** readback for exactly `1 km`, `5 km`, `10 km`, Half Marathon
  (`21.0975 km`), and Marathon (`42.195 km`). A record is shown only when Backend can emit an
  accepted exact result with provenance. Hito must not derive a personal best from a segment inside
  a longer activity, extrapolate, interpolate, or present missing evidence as a time.

The first visual system remains factual: a 28-day summary, weekly single-series values, records as
readback/list truth, explicit coverage, and no fitness/readiness score. A new DESIGNER discovery
will specify the shared Hito chart system before the bounded Backend readiness check and DESIGN
SYSTEM implementation; it will not change formulas, data, or Progress source.

## Product Evidence Policy Amendment — 2026-08-16

Ivan accepted a FIT-only actual-result policy. Actual distance, elapsed time, elevation, pace,
records, and any personal best must be derived from a durably attached, successfully parsed FIT
file. A Calendar workout with no FIT may display `Completed as planned` and its scheduled
prescription, but it does not contribute a factual actual/result value, record, or PB. Manual
official-result entry and the former `Hito-observed` wording are not part of this product direction;
runner copy must say `From FIT file`. The future Backend chart/record payload owns every eligibility,
matching, no-result, and unavailable decision; Frontend and Design System do not infer them.

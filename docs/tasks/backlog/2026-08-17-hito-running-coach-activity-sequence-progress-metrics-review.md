# Hito Running Coach Activity-Sequence Progress Metrics Review

## Work Item ID

e7eabdca-6cdc-4338-acf2-de465053aefd

## Status

completed

## Type

Tracked — Running Coach discovery

## Priority

high

## Owner

PRODUCT

## Epic

runner-evidence-and-progress

## Parent

[Runner Core Roadmap](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Evidence From

[Runner Progress Metrics And Visualization Doctrine Discovery](./2026-08-16-hito-runner-progress-metrics-and-visualization-doctrine-discovery.md)

## Scope

Define the runner-value and sports-safety input for a future factual activity-sequence Progress
view. The candidate uses every eligible accepted FIT run in a Product-defined calendar period;
`20 runs` was an example, not a product limit. This is a read-only coaching review; it does not
implement charts, formulas, data contracts, UI, fixtures, or training recommendations.

## Archive Intent

Retain through Designer and Product decisions, then compact to the accepted metric priorities,
comparison constraints, and unavailable-data rules.

## Task

Recommend which factual per-run observations are useful to a runner over an activity sequence, which
ones can be shown together, and which must be gated because distinct workout intent, terrain,
duration, or context make comparison misleading. The result is an input to the Designer's line-chart
composition decision, not a product implementation brief.

## User Direction

Ivan requires an activity-level view across an explicit selectable period. Every eligible accepted
FIT activity in the chosen period remains in scope; `20 runs` was an example, not a cap. He wants
RUNNING COACH to identify what is actually interesting to a runner; DESIGNER will later decide what
is shown and where.

## Confirmed Product Facts

- Actual distance, timer duration, elevation, pace, and PB evidence come only from successfully
  parsed durable FIT files. A workout completed without FIT is scheduled-completion information, not
  an activity metric.
- The existing Backend chart payload is weekly and exact for 28 days. It does not yet supply a
  chronological all-eligible activity series for the Product-defined periods or a comparable-pace
  cohort.
- A whole-view average pace, if later admitted, must be calculated by Backend as total observed
  timer duration divided by total observed distance; it must not average the individual pace values.
- Existing doctrine rejects readiness, fitness, race prediction, health diagnosis, smoothing,
  interpolation, and hidden treatment of missing observations.
- Plans remain immutable source provenance only; they must not become a metric denominator or a
  current Calendar authority.

## Required Outcome

1. Rank the runner questions for the complete eligible FIT sequence in a chosen period: observed
   pace, distance, duration, elevation, reported load, frequency, and any other current factual
   candidate.
2. State which values are descriptive across all FIT runs and which require a comparable cohort
   before drawing an improvement or deterioration conclusion.
3. Recommend honest use of the selected period with every eligible FIT activity included. Decide
   whether presentation needs a density rule or an explicit cutoff; no activity may be silently
   dropped and `20` must not become a product limit.
4. Define safe wording, missing/partial/gap behavior, outlier/context disclosure, and facts that
   must stay out of the first experience.
5. Identify the smallest factual requirements a Backend activity-level payload would need, without
   specifying code or calculation implementation.
6. Return a concise recommendation for DESIGNER and PRODUCT. Do not create a durable coaching
   matrix unless needed to keep the recommendation clear.

## What Not To Touch

No runtime source, Design System, Backend, formulas, FIT ingestion, Activity/Calendar data, runner
profiles, plan/source behavior, fixtures, browser QA, Figma, hosted/provider state, Git lifecycle,
or medical/rehabilitation advice.

## Validation Expectations

Use the accepted Progress doctrine and FIT-only boundary as factual inputs. Distinguish direct source
facts from training-quality advice and name every evidence limitation. The final review must be
compact, source-backed, and clear about what does not belong in v1.

## Running Coach Discovery Receipt — 2026-08-17

### Tracked Preflight And Evidence Boundary

- **Accepted input:** Ivan requested a product/coaching review, not a defect investigation. The
  completed Progress doctrine and the current factual line-chart usage item are the source evidence.
- **Canonical seam:** this backlog item is the only changed artifact. New runtime artifacts: none.
  Obsolete source or documentation paths removed: none.
- **Current limitation:** the existing Progress contract does not supply a chronological
  all-eligible activity sequence, the three requested periods, or an accepted comparable-run cohort.
  The rules below are discovery criteria, not claims that those facts exist technically.
- **Role boundary:** no formulas, source, fixtures, product data, browser work, technical validation,
  provider calls, or Git lifecycle actions were performed. No subagent was used.
- **External evidence:** none was needed. This review narrows the accepted Hito evidence doctrine; it
  does not add physiological or medical claims.

### Prioritized Runner Questions

| Priority | Runner question                                       | Honest first answer                                                                                   | Interpretation boundary                                                                                                                                                                |
| -------- | ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1        | What did each recorded run look like?                 | Exact date plus observed distance and timer duration for each accepted FIT run.                       | Session size and workout mix are descriptive; longer or farther is not automatically better.                                                                                           |
| 2        | How often did I record a run, and where are the gaps? | Full-period FIT run count and real calendar spacing.                                                  | A gap means no accepted FIT-recorded run, not proof that the runner did no activity or lost fitness.                                                                                   |
| 3        | How did observed average pace vary between runs?      | One exact pace fact per eligible activity, with distance, duration, elevation, and context beside it. | Mixed workouts are not a comparable performance series. A faster point is not by itself improvement.                                                                                   |
| 4        | How much climbing accompanied each run?               | Recorded elevation gain where evidence is available.                                                  | Total gain helps explain context but does not establish the same terrain, surface, or elevation profile.                                                                               |
| 5        | How much effort did I report for each run?            | Backend-accepted reported session-RPE load for the same FIT activity, with coverage.                  | Higher or lower load can reflect duration, reported effort, or both; it is not readiness, recovery, or injury risk.                                                                    |
| 6        | Did comparable repeated runs change?                  | No conclusion in the first experience.                                                                | This needs an accepted cohort with comparable intent, terrain/surface, duration or distance structure, recording basis, and material context before any deterministic direction claim. |

Distance, duration, pace, elevation, and reported load may appear together in the active-point
readback or data table. Only one metric and unit should define the plotted vertical scale at a time;
putting unlike units on one plot would create a relationship the evidence does not support.

### Honest Period And Display-Density Rule

The selected period defines one complete eligible set. There is no activity-count cap in this
coaching recommendation:

1. Include **every eligible accepted FIT run** inside the Backend-returned exact dates, ordered
   oldest to newest. Real activity dates and gaps remain visible; the points must not be evenly
   spaced and presented as a time trend.
2. Say `Showing all {N} FIT-recorded runs from {start} to {end}.` If the period contains no accepted
   FIT run, say `No FIT-recorded runs in this period.`
3. Do not sample, truncate, group, or preferentially select runs to make the plot cleaner. There is
   no evidence-backed reason for a fixed cutoff, and `20` must not become one.
4. Display density may change **presentation only**: Designer may reduce axis tick labels or passive
   point labels while retaining every data point, every keyboard/touch-reachable observation, and
   the complete data table. If a plot cannot remain legible, use an explicit complete-table or
   navigation treatment rather than silently dropping activities.
5. Period run count, frequency, and any total shown beside the sequence use the same complete set of
   all {N} eligible FIT runs. The response must make returned count equal eligible count; otherwise
   the sequence is incomplete and must not be labelled `all`.

The period label must resolve to Backend-returned exact inclusive dates; Designer must not make a
rolling range look like a calendar period. Do not compare apparent slopes or point density between
periods; different ranges contain different numbers and mixes of workouts.

### Comparison, Gap, And Outlier Rules

- **Observed pace:** safe copy is `Observed average pace by FIT-recorded run` plus
  `Different workouts are not directly comparable.` A connector may communicate chronology only;
  it must not be labelled a trend. Do not say `pace improved`, `faster trend`, or compare first and
  last points without an accepted comparable cohort. Lower pace values mean a faster recorded
  average, not better fitness.
- **Distance and duration:** safe as per-run facts and useful for explaining the shape of recent
  training. Do not reward increases or describe decreases as deterioration. Structured, recovery,
  race, hill, and long runs can intentionally differ.
- **Elevation:** show an accepted zero only as zero; missing elevation is unavailable, not flat.
  Elevation gain is supporting context and cannot normalize pace or prove terrain comparability.
- **Reported load:** show only when the runner report is validly linked to that eligible FIT run.
  Missing RPE or duration creates an unavailable point, never zero. Never label load as good, bad,
  safe, excessive, recovered, or overtrained.
- **Frequency and gaps:** use actual calendar dates and the complete full-period count. Multiple
  same-day runs remain separate accepted activities. Describe a long gap only as a period without
  an accepted FIT-recorded run.
- **Missing observations:** keep the activity in the sequence/table, mark the metric unavailable
  with a stable reason, and break the line. Do not interpolate, carry forward, smooth, estimate, or
  convert missing values to zero. State metric coverage for the plotted set and the whole period
  when a full-period summary is present.
- **Accepted outliers:** keep the exact point visible with its activity date and available context.
  Do not clip, silently remove, smooth, or diagnose it. A correction/updating state replaces stale
  truth; the presentation does not invent a sensor-error or coaching explanation.
- **Non-FIT completion:** an independently owned Calendar workout completed without FIT may appear
  only in a separate scheduled-completion fact. It creates no distance, duration, pace, elevation,
  load, PB, or sequence point and must not fill a FIT gap. Source-plan provenance is never a
  denominator or current Calendar authority.

### First-Experience Exclusions

- no regression, moving average, smoothing, forecast, first-to-last delta, percent improvement, or
  automatic `improving` / `declining` narrative;
- no fixed activity-count limit, silent sampling, or `latest 20` selection inside an otherwise
  complete period;
- no whole-period average pace in the first sequence: even a correctly Backend-computed aggregate
  compresses mixed workout intent and is easily mistaken for a performance verdict;
- no automatic same-route or comparable-run claim from distance and elevation gain alone, and no
  elevation-adjusted or conditions-adjusted pace;
- no combined score, dual-axis overlay, good/bad colour, rank, streak, compliance grade, readiness,
  recovery, fitness, health, injury-risk, or race prediction;
- no detailed heart-rate, aerobic-efficiency, durability, or calculated in-run best-effort claim
  while their accepted evidence gates remain unavailable;
- no planned-versus-actual line, cumulative goal line, source-plan metric, or non-FIT actual value;
  accepted PBs remain separate factual record readbacks rather than a mixed-run trend.

### Minimum Factual Input Required From Backend Later

| Scope                 | Required fact                                                                                                                                                                                                                            |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Period identity       | Advertised period kind, exact inclusive start/end, as-of date, and historical-local-date/timezone basis.                                                                                                                                 |
| Sequence completeness | Total eligible accepted FIT run count and returned point count, which must match; deterministic chronological order and explicit incomplete/updating state when they do not.                                                             |
| Activity identity     | Canonical activity and evidence revision, accepted/current FIT evidence state, historical local start date/time, and stable ordering for same-day runs.                                                                                  |
| Per-run observations  | Distance, observed timer duration, observed average pace with its declared duration/distance basis, elevation gain, and reported session-RPE load; each carries unit, availability/confidence, and a stable missing or updating reason.  |
| Context               | Accepted workout intent, terrain/surface or indoor context, and activity match when factually known; explicit `unknown` is valid and blocks comparability rather than excluding the descriptive point. A source plan is provenance only. |
| Full-period frequency | Count and any time buckets from the same complete set of eligible FIT runs in the selected period; non-FIT scheduled completion remains a separate fact.                                                                                 |
| Evidence states       | Explicit available zero, partial coverage, unavailable, updating, and correction/deletion behavior. Frontend and Design System do not infer these states.                                                                                |

Backend owns eligibility, complete-set counts, ordering, facts, units, states, and any future
comparable cohort. Frontend/Design System must not sample the sequence, repair missing values, infer
context, or select a performance winner.

### Concise DESIGNER Handoff

Treat this as a **factual run sequence**, not a progress verdict. The smallest honest candidate is
one selected per-run metric over every eligible accepted FIT run in the selected period, positioned
on real dates, with every active point disclosing distance, timer duration, observed pace,
elevation, reported load, context, and evidence state when available. Prefer distance or duration as
the default; admit raw observed pace only as a clearly labelled descriptive selector with the
permanent mixed-workout warning. Frequency uses the same complete full-period set. Preserve all
points, gaps, accepted outliers, exact period wording, one unit per scale, and table-equivalent
truth; reduce label density rather than data membership. Do not introduce a trend line, average
pace summary, comparison claim, physiological meaning, or plan authority.

### Product Acceptance — 2026-08-17

PRODUCT accepted the coaching boundary with these directions for the first factual sequence:

1. **Quick periods:** `This week`, `Last 7 days`, `Last 1 month`, and `Last 6 months`.
   `This week` means the runner-local Monday–Sunday calendar week; values after the current
   as-of date are future days, not missing observations. `Last 7 days` is the inclusive rolling
   seven-day interval ending on the as-of date. `Last 1 month` and `Last 6 months` are inclusive
   rolling calendar intervals ending on the as-of date; the Backend owns month-length and leap-date
   resolution. Every control visibly discloses its exact start and end dates.
2. **Custom period:** the runner can select an inclusive start and end date in a calendar. The end
   date cannot exceed the current as-of date; Backend returns the canonical runner-local range and
   the complete eligible sequence for it.
3. **First metric policy:** distance or timer duration is the default. Observed pace may be a
   descriptive selector with the mixed-workout warning. Do not add a whole-period average pace in
   this first experience.
4. **Completeness:** retain every eligible accepted FIT activity, reduce labels rather than points,
   and always provide the full table equivalent. No comparable-context taxonomy or performance
   conclusion is admitted in this slice.

Industry patterns intentionally distinguish current calendar units from rolling windows and custom
ranges; Hito does the same rather than calling all of them a generic “month.” See
[Tableau relative-date filters](https://help.tableau.com/current/pro/desktop/en-gb/qs_relative_dates.htm),
[Amplitude date-range modes](https://amplitude.com/docs/guides-and-surveys/analyze-a-survey), and
[Garmin Reports ranges](https://support.garmin.com/en-GB/?faq=99CGXYuO9u7lywZQWn7B46).

The Running Coach slice is **complete**. The next work is the existing DESIGNER line-chart usage
discovery. There is no implementation, design, technical-validation, QA, hosted, release, or
deployment acceptance.

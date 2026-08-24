# Hito DS Factual Line Chart Usage Discovery

## Work Item ID

cd98384a-3b5b-432b-a38a-5b60238d69e4

## Status

ready

## Type

Tracked — Design System discovery

## Priority

high

## Owner

PRODUCT

## Epic

runner-evidence-and-progress

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Hito Running Coach Activity-Sequence Progress Metrics Review](./2026-08-17-hito-running-coach-activity-sequence-progress-metrics-review.md)

## Evidence From

[Runner Progress Metrics And Visualization Doctrine Discovery](./2026-08-16-hito-runner-progress-metrics-and-visualization-doctrine-discovery.md)

[Hito Running Coach Activity-Sequence Progress Metrics Review](./2026-08-17-hito-running-coach-activity-sequence-progress-metrics-review.md)

## Scope

Decide whether Hito needs a separate factual line-chart contract, which runner questions justify it,
and what Backend-shaped data must exist before it is implemented. This is design/source discovery;
it does not implement a line chart, change Progress, modify Backend formulas, or add a chart engine.

## Archive Intent

Retain through Product acceptance and any later bounded implementation handoff, then compact to the
accepted line-chart uses, data contract, and explicitly rejected uses.

## Task

Produce an implementation-ready recommendation for a future factual Hito line chart. It must
distinguish values that are best compared as discrete totals from values whose change over a longer
time sequence is meaningful. Define the smallest useful initial use, period/bucket requirements,
interaction and table parity, missing-data behavior, and the exact condition for a later DESIGN
SYSTEM implementation task.

## User Direction

Ivan wants a line chart available in the Design System before Progress adoption grows. Its primary
candidate is an activity-sequence view: every accepted FIT run in one Product-defined period, with
one dated point per run. Quick periods are `This week`, `Last 7 days`, `Last 1 month`, and `Last 6
months`; the runner may also choose an inclusive custom calendar range ending on the current as-of
date. The runner can inspect observed pace and the factual values behind it; a sample of 20 runs is
not a product cap. The discovery must decide where an activity-level line genuinely helps a runner
compare pace, time, distance, and other facts rather than treating the completed bar chart as the
only visualization.

## Confirmed Source Facts

- The completed `HitoFactualBarChart` is intentionally the first visualisation for exact weekly
  totals: sessions, running time, distance, elevation, and reported load in one selected unit.
- The completed Backend `progress.fitProgress` payload currently advertises only one exact 28-day
  period and ordered weekly factual buckets. It does not advertise a longer time-series, a rolling
  trend, a cumulative series, or comparable aerobic-performance points.
- FIT is the only source of actual distance, duration, elevation, load, and PB facts. A completed
  Calendar workout without FIT is scheduled-completion information, never a measured point.
- The Progress doctrine permits future quiet point/line series only after a supported comparable
  evidence contract. It requires gaps for unavailable data, no interpolation/carry-forward/smoothing,
  one unit per axis, explicit coverage, and a native data-table equivalent.
- Existing shared Tooltip, focus, disclosure, table, reduced-motion, semantic surface, and factual
  bar-chart interaction contracts must be reused. The existing bar chart is not a generic engine.

## Candidate Uses To Evaluate

1. **Activity-sequence pace:** every chronological FIT run in the selected quick or custom period
   with one observed pace point per accepted activity, exact date, distance, duration, coverage,
   and context. Do not show a whole-period average pace in the first experience. Decide how the
   chart avoids claiming that unlike runs are directly comparable or that a line proves improvement.
2. **Longer-period factual volume trend:** weekly or monthly FIT distance, running time, sessions,
   elevation, or reported load when Backend advertises an exact longer period and complete bucket
   semantics. Determine whether line adds genuine comparison value beyond bars, and at what minimum
   point count it becomes appropriate.
3. **Future comparable aerobic observations:** pace at comparable heart rate or heart rate at
   comparable pace only after the separate Gate 5 evidence rule establishes eligible comparable
   observations, context, confidence, and gaps. This must be factual observation, not a fitness,
   readiness, or race-prediction score.
4. **Explicitly reject or gate:** cumulative distance toward a goal, planned-versus-actual lines,
   PB history, raw pace across unlike workouts, and any smoothed prediction until their own truthful
   product/Backend contracts exist.

## Required Outcome

1. Recommend either no line chart yet or one minimal first use, with clear rationale against the
   existing bar chart. The activity-sequence pace candidate must be considered first.
2. Define when bars remain the default: short, discrete weekly totals such as run count, time, and
   kilometres; explain when a line becomes better for activity-level observations or the same
   factual metric over a longer sequence.
3. Specify the required Backend-shaped activity/period, points, unit, state, coverage, reasons,
   average definition, and any
   comparability context. Do not ask the client to aggregate, smooth, infer gaps, select winners, or
   invent a trend.
4. Define pointer, keyboard, and touch equivalence; active-point readback; visible table data;
   Dark/Light, mobile, non-colour, zoom, and reduced-motion rules. Unavailable points break a line.
5. Include two compact desktop composition options and one mobile rule using existing Hito DS
   contracts. State whether future implementation should be a separate bounded
   `HitoFactualLineChart`, a safe extension of an existing contract, or remain unimplemented.
6. Return one exact next-owner recommendation. No runtime/UI work occurs in this discovery.

## What Not To Touch

No current `HitoFactualBarChart`, Progress composition, metric selector, PB rows, Backend formulas
or payload, Calendar/source-plan boundary, fixture, chart package, generic chart framework, token,
Figma, provider, hosted state, Git lifecycle, or browser acceptance.

## Validation Expectations

Inspect only the factual Progress doctrine, the completed bar-chart contract, its `/hitoDS` reference,
and the current Backend payload enough to establish a source-backed recommendation. Use current,
authoritative accessibility guidance for charts. Validate local links, formatting, and diff hygiene.
Mark missing Backend truth as a prerequisite rather than proposing a UI fallback.

## Stage

Designer discovery complete — Product acceptance and Backend sequence routing

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review and accept the completed Designer decision in
`docs/tasks/backlog/2026-08-17-hito-ds-factual-line-chart-usage-discovery.md`. The decision defers a
shared line-chart primitive: the first mixed-activity experience is a complete Backend-shaped
chronological point sequence without a connector, and the current Backend exposes only 28-day
weekly totals. If Ivan wants this first sequence now, create and route one bounded BACKEND contract
item for the accepted quick/custom periods and complete per-activity FIT observations. Do not route
DESIGN SYSTEM implementation until that payload exists and the point-sequence composition is
accepted. Keep weekly totals on the completed factual bar chart.
```

## Designer Discovery Receipt — 2026-08-17

### Preflight, Sources, And Decision

- **Mode and write boundary:** Tracked, read-only design discovery. This canonical item is the only
  changed artifact. The existing dirty Backend read-model owners and untracked bar-chart owners were
  inspected read-only and preserved byte-for-byte.
- **Canonical evidence:** the completed Progress doctrine, completed Backend FIT payload receipt,
  completed factual bar-chart contract and `/hitoDS` specimen, and accepted Running Coach
  activity-sequence review.
- **Current source fact:** `progress.fitProgress.chart.advertisedPeriods` currently contains one
  exact `28_days` period with Monday-week buckets for sessions, running time, distance, elevation,
  and reported load. It does not contain the accepted quick/custom period family or one point per
  activity.
- **Reuse fact:** `HitoFactualBarChart` already owns one Backend-supplied bucket series, exact period
  disclosure, pointer/focus/tap readback, roving keyboard navigation, pin/dismiss behavior,
  horizontal containment, factual states, and a visible native table. It is intentionally not a
  generic chart engine.
- **Decision:** **defer `HitoFactualLineChart`.** The useful near-term runner question is a complete
  chronological sequence of FIT-recorded runs, but mixed recovery, interval, long, hill, and race
  activities are not a comparable series. A connector would make continuity and trend the dominant
  visual claim. The first honest visualization is therefore a bounded **factual activity point
  sequence with no connector**, after Backend supplies the complete sequence contract.
- **No implementation admission:** do not add a speculative line primitive, chart package, generic
  plot engine, sampled client model, or `/hitoDS` demo with invented data. A real line contract can
  be reconsidered only for a Backend-supplied comparable temporal series.

### Maintained External Principles Applied

- [W3C WAI complex-image guidance](https://www.w3.org/WAI/tutorials/images/complex/) requires a
  concise identification plus a structured long-form equivalent for chart information. Hito keeps
  the visible summary and complete native table rather than making point hover the only source.
- [U.S. Web Design System data-visualization guidance](https://designsystem.digital.gov/components/data-visualizations/)
  describes a line as a means of depicting a trend over time, asks authors to state the intended
  message in text, preserve equivalent access, and avoid colour-only differentiation. That makes a
  line inappropriate when Hito's accepted message is only chronological order across unlike runs.
- [GOV.UK chart guidance](https://brand.design-system.service.gov.uk/data/charts/) treats title,
  subtitle, marks, annotations, axes, source, grid and plot area as an explanatory hierarchy. Hito
  therefore keeps period, metric, evidence, direction, and comparison caveat outside transient
  tooltips.

These sources inform principles only; no external component API, colour recipe, or charting package
is copied.

### Use-Case Decision Matrix

| Runner question / series                                                                         | Honest form                               | Decision and discriminator                                                                                                                                                                                                       |
| ------------------------------------------------------------------------------------------------ | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exact 28-day weekly sessions, time, distance, elevation, or reported load                        | Existing factual bars                     | Retain. These are discrete bucket totals with a meaningful zero baseline.                                                                                                                                                        |
| The same totals over later Backend-advertised weeks or months                                    | Bars by default                           | A longer period alone does not make totals continuous. Consider a line only after Product accepts a change-over-time question and Backend supplies comparable, non-overlapping bucket semantics, completion, gaps, and one unit. |
| Every accepted FIT run in one selected period                                                    | Chronological point sequence              | First useful sequence after Backend work. Use real date spacing, one point per run, no connector, no cap, and no silent sampling.                                                                                                |
| Observed pace across mixed runs                                                                  | Point sequence only, descriptive selector | Permanent copy: `Observed average pace by FIT-recorded run` and `Different workouts are not directly comparable.` Lower pace means a faster recorded average, not improvement.                                                   |
| Future pace at comparable heart rate or heart rate at comparable pace                            | Possible factual line                     | Defer until Gate 5 supplies the comparable cohort, context, formula/evidence version, coverage, and gaps. A line may show observations; it still must not become a fitness/readiness verdict.                                    |
| Cumulative target, planned versus actual, PB history, smoothed pace, forecast, fitness/readiness | None                                      | Rejected until a separate Product and Backend contract exists. PBs remain factual record readbacks, not a line.                                                                                                                  |

There is no minimum point count that automatically changes bars into lines. The semantic question,
bucket comparability, and connector meaning decide the form. Hito does not use `20 runs`, viewport
width, or a longer date range as a data-membership rule.

### Recommended First Sequence Contract

The first sequence is not a line-chart contract. It is one selected per-run metric over the complete
eligible FIT activity set for the selected period, with supporting facts available from the active
point and table.

#### Persistent explanatory copy

- Title follows the selected fact, for example `Distance by FIT-recorded run` or
  `Observed average pace by FIT-recorded run`.
- Summary: `Showing all {eligibleCount} FIT-recorded runs from {startDate} to {endDate}.`
- Evidence: `From FIT file` plus metric coverage, for example `18 of 20 runs include observed pace`.
- Pace-only caveat: `Different workouts are not directly comparable.`
- Never show `trend`, `improved`, `declined`, a first-to-last delta, a whole-period average pace, or
  a good/bad interpretation.

Distance or timer duration is the default selected metric. Pace, elevation, and reported load may
be selected only when supplied for the same complete activity set. One vertical scale has one unit.
Supporting distance, timer duration, pace, elevation, load, context, and evidence state belong in
the active readback and table; they are not additional plot axes.

#### Accepted periods

| Control         | Backend-owned exact interval                                       | Display rule                                                                                                        |
| --------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------- |
| `This week`     | Runner-local Monday through Sunday                                 | Disclose both dates. Days after `asOfDate` are a labelled future interval, not missing observations and not points. |
| `Last 7 days`   | Inclusive rolling seven-day interval ending on `asOfDate`          | Disclose both dates; do not call it a calendar week.                                                                |
| `Last 1 month`  | Inclusive rolling calendar-month interval ending on `asOfDate`     | Backend resolves month length and leap dates; disclose both dates.                                                  |
| `Last 6 months` | Inclusive rolling six-calendar-month interval ending on `asOfDate` | Backend resolves dates; disclose both dates.                                                                        |
| Custom          | Inclusive runner-local start/end with end no later than `asOfDate` | Backend canonicalizes and returns the accepted range; the control repeats both returned dates.                      |

Controls render only Backend-advertised periods. The client does not calculate period boundaries,
reuse `28_days` as `Last 1 month`, or expose a range whose complete activity sequence is absent.

### Required Backend Shape Before UI Or Design System Work

The existing weekly payload must remain intact. A later Backend slice should extend the existing
Progress product read model with one sequence owner, not replace or overload weekly bucket points.
Names below describe meaning, not an implementation-mandated TypeScript API.

| Shape                 | Required Backend truth                                                                                                                                                                                                        |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Period                | Stable ID/kind, visible label, exact inclusive `startDate` and `endDate`, `asOfDate`, runner-local timezone basis, and any future sub-interval for `This week`.                                                               |
| Completeness          | `eligibleActivityCount`, `returnedPointCount`, and a complete/current state. Counts must match before the UI says `Showing all`. No cursor, implicit cap, latest-N subset, or client sampling.                                |
| Point identity        | Canonical activity ID, evidence revision/source reference, historical local date and start time, and deterministic order for multiple same-day runs.                                                                          |
| Selected observations | Per-run distance, timer duration, observed average pace, elevation gain, and reported session-RPE load, each with numeric value, display value, unit, availability/confidence, and stable reason.                             |
| Pace basis            | The Backend-provided point declares the observed duration and distance basis used for that run. The first experience has no whole-period average; the client does not average individual paces.                               |
| Context               | Backend-known workout intent, terrain/surface or indoor fact, and activity label; `unknown` is explicit and retains the point while blocking a comparability claim. Source-plan provenance is not current Calendar authority. |
| Sequence state        | `ready`, truthful empty, `updating` with no stale sequence, unavailable/incomplete, and error/retry ownership. A returned/eligible count mismatch is incomplete, not a partially rendered `all` sequence.                     |
| Evidence changes      | Correction/removal and updating behavior tied to current FIT evidence. Accepted zero remains zero; unavailable never becomes zero.                                                                                            |

Each eligible FIT activity remains a sequence member even when the selected metric is unavailable.
It keeps its date/table row and a non-colour unavailable marker outside the value scale. A future
connector, if ever admitted for another comparable series, must break at unavailable observations;
no interpolation, carry-forward, smoothing, extrapolation, or inferred value is allowed.

### Desktop Composition Comparison

Both candidates below use a point sequence with no connector. They compare layout, not data or
sampling strategies.

#### A — Full-width sequence with readback below (recommended)

```text
Distance by FIT-recorded run                 [Period] [Metric]
Showing all N runs · 03 Aug–16 Aug · From FIT file
┌──────────────── complete real-date point field ────────────────┐
│  •       • •             •                •                    │
└─────────────────────────────────────────────────────────────────┘
[Active: 12 Aug · 10.4 km · 52:10 · 5:01/km · context unknown]
[View data]
```

- The plot receives the full content width, which best preserves real date gaps and many points.
- Hover, focus, or tap opens the same compact readback; pinning places it below the plot without
  covering marks. The table follows in the existing disclosure contract.
- Select this composition for the first implementation after Backend readiness.

#### B — Sequence with persistent details rail (retain as a later large-screen option)

```text
Observed average pace by FIT-recorded run    [Period] [Metric]
Different workouts are not directly comparable. · 03 Feb–16 Aug
┌──────────────────────────────┬───────────────────────────────┐
│ •  •     • •      •      •  │ Active run                    │
│ complete real-date sequence  │ date · pace · distance · time │
│                              │ context · evidence state      │
└──────────────────────────────┴───────────────────────────────┘
[View data]
```

- Persistent context reduces reliance on transient overlays, but the rail steals horizontal space
  and makes a six-month sequence harder to scan.
- Do not use below a wide desktop breakpoint. It is not the first implementation target and does
  not justify a second primitive.

A connected version of either composition was evaluated and rejected for the first sequence. Even
with a written caveat, the connector remains the highest-salience mark and reads as a continuous
performance trajectory across unlike activities.

### Interaction, Density, And Accessibility Contract

- **One plot tab stop:** initialize to the first available activity. `Left`/`Right` move through
  every activity in chronological order; `Home`/`End` move to bounds; `Enter`/`Space` pin or unpin;
  `Escape` dismisses. Same-day activities remain separate positions in stable Backend order.
- **Input parity:** hover, focus, and tap reveal the same selected metric and supporting facts.
  Pointer leave does not erase a pinned selection. No information exists only on hover.
- **Touch:** each interactive point owns at least a 44 by 44 CSS-pixel target. The plot does not
  capture vertical page scroll, browser pinch zoom, or long-press text selection.
- **Density:** every point remains rendered, operable, and present in the table. Reduce passive date
  ticks and labels, never point membership. When non-overlapping targets no longer fit, give the
  plot a token-based minimum width and contained horizontal scroll, preserving real time spacing.
- **Zoom:** no custom chart zoom/pan in the first slice. Period controls change the factual window;
  contained horizontal scroll handles density, and browser zoom remains untouched. Reconsider
  analytical zoom only with its own keyboard, touch, reset, and table-navigation contract.
- **Real time:** x-position follows historical local date/time rather than equal index spacing.
  Long spaces mean no accepted FIT-recorded run in that interval, not inactivity or lost fitness.
- **Value scale:** distance, duration, elevation, and load use a visible zero baseline. Pace states
  that lower numeric values are faster and never uses vertical direction, colour, or slope as a
  quality verdict. No dual axes.
- **Non-colour:** available points use a solid mark; unavailable activity members use an `N/A`
  glyph/outlined marker outside the scale; partial supporting evidence uses a pattern plus text.
  Focus uses the canonical ring. State and selection never depend on colour alone.
- **Table parity:** the visible disclosure includes date/time, selected value/unit/state, distance,
  timer duration, observed pace, elevation, reported load, context, evidence/coverage, and reason.
  It contains every activity in the same order and uses native caption, row headers, and cells.
- **Description:** title, purpose, exact period, evidence, coverage, and pace caveat are persistent
  text associated with the figure. The data table is the complete structured equivalent.
- **Reduced motion:** no line draw, point rise, spring, animated reordering, or count-up. Metric or
  period changes replace geometry immediately while preserving focus when the active activity still
  exists.

### State, Theme, And Responsive Matrix

| State / environment                     | Required observation                                                                                                                                                                                                            |
| --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ready complete                          | Returned count equals eligible count; all points, exact dates, context, coverage, and table are present.                                                                                                                        |
| Truthful empty                          | `No FIT-recorded runs from {start} to {end}.` No axes or fabricated zero series.                                                                                                                                                |
| Selected metric unavailable for one run | Retain its chronological member and table row; show `N/A` with reason and no y-value.                                                                                                                                           |
| Updating                                | Replace the whole sequence with the canonical updating state; never mix stale points with a new period/evidence revision.                                                                                                       |
| Incomplete/unavailable                  | Do not render a subset as `all`; explain the stable Backend reason.                                                                                                                                                             |
| Error                                   | Canonical error surface and owner-supplied retry action; no stale chart behind it.                                                                                                                                              |
| `This week` future days                 | Visibly labelled future interval after `asOfDate`; no points, missing markers, zeros, or coverage penalty.                                                                                                                      |
| Dark / Light                            | Reuse semantic parent surfaces, `--color-chart-1`, text hierarchy, hairline/grid, and canonical focus tokens. Verify mark, text, grid, state, and focus contrast on every admitted parent; do not add a raw route-local colour. |
| 375 px / touch                          | Stack controls, plot, pinned readback, and disclosure; keep exact dates visible; contain horizontal plot scroll; never clip the page or make the plot the only way to reach a run.                                              |
| pt-BR expansion                         | Allow title, caveat, dates, unit, and controls to wrap without covering marks or changing data membership. Do not truncate state/reason text in the table.                                                                      |

### Future Line Admission And Owner Boundary

A separate bounded `HitoFactualLineChart` becomes warranted only when all conditions below are true:

1. Product names a question where change across connected time observations is the intended factual
   message, not merely chronology.
2. Backend advertises one complete comparable series with exact period/bucket or observation
   semantics, stable unit, coverage, gaps, formula/evidence version, and no client aggregation.
3. Connecting adjacent available points is truthful. Unknown or unavailable context breaks the
   connection when it breaks comparability.
4. The experience defines a written summary, non-colour mark/line states, exact axis/domain rules,
   full input parity, and native table equivalence.

When those gates exist, DESIGN SYSTEM should implement one shared DOM/SVG factual-line primitive in
the existing `src/components/ui` and `/hitoDS` ownership seams, reusing Tooltip, focus, disclosure,
table, state-surface, theme, and reduced-motion contracts. It must not extend
`HitoFactualBarChart` with a mode flag: bars and lines encode different relationships, geometry,
zero/domain behavior, missing-point rules, and time spacing. It must not create a generic chart
framework or dependency without separate evidence.

The nearer sequence path is different:

1. **PRODUCT now:** accept this deferral and decide whether the factual activity sequence should be
   scheduled.
2. **BACKEND later, if scheduled:** add the complete accepted quick/custom period and per-activity
   FIT sequence under the existing Progress read-model ownership. This is the next technical
   prerequisite and the first implementation owner.
3. **DESIGN SYSTEM after payload proof and composition acceptance:** implement one bounded factual
   point-sequence primitive and `/hitoDS` specimen; reuse contracts above, add no connector and no
   sampling.
4. **FRONTEND Product later:** adopt the shared primitive in Progress without deriving periods,
   metrics, eligibility, context, or sequence membership.

Rollback is slice-local: the Backend addition must not change the accepted weekly payload; the
future point-sequence primitive remains unused until Product adoption; Frontend can remove the
consumer without reverting Backend facts or the existing bar chart. Stop and return to PRODUCT if
the sequence requires pagination/capping, a client-derived metric, an invented context taxonomy, a
new period, a chart package, or a comparability/performance decision.

### Validation And Remaining Boundary

- Inspected current read-model types, product projection, FIT formula owner, factual bar-chart
  primitive, and `/hitoDS` specimen read-only.
- Compared the decision with W3C WAI, USWDS, and GOV.UK maintained visualization guidance.
- Validated canonical Markdown formatting, local relative links, and repository diff hygiene after
  the documentation write.
- Not run and not claimed: runtime implementation, typecheck, unit/integration tests, build, browser
  or assistive-technology QA, Backend payload proof for the new sequence, Figma, Global QA, hosted,
  release, or deployment acceptance.
- **Next recommended owner:** PRODUCT. There is no DESIGN SYSTEM line-chart handoff now. The only
  justified next technical task, if Product schedules the experience, is a bounded BACKEND sequence
  contract using the accepted periods and complete activity set.

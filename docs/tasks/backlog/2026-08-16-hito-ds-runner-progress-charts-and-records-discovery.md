# Hito DS Runner Progress Charts And Records Discovery

## Work Item ID

97436b58-d772-4691-8423-d73cbafd1875

## Status

completed

## Type

Tracked — Design System discovery

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

runner-evidence-and-progress

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Runner Progress Metrics And Visualization Doctrine Discovery](./2026-08-16-hito-runner-progress-metrics-and-visualization-doctrine-discovery.md)

## Scope

Research and specify the shared Hito Design System chart and record-readback direction for the
runner-facing Progress tab. This is a design decision for later DESIGN SYSTEM implementation; it
does not change Progress data, formulas, backend contracts, `/hitoDS`, or product runtime source.

## Archive Intent

Retain through Product acceptance and the later Design System primitive handoff, then compact to
the accepted chart/record contract and any explicit data boundary.

## Task

Produce an implementation-ready recommendation for factual runner charts: which chart forms are
appropriate, how a runner compares values, how period/bucket length is represented, and the exact
pointer, touch, focus, keyboard, missing-state, and data-table behavior. Include the visual
relationship between the existing Longest recorded distance fact and future verified personal-best
times for `1 km`, `5 km`, `10 km`, Half Marathon (`21.0975 km`), and Marathon (`42.195 km`).

## User Direction

Ivan wants Progress to show factual distance and personal-best evidence, and wants charts designed
as a reusable Hito DS capability. Hover must make values comparable; the same information must
remain usable on touch and keyboard. Chart length/period must be intelligible rather than arbitrary.

## Confirmed Source Facts

- `FactualProgressPanel` already presents factual 28-day facts and a current-records readback.
- `runner-activity-progress-view-model.ts` already names `longestDistance` as `Longest run`.
- The accepted doctrine admits weekly factual bars and one fact at a time; it rejects dual axes,
  fitness/readiness scores, and trend claims from incomplete activity summaries.
- Hito has chart colour tokens and shared Tooltip, typography, focus, disclosure, table, responsive,
  and reduced-motion owners, but no canonical runner chart primitive is established.
- Current records are only accepted whole-activity or runner-confirmed official evidence. Segment
  reconstruction, interpolation, and extrapolation are not admitted.

## Required Outcome

1. Compare a small set of chart compositions for weekly sessions, distance, running time, elevation,
   and reported load using the accepted one-unit/single-series rule; recommend one first primitive.
2. Define period and physical-length behavior: the current enabled `28 days` window, weekly buckets,
   partial-current-week labeling, and a forward-compatible visual rule for later supported periods
   without exposing unavailable periods or creating client aggregation.
3. Specify pointer hover, focus, keyboard, touch/tap, tooltip, data-table, legend/axis, zero,
   partial, unavailable, updating, error, and responsive behavior at 1470px and 375px.
4. Specify factual records as a list/readback, not a performance gauge: distinguish a period-longest
   distance from a lifetime verified best time; define empty, unavailable, pending-verification, and
   source/provenance disclosures for standard record distances.
5. Identify exact existing Hito DS primitives/tokens to reuse and the smallest real shared gap for
   DESIGN SYSTEM. State which facts must be supplied by BACKEND rather than calculated in UI.
6. Provide 2–3 annotated desktop visual directions or comparable reference compositions in the
   canonical task. These are design evidence, not Figma/runtime mutation.

## What Not To Touch

No Progress UI/code, Design System source/validators, formulas, queries, migrations, fixtures,
activity data, source-plan/container logic, Figma file, dependencies, Admin, marketing, hosted
state, providers, Git lifecycle, browser acceptance, or medical/performance-readiness claims.

## Validation Expectations

Use current factual Progress contracts as the truth boundary. Inspect existing Hito DS primitives
and `/hitoDS` only enough to establish reuse/gaps. Check document links, formatting, and diff
hygiene. Explicitly mark any record/chart input absent from current Backend truth instead of
inventing a visual fallback. Return a design decision and a single recommended next owner; no
implementation or acceptance claim.

## Stage

Product acceptance complete — DESIGN SYSTEM primitive implementation next

## Next Recommended Role

DESIGN SYSTEM

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review and accept or amend the completed Designer decision in
`docs/tasks/backlog/2026-08-16-hito-ds-runner-progress-charts-and-records-discovery.md`.
Do not implement UI, Design System, Backend, or QA work. The source audit proves that the existing
Product model does not yet expose a truthful period-advertised chart payload or one resolved record
slot per requested distance. If accepted and Ivan gives the required current-discussion dispatch
consent, route one bounded BACKEND readiness task first. Preserve the standalone Calendar boundary,
all formula/evidence rules, unrelated dirty work, and every omitted acceptance layer.
```

## Designer Discovery Receipt — 2026-08-16

### Tracked Preflight And Decision

- **Task / mode:** Hito DS Runner Progress Charts And Records Discovery / Tracked, read-only design
  discovery.
- **Accepted product direction:** Progress remains factual. The first chart is one weekly bar series
  at a time; records are textual readback, never a gauge. No chart may imply readiness, fitness,
  adherence, or an unsupported trend.
- **Canonical write seam:** this item is the only file changed. All runtime, Design System, Figma,
  formula, query, fixture, data, hosted, and Git lifecycle owners remained read-only.
- **Reuse budget:** reuse the current Progress product model, Hito selection/focus/tooltip/
  disclosure/table/state contracts, semantic tokens, and visualization-geometry exception. Proposed
  new runtime artifacts: none in this stage. No subagent was used.
- **Decision:** recommend **Direction A, one selectable factual series with records below**. The
  smallest later shared capability is a bounded DOM/CSS `HitoFactualBarChart`, not a chart framework,
  dashboard family, dependency, period engine, or record calculator.
- **First implementation discriminator:** the current read model is not yet a truthful chart/slot
  payload. Product should route a bounded BACKEND readiness slice before Design System
  implementation.

### Current Source Inventory

| Source / owner                                                                                                                       | Current truth                                                                                                                                                                                                                                  | Reuse or gap                                                                                                                                                                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/progress/FactualProgressPanel.tsx` — FRONTEND Product                                                                | Renders the 28-day factual summary, current/previous fact disclosures, weekly fact rows, accepted record rows, reported-load disclosure, loading, empty, updating, and error states.                                                           | Retain its text-first hierarchy and state wording as the fallback/rollback surface. It has no chart interaction or fixed five-slot record readback.                                                                                                                                                   |
| `src/components/progress/runner-activity-progress-view-model.ts` — FRONTEND Product                                                  | Formats sessions, duration, distance, elevation, load, record time/class/context, and evidence reasons. It currently labels `longestDistance` as `Longest run`.                                                                                | Reuse formatting only. Later copy should say `Longest recorded distance` and include the exact period; no chart math belongs here.                                                                                                                                                                    |
| `src/lib/runner-activity/product-contract.ts` — BACKEND/Product projection                                                           | Exposes current/previous rolling 28-day snapshots, `calendarWeeks`, session-load weeks, record items, field availability/confidence/coverage, and page-level updating.                                                                         | It does not advertise periods, bucket resolution/completeness, chart-ready labels, per-slot record state, one Backend-selected record per requested distance, or a source link for the period-longest fact.                                                                                           |
| `src/lib/runner-activity/fact-snapshots.ts` — BACKEND                                                                                | Builds rolling 28-day snapshots, then Monday-Sunday calendar buckets from `startOfWeek(currentRollingStart)` through the current week.                                                                                                         | Depending on the as-of weekday, `calendarWeeks` can contain four or five buckets; the first bucket can begin before the rolling 28-day start, while the final bucket uses a cutoff inside its nominal end date. Frontend must not relabel this array as an exact 28-day plot or infer partial labels. |
| `src/lib/runner-activity/metric-formulas.ts` — BACKEND                                                                               | Uses the same calendar-week construction for reported load. Exact whole-activity matching uses a 0.05 m tolerance and supports more distances than the requested five. Fastest records remain distinct by record class, distance, and context. | Keep formulas unchanged here. A five-slot Product readback needs Backend-selected slot truth or an explicit retained-variants policy; Frontend must not choose across class/context.                                                                                                                  |
| `src/styles/foundations.css` — DESIGN SYSTEM                                                                                         | Owns Dark/Light semantic foreground, surface, focus, motion, and `--color-chart-1` through `--color-chart-5`.                                                                                                                                  | Reuse `--color-chart-1` for the single series, not a different hue per metric. Contrast must be measured against every admitted parent surface in both themes before acceptance.                                                                                                                      |
| `src/components/ui/tooltip.tsx`, `src/components/ui/hito-radio-group.ts`, `src/components/ui/hito-choice-toggle.tsx` — DESIGN SYSTEM | Own focus/hover tooltip behavior and an exclusive roving radio selection contract with arrow/Home/End navigation.                                                                                                                              | Reuse for pointer/focus hints and the Product-owned metric selector. Touch needs a persistent active-value readback because the current Tooltip is not a tap disclosure.                                                                                                                              |
| `src/styles/forms-onboarding.css`, `src/styles/controls-lists.css` — DESIGN SYSTEM                                                   | Own disclosure, choice-toggle, list-row, focus, and reduced-motion recipes.                                                                                                                                                                    | Reuse. The chart's visible `View data` disclosure composes native table semantics; it does not create a chart-only disclosure or control recipe.                                                                                                                                                      |
| `src/styles/shell-admin-analytics.css`, `/hitoDS` reference patterns                                                                 | Holds the currently demonstrated table/chart-note/bar/tooltip chrome. The chart demo is non-interactive planned-vs-actual geometry and explicitly leaves geometry local.                                                                       | Evidence of useful anatomy, not a canonical runner chart primitive. Shared tooltip/table styling currently reaches from an Admin-named stylesheet; later DESIGN SYSTEM work must reuse or relocate the canonical rules rather than copy them into Progress.                                           |

No chart package is present in the current dependency inventory. Four or five weekly bars do not
justify adding one.

### External Practice Used As Principles

- [W3C WAI complex images guidance](https://www.w3.org/WAI/tutorials/images/complex/) requires a
  concise identification plus a complete textual equivalent for chart information. Hito therefore
  keeps a visible summary and a reachable data table; the graphic is not the only truth surface.
- [USWDS data-visualization guidance](https://designsystem.digital.gov/components/data-visualizations/)
  recommends common chart forms, a single clear idea, reduced interaction, and tabular access to
  underlying values. This supports one selected bar series rather than five simultaneous plots.
- [GOV.UK chart guidance](https://brand.design-system.service.gov.uk/data/charts/) calls for explicit
  units, clear axis labels, appropriate zero baselines, and restraint with interactive charts. This
  supports zero-based weekly bars whose primary facts remain visible without interaction.
- [W3C Use of Color](https://www.w3.org/WAI/WCAG22/Understanding/use-of-color.html) and
  [Non-text Contrast](https://www.w3.org/WAI/WCAG22/Understanding/non-text-contrast.html) require
  meaning beyond hue and perceptible graphical/control boundaries. Hito uses text, position,
  pattern, marker shape, and the canonical focus ring in addition to colour.
- [W3C Tooltip APG](https://www.w3.org/WAI/ARIA/apg/patterns/tooltip/) supports focus/hover parity,
  trigger-retained focus, and Escape dismissal. It is explicitly work in progress, so Hito does not
  make Tooltip the accessibility model; the point label and table remain authoritative.
- [WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
  sets a 24 CSS px minimum or spacing exception. Hito retains the stronger accepted 44 px touch band
  for weekly buckets.
- [W3C Animation from Interactions](https://www.w3.org/WAI/WCAG22/Understanding/animation-from-interactions)
  supports disabling non-essential interaction motion. Hito uses no bar-grow entrance, bouncing,
  pulsing, or animated reordering.

### Annotated Desktop Composition Comparison

All directions use the same 1470 px viewport and the existing approximately 1024 px Progress content
column. Boxes describe hierarchy, not a new card family.

#### Direction A — one selectable series, records below — **recommended**

```text
┌──────────────────────── existing factual 28-day summary ───────────────────────┐
│ Last 28 days · 20 Jul–16 Aug · exact coverage                                  │
│ 8 runs · 5 h 12 min · 49.6 km                                                  │
└─────────────────────────────────────────────────────────────────────────────────┘

Training by week                              28 days · 20 Jul–16 Aug
[Runs] [Running time] [Distance] [Elevation] [Reported load]   ← radio selector

km  16 ┤                 ┌────┐
    12 ┤       ┌────┐    │    │            ─ selected-value guide
     8 ┤ ┌────┐│    │    │    │ ┌////┐     //// = Partial evidence
     0 ┼─┴────┴┴────┴────┴────┴─┴────┴──────────────────────────────────────────
         20–26   27–2       3–9   10–16 to date
                                  ↑ focus / hover / tap shows the same exact value
[View data]                    ← visible disclosure, not screen-reader-only

Longest recorded distance                 Verified best times
14.2 km · 20 Jul–16 Aug                    1 km              No verified time yet
Complete evidence · source activity       5 km              27:18 · Hito-observed
                                           10 km             Pending verification
                                           Half Marathon     Unavailable
                                           Marathon          No verified time yet
```

- **Strengths:** one unit and evidence meaning at a time; the plot is large enough to compare bar
  height; records remain a separate factual list; mobile collapses without changing meaning.
- **Cost:** one selection is required to inspect a different metric. The factual summary already
  exposes the primary values before that interaction.

#### Direction B — chart plus fixed records rail

```text
┌──────────────────── selected weekly chart ───────────────────┬── records rail ──┐
│ selector · one axis · four/five buckets · View data          │ Longest period   │
│                                                              │ five PB slots    │
└──────────────────────────────────────────────────────────────┴──────────────────┘
```

- **Strengths:** chart and records are visible together on wide screens.
- **Rejected for the first slice:** the rail compresses provenance, status, and exact-distance copy;
  at 375 px it becomes Direction A anyway. It gives records undue visual competition with recent
  factual volume.

#### Direction C — five small multiples

```text
┌ Runs ─────────────┐ ┌ Distance ─────────┐ ┌ Running time ─────┐
│ four/five bars    │ │ four/five bars    │ │ four/five bars    │
└───────────────────┘ └───────────────────┘ └───────────────────┘
┌ Elevation ────────┐ ┌ Reported load ────┐ ┌ Records list ─────┐
│ four/five bars    │ │ four/five bars    │ │ five slots        │
└───────────────────┘ └───────────────────┘ └───────────────────┘
```

- **Strengths:** all factual shapes are visible without metric selection.
- **Rejected for the first slice:** five axes and five evidence states create a dashboard wall,
  encourage unlike-unit comparison, repeat tooltip/table machinery, and become a long mobile stack.

### Recommended Product Composition

1. Keep the existing factual summary first. It answers the primary runner question without chart
   interaction.
2. Add `Training by week` with a Product-owned exclusive metric selector in this order: Runs,
   Running time, Distance, Elevation, Reported load. Hide a metric only when Backend marks the whole
   series `not_applicable`; show a requested unavailable series as a truthful state.
3. Render exactly one `HitoFactualBarChart` below the selector. The selector changes only the
   supplied series; it never changes period, creates buckets, or calculates a comparison.
4. Put `Longest recorded distance` below the chart as a period fact with exact dates and coverage.
5. Put `Verified best times` beside it at the desktop composition breakpoint and below it on narrow
   screens. Use one row per requested distance, not performance cards, medals, gauges, or colour
   rankings.

### Smallest Shared Chart Capability

Later DESIGN SYSTEM work should create one bounded primitive, provisionally
`HitoFactualBarChart`. The name describes its evidence contract and chart form; it is not a generic
chart engine.

#### Required Input Contract

| Input        | Contract                                                                                                                                                                        |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity     | Stable chart ID, title, short purpose, series label, unit label, and evidence label.                                                                                            |
| Period       | Backend-advertised period ID/label, exact inclusive start/end, bucket resolution, and period state (`complete` or `to_date`).                                                   |
| Points       | Ordered Backend-shaped points with stable ID, exact start/end/cutoff, short visible label, full accessible label, numeric value or `null`, already formatted value, and state.  |
| Point state  | `available`, `partial`, or `unavailable`. `available + 0` is the only zero. `partial` requires a value, coverage label, and reason. `unavailable` requires `null` and a reason. |
| Series state | `ready`, `updating`, or `error`. Updating returns no stale points under the current doctrine. Error includes safe Product copy and retry ownership.                             |
| Evidence     | Included/missing counts or observations, grouped reason text, confidence, formula/evidence label, and optional source reference only when Backend authorizes it.                |

The primitive may calculate only **presentation geometry**: a zero-based bar scale, non-data
tick placement, pixel coordinates, collision-aware visible tick density, and active-point position.
It must not calculate or alter buckets, aggregates, deltas, period availability, units, coverage,
confidence, eligibility, record winners, or narrative meaning.

#### Rendering Contract

- Use DOM/CSS button bands for the first bar primitive. Each ordered bucket is a focusable/tappable
  target with an inner visual bar; no new chart dependency or canvas renderer is warranted.
- Bars start at zero. Use three or four quiet y-axis ticks including zero. The unit appears beside
  the axis/title and in every exact value, tooltip, active readback, and table row.
- Use `--color-chart-1` for the single series, `--color-ring` for focus, semantic text tokens for
  labels, `--color-hairline` only for non-essential guides, and existing radius/spacing/motion
  primitives. Do not assign a different colour to each metric.
- Source-value contrast calculation makes Light `--color-chart-1` approximately borderline on the
  route background and above 3:1 on the canonical surface; this is not browser acceptance. DESIGN
  SYSTEM must measure the final parent-surface pair in Dark and Light. If the mark boundary misses
  3:1, repair the existing chart-token mapping or canonical mark treatment; do not add a
  Progress-only colour.
- A partial value uses the same series hue plus a visible hatch/stripe and a `Partial` text key. An
  unavailable bucket is a gap with an outlined gap marker and reason in the active readback/table.
  An available zero uses a labelled zero marker on the baseline. These meanings never depend on
  colour.
- A selected point adds a horizontal guide at that supplied value so nearby bar heights are easier
  to compare. The guide is presentational; the tooltip/table supplies exact comparison truth.
- A legend is omitted for one series. Show a compact state key only when partial or unavailable
  points are present.

### Period, Bucket, And Physical-Length Contract

- **First admitted period:** `28 days` only, with exact inclusive dates. Because the current source
  can yield four or five overlapping calendar-week buckets, Backend must first return an explicit
  chart period/bucket contract. Product must not trim the first bucket, pad a missing bucket, or
  derive `to date` in the client.
- **Partial buckets:** Backend marks `partial_start`, `complete`, or `to_date` and supplies the
  visible/full label. `to date` describes calendar completion, not incomplete evidence. Evidence
  `partial` remains a separate point state.
- **Later periods:** render a period control only when Backend advertises two or more options. Do not
  render unavailable presets disabled, and do not hardcode `12 weeks`, `6 months`, or `Custom`.
  Changing period requests a new Backend-shaped series; the UI never resamples an existing one.
- **Physical plot length:** reserve a minimum 44 px interactive band per bucket plus the y-axis
  gutter. At 1470 px, distribute four/five current buckets across the available plot while capping
  visual bar width so the mark does not become a slab. At 375 px, four/five buckets fit the content
  width; longer advertised series use an internally labelled horizontal plot scroller, never page
  overflow or compressed touch targets.
- **Long series:** never drop or merge a bucket. The primitive may show fewer visible x-axis labels
  to avoid collision, while every bucket remains reachable by focus/tap and present in `View data`.
  If a future period produces an unusably long plot, Backend must advertise a coarser bucket
  resolution; Frontend and Design System do not invent one.

### Interaction And Accessibility Contract

| Input / user              | Required behavior                                                                                                                                                                                                                                                                                                           |
| ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Pointer                   | Hovering a bucket reveals the same exact active-value content as focus and tap and adds the selected-value guide. Moving away clears an unpinned hover state. Hover is enhancement only.                                                                                                                                    |
| Keyboard                  | `Tab` enters the plot once on the current/first available bucket. Left/Right moves one bucket; Home/End reaches the bounds. Focus remains visibly ringed. Enter/Space pins or unpins the active readback; Escape clears a pinned disclosure without moving focus. The plot does not add every bucket to the page tab order. |
| Touch                     | The full minimum 44 px bucket band is tappable. Tap pins an in-flow active-value readback; tapping another bucket replaces it. Tapping the active bucket again or the explicit close action clears it. No hover emulation, drag requirement, page-scroll capture, or gesture-only action.                                   |
| Tooltip / active readback | Pointer/focus may use the existing non-interactive Tooltip chrome. Touch and pinned keyboard state use the same content renderer in a persistent in-flow readback. Content: series, exact dates, value/unit, bucket completion, evidence state, coverage, and reason. No interactive control is placed inside the tooltip.  |
| Screen reader             | The figure has a concise text summary and labelled plot group. Each active bucket exposes one complete accessible name. `View data` opens a native table with caption and scoped headers for period, value, state, coverage, and reason. The table is visible to any user who requests it.                                  |
| Reduced motion            | Render bars and new values immediately. Remove bar-grow, scale, slide, and guide motion under `prefers-reduced-motion`. Colour/opacity changes may remain only when they do not delay or obscure values.                                                                                                                    |
| Zoom/reflow               | At 200% and 400% zoom, controls wrap/scroll inside their owned region, text is not clipped, the table remains readable, and no page-level horizontal overflow is introduced.                                                                                                                                                |

### Metric And Axis Matrix

| Series        | Supplied value / display                    | Axis and comparison rule                                                                | Evidence disclosure                                                               |
| ------------- | ------------------------------------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| Sessions      | Integer count / `runs`                      | Zero-based integer ticks. Compare only buckets from the same advertised period/formula. | Included activities and missing/exclusion reason when supplied.                   |
| Running time  | Canonical minutes / localized `h` and `min` | One duration axis; never mix with distance.                                             | Included/missing activities; observed timer basis remains explicit when partial.  |
| Distance      | Canonical kilometres / localized km or mi   | One distance axis. Display localization does not change canonical values.               | Included/missing activities and distance evidence reason.                         |
| Elevation     | Canonical metres / localized m or ft        | One elevation axis. Missing elevation is a gap, never a flat zero.                      | Included/missing activities and elevation evidence reason.                        |
| Reported load | Backend display value / `AU`                | One AU axis; never compare to volume or call higher/lower good/bad.                     | Included/unavailable observations, grouped reason, confidence, and formula label. |

No dual axis, stacked unlike metrics, readiness/fitness overlay, percentage change, trend line,
forecast, goal line, or coaching threshold is admitted. A same-series exact-value comparison is
allowed only when unit, period, bucket meaning, formula, and evidence meaning match.

### State Matrix

| State                    | Plot treatment                                                                                         | Text/table treatment                                                                                        |
| ------------------------ | ------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------- |
| Initial loading          | Structure-shaped skeleton using the existing Skeleton owner; no fake bars or values.                   | `Loading running progress` status remains available.                                                        |
| Available zero           | Zero marker at the baseline; axis still begins at zero.                                                | Exact `0` plus unit and Backend-complete state. Never inferred from `null` or absence.                      |
| Partial evidence         | Value-height hatched bar plus explicit `Partial` marker.                                               | Show value, included/eligible or included/total coverage, and grouped missing reason.                       |
| Unavailable point        | Gap marker at the bucket position; no zero-height bar and no interpolation.                            | `Unavailable` plus stable reason.                                                                           |
| Whole series unavailable | Replace plot with existing quiet state surface; keep metric and exact period visible.                  | Explain the missing fact; do not hide a user-requested metric or show an empty axis.                        |
| Updating                 | Replace the affected chart/records with the existing updating state; no stale values behind a spinner. | Announce the update politely and preserve the retry/check-again contract.                                   |
| Error                    | Existing destructive state surface and retry; destructive colour means a real load failure only.       | Error copy never converts absence into zero or removes the factual summary if that summary remains current. |
| Not applicable           | Omit from the default selector/summary.                                                                | If reached in a detail context, show the Backend reason; never `0%` or failure.                             |

### Responsive Acceptance Matrix

| Area             | 1470 px desktop                                                                              | 375 px mobile                                                                                                 |
| ---------------- | -------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Hierarchy        | Existing summary, full-width selected chart, then a two-column longest/records composition.  | Same order in one column; records follow period-longest.                                                      |
| Metric selector  | One exclusive row using existing Hito radio/choice mechanics.                                | One horizontally scrollable 44 px-tall radio row; selection and labels remain visible without shrinking text. |
| Plot             | Approximately 240–280 px plot height; distributed four/five bands; exact date range visible. | Minimum 220 px plot height; four/five bands fit; longer future payloads scroll inside the plot region.        |
| Tooltip/readback | Anchored non-interactive tooltip for hover/focus; optional pinned in-flow readback.          | Tap always uses the in-flow readback so it is not clipped or dependent on hover.                              |
| Data table       | Visible disclosure below the plot; native table may use the existing contained scroller.     | Same disclosure and all columns; contained horizontal scroll is allowed, page overflow is not.                |
| Records          | Period-longest at left; five ordered rows at right with room for provenance.                 | Full-width rows; label/status may stack, but time and status text never truncate to an unexplained dash.      |

### Factual Record Readback Contract

#### Period Fact

`Longest recorded distance` stays separate from lifetime records. It always shows:

- the value and localized unit when available;
- exact inclusive period dates (`Last 28 days` is supporting copy, not the only boundary);
- complete/partial/unavailable evidence and included/missing count;
- the contributing source activity only when Backend/Product exposes an authorized source
  reference; and
- no medal, rank, celebration, pace inference, or lifetime-PB label.

#### Future Verified Best-Time Slots

Render exactly this ordered set:

| Slot          | Canonical exact distance | Available row label          |
| ------------- | -----------------------: | ---------------------------- |
| 1 km          |                   1000 m | `1 km`                       |
| 5 km          |                   5000 m | `5 km`                       |
| 10 km         |                  10000 m | `10 km`                      |
| Half Marathon |                21097.5 m | `Half Marathon · 21.0975 km` |
| Marathon      |                  42195 m | `Marathon · 42.195 km`       |

Each slot receives a Backend-resolved state; the UI does not filter the generic record list and pick
a winner:

- **Available:** formatted elapsed time, exact distance, event/activity date, record class
  (`Hito-observed whole activity` or `Official result entered by you`), context when known,
  confidence, provenance, and authorized source reference.
- **No verified time yet:** Backend completed the eligible search and found no accepted record for
  that exact slot. This is not `0:00`, `--:--`, or `Unavailable`.
- **Unavailable:** Backend cannot evaluate the slot; show its stable reason. Missing detailed stream
  data must not imply that exact whole-activity evidence is absent.
- **Pending verification:** show only when Backend exposes an explicit pending lifecycle for a
  runner-submitted official result. Current Product truth cannot emit this state, so Frontend must
  not infer it from `partial`, an unavailable reason, or network loading.
- **Updating:** replace affected slots/section with the updating state; do not retain a stale PB.

Calculated segments inside longer runs, average-pace multiplication, interpolation, extrapolation,
rounded near-distance matching in Frontend, provider-attributed records, and missingness rendered as
a time remain prohibited.

### Exact Backend Gaps Before Visual Implementation

1. **Chart period truth:** return advertised period ID/label/dates and bucket resolution rather than
   asking Product to interpret `calendarWeeks` as rolling 28 days.
2. **Bucket completion truth:** return clipped/exact bucket dates, cutoff, and
   `partial_start | complete | to_date` labels independently from evidence confidence.
3. **Chart point truth:** return one ordered point per bucket for each admitted series with explicit
   zero, partial, unavailable, coverage, reason, and formatted/display metadata. Reported load must
   share the same exact bucket boundaries as the selected factual series.
4. **Record-slot truth:** return exactly the five requested slots with per-slot state. Resolve or
   explicitly preserve class/context variants in Backend; the current fastest-per-class/context
   list does not authorize a single client-selected PB.
5. **Record missing reason:** distinguish `no verified time yet` from an unavailable calculation or
   absent normalized stream. The current aggregate records reason is insufficient per slot.
6. **Source references:** expose an authorized contributing activity/evidence reference for the
   period-longest fact and available PB only if Product should link it. The current Product
   projection drops the fact contributor and PB activity IDs.
7. **Future period advertisement:** own availability, range limits, bucket resolution, and
   correction/updating behavior. No inactive presets or custom-range arithmetic belongs in UI.

These are chart-neutral read-model facts, not a new coaching formula. The existing Calendar
standalone-workout boundary remains untouched; source-plan provenance has no role in Progress
eligibility or records.

### Later Owner Map, Rollout, And Rollback

1. **PRODUCT — immediate next role:** accept/amend this composition and authorize one bounded
   BACKEND readiness item. Product must decide only if it wants a single cross-context PB winner or
   grouped retained variants; no other Ivan decision blocks the chart interaction contract.
2. **BACKEND — first implementation owner after Product dispatch:** expose the minimal period,
   bucket, series-state, and five-slot facts above through the existing Progress read-model seam.
   Do not change factual formulas or add plan/container authority.
3. **DESIGN SYSTEM — later:** implement `HitoFactualBarChart`, its shared active-point content,
   data-table disclosure, Dark/Light/state/responsive reference matrix, and canonical CSS ownership.
   Reuse current tokens and controls; no dependency or general chart framework.
4. **FRONTEND Product — later:** compose Direction A in `FactualProgressPanel` using only the
   Backend-shaped payload. Retain the present summary/disclosures until the chart proves every
   state.
5. **QA — separately routed later:** validate keyboard, pointer, touch, screen reader/table parity,
   1470/375 reflow, both themes, reduced motion, source links, and truthful missing states.

Rollout is additive: Backend first adds truth without changing the current UI; Design System proves
the primitive in `/hitoDS`; Frontend then adds the chart while keeping the existing text readback.
Rollback removes the chart composition and returns to the current factual disclosures; it does not
revert Backend truth or delete record evidence. Stop immediately if implementation requires client
aggregation, a new formula, a chart package, a local Progress colour/tooltip/table recipe, a
cross-context PB decision without Product approval, or stale values during updating.

### Acceptance Inventory For Later Implementation

| Check                  | Required observation                                                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Source truth           | Every visible period, bucket, point state, coverage, and record slot maps to one Backend field; no client aggregation or winner selection.    |
| Same-series comparison | Hover/focus/tap exposes exact values and a visual guide only within one unit/window/evidence meaning.                                         |
| Input parity           | Pointer, keyboard, and touch reveal identical active-point content; the plot has one page tab stop and visible focus.                         |
| Table parity           | `View data` contains every plotted/gap bucket, unit, state, coverage, and reason with native caption/headers.                                 |
| State truth            | Zero, partial, unavailable, updating, error, and no-record states are observably distinct without colour alone.                               |
| Responsive             | Direction A remains complete at 1470 and 375 px with no page-level overflow or clipped provenance.                                            |
| Themes/contrast        | Marks, focus, controls, labels, patterns, and state keys are measured on every actual parent surface in Dark and Light.                       |
| Motion                 | Reduced motion shows immediate stable geometry; no essential fact depends on animation.                                                       |
| Records                | Exactly five requested distances render; no segment reconstruction, interpolation, extrapolation, or missing-as-time path exists.             |
| Rollback               | Removing the chart leaves the current factual summary, fact disclosures, load, records, empty/updating/error states, and source truth intact. |

### Validation And Boundaries

| Check                                      | Result                             | Evidence / consequence                                                                                                                                                                                                                                  |
| ------------------------------------------ | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Role/skill/task preflight                  | Passed                             | Read current `AGENTS.md`, `agents/designer.agent.md`, `skills/hito-frontend-design-system/SKILL.md`, this item, and the completed Progress doctrine before the write.                                                                                   |
| Source inventory                           | Passed for discovery               | Inspected current Progress presentation/view model/product/read-model/formula seams and the directly relevant Hito DS token, tooltip, selection, disclosure, table, focus, responsive, and reduced-motion owners.                                       |
| External guidance                          | Passed for discovery               | Current maintained W3C, USWDS, and GOV/WAI principles informed accessibility and chart simplicity; no external API/style system was copied.                                                                                                             |
| Canonical-item-only write                  | Passed at receipt time             | No runtime, Design System, `/hitoDS`, Figma, formula, data, query, fixture, hosted, dependency, or Git lifecycle write belongs to this discovery.                                                                                                       |
| Local Markdown links                       | Passed                             | Both relative task/roadmap targets exist from this item's location.                                                                                                                                                                                     |
| Scoped Prettier                            | Passed                             | Local Prettier 3.7.3 reports this canonical item formatted.                                                                                                                                                                                             |
| Diff hygiene and dirty-source preservation | Passed for the task-owned artifact | `git diff --check` returned no diagnostics; the untracked-item no-index check returned only the expected difference status and no whitespace diagnostics. SHA-256 readback for every inspected dirty Progress/DS source matched its pre-write snapshot. |
| Browser/runtime/build/QA/hosted/release    | Not run — required omission        | This is design discovery only. No visual implementation, computed-style proof, browser acceptance, Global QA, Figma parity, release, or deployment claim follows.                                                                                       |

### Discovery Outcome

The visual and interaction decision is ready for Product acceptance. Direction A is the smallest
coherent Progress composition, and `HitoFactualBarChart` is the smallest later shared DS gap. The
source audit also establishes a real prerequisite: current `calendarWeeks` and records are not yet a
truthful period-advertised chart plus five resolved PB slots. **Recommended next owner: PRODUCT**, to
accept the decision and route one bounded BACKEND readiness slice before Design System work.

## Product Acceptance Decision — 2026-08-16

Ivan clarified the evidence policy. Replace the discovery's former record-class examples with this
single runner-facing rule:

- Actual distance, elapsed time, elevation, pace, record, and personal-best facts come **only** from
  a durably attached and successfully parsed FIT file.
- A workout without FIT may say `Completed as planned` and show its independent Calendar prescription
  as scheduled information. It is not an observed result, must not fill actual volume/time/pace/
  elevation facts or a PB slot, and must never be relabelled as a result.
- There is no manually entered `Official result` record class in this product direction. Replace
  `Hito-observed` terminology with runner-facing `From FIT file` copy.

Consequently the cross-context winner decision is no longer needed: every available PB has one
evidence class, FIT. Backend must still decide the exact FIT eligibility/matching contract per
standard distance and emit a truthful per-slot no-result/unavailable state. Product has prepared a
separate bounded Backend readiness item; no UI or Design System source changed here.

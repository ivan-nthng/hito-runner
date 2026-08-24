# Hito Runner Progress Chart Composition And Period Controls Redesign

## Work Item ID

b074be87-15b7-4aa0-acbf-2ca86a0adec2

## Status

closed

## Type

Tracked — Runner Progress and Design System composition redesign

## Priority

high

## Owner

DESIGNER

## Epic

runner-evidence-and-progress

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Evidence From

[Hito DS Runner Progress Charts And Records Discovery](./2026-08-16-hito-ds-runner-progress-charts-and-records-discovery.md)

[Runner Progress Factual Activity Sequence Frontend Adoption](./2026-08-17-hito-runner-progress-factual-activity-sequence-frontend-adoption.md)

## Scope

Redesign the **current factual Runner Progress chart composition**: the weekly bucket bar chart and
the FIT activity point sequence, their `/hitoDS` references, and the Progress page period/metric
controls. Keep the existing factual visual primitives and Backend contract boundaries; this task
does not introduce a line chart, new metric, new analytics interpretation, or a generic dashboard.

The first stage is DESIGNER discovery/specification. After Product accepts it, FRONTEND Design System owns
the shared reference/primitive composition changes and FRONTEND Product adopts the accepted
composition in `/progress` without changing Backend facts.

## Archive Intent

Retain through the design decision, shared implementation, Product adoption, and focused acceptance.
Compact to the accepted hierarchy, control contract, retained factual disclosures, and proof.

## Task

Make factual Runner Progress understandable at a glance. Chart title and direct user controls stay
at the top of the chart context; visual space belongs around the plot, not above a displaced heading.
The default reading path must not lead with raw range IDs, exact ISO dates, coverage fractions, or
repeated “from FIT file” prose. Those remain factual, accessible, and reachable through concise
context, an active-point readback, state disclosure, or the existing native data table.

## User Report

Ivan reported that the chart headers drift below a large blank region and that current reading is
too technical: `28 days`, date ranges, `Full`, `From FIT file`, and `Showing all 5 FIT-recorded
runs` compete with the visual. He requires user-facing controls for selecting the period and a
custom calendar range: a visible calendar affordance beside Custom that opens the existing date
selection flow. The runner must be able to change the period rather than merely read a fixed range.

## Evidence

![Overloaded factual chart references](assets/2026-08-17-hito-runner-progress-chart-composition-controls/overloaded-chart-showcase.png)

Source SHA-256: `0a1b0acc389f6cec67c1aec71e05878596177b3f4385e1ae6036761af421bf15`.

The screenshot proves the hierarchy and showcase-placement problem; it does not authorize changing
the factual data model or hiding missing/partial evidence.

## Observed Behavior

- The `/hitoDS` Overview renders both chart figures inside `w-full ... self-center` children of
  grid showcase cards. The card grid vertically centres the whole figure, leaving unused space
  above the figure caption instead of anchoring the chart heading below the card header.
- `HitoFactualBarChart` and `HitoFactualActivityPointSequence` each render title, purpose, exact
  dates, evidence label, coverage, and data-table state directly in the primitive's figure caption.
  This is truthful but overloads the first scan.
- `FactualProgressPanel` already exposes Backend-advertised quick periods (`This week`, `Last 7
days`, `Last 1 month`, `Last 6 months`), one selected metric, and a validated custom start/end
  range using existing `HitoChoiceToggle`, `HitoDateField`, and `HitoButton` controls. It presents
  them as a separate, verbose form rather than a compact chart header.

## Expected Behavior

- Every current Progress chart composition puts its runner-facing heading first, immediately above
  its controls/plot. `/hitoDS` reference cards make the same hierarchy visible without vertical
  centring drift.
- The chart context presents the selected metric and one compact period control. Quick periods
  originate only from the Backend-advertised set; the selected exact dates remain available but do
  not dominate the initial visual scan.
- Custom range is visibly discoverable as a calendar action beside the quick-period choices. It
  opens the existing, validated start/end calendar-date flow; no client-made range calculations or
  calendar engine is introduced.
- FIT provenance, included-count/coverage, partial/unavailable reasons, and future-week meaning
  remain explicit when relevant and fully available via accessible readback and the native data
  table. The redesign must not turn factual uncertainty into absent or misleading data.
- Chart state, keyboard/pointer/touch use, data-table parity, mobile containment, and factual
  non-trend/pacing cautions remain intact.

## Source Investigation

The first incorrect ownership is split by contract, not by symptom:

- FRONTEND Design System owns the shared factual figure captions and `/hitoDS` Overview showcase layout.
- FRONTEND Product owns the existing period/metric/custom-date composition in
  `src/components/progress/FactualProgressPanel.tsx`.

The Backend already supplies the exact quick periods and validates custom dates; the initial source
inspection demonstrates no missing data or date-calculation capability. The redesign must therefore
reuse, not duplicate, that contract. DESIGNER first determines the smallest accepted composition and
which existing primitive boundary needs a shared change; implementation then proceeds serially by
owner.

## What Not To Touch

Do not change Backend period boundaries, metric formulas, sequence membership, bucket aggregation,
FIT-only actual-result rule, PB rules, calendar/workout flows, source-plan history, chart package
policy, Canvas/SVG policy, route search/history semantics, fixture data, provider/hosted state,
Figma, or a future line-chart decision. Do not create a second period store, date engine, chart
framework, duplicated calendar control, or route-local chart CSS workaround.

## Validation Expectations

DESIGNER provides 2–3 compact desktop directions and a mobile control layout, then recommends one
composition. The decision must map visible versus disclosed factual information, use existing Hito
controls, define custom-calendar entry/validation/focus behaviour, preserve partial/unavailable/
updating/error states, and state the exact Design System versus Frontend implementation boundary.

Later implementation validates title/control/plot order, all Backend-advertised quick periods,
custom-date apply/reject/reload/back-forward behaviour, metric changes, data-table/accessibility
parity, Light/Dark at `1470×801` and `375×812`, touch/keyboard/pointer, reduced motion, overflow,
and console health. No claim may imply trend, readiness, fitness, or a result not supplied by FIT.

## Stage

Queued behind the active Runner Core baseline QA execution; DESIGNER discovery first

## Next Recommended Role

DESIGNER

## Blocker

The single-active-task rule: QA is currently executing the critical Runner Core baseline. Do not
start a second execution workstream until QA returns its consolidated verdict. No Ivan decision is
needed to start the bounded design discovery afterward.

## Closure

Superseded by the DS Depth, Overview, And Factual Chart Batch.
Its source investigation, factual constraints, screenshot evidence, and serial FRONTEND Design System →
FRONTEND Product boundary remain historical evidence; this record no longer owns a parallel
workstream.

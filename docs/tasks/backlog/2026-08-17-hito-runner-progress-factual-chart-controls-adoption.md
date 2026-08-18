# Hito Runner Progress Factual Chart Controls Adoption

## Work Item ID

50f724ea-23a1-47a5-b58e-b817ae04a299

## Status

completed

## Type

Tracked — Frontend Product composition adoption

## Priority

high

## Owner

FRONTEND

## Frontend Lane

Product

## Epic

runner-evidence-and-progress

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Hito DS Depth, Overview, And Factual Chart Batch](./2026-08-17-hito-ds-two-layer-elevation-token-system.md)

## Evidence From

[Runner Progress Factual Activity Sequence Frontend Adoption](./2026-08-17-hito-runner-progress-factual-activity-sequence-frontend-adoption.md)

## Scope

Adopt the completed shared factual-chart composition in authenticated `/progress`. Supply the
existing period, metric, and custom-date controls from `FactualProgressPanel` into the bounded
controls regions already owned by `HitoFactualBarChart` and
`HitoFactualActivityPointSequence`; remove only duplicated Product-level headings, exact-date
labels, and technical prose that the accepted shared composition now discloses more concisely.

## Archive Intent

Retain through focused runner browser acceptance, then compact to the adopted control hierarchy,
unchanged Backend boundary, and evidence.

## Task

Make factual Runner Progress easy to scan and control without altering factual truth. Each chart
must lead with its runner-facing heading and compact controls. The runner chooses only the
Backend-advertised quick periods, one existing metric, or a visible Custom calendar action; the
selected exact range, FIT provenance, coverage, missingness, and native data table remain
available without dominating the first scan.

## Accepted Product Direction

- Reuse existing `HitoChoiceToggle`, `HitoDateField`, and `HitoButton` controls and the accepted
  typed DS controls slots. A visible calendar affordance must open the existing validated custom
  start/end flow; no client-made date calculation or new date engine is allowed.
- Preserve existing route search, reload, Back/Forward, period validation, as-of maximum, metric
  selection, API request, and exact Backend response. Backend owns period membership and dates;
  the client must not aggregate, filter, sort, cap, or reinterpret FIT facts.
- Preserve every figure's factual heading → controls → context → plot/state → readback/table order,
  including partial, unavailable, updating, error/retry, future-week, pace-caveat, and accessible
  table truth.
- Do not introduce local chart CSS, another store, cache, calendar component, graph package, API,
  fixture, persistence path, or Design System change. The completed elevation, controls-region,
  focus-return, and pluralization contracts are dependencies, not editable task scope.

## Demonstrated Owner Boundary

The completed Design System batch supplies the typed controls regions and shared figure hierarchy.
`src/components/progress/FactualProgressPanel.tsx` owns the existing Product-level controls and
duplicate Progress copy. The existing `/progress` search/data-action seam already owns selected
period, custom dates, metric, request lifecycle, and history. This is therefore one FRONTEND
Product composition task; no Backend or Design System implementation is required.

## Stage

FRONTEND Product factual-chart controls adoption

## Next Recommended Role

PRODUCT

## Blocker

None. The required DS batch is complete and passed its fresh focused browser matrix. The unrelated
documentation-role assertion in the full DS validator is not a Progress source blocker and must
not be absorbed here.

## Frontend Product Execution Preflight — 2026-08-17

- **Mode and owner:** Tracked FRONTEND implementation in the authenticated Product lane. The
  completed Backend Progress payload and the two shared factual figure primitives are read-only
  dependencies.
- **Accepted source discriminator:** `FactualProgressPanel` already owns the route-backed activity
  period, custom-date, and metric controls, while `progress.fitProgress` already supplies the exact
  28-day weekly period and ordered series. The completed shared figures now expose presentation-only
  typed controls regions; no Backend, route-state, or Design System capability is missing.
- **Existing seams reused:** `FactualProgressPanel`, the existing `/progress` search/navigation and
  data request, `HitoChoiceToggle` with `useHitoRadioGroup`, `HitoDateField`, `HitoButton`,
  `HitoFactualBarChart`, and `HitoFactualActivityPointSequence`.
- **Smallest behavior change:** render one Backend-supplied weekly series with its Product-owned
  metric selector, move the existing activity period/metric/custom-date composition into the
  sequence figure controls region, and keep both supplied payloads unchanged.
- **New runtime artifacts:** none. No file, component, store, cache, helper framework, date engine,
  chart package, stylesheet, token, API, fixture, persistence path, or compatibility branch is
  proposed.
- **Superseded Product responsibility:** remove only the sequence's duplicate outer heading,
  repeated ISO date labels inside quick-period choices, redundant future-interval prose, and the
  standalone controls wrapper. The figure-owned heading, concise period context, plot/state,
  readback, and complete native table remain authoritative.
- **Dirty boundary:** the existing Progress route/search/activity-sequence implementation and its
  accepted settings propagation are preserved and narrowed in place. Shared Design System source,
  Backend source, Admin, Calendar, fixtures, and every unrelated dirty path remain untouched.
- **Focused proof:** source ownership and unchanged payload pass-through; quick/custom/metric URL
  replay; invalid inclusive ranges and as-of maximum; no stale values; ready/empty/updating/
  unavailable/error/future-week truth; native figure keyboard/pointer/table parity and Close focus;
  Light/Dark desktop/mobile containment; console health; focused static checks; production build;
  and fresh managed `qa_fixture` admission.

## Tracked Frontend Product Implementation Receipt — 2026-08-17

### Outcome

Authenticated Runner Progress now composes both factual figures through their accepted typed
controls regions. The activity sequence keeps the existing route-backed quick period, custom date,
and metric interaction, while the weekly factual chart selects an existing Backend-supplied series
through one local presentation control. Custom visibly opens the existing validated date fields.
The figures now own their runner-facing heading, concise factual context, plot/state, readback, and
native table without the former duplicate Product heading, ISO quick-option labels, or explanatory
prose.

No range, bucket, activity, metric, date, coverage, missingness, or display value is calculated or
rewritten in Product. The Backend response continues to flow unchanged through the existing route
and Product model into the shared figures.

### Accepted Cause And Ownership

- The completed Design System dependency introduced typed controls regions at the canonical figure
  owners.
- `FactualProgressPanel` still rendered the activity controls and duplicated context outside the
  sequence figure and did not adopt the existing weekly `fitProgress.chart` series through the
  shared factual bar chart.
- The first Product owner was therefore the existing `FactualProgressPanel` composition seam; no
  Backend or shared Design System correction was required.

### Files Inspected And Changed

- Changed `src/components/progress/FactualProgressPanel.tsx`.
- Changed this canonical lifecycle and evidence record.
- Inspected, but did not modify for this task,
  `src/components/progress/RunnerActivityProgressExperience.tsx`,
  `src/components/progress/runner-activity-progress-types.ts`, and `src/routes/progress.tsx` to
  verify the accepted route search, API request, response, stale-request, and focus seams.

No production file, shared component, stylesheet, token, helper framework, store, cache, date
engine, graph package, API, fixture path, persistence path, dependency, or compatibility branch was
added. Existing Calendar, PB/readback, record, reported-load, provenance, Backend, Design System,
Admin, Plans, and unrelated dirty work remained outside the task.

### Validation

| Check                                  | Scenario / environment                                    | Result                     | Evidence                                                                                                                                                                                                                                                                                                                                                                     |
| -------------------------------------- | --------------------------------------------------------- | -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership and payload boundary  | Current Product source                                    | Passed                     | Both `controls` regions are supplied in `FactualProgressPanel`; the weekly series is selected from `progress.fitProgress.chart.advertisedPeriods[0].series`, and the activity `sequence` is passed unchanged. No Product aggregation, range calculation, filtering, sorting, cap, or display rewrite was introduced.                                                         |
| Figure hierarchy and duplicate removal | Authenticated `/progress?tab=progress`                    | Passed                     | DOM order for each figure was heading → typed controls → factual context → plot/state/readback. The prior outer activity heading, quick-option ISO labels, and duplicate technical/future prose were absent.                                                                                                                                                                 |
| Weekly metric controls                 | Desktop browser, pointer and keyboard                     | Passed                     | Distance was the factual default; pointer selected Runs and ArrowRight selected Running time with the radio focus retained. Each selection resolved the current Backend-owned series and did not mutate route or response truth.                                                                                                                                             |
| Activity quick and metric controls     | Same authenticated tab                                    | Passed                     | Last 7 days changed the existing route search; Observed pace changed only `sequenceMetric`, retained the permanent mixed-workout caveat, and Back/Forward restored Distance and pace without stale values.                                                                                                                                                                   |
| Custom dates and validation            | Desktop browser                                           | Passed                     | Custom exposed the existing calendar/date path. Reversed dates retained the prior result, showed the exact validation error, and focused Start date. Valid `2026-08-10`–`2026-08-17` dates updated route search and the existing API request.                                                                                                                                |
| Reload and history                     | Same authenticated tab                                    | Passed                     | Reload retained Custom, both inclusive dates, and the selected metric. Back closed/restored the previous quick selection; Forward restored Custom and its dates. Returning to Last 1 month closed the panel and restored focus to that quick control.                                                                                                                        |
| Factual sequence and table             | This week / Distance                                      | Passed                     | The supplied one-point sequence rendered `16.2 km`; its accessible name retained date/time, ordinal, availability, coverage, missing context, and FIT provenance. The native table rendered all five factual values once: distance, duration, pace, elevation, and reported load. Pointer Close returned focus to the exact point.                                           |
| State truth                            | Existing design-profile fixture                           | Passed with gaps           | Ready, empty, updating, and current-week future truth were observed. The deliberate pending-evidence fixture kept the weekly series in its truthful updating state, so weekly ready-plot/table rendering and whole-sequence unavailable/error remained dependency/source-contract coverage rather than new Product browser evidence.                                         |
| Responsive themes                      | 1470x801 and exact 375x812, Light/Dark                    | Passed                     | Both controls regions remained inside the Product canvas with no page overflow. At 375px the 1676px native table stayed inside its 343px local scroll owner; Custom fields and actions remained within the same content gutter.                                                                                                                                              |
| Browser console                        | Focused replay                                            | Passed                     | Final warning/error log snapshot was empty.                                                                                                                                                                                                                                                                                                                                  |
| Formatting and lint                    | Touched Product file and canonical item                   | Passed                     | Focused Prettier and ESLint passed.                                                                                                                                                                                                                                                                                                                                          |
| Product contracts                      | `npm run validate-product-contracts`                      | Passed                     | Heart-rate guidance editor and workout-comparison readback proofs passed.                                                                                                                                                                                                                                                                                                    |
| Type diagnostics                       | Checkout-wide `tsc --noEmit`, filtered to Progress owners | Passed with checkout note  | No diagnostic referenced `FactualProgressPanel`; `src/routes/progress.tsx` retains the pre-existing loader `viewer` unknown diagnostic from unrelated dirty work.                                                                                                                                                                                                            |
| Production build and fresh admission   | Managed loopback `qa_fixture`                             | Passed                     | Client, SSR, Nitro, and postbuild completed; PID 66343 was healthy, loopback-only, `qa_fixture`, fresh, and `receipt_matches` before browser proof.                                                                                                                                                                                                                          |
| Diff hygiene                           | Current checkout                                          | Passed                     | `git diff --check` passed; unrelated dirty paths were neither staged, reverted, nor claimed.                                                                                                                                                                                                                                                                                 |
| Fixture isolation and server           | Post-proof cleanup                                        | Passed with external drift | `local:design-profile:reset` returned every seeded Product/activity/evidence table to zero and preserved the disposable auth identity. PID 66343 remains healthy and running. After evidence, freshness drifted externally to `artifact_missing` on the private Admin repository snapshot marker; no stale artifact was used for acceptance and no rebuild loop was started. |

### Coverage Consequences

- The in-app browser proved pointer Close and exact point focus return, but its Enter command did not
  activate the point disclosure. A supplemental Chrome path was abandoned when local browser
  credential tooling interfered. Native Enter/focus therefore remains accepted dependency evidence
  from the completed Design System batch rather than an independent Product replay in this slice.
- The admitted design-profile state deliberately exposed weekly `updating`, not the weekly ready
  plot/table. The shared factual bar-chart dependency already owns and passed ready/table behavior;
  this Product replay proved controls coexistence and truthful updating composition.
- Whole-sequence `unavailable` and a natural Product error response were not exposed by an existing
  admitted fixture. Their Product branches were source reviewed; no new fixture path was added.
- Checkout-wide TypeScript remains red on unrelated dirty work; the task-owned component has no
  diagnostic.
- Global QA, Backend acceptance, Design System acceptance, hosted, release, deployment, and physical
  assistive-technology acceptance remain unclaimed.

### Collaboration And Next Owner

- **Role file:** `agents/frontend.agent.md`
- **Project skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`
- **Additional browser procedure:** the installed in-app Browser control skill for the local visual
  replay.
- **Subagent:** none; the completed shared dependency and focused Product replay were sufficient,
  and no same-lane implementation was delegated.
- **Next owner:** PRODUCT, to decide and route separate Global QA if desired.
- **Blockers:** none for the Frontend Product implementation slice.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review the completed Frontend Product factual-chart controls adoption receipt in
`docs/tasks/backlog/2026-08-17-hito-runner-progress-factual-chart-controls-adoption.md`. The Product
slice is terminal with explicit native-Enter, weekly-ready, and unavailable/error fixture coverage
gaps. Decide whether to route a separate Global QA replay; do not infer Backend, Design System,
hosted, release, or deployment acceptance from this receipt.
```

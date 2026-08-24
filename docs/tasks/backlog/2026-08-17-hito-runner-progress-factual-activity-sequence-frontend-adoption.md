# Hito Runner Progress Factual Activity Sequence Frontend Adoption

## Work Item ID

c5b898c0-631a-4356-aa34-fa3a49d578db

## Status

completed

## Type

Tracked — Frontend Product implementation

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

[Runner Progress Complete FIT Activity Sequence Readiness](./2026-08-17-hito-runner-progress-complete-fit-activity-sequence-readiness.md)

[Hito DS Factual Activity Sequence Display-Unit Deduplication](./2026-08-17-hito-ds-factual-activity-sequence-display-unit-deduplication.md)

## Evidence From

[Hito Running Coach Activity-Sequence Progress Metrics Review](./2026-08-17-hito-running-coach-activity-sequence-progress-metrics-review.md)

## Scope

Adopt the completed shared `HitoFactualActivityPointSequence` in authenticated Runner Progress using
the completed `progress.fitActivitySequence` API contract. This is Product composition and
interaction only; it does not change Backend facts, Design System source, Calendar, activity
ingestion, or the existing 28-day factual bars and PB readbacks.

## Archive Intent

Retain through independent Progress acceptance, then compact to the selected-period interaction,
Backend-shaped consumer boundary, and factual/non-comparative runner copy.

## Task

Expose the runner's factual FIT activity sequence as a readable Progress section. The runner can
select one Backend-advertised quick period or a validated custom calendar range and one factual
metric. The route forwards the selection to the existing API and renders the returned sequence
unchanged through the shared primitive.

## Accepted Product Direction

- Use the Backend-advertised quick periods: `This week`, `Last 7 days`, `Last 1 month`, and `Last 6
months`; custom range is an inclusive runner-local start/end selected through existing date-field
  control(s). Exact returned dates remain visible; `This week` future days are explicit, not missing.
- Default to distance or timer duration. Observed average pace may be selected with the permanent
  mixed-workout caveat. No whole-period average pace, trend, improvement, readiness, fitness, or
  comparison conclusion is shown.
- The route passes period/custom inputs to the existing authenticated Progress API and renders only
  its current `fitActivitySequence` response. It must not calculate dates, filter/sort/cap points,
  aggregate observations, derive availability, or persist a separate product truth path.
- Keep all supplied FIT activity members, period/count/evidence wording, `View data` table, state
  truth, and no-connector geometry from the shared primitive. Non-FIT completion remains outside
  actual sequence metrics.
- Keep the existing factual 28-day summary, weekly bar chart, FIT-only PB slots, records, and
  reported-load readbacks intact. Do not revive plan/source-container authority.

## Demonstrated Source Boundary

`FactualProgressPanel` currently composes the Progress readback. The Backend now provides
`RunnerActivityProgressProductModel.fitActivitySequence` through the existing authenticated
`/api/runner-activity-progress` selector contract. `HitoFactualActivityPointSequence` owns marks,
readback, table parity, states, keyboard/pointer/tap behavior, and responsive containment. The
first incorrect owner for missing runner-facing composition is therefore the Frontend Product
Progress panel/data-loading seam, not Backend or Design System.

## Required Outcome

1. Add the factual activity-sequence section to Runner Progress using only the completed shared
   primitive. Present it as a factual history of FIT-recorded runs, not a performance trend.
2. Expose supplied quick periods and metric choices through existing Hito controls. Custom range
   uses existing date controls with an explicit apply action and sends the exact dates to the API.
   Do not offer unsupported values or a client-made period.
3. Make selection durable in the existing route/search or loader interaction so reload, Back/Forward,
   and direct navigation retrieve the same Backend-selected period and metric. Do not add a store,
   persistence, or query cache to recreate data truth.
4. Render ready, empty, updating, unavailable/incomplete, error/retry, invalid custom range, and
   future-week states truthfully. An API change replaces old sequence data; never display stale
   points under a newly selected range.
5. Preserve existing Progress sections and current Design System contracts. Restore logical focus
   after applying custom dates or retrying a failed request; do not introduce route-local chart CSS,
   data calculations, or hover-only content.
6. Verify authenticated runner flow at desktop/mobile Light/Dark: period/metric selection, custom
   range, reload/history, primitive keyboard/pointer behavior, table parity, empty/updating/error,
   exact dates, overflow, focus, console, and clean fixture isolation. A named QA reviewer may
   replay this bounded Product adoption after primary proof.

## What Not To Touch

No `HitoFactualActivityPointSequence` or other Design System source, Backend read-model/formula/API
contract, chart package, generic graph system, client aggregation/analytics, calendar/workout
workflow, source-plan behavior, Admin, financial work, fixture framework, provider/hosted state,
dependencies, Git lifecycle, release, or Global QA. Return to PRODUCT if the existing API cannot
serve the required interaction without a Backend change or if the primitive contract is inadequate.

## Validation Expectations

Perform a tracked preflight before the first write. Reuse the existing Progress component/data-action
and Hito control seams before adding a component or state path. Run focused Product/static checks and
a production build. After fresh managed `qa_fixture` admission, run the specified authenticated
browser matrix and one bounded named QA independent replay. Do not claim Design System, Backend,
Global QA, hosted, release, or deployment acceptance from this slice.

## Stage

FRONTEND Product focused post-DS browser replay completed

## Focused Replay Preflight — 2026-08-17

- **Mode and owner:** Tracked FRONTEND acceptance replay in the authenticated Product lane. Product
  source is read-only unless this replay demonstrates a new Product-owned defect.
- **Accepted dependency:** the completed Design System display-unit receipt proves that
  `HitoFactualActivityPointSequence` now renders Backend-formatted `displayValue` verbatim and keeps
  `unitLabel` only for component-generated bare axis values.
- **Current source discriminator:** `FactualProgressPanel` still passes `sequence={sequence}`
  unchanged. The shared primitive now renders the maximum `displayValue` directly and its shared
  observation formatter returns `displayValue` without appending `unitLabel`.
- **Existing seams reused:** the completed `/progress` route-search interaction, existing
  authenticated Progress API, canonical design-profile fixture, managed `qa_fixture`, and shared
  point-sequence primitive. No new production runtime artifact, fixture path, helper, store, cache,
  formatter, CSS, dependency, API, or compatibility path is proposed.
- **Runtime admission:** the prior managed PID is healthy but stale/broken on a missing current
  Admin snapshot marker, so it is not admissible evidence. The normal managed fixture owner will
  rebuild/restart once, then seed and later reset only the existing disposable design profile.
- **Focused proof:** all five metrics render one complete value in scale, point/readback, accessible
  name, and native table; quick/custom selection, validation, reload/history, focus, ready/empty/
  updating/error/future-week states, desktop and exact 375x812 Light/Dark, local table scrolling,
  page containment, console health, unchanged Product forwarding, and fixture cleanup.
- **Existing explicit gap:** whole-sequence `unavailable` remains source/contract-only unless the
  already admitted fixture exposes it without a new fixture path.

## Focused Post-DS Replay Receipt — 2026-08-17

### Outcome

The completed Design System correction now renders every Backend-formatted activity value exactly
once through the unchanged Product consumer. Distance, timer duration, observed pace, elevation
gain, and reported load were each proven in the scale, point accessible name, active readback, and
native data table without duplicate units. No Product source change or downstream formatter was
needed.

Route-selected quick/custom periods, metric selection, validation, reload and Back/Forward replay,
ready/empty/updating/error/future-week truth, point keyboard/pointer behavior, focus restoration,
and responsive table containment remain intact. The Frontend Product slice is complete; Global QA
remains a separate PRODUCT decision.

### Source And Change Boundary

- `src/components/progress/FactualProgressPanel.tsx` still forwards the Backend result as
  `sequence={sequence}` to `HitoFactualActivityPointSequence`; it does not strip, append, format,
  aggregate, sort, filter, sample, cache, or otherwise rewrite the payload.
- Product runtime source was read-only during this replay. The only task-owned write was this
  lifecycle and evidence receipt.
- No runtime artifact, fixture path, helper, store, cache, formatter, CSS, dependency, API,
  compatibility path, Backend change, or Design System change was introduced.

### Validation

| Check                                  | Scenario / environment                 | Result            | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                    |
| -------------------------------------- | -------------------------------------- | ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh runtime admission                | Managed loopback `qa_fixture`          | Passed            | A fresh production build completed client, SSR, Nitro, and postbuild; PID 66258 was healthy, loopback-only, `qa_fixture`, fresh, and `receipt_matches` before browser proof.                                                                                                                                                                                                                                                |
| Display-unit correction                | This week, all five metric selections  | Passed            | Scale maxima, point names, active readbacks, and selected/native table cells rendered `16.2 km`, `100 min`, `6:10/km`, `96 m`, and `500 AU`; no `km km`, `min min`, `/km /km`, `m m`, or `AU AU` occurred.                                                                                                                                                                                                                  |
| Product payload boundary               | Current Product source                 | Passed            | `FactualProgressPanel` continues to pass `sequence={sequence}` unchanged to the shared primitive.                                                                                                                                                                                                                                                                                                                           |
| Quick and custom selection             | Authenticated Runner Progress          | Passed            | All four Backend-advertised quick periods selected their route values; an inclusive custom `2026-07-15`–`2026-08-11` range rendered all 14 supplied activities.                                                                                                                                                                                                                                                             |
| Custom validation and focus            | Reversed custom range                  | Passed            | Exact validation remained visible and focus returned to `Start date`; no invalid route request replaced the current sequence.                                                                                                                                                                                                                                                                                               |
| Reload and history                     | Same authenticated tab                 | Passed            | Reload retained custom dates, metric, and 14 points; Back restored the custom selection and Forward restored `Last 7 days` updating truth.                                                                                                                                                                                                                                                                                  |
| State truth                            | Existing design-profile fixture        | Passed with gap   | Ready, empty, updating, malformed-request error/retry, and current-week future-day states passed. The admitted fixture did not expose whole-sequence `unavailable`; that branch remains source/contract-only.                                                                                                                                                                                                               |
| Primitive interaction and table parity | 14-point custom sequence               | Passed            | One roving tab stop, ArrowRight, End, Enter, pointer selection, Escape dismissal/focus, 14 point buttons, and 14 native table body rows passed.                                                                                                                                                                                                                                                                             |
| Desktop and mobile themes              | 1470x801 and exact 375x812, Light/Dark | Passed            | Document/body width equalled the viewport. At 375px the 1878px table remained inside its 343px `hito-data-table-scroll` owner and responded to horizontal scrolling.                                                                                                                                                                                                                                                        |
| Browser console                        | Full focused replay                    | Passed            | Final warning/error log snapshot was empty.                                                                                                                                                                                                                                                                                                                                                                                 |
| Product formatting/lint                | Touched Product files and this item    | Passed            | Focused Prettier and ESLint passed.                                                                                                                                                                                                                                                                                                                                                                                         |
| Product contracts                      | `npm run validate-product-contracts`   | Passed            | Heart-rate guidance editor and workout-comparison readback proofs passed.                                                                                                                                                                                                                                                                                                                                                   |
| Diff hygiene                           | Checkout and this untracked item       | Passed            | `git diff --check` and the equivalent untracked-file whitespace check passed; unrelated dirty work was not staged, reverted, or claimed.                                                                                                                                                                                                                                                                                    |
| Fixture isolation and server           | Post-proof cleanup                     | Passed with drift | `local:design-profile:reset` returned every seeded Product/activity/evidence table to zero while retaining the disposable auth identity; the immediate status kept PID 66258 running, healthy, fresh, and `receipt_matches`. After evidence, the same healthy PID drifted externally to `stale/artifact_missing` on a private Admin repository snapshot marker; no stale artifact was used and no rebuild loop was started. |

### Coverage Consequences

- Whole-sequence `unavailable` browser acceptance remains the explicit coverage gap because the
  existing admitted fixture does not expose it and this task forbids a new fixture path.
- Global QA, Backend acceptance, Design System acceptance, hosted, release, deployment, and
  physical assistive-technology acceptance remain unclaimed.

### Collaboration And Next Owner

- **Role file:** `agents/frontend.agent.md`
- **Project skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`
- **Subagent:** none; this bounded post-DS acceptance replay did not require another reviewer.
- **Next owner:** PRODUCT, only to decide and route separate Global QA if desired.
- **Blockers:** none for the Frontend Product implementation slice.

## Tracked Frontend Product Implementation Receipt — 2026-08-17

### Outcome

The authenticated Progress consumer now adopts the Backend `progress.fitActivitySequence` contract
through the existing `HitoFactualActivityPointSequence`. Period, metric, and inclusive custom-date
selection are route-search state, so direct navigation, reload, and Back/Forward replay the same
Backend request without a client store or alternate data truth. The existing 28-day summary,
weekly, record, PB, reported-load, Calendar, and provenance readbacks remain in place.

The Frontend slice cannot truthfully reach Implementation DoD yet. Primary browser proof and the
independent named QA replay both demonstrated that the shared Design System primitive appends
`unitLabel` to Backend `displayValue` strings that already contain their unit. This produces false
visible and accessible values such as `16.2 km km`, `100 min min`, `6:10/km /km`, `96 m m`, and
`500 AU AU` in the plot scale, point labels/readbacks, and native data table. Product passes the
Backend sequence unchanged as required; stripping or rewriting those values in the route would be
a downstream workaround and a second formatting truth.

### Root Cause And Ownership

- **Backend truth:** `src/lib/runner-activity/metric-formulas.ts` supplies complete formatted
  `displayValue` strings and a separate semantic `unitLabel`.
- **Product consumer:** `src/components/progress/FactualProgressPanel.tsx` passes the supplied
  sequence unchanged to `HitoFactualActivityPointSequence`.
- **First incorrect owner:** DESIGN SYSTEM in
  `src/components/ui/hito-factual-activity-point-sequence.tsx`; the maximum plot label and shared
  observation formatter append `unitLabel` again.
- **Required boundary:** PRODUCT must route a bounded Design System correction, then return this
  same Frontend item for focused replay. No Product workaround or Backend payload rewrite is
  admitted.

### Files Changed

- `src/routes/progress.tsx`
- `src/components/progress/RunnerActivityProgressExperience.tsx`
- `src/components/progress/FactualProgressPanel.tsx`
- `src/components/progress/runner-activity-progress-types.ts`
- `docs/tasks/backlog/2026-08-17-hito-runner-progress-factual-activity-sequence-frontend-adoption.md`

No production file, component family, store, cache, helper framework, CSS recipe, token, API,
dependency, fixture path, persistence path, or compatibility branch was added. The unrelated
pre-existing `settings` propagation in `src/routes/progress.tsx` was preserved.

### Validation

| Check                      | Scenario / environment                                           | Result                     | Evidence                                                                                                                                                                                              |
| -------------------------- | ---------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source/request ownership   | Current Product diff                                             | Passed                     | Route search owns only period, metric, and optional custom dates; the existing API receives period/dates; the Backend sequence is passed unchanged to the shared primitive.                           |
| Quick periods and metric   | Managed `qa_fixture`                                             | Passed                     | `This week`, `Last 7 days`, `Last 1 month`, and `Last 6 months` rendered with Backend dates; canonical default was Distance; Observed pace retained the permanent non-comparability warning.          |
| Custom range               | Desktop browser                                                  | Passed                     | Inclusive same-day and multi-day ranges loaded; reversed and future ranges retained the prior URL, showed exact errors, and focused the invalid field.                                                |
| URL replay                 | Same authenticated tab                                           | Passed                     | Reload preserved custom dates/metric; Back/Forward restored quick/custom period and metric selections.                                                                                                |
| Sequence states            | Canonical design-profile fixture                                 | Passed with gap            | Ready, empty, updating, error/retry, and future-week truth were replayed. No admitted fixture exposes the whole-sequence `unavailable` state; that branch was source/contract reviewed only.          |
| Membership and interaction | 14-point ready custom range                                      | Passed                     | All 14 supplied points rendered in order; the native table had 14 body rows and included unavailable-observation reasons; one roving tab stop, Arrow/Home/End, Enter, pointer pin, and Escape passed. |
| Focus                      | Quick/custom/retry paths                                         | Passed                     | Quick period, successful custom Apply, invalid field, sequence retry, and page-error retry restored focus to the factual owner.                                                                       |
| Responsive themes          | 1470x801 and exact 375x812, Light/Dark                           | Passed                     | Page width equalled viewport width; the 1960px fact table remained inside its 343px local scroll owner on mobile.                                                                                     |
| Console                    | Primary browser replay                                           | Passed                     | Final warning/error log snapshot was empty. Independent QA observed no console issue, though its browser surface became unavailable before a separate terminal log snapshot.                          |
| Product formatting/lint    | Focused touched files                                            | Passed                     | Prettier check and focused ESLint passed.                                                                                                                                                             |
| Product contracts          | `npm run validate-product-contracts`                             | Passed                     | Heart-rate guidance editor and workout-comparison contract proofs passed.                                                                                                                             |
| Type diagnostics           | Checkout-wide `tsc --noEmit`, filtered to touched Progress files | Passed with checkout note  | No new diagnostic was reported in changed Progress components/types; the route retains the pre-existing loader `viewer` unknown diagnostic from unrelated checkout work.                              |
| Design System validator    | `npm run validate-hito-ds-components`                            | Unrelated existing failure | Existing documentation invariant for the production-shipped `/hitoDS` role failed; no DS source or documentation was changed in this slice.                                                           |
| Production build           | Fresh local build                                                | Passed                     | Client, SSR, Nitro, and postbuild completed before managed runtime admission.                                                                                                                         |
| Independent QA             | Existing named QA role, read-only                                | Failed                     | Product behavior passed its reachable matrix, but QA independently confirmed false duplicated units in the shared primitive and assigned the first incorrect owner to DESIGN SYSTEM.                  |
| Fixture isolation          | Disposable design-profile identity                               | Passed                     | Canonical reset removed all seeded profile, plan, workout, activity, source, evidence, metric, and snapshot rows; the auth identity was preserved.                                                    |
| Managed server             | Post-cleanup                                                     | Passed                     | PID 44244 remains healthy, loopback-only, `qa_fixture`, fresh, and `receipt_matches`.                                                                                                                 |
| Diff hygiene               | Checkout                                                         | Passed                     | `git diff --check` passed; unrelated dirty work was not staged, reverted, or claimed.                                                                                                                 |

### Coverage Consequences

- Browser acceptance for the whole-sequence `unavailable` state remains source/contract-only because
  no authorized fixture state exposes it.
- Global QA, Backend acceptance, Design System acceptance, hosted, release, deployment, and physical
  assistive-technology acceptance remain unclaimed.
- The duplicated-unit defect blocks complete Frontend Implementation DoD even though the Product
  consumer behavior otherwise passed.

### Collaboration

- **Role file:** `agents/frontend.agent.md`
- **Project skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`
- **Subagent:** existing named QA role, bounded read-only independent browser replay; no Frontend
  implementation was delegated.

### Next Owner And Blocker

- **Next owner:** PRODUCT, to route the demonstrated shared primitive correction to DESIGN SYSTEM.
- **Blocker:** `HitoFactualActivityPointSequence` must render each Backend `displayValue` exactly
  once while retaining truthful standalone unit metadata. This Frontend item then needs focused
  replay; no broader Product rewrite is required.

## Frontend Execution Preflight — 2026-08-17

- **Mode and owner:** Tracked FRONTEND implementation in the authenticated Product lane. Backend
  sequence membership/period truth and the shared Design System primitive are completed read-only
  dependencies.
- **Accepted decision and discriminator:** `FactualProgressPanel` currently renders the factual
  28-day/weekly/record/load readbacks, while `/api/runner-activity-progress` already returns
  `progress.fitActivitySequence` for Backend-validated quick or custom periods. The missing owner is
  the existing Product Progress composition/search/fetch seam, not Backend or Design System.
- **Existing seams reused:** `/progress` validated search and navigation, the existing Progress API
  request in `RunnerActivityProgressExperience`, `FactualProgressPanel`, `HitoChoiceToggle` with
  `useHitoRadioGroup`, `HitoDateField`, `HitoButton`, and
  `HitoFactualActivityPointSequence`.
- **Smallest behavior change:** extend the existing route search with selected period, optional
  custom dates, and presentation metric; forward only the period/date selector to the existing API;
  render its supplied sequence unchanged and keep custom date drafts local until explicit Apply.
- **New runtime artifacts:** none. No production file, component family, store, cache, helper
  framework, stylesheet, token, chart package, API, persistence path, dependency, fixture, or
  compatibility branch is proposed.
- **Obsolete responsibility:** no prior activity-sequence Product renderer exists to remove. The
  current Progress fetch assumption that every request uses the implicit `this_week` selector will
  be narrowed to the route-selected Backend request; existing 28-day and advanced readbacks remain.
- **Dirty boundary:** the pre-existing `settings` propagation hunk in `src/routes/progress.tsx` is
  unrelated accepted work and will be preserved byte-for-byte. The other admitted Progress files
  had no pre-existing diff. All Backend, Design System, Admin, Calendar, fixture, and unrelated
  dirty paths remain untouched.
- **Focused proof:** source/search replayability, quick/custom request shape, strict inclusive custom
  validation, no stale sequence after selection changes, every Backend/primitive state, future-week
  wording, metric warning, reload and history, keyboard/pointer/table parity, focus restoration,
  desktop and exact mobile Light/Dark containment, console health, focused static checks, build,
  fresh managed fixture isolation, and one bounded named QA replay.
- **Runtime admission:** the currently running managed loopback server is healthy but stale/broken on
  the unrelated missing Admin snapshot artifact. No browser assertion or fixture mutation will use
  it; a fresh serialized artifact will be admitted only after implementation and static proof.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review the completed Frontend Product factual activity-sequence adoption receipt in
`docs/tasks/backlog/2026-08-17-hito-runner-progress-factual-activity-sequence-frontend-adoption.md`.
The post-Design-System focused replay passed with no Product source change. Decide whether to route
a separate Global QA item; preserve the explicit whole-sequence `unavailable` fixture coverage gap
and do not infer hosted, release, or deployment acceptance from this implementation receipt.
```

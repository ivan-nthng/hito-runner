# Hito Runner Progress Complete FIT Activity Sequence Readiness

## Work Item ID

54d2e4fe-30a2-4325-a2f5-a58e628c6ec0

## Status

completed

## Type

Tracked — Backend read-model readiness

## Priority

high

## Owner

BACKEND

## Epic

runner-evidence-and-progress

## Parent

[Runner Core Roadmap](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Runner Progress FIT Results And Chart Payload Readiness](./2026-08-16-hito-runner-progress-fit-results-and-chart-payload-readiness.md)

[Hito DS Factual Line Chart Usage Discovery](./2026-08-17-hito-ds-factual-line-chart-usage-discovery.md)

## Evidence From

[Hito Running Coach Activity-Sequence Progress Metrics Review](./2026-08-17-hito-running-coach-activity-sequence-progress-metrics-review.md)

## Scope

Extend the existing runner-activity Progress read model with one complete, factual, chronological
FIT activity sequence for Product-accepted quick and custom periods. This is Backend readiness for
a later shared Design System point-sequence primitive; it does not implement a line chart, a point
sequence UI, a `/hitoDS` specimen, or a Progress route consumer.

## Archive Intent

Retain through Design System point-sequence implementation and Product Progress adoption, then
compact to the accepted period semantics, FIT eligibility, sequence completeness, and preservation
of the current weekly factual-bar contract.

## Task

Supply one Backend-owned sequence of every eligible accepted FIT activity in the selected period.
The resulting contract must let a later consumer render individual real-date points without client
aggregation, sampling, inferred gaps, or a connector. The established weekly 28-day series and five
FIT-only PB slots remain intact.

## Accepted Product Direction

- The accepted quick periods are `This week`, `Last 7 days`, `Last 1 month`, and `Last 6 months`.
  `This week` is the runner-local Monday–Sunday calendar interval; dates after `asOfDate` are
  explicit future time, not missing activity evidence. The other quick periods are inclusive
  rolling intervals ending on `asOfDate`; Backend resolves month lengths and leap dates.
- The runner can request a custom inclusive local start/end range. Its end must not exceed the
  current `asOfDate`; Backend canonicalizes and advertises the accepted range.
- Every eligible accepted FIT activity in the range is a sequence member. There is no latest-N cap,
  pagination substitute, client sampling, or hidden activity drop. A contract may say `complete`
  only when `eligibleActivityCount` equals `returnedPointCount`.
- Actual distance, timer duration, observed average pace, elevation, reported session-RPE load, and
  PB facts remain FIT-only. A completed Calendar workout without FIT remains scheduled-completion
  truth and never becomes a sequence point or fills a missing metric.
- The first consumer is a factual **point sequence with no connecting line**. It must not derive a
  performance, fitness, readiness, or improvement claim, calculate a whole-period average pace, or
  introduce source-plan authority.

## Demonstrated Source Boundary

`progress.fitProgress.chart.advertisedPeriods` currently exposes exactly one Backend-owned
`28_days` weekly-bucket contract. The current owner set is
`src/lib/runner-activity/{metric-formulas,metric-snapshots,read-model-types,product-contract}.ts`
with existing focused proofs in `scripts/validate-runner-activity-{gate-4,read-models}.ts`.
Those seams must be inspected and reused before any new artifact is proposed.

## Required Outcome

1. Extend the existing Progress product/read-model contract with only the accepted quick/custom
   periods and their runner-local exact inclusive dates, `asOfDate`, and timezone basis. Do not
   relabel the existing `28_days` weekly contract or make the client calculate a range.
2. Return one stable chronological member for every eligible accepted FIT activity in the period,
   including canonical activity identity, historical local date/time, deterministic same-day order,
   current evidence state/revision truth, and activity label/context only when factually known.
3. Return the supported per-activity observations—distance, timer duration, observed average pace,
   elevation gain, and reported session-RPE load—with display/unit, available/partial/unavailable/
   updating state, stable reason, and coverage. Keep an activity whose selected metric is
   unavailable as a member with no invented numeric value.
4. Define truthful complete, empty, updating, unavailable/incomplete, correction, and removal
   behavior. Never return stale points for a changed period or evidence revision; never call a
   subset `all`.
5. Preserve the current weekly bucket contract, FIT-only PB slots, Calendar semantics, runner-owned
   workout/source-provenance boundary, product privacy boundary, and no-FIT non-substitution.
6. Reuse existing validation/fixture seams. Prove quick-period boundary semantics, custom-range
   validation, all-activity completeness, same-day ordering, missing/partial observations, FIT
   correction/removal, no-FIT exclusion, cross-runner isolation, no N+1 reads, 3,000-activity
   behavior without a cap, and disposable cleanup.

## What Not To Touch

No Design System primitive, chart package, `/hitoDS` specimen, Progress route/component, client
state or aggregation, line/connector UI, generic chart framework, source-plan/container authority,
Calendar workflow, manual result path, provider/hosted state, dependencies, release, or Git
lifecycle. Do not add a table, migration, RPC, persistence shape, compatibility alias, or new proof
framework unless source inspection demonstrates that the existing runner-activity contract cannot
represent the required truth; return to PRODUCT before expanding there.

## Validation Expectations

Run an execution preflight before the first task-owned write. Use the existing local Supabase and
runner-activity proof seams; safe named ARCHITECT or QA review may be requested read-only for an
independent contract or persistence discriminator. Run focused static/type/lint/format/diff checks
and relevant local persistence/read-model proof. Browser, Design System implementation, Product
adoption, Global QA, hosted parity, release, and deployment are separate and must not be claimed.

## Stage

Backend complete factual FIT activity-sequence read-model readiness

## Execution Preflight — 2026-08-17

- **Mode and owner:** Tracked Backend implementation in the existing runner-activity Progress read
  model and authenticated Product API.
- **Accepted decision and discriminator:** Product accepted four exact quick periods plus one strict
  custom local range. The current `progress.fitProgress` contract contains only the exact 28-day
  weekly buckets and five FIT-only PB slots; it has no complete activity-level sequence or
  server-resolved period selector.
- **Existing seams reused:** the canonical current activity/source/revision graph, Gate 4
  formula/snapshot reconciliation, existing Progress read model and Product projection, the
  authenticated `/api/runner-activity-progress` route, and the current Gate 4/read-model disposable
  fixtures and validators.
- **Smallest change:** compute one selected FIT activity sequence from the same already-loaded
  current activity graph used by the metric snapshot, while preserving the cached 28-day/PB
  payload. Advertise four Backend-resolved quick periods and accept one strict custom selector; do
  not persist selector state or create a second read model.
- **New runtime artifacts:** none. No production file, migration, table, RPC, fixture framework,
  dependency, provider path, hosted action, client state, or compatibility path is proposed.
- **Obsolete responsibility:** no existing activity-sequence path exists to delete. The new contract
  prevents future clients from deriving period dates, clipping, paginating, capping, sampling,
  aggregating, ordering, or choosing evidence membership.
- **Focused proof:** quick/custom boundaries including leap/month behavior and `This week` future
  days; complete chronological and same-day ordering; FIT-only metrics and no-FIT exclusion;
  missing/partial/updating/correction/removal truth; runner isolation; 3,000-activity no-cap/no-N+1
  behavior; privacy; cleanup; and focused static hygiene.
- **Shared lifecycle boundary:** the managed QA runtime remains read-only and `stale/broken` on the
  unrelated missing Admin snapshot artifact. This task will use only the existing disposable local
  Supabase proof lifecycle and will not build, restart, seed, or browse that runtime.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: PRODUCT

The Backend factual FIT activity-sequence contract is complete in
`docs/tasks/backlog/2026-08-17-hito-runner-progress-complete-fit-activity-sequence-readiness.md`.
Inspect its Product consumer contract and validation receipt, then route the next bounded Design
System point-sequence primitive or Frontend Product adoption step without reopening Backend period,
eligibility, completeness, ordering, missingness, or metric derivation in the client. Preserve the
existing 28-day weekly bars and five FIT-only PB slots. Do not infer browser, Global QA, hosted,
release, or deployment acceptance from this Backend receipt.
```

## Tracked Implementation Receipt — 2026-08-17

### Stage And Result

Backend complete factual FIT activity-sequence read-model readiness is complete. The existing
authenticated Runner Activity Progress contract now returns one Backend-selected, complete factual
FIT activity sequence alongside the unchanged 28-day weekly bars, FIT-only PB slots, and existing
advanced metric projection. No migration, table, RPC, persistence shape, production file,
dependency, provider path, compatibility path, or parallel read model was added.

### Product Outcome And Source Discriminator

The pre-existing Progress contract advertised only the exact `28_days` weekly bucket payload and
five FIT-only PB slots. It had no Backend-owned quick/custom period selector or complete
activity-level sequence, so a later client would otherwise have needed to calculate dates, filter,
order, cap, or sample FIT activities. The first owner was the existing Runner Activity Progress
formula/read-model/Product projection seam.

The corrected owner now:

- advertises `This week`, `Last 7 days`, `Last 1 month`, and `Last 6 months`, resolves their exact
  dates from the runner-local `asOfDate`, and exposes future days explicitly for `This week`;
- validates an inclusive custom local range with `startDate <= endDate <= asOfDate`;
- returns every current eligible accepted FIT activity in historical-local-date, start-time, and
  stable activity-ID order, with exact completeness counts and deterministic same-day order;
- returns Backend-owned distance, timer duration, observed average pace, elevation gain, and
  reported session-RPE load observations with units, basis, coverage, missing reasons, and factual
  available/partial/unavailable state;
- returns no stale points while FIT evidence or metric reconciliation is updating, excludes
  non-FIT completions, and removes or replaces points when current FIT evidence is removed or
  corrected; and
- removes internal activity/source revision identifiers from the Product projection while keeping
  safe activity identity and `From FIT file` evidence wording.

### Exact Consumer Contract

`GET /api/runner-activity-progress` defaults to `period=this_week`. It also accepts
`period=last_7_days`, `last_1_month`, `last_6_months`, or
`period=custom&startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`. Unsupported or invalid selectors return
HTTP 400 with `invalid_activity_sequence_period`.

Successful Product readback adds `progress.fitActivitySequence`. Its selected and advertised period
objects contain exact `startDate`, `endDate`, `asOfDate`, runner-calendar timezone basis, historical
activity-date basis, and an explicit future interval where applicable. `ready` and `empty` states
contain complete counts, aggregate coverage, and ordered points; `updating` and `unavailable` return
no stale points. A later Design System or Frontend consumer must render this contract and must not
recalculate periods, eligibility, ordering, completeness, metrics, averages, or sampling.

### Files Inspected And Changed

- `src/lib/runner-activity/read-model-types.ts`
- `src/lib/runner-activity/metric-formulas.ts`
- `src/lib/runner-activity/metric-snapshots.ts`
- `src/lib/runner-activity/read-model.ts`
- `src/lib/runner-activity/product-contract.ts`
- `src/routes/api.runner-activity-progress.tsx`
- `scripts/validate-runner-activity-gate-4.ts`
- `scripts/validate-runner-activity-read-models.ts`
- this canonical item

These were focused edits inside already shared/dirty canonical owners. Unrelated working-tree bytes
were preserved; the index remained empty.

### Validation Inventory

| Check                             | Scenario / environment                                                       | Result | Evidence                                                                                                                                                                                                                                                                                           |
| --------------------------------- | ---------------------------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator              | Existing Progress owner and accepted discovery/coach contracts               | Passed | Confirmed the existing Product payload had weekly `28_days` bars and PBs but no complete selected activity sequence.                                                                                                                                                                               |
| Quick-period formula matrix       | Deterministic source proof                                                   | Passed | Proved runner-local Monday-Sunday with explicit future interval, inclusive seven-day dates, leap-aware one-month dates, and six-calendar-month dates.                                                                                                                                              |
| Custom-period validation          | Deterministic server read-model proof                                        | Passed | Unsupported selectors, a start after end, and an end after runner-local `asOfDate` reject before data mutation.                                                                                                                                                                                    |
| FIT sequence and metric truth     | Disposable local Supabase Gate 4 lifecycle                                   | Passed | `node --env-file=.env.local --import tsx ./scripts/validate-runner-activity-gate-4.ts` passed; seven eligible FIT activities returned seven points, missing timer duration retained its point, elapsed-basis pace and partial load remained explicit, and the no-FIT completion remained excluded. |
| Updating/correction/removal truth | Disposable local Supabase Gate 4 lifecycle                                   | Passed | Updating evidence returned no stale points; removal removed the affected point; correction retained activity identity with the current revision's observations.                                                                                                                                    |
| Isolation and cleanup             | Two disposable local runner identities                                       | Passed | Cross-runner sequence remained empty; all owned fixture, evidence, snapshot, asset, and storage rows were asserted back to zero after the proof.                                                                                                                                                   |
| Canonical 30-activity regression  | Disposable design-profile read-model lifecycle                               | Passed | The existing profile retained 55 Calendar workouts and 30 activities; Progress readback stayed current and the profile-specific selected sequence returned complete `1/1` current-week FIT truth.                                                                                                  |
| Complete 3,000-activity sequence  | Disposable local Supabase scale lifecycle                                    | Passed | `node --env-file=.env.local --import tsx ./scripts/validate-runner-activity-read-models.ts --scale=3000` returned `eligibleActivityCount=3000`, `returnedPointCount=3000`, and 3,000 unique chronologically ordered Product points.                                                                |
| No cap / no N+1                   | Warm 3,000-activity readback                                                 | Passed | Three warm reads and two post-mutation warm reads each used 40 reads, with bulk 500-row paging and no per-activity query growth; the Product payload retained all 3,000 points.                                                                                                                    |
| Existing weekly bars and PBs      | Gate 4 and read-model validators                                             | Passed | The exact five weekly series and five FIT-only PB slots remained green; no whole-period average pace or interpretation was introduced.                                                                                                                                                             |
| Product privacy                   | Product projection validators                                                | Passed | Activity/source/evidence revision IDs, snapshot IDs, storage paths, raw filenames, and internal formula metadata remained absent from the Product sequence.                                                                                                                                        |
| Focused lint                      | Eight task-owned source/proof files                                          | Passed | Targeted ESLint exited 0.                                                                                                                                                                                                                                                                          |
| Focused type diagnostics          | Repository TypeScript output filtered to eight task-owned source/proof files | Passed | No diagnostic referenced a task-owned file.                                                                                                                                                                                                                                                        |
| Formatting and diff hygiene       | Task-owned files plus shared working tree                                    | Passed | Targeted Prettier check and `git diff --check` exited 0.                                                                                                                                                                                                                                           |
| Independent architecture review   | Named ARCHITECT, bounded read-only source/proof review                       | Passed | Confirmed one canonical Progress read model, deterministic inclusive periods, complete current FIT membership, no stale updating points, Product privacy, preserved weekly/PB contracts, and paged rather than N+1 scale behavior; no files or state were changed.                                 |

### Preserved Boundaries

Runner-owned Calendar/source provenance, historical activity dates, the existing 28-day weekly bar
contract, five FIT-only PB slots, Gate 5 `normalized_stream_not_persisted`, no-FIT non-substitution,
auth/isolation, and Product privacy remain intact. No Product UI, Design System source, chart or
connector, client aggregation, hosted state, provider, migration, dependency, Git, or release state
was changed.

### Omitted Checks And Consequences

- The full repository TypeScript check remains red on numerous pre-existing parallel-work errors;
  the filtered output contained no task-owned diagnostic. Repository-wide type health is not
  claimed.
- The managed `qa_fixture` runtime remained `stale/broken` on the unrelated missing Admin snapshot
  artifact, so HTTP serialization/auth replay, browser behavior, and Product rendering were not
  exercised. The deterministic server parser, projection, local persistence, privacy, and scale
  contracts are covered; runtime and browser acceptance remain separate.
- A production build and the complete Backend DB suite were not run because the changed contract
  has focused Gate 4/read-model coverage and the shared candidate contains unrelated moving work.
  Whole-application bundle and unrelated Backend integration remain unclaimed.
- Design System, Frontend Product adoption, browser accessibility, Global QA, hosted parity,
  release, and deployment were outside this Backend slice and remain unclaimed.

### Next Owner And Blockers

Next owner is PRODUCT to select and dispatch the bounded Design System point-sequence primitive or
Frontend Product consumer adoption. Backend Implementation DoD for this slice is passed. There is no
Backend blocker; all later acceptance layers remain pending under their own owners.

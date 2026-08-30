# Hito Runner Progress FIT Results And Chart Payload Readiness

## Work Item ID

d1090ed0-01aa-4b00-9ccd-eeb75f26568e

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

[Runner Progress Charts And Records Discovery](./2026-08-16-hito-ds-runner-progress-charts-and-records-discovery.md)

## Evidence From

[Runner Progress Metrics And Visualization Doctrine Discovery](./2026-08-16-hito-runner-progress-metrics-and-visualization-doctrine-discovery.md)

## Scope

The existing runner-activity Progress read-model contract: expose Backend-shaped exact-period weekly
series and FIT-only result/record truth required by the accepted Progress chart-and-record design.
This task does not implement charts, change Design System source, create a new result path, or alter
Calendar workflow.

## Archive Intent

Retain through later Design System chart implementation and Runner Progress acceptance, then compact
to the FIT-only evidence rule, chart-payload contract, and validated source boundary.

## Task

Prepare the smallest truthful Backend payload for one factual weekly series at a time and the five
standard best-time slots. Actual result facts come only from a durably attached, successfully parsed
FIT file. A completed Calendar workout without FIT remains scheduled-completion information and must
not become actual volume, time, elevation, pace, or a personal best.

## Accepted Product Direction

- The initial chart period is exactly Backend-advertised `28 days`; later periods are emitted only
  when Backend explicitly supports them.
- Chart buckets, dates/cutoffs, completion labels, values, units, coverage, and evidence states are
  Backend truth. Frontend and Design System do not aggregate, clip, label a bucket `to date`, or
  pick a record winner.
- Actual metrics and PBs are FIT-only. Runner copy must use `From FIT file`; there is no manually
  entered `Official result` result class.
- No-FIT completed workouts may retain `Completed as planned` and scheduled targets as Calendar
  information, but never substitute for actual result evidence or a PB.
- The requested PB slots are exactly `1 km`, `5 km`, `10 km`, Half Marathon (`21.0975 km`), and
  Marathon (`42.195 km`).

## Demonstrated Discriminator

The current Progress model exposes rolling snapshots plus calendar-week rows that can be four or
five buckets around a 28-day window, but does not advertise exact chart period/bucket boundaries or
bucket-completion state. Its generic record list retains class/context variants and does not emit one
Backend-resolved state per requested PB slot. The previous policy admits non-FIT record classes,
which conflicts with the accepted FIT-only rule.

## Required Outcome

1. A chart-neutral, Backend-shaped 28-day series contract for sessions, running time, distance,
   elevation, and reported load; later UI selects one supplied series only.
2. Ordered bucket facts contain dates, explicit `partial_start | complete | to_date` state,
   available-zero vs partial vs unavailable, unit/display metadata, coverage, and reason.
3. Five ordered PB slots are Backend-resolved from eligible FIT-derived actual evidence only. Each
   emits available, no verified time yet, unavailable, or updating. Available facts include an
   authorized FIT/activity reference only when already admitted by the existing contract.
4. The existing factual summary remains a read-only consumer until later DESIGN SYSTEM/FRONTEND
   adoption. No compatibility aliases or client winner selection are introduced.
5. Local proof covers FIT actuals, no-FIT completed workouts, missing/partial FIT evidence,
   standard-distance eligibility, runner isolation, correction/removal, and cleanup.

## What Not To Touch

No chart/UI/Design System primitive, `/hitoDS`, route layout, client aggregation, manual result
entry, source-plan/container authority, Calendar workflow, fixture framework, provider/hosted path,
financial/Admin/marketing work, dependencies, Git lifecycle, or iPad scope. Do not add a migration
unless the current persisted result shape demonstrably cannot express a required truthful state.

## Validation Expectations

Establish FIT-only eligibility with existing durable evidence and result-readback seams. Verify exact
period/bucket boundaries, state semantics, PB slot selection, no-FIT non-substitution, correction and
removal readback, cross-runner isolation, and cleanup. Run proportional source/type/lint/format/diff
checks. Browser, Design System implementation, Global QA, hosted, release, and deployment remain
separate.

## Stage

BACKEND factual chart and FIT-only record readiness

## Execution Preflight — 2026-08-16

- **Mode and owner:** Tracked Backend implementation in the existing runner-activity Progress read
  model.
- **Demonstrated discriminator:** the current Product projection has no advertised exact 28-day
  chart period or clipped bucket-completion contract, while the generic Gate 4 record list still
  preserves class/context variants instead of returning the five accepted FIT-only slots.
- **Existing seams reused:** the current activity/source revision graph, Gate 4 metric snapshot and
  formula owners, Product projection, and Gate 4 disposable fixture/validator.
- **Smallest change:** add a FIT-only chart and five-slot best-time projection to the existing
  advanced metric snapshot. Keep the current factual summary and generic historical record readback
  unchanged until their current Frontend consumer is replaced.
- **New runtime artifacts:** none. No migration, table, RPC, provider, fixture framework,
  dependency, compatibility alias, or client state is proposed.
- **Obsolete responsibility:** later consumers will no longer clip `calendarWeeks`, infer bucket
  completion, or select a PB winner from generic record rows. Those existing fields remain only for
  the current read-only Progress consumer during the separately owned adoption stage.
- **Focused proof:** exact clipped 28-day buckets; available-zero, partial, unavailable, and updating
  truth; all five FIT-only slots; no-FIT non-substitution; correction/removal; runner isolation;
  cleanup; focused static hygiene. Shared managed runtime/browser mutation is excluded.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Review the completed Backend receipt in
docs/tasks/backlog/2026-08-16-hito-runner-progress-fit-results-and-chart-payload-readiness.md and
route the accepted `progress.fitProgress` contract to a bounded DESIGN SYSTEM chart implementation.
The Design System must render one Backend-supplied series at a time and must not aggregate, clip,
label, compare, or choose a PB winner. Preserve the existing factual Progress summary until the
later FRONTEND Product adoption is separately assigned. Do not infer browser, Global QA, hosted,
release, or deployment acceptance from this Backend receipt.
```

## Tracked Implementation Receipt — 2026-08-17

### Task And Stage

- **Task:** Hito Runner Progress FIT Results And Chart Payload Readiness.
- **Stage:** Backend factual chart and FIT-only record readiness.
- **Role file:** `agents/backend.agent.md`.
- **Skills used:** `skills/hito-backend-supabase-contract/SKILL.md` and the installed Supabase
  procedure for local persistence proof; no external Supabase documentation was needed.
- **Independent reviewer:** the existing named ARCHITECT role performed one bounded read-only
  contract review and follow-up. No implementation was delegated.
- **Lifecycle:** Backend Implementation DoD is complete. Browser, Global QA, hosted, release, and
  deployment acceptance remain unclaimed.

### Product Outcome And Root Cause

The Product Progress projection now exposes `progress.fitProgress` as one server-owned factual
contract. It advertises exactly one `28_days` period, ordered clipped Monday-week buckets, five
metric series, and exactly five FIT-only PB slots. Dates, cutoff/completion state, values, coverage,
units, display metadata, missingness, reasons, and updating state are Backend truth.

The first incorrect owner was the runner-activity Gate 4 snapshot/formula projection: it exposed
rolling facts and generic record rows but no exact chart period or one resolved FIT-only state per
accepted PB slot. The existing generic record model also admits runner-confirmed result classes,
which cannot be the source of the accepted FIT-only Progress facts.

The accepted FIT eligibility discriminator is now explicit: the activity's current normalized
revision must point to the current `manual_garmin_fit` source revision; that revision must be a FIT
or FIT-ZIP raw asset in `available` state with its durable storage locator intact. The canonical FIT
ingestion transaction creates the normalized revision only after successful parsing. PB matching is
whole-activity only, uses the exact accepted distance within 0.05 metres, chooses the fastest
elapsed time, and breaks equal times by stable activity ID. No workout completion, manual result,
segment, plan source, or client winner selection can substitute.

### Files Changed

- `src/lib/runner-activity/read-model-types.ts` — chart, period, state, coverage, and five-slot FIT
  result types.
- `src/lib/runner-activity/metric-formulas.ts` — formula set v4, exact 28-day buckets, five factual
  series, FIT-only PB selection, stable tie-break, and runner-facing reason/display metadata.
- `src/lib/runner-activity/metric-snapshots.ts` — batched source/revision eligibility readback and
  fail-closed current-versus-historical snapshot parsing.
- `src/lib/runner-activity/product-contract.ts` — privacy-shaped `fitProgress` projection; activity
  revision, source revision, and storage details remain internal.
- `scripts/lib/runner-activity-gate-4-fixture.ts` — existing disposable Gate 4 evidence expanded
  with elevation and a completed-without-FIT discriminator.
- `scripts/validate-runner-activity-gate-4.ts` — FIT-only state, correction/removal, isolation,
  history-version, tie-break, privacy, and cleanup proof.
- `scripts/validate-runner-activity-read-models.ts` — exact Product shape plus 30/3000-activity
  batch-read and payload-size proof.
- This canonical item — execution preflight and terminal receipt.

No new production file, migration, table, RPC, fixture framework, dependency, provider path, or
compatibility alias was added. The deliberately centralized formula owner is now 1,046 lines; its
growth is one cohesive formula/readback responsibility rather than a new abstraction or second
truth path.

### Exact Consumer Contract

- Read `RunnerActivityProgressProductModel.fitProgress`.
- `status: current` supplies `chart.advertisedPeriods[0]` with `id: 28_days`; its ordered series are
  `sessions`, `running_time`, `distance`, `elevation`, and `reported_load`.
- Each ready series supplies ordered bucket points with server dates, cutoff, completion label,
  value/display value, coverage, and reasons. Updating series return no stale points.
- `personalBests.slots` is always ordered as 1 km, 5 km, 10 km, Half Marathon, and Marathon. An
  available result exposes elapsed/display time, event date, `From FIT file`, and the already
  authorized activity ID only.
- Historical pre-v4 snapshots expose `historical_formula_version_without_fit_progress`; recognized
  v4 snapshots missing matching FIT payload/formula metadata fail closed.
- The existing factual summary and generic records remain unchanged for the current Progress
  consumer and are not a source for the new FIT-only contract.

### Validation Inventory

| Check                         | Scenario / environment                                                    | Result      | Evidence                                                                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-cause discriminator      | Current Gate 4/Product source                                             | Passed      | Confirmed no exact advertised chart period and no five-slot FIT-only projection before this change.                                                               |
| Formula and PB determinism    | Pure Gate 4 formula matrix                                                | Passed      | Exact-distance whole-activity selection, equal-time stable ID tie-break, and reversed candidate order return the same winner.                                     |
| FIT-only lifecycle            | Local Supabase disposable Gate 4 fixture                                  | Passed      | `node --env-file=.env.local --import tsx scripts/validate-runner-activity-gate-4.ts` passed.                                                                      |
| No-FIT and missingness truth  | Completed-without-FIT plus partial/missing fields                         | Passed      | Completion did not add actual volume or a PB; available-zero, partial, unavailable, and reason states were asserted.                                              |
| Correction/removal/updating   | Source correction, removal pending, removal, and reimport                 | Passed      | PB fallback/correction remained deterministic; updating returned no stale chart points; removed FIT became unavailable.                                           |
| Historical integrity          | Old formula payload with cloned FIT fields; v4 payload missing FIT fields | Passed      | Old payload returned explicit historical unavailability; malformed current v4 payload was rejected.                                                               |
| Product privacy and isolation | Owner and second local runner                                             | Passed      | Product readback omitted revision/storage identifiers; the second runner saw only its empty factual state.                                                        |
| Read-model scale              | Local fixtures with 30 and 3,000 activities                               | Passed      | 30 rows: miss 17 reads, warm 16; 3,000 rows: miss 71, warm 40. Source and source-revision reads remained paged, not N+1.                                          |
| Product payload boundary      | 30 and 3,000 activity projections                                         | Passed      | Product payloads were 15,130 and 15,418 bytes versus internal payloads of 28,386 and 612,226 bytes.                                                               |
| Disposable cleanup            | Gate 4 and read-model lifecycle exits                                     | Passed      | Owner/isolation tables and leases converged through the existing cleanup owner.                                                                                   |
| Formatting/lint/diff          | Task-owned source, scripts, and item                                      | Passed      | Targeted Prettier, targeted ESLint, and `git diff --check` passed.                                                                                                |
| Type checking                 | Repository TypeScript with task-path filter                               | Scoped pass | No task-owned diagnostics. Repository-wide `tsc --noEmit` remains red on pre-existing unrelated errors.                                                           |
| Independent review            | Named ARCHITECT, read-only                                                | Passed      | Reviewer confirmed FIT eligibility, bucket/state semantics, privacy, no-stale updating, version gating, and deterministic tie-break after two narrow corrections. |

### Preserved Boundaries

- Existing factual summary, generic historical record readback, Gate 5
  `normalized_stream_not_persisted`, Calendar behavior, and runner-owned workout truth remain
  unchanged.
- No UI, Design System, route, manual result entry, source-plan/container authority, provider,
  hosted state, dependency, Git lifecycle, or product data was changed.
- All production source edits remained in the canonical runner-activity read-model owners. The
  independent ARCHITECT reviewer made no source, database, fixture, runtime, Git, or hosted writes.

### Omitted Checks And Consequences

- The complete local Backend DB suite was not rerun; unrelated Backend database contracts are not
  re-accepted by this focused receipt.
- A production build was not run; bundle-wide integration remains unclaimed.
- The shared managed runtime was not rebuilt or used because its read-only status was already
  `stale/broken` on an unrelated missing Admin repository snapshot artifact. HTTP route and browser
  rendering are therefore unclaimed.
- Browser, visual/accessibility, Design System, hosted parity, provider, release, deployment, and
  Global QA checks were not run and are not implied.

### Next Owner And Blockers

PRODUCT is the next owner to route the bounded chart primitive/contract work to DESIGN SYSTEM and,
after that, the separate Progress route adoption to FRONTEND Product. There is no Backend blocker
inside this completed slice.

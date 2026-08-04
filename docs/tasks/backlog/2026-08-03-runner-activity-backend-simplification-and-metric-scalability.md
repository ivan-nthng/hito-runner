# Runner Activity Backend Optimization Plan

## Work Item ID

2026-08-03-runner-activity-backend-simplification-and-metric-scalability

## Status

backlog

## Type

plan

## Priority

medium

## Owner

backend

## Scope

athlete-profile-progress

## Batch

runner-activity-backend-canonicalization

## Archive Intent

retain_in_place

## Task

Simplify the accepted Runner Activity Gates 1-4 implementation without creating a second activity,
projection, profile, metric, fixture, framework, or persistence truth. The accepted Gates 1-4
baseline and canonical planned-workout projection reconciliation are now released. Slice 1b separates
that single projection lifecycle from the upload/parser facade without changing behavior. Slice 2
has completed the target-specific legacy backfill and retired its executable maintenance path;
Slice 3 measured snapshot reconciliation and retained the existing fingerprinted implementation
because representative evidence did not admit materialization.

## Stage

Gates 1-4 are released, and Slice 1 shipped as
`329f45c27ff25928c4daad963f24f967e197200c`: ordinary FIT/ZIP intake no longer invokes historical
backfill, and planned-workout projection retries reconcile complete canonical readback. Slice 1b is
implemented and owner-level validated on the current working tree: the same projection lifecycle now
has one focused module and the intake facade is 564 lines instead of 1,009. Slice 2 processed the
single eligible hosted legacy
asset into the canonical activity/source/revision graph, proved zero remaining eligible candidates,
and removed the now-unreachable backfill module. Slice 3 is complete: the current factual and Gate 4
reconciliation remained bounded, warm reads wrote nothing, and exact mutation invalidation preserved
historical truth. The exact eight-path source-control boundary for Slices 1b, 2, and 3 was audited
against `329f45c27ff25928c4daad963f24f967e197200c` and integrated locally as commit `a6c5f44`: the
accepted Slice 3 validator blob was committed instead of its later mixed worktree content. The
commit has not been pushed or deployed.
Gate 5, provider sync, the service-role environment-contract correction, and raw-removal fallback
retirement remain separate future work.

## Dispatch

Slices 1b, 2, and 3 are complete in Backend and integrated in local commit `a6c5f44`. The work item
remains a `backlog` optimization program rather than a release-readiness status; completed and future
slices are recorded explicitly below. Push and deployment remain separate release actions.

## Source-Control Integration Manifest (2026-08-04; integrated locally as `a6c5f44`)

### Audit anchor and verdict

- Baseline `HEAD`: `329f45c27ff25928c4daad963f24f967e197200c` on `main`.
- Live dirty inventory at the final manifest audit: 60 paths. The accepted union has eight paths;
  52 other dirty or untracked paths are excluded. One of the eight paths contains a later worktree
  delta that is also excluded at hunk/blob level.
- Owner-receipt union: Slice 1b names the plan, current-state receipt, intake facade, and extracted
  projection owner; Slice 2 names the plan, foundation validator, and deleted backfill owner; Slice 3
  names the plan, measurement validator, and technical ledger. Removing duplicates yields the exact
  eight-path union below.
- Verdict: **release-ready as an index-accurate bundle**, not as ordinary whole-file staging. The
  release owner must put the accepted Slice 3 blob `08e5f1e9f40b53a842aac8bcf708ed8250c8a431`
  in the index while leaving the later runner-design-profile worktree delta untouched.
- The runner-design-profile fixture and its validator delta remain their own Product/QA acceptance
  scope. `SUPABASE_SERVICE_ROLE_KEY` correction is also separate: no accepted hunk below changes a
  service-role alias or environment contract.

### Exact accepted index contents

| Slice        | Path                                                                                             | Required index content                                                                                                                                    | Canonical ownership / replacement proof                                                                                                                                  |
| ------------ | ------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1b           | `docs/current-state.md`                                                                          | Current worktree blob `cb95bedb14c195cf27e1228957d829ddfdfb81c6`; exactly the two hunks listed below                                                      | Slice 1b owner receipt synchronizes the released Slice 1 and locally validated Slice 1b state; it does not claim Slices 2/3 released                                     |
| 3            | `docs/history/technical-log.md`                                                                  | Current worktree blob `6ce708feb478bab8b20866dd6cc8dc0e43cae2f1`; exactly the two hunks listed below                                                      | Durable Slice 3 measurement/retention ledger; no runtime or Global QA claim                                                                                              |
| 1b/2/3/audit | `docs/tasks/backlog/2026-08-03-runner-activity-backend-simplification-and-metric-scalability.md` | This final reviewed manifest file in full; the release owner must record its final blob before staging and reject any later content drift                 | The one canonical optimization plan and manifest receipt; no supporting document becomes an operational queue                                                            |
| 2            | `scripts/validate-runner-activity-foundation.ts`                                                 | Current worktree blob `3854d585c96e2e657e572d76191e66a8a18cdb50`; all 23 current hunks                                                                    | Removes the deleted backfill import/execution and retains retirement, ordinary-intake non-mutation, loopback, privacy, and cleanup safeguards                            |
| 3            | `scripts/validate-runner-activity-read-models.ts`                                                | **Accepted historical blob only:** `08e5f1e9f40b53a842aac8bcf708ed8250c8a431`; never the current worktree blob `6ade478411cc5963156fa3480096bae9ffe8b0d3` | Adds the accepted 30-activity snapshot measurement proof while continuing to import the `HEAD` progress-review fixture; the later design-profile delta is excluded       |
| 2            | `src/lib/runner-activity/backfill-workout-result-activities.ts`                                  | Intentional whole-file deletion of the `HEAD` blob; 164 removed lines                                                                                     | `HEAD` had only the foundation-validator consumer; current executable reachability is zero and the retained validator proves retirement state without a mutation routine |
| 1b           | `src/lib/workout-result-import/ingest-garmin-result.ts`                                          | Current worktree blob `5875d98d89f61b396760fd5e2201c63edfcf35b1`; all nine current hunks                                                                  | Keeps the sole upload entrypoint/caller and replaces its embedded projection lifecycle with one import; no activity writer or public route is added                      |
| 1b           | `src/lib/workout-result-import/planned-workout-projection.ts`                                    | New file in full, 447 lines, blob `47ec5d10b13730815e26edc40464a469cf7449a2`                                                                              | Exact extracted projection owner; it has one runtime caller, and no second projection or activity truth remains                                                          |

### Exact hunk boundaries

The blob identifiers above are authoritative. Hunk headers are included as a human-review map; a
later line-offset change is drift and must be re-audited rather than silently restaged.

- `docs/current-state.md`: `@@ -9 +9 @@ Active`; `@@ -13,8 +13,8 @@ Active`.
- `docs/history/technical-log.md`: `@@ -4 +4 @@ Status: active internal ledger`;
  `@@ -32,0 +33,12 @@`.
- `scripts/validate-runner-activity-foundation.ts`: all 23 current hunks beginning at old/new line
  pairs `7/6`, `8/8`, `34/35`, `52/55`, `60/62`, `66/67`, `72/73`, `84/84`, `88/88`, `180/199`,
  `182/201`, `553/572`, `557/576`, `573/592`, `577/597`, `701/722`, `703/724`, `766/786`,
  `799/797`, `808/806`, `848/849`, `859/861`, and `878/881`.
- `scripts/validate-runner-activity-read-models.ts`: compare `HEAD` blob
  `da13dedef97f2807087c84b8b0099c6ba032f412` to accepted blob `08e5f1e9…`; exactly eight
  addition hunks at `-4/+5`, `-11/+13`, `-17/+20`, `-20/+24`, `-22/+27`, `-41/+47,14`,
  `-210/+230,2`, and `-213/+235,191`. The SHA-256 of that exact binary-capable Git patch is
  `7018970c6e7e1cdcfcd53f187883c5c3e78846b4589be52dea538b3a49504e87`.
- `src/lib/runner-activity/backfill-workout-result-activities.ts`: `@@ -1,164 +0,0 @@`.
- `src/lib/workout-result-import/ingest-garmin-result.ts`: all nine current hunks beginning at
  old/new line pairs `2/1`, `4/2`, `6/3`, `11/7`, `14/9`, `21/21`, `26/26`, `231/202`, and
  `715/272`.
- `src/lib/workout-result-import/planned-workout-projection.ts` and this plan: whole files.

### Same-path excluded delta

The current worktree blob for `scripts/validate-runner-activity-read-models.ts` is not the Slice 3
artifact. Relative to accepted blob `08e5f1e9…`, it has 35 additions and two deletions that import
`runner-design-profile-fixture`, clear and recreate the active plan, and emit a `planLifecycle`
receipt. Those hunks, the deleted worktree copy of
`scripts/lib/runner-activity-progress-review-fixture.ts`, and the untracked
`scripts/lib/runner-design-profile-fixture.ts` remain untouched and unstaged. The accepted validator
blob imports the tracked progress-review fixture from `HEAD`, so this separation requires no fixture
change and creates no missing dependency in the release commit.

### Exact excluded path inventory

The following 52 live dirty/untracked paths are outside Slices 1b, 2, and 3 and must remain
byte-for-byte unchanged and unstaged by the later release task:

```text
AGENTS.md
docs/README.md
docs/current-product.md
docs/current-system.md
docs/process/hito-ai-first-plan-pipeline-qa-2026-05-26.md
docs/process/hito-plan-creation-qa-matrix.md
docs/tasks/backlog/2026-07-30-runner-activity-intelligence-foundation-architecture.md
docs/tasks/backlog/2026-08-02-hide-attached-activity-file-dates.md
docs/tasks/backlog/2026-08-02-runner-activity-progress-review-fixture.md
docs/tasks/backlog/2026-08-04-canonical-local-runner-design-profile-fixture.md
docs/tasks/backlog/2026-08-04-canonical-loopback-local-inspector-availability.md
docs/tasks/backlog/2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md
docs/tasks/backlog/2026-08-04-hito-ds-component-contract-simplification.md
docs/tasks/backlog/2026-08-04-hito-stack-complexity-reduction-program.md
docs/tasks/backlog/2026-08-04-operational-work-item-lifecycle-reconciliation.md
docs/tasks/backlog/README.md
docs/tasks/frontend-specs/2026-06-13-calendar-rest-day-add-affordance-correction-spec.md
docs/tasks/frontend-specs/2026-07-24-public-auth-entry-landing-experience.md
docs/work-dashboard.md
package-lock.json
package.json
screenshots for Figma/2026-08-04_DESKTOP_activity-history_clean.png
screenshots for Figma/2026-08-04_DESKTOP_progress_clean.png
screenshots for Figma/2026-08-04_DESKTOP_run-details-modal_clean.png
scripts/fixtures/rich-workout-saved-mode-fixture.json
scripts/generate-hito-ds-manifest.mjs
scripts/lib/qa-pool-persistence-proof.ts
scripts/lib/runner-activity-progress-review-fixture.ts
scripts/lib/runner-design-profile-fixture.ts
scripts/manual-workout-authoring/persistence-proof.ts
scripts/running-plan-engine-confirm/persistence-proof.ts
scripts/test-user.mjs
scripts/validate-ai-generated-running-plan-creation.ts
scripts/validate-hito-ds-foundation-cleanup.mjs
src/components/CompletionPanel.tsx
src/components/IntervalsViz.tsx
src/components/devtools/local-devtool-gate.ts
src/components/hito-ds/figma-export-board.tsx
src/components/hito-ds/light-palette-reference.tsx
src/components/hito-ds/reference-foundations-page.tsx
src/generated/hito-ds-manifest.json
src/generated/hito-ds-manifest.ts
src/lib/ai-generated-running-plan-dev-fixture.ts
src/lib/hito-typography-roles.ts
src/lib/training.ts
src/lib/workout-color-tokens.ts
src/styles/calendar-state-surfaces.css
src/styles/forms-onboarding.css
src/styles/foundations.css
src/styles/layout-typography.css
src/styles/overlays-feedback.css
src/styles/shell-admin-analytics.css
```

### Later release prerequisites

1. Reconfirm `HEAD` is the audit anchor and the live dirty inventory has not drifted. Any drift in an
   included blob, the accepted Slice 3 object, or the excluded-path set stops release integration.
   The accepted Slice 3 blob is currently present through an unreferenced Git tree rather than a
   durable branch ref, so release integration must verify it before any object pruning or cleanup;
   a missing object is a hard stop, never permission to stage the current mixed worktree file.
2. Build an index containing exactly the eight manifest paths and the exact content/deletion states
   above. Assert the final plan blob separately because a document cannot contain its own stable
   content hash.
3. Assert the Slice 3 validator index blob is `08e5f1e9…`, the later worktree blob remains preserved,
   and index-versus-worktree status exposes only that intentional residual plus the other excluded
   work.
4. Prove the index has no runner-design-profile fixture, Product UI, Frontend, Design System,
   DevTools, migration, schema, package, deployment, provider, or environment-contract hunk.
5. Re-run proportionate staged-source checks and integrate the already accepted owner receipts; this
   documentation audit does not substitute for release-time index parity or source validation.
6. Commit and push belong only to a later explicitly authorized release task. Deployment, hosted
   mutation, provider calls, and the service-role alias correction remain outside that task unless
   separately authorized.

## Supporting Canonical Sources

- [Runner Activity Intelligence Foundation Architecture](2026-07-30-runner-activity-intelligence-foundation-architecture.md)
- [Runner Activity History And Explainable Progress Experience](2026-08-02-runner-activity-history-and-explainable-progress-experience.md)
- [Runner Activity Intelligence Formula Policy Amendment](../running-coach/2026-08-02-runner-activity-intelligence-formula-policy-amendment.md)
- [Hito Runner Profile Constitution](../running-coach/2026-07-30-hito-runner-profile-constitution.md)
- [Current Functional Map](../../current-functional-map.md)
- [Source Size Governance And Cleanup Plan](../../plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md)

These sources constrain this plan but do not become operational owners of implementation state. The
foundation architecture owns the accepted release manifest and activity/metric gate semantics. The
formula policy owns metric meaning and evidence rules. The global source-size plan owns general
repository cleanup. This work item alone owns the ordered Backend optimization roadmap below.

## Architecture Decision

The current technology stack converges on one application and one persistence system. No framework
migration, microservice, cache, second database, external time-series store, or generic metric
plugin system is justified by current reachability or scale evidence.

Slice 1 corrected the original runtime owner: ordinary intake now calls one idempotent projection
reconciler and no longer traverses historical backfill. Current reachability shows the next smaller
owner problem is structural rather than behavioral: `ingest-garmin-result.ts` is 1,009 lines and
contains both upload/parser orchestration and the complete projection lifecycle. Lines 231-644 form
one cohesive projection responsibility with no external runtime consumer. Extracting that existing
responsibility into one module reduces owner ambiguity while preserving the single call path.

Historical backfill is no longer reachable from either the product request graph or maintained
executable source. Its target-specific inventory found one eligible, non-conflicting hosted asset;
the completed lifecycle linked its canonical activity/source/revision, metrics, and planned match,
transferred raw-file ownership to the source revision, and then proved zero eligible candidates.
The retained validator now proves retirement state without invoking a migration routine.
Snapshot GET paths still perform write-through reconciliation on a fingerprint miss. Slice 3
measured that behavior with the canonical 30-activity fixture: a derived-row reconciliation miss on
a warm local process used 17 reads and 9 writes in 56.10-84.53 ms, while a reconciliation hit used
16 reads and zero writes in 32.15-49.50 ms. A canonical RPE mutation added exactly one observation
and one metric snapshot while leaving the factual snapshot unchanged. This evidence does not admit a
new materialization lifecycle.

## Current Technology Stack

| Layer                       | Canonical live owner                                                                                                 | Reachability and decision                                                                                                                    |
| --------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Runtime and package manager | Node `>=22.12`, npm, `package.json`, `package-lock.json`                                                             | Root scripts use Node/npm; retain one package-manager lock                                                                                   |
| Application framework       | Vite, TanStack Start/Router/Query, React 19, TypeScript                                                              | `vite.config.ts`, `src/start.ts`, `src/router.tsx`, and route imports form one runtime                                                       |
| Build composition           | `@lovable.dev/vite-tanstack-config` plus explicit `nitro/vite`                                                       | The wrapper actively installs TanStack/React/Tailwind/tsconfig plugins; it is not legacy                                                     |
| Server/deployment runtime   | Nitro                                                                                                                | Local finalized QA runtime and Vercel output are produced from the same Nitro build; `cloudflare: false`; no competing adapter config exists |
| Persistence and identity    | Supabase Postgres 17, Auth, private Storage, RLS, RPCs                                                               | `supabase/config.toml`, migrations, server adapter, and generated database types are the only live data boundary                             |
| Activity intake             | TanStack API route to `ingestGarminWorkoutResult`                                                                    | Manual Garmin FIT/ZIP remains the only accepted activity intake                                                                              |
| Canonical activity graph    | `persistGarminFitActivitySource` to `persist_runner_activity_garmin_source`                                          | One transactional writer owns source, source revision, activity, activity revision, and current pointers                                     |
| Generated route contract    | `src/routeTree.gen.ts`                                                                                               | Imported by `src/router.tsx`; all 32 route sources have exactly one generated import                                                         |
| Generated database contract | `src/lib/supabase/database.ts`                                                                                       | Imported across application and validators; generated type support is release source, not disposable output                                  |
| Build-output lifecycle      | `scripts/clean-build-output.mjs`, `scripts/finalize-build-output.mjs`, `scripts/validate-build-output-integrity.mjs` | These own generated local/Vercel artifacts; `.output`, `.vercel`, Nitro caches, and QA runtime caches are not source-control inputs          |
| Test and fixture lifecycle  | Runner Activity validators plus `scripts/test-user.mjs` and `scripts/lib/qa-test-user-lifecycle.mjs`                 | Existing test-user lifecycle remains the single Auth/fixture/cleanup owner                                                                   |

`bun.lockb` and `bunfig.toml` are initial-import artifacts with no operational npm-script consumer.
They are a later repository/tooling cleanup candidate, not a Backend optimization prerequisite. The
direct root `@tanstack/router-plugin` dependency has no source import but requires a dependency-owner
lock/build assessment because TanStack Start also brings it transitively. Neither candidate belongs
in the first Backend slice.

## Accepted Baseline To Preserve

| Boundary                              | Current canonical owner                                                                     | Audit disposition                                                                                                                                                       |
| ------------------------------------- | ------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activity/source/revision truth        | `src/lib/runner-activity/garmin-fit-source.ts` and Gate 1 RPC                               | Retain as the sole activity writer                                                                                                                                      |
| Activity History and factual Progress | `history-read-model.ts`, `fact-snapshots.ts`, `read-model.ts`                               | Retain accepted API/read-model meaning                                                                                                                                  |
| Raw-source removal                    | `removeRunnerActivityOriginalFiles`                                                         | Accepted and truthful: each revision is reconciled independently; successfully removed objects remain `removed` across a later failure                                  |
| Gate 4 evidence and metrics           | Gate 4 migration, `metric-formulas.ts`, `metric-snapshots.ts`                               | Already implemented; immutable evidence revisions, formula-versioned observations/snapshots, historical readback, and retryable lifecycle are baseline, not future work |
| Gate 5 sample evidence                | No persisted normalized sample-set owner exists                                             | Preserve `normalized_samples_persisted: false` and `normalized_stream_not_persisted`; no summary fallback                                                               |
| Workout evidence projection           | `workout_result_assets`, `workout_actual_metrics`, `workout_comparisons` and their readback | Live compatibility/product projection; simplify its writer without removing its accepted consumer contract                                                              |
| Runner-facing endpoints               | Workout upload/removal and activity History/deletion API families                           | Retain both: they own different commands and converge on canonical runner activity truth                                                                                |
| Frontend                              | `/progress`, History/Progress components                                                    | No arithmetic, eligibility, invalidation, or cleanup ownership moves to Frontend                                                                                        |

Functional Global QA Acceptance for Gates 1-4 is accepted evidence and is not rerun by this
documentation audit. Gate 5 and provider sync remain deliberately unimplemented and unavailable.

## Migration, Generated-Code, And QA Rules

### Migrations

The accepted sequence is immutable and ordered:

1. `20260802190244_runner_activity_foundation_gate_1.sql`;
2. `20260802223149_runner_activity_history_and_fact_snapshots.sql`;
3. `20260803134149_runner_activity_gate_4_metrics.sql`.

Never edit, squash, reorder, rename, or delete an accepted migration. A future schema cleanup must be
an append-only migration with local parity, generated-type refresh, RLS/grant proof, rollback or
fix-forward safety, and explicit release ownership. This plan does not authorize a schema change.

### Generated code and build output

- `src/routeTree.gen.ts` and `src/lib/supabase/database.ts` are tracked generated contracts and must
  change only when their route or schema source owner changes in the same bounded release.
- `.output`, `.vercel`, `node_modules/.nitro`, and cache-owned QA runtimes are disposable build
  artifacts; their existing lifecycle scripts own cleanup and integrity proof.
- Generated-code size or file naming is never deletion evidence.

### Validators and fixtures

- Gate-specific validators remain independently reachable entrypoints and retain their accepted
  privacy/RLS/lifecycle discriminators.
- `scripts/test-user.mjs` plus `scripts/lib/qa-test-user-lifecycle.mjs` remain the only browser-fixture
  identity and cleanup owner; do not create an activity-specific Auth lifecycle.
- Shared fixture extraction is admitted only after exact duplicated setup, current consumers, and
  replacement assertions are named. A larger helper layer is not an optimization by itself.
- Functional Global QA receipts remain distinct from documentation, source-inventory, build, or
  implementation-owner proof.

### Duplicate abstractions

A path may be removed only when the implementation receipt names its current consumers, the
canonical replacement, a zero-runtime-consumer result, preserved negative/regression coverage, and
cleanup/readback proof. Similar names, dirty status, line count, generated origin, or a newer path
are insufficient.

## Cleanup Classification

### Completed first-slice candidates

| Path or symbol                                    | Current consumers / evidence                                                                                            | Required replacement                                                                                  | Proof before removal or detachment                                                                              |
| ------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- |
| Upload call to `backfillWorkoutResultActivities`  | Pre-Slice-1 intake import/call plus the retained validator consumer                                                     | Ordinary upload uses the canonical projection owner only; legacy work has a separate finite lifecycle | No request-graph call plus target-specific legacy inventory; module itself remains until later retirement proof |
| Fragmented planned projection writes              | Match helper followed by independent actual-metrics, comparison, asset-link, and supersession writes                    | One idempotent projection owner keyed by immutable activity revision and planned workout              | New/retry/failure discriminators show complete projection exactly once and one canonical activity identity      |
| Exact-source early success                        | Reused source returns after activity-plan match equality                                                                | Completeness readback and repair through the same projection owner                                    | Safe incomplete-projection fixture fails before correction and passes after it                                  |
| Reused-source candidate discard before projection | Candidate asset is discarded when exact source is reused without an existing match; later writes still reference its ID | Projection resolves and links the retained canonical evidence owner consistently                      | Deterministic reused-source/no-match replay and foreign-key/readback proof                                      |

Slice 1 completed these replacements in commit
`329f45c27ff25928c4daad963f24f967e197200c`. The backfill module and legacy data remain deliberately
retained pending Slice 2 evidence.

### Completed bounded simplification

| Candidate                                          | Reachability proof                                                                                                                                                          | Canonical replacement                                                                                                           | Required proof                                                                                                                  |
| -------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Projection lifecycle embedded in the upload facade | `reconcileWorkoutResultProjection` and its metrics/comparison/asset helpers occupy lines 231-644 of the 1,009-line intake module; only `ingestGarminWorkoutResult` calls it | One `planned-workout-projection` owner imported by the existing intake facade; no new route, parser, writer, or public response | Import graph has one runtime caller; full Slice 1 projection/failure matrix, readback, lint, build, and independent review pass |
| Over-broad planned-workout row                     | Intake selects plan-cycle, UI identity, phase, notes, and ordering fields that neither projection comparison nor its receipt consumes                                       | Select only `id`, date/type/source type, title, and steps used by deterministic comparison/readback                             | Type/lint/build prove no hidden consumer; comparison and runtime response remain exact                                          |

### Measured retention and later candidates

| Candidate                                              | Reachability proof                                                                  | Why it is separate                                                                                                          |
| ------------------------------------------------------ | ----------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Factual snapshot write-on-GET                          | Measured cold miss creates seven immutable window snapshots; warm reads create none | Retained: current latency/write amplification did not admit another lifecycle                                               |
| Gate 4 observation/snapshot write-on-GET               | Measured cold miss creates 31 observations and one snapshot; warm reads create none | Retained: one RPE change created only one new observation and one immutable snapshot with exact historical readback         |
| Runner-wide factual and metric snapshot deletion       | `delete_runner_activity_from_history` deletes all current snapshots for the user    | Dependency-aware invalidation needs explicit evidence and an append-only migration if schema support is required            |
| Legacy raw-removal fallback                            | `removeWorkoutResultEvidence` remains product-reachable through the removal API     | Separate compatibility inventory must prove no pre-Gate-1 assets remain; backfill completion cannot authorize this deletion |
| `training.ts` unused `weeklyMileage` and `statsTotals` | No repo caller after `/progress` replacement                                        | Frontend Product owner, not Backend                                                                                         |
| Bun artifacts and direct router-plugin dependency      | No operational source import found                                                  | Repository/dependency owner with lock/build proof, outside this plan's first slice                                          |

Query rewrites, new indexes, other broad file decomposition, fixture consolidation, caching, and
external sample storage are observations only until representative measurements or exact replacement
maps prove a need. They are not executable cleanup candidates in the current roadmap.

## Ordered Roadmap

### Entry Gate 0 - Integrate the accepted Gates 1-4 release - completed

Owner: release integration under the canonical foundation architecture.

Required outcome:

- stage and integrate exactly the accepted 50-file manifest from the revision that passed
  Functional Global QA;
- preserve the four declared concurrent paths exactly, including this optimization plan;
- preserve the migration order, tracked generated contracts, validator reachability, and fixture
  lifecycle;
- leave Gate 5 and provider sync unavailable.

Completed in the accepted Gates 1-4 release baseline. Historical manifest evidence remains under the
foundation architecture; this optimization plan no longer treats release integration as pending.

### Slice 1 - Canonical planned-workout projection reconciliation - completed

Owner: **Backend, workout-result ingestion and projection compatibility boundary**. This is the
smallest implementation owner; it must not take over canonical activity persistence, Progress,
Gate 5, Frontend, provider, or schema ownership.

Required outcome:

- ordinary planned and unplanned upload no longer traverses historical backfill;
- one idempotent projection owner reconciles match, asset linkage, actual metrics, deterministic
  comparison, and supersession for one immutable canonical activity revision;
- exact-source retry verifies and repairs the complete projection before reporting success;
- reused exact source without an existing match cannot reference a discarded candidate asset;
- an incomplete or failed projection never creates, deletes, or rewrites canonical activity/source
  truth and never returns stale projection data as complete;
- Plan vs Run readback, active-plan carry-forward, API contracts, formula truth, RLS, privacy, and
  unplanned activity intake remain compatible;
- the legacy backfill implementation remains explicit compatibility/maintenance code until Slice 2
  completion evidence exists.

Required proof:

| Check                    | Scenario / environment                                                     | Required result                                                                                        |
| ------------------------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| Root-cause discriminator | Safe local incomplete projection and reused-source/no-match cases          | Premature success/reference failure is reproduced before the change and repaired exactly once after it |
| New intake               | Planned FIT/ZIP and unplanned FIT/ZIP                                      | One source/activity/revision; projection complete only for planned input                               |
| Idempotency              | Exact-source retry with complete and incomplete projection                 | Same canonical identity; complete readback; no duplicate projection rows                               |
| Ownership refusal        | Same activity requested for a conflicting planned workout                  | Stable domain refusal; no moved identity or partial projection                                         |
| Failure boundaries       | Injected match, metrics, comparison, asset-link, and supersession failures | Canonical activity remains valid; retry converges; no stale success                                    |
| Compatibility            | Plan vs Run and active-plan replacement/carry-forward                      | Existing projection consumer contract remains truthful                                                 |
| Security/privacy         | Owner and isolation identities                                             | RLS holds; no bucket/path/raw FIT/private payload leakage                                              |
| Provider isolation       | Local activity fixture mode                                                | Zero provider and AI calls                                                                             |
| Regression               | Runner Activity foundation, read-model, Gate 4, comparison validators      | All required targeted validators pass with complete executed-test inventory                            |
| Build/release hygiene    | Targeted lint, production build, build integrity, scoped status            | Passed; no files outside the declared slice; disposable data/objects return to zero                    |
| Independent review       | Bounded Backend QA subagent                                                | Required inventory independently passes before owner closure                                           |

Completed and released as `329f45c27ff25928c4daad963f24f967e197200c`. Its lifecycle matrix,
runtime readback, provider isolation, cleanup, build, and integrity receipts are the baseline for
later slices and must not be reopened without a new discriminator.

### Slice 1b - Separate the canonical projection owner from intake - completed

Owner: Backend workout-result intake/projection boundary.

Required outcome:

- keep `ingestGarminWorkoutResult` as the sole upload entrypoint and sole projection caller while
  preserving its public result;
- move the existing projection reconciliation, failure-boundary, actual-metrics, comparison,
  supersession, and candidate-cleanup responsibility into one focused server-only module;
- narrow the persisted planned-workout input to fields actually consumed by deterministic comparison
  and receipt shaping;
- leave parsing, upload validation, raw source persistence, original-file removal, backfill, formulas,
  schema, API routes, and Product UI unchanged;
- delete the moved private implementation from the intake facade so no parallel owner remains.

Required proof:

- one import/reachability path from intake to projection and no second runtime entrypoint;
- the complete maintained projection failure/retry matrix and planned/unplanned foundation lifecycle;
- Runner Activity read-model and Gate 4 regressions;
- targeted lint, fresh production build and integrity, scoped diff hygiene, and independent QA review.

Slice 1b stays open if extraction changes transaction/lifecycle semantics, duplicates candidate
cleanup, broadens the public API, or any required regression fails.

Completion receipt: one upload entrypoint and one projection definition remain; the complete
foundation failure/retry and built-runtime upload matrix, Gate 2 read models, Gate 4 metrics,
comparison/readback, targeted lint/format, production build, build integrity, cleanup, and independent
source review passed. The runtime source total changed from 1,009 lines in one mixed owner to 1,011
lines across two focused owners; this is a two-line structural cost with no new public path.

### Slice 2 - Finite legacy backfill retirement - completed

Owner: Backend compatibility/maintenance boundary, separately scoped after Slice 1b.

The target-specific inventory classified one hosted asset as eligible and non-conflicting. With
explicit mutation authority, the existing lifecycle produced one canonical activity/source/source
revision/activity revision, linked its one metrics row and runner-selected planned-workout match,
and transferred the retained raw-object reference exclusively to the source revision. Final readback
proved one complete projection, zero unlinked metrics, zero duplicate asset raw references, and zero
remaining eligible legacy candidates.

The obsolete backfill module and its mutation proof wiring were deleted after runtime and source
reachability reached zero. The foundation validator retains only two bounded safeguards: retirement
fails if any parsed asset lacks canonical linkage, and ordinary intake must leave an unrelated
legacy-shaped local QA row untouched. The product-reachable raw-removal fallback remains deliberately
separate and was not changed by this slice.

### Slice 3 - Measure snapshot reconciliation; materialize only if admitted - completed

Owner: Backend runner-activity read-model/materialization boundary, separately scoped.

First measure representative current-read query count, write amplification, and latency for factual
and Gate 4 fingerprint reconciliation. Retain the current implementation if it is not a demonstrated
bottleneck. If materialization is admitted, preserve immutable historical readback, separate
factual/metric freshness, and truthful `current`, `updating`, or metric-specific unavailable states
without stale values. Replace coarse user-wide invalidation only with a complete dependency map and
measured before/after cost. Any schema support uses a new append-only migration.

Completion receipt: serial owner runs plus an independent QA repeat of the canonical 30-activity
fixture produced stable operation counts. In the final owner runs, a derived-row reconciliation miss
on a warm local process used 17 reads and 9 writes with 56.10-84.53 ms local latency;
reconciliation hits used 16 reads and zero writes with 32.15-49.50 ms latency; post-mutation hits used
16 reads and zero writes with 34.56-43.39 ms latency. The miss row delta was seven factual snapshots,
one metric snapshot, and 31 observations. A canonical immutable RPE mutation added one metric
snapshot and one observation, retained the factual snapshot identity, and never returned stale data
as current. The separate Gate 4 validator proved immutable historical readback and Gate 5
unavailability. The current implementation is retained; no runtime source, migration, cache,
materialized store, or invalidation owner was added.

### Later evidence-gated work

- Optimize History queries or indexes only from representative query plans and latency evidence.
- Consolidate fixtures or decompose files only from exact duplication/reachability maps.
- Route Frontend and repository/tooling candidates to their separate owners.
- Start Gate 5 only as its separate accepted Backend gate after persisted, immutable normalized
  sample-set revisions, privacy, reprocessing, retention, correction, deletion invalidation, and
  benchmarked storage ownership are authorized. Until then every stream metric remains unavailable.
- Provider sync remains a separate future architecture/product decision.

## Preserved Boundaries

- One canonical source/activity/revision graph and one transactional writer.
- One accepted workout evidence projection consumed by Plan vs Run.
- One profile-computation and metric-observation truth; Gate 4 is not reimplemented.
- Manual Garmin FIT/ZIP remains the only activity input; no automatic provider sync.
- Raw removal preserves normalized activity truth; activity deletion remains a separate command.
- No migration rewrite, production deletion, framework migration, microservice, new cache, external
  time-series database, or summary fallback. The bounded Slice 2 hosted data reconciliation is
  complete; future hosted mutation still requires its own explicit authority.
- Frontend performs no metric arithmetic, eligibility, invalidation, or confidence inference.
- Concurrent dirty work and the exact accepted release manifest remain untouched by this audit.

## Risks And Stop Conditions

| Risk                                                              | Control / stop condition                                                                                       |
| ----------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| Cleanup changes the accepted released baseline                    | Preserve `329f45c`; require a new bounded diff and complete slice receipt                                      |
| Projection reconciler becomes another activity writer             | It may receive immutable activity/source identities and write projection rows only                             |
| Local empty legacy inventory is mistaken for release-target proof | Require target-specific non-mutating inventory before detachment/retirement claims                             |
| Accepted raw removal or Gate 4 is reopened                        | Treat both as retained baseline unless a new failing discriminator proves a regression                         |
| Snapshot purity silently changes metric meaning                   | Preserve formula versions, immutable observations, historical readback, and separate freshness                 |
| Migration cleanup rewrites history                                | Append-only migration only; otherwise stop                                                                     |
| Gate 5 gains summary fallback or a second store by intuition      | Keep unavailable; require the separate sample-set architecture and benchmark evidence                          |
| Cross-owner work enters Backend slice                             | Stop and route Frontend, repository tooling, Product, Running Coach, provider, or release ownership separately |
| Hosted data or providers become necessary                         | Stop; obtain explicit external authority in a separate task                                                    |

## Definition Of Done

### Architecture reconciliation - completed

This planning task is complete when:

1. the single live technology stack and deployment/persistence owners are explicit;
2. accepted raw-removal and Gate 4 behavior are baseline rather than stale future phases;
3. every cleanup candidate is classified as first-slice, later-without-replacement, retained, or
   separate-owner work;
4. immutable migration, tracked generated-code, build-output, validator, and fixture rules are
   explicit;
5. source-control release integration and Slice 1 completion are recorded against exact commits;
6. each active slice has one Backend owner, bounded outcome, required proof, and stop conditions;
7. Gate 5 and provider sync remain future and unavailable;
8. architecture updates distinguish completed evidence from future gated work without claiming
   runtime acceptance.

### Implementation program - active

Each slice passes only when every required check in its own inventory passes, every omitted check
states its coverage consequence, disposable local data is cleaned through its canonical lifecycle,
and an independent owner-level review is integrated. Functional Global QA remains a distinct later
release acceptance gate and is never inferred from source, documentation, build, or implementation
proof.

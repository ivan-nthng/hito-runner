# HITO-279 Plan Authoring Tier Backend Feasibility

**Date:** 2026-08-28

**Canonical Task:** HITO-279 — Define a Transparent Runner Fitness Index

**Research owner:** BACKEND

**Decision owner:** PRODUCT

**Mode:** feasibility and formula research only

**Status:** decision-ready proposal; no product, schema, persistence, provider, or hosted change is
accepted by this document

## Decision Summary

Backend can derive a small, deterministic `PlanAuthoringTierV1` from the already frozen
`RunnerFitnessProfileSnapshotV1` before AI authoring. The safe current ceiling is
`base_supported`. The current system cannot truthfully produce `performance_provisional` or
`performance_established`, because comparable stream evidence is deliberately unavailable as
`normalized_stream_not_persisted`.

Recommendation: **implement**, after Product and Architecture accept this formula, the bounded pure
tier and baseline derivation described below. Keep the visual/numeric Fitness Index unavailable,
keep the current production engine unchanged until that separate implementation is admitted, and
hold both performance tiers until HITO-289 supplies versioned normalized comparable observations.

This recommendation follows the Running Coach separation of capability, direction, and plan
authority: plans consume the frozen facts and Plan Authoring Tier, never a visual profile or numeric
score ([coaching research, lines 12–32](../running-coach/2026-08-28-hito-transparent-runner-fitness-index-options-research.md#L12-L32)).

## 1. Current Accepted Facts And Initial-Plan Projection

### Canonical factual path

The implemented path is one-way:

`current owner-bound Activity/source/revision + Calendar Result/Evidence -> immutable
RunnerFitnessProfileSnapshotV1 -> RunnerFitnessProfileInitialPlanProjectionV1 -> structured plan
authoring input -> provider context`

No new profile, mutable baseline, or provider-owned inference is needed.

| Current owner                | Accepted facts available today                                                                                                                                                                                                                             | Missingness/provenance behavior                                                                                                                                        | Initial authoring exposure today                                                                                                                  |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| Activity fact snapshots      | Historical local date, current activity revision, timer duration, distance, elevation, normalizer version; current and previous exact rolling 28-day windows plus calendar weeks                                                                           | Metrics carry availability, complete/partial/unavailable confidence, included/missing counts and reasons; snapshots retain activity-revision and normalizer provenance | Current and previous 28-day sessions, running time, distance, elevation and longest duration/distance are projected                               |
| Activity read model          | Latest five accepted activities with local date, context, evidence state, duration, distance, whole-activity pace, average HR, elevation and session RPE; rolling 90-day weekly distribution, longest duration/distance, reported load and factual records | Updating, contradictory, unavailable and partial states are explicit; snapshot identity fingerprints profile, Calendar outcomes, Result/Evidence and Activity facts    | Latest-five **values are not projected**: only state, coverage, reasons and covered dates are sent. Rolling 90-day aggregate values are projected |
| Result/Evidence and Calendar | Due/resolved outcomes, accepted actual/completion-only/missing/updating/removed counts and session-RPE coverage                                                                                                                                            | Completion-only does not become duration, distance, pace, or HR; packet fingerprint disagreement is contradictory                                                      | Counts, coverage, reasons and current outcome summaries are projected                                                                             |
| Gate 4 formulas              | Whole-activity distance, timer duration, observed average pace, elevation and reported session-RPE load; exact-distance records when eligible                                                                                                              | Each observation has basis, evidence/source revision, formula version, coverage, exclusions and unavailable reason                                                     | Only the accepted Product/Profile projection reaches authoring; private formula rows do not                                                       |
| Comparable performance       | No accepted data                                                                                                                                                                                                                                           | Always `unavailable`, reason `normalized_stream_not_persisted`                                                                                                         | State/coverage/reason only; no comparable value or direction                                                                                      |

Exact source anchors:

- The immutable fact owner defines the two rolling 28-day windows and explicitly says volume is not
  fitness and derived coaching metrics are unavailable
  ([fact-snapshots.ts, lines 86–160](../../../src/lib/runner-activity/fact-snapshots.ts#L86-L160)).
- Only owner-bound, accepted recorded runs with a current revision enter those windows
  ([fact-snapshots.ts, lines 163–223](../../../src/lib/runner-activity/fact-snapshots.ts#L163-L223));
  every aggregate keeps inclusion/missingness evidence
  ([fact-snapshots.ts, lines 310–401](../../../src/lib/runner-activity/fact-snapshots.ts#L310-L401)).
- The frozen Profile owns identity, formula versions and four provenance fingerprints, and retains
  latest-five whole-activity facts plus rolling-90 facts
  ([product-contract.ts, lines 610–703](../../../src/lib/runner-activity/product-contract.ts#L610-L703)).
- Snapshot assembly derives explicit component states, freezes `runnerFactsRevision`, and leaves
  comparable performance unavailable
  ([read-model.ts, lines 141–229](../../../src/lib/runner-activity/read-model.ts#L141-L229),
  [255–408](../../../src/lib/runner-activity/read-model.ts#L255-L408)).
- Latest-five inspection facts come from accepted Activity history and completion-only Calendar facts
  remain null observations
  ([read-model.ts, lines 426–490](../../../src/lib/runner-activity/read-model.ts#L426-L490)).
- Rolling 90-day values are assembled from the provider-neutral factual sequence, without inventing
  missing duration or distance
  ([read-model.ts, lines 492–583](../../../src/lib/runner-activity/read-model.ts#L492-L583)).
- Whole-activity observations expose their factual basis; session-RPE is only
  `duration × runner-reported RPE`, with explicit invalidation and missingness
  ([metric-formulas.ts, lines 480–615](../../../src/lib/runner-activity/metric-formulas.ts#L480-L615),
  [646–731](../../../src/lib/runner-activity/metric-formulas.ts#L646-L731)).
- The initial projection currently sends aggregate facts, coverage and reasons but reduces
  latest-five to covered dates
  ([product-contract.ts, lines 761–825](../../../src/lib/runner-activity/product-contract.ts#L761-L825),
  [827–913](../../../src/lib/runner-activity/product-contract.ts#L827-L913)).
- The structured schema validates that exact projection and the existing factual-versus-constraint
  admission
  ([structured-plan-authoring-schema.ts, lines 111–216](../../../src/lib/structured-plan-authoring-schema.ts#L111-L216),
  [235–295](../../../src/lib/structured-plan-authoring-schema.ts#L235-L295)).
- Backend creates the immutable snapshot before provider dispatch and immediately projects it through
  the existing owner
  ([running-plan-engine-actions.ts, lines 851–929](../../../src/lib/running-plan-engine-actions.ts#L851-L929),
  [931–987](../../../src/lib/running-plan-engine-actions.ts#L931-L987)).
- Current authoring resolves only `authoring_ready_factual` versus
  `authoring_ready_constraint_only`, then sends the accepted projection with raw runner facts
  ([ai-generated-running-plan.ts, lines 592–744](../../../src/lib/ai-generated-running-plan.ts#L592-L744)).
- The provider instruction already prohibits strengthening partial facts or inferring unavailable
  comparable performance
  ([ai-authored-plan-first-provider-contract.ts, lines 636–646](../../../src/lib/ai-authored-plan-first-provider-contract.ts#L636-L646));
  its context carries the raw runner facts and exact initial Profile
  ([ai-authored-plan-first-provider-contract.ts, lines 741–835](../../../src/lib/ai-authored-plan-first-provider-contract.ts#L741-L835)).

### Important current limitation

`RunnerFitnessProfileSnapshotV1.components.latestFive` contains useful inspection values, but
`RunnerFitnessProfileInitialPlanProjectionV1.components.latestFive` intentionally contains only
covered dates. Therefore a future tier must be derived server-side from the frozen Snapshot **before**
projection, and its bounded result must be added beside the unchanged projection. AI must still
receive the projection's raw aggregate facts, coverage and reasons; the tier must not replace them.

## 2. Proposed Pure Contract

```ts
type PlanAuthoringTierV1 = {
  version: "plan_authoring_tier_v1";
  tier:
    | "constraint_only"
    | "base_supported"
    | "performance_provisional"
    | "performance_established";
  snapshot: {
    version: "runner_fitness_profile_snapshot_v1";
    snapshotId: string;
    runnerFactsRevision: string;
    cutoffDate: string;
    timeZone: string;
    formulaVersions: RunnerFitnessProfileSnapshotV1["formulaVersions"];
    provenanceFingerprints: RunnerFitnessProfileSnapshotV1["provenance"];
  };
  coverage: {
    current28EligibleRuns: number;
    durationIncluded: number;
    durationMissing: number;
    distanceIncluded: number;
    distanceMissing: number;
    recentInspectionCount: number;
    comparableCurrentCount: number;
    comparableReferenceCount: number;
  };
  baseline: PlanAuthoringBaselineV1;
  reasonCodes: string[];
};

type PlanAuthoringBaselineV1 = {
  supportedStartingFrequency: {
    lowerRunsPerWeek: null;
    upperRunsPerWeek: number | null;
    observedRunsPerWeek: number | null;
  };
  startingVolume: {
    lowerMinutesPerWeek: null;
    upperMinutesPerWeek: number | null;
    lowerKilometersPerWeek: null;
    upperKilometersPerWeek: number | null;
  };
  initialLongRun: {
    lowerMinutes: null;
    upperMinutes: number | null;
    lowerKilometers: null;
    upperKilometers: number | null;
  };
  performancePrecision: "unavailable" | "provisional" | "established";
};
```

The function is pure:

```text
derivePlanAuthoringTierV1(
  snapshot: RunnerFitnessProfileSnapshotV1,
  declaredMaxRunningDaysPerWeek: 1..7 | null
) -> deeply frozen PlanAuthoringTierV1
```

It performs no read, write, provider call, user comparison, or current-time lookup. `cutoffDate` and
the component windows are its only time authority. The output fingerprint belongs in the existing
material authoring request identity so any fact, formula, coverage, reason or tier change invalidates
reuse in the normal way.

## 3. Exact V1 Decision Procedure

### Step 0 — preserve existing admission

The tier never repairs or overrides the current authoring admission. Missing identity facts or HR
acceptance, an availability conflict, an updating component, or contradictory Calendar/Result
packets still produce the existing follow-up/no-prescription result before provider dispatch. If a
tier is produced for diagnostics in that state, it is `constraint_only` with the original blocking
reason.

### Step 1 — establish current whole-activity evidence

Let:

```text
N = recent28Day.current.facts.sessions.value ?? 0
D = recent28Day.current.facts.runningTime
K = recent28Day.current.facts.distance
F = min(5, accepted latestFive items whose localDate is inside the current 28-day window)
```

All referenced snapshots must be `current`, use `historical_local_date`, end at `cutoffDate`, and
carry the formula versions frozen in the Profile. A run contributes to `F` only when
`actualEvidenceState=accepted_actual`; completion-only rows never supply duration or distance.

Current V1 staleness is window-owned rather than wall-clock inferred:

- `N=0` means there is no accepted activity in the exact current 28-day window and the baseline is
  stale/unavailable;
- rolling-90 history alone cannot upgrade the tier;
- an activity outside the current 28-day window may inform the rolling-90 observed ceiling but not
  current frequency or volume;
- any corrected Activity revision changes the Profile fingerprint/revision and therefore creates a
  different tier result.

### Step 2 — decide `base_supported`

`base_supported` requires all of the following:

1. `N >= 3` in the current exact 28-day window;
2. recent-28 and rolling-90 components are neither `updating` nor `contradictory`;
3. `D.availability=available`, `D.confidence=complete`,
   `D.includedActivityCount=N`, and `D.missingActivityCount=0`;
4. at least three current-window latest-five items are accepted actuals with non-null positive
   duration;
5. rolling-90 accepted activity count is at least `N` and its longest duration is present;
6. all Profile identity/version/provenance fields validate.

Failure of any condition returns `constraint_only` with exact sorted reason codes. Distance, HR and
RPE are **not** prerequisites for `base_supported`:

- partial/missing distance produces a time-only baseline and
  `distance_baseline_unavailable`;
- missing HR produces `performance_precision_unavailable_no_comparable_stream`; it does not reduce
  truthful time capacity and cannot authorize pace/HR precision;
- missing RPE produces only an RPE coverage reason and never changes the tier upward or downward.

This deliberately treats three current complete-duration activities as the smallest base claim,
not as established fitness. It says only that Backend has enough repeated current whole-activity
duration facts to set conservative ceilings.

### Step 3 — calculate conservative baseline ceilings

All arithmetic uses decimal facts from the frozen Snapshot. `round1` means deterministic half-away-
from-zero rounding to one decimal place. `median` sorts ascending and averages the two middle values
for an even count.

```text
observedRunsPerWeek = round1(N / 4)

observedFrequencyCeiling = max(1, ceil(N / 4))
upperRunsPerWeek = min(
  observedFrequencyCeiling,
  declaredMaxRunningDaysPerWeek ?? 7
)

recentDurations = positive durationMin values from F
typicalRecentDuration = median(recentDurations)
observedWeeklyDuration = D.value / 4
upperMinutesPerWeek = round1(min(
  observedWeeklyDuration,
  typicalRecentDuration * upperRunsPerWeek
))

secondLargestRecentDuration = second-largest(recentDurations)
upperLongRunMinutes = round1(min(
  rolling90Day.longestDuration.minutes,
  secondLargestRecentDuration
))
```

There is no evidence-backed lower bound, so every lower bound is `null`. The plan may begin below a
ceiling. It may not treat the ceiling as a target or minimum.

Distance ceilings are calculated only when `K` is complete for all `N` activities and every item in
`F` has positive distance:

```text
observedWeeklyDistance = K.value / 4
typicalRecentDistance = median(recentDistances)
upperKilometersPerWeek = round1(min(
  observedWeeklyDistance,
  typicalRecentDistance * upperRunsPerWeek
))

upperLongRunKilometers = round1(min(
  rolling90Day.longestDistance.kilometers,
  second-largest(recentDistances)
))
```

Otherwise both distance ceilings are `null`. Time and distance are never converted into one
another. The second-largest rule prevents one longest outlier among the inspected current runs from
becoming the opening long-run ceiling; it does not classify or delete the outlier.

### Step 4 — performance tiers

With the current `RunnerFitnessProfileSnapshotV1`, both performance tiers are unreachable:

```text
comparablePerformance.state = unavailable
comparablePerformance.reasonCodes includes normalized_stream_not_persisted
=> maximum tier = base_supported
=> performancePrecision = unavailable
```

After HITO-289 and a separately accepted comparable-performance contract, the same tier owner may
consume already-classified comparable cohorts; it must not detect streams, contexts or outliers
itself:

- `performance_provisional`: one exact context has **3–5 eligible observations in both** the current
  and immediately preceding reference cohort after formula-owned exclusions;
- `performance_established`: one exact context has **6+ eligible observations in both** cohorts;
- each cohort must identify its exact window, observation/activity revisions, stream/formula
  versions, coverage, exclusions and reasons;
- a one-outlier exclusion counts only if the comparable formula recorded it; eligibility thresholds
  apply after exclusion;
- mixed contexts are never pooled. If no one context independently meets the threshold, retain
  `base_supported` and reason `mixed_contexts_no_comparable_cohort`;
- missing HR or stream coverage keeps performance precision unavailable. Whole-activity average HR
  and pace must not substitute for normalized comparable segments.

The HITO-289 discovery record confirms that detailed samples are currently parsed transiently and
discarded, while the required future authority is a versioned provider-neutral sample/event layer
([HITO-289 discovery](2026-08-28-hito-full-fidelity-runner-activity-retention-and-reprocessing-discovery.md)).

## 4. Truth Table For Sparse And Mixed Evidence

`Runs` below means accepted current-window activities after ownership/revision/quality gates.

| Current runs | Complete duration | Complete distance | Current result         | Reason and permitted baseline                                                                                       |
| -----------: | ----------------- | ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------- |
|            0 | n/a               | n/a               | `constraint_only`      | `no_current_28_day_activity`; no frequency, volume, long-run or performance baseline                                |
|            1 | yes               | any               | `constraint_only`      | `insufficient_repeated_current_duration_evidence`; raw fact still reaches AI with coverage, but supplies no ceiling |
|            2 | yes               | any               | `constraint_only`      | same reason; two runs are not a supported training base                                                             |
|            3 | yes               | yes               | `base_supported`       | conservative frequency/time/distance/long-run upper bounds; performance unavailable                                 |
|            3 | yes               | no/partial        | `base_supported`       | time-only upper bounds; distance null; performance unavailable                                                      |
|            3 | no/partial        | any               | `constraint_only`      | `current_duration_coverage_incomplete`; partial duration is not silently summed into a complete capacity baseline   |
|            4 | yes               | yes               | `base_supported`       | same arithmetic; never called established                                                                           |
|            4 | yes               | no/partial        | `base_supported`       | time-only baseline                                                                                                  |
|            5 | yes               | yes               | `base_supported`       | latest-five covers the full current sample; one extreme longest run is capped by the second-largest rule            |
|            5 | yes               | any, HR absent    | `base_supported`       | HR absence cannot erase duration capacity or create performance precision                                           |
|           6+ | yes               | yes               | `base_supported` today | six total current runs are **not** six observations in each comparable current/reference cohort                     |
|           6+ | yes               | no/partial        | `base_supported` today | time-only; no distance or performance inference                                                                     |
|           6+ | no/partial        | any               | `constraint_only`      | duration incompleteness remains fail-closed regardless of count                                                     |

Additional cases:

- **One duration/distance outlier:** keep the Activity and aggregate provenance unchanged. Median
  session and second-largest long-run caps prevent one maximum from setting the opening plan. The
  outlier never upgrades performance.
- **Mixed contexts:** whole-activity duration may support base capacity because capacity is not a
  performance comparison. Easy, race, hill and interval contexts are never pooled for performance.
- **No HR:** base duration/distance behavior is unchanged; executable HR/pace precision remains
  unavailable unless separately supplied by the accepted benchmark/HR authorities.
- **Only completion facts:** these remain null actual metrics and cannot satisfy duration coverage.
- **Old rolling-90 history but zero current-28 runs:** `constraint_only`; historical longest values
  cannot repair a stale current base.
- **Partial elapsed fallback:** current fact snapshots require timer duration; an elapsed-duration
  Gate 4 observation is partial load context, not a complete V1 starting-volume fact.
- **RPE present or absent:** session-RPE may describe reported load and manageability, but it is not
  objective fitness truth, does not vote on tier, and never increases a ceiling. This preserves the
  coaching boundary that volume/load are context rather than performance
  ([coaching research, lines 65–93](../running-coach/2026-08-28-hito-transparent-runner-fitness-index-options-research.md#L65-L93)).

## 5. Deterministic Pre-AI Plan Effects

The tier is authority metadata, not a recommendation. Backend would enforce these effects before
provider dispatch and again during compiler/admission review:

| Effect                | `constraint_only`                                                                      | `base_supported`                                                                                                                                               | Future performance tiers                                                                                                                  |
| --------------------- | -------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Starting frequency    | Declared availability only; no observed claim                                          | Declared ceiling further capped by `upperRunsPerWeek`; never treated as an exact count                                                                         | Same base cap unless a later Product rule explicitly changes it                                                                           |
| Starting volume       | No observed lower/upper baseline; retain current conservative constraint-only doctrine | Explicit timed weekly work must be at or below `upperMinutesPerWeek`; distance-based weekly work is admitted only when its independent distance ceiling exists | Same base safety; performance evidence cannot silently raise capacity                                                                     |
| Initial long run      | Current constraint-only build rules only                                               | Timed long run at or below `upperLongRunMinutes`; distance-based long run only when `upperLongRunKilometers` exists                                            | Same capacity ceiling; any later increase remains reviewed progression                                                                    |
| Performance precision | Unavailable; effort/time by default                                                    | Unavailable; whole-activity pace/average HR are inspection facts only                                                                                          | Provisional may explain but not set executable pace; established may admit separately authorized context-compatible performance precision |

Enforcement details:

- Count only non-Rest runnable contacts for frequency.
- Sum only explicitly timed runnable minutes for the time ceiling. Do not convert distance to time.
- Sum only explicit runnable distance for the distance ceiling. Do not convert time to distance.
- A plan that mixes an unbounded unit into week one fails review unless the other unit's baseline is
  independently available.
- Existing goal, limitation, benchmark, accepted HR, target/date, workout anatomy, progression,
  cutback and Review/Confirm rules remain stronger and unchanged.
- Performance tier never changes Calendar directly. It only bounds a new reviewed source candidate.

These effects implement the coaching recommendation to use actual current distribution, raw 28-day
volume and observed 90-day long-run evidence while keeping pace/HR under separate authority
([coaching research, lines 302–315](../running-coach/2026-08-28-hito-transparent-runner-fitness-index-options-research.md#L302-L315)).

## 6. Current Versus Proposed Experiment

| Boundary                  | Current production baseline                                                                    | Proposed bounded experiment                                                                    |
| ------------------------- | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Profile owner             | `RunnerFitnessProfileSnapshotV1`                                                               | unchanged                                                                                      |
| Initial projection        | `RunnerFitnessProfileInitialPlanProjectionV1`                                                  | unchanged and still sent in full                                                               |
| Admission vocabulary      | factual versus constraint-only                                                                 | existing admission remains; tier refines permitted evidence authority                          |
| Sparse facts              | factual admission can expose partial aggregates; provider is instructed not to strengthen them | deterministic 0–2/partial-duration fail-closed tier and reason codes                           |
| Frequency/volume/long-run | generic provider/contract safety; no formula-derived starting cap                              | versioned Backend ceilings from current whole-activity facts                                   |
| Performance               | explicitly unavailable                                                                         | still unavailable until HITO-289; no score or average-HR shortcut                              |
| AI context                | raw runner facts, Profile projection, coverage/reasons                                         | same facts plus immutable tier, exact arithmetic outputs, coverage/reasons and formula version |
| Persistence               | existing Profile/source/candidate lineage                                                      | no new table/store/writer; tier is derived request input/provenance                            |

The production engine remains the baseline until a separately admitted implementation and QA edge
proves this experiment. The numeric Fitness Index remains unavailable and cannot control authoring.

## 7. Minimal Future Implementation Surface

If accepted, the smallest finite implementation is:

1. one pure server-owned module, for example
   `src/lib/plan-creation-engine/plan-authoring-tier.ts`, containing only the versioned types,
   arithmetic and reason codes;
2. derive the tier from the frozen Snapshot inside the existing
   `getInitialPlanAuthoringFactsForUser` path before the current projection;
3. add strict `planAuthoringTier` and `planAuthoringBaseline` fields to the existing structured
   authoring schema/request fingerprint; keep `initialPlanProfile` unchanged;
4. expose those fields through the existing provider context and require AI to repeat no hidden
   calculation;
5. extend the existing generated-plan validator/compiler to enforce opening frequency, same-unit
   weekly-volume and long-run ceilings;
6. add focused deterministic validator fixtures; no migration, generated database type, hosted
   mutation, second route, Profile version, UI state or Calendar writer.

No implementation should place the result in a runner-facing Index field. A later Product/UI task
may decide how to explain tier reasons without changing their authority.

## 8. Deterministic Fixture Inventory

A future implementation must include at least these pure fixtures, all with frozen IDs, cutoff,
formula versions, component states, coverage, reason codes and expected exact output:

1. zero current runs, empty rolling 90;
2. one complete current run;
3. two complete current runs;
4. three complete duration+distance runs;
5. three runs with one missing duration;
6. three runs with one missing distance;
7. four complete runs;
8. five complete runs with one extreme duration/distance outlier;
9. five complete runs with no HR and no RPE;
10. six complete current runs but no normalized stream;
11. six total observations split across mixed performance contexts;
12. future 3+3 same-context current/reference eligible observations -> provisional;
13. future 6+6 same-context eligible observations -> established;
14. future 6+6 before one formula-owned exclusion, leaving 5+6 -> provisional;
15. completion-only rows with no actual duration/distance;
16. rolling-90 facts present but zero current-28 runs;
17. recent or rolling component `updating`;
18. contradictory Calendar/Result fingerprint;
19. corrected Activity revision changes `runnerFactsRevision` and output provenance;
20. declared running-day ceiling below the observed ceiling;
21. provider output exactly at and above each same-unit cap;
22. distance prescription when distance baseline is unavailable;
23. unknown formula/Profile version fail-closed;
24. foreign runner snapshot rejected by the existing owner-bound caller.

## 9. Risks, Rollback, And Deletion Boundary

### Risks

- Three clustered runs may still overstate durable habit; the output must say `base_supported`, not
  established fitness or readiness.
- Latest-five inspection limits robust caps when the current window contains more than five runs;
  the result must expose `recentInspectionCount` and never imply it inspected all `N` runs.
- Current-window averages include zero-run weeks and are intentionally conservative.
- Missing duration forces constraint-only even when distance exists; this avoids an unaccepted
  time-distance conversion but may under-use treadmill/distance-only history.
- One-outlier protection is bounded; two unusual runs can still affect the median/second-largest
  caps. They remain visible in exact facts and Review.
- A formula-version or Activity correction changes request identity. Retained-response reuse must
  remain exact and fail closed.
- Naming the tier in UI could be mistaken for a runner grade. It should remain Backend authority
  metadata unless Product accepts explanatory copy.

### Rollback/deletion

Rollback is source-only: remove the pure derivation, structured fields, provider projection and
compiler gates, then fall back to the current factual/constraint-only admission. There is no row,
migration, backfill, alternate Profile, Calendar mutation or hosted cleanup. Historical provider
responses/candidates keep their original versioned request provenance; they are never rewritten.

The performance-tier branch is independently deletable/disabled while
`normalized_stream_not_persisted` remains true. HITO-289 owns any future sample persistence and
reprocessing decision; this Task must not pre-empt it.

## 10. Recommendation And Omissions

**Recommendation: implement**, but only as a separately admitted Backend experiment after Product
and Architecture accept:

- the three-current-run complete-duration floor for `base_supported`;
- the exact conservative ceilings and null lower bounds;
- the current hard ceiling of `base_supported`;
- the future requirement for 3–5 versus 6+ eligible observations in **each** same-context cohort;
- the rule that RPE/load never establishes objective fitness or increases plan precision.

Keep the numeric Fitness Index unavailable. Keep visual Capability Profile and Fitness Direction
outside this Backend authoring contract. Keep the existing Runner Fitness Profile constitution,
Snapshot/projection owners, provider route, source/candidate persistence and Calendar writer
unchanged.

This research did not inspect personal data, Notion secrets, provider prompts/responses, hosted
Supabase rows, browser state or production runtime. It did not run a provider, mutate product source,
create a migration, validate persistence, stage, commit, push or deploy. Architecture acceptance,
implementation, independent QA and release remain separate future edges.

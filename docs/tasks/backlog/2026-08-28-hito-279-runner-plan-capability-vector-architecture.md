# HITO-279 — Runner Plan Capability Vector Architecture

- Status: released on `main@1382d3cf27997f9705799d7c1b782afc657a6fe1`; Product acceptance pending
- Owner: PRODUCT
- Released outcome: one immutable, versioned capability vector for initial plan authoring plus the
  provider-free C0 starter fallback recorded below. The rejected divide-by-four proposal and the
  expanded C0 provider/compiler experiment are not current authority.
- Future boundary: Phase B remains blocked on HITO-289 and is not implemented by HITO-279.
- Evidence: [Running Coach decision](../running-coach/2026-08-28-hito-transparent-runner-fitness-index-options-research.md),
  [Backend feasibility](2026-08-28-hito-279-plan-authoring-tier-backend-feasibility.md),
  [HITO-289 retention discovery](2026-08-28-hito-full-fidelity-runner-activity-retention-and-reprocessing-discovery.md),
  [current system](../../current-system.md)

## Decision

The plan engine consumes exactly one `RunnerPlanCapabilityVectorV1`. It is a pure, immutable,
purpose-limited derivation of the existing `RunnerFitnessProfileSnapshotV1` and its already-owned
revision facts. It is not a runner-facing score, mutable profile row, plan container, second factual
store or parallel calculator.

The vector replaces both `initialPlanProfile` and `initialPlanAdmission` in the structured initial
authoring request. It does not sit beside them. This explicitly supersedes the Backend proposal to
derive a `PlanAuthoringTierV1` from `current28 / 4`: no rolling total is divided, zero-filled or
treated as an average week.

Phase A uses exact accepted summary facts already available. Phase B adds exact-distance segments and
controlled comparable heart-rate observations only after HITO-289 persists and reprocesses the
required provider-neutral samples. No summary fallback bridges that boundary.

## Existing owners and direction

| Truth or operation                                 | Sole current owner                                                                                                                                                                                                              | HITO-279 disposition                                                                                                                          |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted Activity, source and revision facts       | [`runner-activity/fact-snapshots.ts`](../../../src/lib/runner-activity/fact-snapshots.ts) and the Runner Activity read model                                                                                                    | Retain; expose the exact revision identities needed to build one vector fingerprint without a second query owner.                             |
| Immutable public Runner Fitness Profile            | [`runner-activity/product-contract.ts`](../../../src/lib/runner-activity/product-contract.ts) assembled by [`runner-activity/read-model.ts`](../../../src/lib/runner-activity/read-model.ts)                                    | Retain as the sole factual snapshot. Add one purpose-limited plan projection; do not add another snapshot or store.                           |
| Calendar outcomes and Result/Evidence facts        | Existing snapshot inputs described in [current system](../../current-system.md)                                                                                                                                                 | Retain factual direction into the snapshot; never let plan authoring repair or write them.                                                    |
| Initial authoring orchestration                    | [`running-plan-engine-actions.ts`](../../../src/lib/running-plan-engine-actions.ts)                                                                                                                                             | Freeze one vector at preview, retain it through provider response, review and confirm, and reject changed fingerprints.                       |
| Structured provider input                          | [`structured-plan-authoring-schema.ts`](../../../src/lib/structured-plan-authoring-schema.ts) and [`ai-authored-plan-first-provider-contract.ts`](../../../src/lib/ai-authored-plan-first-provider-contract.ts)                 | Replace `initialPlanProfile` plus `initialPlanAdmission` with the vector. The AI sees frozen facts and allowed bounds, not raw Activity rows. |
| Deterministic acceptance                           | [`ai-authored-plan-first-compiler.ts`](../../../src/lib/ai-authored-plan-first-compiler.ts)                                                                                                                                     | Enforce opening demand, contact, spacing, quality-density and evidence-authority rules independently of provider prose.                       |
| Review, retained-response lineage and confirmation | [`running-plan-engine-review.ts`](../../../src/lib/running-plan-engine-review.ts), [`ai-plan-generation-response-persistence.ts`](../../../src/lib/ai-plan-generation-response-persistence.ts) and current confirmation actions | Retain unchanged ownership. The vector and fingerprint become part of the sealed frozen input.                                                |
| Continuation decision                              | Current `RunnerFitnessProfileContinuationProjectionV1` consumer                                                                                                                                                                 | Retain. Initial plan authoring does not replace or alias the continuation contract.                                                           |

Final dependency direction is:

```text
Identity constraints + Calendar outcomes + Result/Evidence + Runner Activity revisions
  -> RunnerFitnessProfileSnapshotV1
  -> pure RunnerPlanCapabilityVectorV1
  -> structured initial authoring request
  -> retained provider response -> strict compiler -> sealed review/confirm
  -> runner-owned Calendar workouts
```

No dependency points back from AI, compiler, Review or Calendar into Activity capture or factual
aggregation. Type-only imports follow the same direction. Frontend receives the existing safe review
projection and never computes the vector, an opening anchor or a segment.

## Public contract

The following notation is normative TypeScript-like contract text, not an instruction to create a
new persistence model.

```ts
type CapabilityState =
  | "unavailable"
  | "observed_sparse"
  | "observed_pattern"
  | "repeated_support"
  | "historical_capacity_only"
  | "updating"
  | "contradictory";

type ExactMetric<Unit extends string> = {
  unit: Unit;
  value: number | null;
  authority: "exact" | "unavailable";
  includedActivityCount: number;
  missingActivityCount: number;
  reasonCodes: CapabilityReasonCode[];
};

type SevenDayCapabilitySliceV1 = {
  sliceIndex: 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11;
  startDate: string;
  endDate: string;
  completeSevenDays: true;
  contactCount: number;
  duration: ExactMetric<"seconds">;
  distance: ExactMetric<"metres">;
  eligibleEasyLongContacts: readonly {
    activityId: string;
    localDate: string;
    classification: "easy" | "long";
    durationSeconds: number | null;
    distanceMetres: number | null;
  }[];
  activityRevisionFingerprint: string;
};

type OpeningDemandAnchorV1 = {
  basis: "distance_metres" | "duration_seconds" | "unavailable";
  recent7DistanceMetres: number | null;
  recent7DurationSeconds: number | null;
  enforcedOpeningDemand: number | null;
  longRunDemand: number | null;
  reasonCodes: CapabilityReasonCode[];
};

type AdditionalEasyContactGateV1 = {
  currentContacts: number;
  proposedContacts: number;
  decision:
    | "not_applicable_reentry"
    | "not_admitted"
    | "redistribute_same_demand"
    | "supported_growth";
  supportSliceIndex: number | null;
  maximumOpeningDemand: number | null;
  reasonCodes: CapabilityReasonCode[];
};

type RunnerPlanCapabilityVectorV1 = {
  version: "runner_plan_capability_vector_v1";
  formulaVersion: "runner_plan_capability_formula_v1";
  vectorId: string;
  snapshot: {
    version: "runner_fitness_profile_snapshot_v1";
    snapshotId: string;
    runnerFactsRevision: string;
  };
  cutoff: {
    date: string;
    timeZone: string;
    timezoneBasis: "historical_local_date";
  };
  sourceFingerprint: string;
  sevenDaySlices: readonly SevenDayCapabilitySliceV1[];
  windows: {
    recent7: { sliceIndex: 0; state: CapabilityState };
    base28: { sliceIndexes: readonly [0, 1, 2, 3]; state: CapabilityState };
    capacity90: {
      completeSliceIndexes: readonly [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
      leadingPartialBoundary: {
        startDate: string;
        endDate: string;
        completeSevenDays: false;
        contextOnly: true;
      };
      state: CapabilityState;
    };
  };
  performanceEvidence: PerformanceEvidenceV1;
  evidenceConfidence: {
    recent7: CapabilityState;
    base28: CapabilityState;
    capacity90: CapabilityState;
    performanceEvidence: CapabilityState;
  };
  openingAnchor: OpeningDemandAnchorV1;
  additionalEasyContact: AdditionalEasyContactGateV1;
  constraints: {
    maximumRunningDaysPerWeek: number | null;
    fixedRestDays: readonly string[];
    preferredLongRunDay: string | null;
    currentRunningLimitation: "no" | "yes" | "unsure" | "unavailable";
    outcomeAdmission: "permitted" | "not_permitted" | "unavailable";
  };
  reasonCodes: readonly CapabilityReasonCode[];
};
```

`sevenDaySlices` is the only serialized owner of weekly facts inside the vector. `Recent7`, `Base28`
and `Capacity90` reference those slices; they do not copy or recompute them.

### Cutoff, windows and identity

- Resolve one IANA timezone before assembly. `cutoff.date` is the completed factual local date in
  that timezone. Every accepted Activity stays on its persisted historical local date; a later
  timezone change does not move history.
- Slice `S0` is `cutoff−6 … cutoff`; `S1` is `cutoff−13 … cutoff−7`; `S2` is
  `cutoff−20 … cutoff−14`; `S3` is `cutoff−27 … cutoff−21`. Base28 is exactly `S0…S3`.
- Capacity90 is `cutoff−89 … cutoff`. Its complete slices are `S0…S11`; the leading six-day boundary
  is `cutoff−89 … cutoff−84`. The boundary is labelled context and never proves recurrence.
- Empty slices are real zero-contact slices only when the underlying source window is complete and
  stable. Missing, updating or contradictory data never becomes zero.
- `sourceFingerprint` hashes the sorted Activity/source revision identities, Calendar outcome
  revisions, Result/Evidence revisions, constraint revision, cutoff, timezone and formula versions.
  `vectorId` is SHA-256 of canonical JSON containing the version, source fingerprint and exact vector
  facts. Observation time is audit metadata, not identity-changing noise.
- Provider retry, Review restore and Confirm compare the frozen fingerprint with a fresh owner read.
  A mismatch is `capability_source_stale`; no client merge or provider retry may repair it.

### Evidence confidence and reason codes

Confidence is component-specific. It changes the authority of a fact, never the arithmetic of a
valid fact. One or two accepted Recent7 contacts remain exact one- or two-contact sums and use
`observed_sparse`. Three or more contacts do not automatically imply recurrence; `observed_pattern`
or `repeated_support` requires the explicit slice evidence below.

The finite fail-closed reasons are:

```text
recent7_no_contacts
recent7_duration_incomplete
recent7_distance_incomplete
recent7_classification_unavailable
base28_slice_incomplete
capacity90_partial_boundary
capacity90_recurrence_unproven
performance_whole_activity_unavailable
performance_samples_unavailable
performance_segment_unavailable
source_revision_updating
source_revision_contradictory
capability_source_stale
opening_anchor_unavailable
limitation_state_unavailable
limitation_not_cleared
availability_ceiling_exceeded
fixed_rest_day_capacity_insufficient
outcome_state_unavailable
outcome_not_permitted
recovery_spacing_failed
quality_density_failed
plus_one_redistribution_only
plus_one_supported_growth
```

Multiple reasons may coexist. The structured provider request receives facts, states and reasons; it
does not receive one synthesized confidence or fitness score.
`limitation_state_unavailable` and `limitation_not_cleared` apply only to
`additionalEasyContact.decision`; neither reason changes ordinary authoring admission or provider
dispatch.

## Opening anchor and deterministic `+1` gate

### Same-unit anchor

Recent7 contact count, duration seconds and distance metres are summed exactly across valid accepted
actuals. Sparse contacts are never divided by seven. The vector carries both exact unit ledgers when
available and never converts between them.

The compiler selects one enforceable demand basis deterministically:

1. use `distance_metres` when every accepted Recent7 contact has valid distance;
2. otherwise use `duration_seconds` when every accepted Recent7 contact has valid duration;
3. otherwise use `unavailable` and the existing constraint/re-entry path.

The initial detailed week's prescribed total in the selected basis must equal the exact Recent7
anchor before any supported-growth rule. The other exact metric remains factual context, not a
converted or silently enforced estimate. Long-run demand is the largest eligible Recent7 easy/long
contact in the same selected unit; absent lossless classification, it is unavailable rather than
inferred from the weekly maximum.

### Level 0 — no Recent7 contacts

`currentContacts = 0` is `not_applicable_reentry`. The engine follows the existing constraint/re-entry
path. Base28 or Capacity90 cannot manufacture a current anchor or authorize `+1`.

### Level 1 — redistribution only

For `currentContacts > 0`, the only candidate increase is exactly `currentContacts + 1`, and the new
contact must be easy/recovery. It is admitted as `redistribute_same_demand` only when all are true:

1. the selected Recent7 anchor is complete;
2. explicit availability leaves at least the proposed contact count after fixed rest days;
3. `currentRunningLimitation`, when already available in the frozen request, is explicitly `no`;
4. current due outcomes contain no skipped, partial, unresolved, updating or contradictory state;
5. the existing deterministic recovery-spacing and quality-density validators pass;
6. no intensity or long-run contact is added, and the exact selected-unit weekly total and long-run
   demand do not increase.

The current preview request does not require the limitation and Confirm remains its existing blocking
authority. HITO-279 does not add a required UI question or block ordinary observed-baseline provider
dispatch when the value is absent. If the value is already available at preview, freeze it in the
vector; otherwise represent it as `unavailable`. For this `+1` gate only, `yes`, `unsure` and
`unavailable` return `not_admitted`. Never infer `no`, and never use runner comments as a substitute.

### Level 2 — recurrence-supported growth

`supported_growth` requires every Level 1 condition plus a prior complete `S1…S11` with exactly the
proposed contact count and complete facts in the selected unit. Choose the most recent qualifying
slice, never the historical maximum. The support slice is a ceiling, not an opening prescription:

- `maximumOpeningDemand = max(Recent7 exact demand, most-recent support-slice exact demand)`;
- the reviewed engine may progress above Recent7 only up to that ceiling and its existing
  progression/cutback rule;
- the compiler rejects output above the ceiling, added intensity/long-run contacts, failed spacing or
  failed quality density;
- the six-day Capacity90 boundary, incomplete slices and slices with another contact count never
  support growth.

This gives the engine room to improve training after an evidence-backed anchor without turning past
capacity into current demand.

## Performance evidence boundary

The canonical standard set is exactly: `1 km`, `1 mile`, `5 km`, `10 km`, `15 km`,
`Half Marathon`, `Marathon`, `50 km`, `50 mile`, `100 km`, `100 mile`. `20 km` is not part of this
contract.

### Phase A — implementable now

Use only exact accepted whole-activity records whose valid recorded distance equals a standard
distance, plus accepted official records already carrying that exact authority. Preserve activity,
source and revision provenance. Do not scale elapsed time, use summary average pace or reinterpret a
longer activity as a shorter record.

Whole-activity average heart rate and RPE never upgrade performance authority, standard-distance
records, HR comparability, intensity precision, `+1` contact admission or positive progression. RPE
is optional subjective context only. An RPE-only correction may affect existing subjective
load/manageability or continuation policy; it cannot create Phase A authoring authority.

### Phase B — blocked on HITO-289

For any accepted Activity with valid distance `>= D`, calculate its fastest contiguous exact-`D`
segment only from persisted, versioned timestamped distance/time samples. A 5.1 km Activity may then
produce a 5.0 km record, but only from its actual fastest eligible window.

The future `StandardDistanceSegmentRecordV1` belongs to the Result/Evidence-derived factual boundary,
not plan authoring:

```ts
type StandardDistanceSegmentRecordV1 = {
  version: "standard_distance_segment_record_v1";
  standardDistanceMetres: number;
  elapsedBasis: "chronological_elapsed_including_pauses";
  elapsedMilliseconds: number;
  start: { sampleIndex: number; timestamp: string; interpolatedDistanceMetres: number };
  end: { sampleIndex: number; timestamp: string; interpolatedDistanceMetres: number };
  activityId: string;
  sourceId: string;
  activityRevisionId: string;
  sourceRevisionId: string;
  sampleRevision: string;
  formulaVersion: string;
  coverage: "complete";
  timerEvidence: { basis: "timer" | "moving"; milliseconds: number } | null;
};
```

HITO-289 must first define and persist pause/timer events, monotonic distance behavior, exact-boundary
interpolation, gaps, resets, jumps, coverage, sample revisions and reprocessing. Chronological elapsed
time including pauses is the Hito record basis. Timer/moving duration is separately named evidence.
Equal elapsed results choose the earliest eligible segment and retain both boundaries. Any missing
sample authority yields `performance_segment_unavailable`; summary fields are not a fallback.

Heart rate may affect PerformanceEvidence only inside an eligible segment or a controlled comparable
aerobic observation with matched context after HITO-289 supplies that authority. Initial-plan Phase A
does not require FIT or RPE: ordinary authoring continues from its accepted exact summary facts or
existing constraint-only admission. RPE presence never unlocks PerformanceEvidence or changes the
authority of those facts. Continuation keeps its separate accepted evidence and subjective-load
policy; HITO-279 does not redefine it.

## AI and compiler contract

The provider receives a frozen, compact projection of the vector: exact Recent7 anchor, the twelve
non-overlapping slice facts, the context-only Capacity90 boundary, exact current whole-activity
PerformanceEvidence, component states/reasons, current constraints and the admitted `+1` result. It
does not receive raw FIT, private samples, profile rows, an opaque score or permission to select a
different baseline.

The AI owns a proposed reviewed program inside those bounds: phase development, week-to-week
progression and cutback. Deterministic server code owns:

- source fingerprint freshness and vector/schema versions;
- opening demand basis and exact initial-week anchor;
- maximum contact count and the only permitted `+1` classification;
- same-demand redistribution or supported-growth ceiling;
- no added intensity/long-run contact through `+1`;
- fixed-rest, recovery-spacing, quality-density and limitation handling inside the `+1` gate only;
- standard-distance authority and absence of Phase B records before HITO-289;
- strict compilation, retained-response lineage, sealed Review and explicit Confirm.

A provider output that violates a bound is rejected; it is not clamped or repaired by Frontend.

## Migration and deletion order

1. **BACKEND — factual vector and pure proof.** In the existing Runner Activity read-model owner,
   expose the revision-complete source facts needed by one pure vector builder. Add no store. Prove
   cutoff-aligned slices, exact metrics, fingerprints, Phase A records and all fail-closed states.
2. **BACKEND — authoring adoption.** Replace `initialPlanProfile` and `initialPlanAdmission` in the
   structured schema, preview builder, provider projection, retained normalized input, Review/Confirm
   freshness comparison and dev/QA fixture with `runnerCapability`. Freeze the optional current
   limitation only when the existing request already provides it; otherwise record `unavailable` and
   disable only `+1`. Do not add a required question, alter ordinary authoring admission, or retain
   aliases or dual inputs.
3. **BACKEND — compiler enforcement.** Add deterministic anchor and `+1` validation before authoring
   can be accepted. Provider wording may describe the bounds but is never their authority.
4. **BACKEND — consumer removal.** Migrate direct scripts/proofs and delete
   `RunnerFitnessProfileInitialPlanProjectionV1`, its projector/schema, and the standalone admission
   field only after `rg` proves zero production, fixture and proof consumers. Keep Progress,
   continuation and one-off projections unchanged.
5. **QA — focused independent acceptance.** Replay deterministic fixtures first, then one admitted
   provider/retained-response/review-confirm journey only under separate paid-provider and release
   authority. Private ZIP fixtures remain future QA evidence and are not read by this decision.

No Frontend change is required. HITO-279 does not move the existing Confirm question into preview or
create a new required interaction. Calendar behavior does not change.

## Required fixture matrix

| Fixture                                                  | Exact expected result                                                                                                                   |
| -------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| Recent7 = 0                                              | Exact zero contacts; constraint/re-entry; no anchor, recurrence or `+1`.                                                                |
| Recent7 = 1                                              | One exact contact/sum; `observed_sparse`; Level 1 only when every gate passes.                                                          |
| Recent7 = 2                                              | Two exact contacts/sum; `observed_sparse`; no dilution or automatic recurrence.                                                         |
| Recent7 = 3+                                             | Exact count/sums; pattern state only from explicit slice facts; no default growth.                                                      |
| Empty complete prior slice                               | Exact zero contacts for that complete slice; not missing and not recurrence support.                                                    |
| Stale fingerprint                                        | Provider retry, Restore Review and Confirm fail `capability_source_stale`.                                                              |
| Incomplete duration, complete distance                   | Distance is the selected exact basis; duration remains unavailable.                                                                     |
| Incomplete distance, complete duration                   | Duration is the selected exact basis; distance remains unavailable.                                                                     |
| Both opening units incomplete                            | `opening_anchor_unavailable`; constraint/re-entry and no `+1`.                                                                          |
| Partial Capacity90 boundary                              | Labelled context only; never recurrence support.                                                                                        |
| Updating revision                                        | `source_revision_updating`; no provider dispatch or positive progression.                                                               |
| Contradictory revision                                   | `source_revision_contradictory`; no provider dispatch or fact repair.                                                                   |
| `+1` redistribution                                      | Proposed contacts = Recent7 + 1, extra contact easy/recovery, exact selected-unit total and long-run demand unchanged.                  |
| `+1` supported growth                                    | Most recent complete matching-contact slice selected; output above its exact-unit ceiling rejected.                                     |
| Limitation yes/unsure/unavailable                        | `+1` is `not_admitted`; ordinary observed-baseline provider dispatch remains available and existing Confirm blocking remains unchanged. |
| Skipped/partial/unresolved current outcome               | `outcome_not_permitted`; `+1` rejected without inventing a cause.                                                                       |
| Exact whole-activity 5K                                  | Phase A exact record retained with whole-activity/official authority and revision provenance.                                           |
| 5.1 km Activity -> contiguous 5K                         | Phase A unavailable; Phase B chooses actual fastest exact-5K sample window after HITO-289.                                              |
| Pause inside fastest segment                             | Chronological elapsed including pause is authoritative; moving/timer result separately labelled.                                        |
| Gap/reset/jump or failed interpolation                   | Segment unavailable; no whole-activity average or scaled fallback.                                                                      |
| Equal fastest segments                                   | Earliest eligible segment wins; exact boundaries and provenance retained.                                                               |
| HR context mismatch                                      | HR cannot affect PerformanceEvidence or positive progression; ordinary Phase A admission is unchanged.                                  |
| HR summary without eligible segment/comparable authority | HR remains unavailable for PerformanceEvidence and intensity precision; no RPE value can upgrade it.                                    |
| RPE present versus absent                                | Identical Phase A fact authority and `+1` result; RPE remains optional subjective context.                                              |
| RPE-only correction                                      | May affect existing subjective load/manageability or continuation policy only; never creates a record, admits `+1` or increases demand. |

Focused proof must cover the pure builder, schema/provider representation, compiler rejection,
retained-input fingerprint, Review restore and Confirm staleness. Browser, hosted, provider, Global QA,
release and deployment are not acceptance layers of this architecture decision.

## Rollback, stop conditions and risks

- Roll back the implementation slice by reverting the new source projection and structured-input
  replacement together. Because no schema/store is added, rollback does not rewrite runner data.
- Stop before provider dispatch if exact source revisions, cutoff timezone or the selected-unit
  anchor cannot be frozen losslessly. Missing limitation state does not stop ordinary authoring; it
  returns `not_admitted` only for `+1`.
- Stop Phase B until HITO-289 proves sample retention, revisioning, pause/timer semantics,
  interpolation and reprocessing. Do not ship a summary fallback.
- Stop deletion of the old initial-plan projection until zero direct runtime, fixture and proof
  consumers are demonstrated.
- Main residual risk is making an overconfident progression decision from complete arithmetic but
  weak recurrence/context. Component states, the most-recent matching-slice rule and compiler bounds
  keep that uncertainty explicit.

## Exact next-owner prompt after Product acceptance

```text
ROLE: BACKEND

Task: HITO-279 — Define a Transparent Runner Fitness Index
Stage: Phase A RunnerPlanCapabilityVectorV1 implementation

Implement the accepted architecture in
docs/tasks/backlog/2026-08-28-hito-279-runner-plan-capability-vector-architecture.md. Reuse the existing
RunnerFitnessProfileSnapshotV1 and Runner Activity revision owners. Build one pure, versioned
RunnerPlanCapabilityVectorV1 with cutoff-aligned S0-S11 slices, exact Recent7 same-unit anchors,
component-specific missingness, current whole-activity/official PerformanceEvidence, and the two-level
additional easy/recovery contact gate. Replace initialPlanProfile plus initialPlanAdmission throughout
the structured initial-authoring, provider, retained-response, Review/Confirm and compiler path; do not
add a second profile, store, route, compatibility alias or dual input. Do not add a required limitation
question or block ordinary observed-baseline dispatch when that optional value is absent. Freeze it only
when already available; yes, unsure or unavailable must return not_admitted for +1 only, while existing
authoring admission and Confirm blocking remain unchanged. Treat RPE as optional subjective context:
it must never unlock PerformanceEvidence, a standard-distance record, HR comparability, intensity
precision, +1 or positive progression. Enforce all opening-demand, contact, spacing, quality-density,
staleness and authority rules server-side. Keep Phase B exact-distance segments unavailable until
HITO-289; do not read private ZIP fixtures or add a summary fallback. Migrate focused fixtures/proofs
and remove the superseded initial-plan projection only after zero-consumer proof. Preserve Calendar,
Progress and continuation ownership and all unrelated dirty work. Return the same Task directly to QA
only after focused deterministic proof; provider, browser, hosted, release and deployment remain
separate acceptance layers.
```

## Architecture receipt

Architecture acceptance is complete. The rejected divide-by-four tier has been replaced by one
source-backed capability vector contract, exact deterministic `+1` gates, a no-second-truth consumer
migration and an explicit Phase A/Phase B boundary. No runtime, schema, migration, provider, fixture,
Calendar, hosted, Git, QA or release work was performed. Next owner is PRODUCT for acceptance; BACKEND
is the first implementation owner only after that acceptance.

## Superseded C0 experiment and minimal fallback — 2026-08-29

The expanded provider/compiler/lattice/terminal-rejection experiment after Phase A was rejected. It
incorrectly made the paid provider responsible for zero-history C0 dates, contact count and minutes,
then accumulated prompt, compiler and validator repair layers. Those experimental contracts are not
current architecture and must not be restored as production authority.

The accepted fallback selects the existing zero-contact `RunnerPlanCapabilityVectorV1` discriminator
before provider lookup and builds one four-week starter review locally. It uses the existing
`easy_aerobic_run`, `long_aerobic_run` and `cutback_long_run` templates; existing availability,
fixed-rest and preferred-long-day inputs; the compact accepted Beginner/`runs_a_lot` seed-minute
table; and complete accepted Z1/Z2 guidance. Missing required HR bands use the existing
incomplete-profile failure. The result enters the existing retained candidate, Saved Review/Restore,
Review, Confirm and Calendar owners with truthful provider-free provenance and no second writer.

C1–C6 retain the accepted Phase A provider/compiler behavior byte-for-byte. This fallback adds no
schema migration, route, table, public profile, compatibility path, provider-contract rewrite,
global lattice or rejected-response retention subsystem.

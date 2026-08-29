# HITO-279 — Runner Plan Capability Vector Architecture

- Status: `RunnerPlanCapabilityVectorV1` was released in `087c89e`; HITO-294 is correcting the
  authoring boundary locally on `codex/runner-plan-baseline-research`. No branch, commit, merge,
  push or deployment is authorized by this document.
- Owner: BACKEND for the current HITO-294 implementation edge; Notion owns lifecycle and progress.
- Current outcome: one immutable, versioned capability vector supplies factual structured input to
  the single AI-authored initial-plan path. Backend may losslessly normalize the provider response,
  derive metrics and expose diagnostics; it never authors or repairs workouts, weekly composition,
  minutes, dates, intensity or progression.
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

| Truth or operation                                 | Sole current owner                                                                                                                                                                                                              | HITO-279 disposition                                                                                                                                     |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Accepted Activity, source and revision facts       | [`runner-activity/fact-snapshots.ts`](../../../src/lib/runner-activity/fact-snapshots.ts) and the Runner Activity read model                                                                                                    | Retain; expose the exact revision identities needed to build one vector fingerprint without a second query owner.                                        |
| Immutable public Runner Fitness Profile            | [`runner-activity/product-contract.ts`](../../../src/lib/runner-activity/product-contract.ts) assembled by [`runner-activity/read-model.ts`](../../../src/lib/runner-activity/read-model.ts)                                    | Retain as the sole factual snapshot. Add one purpose-limited plan projection; do not add another snapshot or store.                                      |
| Calendar outcomes and Result/Evidence facts        | Existing snapshot inputs described in [current system](../../current-system.md)                                                                                                                                                 | Retain factual direction into the snapshot; never let plan authoring repair or write them.                                                               |
| Initial authoring orchestration                    | [`running-plan-engine-actions.ts`](../../../src/lib/running-plan-engine-actions.ts)                                                                                                                                             | Freeze one vector at preview, retain it through provider response, review and confirm, and reject changed fingerprints.                                  |
| Structured provider input                          | [`structured-plan-authoring-schema.ts`](../../../src/lib/structured-plan-authoring-schema.ts) and [`ai-authored-plan-first-provider-contract.ts`](../../../src/lib/ai-authored-plan-first-provider-contract.ts)                 | Replace `initialPlanProfile` plus `initialPlanAdmission` with the vector. The AI sees frozen facts and allowed bounds, not raw Activity rows.            |
| Provider response normalization and analysis       | [`ai-authored-plan-first-compiler.ts`](../../../src/lib/ai-authored-plan-first-compiler.ts)                                                                                                                                     | Parse and losslessly normalize AI output, derive factual plan metrics and expose diagnostics. It cannot author, repair or reject on coaching preference. |
| Review, retained-response lineage and confirmation | [`running-plan-engine-review.ts`](../../../src/lib/running-plan-engine-review.ts), [`ai-plan-generation-response-persistence.ts`](../../../src/lib/ai-plan-generation-response-persistence.ts) and current confirmation actions | Retain unchanged ownership. The vector and fingerprint become part of the sealed frozen input.                                                           |
| Continuation decision                              | Current `RunnerFitnessProfileContinuationProjectionV1` consumer                                                                                                                                                                 | Retain. Initial plan authoring does not replace or alias the continuation contract.                                                                      |

Final dependency direction is:

```text
Identity constraints + Calendar outcomes + Result/Evidence + Runner Activity revisions
  -> RunnerFitnessProfileSnapshotV1
  -> pure RunnerPlanCapabilityVectorV1
  -> structured initial authoring request
  -> retained provider response -> schema validation -> lossless normalization and diagnostics
  -> sealed review/confirm
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

The AI owns every authored plan choice: phases, dates, workout identities, sections, duration,
distance, intensity, recovery and progression. The compiler is allowed to:

- validate the provider JSON against the canonical response schema;
- normalize representation without changing meaning, including known aliases, ordering, explicit
  units, server-owned identities, checksums and provenance;
- mechanically project the complete AI response into `TrainingPlanV2`;
- derive totals, weekly changes, long-run share, contact density, spacing and other measurements from
  the authored result;
- emit factual conflicts and coaching diagnostics beside an otherwise reviewable plan;
- fail only when the response cannot be read, represented or materialized truthfully because it is
  malformed, incomplete, internally contradictory or asserts factual authority it does not carry.

The compiler must never insert a workout or section, select an alternate date, fill a missing
duration or target, clamp a value, choose a workout family, rewrite progression or substitute a
Backend template. A missing required value causes a retained validation result and a fresh paid AI
request; Backend never repairs the plan. Coaching quality is evaluated by Running Coach from the
unchanged AI-authored Review.

## HITO-294 finite repair and acceptance sequence

Notion HITO-294 owns the single live Delivery checklist. This section owns only the technical order
and cannot independently mark progress.

1. **Delete, do not redesign.** Remove the deterministic C0 writer and provider bypass. Simplify the
   existing compiler by deleting coaching-authority branches, default-fatal semantic lists, plan
   composition enforcement and Backend-authored repair behavior. Add no framework, second validator,
   compatibility path, schema or store.
2. **Retain the useful pipeline.** Keep `RunnerPlanCapabilityVectorV1`, strict provider JSON schema,
   lossless normalization, canonical `TrainingPlanV2` projection, retained-response lineage,
   checksums, diagnostics, Review/Restore, explicit Confirm and Calendar ownership.
3. **Prove headless paid authoring first.** Use fresh disposable `.invalid` technical runners and the
   current model, prompt, schema and compiler. Make fresh paid requests without UI, preserving each
   response, validation result, elapsed time, tokens and derived cost. Old retained responses,
   deterministic drafts and provider-free fixtures are not acceptance evidence.
4. **Prove the capability effect headlessly.** Compare the same demographics and goal first with no
   accepted history and then with the three admitted FIT activities. Both plans must be authored by
   AI; the second request must carry the changed vector, and Running Coach determines whether the
   resulting adaptation is meaningful.
5. **Review AI output only.** Running Coach reviews the fresh 10K result first, then fresh Half
   Marathon and Marathon results. A technical schema defect returns to Backend; a coaching defect
   changes the prompt/brief and triggers a new fresh paid request. Backend never edits the plan.
6. **Test the interface only after headless PASS.** QA then exercises Create plan, complete Review,
   diagnostics, Saved Review/Restore, explicit Confirm, Calendar materialization, reload and failure
   states through the product UI on the exact accepted source.
7. **Clean once and release only by explicit authority.** Batch-delete all HITO-294 disposable Auth
   identities and owner-bound data with zero-residue proof. Product then shows Ivan the exact diff and
   evidence. Branch actions, commit, merge/fast-forward, push and deployment each require Ivan's
   separate explicit approval.

## Minimal proof matrix

| Edge                        | Required evidence                                                                                                                  |
| --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Provider representation     | Current structured input contains the frozen capability vector and no raw FIT/private row data.                                    |
| Compiler boundary           | Complete AI fields survive unchanged; normalization is lossless; derived metrics do not mutate the plan.                           |
| Invalid response            | Missing or malformed required fields are retained as exact validation errors and trigger a fresh AI request, never Backend repair. |
| Fresh headless paid request | One current response becomes a complete unconfirmed Review with timing/token/cost evidence.                                        |
| History comparison          | The three-FIT runner sends a different factual vector and produces a separately authored Review.                                   |
| UI after headless PASS      | Review, Restore, Confirm and Calendar use the same accepted candidate without duplicate provider or Calendar writes.               |

## Rollback, stop conditions and risks

- The pre-research Git baseline is `0f17b71`. HITO-294 remains uncommitted until Ivan chooses whether
  to retain the capability-vector/AI-only correction or restore that baseline. Do not rewrite Git or
  create another branch as an implicit rollback.
- Stop before provider dispatch if exact source revisions, cutoff timezone or the selected-unit
  anchor cannot be frozen losslessly. Missing limitation state does not stop ordinary authoring; it
  returns `not_admitted` only for `+1`.
- Stop Phase B until HITO-289 proves sample retention, revisioning, pause/timer semantics,
  interpolation and reprocessing. Do not ship a summary fallback.
- Stop deletion of the old initial-plan projection until zero direct runtime, fixture and proof
  consumers are demonstrated.
- Stop any implementation that adds a second writer, fallback author, repair layer or new framework.
  The main residual risk is again turning deterministic analysis into Backend coaching authority.
  Derived metrics remain visible diagnostics; only AI authors and Running Coach judges quality.

## Ownership and current next action

BACKEND owns the current compiler simplification and headless paid-provider boundary on the same
HITO-294 Task. RUNNING COACH receives only complete fresh AI-authored Reviews. QA begins UI work only
after headless paid authoring and Coach review pass. Product returns to Ivan before any Git or release
action.

## Architecture receipt

HITO-279 replaced the rejected divide-by-four tier with one source-backed capability vector and an
explicit Phase A/Phase B evidence boundary. HITO-294 retains that factual result but supersedes the
former compiler-enforcement language above: the vector informs AI, while deterministic code only
normalizes, derives and reports on the AI-authored plan. The current implementation remains local and
unreleased; the live Notion checklist owns progress and BACKEND is the current owner.

## Superseded C0 experiment — 2026-08-29

The Backend-authored deterministic C0 starter experiment was rejected and removed as a second plan
writer; it is historical non-authority. Zero-history authoring uses the same AI provider, schema,
non-authoring normalizer/analyser, retained Review and explicit Confirm path as every other initial
plan.

# Hito Adaptive Blueprint And Four-Week Detail Engine

Work Item ID: `2026-08-18-hito-adaptive-blueprint-four-week-detail-engine`
Status: blocked
Type: Tracked
Priority: highest
Owner: ARCHITECT
Epic: adaptive-blueprint-planning
Parent: [Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Depends On: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Evidence From: [Hito Generated Plan Preview Preparation Failure](./2026-08-18-hito-generated-plan-preview-preparation-failure.md)

## Scope

Replace the current all-at-once detailed plan-generation product experience with one immutable,
reviewable long-horizon blueprint and a four-week detailed Calendar-workout horizon. At each
continuation boundary, Hito prepares the next detailed block from factual runner outcomes,
supported evidence, runner edits/misses, profile constraints, and the original blueprint; the
runner reviews and explicitly confirms it.

## Archive Intent

Retain through Product contract decisions, implementation slices, independent acceptance, and the
release candidate that first ships the new engine. Compact to the accepted product contract and
evidence once terminal.

## Task

After the modular-monolith transformation is terminal, define and implement the adaptive blueprint
engine as a separate serial Epic. The initial experience must show the runner the full plan shape
(phases, expected cadence and workout families, goal assumptions, and planned target date) without
pretending that undeveloped future workouts are detailed prescriptions. Materialise only the first
four weeks as runner-owned Calendar workouts.

At the end of each detailed block, prepare—not automatically apply—the next four-week preview from
durable runner facts. Preserve historical Calendar workouts, results, FIT evidence, and runner
edits. No plan container regains current-Calendar authority.

Show the entire blueprint in the Calendar through the runner's selected target date. Dates outside
the detailed horizon are blueprint projections, not persisted Calendar workouts: they may show the
planned workout family/cadence and the factual `Planned · details closer to the date` state, but
must not navigate to workout detail, accept workout mutations, receive results/evidence, or imply a
finished prescription. When a future block is prepared and explicitly confirmed, its projection is
replaced by independently owned detailed Calendar workouts.

## Accepted Product Direction

- Hito has one runner-facing plan-authoring engine: the adaptive blueprint engine. The current
  all-at-once detailed-plan product path is replaced, not retained as a parallel mode or fallback.
  Historical sources remain immutable history and reusable input; they are not a second current
  engine.
- Reuse the proven request envelope only: one server-owned Responses API request, strict structured
  output, semantic compiler, reviewed preview, private candidate retention where policy permits,
  and explicit Calendar confirmation. Replace the generated content contract with `blueprint +
four-week detailed block`; do not add Agents SDK, provider tools, raw-plan streaming, a second AI
  workflow, or an active-plan compatibility path.
- A weekday or Rest-day preference is a soft scheduling preference. It must never discard an
  otherwise structurally valid generated plan. The review surface identifies a conflict and lets the
  runner move the affected workout before confirmation or later from Calendar.
- Hard rejection remains limited to unsafe or unprocessable output: invalid contract shape,
  non-unique placement, unsupported workout anatomy, invalid endpoint, or persistence/security
  invariant failure.
- The visible target date is a plan assumption, never a performance guarantee.
- Every continuation reports the facts used, conflicts, and intended changes. Missing or
  contradictory evidence produces an honest check-in/review state, never invented adaptation.
- Future blueprint detail, plan generation, and confirmation must use the same source/provenance
  model as current runner-owned Calendar workouts; no compatibility active-plan model is admitted.
- The initial detailed horizon is exactly four calendar weeks. The continuation horizon, preparation
  trigger, and required factual/check-in threshold need a bounded RUNNING COACH decision before
  Backend design; the decision may recommend two weeks only where it has a concrete training and
  product-safety reason.

## Reliability Direction

- The replacement inherits finite server deadline, safe provider-failure classification, bounded
  transient retry, and runner-safe error guidance. It never retries cancellation, authentication,
  malformed structured output, or compiler/semantic rejection.
- The exact deadline, retry budget, candidate-retention policy, and model default are implementation
  decisions only after a measured representative corpus. A model switch is not presumed to correct
  a contract error.
- Stream only neutral server-owned progress if it demonstrably improves waiting experience; never
  stream partial plan JSON to the runner before schema and compiler acceptance.

## What Not To Touch

- Do not begin implementation while the domain-boundary transformation remains nonterminal.
- Do not retain both all-at-once detailed generation and the adaptive engine as concurrent product
  paths.
- Do not silently overwrite, delete, or reschedule existing runner-owned workouts, results, or
  evidence.
- Do not make day preferences a hidden rejection path.
- Do not persist undeveloped blueprint projections as fake workouts, active-plan rows, or a second
  Calendar authority. Do not show exercise blocks, targets, execution, distance, duration, or
  evidence controls for a projection.

## Validation Expectations

The implementation program must prove: complete blueprint plus exactly four detailed weeks;
runner-owned Calendar materialisation; soft weekday-conflict review; continuation after factual
completion, miss, edit, and FIT evidence; missing-evidence review; no automatic overwrites; source
history/provenance preservation; retry/error explanation; and an Epic-level independent browser,
persistence, and regression acceptance before the authorized commit/push.

## Stage

Architecture boundary complete; implementation waits for the modular-monolith transformation to
reach a terminal state.

## Next Recommended Role

BACKEND

## Blockers

Implementation remains gated by the in-progress modular-monolith transformation. The durable
completed-AI JSON retention task is complete and independently QA-passed. This discovery did not
mutate production code.

## Product Direction Update — 2026-08-19

Ivan confirmed the desired runner journey:

1. The runner chooses a target date, such as a race date.
2. Hito presents one full, reviewable blueprint to that date: phases, dates, expected workout
   family/cadence, and goal assumptions.
3. The Calendar shows that complete trajectory. Only its first four weeks are detailed, confirmed,
   runner-owned workouts. Later blueprint dates are visibly `Planned` upcoming-training projections.
4. A projection is intentionally non-interactive for workout editing: hover/readback explains that
   detailed prescription will be prepared closer to the date; it does not open a workout page.
5. Before the detailed horizon runs out, Hito derives the next preview from durable outcomes,
   FIT/evidence, edits, misses, runner constraints, and the immutable blueprint. The runner reviews
   and explicitly confirms it; no automatic Calendar overwrite is allowed.

## Architecture Discovery Handoff (Consumed 2026-08-19)

```text
ROLE: ARCHITECT

Task: Hito Adaptive Blueprint Engine — Blueprint Projection And Continuation Boundary
Mode: Tracked, read-only architecture discovery
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-adaptive-blueprint-four-week-detail-engine.md
Roadmap: /Users/ivan/Developer/hito-running/docs/plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md

Read AGENTS.md, agents/architect.agent.md, skills/hito-architecture-audit/SKILL.md, the canonical
item, the modular-monolith domain plan, and only the existing source authoring/provenance, Runner
Calendar, Results/Evidence, and Progress public-contract seams required for this boundary. Do not
inspect unrelated domains, write production code, mutate data, create fixtures, call providers, or
alter Git.

Accepted product contract: one immutable blueprint covers the selected target date. Exactly the
first four calendar weeks are detailed, reviewable runner-owned workouts. Future Calendar dates are
non-workout Blueprint projections: phase, cadence, workout family, target assumption, review timing,
and `Planned · details closer to the date` only. A projection cannot open workout detail, accept a
mutation, receive results/evidence, or imply prescription. Continuation normally prepares four
weeks; two weeks only for taper/target boundary or one resolved post-interruption bridge. Readiness
begins 14 days before horizon end, with preview or explicit missing-data state by seven days before
the next block. Adaptation uses factual outcomes, check-in, applicable FIT evidence, runner
constraints, and the immutable blueprint. It is always reviewed and explicitly confirmed.

Produce the smallest owner-separated design: truth owners, private/public contracts, state
transitions, exact non-authoritative projection boundary, continuation input/output,
race/taper/interruption/missing-data cases, migration implications, and focused proof boundaries.
Preserve the runner-owned Calendar model and forbid active-plan compatibility authority or fake
future workouts. Update only the canonical item with an English architecture receipt and
implementation sequence. Return to PRODUCT; do not implement or dispatch another role.
```

## Running Coach Continuation Cadence Decision — 2026-08-19

### Tracked Preflight And Evidence Boundary

- **Decision task:** this is a product/coaching decision, not a defect or an implementation
  readiness claim. The accepted blueprint direction is the product input; no root-cause claim is
  invented.
- **Canonical seam:** this item is the only changed artifact. New runtime artifacts: none. Removed
  or replaced source paths: none. No subagent was used.
- **Product evidence inspected:** the factual Results/Evidence contract, FIT-only actual-result
  boundary, Progress evidence states, and the rule that one activity does not establish improvement
  or decline. No architecture implementation or personal runner data was inspected.
- **External evidence boundary:** the cited consensus/research informs abstention after
  injury/illness and the non-universality of taper length. It does not prove that four weeks is a
  physiological optimum; four weeks is a Product cadence recommendation.

### Product Decision Summary

| Question              | Running Coach recommendation                                                                                                                                                                                                                                                                                   |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Normal continuation   | Prepare and confirm the next **four calendar weeks**. This is long enough to preserve a coherent phase/recovery shape and short enough for a meaningful review without constant re-planning. It is not a universal biological cycle.                                                                           |
| Two-week continuation | Admit only a target-date-limited final block or one post-interruption bridge after the runner reports the issue resolved and any applicable clinician guidance permits running. Do not use two weeks merely because evidence is missing, one workout was missed, one run felt hard, or the model is uncertain. |
| Preparation cadence   | Open the continuation readiness cycle **14 calendar days before** the current detailed horizon ends. Make a stable reviewable preview available no later than **7 calendar days before** the next block starts.                                                                                                |
| Adaptation floor      | Two closed calendar weeks with every due workout outcome resolved, the minimum runner check-in complete, and change-specific evidence. A training-detail change additionally needs two relevant accepted FIT-backed outcomes on separate days plus compatible reported session RPE.                            |
| Missing evidence      | Preserve the Blueprint and show an explicit check-in/evidence-needed state. A Blueprint-faithful continuation may be prepared without performance adaptation only after the runner confirms current goal, availability, and no unresolved health limitation.                                                   |
| Projection truth      | Show provisional phase/date/cadence/workout-family intent and goal assumptions only. Do not show a prescription, completion, evidence, performance, readiness, or prediction.                                                                                                                                  |

### Continuation Horizon Rule

#### Default: four calendar weeks

Every ordinary continuation produces one four-calendar-week reviewed preview. It may preserve,
reduce, or reshape details within the accepted Blueprint phase when the evidence gate below is met;
it must never silently rewrite confirmed workouts or the immutable source Blueprint. Frequent
two-week re-planning would overreact to short-term noise and impose unnecessary confirmation work.

#### Two-week block: only two bounded cases

1. **Target-date/taper boundary.** Use a block of up to two calendar weeks when the next block starts
   no more than 14 days before the selected target date and must end on that date. Never invent
   post-target workouts to fill four weeks. If the exact remaining span is shorter than two weeks,
   show the exact shorter remainder rather than calling it a two-week block.
2. **One post-interruption bridge.** A two-week bridge is permitted only when the runner explicitly
   reported an injury/sickness interruption or comparable time away, then reports the issue
   resolved, reports no current running limitation, and confirms that any applicable clinician
   guidance permits running. Hito does not provide clearance. The bridge's purpose is to obtain
   current factual outcomes before returning to a four-week cadence; it must not claim recovery,
   fitness, safety, or readiness and must not increase demands beyond the accepted Blueprint
   assumptions.

Do not chain repeated two-week bridges. At the end of one bridge, either return to the normal
four-week cadence using adequate facts, or remain in an honest review/check-in state. Ongoing,
uncertain, or clinician-restricted injury/sickness is an abstention condition, not a short training
block.

### Preview Timing And No-Surprise Calendar Rule

1. **At 14 days remaining (start of detailed Week 3):** open `Next block check-in`, show the exact
   next-block dates, inspect closed outcomes from the first two weeks, and request only missing
   runner inputs. This is a readiness step, not automatic workout generation.
2. **During Week 3:** prepare the candidate once the applicable evidence gate is satisfied. State
   the evidence cutoff date and every fact, miss, edit, constraint, and assumption used.
3. **At 7 days remaining (start of detailed Week 4):** the candidate must be either
   `Ready for review`, `Check-in needed`, or `Evidence incomplete`. Never leave the next week looking
   unexpectedly empty and never create fake workouts to avoid that appearance.
4. **After preparation:** a target-date change, new health limitation, material availability
   change, or correction/deletion of evidence used by the candidate makes it stale and requires a
   refreshed review. An ordinary new outcome does not silently mutate the preview.
5. **If the runner does not confirm:** the later Calendar remains the truthful non-workout
   Blueprint projection and shows `Details awaiting your review`. No detailed workout is created,
   and no existing runner-owned workout is changed.

A two-week bridge opens its next check-in after the first bridge week. It never auto-confirms or
silently starts another short block.

### Minimum Factual Outcome And Check-In Gates

#### Gate A — enough truth to consider adaptation

All of the following are required:

1. At least **two complete calendar weeks** have elapsed since the current detailed block was
   confirmed.
2. Every due non-Rest Calendar workout in those weeks has one explicit runner-owned lifecycle
   outcome: FIT-evidenced completed/partial, completed without FIT, missed/skipped, moved/edited, or
   cancelled. Absence of a result is not interpreted as a miss.
3. The runner confirms: target/goal assumption still current; availability and known constraints
   for the next horizon; overall manageability (`too much`, `manageable`, or `too little`); reason
   for material misses/edits when known; and whether injury, sickness, pain, or a clinician
   restriction currently affects running (`no`, `yes`, or `unsure`).
4. Health limitation is `no`. After a reported injury/sickness interruption, the additional bridge
   conditions above also apply; a `no` checkbox alone is not return-to-sport clearance. `Yes`,
   `unsure`, or contradictory evidence blocks automated training adaptation and opens a neutral
   review state. Hito does not diagnose, clear, or prescribe rehabilitation.

#### Gate B — what each evidence level permits

| Evidence available                                                                                                                                        | Permitted continuation behavior                                                                                                                                   | Not permitted                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Complete Calendar outcomes + check-in, but no relevant FIT actuals                                                                                        | Prepare a **Blueprint-faithful** block or constraint-only schedule change. Say `No performance adaptation — actual FIT evidence was unavailable or insufficient.` | No inferred distance, duration, pace, elevation, load, tolerance, fitness, or workout-family progression.     |
| Repeated misses/moves with the same runner-stated availability cause across the two closed weeks                                                          | Adjust future placement or cadence for the confirmed constraint; preserve every historical outcome.                                                               | No catch-up stacking, retroactive reschedule, or claim that the runner cannot tolerate training.              |
| At least two relevant accepted FIT-backed completed/partial outcomes on separate days, with compatible reported session RPE and no contradictory check-in | Adapt the affected duration or workout-family detail conservatively within the original Blueprint phase, and cite the exact facts used.                           | No pace/HR fitness inference, improvement claim, race prediction, or escalation beyond Blueprint assumptions. |
| Missing lifecycle outcomes, missing check-in, unresolved/contradictory health state, or stale/corrected evidence                                          | Do not adapt. Show the exact missing item and retain the projection/review state.                                                                                 | No AI-filled outcome, assumed completion, invented RPE, generic two-week fallback, or automatic confirmation. |

The two-FIT-outcome rule is a conservative **Product floor for a bounded detail change**, not proof
of fitness or physiological adaptation. One run never authorizes a direction claim. Product should
route any future comparable-performance rule separately rather than expanding this continuation
contract.

### Truthful Future Blueprint Projection

A projection may communicate only:

- the provisional phase name and date range from the immutable Blueprint;
- expected workout-family mix or cadence, including a provisional Calendar day when the Blueprint
  contains one;
- the selected target date and explicit goal assumptions;
- `Planned · details closer to the date`, the next review timing, and whether a check-in is needed;
- that the projection may change only through a later reviewed and explicitly confirmed detail
  block.

A projection must not communicate distance, duration, pace, HR, RPE, load, interval anatomy,
exercise steps, completion, results/evidence, a personal best, fitness, readiness, injury risk,
predicted race outcome, or a promise that the projected day/family will remain unchanged. It is not
clickable workout detail, cannot accept mutations or evidence, and never owns Calendar lifecycle.

### Edge-Case Rules

- **One missed session:** record it factually; do not compensate by stacking, extending, or moving
  work automatically. One miss alone does not change the next horizon.
- **Repeated missed/moved sessions:** adapt placement or cadence only when the runner states a
  shared availability cause. If the cause is absent or health-related, request review instead of
  inferring it.
- **Completed without FIT:** it is scheduled-completion truth only. It may close the Calendar
  outcome gate but supplies no actual duration, distance, pace, elevation, load, or performance
  basis.
- **Injury/sickness check-in:** `yes` or `unsure` blocks automated prescription. Preserve the
  Blueprint, explain that details need review, and direct the runner to follow qualified clinical
  guidance when appropriate. Never diagnose or promise a safe return date.
- **Taper:** preserve the taper/race phase already present in the Blueprint. Do not create a
  two-week taper merely because two weeks is convenient, and do not optimize taper from one or two
  recent pace/load observations.
- **Race week:** end the detailed block at the target event, keep the target as an assumption rather
  than a performance promise, and do not pre-generate post-race training. A moved/cancelled event
  changes a Blueprint assumption and requires Product-level review; post-race continuation requires
  factual outcome/check-in and an explicitly accepted next goal.

### Research Evidence And Recommendation Boundary

- The [IOC consensus on acute respiratory infections in athletes](https://pubmed.ncbi.nlm.nih.gov/35863871/)
  treats return to sport as a contextual clinical process rather than a single generic training
  rule. **Product implication:** an illness flag causes abstention/check-in, never automatic running
  detail or a predicted return date.
- The [Bern return-to-sport consensus](https://pubmed.ncbi.nlm.nih.gov/27226389/) describes return
  after injury as complex, multifactorial, and continuous. **Product implication:** Hito cannot use
  one checkbox or one workout to clear an injured runner; unresolved limitation remains outside
  automated adaptation.
- A 2023 [systematic review and meta-analysis of tapering in endurance athletes](https://pubmed.ncbi.nlm.nih.gov/37163550/)
  reported useful taper effects across several duration bands up to 21 days. **Product implication:**
  research does not justify a universal two-week continuation. Taper duration follows the accepted
  Blueprint phase and exact target-date boundary; Hito makes no performance guarantee.

These sources support the safety boundaries only. The 14-day readiness trigger, seven-day review
deadline, default four-week cadence, and two-outcome Product floor are Hito recommendations to be
accepted or amended by PRODUCT; they are not presented as medical or physiological thresholds.

### Validation Inventory And Outcome

| Check                                | Scenario / environment                                                                          | Result                      | Evidence                                                                                                                                       |
| ------------------------------------ | ----------------------------------------------------------------------------------------------- | --------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Policy/role preflight                | Current AGENTS, Running Coach role, matching audit skill, canonical item                        | Passed for discovery        | Read before the only task-owned write.                                                                                                         |
| Product truth                        | Blueprint/Calendar source boundary, Results/Evidence, FIT-only actuals, Progress missing states | Passed for discovery        | Recommendation distinguishes Calendar outcomes, FIT actuals, check-in facts, and unavailable evidence.                                         |
| Cadence completeness                 | Normal/short horizon, preview timing, gates, projections, misses, health, taper, race week      | Passed for discovery        | Every requested decision has a deterministic rule or explicit abstention state.                                                                |
| External evidence                    | IOC illness consensus, Bern return-to-sport consensus, endurance taper meta-analysis            | Passed for bounded support  | Sources inform health/taper boundaries; Product timings are labelled recommendations.                                                          |
| Runtime/architecture/data/QA/release | Outside Running Coach scope                                                                     | Not run — required omission | No implementation, architecture inspection, provider call, fixture, personal data, browser, hosted, Git, release, or deployment work occurred. |

The Running Coach decision is complete and this item is **ready for PRODUCT acceptance**. PRODUCT
should decide whether to accept the two-week exceptions, 14/7-day preparation cadence, and tiered
evidence floor before any Backend or implementation design. Existing architecture and JSON-retention
blockers remain unchanged. No implementation or acceptance beyond this coaching discovery is
claimed, and no successor is dispatched.

## Architecture Receipt — 2026-08-19

### Preflight And Demonstrated System Shape

- **Mode and boundary:** Tracked, read-only architecture discovery. The canonical item is the only
  changed file. No runtime, data, fixture, provider, browser, hosted, or Git-lifecycle action was
  performed. No subagent was used.
- **Current authoring owner:** `structured-plan-authoring-schema.ts` already supplies runner facts,
  availability, start date, target intent, and an optional runner comment. The server-owned draft
  service already provides one structured Responses API request, retained completed JSON, schema
  and compiler outcomes, and a reviewed canonical candidate.
- **Current contract mismatch:** `ai-authored-plan-first-provider-contract.ts` requires detailed
  `workouts[]` through one detailed endpoint, and the draft service returns one complete
  `TrainingPlanV2`. That shape cannot truthfully distinguish an immutable long-horizon Blueprint
  from a four-week executable block. It must be replaced for new generation, not wrapped as a
  Blueprint.
- **Calendar owner:** `runner-calendar-persistence.ts` reads persisted `planned_workouts` and their
  logs. Those rows are runner-owned Calendar entities; source provenance is a separate lookup and
  does not grant permissions.
- **Evidence boundary:** the public Results contract attaches assets, actual metrics, comparisons,
  and feedback to a `plannedWorkoutId`. A Blueprint projection has no such identifier and is
  structurally ineligible for results or evidence.
- **Progress boundary:** `runner-activity/product-contract.ts` exposes dated factual windows,
  availability, confidence, missing reasons, accepted FIT points, and updating/unavailable states.
  Continuation may consume this public product projection; it must not import provider-private FIT
  storage, parser, formula, or read-model types.

### Architecture Decision

Use three distinct objects with one-way authority:

1. **Immutable Blueprint source** — Source Authoring and Provenance owns the accepted target
   assumption, phases, date ranges, cadence/family intent, projection slots, source response and
   compiler provenance, and immutable content hash.
2. **Detailed-block candidate** — Source Authoring owns a private, reviewable candidate derived
   from one Blueprint version plus a frozen factual input snapshot. It is not Calendar state.
3. **Confirmed Calendar workouts** — Runner Calendar owns only explicitly confirmed detailed
   workouts. Confirmation materialises new independent rows atomically; later source changes cannot
   alter their visibility, permissions, schedule, lifecycle, results, or evidence.

There is no active plan container, fake future workout, second Calendar model, projection mutation,
or compatibility authority.

### Public And Private Contracts

| Owner                           | Public contract                                                                                                                    | Private state and mechanics                                                                                                                  |
| ------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------- |
| Source Authoring and Provenance | `BlueprintSummary`, `BlueprintProjection[]`, `DetailedBlockReviewCandidate`, confirmation request and source reference             | Provider request/response, compiler draft, retained raw JSON, immutable Blueprint record, candidate versions/hashes, evidence-input snapshot |
| Runner Calendar                 | Confirmed workout query; collision preview; atomic materialisation result; outcome/protection summary keyed by Calendar workout ID | Current table/RPC names, row construction, audit payload, collision and transaction mechanics                                                |
| Results and Evidence            | Factual lifecycle/evidence summary for existing Calendar workout IDs, including explicit missingness                               | Upload, FIT parsing, storage, reconciliation, comparison internals                                                                           |
| Evidence and Progress           | Dated product facts with availability, confidence, included/missing counts and accepted FIT evidence                               | FIT joins, formulas, normalized provider facts and recalculation mechanics                                                                   |
| Frontend Product                | A discriminated Calendar display union and review commands; no persistence authority                                               | Route composition and presentation state                                                                                                     |

The Calendar display union is intentionally asymmetric:

```text
ConfirmedCalendarWorkout {
  kind: "calendar_workout";
  workoutId: string;
  workoutDocument: WorkoutDocument;
  capabilities: CalendarWorkoutCapabilities;
}

BlueprintProjection {
  kind: "blueprint_projection";
  blueprintId: string;
  projectionId: string;
  date: ISODate;
  phase: string;
  cadenceOrFamily: non-prescriptive summary;
  targetAssumption: summary;
  reviewTiming: summary;
  label: "Planned · details closer to the date";
}
```

`BlueprintProjection` must omit `workoutId`, `WorkoutDocument`, steps, targets, executable metrics,
result/evidence references, mutation tokens, completion state, and navigation destination. The
Frontend may compose projections into Calendar dates for display, but neither Calendar persistence
nor Results/Evidence accepts this DTO.

### Immutable Blueprint Contract

The accepted Blueprint records: owner, version, selected target date and explicit goal assumptions,
start/end dates, ordered phases, phase date bounds, expected weekly cadence, permitted workout-family
mix, provisional projection dates when supplied, review timing, locale, source/compiler versions,
and content hash. It records intent, not prescription or performance prediction.

After initial confirmation it is immutable. A target-date or goal-assumption change creates a new
reviewed Blueprint version/source; it never rewrites the old Blueprint, confirmed workouts, results,
or evidence. Past versions remain provenance/history only.

### Continuation Input And Output

The Backend continuation composer accepts one frozen, attributable input:

- Blueprint ID, version and hash;
- current confirmed horizon and requested next date interval;
- due Calendar workout outcomes through an explicit cutoff, distinguishing completed/partial,
  completed without FIT, skipped/missed, edited, moved, cancelled, and unresolved;
- public Results/Evidence summaries for those workout IDs;
- applicable dated Progress product facts and FIT evidence, preserving unavailable/updating states;
- current runner-profile constraints and the required check-in answers;
- prior confirmed block/bridge metadata and target-boundary context.

It produces one immutable `DetailedBlockReviewCandidate` containing candidate ID/version/hash,
Blueprint reference, input cutoff and fact references, normal/taper/bridge mode, exact proposed
date interval, detailed `WorkoutDocument` drafts, conflicts, preserved assumptions, facts used,
facts missing, and a staleness fingerprint. It never changes Calendar.

An ordinary four-week candidate requires the accepted evidence/check-in gate. With complete
Calendar outcomes and check-in but insufficient FIT facts, only a Blueprint-faithful or
constraint-only candidate is allowed and must say that no performance adaptation occurred.

### State Transitions And Staleness

```text
Blueprint candidate -> reviewed -> confirmed immutable source
                                    -> initial block candidate

Detailed horizon -> check_in_open at 14 days remaining
                 -> preparing
                 -> ready_for_review | check_in_needed | evidence_incomplete
                 -> stale when an input invariant changes
                 -> explicitly_confirmed -> atomic Calendar materialisation
                 -> rejected/expired -> projections remain non-workout truth
```

At seven days remaining, the state must be `ready_for_review`, `check_in_needed`, or
`evidence_incomplete`. No confirmation means no rows. Confirmation must compare the candidate's
Blueprint hash, input fingerprint, Calendar collision snapshot, profile/check-in revision, and
evidence cutoff before one atomic insert. A mismatch returns `stale`; it never partially applies or
silently refreshes.

Staleness is caused by a target/Blueprint revision, new or changed health limitation, material
availability change, correction/deletion of evidence used, changed due-workout outcome, or Calendar
occupancy conflict in the candidate interval. A later unrelated factual outcome may be visible but
does not mutate an already prepared candidate unless it changes an admitted invariant.

### Edge Cases

- **Target/taper:** a final block may cover up to two weeks, or the exact shorter remainder, only
  when it begins within 14 days of the target and ends on the target. No post-target rows or
  projections are invented.
- **Race change:** moving or cancelling the target invalidates the assumption and requires a new
  reviewed Blueprint version. It does not reschedule confirmed workouts.
- **Resolved interruption:** one two-week bridge is allowed only after the accepted check-in and
  applicable clinical-guidance conditions. It cannot claim clearance or raise demand beyond the
  Blueprint. It records `bridge_used`; another short bridge is rejected.
- **Unresolved health state:** `yes`, `unsure`, contradiction, or restriction yields a neutral
  check-in/review state and no generated prescription.
- **Missing facts:** unresolved outcomes or missing check-in yields an explicit missing-data state.
  Missing is never inferred as miss, zero, completion, RPE, or FIT evidence.
- **Collision:** existing Calendar rows are listed in preview. Confirmation either uses an
  explicitly reviewed non-destructive placement or fails atomically; it never replaces, moves, or
  deletes existing rows as a side effect.

### Migration Implications

- Introduce a separately approved Backend persistence migration for immutable Blueprint versions,
  projection intent, detailed-block candidates/input fingerprints, and confirmation lineage. The
  migration must not store projections in `planned_workouts` or create a replacement active
  container.
- Preserve all existing materialised Calendar workouts, logs, evidence, FIT associations, and
  historical source records unchanged. Do not truncate an already materialised legacy future
  schedule merely to enforce the new-engine horizon.
- Do not synthesize Blueprints from old fully detailed plans. Existing saved plans remain immutable
  historical/reusable sources; only a newly reviewed adaptive Blueprint uses this continuation
  lifecycle.
- Replace the current all-at-once generation entry for new authoring only after the new Blueprint
  compiler, persistence, review and confirmation path passes. Remove the old entry in the same
  product cutover; no dual selectable mode or fallback remains.
- Physical legacy table/module names may remain temporary implementation facts until their owning
  migration slice, but they cannot define product permissions or be exposed as Blueprint authority.

### Serial Implementation Sequence

1. **BACKEND — Blueprint contract and compiler.** Replace the generated-content contract with an
   immutable Blueprint plus exactly four calendar weeks of detailed candidate workouts. Reuse the
   structured request, one Responses API call, completed-response retention, schema/compiler
   diagnostics, and reviewed-preview envelope. No Calendar write yet.
2. **BACKEND — Blueprint/candidate persistence.** Add the minimum separately reviewed schema and RLS
   for owner-bound immutable Blueprint versions, projection intent, candidate/input fingerprint and
   confirmation lineage. Prove immutability, ownership, idempotency and rollback.
3. **BACKEND — Initial confirmation boundary.** Compile only the first four weeks into canonical
   `WorkoutDocument` rows and use Runner Calendar's collision and atomic materialisation seam.
   Preserve source provenance without plan-controlled permissions.
4. **BACKEND — Projection and continuation query.** Expose non-authoritative projections and the
   14/7-day state. Compose continuation inputs only from Runner Calendar, Results/Evidence, Progress
   and profile public contracts; retain the review candidate without applying it.
5. **BACKEND — Continuation confirmation.** Enforce staleness, horizon, taper/bridge, collision and
   no-overwrite invariants, then atomically add only the explicitly confirmed block.
6. **FRONTEND Product — Review and Calendar composition.** Render the full Blueprint trajectory,
   non-interactive projection rows, missing-data/check-in states, factual basis and detailed preview.
   Confirm through Backend commands; never reconstruct adaptation or persistence client-side.
7. **QA — independent Epic acceptance.** Validate initial and continuation journeys across source,
   persistence, Calendar, evidence, missingness and responsive UI. Global QA/release remain separate.

The first implementation owner is **BACKEND**, but PRODUCT must not dispatch it until the
modular-monolith transformation is terminal.

### Focused Proof Boundaries

| Slice                | Required focused proof                                                                                                                                                          | Preserved boundary                                |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Contract/compiler    | Full target Blueprint; exactly first four weeks detailed; projections contain no executable fields; soft weekday conflict; hard structural rejection; retained-response outcome | No provider call in tests; no Calendar write      |
| Persistence          | Owner/RLS isolation; immutable accepted Blueprint; candidate version/hash and input provenance; idempotent retention; forward/backward migration proof                          | No fake workout rows or active container          |
| Initial confirmation | Review-token/hash parity; collisions; atomic insert; AI/manual/import origin-neutral Calendar permissions; reload                                                               | Existing Calendar rows/results/evidence unchanged |
| Continuation         | 14/7 timing; factual cutoff; complete/missing/updated evidence; no-FIT Blueprint-faithful path; stale candidate; normal/taper/bridge rules                                      | No private provider types or inferred facts       |
| Frontend             | Projection cannot navigate, mutate, complete or receive evidence; confirmed workout remains fully interactive; factual missing-state and target-assumption copy                 | No client-side authority                          |
| Epic QA              | Initial four weeks, ordinary continuation, taper, target change, one bridge, unresolved interruption, missing data, collision, rejection, retry and durable reload              | No release/deployment claim                       |

### Residual Boundary And Acceptance

The architecture decision is complete. Implementation is blocked only by the nonterminal
modular-monolith transformation and requires separately reviewed Backend persistence/RLS work.
Exact storage names, migration DDL, model default, deadline and retry budget remain Backend
implementation decisions within these invariants. No implementation, browser QA, hosted parity,
Global QA, release, or deployment acceptance is claimed.

## Next Handoff Prompt

```text
ROLE: BACKEND

Task: Hito Adaptive Blueprint Engine — Blueprint Contract And Compiler
Mode: Tracked
Canonical item: /Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-18-hito-adaptive-blueprint-four-week-detail-engine.md
Stage: First implementation slice after the modular-monolith transformation is terminal

Implement only the source-authoring contract/compiler slice accepted in the canonical architecture
receipt. Replace the generated-content contract for new authoring with one immutable full-horizon
Blueprint plus exactly the first four calendar weeks of detailed review-candidate workouts. Reuse
the existing structured authoring input, single server-owned Responses API request, completed JSON
retention, schema/compiler diagnostics, and reviewed-preview envelope. Projections may contain only
phase/date/cadence/workout-family/target-assumption/review-timing intent and must contain no
WorkoutDocument, executable target, mutation/evidence identity, or Calendar row.

Do not write Calendar rows, add persistence or migrations, retain the old all-at-once contract as a
fallback, create an active-plan compatibility path, call a provider during validation, or touch
Frontend. Preserve unrelated dirty work and the runner-owned Calendar boundary. Run focused schema,
compiler, retained-response, target/taper, soft weekday-conflict, and exact four-week-horizon proof;
return any newly demonstrated persistence or Product decision to PRODUCT rather than widening.
```

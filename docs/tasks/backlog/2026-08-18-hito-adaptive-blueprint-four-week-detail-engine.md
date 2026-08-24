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
- Without provider-neutral terrain or gradient facts, hill repeats retain explicit repetitions,
  uphill distance and recovery duration but use controlled effort only; they never carry executable
  pace or heart-rate targets.
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

## Cost And Latency Decision — 2026-08-22

### Evidence And Cost Classification

HITO-252 used only the redacted HITO-249 attempt ledger and current public contracts. The retained
cost summary has SHA-256
`7ceb42be447711c3cbd7f0c49d05faf489a49e9b2591c515e7912fb1405e5c69`, contains no raw provider
content, prompt, credential or personal data, and records 15 paid `gpt-5.2` requests:

| Metric                 | Aggregate   | Median    | P25–P75          | Range            |
| ---------------------- | ----------- | --------- | ---------------- | ---------------- |
| Input tokens           | 75,643      | 4,754     | 4,523–5,428.5    | 3,458–6,999      |
| Output tokens          | 141,880     | 10,234    | 9,549–11,315.5   | 3,842–12,283     |
| Reasoning tokens       | 21,617      | 1,513     | 1,249–1,772      | 417–2,476        |
| Total tokens           | 217,523     | 15,564    | 14,555–16,233    | 7,523–19,153     |
| Provider latency       | 1,388.567 s | 100.181 s | 91.369–112.563 s | 34.694–119.334 s |
| End-to-end latency     | 1,391.347 s | 100.181 s | 91.369–112.563 s | 35.096–119.334 s |
| Post-provider residual | 2.780 s     | 0 s       | 0–0.401 s        | 0–0.594 s        |

Compiler-specific elapsed time was not independently reported, so the post-provider residual is not
claimed as compiler time. Five schema/compiler rejections consumed 23,043 input, 39,385 output and
5,962 reasoning tokens, 379.310 seconds of provider time and `$0.59171525` of the derived estimate:
27.9% of derived cost, 27.8% of output tokens and 27.3% of provider latency. Ten responses were
technically accepted; eight were later rejected by Running Coach, and two initial candidates were
approved. No normal continuation candidate reached Coach approval.

The provider reported no request-level cost. Authoritative request-level actual billing attribution
was unavailable. `$2.11869525` is only `derived_rate_card`, calculated from the artifact's
2026-08-22 standard `gpt-5.2` rate card as
`(75,643 × $1.75 + 141,880 × $14) / 1,000,000`; reasoning is already included in output and is not
counted twice. Cached-input usage was not reported, so all input uses the standard rate. Actual spend
remains unavailable.

The 12 initial calls account for 64,087 input, 129,179 output and 20,256 reasoning tokens,
1,267.780 seconds of provider time and `$1.92065825` derived cost. The final accepted initial call
used 5,467 input, 9,970 output and 1,438 reasoning tokens, took 93.807 seconds and derives to
`$0.14914725`. The three normal-continuation calls used 11,556 input, 12,701 output and 1,361
reasoning tokens, took 120.787 seconds total and derive to `$0.198037`; their technically accepted
third response still failed Coach review. These are observed values, not evidence that token or
latency scales linearly with workout count.

### Horizon Decision

Keep **A: one compact full Blueprint plus exactly four initial detailed calendar weeks**. Keep a
normal continuation at four weeks; retain the accepted two-week exceptions only for the target/taper
boundary and one resolved-interruption bridge.

Reject **B: one initial detailed week plus rolling weekly detail**. It cannot satisfy the existing
server-owned timing contract: continuation needs the closed two-week factual window and compatible
RPE/FIT evidence, while a reviewable next block must exist seven days before the current horizon
ends. A one-week horizon expires before either fact window or review lead time exists. It would also
replace one four-week authoring event with up to four events without evidence that aggregate cost,
latency or Coach quality improves.

Do not introduce **C**. A three-week horizon is the first arithmetically possible shorter option, but
the current cutoff and review deadline leave only about one day between two closed factual weeks and
the seven-day review boundary. No matched deterministic, Coach or provider corpus proves that this
reduced recovery margin is safe. The evidence therefore warrants eliminating retry waste and
duplicate context, not changing the accepted training cadence.

The historical 15-call sequence measured contract and quality-rule discovery, not steady-state
authoring. The steady-state goal is one paid request per authoring candidate after deterministic
admission. Future reports must distinguish this target from achieved provider evidence.

### Minimum Payload And Reuse Contract

1. **Initial response:** one compact immutable Blueprint through the selected target date plus only
   the first four weeks of canonical detailed WorkoutDocuments. Projections retain only stable ID,
   date, phase, family/cadence, goal assumption and review timing; they never gain prescription,
   Calendar identity or evidence capability.
2. **Continuation request:** the versioned Training Decision authoring brief sends the immutable
   Blueprint identity/hash, exact next projection interval, applicable phase/family/goal constraints,
   normalized factual progress profile, current check-in/preferences and current constraints. It
   does not resend raw provider material, the full evidence history, prior detailed WorkoutDocuments
   or unrelated Blueprint intervals.
3. **Continuation response:** exactly one normal four-week detailed block, or the accepted bounded
   two-week taper/bridge block. It contains canonical WorkoutDocuments only and cannot rewrite the
   Blueprint, facts, source lineage, Calendar or Result/Evidence.
4. **Idempotent reuse:** before a provider call, look up the existing retained owner response only by
   an exact content hash over owner, complete normalized context, model, prompt version, response
   schema version, compiler/policy version and provider settings. A hit still passes current owner,
   schema, compiler, lineage, staleness and review checks. It is an optimization, never authority.
5. **Cache boundary:** provider-native exact-prefix caching may be observed when the provider reports
   it. Hito adds no cache service, table or mutable cache record; a miss or eviction cannot change
   product behavior. A partial, similar, cross-owner or cross-version match is forbidden.

After parity, remove any continuation payload assembly that serializes the complete Blueprint,
unrelated projection windows, raw evidence rows or prior WorkoutDocuments into the provider request.
Do not preserve them through aliases, compatibility DTOs or a second authoring path. The existing
retained-response lineage, strict compiler, candidate, Coach review and explicit Calendar confirm
owners remain unchanged.

### Serial Delivery And Proof Before Paid Retry

1. **BACKEND — compact request and deterministic admission.** Inventory the exact initial and
   continuation provider payload, remove context outside the contract above, add the exact request
   content hash/idempotent retained-response lookup, and make all HITO-249 schema/compiler and
   accepted Coach invariants deterministic before network admission. Preserve four-week/two-week
   horizon semantics. Delete old payload builders only after direct runtime and type-only consumers
   are zero.
2. **BACKEND — zero-provider replay.** Run stable fixtures for initial, normal, target/taper, one
   bridge and no-prescription through the real schema/compiler/retention/review boundary with
   injected responses. Prove full projection coverage, exact detailed cardinality, no raw/private
   facts in public DTOs, request-hash idempotency, stale rejection, zero unreviewed Calendar writes
   and unchanged retained lineage. Old four-week artifacts remain immutable historical evidence;
   they are not rewritten or accepted through a compatibility parser.
3. **FRONTEND Product — only if the public DTO changes.** Reuse the current check-in/review/confirm
   route. Prove full Blueprint visibility, non-workout projections, existing editable confirmed
   workouts and truthful waiting/missing/stale states. Do not add client authoring, cache state or a
   new horizon mode.
4. **RUNNING COACH then QA — serial paid acceptance.** After deterministic proof, admit at most one
   paid candidate at a time: initial, normal continuation, target/taper, bridge; no-prescription is a
   zero-call control. Record exact usage, provider/end-to-end timing, schema/compiler result,
   `reported_actual | derived_rate_card | unavailable`, candidate hash and Coach verdict. A rejection
   requires one material owner hypothesis and another zero-provider replay before a retry.
5. **Independent QA:** prove retained-response/request lineage, strict compiler, signed review,
   explicit confirmation, reload, collision/stale/no-overwrite behavior, projection non-authority,
   managed fixture cleanup and the complete browser journey. Global QA, hosted parity, release and
   deployment remain separate.

Paid call 16 stays forbidden until Step 2 passes and PRODUCT separately re-admits provider use.
Rollback removes the compact payload/idempotency admission from the provider path and restores the
last accepted four-week request builder while no new paid response or confirmed candidate exists;
retained responses are never deleted or mutated. Stop on a lossy public DTO, cross-owner cache hit,
hash ambiguity, schema/compiler rule not reproducible without a provider, reverse dependency, raw
fact leakage or any need for a second store/provider/Calendar writer.

### HITO-252 Next Implementation Edge

The decision is complete with no remaining horizon choice. The next implementation owner after
PRODUCT acceptance is **BACKEND**. No provider, source, schema, runtime, fixture, browser, database,
hosted, Git, release or deployment action was performed by this decision.

```text
ROLE: BACKEND

Task: HITO-252 — Reduce Adaptive Authoring Cost and Latency
Mode: Tracked
Stage: Compact request and deterministic authoring admission

Read AGENTS.md, agents/backend.agent.md, the live HITO-252 Task, the HITO-216 cost/latency decision,
the redacted HITO-249 evidence and only the direct initial/continuation request, schema/compiler,
retained-response and focused-proof consumers. Preserve HITO-249/HITO-250 and unrelated dirty work.

Keep the accepted compact full Blueprint plus four initial detailed weeks, four-week normal
continuation and bounded two-week taper/bridge exceptions. Implement one Backend slice that removes
unrelated Blueprint intervals, prior WorkoutDocuments, raw evidence rows and provider-private
history from continuation request assembly; retains only the versioned Training Decision brief and
exact target projection interval; and adds an idempotent retained-response lookup keyed by an exact
owner/context/model/prompt/schema/compiler/policy/provider-settings content hash. A cache/reuse hit is
never authority and must pass current ownership, schema, compiler, lineage, staleness and review.

Before any paid provider request, prove with injected deterministic fixtures that initial, normal,
target/taper, one bridge and no-prescription pass the real schema/compiler/retention/review boundary;
all HITO-249 technical and accepted Coach invariants are executable gates; duplicate exact requests
make zero provider calls; public DTOs contain no raw/private facts; unreviewed Calendar writes remain
zero; and runtime plus type-only imports are acyclic. Remove superseded payload builders only after
their direct consumers are zero. Add no provider, cache service/table, compatibility DTO, second
authoring path or Calendar writer. Do not call a paid provider, implement Frontend, mutate hosted
state, deploy or perform Git lifecycle work. Return the same Task to PRODUCT with exact before/after
payload cardinality, deterministic proof, deletions, omissions and the separately authorised paid
replay boundary.
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
   Initial confirmation treats an omitted current running limitation as the healthy default and
   blocks only an explicitly supplied `yes` or `unsure`. Historical workout BodyNotes remain factual
   workout history and never become a current restriction by inference.
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

## Slice 4 Projection, Readiness And Scheduling-Preference Decision — 2026-08-22

This receipt is the controlling technical decision for Slice 4. It supersedes only the earlier
projection/readiness input and next-handoff text above. Slices 1–3 are accepted evidence: the
Blueprint/four-week compiler, owner-bound immutable persistence and atomic initial Calendar
materialisation are complete. Operational lifecycle remains in Notion HITO-216.

### Demonstrated Current Boundary

- The accepted Blueprint already persists stable projection IDs, dates, phase, one workout family,
  target assumption, review timing and the fixed planned label. The compiler rejects duplicate IDs
  or dates and executable fields do not exist in the projection schema.
- The current compiler proves at least one projection per future phase and one target projection,
  but does not yet prove that every provisional future workout slot implied by phase cadence is
  represented through the target date. Slice 4 must close that completeness gap before the public
  Calendar read model is admitted.
- `adaptive_training_blueprint_versions` and `adaptive_training_detailed_candidates` are immutable
  Source Authoring records. Initial confirmation creates standalone Calendar workouts and Calendar
  mutation events, but Source Authoring has no immutable confirmed-block receipt from which to
  select the confirmed Blueprint and detailed horizon for continuation.
- `projectRunningPlanPreviewResultForProduct` currently omits the Blueprint, while the signed-in
  `TrainingSnapshot` and `calendar-projection.ts` contain Calendar workouts only. No production
  post-confirmation query currently exposes future Blueprint projections or continuation status.
- `runner_profiles.training_preferences` stores recurring profile-wide fixed weekdays, preferred
  long-run weekday and weekly capacity. It has no Blueprint/projection identity, exact date,
  one-off swap, independent revision or candidate-consumption state. Reusing it for a future
  projection preference would silently change global availability and is rejected.
- Result/Evidence already exposes factual per-workout completion/evidence, accepted actual metrics,
  comparison and explicit missingness. Its current Progress projection is an aggregate UI read
  model and is not an authoring prerequisite. Continuation must consume a narrow factual packet
  directly from the Result/Evidence public owner.

### Source Of Truth And Public Read Model

Source Authoring owns future projections and continuation readiness. Runner Calendar continues to
own only confirmed workouts. The post-confirmation Source read model is derived from:

1. one immutable, owner-bound Blueprint version and hash;
2. one immutable confirmed-block receipt for the current detailed horizon;
3. the latest immutable continuation-input revision;
4. one frozen Result/Evidence packet and Calendar outcome/collision fingerprint; and
5. an optional immutable next-block candidate and review seal.

The Source public query is conceptually
`getAdaptiveBlueprintCalendarReadModelForUser(userId, asOfDate)`. It returns a separate Source
projection collection beside the Runner Calendar snapshot; it does not add projections to
`TrainingSnapshot.workouts` or to `planned_workouts`.

```text
BlueprintCalendarProjection {
  kind: "blueprint_projection";
  blueprint: { id; version; sha256 };
  projectionId;
  date;
  phase;
  phaseCadence;
  workoutFamily;
  goalAssumption;
  reviewTiming;
  status;
  activePreferenceIds;
  capabilities: {
    canOpenWorkout: false;
    canMutateWorkout: false;
    canAttachResultOrEvidence: false;
    canExpressSchedulingPreference: true;
  };
}
```

The DTO must not contain a Calendar workout ID, `WorkoutDocument`, distance, duration, pace, HR,
RPE, load, steps, target, completion, mutation token, evidence/result identity or workout-detail
destination. The immutable projection ID is stable only within its Blueprint version. A replacement
Blueprint never reuses it as hidden cross-version authority.

Before exposing this query, Backend must strengthen projection completeness: every provisional
future workout slot authored for the period after the confirmed detailed horizon through the target
date has exactly one unique projection; every projection belongs to its phase and permitted family;
phase cadence and partial target-week coverage are internally consistent; and no projection exists
inside a confirmed detailed interval. The compiler remains the sole validator; Frontend does not
repair sparse or conflicting projection data.

### Visible Status Contract

| Value                          | Exact runner-facing state              | Discriminator                                                                                                 |
| ------------------------------ | -------------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| `planned`                      | `Planned · details closer to the date` | The 14-day readiness window has not opened and no current review action is required.                          |
| `check_in_needed`              | `Check-in needed`                      | The window is open and the required horizon-bound check-in is absent, incomplete or superseded.               |
| `evidence_incomplete`          | `Evidence incomplete`                  | The check-in is current, but a due non-Rest outcome or required Result/Evidence fact is unresolved or stale.  |
| `ready_for_review`             | `Ready for review`                     | A fresh immutable candidate exists and has not yet been reviewed into a sealed confirmation request.          |
| `awaiting_runner_confirmation` | `Awaiting runner confirmation`         | The runner reviewed the facts/conflicts and the server sealed a still-current candidate for explicit confirm. |

`Pending` is forbidden. Provider preparation/retry is transient operation feedback, not a sixth
persisted projection status. By seven days before the next block, the public state must be one of
`check_in_needed`, `evidence_incomplete`, `ready_for_review` or
`awaiting_runner_confirmation`; failure to reach one is an operational error, never a fake workout.

A projection may be focused and read, and may expose a non-workout Blueprint summary, check-in,
review or scheduling-preference action. The projection card itself has no workout-detail link.
Calendar Add/Edit/Move/Copy/Clear, drag-and-drop, completion, upload, evidence and result actions
must ignore it. A confirmed Calendar workout on the same surface retains the full accepted Calendar
editing contract.

### Scheduling Preferences And Minimal Persistence

Profile-wide recurring availability remains in `runner_profiles.training_preferences` and enters
continuation as a current global constraint. Slice 4 adds no recurring preference vocabulary.
Blueprint-bound scheduling preferences are one-off Source Authoring inputs:

```text
AvoidProjectionDate {
  kind: "avoid_projection_date";
  projectionId;
  date;
}

SwapProjectionSlots {
  kind: "swap_projection_slots";
  firstProjectionId;
  secondProjectionId;
}
```

They never contain a Calendar workout ID and never execute a Calendar Move. The exact minimal new
model is one owner-bound, append-only `adaptive_training_continuation_input_revisions` aggregate per
Blueprint. Each revision stores its Blueprint ID, revision, content hash, superseded revision,
active projection preferences, and an optional horizon-bound check-in. The server validates exact
projection IDs/dates against the immutable Blueprint. Owner-select RLS and server-only writes match
the accepted Blueprint persistence boundary.

The latest revision is current input; every candidate freezes its revision and hash. Editing or
withdrawing a preference appends a revision and stales an unconfirmed candidate. A preference stays
active until withdrawn or until a confirmed block materialises its projection interval. Rejected or
stale candidates do not consume it. The candidate review reports each preference as `applied` or
`not_applied` with a concrete conflict reason. Preferences do not make an otherwise safe candidate
structurally invalid.

An exact-date preference and a swap are admitted. A recurring weekday change remains the existing
global profile setting. Automatic carry-over to a replacement Blueprint is forbidden; the runner
must restate it against the replacement projections. These boundaries resolve the admitted Slice 4
behavior without a remaining Product choice.

### Confirmed Horizon And Continuation Inputs

Add one immutable, owner-bound `adaptive_training_block_confirmations` Source lineage record in the
same transaction that materialises a reviewed block. It contains Blueprint/candidate IDs, versions
and hashes; exact confirmed interval; ordered created Calendar workout IDs; input/evidence/calendar
fingerprints; confirmation timestamp; block mode; and predecessor confirmation ID. It is history
and continuation lineage only. It never grants Calendar permission or controls a workout after
materialisation.

The current Source read model follows predecessor IDs to one unique leaf confirmation for one
Blueprint. Zero or multiple unsuperseded leaf lineages fail closed; it never chooses a plan by newest
timestamp. Replacing a Blueprint or defining cross-Blueprint preference carry-over is outside Slice 4.

Result/Evidence owns and returns a server-only `ContinuationEvidencePacket` for every due non-Rest
Calendar workout in the accepted cutoff interval:

```text
ContinuationEvidencePacket {
  asOf;
  cutoffDate;
  calendarOutcomeFingerprint;
  evidenceRevisionFingerprint;
  dueWorkoutCount;
  resolvedOutcomeCount;
  workouts: [{
    calendarWorkoutId;
    workoutDate;
    outcome;
    outcomeRevision;
    sessionRpe;
    evidenceState: "fit_current" | "completed_without_fit" |
      "missing" | "updating" | "removed";
    acceptedActualMetrics;
    comparisonStatus;
    missingReasons;
  }];
}
```

The packet carries facts and explicit missingness, not Progress UI aggregates, readiness scores,
performance conclusions or provider/storage/parser types. Every eligible accepted FIT activity in
the interval remains represented; there is no sampling cap. Calendar supplies lifecycle outcomes
and workout fingerprints. Result/Evidence supplies current factual evidence. Source Authoring joins
those packets with the immutable Blueprint, current normalized profile constraints and the latest
continuation-input revision.

The continuation composer outputs either an explicit missing state or one immutable
`DetailedBlockReviewCandidate` with:

- the next exact interval and `normal_four_week`, `target_taper_boundary` or
  `resolved_interruption_bridge` mode;
- canonical `WorkoutDocument` drafts, never Calendar rows;
- frozen Blueprint, confirmation, profile-constraint, preference/check-in, Calendar and evidence
  fingerprints;
- facts used, facts missing, conflicts and preference application explanations; and
- candidate/review identity, version and hash.

Normal output is four calendar weeks. A target/taper block may end on the target with an exact
shorter remainder of at most two weeks. One resolved post-interruption bridge may be two weeks and
records that the bridge exception was used. No other missing-data or provider case authorises a
short block.

### Staleness And No-Cycle Rules

An unconfirmed candidate becomes stale when any admitted input changes: Blueprint or confirmation
lineage; continuation-input revision; normalized global preference hash; required check-in; a due
Calendar document/date/outcome; target-interval occupancy; Result/Evidence source revision,
availability or correction; health limitation; or review seal. A fact outside the frozen membership
and cutoff does not silently mutate the candidate.

Runtime and type-only direction is one-way:

```text
Result/Evidence public facts -----------+
Runner Calendar public outcomes --------+--> Source Authoring continuation
Runner profile public constraints ------+        |
                                                v
                                      Source public projection/readiness
                                                |
                                                v
                                  route transport/composition -> Frontend
```

Runner Calendar and Result/Evidence must not import Source Authoring runtime or types. Source
Authoring may import their public server contracts and client-safe public types only. The route
transport composes the Calendar snapshot and separate Source read model. Frontend may import only
the Source public DTO type. It must not import persistence, candidate, evidence or compiler internals.
No alias, adapter, duplicate DTO, fake Calendar row, active-plan projection or compatibility fallback
is admitted.

Direct current consumers and the admitted Slice 4 consumers are bounded as follows:

| Contract                                  | Current direct production consumers                                                                                                    | Focused proof consumers                                                 | Slice 4 consumer/change                                                                                   |
| ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Blueprint compiler/result                 | `ai-first-plan-draft-service.ts`, `ai-generated-running-plan.ts`, `running-plan-engine-review.ts` and `running-plan-engine-actions.ts` | provider-representation and generated-plan-creation validators          | Source public read-model builder; no Calendar import back into the compiler                               |
| Immutable Blueprint/candidate persistence | draft service retention and running-plan confirmation exactness check                                                                  | persistence and generated-plan-creation proofs                          | confirmation-lineage and continuation-input queries owned beside this persistence                         |
| Runner Calendar snapshot/outcomes         | `training-api.ts`, route data, AppShell, Calendar, Today and workout views                                                             | Calendar context, overflow and mutation validators                      | server-only continuation outcome packet plus unchanged Calendar snapshot                                  |
| Result/Evidence facts                     | workout routes, Calendar marker readback, completion and Progress fact builders                                                        | evidence comparison, upload/remove/retry and activity read-model proofs | server-only `ContinuationEvidencePacket`; no Progress UI dependency                                       |
| Global training preferences               | Settings, onboarding structured input and initial authoring compiler                                                                   | plan-authoring and running-plan confirm proofs                          | normalized hash is a continuation constraint; one-off projection preferences use the new Source aggregate |
| Source projection/readiness DTO           | none after initial confirmation                                                                                                        | none                                                                    | `training-api.ts` route composition, then Calendar/`calendar-projection.ts` presentation only             |

### Serial Delivery And Proof

1. **BACKEND — Slice 4A, source lineage and public facts.** Strengthen projection completeness;
   persist immutable block confirmations and continuation-input revisions; expose the narrow
   Calendar outcome and Result/Evidence packets; implement the owner-bound Source projection and
   readiness query. Do not prepare or confirm a continuation yet. Migration proof must start from
   the accepted 49-migration baseline and preserve zero runtime data, owner/RLS isolation and zero
   projection rows in Calendar.
2. **BACKEND — Slice 4B, candidate preparation.** Reuse the existing immutable candidate table with
   incremented versions and frozen inputs. Implement 14/7-day readiness, ordinary four-week and two
   bounded exception modes, preference application readback and staleness. It produces a review
   candidate only; Step 5 continuation confirmation remains a separate admitted slice.
3. **FRONTEND Product — Slice 4C, truthful Calendar composition.** Render the separate projection
   DTO through route composition, exact statuses, focus/readback and one-off preference/check-in and
   review entry points. Prove that projection cards have no workout route or Calendar/result action
   while current detailed workouts remain editable. No client reconstruction or readiness logic.
4. **QA — proportional independent acceptance.** After stable Backend and Frontend ownership,
   replay the changed public contracts, local persistence and focused browser states. Epic-wide
   continuation confirmation, Global QA, hosted parity, release and deployment remain later gates.

| Boundary                  | Focused proof                                                                                                                                      |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Compiler/read model       | Full target-date projection coverage; stable IDs; exact allowed fields; no detailed-interval projection; exact status mapping                      |
| Persistence/RLS           | Owner isolation; immutable lineage/input revisions; idempotent readback; candidate stales on a new revision; no Calendar projection row            |
| Calendar/Result contracts | Every due outcome and evidence state; missing/updating/removed preserved; no private import; recursive runtime and type-only graph remains acyclic |
| Continuation              | 14/7 timing; complete, missing and stale packets; four-week normal; target/taper and one bridge only; all preference outcomes explained            |
| Frontend                  | No workout navigation/mutation/evidence; accessible status/readback; preference is not DnD; confirmed workouts retain full interaction             |

Rollback is slice-local before release: remove the Slice 4 route/read-model admission and leave
immutable Blueprints, accepted initial candidates, confirmed Calendar workouts, results and evidence
untouched. Schema rollback is allowed only in a disposable local replay with zero retained Slice 4
rows; otherwise the additive lineage/input records remain inert evidence until a separately reviewed
forward fix. Stop before implementation if atomic block lineage cannot be recorded with Calendar
materialisation, a public packet requires private provider/storage types, the input model would
mutate global preferences, projection completeness cannot be deterministic, or a runtime or
type-only cycle appears.

### Decision Outcome

The Slice 4 contract is complete with no unresolved Product choice inside the accepted exact-date
and projection-swap scope. The next recommended owner is **BACKEND** for Slice 4A only. PRODUCT must
admit that bounded implementation; this ARCHITECT task does not dispatch it. Browser, runtime,
database replay, independent QA, hosted, provider, Global QA, release and deployment evidence were
not produced by this read-only decision.

## Dynamic Continuation Authoring Decision — 2026-08-22

### Root Cause And Accepted Boundary

Final Epic acceptance proved two separate gaps after Slices 1–5:

- `adaptive-blueprint-continuation.ts` indexes WorkoutDocuments from the first confirmed candidate
  by `workoutFamily`, clones/rebases one for each later projection, and returns
  `blueprint_family_source_missing` when a later target/taper/race family was absent from the first
  four weeks. This is not later prescription authoring; it is a legacy reconstruction from an
  unrelated earlier block.
- `getAdaptiveBlueprintCalendarReadModelForUser()` currently prepares and retains a candidate during
  a read, while the production chain `training-api.ts` -> route -> `Calendar.tsx` renders projections
  only. No user-facing check-in, candidate review or explicit continuation-confirm action is wired.

The accepted projection, lineage, input-revision, reviewed-confirmation and atomic Calendar
materialisation contracts remain valid. This decision replaces only the first-horizon cloning
responsibility and completes the server-to-Frontend journey. Future projections remain non-workouts.

### One Training Decision Module

Source Authoring owns one server-only Training Decision module, initially the narrow seam
`adaptive-training-decision.ts`. It is the sole policy owner between factual inputs and AI
authoring. It has no UI, route, Calendar mutation, provider request, private-response storage,
database access or `Map`-shaped dependency. Its contracts are plain serialisable values:

```text
ContinuationDecisionInputV1 {
  contractVersion;
  policyVersion;
  blueprint: { id; version; sha256; immutableContent };
  confirmationLineage: { leafId; predecessorIds; confirmedIntervals; candidateHashes };
  progressProfile: ContinuationProgressProfileV1;
  continuationInput: { id; revision; sha256; checkIn; activePreferences };
  constraints: { normalizedProfileHash; currentValues };
  targetIntervalOccupancyFingerprint;
}

ContinuationDecisionResultV1 =
  | {
      status: "authoring_ready";
      contractVersion;
      policyVersion;
      inputFingerprintSha256;
      adaptationMode: "blueprint_faithful" | "constraint_only" | "fact_shaped";
      authoringBrief: ContinuationAuthoringBriefV1;
      factsUsed;
      factsMissing;
      uncertainty;
      preferenceApplications;
    }
  | {
      status: "no_prescription";
      contractVersion;
      policyVersion;
      inputFingerprintSha256;
      reason: "check_in_missing" | "evidence_unresolved" | "input_stale" |
        "lineage_invalid" | "target_context_unsupported";
      missingOrConflictingFacts;
    };
```

The authoring brief identifies the exact Blueprint version, next projection IDs/interval, block
mode, phase/family/goal assumptions, constraint applications and bounded factual rationale. It is
not a WorkoutDocument, Calendar row, second plan, predicted race result or provider payload. Changing
the decision algorithm changes only `policyVersion` and its deterministic implementation; the
factual, provider-retention, compiler, review and Calendar contracts remain stable.

The module is independently testable with stable JSON fixtures and golden input/output hashes. An
output is reproducible for one complete input and policy version. It does not read current time or
mutable state internally; the caller supplies `asOf`, cutoffs and all fingerprints through the
versioned input.

### Provider-Neutral Factual Progress Profile

Activity Capture / Result-Evidence remains the sole owner of accepted actual metrics, evidence
state, source lineage, data quality and missingness. Runner Calendar remains the sole owner of
workout date, lifecycle outcome, RPE and mutation fingerprints. Source Authoring joins those public
packets to the immutable confirmed WorkoutDocuments only to add intended family/identity/target
context; it cannot rewrite the facts. The Training Decision module normalises that complete frozen
input into:

```text
ContinuationProgressProfileV1 {
  asOf;
  cutoffDate;
  calendarOutcomeFingerprint;
  evidenceRevisionFingerprint;
  confirmedCandidateSha256;
  quality: { due; resolved; fitCurrent; completedWithoutFit; missing; updating; removed };
  comparableGroups: [{
    context: { workoutFamily; workoutIdentity; intendedTargetKind };
    observations: [{
      calendarWorkoutId;
      workoutDate;
      outcome;
      outcomeRevision;
      sessionRpe;
      evidenceState;
      actual: {
        durationMin; distanceKm; averageHeartRate; maximumHeartRate;
        averagePower; maximumPower; averageCadence; elevationGainMetres;
        elevationLossMetres; intervalCount;
      } | null;
      comparisonStatus;
      missingReasons;
    }];
    relevantFitDays;
    detailChangeEligible;
  }];
  unresolvedOrContradictoryFacts;
}
```

Only dimensions actually present in accepted provider-neutral facts are included; missing is never
zero. Observations are comparable only inside the same factual intended family/identity/target
context. Terrain or another context dimension may be added only after Activity Capture owns a
provider-neutral fact for it; it cannot be inferred from pace or elevation. The decision must not
naively average unrelated session types, terrain or targets and must preserve dates, source
revisions, quality and uncertainty.

A `fact_shaped` detail change requires at least two relevant accepted FIT-backed completed/partial
outcomes on separate days, compatible reported session RPE and no contradictory check-in. This is a
Product floor, not a fitness score. The policy may conservatively change only the affected detail
inside the immutable Blueprint phase and must cite the exact observations used. With insufficient
FIT, the result may still be `blueprint_faithful` or `constraint_only` after a complete check-in; it
must say that no performance adaptation occurred. Missing outcomes, stale/updating evidence or an
unresolved health limitation produce `no_prescription`, never invented facts or an implicit
fallback. No universal fitness coefficient, health/fitness claim, race prediction or promised
finish result is admitted. A future Progress UI may present the same facts; it is not an input owner
or prerequisite.

### Shared Authoring Infrastructure And Persistence

Normal, target/taper/race and the one admitted bridge all use the same path:

```text
Result/Evidence facts + Calendar outcomes + immutable Source lineage
  -> Training Decision V1
  -> continuation-specific authoring brief or no-prescription
  -> existing AI authoring infrastructure
  -> continuation response compiler
  -> immutable reviewed candidate
  -> sealed explicit confirmation
  -> atomic runner-owned Calendar materialisation
```

Initial plan authoring and continuation authoring have distinct typed inputs, prompts and bounded
outputs, but reuse the existing structured request envelope, one admitted provider call, completed
raw-response retention, schema/compiler outcome recording and owner checks. The continuation
response contains exactly the next detailed block. Its strict server compiler must require one
canonical WorkoutDocument per exact projection, validate interval/cardinality, projection/family/
phase/target boundary, sections/repeats/targets and all decision constraints, and reject provider
Blueprint changes, Calendar identity, results or evidence. Raw provider content never reaches
Frontend or becomes authority.

`adaptive_training_detailed_candidates` remains the one candidate store. Before a provider-authored
continuation can be accepted, it needs an owner-bound `source_response_id` relation to the existing
accepted `ai_plan_generation_responses` row; no second table or source store is justified. Its frozen
`input_snapshot` and `input_provenance` record the decision input fingerprint, decision contract and
policy versions, decision-output hash, progress-profile fingerprints, authoring contract/compiler
versions and response ID. Candidate content retains only canonical documents and client-safe
rationale. Existing immutable versions and confirmation lineage supply audit history; no mutable
"current fitness" row is added.

### Lossless Public Journey

The Source public read model adds a client-safe `continuation` union beside projections. It contains
only the Blueprint/confirmation/window identity, exact visible status and missing reasons, data-
quality counts, current input revision, capabilities, candidate ID/version/hash and canonical
WorkoutDocuments plus facts/preferences/conflicts used for review. It excludes the private evidence
packet, actual-metric source rows, provider response, policy internals and persistence types.

Server actions are one ordered family:

1. `submitAdaptiveContinuationInputAction` validates the expected Blueprint/leaf confirmation and
   appends the check-in/preferences revision.
2. `prepareAdaptiveContinuationCandidateAction` reloads the complete current facts, computes the
   deterministic decision, and only for `authoring_ready` performs the one admitted provider call,
   compiles and retains the candidate idempotently. The client cannot supply `asOf`, facts or a
   decision result.
3. Existing `reviewWorkoutCommandAction` reviews
   `adaptive_continuation_candidate` and seals the still-current facts.
4. Existing `confirmWorkoutCommandAction` performs the accepted atomic Calendar materialisation.

`getAdaptiveBlueprintCalendarReadModelForUser()` becomes read-only: remove candidate preparation and
persistence from GET. Frontend renders and invokes these server contracts; it never computes
adaptation, creates details or writes Calendar rows. The projection status vocabulary remains the
accepted five states; provider progress is transient action feedback, not a sixth projection state.

### Dependency Direction And Removal

```text
Activity Capture / Result-Evidence public facts ----+
Runner Calendar public outcomes/occupancy ----------+--> Source orchestration
Immutable Blueprint/confirmation/input revision ----+          |
                                                               v
                                                    Training Decision V1
                                                               |
                                                               v
                                              shared AI authoring infrastructure
                                                               |
                                                               v
                                            compiler -> candidate -> review
                                                               |
                                                               v
                                                    Calendar confirmation

Source client-safe DTO/actions -> route composition -> Frontend
```

Result/Evidence and Calendar import no Source or Training Decision runtime/type. Training Decision
imports only plain public fact and Source contract types, never persistence/provider/route/UI or
Calendar mutation. AI authoring consumes the decision output; it does not call Calendar. Frontend
imports only client-safe DTO/action types. Recursive runtime and type-only graphs must remain
acyclic.

After parity, delete `readCandidateWorkoutDocuments`, `sourceByFamily`, family cursors,
`rebaseSourceDocument` and their section-rekey cloning path from continuation composition. Remove
the preparation/retention call from the GET read model. No adapter, alias, static race recipe,
projection-as-workout, client fallback, second Calendar writer or compatibility path remains.

### Serial Delivery, Proof And Rollback

1. **BACKEND — decision, authoring and persistence contract.** Add the pure versioned Training
   Decision boundary and golden proofs; add the continuation provider schema/compiler through the
   existing authoring infrastructure; bind accepted raw response to the existing candidate row;
   implement the input/prepare/read DTO actions; remove cloning and the side-effectful GET path.
2. **FRONTEND Product — complete runner journey.** After the server DTO/actions are lossless and
   command-ready, add check-in/preferences, explicit missing/data-quality states, candidate review
   and explicit confirmation. Projections remain non-navigable/non-mutable.
3. **BACKEND/QA — managed fixture/readback only where needed.** Inject deterministic provider
   responses through the real request/compiler/retention seam for normal, target/taper/race and one
   bridge. Never seed a candidate, fake a missing family or use a static prescription recipe.
4. **QA — independent Epic acceptance.** Replay the full server-to-Frontend journey after stable
   ownership. Global QA, hosted parity, release and deployment remain separate.

Focused Backend proof covers deterministic decision golden cases; comparable versus unrelated
facts; explicit missingness/quality; the two-relevant-FIT-days plus compatible-RPE gate; no-FIT
Blueprint-faithful and constraint-only paths; stale fingerprint rejection; target/taper/race/normal/
one-bridge compilation; one bounded provider call; raw-response/candidate owner linkage; strict
compiler rejection; idempotency; immutable lineage; no overwrite/collision; atomic confirmation;
and recursive runtime/type-only cycle checks. Frontend proof covers all five statuses, accessible
check-in/review/confirm, stale retry, no projection detail/mutation/evidence action and unchanged
editing of confirmed Calendar workouts.

Rollback before release disables the new prepare action and client admission while leaving accepted
Blueprints, immutable inputs/candidates/confirmations, Calendar workouts and factual evidence intact.
An additive response relation remains inert if retained rows exist; destructive rollback is allowed
only in a disposable zero-row local replay. Stop before provider execution or Frontend handoff if
the decision is not reproducible, factual lineage cannot be frozen, the candidate cannot bind to an
accepted owner response, the compiler cannot cover an exact Blueprint family/target interval, any
private fact crosses the DTO, or either dependency graph cycles.

This architecture decision leaves no unresolved Product choice inside HITO-216. The first owner is
**BACKEND** for the bounded decision/authoring/persistence contract. No implementation, provider
call, database/runtime/browser proof, independent QA, hosted validation, release or deployment was
performed here.

### Exact Next-Owner Prompt

```text
ROLE: BACKEND

Task: HITO-216 — Build Adaptive Four-Week Training
Mode: Tracked
Stage: Dynamic continuation decision, authoring, persistence and public server contract

Read AGENTS.md, agents/backend.agent.md, the live HITO-216 Task, this canonical technical decision,
and only the direct Source Authoring, Result/Evidence public facts, Runner Calendar public packets,
existing AI authoring/retained-response/compiler, adaptive candidate persistence and signed
review-confirm seams named here. Preserve unrelated dirty work.

Implement one bounded Backend slice:
1. Add the pure, versioned Training Decision module with ContinuationDecisionInputV1,
   ContinuationProgressProfileV1, ContinuationDecisionResultV1 and deterministic golden proofs. It
   must have no UI, Calendar mutation, provider, persistence, route or private-source dependency.
2. Replace first-horizon WorkoutDocument family cloning with a continuation-specific typed authoring
   brief, strict provider response contract and compiler that reuse the existing one-call authoring,
   completed raw-response retention and outcome-recording infrastructure. Use injected responses in
   proof; do not call a live provider.
3. Bind every provider-authored continuation candidate to its accepted owner response in the
   existing immutable candidate store, freezing decision/policy/compiler versions and all factual
   fingerprints. Add no second store, plan, Calendar writer or compatibility representation.
4. Add lossless server actions/read DTOs for check-in/preferences, explicit candidate preparation,
   existing signed review and explicit confirmation. Make the Calendar projection GET path
   read-only.
5. After focused parity proves normal, target/taper/race and one bridge, remove the old family
   clone/rebase/rekey path and its read-side preparation consumer. Do not retain an adapter or
   fallback recipe.

Preserve Blueprint projections as non-workouts and Calendar ownership only after reviewed explicit
confirmation. Prove comparable-context facts, explicit missingness, two relevant FIT days plus
compatible RPE before fact-shaped detail changes, no-FIT Blueprint-faithful/constraint-only output,
staleness, private-response ownership, compiler rejection, idempotency, RLS/type parity, atomic
confirmation and recursive runtime/type-only acyclicity. Do not implement Frontend, fixture/browser
QA, hosted work, deployment or release. On success, atomically return the same HITO-216 Task to
FRONTEND with one exact unchanged-edge prompt; return any new Product decision or unsafe external
authority to PRODUCT.
```

# AI First-Plan Envelope Production Adoption And Prompt Simplification

## Status

completed

## Type

plan

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Close out the internal non-default `ai-first-plan-envelope-v1` structured-draft option and archive this plan.

## Stage

ARCHITECT closeout / envelope internal option complete

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Create a separate future plan only if Hito is ready to evaluate `ai-first-plan-envelope-v1` beyond internal non-default use.

STAGE:
ARCHITECT future planning / envelope production-default switch gate

CONTEXT:
- Source path: docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md
- The completed production blueprint wave is archived at docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md.
- This plan is complete and archived.
- The current approved state is internal/server-owned non-default `ai-first-plan-envelope-v1` structured-draft support only.
- Production first-plan generation remains `ai-first-plan-blueprint-v1`.
- QA passed review/confirm exactness for the internal envelope option on disposable local persistence seams.
- No production switch, runner-facing option, frontend change, DB/schema change, active-plan refresh change, or blueprint deletion is approved.

GOAL:
If the product now needs more than internal/backend envelope use, create a new active plan for the next risk class instead of reopening this archived plan.

ROOT CAUSE AND ARCHITECTURE FIT:
- The internal option objective is complete.
- A production/default switch is a different rollout risk and needs its own architecture plan, rollback gate, QA gate, and Running Coach gate.
- The production default must remain blueprint unless a new plan explicitly approves a staged switch.

REQUIREMENTS:
- Do not reopen this plan for incremental rollout work.
- Create a separate plan for any selected production/internal pilot or default-switch proposal.
- Preserve blueprint as production default and rollback path.
- Keep envelope hidden from runner-facing UI unless a new plan approves exposure.
- Keep current docs limited to implemented behavior.

WHAT NOT TO DO:
- Do not switch production default away from `ai-first-plan-blueprint-v1`.
- Do not expose a runner-facing option.
- Do not change frontend, DB/schema, active-plan refresh, public onboarding, or persisted schema.
- Do not delete or weaken blueprint modules, fixtures, validators, traces, or rollback route.
- Do not persist raw prompts or full AI payloads.

OUTPUT:
1. Task
2. Stage
3. Decision
4. New plan created, if any
5. Scope approved
6. Scope still forbidden
7. Validation requirements
8. Blockers
```

## Owner

ARCHITECT / BACKEND / QA / RUNNING COACH

## Last Updated

2026-06-04

## Context

The production blueprint first-plan wave is complete and archived. That wave proved the row-level
`ai-first-plan-blueprint-v1` path can generate, review, confirm, persist, and render safe first
plans with stronger coaching richness.

The `ai-first-plan-envelope-v1` foundation now exists as an internal/server-owned non-default
structured-draft option. It was explicitly not adopted as the production default. Envelope
production/default adoption remains a separate architecture decision because it changes the AI
contract shape, prompt/output strategy, and rollout risk class.

## Problem Definition

The current production blueprint path is reliable enough to archive the completed wave, but it still
has architectural pressure:

- row-level blueprint requests can remain verbose
- long-horizon generation still uses a bounded AI window plus backend extension
- future prompt/output simplification should not be mixed with already QA-green production blueprint
  behavior
- envelope adoption could improve reliability, but it must not regress coaching richness or safety

## Current Contract Comparison

`ai-first-plan-blueprint-v1` is the current production path:

- live structured first-plan review uses blueprint by default
- OpenAI authors weekly row-level workout intent for a bounded opening window
- backend validates taxonomy, cadence, rest-day, metric, safety, and completeness rules
- backend expands accepted blueprint workouts into canonical `training-plan-v2` rows
- long-horizon plans use a safe AI-authored window plus backend extension
- review/confirm signs and persists the exact reviewed canonical plan
- invalid, timeout, partial, or unavailable blueprint attempts return non-mutating unavailable
  metadata
- deterministic `structured_authoring_v1` is not accepted as successful structured first-plan truth

`ai-first-plan-envelope-v1` is currently internal/non-default:

- schema/types exist in `src/lib/ai-first-plan-envelope-schema.ts`
- decode/validation exists in `src/lib/ai-first-plan-envelope-decode.ts`
- backend-owned expansion exists in `src/lib/ai-first-plan-envelope-expand.ts`
- trace/readability helpers exist in `src/lib/ai-first-plan-envelope-trace.ts`
- mock policy exists in `src/lib/ai-first-plan-envelope-policy.ts`
- `npm run author-ai-first-plan-draft -- --contract envelope` can expand mock envelopes into
  canonical `training-plan-v2`
- explicit live envelope mode exists through internal/ops paths and makes no production switch
- `generateStructuredFirstPlanDraftForUser(..., { internalDraftContract: "envelope" })` is the
  internal/server-owned structured-draft seam
- doctrine proves long-horizon mock expansion, fixed rest days, preferred long-run day, full row
  coverage, rich fields, metric gates, invalid envelope failures, and smaller output than bounded
  row-level blueprint fixtures
- live ops proof on `marathon-target-long` returned a compact `ai-first-plan-envelope-v1`, decoded
  and expanded it to canonical `training-plan-v2`, and reported `persisted: false`
- QA Slice 5 proved no mutation before confirm and exact reviewed-plan persistence after explicit
  confirm on disposable local persistence seams

Adoption risk:

- envelope is strategically better aligned with backend-owned row/slot interpretation
- envelope has now produced live OpenAI-authored ops/comparison output and passed internal
  reviewed-draft confirm exactness
- envelope expansion still relies on backend deterministic scaffolding; QA and Running Coach have
  passed the non-mutating matrix only after road-specificity and balanced-half refinements
- replacing the blueprint default remains a separate risk class even after internal exactness QA
  because the current public production path is QA-green

## Architecture Decision

Decision update, 2026-06-03: choose Option A.

Envelope may move from ops-only comparison into an internal non-default structured-draft option.

Final decision update, 2026-06-04: choose Option A for closeout.

The active plan is complete for the current objective. The internal non-default envelope option is
ready for backend/internal use, production default remains `ai-first-plan-blueprint-v1`, and any
selected rollout, public exposure, or default switch must be planned in a separate future plan.

This approval is bounded:

- production default remains `ai-first-plan-blueprint-v1`
- envelope is enabled only through an explicit internal/server-side option or flag
- no runner-facing choice is exposed
- no production switch, persistence schema change, frontend change, public onboarding change, or
  default onboarding behavior change is approved
- rollback remains trivial by disabling the option and returning all structured first-plan generation
  to blueprint

Selected direction:

`blueprint remains default -> live envelope ops proof -> side-by-side QA/Running Coach comparison -> internal non-default draft option -> disposable confirm/save proof -> rollout decision`

Decision rationale:

- BACKEND proved the live envelope ops path without mutation.
- QA passed the non-mutating matrix and regression checks.
- Running Coach initially blocked road-goal quality, which was the correct gate; after backend
  specificity fulfillment, 5K/10K specificity became visible, low-support marathon stayed
  conservative, and balanced half now shows `controlled_tempo_session: 1` plus
  `half_marathon_threshold_durability: 2` across Build and Specific phases.
- The next risk to retire is not production default adoption. It is whether envelope can safely
  produce an internally reviewable structured first-plan draft while preserving the exact same
  review/confirm and non-mutating failure boundaries.

Rejected near-term directions:

- keep envelope non-live indefinitely: too passive; it does not answer whether the simpler contract
  reduces real OpenAI fragility
- keep envelope ops-only after QA/Running Coach pass: too conservative; it blocks the next bounded
  evidence gate
- promote envelope for low-risk fixtures immediately: too early because reviewed-draft exactness is
  unproven
- replace blueprint default now: unsafe because blueprint is QA-green and envelope has no internal
  draft/confirm exactness proof
- progressive background generation: out of scope; it would complicate review/confirm semantics
  before the compact contract itself is proven

## Scope

- production adoption planning for `ai-first-plan-envelope-v1`
- prompt/output simplification
- migration from row-level blueprint where safe
- side-by-side or feature-flag strategy
- debug/trace readability for compact envelope output
- QA and Running Coach acceptance gates

## Non-Goals

- no production switch without QA gates
- no persistence or schema changes unless a later implementation slice proves they are required
- no frontend changes in the architecture decision slice
- no weakening of `ai-first-plan-blueprint-v1` safety or fallback behavior
- no deletion of the production blueprint path until envelope replacement is proven
- no advanced-performance cadence work in this plan
- no calendar/admin polish in this plan
- no raw prompt or raw AI payload persistence
- no `structured_authoring_v1` fallback success path

## Suggested Slice Order

1. BACKEND Slice 1: live envelope ops/comparison proof. Completed 2026-06-03.
   Keep production onboarding on blueprint. Add explicit live envelope authoring only to the ops path,
   validate/decode/expand through backend-owned envelope modules, and print bounded side-by-side
   comparison metadata.
2. QA Slice 2: non-mutating fixture matrix. Passed 2026-06-03.
   Run mock/live envelope checks for beginner, 5K, 10K, half, marathon, ultra, mountain, target-date
   long horizon, fixed rest days, preferred long-run day, with/without benchmark, with/without age,
   and failure paths. Compare against current blueprint outputs and prove `persisted: false`.
3. RUNNING COACH Slice 3: coaching-quality comparison. Passed 2026-06-03 after specificity
   fulfillment and balanced-half refinement.
   Review decoded envelope intent and expanded canonical plans against blueprint evidence. Judge
   weekly rhythm, variety, progression, recovery, goal specificity, and whether backend expansion
   feels coach-authored rather than mechanical.
4. BACKEND Slice 4: internal non-default structured-draft option. Completed / QA-passed 2026-06-03.
   Expose envelope behind an explicit server-side feature flag or backend option for
   disposable/internal structured first-plan draft generation. Blueprint remains default and rollback
   must remain trivial.
5. QA Slice 5: review/confirm exactness for flagged envelope draft. Completed / QA-passed 2026-06-04.
   Prove no mutation before review, exact reviewed-draft persistence after confirm, source metadata,
   fixed rest days, long-run day, recovery-first sequencing, rich fields, metric gates, and cleanup.
6. ARCHITECT Slice 6: rollout decision. Completed 2026-06-04.
   Decision: close/archive this plan. Keep envelope internal/non-default. Move any production/default
   switch into a separate future plan/backlog item.

## QA Expectations

- invalid/timeout/partial envelope output must remain non-mutating
- no `structured_authoring_v1` success fallback leak
- reviewed draft must persist exactly after confirm
- fixed rest days, preferred long-run day, recovery-first sequencing, metric gates, and rich fields
  must stay intact
- debug artifacts must show human-readable decoded envelope intent without raw prompts or secrets

Additional QA expectations:

- blueprint default behavior must remain unchanged while envelope is ops-only
- `--contract envelope --live` must be explicit and non-persistent
- live envelope failure must return bounded `envelope_unavailable` metadata, not a reviewable plan
- envelope-expanded canonical rows must preserve:
  - fixed rest days
  - preferred long-run day
  - recovery-first next running slot after long runs
  - run/walk adaptation for true beginners
  - beginner/recreational cadence ladder
  - supported half/marathon specificity rules
  - default HR / pace gates
  - no fake personalized HR
  - no unsupported exact pace
- comparison output must include readable decoded envelope intent and canonical identity/family
  counts without leaking raw prompts or full model payloads

## Slice 1 Backend Proof

Implemented 2026-06-03:

- Added an ops-only live envelope prompt/Responses API path behind explicit
  `npm run author-ai-first-plan-draft -- --live --contract envelope`.
- Production structured first-plan onboarding remains on `ai-first-plan-blueprint-v1`; no
  `generateStructuredFirstPlanDraft`, frontend, DB, review/confirm, persistence, or active-plan
  refresh behavior was changed.
- Live envelope proof command:
  `npm run author-ai-first-plan-draft -- --live --contract envelope --fixture marathon-target-long --timeout-ms 120000 --max-output-tokens 6000 --trace-blueprint`
- Live proof result:
  `ok: true`, `sourceKind: ai_first_plan_envelope_v1`,
  `sourceStatus: expanded_from_envelope`, `fallbackReason: null`, `validationIssueCount: 0`,
  `persisted: false`, `weekCount: 29`, `workoutCount: 203`, `nonRestCount: 145`.
- Live size proof:
  envelope prompt estimate `5848` chars, live output `1245` chars / `323` output tokens, compared
  with bounded blueprint prompt estimate `18700` chars and bounded blueprint output `35841` chars
  for the same fixture.
- Safety proof:
  fixed rest violations `0`, preferred long-run day violations `0`, recovery-first-after-long-run
  violations `0`, pace target gate violations `0`, personalized-HR-without-zone-truth violations
  `0`.
- Failure-path proof:
  `--mock-invalid --contract envelope`, `--mock-timeout --contract envelope --timeout-ms 20`, and
  `--mock-partial --contract envelope --fixture marathon-target-long` all return bounded
  `envelope_unavailable` metadata with `persisted: false`.
- Blueprint preservation proof:
  `--mock-openai --contract blueprint --fixture marathon-target-long --trace-blueprint` still
  returns `sourceKind: ai_first_plan_blueprint_v1`; blueprint invalid/timeout/partial mocks remain
  bounded `blueprint_unavailable` states with deterministic fallback unused.
- Git diff gate follow-up 2026-06-03:
  the earlier `git diff` / `git diff --check` hang was investigated as a worktree tooling incident.
  No repo config, textconv/filter, rename pair, generated artifact, binary path, or single changed
  file was found as a persistent blocker. After bounded path diagnostics and cleanup of stale orphan
  diff processes, `git diff --name-only`, full `git diff --check`, and targeted envelope
  `git diff --check` all returned successfully. Slice 1 is ready for QA validation.

## Road Specificity Refinement

Implemented 2026-06-03:

- Added a non-live envelope-only backend fulfillment pass that maps compact road-goal intent to
  existing canonical workout builders after the structured scaffold is generated and before final
  validation.
- The refinement reuses existing normalized authoring truth, quality-day placement, workout
  builders, rich-row finalization, metric gates, and envelope validation; it does not introduce a
  second workout taxonomy or a parallel persistence path.
- 5K envelope intent can now fulfill supported Build/Specific rhythm through
  `5k_sharpening_repeats` where support evidence allows it.
- 10K envelope intent can now fulfill supported Build/Specific rhythm through
  `10k_rhythm_intervals` where support evidence allows it.
- Balanced half-marathon envelope intent can now expose at least one safe
  `half_marathon_threshold_durability` row when support evidence and spacing allow it.
- Low-support marathon target-date envelope output remains conservative; the refinement records an
  explicit preservation downgrade rather than adding midweek load.
- Ultra and mountain/trail envelope outputs remain unchanged and continue to rely on existing
  terrain-specific scaffold identities.
- Envelope trace metadata now includes bounded declared-to-fulfilled specificity proof:
  fulfilled identities, phase/week/date samples, safety downgrades, and generic-support collapse
  counts. It still excludes raw prompts, secrets, and full model payloads.
- Production structured onboarding remains on `ai-first-plan-blueprint-v1`; no frontend, DB,
  review/confirm, persistence, or active-plan refresh behavior changed.

## Balanced Half Specificity Follow-Up

Implemented 2026-06-03:

- Running Coach accepted the 5K, 10K, low-support marathon, ultra, and mountain/trail envelope
  specificity refinement, but blocked balanced half-marathon because the proof still had only one
  `controlled_tempo_session` plus one late `half_marathon_threshold_durability`.
- Root cause: the envelope specificity fulfillment seam intentionally limited half-marathon
  candidate weeks to a single Specific-phase week. That kept the first slice safe, but it prevented
  supported balanced half-marathon intent from being fulfilled earlier in the Build phase.
- Updated the envelope-only half-marathon candidate selector to prefer one Build-phase and one
  Specific-phase fulfillment week when safe.
- The fulfillment loop still preserves cutback, taper, non-long-run slot selection, rich-row
  finalization, metric gates, and final validation.
- Balanced-half proof now shows `controlled_tempo_session: 1` and
  `half_marathon_threshold_durability: 2`, fulfilled on weeks `3` and `5`, with `persisted: false`.
- Regression proof preserved 5K `5k_sharpening_repeats`, 10K `10k_rhythm_intervals`,
  low-support marathon `marathon_low_support_preservation`, and ultra/mountain terrain identity
  preservation.
- Production structured onboarding remains on `ai-first-plan-blueprint-v1`; no frontend, DB,
  review/confirm, persistence, or active-plan refresh behavior changed.

## Internal Non-Default Draft Option Gate

Architect decision, 2026-06-03: approved for BACKEND implementation.

Closeout update, 2026-06-03: BACKEND implementation is complete and QA-passed.

Approved scope:

- add an explicit internal/server-side option or flag for envelope draft generation
- keep production structured first-plan default on `ai-first-plan-blueprint-v1`
- keep envelope hidden from runner-facing UI and public onboarding controls
- keep review-before-create semantics; envelope-generated draft metadata remains `persisted: false`
  until confirm is explicitly tested in the later QA gate
- preserve source metadata:
  - `sourceKind: ai_first_plan_envelope_v1`
  - `sourceStatus: expanded_from_envelope`
  - `persisted: false`
- preserve blueprint modules, fixtures, validators, traces, default path, and rollback route
- preserve fixed rest days, preferred long-run day, recovery-first sequencing, run/walk adaptation,
  cadence ladder, half/marathon specificity, metric gates, and bounded invalid/timeout/partial
  failure behavior

Forbidden in this slice:

- production default switch
- runner-facing choice or frontend UI
- persistence schema change
- active-plan refresh change
- deletion or weakening of the blueprint path

Implementation update, 2026-06-03:

- Added an explicit internal/server-owned structured draft option:
  `generateStructuredFirstPlanDraftForUser(..., { internalDraftContract: "envelope" })`.
- Public `generateStructuredFirstPlanDraft` route input remains unchanged and still defaults to
  `ai-first-plan-blueprint-v1`.
- `generateAiFirstPlanDraftPreview` now owns `blueprint`, `strict_draft`, and `envelope`
  contracts so envelope structured drafts do not depend on a parallel ops-only generation path.
- `npm run author-ai-first-plan-draft -- --contract envelope` now exercises the shared draft-service
  envelope contract and still remains non-mutating.
- Valid internal envelope drafts return:
  - `sourceKind: ai_first_plan_envelope_v1`
  - `sourceStatus: expanded_from_envelope`
  - `persisted: false`
- Invalid, timeout, partial, malformed, or unsafe envelope output returns bounded
  `ai_first_plan_envelope_unavailable` / `envelope_unavailable` metadata and does not produce a
  reviewed-plan token.
- Confirm accepts only signed reviewed drafts from supported AI first-plan sources:
  `ai_first_plan_blueprint_v1` with `ai_authored` / `repaired_ai_draft`, or
  `ai_first_plan_envelope_v1` with `expanded_from_envelope`.
- The envelope path persists no raw prompt, no raw AI payload, and no deterministic
  `structured_authoring_v1` success fallback.
- Doctrine now proves blueprint default preservation, internal envelope structured-draft success,
  envelope invalid/timeout bounded failures, and envelope trace availability.
- Mock envelope matrix passed for `balanced-half`, `five-k-short`, `ten-k-short`,
  `marathon-target-long`, `ultra-trail`, and `mountain-trail`; all returned `persisted: false`.
- Live non-mutating envelope smoke for `marathon-target-long` passed with `gpt-4.1-mini`,
  `sourceStatus: expanded_from_envelope`, `validationIssueCount: 0`, 29 weeks, 203 rows, and
  `persisted: false`.

QA closeout, 2026-06-03:

- Default blueprint preservation passed:
  - `sourceKind: ai_first_plan_blueprint_v1`
  - `sourceStatus: repaired_ai_draft`
  - `validationIssueCount: 0`
  - `persisted: false`
  - 29 weeks / 203 rows / 145 non-rest rows
- Internal envelope option passed:
  - `sourceKind: ai_first_plan_envelope_v1`
  - `sourceStatus: expanded_from_envelope`
  - `fallbackReason: null`
  - `validationIssueCount: 0`
  - `persisted: false`
- Envelope matrix passed for:
  - `balanced-half`
  - `five-k-short`
  - `ten-k-short`
  - `marathon-target-long`
  - `ultra-trail`
  - `mountain-trail`
- Live envelope `marathon-target-long` smoke passed with 29 weeks / 203 rows / 145 non-rest rows.
- Envelope invalid, timeout, and partial paths remain bounded `envelope_unavailable`.
- No public onboarding contract selector was exposed.
- No raw prompt, full payload, or secrets were exposed.
- Build passed.

Forbidden boundaries after Slice 4:

- production default switch
- runner-facing option
- frontend change
- DB/schema change
- active-plan refresh change
- blueprint deletion or weakening
- successful `structured_authoring_v1` fallback
- raw prompt, secret, or full AI payload persistence

Decision on next gate, 2026-06-03: choose Option A.

Proceed to QA Slice 5: review/confirm exactness for the internal envelope option.

This next step is validation-only and remains bounded:

- no production switch
- no frontend rollout
- no runner-facing option
- no DB/schema change
- no active-plan refresh change
- no blueprint deletion or weakening
- no raw prompt or full payload persistence

The gate should prove no mutation before review, exact reviewed-plan persistence after confirm,
explicit envelope source metadata, safety/coaching invariants, failure-path preservation, and
disposable data cleanup.

Still forbidden:

- successful `structured_authoring_v1` fallback for structured first-plan creation
- raw prompt, secret, or full AI payload persistence
- broad rewrite of first-plan draft service

Completion evidence for BACKEND Slice 4:

- default structured first-plan draft generation remains blueprint when no internal option is passed
- envelope option can be invoked only through an explicit internal/server-side path
- envelope draft returns explicit envelope source metadata and `persisted: false`
- invalid, timeout, malformed, partial, or unsafe envelope output returns bounded non-mutating failure
  metadata
- rollback is documented as disabling the flag/option
- tests/fixtures prove blueprint default preservation and envelope-option isolation
- QA passed the internal option matrix, live marathon smoke, bounded failures, safety/metric/coaching
  regressions, `git diff --check`, and build

## QA Slice 5 Review/Confirm Exactness Closeout

QA-passed 2026-06-04.

Validated scope:

- QA validated through backend/service/CLI and disposable local persistence seams.
- Browser was not required because public onboarding still exposes no runner-facing envelope selector.
- Production default remains `ai-first-plan-blueprint-v1`.
- Envelope remains an internal/server-owned non-default option.

Evidence:

- Envelope draft creation remains `persisted: false`.
- Before explicit confirm, runner profile, plan cycle, planned workout, workout log, and review
  persistence counts stayed unchanged.
- Real disposable confirm/apply passed:
  - `ok: true`
  - `status: created`
  - `sourceKind: ai_first_plan_envelope_v1`
  - `onboardingContract: structured_first_plan_onboarding_v1`
- Persisted rows matched the reviewed canonical expanded plan exactly:
  - `exactRowMatch: true`
  - `exactRowCount: 84`
  - `expectedRowCount: 84`
  - `workoutCount: 60`
- Second confirm was blocked with `reason: active_plan_exists` and did not duplicate rows.
- Persisted surface did not store raw prompt, raw payload, or secrets.
- Source metadata stayed bounded and auditable.
- Invalid, timeout, and partial envelope failures produced no reviewed draft token and were not
  confirmable.
- Blueprint default/public path remains unchanged.
- Build, doctrine, lint, mock CLI, `git diff --check`, and disposable persistence proof passed.

Final rollout decision:

- Option A selected.
- Mark this plan complete for the current objective.
- Keep internal non-default envelope option available for backend/internal use.
- Keep production default on `ai-first-plan-blueprint-v1`.
- Move any production/default switch, runner-facing option, or selected rollout into a separate
  future plan/backlog item.

## Running Coach Gate

Running Coach approval is required before any structured-onboarding envelope option can move beyond
internal/non-default use.

Current status, 2026-06-03:

- Running Coach gate is passed for the internal non-default draft option only.
- This does not approve selected rollout, public onboarding exposure, or production default switch.

Running Coach should evaluate:

- whether the envelope-authored phase/rhythm intent looks like a real training plan
- whether backend-expanded rows preserve the intended coaching shape
- whether long-horizon extension feels less mechanical than the row-level blueprint tail
- whether goal-family specificity remains credible for 5K, 10K, half, marathon, ultra, and
  mountain/trail
- whether beginner and low-support plans remain conservative
- whether recovery/cutback/taper weeks are purposeful rather than filler
- whether metric guidance remains honest and non-medical

Running Coach must not run SQL/build/ops validation for this gate; their job is training quality
review from decoded traces, plan summaries, and saved-mode/calendar/detail evidence prepared by QA.

## Rollout And Rollback Strategy

Current archived state:

- steps 1 through 4 are complete
- review/confirm exactness proof is complete
- this plan stops before selected rollout or production default switch
- envelope remains internal/server-owned and non-default
- blueprint remains production default

Rollout must be staged:

1. ops-only live envelope proof, no persistence
2. side-by-side comparison against blueprint, no user-facing switch
3. internal non-default backend option for disposable testers only
4. review/confirm exactness proof on disposable accounts
5. selected low-risk fixture rollout only if Architect explicitly approves
6. production default switch only after QA and Running Coach gates pass

Rollback:

- keep `ai-first-plan-blueprint-v1` as the default production path until a separate default-switch
  decision is made
- any envelope option must be controlled by a server-side flag or explicit backend option
- disabling the flag must immediately return structured first-plan generation to blueprint
- never delete blueprint modules, validators, traces, or doctrine fixtures until envelope has passed
  a separate replacement/deletion plan
- envelope failure must not fall back to successful `structured_authoring_v1`; it should fail
  bounded or use the existing blueprint default when the flag is off

## Exit Criteria

- production adoption strategy is documented
- implementation slices and QA gates are defined
- no production switch is implied until the gates pass
- live envelope ops proof exists and is non-mutating
- side-by-side envelope vs blueprint evidence exists before any structured onboarding option
- internal non-default structured-draft option exists through the canonical draft service seam
- internal review/confirm exactness proof exists on disposable local persistence seams
- rollback to blueprint default is documented and trivial
- selected rollout and production default switch remain separate future decisions

## Suggested Next Step

No immediate next role in this plan. If Hito wants envelope beyond internal/backend use, create a
separate future plan for a selected rollout or production default switch.

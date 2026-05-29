# AI-Authored First-Plan Pipeline

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

QA

## Task

Validate 29-week first-plan confirm/save exactness after date-controls browser proof passed.

## Stage

QA validation / first-plan confirm-save exactness

## Exact Handoff Prompt

```text
ROLE: QA

TASK:
Validate 29-week first-plan confirm/save exactness after the date-controls browser proof passed.

STAGE:
QA validation / first-plan confirm-save exactness

CONTEXT:
- Source path: docs/plans/active/2026-05-26-ai-authored-first-plan-pipeline.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.
- Date-controls / targetDate persistence browser proof is QA-passed.
- That proof opened a 29-week review successfully but intentionally canceled before confirm.
- Production first-plan generation still uses ai-first-plan-blueprint-v1.
- ai-first-plan-envelope-v1 remains non-live and ops/mock-only.

QA EXECUTION AUTHORITY:
QA must execute this validation directly. Run the required CLI/build/script/browser/dev-server/local
fixture checks needed to prove the scope. Do not return another handoff prompt merely because the
validation uses commands, browser tooling, screenshots, local artifacts, or disposable local/test
fixtures. Do not edit product code or implement fixes; report failures with evidence.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Use the built-in Codex browser first.
- Use only disposable local/test runner data.
- Do not mutate production data.
- Do not validate or wire ai-first-plan-envelope-v1.
- Do not accept structured_authoring_v1 as a successful first-plan result.
- Do not implement fixes.
- If confirm succeeds, verify persisted rows match the reviewed canonical plan as closely as current
  artifacts allow: row count, source_kind, date range, rest days, long-run day, rich fields, and no
  confirm-time OpenAI regeneration.

OUTPUT:
1. Task
2. Stage
3. Browser Path Preflight
4. QA Execution Authority
5. Scope tested
6. Results
7. Persisted exactness evidence
8. Issues found
9. Coverage gaps
10. Screenshot/artifact evidence
11. Verdict: Passed or Failed
```

## Owner

ARCHITECT / BACKEND / QA / RUNNING COACH

## Last Updated

2026-05-29

## Implementation Notes

- 2026-05-26: Backend Slice 1 implemented `src/lib/ai-first-plan-draft-authoring.ts` as a non-live contract/normalizer foundation. The visible structured first-plan path still uses the deterministic generator; no persistence, Voice, refresh/apply, DB schema, or frontend wiring changed in this slice.
- 2026-05-26: Backend Slice 2A implemented `src/lib/ai-first-plan-draft-service.ts` plus `npm run author-ai-first-plan-draft` as the non-mutating OpenAI service/ops seam. Mock and live success modes return bounded source metadata and canonical `training-plan-v2` review samples, while invalid/timeout blueprint modes now return bounded unavailable metadata without saving or wiring direct persistence.
- 2026-05-26: Backend Slice 2B tightened live smoke viability. The service now sends minimal reasoning only to models that support it, caps output tokens, validates that AI drafts cover the full requested horizon with seven calendar rows per week, and tells the model to leave numeric HR fields null so backend HR policy owns defaults. The default `gpt-5` route still timed out for compact smoke at 45s, but the env-routed command `OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --fixture compact-smoke --no-reference --timeout-ms 120000 --max-output-tokens 16000` returned `sourceStatus: ai_authored` with canonical `training-plan-v2`, 14 workouts, no repairs, and no persistence.
- 2026-05-26: Backend Slice 2B reliability fix added bounded request diagnostics and a one-week live diagnostic fixture after QA could not reproduce the two-week compact smoke success. The two-week strict-schema call can still exceed 120s; the documented reproducible live proof is now `OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --fixture one-week-smoke --no-reference --timeout-ms 120000 --max-output-tokens 10000`, which returned `sourceStatus: ai_authored`, canonical `training-plan-v2`, 7 workouts, no repairs, `persisted: false`, `requestPhase: normalized`, and `abortFired: false`.
- 2026-05-26: Backend pivoted the production direction from full strict nested drafts to compact weekly coaching blueprints. `src/lib/ai-first-plan-blueprint-authoring.ts` defines `ai-first-plan-blueprint-v1`; `src/lib/ai-first-plan-draft-service.ts` now defaults the non-mutating ops path to `--contract blueprint`, keeps the strict draft contract behind `--contract strict-draft`, and expands accepted blueprint intent into canonical `training-plan-v2` with backend-owned segment and metric policy. Live `gpt-4.1-mini` compact blueprint smoke returned `sourceStatus: ai_authored`, 14 workouts, `persisted: false`, and `requestPhase: normalized` in about 18s; strict compact draft timed out at a 30s comparison cap.
- 2026-05-26: Backend repaired the `ai-first-plan-blueprint-v1` expansion seam after Running Coach rejected generic family-level workout details. Blueprint-authored workouts now expand with identity-aware executable structure for tempo/threshold, interval, hill, trail, ultra, long-run, cutback/taper, recovery, easy, and steady identities while preserving backend-owned metric gates and the non-mutating ops-only boundary.
- 2026-05-26: Backend closed the remaining blueprint identity coverage gap before broad onboarding review. Dedicated expansion now covers 5K sharpening repeats, 10K rhythm intervals, race-pace sessions, taper tune-ups, marathon steady specificity, controlled downhill durability, hike-run endurance, and mountain long-run time-on-feet; `npm run author-ai-first-plan-draft -- --mock-openai --fixture identity-coverage --coach-sample` prints a bounded coach-facing segment artifact for these identities without prompts, secrets, raw AI payloads, persistence, or frontend wiring.
- 2026-05-27: Backend wired `ai-first-plan-blueprint-v1` into the structured first-plan draft/review seam. `generateStructuredFirstPlanDraft` now attempts the compact blueprint contract, returns bounded source/repair/debug metadata with the reviewed canonical plan when the blueprint passes, and signs that reviewed draft; `confirmStructuredFirstPlanDraft` verifies the reviewed draft token and does not call OpenAI or regenerate.
- 2026-05-27: Backend fixed first-plan confirm exactness after QA found the reviewed canonical plan was still being saved through imported-plan weekday remapping. Structured first-plan confirm now uses a reviewed-draft persistence seam that validates fixed rest days but preserves reviewed calendar rows, rest rows, trailing days, rich fields, steps, goal context, metric mode, icons, targets, and notes without synthetic fixed-rest insertion.
- 2026-05-27: Backend proved live blueprint acceptance through the real structured onboarding draft path. The blueprint prompt now includes exact required date/weekday slots and the response schema requires the validated weekly running-day count while excluding rest identities from authored workouts; the long-run progression validator now permits safe post-cutback rebounds against the pre-cutback peak. A linked-DB disposable first-plan smoke with `OPENAI_PLAN_MODEL=gpt-4.1-mini` returned `sourceStatus: repaired_ai_draft` with only bounded taxonomy canonicalization repairs, persisted all 84 reviewed rows exactly, preserved the 2026-08-19 end date, kept 84 rich rows, and made zero OpenAI calls during confirm.
- 2026-05-27: Backend fixed the half-marathon target-time richness gap before broad rollout. Road-performance 5K/10K/half-marathon target-time blueprints now receive backend-required quality slots and validation enforces a week-aware interval/tempo/threshold/race-rhythm cadence when runner support allows it, so early weeks cannot collapse into only easy/steady/recovery/long filler. A linked-DB half-marathon target-time smoke returned `sourceStatus: repaired_ai_draft`, `sourceKind: ai_first_plan_blueprint_v1`, `validationIssueCount: 0`, and first-six-week identities including `controlled_tempo_session`, `half_marathon_threshold_durability`, `distance_intervals`, `long_run_with_steady_finish`, and `time_intervals`; confirm persisted all 84 reviewed rows exactly with zero OpenAI calls. The same slice tightened compact-only import inference so the reference half-marathon JSON preserves tempo, interval, race-rhythm, and taper tune-up identities instead of falling back to generic quality/support labels. The accepted full half-marathon live draft still took about 104.5s on `gpt-4.1-mini`, so broad frontend rollout still needs a latency/product decision even though the backend quality gate now passes.
- 2026-05-27: Backend generalized the half-marathon cadence fix into a universal `ai-first-plan-blueprint-v1` goal-family identity matrix. The blueprint prompt now exposes allowed, support, quality, long-run, cutback/taper, specialty, and excluded identities for beginner/consistency, 5K, 10K, half marathon, marathon, ultra, and mountain/trail goals; validation rejects excluded or generic identities, enforces required cadence slots when support level allows, preserves beginner/low-support easy-first behavior, and falls back instead of accepting plans that collapse into generic support filler. Doctrine fixtures now cover the first six weeks for all supported families, including quality cadence, long-run cadence, safe beginner distribution, ultra durability, mountain/trail specialty, and reference JSON variety preservation.
- 2026-05-27: Backend added bounded blueprint pipeline trace observability without changing generation behavior. Blueprint attempts now carry a safe `blueprintTrace` through the non-mutating draft metadata and `npm run author-ai-first-plan-draft -- --trace-blueprint`, showing setup summary, model/timeout/source status, required cadence slots, authored blueprint identity/family/icon tables before normalization, validation issue codes, repair notes, normalized canonical identity tables, final reviewed-plan identity counts, and fallback/unavailable boundaries without printing raw prompts, secrets, or full AI payloads.
- 2026-05-27: Backend fixed supported balanced half-marathon blueprint cadence after live trace showed `requiredCadenceSlots: []`. Supported balanced half plans now get moderate half-specific cadence slots from Week 2, use safer progression/tempo/threshold options than target-time plans, reject generic early support filler, and expose first-six-week cadence detail in the bounded ops trace.
- 2026-05-27: Backend removed deterministic `structured_authoring_v1` fallback as a supported structured first-plan creation result. `generateStructuredFirstPlanDraft` now returns a non-mutating `ai_first_plan_blueprint_unavailable` retry/failure state for invalid, timed-out, or unavailable blueprint attempts, confirm rejects non-blueprint reviewed drafts, the legacy direct structured create action is blocked, and blueprint ops invalid/timeout modes report unavailable metadata rather than successful deterministic fallback.
- 2026-05-27: Backend live proof for blueprint-only marathon creation passed after using a longer bounded window for the full default marathon horizon: `sourceStatus: repaired_ai_draft`, `fallbackReason: null`, `validationIssueCount: 0`, `deterministicFallbackBoundary.used: false`, zero OpenAI calls during confirm, and 112 persisted rich planned-workout rows with `source_kind: ai_first_plan_blueprint_v1`. A separate 120s live timeout and a mocked invalid blueprint both returned non-mutating unavailable/failure metadata with zero persisted rows.
- 2026-05-27: QA closed the blueprint-only structured first-plan release gate. Invalid and timeout blueprint attempts now return `draft_failed / ai_first_plan_blueprint_unavailable` without a draft token, reviewed canonical plan, deterministic fallback draft, or mutation; legacy direct structured creation is blocked with `review_required`; confirm rejects tampered non-blueprint reviewed drafts with `invalid_draft`; and a live marathon-balanced first-plan path saved 112 reviewed/persisted rich rows with `sourceKind: ai_first_plan_blueprint_v1`, `sourceStatus: repaired_ai_draft`, `fallbackReason: null`, `validationIssueCount: 0`, `deterministicFallbackBoundary.used: false`, and zero OpenAI calls during confirm. The next gate is runner-facing Running Coach visual/product-quality review of saved blueprint plans, not another backend patch.
- 2026-05-28: Backend added `npm run seed-ai-first-plan-blueprint-proof` as an ops-only saved visual proof path for QA. The helper requires an existing disposable tester, calls the live `ai-first-plan-blueprint-v1` contract with deterministic fallback disabled, saves only accepted blueprint truth, verifies `plan_cycles.source_kind`, reviewed/persisted row count and end date, rich fields, non-rest steps, and `marathon_steady_specificity`, and prints tester login plus cleanup commands without prompts, secrets, or raw AI payloads. The documented visual proof fixture is an honest 8-week marathon-balanced saved-mode artifact for browser QA, not the full default marathon horizon.
- 2026-05-28: Backend fixed marathon and other goal-family required cadence slot placement so required quality is spaced away from the preferred long-run day when another viable running day exists. Sunday-long plans with Monday/Wednesday/Friday/Saturday/Sunday availability now keep Sunday as long run and choose Wednesday or Friday for required marathon specificity instead of forcing Monday quality immediately after the long run.
- 2026-05-29: Backend tightened partial `ai-first-plan-blueprint-v1` response handling for long-horizon structured onboarding. If OpenAI returns structurally valid JSON that omits required weeks or authored workout slots, validation now returns `ai_first_plan_blueprint_incomplete` with bounded completeness metadata (`expectedWeekCount`, `actualWeekCount`, required slot counts, missing week numbers, and first missing dates), keeps deterministic fallback disabled for structured first-plan review, and preserves the non-mutating unavailable state instead of opening a reviewable partial plan.
- 2026-05-29: Backend added bounded long-horizon blueprint authoring for target-date structured first plans. When the requested horizon exceeds the safe AI-authored window, the OpenAI request is capped to the opening 16 weeks, the backend extends the remaining calendar weeks from validated setup truth and Hito-safe progression, and final review only opens after full-horizon coverage/fixed-rest/long-run validation passes. Trace metadata now exposes requested horizon weeks, AI-authored weeks, backend-extended weeks, prompt/final slot counts, before/after prompt size estimates, and final workout count; invalid, timeout, or partial blueprint responses still return non-mutating unavailable metadata with deterministic fallback disabled.
- 2026-05-29: Frontend added explicit structured-onboarding date controls for first-plan setup. The visible form now keeps plan start date and optional target date as controlled `YYYY-MM-DD` fields, sends `schedule.startDate` and `schedule.targetDate` into the draft action payload, validates malformed dates locally, and preserves backend-owned long-horizon authoring/extension behavior.
- 2026-05-29: Frontend closed the date-control browser release blocker by removing conflicting native date-pattern validation from the structured first-plan form, keeping ISO checks in the existing local input builder, and adding a bounded review timeout so `Reviewing draft...` cannot remain indefinitely stuck without a safe failure.
- 2026-05-29: QA closed the structured first-plan date-controls release gate and exact long-horizon browser proof. The built-in Codex browser was used first; direct auth text entry was blocked by missing Browser Use virtual clipboard, so QA stayed in the built-in browser and used a local dev-only cookie helper for a disposable tester session. Safari fallback was not needed. The visible form retained `schedule.startDate = 2026-05-29`, `schedule.targetDate = 2026-12-11`, and target time `3:50:00`; native validation messages were empty. The fresh browser-action artifact `qa-artifacts/debug/2026-05-29/structured-onboarding-browser-action/2026-05-29T19-08-20-405Z-generateStructuredFirstPlanDraft-draft_ready-d9b69c7b33e7.json` proved `targetDatePresent: true`, requested horizon 29 weeks, AI-authored window 16 weeks, backend extension 13 weeks, final required slot count 145, `sourceKind: ai_first_plan_blueprint_v1`, `sourceStatus: repaired_ai_draft`, `fallbackReason: null`, and `deterministicFallbackBoundary.used: false`. The browser review modal opened as `Draft ready` with plan horizon 2026-05-29 to 2026-12-11, 203 planned workouts, Sunday long run, Wednesday/Saturday rest days, and Rolling terrain. QA canceled without confirm/save; no-mutation proof stayed at one runner profile and zero plan cycles, planned workouts, and workout logs before and after review. Command validation passed, including targeted ESLint, doctrine validator, long-horizon blueprint fixture, invalid/timeout/partial blueprint mocks, `git diff --check`, and `npm run build`. Routine screenshots are local-only under `qa-artifacts/screenshots/2026-05-29/first-plan-date-controls-release-qa/`.
- 2026-05-29: Backend completed and QA closed the non-live `ai-first-plan-envelope-v1`
  foundation. The envelope path remains ops/mock-only, is not wired into
  `generateStructuredFirstPlanDraft`, is not persisted, and does not replace production
  `ai-first-plan-blueprint-v1`. QA proved default, long-horizon, invalid, and live-unavailable
  envelope behavior, plus production blueprint preservation and doctrine validation.
- 2026-05-29: The deterministic Nitro public-assets build blocker is closed. Repeated normal builds
  and explicit cold builds passed after the build lifecycle fix; `.output/public/favicon.svg`,
  `.output/public/templates/hito-training-plan-v2-template.json`, and `.output/server/index.mjs`
  were present, and no Nitro public-assets `ENOENT` reproduced.
- 2026-05-28: Backend fixed the browser structured-onboarding action path mismatch with the successful preview seam. Visible first-plan review now uses first-plan-specific blueprint defaults (`OPENAI_FIRST_PLAN_MODEL`, `OPENAI_FIRST_PLAN_TIMEOUT_MS`, `OPENAI_FIRST_PLAN_MAX_OUTPUT_TOKENS`, defaulting to `gpt-4.1-mini`, 240000 ms, and 32000 tokens) instead of inheriting the generic text-plan model route plus 45s service timeout.
- 2026-05-28: Backend added bounded local/dev browser-action trace artifacts for `generateStructuredFirstPlanDraft` attempts under `qa-artifacts/debug/YYYY-MM-DD/structured-onboarding-browser-action/`. The artifact captures sanitized frontend setup shape, parsed setup summary, derived authoring summary, effective model/timeout/token/env source, source status, validation issue codes, cadence slots, normalized identities, and failure layer without raw prompts, secrets, or full OpenAI payloads. A built-in browser proof for the Sunday-long marathon scenario opened the review modal, confirmed the reviewed draft, and saved 112 exact rich `ai_first_plan_blueprint_v1` rows with no deterministic fallback.
- 2026-05-27: QA created a local all-workout-types coverage fixture proving Hito already has a rich canonical workout vocabulary and UI/detail rendering surface for 11 workout families and 29 identities. The disposable local account `qa-all-workout-types-20260527@local.test` imported `QA All Workout Types Coverage Plan` with 42 rich workouts, Friday/Sunday fixed rest days, Saturday preferred long-run placement, and no non-rest workouts without segments. Routine screenshots live under ignored local artifacts at `qa-artifacts/screenshots/2026-05-27/all-workout-types-coverage/`; this evidence supports taxonomy/UI coverage only and does not approve broad rollout by itself.
- 2026-05-27: Frontend polished saved-mode `marathon_steady_specificity` presentation without changing backend generation or persisted identity. Calendar month cells now read `Marathon`, workout detail reads `Marathon steady`, color leans durability/long rather than tempo/quality, and the glyph remains steady so marathon-specific durability work is distinguishable from generic steady without implying race-pace overreach.

## Problem Statement

Hito first-plan creation is safe, but it is still built around a deterministic generator that often behaves like a slotter:

- structured setup is validated well, but normal first-plan structure is mostly generated by `buildStructuredAuthoringPlan`
- OpenAI currently extracts intent for text authoring and can enrich rich workout structure after a deterministic skeleton exists
- the rich draft seam cannot add, remove, move, or reorder workouts, so it cannot truly design weekly microcycles
- easy, steady, long, and support-day variety has improved, but the architecture still encourages patching the deterministic generator every time coaching quality feels thin
- the visible result can still feel like repeated Easy / Steady / Long weeks instead of a coach-authored week-by-week plan

The desired product model is simpler:

`runner data + Hito schema/terminology + constraints + examples -> OpenAI authors a rich full-plan draft -> backend validates/normalizes -> canonical training-plan-v2 -> review -> confirm/save`

This plan replaces the weak deterministic-first authoring pattern for normal structured first-plan creation while preserving every safety boundary that already works.

Reference quality artifact:

- `/Users/ivan/Downloads/ivan_half_marathon_training_plan_v2_full_2026-05-05.json`

That file is not a persistence contract to copy blindly because it includes runtime noise and placeholder fields. It is a quality reference for:

- clear weekly rhythm
- varied workout identities
- tempo / interval / recovery / long / progression / race structure
- detailed warmup / main / cooldown and supporting segment cues
- calendar-ready days
- runner-readable coaching intent

## Current Pipeline Root-Cause Audit

Current structured first-plan pipeline:

1. `StructuredPlanConstructor` collects bounded runner input.
2. `generateStructuredFirstPlanDraft` validates the input in `first-plan-actions.ts`.
3. `buildStructuredFirstPlanAuthoringInput` maps setup answers into `structuredPlanAuthoringInput`.
4. `buildStructuredAuthoringPlan` in `structured-plan-authoring.ts` deterministically creates the full `training-plan-v2` plan.
5. `buildStructuredFirstPlanDraftReview` creates the non-mutating review.
6. `confirmStructuredFirstPlanDraft` rebuilds the same deterministic plan and applies it through `active-plan-persistence`.
7. Saved-mode calendar and workout detail render persisted canonical workout truth.

Where richness is lost:

- the deterministic generator owns workout dates, phase distribution, quality-session placement, long-run progression, and most workout identities
- OpenAI cannot design the week because the current rich-draft seam must obey a prebuilt deterministic skeleton
- rich-draft normalization can improve segment copy and structure, but cannot rethink the weekly plan
- every coaching upgrade becomes another deterministic rule branch, which increases code weight and still tends toward repeated patterns
- the structured path does not use the external reference-style examples as authoring guidance

What should be demoted:

- `buildStructuredAuthoringPlan` should stop being the primary rich author for normal structured first-plan creation
- deterministic weekly slotting should become fallback, repair support, fixture support, and safety comparison support
- current text/refresh rich workout draft logic should not be copied into structured first-plan as-is because it is skeleton-bound

What should stay:

- structured onboarding input validation
- backend-owned review-before-create
- `training-plan-v2` canonical import/persistence/export shape
- rich workout taxonomy and compatibility mapping
- metric gates, including pace gating and default estimated HR labeling
- fixed rest-day invariants
- active-plan schedule edit reflow
- active-plan refresh exact reviewed draft/apply safety
- existing saved-plan readback, calendar, workout detail, export/import compatibility

## New Canonical Pipeline

Target pipeline:

1. Runner submits structured setup.
2. Backend validates runner input and maps it to one bounded authoring context.
3. Backend builds an OpenAI prompt containing:
   - current date
   - runner setup truth
   - Hito canonical `training-plan-v2` terminology
   - allowed workout families, identities, icon keys, segment types, and metric modes
   - fixed rest days and preferred long-run day constraints
   - running-days/week and horizon limits
   - pace/HR/default-HR policy
   - examples of rich week-by-week output based on the reference JSON
   - explicit forbidden runtime fields and fake precision rules
4. OpenAI returns bounded coaching authorship data, not final persisted truth. In v1 this is a
   compact workout blueprint for a bounded window; the target v2 contract should shrink this further
   into a planning envelope and backend-expanded workout rows.
5. Backend validates the AI draft schema and taxonomy.
6. Backend normalizes the draft into canonical `training-plan-v2`.
7. Backend runs deterministic safety validation against the normalized plan.
8. If valid, `generateStructuredFirstPlanDraft` returns a non-mutating review with source metadata.
9. `confirmStructuredFirstPlanDraft` persists only the reviewed canonical plan after checksum/freshness validation.
10. Saved mode stores the same canonical entities and keeps schedule edit/refresh/import/export compatibility.

Canonical rule:

OpenAI authors the plan, but backend owns truth.

## First-Plan AI Contract Simplification Decision

Status: ARCHITECT decision / non-live Slice 7A foundation QA-passed; production adoption pending.

### Current pipeline map

Current browser structured first-plan flow:

1. Frontend `StructuredPlanConstructor` owns controlled setup state for profile, availability,
   benchmark, execution preference, goal, optional start date, optional target date, strength/mobility,
   and comment.
2. Frontend serializes that setup into `generateStructuredFirstPlanDraft`.
3. Backend `first-plan-actions.ts` parses the setup and calls
   `buildStructuredFirstPlanAuthoringInput`.
4. `structured-first-plan-onboarding.ts` derives backend authoring truth:
   start date, target date or default horizon, preferred running days, fixed rest days, preferred
   long-run day, goal style, benchmark support, execution mode, terrain, notes, and runner profile.
5. `ai-first-plan-draft-service.ts` resolves the `blueprint` contract and builds the OpenAI request.
6. `ai-first-plan-blueprint-horizon.ts` now caps long target-date requests to an AI-authored
   opening window, currently 16 weeks, and records requested vs authored vs backend-extended horizon.
7. `ai-first-plan-blueprint-prompt.ts` sends validated setup truth, taxonomy arrays, metric policy,
   goal-family identity policy, and required authored workout slots to OpenAI.
8. OpenAI returns `ai-first-plan-blueprint-v1`: weeks, phase/theme/microcycle intent, and authored
   workout rows with dates, weekdays, family, identity, icon, title, summary, RPE, fatigue, recovery
   priority, segment intent, and metric intent.
9. `ai-first-plan-blueprint-validation.ts` validates schema, taxonomy, dates, slot completeness,
   fixed rest days, goal-family cadence, hard-day density, long-run/taper sanity, and unsafe claims.
10. `ai-first-plan-blueprint-normalize.ts` and expansion helpers turn accepted blueprint rows into
    canonical `training-plan-v2` workouts with backend-owned segments, targets, goal context, metric
    mode, and rich workout fields.
11. `ai-first-plan-blueprint-horizon.ts` extends weeks beyond the AI-authored window from validated
    Hito backend progression rules before review.
12. `generateStructuredFirstPlanDraft` returns a non-mutating review only if source kind is
    `ai_first_plan_blueprint_v1` and status is `ai_authored` or `repaired_ai_draft`.
13. `confirmStructuredFirstPlanDraft` persists exactly the reviewed canonical plan and does not call
    OpenAI or regenerate.

### Brittle points found

- Browser setup truth can break before generation if date inputs are not fully controlled. The
  current frontend date-control slice addresses this, but date state remains a high-risk boundary.
- `targetDate` currently converts into a resolved week count; if far enough out, it can create a
  large authoring horizon.
- V1 prompt construction still serializes verbose taxonomy arrays and exact required slot tables.
- V1 response still asks OpenAI to emit every authored workout row for every AI-authored week.
- Long field names and verbose workout identity strings make prompt/output larger than necessary.
- Required slot serialization repeats date, weekday, long-run flags, quality flags, and identity
  options across weeks.
- AI still owns more row-level interpretation than necessary: exact workout date, weekday, title,
  summary, phase flags, RPE, fatigue, recovery priority, segment intent, and metric intent.
- Backend extension fixed long-horizon timeout risk, but it is a stepping stone: it extends after a
  row-level AI blueprint rather than making backend the primary slot/row owner.
- Failure metadata is now much better, but user-facing copy still collapses timeout, partial, schema,
  and validation failures into one retry message.
- Debug artifacts are readable, but compact protocols will need decoded traces so QA and Running
  Coach can still review human-readable plan intent.

### Options assessed

#### Option 1: Compact Blueprint Protocol

AI receives compact setup, taxonomy, and slot codes. AI returns compact workout codes. Backend decodes
to canonical Hito taxonomy and traces decoded human-readable output.

Pros:

- immediate token reduction
- preserves current row-level blueprint behavior
- smaller change from v1

Cons:

- still asks AI to author every workout row in the authored window
- compact codes can reduce model quality if too opaque
- still requires slot tables unless combined with backend-owned slot generation

Verdict:

Useful as an incremental optimization, but not enough as the target architecture.

#### Option 2: Planning Envelope + Backend Expansion

AI authors the coaching plan shape: phase intent, weekly rhythm, progression intent, goal-family
emphasis, key workout pattern, and optional variation hints. Backend owns exact dates, slots,
long-run placement, cutbacks, taper, metric policy, canonical row expansion, and final workout
identity validation.

Pros:

- largest reduction in prompt/output fragility
- moves canonical interpretation to backend
- keeps AI where it is strongest: coaching rhythm and emphasis
- avoids asking AI to reproduce deterministic calendar slots
- easier to extend long target-date plans

Cons:

- requires a new `ai-first-plan-envelope-v1` contract and backend expander
- backend must be careful not to collapse richness back into generic deterministic filler
- needs Running Coach fixtures to ensure envelope expansion still feels coach-authored

Verdict:

Recommended target architecture.

#### Option 3: Bounded AI Window + Backend Extension

Current direction: AI authors first N weeks, backend extends the rest.

Pros:

- already implemented
- fixes the concrete long target-date timeout class
- preserves current review/confirm and source-kind boundaries

Cons:

- still uses verbose v1 row-level blueprint in the authored window
- backend extension may feel less coach-authored if not guided by richer phase envelope
- does not solve setup/prompt fragility globally

Verdict:

Keep as near-term safety bridge, not final architecture.

#### Option 4: Chunked Generation Before Review

AI authors bounded chunks, backend stitches and validates the full plan before review.

Pros:

- avoids very large single responses
- can preserve row-level AI authorship for full horizon

Cons:

- more OpenAI calls and more failure modes
- harder to make review latency predictable
- stitching conflicts can become a new subsystem
- still keeps AI too involved in exact rows

Verdict:

Backlog only. Do not choose unless envelope expansion fails.

#### Option 5: Progressive Background Generation

Runner can use early weeks while later weeks generate.

Pros:

- could improve perceived latency later

Cons:

- complicates review/confirm because only part of the plan is reviewed
- creates partial-plan persistence and mutation semantics
- conflicts with current explicit review-before-create safety

Verdict:

Future architecture only, not v1/v2 first-plan creation.

#### Option 6: Persistent/System Instruction Or Prompt Caching

Use stable provider-side instructions or prompt caching to reduce repeated taxonomy/policy cost.

Pros:

- may reduce cost/latency
- can coexist with any contract

Cons:

- does not fix output-size fragility
- does not move row ownership to backend
- provider-specific optimization, not product architecture

Verdict:

Optimization later, not the main solution.

### Recommended target architecture

Move from row-level `ai-first-plan-blueprint-v1` toward an envelope-first contract:

`setup truth -> backend slot/phase scaffold -> AI coaching envelope -> backend canonical expansion -> review -> confirm`

AI should author:

- plan-level coaching thesis
- phase emphasis and progression intent
- weekly rhythm pattern
- quality/specialty cadence intent by goal family
- long-run progression intent
- cutback/taper intent
- variation hints for support runs
- target-time honesty/assumption language
- optional preferred identity emphasis from Hito's canonical identity set

Backend should own:

- exact dates and weekdays
- required running slots
- fixed rest days
- preferred long-run placement
- phase boundaries
- cutback/taper placement and load reduction validation
- exact canonical workout identity finalization
- title/summary generation when AI only provides intent
- segment expansion
- `goal_context`
- `metric_mode`
- pace/default-HR/personal-HR gates
- full-horizon extension
- review token and exact confirm persistence

The envelope may use compact codes for backend-known concepts:

- goal family
- phase
- cadence type
- support-run mix
- workout identity hints
- terrain emphasis
- metric intent

But some fields should remain human-readable because they improve coaching quality and reviewability:

- weekly theme
- microcycle intent
- target-time honesty assumptions
- long-run progression intent
- terrain/ultra/mountain caution intent

### Source status policy

Keep `sourceKind: ai_first_plan_blueprint_v1` for the current v1 row-level blueprint path until v2
is implemented.

For the target contract, introduce a new source kind or schema label such as:

- `ai_first_plan_envelope_v1`

Recommended source status values:

- `ai_authored_envelope`
- `repaired_ai_envelope`
- `envelope_unavailable`

If the product wants to keep the public source kind stable, trace metadata must still distinguish
row-level blueprint from envelope-expanded backend rows. Do not hide backend extension as pure AI
authorship.

### Debug and QA trace policy

Compact AI output must not make QA blind. Trace artifacts should include both raw bounded metadata
and decoded human-readable tables:

- setup summary
- requested horizon
- AI-authored window or envelope horizon
- backend-expanded horizon
- AI envelope phase/rhythm table
- backend-decoded weekly identity table
- final canonical identity counts
- validation issue codes
- repair notes
- prompt/output size estimates
- timeout/model/response status

Do not include raw prompts, secrets, full OpenAI payloads, or private runner data.

### Recommended near-term slice

Backend Slice 7A: create a non-live `ai-first-plan-envelope-v1` contract foundation.

Scope:

- define envelope schema/types in a focused module
- define compact code maps for phase, cadence, goal emphasis, and optional identity hints
- add pure validator and decoder into Hito human-readable debug tables
- add an ops/mock path that turns a mock envelope into canonical `training-plan-v2` through backend
  expansion
- do not wire structured onboarding yet
- do not persist anything
- keep current v1 blueprint path as production

Why this slice:

- it proves the smaller contract without risking the current product path
- it gives Backend and Running Coach a concrete artifact to judge before replacing v1
- it avoids another one-off timeout patch

### Validation strategy

- deterministic fixture for a long target-date half marathon similar to the failed 29-week case
- mock envelope for 5K, half marathon, marathon, ultra, and mountain/trail
- compare prompt/output size against v1 row-level blueprint
- ensure decoded final canonical plan preserves fixed rest days, long-run day, cadence, and metric
  policy
- ensure no `structured_authoring_v1` fallback success is introduced
- doctrine validator or focused equivalent for envelope fixtures
- local debug artifact showing compact envelope plus decoded readable trace

### Explicit non-goals

- do not implement progressive partial-plan persistence
- do not use deterministic `structured_authoring_v1` as a successful first-plan fallback
- do not move schedule truth into frontend
- do not ask Running Coach to run SQL or validation scripts
- do not replace the production v1 blueprint path until v2 envelope fixtures pass
- do not add a new queue/background subsystem in this slice

## AI Blueprint Schema Decision

Use a new intermediate schema:

`ai-first-plan-blueprint-v1`

Do not ask OpenAI to emit directly persisted `training-plan-v2` as final truth.

Reason:

- the reference JSON includes useful richness but also runtime fields such as completion placeholders and provider placeholders
- the backend needs one controlled place to reject, repair, strip, or normalize AI output
- the plan must keep movable workout entities and persisted canonical shape separate from model creativity
- live full nested draft output is latency-prone under bounded production smoke; compact blueprints keep model authorship useful while letting backend own segment expansion

The AI blueprint should still be close to Hito terminology so the model authors the real week-by-week coaching plan, not vague prose. The previous `ai-first-plan-draft-v1` full strict nested schema remains available as diagnostic/reference code only until cleanup is explicitly approved.

Required top-level fields:

- `schemaVersion: "ai-first-plan-blueprint-v1"`
- `planName`
- `generatedFor`
- `goalSummary`
- `startDate`
- `targetDate`
- `preparationHorizonWeeks`
- `planPreferences`
- `reviewAssumptions`
- `metricPolicySummary`
- `weeks[]`

Each week should include:

- `weekNumber`
- `phase`
- `theme`
- `microcycleIntent`
- `cutbackWeek`
- `taperWeek`
- `longRunIntent`
- `longRunProgression`
- `plannedWorkouts[]` containing authored running workouts only; backend fills rest days

Each workout should include:

- `date`
- `weekday`
- `workoutFamily`
- `workoutIdentity`
- `calendarIconKey`
- `title`
- `summary`
- `plannedRpe`
- `estimatedFatigue`
- `recoveryPriority`
- `segmentIntent`, not a full strict segment tree
- `metricIntent`, not final metric truth

Backend expansion owns:

- canonical warmup/main/cooldown or rest segments
- `goal_context`
- `metric_mode`
- pace target preservation only when benchmark/watch gates allow it
- labelled age-estimated default HR guidance only through backend policy

AI should not output:

- user ids
- plan cycle ids
- planned workout ids
- workout logs
- completion state
- Garmin/Strava placeholders
- AI verdict fields
- provider sync placeholders
- raw prompt text
- medical diagnosis
- exact elevation prescriptions
- unsupported personalized HR or pace targets

## Canonical Workout Identity Doctrine

OpenAI must author plans using Hito canonical workout language, not a new or generic taxonomy.

The model should choose from the existing two-layer workout contract:

- calendar family / icon key:
  `rest`, `recovery`, `easy`, `steady`, `long`, `tempo`, `intervals`, `progression`,
  `race`, `hills`, `trail`
- exact workout identity:
  `rest_and_recovery`, `easy_aerobic_run`, `recovery_jog`, `steady_aerobic_run`,
  `cutback_aerobic_run`, `easy_run_with_strides`, `long_aerobic_run`,
  `long_run_with_steady_finish`, `cutback_long_run`, `taper_long_run`,
  `controlled_tempo_session`, `half_marathon_threshold_durability`,
  `marathon_steady_specificity`, `distance_intervals`, `time_intervals`,
  `5k_sharpening_repeats`, `10k_rhythm_intervals`, `progression_run`,
  `race_pace_session`, `taper_tuneup_run`, `uphill_repeats`,
  `rolling_hills_session`, `technical_trail_easy`, `controlled_downhill_durability`,
  `hike_run_endurance`, `mountain_long_run_time_on_feet`,
  `ultra_time_on_feet_durability`, `climbing_steady_run`, `quality_session`

Rules:

- AI authors week-by-week coaching intent by selecting canonical families and identities.
- AI must not invent new workout taxonomy values such as generic `speed day`, `aerobic power`,
  or `mountain strength`.
- If a useful coaching phrase is needed, it belongs in title, summary, theme, or segment intent,
  not as a new identity.
- Backend validates every authored family, identity, and icon key against `rich-workout-model.ts`.
- Backend may canonicalize bounded aliases, but broad unknown identities should fail validation or
  fall back rather than creating parallel product language.
- Calendar renders family/icon truth; workout detail renders exact identity plus canonical segments.

The QA all-workout-types fixture proves the current product can already display many of these
identities. That fixture is coverage evidence, not training-quality approval for arbitrary
generated plans.

## Weekly Training Rules / Cadence Doctrine

The blueprint should create real week-by-week training rhythm. It should not fill weeks with
generic support slots unless that simplicity is justified by runner support.

Goal-family expectations:

- Beginner / low-support:
  mostly `easy`, `recovery`, `steady`, and `long` identities; no forced hard workouts; quality
  appears only as very light strides or controlled rhythm when support allows it.
- Supported 5K:
  regular but safe `5k_sharpening_repeats`, short controlled intervals, strides, or rhythm work;
  weekly aerobic endurance or long-run support remains present.
- Supported 10K:
  regular `10k_rhythm_intervals`, controlled tempo, or race-rhythm stimulus when safe; long run
  remains weekly and quality density stays bounded.
- Half marathon:
  recurring threshold/tempo/race-rhythm or steady-finish long-run stimulus when support allows it;
  long run remains weekly and should evolve toward durability.
- Marathon:
  `marathon_steady_specificity`, controlled steady work, long-run progression, fueling/durability
  cues, and conservative quality; do not fake race-pace precision when support is weak.
- Ultra:
  `ultra_time_on_feet_durability`, `hike_run_endurance`, fueling practice, durability, cutback
  rhythm, and long-run progression; avoid flattening into road-race intervals.
- Mountain / trail:
  `uphill_repeats`, `rolling_hills_session`, `climbing_steady_run`,
  `controlled_downhill_durability`, `technical_trail_easy`, `hike_run_endurance`, and
  `mountain_long_run_time_on_feet` where appropriate; no exact elevation prescription without
  route/elevation truth.
- Cutback / taper:
  reduce total load and peak durability stress while preserving purposeful tune-up, rhythm, or
  easy aerobic intent where appropriate.

Backend enforcement direction:

- enforce weekly quality cadence only when runner support and goal family justify it
- enforce long-run cadence and progression without placing peak durability stress inside
  taper-labelled weeks
- cap hard-day density by frequency, experience, ambition, current load, and support truth
- reject or repair generic `quality_session` overuse when a more specific canonical identity is
  required
- preserve fixed rest days and preferred long-run day constraints
- preserve pace gates and reject fake pace precision
- preserve personal HR gates and reject fake personal HR truth
- allow default estimated HR only through backend policy and labelling
- reject exact elevation prescriptions and unsafe medical/rehab claims
- fall back deterministically with source metadata if AI output is invalid

## Race Event Backlog

Race day should become a user-owned event/goal anchor in a future product slice. Do not implement
it in this plan wave.

Future product model:

- user can add or edit a race event date
- user can set race distance
- later fields may include target time, event type, terrain, event name, and priority
- Hito treats the race as a calendar event and training goal anchor
- plan generation uses race event date/distance as target date and target distance truth
- race-day workout identity stays canonical, such as `race_pace_session` or a future explicit
  race-day identity if approved
- race event metadata is user-owned and distinct from generated workout content
- moving race day requires explicit review because it can change phases, long-run progression,
  taper, and future workout structure
- active-plan schedule edit may move ordinary workouts, but it must not silently move or
  reinterpret the race event

Why backlog, not now:

- current first-plan work is still focused on AI-authored weekly blueprint reliability, canonical
  identity cadence, validation, exact persistence, and latency/product decision
- adding race events needs product UI, storage, mutation rules, and review/apply semantics beyond
  this implementation wave
- no DB schema, frontend UI, or backend event model should be added until this becomes an explicit
  selected slice

## Backend Validation Contract

The backend validator must check the normalized plan before review and before confirm.

Schema and taxonomy:

- output matches `ai-first-plan-blueprint-v1`
- normalized output matches canonical `training-plan-v2`
- every workout identity is in `CANONICAL_WORKOUT_IDENTITY_VALUES`
- every family/icon pairing is valid through `rich-workout-model.ts`
- legacy `workout_type` is derived by backend, not trusted from AI
- plan dates are contiguous enough for calendar use and within requested horizon
- no duplicate workout dates after normalization

Schedule invariants:

- fixed rest days contain only rest workouts
- running-day count matches requested/default running-days/week unless explicitly reviewed as a backend fallback
- preferred long-run day is used when possible and never violates fixed rest days
- long-run placement is coherent across weeks
- no back-to-back hard sessions unless allowed and justified

Training doctrine:

- weekly hard-day density fits frequency and runner support
- beginner/low-support plans stay conservative
- build-consistency plans avoid race-like quality density
- long-run progression differs by goal family
- cutback rhythm appears where appropriate
- taper weeks stay below pre-taper long-run peak
- ultra/mountain plans include time-on-feet, terrain, downhill/control, hike-run, and caution language when relevant
- 5K/10K/HM/marathon plans show goal-family specificity when runner support allows it

Segment quality:

- substantial non-rest workouts include warmup, main-equivalent work, and cooldown
- short recovery/easy sessions may be simpler only when intentionally short and still runner-readable
- interval/tempo/hill sessions include work/recovery structure
- long runs include goal-appropriate purpose such as durability, steady finish, fueling practice, cutback, or taper
- no generic one-block filler for long, tempo, interval, hill, trail, ultra, or mountain workouts
- segment guidance/cue/hint is present and executable

Metric safety:

- pace ranges only survive when watch/app plus pace/mixed guidance plus usable benchmark truth allow them
- personal HR targets only survive with personal HR-zone truth
- default estimated HR guidance may survive only when age exists, with `Default HR guidance` and `Estimated from age, not personalized zones`
- no unlabeled HR bpm guidance
- no fake lab/medical physiological claims
- no exact elevation or route prescription without trusted route/elevation truth

Review safety:

- review must expose whether the plan came from `ai_authored` or `repaired_ai_draft`
- review assumptions must call out weak support, conservative/durability-limited contexts, default HR labels, and target-time honesty
- confirm must persist the exact reviewed normalized plan, not regenerate a different plan silently

## Fallback And Repair Policy

Use a blueprint-only structured first-plan ladder:

1. AI timeout or unavailable:
   - return non-mutating `ai_first_plan_blueprint_unavailable` metadata
   - do not return a reviewed `structured_authoring_v1` plan

2. AI schema invalid:
   - return non-mutating `ai_first_plan_blueprint_unavailable` metadata
   - expose bounded validation issue codes for QA/debug

3. AI mostly valid but contains forbidden target precision or runtime noise:
   - strip forbidden runtime fields
   - remove unsupported pace/HR target keys
   - preserve safe effort/cue guidance
   - mark metadata as `repaired_ai_draft` only if the plan still passes all doctrine checks

4. AI violates schedule safety, rest days, hard-day density, taper, or protected policy:
   - reject the AI draft and return non-mutating `ai_first_plan_blueprint_unavailable`
   - do not silently move lots of workouts in the first slice unless that repair is deterministic and review-visible

5. AI draft valid:
   - normalize to `training-plan-v2`
   - return `ai_authored` metadata

Deterministic first-plan fallback is no longer acceptable product truth for supported structured onboarding. Deterministic structured generation remains only for other explicit seams such as active-plan refresh, text compatibility, voice, diagnostics, and fixtures until those surfaces have their own approved replacement.

## Schedule Flexibility Contract

The new AI-authored plan must remain movable after creation.

Required behavior:

- fixed rest days from setup are hard constraints in AI prompt and backend validation
- preferred long-run day is a planning preference and validation target
- normalized `planned_workouts` remain individual movable saved rows
- `plan_preferences` should store active-plan schedule truth for later edit/reflow
- active-plan `Edit schedule` still handles same-frequency weekday changes without OpenAI
- running-day count changes still route to active-plan refresh/regeneration review/apply
- JSON import weekday remapping keeps using backend weekday-rest invariants
- saved plans created before this migration remain readable through existing compatibility fallback

Important boundary:

AI may design dates in the draft, but backend validation owns whether those dates are allowed.

## Migration / Compatibility Strategy

Do not delete current deterministic infrastructure immediately.

Phase strategy:

1. Add the new AI-authored draft contract beside current structured generator.
2. Add backend validation/normalization to canonical `training-plan-v2`.
3. Wire structured first-plan draft to use AI-authored path behind an explicit backend option or env/feature switch first.
4. Prove with deterministic mock OpenAI fixtures.
5. Prove with live OpenAI smoke where timeout/unavailable states return bounded retry metadata.
6. Make AI-authored path the default for structured first-plan generation only after QA and Running Coach pass.
7. Keep deterministic generator for non-first-plan seams and fixture/diagnostic support only.
8. Remove or demote obsolete rich-draft seams only after the AI-authored path is stable.

Compatibility rules:

- existing saved plans must not change
- existing `training-plan-v2` import/export must continue to accept current rich fields
- visible frontend review modal should remain the same product flow unless backend review data needs one small source/status line
- active-plan refresh/apply should not be changed in this plan unless a later slice explicitly ports it
- voice-to-plan remains out of scope unless product reopens voice

## Implementation Slices

### Slice 1: Backend AI Draft Contract And Prompt Builder

Owner: BACKEND

Status: QA-green

Create the non-persistent backend contract for AI-authored first-plan drafts.

Scope:

- add `ai-first-plan-draft-v1` schema
- add OpenAI response schema builder
- add prompt builder for structured setup context
- include Hito taxonomy values, metric policy, rest-day constraints, long-run preference, and compact reference-style examples
- add mockable helper that returns either parsed draft or bounded validation/unavailable metadata
- do not wire visible structured onboarding yet
- do not persist anything

Validation:

- unit/script validation with mocked OpenAI response
- invalid schema returns bounded failure/fallback metadata
- forbidden runtime fields are rejected or stripped by explicit normalizer rules

### Slice 2: Backend Normalization To Canonical `training-plan-v2`

Owner: BACKEND

Status: QA-green

Normalize valid AI drafts into canonical plan truth.

Scope:

- map weeks/workouts into `training-plan-v2`
- derive legacy `workout_type` from rich family/identity
- validate date/order/rest-day/running-day/long-run constraints
- run metric gates and strip unsupported targets
- validate segment structure and doctrine constraints
- build review assumptions/source metadata
- keep deterministic generation available only outside the supported structured first-plan creation path
- no visible frontend changes yet

Validation:

- mocked rich half-marathon reference-style draft normalizes
- fixed rest-day violations fail/fallback
- fake personal HR is stripped/rejected
- no one-block substantial non-rest workouts pass

### Slice 2A: Non-Mutating Service And Ops Script

Owner: BACKEND

Status: QA-green

Exercise the Slice 1/2 contract through one explicit non-mutating service and bounded ops script without changing live structured onboarding.

Scope:

- add a backend service that accepts structured authoring context or structured onboarding input
- call OpenAI through the `ai-first-plan-draft-v1` prompt/response contract
- normalize only through backend validation into canonical `training-plan-v2`
- return bounded source, repair, validation, timeout, and unavailable/failure metadata
- add an ops command with mock, invalid, timeout, and live modes
- do not persist anything
- do not wire visible structured onboarding, Voice, refresh/apply, or DB schema

Validation:

- mock valid draft returns normalized `training-plan-v2` with `ai_authored` status
- invalid draft returns bounded unavailable/failure metadata
- timeout returns bounded unavailable/failure metadata
- live OpenAI smoke returns either accepted draft or bounded fallback metadata without mutation

### Slice 2B: Live Smoke Latency, Model-Route Hardening, And Blueprint Pivot

Owner: BACKEND

Status: QA-green

Prove a real live AI-authored contract can pass backend validation, and pivot away from the full strict nested draft when bounded live smoke shows the heavy contract is not production-reliable.

Scope:

- keep the non-mutating service/ops boundary
- reduce live-smoke prompt/output pressure without weakening full-plan validation
- preserve bounded timeout/unavailable metadata
- validate complete-horizon draft coverage before accepting AI output
- keep model choice inside the existing `OPENAI_PLAN_MODEL` env contract
- add `ai-first-plan-blueprint-v1` as the production-direction compact contract
- keep `ai-first-plan-draft-v1` available only as an explicit diagnostic/reference contract
- do not wire structured onboarding, persistence, Voice, refresh/apply, frontend, or DB schema

Validation:

- blueprint mock valid returns canonical plan metadata, while invalid and timeout paths return bounded unavailable metadata
- one-week no-reference blueprint smoke with `OPENAI_PLAN_MODEL=gpt-4.1-mini`, 120s timeout, and 8k output cap returns `sourceStatus: ai_authored`
- two-week no-reference blueprint compact smoke with `OPENAI_PLAN_MODEL=gpt-4.1-mini`, 120s timeout, and 8k output cap returns `sourceStatus: ai_authored`
- strict nested compact draft remains diagnostic-only and timed out at a 30s comparison cap
- accepted live blueprint normalizes to canonical `training-plan-v2`
- blueprint-expanded tempo/threshold, interval, hill, trail, ultra, long-run, cutback/taper, recovery, easy, steady, 5K sharpening, 10K rhythm, race-pace, taper tune-up, marathon-specific, controlled downhill, hike-run, and mountain time-on-feet identities produce identity-specific executable segments instead of generic family-only shells
- `--fixture identity-coverage --coach-sample` prints bounded coach-facing expanded segment bodies for the full newly covered identity set without secrets, raw prompts, or raw AI payloads
- mock, invalid, timeout, and doctrine fixtures remain green

### Slice 3: Structured First-Plan Draft Integration Behind Explicit Backend Switch

Owner: BACKEND

Status: Implemented / blueprint-only structured first-plan path, live marathon proof passed

Wire `generateStructuredFirstPlanDraft` to use the AI-authored blueprint path while preserving explicit review/confirm.

Scope:

- attempt `ai-first-plan-blueprint-v1` during non-mutating structured draft generation
- return a non-mutating retry/failure state when OpenAI is missing, invalid, or timed out
- include bounded source, unavailable/failure, repair, validation, model, timeout, and debug metadata in the draft/review payload
- confirm must persist the exact reviewed normalized plan by signed draft token rather than regenerating a different plan silently
- preserve active-plan-exists blocking
- preserve profile patch and plan-scoped authoring metadata

Validation:

- non-mutating draft remains non-mutating
- confirm persists exactly reviewed plan
- tampered draft blocks
- invalid/unavailable blueprint attempts do not return reviewable deterministic fallback
- mocked valid blueprint returns `sourceStatus: ai_authored` and canonical `ai_first_plan_blueprint_v1` truth
- mocked invalid and timeout blueprints return `blueprint_unavailable` metadata
- supported road target-time plans expose required quality slots and fail validation when the required weekly quality slot is replaced by generic steady/easy work
- supported balanced half-marathon plans expose moderate required cadence slots from Week 2 and fail validation when early weeks remain generic support filler
- marathon and other required goal-family quality slots avoid the day before or after the preferred long run when another viable running day exists
- beginner, 5K, 10K, half-marathon target-time, half-marathon balanced, marathon, ultra, and mountain/trail blueprint fixtures prove first-six-week goal-family identity cadence without unsafe hard-day density
- linked-DB half-marathon target-time smoke returns `ai_authored` or acceptable `repaired_ai_draft`, `validationIssueCount: 0`, exact reviewed-row persistence, and `confirmOpenAiRequestCount: 0`
- local/dev browser-action trace artifacts prove the real structured onboarding action uses the same parsed setup, authoring input, blueprint contract, first-plan-specific model/timeout/token policy, safe cadence slots, and non-fallback result as the preview seam

### Slice 4: Make AI-Authored Structured First Plan The Default

Owner: BACKEND / QA

Status: QA-green / blueprint-only release gate passed

Normal structured first-plan creation now uses the AI-authored blueprint path with no deterministic `structured_authoring_v1` fallback as a successful first-plan draft result.

Scope:

- default `generateStructuredFirstPlanDraft` to AI-authored path when OpenAI is configured
- return non-mutating retry/failure on timeout/unavailable/invalid AI draft
- review clearly shows accepted AI source/repair status
- no frontend redesign

Validation:

- live or mocked OpenAI path produces `ai_authored` / `repaired_ai_draft` or bounded unavailable metadata
- unavailable blueprint attempts do not create or review a first plan
- controlled beta safety still passes

### Slice 5: Frontend Review Source/Assumption Readback

Owner: FRONTEND

Only if backend review data needs visible source/fallback clarity.

Scope:

- keep existing review modal
- add a small source/status line such as `AI-authored plan` or `Fallback plan used`
- show backend review assumptions, not frontend-invented coaching logic
- do not redesign onboarding

### Slice 6: QA And Running Coach Evidence

Owner: QA / RUNNING COACH

Status: Backend visual-proof helper ready / awaiting QA browser review

Run full visual/coaching proof before closing this migration wave.

Scope:

- structured first-plan UI
- saved-mode calendar
- workout detail
- screenshots
- default HR and pace gate checks
- schedule edit after creation
- ops-created saved visual proof may use `npm run seed-ai-first-plan-blueprint-proof -- --email <disposable-tester-email> --username <tester-username> --password <tester-password>` with `OPENAI_PLAN_MODEL=gpt-4.1-mini`, `--timeout-ms 240000`, and `--max-output-tokens 20000`; this path must report `sourceKind: ai_first_plan_blueprint_v1`, `sourceStatus: ai_authored` or `repaired_ai_draft`, `fallbackReason: null`, `validationIssueCount: 0`, `deterministicFallbackBoundary.used: false`, `confirmOpenAiRequestCount: 0`, and persisted rich rows before QA uses the browser account

### Slice 7: Cleanup / Deletion

Owner: ARCHITECT / BACKEND

Only after AI-authored default is QA-green.

Candidate cleanup:

- demote or simplify deterministic generator branches that only existed to fake richness
- remove duplicate rich-draft pathways that are no longer used
- keep deterministic generator support only for explicit non-first-plan seams, diagnostics, and fixtures
- keep import/export compatibility
- keep refresh exact-draft safety

### Slice 7A: Non-Live Planning Envelope Contract Foundation

Owner: BACKEND

Status: Complete / QA-passed / non-live foundation only.

Create a smaller `ai-first-plan-envelope-v1` contract beside the current production blueprint path.

Scope:

- define focused envelope schema/types and compact code maps
- validate and decode envelope output into human-readable debug tables
- expand accepted mock envelopes into canonical `training-plan-v2` through backend-owned slot,
  phase, long-run, segment, and metric-policy logic
- compare envelope prompt/output size against current row-level blueprint fixtures
- keep `ai-first-plan-blueprint-v1` as the production structured first-plan path
- no persistence
- no frontend wiring
- no DB schema

Validation:

- long target-date half-marathon envelope fixture
- 5K, marathon, ultra, and mountain/trail mock envelope fixtures where practical
- fixed rest days, preferred long-run day, full-horizon coverage, cadence policy, and metric policy
  preserved after expansion
- invalid envelope output remains non-mutating and cannot become a reviewed draft
- no `structured_authoring_v1` success fallback is introduced
- `git diff --check`

Implementation note, 2026-05-29:

- Added a non-live `ai-first-plan-envelope-v1` foundation beside the current production blueprint
  path. The envelope schema uses compact goal/style/phase/cadence/terrain/metric codes, decodes
  them into human-readable trace output, validates setup alignment and safety, and expands accepted
  mock envelopes through backend-owned canonical plan generation into `training-plan-v2` rows.
- `npm run author-ai-first-plan-draft -- --contract envelope` is ops/mock-only in this slice; live
  envelope calls intentionally return bounded unavailable metadata. Production
  `ai-first-plan-blueprint-v1` draft/review behavior is unchanged.
- Build closeout note: `npm run build` now clears generated `.output` and Nitro Vite cache before
  building, stages client assets in Nitro's build cache instead of writing them directly into
  `.output/public`, restores staged/source public assets immediately before Nitro's virtual
  public-assets module reads them, stages the Nitro server bundle, and runs a `postbuild` finalizer
  that restores/verifies `.output/public` and `.output/server` after Nitro closes. Dev-server Nitro
  output is isolated under `node_modules/.nitro/dev-output` on restart so local dev watchers do not
  share the production `.output` lifecycle.

QA closeout evidence, 2026-05-29:

- default envelope mock passed:
  - `sourceKind: ai_first_plan_envelope_v1`
  - `sourceStatus: expanded_from_envelope`
  - `weekCount: 8`
  - `workoutCount: 56`
  - `nonRestCount: 40`
  - `completeRichRows: 40`
  - `persisted: false`
- long marathon envelope passed:
  - `weekCount: 29`
  - `workoutCount: 203`
  - `nonRestCount: 145`
  - `completeRichRows: 145`
  - fixed rest days preserved: Wednesday/Saturday
  - preferred long run preserved: Sunday
  - cadence safe for low-support case
- invalid envelope returned bounded `ai_first_plan_envelope_invalid` with `persisted: false`
- live envelope mode returned bounded unavailable/non-live metadata and made no OpenAI call
- production blueprint preservation passed:
  - valid remains `ai_first_plan_blueprint_v1` / `ai_authored`
  - invalid remains `blueprint_unavailable` / `ai_first_plan_blueprint_schema_invalid`
  - timeout remains `blueprint_unavailable` / `ai_first_plan_blueprint_timed_out`
  - `deterministicFallbackBoundary.used` remains false
  - no `structured_authoring_v1` fallback success leaked
- doctrine validator passed

Build blocker closeout evidence, 2026-05-29:

- two normal `npm run build` runs passed
- two explicit cold builds after cleanup passed
- required artifacts were present:
  - `.output/public/favicon.svg`
  - `.output/public/templates/hito-training-plan-v2-template.json`
  - `.output/server/index.mjs`
- Nitro public-assets `ENOENT` did not reproduce
- client assets now stage outside `.output/public`
- postbuild finalizer restores/verifies `.output/public` and `.output/server`

Closeout boundary:

- `ai-first-plan-envelope-v1` remains non-live and ops/mock-only
- it is not wired into `generateStructuredFirstPlanDraft`
- it is not persisted
- production first-plan generation still uses `ai-first-plan-blueprint-v1`
- production envelope adoption remains a future selected slice

### Slice 7B: Production Envelope Adoption

Owner: ARCHITECT / BACKEND / QA

Status: Future / not started / eligible for architecture selection after date-control proof.

Only select this after Architect explicitly decides the non-live envelope foundation should move
toward production. The browser long-horizon/date-control proof is now passed; production adoption
still requires a deliberate rollout decision and follow-up QA/Running Coach evidence.

Scope when selected:

- decide whether `ai-first-plan-envelope-v1` replaces or sits beside `ai-first-plan-blueprint-v1`
- define source-kind/source-status semantics for reviewed plans
- wire structured first-plan draft to envelope behind an explicit backend option first
- prove no regression in review/confirm, fixed rest days, long-run day, metric gates, and saved-mode
  rendering
- do not persist partial envelope output

### Date Controls And Long-Horizon Browser Proof Release Gate

Owner: FRONTEND / BACKEND / QA

Status: Complete / QA-passed.

Closeout evidence, 2026-05-29:

- built-in Codex browser was used first
- direct auth text entry was blocked by missing Browser Use virtual clipboard
- QA stayed in the built-in browser and used a local dev-only cookie helper for the disposable
  tester session
- Safari fallback was not needed
- visible date-control values before submit:
  - plan start date: `2026-05-29`
  - target date: `2026-12-11`
  - target time: `3:50:00`
  - native validation messages: empty
  - named submit fields: `schedule.startDate = 2026-05-29` and
    `schedule.targetDate = 2026-12-11`
- fresh browser-action artifact:
  `qa-artifacts/debug/2026-05-29/structured-onboarding-browser-action/2026-05-29T19-08-20-405Z-generateStructuredFirstPlanDraft-draft_ready-d9b69c7b33e7.json`
- artifact proof:
  - `targetDatePresent: true`
  - `startDate: 2026-05-29`
  - `targetDate: 2026-12-11`
  - `requestedHorizonWeeks: 29`
  - `aiAuthoredHorizonWeeks: 16`
  - `backendExtendedWeeks: 13`
  - `finalRequiredSlotCount: 145`
  - `sourceKind: ai_first_plan_blueprint_v1`
  - `sourceStatus: repaired_ai_draft`
  - `fallbackReason: null`
  - `deterministicFallbackBoundary.used: false`
- review modal opened successfully instead of `Review failed`
- visible modal state: `Draft ready`
- visible copy: `Nothing has been created yet. Confirm this setup to create your plan.`
- review summary showed:
  - plan horizon: `2026-05-29` to `2026-12-11`
  - `203` planned workouts
  - long run: Sunday
  - rest days: Wednesday, Saturday
  - terrain: Rolling
- QA canceled and did not confirm/save
- no-mutation proof:
  - before review: `runnerProfiles: 1`, `planCycles: 0`, `plannedWorkouts: 0`,
    `workoutLogs: 0`
  - after review modal opened and before confirm: `runnerProfiles: 1`, `planCycles: 0`,
    `plannedWorkouts: 0`, `workoutLogs: 0`
- disposable runner profile and tester cleanup passed
- command validation passed:
  - targeted ESLint
  - doctrine validator
  - long-horizon blueprint fixture
  - invalid/timeout/partial blueprint mocks
  - `git diff --check`
  - `npm run build`
- screenshot folder:
  `qa-artifacts/screenshots/2026-05-29/first-plan-date-controls-release-qa/`
- screenshots:
  - `valid-retained-date-fields-before-submit.png`
  - `review-modal-success.png`

Closeout boundaries:

- production first-plan generation remains on `ai-first-plan-blueprint-v1`
- `ai-first-plan-envelope-v1` remains future/non-production
- latest browser proof verifies review opening and no mutation before confirm
- latest browser proof does not prove confirm/save exactness because QA canceled before confirm

Non-blocking follow-up:

- The fresh artifact shows the first Monday after the first Sunday long run as
  `steady_aerobic_run`, not easy/recovery. Treat this as a non-blocking
  Running Coach / policy review item, not a date-control release blocker.

### Selected Next Slice: Confirm/Save Exactness QA

Owner: QA

Status: Selected / ready for direct QA validation.

Decision, 2026-05-29:

- choose focused confirm/save exactness QA as the next bounded slice
- do not start production envelope adoption yet
- do not start the Monday-after-long-run training-quality policy review yet
- do not split or archive the whole plan yet

Why this is next:

- the date-controls browser proof already showed the 29-week review can open successfully
- the same proof intentionally canceled before confirm, so persisted exactness for that exact
  long-horizon browser path remains the most direct release-risk gap
- production envelope adoption would be a larger architecture rollout and should not begin until the
  current production blueprint path has complete review -> confirm/save proof
- the Monday-after-long-run `steady_aerobic_run` observation is real but non-blocking and belongs to
  a Running Coach / policy follow-up, not this release gate

Validation expectations:

- use the built-in Codex browser first
- create or reset only disposable local/test runner data
- reproduce the long-horizon setup with:
  - start date: `2026-05-29`
  - target date: `2026-12-11`
  - target time: `3:50:00`
  - long run: Sunday
  - rest days: Wednesday and Saturday
  - terrain: Rolling
- open review through production `ai-first-plan-blueprint-v1`
- confirm/save only after review shows coherent 29-week plan truth
- verify no mutation before confirm and exactly one active plan after confirm
- verify persisted proof:
  - `plan_cycles.source_kind = ai_first_plan_blueprint_v1`
  - persisted row count matches reviewed row count
  - persisted date range matches the reviewed horizon
  - fixed rest days remain rest-only
  - preferred long-run day is preserved where expected
  - rich fields are present on non-rest rows
  - confirm does not call OpenAI or regenerate a different plan
- save routine screenshots under
  `qa-artifacts/screenshots/YYYY-MM-DD/first-plan-confirm-save-exactness/`
- reference debug artifacts textually; do not commit routine screenshots

Explicit non-goals:

- do not validate the non-live `ai-first-plan-envelope-v1` foundation again
- do not treat `ai-first-plan-envelope-v1` as production
- do not start envelope production adoption
- do not change frontend/backend behavior
- do not implement fixes
- do not resolve the Monday-after-long-run training-quality follow-up in this QA slice

## QA Matrix

Required end-to-end scenarios:

1. Beginner consistency:
   - no watch/app
   - no benchmark
   - age present
   - 3 days/week
   - fixed rest days
   - expected: simple but not empty, no fake pace, labelled default HR only if emitted

2. 5K:
   - watch/app
   - recent 5K benchmark
   - 4 days/week
   - expected: safe sharpening/strides or short reps, not too much intensity

3. 10K:
   - watch/app
   - recent 5K benchmark
   - mixed/pace guidance
   - expected: rhythm intervals or controlled tempo variety with pace only where allowed

4. Half marathon target-time:
   - watch/app
   - recent 5K benchmark
   - 5 days/week
   - target time
   - expected: threshold/steady durability, long-run progression, honest target support

5. Marathon low support:
   - no benchmark
   - watch unknown
   - 4 days/week
   - expected: conservative/durability-limited assumptions, goal-specific long-run structure, no fake precision

6. Ultra:
   - no watch/app
   - unknown benchmark
   - 4 days/week
   - expected: time-on-feet, durability, cutback/taper, no road-race interval flattening

7. Mountain:
   - no watch/app
   - fixed rest days
   - unknown benchmark
   - expected: technical trail, hills, controlled descent, hike-run/time-on-feet, no exact elevation prescriptions

8. No age:
   - HR preference
   - no personal zones
   - expected: no bpm default HR, effort-only cues

9. Fixed rest days and long-run day:
   - impossible combinations return correction/failure
   - valid combinations keep rest days empty and long run preferred when possible

10. Schedule edit after creation:

- create AI-authored plan
- use active-plan same-frequency schedule reflow
- expected: content/rich fields/segments preserved while dates move

11. Blueprint unavailable:

- OpenAI timeout/mock invalid output
- expected: non-mutating retry/failure metadata and no reviewed/saved `structured_authoring_v1` plan

12. Tamper safety:

- modify reviewed draft before confirm
- expected: confirm blocks

QA evidence must include screenshots for calendar and workout detail pages, especially mid-cycle marathon/ultra weeks where repetition risk is highest.

Future QA / Running Coach evidence should also compare:

- authored blueprint identities by week
- validation or repair issue codes by week
- canonical persisted identities by week
- rendered calendar labels and icons
- workout detail segment richness, including warmup/main/cooldown and repeat/recovery structure
- fixed rest days and preferred long-run placement
- screenshots saved under `qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/` by default, not committed unless explicitly promoted as release evidence

## Running Coach Acceptance Criteria

Running Coach should approve only if:

- plans read as coach-authored week-by-week, not slot-filled
- weekly microcycles differ by goal family and runner support
- easy/recovery/steady/long support runs have clear purpose and enough execution detail
- substantial non-rest workouts are not one-block filler
- quality sessions have warmup/work/recovery/cooldown logic
- long-run progression, cutbacks, and taper are visible
- ultra/mountain plans feel distinct from road marathon plans
- beginner/low-support plans are conservative without becoming empty
- pace and HR targets are honest and labelled correctly
- review assumptions honestly explain weak support, target-time uncertainty, and default HR guidance

Running Coach should not approve broad onboarding wiring from limited-scenario coverage alone; the intended AI-authored path must be coach-authored, varied, executable, and trustworthy across the supported goal families before user-facing rollout.

## Cleanup / Deletion Strategy

Do not delete working safety infrastructure early.

Later deletion candidates:

- deterministic branches whose only purpose is adding surface-level variety after AI-authored default is stable
- skeleton-bound rich draft seams for structured first-plan if they become unused
- duplicated prompt fragments between text authoring and first-plan AI authoring
- compatibility wrappers with no remaining imports

Keep long term:

- deterministic generator support for explicit non-first-plan seams and fixtures
- canonical `training-plan-v2` schema
- import/export compatibility
- rich workout taxonomy
- metric gate resolver
- default estimated HR policy
- fixed rest-day invariant helpers
- active-plan schedule edit and refresh/apply safety

## Risks

- live OpenAI latency can make setup feel slow
- a full 12-week half-marathon target-time linked-DB draft now passes backend quality and exact-persistence gates, but the successful `gpt-4.1-mini` run took about 104.5s; broad rollout needs either a better latency policy, a validated faster model route, or a deliberate async review experience before this feels product-ready
- AI may produce beautiful but unsafe density unless backend doctrine checks are strict
- reference JSON contains useful richness but also runtime noise and unsupported precision that must not become canonical
- broad repair logic can become as complex as the old deterministic generator if overbuilt
- prompt/examples may overfit half marathon unless QA covers all goal families
- confirm path must avoid regenerating a different plan than the reviewed AI draft

## Exit Criteria

- AI-authored structured first-plan draft path exists behind backend validation
- backend normalizes AI draft to canonical `training-plan-v2`
- structured review remains non-mutating
- confirm persists exactly the reviewed normalized plan
- invalid/unavailable blueprint attempts return non-mutating retry/failure instead of `structured_authoring_v1`
- pace/HR/default-HR safety is preserved
- fixed rest days and long-run preferences are enforced
- goal-family identity cadence is backend-owned across beginner/consistency, 5K, 10K, half marathon, marathon, ultra, and mountain/trail blueprints
- active-plan schedule edit still works after AI-authored plan creation
- import/export/saved-mode readback still works
- QA matrix passes
- Running Coach approves controlled beta readiness for AI-authored structured first plans
- cleanup candidates are documented before any deletion

## Next Recommended Role

QA

## Suggested Next Step

Run focused confirm/save exactness QA for the successful 29-week first-plan review path. Keep this
separate from production envelope adoption and the non-blocking Monday-after-long-run policy
follow-up.

# Running Plan Creation Engine Rebuild

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Hold running-plan expansion after accepted benchmark-backed pace truth and archived simplification
strike.

## Stage

ARCHITECT holding / post-benchmark-truth and post-cleanup sequencing.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Hold running-plan expansion after accepted benchmark-backed pace truth and archived simplification
strike.

Stage:
ARCHITECT holding / post-benchmark-truth and post-cleanup sequencing.

Context:
The selected-plan benchmark-backed pace truth path is now accepted end-to-end in the proved scope:
- backend benchmark seam is QA-passed
- frontend metric-surface cleanup is implemented
- Quick setup benchmark collection is implemented
- QA proved:
  - no-benchmark preview stays structure-only
  - benchmark-backed preview shows `Recent 5K benchmark pace 5:00/km · personal HR targets blocked`
  - persisted workout detail shows pace where backend allows it
  - no fake pace and no personal HR target truth appear

Root cause and architecture fit:
The benchmark-backed metric-truth track is no longer the blocker, and the Hito Stack Simplification
Strike is complete and archived. Running-plan expansion should not resume by inertia; future
provider-derived pace truth, HR-zone truth, additional families, or UI exposure need separately
selected product gates.

Required reading:
- AGENTS.md
- agents/architect.agent.md
- skills/hito-architecture-audit/SKILL.md
- skills/hito-plan-writing-and-closeout/SKILL.md
- docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md
- docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md
- docs/tasks/backlog/2026-06-15-workout-metric-enrichment-truth-audit.md
- docs/current-functional-map.md
- docs/current-system.md
- docs/current-product.md

Scope:
1. Preserve the accepted benchmark-backed pace truth scope.
2. Keep provider-derived pace truth, executable HR targets, additional selected-plan families, and
   broader running-plan UI exposure as future-only until Product selects a separate gate.
3. Do not reopen benchmark/UI work unless fresh source or QA evidence shows a regression.

Validation:
- docs-only `git diff --check` if plan/map files change
```

## Benchmark-Backed Pace Truth Closeout — 2026-06-17

Status:

Accepted / backend seam, frontend wiring, and runner-facing QA proof all passed.

Acceptance evidence:

- Backend R14A pace-truth seam was QA-passed.
- Frontend removed duplicated duration-only readback and rendered benchmark-backed pace honestly.
- Quick setup now visibly exposes optional `Fitness benchmark`, `Recent 5K time`, and
  `Recent 5K pace`.
- QA proved:
  - no-benchmark preview shows `No benchmark pace supplied · structure-only targets`
  - benchmark-backed preview with `25:00` shows
    `Recent 5K benchmark pace 5:00/km · personal HR targets blocked`
  - persisted workout detail shows `Pace: 6:30-7:30/km` where backend pace truth exists
  - no fake pace and no personal HR target truth appear
  - desktop and `375px` no-overflow passed in the checked surfaces

Decision:

- Accept benchmark-backed pace truth as closed in the proved scope.
- Keep provider-derived pace truth and personal HR-zone executable truth as future-only.
- The
  [Hito Stack Simplification Strike](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md>)
  is now archived after reaching `40/40`; do not route new running-plan work through that completed
  cleanup track.

## Selected-Plan Metric Truth Expansion Decision

Status update, 2026-06-15:

- Backend audit proved selected running-plan saved readback is honest: the path is not dropping
  valid pace or HR targets.
- The current selected-plan engine emits `structure_only_executable` because selected-plan
  creation has no benchmark pace truth input seam and no personal HR-zone truth seam.
- Decision: selected-plan creation should gain an optional backend-owned metric-truth seam, but it
  must remain structure-only by default when truth is absent.
- First bounded implementation gate: benchmark-backed pace truth only.
- Provider-derived pace truth remains future until provider evidence is promoted to canonical,
  freshness-gated, auditable pace truth.
- Executable HR targets remain future until runner-level personal HR-zone truth exists; age/default
  HR is advisory/readback-only.
- Target time, selected distance, runner level, ambition, comments, and AI inference must not unlock
  pace targets.
- Frontend remains a renderer/collector only. It must not compute pace, HR, schedule, endpoint, or
  persistence truth locally.

Backend Slice R14A implementation result, 2026-06-15:

- Added an optional selected-plan benchmark input seam for `recent_5k_time`,
  `recent_5k_pace`, and `unknown`; benchmark remains optional and no-benchmark selected-plan
  output remains `structure_only_executable`.
- Normalized benchmark truth is signed inside the selected-plan review/checksum payload, so changed
  benchmark input fails as stale review during server-side rebuild.
- Canonical selected-plan rows now emit broad `pace_min_per_km_range` only when recent-5K
  benchmark truth exists and the segment/workout kind safely supports pace. Endpoint, hill, stride,
  warmup/cooldown, and recovery-unit targets do not receive inferred pace in this slice.
- Executable HR remains blocked; age/default HR can remain advisory/readback-only and does not set
  `hr_targets_allowed`.
- Validation evidence:
  - no-benchmark 10K/Half/Marathon Base/Marathon Completion review fixtures stayed structure-only
  - benchmark-backed 10K fixture emitted 57 pace-capable canonical rows and 57 export-shaped
    readback workouts
  - target-time-only diagnostic input emitted zero pace targets
  - source, 10K, R6, confirm, doctrine, ESLint, and build gates passed

Backend metric-target fallback follow-up, 2026-06-23:

- Promoted existing editable default estimated HR zones into the backend generated-plan target
  fallback after RPE-first executable target readback was removed.
- Contract now remains `pace OR estimated HR`: benchmark-backed segments keep pace targets where
  allowed; no-benchmark generated non-rest segments emit `default_estimated_hr` `hr_bpm_range`
  guidance derived from the existing age-estimated zone seam.
- Personal HR-zone truth remains blocked: `hr_targets_allowed` stays `false` unless a real
  personal zone source exists, and default estimated HR is labeled/read back as estimated guidance,
  not personalized HR truth.
- Validation evidence:
  - no-benchmark selected 10K probe kept `84` rows / `60` non-rest rows and emitted `192`
    default-estimated HR segment targets
  - benchmark-backed selected 10K probe kept pace targets (`77` pace-capable segments)
  - running-plan source, 10K, R6, confirm, doctrine, ESLint, build, and diff-check gates passed

Backend beginner 10K dose and metric-target realism follow-up, 2026-06-23:

- Added `ten_k_beginner_dose_policy_v1` for `beginner_new_runner` and visible-Beginner
  `sometimes_runs` without usable benchmark truth.
- Low-support 10K now applies conservative generation and review gates before acceptance:
  Week 1 `120` running minutes, Week 1 long run `40` minutes, easy max `30` minutes, recovery max
  `25` minutes, peak long run `75` minutes, no tempo/intervals/hills/threshold, exact final
  `10000m` endpoint.
- Narrowed default-estimated HR target output to allowed aerobic support rows
  (`easy`/`recovery`/`long_run`/`cutback_long_run` main segments). Hard work without benchmark or
  personal zones stays structure-first with effort/cue guidance, no fake pace, and no executable
  default-HR target.
- Benchmark-backed pace truth remains intact: targeted proof kept benchmark pace output (`77`
  pace-capable segments, sample `6:30-7:30/km`) while no-benchmark hard rows emitted `0` fake pace
  targets and `0` default-estimated HR targets.
- Validation evidence:
  - source, 10K builder, confirm, targeted dose/metric probes, scoped ESLint, build, and scoped
    diff-check gates passed
  - Supabase persistence proof remained skipped in confirm validation because Supabase env was not
    configured

Backend full quality matrix and target-doctrine follow-up, 2026-06-23:

- Root cause: current validators could still accept `valid but weak coaching`, especially when
  no-benchmark visible-Beginner `10K` was generated through low-support policy but scenario
  richness still evaluated it as supported and expected tempo/interval work.
- Aligned low-support `10K` source policy constants with the stricter accepted doctrine:
  Week 1 `120` minutes, Week 1 long run `40` minutes, easy `30`, recovery `25`, peak long run
  `75`, no tempo/intervals/hills/threshold, exact `10000m`.
- Added a no-write quality matrix validator for the selected-plan engine and shared target-readback
  contract proof. The matrix covers:
  `10k_beginner_no_benchmark`, `10k_visible_beginner_sometimes_no_benchmark`,
  `10k_sometimes_recent_5k_benchmark`, `10k_target_time_pressure_diagnostic`,
  `half_beginner_no_benchmark`, `half_supported_no_benchmark`,
  `marathon_base_beginner_no_benchmark`, `marathon_base_supported_no_benchmark`,
  `marathon_completion_beginner_no_benchmark`, and
  `marathon_completion_supported_no_benchmark`.
- Fixed scenario richness evaluation to use the effective low-support `10K` runner level before
  requiring supported tempo/interval richness; the artifact-writing scenario generator is now
  secondary evidence, not the only acceptance gate.
- Target doctrine is now validator-backed across the matrix:
  no pace without recent-5K benchmark truth, benchmark-backed pace reaches useful quality/specific
  rows across all selected families, default estimated HR appears only on aerobic support main
  rows, hard rows never receive default low-HR targets, `hr_targets_allowed` stays `false`, and
  generated target/readback text avoids personal/personalized HR wording.
- Validation evidence:
  - `node --import tsx ./scripts/validate-running-plan-engine-quality-matrix.ts` passed with all
    `10` required fixtures
  - source, 10K builder, R6 builders, confirm, scenario matrix, doctrine, scoped ESLint,
    `npm run build`, and scoped `git diff --check` gates passed
  - confirm benchmark proof preserved pace rows for `10K`, `Half Marathon`, `Marathon Base`, and
    `Marathon Completion`; Supabase persistence proof remained skipped because Supabase env was not
    configured

Structured authoring default-HR doctrine blocker follow-up, 2026-06-23:

- Root cause: selected-plan validation encoded the stricter target doctrine, but structured and
  AI-first generated-plan target generation still had a neighboring path where age-estimated
  `default_estimated_hr` could be emitted on hard tempo/threshold/steady-specificity rows.
- Added one shared backend default-HR allowlist policy and reused it across structured finalization,
  AI-first blueprint normalization, selected-plan target-readback validation, and plan-authoring
  doctrine validation.
- Structured authoring now strips disallowed default-HR targets before canonical metric-mode
  resolution; tempo, threshold, intervals, hills, strides, progression, hard steady/specificity, and
  hard-work recovery targets stay structure/effort-only unless recent-5K benchmark pace truth
  exists.
- Validation evidence:
  - `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` passed
  - `node --import tsx ./scripts/validate-running-plan-engine-quality-matrix.ts` passed
  - `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts` passed
  - targeted structured probes proved no-benchmark threshold/tempo/hard rows emitted `0` fake pace
    and `0` default-HR targets, while benchmark-backed threshold/tempo kept pace targets
  - scoped ESLint, `npm run build`, and scoped `git diff --check` gates passed

Source artifact:

- [workout-metric-enrichment-truth-audit.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-15-workout-metric-enrichment-truth-audit.md>)

## Universal Runner-Facing Richness And Prescription Quality Closeout

Status update, 2026-06-12:

- Accepted as QA-passed and Running Coach accepted.
- Root cause fixed at the backend/canonical generation layer. This was not a frontend copy patch:
  the accepted fix makes the selected-plan engine reject runner-facing flatness and poor executable
  prescription grammar in backend-owned scenario, canonical review, confirm exactness,
  `training-plan-v2`, and imported-plan/export-shaped proof surfaces.
- Scenario pack proof covered `17` acceptance scenarios, all preview-ready, across `10K`,
  `Half Marathon`, `Marathon Base`, and `Marathon Completion`.
- QA and Running Coach acceptance recorded `0` unresolved ranges, `0` unresolved executable
  segments, `0` richness issues, `0` prescription grammar issues, `0` awkward standard durations,
  `0` vague effort-only targets, `0` fake pace, `0` fake personal HR, and `0` forbidden
  runner-facing language.
- `Marathon Base` remains base-only and must not become hidden Marathon Completion.
- `Marathon Completion` remains exact `42195m`, completion-focused, and not a
  performance-marathon path.
- Standard prescription grammar is now device-friendly in backend-owned artifacts.
- Proof boundary: authenticated browser selected-plan UI was not the acceptance surface for this
  gate. The proof surface was backend/source artifact based: scenario JSON, canonical review,
  confirm exactness, `training-plan-v2`, and imported-plan/export-shaped readback.
- Marathon Completion runner-facing selected-option exposure remains separate unless a later
  product/UI gate explicitly accepts it.

Evidence:

- Running Coach source: [running-plan-universal-richness-bar-audit.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-12-running-plan-universal-richness-bar-audit.md>).
- QA artifacts: [running-plan-richness-prescription-qa](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-06-12/running-plan-richness-prescription-qa/>).

Decision:

- The running-plan quality blocker that paused code-freeze cleanup is closed.
- Code-freeze cleanup may resume through the
  [Hito Stack Simplification Strike](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md>).

Changelog decision:

- Add a concise [changelog](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md>)
  entry because this materially changes QA-accepted runner-facing generated plan quality.
- Boundary: the changelog entry must not claim a new authenticated browser UI exposure,
  production rollout, or Marathon Completion selected-option release.

## Backend Supported-Family Richness And Prescription Grammar Result

Status update, 2026-06-12:

- Backend fixed the source-of-truth boundary for awkward executable durations and runner-facing
  target grammar.
- Normal selected-plan time prescriptions now resolve to device-friendly whole-minute durations;
  short repeat-style work/recovery remains intentionally short and numeric.
- Added `running_plan_prescription_grammar_gate_v1` as the shared executable prescription grammar
  validator for preview and canonical review rows.
- Wired prescription grammar validation into common preview validation, canonical selected-plan
  review exactness, generated scenario summaries, coach-review matrix proof, and confirm harness
  proof.
- Extended selected-plan review/confirm typing to include `Marathon Completion` through the
  existing R8 review-token/checksum and active-plan persistence seam; no parallel persistence path
  was added.
- Added `selected_distance_completion_or_checkpoint` as the neutral canonical endpoint identity so
  Half Marathon and Marathon Completion selected-distance endpoints no longer have to emit
  `race_pace_session`.
- Preserved strict metric truth: no fake pace targets, no fake personal HR targets, and
  `structure_only_executable` remains numeric duration, distance, repeat, work, and recovery
  structure instead of RPE-first executable target readback.

Validation:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts src/lib/running-plan-engine-review.ts src/lib/running-plan-engine-actions.ts src/lib/rich-workout-model.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts scripts/validate-running-plan-engine-r6-builders.ts scripts/generate-running-plan-engine-scenarios.ts scripts/running-plan-engine-scenarios/coach-review-matrix.ts scripts/validate-running-plan-engine-confirm.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts` passed.
- `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts` passed:
  `17` acceptance scenarios, `624` coach-review matrix scenarios, `171` preview-ready,
  `453` unavailable, `0` unresolved ranges, `0` unresolved executable segments.
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts` passed for `10K`,
  `Half Marathon`, `Marathon Base`, and `Marathon Completion` stable review drafts.
- `npm run build` passed.

Next recommended role:

- QA should validate the selected-plan review/readback/export surface on the persistent built server
  and confirm that runner-facing copy no longer shows awkward seconds, internal executable labels,
  fake pace, fake personal HR, or `race_pace_session` for supported selected-distance endpoints.

## Previous Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Extend selected running-plan confirm/persist to Marathon Completion.

Stage:
BACKEND implementation / Marathon Completion selected-plan confirm-persist boundary.

PLAN:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md

Product contract:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md

Running Coach source-of-truth contract:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-11-marathon-completion-selected-plan-family-contract.md

Context:
- Product accepted the universal selected-distance no-dead-end UX taxonomy.
- Hito should not block selected-distance plans because the runner is a beginner, low-volume,
  conservative, slow, or needs a long timeline.
- Long horizons are valid plan truth when they make the selected-distance request honest.
- Backend deterministic preview support for `Marathon Completion` is QA-passed.
- `Marathon Completion` is separate from `Marathon Base` and ends with exact `42195m` selected-distance endpoint proof.
- `Marathon Base` remains base-only with `endpointDistanceMeters: null`, `marathon_base_endpoint`,
  no `42195m` rows, and no forbidden runner-facing language.
- Frontend should not expose a new `Finish a Marathon` selected-distance option until the
  create/confirm/persist path is proven for this family.

Root cause and architecture fit:
- Visible symptom: Hito can preview Marathon Completion, but user-facing exposure would be unsafe if
  Create/confirm/persist exactness is not proven for this newly accepted family.
- Underlying cause: selected-plan confirm/persist acceptance previously covered the earlier accepted
  families, before Marathon Completion existed.
- Canonical owner: backend selected running-plan review/confirm/persist contract.
- Reuse the existing R8 selected-plan confirm path, server-side preview rebuild, review
  token/checksum exactness, `training-plan-v2` mapping, and
  `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
- Do not create a parallel persistence path.

Files to inspect:
1. AGENTS.md
2. agents/backend.agent.md
3. skills/hito-backend-supabase-contract/SKILL.md
4. skills/hito-plan-writing-and-closeout/SKILL.md
5. the active plan and Product contract above
6. the Marathon Completion Running Coach contract above
7. src/lib/running-plan-engine-actions.ts
8. src/lib/running-plan-engine-review.ts
9. src/lib/active-plan-persistence.ts
10. src/lib/imported-plan.ts
11. src/lib/training-api.ts
12. src/lib/plan-creation-engine/*
13. scripts/validate-running-plan-engine-confirm.ts
14. scripts/validate-running-plan-engine-r6-builders.ts
15. scripts/generate-running-plan-engine-scenarios.ts

Implement:
1. Extend the selected running-plan confirm/persist contract so a reviewed `Marathon Completion`
   preview can be confirmed and persisted safely.
2. Rebuild the preview server-side during confirm; never trust client-sent rows, workouts, segments,
   endpoint proof, or persistence metadata.
3. Require review token/checksum exactness and reject stale/tampered mismatches.
4. Persist through the existing canonical active-plan seam.
5. Preserve exact `42195m` endpoint truth in the persisted plan rows/metadata.
6. Preserve Marathon Base as base-only; do not let Base inherit `42195m`, completion endpoint,
   target-time readiness, or race-readiness copy.
7. Preserve 10K and Half exact endpoint behavior.
8. Add or extend confirm harness proof for Marathon Completion:
   - fresh confirm success
   - changed start date/setup rejection
   - invalid token rejection
   - checksum mismatch rejection
   - family/source mismatch rejection
   - preview-unavailable rejection
   - duplicate confirm / active-plan conflict
   - no trusted client rows
   - cleanup proof for disposable persistence
9. Keep the path deterministic and OpenAI-free.

What must not change:
- No frontend exposure wiring.
- No DB/schema migration unless source audit proves existing metadata cannot represent the family.
- No active-plan replacement.
- No Plan Preset confirm revival.
- No manual-workout changes.
- No OpenAI normal-path generation.
- No fake pace.
- No fake personal HR.
- No target-time readiness or race-pace copy.
- No Marathon Base overclaim.

Validation:
- Run targeted ESLint for changed backend/source/script files.
- Run `node --import tsx ./scripts/validate-running-plan-engine-source.ts`.
- Run `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`.
- Run `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`.
- Run `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts`.
- Run the non-mutating confirm harness.
- If a safe local/disposable Supabase target is available, run scoped persistence proof with cleanup.
  If only remote Supabase is configured, preserve the existing remote-mutation guard discipline and
  report the live proof as QA-owned unless explicitly scoped.
- Run `npm run build`.
- Run scoped `git diff --check`.
```

## Product Decision: Universal Selected-Distance No-Dead-End UX Taxonomy

Status:

accepted / next backend implementation gate selected.

Source artifact:

[universal-selected-distance-no-dead-end-ux-taxonomy.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md>)

Decision:

- Treat no-dead-end as a universal selected-distance product law, not a Marathon-only exception.
- Do not block preview or creation because the runner is a beginner, low-volume, conservative, slow,
  ambitious, or needs a long timeline.
- Auto-extend when more calendar time makes the plan honest.
- Let the runner accept or reject the long plan after seeing it.
- Preserve structural unavailable states only for insufficient days, impossible long-run placement,
  unrecoverable recovery compression, unsupported family mapping, or a target date below the honest
  family floor.

Current taxonomy:

- `Run 10K` maps to exact `10K` selected-distance family and exact `10000m`.
- `Run a Half Marathon` maps to exact `Half Marathon` selected-distance family and exact `21100m`.
- `Finish a Marathon` maps to `Marathon Completion` and exact `42195m`.
- `Build Marathon Base` remains a separate base-building option with no `42195m` selected-distance
  endpoint.

Next gate:

- BACKEND should extend selected running-plan confirm/persist proof to `Marathon Completion` before
  Frontend exposes the new selected-distance option.

## Owner

ARCHITECT / RUNNING COACH / BACKEND / FRONTEND / QA

## Last Updated

2026-06-11

## Backend Marathon Completion Runner-Facing Copy Blocker Fix

Status:

implemented / QA-passed / accepted.

Root cause:

- Visible symptom: Marathon Completion preview rows contained runner-facing phrases such as
  `race pace` / `race-pace` in negative caution copy.
- Underlying cause: backend-owned runner-facing prescription/cue text and validator scanners were
  not aligned with the Marathon Completion v1 contract; several validators only caught
  `race_pace` and missed spaced/hyphenated/collapsed variants.
- Canonical owner changed: running-plan engine prescription copy and shared runner-facing
  forbidden-language validation, reused by preview builders, family diversity policy, source/R6
  harnesses, and dynamic scenario matrix proof.

What changed:

- Replaced Marathon Completion runner-facing cues with completion-safe language that avoids
  race-pace vocabulary.
- Added a shared forbidden runner-facing language scanner for fake precise pace, personal HR,
  effort-only legacy tokens, race/goal/target pace, target-time, and race-readiness/peak language
  variants.
- Updated dynamic scenario proof to expose a zero-count
  `forbiddenRunnerFacingLanguageScenarioList` alongside fake pace/HR lists.
- Preserved internal negative-proof metadata such as rejected old behavior tokens; the scanner is
  applied to runner-facing rows/templates, not proof metadata.

Next gate:

- BACKEND confirm/persist widening for Marathon Completion before Frontend exposes it as a
  selected-distance option.

## Backend Marathon Completion Preview Family Result

Status:

implemented / QA-passed / accepted for deterministic preview-family scope.

Root cause:

- Visible symptom: Hito had `Marathon Base` as a base-only selected-plan family, but no honest
  selected-distance full-marathon completion preview family.
- Underlying cause: source-of-truth ownership did not yet include a dedicated Marathon Completion
  family, endpoint gate, horizon policy, builder, diversity policy, or matrix proof.
- Canonical owner changed: running-plan engine source model, horizon/composition policy,
  prescription resolver, deterministic preview builder, scenario generator, and source/R6
  validation harnesses.

What changed:

- Added dedicated `Marathon Completion` source-model family support.
- Added exact `42195m` endpoint gate/template and deterministic preview builder.
- Kept `Marathon Base` base-only with `marathon_base_endpoint` and `endpointDistanceMeters: null`.
- Added Marathon Completion horizon policy by runner level/load context, conservative
  run-walk/adaptation handling for beginners, cutback/taper roles, and completion-specific segment
  anatomy.
- Added diversity validation so Completion rejects Base endpoint substitution, hard intervals,
  threshold/hills, fake pace/HR, target-time/race-pace claims, and identity-flat tails.
- Updated source, R6, acceptance, and dynamic Running Coach matrix proof.

Validation evidence:

- targeted ESLint passed for `src/lib/plan-creation-engine/*.ts` and running-plan engine scripts.
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts` passed:
  - `distanceFamilyCount: 4`
  - `endpointTemplateCount: 4`
  - `scenarioRuleCount: 16`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts` passed:
  - 10K remains `12` weeks / `84` rows / `60` non-rest / exact `10000m`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts` passed:
  - Half remains exact `21100m`
  - Marathon Base remains `marathon_base_endpoint`
  - Marathon Completion fixture: `28` weeks / `196` rows / `140` non-rest / exact `42195m`
- `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts` passed:
  - acceptance pack: `17` scenarios / `17` preview-ready / `0` unavailable
  - coach matrix: `624` scenarios / `399` preview-ready / `225` unavailable
  - unresolved range count: `0`
  - unresolved executable segment count: `0`
  - coach-review subset count: `22`

QA rerun acceptance evidence:

- Acceptance pack: `17` scenarios, `17` preview-ready, `0` unavailable.
- Dynamic coach matrix: `624` scenarios, `399` preview-ready, `225` unavailable.
- `unresolvedRangeCount: 0`.
- `unresolvedExecutableSegmentCount: 0`.
- Fake precise pace list: `0`.
- Fake personal HR list: `0`.
- Forbidden runner-facing language list: `0`.
- Artifact hygiene is clean.
- `beginner_marathon_completion` produces `56` weeks, `392` rows, `280` non-rest rows,
  `endpointDistanceMeters: 42195`, `finalWorkoutDayKind: final_selected_distance_day`, and
  `forbiddenMatches: []`.
- 10K endpoint remains exact `10000m`.
- Half Marathon endpoint remains exact `21100m`.
- Marathon Base remains `marathon_base_endpoint`, `endpointDistanceMeters: null`, has no `42195`
  in calendar rows, and has `forbiddenMatches: []`.
- Internal negative-proof metadata may still mention rejected terms, but QA accepted the
  runner-facing scan boundary as correct.

Acceptance decision:

- Accept the Marathon Completion deterministic preview-family backend gate.
- This acceptance is backend preview scope only. It does not claim frontend product exposure,
  create/confirm/persist UI availability, production rollout, OpenAI behavior, DB/schema changes,
  or Supabase mutation.
- Keep Marathon Completion separate from Marathon Base. Do not let Base inherit `42195m`,
  selected-distance endpoint behavior, or completion/race-readiness copy.

Changelog decision:

- Do not update [changelog.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md>) for this closeout.
- Reason: this is QA-passed backend deterministic preview support and artifact validation, not yet
  a user-facing product exposure or shipped runner flow. Add shipped-history only after the selected
  product exposure/create path is accepted.

Next gate:

- BACKEND confirm/persist widening for Marathon Completion, using the accepted universal
  selected-distance product taxonomy and preserving Marathon Base as base-only.

## Architecture Decision: Universal No-Dead-End Running-Plan Doctrine

Status:

accepted / next backend implementation gate selected.

Primary source of truth:

[running-plan-universal-no-dead-end-doctrine.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-universal-no-dead-end-doctrine.md>)

Related source artifacts:

- [beginner-half-marathon-bridge-plan-contract.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-beginner-half-marathon-bridge-plan-contract.md>)
- [running-plan-rich-composition-matrix.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-rich-composition-matrix.md>)
- [running-plan-engine-pattern-library-and-composition-grammar.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-engine-pattern-library-and-composition-grammar.md>)

Decision:

- Accept the universal no-dead-end doctrine as canonical for the running-plan engine.
- Treat the implemented beginner Half Marathon bridge as a valid partial specialization, not as the
  full product boundary.
- Replace normal runner-level/distance ambition blockers with backend-owned horizon selection plus
  structural validation.
- Auto-extend when more calendar time makes the plan honest. Do not ask the runner whether they
  want more weeks, and do not offer a shorter unsafe version.
- Preserve structural unavailable states only when time cannot honestly solve the request or when
  the product does not yet have an honest family mapping.

Valid unavailable reasons going forward:

- insufficient available running days
- blocked long-run day or impossible long-run placement
- recovery compression that cannot be solved by adding more weeks
- unsupported family mapping

Invalid normal unavailable reasons:

- `beginner_new_runner`
- ambitious distance by itself
- weak current fitness by itself
- conservative or heavy load context by itself
- long required duration by itself

Family decisions:

- `10K` remains an exact selected-distance family and should auto-extend when needed.
- `Half Marathon` remains an exact selected-distance family; the beginner bridge is a
  family-specific specialization under the global doctrine.
- `Marathon Base` remains base-only. It must not become hidden Marathon Completion, race readiness,
  target-time readiness, or selected-distance `42195m` endpoint. Beginner/conservative/heavy
  contexts may receive a very long base path when structurally plausible.
- `Marathon Completion` is required before Hito can honestly support a runner selecting
  `I want to run a marathon` as a full selected-distance goal. Until that family contract exists,
  true Marathon selected-distance should remain unavailable as `unsupported_family_mapping`, not
  because the runner is too beginner.

Current beginner Half QA gate:

- The beginner Half backend implementation may still be QA-valid as a partial validation slice.
- It is no longer the top-level acceptance gate for the product boundary.
- Future QA should treat beginner Half as one specialization inside the global no-dead-end law,
  while Backend next implements the global eligibility/horizon-selection layer.

Next gate:

- BACKEND: implement the global no-dead-end eligibility and horizon-selection layer for existing
  running-plan preview families.
- A separate RUNNING COACH / PRODUCT family contract is required later before implementing true
  Marathon Completion.

What remains forbidden:

- frontend copy-only substitution for backend eligibility truth
- OpenAI normal-path plan authorship
- fake precise pace
- fake personal HR
- no-watch/no-app branches
- weakening structural unavailable cases
- turning Marathon Base into a full marathon plan
- merging this with manual workout authoring, Plan Presets, or unrelated cleanup

## Backend Beginner Half Marathon Bridge Implementation

Status:

implemented as a partial specialization / awaiting QA validation, but superseded as the top-level
product boundary by the universal no-dead-end doctrine above.

Primary source of truth:

[beginner-half-marathon-bridge-plan-contract.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-beginner-half-marathon-bridge-plan-contract.md>)

Root cause:

- Visible symptom: beginner Half Marathon selected-plan preview could still resolve to
  `Create unavailable`.
- Underlying cause: the Half Marathon builder, diversity validator, and scenario matrix still
  encoded the old `beginner_new_runner` unsupported gate.
- Canonical owner: running-plan engine Half builder/policy, composition grammar, prescription
  resolver, scenario generator, and R6 validation harness.

What changed:

- Added a focused backend policy owner for beginner Half Marathon bridge horizons, adaptation
  windows, cutbacks, taper/endpoint week, development-touch cadence, and conservative long-run
  bounds.
- Updated the Half Marathon builder to auto-extend beginner bridge previews instead of treating
  beginner runner level as unsupported.
- Updated composition grammar and prescription resolver so beginner Half bridge weeks carry
  run-walk/easy adaptation, frequent cutbacks, light strides, limited late tempo-like durability,
  varied long-run checkpoints, and exact `21100m` endpoint proof.
- Updated scenario rules and dynamic coach-review matrix assertions so beginner Half is
  preview-ready for plausible `3d/4d/5d` standard and conservative schedules.
- Preserved beginner Marathon Base as unavailable at the time of that narrow slice. This is now
  superseded by the universal doctrine: Marathon Base should become an honest long base path when
  structurally plausible, while true Marathon Completion remains a separate unsupported family
  mapping until its own contract exists.

Backend validation evidence:

- `node --import tsx ./scripts/validate-running-plan-engine-source.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts` passed and proved:
  - standard `5d` beginner Half: `24` weeks / `168` rows / `120` non-rest / exact `21100m`
  - standard `4d` beginner Half: `28` weeks
  - standard `3d` beginner Half: `32` weeks
  - conservative `5d` beginner Half: `28` weeks
  - conservative `4d` beginner Half: `32` weeks
  - conservative `3d` beginner Half: `36` weeks
- `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts` passed with:
  - acceptance scenarios: `13` total, `12` preview-ready, `1` unavailable
  - dynamic matrix: `468` total, `276` preview-ready, `192` unavailable
  - `unresolvedRangeCount: 0`
  - `unresolvedExecutableSegmentCount: 0`
  - `coachReviewSubsetCount: 16`

Boundaries preserved:

- No OpenAI path.
- No create/confirm/persist path change.
- No Supabase mutation or DB/schema change.
- No fake precise pace or fake personal HR.
- No frontend route/UI change in this backend slice.
- Marathon Base beginner unsupported behavior was bounded in that narrow slice, but is now
  superseded by the universal no-dead-end doctrine and must be replaced by honest long base
  horizon selection when structurally plausible.

## Architecture Acceptance Closeout For Selected-Plan Create

Decision: accept the selected running-plan preview-to-create path after successful built-server
browser QA.

Root cause closed:

- Visible symptom: the selected-plan preview showed `Create unavailable`.
- Root cause: the system did not yet have accepted backend confirm/persist proof, then browser
  Create acceptance was blocked by dev-server/browser tooling instability.
- Canonical owner:
  - Backend owns review token/checksum, server-side preview rebuild, exactness validation, canonical
    persistence, and active-plan conflict behavior.
  - Frontend owns thin interaction wiring only.
  - QA proved the browser path against a stable production-built local server.

Accepted built-server browser QA proof:

- Built-in Codex Browser was used first against `http://127.0.0.1:8099/`.
- `10K` preview showed enabled `Create plan`, `70` cells, exact `10000m endpoint`, `Reviewed`,
  `Not saved yet`, and `No OpenAI`.
- `Half Marathon` preview showed enabled `Create plan`, `98` cells, and exact `21100m`.
- `Marathon Base` preview showed enabled `Create plan`, `112` cells, and
  `marathon_base_endpoint`.
- Mobile `375px` no-overflow passed.
- QA clicked `Create plan` for `Marathon Base` in a disposable tester state.
- UI transitioned to saved active-plan home/calendar state.
- DB readback after create showed exactly:
  - `1` active `plan_cycles` row
  - `112` `planned_workouts`
  - source kind `running_plan_engine_marathon_base_builder_v1`
  - source status `confirmed_selected_plan`
  - review contract version `running_plan_review_v1`
- Cleanup returned all scoped disposable records to zero:
  - `runnerProfiles: 0`
  - `planCycles: 0`
  - `plannedWorkouts: 0`
  - `workoutLogs: 0`
- Source proof confirms frontend sends only:
  - `previewInput`
  - `planFamily`
  - `sourceKind`
  - `reviewToken`
  - `reviewChecksum`

Acceptance boundary:

- The selected-plan Create path is accepted for local/built-server QA evidence.
- This does not approve production rollout by itself.
- This does not approve active-plan replacement, manual workout CRUD, OpenAI normal-path generation,
  DB/schema changes, old Plan Preset confirm revival, target-time fake pace, fake personal HR,
  no-watch/no-app branches, or Marathon Base race overclaim.

Next gate:

- Final `ARCHITECT` closeout/archive decision for this active rebuild plan.
- If the exit criteria are met, archive this plan and resume service-size cleanup through the
  separate Hito Stack Simplification Strike.

## Architecture Acceptance Closeout For R8 Confirm/Persist

Decision: accept Backend Slice R8 selected running-plan preview-to-confirm-to-persist boundary and
hand off a bounded frontend Create wiring slice.

What is accepted:

- R8 uses backend-issued review proof:
  - `reviewToken`
  - `reviewChecksum`
  - `reviewContractVersion: running_plan_review_v1`
- Confirm rebuilds the selected preview server-side before persistence.
- Confirm rejects stale or unsafe review attempts before persistence:
  - changed start date
  - changed setup
  - invalid token
  - mismatched checksum
  - family/source mismatch
  - extra client rows
  - preview-unavailable state
- Confirm does not trust client-sent calendar rows.
- Confirm persists through the existing canonical active-plan persistence owner:
  `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
- Active-plan conflicts remain bounded as `active_plan_exists`.
- Old Plan Preset confirm remains bounded `preview_only` and is not revived.
- The schema-aware harness cleanup/readback fix preserves the correct source-of-truth boundary:
  it changes only the validation harness table cleanup/readback ownership and does not change product
  runtime persistence semantics.

Scoped remote QA persistence evidence accepted:

- Target: `https://dltfjwexyctmihclcjqj.supabase.co`
- Mode: `remote_disposable_supabase_override`
- `10K` persisted: `70` rows / `50` non-rest / exact `10000m`
- `Half Marathon` persisted: `98` rows / `70` non-rest / exact `21100m`
- `Marathon Base` persisted: `112` rows / `80` non-rest / `marathon_base_endpoint`
- Harness asserted:
  - changed start date/setup rejection
  - invalid token rejection
  - mismatched checksum rejection
  - family/source mismatch rejection
  - extra client rows rejection
  - preview-unavailable rejection
  - duplicate confirm returns `active_plan_exists`
  - no trusted client rows
  - no fake pace
  - no personal HR targets
  - old Plan Preset confirm remains `preview_only`
- Cleanup readback confirmed:
  - `qaAuthUsersRemaining: 0`
  - `workout_logs: 0`
  - `planned_workouts: 0`
  - `plan_cycles: 0`
  - `runner_profiles: 0`

Size/ownership decision:

- The historical R8 size/ownership note is no longer a blocker for frontend Create wiring because:
  - live persistence proof passed
  - confirm uses the existing active-plan persistence seam
  - `training-api.ts` only exposes the route-facing action exports
  - no second persistence system was introduced
- The size concern remains a cleanup follow-up, not acceptance blocker:
  - `src/lib/running-plan-engine-review.ts` is still about `848` lines
  - `scripts/validate-running-plan-engine-confirm.ts` is now about `789` lines after schema-aware
    harness cleanup/readback assertions
  - no new responsibilities should be added to those files without a focused extraction or explicit
    architecture approval

Frontend Create gating after acceptance:

- Frontend may now wire a Create action for the accepted selected-plan preview path.
- Frontend must pass only setup input, selected family/source kind, `reviewToken`, and
  `reviewChecksum` to `confirmRunningPlanDraft(...)`.
- Frontend must not send calendar rows, generated workouts, canonical rows, segment data, endpoint
  proof, metric truth, or persistence metadata.
- Frontend must render backend-shaped success/error states and refresh into saved active-plan state
  only after backend `created` success.

Still forbidden:

- production rollout approval from this acceptance alone
- active-plan replacement/refresh
- client-sent plan rows
- frontend-owned schedule, metric, endpoint, or persistence truth
- DB/schema changes
- old Plan Preset confirm revival
- OpenAI normal-path generation
- target-time fake pace
- fake personal HR
- no-watch/no-app branches
- Marathon Base race-readiness or `42195m` overclaim
- manual workout creation/edit/copy/paste/recurrence

## Architecture Validation-Environment Decision For R8 Persistence Proof

Status update, 2026-06-10: this section records the validation strategy that unblocked R8 live
persistence proof. The scoped proof has now passed; see the acceptance closeout above for the
current frontend Create gating decision.

Decision: accept exactly one live persistence proof path for R8 before frontend Create wiring:
explicit disposable remote Supabase validation against project `dltfjwexyctmihclcjqj`.

Rationale:

- Source-only/non-mutating exactness checks are necessary but not sufficient for full confirm/persist
  acceptance because R8 introduces real `plan_cycles`, `planned_workouts`, and `runner_profiles`
  mutation through the canonical active-plan persistence seam.
- Local disposable Supabase remains the preferred default validation shape, but it is not currently
  executable in this shell because `supabase` and `docker` are unavailable.
- The harness now has the required mutation guardrails:
  - non-mutating review/checksum/input-mismatch checks run by default
  - loopback Supabase targets are treated as local disposable targets
  - remote Supabase mutation is blocked by default
  - remote mutation requires both `--allow-remote-disposable-supabase-mutation` and
    `HITO_RUNNING_PLAN_CONFIRM_ALLOW_REMOTE_MUTATION=I_UNDERSTAND_THIS_MUTATES_REMOTE_DISPOSABLE_SUPABASE`
  - `--require-persistence` fails fast when no safe persistence target is available
  - disposable cleanup counts remaining `workout_logs`, `plan_cycles`, `planned_workouts`, and
    `runner_profiles`, and deletes the disposable auth user
- The existing remote project `dltfjwexyctmihclcjqj` is already the configured project in local env,
  so the smallest accepted path is a scoped QA run against disposable remote users, not a new
  environment build-out.

## Backend Slice R8 Persistence Harness Schema-Aware Cleanup Result

- QA ran the approved scoped remote persistence proof against Supabase project
  `dltfjwexyctmihclcjqj`.
- Remote safety guard and non-mutating checks passed, but live cleanup verification failed because
  the harness counted every disposable table with `.select("id", { count: "exact", head: true })`.
- Root cause: disposable cleanup/readback was schema-blind. `runner_profiles` is keyed/read back by
  `user_id` and has no `id` column, so the harness cleanup proof could fail after otherwise valid
  persistence behavior.
- Backend fix:
  - `scripts/validate-running-plan-engine-confirm.ts` now defines one schema-aware disposable table
    contract for every table it cleans up
  - each spec records table name, user ownership column, count/select column, and cleanup proof key
  - cleanup order remains explicit: `workout_logs`, `planned_workouts`, `plan_cycles`,
    `runner_profiles`
  - `runner_profiles` uses `user_id` as both owner and count/select column
  - cleanup proof remains strict and now verifies zero remaining `workout_logs`, `plan_cycles`,
    `planned_workouts`, and `runner_profiles` rows before reporting auth user deletion
- Product runtime persistence, DB schema, migrations, frontend Create wiring, and active-plan
  persistence semantics were not changed.

Accepted QA proof path:

1. Run the non-mutating harness first.
2. Run `--require-persistence` without remote override and confirm it blocks before mutation.
3. Confirm the target project ref is exactly `dltfjwexyctmihclcjqj`.
4. Run the persistence harness only with the explicit remote-disposable CLI flag plus exact env
   confirmation.
5. Prove each supported family persists and cleans up:
   - `10K`: `70` rows / `50` non-rest / exact `10000m` endpoint
   - `Half Marathon`: `98` rows / `70` non-rest / exact `21100m` endpoint
   - `Marathon Base`: `112` rows / `80` non-rest / `marathon_base_endpoint`
6. Prove duplicate confirm is bounded by `active_plan_exists`.
7. Prove cleanup leaves `0` disposable `workout_logs`, `plan_cycles`, `planned_workouts`, and
   `runner_profiles` rows and deletes each disposable auth user.

Rejected proof paths:

- Do not accept source-only/non-mutating checks as full R8 persistence acceptance.
- Do not require frontend Create wiring before persistence proof.
- Do not use production or unknown remote projects.
- Do not run broad remote mutations outside the script's disposable user namespace.
- Do not add DB/schema changes to make the proof easier.

Frontend Create gating:

- This scoped persistence proof has passed and now unblocks the bounded frontend Create wiring
  handoff above.
- The passed scoped remote proof does not by itself approve production rollout, active-plan
  replacement, manual workout CRUD, OpenAI changes, new preset families, or DB/schema changes.

## Historical Architecture Size Gate Decision For Backend Slice R8

Current status note, 2026-06-10: this section records the prior R8 size/ownership gate. The
immediate active gate is now the scoped persistence-proof QA run above. Passing the persistence
proof does not approve frontend Create by itself; Architect still needs to close out R8 with both
the live persistence evidence and the remaining size/ownership status before frontend wiring.

Historical decision: block QA briefly and require `BACKEND Slice R8B` no-behavior-change
decomposition before QA validates confirm/persist.

Size findings:

- Tracked R8 diff for the named files is `834` insertions / `87` deletions, but this undercounts
  the slice because two R8 files are currently untracked.
- Runtime/action files:
  - `src/lib/running-plan-engine-actions.ts`: `373` lines, tracked, about `331` added lines.
  - `src/lib/running-plan-engine-review.ts`: `848` lines, untracked new runtime module.
  - `src/lib/training-api.ts`: `652` lines, tracked, only `3` added export lines for R8.
- Validation harness:
  - `scripts/validate-running-plan-engine-confirm.ts`: `515` lines, untracked new validation
    entrypoint.
- Plan/docs:
  - this active plan is `1533` lines after accumulated rebuild evidence; R8 added about `500`
    tracked documentation lines.

Architecture findings:

- R8 behavioral direction is accepted:
  - `confirmRunningPlanDraft(...)` rebuilds the preview server-side.
  - client-sent calendar rows are rejected by the strict input schema.
  - persistence reuses `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
  - the canonical persistence seam still owns active-plan guard and rollback-on-workout-insert
    failure.
  - `training-api.ts` is not materially bloated by R8.
  - old Plan Preset review/confirm remains bounded `preview_only`.
- R8 size/ownership risk is real:
  - the new review module mixes review proof, canonical mapping, segment prescription mapping,
    persistence metadata, profile patching, source-kind helpers, metric/composition summaries, and
    crypto/stable JSON helpers.
  - at `848` lines, it crosses the project's large-file watch threshold before QA has accepted the
    mutation boundary.
  - letting QA pass this shape would harden a broad bridge module into another plan-creation owner.

Required R8B cleanup:

- Keep behavior exactly stable.
- Extract the canonical `training-plan-v2` mapping and segment/workout mapping out of
  `src/lib/running-plan-engine-review.ts` into a focused backend-owned module.
- Keep review proof/token/checksum exactness in `src/lib/running-plan-engine-review.ts`.
- Keep the action API, validation harness entrypoint, source metadata, active-plan guard, and
  persistence seam unchanged.
- Re-run the R8 confirm harness and existing builder/source validators before handing back to QA.

## Backend Slice R8 Confirm/Persist Contract Result

- Implemented selected running-plan review exactness in
  `src/lib/running-plan-engine-review.ts`.
- Preview-ready selected-plan drafts now carry backend-issued stable review proof:
  - `reviewToken`
  - `reviewChecksum`
  - `reviewContractVersion: running_plan_review_v1`
  - canonical row counts
- Added `confirmRunningPlanDraft(...)` and `confirmRunningPlanDraftForUser(...)` in
  `src/lib/running-plan-engine-actions.ts`.
- Confirm accepts only setup input, selected family/source kind, review token, and checksum.
- Confirm rebuilds the preview server-side, validates stable checksum/token exactness, maps the
  rebuilt result into canonical `training-plan-v2`, and persists through the existing
  `createFirstPlanFromReviewedCanonicalPlanForUser(...)` seam.
- No client-sent calendar rows are accepted or trusted.
- Active-plan conflicts return bounded `active_plan_exists` and do not replace existing plans.
- Source metadata records:
  - source kind/status
  - selected family
  - runner level and load context
  - row counts
  - endpoint proof
  - metric policy
  - composition grammar proof
  - review checksum/version
- Added `scripts/validate-running-plan-engine-confirm.ts` for R8 review/confirm/persist proof.

R8 proof:

- 10K confirm harness: `70` calendar rows / `50` non-rest rows / exact `10000m` endpoint.
- Half Marathon confirm harness: `98` calendar rows / `70` non-rest rows / exact `21100m`
  endpoint.
- Marathon Base confirm harness: `112` calendar rows / `80` non-rest rows /
  `marathon_base_endpoint` with no selected-distance `42195m` claim.
- Fresh review token validates after immediate server-side rebuild.
- Changed start date, changed setup, tampered rows, invalid token, mismatched checksum,
  source/family mismatch, extra client rows, and preview-unavailable results are rejected before
  persistence.
- Supabase persistence harness creates disposable users, confirms each supported family, verifies
  persisted row counts/source metadata, verifies duplicate confirm is blocked by the active-plan
  guard, and cleans up disposable data only after a safe local/disposable target preflight passes.
- Legacy Plan Preset confirm remains `preview_only`.

Validation evidence:

- `npm exec eslint -- src/lib/running-plan-engine-actions.ts src/lib/running-plan-engine-review.ts src/lib/training-api.ts scripts/validate-running-plan-engine-confirm.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
- `node --env-file=.env.local --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
  blocked remote mutation by default and ran only non-mutating exactness checks.

## Backend Slice R8 Confirm/Persist QA Safety Blocker Result

- Root cause: the confirm/persist validation harness previously treated any configured Supabase
  server env as a runnable persistence target, so QA only had a remote `.env.local` target and no
  deterministic local/disposable mutation boundary.
- The harness now runs stable non-mutating review/checksum/input-mismatch checks regardless of
  Supabase env.
- Persistence mutation now requires a target preflight:
  - loopback Supabase URLs such as `localhost` / `127.0.0.1` / `::1` are treated as local
    disposable targets
  - remote Supabase URLs are blocked by default
  - remote mutation requires both the explicit CLI flag
    `--allow-remote-disposable-supabase-mutation` and the exact env confirmation
    `HITO_RUNNING_PLAN_CONFIRM_ALLOW_REMOTE_MUTATION=I_UNDERSTAND_THIS_MUTATES_REMOTE_DISPOSABLE_SUPABASE`
  - `--require-persistence` fails fast with an explicit blocker when no safe persistence target is
    available
- Disposable cleanup proof now counts remaining `plan_cycles`, `planned_workouts`, and
  `runner_profiles` rows for the disposable user after cleanup and confirms auth user deletion.
- Current checkout status:
  - `.env.local` points to remote project `dltfjwexyctmihclcjqj.supabase.co`
  - the harness detects that target and blocks mutation before any Supabase writes
  - local Supabase tooling is unavailable in this shell (`supabase: command not found`), so true
    local/disposable persistence proof remains blocked until a local target is started or an
    approved disposable remote override is explicitly scoped
- QA status: safety blocker fixed; full persistence acceptance is still gated on running the harness
  against a local/disposable Supabase target.
- Architecture follow-up, 2026-06-10: local disposable Supabase remains unavailable in this shell,
  so the accepted R8 proof path is now a scoped disposable remote run against project
  `dltfjwexyctmihclcjqj` using the harness's explicit remote flag and env confirmation. Frontend
  Create remains blocked until that proof passes and Architect closes out the R8 acceptance gate.

## Backend Exact Prescription Slice Result

- Implemented a shared exact-prescription resolver for running-plan preview rows.
- Preview builders now resolve coach-authored template ranges into exact numeric duration,
  distance, repeat, work, and recovery prescriptions before returning watch-executable rows.
- 10K, Half Marathon, and Marathon Base validators now reject unresolved executable ranges instead
  of accepting positive `min/max` ranges as executable.
- Professional/competitive development sequences now diverge from `runs_a_lot` where doctrine
  requires visible progression:
  - 10K adds a stronger week 6 interval stimulus.
  - Half Marathon adds a professional week 9 interval stimulus.
  - Marathon Base adds a professional week 14 threshold stimulus without adding intervals.
- Added scenario JSON generation for QA under `qa-artifacts/plan-engine-scenarios/2026-06-09/`.
- Validation evidence:
  - targeted ESLint passed for plan-creation-engine files and validators
  - source model validator passed
  - 10K builder validator passed
  - R6 Half/Marathon builder validator passed
  - scenario JSON generator passed with `13` scenarios and `0` unresolved executable ranges
  - `npm run build` passed

## Backend Fake Metric Truth Boundary Fix Result

- QA found `fakePrecisePaceAppears` and `fakePersonalHrAppears` failures in the generated scenario
  JSON pack after the exact-prescription slice.
- Root cause: the scenario generator scanned the full draft JSON, which counted internal
  negative-proof metadata as runner-facing fake output:
  - `draft.validation.forbiddenOutputGateIdsChecked`
  - `draft.validation.rejectedOldBehaviorSignalsChecked`
  - `draft.endpointProof.rejectedGenericFinalOutputs`
- Builder rows and segment prescriptions did not contain fake precise pace or fake personal HR
  targets.
- Fixed the scenario generator so fake metric flags scan runner-facing/executable
  `draft.calendarRows` only, while keeping internal negative-proof metadata in the artifact.
- Added explicit `unresolvedRangeCount` alongside `unresolvedExecutableSegmentCount`.
- Regenerated scenario proof:
  - `unresolvedRangeCount: 0`
  - `unresolvedExecutableSegmentCount: 0`
  - preview-ready `fakePrecisePaceAppears: false`
  - preview-ready `fakePersonalHrAppears: false`

## Backend Running Coach Scenario-Pack Follow-Up Result

- Implemented the Running Coach should-fix for Half Marathon durability specificity and long-run
  detail variety.
- Root cause: preview rows were exact and safe, but Half Marathon `sometimes_runs` still relied on
  generic tempo/interval labels and Half/Marathon Base long runs over 90 minutes repeated the same
  checkpoint/finish shell.
- Changed the backend resolver/anatomy seam so:
  - `sometimes_runs_half_marathon` includes a mid/late `half_marathon_durability_tempo` signal
  - Half Marathon long runs over 90 minutes rotate endurance, fueling, posture, and controlled
    steady-finish detail
  - Marathon Base long runs over 90 minutes rotate time-on-feet, fueling/form, posture, and durable
    finish detail without claiming marathon race readiness
- Scenario proof after regeneration:
  - `sometimes_runs_half_marathon` has week 11 `half_marathon_durability_tempo`
  - `sometimes_runs_half_marathon` long runs over 90 minutes expose `3` checkpoint intents and `3`
    finish intents
  - `sometimes_runs_marathon_base` long runs over 90 minutes expose `3` checkpoint intents and `3`
    finish intents
  - `unresolvedRangeCount: 0`
  - `unresolvedExecutableSegmentCount: 0`
  - fake pace scenario list remains empty
  - fake personal HR scenario list remains empty

## Backend Pattern Grammar Integration Result

- Implemented `running_plan_composition_grammar_v1` as the canonical backend composition layer for
  selected-plan previews.
- Root cause: week archetype, development touch, long-run role, and family-specific signals were
  still split across per-family policies and scenario assertions, so quality issues were being fixed
  symptom-by-symptom.
- New ownership seam:
  - `src/lib/plan-creation-engine/composition-grammar.ts` owns week archetypes, development touch
    resolution, family signals, long-run roles, and composition grammar validation.
  - 10K, Half Marathon, and Marathon Base diversity policies now read development touches from the
    grammar instead of owning separate switch tables.
  - segment enrichment now reads grammar signals/long-run roles before applying Half durability and
    long-run detail labels.
- Scenario JSON now exposes `compositionGrammar` proof:
  - `weekArchetypeSequence`
  - `plannedDevelopmentSequence`
  - `actualDevelopmentSequence`
  - `developmentTouchCountsByWeek`
  - `familySignals`
  - `longRunRoleSequence`
  - `forbiddenCombinationHits`
- Validation evidence:
  - targeted ESLint passed for plan-creation-engine files and running-plan validators
  - source model validator passed
  - 10K builder validator passed
  - R6 Half/Marathon builder validator passed
  - scenario generator passed with `13` scenarios, `11` preview-ready, `2` unavailable,
    `0` unresolved ranges, and `0` unresolved executable segments
  - `npm run build` passed
  - scoped `git diff --check` passed
- QA focus:
  - verify scenario JSON grammar proof is readable and sufficient
  - verify Half `sometimes_runs` no longer depends on generic tempo repetition alone
  - verify no create/confirm/persist path was enabled
  - verify metric truth and endpoint gates remain intact

## Backend Dynamic Scenario Matrix Result

- Extended `scripts/generate-running-plan-engine-scenarios.ts` so it now preserves the existing
  `13`-scenario acceptance pack and also generates a broader Running Coach review matrix under
  `qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/`.
- Root cause: the previous static pack was useful as a release gate, but too narrow for coaching
  review across family, runner level, body/load profile, days/week, rest pattern, long-run
  preference, and start-date shape.
- New matrix proof:
  - total scenarios: `396`
  - preview-ready: `269`
  - preview-unavailable: `127`
  - families: `10K`, `Half Marathon`, `Marathon Base`
  - runner levels: `beginner_new_runner`, `sometimes_runs`, `runs_a_lot`,
    `professional_competitive`
  - body/load profiles: `young_light`, `average_adult`, `older_heavier`, `tall_heavier`,
    `shorter_light`
  - days/week: `3`, `4`, `5`
  - rest patterns: `none`, `wednesday_saturday`, `monday_friday`
  - long-run preferences: `sunday`, `saturday`, `unset_default`
  - start patterns: `normal_monday`, `midweek_wednesday`
- Matrix summary now includes aggregate counts, unavailable reason counts, row/non-rest
  distributions, workout-kind counts, development sequences, composition grammar proof, endpoint
  proof, metric-truth proof, and create/confirm/persist boundary proof.
- Added `coach-review-subset.json` with `12` representative scenarios for first-pass Running Coach
  review, while retaining full JSON for every generated scenario.
- Boundary proof:
  - no OpenAI call
  - no Supabase mutation
  - no create path
  - no confirm path
  - no persist path
  - `unresolvedRangeCount: 0`
  - `unresolvedExecutableSegmentCount: 0`
  - fake precise pace scenario list remains empty
  - fake personal HR scenario list remains empty

## Backend Rich Composition Matrix Result

- Implemented the Running Coach rich composition matrix as the canonical backend
  `running_plan_composition_grammar_v1` layer before create-path work.
- Root cause: conservative Half Marathon and higher-support conservative Marathon Base previews
  were safe, exact, and non-mutating, but could still collapse into repeated `strides`/`tempo`
  support without preserving family-specific durability identity.
- Changed the canonical grammar/resolver seam so:
  - conservative Half Marathon keeps soft `half_specific_durability` tempo plus long-run
    `half_long_run_durability` / `half_long_run_steady_finish` roles
  - conservative Marathon Base keeps `marathon_base_time_on_feet` and
    `marathon_base_steady_finish` long-run roles without becoming a hidden race plan
  - long-run detail enrichment now follows composition roles even when conservative long runs are
    intentionally at or below the old 90-minute enrichment threshold
  - compressed low-availability schedules with no honest non-adjacent development slot become
    bounded `builder_validation_failed` previews instead of squeezing development onto the day
    before the long run
- Updated family validators so conservative Half/Marathon richness must appear in generated segment
  anatomy, not only in abstract grammar metadata.
- Updated the dynamic coach-review matrix:
  - total scenarios: `468`
  - preview-ready: `247`
  - preview-unavailable: `221`
  - unavailable reasons: `long_run_day_blocked: 33`, `insufficient_available_days: 80`,
    `builder_validation_failed: 30`, `unsupported_runner_level_for_family: 78`
  - `coach-review-subset.json` had `16` scenarios at that checkpoint, including conservative Half,
    conservative Marathon Base, then-blocked beginner Half, blocked long-run/rest conflict, and
    compressed low-availability `builder_validation_failed`; the beginner Half outcome is superseded
    by the later auto-extended bridge slice above.
  - fake precise pace scenario list remains empty
  - fake personal HR scenario list remains empty
  - forbidden composition combinations remain empty
  - multiple development touches remain empty
- Boundary preserved:
  - no create path
  - no confirm path
  - no persistence path
  - no Supabase mutation
  - no OpenAI path
  - no frontend route/UI change in this slice

## Backend Dynamic Artifact Hygiene Result

- Fixed non-blocking QA artifact hygiene before Running Coach acceptance.
- Root cause: `scripts/generate-running-plan-engine-scenarios.ts` wrote current scenario JSON files
  over the existing output directory but never pruned JSON files from older matrix shapes, so raw
  folder scans could see stale unreferenced scenarios.
- The scenario-pack writer now self-cleans top-level stale `.json` files before regeneration while
  preserving current scenario JSON, `summary.json`, and `coach-review-subset.json`.
- Regeneration removed `171` stale JSON files from
  `qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/`.
- Post-regeneration proof:
  - `468` referenced scenario JSON files
  - `470` total JSON files (`468` scenarios plus `summary.json` and `coach-review-subset.json`)
  - `0` unreferenced JSON files
  - `0` missing referenced scenario files
  - then-current dynamic matrix counts preserved: `468` total, `247` preview-ready, `221`
    unavailable
  - `unresolvedRangeCount: 0`
  - `unresolvedExecutableSegmentCount: 0`
  - fake precise pace list remains empty
  - fake personal HR list remains empty

## Backend Universal No-Dead-End Horizon Result

- Implemented the global backend-owned no-dead-end eligibility and horizon-selection layer as
  `running_plan_horizon_policy_v1`.
- Root cause: family builders and scenario validators still preserved older runner-level dead ends,
  especially beginner Marathon Base, even when a longer honest horizon could safely produce a
  preview.
- Changed the canonical preview normalization/building seam so normal coach-plausible combinations
  choose an honest horizon instead of returning `unsupported_runner_level_for_family`.
- Horizon policy now owns current preview lengths:
  - 10K standard `12-16` weeks and conservative `16-20` weeks depending on days/week.
  - Half Marathon standard `24-32` weeks and conservative `28-36` weeks depending on days/week.
  - Marathon Base standard `24-40` weeks and conservative `32-52` weeks depending on days/week.
- Preserved structural unavailable states only:
  - `long_run_day_blocked`
  - `insufficient_available_days`
  - `builder_validation_failed` for compressed calendars that cannot keep spacing/recovery safely
- Updated Marathon Base beginner handling so the late long-run phase can carry conservative
  time-on-feet / steady-finish durability while still avoiding hidden tempo, threshold, intervals,
  hills, full-marathon endpoint, race readiness, or target-time claims.
- Updated source, 10K, R6, and dynamic scenario validators so the old runner-level unavailable
  path no longer counts as valid proof.
- Regenerated the dynamic coach-review matrix:
  - total scenarios: `468`
  - preview-ready: `305`
  - preview-unavailable: `163`
  - unavailable reasons: `long_run_day_blocked: 39`, `insufficient_available_days: 84`,
    `builder_validation_failed: 40`
  - `unsupported_runner_level_for_family: 0`
  - `coach-review-subset.json` now has `18` scenarios, including beginner and conservative
    beginner Marathon Base preview-ready representatives
  - unresolved range count remains `0`
  - unresolved executable segment count remains `0`
  - fake precise pace scenario list remains empty
  - fake personal HR scenario list remains empty
- Boundary preserved:
  - no frontend route/UI change
  - no Supabase mutation
  - no DB/schema change
  - no OpenAI path
  - no create/confirm/persistence semantic change

## QA Acceptance Closeout: Global No-Dead-End Horizon Selection

Date: 2026-06-10

Status:

QA-passed / accepted for the backend/source/CLI/JSON gate.

Root cause:

- Visible symptom: some selected-plan cases could still become unavailable because the runner was a
  beginner, conservative, heavy-load, or needed a long honest duration.
- Underlying cause: eligibility remained partly encoded as runner-level/family blocking instead of
  backend-owned horizon selection plus structural validation.
- Canonical owner: running-plan engine eligibility/horizon policy and family builders.

QA evidence recorded:

- Browser was not used because this gate was backend/source/CLI/JSON only.
- Acceptance pack: `13` scenarios, `13` preview-ready, `0` unavailable.
- Dynamic coach matrix: `468` scenarios, `305` preview-ready, `163` unavailable.
- Remaining unavailable reasons are structural only.
- `unsupported_runner_level_for_family: 0`.
- Beginner preview-ready count: `92`.
- Conservative preview-ready count: `50`.
- `unresolvedRangeCount: 0`.
- `unresolvedExecutableSegmentCount: 0`.
- 10K endpoint remains exact `10000m`.
- Half Marathon endpoint remains exact `21100m`.
- Marathon Base remains `marathon_base_endpoint`.
- Marathon Base runner-facing rows have no `42195m`, race-readiness, race-pace, target-time, or
  selected-distance endpoint claim.
- No fake precise pace and no fake personal HR appeared in `draft.calendarRows`.
- Artifact hygiene passed: `468` referenced scenario JSON files, `0` missing, `0`
  stale/unreferenced.
- Source audit found no Supabase, DB/schema, OpenAI, frontend/UI, create/confirm, persistence,
  shipped 5K, target-time pace truth, or manual CRUD path introduced.
- Validation passed: targeted ESLint, source validator, 10K validator, R6 validator, scenario
  generator, build, and scoped diff check.

Acceptance decision:

- Accept the global no-dead-end backend gate as QA-passed.
- The engine now proves it can build coach-plausible 10K, Half Marathon, and Marathon Base previews
  through backend-owned dynamic horizons without normal runner-level dead ends.
- Do not treat this as product rollout acceptance by itself. The next question is coaching quality:
  whether newly preview-ready beginner, conservative, and long-horizon plans are rich, phased, and
  credible enough rather than merely valid.

Next gate:

- RUNNING COACH quality audit of the newly expanded long-horizon matrix before further product/UX
  rollout.

What remains forbidden:

- product code changes in this Architect closeout
- frontend/UI work
- create/confirm/persist/Supabase mutation
- OpenAI normal-path authorship
- fake precise pace or fake personal HR
- Marathon Base overclaim or hidden Marathon Completion behavior
- Marathon Completion implementation before a dedicated family contract exists
- manual-workout merge into this running-plan track

## Backend Long-Horizon Anti-Flatness Repair Result

Date: 2026-06-10

Status:

BACKEND implemented / ready for Running Coach acceptance.

Root cause:

- Visible symptom: several newly preview-ready long-horizon Marathon Base beginner/conservative
  scenarios were safe but read as too flat after early touches, especially across the middle and
  second half of the plan.
- Underlying cause: `running_plan_horizon_policy_v1` could safely extend horizons, but the
  composition layer did not reintroduce soft family identity often enough for long horizons.
- Canonical owner: running-plan source model, composition grammar, family diversity gates, and
  scenario generator/readback.

What changed:

- Added canonical `steady_aerobic_run` as a numeric-structure support workout template. It is
  watch-executable by structure and default editable HR cap only; it does not invent precise pace or
  personal HR truth.
- Added `steady_support_week`, `steady_aerobic_run` development-touch support, and family signals
  for 10K and Marathon Base composition readback.
- Added beginner/conservative Marathon Base soft bridge logic:
  - early and mid-block strides
  - later steady aerobic bridge weeks
  - additional late steady bridge for very long horizons
- Added conservative long-horizon 10K late tempo reminder so the plan does not disappear into a
  long easy-only tail before taper/endpoint.
- Added long-horizon anti-flatness gates to Marathon Base and 10K diversity validators so excessive
  identity deserts fail source validation.
- Regenerated scenarios with artifact hygiene preserved.

Scenario evidence:

- `matrix__marathon_base__beginner_new_runner__young_light__3d__none__sunday__normal_monday`:
  `9:strides`, `17:strides`, `25:steady_aerobic_run`, `33:steady_aerobic_run`, `39:strides`.
- `matrix__marathon_base__beginner_new_runner__young_light__5d__monday_friday__sunday__normal_monday`:
  `5:strides`, `11:strides`, `15:steady_aerobic_run`, `23:strides`.
- `beginner_marathon_base`: `5:strides`, `11:strides`, `15:steady_aerobic_run`, `23:strides`.
- `matrix__marathon_base__beginner_new_runner__older_heavier__5d__none__unset_default__normal_monday`:
  `7:strides`, `14:strides`, `21:steady_aerobic_run`, `27:steady_aerobic_run`,
  `31:strides`.
- `matrix__marathon_base__runs_a_lot__older_heavier__3d__none__sunday__midweek_wednesday`:
  `2:strides`, `3:tempo`, `6:strides`, `10:tempo`, `17:steady_aerobic_run`,
  `26:steady_aerobic_run`, `37:steady_aerobic_run`, `45:steady_aerobic_run`,
  `51:strides`.
- `matrix__10k__sometimes_runs__older_heavier__3d__wednesday_saturday__unset_default__midweek_wednesday`:
  `2:strides`, `3:tempo`, `5:strides`, `7:tempo`, `13:tempo`, `19:strides`.

Preserved behavior:

- Dynamic coach matrix remains `468` total scenarios, `305` preview-ready, `163` unavailable.
- Acceptance pack remains `13` scenarios, `13` preview-ready, `0` unavailable.
- `unsupported_runner_level_for_family` remains `0`.
- `unresolvedRangeCount: 0`.
- `unresolvedExecutableSegmentCount: 0`.
- Fake precise pace list remains empty.
- Fake personal HR list remains empty.
- Marathon Base remains a base endpoint, not hidden Marathon Completion or `42195m` readiness.
- No frontend/UI, Supabase, DB/schema, OpenAI, create/confirm/persistence, manual workout, or Plan
  Preset behavior changed.

Next gate:

- RUNNING COACH acceptance check of the anti-flatness repair before product/UX rollout continues.

## Running Coach Acceptance Closeout: Long-Horizon Anti-Flatness Repair

Date: 2026-06-11

Status:

Running Coach accepted / QA technical acceptance passed / next family-contract gate selected.

Acceptance artifact:

[running-plan-anti-flatness-repair-coach-acceptance.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-11-running-plan-anti-flatness-repair-coach-acceptance.md>)

Previous audit:

[running-plan-no-dead-end-long-horizon-coach-audit.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-10-running-plan-no-dead-end-long-horizon-coach-audit.md>)

Root cause:

- Visible symptom: long-horizon beginner/conservative previews were safe but read as too flat,
  especially Marathon Base plans where soft midweek identity disappeared for long spans.
- Underlying cause: horizon selection could extend plans safely, but composition did not
  reintroduce enough soft phase meaning across long horizons.
- Canonical owner: running-plan composition grammar, family diversity gates, and generated
  scenario validation.

Running Coach evidence accepted:

- Repaired long-horizon `Marathon Base` beginner/conservative plans now have enough soft midweek
  phase meaning.
- `steady_aerobic_run` and `steady_support_week` improve base identity without turning
  `Marathon Base` into hidden Marathon Completion.
- Conservative long-horizon `10K` late-plan identity desert is closed by the added late reminder.
- No new coaching blocker was found.
- No new safety issue, fake precise pace, fake personal HR, hidden `42195m`, or race-readiness
  overclaim was found.

QA technical evidence accepted:

- Browser was not used because this was source/CLI/build/JSON artifact validation only.
- ESLint passed for `plan-creation-engine` and scenario scripts.
- 10K builder validator passed.
- R6 builders validator passed.
- Scenario generator passed.
- `npm run build` passed.
- Scoped `git diff --check` passed.
- Acceptance pack remains `13` scenarios, `13` preview-ready, `0` unavailable.
- Dynamic matrix remains `468` scenarios, `305` preview-ready, `163` unavailable.
- Remaining unavailable reasons are structural only.
- `unsupported_runner_level_for_family: 0`.
- `unresolvedRangeCount: 0`.
- `unresolvedExecutableSegmentCount: 0`.
- 10K endpoint remains exact `10000m`.
- Half Marathon endpoint remains exact `21100m`.
- Marathon Base remains `marathon_base_endpoint`.
- No fake precise pace or fake personal HR appeared.
- Marathon Base has no `42195m`, race-readiness, race-pace, target-time, or selected-distance
  endpoint claim.
- Artifact hygiene is clean: `468` referenced scenario JSON files, `0` missing, `0`
  stale/unreferenced.
- Boundary proof remains preview-only: no Supabase mutation, OpenAI, frontend/UI,
  create/confirm/persist semantic change, manual workout path, or Plan Preset behavior was
  introduced.

Architecture decision:

- Accept the long-horizon anti-flatness repair as complete for this preview-engine checkpoint.
- Running Coach acceptance proves the coaching-quality boundary.
- QA source/CLI/build/JSON validation proves the technical regression boundary.
- No additional QA is required for this anti-flatness repair before selecting the next
  running-plan engine product gate.
- Keep the repair scoped to deterministic preview quality. It does not expand create/confirm,
  persistence, frontend UI, OpenAI generation, or Marathon Completion behavior.

Changelog decision:

- Do not update [changelog.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md>) for this closeout.
- Reason: this is QA-passed internal engine-quality work for preview artifacts, not a new
  user-facing shipped behavior by itself. A later user-visible running-plan release or final
  rebuild closeout can add the shipped-history entry with the complete product surface.

Next gate:

- RUNNING COACH source-of-truth contract for a dedicated `Marathon Completion` selected-plan
  family, separate from `Marathon Base`.

What remains forbidden:

- frontend/UI work
- create/confirm/persist/Supabase mutation
- DB/schema changes
- OpenAI normal-path generation
- fake precise pace or fake personal HR
- Marathon Base overclaim or hidden Marathon Completion behavior
- Marathon Completion implementation before a dedicated family contract exists
- manual-workout, Plan Preset, or cleanup-track merge into this running-plan gate

## Post Selected-Plan Preview Feedback Decision

Product reviewed the selected-plan preview after 10K/Half/Marathon Base were wired into the UI.

Root cause split:

- Preview calendar visual problems are FRONTEND/DS ownership. The current compact cells still carry
  date/day numbers, legend chrome, bordered/gridded treatment, and tooltip behavior that does not
  feel like the product calendar.
- Workout-quality concerns are RUNNING COACH + BACKEND ownership. Product saw a Half Marathon path
  that appeared to have only one interval-like quality workout, which may be acceptable only if the
  full development pattern has enough tempo, threshold, hills, strides, long-run durability, and
  recovery protection.
- The disabled create path is a BACKEND mutation-boundary issue. `Create unavailable` must not be
  solved as a local CTA change; a safe running-plan preview confirm/persist contract is required
  before any active plan can be created.

Architecture decision:

- Keep one active plan for this milestone. Do not create a separate plan yet.
- Separate the next work into three tracks:
  1. RUNNING COACH quality contract.
  2. FRONTEND selected-plan preview calendar visual cleanup.
  3. BACKEND preview-to-confirm-to-persist contract.
- Do not enable create/persist until quality acceptance and backend mutation proof exist.
- Do not let frontend own schedule, metric truth, or persistence.

### Slice R7A: Running Coach Selected-Plan Quality Gate

Owner:

RUNNING COACH.

Status:

accepted / Running Coach quality-passed / create-path architecture-ready.

Acceptance evidence:

- Running Coach accepted the rich dynamic scenario matrix as coaching-quality acceptable for
  create-path planning.
- Accepted artifact:
  [running-plan-rich-composition-implementation-coach-acceptance.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-running-plan-rich-composition-implementation-coach-acceptance.md>)
- The accepted matrix keeps 10K differentiated by runner level and load context.
- Supported Half Marathon no longer collapses into generic tempo filler in conservative cases.
- Marathon Base conservative cases preserve aerobic durability / time-on-feet identity without
  becoming a hidden race plan.
- Unavailable scenarios are mostly honest protective blockers rather than squeezed unsafe previews.
- Fake precise pace and fake personal HR remain absent.
- The create-path UI must not flatten backend richness back into generic visible naming.

Scope:

- inspect the dynamic scenario matrix under
  `qa-artifacts/plan-engine-coach-review/2026-06-09-dynamic-scenario-matrix/`
- use the `13`-scenario acceptance pack under `qa-artifacts/plan-engine-scenarios/2026-06-09/` as
  a release-gate reference, not as the full coach-review sample
- inspect current family policies:
  - `src/lib/plan-creation-engine/ten-k-diversity-policy.ts`
  - `src/lib/plan-creation-engine/half-marathon-diversity-policy.ts`
  - `src/lib/plan-creation-engine/marathon-base-diversity-policy.ts`
  - `src/lib/plan-creation-engine/prescription-resolver.ts`
- define what "credible weekly development stimulus" means by family, runner level, and load
  context
- decide whether Half Marathon with one interval-like workout is acceptable when other quality
  types and long-run durability are present
- define exact backend rules for minimum quality mix, safe adaptation, recovery protection, and
  forbidden overreach

Rules to preserve:

- `beginner_new_runner` may avoid intervals in the first adaptation weeks.
- Supported 10K/Half runners after adaptation should usually have one weekly development stimulus
  unless load context requires a conservative week.
- A development stimulus can be intervals, threshold, hills, tempo, strides, or durability-specific
  long-run work depending on family and level.
- Half Marathon must not pass as rich/credible if its development pattern is effectively one
  interval-like touch plus generic long runs.
- Marathon Base stays base-building and must not become a hidden marathon race plan.
- Long-run detail stays varied and watch-executable.

### Slice R7B: Frontend Selected-Plan Calendar Visual Cleanup

Owner:

FRONTEND.

Status:

ready after or in parallel with R7A, but not a substitute for quality acceptance.

Scope:

- align compact selected-plan preview calendar with existing Hito product calendar style
- remove date/day numbers from compact preview cells
- remove the legend
- remove border-heavy/gridded cell treatment
- use one-color cells with spacing between them, closer to product calendar reference
- cells show concise workout meaning only: workout type plus approximate duration or distance where
  useful
- keep hover/focus/click detail on a Hito DS dark/surface detail strip or product-calendar-style
  tooltip; do not use an ugly white tooltip
- keep backend rows as the only source of schedule/workout truth

Files likely in scope:

- `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`
- `src/styles.css`
- `src/components/Calendar.tsx` as visual reference only
- Hito DS tooltip/surface primitives as reuse reference

Validation expectations:

- targeted ESLint
- `git diff --check`
- browser proof in built-in Codex browser first
- 375px no horizontal overflow
- prove no frontend schedule/date/metric computation was introduced

### Slice R7C: Backend Running-Plan Preview Confirm/Persist Contract

Owner:

BACKEND.

Status:

accepted as the next backend gate after Running Coach quality acceptance.

Scope:

- add a safe running-plan engine create path only after review/quality gates pass
- reuse the existing canonical persistence owner
  `createFirstPlanFromReviewedCanonicalPlanForUser(...)`
- rebuild the preview server-side on confirm; never trust client-sent rows
- use backend-issued review token/checksum or equivalent exactness proof
- re-check no-active-plan lifecycle before apply
- preserve source metadata for running-plan engine source kind, selected distance/family, runner
  level, dates, row counts, endpoint proof, metric policy, and quality-gate summary
- map persisted rows exactly from the reviewed canonical `training-plan-v2` rows
- return bounded errors for stale review, input mismatch, active plan exists, duplicate click, and
  apply failure
- no DB/schema change unless BACKEND proves an existing schema field cannot safely carry the source
  metadata

Validation expectations:

- token/checksum mismatch proof
- start-date/input mismatch proof
- active-plan conflict proof
- duplicate-click/idempotency proof
- rollback/error proof through existing persistence seam
- exact row-match proof against rebuilt preview
- no OpenAI, no target-time, no 5K benchmark dependency, no no-watch/no-app branch, no fake pace, no
  fake personal HR

## Create-Path Architecture Acceptance Decision

Decision date:

2026-06-09.

Accepted:

- The rich running-plan preview engine is good enough to enter create-path architecture.
- 10K, Half Marathon, and Marathon Base selected-plan previews are accepted as deterministic
  backend-owned product truth for the next mutation-boundary slice.
- The next step is Backend Slice R8: selected running-plan preview confirm/persist contract.

Selected create-path boundary:

`selected-plan setup input -> backend preview/review -> review token/checksum -> confirm action -> server-side preview rebuild -> canonical training-plan-v2 mapping -> createFirstPlanFromReviewedCanonicalPlanForUser(...) -> active plan`

Why this can include confirm/persist in one backend slice:

- The selected-plan preview already exists as the non-mutating review surface.
- Adding another review-only wrapper would not unblock the product problem.
- The risky part is confirm/persist exactness, so the next bounded backend slice should implement
  review exactness plus confirm/persist together while keeping the frontend Create button disabled
  until QA passes.
- Frontend wiring is a later slice after backend source, harness, and mutation proof pass.

Canonical persistence owner:

- Reuse
  [active-plan-persistence.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-persistence.ts>)
  and specifically `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
- Do not create a second running-plan persistence system.
- Do not revive old Plan Preset confirm/persistence paths.

Review/confirm contract:

- `previewRunningPlanDraft(...)` may remain the non-mutating preview/review action.
- Preview-ready results should carry a backend-issued review token/checksum or equivalent exactness
  proof.
- Add `confirmRunningPlanDraft(...)` as the only selected-plan create action.
- Confirm accepts only setup input, selected source/family identity, review token, and review
  checksum.
- Confirm rebuilds the preview server-side from the accepted builder.
- Confirm rejects:
  - active plan exists
  - preview unavailable
  - stale review token/checksum
  - changed setup input
  - changed start date
  - changed selected family/source kind
  - row/checksum mismatch
  - duplicate click / post-success active-plan conflict
  - canonical persistence failure

Persisted entity contract:

- One active `plan_cycles` row.
- Exact reviewed `planned_workouts` rows.
- Runner profile patch only for the bounded profile/setup fields already accepted by the current
  onboarding path, if required by the existing persistence seam.
- No workout logs, provider assets, comparisons, AI insights, manual workout rows, or recurrence
  rows.

Source metadata contract:

- Preserve builder source kind:
  - `running_plan_engine_10k_builder_v1`
  - `running_plan_engine_half_marathon_builder_v1`
  - `running_plan_engine_marathon_base_builder_v1`
- Preserve source status as a reviewed/confirmed selected-plan engine draft in plan metadata.
- Preserve selected distance/family, runner level, start/end dates, row counts, endpoint proof,
  metric policy, composition grammar proof, quality-gate summary, and unavailable/negative-proof
  boundaries where useful.
- Do not persist raw comments, prompts, OpenAI payloads, or client-sent rows.

Frontend contract after Backend passes:

- Frontend receives backend-shaped preview/review data, review token/checksum, confirm readiness,
  bounded errors, and success state.
- Frontend renders the selected-plan review and calls confirm only from an explicit user action.
- Frontend never computes schedule, metric truth, endpoint truth, source metadata, canonical rows,
  idempotency, or persistence locally.

Stale paths that remain blocked:

- `reviewPlanPresetDraft(...)` and `confirmPlanPresetDraft(...)` remain bounded `preview_only`
  legacy-blocked actions.
- Old failed Plan Preset builder/review harness artifacts remain deleted/demoted.
- AI blueprint/custom authoring remains a separate Advanced/custom path, not the normal selected-plan
  create path.
- Old `structured_authoring_v1` deterministic fallback must not return as a successful normal
  first-plan path.

QA required before runner-facing Create:

- review token/checksum exactness
- server-side rebuild proof
- no client-row trust proof
- active-plan conflict proof
- duplicate-click/idempotency proof
- preview-unavailable cannot confirm
- exact persisted row match by date, weekday, week, type, identity, and steps
- source metadata preservation
- rollback/error proof through existing persistence seam
- no OpenAI, no target-time pace, no 5K benchmark dependency, no no-watch/no-app branch, no fake
  personal HR
- disposable/local or explicitly scoped remote Supabase mutation smoke before final production
  acceptance

## R5B Frontend Visual Cleanup Note

- QA R5 accepted the rebuilt 10K selected-plan vertical for functional, source, browser, and mobile
  behavior.
- Product requested a focused R5B frontend cleanup before R6 expansion:
  - selected-plan preview uses normal DS labels for ordinary content labels
  - `hito-micro-label` remains only for true shell/chrome metadata
  - compact calendar preview keeps backend rows while showing workout-type colors and an orange
    final 10K trophy state
- Next recommended role after R5B implementation remains QA for focused visual re-validation.

## Reference Links

- [Project operating rules](../../../AGENTS.md)
- [Project context](../../context.md)
- [Glossary](../../glossary.md)
- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Hito Stack Simplification Strike](../archive/2026-06-07-hito-stack-simplification-strike.md)
- [Archived Plan Preset plan](../archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [Plan Presets library](../../../src/lib/plan-presets/)
- [Active plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Training API facade](../../../src/lib/training-api.ts)
- [Running Plan Engine Coach Doctrine](../../tasks/running-coach/2026-06-08-running-plan-engine-coach-doctrine.md)
- [Running Plan Engine Scenario Matrix](../../tasks/running-coach/2026-06-08-running-plan-engine-scenario-matrix.md)
- [Running Plan Engine Watch-Executable Workout Library](../../tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md)

## Context

The previous Plan Preset vertical slice passed several technical gates, but it failed real product
acceptance.

We are stopping the patch cycle:

- do not keep patching individual symptom rows
- do not continue service-size cleanup now
- do not start Backend implementation before coaching/source-of-truth reset
- do not treat the current algorithmic builder as an accepted product foundation

This plan replaces Plan Preset rebuild ownership inside the Hito Stack Simplification Strike. The
simplification strike remains available only for future cleanup after this rebuild passes product
acceptance.

## Failure Evidence

Evidence files:

- `/Users/ivan/Downloads/10k-foundation-plan-preset-2026-06-08.json`
- `/Users/ivan/Downloads/half-marathon-balanced-plan-preset-2026-06-08.json`
- `/Users/ivan/Downloads/half-marathon-balanced-plan-preset-2026-06-11.json`

Observed failures:

- `10K Foundation Plan Preset` exported `70` rows / `10` weeks, but the final row was
  `long_aerobic_run`, summarized as `8 km long aerobic run`; it did not clearly culminate in a 10K
  endpoint.
- `Half Marathon Balanced Plan Preset` exported `119` rows / `17` weeks and ended with
  `half_readiness_marker`, summarized as `68 min half readiness marker`, without explicit `21.1K`
  endpoint behavior.
- A later Half Marathon export also had `119` rows / `17` weeks but the final row was
  `rest_and_recovery`, which is unacceptable as selected-distance endpoint behavior.
- Workout/readback language can foreground effort labels such as `Effort: threshold steady` and
  `Mode: Executable structure`, which is not acceptable as the primary watch-facing execution model.
- The selected-plan flow did not ask rest days or preferred long-run day in the right modal/screen.
- Important review content was hidden below cards instead of living inside a clear selected-plan
  flow.

## Reset Decision

The current Plan Preset builder is product-failed / not accepted.

Technical slices passed, but product acceptance failed. Passing harnesses around the wrong doctrine
does not make the plan creation engine correct.

The new running plan creation engine must be built from first principles:

`runner basics -> load/progression context -> selected distance goal -> days/week capacity -> coach-authored reference doctrine -> phase plan -> weekly calendar preview -> workout placement -> watch-executable segment construction -> review modal -> confirm/persist`

## Source-Of-Truth Correction

This plan is not a text-tuning task.

AI must not directly author the plan calendar, weekly structure, long runs, intervals, metric modes,
or progression. AI can help with:

- interpreting messy runner input into backend-owned parameters
- explaining the reviewed plan in human language
- handling explicit Advanced/custom edge cases after the deterministic contract exists

AI must not own:

- weekly schedule structure
- selected-distance endpoint behavior
- workout segment anatomy
- long-run structure
- pace/HR target policy
- recovery/cutback/taper rules
- review/confirm persistence truth

Normal plan creation is recipe-led and engine-owned:

`runner input -> backend normalization -> selected recipe -> deterministic expansion -> hard workout rules -> metric/default-zone resolver -> non-mutating review -> explicit confirm/persist`

The old loop of "generate, enrich, validate, QA finds weak workouts, then ask for richer wording" is
explicitly rejected.

## R1 Boundary Decision

Architect accepts the docs-owned Running Coach Slice R1 artifacts as the only canonical coaching
source of truth for Backend Slice R2:

- [Running Plan Engine Coach Doctrine](../../tasks/running-coach/2026-06-08-running-plan-engine-coach-doctrine.md)
- [Running Plan Engine Scenario Matrix](../../tasks/running-coach/2026-06-08-running-plan-engine-scenario-matrix.md)
- [Running Plan Engine Watch-Executable Workout Library](../../tasks/running-coach/2026-06-08-running-plan-engine-watch-executable-workout-library.md)

Boundary decision:

- Backend must translate the docs-owned R1 artifacts into typed source; Backend must not treat any
  source-layer draft files as canonical unless they are created from those accepted docs.
- The untracked files under `src/lib/plan-creation-engine/` were inspected and deleted in this
  boundary pass because they contained stale/conflicting language around benchmark-backed pace
  truth, personal HR-zone truth, and old runner-level labels.
- Deleted stale draft files:
  - `src/lib/plan-creation-engine/watch-executable-workout-doctrine.md`
  - `src/lib/plan-creation-engine/watch-segment-prescription-model.csv`
  - `src/lib/plan-creation-engine/coach-workout-day-examples.csv`
- Those deleted files are not archived because archiving unaccepted source-layer drafts would create
  another source-of-truth candidate. Their useful ideas are already superseded by the accepted
  docs-owned Running Coach artifacts.

Canonical Backend source hierarchy for Slice R2:

1. This active rebuild plan.
2. Docs-owned Running Coach R1 artifacts under `docs/tasks/running-coach/`.
3. Existing canonical persistence/review seams only for boundary awareness; do not change
   persistence in Slice R2.
4. New typed backend source-of-truth files created from the accepted docs.

## Preserved Parts

Preserve where useful:

- visual direction of cards
- backend-owned truth principle
- non-mutating review before confirm
- review/confirm/persistence safety
- existing canonical persistence seam if still valid
- Hito DS primitives and card styling when they support the corrected interaction
- `plan_preset_v1` source-kind lineage if metadata clearly identifies the rebuilt engine/version

## Deleted / Demoted / Frozen Candidates

Do not blindly delete anything in this Architect pass.

Candidates for controlled deletion, demotion, or freeze:

- current algorithmic builder if it encodes failed doctrine
- current source-of-truth CSVs if they encode failed behavior
- quality gates that allowed readiness-only outcomes
- effort-primary segment model
- hidden below-card review flow
- stale Plan Preset code that exists only to support the failed builder
- old failed outputs, preserved only as negative/regression fixtures if useful

Deletion boundary:

- every deletion must name exact file/symbol/surface
- every deletion must prove replacement coverage
- every deletion must preserve review/confirm/persistence safety
- no broad `git reset`, mass revert, or unscoped source removal

## New Product Contract

### Runner Inputs

The runner enters:

- age
- height
- weight
- running level:
  - beginner/new runner
  - sometimes runs
  - runs a lot
  - professional/competitive
- days/week, with a safe backend-owned default if omitted

Age, height, and weight must materially influence safe load/progression through neutral context, not
body-shaming, medical claims, or injury inference.

The runner does not need to enter:

- watch/app ownership, because supported new-plan creation assumes watch/app execution
- 5K benchmark, because v1 normal plan creation must not depend on benchmark collection
- personal HR zones, because Hito uses conservative default HR-zone assumptions until the runner
  edits zones later
- target time/date, because those remain Advanced/custom inputs, not normal preset/recipe inputs

The level model replaces the old benchmark-first gate. Backend uses the selected level, age/load
context, body context, days/week, rest preferences, selected distance, and coach-owned recipe rules
to choose the safe plan shape.

### Distance Cards

The runner sees three shipped distance cards:

- `10K`
- `Half Marathon`
- `Marathon` or honestly renamed/repositioned `Marathon Base`

Cards show backend-owned expected outcome:

- selected-distance endpoint
- expected finish outcome band or completion category
- training duration/runway
- days/week

Cards must not ask for or require 5K benchmark truth.

Outcome copy should be level/recipe-based and honest:

- completion/checkpoint category
- broad readiness band where coach-approved
- no precise race-time promise
- no benchmark-derived pace dependency in the normal path

If the runner wants a faster outcome after selecting a plan, backend should adjust safely:

- more days/week
- longer runway
- appropriate quality work
- or route to Advanced/custom if unsupported

### Selected-Plan Interaction

- Primary card CTA is `Select Plan`.
- Remove separate `Learn more` as a competing CTA.
- `Select Plan` opens a modal or selected-plan screen.
- Important review must not be hidden below cards.
- Selected-plan modal/screen shows:
  - simple plan summary
  - mini calendar / microcalendar
  - colored workout types
  - expected finish/outcome
  - final selected-distance day
  - editable/confirmable days/week
  - rest-day selection
  - preferred long-run day
  - flexible/default option if runner does not choose
- If runner selects `5` running days/week, they can choose `2` rest days.
- Backend owns calendar and schedule logic.
- Frontend only renders backend-shaped state and collects preferences.

### Watch-Executable Contract

- Watch/app execution is assumed.
- No-watch / no-app is removed as a normal product option.
- Workouts must be watch-executable.
- Primary prescription must be structured sports parameters:
  - duration
  - distance
  - repeats
  - work block
  - recovery block
  - segment order
  - target mode
- Effort/coaching wording is secondary, not the primary target.
- Normal plan creation must not require a 5K benchmark to become executable.
- Pace must not be presented as precise performance truth unless a future explicit pace-truth source
  is approved; v1 can use coach-owned broad level/recipe cues only where they do not imply fake
  precision.
- HR uses conservative Hito default zones in v1, not personal HR truth.
- Hito default HR zones must be labeled/handled as editable defaults and must not be described as
  personalized zones.
- Target time alone does not unlock precise pace.
- No fake personal HR.
- No fake pace.
- If a workout cannot be expressed with watch-executable structure, it must fail quality gates or
  route to custom/review.

## Coaching Source-Of-Truth Requirements

Running Coach must create canonical examples before Backend implementation.

Required source-of-truth coverage:

- reference plans for 10K, Half Marathon, and Marathon/Base
- age/load contexts
- height/weight contexts
- running levels:
  beginner/new runner, sometimes runs, runs a lot, professional/competitive
- days/week options
- conservative default HR-zone assumptions and how they appear as editable defaults
- selected-distance final endpoint behavior
- canonical workout day examples:
  recovery, easy, long run, cutback, strides, tempo, threshold, intervals, hills if in scope, and
  final selected-distance day
- segment anatomy for each workout type:
  warmup, main work, repeats, recoveries, cooldown
- how segments should display in product UI
- safety cue copy as secondary language

Large matrices should become repo source artifacts, not chat walls.

## Slice Plan

### Slice R0: Architect Reset Map And Deletion Boundary

Owner:

ARCHITECT.

Status:

complete.

Scope:

- mark previous Plan Preset builder as product-failed
- stop simplification cleanup from owning plan-creation work
- define preserved seams
- define deletion/demotion/freeze candidates
- create this dedicated rebuild plan

### Slice R1: Running Coach Reference Doctrine And Workout Examples

Owner:

RUNNING COACH.

Status:

complete / Product-accepted / Architect-accepted.

Scope:

- create coach-authored benchmark plans before code
- treat "benchmark" here as coach-authored reference programs, not user-provided 5K benchmark input
- define selected-distance endpoint behavior
- define watch-executable workout day and segment examples
- define safe load/progression interpretation for age/height/weight/level/days/week
- define conservative default HR-zone usage without calling it personal HR truth
- define UI display/readback guidance for segments

Exit criteria:

- backend-ready markdown/CSV artifacts exist
- every shipped distance has endpoint doctrine
- every canonical workout type has segment anatomy examples
- effort/cue copy is explicitly secondary

### Slice R2: Backend Source-Of-Truth Model

Owner:

BACKEND.

Status:

complete / Backend-validated / Architect-accepted with pre-R3 cleanup note.

Scope:

- translate Running Coach artifacts into typed backend source-of-truth
- model load/progression/outcomes/segments
- define builder input/output contract
- define quality gates that reject failed old behaviors
- preserve no fake pace and no fake personal HR
- remove normal-path dependency on watch-choice, 5K benchmark, or personal HR-zone collection
- do not use deleted/stale `src/lib/plan-creation-engine/` draft files as canonical source
- no persistence semantic changes

Implementation notes:

- Added a new typed backend source owner under `src/lib/plan-creation-engine/`, created from the
  accepted R1 docs only.
- Added source contracts for supported families, runner levels, builder inputs, watch-executable
  segment templates, metric/default-HR policy, endpoint gates, scenario rules, and forbidden output
  gates.
- Added `scripts/validate-running-plan-engine-source.ts` as the bounded source invariant harness.
- The source model intentionally does not build multi-week calendars, open frontend seams, call
  OpenAI, mutate persistence, or reintroduce watch/no-watch, 5K benchmark, target-time, fake pace,
  or personal-HR normal-path dependencies.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- Invariant summary: `3` distance families, `4` runner levels, `11` workout templates, `12`
  scenario rules, `10` forbidden gates.

Next acceptance gate:

- Backend must complete Slice R2B before Slice R3 builds the first 10K deterministic expansion
  engine.

Architect acceptance notes:

- R2 correctly preserves the accepted product contract:
  - no normal-path 5K benchmark dependency
  - no watch/no-watch gate
  - accepted runner levels only
  - editable Hito default HR zones, not personal HR truth
  - no fake precise pace
  - no fake personal HR
  - 10K / Half / Marathon Base endpoint gates
- The invariant harness is strong enough for R2 because it validates input boundaries, metric/HR
  policy, endpoint gates, workout segment numeric structure, scenario coverage, stale file absence,
  and forbidden output gates.
- `src/lib/plan-creation-engine/source-model.ts` is acceptable as a data-heavy R2 landing file, but
  not acceptable as the file that receives the 10K builder or more source responsibilities.
- The shared `final_selected_distance_day` template is acceptable as an abstract R2 concept only.
  It must be resolved into family-specific endpoint exactness before the 10K builder can use it.

### Slice R2B: Source Model Decomposition And Endpoint Exactness

Owner:

BACKEND.

Status:

complete / Backend-validated / Architect-accepted / R3-ready.

Scope:

- no-behavior-change decomposition of `src/lib/plan-creation-engine/source-model.ts` by real
  ownership seams:
  - family contracts
  - builder input contract
  - metric/default-HR policy
  - workout-day templates
  - endpoint gates
  - scenario rules
  - forbidden output gates
- preserve the public `src/lib/plan-creation-engine/index.ts` facade
- keep accepted R2 model values stable unless endpoint exactness requires a targeted correction
- replace/refine the shared `final_selected_distance_day` template so 10K builder cannot consume a
  generic `10000-21100m` range
- require source validation to prove:
  - 10K endpoint resolves exactly `10000m`
  - Half endpoint resolves exactly `21100m`
  - Marathon Base remains a base endpoint, not selected-distance race readiness
- do not build the multi-week plan expansion engine in this slice

Exit criteria:

- source model is split by ownership, not arbitrary line count
- no source file receives broad unrelated responsibilities
- source invariant harness still passes and is strengthened for endpoint exactness
- ESLint and `git diff --check` pass

Implementation notes:

- Split the R2 source model by real ownership seams:
  - `family-contracts.ts`
  - `input-contract.ts`
  - `metric-policy.ts`
  - `workout-templates.ts`
  - `endpoint-contracts.ts`
  - `scenario-rules.ts`
  - `forbidden-output-gates.ts`
  - `source-shared.ts`
- Kept `source-model.ts` as the stable source-model aggregator/facade instead of a data-heavy
  landing file.
- Preserved the public `src/lib/plan-creation-engine/index.ts` facade and added the explicit
  `resolveRunningPlanEndpointTemplate(...)` export for future builders.
- Moved selected-distance endpoint anatomy out of generic workout templates into family-specific
  endpoint templates:
  - `10K` resolves to exactly `10000m`
  - `Half Marathon` resolves to exactly `21100m`
  - `Marathon Base` resolves to an honest base durability endpoint with no selected-distance race
    meters.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- Invariant summary: `3` distance families, `4` runner levels, `9` non-endpoint workout templates,
  `3` endpoint templates, `12` scenario rules, `10` forbidden gates.
- `git diff --check -- <changed files>`

Architect acceptance notes:

- R2B is accepted as the final source boundary before Slice R3.
- Decomposition is acceptable because `source-model.ts` is now a small source aggregator and the
  source ownership moved into focused files for family contracts, input contract, metric/default-HR
  policy, workout templates, endpoint contracts, scenario rules, forbidden output gates, shared
  helpers, and source types.
- Endpoint exactness is acceptable for the first builder because `final_selected_distance_day` and
  `marathon_base_endpoint` no longer live in generic workout templates, and builders must use
  `resolveRunningPlanEndpointTemplate(...)`.
- The invariant harness is strong enough for R3 entry because it proves:
  - `10K` endpoint template kind is `final_selected_distance_day`
  - `10K` endpoint distance and main segment are exactly `10000m`
  - `Half Marathon` endpoint distance and main segment are exactly `21100m`
  - `Marathon Base` endpoint is `marathon_base_endpoint`
  - Marathon Base has no selected-distance race main segment
  - stale unaccepted source-layer `.md` / `.csv` files remain absent
  - watch/no-watch, 5K benchmark, target-time, fake pace, and fake personal-HR dependencies remain
    forbidden in the normal path.
- Slice R3 may now start, but only for the smallest backend-owned 10K deterministic builder.

### Slice R3: Backend Minimal New Builder For One Distance

Owner:

BACKEND.

Status:

complete / Backend-validated / Architect-accepted / R4-ready.

Recommended first distance:

10K.

Scope:

- build the smallest new backend-owned selected-distance builder for 10K
- produce calendar preview rows before confirm
- produce watch-executable segments
- end with clear 10K behavior
- use review/confirm safety
- keep failed old outputs as negative fixtures where useful

Implementation notes:

- Added an isolated 10K deterministic preview builder in
  `src/lib/plan-creation-engine/ten-k-builder.ts`.
- Kept `source-model.ts` as source truth only; the builder consumes the accepted source model,
  generic workout-day templates, and `resolveRunningPlanEndpointTemplate("10K")`.
- The R3 builder returns a non-mutating preview/review draft contract with:
  - `sourceKind` / `source_kind`: `running_plan_engine_10k_builder_v1`
  - `sourceStatus` / `source_status`: `preview_ready` or `preview_unavailable`
  - `persisted: false`
  - `mutates: false`
  - `callsOpenAi: false`
- Added backend defaults for omitted `daysPerWeek`, `fixedRestDays`, and preferred long-run day.
- Added hard failure before review when the selected family is not `10K` or the runner-selected
  preferred long-run day conflicts with fixed rest days.
- Generated 10-week / 70-row calendar previews for the 10K slice, with every non-rest row using
  watch-executable numeric segment anatomy from the accepted source templates.
- Ensured the final non-rest row is the family-specific `final_selected_distance_day` endpoint,
  with the endpoint template and main segment both resolving to exactly `10000m`.
- Added `scripts/validate-running-plan-engine-10k-builder.ts` as the bounded R3 harness.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- 10K builder harness summary:
  - `sourceKind`: `running_plan_engine_10k_builder_v1`
  - weeks: `10`
  - calendar rows: `70`
  - non-rest rows: `50` for the 5-days/week fixed-rest fixture
  - endpoint meters: `10000`
  - final date: `2026-08-16`
  - validation: `ok`

Architect acceptance notes:

- R3 is accepted as a bounded backend preview contract for FRONTEND Slice R4.
- R3 deliberately implements only the 10K builder. Half Marathon and Marathon Base remain out of
  scope until the 10K vertical is accepted.
- R3 does not add frontend, persistence, confirm/create behavior, OpenAI calls, Supabase
  mutations, target-time support, 5K benchmark dependency, or watch/no-watch selection.
- `ten-k-builder.ts` is large at roughly `943` lines, but it is acceptable for R4 because it owns
  one bounded 10K preview path, exports a small public contract, and keeps normalization, schedule
  construction, endpoint proof, and validation private to that preview builder.
- No R3B decomposition is required before frontend starts. However, this file must not receive Half
  Marathon, Marathon Base, confirm/persistence, OpenAI, or frontend-facing schedule truth. Before
  adding another family or mutation path, BACKEND must extract focused seams for normalization,
  schedule selection, row construction, endpoint proof, and validation/test fixtures.
- R3 keeps the old failed behavior as negative harness checks:
  - no final generic long run
  - no final rest/recovery day
  - no metadata-only endpoint
  - no fake precise pace
  - no fake personal HR
  - no user-provided 5K benchmark dependency
  - no watch/no-watch gate

### Slice R4: Frontend Select Plan Modal And Calendar Preview

Owner:

FRONTEND.

Status:

ready for FRONTEND implementation.

Scope:

- preserve useful visual card direction
- primary CTA is `Select Plan`
- remove competing `Learn more`
- selected-plan modal/screen shows backend-shaped details, mini calendar, colored workout types,
  rest days, long-run day, days/week, endpoint, and runner-facing copy
- no frontend schedule logic
- no frontend-generated rows/workouts

### Slice R4C: Backend 10K Diversity Policy Before QA

Owner:

BACKEND.

Status:

behavior and build validated / ready for QA acceptance.

Scope:

- implement the accepted 10K diversity doctrine from
  `docs/tasks/running-coach/2026-06-09-running-plan-engine-10k-diversity-doctrine.md`
- keep the deterministic 10K builder backend-owned
- do not add frontend, persistence, OpenAI, Half Marathon, Marathon Base, target-time, 5K
  benchmark, or watch/no-watch behavior

Implementation notes:

- Added `src/lib/plan-creation-engine/ten-k-diversity-policy.ts` as the focused owner for the 10K
  development-touch matrix and validation gates.
- Replaced the previous week-number-only development selector with a deterministic policy keyed by
  `runnerLevel`, `loadContext`, and `weekNumber`.
- Preserved beginner safety:
  - `beginner_new_runner` receives `strides` as the only development touch
  - no beginner `tempo`, `intervals`, `hills`, or `threshold`
- Added supported standard-load diversity:
  - `sometimes_runs`: `strides`, `tempo`, `intervals`
  - `runs_a_lot`: `strides`, `tempo`, `intervals`, `hills`
  - `professional_competitive`: `strides`, `tempo`, `intervals`, `hills`
- Added conservative-load downgrade:
  - no forced `intervals`
  - no forced `hills`
  - `strides` remain present
  - `tempo` remains allowed for supported non-beginner profiles
- Preserved week shape:
  - weeks `4` and `8` remain `cutback_long_run` weeks
  - week `9` includes `strides` and excludes `tempo`, `intervals`, `hills`, and `threshold`
  - week `10` remains the exact `10000m` endpoint week
- Extended recovery validation after sharper work:
  - next actual running slot after `long_run`, `cutback_long_run`, `intervals`, or `hills` must be
    `recovery` or `easy`
  - no week may contain more than one development touch
- Fixed the local default-start endpoint placement bug where an omitted start date on Tuesday could
  leave an easy/recovery row after the endpoint and fail final endpoint proof.

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `git diff --check -- src/lib/plan-creation-engine scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- Builder harness summary after R4C:
  - `sourceKind`: `running_plan_engine_10k_builder_v1`
  - weeks: `10`
  - calendar rows: `70`
  - non-rest rows: `50` for the 5-days/week fixed-rest fixture
  - endpoint meters: `10000`
  - final date: `2026-08-16`
  - validation: `ok`
- `npm run build` was attempted twice after the R4C changes and failed in Nitro SSR bundling with
  missing hashed chunk imports from `node_modules/.nitro/vite/services/ssr/assets/*`:
  - first failure: missing `./router-Cq4T7KLJ.js` from `admin.capture-MVpXAmvc.js`
  - second failure: missing `./local-auth-DQHdAfx4.js` from `plan-refresh-proposal-hubUz90U.js`
  - this appears to be the existing build-output lifecycle/Nitro chunk-resolution seam, not the 10K
    diversity policy, but it blocks release-style QA until fixed.
- Build blocker recheck:
  - `npm run build` passed from the normal prebuild cleanup path.
  - a second consecutive `npm run build` also passed.
  - no runtime/product files were changed for the build recheck.
  - diagnosis: the previous missing hashed chunk failures were stale/transient generated-output
    state, not an R4C import/export regression.

### Slice R5: QA Acceptance For 10K Vertical

Owner:

QA.

Scope:

- exported JSON proof
- browser flow proof
- workout detail/readback proof
- final selected-distance endpoint proof
- watch-executable segment structure proof
- no vague effort-primary targets
- mobile no-overflow
- no Supabase mutation unless explicitly scoped

### Slice R6: Expand To Half And Marathon/Base

Owner:

RUNNING COACH / BACKEND / FRONTEND / QA.

Scope:

- expand from accepted 10K vertical into Half Marathon
- decide Marathon vs Marathon Base honestly
- add selected-distance endpoint or base-only repositioning
- repeat export/browser/workout-detail acceptance

### Slice R6B: Backend Half Marathon And Marathon Base Preview Expansion

Owner:

BACKEND.

Status:

backend behavior and build validated / ready for QA source acceptance.

Scope:

- implement deterministic preview expansion for `Half Marathon`
- implement deterministic preview expansion for `Marathon Base`
- preserve accepted 10K behavior
- do not add frontend, persistence, confirm/create, OpenAI, shipped 5K, target-time, or DB behavior

Implementation notes:

- Added `src/lib/plan-creation-engine/preview-builder-shared.ts` as the focused owner for common
  preview calendar assembly, input normalization, endpoint/workout row shaping, recovery repair, and
  shared watch-executable/metric-truth checks used by the new R6 family builders.
- Added `src/lib/plan-creation-engine/half-marathon-diversity-policy.ts` as the Half Marathon
  family policy owner.
- Added `src/lib/plan-creation-engine/marathon-base-diversity-policy.ts` as the Marathon Base
  family policy owner.
- Added `src/lib/plan-creation-engine/half-marathon-builder.ts`.
- Added `src/lib/plan-creation-engine/marathon-base-builder.ts`.
- Exported the new builders through `src/lib/plan-creation-engine/index.ts` without changing
  `buildTenKPlanPreviewDraft(...)`.
- Added `scripts/validate-running-plan-engine-r6-builders.ts` for deterministic R6 backend proof.

Half Marathon proof:

- source kind: `running_plan_engine_half_marathon_builder_v1`
- horizon: `14` weeks
- rows for the 5-days/week fixed-rest fixture: `98` calendar rows / `70` non-rest rows
- final non-rest row: `final_selected_distance_day`
- endpoint/main segment: exact `21100m`
- `beginner_new_runner` is blocked before review
- `sometimes_runs` has no `threshold`
- `runs_a_lot` / `professional_competitive` standard-load previews include `threshold`

Marathon Base proof:

- source kind: `running_plan_engine_marathon_base_builder_v1`
- horizon: `16` weeks
- rows for the 5-days/week fixed-rest fixture: `112` calendar rows / `80` non-rest rows
- final non-rest row: `marathon_base_endpoint`
- no selected-distance `42195m` endpoint
- no `intervals`
- no full marathon readiness, race-peak, target-time, or race-pace overclaim
- `beginner_new_runner` is blocked before review

Shared proof:

- preview only: `persisted: false`, `mutates: false`, `callsOpenAi: false`,
  `confirmPathImplemented: false`
- fixed rest days are protected
- long-run day remains on the preferred long-run day where feasible
- next actual running slot after long runs, cutback long runs, and sharper work remains
  `recovery` or `easy`
- one development touch max per week
- no fake pace, no fake personal HR, no 5K benchmark dependency, and no watch/no-watch gate

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- `npm run build`

### Slice R6D: Frontend Selected-Plan Preview Wiring For Half Marathon And Marathon Base

Owner:

FRONTEND.

Status:

implemented / ready for QA validation.

Scope:

- wire accepted R6 backend preview builders into the preset-first selected-plan preview flow
- preserve the accepted 10K selected-plan preview path
- keep create/confirm/persistence unavailable in this preview-only slice
- keep frontend as a renderer of backend-shaped preview truth only

Implementation notes:

- Replaced the 10K-only selected-plan preview server action seam with a shared
  `previewRunningPlanDraft(...)` action that dispatches to the accepted 10K, Half Marathon, or
  Marathon Base backend preview builder by `distanceFamily`.
- Updated the preset onboarding panel so 10K, Half Marathon, and Marathon Base cards can open the
  same selected-plan preview dialog when backend card state marks them selectable.
- Updated the selected-plan preview dialog readback so Half Marathon shows exact `21100m` endpoint
  proof and Marathon Base shows `marathon_base_endpoint` / no selected-distance `42195m` /
  no full-marathon-readiness language.
- Preserved preview-only behavior: no rows/workouts are sent from the client, no persistence path is
  added, no OpenAI path is added, and create remains unavailable.

Validation evidence:

- `npm exec eslint -- src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx src/components/onboarding/PlanPresetPanel.tsx src/components/OnboardingGate.tsx src/lib/running-plan-engine-actions.ts src/lib/training-api.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- inline `node --import tsx` source proof for Half Marathon and Marathon Base builders:
  - Half Marathon: `98` rows, exact `21100m`, source kind
    `running_plan_engine_half_marathon_builder_v1`
  - Marathon Base: `112` rows, `endpointMainDistanceMeters: null`, final kind
    `marathon_base_endpoint`, source kind `running_plan_engine_marathon_base_builder_v1`
- `npm run build`

### Slice R9F: Universal Runner-Facing Richness Gates

Owner:

BACKEND.

Status:

implemented / validation passed.

Scope:

- encode the Running Coach universal runner-facing richness bar in backend preview and canonical
  review validation
- reject selected/generated plans with long visible identity deserts, long-run-only richness, or
  missing canonical `source_workout_type` readback
- preserve selected-distance endpoint truth:
  - `10K` remains exact `10000m`
  - `Half Marathon` remains exact `21100m`
  - `Marathon Base` remains base-only with no `42195m` selected-distance endpoint
  - `Marathon Completion` remains the only exact `42195m` family
- preserve no fake pace, no fake personal HR, no 5K benchmark dependency, and no watch/no-watch
  gate

Implementation notes:

- Added `runner_facing_richness_gate_v1` as the shared backend validator for preview rows and
  canonical review rows.
- Wired the gate into 10K, Half Marathon, Marathon Base, and Marathon Completion diversity
  validators.
- Wired canonical richness validation into selected running-plan review exactness so accepted
  preview richness must survive canonical review/export shape.
- Added runner-facing richness summaries to generated scenario artifacts and coach-review matrix
  proof.
- Added canonical `steady_aerobic_run` mapping to selected-plan review rows as
  `workout_type: steady_or_easy`, `workout_family: steady`, and
  `workout_identity: steady_aerobic_run`.
- Repaired safe non-long-run bridge placement in the composition owner:
  - beginner 10K uses recurring safe strides bridges without adding tempo/intervals
  - conservative/standard Marathon Base beginner plans add earlier strides and steady bridges
  - beginner Marathon Completion adds post-adaptation and early-build strides bridges
  - supported 10K adds a late tempo refresh before taper
  - Half Marathon progression is treated as visible sustained support

Validation evidence:

- `npm exec eslint -- src/lib/plan-creation-engine/*.ts src/lib/running-plan-engine-review.ts scripts/generate-running-plan-engine-scenarios.ts scripts/running-plan-engine-scenarios/coach-review-matrix.ts scripts/validate-running-plan-engine-confirm.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts`
  - acceptance matrix: `17` scenarios / `17` preview-ready / `0` unavailable
  - coach-review matrix: `624` scenarios / `171` preview-ready / `453` unavailable
  - unresolved ranges: `0`
  - unresolved executable segments: `0`
  - coach-review subset: `22`
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
  - 10K canonical review: `84` rows / `60` non-rest
  - Half Marathon canonical review: `168` rows / `120` non-rest
  - Marathon Base canonical review: `168` rows / `120` non-rest
  - persistence mode remained non-mutating because Supabase env was not configured
- `npm run build`
- `git diff --check -- src/lib/plan-creation-engine src/lib/running-plan-engine-review.ts scripts/generate-running-plan-engine-scenarios.ts scripts/running-plan-engine-scenarios/coach-review-matrix.ts scripts/validate-running-plan-engine-confirm.ts scripts/validate-running-plan-engine-source.ts docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`

### Slice R10: Controlled Deletion Of Failed Builder Artifacts

Owner:

BACKEND.

Scope:

- delete/demote only failed builder/source/gate pieces with proof
- preserve accepted new builder
- preserve review/confirm/persistence
- preserve negative fixtures that prove the failure cannot recur

### Slice R11: Resume Service-Size Cleanup

Owner:

ARCHITECT / BACKEND.

Scope:

- return to Hito Stack Simplification Strike only after plan creation passes product acceptance
- re-audit hotspots after accepted rebuild
- select the next safe deletion/demotion gate

## What Remains Forbidden

Current status update, 2026-06-10: selected-plan Create is now accepted for the rebuilt engine. The
forbidden list below applies to new scope beyond the accepted backend-owned preview/review/confirm
path.

- no shipped 5K
- no target-time support as a happy path
- no 5K benchmark as a normal happy-path input
- no no-watch / no-app selectable normal path
- no fake pace
- no fake personal HR
- no frontend-owned schedule logic
- no unreviewed or unscoped DB/Supabase mutation outside the accepted selected-plan Create path
- no additional persistence semantic changes in this plan unless separately approved
- no OpenAI runtime generation for normal plan creation
- no broad deletion without a deletion boundary
- no current product/system docs or changelog wording that implies production rollout, active-plan
  replacement, or manual workout authoring

## QA Expectations

Current status update, 2026-06-10: selected-plan Create has passed built-server browser QA. The list
below is retained as historical acceptance criteria for earlier rebuild slices.

Acceptance QA must prove:

- exported JSON contains final selected-distance behavior
- exported JSON contains watch-executable segment prescriptions
- no vague effort-primary targets appear as primary execution truth
- browser flow opens selected-plan modal/screen from `Select Plan`
- mini calendar renders backend-shaped rows and colored workout types
- rest-day and preferred long-run preferences are collected or defaulted by backend
- workout detail/readback renders primary structured prescription before secondary cue
- mobile 375px has no horizontal overflow
- no Supabase mutation unless explicitly scoped

## Risks

- Reusing the failed builder too heavily may preserve the same wrong doctrine under new names.
- Letting frontend own calendar/schedule preview would create a second plan truth.
- Treating weight/height as medical/injury inference would be unsafe and unacceptable.
- Letting target time create precise pace truth would reintroduce fake precision.
- Requiring 5K benchmark or personal HR-zone setup would make the new engine feel like the old
  over-gated flow.
- Treating Hito default HR zones as personal truth would create fake personalization.
- Deleting accepted runtime/persistence artifacts before replacement coverage exists could break
  review/confirm paths.
- Expanding beyond the smallest 10K builder before R3 proves endpoint/readback quality would likely
  recreate the patch cycle.

## Exit Criteria

- Running Coach source-of-truth exists for shipped distances and workout segment anatomy.
- Backend source-of-truth model is implemented from coach doctrine.
- At least 10K passes exported JSON, browser, selected-plan modal, workout detail, endpoint, and
  watch-executable segment acceptance.
- Half Marathon passes the same acceptance before it is considered product-ready again.
- Marathon/Base is either honestly repositioned or passes an explicit endpoint contract.
- Frontend selected-plan flow uses backend-shaped calendar/review truth.
- Failed old builder artifacts are deleted/demoted or frozen as negative fixtures.
- Service-size cleanup remains paused until product acceptance is complete.

## Blockers

- Backend Slice R2 is accepted.
- Backend Slice R2B is accepted.
- Backend Slice R3 10K builder is accepted.
- Backend Slice R4C 10K diversity policy behavior is implemented, harness-validated, and build
  validated.
- QA Slice R5 accepted the rebuilt 10K selected-plan vertical.
- Backend Slice R6B Half Marathon and Marathon Base preview expansion is implemented,
  harness-validated, and build validated.
- Frontend Slice R6D selected-plan preview wiring is implemented and accepted through later
  selected-plan Create browser QA.
- R8 confirm/persist is accepted through scoped remote persistence proof and built-server browser
  Create proof.
- Running Coach accepted the long-horizon anti-flatness repair.
- QA accepted the long-horizon anti-flatness repair with source/CLI/build/JSON proof.
- Running Coach produced the Marathon Completion family contract.
- Backend implemented and QA accepted the Marathon Completion deterministic preview family.
- Product accepted the universal selected-distance no-dead-end UX taxonomy.
- Current gate before frontend exposure: BACKEND confirm/persist widening for Marathon Completion,
  while preserving `Marathon Base` as base-only.

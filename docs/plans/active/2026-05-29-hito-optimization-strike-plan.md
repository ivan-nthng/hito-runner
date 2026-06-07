# Hito Optimization Strike Plan

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Start the preset-first first-plan architecture track after completing the duplicate blueprint
authoring cleanup checkpoint.

## Stage

ARCHITECT checkpoint / optimization strike duplicate cleanup closeout

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Define the preset-first first-plan architecture from the backlog item after the optimization strike
duplicate cleanup checkpoint is complete.

STAGE:
ARCHITECT plan / preset-first no-plan onboarding and token-saving first-plan architecture

PLAN:
docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md

CONTEXT:
- The optimization strike cleanup phase completed Slice 1 doctrine release-gate extraction, Slice 2
  legacy seam classification, Slice 3 strict nested draft demotion, and Slice 4 duplicate blueprint
  authoring file deletion.
- `src/lib/ai-first-plan-blueprint-authoring 2.ts` was deleted after source audit proved it was a
  tracked stale duplicate.
- Blueprint default behavior, envelope internal support, doctrine coverage, and build all remained
  green.
- No next high-risk stale/duplicate/legacy seam is currently identified for another immediate
  optimization deletion slice.
- The next highest-impact work is preset-first first-plan architecture, which can reduce OpenAI
  token usage and AI-output fragility without waiting for manual workout CRUD.

CONSTRAINTS:
- Do not reopen completed optimization cleanup without a concrete stale/high-risk seam.
- Do not implement code in this architecture pass.
- Do not change production first-plan behavior yet.
- Do not make frontend own preset plan truth.
- Do not block preset-first architecture on manual workout authoring.
- Preserve blueprint/envelope safety gates, metric truth, and review/confirm boundaries.

OUTPUT:
1. Task
2. Stage
3. Current first-plan architecture
4. Preset source-of-truth decision
5. Preset family inventory
6. Custom authoring escape hatch
7. Backend implementation slices
8. Running Coach gate
9. Frontend card/review implications
10. Manual workout editing relationship
11. QA strategy
12. Blockers
```

## Owner

ARCHITECT / BACKEND / FRONTEND / QA / RUNNING COACH

## Last Updated

2026-06-06

## Context

Recent architecture and QA work made Hito much safer:

- first-plan creation now requires accepted `ai_first_plan_blueprint_v1` truth instead of silently
  falling back to deterministic `structured_authoring_v1`
- `ai-first-plan-blueprint-authoring.ts` and `structured-plan-authoring.ts` have been decomposed into
  smaller backend modules
- saved-mode calendar and workout detail render backend-owned rich workout truth
- admin Backlog now mirrors repo markdown work items and keeps repo-derived rows read-only server-side
- routine QA screenshots now live under ignored `qa-artifacts/`

The remaining problems are not one isolated bug. They are a cluster of maintainability, release
confidence, UX, and design-system consistency risks.

## Problem Definition

### 1. Doctrine validator is too large

`scripts/validate-plan-authoring-doctrine.ts` is still about 6200 lines and owns too many unrelated
assertion groups:

- structured authoring doctrine
- rich workout mapping/readback/persistence
- text rich draft
- active-plan refresh proposal/apply
- import/export roundtrip
- AI strict draft and blueprint contracts
- first-plan review/confirm persistence exactness
- refresh fixture builders

This is dangerous because the validator is our safety net. If it is hard to review, future cleanup
or deletion work becomes slow and scary.

### 2. Legacy and diagnostic plan-authoring seams still coexist

The product path is moving toward one blueprint-owned first-plan pipeline, but the repo still contains
diagnostic and compatibility seams:

- strict nested AI draft path
- deterministic structured authoring compatibility
- text rich draft enrichment
- voice authoring seams
- ops scripts and mock fixtures

Some of these are still useful. Some should eventually be deleted or demoted. The risk is not their
existence alone; the risk is agents or QA accidentally treating a fallback/diagnostic path as proof of
production quality.

### 3. Blueprint plan quality still needs runner-facing review

Backend safety gates are strong, but a valid blueprint plan can still feel repetitive or visually weak
to a runner. The next quality question is not whether the schema passes. It is whether saved calendar
and workout detail output looks like a credible coaching product across goal families.

### 4. AI first-plan latency needs a product contract

Live blueprint generation can succeed, but full-horizon plans may take a long time. A slow valid path
is still a poor user experience if the UI feels frozen, ambiguous, or retry-hostile.

### 5. Admin Backlog can drift away from Hito DS and markdown-first truth

The backlog direction is correct:

`markdown task -> explicit import/refresh -> Supabase mirror -> admin read/copy`

But the admin surface is still at risk of becoming a custom mini-app or second source of truth if
frontend edits, custom UI patterns, or non-DS controls creep back in.

## Optimization Approach

Move in larger slices than the recent micro-refactors, but keep each slice bounded by one safety rule:

- no behavior change unless the slice explicitly says it is a product behavior slice
- no silent deletion of fallbacks before validator coverage is clear
- no frontend-owned plan truth
- no custom admin/backlog UI kit
- no broad rewrite disguised as cleanup

Fast does not mean blind. It means fewer but larger cohesive slices, with strong validation.

## Workstreams

### Workstream A: Doctrine validator decomposition

Goal:
Make the safety harness reviewable so future deletion and cleanup can happen confidently.

Target:

- `scripts/validate-plan-authoring-doctrine.ts`

Desired shape:

- keep the top-level command stable
- extract coherent assertion groups into `scripts/plan-authoring-doctrine/`
- keep shared fixtures/helpers obvious
- preserve all current assertions

### Workstream B: Legacy seam classification and deletion gates

Goal:
Make it explicit which plan-authoring paths are production, fallback, diagnostic, QA-only, or
delete-later.

Outputs:

- path classification table
- deletion gates
- first safe deletion/demotion candidate
- updated active plan notes where needed

### Workstream C: Blueprint runner-facing quality review

Goal:
Have Running Coach judge actual saved-mode blueprint plans by runner-facing quality, not just schema
success.

Evidence should include:

- saved calendar screenshots
- workout detail screenshots
- source metadata proving `source_kind: ai_first_plan_blueprint_v1`
- goal-family coverage for 5K/10K/half/marathon/ultra/mountain where practical
- critique of repetition, weekly rhythm, support-run richness, taper/cutback, and terrain specificity

Routine screenshots stay under:

`qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/`

### Workstream D: First-plan latency and failure UX

Goal:
Decide the product contract for long blueprint generation and unavailable blueprint attempts.

Questions:

- what does the user see after 10s, 30s, 60s, and timeout?
- when do we offer retry?
- do we show a clear non-mutating failure state?
- do we need a background job later, or is explicit wait/retry enough for v1?

This must not reintroduce deterministic first-plan fallback as a successful production result.

### Workstream E: Admin Backlog DS/read-only hardening

Goal:
Keep `/admin/capture` useful without letting it become a custom second product system.

Rules:

- repo-derived rows are read-only in admin
- markdown remains canonical
- quick notes are scratchpad/intake only
- UI must reuse Hito DS/admin primitives
- no custom backlog UI kit
- no automatic Codex dispatch

## Larger Slice Plan

### Slice 1: Doctrine validator blueprint release-gate extraction

Owner: BACKEND

Status: complete on 2026-06-06.

Size: medium-large.

Scope:

- extract blueprint first-plan fixtures/assertions from `scripts/validate-plan-authoring-doctrine.ts`
- keep the top-level command stable
- preserve all blueprint-only release-gate assertions
- no product behavior changes

Implemented boundary:

- Added `scripts/plan-authoring-doctrine/first-plan-release-gates.ts`.
- Moved the AI first-plan service release gate, structured first-plan draft/review release gate,
  long-horizon partial/timeout release gates, reviewed first-plan persistence exactness fixture, and
  minimal blueprint builder used by those gates into the focused module.
- Kept `scripts/validate-plan-authoring-doctrine.ts` as the stable command entrypoint.
- Kept broader blueprint cadence/identity, envelope, rich workout, refresh, text/voice, and
  import/export assertions in the main validator for now rather than creating a larger shared-helper
  split in this slice.
- Reduced the main validator from 8517 lines to 7261 lines while preserving the release-gate
  assertions through a dependency-injected helper boundary.

Validation evidence:

- targeted ESLint passed for `scripts/validate-plan-authoring-doctrine.ts` and
  `scripts/plan-authoring-doctrine/**/*.ts`
- doctrine validator passed through the unchanged top-level command
- blueprint mock valid/invalid/timeout/partial commands passed
- `git diff --check` passed

Why first:

- it makes the main safety net reviewable before any legacy deletion
- it directly protects the most important production path
- it is a cohesive chunk large enough to make visible progress

### Slice 2: Legacy seam classification and deletion-gate plan

Owner: ARCHITECT

Status: complete on 2026-06-06.

Scope:

- classify strict draft, deterministic structured generator, text rich draft, voice seams, ops scripts,
  import/reference paths, and doctrine-only fixtures
- decide what can be deleted now, deleted after QA, or must remain
- update the relevant active plans

Source evidence inspected:

- `docs/plans/active/2026-05-29-hito-optimization-strike-plan.md`
- `scripts/validate-plan-authoring-doctrine.ts`
- `scripts/plan-authoring-doctrine/first-plan-release-gates.ts`
- `scripts/author-ai-first-plan-draft.ts`
- `src/lib/ai-first-plan-draft-service.ts`
- `src/lib/ai-first-plan-draft-authoring.ts`
- `src/lib/ai-first-plan-blueprint-*`
- `src/lib/ai-first-plan-envelope-*`
- `src/lib/structured-plan-authoring*`
- `src/lib/structured-first-plan-onboarding.ts`
- `src/lib/first-plan-actions.ts`
- `src/lib/openai-plan-authoring.ts`
- `src/lib/rich-workout-draft-authoring.ts`
- `src/lib/voice-to-plan-authoring.ts`
- `src/lib/active-plan-refresh-actions.ts`
- `src/lib/imported-plan.ts`
- `src/lib/plan-export.ts`
- `src/lib/plan-replacement-actions.ts`
- `src/lib/training-api.ts`
- `docs/current-system.md`
- `docs/current-product.md`
- `docs/current-state.md`
- `docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md`

Classification:

| Seam | Classification bucket | Production runner flow today | Decision |
| --- | --- | --- | --- |
| `ai-first-plan-blueprint-v1` | production default | Yes. Structured first-plan review uses `generateStructuredFirstPlanDraft` / `confirmStructuredFirstPlanDraft` and accepts `ai_first_plan_blueprint_v1` with `ai_authored` or `repaired_ai_draft`. | Keep. Do not delete, weaken, or replace in this optimization strike. |
| `ai-first-plan-envelope-v1` | internal/non-default supported path | Not public default. It is allowed only through explicit internal/server-owned `internalDraftContract: "envelope"` or ops commands, and public onboarding exposes no selector. | Keep. Do not promote to default here; production adoption remains separate. |
| Strict nested AI draft path, `ai-first-plan-draft-v1` / `strict_draft` | ops/diagnostic path and first delete/demote candidate | No. The current visible structured first-plan action rejects unsupported sources and calls the service with deterministic fallback disabled. | Demote/delete first. It is the safest candidate because current docs and script help already call it diagnostic, and blueprint/envelope own the supported first-plan contracts. |
| Deterministic structured authoring path, `structured-plan-authoring*` / `buildStructuredAuthoringPlan` | production support generator plus compatibility/readback path | Yes, for deterministic plan generation used by text, voice confirm rebuild, refresh drafts, blueprint/envelope scaffolds, import/export doctrine, and compatibility. No, as a successful structured first-plan AI fallback. | Keep. It is not legacy-deletable until every dependent product seam has another canonical generator. |
| Text rich draft enrichment | production saved-mode text enrichment | Yes. Saved-mode text replacement opts into rich draft normalization after structured input extraction. | Keep. It is backend-owned enrichment with bounded fallback metadata. |
| Voice-to-plan authoring | production runner flow | Yes. It is a Pro-gated non-mutating draft plus explicit confirm path and does not persist raw transcript text. | Keep. It depends on deterministic structured authoring and first-plan persistence boundaries. |
| Active-plan refresh proposal/apply | production runner flow | Yes. Proposal may use OpenAI plus deterministic fallback; apply persists the signed reviewed draft and does not call OpenAI. | Keep. Not part of first-plan legacy deletion. |
| JSON import/apply | production advanced fallback / migration path | Yes. It remains visible as demoted advanced import and saved-mode replacement path. | Keep. It is a user/tooling compatibility seam. |
| Plan export/import roundtrip | production export/readback plus QA compatibility | Yes. Export/import roundtrip preserves rich fields and compact-only legacy rows derive readback identity. | Keep. It protects historical/imported plans and compatibility QA. |
| Doctrine-only fixtures/builders | QA/doctrine-only fixture path | No direct product flow. They protect product contracts through `scripts/validate-plan-authoring-doctrine.ts` and extracted first-plan release gates. | Keep for now. Decompose further if reviewability becomes the bottleneck; do not delete before equivalent coverage exists. |
| `author-ai-first-plan-draft` script blueprint/envelope modes | ops/diagnostic path | Non-mutating only. Script prints bounded metadata and does not persist plans. | Keep. They support blueprint release gates, envelope comparison, QA, and Running Coach samples. |
| `author-ai-first-plan-draft` strict-draft mode | ops/diagnostic path and delete/demote candidate | No production flow. It can still exercise old full nested draft diagnostics. | First demotion target. Remove from routine script/service surfaces if safe, or retain behind clearer diagnostic-only guard with a later deletion gate. |
| `structured_authoring_v1` compatibility/fallback references | legacy compatibility/readback path plus blocked first-plan fallback boundary | Compatibility/readback yes; successful structured first-plan AI fallback no. `first-plan-actions.ts` maps unsupported fallback to unavailable metadata with `structured_authoring_v1_blocked`. | Keep compatibility references, but keep first-plan fallback blocked. Do not delete until import/export/readback and refresh reconstruction are separately audited. |
| Rich workout draft authoring and fallback metadata | production enrichment plus detectable fallback metadata | Yes, for saved-mode text and active-plan refresh enrichment. Fallback metadata is allowed only as detectable fallback to deterministic canonical truth. | Keep. Do not confuse rich-draft deterministic fallback metadata with first-plan fallback success. |

Current production runner paths allowed today:

- `ai-first-plan-blueprint-v1` for structured first-plan review/confirm.
- Deterministic structured authoring for text, voice confirm rebuild, refresh draft construction,
  import/export compatibility, and backend scaffold support.
- Text rich draft enrichment and active-plan refresh rich draft enrichment, with bounded fallback
  metadata.
- Voice-to-plan draft/confirm.
- Active-plan refresh proposal/apply.
- JSON import/apply and plan export/import roundtrip.

Internal/server-owned only:

- `ai-first-plan-envelope-v1` through explicit `internalDraftContract: "envelope"` or ops commands.
- Blueprint/envelope trace artifacts and service debug metadata.

Ops/diagnostic only:

- `npm run author-ai-first-plan-draft` script modes.
- Saved blueprint visual proof helpers and coach sample output.
- Strict nested draft comparison mode while it remains.

QA/doctrine-only:

- Doctrine fixtures/builders and extracted first-plan release gate helpers.
- Mock invalid/timeout/partial blueprint/envelope fixtures.

Compatibility/readback only:

- Older compact-only `training-plan-v2` import/readback derivation.
- `structured_authoring_v1` source readback where persisted/imported plans already carry that source.
- Rich workout fallback metadata for text/refresh surfaces.

Delete/demote candidate:

- First candidate: strict nested AI draft path (`ai-first-plan-draft-v1` / `strict_draft`).
- Reason: it is already documented as diagnostic, has worse prompt/output shape than blueprint or
  envelope, is not the public first-plan default, and is the only classified seam whose removal can
  reduce AI-contract complexity without touching current production runner behavior.

Required validation gate before deleting or demoting strict draft:

- Source audit of every `strict_draft`, `strict-draft`, `ai-first-plan-draft-v1`, and
  `AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION` reference.
- Doctrine validator remains green through the stable entrypoint.
- Blueprint mock valid/invalid/timeout/partial remain green.
- Envelope mock matrix or targeted envelope proof remains green.
- Structured first-plan invalid/timeout still returns unavailable metadata with no
  `structured_authoring_v1` fallback success.
- If strict draft is retained, one explicit diagnostic proof must show it is not default and cannot
  be mistaken for production readiness.
- If strict draft is removed, CLI/help/negative-contract proof must show callers get a bounded
  unsupported-contract result.
- `git diff --check` and build/type validation if TypeScript wiring changes.

Must not be touched yet:

- `ai-first-plan-blueprint-v1` production default.
- `ai-first-plan-envelope-v1` internal supported option.
- Deterministic structured authoring generator.
- Text rich draft, voice-to-plan, active-plan refresh, JSON import/apply, and plan export/import.
- Doctrine fixtures unless equivalent coverage is moved, not deleted.
- `structured_authoring_v1` compatibility/readback references needed by older persisted/imported
  plans.

### Slice 3: First safe legacy deletion or demotion

Owner: BACKEND

Status: complete on 2026-06-06. Backend validation is accepted as sufficient for this internal
cleanup gate; no browser QA is required because no runner-facing behavior changed.

Scope:

- implement the strict nested AI draft deletion/demotion candidate from Slice 2
- keep blueprint first-plan production behavior unchanged
- prove no QA coverage loss

Implementation decision:

- `strict_draft` was removed from the routine AI first-plan service contract and structured
  first-plan action debug schema; the service now accepts only production-default `blueprint` and
  internal/non-default `envelope`.
- `npm run author-ai-first-plan-draft -- --contract strict-draft` now returns a bounded unsupported
  contract error instead of running a production-looking diagnostic success path.
- The strict nested `src/lib/ai-first-plan-draft-authoring.ts` module is retained for doctrine-only
  schema/prompt/normalizer coverage until a later source audit proves full deletion is safe.
- First-plan release gates keep blueprint/envelope service coverage; strict nested module coverage
  stays in the top-level doctrine validator and no longer appears as a service readiness proof.

Validation evidence:

- Source audit confirmed remaining strict nested references are no longer routine first-plan
  service/action/script selection.
- Blueprint valid/invalid/timeout/partial proofs passed.
- Envelope `balanced-half` mock proof passed.
- Doctrine validator passed.
- `npm run author-ai-first-plan-draft -- --contract strict-draft` returned bounded
  `unsupported_contract` rather than a successful draft.
- `npm run build` passed.
- No `structured_authoring_v1` fallback success leak was reproduced.

Closeout decision:

- Mark strict nested draft demotion complete for this optimization strike slice.
- Keep strict nested module-level doctrine coverage for now.
- Full strict nested module deletion requires a later deletion audit and should not be bundled with
  this completed demotion.

Follow-up surfaced:

- `src/lib/ai-first-plan-blueprint-authoring 2.ts` is a tracked duplicate-looking file with a space
  in the filename.
- Initial source inspection shows current imports target `src/lib/ai-first-plan-blueprint-authoring.ts`
  rather than the ` 2.ts` file.
- This should be audited in the next bounded backend cleanup slice before deletion.

### Slice 4: Duplicate-looking blueprint authoring file audit

Owner: BACKEND

Status: complete / QA-passed on 2026-06-06.

Scope:

- audit `src/lib/ai-first-plan-blueprint-authoring 2.ts`
- prove whether it is dead duplicate state or still owns hidden behavior
- delete only if source evidence proves no runtime/script/doctrine/docs path depends on it
- preserve blueprint default, envelope internal option, doctrine validator, and first-plan fallback
  boundaries

Initial source evidence:

- `git ls-files` shows both `src/lib/ai-first-plan-blueprint-authoring.ts` and
  `src/lib/ai-first-plan-blueprint-authoring 2.ts` are tracked.
- The normal facade is about 262 lines; the duplicate-looking file is about 3456 lines.
- Source search found current imports pointing at `ai-first-plan-blueprint-authoring.ts`, not the
  ` 2.ts` file.

Deletion decision:

- Deleted `src/lib/ai-first-plan-blueprint-authoring 2.ts`.
- Reason: exact filename references were limited to this active optimization plan, while runtime,
  ops script, and doctrine imports all target the canonical facade without the ` 2` suffix.
- No unique behavior was merged from the deleted file in this slice; if later history needs old
  monolith details, git history remains the source.

Closeout evidence:

- BACKEND source audit proved `src/lib/ai-first-plan-blueprint-authoring 2.ts` was a tracked stale
  duplicate:
  - old 3456-line monolith
  - current canonical facade is `src/lib/ai-first-plan-blueprint-authoring.ts`
  - runtime, ops script, and doctrine imports point to the canonical facade
  - exact duplicate filename references remain only in this optimization plan as cleanup evidence
- No unique logic was merged from the duplicate.
- Blueprint mock success still returned `ai_first_plan_blueprint_v1` / `repaired_ai_draft`.
- Blueprint invalid, timeout, and partial mocks remained bounded `blueprint_unavailable`.
- Envelope `balanced-half` smoke still returned `ai_first_plan_envelope_v1` /
  `expanded_from_envelope`.
- Doctrine validator passed.
- Build passed.

Behavior-preservation decision:

- The duplicate cleanup is complete.
- The production blueprint default remains untouched.
- The internal/non-default envelope option remains untouched.
- Strict nested draft remains demoted from routine service/action/script entrypoints.
- No `structured_authoring_v1` first-plan fallback success was reintroduced.

Validation gate:

- source audit of imports/references before deletion
- doctrine validator
- blueprint valid/invalid/timeout/partial
- envelope targeted proof
- `git diff --check`
- `npm run build`

Optimization checkpoint decision:

- Pause this optimization-strike cleanup phase after Slice 4.
- Do not start another deletion/demotion slice unless a new concrete high-risk stale, duplicate, or
  legacy seam is identified with source evidence.
- Current remaining optimization work is future/backlog unless reprioritized:
  - further doctrine validator extraction if reviewability becomes the next bottleneck
  - first-plan latency/failure UX contract if user-facing wait/failure states become the next risk
  - additional legacy seam deletion only after a source audit names a specific candidate
- Recommended immediate next track is `First-Plan Preset Library And Custom Authoring Escape Hatch`
  because it is higher product impact now: it can reduce first-plan OpenAI token usage and
  AI-output fragility without weakening the completed blueprint/envelope safety gates.

### Slice 5: Blueprint product-quality evidence pass

Owner: QA, then RUNNING COACH

Scope:

- generate or reuse disposable saved blueprint plans
- collect local screenshots under `qa-artifacts/`
- Running Coach reviews only the coaching quality and runner-facing plan credibility
- no SQL/script validation ownership by Running Coach

### Slice 6: First-plan latency/failure UX contract

Owner: ARCHITECT, then FRONTEND or BACKEND depending on decision

Scope:

- define and implement the smallest UX/backend boundary for slow blueprint generation
- preserve non-mutating failure behavior
- no deterministic fallback success state

### Slice 7: Admin Backlog DS/read-only compliance cleanup

Owner: FRONTEND

Scope:

- ensure repo-derived backlog rows are visually/readably read-only
- keep quick-note editing separate
- remove or replace custom UI patterns with Hito DS/admin primitives
- no new backlog framework

## QA Expectations

Every implementation slice must report:

- what path was touched
- what path was intentionally not touched
- whether behavior changed
- exact validation run
- whether screenshots are needed and where they were stored

For frontend/admin slices:

- built-in Codex browser first
- Safari only as fallback or explicit Safari test
- screenshots under `qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/`
- Hito DS consistency called out explicitly

For backend plan-authoring slices:

- doctrine validator must pass unless the slice explicitly updates equivalent coverage
- blueprint mock valid/invalid/timeout must remain green
- no `structured_authoring_v1` fallback leak into blueprint first-plan success/failure

## Risks

- decomposing the doctrine validator can accidentally hide coverage gaps
- deleting diagnostic paths too early can make bugs harder to reproduce
- large slices can drift into behavior changes unless the owner reports no-behavior-change evidence
- frontend admin cleanup can become another redesign instead of DS consolidation
- latency work can accidentally reintroduce fallback-as-success if copy or control flow is sloppy

## Exit Criteria

- doctrine validator is split enough that blueprint, refresh, import/export, text/voice, and rich
  workout assertions are easy to locate
- legacy/diagnostic plan-authoring paths are classified with deletion gates
- at least one safe legacy/demoted path is removed or explicitly documented as retained
- Running Coach has reviewed real saved blueprint plans and named concrete quality issues or approved
  controlled rollout
- first-plan slow/unavailable states have a clear product contract
- admin Backlog follows markdown-first truth and Hito DS reuse without custom mini-UI drift

## What Not To Touch

- do not reopen `structured-plan-authoring.ts` extraction unless a concrete issue appears
- do not delete deterministic generation yet
- do not weaken metric gates, default HR labeling, pace gates, fixed rest days, refresh safety, or
  review/confirm boundaries
- do not move plan truth into frontend
- do not make Running Coach run SQL/scripts or own QA validation
- do not turn admin Backlog into Jira, Linear, or auto-Codex dispatch
- do not commit routine screenshots

## Suggested Next Step

Start the preset-first first-plan architecture track from
`docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md`.

Keep this optimization strike paused after duplicate cleanup unless a new concrete stale, duplicate,
or legacy seam is identified with source evidence.

# Plan Authoring Engine Decomposition And Legacy Cleanup

## Status

Complete / Closed / archived after blueprint and structured authoring decomposition milestones

## Type

plan

## Priority

medium

## Next Recommended Role

None

## Task

Archived: blueprint and structured authoring decomposition milestones are complete.

## Stage

Complete / archived

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Select the next plan-authoring engine cleanup target after the structured authoring decomposition
milestone.

STAGE:
ARCHITECT checkpoint / refactor milestone decision

CONTEXT:
- Source path: docs/plans/active/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

ARCHITECT / BACKEND / QA

## Last Updated

2026-06-03

## Archive Note

Archived on 2026-06-03 during active-plan cleanup. The blueprint authoring facade decomposition and
structured-plan-authoring decomposition milestones are complete with behavior-preservation evidence.
The remaining doctrine-validator cleanup is now owned by the active optimization strike plan:
`docs/plans/archive/2026-05-29-hito-optimization-strike-plan.md`.

## Context

The AI-authored structured first-plan pipeline has reached a blueprint-only release gate:

- supported structured first-plan creation now requires accepted `ai_first_plan_blueprint_v1`
- invalid, unavailable, or timed-out blueprint attempts fail non-mutatingly instead of returning a
  reviewable `structured_authoring_v1` first-plan draft
- confirm rejects non-blueprint reviewed first-plan drafts
- deterministic `structured_authoring_v1` no longer counts as structured first-plan success

The remaining architecture problem is maintainability. The plan-authoring engine has several large
files and old seams that make it hard to evolve safely.

Current large hotspots from repo inspection:

- `scripts/validate-plan-authoring-doctrine.ts`: about 6200 lines
- `src/lib/ai-first-plan-blueprint-authoring.ts`: about 3450 lines
- `src/lib/structured-plan-authoring.ts`: about 3330 lines
- `scripts/author-ai-first-plan-draft.ts`: about 2000 lines
- `src/lib/voice-to-plan-authoring.ts`: about 1680 lines
- `src/lib/ai-first-plan-draft-authoring.ts`: about 1650 lines

This plan exists to shrink and clarify those seams without deleting active safety infrastructure by
accident.

## Blueprint Facade Decomposition Closeout

Status: Complete / behavior-preserving milestone closed on 2026-05-28.

The `src/lib/ai-first-plan-blueprint-authoring.ts` phase is complete. The file remains the stable
public facade/import seam for current service, ops, and doctrine callers, but the large internal
responsibilities have been extracted into focused backend modules.

Extracted modules:

- `src/lib/ai-first-plan-blueprint-schema.ts`
- `src/lib/ai-first-plan-blueprint-taxonomy.ts`
- `src/lib/ai-first-plan-blueprint-policy.ts`
- `src/lib/ai-first-plan-blueprint-prompt.ts`
- `src/lib/ai-first-plan-blueprint-trace.ts`
- `src/lib/ai-first-plan-blueprint-validation.ts`
- `src/lib/ai-first-plan-blueprint-normalize.ts`
- `src/lib/ai-first-plan-blueprint-expansion.ts`
- `src/lib/ai-first-plan-blueprint-metrics.ts`

Behavior-preservation evidence:

- targeted ESLint passed
- doctrine validator passed
- mock blueprint passed with:
  - `sourceKind: ai_first_plan_blueprint_v1`
  - `sourceStatus: ai_authored`
  - `workoutCount: 56`
  - `weekCount: 8`
- mock invalid returned `blueprint_unavailable`
- mock timeout returned `blueprint_unavailable`
- `deterministicFallbackBoundary.used` stayed `false` for invalid/timeout mocks
- `git diff --check` passed
- `npm run build` passed with existing warnings only

Closeout decision:

- do not reopen the blueprint facade extraction without a concrete regression
- do not start another refactor as part of this milestone closeout
- keep the facade as the public import seam until a future slice explicitly changes that contract
- the next cleanup candidate should be selected as a separate slice, most likely
  `structured-plan-authoring.ts` decomposition or doctrine validator decomposition

## Next Cleanup Target Selection

Status: Historical selection / completed through Slice 6F.

Candidate audit:

### `src/lib/structured-plan-authoring.ts`

- size: 3335 lines
- responsibility mix:
  - structured authoring input schema and defaults
  - normalized structured input shaping
  - deterministic workout calendar generation
  - rest/easy/steady/long/quality/mountain/trail/ultra workout builders
  - segment construction
  - pace/default-HR/metric target helpers
  - phase, taper, cutback, long-run progression, and support-run policy helpers
- direct production/compatibility callers include:
  - `src/lib/active-plan-refresh-draft.ts`
  - `src/lib/voice-to-plan-authoring.ts`
  - `src/lib/openai-plan-authoring.ts`
  - `src/lib/ai-first-plan-draft-service.ts`
  - `src/lib/ai-first-plan-blueprint-authoring.ts`
  - `src/lib/structured-first-plan-onboarding.ts`
  - `src/lib/first-plan-actions.ts`
  - `src/lib/plan-authoring-snapshot.ts`
- ops/QA callers include:
  - `scripts/author-plan-from-text.ts`
  - `scripts/author-ai-first-plan-draft.ts`
  - `scripts/author-structured-plan.mjs`
  - `scripts/seed-ai-first-plan-blueprint-proof.ts`
  - `scripts/validate-plan-authoring-doctrine.ts`
  - legacy `scripts/lib/*.mjs` compatibility helpers
- dependent product paths:
  - active-plan refresh exact draft
  - voice-to-plan confirmation
  - text authoring compatibility
  - AI blueprint deterministic comparison/fallback boundary
  - plan-scoped authoring snapshots
  - doctrine fixtures and ops scripts
- deletion risk: high
- extraction value: high, because it is still a runtime/compatibility hotspot and the same schema
  is imported across many production seams

### `scripts/validate-plan-authoring-doctrine.ts`

- size: 6244 lines
- responsibility mix:
  - structured authoring doctrine assertions
  - rich workout mapping/readback/persistence fixtures
  - text rich draft tests
  - active-plan refresh proposal/apply fixtures
  - import/export roundtrip fixtures
  - AI strict draft and blueprint fixtures
  - first-plan review/confirm persistence exactness fixtures
  - refresh fixture builders
- direct usages are validation/runbook/documentation oriented rather than product runtime
- dependent product paths:
  - doctrine regression coverage only; it does not run inside app routes
- deletion risk: high if split carelessly, because it is the safety net for plan-authoring behavior
- extraction value: medium now, higher later after runtime compatibility seams are smaller

Historical decision:

- choose `src/lib/structured-plan-authoring.ts` as the next cleanup target
- do not start doctrine validator decomposition yet
- do not delete deterministic behavior
- keep the next slice behavior-preserving and facade-compatible

Reason at selection time:

- `structured-plan-authoring.ts` is smaller than the doctrine validator but more important to runtime
  architecture because refresh, voice, text, blueprint comparison, snapshots, ops, and doctrine still
  depend on it
- decomposing the runtime compatibility seam first will make later doctrine validator splitting safer
  because fixtures can target clearer module boundaries
- doctrine validator decomposition is useful, but doing it first mainly reorganizes the safety net
  while leaving the runtime hotspot unchanged

First bounded slice at selection time:

### Slice 6A: structured authoring schema/types extraction

Owner: BACKEND

Scope:

- create a focused structured authoring schema/types module, for example
  `src/lib/structured-plan-authoring-schema.ts`
- move only pure input schema/default/type ownership out of `structured-plan-authoring.ts`
- keep `structured-plan-authoring.ts` as the stable public facade and re-export
  `structuredPlanAuthoringInputSchema`
- preserve current imports/callers; do not require broad caller rewrites
- do not move workout builders, metric/default-HR helpers, phase policy, long-run policy, or segment
  builders in this first slice
- no behavior changes, no deletion, no production-path rewiring

Validation for Slice 6A:

- targeted ESLint for touched files
- doctrine validator
- at least one deterministic structured authoring mock/sample if available
- `git diff --check`
- build if source changes are broad enough to warrant it

Exit criteria:

- public imports still work from `@/lib/structured-plan-authoring`
- active-plan refresh, voice, text, blueprint service, and doctrine callers compile against the same
  schema contract
- no generated plan output changes are expected or accepted in this slice

## Structured Authoring Decomposition Closeout

Status: Complete / behavior-preserving milestone closed on 2026-05-29.

The `src/lib/structured-plan-authoring.ts` decomposition milestone is complete enough to stop. The
file is now about 230 lines and reads as a stable public facade/orchestrator for the deterministic
compatibility generator instead of a mixed-responsibility mega-module.

Extracted modules:

- `src/lib/structured-plan-authoring-schema.ts`
- `src/lib/structured-plan-authoring-policy.ts`
- `src/lib/structured-plan-authoring-metrics.ts`
- `src/lib/structured-plan-authoring-segments.ts`
- `src/lib/structured-plan-authoring-workouts.ts`
- `src/lib/structured-plan-authoring-sequencing.ts`
- `src/lib/structured-plan-authoring-finalize.ts`

Current facade responsibilities:

- public `buildStructuredAuthoringPlan` entrypoint
- stable `structuredPlanAuthoringInputSchema` re-export
- normalized input shaping
- high-level calendar-date iteration
- choosing rest, long-run, quality, steady, or easy builder per date
- final `training-plan-v2` parse

Final QA evidence:

- representative deterministic half fixture stayed unchanged:
  - total workouts: 56
  - non-rest workouts: 40
  - total segments: 133
  - non-rest segments: 117
- long runs remain on Saturday
- long-run identity sequence remains unchanged
- `meaningfulNonRestSegments` remains true
- `singleSegmentNonRest` remains `[]`
- `missingRichFields` remains 0
- `nonRestMissingLabels` remains 0
- `rowsWithTargets` remains 40
- `rowsWithPaceTargets` remains 40
- `rowsWithHrTargets` remains 40
- `restRowIssues` remains `[]`
- sample `metric_mode` and `goal_context` shape remained stable
- blueprint mock valid remains `ai_first_plan_blueprint_v1` / `ai_authored`
- invalid/timeout remain `blueprint_unavailable`
- `deterministicFallbackBoundary.used` remains false for invalid/timeout
- no `structured_authoring_v1` fallback leaked into first-plan blueprint paths
- external callers still import through `@/lib/structured-plan-authoring`
- `structured-plan-authoring-finalize.ts` is only imported by `structured-plan-authoring.ts`

Decision:

- close the structured authoring decomposition milestone now
- do not define another `structured-plan-authoring.ts` extraction slice without a concrete new bug
  or proven ownership problem
- do not delete deterministic generation yet; it still supports refresh, voice, text compatibility,
  blueprint comparison, ops, and doctrine fixtures
- no deletion gate is satisfied by this milestone alone
- the next cleanup target should shift to `scripts/validate-plan-authoring-doctrine.ts`, but only as
  a separate bounded slice with its own architecture/coverage plan

## Problem

The authoring engine now mixes too many responsibilities in a few files:

- OpenAI prompt/schema contracts
- blueprint goal-family policies
- schema validation
- schedule validation
- metric/default-HR policy normalization
- identity-aware segment expansion
- repair and trace metadata
- deterministic generator support
- strict-draft diagnostic code
- text/voice/refresh legacy compatibility
- doctrine fixtures

This creates three risks:

1. Backend fixes keep landing in giant files where review is slow and regressions are hard to spot.
2. Legacy paths can accidentally be treated as production proof.
3. Cleanup pressure can tempt broad deletion before QA proves which seams are still used.

## Canonical Direction

Keep one production first-plan path:

`structured setup -> backend input validation -> ai_first_plan_blueprint_v1 -> backend validation/normalization/expansion -> signed review -> exact confirm/save`

Legacy and fallback paths must be explicitly classified:

- production
- non-first-plan compatibility
- diagnostic/ops
- fixture-only
- delete-now
- delete-later-after-QA

No old deterministic first-plan path may become a successful structured first-plan creation result.

## Current Ownership Map

### Production first-plan path

- `src/lib/first-plan-actions.ts`
  owns structured draft/confirm orchestration and first-plan review/confirm safety.
- `src/lib/ai-first-plan-draft-service.ts`
  owns OpenAI request orchestration and blueprint-vs-diagnostic contract selection.
- `src/lib/ai-first-plan-blueprint-authoring.ts`
  owns the current production blueprint schema, prompt, validation, expansion, metric handling,
  repairs, and trace metadata.
- `src/lib/active-plan-persistence.ts`
  owns exact reviewed canonical persistence.

### Non-first-plan compatibility / still active

- `src/lib/structured-plan-authoring.ts`
  still supports active-plan refresh, voice-to-plan confirmation, text compatibility, fixtures, and
  deterministic comparison/safety scaffolding.
- `src/lib/active-plan-refresh-draft.ts`
  still builds exact deterministic refresh drafts and may optionally enrich future workouts.
- `src/lib/voice-to-plan-authoring.ts`
  still uses deterministic canonical plan truth after voice intent extraction.
- `src/lib/openai-plan-authoring.ts` and text authoring seams still support text/legacy operations.

### Diagnostic / cleanup candidates

- `src/lib/ai-first-plan-draft-authoring.ts`
  strict nested `ai-first-plan-draft-v1` path is diagnostic/reference only after blueprint pivot.
- `scripts/author-ai-first-plan-draft.ts`
  mixes blueprint ops, strict-draft diagnostics, mock fixtures, identity coverage, and live smoke.
- `scripts/validate-plan-authoring-doctrine.ts`
  has become a mega-fixture file covering many unrelated contracts.
- `scripts/lib/*.mjs` and old authoring MJS helpers may be stale and should be classified before
  deletion.

## Cleanup Principles

- Do not delete before ownership is proven.
- Prefer extraction with no behavior change before deletion.
- Preserve exact reviewed first-plan save behavior.
- Preserve invalid/unavailable blueprint non-mutating failure.
- Preserve active-plan refresh safety.
- Preserve voice/text paths until the product explicitly replaces or retires them.
- Preserve QA fixtures until smaller replacement fixtures exist.
- Delete legacy code only when there is no import, no documented active seam, and a focused QA proof.

## Proposed Module Boundaries

### Blueprint production modules

- `src/lib/ai-first-plan-blueprint-schema.ts`
  Schema constants, Zod schemas, TypeScript types, OpenAI response schema builders.
- `src/lib/ai-first-plan-blueprint-policy.ts`
  Goal-family identity policy, allowed/excluded identity matrices, cadence-slot rules.
- `src/lib/ai-first-plan-blueprint-prompt.ts`
  Prompt assembly, reference-style summary, prompt-size/debug metadata.
- `src/lib/ai-first-plan-blueprint-validation.ts`
  Shell validation, schedule validation, hard-day density, required cadence, unsafe-claim checks.
- `src/lib/ai-first-plan-blueprint-expansion.ts`
  Identity-aware expansion from compact blueprint workout intent into canonical workout segments.
- `src/lib/ai-first-plan-blueprint-metrics.ts`
  Metric intent normalization, pace gates, default estimated HR preservation, metric repair notes.
- `src/lib/ai-first-plan-blueprint-trace.ts`
  Bounded trace shape and safe debug summaries.
- `src/lib/ai-first-plan-blueprint-authoring.ts`
  Thin facade/orchestrator that wires the modules above.

### Deterministic compatibility modules

Do not delete `structured-plan-authoring.ts` in one step.

First split it by responsibility:

- structured authoring input schema and normalization
- deterministic workout builders
- deterministic doctrine validators
- compatibility helpers used by refresh/text/voice/fixtures

Only after split should Backend decide which deterministic builders can be demoted, moved to tests,
or deleted.

### Doctrine/ops scripts

Split the mega doctrine script into focused validation files only after production modules are
stable. Useful groups:

- first-plan blueprint tests
- deterministic compatibility tests
- refresh/apply tests
- import/export rich workout tests
- saved-mode rendering fixtures

## Legacy Cleanup Candidates

### Delete-now candidates

None approved yet.

Reason: the repo currently has active uncommitted admin-capture work, and plan-authoring cleanup
needs a dedicated branch/slice with focused validation.

### Delete-later-after-QA candidates

- strict nested `ai-first-plan-draft-v1` production-style code, once blueprint ops and fixtures no
  longer import it
- `--contract strict-draft` mode in `scripts/author-ai-first-plan-draft.ts`, once no QA/runbook
  depends on it
- old MJS authoring helpers if TS-backed ops fully cover their use cases
- deterministic generator branches that exist only to add first-plan surface variety and are no
  longer used by refresh, voice, text, fixtures, or tests

### Keep for now

- deterministic structured generator for active-plan refresh, voice, text compatibility, fixtures,
  and deterministic safety comparison
- blueprint trace and unavailable metadata
- seed/proof scripts that QA uses for saved-mode visual review
- import/export compatibility and rich workout mapping

## Implementation Slices

### Slice 1: Blueprint schema/policy extraction

Owner: BACKEND

Status: Complete / behavior-preserving validation passed.

Goal:
Extract pure schema, type, constants, and goal-family policy from
`ai-first-plan-blueprint-authoring.ts` without behavior changes.

Scope:

- create `ai-first-plan-blueprint-schema.ts`
- create `ai-first-plan-blueprint-policy.ts`
- move only pure constants/types/schemas/policy data
- keep public exports stable
- keep `ai-first-plan-blueprint-authoring.ts` as facade
- no prompt, validation, expansion, service, first-plan action, DB, or UI behavior changes

Implementation note:

- `ai-first-plan-blueprint-authoring.ts` remains the public facade for existing service, ops, and
  doctrine callers.
- Pure taxonomy constants, schema/OpenAI response shape, and goal-family cadence policy helpers now
  live in focused backend modules.

Validation:

- plan authoring doctrine validation
- AI first-plan ops mock valid, invalid, timeout
- TypeScript/build check if practical
- `git diff --check`

### Slice 2: Blueprint prompt/trace extraction

Owner: BACKEND

Status: Complete / behavior-preserving validation passed.

Goal:
Move prompt assembly and bounded trace helpers out of the facade without changing generated prompt
content or trace shape.

Implementation note:

- Prompt assembly now lives in `src/lib/ai-first-plan-blueprint-prompt.ts`.
- Bounded trace table/count helpers now live in `src/lib/ai-first-plan-blueprint-trace.ts`.
- The normalization context and fallback-result formatter now live in
  `src/lib/ai-first-plan-blueprint-validation.ts`; validation rule movement remains scoped to the
  later validation extraction slice.
- `ai-first-plan-blueprint-authoring.ts` remains the compatibility facade for service, ops, and
  doctrine callers.

Validation:

- prompt snapshot/string assertions already in doctrine fixtures remain green
- ops `--trace-blueprint` output shape remains stable

### Slice 3: Blueprint validation extraction

Owner: BACKEND

Status: Complete / behavior-preserving validation passed.

Goal:
Move validation functions into a focused validation module.

Implementation note:

- Blueprint shell validation, schedule/date checks, required cadence checks, goal-family identity
  validation, hard-day density validation, unsafe-claim checks, and normalized-plan doctrine checks
  now live in `src/lib/ai-first-plan-blueprint-validation.ts`.
- Blueprint workout row normalization and rest-row preparation now live in
  `src/lib/ai-first-plan-blueprint-normalize.ts`, along with canonical candidate
  `training-plan-v2` object preparation; identity-aware segment expansion and target-building remain
  in the facade for the later expansion/metrics slice.
- Existing service, ops, and doctrine imports still flow through
  `src/lib/ai-first-plan-blueprint-authoring.ts`.

Validation:

- fixed rest-day violations still fail
- invalid taxonomy still fails
- missing cadence still fails
- unsafe claims still fail
- low-support caps still pass/fail correctly

### Slice 4: Blueprint expansion/metrics extraction

Owner: BACKEND

Status: Complete / behavior-preserving validation passed.

Goal:
Move identity-aware segment expansion and metric normalization into focused modules.

Implementation note:

- Identity-aware blueprint segment scaffolds now live in
  `src/lib/ai-first-plan-blueprint-expansion.ts`.
- Blueprint metric target construction, pace gate reuse, default estimated HR target labels, and
  metric repair notes now live in `src/lib/ai-first-plan-blueprint-metrics.ts`.
- `src/lib/ai-first-plan-blueprint-authoring.ts` remains the stable public facade and orchestration
  seam for existing service, ops, and doctrine callers.

Validation:

- identity coverage fixture still expands all supported identities
- no substantial non-rest workout becomes one-block filler
- default estimated HR remains labelled and bounded
- unsupported pace still strips/repairs

### Slice 5: Strict draft diagnostic deletion decision

Owner: ARCHITECT / BACKEND / QA

Goal:
Classify `ai-first-plan-draft-v1` strict nested path as delete, keep-diagnostic, or archive.

Required proof before deletion:

- no production first-plan action imports it
- no current runbook requires `--contract strict-draft`
- blueprint ops covers live/mock/invalid/timeout diagnostics
- doctrine fixtures have replacement coverage for any unique strict-draft safety tests

### Slice 6: Deterministic generator split

Owner: BACKEND

Goal:
Split `structured-plan-authoring.ts` by responsibility without deleting behavior.

Do not remove deterministic generation yet because active-plan refresh, voice, text, and fixtures
still depend on it.

### Slice 6A: Structured authoring schema/types extraction

Owner: BACKEND

Status: Complete / behavior-preserving QA passed.

Goal:
Extract pure structured authoring input schema/type ownership from `structured-plan-authoring.ts`
while keeping the current facade import path stable.

Scope:

- create `src/lib/structured-plan-authoring-schema.ts` or equivalent focused module
- move only schema/default/type constants needed for `structuredPlanAuthoringInputSchema`
- keep `structured-plan-authoring.ts` exporting `structuredPlanAuthoringInputSchema`
- avoid broad caller rewrites in this first slice
- do not move workout builders, segment builders, metric helpers, phase policy, long-run policy, or
  schedule generation logic yet
- do not delete deterministic generation behavior

Implementation note:

- `src/lib/structured-plan-authoring-schema.ts` now owns the structured authoring input schema,
  weekday schema/default parsing constants, and pure TypeScript helper types.
- `src/lib/structured-plan-authoring.ts` remains the stable public facade for existing refresh,
  voice, text, blueprint comparison, ops, and doctrine imports.
- Deterministic generation, workout builders, segment builders, metric helpers, phase policy, and
  long-run policy remain in the facade for later targeted slices.

Validation:

- targeted ESLint for touched files
- doctrine validator
- build if practical
- `git diff --check`

### Slice 6B: Structured authoring pure policy/helper extraction

Owner: BACKEND

Status: Complete / behavior-preserving QA passed.

Goal:
Extract stateless structured authoring helper/policy functions without moving generation builders.

Scope:

- create `src/lib/structured-plan-authoring-policy.ts`
- move pure weekday/date/phase helpers, support-level predicates, benchmark parsing, and simple
  formatting helpers
- keep `src/lib/structured-plan-authoring.ts` as the stable public facade
- do not move workout builders, segment builders, metric target construction, long-run workout
  construction, refresh/voice/text behavior, or deterministic fallback behavior

Implementation note:

- Stateless helpers such as `phaseForWeek`, `firstTaperWeek`, `compareWeekdays`, `isoWeekday`,
  support-intensity guards, and recent-5K benchmark parsing now live in
  `src/lib/structured-plan-authoring-policy.ts`.
- Deterministic workout/segment generation, duration derivation, pace/HR target construction, and
  long-run construction remain in `src/lib/structured-plan-authoring.ts`.

Validation:

- targeted ESLint for touched files
- doctrine validator
- blueprint mock valid/invalid/timeout ops
- build if practical
- `git diff --check`

### Slice 6C: Structured authoring metric/segment helper extraction

Owner: BACKEND

Status: Complete / behavior-preserving QA passed.

Goal:
Extract reusable metric target and segment helper logic from `structured-plan-authoring.ts` without
changing deterministic generation behavior.

Scope:

- create `src/lib/structured-plan-authoring-metrics.ts`
- create `src/lib/structured-plan-authoring-segments.ts`
- move metric-mode formatting, pace target helpers, default estimated HR helpers, easy/long/steady
  target builders, repeat recovery targets, warmup/cooldown segment constructors, support-run
  segment builders, and the simple substantial-endurance split helper
- keep `src/lib/structured-plan-authoring.ts` as the stable public facade
- do not move workout builders, long-run construction policy, phase loops, refresh/voice/text
  behavior, blueprint-only first-plan behavior, or deterministic fallback behavior

Implementation note:

- `src/lib/structured-plan-authoring-metrics.ts` now owns the deterministic pace/default-HR target
  helpers and generated workout metric-mode summary builder.
- `src/lib/structured-plan-authoring-segments.ts` now owns reusable easy/steady support-run segment
  builders, generic warmup/cooldown segment constructors, and the simple endurance-duration split
  helper.
- Long-run construction, workout identity selection, dates, durations, phase generation, and public
  facade exports remain unchanged.

Validation:

- targeted ESLint for touched files
- doctrine validator
- blueprint mock valid/invalid/timeout ops
- build if practical
- `git diff --check`

### Slice 6D: Structured authoring deterministic workout builder extraction

Owner: BACKEND

Status: Complete / behavior-preserving QA passed.

Goal:
Extract deterministic workout builder functions from `structured-plan-authoring.ts` while keeping
the facade responsible for plan orchestration, goal-family sequencing, long-run construction, and
compatibility behavior.

Scope:

- create `src/lib/structured-plan-authoring-workouts.ts`
- move rest, easy, steady, cutback, taper tune-up, progression, strides, road quality, mountain,
  trail, hill, interval, tempo, and ultra support workout constructors
- keep `src/lib/structured-plan-authoring.ts` as the stable public facade
- keep high-level generation loops, quality workout selection, mountain/goal-family sequencing,
  long-run progression/construction, refresh/voice/text behavior, blueprint-only first-plan behavior,
  and deterministic fallback behavior unchanged

Implementation note:

- `src/lib/structured-plan-authoring-workouts.ts` now owns the self-contained deterministic workout
  constructors plus the local easy-duration helper used only by those builders.
- `src/lib/structured-plan-authoring.ts` still decides which workout builder to call for each
  date/week/phase and still owns long-run progression and long-run segment construction.
- Existing imports from `@/lib/structured-plan-authoring` remain stable for refresh, voice, text,
  blueprint comparison, ops, and doctrine callers.

Validation:

- targeted ESLint for touched files
- doctrine validator
- blueprint mock valid/invalid/timeout ops
- representative structured fixture row/segment count comparison
- build if practical
- `git diff --check`

### Slice 6E: Structured authoring long-run and weekly sequencing extraction

Owner: BACKEND

Status: Complete / behavior-preserving QA passed.

Goal:
Extract long-run progression/construction and weekly quality sequencing helpers from
`structured-plan-authoring.ts` without changing deterministic generation behavior.

Scope:

- create `src/lib/structured-plan-authoring-sequencing.ts`
- move long-run goal policy, long-run duration/progression helpers, cutback/taper long-run
  construction, steady-finish long-run construction, and quality workout selection helpers
- keep `src/lib/structured-plan-authoring.ts` as the stable public facade
- keep high-level plan generation, normalized input shaping, per-date loop orchestration,
  canonical rich workout decoration, refresh/voice/text behavior, blueprint-only first-plan behavior,
  and deterministic fallback behavior unchanged

Implementation note:

- `src/lib/structured-plan-authoring-sequencing.ts` now owns long-run construction/progression and
  goal-family/mountain quality workout selection.
- `src/lib/structured-plan-authoring.ts` still owns the public `buildStructuredAuthoringPlan`
  entrypoint, input normalization, calendar-date iteration, and canonical workout field decoration.
- Existing imports from `@/lib/structured-plan-authoring` remain stable for refresh, voice, text,
  blueprint comparison, ops, and doctrine callers.

Validation:

- targeted ESLint for touched files
- doctrine validator
- blueprint mock valid/invalid/timeout ops
- representative structured fixture row/segment/long-run placement comparison
- build if practical
- `git diff --check`

### Slice 6F: Structured authoring final row decoration extraction

Owner: BACKEND

Status: Complete / behavior-preserving QA passed.

Goal:
Extract canonical rich workout decoration and final generated row normalization from
`structured-plan-authoring.ts` without changing deterministic generation behavior.

Scope:

- create `src/lib/structured-plan-authoring-finalize.ts`
- move generated workout rich field decoration, generated goal context construction, and metric-mode
  finalization for generated rows
- keep `src/lib/structured-plan-authoring.ts` as the stable public facade
- keep public build entrypoint, normalized input shaping, per-date loop orchestration, refresh/voice
  text behavior, blueprint-only first-plan behavior, and deterministic fallback behavior unchanged

Implementation note:

- `src/lib/structured-plan-authoring-finalize.ts` now owns the private final row decoration step that
  resolves canonical workout family/identity/icon, generated goal context, and canonical metric mode.
- `src/lib/structured-plan-authoring.ts` still owns the public `buildStructuredAuthoringPlan`
  entrypoint, input normalization, and calendar-date iteration.
- Existing imports from `@/lib/structured-plan-authoring` remain stable for refresh, voice, text,
  blueprint comparison, ops, and doctrine callers.

Validation:

- targeted ESLint for touched files
- doctrine validator
- blueprint mock valid/invalid/timeout ops
- representative structured fixture row/segment/long-run/rich-field comparison
- build if practical
- `git diff --check`

### Slice 7: Doctrine script decomposition

Owner: BACKEND / QA

Goal:
Split `scripts/validate-plan-authoring-doctrine.ts` into focused validation scripts or test groups
after production module extraction is stable.

## QA Expectations

Each cleanup slice must prove:

- structured first-plan creation still accepts only blueprint truth
- invalid/timeout blueprint attempts remain non-mutating failures
- confirm still persists exact reviewed plan
- active-plan refresh still preserves protected history
- voice/text compatibility still behaves as documented unless explicitly retired
- import/export rich workout roundtrip remains intact
- no pace/HR/rest-day/hard-day safety gate is weakened

## Risks

- deleting deterministic code too early can break refresh, voice, text, fixtures, or diagnostics
- splitting a giant module can accidentally change prompt content or validation order
- strict-draft deletion can remove useful safety tests unless fixtures are moved first
- doctrine fixture decomposition can hide coverage gaps if not done after module extraction

## Exit Criteria

- blueprint authoring facade is thin and readable
- strict-draft diagnostic path is either deleted or explicitly documented as still needed
- deterministic generator is no longer mistaken for structured first-plan production
- large files are split by real responsibility, not by arbitrary line count
- no legacy first-plan path can create a successful structured first plan
- QA proves first-plan blueprint, refresh, voice/text compatibility, and import/export safety after
  each deletion slice

## Next Recommended Role

None

## Suggested Next Step

No next step in this archived plan. Use the active optimization strike plan for doctrine-validator
decomposition and legacy cleanup follow-through.

## Exact ARCHITECT Prompt For Doctrine Validator Cleanup Selection

```text
ROLE: ARCHITECT

TASK:
Select the first bounded doctrine validator decomposition slice after structured authoring decomposition closeout.

STAGE:
ARCHITECT cleanup-slice selection

PLAN:
docs/plans/active/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md

CONTEXT:
The `src/lib/structured-plan-authoring.ts` decomposition milestone is complete. The facade is now
small/focused enough to stop, with no behavior changes accepted and final QA evidence recorded in the
plan. The remaining oversized hotspot is `scripts/validate-plan-authoring-doctrine.ts`, which is the
main safety harness for first-plan blueprint, deterministic compatibility, refresh, text/voice,
import/export, and rich workout regression coverage.

GOAL:
Choose exactly one first doctrine validator decomposition slice that improves reviewability without
weakening coverage.

REQUIRED INSPECTION:
- scripts/validate-plan-authoring-doctrine.ts
- package.json
- docs/process/*plan-creation* if useful for current validation evidence
- docs/plans/active/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md

CONSTRAINTS:
- Do not edit product code.
- Do not delete assertions.
- Do not reduce coverage.
- Do not split by arbitrary line count.
- Prefer extracting one focused assertion/fixture group first.
- Keep the main doctrine command passing during and after any future split.
- Preserve blueprint-only structured first-plan behavior.
- Preserve refresh, voice/text compatibility, import/export, and rich workout regression coverage.

OUTPUT:
1. Task
2. Stage
3. Current state
4. Candidate comparison
5. Recommendation
6. Why
7. First bounded slice
8. What not to touch
9. Next recommended role
10. Exact handoff prompt
11. Blockers
```

# Plan Authoring Engine Decomposition And Legacy Cleanup

## Status

Draft / Ready for ARCHITECT checkpoint before BACKEND Slice 1

## Owner

ARCHITECT / BACKEND / QA

## Last Updated

2026-05-28

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

Validation:

- plan authoring doctrine validation
- AI first-plan ops mock valid, invalid, timeout
- TypeScript/build check if practical
- `git diff --check`

### Slice 2: Blueprint prompt/trace extraction

Owner: BACKEND

Goal:
Move prompt assembly and bounded trace helpers out of the facade without changing generated prompt
content or trace shape.

Validation:

- prompt snapshot/string assertions already in doctrine fixtures remain green
- ops `--trace-blueprint` output shape remains stable

### Slice 3: Blueprint validation extraction

Owner: BACKEND

Goal:
Move validation functions into a focused validation module.

Validation:

- fixed rest-day violations still fail
- invalid taxonomy still fails
- missing cadence still fails
- unsafe claims still fail
- low-support caps still pass/fail correctly

### Slice 4: Blueprint expansion/metrics extraction

Owner: BACKEND

Goal:
Move identity-aware segment expansion and metric normalization into focused modules.

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

ARCHITECT

## Suggested Next Step

Run a focused import/usage audit for the strict nested draft path and deterministic structured
generator, then hand Slice 1 to BACKEND for pure blueprint schema/policy extraction.

## Exact ARCHITECT Prompt For Import/Usage Audit

```text
ROLE: ARCHITECT

TASK:
Audit plan-authoring engine imports before decomposition and legacy deletion.

STAGE:
ARCHITECT cleanup audit

PLAN:
docs/plans/active/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md

GOAL:
Confirm which plan-authoring modules are production, compatibility, diagnostic, fixture-only, or
delete candidates before Backend extracts or deletes anything.

REQUIRED INSPECTION:
- src/lib/ai-first-plan-blueprint-authoring.ts
- src/lib/ai-first-plan-draft-authoring.ts
- src/lib/ai-first-plan-draft-service.ts
- src/lib/structured-plan-authoring.ts
- src/lib/first-plan-actions.ts
- src/lib/active-plan-refresh-draft.ts
- src/lib/voice-to-plan-authoring.ts
- src/lib/openai-plan-authoring.ts
- scripts/author-ai-first-plan-draft.ts
- scripts/validate-plan-authoring-doctrine.ts
- scripts/lib/*.mjs

OUTPUT:
1. Current module map
2. Import/dependency map
3. Production seams
4. Compatibility seams
5. Diagnostic/fixture seams
6. Delete-now candidates
7. Delete-later-after-QA candidates
8. Exact BACKEND prompt for Slice 1
9. Blockers

CONSTRAINTS:
- Do not edit product code.
- Do not delete files.
- Do not weaken blueprint-only first-plan behavior.
- Do not touch admin-capture work in progress.
```

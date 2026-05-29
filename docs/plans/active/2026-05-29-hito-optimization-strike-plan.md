# Hito Optimization Strike Plan

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

BACKEND

## Task

Optimize the current Hito weak spots without reopening completed work by inertia.

## Stage

BACKEND refactor / doctrine validator decomposition

## Exact Handoff Prompt

```text
ROLE: BACKEND

TASK:
Decompose the blueprint and first-plan release-gate section of `scripts/validate-plan-authoring-doctrine.ts`.

STAGE:
BACKEND refactor / no-behavior-change doctrine validator decomposition.

PLAN:
docs/plans/active/2026-05-29-hito-optimization-strike-plan.md

CONTEXT:
Hito's next optimization pass should move faster than prior micro-slices, but still preserve safety.
The largest immediate weak spot is the 6200+ line doctrine validator script. It is the main safety
net for blueprint first-plan creation, deterministic compatibility, refresh, text/voice, import/export,
and rich workout regression coverage, but it is now too large to review confidently.

GOAL:
Extract the AI first-plan blueprint / structured first-plan release-gate fixtures and assertions into
focused script modules without changing behavior or reducing coverage.

REQUIRED INSPECTION:
- scripts/validate-plan-authoring-doctrine.ts
- package.json
- docs/plans/active/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md
- docs/plans/active/2026-05-29-hito-optimization-strike-plan.md

SCOPE:
- Create a small `scripts/plan-authoring-doctrine/` helper area if that is the cleanest shape.
- Extract blueprint-first-plan fixtures/builders/assertions from `scripts/validate-plan-authoring-doctrine.ts`.
- Keep the top-level command `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`
  working exactly as before.
- Preserve all existing assertions and fixture coverage.
- Preserve blueprint-only structured first-plan release-gate checks:
  - invalid/timeout blueprint attempts are non-mutating failures
  - no `structured_authoring_v1` fallback leaks into structured first-plan success or failure paths
  - confirm rejects non-blueprint reviewed drafts
  - accepted blueprint plans persist exact reviewed canonical truth
- Prefer one cohesive extraction over many tiny files, but do not move unrelated refresh/text/import
  assertions in this slice unless they are required shared helpers.

CONSTRAINTS:
- No product code changes.
- No DB schema changes.
- No frontend/admin changes.
- Do not delete assertions.
- Do not reduce coverage.
- Do not change generated plan behavior.
- Do not weaken metric, HR, pace, rest-day, hard-day, refresh, or persistence safety gates.
- Do not reintroduce deterministic structured first-plan fallback as a valid production result.

VALIDATION:
- `npm exec eslint -- scripts/validate-plan-authoring-doctrine.ts scripts/plan-authoring-doctrine/**/*.ts`
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`
- `npm run author-ai-first-plan-draft -- --mock-openai --contract blueprint --trace-blueprint`
- `npm run author-ai-first-plan-draft -- --mock-invalid --contract blueprint --trace-blueprint`
- `npm run author-ai-first-plan-draft -- --mock-timeout --contract blueprint --timeout-ms 20 --trace-blueprint`
- `git diff --check`
- `npm run build` only if TypeScript/build wiring is touched enough to warrant it.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Behavior-preservation proof
8. Blockers
```

## Owner

ARCHITECT / BACKEND / FRONTEND / QA / RUNNING COACH

## Last Updated

2026-05-29

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

Size: medium-large.

Scope:

- extract blueprint first-plan fixtures/assertions from `scripts/validate-plan-authoring-doctrine.ts`
- keep the top-level command stable
- preserve all blueprint-only release-gate assertions
- no product behavior changes

Why first:

- it makes the main safety net reviewable before any legacy deletion
- it directly protects the most important production path
- it is a cohesive chunk large enough to make visible progress

### Slice 2: Legacy seam classification and deletion-gate plan

Owner: ARCHITECT

Scope:

- classify strict draft, deterministic structured generator, text rich draft, voice seams, ops scripts,
  import/reference paths, and doctrine-only fixtures
- decide what can be deleted now, deleted after QA, or must remain
- update the relevant active plans

### Slice 3: First safe legacy deletion or demotion

Owner: BACKEND

Scope:

- implement exactly one deletion/demotion candidate from Slice 2
- keep blueprint first-plan production behavior unchanged
- prove no QA coverage loss

### Slice 4: Blueprint product-quality evidence pass

Owner: QA, then RUNNING COACH

Scope:

- generate or reuse disposable saved blueprint plans
- collect local screenshots under `qa-artifacts/`
- Running Coach reviews only the coaching quality and runner-facing plan credibility
- no SQL/script validation ownership by Running Coach

### Slice 5: First-plan latency/failure UX contract

Owner: ARCHITECT, then FRONTEND or BACKEND depending on decision

Scope:

- define and implement the smallest UX/backend boundary for slow blueprint generation
- preserve non-mutating failure behavior
- no deterministic fallback success state

### Slice 6: Admin Backlog DS/read-only compliance cleanup

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

Start with Slice 1: a medium-large backend no-behavior-change decomposition of the blueprint
first-plan release-gate section in the doctrine validator.


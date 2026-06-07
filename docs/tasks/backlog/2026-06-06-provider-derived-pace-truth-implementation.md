# Provider-Derived Pace Truth Implementation

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Plan provider-derived pace truth for executable workout targets.

## Stage

ARCHITECT plan / provider-derived pace truth

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan provider-derived pace truth for executable workout targets.

STAGE:
ARCHITECT plan / provider-derived pace truth

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-06-provider-derived-pace-truth-implementation.md
- The current executable target contract allows pace targets from explicit execution support plus validated pace truth.
- Current first-plan pace truth is narrow and primarily based on recent 5K benchmark truth.
- Provider-derived pace truth is future work and was not implemented in the archived watch-executable slice.

GOAL:
Define the smallest canonical provider-derived pace truth seam that can safely unlock pace targets without using target time, ambition, or AI inference as fake pace truth.

ASSESS:
- which provider evidence can become pace truth
- freshness and quality gates
- how to store canonical pace capability/profile truth
- how plan generation consumes the truth
- how stale or low-confidence evidence remains advisory only

CONSTRAINTS:
- Do not infer pace from target time alone.
- Do not let AI directly create pace truth.
- Do not silently mutate current active plans.
- Keep Garmin/provider ingest normalization separate from plan generation.

OUTPUT:
1. Task
2. Stage
3. Decision
4. Proposed canonical seam
5. Validation strategy
6. Blockers
```

## User Report

The completed executable target contract intentionally keeps validated pace truth narrow. Future
provider-derived pace truth remains useful but separate.

## Expected Behavior

Provider-derived pace truth should be canonical, freshness-gated, auditable, and consumed by plan
generation only after backend validation.

## Source Investigation

Relevant source surfaces:

- `src/lib/garmin-*`
- `src/lib/workout-comparison-*`
- `src/lib/structured-plan-authoring-metrics.ts`
- `src/lib/runner-coach-context.ts`

## Blockers

None. This is a future architecture/backend track.

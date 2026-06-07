# Active-Plan Refresh Executable Target Regeneration Policy

## Status

backlog

## Type

plan

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Plan active-plan refresh regeneration policy for the executable target contract.

## Stage

ARCHITECT plan / active-plan refresh executable target policy

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan active-plan refresh regeneration policy for the executable target contract.

STAGE:
ARCHITECT plan / active-plan refresh executable target policy

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-06-active-plan-refresh-executable-target-regeneration-policy.md
- The watch-executable workout targets plan is complete and archived for first-plan/authoring generation plus readback cleanup.
- Active-plan refresh regeneration was intentionally left outside the completed vertical slice unless product scope reopens it.

GOAL:
Decide how future active-plan refresh/regeneration should handle older effort-only rows and the new executable target contract without silently rewriting protected history.

ASSESS:
- whether refreshed future rows must always use executable modes
- how preserved legacy rows remain readable
- whether current refresh doctrine already covers this through reviewed draft replacement
- whether additional backend validation or QA fixtures are needed

CONSTRAINTS:
- Do not mutate active plans without explicit reviewed apply.
- Do not rewrite past/logged/Garmin/evidence-backed rows.
- Do not create fake pace or personal HR truth.
- Keep this separate from HR-zone implementation and watch-provider export.

OUTPUT:
1. Task
2. Stage
3. Decision
4. Recommended slice
5. Validation strategy
6. Blockers
```

## User Report

The completed executable target contract covers new first-plan/authoring generation and frontend
readback. Broader active-plan refresh regeneration behavior remains a future policy question.

## Expected Behavior

If active-plan refresh regenerates future workouts, the regenerated rows should not fall back to
vague effort-only happy-path output. Protected history and legacy readability must remain intact.

## Source Investigation

Relevant source surfaces:

- `src/lib/active-plan-refresh-*.ts`
- `src/lib/rich-workout-draft-authoring.ts`
- `src/lib/structured-plan-authoring-metrics.ts`
- `src/lib/training.ts`

## Blockers

None. This is a future backend/policy follow-up, not a blocker for the archived executable target
vertical slice.

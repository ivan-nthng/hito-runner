# Watch Export Integration Polish

## Status

backlog

## Type

plan

## Priority

low

## Next Recommended Role

ARCHITECT

## Task

Plan watch/export integration polish after executable target contract.

## Stage

ARCHITECT plan / watch-export integration polish

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Plan watch/export integration polish after executable target contract.

STAGE:
ARCHITECT plan / watch-export integration polish

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-06-watch-export-integration-polish.md
- The executable target contract and frontend readback cleanup are complete.
- The product does not yet have a full watch-provider workout export integration.
- Current JSON/Markdown export and readback should not imply watch sync is already shipped.

GOAL:
Define the next watch/export polish slice only when product chooses to move beyond readback into actual executable export/provider delivery.

ASSESS:
- whether JSON/Markdown export already satisfies current runner needs
- whether a watch-provider adapter is needed
- which canonical segment target fields are export-ready
- how to handle unsupported legacy effort-only rows
- what review/confirmation or download boundaries are needed

CONSTRAINTS:
- Do not claim connected watch export is live before implementation.
- Do not invent metric truth in the export adapter.
- Reuse canonical segment targets and executable modes.
- Keep provider delivery separate from plan generation.

OUTPUT:
1. Task
2. Stage
3. Decision
4. Proposed slice
5. Validation strategy
6. Blockers
```

## User Report

The watch-executable contract makes generated workouts clearer and more export-ready, but actual
watch/provider export integration remains future work.

## Expected Behavior

When prioritized, export/provider work should consume existing canonical executable segment truth
instead of creating a second workout model.

## Source Investigation

Relevant source surfaces:

- `src/lib/plan-export.ts`
- `src/lib/training.ts`
- `src/routes/workout.$date.tsx`
- future provider adapter modules if introduced

## Blockers

None. This is future product/architecture work.

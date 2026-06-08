# Plan Preset Active-Plan Replacement And Refresh

## Status

backlog

## Type

improvement / architecture

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Define whether and how Plan Presets may support active-plan replacement or refresh.

## Stage

ARCHITECT backlog / Plan Preset active-plan lifecycle intake

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Define whether and how Plan Presets may support active-plan replacement or refresh.

STAGE:
ARCHITECT backlog / Plan Preset active-plan lifecycle intake

CONTEXT:
The completed v1 Plan Preset release supports only no-active-plan creation. It never silently
replaces an existing active plan. A runner may later want to use a preset to replace, refresh, or
restart an active plan, but that is a separate mutation risk class.

SCOPE:
- decide whether preset-based replacement, refresh, or restart is needed
- define lifecycle guard and review/confirm boundary
- decide how existing workout logs, Garmin evidence, completed workouts, and protected dates behave
- decide whether this reuses active-plan refresh, schedule edit, plan replacement, or a new narrow
  server action
- define rollback and duplicate protection

ROOT-CAUSE DISCIPLINE:
Do not add a "replace with preset" button as a symptom patch. First identify the canonical lifecycle
owner and protected-history rules, then route all mutation through one reviewed persistence seam.

DO NOT:
- do not silently replace active plans
- do not delete protected workout history
- do not bypass active-plan refresh/replacement safety
- do not make frontend compute replacement truth
- do not implement code in the architecture pass

OUTPUT:
1. Task
2. Stage
3. Lifecycle decision
4. Canonical mutation owner
5. Protected-history rules
6. Review/confirm contract
7. Backend implementation slice
8. QA requirements
9. Blockers
```

## Context

Plan Presets are now reusable when a runner has no active plan. They are intentionally not an
active-plan replacement or refresh feature.

## Acceptance

- Active-plan replacement and refresh remain blocked until this architecture decision is complete.
- Protected history, logs, evidence, and active-plan lifecycle are explicitly handled.
- Frontend does not invent replacement rules.
- Any approved implementation reuses a canonical persistence/replacement seam.

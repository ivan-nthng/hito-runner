# Active-Plan Schedule Edit Save-As-Default Preferences

## Status

backlog

## Type

change_request

## Priority

low

## Next Recommended Role

ARCHITECT

## Task

Decide whether active-plan schedule edits should offer an explicit save-as-default training preferences option.

## Stage

ARCHITECT backlog / product decision

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Decide whether active-plan schedule edits should offer an explicit save-as-default training preferences option.

STAGE:
ARCHITECT backlog / product decision

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-03-active-plan-schedule-save-default-preferences.md
- The active-plan schedule edit first release is complete and archived.
- The first release intentionally preserved runner Settings defaults while updating active-plan schedule preferences.

ROOT CAUSE AND ARCHITECTURE FIT:
- Separate active-plan truth from runner-level defaults.
- Do not allow schedule edits to silently rewrite future-plan defaults.
- Reuse the existing runner training-preferences contract if this becomes implementation work.

GOAL:
Decide whether the product should add an explicit opt-in control such as "also save these as my default training preferences" after a reviewed active-plan schedule edit.

ASSESS:
- user value
- risk of accidental profile/default mutation
- copy requirements
- backend and frontend scope
- whether this should be deferred until more schedule-edit usage evidence exists

DO NOT:
- Do not implement code in this architecture pass.
- Do not change Settings semantics.
- Do not make runner defaults update implicitly.

OUTPUT:
1. Task
2. Stage
3. Current behavior
4. Decision
5. Recommended slice, if any
6. What not to touch
7. Blockers
```

## User Report

The archived schedule edit plan included optional `saveAsDefaultTrainingPreferences`, but the first
release deliberately kept runner Settings defaults unchanged.

## Evidence

Final QA proved `runnerPrefUnchanged = true` and `planPrefsChanged = true`.

## Observed Behavior

Active-plan schedule edit updates active-plan schedule preferences only.

## Expected Behavior

If the product wants defaults to change, the runner should explicitly opt in and review that
profile-level consequence.

## Source Investigation

Relevant seams:

- runner training preferences contract
- settings save action
- active-plan schedule edit apply seam
- `Open plan` schedule edit panel

## Likely Root Cause

This is a product decision, not a confirmed bug.

## Blockers

None.

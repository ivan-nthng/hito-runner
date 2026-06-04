# JSON Import Long-Run Remapping Through Shared Placement Helper

## Status

backlog

## Type

change_request

## Priority

medium

## Next Recommended Role

BACKEND

## Task

Wire JSON import long-run remapping through the shared active-plan schedule placement helper.

## Stage

BACKEND backlog / import scheduling follow-up

## Exact Handoff Prompt

```text
ROLE: BACKEND

TASK:
Wire JSON import long-run remapping through the shared active-plan schedule placement helper.

STAGE:
BACKEND backlog / import scheduling follow-up

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-03-json-import-long-run-remapping-placement-helper.md
- The active-plan schedule edit first release is complete and archived.
- The release proved same-frequency active-plan `schedule_reflow` and reviewed apply behavior.
- The archived plan intentionally left JSON import long-run remapping as a future backend slice.

ROOT CAUSE AND ARCHITECTURE FIT:
- Investigate the current imported-plan mapping path and the active-plan schedule placement helper before changing code.
- The goal is one canonical weekday/long-run placement policy, not an import-only workaround.
- Reuse existing training-preference validation and active-plan placement seams.
- Do not create a parallel import scheduling model.

GOAL:
When importing `training-plan-v2` JSON, preserve workout content and order while placing imported long-run workouts on the runner's preferred or derived long-run day when feasible, without violating fixed rest days.

SCOPE:
- Inspect `src/lib/imported-plan.ts`, active-plan schedule edit placement helpers, and weekday rest invariant helpers.
- Keep imported workout identity, family, rich fields, segments, metric targets, and source metadata intact.
- Move only date/weekday placement where the existing import policy already permits remapping.
- Return bounded review/error metadata if the imported plan cannot fit the runner's fixed rest days.

DO NOT:
- Do not change frontend import UX unless a later frontend slice is explicitly created.
- Do not weaken fixed-rest rules.
- Do not create a second schedule placement algorithm.
- Do not mutate existing active plans outside the import/apply flow.

VALIDATION:
- Run targeted lint/tests/scripts for imported plan and schedule placement surfaces.
- Run `git diff --check`.
- Add or update fixtures proving long-run placement, fixed-rest protection, and content preservation.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## User Report

The completed active-plan schedule edit plan left JSON import long-run remapping as a future backend
follow-up. Imported JSON should not keep impossible or poor long-run weekdays when Hito already knows
the runner's preferred long-run day and fixed rest days.

## Evidence

- Archived plan: `docs/plans/archive/2026-05-25-active-plan-schedule-edit-plan.md`
- Implemented current behavior is documented in `docs/current-product.md` and `docs/current-system.md`.

## Observed Behavior

Active-plan schedule reflow now uses a backend-owned placement seam, but JSON import long-run
placement may still need explicit wiring through that same helper.

## Expected Behavior

JSON import should preserve workout content while using the same canonical placement policy for fixed
rest days and preferred/derived long-run day.

## Source Investigation

Start with:

- `src/lib/imported-plan.ts`
- active-plan schedule edit placement helpers
- `src/lib/weekday-rest-invariants.ts`
- runner training preference validation helpers

## Likely Root Cause

The active-plan schedule edit placement helper and imported-plan remapping path may not yet fully
share one long-run placement owner.

## Blockers

None.

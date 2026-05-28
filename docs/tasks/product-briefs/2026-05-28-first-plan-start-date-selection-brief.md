# First Plan Start Date Selection Brief

## Status

Future backlog

## Owner

PRODUCT

## Last Updated

2026-05-28

## Context

Structured first-plan creation collects rest days, running-days/week, and preferred long-run day, but it does not yet give the runner an obvious way to choose when the plan should start.

Some runners may want to start today. Others may want to start next week, after a weekend, after travel, or on a specific first training day.

## Problem

When creating a new plan, the runner cannot clearly say:

- when the plan should begin
- which calendar date should be the first training day
- whether they want to start next week instead of immediately

This can make the generated calendar feel wrong even when the training structure itself is good.

## Product Direction

Add a small start-date choice to the plan creation flow.

The flow should let the runner choose one of:

- start as soon as possible
- start next week
- choose a specific date

The selected start date should become backend-owned plan authoring truth. Frontend should collect the choice, but backend should validate the date against schedule constraints before generating or saving the plan.

## Scheduling Rules To Preserve

- Fixed rest days remain hard constraints.
- Preferred long-run day remains respected where possible.
- The chosen start date should not silently place a non-rest workout on a fixed rest day.
- If the chosen date conflicts with fixed rest days or the selected weekly structure, backend should return a clear correction state.
- Review-before-create must remain non-mutating.
- Confirm must save the exact reviewed plan.
- Existing active-plan schedule edit remains the path for moving future dates after plan creation.

## Scope

### In Scope

- structured first-plan creation start-date choice
- review copy showing the selected effective start date
- backend validation of chosen start date
- safe fallback/correction copy for invalid combinations
- QA coverage for today, next week, custom valid date, and custom invalid rest-day date

### Out Of Scope

- changing active-plan schedule edit behavior
- moving already saved plans silently
- rebuilding import start-date handling
- automatic race-event scheduling
- multi-plan calendar management
- frontend-owned schedule shuffling

## Acceptance Criteria

1. Runner can choose when a new plan starts during plan creation.
2. `Start next week` creates a plan beginning in the following week rather than immediately.
3. A custom date can be selected.
4. Backend rejects or corrects invalid start dates that conflict with fixed rest-day constraints.
5. Draft review shows the effective start date before confirm.
6. No plan is saved before explicit confirm.
7. Confirm saves exactly the reviewed calendar.
8. The selected start date is included in plan-scoped authoring metadata for future debugging/refresh.

## Next Recommended Role

PRODUCT

## Suggested Next Step

When this moves out of backlog, PRODUCT should decide the exact UI options and copy for `start as soon as possible`, `start next week`, and `choose date`. Then ARCHITECT should create a bounded backend-first implementation plan.

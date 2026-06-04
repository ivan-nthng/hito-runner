# Manual Workout Creation, Editing, Copy, And Recurrence

## Status

backlog

## Type

change_request

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Define the product and backend architecture for manual workout creation, editing, copying, and recurrence.

## Stage

ARCHITECT backlog / manual workout authoring architecture

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Define the product and backend architecture for manual workout creation, editing, copying, and recurrence.

STAGE:
ARCHITECT plan / manual workout authoring and schedule mutation model

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md
- The user wants runners to manually create and customize workouts:
  - if a day already has a workout, open it and edit it
  - if a day is empty, create a new workout
  - copy existing workouts and paste them onto new days
  - create repeated/recurring workouts
- The Hito DS calendar/workout day playground should account for future add/edit/copy/recurring visual states, but this task is the product/backend architecture for the actual feature.

GOAL:
Design one canonical manual workout authoring pipeline that lets users safely create, edit, copy, paste, and repeat workouts without breaking active-plan truth, workout logs, Garmin evidence, fixed rest days, or refresh/import semantics.

ROOT CAUSE AND ARCHITECTURE FIT:
- Current Hito can create plans, import plans, refresh plans, edit active-plan schedule placement, and log workout results, but it does not yet expose a safe manual planned-workout CRUD pipeline.
- The correct owner is not route-local calendar UI. Backend must own validation, mutation safety, persistence, and lifecycle semantics.
- Frontend should render backend-shaped draft/review states and call explicit mutation actions only after confirmation where needed.

REQUIRED ARCHITECTURE QUESTIONS:
1. What is the canonical source for a manually created workout: `planned_workouts` row, plan-level patch, or a new authoring draft seam?
2. How should editing behave for:
   - future unlogged workouts
   - today
   - past workouts
   - workouts with logs
   - workouts with Garmin evidence/comparison/feedback
   - rest days
   - empty/no-plan dates
3. Should manual edits mutate the active plan row in place, archive/replace the plan, or create versioned workout-level overrides?
4. How should copy/paste preserve workout identity, segments, metric targets, notes, source metadata, and authoring metadata?
5. How should recurring workouts be represented:
   - one-time expansion into planned rows
   - recurrence rule metadata
   - reviewed batch mutation
   - separate template library
6. How should fixed rest days, preferred long-run day, active-plan schedule preferences, and future refresh/import behavior interact with manual additions?
7. What confirmation/review boundary is required for destructive or broad changes?
8. What should happen when a manual edit conflicts with an existing workout/log/evidence-backed day?
9. How should manual workouts be labelled in source metadata and exported JSON/Markdown?
10. What belongs to Basic vs Pro, if entitlement applies?

SCOPE:
- Audit current persistence and action seams:
  - `src/lib/active-plan-persistence.ts`
  - `src/lib/workout-log-actions.ts`
  - `src/lib/active-plan-schedule-edit-preview.ts`
  - `src/lib/active-plan-refresh-actions.ts`
  - `src/lib/plan-export.ts`
  - `src/lib/imported-plan.ts`
  - `src/lib/training.ts`
  - `src/routes/workout.$date.tsx`
  - `src/components/Calendar.tsx`
- Define a bounded implementation plan, not product code.
- Prefer one backend-owned mutation pipeline over route-local patches.
- Preserve current review/confirm safety patterns for risky mutations.

WHAT NOT TO DO:
- Do not implement code in this architecture pass.
- Do not change DB schema without a separate backend plan.
- Do not let frontend directly invent or persist schedule truth.
- Do not overwrite logged/evidence-backed history silently.
- Do not weaken fixed-rest, active-plan refresh, import, export, or Garmin feedback safety.
- Do not create a separate manual-workout product system parallel to `training-plan-v2`.

OUTPUT:
1. Task
2. Stage
3. Current state
4. Source-of-truth decision
5. Mutation model
6. Copy/paste model
7. Recurrence model
8. Safety and conflict rules
9. Required backend slice
10. Required frontend slice
11. DS/calendar implications
12. QA strategy
13. Blockers
```

## Severity

high

## Owner

ARCHITECT / BACKEND / FRONTEND / DESIGN SYSTEM / QA

## Reported

2026-06-04

## User Report

The user wants runners to be able to manually create and customize workouts:

- if a day already has a workout, open it and edit it
- if a day is empty, create a new workout
- copy old workouts and paste them into new days
- create repeated/recurring workouts

The user also wants this future capability accounted for while building the Hito DS calendar/workout
day playground, so calendar day states do not ignore future add/edit/copy/recurring affordances.

## Evidence

Current source orientation:

- `src/lib/active-plan-persistence.ts` owns plan creation/replacement and planned workout insertion
  from canonical plan seeds.
- `src/lib/workout-log-actions.ts` owns logging existing planned workouts, not editing planned
  workout content.
- `src/lib/active-plan-schedule-edit-preview.ts` owns date/schedule reflow, not workout content
  authoring.
- `src/routes/workout.$date.tsx` renders workout detail/logging for an existing date.
- `src/components/Calendar.tsx` renders calendar cells, mobile day rows, pre-start states, result
  states, and feedback/evidence markers.
- `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md` now tracks
  visual/specimen coverage for calendar/workout day states.

No implementation proof was run for this backlog item.

## Observed Behavior

Hito currently has safe canonical paths for:

- generated first-plan creation
- JSON import/apply
- active-plan refresh proposal/apply
- active-plan schedule reflow
- workout result logging

There is no obvious canonical product path for runner-authored planned-workout content CRUD,
copy/paste, or recurrence.

## Expected Behavior

Future Hito should support a backend-owned manual workout authoring flow where a runner can:

- add a workout on an empty in-plan or allowed future date
- edit a future unlogged workout
- copy a workout and paste it to another date
- create a bounded repeated/recurring workout pattern
- preserve or intentionally adjust workout identity, segments, metrics, and notes
- avoid silent conflicts with logs, Garmin evidence, fixed rest days, active-plan refresh, import,
  export, and plan history

## Source Investigation

Likely implementation owners:

- Backend architecture and mutation safety:
  - `src/lib/active-plan-persistence.ts`
  - `src/lib/active-plan-schedule-edit-preview.ts`
  - `src/lib/active-plan-refresh-actions.ts`
  - `src/lib/imported-plan.ts`
  - `src/lib/plan-export.ts`
  - `src/lib/training.ts`
- Frontend surfaces:
  - `src/routes/workout.$date.tsx`
  - `src/components/Calendar.tsx`
  - `src/components/PlanManagementDialog.tsx`
- DS reference:
  - `src/routes/hitoDS.tsx`
  - `docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md`

## Likely Root Cause

Manual workout authoring is a new mutation class. It cannot be safely added as a calendar-only UI
button because it touches canonical active-plan truth, history protection, copy/paste semantics,
recurrence expansion, export/import compatibility, and future plan-refresh behavior.

## Recommended Fix Direction

Start with an ARCHITECT plan that defines the canonical mutation model before backend/frontend work.

Recommended bias:

- backend owns planned-workout mutation, conflict detection, and persistence
- frontend owns add/edit/copy/paste interaction and review states
- DS playground accounts for future action states visually, but does not implement product behavior
- logged/evidence-backed workouts are protected unless a clear review/confirm model is approved
- recurrence should likely expand through a reviewed batch operation before persistence, unless a
  later architecture pass proves recurrence-rule storage is necessary

## What Not To Touch

- Do not implement manual workout CRUD from this backlog item.
- Do not change DB schema yet.
- Do not mutate active-plan truth from route-local UI.
- Do not silently overwrite logged or Garmin-backed workouts.
- Do not weaken existing import, refresh, export, first-plan, or schedule-edit safety.
- Do not turn `/hitoDS` into product behavior.

## Validation Expectations

Future implementation should validate:

- add workout on empty allowed date
- edit future unlogged workout
- copy/paste workout to a different date
- repeat workout across multiple allowed dates
- conflict handling for rest days, fixed rest days, existing workouts, logged workouts, and
  evidence-backed workouts
- export/import compatibility for manual workouts
- active-plan refresh behavior after manual edits
- no mutation before explicit confirm where needed
- calendar/workout detail rendering after manual mutation
- narrow/mobile no-overflow behavior

## Blockers

Architecture decision required before implementation.

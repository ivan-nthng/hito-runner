# Hito DS Calendar And Workout Day Playground

## Status

completed

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

ARCHITECT

## Task

Keep the completed `/hitoDS` calendar/workout playground spec as historical design-system evidence.

## Stage

ARCHITECT reference / completed DS calendar-workout playground

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Use the completed `/hitoDS` calendar/workout playground spec as historical design-system evidence.

STAGE:
ARCHITECT reference / completed DS calendar-workout playground

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-06-04-hito-ds-calendar-workout-playground-spec.md
- The corrected implementation is accepted and QA-passed.
- `HitoCalendarDayCell` and `HitoWorkoutDayRow` are the shared visual source of truth.
- Product calendar maps real backend/snapshot/workout truth into display props.
- `/hitoDS` maps local controls/specimen state into the same display props.

CONSTRAINTS:
- Do not reopen this spec unless a concrete DS/product calendar regression is found.
- Keep product calendar backend truth, links, tooltips, and feedback routing product-owned.
- Keep `/hitoDS` specimen-only.
- Do not describe manual workout CRUD/copy/paste/recurrence as implemented product behavior.

OUTPUT:
Use the project role output format.
```

## Compression Note

Compressed during Slice D22 of the
[Hito Docs and Artifact Compression](../../plans/active/2026-06-20-hito-docs-and-artifact-compression.md)
track. The original file carried full implementation prompts, visual failure analysis, state
inventories, and QA logs. This compact version preserves the accepted component boundary and proof.

## Final QA Acceptance Preserved

Final QA accepted the corrected visual direction and shared presentational seam on 2026-06-05:

- `/hitoDS#calendar-workout-playground` passed desktop, intermediate, and `375px` checks.
- No visible `More` text appears in cells or mobile rows.
- Occupied activity actions use an icon-only ellipsis with `aria-label="More activity actions"`.
- Empty days show compact `Add` placeholder and no more action.
- Result marker aligns with the date/header row.
- Product calendar source smoke confirmed no fake manual action props are passed from
  `src/components/Calendar.tsx`.
- Targeted ESLint, `git diff --check`, and `npm run build` passed.
- Screenshot evidence remains under
  `qa-artifacts/screenshots/2026-06-04/calendar-slot-action-marker-final-qa/`.

## Accepted Component Boundary

- `src/components/ui/hito-calendar-day.tsx` owns presentational `HitoCalendarDayCell` and
  `HitoWorkoutDayRow`.
- `src/components/Calendar.tsx` owns real schedule rendering, product links, tooltips, feedback
  routing, and mapping backend-shaped `TrainingSnapshot` / `Workout` truth into display props.
- `src/components/hito-ds/calendar-workout-playground.tsx` owns static specimen controls and static
  display states for design inspection.
- The shared components must not own routes, persistence, server actions, manual workout mutations,
  raw `TrainingSnapshot`, raw `Workout`, recurrence, copy/paste, or backend schedule truth.

## Durable Design Decisions

- The playground is one controlled reference surface, not a dashboard or card gallery.
- Desktop and mobile previews use the same display grammar as real product calendar anatomy.
- Future manual authoring affordances may appear only as visual/specimen stress states until the
  separate manual workout architecture defines product behavior.
- Outside-plan/pre-start is one optional state, not the main framing.
- `/hitoDS` remains static/specimen-only and must not become a second schedule source of truth.

## Current Owner Links

- [Current state](../../current-state.md)
- [Current system](../../current-system.md)
- [Current functional map](../../current-functional-map.md)
- [Product history digest](../../history/product-history-digest.md)
- [Hito DS IA and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Pre-start rendering polish spec](./2026-06-01-first-plan-calendar-pre-start-rendering-polish.md)

## Do Not Continue By Default

Do not reopen implementation from this completed spec without a concrete regression. New product
calendar behavior belongs to product calendar/runtime owners; new specimen rollout belongs to the
active Hito DS IA plan.

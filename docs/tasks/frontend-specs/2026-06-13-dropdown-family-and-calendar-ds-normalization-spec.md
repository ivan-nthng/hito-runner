# Hito Dropdown Family And Calendar DS Normalization Spec

## Status

closed

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

product

## Task

Preserve the closed dropdown/calendar normalization spec as subordinate history under the canonical
`/hitoDS` IA/specimen plan.

## Stage

DESIGN SYSTEM closeout / subordinate spec accepted under canonical `/hitoDS` IA pilot

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Preserve the dropdown/calendar normalization spec as subordinate history unless a fresh DS regression appears.

Stage:
PRODUCT closure guard / subordinate Hito DS spec.

Context:
This section-specific spec is closed as subordinate history. Dropdown family and calendar specimen coverage were absorbed by the canonical Hito DS IA/specimen plan and QA-passed pilot work. Do not route new implementation from this older spec unless source proof shows a fresh regression not owned by the canonical `/hitoDS` IA plan.
```

## Owner

Design System

## Last Updated

2026-06-22

## Compression Note

This file was compressed in Slice D23. The original source audit, long handoff blocks, and slice
implementation detail were reduced because the work is accepted and now subordinate to the canonical
Hito DS IA/specimen plan.

Canonical current owners:

- [Hito DS IA plan](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md>)
- [current-product.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md>)
- [current-system.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md>)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1)
- [dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx:1)
- [select.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/select.tsx:1)
- [hito-calendar-day.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx:1)
- [calendar-workout-playground.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/calendar-workout-playground.tsx:1)

## Final Outcome

Accepted under the canonical `/hitoDS` IA rollout:

- `/hitoDS#dropdowns` documents the canonical dropdown/list-item family.
- The dropdown surface includes interactive demo and anatomy/variant coverage.
- Real `DropdownMenu` behavior is present, including selected, destructive, disabled, submenu, footer, and richer row anatomies.
- The local `375px` overflow issue in the dropdown section was closed.
- `/hitoDS#calendar-workout-playground` became the product-aligned day/workout-row specimen inside the shared workbench.
- Calendar specimen ownership now points to `HitoCalendarDayCell`, `HitoWorkoutDayRow`, and the canonical IA plan rather than to this older section-level spec.

## Durable Decisions

- Do not create a new dropdown framework. `DropdownMenu`, `Select`, and Hito menu classes remain the shared infrastructure.
- Dropdown rows may use proven anatomies: label-only, icon + label, description, trailing meta, selected, destructive, disabled, and submenu trigger.
- The real product calendar remains behavior truth. `/hitoDS` documents presentational states only and must not imply CRUD, recurrence, backend mutation, or persistence ownership.
- The old workout-library/fake-calendar direction must not compete with the accepted calendar-workout playground as the canonical DS owner.
- Future dropdown/calendar follow-up should route from the active Hito DS IA plan or current source proof, not from this closed spec.

## Preserved Validation Evidence

Accepted proof existed for:

- `/hitoDS#dropdowns` with canonical row variants and real dropdown opening;
- matching dropdown family coverage on `/hitoDS/export/figma`;
- `/hitoDS#calendar-workout-playground` as the accepted calendar/workout specimen;
- desktop and `375px` overflow closure in the accepted DS rollout;
- no product runtime, backend, manual-plan behavior, persistence, Supabase, auth, or OpenAI changes.

## Boundary

This spec is closed as subordinate context. Keep it compact and historical. Reopen only if a fresh
dropdown/calendar DS regression appears and the canonical Hito DS IA plan does not already own it.

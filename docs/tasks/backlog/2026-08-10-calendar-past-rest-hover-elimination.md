# Calendar Past-Rest Hover Elimination

## Work Item ID

2026-08-10-calendar-past-rest-hover-elimination

## Status

backlog

## Type

bug

## Priority

high

## Owner

frontend

## Frontend Lane

Product

## Scope

Calendar day presentation eligibility

## Archive Intent

retain_in_place

## Task

After the shared calendar hover contract is complete, make a past Rest day with no activity visually
passive in the Product Calendar. It must not show hover chrome, while current/future actionable Rest
days and existing workout navigation remain intact.

## User Report

When a day has passed and it was Rest, nothing happened there; it must have no hover state.

## Evidence

[Calendar.tsx](/Users/ivan/Developer/hito-running/src/components/Calendar.tsx:557) passes
`interactive` to its day surface unconditionally for the ordinary linked-day path, including a past
Rest presentation. The linked shared DS item separately repairs the mobile primitive so it honors
that input consistently.

## Observed Behavior

A past Rest day is rendered as an interactive calendar surface, although it has no manual action or
result to perform. The resulting hover chrome suggests an affordance that does not exist.

## Expected Behavior

Past Rest day: no hover chrome. Current/future Rest day that can add or accept an allowed action:
its deliberate affordance remains. Workout links, accessibility/focus behavior where navigation is
available, today styling, move states, and mobile/desktop containment remain unchanged unless the
source proof requires a more precise presentation distinction.

## Demonstrated Cause

The Product Calendar adapter does not distinguish visual interactivity of a passive past Rest day
from its generic linked-day wrapper.

## Dependencies

- [Hito DS Calendar Hover Contract](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-10-hito-ds-calendar-hover-contract.md)
  must be completed first.
- The active Frontend DevTools Inspector task must finish before this task is dispatched to the same
  Frontend role.

## What Not To Touch

- Shared DS primitive/CSS before its owner completes the dependency.
- Active-plan eligibility, backend capabilities, persistence, calendar date truth, manual
  authoring/copy/move behavior, Inspector, or unrelated routes.

## Validation Expectations

- Same Calendar fixture in desktop and exact 375px: past Rest has no hover chrome.
- Current/future allowed Rest action and workout navigation/focus remain usable.
- No horizontal overflow, unintended date-action loss, or new persistent border/flicker.

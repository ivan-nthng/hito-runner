# Hito Calendar Day Hover State Consolidation

Work Item ID: `2026-08-15-hito-calendar-day-hover-state-consolidation`
Status: backlog
Type: Bug
Priority: high
Owner: PRODUCT
Scope: Visual hover/focus state composition for Product Calendar month and week day cells only.
Preserve all existing Calendar mechanics, including navigation, Add, Move, Undo, Copy, menus, drag
eligibility, results, and feedback links.
Archive Intent: Retain through the shared Day contract, Product adoption, and focused visual/browser
acceptance; compact to the root cause and repaired state model on terminal closeout.
Supersedes: [Calendar Past-Rest Hover Elimination](./2026-08-10-calendar-past-rest-hover-elimination.md)

## User Report

The month-day and week-day hover states feel wrong and visually layered. Ivan asked to simplify the
state logic without changing Calendar mechanics or removing valid actions.

## Source Investigation

- `src/components/Calendar.tsx` wraps ordinary workout cells in both `group/manual-day` and a linked
  generic `group`, then independently reveals the source-action menu through
  `group-hover/manual-day`.
- `src/components/ui/hito-calendar-day.tsx` independently applies direct `hover:outline`, generic
  `group-hover:outline`, `group-focus-visible:outline`, and separate named-group visibility rules.
  Its `DateSlotContent` also hides the day/weekday and replaces it with the slot action through both
  the primitive and Product wrapper groups.
- `src/styles/calendar-state-surfaces.css` has an additional broad `button:hover`, `a:hover`, and
  `[data-hito-calendar-day-cell]:hover` action-visual treatment.

These are three concurrent visual-state owners. They prove the layering risk but do not yet prove
which visible combination is the first incorrect state; that needs a focused fresh browser replay
across the enumerated day conditions before production code changes.

## Required Outcome

Define and adopt one stable visual precedence for a Calendar day:

1. semantic/base state (workout, empty, Rest, outside month, muted);
2. persistent state (today, selected, move source/target, pending, undo);
3. keyboard focus-visible state;
4. one hover treatment only when the day has an actionable navigation or allowed action; and
5. one disclosure owner for the more-actions or Move affordance.

Past passive Rest must remain quiet. Hover must not change cell geometry, obscure the day/weekday
without an equivalent clear action, flicker when moving between child controls, or make a disabled
mechanic look enabled.

## Delivery Sequence

1. **DESIGN SYSTEM** establishes the canonical Calendar Day hover/focus/disclosure contract in the
   shared primitive and canonical CSS. Reuse the existing `interactive`, `slotAction`, and
   `data-hito-calendar-day-cell` seams; remove a demonstrably redundant visual-state path instead
   of adding another prop, token, wrapper, or compatibility class.
2. **FRONTEND Product** adopts that contract in `CalendarDaySlot` and preserves the current route
   interaction composition. It must not alter persistence, drag events, Move actions, or source
   capability policy.
3. **QA** independently replays the resulting contract in Calendar month/week/mobile layouts.

## Required Visual Matrix

- empty day; past passive Rest; current/future actionable Rest; ordinary workout; outside-month;
  today; selected; move source; allowed move target; pending; undo; feedback marker; and a day with
  the source-action menu;
- month and week desktop layouts, plus the mobile row preservation boundary;
- pointer hover, keyboard focus-visible, child-menu focus, Escape/cancel, navigation, no reflow,
  no horizontal overflow, and console health in Light/Dark.

## Boundaries

- No new Calendar state machine, event handler, drag/touch framework, persistence path, token,
  primitive family, fixture, or CSS recipe.
- Do not change the established Move/Undo, AI/manual/imported workout, Rest/FIT, or no-plan source
  boundary. Return any nonvisual Product/Backend cause to PRODUCT.
- Do not use a screenshot as proof of a persistence or capability cause.

## Completion Criteria

- A fresh browser replay identifies the formerly competing visible states and demonstrates one
  stable visual owner after the repair.
- Each required matrix cell keeps the correct semantic, persistent, focus, hover, and disclosure
  precedence without changing the underlying action availability.
- Focused source checks, relevant Design System/Product validation, browser matrix, and independent
  QA pass. Global QA, release, and real-iPad acceptance remain separate gates.

## Next Action

PRODUCT must dispatch the bounded DESIGN SYSTEM visual-contract slice first, followed by a separate
FRONTEND Product adoption slice only if source review confirms the route wrapper still needs change.

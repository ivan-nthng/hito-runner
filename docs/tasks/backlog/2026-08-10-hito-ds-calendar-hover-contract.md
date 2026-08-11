# Hito DS Calendar Hover Contract

## Work Item ID

2026-08-10-hito-ds-calendar-hover-contract

## Status

completed

## Type

bug

## Priority

high

## Owner

design_system

## Scope

shared Hito calendar day primitives and canonical calendar state CSS

## Archive Intent

retain_in_place

## Task

Make the existing `interactive` presentation contract consistently control calendar hover chrome:
non-interactive day cells/rows must remain visually quiet, while interactive states retain a clear,
stable hover and keyboard-focus distinction.

## User Report

Calendar hover shows a white border that appears and disappears. A past Rest day with no activity
must have no hover state at all.

## Evidence

- [hito-calendar-day.tsx](/Users/ivan/Developer/hito-running/src/components/ui/hito-calendar-day.tsx:115)
  conditions desktop hover outline on `interactive`.
- [calendar-state-surfaces.css](/Users/ivan/Developer/hito-running/src/styles/calendar-state-surfaces.css:174)
  applies `.hito-calendar-mobile-row:hover` to every mobile row, regardless of the same
  `interactive` prop.

## Observed Behavior

The same shared calendar presentation contract produces different hover eligibility across desktop
and mobile. This makes a passive day visually promise an action and contributes to unstable-looking
border changes as pointer/focus moves among nested surfaces.

## Expected Behavior

The shared primitive has one stable visual rule: hover is shown only for a day explicitly marked
interactive; keyboard focus remains accessible and visually distinct. Passive Rest, empty, outside,
and read-only specimen states remain quiet unless their consumer deliberately marks them actionable.

## Demonstrated Cause

The mobile CSS selector has no `interactive` gate, whereas the component already exposes that prop
and desktop uses it. The inconsistent shared contract is the first incorrect owner for the
cross-viewport hover behavior.

## What Not To Touch

- Calendar date/plan eligibility, links, route behavior, persistence, manual copy/move/add rules,
  workout/result truth, or user data.
- Product-specific decision about exactly which Calendar dates are actionable; that follow-up belongs
  to the linked Frontend Product item.

## Validation Expectations

- `/hitoDS` desktop and exact 375px proof for interactive versus passive day cell/row hover and
  focus-visible state.
- No resting perimeter or flicker-like overlapping hover treatment; no loss of keyboard focus cue.
- Focused Product Calendar regression only to prove the shared rendering contract, without changing
  product policy.

## Follow-up Dependency

[Calendar past-Rest hover elimination](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-10-calendar-past-rest-hover-elimination.md)
consumes this completed shared contract to mark past Rest days non-interactive in the Product
Calendar adapter.

## Result

- The existing `interactive` prop remains the public presentation contract. Both shared day
  renderers now expose it as `data-interactive="true"`, and mobile hover CSS targets only that
  state.
- `/hitoDS` now exposes an explicit Interactive/Passive presentation control, allowing the same
  non-muted Rest specimen to prove both contracts without inventing Product date eligibility.
- Focused browser proof passed for interactive/passive Rest hover and interactive keyboard focus on
  desktop and exact 375px mobile. One Product Calendar render passed at both viewports and consumes
  the same shared markers.
- The targeted Hito DS validator, Prettier, diff whitespace check, and focused `npx vite build`
  passed. The full managed `npm run build` postbuild integrity step remains blocked by an unrelated
  missing private Admin snapshot marker; the browser proof used the successfully compiled local
  Nitro preview and does not claim repository-wide build or Global QA acceptance.
- Product Calendar eligibility, including the linked past-Rest decision, remains unchanged and
  belongs to the Frontend follow-up item.

## Assignment Prompt (Consumed)

```text
ROLE: DESIGN SYSTEM

Mode: Lite

Task: Make the existing Hito calendar `interactive` presentation contract consistently govern hover
chrome across the shared desktop day cell and mobile workout-day row.

Canonical work item:
docs/tasks/backlog/2026-08-10-hito-ds-calendar-hover-contract.md

Evidence:
- Desktop calendar-day presentation already gates hover outline on `interactive`.
- The shared mobile `.hito-calendar-mobile-row:hover` CSS applies to every row and ignores that
  contract, producing passive-day hover chrome.

Outcome:
Passive day presentations stay quiet; interactive day presentations have one stable hover treatment
and a distinct accessible focus-visible cue across desktop and exact 375px mobile. Preserve the
public component API where possible and do not invent product-date eligibility inside the primitive.

Boundary:
Do not change Calendar routes, active-plan/workout eligibility, persistence, copy/move/add behavior,
or the separate Frontend decision that marks past Rest days non-interactive. Do not touch hosted
systems, stage, commit, push, deploy, or modify unrelated work.

Focused proof:
Verify the shared `/hitoDS` interactive/passive cell and row states plus one Product Calendar
consumer render in desktop and 375px. Promote to Tracked only if a shared component API or another
owner is required. Update this Lite item truthfully and report the focused result; do not claim
Global QA.

Approval policy:
Routine local source work, local visual proof, lifecycle updates, and safe bounded independent
review when useful are authorized. Do not access hosted/production systems or take publishing or
irreversible actions.
```

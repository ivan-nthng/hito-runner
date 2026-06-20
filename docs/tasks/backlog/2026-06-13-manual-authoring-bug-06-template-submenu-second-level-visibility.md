# Bug 06: Choose Template Second-Level Menu Is Not Visible

## Status

backlog

## Type

bug

## Priority

high

## Next Recommended Role

frontend

## Task

Fix the saved-calendar `Choose template` second-level submenu so the template list is fully visible
and usable.

## Stage

FRONTEND implementation / template submenu second-level visibility.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Fix the saved-calendar `Add activity -> Choose template` submenu so the second-level template list
is fully visible and usable in the real calendar surface.

Stage:
FRONTEND implementation / template submenu second-level visibility.

Context:
The top-level `Choose template` row is visible, but the second menu is effectively not visible to
the runner. This now reads as a separate bug from the earlier no-op selection regression: the menu
anatomy itself is failing in the live saved-calendar surface. Keep the submenu interaction pattern
if it can be made honest and visible; do not fall back to a random modal unless the existing DS
contract truly cannot support this surface.
```

## Severity

high

## Owner

FRONTEND

## Reported

2026-06-13

## User Report

In the saved manual calendar, the second-level menu under `Choose template` is not visible. The
runner sees the first-level row and chevron, but the actual template choices are effectively hidden.

## Evidence

- Screenshot:
  [template-submenu-second-level-hidden.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-13-manual-authoring-bug-06-template-submenu-second-level-visibility/template-submenu-second-level-hidden.png)

## Observed Behavior

- The top-level add menu opens.
- `Choose template` appears as a submenu trigger.
- The second-level menu is not visible in a usable way on the live calendar surface.
- This makes the template path feel broken even before template selection logic is exercised.

## Expected Behavior

- Opening `Choose template` should show a clearly visible second-level menu with actual template
  choices.
- The submenu should stay inside the viewport and read like the same Hito dropdown family.
- The runner should not have to guess whether a hidden offscreen panel exists.

## Source Investigation

- The saved-calendar add menu and submenu wiring live in
  [ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx),
  including `DropdownMenuSub`, `DropdownMenuSubTrigger`, and `DropdownMenuSubContent`.
- The shared dropdown primitive lives in
  [dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx).
- This appears distinct from the earlier non-rest template selection no-op bug: here the immediate
  visible failure is the submenu anatomy/placement itself.

## Likely Root Cause

Frontend submenu placement, portal, overflow, or sizing behavior is not fitting the saved-calendar
surface, so the second-level template panel is clipped, offscreen, or visually lost.

## Recommended Fix Direction

- Reuse the existing Hito dropdown family and fix submenu visibility honestly in the live surface.
- Audit `DropdownMenuSubContent` placement, portal behavior, side/align/collision handling, and
  any parent overflow/clipping boundary in the calendar/add-menu surface.
- Keep menu row sizing readable and aligned with the Hito dropdown family already documented in
  `/hitoDS`.

## What Not To Touch

- backend template taxonomy
- manual constructor save/review contract
- direct copy/paste or move mutation semantics
- onboarding manual setup flow

## Validation Expectations

- `Add activity -> Choose template` opens a visible second-level template list
- the submenu remains usable near viewport edges
- `Add rest day` and `Start from scratch` still work
- the earlier non-rest template open-constructor fix does not regress once the submenu is visible

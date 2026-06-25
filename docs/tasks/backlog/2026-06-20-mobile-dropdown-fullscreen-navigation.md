# Mobile Dropdown Full-Screen Navigation On Narrow Screens

## Status

completed

## Type

change_request

## Priority

high

## Next Recommended Role

frontend

## Task

Preserve the completed mobile fullscreen dropdown rollout as accepted Hito DS interaction history.

## Stage

FRONTEND implementation closeout / mobile dropdown-to-workflow-dialog rollout completed.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Use this completed backlog item only as historical context if a fresh mobile dropdown or picker
regression appears.

Stage:
FRONTEND regression fix / completed mobile dropdown escalation guard.

Context:
This item is complete. Current rule: short action/utility menus stay anchored; long, grouped, or
nested mobile picker flows escalate to the existing Hito workflow-dialog seam. Do not reopen this
item unless source or QA proof shows a fresh unconverted long/grouped/nested mobile picker.
```

## Historical Outcome

The top-level mobile fullscreen dropdown rollout is closed as a service-level frontend/DS interaction
cleanup. The accepted behavior now lives in product source and `/hitoDS#dropdowns`:

- manual calendar `Add activity -> Choose template` uses a mobile workflow dialog while desktop keeps
  the anchored template submenu;
- manual workout constructor `Add piece` uses a mobile workflow dialog while desktop keeps the
  anchored add-piece menu;
- manual workout constructor `Piece type` uses a mobile workflow dialog while desktop keeps the
  select;
- manual workout constructor scratch `Workout type` uses a mobile workflow dialog while desktop
  keeps the select;
- `/hitoDS#dropdowns` documents the rule and shows the workflow-dialog anatomy.

## Accepted Behavior

- Short action, utility, table, shell, account, export, row-action, workout-overflow, admin metadata,
  native body-note, and sandbox menus remain anchored or stay in their separate component-adoption
  lanes.
- Long, grouped, or nested mobile picker flows use the existing Hito workflow-dialog seam:
  `Dialog`, `hito-product-dialog`, `hito-dialog-size-workflow`,
  `hito-dialog-height-workflow`, `hito-product-dialog-body-scroll-fill`, `hito-row-group`,
  `hito-list-row`, and existing Hito buttons/icons/status markers.
- The rollout does not change backend review/confirm, persistence, auth, manual workout semantics,
  template taxonomy, or constructor draft behavior.

## Source Proof

Final frontend source inventory on 2026-06-24 found no remaining true long/grouped/nested runtime
mobile picker that still needs conversion in this closure batch. Remaining `DropdownMenuContent`,
`DropdownMenuSubContent`, `SelectContent`, and native `select` usages in the inspected runtime
surfaces are either already escalated on mobile, desktop-only picker controls, short utility/action
menus, admin/table metadata menus, or separate-lane native select exceptions.

## Severity

high

## Owner

FRONTEND

## Reported

2026-06-20

## User Report

On mobile, dropdowns should not stay cramped inside a tiny anchored menu when the content does not
fit. Product wants a full-screen mobile pattern:

- menu opens with a title in the header
- close button stays in the top-right corner
- second-level navigation shows a back arrow in the header
- the close button remains available on deeper levels too

This should first cover the manual calendar `Add activity -> Choose template` flow, where the
current menu visibly does not fit.

## Evidence

- Screenshot:
  [mobile-dropdown-overflow-screenshot.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-20-mobile-dropdown-fullscreen-navigation/mobile-dropdown-overflow-screenshot.png)
- Related product/mobile contract already exists in:
  [manual user-built plan flow spec](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md)
  under `day_action_sheet_open`, `template_picker_sheet`, and other mobile state inventory items.

## Observed Behavior

- The current anchored dropdown/submenu remains near the trigger on mobile.
- Nested content competes with the calendar and viewport edge.
- The menu feels clipped/cramped instead of becoming a readable mobile navigation surface.
- The current interaction does not provide an explicit mobile header with back/close ownership.

## Expected Behavior

- On narrow mobile screens, long or nested menu flows can switch into a full-screen menu/sheet.
- The surface has one canonical Hito header with title and close.
- Second-level navigation uses a back affordance in the same header while keeping close available.
- The menu stays readable, actions remain reachable, and the layout does not overflow horizontally.

## Source Investigation

- Existing dropdown primitives live in
  [dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx).
- Existing sheet/mobile overlay primitives live in
  [sheet.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/sheet.tsx).
- The current manual add/template interaction lives in
  [ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx).
- Product mobile state inventory already anticipates sheet-based narrow-screen flows in
  [2026-06-10-manual-user-built-plan-flow-spec.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md).
- Modal/sheet consistency guidance already exists in
  [2026-06-13-modal-and-sheet-consistency-spec.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-13-modal-and-sheet-consistency-spec.md).

## Likely Root Cause

The current shared dropdown family is honest for anchored desktop menus, but does not yet define a
canonical mobile escalation path for long or nested menu flows that need more space and explicit
navigation controls.

## Recommended Fix Direction

- Keep one Hito-owned menu family.
- On mobile narrow widths, escalate unsuitable nested/long dropdown flows into a full-screen
  sheet-like navigation surface rather than forcing them to remain anchored.
- Reuse existing Hito sheet/dialog overlay and header contracts.
- Prove the pattern first on manual `Add activity -> Choose template`, then reuse it elsewhere.

## What Not To Touch

- backend Add/template/constructor semantics
- manual workout persistence/review logic
- desktop dropdown behavior unless required by shared primitive reuse
- unrelated calendar layout or workout-detail behavior
- a brand-new unrelated mobile menu framework

## Validation Expectations

- product path at `375px` uses a readable full-screen mobile menu/sheet for the affected flow
- top-level header shows title + close
- second-level navigation shows back + close
- no horizontal overflow or clipped second-level content
- desktop dropdown behavior does not regress
- implementation reuses Hito dropdown/sheet primitives instead of a one-off route-local mobile menu

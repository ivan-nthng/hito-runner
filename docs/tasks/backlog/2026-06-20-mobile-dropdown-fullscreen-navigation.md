# Mobile Dropdown Full-Screen Navigation On Narrow Screens

## Status

backlog

## Type

change_request

## Priority

high

## Next Recommended Role

frontend

## Task

Define and implement a mobile full-screen dropdown/navigation pattern for long or nested menu flows.

## Stage

FRONTEND design-system implementation / mobile dropdown-to-fullscreen navigation contract.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Introduce a mobile full-screen navigation pattern for dropdown flows that do not fit honestly inside near-trigger menu chrome.

Stage:
FRONTEND implementation / mobile dropdown fullscreen navigation contract.

Context:
On narrow mobile screens, the current dropdown/submenu pattern can overflow, clip, or become hard to navigate. Product direction for future work is explicit:
- when a long or nested dropdown opens on mobile, it should be able to switch into a full-screen menu/sheet surface
- the mobile surface should have a header with the current menu title
- the header should always keep a close button on the right
- when the runner enters a second level, the header should show a back affordance on the left and keep the close button on the right
- this should feel like one Hito DS-owned mobile navigation/menu pattern, not a one-off manual-authoring patch

Root cause and architecture fit:
- Visible symptom: nested/long dropdown content does not fit honestly on narrow mobile screens.
- Underlying cause: the current dropdown family is optimized for near-trigger anchored menus, but some product flows need a mobile-specific full-screen navigation treatment.
- Canonical owner: frontend shared DS interaction layer for dropdown/menu/sheet behavior, reusing existing Hito dialog/sheet/dropdown primitives before introducing anything new.

Required reading:
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/AGENTS.md
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/agents/frontend.agent.md
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/skills/hito-frontend-design-system/SKILL.md
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-20-mobile-dropdown-fullscreen-navigation.md
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-13-modal-and-sheet-consistency-spec.md
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/sheet.tsx
- /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx

Scope:
1. Define when a mobile dropdown/submenu must remain anchored and when it must switch to a full-screen surface.
2. Reuse existing Hito sheet/dialog/dropdown primitives and DS header/close patterns.
3. Support:
   - top-level mobile menu title
   - close button in header
   - second-level back button in header
   - second-level close button still present
4. Prove the pattern first on the manual calendar `Add activity -> Choose template` flow.
5. Keep the solution reusable for other cramped nested mobile dropdowns later.

Do not:
- Do not invent a second unrelated mobile menu system.
- Do not broaden into desktop dropdown redesign.
- Do not change backend add/template/constructor semantics.
- Do not weaken existing Hito dialog/sheet overlay contracts.

Validation:
- targeted ESLint for touched dropdown/sheet/manual-authoring files
- `npm run build`
- scoped `git diff --check`
- browser proof at exact `375px`
- prove top-level open, second-level navigation, back, and close behavior
- prove no horizontal overflow and reachable actions
```

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

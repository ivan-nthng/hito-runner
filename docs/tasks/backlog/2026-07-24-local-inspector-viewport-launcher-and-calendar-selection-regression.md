# Local Inspector Viewport Launcher And Calendar Selection Regression

## Work Item ID

2026-07-24-local-inspector-viewport-launcher-and-calendar-selection-regression

## Status

completed

## Type

bug

## Priority

high

## Owner

frontend

## Scope

local-devtools-inspector

## Archive Intent

retain_in_place

## Frontend Lane

devtools

## Task

Restore independent viewport launcher behavior and reliable calendar-cell selection in the local-only Inspector.

## Stage

FRONTEND implementation and integrated QA complete.

## Root Cause

The DevTools portal and target-selection boundary had to remain owned by the Inspector itself. Product
dialogs and calendar cells must not adopt Inspector-specific behavior.

## Accepted Result

- The Inspector root is portal-mounted in `document.body`, so its fixed launcher remains independent
  of an active product dialog and stays at the viewport lower-right corner.
- Desktop and exact `375px` browser evidence confirms that Inspector selection and layered Escape do
  not dismiss the product dialog or activate its controls.
- Nested calendar-cell content resolves to the intended leaf target; normal calendar interaction
  remains available after Inspector exit.
- The Inspector remains loopback-only and lazy. A non-loopback `lvh.me` browser check observed no
  Inspector root, launcher, or loaded DevTools assets.

## Preserved Boundaries

- DevTools is loopback-only, local-only, non-persistent, and cannot mutate product or Admin truth.
- Do not alter runner calendar behavior to accommodate the Inspector.
- Reuse the existing DevTools runtime, session, target, and Hito DS overlay owners.

## Evidence

- [Independent DevTools proof](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-07-24/local-inspector-independent-devtool/proof.json)
- [Non-interference QA proof](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-07-24/local-inspector-non-interference-qa/proof.json)

Implementation DoD: Passed. Global QA Acceptance remains a separate release-level gate.

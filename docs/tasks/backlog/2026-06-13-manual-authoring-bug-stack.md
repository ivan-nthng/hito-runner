# Manual Authoring Bug Stack

## Status

in_progress

## Type

bug

## Priority

medium

## Next Recommended Role

product

## Task

Continue maintaining the numbered manual authoring bug stack when new screenshot-backed bugs are
reported.

## Stage

PRODUCT backlog intake / manual authoring bug stack maintenance.

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Continue maintaining the numbered manual authoring bug stack when new screenshot-backed bugs are
reported.

Stage:
PRODUCT backlog intake / manual authoring bug stack maintenance.

Context:
Manual authoring bugs must no longer live only in chat. Each new bug should be captured as its own
backlog file under docs/tasks/backlog, linked from the numbered stack, with screenshot evidence,
likely owner, validation expectations, and one exact next-role prompt.
```

## Severity

high

## Owner

PRODUCT

## Reported

2026-06-13

## User Report

The user wants screenshot-backed manual authoring bugs captured as separate numbered backlog items
instead of being lost in chat. New bugs should be turned into explicit tasks with evidence and a
next owner.

## Evidence

- Chat reports and screenshots from 2026-06-12 through 2026-06-13.

## Observed Behavior

Manual authoring bugs have been reported across several turns, but without a numbered backlog stack
they are easy to forget or blur together.

## Expected Behavior

Each bug should have:

- its own backlog file
- date and number
- screenshot or QA evidence
- likely owner
- exact next-role prompt

## Source Investigation

- Existing backlog conventions already support one-file-per-item under `docs/tasks/backlog/`.
- The repo also supports permanent screenshot evidence under `docs/tasks/backlog/assets/`.
- Recent manual authoring work spans calendar empty-day UI, template flow, constructor UI, move,
  and copy/paste.

## Likely Root Cause

This is a workflow gap, not a product-runtime bug: screenshot-backed product feedback was being
handled live in chat and implementation threads, but not consistently persisted into a numbered bug
stack.

## Recommended Fix Direction

Use this tracker as the numbered index and keep each bug in its own backlog file.

## Numbered Items

1. [Bug 01: Saved-calendar template flow and constructor grammar cleanup](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-manual-authoring-bug-01-template-flow-and-constructor-grammar.md)
2. [Bug 02: Calendar move drag UX and move review raw error leak](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-manual-authoring-bug-02-calendar-move-drag-ux-and-review-error.md)
3. [Bug 03: Copy/paste review raw error leak](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-manual-authoring-bug-03-copy-paste-review-error.md)
4. [Bug 04: Non-rest template submenu selection closes without opening constructor](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-manual-authoring-bug-04-non-rest-template-selection-no-op.md) — closed, QA-passed 2026-06-15
5. [Bug 05: Protected source workout still exposes direct edit affordances](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-manual-authoring-bug-05-protected-source-direct-edit-affordance-leak.md) — closed, QA-passed 2026-06-15
6. [Bug 06: Choose template second-level menu is not visible](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-manual-authoring-bug-06-template-submenu-second-level-visibility.md)
7. [Bug 07: Clear blocked should use top toast, not a blocking dialog](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-manual-authoring-bug-07-clear-blocked-should-be-toast-not-dialog.md)
8. [Bug 08: Missed unlogged workout cannot be moved to today](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-14-manual-authoring-bug-08-missed-unlogged-workout-move-contract.md)
9. [Bug 09: Missed-unlogged move-to-today contract is still not exposed in the calendar UI](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-15-manual-authoring-bug-09-missed-move-target-not-exposed.md)
10. [Bug 10: Direct move shows success toast before the calendar visually reconciles](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-15-manual-authoring-bug-10-move-success-visual-lag.md)

## What Not To Touch

- Do not use this tracker as a substitute for the active manual authoring plan.
- Do not collapse separate bugs back into one broad implementation file.
- Do not delete screenshot evidence from backlog assets when it is part of the bug report.

## Validation Expectations

- Future manual authoring bug reports should be added here as new numbered entries.
- Each linked item should keep its own exact next-role prompt and evidence.

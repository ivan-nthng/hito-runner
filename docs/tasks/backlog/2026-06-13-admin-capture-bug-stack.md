# Admin Capture Bug Stack

## Work Item ID

2026-06-13-admin-capture-bug-stack

## Status

backlog

## Type

bug

## Priority

high

## Owner

product

## Scope

admin-work-items-capture-analytics

## Archive Intent

retain_in_place

## Task

Maintain the numbered admin capture bug stack for screenshot-backed `/admin/capture` issues.

## Stage

PRODUCT backlog index / no active intake or implementation gate selected.

## Historical Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Continue maintaining the numbered admin capture bug stack when new screenshot-backed `/admin/capture`
bugs are reported.

Stage:
PRODUCT backlog intake / admin capture bug stack maintenance.

Context:
Admin capture bugs must not be lost in chat. Each new bug should become its own backlog file under
docs/tasks/backlog, linked from this numbered stack, with screenshot evidence, likely owner,
validation expectations, and one exact next-role prompt.
```

## Severity

high

## Tracker Owner

PRODUCT

## Reported

2026-06-13

## User Report

The user wants screenshot-backed bugs captured as separate numbered backlog items so they do not get
lost across overlapping implementation and QA flows.

## Evidence

- Chat reports and screenshots from 2026-06-13 onward for `/admin/capture`.

## Observed Behavior

Admin capture issues can arrive in parallel with manual authoring, Hito DS, and importer/runtime
tracks. Without a dedicated numbered stack, those bugs are easy to blur together.

## Expected Behavior

Each admin-capture bug should have:

- its own backlog file
- date and number
- screenshot or QA evidence
- likely owner
- exact next-role prompt

## Source Investigation

- Existing backlog conventions already support one-file-per-item under `docs/tasks/backlog/`.
- The repo also supports permanent screenshot evidence under `docs/tasks/backlog/assets/`.
- Admin capture already has a separate active plan and should not be mixed into the manual authoring
  bug stack.

## Likely Root Cause

This is a workflow gap, not a product-runtime bug: screenshot-backed admin capture issues were being
handled live in chat without a dedicated numbered stack for that surface.

## Recommended Fix Direction

Use this tracker as the numbered admin-capture bug index and keep each admin bug in its own backlog
file.

## Numbered Items

1. [Bug 01: Add quick note dialog dismissal and reusable product-form dialog shell](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-13-admin-capture-bug-01-add-quick-note-dialog-dismissal-and-shell-reuse.md)

## What Not To Touch

- Do not use this tracker as a substitute for the active admin capture plan.
- Do not collapse admin capture bugs into the manual authoring bug stack.
- Do not delete screenshot evidence from backlog assets when it is part of the bug report.

## Validation Expectations

- Future `/admin/capture` bug reports should be added here as new numbered entries.
- Each linked item should keep its own exact next-role prompt and evidence.

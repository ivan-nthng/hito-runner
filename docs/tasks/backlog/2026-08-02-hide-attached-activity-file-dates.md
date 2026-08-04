# Hide Attached Activity File Dates

## Work Item ID

2026-08-02-hide-attached-activity-file-dates

## Status

completed

## Type

change_request

## Priority

medium

## Owner

frontend

## Scope

import-export-provider-evidence

## Archive Intent

archive_when_closed

## Frontend Lane

product

## Task

Remove redundant upload and activity-date copy from the attached activity-file readback while preserving stored activity date for comparison truth and future runner analytics.

## Stage

FRONTEND Product implementation and integrated QA completed 2026-08-02. Global QA remains a
separate release gate.

## Root-Cause Evidence

`AttachedActivityFileReadback` in `src/components/CompletionPanel.tsx` composes both `Added …` and
`Run date …` into attachment metadata. For a file explicitly attached to the workout being reviewed,
that provenance date is not useful runner-facing context and adds visual noise.

## Preserved Boundaries

- Do not remove `activityLocalDate`, upload timestamp, or other date fields from FIT parsing,
  persistence, comparisons, exports, evidence, or the future activity-profile foundation.
- Do not change Garmin upload/remove behavior, fixture behavior, comparison confidence, or the
  runner profile contract.
- This is display-copy cleanup only; the planned workout date and actual activity date remain
  available to deterministic mismatch logic where they are meaningful.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Remove redundant date metadata from the attached activity-file readback.

Stage:
FRONTEND Product implementation with integrated QA.

Frontend lane:
Product

Canonical task:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-08-02-hide-attached-activity-file-dates.md

Evidence:
The attached-file view in `CompletionPanel.tsx` currently renders both `Added …` and `Run date …` in
the metadata caption. The product decision is to remove this runner-facing date copy: attaching a file
to the workout already supplies the relevant context.

Required outcome:
Remove only redundant display metadata from the attached-file readback. Preserve `activityLocalDate`
and upload timestamps in canonical FIT parsing, persistence, deterministic comparison, evidence, and
future profile analytics. Reuse the existing view-model/readback seam; do not create a new display
path or change upload/remove behavior.

Definition of Done:
Desktop and exact 375px attached-file readback remains readable in light/dark, file type and filename
remain truthful, no date copy remains in that attachment surface, comparison date-mismatch semantics
remain source-covered, and existing fixture/real boundaries, keyboard/focus, overflow, lint, scoped
diff hygiene, and appropriate independent QA pass. Use a bounded QA subagent and fix same-owner
findings before reporting. Do not ask for routine approval, create a new chat, call a provider, mutate
hosted data, stage, commit, or push.
```

## Dispatch

Completed by the existing FRONTEND task with integrated browser QA. No provider calls, hosted
mutations, staging, commit, or push were performed.

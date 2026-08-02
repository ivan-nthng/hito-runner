# Activity File Dialog Mobile And Status Truthfulness Patch

## Work Item ID

2026-07-31-activity-file-dialog-mobile-status-patch

## Status

completed

## Type

bug

## Priority

high

## Owner

frontend

## Scope

import-export-provider-evidence

## Archive Intent

archive_when_closed

## Frontend Lane

product

## Batch

2026-07-31-activity-file-dialog-qa-p2

## Task

Fix the two confirmed Activity File Dialog fixture-readback defects: readable attached-file composition at exact 375px and truthful accessibility status after local preview clear.

## Stage

FRONTEND Product implementation with integrated independent QA and fix-forward closure.

## Root-Cause Evidence

- `QA-ACT-375-001`: `Clear local preview` shares a narrow mobile row with attached-file metadata in `CompletionPanel`, compressing ordinary text and filename information into a near-vertical column.
- `QA-ACT-LIVE-002`: after local preview clear removes comparison truth, the outer live region in `WorkoutActivityFileDialog` still announces that the preview is ready.

## Preserved Boundaries

- Keep fixture-only behavior local, gated, non-persisting, and provider-free.
- Do not change Garmin ingestion, API routes, deterministic comparison truth, real upload/remove lifecycle, signed plans, or shared Hito DS architecture without new evidence.
- Preserve the accepted historical mobile-collapse correction; do not add route-local width workarounds.
- Do not interrupt the independent ARCHITECT documentation audit or edit its work-item governance documents.

## Evidence

- [Pre-fix acceptance and defect proof](../../../qa-artifacts/screenshots/2026-07-31/activity-file-plan-vs-run-final-acceptance/proof.json)
- [Narrow-screen readability contract](../frontend-specs/2026-07-31-hito-ds-narrow-screen-readability-contract.md)

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Fix the confirmed Activity File Dialog mobile-composition and stale live-status defects.

Stage:
FRONTEND Product implementation with integrated QA and mandatory fix-forward closure.

Frontend lane:
Product

Canonical task:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-07-31-activity-file-dialog-mobile-status-patch.md

Demonstrated defects:
- QA-ACT-375-001: at exact 375px, attached-file metadata and `Clear local preview` occupy one narrow row and ordinary text collapses into a near-vertical column. The reported first owner is `CompletionPanel.tsx`.
- QA-ACT-LIVE-002: after clear removes the local comparison, an outer polite live region still says the preview is ready. The reported first owner is `WorkoutActivityFileDialog.tsx` orchestration.

Required outcome:
Trace the source and correct the first incorrect Product owner(s). At exact 375px, attached-file metadata must have a normal readable content width and actions must reflow truthfully without reducing ordinary prose to technical wrapping. After clear, both visual and assistive status must describe the empty state; no stale success/readiness announcement may survive. Reuse existing Hito DS layout, Button, disclosure, status, and dialog patterns rather than introducing a local component system.

Boundaries:
- Preserve fixture-only/non-persisting/provider-free behavior.
- Do not change Garmin parsing, upload/remove APIs, persistence, comparison semantics, plan lifecycle, shared DS architecture, or the accepted broad narrow-screen contract unless source evidence proves that boundary is incorrect.
- Do not edit work-item governance documents while the ARCHITECT audit is active.
- No new user-facing chat, staging, commit, push, provider call, hosted mutation, or approval request.

Autonomous completion:
Publish the required execution preflight, implement the smallest root-cause correction, then run and reuse a bounded independent QA subagent inside this same task. Fix every same-owner finding before returning. Do not report a user-facing intermediate Failed/Blocked verdict for a routine reproducible issue; keep working through the local fix-forward loop. Routine local inspection, fixture QA, browser control, cleanup, and validation are standing-authorized. Exhaust safe local browser paths before calling a capability unavailable.

Definition of Done:
- Both named defects have a before/after root-cause discriminator and regression proof.
- Exact 375x812 and desktop fixture-ready, clear, close, and reopen flows remain readable and truthful in light/dark.
- Keyboard/focus, normal versus technical wrapping, responsive bounds, overflow, live/alert semantics, fixture isolation, console/runtime ledger, cleanup, targeted lint/format, build/integrity, and scoped diff hygiene pass as applicable.
- The independent QA subagent’s full inventory is integrated and any same-owner finding is fixed before final report.
- Return one final report with Check | Scenario / environment | Result | Evidence and a truthful Implementation DoD. Global QA remains a separate gate.
```

## Dispatch

Sent to the existing FRONTEND task after confirming it was idle. It owns implementation and its QA subagent loop; the user is not a relay between them.

## Closure

The FRONTEND owner completed the local fixture replay in Safari after the initial bridge could not
accept `window.confirm`: native Clear produced the truthful empty state and cleared the outer ready
announcement; close, reopen, Escape, and focus return all remained intact. The bounded independent QA
subagent separately rechecked the source and static contract. This closes the Product owner slice only;
Global QA remains a separate gate.

## Release Reconciliation Receipt

The 2026-08-01 bounded post-fix QA replay passed desktop and exact `375x812` ready, clear, close,
reopen, focus-return, overflow, fixture-isolation, cleanup, console, and runtime-health checks. It
made no source or QA-artifact changes. This receipt closes the two defects above; it is not a
release-wide Global QA claim.

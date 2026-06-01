# Malformed Date/Time Negative-Path Browser QA Hygiene

## Status

backlog

## Type

qa

## Priority

low

## Next Recommended Role

QA

## Task

Validate malformed date/time negative paths for structured first-plan onboarding.

## Stage

QA hygiene / browser negative-path validation

## User Report

During the completed first-plan date/time input and submit-boundary work, QA proved valid
long-horizon date/time submission paths but did not complete a full browser proof for malformed
date/time negative paths.

## Evidence

- Archived production blueprint plan:
  `docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md`
- Completed Date Picker spec:
  `docs/tasks/frontend-specs/2026-05-30-hito-ds-date-picker-correction.md`
- Routine QA screenshots are under `qa-artifacts/` and are not committed by default.

## Observed Behavior

Valid date/time paths are QA-passed. Malformed date/time negative-path browser behavior remains
optional hygiene, not a release blocker.

## Expected Behavior

Malformed date or target-time input should stay local/safe:

- show bounded validation feedback
- avoid stuck loading states
- avoid calling plan generation with invalid setup truth
- preserve user-entered correction context where practical
- create no plan before explicit valid review/confirm

## Source Investigation

Known relevant surfaces:

- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/ui/hito-date-time-input.tsx`
- `src/components/ui/hito-date-time-utils.ts`
- `src/lib/first-plan-actions.ts`

## Likely Root Cause

This is not a confirmed product bug. It is residual QA coverage from the first-plan date/time and
submit-boundary release work.

## Exact Handoff Prompt

```text
ROLE: QA

TASK:
Validate malformed date/time negative paths for structured first-plan onboarding.

STAGE:
QA hygiene / browser negative-path validation

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-01-malformed-date-time-negative-path-browser-qa-hygiene.md
- This is optional QA hygiene, not a release blocker.
- Valid Hito DS date/time input and long-horizon submit paths are already QA-passed.

SCOPE:
- Use the built-in Codex browser first when it can cover the flow.
- Test malformed plan start date, malformed target date, malformed target time, and correction back to valid values.
- Verify no stuck loading state.
- Verify no plan/profile/workout/log mutation occurs before valid review/confirm.
- Capture screenshots under `qa-artifacts/screenshots/YYYY-MM-DD/malformed-date-time-negative-path-qa/`.

CONSTRAINTS:
- Do not edit product code.
- Do not run migrations.
- Do not mutate production data.
- Use only disposable local/test accounts if authentication is needed.

OUTPUT:
1. Task
2. Stage
3. Browser Path Preflight
4. Scope tested
5. Results
6. Screenshot/artifact evidence
7. Issues found
8. Verdict
9. Blockers
```

## Blockers

None.

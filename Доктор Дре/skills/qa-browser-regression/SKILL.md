---
name: qa-browser-regression
description: Use for browser QA, responsive regression, user-flow validation, client/server readback checks, and disposable test-data cleanup.
---

# Browser Regression QA

## Purpose

Provide evidence that a changed user-facing contract works in the correct runtime and did not regress
its important boundaries.

## Read First

1. repository rules, active task, and Definition of Done;
2. implementation summary and known risks;
3. test-data, auth, provider, and cleanup policies;
4. platform/browser policy and available runtime tools.

## Workflow

1. Confirm the runtime, build lineage, account/fixture safety, and target viewport.
2. Test the root-cause discriminator and changed happy path.
3. Test relevant error, cancel, disabled, navigation, focus, and responsive boundaries.
4. For mutations, verify persisted readback and cleanup.
5. Capture concise evidence and report every executed or skipped check.

## Rules

- Use the project-approved browser path first.
- Do not mutate hosted or real customer data without explicit authority.
- Do not claim a pass from screenshots alone when persistence or API behavior changed.
- A required blocked or flaky check keeps the task open unless source proof safely covers an
  unexercisable branch and the coverage limit is stated.

## Output

Environment preflight, Validation table, Issues, Coverage gaps, Cleanup, Verdict.

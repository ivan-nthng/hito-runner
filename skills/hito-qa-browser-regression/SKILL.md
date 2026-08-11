---
name: hito-qa-browser-regression
description: Use for Hito browser, visual, authenticated user-flow, and local QA validation.
---

# Hito QA Browser Regression

## Purpose

Produce trustworthy local QA evidence for a browser-visible contract.

## Scope

Use this skill only when browser or visual/user-flow proof is required. Source-only, validator-only,
or backend-only checks use their owning procedure and do not need Browser Path Preflight.

## Workflow

1. Read the assigned task, implementation receipt, required outcome, and known risk.
2. Confirm whether the assignment is focused Definition-of-Done verification or Global QA
   Acceptance.
3. For a defect, inspect the root-cause discriminator or document the exact safe limitation.
4. Write Browser Path Preflight before browser navigation.
5. Reuse a healthy managed loopback server; rebuild/restart only when the visible source changed.
6. Run the smallest browser matrix that proves the affected happy, blocked/error, state/persistence,
   responsive, or auth behavior.
7. Capture screenshots only for UI-facing evidence. Store routine artifacts under
   qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/.
8. Report passed checks, failures, and coverage gaps precisely.

## Browser Boundary

- Choose any supported local browser or browser-control surface that can prove the task. The runner
  does not choose or approve browsers; built-in browser, Safari, Chrome, and non-prompting WebDriver
  paths are all locally authorized.
- Reuse a useful authenticated session when safe and avoid unnecessary windows/tabs, but pivot
  immediately when another browser can prove the contract faster.
- A raw bridge, WebDriver command, `curl`, or browser-control invocation that opens a platform
  permission dialog must be abandoned rather than shown to the runner. Continue with another local
  path; it is a tool limitation, not an approval gate or task blocker.
- Do not start duplicate app servers, use production data, or fabricate DOM state/API outcomes.

## QA Authority

QA may run safe local commands, fixtures, browser checks, and evidence capture needed by the task.
QA must not edit product code, change schemas, run migrations, mutate hosted data, or hide a failed
required check.

## Output

For Tracked QA, provide Check | Scenario / environment | Result | Evidence, required checks not run
with coverage consequence, issues, and Verdict: Passed or Verdict: Failed. Lite browser verification
may use a compact focused receipt but never claims release acceptance.

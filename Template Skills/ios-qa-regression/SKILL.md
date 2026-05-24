---
name: ios-qa-regression
description: Use for native iOS QA, iPhone/iPad Simulator validation, device smoke testing, Xcode test verification, and regression checks for iOS app flows.
---

# iOS QA Regression

## Purpose

Verify native iOS behavior with platform-appropriate evidence.

## Platform Policy

- Prefer iPhone Simulator for routine native iOS QA when available.
- Use a real device when the feature depends on hardware, sensors, camera, health data, notifications, widgets, background behavior, Bluetooth, or watch/device integration.
- Use Xcode unit/UI tests when the project has them and the slice can be covered by tests.
- Do not use Safari as the primary validation surface for native iOS app behavior.
- If iOS Simulator or device testing is unavailable, state the blocker and source-verify what can be verified safely.

## Workflow

1. Read the canonical architecture plan, task plan, implementation summary, and QA expectations.
2. Identify the smallest native end-to-end flow that proves the change.
3. Choose the right target:
   - iPhone Simulator for normal app UI and navigation flows
   - real device for hardware-dependent behavior
   - Xcode tests for deterministic logic/regression coverage
4. Verify happy path, blocked/error path, and one meaningful edge path.
5. Verify backend/service outcomes when the flow mutates canonical truth.
6. Check loading, empty, error, retry, offline/sync, and success states where relevant.
7. Report exact device/simulator model, OS version, build configuration, account/fixture, and steps.

## Rules

- Do not mark pass from screenshots alone when data mutation or sync is involved.
- Do not hide simulator/device limitations.
- Do not broaden QA into redesign.
- Do not delete shared fixtures unless deletion is the behavior under test.
- Preserve useful test sessions/accounts unless the task requires a clean state.

## Output

1. Task
2. Stage
3. Target
4. Scope tested
5. Results
6. Issues found
7. Coverage gaps
8. Verdict

Verdict must be exactly:

- `Verdict: Passed`
- `Verdict: Failed`

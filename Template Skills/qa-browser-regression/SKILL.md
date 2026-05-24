---
name: qa-browser-regression
description: Use for web/browser QA, Safari verification, local web app regression testing, web admin/auth flow checks, and frontend browser behavior validation. Do not use for native iOS app QA; use ios-qa-regression instead.
---

# QA Browser Regression

## Purpose

Verify changed web/browser behavior with trustworthy user-flow evidence.

## Platform Boundary

Use this skill for web apps and browser-based surfaces only.

Do not use this skill for native iOS app validation. Native iOS flows should use the iOS Simulator, a real device, Xcode test tooling, or an approved iOS automation path defined by the project.

## Browser Policy

- Prefer the built-in app/browser testing environment when it can cover the task.
- Use Safari with Computer Use when Safari QA is required.
- Reuse the existing Safari session when practical.
- Open new tabs instead of new browser windows unless the test needs a separate window.
- Do not use private/incognito windows unless the test requires clean unauthenticated state.
- Do not use Chrome by default.
- Chrome is allowed only as a fallback when Safari or the built-in browser is blocked; state the reason.

## Workflow

1. Read the plan, acceptance criteria, and implementation summary.
2. Identify critical flows and data outcomes.
3. Prepare test account/fixture and environment.
4. Test happy path, blocked path, and one meaningful error/edge path.
5. Verify data persistence or backend outcome when behavior mutates data.
6. Capture exact repro steps for failures.
7. Report coverage gaps honestly.

## Rules

- Do not mark pass from visual checks alone when data mutation is involved.
- Do not create broad exploratory QA unless requested.
- Preserve useful logged-in sessions when possible.
- Avoid deleting shared fixtures unless the test explicitly covers deletion.

## Output

1. Task
2. Stage
3. Scope tested
4. Results
5. Issues found
6. Coverage gaps
7. Verdict

Verdict must be exactly:

- `Verdict: Passed`
- `Verdict: Failed`

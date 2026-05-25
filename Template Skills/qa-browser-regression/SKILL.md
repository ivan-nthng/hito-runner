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

- Use the built-in Codex app/browser testing environment first whenever it can cover the task.
- Treat Safari as a fallback path unless the task explicitly requires Safari-specific verification.
- Use Computer Use with Safari only when Safari QA is required or the built-in browser cannot cover the task.
- Reuse the existing Safari session whenever practical.
- Prefer navigating the current Safari tab; if a separate state is needed, open a new tab in the same Safari window.
- Do not open multiple Safari windows for QA.
- Opening a new Safari window is prohibited unless the test explicitly requires multiple windows; if used, state why in the QA report.
- Do not use private/incognito windows unless the test requires clean unauthenticated state.
- Do not use Chrome by default.
- Chrome is allowed only as a fallback when Safari or the built-in browser is blocked; state the reason.
- Every QA report must include a `Browser Path Preflight` line that states whether the built-in Codex app/browser was used first. If it was not used first, the report must give the concrete reason.
- If Safari is used, the report must state whether Safari was required by the task or used because the built-in browser was blocked.
- A report that skips the built-in browser without explanation, uses Safari first without justification, or opens extra Safari windows without a stated test requirement is invalid and must be redone.

## Workflow

1. Read the plan, acceptance criteria, and implementation summary.
2. Write the browser path preflight before opening or navigating any external browser.
3. Identify critical flows and data outcomes.
4. Prepare test account/fixture and environment.
5. Test happy path, blocked path, and one meaningful error/edge path.
6. Verify data persistence or backend outcome when behavior mutates data.
7. Capture exact repro steps for failures.
8. Report coverage gaps honestly.

## Rules

- Do not mark pass from visual checks alone when data mutation is involved.
- Do not create broad exploratory QA unless requested.
- Preserve useful logged-in sessions when possible.
- Avoid deleting shared fixtures unless the test explicitly covers deletion.

## Output

1. Task
2. Stage
3. Browser Path Preflight
4. Scope tested
5. Results
6. Issues found
7. Coverage gaps
8. Verdict

Verdict must be exactly:

- `Verdict: Passed`
- `Verdict: Failed`

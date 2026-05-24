---
name: hito-qa-browser-regression
description: Use for Hito QA browser validation, Safari regression testing, auth/admin flow checks, frontend verification, and any report that needs a Passed/Failed verdict.
---

# Hito QA Browser Regression

## Purpose

Verify Hito behavior with real browser evidence and honest coverage.

## Browser Policy

- Prefer the built-in app/browser testing environment when it can cover the task.
- QA browser verification must use Computer Use in Safari when Safari QA is required.
- Reuse the existing Safari session when practical.
- Prefer navigating the current tab or opening a new tab, not opening new browser windows.
- Do not use private/incognito windows unless a clean unauthenticated session is required.
- Preserve useful logged-in Safari sessions.
- Chrome is only a last-resort fallback; report why Safari was blocked.

## Workflow

1. Read the active plan, implementation summary, and QA expectations.
2. Identify the smallest end-to-end scope that proves the change.
3. Test admin/auth blocking separately from happy path when relevant.
4. Verify data outcomes for any mutation.
5. Source-verify any branch that cannot be safely exercised.
6. Report exact failures with repro steps.
7. End with a verdict.

## Hito-Specific Checks

- Admin/test-account flows must not leak credentials or normal-runner access.
- Saved-mode mutations must preserve Supabase truth.
- Plan refresh/import/apply flows must preserve review/confirm safety.
- Garmin/feedback flows must keep deterministic facts separate from AI interpretation.
- Design-system QA should flag local visual drift only when it affects product consistency or usability.

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

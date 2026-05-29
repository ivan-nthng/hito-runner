---
name: hito-qa-browser-regression
description: Use for Hito QA browser validation, Safari regression testing, auth/admin flow checks, frontend verification, and any report that needs a Passed/Failed verdict.
---

# Hito QA Browser Regression

## Purpose

Verify Hito behavior with real browser evidence and honest coverage.

## QA Documentation Authority

- QA may create and edit QA-owned documentation artifacts when the task is about test coverage, validation, or regression evidence.
- Allowed QA artifacts include scenario matrices, test plans, browser regression checklists, proof-pass notes, validation reports, and coverage-gap records.
- Keep QA-owned docs in `docs/process/`, `docs/tasks/qa/`, a plan's QA section, or another clearly QA-scoped docs location.
- Do not edit product code, migrations, implementation plans, product briefs, design specs, or role instructions through this skill unless ARCHITECT explicitly assigns that docs-maintenance task.
- QA docs must describe implemented behavior, expected validation, and coverage gaps; they must not invent new product requirements.

## QA Execution Authority

- QA owns validation execution. If the task is addressed to QA, run the validation rather than
  returning another handoff prompt.
- QA may run the validation tooling needed to prove the assigned scope: lint, build, test, typecheck,
  doctrine scripts, smoke scripts, fixture scripts, targeted CLI commands, browser checks, local app
  sessions, and screenshot capture.
- QA may inspect source, logs, debug artifacts, generated local artifacts, and safe local/test data to
  explain pass/fail results.
- QA may create, reset, or delete disposable local/test fixtures only when the QA task explicitly
  requires fixture work and the environment is local/dev/test.
- QA must not implement product fixes, edit product code, change schemas, run migrations, or mutate
  production data.
- If validation tooling is required by the prompt, run it when feasible and report exact output or
  bounded failure details. Do not return a handoff prompt just because the validation uses CLI,
  browser, build, scripts, or local fixtures.
- Do not cite orchestration-agent execution limits as a reason to skip QA work; those limits do not
  apply to the QA role while executing validation.

## Browser Policy

- Use the built-in Codex app/browser testing environment first whenever it can cover the task.
- Treat Safari as a fallback path unless the task explicitly requires Safari-specific verification.
- Use Computer Use with Safari only when Safari QA is required or the built-in browser cannot cover the task.
- Reuse the existing Safari session whenever practical.
- Prefer navigating the current Safari tab; if a separate state is needed, open a new tab in the same Safari window.
- Do not open multiple Safari windows for QA.
- Opening a new Safari window is prohibited unless the test explicitly requires multiple windows; if used, state why in the QA report.
- Do not use private/incognito windows unless a clean unauthenticated session is required.
- Preserve useful logged-in Safari sessions.
- Chrome is only a last-resort fallback; report why Safari was blocked.
- Every QA report must include a `Browser Path Preflight` line that states whether the built-in Codex app/browser was used first. If it was not used first, the report must give the concrete reason.
- If Safari is used, the report must state whether Safari was required by the task or used because the built-in browser was blocked.
- A report that skips the built-in browser without explanation, uses Safari first without justification, or opens extra Safari windows without a stated test requirement is invalid and must be redone.

## Screenshot Artifact Policy

- For any visual, interface, layout, design-system, calendar, workout-detail, admin, onboarding, or other UI-facing QA task, capture screenshot evidence whenever the browser/tooling can reasonably do so.
- Screenshot evidence should cover the states that make the verdict believable: the main inspected surface, important before/after or pass/fail states, and any visual bug or regression being reported.
- If screenshots are not possible or not useful for a UI-facing task, state the concrete reason in `Coverage gaps`.
- Save routine screenshots under the gitignored local artifact root:
  `qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/`
- Do not commit `qa-artifacts/` by default.
- In markdown QA reports, reference routine screenshot folders textually instead of embedding local-only images.
- Promote selected screenshots into `docs/process/screenshots/<task-slug>/` only when permanent release evidence is explicitly required.
- When promoting screenshots, state why they are permanent release evidence.
- Preserve existing committed screenshots unless Architect explicitly assigns a cleanup/move slice.

## Workflow

1. Read the active plan, implementation summary, and QA expectations.
2. Write the browser path preflight before opening or navigating any external browser.
3. Identify the smallest end-to-end scope that proves the change.
4. Run the CLI/build/script checks named by the handoff when they are relevant and feasible.
5. Test admin/auth blocking separately from happy path when relevant.
6. Verify data outcomes for any mutation.
7. Source-verify any branch that cannot be safely exercised.
8. Capture screenshots for UI-facing evidence when possible and store them under the task's `qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/` folder.
9. Report exact failures with repro steps.
10. End with a verdict.

## Hito-Specific Checks

- Admin/test-account flows must not leak credentials or normal-runner access.
- Saved-mode mutations must preserve Supabase truth.
- Plan refresh/import/apply flows must preserve review/confirm safety.
- Garmin/feedback flows must keep deterministic facts separate from AI interpretation.
- Design-system QA should flag local visual drift only when it affects product consistency or usability.

## Output

1. Task
2. Stage
3. Browser Path Preflight
4. Scope tested
5. Results
6. Issues found
7. Coverage gaps
8. Screenshot evidence
9. Verdict

Verdict must be exactly:

- `Verdict: Passed`
- `Verdict: Failed`

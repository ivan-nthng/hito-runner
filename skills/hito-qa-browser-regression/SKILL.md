---
name: hito-qa-browser-regression
description: Use for Hito QA validation reports that need a Passed/Failed verdict, including browser UI validation, Safari regression testing, auth/admin flow checks, frontend verification, or source/CLI validator QA. Browser and screenshot evidence are required only when the assigned scope is UI-facing or visual.
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
- Do not create a QA Markdown artifact for routine command/source validation when the final verdict
  can carry the durable evidence compactly.

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
- Prefer the persistent production-built local QA server over repeatedly starting `npm run dev` for
  browser acceptance work.
- The canonical local QA server is the built app served with `npm run serve:local` at
  `http://127.0.0.1:3000/` / `http://localhost:3000/`.
- Use `npm run qa:server:status`, `npm run qa:server:start`, `npm run qa:server:restart`, and
  `npm run qa:server:stop` to manage that built server lifecycle without starting duplicate
  processes.
- Before starting a server, check whether the canonical local QA server is already responding and
  reuse it when it is healthy.
- Do not start duplicate local app servers for the same proof. If the server is stale, hung, or
  serving the wrong build, restart the existing server intentionally and report that restart.
- If source changes affect the browser-visible app, rebuild before restarting the persistent built
  server.
- Use `npm run dev` only when the task specifically needs dev/HMR behavior or the built server
  cannot cover the scope; state the reason in `Browser Path Preflight`.
- Leave the persistent local QA server running after validation unless it is serving a known-bad
  build, blocking the next task, or the user explicitly asks to stop it.
- Treat Safari as a fallback path unless the task explicitly requires Safari-specific verification.
- Use Computer Use with Safari only when Safari QA is required or the built-in browser cannot cover the task.
- Reuse the existing Safari session whenever practical.
- Preserve one browser context by default: one existing Safari window and, whenever possible, one
  existing tab.
- Prefer navigating the current Safari tab and completing the whole validation flow in that tab.
- Open a new Safari tab only when the test genuinely requires a separate state or navigation
  context; if used, state why in the QA report.
- Do not open multiple Safari windows for QA.
- Opening a new Safari window is prohibited unless the test explicitly requires multiple windows; if used, state why in the QA report.
- Do not use private/incognito windows unless a clean unauthenticated session is required.
- Preserve useful logged-in Safari sessions.
- Chrome must not be used for QA browser testing unless the user explicitly requests or approves
  Chrome for that specific QA run.
- Every QA report must include a `Browser Path Preflight` line that states whether the built-in Codex app/browser was used first. If it was not used first, the report must give the concrete reason.
- Every browser QA report must state which local app server URL was used and whether the existing
  persistent server was reused, restarted, or replaced.
- If Safari is used, the report must state whether Safari was required by the task or used because the built-in browser was blocked.
- If Safari is used, the report must state whether QA stayed in the existing window/tab or why a new
  tab/window was required.
- A report that skips the built-in browser without explanation, uses Safari first without
  justification, opens extra Safari windows, opens unnecessary tabs, or uses Chrome without explicit
  user approval is invalid and must be redone.

## Screenshot Artifact Policy

- For any visual, interface, layout, design-system, calendar, workout-detail, admin, onboarding, or other UI-facing QA task, capture screenshot evidence whenever the browser/tooling can reasonably do so.
- Do not create screenshots for backend-only, source-only, docs-only, artifact-manifest, or
  CLI/validator QA when those checks fully prove the assigned contract.
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
2. Use subagents when safe for independent non-mutating source/log/artifact inspection, lint/build
   checks, validator runs, fixture readback audits, or coverage-gap searches. Reuse open subagents
   for related checks, close them when done, and integrate evidence into one verdict. Do not
   delegate unclear mutation, production access, or fragile shared browser/session work.
3. Write the browser path preflight before opening or navigating any external browser.
4. Check whether the canonical persistent local QA server is already healthy before starting or
   restarting any local app server.
5. Identify the smallest end-to-end scope that proves the change and write the required test
   inventory before executing it.
6. Run the CLI/build/script checks named by the handoff when they are relevant and feasible.
7. Test admin/auth blocking separately from happy path when relevant.
8. Verify data outcomes for any mutation.
9. Source-verify any branch that cannot be safely exercised.
10. Capture screenshots for UI-facing evidence when possible and store them under the task's `qa-artifacts/screenshots/YYYY-MM-DD/<task-slug>/` folder.
11. Report every executed check with scenario/command, environment or viewport where relevant,
    result, and evidence location. Separately list required checks not run, why, and the resulting
    coverage gap.
12. Report exact failures with repro steps.
13. End with a verdict.

## Definition Of Done, Test Inventory, And Acceptance Gate

Every QA assignment must declare its validation layer: either narrow task-level Definition-of-Done
verification or broader Global QA Acceptance. QA must provide a complete executed-test inventory, not
only grouped prose such as "browser QA passed". A required test that fails, is blocked, is
unavailable, or is flaky yields `Verdict: Failed`; it cannot be hidden as a coverage note. A
source-only assertion may cover an unexercisable branch only when the report says so explicitly and
it does not replace a required runtime, persistence, or browser check.

Apply this skill only to an assigned validation task, not a pure explanatory or reference response.
For debugging validation, include a safe repro or discriminator that confirms or falsifies the
claimed root cause. Present the inventory as `Check | Scenario / environment | Result | Evidence`,
then list every required test not run and its coverage consequence.

A passing narrow QA run may state `Implementation DoD Verification: Passed` while `Global QA
Acceptance: Pending`; it must not claim broad release acceptance. A global QA assignment owns the
broader acceptance inventory and may state `Global QA Acceptance: Passed` only when that inventory
passes. The implementation owner must integrate task-level QA evidence after any fix-forward before
closing its task.

## Bolder QA Matrix Rule

- For broad root-cause fixes, validate the class of behavior, not only the first repro.
- Prefer targeted source/build/fixture matrices over long Markdown reports when they prove the
  contract better.
- If the current validators are too narrow, fail with the exact missing validator or fixture class.
- Do not require browser or screenshot evidence for backend/source contracts already proven by
  no-write validators.
- Do not pass a fix when a neighboring implemented path still violates the same root-cause contract.

## Hito-Specific Checks

- Admin/test-account flows must not leak credentials or normal-runner access.
- Saved-mode mutations must preserve Supabase truth.
- Plan refresh/import/apply flows must preserve review/confirm safety.
- Garmin/feedback flows must keep deterministic facts separate from AI interpretation.
- Design-system QA should flag local visual drift only when it affects product consistency or usability.

## Output

1. Task
2. Stage
3. Validation layer: `Definition of Done verification` or `Global QA Acceptance`
4. Browser Path Preflight
5. Required test inventory: `Check | Scenario / environment | Expected evidence`
6. Executed test inventory and results: `Check | Scenario / environment | Result | Evidence`
7. Issues found
8. Required checks not run / coverage gaps
9. Screenshot evidence
10. Verdict

Verdict must be exactly:

- `Verdict: Passed`
- `Verdict: Failed`

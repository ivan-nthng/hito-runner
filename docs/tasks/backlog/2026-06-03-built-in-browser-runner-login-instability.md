# Built-In Browser Runner Login Instability During QA

## Status

backlog

## Type

bug

## Priority

low

## Next Recommended Role

QA

## Task

Reproduce and classify built-in browser runner-login instability if it recurs during QA.

## Stage

QA hygiene / browser tooling investigation

## Exact Handoff Prompt

```text
ROLE: QA

TASK:
Reproduce and classify built-in browser runner-login instability if it recurs during QA.

STAGE:
QA hygiene / browser tooling investigation

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-03-built-in-browser-runner-login-instability.md
- During active-plan schedule edit final QA, the built-in browser opened the local page but could not complete runner login and showed `Something went wrong`.
- Safari fallback in the existing Safari session completed the browser proof, so this did not block release.

BROWSER PATH PREFLIGHT:
- Use the built-in Codex browser first.
- Safari is fallback only if the built-in browser reproduces the same blocker or cannot cover the authenticated path.

QA EXECUTION AUTHORITY:
QA must execute this validation directly using safe local/dev/test tooling. Do not edit product code. If the issue reproduces, collect route, console, network, runtime, and screenshot evidence.

ROOT CAUSE AND ARCHITECTURE FIT:
- Determine whether this is a product auth/runtime bug, a local dev-session issue, or a browser-tool limitation.
- Do not file a product bug if evidence shows it is only tooling/session-specific.
- If it is product-owned, identify the likely backend/frontend owner before handoff.

VALIDATION:
- Attempt runner login in the built-in browser with a disposable local/test account.
- Record exact route, visible error, console/network evidence where available, and whether Safari fallback succeeds.
- Save screenshots under `qa-artifacts/screenshots/YYYY-MM-DD/built-in-browser-runner-login-instability/`.

OUTPUT:
1. Task
2. Stage
3. Browser Path Preflight
4. Reproduction result
5. Evidence collected
6. Likely owner
7. Verdict
8. Blockers
```

## User Report

During final schedule-edit QA, the built-in browser opened the local page but could not complete
runner login and showed `Something went wrong`.

## Evidence

Safari fallback completed browser proof in the existing Safari session, and the release was not
blocked.

## Observed Behavior

Built-in browser login instability appeared in that QA pass only.

## Expected Behavior

If the built-in browser can cover the route, QA should be able to complete runner login without a
generic error. If it cannot, QA should classify the limitation clearly.

## Source Investigation

Start with QA browser evidence. Do not assume product auth is broken without reproduction.

## Likely Root Cause

Unknown. It may be browser-tool/session-specific rather than product-owned.

## Blockers

None.

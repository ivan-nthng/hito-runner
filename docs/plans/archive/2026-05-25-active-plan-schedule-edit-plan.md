# Active Plan Schedule Edit

## Status

closed

## Type

plan

## Priority

high

## Next Recommended Role

architect

## Task

Archived: active-plan schedule edit first release is complete and QA-passed.

## Stage

Complete / archived

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Keep the archived active-plan schedule edit first release available as historical product context.

Stage:
Complete / archived.

Context:
This first release is complete and QA-passed. Do not reopen this archived plan unless a concrete product bug is found.
```

## Owner

ARCHITECT / BACKEND / FRONTEND / QA

## Last Updated

2026-06-03

## Archive Note

Archived after final QA passed the active-plan schedule edit first release.

Production state:

- `Open plan` exposes `Edit schedule`.
- Same-running-count schedule changes use backend-owned `schedule_reflow` review/apply.
- Frequency-change boundaries return `requires_regeneration`.
- Apply mutates only reviewed future workout dates and active-plan schedule preferences.
- Workout content, rich fields, runner-level defaults, protected history, and fixed rest-day invariants are preserved.
- Mobile schedule edit overflow at `375px` is fixed.

## Architecture Decisions

- Deterministic schedule reflow is allowed only when the running-count stays the same.
- Future frequency-change regeneration is a separate risk class.
- Backend owns preview, review token/checksum, protected history/evidence classification, and apply.
- Frontend renders backend-shaped preview/apply states and must not compute schedule safety locally.
- JSON import scheduling uses the same product history-continuity boundary.
- No OpenAI, profile-default mutation, or workout-content rewrite belongs in this first release.

## Validation Evidence

Final QA verdict: passed.

Preserved evidence:

- backend preview/apply validator proof
- frontend schedule edit panel proof
- build/runtime closeout after a Vercel import-path blocker
- browser QA for schedule review/apply
- mobile `375px` overflow fix
- artifact references under the 2026-06-03 schedule edit QA folders

Residual follow-ups were split into backlog-only items:

- `docs/tasks/backlog/2026-06-03-json-import-long-run-remapping-placement-helper.md`
- `docs/tasks/backlog/2026-06-03-active-plan-schedule-save-default-preferences.md`
- `docs/tasks/backlog/2026-06-03-built-in-browser-runner-login-instability.md`
- `docs/tasks/backlog/2026-06-03-git-diff-check-worktree-hang.md`

## Current Owner Links

- [Current product](../../current-product.md)
- [Current system](../../current-system.md)
- [Product history digest](../../history/product-history-digest.md)

## Do Not Continue By Default

Do not reopen this plan for regeneration, OpenAI, import remapping, or profile-default save behavior. Those are separate product/architecture gates.

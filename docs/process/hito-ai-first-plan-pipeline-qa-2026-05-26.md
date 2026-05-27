# Hito AI First-Plan Pipeline QA - 2026-05-26

## 1. Task

Run QA validation for [2026-05-26-ai-authored-first-plan-pipeline.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-26-ai-authored-first-plan-pipeline.md).

## 2. Stage

QA validation / backend ops seam release-readiness check.

## 3. Browser Path Preflight

Built-in Codex app/browser was not used first because this slice is not live in a runner-facing route and the changed scope is a backend-only non-mutating CLI/service seam. Safari was not used. Chrome was not used.

## 4. Scope Tested

Validated the QA-relevant scope that changed in this slice:

- `src/lib/ai-first-plan-draft-authoring.ts`
- `src/lib/ai-first-plan-blueprint-authoring.ts`
- `src/lib/ai-first-plan-draft-service.ts`
- `scripts/author-ai-first-plan-draft.ts`
- `scripts/validate-plan-authoring-doctrine.ts`

Executed checks:

- `node --env-file=.env.local --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `npm run author-ai-first-plan-draft -- --mock-openai --contract blueprint --fixture compact-smoke --no-reference`
- `npm run author-ai-first-plan-draft -- --mock-invalid --contract blueprint --fixture compact-smoke --no-reference`
- `npm run author-ai-first-plan-draft -- --mock-timeout --contract blueprint --fixture one-week-smoke --no-reference --timeout-ms 20`
- `npm run author-ai-first-plan-draft -- --mock-openai --contract strict-draft --fixture one-week-smoke --no-reference`
- `OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --contract blueprint --fixture one-week-smoke --no-reference --timeout-ms 120000 --max-output-tokens 10000`
- `OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --contract blueprint --fixture compact-smoke --no-reference --timeout-ms 120000 --max-output-tokens 8000`
- `OPENAI_PLAN_MODEL=gpt-4.1-mini npm run author-ai-first-plan-draft -- --live --contract strict-draft --fixture compact-smoke --no-reference --timeout-ms 30000 --max-output-tokens 8000`
- `npx eslint scripts/author-ai-first-plan-draft.ts scripts/validate-plan-authoring-doctrine.ts src/lib/ai-first-plan-draft-service.ts src/lib/ai-first-plan-draft-authoring.ts src/lib/ai-first-plan-blueprint-authoring.ts`
- `npm run build`

## 5. Results

### Contract And Doctrine

- `validate-plan-authoring-doctrine.ts` passed.
- Targeted lint on the new AI first-plan files passed.
- Mock blueprint path passed with `sourceStatus: ai_authored`, `sourceKind: ai_first_plan_blueprint_v1`, `persisted: false`, 14 workouts, and no validation issues.
- Mock invalid blueprint path fell back safely with `sourceStatus: deterministic_fallback` and `fallbackReason: ai_first_plan_blueprint_schema_invalid`.
- Mock timeout path fell back safely with `fallbackReason: ai_first_plan_blueprint_timed_out` and `abortFired: true`.
- Mock strict-draft diagnostic path passed and stayed non-mutating with `sourceKind: ai_first_plan_draft_v1`.

### Live Smoke

- Live one-week blueprint smoke passed on 2026-05-26 with `gpt-4.1-mini`.
  - `sourceStatus: ai_authored`
  - `sourceKind: ai_first_plan_blueprint_v1`
  - `persisted: false`
  - `weekCount: 1`
  - `workoutCount: 7`
  - `elapsedMs: 8042`
- Live two-week compact blueprint smoke passed on 2026-05-26 with `gpt-4.1-mini`.
  - `sourceStatus: ai_authored`
  - `sourceKind: ai_first_plan_blueprint_v1`
  - `persisted: false`
  - `weekCount: 2`
  - `workoutCount: 14`
  - `elapsedMs: 11922`
- Live two-week compact strict-draft comparison hit the expected fallback boundary on 2026-05-26.
  - `sourceStatus: deterministic_fallback`
  - `fallbackReason: ai_first_plan_draft_timed_out`
  - `persisted: false`
  - `elapsedMs: 30069`
  - `abortFired: true`

### Behavior Readback

- Blueprint live output stayed in canonical `training-plan-v2`.
- Blueprint live samples preserved executable workout structure with warmup/main/cooldown presence on non-rest sampled workouts.
- The service continued to expose non-mutating metadata clearly enough for QA:
  `sourceStatus`, `sourceKind`, `fallbackReason`, `elapsedMs`, `responseId`, `debug.requestPhase`, and `persisted: false`.
- The production-direction claim is supported by live evidence:
  compact blueprint succeeded within the configured budget while compact strict draft timed out and fell back deterministically.

## 6. Issues Found

### P1 - Full production build is failing in the current worktree

- Severity: P1 blocker
- Repro:
  1. Run `npm run build`
  2. Wait for Nitro public-asset processing
  3. Build fails with `ENOENT` while reading generated `.output/public/assets/*` files and `.output/public/templates/hito-training-plan-v2-template.json`
- Observed examples:
  - missing `/.output/public/assets/progress-hWdCBlj9.js`
  - missing `/.output/public/assets/settings-EfzSw27C.js`
  - missing `/.output/public/assets/workout._date-DC_kcuuU.js`
  - missing `/.output/public/templates/hito-training-plan-v2-template.json`
- Impact:
  release-readiness is blocked in this worktree even though the AI first-plan ops seam itself validated functionally.
- Scope note:
  this failure appears broader than the new AI first-plan files, but it is present in the current verification branch/worktree and must be resolved or explicitly scoped out before a release-ready verdict.

## 7. Coverage Gaps

- No browser QA was applicable because the slice is still ops-only and not wired into the visible onboarding flow.
- No persistence or review-confirm path was tested because this seam is explicitly non-mutating and the plan states that visible structured onboarding still uses the deterministic generator.
- I did not run full-repo `eslint .` to completion because the repo-wide scan did not return promptly; targeted lint for the changed files passed.
- I did not verify the eventual frontend integration path because that is not implemented in this slice.

## 8. Recommended Next Role

BACKEND to triage the current `npm run build` blocker, then QA rerun.

## 9. Verdict

The new AI first-plan blueprint service path validated as designed: doctrine checks passed, safe fallback paths worked, live blueprint smoke succeeded quickly, and the strict-draft comparison timed out and fell back exactly as the plan claims. Release readiness is still blocked by the current worktree `npm run build` failure during Nitro public-asset processing.

Verdict: Failed

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

QA validated the new non-mutating AI first-plan blueprint/draft service paths. Mock success, invalid, timeout, strict-draft diagnostic, and live blueprint smoke all behaved as expected, but `npm run build` failed in the current worktree during Nitro public-asset processing.

### Key Decisions

- Treat the active QA target as the ops-only AI first-plan pipeline because the active plan is marked awaiting QA.
- Fail release-readiness on the current worktree because build is red even though slice-specific functional checks passed.

### Current State

- AI first-plan blueprint path is non-mutating, returns canonical `training-plan-v2`, and succeeds live with `gpt-4.1-mini`.
- Compact strict-draft still times out at the 30 second cap and falls back deterministically.
- Full production build is currently failing with Nitro `ENOENT` asset/template read errors.

### Constraints

- Do not treat this slice as live onboarding behavior; the visible structured first-plan path still uses the deterministic generator.
- Keep QA conclusions anchored to backend-owned truth and the non-mutating contract.

### Risks / Open Questions

- Build failure may be broader than the AI first-plan slice, but it blocks release-readiness from this worktree until triaged.
- Repo-wide `eslint .` was not completed; only targeted lint for the changed files was verified.

### Next Recommended Role

BACKEND

### Suggested Next Step

Reproduce and triage `npm run build`, focusing on why Nitro public-asset processing is trying to read missing hashed files from `.output/public/assets` and the missing template artifact, then hand the worktree back to QA for a rerun.
```

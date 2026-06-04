# Git Diff Check Worktree Hang

## Status

completed

## Type

context_capture

## Priority

low

## Next Recommended Role

QA

## Task

Validate envelope adoption after `git diff --check` worktree hang was resolved.

## Stage

QA validation / envelope adoption gate

## Exact Handoff Prompt

```text
ROLE: BACKEND

TASK:
Investigate `git diff --check` hanging in the worktree if it recurs.

STAGE:
BACKEND tooling hygiene / worktree diagnostics

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-03-git-diff-check-worktree-hang.md
- During active-plan schedule edit final QA, `git diff --check` was attempted but timed out/hung in the worktree.
- The release was not blocked because build/runtime/integrity/browser proof passed through other safe local/dev paths.

ROOT CAUSE AND ARCHITECTURE FIT:
- Treat this as tooling/worktree hygiene, not a product bug unless evidence says otherwise.
- Investigate file count, large generated/untracked files, binary artifacts, path issues, or shell/tooling behavior before proposing fixes.
- Do not delete files blindly. Use path-specific diagnosis and preserve intentional QA artifacts.

VALIDATION:
- Reproduce with full `git diff --check`.
- If full command hangs, narrow by path groups and identify the blocking path or artifact class.
- Report whether cleanup, `.gitignore`, or workflow guidance is needed.

OUTPUT:
1. Task
2. Stage
3. Root cause
4. Evidence
5. Recommended cleanup or policy change
6. Validation results
7. Blockers
```

## User Report

During final schedule-edit QA, `git diff --check` timed out or hung in the current worktree.

## Evidence

2026-06-03 backend diagnostics reproduced the broader symptom first:

- `git status --short` returned normally.
- `git diff --name-only --no-ext-diff` initially timed out after 8 seconds.
- `git diff --name-only --no-ext-diff --no-renames` initially timed out after 8 seconds.
- `git diff --stat --no-ext-diff --no-renames` initially timed out after 8 seconds.
- `git diff --check --no-ext-diff --no-renames` initially timed out after 8 seconds.

Per-path diagnostics then showed every dirty tracked path diffed successfully on its own, and
top-level pathspec diagnostics returned quickly. After bounded traversal and cleanup of stale
orphan `git diff --check` processes from earlier attempts, the gate recovered:

- `git diff --name-only` returned 43 tracked changed paths without hanging.
- `git diff --check` returned exit 0.
- targeted envelope `git diff --check -- scripts/author-ai-first-plan-draft.ts src/lib/ai-first-plan-envelope-prompt.ts src/lib/ai-first-plan-envelope-trace.ts docs/plans/active/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md` returned exit 0.
- `git status --short` still reported the real dirty worktree.

## Observed Behavior

`git diff --check` did not complete during earlier QA passes, and a later initial full diff probe
also timed out.

## Expected Behavior

`git diff --check` should complete or be narrowed to a known blocking path.

## Source Investigation

Start with current worktree status, untracked/generated artifacts, large files, and path-specific
diff checks.

## Likely Root Cause

Transient worktree/Git traversal state in the large dirty iCloud-backed checkout, compounded by
stale orphan `git diff --check` processes from earlier attempts. No single changed file, rename
pair, external diff, textconv/filter config, generated artifact, or binary-like path was identified
as the root cause.

## Blockers

None.

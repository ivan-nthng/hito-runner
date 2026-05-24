---
name: hito-plan-writing-and-closeout
description: Use when creating, updating, pausing, closing, or archiving Hito plans in docs/plans/active or docs/plans/archive.
---

# Hito Plan Writing And Closeout

## Purpose

Keep Hito planning artifacts canonical, current, and easy for the next role to execute.

## Active Plan Rules

Use `docs/plans/active/` for live work that still guides execution.

Every active plan should include:

- Status
- Owner
- Last Updated
- Context
- Problem Definition
- Responsibilities
- QA Expectations
- Risks
- Exit Criteria
- Next Recommended Role
- Suggested Next Step

## Closeout Rules

When a track is complete:

- mark the plan `Complete / Closed` if no future phases remain
- mark it `Paused after <phase>` if future phases remain but work should stop now
- record residual QA hygiene as non-blocking if it does not justify reopening implementation
- archive from `docs/plans/active/` to `docs/plans/archive/` only when the plan no longer guides active/future execution

## Validation

For markdown-only plan changes:

- run `git diff --check`
- do not run build unless product code changed
- confirm active/archive paths when moving files

## Do Not

- reopen QA-green implementation without a concrete bug
- start the next phase just because the prior one finished
- turn plans into broad speculative roadmaps
- update permanent docs with planned behavior that is not implemented

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers

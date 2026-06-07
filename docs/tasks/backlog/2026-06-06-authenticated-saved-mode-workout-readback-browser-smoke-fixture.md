# Authenticated Saved-Mode Workout Readback Browser Smoke Fixture

## Status

backlog

## Type

context_capture

## Priority

low

## Next Recommended Role

QA

## Task

Validate authenticated saved-mode workout readback browser smoke for executable target display.

## Stage

QA hygiene / authenticated workout readback browser smoke

## Exact Handoff Prompt

```text
ROLE: QA

TASK:
Validate authenticated saved-mode workout readback browser smoke for executable target display.

STAGE:
QA hygiene / authenticated workout readback browser smoke

CONTEXT:
- Source path: docs/tasks/backlog/2026-06-06-authenticated-saved-mode-workout-readback-browser-smoke-fixture.md
- The watch-executable workout targets plan is complete and archived.
- Backend/service/source/helper/build QA passed for executable target readback.
- Browser UI smoke was not completed because the built-in browser reached login and there was no safe existing authenticated saved-mode fixture/session.
- This is optional QA hygiene, not a release blocker.

SCOPE:
- Use the built-in Codex browser first.
- Use a disposable local/test saved-mode fixture only.
- Verify one workout detail page shows executable numeric target anatomy for `structure_only_executable`.
- Verify Today/calendar readback does not present cue/default-HR copy as executable target truth.
- Verify legacy effort/cue-only rows remain readable if covered by the fixture.

CONSTRAINTS:
- Do not edit product code.
- Do not run migrations.
- Do not mutate production data.
- Preserve QA screenshots under `qa-artifacts/screenshots/YYYY-MM-DD/executable-target-readback-smoke/`.

OUTPUT:
1. Task
2. Stage
3. Browser Path Preflight
4. Fixture used
5. Readback proof
6. Issues found
7. Verdict
8. Blockers
```

## User Report

During executable workout target readback QA, the built-in Codex browser loaded the local app but
was unauthenticated and showed login. Workout detail/calendar surfaces were therefore blocked by
auth/no safe existing fixture. Safari was not used because the blocker was fixture/session state, not
browser tooling.

## Expected Behavior

With a safe authenticated saved-mode fixture, browser QA should prove the same readback contract
that source/helper tests already proved:

- executable target entries are foregrounded
- support cues remain secondary
- age-estimated/default HR is not shown as executable HR target truth
- legacy modes are readable but not preferred executable target entries

## Source Investigation

Relevant source surfaces:

- `src/routes/workout.$date.tsx`
- `src/components/TodayHero.tsx`
- `src/components/Calendar.tsx`
- `src/components/IntervalsViz.tsx`
- `src/lib/training.ts`

## Blockers

None. This is optional QA fixture hygiene after a completed release slice.

## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived Weekday Rest-Day Invariants plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed rest-day invariant history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived Weekday Rest-Day Invariants plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed rest-day invariant history.

Context:
This artifact is archived history. Do not continue it by default. Start from current docs/current-* truth before changing import/apply, refresh, first-plan, or rest-day schedule invariants.
```

# Weekday Rest-Day Invariants

## Archive Note

This archive captured the move from blind date-offset remapping to backend-owned weekday rest-day
invariants. It remains important history for import/apply, refresh, and first-plan generation.

## Final Outcome

Backend introduced one canonical weekday rest-day invariant seam:

- Fixed off weekdays resolve from runner/profile-shaped preferences, active-plan preferences,
  imported metadata, or explicit runner input, with active-plan truth taking priority when present.
- JSON import/apply rejects chosen starts on blocked weekdays and remaps non-rest workouts across
  allowed weekdays rather than replaying raw offsets blindly.
- Blocked weekdays are inserted as rest days in applied schedules.
- `RunnerCoachContext` exposes resolved invariants for refresh proposal generation.
- Refresh proposal review includes fixed rest days, stale fingerprints include the invariant
  signature, and refresh apply validates/repairs generated future workouts against fixed off-days
  before archive/replace persistence.
- Structured first-plan onboarding reuses the same invariant for blocked days and preferred run
  days.

## Key Decisions

- Fixed rest-day intent is stronger than simple date shifting.
- Backend owns invariant resolution, remapping, rejection, repair, and apply validation.
- Frontend may collect missing off-day truth but must not invent local remap logic.
- Exact source spacing is not stronger than fixed off-day safety.

## Deferred Work

- Full weekly schedule editor.
- Explicit recurring off-day settings product beyond existing profile-shaped support.
- Per-workout drag/drop repair.
- Advanced rescheduling heuristics and coach-chat negotiation.

## Validation Evidence

Historical validation covered import/apply with blocked weekdays, blocked-start rejection, refresh
proposal/apply preservation, malformed unsafe output blocking without mutation, and structured
first-plan invariant reuse.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not build a schedule editor from this archive. Future rest-day work must preserve the current
backend-owned invariant seam.

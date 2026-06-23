## Status

archived

## Type

plan

## Priority

low

## Next Recommended Role

architect

## Task

Preserve archived User-Chosen Plan Start Date plan as historical context.

## Stage

ARCHITECT archived-plan reference / compressed import start-date history.

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Preserve archived User-Chosen Plan Start Date plan as historical context.

Stage:
ARCHITECT archived-plan reference / compressed import start-date history.

Context:
This artifact is archived history. Do not continue it by default. Start from current docs/current-* truth before changing JSON import, plan apply, start-date, or conflict-handling semantics.
```

# User-Chosen Plan Start Date

## Archive Note

This archive captured the shift from source-file-driven JSON import dates to a runner-chosen
effective apply start date. It is preserved because this boundary still explains current import
semantics.

## Final Outcome

Saved-mode JSON import/apply moved to an explicit runner-chosen start date:

- `requestedStartDate` became the effective apply authority when supplied by the caller.
- Imported JSON `start_date` stayed source-plan metadata and the offset anchor for shifting the
  block, not the primary apply date.
- Backend apply policy continued to own date mapping, target-date shifting, first-day conflict
  handling, and continuity protection.
- Existing callers without `requestedStartDate` kept previous normalized-start compatibility.
- `clearUpcomingSchedule` remained the backend-owned way to clear a previous active schedule while
  preserving archived history and logged truth.

## Key Decisions

- Hito is a runner-facing plan application flow, not a JSON-to-calendar replay engine.
- The runner should choose when training starts after upload validation.
- Safe default conflict behavior preserves existing chosen-day workout and drops imported day 1.
- Destructive replace remains explicit and blocked when it would detach protected saved history.
- Frontend must collect the chosen date and submit it; it must not precompute conflict semantics.

## Validation Evidence

Historical QA expectations covered Today, Tomorrow, Next week, arbitrary future starts,
target/race-date shifting, backend receipt of `requestedStartDate`, and safe conflict handling.

## Current Owner Links

- Current product truth: `docs/current-product.md`
- Current system truth: `docs/current-system.md`
- Product history digest: `docs/history/product-history-digest.md`

## Do Not Continue By Default

Do not revive imported JSON `start_date` as apply truth from this archive. Future import work must
start from current backend apply policy and current advanced-import UI.

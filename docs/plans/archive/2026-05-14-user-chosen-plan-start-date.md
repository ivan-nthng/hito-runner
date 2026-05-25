Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Frontend slice implemented

Owner

Frontend

Last Updated

2026-05-15

Context

The current saved-mode import/apply seam still gives too much authority to imported JSON `start_date`, then tries to normalize that value and resolve first-day conflicts afterward.

Today the live model is:

- import canonical `training-plan-v2`
- derive effective start from imported `start_date`
- normalize past or non-future starts to `today`
- detect first-day conflict on that normalized day
- default to preserving today and shifting the rest
- allow explicit destructive `Replace today`

That model is technically coherent, but it is not the simplest runner-facing mental model.

The new direction is simpler:

- upload a plan
- validate the file
- ask the runner when they want to start training
- use that chosen day as the effective apply start

Problem Definition

The current model is too source-driven.

- It makes imported `start_date` feel like the primary authority even though the product later overrides or normalizes it.
- It forces the user to reason about a hidden backend distinction between declared start, normalized start, and applied start.
- It makes first-day conflict behavior feel like a correction to imported JSON rather than a clear user choice about when the plan begins.

This is now the wrong emphasis for the current product.

- The product is not a JSON-to-calendar replay engine.
- It is a runner-facing plan application flow.
- The runner should choose when the training block starts.

Canonical Product Rule

After JSON upload and validation, the runner explicitly chooses the start day for applying the plan.

- That chosen day becomes the effective apply start.
- Imported JSON `start_date` is no longer the primary authority for apply.
- Day 1 of the imported workout sequence is anchored from the chosen start day, subject only to explicit continuity/conflict rules.

This rule is the new product default for advanced JSON import.

What JSON Start Date Still Means

JSON `start_date` still has value, but only as source metadata.

In v1 it should mean:

- the original source-plan start date from the file
- an informational hint that can help explain the source plan window
- the anchor for preserving relative offsets to source metadata such as target or race date when the plan is shifted

It should not mean:

- the final effective start date for saved-mode apply
- a date the frontend silently normalizes and treats as runner intent
- a value that can bypass explicit user choice

What The User Now Explicitly Controls

- the effective first day of the applied training sequence
- whether the imported first workout should replace an existing workout on that chosen day when a conflict exists

The user does not control:

- direct client-side remapping logic
- log carry-forward rules
- history continuity exceptions
- calendar mapping semantics beyond the chosen start day and explicit destructive override

Apply Semantics

Canonical mapping rule

- Imported workout sequence order remains authoritative.
- Chosen start day becomes the intended landing date for imported day 1.
- Imported day 2 lands on chosen start day plus one calendar day.
- Imported day N lands on chosen start day plus N minus 1 days.

Day 1 behavior

- Yes, day 1 should always intend to land on the chosen date.
- If there is no conflict, it persists there directly.
- If there is a conflict, continuity rules decide whether day 1 stays there or is dropped.

Target or race date behavior in v1

- Keep target or race date relative to the shifted plan window.
- If the imported file says the target date is X days after imported `start_date`, then applied target date should remain X days after the chosen start date.
- Do not ask the runner to separately resolve race date in this slice.

This keeps one simple rule:

- chosen start controls the block
- the block shifts as a unit

Conflict Semantics

Conflict definition

- A conflict exists when the chosen start date already has a saved non-rest planned workout in the active plan.

Default behavior

- Keep the current safe continuity default.
- If conflict exists, preserve the existing workout on the chosen day by default.
- Drop incoming imported day 1.
- Start imported original day 2 on the following day.

Destructive override

- Keep `Replace today` conceptually, but generalize it to the chosen start date.
- The product language should become:
  `Replace first workout on this start date`
  or equivalent quieter wording
- If selected, imported day 1 stays on the chosen date.
- This path remains blocked whenever it would detach saved workout history.

What changes relative to the current model

- The product no longer asks the runner to think about imported `start_date` normalization.
- The first-day conflict model stays, but it now attaches to one explicit user-chosen start date instead of a backend-normalized imported date.

What is replaced

- The emphasis on `imported start_date -> normalize -> maybe conflict` is replaced.

What remains

- continuity-safe preserve-default behavior
- explicit destructive replace path
- backend-owned carry-forward validation

UX Contract

Question shown after JSON upload and validation

- `When do you want to start training?`

Smallest good v1

- one date input as the canonical control
- prefilled to `today`
- only `today` or future dates allowed
- optional quick actions:
  `Today`
  `Tomorrow`
  `Next week`

Why this is the smallest good v1

- It keeps one actual source of truth: one chosen ISO date.
- It still supports arbitrary future starts without creating a second flow.
- It avoids forcing the runner into a too-small preset-only choice set.

What appears before apply

- file validated summary
- the explicit start-date question
- one short explanation:
  `Your selected day becomes day 1 of this plan.`
- if conflict exists after date choice:
  safe default explanation
  optional destructive replace action

What should not appear in v1

- no visible imported-start normalization language
- no preserve-vs-ignore chooser as a co-primary initial decision
- no second schedule editor

Backend Responsibilities

- Accept one explicit `requestedStartDate` from the client for JSON import apply.
- Treat that value as the only effective-start authority for apply.
- Map imported workout sequence onto calendar dates from that chosen day.
- Shift target/race date metadata relative to the chosen day using the same source-plan offset.
- Detect chosen-day conflicts against the active persisted plan.
- Apply the safe preserve-default behavior when conflict exists and no destructive override is requested.
- Enforce continuity protections and block destructive replacement when logs would be detached.
- Return one canonical apply result contract.
- Expose `clearUpcomingSchedule` as the separate lifecycle action for cases where the runner chooses to remove the previous active schedule before applying a later-starting imported plan.

The backend should no longer expose apply semantics that depend primarily on imported `start_date` normalization for this flow.

Frontend Responsibilities

- Collect the chosen start day after JSON validation.
- Submit that day to the backend as input.
- Show only backend-returned conflict or blocked-replacement states.
- Keep copy simple:
  choose start day
  apply plan
  optionally replace the conflicting first workout

The frontend must not:

- shift workout dates locally
- infer plan offsets client-side
- invent its own preserve/replace rules
- silently reinterpret source dates

Migration / Scope Impact

V1 scope recommendation

- Apply this change to advanced JSON import first.

Why JSON import first

- That is the flow where source-file `start_date` currently creates the most visible mental-model confusion.
- It keeps the first slice narrow and implementation-safe.
- It avoids broadening immediately into text-first authoring confirmation UX.

Possible later extension

- Later, the same explicit start-day question can also be offered after text-first plan generation and before final persistence.
- But that should come only after the JSON-import path proves the simpler model.

What We Leave For Later

- applying this same explicit start-day choice to text-first generation
- separate target-date confirmation
- plan editing or drag-rescheduling
- more advanced recurrence or skipped-day repair logic
- any client-side calendar planning UI

QA Expectations

- Valid JSON import should never apply until a chosen start date is present.
- The chosen date, not imported `start_date`, should drive applied workout dates.
- Target or race date should shift consistently relative to chosen start.
- Safe default conflict behavior should still preserve existing chosen-day workout and drop imported day 1.
- Destructive replace should still be blocked when it would detach saved history.
- Today, tomorrow, next week, and arbitrary future date selection should all map correctly through the same backend path.

Risks

- If target-date shifting is not explained clearly in docs and backend naming, the team may accidentally treat source race date as fixed while shifting workouts.
- If the frontend tries to precompute conflict semantics, it can reintroduce split truth.
- If this is broadened into text-first and JSON import at the same time, the simplification move becomes a larger authoring redesign.

Implementation Update

- `completeOnboarding` now accepts optional `requestedStartDate` for JSON import apply.
- `prepareImportedPlanApplyPolicy` treats `requestedStartDate` as the effective apply authority when present.
- Imported JSON `start_date` remains the source-plan anchor used to compute the shift offset and target-date shift.
- Saved-mode JSON import surfaces now collect the chosen start day and send it as `requestedStartDate`.
- Existing no-`requestedStartDate` callers keep the previous normalized-start behavior.
- Chosen-date conflict handling reuses the existing safe default and destructive `replace_first_day` continuity guard.
- `clearUpcomingSchedule` is now available as the backend-owned way to clear the previous active schedule before a later-starting import while preserving archived history and logged truth.

Exit Criteria

- [x] one canonical rule states that runner-chosen start date is the effective apply authority for JSON import
- [x] imported JSON `start_date` is demoted to metadata rather than apply truth when `requestedStartDate` is provided
- [x] backend ownership of date mapping and conflict handling is explicit
- [x] v1 UX is bounded to one small date-choice step after upload validation
- [x] continuity-safe replace logic remains intact without preserving the old mental model

Next Recommended Role

QA

Suggested Next Step

Verify saved-mode JSON import in Safari with Today, Tomorrow, Next week, and an arbitrary future start date, confirming the backend receives `requestedStartDate` and owns mapping/conflict handling.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Implemented the saved-mode JSON import/apply path away from imported `start_date` authority and toward a runner-chosen effective start date after JSON upload.

### Key Decisions

- `requestedStartDate` is the effective apply authority when supplied by the JSON import caller.
- Imported JSON `start_date` remains source metadata and the offset anchor for shifting the plan block.

### Current State

- The backend accepts optional `requestedStartDate`.
- Saved-mode import surfaces now collect and send the chosen start date.
- The product still has a safe preserve-default conflict path and an explicit destructive replace path.

### Constraints

- Keep backend ownership of date mapping and continuity protection.
- Do not broaden this slice into full plan editing or text-first authoring redesign.

### Risks / Open Questions

- Saved-mode frontend now collects and passes the chosen start date from the JSON import surfaces.
- Applying the new model to text-first generation should wait until the JSON import path is proven.

### Next Recommended Role

QA

### Suggested Next Step

Verify saved-mode JSON import sends the chosen start date and preserves backend-owned conflict handling.
```

# Next Product Step After Proposal-Only Refresh

## Status

In progress - recommended backend apply foundation started

## Owner

Backend / Frontend

## Last Updated

2026-05-16

## Context

The product now has a real proposal-only `Update plan` slice:

- runners can request a plan refresh inside `Open plan`
- backend builds bounded longitudinal runner context
- review output is cleaner and trustworthy
- proposal stays explicit and non-destructive
- the active plan is not silently mutated

That means the product has crossed an important threshold:

- Hito can now explain how it would revise the remaining plan from real saved history

The next decision is whether to:

- finish that loop into an explicit apply flow
- or pivot to another adjacent capability first

## Current Product State

What is now true:

- text-first plan creation is live
- saved-mode plan lifecycle is live
- Garmin evidence, deterministic comparison, and bounded workout recommendation are live
- body-note caution context is live
- active-plan JSON/Markdown export is live
- proposal-only `Update plan` from history is live and QA-green

What is still not true:

- approved plan-refresh proposals have a first backend apply foundation, but no frontend confirm/reject controls yet
- screenshot OCR is still not live
- similar-run comparison is still not live
- PDF export is still not live

## What Is Already Good Enough

- the proposal-generation side of `Update plan`
- current `Open plan` lifecycle surface
- current Garmin comparison and recommendation loop
- body-note modal and bounded AI caution behavior
- JSON/Markdown plan export

## What Has Immediate Runner Value Now

The highest immediate runner value is:

- turning a trustworthy refresh proposal into an explicit approved plan change

Reason:

- the runner can already see that Hito understands their recent history
- the next real payoff is letting them act on that understanding
- without forcing them to recreate the plan from scratch

## Candidate Next Steps

### 1. Explicit apply/confirm flow for approved refresh proposals

- add the missing apply step after review
- preserve past truth
- replace only the remaining active schedule
- first backend apply foundation implemented; frontend confirmation remains next

### 2. Richer comparison model next refinement

- deepen deterministic comparison further where support is honest

### 3. Screenshot OCR for workout evidence

- add a second evidence path for runners without FIT/ZIP files

### 4. Similar-run comparison

- compare the current workout against prior comparable sessions

### 5. Plan export PDF

- add the deferred runner-facing PDF projection from the existing export model

### 6. Runner-settings/profile follow-up

- only if a live functional gap appears

## Recommended Next Step

Explicit apply/confirm flow for approved refresh proposals

### Why this should be next

- it completes the highest-value new loop already started
- it makes the proposal-only slice materially useful rather than merely insightful
- it reuses existing plan lifecycle and continuity safeguards
- it is smaller and more coherent than jumping sideways into OCR or similar-run comparison

### Why it beats the other candidates now

- richer comparison refinement would improve one part of workout feedback, but the product already has enough comparison truth to support a more valuable plan-level action
- screenshot OCR broadens ingestion before the explicit coaching loop is finished
- similar-run comparison is useful, but still secondary to letting the runner actually update the plan
- PDF export is presentation value, not coaching value

## What Waits

### Richer comparison model next refinement

- Wait as the next likely follow-up after refresh apply.
- Reason:
  still valuable, but less urgent than completing the plan-refresh loop.

### Screenshot OCR for workout evidence

- Wait.
- Reason:
  another evidence source is lower leverage than making the explicit history-to-plan path actionable.

### Similar-run comparison

- Wait.
- Reason:
  good secondary context, but not as strong as explicit approved plan revision.

### Plan export PDF

- Wait.
- Reason:
  JSON/Markdown already cover real export utility for now.

### Runner-settings/profile follow-up

- Treat as maintenance only.
- Reason:
  not the next product-defining move unless an unfinished live gap appears.

## What Should Not Be Broadened Yet

- do not turn apply into silent plan mutation
- do not introduce a broad chat-coach product in the same slice
- do not add workout-by-workout editing
- do not combine apply flow with screenshot OCR or similar-run comparison
- do not bypass continuity and history-preservation rules

## Risks

- apply flow can overreach if it looks automatic rather than explicitly confirmed
- replacement semantics can get messy if future-only replacement is not kept strict
- the team could accidentally create a second plan lifecycle path instead of reusing the existing one

## Exit Criteria

- one next bounded step is explicitly chosen
- the choice reflects the live proposal-only refresh state
- lower-priority adjacent tracks are explicitly deferred
- exactly one next recommended role is chosen
- first backend apply foundation exists behind the chosen step

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement the frontend `Apply update` / `Keep current plan` controls against the new backend apply seam, including stale-proposal copy and a fresh-proposal retry path.

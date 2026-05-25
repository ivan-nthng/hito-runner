Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Stale / archive with note.

Reason: This prioritization artifact has been superseded by later completed product tracks and current-state documentation.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Next Product Track Refresh 2

## Status

Draft

## Owner

Architect

## Last Updated

2026-05-15

## Context

Since the last prioritization refresh, the product has closed several meaningful surface and lifecycle gaps:

- body-note modal flow is now real
- body-note AI caution context is now live
- active-plan JSON/Markdown export is now live
- modal-family consolidation and `/hitoDS` alignment are effectively done

This means the next track should not come from cleanup inertia.

The next track should come from the strongest remaining runner-value gap in the current Hito loop:

`planned workout -> actual execution -> saved history -> future plan decision`

## Current Product State

What is now true:

- text-first plan creation is live
- active-plan lifecycle in `Open plan` is real
- chosen-start-date import/apply is real
- Garmin FIT/ZIP upload is live
- deterministic comparison is live
- bounded AI workout recommendation is live
- workout-scoped body-note caution context is live
- plan export JSON/Markdown is live

What is still not live:

- screenshot OCR evidence
- similar-run comparison
- AI-assisted plan refresh from real history
- PDF plan export

## What Is Now Good Enough

- current modal/dialog system for meaningful product flows
- body-note capture and bounded AI caution behavior
- active-plan JSON/Markdown export
- current Garmin evidence upload + factual comparison + bounded workout recommendation loop
- saved-mode plan creation/import/delete/clear lifecycle

## What Has Highest Immediate Runner Value

The biggest remaining runner-value gap is no longer:

- exporting the plan in another format
- cleaning up another surface
- or adding a second evidence source first

The biggest gap is:

- letting the runner explicitly ask Hito to **update the current plan from real training history**

That closes the actual coaching loop:

- build plan
- observe execution
- compare plan vs actual
- revise the remaining plan using saved reality

## Candidate Tracks

### 1. AI-assisted plan-adjustment / plan refresh from history

- explicit `Update plan`
- uses saved history, adherence, actual load, Garmin comparison, and bounded runner context
- keeps the same goal unless the runner asks otherwise

### 2. Richer comparison model next refinement

- deepen deterministic comparison further where support is honest
- more structure or target fidelity before new ingestion types

### 3. Screenshot OCR for workout evidence

- support screenshot-based evidence for runners without FIT/ZIP files

### 4. Similar-run comparison

- compare a workout against prior comparable sessions

### 5. Plan export PDF

- add bounded runner-facing PDF export from the already-live export model

### 6. Remaining user-settings/profile follow-up

- only if a materially unfinished live gap appears
- not as the default next product track

## Updated Priority Order

1. AI-assisted plan-adjustment / plan refresh from history
2. Richer comparison model next refinement
3. Screenshot OCR for workout evidence

## Recommended Next Track

AI-assisted plan-adjustment / plan refresh from history

### Why it moves to the top now

- The product now already captures enough trustworthy runner history to support it.
- It is the first track that makes AI feel more like a real coach instead of only an authoring or wording layer.
- It reuses the current strongest foundations:
  - saved history
  - deterministic comparison
  - bounded AI
  - `Open plan` lifecycle
- It answers a stronger user need than another export format or another small comparison refinement:
  - "this plan is too hard"
  - "I missed several days"
  - "keep the same goal, but revise the remaining weeks from my real state"

### Why not richer comparison first anymore

Richer comparison is still valuable, but the current Garmin loop is already good enough to support a bigger coaching payoff.

At this point, another comparison-only refinement improves one workout.

An explicit plan-refresh workflow improves the runner’s remaining training block.

That is the larger product step.

## What Waits

### Richer comparison model next refinement

- Wait as the second priority.
- Reason:
  it still matters, but it is now a refinement of an already-valuable loop rather than the biggest remaining product leap.

### Screenshot OCR for workout evidence

- Wait.
- Reason:
  it expands ingestion complexity before the explicit history-to-plan coaching loop is in place.

### Similar-run comparison

- Wait.
- Reason:
  it is useful, but still secondary to using the runner’s broader history to revise the actual future plan.

### Plan export PDF

- Wait.
- Reason:
  JSON/Markdown already cover real export utility, while PDF is a presentation improvement rather than the next coaching capability.

### Remaining user-settings/profile follow-up

- Treat as maintenance or dependency work only.
- Reason:
  not the next product-defining track unless a live functional gap appears.

## What Is Still Tempting But Should Wait

- screenshot OCR before the explicit history-to-plan loop exists
- similar-run comparison before plan refresh semantics are clear
- PDF export because it is visible and tidy, but lower leverage
- another cleanup pass just because recent cleanup was successful

## Risks

- plan refresh can overreach if it becomes silent automation instead of explicit runner action
- weak or sparse history can make the refresh feel overconfident if deterministic context is not summarized conservatively
- if the team skips the backend context seam, plan refresh can accidentally become a second parallel AI path

## Exit Criteria

- refreshed top 3 next tracks are explicit
- the new completed slices are reflected honestly
- exactly one next recommended track is chosen
- lower-value cleanup/export tails are explicitly deprioritized

## Next Recommended Role

BACKEND

## Suggested Next Step

Start with the backend longitudinal `RunnerCoachContext` seam and the first task-specific `PlanRefreshPromptInput`, so Hito can support one explicit `Update plan` workflow that revises the remaining active schedule from real saved history without mutating past truth.

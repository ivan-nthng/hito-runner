Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Next Garmin Phase Plan

## Status

Implemented

## Owner

Architect

## Last Updated

2026-05-11

## Context

The deterministic Garmin foundation is now live and QA-green, and this next UI containment slice is now implemented.

That current implemented slice already gives the product real backend-owned truth for:

- Garmin `.fit` and Garmin `.zip` upload
- immutable uploaded result assets
- normalized actual workout metrics
- deterministic planned-vs-actual comparison
- richer factual comparison readback now moved into the dedicated workout-detail `Feedback` surface

The next step should not be “add more capability because we can.”

It should be the next slice that:

- makes the new truth easier to understand
- keeps one canonical product path
- creates a clean home for future extension
- avoids mixing deterministic facts, manual completion, and future AI interpretation into one overloaded surface

## Candidate Evaluation

### 1. AI interpretation / recommendation layer

Value:

- high eventual product value
- turns deterministic facts into user-facing guidance

Current downside:

- the current product has no dedicated feedback surface yet
- adding AI now would force interpretation into the already crowded `Log result` tab
- it would make trust boundaries harder to read before the factual layer has its own home

Readiness:

- backend deterministic inputs now exist
- product surface containment is not ready yet

### 2. Dedicated `Feedback` surface / tab

Value:

- highest immediate product leverage from the work already shipped
- separates manual completion logging from evidence and comparison readback
- gives Garmin evidence a stable canonical home
- creates the future landing zone for AI interpretation without changing the truth model

Current downside:

- requires visible route/surface refinement
- requires careful migration so facts are moved, not duplicated

Readiness:

- already strong
- `getWorkoutRouteData` already loads `feedback`
- `CompletionPanel` already renders Garmin upload and deterministic comparison
- workout-detail tabs already use route search as the active-tab source of truth

### 3. Calendar evidence markers

Value:

- would improve at-a-glance awareness from home/calendar

Current downside:

- evidence semantics are not yet settled at the product level
- the app still needs one stable feedback destination before adding marker language to the calendar
- markers too early would risk introducing a second summary surface before the primary evidence surface is clear

Readiness:

- medium at best

### 4. Screenshot evidence path

Value:

- broadens evidence entry and eventually reduces Garmin-only dependence

Current downside:

- introduces a second ingestion path before the first evidence path has finished product-level containment
- would reopen parsing, validation, and uncertainty questions
- screenshot OCR is explicitly later and not needed to capitalize on the current deterministic slice

Readiness:

- low

## Chosen Next Slice

### Dedicated `Feedback` workout-detail surface

The next highest-leverage slice should be:

- add one dedicated `Feedback` tab or equivalent dedicated workout-detail surface
- move Garmin upload, asset state, normalized actual summary, and deterministic comparison readback into that surface
- keep `Log result` focused on manual workout completion truth

This is the best next slice because it improves the current implemented product without broadening the system.

It turns the existing Garmin/deterministic backend work into a clearer user-facing capability, while preserving space for later AI interpretation, screenshot evidence, and calendar evidence markers.

## Scope

This slice should cover only the following:

### 1. Add one dedicated workout-detail `Feedback` surface

- introduce one explicit workout-detail surface for result evidence and comparison readback
- keep the workout-detail route as the canonical place for post-run review
- keep route-search-driven tab truth consistent with the existing workout tab model

### 2. Move evidence ownership out of `Log result`

The dedicated feedback surface should own:

- Garmin FIT/ZIP upload entry
- latest upload state
- latest parsed actual metrics summary
- latest deterministic comparison readback
- honest empty state when no evidence is attached yet

### 3. Keep manual completion truth separate

`Log result` should stay focused on:

- `completed`
- `partial`
- `skipped`
- manual notes
- manual actual metrics when the user wants to save without Garmin evidence

### 4. Preserve one canonical backend seam

The new surface must reuse the current truth path:

- `workout_result_assets`
- `workout_actual_metrics`
- `workout_comparisons`
- current `feedback` loader seam from `getWorkoutRouteData`

No second evidence model should be introduced.

### 5. Prepare a future landing zone

The surface should be designed so future additions can fit into the same place:

- AI interpretation later
- screenshot evidence later
- calendar markers later linking into a known destination

## Non-Goals

- no AI interpretation or recommendation generation in this slice
- no screenshot OCR or screenshot upload
- no Garmin sync or Strava sync
- no calendar evidence markers yet
- no auto-adjustment of the next workout or the active plan
- no new evidence storage subsystem
- no rewrite of workout-detail route structure

## Dependencies Already Satisfied

The following prerequisites are already in place:

- FIT/ZIP upload is live
- deterministic Garmin parsing is live
- normalized actual metric persistence is live
- deterministic comparison persistence is live
- richer deterministic comparison payload/readback is live
- workout detail already receives `feedback` from the server loader
- workout-detail tabs already use route search as the visible source of truth
- saved-mode QA for the current deterministic Garmin slice is green

## Truth Boundaries To Preserve

### 1. Manual completion truth stays separate from evidence truth

- `workout_logs` remain the canonical source of manual completion state
- Garmin evidence remains additive, not a replacement for `workout_logs`

### 2. Deterministic comparison remains factual

- the new feedback surface should present backend-owned deterministic facts
- it must not introduce coach-like interpretation language yet

### 3. One evidence path stays canonical

- Garmin FIT/ZIP remains the only live evidence path in this slice
- screenshot and provider-sync paths must not leak into the implementation as half-live alternatives

### 4. No duplicated visible truths

- the same Garmin asset summary and deterministic comparison should not remain fully duplicated in both `Log result` and `Feedback`
- the system should move ownership, not create parallel readback panels

## Why Not The Other Options Yet

### Why not AI interpretation yet

AI should wait because the product still needs a stable home for evidence truth first.

Without a dedicated feedback surface, AI interpretation would be forced into the current `Log result` area and would blur:

- deterministic facts
- manual completion logging
- future recommendation language

That is the wrong order. First contain truth. Then layer interpretation on top of it.

### Why not calendar evidence markers yet

Calendar markers should wait until the product has one settled meaning for “feedback exists.”

Right now the app still needs to define the primary post-run review destination cleanly. Markers should come only after the workout-detail feedback surface is stable and the marker semantics are obvious, for example:

- evidence attached
- parsed successfully
- comparison available

### Why not screenshot evidence yet

Screenshot evidence should wait because it would create a second ingestion path before the first one has finished product containment.

That would expand the system faster than the product understanding around it. The current better move is to make the existing Garmin truth legible and stable first.

## Risks

### 1. Product duplication risk

If the new surface is added without moving ownership, the app will show the same evidence truth in two places.

Mitigation:

- explicitly re-scope `Log result`
- make `Feedback` the canonical evidence/comparison home

### 2. Route complexity risk

Adding a new tab could create mixed states if the tab model diverges from the current route-search pattern.

Mitigation:

- keep the same route-search ownership model already used by workout-detail

### 3. User expectation risk

The word `Feedback` could be read as AI coaching if the copy is careless.

Mitigation:

- keep labels factual
- state clearly that this surface currently shows uploaded evidence and deterministic comparison

### 4. Rest-day and preview-mode edge-state risk

The product needs honest behavior on workouts where evidence should not exist yet.

Mitigation:

- define explicit empty, unavailable, and saved-mode-only states
- avoid pretending every workout always supports evidence review

## QA Plan

### Must-pass

- saved-mode workout-detail shows a dedicated `Feedback` surface
- [x] manual `Log result` flow still works independently for `completed`, `partial`, and `skipped`
- [x] Garmin FIT/ZIP upload remains successful through the new surface
- [x] deterministic comparison readback remains coherent after the surface move
- [x] route-search tab state remains stable on direct open and reload
- [x] no duplicated full comparison readback remains in both `Log result` and `Feedback`

### Should-pass

- [x] no-evidence workout shows an honest empty `Feedback` state
- [x] rest-day workout shows an honest unavailable or non-applicable `Feedback` state
- [x] preview mode keeps evidence clearly unavailable and non-persistent
- [x] existing saved logs remain legible even when no Garmin evidence exists

### Regression watch

- [x] no breakage to `Overview`
- [x] no breakage to calendar -> workout-detail navigation
- [x] no breakage to current Garmin upload validation behavior in Safari
- [x] no breakage to existing comparison readback coherence

## Exit Criteria

- workout-detail has one clear dedicated surface for workout evidence and deterministic comparison
- `Log result` is no longer overloaded with both manual completion and full evidence readback
- Garmin upload and deterministic comparison still use the same canonical backend truth path
- no new split truth is introduced between completion state and feedback evidence state
- the product has a clean visible home for future AI interpretation without having implemented AI yet

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implemented the dedicated workout-detail `Feedback` surface by reusing the existing `feedback` loader seam and moving Garmin upload plus deterministic comparison ownership out of `Log result`, while keeping manual workout completion isolated in the current logging flow.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the next Garmin-adjacent product slice after the QA-green deterministic comparison foundation.

### Key Decisions

- The next slice should be a dedicated workout-detail `Feedback` surface.
- AI interpretation, calendar evidence markers, and screenshot evidence should wait until evidence truth has one stable visible home.

### Current State

- Garmin FIT/ZIP upload is live.
- Deterministic planned-vs-actual comparison is live and QA-green.
- The current evidence/comparison readback still lives inside `Log result`.

### Constraints

- Keep one canonical backend truth path for uploaded assets, normalized actual metrics, and deterministic comparisons.
- Do not duplicate evidence truth across both `Log result` and `Feedback`.
- Do not add AI interpretation in this slice.

### Risks / Open Questions

- The new surface must avoid turning `Feedback` into vague coaching language.
- Rest-day and preview-mode behavior need explicit honest states.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Add the dedicated workout-detail `Feedback` tab/surface, move Garmin upload and deterministic comparison readback into it, and keep `Log result` focused on manual workout completion truth.
```

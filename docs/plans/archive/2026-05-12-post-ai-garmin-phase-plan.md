Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Post-AI Garmin Phase Plan

## Status

Implemented

## Owner

Architect

## Last Updated

2026-05-12

## Current Slice Note

This marker-rendering slice is now implemented:

- the canonical saved-mode workout snapshot carries one minimal `feedbackMarker` summary per workout day
- marker states are currently:
  `evidence_attached`
  `feedback_ready`
- marker truth is derived only from existing Garmin persisted records and does not create a second verdict system
- saved-mode month/week calendar cards and the current-day home hero now render that marker as a small secondary cue
- marker navigation points into the existing workout-detail `Feedback` tab instead of creating a second feedback surface

## Context

The current Garmin path has now crossed the threshold from infrastructure to product capability:

- FIT/ZIP upload is live
- deterministic comparison is live
- richer deterministic comparison readback is live
- the dedicated `Feedback` surface is live and QA-green
- bounded AI interpretation inside `Feedback` is live and QA-green

This means the next step should no longer be about making `Feedback` itself work.

The next step should make that existing value easier to discover from the main planning surface without expanding the evidence system again.

The current visible gap is simple:

- the workout-detail `Feedback` tab now contains meaningful saved-mode evidence and advice
- the home/calendar surface still has no product signal that such feedback exists for a given workout day

## Candidate Evaluation

### 1. Calendar evidence markers

Value:

- highest next product leverage
- exposes already-existing Garmin evidence and AI feedback from the main planning surface
- improves discoverability without changing the ingestion or interpretation pipeline
- stays within the current product mental model:
  week view first, workout detail second

Readiness:

- high
- the current Garmin truth path already exists
- the current `Feedback` tab is already the canonical destination
- the calendar already renders status semantics and can carry one more bounded marker language

Main caution:

- marker semantics must stay honest and bounded
- markers must point to existing truth, not invent a second summary system

### 2. Screenshot evidence path

Value:

- broadens evidence input beyond Garmin export files

Readiness:

- low

Why not first:

- it introduces a second evidence ingestion path before the first one has been fully surfaced through the product
- it reopens extraction uncertainty, validation, and confidence problems
- current product direction still explicitly holds OCR for later

### 3. Historical AI backfill / regeneration

Value:

- useful operationally
- can clean up old workouts that predate the current AI seam or need refreshed recommendations

Readiness:

- medium

Why not first:

- it is mostly an operations and maintenance slice, not the next visible product gain
- the app first needs stronger day-level discoverability of the live feature before investing in historical regeneration workflows

### 4. Richer recommendation-only adjustment seam

Value:

- potentially high long-term value
- moves toward “what should I do next?” product help

Readiness:

- medium

Why not first:

- the bounded AI interpretation layer only just landed
- a richer adjustment seam risks stepping too quickly toward adaptive-plan behavior before the current evidence/feedback path has been fully surfaced and observed
- it expands recommendation authority faster than the current product trust boundary needs

### 5. Another comparison refinement

Value:

- could improve comparison fidelity in some workout shapes

Readiness:

- medium

Why not first:

- no current evidence says the QA-green comparison layer is the main blocker
- another refinement pass would improve internals more than user discovery
- the existing comparison is already sufficient to justify better surface-level visibility

## Chosen Next Slice

### Calendar evidence markers linked to the existing `Feedback` surface

The next highest-leverage slice should be:

- add bounded evidence markers to the saved-mode calendar/home workout-day surfaces
- make those markers reflect already-saved Garmin evidence and feedback state
- use them only as discoverability cues that point into the existing workout-detail `Feedback` tab

This should come next because it increases product value without expanding system scope:

- no new evidence source
- no new AI behavior
- no new ingestion path
- no new comparison engine

It simply makes the already-shipped Garmin capability legible from the product’s primary navigation surface.

## Scope

### 1. Add one bounded marker vocabulary for workout days

The calendar should gain one narrow, explicit marker language for Garmin/evidence state.

Recommended first bounded states:

- no marker:
  no saved evidence or feedback exists for that workout day
- evidence attached:
  Garmin evidence exists, but comparison or AI may still be partial or unavailable
- feedback ready:
  Garmin evidence plus deterministic comparison exist, and the saved `Feedback` surface has meaningful readback

If the implementation needs fewer first-step states, prefer fewer.

### 2. Keep markers informational, not interpretive

Markers should answer only:

- does this day have evidence?
- does this day have feedback ready?

They should not encode:

- performance quality
- plan success/failure
- AI recommendation severity

Those meanings belong inside workout detail, not in the calendar cell.

### 3. Keep workout detail as the canonical destination

Calendar markers should link users to the existing workout route.

The calendar should not become a second feedback-reading surface. It should remain:

- a planner
- a navigator
- a summary surface

### 4. Extend the saved-mode read seam minimally

This slice should add only the minimum marker-ready data needed for calendar rendering.

Recommended direction:

- one minimal feedback/evidence summary field on each saved-mode workout in the normalized snapshot
- derived from existing persisted Garmin feedback truth
- no full comparison payload on the calendar seam

### 5. Keep preview and rest-day behavior honest

- preview mode should not imply evidence persistence
- rest days should not pretend Garmin feedback is expected
- marker absence must remain a normal state, not an error state

## Non-Goals

- no screenshot OCR or screenshot upload
- no Garmin sync or Strava sync
- no historical AI backfill/regeneration in this slice
- no richer plan-adjustment or adaptive recommendation seam
- no new comparison logic
- no calendar-level AI summaries
- no second feedback summary panel on home

## Dependencies Already Satisfied

- Garmin FIT/ZIP upload is live
- deterministic parsing is live
- normalized actual metrics persist canonically
- deterministic comparison persists canonically
- bounded AI interpretation persists canonically
- the dedicated `Feedback` tab is live and QA-green
- the calendar already owns day-level status rendering and navigation
- the workout route already provides the canonical feedback destination

## Truth Boundaries To Preserve

### 1. Calendar markers must remain summary-only

- they indicate existence/readiness of feedback
- they do not replace workout-detail evidence truth

### 2. Deterministic and AI truth stay off the calendar cell body

- deterministic comparison remains primary in `Feedback`
- AI recommendation remains secondary in `Feedback`
- the calendar should not collapse those layers into one opaque icon meaning

### 3. Manual completion truth stays separate

- `completed`, `partial`, and `skipped` remain workout-log status semantics
- evidence markers must not replace or blur those existing completion markers

### 4. One canonical destination remains

- the workout-detail `Feedback` tab remains the only detailed evidence surface
- the calendar should point to it, not compete with it

## Why Not The Other Options Yet

### Why not screenshot evidence yet

Screenshot evidence still broadens ingestion before the current Garmin path is fully surfaced through the main product.

The better order is:

1. make current Garmin value visible from the calendar
2. confirm the product meaning is clear
3. only then add a second evidence source

### Why not historical AI backfill / regeneration yet

Backfill/regeneration is useful, but it mostly improves historical consistency and operational maintenance.

The next better step is to improve current product discoverability of the live feedback path. The product should first make today’s and this week’s evidence easier to notice before it invests in reprocessing the past.

### Why not a richer recommendation-only adjustment seam yet

The AI layer just became live and bounded.

Pushing straight into richer adjustment semantics would expand recommendation authority too early. The safer next move is to expose the existing feedback better, observe it, and keep the trust boundary conservative.

### Why not another comparison refinement yet

The deterministic layer is already QA-green and sufficient for visible product value.

If a concrete trust problem appears later, a refinement pass can follow. Right now discoverability is the more meaningful gap.

## Risks

### 1. Marker-overload risk

If the calendar gains too many new symbols or states, it will become harder to read rather than easier.

Mitigation:

- keep the marker vocabulary minimal
- prefer one or two bounded states first

### 2. Meaning-confusion risk

Users may confuse completion markers with evidence markers.

Mitigation:

- keep visual treatment distinct from check/dash/cross completion semantics
- document one clear legend or affordance only if needed

### 3. Data-weight risk

If the calendar seam pulls full feedback payloads into home rendering, the route will get heavier than necessary.

Mitigation:

- add only minimal marker-ready summary fields to the normalized snapshot
- keep full evidence and AI payloads on workout detail only

### 4. Honest-empty-state risk

Many workouts will still have no Garmin evidence at all.

Mitigation:

- treat marker absence as normal
- avoid wording or visuals that imply missing evidence is a failure

## QA Plan

### Must-pass

- saved-mode calendar shows marker state only when canonical feedback/evidence truth exists
- clicking a marked workout day still leads into the same workout-detail route and `Feedback` tab destination
- existing completion markers remain intact and readable
- workouts without evidence remain unmarked and visually normal
- preview mode does not show fake persisted evidence markers

### Should-pass

- rest days do not show misleading evidence markers
- marker state stays coherent after a fresh Garmin upload and reload
- marker state stays coherent after a saved workout already has AI feedback
- week/month switching preserves marker correctness

### Regression watch

- no breakage to home/calendar navigation
- no breakage to existing completion-state rendering
- no accidental loading of full feedback payload into calendar cells
- no breakage to workout-detail `Feedback` ownership

## Exit Criteria

- the saved-mode calendar can indicate which workout days have Garmin-backed feedback
- the marker semantics are bounded and do not pretend to summarize workout quality
- the workout-detail `Feedback` tab remains the canonical detailed destination
- no new evidence path or recommendation subsystem was introduced
- users can discover the existing Garmin + AI feedback capability from the main planning surface

## Next Recommended Role

QA

## Suggested Next Step

Run a saved-mode Safari regression pass over month view, week view, and a current-day workout with Garmin evidence to confirm marker hierarchy stays secondary to completion status and that marker clicks consistently land in `?tab=feedback`.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the next Garmin/product slice after the QA-green bounded AI interpretation layer inside `Feedback`.

### Key Decisions

- The next slice should be bounded calendar evidence markers that point into the existing `Feedback` surface.
- Screenshot evidence, historical AI backfill/regeneration, richer adjustment semantics, and another comparison refinement pass should wait.

### Current State

- Garmin FIT/ZIP upload is live.
- Deterministic comparison is live.
- Bounded AI interpretation is live.
- The dedicated workout-detail `Feedback` tab is the canonical detailed evidence surface.
- Saved-mode home and calendar now render bounded `Evidence` / `Feedback` markers that point into that tab.

### Constraints

- Calendar markers must remain summary-only.
- Full evidence, deterministic comparison, and AI interpretation payloads must stay in workout detail.
- Existing completion semantics must remain separate from evidence markers.

### Risks / Open Questions

- Marker semantics must stay visually distinct from check/dash/cross completion markers.
- The saved-mode snapshot must be extended minimally to avoid making the home/calendar seam heavier than necessary.

### Next Recommended Role

QA

### Suggested Next Step

Verify month view, week view, and the current-day home hero in Safari, making sure evidence markers stay visually secondary to completion state and route into `?tab=feedback`.
```

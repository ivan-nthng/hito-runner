Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Stale / archive with note.

Reason: This prioritization artifact is historical and has been superseded by later decisions and implemented tracks.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Superseded By 2026-05-14 Refresh

Owner

Architect

Last Updated

2026-05-13

Context

The current product has completed its most important stabilization and simplification work:

- auth redirect-origin fix is implemented
- text-first onboarding is live
- advanced JSON import is secondary and simplified
- first-day apply behavior is simplified and honest
- Garmin FIT/ZIP upload is live
- deterministic comparison is live
- bounded recommendation is live
- app-wide simplification is complete and archived

The next track should now add real user value, not more cleanup churn. It should extend the current trusted loop:

`planned workout -> actual evidence -> deterministic comparison -> bounded recommendation`

What Has Real User Value Now

- more truthful workout feedback from evidence the product already supports
- clearer comparison of what the run actually matched or missed
- broader evidence reach only if it lands in the same canonical feedback loop

Candidate Tracks

1. Richer comparison model
- Extend the current deterministic comparison beyond coarse session facts.
- Candidate additions:
  warm-up / main run / cooldown treatment
  duration / distance / pace / HR only where the planned workout and imported evidence both support honest comparison

2. Screenshot OCR for workout evidence
- Add screenshot-based evidence ingestion for Strava or Garmin screenshots.
- Reuse the same downstream contract:
  evidence -> normalized actual metrics -> comparison -> recommendation

3. Similar-run comparison
- Add a bounded historical context layer:
  compare this run not only to plan, but to a prior similar session

4. Broader plan-adjustment / plan-note workflow
- Escalate recommendation into whole-program or next-plan guidance

5. Text-first conflict-path QA follow-up
- Validate `Replace today` and safe-default apply behavior again only if there is evidence of live friction or regressions

6. Tiny Garmin marker saved-state QA follow-up
- Re-check bounded feedback-marker persistence only if there is evidence of drift between home/calendar and workout-detail `Feedback`

Priority Order

1. Richer comparison model
2. Screenshot OCR for workout evidence
3. Similar-run comparison

Recommended Next Track

Richer comparison model

Why this is next

- It improves the quality of the product’s current live truth rather than adding a second evidence path too early.
- It benefits every current Garmin evidence user immediately.
- It gives screenshot OCR a stronger target contract later, so OCR does not land on top of a too-shallow comparison model.
- It stays aligned with the product boundary:
  deterministic comparison remains primary
  AI interpretation remains secondary

What this next track should cover

- one clearer support matrix for which planned-vs-actual signals are truly comparable
- step-aware comparison for simple structured workouts when the plan and parsed Garmin data line up honestly
- bounded use of HR and pace only where:
  the plan expresses them canonically
  the Garmin result can supply them clearly enough
  the product can explain the comparison without pretending medical or coaching authority

What this next track should not try to do

- no screenshot OCR yet
- no provider sync
- no automatic plan editing
- no broader adaptation workflow
- no historical similar-run layer in the same slice

What Waits

Screenshot OCR for workout evidence

- Should wait until the richer comparison target is defined.
- Reason:
  OCR extraction quality should land against a stronger canonical comparison contract, not force that contract to be invented later around noisy evidence.

Similar-run comparison

- Should wait until the current plan-vs-actual comparison model is deeper.
- Reason:
  adding a second comparison axis now would complicate interpretation before the primary plan-vs-run axis is mature enough.

Broader plan-adjustment / plan-note workflow

- Should explicitly wait.
- Reason:
  the product still does not want to overclaim coaching authority or silently mutate the plan from bounded feedback.

Text-first conflict-path QA follow-up

- Should wait unless live evidence shows regressions.
- Reason:
  the current-state and changelog show that the policy was simplified, implemented, and cleaned up already; this is now a verification tail, not the next product track.

Tiny Garmin marker saved-state QA follow-up

- Should wait unless live evidence shows inconsistency.
- Reason:
  the bounded marker seam is already implemented and described as live in home, calendar, and workout detail.

What Is Tempting But Premature

- screenshot OCR before the deeper comparison contract exists
- similar-run comparison before the main comparison loop is mature
- turning bounded recommendation into plan adjustment
- treating QA tails as if they are the next main product track

Risks

- A richer comparison model can become overbuilt if it tries to support every workout shape at once.
- HR and pace comparison can become misleading if support rules are not explicit and conservative.
- If the track broadens into OCR or plan adjustment, it will reintroduce multiple moving parts at once and weaken the current one-path model.

Exit Criteria

- the team has one explicit next-track decision
- the top 3 next tracks are ordered clearly
- the immediate next track improves live product value without adding a parallel architecture path
- lower-value or premature tracks are explicitly deferred

Next Recommended Role

FRONTEND

Suggested Next Step

Use the refreshed 2026-05-14 track plan as the current source. Backend slice 1 has now implemented deterministic support-matrix and segment-group truth; Frontend can decide whether to expose those facts in `Feedback`.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Completed one canonical prioritization pass for the next product track after the app-wide simplification work and selected richer deterministic comparison as the next highest-value slice.

### Key Decisions

- The best immediate next track is richer comparison model depth, not screenshot OCR.
- Screenshot OCR, similar-run comparison, and broader plan-adjustment workflow should all wait.

### Current State

- The live product already has text-first onboarding, safe plan apply, Garmin FIT/ZIP upload, deterministic comparison, bounded recommendation, and simplified runner-facing surfaces.
- The next meaningful value now comes from improving the depth of current comparison truth rather than adding a second evidence path immediately.
- This plan has been superseded by the 2026-05-14 refresh; the first backend richer-comparison slice is now implemented.

### Constraints

- Keep deterministic comparison primary and AI secondary.
- Do not broaden into OCR, sync, or plan-adjustment automation in the same slice.

### Risks / Open Questions

- Comparison depth can sprawl if every workout shape or signal is attempted at once.
- HR and pace should only enter where the support matrix is explicit and honest.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Use the 2026-05-14 refreshed plan and inspect the new deterministic `supportMatrix` plus `segmentSummary` payload fields for a possible small `Feedback` readback slice.
```

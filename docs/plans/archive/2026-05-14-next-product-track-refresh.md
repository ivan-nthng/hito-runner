Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Stale / archive with note.

Reason: This prioritization artifact has been superseded by later completed product tracks and current-state documentation.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Frontend Readback Slice Implemented

Owner

Frontend

Last Updated

2026-05-15

Context

Since the last prioritization pass, the product has closed another meaningful lifecycle gap:

- app-wide simplification is complete
- auth redirect and production session issues are fixed
- saved-mode plan-management is now real:
  `Open plan` modal
  delete-plan archival semantics
  saved-mode freeform creation
  saved-mode chosen-start-date JSON import

This means the product no longer needs another immediate management or cleanup track. The next track should again maximize runner-facing value inside the existing trusted loop:

`planned workout -> actual evidence -> deterministic comparison -> bounded recommendation`

Current Product State

What is now true:

- text-first onboarding is live
- saved-mode freeform plan creation is live
- advanced JSON import is secondary and uses chosen-start-date apply
- active-plan lifecycle is clearer and safer
- Garmin FIT/ZIP upload is live
- deterministic comparison is live
- bounded recommendation is live
- feedback markers are live

What has not changed:

- comparison depth is still intentionally conservative
- screenshot OCR is still not live
- similar-run comparison is still not live
- broader plan-adjustment workflow is still not live

What Is Already Good Enough

- auth/session stability for current product scope
- saved-mode plan creation/import/delete lifecycle
- current plan-management surface for v1
- Garmin upload entry, feedback containment, and bounded recommendation framing

What Has Immediate Runner Value

- deeper and more trustworthy workout comparison against the planned session
- better explanation of what the uploaded run matched or missed
- more useful interpretation of current evidence before broadening into new evidence types

Implementation Update

- Backend slice 1 is implemented on the existing deterministic comparison payload.
- `difference_payload.supportMatrix` now records which signals are compared, missing, not applicable, or unsupported.
- `difference_payload.segmentSummary` now groups ordered simple planned-vs-actual steps into warm-up, main, cooldown, recovery, or other duration summaries when that comparison is trustworthy.
- Pace and heart-rate remain explicit `unsupported` support-matrix entries until planned targets and Garmin actual metrics share one normalized comparable unit.
- Frontend readback now exposes those facts in workout-detail `Feedback` through a compact `What this review checked` section and a calm `Workout structure` segment summary when available.
- Screenshot OCR, similar-run comparison, and plan-adjustment workflow remain deferred.

Candidate Tracks

1. Richer comparison model

- deepen the deterministic comparison contract around workout structure and comparable signals
- candidates:
  warm-up / main run / cooldown
  HR / pace / duration only where honest support exists

2. Screenshot OCR for workout evidence

- allow screenshot-based evidence ingestion for runners who do not have FIT/ZIP files available

3. Similar-run comparison

- add bounded historical context against prior comparable sessions

4. Broader plan-adjustment / plan-note workflow

- escalate feedback into whole-program guidance or next-plan change suggestions

5. Remaining auth or plan-management follow-up

- only if a live defect appears; not as the next default product track

Updated Priority Order

1. Richer comparison model
2. Screenshot OCR for workout evidence
3. Similar-run comparison

Recommended Next Track

Richer comparison model

The earlier priority still holds.

Why it still wins now

- The product has now stabilized enough that the main remaining value gap is feedback depth, not lifecycle clarity.
- It improves the value of every current Garmin evidence upload immediately.
- It gives screenshot OCR a better downstream target later.
- It keeps the system on one path:
  deterministic comparison first
  bounded recommendation second

What Waits

Screenshot OCR for workout evidence

- Wait until the richer comparison support matrix is defined.
- Reason:
  OCR should land on a stronger comparison contract, not force one into existence from noisy extraction.

Similar-run comparison

- Wait until the primary plan-vs-actual model is deeper.
- Reason:
  historical comparison is a second axis and should not mature before the first axis is strong.

Broader plan-adjustment / plan-note workflow

- Explicitly wait.
- Reason:
  the product still avoids overclaiming coaching authority, and the current recommendation layer should not silently become plan mutation.

Remaining auth or plan-management follow-up

- Treat as maintenance only.
- Reason:
  those tracks are now materially complete enough for current product scope.

What Is Still Tempting But Should Wait

- screenshot OCR before the comparison contract is stronger
- similar-run comparison before the base comparison loop is deep enough
- turning recommendation into plan-adjustment workflow
- reopening saved-mode lifecycle work without evidence of a live gap

Risks

- Richer comparison can sprawl if it tries to support every workout structure at once.
- Pace and HR can become misleading if “supported” vs “not comparable” rules are not explicit.
- If the team jumps to OCR too early, product complexity increases before core comparison truth matures.

Exit Criteria

- [x] the refreshed top 3 next tracks are explicit
- [x] the immediate next track is confirmed against the new saved-mode plan-management state
- [x] cleanup or lifecycle tails are explicitly removed from next-track priority unless live defects appear
- [x] first backend richer-comparison slice adds deterministic support-matrix and segment-group truth
- [x] frontend decides whether and how to expose segment-group/support-matrix facts in the visible `Feedback` surface

Next Recommended Role

QA

Suggested Next Step

Verify the enriched comparison readback in the workout-detail `Feedback` surface, confirming support-matrix and segment-summary facts stay secondary to the deterministic verdict and pace/heart-rate remain explicitly unsupported.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Completed a short prioritization refresh after the saved-mode plan-management track, confirmed richer deterministic comparison as the next product track, implemented the first backend slice, and exposed the new support-matrix and segment-summary facts in `Feedback`.

### Key Decisions

- The top priority remains richer comparison model depth.
- Screenshot OCR and similar-run comparison still wait behind that deeper comparison contract.
- Slice 1 adds support-matrix and segment-group truth to the existing comparison payload instead of creating a parallel richer-comparison model.

### Current State

- Product lifecycle and management work is now materially complete enough: auth/session stability, saved-mode plan management, chosen-start-date import, and simplification are in place.
- The biggest remaining runner-value gap is comparison depth inside the existing Garmin evidence loop.
- The backend now persists `supportMatrix` and `segmentSummary` inside deterministic comparison `difference_payload`.
- The frontend now reads those fields back through a compact `What this review checked` section and a `Workout structure` grouping when segment data is trustworthy.
- Pace and heart-rate remain explicitly unsupported in deterministic comparison.

### Constraints

- Keep deterministic comparison primary and recommendation secondary.
- Do not turn this next slice into OCR rollout or broader plan-adjustment workflow.

### Risks / Open Questions

- Frontend should avoid over-surfacing technical matrix language if it makes `Feedback` feel diagnostic.
- HR and pace must remain conservative and explicitly unsupported until a later backend slice normalizes comparable units.

### Next Recommended Role

QA

### Suggested Next Step

Run Safari QA on workout-detail `Feedback` with a saved Garmin comparison that includes `supportMatrix` and `segmentSummary`, verifying unsupported pace/heart-rate remain quiet and deterministic comparison stays primary.
```

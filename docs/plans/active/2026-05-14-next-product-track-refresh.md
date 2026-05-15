Status

In Progress

Owner

Architect

Last Updated

2026-05-14

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

- the refreshed top 3 next tracks are explicit
- the immediate next track is confirmed against the new saved-mode plan-management state
- cleanup or lifecycle tails are explicitly removed from next-track priority unless live defects appear

Next Recommended Role

BACKEND

Suggested Next Step

Write the implementation-ready richer-comparison plan that freezes the support matrix for structured workout segments and signal types, then keep OCR and historical comparison behind that contract.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Completed a short prioritization refresh after the saved-mode plan-management track and confirmed that richer deterministic comparison remains the next highest-value product track.

### Key Decisions

- The top priority remains richer comparison model depth.
- Screenshot OCR and similar-run comparison still wait behind that deeper comparison contract.

### Current State

- Product lifecycle and management work is now materially complete enough: auth/session stability, saved-mode plan management, chosen-start-date import, and simplification are in place.
- The biggest remaining runner-value gap is comparison depth inside the existing Garmin evidence loop.

### Constraints

- Keep deterministic comparison primary and recommendation secondary.
- Do not turn this next slice into OCR rollout or broader plan-adjustment workflow.

### Risks / Open Questions

- Comparison depth can sprawl if too many workout shapes or signals are attempted in the first slice.
- HR and pace must stay conservative and explicitly supported-or-not-supported.

### Next Recommended Role

BACKEND

### Suggested Next Step

Prepare the implementation-ready richer-comparison plan, defining which workout segment shapes and which signals are supported first and which remain explicitly not comparable.
```

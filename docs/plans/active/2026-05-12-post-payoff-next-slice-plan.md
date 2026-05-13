## Status

Active — implemented

## Owner

Architect

## Last Updated

2026-05-12

## Current Slice Note

The first recommendation-surface refinement slice is now implemented in workout-detail
`Feedback`.

The bounded AI layer still stays secondary to deterministic comparison, but the readback now leads
with a clearer runner-facing next-step note, keeps supporting explanation below it, and translates
mixed-evidence caution into plainer `Use with care` wording instead of more technical section
framing.

The immediate follow-up cleanup is now implemented too:

- `Feedback` no longer uses the heavy outer evidence-card treatment
- attached Garmin evidence is shown explicitly and can be removed through the saved-mode seam
- comparison coverage/confidence/checks are merged into one calmer strip
- signal rows and caveats now use lighter divided layout and plainer wording

## Context

The near-upload payoff summary in workout-detail `Feedback` is now QA-green.

The current Garmin-backed product loop is now coherent:

- `Log result` remains manual-first
- `Log result` invites the runner into Garmin-backed deeper review
- `Feedback` owns the canonical detailed evidence flow
- the upload area now gives a compact state-aware payoff summary
- deterministic comparison is live
- bounded AI interpretation is live

The next question is no longer “how do we get the runner into Garmin feedback?” The next question
is “how do we make the recommendation layer itself easier to use without over-expanding product authority?”

This plan is grounded in:

- the current live `WorkoutFeedbackPanel`
- the current deterministic comparison and AI readback inside `src/components/CompletionPanel.tsx`
- the current product truth that screenshot OCR, similar-run comparison, and broader plan-adjustment
  workflow remain later

## Candidate Evaluation

### Screenshot evidence path

Strength:

- broadens evidence input for users who do not have FIT/ZIP files

Risk:

- introduces a second evidence type, extraction uncertainty, and more explanation complexity
- broadens the system before the current Garmin-first feedback loop is fully matured

Architectural fit:

- later

### Similar prior-run comparison

Strength:

- could add motivating context and a richer sense of progress later

Risk:

- needs stronger history semantics and similarity rules
- adds another interpretation layer before the current recommendation layer is fully legible

Architectural fit:

- later

### Broader plan-adjustment / sidebar plan-note workflow

Strength:

- could connect one workout result to whole-program guidance

Risk:

- escalates product authority quickly
- risks turning bounded workout feedback into implicit adaptive planning

Architectural fit:

- later

### Another feedback-surface refinement slice

Strength:

- could continue polish work on the same surface

Risk:

- too vague if it is not tied to a concrete remaining problem

Architectural fit:

- only justified if the target is specific

### Small recommendation-surface refinement

Strength:

- directly improves the least-mature live part of the Garmin experience
- keeps the system inside the current evidence/comparison/recommendation architecture
- can make the bounded AI layer more understandable and actionable without changing backend truth

Risk:

- if pushed too far, it can accidentally inflate AI authority
- if scoped too broadly, it can drift into plan-adjustment workflow

Architectural fit:

- strongest

## Chosen Next Slice

Small recommendation-surface refinement inside workout-detail `Feedback`.

This should come next because the upload path, payoff summary, and factual comparison are now in a
good place, while the current recommendation readback is still the least product-mature part of the
surface.

Today it is live and bounded, but it still reads more like a technical interpretation block than a
clean runner-facing “what this likely means” layer. Improving that last layer gives better product
value without introducing a new evidence type or broader adaptive workflow.

## Scope

This slice should:

- refine only the presentation and framing of the existing bounded recommendation layer
- make the recommendation section read more clearly as:
  - what mattered
  - what to do next
  - what the current limits are
- reduce technical or ambiguous labels in the AI section
- make the next-workout guidance easier to scan
- keep deterministic comparison visibly primary above it

Recommended product direction:

- recommendation should read as one small, bounded runner aid
- the section should feel more actionable and less diagnostic
- `Current limits` should explain uncertainty more clearly than a numeric count or internal-feeling label

Smallest viable first implementation slice:

- keep the current backend insight payload unchanged
- relabel and reframe the recommendation readback block only
- improve section titles, ordering, and the visible explanation of caution/limits

Example direction:

- replace abstract section labels like `Difference explanation` with clearer user-facing phrasing
- make the main next-step guidance visually dominant within the recommendation block
- express limits as plain-language caution instead of as a quasi-technical stat

## Non-Goals

- do not add screenshot OCR
- do not add historical similar-run logic
- do not add automatic plan adjustment
- do not change deterministic comparison logic
- do not expand AI generation authority or let it edit plans
- do not move recommendation into sidebar `Plan note`
- do not add a second recommendation surface outside `Feedback`

## Truth Boundaries To Preserve

- deterministic comparison remains the primary factual layer
- AI recommendation remains additive and secondary
- the recommendation must not overwrite `workout_logs`
- the recommendation must not silently change future workouts or the active plan
- `Feedback` remains the only detailed evidence/comparison/recommendation surface
- sidebar `Plan note` must not become a hidden second recommendation system in this slice

## Why Not The Other Options Yet

### Why not screenshot evidence path

The current bottleneck is not missing evidence types. It is making the live Garmin feedback loop
feel fully polished and understandable before broadening input complexity.

### Why not similar prior-run comparison

It adds another interpretive layer before the current recommendation layer is mature enough on its
own. Today’s workout against today’s plan still deserves the clearer first pass.

### Why not broader plan-adjustment / sidebar plan-note workflow

That would raise product authority too quickly. The current AI layer is intentionally bounded and
should stay at workout-level interpretation until that surface is more stable and trustworthy.

### Why not a generic feedback-surface refinement pass

The next real gap is specific, not broad: the bounded recommendation block is still the weakest
live part of the surface. A generic refinement pass would be easier to overbuild.

## Dependencies Already Satisfied

- Garmin FIT/ZIP upload is live
- richer `Log result` invitation is verified
- near-upload payoff summary is verified
- deterministic comparison is live
- bounded AI interpretation is live
- `Feedback` is already the canonical detailed evidence surface
- calendar feedback markers already route users into the same surface

## Risks

- the refinement could accidentally make AI feel more authoritative than intended
- better wording could still remain too verbose if it tries to explain too much
- changing labels without changing hierarchy might not improve scanability enough
- recommendation emphasis could start competing visually with the factual comparison above

## QA Plan

Must verify:

- the recommendation section reads more clearly than before for a normal runner
- the next-step guidance is easier to scan than the surrounding interpretation copy
- deterministic comparison still reads as primary and remains visually above the recommendation
- caution and uncertainty remain honest and more understandable than before
- no new wording implies automatic plan changes or hidden coaching authority
- no new UI creates a second recommendation ownership path outside `Feedback`

Suggested first QA sweep:

- workout with full comparison + AI recommendation ready
- workout with comparison ready but recommendation limited or cautious
- workout with partial/unclear evidence
- confirm the recommendation block stays useful without overstating certainty

## Exit Criteria

- the recommendation block reads as a bounded runner-facing aid, not a technical appendix
- the main next-step guidance is visually and semantically clearer
- deterministic comparison still clearly owns factual truth
- uncertainty/caution reads plainly and honestly
- QA confirms the refinement improved clarity without expanding product promise

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement the smallest viable slice first: refine only the presentation, wording, and hierarchy of
the existing recommendation readback block inside `Feedback`, without changing backend insight
generation or adding any new evidence or adjustment systems.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the next post-payoff Garmin slice as a bounded recommendation-surface refinement inside the
existing workout-detail `Feedback` tab.

### Key Decisions

- Keep the next slice inside the current `Feedback` surface.
- Improve the recommendation readback before broadening into screenshot evidence, similar-run comparison, or plan adjustment.

### Current State

- FIT/ZIP upload is live.
- Deterministic comparison is live.
- Bounded AI interpretation is live.
- The richer `Log result` invitation is verified.
- The near-upload payoff summary is verified.

### Constraints

- Do not change deterministic comparison truth.
- Do not expand AI authority.
- Do not create a second recommendation surface.

### Risks / Open Questions

- The recommendation block could still feel too technical if the relabeling is too light.
- The block could feel too authoritative if the reframing is too strong.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Refine the existing recommendation readback block in `Feedback` so the next-step guidance is more
scannable, the section labels are more human, and current limits are explained more plainly.
```

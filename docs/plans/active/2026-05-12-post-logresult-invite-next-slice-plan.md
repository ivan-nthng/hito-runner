## Status

Active — implemented

## Owner

Architect

## Last Updated

2026-05-12

## Current Slice Note

This slice is now implemented: the near-upload area inside `Feedback` uses a compact state-aware
payoff summary instead of operational upload plumbing text.

## Context

The richer Garmin invitation in `Log result` is now verified live.

The current implemented product now already has a coherent core flow:

- `Log result` stays manual-first
- `Log result` invites the runner into Garmin-backed deeper review
- `Feedback` remains the canonical detailed evidence, comparison, and recommendation surface
- deterministic comparison is live
- bounded AI interpretation is live

The next question is not where upload should live. That question is now settled enough for the
current phase. The next question is how quickly the runner feels the payoff after uploading.

This plan is grounded in:

- the current verified richer `Log result` invitation
- the live `Feedback` upload/readback surface in `src/components/CompletionPanel.tsx`
- the current product truth that screenshot OCR, similar-run comparison, and broader plan
  adjustment are all still later

## Candidate Evaluation

### Short post-upload summary/payoff near the upload action

Strength:

- improves the immediate reward after the runner uploads a file
- makes the Garmin step feel useful faster
- strengthens the connection between upload and the deeper comparison sections below
- stays fully inside the existing canonical `Feedback` surface

Risk:

- if written too technically, it will not feel like a real payoff
- if written too strongly, it could overstate what the system actually knows

Architectural fit:

- strongest
- it uses existing truth and requires no new storage or evidence type

### Screenshot evidence path

Strength:

- broadens evidence input for runners who do not have FIT/ZIP files

Risk:

- introduces a second evidence type, extraction uncertainty, and more explanation burden
- broadens the system before the Garmin-first path feels fully polished

Architectural fit:

- not yet

### Similar prior-run comparison

Strength:

- could add motivating historical context later

Risk:

- introduces a higher-level interpretation layer
- depends on a richer evidence history and stronger similarity rules

Architectural fit:

- later

### Broader program-adjustment / sidebar plan-note workflow

Strength:

- could connect one bad or good run to the larger program

Risk:

- raises product authority too quickly
- starts to blur workout feedback and program management before the workout-level flow is fully mature

Architectural fit:

- later

### Another feedback-surface refinement slice

Strength:

- could continue polish work

Risk:

- vague cleanup without a concrete product payoff
- risks refactoring for feel rather than fixing the next actual gap

Architectural fit:

- only worthwhile if it is anchored to the post-upload payoff problem specifically

## Chosen Next Slice

Short post-upload summary/payoff near the upload action.

This should come next because the user can now discover the Garmin path naturally from
`Log result`, but the first visible response after upload is still more operational than rewarding.
The next highest-leverage improvement is a compact, plain-language summary near the upload area
that tells the runner what Hito successfully understood and why the lower sections matter.

This keeps the product small:

- same evidence type
- same upload location
- same `Feedback` ownership
- better payoff and orientation

## Scope

This slice should:

- improve the upload-result summary block near the Garmin upload action inside `Feedback`
- ensure the summary reads as compact plain-language payoff in one or two short sentences
- explain what Hito successfully parsed and what the runner can do next
- distinguish clearly between:
  - upload attached but not yet comparable
  - parsed actual metrics ready
  - comparison ready
  - recommendation ready

Recommended product role:

- the summary is not the full analysis
- it is the fast “what happened and what’s ready now” layer immediately after upload
- the detailed factual comparison and recommendation remain below

Smallest viable first implementation slice:

- replace the current near-upload technical messaging with a short state-aware human summary
- keep the existing detailed sections unchanged

Example product direction:

- “Your Garmin file was attached successfully. We parsed the run and the detailed comparison is ready below.”
- “Your Garmin file is attached. We parsed the run, but only part of the workout could be compared so far.”

## Non-Goals

- do not add screenshot OCR
- do not add a second upload path
- do not move detailed comparison into the summary block
- do not redesign deterministic comparison payloads
- do not expand AI authority
- do not add similar historical-run logic
- do not add broader program-adjustment workflow

## Truth Boundaries To Preserve

- `Feedback` remains the only detailed evidence/comparison/recommendation surface
- the summary near upload is only a compact orientation layer, not a new truth source
- deterministic comparison remains the primary factual source of truth
- AI remains additive and secondary
- upload success must not imply full comparison success when comparison is partial or unavailable
- screenshot remains clearly later-only

## Why Not The Other Options Yet

### Why not screenshot evidence path

It broadens the product before the Garmin-first path is fully polished. The current bottleneck is
not missing evidence types. It is the immediate clarity of the live evidence path.

### Why not similar prior-run comparison

It adds interpretation depth before the current upload-to-feedback payoff loop is as strong as it
should be. The runner should first understand today’s run against today’s plan cleanly.

### Why not broader program-adjustment / sidebar plan-note workflow

That moves the product into higher-authority guidance. It should wait until the workout-level
feedback experience feels fully trustworthy and legible.

### Why not a generic feedback-surface refinement pass

The current next gap is specific, not vague: the runner needs a faster, more human payoff near the
upload action. A broad refinement pass would be less focused and easier to overbuild.

## Dependencies Already Satisfied

- Garmin FIT/ZIP upload is live
- the richer `Log result` Garmin invitation is verified
- `Feedback` is the canonical detailed evidence surface
- deterministic comparison is live
- bounded AI interpretation is live
- feedback markers already route saved-mode users into `Feedback`
- current `Feedback` hierarchy is already cleaned up and QA-green

## Risks

- the new summary could accidentally repeat too much of the detailed comparison below
- the summary could become too vague to help
- the summary could over-promise when comparison coverage is incomplete
- too many state variants could make the copy brittle if not kept bounded

## QA Plan

Must verify:

- no-evidence state still explains upload clearly
- successful upload shows a compact plain-language payoff near the upload area
- attached-but-not-ready states do not overclaim comparison completion
- parsed/comparison-ready states point naturally into the detailed sections below
- AI recommendation remains visually and semantically secondary
- rest-day and preview-mode behavior remain honest and unchanged

Suggested first QA sweep:

- saved-mode workout with no evidence
- upload a valid Garmin file
- verify the near-upload summary updates immediately
- verify the summary remains consistent after route invalidate/reload
- verify partial or failed parse states still read honestly

## Exit Criteria

- the near-upload summary reads as a short human payoff, not technical plumbing
- the runner can understand what upload produced without scanning the whole page
- the summary never overstates comparison or AI readiness
- `Feedback` still owns all detailed evidence, comparison, and recommendation truth
- QA confirms the summary improves clarity without duplicating the lower sections

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement the smallest viable slice first: replace the current near-upload technical messaging in
`Feedback` with a compact state-aware payoff summary that tells the runner what was parsed and what
is ready below.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the next post-invitation Garmin slice as a compact post-upload payoff summary near the
upload action inside `Feedback`.

### Key Decisions

- Keep `Feedback` as the canonical detailed evidence surface.
- Improve the immediate runner payoff after upload before adding new evidence types or broader guidance.

### Current State

- The richer Garmin invitation from `Log result` is live and verified.
- Garmin FIT/ZIP upload, deterministic comparison, and bounded AI interpretation are all live.
- Screenshot OCR, similar-run comparison, and broader program adjustment remain later.

### Constraints

- Do not create a second evidence path.
- Do not overstate what the upload produced.
- Keep deterministic comparison primary and AI secondary.

### Risks / Open Questions

- The summary needs to feel useful without duplicating the full sections below.
- State-aware copy must stay bounded and honest across upload, parse, comparison, and recommendation readiness.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Add a short state-aware payoff summary near the Garmin upload area in `Feedback` that explains in
plain language what Hito parsed and what detailed review is now available below.
```

## Status

Active — implemented

## Owner

Architect

## Last Updated

2026-05-12

## Current Slice Note

This slice is now implemented: `Log result` contains a richer state-aware Garmin invitation that
routes into the canonical `Feedback` tab without adding a second upload engine inline.

## Context

The immediate cleanup slice for `Feedback`, `Log result`, and `Intelligence` is now QA-green.

The current implemented product already has:

- live Garmin FIT/ZIP upload
- deterministic planned-vs-actual comparison
- bounded AI interpretation
- a dedicated `Feedback` tab
- saved-mode feedback markers on home and calendar
- cleaned-up wording and hierarchy across `Feedback`, `Log result`, and `/integrations`

The remaining question is not whether Garmin feedback exists. It is what the next highest-leverage
product slice should be now that the surface is cleaner and truthful.

This plan is grounded in:

- current implemented Garmin architecture
- the already-shipped `Feedback` containment model
- the QA-green cleanup that preserved `Log result` as manual truth and `Feedback` as detailed
  evidence truth

## Candidate Evaluation

### Richer upload entry from `Log result`

Strength:

- directly improves the runner’s most natural flow:
  complete workout -> optionally attach evidence -> open deeper feedback
- uses the already-live backend seam without broadening evidence types
- fixes the biggest remaining discoverability gap inside workout detail

Risk:

- can accidentally create a second competing upload workflow if ownership is not kept explicit

Architectural fit:

- strong
- it extends the existing flow without creating new truth or new storage

### Short post-upload summary/payoff near the upload action

Strength:

- gives the runner a faster emotional payoff after upload
- makes the evidence action feel less abstract

Risk:

- if done before the entry flow is clearer, it improves the second half of the experience while the
  first half is still slightly awkward

Architectural fit:

- good
- but it is more valuable after the upload entry path is settled

### Screenshot evidence path

Strength:

- expands accessible evidence input beyond Garmin FIT/ZIP

Risk:

- opens a new evidence type, new extraction uncertainty, and new product explanation burden
- would broaden the system before the Garmin-first happy path is fully smoothed

Architectural fit:

- not yet

### Similar prior-run comparison

Strength:

- could create interesting coaching context later

Risk:

- depends on a larger historical evidence base and more product judgment
- adds interpretation depth before the basic upload path is fully optimized

Architectural fit:

- later

### Broader program-adjustment / sidebar plan-note workflow

Strength:

- could turn workout-level evidence into whole-plan guidance

Risk:

- introduces a higher-authority product promise
- expands beyond the currently bounded Garmin interpretation seam

Architectural fit:

- later

## Chosen Next Slice

Richer upload entry from `Log result`.

This should come next because it improves the highest-friction step that still remains in the live
Garmin flow: the runner often reaches `Log result` first, but evidence upload still lives
primarily in `Feedback`.

The cleanup slice already made the system more understandable. The next best move is to make the
runner’s default completion flow better aligned with the real evidence architecture without
changing the architecture itself.

## Scope

This slice should:

- add a clearer, richer upload invitation inside `Log result`
- place that invitation close to the existing completion and notes flow
- make the CTA explain the payoff in plain language
- route the runner into the canonical `Feedback` experience for detailed evidence handling
- keep the current `Feedback` tab as the detailed upload, comparison, and recommendation owner

Recommended product shape:

- `Log result` becomes the primary invitation point for evidence
- `Feedback` remains the canonical detailed evidence home
- the runner should understand that upload is optional, useful, and directly connected to plan-vs-run feedback

Smallest viable first implementation slice:

- in `Log result`, add one stronger Garmin upload invitation block below notes or below the save
  region
- include one short explanation of value
- make the CTA open the existing `Feedback` tab directly instead of introducing an inline second
  upload engine

## Non-Goals

- do not add screenshot upload or OCR
- do not add a second independent upload implementation inside `Log result`
- do not move full comparison or AI interpretation back into `Log result`
- do not add broader plan-adjustment workflow
- do not add similar prior-run comparison
- do not redesign Garmin parsing, storage, or comparison logic

## Truth Boundaries To Preserve

- `workout_logs` remain the canonical manual completion truth
- Garmin FIT/ZIP remains the only live evidence source
- `Feedback` remains the canonical detailed evidence surface
- deterministic comparison remains the primary factual truth
- AI interpretation remains additive and secondary
- `Log result` may invite evidence upload, but it must not become a second detailed evidence truth surface
- screenshot language must remain clearly later-only

## Why Not The Other Options Yet

### Why not short post-upload summary first

It is useful, but it improves the payoff after upload more than the decision to upload itself.
The current bigger leverage point is getting the runner into the evidence path naturally from
`Log result`.

### Why not screenshot evidence path

It adds a second evidence source before the first one is fully optimized in the primary workout
flow. That would broaden the system faster than the product needs.

### Why not similar prior-run comparison

It adds another layer of interpretation before the base Garmin evidence path is fully smoothed,
and it needs stronger historical truth plus clearer product rules.

### Why not broader program-adjustment / sidebar plan-note workflow

That is a higher-authority product promise. It should wait until the workout-level upload and
feedback journey feels complete and trustworthy.

## Dependencies Already Satisfied

- Garmin FIT/ZIP upload is live
- deterministic comparison is live
- bounded AI interpretation is live
- dedicated `Feedback` surface is live
- feedback markers are live on home and calendar
- wording and hierarchy cleanup is QA-green
- `Log result` already contains a lightweight path into `Feedback`

## Risks

- the new `Log result` invitation could accidentally feel like a second upload flow instead of a
  guided entry into `Feedback`
- if the copy is too strong, users may think upload is required to log a workout
- if the invitation is placed too prominently, `Log result` may lose its clean manual-completion focus
- if the CTA is too subtle, the slice will not materially improve discovery

## QA Plan

Must verify:

- a runner can complete or edit a workout result without being forced into upload
- the `Log result` invitation explains the value of upload in plain language
- the CTA from `Log result` opens the correct workout `Feedback` tab reliably
- existing upload, deterministic comparison, and AI readback behavior remain unchanged once inside `Feedback`
- no duplicate or conflicting upload controls create uncertainty about where evidence truth lives
- rest days do not surface misleading upload invitations
- preview mode does not imply live Garmin capability where it does not exist

Suggested first QA sweep:

- saved-mode workout with no uploaded evidence
- save manual result in `Log result`
- use the richer upload invitation
- confirm landing in `Feedback`
- upload Garmin evidence
- confirm existing feedback output still reads correctly

## Exit Criteria

- `Log result` contains one clear higher-value evidence invitation
- runners can understand why they might upload without reading technical copy
- the CTA path from `Log result` to `Feedback` is obvious and reliable
- `Feedback` remains the only detailed evidence/comparison/recommendation owner
- no product copy implies that upload is required or that screenshot OCR already exists
- QA confirms the new invitation improves discoverability without duplicating truth

## Next Recommended Role

FRONTEND

## Suggested Next Step

Run QA on the implemented richer `Log result` invitation states, especially:

- no evidence yet
- Garmin file already attached
- Garmin feedback ready

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the next highest-leverage post-cleanup slice as a richer Garmin upload invitation from
`Log result`, while preserving `Feedback` as the canonical detailed evidence surface.

### Key Decisions

- `Log result` should become the primary invitation point for evidence upload.
- `Feedback` must remain the only detailed upload/comparison/recommendation owner.

### Current State

- Garmin FIT/ZIP upload is live.
- Deterministic comparison is live.
- Bounded AI interpretation is live.
- Feedback markers are live.
- Feedback / Log result / Intelligence cleanup is QA-green.

### Constraints

- Do not add screenshot OCR in this slice.
- Do not create a second full upload workflow inside `Log result`.
- Do not weaken the current truth boundary between manual logging and detailed evidence feedback.

### Risks / Open Questions

- The invitation could become too weak to matter or too strong and feel mandatory.
- Placement needs to improve discoverability without turning `Log result` into a second analysis page.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Add one stronger plain-language Garmin upload invitation near the completion flow in
`Log result`, with a CTA that opens the current workout’s `Feedback` tab.
```

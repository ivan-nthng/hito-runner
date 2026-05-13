# Post-Feedback Garmin Phase Plan

## Status

Implemented

## Owner

Architect

## Last Updated

2026-05-11

## Context

The Garmin evidence foundation is now materially in place and visible:

- FIT/ZIP upload is live
- deterministic Garmin parsing is live
- normalized actual metrics are live
- deterministic planned-vs-actual comparison is live
- richer deterministic comparison readback is live
- the dedicated workout-detail `Feedback` surface is live and QA-green

That means the product no longer has a containment problem. It now has a value-conversion problem.

The next slice should not add another raw capability path too early. It should turn the existing backend-owned Garmin truth into the next meaningful user-facing product value while preserving the trust boundary between:

- manual completion truth
- deterministic comparison truth
- future interpretive guidance

## Implemented Result

This slice is now implemented:

- `workout_ai_insights` persists one bounded AI interpretation linked to one deterministic comparison
- the AI input is built only from canonical backend truth:
  planned workout summary
  normalized Garmin actual metrics
  deterministic comparison payload
  current week context
  next-workout summary
- the dedicated workout-detail `Feedback` surface now reads that AI layer back below the deterministic comparison block
- AI remains additive and secondary:
  it does not parse raw FIT
  it does not replace deterministic comparison
  it does not overwrite `workout_logs`
  it does not silently mutate the active plan

## Candidate Evaluation

### 1. AI interpretation / recommendation layer

Value:

- highest next product value
- turns factual Garmin comparison into a runner-facing answer
- uses the newly stable `Feedback` surface instead of overloading `Log result`
- gives the current Garmin path a meaningful payoff before broadening evidence sources

Readiness:

- high
- deterministic comparison inputs already exist
- `Feedback` now exists as the right visible container
- the product already has an OpenAI backend seam pattern from text-to-plan authoring

Main caution:

- AI must remain interpretive only
- deterministic facts must stay primary and visible

### 2. Calendar evidence markers

Value:

- improves at-a-glance awareness on the home/calendar surface

Readiness:

- medium

Why not first:

- markers only point to value; they do not create value
- the product should first answer “what does this workout result mean?” before surfacing more evidence-state chrome across the calendar
- adding markers first would create more navigation/status language before the AI layer exists

### 3. Screenshot evidence path

Value:

- broadens evidence intake beyond Garmin export files

Readiness:

- low

Why not first:

- it creates a second ingestion path before the first one has delivered its next user-facing value
- it reopens extraction uncertainty and evidence-validation complexity
- screenshot OCR is explicitly later in the current product direction

### 4. Another comparison/refinement slice

Value:

- can improve confidence or fidelity in corner cases

Readiness:

- medium

Why not first:

- current deterministic comparison is already QA-green
- no acute trust failure is identified in the current foundation
- another refinement-only pass would improve internals more than visible product value

## Chosen Next Slice

### AI interpretation and recommendation inside the dedicated `Feedback` surface

The next highest-leverage slice should be:

- add one bounded AI interpretation layer on top of the existing deterministic Garmin comparison
- render that interpretation inside the dedicated workout-detail `Feedback` surface
- keep deterministic comparison visible as the underlying factual source

This should come next because the product now has everything it needs for a clean interpretive layer:

- trustworthy backend-owned facts
- one stable evidence destination
- one existing OpenAI server-side pattern

This is the first slice that converts the current Garmin foundation from “clear facts” into “useful guidance” without broadening the evidence system.

## Scope

### 1. Add one bounded AI interpretation layer

AI should do only these jobs:

- explain the most important planned-vs-actual differences
- summarize whether the workout appears aligned, shortened, or unclear
- recommend how to approach the next workout
- suggest whether the runner should stay the course, use caution, or consider adjustment

### 2. Keep deterministic facts visible and primary

The `Feedback` surface should continue to show:

- evidence upload state
- parsed actual metrics summary
- deterministic comparison summary
- signal-by-signal comparison truth

AI output should appear as an interpretation layer on top of those facts, not instead of them.

### 3. Persist AI output as additive feedback truth

This slice should define one additive stored interpretation record or equivalent persisted comparison-linked AI payload for the latest Garmin-backed feedback state.

The storage goal is:

- one canonical AI interpretation owned by the backend
- linked to the existing comparison/evidence truth
- safe to reload on the saved-mode `Feedback` surface

### 4. Keep scope to one workout and one next-step recommendation

This slice should stay narrow:

- one workout
- one evidence-backed interpretation
- one recommendation for the next workout

No plan-wide adaptation engine should be introduced.

## Non-Goals

- no screenshot OCR or screenshot upload
- no Garmin sync or Strava sync
- no calendar evidence markers yet
- no automatic plan rewriting
- no AI-generated replacement of deterministic comparison facts
- no broad coaching chat surface
- no multi-workout trend engine

## Dependencies Already Satisfied

- Garmin FIT/ZIP upload is live
- deterministic parsing is live
- normalized actual metrics are persisted
- `workout_comparisons` are persisted
- richer deterministic comparison payload/readback is live
- dedicated `Feedback` surface is live and QA-green
- manual `Log result` is already separated from evidence ownership
- the app already has a server-side OpenAI seam pattern in the current product architecture

## Truth Boundaries To Preserve

### 1. Deterministic truth stays primary

- parsed Garmin metrics remain the canonical actual-workout facts
- deterministic planned-vs-actual comparison remains the canonical difference engine

### 2. AI stays interpretive

- AI may explain deterministic facts
- AI may recommend what to do next
- AI must not become the source of numeric metrics, completion classification, or raw comparison truth

### 3. Manual completion truth remains separate

- `workout_logs` continue to own `completed`, `partial`, and `skipped`
- AI output must not silently overwrite manual completion state

### 4. One evidence path remains live

- Garmin FIT/ZIP remains the only live evidence source in this slice
- screenshot and provider-sync paths must remain clearly later

## Why Not The Other Options Yet

### Why not calendar evidence markers yet

Markers should wait because the product still needs the evidence surface to say something more useful than “a file exists.”

Once AI interpretation exists, markers can point to a fuller state such as:

- evidence attached
- comparison available
- interpretation ready

Before that, markers mostly add UI signal without increasing product meaning.

### Why not screenshot evidence yet

Screenshot evidence should wait because it would broaden ingestion before the current Garmin path has delivered its next actual user-facing value.

The right order is:

1. Garmin facts
2. Garmin feedback containment
3. AI interpretation on Garmin facts
4. only then consider another evidence source

### Why not another comparison-refinement slice yet

Another refinement-only pass should wait unless QA or product review exposes a concrete trust problem.

The current comparison foundation is already:

- live
- factual
- richer
- QA-green

The next gain should be user value, not internal sophistication.

## Risks

### 1. AI-over-truth risk

If interpretation copy feels more authoritative than the deterministic facts underneath, the product will blur its trust boundary.

Mitigation:

- keep deterministic comparison visible above or alongside AI output
- label AI content as interpretation or recommendation, not fact

### 2. Recommendation-quality risk

A weak or generic recommendation could make the product feel inflated rather than useful.

Mitigation:

- keep prompts bounded
- keep output short and evidence-linked
- prefer one useful next-step recommendation over broad prose

### 3. Contradiction risk

AI output may contradict the deterministic comparison summary if prompt/context assembly is sloppy.

Mitigation:

- pass only canonical deterministic facts into the interpretation step
- prohibit unsupported inference
- fail safely when evidence is insufficient

### 4. Scope-creep risk

Once AI is introduced, it becomes easy to slip into auto-adjustments, plan rewrites, or coaching-chat behavior.

Mitigation:

- keep the slice to one workout-level interpretation plus next-workout recommendation only
- explicitly defer plan-adjustment workflow

## QA Plan

### Must-pass

- saved-mode `Feedback` still shows deterministic comparison truth clearly
- AI interpretation loads only when deterministic comparison exists or is sufficient enough for bounded interpretation
- AI output does not replace or hide deterministic signals
- manual `Log result` flow remains unaffected
- reloading the workout-detail `Feedback` surface preserves the same saved interpretation for the same underlying evidence/comparison state
- insufficient-data cases fail honestly without fake confident advice

### Should-pass

- matched workouts yield concise stay-the-course guidance
- partially matched workouts yield bounded caution or adjustment language
- unclear or insufficient-data workouts yield honest uncertainty language
- rest-day or no-evidence states do not pretend AI interpretation exists

### Regression watch

- no breakage to Garmin upload
- no breakage to deterministic comparison readback
- no breakage to workout-detail tab routing
- no accidental coupling between AI interpretation and manual completion save flow

## Exit Criteria

- the `Feedback` surface shows one bounded AI interpretation layer on top of deterministic Garmin truth
- deterministic comparison remains the visible factual base
- manual completion, evidence truth, and AI interpretation remain structurally separate
- the product now gives one meaningful next-step recommendation after Garmin upload and comparison
- no new evidence source or sync path was added prematurely

## Next Recommended Role

BACKEND

## Suggested Next Step

Implement one server-side AI interpretation seam that consumes only canonical deterministic Garmin comparison truth, persists one bounded interpretation payload, and exposes it through the existing saved-mode `Feedback` surface without changing the current evidence or completion ownership model.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined the next Garmin slice after the QA-green dedicated `Feedback` containment phase.

### Key Decisions

- The next slice should be AI interpretation and recommendation on top of the existing deterministic Garmin comparison.
- Calendar evidence markers, screenshot evidence, and another refinement-only comparison pass should wait.

### Current State

- Garmin FIT/ZIP upload is live.
- Deterministic comparison is live and QA-green.
- Dedicated `Feedback` surface is live and owns evidence plus factual comparison readback.

### Constraints

- Deterministic Garmin facts must remain the primary truth.
- AI must stay interpretive only and must not replace comparison truth.
- Manual completion truth in `workout_logs` must remain separate.

### Risks / Open Questions

- AI recommendation quality must stay bounded and evidence-linked.
- Insufficient-data cases need explicit honest fallback behavior.

### Next Recommended Role

BACKEND

### Suggested Next Step

Add one bounded server-side AI interpretation seam for Garmin comparison truth, persist its output as additive feedback state, and surface it inside the existing workout-detail `Feedback` tab.
```

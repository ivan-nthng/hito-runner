Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The implemented behavior is now reflected in current docs or in newer archived closeout plans. This artifact is historical and should not drive new work by inertia.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

# Feedback UX Restructure Plan

## Status

Active — Phase 1 implemented

## Owner

Architect

## Last Updated

2026-05-12

## Current Slice Note

Phase 1 is now implemented, and the product also gained one lightweight `Log result` path into
`Feedback` without moving detailed evidence ownership away from `Feedback`.

## Context

The current Garmin-enabled workout-detail experience is functionally strong but UX-fragile.

The product already has real capability:

- live FIT/ZIP upload
- deterministic comparison
- bounded AI interpretation
- a dedicated `Feedback` surface
- a clean separation between manual completion truth and richer evidence truth

The current problem is not missing architecture. It is that the visible surfaces are still harder to understand and use than they should be.

This plan is grounded in:

- current implemented product truth
- current `Feedback` and `Log result` seams
- current home/calendar evidence cues
- direct complaint evidence from:
  - `/Users/ivan/Desktop/Screenshot 2026-05-12 at 09.35.33.png`
  - `/Users/ivan/Desktop/Screenshot 2026-05-12 at 09.35.43.png`
  - `/var/folders/3y/5cpksv511mdbm91rqfggw76h0000gn/T/TemporaryItems/NSIRD_screencaptureui_Eq4aHk/Screenshot 2026-05-12 at 09.37.46.png`

## Current Problem Map

### Visual / layout problems

- The `Feedback` tab currently feels like stacked cards inside a larger card, which creates unnecessary weight.
- The current upload, deterministic comparison, and AI interpretation blocks all look equally “boxed,” so hierarchy is weak.
- The main upload button lost its left icon, which makes the primary action feel visually broken and less scannable.
- Signal-by-signal comparison rows, summary blocks, and AI sections all use similar bordered surfaces, so the page feels dense before the user even understands the content.

### Terminology / explanation problems

- `Deterministic comparison` is accurate internally but not self-explanatory for normal runners.
- `AI interpretation` reads more clearly than `deterministic comparison`, but it still needs more grounded plain-language framing.
- `Boundaries` is product-correct but vague and abstract in the current UI.
- Labels such as `Evidence`, `Completion`, `Signals`, `Not applicable`, and `Secondary AI note` are precise enough for internal teams but too opaque for ordinary users.
- The page does not explain simply enough why uploading a file helps the runner.

### Flow / placement problems

- The current primary upload entry is in `Feedback`, but the user naturally reaches for upload while logging the workout in `Log result`.
- The current upload affordance does not connect strongly enough to the user’s mental flow:
  - finish run
  - mark result
  - optionally attach evidence
  - get deeper feedback
- After upload, the user needs a short immediate plain-language takeaway near the upload action, before opening or reading deeper analysis.
- If no file exists yet, `Feedback` currently feels too empty and too technical instead of educational and inviting.

### Future-feature ideas mixed into the current complaint set

- screenshot upload and OCR
- compare against similar historical runs
- more adaptive next-workout guidance

These are valid ideas, but they should not be solved as part of the immediate cleanup of current UX clarity.

## Product Truth Constraints

- FIT/ZIP upload is live.
- Screenshot OCR is not live.
- Deterministic comparison is factual backend truth.
- Bounded AI interpretation is secondary and additive.
- `Feedback` already exists as a dedicated surface.
- `Log result` owns manual completion truth.
- Calendar and Today now expose bounded marker cues that point into `Feedback`.

## Non-Negotiable Truth Rules

- `workout_logs` remain the canonical source of manual completion truth.
- Garmin upload remains the only live evidence source in this slice.
- Deterministic comparison remains the primary factual readback.
- AI remains interpretive and must not replace deterministic facts.
- Screenshot must stay clearly labeled as later until OCR is actually live.
- The product must not imply that upload is required in order to log a workout.
- The product must not imply that absence of upload means failure or bad performance.

## Information Architecture Recommendation

### What belongs in `Log result`

`Log result` should own:

- completion state:
  - `completed`
  - `partial`
  - `skipped`
- manual notes
- manual actual metrics
- the first invitation to add richer evidence

Recommended role:

- `Log result` is the “save what happened” surface
- it may contain one lightweight upload invitation after the runner finishes the form
- it should not become the main place for full comparison or full AI analysis again

### What belongs in `Feedback`

`Feedback` should own:

- evidence upload as the canonical detailed evidence entry
- current upload status
- parsed evidence summary
- deterministic comparison
- AI interpretation
- plain-language explanation of how the evidence is used

Recommended role:

- `Feedback` is the “understand the workout more deeply” surface

### What should be visible before upload

In `Log result`:

- one small plain-language CTA after notes or after the save area:
  `Add Garmin file for deeper feedback`
- one short sentence explaining what the user gets from upload

In `Feedback`:

- upload actions
- one short explanation:
  upload helps compare the real run against the planned workout and generate deeper feedback
- a clear honest empty state

### What should be visible after upload

Near the upload flow:

- one compact plain summary in 1-2 sentences
- example product role:
  “We parsed your Garmin file and compared it with the planned workout. Open the sections below for the factual comparison and the recommendation.”

Below that:

- deterministic details
- AI interpretation details

### Upload entry decision

Recommended canonical decision:

- upload should be available in both places, with one clear primary entry

Primary entry:

- `Log result`, below notes or immediately after the save region, because that matches the runner’s natural completion flow

Secondary entry:

- `Feedback`, as the dedicated evidence home and fallback path when the runner navigates there first

Important rule:

- these must not feel like two equal competing workflows
- `Log result` should invite upload
- `Feedback` should own the detailed evidence experience

Recommended anti-pattern to avoid:

- do not make a mandatory modal after pressing `Complete` as the default first move
- that would over-couple manual completion and evidence upload
- a modal may be considered later only if real testing proves inline placement is weaker

## Surface/Layout Direction

### Core direction

- remove the heavy nested-card feeling
- prefer one calmer parent surface with internal dividers
- rely more on headers, subheaders, body copy, and spacing
- keep card treatment only where a block truly needs distinction

### `Feedback` layout recommendation

Recommended structure:

1. surface header
   - what this area is for
   - one short plain sentence
2. upload row
   - actions
   - one-line why-upload explanation
   - immediate upload/result summary
3. divider
4. factual comparison section
5. divider
6. AI recommendation section
7. optional small “what this cannot tell yet” section when needed

This should replace the feeling of:

- outer card
- inner card
- inner card
- more inner cards

### `Log result` layout recommendation

Keep the current manual completion structure, but add:

- a calmer upload invitation below notes or below the save region
- a plain micro-explainer
- a link/button into `Feedback` when richer feedback already exists

### Divider strategy

Use dividers for:

- upload vs readback
- factual comparison vs AI layer
- manual completion vs richer evidence invitation

Avoid dividers for:

- every small row
- every micro-explainer

### Tooltip / help strategy

Tooltips or inline help are appropriate for:

- `How this feedback works`
- `What we compare`
- `What AI can and cannot do here`

Tooltips are not the primary fix for unclear structure. They should support clear labels, not replace them.

## Explanation Strategy

### How to explain deterministic comparison

User-facing concept:

- “Plan vs run”
- “What we could compare”
- “Factual comparison”

Recommended strategy:

- keep “deterministic” out of the main heading
- if needed, keep it only in tooltip/help copy for precision
- primary wording should explain that this section compares the planned workout with the uploaded run using factual backend checks

### How to explain AI interpretation

User-facing concept:

- “Recommendation”
- “What this likely means”
- “Suggested next step”

Recommended strategy:

- explain that AI reads the factual comparison and turns it into a short recommendation
- keep the factual layer visibly above it

### How to explain boundaries

Replace `Boundaries` as a primary label with something plainer:

- `Use with caution`
- `What this cannot tell yet`
- `Current limits`

Recommended strategy:

- show only when relevant
- phrase it as honest limitation, not abstract product jargon

### How to explain why upload helps

The product should say plainly:

- upload helps the app compare your actual run with the planned workout
- that produces clearer feedback than a manual completion state alone
- that comparison then supports the recommendation

### How to explain FIT vs screenshot today

Plain-language rule:

- Garmin FIT/ZIP is supported now
- screenshot is a later path

The page should never imply:

- screenshot is partially working
- screenshot produces the same result today

## Immediate Fixes

### 1. Restore the missing left icon on the main upload button

Why:

- current primary action looks visually broken
- this is a high-signal low-risk fix

### 2. Reduce heavy stacked-card density in `Feedback`

Why:

- current surface looks harder than it is
- the user complaint is correct: the page currently feels like many nested cards

Recommended immediate result:

- one calmer container with internal dividers
- fewer repeated bordered sub-cards

### 3. Rewrite the main explanatory copy in plain language

Immediate focus:

- upload purpose
- factual comparison purpose
- AI recommendation purpose
- clearer empty states

### 4. Add one compact post-upload summary near the upload area

Why:

- users need a quick payoff before reading full details

### 5. Clarify the empty `Feedback` state

Why:

- current empty state is too technical
- it should explain why upload helps and what will appear after upload

## Later Phases

### Next implementation slice

The next likely implementation slice after immediate cleanup should decide and ship the primary upload entry shift:

- add a lightweight upload invitation in `Log result`
- keep `Feedback` as the canonical detailed evidence surface
- ensure the two entry points feel like one flow, not two competing flows

### Later ideas

- compare against similar prior runs
- screenshot upload / OCR path
- richer recommendation-only adjustment seam
- historical AI regeneration/backfill

These should wait until the current `Log result` and `Feedback` clarity problems are resolved.

## Similar-Run Comparison Evaluation

Recommendation:

- later

Why:

- it is product-interesting, but not the next cleanup priority
- right now the product still needs to make one workout’s evidence and feedback easy to understand
- similar-run comparison introduces a second comparison axis:
  - plan vs current run
  - current run vs prior similar run
- that can be valuable later, but it would complicate the current surface too early

Architectural judgment:

- it makes sense as a future supplemental layer
- it should never replace plan-vs-actual as the primary comparison truth

## What We Should Not Solve In This Slice

- screenshot OCR
- Garmin sync / Strava sync
- plan auto-adjustment
- historical AI regeneration
- similar-run comparison implementation
- full redesign of workout detail
- replacement of deterministic truth with AI-first summaries

## Designer Review Needed

- exact header/subheader hierarchy for the flattened `Feedback` surface
- final visual distinction between completion markers and evidence markers
- the calmer upload row composition
- the compact post-upload summary treatment
- whether helper text or tooltip icons read better for “How this works” and “Current limits”

Designer review is helpful here, but it should operate inside the current product architecture:

- `Log result` remains manual truth
- `Feedback` remains detailed evidence truth
- no fresh redesign fantasy

## Rollout Order

### Phase 1. High-signal UI cleanup

Goal:

- restore button clarity
- reduce card stacking
- improve plain-language explanations

Target files / surfaces:

- `src/components/CompletionPanel.tsx`
- `src/routes/workout.$date.tsx`
- `src/styles.css`

Dependency / risk:

- low implementation risk
- risk is mostly visual regressions or over-flattening

QA expectation:

- upload button icon restored
- `Feedback` reads more clearly at first glance
- no change to Garmin truth behavior

Next likely role:

- FRONTEND

### Phase 2. Flow relocation / dual-entry cleanup

Goal:

- add one clear upload invitation in `Log result`
- keep `Feedback` as canonical detail home

Target files / surfaces:

- `src/components/CompletionPanel.tsx`
- `src/routes/workout.$date.tsx`

Dependency / risk:

- depends on the cleaned information hierarchy from Phase 1
- risk is creating two competing upload flows if copy and ownership are sloppy

QA expectation:

- upload can be discovered naturally from `Log result`
- `Feedback` still owns detailed evidence and readback

Next likely role:

- FRONTEND

### Phase 3. Debug / terminology hardening

Goal:

- tighten labels, help affordances, and empty-state behavior based on QA/user confusion

Target files / surfaces:

- `src/components/CompletionPanel.tsx`
- `src/styles.css`
- optionally small route-level copy in `src/routes/workout.$date.tsx`

Dependency / risk:

- depends on real feedback from the cleaned surface
- risk is over-explaining and making the page too verbose

QA expectation:

- normal users can explain in plain language:
  - what upload does
  - what the factual comparison does
  - what the AI recommendation does

Next likely role:

- FRONTEND

### Phase 4. Future supplemental comparison ideas

Goal:

- only after clarity is good, evaluate similar-run comparison as a separate product slice

Target files / surfaces:

- later product/backend analysis, not current implementation

Dependency / risk:

- depends on clean current single-workout feedback comprehension

QA expectation:

- not part of current cleanup acceptance

Next likely role:

- ARCHITECTURAL FOLLOW-UP

## Risks

- flattening too aggressively could remove useful separation between factual and interpretive layers
- adding upload entry to `Log result` could accidentally blur ownership if it becomes a second full feedback surface
- over-correcting terminology could make the UI too verbose
- quick copy changes without layout cleanup would still leave the surface feeling dense

## Exit Criteria

- the upload button is visually whole again
- `Feedback` no longer feels like stacked nested cards
- ordinary users can understand:
  - why upload helps
  - what the factual comparison does
  - what the AI recommendation does
- `Log result` and `Feedback` have clearer roles
- the current Garmin truth path remains intact and honest

## Next Recommended Role

FRONTEND

## Suggested Next Step

Run QA on the implemented Phase 1 cleanup, then decide whether the next slice should deepen the
new `Log result` upload invitation or stop after the current lightweight bridge into `Feedback`.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined one canonical product/UX/debug cleanup plan for the current Garmin-enabled `Feedback` and `Log result` surfaces based on real usability complaints and current screenshots.

### Key Decisions

- `Log result` keeps manual completion truth.
- `Feedback` keeps detailed evidence, deterministic comparison, and AI interpretation.
- Upload should eventually be discoverable from `Log result`, but `Feedback` remains the canonical detailed evidence home.
- Immediate work should focus on icon restore, layout flattening, and plain-language clarity before changing deeper flow placement.

### Current State

- FIT/ZIP upload is live.
- Deterministic comparison is live.
- Bounded AI interpretation is live.
- `Feedback` exists as a dedicated detailed surface.

### Constraints

- Do not imply screenshot OCR is live.
- Do not replace deterministic truth with AI summaries.
- Do not blur manual completion truth with evidence truth.

### Risks / Open Questions

- The upload invitation can easily become duplicated or confusing if both surfaces feel equally primary.
- Layout cleanup needs careful hierarchy so the page becomes lighter without becoming flat or vague.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Ship the immediate Phase 1 cleanup only: restore the upload button icon, reduce stacked-card density in `Feedback`, and rewrite the surface into plain user-facing language before relocating upload entry points.
```

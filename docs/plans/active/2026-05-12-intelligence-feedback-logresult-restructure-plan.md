# Intelligence, Feedback, And Log Result Restructure Plan

## Status

Active — Phase 1 implemented

## Owner

Architect

## Last Updated

2026-05-12

## Current Slice Note

Phase 1 is now implemented, and the immediate cleanup also adds one lightweight `Log result`
invitation into `Feedback` while keeping `Feedback` as the canonical detailed evidence surface.

## Context

The product now has a real Garmin-enabled feedback path, but parts of the visible UX still behave like an older placeholder-era product.

That contradiction is now visible in three connected places:

- `/integrations`, especially the current `Intelligence` group
- workout-detail `Feedback`
- workout-detail `Log result`

The current product truth is stronger than the current wording and layout suggest.

This plan is grounded in:

- the already-implemented Garmin path
- the current workout-detail `Feedback` and `Log result` seams
- the current `Integrations` route implementation
- screenshot complaint evidence:
  - `/Users/ivan/Desktop/Screenshot 2026-05-12 at 09.45.11.png`
  - `/Users/ivan/Desktop/Screenshot 2026-05-12 at 09.45.38.png`
  - `/Users/ivan/Desktop/Screenshot 2026-05-12 at 09.35.43.png`

## Current Contradiction Map

### Stale placeholder contradictions

- `/integrations` still labels the `Intelligence` section as `Not connected`, even though meaningful intelligence-like value is already live in workout-detail `Feedback`.
- `Planning notes` still reads as a placeholder-only shell, even though the product already has a live Garmin comparison path plus bounded AI feedback elsewhere.
- `View status`, `Preview`, and repeated `Not connected` language on the `Intelligence` items now reads as stale and misleading rather than honest.
- `Screenshot import` is still truly later, but it currently sits beside stale placeholder rows in a way that makes the whole section feel outdated instead of selectively honest.

### Layout / hierarchy problems

- `Feedback` still feels too stacked and boxed even after the dedicated tab split.
- `Feedback` uses too many bordered containers with similar visual weight.
- `Log result` and `Feedback` still do not read as one coherent flow from the user’s perspective.
- The sidebar `Plan note` block is underused as a true whole-program note surface and its dismiss `X` treatment needs clearer top-right anchoring.

### Explanation / copy problems

- `Deterministic comparison` is accurate but too internal-sounding for most users.
- `AI interpretation` is closer to understandable, but still needs clearer framing around what the user actually gets.
- `Boundaries` is too abstract as a product term.
- The current `Feedback` top copy still explains location ownership more than user value.
- The current no-upload and no-AI states are more technical than helpful.

### Upload-flow placement problems

- Upload currently lives canonically inside `Feedback`, but user intent often starts in `Log result`.
- The current product does not yet make the “complete workout -> optionally add evidence -> read deeper feedback” flow obvious enough.
- There is not yet a compact plain-language result summary immediately after upload near the upload action itself.

### Future-feature ideas mixed into the complaint set

- screenshot OCR
- richer plan-adjustment workflow
- compare against similar historical runs

These are valid future directions, but they should not distract the first cleanup slice.

## Product Truth Constraints

- FIT/ZIP upload is live.
- Deterministic comparison is live.
- Bounded AI feedback is live.
- Screenshot OCR is not live.
- `Feedback` already exists as a dedicated surface.
- `Log result` owns manual completion truth.
- The `Intelligence` area inside `/integrations` is still a preserved shell and is now partially obsolete in its current wording.

## Non-Negotiable Truth Rules

- `workout_logs` remain the canonical source of manual completion truth.
- Garmin FIT/ZIP remains the only live evidence source in this slice.
- Deterministic comparison remains primary factual backend truth.
- Bounded AI feedback remains additive and secondary to deterministic facts.
- Screenshot must remain clearly later-only until OCR actually exists.
- `/integrations` must not claim live connected intelligence that the product does not really have.
- UI cleanup must not create a second detailed evidence surface outside workout-detail `Feedback`.

## Intelligence Route Recommendation

### Recommendation

- shrink and reframe the current `Intelligence` section in `/integrations`
- remove stale connected/not-connected placeholder language from the intelligence rows
- keep the route as a preserved shell, but make it selectively truthful instead of uniformly fake

### What should happen

#### `Planning notes`

- stop treating this as a placeholder-only shell
- reframe it as a live product-adjacent concept, but only if the row points honestly to the real current value
- best direction:
  convert it into a simple route-level pointer to where live feedback currently exists:
  workout-detail `Feedback` and the sidebar `Plan note` concept

#### `Screenshot import`

- keep
- explicitly later
- clearly explain it is not connected yet

#### `Plan adjustments`

- keep as later
- reframe as future recommendation-to-program context rather than a fake current engine

### Connected/on-off control decision

Recommendation:

- do not introduce a fake on/off radio/toggle in this slice

Why:

- a toggle implies a real user-controlled state or a real integration lifecycle
- the current problem is not missing state control; it is stale placeholder wording
- adding a toggle now would risk creating a second fake layer of truth

Better alternative:

- replace stale `Not connected` and `View status` language with honest live/later framing
- where something is real, point to the real surface
- where something is not real, say so plainly and keep it small

## Information Architecture Recommendation

### What belongs in `Log result`

`Log result` should own:

- completion choice:
  - `completed`
  - `partial`
  - `skipped`
- manual notes
- manual actuals
- one lightweight invitation to add richer evidence

Role:

- `Log result` is the “save what happened” surface

### What belongs in `Feedback`

`Feedback` should own:

- canonical upload actions
- upload state
- short immediate post-upload summary
- factual plan-vs-run comparison
- bounded AI recommendation
- current limitations / caution explanation when relevant

Role:

- `Feedback` is the “understand the run more deeply” surface

### What belongs in sidebar `Plan note`

`Plan note` should own:

- whole-program context
- next-plan caution or recommendation
- future broader adjustment context when the product earns it

It should not try to restate detailed workout-level evidence that already belongs in `Feedback`.

### Upload entry recommendation

Recommended canonical decision:

- upload should appear in both places
- the primary invitation should appear in `Log result`
- the canonical detailed evidence home remains `Feedback`

Primary entry:

- small upload invitation below notes or near the save region in `Log result`

Canonical detailed entry:

- full upload/evidence/comparison/recommendation flow in `Feedback`

### Before upload

In `Log result`:

- small invitation:
  `Add Garmin file for deeper workout feedback`
- one sentence on value

In `Feedback`:

- upload actions
- plain explanation of why upload helps
- honest empty state

### After upload

Near upload:

- one compact plain-language summary in 1-2 short sentences

Below it:

- factual comparison section
- AI recommendation section

## Surface/Layout Direction

### Core direction

- reduce card stacking
- prefer one calmer parent surface with internal dividers
- use headers, subheaders, and short support copy for hierarchy
- keep low-chrome feel

### `Feedback` direction

Recommended structure:

1. surface header
   - plain-language value statement
2. upload row
   - actions
   - short why-upload explanation
   - compact immediate post-upload summary
3. divider
4. factual comparison section
5. divider
6. recommendation section
7. optional small “current limits” section

This should replace the current feeling of:

- one large outer card
- inner card
- another inner card
- several more heavy sub-blocks

### `Log result` direction

- keep current completion structure
- add one light upload invitation rather than a second heavy upload block
- do not turn `Log result` into a second analysis page

### `Integrations` direction

- remove repeated right-side `Not connected` labels for intelligence rows
- remove dead-feeling `View status` controls where they do nothing useful
- use route-level section hierarchy and smaller row-level status language
- where a row is live-adjacent, point to the real place

### Tooltips / help affordances

Appropriate for:

- `How this comparison works`
- `What AI is doing here`
- `What this cannot tell yet`

Not appropriate as the main fix for:

- stale route architecture
- overloaded section hierarchy
- confusing primary copy

## Explanation Strategy

### Deterministic comparison

Primary user-facing wording:

- `Plan vs run`
- `Factual comparison`
- `What we could compare`

Recommendation:

- keep `deterministic` out of the main section title
- if needed, explain it in helper text or a tooltip only

### AI interpretation

Primary user-facing wording:

- `Recommendation`
- `What this likely means`
- `Suggested next step`

Recommendation:

- explain that AI reads the factual comparison and turns it into one short recommendation

### Boundaries

Replace with plainer wording such as:

- `Current limits`
- `Use with caution`
- `What this cannot tell yet`

### Why upload helps

Plain-language rule:

- upload helps compare your actual run against the planned workout
- that creates deeper feedback than manual completion alone
- the recommendation is built on top of that comparison

### FIT/ZIP today

Plain-language rule:

- Garmin FIT/ZIP works now
- it lets the app parse the run and compare it with the plan

### Screenshot today

Plain-language rule:

- screenshot is not live yet
- do not imply partial capability

## Immediate Fixes

- restore the missing left icon on the main FIT/ZIP upload button
- flatten the `Feedback` surface hierarchy and reduce nested-card feel
- replace stale `Intelligence` route placeholder language with honest live/later wording
- remove or reframe dead-feeling `View status` / repeated `Not connected` copy on intelligence rows
- rewrite `Feedback` top copy into plain language about plan vs actual execution
- fix sidebar `Plan note` dismiss `X` alignment so it sits correctly in the block corner

## Next Slice

The next implementation slice after immediate cleanup should be:

- add the primary lightweight upload invitation to `Log result`
- keep `Feedback` as the canonical detailed evidence home
- add a short compact post-upload summary near the upload action

This is the highest-value functional follow-up once the current surfaces are visually and verbally cleaned up.

## Later Ideas

- similar-run comparison
- screenshot upload and OCR
- broader plan-adjustment workflow
- historical AI regeneration/backfill

These should come only after the current surfaces are honest, lighter, and understandable.

## Similar-Run Comparison Evaluation

Recommendation:

- later

Why:

- it is a valid product direction, but not the next cleanup priority
- current users still need the current single-workout evidence flow to become clear first
- similar-run comparison introduces a second comparison dimension that will increase complexity

Architectural judgment:

- it can make sense later as a supplemental comparison layer
- it must not replace plan-vs-actual as the primary truth model

## What We Should Not Solve In The First Cleanup Slice

- screenshot OCR
- Garmin sync / Strava sync
- plan auto-adjustment
- historical AI regeneration
- similar-run comparison implementation
- fake connected-state toggles
- major route restructuring beyond honest reframe and cleanup

## Designer Review Needed

- exact calm surface hierarchy for `Feedback`
- final status/label language for live vs later intelligence rows
- upload invitation treatment in `Log result`
- compact post-upload summary pattern
- correct placement and hit-area of the sidebar `Plan note` dismiss `X`
- whether helper text or tooltip icons read better for `How this works` and `Current limits`

Designer review is useful here, but it should remain inside the existing product architecture:

- `Log result` = manual truth
- `Feedback` = detailed evidence truth
- `/integrations` = honest route-level framing, not a new capability system

## Rollout Order

### Phase 1. Contradiction and clarity cleanup

Goal:

- remove stale placeholder contradictions
- restore visual clarity
- lighten `Feedback`

Target files / surfaces:

- `src/routes/integrations.tsx`
- `src/components/CompletionPanel.tsx`
- `src/routes/workout.$date.tsx`
- `src/components/AppShell.tsx`
- `src/styles.css`

Dependency / risk:

- low implementation risk
- main risk is flattening too far and losing useful hierarchy

QA expectation:

- no stale live-vs-placeholder contradiction remains in `/integrations`
- `Feedback` reads more clearly at first glance
- upload button icon is restored
- plan note dismiss control sits correctly

Next likely role:

- FRONTEND

### Phase 2. Upload-flow refinement

Goal:

- add upload invitation to `Log result`
- keep `Feedback` as canonical detail home
- add compact post-upload summary

Target files / surfaces:

- `src/components/CompletionPanel.tsx`
- `src/routes/workout.$date.tsx`

Dependency / risk:

- depends on the new IA and flatter `Feedback` structure from Phase 1
- risk is creating two competing upload experiences

QA expectation:

- user can discover upload naturally from `Log result`
- user still ends up in `Feedback` for detailed evidence/comparison/recommendation

Next likely role:

- FRONTEND

### Phase 3. Terminology and helper hardening

Goal:

- tighten labels, helper copy, and limited tooltips after QA feedback

Target files / surfaces:

- `src/components/CompletionPanel.tsx`
- `src/routes/integrations.tsx`
- `src/styles.css`

Dependency / risk:

- depends on observing real user confusion after the first cleanup
- risk is over-explaining and making the interface verbose

QA expectation:

- normal users can explain:
  - why upload helps
  - what factual comparison means
  - what the recommendation means

Next likely role:

- FRONTEND

### Phase 4. Future product follow-up

Goal:

- evaluate similar-run comparison or broader recommendation workflows only after current UX is stable

Target files / surfaces:

- later architectural/product analysis

Dependency / risk:

- depends on current single-run feedback UX being clear and stable

QA expectation:

- not part of current cleanup acceptance

Next likely role:

- ARCHITECTURAL FOLLOW-UP

## Risks

- flattening the surfaces too aggressively could erase the distinction between facts and recommendations
- upload entry in both places could become ambiguous if copy and hierarchy are weak
- reworking `/integrations` too lightly would leave stale contradictions intact
- reworking `/integrations` too heavily would drift into a fresh redesign instead of a cleanup

## Exit Criteria

- `/integrations` no longer contradicts the live Garmin-enabled product truth
- `Feedback` feels calmer and more understandable
- `Log result` and `Feedback` have clearer distinct roles
- current live Garmin truth remains intact and honest
- the product explains plainly why upload helps and what is live today

## Next Recommended Role

FRONTEND

## Suggested Next Step

Run QA on the implemented contradiction-and-clarity cleanup, then choose whether the next slice
should deepen upload discoverability from `Log result` beyond the current lightweight bridge.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Defined one canonical restructuring/debug plan for the current `Intelligence`, `Feedback`, and `Log result` surfaces based on real UX complaints and stale placeholder contradictions.

### Key Decisions

- `/integrations` should be shrunk and reframed, not left as a stale placeholder shell.
- Fake connected/on-off controls should not be introduced in this cleanup slice.
- `Log result` keeps manual completion truth.
- `Feedback` keeps detailed evidence, factual comparison, and bounded AI recommendation.

### Current State

- FIT/ZIP upload is live.
- Deterministic comparison is live.
- Bounded AI feedback is live.
- Calendar markers are live.
- Screenshot OCR is still later.

### Constraints

- Do not imply screenshot OCR is live.
- Do not blur manual completion truth and evidence truth.
- Do not turn `/integrations` into a fake connected-state control surface.

### Risks / Open Questions

- `/integrations` needs enough change to stop contradicting reality, but not so much that it becomes a new product surface.
- Upload discoverability can still become duplicated or muddy if both `Log result` and `Feedback` are treated as equally primary.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Ship the first cleanup slice only: fix stale intelligence-shell copy and controls, flatten `Feedback`, restore the upload icon, and correct the sidebar `Plan note` dismiss treatment before moving upload entry deeper into `Log result`.
```

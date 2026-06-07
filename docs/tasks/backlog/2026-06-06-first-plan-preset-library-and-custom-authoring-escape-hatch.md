# First-Plan Preset Library And Custom Authoring Escape Hatch

## Status

backlog

## Type

change_request

## Priority

high

## Next Recommended Role

ARCHITECT

## Task

Define the architecture for a backend-owned first-plan preset library with a custom authoring escape
hatch.

## Stage

ARCHITECT backlog / first-plan preset library and custom authoring architecture intake

## Exact Handoff Prompt

```text
ROLE: ARCHITECT

TASK:
Define the architecture for a backend-owned first-plan preset library with a custom authoring escape
hatch.

STAGE:
ARCHITECT plan / preset-first no-plan onboarding and token-saving first-plan architecture

SOURCE BACKLOG ITEM:
docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md

RELATED BACKLOG ITEM:
docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md

CONTEXT:
The user wants a token-saving first-plan path for runners with no active plan:
- If the runner has no target date or does not need a fully custom AI-authored plan, Hito should
  offer rich preset plan cards.
- The runner chooses level, goal distance, physical/profile parameters, execution preference, and
  maybe intent.
- Beginner presets should start with run/walk adaptation.
- Experienced/performance presets should include richer result-improvement workouts.
- Presets must be very rich: canonical workout identities, structured segments, executable targets,
  cues, progression, recovery, and metric-truth gates.
- If the runner chooses custom, Hito can still use the custom AI/custom authoring path.
- Once manual workout creation/editing exists, users should be able to edit preset-generated
  workouts and segments through canonical values such as time, distance, repeats, pace, HR, speed,
  cues, and intensity where allowed by metric truth.

GOAL:
Design one canonical preset-first first-plan pipeline that reduces OpenAI token usage without
lowering coaching quality or moving plan truth into frontend cards.

ROOT-CAUSE DISCIPLINE:
Do not solve this as a UI card gallery. The root architecture problem is that common first-plan
shapes currently travel through custom authoring contracts even when they could start from
backend-owned canonical preset recipes. The solution should move common plan shape into reusable
backend-owned preset truth and keep custom authoring as an explicit escape hatch.

REQUIRED READING:
- docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md
- docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md
- docs/current-product.md
- docs/current-system.md
- docs/current-state.md
- docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md
- docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md
- src/lib/structured-plan-authoring*
- src/lib/ai-first-plan-blueprint-*
- src/lib/ai-first-plan-envelope-*
- src/lib/imported-plan.ts
- src/lib/rich-workout-model.ts

ARCHITECTURE QUESTIONS:
1. What preset families should exist by level, goal distance, and goal intent?
2. Should preset plans be stored as canonical template data, generated deterministically from preset
   recipes, or assembled from reusable workout blocks?
3. How should presets reuse existing canonical workout identities, segment prescriptions,
   `metric_mode`, executable targets, and rich workout model values?
4. How should custom authoring differ from preset authoring?
5. How do presets reduce OpenAI token usage without lowering coaching quality?
6. What fields must remain backend-owned: validation, normalization, metric truth, progression,
   rest days, lifecycle, and persistence?
7. How should the UI present preset cards without pretending they are already custom AI plans?
8. How should manual workout editing later modify preset-generated workouts safely?
9. What review/confirm boundary is required before creating a plan from presets?
10. What QA fixtures prove beginner run/walk, recreational, supported performance, and
    long-distance presets are rich and safe?

RECOMMENDED SEQUENCING:
Start with this preset-library architecture before manual workout CRUD implementation. Presets can
use existing canonical generation/persistence seams and do not need the manual editor to ship a first
version. Manual workout authoring should later edit the canonical rows that presets create.

WHAT NOT TO DO:
- Do not implement code in this architecture pass.
- Do not change first-plan production behavior.
- Do not weaken blueprint or envelope safety gates.
- Do not make frontend invent plan truth.
- Do not create route-local workout templates outside canonical backend/model ownership.
- Do not mark manual workout creation/editing as implemented.
- Do not store fake pace/HR precision in presets.
- Do not use target time alone as pace truth.
- Do not bundle this with the future envelope production-default switch.

OUTPUT:
1. Task
2. Stage
3. Current first-plan architecture
4. Preset source-of-truth decision
5. Preset family inventory
6. Custom authoring escape hatch
7. Backend implementation slices
8. Running Coach gate
9. Frontend card/review implications
10. Manual workout editing relationship
11. QA strategy
12. Blockers
```

## Architecture Class

improvement / architecture

## Severity

high

## Priority Rationale

This is the highest-priority next first-plan architecture track because it can reduce first-plan
OpenAI token usage, latency, and AI-output fragility for common no-active-plan onboarding without
waiting for the manual workout editor. It should start before manual workout CRUD implementation,
while still designing preset outputs so they can later be edited safely through the manual authoring
model.

## Owner

ARCHITECT / RUNNING COACH / BACKEND / FRONTEND / QA

## Reported

2026-06-06

## Related Work

- Manual workout creation/edit/copy/recurrence:
  `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`
- Future envelope rollout gate:
  `docs/tasks/backlog/2026-06-04-ai-first-plan-envelope-production-default-switch-gate.md`
- Completed blueprint first-plan wave:
  `docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md`
- Completed internal envelope option:
  `docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`

## User Report

The user wants Hito to offer rich first-plan presets when a runner has no active plan and does not
need a custom target-date AI draft.

Desired behavior:

- runner chooses level, distance, physical/profile parameters, execution preference, and maybe intent
- Hito shows preset plan cards for common goals
- beginner plans start with run/walk adaptation
- experienced/performance plans include appropriate result-improvement workouts
- presets are rich, not shallow templates
- custom authoring remains available when preset cards are not enough
- future manual workout editing can customize preset-generated workouts and segments

## Evidence

Current implemented state:

- Structured first-plan onboarding uses `generateStructuredFirstPlanDraft` and
  `confirmStructuredFirstPlanDraft`.
- Production first-plan generation defaults to `ai-first-plan-blueprint-v1`.
- Internal envelope support exists only through explicit backend/server-owned use.
- `structured-plan-authoring*` already owns deterministic canonical generation and rich workout
  identity/segment/metric-mode construction.
- `rich-workout-model.ts` already defines canonical workout families, identities, calendar icon keys,
  metric guidance values, executable modes, and HR target source truth.
- `imported-plan.ts` already owns the canonical `training-plan-v2` import contract and rich workout
  field compatibility.

No implementation proof was run for this backlog item.

## Observed Behavior

Hito currently has rich first-plan generation, but common no-plan cases still route through custom
first-plan authoring rather than an explicit runner-facing preset recipe library.

This creates avoidable cost and latency for common first-plan shapes, and it makes normal starter
plans feel more dependent on AI contract success than they need to be.

## Expected Behavior

Future Hito should support a preset-first no-plan onboarding path:

- common goals can start from backend-owned preset recipes without calling OpenAI
- presets produce canonical `training-plan-v2` truth
- runner-facing cards explain the plan shape before review
- the runner still reviews/confirms before persistence
- custom authoring remains explicit for non-standard goals, target-date plans, detailed comments,
  unusual availability, or cases where the runner rejects preset fit
- preset outputs are editable later through the separate manual workout authoring model

## Source Investigation

Likely source owners:

- preset recipe/schema/policy:
  - `src/lib/structured-plan-authoring-schema.ts`
  - `src/lib/structured-plan-authoring-policy.ts`
  - `src/lib/structured-plan-authoring-workouts.ts`
  - `src/lib/structured-plan-authoring-segments.ts`
  - `src/lib/rich-workout-model.ts`
- canonical output and compatibility:
  - `src/lib/imported-plan.ts`
  - `src/lib/plan-export.ts`
- current custom first-plan path:
  - `src/lib/first-plan-actions.ts`
  - `src/lib/ai-first-plan-blueprint-*`
  - `src/lib/ai-first-plan-envelope-*`
  - `src/lib/structured-first-plan-onboarding.ts`
- future manual editing relationship:
  - `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`

## Likely Root Cause

The current first-plan pipeline has strong validation, but it is optimized around custom draft
generation. Many runners do not need a custom AI-authored plan on first entry; they need a credible,
safe, rich starting plan based on common level/distance/intent choices.

The root fix is not more prompt tuning. It is backend-owned preset truth that reuses canonical Hito
workout identities, segment anatomy, and metric gates before any optional AI/custom path.

## Recommended Fix Direction

Recommended first architecture:

- create backend-owned preset recipe definitions rather than frontend-owned card data
- generate canonical `training-plan-v2` rows from preset recipes or reusable backend workout blocks
- keep preset cards as UI selection/view-model only
- use existing `structured-plan-authoring*` policy/workout/segment helpers where possible
- require Running Coach review for preset family inventory and progression
- require review/confirm before persistence
- keep custom authoring as an explicit escape hatch into the current custom first-plan draft path

Recommended preset families to assess:

- beginner consistency / run-walk adaptation
- returning runner easy base rebuild
- recreational 5K / 10K improvement
- supported 5K / 10K performance rhythm
- recreational half-marathon base
- supported half-marathon target-improvement
- conservative marathon base
- supported marathon result-improvement
- ultra durability / time-on-feet
- mountain/trail durability and terrain-control

## Custom Authoring Escape Hatch

Custom authoring should remain explicit and bounded:

- preset-first is the default for common no-target-date first plans
- custom authoring is available for target-date plans, unusual constraints, unusual goals, long
  comments, uncommon availability, or runner preference
- custom authoring must still use backend validation, review/confirm, and existing blueprint/envelope
  safety boundaries
- selecting custom must not silently bypass preset quality or create deterministic fallback success
  for unsafe AI output

## Manual Workout Editing Relationship

This task does not implement manual workout editing.

Relationship:

- preset-generated rows should use the same canonical workout family/identity/segment/metric truth
  that manual editing will later expose
- manual editing should become the way to adjust a preset-generated workout after the plan exists
- manual editing must not be required for the first preset-library release
- manual editing should not own preset recipe truth

## Priority And Sequencing Decision

Start here first.

Reason:

- preset-first onboarding can reduce AI token usage and latency immediately
- it can reuse existing canonical structured authoring and persistence seams
- it does not require the manual workout mutation model to be implemented first
- it gives the future manual editor richer canonical rows to edit

Manual workout creation/edit/copy/recurrence remains maximum-priority, but should start after or in
parallel with preset architecture. Its implementation should not block the first preset-library slice.

Non-blocking relationship:

- preset-first release can create rich canonical workouts without exposing manual edit controls
- manual workout authoring can later reuse the same canonical workout/segment values
- neither track should invent a second workout model or route-local template truth

## What Not To Touch

- Do not implement code from this backlog item.
- Do not change first-plan production behavior.
- Do not weaken blueprint or envelope safety gates.
- Do not make frontend own plan truth or template truth.
- Do not create route-local workout templates.
- Do not mark manual workout authoring as implemented.
- Do not fake pace/HR precision.
- Do not use target time alone as pace truth.
- Do not change DB schema without a separate backend plan.

## Validation Expectations

Future implementation should validate:

- preset card selection produces a non-mutating reviewed draft
- confirm persists exact reviewed preset plan truth
- no mutation before confirm
- beginner preset uses run/walk adaptation and no unsafe early intensity
- recreational preset includes safe variety without fake precision
- supported performance preset uses supported specificity only when metric truth exists
- marathon/ultra/mountain presets preserve recovery, taper/cutback, terrain, and durability doctrine
- all non-rest rows include meaningful segments
- `metric_mode.executable_mode` is valid and not vague effort-only happy path
- pace targets appear only with execution support plus validated pace truth
- executable HR targets appear only with personal HR-zone truth
- export/import roundtrip preserves preset-generated rich fields
- custom authoring remains available and distinct

## Blockers

Architecture and Running Coach preset-family decisions are required before implementation.

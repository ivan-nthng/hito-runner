# Plan Preset Library And Custom Authoring Escape Hatch

## Status

complete / archived

## Type

plan

## Priority

high

## Next Recommended Role

BACKLOG / ARCHITECT

## Task

Plan Preset Library and Custom Authoring Escape Hatch is complete for the current vertical slice.

## Stage

ARCHITECT closeout / Plan Preset final browser acceptance pass

## Exact Handoff Prompt

```text
No active handoff remains. This plan is archived as completed; future work should use the linked
backlog follow-ups instead of reopening this implementation track.
```

## Owner

ARCHITECT / RUNNING COACH / BACKEND / FRONTEND / QA

## Last Updated

2026-06-07

## Source Backlog

- `docs/tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md`

## Related Work

- Manual workout creation/edit/copy/recurrence:
  `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`
- Additional Plan Preset families:
  `docs/tasks/backlog/2026-06-07-additional-plan-preset-families.md`
- Plan Preset active-plan replacement/refresh:
  `docs/tasks/backlog/2026-06-07-plan-preset-active-plan-replacement-refresh.md`
- QA screenshot artifact reliability:
  `docs/tasks/backlog/2026-06-07-qa-screenshot-artifact-reliability.md`
- Future envelope production default switch gate:
  `docs/tasks/backlog/2026-06-04-ai-first-plan-envelope-production-default-switch-gate.md`
- Completed blueprint first-plan wave:
  `docs/plans/archive/2026-05-26-ai-authored-first-plan-pipeline.md`
- Completed internal envelope option:
  `docs/plans/archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`

## Final Closeout / Archive Decision

Decision: archive this plan.

The current implementation objective is complete. Plan Presets now cover the full accepted vertical
slice for no-active-plan creation:

- backend eligibility and card view models
- backend-owned non-mutating review draft expansion for `10K Foundation`,
  `Half Marathon Balanced`, and `Marathon Base`
- backend-owned program duration, start date, estimated end date, workout mix, metric honesty, and
  fit summary fields
- minimal composition seam that preserves current recipe outputs without becoming a broad training
  engine
- frontend cards, read-only review, and confirm UI that consume backend-shaped contracts
- preset-specific confirm action with backend-issued token/checksum verification
- canonical persistence through `createFirstPlanFromReviewedCanonicalPlanForUser(...)`
- remote Supabase mutation proof and final browser end-to-end acceptance with cleanup

Final browser QA evidence recorded:

- built-in Codex browser was used first; Safari was not used
- no-active-plan onboarding was reached
- Plan Preset cards rendered with backend-shaped fields
- Advanced custom program remained visible and secondary
- `Half Marathon Balanced` was recommended
- `Create preset plan` succeeded from browser
- UI transitioned to saved/home active-plan state
- saved state showed `Open plan`, calendar content, workout links, and no onboarding/preset confirm
- DB readback showed exactly `1` active plan cycle and `84` planned workouts
- persisted rows matched the rebuilt canonical preset draft by date, weekday, week, type, identity,
  and steps
- metadata preserved `plan_preset_v1`, `preset_recipe_expanded`, preset id/version, dates, row
  counts, assumptions, summaries, and metric policy
- cleanup removed `84` workouts, `1` plan cycle, `1` runner profile, and the disposable auth user
- final cleanup verification showed `0` active plans, `0` workouts, `0` runner profiles, and `0`
  auth users by QA email
- `375px` mobile proof showed no horizontal overflow for preset cards, review, and saved state
- ESLint and `git diff --check` passed in QA
- screenshot PNG capture timed out, but JSON/DOM fallback artifacts were saved under
  `qa-artifacts/screenshots/2026-06-07/plan-preset-final-browser-acceptance/`

Implemented behavior:

- Plan Presets are reusable for no-active-plan creation, including first-ever plan creation and
  later creation after a runner deletes or archives an active plan.
- Current preset families are `10K Foundation`, `Half Marathon Balanced`, and `Marathon Base`.
- Backend owns eligibility, card state, recipe mapping, summary/date fields, metric honesty,
  composition rules, review draft, token/checksum, and confirm persistence.
- Frontend renders backend-shaped cards/review/confirm UI and does not compute eligibility, metric
  truth, dates, recipe truth, workout mix, or persistence locally.
- Confirm creates canonical active plan truth through the existing persistence seam.
- Advanced custom program remains separate for target date/time, unusual constraints,
  injury/pain/caution, uncommon goals, and detailed comments.
- Manual workout creation/edit/copy/paste/recurrence is not implemented in this track.

Future work preserved outside this plan:

- additional preset families
- active-plan replacement/refresh from a preset
- manual workout creation/edit/copy/paste/recurrence
- improved permanent screenshot tooling or QA artifact reliability
- small route copy/design polish only if discovered in later product review

Changelog decision:

- Added a dated shipped-history entry because this is completed user-facing behavior with backend
  persistence and final QA acceptance.

## Context

Hito's first-plan path is now safe enough to build on:

- production structured first-plan generation defaults to `ai_first_plan_blueprint_v1`
- `ai_first_plan_envelope_v1` exists as an internal/non-default option only
- reviewed first-plan confirmation persists exact reviewed `training-plan-v2` truth
- deterministic structured authoring owns rich canonical generation, but it must not leak back as a
  successful fallback for unsafe AI first-plan output
- generated workouts already use canonical workout identities, structured segments, executable
  target contracts, metric-truth gates, recovery-first sequencing, run/walk adaptation,
  beginner/recreational cadence, and supported half/marathon specificity

The next product problem is not only AI prompt reliability. Many runners without an active plan do
not need a fully custom AI-authored plan on first entry. They need a credible, rich, safe starting
plan that matches common level, distance, intent, availability, and execution support.

## Decision

Promote the backlog item to this active plan.

The v1 architecture should be:

`runner setup -> backend preset eligibility -> preset card -> preset recipe -> canonical plan draft -> review -> confirm -> persisted training-plan-v2`

Preset-first should start before manual workout CRUD because it can reduce first-plan OpenAI token
usage and latency immediately by using backend-owned canonical recipes. Manual workout editing is a
future mutation model that should later edit preset-generated rows; it is not a prerequisite.

Clarified product split:

- the normal happy path is deterministic preset cards personalized by backend algorithms and recipe
  gates; it must not call OpenAI
- the advanced/custom path is separate and may call OpenAI through the current
  `ai_first_plan_blueprint_v1` production default for complex or unusual programs
- envelope remains internal/non-default and is not exposed as a runner-facing custom option

## Plan Preset Lifecycle Scope Correction

Status: architecture correction accepted on 2026-06-07, before preset persistence/confirm ships.

Canonical domain term:

- Use `Plan Presets` for the backend/product domain.
- Use `New Plan Presets` only when the lifecycle needs extra clarity that the flow creates a new
  plan and does not edit/replace an active plan.
- Avoid `First Plan Presets` as a domain term. It is acceptable only when describing the first
  no-active-plan onboarding entry point historically or in a narrow route context.

Lifecycle scope:

- Presets are available when the runner has no active plan.
- This includes first-ever plan creation.
- This also includes later new-plan creation after the runner deletes or archives an active plan.
- Presets must never silently replace an existing active plan.
- Active-plan replacement, refresh, regeneration, or schedule editing remains a separate explicit
  flow with its own review/confirm rules.
- Preset review/confirm creates a new plan from a backend-owned recipe; it does not mutate an
  existing plan in place.

Runner-facing copy decision:

- Prefer:
  `Choose a plan preset`, `Start from a preset`, and `Create a new plan`.
- Avoid:
  `First plan preset`, `First-plan preset`, or copy that implies the feature only works once per
  account.
- The first onboarding/no-plan screen may say that Hito can help the runner create their first plan,
  but the preset library itself should remain reusable for any no-active-plan state.

Technical naming decision:

- Rename technical runtime names now, before persistence/confirm ships.
- Preferred source metadata:
  `source_kind: plan_preset_v1`.
- Preferred module family:
  `src/lib/plan-presets/`.
- Preferred exported types/functions/constants:
  `PlanPreset*`.
- Preferred validation script:
  `scripts/validate-plan-preset-eligibility.ts`.
- Preferred recipe IDs:
  `plan_preset_10k_foundation_v1`,
  `plan_preset_half_marathon_balanced_v1`,
  `plan_preset_marathon_base_v1`.

Compatibility decision:

- No preset confirmation/persistence path has shipped.
- Backend Slice 1 currently adds an internal, unpersisted eligibility/card seam only.
- Therefore no compatibility/readback alias is required for `first_plan_preset_v1` yet.
- If any persisted rows with `first_plan_preset_v1` are discovered later, add a readback-only
  compatibility alias and do not silently rewrite historical source metadata without a migration
  plan.

Next gate:

- Run QA on the corrected `Plan Presets` contract, not the old first-plan-only names.

## Plan Preset Naming Cleanup Closeout

Status: complete / QA-passed on 2026-06-07.

Accepted canonical naming:

- Domain:
  `Plan Presets`.
- Source kind:
  `plan_preset_v1`.
- Module seam:
  `src/lib/plan-presets/`.
- Runtime names:
  `PlanPreset*` / `planPreset*`.
- Recipe IDs:
  `plan_preset_10k_foundation_v1`,
  `plan_preset_half_marathon_balanced_v1`,
  `plan_preset_marathon_base_v1`.
- Lifecycle:
  available in the `no active plan` state, not literal first-plan-only usage.

QA evidence recorded:

- Runtime/source/script/package no longer use first-plan-only names.
- `src/lib/first-plan-presets/` is absent.
- `scripts/validate-first-plan-preset-eligibility.ts` is absent.
- No stale `first-plan-presets`, `first_plan_preset`, `FirstPlanPreset`, `firstPlanPreset`, or
  `validate-first-plan-preset` references remain in `src`, `scripts`, or `package.json`.
- Deterministic harness passed.
- No OpenAI calls, persistence, DB schema, or frontend route were introduced.
- Blueprint custom boundary remains preserved with `ai_first_plan_blueprint_v1`.
- Remaining old-name references are docs-only historical context.

Compatibility decision:

- No preset persistence/confirm path has shipped.
- No compatibility/readback alias is needed for `first_plan_preset_v1`.
- If future evidence finds persisted legacy metadata, handle it as a readback-only compatibility
  policy with an explicit migration plan.

Next gate:

- Proceed to Backend Slice 2A for one-family non-mutating review draft expansion.
- QA for Slice 2A should validate `plan_preset_v1` review drafts, not old first-plan-only naming.

## Designer Spec Closeout

Status: complete / accepted for backend handoff on 2026-06-07.

Designer decisions now recorded as the interaction boundary:

- The first setup flow collects profile truth:
  age, height, and weight.
- Runner level is explicit:
  beginner, running/recreational, or experienced.
- Availability is explicit:
  running days per week, fixed rest days, and optional preferred long-run day.
- Execution support is explicit:
  watch/app support, pace support only with validated pace truth, and HR support only when personal
  zones exist.
- Benchmark support is explicit:
  recent 5K or unknown.
- Goal intent is explicit:
  foundation/base, balanced improvement, or durability/finish comfortably.
- Optional context textarea captures constraints, caution, unusual needs, injury/pain signals, or
  detailed comments that may route to custom.
- Target date and target time are not normal preset selectors in v1; they route to
  advanced/custom.
- Main preset cards are distance/program cards:
  `10K`, `Half marathon`, and `Marathon`.
- Cards may show a family label such as Foundation, Balanced, Base, or Durability.
- Card states are runner-visible:
  Recommended, Available, Needs more info, Custom fit, or Unavailable.
- Cards include:
  commitment summary, fit summary, safety/metric note, and inline disabled/custom reason.
- `Advanced custom program` appears as a secondary disclosure or panel below cards, but is promoted
  slightly when all presets are unsafe or custom-fit.
- Preset review shows:
  preset name/family, why this fit, days per week, fixed rest days, preferred long-run day, horizon,
  target mode, metric policy, safety assumptions, and clear non-mutating status.
- Mobile layout stacks the form/cards, shows a sticky action only after selection, and keeps
  advanced/custom visible after cards.

Architecture closeout decision:

- Designer spec is complete enough to stop UI discovery and move to backend contract work.
- Frontend implementation is intentionally blocked until backend returns real preset card view
  models.
- Frontend must not compute eligibility, recipe selection, safety, horizon, metric truth, disabled
  reasons, or custom-fit routing locally.
- Static frontend cards are allowed only as temporary loading/skeleton presentation, never as plan
  truth.

## Problem Definition

The current first-plan system has strong safety gates, but common no-target-date/no-custom cases
still travel through custom first-plan authoring contracts. That creates unnecessary AI dependency,
token usage, latency, and output-fragility risk for starter plans that could be represented as
backend-owned canonical recipes.

The root cause is architectural, not visual:

- first-plan setup has no runner-facing preset source of truth
- frontend cards would be tempting, but frontend must not own schedule or workout truth
- existing deterministic generation can create rich plans, but its `structured_authoring_v1` source
  must not reappear as a silent successful fallback for first-plan AI failures
- manual workout editing will need canonical workout/segment values later, but preset-first should
  not wait for that broader mutation model

## Current First-Plan Architecture

Current production/default path:

- `generateStructuredFirstPlanDraft` parses structured onboarding input.
- The backend maps onboarding answers into `StructuredPlanAuthoringInput`.
- The service defaults to `ai_first_plan_blueprint_v1`.
- Accepted blueprint output expands into canonical `training-plan-v2`.
- Long horizons are bounded by a 16-week AI-authored window plus backend extension.
- The draft is signed and non-mutating.
- `confirmStructuredFirstPlanDraft` verifies the signed reviewed plan, blocks duplicate active plans,
  and persists exact reviewed canonical rows.

Current internal/non-default path:

- `ai_first_plan_envelope_v1` is available only through explicit internal/server-owned use and ops
  commands.
- It is not the production default and exposes no runner-facing selector.

Current deterministic support path:

- `structured-plan-authoring*` owns deterministic canonical plan construction and rich workout
  generation.
- It is used by several backend surfaces, but is intentionally blocked as a successful fallback in
  structured first-plan AI failure paths.

Preset-first must reuse deterministic canonical generation safely without reintroducing a
`structured_authoring_v1` fallback success leak.

## Preset Definition

A preset is a backend-owned recipe, not a static finished calendar.

V1 preset recipe should be a bounded combination of:

- eligibility rules:
  experience level, goal distance, goal intent, benchmark support, execution support, running days,
  injury/caution context, terrain, and target-date/custom constraints
- default plan shape:
  horizon range, phase rhythm, weekly rhythm, long-run progression, cutback cadence, taper rule,
  recovery-first rule, and optional strength/mobility note policy
- workout identity policy:
  required, allowed, and forbidden canonical workout identities by phase and week type
- segment policy:
  which existing backend segment builders/archetypes should be used for easy, recovery, run/walk,
  long, strides, tempo, hills, trail, or specificity work
- metric policy:
  allowed executable modes, pace truth prerequisites, HR truth prerequisites, and correction rules
- card/view metadata:
  safe runner-facing label, summary, who it is for, what it avoids, expected commitment, and why
  custom authoring may be a better fit
- recipe version:
  stable ID and version for debug, QA, persistence metadata, and future manual editing context

Not a preset:

- frontend-only schedule data
- one full hardcoded calendar row table
- raw AI prompt text
- a copied JSON import template with route-local edits
- a second persisted plan model beside `training-plan-v2`

## Preset Card Model

Preset cards are runner-facing selectors for backend recipes.

V1 card model:

- main visible cards should be simple distance/program choices, likely:
  - `10K`
  - `Half marathon`
  - `Marathon`
- `5K` and beginner consistency may appear as explicit alternatives only if product/design decides
  the first screen needs a shorter starter card
- each card maps to one or more backend recipe IDs based on runner level and eligibility
- a card is not a recipe; it is a frontend view model returned by backend eligibility logic
- card state can be:
  - enabled and recommended
  - enabled but not recommended
  - disabled with a clear reason
  - redirected to advanced/custom because the setup does not fit safe deterministic recipes

Examples:

- a beginner choosing `10K` may map to a conservative run/walk-to-10K recipe
- a recreational runner choosing `Half marathon` may map to a balanced half-marathon foundation
  recipe
- an experienced runner choosing `Marathon` may map to a marathon base recipe if support gates pass,
  or recommend advanced/custom if target-time/date specificity dominates

Cards must communicate:

- expected commitment
- what Hito will emphasize
- why this card is recommended or unavailable
- whether the program is preset/deterministic or advanced/custom
- that nothing is created until review/confirm

Cards must not communicate:

- that OpenAI authored the preset happy path
- race-performance guarantees
- fake precision from physical profile fields
- target-time/date specificity unless the runner is routed to advanced/custom

## Runner Inputs And Preset Eligibility

The first form collects backend-shaped truth before cards are activated.

Runner level inputs:

- beginner/new runner
- running/recreational
- experienced

Physical/profile and training inputs:

- age
- height
- weight
- running days per week
- fixed rest days
- preferred long-run day, if exposed
- watch/app support
- benchmark if available
- current long-run or current training load if the UI can collect it safely
- injury, pain, or recovery caution signals
- goal distance/program intent

Backend can use these inputs to personalize:

- starting volume
- progression conservatism
- run/walk adaptation need
- long-run tolerance assumptions
- whether a card is enabled or disabled
- review warnings and assumptions
- executable target mode:
  structure-only, pace-executable, HR-executable, or correction-required according to metric truth
- safe recipe ID selection behind the same distance card

Backend must not personalize from physical/profile inputs by inventing:

- precise pace from age, height, or weight
- personal HR targets from age-estimated HR
- race-performance promises
- aggressive target-time specificity without benchmark and execution support
- two-quality-week patterns unless the separate advanced-performance cadence plan approves them

## Preset Source Of Truth

V1 source of truth should live in backend code as typed recipe definitions, likely under a focused
module such as `src/lib/plan-presets/`.

Recommended shape:

- `plan-preset-schema.ts`:
  recipe schema, IDs, families, eligibility result, and draft metadata types
- `plan-preset-recipes.ts`:
  v1 recipe constants and card metadata
- `plan-preset-resolver.ts`:
  maps structured setup answers to eligible preset candidates
- `plan-preset-authoring.ts`:
  expands selected recipe plus setup into canonical `training-plan-v2`
- `plan-preset-validation.ts`:
  verifies source kind, recipe version, metric safety, row completeness, rest-day protection, and
  review/confirm boundaries

Why backend code constants for v1:

- recipe changes are reviewable in code review
- no schema/database migration is needed before the model stabilizes
- frontend cannot invent or mutate plan truth
- QA fixtures can import exact recipe IDs and versions
- later database/content-tool storage remains possible only after the recipe contract is stable

Markdown/data files are acceptable only as documentation or fixture inputs in v1, not canonical
runtime truth. Database storage is a future option, not v1.

## Canonical Pipeline

V1 pipeline:

1. Frontend collects backend-shaped setup inputs:
   profile basics, experience/fitness level, benchmark support, goal distance, goal intent,
   availability, fixed rest days, preferred long-run day, execution support, terrain where relevant,
   and optional caution context.
2. Backend validates setup with existing structured first-plan schemas and training-preference
   rules.
3. Backend returns eligible preset card view models from backend recipe metadata.
4. Runner selects a distance/program card or chooses the explicit advanced/custom escape hatch.
5. Backend resolves the selected card to a specific recipe ID/version from level and eligibility.
6. For preset selection, backend expands recipe plus setup into a canonical non-mutating reviewed
   draft.
7. The draft source must be explicit, for example:
   - `source_kind: plan_preset_v1`
   - `sourceStatus: preset_recipe_expanded`
   - `presetId`
   - `presetVersion`
   - `persisted: false`
8. Review shows the full plan shape, assumptions, safety notes, metric policy, and card-derived
   runner-facing summary.
9. Confirm verifies the signed reviewed draft and persists exact reviewed canonical rows through the
   existing reviewed-plan persistence seam.

Implementation detail:

- The preset authoring path may reuse `buildStructuredAuthoringPlan(...)` and existing
  `structured-plan-authoring*` helpers, but must wrap or set the reviewed plan source to
  `plan_preset_v1`.
- Do not persist or review a successful preset draft as `structured_authoring_v1`; that would blur
  the completed first-plan fallback boundary.
- If a recipe cannot produce a safe plan, the result must be bounded `correction_required` or
  preset-unavailable metadata, not a hidden AI/custom fallback.

## Review And Confirm Behavior

Preset draft behavior:

- non-mutating
- no OpenAI call
- signed reviewed draft token
- `persisted: false` until confirm
- exact row count, non-rest count, source kind, recipe ID/version, and metric policy visible in
  debug/QA metadata
- review/confirm required before profile, plan cycle, planned workout, workout log, or review row
  mutation

Confirm behavior:

- block if an active plan already exists
- verify setup, recipe ID/version, signed draft, and exact canonical reviewed plan
- validate fixed rest days and preferred long-run day without rewriting reviewed rows
- persist exact reviewed rows through the existing reviewed-plan persistence seam
- store bounded plan-scoped metadata:
  recipe ID/version, structured authoring input, goal style, target/intent summary, metric policy,
  review assumptions
- do not persist raw optional comments as profile truth

Backend will likely need to extend:

- supported reviewed draft source resolver to accept `plan_preset_v1`
- plan-scoped authoring snapshot source union to include `plan_preset`
- generation metadata schema to include `preset_recipe_expanded`

## Advanced / Custom OpenAI Program Path

Advanced/custom authoring remains explicit and separate from preset cards.

When to show or route to custom:

- runner has a target date or event-specific timeline that does not fit a default preset
- runner has a target time or race-specific outcome request
- runner has unusual availability, constraints, terrain goals, or uncommon goal shape
- runner reports injury, pain, or recovery signals that make preset cards unsafe
- runner wants target-time specificity beyond available metric truth
- runner writes detailed comments or nuanced requirements
- backend hides all safe presets for the setup
- runner chooses `Advanced custom program` intentionally

Internal behavior:

- custom uses the current structured first-plan path and production default
  `ai_first_plan_blueprint_v1`
- internal envelope remains internal/non-default unless separately approved
- custom failures remain non-mutating `draft_failed` or `correction_required`
- no deterministic `structured_authoring_v1` fallback success
- custom is not a hidden fallback after unsafe preset expansion; the runner must choose it or be
  explicitly routed to it with clear copy
- target-date and target-time programs are not approved v1 preset cards; they route to
  advanced/custom unless a later plan explicitly approves deterministic target-specific presets

Runner-facing copy principle:

- preset cards are "known safe starting shapes"
- advanced/custom is "Hito drafts a plan from your specific constraints"
- neither path should pretend AI is involved when it is not

## UX Handoff Boundary

Designer owns the interaction model, not plan truth.

The intended UX sequence:

1. First form collects profile/training truth.
2. Backend-shaped eligibility state activates cards.
3. Distance/program cards show enabled, disabled, recommended, or custom-recommended state.
4. Advanced/custom is visible but secondary.
5. Selecting a preset card opens a deterministic preset review.
6. Selecting advanced/custom opens the existing custom/AI setup route or panel.
7. Nothing persists before explicit review/confirm.

Designer should define:

- how much input appears before card reveal
- card anatomy and disabled-state reasons
- "recommended for you" treatment without overpromising
- advanced/custom placement and copy
- review-before-create transition
- mobile/narrow layout
- Hito DS reuse requirements

Designer should not define:

- recipe IDs
- workout sequence truth
- backend eligibility logic
- target-time/date preset approval
- manual workout editing behavior

## V1 Preset Family Inventory

Recommended v1 candidates:

| Family                                     | Primary runner                                                               | Goal type                                     | V1 stance                                                                                                 |
| ------------------------------------------ | ---------------------------------------------------------------------------- | --------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Beginner consistency / run-walk adaptation | new runner, weak support, no benchmark                                       | `build_consistency` or short distance build   | Include. This is the safest high-value preset.                                                            |
| 5K foundation                              | new/returning/recreational runner                                            | `5k`                                          | Include. Keep easy-first; add strides only when support allows.                                           |
| 10K foundation                             | returning/recreational runner                                                | `10k`                                         | Include. Keep progression conservative and metric-safe.                                                   |
| Half marathon balanced                     | recreational/consistent runner                                               | `half_marathon`                               | Include. Use supported cadence/specifity only when support gates pass.                                    |
| Marathon base                              | consistent/experienced enough runner without aggressive target-time pressure | `marathon`                                    | Include cautiously. Emphasize base, durability, cutback, taper, and recovery-first sequencing.            |
| Trail/mountain durability                  | returning/consistent runner with terrain intent                              | `mountain_running` or trail-oriented distance | Gate through Running Coach. Include only if v1 can stay structure-only, recovery-aware, and terrain-safe. |

Deferred by default:

- aggressive target-time presets
- target-date-specific preset cards
- advanced two-quality-week presets
- race-pace-heavy presets without benchmark/watch support
- ultra-specific presets unless Running Coach approves a conservative time-on-feet recipe for v1
- any preset requiring personal HR zones before that truth exists

## Required Inputs Before Showing Presets

Minimum backend-owned setup truth:

- age, height, weight if the current first-plan profile contract still requires them
- experience/fitness level
- goal distance
- goal intent:
  consistency, foundation/base, balanced improvement, or trail/mountain durability
- target-time/date intent:
  collected only to route the runner to advanced/custom unless a later plan approves deterministic
  target-specific preset cards
- running days per week
- fixed rest days
- preferred long-run day, optional but respected when provided
- execution support:
  watch/app support is required for executable structured first-plan generation under the current
  contract
- benchmark support:
  recent 5K time/pace, known benchmark, or explicitly unknown
- terrain focus where relevant
- injury/recovery/caution context if present

Preset cards should be hidden or flagged when setup truth is insufficient for safe expansion.

## Reuse Of Existing Canonical Seams

Must reuse:

- `structuredFirstPlanOnboardingInputSchema` / structured setup parsing where possible
- `buildStructuredFirstPlanAuthoringInput(...)` or a sibling mapper for preset setup
- `structuredPlanAuthoringInputSchema`
- `buildStructuredAuthoringPlan(...)` and related structured-plan authoring helpers where safe
- `structured-plan-authoring-policy.ts` recovery, cadence, cutback, taper, and specificity rules
- `structured-plan-authoring-workouts.ts` and `structured-plan-authoring-segments.ts`
- `structured-plan-authoring-metrics.ts` metric-truth resolver
- `rich-workout-model.ts` canonical families, identities, executable modes, and HR source truth
- `createFirstPlanFromReviewedCanonicalPlanForUser(...)` persistence seam
- existing signed review/confirm pattern

Must not reuse as source truth:

- frontend card state
- raw JSON import templates
- old strict nested AI draft contract
- `structured_authoring_v1` as a successful first-plan fallback source

## Relationship To Manual Workout Authoring

Manual workout authoring is related but separate.

Preset-first v1 should not wait for:

- add workout on empty day
- edit existing planned workout
- copy/paste workouts
- recurrence
- segment-level user editing

Compatibility requirement:

- preset-generated rows must use canonical workout identities, segment bodies, metric mode, source
  metadata, and rich fields that the future manual editor can later read and edit
- manual editing should mutate or version canonical planned workouts through its own reviewed
  backend-owned mutation model
- manual editing must not own preset recipe truth
- manual editing must not be needed to fix a poor preset; poor presets should be fixed in recipe
  doctrine/backend generation

## Backend Slice 1

Owner: BACKEND

Status: implemented and QA-passed on 2026-06-07 after Plan Preset naming/source-kind cleanup.

Implementation notes:

- Added `src/lib/plan-presets/schema.ts` as the typed contract owner for preset eligibility
  input, card view models, bounded card states, result codes, reason codes, metric-truth summary,
  and the non-mutating future preset review draft metadata shape.
- Added `src/lib/plan-presets/recipes.ts` as the v1 code-owned recipe registry skeleton for
  `10K`, `Half marathon`, and `Marathon` cards, including recipe family IDs, recipe IDs, version,
  minimum running-day gates, commitment summary, fit summary, and metric policy summary.
- Added `src/lib/plan-presets/resolver.ts` as the backend-owned deterministic eligibility
  resolver. It reuses structured first-plan onboarding input parsing, first-plan execution-mode
  normalization, and runner training-preference weekday helpers.
- Added `scripts/validate-plan-preset-eligibility.ts` to prove the fixture matrix for
  supported cards, custom routing, missing watch/app support, metric-truth honesty, bounded
  reason/result codes, and non-mutating draft metadata.
- Corrected the technical source kind and recipe IDs from first-plan-only naming to reusable
  `plan_preset_v1` / `plan_preset_*` naming before QA or persistence hardens the contract.
- No OpenAI call, frontend route, persistence, confirm/create path, DB schema, or full recipe
  expansion was added in Backend Slice 1.

The Designer interaction boundary was clear enough for the backend contract. Running Coach doctrine
can still gate full recipe expansion and final v1 family approval, but it does not need to block the
eligibility/card view-model seam.

Goal:

Implement the backend-owned preset eligibility and card view-model contract behind service/CLI or
harness tests, without frontend rollout.

Decision:

- Slice 1 should include a typed recipe registry skeleton only as far as needed to produce honest
  cards that map to backend recipe families/IDs.
- Slice 1 should define the non-mutating preset review draft contract and metadata shape, but full
  canonical plan expansion/review generation may remain Slice 2 if implementing it would blur the
  eligibility/card contract.
- Slice 1 must not persist preset-generated plans and must not expose a runner-facing frontend path.

Scope:

- add typed preset eligibility input contract from structured setup truth
- add typed preset card view-model contract for `10K`, `Half marathon`, and `Marathon`
- add eligibility resolver from setup input to backend-shaped preset cards
- add explicit eligibility result codes
- add card states:
  `recommended`, `available`, `needs_more_info`, `custom_fit`, and `unavailable`
- add displayable disabled/custom reasons
- add typed recipe registry skeleton with recipe family IDs, recipe IDs, versions, family labels,
  minimum eligibility gates, and metric policy summary
- map enabled cards to backend recipe family/recipe IDs, not frontend static templates
- define non-mutating preset review draft contract and source metadata:
  - `source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `presetId`
  - `presetVersion`
  - `persisted: false`
- define how the future review draft carries:
  why-this-fit summary, days per week, fixed rest days, preferred long-run day, horizon,
  target mode, metric policy, safety assumptions, row counts, and no-mutation status
- prove no OpenAI call in eligibility/card happy path
- preserve blueprint default and envelope internal option
- preserve no `structured_authoring_v1` fallback success leak

Eligibility input contract must include:

- profile fields:
  age, height, weight
- runner level:
  beginner, running/recreational, experienced
- availability:
  running days per week, fixed rest days, optional preferred long-run day
- execution support:
  watch/app support, pace support only when pace truth exists, HR support only when personal zones
  exist
- benchmark:
  recent 5K or unknown
- goal intent:
  foundation/base, balanced improvement, durability/finish comfortably
- target date/time presence flags:
  route to advanced/custom, not normal preset cards
- optional context/caution:
  route material comments, injury/pain, unusual constraints, and uncommon goals to advanced/custom
  or unavailable states

Card view model contract must include:

- stable card ID and runner-facing label
- distance/program label:
  `10K`, `Half marathon`, or `Marathon`
- optional family label:
  Foundation, Balanced, Base, or Durability
- state:
  `recommended`, `available`, `needs_more_info`, `custom_fit`, or `unavailable`
- recipe family/recipe ID/version for enabled preset cards
- commitment summary
- fit summary
- safety/metric note
- inline disabled/custom reason
- required missing fields when state is `needs_more_info`
- advanced/custom routing reason when state is `custom_fit`
- non-mutating/review-before-create copy flag
- Backend Slice 2E must extend this with backend-owned program summary fields:
  `durationWeeks`, `startDate`, `estimatedEndDate`, `daysPerWeek`, `longRunDay`,
  `programFamily`, `workoutMixSummary`, `keyWorkoutTypes`, `metricModeSummary`,
  `whyThisFits`, and `levelFitSummary`.

Eligibility/result codes should include:

- `eligible_recommended`
- `eligible_available`
- `needs_more_info`
- `correction_required`
- `custom_recommended`
- `unavailable`

Disabled/custom reasons should include:

- `target_date_present`
- `target_time_present`
- `material_comment_present`
- `injury_or_pain_signal`
- `missing_watch_app_support`
- `missing_required_profile`
- `insufficient_availability`
- `fixed_rest_conflict`
- `unsupported_goal`
- `metric_truth_insufficient_for_target`
- `recipe_not_available`

Required enforcement:

- no OpenAI call on preset eligibility/card happy path
- no frontend-computed eligibility
- target date/time routes to advanced/custom
- material comments or unusual constraints route to advanced/custom
- watch/app missing returns needs-more-info/correction, not preset success
- metric truth notes come from backend
- cards map to backend recipe families/IDs, not frontend static templates

Out of scope:

- frontend cards
- public onboarding default switch
- manual workout editing
- DB schema/storage for recipes
- full recipe expansion if it would make Slice 1 too broad
- production rollout without QA

## Backend Slice 2A

Owner: BACKEND

Status: complete / QA-passed on 2026-06-07 after the `sourceKind` contract fix.

Decision:

- Choose one-family Slice 2A instead of full multi-family Backend Slice 2.
- Include only `10K Foundation` / `plan_preset_10k_foundation_v1`.
- Defer `Half marathon balanced` and `Marathon base` expansion until the 10K recipe-to-draft seam
  is QA-green.

Why:

- 10K Foundation is the smallest useful family that can prove the preset recipe pipeline without
  carrying half/marathon specificity and long-horizon risk.
- It exercises the core architecture:
  eligibility card -> recipe ID/version -> canonical draft rows -> review metadata -> no mutation.
- It reduces release risk and keeps troubleshooting focused on the source-of-truth seam rather than
  broad coaching variety.

Goal:

Expand the eligible 10K Foundation recipe into a canonical non-mutating reviewed draft, still behind
backend service/CLI/harness only.

Scope:

- expand `plan_preset_10k_foundation_v1` into canonical `training-plan-v2` draft rows
- reuse existing structured authoring, rich workout, segment, sequencing, and metric-truth helpers
- return a reviewed draft object/token shape for future confirm wiring
- preserve explicit metadata:
  - `source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `presetId: plan_preset_10k_foundation_v1`
  - `presetVersion`
  - `persisted: false`
- enforce fixed rest days and preferred long-run day
- preserve recovery-first sequencing after long runs
- include cutback rhythm appropriate to the recipe
- preserve executable target modes and metric-truth gates
- enforce 10K Foundation allowed/forbidden identities
- enforce pattern-density and rich segment gates
- keep advanced/custom routing separate for target date, target time, material comments, injury/pain
  signals, and unsupported setups

Allowed 10K Foundation identity policy:

- allowed:
  run/walk adaptation when beginner gates require it, recovery/easy support, long aerobic support,
  cutback aerobic work, and strides only when support gates allow
- forbidden in Slice 2A:
  unsupported tempo, unsupported intervals, race pace, two-quality weeks, marathon-specific long-run
  finish work, fake pace targets, and executable HR without personal zones

Out of scope:

- half marathon expansion
- marathon expansion
- DB writes
- confirm/create persistence
- frontend route/cards
- OpenAI calls
- active-plan replacement or refresh
- manual workout authoring/editing
- production default switch

QA fixture expectations:

- supported 10K Foundation setup expands to complete canonical draft rows
- draft metadata uses `source_kind = plan_preset_v1`, `sourceStatus = preset_recipe_expanded`,
  `presetId = plan_preset_10k_foundation_v1`, and `persisted = false`
- exact row count and non-rest count are deterministic and asserted by fixture
- fixed rest days have zero workout leaks
- preferred long-run day is preserved
- next actual running slot after long run is recovery/easy
- no single-segment non-rest regression
- no missing rich fields or missing meaningful segments
- structure-only executable rows include numeric duration/distance/repeat/recovery anatomy
- target time alone produces zero pace targets
- age-estimated HR produces zero executable/personal HR targets
- target date, target time, material comments, and injury/pain signals do not expand as presets and
  route to Advanced custom
- no OpenAI call, DB write, frontend route, confirm path, or `structured_authoring_v1` fallback
  success leak
- blueprint custom path remains `ai_first_plan_blueprint_v1`
- envelope remains internal/non-default

Closeout evidence:

- `plan_preset_10k_foundation_v1` produces a non-mutating review draft contract.
- Contract source exactness passed:
  - `sourceKind: "plan_preset_v1"`
  - `source_kind: "plan_preset_v1"`
  - canonical plan metadata `source_kind: "plan_preset_v1"`
  - `sourceStatus: "preset_recipe_expanded"`
  - `persisted: false`
- No-benchmark fixture remained deterministic:
  - 70 calendar rows
  - 30 non-rest rows
  - 40 rest rows
  - 10 weeks
- Safety flags passed:
  - `doesNotCallOpenAi: true`
  - `doesNotMutatePlan: true`
  - `persistsNothing: true`
- At Slice 2A time, no confirm path existed yet; Backend Slice 3 later changed the review contract
  to expose confirm readiness through backend-issued token/checksum.
- Blueprint custom path remains preserved as `ai_first_plan_blueprint_v1`.
- No frontend route, DB schema, persistence, OpenAI call, or confirm path was introduced.

Next decision from Slice 2A:

- Completed in Backend Slice 2B. `Half marathon balanced` is now QA-passed.
- Do not start frontend implementation yet. Frontend should wait until all three initial visible
  cards, 10K + Half marathon + Marathon, have backend-backed review contracts unless this plan
  explicitly switches to scaffold-only UI.

## Backend Slice 2B

Owner: BACKEND

Status: complete / QA-passed on 2026-06-07.

Decision:

- Include only `Half marathon balanced` / `plan_preset_half_marathon_balanced_v1`.
- `Marathon base` was deferred here until half-marathon pattern density became QA-green; it is now
  selected as Backend Slice 2C.

Why:

- 10K Foundation proved the simple road foundation seam.
- Half marathon balanced is the smallest next family that proves richer pattern density before
  frontend cards depend on broad preset claims.
- Marathon base carries more long-horizon and durability risk and should wait until the half seam is
  stable.

Goal:

Expand the eligible Half marathon balanced recipe into a canonical non-mutating reviewed draft,
still behind backend service/CLI/harness only.

Scope:

- expand `plan_preset_half_marathon_balanced_v1` into canonical `training-plan-v2` draft rows
- keep explicit metadata:
  - `sourceKind: plan_preset_v1`
  - `source_kind: plan_preset_v1`
  - canonical plan metadata `source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `presetId: plan_preset_half_marathon_balanced_v1`
  - `persisted: false`
- preserve fixed rest days and preferred long-run day
- preserve recovery-first sequencing after long runs
- enforce half-specific pattern density without race-pace/taper/interval overreach
- preserve executable target modes and metric-truth gates
- include rich segment anatomy for every non-rest row
- keep advanced/custom routing separate for target date, target time, material comments, injury/pain
  signals, and unsupported setups

Allowed Half marathon balanced identity policy:

- allowed:
  recovery/easy support, long aerobic support, cutback aerobic work, strides when support gates
  allow, controlled tempo/progression only when supported by existing beginner/recreational
  cadence rules, and half-marathon threshold durability only when metric/support gates allow
- forbidden in Slice 2B:
  unsupported race pace, unsupported road intervals, taper overreach, two-quality weeks, fake pace
  targets, executable HR without personal zones, and marathon-specific long-run finish work

Out of scope:

- marathon expansion
- DB writes
- confirm/create persistence
- frontend route/cards
- OpenAI calls
- active-plan replacement or refresh
- manual workout authoring/editing
- production default switch

QA fixture expectations:

- supported Half marathon balanced setup expands to complete canonical draft rows
- draft metadata uses `sourceKind/source_kind = plan_preset_v1`, `sourceStatus =
preset_recipe_expanded`, `presetId = plan_preset_half_marathon_balanced_v1`, and `persisted =
false`
- exact row count and non-rest count are deterministic and asserted by fixture
- fixed rest days have zero workout leaks
- preferred long-run day is preserved
- next actual running slot after long run is recovery/easy
- half-specific pattern density is present without intervals/race-pace/taper overreach
- every non-rest row has rich segment anatomy
- no single-segment non-rest regression
- structure-only executable rows include numeric duration/distance/repeat/recovery anatomy
- target time alone produces zero pace targets
- age-estimated HR produces zero executable/personal HR targets
- target date, target time, material comments, and injury/pain signals do not expand as presets and
  route to Advanced custom
- no OpenAI call, DB write, frontend route, confirm path, or `structured_authoring_v1` fallback
  success leak
- blueprint custom path remains `ai_first_plan_blueprint_v1`
- envelope remains internal/non-default

Implementation notes:

- Extended `src/lib/plan-presets/expand.ts` to support
  `plan_preset_half_marathon_balanced_v1` alongside the existing 10K Foundation recipe.
- Reused `buildStructuredFirstPlanAuthoringInput(...)`, `buildStructuredAuthoringPlan(...)`,
  existing structured workout builders, rich workout finalization, metric gates, and recovery-first
  sequencing rather than creating a parallel half-marathon generator.
- Added half-specific recipe guards: balanced style only, 4-5 days/week, continuous-running support
  evidence, no target date/time, no material comments, no race-pace/taper/interval overreach, and
  at most one moderate/specific touch per week.
- Added deterministic half no-benchmark and recent-5K benchmark fixture coverage to
  `scripts/validate-plan-preset-eligibility.ts`.

Closeout evidence:

- `plan_preset_half_marathon_balanced_v1` produces a non-mutating review draft contract.
- Contract source exactness passed:
  - `sourceKind/source_kind: plan_preset_v1`
  - canonical plan `source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `presetId: plan_preset_half_marathon_balanced_v1`
  - `persisted: false`
- No-benchmark fixture remained deterministic:
  - 84 calendar rows
  - 48 non-rest rows
  - 36 rest rows
  - 12 weeks
- Recent-5K fixture remained deterministic:
  - 84 calendar rows
  - 60 non-rest rows
  - 24 rest rows
  - 12 weeks
- Required identities were present:
  - `controlled_tempo_session`
  - `half_marathon_threshold_durability`
  - `long_run_with_steady_finish`
- Specific patterning was distributed, not a single late exception.
- Max specific/moderate touches per week remained 1.
- Forbidden race/taper/interval count was 0.
- No-benchmark setup uses `structure_only_executable`.
- Recent-5K setup can use `pace_executable` under metric gates.
- No fake pace or fake HR was introduced.
- Ineligible target-date, target-time, material-comment, insufficient-availability, and
  weak-beginner-base setups were rejected/routed out of preset expansion.
- Safety flags prove no OpenAI, mutation, persistence, or confirm path.
- Blueprint smoke remains preserved.
- Envelope smoke was intentionally omitted because envelope-adjacent code was not touched.

Next decision:

- Proceed to Backend Slice 2C for `Marathon base` non-mutating review draft expansion.
- Do not start frontend implementation yet. The intended initial UI cards are `10K`,
  `Half marathon`, and `Marathon`, so frontend should not depend on broad preset claims until all
  three visible card contracts are backend-backed.

## Backend Slice 2C

Owner: BACKEND

Status: complete / QA-passed on 2026-06-07.

Decision:

- Include only `Marathon base` / `plan_preset_marathon_base_v1`.
- Keep frontend UI, confirm/persistence, DB schema, and production rollout deferred.

Why:

- The intended initial UI cards are `10K`, `Half marathon`, and `Marathon`.
- 10K proved the simple road foundation seam.
- Half marathon proved richer pattern-density behavior.
- Marathon base is the remaining visible card contract and carries higher risk around long-run
  tolerance, durability patterning, and race-prep overreach.
- Proving marathon before frontend reduces fake-card risk.

Goal:

Expand the eligible Marathon base recipe into a canonical non-mutating reviewed draft, still behind
backend service/CLI/harness only.

Scope:

- expand `plan_preset_marathon_base_v1` into canonical `training-plan-v2` draft rows
- keep explicit metadata:
  - `sourceKind: plan_preset_v1`
  - `source_kind: plan_preset_v1`
  - canonical plan metadata `source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `presetId: plan_preset_marathon_base_v1`
  - `persisted: false`
- preserve fixed rest days and preferred long-run day
- preserve recovery/easy after long runs
- include marathon-steady durability and long-run specificity without race-prep overreach
- preserve executable target modes and metric-truth gates
- include rich segment anatomy for every non-rest row
- reject insufficient long-run tolerance, target date, target time, material comments, and unsafe
  setup shapes

Allowed Marathon base identity policy:

- allowed:
  recovery/easy support, long aerobic support, marathon steady durability when support gates allow,
  long-run specificity, cutback long runs, and conservative strides/support work when safe
- forbidden in Slice 2C:
  race pace, taper tune-up/race-prep identities, unsupported intervals, aggressive performance
  identities, two-quality weeks, fake pace targets, executable HR without personal zones, and
  unsupported target-time specificity

Out of scope:

- DB writes
- confirm/create persistence
- frontend route/cards
- OpenAI calls
- active-plan replacement or refresh
- manual workout authoring/editing
- production default switch

QA fixture expectations:

- supported Marathon base setup expands to complete canonical draft rows
- draft metadata uses `sourceKind/source_kind = plan_preset_v1`,
  `sourceStatus = preset_recipe_expanded`, `presetId = plan_preset_marathon_base_v1`, and
  `persisted = false`
- exact row count and non-rest count are deterministic and asserted by fixture
- fixed rest days have zero workout leaks
- preferred long-run day is preserved
- next actual running slot after long run is recovery/easy
- marathon-steady durability and long-run specificity are present without race-pace/taper/interval
  overreach
- every non-rest row has rich segment anatomy
- no single-segment non-rest regression
- structure-only executable rows include numeric duration/distance/repeat/recovery anatomy
- target time alone produces zero pace targets
- age-estimated HR produces zero executable/personal HR targets
- insufficient long-run tolerance, target date, target time, material comments, and injury/pain
  signals do not expand as presets and route to Advanced custom or unavailable/correction
- no OpenAI call, DB write, frontend route, confirm path, SQL wiring, or `structured_authoring_v1`
  fallback success leak
- blueprint custom path remains `ai_first_plan_blueprint_v1`
- envelope remains internal/non-default

Implementation notes:

- Added Marathon Base non-mutating review draft expansion in `src/lib/plan-presets/expand.ts`.
- Added Marathon Base long-run tolerance eligibility support in `src/lib/plan-presets/resolver.ts`.
- Added deterministic harness coverage for:
  - no-benchmark Marathon Base: 16 weeks / 112 calendar rows / 64 non-rest / 48 rest,
    `structure_only_executable`, no pace targets, no executable HR targets
  - recent-5K Marathon Base: 16 weeks / 112 calendar rows / 80 non-rest / 32 rest,
    backend-gated pace targets, no executable HR targets
  - target-date, target-time, material-comment, insufficient long-run tolerance, and insufficient
    availability rejection
- Preserved non-mutating review contract: `sourceKind/source_kind = plan_preset_v1`,
  `sourceStatus = preset_recipe_expanded`, `presetId = plan_preset_marathon_base_v1`, and
  `persisted = false`.
- Frontend cards/review UI, DB schema, confirm/persistence, OpenAI, and production rollout remain
  out of scope.

Closeout evidence:

- `plan_preset_marathon_base_v1` produces a non-mutating review draft contract.
- Contract source exactness passed:
  - `sourceKind/source_kind: plan_preset_v1`
  - canonical plan `source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `presetId: plan_preset_marathon_base_v1`
  - `persisted: false`
- No-benchmark fixture remained deterministic:
  - 16 weeks
  - 112 calendar rows
  - 64 non-rest rows
  - 48 rest rows
- Recent-5K fixture remained deterministic:
  - 16 weeks
  - 112 calendar rows
  - 80 non-rest rows
  - 32 rest rows
- Required identities were present:
  - `marathon_steady_specificity`
  - `long_run_with_steady_finish`
  - `cutback_long_run`
- Fixed rest days were protected.
- Long runs stayed on Saturday in the fixture.
- Post-long-run days were recovery/easy.
- Every non-rest row had rich multi-segment anatomy.
- Forbidden overreach count was 0.
- Max marathon-specific touches per week remained 1.
- No-benchmark setup uses `structure_only_executable`.
- Recent-5K setup uses `pace_executable` only with benchmark truth.
- No fake pace or fake HR was introduced.
- Ineligible setups rejected boundedly.
- Safety flags prove no OpenAI, mutation, persistence, or confirm path.
- Blueprint smoke passed.

Maintainability observation:

- `src/lib/plan-presets/expand.ts` is now about 1010 lines.
- `scripts/validate-plan-preset-eligibility.ts` is now about 1120 lines.
- QA did not fail Slice 2C on size, but recommended extracting per-recipe expansion/policy
  ownership and per-recipe harness assertions before adding frontend, confirm/persistence, or more
  preset families.

Next decision:

- Proceed to Backend cleanup Slice 2D before frontend implementation.
- Do not add new preset families before cleanup.
- Do not start frontend real card/review UI until this extraction preserves all current
  10K/Half/Marathon behavior.

## Program Summary Contract Correction

Status: accepted as Backend Slice 2E after cleanup Slice 2D.

Decision:

- Plan Preset cards and reviews must include backend-owned program summary fields before frontend
  implementation begins.
- Frontend must not calculate duration, estimated end date, safety fit, workout mix, or metric
  honesty locally.
- This is a contract/behavior addition, not a no-behavior cleanup, so it must not be folded into
  Backend Slice 2D.

Required backend-owned summary fields:

- `durationWeeks`
- selected or planned `startDate`
- `estimatedEndDate`
- `daysPerWeek`
- `longRunDay`
- `programFamily`
- `workoutMixSummary`
- `keyWorkoutTypes`
- `metricModeSummary`
- `whyThisFits`
- `levelFitSummary`
- disabled or custom routing reason when the runner is not eligible

Start-date and end-date behavior:

- Backend owns start-date normalization and end-date arithmetic.
- The default start date may be today or the next safe training date, following existing onboarding
  rules.
- The runner may choose a start date before confirm.
- Changing the start date must recompute `estimatedEndDate` through the backend eligibility/review
  contract.
- Selected start date is not a target race date and must not enable target-date preset behavior.

Duration behavior:

- Duration may vary by runner level, support evidence, and recipe variant, but only through
  backend-owned eligibility and recipe selection.
- Current proven v1 defaults remain:
  - `10K Foundation`: 10 weeks
  - `Half marathon balanced`: 12 weeks
  - `Marathon base`: 16 weeks
- Future duration variants may be added only as explicit backend recipe variants with QA fixtures.
- Physical/profile inputs may influence starting volume, conservatism, long-run tolerance,
  eligibility warnings, and executable target mode.
- Physical/profile inputs must not create precise pace, personal HR targets, race-performance
  promises, or target-time outcome claims.

Card display requirements:

- Show duration, for example `10 weeks`, `12 weeks`, or `16 weeks`.
- Show `Starts <date> · Ends <date>` when the start date is known.
- Show compact workout mix from backend copy, for example:
  - `Easy + progression + rhythm`
  - `Tempo + threshold durability + long-run finish`
  - `Marathon steady + long-run specificity`
- Show metric honesty note when pace or HR targets are withheld.
- Show disabled/custom reason from backend when the card is not eligible.

Review requirements:

- Show selected start date and estimated end date.
- Show full workout-mix breakdown and key weekly rhythm.
- Show days per week, fixed rest days, and preferred long-run day.
- Show why this program fits the runner's level/support.
- Show safety assumptions, metric policy, and any eligibility caveats.
- Preserve the non-mutating review-before-create boundary.

Slice sequencing decision:

- Backend Slice 2D remains pure no-behavior-change extraction.
- Backend Slice 2E adds the program summary fields and date behavior to the eligibility/card and
  non-mutating review contracts.
- Frontend preset cards/review remain blocked until Slice 2D, Slice 2E, and the follow-up Slice 2F
  composition-contract extraction have all passed QA.

## Backend Slice 2D

Owner: BACKEND

Status: complete / QA-passed on 2026-06-07.

Decision:

- Perform no-behavior-change extraction before frontend work.
- Split per-recipe expansion/policy ownership out of the growing `src/lib/plan-presets/expand.ts`.
- Split per-recipe harness/assertion ownership out of the growing
  `scripts/validate-plan-preset-eligibility.ts`.

Why:

- The three intended visible cards are now backend-backed.
- Frontend can rely on real backend contracts after cleanup, but should not inherit a 1000+ line
  expansion hotspot and 1100+ line harness as the stable seam.
- This follows the file-size/decomposition discipline and prevents the next preset step from
  hardening a large mixed-responsibility module.

Scope:

- no behavior change
- keep public recipe expansion facade stable where possible
- extract 10K Foundation policy/expansion details into a focused owner
- extract Half marathon balanced policy/expansion details into a focused owner
- extract Marathon base policy/expansion details into a focused owner
- extract per-recipe fixture/assertion helpers from the validation harness
- preserve existing recipe IDs:
  `plan_preset_10k_foundation_v1`,
  `plan_preset_half_marathon_balanced_v1`,
  `plan_preset_marathon_base_v1`
- preserve all no-active-plan, non-mutating, no-OpenAI, no-DB, no-frontend, no-confirm boundaries

Out of scope:

- new preset families
- frontend cards/review UI
- program duration, start date, estimated end date, workout-mix summary, and level-fit summary
  contract changes
- confirm/create persistence
- DB schema or SQL
- OpenAI calls
- production/default rollout
- active-plan replacement or refresh

Validation expectations:

- all current 10K Foundation, Half marathon balanced, and Marathon base fixtures pass unchanged
- exact row/non-rest/rest counts remain unchanged
- source metadata remains `plan_preset_v1`
- all custom/advanced routing and ineligible setup rejection stays unchanged
- fixed rest, preferred long-run, recovery-first, metric-truth, and rich segment invariants stay
  unchanged
- blueprint smoke remains preserved
- no envelope promotion or touch unless required by import fallout, which should be avoided

Implementation notes:

- `src/lib/plan-presets/expand.ts` remains the stable public facade for
  `buildPlanPresetReviewDraftContract(...)`.
- Shared expansion mechanics moved to `src/lib/plan-presets/recipe-expanders/shared.ts`.
- 10K recipe-specific authoring, normalization, and assertions moved to
  `src/lib/plan-presets/recipe-expanders/10k-foundation.ts`.
- Half marathon recipe-specific authoring, normalization, and assertions moved to
  `src/lib/plan-presets/recipe-expanders/half-marathon-balanced.ts`.
- Marathon recipe-specific authoring, normalization, and assertions moved to
  `src/lib/plan-presets/recipe-expanders/marathon-base.ts`.
- `scripts/validate-plan-preset-eligibility.ts` remains the stable CLI entrypoint.
- Shared harness fixtures/assertions moved to `scripts/plan-presets/helpers.ts`.
- Per-recipe harness assertions moved to:
  - `scripts/plan-presets/10k-foundation.ts`
  - `scripts/plan-presets/half-marathon-balanced.ts`
  - `scripts/plan-presets/marathon-base.ts`
- Line-count proof:
  - `src/lib/plan-presets/expand.ts`: 1010 -> 158 lines
  - `scripts/validate-plan-preset-eligibility.ts`: 1120 -> 193 lines
  - runtime extracted files: shared 368, 10K 156, half 235, marathon 223
  - harness extracted files: helpers 301, 10K 192, half 237, marathon 238

Behavior-preservation evidence:

- Stable validator entrypoint passed after extraction:
  `node --import tsx ./scripts/validate-plan-preset-eligibility.ts`.
- Plan Preset harness passed after extraction.
- Targeted ESLint passed after extraction.
- Row counts stayed unchanged for all proven families:
  - `10K Foundation`: 70 calendar rows, 30 non-rest rows, 40 rest rows, 10 weeks
  - `Half marathon balanced` no-benchmark: 84 calendar rows, 48 non-rest rows, 36 rest rows,
    12 weeks
  - `Half marathon balanced` recent-5K: 84 calendar rows, 60 non-rest rows, 24 rest rows,
    12 weeks
  - `Marathon base` no-benchmark: 112 calendar rows, 64 non-rest rows, 48 rest rows, 16 weeks
  - `Marathon base` recent-5K: 112 calendar rows, 80 non-rest rows, 32 rest rows, 16 weeks
- Source metadata stayed exact:
  - `sourceKind/source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `persisted: false`
- Fixed rest, long-run day, recovery-first sequencing, rich segments, and metric gates were
  preserved.
- No fake pace or fake HR was introduced.
- No OpenAI, DB, SQL/schema, frontend route/component, confirm, or persistence path was added.
- Slice 2E runtime/harness fields were intentionally not added in Slice 2D:
  no `durationWeeks`, selected `startDate`, `estimatedEndDate`, `workoutMixSummary`,
  `keyWorkoutTypes`, `whyThisFits`, or `levelFitSummary` behavior was introduced by the cleanup.
- No new preset family, frontend route, DB schema, confirm path, persistence, OpenAI call, or
  program-summary behavior was added in Slice 2D.

## Backend Slice 2E

Owner: BACKEND

Status: complete / QA-passed on 2026-06-07.

Decision:

- Add backend-owned Plan Preset program summary fields for card and review view models.
- Keep this non-mutating, no-OpenAI, no-DB, no-frontend, and no-confirm.
- Do not add new preset families.

Scope:

- extend the preset eligibility/card view model with:
  `durationWeeks`, `startDate`, `estimatedEndDate`, `daysPerWeek`, `longRunDay`,
  `programFamily`, `workoutMixSummary`, `keyWorkoutTypes`, `metricModeSummary`,
  `whyThisFits`, and `levelFitSummary`
- include disabled/custom reason fields for ineligible cards
- compute `estimatedEndDate` from backend-owned start-date handling and recipe duration
- recompute card/review summaries when the selected start date changes
- expose the proven v1 defaults:
  `10K Foundation = 10 weeks`, `Half marathon balanced = 12 weeks`,
  `Marathon base = 16 weeks`
- keep duration variation backend-owned for future recipe variants
- preserve metric truth: no fake pace, no fake personal HR, and no race-performance promises
- carry the same summary fields into the non-mutating preset review contract

Required behavior:

- Backend owns start-date normalization.
- Backend owns estimated end-date arithmetic.
- Runner may choose a start date before confirm.
- Changing start date must recalculate `estimatedEndDate` through the backend contract.
- Selected start date is not a target race date and must not unlock target-date preset behavior.
- V1 duration defaults remain:
  - `10K Foundation`: 10 weeks
  - `Half marathon balanced`: 12 weeks
  - `Marathon base`: 16 weeks
- Future duration variation by level/support is allowed only as backend-owned recipe variants with
  QA fixtures.

Out of scope:

- target-date presets
- target-time presets
- frontend date arithmetic
- frontend-computed workout mix or safety fit
- confirm/create persistence
- DB schema or SQL
- OpenAI calls
- manual workout CRUD
- active-plan replacement or refresh

Validation expectations:

- 10K, Half marathon, and Marathon eligible card fixtures include exact backend-owned
  `durationWeeks`
- start-date fixtures produce deterministic `estimatedEndDate`
- changing start date recomputes `estimatedEndDate` without changing hidden recipe truth
- workout-mix summaries match the expanded recipe identities and remain runner-safe
- no pace/HR summary claims appear without validated metric truth
- disabled/custom cards include displayable reasons
- no mutation, OpenAI call, DB write, frontend route, confirm path, or SQL wiring is introduced

Implementation notes:

- `PlanPresetCardViewModel` now carries backend-owned program summary/date fields for every card
  state:
  `durationWeeks`, `startDate`, `estimatedEndDate`, `daysPerWeek`, `longRunDay`,
  `programFamily`, `workoutMixSummary`, `keyWorkoutTypes`, `metricModeSummary`, `whyThisFits`,
  `levelFitSummary`, `disabledReasonSummary`, and `customReasonSummary`.
- `PlanPresetReviewDraftContract.reviewShape` now carries the same summary/date fields plus
  `weeklyRhythmSummary` and `restDays`.
- Start date normalization reuses `buildStructuredFirstPlanAuthoringInput(...)`, so cards and
  review drafts share the same backend-owned start-date source.
- `estimatedEndDate` is computed as `startDate + durationWeeks * 7 - 1`.
- V1 durations remain fixed by recipe:
  10K Foundation = 10 weeks, Half Marathon Balanced = 12 weeks, Marathon Base = 16 weeks.
- Target-date and target-time inputs still route to Advanced custom; preset `estimatedEndDate`
  remains recipe-duration arithmetic and does not become target-date behavior.
- Harness coverage now asserts program summary fields, disabled/custom reason summaries, deterministic
  end-date values, and start-date recomputation without row-count drift.

Closeout evidence:

- Enabled cards and non-mutating review drafts expose backend-owned program summary/date fields:
  `durationWeeks`, `startDate`, `estimatedEndDate`, `daysPerWeek`, `longRunDay`,
  `programFamily`, `workoutMixSummary`, `keyWorkoutTypes`, `metricModeSummary`, `whyThisFits`,
  and `levelFitSummary`.
- Disabled and custom routing summaries are backend-shaped and displayable.
- Start-date normalization and estimated end-date arithmetic are backend-owned.
- Changing start date changes `estimatedEndDate` without changing row counts or hidden recipe truth.
- Target date and target time still route to Advanced custom and do not become preset end-date
  logic.
- V1 durations are preserved:
  - `10K Foundation`: 10 weeks
  - `Half marathon balanced`: 12 weeks
  - `Marathon base`: 16 weeks
- Row counts and source metadata are preserved:
  - `sourceKind/source_kind: plan_preset_v1`
  - `sourceStatus: preset_recipe_expanded`
  - `persisted: false`
- Metric gates are preserved:
  no fake pace, no fake personal HR, and no race-performance promises.
- Boundary proof remained clean:
  no OpenAI, DB/SQL/schema, frontend route/component, confirm, persistence, new preset families,
  stale first-plan runtime naming, or Slice 2F implementation was introduced in Slice 2E.

## Composition Model Architecture Audit

Status: completed on 2026-06-07.

Decision:

- Choose Option C: preserve and QA the current Slice 2E program summary/date contract, then insert a
  bounded Backend Slice 2F composition-contract extraction before frontend implementation, new
  preset families, confirm/persistence, or production rollout.
- Do not pause or invalidate the QA-passed 10K, Half marathon, and Marathon outputs.
- Do not treat current recipe expanders as the final scalable model for future presets.

Architecture diagnosis:

- The current model is a bounded hybrid, not a fully hardcoded row-by-row program builder.
- Acceptable rule-based seams already exist:
  - eligibility and metric truth are backend-owned in `resolver.ts`
  - recipe registry metadata is centralized in `recipes.ts`
  - draft expansion uses `buildStructuredAuthoringPlan(...)` rather than frontend/static rows
  - shared helpers own safe specific-workout placement, long-run steady finish, post-long-run
    recovery, support-row splitting, retagging, row counting, and identity summaries
  - source metadata remains `plan_preset_v1` / `preset_recipe_expanded` / `persisted: false`
- Hardcoding risk remains moderate:
  - Half marathon and Marathon expanders still encode literal week placements such as week 5,
    week 7, and week 9.
  - Each recipe keeps its own identity allowlist and specific-touch assertions.
  - Program summaries currently read recipe metadata and generated identities, but there is not yet
    one typed composition owner that ties duration, phase rhythm, week archetypes, workout mix, and
    summary copy together.
  - Adding future presets through more per-recipe `apply*Pattern(...)` functions would recreate a
    large mixed-responsibility hotspot.

Composition model boundary:

- Future Plan Preset generation should move toward:
  `runner input -> eligibility -> recipe parameters -> day/workout identity rules -> week archetypes -> phase progression -> deterministic draft -> review contract`.
- Current 10K, Half marathon, and Marathon outputs become acceptance fixtures for the composition
  model and must remain unchanged during extraction unless a separate safety issue is proven.
- Recipe-specific parameters may remain recipe-owned:
  duration weeks, distance label, family label, min/max running days, support gates, allowed and
  forbidden identities, required identity signals, key-workout density, cutback cadence, and
  runner-facing program summaries.
- Shared rules must become composition-owned:
  safe placement away from long-run adjacency, phase/window selection, week archetype mapping,
  one-specific-touch weekly cap, long-run steady-finish placement, post-long-run recovery, identity
  downgrade/coercion, support-row splitting, finalization, metric truth, and row/identity summary
  derivation.
- Running Coach doctrine should define allowed identities, density, progression, cutback, and phase
  intent; BACKEND must encode those as deterministic rules and validation fixtures, not prose-only
  copy and not AI-owned truth.
- Program summary/date fields should derive from the same recipe/composition contract:
  duration, selected start date, estimated end date, days/week, long-run day, workout mix, key
  workout types, metric policy, and why-this-fits copy must not become a separate duplicate summary
  layer.

Backend Slice 2F direction:

- Extract a minimal Plan Preset composition contract with no behavior change.
- Keep current public facades stable where possible.
- Introduce a typed composition spec or equivalent owner for:
  recipe duration, phase/week archetypes, required identity signals, forbidden identities,
  placement windows, specific-touch caps, long-run variation, cutback/taper policy, metric policy,
  and summary derivation.
- Re-express the existing 10K Foundation, Half marathon balanced, and Marathon base recipes through
  that composition contract while preserving exact outputs and QA fixture counts.
- Keep hard-coded week numbers only as temporary recipe parameters with named phase/window meaning,
  not hidden procedural logic inside per-recipe expanders.
- Prevent future sprawl by requiring new preset families to add composition data plus fixtures,
  not new ad hoc full-program construction.

Out of scope for the composition audit and Slice 2F:

- no new preset families
- no frontend cards/review UI
- no confirm/create persistence
- no DB schema or SQL
- no OpenAI calls
- no production/default rollout
- no active-plan replacement or refresh
- no broad perfect-training-engine rewrite

## Backend Slice 2F

Owner: BACKEND

Status: complete / QA-passed on 2026-06-07.

Decision:

- Extract a minimal Plan Preset composition contract with no behavior change.
- Preserve exact current 10K Foundation, Half marathon balanced, and Marathon base outputs as
  acceptance fixtures.
- Keep `buildPlanPresetReviewDraftContract(...)`, `resolvePlanPresetCards(...)`, and
  `node --import tsx ./scripts/validate-plan-preset-eligibility.ts` behavior stable.

Target composition hierarchy:

- Day primitives:
  rest, fixed rest, recovery run, easy run, steady run, long run, hill session,
  tempo/threshold session, marathon steady specificity, cutback long run.
- Workout identity templates:
  existing canonical workout identities and rich segment builders only; no frontend templates.
- Week archetypes:
  foundation week, build week, cutback week, specificity week, recovery-support week,
  peak-safe week.
- Phase/program rules:
  distance, level, availability, long-run day, fixed rest days, duration weeks, progression caps,
  key workout density, cutback cadence, metric truth mode, and safety gates.
- Final output:
  deterministic canonical `training-plan-v2` draft rows with rich segments, metric gates,
  source metadata, non-mutation flags, and review metadata.

Expected extraction outcome:

- Extract shared composition vocabulary and rule ownership from recipe expanders.
- Reduce literal week-placement and per-recipe allowlist duplication where safe.
- Keep genuinely recipe-specific parameters recipe-owned:
  distance, duration weeks, level/support gates, allowed/forbidden identities, required signals,
  key-workout density, cutback cadence, and summary copy.
- Keep shared composition logic shared:
  placement windows, phase/week archetypes, day primitives, workout identity templates, one-specific
  weekly cap, long-run variation, post-long-run recovery, support-row splitting, finalization,
  metric truth, row summaries, and review-summary derivation.
- Add or adjust harness assertions proving exact output preservation.
- Document what remains recipe-specific versus shared composition logic.

Constraints:

- no behavior change
- no row-count changes
- no summary/date field changes
- no frontend UI
- no DB/schema changes
- no confirm/persistence
- no OpenAI calls
- no new preset families
- no full training-engine rewrite
- no invalidation of QA-passed 10K/Half/Marathon outputs

Validation expectations:

- current 10K Foundation, Half marathon balanced, and Marathon base fixtures remain exact
- row counts, rest/non-rest counts, identities, source metadata, metric gates, summary/date fields,
  disabled/custom reasons, and rejection behavior remain unchanged
- no OpenAI, DB/SQL/schema, frontend route/component, confirm, persistence, or new preset family is
  added

Implementation notes:

- Added `src/lib/plan-presets/composition.ts` as the minimal shared composition owner.
- Shared composition vocabulary now includes:
  day primitives, week archetypes, common support identities, composition steps, identity
  extraction, and contract assertions for allowed/required identities and max specific touches per
  week.
- Half marathon and Marathon recipe expanders now express pattern placements through
  `PlanPresetCompositionStep[]` and `applyPlanPresetCompositionSteps(...)`.
- Recipe modules still own recipe-specific parameters:
  goal/style validation, duration via recipe metadata, allowed identities, required identity signals,
  selected pattern weeks, support gates, and runner-facing summary copy.
- Harness helper ownership now includes shared forbidden-identity and one-specific-touch/week
  assertions while recipe files keep their forbidden lists and density meaning.
- No recipe family, row-generation behavior, summary/date contract, metric gate, OpenAI, DB,
  frontend, confirm, or persistence path changed.

Closeout evidence:

- `composition.ts` is a small shared seam, not a broad training engine.
- Composition owns day primitives, week archetypes, support identities, composition steps, identity
  extraction, required/allowed assertions, and max specific-touch/week checks.
- Recipe modules still own recipe-specific truth:
  duration, level/support gates, selected pattern weeks, allowed/forbidden identities, required
  signals, and runner-facing summary copy.
- All row counts were preserved for the QA-passed 10K Foundation, Half marathon balanced, and
  Marathon base fixtures.
- Source metadata stayed stable:
  `sourceKind/source_kind = plan_preset_v1`, `sourceStatus = preset_recipe_expanded`, and
  `persisted: false`.
- Program summary/date behavior from Slice 2E was preserved.
- Metric gates were preserved:
  no fake pace, no fake personal HR, and no executable HR from age-estimated HR.
- Fixed-rest protection, long-run day placement, and recovery-first sequencing did not drift.
- Forbidden identities remained blocked.
- Boundary proof remained clean:
  no frontend route/component, DB/SQL/schema, OpenAI, confirm, persistence, or new preset family
  path was introduced.
- Blueprint custom boundary remained preserved.

## Frontend Slice 1

Owner: FRONTEND

Status: complete / QA-passed on 2026-06-07.

Goal:

Add preset-first no-plan onboarding UI that displays backend-shaped preset cards and an explicit
custom authoring escape hatch.

Scope:

- surface preset cards after runner setup in the no-active-plan state
- ask backend for eligible preset card candidates
- render distance/program cards from backend view metadata
- render backend-owned card states, summaries, disabled/custom reasons, duration, start/end dates,
  workout mix, metric honesty, and why-this-fits copy
- allow start-date changes only by requesting/recomputing backend-shaped data
- expose `Advanced custom program` as the secondary route for target date/time, unusual
  constraints, injury/pain/caution, uncommon goals, or detailed comments
- render review-before-create using non-mutating review draft data
- keep existing structured custom flow available
- keep frontend as interaction/rendering only

Out of scope:

- confirm/persistence/create-plan mutation
- frontend-owned workout templates
- frontend-computed eligibility, duration, estimated end date, workout mix, safety fit, or metric
  truth
- OpenAI calls from frontend
- DB/schema/backend behavior changes
- new preset families
- active-plan replacement or refresh behavior
- manual workout creation/edit/copy/paste/template behavior
- changing production blueprint default
- exposing envelope selector

Closeout evidence:

- Plan Preset cards render in the no-active-plan onboarding/setup flow.
- Backend-shaped states, reasons, dates, workout summaries, metric honesty, and fit fields render.
- `Advanced custom program` remains a secondary path.
- Selecting `10K Foundation` opens a read-only review scaffold.
- Review shows:
  `Review only`, date range, weekly rhythm, workout mix, metric policy, assumptions, row counts,
  and `plan_preset_v1 · persisted false`.
- No preset confirm, save, apply, or create-plan button exists.
- Mobile 375px layout has no horizontal overflow.
- Source proof showed the UI calls server actions and does not import recipe expanders or resolver
  modules directly.
- No frontend eligibility, date, metric-truth, or workout-mix truth was introduced.
- No OpenAI, DB/schema, persistence, confirm, manual workout, or active-plan replacement behavior
  was added.

Screenshot and artifact evidence:

- Built-in Browser screenshot capture timed out.
- Safari fallback stopped at a Passwords AutoFill / Touch ID prompt.
- QA used approved non-credential fallback artifacts because true screenshot capture remained
  blocked by tooling rather than product behavior.
- Artifact folder:
  `qa-artifacts/screenshots/2026-06-07/plan-preset-cards-review-scaffold-qa/`.
- Saved artifacts include DOM summary JSON, review text, mobile 375 summary, desktop/mobile HTML
  visual fallbacks, and capture error/fallback JSON.

Next decision:

- Do not proceed directly to mutation implementation.
- Next step is an ARCHITECT mutation-boundary decision for Plan Preset confirm/persistence.
- The decision must define what confirming a preset may persist, which canonical entities are
  created, whether existing structured plan confirmation/apply seams are reused, exactness mapping
  from non-mutating review draft to persisted `training-plan-v2`, idempotency, duplicate protection,
  no-active-plan lifecycle guards, audit/source metadata, rollback/error behavior, and out-of-scope
  boundaries.

## Plan Preset Confirm/Persistence Mutation Boundary

Status: architecture decision accepted on 2026-06-07.

Selected option:

- Choose Option B:
  add a small preset-specific server action that internally calls the same canonical persistence
  seam.
- Do not choose Option A because `confirmStructuredFirstPlanDraft` is intentionally tied to the
  structured first-plan / AI blueprint review contract. Expanding that action to understand Plan
  Presets would blur custom/AI source boundaries and make the structured setup confirm path carry
  unrelated preset-specific token/metadata rules.
- Do not choose Option C because the current schema already has the required canonical storage:
  `plan_cycles.source_kind`, `goal_metadata`, `plan_preferences`, rich `planned_workouts` fields,
  and the existing one-active-plan invariant. No schema blocker is visible for v1 confirm.

Canonical persistence owner:

- `src/lib/active-plan-persistence.ts` remains the persistence owner.
- Plan Preset confirm should call `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
- Plan Preset confirm may live in `src/lib/plan-preset-actions.ts` as a preset-specific action
  wrapper, but it must not become a second persistence system.
- The preset action owns auth, no-active-plan gating, reviewed-token validation, source-specific
  metadata assembly, and bounded result mapping.
- The lower-level persistence seam owns `runner_profile`, `plan_cycle`, and `planned_workouts`
  writes.

Allowed persisted entities:

- `runner_profiles`:
  stable profile/setup truth already accepted by the structured setup contract, such as age,
  weight, height, and future-plan training preferences.
- `plan_cycles`:
  one new active plan cycle with canonical `training-plan-v2` metadata.
- `planned_workouts`:
  exact reviewed canonical rows from the Plan Preset draft.

Not persisted by Plan Preset confirm:

- no `workout_logs`
- no admin/backlog rows
- no entitlement/usage rows
- no raw prompts or AI payloads
- no raw optional comments as profile truth
- no manual workout template/library data
- no replacement/refresh mutation for an existing active plan

Source metadata contract:

- `plan_cycles.source_kind` must be `plan_preset_v1`.
- Reviewed draft and persisted canonical plan must preserve:
  `sourceKind/source_kind = plan_preset_v1`,
  `sourceStatus = preset_recipe_expanded`,
  `presetId`,
  `presetVersion`,
  selected start date,
  estimated end date,
  duration weeks,
  days per week,
  long-run day,
  program family,
  workout mix summary,
  key workout types,
  metric policy/metric-mode summary,
  level-fit summary,
  safety assumptions,
  and reviewed row counts.
- Plan-scoped metadata should use bounded JSON only. Preferred location:
  `plan_cycles.goal_metadata` for high-level preset identity and summary, and
  `plan_cycles.plan_preferences` for structured authoring snapshot/review metadata.
- Extend `PlanAuthoringSnapshotSource` with a bounded `plan_preset` source if needed.
- Do not persist raw AI prompt, raw OpenAI payload, raw optional comments, secrets, or long freeform
  runner text.

Review exactness contract:

- Plan Preset review remains non-mutating.
- Before any confirm button can be enabled, the review action must return a signed reviewed-draft
  token or checksum covering the selected card, normalized setup input, recipe ID/version,
  canonical plan, source metadata, row counts, summary/date fields, and metric policy.
- Confirm must re-parse the submitted setup, rebuild the selected Plan Preset draft server-side,
  verify the reviewed token/checksum, and persist the rebuilt reviewed canonical plan exactly.
- Confirm must not accept frontend-provided calendar rows or frontend-computed summary/date/metric
  fields as authority.
- If the token is missing, stale, malformed, or does not match the rebuilt draft, confirm returns a
  bounded invalid-draft result and persists nothing.

Idempotency and duplicate-click policy:

- Frontend should disable the confirm button while a confirm request is pending, but backend remains
  authoritative.
- Confirm must re-check the no-active-plan guard before persistence.
- `createFirstPlanFromReviewedCanonicalPlanForUser(...)` must remain the final active-plan guard.
- The existing database one-active-plan invariant remains the final duplicate-create safety net.
- A second confirm click or concurrent confirm race must not create duplicate plans or duplicate
  workouts.
- Duplicate or raced confirms should return bounded `active_plan_exists` or `apply_blocked`
  behavior, not a raw database error.
- V1 does not require a long-lived idempotency table; if future UX needs replaying the original
  success payload, that should be a separate implementation decision.

Lifecycle guard:

- Plan Presets are available only when the runner has no active plan.
- This includes first-ever plan creation and later creation after delete/archive leaves no active
  plan.
- If an active plan exists, cards, review, and confirm must return bounded `active_plan_exists`
  copy that routes the runner to `Open plan` / refresh / replacement flows.
- Presets must never silently archive, replace, refresh, or edit an existing active plan.

Error and rollback policy:

- Confirm failures return bounded statuses such as:
  `invalid_draft`, `active_plan_exists`, or `apply_blocked`.
- Do not expose raw database errors, tokens, internal ids, secrets, or stack traces.
- Backend implementation must ensure a failed workout insert or post-plan-insert failure does not
  leave a partial active plan. Use or harden the canonical rollback seam, such as
  `rollbackInsertedPlan(...)`, inside the canonical persistence owner.
- If the existing canonical persistence seam cannot satisfy partial-plan rollback safely, BACKEND
  must stop and return to ARCHITECT instead of adding preset-local compensation logic.
- Existing profile upsert behavior should follow the same first-plan persistence seam; do not invent
  preset-only profile rollback semantics unless the canonical seam is changed for all reviewed
  first-plan creation.

DB/schema decision:

- No DB/schema migration is approved for v1 confirm.
- Existing schema is sufficient for source kind, bounded metadata, plan preferences, rich workout
  fields, and the one-active-plan guard.
- If implementation discovers a concrete missing field or transaction requirement, it must stop and
  return to ARCHITECT with evidence instead of adding an ad hoc migration.

Backend Slice 3 scope:

- Add `confirmPlanPresetDraft` server action.
- Add signed review token/checksum support to the Plan Preset review contract.
- Rebuild and verify the reviewed draft on confirm.
- Build bounded preset metadata.
- Persist through `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
- Return a bounded created result with source kind, preset ID/version, row/workout counts, start/end
  dates, and no-raw-payload safety metadata.
- Preserve `getPlanPresetCards` and `reviewPlanPresetDraft` behavior for non-mutating paths.
- Harden canonical rollback for partial plan/workout persistence if needed.

Frontend confirm-button gating rule:

- Keep the visible confirm/create button disabled or absent until Backend Slice 3 and its QA gate
  pass.
- After Backend Slice 3, frontend may enable confirm only when the review action returns
  `draft_ready` plus a valid signed review token/checksum and no active-plan conflict.
- The button must be pending-locked during confirm.
- Frontend must not construct the persistence payload from local card/review state beyond sending
  the selected card, setup input, and backend-issued reviewed token/checksum.

QA acceptance gate:

- Source audit proves no second persistence system and no frontend-owned plan truth.
- No mutation occurs during card loading or review generation.
- Confirm creates exactly one active `plan_cycle` and exact reviewed `planned_workouts`.
- Persisted rows match the reviewed canonical plan exactly by count and content/hash.
- `runner_profile` stable setup fields are updated through the canonical profile patch behavior.
- Source metadata and bounded plan-scoped metadata persist as expected.
- Duplicate confirm/double click creates no duplicate plan/workouts.
- Existing active plan blocks cards/review/confirm with bounded copy.
- Invalid, stale, or tampered reviewed token is not confirmable and persists nothing.
- Simulated or harnessed partial persistence failure does not leave a partial active plan.
- No OpenAI call, DB/schema migration, new preset family, active-plan replacement/refresh, or manual
  workout CRUD behavior is added.

Backend Slice 3 implementation closeout:

- `reviewPlanPresetDraft` now returns backend-issued `reviewToken` and `reviewChecksum` while
  keeping review non-mutating.
- `confirmPlanPresetDraft` accepts only selected preset context plus token/checksum, rebuilds the
  draft server-side, verifies exactness, re-checks active-plan state, and persists through
  `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
- Plan Preset persistence metadata is bounded and records `plan_preset_v1`,
  `preset_recipe_expanded`, preset ID/version, start/end dates, program summary, metric policy,
  reviewed row counts, identity summary, and safety assumptions.
- `createAssignedPlanFromImportedSeed(...)` now rolls back the inserted plan cycle if workout insert
  fails or if the inserted workout row count does not match the reviewed seed.
- Deterministic harness coverage was added for token/checksum exactness, stale setup/card mismatch,
  tampered review metadata, bounded persistence metadata, and exact canonical persisted row shaping.
- Frontend confirm UI, DB/schema changes, OpenAI calls, new preset families, active-plan
  replacement, and manual workout CRUD remained out of scope.

Backend Slice 3 QA closeout:

Status: complete / QA-passed on 2026-06-07.

QA evidence recorded:

- `reviewPlanPresetDraft` returns `reviewToken` and `reviewChecksum`.
- Confirm rebuilds the draft server-side.
- Valid token/checksum passes.
- Changed start date, changed setup, preset mismatch, tampered row, invalid token, and stale
  checksum fail boundedly.
- No client-sent rows are trusted.
- Active plan is checked before apply.
- Canonical persistence owner also checks active plan.
- The active-plan unique guard exists.
- Existing active plan maps to `active_plan_exists`.
- Duplicate preset-origin confirm maps to bounded duplicate behavior.
- Unsupported, invalid, and apply failures map to bounded errors.
- Metadata preserves:
  `plan_preset_v1`, `preset_recipe_expanded`, preset ID/version, dates, row counts, summaries,
  assumptions, and metric policy.
- Canonical persistence rolls back inserted `plan_cycle` on workout insert error or row-count
  mismatch.
- No DB/schema migration, frontend confirm UI, OpenAI behavior, new preset family,
  active-plan replacement/refresh, or manual workout CRUD was added.
- Custom blueprint path remains unaffected.
- Non-mutating preset review remains available.

Remote Supabase stable-token confirm smoke closeout:

Status: complete / QA-passed on 2026-06-07.

Remote QA evidence recorded:

- Remote project:
  `dltfjwexyctmihclcjqj`.
- QA run ID:
  `plan-preset-confirm-qa-20260607234024`.
- Disposable QA auth user:
  `fa09a80d-cd92-4273-b2a7-9941c08b2998`.
- Pre-confirm active plan count:
  `0`.
- `reviewPlanPresetDraft` returned both `reviewToken` and `reviewChecksum`.
- `confirmPlanPresetDraft` returned:
  `ok: true`,
  `status: created`,
  `sourceKind: plan_preset_v1`,
  `sourceStatus: preset_recipe_expanded`,
  and `persisted: true`.
- Confirm created one active `plan_cycles` row:
  `acdc67ca-6b14-4148-a063-ab2e8982d7d2`.
- Confirm created one `runner_profile`.
- Confirm created `84` `planned_workouts`.
- Persisted rows matched the reviewed draft by date, weekday, week, type, identity, and steps.
- Metadata preserved preset ID/version, dates, row counts, summaries, assumptions, metric policy,
  and QA markers.
- A second confirm returned `duplicate_confirm`.
- Active plan count stayed `1`.
- Planned workout count stayed `84`.
- Cleanup removed the QA plan, profile, and auth user.
- Final cleanup audit showed:
  no active plan,
  no planned workouts,
  no runner profile,
  no auth user,
  no remaining QA auth users,
  and `qaMarkedPlanCount: 0`.
- Regression checks passed.

Cleanup decision:

- The live/disposable Supabase mutation proof gap is closed.
- No separate backlog follow-up is needed for Plan Preset confirm persistence smoke.
- Production rollout and final archive remain blocked only until the final browser end-to-end
  acceptance gate passes and Architect makes the closeout/archive decision.

Next decision:

- Proceed to final QA browser validation of the full Plan Preset UI confirm flow using scoped remote
  QA records or safe disposable local/test records.
- This is required because backend remote mutation proof and prior frontend source/DOM QA do not by
  themselves prove the complete runner-facing no-active-plan setup -> card -> review -> create ->
  saved active plan readback flow.
- Do not close/archive this active plan before final browser acceptance unless Architect explicitly
  records why browser confirm is unnecessary.
- Do not create a separate backlog file in this closeout because the active plan still owns this
  final acceptance gate.

Out of scope:

- production rollout/default switch
- DB/schema changes
- new preset families
- target-date or target-time preset behavior
- manual workout creation/edit/copy/paste/recurrence
- active-plan replacement, refresh, or schedule editing
- OpenAI changes
- envelope promotion

## Slice Order

1. ARCHITECT: create this active plan and define canonical architecture.
2. ARCHITECT: update the plan to split deterministic preset cards from the advanced/custom OpenAI
   program path.
3. DESIGNER: complete. Interaction spec accepted for backend handoff on 2026-06-07.
4. BACKEND Slice 1: implement preset eligibility input contract, card view-model contract,
   eligibility/result codes, disabled/custom reasons, typed recipe registry skeleton, and
   non-mutating review draft contract shape.
5. ARCHITECT: correct lifecycle terminology from first-plan-only presets to reusable Plan Presets
   for any no-active-plan state.
6. BACKEND cleanup: rename the pre-QA backend seam from first-plan-only technical names to
   Plan Presets names and `source_kind: plan_preset_v1`.
7. QA Slice 1: complete. Validated naming/source-kind cleanup, backend card contract fixture
   matrix, no OpenAI calls, no mutation, no stale runtime first-plan-only names, backend-owned
   metric notes, custom routing reasons, and blueprint preservation.
8. BACKEND Slice 2A: complete. Implemented one-family non-mutating `10K Foundation` review draft
   expansion into canonical `training-plan-v2` rows.
9. QA Slice 2A: complete. Validated `10K Foundation` draft expansion exactness, sourceKind/source
   metadata, no mutation, deterministic row counts, fixed-rest protection, blueprint preservation,
   and no frontend/DB/confirm/OpenAI path.
10. BACKEND Slice 2B: complete. Implemented one-family non-mutating `Half marathon balanced`
    review draft expansion into canonical `training-plan-v2` rows.
11. QA Slice 2B: complete. Validated half draft expansion exactness, pattern density, no mutation,
    source metadata, metric-truth preservation, rest-day protection, recovery-first sequencing,
    no OpenAI calls, and blueprint preservation.
12. BACKEND Slice 2C: complete. Implemented one-family non-mutating `Marathon base` review draft
    expansion into canonical `training-plan-v2` rows.
13. QA Slice 2C: complete. Validated marathon draft expansion, long-run tolerance, durability
    patterning, no race-prep overreach, no mutation, source metadata, metric-truth preservation,
    rest-day protection, recovery-first sequencing, no OpenAI calls, and blueprint preservation.
14. BACKEND cleanup Slice 2D: complete. Extracted per-recipe expansion/policy ownership and
    per-recipe harness assertions with no behavior change.
15. QA Slice 2D: complete. Validated all 10K, Half marathon, and Marathon fixtures remained
    unchanged after extraction.
16. BACKEND Slice 2E: complete. Added backend-owned card/review program summary fields for
    duration, selected start date, estimated end date, workout mix, metric honesty, and level-fit
    copy.
17. QA Slice 2E: complete. Validated summary fields, start/end date recomputation, duration
    defaults, disabled reasons, no local frontend calculation, and no mutation/OpenAI/DB/confirm
    path.
18. BACKEND Slice 2F: complete. Extracted a minimal Plan Preset composition contract with no
    behavior change, preserving exact 10K, Half marathon, and Marathon outputs as acceptance fixtures.
19. QA Slice 2F: complete. Validated composition extraction preserved row counts, identities,
    metric gates, source metadata, summaries, and no-mutation/no-OpenAI/no-DB/no-frontend
    boundaries.
20. FRONTEND Slice 1: complete. Implemented preset card/review scaffolding from backend-shaped
    card view models and non-mutating review draft contracts.
21. QA Frontend Slice 1: complete. Validated source/CLI/build/browser DOM/responsive behavior and
    accepted non-credential fallback artifacts after screenshot capture tooling remained blocked.
22. ARCHITECT: complete. Selected Option B for Plan Preset confirm/persistence:
    a small preset-specific server action that internally calls the canonical reviewed-plan
    persistence seam.
23. BACKEND Slice 3: complete. Implemented Plan Preset confirm/persistence exactness through
    `confirmPlanPresetDraft`, backend-issued review token/checksum verification, bounded preset
    metadata, canonical `createFirstPlanFromReviewedCanonicalPlanForUser(...)` persistence,
    no-active-plan guard, duplicate-confirm handling, and canonical rollback hardening for failed
    workout insert or row-count mismatch.
24. QA Slice 3: complete. Source/harness validation passed. The first remote Supabase smoke found
    the signed payload included volatile `canonicalPlan.created_at`; backend stable-token fix was
    implemented and then remote/disposable confirm re-smoke passed.
25. QA Stable Token Re-smoke: complete. Scoped remote QA records proved freshly issued
    `reviewToken`/`reviewChecksum` confirm after server-side rebuild, exact persistence creates one
    active plan plus `84` planned workouts, duplicate confirm is bounded, and cleanup removes all QA
    rows/users.
26. FRONTEND Slice 2: implemented in current source. The reviewed Plan Preset confirm/create UI calls
    `confirmPlanPresetDraft(...)`, passing only card/setup plus backend-issued token/checksum and
    preserving duplicate-click/error boundaries.
27. Final QA Browser Acceptance: complete. Validated the full no-active-plan setup -> preset cards
    -> review -> `Create preset plan` -> saved active plan browser flow with scoped QA records,
    exact DB readback, mobile no-overflow proof, Advanced custom separation, and cleanup.
28. ARCHITECT closeout: complete. The v1 Plan Preset vertical slice is accepted and this plan is
    archived. Future preset families, active-plan replacement/refresh, manual workout authoring,
    screenshot tooling reliability, and route polish remain backlog/future work.

## QA Strategy

Required fixture matrix:

- beginner consistency / run-walk adaptation
- 5K foundation with unknown benchmark
- 10K foundation with watch/app support and no pace truth
- half marathon balanced with supported cadence but no fake race pace
- marathon base with fixed rest days, preferred long-run day, cutbacks, taper, and recovery-first
  after long runs
- trail/mountain durability if approved for v1
- custom escape hatch path still routes to blueprint default
- preset-card happy path performs no OpenAI call
- advanced/custom path may call `ai_first_plan_blueprint_v1`
- unsafe/unsupported preset setup returns correction or unavailable metadata
- preset card summaries show backend-owned duration, start/end dates, workout mix, metric honesty,
  level fit, and disabled/custom reasons
- composition extraction preserves 10K, Half marathon, and Marathon as exact acceptance fixtures
  while moving shared day/week/phase/program rules out of ad hoc per-recipe procedural logic

Required invariants:

- no mutation before confirm
- confirm persists exact reviewed rows
- `source_kind = plan_preset_v1` for preset path
- `source_kind = ai_first_plan_blueprint_v1` remains custom/default AI path
- internal envelope remains non-default
- no raw prompt/full payload/secret persistence
- no fake pace from target time alone
- no executable HR target without personal HR-zone truth
- structure-only executable rows include numeric duration/distance/repeat/recovery anatomy
- fixed rest days and preferred long-run day preserved
- post-long-run recovery-first sequencing preserved
- no `structured_authoring_v1` successful first-plan fallback leak
- export/import roundtrip preserves preset-generated rich fields

## Backend Slice 2A Implementation Notes

Status: implemented and QA-passed on 2026-06-07 after the `sourceKind` contract fix.

- Added `src/lib/plan-presets/expand.ts` as the focused owner for Plan Preset recipe-to-draft
  expansion.
- Implemented only `plan_preset_10k_foundation_v1`.
- Reused `buildStructuredFirstPlanAuthoringInput(...)` for setup truth and
  `buildStructuredAuthoringPlan(...)` for canonical `training-plan-v2` row generation.
- Retagged the resulting draft source metadata to `source_kind: plan_preset_v1` and wrapped it with
  top-level `sourceKind: plan_preset_v1`, recipe ID/version,
  `sourceStatus: preset_recipe_expanded`, `persisted: false`, metric-truth summary, row counts, and
  bounded review metadata.
- Preserved fixed rest days, preferred long-run day, watch/app support, benchmark truth, metric
  gates, rich workout identities, canonical segments, and executable target modes through existing
  structured authoring helpers.
- Added 10K Foundation doctrine guards:
  relaxed/balanced only, 3-5 days/week, no target date/time, no material comments, no race-pace or
  taper identities, no fake pace, no executable HR without personal HR-zone truth.
- No OpenAI call, DB schema, persistence, confirm path, frontend route, or static frontend template
  was added.
- Future preset families remain deferred until cleanup and product need justify another family.

## Risks

- frontend cards could become accidental plan truth unless backend owns all recipes
- OpenAI could accidentally remain in the preset-card happy path unless backend exposes a separate
  deterministic preset service seam
- using `buildStructuredAuthoringPlan(...)` without source wrapping could reintroduce confusing
  `structured_authoring_v1` first-plan success metadata
- static templates could drift from metric-truth gates and recovery policy
- too many preset families in v1 could weaken QA coverage
- trail/mountain or marathon presets can become unsafe if support gates are too broad
- custom authoring can become a hidden fallback if copy/control flow is vague

## Exit Criteria

- Running Coach approves v1 preset family doctrine or explicitly defers unsafe families.
- Backend owns preset recipe truth and exposes non-mutating preset candidate/draft seams.
- Preset drafts generate canonical `training-plan-v2` rows with explicit preset source metadata.
- Review/confirm boundary is preserved and exact persistence is proven.
- Preset path reduces OpenAI usage for common no-target-date cases by avoiding OpenAI entirely.
- Custom authoring remains explicit and uses the existing blueprint default.
- Manual workout editing remains separate and does not block preset-first release.

## What Not To Touch

- Do not implement code in the ARCHITECT pass.
- Do not delete or weaken blueprint or envelope paths.
- Do not promote envelope to production default.
- Do not persist preset rows before review/confirm.
- Do not store duplicate plan truth outside canonical `training-plan-v2`.
- Do not make frontend cards own schedule or workout truth.
- Do not use target time alone as pace truth.
- Do not create fake personal HR targets.
- Do not require manual workout editor before preset-first v1 can ship.
- Do not hide custom authoring behind fallback magic.
- Do not make target-time/date presets part of v1 unless separately approved.

## Suggested Next Step

Do not reopen this implementation plan for optional follow-ups.

Use the backlog for the next decision:

- additional preset families
- active-plan replacement/refresh from a preset
- manual workout creation/edit/copy/paste/recurrence
- QA screenshot artifact reliability if repeated PNG capture failures continue to slow closeout

The separate stack simplification strike may begin after this archive if the team wants to reduce
tooling/framework/code-path complexity before expanding Plan Presets further.

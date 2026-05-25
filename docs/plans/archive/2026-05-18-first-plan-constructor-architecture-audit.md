Archive Note

Archived during the 2026-05-25 active-plan inventory cleanup.

Classification: Complete / archive now.

Reason: The useful decomposition/server-boundary slices from this audit landed, and the broader architecture cleanup track has already been closed. Remaining ideas are backlog, not active execution.

Future agents should not continue this artifact by default. If the product need returns, create a fresh active plan from current `docs/current-*` truth.

---

Status

Architect audit complete, decomposition plan active; simplification/server-boundary cleanup slice implemented

Owner

Architect / Backend / Frontend / QA

Last Updated

2026-05-18

Context

The structured first-plan constructor is already functionally live and QA-green.

This audit does not reopen the product decision and does not treat the feature as broken.

The goal of this pass is narrower:

- inspect the current implementation shape of first-plan creation
- identify oversized files and mixed-responsibility seams
- identify duplicated plan-authoring rules and helper logic
- identify which parts may safely become parallel and which must stay sequential
- define the smallest implementation-ready simplification path before more feature work lands

Scope

This audit covers the current first-plan creation surface and its directly connected authoring seams:

- `src/components/OnboardingGate.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/onboarding/DictateToPlanPanel.tsx`
- `src/components/onboarding/JsonImportPanel.tsx`
- `src/components/onboarding/onboarding-form-model.ts`
- `src/lib/structured-first-plan-onboarding.ts`
- `src/lib/structured-plan-authoring.ts`
- `src/lib/voice-to-plan-authoring.ts`
- relevant first-plan and authoring seams inside `src/lib/training-api.ts`

This audit also notes where saved-mode `Open plan` still reuses shared authoring seams and therefore affects cleanup choices.

Current Feature Topology

Current visible first-plan creation product paths:

- structured first-plan constructor in onboarding
- dictated transcript review path in onboarding
- Advanced JSON import in onboarding

Current major backend authoring/apply paths:

- `completeStructuredFirstPlanOnboarding`
- `generateVoiceToPlanDraft`
- `confirmVoiceToPlanDraft`
- `completeOnboarding` for JSON import/apply

Current supporting domain layers:

- `structured-first-plan-onboarding.ts`
  - request contract
  - structured-to-authoring translation
  - onboarding result context
  - helper math and formatting
- `structured-plan-authoring.ts`
  - canonical structured authoring plan generation
  - workout builders
  - benchmark pace target derivation
- `voice-to-plan-authoring.ts`
  - request schemas
  - sufficiency checks
  - transcript inference
  - prompt construction
  - repair logic
  - review summary shaping
  - confirm parsing
- `training-api.ts`
  - server actions
  - auth entrypoints
  - plan apply orchestration
  - export
  - refresh
  - settings
  - workout log persistence
  - Garmin entrypoints

What Is Already Healthy

- The UI side is already partly decomposed.
  - `OnboardingGate.tsx` is now mostly an orchestrator instead of one giant rendering file.
  - constructor, dictation, and JSON import each have their own component.
- The visible product split is coherent.
  - structured constructor is the normal path
  - dictation is additive
  - Advanced JSON is demoted
- The canonical pipeline is still intact.
  - structured input or reviewed transcript -> canonical structured authoring input -> canonical plan -> apply
- Fixed rest-day invariant behavior is already integrated into first-plan creation.
- The entitlement model is already separated into dedicated modules instead of being buried inline.

Big File Inventory

Current hotspot file sizes:

- `src/lib/training-api.ts` — 2602 lines
- `src/lib/voice-to-plan-authoring.ts` — 1548 lines
- `src/lib/structured-plan-authoring.ts` — 1167 lines
- `src/lib/structured-first-plan-onboarding.ts` — 659 lines
- `src/components/OnboardingGate.tsx` — 485 lines
- `src/components/onboarding/StructuredPlanConstructor.tsx` — 472 lines
- `src/components/onboarding/onboarding-form-model.ts` — 443 lines
- `src/components/onboarding/DictateToPlanPanel.tsx` — 388 lines

This means the constructor surface is no longer primarily a rendering problem.

The main architecture debt is in backend/domain files, not in the visible onboarding shell.

Primary Findings

1. `training-api.ts` is still a cross-product kitchen-sink module.

It currently mixes:

- route data loading
- auth/session mutations
- first-plan onboarding
- saved-mode text authoring
- JSON plan apply
- export
- AI plan refresh
- workout log persistence
- settings persistence
- Garmin import entrypoints

This is now the biggest structural drag on first-plan work because onboarding mutations are implemented in the same file as unrelated product capabilities.

2. The first-plan domain is split across multiple backend files, but the split is not yet canonical.

The first-plan flow currently spans:

- request validation in `structured-first-plan-onboarding.ts`
- plan generation in `structured-plan-authoring.ts`
- persistence/apply in `training-api.ts`
- transcript-specific authoring logic in `voice-to-plan-authoring.ts`

This is workable, but ownership is uneven:

- contract logic is partly separated
- apply logic is centralized too broadly
- voice-specific rules duplicate some constructor-domain rules instead of reusing shared helpers

3. Duplicated domain helpers already exist and should be collapsed.

Confirmed duplicate or near-duplicate logic exists for:

- weekday normalization
- evenly spreading training days
- choosing a long-run day
- goal-distance formatting
- goal-style formatting
- duration parsing
- pace parsing
- goal-distance / goal-style / terrain enums

The same family of rules appears in both:

- `structured-first-plan-onboarding.ts`
- `voice-to-plan-authoring.ts`

There is also JSON validation UI duplication between:

- `OnboardingGate.tsx`
- `PlanManagementDialog.tsx`

4. The saved-mode and onboarding authoring stories are still intertwined.

Visible onboarding is structured-first, but saved-mode `Open plan` still uses:

- `completeTextOnboarding`

This is not automatically wrong.

But it means authoring cleanup must not assume that removing or heavily reshaping text authoring is only an onboarding concern.

5. Safe parallelism opportunities are smaller than the file-size problem.

The user goal mentions making some processes less sequential.

In this feature, the largest issue is not that too many steps are sequential.

The larger issue is that too many responsibilities are co-located.

The canonical write path must remain sequential:

- validate input
- build canonical authoring input
- generate canonical plan
- apply with continuity/history safeguards
- persist final result

Blindly parallelizing this path would increase risk, not improve architecture.

6. There is one write-path atomicity concern worth preserving, not relaxing.

`applyImportedPlanForUser` currently does:

- prepare apply context
- `upsertRunnerProfile(...)`
- `replaceActivePlanWithImportedInput(...)`

These are not independent product writes.

They should not be parallelized.

If anything, this seam should become more explicit and safer, not more concurrent.

7. Some small response-shaping duplication is still present.

Examples:

- repeated success/failure result decoration in onboarding/text apply mutations
- repeated `buildStructuredFirstPlanResultContext(input)` calls in both result branches
- local helper duplication such as open-home redirect helpers and JSON validation factories

This is not the highest-risk problem, but it is easy cleanup once larger ownership boundaries are fixed.

What Should Stay Sequential

These must stay ordered in v1:

- transcript review before draft creation
- draft review before confirm/apply
- structured input validation before plan generation
- plan generation before apply
- apply safety checks before archive/replace writes
- stale proposal validation before AI refresh apply

These are correctness boundaries, not performance bugs.

What Can Safely Become Parallel

Only independent read-side or pure-derivation work should be parallelized.

Safe or potentially safe future candidates:

- independent read-only data fetches when a future first-plan context needs multiple unrelated sources
- isolated export/read summary building
- independent non-mutating view-model shaping after core domain truth is already known

Not recommended as a priority:

- micro-parallelizing pure helper functions
- parallelizing canonical plan generation with any persistence step
- parallelizing profile writes with plan replacement writes

Conclusion:

For this feature, simplification and decomposition should come before any explicit concurrency work.

Duplicate Truth To Collapse

The following should become shared domain helpers instead of reappearing in multiple authoring files:

- weekday utility functions
  - `uniqueWeekdays`
  - long-run day selection
  - even day spreading
- goal display formatting
  - goal distance labels
  - goal style labels
- bounded input parsing
  - duration parsing
  - pace parsing
- shared authoring enums/constants where practical
  - goal distance
  - goal style
  - terrain focus

These should not become a huge new framework.

They should become one small shared first-plan authoring utility module family.

What Should Stay Local

These concerns should remain feature-local:

- transcript filler detection
- voice clarification copy
- voice review summary shaping
- constructor sticky footer behavior
- JSON import panel wording and affordances

These are not cross-domain primitives.

They are local product behaviors.

Recommended Canonical Decomposition

P0. Split first-plan server actions away from the general `training-api.ts` hub.

Goal:

- reduce onboarding/authoring churn inside the largest mixed-responsibility file

Likely target modules:

- `src/lib/first-plan-api.ts`
  - `completeStructuredFirstPlanOnboarding`
  - `generateVoiceToPlanDraft`
  - `confirmVoiceToPlanDraft`
  - maybe `completeOnboarding` for onboarding Advanced JSON only if ownership stays clear
- keep `training-api.ts` re-export layer temporarily if route wiring compatibility is needed

Reason:

- this is the highest-leverage structural cleanup with low product risk
- it improves ownership immediately without changing the visible feature

P1. Extract shared first-plan authoring helpers.

Goal:

- collapse duplicated constructor/voice domain rules without inventing a large framework

Likely extracted helpers:

- weekday selection helpers
- goal label helpers
- duration/pace parsing helpers
- maybe small shared authoring constants

Reason:

- both structured onboarding and voice-to-plan already need the same planning vocabulary
- duplication is now concrete enough to justify extraction

P2. Split `voice-to-plan-authoring.ts` by responsibility.

Goal:

- make voice path maintainable without rewriting the product contract

Recommended bounded split:

- `voice-to-plan-contract.ts`
- `voice-to-plan-sufficiency.ts`
- `voice-to-plan-inference.ts`
- `voice-to-plan-review.ts`
- `voice-to-plan-confirm.ts`

Reason:

- this file already carries at least five distinct responsibilities
- future audio transport work will make it grow further unless split now

P3. Split `structured-first-plan-onboarding.ts` into contract and translation.

Goal:

- separate request validation from authoring translation

Recommended bounded split:

- `structured-first-plan-contract.ts`
- `structured-first-plan-to-authoring.ts`
- keep result-context shaping with the onboarding feature if still useful there

Reason:

- this file currently owns both input contract and multiple downstream derivations
- the split is straightforward and low-risk

P4. Split `structured-plan-authoring.ts` only after the earlier slices land.

Goal:

- reduce the very large plan builder without destabilizing generation truth

Recommended split:

- normalization
- workout builders
- benchmark pace targets
- shared formatting/math

Reason:

- this is valuable, but it touches the deepest canonical generation truth
- it should happen after contract/ownership cleanup, not before

What We Should Delete Or Isolate

- Legacy-compatible seams that are no longer the primary onboarding path should be isolated from visible onboarding work.
- `completeTextOnboarding` should remain because saved-mode still uses it, but it should stop shaping onboarding architecture decisions.
- temporary compatibility re-exports are acceptable only if they have a removal plan.

Small Simplifications Worth Taking Early

- extract duplicated JSON draft validation from UI surfaces into one small reusable helper
- extract repeated result decoration helpers for onboarding/text mutations
- compute `generationContext` once per structured onboarding request
- keep `OnboardingGate.tsx` as an orchestrator and avoid moving domain logic back into it

Recommended Implementation Order

1. Backend slice: extract first-plan server actions from `training-api.ts`
2. Backend slice: extract shared first-plan helper module for weekdays/goals/parsing
3. Backend slice: split `voice-to-plan-authoring.ts`
4. Backend slice: split `structured-first-plan-onboarding.ts`
5. Frontend slice: share JSON import validation helper between onboarding and `Open plan`
6. QA regression on:
   - structured constructor
   - voice review/confirm
   - Advanced JSON import
   - saved-mode text creation

Checklist

- [x] Audit current first-plan constructor architecture
- [x] Identify oversized files and ownership drift
- [x] Identify duplicate domain helpers
- [x] Distinguish safe parallelism from required sequential truth
- [x] Define a bounded decomposition order
- [x] Extract first-plan server actions from `training-api.ts`
- [x] Remove first-plan backward dependency on `training-api.ts` by extracting shared active-plan persistence/apply ownership
- [x] Extract shared first-plan authoring helpers
- [x] Remove dead first-plan compatibility seams from `training-api.ts`
- [x] Split Garmin feedback readback away from Node-only FIT/ZIP ingest imports
- [ ] Split `voice-to-plan-authoring.ts` into bounded modules
- [ ] Split `structured-first-plan-onboarding.ts` into contract vs translation
- [ ] Optionally share JSON import validation helper between onboarding and saved-mode import
- [ ] Run focused regression across structured, voice, JSON, and saved-mode authoring flows

Exit Criteria

- first-plan creation no longer depends on a mixed-responsibility `training-api.ts` section or imports back into `training-api.ts`
- duplicated weekday/goal/parsing helpers are collapsed into one small shared domain utility layer
- `voice-to-plan-authoring.ts` no longer mixes contract, inference, review, and confirm logic in one file
- structured onboarding contract and translation responsibilities are separated
- no user-visible regression appears in:
  - structured onboarding
  - dictated plan review/confirm
  - onboarding Advanced JSON import
  - saved-mode text authoring

Recommended Next Role

BACKEND

Suggested Next Step

Take the next bounded decomposition slice only:

- split `voice-to-plan-authoring.ts` into bounded contract, sufficiency, inference, review, and confirm modules
- do not change visible product behavior
- do not parallelize the write path
- keep temporary compatibility re-exports only if needed for route wiring

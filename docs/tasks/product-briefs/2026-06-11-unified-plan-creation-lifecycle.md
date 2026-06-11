# Unified Plan Creation Lifecycle

Status: Product direction / not implemented as a unified flow yet

Date: 2026-06-11

Owner: PRODUCT

## Problem

Hito currently has several plan creation paths that are becoming strong separately:

- structured / AI-assisted first-plan creation
- deterministic selected-distance plans
- manual user-built plans
- Plan Presets
- advanced import / JSON paths

The product risk is that these become separate mental models. Runners should not have to choose
forever between "AI plan" and "manual plan." They are different authorship modes for the same
planning surface.

## Product Principle

Hito has one core object from the runner's perspective:

`active plan calendar`

Different sources can add reviewed plan truth into that calendar:

- the runner manually authors a workout
- the runner inserts a saved personal template
- the runner copies or pastes a workout day
- Hito generates a full first plan from structured/AI input
- Hito generates a selected-distance block
- Hito generates a continuation block after the runner has already authored some days
- a future coach or organization assigns a reviewed block

Source differs. The calendar lifecycle should not.

## Unified Flow

Canonical flow:

`choose creation mode -> draft/review -> confirm -> active plan calendar -> add/move/edit/export`

Creation modes:

1. `Let Hito build my plan`
   - Hito/AI authors a full reviewed draft from user inputs.
   - Backend validates, normalizes, signs, and persists only after confirm.
2. `Choose a distance plan`
   - Deterministic selected-distance engine authors the draft.
   - Backend owns horizon, endpoint truth, metric truth, and confirm/persist.
3. `Build my plan myself`
   - Runner starts from an empty calendar and authors workouts manually.
   - Backend reviews and persists each risky mutation.
4. Future `Continue with Hito`
   - Runner may manually author the first days or weeks, then ask Hito to generate the next block.
   - Hito proposes a reviewed continuation block inside the same active plan, not a replacement.
5. Future `Coach / organization plan`
   - A coach or organization can author or assign reviewed blocks for another runner.

## Manual Plus AI Continuation

Target scenario:

1. Runner chooses `Build my plan myself`.
2. Runner manually creates the first one or two weeks.
3. Runner clicks a future action such as `Continue with Hito`, `Generate next block`, or
   `Add plan block`.
4. Hito reads the existing active plan calendar and protected-day truth.
5. Hito proposes future workouts after the already-authored range.
6. Backend returns a reviewed block proposal.
7. Runner confirms.
8. Backend inserts only the reviewed future block.

Rules:

- Existing manual days are preserved.
- Logged, provider-evidence, comparison-backed, and protected days are not overwritten.
- Occupied future days require explicit conflict handling.
- AI does not directly append rows without backend review and confirm.
- The runner can continue manually editing or adding future days after the AI block exists.

## Source Ownership

Backend owns:

- validation
- normalization
- review tokens/checksums
- active-plan mutation boundaries
- conflict/protected-day checks
- source metadata
- export truth
- plan/block persistence

Frontend owns:

- choosing the creation mode
- rendering the same calendar surface
- showing backend-shaped review/confirm states
- collecting form input
- never inventing schedule, metric, persistence, or eligibility truth

AI owns:

- draft authorship only when explicitly invoked
- coaching intent under backend constraints
- no direct persistence
- no raw truth that bypasses validation

## Current Implementation Mapping

Already implemented or in progress:

- Structured/AI first-plan review and confirm path exists as a backend-owned review-before-create
  flow.
- Manual first-create path exists for creating a `manual_user_built_plan_v1` active plan from one
  reviewed workout.
- Manual Add path exists at the backend and frontend level: saved manual calendars can add one
  reviewed workout to an eligible future empty day, and browser/DB QA has proved the date-only
  confirmation/readback path.
- Personal saved-template backend contract is QA-passed: backend can save reviewed manual workouts
  as user-owned templates with name/icon, read them back with RLS/current-user ownership, and
  reconstruct future manual drafts through the existing review path. Frontend `Save as template`
  and picker wiring are not implemented yet.
- Active-plan export exists for current active plans, but manual-plan MVP export/share needs a
  dedicated product/QA pass before it is treated as complete.
- Deterministic selected-distance plans exist for current exposed families, and Marathon Completion
  preview exists as a separate family, but Marathon Completion is not ready for user-facing exposure
  until selected-plan confirm/persist is extended and QA-passed for that family.

Not implemented yet:

- AI continuation block inside an existing manual active plan.
- Frontend save-as-template modal and personal template picker integration.
- Copy/paste persistence.
- Move-workout mutation as a manual-builder action.
- Coach/organization-authored plans.
- Unified plan creation hub UI taxonomy.

## Product Copy Direction

Runner-facing mode labels should feel like choices in one product, not separate products:

- `Let Hito build my plan`
- `Build my plan myself`
- `Choose a distance plan`
- `Continue with Hito`
- `Add a plan block`
- `Save as template`
- `Export plan`

Avoid:

- "AI mode" versus "manual mode" as permanent runner identity.
- Copy that implies Hito will overwrite existing manually created days.
- Copy that implies a plan is saved before confirm.
- Copy that exposes source kinds such as `manual_user_built_plan_v1` or `ai_first_plan_blueprint_v1`.

## Sequencing Decision

Do not start a broad unified-flow implementation yet. Unify the product by strengthening one
canonical lifecycle, not by merging all plan code paths at once:

`authorship mode -> backend review -> explicit confirm -> active plan calendar mutation -> export/readback`

Immediate priority is ordered by source-of-truth safety, not by UI excitement:

1. Run the shared workout target display grammar cleanup before adding more visible manual-builder
   surfaces, so new template/picker UI does not multiply raw duration or internal target-label
   leaks.
2. Wire frontend `Save as template` and personal saved templates in the `Add activity` picker only
   after backend template truth and display grammar are safe.
3. Continue manual-builder MVP slices:
   - copy/paste through reviewed draft reconstruction
   - JSON export/share through canonical active-plan export truth
4. Keep Marathon Completion confirm/persist as a backend-selected-distance track, but do not expose
   it in UI until confirm/persist QA passes.
5. Route `Continue with Hito` only after manual mutation primitives are stable: saved templates,
   copy/paste, export/readback, and protected-day behavior should be clear before AI can propose
   continuation blocks.

## What Must Not Be Claimed Yet

- Do not claim the unified lifecycle is shipped.
- Do not claim AI continuation is implemented.
- Do not claim manual plans can already be shared as JSON until QA proves the manual export path.
- Do not merge manual builder and AI authoring into one backend shortcut.
- Do not let AI overwrite manual/protected calendar truth.
- Do not add frontend-owned plan blocks, templates, eligibility, or metric truth.

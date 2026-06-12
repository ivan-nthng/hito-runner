# Unified Plan Creation Lifecycle

Status: Product direction / backend universal editability foundation implemented; frontend wiring and browser QA pending

Date: 2026-06-11

Last Updated: 2026-06-12

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

Current user-visible gap:

- manual user-built plans have QA-passed Add activity, personal saved templates, Copy/Paste,
  Delete/Clear, Move Workout, and JSON/Markdown export
- AI/generated, selected-distance, preset, and imported active plans can show workouts in the
  calendar but do not expose the same basic future-workout controls
- this was a valid safety guardrail while the manual builder was being proven, but it is not the
  final product model

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

Once a plan is saved as the runner's active plan, future planned workouts should be editable through
one backend-owned active-plan lifecycle regardless of whether the original plan came from AI,
selected-distance generation, Plan Preset, JSON import, manual authoring, refresh, or a future coach
source.

Source affects metadata, auditability, protected rules, export/readback, and future AI refresh
behavior. Source should not permanently decide whether the runner can add, clear, or move future
workouts.

## Universal Editable Active-Plan Contract

Decision:

- Missing Add/Delete/Move controls on AI/generated active plans are an incomplete MVP, not the final
  intended product behavior.
- Do not fix this with route-local frontend buttons.
- Generalize the backend-owned manual editing primitives into one canonical active-plan editing
  lifecycle instead of creating separate manual-vs-AI-vs-imported UI systems.

Target v1 editable plan sources:

- `manual_user_built_plan_v1`
- structured / AI first-plan active plans such as `structured_authoring_v1`,
  `ai_first_plan_blueprint_v1`, and `ai_first_plan_envelope_v1`
- selected running-plan engine active plans such as `running_plan_engine_10k_builder_v1`,
  `running_plan_engine_half_marathon_builder_v1`, `running_plan_engine_marathon_base_builder_v1`,
  and later `running_plan_engine_marathon_completion_builder_v1` after its confirm/persist gate
  passes
- Plan Preset active plans that still exist in user data
- `training_plan_v2_import` and other accepted imported active plans
- `active_plan_refresh_v1` plans created by explicit refresh/apply

Backend may still return `not_editable` for a specific plan, date, or workout when source metadata
is unreadable, legacy rows cannot be safely reconstructed, or protection rules block the mutation.
That should be a backend-shaped reason, not a frontend source-kind guess.

### Universal Operations

| Operation | Target contract | v1 decision |
| --- | --- | --- |
| Add workout to empty future day | Runner authors or picks a reviewed workout/template, backend reviews, then inserts one row into the current active plan. | Universal target. Reuse manual authoring review for the new workout, but persist it as a user override inside the original active plan source. |
| Delete/Clear future planned workout | Backend reviews the target persisted row, proves it is editable, then removes exactly that row and updates metadata. | Universal target. Preserve last-workout protection only if Product still wants to prevent empty active plans; otherwise require a separate empty-plan decision. |
| Move workout to empty future day | Backend reviews source and target date-only truth, then updates the same planned workout row date/weekday/week metadata. | Universal target. Never implement as copy+delete or drag-only local state. |
| Copy/Paste | Backend reconstructs a reviewed draft from a persisted source workout, then inserts reviewed copy to an eligible target day. | Universal after Add/Delete/Move. It is appropriate when source workout can be safely reconstructed into canonical workout authoring truth. |
| Edit workout content | Runner changes workout structure/duration/segments/targets through a reviewed constructor. | Future-only. Needs a dedicated editor contract so frontend does not mutate rows/segments locally. |
| Recurrence/batch expansion | Runner repeats a workout pattern across multiple dates. | Future-only. Requires batch conflict/protection review and must not be bundled into universal v1. |

### Protected States

Universal editing must protect:

- past days
- today, unless Product explicitly accepts same-day editing for unlogged future execution
- logged workouts
- provider-evidence-backed workouts
- comparison-backed workouts
- AI-insight/recommendation-backed workouts when the recommendation depends on the old planned row
- occupied target dates unless the operation is a future explicit replace/swap flow
- protected plan lifecycle states, archived plans, inactive plans, and foreign-user rows
- rows whose source/metadata cannot be reconstructed or audited safely

The backend should return bounded reason codes such as:

- `no_active_plan`
- `not_future_date`
- `protected_day`
- `logged_workout`
- `evidence_backed_workout`
- `occupied_day`
- `unsupported_source_metadata`
- `source_workout_not_found`
- `source_workout_not_in_active_plan`
- `stale_review`
- `invalid_review`
- `persistence_failed`

### Metadata And Audit Rules

- The original plan `source_kind` remains visible and preserved on the active plan.
- User edits should not rewrite the plan into `manual_user_built_plan_v1`.
- Edited/added/moved/copied/deleted workout rows or plan metadata should carry explicit user-edit
  metadata such as:
  - mutation kind: `user_added_workout`, `user_cleared_workout`, `user_moved_workout`,
    `user_copied_workout`, later `user_edited_workout`
  - mutation source: `active_plan_user_edit_v1`
  - original plan source kind/status
  - previous workout date when relevant
  - target date when relevant
  - review checksum/version
  - whether the workout came from manual authoring, saved template, copied persisted workout, or
    future editor
- Export should preserve mixed-source truth:
  original plan source, user override metadata, and current canonical rows.
- AI refresh/update must treat user-edited future rows as explicit runner-owned truth unless the
  runner confirms replacing or regenerating them.
- AI must not silently re-own, delete, move, or rewrite user edits.

### Backend Source-Of-Truth Decision

Use one canonical active-plan editing lifecycle, not source-specific mutation families.

Recommended implementation shape:

- create a focused active-plan editing owner such as `src/lib/active-plan-workout-editing/*`
- reuse the accepted manual authoring seams where they are truly generic:
  review token/checksum exactness, date-only validation, protected-history/evidence checks,
  persisted workout reconstruction, manual workout draft review, and canonical persistence/update
  helpers
- extract the current manual-only source guard into a backend editability policy:
  `activePlanSourceKind -> editable plan capability`, then
  `plannedWorkout row/date -> editable operation capability`
- keep `manual-workout-authoring/*` as the owner for constructing new user-authored workout content,
  but stop making it the owner of whether an active plan source can be edited
- keep all mutations server-side and user-scoped
- never trust client-sent rows, segments, weekday labels, week numbers, metric targets, or source
  metadata

This should reuse existing canonical seams before adding anything new:

- `getExistingPlanContext(...)`
- protected workout/log/evidence checks already proven by manual Add/Delete/Move
- `active-plan-schedule-edit-preview.ts` date/protection/reflow concepts where applicable
- `active-plan-persistence.ts` and canonical `planned_workouts` persistence helpers
- manual workout review/normalization for new user-authored workout content

### Frontend Rules

- Frontend may show Add/Clear/Move/Copy controls only from backend-shaped editability/capability
  metadata.
- Frontend must not infer editability from `planMeta.sourceKind` long-term.
- Until backend editability metadata exists for non-manual sources, frontend must continue hiding
  those controls rather than faking capability.
- Frontend may keep only transient interaction state such as selected source workout, selected
  target date, copied source pointer, open menu/dialog state, and drag/drop gesture state.
- Frontend must not send planned workout rows, segment arrays, weekday labels, week numbers, metric
  targets, or persistence metadata as mutation authority.
- Move must never be implemented as frontend copy+delete.

### Review / Confirm Boundary

- Add, Delete/Clear, Move, Copy/Paste, and future Edit must use backend review/confirm when they
  mutate persisted active-plan truth.
- Review must rebuild or verify the current active plan server-side.
- Confirm must rebuild/verify the review server-side and reject changed source, changed target,
  stale checksum, invalid token, client row payloads, occupied target, protected rows, and active
  plan changes.
- No local schedule truth and no optimistic-only persistence.

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
- User-edited rows become protected runner-owned context for later AI continuation/refresh unless
  the runner explicitly confirms replacement.

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
- active-plan editability policy
- user override metadata
- protected row/date decisions
- review/confirm exactness for future planned-workout mutations

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
- Manual Add path exists at the backend and frontend level for `manual_user_built_plan_v1`: saved
  manual calendars can add one reviewed workout to an eligible future empty day, and browser/DB QA
  proved the date-only confirmation/readback path.
- Personal saved-template save/reuse is QA-passed for first-create and existing manual active-plan
  Add paths.
- Manual Copy/Paste, Delete/Clear, and Move Workout are QA-passed as user-facing manual-plan
  capabilities in the proved scope.
- Active-plan JSON/Markdown export is QA-passed for authenticated active plans including the manual
  plan proof.
- Deterministic selected-distance plans exist for current exposed families, and Marathon Completion
  preview exists as a separate family, but Marathon Completion is not ready for user-facing exposure
  until selected-plan confirm/persist is extended and QA-passed for that family.

Not implemented yet:

- universal Add/Delete/Move controls for AI/generated, selected-distance, preset, refreshed, or
  imported active plans
- backend editability/capability metadata for non-manual active-plan sources
- active-plan user override metadata/readback/export contract for mixed-source plans
- AI continuation block inside an existing manual active plan.
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

Updated sequencing decision — 2026-06-12:

1. Treat missing Add/Delete/Move on saved AI/generated/selected/imported plans as incomplete MVP,
   not an intended final limitation.
2. Do not start with Frontend controls. The next product gate is backend-owned universal
   active-plan editability and future-workout mutation safety.
3. Keep the active Marathon Base quality blocker separate. If only one product lane can run, fix
   plan-quality truth first; if work can run in parallel, this active-plan editing contract is safe
   to route to Backend because it should not touch running-plan composition policy.
4. The next backend gate should generalize the proven manual Add/Delete/Move boundaries into a
   source-agnostic active-plan editing lifecycle for future planned workouts.
5. Copy/Paste should follow after universal Add/Delete/Move because it depends on safe
   reconstruction of persisted source workouts.
6. Edit workout content, recurrence, Restore UI, and AI continuation remain future-only until the
   universal active-plan editability layer is proven.

Selected next implementation gate:

`BACKEND: universal active-plan editability and Add/Delete/Move backend boundaries`.

Backend implementation result — 2026-06-12:

- Added a focused backend editability policy for saved active-plan workout edits.
- Generalized the existing reviewed Add/Delete/Clear/Move server boundaries so accepted active-plan
  source kinds are no longer blocked solely because they are not `manual_user_built_plan_v1`.
- Preserved original active plan `source_kind` on successful edits and attached
  `active_plan_user_edit_v1` audit metadata for user-added, user-cleared, and user-moved workout
  mutations.
- Kept Copy/Paste, edit workout content, recurrence, frontend controls, persistence schema, and
  browser QA out of this backend slice.
- Deterministic source validation now proves the explicit editable source list is accepted, unknown
  source metadata remains blocked, manual saved-plan behavior remains valid, and representative
  `plan_preset_v1` Add/Delete/Move review-confirm paths pass without rewriting the plan source.

Scope for that gate:

- define backend editability/capability metadata for the current active plan, dates, and workouts
- support Add reviewed user-authored workout to an eligible empty future day across accepted active
  plan sources
- support Delete/Clear of one eligible future planned workout across accepted active plan sources
- support Move of one eligible future planned workout to an empty future day across accepted active
  plan sources
- preserve active plan original source metadata
- write explicit user-override metadata for edited rows/plan metadata
- keep all existing manual `manual_user_built_plan_v1` behavior and QA proofs valid
- add deterministic/source validation for manual, AI/structured, selected-distance, imported, and
  refreshed active-plan source fixtures
- do not wire frontend controls until backend proof is accepted

## What Must Not Be Claimed Yet

- Do not claim the unified lifecycle is shipped.
- Do not claim AI/generated, selected-distance, preset, refreshed, or imported active plans are
  editable until backend and browser QA prove those paths.
- Do not claim AI continuation is implemented.
- Do not merge manual builder and AI authoring into one backend shortcut.
- Do not let AI overwrite manual/protected calendar truth.
- Do not add frontend-owned plan blocks, templates, eligibility, or metric truth.
- Do not expose universal editing controls from frontend before backend editability/capability
  metadata exists.
- Do not weaken protected/logged/evidence guards to make all plans editable.

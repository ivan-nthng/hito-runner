# Unified Plan Creation Lifecycle

## Status

completed

## Type

product_brief

## Priority

high

## Next Recommended Role

product

## Task

Record the canonical date-based post-confirm workout editability contract.

## Stage

PRODUCT contract / accepted; runtime reconciliation pending outside this brief.

## Exact Handoff Prompt

None. The initial manual/future-only rollout prompt is obsolete.

## Current Editability Contract

The detailed rollout record below is preserved as implementation history. Its source-limited,
future-only, and logged/evidence-blocked availability rules are superseded by
`docs/current-product.md`: every confirmed non-rest workout on today or a future date can enter the
reviewed content-edit lifecycle regardless of source, logs, completion, or evidence; past workouts
are not editable. Review/confirm, stale protection, auth, provenance, and durable history remain
mandatory.

## Historical Rollout Record

Product direction / universal Add-Clear-Move editability accepted in proved scope; direct manual
Copy/Paste and Move implemented and QA-passed in the manual scope; missed-unlogged manual
move contract accepted for target today or valid future empty days; future workout-detail
action/editing contract accepted

Date: 2026-06-11

Last Updated: 2026-07-19

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
- AI/generated, selected-distance, preset, and imported active plans now have proved
  backend-shaped Add/Clear/Move editability in the accepted scope, but Copy/Paste, content editing,
  recurrence, Restore UI, active-plan replacement semantics expansion, and broader source/row
  matrices remain future-only
- manual active-plan Copy/Paste and drag/drop Move are now QA-passed as direct backend mutations
  with no separate runner-facing review/confirm step in the manual scope
- the missed-unlogged manual move contract now explicitly allows an eligible missed workout from a
  bounded recent past window, including yesterday, to move to today when it has no logged result,
  provider evidence, comparison-backed state, or other protected history
- the remaining risk is not a separate manual-vs-generated calendar product, but keeping the
  accepted capability-driven lifecycle narrow and backend-owned while future operations are added
- workout detail future actions now have a product contract: top action bar on desktop, `...`
  overflow on narrow screens, no `Move training` on this surface, and no live `Edit training` until
  backend persisted workout-content editing exists

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
| Move workout to empty day | Backend validates source and target date-only truth, then updates the same planned workout row date/weekday/week metadata. | Implemented and QA-passed as a direct mutation for manual active plans. Future empty-day move remains allowed; bounded missed-unlogged manual sources may target today or a valid future empty day. Universal direct/generated behavior remains future-only. Never implement as copy+delete or drag-only local state. |
| Copy/Paste | Backend reconstructs from a persisted source workout, validates supportability server-side, then inserts one copied row to an eligible target day. | Implemented and QA-passed as a direct mutation for manual active plans. Universal Copy/Paste remains future-only. |
| Edit workout content | Runner changes workout structure/duration/segments/targets through a reviewed constructor. | Product contract accepted for future workout detail, backend seam not implemented yet. First backend scope should be eligible future manual rows only, using persisted-row reconstruction plus manual constructor review/confirm. |
| Recurrence/batch expansion | Runner repeats a workout pattern across multiple dates. | Future-only. Requires batch conflict/protection review and must not be bundled into universal v1. |

## Direct Manual Copy/Paste And Drag-Move Decision

Date: 2026-06-13

Status:

Implemented / QA-passed / accepted in the manual scope.

Decision:

- For manual active-plan editing, Copy/Paste and drag/drop Move should become direct backend
  mutations with no separate runner-facing review dialog or confirm step.
- This is not a frontend shortcut. Backend still owns mutation safety, source/target validation,
  protected-state checks, persisted reconstruction, metadata, and audit history.
- This decision is manual-only first. Universal Copy/Paste and direct Move for generated, selected,
  preset, imported, or AI-authored active plans require a separate accepted contract and proof.

Direct copy contract:

- Frontend stores only a transient copied source pointer.
- Paste calls one backend direct copy mutation with `activePlanId`, `sourceWorkoutId`,
  `sourceWorkoutDate`, and `targetDate`.
- Backend re-resolves the active manual plan, verifies the source row is still on the source date,
  reconstructs from persisted workout truth, reruns supported manual draft validation internally,
  inserts one new row on the target date, updates metadata, and returns the refreshed mutation
  result.
- No client rows, segments, weekday labels, week numbers, metric targets, source metadata, or plan
  metadata are trusted.

Direct move contract:

- Drag/drop and menu fallback call one backend direct move mutation with `activePlanId`,
  `sourceWorkoutId`, `sourceWorkoutDate`, and `targetDate`.
- Backend re-resolves the active manual plan, verifies the source row/date, verifies the target is
  eligible and empty, updates exactly the existing `planned_workouts` row, preserves workout title,
  identity, structure, and metric truth, updates metadata, and returns the refreshed mutation
  result.
- Future empty target dates stay valid. Target today is valid only for the missed-unlogged manual
  contract below.
- Move must never be implemented as copy+delete, optimistic-only local schedule state, or
  frontend-provided row mutation.

Missed-unlogged manual move contract:

- Manual direct move may move a missed unlogged source workout to today or to a valid future empty
  day.
- Source date may be any date from seven calendar days before today through yesterday. This includes
  the primary yesterday-to-today use case while keeping the window bounded.
- Target date may be today or a future empty date inside the active plan. A target before today
  remains blocked.
- Target today and future empty targets are allowed only when the source workout is fully unlogged.
- Fully unlogged means no workout log, provider evidence, comparison-backed state,
  AI-insight/recommendation-backed state, protected history, unsafe metric truth, unreadable legacy
  metadata, or unsupported source shape.
- Target occupancy stays strict. Explicit Rest rows and any planned workout row are occupied; no
  replace, swap, or rest-row overwrite is accepted in this slice.
- Drag/drop and menu move must call the same backend rule and return the same bounded result shape.

Direct mutation blocked states:

- unauthenticated user
- missing, inactive, archived, foreign-user, or active-plan-id-mismatched plan
- non-`manual_user_built_plan_v1` active plan in this first direct slice
- source row not found, no longer on `sourceWorkoutDate`, not in the active plan, or unsupported
  for manual reconstruction
- source row with logged results, provider evidence, comparison-backed state, protected history,
  unsafe metric truth, unreadable legacy metadata, or unsupported rest/manual-template shape unless
  a dedicated proof accepts it
- target date is before today, before plan start, outside editable range, occupied, protected, or the
  same as the source date
- target date is today when the source is not a bounded missed-unlogged manual workout
- source date is older than the bounded missed window when trying to move to today or to a future
  empty day from the missed window
- request carries client rows, segments, weekday labels, week numbers, metric targets, source
  metadata, plan metadata, or other trusted payloads

Audit metadata:

- Preserve original active-plan `source_kind` and `source_status`.
- Continue appending `active_plan_user_edit_v1` metadata.
- Add `user_copied_workout` for direct copy and keep `user_moved_workout` for direct move.
- Record `mutation_mode: direct_manual_edit`, direct mutation payload version, server-computed
  mutation checksum, source workout id/date, target workout id or moved workout id, target date,
  target weekday, template/workout source type, title, original plan source kind/status, and
  `trusted_client_rows: false`.

Frontend behavior:

- No `Review paste`, `Review move`, review token, review checksum, or confirm modal in the direct
  manual path.
- Show working/success/blocked states from backend results.
- Refresh the calendar from persisted truth after success or failure.
- Do not add, duplicate, remove, or move rows locally as source of truth.

Source-row affordance contract:

- Direct copy, direct move, and drag initiation must be gated by row-level source capability truth,
  not by plan-level editability alone.
- `status === "skipped"` is not enough to decide eligibility because it can mean either an
  auto-inferred missed unlogged workout or a persisted skipped result.
- Persisted skipped/completed/partial results, provider evidence, comparison-backed state,
  AI-insight/recommendation-backed protected state, unsafe metric truth, unreadable source metadata,
  unsupported source shape, rest rows, inactive/archived/foreign-user plans, and protected history
  must not expose active copy/move/drag affordances.
- Recent missed-unlogged manual rows may expose move/drag for accepted target-today and
  future-empty-day move targets. They do not become generally copyable/protected-history-free rows.
- Ineligible source rows must not be draggable or set a drag payload. Copy/Move actions should be
  hidden by default, or shown disabled with a clear explanation if the menu remains visible for other
  actions.
- Backend mutation checks remain the final safety net even after pre-interaction affordance gating
  is improved.

## Future Workout Detail Actions And Edit Contract

Date: 2026-06-15

Status:

Accepted as product/architecture contract; not implemented.

Decision:

- Future planned workout detail actions move to the top of the detail page.
- Desktop uses an inline Hito action bar.
- Narrow/mobile uses a single `...` overflow menu.
- `Move training` is intentionally absent from workout detail. Calendar remains the move surface.
- The workout-detail action set is `Copy training`, `Delete training`, and `Edit training`.
- `Edit training` must remain blocked or disabled until backend owns persisted workout-content
  editing.

Canonical edit seam:

- First supported scope is eligible future planned manual workout rows that can reconstruct into the
  existing manual workout constructor draft shape.
- The edit surface should reuse the manual workout constructor/editor controls inside a
  workout-detail-like page rhythm. Do not create a second persisted workout editor.
- Backend must review and confirm edited workout content before persistence.
- Confirm must update exactly the same `planned_workouts` row, preserve date-only truth, preserve
  original active-plan source kind/status, and write `active_plan_user_edit_v1` metadata with
  `user_edited_workout`.
- Frontend must not send persisted rows, segments, weekday labels, metric targets, or source
  metadata as mutation truth.

Blocked in this contract:

- today, past, logged, completed, partial, skipped-with-log, provider-evidence-backed,
  comparison-backed, protected-history, rest, unsafe-metric, unreadable, or unsupported rows
- generated/selected/preset/imported workout-content editing until a separate backend proof accepts
  their reconstruction and semantics
- moving from workout detail
- recurrence, restore UI, active-plan replacement, fake pace, fake personal HR, and OpenAI-authored
  mutation

### Protected States

Universal editing must protect:

- past days
- today, except for the accepted missed-unlogged manual move contract
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

- Add, Delete/Clear, authored workout content changes, future Edit, recurrence, replacement, and
  other risky/batch/destructive mutations still need backend review/confirm unless Product accepts a
  narrower direct contract.
- Manual Copy/Paste and manual drag/drop Move are the explicit direct-mutation exception selected on
  2026-06-13.
- Direct mutation must still rebuild or verify the current active plan server-side at mutation time.
- Direct mutation must reject changed source, changed target, client row payloads, occupied target,
  protected rows, and active-plan changes.
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

Frontend / QA acceptance result — 2026-06-12:

- Saved calendar Add/Clear/Move controls are accepted as backend-shaped capability-driven behavior in
  the proved scope.
- Non-manual saved-plan mutation proof passed for the proved path, while preserving original
  `source_kind` and writing `active_plan_user_edit_v1` audit metadata for user edits.
- The manual Clear rerun passed after the persisted-workout reconstruction normalization fix:
  `Review clear workout` rendered, Restore affordance data was present, confirm cleared the
  persisted workout, fresh DB/browser readback proved the workout stayed removed, and disposable
  cleanup returned manual and non-manual rows/users to zero or absent.
- This acceptance does not ship universal Copy/Paste, recurrence, workout-content editing, Restore
  UI, active-plan replacement semantics expansion, or a broad generated-row mutation matrix beyond
  the already proved Add/Clear/Move slices.

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

- Do not claim the whole unified lifecycle is complete; only Add/Clear/Move are accepted in the
  proved scope.
- Do not claim every AI/generated, selected-distance, preset, refreshed, or imported row/source
  combination is editable; backend capability/protection reasons can still block specific cases.
- Do not claim AI continuation is implemented.
- Do not merge manual builder and AI authoring into one backend shortcut.
- Do not let AI overwrite manual/protected calendar truth.
- Do not add frontend-owned plan blocks, templates, eligibility, or metric truth.
- Do not expose universal editing controls from frontend before backend editability/capability
  metadata exists.
- Do not weaken protected/logged/evidence guards to make all plans editable.

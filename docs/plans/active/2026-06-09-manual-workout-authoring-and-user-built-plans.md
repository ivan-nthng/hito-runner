# Manual Workout Authoring And User-Built Plans

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

frontend

## Task

Remove stale frontend sourceEditing compatibility branch after backend metadata cleanup.

## Stage

FRONTEND behavior-preserving consumer cleanup / active-plan capability vocabulary simplification.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Remove stale frontend sourceEditing compatibility branch after backend source-capability vocabulary simplification.

Stage:
FRONTEND behavior-preserving consumer cleanup / active-plan capability vocabulary simplification.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md

Context:
Backend removed the stale missed-window source-capability vocabulary and aligned export
`source_status` readback through the shared active-plan source-status resolver. One frontend
compatibility predicate remains in `src/components/Calendar.tsx`: `canExposeTodayAsManualMoveTarget`
still accepts the old missed-window eligibility name even though backend now exposes past unlogged
rows as `eligible_past_unlogged`.

Scope:
1. Edit `src/components/Calendar.tsx` only unless TypeScript reveals another direct consumer.
2. Remove the stale missed-window eligibility comparison from `canExposeTodayAsManualMoveTarget`.
3. Preserve behavior: past unlogged movable rows still expose today as a move target through
   `eligible_past_unlogged`; current/future Add/Clear/Move behavior remains backend-shaped.
4. Do not change copy, menu labels, drag/drop behavior, manual-workout mutation semantics, backend
   files, docs, or `/hitoDS`.

Do not:
- Do not change backend source-capability semantics, manual mutation behavior, copy, move, clear,
  add, persisted edit, Supabase schema, migrations, OpenAI behavior, `/hitoDS`, or copy.

Validation:
- Targeted ESLint for `src/components/Calendar.tsx`.
- `npm run build`.
- `rg` proof that old missed-window eligibility vocabulary is gone from live `src/` source or
  retained only in historical docs.
- Scoped `git diff --check`.

Stop conditions:
- Stop if cleanup requires changing backend semantics, visible UI behavior, or calendar mutation
  rules.
```

## Suggested Next Step

Frontend should remove the one remaining stale sourceEditing compatibility predicate in
`Calendar.tsx`. Backend source-capability vocabulary and export `source_status` readback are now
aligned with backend row-state/provenance truth.

## Queued High-Priority Gate After Calendar Stabilization

Current calendar stabilization remains first. Do not start taxonomy implementation, rename backend
identities, alter JSON/export/import language, or change template behavior until the active calendar
cleanup gate is accepted.

- Current calendar stabilization remains first; taxonomy reconciliation is queued only after that
  gate is accepted.
- This docs slice records sequencing only and does not start taxonomy implementation.

Queued next gate:

ARCHITECT: unified runner-facing workout taxonomy reconciliation.

Accepted future direction:

- Runner-facing workout types for v1: Rest, Recovery, Easy, Steady, Long Run, Progression, Tempo,
  Intervals, Hills, Run/Walk.
- Runner-facing step types for v1: Warm-up, Run, Work, Recover, Finish, Cooldown, Repeat set.
- Backend canonical workout identities remain internal and must continue to support
  `training-plan-v2`, export/import, Garmin/FIT comparison, future Strava/provider comparison,
  metric truth, and running-plan engine generation.

Reconciliation scope:

- manual constructor taxonomy
- template library
- backend canonical workout identities
- running-plan engine identities
- `training-plan-v2` JSON/export/import language
- Garmin/FIT comparison needs
- future Strava/provider comparison implications

## Current Status Detail

Manual Add, personal saved templates, manual Copy/Paste, manual Delete/Clear, manual Move Workout,
Backend / Export Slice 7 manual active-plan JSON/Markdown export, universal active-plan
Add/Clear/Move editability, backend empty manual active-plan creation, the saved manual active-plan
workout constructor UI contract, the manual/template constructor usability batch, and persisted
future manual workout editing from workout detail are
implemented in the proved scope. The post-universal manual Clear restore/review reconstruction
regression and the constructor UI contract were rerun successfully on 2026-06-12. Direct manual
active-plan Copy/Paste and drag/drop Move are now implemented and QA-passed in the manual scope on
2026-06-13, using backend direct mutations instead of runner-facing review/confirm. The
missed-unlogged manual move contract was accepted on 2026-06-14 and later folded into row-state
truth: a fully unlogged past manual workout may move to today or to a valid future no-workout target
through the same backend direct move seam. The target-today resolver, non-rest template
direct constructor open path, and protected-source direct-edit affordance gating are now QA-passed on
2026-06-15. On 2026-06-15, Backend added and validated the persisted future workout-content edit
review/confirm seam for eligible manual planned rows. On 2026-06-20, Backend expanded the manual Add
contract so an eligible no-workout day on today can be added through the same reviewed backend-owned
Add seam as future no-workout days. The calendar consumer now exposes Add for today or future
no-workout days through `iso >= snapshot.currentDate`; today-as-move-target remains separately
guarded by the move-source resolver. QR/share-import, universal Copy/Paste, recurrence, Restore UI,
active-plan replacement semantics expansion, generated-row content editing, explicit persisted
rest-day lifecycle proof, and deeper modal polish remain future-only unless selected by a separate
architecture contract. On 2026-06-24, Backend repaired the remaining generated/selected row
lifecycle blocker: metric-target rows now expose move/clear/drag when unlogged and evidence-free,
while copy/edit/restore remain editor-gated. On 2026-06-25, the business-process/entity audit
selected the next backend cleanup gate: delete stale active-plan source-capability vocabulary and
align provenance readback without changing row-state behavior.

On 2026-06-15, the protected-source direct-edit affordance gate was closed in the proved scope:
backend row-level source capability readback and frontend consumption now prevent
skipped/logged/evidence-backed/protected source rows from exposing dead-end direct copy/move/drag
interactions. A small accessibility follow-up remains separate: move-only targets still retain an
`Add activity` aria-label in one browser DOM path, but that does not reopen the protected-source
contract. On 2026-06-15, the future workout-detail action/editing contract was accepted and the
backend persisted workout-content edit review/confirm seam was implemented: workout detail should
use top actions (`Copy training`, `Delete training`, `Edit training`) with mobile overflow and no
`Move training` on this surface. On 2026-06-24, QA accepted this workout-detail edit contract for
eligible future manual planned rows: SSR/source proof exposed `Edit training`, hid `Move training`,
and `reconstruct -> review -> confirm` updated the same persisted row.

On 2026-06-20, Architecture accepted the simplified manual/template constructor contract. Template
creation should open as a prefilled editable workout, the constructor should read as block identity
plus one quantity path plus one runner-facing target/guidance path, and repeat groups should feel
like one editable repeat unit rather than a dense settings matrix. The target-truth doctrine remains
unchanged: no fake pace, no fake personal HR, and structure-only executable guidance is valid when
canonical pace or personal HR truth is unavailable.

On 2026-06-24, Frontend implemented and internally QA-passed the constructor usability batch:
template creation opens as a prefilled editable workout, the constructor uses runner-facing
`Workout pieces`, quantity has one Duration/Distance/No quantity path, repeat units read coherently
on mobile, and internal target jargon was replaced while preserving backend modes
`structure_only`, `editable_default_hr`, and `none`.

## Manual / Template Constructor Simplification Contract — 2026-06-20

Status:

Accepted / implemented / browser-QA-passed in the scoped constructor usability path.

Root cause:

The visible symptom is that the manual/template constructor feels like a dense settings form. The
underlying cause is split ownership drift: frontend exposes low-level block, target-truth, repeat,
work, and recovery fields directly, while backend/product truth already treats manual workouts as
reviewed canonical drafts with strict target-truth rules. The correct fix is not a frontend-only
shortcut around backend validation and not a new editor. The existing manual workout constructor is
the canonical editing seam, but its anatomy and copy must be simplified.

Current source evidence:

- Built-in template selection already opens a constructor with `selection=registry`, default title,
  notes, target truth, and cloned `template.defaultEntries`.
- Scratch starts empty and remains review-disabled until a backend-supported type and executable
  structure exist.
- Saved personal templates currently prefill from `draftPayload` but keep entries locked and trigger
  server-side reconstruction/review.
- The backend schema supports `block` and `repeat_group` entries. A repeat group owns `repeatCount`,
  `safetyKind`, `workBlock`, and optional `recoveryBlock`.
- The UI already clears distance when duration is selected and clears duration when distance is
  selected.
- Manual target truth modes are currently `structure_only`, `editable_default_hr`, and `none`.
- Backend validators reject fake precise pace and fake personal HR; `editable_default_hr` is
  advisory/editable default HR guidance only, not personal HR truth.

Simplified editable block contract:

- Every editable non-rest block must have a backend-supported block identity.
- The block header owns identity: block type, visible label, summary, and row actions.
- The block body owns quantity and guidance.
- Quantity is one path per block at a time:
  - duration, or
  - distance.
- Duration and distance remain mutually exclusive in the UI and payload.
- Visible label can remain, but it should support the header identity instead of becoming the main
  editing grammar.
- Note-only blocks remain notes/cues and must not pretend to be executable metric targets.

Repeat group contract:

- A repeat group is one coherent editable unit, not a loose collection of independent settings.
- Header owns repeat identity: repeat label, rounds summary, and actions.
- Body may expose rounds and a plain-language safety/repeat kind, then show work and recovery
  subparts.
- Work and recovery subparts reuse the same simplified block quantity/guidance grammar.
- Nested repeat groups remain unsupported unless a future backend contract explicitly adds them.

Target / guidance contract:

- Product wants every editable running block to have clear runner-facing guidance.
- That does not mean every block must have pace or HR.
- Pace targets require canonical pace truth. Manual builder must not invent pace from title,
  target-time intent, block type, or perceived effort.
- Personal HR targets require personal HR-zone truth. Manual builder must not turn age-estimated or
  default HR guidance into personal HR truth.
- `editable_default_hr` may be presented as editable default HR guidance only, with explicit copy
  that it is not personal HR.
- `structure_only` remains valid and should be presented as executable structure/guidance: duration
  or distance, repeat/work/recovery anatomy, plus understandable block intent such as easy,
  steady, tempo, threshold, recovery, hill, trail, or long-run finish.
- RPE, effort, cues, and hints may support guidance, but unexplained RPE/effort jargon must not be
  the primary editable target surface.

Template behavior contract:

- Built-in templates should open directly as prefilled editable workouts.
- Template rows/cards may remain a chooser, but after selection the runner should see the actual
  editable workout, not a separate heavy settings step.
- Saved personal templates may remain server-reconstructed/locked in this slice if that is the only
  currently safe path. Making saved templates fully editable is a separate backend/frontend contract
  unless source proof shows the existing reconstruction/review seam already supports it safely.
- Backend review remains required before persistence.

Immediate decision:

- Closed on 2026-06-24. Do not keep routing this constructor batch unless a new source-proved
  defect appears.

Stop / escalation conditions:

- If Product requires every block to emit pace or HR, stop and route a Product/Running Coach/Backend
  doctrine decision before implementation.
- If a new target truth mode is needed, stop and route BACKEND.
- If saved personal template editing requires changing backend reconstruction/review semantics, stop
  and route BACKEND.
- If implementation would weaken no-fake-pace or no-fake-personal-HR, stop.

## Manual Add Today Contract — 2026-06-20

Status:

Accepted / backend implemented / frontend wired in source.

Root cause:

The visible symptom was that an eligible empty day on today did not expose `Add activity`. Source
inspection showed this was not only a hover/UI issue: the backend manual Add mutation still rejected
`workoutDate === currentDate`, and the calendar consumer also had a local future-only affordance
gate.

Backend decision:

- Manual active-plan Add may target today or a future empty day.
- Past days remain blocked.
- Occupied non-rest days, explicit Rest rows, logged/evidence-backed/protected targets, stale
  reviews, unsafe payloads, and unsupported active-plan sources remain blocked.
- The existing reviewed manual Add seam remains canonical; no same-day parallel path was added.

Backend implementation evidence:

- Updated `src/lib/manual-workout-authoring/active-plan-add.ts` so only past dates are rejected by
  the date guard.
- Extended `scripts/manual-workout-authoring/active-plan-add-proof.ts` with an empty-today success
  proof while preserving past, occupied, logged, evidence, stale, invalid-token, and client-row
  rejection proofs.
- `src/components/Calendar.tsx` now exposes manual Add for today or future empty days through the
  source-level `iso >= snapshot.currentDate` gate. The separate move-target today resolver remains
  intentionally stricter because a move target depends on an active copied/moved source workout.

## Future Workout Detail Actions And Persisted Edit Contract — 2026-06-15

Status:

Accepted / backend implemented / frontend wired / QA-passed for eligible future manual rows.

Root cause:

The visible symptom was that workout detail could not expose `Edit training` safely. The
underlying cause was that persisted workout-content editing for an already-planned row was not a
backend-owned mutation seam yet. The canonical owner is backend validation/review/confirm plus
active-plan persistence metadata, not a route-local frontend editor.

Decision:

- Future workout detail actions should live at the top of the detail page.
- Desktop uses inline actions; narrow screens collapse actions into a `...` overflow menu.
- `Move training` is not shown on workout detail. Calendar remains the move surface.
- The workout-detail action set is `Copy training`, `Delete training`, and `Edit training`.
- `Edit training` is allowed for eligible future manual planned rows through the accepted backend
  persisted workout-content edit review/confirm seam.

Backend editing contract:

- First implementation scope is eligible future planned manual workout rows only.
- The backend must reconstruct the persisted row into the existing manual workout draft/constructor
  shape before edit review.
- The existing manual workout constructor/editor remains the canonical UI editing anatomy; do not
  create a second persisted workout editor.
- Confirm updates exactly the same `planned_workouts` row and preserves date-only truth.
- Persist `active_plan_user_edit_v1` metadata with `user_edited_workout`, source row id/date,
  checksum/version, original active-plan source kind/status, and `trusted_client_rows: false`.

Blocked states:

- today, past, completed, partial, skipped-with-log, logged-result, provider-evidence-backed,
  comparison-backed, protected-history, rest, unsafe-metric, unreadable, unsupported, inactive,
  archived, and foreign-user rows
- generated/selected/preset/imported workout-content editing until a separate backend proof accepts
  reconstruction and edit semantics
- fake pace, fake personal HR, OpenAI-authored mutation, recurrence, Restore UI, active-plan
  replacement, or moving from workout detail

Backend implementation evidence:

- Added `src/lib/manual-workout-authoring/edit-workout.ts` as the focused owner for persisted
  future manual workout edit reconstruction, review token/checksum, and confirm.
- Reuses active-plan editability, protected-history/evidence checks, persisted workout
  reconstruction, manual workout draft review, and active-plan user-edit metadata.
- Confirm rebuilds server-side and updates exactly the same `planned_workouts` row for eligible
  future manual rows.
- Blocks protected/logged/evidence-backed, unsafe-metric, stale source/date, client-payload,
  generated/preset/imported, rest, past/today, and unsupported rows.
- Validation run by Backend on 2026-06-15:
  `npm exec eslint -- src/lib/manual-workout-authoring/edit-workout.ts src/lib/manual-workout-authoring/index.ts src/lib/active-plan-workout-editing/policy.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts`,
  `node --import tsx ./scripts/validate-manual-workout-authoring.ts`, and `npm run build`.

## Source-Row Direct Edit Capability Contract — 2026-06-15

Status:

Implemented / frontend consumed / QA-passed.

Root cause:

The visible symptom is that a skipped/protected workout can still expose a drag or move affordance,
but backend immediately rejects the mutation with protected-history/evidence messaging. The
underlying cause is that row-level source eligibility is not exposed and consumed as one canonical
capability before interaction starts. The current plan-level `workoutEditing` capability is
necessary but insufficient.

Decision:

- Direct copy, direct move, and drag initiation must be gated by row-level source capability truth.
- `status === "skipped"` is not enough to decide eligibility. It can mean an auto-inferred missed
  unlogged workout or a persisted skipped result.
- Persisted skipped/completed/partial result rows are logged history and must be ineligible for
  direct copy, move, and drag initiation.
- Provider-evidence-backed, comparison-backed, AI-insight/recommendation-backed, unsafe-metric,
  unsupported, unreadable, protected-history, rest, inactive, archived, or foreign-user source rows
  are ineligible.
- Eligible direct copy source rows are future, non-rest, supported manual rows with no log, no
  provider evidence, no protected history, no unsafe metric truth, and reconstructable manual
  metadata.
- Eligible direct move source rows are the same future eligible rows, plus fully unlogged recent
  missed manual rows for the accepted target-today or future-empty-day move path.
- Drag initiation uses direct move source eligibility. Ineligible rows must not be draggable.

Affordance behavior:

- Ineligible rows should not expose active `Copy workout` or `Move workout` actions.
- Ineligible rows must not expose a drag handle/grab cursor or set a drag payload.
- If a menu remains visible for other valid actions, ineligible copy/move may appear only as disabled
  with a clear pre-interaction explanation.
- Backend blocked responses remain the final safety net and must not be weakened.

Implementation boundary:

- First implementation gate is backend readback/capability metadata.
- Frontend consumption is the next slice after backend exposes the row-level capability, unless
  Backend proves the existing saved calendar payload already contains all required truth.
- This does not reopen constructor, add flow, recurrence, generated-plan universal editing, or
  copy/paste semantics beyond source eligibility gating.

Backend implementation evidence:

- Added `sourceEditing` to persisted saved-calendar workout readback.
- Added a focused backend source capability helper in `active-plan-workout-editing`.
- Source capabilities now distinguish universal row lifecycle state: unlogged, evidence-free,
  non-rest planned rows can expose Move/Clear/drag regardless of manual/generated/selected/imported
  provenance, while protected rows remain blocked.
- Blocked source reasons cover logged/skipped logs, provider/evidence-backed rows, unsafe metric
  truth, rest rows, and unsupported active-plan editability. Source kind is provenance for row
  lifecycle controls, not a standalone reason to hide move/clear.
- Direct copy/move mutation guards remain unchanged and authoritative; readback metadata is only
  pre-interaction affordance truth.

## Missed Unlogged Manual Workout Move Contract — 2026-06-14

Status:

Superseded by universal row-state lifecycle semantics after the 2026-06-24 backend cleanup. The
original manual missed-workout contract remains historical context for why past unlogged rows are
allowed, but source kind and age-window vocabulary are no longer the primary row editability gate.

Root cause:

The visible symptom was that drag/drop move did not deliver the runner's missed-workout use case for
future rescheduling. The underlying cause was that the accepted direct manual move contract was
documented as a special missed-source exception instead of universal row-state truth.
The canonical owner is backend mutation safety/lifecycle plus the active-plan editability contract,
not a route-local frontend exception.

Decision:

- Direct row move must allow an eligible unlogged source workout from a past, current, or future
  calendar day to move to today or to a valid future target day.
- Target date may be today or a future date inside the active plan. A target before today remains
  blocked for move.
- Clear/delete is source-date agnostic for eligible unlogged planned rows; source kind remains
  provenance and audit context.
- Fully unlogged means no workout log, provider evidence, comparison-backed state,
  AI-insight/recommendation-backed state, protected history, unsafe metric truth, unreadable legacy
  metadata, or protected unsupported row shape.
- Target occupancy is backend-classified. Empty targets remain direct, explicit unprotected Rest
  rows can be replaced directly, and one unprotected occupied workout target requires explicit
  review/confirm replacement before the source row moves.
- Drag/drop move and menu fallback move must share exactly the same backend rule and result shape.
- Source kind must not decide basic row controls by itself. Manual, selected/generated, preset, and
  imported active-plan rows can expose move/clear when the row is unlogged, evidence-free, and the
  active-plan editability policy allows the action.

Backend contract implications:

- Replace source-kind/date-only row affordance gates with universal completion/evidence-state
  checks.
- Keep `targetDate < currentDate` blocked.
- Keep source-today to target-today/no-op blocked.
- Allow future-source pull-forward to today when the target is empty and the source row is unlogged.
- Continue updating exactly one persisted `planned_workouts` row for direct move; never implement
  this as copy+delete.
- Preserve original active-plan source kind/status and append `active_plan_user_edit_v1` metadata
  with `mutation_mode: direct_manual_edit`, `user_moved_workout`, source date, target date, target
  weekday, moved row id, mutation checksum, and `trusted_client_rows: false`.

Blocked even after this change:

- logged workouts
- skipped/completed/partial workouts with a persisted result
- provider-evidence-backed workouts
- comparison-backed workouts
- AI-insight/recommendation-backed protected rows
- protected occupied targets with logged/completed/skipped result history or provider/evidence
  backing
- unsafe multi-row target dates
- past target dates
- unsupported active-plan editability policy
- copy/paste semantics
- recurrence, restore UI, workout-content editing without editor support, arbitrary swap, and
  universal Copy/Paste

Next gate:

- QA: validate the saved-calendar move target behavior against the simplified backend contract:
  public target truth is now `rest_day` or `workout_day`, while no-row persistence remains an
  internal exactness detail.

Backend implementation evidence:

- Updated `src/lib/active-plan-workout-editing/source-capabilities.ts`,
  `src/lib/manual-workout-authoring/move-workout.ts`, and
  `src/lib/manual-workout-authoring/delete-clear.ts` so move/clear use universal row-state gates:
  unlogged, evidence-free, non-rest planned rows can be moved or cleared regardless of active-plan
  source kind.
- Kept direct move signing row provenance/target truth and updating the same row. Occupied
  replacement review/confirm now accepts the same persisted-row move contract without requiring
  manual draft reconstruction, so eligible unlogged/evidence-free selected/generated and AI
  provenance rows can be reviewed for replacement through the backend move checksum seam.
- Preserved protected-history safety by rejecting logged/evidence-backed source rows.
- Replaced the previous target-mode vocabulary with `targetDayKind: "rest_day" | "workout_day"`.
  Missing target rows and explicit unprotected Rest rows are both public `rest_day`; occupied
  unprotected workout rows are public `workout_day`.
- Kept direct move for Rest-day targets only; occupied workout replacement still requires the
  existing backend move review/confirm seam and includes replacement target truth in checksum and
  audit metadata.
- Renamed new move metadata writes from `target_mode` / `target_day_was_empty` to
  `target_day_kind` plus the internal exactness field `target_had_no_persisted_workout_row`.
- Renamed Add and Copy/Paste saved-calendar target success safety from `targetDayWasEmpty` to
  `targetDayKind: "rest_day"` without changing Add/Copy target eligibility.
- Extended `scripts/validate-manual-workout-authoring.ts` and manual proof modules with
  deterministic proof for past/today/future unlogged source capabilities, selected/generated row
  direct move/delete, Rest target replacement, occupied-workout replacement review/confirm,
  logged/evidence source/target rejection, no fake pace/HR, same-row move preservation, and audit
  metadata readback.
- Validation run by Backend on 2026-06-14:
  `npm exec eslint -- src/lib/manual-workout-authoring/move-workout.ts src/lib/manual-workout-authoring/index.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts`
  and `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- Validation run by Backend on 2026-06-25 for the Rest/Workout target contract simplification:
  targeted ESLint for touched manual/calendar/proof files,
  `node --import tsx ./scripts/validate-manual-workout-authoring.ts`,
  `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`, `npm run build`, and
  source `rg` proof that manual saved-calendar code no longer exports `targetDayWasEmpty`,
  `target_day_was_empty`, `rest_replacement`, `workout_replacement`, or product-facing
  `empty target` / `empty day` vocabulary.
- Fix-forward validation on 2026-06-24 added proof that UI-shaped move review/confirm payloads may
  include both `sourceWorkoutId` and `sourceWorkoutDate` when they resolve to the same current row,
  mismatched pairs are rejected as stale source-date truth, and occupied replacement review/confirm
  works for manual, selected/generated, and AI-provenance rows while protected targets remain
  blocked.

## Direct Manual Copy/Paste And Drag-Move Contract — 2026-06-13

Status:

Implemented / QA-passed / accepted in the manual scope.

Root cause:

The visible symptom was a brittle review lifecycle for Copy/Paste and Move. The deeper product issue
is that manual plan editing should not require a separate review/confirm step for clipboard-style
copy/paste or drag/drop move gestures. The canonical owner of the change is backend mutation
safety/lifecycle plus frontend interaction wiring over backend-shaped direct mutation results, not a
frontend shortcut around the existing review actions.

Decision:

- Manual active-plan Copy/Paste becomes a direct mutation: runner copies a source planned workout,
  chooses an eligible empty target day, and Hito calls one backend mutation that copies from
  persisted source truth into the target date.
- Manual active-plan drag/drop Move becomes a direct mutation for non-replacement targets: dropping
  an eligible workout onto an eligible empty target day, or later an explicit unprotected Rest row,
  calls one backend mutation that moves exactly the existing `planned_workouts` row.
- No runner-facing `Review paste`, `Review move`, or separate confirm dialog should remain for
  non-replacement direct manual editing. The later occupied-workout replacement contract is the
  explicit exception: it requires review/confirm before overwriting the target day.
- Backend still owns all mutation truth. Frontend may hold only transient source pointer, target
  date, hover/drop/menu state, loading state, and toasts.
- Direct mutation is manual-active-plan-only for this slice. Universal Copy/Paste and direct
  generated/preset/imported plan move behavior remain future contracts unless explicitly selected.

Backend direct mutation contract:

- Add focused direct actions such as `copyManualWorkoutWithinActivePlanForUser(...)` and
  `moveManualWorkoutWithinActivePlanForUser(...)`, or equivalent names under the existing manual
  workout authoring seams.
- Input must be minimal and date-only:
  - `activePlanId`
  - `sourceWorkoutId`
  - `sourceWorkoutDate`
  - `targetDate`
- Input must reject client-sent rows, segments, weekday labels, week numbers, metric targets,
  source metadata, plan metadata, or persisted workout payloads.
- Server must re-resolve the current user, active plan, source row, source date, target date,
  target weekday, target week number, target occupancy, protected state, and supported source
  anatomy at mutation time.
- Copy must reconstruct from persisted source workout truth server-side, rerun the existing manual
  draft validation/normalization internally, insert one new row on the target date, and refresh plan
  metadata from persisted truth.
- Move must update exactly one existing `planned_workouts` row date/weekday/week/source id metadata,
  preserve title, identity, structure, and metric truth, and refresh plan metadata from persisted
  truth.
- Direct actions may compute a server-side `mutationChecksum` for audit and idempotency, but must
  not require frontend-visible review token/checksum.
- The existing review-based copy/move actions should stay only as temporary compatibility until
  frontend direct wiring and QA acceptance are complete; they must not remain the preferred product
  lifecycle afterward.

Protected-state exceptions:

- Block unauthenticated users.
- Block missing, inactive, archived, foreign-user, or active-plan-id-mismatched plans.
- Block non-`manual_user_built_plan_v1` active plans in this slice.
- Block source rows not found, not on `sourceWorkoutDate`, not in the current active plan, or not
  reconstructable as supported manual workout truth.
- Block source rows with logged results, provider evidence, comparison-backed state, protected
  history, unsafe metric truth, unreadable legacy metadata, or unsupported rest/manual-template
  shape until those cases get their own accepted proof.
- Block target dates that are past/today, before plan start, outside the editable range, occupied,
  protected, or equal to the source date.
- Block stale UI state by requiring the source row id and source date to still match persisted truth
  at mutation time.
- Block any request carrying client rows, segments, weekday strings, week numbers, metric targets,
  source metadata, or plan metadata.
- Return bounded blocked reasons such as `no_active_plan`, `unsupported_active_plan_source`,
  `unsupported_source_metadata`, `source_workout_not_found`, `source_workout_not_in_active_plan`,
  `source_workout_not_supported`, `source_date_changed`, `target_date_unchanged`,
  `not_future_date`, `protected_day`, `logged_workout`, `evidence_backed_workout`, `occupied_day`,
  `client_payload_rejected`, and `persistence_failed`.

Audit and metadata expectations:

- Preserve the active plan's original `source_kind` and `source_status`; do not rewrite the plan to a
  new source just because the runner copied or moved a manual workout.
- Continue appending `active_plan_user_edit_v1` metadata.
- Extend mutation kinds to include `user_copied_workout`; keep `user_moved_workout` for direct move.
- Store:
  - `mutation_mode: direct_manual_edit`
  - mutation source/version, for example `manual_workout_direct_copy_v1` or
    `manual_workout_direct_move_v1`
  - server-computed mutation checksum
  - source workout id and source workout date
  - target workout id for copy or moved workout id for move
  - target date and target weekday
  - template key / workout source type
  - title
  - original plan source kind/status
  - no trusted client rows
- Export/readback should preserve original plan source plus user edit metadata.
- AI refresh/update and future plan replacement must treat direct user edits as runner-owned truth
  unless the runner explicitly chooses to regenerate/replace them.

Frontend contract after backend slice:

- Copy action stores only a transient source pointer.
- Paste action calls the direct backend copy mutation immediately and then refreshes the calendar
  from persisted truth.
- Drag/drop and the menu fallback `Move selected workout here` call the direct backend move mutation
  immediately and then refresh the calendar from persisted truth.
- No `Review paste`, `Review move`, confirm modal, review token, or review checksum is rendered for
  the direct manual path.
- Frontend must show pending/working, success, and blocked states from backend results; it must not
  locally add, duplicate, remove, or move rows as persisted truth.

Current supersession note:

- The manual-scope Copy/Paste content-reconstruction limits below remain historical and still apply
  to universal Copy/Paste/content editing, but direct Move/Clear row lifecycle for eligible
  generated/selected/preset/imported rows was superseded by the 2026-06-24 universal row-state
  lifecycle fix.

Out of scope:

- Universal Copy/Paste across generated/selected/preset/imported plans.
- Direct move for generated/selected/preset/imported plans in this 2026-06-13 manual-only slice.
- Copying/moving logged, evidence-backed, comparison-backed, protected, rest, or unreadable legacy
  rows unless backend can prove those cases in this slice and QA explicitly accepts them.
- Recurrence, batch copy, multi-select move, swap/replace, workout-content editing, Restore UI,
  active-plan replacement semantics expansion, QR/share-import, PDF/watch export, and modal polish.

Validation expected from Backend:

- Targeted ESLint for changed manual authoring, active-plan editability, and validator files.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- Deterministic proof for direct copy success, direct move success, no trusted client payload,
  source/date stale rejection, occupied target rejection, protected/logged/evidence source
  rejection, non-manual active-plan rejection, unsupported/rest source rejection where still out of
  scope, metadata/readback shape, no fake pace, no fake personal HR, and unchanged old review path
  compatibility if retained.
- Guarded disposable persistence proof only if new direct mutation persistence cannot be fully
  covered by the existing validator harness.

Backend implementation evidence:

- Added direct `copyManualWorkoutWithinActivePlanForUser(...)` and
  `moveManualWorkoutWithinActivePlanForUser(...)` seams under the existing manual workout authoring
  owners.
- Direct Copy/Paste reconstructs from persisted source truth, internally reviews/exactness-checks
  the rebuilt manual draft, and inserts exactly one target workout through the existing active-plan
  add persistence seam.
- Direct Move reuses the existing move resolver/protected-state checks and updates exactly one
  persisted `planned_workouts` row through the existing move persistence seam.
- Direct mutations append `active_plan_user_edit_v1` audit metadata with `user_copied_workout` or
  `user_moved_workout`, `mutation_mode: direct_manual_edit`, source/target workout/date refs,
  mutation payload/checksum fields, and `trusted_client_rows: false`.
- Validator coverage proves direct copy success, direct move success, client payload rejection,
  stale source/date rejection, occupied targets, protected source rows, non-manual direct-mutation
  rejection, unsafe metric source rejection, no fake pace, and no fake personal HR. Old review-based
  actions remain covered as temporary compatibility.
- Next cleanup candidate: extract the manual Copy/Paste and Move proof island from
  `scripts/validate-manual-workout-authoring.ts` if the file continues growing in the next slice.

Acceptance evidence:

- Backend added direct `copyManualWorkoutWithinActivePlanForUser(...)` and
  `moveManualWorkoutWithinActivePlanForUser(...)` seams under the existing manual workout authoring
  owners.
- Frontend direct wiring removed the runner-facing review/confirm lifecycle from manual Copy/Paste
  and direct Move UI paths while preserving backend-owned blocked/success states.
- QA passed the manual copy/paste flow: copy from one manual day, paste onto an eligible future
  empty day, confirm no raw `reading 'ok'` crash, and prove persisted source/target readback after
  success.
- QA passed the manual direct create/open flow and subsequent saved-calendar manual editing path,
  keeping backend-owned active-plan truth and cleanup intact.

Next gate:

- QA: explicit manual Add Rest Day review/confirm lifecycle proof.

## Manual Workout Constructor UI Acceptance — 2026-06-12

Status:

QA-passed / accepted in the proved scope.

Root cause:

The visible risk was that manual `Add activity` could become a set of disconnected menus, template
cards, and local draft rows instead of one backend-reviewed constructor surface. The underlying
cause was frontend interaction ownership around scratch/template editing and repeat groups. The
canonical owner split remains: frontend owns the constructor interaction and rendering, while backend
manual authoring owns supported template/block/repeat validation, review readiness, review
token/checksum, and persistence truth.

Acceptance decision:

- Accept the manual workout constructor UI contract in the saved manual active-plan flow.
- Treat this as user-facing shipped behavior because runners can now open the saved manual calendar,
  choose `Add activity`, start from scratch, choose a template, see `Add rest day`, edit a
  backend-supported constructor surface, and reach backend `draft_ready` from the template path.
- Record shipped history in
  [changelog](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md).

QA evidence:

- Saved manual active-plan calendar exposed `Add activity`.
- Add menu showed `Start from scratch`, `Choose template`, and `Add rest day`.
- Scratch constructor opened visibly empty, and `Review workout` stayed disabled until the draft
  became backend-supportable.
- Workout type selection, block adding, and repeat/loop group UI were live inside the constructor.
- Scratch repeat-group review reached backend rejection with actionable warmup/cooldown issues
  rather than silently persisting unsupported structure.
- Template flow opened the same constructor surface prefilled with editable backend-shaped blocks.
- Template review reached backend `draft_ready` and showed review token/checksum held for confirm.
- Review proved no client rows, segments, or persistence metadata were silently persisted before
  confirm.
- Mobile `375px` review state had no horizontal overflow.
- Cleanup returned scoped `runner_manual_workout_templates`, `workout_logs`, `planned_workouts`,
  `plan_cycles`, `runner_profiles`, local account, and auth user state to zero/absent.
- Artifacts:
  [manual workout constructor UI QA](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-06-12/manual-workout-constructor-ui-qa/).

Boundary:

- This does not claim explicit `Add rest day` review/confirm persistence yet; the menu is visible
  and rest templates exist, but the next gate must prove intentional Rest rows versus blank empty
  days.
- This does not ship recurrence, workout-content edit for existing persisted workouts, Restore UI,
  universal Copy/Paste, QR/share-import, or generated-row content editing / Copy-Paste beyond the
  later proved row-state Move/Clear/drag slices.
- The constructor must continue sending structured draft input to backend review and must not append
  calendar rows, segments, or persistence metadata locally.

Next gate:

- QA: explicit manual Add Rest Day review/confirm lifecycle proof.

## Backend Empty Manual Active-Plan Creation Seam — 2026-06-12

Status:

Implemented / validation passed.

Root cause:

The visible symptom was that Manual setup could not create/open a manual calendar until a first
workout had been reviewed and confirmed. The underlying cause was that the manual first-create
contract mixed active-plan creation with first-workout confirmation, and the persisted manual plan
builder explicitly rejected empty plans. The canonical owner is backend manual authoring actions plus
active-plan persistence, not frontend-local draft calendar state.

What changed:

- Added a backend-owned empty manual active-plan create/open action through
  [actions.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/actions.ts).
- Added a reusable empty active-plan persistence seam in
  [active-plan-persistence.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-persistence.ts)
  so runner profile upsert and active-plan creation stay in the canonical persistence owner.
- Added a manual setup schema/result contract in
  [schema.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/schema.ts)
  for age, height, weight, and running level only.
- Added empty-plan metadata construction in
  [persistence.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/manual-workout-authoring/persistence.ts)
  with `manual_user_built_plan_v1`, `row_count: 0`, and `non_rest_row_count: 0`.
- Added focused proof coverage in
  [empty-plan-proof.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/manual-workout-authoring/empty-plan-proof.ts).

Validation evidence:

- `npm exec eslint -- src/lib/active-plan-persistence.ts src/lib/manual-workout-authoring/actions.ts src/lib/manual-workout-authoring/persistence.ts src/lib/manual-workout-authoring/schema.ts src/lib/manual-workout-authoring/index.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts scripts/manual-workout-authoring/*.ts`
  passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed with
  `Manual workout authoring review contract invariants passed.`

Boundary:

- No fake first workout is created.
- No `training-plan-v2` import schema weakening was introduced.
- Existing first-workout confirm and active-plan Add review/confirm paths remain available.
- Clearing the final remaining workout into an empty plan remains a separate follow-up policy
  decision; this slice only creates an empty plan from no-active-plan Manual setup.

## Backend Slice 13B Manual Active-Plan Add Proof Extraction — 2026-06-12

Status:

Implemented / validation passed.

Root cause:

The visible symptom was that manual active-plan Add proof coverage still lived inside the broad
manual authoring validator. The underlying cause was proof-infrastructure ownership drift after MVP
feature delivery. The canonical owner is script-only validation structure, not runtime UI or
persistence behavior.

What changed:

- Extracted active-plan Add proof into
  [active-plan-add-proof.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/manual-workout-authoring/active-plan-add-proof.ts).
- Kept
  [validate-manual-workout-authoring.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/validate-manual-workout-authoring.ts)
  as the stable public validator entrypoint.
- Preserved Add proof for successful add, backend edit metadata, no client-row trust, accepted
  non-manual source Add, stale review/token/input rejection, occupied/protected day rejection,
  active-plan mismatch, and persistence failure.
- Did not change product runtime, frontend UI, Supabase schema, persistence semantics, or manual
  builder behavior.

Validation evidence:

- `npm exec eslint -- scripts/validate-manual-workout-authoring.ts scripts/manual-workout-authoring/*.ts`
  passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed with
  `Manual workout authoring review contract invariants passed.`
- Scoped `git diff --check` passed.
- `npm run build` was not required because this slice only moved validation/proof script ownership.

## Universal Active-Plan Editability Acceptance — 2026-06-12

Status:

QA-passed / accepted in the proved scope.

Acceptance decision:

- Accept the universal active-plan editability gate for backend-shaped Add/Clear/Move capability
  visibility and mutation behavior in the proved scope.
- Accept the rerun proving manual Clear review/confirm after the persisted-workout reconstruction
  normalization fix.
- Treat this as user-facing shipped behavior because saved calendar actions are now capability
  driven by backend editability policy rather than a separate manual-only calendar product.
- Record shipped history in
  [changelog](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md).

QA evidence:

- Earlier universal editability proof established backend-shaped Add/Clear/Move visibility and
  mutation behavior on the proved non-manual saved-plan path.
- The non-manual fixture used
  `source_kind: running_plan_engine_marathon_base_builder_v1` and showed editable active-plan Add
  controls plus occupied-day actions from backend-shaped capability data.
- The rerun used disposable users
  `qa-universal-clear-rerun-20260612122950@example.test` and
  `qa-universal-nonmanual-rerun-20260612133624@example.test`.
- Manual Clear review reached `Review clear workout` instead of `Clear blocked`.
- Restore affordance data was present and the previous `Manual workout draft input is invalid`
  failure was absent.
- Confirm cleared the persisted `2026-06-20` `steady_aerobic_run` row, refreshed the saved calendar
  from persisted truth, and kept the active manual plan active.
- DB readback showed exactly one active manual plan, the cleared workout removed, remaining
  workouts preserved, `manual_user_built_plan` row/non-rest counts updated to `2`, and
  `active_plan_user_edit_v1` metadata recording `user_cleared_workout`.
- Fresh reload confirmed the cleared target workout did not return.
- Cleanup returned manual and non-manual disposable `runner_manual_workout_templates`,
  `workout_logs`, `planned_workouts`, `plan_cycles`, and `runner_profiles` to `0`, and both auth
  users were absent.
- Artifacts:
  [universal active-plan editability rerun QA](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-06-12/universal-active-plan-editability-rerun-qa/).

Boundary:

- This does not ship universal Copy/Paste, recurrence, workout-content editing, Restore UI,
  active-plan replacement semantics expansion, or a broader generated-row mutation matrix beyond
  the already proved Add/Clear/Move slices.
- Frontend must continue rendering backend-shaped editability/capability metadata rather than
  inferring edit rights from `source_kind`.
- Backend keeps the original active-plan source kind and appends `active_plan_user_edit_v1`
  mutation metadata for user edits.

Next gate:

- BACKEND Slice 13B: manual active-plan add proof extraction from
  `scripts/validate-manual-workout-authoring.ts`.

## Backend Manual Clear Restore Reconstruction Fix — 2026-06-12

Status:

Implemented / focused QA rerun passed.

Root cause:

The visible symptom was a `Clear blocked` dialog with `Manual workout draft input is invalid.`
The failing source-of-truth boundary was persisted workout reconstruction for manual restore
affordance review. `reviewManualWorkoutDeleteClearForUser(...)` correctly used minimal identifiers
and rebuilt the restore draft server-side, but the shared persisted-workout reconstruction seam could
copy rich persisted labels/guidance/target hints into `ManualWorkoutDraftInput` without enforcing
the bounded manual draft schema lengths. That let backend create a draft that
`reviewManualWorkoutDraft(...)` then rejected.

What changed:

- Updated `src/lib/manual-workout-authoring/copy-paste-reconstruction.ts` to normalize persisted
  text fields into the manual draft contract limits when reconstructing a draft.
- Kept numeric structure, repeat/work/recovery anatomy, source template identity, date derivation,
  and metric-truth policy unchanged.
- Added deterministic manual harness coverage proving a persisted `steady_aerobic_run` with rich
  overlong guidance/target hint can still produce a Clear restore review instead of
  `invalid_input`.

Validation evidence:

- `npm exec eslint -- src/lib/manual-workout-authoring/copy-paste-reconstruction.ts src/lib/manual-workout-authoring/delete-clear.ts src/lib/manual-workout-authoring/actions.ts src/lib/manual-workout-authoring/schema.ts scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `git diff --check -- src/lib/manual-workout-authoring/copy-paste-reconstruction.ts scripts/validate-manual-workout-authoring.ts`
- `npm run build`

Closeout:

- The focused QA rerun passed and is recorded in
  [Universal Active-Plan Editability Acceptance](#universal-active-plan-editability-acceptance--2026-06-12).

## Paused ARCHITECT Freeze-Readiness Handoff Prompt

```text
ROLE: ARCHITECT

Task:
Run the Hito code-freeze cleanup inventory using the canonical functional map after manual builder
Move Workout acceptance.

Stage:
ARCHITECT cleanup inventory / code-freeze readiness audit.

Context:
Manual user-built plans now support first create, adding workouts, personal saved templates,
existing-plan saved-template reuse, Copy/Paste, Delete/Clear, Move Workout, and JSON/Markdown
export in proved browser/DB/download scope. The manual builder functional MVP is complete enough
for code-freeze/refactor planning. The next step is not another product feature and not cleanup
implementation yet; it is a source-of-truth inventory that starts from real shipped/accepted flows.

Root cause and architecture fit:
The visible symptom is that the service has grown quickly after several plan-creation and manual
builder slices. The likely underlying cause is that cleanup can drift into file-size hunting instead
of preserving canonical business flows. The canonical owner is documentation/source-of-truth first,
then architecture cleanup selection. Use the functional map to decide what is required, validation
only, compatibility-only, future-only, or suspect before recommending deletion/decomposition.

Required reading:
- `AGENTS.md`
- `agents/architect.agent.md`
- `skills/hito-architecture-audit/SKILL.md`
- `skills/hito-plan-writing-and-closeout/SKILL.md`
- `skills/hito-prompt-handoff/SKILL.md`
- `docs/current-functional-map.md`
- `docs/current-product.md`
- `docs/current-system.md`
- `docs/current-state.md`
- `docs/history/changelog.md`
- `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`
- `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- `docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md`
- `docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md`

Accepted manual-builder capabilities to preserve:
- no-active-plan manual first create
- existing manual active-plan Add activity
- personal saved templates and saved-template reuse
- Copy/Paste
- Delete/Clear
- Move Workout
- JSON/Markdown export
- backend-owned review/confirm boundaries, date-only truth, metric truth, and persisted readback

Scope:
- Verify whether `docs/current-functional-map.md` needs a docs-only alignment update because Move
  Workout is now user-facing in the proved scope.
- Build or update the cleanup inventory from the functional map, not from vibes or line count alone.
- Classify backend, frontend, scripts, validators, QA artifacts, and docs into required,
  validation-only, compatibility-only, future-only, suspect/decompose, or delete/demote candidates.
- Identify the highest-impact safe cleanup gate for one next implementation role.
- Prefer deletion/demotion over abstraction and source-of-truth reduction over cosmetic movement.
- Keep manual builder, selected running-plan creation, active-plan export, Admin Work Items, and
  Hito DS boundaries separate.
- Produce exactly one next owner/gate and one execution-ready prompt if implementation is selected.

Validation:
- If docs are changed, run scoped `git diff --check -- <changed docs>`.
- No build, browser QA, Supabase mutation, or migrations are required for docs-only architecture
  inventory.

What not to do:
- Do not edit product code.
- Do not start cleanup implementation.
- Do not run browser QA.
- Do not mutate Supabase or run migrations.
- Do not select QR/share/import, recurrence, edit workout, Restore UI, generated/preset/imported
  plan mutation, active-plan replacement, or modal polish as part of this inventory.
- Do not delete validation coverage just to reduce line count.
- Do not collapse backend truth into frontend or create a new parallel persistence path.
```

## Frontend Slice 6 Move Workout Acceptance — 2026-06-12

Status:

QA-passed / accepted as user-facing manual-plan capability in the proved scope.

Acceptance decision:

- Accept FRONTEND Slice 6 as QA-passed.
- Manual Move Workout is now user-facing for existing `manual_user_built_plan_v1` active plans in
  the proved scope.
- This does not ship recurrence, edit workout, Restore UI, QR/share/import, generated/preset/imported
  plan mutation, active-plan replacement, or deeper modal polish.
- Record this as shipped user-facing history in
  [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md).

QA evidence:

- Built-in Codex Browser was tried first, but login submit hit a CDP timeout; non-Chrome Playwright
  WebKit completed the full proof.
- Disposable user: `qa-manual-move-rerun-031409@example.test`.
- `Review move` rendered after `Move workout` -> `Move selected workout here`.
- No `Preview mode`, `Sign in to save progress`, or `couldn't load plan` appeared after review.
- Review dialog showed source `Thu, Jun 18`, target `Fri, Jun 19 · Friday`, title
  `QA export easy opener`, structure `45 min · Structure only`, identity `EASY AEROBIC RUN`, and
  copy saying Hito moves exactly the existing planned workout row.
- No fake pace or fake personal HR appeared.
- Confirm moved the same `planned_workouts` row id `2d188d1e-7687-4f87-9279-f0818c85f358` from
  `2026-06-18` to `2026-06-19`.
- Row count stayed `3`.
- Target weekday became `Friday`.
- Title, identity, structure, metric mode, active plan state, and other workouts were preserved.
- Fresh saved-calendar readback showed Jun 18 empty/Add and Jun 19 containing the moved workout.
- Drag/drop proof passed: real WebKit coordinate drag from Jun 20 workout to Jun 21 empty target
  reached the same backend-reviewed `Review move` state; QA stopped before second confirm as
  allowed.
- Mobile proof passed at `innerWidth: 375` with no horizontal overflow for calendar, occupied-day
  menu, move-source state, target menu, and review state.
- Blocked-state proof covered occupied target, unchanged target, stale review, unsupported
  active-plan source, and client-row rejection by source/harness.
- Cleanup returned disposable data to zero/absent.
- Artifacts:
  [manual-move-workout-rerun-qa](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/screenshots/2026-06-12/manual-move-workout-rerun-qa/).

Next gate:

- ARCHITECT cleanup inventory / code-freeze readiness audit using
  [docs/current-functional-map.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-functional-map.md).
- Do not start cleanup implementation in this closeout.

## Backend Slice 8 Move Workout Implementation Notes — 2026-06-12

Status:

Implemented / QA-passed / accepted for backend boundary.

Root cause:

Move Workout is a date-only mutation on an existing persisted manual active plan. Implementing it
as frontend row cloning, copy+delete, or drag state would duplicate schedule truth and bypass
review exactness. The canonical owner is backend validation, protected-source/target checks,
review-token/checksum exactness, and persisted `planned_workouts` date updates.

What changed:

- Added `src/lib/manual-workout-authoring/move-workout.ts` as the focused owner for manual move
  review/confirm.
- Reused existing manual add/copy/delete seams:
  active plan/source guard, source reconstruction support, protected logged/evidence checks,
  date-only target validation, stable checksum helper, and canonical Supabase persistence.
- Added `reviewManualWorkoutMove` and `confirmManualWorkoutMove` through
  `src/lib/manual-workout-authoring/index.ts` and the thin `training-api.ts` facade.
- Confirm rebuilds the move review server-side, validates token/checksum, rejects client rows, and
  updates exactly one existing `planned_workouts` row to the target date/weekday/week number.
- Move preserves title, workout identity/family/icon, executable segment structure, and metric
  truth; it does not trust client-sent rows or segments.
- Move allows the last workout only because the workout remains in the same active manual plan.

Validation evidence:

- Targeted ESLint passed for manual authoring action/add/copy/delete/move/persistence/export seams
  and the manual validator.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- Guarded persistence preflight with `--require-persistence` blocked before mutation because no
  disposable Supabase env was configured.
- Guarded disposable Supabase persistence proof passed against project `dltfjwexyctmihclcjqj`.
- `npm run build` passed.

Out of scope:

No frontend move UI, drag-and-drop, schema migration, generated/preset/imported/running-engine
mutation, recurrence, edit, Restore UI, QR/share-import, PDF/watch export, OpenAI, fake pace, or
fake personal HR was added.

## Backend Slice 8 Move Workout Acceptance — 2026-06-12

Status:

QA-passed / accepted for backend mutation boundary.

Acceptance decision:

- Accept Backend Slice 8 as the backend-owned date-only Move Workout boundary for existing
  `manual_user_built_plan_v1` active plans.
- At Backend Slice 8 closeout, this accepted the backend primitive only. Runner-facing acceptance is
  recorded in the Frontend Slice 6 section above.
- No changelog entry was added for this backend-only closeout; shipped-history wording was deferred
  until runner-facing Move Workout UI passed browser QA.

QA evidence:

- Target disposable Supabase project: `dltfjwexyctmihclcjqj`.
- Review was non-mutating and returned `review_ready`, `persisted: false`, target weekday
  `Monday`, and `trustedClientRows: false`.
- Confirm returned `moved`, `persisted: true`, `serverRebuiltReview: true`, and
  `movedExactlyOneRow: true`.
- DB readback proved the same `planned_workouts` row id moved from `2026-06-18` to `2026-06-22`.
- Source date became empty and target date contained the moved workout.
- Target weekday was derived as `Monday`.
- Row count stayed `2`; the other workout remained unchanged.
- Title, identity, structure, and metric mode were preserved.
- The plan remained active.
- Metadata recorded latest move checksum, source date, and target date.
- No fake pace or fake personal HR appeared.
- Cleanup returned `workout_logs`, `planned_workouts`, `plan_cycles`,
  `runner_manual_workout_templates`, and `runner_profiles` to `0`; the disposable auth user was
  absent.
- Deterministic/source proof covered occupied target, non-manual plan, missing/foreign source,
  logged/evidence/protected source, past target, changed source/target, invalid token, stale
  checksum, client row payload rejection, persistence failure, and no fake pace/HR.

Historical next gate at backend closeout:

- FRONTEND Slice 6: Move Workout UI wiring over the accepted backend review/confirm seam.
- Frontend must not implement move as copy+delete, drag-only local state, client row mutation, or
  local schedule truth.

## Backend / Export Slice 7 Implementation Notes — 2026-06-12

Status:

Implemented / QA-passed / accepted.

Root cause:

Manual-plan export did not need a new manual export system. The canonical owner is the existing
active-plan export seam, but the JSON projection lacked explicit source-status/export metadata and
could expose internal persisted UUIDs as exported plan/workout identifiers. That made the export
less safe as a future Hito exchange artifact and left manual-plan compatibility unproved.

What changed:

- Reused `exportActivePlanForUser(...)`, `buildActivePlanExportPayload(...)`,
  `buildPlanExportDocument(...)`, JSON rendering, Markdown rendering, and the existing Open plan
  export route/menu.
- Added backend-owned source-status readback from persisted plan metadata into the active-plan
  export payload.
- Changed exported JSON `plan_id` and fallback `workout_id` values to safe Hito export identifiers
  instead of raw persisted Supabase UUIDs.
- Added additive `source_status` and `export_metadata` support to `training-plan-v2`, including
  export format version, exported timestamp, source kind/status, row counts, and privacy flags.
- Kept JSON export re-importable through the canonical `training-plan-v2` schema.
- Extended `scripts/validate-manual-workout-authoring.ts` with a deterministic manual active-plan
  export proof covering multi-workout manual plans, saved-template-shaped rows, copied-workout rows,
  deleted-row absence, row counts, structure-only executable segments, no fake pace/HR, no internal
  Supabase IDs, and Markdown readability without internal/debug source labels.

Validation evidence:

- `npm exec eslint -- src/lib/plan-export.ts src/lib/imported-plan.ts scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`

QA closeout:

- Browser/download validation passed against the existing Open plan export menu on a disposable
  persisted manual active plan, including JSON parse/readback, Markdown content proof, mobile
  no-overflow, cleanup, and source-boundary proof.
- ARCHITECT should separately decide the future public Hito plan exchange / QR share-import
  contract. This slice only hardens the existing authenticated active-plan export seam.

## Backend / Export Slice 7 Acceptance — 2026-06-12

Status:

QA-passed / accepted.

Context:

Backend / Export Slice 7 proved JSON/Markdown export for persisted manual active plans through the
existing active-plan export seam. This accepts authenticated manual-plan JSON/Markdown export in the
proved scope. It does not ship QR codes, public share links, import from export, applying someone
else's plan, PDF export, watch export, or mobile deep-link flow.

QA evidence:

- Built-in Codex Browser was used first.
- The canonical QA server was rebuilt/restarted on the same managed `:3000` server and ended
  `current` / `healthy`.
- Built-in Browser showed export UI but cannot capture downloads, so Playwright WebKit fallback
  captured real downloads.
- Safari and Chrome were not used.
- Targeted ESLint passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` passed.
- `npm run build` passed.
- Scoped `git diff --check` passed.
- Disposable persisted manual plan was created with three remaining workouts and one
  deleted/cleared workout.
- Browser UI showed saved plan -> `Open plan` -> `Export` -> `Export as JSON` /
  `Export as Markdown`.
- WebKit captured real files:
  - `manual-user-built-plan-2026-06-18.json`
  - `manual-user-built-plan-2026-06-18.md`
- JSON proof:
  - `schema_version: training-plan-v2`
  - `source_kind: manual_user_built_plan_v1`
  - `source_status: manual_user_built_plan_created`
  - safe export plan id, not raw persisted UUID
  - three workouts on `2026-06-18`, `2026-06-20`, and `2026-06-22`
  - workout ids are safe export ids, not raw persisted UUIDs
  - metric modes are `structure_only_executable`
  - pace/HR target allowed flags are false
  - internal DB ids, auth ids, and provider tokens are omitted
  - deleted workout row is absent
  - raw internal plan/workout/auth UUID matches are absent
- Markdown proof:
  - runner-readable title/source context is present
  - readable dates and workout titles are present
  - structure/execution summaries are present
  - deleted row is absent
  - fake pace is absent
  - fake personal HR is absent
  - private ids are absent
  - QR/share/import/PDF/watch claims are absent
- Source proof confirmed export reads persisted active plan through `/api/plan/export` ->
  `exportActivePlanForUser(...)`, not a frontend calendar snapshot.
- Mobile `375px` proof passed for Open Plan / Export menu with JSON and Markdown actions and no
  horizontal overflow.
- Cleanup returned both disposable users and all scoped DB rows to zero/absent.
- No product issues were found.

Acceptance decision:

- Accept Backend / Export Slice 7 as QA-passed.
- Record this as shipped user-facing history in
  [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md)
  because manual-plan JSON/Markdown export is now browser/download/DB-QA-passed.
- Do not claim QR codes, public share links, import from export, applying someone else's plan, PDF
  export, watch export, or mobile deep-link flow.
- This previous QR/share-import next-gate idea is superseded by Slice 8 Move Workout sequencing;
  QR/share-import remains future-only until a separate architecture contract is selected.

## Previous Backend / Export Slice 7 Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement Backend / Export Slice 7 for manual user-built plans: JSON/Markdown export compatibility
through the existing active-plan export seam.

Stage:
BACKEND implementation / manual active-plan export compatibility.

Context:
Manual user-built plans now support first create, adding workouts, personal saved templates,
existing-plan saved-template reuse, Copy/Paste, and Delete/Clear in the proved browser/DB scope.
The next functional completeness gate is export/share for persisted manual plans.

Root cause and architecture fit:
The visible missing behavior is manual-plan export confidence. The underlying owner is not a new
manual export UI or formatter; Hito already has canonical active-plan export through
`exportActivePlanForUser(...)`, `buildActivePlanExportPayload(...)`, `buildPlanExportDocument(...)`,
JSON, Markdown, and the existing `Open plan` export menu. Backend must prove manual plans preserve
manual source metadata, canonical workout rows, structure-only metric truth, and deleted-row absence
through that existing seam before any further UI claim.

Required preflight:
- Read `AGENTS.md`.
- Read `agents/backend.agent.md`.
- Load `skills/hito-backend-supabase-contract/SKILL.md`.
- Read the active manual plan and manual flow spec.
- Inspect existing export and manual seams before editing:
  - `src/lib/active-plan-export-actions.ts`
  - `src/lib/plan-export.ts`
  - `src/components/PlanManagementDialog.tsx`
  - `src/components/plan-management/PlanExportMenu.tsx`
  - `src/components/plan-management/PlanSummaryHeader.tsx`
  - `src/lib/manual-workout-authoring/*`
  - `src/lib/active-plan-persistence.ts`
  - `scripts/validate-manual-workout-authoring.ts`
  - `scripts/validate-plan-authoring-doctrine.ts`

Implementation scope:
- Prefer a proof/validation slice. If existing export already handles manual plans correctly, add
  only the smallest harness/source proof needed.
- Use the existing `exportActivePlanForUser(...)` and `buildActivePlanExportPayload(...)` path.
- Prove JSON export preserves `manual_user_built_plan_v1` source kind, plan id/title/date range,
  canonical workout rows, workout identities, segment anatomy, and `structure_only_executable`
  metric truth.
- Prove Markdown export renders readable manual workout summaries without internal/debug labels,
  raw floats, fake pace, or fake personal HR.
- Prove deleted/cleared workouts are absent from export and remaining row/non-rest counts match
  persisted active-plan truth.
- Prove saved-template/copied/manual-added workouts export from canonical persisted rows, not
  frontend state or template rows.
- Keep the existing export menu and authenticated server action model; add no new route-local export
  system.

What not to do:
- Do not add PDF export.
- Do not add watch/provider export.
- Do not add frontend export UI unless a tiny type/status widening is required by an existing seam.
- Do not add move workout, edit workout, recurrence, or Restore UI.
- Do not create a manual-specific export payload separate from canonical active-plan export.
- Do not mutate Supabase outside a guarded disposable validation path.
- Do not weaken metric-truth guardrails.

Validation:
- Targeted ESLint for changed backend/script files.
- Manual authoring validator if touched: `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- Export/doctrine validator if touched: `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`.
- `npm run build` if imports, public exports, or frontend-facing export types change.
- Scoped `git diff --check`.
- If live persistence/export proof is needed, use only the existing guarded disposable Supabase
  pattern and prove cleanup.
```

## Previous Frontend Slice 5 Handoff Prompt

```text
ROLE: FRONTEND

Task:
Implement Frontend Slice 5 for manual user-built plans: delete/clear UI wiring over the accepted
backend review-confirm seam.

Stage:
FRONTEND implementation / manual delete-clear interaction over backend truth.

Context:
Backend Slice 6 is QA-passed. It provides the accepted delete/clear primitive for existing
`manual_user_built_plan_v1` active plans:
- delete/clear review validates an eligible target workout and returns backend-shaped confirmation
  copy
- confirm delete/clear re-checks active plan lifecycle, target workout id/date, protection state,
  and review token/checksum exactness
- only one eligible planned workout row is removed
- active manual plan remains active and metadata/non-rest counts update
- logged/provider-evidence-backed, past/protected, non-manual, generated/imported/running-engine,
  stale-review, invalid-token, mismatched-target, client-payload, and last-workout delete cases are
  rejected
- restore affordance data is returned by backend, but Restore/Put back/Redo UI is not shipped yet

Root cause and architecture fit:
The visible missing behavior is that runners cannot delete a manually added workout from the manual
calendar UI. The underlying cause has now been fixed at the backend mutation boundary. Frontend
must only render the destructive interaction, call backend review/confirm, and re-read persisted
calendar truth after success. Do not implement local row deletion, local protection rules, local
schedule truth, or restore/undo behavior.

Required preflight:
- Read `AGENTS.md`.
- Read `agents/frontend.agent.md`.
- Load `skills/hito-frontend-design-system/SKILL.md`.
- Read the active manual plan and manual flow spec.
- Inspect existing calendar/manual authoring UI before editing:
  - `src/components/Calendar.tsx`
  - `src/components/ui/hito-calendar-day.tsx`
  - `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
  - `src/components/manual-workout/manual-workout-authoring-utils.ts`
  - `src/components/onboarding/ManualUserBuiltPlanPanel.tsx`
  - `src/lib/manual-workout-authoring/actions.ts`
  - `src/lib/training-api.ts`

Implementation scope:
- Add a Delete/Clear action only for eligible future manual active-plan workout days as shaped by
  existing calendar/manual plan state.
- Use existing Hito calendar/menu/dialog/sheet/button/status patterns; do not introduce a new
  calendar UI system.
- Call the backend delete/clear review action with minimal identifiers only.
- Render backend-shaped confirmation state: target date, workout title/identity, warning copy,
  protection/error state, and metric/source summary if provided.
- Confirm only by calling the accepted backend confirm delete/clear action with review
  token/checksum and minimal identifiers.
- Prevent duplicate clicks/loading races.
- After success, invalidate/reload canonical plan data so the calendar reflects persisted truth.
- Surface backend bounded errors for protected/logged/evidence-backed, past, last-workout,
  stale-review, invalid-token, and mismatched-target cases.

What not to do:
- Do not remove planned workout rows locally.
- Do not send client-side rows, segments, source metadata, duration totals, or metric truth.
- Do not ship Restore/Put back/Redo UI in this slice.
- Do not add recurrence.
- Do not add move workout behavior.
- Do not add edit workout behavior.
- Do not add JSON export.
- Do not mutate generated, preset, imported, or running-engine plans.
- Do not create frontend-owned schedule, metric, template, or persistence truth.
- Do not create a new calendar UI system.
- Do not weaken backend review/confirm boundaries.

Validation:
- Targeted ESLint for changed frontend/manual authoring files.
- Run `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- Run `npm run build`.
- Run scoped `git diff --check`.
- Browser QA readiness: existing manual active plan -> eligible future manual workout day ->
  Delete/Clear action -> backend review confirmation -> confirm -> persisted calendar removes that
  workout, active plan remains active, protected cases stay blocked, and mobile `375px` has no
  horizontal overflow.
```

## Frontend Slice 5 Build Blocker Fix — 2026-06-11

Status:

Fixed / QA-passed with Frontend Slice 5 acceptance below.

Root cause:

The Delete/Clear UI was not the build blocker. The failing source-of-truth boundary was the local
Nitro/TanStack build output lifecycle: client public assets and Nitro server output were generated
successfully, but late build cleanup left `.output/public` and `.output/server` missing while the QA
server status logic could still treat an old process as current.

What changed:

- Local clean now removes stale generated Vercel output and local build snapshots before a build.
- Vite captures the client `.output/public` asset snapshot and restores it before Nitro public-assets
  scanning, so hashed client assets, `favicon.svg`, and the training-plan template stay available.
- Nitro SSR service output cleanup is centralized under `prebuild`, avoiding service chunk deletion
  while Nitro consumes the SSR build.
- Local postbuild finalization stores stable finalized `server` and `public` output under
  gitignored `logs/build-output-finalized/` and exposes them through `.output/server` and
  `.output/public`, which keeps the canonical local server path stable.
- QA server status now requires the real build artifacts before reporting `current`.

Validation evidence:

- `npm exec eslint -- vite.config.ts scripts/clean-build-output.mjs scripts/finalize-build-output.mjs scripts/qa-local-server.mjs`
- `node --check scripts/clean-build-output.mjs`
- `node --check scripts/finalize-build-output.mjs`
- `node --check scripts/qa-local-server.mjs`
- `npm run build` passed repeatedly after the lifecycle fix.
- `node ./scripts/validate-build-output-integrity.mjs` passed with
  `mjsFiles=184` and `relativeMjsImports=2498`.
- `npm run qa:server:restart` started the canonical built QA server on `http://127.0.0.1:3000/`.
- `npm run qa:server:status` reports `current`, `healthy`, and `build: present`.
- `curl -I --max-time 10 http://127.0.0.1:3000/` returned `HTTP/1.1 200`.

Next gate:

Passed. Frontend Slice 5 Delete/Clear UI browser acceptance is recorded below.

## Frontend Slice 5 Delete/Clear UI Acceptance — 2026-06-12

Status:

QA-passed / accepted.

Context:

FRONTEND Slice 5 exposed the accepted Backend Slice 6 delete/clear review-confirm seam in the
saved manual active-plan calendar. This accepts Delete/Clear as a user-facing manual-plan
capability in the proved scope. Restore/Put back/Redo remains affordance copy/data only and is not
a shipped undo UI unless separately implemented and QA-passed.

QA evidence:

- Built-in Codex Browser was used first.
- The canonical QA server was rebuilt/restarted on the same managed `:3000` server and confirmed
  `current` / `healthy`.
- Safari and Chrome were not used.
- Targeted ESLint passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- `npm run build` passed.
- Scoped `git diff --check` passed.
- Disposable DB seed/readback/cleanup passed.
- Desktop real pointer interaction passed:
  - clicking `More activity actions for QA clear candidate strides` opened the menu
  - the menu showed `Copy workout` and `Clear workout`
  - the route stayed `/`
  - clicking the workout card outside the action button still navigated to
    `/workout/2026-06-21?tab=overview`
- Delete/Clear happy path passed:
  - `Clear workout` opened backend-shaped `Review clear workout`
  - review showed `Sun, Jun 21`, the workout title, planned-row-only warning, and restore
    affordance copy
  - confirm refreshed the saved calendar from persisted truth
  - the cleared day became `Sun, Jun 21. Add activity.`
  - the cleared day did not become fake Rest
  - the remaining workout stayed unchanged
- DB proof passed:
  - before delete, one active `manual_user_built_plan_v1` plan had two planned workouts
  - after delete, the same active plan had one planned workout
  - the deleted workout id/date was absent
  - `latestDeletedWorkout` metadata was present
  - row/non-rest counts updated to `1`
  - no fake pace or fake personal HR signals appeared
- Mobile `375px` regression passed:
  - occupied-day menu had no horizontal overflow
  - post-delete calendar had no horizontal overflow
  - delete/clear blocked dialog for the remaining last workout had no horizontal overflow
- Cleanup returned all disposable rows and auth/local user to zero/absent.

Tooling notes:

- Mobile screenshot capture timed out, but DOM and DB proof passed.
- One transient locator wait hit DOM detach during canonical refresh, but final state was confirmed.
- No product issues were found.

Acceptance decision:

- Accept FRONTEND Slice 5 as QA-passed.
- Record this as shipped user-facing history in
  [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md)
  because functional manual Delete/Clear is now browser-QA-passed with DB readback and cleanup.
- Do not claim Restore/Put back/Redo undo UI.
- Do not claim export, move, edit, recurrence, or final modal design polish.
- Select BACKEND / EXPORT Slice 7 as the next gate: manual active-plan JSON/Markdown export
  compatibility through the existing canonical active-plan export seam.

## Backend Slice 6 Implementation Notes — 2026-06-11

Status:

Implemented / QA-passed.

Root cause:

The missing runner behavior was “remove this manual workout day,” but the true owner is backend
mutation safety and canonical calendar readback, not frontend row hiding. Backend now owns
delete/clear review, exactness, revalidation, persistence, and restore affordance shaping.

What changed:

- Added `src/lib/manual-workout-authoring/delete-clear.ts` as the focused review/confirm owner for
  deleting exactly one eligible future manual planned workout from an existing
  `manual_user_built_plan_v1` active plan.
- Reused existing active-plan context, protected-day/evidence checks, manual draft review, and
  persisted manual row reconstruction instead of adding route-local or frontend-owned truth.
- Confirm rebuilds the delete target server-side, validates active plan id, target workout id/date,
  review token/checksum exactness, protected status, and active plan source before persistence.
- Persistence hard-deletes one `planned_workouts` row and updates manual plan metadata/readback
  counts. It does not create fake rest/generated placeholder rows.
- Deleting the last non-rest manual workout is intentionally blocked in this slice with
  `last_workout_not_deletable`, because empty persisted manual active plans are not yet an accepted
  product lifecycle state.
- Successful review/confirm returns a backend-shaped restore affordance:
  `Restore` with alternate labels `Put back` and `Redo`.
- Restore affordance is not a new mutation path. It contains a reconstructed `ManualWorkoutDraftInput`
  and reviewed manual draft, so frontend can later wire Restore through the existing Add activity
  review/confirm seam without cloning raw rows.
- Extracted a shared browser-safe manual review checksum helper in
  `src/lib/manual-workout-authoring/review-exactness.ts` so delete/clear does not import
  `node:crypto` into client-visible bundles and existing manual review exactness stays canonical.
- Exported delete/clear actions and result types through `src/lib/manual-workout-authoring/index.ts`
  and `src/lib/training-api.ts` as the existing thin facade seams.

Deterministic harness coverage:

- Happy-path delete/clear review and confirm.
- Exact one-row deletion through fake persistence.
- Metadata/readback count proof via returned row counts.
- `Restore` / `Put back` / `Redo` affordance with reviewed manual draft.
- Changed target, invalid token, stale checksum, and client-sent row payload rejections.
- Missing active plan, non-manual active plan, missing target, foreign target, unsupported target,
  logged target, evidence-backed target, protected past target, last-workout, and persistence failure
  rejections.
- No fake pace or fake personal HR in restore review.

Validation run by Backend:

- `npm exec eslint -- src/lib/manual-workout-authoring/actions.ts src/lib/manual-workout-authoring/active-plan-add.ts src/lib/manual-workout-authoring/copy-paste.ts src/lib/manual-workout-authoring/copy-paste-reconstruction.ts src/lib/manual-workout-authoring/delete-clear.ts src/lib/manual-workout-authoring/persistence.ts src/lib/manual-workout-authoring/review-exactness.ts src/lib/manual-workout-authoring/saved-templates.ts src/lib/manual-workout-authoring/schema.ts src/lib/manual-workout-authoring/index.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts scripts/manual-workout-authoring/persistence-proof.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence`
  blocked before mutation because no disposable Supabase env was configured.
- `node --env-file=.env.local --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence`
  blocked remote Supabase mutation for `dltfjwexyctmihclcjqj` without explicit disposable override.
- `npm run build`

QA closeout:

Backend source/harness validation and guarded remote-disposable persistence proof passed. The next
gate is frontend wiring, not another backend validation pass.

## Backend Slice 6 Delete/Clear Acceptance — 2026-06-11

Status:

QA-passed / accepted.

Context:

Backend Slice 6 implemented the delete/clear primitive behind a backend-owned review-confirm
boundary. This accepts the backend primitive only. Runner-facing Delete/Clear UI is not shipped yet.
Restore/Put back/Redo is backend-shaped affordance data, not a shipped undo UI.

QA evidence:

- Browser was not used because this was backend/source/CLI/Supabase validation only.
- Targeted ESLint passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- `--require-persistence` without override blocked remote mutation before writes.
- Guarded remote override validator passed and cleaned up.
- QA-only live delete/clear proof passed.
- `npm run build` passed.
- Scoped `git diff --check` passed.
- Live disposable proof against approved project `dltfjwexyctmihclcjqj` created a manual plan with
  two planned workouts.
- Delete/clear removed exactly one workout on `2026-06-21`.
- DB readback after delete showed exactly one remaining planned workout on `2026-06-18`.
- Active manual plan remained active.
- Manual metadata row/non-rest counts updated to `1`.
- Invalid token, stale checksum, mismatched target, client payload, and last-workout delete were
  rejected.
- Source/deterministic proof covered non-manual active plans, protected/logged/evidence/past
  targets, generated/imported/running-engine guards, and strict client payload rejection.
- Restore affordance returned `Restore`, `Put back`, `Redo`, reviewed draft data, and
  `trustedClientRows: false`.
- Cleanup returned `workout_logs`, `planned_workouts`, `plan_cycles`,
  `runner_manual_workout_templates`, `runner_profiles`, and auth user to zero/absent.

Acceptance decision:

- Accept Backend Slice 6 as QA-passed.
- Do not update [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md)
  yet because this is backend-only acceptance; runner-facing Delete/Clear UI is not shipped.
- Select FRONTEND Slice 5 as the next manual-builder gate: Delete/Clear UI wiring over the accepted
  backend seam.

## Frontend Slice 4 Implementation Notes

- Wired occupied manual active-plan workout days to an existing Hito DS dropdown more-action with
  `Copy workout`.
- The copy buffer stores only minimal UI source selection: active plan id, source workout id, source
  workout date, and title.
- Wired eligible future empty manual active-plan days to show `Paste copied workout` inside the
  existing `Add activity` menu when the copied source belongs to the same active plan.
- Paste review calls the accepted backend copy/paste review seam with only active plan id, source
  workout id, and target `YYYY-MM-DD`.
- Paste confirm calls the accepted backend confirm seam with only active plan id, source workout id,
  target date, review token, and review checksum.
- Paste review renders backend-shaped source/target dates, workout title/template, structure, metric
  policy, review bullets, warnings, and bounded backend errors.
- Calendar refresh still uses route invalidation so the pasted workout appears from canonical
  persisted plan truth.
- No recurrence, move, edit, delete/clear, JSON export, generated/preset/imported mutation, or
  frontend-owned row duplication was added.

## Frontend Slice 4 Copy/Paste UI Acceptance — 2026-06-11

Status:

QA-passed / accepted.

Context:

FRONTEND Slice 4 exposed the accepted Backend Slice 5 copy/paste review-confirm seam in the saved
manual active-plan calendar. This accepts functional Copy/Paste UI wiring; deeper desktop/mobile
manual workout modal design polish remains a later dedicated pass after functional flows are
complete.

QA evidence:

- Canonical built QA server on `:3000` was healthy and reused.
- Non-Chrome Playwright WebKit was used outside the repo.
- One disposable user was used and fully cleaned up.
- Desktop real hover changed the source Copy trigger from hidden/non-interactive to
  visible/interactable.
- Real click opened `Copy workout`.
- Before copy, the empty target menu had no `Paste copied workout`.
- After copy, the empty target menu showed `Paste copied workout`.
- Paste opened backend-shaped `Review paste` with source date, target date, structure summary,
  metric policy, and bounded confirm copy.
- Desktop confirm persisted the paste.
- DB readback showed one active `manual_user_built_plan_v1` plan and two planned workouts.
- Mobile `375px` proof passed for copied state/source action, target Add/Paste menu, and paste
  review modal with no horizontal overflow.
- Cleanup returned templates, logs, workouts, plan cycle, runner profile, auth user, and local
  account to zero/absent.
- No product issues were found.
- Coverage gaps: none for the requested rerun scope.

Acceptance decision:

- Accept FRONTEND Slice 4 as QA-passed.
- Record this as shipped user-facing history in
  [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md)
  because functional calendar Copy/Paste is now browser-QA-passed.
- Do not claim final manual workout modal design polish.
- Backend Slice 6 later closed the next backend-owned delete/clear boundary; see the acceptance
  section above.

## Frontend Slice 4 Implementation Handoff Prompt (Historical)

```text
ROLE: FRONTEND

Task:
Implement Frontend Slice 4 for manual user-built plans: copy/paste UI wiring over the accepted
backend review-confirm seam.

Stage:
FRONTEND implementation / manual copy-paste interaction over backend truth.

Context:
Backend Slice 5 is QA-passed. It provides the accepted copy/paste primitive for existing
`manual_user_built_plan_v1` active plans:
- copy review reconstructs a backend-reviewed draft from a persisted source workout
- confirm paste rebuilds server-side, validates review token/checksum exactness, verifies source
  workout and target date, and persists through the existing manual active-plan add seam
- client-sent rows, segments, source metadata, metric truth, and raw copied payloads are rejected
- live disposable proof passed for canonical persisted `easy_run_with_strides`

Root cause and architecture fit:
The visible missing behavior is that runners still cannot use Copy/Paste from the calendar UI. The
underlying cause is not a missing local row duplication helper; it was the need for a backend-owned
review-confirm copy boundary, which is now accepted. Frontend must render interaction and call the
backend seam only. Do not create frontend-owned copy state, schedule truth, metric truth, or
persistence truth.

Required preflight:
- Read `AGENTS.md`.
- Read `agents/frontend.agent.md`.
- Load `skills/hito-frontend-design-system/SKILL.md`.
- Read the active manual plan and manual flow spec.
- Inspect existing calendar/manual authoring UI before editing:
  - `src/components/Calendar.tsx`
  - `src/components/ui/hito-calendar-day.tsx`
  - `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
  - `src/components/manual-workout/manual-workout-authoring-utils.ts`
  - `src/components/onboarding/ManualUserBuiltPlanPanel.tsx`
  - `src/lib/manual-workout-authoring/actions.ts`
  - `src/lib/training-api.ts`

Implementation scope:
- Add a Copy action only for eligible existing manual active-plan workout days.
- Add a Paste flow only for eligible future empty manual active-plan days.
- Use existing Hito calendar/menu/dialog/sheet/button/status patterns; do not introduce a new
  calendar UI system.
- Call the backend copy review action for selected source workout and target `YYYY-MM-DD`.
- Render backend-shaped review state, including source date, target date, workout identity,
  structure, metric policy, and bounded errors.
- Confirm paste only by calling the accepted backend confirm/paste action with review token/checksum
  and minimal identifiers.
- Prevent duplicate clicks/loading races.
- After success, invalidate/reload canonical plan data so the calendar reflects persisted truth.
- Preserve date-only display correctness: use shared date helpers and never derive mutation targets
  from localized labels.

What not to do:
- Do not copy planned workout rows in the browser.
- Do not send client-side rows, segments, duration totals, source metadata, or metric truth.
- Do not add recurrence.
- Do not add move workout behavior.
- Do not add JSON export.
- Do not add edit/delete/clear behavior.
- Do not mutate generated, preset, imported, or running-engine plans.
- Do not add frontend-owned templates or copy buffers beyond minimal UI selection state.
- Do not weaken no fake pace / no fake personal HR boundaries.

Validation:
- Targeted ESLint for changed frontend/manual authoring files.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- `npm run build`.
- Scoped `git diff --check`.
- Browser QA readiness: the UI should support manual active plan -> existing workout Copy -> future
  empty day Paste -> backend review -> confirm paste -> persisted calendar update, with mobile
  `375px` no-overflow.
```

## Backend Slice 5 Implementation Notes

- Added `src/lib/manual-workout-authoring/copy-paste.ts` as the focused review/confirm
  orchestrator for manual copy/paste.
- Added `src/lib/manual-workout-authoring/copy-paste-reconstruction.ts` as the focused owner for
  source-workout eligibility and persisted-row-to-manual-draft reconstruction.
- Review reconstructs a `ManualWorkoutDraftInput` server-side from a persisted manual
  `planned_workouts` row, then passes it through the existing manual review owner.
- Confirm rebuilds the same copy draft server-side, validates review token/checksum exactness, and
  persists by reusing the existing manual active-plan add seam.
- The contract accepts only active plan/source workout/date/target date plus review exactness
  fields; strict schemas reject client-sent row/segment payloads.
- Supported source rows must come from `manual_user_built_plan_v1`, belong to the current runner's
  active manual plan, use a supported manual template key, and include executable segment structure.
- Date-only truth is preserved: target date and weekday are derived from the requested target date,
  not copied from the source row.
- Deterministic harness coverage now proves happy path copy review/confirm, source date reference,
  changed target rejection, changed source rejection, stale token/checksum rejection, occupied
  target rejection, non-manual active plan rejection, foreign source rejection, client payload
  rejection, no fake pace/HR, and repeat-with-recovery anatomy preservation.
- Backend blocker fix on 2026-06-11: live QA found that a normally persisted
  `easy_run_with_strides` source row failed copy review with `unsafe_block_structure` because the
  canonical persisted repeat parent stores `segment_type: "strides"` / `type: "intervals"`, while
  the nested work block stores only `type: "work"`. Copy reconstruction now resolves that
  persisted template/work shape back to `strides_block`, and the deterministic harness now builds
  the copy source row through the canonical TrainingPlanV2/import/persist path instead of a
  synthetic review-shaped row.
- Validation run on 2026-06-11:
  - `npm exec eslint -- src/lib/manual-workout-authoring/actions.ts src/lib/manual-workout-authoring/active-plan-add.ts src/lib/manual-workout-authoring/copy-paste.ts src/lib/manual-workout-authoring/copy-paste-reconstruction.ts src/lib/manual-workout-authoring/persistence.ts src/lib/manual-workout-authoring/saved-templates.ts src/lib/manual-workout-authoring/schema.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts scripts/manual-workout-authoring/persistence-proof.ts`
  - `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
  - `node --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence`
    blocked before mutation because no disposable/local Supabase env was configured.
  - `npm run build`
  - Blocker-fix validation also ran:
    `npm exec eslint -- src/lib/manual-workout-authoring/copy-paste-reconstruction.ts scripts/validate-manual-workout-authoring.ts`

## Backend Slice 5 Copy/Paste Acceptance — 2026-06-11

Status:

QA-passed / accepted.

Context:

Backend Slice 5 implemented the manual copy/paste primitive behind a backend-owned review-confirm
boundary. QA rerun passed after the canonical persisted `easy_run_with_strides` reconstruction fix.
This accepted the backend primitive only at that checkpoint; runner-facing calendar Copy/Paste UI
was later accepted in FRONTEND Slice 4 above.

QA evidence:

- Browser was not used because this was backend/source/CLI/Supabase disposable persistence
  validation.
- Targeted ESLint passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- `--require-persistence` without override blocked before remote mutation.
- Guarded remote-disposable persistence harness passed and cleaned up.
- QA-only live `easy_run_with_strides` copy/paste proof passed.
- `npm run build` passed.
- Scoped `git diff --check` passed.

Live proof:

- One disposable `manual_user_built_plan_v1` active plan was created through canonical
  `confirmManualWorkoutDraftForUser`.
- Source workout was canonical persisted `easy_run_with_strides` on `2026-06-18`.
- Copy review to `2026-06-19` returned `draft_ready`, `persisted: false`,
  `reconstructedFromPersistedWorkout: true`, and `trustedClientRows: false`.
- Reconstruction mapped nested repeat work as `strides_block`.
- Confirm paste succeeded with `serverRebuiltReview: true`, `sourceWorkoutVerified: true`, and
  `reconstructedFromPersistedWorkout: true`.
- DB readback showed exactly one active manual plan and exactly two planned workouts:
  source `2026-06-18`, Thursday, `easy_run_with_strides`; pasted `2026-06-19`, Friday,
  `easy_run_with_strides`.
- Both rows preserved canonical persisted strides repeat anatomy.
- Both rows remained `structure_only_executable`, with no pace targets and no HR targets.
- No fake pace or fake personal HR appeared.
- Negative live checks passed for changed target, invalid token, stale checksum, client row payload,
  and occupied target.
- Deterministic harness covers changed source, non-manual active plan, foreign source workout, and
  unsupported source payload.
- Cleanup returned scoped rows and auth user to zero/absent.
- Artifact:
  [copy-paste-strides-live-proof.json](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/qa-artifacts/manual-workout-copy-paste-slice5-rerun-qa/copy-paste-strides-live-proof.json).

Acceptance decision:

- Accept Backend Slice 5 as QA-passed.
- Do not update [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md)
  at this backend-only checkpoint; the later FRONTEND Slice 4 browser pass is the user-facing
  changelog gate.
- Select FRONTEND Slice 4 as the next manual-builder gate: calendar Copy/Paste UI wiring over the
  accepted backend seam.

## Previous Backend Slice 5 Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement Backend Slice 5 for manual user-built plans: copy/paste draft reconstruction and reviewed
paste confirm for existing manual active plans.

Stage:
BACKEND implementation / manual copy-paste review-confirm boundary.

Context:
Manual user-built plans can now create the first workout, add more workouts to eligible future empty
days, save reviewed workouts as personal templates, and reuse those templates in the existing
manual active-plan Add lifecycle. QA Slice 3B passed browser + DB proof for saved-template reuse
inside an existing `manual_user_built_plan_v1` active plan.

The next missing manual-builder reuse primitive is copy/paste. Do not solve this by duplicating
calendar rows in the frontend. Backend must reconstruct a reviewed draft from the persisted source
workout and confirm the paste through the canonical manual active-plan add boundary.

Required preflight:
- Read `AGENTS.md`.
- Read `agents/backend.agent.md`.
- Load `skills/hito-backend-supabase-contract/SKILL.md`.
- Read the active manual plan and the manual flow spec.
- Inspect existing manual seams before adding anything new:
  - `src/lib/manual-workout-authoring/active-plan-add.ts`
  - `src/lib/manual-workout-authoring/actions.ts`
  - `src/lib/manual-workout-authoring/persistence.ts`
  - `src/lib/manual-workout-authoring/saved-templates.ts`
  - `src/lib/active-plan-persistence.ts`
  - `src/lib/training-api.ts`
  - `scripts/validate-manual-workout-authoring.ts`

Implementation scope:
- Add a backend-owned copy review function for existing manual active plans.
- Accept only minimal identifiers/input from the client: active plan id if needed, source workout
  day/id, target `YYYY-MM-DD` date, and any existing review exactness fields required by the seam.
- Rebuild the draft server-side from the persisted source workout/manual authoring truth.
- Do not trust client-sent workout rows, segments, source metadata, duration totals, or metric truth.
- Return backend-shaped review state with source date, target date, display labels, review token,
  review checksum, conflict/protection state, and metric policy.
- Add a confirm/paste function that validates token/checksum exactness, active plan lifecycle,
  source workout still exists on the same manual active plan, target date is still eligible and
  empty, and protected/logged/provider-evidence constraints still pass.
- Persist the pasted workout by reusing the existing manual active-plan add seam wherever possible.
- Preserve strict `structure_only_executable` / metric-truth behavior. No fake pace and no fake
  personal HR.
- Preserve date-only truth: canonical date identity is `YYYY-MM-DD`; do not derive mutation targets
  from localized labels.

Required rejections:
- non-manual active plan
- missing or stale source workout
- target date occupied
- changed target date after review
- changed source workout after review
- stale checksum/token
- client-sent row/segment payload attempts
- protected/logged/provider-evidence target day if the existing safety model blocks it

What not to do:
- Do not implement frontend copy/paste UI.
- Do not add recurrence.
- Do not add move workout behavior.
- Do not add JSON export.
- Do not save personal templates in this slice.
- Do not mutate generated, preset, imported, or running-engine plans.
- Do not run migrations unless a hard blocker is discovered and routed back to Architecture first.
- Do not weaken backend review/confirm boundaries.

Validation:
- Extend the manual workout authoring harness for copy review and confirm/paste.
- Prove happy path paste into one eligible future empty day.
- Prove occupied-day, stale-review, changed-source, changed-target, invalid-token/checksum, and
  client-sent row attempts are rejected.
- Prove source metadata, date-only target truth, workout identity, segment anatomy, and metric truth
  are preserved.
- Prove no fake pace or fake personal HR.
- Run targeted ESLint for changed backend/script files.
- Run `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- Run `npm run build` if imports or public exports change.
- Run scoped `git diff --check`.
```

## Previous Frontend Slice 3 Handoff Prompt

```text
ROLE: FRONTEND

1. Task

Implement manual saved-template UI wiring for reviewed manual workouts and the Add activity picker.

2. Stage

FRONTEND implementation / manual saved-template modal and picker wiring.

3. Context

Backend Slice 4 implemented and QA accepted personal saved-template persistence/readback:
- `saveManualWorkoutSavedTemplate(...)`
- `listManualWorkoutSavedTemplates(...)`
- `reviewManualWorkoutSavedTemplate(...)`

The shared workout target display grammar cleanup also passed saved active-plan browser QA, so the
previous blocker for user-facing saved-template UI is closed.

Root cause:
Runners can build manual workouts, but they cannot yet reuse a reviewed manual workout as a
personal template through the UI. Do not solve this with frontend-local template state. The UI must
call the backend-owned saved-template actions and keep review-before-confirm/add intact.

4. Required preflight

- Read AGENTS.md.
- Read agents/frontend.agent.md.
- Load skills/hito-frontend-design-system/SKILL.md.
- Inspect the existing manual builder UI and Hito DS primitives before editing.
- Reuse the existing manual authoring dialogs, template picker, calendar day anatomy, buttons,
  fields, menus, toasts, and status patterns.

5. Files To Inspect

- AGENTS.md
- agents/frontend.agent.md
- skills/hito-frontend-design-system/SKILL.md
- docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
- docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md
- docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md
- src/components/manual-workout/ManualWorkoutAuthoringControls.tsx
- src/components/onboarding/ManualUserBuiltPlanPanel.tsx
- src/components/Calendar.tsx
- src/components/ui/hito-calendar-day.tsx
- src/lib/manual-workout-authoring/saved-templates.ts
- src/lib/manual-workout-authoring/saved-template-repository.ts
- src/lib/manual-workout-authoring/actions.ts
- src/lib/training-api.ts

6. Implementation Scope

- Expose `Save as template` only from a reviewed manual workout state.
- Collect runner-provided display name and icon/glyph using existing Hito DS form/dialog patterns.
- Call `saveManualWorkoutSavedTemplate(...)` with only `displayName`, `iconKey`, `draftInput`,
  `reviewToken`, and `reviewChecksum`.
- Prevent duplicate save clicks/loading races and show bounded backend errors.
- Load current-user templates through `listManualWorkoutSavedTemplates(...)`.
- Add current-user saved templates to the existing `Add activity` / template picker without
  replacing Hito-owned built-in templates.
- Clearly distinguish personal templates from built-in Hito templates without creating a separate
  gallery system.
- Selecting a personal template must call `reviewManualWorkoutSavedTemplate(...)` for the chosen
  future date and then render the existing backend-shaped review state.
- Confirming/adding from a saved template must still use the existing manual review/confirm or
  active-plan add path; do not skip review.
- Preserve shared workout target display grammar.

7. What not to do

- Do not create frontend-owned template persistence.
- Do not store raw planned workout rows as templates.
- Do not skip backend review before confirm/add.
- Do not add copy/paste persistence.
- Do not add recurrence.
- Do not add JSON export.
- Do not add move-workout behavior.
- Do not mutate generated, preset, imported, or running-engine plans.
- Do not add a new calendar/add UI system.
- Do not weaken metric-truth guardrails.
- Do not add fake pace or fake personal HR.
- Do not run migrations.

8. Validation

- targeted ESLint for changed frontend/manual authoring files
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `npm run build`
- `git diff --check -- <changed files>`
- Built-in Codex Browser first:
  - save a reviewed manual workout as a personal template with display name and icon/glyph
  - see that template in the existing Add activity/template picker
  - select it for a future date
  - prove backend reconstruction/review runs before confirm/add
  - prove no frontend-owned template rows or fake saved state
  - prove mobile `375px` has no horizontal overflow

9. Stop Conditions

Stop and report if the backend saved-template actions are not callable from the current client
surface, if saved templates cannot be scoped to the current user, or if the UI would need to invent
template truth locally.
```

## Previous Backend Slice 2 Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement Backend Slice 2 for manual user-built plans: confirm/persist the first reviewed manual
workout and create a `manual_user_built_plan_v1` active plan through canonical persistence.

Stage:
BACKEND implementation / manual user-built plan confirm-persist boundary.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md

Designer spec:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md

Running Coach source of truth:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md

Backlog source:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md

Context:
DESIGNER completed and Architect accepted the manual draft-first UX spec for `Build my plan
myself`. Backend Slice 1 is implemented and accepted for sequencing as a non-mutating
manual workout review contract with backend-owned templates, validation, normalization,
review token/checksum, and deterministic harness coverage.

Root cause:
Hito has generated, preset, import, and refresh plan paths, but no canonical user-built
plan lifecycle. Do not solve this as a frontend calendar save button. The next backend
slice must define the mutation boundary that turns one reviewed manual workout into the
first active `manual_user_built_plan_v1` plan through an existing canonical persistence seam.

Required preflight:
1. Read AGENTS.md.
2. Read agents/backend.agent.md.
3. Load matching project skills, especially hito-backend-supabase-contract.
4. Read the plan, Designer spec, backlog source, and Running Coach source artifact above.
5. Inspect existing seams before adding code:
   - src/lib/manual-workout-authoring/*
   - scripts/validate-manual-workout-authoring.ts
   - src/lib/active-plan-persistence.ts
   - src/lib/persisted-plan-replacement.ts
   - src/lib/imported-plan.ts
   - src/lib/training-api.ts
   - src/lib/plan-preset-actions.ts
   - src/lib/running-plan-engine-actions.ts

Implement:
1. A focused confirm action, likely `confirmManualWorkoutDraft(...)`, owned by the
   manual-workout-authoring backend module.
2. Server-side rebuild and exactness verification:
   - accept only the structured draft input/context needed to rebuild the draft, plus
     `reviewToken` and `reviewChecksum`
   - call/reuse `reviewManualWorkoutDraft(...)` server-side
   - require `draft_ready`
   - reject changed date/setup/template/entries, invalid token, stale checksum, protected
     target date, and active-plan conflicts
   - never trust client-sent canonical rows or client-sent persisted workout payloads
3. Canonical persistence:
   - map the reviewed manual draft into canonical `training-plan-v2` / imported-plan seed shape
   - call the existing canonical active-plan persistence seam, preferably
     `createFirstPlanFromReviewedCanonicalPlanForUser(...)`, instead of creating a second
     plan persistence path
   - create `manual_user_built_plan_v1` only after at least one valid reviewed workout exists
   - never persist an empty active plan silently
4. Source metadata:
   - plan source kind: `manual_user_built_plan_v1`
   - workout authoring source metadata: `manual_workout_authoring_v1`
   - source status for confirmed manual creation, template key/version, workout date, row count,
     review payload version, review checksum, mapping gaps, metric truth mode, and warnings
     where useful
5. Lifecycle/error policy:
   - if an active plan already exists, return a bounded `active_plan_exists`-style result and
     do not replace it
   - preserve canonical persistence rollback behavior on insert failures or row-count mismatch
   - return UI-consumable bounded errors for invalid review, protected date, unsupported template,
     active-plan conflict, and persistence failure
6. Public API:
   - add only thin exports/server-action wrappers where needed
   - do not make `training-api.ts` the implementation owner

What not to do:
- Do not write to Supabase outside the explicit reviewed confirm/persist path owned by this slice.
- Do not run unscoped live/remote mutation proof without a disposable target, explicit flags, and
  cleanup requirements.
- Do not add DB schema unless source audit proves existing plan/workout metadata columns cannot
  safely carry the reviewed canonical truth.
- Do not persist an empty active plan.
- Do not edit frontend.
- Do not add recurrence.
- Do not implement copy/paste persistence.
- Do not implement save-as-template persistence.
- Do not mutate generated, preset, imported, or running-engine plans.
- Do not edit generated/preset plan content.
- Do not call OpenAI.
- Do not revive old Plan Preset confirm behavior.

Validation:
- Run targeted TypeScript/ESLint for changed backend/script files.
- Run `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- Add and run a confirm/persist harness proving token/checksum exactness, server-side rebuild,
  active-plan conflict rejection, protected-date rejection, no client-sent row trust, bounded
  persistence errors, and source metadata preservation.
- If a disposable/local Supabase target is available, run a scoped mutation proof with cleanup.
  If not, report the live persistence proof as a QA/environment gap; do not hide it.
- Run `git diff --check -- <changed files>`.

```

## Owner

ARCHITECT / BACKEND / FRONTEND / RUNNING COACH / QA

## Last Updated

2026-06-13

## Manual Date-Only And Weekday Contract

Date: 2026-06-11

Status:

accepted as the current manual calendar source-of-truth rule before the next Frontend fix.

Root cause:

- Visible symptom: QA proved the original off-by-one label bug is fixed in the calendar, Add menu,
  constructor, review-ready state, persistence, and mobile layout, but the final Add confirmation
  modal is still date-neutral.
- Underlying cause: manual calendar actions need one date-only contract before Hito adds move,
  copy/paste, saved-template, and export flows. If each modal formats or infers dates locally, the
  product can persist the right day while showing the wrong weekday, which is worse than a simple UI
  typo.
- Canonical owner: shared manual/calendar rendering view model for runner-facing date labels,
  backed by backend review/persistence truth for mutation targets.

Contract:

- Canonical calendar day identity is always a date-only `YYYY-MM-DD` string.
- `workoutDate` / `workout_date` is the mutation and persistence key.
- Weekday is derived evidence from the canonical date, not independent truth and not a mutation
  target.
- Frontend must not parse bare `YYYY-MM-DD` through timezone-sensitive `new Date(iso)` or UTC
  instant logic for runner-facing day labels.
- Frontend must use the existing shared Hito/manual date-only helper for runner-facing labels.
- Backend remains the owner of persisted target date, review exactness, occupied/protected/logged
  day validation, and source metadata.
- Frontend must render the selected date in every risky confirmation where the runner can commit a
  calendar mutation.
- Mutation payloads must continue to send only backend-allowed data. They must not send localized
  display labels, client rows, segments, or persistence metadata.

Why this matters for later:

- Future move-workout flows must carry source date, target date, derived weekday labels, and a
  backend review/confirm boundary.
- Copy/paste must regenerate target-date-specific review truth instead of duplicating raw rows.
- JSON export must read canonical active-plan/workout truth, not frontend display labels.

Immediate decision:

- Do not route a broad ARCHITECT slice before the next testable fix.
- FRONTEND Slice 2A should make the final manual Add confirmation modal repeat the selected
  date/weekday using the accepted date-only helper and existing Hito DS dialog pattern.
- QA should rerun the focused browser add flow after this fix, including the persistent local server,
  disposable cleanup, and `375px` no-overflow proof.

## Frontend Slice 2A Date Confirmation Result

Date: 2026-06-11

Status:

implemented / QA-passed / accepted as the manual Add date-only display gate.

What changed:

- `ManualReviewSummary` now renders the reviewed workout date before the final confirm action.
- The visible date label uses `formatReadableDate(review.draft.workoutDate)`.
- The UI also shows `review.draft.weekday` as display evidence.
- Mutation truth remains the ISO `workoutDate`.
- Confirm payload remains unchanged:
  `activePlanId`, `draftInput`, `reviewToken`, and `reviewChecksum` only.

Preserved:

- no backend changes
- no schema changes
- no persistence semantics changes
- no copy/paste
- no recurrence
- no save-as-template
- no JSON export
- no new calendar/Add control pattern

Frontend validation evidence:

- Targeted ESLint passed for manual Add/control/date-helper/training surfaces.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- `npm run build` passed with existing non-blocking warnings.
- Scoped `git diff --check` passed.

QA acceptance evidence:

- Built-in Codex Browser proved one selected date across the full Add path:
  `Sun, Jun 14` in the saved calendar action, Add menu, constructor/dialog, and final
  `Review add` modal.
- Final confirmation also showed `Sunday` and `Selected calendar day for this reviewed workout.`
- No stale `Sat, Jun 13` label appeared in the selected Add/review confirmation context.
- Persisted readback proved the added workout on `2026-06-14` with weekday `Sunday`, plan source
  `manual_user_built_plan_v1`, and workout metadata `manual_workout_authoring_v1`.
- Source inspection proved the Add payload still sends only `activePlanId`, `draftInput`,
  `reviewToken`, and `reviewChecksum`.
- Disposable cleanup returned auth user and Supabase rows to zero/absent.
- Mobile `375px` proof passed with no horizontal overflow.

Acceptance decision:

- Accept FRONTEND Slice 2A and the user-facing post-create manual Add flow as QA-passed.
- Manual user-built plans can now be created from the no-active-plan path and expanded with
  additional reviewed workouts on eligible future empty days.
- This is shipped-history material.

## Unified Plan Creation Lifecycle Direction

Date: 2026-06-11

Product brief:

[Unified Plan Creation Lifecycle](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md>)

Decision:

- Manual planning and AI planning should converge into one active-plan calendar lifecycle.
- `Build my plan myself` is not a separate product silo. It is one authorship mode for adding
  reviewed plan truth into the same active plan surface.
- A runner may manually create the first days or weeks, then later ask Hito to continue with an
  AI/generated reviewed block.
- Future `Continue with Hito` or `Add plan block` should add reviewed future workouts after the
  already-authored range, not replace manual days or silently overwrite occupied/protected dates.
- Coach/organization-authored plans should fit the same model later: different source, same reviewed
  active-plan calendar lifecycle.

Current scope boundary:

- This direction is documented so the team does not lose the larger product model.
- It does not change the immediate implementation gate.
- FRONTEND Slice 2A has implemented the date confirmation repair.
- Focused QA browser validation remains next before the current manual builder Add flow can be
  accepted.
- AI continuation blocks, personal saved templates, copy/paste, move-workout, and JSON export remain
  later slices.

## Backend Manual Confirm Harness Guardrail Result

Status:

implemented / QA-passed / accepted for manual Slice 2B closeout.

Root cause closed in this slice:

- Visible symptom: QA could not safely run live manual confirm/persist proof.
- Underlying cause: `scripts/validate-manual-workout-authoring.ts` had deterministic fake
  persistence checks but no canonical safe-target policy for real Supabase mutation.
- Canonical owner: backend validation tooling, reusing the accepted R8 confirm-harness safety
  pattern.

What changed:

- Default manual authoring validator remains non-mutating.
- Added `--require-persistence`.
- Remote Supabase mutation is blocked by default.
- Loopback Supabase URLs are treated as local disposable persistence targets.
- Remote disposable mutation requires:
  - `--allow-remote-disposable-supabase-mutation`
  - `HITO_MANUAL_WORKOUT_CONFIRM_ALLOW_REMOTE_MUTATION=I_UNDERSTAND_THIS_MUTATES_REMOTE_DISPOSABLE_SUPABASE`
  - project ref `dltfjwexyctmihclcjqj`
- Added manual-workout-specific disposable auth user email/metadata for validation runs.
- Added schema-aware cleanup/readback proof for `workout_logs`, `planned_workouts`,
  `plan_cycles`, `runner_profiles`, and auth-user deletion.
- Kept product runtime persistence semantics unchanged.

Backend validation evidence:

- `npm exec eslint -- scripts/validate-manual-workout-authoring.ts scripts/manual-workout-authoring/persistence-proof.ts src/lib/manual-workout-authoring/*.ts src/lib/training-api.ts` passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed with
  `mode: not_requested`, proving the default remains non-mutating.
- `node --env-file=.env.local --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence` failed fast before mutation with remote target
  `https://dltfjwexyctmihclcjqj.supabase.co` and explicit override instructions.

QA disposable persistence proof:

- Default harness remained non-mutating with `mode: not_requested`.
- `--require-persistence` without override blocked before mutation against
  `https://dltfjwexyctmihclcjqj.supabase.co` with `remote_supabase_blocked`.
- Guarded override run passed against approved project `dltfjwexyctmihclcjqj`.
- Disposable run id: `manual-workout-confirm-1781137125035-8a14cfa46e52e`.
- Persisted proof: `rows: 1`, `sourceKind: manual_user_built_plan_v1`,
  `sourceStatus: manual_user_built_plan_created`.
- Review checksum readback:
  `854bb20a888a072e09f23fc86674ee1af8aa070cd3227df6fb1279c551949d0a`.
- Cleanup proof: `workoutLogsRemaining: 0`, `planCyclesRemaining: 0`,
  `plannedWorkoutsRemaining: 0`, `runnerProfilesRemaining: 0`, `authUserDeleted: true`,
  `authUserRemaining: false`.
- QA passed ESLint, manual validator, guarded remote run, build, and scoped diff checks.

Acceptance decision:

- Backend Slice 2 / 2B persistence proof is closed.
- Source-only acceptance is not being claimed; acceptance is based on the guarded disposable live
  persistence proof above.
- Frontend may now wire the first manual create interaction through the accepted backend
  review/confirm seams.

## Source Links

- Backlog source: [Manual Workout Creation, Editing, Copy, Templates, And Recurrence](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md>)
- Running Coach source of truth: [Manual Workout Constructor Taxonomy And Template Library](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md>)
- Current product: [current-product.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md>)
- Current system: [current-system.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md>)
- Current state: [current-state.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-state.md>)

## Manual Plan Builder MVP Reframe

Date: 2026-06-11

Decision:

- Reframe this active plan around the full end-to-end `New plan from scratch` / `Build my plan
myself` lifecycle.
- Treat the QA-passed first-create slice as the foundation for the manual builder, not as the full
  product completion.
- Keep one active manual authoring plan instead of creating another plan file. This plan remains the
  canonical execution owner for the manual builder MVP.

Root cause:

- Visible symptom: Hito can create one reviewed manual workout as the first
  `manual_user_built_plan_v1` active plan, but the user expectation is an empty editable calendar
  where they can keep building the plan.
- Underlying cause: the plan treated add-more-workout, saved templates, copy/paste, and export as
  separate future conveniences instead of one coherent product lifecycle after `New plan from
scratch`.
- Canonical owners:
  - Backend owns validation, normalization, review, confirm, persistence, template registry,
    personal saved-template truth, copy/paste validation, JSON export truth, protected-day rules,
    and metric truth.
  - Frontend owns interaction, calendar rendering, modal/sheet UI, Hito DS reuse, form input,
    async state, and display of backend-shaped truth.
  - Running Coach owns workout block/template taxonomy and training meaning.
  - QA owns browser and disposable persistence proof.

Accepted product scenario:

1. Runner chooses `New plan from scratch`, `Build my plan myself`, or equivalent manual entry.
2. Hito opens the existing calendar visual system in an empty manual-builder state.
3. Empty eligible days can be selected.
4. Desktop shows an `Add` affordance on hover/focus; mobile keeps `Add` visible.
5. Runner chooses `Add activity`, `Add training`, or equivalent.
6. Runner selects from Hito-owned templates such as easy, long, intervals, hills, or rest.
7. A modal/sheet opens with the template loaded.
8. The constructor shows a top preview plus editable sections for warm-up, work, recovery/rest,
   cooldown, repeat/loop groups where supported, and duration/distance/target fields where backend
   metric truth allows them.
9. Runner saves the reviewed workout and it appears on that calendar day.
10. Runner repeats this for other days.
11. From the workout modal or day menu, runner can `Save as template activity`.
12. Save-as-template asks for a name and icon/glyph.
13. The saved personal template appears in the next `Add activity` template list.
14. Runner can copy an existing workout day.
15. Runner can paste it into another day after backend review before persistence.
16. The resulting manual plan can be exported/shared as JSON using canonical plan/workout truth.

Manual builder MVP scope:

- first manual plan creation from one reviewed workout
- adding additional reviewed workouts to existing manual plans
- frontend empty-calendar add flow after the first plan exists
- Hito-owned template picker and constructor rendering
- personal saved templates with name and icon/glyph
- copy/paste through draft reconstruction and backend review
- JSON export/share using canonical active-plan export truth
- browser QA covering multiple days, rest days, saved template, custom icon/glyph, copy/paste, JSON
  export, and mobile `375px`

Explicitly later:

- recurrence or persistent recurrence-rule storage
- editing generated, preset, imported, or running-engine plans through the manual builder
- active-plan replacement/refresh semantics
- advanced/performance-only templates that need new eligibility fixtures
- provider upload/sync, Garmin/Strava behavior, OpenAI, or AI recommendations
- a new visual system outside Hito DS

Sequencing decision:

- Keep BACKEND Slice 3A as the immediate next gate because adding one reviewed workout to an
  existing manual plan is the first missing root mutation after first-create.
- Do not jump to personal templates, copy/paste, or export before Slice 3A proves the manual active
  plan can be safely expanded.
- Do not let Frontend fake post-create rows while Backend Slice 3A is missing.

## Product Intent

Some runners do not want Hito to generate a plan for them. They should be able to choose a separate
path such as `Build my plan myself`, see an empty calendar-like planning surface, click `Add` on an
allowed date, and create a workout from scratch, from a Hito template, or by pasting a copied
workout.

This is not a frontend-only calendar button. Manual authoring touches canonical active-plan truth,
planned workout identity, workout history protection, provider evidence, export/import, future
refresh behavior, copy/paste semantics, and recurrence. Backend must own validation, normalization,
conflict detection, lifecycle rules, source metadata, and persistence.

## Current Architecture Gap

Implemented Hito has canonical paths for generated plans, Plan Presets, import/apply, active-plan
refresh, schedule reflow, workout result logging, the first `manual_user_built_plan_v1` creation
from one reviewed manual workout, and adding additional reviewed workouts to eligible
today-or-future empty days in existing manual user-built plans. It does not yet have the remaining canonical manual
builder path for:

- editing planned workout content
- creating workouts from runner-saved personal templates
- copying/pasting a workout to another date
- saving personal custom activity templates
- exporting/sharing the completed manual plan as canonical JSON
- validating user-edited workout blocks/repeat groups
- recurrence or repeat-pattern expansion

Existing schedule-edit logic can move future workouts, but it does not author workout content.
Existing workout-log logic can save result truth, but it does not mutate planned workout truth.

## Architecture Decision

Use one backend-owned manual authoring pipeline:

`frontend input -> backend draft validation -> canonical workout draft -> explicit review/confirm when risky -> canonical planned_workouts mutation`

The first product path is a no-active-plan `Build my plan myself` flow. The UI may show an empty
calendar immediately, but that calendar is a non-persisted draft surface until the runner confirms
at least one valid manual workout or an explicit user-built plan start boundary.

Do not create a silently active empty plan by default in v1. Persisting an empty `plan_cycle` would
make saved mode look active without training truth and would block generated/preset creation. If
Backend later proves an active empty plan is necessary, it must be explicitly reviewed, sourced, and
reversible.

Use source kind:

- `manual_user_built_plan_v1` for the user-built active plan cycle
- `manual_workout_authoring_v1` for individual authored workout source metadata where useful

No new DB schema is required for Backend Slice 1 unless source audit proves existing
`plan_cycles.goal_metadata`, `plan_cycles.plan_preferences`, `planned_workouts.goal_context`,
`planned_workouts.metric_mode`, `planned_workouts.steps`, and rich workout columns cannot carry the
reviewed canonical truth safely.

## Canonical Manual Authoring Pipeline

1. Runner enters a no-active-plan state.
2. Frontend offers `Build my plan myself` separately from generated, preset, import, and advanced
   custom paths.
3. Frontend opens a draft calendar surface with fake/draft empty-day affordances only.
4. Runner clicks `Add` on an allowed date.
5. Add menu offers:
   - `Create new workout`
   - `Choose from template`
   - `Paste copied workout` when a copy buffer exists
   - recurrence only as disabled/future copy until recurrence architecture is implemented
6. Frontend sends a backend-shaped draft request. It never sends trusted rows for persistence.
7. Backend validates:
   - date and lifecycle
   - no-active-plan or approved user-built-plan context
   - template eligibility
   - block grammar
   - repeat/loop grammar
   - metric truth
   - fixed-rest and hard-session warnings where available
   - history/evidence protection for edit/paste operations
8. Backend returns a canonical manual workout draft with normalized steps, identity, family, icon,
   metric mode, warnings, review copy, and mutation readiness.
9. Frontend renders review and constructor state from backend-shaped truth.
10. Confirm persists through one canonical active-plan/planned-workout mutation seam.
11. The persisted workout is readable by the existing calendar, workout detail, export, import,
    logging, evidence, and feedback surfaces.

## Reused Existing Seams

- [active-plan-persistence.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-persistence.ts>)
  for active-plan lifecycle, no-active-plan guard, transaction/rollback patterns, plan insertion,
  and active-plan conflict behavior.
- [persisted-plan-replacement.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/persisted-plan-replacement.ts>)
  for mapping canonical workout truth into `planned_workouts` rows and preserving exact row/step
  semantics where applicable.
- [imported-plan.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/imported-plan.ts>)
  for canonical `training-plan-v2` workout shape, executable step normalization, and segment
  validation vocabulary.
- [training.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/training.ts>)
  for route-readable workout/step shape and existing helper behavior.
- [active-plan-schedule-edit-preview.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts>)
  for protected-workout, logged-workout, evidence-backed, and reflow conflict concepts.
- [workout-log-actions.ts](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/workout-log-actions.ts>)
  as the boundary that owns workout result logging and must not be bypassed by planned-workout edits.
- [Calendar.tsx](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx>)
  and [hito-calendar-day.tsx](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/hito-calendar-day.tsx>)
  for eventual day-cell anatomy, without moving product truth into the frontend.

## New Seams Proposed

Backend should introduce a focused manual authoring module instead of expanding route-local UI or
overloading the existing generated-plan builders.

Proposed module boundary:

- `src/lib/manual-workout-authoring/schema.ts`
  owns typed draft inputs, block keys, repeat group payloads, template ids, and review result types.
- `src/lib/manual-workout-authoring/templates.ts`
  owns backend template registry translated from the Running Coach source-of-truth artifact.
- `src/lib/manual-workout-authoring/validator.ts`
  owns block/repeat/metric/safety validation and canonical draft normalization.
- `src/lib/manual-workout-authoring/actions.ts`
  owns server-side review/confirm orchestration for manual workout drafts.

Public server-action names should stay narrow:

- `reviewManualWorkoutDraft(...)`
- `confirmManualWorkoutDraft(...)`
- later `copyManualWorkoutDraft(...)` or `reviewManualWorkoutPaste(...)`
- later `reviewManualWorkoutRecurrence(...)`

If `training-api.ts` needs compatibility exports, keep them as wrappers only. Do not make
`training-api.ts` the implementation owner.

## Mutation And Review Boundary

### Non-Mutating Review Required

Review is required before persistence for:

- first manual workout in a no-active-plan user-built draft
- creating the user-built active plan cycle
- replacing an existing planned workout
- converting rest to workout or workout to rest
- paste operations that regenerate date-specific metadata
- editing today
- any fixed-rest conflict
- any hard-session stacking warning
- any future recurrence or batch expansion

### Direct Confirm May Be Allowed After Review

Confirm may persist only when Backend proves:

- authenticated user owns the target context
- no active plan exists for initial user-built plan creation, or the active plan is explicitly in
  an allowed user-built/manual-edit state
- target date is allowed
- target workout is not protected by logs, Garmin/FIT evidence, actual metrics, comparison, or AI
  insight
- canonical draft token/checksum still matches server-rebuilt draft
- no client-sent rows are trusted

### Hard Blocks

Manual content mutation must be blocked for:

- past protected workouts
- logged workouts unless a separate history-detach flow is approved
- evidence-backed workouts
- workouts with actual metrics, comparisons, or AI insights
- active-plan replacement or refresh behavior
- generated/preset plan bulk rewrites
- recurrence persistence before recurrence architecture is approved

## Template Ownership Decision

Running Coach owns the source-of-truth taxonomy and safety matrix in:

[Manual Workout Constructor Taxonomy And Template Library](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md>)

Backend owns the executable registry derived from that artifact. Frontend must not define route-local
templates, eligibility, metric policy, required blocks, repeat caps, or safety warnings.

V1 template registry should include safe families already defined by Running Coach:

- rest
- recovery jog
- easy aerobic run
- steady aerobic run
- easy run with strides
- progression run
- controlled tempo
- time intervals
- distance intervals where eligible
- long aerobic run
- long run with steady finish
- cutback long run
- taper long run
- uphill repeats
- rolling hills
- run-walk adaptation
- technical trail easy where eligible

Advanced templates such as `long_intervals_5x1500m_500m_jog`,
`cruise_intervals_4x2k_2min_jog`, and `threshold_3x3k_1k_float` should remain source-tracked but
future/advanced-only until Backend adds explicit eligibility and QA fixtures.

## Copy/Paste Lifecycle Decision

Copy/paste should be implemented as draft reconstruction, not raw row duplication.

Copy captures a canonical workout draft:

- title and notes
- workout family, identity, icon, and source metadata
- metric mode
- planned RPE, estimated fatigue, recovery priority when present
- normalized steps and segment anatomy
- goal context
- editable template fields where recoverable

Paste regenerates:

- workout date
- weekday
- week number or draft display grouping
- display order
- date-specific source metadata
- conflict warnings

Paste must not reuse the original `planned_workouts.id` or pretend the copied workout is the same
historical event. If useful, store `copied_from_planned_workout_id` in bounded metadata, not as the
primary workout identity.

Frontend may keep a transient copy buffer for interaction, but Backend must revalidate the copied
payload before any paste review or confirm.

## Recurrence Lifecycle Decision

Recurrence is future-only in v1. Do not create recurrence-rule storage yet.

The safest future direction is:

1. User chooses a recurrence pattern.
2. Backend expands it into a reviewed batch of concrete workout drafts.
3. Frontend renders the affected dates, conflicts, skipped dates, and protected dates.
4. Confirm persists concrete `planned_workouts` rows only.

Only add persistent recurrence rules later if Product proves runners need ongoing editable patterns
instead of one-time batch expansion.

## User-Built Plan Lifecycle Rules

- `Build my plan myself` is available only when no active plan exists in v1.
- It must not silently replace an existing generated, preset, imported, or refreshed active plan.
- Existing active-plan replacement/refresh remains separate.
- Manual editing of generated or preset plans is future work unless Backend explicitly scopes a
  smaller future unprotected-workout edit gate.
- User-built plans should become active only after explicit confirmation of the first valid manual
  workout or an approved plan-start boundary.
- Deleting or clearing a user-built plan should reuse existing active-plan lifecycle actions unless
  Backend finds a source-kind-specific reason not to.

## Backend Slice 1 Scope

Implement the non-mutating manual workout draft contract.

Backend Slice 1 includes:

- typed manual workout constructor input schema
- template registry skeleton from Running Coach source truth
- block/repeat validation for a bounded v1 template set
- draft review for `Create new workout` and `Choose from template`
- canonical normalized steps and metadata output
- metric-truth enforcement:
  - watch/app assumed
  - no fake precise pace
  - no fake personal HR
  - default HR guidance clearly marked as editable default only
- no-active-plan draft context support
- protected-date/conflict result shape, without persistence
- token/checksum or equivalent exactness mechanism for future confirm
- harness fixtures for easy, long, interval, hill, run-walk, rest, and invalid repeat cases

Backend Slice 1 excludes:

- DB writes
- DB schema changes
- frontend route changes
- empty active plan persistence
- copy/paste persistence
- recurrence
- generated/preset plan editing
- provider sync
- OpenAI
- manual workout CRUD UI

## Backend Slice 1 Implementation Notes

Status: implemented for non-mutating review contract; awaiting Architect checkpoint before any
confirm/persist slice.

Implemented module boundary:

- `src/lib/manual-workout-authoring/schema.ts`
  owns manual draft input, constructor entry/block/repeat types, bounded review result types,
  source metadata, protected conflict shape, and target-truth enums.
- `src/lib/manual-workout-authoring/templates.ts`
  owns the backend template registry derived from the Running Coach artifact and maps each supported
  template to existing canonical workout identities/families/icons.
- `src/lib/manual-workout-authoring/validator.ts`
  owns pure block/repeat/metric validation and rejects unsafe constructor shapes before canonical
  draft assembly.
- `src/lib/manual-workout-authoring/normalize.ts`
  owns normalization into existing `Step[]`, canonical workout identity, and canonical metric-mode
  JSON after validation has passed.
- `src/lib/manual-workout-authoring/actions.ts`
  owns non-mutating `reviewManualWorkoutDraft(...)`, bounded rejection shapes, protected context
  conflicts, and stable review token/checksum exactness payloads.
- `scripts/validate-manual-workout-authoring.ts`
  owns the deterministic Slice 1 fixtures.

Behavior implemented:

- Accepted fixtures:
  rest day, easy aerobic run, long-run multi-block anatomy, time intervals with recovery, uphill
  repeats with recovery, and run-walk repeat anatomy.
- Rejected fixtures:
  nested repeats, repeated intensity without recovery, fake precise pace, fake personal HR, unknown
  manual-only template identity, and protected logged workout context.
- Non-rest drafts normalize to existing watch-executable numeric `Step[]` structure.
- Review output is non-mutating with `persisted: false`, `sourceKind:
manual_workout_authoring_v1`, `source_kind: manual_workout_authoring_v1`, stable
  `reviewToken`, and stable `reviewChecksum`.
- Stable exactness payload changes when confirm-relevant content such as workout date changes.

Mapping gaps recorded:

- `run_walk_adaptation` exists in the Running Coach taxonomy but not as a dedicated canonical
  runtime workout identity. Backend Slice 1 maps it to existing `recovery_jog` identity with
  explicit run/walk repeat anatomy and reports the mapping gap instead of creating a duplicate
  manual-only identity.
- `technical_trail_easy` has an existing canonical workout identity, but no dedicated executable
  trail-body block exists in the current `Step[]` vocabulary. The registry uses existing
  `easy_run_block` structure with technical trail identity metadata and reports the mapping gap.

Validation evidence:

- `npm exec eslint -- src/lib/manual-workout-authoring/*.ts scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`

## Architecture Checkpoint: Designer Spec Acceptance And Slice 2 Selection

Date: 2026-06-10

Decision:

- Accept the Designer spec
  [Manual User-Built Plan Flow Spec](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md>)
  as the UX/product design input for the manual `Build my plan myself` path.
- Accept Backend Slice 1 as implementation-validated enough to route forward. The non-mutating
  review seam, backend-owned templates, validation, normalization, review token/checksum, and
  deterministic harness evidence are sufficient for the next backend mutation-boundary slice.
- Do not treat Backend Slice 1 or the Designer spec as shipped user-facing behavior. The manual
  flow still lacks confirm/persist, frontend wiring, browser QA, and final acceptance.
- Select BACKEND Slice 2 as the next gate before frontend implementation. The root cause is the
  missing canonical user-built plan lifecycle, not a missing calendar button. Frontend should not
  scaffold save/create behavior until Backend proves the reviewed manual draft can become a
  persisted `manual_user_built_plan_v1` active plan through the canonical persistence seam.

Rationale:

- A frontend-only draft calendar would risk fake saved states, route-local templates, and local
  mutation truth.
- Backend Slice 1 already provides the needed non-mutating review contract for first persistence
  work: canonical draft output, source metadata, conflict shape, review token, and checksum.
- The next unsafe boundary is mutation: server-side rebuild, exactness verification, active-plan
  guard, rollback behavior, and canonical `training-plan-v2` persistence.
- Reusing `createFirstPlanFromReviewedCanonicalPlanForUser(...)`, imported-plan seed mapping, and
  planned-workout insert helpers keeps manual authoring on the same lifecycle path as other
  reviewed plan creation instead of creating a parallel persistence system.

Backend Slice 2 must preserve:

- no active empty plan persistence
- no generated/preset/imported/running-engine plan mutation
- no recurrence
- no copy/paste persistence
- no save-as-template persistence
- no frontend-owned templates, eligibility, metric truth, schedule truth, or persistence
- no fake precise pace
- no fake personal HR
- no OpenAI
- no Plan Preset confirm revival

## Backend Slice 2 Implementation Notes

Status: implemented / QA-passed / accepted for frontend wiring after guarded disposable
persistence proof.

Implemented:

- `confirmManualWorkoutDraft(...)` server action exported through the existing manual authoring seam.
- `confirmManualWorkoutDraftForUser(...)` pure user-scoped confirm helper for harness and future QA.
- `manual-workout-authoring/persistence.ts` owns the reviewed-workout to `training-plan-v2`
  mapping and persistence metadata shaping, keeping the action file focused on lifecycle,
  exactness, and bounded results.
- Server-side rebuild through `reviewManualWorkoutDraft(...)`; confirm never accepts client-sent
  canonical rows.
- Exactness verification for review token/checksum, including changed date, changed template,
  changed entries, invalid token, stale checksum, protected date, and active-plan conflict.
- Canonical mapping from one reviewed manual workout into `training-plan-v2` with source kind
  `manual_user_built_plan_v1`.
- Canonical persistence delegation to `createFirstPlanFromReviewedCanonicalPlanForUser(...)`.
- Source metadata for manual plan creation, workout authoring source, template key/version,
  workout date, row count, review payload version, review checksum, mapping gaps, metric truth mode,
  and warnings.
- Rest-only first confirm is blocked with a bounded `manual_workout_required` response so Hito does
  not create an active empty/rest-only manual plan.
- The manual review checksum no longer imports Node-only crypto, keeping the public action/export
  build-safe.

Validation evidence:

- `npm exec eslint -- src/lib/manual-workout-authoring/*.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `git diff --check -- src/lib/manual-workout-authoring/actions.ts src/lib/manual-workout-authoring/persistence.ts src/lib/manual-workout-authoring/schema.ts src/lib/manual-workout-authoring/index.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`
- `npm run build`

Final acceptance evidence:

- Backend deterministic source/harness gates passed.
- Guarded remote-disposable persistence proof passed against project `dltfjwexyctmihclcjqj`.
- Persisted one row with source kind `manual_user_built_plan_v1` and source status
  `manual_user_built_plan_created`.
- Cleanup returned disposable auth and manual plan/workout/profile/log rows to zero.
- Frontend create wiring is no longer blocked by persistence proof, but it must remain a thin
  interaction layer over `reviewManualWorkoutDraft(...)` and `confirmManualWorkoutDraft(...)`.

## Architecture Validation-Environment Decision For Manual Slice 2 Persistence Proof

Status update, 2026-06-10: resolved. QA passed the guarded remote-disposable persistence proof
after Backend Slice 2B harness hardening.

Historical decision before Backend Slice 2B:

- Do not accept source-only proof as full manual confirm/persist acceptance.
- Do not send QA directly into scoped remote mutation before harness hardening, because
  `scripts/validate-manual-workout-authoring.ts` does not currently contain the R8-style target
  preflight, explicit remote override, allowlist, disposable user namespace, or cleanup/readback
  proof required for a safe remote persistence run.
- Select BACKEND hardening as the next gate. Backend must add manual-workout-specific
  fail-safe controls to the harness first.
- After hardening, the accepted proof strategy is:
  - local disposable Supabase by default when available
  - if local Supabase remains unavailable, exactly one explicit remote-disposable proof against
    project `dltfjwexyctmihclcjqj`
  - remote proof must use the guarded harness flag, exact env confirmation, project allowlist, and
    disposable cleanup proof

Closeout decision after Backend Slice 2B and QA:

- Backend added the required manual-workout-specific harness guardrails.
- QA proved the default non-mutating path, remote block-before-mutation behavior, guarded
  remote-disposable persistence, and cleanup readback.
- The manual persistence proof blocker is closed.
- FRONTEND Slice 1 may now wire the manual draft calendar/review/create interaction, provided it
  calls the accepted backend review/confirm seams and does not create frontend-owned templates,
  persistence, or saved-state truth.

Rationale:

- Backend Slice 2 writes active-plan truth: `runner_profiles`, `plan_cycles`, and
  `planned_workouts`.
- `.env.local` currently points at remote Supabase project `dltfjwexyctmihclcjqj.supabase.co`.
- QA found local Supabase unavailable on port `54321`.
- The R8 running-plan confirm harness already established the correct safety pattern:
  non-mutating by default, `--require-persistence` fail-fast, loopback as local disposable,
  remote mutation blocked by default, explicit remote-disposable override only, and strict cleanup
  proof.
- Manual workout authoring needs the same class of harness protection before any remote mutation
  proof is acceptable.

Required manual harness guardrails:

- non-mutating review/exactness checks run by default
- `--require-persistence` fails fast when no safe target exists
- loopback Supabase URLs are treated as local disposable targets
- remote Supabase mutation is blocked by default
- remote mutation requires `--allow-remote-disposable-supabase-mutation`
- remote mutation requires an exact manual-workout env confirmation such as
  `HITO_MANUAL_WORKOUT_CONFIRM_ALLOW_REMOTE_MUTATION=I_UNDERSTAND_THIS_MUTATES_REMOTE_DISPOSABLE_SUPABASE`
- remote mutation allowlist is limited to project ref `dltfjwexyctmihclcjqj`
- disposable auth user naming/metadata is specific to the manual workout proof
- cleanup/readback is schema-aware and verifies zero remaining:
  - `workout_logs`
  - `planned_workouts`
  - `plan_cycles`
  - `runner_profiles`
  - disposable auth user

Rejected proof paths:

- source-only/non-mutating harness as full persistence acceptance
- direct QA remote mutation without manual harness guardrails
- unscoped remote mutation
- production or non-disposable user mutation
- frontend Create/save wiring before live persistence proof passed and Architect closed the gate
- DB/schema changes to make the proof easier
- active-plan replacement, recurrence, copy/paste persistence, or save-as-template persistence

Next accepted sequence:

1. BACKEND added the manual harness safety controls above.
2. QA reran non-mutating source/harness checks.
3. QA ran `--require-persistence` without remote override and proved it blocked before mutation.
4. QA verified guarded remote proof against project ref `dltfjwexyctmihclcjqj`.
5. QA ran one scoped remote-disposable persistence proof with explicit flag and env confirmation,
   then proved cleanup left zero manual QA records.
6. ARCHITECT closes the persistence acceptance gate in this plan update and selects FRONTEND Slice
   1 for manual draft calendar/review/create wiring.

## Frontend Slice 1 First-Create Flow Acceptance

Date: 2026-06-10

Status:

implemented / QA-passed / accepted for first manual user-built plan creation.

Root cause closed:

- Visible symptom: `Build my plan myself` existed as an intended flow, but the first create path
  still needed end-to-end browser proof that a runner could create a persisted manual plan from the
  UI.
- Underlying cause: the missing gate was safe create-click acceptance across frontend interaction,
  backend review/confirm, canonical persistence, saved-mode readback, and cleanup.
- Canonical owners:
  - frontend interaction and Hito DS rendering
  - backend review/confirm/persistence truth
  - QA disposable browser and DB readback proof

QA browser create-click evidence:

- Browser flow completed: `Build my plan myself` -> `Create workout` -> `Review workout` ->
  `draft_ready` -> `Create manual plan`.
- Pre-create DB state for `qa-date-controls-release-20260529@local.test` was zero for runner
  profiles, plan cycles, active plans, manual plans/workouts, and workout logs.
- Create succeeded and UI transitioned to saved/home calendar state with `Manual user-built plan`,
  `Open plan`, and `Easy aerobic run`.
- DB readback showed exactly one active plan with `source_kind: manual_user_built_plan_v1`,
  `source_status: manual_user_built_plan_created`, one row, and one non-rest row.
- Persisted workout matched the reviewed draft:
  - title: `Easy aerobic run`
  - date: `2026-06-11`
  - weekday: `Thursday`
  - identity/source type: `easy_aerobic_run`
  - three executable structure-only steps
- Metric truth stayed strict:
  - `structure_only_executable`
  - `pace_targets_allowed: false`
  - `hr_targets_allowed: false`
- Source proof still shows confirm sends only `draftInput`, `reviewToken`, and `reviewChecksum`.
- Mobile post-create at `375px` had no horizontal overflow.
- Cleanup returned `workout_logs`, `planned_workouts`, `plan_cycles`, and `runner_profiles` to
  zero; the disposable auth user was deleted.

Acceptance decision:

- Accept FRONTEND Slice 1 as QA-passed for first manual user-built plan creation.
- This is user-facing shipped-history material because a no-active-plan runner can now create one
  persisted manual plan from a reviewed manual workout through the UI.
- Changelog should record this first-create capability, but must not claim edit, add-more-workout,
  clear/delete, copy/paste, recurrence, save-as-template, active-plan replacement, generated-plan
  mutation, or manual template persistence.

Next gate:

- BACKEND Slice 3A: add one reviewed manual workout to an existing `manual_user_built_plan_v1`
  active plan on an eligible future empty day.

What remains blocked:

- edit existing manual workouts
- clear/delete persisted manual days
- copy/paste persistence until the later reviewed paste MVP gate
- recurrence as future-only outside this MVP
- save-as-template persistence until the later personal template MVP gate
- manual mutation of generated, preset, imported, or running-engine plans
- active-plan replacement

## Backend Slice 3A Add-Workout Mutation Result

Date: 2026-06-10

Status:

implemented / QA-passed / accepted for manual active-plan add-workout mutation.

Root cause closed:

- Visible symptom: after `Build my plan myself`, the first reviewed workout could create a manual
  active plan, but the runner could not safely add the next workout to that existing plan.
- Underlying cause: Hito had first-create manual persistence but no backend-owned mutation boundary
  for adding one reviewed workout to an existing `manual_user_built_plan_v1`.
- Canonical owner: manual workout authoring review/exactness, active-plan lifecycle validation,
  planned-workout persistence mapping, and protected-day guards.

What changed:

- Added a focused add-workout server/action seam:
  - `addManualWorkoutToActivePlan`
  - `addManualWorkoutToActivePlanForUser(...)`
- Added `src/lib/manual-workout-authoring/active-plan-add.ts` so existing-plan mutation does not
  pile into the first-create action owner.
- Reused `reviewManualWorkoutDraft(...)` and `validateManualWorkoutReviewExactness(...)`; confirm
  rebuilds the reviewed draft server-side and verifies `reviewToken` + `reviewChecksum`.
- Reused canonical `training-plan-v2` row mapping through `buildImportedPlanSeed(...)` and
  `buildPersistedWorkoutInsertRows(...)` rather than hand-building `planned_workouts`.
- Enforced server-side mutation bounds:
  - requires an active plan
  - requires `plan_cycles.source_kind === manual_user_built_plan_v1`
  - requires a future target date on or after the manual plan start date
  - requires an empty target day
  - rejects logged/evidence-backed occupied days as protected
  - rejects generated, preset, imported, and running-engine plans
  - rejects stale review, invalid token/checksum, and client-sent row payloads
- Preserved source metadata in the plan metadata trail:
  - `manual_user_built_plan_v1`
  - `manual_workout_authoring_v1`
  - template key/version
  - workout date
  - review payload version
  - checksum
  - metric truth mode
  - mapping gaps
  - warnings

Validation evidence:

- Targeted ESLint passed for manual authoring backend files, `training-api.ts`, and the manual
  validation harness.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed.
- The default harness remains non-mutating.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence` blocks
  before mutation when no safe Supabase persistence env is loaded.

QA acceptance evidence:

- `addManualWorkoutToActivePlanForUser(...)` accepts only `activePlanId?`, `draftInput`,
  `reviewToken`, and `reviewChecksum`.
- The add seam rebuilds review server-side and rejects client-sent rows, workouts, and segments.
- The add seam only permits active plans with `source_kind: manual_user_built_plan_v1`.
- Guarded remote-disposable live smoke created one manual active plan, added one reviewed
  `steady_aerobic_run` on `2026-06-18`, and read back exactly two planned workouts.
- Duplicate same-date add rejected with `occupied_day`.
- Changed reviewed date rejected with `stale_review`.
- Metadata and readback proof preserved manual plan/workout source truth.
- Metric truth stayed strict: no fake precise pace and no fake personal HR.
- Cleanup returned `workout_logs`, `planned_workouts`, `plan_cycles`, `runner_profiles`, and auth
  user to zero/absent.

Acceptance decision:

- Accept Backend Slice 3A as QA-passed.
- The backend root cause is closed: Hito now has a reviewed-workout-to-existing-manual-active-plan
  mutation boundary.
- This is not a frontend shipped capability yet. It becomes user-facing only after Frontend Slice 2
  wires the calendar interaction and QA proves the browser flow.
- Do not add a changelog entry for this backend-only closeout; defer shipped-history wording until
  the user-facing add-workout flow passes frontend/browser QA.

Next gate:

- FRONTEND Slice 2: wire the post-create empty-calendar `Add activity` flow for existing
  `manual_user_built_plan_v1` active plans, consuming only backend-shaped review/add results from
  Backend Slice 3A.

## Architecture Decision: Date-Only And Weekday Ownership

Date: 2026-06-11

Status:

accepted / Frontend Slice 2A selected before manual Add acceptance can pass.

Root cause:

- Visible symptom: selecting a manual Add day such as `Sun, Jun 14` could show `Sat, Jun 13` in
  runner-facing UI, while DB persistence still used the correct `2026-06-14`.
- Immediate fix: Frontend repaired the shared manual display helper, but QA still failed because
  the final Add confirmation modal did not repeat the selected date.
- Underlying architectural risk: manual calendar rendering, authoring review, final confirmation,
  persistence readback, and future move/copy/paste flows could drift if date-only values and weekday
  labels do not have one ownership contract.

Canonical date-only representation:

- Canonical calendar day identity is `YYYY-MM-DD`.
- `workoutDate`, `workout_date`, `sourceDate`, and `targetDate` are date-only product truth.
- A timezone-bearing `Date` object is never canonical day identity.
- `Date` objects are allowed only as local implementation details inside shared date helpers.
- Persisted/manual mutation payloads must never derive a day from runner-facing display text.

Weekday ownership:

- Weekday is derived evidence from the canonical date, not independent product truth.
- Backend review/normalization should derive weekday from `workoutDate` when producing review and
  persistence readback.
- Frontend may render weekday labels from canonical `YYYY-MM-DD` using the shared Hito date-only
  display helper.
- If backend-provided weekday and frontend-derived weekday disagree, that is a defect. Do not
  silently choose one label.
- Storing `weekday` in persisted rows remains acceptable for readback/audit, but it must be treated
  as derived from `workout_date`.

Forbidden patterns:

- Do not parse bare `YYYY-MM-DD` with timezone-sensitive `new Date(iso)` for runner-facing labels.
- Do not use UTC instant conversion as the source of weekday truth for local calendar days.
- Do not derive mutation target date from localized display labels such as `Sun, Jun 14`.
- Do not let frontend own weekday truth for review/confirm exactness.
- Do not store or mutate weekday as an independent source of truth when `workoutDate` is canonical.

Manual Add confirmation contract:

- The day action menu, constructor, review summary, final Add confirmation modal, success/error
  copy, and persisted readback must all refer to the same `YYYY-MM-DD` date-only value.
- Final Add confirmation must repeat the selected date and weekday before the runner clicks
  `Add workout`.
- The final confirmation should use backend-shaped review truth as the source:
  `review.draft.workoutDate` plus derived/backend weekday evidence.
- Confirm must still send only `activePlanId?`, `draftInput`, `reviewToken`, and `reviewChecksum`.
- The UI must not claim the workout was added until persisted backend readback refreshes the
  calendar.

Future move-workout contract:

- Moving a workout is a separate backend-reviewed mutation, not a frontend drag/drop row update.
- A future move review must include:
  - `activePlanId`
  - planned workout id or canonical source workout reference
  - `sourceDate`
  - `targetDate`
  - source weekday label/evidence derived from `sourceDate`
  - target weekday label/evidence derived from `targetDate`
  - review token/checksum
- Backend owns validation for occupied days, protected days, logged/provider-evidence days,
  generated/preset/imported/running-engine source rejection, and persistence.
- Frontend owns interaction and rendering of backend-shaped source/target review only.
- Future move confirm must not trust client-sent rows, segments, weekday strings, or display labels.

Next gate:

- FRONTEND Slice 3: wire the personal saved-template UI now that shared workout target display
  grammar cleanup is QA-passed.

What remains out of scope:

- move-workout implementation
- copy/paste persistence
- recurrence
- JSON export
- additional DB/schema changes beyond the QA-passed `runner_manual_workout_templates` table
- generated/preset/imported/running-engine manual mutation

## Backend Slice 4 Implementation Notes — 2026-06-11

Status:

implemented / QA-passed / accepted for backend personal saved-template persistence.

Backend implemented and QA accepted the personal saved-template persistence boundary without
changing manual first-create, post-create Add, generated/preset/imported/running-engine, OpenAI, or
frontend UI behavior.

What changed:

- Added `runner_manual_workout_templates` as the explicit user-owned personal template table with
  RLS, source metadata, runner display name, allowed icon/glyph key, review checksum, and normalized
  manual draft payload.
- Added `src/lib/manual-workout-authoring/saved-templates.ts` as the focused backend owner for:
  - saving a reviewed manual workout as a personal template
  - listing the current user's personal templates
  - reconstructing a future `ManualWorkoutDraftInput` from a saved template and rerunning
    `reviewManualWorkoutDraft(...)`
- Kept active-plan persistence and `planned_workouts` out of personal template ownership so saved
  templates do not become raw row duplication.
- Exported the typed server actions/results through the existing manual workout/training API seams
  for future frontend consumption.
- Extended the manual authoring harness with deterministic saved-template coverage:
  save, readback, invalid name, invalid icon/glyph, unsupported payload, cross-user rejection,
  fake pace/HR rejection, and reconstruct-review proof.
- Extended guarded disposable cleanup/readback specs so future live persistence proof also checks
  zero remaining `runner_manual_workout_templates` rows for the disposable user.

Backend validation evidence:

- `npm exec eslint -- src/lib/manual-workout-authoring/*.ts src/lib/training-api.ts scripts/validate-manual-workout-authoring.ts scripts/manual-workout-authoring/persistence-proof.ts`
  passed.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts` passed with non-mutating
  default persistence mode.
- `node --env-file=.env.local --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence`
  blocked before mutation against remote project `dltfjwexyctmihclcjqj`, as designed.
- `npm run build` passed.

QA acceptance evidence:

- QA applied the exact scoped migration SQL
  `20260611120000_runner_manual_workout_templates.sql` only to the approved disposable remote
  target and repaired only migration version `20260611120000`.
- `--require-persistence` without explicit override blocked before remote mutation.
- Live disposable proof saved one reviewed workout as `manual_saved_workout_template_v1` with:
  - display name: `QA reusable strides`
  - icon key: `easy`
  - workout source kind: `manual_workout_authoring_v1`
  - target truth mode: `structure_only`
  - trusted client rows: `false`
- Owner authenticated readback saw one template.
- A second disposable authenticated user saw zero templates.
- Cross-user review returned `not_found`.
- Reconstruction for `2026-06-25` returned `persisted: false`, passed manual review, and preserved
  `reviewedThroughManualAuthoring: true`.
- Cleanup returned `runner_manual_workout_templates`, `workout_logs`, `planned_workouts`,
  `plan_cycles`, and `runner_profiles` to zero; both disposable auth users were deleted.

Acceptance decision:

- Accept Backend Slice 4 as QA-passed for backend/source/schema/RLS/persistence/readback.
- This is not yet user-facing shipped behavior because frontend `Save as template` and personal
  template picker wiring are still future work.
- Do not update changelog for runner-facing shipped history until the frontend template UI passes
  browser QA.

## Shared Workout Target Display Grammar Cleanup Acceptance — 2026-06-11

Status:

QA-passed / accepted.

Context:

The shared runner-facing workout target display grammar cleanup was a blocker before exposing more
manual-builder template UI. It ensured manual and saved workout surfaces do not teach runners to
read internal target labels as workout prescriptions.

QA evidence:

- Browser proof used a saved active-plan fixture.
- Saved calendar row proof showed the `45.85`-style fixture duration renders as `46 min`.
- Workout detail and interval/segment readback showed `9.4 min` renders as `9 min 24 sec`.
- `Target: Structure-only executable target` is absent from runner-facing tested surfaces.
- Structure-only mode still shows concrete executable structure.
- Fake pace did not appear.
- Fake personal HR did not appear.
- Mobile `375px` layout has no horizontal overflow.
- Disposable `planned_workouts`, `plan_cycles`, `runner_profiles`, and `workout_logs` returned to
  zero after cleanup.

Acceptance decision:

- Accept the shared workout target display grammar cleanup as QA-passed.
- Record this as shipped runner-facing bugfix material in
  [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md).
- The blocker on user-facing `Save as template` UI is removed.
- Select FRONTEND Slice 3 as the next manual builder gate.

## Frontend Slice 3 Saved Template UI Acceptance — 2026-06-11

Status:

QA-passed / accepted for the scoped happy path.

Context:

FRONTEND Slice 3 exposed the Backend Slice 4 personal saved-template seam in the manual builder UI
without creating frontend-owned template truth.

QA evidence:

- Non-Chrome browser proof used Playwright WebKit against the canonical built local server.
- Chrome was not used.
- One disposable QA user was used and cleaned up.
- `Save as template` was absent before review.
- After manual workout review returned `draft_ready`, `Save as template` appeared.
- Save modal collected runner display name `QA reusable tempo 20260611153239` and icon `tempo`.
- Saved template appeared under `My saved templates` in the existing `Choose template` picker beside
  registry groups.
- Selecting the saved template for `Sun, Jun 14` reconstructed a backend-reviewed draft before
  confirm.
- One first-create path was confirmed from the saved-template-reviewed draft.
- DB readback showed one `manual_saved_workout_template_v1` row and one persisted
  `manual_user_built_plan_v1` planned workout.
- Saved template preserved `manual_workout_authoring_v1`,
  `saved_from_reviewed_manual_workout`, icon key, display name, and `structure_only` target truth.
- Mobile `375px` no-overflow passed for save modal, picker, reviewed state, and post-create state.
- Cleanup returned `runner_manual_workout_templates`, `planned_workouts`, `plan_cycles`,
  `runner_profiles`, `workout_logs`, auth user, and local auth account to clean state.

Acceptance decision:

- Accept FRONTEND Slice 3 for the scoped saved-template happy path.
- This is changelog material because a runner-facing saved-template UI path passed browser + DB QA.
- Do not claim copy/paste, recurrence, JSON export, move workout, coach/organization templates, or
  generated-plan mutation.
- Do not treat the first-create proof as coverage for every saved-template path.
- The existing manual active-plan `Add activity` saved-template reuse gap is closed by QA Slice 3B
  below.

## QA Slice 3B Saved Template Existing-Plan Add Acceptance — 2026-06-11

Status:

QA-passed / accepted.

Context:

QA Slice 3B proved the saved-template lifecycle path that was intentionally not covered by the
first-create saved-template QA: existing `manual_user_built_plan_v1` active plan -> eligible future
empty day -> calendar `Add activity` -> saved personal template -> backend review ->
`addManualWorkoutToActivePlan(...)` -> persisted added workout.

QA evidence:

- Non-Chrome browser proof used Playwright WebKit against the canonical built local server.
- The existing local server was reused, not duplicated.
- One disposable QA user was used and cleaned up.
- The user created one manual active plan from a reviewed manual workout.
- The user saved the reviewed workout as personal template `QA Saved Add Reuse 20260611155836`.
- The saved active-plan calendar exposed `Add activity` for a future empty day.
- The saved template appeared under `My saved templates`.
- Selecting the saved template reconstructed backend review.
- `Review add` showed `draft_ready`.
- `Add workout` persisted into the existing active plan.
- DB readback showed one active `manual_user_built_plan_v1` plan.
- DB readback showed one `manual_saved_workout_template_v1` row.
- Saved template metadata preserved `manual_workout_authoring_v1` and
  `saved_from_reviewed_manual_workout`.
- DB readback showed two planned workouts total after add.
- The added workout date was `2026-06-14`.
- The added workout title came from the saved template.
- The added workout identity was `easy_aerobic_run`.
- The added workout preserved `structure_only_executable`.
- Fake pace did not appear.
- Fake personal HR did not appear.
- Mobile `375px` no-overflow passed for picker, reviewed add state, and post-add calendar.
- Cleanup returned templates, logs, planned workouts, plan cycles, runner profiles, local account,
  and auth user to zero/absent.

QA interpretation note:

- The raw `summary.json` had `ok: false` because an early QA assertion incorrectly expected
  `planned_workouts.source_workout_type` to hold manual authoring source-kind metadata.
- Source inspection confirmed that `planned_workouts.source_workout_type` stores the workout/template
  type, such as `easy_aerobic_run`.
- Treat this as QA harness interpretation noise, not a product failure.

Acceptance decision:

- Accept QA Slice 3B as closing the saved-template existing-plan Add lifecycle.
- Saved personal templates are now QA-accepted for both scoped first-create reuse and existing
  manual active-plan Add reuse.
- Update the changelog entry because the accepted user-facing saved-template behavior now extends
  beyond the previous first-create-only proof.
- Backend Slice 5 later closed the next backend-owned copy/paste boundary; see the acceptance
  section above.

## Manual Plan Builder MVP Slice Order

1. BACKEND Slice 1:
   manual workout non-mutating draft/review contract and template registry. Implemented and
   architecture-accepted for sequencing on 2026-06-10.
2. ARCHITECT checkpoint:
   accepted Designer spec and Backend Slice 1; selected Backend Slice 2 as next gate.
3. BACKEND Slice 2:
   confirm/persist first manual workout and create `manual_user_built_plan_v1` active plan through
   canonical plan/workout persistence. Implemented and accepted after guarded disposable
   persistence proof.
4. QA:
   source/harness validation and guarded disposable persistence proof passed.
5. BACKEND Slice 2B:
   harden the manual workout authoring confirm harness for local/remote disposable persistence
   proof. Implemented and QA-passed.
6. FRONTEND Slice 1:
   no-active-plan `Build my plan myself`, draft calendar, Add menu, template picker, constructor
   scaffold, review display, and first create wiring using backend-shaped truth and
   `confirmManualWorkoutDraft(...)`. Implemented and QA-passed with disposable browser create-click
   proof.
7. QA:
   browser, source, and harness validation for initial user-built plan creation. Passed.
8. BACKEND Slice 3A:
   add one reviewed manual workout to an existing `manual_user_built_plan_v1` active plan on an
   eligible future empty day. Implemented and QA-passed with guarded disposable live add proof.
9. FRONTEND Slice 2:
   post-create empty-calendar `Add activity` flow for existing manual active plans, consuming only
   backend-shaped add-workout review/confirm results from Slice 3A. Implemented and QA-passed after
   the Slice 2A date-only confirmation repair.
10. BACKEND Slice 4:
    personal saved-template persistence with user-provided name and icon/glyph, using existing
    manual template/canonical workout truth instead of frontend-owned templates. Implemented and
    QA-passed with guarded disposable migration/RLS/readback proof.
11. FRONTEND Slice 3:
    save-as-template modal and saved personal templates in the `Add activity` template picker.
    Implemented using backend-owned save/list/review actions and existing Hito DS manual builder
    primitives; QA-passed for the scoped first-create saved-template happy path.
12. QA Slice 3B:
    existing manual active-plan Add regression for saved personal templates, proving
    `manual_user_built_plan_v1` active plan -> eligible future empty day -> saved template review ->
    `addManualWorkoutToActivePlan(...)` persistence and cleanup. Passed and accepted on 2026-06-11.
13. BACKEND Slice 5:
    copy/paste draft reconstruction and reviewed paste confirm for existing manual active plans,
    including target-date conflict/protected-day validation. Implemented and QA-passed after guarded
    disposable live proof.
14. FRONTEND Slice 4:
    day more-menu copy/paste interaction and paste review flow, with no raw row duplication.
    Implemented and QA-passed with focused browser/DB readback proof.
15. BACKEND Slice 6:
    delete/clear one eligible manual workout day through backend-owned review/confirm, preserving
    manual active-plan lifecycle, protection rules, and source boundaries. Implemented and QA-passed
    after guarded disposable live proof.
16. FRONTEND Slice 5:
    delete/clear day UI wiring over the accepted backend seam. Implemented and QA-passed with
    focused browser/DB readback proof.
17. BACKEND / EXPORT Slice 7:
    JSON/Markdown export for manual plans through the existing canonical active-plan export owner,
    preserving `manual_user_built_plan_v1` source metadata and canonical workout rows.
    Implemented and QA-passed with browser/download/DB proof.
18. BACKEND Slice 8:
    move one existing manual workout to another eligible date through backend-owned date-only
    review/confirm, preserving the same persisted workout row and rejecting unsafe targets/payloads.
    Implemented and QA-passed with guarded disposable live proof.
19. FRONTEND Slice 6:
    Move Workout UI wiring over the accepted backend seam. Implemented and QA-passed with
    browser/DB readback, same-row move proof, drag/drop-to-review proof, mobile no-overflow, and
    cleanup.
20. FRONTEND / QA:
    saved manual active-plan workout constructor UI contract, including `Start from scratch`,
    `Choose template`, visible `Add rest day`, empty scratch drafts with disabled review,
    live repeat/loop group editing, template-prefilled constructor review, no silent persistence
    before confirm, mobile no-overflow, and cleanup. Implemented and QA-passed on 2026-06-12.
21. QA:
    explicit Add Rest Day review/confirm lifecycle proof. Selected as the next gate so intentional
    Rest rows are proven separately from blank empty days before recurrence, edit, Restore UI, or
    polish.
22. Future-only:
    Hito plan exchange / QR share-import contract and implementation, recurrence/batch expansion
    architecture, edit persisted manual days, generated or preset plan manual mutation, and
    advanced/performance-only manual templates.

## Frontend Boundaries For Later

Frontend must:

- reuse Hito DS primitives, dialogs/sheets, selects, buttons, toggles, status markers, and calendar
  day anatomy
- avoid a page full of cards
- use cards only for template selection or compact summaries when justified
- render backend-shaped template fields and warnings
- collect follow-up answers and request backend recomputation/review
- never compute template eligibility, schedule truth, metric truth, recurrence expansion, protected
  history, or persistence locally

## Exit Criteria

This plan can close when:

- Backend has a canonical manual authoring review/confirm/persist seam.
- No-active-plan user-built plan creation is implemented and QA-passed.
- Existing manual active plans can receive additional reviewed workouts on eligible
  today-or-future empty days without frontend-owned row appends.
- Frontend can create multiple manual workouts from scratch and from Hito-owned templates through
  the calendar `Add activity` flow.
- Personal saved templates with runner-provided name and icon/glyph are persisted by backend and
  reappear in the `Add activity` picker.
- Copy/paste works through backend-reviewed draft reconstruction, not raw row duplication.
- Delete/clear of eligible manual workout days works through backend-owned review/confirm, not
  frontend row removal.
- Move Workout works through backend-owned date-only review/confirm and browser-QA-passed UI, not
  copy+delete, local drag state, or frontend-owned schedule truth.
- Manual plan JSON/Markdown export uses canonical active-plan export truth and preserves
  `manual_user_built_plan_v1` source metadata.
- Public/share/import exchange behavior has an accepted architecture contract before any
  implementation.
- Manual workouts render correctly in calendar, workout detail, and export readback.
- Protected logged/evidence-backed workouts cannot be silently overwritten.
- Recurrence is explicitly preserved as future-only unless a separate batch-review architecture is
  accepted.
- Current docs and changelog are updated only for shipped behavior.

## Backend Slice 1 Full Handoff Detail

```text
ROLE: BACKEND

Task:
Implement Backend Slice 1 for manual workout authoring: non-mutating draft/review contract and
backend-owned template registry.

Stage:
BACKEND implementation / manual workout authoring draft contract.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md

Running Coach source of truth:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md

Backlog source:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md

Context:
Hito needs a backend-owned manual workout authoring path for runners who choose `Build my plan
myself` instead of generated/preset/custom plan creation. The first backend slice is review-only:
no DB writes, no schema changes, no frontend route, no active empty plan persistence, no copy/paste
persistence, no recurrence, no OpenAI.

Required preflight:
1. Read AGENTS.md.
2. Read agents/backend.agent.md.
3. Load matching project skills, especially hito-backend-supabase-contract.
4. Read the plan and Running Coach source artifact above.
5. Inspect existing seams before adding new code:
   - src/lib/active-plan-persistence.ts
   - src/lib/persisted-plan-replacement.ts
   - src/lib/imported-plan.ts
   - src/lib/training.ts
   - src/lib/active-plan-schedule-edit-preview.ts
   - src/lib/workout-log-actions.ts
   - src/lib/training-api.ts

Implement:
1. A focused `src/lib/manual-workout-authoring/` backend module with:
   - typed draft input/schema
   - backend-owned template registry derived from Running Coach source truth
   - block/repeat validation
   - metric-truth validation
   - canonical draft normalization
   - protected-date/conflict result shape
   - review result shape suitable for frontend rendering
   - token/checksum or equivalent exactness data for a later confirm slice
2. A non-mutating review function such as `reviewManualWorkoutDraft(...)`.
3. Harness fixtures proving accepted and rejected drafts for:
   - rest
   - easy aerobic
   - long run with multi-block anatomy
   - interval repeat group
   - hill repeat group
   - run-walk repeat group
   - invalid nested repeat
   - missing recovery for repeated intensity
   - fake precise pace attempt
   - fake personal HR attempt
4. Public compatibility wrapper only if needed. Do not make `training-api.ts` the implementation owner.

Required contract:
- watch/app execution is assumed
- every non-rest workout must have numeric watch-executable structure
- cues are secondary only
- no fake precise pace
- no fake personal HR
- Hito default HR labels may be editable defaults only, not personal HR truth
- long runs over 60 minutes must not normalize into one anonymous block
- quality sessions must preserve warmup, work/recovery where relevant, and cooldown
- frontend must not own templates or eligibility

What not to do:
- Do not write to Supabase.
- Do not add DB schema.
- Do not persist an empty active plan.
- Do not edit frontend.
- Do not add recurrence.
- Do not implement copy/paste persistence.
- Do not edit generated/preset plan content.
- Do not call OpenAI.
- Do not weaken existing plan creation, Plan Preset, import, refresh, export, logging, or schedule-edit safety.

Validation:
- Run targeted TypeScript/ESLint for changed backend/script files.
- Run the new manual workout authoring harness.
- Run `git diff --check -- <changed files>`.
- Run build only if the project policy or changed imports make it necessary.
```

## Blockers

- No blocker for shared workout target display grammar cleanup.
- No blocker for saved personal template reuse in the scoped manual builder paths: first-create and
  existing manual active-plan Add reuse are both QA-passed.
- No blocker for manual Copy/Paste in the scoped browser/DB-proved path.
- No blocker for manual Delete/Clear in the scoped browser/DB-proved path.
- No blocker for manual JSON/Markdown export in the scoped browser/download/DB-proved path.
- No blocker for the backend Move Workout mutation boundary; it is QA-passed in backend/source/DB
  scope.
- No blocker for runner-facing Move Workout in the scoped browser/DB-proved path.
- No blocker for universal active-plan Add/Clear/Move editability in the QA-proved scope.
- No blocker for the saved manual active-plan workout constructor UI contract in the QA-proved
  scope.
- No blocker for the manual/template constructor usability batch in the scoped internal
  browser-QA-proved path.
- No blocker for workout-detail `Edit training` on eligible future manual planned rows in the
  scoped QA-proved persisted-edit path.
- Manual implementation is in architecture reassessment; no next manual execution gate is selected
  by momentum.
- Hito plan exchange / QR share-import is future-only and is not the next selected gate.
- QR codes, public share links, import from export, applying someone else's plan, mobile deep-link
  flow, universal Copy/Paste, Restore/Put back/Redo UI, recurrence, PDF/watch export,
  modal polish, active-plan replacement semantics expansion, and broader generated-row mutation
  matrices remain intentionally out of scope.
- Starting a generated/preset plan from an existing `manual_user_built_plan_v1` now has a backend
  reviewed transition seam, not a manual authoring mutation and not a frontend calendar shortcut.
  Review is non-mutating; confirm revalidates selected-plan exactness plus active-plan revision,
  archives/supersedes the old manual active plan, activates the reviewed selected plan, preserves
  manual saved templates/history, and does not merge upcoming manual workouts into the
  generated/preset plan by default. Frontend saved-mode wiring and QA remain separate gates.
- Recurrence remains blocked until a separate batch-review architecture decision.

# Current Functional Map

Status: canonical freeze-readiness map
Last Updated: 2026-06-27
Owner: ARCHITECT

## Purpose

This map lists the real shipped or QA-accepted Hito business flows before code-freeze cleanup.
Cleanup audits should start from these product capabilities, not from file size alone.

Use this document to decide whether code is:

- required by a current shipped/accepted flow
- required only as validation or proof infrastructure
- compatibility-only and safe to narrow later
- future-only and not allowed to justify runtime bloat
- suspect and requiring a targeted audit before deletion

## Source Hierarchy

Permanent current docs still own broad product and system truth:

- [docs/current-product.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-product.md)
- [docs/current-system.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-system.md)
- [docs/current-state.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/current-state.md)
- [docs/history/changelog.md](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/history/changelog.md)

Active execution plans remain the source for in-progress gates:

- [admin UI capture and backlog plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-05-25-admin-ui-capture-and-backlog-plan.md)
- [manual workout authoring plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md)
- [running plan creation engine rebuild](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md)
- [Hito DS IA and specimen contract](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Hito docs and artifact compression](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-20-hito-docs-and-artifact-compression.md)

Product-contract references:

- [archived Hito stack simplification strike](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md)
- [archived Hito DS workout-library calendar/detail playground history](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-09-hito-ds-workout-library-calendar-detail-playground.md)
- [unified plan creation lifecycle](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md)
- [universal selected-distance no-dead-end taxonomy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md)
- [manual user-built plan flow spec](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md)
- [manual workout constructor taxonomy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md)
- [Marathon Completion selected-plan family contract](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-11-marathon-completion-selected-plan-family-contract.md)

Cleanup rule:

Do not delete or demote code because it looks large. First map it to one of the flows below.
If a file supports no current flow, no accepted validation gate, and no explicit future-only artifact,
then it becomes a deletion/demotion candidate.

## Business-Flow Source-Of-Truth Audit — 2026-06-24

Root-cause decision:

Hito should be audited as one calendar, not as separate manual/generated/imported/preset products.
A plan is bulk scheduled workout creation on that calendar. After a row is scheduled, source kind is
provenance and safety metadata; runner actions should be driven by row state, backend capabilities,
history/evidence protection, and explicit review/confirm boundaries.

Current flow count:

- User-facing plan creation has five supported runtime entry families:
  no-active structured/custom first-plan review, no-active selected-plan preset review, no-active
  empty manual calendar creation, advanced JSON import/paste, and active-calendar `Add plan`
  reviewed transition for selected running-plan candidates.
- Voice-to-plan / Dictate-to-Plan is retired from current runtime truth; it is not a visible
  onboarding caller, entitlement capability, or first-plan backend action.
- Workout creation has three current product meanings:
  bulk plan application into `planned_workouts`, manual calendar Add activity through the shared
  manual constructor/review/add seam, and copy/paste/reuse paths that reconstruct through the same
  manual draft/review model. FIT upload creates actual evidence/readback, not planned workouts.

Current canonical seams:

- No-active onboarding: `OnboardingGate` routes structured/custom, selected-plan presets, and empty
  manual calendar creation through first-plan/running-plan/manual backend actions.
- Active `Add plan`: `ActivePlanCreatePlanDialog` reviews a candidate plan through
  `active-plan-transition-actions.ts`; mutation requires explicit confirm and protects history.
- Advanced JSON import: `UploadJsonDialog` and backend `training-plan-v2` import policy remain a
  supported advanced lane with start-date and carry-forward safeguards. It is not the same UI seam
  as selected-plan transition and should stay visibly advanced.
- Calendar Add/Clear/Move/Edit/Copy: backend capability metadata and row state decide affordances;
  source kind is metadata/provenance except where an operation is intentionally scoped to manual
  reconstruction support.
- Workout detail and FIT feedback: logging and Garmin FIT/ZIP upload/readback live in the feedback
  lane; FIT files provide actual evidence and lap/record reality checks, not device-trusted workout
  intent labels.

Reality-check findings from the supplied FIT files:

- `/Users/ivan/Downloads/6a214c7570a5da09d440a1e3.fit` is a running activity of about 14.81 km /
  76.05 timer minutes with HR/cadence and a likely lap-derived interval structure: long warmup, five
  1.5 km faster reps with 0.5 km recoveries, and cooldown.
- `/Users/ivan/Downloads/21767983470_ACTIVITY.fit` is a running activity of about 4.85 km / 40
  timer minutes with HR/cadence and a likely 6 x 2 min work / 1 min recovery pattern after an easy
  opener.
- Neither file carries reliable explicit FIT workout-step labels, so Hito should keep comparing
  date/duration/distance/simple structure from backend-normalized evidence and treat
  warmup/work/recovery/cooldown labels as inferred, not device-provided truth.

Cleanup candidate matrix:

- Superseded source-proof note:
  the earlier `PlanManagementDialog` full-mode and old panel-owner finding is stale in current
  source. `PlanManagementDialog` now accepts only `edit-schedule` and `clear-upcoming`; JSON import
  is owned by `UploadJsonDialog`; export is owned by `AppShell` plus `plan-export-download`; and the
  old `ManualUserBuiltPlanPanel`, `PlanImportPanel`, `PlanExportMenu`, `PlanRefreshPanel`, and
  `PlanTextReplacementPanel` files are not current runtime owners.
- Completed backend gate — active-plan capability metadata vocabulary cleanup:
  backend source-capability readback now uses only current/future/past unlogged eligibility or
  blocked, and active-plan export `source_status` reuses the shared provenance resolver. `Calendar.tsx`
  still has one stale compatibility branch to remove as a frontend consumer cleanup.
- Accepted frontend/Hito DS cleanup:
  runner-facing and `/hitoDS` calendar wording no longer expose `empty` as a visible business state.
  Product and specimen language now uses Rest, No workout, and Rest or no-workout day, while internal
  `empty` may remain a technical state key only.
- Backend provenance alignment:
  export source-status readback now shares the active-plan editability provenance resolver, so manual,
  selected-plan, preset, refresh, and AI source-status metadata use one backend owner.
- Keep/defer candidates:
  manual template richness, FIT lap-detail normalization, and text/voice plan authoring are not
  deletion-safe in this pass; each needs its own owner because they touch training quality, evidence
  interpretation, or OpenAI behavior.

## Business Process And Entity Cleanup Map — 2026-06-25

Root-cause decision:

The current runtime should keep one canonical calendar pipeline:
`profile/input -> reviewed plan or workout draft -> plan_cycles/planned_workouts -> row-state
capabilities -> explicit risky mutation review -> workout_logs/provider evidence/readback`. Source
kind and source status are provenance/audit metadata, not separate runner-facing products.

| Process area | Current entrypoints | Canonical entities / metadata | Classification | Cleanup read |
| --- | --- | --- | --- | --- |
| First plan creation | Manual setup, structured Quick setup, selected-distance preset review, advanced JSON import | `runner_profiles`, `plan_cycles`, `planned_workouts`, review tokens/checksums, `source_kind`/`source_status` | Keep: user-facing and safety/audit | Multiple entrypoints are product choices, but persistence converges; no schema cleanup selected. |
| Active `Add plan` / replacement | Calendar `Add plan`, selected generated/preset transition, advanced import fallback | old/new `plan_cycles`, archive/supersession metadata, transition checksum/revision | Keep: safety/audit/recovery | No silent replace or clear-then-create shortcut; preserve history. |
| Calendar Add/Clear/Move/Edit | Calendar row menus, drag/drop, workout detail edit | `planned_workouts`, `sourceEditing`/`workoutEditing`, `active_plan_user_edit_v1`, `targetDayKind` | Keep with cleanup: backend vocabulary aligned; frontend consumer cleanup remains | Backend source-capability vocabulary cleanup is complete; one `Calendar.tsx` compatibility branch remains. |
| Manual authoring/templates/copy | Manual constructor, saved templates, copy/paste, persisted future edit | `runner_manual_workout_templates`, reviewed draft metadata, manual reconstruction metadata | Keep: user-facing/recovery | Do not raw-clone rows; template and copy metadata remain useful. |
| Workout detail/completion/FIT | Log result, Garmin/FIT/ZIP upload, comparison, AI insight | `workout_logs`, `workout_result_assets`, `workout_actual_metrics`, `workout_comparisons`, `workout_ai_insights` | Keep: evidence/audit/readback | FIT upload is actual evidence, not plan creation or planned-workout truth. |
| Generated plan engine / refresh | Structured authoring, selected plans, active-plan refresh proposal/apply | rich workout fields, `plan_preferences`, blueprint/refresh review metadata, source status | Keep with later review | Debug/proof metadata may be pruned only after validators and QA no longer consume it. |
| Admin/backlog import | Admin capture and repo-derived work items | `admin_capture_items`, markdown source path/type/status metadata | Keep: internal ops/source mirror | Not runner product truth; cleanup only through importer-safe Admin slices. |

| Entity / metadata group | Classification | Reason | Selected action |
| --- | --- | --- | --- |
| `source_kind`, `source_status`, `source_workout_id`, archive/supersession metadata | Keep: safety/audit/recovery | Needed for provenance, export/readback, protected history, and rollback reasoning. | Preserve. |
| review tokens/checksums, mutation checksums, `active_plan_user_edit_v1` | Keep: safety/audit/recovery | Proves explicit review/confirm, same-row move, no trusted-client-row mutation, and stale-token safety. | Preserve. |
| `targetDayKind: rest_day/workout_day` | Keep: product/view-model contract | Collapses no-row and explicit Rest targets into one public Rest-day target while preserving replacement review. | Preserve as canonical. |
| `target_had_no_persisted_workout_row` | Keep: internal exactness | Useful to distinguish missing persisted row from explicit Rest row without exposing a runner-facing Empty state. | Keep internal only. |
| Old missed-window source-capability vocabulary | Deleted/collapsed in backend | Current resolver uses current/future/past unlogged eligibility or blocked. | FRONTEND cleanup remains for one compatibility predicate. |
| Export source-status resolver duplication | Collapsed in backend | Export readback now reuses active-plan provenance resolver coverage. | Preserve shared resolver. |
| `/hitoDS` and shared calendar no-workout presentation | Keep: accepted presentation cleanup | Current product truth is Rest or Workout; visible `empty` language is removed, while internal `empty` may remain technical only. | Preserve Rest / No workout / Rest or no-workout copy. |
| Runner-facing internal proof metadata in review modals | Collapse candidate | Useful for QA/debug but noisy for runners. | Later FRONTEND cleanup; keep safety hidden or dev-only. |
| `completeTextOnboarding` saved-mode text replacement seam | Keep: backend non-default compatibility | No visible default route, but still documents the current free-text saved-mode replacement capability and uses the canonical structured/rich workout normalization path. | Preserve until a separate Product/Backend decision retires saved-mode text replacement. |
| `training-api.ts` wrappers | Keep: compatibility | Route-facing server-function facade still has current wrappers. | Narrow only with fresh import map. |

## Freeze Sequencing Decision

Refresh the business-flow map and continue code-freeze cleanup from proved behavior, not from raw
file size or proof-infrastructure momentum.

Decision:

Hito's business-flow map is current again for cleanup decisions, and the cleanup track is now on a
global teardown strategy. Universal active-plan Add/Clear/Move editability remains accepted only in
the proved capability-driven scope, Backend cleanup Slices 12A-12H and 13A-13I are complete, QA Slice
17A has accepted the current frontend source-action extraction, Slice G1 demoted stale active-plan
docs out of the active execution root, Slice G2 completed the runtime capability ownership audit,
Slice G2A removed the first bounded backend compatibility seam, Slice G6 archived the paused
`/test-calendar` sandbox plan, Slice G7 selected the next bounded backend import-map cleanup, Slice
G7A completed that cleanup, Slice G7B completed the helper-export cleanup, Slice G7C completed the
manual review/confirm facade export cleanup, Slice G8 completed the duplicate
`/hitoDS/export/figma` route-ownership cleanup, Slice G9 removed future-only admin UI placeholders,
Slice G13 made the work dashboard refresh path first-class and stale-resistant after G12 removed
no-caller first-plan/voice compatibility re-exports from `training-api.ts`, G16 removed untracked
duplicate-space local residue, G17 removed untracked legacy Plan Preset builder/review residue, G18
deleted tracked orphan `JsonImportPanel` residue, G19 deleted tracked orphan
`DictateToPlanPanel` residue, the source-size cleanup retired the remaining non-visible
voice-to-plan backend seam, G20 removed the
untracked duplicate-space manual-workout backlog markdown copy, G21 accepted the final codebase size
and dead-code teardown sweep, and G22 accepted the business-process short-path audit after folding in
current-state/dashboard source-of-truth sync.

Reason:

- Manual builder MVP behavior is shipped in the proved scope: first create, Add activity, personal
  saved templates, direct manual Copy/Paste, Delete/Clear, direct manual Move Workout, constructor UI,
  and JSON/Markdown export.
- The saved calendar is one active-plan surface. Add/Clear/Move eligibility is now row-state and
  backend-capability shaped: source kind is provenance, while logged/evidence/protected/occupied/rest
  state and backend policy decide affordances.
- Manual authoring still owns manual workout content, templates, and proved Copy/Paste; it does not
  own the general active-plan lifecycle gate for Add/Clear/Move across accepted plan sources.
- Manual constructor review/readback now uses backend-owned `constructorContract.timeline` for
  segment/repeat anatomy, frontend target controls are accepted, and backend v1 runner-entered
  target support is accepted for per-segment No target, pace exact/range, HR bpm cap/range, and
  RPE `0-10`. Unified block compatibility is accepted across manual review, persisted
  `planned_workouts.steps`, active-plan export, `training-plan-v2` parse/import, and provider
  comparison input. Backend `plan_goal_intent_v1` and frontend guided selected-plan readback are now
  accepted, including distinct runner-entered outcome pace and finish-time-derived pace as
  goal/review truth. The accepted child-first reducer covers readback/export/import/provider
  comparison. Backend has retired old flat segment-level `training-plan-v2` repeat fields, frontend
  runtime-visible repeat consumers now read through centralized child-first `children[]` helpers, and
  the 2026-06-28 Product-authorized legacy repeat data purge removed the remaining persisted
  pair-shaped repeat rows from Supabase project `dltfjwexyctmihclcjqj`. `planned_workouts.steps`,
  import/export, provider comparison input, manual reconstruction, and the runtime seed fixture now
  use ordered repeat `children[]`; `repeat_unit` / `recovery_unit` and persisted repeat sibling
  `work` / `recovery` compatibility are retired. Selected-plan draft internals may still use private
  `prescription.work` / `prescription.recovery` before review normalization, but canonical output
  maps to `prescription.children[]`. Generated-plan richness over accepted `planGoalIntent` and
  child-first blocks is backend / Running Coach / source-CLI-QA accepted with fresh 2026-06-28
  scenario artifacts. Quick setup browser/readback proof is now accepted for the OpenAI/local-fixture
  authored dated generated-plan path: 10K no-benchmark, Marathon target date/finish time, and Custom
  15K target date/finish time all preview/create saved plans with child-first repeats. Custom 15K
  persists as `distance_build`, Marathon persists as `marathon` / `target_time`, and neither path
  falls back to Marathon Base as current product truth. Generated-plan create-and-use browser proof
  is also accepted through first generated non-rest workout logging and saved completed-state
  readback. Garmin/FIT provider upload and deterministic planned-vs-actual comparison remain a
  separate later QA gate.
  Generated/default HR and fake/manual-inferred pace remain blocked.
- Running-plan universal runner-facing richness and executable prescription grammar is accepted;
  the old flat generated-plan quality blocker should no longer pause cleanup.
- Cleanup Slices 12A-12G and 13A-13I reduced proof-infrastructure hotspots without changing runtime
  behavior.
- Slice 12D extracted plan-authoring goal-family quality policy proof into
  `scripts/plan-authoring-doctrine/goal-family-quality-policy.ts` while preserving
  `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` as the stable public validator
  command.
- Slice 12E extracted plan-authoring metric-target/readback proof into
  `scripts/plan-authoring-doctrine/metric-target-readback.ts` while preserving the same stable
  public validator command.
- Slice 12F extracted plan-authoring rich-workout draft normalizer / compatibility proof into
  `scripts/plan-authoring-doctrine/rich-workout-draft-normalizer.ts` while preserving the same
  stable public validator command.
- Slice 12G split the AI first-plan proof owner by contract:
  `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-envelope.ts` is now a small compatibility
  facade, while production/default blueprint proof lives in
  `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts`, internal/non-default envelope
  proof lives in `scripts/plan-authoring-doctrine/ai-first-plan-envelope-proof.ts`, and genuinely
  shared fixtures/dependency wrappers live in
  `scripts/plan-authoring-doctrine/ai-first-plan-proof-shared.ts`.
- Slice 12H decomposed the AI first-plan ops diagnostic script:
  `scripts/author-ai-first-plan-draft.ts` remains the stable public CLI facade for
  `npm run author-ai-first-plan-draft`, while CLI parsing/help/mode/contract/fixture parsing lives
  in `scripts/ai-first-plan-draft-ops/cli.ts` and deterministic authoring fixtures live in
  `scripts/ai-first-plan-draft-ops/fixtures.ts`.
- Slice 13C extracted manual Copy/Paste proof into
  `scripts/manual-workout-authoring/copy-paste-proof.ts` while preserving
  `node --import tsx ./scripts/validate-manual-workout-authoring.ts` as the stable public validator
  command.
- Slice 13D extracted manual Delete/Clear proof into
  `scripts/manual-workout-authoring/delete-clear-proof.ts` while preserving the same stable public
  validator command.
- Slice 13E extracted manual Move proof into `scripts/manual-workout-authoring/move-proof.ts` while
  preserving the same stable public validator command.
- Slice 13F extracted manual persisted future workout edit proof into
  `scripts/manual-workout-authoring/persisted-edit-proof.ts` while preserving the same stable public
  validator command.
- Slice 13G extracted manual active-plan export proof into
  `scripts/manual-workout-authoring/export-proof.ts` while preserving the same stable public
  validator command.
- Slice 13H extracted manual first-create confirm persistence proof into
  `scripts/manual-workout-authoring/confirm-persistence-proof.ts` while preserving the same stable
  public validator command.
- Slice 13I extracted manual source editing capability readback proof into
  `scripts/manual-workout-authoring/source-capability-proof.ts` while preserving the same stable
  public validator command.
- QA Slice 17A accepted the frontend extraction for the manual source-action menu:
  `ManualWorkoutSourceActionMenu.tsx` is now the focused rendering/interaction owner for source-row
  Copy / Move / Clear actions, while backend seams remain the owners of mutation truth.
- Frontend Slice G5C implemented the naming/alias cleanup around that accepted owner:
  `Calendar.tsx` now imports/renders `ManualWorkoutSourceActionMenu` directly, the local calendar
  helper is source-action named, and the stale `ManualWorkoutCopyMenu` source alias/re-export has
  been removed. QA accepted the cleanup after proving Copy / Move / Clear behavior, mobile
  no-overflow, backend seam preservation, disposable cleanup, and no fake pace/personal HR signals.
- Slice G2 found that broad runtime deletion is not safe yet:
  `src/lib/training-api.ts`, `src/lib/active-plan-schedule-edit-preview.ts`,
  `scripts/validate-active-plan-schedule-edit-preview.ts`, and `src/lib/imported-plan.ts` all still map to current backend seams, validation proof, or
  compatibility-owned route imports.
- Slice G2 corrected current-doc drift around the removed strict nested AI first-plan module:
  `src/lib/ai-first-plan-draft-authoring.ts` no longer exists, and strict-draft references are
  bounded negative/unsupported handling rather than a runtime or doctrine module.
- Slice G2A removed the old Plan Preset review/confirm blocked actions from runtime:
  `src/lib/plan-preset-actions.ts` remains required for `getPlanPresetCards(...)`, while selected
  running-plan preview/confirm remains the current create/persist owner.
- Slice G4A narrowed the active-plan export compatibility facade:
  `/api/plan/export` now imports `exportActivePlanForUser(...)` from
  `src/lib/active-plan-export-actions.ts` directly, and `training-api.ts` no longer re-exports the
  active-plan export names.
- Slice G4B narrowed the Plan Preset card discovery compatibility facade:
  onboarding Plan Preset UI surfaces now import `getPlanPresetCards(...)` and
  `PlanPresetCardsActionResult` directly from `src/lib/plan-preset-actions.ts`, and
  `training-api.ts` no longer re-exports Plan Preset card discovery.
- Slice G4C narrowed the auth callback exchange compatibility facade:
  `/api/auth/confirm` now imports `exchangeCodeForSession(...)` directly from
  `src/lib/auth-actions.ts`, and `training-api.ts` no longer re-exports the auth callback exchange.
- Slice G4D narrowed the Open plan refresh/schedule-edit type compatibility facade:
  Open plan components now import refresh/schedule-edit contract types directly from
  `src/lib/active-plan-refresh-contract.ts` and
  `src/lib/active-plan-schedule-edit-preview.ts`, while `training-api.ts` keeps the live runtime
  server-function wrappers but no longer re-exports those type-only compatibility names.
- Slice G4E narrowed the next settings/first-plan/selected running-plan type compatibility facade:
  UI surfaces now import those contract types directly from canonical owner modules, and
  `training-api.ts` no longer re-exports the selected or bundled same-class type-only
  compatibility names.
- Slice G5A removed the legacy MJS text-authoring ops fallback after final import/reference proof
  found no live owner.
- Slice G5B deleted the orphaned onboarding `JsonImportPanel` after final source/import proof found
  no live source import; current advanced JSON import is owned by `UploadJsonDialog`.
- Post-G5B reassessment was resolved through Slices G4D and G4E: proved type-only
  `training-api.ts` compatibility exports were removed while runtime server-function wrappers stay in
  the facade.
- Slice G4F hardened the historical `import:current-plan` ops seam: the package command no longer
  carries a hardcoded local Downloads plan path, no-argument/default execution is non-mutating help,
  dry-run validates a provided `training-plan-v2` seed without opening a Supabase client, and
  `--apply` is blocked unless the target is explicit local loopback Supabase.
- Slice L1 implemented the DEVTOOLS-class local artifact hygiene dry-run reporter:
  `npm run artifact:hygiene` inventories `logs/`, build/server log residues, and generated
  `test-results/` without deletion; `qa-artifacts/` remains protected evidence and is counted only
  with explicit opt-in as non-disposable.
- Slice G5D narrowed the manual-authoring type-only facade:
  component type imports for `ManualWorkout*` and `ManualEmpty*` contracts now use
  `src/lib/manual-workout-authoring` or `src/lib/manual-workout-authoring/schema`, while runtime
  manual server-function/action imports remain in `training-api.ts`.
- Slice G5E canonicalized local ops plan-seed / structured-authoring ownership:
  `import-current-plan`, `author-structured-plan`, and `test-user` now load canonical TypeScript
  owners instead of duplicate `.mjs` helper modules; public command names and non-mutating safety
  defaults were preserved.
- Slice G5F consolidated local ops plan-apply/readback ownership:
  `import-current-plan`, `author-structured-plan`, and `test-user --plan` now share a narrow
  ops-local helper for profile / plan cycle / planned workout apply and readback, while the
  entrypoints keep their own mutation-safety gates.
- Slice G6 archived the paused `/test-calendar` sandbox plan from active execution after source
  evidence confirmed TC1/TC2 are accepted, no TC3 is selected, and the Hito DS IA plan owns the
  active DS/specimen/Figma bridge track.
- Slice G7 accepted the post-G6 cleanup reassessment from the compact active-plan root:
  broad `training-api.ts` cleanup remains unsafe, manual/Hito DS/admin cleanup remains
  browser-sensitive or separately owned, generated/log cleanup remains dry-run only, and the next
  selected gate is a narrow backend import-map batch for two proved `training-api.ts` sub-seams.
- Slice G7A completed the narrow import-map cleanup: `training-api.ts` no longer re-exports
  `persistImportedPlanForCurrentRequest` or `saveUserSettings`, and the settings route imports the
  save action from `src/lib/user-settings-actions.ts` while keeping `getSettingsRouteData` in the
  route-facing facade.
- Slice G7B completed the bounded backend helper-export cleanup: `training-api.ts` no longer exports
  the no-caller `archiveActivePlanForUser`, `clearUpcomingScheduleForUser`, or
  `applyActivePlanRefreshProposalForUser` compatibility names. Canonical user-scoped helper
  ownership remains in `src/lib/active-plan-lifecycle-actions.ts` and
  `src/lib/active-plan-refresh-actions.ts`.
- Slice G7C completed the bounded manual-authoring review/confirm facade cleanup: `training-api.ts`
  no longer re-exports the no-caller `reviewManualWorkoutCopyPasteDraft`,
  `confirmManualWorkoutCopyPasteDraft`, `reviewManualWorkoutMove`, or `confirmManualWorkoutMove`
  compatibility names. Canonical review/confirm ownership remains in
  `src/lib/manual-workout-authoring`, while direct Copy/Paste and Move runtime wrappers remain in
  the facade.
- Post-G7C source-proof reassessment kept broad `training-api.ts` cleanup blocked and selected
  FRONTEND/DS Slice G8. G8 is now QA-passed: the duplicate inline `/hitoDS/export/figma` fallback
  was removed from `src/routes/hitoDS.tsx`, while the dedicated file route and export-board
  component remain the canonical export surface.
- G9 is QA-passed: future-only disabled admin placeholders (`Add user`, `Account settings / Soon`)
  were removed from current admin runtime surfaces without changing backend/admin mutation truth.
- Post-G9 reassessment kept broad `training-api.ts` cleanup blocked, kept browser-sensitive UI
  cleanup deferred, kept artifact/log deletion deferred, adopted `cleanup-burndown-v1`, and selected
  BACKEND/OPS Slice G10 for the remaining stale `scripts/author-plan-from-text.mjs` entrypoint.
- G10 is complete: the stale `scripts/author-plan-from-text.mjs` entrypoint was deleted while the
  TS-backed `npm run author-plan-from-text` command stayed canonical.
- G11 is complete: duplicate-space local ops residue files were deleted while canonical
  `scripts/import-current-plan.mjs`, `scripts/validate-plan-preset-eligibility.ts`, and
  `scripts/author-plan-from-text.ts` owners remain preserved.
- G12 is complete: no-caller first-plan/voice compatibility re-exports were removed from
  `training-api.ts` while canonical `src/lib/first-plan-actions.ts` ownership remains preserved.
- G13 is complete: dashboard refresh now has first-class package-script aliases over the existing
  `scripts/hito-work-dashboard.mjs` helper, and `docs/work-dashboard.md` was regenerated from active
  plan truth.
- Post-G13 reassessment initially put cleanup in source-proof holding; a later service-wide UI
  consistency audit found one bounded shared-owner DS adoption candidate and selected FRONTEND UI-C1
  for the selected running-plan preview calendar.
- G14 is complete: the global business-flow teardown matrix mapped major Hito business flows to
  canonical owners, found no product-runtime deletion batch, and confirmed FRONTEND UI-C1 as the
  first execution batch after the matrix.
- A completed service-wide Designer audit accepted the same first batch: no broad redesign is
  justified, `/hitoDS` remains the DS/specimen owner, and selected-plan preview calendar is the
  safest first runtime DS-adoption cleanup seam.
- UI-C1 is QA-passed and accepted: selected-plan preview now uses the shared Hito calendar-day
  primitive, source proof found no `PreviewCalendarCell` or `hito-selected-plan-calendar-cell`
  refs, browser QA proved no-benchmark and benchmark selected-plan preview rows at desktop and
  `375px`, and disposable cleanup returned scoped data to zero/absent.
- G15 is complete: deletion-only orphan legacy MJS ops helper residue under `scripts/lib/` was
  removed after source/import proof confirmed current package commands use TS-backed or ops-local
  owners.
- G16 is complete: deletion-only local duplicate-space residue cleanup removed the untracked
  duplicate-space files after source/import proof confirmed canonical owners are unchanged.
- G17 is complete: untracked legacy Plan Preset builder/review residue under
  `src/lib/plan-presets/` and `scripts/plan-presets/` was deleted after source/import proof
  confirmed current Plan Preset truth is card discovery only and selected-plan preview/create owns
  plan creation.
- G18 is complete: tracked orphan `JsonImportPanel` residue was deleted, and current JSON import
  behavior is now owned by `UploadJsonDialog`.
- Post-G18 reassessment selected FRONTEND G19 for tracked orphan `DictateToPlanPanel` UI residue.
  Fresh source proof found no live source/package/script caller outside the file itself.
- G19 is complete: tracked orphan `DictateToPlanPanel` residue was deleted. The later source-size
  cleanup also retired the non-visible backend voice-to-plan seam, entitlement capability, and
  validator proof branch.
- Post-G19 reassessment selected ARCHITECT G20 for untracked duplicate-space manual-workout backlog
  markdown cleanup after admin-mirror proof.
- G20 is complete: the untracked duplicate-space manual-workout backlog markdown copy was deleted,
  while the canonical tracked backlog item and admin importer contract were preserved.
- G21 is complete: the final codebase size and dead-code teardown sweep measured the current text
  baseline, confirmed no safe backend/runtime or frontend/browser-sensitive deletion batch, and
  selected G22 for a final business-process short-path audit after current-state/dashboard sync.
- G22 is complete: the business-process short-path audit confirmed broad runtime/frontend deletion
  remains unsafe, folded in the current-state/dashboard source-of-truth sync, and selected BACKEND
  G23 for first-plan/selected-plan `training-api.ts` passthrough narrowing.
- G23 is complete: `OnboardingGate` imports first-plan and selected-plan runtime actions directly
  from canonical action modules, and `training-api.ts` no longer re-exports those four passthrough
  actions.
- The no-active-plan onboarding IA/runtime blocker around `isManualProfileReady` is not marked as
  accepted by this map because the inspected docs did not provide an explicit latest QA closeout for
  that blocker.
- Persisted future manual workout-content edit is QA-passed for eligible future manual planned rows
  through backend review/confirm and workout-detail `Edit training`.
- Universal Copy/Paste, recurrence, runner-facing persisted workout editing, Restore UI,
  active-plan replacement expansion, and generated-row content editing / Copy-Paste beyond proved
  row-state Move/Clear/drag slices remain future-only.
- QR/share/import remains future-only and must not be selected as immediate implementation during
  this freeze-readiness pass.
- Stable cleanup burndown `cleanup-burndown-v1` is now the progress source: fixed denominator `40`
  bounded cleanup gates, `40` completed through G23, `0` remaining, and `100%` gate-burndown
  complete. The burndown is a sequencing metric, not a source-line reduction claim.
- Generated/cache/vendor/build/log/artifact roots must stay out of product-code size claims:
  `logs`, `qa-artifacts`, `test-results`, `node_modules`, and build/cache directories are counted
  separately.

Immediate docs/artifact compression gate:

Holding for the separate Hito Docs and Artifact Compression track.

G23 is accepted and the simplification strike is archived. The cleanup ledger is `40/40` complete,
`0` remaining, `100%`. Product opened a separate docs/artifact compression track. D1-D4, D12-D19,
D21-D24, and D26-D28 are accepted net-negative docs-size-reduction batches; D5-D10 are accepted
Admin importer metadata-quality hygiene and must not be counted as compression wins. The artifact
lane now has an accepted local QA evidence policy, quarantine/apply tooling for manifest-safe
classes, and QA-passed manual-workout image compression through E13/E14. The active compression plan
is intentionally holding until a fresh dry-run manifest and targeted estimate prove one material
same-owner candidate with one risk class and one validation story. Broad `training-api.ts`, manual
calendar runtime UI, admin table primitives, Hito DS feature work, validation thinning, live OpenAI
calls, Supabase mutation, log deletion, generated/vendor residue cleanup, and additional
`qa-artifacts/` cleanup remain deferred unless that track explicitly scopes a safe gate.

## Shared Calendar And Mutation Ownership

- The saved calendar is now the shared active-plan viewing surface for manual, selected/generated,
  Plan Preset, imported, and AI-assisted active plans.
- Viewing is shared; Add/Clear/Move mutation eligibility is backend-shaped and capability-driven.
- [active-plan workout editing policy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-workout-editing/policy.ts)
  owns the accepted active-plan source list, supported edit operations, and
  `active_plan_user_edit_v1` metadata shape for user-added, user-cleared, and user-moved workouts.
- Manual workout authoring still owns workout-content construction, personal templates, and
  Copy/Paste reconstruction; it no longer owns whether the original active-plan source is editable
  for Add/Clear/Move.
- Backend may still return `not_editable`-style blocked capability for a specific source, row, date,
  protected state, legacy metadata shape, logged/evidence-backed workout, occupied target, stale
  review, or unsafe reconstruction. Frontend must render those backend-shaped capabilities and must
  not infer mutation rights from source kind locally.
- Universal Copy/Paste is not shipped yet; Copy/Paste remains accepted for the proved manual path.

## Active-Plan Creation Paths

- Structured / AI-assisted first plan creates backend-reviewed `training-plan-v2` plans through the
  first-plan review/confirm seam.
- Selected-distance running plans create accepted selected-plan families through backend preview,
  review token/checksum, server-side rebuild, and active-plan persistence.
- Plan Presets expose discovery cards for the three shipped starter families, then hand selection
  to the selected-distance running-plan preview/create seam.
- Manual user-built plans create `manual_user_built_plan_v1` active plans from reviewed manual
  workouts; later Add/Clear/Move edits use the same active-plan edit metadata model as other accepted
  active-plan sources without rewriting the original plan source.
- Starting a selected generated/preset plan from an existing active manual plan now has a
  backend-owned reviewed transition seam: review is non-mutating, confirm revalidates selected-plan
  exactness plus active-plan revision, archives/supersedes the old manual active plan, and activates
  the new selected plan without merging upcoming manual workouts.
- Advanced JSON import/replacement remains an advanced fallback and migration path.

## Flow Map

| Flow | Runner-facing capability | Status | Backend owner/seam | Frontend owner/surface | Persisted entities | Proof status | Future-only boundaries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| No-active-plan entry | Signed-in runners without an active plan see creation choices instead of silent preview assignment. | Shipped for the accepted creation choices; latest no-active-plan IA blocker is not marked accepted here without explicit QA closeout | `src/lib/route-data-actions.ts`, `src/lib/first-plan-actions.ts`, `src/lib/training-api.ts` wrappers | `src/components/OnboardingGate.tsx`, onboarding components | `runner_profiles`, `plan_cycles`, `planned_workouts` only after confirm | Changelog-backed saved-mode and onboarding history; no explicit inspected QA closeout for the `isManualProfileReady` blocker | No silent plan creation; no active-plan replacement without explicit action; do not treat unresolved IA/runtime blockers as cleanup-safe |
| Structured first plan / AI-authored blueprint draft | Runner enters profile/goal/training context in Quick setup, reviews a backend-shaped draft, then confirms. AI may draft under backend constraints. | Shipped for the current visible structured Quick setup path; Dictate-to-Plan / voice transcript assist is retired from current product truth | `src/lib/first-plan-actions.ts`, `src/lib/structured-first-plan-onboarding.ts`, `src/lib/ai-first-plan-blueprint-*`, `src/lib/active-plan-persistence.ts` | `src/components/OnboardingGate.tsx`, `src/components/onboarding/StructuredPlanConstructor.tsx` | `runner_profiles`, `plan_cycles`, `planned_workouts` | Validators under `scripts/validate-plan-authoring-doctrine.ts`; changelog entries through 2026-06-10 | No AI direct persistence; no fake pace from target time; no fake personal HR; strict draft/envelope ops seams are not normal UI; no voice-to-plan / AI setup path unless a future Product/Backend/Frontend gate rebuilds and QA-accepts it |
| Selected-distance plan creation | Runner can create accepted selected-distance plans after preview/review/create. | OpenAI/local-fixture-authored dated Quick setup path is accepted for 10K no-benchmark, Marathon target-time, and Custom 15K target-time; deterministic distance builders are validator/dev scaffolding or legacy discovery context, not normal generated-plan product truth | `src/lib/running-plan-engine-actions.ts`, `src/lib/running-plan-engine-review.ts`, `src/lib/ai-generated-running-plan.ts`, `src/lib/active-plan-persistence.ts`; `src/lib/plan-creation-engine/*` remains validator/dev/legacy family policy support | `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`, onboarding selected-plan UI | `runner_profiles`, `plan_cycles`, `planned_workouts` after confirm | QA browser/readback artifact `qa-artifacts/screenshots/2026-06-30/openai-authored-dated-readback-cleanup-qa-rerun/`; generated-plan validators and child-first readback proof | Do not call AI at confirm; do not persist raw AI output; do not turn outcome pace into executable workout pace; do not treat Marathon Base as current marathon target-time truth |
| Plan Presets | Runner can use 10K Foundation, Half Marathon Balanced, or Marathon Base cards as non-mutating discovery into selected running-plan preview/create, including saved-mode active-manual transition discovery. | Shipped as discovery; creation is owned by the running-plan engine or active-plan transition seam | `src/lib/plan-preset-actions.ts` keeps `getPlanPresetCards(...)`; selected create/review/confirm lives in running-plan engine actions/review; active-manual replacement uses `src/lib/active-plan-transition-actions.ts` | Preset cards in onboarding plus selected-plan preview dialog and future saved-mode `Create a plan` transition UI | Card discovery does not persist; selected running-plan confirm persists `runner_profiles`, `plan_cycles`, and `planned_workouts` only when no active plan exists; active manual transition archives/supersedes through reviewed confirm | Changelog 2026-06-07 history plus later selected-plan create proof; Slice G2A removed old Plan Preset review/confirm blocked actions; saved-mode card discovery no longer has an active-plan read gate | No new preset families; no Plan Preset active-plan replacement; no legacy Plan Preset review/confirm creation seam; no direct selected-plan confirm while an active plan exists |
| Active manual plan -> selected generated plan transition | Runner can be shown a backend-shaped impact review for replacing an active manual plan with a reviewed selected generated/preset plan; frontend wiring/QA remains separate. | Backend seam implemented / QA pending / not runner-facing shipped | `src/lib/active-plan-transition-actions.ts`, `src/lib/running-plan-engine-review.ts`, `src/lib/active-plan-persistence.ts` | Future saved-mode `Create a plan` transition UI | Old `plan_cycles` row archived/superseded; new selected plan persisted as active; manual templates remain user-library rows | `scripts/validate-running-plan-engine-confirm.ts` transition proof | No silent replacement; no clear-then-create shortcut; no merge of upcoming manual workouts; no deletion of logs/evidence/comparisons/protected history |
| Manual first create | Runner chooses `Build my plan myself`, reviews one workout, and creates a manual active plan. | Shipped | `src/lib/manual-workout-authoring/actions.ts`, `persistence.ts`, `review-exactness.ts`, `active-plan-persistence.ts` | `OnboardingGate.tsx`, shared manual controls | `runner_profiles`, `plan_cycles`, `planned_workouts` | `scripts/validate-manual-workout-authoring.ts`; browser/DB proof; changelog 2026-06-10 | Do not persist empty active manual plans silently |
| Active-plan Add activity | Runner adds a reviewed user-authored workout to an eligible today-or-future Rest/no-workout date in an accepted active plan. | Shipped in proved manual and non-manual Add scope | `src/lib/active-plan-workout-editing/policy.ts`, `src/lib/manual-workout-authoring/active-plan-add.ts`, `actions.ts`, `review-exactness.ts` | `src/components/Calendar.tsx`, `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`, `manual-workout-authoring-utils.ts` | Existing `plan_cycles`; new `planned_workouts` rows with `active_plan_user_edit_v1` metadata | Manual browser/DB proof plus universal editability QA; changelog 2026-06-11 and 2026-06-12 | No frontend row append; no unproved source/row mutation; no universal Copy/Paste |
| Personal saved templates | Runner saves a reviewed manual workout as a personal template and reuses it from Add activity. | Shipped in scoped first-create and existing-plan Add paths | `src/lib/manual-workout-authoring/saved-templates.ts`, `saved-template-repository.ts`, review reconstruction through manual authoring | Manual save modal and template picker in shared controls | `runner_manual_workout_templates`, `planned_workouts` when later confirmed | Browser/DB proof; changelog 2026-06-11 | No organization/coach templates; no frontend-owned template rows |
| Manual Copy/Paste | Runner copies a manual workout and pastes it onto an eligible target day through direct backend mutation without a runner-facing review dialog. | Shipped in the proved manual scope | `src/lib/manual-workout-authoring/copy-paste.ts`, `copy-paste-reconstruction.ts`, `active-plan-add.ts` | `Calendar.tsx` occupied-day menu and Add/Paste menu | Existing `plan_cycles`; new `planned_workouts` rows | Backend live proof plus browser/DB proof; changelog 2026-06-11 and direct-edit update 2026-06-13 | No raw row duplication; no recurrence; no move disguised as copy/delete; no universal Copy/Paste across generated/selected/preset/imported plans |
| Active-plan Delete/Clear | Runner clears an eligible unlogged planned workout after backend-shaped review; active plan remains active. Source kind is provenance, not the row lifecycle gate. | Shipped in proved manual and non-manual Clear scope | `src/lib/active-plan-workout-editing/policy.ts`, `src/lib/active-plan-workout-editing/source-capabilities.ts`, `src/lib/manual-workout-authoring/delete-clear.ts`, `review-exactness.ts`, `persistence.ts` | `Calendar.tsx`, `ManualWorkoutAuthoringControls.tsx` review dialog | Existing `planned_workouts` row removed; metadata updated with `active_plan_user_edit_v1` | Manual browser/DB proof plus universal row-state editability proof; changelog 2026-06-12 | Restore/Put back/Redo UI is not shipped; logged/evidence-backed/protected/occupied/rest rows remain blocked |
| Active-plan Move Workout | Runner moves an eligible unlogged planned workout from a past, today, or future source date to today or a future Rest/no-workout target through direct backend mutation; source kind is preserved as provenance while completion/evidence state owns row eligibility. | Shipped in proved manual and selected/generated row-state scope | `src/lib/active-plan-workout-editing/policy.ts`, `src/lib/active-plan-workout-editing/source-capabilities.ts`, `src/lib/manual-workout-authoring/move-workout.ts` | `src/components/Calendar.tsx`, `src/components/manual-workout/ManualWorkoutMoveControls.tsx`, existing manual controls/utils | Existing `planned_workouts` row date/weekday/week update; original plan source preserved | Manual browser/DB/mobile/WebKit proof, direct-move proof, missed-unlogged proof, selected/generated direct move proof, and universal row-state editability validator | No swap, no batch move, no recurrence, no runner-facing content edit without editor support, no Restore UI, no QR/share/import, no frontend copy+delete, no local schedule truth |
| Persisted manual workout edit | Runner edits eligible future manual planned rows through backend review/confirm from workout detail. | QA-passed for eligible future manual rows | `src/lib/manual-workout-authoring/edit-workout.ts`, `edit-workout-review-token.ts`, active-plan editability policy | Workout detail `Edit training` action plus manual constructor/editor reuse | Same `planned_workouts` row updates after accepted confirm | Manual plan closeout records backend implementation, frontend wiring, and QA acceptance | No generated/selected/preset/imported content editing; no frontend-only editor; no today/past/logged/evidence-backed/protected edits; no fake pace or fake personal HR |
| Active plan viewing | Runner sees the shared saved calendar, workout detail, progress, and result state for any active plan source. | Shipped | `src/lib/training.ts`, `src/lib/route-data-actions.ts`, `src/lib/workout-log-actions.ts`, feedback/import modules | `src/components/Calendar.tsx`, `src/routes/workout.$date.tsx`, `src/routes/progress.tsx`, `src/components/CompletionPanel.tsx` | `plan_cycles`, `planned_workouts`, `workout_logs`, provider evidence tables | Changelog-backed saved-mode, Garmin feedback, target-display QA, manual builder browser/DB proof | Do not move schedule truth into frontend; viewing all sources does not imply all sources are manually editable; `/hitoDS` specimens are not product behavior |
| Calendar plan actions | Runner uses one calendar header: primary `Add plan` plus overflow utilities (`Export JSON`, `Edit schedule`, `Clear upcoming schedule`). | Shipped IA | `src/lib/active-plan-lifecycle-actions.ts`, `active-plan-export-actions.ts`, schedule-edit preview/apply seams, active-plan transition seams | Calendar/header plan action controls, `PlanManagementDialog.tsx`, `src/components/plan-management/*` as implementation modules | `plan_cycles`, `planned_workouts`, `workout_logs` | One-calendar IA QA passed; source/docs scan now treats old labels only as historical or explicitly rejected language | No `Open plan` concept, no visible `Update plan`, no `Delete active plan`, no silent replacement |
| Clear upcoming schedule | Runner can clear upcoming mutable schedule while archived/protected history remains preserved. | Shipped overflow utility | `src/lib/active-plan-lifecycle-actions.ts` | Overflow clear-upcoming control; `PlanLifecycleControls.tsx` as implementation module | `plan_cycles` archived; protected past/logged truth preserved | Current-product backed | No half-active truncated plan state; no hard deletion of history |
| Advanced JSON import / replace | Runner can import an existing `training-plan-v2` artifact as advanced fallback, with backend start-date policy. | Shipped | `src/lib/imported-plan.ts`, `src/lib/plan-replacement-actions.ts`, `src/lib/active-plan-persistence.ts` | `UploadJsonDialog.tsx`, advanced onboarding/import UI | `runner_profiles`, `plan_cycles`, `planned_workouts` | Doctrine/import validators; current-product backed | Legacy `week_1_preview[]` removed; no share/import-from-QR yet |
| Text replacement / refresh | Saved-mode text replacement and refresh remain backend review/apply seams; visible `Update plan` is not part of the accepted calendar header IA. | Backend seams preserved / not current visible header action | `src/lib/plan-replacement-actions.ts`, `active-plan-refresh-actions.ts`, `active-plan-refresh-draft.ts`, AI proposal modules | No current visible plan-management panel owner | Archive/replace plan rows only after apply | Doctrine validators; current-product backed | No AI direct mutation; no silent refresh apply; do not invent a runner-facing Update Plan surface |
| JSON export | Runner exports persisted active plan JSON from the calendar overflow. Manual plans are proven. | Shipped for authenticated active-plan export including manual plan proof | `src/lib/active-plan-export-actions.ts`, `src/lib/plan-export.ts` | `AppShell.tsx`, `plan-export-download.ts` | Reads active `plan_cycles` and `planned_workouts`; no mutation | Browser/download/DB proof; changelog 2026-06-12 | Markdown/PDF/watch export, public links, QR, import-from-export, and mobile deep links remain outside current header IA |
| QA server lifecycle | QA uses one canonical built local server to prove browser behavior. | Shipped internal process | `scripts/qa-local-server.mjs`, build/finalize scripts | Browser QA only | None | Reused in browser QA reports | Do not start duplicate app servers unless required |
| Admin work items | Admin can see repo-derived work items and quick notes in one Work Items surface. | Shipped internal/admin | `src/lib/admin-capture*`, `scripts/import-repo-work-items-to-admin-backlog.ts` | `src/routes/admin.capture.tsx`, admin shell | `admin_capture_items` | Importer dry-run/live proof; admin QA | Not a substitute for changelog or markdown source truth |
| Future exchange / share | QR/share/import model for Hito plan exchange. | Future-only | Architecture contract not accepted yet | No frontend implementation | Unknown; do not add tables yet | None | QR, public/private links, import from share, applying someone else's plan, expiry/revocation remain future-only |

## Cleanup Audit Inventory

### Global Simplification Baseline — 2026-06-15

Main counted text surface excludes generated/cache/vendor/build/log/artifact roots such as `logs`,
`qa-artifacts`, `test-results`, `node_modules`, `.next`, `.turbo`, `dist`, `build`, and coverage
folders.

| Area | Files | Lines / size | Classification |
| --- | ---: | ---: | --- |
| Main counted text surface | `624` | `261277` lines | Source/docs/scripts/config/agent/template text surface after G21 final sweep and exclusions |
| `src` | `299` | `119629` lines | Runtime, admin, Hito DS, and checked-in source data |
| `scripts` | `51` | `34066` lines | Validators, proof harnesses, importers, ops scripts |
| `docs` | `196` | `88955` lines | Current docs, active/archive plans, backlog/spec/source-of-truth docs |
| Other project text | `72` | `7729` lines | Agent, skill, SQL/config/template, and root supporting text outside the main roots |
| `docs/plans/active` | `5` | `10861` lines | Active execution root after G6 paused-sandbox archive |
| `docs/plans/archive` | `72` | `38737` lines | Historical plan evidence |
| `docs/tasks/backlog` | `41` | `8884` lines | Backlog/future work items, including G1-demoted plans |
| `logs` | `525` | `300862` text lines / about `20.7MB` | Gitignored generated/local logs and finalized build output |
| `qa-artifacts` | `2581` | `3175105` text lines / about `665MB` | Gitignored proof output; retention policy required before deletion |
| `test-results` | `1` | `4` lines | Generated test residue |
| `node_modules` | `49347` | about `1.07GB` | Vendor dependency tree |

### Generated Artifact And Log Retention Policy — 2026-06-16

Generated/proof roots are not product runtime and must not be included in source-size or
service-size claims unless a task explicitly scopes local artifact hygiene.

| Root / surface | Classification | Source audit treatment | Retention / deletion rule |
| --- | --- | --- | --- |
| `logs/` | generated local/dev/build/server logs | Exclude from source, docs, scripts, and runtime counts. Inspect only for an explicit logging, QA-server, or local disk-hygiene task. | L1 reporter classifies recent logs with a `7` day threshold and old logs with a `30` day threshold. No deletion is approved by this policy-only pass; deletion/apply mode needs a separate explicit DEVTOOLS retention slice and must preserve active bug, QA blocker, incident, and release proof references. |
| Build/server logs outside `logs/` | generated operational output | Treat like `logs/` when the files are local run output; do not count as product source. | Move under the log-retention rule before deletion. Preserve active QA-server status/PID/current-run evidence until the managed server is intentionally restarted or stopped. |
| `qa-artifacts/` | local QA proof output / acceptance evidence | Exclude from product-code counts. Reference as proof when a QA report cites it, but do not scan by default in cleanup audits. | Do not delete until a separate QA evidence retention policy exists. If evidence must become permanent, promote selected screenshots/reports into a tracked `docs/process/...` evidence path through a dedicated task. |
| `test-results/` | generated test-runner residue | Exclude from product-code counts. Inspect only when debugging a current test run. | Disposable in a future DEVTOOLS cleanup if not referenced by an active QA failure or test report. |
| `node_modules/` | vendor dependency tree | Always exclude from source-size claims and cleanup hotspot rankings. | Package manager owns this tree; do not manually prune as product cleanup. |
| Build/cache roots such as `.next/`, `.turbo/`, `dist/`, `build/`, and coverage folders | generated build/cache/coverage output | Exclude from source-size claims and cleanup rankings unless a build-output task explicitly scopes them. | Recreate through build/test tooling. Deletion is local hygiene only and must not be reported as product-code simplification. |

Agent audit guidance:

- Cleanup/source audits should default to excluding `logs/**`, `qa-artifacts/**`, `test-results/**`,
  `node_modules/**`, `.next/**`, `.turbo/**`, `dist/**`, `build/**`, and coverage roots.
- Service-size reports must separate product/runtime/docs/scripts from generated/proof/vendor roots.
- Generic cleanup agents must not delete QA evidence. `qa-artifacts/` deletion needs a dedicated QA
  evidence retention contract first.
- Log retention is a later DEVTOOLS cleanup slice, not the immediate source-of-truth cleanup gate.

Largest counted source/doc/script hotspots:

| File | Lines | Classification |
| --- | ---: | --- |
| [archived Hito stack simplification strike](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/archive/2026-06-07-hito-stack-simplification-strike.md) | completed `40/40` cleanup ledger | archived cleanup history; no active gate owner |
| [global styles](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css) | `5172` | required DS/global runtime; future DS cleanup only with visual proof |
| [Hito DS route](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx) | `4505` | internal reference route; keep under DS IA rollout |
| [manual authoring plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md) | `3476` | required active manual-authoring source |
| [running-plan rebuild plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md) | `2756` | required active selected-plan/running-engine source |
| [admin analytics route](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx) | `2393` | admin runtime hotspot; audit later |
| [admin capture route](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx) | `2125` | admin runtime hotspot; audit later |
| [AI first-plan blueprint proof](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts) | `1844` | focused proof owner; keep |
| [repo work-item importer](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/scripts/import-repo-work-items-to-admin-backlog.ts) | `1798` | admin mirror tooling; keep |
| [manual authoring controls](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx) | `1694` | required runtime UI; decompose later only with browser QA scope |
| [active-plan schedule edit preview](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-schedule-edit-preview.ts) | `1591` | current docs/UI imports still reference it; keep |

Stable cleanup burndown:

- Ledger: `cleanup-burndown-v1`.
- Fixed denominator: `40` bounded cleanup gates.
- Completed through G23: `40` gates.
- Remaining after G23: `0` gates.
- Current gate-burndown completion: `100%`.
- Future cleanup reports should update the completed/remaining counts by delta instead of
  recalculating rough percentages from line-count impressions.
- The previous `48%`, `35-40%`, and `11-19` estimates are retired for progress reporting.
- Runtime/frontend cleanup remains intentionally conservative; shipped manual builder and active-plan
  calendar behavior should not be refactored without a dedicated QA-safe frontend cleanup slice.

### Backend and Script Files Likely Required

These files map directly to shipped/accepted flows or active validation gates and should not be
deleted without replacement proof:

- `src/lib/active-plan-persistence.ts`
- `src/lib/training.ts`
- `src/lib/route-data-actions.ts`
- `src/lib/training-api.ts` as a compatibility facade only
- `src/lib/auth-actions.ts` as the canonical owner for login route data, Magic Link request, auth
  callback exchange, and local-vs-public auth availability helpers
- `src/lib/first-plan-actions.ts`
- `src/lib/structured-first-plan-onboarding.ts`
- `src/lib/runner-training-preferences.ts`
- `src/lib/running-plan-engine-actions.ts`
- `src/lib/running-plan-engine-review.ts`
- `src/lib/plan-creation-engine/*`
- `src/lib/plan-preset-actions.ts` for `getPlanPresetCards(...)` only
- `src/lib/manual-workout-authoring/actions.ts`
- `src/lib/manual-workout-authoring/active-plan-add.ts`
- `src/lib/manual-workout-authoring/saved-templates.ts`
- `src/lib/manual-workout-authoring/saved-template-repository.ts`
- `src/lib/manual-workout-authoring/copy-paste.ts`
- `src/lib/manual-workout-authoring/copy-paste-reconstruction.ts`
- `src/lib/manual-workout-authoring/delete-clear.ts`
- `src/lib/manual-workout-authoring/move-workout.ts`
- `src/lib/manual-workout-authoring/persistence.ts`
- `src/lib/manual-workout-authoring/review-exactness.ts`
- `src/lib/manual-workout-authoring/schema.ts`
- `src/lib/manual-workout-authoring/templates.ts`
- `src/lib/manual-workout-authoring/validator.ts`
- `src/lib/active-plan-export-actions.ts`
- `src/lib/plan-export.ts`
- `src/lib/imported-plan.ts`
- `src/lib/plan-replacement-actions.ts`
- `src/lib/active-plan-lifecycle-actions.ts`
- `src/lib/active-plan-refresh-actions.ts`
- `src/lib/active-plan-refresh-draft.ts`
- `scripts/validate-manual-workout-authoring.ts`
- `scripts/validate-running-plan-engine-source.ts`
- `scripts/validate-running-plan-engine-10k-builder.ts`
- `scripts/validate-running-plan-engine-r6-builders.ts`
- `scripts/validate-running-plan-engine-confirm.ts`
- `scripts/generate-running-plan-engine-scenarios.ts`
- `scripts/validate-plan-authoring-doctrine.ts` as a required proof entrypoint, even though it remains a decomposition hotspot
- `scripts/plan-authoring-doctrine/rich-workout-import-export.ts`
- `scripts/plan-authoring-doctrine/active-plan-refresh.ts`
- `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-envelope.ts` as the stable compatibility
  facade for the combined AI first-plan blueprint/envelope proof entrypoint
- `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts`
- `scripts/plan-authoring-doctrine/ai-first-plan-envelope-proof.ts`
- `scripts/plan-authoring-doctrine/ai-first-plan-proof-shared.ts`
- `scripts/manual-workout-authoring/saved-template-proof.ts`
- `scripts/manual-workout-authoring/active-plan-add-proof.ts`
- `scripts/manual-workout-authoring/copy-paste-proof.ts`
- `scripts/manual-workout-authoring/delete-clear-proof.ts`
- `scripts/manual-workout-authoring/move-proof.ts`
- `scripts/manual-workout-authoring/persisted-edit-proof.ts`
- `scripts/manual-workout-authoring/export-proof.ts`
- `scripts/manual-workout-authoring/confirm-persistence-proof.ts`
- `scripts/manual-workout-authoring/source-capability-proof.ts`
- `scripts/qa-local-server.mjs`

### Backend and Script Files Likely Suspect or Audit-First

These are not deletion decisions. They are audit targets because they are broad, large, compatibility-heavy,
or future-only:

- `src/lib/training-api.ts`: required compatibility facade for many route/component wrappers, but
  Slice G4A removed the active-plan export names from this facade after moving the export route to
  direct imports from `src/lib/active-plan-export-actions.ts`, Slice G4B removed the Plan Preset
  card discovery re-export after moving onboarding imports to `src/lib/plan-preset-actions.ts`, and
  Slice G4C removed the auth callback exchange re-export after moving `/api/auth/confirm` to direct
  imports from `src/lib/auth-actions.ts`. Slice G4D removed the Open plan refresh/schedule-edit
  type-only compatibility re-exports after moving component type imports to
  `src/lib/active-plan-refresh-contract.ts` and
  `src/lib/active-plan-schedule-edit-preview.ts`. Slice G4E removed the selected and bundled
  same-class settings/first-plan/selected-plan/lifecycle type-only re-exports after source proof
  showed canonical owner modules already existed and no current facade callers remained.
  Do not broadly narrow the facade without another fresh import map.
- Legacy MJS text-authoring ops fallback: removed in Slice G5A after final import proof found no
  live command/runtime/current-doc owner. Current command ownership is
  `scripts/author-plan-from-text.ts`, and current OpenAI text-authoring source ownership is
  `src/lib/openai-plan-authoring.ts`.
- Orphaned onboarding `JsonImportPanel`: removed in Slice G5B after final `rg` proof found no live
  source imports. The shipped advanced JSON import UI is now
  `src/components/UploadJsonDialog.tsx`.
- `src/lib/auth-actions.ts`: required canonical auth owner. Keep login route data, Magic Link
  request, auth callback exchange, local-auth/public-runtime availability helpers, and redirect
  semantics here; G4C changed only the route import path for `/api/auth/confirm`.
- `src/lib/plan-preset-actions.ts`: required direct UI import owner for `getPlanPresetCards(...)`;
  old Plan Preset review/confirm blocked actions were removed by Slice G2A.
- `scripts/validate-plan-authoring-doctrine.ts`: required proof entrypoint; Slices 12A-12G
  extracted rich import/export, active-plan refresh, AI first-plan blueprint/envelope,
  goal-family quality policy, metric-target/readback, and rich-workout draft normalizer proof
  owners. Keep the public entrypoint stable for now instead of continuing extraction by momentum.
- `scripts/validate-manual-workout-authoring.ts`: required manual proof entrypoint;
  Slice 13A extracted saved-template proof, Slice 13B extracted active-plan Add proof, Slice 13C
  extracted Copy/Paste proof, Slice 13D extracted Delete/Clear proof, Slice 13E extracted Move
  proof, Slice 13F extracted persisted edit proof, Slice 13G extracted active-plan export proof, and
  Slice 13H extracted first-create confirm persistence proof, and Slice 13I extracted source
  editing capability readback proof. The public validator is now below the prior high-risk
  decomposition threshold; keep it stable unless a future coherent island has a real ownership
  reason.
- `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-proof.ts`: required focused
  production/default `ai_first_plan_blueprint_v1` proof owner from Slice 12G.
- `scripts/plan-authoring-doctrine/ai-first-plan-envelope-proof.ts`: required focused
  internal/non-default `ai_first_plan_envelope_v1` proof owner from Slice 12G.
- `scripts/plan-authoring-doctrine/ai-first-plan-blueprint-envelope.ts`: compatibility facade for the
  stable combined proof entrypoint; keep small unless the public validator import path is intentionally
  changed.
- `scripts/plan-authoring-doctrine/rich-workout-draft-normalizer.ts`: required proof owner from
  Slice 12F for rich-draft normalization, text-authoring rich-draft opt-in, fixture construction,
  and compatibility mapping.
- `scripts/author-ai-first-plan-draft.ts`: keep the public `npm run author-ai-first-plan-draft`
  command and its non-mutating diagnostic value. Slice 12H already extracted CLI and deterministic
  fixture ownership; do not continue ops extraction by inertia unless a later audit proves it is the
  highest-value ownership seam.
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`: required UI owner but near a
  reviewability threshold; frontend cleanup should split by real interaction seams after functional
  gates stabilize.
- `src/components/PlanManagementDialog.tsx`: decomposed but still central; audit only after export
  and lifecycle panels are stable.
- `src/lib/active-plan-schedule-edit-preview.ts` and `scripts/validate-active-plan-schedule-edit-preview.ts`:
  schedule-edit preview support exists, but auditors should confirm whether it is current product,
  future-only, or replaced by manual Move before keeping it in runtime.
- AI strict/envelope/draft ops files: keep only if they are still doctrine/proof paths; demote or
  delete if no current validator or active plan references them.
- Older plans dated 2026-05-14, 2026-05-18, 2026-05-21, 2026-05-29, and 2026-06-01: demoted by
  Slice G1. Heart-rate zones and the old voice-to-plan active plan copy now live only as backlog
  items; the current backend voice seam is classified separately above and has no visible onboarding
  UI caller. Polar sync and advanced performance cadence were moved to backlog, and the optimization
  strike moved to archive.

### Frontend Files Likely Required

- `src/components/OnboardingGate.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`
- `src/components/UploadJsonDialog.tsx`
- `src/components/AppShell.tsx`
- `src/components/Calendar.tsx`
- `src/components/ui/hito-calendar-day.tsx`
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- `src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx` as the QA-passed focused
  source-action rendering/interaction owner
- `src/components/manual-workout/ManualWorkoutMoveControls.tsx`
- `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx` only after persisted edit QA/frontend wiring accepts the runner-facing edit path
- `src/components/manual-workout/manual-workout-authoring-utils.ts`
- `src/components/PlanManagementDialog.tsx`
- `src/components/plan-management/ActivePlanCreatePlanDialog.tsx`
- `src/components/plan-management/ActivePlanTransitionReviewDialog.tsx`
- `src/components/plan-management/PlanLifecycleControls.tsx`
- `src/components/plan-management/PlanScheduleEditPanel.tsx`
- `src/components/plan-management/PlanSummaryHeader.tsx`
- `src/components/plan-management/plan-export-download.ts`
- `src/routes/workout.$date.tsx`
- `src/components/CompletionPanel.tsx`

### Frontend Files Likely Suspect or Audit-First

- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`: still a frontend
  decomposition candidate after source-action extraction; do not add new lifecycle responsibilities
  before a dedicated frontend cleanup slice is selected.
- `src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx`: keep as the QA-passed focused
  source-action owner; audit only if source-row capability display drifts again.
- `src/components/Calendar.tsx`: required product owner; audit only for route-local manual action
  logic that can move into helper components without changing calendar truth and only after the
  source-action extraction stabilizes.
- `src/components/PlanManagementDialog.tsx`: continue decomposition only by existing panel seams.
- `src/routes/hitoDS.tsx`: large but internal reference; G8 already removed the duplicate inline
  Figma export route fallback. Do not mix future DS IA cleanup with product manual cleanup.
- `src/routes/admin.analytics.tsx` and `src/components/admin/AdminWorkspaceNav.tsx`: G9 cleanup is
  QA-passed; future-only disabled admin placeholders are removed. Preserve current admin analytics,
  capture/backlog, auth/logout, and shell behavior.
- `src/styles.css`: large global styling owner; audit separately as design-system token cleanup, not
  as plan-flow cleanup.

## Validators and Proof Infrastructure

Keep these as accepted proof paths until a cleanup slice replaces them:

- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
- `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts`
- `npm run validate-admin-capture-backlog`
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run build` when imports, public exports, or browser-visible behavior changes
- `npm run qa:server:status|restart|start|stop` for the persistent built QA server lifecycle

QA artifacts remain local/gitignored by default under `qa-artifacts/`. They prove acceptance but are
not product runtime. Do not delete local artifacts during source cleanup unless a separate QA
evidence retention task scopes that deletion.

## Future-Only Boundaries

Do not use these future ideas to justify keeping runtime code as shipped behavior:

- QR codes
- public share links
- private share links
- import from shared/exported plan
- applying someone else's plan
- mobile deep-link import
- PDF export
- watch/Garmin/Suunto export
- organization or coach authoring
- recurrence/batch expansion
- Restore/Put back/Redo UI
- runner-facing `Edit training` for persisted manual workouts until backend QA and frontend wiring pass
- any generated/selected/preset/imported persisted workout-content editing
- universal Copy/Paste across generated, selected, preset, imported, or AI active plans
- broader source/row mutation matrices beyond the QA-proved Add/Clear/Move slices
- AI continuation blocks inside an existing manual plan
- deeper modal/mobile visual polish

Future-only artifacts may remain as docs, specs, or backlog items, but cleanup audits should not
count them as current runtime owners.

## Recommended Cleanup Sequence

1. G4F is complete: `import:current-plan` is hardened so default/help and dry-run are non-mutating,
   and apply mode is local-loopback guarded.
2. Keep runtime server-function wrappers in `training-api.ts`; G4A-G4E were bounded facade narrowing
   slices and must not become broad facade cleanup.
3. L1 is complete: `npm run artifact:hygiene` reports local generated roots without deletion, and
   `test-results/` is ignored as generated test-runner residue.
4. Do not delete or demote Add/Clear/Move backend/frontend files merely because the universal
   editability gate is closed; first prove whether each file is required, validation-only,
   compatibility-only, or a safe decomposition target.
5. Defer additional frontend/runtime implementation cleanup until import/reference evidence proves
   the selected seam is compatibility-only, future-only, or safely decomposable.
6. Keep QR/share/import as future-only until a dedicated architecture contract is explicitly
   prioritized after freeze.
7. G5C is QA-passed: the stale `ManualWorkoutCopyMenu` alias is removed, manual source-action
   call-site naming is aligned around `ManualWorkoutSourceActionMenu`, and browser QA proved
   Copy/Move/Clear still work through accepted backend seams.
8. G5D is complete: pure manual-authoring type imports were narrowed away from `training-api.ts`,
   while runtime manual server-function exports/actions stay in the facade.
9. G5E is complete: local ops plan-seed / structured-authoring `.mjs` helper ownership was removed
   in favor of the TypeScript owners in `src/lib/imported-plan.ts` and
   `src/lib/structured-plan-authoring.ts`.
10. G5F is complete: duplicated local ops plan-apply persistence blocks were consolidated into a
    narrow ops-local helper while entrypoints retained their own mutation-safety gates.
11. G6 is complete: the paused `/test-calendar` sandbox plan moved to archive as historical
    evidence; active DS/specimen/Figma bridge work remains owned by the Hito DS IA plan.
12. G7 is complete: compact active-plan root and current source/import references were reassessed;
    broad runtime cleanup remains unsafe, and G7A was selected as a narrow backend import-map batch.
13. G7A is complete: `training-api.ts` no longer re-exports
    `persistImportedPlanForCurrentRequest` or `saveUserSettings`; the settings route imports the
    save action from `src/lib/user-settings-actions.ts`.
14. G7B is complete: no-caller user-scoped lifecycle/refresh helper compatibility exports were
    removed from `training-api.ts`; live top-level lifecycle/refresh server-function wrappers remain
    in the facade.
15. G7C is complete: no-caller manual Copy/Paste and Move review/confirm compatibility re-exports
    were removed from `training-api.ts`; direct manual Copy/Paste and Move runtime wrappers plus
    Delete/Clear, Add/Create/Templates, and persisted-edit actions remain in the facade.
16. Post-G7C source-proof reassessment is complete: broad `training-api.ts` cleanup remains unsafe,
    validators/local ops remain live proof/safety tooling, `qa-artifacts/` deletion remains blocked,
    and FRONTEND/DS Slice G8 was selected for duplicate `/hitoDS/export/figma` route ownership.
17. G8 is QA-passed: the duplicate inline `/hitoDS/export/figma` fallback was removed from the
    parent `/hitoDS` route while the dedicated file route and export board remain canonical.
18. Post-G8 reassessment selected FRONTEND/ADMIN Slice G9 for future-only admin UI placeholder
    demotion.
19. G9 is QA-passed: current admin Users/account-menu surfaces no longer expose the future-only
    placeholder actions, and browser QA covered desktop plus `375px` mobile.
20. Stable cleanup burndown v1 is adopted and updated after G22: `40` total gates, `39` complete,
    `1` remaining, `97.5%` gate-burndown complete.
21. G10 is complete: the residual stale `scripts/author-plan-from-text.mjs` entrypoint was deleted
    after source proof confirmed no live owner and preserved the TS-backed command.
22. Post-G10 reassessment selected BACKEND/OPS Slice G11 for duplicate-space local ops residue:
    `scripts/import-current-plan 2.mjs` and `scripts/validate-plan-preset-eligibility 2.ts`.
23. G11 is complete: both duplicate-space local ops residue files were deleted after source proof
    confirmed they were untracked and ownerless.
24. Post-G11 reassessment selected BACKEND Slice G12 for the no-caller first-plan/voice
    compatibility re-exports in `training-api.ts`; this is not broad facade cleanup.
25. G12 is complete: those four no-caller first-plan/voice compatibility re-exports were removed
    from `training-api.ts`.
26. Post-G12 reassessment accepted G12, kept broad runtime/frontend cleanup blocked, and selected
    BACKEND/OPS Slice G13 for local work-dashboard devtools hygiene.
27. G13 is complete: dashboard refresh now has first-class package scripts, and
    `docs/work-dashboard.md` was regenerated from active-plan truth.
28. Post-G13 reassessment is complete: cleanup entered source-proof holding until the service-wide
    UI consistency audit identified a concrete shared-owner DS adoption candidate.
29. Service-wide UI consistency audit identified FRONTEND UI-C1 as a concrete shared-owner DS
    adoption candidate.
30. G14 is complete: the global business-flow teardown matrix is accepted, no product-runtime
    deletion batch is source-proved, and FRONTEND UI-C1 was selected as the first execution batch
    because it removed a duplicate selected-plan preview calendar presentation path.
31. Service-wide Designer audit is accepted: it confirmed no broad redesign was justified and kept
    FRONTEND UI-C1 as the first product-wide DS-adoption cleanup batch.
32. UI-C1 is QA-passed and accepted: selected-plan preview now consumes the shared Hito
    calendar-day primitive in the proved no-benchmark and benchmark Quick setup scope.
33. Post-UI-C1 source/import audit selected BACKEND/OPS G15 for orphan legacy MJS ops helper
    residue deletion under `scripts/lib/`.
34. G15 is complete: `scripts/lib/openai-plan-authoring.mjs`,
    `scripts/lib/structured-plan-authoring.mjs`, and `scripts/lib/imported-plan-seed.mjs` were
    deleted after source proof confirmed current command ownership is TS-backed or ops-local.
35. Post-G15 source/import/docs reassessment selected DEVTOOLS/OPS G16 for local duplicate-space
    residue cleanup. The selected files are untracked and unimported, and the slice must not touch
    canonical runtime owners.
36. G16 is complete: `src/lib/plan-creation-engine/source-model 2.ts`,
    `src/components/onboarding/PlanPresetPanel 2.tsx`, and `src/components/ui/calendar 2.tsx` were
    deleted while canonical owners remain untouched.
37. Post-G16 reassessment selected BACKEND/OPS G17 for untracked legacy Plan Preset builder/review
    residue under `src/lib/plan-presets/` and `scripts/plan-presets/`. This is not broad Plan
    Preset or selected-plan behavior work; current card discovery and selected-plan preview/create
    remain preserved.
38. G17 is complete: the untracked legacy Plan Preset builder/review module cluster, legacy CSV/source
    artifacts, and dependent `scripts/plan-presets/*` proof helpers were deleted while tracked card
    discovery owners remain untouched.
39. Post-G17 reassessment selected FRONTEND G18 for the tracked orphan onboarding
    `JsonImportPanel.tsx`. This is deletion-only source repair; current JSON import behavior remains
    owned by `UploadJsonDialog`.
40. G18 is complete: tracked orphan `JsonImportPanel` residue was deleted while current JSON import
    behavior remains owned by `UploadJsonDialog`.
41. Post-G18 reassessment selected FRONTEND G19 for tracked orphan `DictateToPlanPanel.tsx` UI
    residue. This was deletion-only source cleanup for the old UI panel.
42. G19 is complete: tracked orphan `DictateToPlanPanel.tsx` residue was deleted. Later source-size
    cleanup retired the remaining non-visible backend voice-to-plan seam instead of preserving it as
    current truth.
43. Post-G19 reassessment selected ARCHITECT G20 for the untracked duplicate-space manual-workout
    backlog markdown copy. This is docs/admin-mirror source-of-truth hygiene only.
44. G20 is complete: the untracked duplicate-space manual-workout backlog markdown copy was deleted
    after admin-root proof, preserving the canonical tracked backlog item and importer contract.
45. G21 is complete: the final codebase size and dead-code teardown sweep measured the current
    text baseline, rechecked business-flow uniqueness, found no safe backend/runtime or
    frontend/browser-sensitive deletion batch, and selected G22 for a business-process short-path
    audit after current-state/dashboard source-of-truth sync.
46. G22 is complete: the business-process short-path audit folded in the current-state/dashboard
    sync, confirmed broad runtime/frontend deletion remains unsafe, and selected BACKEND G23 for
    first-plan/selected-plan `training-api.ts` passthrough narrowing.
47. G23 is complete: `OnboardingGate` imports first-plan and selected-plan runtime actions directly
    from canonical action modules, and `training-api.ts` no longer re-exports those four passthrough
    actions.
48. Do not delete `qa-artifacts/` before a separate QA evidence policy exists.

## Immediate Next Gate

Holding for the separate Hito Docs and Artifact Compression track.

G23 is accepted and the simplification strike is archived. The cleanup ledger is `40/40` complete,
`0` remaining, `100%`. Product has opened the separate docs/artifact compression track. Accepted
docs-size-reduction and metadata-quality work is ledgered in that active plan, and QA artifact
cleanup is now in holding after QA-passed E13/E14 manual-workout image compression. Resume only from
a fresh manifest/estimate that proves material value, one owner, one risk class, and one validation
story. Do not route broader runtime cleanup, backend ops hardening, browser-sensitive cleanup, Admin
apply, log deletion, generated/vendor residue cleanup, or additional QA artifact cleanup unless that
track explicitly scopes the gate.

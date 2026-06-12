# Current Functional Map

Status: canonical freeze-readiness map
Last Updated: 2026-06-12
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

- [manual workout authoring plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md)
- [running plan creation engine rebuild](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md)
- [Hito stack simplification strike](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-07-hito-stack-simplification-strike.md)

Product-contract references:

- [unified plan creation lifecycle](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md)
- [universal selected-distance no-dead-end taxonomy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md)
- [manual user-built plan flow spec](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md)
- [manual workout constructor taxonomy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md)
- [Marathon Completion selected-plan family contract](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-11-marathon-completion-selected-plan-family-contract.md)

Cleanup rule:

Do not delete or demote code because it looks large. First map it to one of the flows below.
If a file supports no current flow, no accepted validation gate, and no explicit future-only artifact,
then it becomes a deletion/demotion candidate.

## Freeze Sequencing Decision

Begin backend/frontend cleanup inventory now that Manual Move Workout browser QA passed.

Decision:

Hito is ready for code-freeze readiness / cleanup inventory. This is not approval for broad
deletion or refactor implementation; it is approval to stop adding manual-builder scope and start
mapped cleanup selection from this source-of-truth map.

Reason:

- Manual Move Workout is now user-facing in the proved scope, with backend-reviewed confirmation,
  same-row persistence, browser/DB readback, mobile no-overflow, and cleanup proof.
- Cleanup inventory can classify code without editing product source.
- Actual deletion/refactor implementation should still start from the shipped/accepted capability
  map below rather than file size alone.
- QR/share/import remains future-only and must not be selected as immediate implementation during
  this freeze-readiness pass.

Immediate next cleanup gate:

ARCHITECT cleanup inventory using this map, then route one backend or frontend cleanup slice.

## Flow Map

| Flow | Runner-facing capability | Status | Backend owner/seam | Frontend owner/surface | Persisted entities | Proof status | Future-only boundaries |
| --- | --- | --- | --- | --- | --- | --- | --- |
| No-active-plan entry | Signed-in runners without an active plan see creation choices instead of silent preview assignment. | Shipped | `src/lib/route-data-actions.ts`, `src/lib/first-plan-actions.ts`, `src/lib/training-api.ts` wrappers | `src/components/OnboardingGate.tsx`, onboarding components | `runner_profiles`, `plan_cycles`, `planned_workouts` only after confirm | Changelog-backed saved-mode and onboarding history | No silent plan creation; no active-plan replacement without explicit action |
| Structured / AI-assisted first plan | Runner enters profile/goal/training context, reviews backend-shaped draft, then confirms. AI may draft under backend constraints. | Shipped for current visible structured/AI setup path; some AI ops paths remain non-live | `src/lib/first-plan-actions.ts`, `src/lib/structured-first-plan-onboarding.ts`, `src/lib/ai-first-plan-blueprint-*`, `src/lib/active-plan-persistence.ts` | `src/components/onboarding/StructuredPlanConstructor.tsx`, `src/components/onboarding/*` | `runner_profiles`, `plan_cycles`, `planned_workouts` | Validators under `scripts/validate-plan-authoring-doctrine.ts`; changelog entries through 2026-06-10 | No AI direct persistence; no fake pace from target time; no fake personal HR; strict draft/envelope ops seams are not normal UI |
| Selected-distance plan creation | Runner can create accepted selected-distance plans after preview/review/create. | 10K, Half Marathon, Marathon Base create accepted; Marathon Completion preview accepted but confirm/persist still active backend gate | `src/lib/running-plan-engine-actions.ts`, `src/lib/running-plan-engine-review.ts`, `src/lib/plan-creation-engine/*`, `src/lib/active-plan-persistence.ts` | `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`, onboarding selected-plan UI | `runner_profiles`, `plan_cycles`, `planned_workouts` after confirm | `scripts/validate-running-plan-engine-*`, `scripts/generate-running-plan-engine-scenarios.ts`, R8 browser/DB proof | Do not expose Marathon Completion create until confirm/persist QA passes; do not turn Marathon Base into completion |
| Plan Presets | Runner can choose 10K Foundation, Half Marathon Balanced, or Marathon Base preset from no-active-plan state. | Shipped | Preserved card discovery only; old algorithmic preset builder deleted; accepted create path history remains changelog | Preset cards/review UI in onboarding | `runner_profiles`, `plan_cycles`, `planned_workouts` after confirm | Changelog 2026-06-07 and cleanup deletion proof | No new preset families; no active-plan replacement from presets |
| Manual first create | Runner chooses `Build my plan myself`, reviews one workout, and creates a manual active plan. | Shipped | `src/lib/manual-workout-authoring/actions.ts`, `persistence.ts`, `review-exactness.ts`, `active-plan-persistence.ts` | `src/components/onboarding/ManualUserBuiltPlanPanel.tsx`, shared manual controls | `runner_profiles`, `plan_cycles`, `planned_workouts` | `scripts/validate-manual-workout-authoring.ts`; browser/DB proof; changelog 2026-06-10 | Do not persist empty active manual plans silently |
| Manual Add activity | Runner adds another reviewed workout to an eligible future empty day in an existing manual plan. | Shipped | `src/lib/manual-workout-authoring/active-plan-add.ts`, `actions.ts`, `review-exactness.ts` | `src/components/Calendar.tsx`, `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`, `manual-workout-authoring-utils.ts` | Existing `plan_cycles`; new `planned_workouts` rows | Browser/DB proof; changelog 2026-06-11 | No frontend row append; no generated/preset/imported plan mutation |
| Personal saved templates | Runner saves a reviewed manual workout as a personal template and reuses it from Add activity. | Shipped in scoped first-create and existing-plan Add paths | `src/lib/manual-workout-authoring/saved-templates.ts`, `saved-template-repository.ts`, review reconstruction through manual authoring | Manual save modal and template picker in shared controls | `runner_manual_workout_templates`, `planned_workouts` when later confirmed | Browser/DB proof; changelog 2026-06-11 | No organization/coach templates; no frontend-owned template rows |
| Manual Copy/Paste | Runner copies a manual workout and pastes it onto an eligible future empty day after backend review. | Shipped | `src/lib/manual-workout-authoring/copy-paste.ts`, `copy-paste-reconstruction.ts`, `active-plan-add.ts` | `Calendar.tsx` occupied-day menu and Add/Paste menu | Existing `plan_cycles`; new `planned_workouts` rows | Backend live proof plus browser/DB proof; changelog 2026-06-11 | No raw row duplication; no recurrence; no move disguised as copy/delete |
| Manual Delete/Clear | Runner clears an eligible manual workout after backend-shaped review; active manual plan remains active. | Shipped | `src/lib/manual-workout-authoring/delete-clear.ts`, `review-exactness.ts`, `persistence.ts` | `Calendar.tsx`, `ManualWorkoutAuthoringControls.tsx` review dialog | Existing `planned_workouts` row removed; metadata updated | Browser/DB proof; changelog 2026-06-12 | Restore/Put back/Redo UI is not shipped; last-workout delete remains blocked |
| Manual Move Workout | Runner moves an eligible manual workout to another empty day after backend review. | Shipped in proved scope | `src/lib/manual-workout-authoring/move-workout.ts` | `src/components/Calendar.tsx`, `src/components/manual-workout/ManualWorkoutMoveControls.tsx`, existing manual controls/utils | Existing `planned_workouts` row date/weekday/week update after confirm | Browser/DB/mobile/WebKit QA; changelog 2026-06-12 | No swap, no batch move, no recurrence, no edit, no Restore UI, no QR/share/import, no frontend copy+delete, no local schedule truth |
| Active plan viewing | Runner sees saved plan calendar, workout detail, progress, and result state. | Shipped | `src/lib/training.ts`, `src/lib/route-data-actions.ts`, `src/lib/workout-log-actions.ts`, feedback/import modules | `src/components/Calendar.tsx`, `src/routes/workout.$date.tsx`, `src/routes/progress.tsx`, `src/components/CompletionPanel.tsx` | `plan_cycles`, `planned_workouts`, `workout_logs`, provider evidence tables | Changelog-backed saved-mode, Garmin feedback, target-display QA | Do not move schedule truth into frontend; `/hitoDS` specimens are not product behavior |
| Open plan actions | Runner opens plan management modal for summary, import/replace, text replacement, clear upcoming, delete/archive, and export. | Shipped by action as listed below | `src/lib/active-plan-lifecycle-actions.ts`, `plan-replacement-actions.ts`, `active-plan-export-actions.ts`, `active-plan-refresh-actions.ts` | `src/components/PlanManagementDialog.tsx`, `src/components/plan-management/*` | `plan_cycles`, `planned_workouts`, `workout_logs` | Multiple changelog and validators; export proof accepted 2026-06-12 | No silent replacement; no per-day schedule editing through Open plan |
| Active plan delete | Runner can delete/archive the active plan and return to no-plan state while history remains archived. | Shipped | `src/lib/active-plan-lifecycle-actions.ts` via `training-api.ts` wrappers | `PlanLifecycleControls.tsx` within `Open plan` | `plan_cycles` archived; workouts/logs preserved under archived plan | Current-product backed | No hard deletion of history as normal runner action |
| Clear upcoming schedule | Runner can clear upcoming schedule by archiving active plan and returning to no-plan state. | Shipped | `src/lib/active-plan-lifecycle-actions.ts` | `PlanLifecycleControls.tsx` | `plan_cycles` archived; protected past/logged truth preserved | Current-product backed | No half-active truncated plan state |
| Advanced JSON import / replace | Runner can import an existing `training-plan-v2` artifact as advanced fallback, with backend start-date policy. | Shipped | `src/lib/imported-plan.ts`, `src/lib/plan-replacement-actions.ts`, `src/lib/active-plan-persistence.ts` | `PlanImportPanel.tsx`, advanced onboarding/import UI | `runner_profiles`, `plan_cycles`, `planned_workouts` | Doctrine/import validators; current-product backed | Legacy `week_1_preview[]` removed; no share/import-from-QR yet |
| Text replacement / refresh | Saved-mode plan replacement and refresh proposal use backend review/apply seams. | Shipped for current described scopes | `src/lib/plan-replacement-actions.ts`, `active-plan-refresh-actions.ts`, `active-plan-refresh-draft.ts`, AI proposal modules | `PlanTextReplacementPanel.tsx`, `PlanRefreshPanel.tsx` | Archive/replace plan rows only after apply | Doctrine validators; current-product backed | No AI direct mutation; no silent refresh apply |
| JSON/Markdown export | Runner exports persisted active plan JSON/Markdown from Open plan. Manual plans are now proven. | Shipped for authenticated active-plan export including manual plan proof | `src/lib/active-plan-export-actions.ts`, `src/lib/plan-export.ts` | `PlanExportMenu.tsx`, `PlanManagementDialog.tsx` iframe download orchestration | Reads active `plan_cycles` and `planned_workouts`; no mutation | Browser/download/DB proof; changelog 2026-06-12 | No PDF, watch export, public links, QR, import-from-export, or mobile deep links |
| QA server lifecycle | QA uses one canonical built local server to prove browser behavior. | Shipped internal process | `scripts/qa-local-server.mjs`, build/finalize scripts | Browser QA only | None | Reused in browser QA reports | Do not start duplicate app servers unless required |
| Admin work items | Admin can see repo-derived work items and quick notes in one Work Items surface. | Shipped internal/admin | `src/lib/admin-capture*`, `scripts/import-repo-work-items-to-admin-backlog.ts` | `src/routes/admin.capture.tsx`, admin shell | `admin_capture_items` | Importer dry-run/live proof; admin QA | Not a substitute for changelog or markdown source truth |
| Future exchange / share | QR/share/import model for Hito plan exchange. | Future-only | Architecture contract not accepted yet | No frontend implementation | Unknown; do not add tables yet | None | QR, public/private links, import from share, applying someone else's plan, expiry/revocation remain future-only |

## Cleanup Audit Inventory

### Backend and Script Files Likely Required

These files map directly to shipped/accepted flows or active validation gates and should not be
deleted without replacement proof:

- `src/lib/active-plan-persistence.ts`
- `src/lib/training.ts`
- `src/lib/route-data-actions.ts`
- `src/lib/training-api.ts` as a compatibility facade only
- `src/lib/first-plan-actions.ts`
- `src/lib/structured-first-plan-onboarding.ts`
- `src/lib/runner-training-preferences.ts`
- `src/lib/running-plan-engine-actions.ts`
- `src/lib/running-plan-engine-review.ts`
- `src/lib/plan-creation-engine/*`
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
- `scripts/validate-plan-authoring-doctrine.ts` as a required proof entrypoint, even though it is a decomposition hotspot
- `scripts/qa-local-server.mjs`

### Backend and Script Files Likely Suspect or Audit-First

These are not deletion decisions. They are audit targets because they are broad, large, compatibility-heavy,
or future-only:

- `src/lib/training-api.ts`: required compatibility facade, but should keep shrinking as owners move
  to focused modules.
- `scripts/validate-plan-authoring-doctrine.ts`: required proof entrypoint but too large; continue
  extraction into `scripts/plan-authoring-doctrine/*`.
- `scripts/validate-manual-workout-authoring.ts`: required manual proof but now covers many slices;
  audit during freeze inventory for decomposition by first-create/add/templates/copy/delete/move/export.
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
- Older active plans dated 2026-05-14, 2026-05-18, and 2026-05-21: not runtime code, but should be
  classified as active, backlog, or archive before freeze.

### Frontend Files Likely Required

- `src/components/OnboardingGate.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/onboarding/ManualUserBuiltPlanPanel.tsx`
- `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`
- `src/components/Calendar.tsx`
- `src/components/ui/hito-calendar-day.tsx`
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- `src/components/manual-workout/ManualWorkoutMoveControls.tsx`
- `src/components/manual-workout/manual-workout-authoring-utils.ts`
- `src/components/PlanManagementDialog.tsx`
- `src/components/plan-management/PlanExportMenu.tsx`
- `src/components/plan-management/PlanImportPanel.tsx`
- `src/components/plan-management/PlanLifecycleControls.tsx`
- `src/components/plan-management/PlanRefreshPanel.tsx`
- `src/components/plan-management/PlanTextReplacementPanel.tsx`
- `src/components/plan-management/PlanSummaryHeader.tsx`
- `src/routes/workout.$date.tsx`
- `src/components/CompletionPanel.tsx`

### Frontend Files Likely Suspect or Audit-First

- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`: likely first manual UI
  decomposition candidate after Move acceptance and before recurrence/edit.
- `src/components/Calendar.tsx`: required product owner; audit only for route-local manual action
  logic that can move into helper components without changing calendar truth.
- `src/components/PlanManagementDialog.tsx`: continue decomposition only by existing panel seams.
- `src/routes/hitoDS.tsx`: large but internal reference; do not mix with product manual cleanup.
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
not product runtime. Do not delete local artifacts during source cleanup unless a separate disk
hygiene task scopes that deletion.

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
- edit persisted manual workout
- frontend drag-and-drop move UI
- AI continuation blocks inside an existing manual plan
- generated/preset/imported/running-engine manual mutation
- deeper modal/mobile visual polish

Future-only artifacts may remain as docs, specs, or backlog items, but cleanup audits should not
count them as current runtime owners.

## Recommended Cleanup Sequence

1. Start ARCHITECT cleanup inventory using this functional map. The inventory should classify
   backend/scripts first, because the largest current hotspots are validators, plan-authoring,
   plan-creation, and compatibility seams.
2. Do not delete or demote Move-specific backend/frontend files merely because the Move gate is
   closed; first prove whether each file is required, validation-only, compatibility-only, or a
   safe decomposition target.
3. After backend inventory selects one cleanup slice, run a separate frontend inventory focused on
   `ManualWorkoutAuthoringControls.tsx`, `Calendar.tsx`, and `PlanManagementDialog.tsx`.
4. Keep QR/share/import as future-only until a dedicated architecture contract is explicitly
   prioritized after freeze.

## Immediate Next Gate

ARCHITECT cleanup inventory / backend-first freeze audit.

The next agent should use this map to classify backend and script files into:

- required current flow
- required proof infrastructure
- compatibility-only
- future-only
- suspect/dead candidate

No product code should be changed during that inventory pass.

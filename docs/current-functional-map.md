# Current Functional Map

Status: canonical freeze-readiness map
Last Updated: 2026-07-19
Owner: ARCHITECT

## Purpose

This map lists the real shipped or QA-accepted Hito business flows before cleanup selection.
Cleanup audits should start from product capabilities and service-domain ownership, not from file
size, old cleanup ledgers, or recent irritation.

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
- [source-size governance plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md)

Product-contract references:

- [unified plan creation lifecycle](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md)
- [universal selected-distance no-dead-end taxonomy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/product-briefs/2026-06-11-universal-selected-distance-no-dead-end-ux-taxonomy.md)
- [manual user-built plan flow spec](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md)
- [manual workout constructor taxonomy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md)
- [Marathon Completion selected-plan family contract](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/running-coach/2026-06-11-marathon-completion-selected-plan-family-contract.md)

Cleanup rule:

Do not delete or demote code because it looks large. First map it to one of the domains and flows
below. If a file supports no current flow, no accepted validation gate, and no explicit future-only
artifact, then it becomes a deletion/demotion candidate.

## Service-Domain Ownership Map - 2026-07-10

Use this table as the physical domain index before selecting cleanup batches. Product/business truth
stays in `docs/current-product.md`; implementation ownership and deletion safety start here.

| Domain | Main product meaning | High-level physical owners | Cleanup boundary |
| --- | --- | --- | --- |
| Auth, app shell, admin boundary | Product/admin session separation, route shell, local-only bypass | `src/start.ts`, `src/routes/__root.tsx`, `src/components/AppShell.tsx`, `src/lib/auth-actions.ts`, `src/lib/admin-auth-actions*`, `src/lib/admin-access.server.ts`, `src/lib/supabase/*`, local-auth helpers | Do not collapse runner auth, admin auth, and local bypass without preserving route/session boundaries. |
| Runner profile, settings, onboarding | Profile basics, training preferences, first-plan setup input | `src/components/OnboardingGate.tsx`, `src/components/onboarding/*`, `src/routes/settings.tsx`, `src/lib/user-settings-actions.ts`, `src/lib/runner-training-preferences.ts`, `src/lib/structured-first-plan-onboarding.ts` | Frontend collects backend-shaped input; backend owns validation and persistence. |
| Generated plan creation engine | Distance-goal AI/local-fixture authored preview, review, confirm, `planGoalIntent`, block policy | `src/lib/running-plan-engine-actions.ts`, `src/lib/running-plan-engine-review.ts`, `src/lib/ai-generated-running-plan.ts`, `src/lib/ai-authored-plan-first-compiler.ts`, minimal goal/endpoint/preview contracts under `src/lib/plan-creation-engine/`, plan-authoring validators | Retired Plan Presets, deterministic product builders, and voice-to-plan are not current canonical owners. |
| Active plan lifecycle, calendar, planned workouts | One calendar, Add plan, clear upcoming, schedule edit, row-state Add/Clear/Move/Edit | `src/components/Calendar.tsx`, `src/components/plan-management/*`, `src/lib/active-plan-persistence.ts`, `src/lib/active-plan-lifecycle-actions.ts`, `src/lib/active-plan-transition-actions.ts`, `src/lib/active-plan-schedule-edit-*`, `src/lib/active-plan-workout-editing/*` | Source kind is provenance; backend capability/readback owns mutation safety. |
| Manual workout authoring | Manual Add activity, constructor/review, templates, copy/paste, persisted manual edits | `src/components/manual-workout/*`, `src/lib/manual-workout-authoring/*`, `scripts/validate-manual-workout-authoring.ts` | Do not create route-local constructor truth; reuse backend constructor/review contracts. |
| Workout detail, readback, logging | Workout document readback, result logging, passive readback versus explicit edit boundaries | `src/routes/workout.$date.tsx`, `src/components/CompletionPanel.tsx`, `src/components/workout-completion/*`, `src/lib/workout-log-actions.ts`, `src/lib/training.ts`, `src/lib/route-data-actions.ts` | Provider evidence and plan intent stay separate; passive readback is non-inline-editable and backend row capabilities own explicit edit eligibility. |
| Import, export, provider evidence | JSON import/export, Garmin/FIT upload, actual metrics, comparisons | `src/components/UploadJsonDialog.tsx`, `src/lib/imported-plan.ts`, `src/lib/plan-replacement-actions.ts`, `src/lib/active-plan-export-actions.ts`, `src/lib/plan-export.ts`, `src/lib/workout-result-import/*` | Provider import creates actual evidence, not planned workouts; export excludes logs/evidence/comparisons. |
| Hito DS, reference, Figma capture | Code-owned UI primitives, tokens, specimens, downstream Figma capture | `src/styles.css`, `src/styles/*`, `src/components/ui/*`, `src/components/hito-ds/*`, `src/routes/hitoDS*.tsx` | `/hitoDS` specimens are not product CRUD; Figma capture is downstream, not source-of-truth. |
| Local devtools and inspector | Local-only DS audit and prompt generation | `src/components/devtools/*`, `src/components/ui/inline-editable-text.tsx`, `/hitoDS/patterns#inline-editable-text` | Local-only, no live UI mutation, no backend/Admin/Supabase/Work Items persistence. |
| Admin work items, capture, analytics | Internal admin capture/backlog, repo-derived work-item mirror, analytics, test accounts | `src/routes/admin.*.tsx`, `src/components/admin/*`, `src/lib/admin-capture*`, `src/lib/admin-work-items.ts`, `src/lib/admin-analytics.ts`, `scripts/import-repo-work-items-to-admin-backlog.ts` | Repo markdown remains canonical for repo-derived rows; imported rows are read-only mirrors. |
| Scripts, validators, QA infrastructure | Non-runtime proof, source-size ledger, local QA runtime, artifact hygiene | `scripts/*`, `scripts/**`, `docs/metrics/line-count-ledger.jsonl`, local QA server/build-output scripts, `qa-artifacts/` | Validators prove contracts; QA artifacts are protected evidence, not product runtime or cleanup targets. |
| Docs and source-of-truth | Current product/system/functional truth, active gates, shipped history | `docs/current-*.md`, `docs/plans/active/*`, `docs/tasks/*`, `docs/history/changelog.md`, `docs/work-dashboard.md` | Current docs describe implemented truth; active plans guide next work; avoid transcript-like Markdown growth. |
| Running coach doctrine and workout identity | Sports-quality policy, workout taxonomy, target honesty | `docs/tasks/running-coach/*`, `src/lib/rich-workout-model.ts`, `src/lib/planned-workout-language.ts`, `src/lib/planned-workout-block-contract.ts`, running-plan doctrine validators | Coach doctrine informs backend policy but does not create a second workout language. |

## Current Business Model

Hito is one calendar, not separate manual/generated/imported/preset products. A plan is bulk
scheduled workout creation on that calendar. After confirm, source kind is provenance rather than
workout-content edit permission. Every confirmed non-rest workout on today or a future date uses one
reviewed content-edit lifecycle; past workouts are not editable. Add/Clear/Move/Copy and schedule
operations retain separate capability and history rules.

Current plan/workout creation families:

- no-active structured/custom first-plan review
- no-active selected distance-goal review
- no-active empty manual calendar creation
- advanced JSON import/paste
- active-calendar `Add plan` reviewed transition for selected running-plan candidates
- manual calendar Add activity, copy/paste, and template reuse through the shared manual
  constructor/review model

Retired current-runtime owners:

- voice-to-plan / Dictate-to-Plan
- backend Plan Preset discovery/program actions
- deterministic selected-plan product builders
- old flat repeat fields and pair-shaped repeat persistence/readback compatibility
- stale `Open plan`, visible `Update plan`, and `Delete active plan` header IA

## Business Process And Entity Cleanup Map

The current runtime should keep one canonical calendar pipeline:

`profile/input -> reviewed plan or workout draft -> plan_cycles/planned_workouts -> row-state capabilities -> explicit risky mutation review -> workout_logs/provider evidence/readback`

| Process area | Current entrypoints | Canonical entities / metadata | Cleanup read |
| --- | --- | --- | --- |
| First plan creation | Manual setup, structured Quick setup, selected-distance review, advanced JSON import | `runner_profiles`, `plan_cycles`, `planned_workouts`, review tokens/checksums, `source_kind`/`source_status` | Multiple entrypoints are product choices, but persistence converges; do not add another storage path. |
| Active `Add plan` / replacement | Calendar `Add plan`, selected generated transition, advanced import fallback | old/new `plan_cycles`, archive/supersession metadata, transition checksum/revision | Preserve review/confirm and history; no silent replace or clear-then-create shortcut. |
| Calendar Add/Clear/Move/Edit | Calendar row menus, drag/drop, workout detail edit | `planned_workouts`, capability metadata, `active_plan_user_edit_v1`, `targetDayKind` | Content edit follows the today/future date rule; other actions keep operation-specific capabilities. |
| Manual authoring/templates/copy | Manual constructor, saved templates, copy/paste, persisted reviewed edit | `runner_manual_workout_templates`, reviewed draft metadata, manual reconstruction metadata | Keep manual reconstruction semantics; do not raw-clone rows or invent route-local constructor truth. |
| Workout detail/completion/FIT | Log result, Garmin/FIT/ZIP upload, comparison, AI insight | `workout_logs`, `workout_result_assets`, `workout_actual_metrics`, `workout_comparisons`, `workout_ai_insights` | FIT upload is actual evidence, not plan creation or planned-workout truth. |
| Generated plan engine | AI-authored plan-first Quick setup and selected-plan transition | rich workout fields, `plan_preferences`, plan-first review metadata, source status | Keep one provider/local-fixture -> compiler -> review -> confirm path; no deterministic replacement planner. |
| Admin/backlog import | Admin capture and repo-derived work items | `admin_capture_items`, markdown source path/type/status metadata | Repo markdown remains canonical for repo-derived rows; cleanup only through importer-safe Admin slices. |

| Entity / metadata group | Classification | Reason |
| --- | --- | --- |
| `source_kind`, `source_status`, `source_workout_id`, archive/supersession metadata | Keep: safety/audit/recovery | Needed for provenance, export/readback, protected history, and rollback reasoning. |
| review tokens/checksums, mutation checksums, `active_plan_user_edit_v1` | Keep: safety/audit/recovery | Proves explicit review/confirm, same-row move, no trusted-client-row mutation, and stale-token safety. |
| `targetDayKind: rest_day/workout_day` | Keep: product/view-model contract | Collapses no-row and explicit Rest targets into one public Rest-day target while preserving replacement review. |
| `target_had_no_persisted_workout_row` | Keep: internal exactness | Distinguishes missing persisted row from explicit Rest row without exposing a runner-facing Empty state. |
| runner-facing proof/debug metadata | Collapse candidate | Useful for QA/debug only when hidden or dev-only; avoid foregrounding proof copy to runners. |
| `training-api.ts` wrappers | Keep: compatibility | Route-facing server-function facade still has current wrappers; narrow only with fresh import map. |

## Shared Calendar And Mutation Ownership

- The saved calendar is the shared active-plan viewing surface for manual, selected/generated,
  imported, and AI-assisted active plans.
- Viewing is shared; Add/Clear/Move/Copy eligibility is backend-shaped and operation-specific.
- Workout-content edit availability is date-based: every confirmed non-rest today/future workout can
  enter reviewed editing regardless of source, logs, completion, or evidence; past rows cannot.
- [active-plan workout editing policy](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/active-plan-workout-editing/policy.ts)
  owns operation-specific Add/Clear/Move/Copy rules and the `active_plan_user_edit_v1` metadata
  shape; it must not use plan source as workout-content edit permission.
- Manual workout authoring owns workout-content construction, personal templates, and proved
  Copy/Paste reconstruction; it does not own whether the original active-plan source is editable for
  Add/Clear/Move.
- Frontend must render backend-shaped capabilities and must not infer mutation rights from source
  kind locally.
- Universal Copy/Paste is not shipped yet; Copy/Paste remains accepted for the proved manual path.

## Active-Plan Creation Paths

- Structured / AI-assisted first plan creates backend-reviewed `training-plan-v2` plans through the
  first-plan review/confirm seam.
- Selected-distance running plans create accepted distance-goal plans through backend preview,
  review token/checksum, AI/local-fixture-authored canonical draft truth, and active-plan
  persistence.
- Quick setup goal cards are UI shortcuts to distance goals, not backend Plan Preset programs.
- Manual user-built plans create `manual_user_built_plan_v1` active plans from reviewed manual
  workouts; later Add/Clear/Move edits use the same active-plan edit metadata model as other
  accepted active-plan sources without rewriting the original plan source.
- Starting a selected generated plan from an existing active manual plan uses a backend-owned
  reviewed transition seam: review is non-mutating, confirm revalidates selected-plan exactness plus
  active-plan revision, archives/supersedes the old manual plan, and activates the new selected plan
  without merging upcoming manual workouts.
- Advanced JSON import/replacement remains an advanced fallback and migration path.

## Flow Map

| Flow | Runner-facing capability | Current owner / proof boundary | Future-only boundary |
| --- | --- | --- | --- |
| No-active-plan entry | Signed-in runners without an active plan see creation choices instead of silent preview assignment. | `route-data-actions`, `running-plan-engine-actions`, `OnboardingGate`, and onboarding components. | No silent plan creation; do not mark unresolved IA blockers as cleanup-safe. |
| AI-authored plan-first draft | Runner enters profile/goal/training context, reviews the backend-compiled full draft, then confirms. | `running-plan-engine-actions`, `structured-first-plan-onboarding`, `ai-first-plan-draft-service`, `ai-authored-plan-first-compiler`, `active-plan-persistence`; generated-plan and doctrine validators. | `ai_authored_plan_first_v1` / `plan_first` only; no AI direct persistence, confirm-time AI call, or backend-authored fallback plan. |
| Selected-distance plan creation | Runner creates accepted distance-goal plans after preview/review/create. | `running-plan-engine-actions`, `running-plan-engine-review`, `ai-generated-running-plan`, `ai-authored-plan-first-compiler`, `active-plan-persistence`, minimal goal/endpoint/preview contracts; QA artifact `qa-artifacts/screenshots/2026-07-06/generated-plan-early-phase-dosing-qa/`. | Do not call AI at confirm; do not persist raw AI output; do not treat Marathon Base as current truth. |
| Quick setup goal shortcuts | 10K, Half Marathon, Marathon, and Custom are non-mutating distance inputs. | Selected create/review/confirm lives in running-plan engine actions/review; UI lives in onboarding selected-plan surfaces. | No backend Plan Preset programs; no deterministic product builders. |
| Active manual plan -> selected generated plan transition | Runner can review replacement impact before switching an active manual plan to a selected generated plan. | `active-plan-transition-actions`, `running-plan-engine-review`, `active-plan-persistence`. | No silent replacement, no merge of upcoming manual workouts, no deletion of logs/evidence. |
| Manual first create | Runner creates a manual active plan from one reviewed workout. | `manual-workout-authoring/actions`, `persistence`, `review-exactness`, `active-plan-persistence`; `validate-manual-workout-authoring`. | Do not persist empty manual plans silently. |
| Active-plan Add activity | Runner adds a reviewed workout to eligible today/future Rest or no-workout dates. | `active-plan-workout-editing/policy`, `manual-workout-authoring/active-plan-add`, shared manual controls. | No frontend row append; no unproved source/row mutation. |
| Personal saved templates | Runner saves and reuses reviewed manual workouts as personal templates. | `saved-templates`, `saved-template-repository`, manual authoring UI. | No organization/coach templates or frontend-owned template rows. |
| Manual Copy/Paste | Runner copies a manual workout and pastes it onto an eligible target day. | `copy-paste`, `copy-paste-reconstruction`, `active-plan-add`; calendar occupied-day/Add menus. | No raw row duplication, recurrence, or universal Copy/Paste across non-manual plans. |
| Active-plan Delete/Clear | Runner clears eligible unlogged planned workouts after backend-shaped review. | `active-plan-workout-editing/*`, `manual-workout-authoring/delete-clear`, `review-exactness`, `persistence`. | No Restore UI; logged/evidence-backed/protected/occupied/rest rows remain blocked. |
| Active-plan Move Workout | Runner moves eligible unlogged rows while preserving source provenance. | `active-plan-workout-editing/*`, `manual-workout-authoring/move-workout`, calendar/move controls. | No swap, batch move, recurrence, frontend copy+delete, or local schedule truth. |
| Persisted workout content edit | Every confirmed non-rest workout on today or a future date enters one reviewed edit lifecycle regardless of source, logs, completion, or evidence; past rows remain non-editable. | Product rule: `docs/current-product.md`; implementation owners: `manual-workout-authoring/edit-workout`, edit review token, `active-plan-workout-editing/policy`, atomic persistence/history contract, source capabilities, workout detail UI. | No inline mutation or Rest editing. Review/confirm, auth, stale protection, provenance, and durable pre-edit history remain mandatory; current runtime still implements the older future-unlogged/source-limited subset. |
| Active plan viewing | Runner sees shared calendar, workout detail, progress, and result state for any active plan source. | `training`, `route-data-actions`, `workout-log-actions`, feedback/import modules; Calendar/workout/progress surfaces. | `/hitoDS` specimens are not product behavior; source provenance does not deny today/future content editing. |
| Hito inline editable text pattern | Shared inline editable/read-only primitive plus non-mutating local inspector task targeting. | `inline-editable-text`, devtool target utilities, manual constructor title, `/hitoDS/patterns`. | This primitive does not mutate passive generated readback or imply fake Admin Capture persistence; post-confirm workout editing is a separate reviewed action. |
| Calendar plan actions | Header uses `Add plan` plus overflow utilities. | Lifecycle/export/schedule-edit/transition backend seams; calendar/header controls and plan-management modules. | No `Open plan`, visible `Update plan`, or `Delete active plan` header IA. |
| Clear upcoming schedule | Runner clears upcoming mutable schedule while history stays preserved. | `active-plan-lifecycle-actions`; overflow clear-upcoming control. | No half-active truncated plan state and no hard deletion of history. |
| Advanced JSON import / replace | Runner imports `training-plan-v2` as advanced fallback with backend start-date policy. | `imported-plan`, `plan-replacement-actions`, `active-plan-persistence`, `UploadJsonDialog`. | Legacy `week_1_preview[]` is removed; no QR/share import yet. |
| Text replacement | Saved-mode text replacement remains a backend review/apply seam. | `plan-replacement-actions`. | No AI direct mutation or silent apply. |
| JSON export | Runner exports persisted active plan JSON from the calendar overflow. | `active-plan-export-actions`, `plan-export`, `plan-export-download`. | Markdown/PDF/watch export, public links, QR, and import-from-export remain outside current header IA. |
| QA server lifecycle | QA uses one canonical built local server to prove browser behavior. | `qa-local-server.mjs`, build/finalize scripts; managed runtime is outside iCloud cache. | Do not start duplicate app servers unless required. |
| Admin work items | Admin can see repo-derived work items and quick notes in one Work Items surface. | `admin-capture*`, admin route, `import-repo-work-items-to-admin-backlog`. | Markdown remains canonical for repo-derived rows; no automatic Codex dispatch. |
| Future exchange/share | QR/share/import model for Hito plan exchange. | No accepted current runtime owner. | QR, public/private links, import from share, expiry/revocation remain future-only. |

## Validators And Proof Infrastructure

Keep these accepted proof paths until a cleanup slice replaces them:

- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `node --import tsx ./scripts/validate-plan-goal-intent-contract.ts`
- `node --import tsx ./scripts/validate-ai-generated-running-plan-creation.ts`
- `node --import tsx ./scripts/validate-planned-workout-language.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
- `npm run validate-admin-capture-backlog`
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run build` when imports, public exports, or browser-visible behavior changes
- `npm run qa:server:status|restart|start|stop` for the persistent built QA server lifecycle

QA artifacts remain local/gitignored by default under `qa-artifacts/`. They prove acceptance but are
not product runtime. Do not delete local artifacts during source cleanup unless a separate QA
evidence retention task scopes that deletion.

## Future-Only Boundaries

Future-only artifacts may remain as docs, specs, or backlog items, but cleanup audits should not
count them as current runtime owners.

Do not use these future ideas to justify keeping or adding runtime code as shipped behavior:

- QR codes, public/private share links, import from shared/exported plan, applying someone else's
  plan, mobile deep-link import, expiry, or revocation
- PDF export, watch/Garmin/Suunto export, or import-from-export beyond current advanced JSON import
- organization or coach authoring
- recurrence/batch expansion
- Restore/Put back/Redo UI
- inline mutation that bypasses the accepted reviewed today/future content-edit path
- universal Copy/Paste across generated, selected, imported, or AI active plans
- broader source/row mutation matrices beyond QA-proved Add/Clear/Move slices
- AI continuation blocks inside an existing manual plan
- deeper modal/mobile visual polish unless selected by a frontend/design gate

## Cleanup Audit Rules

- Start with the Service-Domain Ownership Map, then map the file to a current flow above.
- Prefer deletion/reuse/consolidation over pure extraction.
- Preserve accepted behavior for generated-plan gates, manual authoring, Hito DS primitives, local
  inspector local-only/no-persistence behavior, Admin Work Items, and provider evidence boundaries.
- Do not use stale line-count tables from old cleanup ledgers as current truth. Use the active
  [source-size governance plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md)
  and fresh non-mutating source scans for cleanup selection.
- `docs/work-dashboard.md` is generated. If dashboard truth must change, update the owning plan/docs
  and run the approved dashboard command instead of hand-editing the dashboard.
- `logs/`, `qa-artifacts/`, `test-results/`, `node_modules/`, build/cache roots, and coverage roots
  are generated/proof/vendor surfaces. Keep them out of product-code size claims unless the task
  explicitly scopes local artifact hygiene.

## Historical Cleanup Ledger Boundary

The old G-slice cleanup burndown, superseded hotspot tables, and per-slice closeout chains are
historical context. They should not live in this current functional map as active routing truth.
Use archived plans and the active source-size governance plan for cleanup history and measured
source-size tracking.

## Immediate Next Gate

Next cleanup selection is owned by the active
[source-size governance plan](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-30-hito-source-size-governance-and-cleanup-plan.md),
not by this map. This file should stay a compact functional/domain map used to classify future
cleanup candidates.

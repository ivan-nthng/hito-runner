# Hito Stack Simplification Strike

## Status

in_progress

## Type

plan

## Priority

high

## Next Recommended Role

BACKEND

## Task

Run Slice 13A: manual workout authoring validator lifecycle extraction.

## Stage

BACKEND cleanup / manual MVP proof-infrastructure decomposition without behavior changes.

## Running-Plan Quality Blocker Resolved — Cleanup Resumed

Status update, 2026-06-12:

- The running-plan quality blocker that paused code-freeze cleanup after Slice 12C is closed.
- QA passed the universal runner-facing richness and executable prescription grammar repair.
- Running Coach accepted the final quality rerun.
- Proof covered `17` acceptance scenarios across `10K`, `Half Marathon`, `Marathon Base`, and
  `Marathon Completion`, all preview-ready.
- Accepted proof recorded `0` unresolved ranges, `0` unresolved executable segments, `0` richness
  issues, `0` prescription grammar issues, `0` awkward standard durations,
  `0` vague effort-only targets, `0` fake pace, `0` fake personal HR, and
  `0` forbidden runner-facing language.
- `Marathon Base` remains base-only.
- `Marathon Completion` remains exact `42195m` and completion-focused, not performance-marathon.
- This was a backend/canonical generation fix, not a frontend copy patch.
- Proof boundary was backend-owned scenario, canonical review, confirm exactness,
  `training-plan-v2`, and imported-plan/export-shaped artifact proof. Authenticated browser
  selected-plan UI was not the proof surface for this gate.

Architecture decision:

- Resume code-freeze cleanup.
- Do not resume with runtime frontend/backend refactors yet.
- Select the next cleanup gate from proof infrastructure, where behavior can be preserved and
  validated without touching accepted runner-facing UI or persistence.

Current proof-infrastructure hotspot snapshot:

| File | Current lines | Decision |
| --- | ---: | --- |
| [manual workout validator](../../../scripts/validate-manual-workout-authoring.ts) | `3308` | Selected next cleanup gate. |
| [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) | `3382` | Keep stable after Slices 12A-12C; do not continue broad extraction until the manual MVP validator is split. |
| [AI first-plan blueprint/envelope proof owner](../../../scripts/plan-authoring-doctrine/ai-first-plan-blueprint-envelope.ts) | `2546` | Keep; extracted owner from Slice 12C. |
| [first-plan release gates](../../../scripts/plan-authoring-doctrine/first-plan-release-gates.ts) | `1366` | Keep; already focused release-gate owner. |

Selected next gate:

`BACKEND Slice 13A: manual workout authoring validator lifecycle extraction`.

Why this is next:

- The manual builder MVP is now QA-passed in the proved scope: first create, add activity, personal
  saved templates, copy/paste, delete/clear, move workout, and JSON/Markdown export.
- The validator is now a larger proof-infrastructure hotspot than the remaining main doctrine
  validator.
- It mixes multiple accepted manual lifecycle proof islands in one file, including review fixtures,
  saved templates, first-create persistence, add-to-existing-plan, copy/paste, delete/clear,
  move-workout, export, active-plan editability, date-only labels, and disposable persistence
  preflight.
- This is safer than touching [ManualWorkoutAuthoringControls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx),
  [Calendar](../../../src/components/Calendar.tsx), [training-api](../../../src/lib/training-api.ts),
  or accepted persistence/runtime seams during code-freeze cleanup.

Expected implementation shape:

- Keep `node --import tsx ./scripts/validate-manual-workout-authoring.ts` as the stable public
  command.
- Extract exactly one coherent lifecycle proof island into
  `scripts/manual-workout-authoring/`.
- Recommended first island: saved-template review/save/reconstruct proof, because it is cohesive,
  already has a persistence-adjacent helper folder, and is lower-risk than copy/paste/delete/move
  mutation assertions.
- Preserve every assertion and fixture. Do not reduce coverage for line-count optics.
- Keep disposable persistence harness behavior unchanged.
- Update this plan with line-count impact, extracted owner, preserved command, and remaining manual
  validator hotspots.

Exact handoff prompt:

```text
ROLE: BACKEND

Task:
Run Slice 13A: manual workout authoring validator lifecycle extraction.

Stage:
BACKEND cleanup / manual MVP proof-infrastructure decomposition without behavior changes.

Plan:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-07-hito-stack-simplification-strike.md

Context:
Code-freeze cleanup may resume because the running-plan universal runner-facing richness and
prescription-quality blocker is QA-passed and Running Coach accepted. Do not touch running-plan
runtime behavior in this slice.

The next selected cleanup gate is proof-infrastructure only:
- scripts/validate-manual-workout-authoring.ts is now about 3308 lines.
- The manual builder MVP is QA-passed in the proved scope: first create, add activity, personal
  saved templates, copy/paste, delete/clear, move workout, and JSON/Markdown export.
- The validator mixes accepted manual lifecycle proof islands in one file.

Root cause:
The visible symptom is code-size/reviewability growth in the manual authoring validator.
The underlying cause is that multiple accepted lifecycle proofs accumulated in one public
validation command.
The canonical owner is scripts/proof infrastructure. Keep runtime source and UI untouched.

Required reading:
1. AGENTS.md
2. agents/backend.agent.md
3. skills/hito-backend-supabase-contract/SKILL.md
4. skills/hito-plan-writing-and-closeout/SKILL.md
5. docs/current-functional-map.md
6. docs/plans/active/2026-06-07-hito-stack-simplification-strike.md
7. docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
8. scripts/validate-manual-workout-authoring.ts
9. scripts/manual-workout-authoring/persistence-proof.ts
10. src/lib/manual-workout-authoring/*

Scope:
1. Keep `node --import tsx ./scripts/validate-manual-workout-authoring.ts` as the stable public
   command.
2. Extract exactly one coherent lifecycle assertion island into `scripts/manual-workout-authoring/`.
3. Preferred first island: saved-template review/save/reconstruct proof, including user scoping,
   display name/icon validation, backend review reconstruction, fake pace/HR rejection, and
   unsupported payload rejection.
4. Preserve every assertion, fixture, source-boundary check, and strict metric-truth check.
5. Keep disposable persistence preflight and guarded remote override behavior unchanged.
6. Update the active simplification strike plan with Slice 13A result, line-count impact, extracted
   owner, preserved command, and remaining validator hotspots.

What must not change:
- No product runtime behavior.
- No frontend UI.
- No Supabase mutation except existing validator behavior when explicitly invoked with approved
  guarded persistence flags.
- No migrations.
- No browser QA.
- No deletion of validation coverage.
- No copy/paste, delete/clear, move, export, recurrence, edit, Restore UI, QR/share/import, or
  manual-builder product behavior changes.
- No changes to running-plan engine runtime/source behavior.

Validation:
- `npm exec eslint -- scripts/validate-manual-workout-authoring.ts scripts/manual-workout-authoring/*.ts`
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- Scoped `git diff --check` for changed files.
- New-file whitespace check if a new helper file is created.
- No build is required unless runtime imports/config changed unexpectedly.
```

## Slice 12C Closeout — 2026-06-12

Status: accepted / complete.

Slice:

`BACKEND Slice 12C: AI first-plan blueprint/envelope doctrine extraction`.

What changed:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) remains
  the stable public entrypoint for the doctrine proof command.
- [AI first-plan blueprint/envelope proof owner](../../../scripts/plan-authoring-doctrine/ai-first-plan-blueprint-envelope.ts)
  is the new focused module for the AI first-plan blueprint/envelope doctrine assertion island.
- The extracted island covers AI first-plan authoring input builders, blueprint fixtures,
  blueprint workout-template helpers, goal-family cadence assertions, blueprint prompt/schema and
  normalization/failure assertions, envelope decode/expand/trace assertions, and road-specificity
  envelope assertions.
- The main validator now calls the AI proof owner through dependency injection for shared fixed-rest,
  metric, rich-workout, and long-run assertions.
- Shared broader specificity/repair checks that still belong to surrounding cadence doctrine stayed
  in the main validator for this slice.
- The main validator went from `5677` lines to `3382` lines.
- The new focused AI first-plan proof owner is `2546` lines.

Acceptance evidence:

- `npm exec eslint -- scripts/validate-plan-authoring-doctrine.ts scripts/plan-authoring-doctrine/*.ts`
  passed.
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` passed with
  `Plan authoring doctrine fixtures passed.`
- Scoped `git diff --check` and new-file whitespace checks passed.
- `npm run build` was not required unless imports/config/runtime compilation changed; this slice
  only moved proof scripts/docs and executed the TSX validator directly.

Cleanup progress:

- Code-freeze proof-infrastructure cleanup has now extracted three coherent doctrine islands:
  rich workout import/export, active-plan refresh, and AI first-plan blueprint/envelope.
- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) has
  been reduced from `6855` lines before Slice 12A to `3382` lines after Slice 12C.
- The new focused proof owners total:
  [rich workout import/export](../../../scripts/plan-authoring-doctrine/rich-workout-import-export.ts)
  at `436` lines,
  [active-plan refresh](../../../scripts/plan-authoring-doctrine/active-plan-refresh.ts) at `888`
  lines, and
  [AI first-plan blueprint/envelope](../../../scripts/plan-authoring-doctrine/ai-first-plan-blueprint-envelope.ts)
  at `2546` lines.
- This is a reviewability/source-ownership cleanup, not shipped runner-facing behavior and not a
  product-size deletion claim.

Architecture decision:

- Accept Slice 12C as complete.
- Treat Slice 12C as internal proof-infrastructure cleanup, not shipped user-facing behavior.
- Do not add a [changelog](../../history/changelog.md) entry.
- Pause further cleanup implementation gates behind the active running-plan quality blocker.
- Do not select another cleanup slice until the confirmed Marathon Base export flatness incident is
  either accepted by Running Coach as coach-credible or routed to Backend for a bounded
  composition/diversity fix.
- Runtime refactor, frontend cleanup, manual validator decomposition, and additional doctrine
  extraction remain blocked while the plan engine may still produce coach-poor confirmed plans.

Selected next gate:

`RUNNING COACH: Marathon Base confirmed-export flatness quality blocker follow-up`.

Why this is next:

- The visible symptom is a confirmed Marathon Base export that QA classified as too flat.
- The likely underlying cause is backend composition truth, not validator file shape.
- The canonical first owner is Running Coach quality acceptance unless that incident has already
  reported a precise Backend fix.
- Continuing broad code-freeze cleanup would optimize proof infrastructure while a runner-facing
  plan-quality blocker remains unresolved.

## Slice 12B Closeout — 2026-06-12

Status: accepted / complete.

Slice:

`BACKEND Slice 12B: active-plan refresh doctrine assertion extraction`.

What changed:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) remains
  the stable public entrypoint for the doctrine proof command.
- [active-plan refresh proof owner](../../../scripts/plan-authoring-doctrine/active-plan-refresh.ts)
  is the new focused module for the active-plan refresh doctrine assertion island.
- The extracted island covers rich draft normalization/fallback, apply-source non-generation proof,
  proposal/rich-draft timeout fallback, review metadata checksum proof, stored authoring truth
  preference, protected-history mutable guards, mountain refresh doctrine, and refresh fixture
  builders.
- The main validator now calls the new owner through dependency injection.
- Shared helpers such as fixed-rest-day assertions, metric checks, trail doctrine, and rich workout
  contract checks remain shared instead of duplicated.
- The main validator went from `6458` lines to `5677` lines.
- The new focused owner is `888` lines.

Acceptance evidence:

- `npm exec eslint -- scripts/validate-plan-authoring-doctrine.ts scripts/plan-authoring-doctrine/*.ts`
  passed.
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` passed with
  `Plan authoring doctrine fixtures passed.`
- Scoped `git diff --check` passed.
- New-file whitespace checks passed.
- `npm run build` was skipped appropriately because only proof scripts/docs changed and the TSX
  validator entrypoint was executed directly.

Architecture decision:

- Accept Slice 12B as complete.
- Treat this as internal proof-infrastructure cleanup, not shipped user-facing behavior.
- Do not add a [changelog](../../history/changelog.md) entry.
- Continue one more backend/script proof-infrastructure cleanup slice before moving to runtime
  frontend cleanup or manual validator decomposition.

Selected next gate:

`BACKEND Slice 12C: AI first-plan blueprint/envelope doctrine extraction`.

Why this is next:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) is still
  `5677` lines and remains the largest proof-infrastructure hotspot.
- AI first-plan blueprint/envelope prompt, schema, fixture, normalization, trace, and failure checks
  form a coherent remaining assertion island in the main validator.
- This remains lower-risk than decomposing the newer
  [manual workout validator](../../../scripts/validate-manual-workout-authoring.ts) or touching
  accepted runtime UI such as
  [manual authoring controls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx)
  and [Calendar](../../../src/components/Calendar.tsx).
- The next slice is still script-only and must preserve validation coverage.

## Slice 12A Closeout — 2026-06-12

Status: accepted / complete.

Slice:

`BACKEND Slice 12A: plan-authoring doctrine validator ownership extraction`.

What changed:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) remains
  the stable public entrypoint for the doctrine proof command.
- [rich workout import/export proof owner](../../../scripts/plan-authoring-doctrine/rich-workout-import-export.ts)
  is the new focused module for one extracted assertion island.
- The extracted island covers rich persistence readback, carry-forward, import/export roundtrip,
  template validation, reference import identity preservation, saved-mode QA fixture checks, compact
  fallback, and no fake pace/HR fixture proof.
- The main validator went from `6855` lines to `6458` lines.
- The new focused owner is `436` lines.
- Backend intentionally chose this smaller island instead of active-plan refresh checks because
  refresh has broader draft/proposal fixture coupling and should remain a separate cleanup slice.

Acceptance evidence:

- `npm exec eslint -- scripts/validate-plan-authoring-doctrine.ts scripts/plan-authoring-doctrine/*.ts`
  passed.
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` passed with
  `Plan authoring doctrine fixtures passed.`
- New-file whitespace check passed.
- Scoped `git diff --check` passed.
- `npm run build` was skipped appropriately because only script/docs proof infrastructure changed
  and the TSX entrypoint was validated directly.

Architecture decision:

- Accept Slice 12A as complete.
- Treat this as internal proof-infrastructure cleanup, not shipped user-facing behavior.
- Do not add a [changelog](../../history/changelog.md) entry.
- Continue backend/script proof-infrastructure cleanup before moving to runtime frontend cleanup.

Selected next gate:

`BACKEND Slice 12B: active-plan refresh doctrine assertion extraction`.

Why this is next:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) is still
  `6458` lines and remains the largest proof-infrastructure hotspot.
- Active-plan refresh rich-draft/proposal assertions are still a coherent proof island inside the
  same monolith.
- This keeps the cleanup path low-risk: script-only, behavior-preserving, and no Supabase/browser
  surface.
- It is safer than decomposing [manual workout validator](../../../scripts/validate-manual-workout-authoring.ts)
  immediately after the manual MVP acceptance, and safer than touching
  [manual authoring controls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx)
  or [Calendar](../../../src/components/Calendar.tsx), which are accepted runtime UI surfaces.

## Code-Freeze Cleanup Inventory — 2026-06-12

Primary source of truth:

- [current functional map](../../current-functional-map.md)

Decision:

The first code-freeze cleanup implementation gate is still
`BACKEND Slice 12A: plan-authoring doctrine validator ownership extraction`, but the selection is
now re-accepted against the updated functional map and current source size baseline.

Root-cause framing:

- Visible symptom: Hito grew quickly while selected-distance plan creation, manual user-built
  plans, manual calendar editing, active-plan export, QA server tooling, AI first-plan authoring,
  and running-plan engine validation shipped in parallel.
- Underlying cause: accepted capability now spans several source-of-truth seams, so cleanup must
  start from shipped business flows rather than line count alone.
- Canonical owner for this pass: architecture inventory first, then one bounded backend cleanup
  slice that preserves every accepted flow.

Current measured baseline:

| Area | Count | Notes |
| --- | ---: | --- |
| `src` TS/TSX/CSS files | `240` | Runtime, product UI, admin, Hito DS, and internal helpers. |
| `src` TS/TSX/CSS lines | `103883` | Source size is now above the earlier simplification-strike baseline. |
| `scripts` TS/TSX/MJS/JS files | `29` | Validators, proof harnesses, importers, and ops scripts. |
| `scripts` TS/TSX/MJS/JS lines | `29292` | Proof infrastructure is a major growth area. |

Largest audited hotspots:

| File | Lines | Classification | Freeze decision |
| --- | ---: | --- | --- |
| [training API facade](../../../src/lib/training-api.ts) | `698` | required runtime / compatibility facade | Keep; audit later for export narrowing only after route imports are mapped. |
| [manual workout validator](../../../scripts/validate-manual-workout-authoring.ts) | `3052` | required validation/proof infrastructure | Keep; decompose later by first-create/add/templates/copy/delete/move/export after Slice 12A. |
| [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) | `6855` | required validation/proof infrastructure / decomposition hotspot | Selected first cleanup gate. |
| [manual authoring controls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx) | `2032` | required frontend runtime / decomposition hotspot | Defer; requires frontend DS preflight and browser regression. |
| [Calendar](../../../src/components/Calendar.tsx) | `1057` | required frontend runtime | Keep; avoid changing accepted manual calendar behavior during freeze inventory. |
| [PlanManagementDialog](../../../src/components/PlanManagementDialog.tsx) | `1152` | required frontend runtime / plan lifecycle shell | Keep; decompose only through existing panel seams. |
| [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts) | `1591` | required runtime according to current docs | Keep; audit later as schedule-edit owner, not manual Move replacement. |
| [active-plan schedule edit validator](../../../scripts/validate-active-plan-schedule-edit-preview.ts) | `560` | required validation/proof infrastructure | Keep with schedule-edit preview until a dedicated audit says otherwise. |

Cleanup inventory:

### Backend Runtime

Required runtime:

- manual workout authoring modules under [manual-workout-authoring](../../../src/lib/manual-workout-authoring/)
- [active-plan persistence](../../../src/lib/active-plan-persistence.ts)
- [active-plan export actions](../../../src/lib/active-plan-export-actions.ts)
- [plan export](../../../src/lib/plan-export.ts)
- [running-plan engine actions](../../../src/lib/running-plan-engine-actions.ts)
- [first-plan actions](../../../src/lib/first-plan-actions.ts)
- [plan replacement actions](../../../src/lib/plan-replacement-actions.ts)
- [active-plan refresh actions](../../../src/lib/active-plan-refresh-actions.ts)
- [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts)

Compatibility-only or audit-first:

- [training API facade](../../../src/lib/training-api.ts): keep as route/server-function compatibility
  facade; shrink only after import consumers are mapped.
- AI strict/envelope/draft ops files: keep only as doctrine/proof/internal ops paths; do not treat
  strict nested draft as normal product runtime.
- old Plan Preset review/confirm behavior: keep only as bounded blocked/preview-only compatibility.

Safe deletion/demotion candidates:

- No backend runtime deletion is selected in this pass. The functional map does not yet prove a
  runtime path is dead enough to delete safely.

### Frontend Runtime

Required runtime:

- [OnboardingGate](../../../src/components/OnboardingGate.tsx)
- [StructuredPlanConstructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx)
- [ManualUserBuiltPlanPanel](../../../src/components/onboarding/ManualUserBuiltPlanPanel.tsx)
- [selected-plan preview dialog](../../../src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx)
- [Calendar](../../../src/components/Calendar.tsx)
- [Hito calendar day primitive](../../../src/components/ui/hito-calendar-day.tsx)
- [ManualWorkoutAuthoringControls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx)
- [ManualWorkoutMoveControls](../../../src/components/manual-workout/ManualWorkoutMoveControls.tsx)
- [PlanManagementDialog](../../../src/components/PlanManagementDialog.tsx)
- [plan-management panel components](../../../src/components/plan-management/)

Suspect/decompose:

- [ManualWorkoutAuthoringControls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx)
  should be the first manual UI decomposition candidate after the backend validator cleanup, but
  not before freeze inventory because it is accepted runtime UI and needs browser QA.
- [Calendar](../../../src/components/Calendar.tsx) can be audited for action-menu extraction later,
  but must not become a local schedule-truth owner.
- [PlanManagementDialog](../../../src/components/PlanManagementDialog.tsx) should continue splitting
  only through already-established panel seams.

Safe deletion/demotion candidates:

- No frontend runtime deletion is selected in this pass. UI cleanup is intentionally deferred behind
  proof-infrastructure cleanup.

### Scripts, Validators, and Proof Infrastructure

Required validation/proof infrastructure:

- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`
- `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`
- `node --import tsx ./scripts/generate-running-plan-engine-scenarios.ts`
- `node --import tsx ./scripts/validate-active-plan-schedule-edit-preview.ts`
- `npm run validate-admin-capture-backlog`
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`

Suspect/decompose:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) is the
  first selected cleanup gate. It should keep the public command stable while moving one assertion
  island into [plan-authoring-doctrine modules](../../../scripts/plan-authoring-doctrine/).
- [manual workout validator](../../../scripts/validate-manual-workout-authoring.ts) is the next
  likely script decomposition candidate after Slice 12A. Do not split it before the manual MVP
  acceptance remains stable in cleanup QA.
- [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts) remains internal ops
  proof; audit later after blueprint/envelope ownership is settled.

### Docs, Plans, and Backlog

Required docs/source of truth:

- [current functional map](../../current-functional-map.md)
- [current product](../../current-product.md)
- [current system](../../current-system.md)
- [current state](../../current-state.md)
- [changelog](../../history/changelog.md)
- [manual workout authoring active plan](2026-06-09-manual-workout-authoring-and-user-built-plans.md)
- [running-plan creation engine active plan](2026-06-08-running-plan-creation-engine-rebuild.md)
- [this simplification strike](2026-06-07-hito-stack-simplification-strike.md)

Audit-first docs:

- [heart-rate zones active plan](2026-05-14-heart-rate-zones-profile-and-aet-estimation-plan.md)
- [voice-to-plan authoring active plan](2026-05-18-voice-to-plan-authoring-plan.md)
- [Polar auto sync active plan](2026-05-21-polar-auto-sync-integration-plan.md)

These older active plans are source-of-truth hygiene candidates, not the first code-freeze cleanup
implementation gate. They should be classified separately as active, backlog, or archive before
freeze.

### Future-Only Artifacts

Keep out of the first cleanup implementation gate:

- QR/share/import
- recurrence
- edit workout
- Restore/Put back/Redo UI
- PDF/watch export
- generated/preset/imported/running-engine manual mutation
- active-plan replacement/refresh expansion
- route/modal polish
- new preset families

Candidate table:

| Candidate | Type | Impact | Risk | Decision |
| --- | --- | --- | --- | --- |
| Plan-authoring doctrine validator ownership extraction | Decompose proof infrastructure | High reviewability; isolates largest script hotspot | Low runtime risk if assertions stay unchanged | Selected |
| Manual workout validator decomposition | Decompose proof infrastructure | Medium/high; aligns with completed manual MVP | Medium because manual MVP is newly accepted and validator protects many flows | Defer until after Slice 12A |
| Manual authoring controls decomposition | Frontend runtime decomposition | High UI reviewability | Requires browser QA and risks accepted manual builder surface | Defer |
| Training API facade narrowing | Runtime facade cleanup | Medium | Requires full import/route audit; can break server-function consumers | Defer |
| Active-plan schedule edit preview audit | Runtime/source-of-truth audit | Medium | Current docs say it is implemented product behavior | Keep/audit later |
| Older active-plan archive cleanup | Docs/source-of-truth hygiene | Low runtime impact | Requires canonical-plan comparison | Defer behind runtime/proof cleanup |

Selected first cleanup gate:

`BACKEND Slice 12A: plan-authoring doctrine validator ownership extraction`.

Expected implementation shape:

- Keep `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts` as the stable command.
- Extract exactly one assertion island into [scripts/plan-authoring-doctrine](../../../scripts/plan-authoring-doctrine/).
- Prefer the rich workout/readback/refresh assertion island because it is cohesive and already
  conceptually separate from first-plan release gates.
- Preserve every assertion; do not reduce validation coverage just to lower line count.
- Record line-count/reviewability impact and remaining validator hotspots in this plan.

## Parallel Cleanup Audit After R8 Confirm/Persist Work

Decision date: 2026-06-09.

Purpose:

Resume service-size reduction without blocking the ongoing running-plan R8/R8B confirm/persist
track. This audit is deliberately parallel: it selects a cleanup target outside the R8 create-path
files unless a direct safety conflict appears.

Current measured size baseline:

| Area | Current count | Notes |
| --- | ---: | --- |
| `src` TS/TSX/CSS files | `221` files | Runtime/product/admin/DS source; generated route tree is included if checked in. |
| `src` TS/TSX/CSS lines | about `91,990` lines | Excludes docs, lockfiles, `node_modules`, and QA artifacts. |
| `scripts` TS/TSX/MJS/JS files | `27` files | Validators, harnesses, importers, and ops scripts. |
| `scripts` TS/TSX/MJS/JS lines | about `23,977` lines | Validation/tooling bloat remains significant. |
| `docs/plans` + `docs/tasks` markdown/CSV | `143` files / about `72,102` lines | Planning/history/reference load; not service runtime. |
| `qa-artifacts` | about `386M` | Gitignored/local generated proof artifacts; cleanup is disk hygiene, not runtime code reduction. |

Largest current source hotspots:

| File | Lines | Category | Audit note |
| --- | ---: | --- | --- |
| [global styles](../../../src/styles.css) | `5132` | runtime CSS / DS/product/admin styles | Slice 14A removed confirmed dead selectors; further cleanup needs QA/visual proof. |
| [Hito DS route](../../../src/routes/hitoDS.tsx) | `4072` | internal DS route | Already decomposed once; further split should wait for DS/test-calendar tracks. |
| [Admin analytics route](../../../src/routes/admin.analytics.tsx) | `2393` | admin UI runtime | Decompose later; current admin surface is live. |
| [Admin capture route](../../../src/routes/admin.capture.tsx) | `2125` | admin UI runtime | Decompose later; current work-items surface is live. |
| [voice-to-plan authoring](../../../src/lib/voice-to-plan-authoring.ts) | `1685` | product/runtime AI assist | Keep until rebuilt custom/advanced engine replacement is accepted. |
| [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts) | `1591` | product/runtime schedule preview | Current reviewed mutation boundary; keep. |
| [first-plan actions](../../../src/lib/first-plan-actions.ts) | `1551` | product/runtime first-plan actions | Broad but live; defer until create-engine replacement settles. |
| [structured plan authoring workouts](../../../src/lib/structured-plan-authoring-workouts.ts) | `1398` | deterministic generator compatibility | Keep while legacy/readback/custom paths still depend on it. |
| [imported plan contract](../../../src/lib/imported-plan.ts) | `1355` | canonical import/readback | Keep; schema/import compatibility owner. |
| [CompletionPanel](../../../src/components/CompletionPanel.tsx) | `1342` | workout detail UI | Decompose later through frontend DS/workout-detail slice. |

Largest current script hotspots:

| File | Lines | Category | Audit note |
| --- | ---: | --- | --- |
| [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) | `6788` | validation harness | Selected next cleanup gate; too broad for safe review. |
| [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts) | `2114` | ops/diagnostic | Keep until blueprint/envelope diagnostics are consolidated. |
| [repo work-item importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts) | `1815` | admin tooling | Keep; bounded importer diagnostics are current. |
| [first-plan release gates](../../../scripts/plan-authoring-doctrine/first-plan-release-gates.ts) | `1349` | validation harness | Keep; already extracted release-gate owner. |
| [admin capture validator](../../../scripts/validate-admin-capture-backlog.ts) | `1078` | admin validation | Keep; admin work-items safety net. |
| [running-plan scenario generator](../../../scripts/generate-running-plan-engine-scenarios.ts) | `974` | running-plan validation/artifacts | Keep while R8/Rich preview work is active. |

Weak spots found:

- Runtime product code:
  - [training API facade](../../../src/lib/training-api.ts) is still broad, but it is touched by R8
    exports and should not be narrowed in parallel with R8B/QA.
  - first-plan, voice/text/custom, structured authoring, and active-plan refresh seams still overlap
    conceptually, but several are live or needed for compatibility until the rebuilt engine fully
    owns custom/advanced creation.
- Validation/test harnesses:
  - [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
    remains the biggest weak seam. It mixes rich workout, import/export, refresh, structured,
    blueprint, envelope, and first-plan release-gate assertions.
  - validation scripts are not product runtime bloat, but a 6.7k-line harness becomes a weak
    architecture seam when future agents cannot see which assertions belong to which product owner.
- Docs/plans/specs:
  - active docs remain large and numerous; this is admin/backlog visibility load, not runtime code.
  - stale active-plan cleanup should continue separately through Admin Work Items/source-of-truth
    hygiene, not as this implementation slice.
- Generated/local artifacts:
  - `qa-artifacts` is large at about `386M`, but it is gitignored proof output. Do not treat it as
    service code. Add a disk-hygiene task later only if local storage becomes a problem.
- Compatibility/legacy stubs:
  - old Plan Preset review/confirm remains safely bounded as `preview_only`.
  - `structured_authoring_v1` compatibility is still intentional and must not be deleted.
  - old strict nested AI draft runtime was already deleted in Slice 10C.

Cleanup candidates considered:

| Candidate | Type | Expected impact | Risk | Decision |
| --- | --- | ---: | --- | --- |
| Doctrine validator ownership extraction | Decompose | High reviewability; can shrink main script by moving `1000+` lines into focused owners | Low runtime risk; script-only if behavior is preserved | Selected |
| Training API facade narrowing | Consolidate/delete exports | Medium runtime simplification | Direct file conflict risk with R8/R8B and route/serverFn imports | Defer until R8 completes |
| Voice/text/custom authoring consolidation | Audit then demote | Potentially high | Replacement advanced/custom engine is not accepted yet | Defer |
| Admin analytics/capture route decomposition | Decompose | High route reviewability | Frontend/admin QA required; less direct source-of-truth cleanup | Defer |
| Hito DS/global CSS second pass | Decompose/delete CSS | High visual/code cleanup | Slice 14A needs separate QA/design stability before deeper split | Defer |
| QA artifact cleanup | Delete local artifacts | High disk impact, no runtime line impact | Could remove useful evidence if done blindly | Backlog/disk hygiene only |
| Manual workout authoring cleanup | Audit | Medium/high future impact | Current manual workout track is in-flight and untracked | Do not touch |
| Plan-creation engine cleanup | Decompose | High | Accepted preview/R8 create-path work is active | Do not touch in this parallel slice |

Selected next cleanup gate:

`BACKEND Slice 12A: plan-authoring doctrine validator ownership extraction`.

Why this is the highest-impact/safest next slice:

- It attacks the current largest script hotspot (`6788` lines) without touching product runtime,
  Supabase, UI, R8 confirm/persist, or the accepted running-plan preview builders.
- It reduces source-of-truth risk: validators should prove contracts, not become an unreadable
  second implementation map.
- It is safer than narrowing [Training API facade](../../../src/lib/training-api.ts) while R8B is
  still active.
- It is more root-cause-aligned than another small CSS deletion pass because the weak seam is
  validation ownership, not one selector group.

Slice 12A approved scope:

- Keep the top-level command stable:
  `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`.
- Extract exactly one assertion island into `scripts/plan-authoring-doctrine/`.
- Recommended first island:
  rich workout draft normalization, rich compatibility mapping, rich persistence/readback,
  import/export roundtrip, saved-mode QA fixture, and active-plan refresh rich draft/apply/timeout
  assertions.
- Keep assertion behavior unchanged.
- Keep any shared helper extraction minimal and ownership-based.
- Record main-file line-count reduction and remaining hotspots after extraction.

Forbidden in Slice 12A:

- Do not remove assertions to make the file smaller.
- Do not touch R8/R8B running-plan confirm/persist source unless a direct conflict is proven.
- Do not edit product runtime, DB/schema, Supabase data, frontend UI, Hito DS, Plan Preset card
  discovery, manual workout authoring, active-plan persistence, or running-plan preview builders.
- Do not delete `structured_authoring_v1` compatibility, blueprint/envelope gates, or current
  first-plan release gates.

Slice 12A implementation result:

- Implemented on 2026-06-12 as a no-behavior-change proof-infrastructure extraction.
- Extracted one coherent assertion island from
  [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) into
  [rich workout import/export doctrine owner](../../../scripts/plan-authoring-doctrine/rich-workout-import-export.ts).
- Extracted ownership covers rich workout persistence readback, persisted-row carry-forward,
  import/export roundtrip, training-plan-v2 template rich-field validation, reference-style import
  identity preservation, saved-mode QA fixture rich-field checks, compact fallback readback, and
  no fake pace/HR fixture assertions.
- Chose this smaller island instead of also moving active-plan refresh rich draft checks in the same
  slice because refresh assertions depend on broader refresh proposal/draft fixtures and should be a
  separate bounded extraction.
- Line-count impact: main validator reduced from `6855` to `6458` lines; new rich import/export
  doctrine owner is `436` lines.
- Validation evidence: targeted ESLint, full plan-authoring doctrine validator, new-file whitespace
  check, and scoped `git diff --check` passed.
- Remaining validator hotspots: active-plan refresh rich draft/apply/timeout fallback checks,
  structured/running-doctrine helper clusters, blueprint/envelope contract blocks, and the broad
  metric/rich workout helper area in the top half of the validator.
- Stable entrypoint preserved:
  `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`.

Slice 12B implementation result:

- Implemented on 2026-06-12 as a second no-behavior-change proof-infrastructure extraction.
- Extracted the active-plan refresh doctrine island from
  [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) into
  [active-plan refresh doctrine owner](../../../scripts/plan-authoring-doctrine/active-plan-refresh.ts).
- Extracted ownership covers refresh rich draft normalization/fallback, apply-source non-generation
  proof, proposal/rich-draft timeout fallback, review metadata checksum proof, stored structured
  authoring truth preference, protected-history mutable guard behavior, mountain refresh doctrine,
  and refresh fixture row/context builders.
- Kept shared non-refresh helpers in the main validator and passed them into the refresh owner as
  dependencies so fixed-rest, metric-target, rich-workout, trail doctrine, and plan-shaping helpers
  remain single-source within the top-level doctrine harness.
- Line-count impact after Slice 12B: main validator reduced from `6458` to `5677` lines; new
  active-plan refresh doctrine owner is `888` lines.
- Validation evidence: targeted ESLint, full plan-authoring doctrine validator, new-file whitespace
  check, and scoped `git diff --check` passed.
- Remaining validator hotspots: structured/running-doctrine helper clusters, blueprint/envelope
  contract blocks, rich workout draft normalizer checks, text/voice compatibility checks, and the
  broad metric/rich workout helper area in the top half of the validator.
- Stable entrypoint preserved:
  `node --import tsx ./scripts/validate-plan-authoring-doctrine.ts`.

## Slice 14A Global CSS Cleanup Result

Implemented on 2026-06-09.

Ownership map:

- Hito DS tokens/primitives:
  [global styles](../../../src/styles.css) lines around `:root`, `@theme`, typography roles,
  fields, buttons, tabs, choice controls, checkbox/radio controls, status pills, status markers,
  feedback markers, product dialogs, toast chrome, date fields, menu/select wrappers, and shared
  calendar-day anatomy.
- Hito DS route/specimen styles:
  workbench shell/sidebar, DS nested navigation, reference rows, specimen shells, playground
  anatomy, data-table specimen controls, modal/window specimen, and calendar/workout playground
  display classes.
- Product calendar/workout styles:
  shared calendar grid/mobile-row classes, calendar type glyphs, feedback markers, state surfaces,
  nav cards, workout-result/readback support surfaces, and active-plan schedule edit narrow-layout
  safety overrides.
- Onboarding/preset styles:
  onboarding surfaces, preset card/grid/stage treatment, selected-plan preview calendar,
  selected-plan segment rows, editable value chip, date/time controls, and first-plan dialog chrome.
- Admin/work-items styles:
  admin shell/profile/menu, backlog divider-list/detail/metadata tags, analytics cards, data-table
  utility row/search/header/menu classes, chart/comparison/scale/severity primitives.
- Legacy/dead/duplicate candidates:
  old product-dialog mode/row/note helpers, unused `hito-ui-sidebar-shell`, unused standalone
  error/success text aliases, and old radio visual-helper aliases.

Deleted with source proof:

- Deleted unused product-dialog helpers:
  `hito-product-dialog-content-fit`, `hito-product-dialog-scroll-fill`,
  `hito-product-dialog-header-row`, `hito-product-dialog-body-content-fit`,
  `hito-product-dialog-footer-row`, and `hito-product-dialog-footer-note`.
  `rg --fixed-strings` found no runtime/source consumers outside
  [global styles](../../../src/styles.css), excluding this result record.
  Live dialog classes such as `hito-product-dialog`, `hito-product-dialog-header`,
  `hito-product-dialog-body-scroll-fill`, and `hito-product-dialog-footer` remain in use.
- Deleted unused `hito-ui-sidebar-shell`; `rg --fixed-strings` found no runtime/source consumers
  outside [global styles](../../../src/styles.css), excluding this result record. Live sidebar specimen classes
  `hito-ui-sidebar-panel` and `hito-ui-sidebar-row` remain in use.
- Deleted unused `hito-error-text` and `hito-success-text`; `rg --fixed-strings` found no
  runtime/source consumers outside [global styles](../../../src/styles.css), excluding this result
  record. Current form feedback uses
  `hito-field-error`, `hito-field-success`, helper copy, and status primitives.
- Deleted unused `hito-radio-checked` and `hito-radio-indicator-dot`; `rg --fixed-strings` found no
  runtime/source consumers outside [global styles](../../../src/styles.css), excluding this result
  record. Native/input radio checked styling and `data-state="checked"` styling remain.

Kept intentionally:

- Kept the remaining no-fixed-reference size-ladder selectors:
  `hito-button-xl`, `hito-field-xs`, `hito-field-xl`, `hito-checkbox-md`, `hito-radio-md`,
  `hito-control-label-md`, `hito-choice-toggle-md`, `hito-choice-toggle-lg`,
  `hito-choice-toggle-xl`, and `hito-textarea-lg`.
- These are Hito DS primitive/size variants or specimen-controlled variants. Several are used
  through dynamic class construction in [Hito DS route](../../../src/routes/hitoDS.tsx) and
  [specimen previews](../../../src/components/hito-ds/specimen-previews.tsx), so they are not
  safe deletion targets in this pass.

Line impact:

- [global styles](../../../src/styles.css) went from `5206` lines to `5132` lines.
- This pass deleted `74` CSS lines without changing TS/TSX, product behavior, backend truth, or
  global visual design.

Validation evidence:

- Source proof used `rg --fixed-strings` for every deleted selector and confirmed zero runtime/source
  consumers outside [global styles](../../../src/styles.css), excluding this result record.
- Post-cleanup dead-selector scan reports only intentionally kept DS size-ladder/specimen variants.
- Targeted `git diff --check` passed for [global styles](../../../src/styles.css), route/component
  files, and this active plan.
- `npm run build` passed.
- Built-in browser smoke passed for `/hitoDS`, `/hitoDS#workout-library-playground`, and
  `/hitoDS#calendar-workout-playground`; direct deep-link load produced no fresh hydration mismatch,
  workout-library still rendered `32` calendar cells and `32` mobile rows, and `375px` viewport had
  no horizontal overflow.

Follow-up cleanup candidates:

- Split [global styles](../../../src/styles.css) by ownership only after another source-proof pass:
  DS primitives, admin/workbench, onboarding/presets, calendar/workout, and DS specimens.
- Audit the remaining DS size-ladder classes with a component-level decision before deleting any
  primitive variants.
- Later cleanup can migrate used-but-route-specific admin/backlog styles toward shared DS/admin
  modules, but that is intentionally out of scope for Slice 14A.

Next recommended role:

QA should run focused source/browser validation for `/hitoDS`, touched DS control/specimen surfaces,
and mobile no-overflow.

## Previous Cleanup Result

Implemented on 2026-06-09.

- [Training API facade](../../../src/lib/training-api.ts) no longer re-exports
  `reviewPlanPresetDraft(...)`, `confirmPlanPresetDraft(...)`, or their action-result types.
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) still expose
  `getPlanPresetCards(...)` for backend-shaped availability cards.
- Stale direct calls to `reviewPlanPresetDraft(...)` or `confirmPlanPresetDraft(...)` now return a
  bounded `preview_only` blocked result and do not rebuild drafts, sign review tokens, validate
  review checksums, call active-plan persistence, or persist a `plan_preset_v1` plan.
- [Running plan engine actions](../../../src/lib/running-plan-engine-actions.ts) still own the
  accepted selected-plan preview path through `previewRunningPlanDraft(...)`.
- Superseded by Slice 10B: low-level Plan Preset recipe/review contract harnesses and old
  algorithmic expansion source were removed after selected-plan preview became the accepted owner.

Validation evidence:

- Source audit shows `reviewPlanPresetDraft(...)` and `confirmPlanPresetDraft(...)` remain only in
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) as bounded `preview_only`
  blocked actions, not in [Training API facade](../../../src/lib/training-api.ts), frontend, scripts,
  or package scripts.
- Source audit shows [Onboarding gate](../../../src/components/OnboardingGate.tsx) still imports
  `getPlanPresetCards(...)` and `previewRunningPlanDraft(...)`.
- Targeted ESLint passed for Training API, Plan Preset actions, running-plan engine actions,
  Onboarding gate, and Plan Preset panel.
- Running-plan engine source, 10K builder, and R6 builder validators passed.
- Plan Preset eligibility fixtures passed.
- Admin capture backlog validation passed.
- Targeted `git diff --check` passed.
- `npm run build` passed.

## Backend Slice 10C Result

Implemented on 2026-06-09.

- Deleted `src/lib/ai-first-plan-draft-authoring.ts`, the remaining historical strict nested
  `ai-first-plan-draft-v1` prompt/schema/OpenAI schema/normalizer module.
- Removed the obsolete strict nested assertion island from
  [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts):
  `buildAiFirstPlanDraftFixture(...)`, strict draft fixture helpers,
  `assertAiFirstPlanDraftContract(...)`, and the top-level assertion call.
- Kept [AI first-plan draft metadata](../../../src/lib/ai-first-plan-draft-metadata.ts) as the
  product-owned metadata/trace seam for blueprint/envelope/service code.
- Kept [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts)
  `strict-draft` selection as a bounded `unsupported_contract` negative proof.
- Preserved blueprint, envelope, structured-authoring/readback, rich workout draft, active refresh,
  import/export, Plan Preset card discovery, running-plan preview, and admin backlog validations.

Source audit evidence:

- `rg -n "ai-first-plan-draft-authoring|ai-first-plan-draft-v1|strict_draft|strict-draft|aiFirstPlanDraftSchema|aiFirstPlanDraftOpenAiSchema" src scripts docs/plans/active docs/tasks package.json`
  found no live `src`/`scripts` import of the deleted strict authoring file. Remaining source hit is
  only the intentional `strict-draft` unsupported guard in
  [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts).
- `rg -n "ai_first_plan_blueprint_v1|ai_first_plan_envelope_v1|structured_authoring_v1|unsupported_contract" src scripts`
  still shows blueprint/envelope release-gate assertions, `structured_authoring_v1` compatibility
  readback, and the `unsupported_contract` guard.
- `rg -n "AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION|buildAiFirstPlanDraftPrompt|normalizeAiFirstPlanDraftToTrainingPlan|AiFirstPlanDraft\\b|assertAiFirstPlanDraftContract|buildAiRunningDraftWorkout|emptyAiDraftTarget|aiFirstPlanDraftSchema|aiFirstPlanDraftOpenAiSchema" src scripts`
  no longer finds strict nested schema/prompt/normalizer symbols outside current service naming.

Validation evidence:

- `npm exec eslint -- src/lib/ai-first-plan-*.ts src/lib/first-plan-actions.ts scripts/validate-plan-authoring-doctrine.ts scripts/plan-authoring-doctrine/first-plan-release-gates.ts scripts/author-ai-first-plan-draft.ts` passed.
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts` passed.
- `npm run author-ai-first-plan-draft -- --mock-openai --contract blueprint --trace-blueprint`
  passed with `sourceKind: ai_first_plan_blueprint_v1`, `persisted: false`, and no deterministic
  fallback success.
- `npm run author-ai-first-plan-draft -- --mock-openai --contract envelope` passed with
  `sourceKind: ai_first_plan_envelope_v1`, `sourceStatus: expanded_from_envelope`, and
  `persisted: false`.
- `npm run author-ai-first-plan-draft -- --contract strict-draft` returned the expected bounded
  failure: `ok: false`, `reason: unsupported_contract`.
- `node --import tsx ./scripts/validate-plan-preset-eligibility.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts` passed.
- `npm run validate-admin-capture-backlog` passed.
- `npm run build` passed.

Cleanup impact:

- Removed the tracked `1602`-line strict nested authoring module from `src`.
- Reduced [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
  from about `7263` lines to `6788` lines by deleting obsolete strict nested assertions rather than
  moving them.

## Frontend Hito DS Route Decomposition Result

Implemented on 2026-06-09.

- Kept [Hito DS route](../../../src/routes/hitoDS.tsx) as the route shell, nav/hash orchestration,
  section registry, and inline section composition owner.
- Added [Hito DS reference anatomy](../../../src/components/hito-ds/reference.tsx) for shared DS
  documentation rows, section intros, specimen shells, and product links.
- Added [Hito DS specimen previews](../../../src/components/hito-ds/specimen-previews.tsx) for the
  data-table preview, modal-window preview, choice selector, selection-control preview, toggle row,
  demo input, demo button, and menu row helpers.
- Preserved `/hitoDS`, `/hitoDS#calendar-workout-playground`, and
  `/hitoDS#workout-library-playground` behavior, including the SSR-safe initial section state and
  the current workout-library provider-control no-overflow fix.
- Did not touch product calendar, onboarding, workout routes, Supabase, backend, provider sync,
  persistence, admin routes, or global style cleanup.

Line impact:

- [Hito DS route](../../../src/routes/hitoDS.tsx) went from `4770` lines to `4072` lines.
- The extracted responsibilities now live in focused Hito DS modules:
  [reference anatomy](../../../src/components/hito-ds/reference.tsx) at `132` lines and
  [specimen previews](../../../src/components/hito-ds/specimen-previews.tsx) at `627` lines.

QA closeout:

Passed on 2026-06-09.

- Built-in Codex Browser was used first.
- Dev server `127.0.0.1:8082` had an in-app Browser runtime issue around
  `@id/virtual:tanstack-start-client-entry`, while `curl` returned `200 OK`.
- Final browser proof passed against a safe local production server on `127.0.0.1:8099`.
- `/hitoDS`, `/hitoDS#calendar-workout-playground`, and `/hitoDS#workout-library-playground`
  loaded successfully.
- Fresh console checks on `8099` showed `0` errors and `0` warnings.
- Deep links resolved to target sections.
- Patterns nav expanded and active child state moved correctly.
- Workout-library showed `32` identities, `32` mobile rows, `32` mobile date entries, and `7`
  grid headings.
- Provider/mobile overflow path passed with no horizontal overflow.
- Source boundary proof passed: no Supabase/server actions, product Calendar imports, workout route
  imports, provider sync, AI, persistence, mutation behavior, or new route-local styling system.
- Targeted ESLint passed for [Hito DS route](../../../src/routes/hitoDS.tsx),
  [Hito DS components](../../../src/components/hito-ds/), and
  [shared calendar day UI](../../../src/components/ui/hito-calendar-day.tsx).
- `npm run build` passed.
- `git diff --check -- src/routes/hitoDS.tsx src/components/hito-ds src/styles.css docs/plans/active/2026-06-07-hito-stack-simplification-strike.md`
  passed.

Acceptance decision:

Slice 13 is implemented and QA-passed. The Hito DS route decomposition is accepted as a
behavior-preserving responsibility split. It should not be reopened unless a concrete regression is
found.

Next cleanup slice:

`FRONTEND Slice 14A: global CSS semantic cleanup preflight and first safe deletion pass`.

Why this is next:

- [Global styles](../../../src/styles.css) is now the largest source hotspot at about `5206` lines.
- The Hito DS route/specimen split is QA-stable, so CSS ownership can be audited against a stable DS
  proof surface.
- This is higher-impact than admin route cleanup if the first pass deletes dead global rules and
  records ownership boundaries.
- This is safer than voice/text/custom authoring consolidation because the running-plan custom path
  is still being rebuilt.
- The slice is intentionally bounded: ownership map plus confirmed-unused CSS deletion only, not
  light/dark mode, visual redesign, or a new token system.

## Major Cleanup Gate Selection

Decision date: 2026-06-09.

Current audit evidence:

- `git status --short --branch` shows the branch is clean relative to `origin/main` only for git
  history, but the worktree still has unrelated dirty/in-flight files:
  [simplification strike plan](2026-06-07-hito-stack-simplification-strike.md),
  [DS workout-library plan](2026-06-09-hito-ds-workout-library-calendar-detail-playground.md),
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts),
  [Training API facade](../../../src/lib/training-api.ts), [Hito DS route](../../../src/routes/hitoDS.tsx),
  and untracked DS workout-library playground files under
  [Hito DS components](../../../src/components/hito-ds/). Treat those as external in-flight work
  and do not overwrite them in this cleanup slice.
- `find src -type f | wc -l` reports `230` source files.
- TS/TSX/CSS line scan reports about `92408` total lines under `src`.
- Script line scan reports about `23340` total lines under `scripts`.
- Largest current source hotspots include [styles](../../../src/styles.css) at about `5206` lines,
  [Hito DS route](../../../src/routes/hitoDS.tsx) at about `4773` lines,
  [admin analytics route](../../../src/routes/admin.analytics.tsx) at about `2393` lines,
  [admin capture route](../../../src/routes/admin.capture.tsx) at about `2125` lines,
  [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts) at
  about `1795` lines, [voice-to-plan authoring](../../../src/lib/voice-to-plan-authoring.ts) at
  about `1685` lines, [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts)
  at about `1602` lines, and [first plan actions](../../../src/lib/first-plan-actions.ts) at
  about `1551` lines.
- Largest script hotspots include
  [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) at
  about `7263` lines, [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts)
  at about `2114` lines, and
  [repo work item importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts) at about
  `1815` lines.
- Source reference proof shows [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts)
  is still imported by product runtime modules mostly for shared metadata/trace types:
  [AI draft service](../../../src/lib/ai-first-plan-draft-service.ts),
  [AI blueprint schema](../../../src/lib/ai-first-plan-blueprint-schema.ts),
  [AI blueprint trace](../../../src/lib/ai-first-plan-blueprint-trace.ts),
  [AI blueprint horizon](../../../src/lib/ai-first-plan-blueprint-horizon.ts), and
  [AI blueprint validation](../../../src/lib/ai-first-plan-blueprint-validation.ts).
- The historical strict nested prompt/schema/normalizer also remains imported by
  [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts), which
  means it still has QA value but should not remain a product-runtime owner.
- `package.json` still exposes broad ops tooling, but there is no package-level `strict_draft`
  entrypoint; [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts) keeps
  `strict-draft` bounded as an unsupported contract.

Candidate ranking:

| Candidate | Impact | Risk | Decision |
| --- | --- | --- | --- |
| Demote strict nested `ai-first-plan-draft-v1` runtime coupling | High: removes a historical 1600-line authoring module from product-runtime ownership while preserving metadata and doctrine value | Moderate: shared metadata types must be extracted before prompt/schema isolation | Selected immediate gate |
| Delete old Plan Preset algorithmic builder or fixtures | High line-count impact | High: Plan Preset/running-plan transition remains in flight and old harnesses still protect behavior | Defer |
| Decompose doctrine validator | High reviewability impact | Low behavior risk, but mostly shifts harness ownership rather than deleting runtime complexity | Later slice after first runtime demotion |
| Split `/hitoDS` route and global CSS | High file-size impact | Medium/high because DS workout-library playground is currently dirty/in flight | Defer until DS track stabilizes |
| Narrow all `training-api.ts` facade exports | Medium | Medium because it can break server action import contracts broadly | Do only one export group per later slice |
| Delete `structured_authoring_v1` compatibility | Potentially high | Too risky: still deterministic generator/readback compatibility and not the same as strict nested AI draft | Forbidden |

Selected gate:

`BACKEND Slice 10A: strict nested AI first-plan draft runtime demotion`.

Approved scope:

- Extract `AiFirstPlanDraftMetadata`, `AiFirstPlanBlueprintTraceMetadata`, and any shared trace/result
  metadata needed by product runtime into a small product-owned metadata module.
- Update blueprint/service/action/ops-script type imports to use that metadata module instead of
  importing [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts).
- Move or isolate the strict nested `ai-first-plan-draft-v1` prompt/schema/normalizer into
  doctrine-only ownership so [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
  can keep historical coverage without making the strict nested authoring module product runtime.
- Preserve `ai_first_plan_blueprint_v1` as the advanced/custom production default.
- Preserve `ai_first_plan_envelope_v1` as internal/non-default.
- Preserve bounded `strict-draft` CLI behavior as `unsupported_contract`.
- Preserve `structured_authoring_v1` readback/deterministic compatibility while keeping it blocked
  as a successful first-plan fallback.

Forbidden in Slice 10A:

- No Plan Preset runtime/builder/frontend/confirm/persistence changes.
- No running-plan engine preview builder changes.
- No DS workout-library playground changes.
- No Supabase mutation, DB/schema migration, or persistence changes.
- No OpenAI prompt rewrite except moving historical strict nested prompt/schema ownership if required
  for demotion.
- No deletion of doctrine coverage before replacement coverage is proven.

## Backend Slice 10A Result

Implemented on 2026-06-09.

- Added [AI first-plan draft metadata](../../../src/lib/ai-first-plan-draft-metadata.ts) as the
  small product-owned home for `AiFirstPlanDraftMetadata`,
  `AiFirstPlanBlueprintTraceMetadata`, normalization issue shape, and
  `AiFirstPlanDraftNormalizationResult`.
- Updated blueprint/service/runtime imports to consume the metadata module instead of importing
  [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts).
- Updated [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts) to import trace
  metadata from the new metadata module.
- Left strict nested `ai-first-plan-draft-v1` prompt/schema/OpenAI schema/normalizer in
  [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts) with an
  ownership comment marking it historical/doctrine-only for product runtime.
- Preserved [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
  strict nested coverage, and fixed two drift-prone request-level target dates so the fixture does
  not expire against real `today`.

Validation evidence:

- Source audit shows product runtime no longer imports `ai-first-plan-draft-authoring.ts`; remaining
  strict authoring references are the doctrine validator, strict schema/prompt constants inside the
  strict file itself, and bounded `strict-draft` argument handling in the ops script.
- Source audit shows shared metadata now resolves through
  [AI first-plan draft metadata](../../../src/lib/ai-first-plan-draft-metadata.ts).
- Targeted ESLint passed.
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts` passed.
- Blueprint mock with trace passed and remained `ai_first_plan_blueprint_v1`.
- Envelope mock passed and remained `ai_first_plan_envelope_v1`.
- `--contract strict-draft` remained bounded with `unsupported_contract` and did not produce a
  runtime draft.
- Plan Preset eligibility fixtures passed.
- Admin capture backlog validation passed.
- `git diff --check` passed.
- `npm run build` failed once on the known intermittent Nitro SSR generated hashed chunk issue, then
  passed on immediate rerun without source changes. Treat this as a build-lifecycle follow-up if QA
  requires cold-build determinism beyond this source slice.

## Backend Slice 10B Result

Implemented and QA-passed on 2026-06-09.

- Deleted the old product-failed Plan Preset algorithmic review expansion owners:
  - `src/lib/plan-presets/algorithmic-builder.ts`
  - `src/lib/plan-presets/expand.ts`
  - `src/lib/plan-presets/composition.ts`
  - `src/lib/plan-presets/persistence-metadata.ts`
  - `src/lib/plan-presets/review-token.ts`
  - `src/lib/plan-presets/recipe-expanders/shared.ts`
- Deleted old builder-only Plan Preset CSV/source files from runtime source:
  - `preset-workout-identity-library.csv`
  - `preset-phase-template-table.csv`
  - `preset-weekly-archetype-table.csv`
  - `preset-identity-placement-rules.csv`
  - `preset-segment-anatomy-table.csv`
  - `preset-progression-math-rules.csv`
  - `preset-quality-gates.csv`
  - `preset-builder-io-contract.csv`
  - `preset-program-source-of-truth.md`
- Deleted old per-recipe review/confirm harness files under `scripts/plan-presets/`.
- Kept the current Plan Preset card-discovery seam:
  - [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) still expose
    `getPlanPresetCards(...)`.
  - [Plan Preset resolver](../../../src/lib/plan-presets/resolver.ts), progressive card modules,
    recipes, schema, and card-summary modules remain.
  - [Plan Preset program data](../../../src/lib/plan-presets/program-data.ts) now owns only active
    card-discovery data: scenario matrix, load adjustments, and goal contract matrix.
- Kept the accepted selected-plan preview seam:
  - [Running plan engine actions](../../../src/lib/running-plan-engine-actions.ts) still expose
    `previewRunningPlanDraft(...)`.
  - [Plan creation engine](../../../src/lib/plan-creation-engine/) remains the accepted
    10K/Half/Marathon Base preview builder owner.
- Rewrote [Plan Preset eligibility validator](../../../scripts/validate-plan-preset-eligibility.ts)
  into a card-discovery/source-model harness instead of an old review/confirm draft harness.
- Updated [build finalizer](../../../scripts/finalize-build-output.mjs) to package only the three
  active Plan Preset card-discovery CSVs.

Source audit evidence:

- `rg` found no `src` or `scripts` imports of `buildPlanPresetReviewDraftContract`,
  `buildPlanPresetAlgorithmicDraft`, `PlanPresetReviewDraftContract`, review-token helpers,
  persistence metadata helpers, old composition helpers, or old algorithmic quality gates.
- Remaining old-builder strings are limited to historical plan text and explicit absence assertions
  in the rewritten Plan Preset validator.
- `reviewPlanPresetDraft(...)` and `confirmPlanPresetDraft(...)` remain only as bounded
  `preview_only` blocked actions in [Plan Preset actions](../../../src/lib/plan-preset-actions.ts);
  they are not exported by [Training API facade](../../../src/lib/training-api.ts).

Validation evidence:

- Targeted ESLint passed for Plan Preset modules, Plan Preset actions, Training API facade,
  running-plan engine actions, onboarding preset UI surfaces, the rewritten Plan Preset validator,
  and the build finalizer.
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts` passed.
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts` passed.
- `node --import tsx ./scripts/validate-plan-preset-eligibility.ts` passed.
- `npm run validate-admin-capture-backlog` passed.
- `git diff --check` passed after plan closeout update.
- `npm run build` passed.

Ownership reduction:

- Removed 20 tracked legacy Plan Preset builder/review files.
- Removed the old 1795-line algorithmic builder, old 152-line expansion facade, old review token
  and persistence helpers, old composition/shared helpers, old per-recipe harnesses, and builder-only
  CSV source files.
- Current active Plan Preset runtime source under `src/lib/plan-presets/*.ts` is about 1971 lines,
  focused on card discovery, progressive card policy, recipes, and active program data.
- The validator is now a current-flow card/source harness instead of an old review/confirm
  acceptance harness.

QA closeout evidence:

- Old product-failed Plan Preset algorithmic builder/review harness files are deleted.
- No runtime import remains for old review draft builder, algorithmic draft builder, review-token
  helpers, persistence metadata helpers, composition helpers, or algorithmic quality gates.
- `getPlanPresetCards(...)` remains preserved for card discovery.
- `reviewPlanPresetDraft(...)` and `confirmPlanPresetDraft(...)` remain only as bounded
  `preview_only` blocked actions.
- [Training API facade](../../../src/lib/training-api.ts) exports `getPlanPresetCards(...)` and
  `previewRunningPlanDraft(...)`, not legacy review/confirm.
- Running-plan preview builders remain validated.
- Cleanup impact from Slice 10B was about `5955` deletions / `1003` insertions, around `5k` net
  line reduction.

## Next Cleanup Gate After Slice 10B QA

Decision date: 2026-06-09.

Current cleanup state:

- Slice 10A removed strict nested AI draft authoring from product runtime imports by extracting
  shared metadata into [AI first-plan draft metadata](../../../src/lib/ai-first-plan-draft-metadata.ts).
- Slice 10B removed the old product-failed Plan Preset algorithmic review expansion and harness
  ownership.
- Current active Plan Preset source is now about `2104` lines and focused on card discovery,
  progressive card policy, recipes, schema, and active card data.
- Current script total is about `21816` lines after old Plan Preset harness deletion.
- [Plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) remains
  about `7263` lines and still imports the strict nested doctrine-only module.
- [Strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts) is now about
  `1499` lines and contains only the historical `ai-first-plan-draft-v1` prompt/schema/OpenAI
  schema/normalizer for doctrine coverage.

Candidate re-evaluation:

| Candidate | Cleanup value | Risk | Decision |
| --- | --- | --- | --- |
| Delete doctrine-only strict nested `ai-first-plan-draft-v1` module and obsolete doctrine assertions | High: removes the last unsupported strict draft authoring module and reduces validator scope | Moderate: must preserve blueprint/envelope and `strict-draft` unsupported proof | Selected next gate |
| Narrow [Training API facade](../../../src/lib/training-api.ts) | Medium: reduces hidden export surface | Lower line-count impact and less urgent after Plan Preset review/confirm exports are already gone | Defer one slice |
| Decompose [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) generally | High reviewability, low deletion | Moves code more than it removes; better after obsolete strict draft assertions are deleted | Defer until after 10C |
| Split [Onboarding gate](../../../src/components/OnboardingGate.tsx) | Medium reviewability | Frontend flow still tied to running-plan preview and DS tracks; not source-of-truth deletion | Defer |
| Split [Hito DS route](../../../src/routes/hitoDS.tsx) or [styles](../../../src/styles.css) | High line-count potential | DS workout-library QA-fix track is separate and in flight | Defer |
| Voice/text/custom overlap audit | Potentially high | Replacement advanced/custom engine not accepted yet | Defer |
| Admin route/tooling cleanup | Medium | Less direct duplication after recent Admin simplification | Defer |

Selected gate:

`BACKEND Slice 10C: strict nested AI draft doctrine-only deletion`.

Approved scope:

- Delete [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts) if
  source scans confirm only doctrine-only consumers remain.
- Remove the obsolete strict nested `ai-first-plan-draft-v1` assertion block from
  [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts), including
  prompt/schema/normalizer fixture assertions around:
  `AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION`, `buildAiFirstPlanDraftPrompt`,
  `normalizeAiFirstPlanDraftToTrainingPlan`, and `AiFirstPlanDraft`.
- Keep [AI first-plan draft metadata](../../../src/lib/ai-first-plan-draft-metadata.ts) because
  blueprint/envelope/service traces still need shared metadata.
- Keep `strict-draft` command-line selection in
  [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts) as a bounded
  `unsupported_contract` negative proof, without importing the deleted strict module.
- Preserve active doctrine gates for blueprint, envelope, first-plan review/confirm, rich workout
  draft, structured authoring, active-plan refresh, import/export, and no
  `structured_authoring_v1` first-plan fallback success.

Expected impact:

- Remove the last unsupported `ai-first-plan-draft-v1` authoring module from `src`.
- Reduce [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
  by deleting obsolete strict nested assertions instead of merely moving them.
- Make `author-ai-first-plan-draft` and the doctrine validator prove only supported/current
  first-plan contracts plus negative unsupported strict-draft behavior.

Forbidden in Slice 10C:

- Do not delete [AI first-plan draft metadata](../../../src/lib/ai-first-plan-draft-metadata.ts).
- Do not weaken `ai_first_plan_blueprint_v1` default behavior.
- Do not promote `ai_first_plan_envelope_v1`.
- Do not delete `structured_authoring_v1` deterministic/readback compatibility.
- Do not touch Plan Preset card discovery, running-plan preview builders, DS workout-library,
  Supabase/DB/schema, provider sync, frontend UI, or persistence.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Delete doctrine-only strict nested ai-first-plan-draft-v1 module and obsolete assertions.

Stage:
BACKEND implementation / strict nested doctrine-only deletion.

PLAN:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/plans/active/2026-06-07-hito-stack-simplification-strike.md

Context:
- Slice 10A demoted strict nested `ai-first-plan-draft-v1` out of product runtime ownership by
  moving shared metadata/trace types to `src/lib/ai-first-plan-draft-metadata.ts`.
- Slice 10B deleted the old product-failed Plan Preset algorithmic builder/review harness path and
  passed QA.
- The remaining strict nested draft module is now doctrine-only:
  `src/lib/ai-first-plan-draft-authoring.ts`.
- `scripts/validate-plan-authoring-doctrine.ts` is the remaining real consumer of that strict
  prompt/schema/normalizer coverage.
- `strict-draft` CLI selection should remain as a bounded unsupported contract, but the unsupported
  path no longer needs a full strict draft prompt/schema/normalizer module.

Implement:
- Source-audit all remaining `ai-first-plan-draft-authoring`, `ai-first-plan-draft-v1`,
  `AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION`, `buildAiFirstPlanDraftPrompt`,
  `normalizeAiFirstPlanDraftToTrainingPlan`, and `AiFirstPlanDraft` references.
- Delete `src/lib/ai-first-plan-draft-authoring.ts` if the audit confirms it is doctrine-only.
- Remove the obsolete strict nested draft assertion block from
  `scripts/validate-plan-authoring-doctrine.ts` instead of moving it to another fixture.
- Keep `src/lib/ai-first-plan-draft-metadata.ts` and all blueprint/envelope/service metadata imports.
- Keep `npm run author-ai-first-plan-draft -- --contract strict-draft` bounded as
  `unsupported_contract`.
- Preserve blueprint, envelope, structured authoring, rich draft, active refresh, import/export, and
  Plan Preset/running-plan preview validations.

Do not touch:
- Plan Preset card discovery or `plan_preset_v1` active card metadata.
- Running-plan preview builders.
- `structured_authoring_v1` deterministic/readback compatibility.
- Supabase, DB/schema, migrations, provider sync, frontend UI, Hito DS workout-library, or
  persistence.

Run:
- `rg -n "ai-first-plan-draft-authoring|ai-first-plan-draft-v1|AI_FIRST_PLAN_DRAFT_SCHEMA_VERSION|buildAiFirstPlanDraftPrompt|normalizeAiFirstPlanDraftToTrainingPlan|AiFirstPlanDraft|strict_draft|strict-draft" src scripts package.json`
- `rg -n "AiFirstPlanDraftMetadata|AiFirstPlanBlueprintTraceMetadata|ai-first-plan-draft-metadata" src scripts`
- `npm exec eslint -- src/lib/ai-first-plan-*.ts src/lib/first-plan-actions.ts scripts/validate-plan-authoring-doctrine.ts scripts/plan-authoring-doctrine/first-plan-release-gates.ts scripts/author-ai-first-plan-draft.ts`
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`
- `npm run author-ai-first-plan-draft -- --mock-openai --contract blueprint --trace-blueprint`
- `npm run author-ai-first-plan-draft -- --mock-openai --contract envelope`
- `npm run author-ai-first-plan-draft -- --contract strict-draft`
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`
- `node --import tsx ./scripts/validate-plan-preset-eligibility.ts`
- `npm run validate-admin-capture-backlog`
- `git diff --check`
- `npm run build`

Report:
1. Task
2. Stage
3. Files changed
4. Strict nested deletion summary
5. Source audit proof
6. Preserved metadata proof
7. Preserved blueprint/envelope proof
8. Preserved structured-authoring/readback proof
9. Unsupported strict-draft proof
10. Validation results
11. Blockers
```

## Owner

ARCHITECT / BACKEND / FRONTEND / QA

## Last Updated

2026-06-09

## Reference Links

- [Project operating rules](../../../AGENTS.md)
- [Project context](../../context.md)
- [Glossary](../../glossary.md)
- [Current system](../../current-system.md)
- [Current product](../../current-product.md)
- [Current state](../../current-state.md)
- [Optimization strike plan](2026-05-29-hito-optimization-strike-plan.md)
- [Archived Plan Preset plan](../archive/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)
- [Training API facade](../../../src/lib/training-api.ts)
- [Active plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [First plan actions](../../../src/lib/first-plan-actions.ts)
- [Plan replacement actions](../../../src/lib/plan-replacement-actions.ts)

## Cleanup Master Plan

Date: 2026-06-09.

Purpose:

Turn the simplification strike from a sequence of local cleanup tasks into one aggressive,
evidence-based deletion and reuse strategy.

This is not a promise to cut the repo by `50%`. The current evidence does not justify that claim.
Treat `50%` as the user aspiration, then reduce toward it by deleting/demoting wrong ownership
first and decomposing only where reviewability is the actual bottleneck.

Current measured baseline:

| Area | Current count | Notes |
| --- | ---: | --- |
| `src` TS/TSX/CSS files | `217` files | Counts tracked source files matching `*.ts`, `*.tsx`, `*.css`; generated route tree included because it is checked in. |
| `src` TS/TSX/CSS lines | about `92,418` lines | Does not include docs, node_modules, QA artifacts, or lockfile. |
| `scripts` TS/TSX/MJS/JS lines | about `23,340` lines | Includes validators, ops scripts, importer tooling, and harnesses. |
| `supabase/migrations` SQL lines | about `1,199` lines | Schema history; not a cleanup target without migration policy. |
| Service code estimate | about `116,957` lines | `src + scripts + supabase/migrations`; package lock, docs, node_modules, and QA artifacts excluded. |

Top hotspots by responsibility:

| Hotspot | Approx lines | Responsibility | Cleanup classification |
| --- | ---: | --- | --- |
| [Plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) | `7263` | multi-domain QA harness | decompose later; do not delete safety net |
| [Global styles](../../../src/styles.css) | `5206` | DS tokens, route styles, legacy utilities, product chrome | audit/delete unused classes after DS playground stabilizes |
| [Hito DS route](../../../src/routes/hitoDS.tsx) | `4773` | design-system route plus many specimen sections | split/specimen ownership after DS workout-library QA |
| [Admin analytics route](../../../src/routes/admin.analytics.tsx) | `2393` | admin workspace UI | decompose only after source-owner map; not first deletion target |
| [Admin capture route](../../../src/routes/admin.capture.tsx) | `2125` | admin work-item UI | keep; route is current product/admin surface |
| [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts) | `1795` | old product-failed Plan Preset expansion | selected post-10A deletion/demotion candidate |
| [Voice-to-plan authoring](../../../src/lib/voice-to-plan-authoring.ts) | `1685` | Pro voice/text-ish plan authoring seam | audit after new engine custom path is stable |
| [Active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts) | `1591` | future schedule edit preview | keep until schedule-edit roadmap is audited |
| [First plan actions](../../../src/lib/first-plan-actions.ts) | `1551` | structured/voice/AI first-plan action layer | decompose only after new engine ownership settles |
| [Strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts) | `1499` | historical strict nested prompt/schema/normalizer | Slice 10A demotes runtime ownership; QA pending |

### Source-Of-Truth Map

| Domain | Current product truth owner | Notes |
| --- | --- | --- |
| First-plan creation / advanced custom | [First plan actions](../../../src/lib/first-plan-actions.ts), [AI draft service](../../../src/lib/ai-first-plan-draft-service.ts), and blueprint modules | `ai_first_plan_blueprint_v1` remains production custom/advanced default; no strict nested runtime ownership after Slice 10A. |
| Selected-plan previews | [Running plan engine actions](../../../src/lib/running-plan-engine-actions.ts) plus [plan creation engine](../../../src/lib/plan-creation-engine/) | Preview-only, no persistence/create contract yet. |
| Running-plan engine previews | [plan creation engine](../../../src/lib/plan-creation-engine/) | Accepted preview owners for 10K, Half, and Marathon Base; do not delete. |
| Plan Preset cards | [Plan Preset actions](../../../src/lib/plan-preset-actions.ts), [Plan Preset resolver](../../../src/lib/plan-presets/resolver.ts), progressive card modules | Still used for backend-shaped card availability; old review/confirm mutation seam is demoted. |
| Old Plan Preset expansion/review | [Plan Preset expand](../../../src/lib/plan-presets/expand.ts), [algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts), Plan Preset CSV artifacts, Plan Preset harnesses | Product-failed old expansion path; next deletion/demotion target after Slice 10A QA. |
| Structured authoring | [structured plan authoring](../../../src/lib/structured-plan-authoring.ts) and split policy/workout/metric modules | Deterministic generator and compatibility/readback owner; must not become first-plan fallback success. |
| Voice/text authoring | [voice-to-plan authoring](../../../src/lib/voice-to-plan-authoring.ts), [OpenAI text authoring](../../../src/lib/openai-plan-authoring.ts), [rich workout draft authoring](../../../src/lib/rich-workout-draft-authoring.ts) | Keep until rebuilt engine advanced/custom path defines replacement or consolidation. |
| Active-plan refresh/apply | [active-plan refresh actions](../../../src/lib/active-plan-refresh-actions.ts), [refresh draft](../../../src/lib/active-plan-refresh-draft.ts), [active plan persistence](../../../src/lib/active-plan-persistence.ts) | Explicit reviewed mutation path; not deletion target. |
| Workout result import/comparison | [workout-result import modules](../../../src/lib/workout-result-import/) and workout detail UI | Current Garmin feedback truth; do not touch in plan-creation cleanup. |
| Provider evidence/feedback | [workout log actions](../../../src/lib/workout-log-actions.ts), [Completion panel](../../../src/components/CompletionPanel.tsx), comparison/AI insight modules | Current saved-mode behavior; keep separate from DS fake playground. |
| Admin backlog/capture | [admin capture server](../../../src/lib/admin-capture.server.ts), [admin work items](../../../src/lib/admin-work-items.ts), [repo importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts), [admin capture route](../../../src/routes/admin.capture.tsx) | Current admin work-item surface; cleanup only through admin-specific slices. |
| Hito DS playground/specimens | [Hito DS route](../../../src/routes/hitoDS.tsx), [Hito DS playground components](../../../src/components/hito-ds/) | Internal specimen truth only; fake data must not leak into product routes. |

### Duplicate And Stale Path Map

| Stale / duplicate path | Current owner | Old owner / duplicate owner | Runtime status | Mutation risk | Decision |
| --- | --- | --- | --- | --- | --- |
| Strict nested `ai-first-plan-draft-v1` | doctrine-only after Slice 10A | former full AI first-plan draft authoring module | product runtime demotion implemented, QA pending | low after metadata extraction | keep doctrine coverage; no runtime ownership |
| Old Plan Preset review/confirm | [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) | old `plan_preset_v1` review/confirm before rebuilt selected-plan engine | returns bounded `preview_only` after prior cleanup | formerly high; now bounded | delete/demote old expansion dependencies next |
| Old Plan Preset algorithmic expansion | [algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts), [expand facade](../../../src/lib/plan-presets/expand.ts), CSV artifacts | product-failed preset expansion path | used by Plan Preset harnesses and old review contract; not accepted product truth | indirect if stale callers return | selected post-10A candidate |
| `training-api.ts` broad facade | [Training API facade](../../../src/lib/training-api.ts) | multiple extracted action owners | current compatibility import map | medium if stale exports expose old seams | narrow one group per slice later |
| `structured_authoring_v1` deterministic generator | [structured authoring](../../../src/lib/structured-plan-authoring.ts) | old first-plan fallback semantics | current deterministic generator/readback compatibility | high if reintroduced as first-plan success fallback | keep; forbid deletion until replacement/readback audit |
| Voice/text/custom AI seams | voice/text/rich-draft modules | overlap with advanced custom first-plan direction | current non-default product paths | medium | audit after rebuilt engine defines advanced custom replacement |
| `/hitoDS` route-local specimens | [Hito DS route](../../../src/routes/hitoDS.tsx) plus specimen components | route-local demo data and many section owners | internal only | low product mutation risk, high bloat risk | split/delete after DS workout-library QA |
| Admin work-item importer and route UI | importer/admin routes | earlier backlog/capture split | current admin tool truth | low product mutation risk, medium admin drift risk | keep; cleanup only with admin QA |
| Active/archive duplicate docs | docs/plans active/archive | stale active copies | docs/importer visibility only | no runtime mutation | cleanup as docs/admin hygiene, not code-size priority |

### Cleanup Roadmap

Tier 1: delete/demote now or immediately after QA.

- Finish QA for Slice 10A strict nested draft demotion.
- After Slice 10A QA, run `BACKEND Slice 10B: old Plan Preset algorithmic builder and review harness demotion`.
- Narrow stale Plan Preset exports and scripts only after source scans prove the rebuilt selected-plan preview does not use them.
- Keep `getPlanPresetCards(...)` and `previewRunningPlanDraft(...)`; delete/demote only old review/confirm expansion ownership.

Tier 2: consolidate after proof.

- Narrow [Training API facade](../../../src/lib/training-api.ts) one import group at a time.
- Decompose [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
  into assertion owners after strict/Plan Preset stale paths are settled.
- Split [Hito DS route](../../../src/routes/hitoDS.tsx) and move specimen data/components behind
  route-neutral Hito DS modules after DS workout-library QA.
- Classify [global styles](../../../src/styles.css) into semantic tokens, shared primitives, route
  styles, admin styles, and dead rules before deletion.
- Audit voice/text/custom authoring once the rebuilt running-plan engine has accepted custom/advanced
  ownership.

Tier 3: defer or keep.

- Keep [plan creation engine](../../../src/lib/plan-creation-engine/) because it is the accepted
  preview owner.
- Keep [active plan persistence](../../../src/lib/active-plan-persistence.ts) as canonical mutation
  owner.
- Keep workout result import/comparison/provider evidence until a provider cleanup plan exists.
- Keep Supabase migrations as history; do not delete schema files to chase line count.
- Keep current admin work-items/capture until a dedicated admin route decomposition slice is chosen.

### Big Cleanup Slices

| Slice | Owner | Target files | Deletion / demotion target | Expected impact | Replacement coverage | Validation | Risks / do not touch |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Slice 10A: strict nested runtime demotion | BACKEND -> QA | [AI first-plan draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts), [metadata](../../../src/lib/ai-first-plan-draft-metadata.ts), blueprint/service imports, doctrine validator | remove strict nested module from product runtime ownership | removes stale runtime dependency on historical strict draft module; does not delete doctrine value | blueprint/envelope mocks, strict-draft unsupported proof, doctrine validator | already scoped in current QA prompt | do not weaken blueprint/envelope or `structured_authoring_v1` readback |
| Slice 10B: old Plan Preset expansion deletion/demotion | BACKEND | [algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts), [expand facade](../../../src/lib/plan-presets/expand.ts), [program data](../../../src/lib/plan-presets/program-data.ts), Plan Preset CSV artifacts, Plan Preset harness scripts | delete or move old product-failed `plan_preset_v1` review expansion out of runtime after proof | potential `2k-4k+` runtime/code ownership reduction, plus fewer false product seams | running-plan preview builders, `getPlanPresetCards(...)`, bounded `preview_only` old actions | `rg buildPlanPresetReviewDraftContract/buildPlanPresetAlgorithmicDraft`, running engine validators, Plan Preset card smoke, build | do not delete card resolver/progressive cards if onboarding still uses them |
| Slice 11: `training-api.ts` facade narrowing | BACKEND | [Training API facade](../../../src/lib/training-api.ts) and direct import call sites | remove one obsolete export group per slice | lower hidden API surface; modest line reduction | direct action-owner imports and serverFn wrappers | import map, targeted ESLint, build | do not break TanStack serverFn route contracts |
| Slice 12: doctrine validator decomposition | BACKEND / QA tooling | [doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts), [doctrine folder](../../../scripts/plan-authoring-doctrine/) | split assertion ownership without weakening checks | reviewability gain, not net deletion | stable top-level validator entrypoint | doctrine validator, targeted ESLint | do not delete assertions to make file smaller |
| Slice 13: Hito DS route/specimen split | FRONTEND | [Hito DS route](../../../src/routes/hitoDS.tsx), [Hito DS components](../../../src/components/hito-ds/) | move specimen data/components out of route; delete dead route-local specimens | route file responsibility reduction and safer DS reuse | existing Hito DS playground anatomy, DS workout-library QA | targeted ESLint, build, browser `/hitoDS`, 375px | do not mix with product calendar or provider sync |
| Slice 14: global CSS semantic cleanup | FRONTEND / DESIGNER | [styles](../../../src/styles.css), selected route/component class usages | delete dead classes and route-local one-offs after source/visual proof | potential large CSS complexity reduction, exact lines unknown | Hito DS tokens/classes and current route screenshots | class usage map, targeted browser QA, build | do not invent light mode or new visual system in cleanup slice |
| Slice 15: admin route/tooling responsibility cleanup | FRONTEND / BACKEND | [admin analytics](../../../src/routes/admin.analytics.tsx), [admin capture](../../../src/routes/admin.capture.tsx), importer | split admin UI/tooling ownership where it reduces duplication | reviewability and admin consistency | Admin Work Items/source-group model | admin browser QA, importer dry-run, validator | do not run live import or `--archive-stale` without approval |
| Slice 16: voice/text/custom authoring consolidation audit | ARCHITECT -> BACKEND | [voice authoring](../../../src/lib/voice-to-plan-authoring.ts), [OpenAI text authoring](../../../src/lib/openai-plan-authoring.ts), [rich draft authoring](../../../src/lib/rich-workout-draft-authoring.ts) | decide whether advanced custom path can reuse one backend contract | potentially high, but blocked until new engine custom path is accepted | running-plan engine custom/advanced architecture | source audit only first | do not delete live Pro/advanced paths without replacement |

### Immediate Post-10A Slice

Selected next implementation slice after Slice 10A QA passes:

`BACKEND Slice 10B: old Plan Preset algorithmic builder and review harness demotion`.

Why this is the next bold slice:

- It targets a known product-failed plan-generation path, not a random large file.
- The old review/confirm mutation seam is already bounded as `preview_only`.
- The accepted selected-plan path now lives in [running plan engine actions](../../../src/lib/running-plan-engine-actions.ts)
  and [plan creation engine](../../../src/lib/plan-creation-engine/).
- It can remove or isolate several thousand lines of stale runtime/harness ownership if source scans
  prove the old builder is no longer needed for product behavior.

Slice 10B required proof before deletion:

- Source scan for `buildPlanPresetReviewDraftContract`, `buildPlanPresetAlgorithmicDraft`,
  `preset-builder-io-contract`, `preset-segment-anatomy-table`, `preset-quality-gates`,
  and `validate-plan-preset-eligibility`.
- Prove no frontend or runtime product path can call old review/confirm expansion.
- Prove `getPlanPresetCards(...)` still works if it remains required for the onboarding card view.
- Prove `previewRunningPlanDraft(...)` still works for accepted 10K/Half/Marathon preview families.
- Prove no plan confirm/persistence path is added.

Slice 10B validation expectations:

- `rg -n "buildPlanPresetReviewDraftContract|buildPlanPresetAlgorithmicDraft|preset-builder-io-contract|preset-segment-anatomy-table|preset-quality-gates|validate-plan-preset-eligibility" src scripts package.json`.
- `rg -n "getPlanPresetCards|previewRunningPlanDraft|reviewPlanPresetDraft|confirmPlanPresetDraft" src scripts package.json`.
- `npm exec eslint -- src/lib/plan-preset-actions.ts src/lib/training-api.ts src/lib/plan-presets/*.ts src/lib/plan-presets/recipe-expanders/*.ts src/lib/plan-creation-engine/*.ts scripts/validate-running-plan-engine-source.ts scripts/validate-running-plan-engine-10k-builder.ts scripts/validate-running-plan-engine-r6-builders.ts`.
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`.
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`.
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`.
- `npm run validate-admin-capture-backlog`.
- `git diff --check`.
- `npm run build`.

### No-New-System Rules

- No new plan-creation path without deleting, demoting, or explicitly isolating the old path it replaces.
- No new route-local UI system when a Hito DS primitive, token, or shared component already exists.
- No new AI path without a bounded backend contract, explicit review/confirm boundary, and removal plan
  for any replaced path.
- No new facade export unless it is the canonical public seam and its owner is named.
- No compatibility branch without a removal condition, compatibility owner, and validation proof.
- No `1000+` line file receives new responsibility without an extraction plan in the same slice or a
  recorded architecture exception.
- No frontend-owned schedule, metric, eligibility, persistence, provider, or billing truth.
- No QA harness deletion unless replacement validation proves the same safety boundary.

## Context

Hito has accumulated a lot of successful work quickly:

- saved-mode Supabase truth
- structured onboarding
- AI blueprint first-plan generation
- internal envelope proof
- Plan Presets
- voice/text authoring
- active-plan refresh/apply
- schedule edit
- Garmin feedback
- admin analytics/capture/backlog
- Hito DS rollout
- many dedicated QA harnesses

The product is safer than before, but the system is now at risk of becoming hard to reason about
because multiple seams can appear to own the same product truth.

The simplification strike is not a rewrite. It is a sequence of deletion and narrowing slices that
make the existing architecture smaller and more legible.

## Root Cause

The complexity is not mainly caused by one dependency or one large component.

The root cause is overlapping ownership:

- several plan creation paths can lead to canonical `training-plan-v2`
- several server action wrappers expose plan creation or mutation seams
- `training-api.ts` still acts as a broad compatibility facade after many modules were extracted
- old active plan files can remain visible even after archive copies exist
- validation scripts have grown into multi-domain safety nets that are expensive to review
- tooling signals are mixed, especially if multiple lockfiles imply multiple package managers

If we only patch visible symptoms, the project will keep adding helpers, wrappers, plans, and QA
scripts. The correct fix is to reduce sources of truth.

## Non-Goals

- Do not rewrite the app.
- Do not replace TanStack Start, Supabase, Hito DS, Nitro, Vercel, or OpenAI in this strike.
- Do not delete working product features.
- Do not weaken review/confirm mutation boundaries.
- Do not make frontend own backend truth.
- Do not make Plan Presets a frontend template system.
- Do not promote envelope to production default.
- Do not remove local/admin compatibility before a separate auth lifecycle audit approves it.
- Do not bundle risky code cleanup with docs cleanup.
- Do not touch the active Plan Preset implementation while it is still in flight.

## Core Architecture Rule

Every simplification must move Hito closer to one canonical pipeline:

`runner/provider input -> backend validation -> normalization -> canonical persisted entities -> deterministic product truth -> optional AI/enrichment -> explicit review/confirm when mutation is risky -> UI rendering`

Simplification means fewer owners for the same truth, not new abstractions with nicer names.

## Start Gate

Plan Presets are complete and archived, so the simplification strike may begin.

Code cleanup is still gated by worktree safety. The shipped Plan Preset implementation has been
preserved in git, so Plan Preset source files are no longer a dirty-worktree blocker. Do not start
product-code cleanup until the remaining unrelated instruction/tooling changes are either committed,
discarded by explicit user request, or intentionally separated.

Treat these shipped Plan Preset files as product behavior, not simplification targets:

- [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx)
- [Onboarding gate](../../../src/components/OnboardingGate.tsx)
- [Structured plan constructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [Plan Presets library](../../../src/lib/plan-presets/)
- [Training API facade](../../../src/lib/training-api.ts)
- [Active plan persistence](../../../src/lib/active-plan-persistence.ts)
- [Plan Preset backlog item](../../tasks/backlog/2026-06-06-first-plan-preset-library-and-custom-authoring-escape-hatch.md)

Docs/source-of-truth cleanup may start now because it does not touch product source behavior.

## Post-Plan-Presets Audit Findings

Date: 2026-06-07.

Shipped Plan Preset scope now intentionally includes:

- [Plan Preset library](../../../src/lib/plan-presets/) for recipe/schema/resolver/expansion,
  review-token, persistence metadata, and composition ownership.
- [Plan Preset server actions](../../../src/lib/plan-preset-actions.ts) for backend-owned card,
  review, token/checksum, no-active-plan guard, and confirm/persistence boundaries.
- [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx) and
  [Onboarding gate](../../../src/components/OnboardingGate.tsx) for frontend card/review/confirm
  rendering and server-action orchestration.
- [Plan Preset validation harness](../../../scripts/validate-plan-preset-eligibility.ts) plus
  [Plan Preset script fixtures](../../../scripts/plan-presets/) for card, draft, metric, and confirm
  contract preservation.
- Current docs and changelog entries describing shipped no-active-plan Plan Presets.

Current dirty/untracked state:

- The Plan Preset shipped implementation was committed and pushed as
  `9ad43db Ship Plan Presets no-active-plan creation`.
- Remaining modified files are unrelated to Plan Presets:
  [architect agent instructions](../../../agents/architect.agent.md),
  [admin Backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts),
  [plan-writing skill](../../../skills/hito-plan-writing-and-closeout/SKILL.md), and
  [prompt-handoff skill](../../../skills/hito-prompt-handoff/SKILL.md).
- Remaining untracked docs include this simplification plan and older active plan files that appear
  to predate this closeout.

Hotspots worth simplifying now:

- Active/archive plan duplicates are the safest immediate target because they create false active
  work and confuse the Backlog importer.
- [training-api](../../../src/lib/training-api.ts) still has broad compatibility imports/re-exports;
  it is a good later narrowing target after docs/source-of-truth cleanup.
- [OnboardingGate](../../../src/components/OnboardingGate.tsx) is now about `916` lines and mixes
  structured setup, voice setup, advanced JSON, and Plan Presets orchestration. It is a later
  frontend decomposition candidate, not Slice 1.
- [StructuredPlanConstructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx) is
  about `806` lines and should not receive more responsibilities before a focused frontend slice.
- [Plan Preset resolver](../../../src/lib/plan-presets/resolver.ts) is about `453` lines and
  [recipe shared helpers](../../../src/lib/plan-presets/recipe-expanders/shared.ts) are about `368`
  lines; both are acceptable now after Slice 2F extraction, but should be watched before adding new
  families.
- [admin Backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts) is a tooling
  hotspot and currently hangs in dry-run during closeout validation. Treat the hang as a separate
  tooling follow-up unless Slice 1 needs importer responsiveness to complete mirror cleanup.

Safe no-behavior-change cleanup candidates:

- reconcile or remove duplicate active/archive plan files after comparing evidence
- update current-state active inventory if it lists completed work as active
- narrow `training-api.ts` imports one action group at a time after source-of-truth docs are clean
- decompose one large onboarding owner only after Plan Preset source files are intentionally
  preserved
- isolate or fix backlog importer hang as a tooling slice, not as product behavior

Risky or deferred cleanup:

- deleting Plan Preset runtime files, recipe helpers, or validation harnesses
- changing Plan Preset composition behavior or adding preset families
- changing confirm/persistence, DB schema, Supabase, or active-plan lifecycle
- deleting AI blueprint/envelope/text/voice authoring paths without a separate classification gate
- redesigning onboarding or Hito DS surfaces during simplification

## Workstream 0: In-Flight Worktree Safety

Purpose:

Protect current Plan Preset creation/confirm work from accidental cleanup edits.

Steps:

1. Run `git status --short`.
2. List modified/untracked files.
3. Classify each changed file as:
   - shipped Plan Preset work, do not touch in simplification cleanup
   - unrelated user change
   - safe simplification target
   - unknown, do not touch
4. If unrelated dirty/untracked files remain, block product-code cleanup until their commit or
   exclusion scope is explicit.
5. Proceed to Workstream 1 for docs/source-of-truth cleanup only.

Validation:

- No file changes required unless the plan start gate needs updating.
- If this plan changes, run targeted `git diff --check`.

Exit criteria:

- The strike has a clear yes/no start gate.
- No shipped Plan Preset implementation work is accidentally touched.
- Product-code cleanup remains blocked until unrelated dirty/untracked files are handled or
  explicitly excluded from the cleanup slice.

## Workstream 1: Active/Archive Source-Of-Truth Cleanup

Purpose:

Remove false active work before touching code.

Observed issue:

Some plan files exist in both `docs/plans/active/` and `docs/plans/archive/`. That makes agents,
Backlog importer output, and humans see completed work as active.

Known duplicate candidates to verify:

- [Admin analytics active plan](2026-05-17-admin-analytics-page-plan.md) and
  [Admin analytics archive plan](../archive/2026-05-17-admin-analytics-page-plan.md)
- [Active plan schedule edit active plan](2026-05-25-active-plan-schedule-edit-plan.md) and
  [Active plan schedule edit archive plan](../archive/2026-05-25-active-plan-schedule-edit-plan.md)
- [AI-authored first plan active plan](2026-05-26-ai-authored-first-plan-pipeline.md) and
  [AI-authored first plan archive plan](../archive/2026-05-26-ai-authored-first-plan-pipeline.md)
- [Plan authoring decomposition active plan](2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md) and
  [Plan authoring decomposition archive plan](../archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md)
- [Envelope adoption active plan](2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md) and
  [Envelope adoption archive plan](../archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md)
- [Calendar pre-start active plan](2026-06-01-first-plan-calendar-pre-start-rendering-polish.md) and
  [Calendar pre-start archive plan](../archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md)

Steps:

1. Compare each active/archive duplicate.
2. If the archive copy is canonical and complete, remove the active duplicate.
3. If the active copy has newer evidence that archive lacks, merge only final closeout evidence into
   archive first.
4. Do not archive or remove genuinely active work.
5. Update [current state](../../current-state.md) only if it lists a duplicate as active.
6. Do not update [current product](../../current-product.md) or [current system](../../current-system.md)
   for planned cleanup unless implemented behavior changes.

Validation:

- `git diff --check -- docs/plans/active docs/plans/archive docs/current-state.md`
- `npm run import-admin-backlog-work-items -- --dry-run`
- If dry-run shows required mirror updates, run the live importer only after confirming it is safe.
- `npm run validate-admin-capture-backlog`

Exit criteria:

- `docs/plans/active/` contains only work that truly guides active execution.
- Duplicate active/archive plan files are gone or explicitly justified.
- Backlog mirror no longer treats completed duplicate plans as active work.

### Slice 1 Result

Status: complete on 2026-06-07.

Duplicate candidates inspected:

- `2026-05-17-admin-analytics-page-plan.md`
- `2026-05-25-active-plan-schedule-edit-plan.md`
- `2026-05-26-ai-authored-first-plan-pipeline.md`
- `2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md`
- `2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`
- `2026-06-01-first-plan-calendar-pre-start-rendering-polish.md`

Canonical decisions:

- [Admin analytics archive plan](../archive/2026-05-17-admin-analytics-page-plan.md) is canonical:
  it is readable, marked `Complete / Closed / archived`, and includes final Phase 1 / Phase 1A
  exit criteria plus no-next-step guidance. The active duplicate was stale and was removed.
- [Active-plan schedule edit archive plan](../archive/2026-05-25-active-plan-schedule-edit-plan.md)
  is canonical: it is marked `closed`, includes final QA closeout, moved residual follow-ups to
  backlog, and says no active next step remains. The active duplicate was stale and was removed.
- [AI-authored first-plan archive plan](../archive/2026-05-26-ai-authored-first-plan-pipeline.md)
  is canonical: it is marked `Complete / Closed / archived after production blueprint wave`, and
  points future work to split tracks. The active duplicate was stale and was removed.
- [Plan authoring decomposition archive plan](../archive/2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md)
  is canonical: it is marked complete/archived and explicitly redirects follow-through cleanup to
  the active optimization strike plan. The active duplicate was stale and was removed.
- [Envelope adoption archive plan](../archive/2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md)
  is canonical: it is marked completed, records internal non-default envelope exactness, and says
  future rollout/default-switch work needs a separate plan. The active duplicate was stale and was
  removed.
- [Calendar pre-start archive plan](../archive/2026-06-01-first-plan-calendar-pre-start-rendering-polish.md)
  is canonical: it is archived, QA-passed, and keeps generic Hito DS calendar/workout playground
  work separate. The active duplicate was stale and was removed.

Evidence merged:

- None. The archive files were newer/canonical and already contained closeout evidence; no active
  duplicate had evidence that needed to be merged.

Ambiguous candidates:

- None among the six inspected duplicate filenames.

Validation note:

- Markdown whitespace validation passed.
- Admin Backlog deterministic validator passed.
- Initial importer dry-run hung before Slice 2. After Slice 2 and the stale PDF active-file cleanup,
  `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000` completes cleanly.
- Live mirror refresh was not run because the clean dry-run reported `created: 0` and `updated: 0`.

Next recommended slice:

BACKEND / FRONTEND unified Admin Backlog repo work-item model.

Reason:

The source-of-truth duplicate cleanup is complete and the repo-derived admin Backlog importer now
has bounded diagnostics plus a clean dry-run. The next root-cause simplification is to make Admin
Backlog treat backlog markdown and active plans as one explicit work-item domain instead of relying
on duplicate wrapper files or raw `source_type` labels.

## Workstream 2: Unified Admin Backlog Repo Work-Item Model

Purpose:

Make Admin Backlog show both future work and current work without duplicate wrapper markdown files.

Root-cause diagnosis:

- Hito currently stores repo-authored work in several valid folders:
  [backlog tasks](../../tasks/backlog/), [active plans](./), [archived plans](../archive/),
  [frontend specs](../../tasks/frontend-specs/), and [product briefs](../../tasks/product-briefs/).
- The importer already scans those folders, but the domain model still reads like an admin capture
  backlog mirror instead of a unified repo work-item model.
- Current importer identity is `metadata.source_type + metadata.source_path`, which is good for
  idempotent row refresh but does not tell the UI whether a repo row is a backlog idea, active plan,
  archived plan, frontend spec, or product brief in a user-friendly way.
- Active plans can become invisible or confusing in Admin because the route is named `Backlog`, the
  default tabs are only `Active / Done / Archived`, source labels are raw values such as
  `active_plan`, and wrapper backlog files can be created to make active/future work discoverable.
- Duplicate wrappers are the symptom. Examples currently exist where the same concept appears in
  both backlog and active-plan roots, such as HR-zone and voice-to-plan docs. That creates two
  Supabase mirror rows for one real product idea instead of one clear source of truth.

Architecture decision:

Choose Option A.

Keep the current folders and expand the importer/Admin model so all approved repo markdown sources
are mirrored into one Admin work-item surface with explicit kind/lifecycle metadata. Do not introduce
a new `docs/work-items/` root yet. A new root would be a larger migration, would force broad path
updates across docs/history/importer/backlog mirrors, and would not solve the immediate visibility
problem faster than a model correction.

Canonical work-item domain:

- A repo work item is any approved markdown document that represents future, current, review, or
  completed work and can be mirrored into Admin for discovery and prompt copy.
- Markdown remains canonical for repo-authored work.
- Supabase `admin_capture_items` remains the read-only mirror for repo-derived rows and the
  canonical storage only for admin-created quick notes/captured UI rows.
- Source identity remains `metadata.source_path + metadata.source_type` for compatibility and
  idempotency.
- Add explicit display metadata rather than changing identity:
  `work_item_kind`, `work_item_lifecycle`, `source_group`, and a display label for source type.

Source hierarchy:

- `docs/tasks/backlog/`
  future backlog ideas, paused work, and follow-ups that are not active execution plans.
- `docs/plans/active/`
  currently active execution plans, cleanup strikes, architecture tracks, implementation tracks, and
  current QA/review gates.
- `docs/plans/archive/`
  completed, closed, superseded, or historical plans that should remain searchable but not appear as
  active work.
- `docs/tasks/frontend-specs/` and `docs/tasks/product-briefs/`
  specialized repo work items that should stay discoverable without becoming active plans.

Metadata and status mapping:

| Source type | Work item kind | Lifecycle | Admin status default | Admin label |
| --- | --- | --- | --- | --- |
| `backlog_doc` | `backlog_item` | `backlog` | `new` | `Backlog item` |
| `active_plan` | `plan` | `active` | `ready_for_codex` unless markdown says `backlog`/`blocked` | `Active plan` |
| `archived_plan` | `plan` | `archived` | `done` or `archived` | `Archived plan` |
| `frontend_spec` | `frontend_spec` | `backlog` / `in_progress` from metadata | existing status mapping | `Frontend spec` |
| `product_brief` | `product_brief` | `backlog` / `in_progress` from metadata | existing status mapping | `Product brief` |

Required canonical metadata sections for new/updated repo work items should remain:

- `Status`
- `Type`
- `Priority`
- `Next Recommended Role`
- `Task`
- `Stage`
- `Exact Handoff Prompt`

For active plans, `Status` should use importer-normalizable values such as `in_progress`,
`backlog`, `completed`, `closed`, or `archived`, not free-form prose. Richer status wording belongs
inside the body.

Importer implications:

- Keep scanning the existing approved roots.
- Keep upsert identity stable by `source_type + source_path`.
- Add explicit `metadata.work_item_kind`, `metadata.work_item_lifecycle`,
  `metadata.source_group`, `metadata.source_group_label`, and `metadata.source_label`.
- Add dry-run diagnostics for duplicate concepts across approved roots. The first version can report
  likely duplicates by same date+slug or same normalized task title. It should not silently suppress,
  merge, or archive rows.
- Preserve stale mirror detection: if an approved source path disappears, report it and archive only
  behind explicit `--archive-stale`.
- Preserve read-only repo-derived rows in Admin mutation actions.

Admin UI implications:

- The `/admin/capture` route may keep its URL for now, but visible copy should treat the surface as
  `Work items` or `Backlog & plans`, not only `Backlog`.
- Add a source-kind filter or group display:
  `All work`, `Backlog`, `Active plans`, `Specs`, `Briefs`, `Archive`.
- Row metadata should show human labels such as `Active plan` instead of raw `active_plan`.
- Detail readback should show:
  source path, source type label, work item kind, lifecycle/status, markdown metadata health, and
  read-only source-of-truth note.
- Active plans should appear in the default active view when their lifecycle is active/in-progress.
- Archived/completed plans should remain searchable through `Done`/`Archived` or source filters but
  not clutter active execution.

Migration strategy:

- No folder migration in v1.
- Do not create duplicate backlog wrapper items for active plans.
- Existing duplicate wrapper pairs should be resolved as a later docs cleanup after importer reports
  likely duplicates with evidence.
- Keep existing `docs/tasks/backlog` and `docs/plans/active` paths stable so current markdown links,
  archive history, and handoff prompts do not break.
- Only consider a future `docs/work-items/` root if the current-folder model still causes repeated
  confusion after importer/UI labels are fixed.

First implementation slice:

BACKEND / FRONTEND Slice 3:

1. Add the explicit repo work-item metadata fields in
   [admin Backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts).
2. Add dry-run duplicate-concept diagnostics without changing import behavior.
3. Update `/admin/capture` readback/filter labels to show repo source kind clearly.
4. Preserve all existing read-only mirror behavior and stale cleanup behavior.
5. Do not run live import until dry-run proves whether mirror updates are required.

Validation gates:

- targeted ESLint for changed importer/Admin files
- `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000`
- `npm run import-admin-backlog-work-items -- --dry-run --archive-stale --timeout-ms 30000` if
  stale/duplicate diagnostics are touched
- `npm run validate-admin-capture-backlog`
- browser QA for `/admin/capture` only if UI labels/filters change
- `git diff --check`

Expected user-visible behavior:

- Admin sees backlog tasks and active plans in one work-item surface.
- Active plans are discoverable without duplicate backlog wrapper files.
- Rows clearly say whether they are backlog items, active plans, specs, briefs, or archived plans.
- Repo-derived rows remain read-only in Admin, with markdown as source of truth.

What not to touch:

- Do not move markdown folders in this slice.
- Do not mutate Supabase in architecture/planning mode.
- Do not create backlog wrappers for active plans.
- Do not make Admin UI editable for repo-derived rows.
- Do not change product Plan Presets, plan generation, persistence, or manual workout work.

## Workstream 3: Package-Manager And Tooling Signal Simplification

Purpose:

Avoid agents and local tooling choosing different install/build assumptions.

Observed issue:

Both [package-lock.json](../../../package-lock.json) and [bun.lockb](../../../bun.lockb) are tracked,
while [package.json](../../../package.json) does not declare `packageManager`.

Recommended default:

Use npm as the canonical package manager unless source audit proves Bun is intentionally required.

Steps:

1. Inspect [package.json](../../../package.json), [README](../../../README.md), CI/deploy docs, and
   scripts for Bun usage.
2. If npm is canonical:
   - add `packageManager` to [package.json](../../../package.json)
   - keep [package-lock.json](../../../package-lock.json)
   - remove [bun.lockb](../../../bun.lockb)
3. If Bun is canonical:
   - document why
   - remove npm lock only if CI/deploy agrees
4. Do not change dependency versions in this slice unless lockfile normalization requires it.

Validation:

- `npm install --package-lock-only` only if package metadata changes require lockfile sync.
- `git diff --check -- package.json package-lock.json bun.lockb README.md`
- `npm run build` only if package metadata or lockfiles changed.

Exit criteria:

- One package-manager signal is canonical.
- The repo no longer sends mixed npm/Bun instructions by default.

## Workstream 4: `training-api.ts` Facade Narrowing

Purpose:

Stop [training-api.ts](../../../src/lib/training-api.ts) from being a hidden second API for the
whole product.

Current state:

`training-api.ts` still imports/re-exports many extracted action owners. This was useful during
decomposition, but it should not remain the default path forever.

Keep in `training-api.ts` for now:

- route-data wrappers that need request snapshot/viewer injection
- persisted snapshot loading
- preview/persisted snapshot compatibility
- public wrappers that cannot move safely without changing route contracts

Move direct imports away from `training-api.ts` when safe:

- [auth actions](../../../src/lib/auth-actions.ts)
- [first-plan actions](../../../src/lib/first-plan-actions.ts)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [plan replacement actions](../../../src/lib/plan-replacement-actions.ts)
- [active-plan export actions](../../../src/lib/active-plan-export-actions.ts)
- [user settings actions](../../../src/lib/user-settings-actions.ts)
- [workout log actions](../../../src/lib/workout-log-actions.ts)

Steps:

1. Generate a usage map of imports from `@/lib/training-api`.
2. Classify each import:
   - route-data/snapshot wrapper, keep
   - action owner exists, candidate for direct import
   - type-only import, candidate for moving type export
   - compatibility required, keep with reason
3. Change one narrow group per slice.
4. Remove dead re-exports only after no imports use them.
5. Do not change behavior or action names in the same slice.

Validation:

- targeted ESLint for changed files
- `git diff --check`
- `npm run build`

Exit criteria:

- `training-api.ts` has fewer responsibilities.
- Each remaining export has an explicit reason.
- No route loses request-auth/snapshot behavior.

## Workstream 5: Plan-Creation Path Classification And Deletion Gates

Purpose:

Make plan creation understandable before deleting or adding more paths.

Paths to classify:

- [AI first-plan blueprint modules](../../../src/lib/ai-first-plan-blueprint-authoring.ts)
- [AI first-plan envelope modules](../../../src/lib/ai-first-plan-envelope-expand.ts)
- [AI draft service](../../../src/lib/ai-first-plan-draft-service.ts)
- [structured plan authoring](../../../src/lib/structured-plan-authoring.ts)
- [first plan actions](../../../src/lib/first-plan-actions.ts)
- [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
- [Plan Presets library](../../../src/lib/plan-presets/)
- [voice-to-plan authoring](../../../src/lib/voice-to-plan-authoring.ts)
- [OpenAI text plan authoring](../../../src/lib/openai-plan-authoring.ts)
- [rich workout draft authoring](../../../src/lib/rich-workout-draft-authoring.ts)
- [plan replacement actions](../../../src/lib/plan-replacement-actions.ts)
- [imported plan parser](../../../src/lib/imported-plan.ts)
- [active-plan refresh actions](../../../src/lib/active-plan-refresh-actions.ts)
- [active-plan schedule edit preview](../../../src/lib/active-plan-schedule-edit-preview.ts)

Classification buckets:

- production default
- production non-default explicit path
- internal/non-default supported path
- ops/diagnostic path
- QA/doctrine-only fixture path
- legacy compatibility/readback path
- delete/demote candidate
- keep for now with explicit reason

Required decisions:

1. Which paths can create a new active plan?
2. Which paths can replace or refresh an active plan?
3. Which paths are non-mutating review only?
4. Which paths call OpenAI?
5. Which paths must never call OpenAI?
6. Which paths persist through [active-plan persistence](../../../src/lib/active-plan-persistence.ts)?
7. Which path is the first safe deletion/demotion candidate?
8. What validation must pass before deletion?

Validation:

- source inspection only
- no product code changes in the classification pass
- `git diff --check` only if this plan or a related architecture note changes

Exit criteria:

- No future agent has to guess whether a path is production, internal, ops-only, or legacy.
- First deletion/demotion candidate is selected with an explicit gate.

## Workstream 6: Plan Persistence Owner Consolidation

Purpose:

Ensure there is one canonical persistence owner for plan creation/replacement.

Current canonical owner:

- [active-plan persistence](../../../src/lib/active-plan-persistence.ts)

Known lower-level entrypoints:

- `applyImportedPlanForUser(...)`
- `createFirstPlanFromReviewedCanonicalPlanForUser(...)`

Steps:

1. Map all callers into this seam.
2. Verify each caller performs only path-specific validation/review/token logic before persistence.
3. Identify duplicate active-plan checks or rollback logic outside the persistence owner.
4. Keep path-specific server actions, but prevent them from owning row insertion rules.
5. Do not add a second persistence system for Plan Presets, voice, text, import, or refresh.

Validation:

- targeted source inspection
- behavior-preservation harnesses for any touched path
- no DB/schema change unless a concrete missing field is proven

Exit criteria:

- Persistence ownership is clear.
- No plan creation path can silently bypass lifecycle guards or rollback policy.

## Workstream 7: Script And Validator Decomposition

Purpose:

Keep safety harnesses strong but reviewable.

Current hotspots:

- [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
- [AI first plan draft script](../../../scripts/author-ai-first-plan-draft.ts)
- [admin backlog importer](../../../scripts/import-repo-work-items-to-admin-backlog.ts)
- [admin capture validator](../../../scripts/validate-admin-capture-backlog.ts)
- [first-plan release gates](../../../scripts/plan-authoring-doctrine/first-plan-release-gates.ts)

Rules:

- Keep top-level commands stable.
- Extract by ownership, not arbitrary line count.
- Do not weaken assertions.
- Do not combine behavior change with broad extraction.
- Prefer deleting duplicate helpers over adding helper layers.

Steps:

1. Pick one script hotspot.
2. Identify assertion/fixture/CLI parsing boundaries.
3. Extract one stable responsibility.
4. Preserve command output shape where QA depends on it.
5. Add exact preservation assertions if behavior might drift.

Validation:

- existing command for the extracted script
- `git diff --check`
- `npm run build` only if runtime source changed

Exit criteria:

- Validators remain trustworthy.
- Future deletion gates are easier to prove.

## Workstream 8: Hito DS Wrapper And Dependency Usage Audit

Purpose:

Delete truly unused UI wrappers/dependencies without dismantling Hito DS reuse.

Important boundary:

Hito DS wrappers are not automatically bad. Many Radix/shadcn wrappers are the intended shared UI
contract. Removing them blindly would increase route-local UI.

Steps:

1. Audit [components.json](../../../components.json), [UI primitives](../../../src/components/ui/),
   and dependency imports.
2. Classify wrappers:
   - used Hito DS primitive, keep
   - unused but likely future DS primitive, consider backlog only
   - unused imported shadcn artifact, delete candidate
   - product visualization dependency, keep if used
3. Remove only unused wrappers/dependencies with source proof.
4. Do not redesign UI in this slice.

Validation:

- targeted ESLint
- `git diff --check`
- `npm run build`

Exit criteria:

- UI dependency surface is smaller where safely possible.
- Hito DS remains the canonical UI reuse layer.

## Workstream 9: Auth/Admin Compatibility Follow-Up

Purpose:

Avoid re-opening admin auth unless simplification work uncovers active duplication risk.

Known compatibility paths:

- signed admin session cookie
- local auth bypass cookie
- Supabase app metadata admin compatibility
- local tester accounts
- admin route/serverFn allowlist

Rule:

Do not simplify auth opportunistically. Only start this work after a dedicated root-cause audit or
recurring failure signal.

Exit criteria:

- Auth/admin remains out of the simplification strike unless selected as a concrete follow-up.

## Workstream 10: Changelog And Backlog Policy Cleanup

Purpose:

Keep shipped history, repo backlog, and admin backlog mirror from becoming three conflicting truths.

Rules:

- [changelog](../../history/changelog.md) is shipped history.
- [backlog docs](../../tasks/backlog/) are future or active task intake.
- admin Backlog mirror is an operational mirror, not canonical shipped history.
- Completed implementation closeout must either add changelog entry or explicitly say why not.

Steps:

1. During active/archive cleanup, identify completed implementation plans missing changelog entries.
2. Do not add changelog for unimplemented plans or pure future backlog.
3. Keep repo-derived admin Backlog read-only.
4. Run importer dry-run after markdown task status changes.

Validation:

- targeted `git diff --check`
- admin backlog importer dry-run when markdown source state changes
- `npm run validate-admin-capture-backlog`

Exit criteria:

- No completed shipped work relies on Backlog mirror as its changelog substitute.

## Suggested Slice Order

### Slice 0: Start Gate And Dirty Worktree Safety

Owner:

ARCHITECT

Scope:

- inspect dirty worktree
- confirm Plan Preset track is archived
- classify shipped Plan Preset dirty/untracked files as do-not-touch for cleanup
- approve docs/source-of-truth cleanup only

No product code changes.

Status:

Complete for planning. The strike can start with docs/source-of-truth cleanup. Product-code cleanup
waits until shipped Plan Preset source files are intentionally preserved.

### Slice 1: Active/Archive Cleanup

Owner:

ARCHITECT

Scope:

- remove or reconcile active/archive duplicate plans
- update current state only if needed
- run Backlog importer dry-run and admin backlog validator

Exact first slice:

- compare the six known active/archive duplicate plan filenames:
  `2026-05-17-admin-analytics-page-plan.md`,
  `2026-05-25-active-plan-schedule-edit-plan.md`,
  `2026-05-26-ai-authored-first-plan-pipeline.md`,
  `2026-05-28-plan-authoring-engine-decomposition-and-legacy-cleanup.md`,
  `2026-06-01-ai-first-plan-envelope-production-adoption-and-prompt-simplification.md`, and
  `2026-06-01-first-plan-calendar-pre-start-rendering-polish.md`
- if the archive copy is canonical and complete, remove the false active duplicate
- if the active copy has newer closeout evidence, merge that evidence into archive first
- do not touch genuinely active work, product source, runtime code, lockfiles, Supabase, or Plan
  Preset shipped files
- treat the backlog importer hang as a tooling gap; use bounded timeout and do not run live import if
  dry-run does not complete

Status:

Complete on 2026-06-07. Six false active/archive duplicate plan files were removed. Admin Backlog
mirror refresh was later unblocked by Slice 2 plus stale PDF active-file cleanup; live import was not
run because the clean dry-run reported no required mirror changes.

### Slice 2: Admin Backlog Importer Dry-Run Responsiveness

Owner:

BACKEND / QA

Scope:

- reproduce the `npm run import-admin-backlog-work-items -- --dry-run` hang with a bounded timeout
- identify whether the hang is markdown scanning, filesystem/iCloud access, stale mirror lookup,
  Supabase/env setup despite dry-run, or output/reporting
- fix the root cause without changing product behavior
- keep dry-run safe and keep `--archive-stale` explicit
- do not run live import until dry-run completes and reports whether mirror updates are required

Status:

Implemented on 2026-06-07. The importer now has bounded timeout, phase diagnostics, and debug
logging. Plain dry-run does not reach Supabase; the observed hang is during markdown scanning at
`read_markdown_file` for `docs/plans/active/2026-05-15-plan-export-pdf.md`. The command now exits
with a bounded diagnostic instead of hanging indefinitely.

Follow-up cleanup on 2026-06-07 resolved the remaining file-access blocker. The active PDF export
file was untracked, unreadable through bounded reads, and stale relative to the canonical backlog
item [Active Plan PDF Export Plan](../../tasks/backlog/2026-05-15-plan-export-pdf.md) plus the
archived [Plan Export From Open Plan](../archive/2026-05-15-plan-export-from-open-plan.md) history.
Only the false active copy was removed. PDF export remains preserved as a useful future backlog
slice, not an active implementation plan.

After removal, `npm run import-admin-backlog-work-items -- --dry-run --timeout-ms 30000` completed
successfully with `ok: true`, `created: 0`, `updated: 0`, `duplicateCount: 0`,
`repoDerivedInReviewCount: 0`, and `staleActiveRepoMirrorCount: 0`. Live import was not run because
the dry-run reported no required mirror changes.

### Slice 3: Unified Admin Backlog Repo Work-Item Model

Owner:

BACKEND / FRONTEND

Scope:

- keep existing markdown folders
- add explicit repo work-item kind/lifecycle/source-group metadata in the importer
- add duplicate-concept dry-run diagnostics for wrapper duplicates
- update Admin row/detail labels and filters so backlog items and active plans are both visible
- preserve repo-derived read-only behavior and stale cleanup
- do not run live import before dry-run proves the source scan and metadata shape

Status:

Implemented and QA-passed on 2026-06-07.

Implemented behavior:

- The importer emits explicit repo work-item kind/lifecycle/source-group metadata, human source
  labels, source-group counts, and duplicate-concept diagnostics without changing
  `metadata.source_type + metadata.source_path` identity.
- Admin readback exposes typed repo work-item metadata.
- `/admin/capture` shows a `Work items` surface with source filters for `All work`, `Backlog`,
  `Active plans`, `Specs`, `Briefs`, and `Archive`.
- Repo-derived rows remain read-only and markdown remains canonical.

QA evidence:

- Built-in Codex browser was used first.
- Actual dev server was discovered on `localhost:8082`.
- `/admin/capture` loaded without `ERR_BLOCKED_BY_CLIENT`.
- Targeted ESLint passed.
- Importer dry-run passed without writes.
- `npm run validate-admin-capture-backlog` passed.
- Read-only Supabase source-group proof passed.
- `git diff --check` passed.
- `npm run build` passed.
- Dry-run source groups were:
  `backlog: 19`, `active_plans: 7`, `specs: 16`, `briefs: 8`, `archive: 70`.
- Read-only Supabase current source groups included:
  `backlog: 19`, `active_plans: 7`, `specs: 16`, `briefs: 8`, `archive: 67`.
- Duplicate concept diagnostics were present with count `2`.
- `All work` includes active plans and backlog items.
- `Active plans` shows Hito Stack Simplification Strike and excludes backlog labels.
- `Backlog` shows backlog rows and excludes active-plan labels.
- Specs, briefs, and archive labels work.
- Active-plan detail is read-only and shows source path, source group, kind, and lifecycle.
- Screenshots/artifacts were saved under
  `qa-artifacts/screenshots/2026-06-07/admin-work-items-metadata-filters-qa/`.
- PNG screenshots were partially blocked by `Page.captureScreenshot` timeout, but JSON/text fallback
  artifacts were saved.
- QA did not run live import, `--archive-stale`, migrations, or data mutation.

### Slice 3A: Unified Admin Shell And Navigation Contract

Owner:

DESIGNER / FRONTEND

Status:

Implemented and QA-passed on 2026-06-08.

QA evidence:

- Built-in Codex browser was used first against `localhost:8082`.
- Safari fallback was not used.
- Targeted ESLint passed.
- `npm run validate-admin-capture-backlog` passed.
- `git diff --check` passed.
- `npm run build` passed.
- Overview, Users, Test accounts, and Work items all render the shared Admin nav.
- Desktop sidebar labels are identical across sections.
- Shared helper copy appears:
  `One internal workspace for product truth, users, test accounts, and work items.`
- Route-local `Manual handoff` and `Admin surface` helper identities are gone.
- Exactly one visible desktop sidebar item is active per section.
- Users and Test accounts map to the correct headings/content and active nav items.
- Analytics deep links preserve active sidebar state.
- Work Items list/status/source filter/search/source labels still work.
- `q=screenshot` updates the list count to `Showing 6 of 6 items`.
- Desktop and mobile have no horizontal overflow.
- Artifacts were saved under `qa-artifacts/screenshots/2026-06-08/admin-shell-unification-qa/`.
- PNG capture mostly timed out, but DOM/JSON fallback artifacts cover state.

Diagnosis:

The unified repo work-item model is implemented, but the visible Admin shell still communicates two
different mental models:

- `/admin/analytics` presents a stable Admin surface with a bottom helper titled `Admin surface`.
- `/admin/capture` presents Work items with a bottom helper titled `Manual handoff`.
- Both routes render similar sidebars, but each route owns its own nav list, active state, helper
  copy, and mobile rail.
- This makes Work items feel like a separate mini-app even though it is now part of the same Admin
  workspace as Overview, Users, and Test accounts.

Selected Admin shell model:

- Admin is one workspace.
- There is one persistent Admin sidebar on desktop.
- There is one selected sidebar item at a time.
- The right-side content changes based on the selected item.
- No Admin section should override the shell identity unless it intentionally becomes a separate
  admin app, which Work items is not.
- The existing routes may remain:
  - `/admin/analytics` for analytics/users/test-account sections
  - `/admin/capture` for Work items
- Route boundaries are implementation details. The visible shell should feel shared.

Canonical Admin nav items:

| Item | Visible label | Route / state | Notes |
| --- | --- | --- | --- |
| Overview | `Overview` | `/admin/analytics` + overview state | Default analytics overview. |
| Funnel & Usage | `Funnel & Usage` | `/admin/analytics` + funnel state | Keep current section state. |
| Feedback | `Feedback` | `/admin/analytics` + feedback state | Keep current section state. |
| AI & Entitlements | `AI & Entitlements` | `/admin/analytics` + ai state | Keep current section state. |
| Users | `Users` | `/admin/analytics` + users state | Real users only. |
| Test accounts | `Test accounts` | `/admin/analytics` + test-account state | QA/local/test users. |
| Work items | `Work items` | `/admin/capture` | Replaces visible `Backlog` shell label. |

Naming decision:

- Use `Work items` as the visible admin nav label.
- Do not use `Backlog` as the primary shell label now that the surface includes backlog tasks,
  active plans, specs, briefs, archived plans, and quick admin notes.
- `Backlog` can remain a content filter inside Work items, not a shell identity.

Sidebar helper/card decision:

Use one consistent helper pattern across all Admin sections.

Recommended v1:

- Title: `Admin workspace`
- Body: `Internal tools for analytics, test accounts, and repo-synced work.`

Rules:

- The helper title must not change per section.
- Section-specific operational details belong in the right-side page header or content area.
- Do not use `Manual handoff` as the sidebar identity.
- Do not use `Admin surface` only on analytics sections.
- If the helper continues to feel redundant after implementation, it may be removed entirely from
  all Admin sections, but it must not vary by selected item.

Desktop behavior:

- Sidebar width, logo/admin header, nav row spacing, icon size, active marker, hover backdrop, and
  bottom helper spacing stay identical across Admin sections.
- Selected item uses the existing Hito shell nav active row:
  muted surface wash, foreground label, icon in foreground, and one signal dot/marker.
- Hover uses the same low-chrome row backdrop for all items.
- Focus-visible uses the existing Hito focus ring and must not be visually confused with selected.
- Disabled nav items are not expected in v1. If needed later, they should stay visible, muted, and
  non-interactive with a reason in content, not in the shell helper.
- Only one nav row may carry active styling at a time.
- Work-item status/source filters stay inside the Work items content area.

Route and deep-link behavior:

- `/admin/capture` deep-links directly to Work items with Work items selected.
- `/admin/analytics` defaults to Overview selected.
- Analytics sub-sections may remain internal state, query state, or hash state, but deep links should
  restore the matching selected nav item when the implementation supports them.
- If Frontend keeps analytics section state internal for this slice, the visible requirement is that
  clicking a sidebar item updates one selected row and right-side content without duplicate active
  markers.
- `Back to Hito` and `Sign out` behavior remain unchanged.

Mobile behavior:

- Use one mobile Admin nav pattern across analytics and Work items.
- The mobile topbar should read `Admin / <selected item>`.
- The quick-link rail or drawer must include the same canonical items as desktop.
- Work items should not get a separate mobile nav model.
- If horizontal quick links overflow, switch to a Hito DS drawer/jump menu rather than wrapping into
  multiple noisy rows.
- Work-item filters remain in the Work items content, below the page header.

Accessibility notes:

- Sidebar nav uses `nav` with `aria-label="Admin workspace"`.
- Current route/section link uses `aria-current="page"` for route-level links or
  `aria-current="location"` for internal section links.
- Nav rows are links when they change URL and buttons only when they change internal section state.
- Keyboard focus order should be stable: logo/home, nav items, helper if interactive, content.
- Icons are decorative when labels are visible.
- Active state cannot rely on color only; keep the marker/backdrop/text-weight combination.

Frontend implementation notes:

- Prefer a shared admin nav model over separate route-local nav arrays.
- Candidate shared owner can be a small component or helper near existing admin routes; do not
  introduce a broad admin framework.
- `src/routes/admin.analytics.tsx` and `src/routes/admin.capture.tsx` should consume the same nav
  item definitions and helper copy.
- If analytics sections remain internal tabs, the nav model can expose an item action/href shape
  that supports both route links and section setters.
- Keep Hito DS classes:
  `hito-workbench-shell`, `hito-workbench-sidebar`, `hito-shell-nav`, `hito-shell-nav-row`,
  `hito-shell-nav-icon`, `hito-shell-nav-dot`, `hito-row-group`, `hito-list-row`, and existing
  mobile rail classes.
- Do not add a new Admin-specific visual kit.
- Do not change backend loaders, admin auth, user classification, Work items importer, or Supabase
  mirror behavior.

What not to touch:

- Do not redesign every admin page.
- Do not change admin analytics data, user/test-account classification, or Work items data model.
- Do not move markdown work-item files.
- Do not decide new importer metadata.
- Do not turn Work items source/status filters into shell navigation.
- Do not create duplicate Admin shell components if a small shared helper can cover both routes.

Acceptance criteria:

- Overview, Funnel & Usage, Feedback, AI & Entitlements, Users, Test accounts, and Work items appear
  as one stable Admin nav list.
- Selecting Work items does not change the shell identity to `Manual handoff`.
- Selecting Overview/Test accounts does not show a different helper identity than Work items.
- There is only one active-looking nav item at a time.
- The bottom helper/card is either identical across sections or removed across all sections.
- Work items remains visibly part of Admin, not a separate capture mini-app.
- Work-item filters remain inside the Work items content.
- Desktop and mobile share the same nav item taxonomy.
- Existing routes, auth, data loading, and admin actions continue to work.

### Slice 3B: Worktree Commit Hygiene And Dirty-Work Triage

Owner:

ARCHITECT

Status:

Complete on 2026-06-08.

Reason:

Admin Work Items metadata/filters and Admin shell/navigation unification are implemented and
QA-passed, but the worktree now contains mixed remaining work. Starting package-manager cleanup,
`training-api.ts` narrowing, or any other product-code simplification before classifying and
committing this work would increase risk and make rollback/review harder.

Scope:

- classify all modified/untracked files by source task
- split ready work into clean commit groups
- preserve unrelated instruction/skill updates as their own scope
- keep older untracked active plans separate until the user confirms whether they should remain
  active, move to backlog, or be removed as stale duplicates
- keep QA artifacts untracked unless explicitly promoted
- do not push until the branch/remote/commit scope is explicitly approved

Recommended commit groups:

1. Admin Work Items metadata/importer/Admin UI implementation.
2. Admin shell/navigation unification implementation.
3. Hito Stack Simplification Strike plan/docs.
4. Agent/skill instruction updates, if still intentional.
5. Older active-plan docs only after separate source-of-truth confirmation.

Validation:

- `git status --short --branch`
- `git diff --stat`
- `git diff --name-status`
- `git diff --cached --name-status` if anything is staged
- `git ls-files --others --exclude-standard`
- targeted `git diff --check` for the files in each proposed commit group

Exit criteria:

- no mixed staged index
- each ready commit group has an exact file list and message
- unrelated/unconfirmed files remain unstaged
- next simplification slice can start from a known worktree state

Closeout result:

- Admin Work Items metadata/importer/Admin UI implementation, Admin shell/navigation
  implementation, and this simplification strike plan were committed together as
  `5c79d23 Unify admin work items and admin shell`.
- The scoped Admin simplification commit was pushed to `origin/main`.
- Remaining dirty work is intentionally outside that commit:
  agent/skill instruction updates plus older untracked active-plan docs that need separate
  source-of-truth confirmation.

### Slice 3C: Admin Shell Chrome, Account Menu, And Contextual Actions

Owner:

DESIGNER / FRONTEND

Status:

Implemented and QA-passed on 2026-06-08.

Diagnosis:

The unified Admin navigation is implemented and QA-passed, but the chrome still feels heavier than
the Admin workspace needs:

- The left brand stack currently separates logo, `Admin`, and `Admin workspace` in a way that makes
  the sidebar header feel taller and more important than the navigation.
- The right-side page header still uses a large workspace/banner slab with an `Admin workspace`
  kicker, duplicating the sidebar identity.
- Top-right actions currently include global shell utilities such as `Back to Hito` and `Sign out`,
  which competes with section-specific actions.
- Admin account actions have no dedicated account/menu home, unlike the runner app profile pattern.
- Work items needs `Add quick note`, but that should be a contextual page action, not a global
  debugger/capture entry.

Selected Admin chrome model:

- Sidebar owns Admin identity.
- Content owns current section title, description, and contextual actions.
- Account/profile actions live at the bottom of the sidebar.
- The oversized right-side workspace banner is removed.
- No route should create a separate shell identity after the unified navigation work.

Sidebar brand treatment:

- Logo and `Admin` should sit on the same baseline.
- Use the Hito logo at a compact shell height, aligned visually with the `Admin` wordmark/title.
- `Admin` uses the existing display/title treatment, but should not overpower nav items.
- Optional subtitle below:
  - `Admin workspace`
  - micro-label / muted
  - tighter tracking than the current screenshot if uppercase feels too loud
  - no extra card/surface
- Spacing:
  - header block should be compact enough that the nav begins quickly
  - brand row gap should feel intentional, not like logo + separate page title
  - subtitle should sit close under the brand row and read as support copy

Content header treatment:

- Remove the oversized gray/right-side workspace slab.
- Page header should be an open content header:
  - section title
  - one concise subtitle/description
  - optional contextual action slot aligned to the right on desktop
- Do not repeat `Admin workspace` as a kicker if the sidebar already owns that identity.
- Use existing Hito page/section typography roles.
- Keep enough breathing room, but no heavy banner, large background block, or duplicate shell label.
- On mobile, the header can stack title, description, and action, but should stay compact.

Contextual action slot rules:

The top-right header slot is for current-section actions only.

| Section | Header action |
| --- | --- |
| Work items | `Add quick note` |
| Users | `Add user` as disabled/future-safe placeholder only if product wants the seam visible |
| Test accounts | No primary action unless a real local tester action already exists |
| Overview | Empty |
| Funnel & Usage | Empty |
| Feedback | Empty |
| AI & Entitlements | Empty unless a real entitlement/admin action exists |

Rules:

- Use Hito DS button primitives.
- Empty action slot should collapse; do not reserve visual chrome for absent actions.
- Placeholder actions must be visibly disabled or labelled as future-safe; no fake active `Add user`.
- `Back to Hito` is not a contextual section action.
- `Sign out` is not a contextual section action.

Admin account/menu rules:

- Add a bottom-left sidebar account/profile control, similar to the runner app profile trigger.
- It should show compact admin identity:
  - avatar/fallback initials or admin icon
  - display name or `Admin`
  - email/role/supporting line if available
- Use existing Hito dropdown/menu primitives and runner shell account-menu anatomy where possible:
  `hito-shell-profile-trigger`, `hito-shell-menu`, `hito-shell-menu-item`,
  `hito-shell-menu-separator`, `hito-menu-text`, and `hito-menu-meta`.
- Menu actions:
  - `Sign out`
  - `Account settings` disabled/future-safe unless implemented
  - `Invite admin` disabled/future-safe if shown
  - `Manage admin profile` disabled/future-safe if shown
- Do not create a new menu system.
- If admin identity data is not available, use stable fallback copy:
  - primary: `Admin`
  - secondary: `Local operations`

Future online debugger / capture-overlay compatibility:

- `Add quick note` remains a lightweight Work items action.
- It must not imply live product-page element capture, debugger mode, or automatic dispatch.
- Leave room for a future global capture/debugger entry in the Admin account/sidebar utility zone.
- Future debugger entry should be visually distinct from `Add quick note`, for example:
  - sidebar account/menu item: `Open capture mode`
  - or quiet sidebar utility below nav, not a Work items content action
- Do not implement debugger/capture overlay in this slice.
- Do not consume the future debugger conceptual slot with a route-local Work items button.

Frontend implementation notes:

- Reuse the shared Admin navigation introduced in Slice 3A.
- Update both `/admin/analytics` and `/admin/capture`; do not refine only one route.
- Prefer extracting a small shared Admin shell/header/account component if it prevents duplicated
  chrome, but do not introduce a broad framework.
- Reuse `HitoLogo`, existing shell/profile/menu CSS classes, and dropdown primitives.
- Move sign-out out of the page-header action cluster and into the admin account menu.
- Decide whether `Back to Hito` belongs in the admin account menu or as a quiet utility; it must not
  compete with contextual actions.
- Preserve Work items filters/search/status tabs inside Work items content.
- Preserve admin auth, loaders, user/test account data, Work items importer/readback, and Supabase
  behavior.

What not to touch:

- Do not redesign every admin content section.
- Do not change Work Items importer/model.
- Do not mutate Supabase.
- Do not implement fake `Add user`.
- Do not implement online debugger/capture overlay.
- Do not add manual workout CRUD.
- Do not create a new visual system outside Hito DS.
- Do not remove useful section titles/descriptions; only remove the oversized workspace banner and
  duplicate shell identity.

Acceptance criteria:

- Sidebar brand shows Hito logo and `Admin` on one baseline.
- Sidebar subtitle is quiet and reads `Admin workspace` or equivalent concise copy.
- Right-side oversized workspace/banner slab is gone.
- Content headers show only section title, concise subtitle/description, and optional contextual
  action slot.
- Top-right contextual action slot shows `Add quick note` on Work items.
- Users either shows no action or a disabled/future-safe `Add user` placeholder.
- Sections without meaningful actions have no empty action chrome.
- Sign out/account actions live in the bottom-left sidebar account menu.
- Account menu uses Hito DS dropdown/menu/profile primitives.
- `Add quick note` remains distinct from any future online debugger/capture overlay.
- Desktop and mobile remain one Admin workspace with no horizontal overflow.
- Existing routes, auth, data loading, Work items filters, and admin actions continue to work.

Implementation and QA closeout:

- Browser Path Preflight: built-in Codex browser was used first against `http://localhost:8082/`.
- Safari fallback was not used.
- Targeted ESLint passed.
- `npm run validate-admin-capture-backlog` passed.
- `git diff --check` passed.
- `npm run build` passed with existing Vite, Radix, and TanStack warnings only.
- Shared sidebar nav was verified across Work items, Overview, Users, Test accounts, and Funnel.
- Desktop proof showed one active sidebar item per section.
- Sidebar brand visually uses the Hito logo plus `Admin`, with quiet `Admin workspace` subtitle.
- Bottom-left account menu uses Hito avatar/dropdown styling and exposes disabled
  `Account settings`, `Back to Hito`, and `Sign out` href.
- Page-header chrome no longer contains topbar `Back to Hito` or `Sign out`.
- Work items header shows title/subtitle plus `Add quick note`.
- Users shows disabled `Add user`.
- Overview, Test accounts, and Funnel show no fake contextual action.
- Route-local `Manual handoff`, `Admin surface`, and oversized right-side `Admin workspace` slab are
  absent.
- Work Items list/search/status/source filters still render.
- `q=Plan` smoke worked.
- Mobile `375px` proof showed no horizontal overflow.
- QA artifacts were saved under `qa-artifacts/screenshots/2026-06-08/admin-chrome-refinement-qa/`.

Closeout decision:

Slice 3C is complete. Admin chrome now has the accepted shell identity separation: sidebar owns Admin
identity, content owns section title/subtitle/contextual actions, and account actions live in the
bottom-left sidebar menu. This does not start `/hitoDS`, preset-card polish, onboarding hierarchy, or
manual workout work.

### Slice 3D: Hito DS Playground Consistency Contract

Owner:

DESIGNER / FRONTEND

Status:

Implemented, QA-passed, and design-approved on 2026-06-08.

Diagnosis:

`/hitoDS` is still the correct reference surface, but the visual grammar has drifted:

- The page has a stable section topology through `NAV_GROUPS`, but section bodies vary too much.
- Some playgrounds use a shared specimen shell, while the calendar/workout playground and several
  component examples use route-local structures.
- The current modal/dialog playground screenshot shows the main failure clearly: a large framed
  preview, framed content inside the preview, a separate framed controls panel, and more framed
  rows below. The result reads as card soup rather than a calm Hito workbench.
- Controls, preview, captions, and supporting contracts do not always occupy the same relative
  positions across sections.
- Explanatory paragraphs compete with the actual visual specimens. The page often explains instead
  of demonstrating.
- Footer/caption patterns are inconsistent: some sections use contracts, some use captions, some use
  paragraphs, and some use nested helper rows.
- Foundations, Components, Patterns, playgrounds, and any Live View/equivalent section can feel like
  separate pages because the side layout, section rhythm, and specimen anatomy jump.

Selected playground model:

Use one consistent `/hitoDS` playground anatomy:

1. Section header:
   - section label
   - title
   - one concise purpose sentence
   - optional small status pill only when it adds operational meaning, such as `Specimen only`
2. Playground shell:
   - one low-chrome workbench row/grid
   - no nested dashboard cards
   - no framed panel stack unless the component being demonstrated is itself a panel
3. Preview/stage:
   - desktop: left side
   - owns the visual specimen
   - should look like the real product/component context, not a decorative fake card
4. Controls:
   - desktop: right side
   - always reachable
   - use Hito DS fields, choice toggles, buttons, icon buttons, menus, disclosures, and status pills
   - no route-local dropdown/input/button styling
5. Footer/caption:
   - one shared row below the playground shell
   - explains what the specimen proves and what it does not imply
   - replaces long prose and repeated local contract cards

Controls and preview placement:

- Desktop default: preview/stage left, controls right.
- Reason: `/hitoDS` should first show the visual result, then expose controls as a workbench rail.
- Controls may be sticky inside the section only if the current shell already supports it without
  layout jump. Sticky behavior is optional, not a v1 requirement.
- Intermediate widths may stack controls above preview only when a two-column layout would compress
  the preview below useful fidelity.
- Mobile/narrow default:
  - section header
  - compact controls
  - preview
  - caption/footer
- Mobile controls can use a disclosure if there are many controls, but they must not be hover-only
  or hidden behind unclear icons.
- The preview must never force a cramped desktop 7-column grid when the content cannot fit. Calendar
  specimens should switch to their mobile/list anatomy instead.

Surface and border rules:

- Bordered cards are rare.
- Nested bordered cards are exceptional.
- A playground may use at most one outer boundary when a boundary is needed for grouping.
- Preview/stage surfaces should usually be open:
  - light neutral stage
  - dark neutral stage when demonstrating dark/overlay behavior
  - subtle wash only when contrast is required
  - divider-only separation when enough
- A border is allowed when:
  - the demonstrated component owns a border
  - the stage needs a minimum boundary to separate from the page background
  - a table/dialog/shell specimen requires an actual bounded context
- A border is not allowed just to make every row or helper note feel like a card.
- Cards are allowed only when demonstrating card/surface behavior or when a real product component
  is card-shaped.
- Component galleries should prefer open grids, rows, dividers, and spacing over boxed tiles.
- Dense examples should use row grouping and section dividers instead of wrapping each option in its
  own framed card.

Typography and text reduction rules:

- Each section gets one concise intro. Avoid repeating the same product philosophy in every section.
- Playground explanatory copy should be reduced to visual proof plus small captions.
- `Use for` / `Do not use for` should become compact caption/footer content, paired rows, or small
  disclosure content, not large bordered blocks.
- Status copy should stay small and operational:
  - `Specimen only`
  - `Static display`
  - `Reference`
- Do not overuse uppercase labels. Use existing Hito type roles and quiet support text.
- If a state is visible in the preview, do not repeat it in a paragraph unless the boundary is
  important, such as "visual only, not shipped CRUD."

Footer/caption rules:

- Every playground should use one shared footer/caption location below the preview/control shell.
- Recommended content shape:
  - `Proves:` one short phrase
  - `Does not imply:` one short phrase
  - optional `Used in:` only when source ownership matters
- The caption/footer should use existing Hito caption/list-row copy roles.
- Do not create a second footer inside the preview unless the previewed component itself has a
  footer, such as a dialog.
- Do not place the caption in a large card. Use divider, spacing, or a quiet row group.

Navigation and sidebar stability rules:

- Keep `NAV_GROUPS` as the source of section topology.
- Do not invent a new `/hitoDS` nav framework or taxonomy in this slice.
- Preserve the current parent/child nested model:
  `Overview`, `Foundations`, `Components`, `Patterns`, and `Backlog` or future `Specs` only if a
  later naming slice explicitly approves it.
- Sidebar width, content left edge, active parent/child state, and jump-menu behavior should remain
  stable when moving between Foundations, Components, Patterns, playgrounds, and Live View/equivalent
  sections.
- Active child state must be visible without creating a second separate subsection rail.
- Deep links such as `/hitoDS#calendar-workout-playground` must continue to scroll to the section
  and activate the correct group/child.
- The section layout must not jump because one group uses a different header/sidebar/footer pattern.

Implementation priorities:

1. Normalize shared `/hitoDS` playground/specimen anatomy and class names first.
2. Apply it to the highest-drift playgrounds:
   - calendar/workout playground
   - modal/dialog playground
   - one dense component playground such as inputs/buttons or async toasts
3. Reduce explanatory text and convert repeated contract cards into the shared caption/footer.
4. Replace nested framed wrappers with open preview stages, dividers, or row groups.
5. Verify the nested sidebar and mobile jump behavior remains stable across groups.
6. After the first slice proves the grammar, continue section-by-section through Foundations,
   Components, Patterns, and any Live View/equivalent section.

First frontend slice:

FRONTEND should implement the smallest useful proof slice:

- Create or normalize shared `/hitoDS`-only playground anatomy using existing Hito DS primitives.
- Keep the implementation small: a helper component and/or CSS classes are acceptable if they delete
  repeated local structure, but do not create a new UI kit.
- Migrate:
  - calendar/workout playground
  - modal/dialog playground
  - one dense component playground
- Preserve anchors, state controls, accessibility states, and existing component examples.
- Do not touch product surfaces outside `/hitoDS`.

Acceptance criteria:

- `/hitoDS` playgrounds read as one workbench, not separate demo apps.
- Preview/stage and controls use the same relative placement across playground sections.
- The calendar/workout playground no longer reads as nested specimen cards.
- The modal/dialog playground no longer presents a large fake card stack as the normal modal
  reference.
- Captions/footers use one shared pattern.
- Explanatory text is shorter and visual examples are more prominent.
- Borders are purposeful and minimal.
- Section/sidebar layout does not jump between Foundations, Components, Patterns, playgrounds, and
  Live View/equivalent sections.
- Desktop, intermediate width, and 375px mobile render without horizontal overflow.
- Deep links and active nested navigation continue to work.
- Product components outside `/hitoDS` are unchanged.

What not to touch:

- Do not redesign product pages.
- Do not change product component behavior outside `/hitoDS`.
- Do not change backend/product data.
- Do not remove accessibility/focus/disabled/error examples.
- Do not add custom local controls where Hito DS controls already exist.
- Do not introduce a separate playground framework.
- Do not imply visual-only manual-workout or future authoring states are shipped behavior.

Implementation closeout:

- Added shared `HitoDsPlayground` anatomy.
- Applied it to calendar/workout, modal/dialog, and async toast playgrounds.
- Shared anatomy owns section header, neutral preview/stage, controls area, and footer/caption rows.
- Desktop uses preview/stage left and controls right.
- Mobile uses controls before preview where appropriate.
- Caption rows use `Proves`, `Does not imply`, and `Used in`.
- Borders were reduced to purposeful component chrome only.
- `NAV_GROUPS`, section IDs, deep links, and active parent/child state were preserved.

QA evidence:

- Browser Path Preflight: built-in Codex browser was used first against
  `http://localhost:8082/hitoDS`.
- Safari fallback was not used.
- Targeted ESLint passed.
- `git diff --check` passed.
- `npm run build` passed.
- Calendar/workout, modals, and async-actions all use shared `HitoDsPlayground` anatomy.
- DOM proof confirmed shared labels `Proves`, `Does not imply`, and `Used in`.
- Modal controls and async toast interactions worked.
- `#calendar-workout-playground` expands `Patterns` and marks `Calendar` active with
  `aria-current="location"`.
- Mobile `375px` proof showed no horizontal overflow.
- QA artifacts were saved under
  `qa-artifacts/screenshots/2026-06-08/hito-ds-playground-anatomy-qa/`.

Design evidence:

- Touched playgrounds now feel like one Hito DS workbench rather than unrelated demo-card surfaces.
- Low-chrome stage removes card-inside-card feeling.
- Captions replace long explanatory blocks.
- Calendar, Modals, and Async toasts share anatomy while preserving context.
- No design blockers remain.

Technical hygiene note:

- QA/design notes mentioned hydration mismatch console errors around `/hitoDS` active nav/SSR state.
  This is a non-blocking technical hygiene issue for a later focused frontend cleanup or QA
  regression slice. It did not block Slice 3D design acceptance or QA pass.

Closeout decision:

Slice 3D is complete for the shared playground anatomy proof slice. Further `/hitoDS` section-by-
section normalization can continue later if new drift appears, but it is not the next active gate.

### Slice 4: Watch-Required Onboarding Contract And Preset Hierarchy

Owner:

BACKEND first, then FRONTEND after backend contract QA.

Status:

Implemented and QA-passed on 2026-06-08.

Designer closeout:

The Plan Preset onboarding redesign direction is accepted:

- Presets are the primary fast path.
- Advanced custom is secondary.
- Option B is selected: basic setup at the top, Plan Preset cards immediately below, and Advanced
  custom as a secondary disclosure/button below cards.
- Primary setup fields are age, height, weight, running level, and available running days per week.
- Distance is selected through cards, not through the primary setup form.
- Guidance style, target date/time, detailed comments, injury/caution, and unusual constraints move
  to Advanced custom.
- Preset cards should be bold hero cards with strong distance identity and backend-shaped
  summary/date/workout-mix/metric/fit data.

Product/system decision:

Hito no longer supports "without watch/app" as a normal new-plan product option.

This is a product/system contract change, not merely a hidden UI default:

- remove user-facing watch ownership choice from primary Plan Preset onboarding
- remove "no watch/app" as a selectable new-plan option
- assume every supported new-plan creation flow has a watch/app execution surface
- keep watch/app execution server-owned for Plan Presets and Advanced custom creation
- keep metric truth separate from execution-surface truth

Pre-implementation source audit findings:

- [Plan Preset schema](../../../src/lib/plan-presets/schema.ts) previously included
  `missing_watch_app_support` as a preset reason code.
- [Plan Preset resolver](../../../src/lib/plan-presets/resolver.ts) previously computed
  `missingWatchSupport` from `execution.watchAccess !== "watch_or_app"` and disables cards when
  watch/app support is absent.
- [First-plan authoring utils](../../../src/lib/first-plan-authoring-utils.ts) keep
  `FIRST_PLAN_WATCH_ACCESS_VALUES = ["none", "watch_or_app", "unknown"]` for legacy/readback
  compatibility, and previously used `watchAccess: "unknown"` as the new-plan default.
- [Structured first-plan onboarding](../../../src/lib/structured-first-plan-onboarding.ts) previously
  accepts optional `execution.watchAccess` and formats review copy for watch/app, no watch/app, or
  unknown access.
- [Onboarding form model](../../../src/components/onboarding/onboarding-form-model.ts) previously
  exposes `WATCH_ACCESS_OPTIONS`, including `Not sure yet`, `Watch or app`, and `No watch/app`.
- [Structured plan constructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx)
  previously rendered a `Target tools` section and a `Guidance style` section in primary setup.
- [Archived watch-executable contract](../archive/2026-06-04-watch-executable-workout-targets-and-metric-truth-contract.md)
  already established that `none`, `unknown`, and `effort_only` should not be normal primary
  structured output, while legacy rows remain readable.

Watch-required contract:

- Primary Plan Preset onboarding must not ask whether the runner has a watch or app.
- Supported new-plan creation must assume `watch_or_app` before preset eligibility and metric-mode
  resolution.
- Plan Preset eligibility must not return `missing_watch_app_support` or require
  `execution.watchAccess` as a missing field in the normal redesigned primary setup.
- Advanced custom may expose guidance/style, target date/time, comments, and caution context, but it
  must not expose a "without watch/app" option.
- Backend-owned metric truth remains strict:
  watch/app support does not create pace truth without backend-approved benchmark/provider truth.
  watch/app support does not create executable HR truth without personal HR-zone truth.
  target time alone is not pace truth.
  age-estimated HR remains advisory/readback-only.
  `structure_only_executable` remains valid when pace/HR truth is unavailable.

Legacy compatibility decision:

- Keep old `none`, `unknown`, and `effort_only` values readable for imported plans, persisted old
  authoring snapshots, diagnostics, and historical QA fixtures.
- Do not present `none` or `unknown` as selectable new-plan options.
- Do not delete legacy readback compatibility in this slice.
- If a stale caller submits explicit `none` or `unknown` into a current supported new-plan creation
  action, backend must handle it boundedly without restoring a no-watch product path. The preferred
  implementation is to normalize the supported new-plan boundary to server-owned `watch_or_app` and
  record review/metric-policy copy that Hito assumes watch/app execution; if source audit proves
  explicit rejection is safer for one legacy seam, document that exception and keep it out of
  primary onboarding.

Backend scope:

- update execution-mode normalization/defaults for supported new-plan creation
- update Plan Preset eligibility/card resolver so watch/app support is assumed and not a card
  blocker
- remove or demote `missing_watch_app_support` from new Plan Preset card behavior
- preserve preset review/confirm/persistence exactness and `plan_preset_v1` metadata
- preserve Advanced custom blueprint boundary and `ai_first_plan_blueprint_v1` behavior
- keep legacy/import/readback parsers compatible enough for old saved rows and diagnostics
- add fixtures proving the new contract

Frontend follow-up scope after backend QA:

- remove the primary `Target tools` section from setup
- move `Guidance style`, target date/time, comments, injury/caution, and unusual constraints into
  Advanced custom
- make distance selection card-driven for Plan Presets
- render backend-shaped card state, summary/date/mix/metric/fit truth only
- do not compute eligibility, duration, metric truth, or workout mix locally
- do not add 5K as a shipped preset card unless backend support exists first

What not to touch:

- do not weaken pace or HR gates
- do not infer pace from watch/app presence alone
- do not infer personal HR from age/height/weight/watch presence
- do not remove legacy readback compatibility
- do not touch Plan Preset confirm/persistence behavior
- do not touch manual workout CRUD
- do not add new preset families
- do not add DB/schema changes
- do not create a new visual system outside Hito DS

Validation expectations:

- targeted ESLint for changed backend/frontend files
- Plan Preset harness proving 10K, Half Marathon, and Marathon cards remain available when primary
  setup omits execution support
- Plan Preset review draft harness proving no-benchmark presets remain `structure_only_executable`
  with no fake pace/HR
- metric fixture proving recent 5K truth can still unlock backend-gated pace where appropriate
- structured custom/blueprint smoke proving Advanced custom remains separate and
  `ai_first_plan_blueprint_v1` remains the custom production default
- source proof that no frontend primary setup option still says `No watch/app`, `Not sure yet`, or
  equivalent no-watch selection
- `git diff --check`
- `npm run build`

Implementation note, 2026-06-08:

- Added a supported-new-plan execution normalizer that keeps legacy `none`/`unknown` readable while
  normalizing Plan Preset and structured first-plan creation to server-owned `watch_or_app`.
- Removed `missing_watch_app_support` from the Plan Preset runtime reason-code contract and
  eligibility blocker.
- Updated Plan Preset and first-plan release-gate fixtures so stale omitted/`unknown`/`none`
  execution input proves watch/app normalization instead of correction.
- Removed the primary onboarding `Target tools` selectable options as the direct UI contract cleanup;
  broader preset-first hierarchy redesign remains frontend follow-up.
- Validation evidence is recorded in the Slice 4 backend closeout report for this run.

QA closeout evidence:

- Browser Path Preflight: built-in Codex browser was used first against `localhost:8082`.
- Safari fallback was not used.
- Targeted ESLint passed.
- Plan Preset harness passed.
- Doctrine validator passed.
- Blueprint smoke passed.
- `npm run validate-admin-capture-backlog` passed.
- `git diff --check` passed.
- `npm run build` passed.
- Backend normalization forces `watch_or_app` for supported new-plan creation.
- Omitted, stale `unknown`, and stale `none` watch inputs do not block eligible Plan Preset cards.
- `missing_watch_app_support` is absent from the Plan Preset runtime contract.
- Pace truth still requires benchmark truth.
- HR executable targets remain unavailable without personal HR-zone truth.
- Age-estimated HR remains advisory.
- Target time without benchmark routes to Advanced custom instead of unlocking pace.
- Legacy values remain readable but not selectable.
- Primary onboarding UI no longer shows `Target tools`, `No watch/app`, `Not sure yet`, watch
  ownership, or HR monitor ownership.
- Preset cards render.
- Review scaffold opens.
- `Create preset plan` appears but was not clicked by scope.
- `375px` mobile proof showed no horizontal overflow.
- QA artifacts were saved under
  `qa-artifacts/screenshots/2026-06-08/watch-required-onboarding-contract-qa/`.

Closeout decision:

Slice 4 is complete for the accepted watch-required contract. The remaining onboarding work is visual
hierarchy and interaction architecture, not backend watch eligibility. Keep metric-truth gates,
legacy readback compatibility, and Plan Preset confirm/persistence boundaries unchanged.

### Slice 5: Progressive Plan Preset Cards And Post-Selection Preference Refinement

Owner:

BACKEND first, then FRONTEND after backend contract QA.

Status:

Backend Slice 5A is implemented and QA-passed on 2026-06-08. Frontend Slice 5B is implemented and
QA-passed on 2026-06-08. Backend Slice 5C is selected as the next bounded cleanup slice for
no-behavior-change progressive Plan Preset policy decomposition.

Reason:

The watch-required backend contract is ready, but the next product issue is not only visual
hierarchy. The user clarified that Plan Preset cards should appear early, before every scheduling
preference is known, so the runner first sees clear plan choices rather than a form filter.

Current runtime still treats card loading as dependent on a fully structured setup-shaped input.
That makes incomplete setup feel like a hard gate even when the correct product state is "show the
cards, then refine preferences after selection."

Source inspection findings:

- [Plan Preset schema](../../../src/lib/plan-presets/schema.ts) currently aliases
  `planPresetEligibilityInputSchema` to the full structured first-plan onboarding schema.
- [Plan Preset schema](../../../src/lib/plan-presets/schema.ts) already includes
  `needs_more_info`, but [Plan Preset resolver](../../../src/lib/plan-presets/resolver.ts)
  mostly returns `recommended`, `available`, `custom_fit`, or `unavailable`.
- [Onboarding gate](../../../src/components/OnboardingGate.tsx) gates card loading through
  `isPresetPrimarySetupReady`.
- [Onboarding form model](../../../src/components/onboarding/onboarding-form-model.ts) currently
  makes preset basics require age, height, weight, and running days/week.
- [Onboarding gate](../../../src/components/OnboardingGate.tsx) uses
  `buildPlanPresetStructuredInput`, which still builds a full structured input and resets advanced
  preferences for the preset path.
- [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx) allows review only for
  `recommended` and `available`, so `needs_more_info` requires an explicit post-selection
  refinement decision.

Progressive card model decision:

- The minimum input to show cards is basic profile plus running level. Weekly running days may be
  unknown initially if backend can return safe defaults.
- Shipped preset families stay visible by default:
  `10K Foundation`, `Half Marathon Balanced`, and `Marathon Base`.
- `unavailable` is reserved for true hard blockers, not incomplete setup.
- Incomplete setup maps to `needs_more_info` or an equivalent backend-shaped soft state.
- Running level influences recommendation strength and activation. It should not hide shipped cards
  unless the runner's data clearly makes a card unsafe or inappropriate.
- Weekly running days support three levels of truth:
  backend default suggestion before user input, user-selected available days, and backend-selected
  optimal rhythm when still unknown.
- Long-run day and fixed-rest preferences move to post-selection refinement when needed.
- Review draft becomes the boundary where missing preferences must be resolved before confirm.
- Confirm/persistence remains unchanged.
- Metric truth remains unchanged:
  no fake pace from watch/app presence, no executable HR without personal HR-zone truth, and
  `structure_only_executable` remains valid when pace/HR truth is missing.

Backend ownership:

- partial eligibility/card input contract
- card state and recommendation truth
- hard blocker vs soft signal decisions
- default weekly rhythm suggestion
- post-selection preference questions/options
- start/end date and duration summaries
- metric honesty and level-fit copy
- review draft exactness
- confirm metadata for selected card, resolved rhythm, rest/long-run preferences, summary fields,
  and metric policy

Frontend ownership:

- render all backend-returned cards early
- show recommendation, needs-preferences, and inactive states from backend view models
- collect post-selection preferences
- request backend recomputation/review when preferences change
- render backend-shaped review and confirm states
- never own schedule generation, eligibility computation, date math, metric truth, workout
  templates, recipe rows, or persistence rules

Post-selection preference refinement decision:

- Selecting a card before all preferences are known should not immediately fail.
- If the selected card needs more preference truth, the backend should return required refinement
  prompts/options for weekly running days, long-run day, fixed rest days, or safe rhythm defaults.
- Frontend should render those backend-shaped questions and resubmit for review.
- A review draft token/checksum should only be issued after the selected preset has enough resolved
  preference truth to expand exact canonical `training-plan-v2` rows.
- Confirm remains the same explicit mutation boundary and must not accept unresolved preference state.

Running Coach matrix normalization:

The Running Coach scenario matrix is accepted as coaching foundation, but BACKEND must implement the
normalized product contract below instead of copying coaching synonyms directly. The outdated
"no watch/app truth -> correction required" row is explicitly rejected for new-plan creation because
Slice 4 made watch/app execution a supported product assumption. Legacy no-watch/unknown values
remain readable only; they are not selectable new-plan card inputs.

Canonical card-state enum proposal:

| State | Backend meaning | Allowed next action |
| --- | --- | --- |
| `recommended` | Best current fit from known inputs and shipped recipe support. | Open review if preference truth is resolved; otherwise open refinement first. |
| `available` | Safe shipped option, not the strongest recommendation. | Open review if resolved; otherwise open refinement first. |
| `needs_more_info` | Visible card that needs backend-declared preference/refinement answers before review. | Open refinement, not review token issuance. |
| `not_ideal` | Selectable but de-emphasized because known inputs make it less suitable without making it unsafe. | Open refinement/review with warning copy from backend. |
| `custom_fit` | Visible card state indicating Advanced custom is the better route for this setup. | Route to Advanced custom; no preset review token. |
| `unavailable` | True hard blocker for the preset family. | No preset review; show backend reason. |

Canonical reason-code proposal:

| Reason code | Category | Meaning |
| --- | --- | --- |
| `missing_minimum_profile` | soft | Age/weight and/or height are missing or invalid before reliable card summaries can be shaped. |
| `missing_running_level` | soft | Running level is missing; cards stay visible but cannot be recommended. |
| `missing_weekly_days` | soft | Weekly running days are unknown; backend may show default rhythm suggestions and require refinement before review. |
| `needs_rest_day_preferences` | soft | Fixed rest days are optional but useful before exact review expansion. |
| `needs_long_run_preference` | soft | Long-run day is optional but useful before exact review expansion. |
| `level_too_low_for_family` | hard or not-ideal | Known level makes the family unsafe/inappropriate or less ideal. |
| `insufficient_availability` | hard | Explicit weekly days are below the family minimum. |
| `excess_availability_for_recipe` | soft | Explicit weekly days exceed v1 recipe range; backend can cap or ask refinement if safe. |
| `fixed_rest_conflict` | hard | Explicit rest days leave too few available run days or conflict with selected rhythm. |
| `long_run_conflict` | hard | Preferred long-run day is explicitly blocked or impossible for selected rhythm. |
| `target_date_present` | custom | Target-date plans use Advanced custom in preset v1. |
| `target_time_present` | custom | Target-time plans use Advanced custom in preset v1. |
| `material_comment_present` | custom | Detailed comments/unusual constraints route to Advanced custom. |
| `injury_or_pain_signal` | custom | Injury, pain, rehab, or caution signals route to Advanced custom. |
| `workout_type_removal_request` | custom | Requests to remove/ban key workout types route to Advanced custom or later manual editing. |
| `metric_truth_insufficient_for_target` | custom | Target specificity requires benchmark/provider truth; target-time preset is not unlocked. |
| `recipe_not_available` | hard | Shipped v1 recipe cannot safely support the known combination. |

Backend-ready scenario matrix:

| Input stage / scenario | 10K Foundation | Half Marathon Balanced | Marathon Base | Reason codes | Follow-up requirements | Default rhythm suggestion | Next allowed action |
| --- | --- | --- | --- | --- | --- | --- | --- |
| No minimum profile | `needs_more_info` | `needs_more_info` | `needs_more_info` | `missing_minimum_profile` | age, weight, height, running level | none until profile valid | collect basics |
| Age + weight only | `needs_more_info` | `needs_more_info` | `needs_more_info` | `missing_minimum_profile`, `missing_running_level` | height and running level | none until profile valid | collect basics |
| Age + weight + height, level missing | `needs_more_info` | `needs_more_info` | `needs_more_info` | `missing_running_level` | running level | neutral preview only | collect level |
| New to running | `recommended` or `needs_more_info` if weekly rhythm unknown | `not_ideal` | `unavailable` | `missing_weekly_days`, `level_too_low_for_family` | weekly days before review; rest/long-run optional | 3 days/week, conservative run/walk rhythm | 10K refinement; Half de-emphasized; Marathon blocked |
| Beginner | `recommended` or `needs_more_info` if weekly rhythm unknown | `not_ideal` until enough days/base truth | `unavailable` | `missing_weekly_days`, `level_too_low_for_family` | weekly days before review; rest/long-run optional | 3-4 days/week, foundation rhythm | 10K refinement; Half refinement if days/base support; Marathon blocked |
| Running/recreational | `available` | `recommended` or `needs_more_info` if weekly rhythm unknown | `not_ideal` unless 5 days/week or benchmark/base support | `missing_weekly_days`, `level_too_low_for_family` when applicable | weekly days before review; long-run preference optional | 4 days/week; long run weekend fallback | 10K/Half refinement; Marathon refinement only if support exists |
| Experienced/performance | `available` | `recommended` | `available` or `recommended` when availability supports it | `missing_weekly_days` if unknown | weekly days before review; long-run preference optional | 4-5 days/week depending family | refinement/review for all supported families |
| Weekly days unknown after minimum profile | `needs_more_info` | `needs_more_info` | `needs_more_info` | `missing_weekly_days` | choose days/week or accept backend suggested rhythm | 10K 3, Half 4, Marathon 5 if level supports | open refinement, not review token |
| 1 day/week explicit | `unavailable` | `unavailable` | `unavailable` | `insufficient_availability` | none for preset v1 | none | route to Advanced custom or future restart path |
| 2 days/week explicit | `not_ideal` or `unavailable` by level | `unavailable` | `unavailable` | `insufficient_availability` | none if hard blocked; otherwise warning review only if recipe supports | 2-day foundation only if backend approves; otherwise none | 10K only if safe; otherwise Advanced custom |
| 3 days/week explicit | `recommended` for beginner/foundation | `not_ideal` or `unavailable` by level/base support | `unavailable` | `level_too_low_for_family`, `insufficient_availability` | optional rest/long-run preference | 3-day foundation | 10K review/refinement; Half only if safe; Marathon blocked |
| 4 days/week explicit | `available` | `recommended` | `not_ideal` by level/base support | `level_too_low_for_family` when applicable | optional rest/long-run preference | 4-day balanced rhythm | 10K/Half review/refinement; Marathon warning/refinement if safe |
| 5 days/week explicit | `available` | `available` | `recommended` for experienced/performance or supported recreational | none or `level_too_low_for_family` | optional rest/long-run preference | 5-day marathon/base rhythm | review/refinement for supported families |
| Fixed rest days leave too few open days | `unavailable` | `unavailable` | `unavailable` | `fixed_rest_conflict` | change rest days or weekly days | none | refinement only, no review token |
| Preferred long-run day is blocked | `needs_more_info` | `needs_more_info` | `needs_more_info` | `long_run_conflict` | choose another long-run day or remove fixed-rest conflict | nearest safe weekend/latest-available fallback | refinement only, no review token |
| No fixed rest day preference | `available` or current family state | current family state | current family state | none | optional rest-day preference | backend chooses rest days from safe rhythm | review can proceed if weekly days resolved |
| No long-run day preference | current family state | current family state | current family state | none | optional long-run preference | Sunday, then Saturday, then latest safe available weekday | review can proceed if weekly days resolved |
| Target date present | `custom_fit` | `custom_fit` | `custom_fit` | `target_date_present` | none for preset v1 | none | Advanced custom |
| Target time present | `custom_fit` | `custom_fit` | `custom_fit` | `target_time_present`, optional `metric_truth_insufficient_for_target` | none for preset v1 | none | Advanced custom |
| Material comment/unusual constraint | `custom_fit` | `custom_fit` | `custom_fit` | `material_comment_present` | none for preset v1 | none | Advanced custom |
| Injury/pain/caution signal | `custom_fit` | `custom_fit` | `custom_fit` | `injury_or_pain_signal` | none for preset v1 | none | Advanced custom |
| Benchmark missing | current family state | current family state | current family state | none | none unless target-time/custom route requested | structure-only executable metric mode | review can proceed without pace/HR targets |
| Recent 5K benchmark present | current family state | current family state | current family state | none | none | pace-capable only when backend metric gates allow | review can include broad pace targets where allowed |
| Workout-type removal request | `custom_fit` | `custom_fit` | `custom_fit` | `workout_type_removal_request` | none for preset v1 | none | Advanced custom or future manual editing |
| No watch/app truth | current family state | current family state | current family state | none | none | watch/app assumed for supported new-plan creation | do not block; keep metric gates strict |

Post-selection preference contract:

| Selected family | Required before review token | Optional before review | Backend default/floating behavior | Review readiness |
| --- | --- | --- | --- | --- |
| `10K Foundation` | valid profile, running level, weekly days that satisfy recipe minimum, no hard blockers | fixed rest days, long-run day | suggest 3 days/week when unknown; choose safe rest days; long-run fallback Sunday/Saturday/latest available | issue review token only after weekly days are resolved |
| `Half Marathon Balanced` | valid profile, running level/base support, weekly days that satisfy recipe minimum, no hard blockers | fixed rest days, long-run day, benchmark | suggest 4 days/week when unknown; long run weekend fallback; structure-only if no benchmark | issue review token only after weekly days/base support are resolved |
| `Marathon Base` | valid profile, level/base support, explicit or backend-accepted 4-5 day rhythm, no hard blockers | fixed rest days, long-run day, benchmark | suggest 5 days/week for supported runners; conservative long-run fallback; no target-time specificity | issue review token only after marathon support and rhythm are resolved |

Review/confirm metadata preservation:

- selected `cardId`, recipe id, recipe version, source kind `plan_preset_v1`, and
  `preset_recipe_expanded`
- normalized input stage and resolved follow-up answers
- resolved running days/week, fixed rest days, preferred or backend-selected long-run day, and
  default rhythm source
- duration weeks, start date, estimated end date, program family, workout mix, key workout types,
  why-this-fits copy, level-fit copy, and metric mode summary
- reason codes shown before review and whether they were resolved, accepted as warning, or routed to
  Advanced custom
- metric truth summary: benchmark source, pace permission, HR permission, advisory/default HR state,
  and `structure_only_executable` vs pace-capable mode
- row counts and canonical draft checksum/token metadata

Backend Slice 5A scope:

- Add or refactor a backend-owned partial Plan Preset card input contract.
- Return visible cards for the three shipped preset families before all preferences are complete.
- Use `needs_more_info` or equivalent soft state for incomplete preference requirements.
- Preserve current review/confirm behavior for fully resolved inputs.
- Add backend-shaped post-selection preference requirements for weekly running days, long-run day,
  and rest-day preferences.
- Preserve exact draft expansion and persistence when preferences are resolved.
- Keep `getPlanPresetCards`, `reviewPlanPresetDraft`, and `confirmPlanPresetDraft` behavior stable
  where possible; if additive contract changes are required, document them precisely.
- Do not add frontend implementation in this slice.

Implementation note, 2026-06-08:

- Added `planPresetCardInputSchema` as the partial/discovery contract for Plan Preset cards while
  keeping `planPresetEligibilityInputSchema` as the full resolved review/confirm contract.
- `getPlanPresetCards` now accepts partial card input and routes partial/discovery requests through
  `plan-presets/progressive-cards.ts`, returning visible shipped cards with `needs_more_info`,
  `not_ideal`, `custom_fit`, or `unavailable` states plus backend-shaped post-selection refinement
  requirements.
- Shared card summary fields moved to `plan-presets/card-summary.ts` so resolved and progressive
  cards do not duplicate duration/date/program-summary truth.
- `reviewPlanPresetDraft` and `confirmPlanPresetDraft` still require fully resolved input and still
  own review-token/checksum and exact row expansion boundaries.
- Harness coverage was added for partial profile, missing weekly rhythm, 2/3/4/5-day state ladder,
  fixed-rest conflict, long-run conflict, custom routing, and metric-truth preservation.

QA closeout evidence, 2026-06-08:

- Browser was not used because this was backend/source/harness validation only.
- Source inspection covered Plan Preset schema/resolver/progressive-card/action/review seams, active
  plan notes, onboarding panel readback label, and preset validation scripts.
- Targeted ESLint passed.
- `node --import tsx ./scripts/validate-plan-preset-eligibility.ts` passed.
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts` passed.
- Blueprint mock smoke passed and remained `ai_first_plan_blueprint_v1`.
- `npm run validate-admin-capture-backlog` passed.
- `git diff --check` passed.
- `npm run build` passed.
- Read-only progressive-state probe passed.
- Partial card discovery works through `planPresetCardInputSchema`.
- Empty/missing setup returns `needs_more_info`.
- One-day availability returns `unavailable`.
- 2/3/4/5-day scenarios produce bounded `not_ideal`, `available`, or `recommended`.
- Progressive cards remain non-mutating with `sourceKind: plan_preset_v1`, `persisted: false`, and
  safety flags.
- Progressive recommended/available cards do not become review-ready until post-selection
  preferences are provided.
- Required refinement fields include goal distance/style/terrain and preferred long-run day, with
  additional benchmark/fitness refinement where needed.
- Partial card input cannot reach review draft expansion.
- `reviewPlanPresetDraft` and `confirmPlanPresetDraft` still require full schemas,
  token/checksum path, and server-owned canonical rebuild.
- No-benchmark and stale no-watch inputs remain `structure_only_executable`.
- Benchmark plus recent 5K can still become `pace_executable`.
- Target time alone does not unlock pace.
- HR remains non-executable/advisory without personal HR zones.
- No frontend route, DB/schema, persistence, OpenAI, confirm behavior, manual workout behavior, or
  new preset family was introduced.
- No stale first-plan-preset runtime references were found.

Maintainability follow-up:

- [Plan Preset progressive cards](../../../src/lib/plan-presets/progressive-cards.ts) is now about
  `707` lines. This is not a Slice 5A blocker, but it crosses the 700-line hotspot threshold and
  should be decomposed before adding more progressive states or new preset families.

Closeout decision:

Backend Slice 5A is complete for the progressive Plan Preset card contract. Frontend implementation
is now unblocked for rendering backend-shaped progressive states and post-selection refinement, but
it must not compute eligibility, schedule/rhythm, date, metric, recipe, review-readiness, or
persistence truth locally.

Frontend Slice 5B scope:

- implement the preset-first hierarchy and bold hero card redesign using the new backend contract
- call the progressive card endpoint with partial setup input
- render all backend-returned shipped cards early
- support states:
  `recommended`, `available`, `needs_more_info`, `not_ideal`, `custom_fit`, and `unavailable`
- show backend reason/refinement copy
- allow selecting cards that need refinement only into a refinement step, not directly into review
- collect backend-required post-selection preferences
- request backend recomputation/review after preferences are resolved
- only show review/create when backend returns review-ready/full review state
- keep Advanced custom secondary and separate
- keep review scaffold and `Create preset plan` behavior intact
- preserve unavailable CTA polish:
  no visible `Unavailable` badge, disabled CTA with tooltip reason
- preserve no hidden selected default
- preserve no `Recommended` badge if the current design decision remains to hide it
- preserve mobile `375px` no-overflow
- do not compute backend truth locally

5K decision:

- Do not show 5K as a shipped preset card because backend Plan Preset v1 supports only `10K
  Foundation`, `Half Marathon Balanced`, and `Marathon Base`.
- If Frontend needs a visual placeholder for design balance, it must be clearly unavailable or
  coming soon and must not route to review/confirm.
- Prefer keeping unimplemented cards out of the primary shipped set unless the active plan is
  explicitly widened.

What not to touch:

- do not add new preset families
- do not claim 5K shipped unless backend exists
- do not change Plan Preset persistence/confirm behavior
- do not touch manual workout CRUD
- do not add active-plan replacement/refresh
- do not weaken metric-truth gates
- do not run `--archive-stale`
- do not start broad admin cleanup in this slice
- do not convert progressive availability into a frontend-only card visibility patch

Validation expectations:

- targeted ESLint for changed frontend files in Frontend Slice 5B
- `git diff --check`
- `npm run build`
- built-in Codex browser first against local onboarding
- verify cards render from partial setup
- verify all backend states and backend reason/refinement copy render
- verify selecting `needs_more_info` or `not_ideal` cards opens refinement instead of direct review
- verify review/create appears only after backend review-ready/full review state
- verify unavailable CTA polish, no hidden selected default, no unwanted `Recommended` badge, and
  mobile `375px` no-overflow
- source proof that frontend consumes backend-shaped progressive Plan Preset data and does not
  compute eligibility/rhythm/date/metric/review truth locally

Frontend Slice 5B closeout evidence, 2026-06-08:

- Built-in Codex Browser was used first against `http://localhost:8082/`; Safari was not used.
- Targeted ESLint passed.
- `npm run validate-admin-capture-backlog` passed.
- `git diff --check` passed.
- `npm run build` passed with existing Vite/Radix/TanStack warnings.
- With only age, height, and weight entered and no weekly running days selected, all three shipped
  cards appeared:
  `10k`, `half_marathon`, and `marathon`.
- Initial state had no selected card, no hidden selected default, no review scaffold, and no
  `Create preset plan`.
- Browser exercised `needs_more_info`, `available`, and `unavailable`; source coverage accounts for
  all six backend states:
  `recommended`, `available`, `needs_more_info`, `not_ideal`, `custom_fit`, and `unavailable`.
- No visible `Recommended` badge appeared.
- Selecting unresolved `10K` opened a distinct preferences panel, not review.
- Refinement showed backend-provided reason/defaults, including `Use suggested defaults`.
- Review/create stayed hidden until required preferences were resolved.
- After resolving preferences, backend review returned a non-mutating scaffold with
  `plan_preset_v1 · persisted false`, row counts, metric policy, assumptions, and enabled
  `Create preset plan`.
- QA did not click `Create preset plan`.
- Source confirmed confirm payload includes only `cardId`, structured setup input, `reviewToken`,
  and `reviewChecksum`; no client rows/workouts are sent.
- With `1 day`, all cards became unavailable. No unavailable pill/badge appeared; CTA stayed as
  `Review preset`, had `aria-disabled="true"`, was inert, and tooltip/focus copy used
  backend-shaped reason text.
- Advanced custom remains secondary and collapsed by default.
- Frontend does not compute eligibility, recommendation, rhythm conflicts, metric policy, workout
  mix, dates, rows, persistence, OpenAI behavior, active-plan replacement, or manual workout CRUD
  locally.
- No 5K preset card shipped.
- Mobile `375px` had no horizontal overflow.
- Artifacts:
  `qa-artifacts/screenshots/2026-06-08/progressive-plan-preset-ui-qa/`.

Frontend Slice 5B closeout decision:

Frontend Slice 5B is complete for progressive Plan Preset card UI and post-selection refinement.
It proves the frontend consumes backend-shaped progressive card/review contracts and preserves the
review/confirm mutation boundary. The implementation track should not expand to new families,
manual workout CRUD, active-plan replacement, or metric-truth changes.

Legacy/stale audit findings, 2026-06-08:

- No safe delete-now candidates were found.
- No stale runtime/source hits were found for:
  `first-plan-preset`, `first_plan_preset`, `FirstPlanPreset`, `firstPlanPreset`, or
  `validate-first-plan-preset`.
- `missing_watch_app_support` appears only in docs/history/active-plan context, not runtime.
- Remaining compatibility seams are intentional and should stay:
  full structured review/confirm path for exactness, readable legacy watch/no-watch compatibility,
  and [Training API facade](../../../src/lib/training-api.ts) exports until a separate import-map
  cleanup slice.
- The main complexity is not stale code; it is concentrated progressive policy ownership.
- [Plan Preset progressive cards](../../../src/lib/plan-presets/progressive-cards.ts) is about
  `707` lines and owns context building, metric truth, hard blocks, missing info,
  fit/recommendation policy, refinement questions, and copy/reason messages.
- Later frontend decomposition candidates:
  [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx),
  [Onboarding gate](../../../src/components/OnboardingGate.tsx), and
  [Structured plan constructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx).

Delete-now decision:

There are no approved delete-now candidates after the legacy/stale audit. Cleanup should proceed by
no-behavior-change decomposition of the progressive backend policy seam, not by deleting
compatibility or review/confirm paths.

Backend Slice 5C scope:

- Slice name:
  `Backend Slice 5C: no-behavior-change progressive Plan Preset policy decomposition`.
- Immediate owner:
  BACKEND.
- Extract policy/metric/refinement ownership from
  [Plan Preset progressive cards](../../../src/lib/plan-presets/progressive-cards.ts).
- Preserve exact card states:
  `recommended`, `available`, `needs_more_info`, `not_ideal`, `custom_fit`, and `unavailable`.
- Preserve exact reason codes, result codes, review readiness, required/optional refinement fields,
  default summaries, metric truth, recommendation behavior, row counts, source metadata, and
  harness behavior.
- Keep `resolvePlanPresetCards(...)`, `reviewPlanPresetDraft`, and `confirmPlanPresetDraft`
  behavior stable.
- Keep the full structured review/confirm path intact for exactness.
- Keep legacy watch/no-watch readback/input compatibility where it is intentionally normalized to
  supported watch/app behavior.
- Keep [Training API facade](../../../src/lib/training-api.ts) cleanup for Slice 8.
- Add or adjust harness assertions proving output preservation.
- Document what remains recipe-specific versus shared progressive card policy.

Backend Slice 5C out of scope:

- frontend decomposition
- UX behavior changes
- new preset families
- 5K
- confirm/persistence changes
- DB/schema changes
- OpenAI behavior
- manual workout CRUD
- active-plan replacement/refresh
- metric-truth weakening

Backend Slice 5C implementation note, 2026-06-08:

- Decomposed progressive Plan Preset policy ownership without behavior changes.
- [Plan Preset progressive cards](../../../src/lib/plan-presets/progressive-cards.ts) remains the
  card orchestration/view-model facade.
- [Progressive Plan Preset context](../../../src/lib/plan-presets/progressive-context.ts) owns
  partial setup normalization for progressive card resolution.
- [Progressive Plan Preset metric truth](../../../src/lib/plan-presets/progressive-metric-truth.ts)
  owns `pace_executable` versus `structure_only_executable` gating for progressive cards.
- [Progressive Plan Preset policy](../../../src/lib/plan-presets/progressive-policy.ts) owns custom
  routing, blockers, missing-info reasons, fit/recommendation policy, and refinement requirements.
- Recipe-specific rows, review/confirm persistence, source metadata, and metric truth semantics were
  preserved.

### Slice 6: Rich Adaptive Plan Preset Training-Quality Reset

Owner:

ARCHITECT / RUNNING COACH / BACKEND.

Status:

Plan Preset program source-of-truth artifacts are QA-passed on 2026-06-08, and local Backend Slice 6
work now consumes those artifacts in backend card/review expansion. Architect audit found this is not
yet sufficient as the final deterministic algorithmic builder: the current source-of-truth still
lacks phase, weekly-slot, identity-placement, segment-parameter, progression-math, and target-time
doctrine contracts. Slice 6A is selected for source-of-truth gap closure before treating Backend
Slice 6 implementation as final.

Scope correction:

- The Plan Preset quality issue applies to all shipped Plan Preset families unless proven otherwise:
  `10K Foundation`, `Half Marathon Balanced`, and `Marathon Base`.
- Do not frame the quality failure as a 10K-only fix.
- The exported `10K Foundation` rejection is evidence of the broader risk: plans can be safe while
  still being too empty, support-heavy, template-like, and missing event-specific progression.
- Existing fixed-duration fixtures for 10/12/16 weeks can remain regression references only until
  the rich adaptive rebuild replaces them.
- Existing 10/12/16 week fixture preservation must not remain the product target.
- All shipped Plan Preset families require rich adaptive rebuild before more preset families are
  added or current preset quality is treated as acceptable.

Dynamic duration decision:

Plan Preset duration must become backend-owned, dynamic, and explainable from:

- distance/family
- runner level
- weekly running days
- age
- height
- weight
- body-size/load context
- recent consistency or benchmark if available
- optional fixed rest-day and long-run constraints
- workout-type removal or unusual constraints, which may route to Advanced custom rather than preset
  v1

Rules:

- Low weekly availability should extend duration where safe rather than forcing thin fixed-week
  plans.
- Higher load-risk context should slow progression, lower intensity density, add cutback/recovery,
  or extend duration.
- Lower load-risk context may allow normal progression, but must not create unsafe aggressive jumps.
- Fixed 10/12/16 weeks are no longer sufficient as the product model.
- Duration must be returned in backend-owned card and review summaries with a concise explanation of
  why that duration fits.
- Frontend must render the returned duration/start/end/fit summary and must not calculate duration
  locally.

Program source-of-truth artifacts:

- [Plan Preset program source of truth](../../../src/lib/plan-presets/preset-program-source-of-truth.md)
- [Plan Preset scenario matrix](../../../src/lib/plan-presets/preset-program-scenario-matrix.csv)
- [Plan Preset load adjustments](../../../src/lib/plan-presets/preset-program-load-adjustments.csv)
- [Plan Preset workout identity library](../../../src/lib/plan-presets/preset-workout-identity-library.csv)
- [Plan Preset goal contract matrix](../../../src/lib/plan-presets/preset-goal-contract-matrix.csv)
- [Plan Preset phase template table](../../../src/lib/plan-presets/preset-phase-template-table.csv)
- [Plan Preset weekly archetype table](../../../src/lib/plan-presets/preset-weekly-archetype-table.csv)
- [Plan Preset identity placement rules](../../../src/lib/plan-presets/preset-identity-placement-rules.csv)
- [Plan Preset segment anatomy table](../../../src/lib/plan-presets/preset-segment-anatomy-table.csv)
- [Plan Preset progression math rules](../../../src/lib/plan-presets/preset-progression-math-rules.csv)
- [Plan Preset quality gates](../../../src/lib/plan-presets/preset-quality-gates.csv)
- [Plan Preset builder I/O contract](../../../src/lib/plan-presets/preset-builder-io-contract.csv)

Artifact QA closeout evidence, 2026-06-08:

- Browser was not used because this was source/document/artifact validation only.
- Source-of-truth markdown covers `10K Foundation`, `Half Marathon Balanced`, and `Marathon Base`.
- Coverage includes eligibility, adaptive duration, recovery/cutback, long-run/rest-day rules,
  metric truth, routing, and final outcome expectations.
- Scenario matrix parsed cleanly with `60` data rows, no ragged rows, and no empty headers.
- Scenario matrix covers all three families, runner levels, and `1`, `2`, `3`, `4`, `5` days/week.
- Each family has `20` scenario rows.
- Card states include `available`, `recommended`, `not_ideal`, and `unavailable`.
- 2-day cards are not all unavailable: `4 available`, `3 not_ideal`, and `5 unavailable`.
- Marathon remains stricter at low availability.
- Load adjustments parsed cleanly with `20` data rows.
- Load adjustment artifact uses neutral terms such as `load_context` and
  `progression_conservatism`.
- No body-shaming labels, medical claims, or injury inference from height/weight.
- Workout identity library parsed cleanly with `19` data rows.
- Workout identity library includes rich recovery, easy, strides, steady, cutback, progression,
  tempo, interval, threshold, marathon-specific, long-run, steady-finish, and taper identities.
- All workout identity rows include structured segment anatomy.
- Builder-level artifacts now include `50` goal-contract rows, `76` phase-template rows, `20`
  weekly-archetype rows, `23` identity-placement rows, `57` segment-anatomy rows, `14`
  progression-math rows, `17` quality-gate rows, and `30` builder I/O contract rows.
- Metric-truth rules are preserved.
- No shipped 5K family appears.
- No OpenAI happy-path generation, frontend-owned plan generation, DB/schema, or persistence
  behavior is implied.
- `git diff --check` passed for the four artifacts.
- CSV parse/read checks passed.
- `npm run validate-admin-capture-backlog` passed.

Minor clarity issue decision:

- QA noted that the source-of-truth already says presets must not rely on one fixed duration, but
  did not explicitly name current fixed `10/12/16` week fixtures as no longer the product target.
- This was fixed in the source-of-truth artifact before Backend Slice 6 so implementation does not
  preserve fixed-duration fixtures as the target behavior.

Algorithmic builder audit, 2026-06-08:

Files inspected:

- [Plan Preset program data](../../../src/lib/plan-presets/program-data.ts)
- [Plan Preset composition helpers](../../../src/lib/plan-presets/composition.ts)
- [Plan Preset draft expansion facade](../../../src/lib/plan-presets/expand.ts)
- [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts)
- [Plan Preset progressive policy](../../../src/lib/plan-presets/progressive-policy.ts)
- [Plan Preset progressive cards](../../../src/lib/plan-presets/progressive-cards.ts)
- [Plan Preset eligibility validator](../../../scripts/validate-plan-preset-eligibility.ts)
- [Plan Preset program source of truth](../../../src/lib/plan-presets/preset-program-source-of-truth.md)
- [Plan Preset scenario matrix](../../../src/lib/plan-presets/preset-program-scenario-matrix.csv)
- [Plan Preset load adjustments](../../../src/lib/plan-presets/preset-program-load-adjustments.csv)
- [Plan Preset workout identity library](../../../src/lib/plan-presets/preset-workout-identity-library.csv)

Backend Slice 6B implementation verdict:

- Current artifacts are sufficient for the shipped non-target-time Plan Preset builder scope:
  `10K Foundation`, `Half Marathon Balanced`, and `Marathon Base`.
- Runtime reads all source-of-truth CSV artifacts through
  [Plan Preset program data](../../../src/lib/plan-presets/program-data.ts).
- [Plan Preset draft expansion facade](../../../src/lib/plan-presets/expand.ts) now calls one
  canonical deterministic builder instead of recipe-specific row expanders.
- [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts) owns phase
  allocation, weekly archetype inheritance, slot-to-weekday mapping, identity resolution, final
  outcome materialization, recurring cutback protection, quality gates, and canonical row assembly.
- The previous active recipe-specific expanders for `10K Foundation`, `Half Marathon Balanced`, and
  `Marathon Base` were deleted so there is no second active row-generation truth.
- `recipe-expanders/shared.ts` remains as shared workout safety/counting helpers only; it no longer
  owns per-family program composition.
- Target-time preset doctrine remains future-gated and continues to route to Advanced custom.

Canonical builder pipeline:

| Layer | Owner | Input | Output | Source of truth needed | Validation requirement | Frontend must not guess |
| --- | --- | --- | --- | --- | --- | --- |
| Runner inputs | Frontend collects, backend validates | profile, level, availability, rest days, long-run preference, benchmark, goal intent | normalized setup truth | existing schema plus preset card contract | schema and card-state harness | eligibility, defaults, or metric truth |
| Capability/load context | Backend | normalized setup truth | age/load/conservatism context | load-adjustment table plus thresholds | neutral labels, no medical/body-shaming copy | load risk, duration extension, progression safety |
| Goal contract | Backend | distance, goal style, target time/date, benchmark truth | completion/base/performance/custom routing | `preset-goal-contract-matrix.csv` | target-time routes custom unless doctrine exists | target-time eligibility or ambition realism |
| Duration model | Backend | goal contract, level, days/week, load context, benchmark/consistency | duration band and selected duration | scenario matrix plus progression bounds | adaptive duration assertions | duration or end date |
| Phase architecture | Backend | selected duration, family, goal contract, conservatism | ordered phases with week ranges | `preset-phase-template-table.csv` | phase sequence, min/max phase length, cutback cadence | phase count or phase labels |
| Weekly composition | Backend | phases, days/week, rest/long-run constraints | weekly archetypes and day slots | `preset-weekly-archetype-table.csv` | long-run placement, rest conflicts, specific-touch caps | weekly rhythm or slot ownership |
| Workout identity placement | Backend | weekly slots, phase, family rules | identity assigned to each workout slot | `preset-identity-placement-rules.csv` | identity diversity, min/max frequency, forbidden context checks | identity mix or substitutions |
| Segment anatomy | Backend | identity, level, phase, conservatism, metric mode | warmup/main/repeats/recovery/cooldown sectors | `preset-segment-anatomy-table.csv` | every non-rest row rich and executable | workout sectors or target structure |
| Target-mode resolution | Backend | segment anatomy plus metric truth | structure-only, pace, or HR-capable targets | metric-truth contract plus future target-time doctrine | no fake pace/HR, no target-time pace without benchmark truth | pace/HR permission |
| Canonical rows | Backend | resolved slots and segments | canonical `training-plan-v2` draft rows | runtime builder | row/metadata/review checksum exactness | row generation |
| Review/confirm | Backend owns mutation, frontend renders | reviewed draft token/checksum | persisted active plan only on confirm | existing persistence seam | exact persistence, idempotency, rollback | persistence or duplicate guards |

Source-of-truth artifacts now active:

- [Plan Preset goal contract matrix](../../../src/lib/plan-presets/preset-goal-contract-matrix.csv)
  covers completion/base/performance/custom routing, final outcomes, and target-time future gates.
- [Plan Preset phase template table](../../../src/lib/plan-presets/preset-phase-template-table.csv)
  covers ordered phases, phase ratios, minimum weeks, cutback cadence, and final phases.
- [Plan Preset weekly archetype table](../../../src/lib/plan-presets/preset-weekly-archetype-table.csv)
  covers days/week rhythms, long-run slots, support slots, and low-frequency patterns.
- [Plan Preset identity placement rules](../../../src/lib/plan-presets/preset-identity-placement-rules.csv)
  cover phase/family/level identity availability and substitutions.
- [Plan Preset segment anatomy table](../../../src/lib/plan-presets/preset-segment-anatomy-table.csv)
  covers workout anatomy ownership for supported identities and execution modes.
- [Plan Preset progression math rules](../../../src/lib/plan-presets/preset-progression-math-rules.csv)
  covers ramp, cutback, low-frequency milestone, and duration/progression constraints.
- [Plan Preset quality gates](../../../src/lib/plan-presets/preset-quality-gates.csv) covers final
  outcome, support-only rejection, identity diversity, and family-specific acceptance gates.

Target-time policy decision:

- Target-time Plan Presets remain out of scope now.
- Existing resolver behavior that routes `goalStyle: target_time` / `targetTime` to Advanced custom
  remains correct.
- A future target-time preset path requires separate doctrine and backend gates before it can be
  deterministic:
  recent benchmark truth, realistic improvement bounds, target-distance projection, intensity
  multiplier, duration extension, refusal/custom routing, and no pace target unless benchmark truth
  supports it.
- Target time alone must never create pace truth.

AI usage policy:

- Acceptable AI use:
  offline doctrine drafting, workout library enrichment, coach review suggestions, copy
  alternatives, and future Advanced custom generation behind review.
- Not acceptable for the current preset happy path:
  runtime unreviewed preset row generation, silent mutation, replacing deterministic safety gates,
  inventing pace/HR truth, or bypassing source-of-truth validation.

Slice 6A decision:

`Slice 6A: Plan Preset algorithmic builder architecture and missing source-of-truth gap closure`.

Decision:

- Completed before Backend Slice 6B.
- Source-of-truth artifacts now exist as markdown plus CSV inputs under
  [Plan Preset source of truth](../../../src/lib/plan-presets/preset-program-source-of-truth.md).
- Backend Slice 6B consumes these artifacts through
  [Plan Preset program data](../../../src/lib/plan-presets/program-data.ts) and the deterministic
  [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts).
- Remaining target-time preset doctrine is intentionally future-gated and routes to Advanced custom.

Slice 6A artifact output:

- phase template contract
- weekly archetype / slot contract
- identity placement frequency contract
- segment anatomy parameter contract
- progression math / low-frequency milestone contract
- quality-gate contract
- target-time doctrine marked future-gated, not shipped behavior

Body-size/load factor decision:

Introduce a backend-owned anthropometric load context for Plan Presets.

Purpose:

- Use age, height, and weight to moderate progression, weekly load, long-run ramp, impact exposure,
  and intensity density.
- Influence duration and progression conservatism.
- Stay conservative and auditable.
- Avoid medical claims, injury inference, or exact pace/HR truth.

Neutral internal terms:

- `bodyLoadFactor`
- `impactLoadAdjustment`
- `progressionConservatism`
- `anthropometricLoadContext`

Forbidden language:

- Do not use insulting, moralizing, or body-shaming labels in code, UI, docs, or product copy.
- Do not label runners as "bad", "heavy risk", "overweight", "obese", "fragile", or similar
  product-facing judgments in this preset context.
- Do not present the load context as diagnosis, injury prediction, or medical advice.

Allowed runner-facing copy:

- "We'll build this with a more gradual progression."
- "This plan uses a conservative ramp to protect consistency."
- "Your plan duration adapts to your current profile and weekly rhythm."
- "Hito is using a steadier progression because this setup benefits from more recovery space."

Architecture:

- Backend owns formula, thresholds, caps, and explanation strings.
- Frontend only renders backend-shaped explanation.
- The policy must not infer injury from height/weight.
- The policy must not create exact pace from body size.
- The policy must not create personal HR targets from age/body size.
- The policy must be testable through deterministic fixtures.

Rich program doctrine across shipped families:

Every shipped Plan Preset family must include:

- family-specific workout identity mix
- rich structured segments
- meaningful progression
- cutback/recovery cycles
- final outcome logic
- dynamic duration
- level-specific variants
- days/week variants
- rest-day and long-run preference adaptation
- metric-truth-preserving execution

Avoid support-only plans dominated by easy/recovery/rest. Easy and recovery work are still required,
but they must support a meaningful family-specific progression instead of replacing it.

Required workout library for the rebuild:

- recovery jog / recovery run-walk
- easy aerobic run
- easy run with strides
- progression run
- aerobic intervals
- short intervals
- tempo / threshold
- cruise intervals
- hills / hill strides / hill endurance
- long aerobic run
- long run with steady finish
- cutback aerobic run
- cutback long run
- benchmark/test
- race simulation / completion day
- rest/recovery day
- optional strength/cross-training notes if supported

Family final outcome requirements:

- `10K Foundation` must end with an explicit 10K completion/test/race-style simulation or a clear
  coach-approved equivalent.
- `Half Marathon Balanced` must end with a credible half-readiness marker or race-specific readiness
  block.
- `Marathon Base` must end with a clear durability/base endpoint and must not falsely claim full
  race readiness unless the selected duration/progression supports it.

Backend Slice 6B implementation decision:

`Backend Slice 6B: Implement deterministic Plan Preset program builder pipeline`.

Scope:

- Rebuild all three shipped families, not just 10K:
  `10K Foundation`, `Half Marathon Balanced`, and `Marathon Base`.
- Add dynamic duration model.
- Add backend-owned body-size/load adjustment.
- Add richer workout library usage.
- Add days/week variants, including safe longer 2-day 10K support and narrow/conservative Half
  support only where Running Coach approves it.
- Keep Marathon stricter for low availability and higher load-risk contexts.
- Add final outcome logic.
- Preserve metric truth:
  target time alone does not unlock pace, age/body size does not unlock HR, and
  `structure_only_executable` remains valid without benchmark/provider truth.
- Preserve review/confirm/persistence safety.
- Update harness expectations away from fixed 10/12/16 row counts toward adaptive duration and
  quality assertions.
- Keep preset happy-path deterministic and backend-owned; do not use OpenAI to improvise preset
  programs at runtime.
- Implementation is complete locally and ready for QA validation; Slice 6A source-of-truth artifacts
  are parsed by the runtime and harness.

Backend Slice 6 QA expectations:

- fixtures for short/light, average, and tall/heavier runners
- fixtures for low, normal, and higher weekly availability
- fixtures for beginner/recreational/performance levels
- no-benchmark and recent-5K metric truth fixtures
- fixed-rest and long-run preference fixtures
- adaptive duration assertions rather than fixed 10/12/16 week assertions
- family-specific identity mix assertions
- non-rest rows have rich structured segments
- support-only/easy-dominated plans are rejected
- final outcome marker is present for every family
- no fake pace/HR
- no OpenAI call
- no DB/schema change unless separately approved
- review/confirm/source metadata behavior preserved

Backend Slice 6 implementation note, 2026-06-08:

- [Plan Preset program data](../../../src/lib/plan-presets/program-data.ts) now owns parsing and
  resolving the scenario matrix, load adjustments, and workout identity library into deterministic
  program duration/load metadata.
- [Plan Preset resolver](../../../src/lib/plan-presets/resolver.ts) and
  [Plan Preset review expansion](../../../src/lib/plan-presets/expand.ts) now use adaptive
  duration, estimated end date, scenario metadata, neutral impact-load context, progression
  conservatism, cutback policy, and final-outcome metadata.
- [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts) now owns
  generated workout rows for all shipped preset families through one CSV-backed builder pipeline.
- The old recipe-specific row expanders for `10K Foundation`, `Half Marathon Balanced`, and
  `Marathon Base` were deleted.
- [Plan Preset composition](../../../src/lib/plan-presets/composition.ts) now owns safe
  specific-touch placement so long-run steady-finish and midweek specificity do not collide in the
  same week.
- Plan Preset harness expectations were updated away from fixed `10/12/16` week and `70/84/112`
  row-count truth toward adaptive duration formulas, source-matrix coverage, family outcome markers,
  rich identities, metric truth, and review/confirm exactness.
- [Build output finalization](../../../scripts/finalize-build-output.mjs) now copies and verifies
  the Plan Preset program CSV artifacts into server output so runtime preset resolution does not
  depend on an accidental source checkout in production.
- Local validation passed:
  targeted Plan Preset ESLint, Plan Preset harness, plan-authoring doctrine validator, blueprint
  mock smoke, admin capture backlog validator, build-finalizer syntax/lint, `git diff --check`, and
  `npm run build`.

Backend Slice 6B final outcome identity fix, 2026-06-08:

- QA found that final outcome rows were still emitting legacy identities:
  `10k_rhythm_intervals`, `half_marathon_threshold_durability`, and
  `long_run_with_steady_finish`.
- [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts) now
  preserves the canonical builder I/O output identities in final generated rows:
  `tenk_completion_or_checkpoint`, `half_readiness_marker`, and `base_endpoint_marker`.
- [Plan Preset eligibility validator](../../../scripts/validate-plan-preset-eligibility.ts) and
  per-recipe Plan Preset assertions now require exact final-week canonical identities instead of
  accepting legacy identity/text substitutes.

Backend Slice 6B QA closeout, 2026-06-08:

Status:

implemented and QA-passed.

Evidence recorded:

- Runtime now emits canonical final outcome markers:
  `tenk_completion_or_checkpoint`, `half_readiness_marker`, and `base_endpoint_marker`.
- Final marker rows have structured segment anatomy rather than text-only or legacy filler rows.
- Harnesses require exact canonical final identities instead of accepting legacy substitutes.
- Quality-gate proof passed for final outcome markers and family-specific builder expectations.
- Metric truth remains strict:
  no fake pace without benchmark truth and no executable HR without personal HR-zone truth.
- Review/confirm boundary remains intact:
  Plan Presets stay deterministic, reviewed before mutation, and persisted only through the existing
  confirm path.
- Blueprint/custom authoring smoke remains unaffected.
- No frontend, DB/schema, persistence, OpenAI runtime generation, manual workout CRUD, target-time
  preset support, new preset family, or active-plan replacement/refresh behavior changed.
- Validation passed in QA:
  targeted Plan Preset ESLint, Plan Preset harness, plan-authoring doctrine validator,
  blueprint/custom authoring smoke, admin capture backlog validator, build-finalizer syntax check,
  `git diff --check`, and `npm run build`.

Minor source-text drift:

- [Plan Preset quality gates CSV](../../../src/lib/plan-presets/preset-quality-gates.csv) still has
  Half marker prose saying it may be threshold durability or a long-run specificity endpoint.
- Runtime and harness truth now require exact canonical `half_readiness_marker`, so this is a
  source-text/copy drift, not a runtime correctness blocker.
- Decision:
  non-blocking cleanup note. It should be fixed by a tiny BACKEND/COPY source-text cleanup when the
  Plan Preset source artifacts are next touched, but it does not block Slice 6B closeout or the next
  service-size cleanup gate.

### Plan Preset Product Contract Reset

Date:

2026-06-08.

Status:

controlled reset required before service-size cleanup resumes.

Trigger:

Real Plan Preset output failed product acceptance. The Half Marathon export is the concrete proof
case, but the decision applies to all shipped Plan Preset programs.

Evidence:

- Exported file:
  `/Users/ivan/Downloads/half-marathon-balanced-plan-preset-2026-06-08.json`.
- The selected card was Half Marathon.
- The exported plan is `plan_preset_v1`, named `Half Marathon Balanced Plan Preset`.
- The exported plan has `119` rows across `17` weeks.
- The final row is `half_readiness_marker`.
- The final row title is `Half marathon readiness marker`.
- The final row summary is `68 min half readiness marker`.
- The final row has structured time-based segments, but no explicit `21.1K` endpoint distance field.
- User acceptance expectation:
  choosing a Half Marathon card should produce a plan that culminates in a real Half
  Marathon-distance outcome or an explicitly named Half Marathon completion/checkpoint, not a
  hidden internal readiness marker.
- Additional readback evidence:
  workout detail/export surfaces can show effort labels such as `Effort: easy`,
  `Effort: threshold steady`, `Mode: Executable structure`, and `Effort threshold steady` as
  primary-feeling execution copy.

Decision:

This is not only frontend copy drift. It is a product-contract failure across Running Coach
doctrine, backend source-of-truth, builder segment anatomy, metric truth, export/review/readback, and
frontend workout-detail rendering.

Reset decision:

- The current Plan Preset algorithmic builder is product-failed / not accepted as the canonical
  creation model.
- Do not keep patching the current algorithm blindly.
- Treat current generated outputs as regression evidence for what failed, not as accepted coaching
  targets.
- The rebuild must start from human coach benchmark plans and watch-executable workout examples
  before Backend writes a new builder.
- Keep the product deterministic and backend-owned; do not replace the failed algorithm with
  frontend templates or OpenAI runtime improvisation.

Service-size cleanup sequencing:

- `BACKEND Slice 10A: demote strict nested ai-first-plan-draft-v1 out of product runtime ownership`
  is paused.
- Do not clean old plan-authoring paths while the current primary no-active-plan creation product is
  failing real acceptance.
- Resume service-size cleanup only after the corrected Plan Preset product contract is implemented
  and QA-passed.

What remains salvageable:

- Visual card direction can be preserved if it supports the corrected interaction.
- Existing review/confirm/persistence safety can be preserved:
  review must remain non-mutating, confirm must persist exact reviewed canonical rows, and duplicate
  active-plan guards remain mandatory.
- Backend-owned truth remains mandatory:
  eligibility, schedule, calendar rows, workout placement, metric truth, load/progression, and
  persistence must not move to frontend.
- Existing `plan_preset_v1` source kind can remain if the rebuilt contract preserves auditability,
  but source metadata must clearly distinguish corrected builder versions.
- Hito DS visual primitives and card styling can be reused.

What is deleted, demoted, or frozen:

- Current algorithmic builder output is frozen as failed product behavior until rebuilt.
- Current source-of-truth CSVs are frozen for audit:
  keep them as evidence only until Running Coach/Backend replaces or corrects the wrong doctrine.
- Old recipe expanders that are already removed should stay removed unless Backend proves one
  specific deleted piece is safer as a temporary fixture than the failed algorithm.
- Quality gates that allow readiness-only final outcomes for selected distance cards must be
  replaced.
- Any segment model that lets effort wording be the primary execution target must be rejected.
- Do not run a blind `git reset`, broad revert, or mass deletion:
  every deletion/demotion must name the file/symbol, prove replacement coverage, and pass harnesses.

Controlled deletion strategy:

1. Freeze failed builder behavior behind the current plan as product-failed, not accepted.
2. Ask Running Coach for backend-ready reference doctrine and example plans.
3. Let Backend compare current builder/source files against the corrected doctrine.
4. Delete or demote only the specific builder/source/gate pieces that encode the wrong doctrine.
5. Preserve review/confirm/persistence seams unless a concrete contract bug is proven.
6. Keep old failed outputs only as test fixtures that prove the new builder no longer emits them.

New canonical Plan Preset creation pipeline:

`runner basics -> load/progression context -> selected distance goal -> days/week capacity -> coach-authored reference doctrine -> phase plan -> weekly calendar preview -> workout placement -> watch-executable segment construction -> review modal -> confirm/persist`

Pipeline ownership:

- Runner basics:
  age, height, weight, running level, and days/week are collected by frontend but interpreted by
  backend.
- Load/progression context:
  backend applies safe, non-shaming, non-medical multipliers for preparation duration, volume, and
  progression conservatism.
- Selected distance goal:
  backend owns the real endpoint contract for 10K, Half Marathon, and Marathon/Base.
- Days/week capacity:
  backend turns selected or default days/week into viable phase/weekly rhythm.
- Coach-authored reference doctrine:
  Running Coach provides human benchmark plans and workout examples before code.
- Phase plan:
  backend maps doctrine into phase durations, cutback rhythm, quality density, long-run growth, and
  endpoint/taper behavior.
- Weekly calendar preview:
  backend returns calendar rows before confirm; frontend renders only backend-shaped truth.
- Workout placement:
  backend places rest days, long runs, quality days, cutbacks, and recovery spacing, with flexible
  defaults if runner omits preferences.
- Watch-executable segment construction:
  backend emits duration/distance/repeats/work/recovery segment prescriptions and only adds pace/HR
  when real truth exists.
- Review modal:
  frontend shows selected-plan details, mini calendar, colored workout types, preferences, endpoint,
  and review copy.
- Confirm/persist:
  existing explicit confirm path persists exact reviewed canonical rows.

Corrected selected-distance endpoint contract:

- `10K Foundation` must culminate in a real 10K completion/checkpoint endpoint.
- `Half Marathon Balanced` must culminate in a real Half Marathon-distance endpoint or explicitly
  named Half Marathon completion/checkpoint endpoint.
- A hidden `readiness marker only` cannot satisfy a selected distance card unless the card copy
  clearly says it is not a completion-distance plan.
- `Marathon Base` must be re-decided explicitly:
  either rename/reposition it as honest base-building and not a `run a marathon` plan,
  or define safe constraints for a future Marathon-distance endpoint.
- Endpoint behavior must be represented in backend source-of-truth, builder output, review/export,
  and QA harnesses.
- Endpoint behavior must not be inferred from internal identity names alone; exported canonical rows
  need runner-auditable endpoint fields/copy.

Corrected watch-executable metric contract:

- Hito assumes watch/app execution for supported new-plan creation.
- Pace targets require benchmark truth.
- HR targets require personal HR-zone truth.
- Lack of pace/HR truth must not collapse a workout into vague `Effort: threshold steady` as the
  primary target.
- Every generated non-rest workout segment must have watch-executable structure:
  duration and/or distance, interval/repeat counts where relevant, work/recovery units where
  relevant, and explicit target-mode classification.
- Primary prescription examples:
  `10 min`, `8 km easy`, `3 x 10 min`, `3 min recovery`, `6 x 2 min`, `1 km recovery`,
  or a similarly watch-programmable structure.
- Secondary cue examples:
  conversational, controlled, steady, threshold-like, relaxed, smooth, durable.
- Effort/RPE/coaching cue may exist as secondary instruction, but must not be the primary metric
  target shown as if it is enough for a watch-based plan.
- Do not show raw internal effort labels such as `threshold steady` as primary runner-facing metric
  truth.
- If a workout cannot be expressed in watch-executable structure without fake pace/HR, it should fail
  quality gates or route to custom/review instead of silently shipping vague effort-only text.

Backend/source-of-truth contract:

- Backend must use age, height, weight, level, and days/week as real inputs into duration, load, and
  progression, not decorative fields.
- Backend must ask or accept rest-day and long-run preferences after plan selection.
- Backend must support flexible/default rest-day and long-run behavior when the runner omits those
  preferences.
- Backend should avoid rigid same-pattern weekly placement when the source-of-truth allows safe
  variation.
- Backend source-of-truth, segment anatomy, quality gates, and harnesses must prevent Half Marathon
  from passing without selected-distance endpoint behavior.
- Backend source-of-truth, segment anatomy, quality gates, and harnesses must prevent generated
  non-rest segments from passing when their primary execution target is only vague effort wording.
- Export/review/readback must preserve the primary structured prescription and keep cue/effort copy
  secondary.

Frontend interaction/readback contract:

- Cards can appear after age, height, weight, and level are known.
- Days/week may have a backend-owned default if not selected, but it must remain editable before
  review/confirm.
- Primary card CTA is `Select Plan`.
- Remove the separate `Learn more` CTA.
- `Select Plan` opens a selected-plan modal.
- The selected-plan modal shows simple plan details plus preference controls:
  running days/week if missing or editable, rest-day count/selection based on days/week, preferred
  long-run day, and a flexible/default option when omitted.
- Card click may reveal extra details below, but it must not be the primary creation/review path.
- Remove `Ready to create`.
- Replace `Create preset plan` with runner-facing copy such as `Create my plan`, only inside the
  selected-plan modal after backend review is ready.
- Frontend must never send rows/workouts or calculate schedule/metric truth locally.
- Workout detail/readback must show primary structured prescription before effort/cue.

Plan ownership transition:

- This simplification strike no longer owns Plan Preset or plan-creation rebuild execution.
- The rebuild is now owned by
  [Running Plan Creation Engine Rebuild](2026-06-08-running-plan-creation-engine-rebuild.md).
- Keep this section only as evidence for why service-size cleanup was paused and why plan-creation
  work moved to a dedicated product plan.
- Do not add more plan-creation implementation slices to this simplification strike.
- Resume this strike only after the dedicated rebuild plan passes product acceptance.

What remains forbidden:

- no 5K shipped card
- no target-time preset support
- no fake pace or HR
- no frontend-owned schedule logic
- no DB/schema changes unless separately approved
- no persistence semantic changes
- no manual workout CRUD
- no active-plan replacement/refresh
- no OpenAI runtime generation for preset happy path
- no service-size cleanup until this correction passes QA

Slice 6 out of scope:

- adding 5K as shipped
- adding new preset families
- using OpenAI for preset happy-path generation
- weakening metric truth
- body-shaming/internal insulting labels
- medical claims
- injury inference from weight/height
- DB/schema changes unless separately proven necessary
- confirm/persistence semantic changes
- frontend changes
- manual workout CRUD
- active-plan replacement/refresh

### Service Size Root-Cause Audit

Date:

2026-06-08.

Snapshot:

- Tracked repo markdown/code/data total is about `186,945` lines across counted `ts`, `tsx`, `mjs`,
  `md`, `css`, `csv`, and `json` files.
- Tracked plus currently untracked worktree files total is about `193,159` counted lines.
- Runtime `src` code is about `84,677` lines.
- Runtime `src` TypeScript/TSX is about `79,707` lines.
- Scripts and validation harness code are about `21,662` lines.
- Docs markdown/CSV are about `66,528` lines.
- `package-lock.json` is about `11,693` lines and should not be counted as service complexity.

Runtime/source hotspots:

| Cluster | Approx lines | Diagnosis |
| --- | ---: | --- |
| plan authoring / AI blueprint / envelope / doctrine | `31,974` | biggest real ownership sprawl; many first-plan, AI, structured-authoring, and doctrine seams coexist |
| Admin routes/importer/work items | `12,655` | admin surface and importer grew as operational tooling, not runner runtime |
| Plan Presets | `7,422` | actively changing and currently in dirty worktree; not safe as first deletion target |
| import/export/workout-result ingest | `6,069` | separate ingestion/export domain; requires source-of-truth audit before deletion |
| active-plan refresh/replacement/schedule | `5,572` | legitimate but overlaps plan mutation/review ownership |
| Hito DS route/playground | `5,664` | [Hito DS route](../../../src/routes/hitoDS.tsx) is a single large route-local demo owner |
| global CSS | `4,970` | [styles](../../../src/styles.css) is a monolithic styling owner |

Root cause:

The line count is not primarily caused by one bad dependency or one accidental file. It grew because
Hito added many correct-but-parallel seams before deleting older ones:

- multiple plan creation paths remained after Plan Presets, blueprint, envelope, text, voice,
  import/apply, and refresh/apply were added
- validation scripts grew into multi-domain safety nets
- Admin became both product surface and operations/backlog mirror
- `/hitoDS` accumulated design-system demos inside one route owner
- global CSS absorbed route/component concerns instead of being steadily tokenized/extracted
- active/archive/backlog docs accumulated as useful history, but they inflate repo line count and
  should be separated from runtime service complexity

What is not the first fix:

- Do not delete docs/archive just to lower the number.
- Do not delete QA harnesses before replacing their safety coverage.
- Do not delete Plan Preset builder work while it is dirty/in-flight.
- Do not split files purely by line count if ownership would become less clear.
- Do not treat `package-lock.json`, generated route tree, or historical docs as product bloat.

Size-reduction strategy:

1. Separate runtime source, scripts/harnesses, docs/history, generated/lockfiles, and active dirty
   work in every future size report.
2. Prefer deletion/demotion of stale plan-creation paths over abstraction.
3. Pick one ownership seam per slice and require behavior-preservation validation.
4. Add line-count budgets to hotspot files before adding responsibility:
   around `700` lines needs justification or extraction, around `1000` lines needs architecture
   reason, and around `1500` lines becomes an active decomposition candidate.
5. Reduce code paths before shrinking UI polish files; plan generation owns the largest real
   complexity cluster.

First safe reduction slice:

`ARCHITECT Slice: Plan-creation source map and deletion-gate selection`.

Scope:

- classify every plan creation/mutation/review path by production default, production non-default,
  internal supported, ops/diagnostic, QA/doctrine fixture, legacy readback, or deletion/demotion
  candidate
- select exactly one stale/legacy seam for Backend deletion or demotion
- define required validation before deletion
- do not touch Plan Preset in-flight builder files
- do not weaken blueprint default, review/confirm, persistence, or metric-truth behavior

Second reduction slice:

`BACKEND Slice: plan-authoring doctrine validator decomposition`.

Scope:

- decompose [plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts)
  by stable assertion ownership
- keep the command entrypoint stable
- preserve all assertions
- do not use decomposition as a substitute for deleting stale plan-authoring paths

Third reduction slice:

`FRONTEND Slice: Hito DS route and CSS ownership audit`.

Scope:

- split route-local `/hitoDS` demo ownership only if it reduces route responsibility
- classify [styles](../../../src/styles.css) into DS tokens, shared primitives, product route
  styles, admin styles, and dead rules
- delete only rules/components with source proof and visual QA

### Slice 9: Plan-Creation Source Map And First Deletion Gate

Status:

architecture decision complete on 2026-06-08.

Owner:

ARCHITECT.

Audit evidence:

- Source/reference scans covered [first-plan actions](../../../src/lib/first-plan-actions.ts),
  [AI first-plan draft service](../../../src/lib/ai-first-plan-draft-service.ts),
  [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts),
  [AI blueprint modules](../../../src/lib/ai-first-plan-blueprint-authoring.ts),
  [AI envelope modules](../../../src/lib/ai-first-plan-envelope-expand.ts),
  [structured authoring](../../../src/lib/structured-plan-authoring.ts),
  [Plan Presets](../../../src/lib/plan-presets/),
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts),
  [imported plan contract](../../../src/lib/imported-plan.ts),
  [active plan persistence](../../../src/lib/active-plan-persistence.ts),
  [text authoring](../../../src/lib/openai-plan-authoring.ts),
  [voice authoring](../../../src/lib/voice-to-plan-authoring.ts),
  [active-plan refresh actions](../../../src/lib/active-plan-refresh-actions.ts),
  [plan replacement actions](../../../src/lib/plan-replacement-actions.ts),
  [plan-authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts),
  [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts), and
  [Plan Preset harnesses](../../../scripts/plan-presets/).
- `package.json` still exposes the stable ops commands:
  `author-ai-first-plan-draft`, `seed-ai-first-plan-blueprint-proof`,
  `author-plan-from-text`, `validate-admin-capture-backlog`, and
  `import-admin-backlog-work-items`.
- Reference proof showed the old strict nested `ai-first-plan-draft-v1` prompt/schema/normalizer
  functions are used by [plan-authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts),
  while product runtime imports from [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts)
  are type/metadata dependencies for blueprint trace/result metadata.
- `npm run author-ai-first-plan-draft -- --contract strict-draft` is already bounded as an
  unsupported ops contract by the script parser; routine service/action/script paths expose only
  blueprint or envelope draft contracts.

Source map:

| Path / seam | Current role | Evidence | Classification | Decision |
| --- | --- | --- | --- | --- |
| Plan Presets (`plan_preset_v1`) | canonical no-active-plan happy path | [Plan Preset actions](../../../src/lib/plan-preset-actions.ts) review/confirm through [active plan persistence](../../../src/lib/active-plan-persistence.ts); [Onboarding gate](../../../src/components/OnboardingGate.tsx) calls preset server actions | product runtime | Keep; out of deletion scope while builder QA is in flight |
| AI first-plan blueprint (`ai_first_plan_blueprint_v1`) | production advanced/custom first-plan draft path | [first-plan actions](../../../src/lib/first-plan-actions.ts) defaults to blueprint through [AI draft service](../../../src/lib/ai-first-plan-draft-service.ts) | production default for custom AI path | Keep; must not weaken default |
| AI first-plan envelope (`ai_first_plan_envelope_v1`) | explicit internal non-default structured draft option | [first-plan actions](../../../src/lib/first-plan-actions.ts) accepts internal envelope contract; no public selector | internal supported path | Keep; no production promotion |
| Strict nested AI draft (`ai-first-plan-draft-v1`) | historical full draft prompt/schema/normalizer | [doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) imports prompt/normalizer; runtime imports only shared type/metadata from the same file | QA/doctrine historical path plus stale runtime coupling | Selected first demotion gate |
| Deterministic structured authoring (`structured_authoring_v1`) | deterministic canonical generator and legacy/readback source | [structured authoring](../../../src/lib/structured-plan-authoring.ts) feeds blueprint fallback scaffolds, envelope expansion, active refresh, voice/text paths, and doctrine fixtures | production support / legacy compatibility | Keep; do not reintroduce as successful first-plan fallback |
| Text rich authoring | saved-mode text replacement path | [plan replacement actions](../../../src/lib/plan-replacement-actions.ts) calls [OpenAI text authoring](../../../src/lib/openai-plan-authoring.ts), then canonical persistence | production non-default path | Keep; audit later only after source map narrows |
| Voice-to-plan | Pro transcript first-plan assist | [first-plan actions](../../../src/lib/first-plan-actions.ts) dynamically imports [voice authoring](../../../src/lib/voice-to-plan-authoring.ts) and preserves review/confirm | production non-default path | Keep |
| Active-plan refresh/apply | explicit reviewed mutation for existing active plans | [training API facade](../../../src/lib/training-api.ts) binds server actions to [active-plan refresh actions](../../../src/lib/active-plan-refresh-actions.ts) | product runtime mutation path | Keep; not plan-creation deletion scope |
| JSON import/apply and text replacement | advanced import/replacement fallback | [plan replacement actions](../../../src/lib/plan-replacement-actions.ts) and [imported plan contract](../../../src/lib/imported-plan.ts) feed [active plan persistence](../../../src/lib/active-plan-persistence.ts) | product runtime / migration support | Keep |
| Active plan persistence | canonical create/apply owner | [active plan persistence](../../../src/lib/active-plan-persistence.ts) owns `applyImportedPlanForUser(...)` and `createFirstPlanFromReviewedCanonicalPlanForUser(...)` | canonical persistence | Never deletion target in this strike |
| `author-ai-first-plan-draft` ops script | blueprint/envelope diagnostics and live/mock smoke | [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts) calls the service and rejects strict-draft selection | ops/diagnostic path | Keep; later narrow only if diagnostics duplicate another command |
| Doctrine validator | broad safety harness for authoring, refresh, rich drafts, blueprint/envelope, and legacy coverage | [plan-authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) is large but protects multiple contracts | QA harness | Decompose later; do not delete |
| `training-api.ts` facade | compatibility server-action import map | [training API facade](../../../src/lib/training-api.ts) re-exports extracted owners for routes/components | legacy compatibility facade | Narrow later only after import-map proof |

Candidate table:

| Candidate | Why considered | Why not / risk | Gate decision |
| --- | --- | --- | --- |
| Demote strict nested `ai-first-plan-draft-v1` | It is the clearest historical first-plan authoring path: strict-draft is no longer selectable, and the prompt/normalizer are only doctrine-harness behavior | Shared metadata/trace types still live in the same runtime file, so raw deletion would break blueprint/envelope/runtime type imports | Approved as first demotion gate with type/metadata extraction first |
| Delete/demote `structured_authoring_v1` references | Old source kind remains visible in several places | It remains deterministic generator/readback compatibility and must not become a first-plan success fallback | Forbidden for first gate |
| Decompose `validate-plan-authoring-doctrine.ts` | 7k+ line hotspot | It is a safety harness, not runtime bloat; deletion would weaken QA | Later decomposition slice only |
| Narrow `training-api.ts` re-exports | It is a broad compatibility facade | Route/serverFn import eligibility can break if narrowed too early | Later import-map slice |
| Delete Plan Preset recipe/builder files | Current family code is large | Current Plan Preset builder is in-flight and user-visible creation depends on it | Forbidden for this gate |
| Delete ops scripts | They are not product runtime | Blueprint/envelope live/mock diagnostics still provide release-gate proof | Keep for now |

Selected deletion/demotion gate:

`BACKEND Slice 10A: demote strict nested ai-first-plan-draft-v1 out of product runtime ownership`.

Status:

paused after real Plan Preset acceptance failure. Keep this as the first service-size cleanup gate,
but do not start it until the corrected Plan Preset endpoint/watch-executable contract is
implemented and QA-passed.

Next owner:

BACKEND after Plan Preset contract correction QA passes.

Scope approved for Slice 10A:

- Extract shared AI first-plan metadata and blueprint trace types out of
  [strict nested AI draft authoring](../../../src/lib/ai-first-plan-draft-authoring.ts) into a
  small product-owned metadata/trace module.
- Update blueprint, envelope/service, first-plan action, and ops-script type imports to depend on
  that shared metadata module instead of the strict nested draft module.
- Move or isolate the strict nested `ai-first-plan-draft-v1` prompt/schema/normalizer into
  doctrine-only ownership so its validation value remains available to
  [plan-authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) without
  presenting it as a routine runtime authoring seam.
- Preserve the stable doctrine validator entrypoint.
- Preserve bounded `strict-draft` CLI rejection in
  [AI first-plan ops script](../../../scripts/author-ai-first-plan-draft.ts).
- Remove any now-dead product-runtime source-kind branch only after source scans prove no runtime
  path can emit it.

Explicitly out of scope for Slice 10A:

- Plan Preset runtime, builder CSV artifacts, resolver, review, confirm, persistence, or frontend.
- Blueprint default behavior, prompt, validation, repair, horizon extension, or smoke contract.
- Envelope internal/non-default behavior or exact review/confirm proof.
- `structured_authoring_v1` legacy readback, deterministic generator, or compatibility metadata.
- Text authoring, voice-to-plan, active-plan refresh/apply, JSON import/apply, and canonical
  persistence.
- Browser QA, DB/schema changes, migrations, Supabase mutation, or frontend changes.

Validation expected for Slice 10A:

- Source proof:
  `rg "ai-first-plan-draft-authoring|ai-first-plan-draft-v1|strict_draft|strict-draft" src scripts package.json`.
- Import proof:
  product runtime no longer imports strict nested prompt/schema/normalizer ownership, while doctrine
  harness still can validate historical strict nested fixtures.
- `npm exec eslint -- src/lib/ai-first-plan-*.ts src/lib/first-plan-actions.ts scripts/validate-plan-authoring-doctrine.ts scripts/plan-authoring-doctrine/first-plan-release-gates.ts scripts/author-ai-first-plan-draft.ts`.
- `node ./node_modules/.bin/tsx scripts/validate-plan-authoring-doctrine.ts`.
- `npm run author-ai-first-plan-draft -- --mock-openai --contract blueprint --trace-blueprint`.
- `npm run author-ai-first-plan-draft -- --mock-openai --contract envelope`.
- `npm run author-ai-first-plan-draft -- --contract strict-draft` must remain bounded
  `unsupported_contract`.
- `node --import tsx ./scripts/validate-plan-preset-eligibility.ts`.
- `git diff --check`.
- `npm run build`.

### 2026-06-09 Cleanup Resume Audit

Status:

architecture decision complete; next backend gate selected.

Scope decision:

Service-size cleanup can resume in parallel with the DS workout-library playground only as narrow
source/runtime cleanup.

What changed since the previous pause:

- The DS workout-library playground is now a separate active plan routed to RUNNING COACH first:
  [Hito DS Workout Library Calendar And Detail Playground](2026-06-09-hito-ds-workout-library-calendar-detail-playground.md).
- The Running Plan Creation Engine Rebuild remains the plan-creation owner:
  [Running Plan Creation Engine Rebuild](2026-06-08-running-plan-creation-engine-rebuild.md).
- The rebuilt selected-plan preview path is stable enough for audit:
  - accepted 10K selected-plan preview
  - backend-validated Half Marathon and Marathon Base preview builders
  - frontend-selected preview wiring for 10K, Half Marathon, and Marathon Base
  - Marathon Base visible-copy fix passed QA re-validation per latest handoff context
- The rebuild is still preview-focused:
  no create/confirm/persistence path has been accepted for the new running-plan engine.

Current service-size/hotspot evidence:

| Area | Approx lines / evidence | Classification | Decision |
| --- | ---: | --- | --- |
| [Plan authoring doctrine validator](../../../scripts/validate-plan-authoring-doctrine.ts) | about `7263` lines | oversized QA harness | keep; decompose later, do not delete |
| [Hito styles](../../../src/styles.css) | about `5206` lines | broad styling owner | defer; not the safest plan-creation cleanup gate |
| [Hito DS route](../../../src/routes/hitoDS.tsx) | about `4770` lines | broad DS route owner | defer; DS workout-library track is separate |
| [Plan Preset algorithmic builder](../../../src/lib/plan-presets/algorithmic-builder.ts) | about `1795` lines | old product-failed builder still used by old review/confirm helpers and harnesses | audit before deleting; do not touch builder in this gate |
| [Onboarding gate](../../../src/components/OnboardingGate.tsx) | about `1107` lines | broad frontend orchestrator | defer; frontend decomposition can happen after plan-creation ownership stabilizes |
| [Structured plan constructor](../../../src/components/onboarding/StructuredPlanConstructor.tsx) | about `964` lines | broad setup component | defer; no behavior cleanup selected |
| [Running plan 10K builder](../../../src/lib/plan-creation-engine/ten-k-builder.ts) | about `974` lines | accepted preview engine code | keep; do not touch in cleanup gate |
| [Running plan preview shared builder](../../../src/lib/plan-creation-engine/preview-builder-shared.ts) | about `801` lines | accepted preview engine shared logic | keep; do not touch in cleanup gate |
| [Training API facade](../../../src/lib/training-api.ts) | about `656` lines | compatibility facade with stale exports | audit target; select one stale export group only |

Runtime/source proof before backend demotion:

- [Onboarding gate](../../../src/components/OnboardingGate.tsx) imports and uses
  `getPlanPresetCards(...)` and `previewRunningPlanDraft(...)`.
- [Plan Preset panel](../../../src/components/onboarding/PlanPresetPanel.tsx) renders card selection
  and opens [Selected running plan preview dialog](../../../src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx).
- Source scan found no frontend imports of `reviewPlanPresetDraft(...)` or
  `confirmPlanPresetDraft(...)`.
- Before this backend slice, [Training API facade](../../../src/lib/training-api.ts) still re-exported
  `reviewPlanPresetDraft(...)`, `confirmPlanPresetDraft(...)`, and their result types from
  [Plan Preset actions](../../../src/lib/plan-preset-actions.ts).
- Before this backend slice, [Plan Preset actions](../../../src/lib/plan-preset-actions.ts)
  implemented the old
  mutation-capable `plan_preset_v1` review/confirm path through
  [active plan persistence](../../../src/lib/active-plan-persistence.ts).
- The accepted selected-plan preview path now lives in
  [running plan engine actions](../../../src/lib/running-plan-engine-actions.ts), dispatching to the
  accepted preview builders in [plan creation engine](../../../src/lib/plan-creation-engine/).

Candidate classification:

| Candidate | Bucket | Reason | Decision |
| --- | --- | --- | --- |
| Demote old Plan Preset `reviewPlanPresetDraft` / `confirmPlanPresetDraft` runtime-facing exports | delete/demote now | no current frontend caller; still mutation-capable; old Plan Preset create path is product-failed while new engine has no confirm contract | selected next gate |
| Delete old Plan Preset builder files | audit first | builder is product-failed but still connected to old review/confirm/harnesses; deletion before demoting mutation seam is too broad | defer |
| Demote strict nested `ai-first-plan-draft-v1` | audit first | still valid from prior source map, but less urgent than removing stale product-failed preset mutation exposure | keep as later Slice 10A candidate |
| Narrow broad `training-api.ts` facade generally | audit first | facade contains many live compatibility exports; broad narrowing could break route imports | narrow only the stale Plan Preset review/confirm group |
| Decompose doctrine validator | keep | large but protects many contracts; not runtime bloat | later decomposition |
| Decompose `/hitoDS` route or CSS | defer | useful cleanup, but parallel DS workout-library track is already active and isolated | do not mix |
| Active/archive stale plan duplicates | audit first | still visible duplicates exist for heart-rate and voice-to-plan plans | handle as docs cleanup later, not the next runtime cleanup gate |

Selected next cleanup gate:

`BACKEND Slice: stale Plan Preset review/confirm mutation seam demotion`.

Implementation boundary:

- Remove or demote runtime-facing `reviewPlanPresetDraft(...)` and `confirmPlanPresetDraft(...)`.
- Preserve `getPlanPresetCards(...)`.
- Preserve `previewRunningPlanDraft(...)`.
- Preserve the new preview-only [plan creation engine](../../../src/lib/plan-creation-engine/).
- Preserve canonical [active plan persistence](../../../src/lib/active-plan-persistence.ts).
- Preserve low-level old Plan Preset fixture/harness coverage only if needed as regression evidence,
  but do not leave the stale create action as a product-facing runtime seam.
- If a stale caller attempts old Plan Preset review/confirm, return a bounded unsupported/preview-only
  result instead of persisting a product-failed plan.

Why this is the safest first gate:

- It does not touch new preview builders, DS playground work, provider ingest, DB/schema, or
  canonical persistence.
- It removes a stale mutation-capable path before any new create path is implemented.
- It matches the current product state: selected-plan preview is allowed, but create/confirm is not.
- It is smaller and safer than deleting the old Plan Preset builder or narrowing the whole
  `training-api.ts` facade.

Validation expected:

- `rg "reviewPlanPresetDraft|confirmPlanPresetDraft" src scripts package.json`.
- `rg "getPlanPresetCards|previewRunningPlanDraft" src/components src/lib`.
- Targeted ESLint for changed backend/source files.
- `node --import tsx ./scripts/validate-running-plan-engine-source.ts`.
- `node --import tsx ./scripts/validate-running-plan-engine-10k-builder.ts`.
- `node --import tsx ./scripts/validate-running-plan-engine-r6-builders.ts`.
- `npm run validate-admin-capture-backlog`.
- `git diff --check`.
- `npm run build`.

Still gated / forbidden:

- no new running-plan confirm/persistence implementation
- no Supabase mutation
- no DB/schema/migration changes
- no provider ingest/sync changes
- no DS workout-library implementation changes
- no manual workout CRUD
- no new preset families
- no deletion of accepted preview engine builders
- no broad Plan Preset builder deletion until mutation demotion and replacement coverage are proven

### Slice 7: Package Manager Signal Cleanup

Owner:

BACKEND

Scope:

- decide npm vs Bun
- remove mixed lockfile signal if safe
- validate build if package metadata changes

### Slice 8: `training-api.ts` Import Map And First Narrowing

Owner:

BACKEND

Scope:

- classify all `@/lib/training-api` imports
- move one safe action group to direct owner imports
- remove dead re-export only when no imports remain

### Slice 9: Plan-Creation Path Classification

Owner:

ARCHITECT / BACKEND

Scope:

- classification completed in `Slice 9: Plan-Creation Source Map And First Deletion Gate`
- selected first gate is strict nested `ai-first-plan-draft-v1` demotion from product runtime
  ownership
- paused because real Plan Preset acceptance failed; resume only after corrected selected-distance
  endpoint and watch-executable metric contract is implemented and QA-passed

### Slice 10: First Code Deletion/Demotion

Owner:

BACKEND

Scope:

- execute `BACKEND Slice 10A: demote strict nested ai-first-plan-draft-v1 out of product runtime
  ownership` only after Plan Preset contract correction QA passes
- preserve blueprint, Plan Preset, review/confirm, persistence, and metric-truth behavior

### Slice 11: Script/Validator Decomposition

Owner:

BACKEND / QA

Scope:

- extract one script hotspot responsibility
- keep command stable
- preserve assertions

### Slice 12: Hito DS Wrapper Usage Audit

Owner:

FRONTEND

Scope:

- classify UI wrappers/dependencies
- delete unused wrappers only with source proof
- no UI redesign

Result, 2026-06-08:

- Deleted unused stock shadcn UI wrappers from [UI primitives](../../../src/components/ui/) after
  import proof showed no live product, admin, Hito DS, script, or package imports.
- Deleted two confirmed-unused helper files:
  [browser Supabase client](../../../src/lib/supabase/browser.ts) and
  [workout result import archive helper](../../../src/lib/workout-result-import/archive.ts).
- Removed only dependencies whose remaining source hits were package metadata or the deleted stock
  wrappers, including unused form, command, carousel, OTP, resizable, chart, drawer, and unused
  Radix primitive packages.
- Preserved live Hito DS/product primitives such as dialog, dropdown menu, popover, select,
  tooltip, sheet, skeleton, calendar, button, avatar, progress, metadata tag, and Hito-specific
  date/time/toast/calendar-day components.
- `package.json` and `package-lock.json` were updated through npm package-lock metadata sync.
  `bun.lockb` was not regenerated in this environment because the Bun CLI was unavailable; the
  separate package-manager-signal slice remains the right owner for deciding whether to remove or
  canonicalize the Bun lockfile.
- Validation for this slice: targeted ESLint for `src/components`, `src/lib`, and `package.json`,
  Admin Backlog deterministic validator, import/dead-code proof scans, `git diff --check`, and
  production build.

### Slice 13: Closeout

Owner:

ARCHITECT / QA

Scope:

- record reductions
- update changelog only for shipped/product-visible or meaningful internal reliability changes
- archive the plan if no active simplification slices remain

## QA Expectations

Docs-only slices:

- targeted `git diff --check`
- admin backlog importer dry-run if markdown source state changes
- admin backlog validator if mirror-relevant docs changed

Code behavior-preservation slices:

- targeted ESLint for touched files
- relevant harness command
- `git diff --check`
- `npm run build`

Browser QA:

- only required if UI behavior changes
- use built-in Codex browser first
- Safari fallback only when needed by QA policy
- for Slice 3A, check both `/admin/analytics` and `/admin/capture` so the shared shell does not
  regress on either side
- for Slice 3C, check both `/admin/analytics` and `/admin/capture` for sidebar brand baseline,
  compact page headers, contextual actions, bottom-left admin account menu, mobile layout, and no
  horizontal overflow
- for Slice 3D, check `/hitoDS` across Overview, Foundations, Components, Patterns, modal/dialog
  playground, calendar/workout playground, and any Live View/equivalent section; verify shared
  playground anatomy, stable sidebar/nav behavior, reduced nested borders/cards, shared
  captions/footers, reachable controls, preserved deep links, and 375px mobile no-overflow

## Risks

- Touching in-flight Plan Preset files could break current plan creation work.
- Removing compatibility exports too early could break TanStack serverFn eligibility or route imports.
- Deleting diagnostic authoring paths without doctrine coverage could weaken safety.
- Removing Hito DS wrappers blindly could increase route-local UI rather than reduce complexity.
- Lockfile cleanup without checking CI/deploy assumptions could create install drift.
- Active/archive cleanup could accidentally discard newer closeout evidence if duplicates are not
  compared first.
- Treating active plans as backlog wrapper tasks would keep duplicating markdown truth instead of
  fixing Admin Backlog visibility.
- Leaving Admin shell/helper copy route-local would keep Work items feeling like a separate app even
  after the unified work-item model is implemented.
- Keeping global utilities in the page header would make contextual Admin actions unclear and could
  conflict with future debugger/capture-overlay entry points.
- Treating `/hitoDS` state coverage as visual approval would keep shipping heavy, nested specimen
  layouts that contradict the product's low-card direction.
- Creating a new playground framework instead of normalizing the existing Hito DS specimen/sidebar
  seams would add another UI system to maintain.
- Treating fixed 10/12/16 week Plan Preset fixtures as the product target would preserve
  template-like, support-heavy plans and hide training-quality risk across all shipped preset
  families.
- Encoding body-size/load adjustment without Running Coach doctrine could create unsafe,
  body-shaming, or medically suggestive product behavior.

## Exit Criteria

- The Plan Preset track is either complete or explicitly paused before code cleanup begins.
- `docs/plans/active/` contains only real active execution plans.
- Admin Backlog has one repo work-item model where backlog items, active plans, specs, briefs, and
  archived plans are distinguishable without duplicate wrapper markdown.
- Admin analytics, users/test accounts, and Work items share one stable Admin shell/navigation
  contract with one selected item and one consistent helper pattern.
- Admin chrome separates sidebar identity, page title/subtitle, contextual section actions, and
  account/profile actions without oversized workspace banners or route-specific shell cards.
- `/hitoDS` playgrounds share one workbench anatomy for section header, preview/stage, controls, and
  caption/footer; they avoid nested card soup and preserve stable nested navigation.
- No-watch/unknown execution support is no longer a normal new-plan onboarding option, while legacy
  `none`, `unknown`, and `effort_only` readback remains bounded compatibility.
- Plan Preset shipped-family quality is either rebuilt through the rich adaptive program model or
  explicitly paused with current fixed-duration presets classified as insufficient quality.
- Package-manager signal is singular and documented.
- `training-api.ts` has fewer compatibility responsibilities or an explicit remaining-export map.
- Plan creation paths are classified by production/internal/ops/QA/legacy/delete status.
- At least one stale or duplicate seam is deleted or demoted after validation.
- Script/validator ownership is clearer without weakening checks.
- No product behavior changes accidentally.
- No fake metric truth, AI fallback leak, or frontend-owned plan truth is introduced.

## Blockers

- No blocker for Slice 1 docs/source-of-truth cleanup.
- Product-code cleanup is no longer blocked by Admin simplification dirty work; Slice 3B committed
  and pushed the scoped Admin simplification work.
- Remaining dirty instruction/skill updates and older untracked active-plan docs must stay outside
  watch-required implementation unless the user separately approves committing or resolving them.
- Admin Backlog importer dry-run now completes cleanly after the stale PDF active file was removed.
  Live import was not run because the dry-run reported no required mirror changes.
- Admin shell/navigation unification is implemented and QA-passed.
- Slice 3C Admin chrome refinement is implemented and QA-passed.
- Slice 3D `/hitoDS` playground consistency normalization is implemented, QA-passed, and
  design-approved.
- Backend Slice 6 card-to-review QA follow-up is implemented locally:
  - fixed the resolver/review-builder contract gap where `reviewReady: true` cards could fail
    `buildPlanPresetReviewDraftContract(...)`
  - kept 2-day 10K supported with conservative recovery-first composition instead of unsafe forced
    midweek specificity
  - kept 2-day Half review-ready cases supported by using long-run steady-finish specificity rather
    than placing controlled tempo on the protected post-long-run slot
  - expanded structured preparation horizon validation to support the 25-week marathon beginner
    preset scenario instead of silently truncating it
  - added full source-matrix review-ready harness coverage: 36 review-ready scenarios, 0 draft-build
    failures
  - Plan Preset CSV artifacts are now resolved through source and packaged output candidates, with
    build finalizer copy/validation retained for local and Vercel output

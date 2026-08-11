# Current Release Candidate Final Global QA

## Work Item ID

2026-08-11-current-release-candidate-final-global-qa

## Status

completed

## Type

global-qa

## Priority

urgent

## Owner

qa

## Mode

Tracked

## Scope

Independent local acceptance of the complete current Hito release candidate after all active
runtime-source work settles. This is the final local Global QA gate before any later Git or hosted
release action.

It validates the assembled current working tree. It does not commit, push, deploy, apply hosted
migrations, mutate Vercel, or claim hosted/release readiness.

## Stage

Final local Global QA completed against the frozen assembled candidate after the Backend
persistence/fixture repair and shared Design System neutral-chrome migration.

## Next Recommended Role

product

## Archive Intent

retain_in_place

## Task

Determine whether the current assembled local product is ready to advance to intentional Git and
hosted release steps. Test behavior rather than individual owner receipts alone.

The QA target includes the accepted Calendar/Plans lifecycle and overflow actions, runner-local
calendar truth, onboarding and BPM guidance, saved plans, workout/FIT readback, authenticated
Product UI, current Hito Design System interactions, the Vercel parity-gate source correction, and
the current release-candidate migrations.

## User Request

Ivan requested final QA before preparing the product for release. A pass must mean the fixed source
snapshot was independently validated locally. It must not imply that the dirty candidate was
committed, hosted migrations were applied, or Vercel production deployment succeeded.

## Current Evidence

- The stale deployment validator expectation was corrected to the canonical
  `apply_reviewed_plan_persistence` seam. Its linked hosted parity check still reports the current
  uncommitted migration `20260811125538` as missing remotely; that is a later hosted release step,
  not a local QA pass condition.
- The Calendar overflow item records focused persistence/browser proof, while the full local
  backend suite had an earlier incomplete run caused by unrelated `55 !== 56` drift.
- Multiple accepted Frontend and Design System slices are present in the same dirty checkout. A
  prior receipt is inherited evidence only until the current assembled candidate is checked.
- Design System Stage 2 source work may still be active at QA dispatch. QA must not run final
  acceptance on a moving runtime source snapshot.

## Release-Candidate Freeze Discriminator

Before final validation, QA must record:

1. the exact `git diff --name-only` and untracked inventory;
2. the current current-task statuses and any active runtime-source owner; and
3. the same inventory immediately before the final verdict.

If a runtime, schema, migration, validator, or Product/DS source owner changes the candidate during
the gate, QA stops the final verdict and records `blocked` with the changed paths. Documentation-only
research updates do not invalidate a snapshot unless they alter the acceptance contract.

## Required Acceptance Inventory

| Layer                        | Required proof                                                                                                                                                                                                                                             |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source and Git hygiene       | Snapshot inventory, `git diff --check`, no unintended generated/secret/runtime artifact; each task-owned change maps to a canonical item                                                                                                                   |
| Backend/Supabase             | Current `validate:backend:local-db` and scoped canonical fixture/readback lifecycle; preserve retained FIT evidence and use only safe disposable identities                                                                                                |
| Product and DS contracts     | Current `validate-product-contracts`, `validate-hito-ds-components`, manual authoring and runner-calendar context contracts when their changed seams require them                                                                                          |
| Build and Vercel source gate | Fresh uncontended `npm run build`, output-integrity validation, and source proof that the deployment parity gate requires the canonical RPC rather than the retired wrapper                                                                                |
| Runtime                      | Fresh managed loopback `qa_fixture` server, health/freshness/receipt match, authenticated and unauthenticated boundaries, provider isolation, and privacy/readback checks                                                                                  |
| Browser                      | Browser Path Preflight; desktop and exact 375px in available themes for onboarding/manual entry, Calendar/overflow actions, saved plans, Workout/FIT readback, History/Progress, and meaningful shared DS interactions; no overflow or console/page errors |
| Safety                       | Past/FIT/history truth remains protected; no provider dispatch, hosted access, deployment, Git mutation, or unsupported destructive action is performed                                                                                                    |

## What Not To Touch

- No Product, Backend, Frontend, Design System, migration, script, dependency, lockfile, fixture,
  host, Vercel, Supabase, or Git source change.
- Do not apply hosted migrations, call paid providers, use production data, stage/commit/push/deploy,
  or delete retained FIT/evidence/history data.
- Do not repair failed tests. State the first incorrect owner and exact replay instead.
- Do not treat an earlier local or hosted receipt as passing the current candidate without an
  evidence-valid snapshot.

## Pass Condition

`Global QA Acceptance: Passed` is permitted only if the candidate stays frozen and every required
local check passes, with browser/fixtures proving the assigned cross-flow inventory. A failed or
blocked check yields `Verdict: Failed` or `blocked` with coverage consequence. Hosted/release
readiness remains unclaimed in either local outcome.

## Exact QA Handoff

```text
ROLE: QA

Mode: Tracked
Validation layer: Final local Global QA acceptance for one stable current release candidate.

Execute:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-current-release-candidate-final-global-qa.md`

Read AGENTS.md, agents/qa.agent.md, the complete canonical item,
skills/hito-qa-browser-regression/SKILL.md, and
skills/hito-backend-supabase-contract/SKILL.md before validation.

You do not implement or repair source. First create a release-candidate freeze receipt: inventory
the current tracked/untracked paths, task statuses, and active runtime-source owners. If source is
still moving, wait without changing it; record a blocked verdict rather than testing a moving
candidate. Recheck that inventory immediately before final verdict.

Once frozen, run the exact risk-derived inventory in the canonical item: current local backend DB
and relevant fixture/readback contracts; Product/DS/manual/calendar contracts; an uncontended
production build and output-integrity gate; managed loopback qa_fixture runtime with auth/privacy/
provider boundaries; and browser desktop plus exact 375px flows for onboarding/manual entry,
Calendar overflow, saved plans, Workout/FIT readback, History/Progress, and applicable shared
interactions. Use any supported local browser route without user approval; abandon a path that opens
a platform permission dialog and use another supported local path.

Preserve the retained FIT acceptance record and use only safe disposable local identities. Do not
edit code/schema/migrations/fixtures, apply hosted migrations, touch Vercel/production, call paid
providers, stage/commit/push/deploy, or delete material data. A failed check must name the exact
replay and first owner; do not fix-forward it.

Use Russian commentary and an English final QA receipt with
Check | Scenario / environment | Result | Evidence, coverage gaps, and exactly one Verdict: Passed or Verdict: Failed. Local Global QA does
not claim hosted parity, deployment, or release readiness.
```

## Release-Candidate Freeze Receipt — 2026-08-11

### Execution preflight

- Validation layer: final local Global QA acceptance of one stable dirty working-tree candidate.
- Candidate boundary: current `main` at `23d657b3003433a2a051b505fd48645fce6692ca`, which equals
  local `origin/main`; the index is empty.
- Mutation boundary: QA may update this receipt, use disposable local fixture state, operate one
  managed loopback runtime, and capture ignored QA evidence. Product/runtime source, schema,
  migrations, fixtures, dependencies, retained FIT evidence, Git lifecycle, hosted state, Vercel,
  and providers remain untouched.
- Stop discriminator: any runtime/schema/migration/validator/Product/Design System candidate change
  between this freeze and the final verdict invalidates the gate. The QA receipt itself and ignored
  QA screenshots are excluded from the source-content hash but remain visible in the path inventory.

### Frozen inventory

The index is empty. `git diff --check` and `git fsck --full --no-dangling` passed. Two snapshots five
seconds apart produced the same tracked diff digest
`7761f9b57a9083e41bc3981ddb1783a977b3c654ee8b45d24c18a329375bb131` and the same untracked
non-receipt content digest `ab22aa04fe9a8abc27e1d2a9bbc6236696fa5ff44da50d4574554d690dfc4c07`.

Tracked modified paths (51):

```text
docs/plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md
scripts/manual-workout-authoring/empty-plan-proof.ts
scripts/running-plan-engine-confirm/persistence-proof.ts
scripts/validate-active-plan-schedule-edit-preview.ts
scripts/validate-backend.mjs
scripts/validate-hito-ds-component-contracts.ts
scripts/validate-supabase-deployment-parity.mjs
src/components/AppShell.tsx
src/components/Calendar.tsx
src/components/OnboardingGate.tsx
src/components/hito-ds/calendar-workout-playground.tsx
src/components/hito-ds/dropdown-family-playground.tsx
src/components/hito-ds/editable-value-field-sandbox.tsx
src/components/hito-ds/motion-system-playground.tsx
src/components/hito-ds/playground.tsx
src/components/hito-ds/reference-components-controls.tsx
src/components/hito-ds/reference-components-overlays.tsx
src/components/hito-ds/reference-components-structure.tsx
src/components/hito-ds/reference-foundations-page.tsx
src/components/hito-ds/reference-model.ts
src/components/hito-ds/reference-navigation.tsx
src/components/hito-ds/reference-overview-page.tsx
src/components/hito-ds/reference-page.tsx
src/components/hito-ds/reference-pattern-inline-editing.tsx
src/components/hito-ds/reference-patterns-page.tsx
src/components/hito-ds/slider-playground.tsx
src/components/hito-ds/workout-library-playground.tsx
src/components/onboarding/OnboardingRunnerBaseline.tsx
src/components/onboarding/PlanPresetPanel.tsx
src/components/onboarding/QuickSetupPlanSetupSections.tsx
src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx
src/components/onboarding/onboarding-form-model.ts
src/components/onboarding/use-onboarding-runner-baseline.ts
src/components/progress/RunnerActivityProgressExperience.tsx
src/components/settings/HeartRateProfileSection.tsx
src/components/ui/hito-dual-range.tsx
src/components/ui/hito-slider.tsx
src/components/workout-structure/WorkoutStructureTimeline.tsx
src/lib/active-plan-lifecycle-persistence.ts
src/lib/active-plan-persistence.ts
src/lib/running-plan-engine-actions.ts
src/lib/supabase/database.ts
src/routes/admin.analytics.tsx
src/routes/admin.capture.tsx
src/routes/api.plan.export.tsx
src/routes/hitoDS.tsx
src/routes/index.tsx
src/styles/controls-lists.css
src/styles/forms-onboarding.css
src/styles/foundations.css
src/styles/reference-workbench.css
```

Untracked paths (31):

```text
docs/tasks/backlog/2026-08-10-hito-ds-interactive-workbench-source-simplification.md
docs/tasks/backlog/2026-08-10-hito-ds-showcase-navigation-and-catalog-ia.md
docs/tasks/backlog/2026-08-10-hosted-supabase-parity-and-current-main-production-deploy.md
docs/tasks/backlog/2026-08-11-app-shell-header-borderless-strong-blur.md
docs/tasks/backlog/2026-08-11-calendar-overflow-future-workout-actions.md
docs/tasks/backlog/2026-08-11-current-release-candidate-final-global-qa.md
docs/tasks/backlog/2026-08-11-generated-plan-ready-review-dialog-hierarchy-and-chrome.md
docs/tasks/backlog/2026-08-11-generated-plan-review-title-start-spacing.md
docs/tasks/backlog/2026-08-11-hito-ds-overview-header-top-border-removal.md
docs/tasks/backlog/2026-08-11-hito-ds-overview-hierarchy-and-chrome-cleanup.md
docs/tasks/backlog/2026-08-11-hito-ds-reference-dead-legacy-deletion-sweep.md
docs/tasks/backlog/2026-08-11-hito-ds-showcase-card-borderless-surface.md
docs/tasks/backlog/2026-08-11-hito-ds-slider-marker-lane-and-smooth-motion.md
docs/tasks/backlog/2026-08-11-hito-ui-chrome-color-role-rationalization-discovery.md
docs/tasks/backlog/2026-08-11-onboarding-bpm-guidance-unblocked-presentation.md
docs/tasks/backlog/2026-08-11-onboarding-generated-plan-layout-polish.md
docs/tasks/backlog/2026-08-11-onboarding-heart-rate-guidance-auto-reveal.md
docs/tasks/backlog/2026-08-11-onboarding-inspector-visual-batch.md
docs/tasks/backlog/2026-08-11-onboarding-plan-start-surface-and-manual-polish.md
docs/tasks/backlog/2026-08-11-onboarding-running-level-shared-marker-adoption.md
docs/tasks/backlog/2026-08-11-release-candidate-vercel-parity-gate-and-source-hygiene.md
docs/tasks/backlog/2026-08-11-retire-hito-canvas-atmosphere.md
docs/tasks/backlog/2026-08-11-selected-plan-calendar-flat-day-and-legend-chrome.md
docs/tasks/backlog/2026-08-11-workout-structure-timeline-independent-blocks.md
docs/tasks/backlog/assets/2026-08-11-generated-plan-ready-review-dialog-hierarchy-and-chrome/inspector-batch.txt
docs/tasks/backlog/assets/2026-08-11-hito-ds-showcase-card-borderless-surface/astryx-components-reference.png
docs/tasks/backlog/assets/2026-08-11-onboarding-slider-and-bpm-inspector/onboarding-running-level-and-bpm-dark-1470x801.png
scripts/validate-calendar-overflow-future-actions.ts
src/components/calendar/CalendarOverflowActions.tsx
src/lib/calendar-overflow-actions.ts
supabase/migrations/20260811125538_clear_calendar_future_workouts.sql
```

### Task and runtime-owner state

- Frontend Product-owned Calendar, onboarding, shell, workout, and Progress changes map to completed
  2026-08-11 items. No active Frontend runtime-source owner was found.
- Backend-owned Calendar overflow and manual/persistence work maps to completed implementation
  receipts. The release-candidate parity item remains `in_progress` only because its source
  correction is complete and this QA/release sequence is pending; its next owner is QA.
- Design System runtime changes map to completed receipts or blocked items. The showcase IA item is
  blocked on an approved external library URL. The canvas-atmosphere retirement is blocked on its
  documented light-theme page/card contrast boundary; neither item has an active source executor.
- The only active owner for this release-candidate gate is QA. The two listed subagents are already
  completed remnants of an earlier task and perform no work on this candidate.

Freeze result: the release candidate is stable enough to begin the required local acceptance
inventory. The documented blocked Design System contrast boundary remains a required browser
discriminator rather than an assumed pass.

## Final Local Global QA Receipt — 2026-08-11

### Validation layer and browser preflight

This was final local Global QA acceptance for the frozen current dirty release candidate. It was not
hosted, deployment, production, or release acceptance.

The canonical build owner stopped the prior stale managed process during prebuild. QA then started
one fresh managed server, detected its default `real` provider mode before any browser navigation or
generation, and restarted that same managed process as `qa_fixture`. The tested server was
loopback-bound, compatible, healthy, receipt-matched, and artifact-fresh. Browser evidence used the
non-prompting Codex in-app browser at `1280x800` and exact `375x812`, in light and dark themes. The
server was stopped cleanly after browser/runtime proof.

### Issues

1. The canonical local Backend database suite stops at check 15/20. Exact replay:
   `npm run validate:backend:local-db`. `running-plan-confirm-persistence` throws
   `AssertionError: 55 !== 56` at
   `scripts/running-plan-engine-confirm/persistence-proof.ts:180`.
2. The named design-profile lifecycle cannot converge after reset. Exact replay:
   `npm run local:design-profile:reset` reaches zero owned rows, then
   `npm run local:design-profile:seed` throws
   `CalendarPersistenceRejection: Future schedule materialization accepts only reviewed future rows`
   through `scripts/lib/runner-design-profile-fixture.ts:188` and
   `src/lib/active-plan-lifecycle-persistence.ts:158`.
3. `npm run validate:backend:runtime -- --runtime-url=http://127.0.0.1:3000` reproduces the same
   fixture failure at check 16/17 (`runner-activity-read-models-runtime`).

The first incorrect canonical owner is Backend validation/fixture alignment. The reviewed plan
retains 56 immutable saved-plan rows, while the current Start/future-schedule policy legitimately
materializes 55 Calendar rows after leading-day normalization; the persistence proof still asserts
full saved-record cardinality against Calendar materialization. Separately, the design-profile
fixture passes past rows to the current future-only reviewed-schedule RPC. Product DTOs and the
observed Frontend readback are not the first incorrect owners for these failures.

### Validation inventory

| Check                          | Scenario / environment                                             | Result                                  | Evidence                                                                                                                                                                                                                                                                                   |
| ------------------------------ | ------------------------------------------------------------------ | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Initial freeze                 | Current `main` dirty candidate                                     | Passed                                  | `HEAD` and local `origin/main` were `23d657b3003433a2a051b505fd48645fce6692ca`; index empty; 51 tracked modified and 31 untracked paths; two initial snapshots matched.                                                                                                                    |
| Git/source hygiene             | Current candidate                                                  | Passed                                  | `git diff --check` and `git fsck --full --no-dangling` passed; no generated runtime output or secret became stageable.                                                                                                                                                                     |
| Backend local DB suite         | `npm run validate:backend:local-db`                                | Failed                                  | Checks 1–14 passed, including Calendar overflow with `callsOpenAi: false`; check 15 failed `55 !== 56`. Checks 16–20 did not run after fail-fast.                                                                                                                                          |
| Reviewed-plan discriminator    | Source-only confirm contract and current Start policy              | Passed discriminator / failed validator | Source-only review reports 56 rows. The current apply policy explicitly supports `omittedLeadingDayCount`; Calendar readback was 55. The assertion at persistence-proof line 180 is stale against that separation.                                                                         |
| Named fixture reset            | `qa-saved-plan@local.test`                                         | Passed                                  | Reset preserved the auth user and reached zero across every owned table/object. A final cleanup reset left the identity at zero with no partial rows.                                                                                                                                      |
| Named fixture seed/convergence | `npm run local:design-profile:seed`                                | Failed                                  | The fixture sends past rows through `materializeFirstReviewedPlanForUser`; the future-only RPC rejects them with `invalid_input`. Status, reseed, and repeated status could not run.                                                                                                       |
| Backend runtime suite          | Fresh managed `qa_fixture` server                                  | Failed                                  | Checks 1–15 passed, including runner-activity foundation runtime; check 16 reproduced the fixture seed rejection. Check 17 did not run after fail-fast.                                                                                                                                    |
| Product contracts              | `npm run validate-product-contracts`                               | Passed                                  | Heart-rate guidance editor and Workout comparison readback passed.                                                                                                                                                                                                                         |
| Design System contracts        | `npm run validate-hito-ds-components`                              | Passed                                  | Current contract passed across 322 scanned files.                                                                                                                                                                                                                                          |
| Production build               | Uncontended current candidate                                      | Passed                                  | Client, SSR, Nitro, and postbuild completed. Standard dependency/chunk warnings were non-gating.                                                                                                                                                                                           |
| Build output integrity         | Receipt-inclusive assembled local artifact                         | Passed                                  | 209 MJS files and 3,075 relative imports; the final receipt-inclusive rebuild and integrity gate completed after this receipt update.                                                                                                                                                      |
| Vercel parity source gate      | Local source/migration/runtime map                                 | Passed locally                          | The gate and runtime require `apply_reviewed_plan_persistence`; the retired wrapper remains only in its migration drop/history. Linked hosted parity was not called.                                                                                                                       |
| Managed runtime                | `http://127.0.0.1:3000`                                            | Passed                                  | PID 54597 was managed, compatible, loopback-bound, healthy, `providerMode: qa_fixture`, and `receipt_matches`; it was stopped after proof.                                                                                                                                                 |
| Authentication boundary        | Local sign-out/login and retained tester                           | Passed                                  | Signed-out UI exposed only login/signup. Ordinary local login restored `fit-product-acceptance@local.test`; no Product data appeared while signed out.                                                                                                                                     |
| Calendar and overflow          | Desktop dark; exact 375px dark                                     | Passed for non-destructive flow         | Calendar and overflow menu were contained. Menu exposed private download, upload, new-plan, and delete-future actions; private Calendar download produced a browser download. Delete/upload/start were not submitted against retained FIT data.                                            |
| Manual entry                   | Empty future Calendar day, desktop and 375px                       | Passed                                  | `Start from scratch` opened the real Manual workout dialog. It started empty, required a workout type/block, kept Review disabled, focused Close, and remained inside both viewports. No draft was saved.                                                                                  |
| Activity History               | Retained FIT activity, desktop and 375px                           | Passed                                  | Jul 30 showed 5.1 km, 45 min, 134 bpm, Garmin source, owner source controls, and the Easy Run relationship. Drawers remained contained.                                                                                                                                                    |
| Workout/FIT readback           | `/workout/2026-08-10?tab=feedback`, desktop and 375px              | Passed                                  | Observed run showed Jul 30, 45 min, 5.11 km, +25/-33 m, 134/145 bpm, 262/371 W, 69 spm, 454 kcal, and 3 intervals. Plan vs run exposed only prescribed comparison rows and truthfully stated the 11-day date difference. No raw storage path, fingerprint, or service credential rendered. |
| Progress                       | Retained FIT identity, desktop and 375px                           | Passed                                  | One run / 45 min / 5.1 km and 25 m elevation agreed with persisted readback. Detailed metrics truthfully remained unavailable because detailed samples are not persisted.                                                                                                                  |
| Saved Plans                    | Two retained records, desktop and exact 375px                      | Passed for non-destructive flow         | Two immutable records rendered, name search narrowed to `10K plan`, private JSON download fired, and Start/Hide actions were exposed. The 375px table owned its 860px internal scroll while document width stayed 375px.                                                                   |
| Onboarding                     | Existing zero-row baseline identity, desktop light and 375px light | Passed for non-persistent flow          | Real onboarding rendered baseline, running-level slider, and BPM guidance gating. Age inline edit focused the Age input and Escape cancelled it; no profile or plan was persisted.                                                                                                         |
| Shared interactions            | `/hitoDS/components#slider`, light/dark, desktop/375px             | Passed for executed interactions        | Single baseline restored `6 -> 4`; dual endpoints restored independently `4–7 -> 3–7 -> 3–8`. Both themes and the exact narrow viewport remained contained.                                                                                                                                |
| Page/console containment       | All executed Product/DS routes                                     | Passed                                  | Every measured document/body width equalled the active viewport; the only horizontal scroll was the explicit Plans table container. Browser error logs were empty.                                                                                                                         |
| Retained FIT guard             | Before/after DB and private-storage readback                       | Passed with derived-read note           | Raw source stayed available, revision 1, 80,050 bytes, SHA-256 `bb2737da162532126808613d6ae7a69655b5175be0964a3311f60d89c2bc58d6`; activity/evidence/match counts and facts were unchanged. Ordinary Progress readback materialized one canonical metric snapshot and observation.         |
| Disposable cleanup             | QA pool inventory after failures                                   | Passed                                  | All five pool identities had zero owned rows, `qa-saved-plan` remained zero, and `leases` was empty.                                                                                                                                                                                       |
| Provider/hosted/Git safety     | Whole run                                                          | Passed                                  | Runtime was switched to `qa_fixture` before browser/generation. Fixture tripwires and Calendar proof reported no provider dispatch. No hosted access, Vercel call, dependency mutation, stage, commit, push, deployment, or material deletion occurred.                                    |
| Final freeze recheck           | Immediately before receipt                                         | Passed with allowed documentation note  | Tracked source diff digest remained `7761f9b57a9083e41bc3981ddb1783a977b3c654ee8b45d24c18a329375bb131`. One new Designer-owned planning-only backlog item appeared; it explicitly authorizes no source implementation and does not change the acceptance contract.                         |

### Saved browser evidence

Evidence is stored under
`qa-artifacts/screenshots/2026-08-11/current-release-candidate-final-global-qa/`.
It includes desktop/mobile Calendar and overflow, manual authoring, History/FIT drawers,
Workout/Feedback, Progress, Plans, onboarding, unauthenticated login, and light/dark Hito DS slider
captures.

### Coverage gaps and consequence

- Canonical design-profile seed, status, reseed, repeated status, and its intended cross-surface
  browser profile were not executable after the future-row rejection. This is a direct required
  acceptance failure, not an environment gap.
- Backend local-DB checks 16–20 and runtime check 17 were omitted by the fail-fast suites. Their
  successful behavior is not claimed, even though independent browser auth and retained FIT flows
  passed.
- Destructive Calendar delete/upload/new-plan and saved-plan Start/Hide were not submitted against
  the retained FIT identity after the disposable canonical fixture failed. Static/local-DB owner
  checks cover part of those contracts, but current browser mutation acceptance remains incomplete.
- The previously documented Design System light-theme page/card contrast boundary remains open in
  its blocked canonical item. This QA run captured both themes but does not close that separate
  implementation decision.
- Hosted Supabase parity, migration application, Vercel deployment, production, commit, push, and
  release readiness were outside this local gate and remain unclaimed.

Role file: `agents/qa.agent.md`.

Skills used: `skills/hito-qa-browser-regression/SKILL.md`,
`skills/hito-backend-supabase-contract/SKILL.md`, the mandatory Supabase procedure, and the
non-prompting in-app Browser control procedure.

Subagents used: none. The two listed completed subagents belonged to an earlier task and were not
reused.

Historical verdict (superseded by the repaired-candidate replay): Failed

## Restarted Release-Candidate Freeze Receipt — 2026-08-11

### Execution preflight

- Validation layer: restarted final local Global QA of the complete stable dirty local candidate.
  The prior failed receipt remains historical evidence only; implementation receipts are not
  inherited acceptance.
- Candidate boundary: `main` at `23d657b3003433a2a051b505fd48645fce6692ca`, equal to local
  `origin/main`; the index is empty.
- Snapshot: 59 tracked modified paths and 34 untracked paths. Two snapshots five seconds apart
  matched at tracked digest `541163cd31c01a62361936b5ba5209609e285609f2de6aab287df26e9b121e47`
  and untracked non-receipt digest
  `59ae8f2fa21f89229051cd90550138b199685deaf07a11a199950969d60a7967`.
- QA-owned mutations: this canonical receipt, ignored browser evidence, the existing disposable
  named fixture lifecycle, and one managed loopback runtime only. No runtime/source artifact,
  migration, schema, fixture, dependency, compatibility path, or Product/DS repair is proposed.
- Runtime boundary: the pre-existing managed process is stale, artifact-missing, and in `real`
  provider mode, so it is not acceptance evidence. QA will replace it through the named managed
  lifecycle with one fresh `qa_fixture` server before browser work.
- Stop boundary: any runtime, schema, migration, validator, Product, or Design System source change
  invalidates the gate. A required failure returns to its first incorrect owner without QA
  fix-forward. Retained FIT/history evidence, hosted state, providers, dependencies, Git lifecycle,
  and recovery material remain untouched.

### Frozen path inventory

Tracked modified paths (59):

```text
docs/plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md
scripts/lib/runner-design-profile-fixture.ts
scripts/manual-workout-authoring/empty-plan-proof.ts
scripts/running-plan-engine-confirm/persistence-proof.ts
scripts/validate-active-plan-schedule-edit-preview.ts
scripts/validate-backend.mjs
scripts/validate-hito-ds-component-contracts.ts
scripts/validate-running-plan-engine-confirm.ts
scripts/validate-supabase-deployment-parity.mjs
src/components/AppShell.tsx
src/components/Calendar.tsx
src/components/OnboardingGate.tsx
src/components/hito-ds/calendar-workout-playground.tsx
src/components/hito-ds/dropdown-family-playground.tsx
src/components/hito-ds/editable-value-field-sandbox.tsx
src/components/hito-ds/motion-system-playground.tsx
src/components/hito-ds/playground.tsx
src/components/hito-ds/reference-components-controls.tsx
src/components/hito-ds/reference-components-overlays.tsx
src/components/hito-ds/reference-components-structure.tsx
src/components/hito-ds/reference-foundations-page.tsx
src/components/hito-ds/reference-model.ts
src/components/hito-ds/reference-navigation.tsx
src/components/hito-ds/reference-overview-page.tsx
src/components/hito-ds/reference-page.tsx
src/components/hito-ds/reference-pattern-inline-editing.tsx
src/components/hito-ds/reference-patterns-page.tsx
src/components/hito-ds/slider-playground.tsx
src/components/hito-ds/workout-library-playground.tsx
src/components/onboarding/OnboardingRunnerBaseline.tsx
src/components/onboarding/PlanPresetPanel.tsx
src/components/onboarding/QuickSetupPlanSetupSections.tsx
src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx
src/components/onboarding/onboarding-form-model.ts
src/components/onboarding/use-onboarding-runner-baseline.ts
src/components/progress/RunnerActivityProgressExperience.tsx
src/components/settings/HeartRateProfileSection.tsx
src/components/ui/hito-dual-range.tsx
src/components/ui/hito-slider.tsx
src/components/ui/select.tsx
src/components/workout-structure/WorkoutStructureTimeline.tsx
src/generated/hito-ds-manifest.json
src/generated/hito-ds-manifest.ts
src/lib/active-plan-lifecycle-persistence.ts
src/lib/active-plan-persistence.ts
src/lib/running-plan-engine-actions.ts
src/lib/supabase/database.ts
src/routes/admin.analytics.tsx
src/routes/admin.capture.tsx
src/routes/api.plan.export.tsx
src/routes/hitoDS.tsx
src/routes/index.tsx
src/styles/controls-fields.css
src/styles/controls-lists.css
src/styles/forms-onboarding.css
src/styles/foundations.css
src/styles/layout-typography.css
src/styles/overlays-feedback.css
src/styles/reference-workbench.css
```

Untracked paths (34):

```text
docs/tasks/backlog/2026-08-10-hito-ds-interactive-workbench-source-simplification.md
docs/tasks/backlog/2026-08-10-hito-ds-showcase-navigation-and-catalog-ia.md
docs/tasks/backlog/2026-08-10-hosted-supabase-parity-and-current-main-production-deploy.md
docs/tasks/backlog/2026-08-11-app-shell-header-borderless-strong-blur.md
docs/tasks/backlog/2026-08-11-calendar-overflow-future-workout-actions.md
docs/tasks/backlog/2026-08-11-canonical-fixture-future-materialization-contract-repair.md
docs/tasks/backlog/2026-08-11-current-release-candidate-final-global-qa.md
docs/tasks/backlog/2026-08-11-generated-plan-ready-review-dialog-hierarchy-and-chrome.md
docs/tasks/backlog/2026-08-11-generated-plan-review-title-start-spacing.md
docs/tasks/backlog/2026-08-11-hito-ds-overview-header-top-border-removal.md
docs/tasks/backlog/2026-08-11-hito-ds-overview-hierarchy-and-chrome-cleanup.md
docs/tasks/backlog/2026-08-11-hito-ds-reference-dead-legacy-deletion-sweep.md
docs/tasks/backlog/2026-08-11-hito-ds-showcase-card-borderless-surface.md
docs/tasks/backlog/2026-08-11-hito-ds-slider-marker-lane-and-smooth-motion.md
docs/tasks/backlog/2026-08-11-hito-ds-tokenized-neutral-chrome-migration-plan.md
docs/tasks/backlog/2026-08-11-hito-ds-tokenized-neutral-chrome-migration.md
docs/tasks/backlog/2026-08-11-hito-ui-chrome-color-role-rationalization-discovery.md
docs/tasks/backlog/2026-08-11-onboarding-bpm-guidance-unblocked-presentation.md
docs/tasks/backlog/2026-08-11-onboarding-generated-plan-layout-polish.md
docs/tasks/backlog/2026-08-11-onboarding-heart-rate-guidance-auto-reveal.md
docs/tasks/backlog/2026-08-11-onboarding-inspector-visual-batch.md
docs/tasks/backlog/2026-08-11-onboarding-plan-start-surface-and-manual-polish.md
docs/tasks/backlog/2026-08-11-onboarding-running-level-shared-marker-adoption.md
docs/tasks/backlog/2026-08-11-release-candidate-vercel-parity-gate-and-source-hygiene.md
docs/tasks/backlog/2026-08-11-retire-hito-canvas-atmosphere.md
docs/tasks/backlog/2026-08-11-selected-plan-calendar-flat-day-and-legend-chrome.md
docs/tasks/backlog/2026-08-11-workout-structure-timeline-independent-blocks.md
docs/tasks/backlog/assets/2026-08-11-generated-plan-ready-review-dialog-hierarchy-and-chrome/inspector-batch.txt
docs/tasks/backlog/assets/2026-08-11-hito-ds-showcase-card-borderless-surface/astryx-components-reference.png
docs/tasks/backlog/assets/2026-08-11-onboarding-slider-and-bpm-inspector/onboarding-running-level-and-bpm-dark-1470x801.png
scripts/validate-calendar-overflow-future-actions.ts
src/components/calendar/CalendarOverflowActions.tsx
src/lib/calendar-overflow-actions.ts
supabase/migrations/20260811125538_clear_calendar_future_workouts.sql
```

### Task and runtime-owner state

- Backend repair `2026-08-11-canonical-fixture-future-materialization-contract-repair` and Design
  System migration `2026-08-11-hito-ds-tokenized-neutral-chrome-migration` are `completed` with QA
  next; their receipts are entry context only.
- `2026-08-11-release-candidate-vercel-parity-gate-and-source-hygiene` remains `in_progress` only
  because the QA and later release sequence is pending; its source correction is complete.
- `2026-08-11-retire-hito-canvas-atmosphere` remains `blocked` on its documented visual contract;
  no active source executor owns it during this gate.
- All other current implementation items in this candidate are completed or closed. The active
  execution owner is QA only. The two listed completed subagents belong to older tasks and are not
  participating in this run.

Freeze result: the candidate is stable enough to begin the restarted complete acceptance inventory.

## Restarted Final Local Global QA Receipt — 2026-08-11

### Task, stage, and validation layer

- Task: final local Global QA acceptance of the complete frozen Hito release candidate.
- Stage: restarted Global QA after the canonical fixture future-materialization repair and shared
  Design System neutral-chrome migration.
- Validation layer: independent local acceptance only. This receipt does not claim hosted Supabase
  parity, deployment, production, push, commit, or release readiness.
- Implementation DoD: the Backend and Design System implementation receipts were accepted only as
  entry context; their changed contracts were rerun independently here.

### Browser Path Preflight

QA stopped the stale managed process before the build, produced a fresh uncontended artifact, and
started exactly one managed server on `http://127.0.0.1:3000` with `providerMode: qa_fixture`.
Before browser work the server was managed, compatible, healthy, loopback-bound, artifact-fresh,
and `receipt_matches`. The authenticated browser path used the non-prompting Codex in-app browser at
`1280x800` and exact `375x812`; no platform permission dialog was raised. The unauthenticated login
boundary was proved separately. The server was stopped cleanly after the browser and runtime proof.

### Issues

No Product, Frontend, Backend, persistence, fixture, authentication, privacy, or shared Design
System defect was found in the required local inventory. The earlier Backend failures are no longer
reproducible: the complete local DB and runtime suites finish, and the named fixture converges.

The standalone manual-authoring validator was initially invoked through an npm command that did not
load `.env.local`; it correctly refused to run. The canonical direct invocation with
`node --env-file=.env.local --import tsx` passed. This was an invocation correction, not a Product
or implementation failure.

### Validation inventory

| Check                             | Scenario / environment                                                           | Result                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| --------------------------------- | -------------------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate freeze                  | Dirty `main` release candidate                                                   | Passed                         | `HEAD` and local `origin/main` remained `23d657b3003433a2a051b505fd48645fce6692ca`; index stayed empty; 59 tracked-modified and 34 untracked paths remained in scope. Two pre-receipt snapshots matched with tracked digest `cbe5ea18d24ed425cd9877cd0833498f965bbc20df9e60a186d1c4e1a43e09a3` and non-receipt untracked digest `52fd4398a1523de190d92da5b472dc1123c91008d8895e9a6b270e07a9890be3`.                                                                                                                        |
| Git/source hygiene                | Current checkout                                                                 | Passed                         | `git diff --check` and `git fsck --full --no-dangling` passed; no staged paths, source edits, dependency edits, or generated QA artifact entered Git scope.                                                                                                                                                                                                                                                                                                                                                                |
| Backend local DB                  | `npm run validate:backend:local-db`                                              | Passed                         | 20/20 checks passed, including reviewed-plan persistence, manual authoring, runner activity, Calendar context, and the repaired 56-row immutable source / 55-row future materialization distinction.                                                                                                                                                                                                                                                                                                                       |
| Canonical fixture lifecycle       | `qa-saved-plan@local.test`; reset -> seed -> status -> reseed -> repeated status | Passed                         | Reset reached zero owned rows/objects while preserving auth. Seed, status, reseed, and repeated status converged without accumulation to 55 Calendar workouts, 30 activities, 11 planned/matched, 19 unplanned, and 11 FIT-completed matched workouts; no future FIT completion appeared. Source states were 27 available, 2 removed, and 1 removal-pending.                                                                                                                                                               |
| Product contracts                 | `npm run validate-product-contracts`                                             | Passed                         | Current Product contract validator completed successfully.                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Design System contracts           | `npm run validate-hito-ds-components` and manifest parity                        | Passed                         | 322 scanned files passed; manifest parity reported 35 primitive colors, 41 semantic colors, and 18 text styles.                                                                                                                                                                                                                                                                                                                                                                                                            |
| Manual authoring contract         | Persistence-required canonical validator                                         | Passed                         | `node --env-file=.env.local --import tsx ./scripts/validate-manual-workout-authoring.ts --require-persistence` passed and released its disposable lease/state.                                                                                                                                                                                                                                                                                                                                                             |
| Calendar context contract         | `npm run validate-runner-calendar-context:local`                                 | Passed                         | Persisted runner-timezone Calendar context and local-day contract passed.                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Production build                  | Fresh uncontended local artifact                                                 | Passed                         | Client, SSR, Nitro, and postbuild completed. A final receipt-inclusive build and output-integrity pass was run after this receipt update.                                                                                                                                                                                                                                                                                                                                                                                  |
| Build output integrity            | `node ./scripts/validate-build-output-integrity.mjs`                             | Passed                         | Pre-browser proof covered 209 MJS files and 3,075 relative imports with digest `c9c38fc5d5eab0df5f67947a4e142b49537a7ee5a76379a641743b25c525ec62`; the receipt-inclusive gate also passed.                                                                                                                                                                                                                                                                                                                                 |
| Deployment-parity source          | Local migration/runtime/type reachability only                                   | Passed locally                 | The validator requires `apply_reviewed_plan_persistence`; runtime imports and invokes that RPC, generated types expose it, and migration `20260811125538_clear_calendar_future_workouts.sql` owns the current function. The retired `_with_profile_revision` wrapper remains only in migration history/drop statements. No hosted or Vercel call was made.                                                                                                                                                                 |
| Managed loopback runtime          | PID 71738, `http://127.0.0.1:3000`                                               | Passed                         | Managed, compatible, healthy, loopback-bound, `providerMode: qa_fixture`, artifact-fresh, and `receipt_matches`; stopped after proof.                                                                                                                                                                                                                                                                                                                                                                                      |
| Authenticated runtime status      | Named fixture against managed runtime                                            | Passed                         | Unauthenticated Product API readback returned 401; authenticated status returned the exact 55/30/11/19 profile, truthful Gate 5 `normalized_stream_not_persisted`, and `rawPrivateFieldsExposed: false`.                                                                                                                                                                                                                                                                                                                   |
| Backend runtime suite             | `npm run validate:backend:runtime`                                               | Passed                         | 17/17 runtime checks passed against the managed server.                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Authentication and privacy        | Sign-out/login plus ordinary Product routes                                      | Passed                         | Signed-out UI exposed only login/signup controls. Existing local identities reached the real authenticated flow. Raw storage path, bucket, source fingerprint, secret, and service credentials were absent from rendered Product UI.                                                                                                                                                                                                                                                                                       |
| Calendar and detail coherence     | `qa-saved-plan`, desktop dark and exact 375px                                    | Passed                         | August 2026 showed completed Tempo on Aug 11, skipped Easy on Aug 10, planned future workouts, Rest days, and no page overflow. Workout detail for Aug 11 agreed with Calendar and the matched Garmin FIT readback.                                                                                                                                                                                                                                                                                                        |
| Activity History                  | Full 30-activity readback, desktop/375                                           | Passed                         | Loading the second page exposed exactly 11 planned and 19 unplanned activities. Available, removed, and removal-pending source lifecycle copy was truthful; the matched drawer agreed with Calendar/detail.                                                                                                                                                                                                                                                                                                                |
| Progress                          | Authenticated fixture, desktop/375                                               | Passed                         | 15 sessions, 763 minutes, 124.3 km, 540 m elevation, and partial 500 AU session RPE agreed with persisted fixture readback. Detailed metrics truthfully remained unavailable because normalized samples are not persisted.                                                                                                                                                                                                                                                                                                 |
| Saved Plans and Calendar overflow | Authenticated fixture, desktop/375                                               | Passed for safe flow           | Immutable `10K plan` provenance rendered with private download, Start, and Hide actions; Calendar overflow exposed private download/upload/new-plan/delete-future actions. Private downloads fired. Destructive or unrelated mutations were not submitted because the required lifecycle and Start/replace contracts were already covered by current validators and this run did not need to risk retained evidence. The Plans table kept its 860px width inside its own scroll container while the document stayed 375px. |
| Onboarding and manual entry       | Existing zero-plan identity and retained FIT identity, desktop/375               | Passed for non-persistent flow | Onboarding baseline, running-level slider, and BPM gating rendered and remained contained; age edit focused and Escape restored without save. An empty future date opened the real manual dialog at 0 minutes / 0 blocks with required type and disabled Review; no draft was saved.                                                                                                                                                                                                                                       |
| Retained FIT Product flow         | `fit-product-acceptance@local.test`, desktop/375                                 | Passed                         | Workout/Feedback retained the Garmin ZIP, Jul 30 date, 45.16 min, 5.11 km, +25/-33 m, 134/145 bpm, 262/371 W, 69 spm, 454 kcal, and 3 intervals. Plan vs Run exposed only prescribed comparisons, including no distance target and the factual 11-day date difference.                                                                                                                                                                                                                                                     |
| Retained FIT protection           | Before/after database and private-storage readback                               | Passed                         | Revision 1 stayed `available`, `garmin_zip`, `garmin_fit_activity_v1`, 80,050 bytes downloaded, SHA-256 `bb2737da162532126808613d6ae7a69655b5175be0964a3311f60d89c2bc58d6`; one log/asset/metrics/comparison/activity/source/revision/match and two evidence revisions remained intact.                                                                                                                                                                                                                                    |
| Shared Field and Select           | `/hitoDS/components`, light/dark, desktop/375                                    | Passed                         | Native Workout type select changed Easy -> Tempo -> Easy. Default, invalid (`aria-invalid`), disabled, bounded-date, helper/error relationships, semantic backgrounds/borders/text, and Poppins control text rendered truthfully in both themes.                                                                                                                                                                                                                                                                           |
| Shared Button, choice, and tabs   | `/hitoDS/components`, light/dark                                                 | Passed                         | Primary/secondary/native-disabled button states rendered; selection changed Easy -> Tempo, native disabled state applied and restored; tabs selected Progress, ArrowRight selected Updates, End skipped disabled Archived, and Home returned to Plan.                                                                                                                                                                                                                                                                      |
| Shared overlay                    | `/hitoDS/components`, desktop and exact 375px                                    | Passed                         | Dialog opened with labelled title/description and initial Cancel focus, trapped inside a 576px desktop surface / exact 375px mobile sheet, escaped cleanly, and restored focus to `Open selected modal`.                                                                                                                                                                                                                                                                                                                   |
| Shared date picker                | Bounded field, light/dark, desktop and exact 375px                               | Passed                         | The rendered calendar proved weekday headers, selected May 29, disabled May 19, enabled May 20, outside-month dates, contrasting selected/disabled states, ArrowRight focus transfer with a visible ring, and the current-day `data-today` state. The 375px popover remained within the viewport. This closes the prior rendered date-picker-cell evidence gap.                                                                                                                                                            |
| Shared Calendar, rows, and text   | `/hitoDS/components`, light/dark, desktop/375                                    | Passed                         | Calendar desktop/mobile renderers exposed Workout/Outside-month, Focus, Done, passive/interactive, dense, and action states without overflow. Row density/disclosure toggled Off -> On; repeated titles/helpers wrapped inside 375px and used semantic Poppins control/body text with theme-correct colors.                                                                                                                                                                                                                |
| Shared slider interaction         | `/hitoDS/components`, dark/light, desktop/375                                    | Passed                         | Pointer activation restored the single baseline to 4 and restored dual endpoints independently to 3 and 8. At 375px, native range keys changed endpoints and pointer activation restored them; document width stayed 375px.                                                                                                                                                                                                                                                                                                |
| Viewport and console containment  | All executed Product and DS routes                                               | Passed                         | Desktop documents equalled 1280px and narrow documents equalled exactly 375px. No page-level horizontal overflow appeared; only the documented Plans table owned internal horizontal scrolling. Browser console/page errors were empty.                                                                                                                                                                                                                                                                                    |
| Provider and hosted isolation     | Whole managed-runtime interval                                                   | Passed                         | Runtime observability from `2026-08-11T18:15:24.630Z` contained 105 local events, zero provider-dispatch events, and zero generation/provider events. Fixture tripwires passed. No hosted Supabase, Vercel, provider, deployment, commit, push, stage, or dependency action occurred.                                                                                                                                                                                                                                      |
| Disposable cleanup                | Named fixture and QA pool                                                        | Passed                         | Final named reset returned every owned fixture table/object to zero and preserved auth. Pool inventory showed `qa-saved-plan` at zero and no leases. The retained FIT identity and protected admin/history state were intentionally preserved.                                                                                                                                                                                                                                                                             |

### Saved browser evidence

Evidence is stored under
`qa-artifacts/screenshots/2026-08-11/current-release-candidate-final-global-qa-restart/`.
It includes unauthenticated login, desktop/mobile Calendar, Workout/Feedback, History and source-state
drawers, Progress, Plans, onboarding, manual authoring, retained FIT, and light/dark shared Design
System date-picker, overlay, Calendar, rows/text, controls, and slider captures.

### Coverage gaps and consequences

- Forced-colours emulation is unavailable in the supported in-app browser environment:
  `matchMedia('(forced-colors: active)').matches` and the available contrast capability were false.
  No forced-colours pass is claimed. Static DS contract validation still covers the implementation
  hook, but OS-level forced-colours rendering remains an environment coverage gap and does not block
  this local candidate under the assignment's explicit policy.
- Destructive Calendar delete/upload/new-plan and saved-plan Hide/Start were not submitted in this
  final replay. The current local DB/Product validators and the earlier accepted bounded
  Calendar/Plans Global QA receipt cover those unchanged contracts; this run verified their current
  rendered availability, private downloads, fixture lifecycle, and independent Calendar readback.
  Retained FIT/history protection took precedence over redundant destructive browser mutation.
- The documented blocked Design System page/card contrast decision remains outside this candidate's
  accepted implementation scope. This run verified current tokenized shared control states in both
  themes; it does not resolve or claim the separate blocked design decision.
- Hosted Supabase parity, hosted migration application, Vercel, production, staging, commit, push,
  deployment, and release readiness were not run and remain unclaimed.

Role file: `agents/qa.agent.md`.

Skills used: `skills/hito-qa-browser-regression/SKILL.md`,
`skills/hito-backend-supabase-contract/SKILL.md`, the mandatory Supabase procedure, and the
non-prompting in-app Browser control procedure.

Subagents used: none. The two listed completed subagents belonged to earlier tasks and were not
reused or dispatched for this run.

Global QA Acceptance: Passed for the complete frozen local release-candidate inventory.

Verdict: Passed

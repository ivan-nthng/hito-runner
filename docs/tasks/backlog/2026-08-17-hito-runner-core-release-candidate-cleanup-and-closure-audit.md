# Hito Runner Core Release-Candidate Cleanup And Closure Audit

Work Item ID: `2026-08-17-hito-runner-core-release-candidate-cleanup-and-closure-audit`
Status: completed
Type: Tracked
Priority: highest
Owner: ARCHITECT
Epic: runner-core-readiness
Parent: [Hito Product Roadmap: Runner Core, Adaptive Blueprint Planning, And Commercial Readiness](./2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Hito Current Worktree Volume And Legacy Cleanup Follow-Up](./2026-08-17-hito-current-worktree-volume-and-legacy-cleanup-follow-up.md)
Supersedes: [Hito Runner Calendar Tail Rebase Backend Contract](./2026-08-17-hito-runner-calendar-tail-rebase-backend-contract.md)
Scope: Produce one current, source-proven release-candidate cleanup ledger for the Runner Core
cluster after the superseded rebase spike has been removed. Separate removable paths from required
runtime, migrations, proofs, canonical receipts, and unrelated active work; do not delete anything
in this audit.
Archive Intent: Retain through final Runner Core acceptance and candidate admission; compact to the
admitted cleanup ledger and explicit retained boundaries at terminal closeout.

## Task

Ivan wants to complete Runner Core, remove dead/duplicated/obsolete work before committing, and
avoid treating broad line count as evidence of waste. Reconcile the current checkout after the
Backend rebase-spike cleanup. Identify the smallest possible release-candidate inventory for the
Runner Core cluster and any individually proven deletions or consolidations needed first.

This audit must distinguish runner product source from canonical backlog/receipt evidence, ordered
migrations, live proofs, evidence assets, and unrelated Admin/Design System/Commercial work. A path
is removable only with exact caller/replacement proof and a focused validation route. The audit must
also list every remaining Runner Core open/blocked item and state whether it blocks local Epic
closure, final QA, or only real-device/hosted release acceptance.

## User Report

Ivan sees roughly 45 thousand lines in the dirty checkout and wants the current Runner Core work
completed, cleaned, independently validated, then admitted to a deliberate commit/push candidate.
He explicitly withdrew the overbuilt Calendar-tail rebase spike. Future schedule shifting remains a
later product requirement, not a reason to retain unfinished code now.

## Source Facts

- The superseded rebase cleanup removed the three task-owned spike files plus exact shared hunks.
  It was never committed, hosted, released, or adopted; an earlier disposable local Supabase replay
  may retain unreleased functions until a normal repository-only reset.
- The previous architecture audit found that most apparent volume was canonical backlog records,
  append-only migrations, proof scripts, and evidence rather than standalone runtime code. Its
  snapshot is historical evidence only and must be refreshed after cleanup.
- Local Runner Core baseline QA was accepted, but real iPad/Safari and native desktop-drag evidence
  were explicitly deferred. Do not misrepresent those physical-device gaps as source defects.
- A Calendar source is provenance only; current workouts remain runner-owned. Cleanup must not
  revive `plan_cycles`, `planned_workouts`, or active-plan authority.

## What Not To Touch

- Do not edit runtime source, migrations, scripts, fixtures, assets, backlog records other than this
  item, plans, history, generated artifacts, or Git state.
- Do not start a QA fixture, build, browser run, release freeze, staging, commit, push, deployment,
  hosted mutation, provider call, or personal-account action.
- Do not delete by filename, age, line count, terminal status, or inferred duplication.

## Validation Expectations

- Produce a non-overlapping current path/line partition with the rebase spike excluded.
- Map every Runner Core changed path to a completed canonical owner, a separate active owner, or a
  specific proven cleanup candidate.
- For each proposed deletion/merge, prove reachability and canonical replacement; otherwise retain.
- Reconcile source owners and current nonterminal Runner Core items.
- Validate task-local links, scoped Prettier, whitespace, and `git diff --check` without absorbing
  concurrent movement.

## Stage

ARCHITECT read-only audit completed; PRODUCT lifecycle reconciliation is next.

## Next Recommended Role

PRODUCT

## Original Handoff Prompt

```text
ROLE: ARCHITECT

Task: Hito Runner Core Release-Candidate Cleanup And Closure Audit
Stage: Read-only current inventory and closure boundary
Canonical item: docs/tasks/backlog/2026-08-17-hito-runner-core-release-candidate-cleanup-and-closure-audit.md
Evidence: docs/tasks/backlog/2026-08-17-hito-current-worktree-volume-and-legacy-cleanup-follow-up.md and docs/tasks/backlog/2026-08-17-hito-runner-calendar-tail-rebase-backend-contract.md

Read AGENTS.md, agents/architect.agent.md, and skills/hito-architecture-audit/SKILL.md before acting.
This is a Tracked, read-only ARCHITECT task. Preserve every unrelated dirty byte and update only the
canonical item.

Refresh the checkout inventory after the superseded Calendar-tail rebase spike was removed. Produce
one non-overlapping partition of Runner Core source, migrations, scripts/proofs, canonical task
records, assets, and unrelated active work. For every Runner Core changed path, map the canonical
owner/lifecycle and determine retain or a narrowly proven cleanup candidate. A deletion or merge
requires exact live-caller or canonical-replacement evidence and a focused validation route; do not
infer it from name, age, line count, or terminal status.

State exactly whether each remaining nonterminal Runner Core item blocks local Epic closure, final
cross-flow QA, or only a separately deferred physical-device/hosted gate. Do not implement cleanup,
modify source/migrations/scripts/fixtures/assets, start runtime/browser/build/QA, stage, commit,
push, deploy, call providers, or touch personal/hosted data. Do not revive plan-container authority.

Update this item with an English audit receipt: snapshot boundary, path/line partition, exact
candidate ledger with owner/dependency/proof, required retained boundaries, and recommended serial
sequence through final Runner Core QA and release-candidate admission. Run only task-local links,
scoped formatting, whitespace, and diff hygiene. Return to PRODUCT.
```

## ARCHITECT Audit Receipt — 2026-08-17

### Preflight And Snapshot Boundary

- **Mode / owner:** Tracked, read-only / ARCHITECT. The assigned role, canonical item, and requested
  stage matched. `agents/architect.agent.md` and `skills/hito-architecture-audit/SKILL.md` were the
  active role and procedure. No subagent was used.
- **Repository:** `main` at `abd4fe8355e3c644095111a654c1560aa265d104`; `origin/main` was the same
  commit and the index was empty. No release item was `in_progress`, so no candidate freeze was
  active.
- **Observed snapshot:** `2026-08-18T02:43:01Z`, before this receipt. Expanded physical status had
  464 paths: 359 tracked/deleted and 105 untracked. Tracked text was `+14,407 / -8,583`; untracked
  payload was 29,274 text lines plus 11 binaries / 11,130,023 bytes.
- **Preservation discriminator:** excluding this item, the status-and-byte digest stabilized twice
  at `50aefeb6dfa0fda182a049ac18f6c4c066c9abd3316a7c86ba53ca386b1a8a42`. This item began at SHA-256
  `4aeb5e45c71eb13e87e51c4a9a4d9828113c3d6875bf24a12ea967dff57bd26d` and 108 lines.
- **Write budget:** this receipt only. Runtime source, migrations, scripts, fixtures, assets, other
  backlog items, plans, history, generated output, local/hosted data, and Git lifecycle remained
  read-only. New runtime artifacts, cleanup writes, and deletions: none.

### Non-Overlapping Current Partition

The Runner Core set below is the union of exact changed paths named by its terminal Backend and
Frontend receipts, the five ordered migrations, the current Epic records, and four terminal
Runner-Core bug receipts that correctly omit Epic metadata. A mention in an architecture report was
not sufficient to assign a source path.

| Partition                                 | Paths (tracked / untracked) |   Tracked text delta |                        Untracked payload | Disposition                                                                                         |
| ----------------------------------------- | --------------------------: | -------------------: | ---------------------------------------: | --------------------------------------------------------------------------------------------------- |
| Runner Core runtime source                |                 45 (45 / 0) |      +3,624 / -3,353 |                                        0 | Retain; all map to terminal implementation owners, with shared-file admission gates noted below     |
| Runner Core ordered migrations            |                   5 (0 / 5) |                0 / 0 |                         2,745 text lines | Retain as append-only schema and rollback evidence                                                  |
| Runner Core scripts and proofs            |                 24 (24 / 0) |      +3,792 / -2,909 |                                        0 | Retain 22 live paths and two already-realized deletions                                             |
| Runner Core canonical task records        |                 32 (6 / 26) |             +24 / -0 |                         7,755 text lines | Retain; 22 were terminal and 10 nonterminal before this receipt                                     |
| Runner Core task assets in current status |                   0 (0 / 0) |                0 / 0 |                                        0 | None; ignored QA evidence was not inventoried as a release path or modified                         |
| Unrelated/shared active and retained work |              358 (284 / 74) |      +6,967 / -2,321 |     18,774 text lines + 11,130,023 bytes | Exclude from a Runner-Core-only candidate unless a fresh freeze admits a terminal shared dependency |
| **Total**                                 |         **464 (359 / 105)** | **+14,407 / -8,583** | **29,274 text lines + 11,130,023 bytes** | Complete physical partition                                                                         |

The 358-path remainder includes active Admin work, queued workout-sidebar and navigation-card work,
completed/queued Progress, locale, Design System, Inspector, policy, current-product, plan, history,
and evidence changes. It is not “legacy” by exclusion. The only repository writers represented as
`in_progress` were the PRODUCT-owned Admin overview intake and Hub Admin Analytics records; they
must be terminal or demonstrably idle and disjoint before a release freeze.

### Exact Runner Core Source Ownership

All 45 runtime paths are retained. The grouped lists are exhaustive and non-overlapping.

**BACKEND terminal owner cluster — 25 paths.** The completed standalone-write, materialization,
unified-edit, move/Undo, runtime-cleanup, FIT-fixture, and occupied-replace receipts own:

- `src/lib/active-plan-lifecycle-persistence.ts`
- `src/lib/active-plan-persistence.ts`
- `src/lib/active-plan-workout-editing/policy.ts`
- `src/lib/active-plan-workout-editing/source-capabilities.ts`
- `src/lib/calendar-overflow-actions.ts`
- `src/lib/manual-workout-authoring/actions.ts`
- `src/lib/manual-workout-authoring/active-plan-add.ts`
- `src/lib/manual-workout-authoring/copy-paste-reconstruction.ts`
- `src/lib/manual-workout-authoring/copy-paste.ts`
- `src/lib/manual-workout-authoring/delete-clear.ts`
- `src/lib/manual-workout-authoring/edit-workout-review-token.ts`
- `src/lib/manual-workout-authoring/edit-workout.ts`
- `src/lib/manual-workout-authoring/move-workout.ts`
- `src/lib/manual-workout-authoring/persisted-workout-safety.ts`
- `src/lib/manual-workout-authoring/persistence.ts`
- `src/lib/manual-workout-authoring/schema.ts`
- `src/lib/persisted-plan-replacement.ts`
- `src/lib/plan-export.ts`
- `src/lib/supabase/database.ts`
- `src/lib/training-api.ts`
- `src/lib/training.ts`
- `src/lib/workout-document.ts`
- `src/lib/workout-result-import/ingest-garmin-result.ts`
- `src/lib/workout-result-import/types.ts`
- `src/routes/api.workout-result.upload.tsx`

**FRONTEND Product terminal owner cluster — 20 paths.** The completed standalone-consumer,
unified-editor, interaction recovery, file-flow bridge, copy, sidebar, and completion-copy receipts
own:

- `src/components/AppShell.tsx`
- `src/components/Calendar.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/OnboardingGate.tsx`
- `src/components/TodayHero.tsx`
- `src/components/calendar/CalendarOverflowActions.tsx`
- `src/components/calendar/calendar-projection.ts`
- `src/components/calendar/manual-calendar-actions.ts`
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`
- `src/components/manual-workout/ManualWorkoutMoveControls.tsx`
- `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx`
- `src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx`
- `src/components/onboarding/QuickSetupPlanSetupSections.tsx`
- `src/components/workout-completion/WorkoutActivityFileDialog.tsx`
- `src/lib/local-activity-file-design-fixture.ts`
- `src/lib/route-data-actions.ts`
- `src/routes/index.tsx`
- `src/routes/settings.tsx`
- `src/routes/workout.$date.tsx`

`AppShell.tsx`, `settings.tsx`, persistence/training/database owners, Backend aggregates, and the
runner-activity fixture/proofs have other live consumers. Their Runner Core responsibility is
terminal, but a release owner must still prove the whole current file diff maps only to terminal
owners or an explicit shared integration dependency. This audit does not convert caller evidence
into whole-file release admission.

The legacy-named `active-plan-*` modules are not deletion candidates. A fresh import census found
36 direct source/proof importers. Those modules may retain provenance/materialization plumbing only;
their names do not restore plan-container product authority.

### Ordered Migration Ledger

All five untracked migrations are required, ordered Backend evidence and have no squashed canonical
replacement:

| Path                                                                                           | Terminal owner                            | Decision |
| ---------------------------------------------------------------------------------------------- | ----------------------------------------- | -------- |
| `supabase/migrations/20260815195439_unified_workout_content_edit_atomic_protection.sql`        | Unified editable workout Backend contract | Retain   |
| `supabase/migrations/20260815212107_workout_move_undo_stored_rest_reversibility.sql`           | Stored-Rest Move/Undo Backend recovery    | Retain   |
| `supabase/migrations/20260816004652_standalone_calendar_write_foundation.sql`                  | Standalone Calendar write foundation      | Retain   |
| `supabase/migrations/20260816020328_standalone_calendar_materialization_origin_completion.sql` | Materialization-origin completion         | Retain   |
| `supabase/migrations/20260816171845_occupied_move_replace_durable_undo.sql`                    | Occupied Replace/Undo Backend repair      | Retain   |

The removed `20260818011255_calendar_workout_tail_rebase.sql` is absent and has no live repository
reference. It never joined this ordered set.

### Script And Proof Ledger

The 22 existing paths all have a current package, Backend-manifest, aggregate, direct-import, or
fixture caller. Retain:

- `scripts/lib/qa-test-user-lifecycle.mjs`
- `scripts/lib/runner-activity-gate-4-fixture.ts`
- `scripts/lib/runner-design-profile-fixture.ts`
- `scripts/manual-workout-authoring/active-plan-add-proof.ts`
- `scripts/manual-workout-authoring/copy-paste-proof.ts`
- `scripts/manual-workout-authoring/delete-clear-proof.ts`
- `scripts/manual-workout-authoring/move-proof-fixtures.ts`
- `scripts/manual-workout-authoring/move-proof-missed-scenarios.ts`
- `scripts/manual-workout-authoring/move-proof.ts`
- `scripts/manual-workout-authoring/persisted-edit-proof.ts`
- `scripts/manual-workout-authoring/persistence-proof.ts`
- `scripts/manual-workout-authoring/source-capability-proof.ts`
- `scripts/running-plan-engine-confirm/persistence-proof.ts`
- `scripts/test-user.mjs`
- `scripts/validate-backend.mjs`
- `scripts/validate-calendar-overflow-future-actions.ts`
- `scripts/validate-manual-workout-authoring.ts`
- `scripts/validate-runner-activity-foundation.ts`
- `scripts/validate-runner-activity-gate-4.ts`
- `scripts/validate-runner-activity-read-models.ts`
- `scripts/validate-runner-calendar-context.ts`
- `scripts/validate-workout-evidence-comparison.ts`

The other two script paths are already-realized, terminal BACKEND cleanup:

| Deleted path                                            | Canonical replacement and current reachability                                                                                                                    | Decision / later proof                                                                                                                               |
| ------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `scripts/manual-workout-authoring/empty-plan-proof.ts`  | `validateStandaloneManualCalendarAddContract` in `active-plan-add-proof.ts`, invoked by package/Backend-manifest-reachable `validate-manual-workout-authoring.ts` | Retain deletion with the complete Backend cluster; require zero-reference check and the manual authoring aggregate during final candidate validation |
| `scripts/validate-active-plan-schedule-edit-preview.ts` | `validateStandaloneCalendarSourceBoundary` inside `validate-manual-workout-authoring.ts`, which remains package/Backend-manifest reachable                        | Retain deletion; do not recreate a legacy-named compatibility proof                                                                                  |

### Canonical Task Records

The 32 changed Runner Core task paths consisted of 28 Epic-classified records and four terminal bug
receipts that correctly have no Epic: occupied Replace/Undo, standalone Calendar copy, current-date
file-flow fixture alignment, and scheduled-completion copy closure. Before this write the lifecycle
distribution was 20 `completed`, two `closed`, six `backlog`, two `ready`, and two `blocked`.

The 22 pre-existing terminal records remain unique uncommitted owner/validation evidence. This
receipt becomes the twenty-third terminal record. They are retained; terminal status is not deletion
or compaction authority before durable candidate admission.

### Nonterminal Runner Core Closure Matrix

Ten records were nonterminal at preflight. This receipt terminalizes only itself, leaving nine for
PRODUCT to reconcile; ARCHITECT did not change another role's lifecycle.

| Item / current owner                                                                                       | Demonstrated state                                                                                                                                                                | Local Epic closure                                                                                                                                                               | Final candidate cross-flow QA                                                                      | Separate physical/hosted gate                              |
| ---------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `2026-06-03-json-import-long-run-remapping-placement-helper.md` / unassigned, BACKEND suggested            | Unimplemented import-placement follow-up; its `active-plan` helper wording predates the mandatory runner-owned Calendar boundary                                                  | **Blocks strict closure while classified in this Epic.** PRODUCT must rewrite under runner-owned materialization or defer/reclassify/close it; do not dispatch the legacy prompt | Does not invalidate the accepted baseline when explicitly excluded                                 | No                                                         |
| `2026-06-06-authenticated-saved-mode-workout-readback-browser-smoke-fixture.md` / unassigned, QA suggested | Explicitly optional QA hygiene after an older completed release slice                                                                                                             | Status blocks an all-terminal count only; PRODUCT may retain as optional follow-up or close/supersede it with direct later evidence                                              | No; it is not a required current Runner Core gate                                                  | No                                                         |
| `2026-06-06-watch-export-integration-polish.md` / unassigned, ARCHITECT suggested                          | Future watch/provider integration, not implemented Runner Core                                                                                                                    | Not a current Core behavior blocker; PRODUCT must move/defer it outside this Epic before claiming every Epic item terminal                                                       | No                                                                                                 | Future provider/hosted work only when separately chosen    |
| `2026-06-07-plan-preset-active-plan-replacement-refresh.md` / PRODUCT                                      | Historical active-container transition language conflicts with the accepted source-only plan model                                                                                | **Blocks strict closure until PRODUCT closes/supersedes or rewrites it.** Its historical prompt must not run                                                                     | No; reopening it would regress the accepted contract                                               | No                                                         |
| `2026-06-13-manual-authoring-bug-01-template-flow-and-constructor-grammar.md` / FRONTEND                   | Real queued UI/DS polish, but not part of the accepted baseline inventory                                                                                                         | Blocks closure only if PRODUCT keeps it inside Runner Core scope; otherwise defer/reclassify without hiding the request                                                          | No; current authoring flows passed the baseline                                                    | No                                                         |
| `2026-07-26-coach-club-program-publishing-architecture.md` / BACKEND                                       | Separate future Coach domain, ready status, and stale plan-container vocabulary                                                                                                   | Not Runner Core behavior. **Blocks strict metadata/lifecycle closure until PRODUCT reclassifies and revalidates its contract before any dispatch**                               | No                                                                                                 | Separate future persistence/security/hosted gate           |
| `2026-08-15-hito-calendar-move-performance-and-legacy-acceptance.md` / QA                                  | All executed local Move/Undo, timing, overflow, provider, and cleanup checks passed; only real iPad/Safari, native desktop drag, and one environment control path stayed unproved | No local-source or local-baseline block under the accepted explicit deferral                                                                                                     | No; menu/keyboard/pointer Move is already in the accepted local baseline                           | **Yes: physical iPad/Safari and native desktop drag only** |
| `2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md` / PRODUCT            | Cross-epic sequencing authority; explicitly not an implementation owner                                                                                                           | No; it remains backlog while later Evidence/Progress and commercial sequence continues                                                                                           | No                                                                                                 | No direct gate                                             |
| `2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md` / PRODUCT                                       | Its blocked Stage 3 defects and fixture gaps were repaired and superseded by the completed 2026-08-17 baseline, which passed the fuller current matrix                            | **Lifecycle-only block:** PRODUCT should close/supersede this stale status against the accepted baseline; no repair is open                                                      | No new rerun is caused by this stale receipt; final candidate QA remains separately required below | No                                                         |
| This audit / ARCHITECT                                                                                     | Completed by this receipt                                                                                                                                                         | No longer blocks                                                                                                                                                                 | Provides the candidate/QA boundary only; it performed no QA                                        | No                                                         |

Therefore the local Runner Core implementation baseline is accepted, but the Epic is not honestly
all-terminal. PRODUCT must resolve the six old backlog/ready scope records and the stale blocked QA
catalog. The physical-device QA record may remain explicitly blocked without being called a source
defect. The roadmap may remain backlog because it spans later epics and owns sequencing, not Runner
Core lifecycle.

### Cleanup Candidate Ledger

| Candidate                                                                                                       | Current result                                                                                                                       | Owner / dependency / proof                                                                                                                                              | Decision                                                                              |
| --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Calendar-tail rebase spike: migration, server owner, proof, barrel export, transport, type, and aggregate hunks | Three task files are absent; zero live source reference remains; shared files retain only other owners' modifications                | Closed BACKEND cleanup receipt; source search for `calendar_workout_tail_rebase`, `CalendarWorkoutTailRebase`, `rebase-workout`, and operation vocabulary returned zero | Cleanup complete; no replacement feature or compatibility path                        |
| Two deleted legacy proof paths                                                                                  | Exact reachable replacements are listed above                                                                                        | Completed BACKEND runtime-cleanup owner                                                                                                                                 | Retain deletions; admit only with their owner cluster                                 |
| Remaining 22 Core proofs                                                                                        | Every path has a live caller; manual aggregates and Backend manifest remain canonical consumers                                      | Completed BACKEND/shared evidence owners                                                                                                                                | Retain                                                                                |
| Five ordered migrations                                                                                         | No squash/replacement and required by terminal persistence receipts                                                                  | Completed BACKEND owners                                                                                                                                                | Retain                                                                                |
| `active-plan-*`, `plan_cycles`, and `planned_workouts` storage/provenance seams                                 | 36 direct source/proof importers; current Core QA proved no product authority                                                        | Future removal requires a separate migration and consumer replacement map                                                                                               | Retain as temporary implementation facts only; never revive as product authority      |
| Route-local `NavCard` / `.hito-nav-card*`                                                                       | Shared `HitoNavigationCard` exists, but its adoption item is still `backlog` and the route remains the live sole old-recipe consumer | DESIGN SYSTEM then FRONTEND Product; require completed adoption, zero old callers/selectors, link/focus/responsive proof, and independent QA                            | Not currently safe; separately queued cleanup, not a Runner Core release prerequisite |
| Terminal receipts, current truth, plans, and evidence                                                           | Unique uncommitted ownership/acceptance facts and live inbound consumers remain                                                      | PRODUCT/release admission first                                                                                                                                         | Retain; no bulk compaction or asset deletion admitted                                 |

No additional source, migration, proof, receipt, plan, history, role, skill, or evidence path satisfies
the complete deletion/merge discriminator. The cleanup result is net deletion already present, not a
new implementation batch.

### Required Retained Boundaries And Candidate Nucleus

- The smallest static Runner Core nucleus after this receipt is **97 paths**: 45 runtime, five
  migrations, 24 proof paths (including the two deletions), and 23 terminal Core records. The nine
  nonterminal Core records are not admissible merely because their Epic matches; PRODUCT must
  terminalize/reclassify them or explicitly exclude them from the candidate.
- Four changed shared authority paths — `AGENTS.md`, `docs/current-product.md`, `docs/context.md`, and
  `docs/glossary.md` — carry the accepted runner-owned Calendar boundary. A release owner must admit
  them as terminal shared dependencies or prove that their exact changes are already represented by
  the release baseline. Excluding current truth while admitting dependent runtime would be unsafe.
- `qa-artifacts` evidence is outside expanded Git status and was not treated as disposable. The 11
  changed binary assets belong to unrelated Admin/Changelog/Marketing/DS/Progress evidence and stay
  outside a Runner-Core-only candidate unless their own terminal owners are admitted.
- The closed rebase receipt records that an earlier disposable local Supabase replay may still leave
  unreleased spike functions in that local database. They are not repository or hosted truth, but a
  fresh repository-only migration reset/parity proof must remove that residue before final QA uses
  the database. No database action occurred in this audit.
- Hosted Supabase, providers, Ivan's identity, and physical-device evidence remain outside this
  local source candidate.

### Recommended Serial Closure And Admission Sequence

1. **PRODUCT — lifecycle and scope reconciliation.** Mark this audit accepted; close/supersede the
   stale blocked workout-flow catalog against the completed baseline; decide whether the six old
   backlog/ready records are completed by later evidence, deferred/reclassified, or still required.
   Never dispatch the legacy active-container prompts. Keep the roadmap backlog as cross-epic
   sequencing authority and the Calendar Move record as an explicit physical-device-only gate.
2. **BACKEND — local repository-schema parity gate, no feature implementation.** After other local
   runtime writers are idle, rebuild/reset only the disposable loopback database from the complete
   repository migration history, including the five Runner Core migrations, prove the withdrawn
   tail-rebase functions are absent, run the existing manual-authoring/Backend migration/type/ACL
   and fixture-convergence validators, and leave source unchanged. Any mismatch returns to the
   first Backend owner before QA.
3. **QA — fresh final Runner Core candidate cross-flow.** On a fresh managed `qa_fixture` built from
   the exact stable candidate and clean local schema, replay the accepted 2026-08-17 risk-derived
   matrix: standalone manual/AI/imported workouts, Add/Edit/Move/Copy/Clear, empty/Rest/occupied
   Undo, Past Plans/source reuse, scheduled-only versus FIT truth, History/Progress privacy,
   desktop/mobile themes, native control paths available in the environment, provider isolation,
   and deterministic cleanup. Do not substitute this audit or the old blocked catalog for current
   evidence. Physical iPad/Safari and native desktop drag remain a separately labelled gap unless
   PRODUCT/Ivan explicitly makes them release gates.
4. **PRODUCT — final acceptance routing.** Terminalize the QA item truthfully. A failed source,
   persistence, fixture, or presentation check routes a separate canonical repair to its first
   owner; the release owner does not fix it inside a freeze.
5. **Release owner — fresh repository-wide freeze and staged admission.** Begin only when all other
   writers are idle and every admitted path has a terminal owner or explicit shared dependency.
   Recompute `HEAD`/remote/index, exact paths, digests, exclusions, and whole-file ownership; stage
   only the authorized inventory; run staged diff hygiene; then execute the separately authorized
   commit/push/release procedure. The 97-path nucleus and four authority paths are audit inputs, not
   an automatic staging instruction.

### Validation And Acceptance Boundary

| Check                                         | Result                              | Evidence / consequence                                                                                              |
| --------------------------------------------- | ----------------------------------- | ------------------------------------------------------------------------------------------------------------------- |
| Current physical partition                    | Passed for the timestamped snapshot | Six categories sum to 464 paths and reconcile exactly to tracked and untracked totals                               |
| Rebase-spike reachability                     | Passed, static                      | Three spike files absent; zero live source/migration/script reference outside the historical closed receipt         |
| Runtime owner map                             | Passed for static closure audit     | All 45 paths map to terminal Backend or Frontend receipts; shared whole-file admission remains a release-owner gate |
| Script reachability                           | Passed, static                      | 22 retained scripts have callers; two deletions have package/manifest-reachable replacements                        |
| Lifecycle census                              | Passed                              | 32 Core records parsed; ten prewrite nonterminal items classified by exact closure consequence                      |
| Runtime/build/browser/database/hosted/release | Not run by design                   | No implementation, QA, migration parity, Global QA, hosted, provider, release, or deployment acceptance is claimed  |

**Architecture verdict:** the withdrawn spike and the two superseded proofs are the only demonstrated
Runner Core cleanup. The remaining Core source is retained, locally accepted implementation owned by
terminal roles. Formal Epic closure is blocked by stale/future lifecycle classification, not by a
demonstrated current source defect. PRODUCT is the next owner.

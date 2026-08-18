# Hito Workout Core Flow QA Scenario Catalog — 2026-08-15

## Work Item ID

2026-08-15-hito-workout-core-flow-qa-scenario-catalog

## Status

closed

## Type

Tracked — QA scenario design and approval-gated local acceptance

## Priority

high

## Owner

PRODUCT

## Epic

runner-core-readiness

## Stage

Closed — defects and capability gaps superseded by the accepted 2026-08-17 Runner Core baseline.

## Product Lifecycle Reconciliation — 2026-08-18

The blocked Stage 3 defects were repaired and the successor baseline passed the broader current
matrix, including durable FIT browser removal confirmation. Retain this catalog and evidence as
historical QA input; do not reopen or dispatch its stale defect-routing prompt.

## Next Recommended Role

PRODUCT

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task: Hito Workout Core Flow QA Scenario Catalog
Stage: Route the failed Stage 3 focused local regression result
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md
Epic: runner-core-readiness

Read the Stage 3 QA receipt in this item. Route the two demonstrated Frontend Product defects at
their existing canonical seams: stored Rest is persisted and readable by detail but Calendar renders
it as an empty Add-workout date; empty-target Undo is absent and stored-Rest Undo disappears after
immediate reload. Decide separately whether a future imported-workout disposable state and a
non-prompting durable FIT-upload browser capability need a bounded fixture/control follow-up. Preserve
the completed Backend repairs, accepted passing WC branches, final zero cleanup, retained evidence,
and all hosted/release boundaries. Do not treat this failed focused local result as Global QA or
release readiness.
```

## Scope

Local, authenticated runner workout flows only: Calendar, manual workout authoring and editing, repeat groups, move/copy/delete actions, Workout result attachment, and their durable readback. Stage 1 defines the canonical scenario catalog; it performs no browser flow mutation. Stage 2 may execute the approved catalog only against a safe local fixture.

## Archive Intent

Retain the approved scenario catalog and the final local readiness verdict; compact after a later terminal acceptance result.

## Task

Create a concise, executable, step-by-step QA scenario catalog for the basic workout flows that Hito must support before Ivan judges local user readiness. Return the catalog for Product/Ivan approval before executing it. Once approved in a separate Product dispatch, run the exact catalog against a healthy managed loopback fixture and produce an evidence-led readiness verdict.

## User Request

Ivan asks QA to first define the main scenarios that should run repeatedly, then review and approve that list before a complete pass. The intended flows include editing a workout, creating loops, deleting and moving workouts, and attaching a fake FIT file. He wants to learn whether the service is ready for users, not merely whether isolated screens render.

## Source Facts

- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx` and `ManualWorkoutConstructorEditor.tsx` own manual create/edit and repeat-group authoring; nested repeats are intentionally unsupported by `src/lib/manual-workout-authoring/validator.ts`.
- `src/components/calendar/manual-calendar-actions.ts` owns manual move, optimistic readback, and undo; Calendar exposes copy and move action contexts through the same canonical action model.
- `src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx` owns the reviewed/confirmed deletion flow for a planned manual workout. Future-plan deletion is a separate Calendar overflow action and must not be conflated with a single-workout delete.
- `src/routes/workout.$date.tsx`, `WorkoutActivityFileDialog`, and `/api/workout-result/upload` own result-file attachment. The repository contains `sample-fit-from-zip.fit`; Stage 1 must establish whether it is safe and compatible with the local fixture before Stage 2 uses it.
- The current implementation has both user-authored manual workouts and source-protected/generated workout capabilities. The catalog must state which mutation is allowed for each source rather than treating all workouts as editable.

## Required Stage 1 Deliverable

Write the proposed catalog into this item. It must be short enough to run repeatedly, but each scenario must specify: preconditions and fixture identity, exact user steps, expected visible state, expected durable/readback state after reload, cleanup or reversibility, priority (`must` / `should` / deferred), and desktop/mobile coverage.

At minimum, evaluate whether the following real scenarios belong in the recurring `must` set:

1. authenticated Calendar load and a valid editable manual-workout source;
2. create a manual workout, add a simple repeat group, save it, and read it back after refresh;
3. edit a manual workout, including save, cancel, validation failure, and source-protected denial where applicable;
4. move one manual workout to an eligible Calendar day, observe the result, reload, and undo when the fixture supports it;
5. copy a manual workout only if it is a distinct supported user flow;
6. delete one manual workout through review and confirmation, including cancel and post-delete Calendar/readback truth;
7. attach the existing local FIT fixture to a compatible workout, observe result/review readback after reload, then remove the evidence when the fixture permits safe cleanup;
8. critical navigation, focus/keyboard, error feedback, and desktop/mobile containment for the above flows.

Clarify `loop`: assess the supported manual repeat group, not an invented recurrence scheduler. Identify any prerequisite fixture, missing test state, unsafe mutation, or Backend-owned precondition precisely. Distinguish a focused local verdict from Global QA, hosted, release, or production readiness.

## What Not To Touch

Production source, Design System code, schemas, migrations, hosted Supabase, real user content, provider calls, deployment, Git lifecycle, and implementation fixes. Do not fabricate a FIT binary, infer persistent data from DOM alone, broaden the suite into plan generation, onboarding, integrations, Admin, or marketing flows, or label a blocked fixture as a product defect.

## Validation Expectations

Stage 1 is read-only: source/fixture reachability inventory, scenario completeness, lifecycle/cleanup map, task formatting, and `git diff --check`. No browser run occurs before Ivan approves the catalog.

Stage 2 is an explicitly assigned local QA acceptance: managed-runtime preflight, the approved Must scenarios, truthful data/readback evidence, relevant error/cancel branches, responsive and accessibility interaction checks, console/overflow health, fixture cleanup, and a `Verdict: Passed` or `Verdict: Failed` without a release claim.

## Stage 2 Execution Preflight — 2026-08-15

- Validation layer: focused local core-workout acceptance, not Global QA, hosted, release,
  deployment, or production acceptance.
- Runtime admission: the existing managed loopback `qa_fixture` process was compatible and healthy,
  but its build was stale/broken with `artifact_missing`; no competing build/runtime owner or build
  lock was present. QA owns one serialized managed restart followed by a fresh status gate.
- Named disposable lifecycle: `qa-baseline@local.test` (`baseline-no-plan`) had one saved runner
  profile and zero plan/workout/result/activity rows; `qa-isolation-a@local.test` was an empty pool
  identity reserved for the exact-date FIT branch. No pool lease was active.
- Cleanup contract: the existing pool reset removes raw storage, workout result assets, actuals,
  comparisons, logs, runner activity facts/observations/evidence/revisions/sources, plans, templates,
  entitlements, and capability usage. Manual flow uses a profile-preserving reset; FIT flow uses a
  full reset and must prove zero counts before reuse.
- Browser path: built-in managed browser at `http://127.0.0.1:3000`, exact `1470x801` and
  `375x812`, native keyboard events, DOM/console/overflow measurement, and screenshots under
  `qa-artifacts/screenshots/2026-08-15/hito-workout-core-flow-qa-scenario-catalog/`.
- Allowed mutations: only pool credential normalization, named reset/import/Product UI mutations,
  QA evidence, and this canonical receipt. Product/Design System source, schema, migrations, fixture
  source, configuration, hosted state, providers, and Git lifecycle remain read-only.
- Failure policy: capture every independent defect and continue safe scenarios; stop only the
  affected branch when fixture truth or cleanup cannot be established. QA does not fix forward.

## Stage 1 Dispatch Prompt

```text
ROLE: QA

Task: Hito Workout Core Flow QA Scenario Catalog
Stage: Stage 1 — approval-gated scenario design
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md

Ivan explicitly asked to start. Read AGENTS.md, agents/qa.agent.md, and skills/hito-qa-browser-regression/SKILL.md. This Stage 1 assignment is read-only except for updating the canonical item. Do not begin browser flow execution, create fixtures, upload a file, mutate local data, or change production code.

Create a concise repeatable test catalog for basic authenticated workout flows, then return it to PRODUCT/Ivan for approval. Ground every proposed scenario in the existing owners: ManualWorkoutAuthoringControls/ManualWorkoutConstructorEditor for manual create/edit and repeat groups; manual-calendar-actions for move/undo and copy; ManualWorkoutSourceActionMenu for reviewed deletion; workout.$date, WorkoutActivityFileDialog, and api.workout-result/upload for FIT attachment. Treat “loop” as the supported manual repeat group; nested repeats are intentionally unsupported and must not be tested as a broken flow.

For each proposed scenario, record priority (must/should/deferred), preconditions and exact local fixture need, user steps, expected visible result, expected durable/readback result after reload, cleanup/reversibility, and desktop/mobile coverage. Confirm whether sample-fit-from-zip.fit is a safe compatible candidate for later local-only attachment testing; do not upload it now. Separate single manual-workout deletion from Calendar's broader future-workout deletion. State source-protected/generated boundaries explicitly.

The catalog must cover, at a minimum: Calendar admission; manual create with a simple repeat group; edit/save/cancel/validation and protected-source denial; move/reload/undo; copy only if independently supported; reviewed delete/cancel/confirmation/readback; FIT attach/readback/removal where safe; and core navigation, keyboard/focus, error feedback, desktop/mobile containment. Keep it small enough for repeated use and mark any unavailable fixture or non-reversible mutation as a precise blocker rather than fabricating it.

Run only read-only inventory and documentation checks appropriate to Stage 1. Update this item with the English proposed catalog, facts, any open fixture questions, and the exact Stage 2 acceptance inventory. Return a tracked QA planning receipt in English. Stop after the plan and wait for PRODUCT/Ivan approval before any browser or data-mutating QA execution. Do not claim user readiness, Global QA, hosted parity, release readiness, or production acceptance.
```

## Stage 2 Tracked QA Receipt — 2026-08-15

### Acceptance context and browser preflight

- Validation layer: focused local core-workout readiness, not Global QA, hosted, release,
  deployment, or production acceptance.
- Role and procedure: QA; `agents/qa.agent.md`, `skills/hito-qa-browser-regression/SKILL.md`, and
  `skills/hito-backend-supabase-contract/SKILL.md` were used. No subagent was used.
- Runtime: one serialized managed restart produced a fresh, healthy `qa_fixture` artifact at
  `http://127.0.0.1:3000/` (PID 36008), bound to loopback with matching runtime/build receipts. The
  local Supabase target was `http://127.0.0.1:54321`. No duplicate runtime/build owner was present.
- Identity boundary: the built-in browser initially inherited the retained
  `fit-product-acceptance@local.test` cookie. QA logged out before any Product action or mutation and
  then used only `qa-baseline@local.test` and `qa-isolation-a@local.test`. The retained identity and
  FIT evidence were not changed.
- Fixture boundary: `qa-baseline@local.test` was the profile-preserving disposable manual-workout
  lifecycle. `qa-isolation-a@local.test` was fully reset and reserved for the exact-date FIT branch.
  No direct database shaping was used.
- Browser: built-in managed browser at exact `1470x801` and `375x812`, with DOM, keyboard, console,
  overflow, reload, durable-inventory, and screenshot evidence. A fresh browser tab was used to
  eliminate an isolated pre-login hydration error caused by the inherited retained-session
  transition; the admitted disposable flow and final zero-state tab had no console errors.

### Executed inventory

| Check                                    | Scenario / environment                                                                                   | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                             |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Runtime admission                        | Managed local `qa_fixture`; loopback runtime and local Supabase                                          | Passed | Fresh/healthy managed status at `127.0.0.1:3000`; loopback DB target `127.0.0.1:54321`; no competing owner; final status remained fresh and healthy                                                                                                                                                                                                                                  |
| Authentication/privacy/provider boundary | Unauthenticated root, retained-session exit, disposable local sign-in, runtime event log                 | Passed | Signed-out root rendered the login form; ordinary local authentication reached Calendar; retained identity was logged out before mutation; last 100 runtime events had `providerKind: null`; no hosted/provider access                                                                                                                                                               |
| Lifecycle baseline                       | Named disposable inventories before mutation                                                             | Passed | `qa-baseline@local.test` had one existing profile and zero task-owned plan/workout/result/activity rows; `qa-isolation-a@local.test` was fully zero; no lease was active                                                                                                                                                                                                             |
| WC-01                                    | Calendar admission and source-capability map, desktop/mobile                                             | Failed | Authenticated Calendar and manual capability passed, but ordinary `Add rest day -> Review -> Add workout` was rejected with `Create at least one reviewed workout before starting a manual user-built active plan.` even after one reviewed manual workout existed; protected-source state was unavailable after the FIT fixture admission failure                                   |
| WC-02                                    | Create `QA Repeat Session` on `2026-08-17` with Warmup, Work/Recover x3, Cooldown; desktop/mobile/reload | Passed | Invalid Easy/Recover group was blocked factually; corrected review was Ready; one manual row persisted; detail reload showed 24 min, x3, and eight expanded blocks; screenshots `wc-02-repeat-ready-desktop.png` and `wc-02-detail-mobile.png`                                                                                                                                       |
| WC-03                                    | Edit cancel, validation rejection, valid save, protected-source denial                                   | Failed | Unsaved title/repeat changes were discarded after close/reload; invalid Work-child replacement was blocked; corrected title `QA Repeat Session Edited` and x4 persisted once as 27 min/ten blocks. Protected-source denial was not runnable because the protected fixture could not be admitted                                                                                      |
| WC-04                                    | Move/reload/Undo and desktop drag variant                                                                | Failed | Menu move `2026-08-17 -> 2026-08-18` persisted with one row; an Undo countdown was visible before reload but disappeared after immediate reload, preventing canonical Undo. Normal reverse move restored the source date without duplication. Two bounded desktop drag gestures against the exposed draggable row caused no mutation, so drag remains a browser-control evidence gap |
| WC-05                                    | Copy/Paste to empty date and stored-Rest exclusion                                                       | Failed | Copy from `2026-08-17` and Paste to truly empty `2026-08-18` passed; reload showed two independent rows with matching prescription and distinct dates. Stored-Rest no-Paste could not be proved because ordinary Rest creation was rejected                                                                                                                                          |
| WC-06                                    | Reviewed single-row clear cancel/confirm, desktop and 375px                                              | Passed | Review named `2026-08-18`, the workout, duration/type, and one-row effect; Cancel was a durable no-op; mobile confirmation removed only the copied row while the manual plan/source row remained; screenshots `wc-06-clear-review-desktop.png` and `wc-06-clear-confirm-mobile.png`                                                                                                  |
| WC-07                                    | `sample-fit-from-zip.fit` on disposable `2026-05-05` workout                                             | Failed | Full reset proved the FIT identity clean, but the ordinary canonical template import failed before upload with `CalendarPersistenceRejection: Future schedule materialization accepts only reviewed future rows.` / `invalid_input`; no exact-date workout was admitted and the FIT file was not uploaded                                                                            |
| WC-08                                    | Navigation, keyboard/focus, errors, console, containment                                                 | Failed | Error feedback, action-menu Escape/focus return, mouse navigation, clean admitted console, and `scrollWidth === innerWidth` at 1470 and 375 passed. Focused `Back to Calendar` (`href="/"`) ignored native Enter through both locator and computer-control paths, while pointer click navigated                                                                                      |
| Responsive containment                   | Calendar, detail, editor, validation, clear review, final zero at exact desktop/mobile sizes             | Passed | No page-level horizontal overflow at 1470 or 375; relevant controls and receipts remained usable; saved artifacts listed below                                                                                                                                                                                                                                                       |
| Final convergence                        | reset -> zero -> seed -> status -> reseed -> repeated status -> final reset                              | Passed | Product UI seed created exactly one manual plan/workout; reset returned all task-owned rows to zero; reseed produced the same 1/1 state; two inventories agreed without accumulation; final reset left the baseline profile only and zero plan/workout/result/activity/comparison/log rows. Isolation identity also remained zero                                                    |
| Final runtime/provider gate              | Managed status, event log, authenticated zero-state readback                                             | Passed | Runtime remained fresh/healthy/loopback-only in `qa_fixture`; no provider dispatch appeared; final mobile Product readback showed the expected no-plan state with 375px containment and no console errors                                                                                                                                                                            |

### Defect inventory

#### D1 — Ordinary stored-Rest creation is rejected

- Scenario/precondition: WC-01/WC-04/WC-05; disposable manual plan already contained one reviewed
  non-Rest workout.
- Replay: Calendar `2026-08-19` -> `Add workout` -> `Add rest day` -> `Review` -> `Add workout`.
- Expected: one stored Rest row persists and can act as the move/Copy-Paste eligibility
  discriminator.
- Actual visible/durable result: `Workout not added` with `Create at least one reviewed workout
before starting a manual user-built active plan.`; no Rest row persisted. Runtime action failure
  was `source_workout_not_supported`.
- Severity: high for this focused catalog because it blocks a canonical user action and three Must
  discriminators.
- First incorrect canonical owner: BACKEND, manual-workout review/persistence contract in
  `src/lib/manual-workout-authoring/actions.ts`; the Rest branch is rejected before persistence.
- Cleanup: no Rest row was created; subsequent manual state was restored and finally reset to zero.

#### D2 — Move Undo does not survive the required immediate reload

- Scenario/precondition: WC-04; one editable manual workout on `2026-08-17`, empty eligible target
  `2026-08-18`.
- Replay: choose Move, select `2026-08-18`, observe the Undo countdown, immediately reload Calendar.
- Expected: the catalog-required Undo remains available, returns the same row to the source date,
  and a second reload shows no duplicate.
- Actual visible/durable result: the move persisted as exactly one target row, but the Undo control
  count changed from one before reload to zero after reload. The move could only be cleaned up using
  a separate normal reverse move.
- Severity: medium; durable move truth is correct, but the advertised recovery path is lost on
  reload.
- First incorrect canonical owner: FRONTEND Product,
  `src/components/calendar/manual-calendar-actions.ts` and Calendar projection/session-state
  ownership.
- Cleanup: normal reverse move restored the original date; reload proved one source row and an empty
  target.

#### D3 — Canonical disposable FIT fixture cannot admit the compatible exact-date workout

- Scenario/precondition: WC-07; fully reset `qa-isolation-a@local.test`; only
  `sample-fit-from-zip.fit` may be used; a compatible `2026-05-05` non-Rest workout is required before
  upload.
- Replay: `npm run test-user -- reset --email qa-isolation-a@local.test --plan
public/templates/hito-training-plan-v2-template.json`.
- Expected: the normal named lifecycle creates the reviewed template state, including the compatible
  workout, with a complete reset path.
- Actual visible/durable result: import stopped before upload with
  `CalendarPersistenceRejection: Future schedule materialization accepts only reviewed future rows.`
  and `invalid_input`; the persisted inventory remained unsuitable for FIT attachment.
- Severity: high coverage blocker; the Must FIT attach/readback/remove branch cannot safely execute
  without prohibited database shaping.
- First incorrect canonical owner: BACKEND fixture/import lifecycle and active-plan persistence
  adapter (`scripts/test-user.mjs`, `src/lib/active-plan-lifecycle-persistence.ts`, and the current
  future-row admission contract).
- Cleanup: full pool reset reran successfully; the identity ended with zero profiles, plans,
  workouts, results, assets, activities, comparisons, and logs. The FIT file was never uploaded.

#### D4 — Focused Back-to-Calendar link ignores native Enter

- Scenario/precondition: WC-08; authenticated manual workout detail in the managed browser.
- Replay: focus the visible `Back to Calendar` link (`href="/"`), send native Enter through the
  browser locator, then independently through computer-control keyboard input.
- Expected: both keyboard activation and pointer activation navigate to Calendar.
- Actual visible/durable result: focus remained on the link and neither Enter path navigated;
  pointer click navigated normally. No console error was emitted.
- Severity: medium accessibility/navigation defect.
- First incorrect canonical owner: FRONTEND Product, the link/button composition in
  `src/routes/workout.$date.tsx`.
- Cleanup: read-only interaction; no persisted state changed.

### Coverage gaps and consequences

- Protected/generated source edit denial was not observed because D3 prevented admission of a safe
  protected disposable workout. WC-01 capability mapping and WC-03 protected denial therefore do
  not have browser/durable proof.
- FIT attachment, reload, removal, and raw/normalized cleanup behavior were not run because the
  exact-date prerequisite failed before upload. WC-07 has no Product FIT-behavior acceptance.
- Stored-Rest move preservation and stored-Rest no-Paste were not run because D1 prevented a stored
  Rest row. The empty-date Copy/Paste branch remains independently proven.
- Desktop drag Move was attempted twice with the available browser-control gesture, but no drag
  mutation occurred. Because menu Move is the canonical Must path and its persistence was proved,
  this remains a `should` browser-control evidence gap rather than an additional Product defect.
- The original inherited-cookie tab emitted one React hydration error during the retained-session
  transition. A new tab against the current disposable fixture reproduced the admitted flows and
  final zero state without errors, so that isolated preflight event is not attributed as a focused
  defect.

### Saved evidence and cleanup

Browser evidence is under
`qa-artifacts/screenshots/2026-08-15/hito-workout-core-flow-qa-scenario-catalog/`:

- `wc-02-repeat-review-desktop.png`
- `wc-02-repeat-ready-desktop.png`
- `wc-02-detail-mobile.png`
- `wc-03-editor-mobile.png`
- `wc-03-validation-mobile.png`
- `wc-05-calendar-mobile.png`
- `wc-06-clear-review-desktop.png`
- `wc-06-clear-confirm-mobile.png`
- `final-zero-mobile.png`

Final cleanup passed. `qa-baseline@local.test` retains its pre-existing disposable profile and has
zero plans, workouts, results, assets, activities, comparisons, and logs. `qa-isolation-a@local.test`
is fully zero. No retained FIT evidence, hosted state, provider, production source, schema,
migration, fixture source, dependency, configuration, staging, commit, push, or deployment was
changed.

**Verdict: Failed**

The complete Must inventory did not pass because four independent defects/blockers and their stated
coverage consequences remain. This is a failed focused local core-workout readiness result only; it
does not claim Global QA, hosted parity, release readiness, deployment acceptance, or production
acceptance. PRODUCT is the next owner for routing the Backend and Frontend defects.

## Stage 3 Execution And Browser Path Preflight — 2026-08-15

- **Mode / validation layer:** Tracked focused local regression replay of WC-01 through WC-08 after
  the completed Backend and Frontend owner repairs. This is not Global QA, hosted, release,
  deployment, production, real-iPad/Safari, or native-drag acceptance.
- **Accepted repair inputs:** Backend Implementation DoD passed in
  `2026-08-15-hito-workout-rest-and-fit-fixture-lifecycle-recovery`; Frontend Product Implementation
  DoD passed in `2026-08-15-hito-workout-interaction-recovery`. Stage 3 will independently replay
  the browser and durable fixture outcomes rather than inheriting either implementation verdict.
- **Runtime admission:** the existing managed PID `88826` is compatible, loopback-bound, and
  healthy, but its build is stale/broken with `artifact_missing`; it is inadmissible as current
  browser evidence. No competing build process, build lock, fixture lease, or second runtime owner
  was present, and the Git index was empty. QA owns one serialized
  `qa:server:restart -- --provider-mode qa_fixture`, followed by a fresh/healthy/receipt-matching
  status gate before browser navigation.
- **Named disposable identities:** `qa-baseline@local.test` (`baseline-no-plan`) retains only its
  runner profile and has zero plan/workout/result/activity rows. `qa-isolation-a@local.test` is fully
  zero and reserved for the exact-date FIT branch. The retained `fit-product-acceptance@local.test`
  identity, protected Admin, hosted state, and all unrelated identities are excluded.
- **Lifecycle / cleanup:** use only the existing named `test-user` reset, fixed-template seed,
  inventory, Product UI mutation, and full reset paths. No direct SQL shaping, fixture-source edit,
  new fixture, migration, dependency, provider call, or compatibility path is admitted. The FIT
  upload is allowed only after the canonical lifecycle proves the owned non-Rest `2026-05-05`
  workout and complete cleanup coverage.
- **Browser path:** use the current managed loopback artifact through a supported non-prompting
  browser surface at exact `1470x801` and `375x812` in Light and Dark. Capture DOM, keyboard,
  pointer, focus/Escape, menu/dialog, reload, durable readback, overflow, console, and screenshots
  under `qa-artifacts/screenshots/2026-08-15/hito-workout-core-flow-qa-scenario-catalog-stage-3/`.
  Pivot to another supported local control surface when needed; a platform dialog ends that path.
- **Separate evidence tasks:** no real iPad/Safari device is available, and native desktop drag is
  not a Stage 3 Must discriminator. Their existing acceptance requirements remain open and will not
  be replaced by Chromium emulation or menu Move evidence.
- **Owner / write boundary:** QA owns runtime/fixture/browser evidence, the task artifact directory,
  and this Stage 3 receipt only. Product, Backend, Design System, schema, migrations, fixture source,
  configuration, hosted/provider state, dependencies, retained evidence, and Git lifecycle are
  read-only. New runtime artifact: none beyond the existing managed build output.
- **Failure policy:** record every independent failure and continue safe scenarios. Stop only an
  affected mutation branch when fixture integrity, persistence/read-model truth, or cleanup cannot
  be established. Return persisted/fixture disagreement to BACKEND and correct durable truth with
  wrong presentation/interaction to FRONTEND Product or DESIGN SYSTEM; QA does not fix forward.

## Stage 3 Tracked QA Receipt — 2026-08-15

### Validation layer and browser/runtime preflight

This was a focused local regression replay of the approved WC-01 through WC-08 catalog after the
completed owner repairs. It was not Global QA, hosted, release, deployment, production,
real-iPad/Safari, or native-desktop-drag acceptance.

QA replaced the inadmissible managed PID `88826` artifact (`artifact_missing`) with one serialized
managed `qa_fixture` restart. The admitted artifact ran as PID `98857` on
`http://127.0.0.1:3000`, reported `managed: true`, `healthy: true`, `loopbackBind: true`,
`providerMode: qa_fixture`, `artifactFreshness: fresh`, and `reason: receipt_matches`, and used only
the loopback local database at `127.0.0.1:54321`. No competing build/runtime owner, build lock, or
fixture lease was present. The unauthenticated route showed the local sign-in boundary before QA
used named disposable local identities. An inherited retained FIT session was signed out before
any action; `fit-product-acceptance@local.test` was not mutated.

The Product replay used `qa-baseline@local.test`, `qa-saved-plan@local.test`, and
`qa-isolation-a@local.test` only. Browser evidence was captured at `1470x801` and exact `375x812`,
in Light and Dark, through the in-app browser and a bounded Chrome fallback. A raw platform-prompting
file-chooser path was abandoned. The fallback `agent-browser` executable was unavailable and was not
installed because dependency mutation was outside this task.

### Executed inventory

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Runtime and authentication | Fresh managed loopback `qa_fixture`; unauthenticated then named local identities | Passed | PID `98857`; fresh/healthy/receipt-matching managed status; login-only unauthenticated route; loopback DB/runtime only |
| WC-01 | Calendar admission plus stored Rest, desktop/mobile | **Failed** | Rest creation reviewed as Ready and persisted; `/workout/2026-08-17` read back `Rest day`, but Calendar reload rendered `Mon, Aug 17. Add workout.` as if no stored row existed |
| WC-02 | Manual create with one repeat group | Passed | `QA Repeat Session`; Warmup 10 min, Repeat x3 of Work 2 min + Recover 1 min, Cooldown 5 min; detail/reload agreed on 24 min, three authored blocks, eight expanded runtime blocks; observed save about 1285 ms |
| WC-03 | Manual and source-authored edit/cancel/validation/protection | **Failed by coverage gap** | Manual cancel, invalid review, valid save/reload, and AI-authored future edit/review/save/reload passed; imported historical source was correctly protected, but no ordinary future imported disposable state existed for the required positive imported edit branch |
| WC-04 | Move to empty and stored-Rest targets, reload, Undo, reload | **Failed** | Empty-target move `2026-08-16 -> 2026-08-18` persisted but exposed no Undo. Stored-Rest move `2026-08-18 -> 2026-08-17` exposed a seven-second Undo before reload, then immediate reload exposed none while the moved workout remained durable. Empty-target action-to-menu observation was about 479 ms |
| WC-05 | Copy/Paste and stored-Rest exclusion | Passed | Stored Rest omitted Paste; genuinely empty `2026-08-18` exposed Paste; pasted row persisted with a distinct ID and the source remained. The action contract passed despite the independent WC-01 Rest presentation defect |
| WC-06 | Reviewed single-row clear cancel/confirm | Passed | Review named one date/title/24-minute row; Cancel was a durable no-op; Confirm removed only the copied target row while the source remained |
| WC-07 | Exact-date `sample-fit-from-zip.fit` attach/readback/remove | **Failed by evidence-capability gap** | Canonical reset/seed produced one compatible non-Rest `2026-05-05` workout and zero result/evidence rows, but both supported browsers failed to complete the local file chooser. The visible `qa_fixture` preview explicitly saved nothing, so attach/reload/remove proof was not fabricated |
| WC-08 | Keyboard/focus/error/overflow/console | Passed with separate device gaps | Native Chrome Tab then Enter activated `Back to Calendar` and reached `/` in about 961 ms; Escape closed the action dialog and returned focus; invalid repeat feedback was factual; no browser console warnings/errors |
| Responsive and theme matrix | Desktop `1470x801`; exact `375x812`; Light/Dark | Passed | Representative Calendar, repeat editor/detail, AI edit, copy/paste, and clear review/confirm remained page-contained; mobile `body/client/scrollWidth` was `375/375/375` and desktop was `1470/1470/1470` |
| Privacy and provider isolation | Runtime events and local identities | Passed | No hosted access, raw-asset transmission, or paid/external provider call. The only non-null provider record was the expected `local_dev_fixture` deterministic 10K generation |
| Final cleanup | Named disposable reset and exact-template convergence | Passed | `qa-baseline` retained only its profile and zero task-owned plan/workout/result/activity/evidence rows; `qa-saved-plan` and `qa-isolation-a` reached full zero; fixture leases were empty |
| Final lifecycle convergence | `reset -> zero -> seed -> status -> reset -> seed -> repeated status -> final reset` | Passed | Both exact-template seeds converged to profile `1`, active plan `1`, workouts `4`, results/evidence `0`; repeated status did not accumulate; final reset returned the identity to zero |
| Runtime end gate | Managed status before the documentation-only receipt write | Passed | Same fresh/healthy/loopback/receipt-matching PID `98857`; no subsequent Product/browser claim was taken after this receipt changed checkout bytes |

### Independent defects

1. **Stored Rest is presented as an empty Calendar date (Frontend Product, high).**
   - Preconditions: `qa-baseline@local.test`, future `2026-08-17`, no prior workout on that date.
   - Replay: Calendar -> Add workout -> Add rest day -> Review -> Add workout -> reload.
   - Expected: Calendar visibly distinguishes the durable stored Rest row from a genuinely empty
     date; detail and Calendar agree.
   - Actual: review and success feedback passed, durable inventory contained the Rest row, and direct
     detail showed `Rest day`; Calendar exposed `Add workout` and no stored-Rest identity.
   - First incorrect canonical owner/seam: Frontend Product Calendar projection. In
     `src/components/calendar/calendar-projection.ts`,
     `buildWorkoutCalendarDayPresentation` builds both `!workout` and `workout.type === "rest"`
     through the Rest surface while the add-action context also admits both; the Calendar consumer
     therefore fails to preserve the persisted empty-versus-stored-Rest distinction. No Backend or
     persistence repair is indicated by this replay.

2. **Move Undo does not survive the required ordinary path (Frontend Product, high).**
   - Preconditions: the editable repeat workout, one genuinely empty future target, and one durable
     stored-Rest target.
   - Replays: Move to the empty target and inspect the source date; independently Move to the stored
     Rest target, observe the seven-second Undo, immediately reload, then inspect both dates.
   - Expected: `Move -> reload -> Undo -> reload` returns the same workout ID to its source and, for
     the replacement branch, restores the displaced Rest without duplication.
   - Actual: the empty-target move exposed no Undo. The stored-Rest branch exposed Undo before reload
     but lost it after immediate reload, so neither required branch could execute the durable reverse
     step. The forward moves themselves persisted correctly.
   - First incorrect canonical owner/seam: Frontend Product transient Calendar action state in
     `src/components/calendar/manual-calendar-actions.ts` and the Calendar Undo projection. Backend
     target resolution classifies an empty persisted target as `rest_day`, and direct-move results
     return that classification; persistence/readback were correct. The incorrect observable is the
     missing or non-restored stored Undo affordance, not the move mutation.

QA did not implement either defect. Both affected identities were restored through their named
lifecycle before later independent checks and final convergence.

### Coverage gaps and consequences

- **Future imported-workout positive edit:** the normal disposable fixture lifecycle exposes only a
  historical imported workout, which correctly denied editing as protected past truth. No ordinary
  future imported row could be created without manual database or fixture-source shaping. Therefore
  imported positive edit/review/confirm remains unproved and WC-03 cannot pass in full.
- **Durable local FIT upload:** supported browser paths could not complete the native file chooser;
  the safe CLI fallback was not installed. The exact-date fixture and cleanup contract passed, but
  FIT attach, reload readback, removal cancel/confirm, and normalized-evidence preservation were not
  executed. WC-07 remains unproved; this is an evidence-capability gap, not a claimed Product defect.
- **Real iPad/Safari:** unavailable. No-hover iPad/Safari acceptance remains a separate evidence task;
  Chromium viewport emulation was not substituted for it.
- **Native desktop drag:** not rerun because Stage 3 treated it as a separate evidence task. Menu,
  keyboard, pointer, and native keyboard activation evidence do not claim native drag coverage.

### Evidence and preserved boundaries

Saved screenshots are under
`qa-artifacts/screenshots/2026-08-15/hito-workout-core-flow-qa-scenario-catalog-stage-3/`:

- `01-desktop-dark-manual-calendar-baseline.png` — SHA-256
  `efd2f2510a1b474180e524959ab6a8e240fc9eca8501716b522be86b2003c8f4`
- `02-mobile-dark-copy-paste-calendar.png` — SHA-256
  `475d0b288a0220bd17a52525aeddf60b1871044d2c2b7ffa320e862fd55ecb97`
- `03-desktop-light-clear-review.png` — SHA-256
  `aa023fdfc8d1a2a0d7fd356226212a0ca83bb210952bb1877907bcaf36ab66f2`
- `04-mobile-light-clear-confirm.png` — SHA-256
  `3fecfd4fc46fe2a3e2c9915185617b83e3f95b44d7a6f47ffa0c35afff073f25`
- `05-mobile-light-repeat-editor.png` — SHA-256
  `44bd968a4b1933e0c04e351ec9e4a14f80311f38b84c3ce6a30d187a71c24e4c`
- `06-mobile-dark-ai-edit.png` — SHA-256
  `b4ebae44b507caf3880078cb715c0554958a62b67ecfcf0ce2c816a2f41ebda9`

Browser console warnings/errors were empty in both admitted browser surfaces. Runtime failures were
limited to two intentional guessed-route `/calendar` 404s during preflight and the expected
`unsafe_block_structure` validation rejection. Product, Backend, Design System, schema, migrations,
fixture source, configuration, dependencies, hosted/provider state, retained FIT evidence, staging,
commits, pushes, deployment, and unrelated dirty work were not changed. QA changed only this
canonical lifecycle/receipt and task-owned screenshots. No subagent was used.

**Verdict: Failed**

The complete Must catalog cannot pass while WC-01 and WC-04 have demonstrated Frontend Product
defects and WC-03/WC-07 retain required evidence gaps. Final destructive cleanup and convergence
passed. This is a failed focused local core-workout readiness result only; it does not claim or
reject Global QA, hosted parity, release readiness, deployment acceptance, or production readiness.
PRODUCT is the next owner for routing.

## Proposed Recurring Scenario Catalog

### Stage 2 admission fixture

Stage 2 must use an existing named, disposable, authenticated local identity through its normal
reset/seed/status lifecycle. Its exact identity and lifecycle commands must be recorded in the
Browser Path Preflight. Admission requires all of the following without manual database shaping:

- a persisted runner profile and a single active `manual_user_built_plan_v1` plan with three known
  future dates at or after the plan start: two genuinely empty dates and one stored Rest date;
- one test-owned future non-Rest manual workout created through Product UI, plus deterministic
  readback of workout IDs, dates, source capabilities, structure, and active-plan identity;
- a separate source-protected workout state whose `sourceEditing` capabilities are known, so QA can
  prove the UI follows those capabilities instead of assuming that every generated, logged, or
  evidence-backed workout is directly editable;
- a persisted non-Rest workout dated `2026-05-05`, initially without result evidence, for the FIT
  scenario; and
- a reset that removes every task-owned manual row, result asset, runner activity/revision, workout
  log, and comparison created by this catalog while preserving unrelated and retained evidence.

If the existing lifecycle cannot provide and fully reset these states, Stage 2 must stop the
affected scenario as a Backend-owned fixture/persistence blocker. QA must not create those states by
direct SQL or reuse a retained Product-review identity.

### WC-01 — Authenticated Calendar admission and capability map

- **Priority:** must.
- **Preconditions / exact fixture:** admitted disposable identity; persisted profile; one active
  manual plan; two empty future dates; one stored Rest date; source-protected reference workout.
- **User steps:** prove an unauthenticated request cannot enter the saved Calendar, authenticate as
  the admitted identity, open Calendar, record current date/timezone, active-plan identity, the
  three target dates, and the actions exposed for the protected reference workout.
- **Expected visible result:** saved Calendar loads through the real authenticated flow; empty,
  Rest, and workout dates are distinct; only capability-authorized actions appear; no provider UI
  or preview-only fixture substitutes for persisted Product truth.
- **Expected durable/readback result:** reload returns the same plan, dates, workout IDs, and source
  capabilities with no new rows or state changes.
- **Cleanup / reversibility:** read-only; none.
- **Desktop/mobile:** full check at `1470x801` and exact `375x812`.

### WC-02 — Create one manual workout with a simple repeat group

- **Priority:** must.
- **Preconditions / exact fixture:** WC-01 passed; future empty date A in the manual plan.
- **User steps:** on date A choose **Add workout** -> **Start from scratch**; choose a non-Rest run
  type; add one **Repeat** container; set a small repeat count; add one valid work section and one
  explicit recovery section with bounded duration or distance; set a unique QA title; review and
  confirm **Add workout**. “Loop” means this one supported repeat group. Do not attempt nested
  repeats.
- **Expected visible result:** review shows the title, repeat count, work/recovery order, and totals;
  success returns to Calendar with the new workout on date A and its detail shows the same structure.
- **Expected durable/readback result:** reload preserves one new planned-workout row with a stable ID,
  date A, manual provenance, and the same repeat-group grammar and totals; no duplicate row appears.
- **Cleanup / reversibility:** retain this test-owned row for WC-03 through WC-06, then remove it by
  reviewed Product action and finally reset the disposable fixture.
- **Desktop/mobile:** perform the full create/review/save path at desktop; at `375x812` reopen the
  saved detail/editor and prove every repeat control is contained and usable.

### WC-03 — Edit, cancel, validation, save, and protected-source denial

- **Priority:** must.
- **Preconditions / exact fixture:** WC-02 workout; protected reference workout with explicit
  `sourceEditing` readback.
- **User steps:** open the WC-02 detail and edit it; first change title/repeat data and close without
  saving, then reload; reopen, make an invalid executable/recovery structure and request review;
  correct it, review, and save a unique edited title/repeat value; reload. Open the protected
  reference workout and inspect its actions.
- **Expected visible result:** close/cancel leaves the original values; invalid review shows factual
  blocked feedback without saving; corrected review enables **Save edited workout**; the protected
  workout exposes no direct edit/move/clear action that its capability model denies. Copy may remain
  available when the Product capability explicitly permits copying the prescription.
- **Expected durable/readback result:** cancel and rejected review make no persistent change; reload
  after save returns exactly the edited manual structure once; protected/generated/logged/evidence
  source content and provenance remain unchanged.
- **Cleanup / reversibility:** the saved edit is task-owned and is removed in WC-06/final reset;
  protected reference is read-only.
- **Desktop/mobile:** save and protected denial at desktop; cancel, validation feedback, keyboard
  traversal, and containment at `375x812`.

### WC-04 — Move to stored Rest, reload, and undo

- **Priority:** must.
- **Preconditions / exact fixture:** edited WC-02 workout on date A; future stored Rest date C; no log
  or evidence on the source; the Product displays an undo countdown after a direct Rest-day move.
- **User steps:** choose **Move workout**, select date C through the keyboard-accessible Calendar
  target path, verify the move, reload immediately in the same tab/session, and activate **Undo**
  within the displayed window; reload again. Desktop drag-and-drop is a separate `should` variant,
  not the only proof path.
- **Expected visible result:** the workout moves from A to C without a replacement dialog; the undo
  affordance survives the immediate same-session reload while valid; Undo returns the workout to A
  and restores C as Rest.
- **Expected durable/readback result:** first reload shows the stable workout ID on C; final reload
  shows that ID back on A and the original Rest truth on C, with no duplicate or residual row.
- **Cleanup / reversibility:** direct Rest-day move plus timely Undo is reversible; if the undo
  affordance is absent after immediate reload, preserve evidence and fail this scenario rather than
  replacing C or reshaping data.
- **Desktop/mobile:** full move/reload/undo at desktop; at `375x812` prove menu selection, target
  visibility, cancel path, countdown containment, and focus return. Drag is desktop-only `should`.

### WC-05 — Distinct Copy -> truly empty future Paste

- **Priority:** must; source inspection confirms this is an independent supported flow.
- **Preconditions / exact fixture:** WC-02 source on A; genuinely empty future date B; stored Rest
  date C.
- **User steps:** choose **Copy workout** on A; inspect both B and C; choose **Paste copied workout**
  only on B; open the pasted detail and reload Calendar.
- **Expected visible result:** copy confirmation identifies an empty-day paste; Paste appears on B
  but not on stored Rest C; source A remains; B shows the copied title/structure.
- **Expected durable/readback result:** reload returns two distinct workout IDs on A and B with the
  same copied prescription and preserved provenance metadata; C remains a stored Rest date.
- **Cleanup / reversibility:** use the pasted B row as WC-06's reviewed-delete target; final lifecycle
  reset is authoritative cleanup.
- **Desktop/mobile:** initiate Copy at desktop; prove B eligibility, C ineligibility, persisted B
  detail, and page containment at `375x812`.

### WC-06 — Reviewed deletion of one manual workout row

- **Priority:** must.
- **Preconditions / exact fixture:** test-owned pasted workout on B and original workout on A; neither
  logged nor evidence-backed.
- **User steps:** choose the destructive single-workout action on B; inspect the server-reviewed
  date/title/summary; cancel and reload; repeat review, confirm **Clear workout**, and reload.
- **Expected visible result:** cancel closes with B intact; confirmation clearly names one planned
  row, keeps the active plan active, refreshes Calendar, and removes only B. This scenario never uses
  Calendar's broader future-workout deletion/overflow action.
- **Expected durable/readback result:** cancel changes nothing; confirmed readback has no B row while
  A, C, the active plan, protected history, logs, FIT evidence, and generated provenance are
  unchanged.
- **Cleanup / reversibility:** the exact row ID is deleted and cannot be reconstructed as the same
  row; it is safe only because B is task-owned and the named fixture has a full reset. Delete the
  remaining A row by the same reviewed action or reset after other checks.
- **Desktop/mobile:** perform cancel at desktop and final reviewed confirmation at `375x812`; verify
  dialog containment, destructive naming, focus return, and reload truth in both.

### WC-07 — Local FIT attach, durable readback, and raw-file removal

- **Priority:** must when the admitted disposable FIT lifecycle is fully resettable; otherwise a
  precise Stage 2 blocker, not a fabricated pass.
- **Preconditions / exact fixture:** owned persisted non-Rest workout dated `2026-05-05`, no existing
  evidence, and reset coverage for all result/activity/log/comparison rows. Use only repository file
  `sample-fit-from-zip.fit` (SHA-256
  `fb5e9a4b3a0d9ff90e105c174bb728f730de621875b17503db8981cb80c108a2`).
- **User steps:** open the workout detail/Activity file dialog; attach the FIT; inspect observed facts
  and Plan vs Run; reload; request **Remove file**, cancel once, then confirm removal and reload.
- **Expected visible result:** authenticated local upload succeeds without provider dispatch; the
  activity is Garmin running truth dated `2026-05-05` with 3 parsed intervals, about `5.4205 km` and
  `40.17 min`; observed facts are labeled as run facts and Plan vs Run contains only prescribed
  comparisons. Cancel preserves the file; confirm reports that the activity file was removed and
  the manual workout log stays unchanged.
- **Expected durable/readback result:** post-upload reload preserves the asset, normalized actuals,
  activity/log, and comparison under the owned workout. Removal deletes private original-file
  availability/reprocessing only; normalized actual metrics, comparison, runner activity, and log
  remain factual. Therefore removal is not a full rollback.
- **Cleanup / reversibility:** mandatory full named-fixture reset after evidence capture, followed by
  zero-owned-row status and reseed/readback. If reset does not cover the preserved normalized/log
  truth, do not upload and return the blocker to Backend.
- **Desktop/mobile:** perform attachment and factual readback at desktop; perform removal cancel,
  confirmation, reload, dialog containment, and focus return at `375x812`. The file chooser itself
  need not be invoked twice.

### WC-08 — Cross-cutting navigation, keyboard, error, console, and containment

- **Priority:** must and applied while WC-01 through WC-07 run.
- **Preconditions / exact fixture:** same admitted runtime/session; browser control can issue native
  Tab, Enter/Space, Escape, reload, and exact viewport changes without a platform permission dialog.
- **User steps:** navigate Calendar -> workout detail -> back; open every touched menu/dialog from
  keyboard, exercise Escape/cancel and focus return, observe the WC-03 validation error, monitor
  console/page errors, and measure page-level overflow at desktop and exact `375x812`.
- **Expected visible result:** routes and back navigation remain coherent; focus is visible and
  returns to the invoking control; errors are actionable and non-destructive; dialogs/menus and
  repeat rows remain usable with no page-level horizontal overflow.
- **Expected durable/readback result:** navigation, rejected validation, Escape, and cancel paths add
  no persistent rows or changes; the final fixture status matches the expected cleanup baseline.
- **Cleanup / reversibility:** no independent mutation; finish with named reset, zero-owned-row
  receipt, seed/reseed, and repeated stable status without accumulation or provider dispatch.
- **Desktop/mobile:** desktop `1470x801` and exact `375x812`; no width substitution.

### Capability and source boundaries

| Source/readback state                                                    | Allowed catalog action                                                               | Preserved boundary                                                                                               |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------- |
| Test-owned future, unlogged manual workout with affirmative capabilities | Create/edit/move/copy/reviewed clear                                                 | Mutations remain in the active runner-owned plan and retain auditable provenance                                 |
| Generated/imported prescription                                          | Only actions explicitly exposed by `sourceEditing`; Copy may create a new manual row | Never relabel or directly rewrite protected source provenance merely because content is reconstructable          |
| Logged, skipped, or evidence-backed workout                              | Copy only when `canDirectCopy` is true                                               | No move, clear, drag, history deletion, FIT fact deletion, or completion rewrite                                 |
| Past unlogged workout                                                    | Copy/move/clear only when exposed; no content edit                                   | Past date and original prescription provenance remain truthful                                                   |
| Stored Rest date                                                         | Eligible Rest target where allowed; never treated as empty Paste target              | Rest remains explicit persisted truth and is restored by successful Undo                                         |
| FIT observed result                                                      | Attach/read/remove raw original only through the owned endpoints                     | Observed metrics stay observed; prescribed targets stay planned; raw removal does not erase normalized/log truth |

### Explicit deferred/excluded scenarios

- Nested repeat groups are intentionally unsupported and are not a broken-flow test.
- Calendar's broader future-workout deletion/replacement action is not the single-row reviewed clear
  contract and is deferred from this catalog.
- Generated-plan creation, provider sync, hosted data, retained FIT identities, Admin, onboarding,
  integrations, and production/release acceptance remain out of scope.
- Desktop drag move is `should` evidence only because the menu/Calendar-target path is the accessible
  canonical `must` path.

## FIT Candidate Decision

`sample-fit-from-zip.fit` is a safe and compatible **candidate** for later local-only attachment
testing, not an admitted upload target by itself. Read-only parsing identified `garmin_fit`, running,
provider-local date `2026-05-05`, 3 intervals, `5.4205 km`, and `40.17 min`; the existing workout
evidence comparison contract passed. Stage 2 must still pair it with an owned disposable non-Rest
workout on that date and prove full lifecycle reset before upload. The file was not uploaded or
modified in Stage 1.

## Open Fixture Questions / Stage 2 Stop Gates

1. Which existing named disposable local identity/lifecycle provides the manual-plan, protected
   source, and exact-date FIT states above? Stage 1 found product and validator fixtures, but no
   admitted browser lifecycle that proves all three states and cleans them together.
2. Does that lifecycle's reset explicitly remove FIT-created original asset state, retained
   normalized activity/revisions, comparison, and workout log? Product removal alone intentionally
   leaves factual normalized/log truth.
3. Can the lifecycle expose a stored Rest date and two truly empty future dates without direct row
   shaping? If not, Backend must provide or identify the canonical disposable fixture before Stage 2.

These are admission questions, not Product defects. An unresolved answer blocks only the affected
Stage 2 mutation and must be reported before browser execution.

## Exact Stage 2 Acceptance Inventory (approval-gated)

| Check              | Scenario / environment                                                | Required result                                                                                                        | Evidence                                                             |
| ------------------ | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------- |
| Runtime admission  | Fresh managed loopback `qa_fixture`; no competing runtime/build owner | Healthy, fresh, loopback-only artifact; named disposable identity; unauthenticated boundary; no hosted/provider access | Server status/receipt, runtime-source digest, auth redirect/denial   |
| Lifecycle baseline | Named reset -> zero -> seed -> status                                 | Exact admitted manual/protected/FIT fixture states; stable IDs/counts; no accumulation                                 | Command outputs and authenticated readback                           |
| WC-01              | Calendar, `1470x801` and `375x812`                                    | Authenticated persisted Calendar and truthful capability map                                                           | Screenshots, DOM/actions, source/readback receipt                    |
| WC-02              | Manual create with one repeat group                                   | Review/save/detail/reload agree; one row only                                                                          | Screenshots, row ID/date/structure before and after reload           |
| WC-03              | Edit cancel/reject/save plus protected denial                         | No-op branches are durable no-ops; valid edit persists; protected truth unchanged                                      | Dialog/error evidence and before/after readback                      |
| WC-04              | Move to Rest -> immediate reload -> Undo -> reload                    | Same ID moves and returns; Rest restored; no duplicate                                                                 | Calendar/detail readback and undo timing evidence                    |
| WC-05              | Copy -> empty B Paste; stored Rest C                                  | Paste only on truly empty B; distinct ID persists; C remains Rest                                                      | Action eligibility, detail, and reload readback                      |
| WC-06              | Single-row reviewed clear cancel/confirm                              | Cancel no-op; confirm deletes only B; active plan/history/evidence preserved                                           | Review receipt and before/after readback                             |
| WC-07              | `sample-fit-from-zip.fit` on disposable `2026-05-05` workout          | Factual attach/reload; cancel no-op; raw removal truth; full lifecycle reset                                           | Upload/readback/removal receipts, observed metrics, final zero state |
| WC-08              | Native keyboard, focus, console, overflow                             | Usable focus/Escape/return; actionable errors; no page overflow or console/page errors                                 | Focus/DOM metrics, console capture, desktop/mobile screenshots       |
| Final convergence  | reset -> zero -> seed -> status -> reseed -> repeated status          | No task-owned residue, accumulation, hosted access, or provider dispatch                                               | Lifecycle outputs and final authenticated readback                   |

Any runtime/fixture/persistence/read-model disagreement stops at Backend; correct durable truth with
wrong presentation or interaction stops at the appropriate Frontend Product or Design System owner.
QA does not fix forward.

## Stage 1 Tracked QA Planning Receipt

| Check                        | Scenario / environment                            | Result                           | Evidence                                                                                                                                       |
| ---------------------------- | ------------------------------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Operating preflight          | QA Stage 1, current checkout                      | Passed                           | Read `AGENTS.md`, `agents/qa.agent.md`, browser-regression skill, and this complete item; declared documentation-only write boundary           |
| Owner/reachability inventory | Current source, read-only                         | Passed                           | Confirmed named manual constructor/edit, Calendar move/copy/undo, reviewed single-row clear, workout detail/dialog, upload, and removal owners |
| Repeat boundary              | Manual validator/editor, read-only                | Passed                           | One repeat group is supported; nested repeats reject as `nested_repeat_not_supported` and are excluded from broken-flow testing                |
| Copy discriminator           | Calendar projection/authoring controls, read-only | Passed                           | Copy is distinct; Paste is exposed only when copied source exists and the target has no workout row; stored Rest is not empty                  |
| Delete discriminator         | `ManualWorkoutSourceActionMenu`, read-only        | Passed                           | Two-phase review/confirmation owns one planned row and is separate from future-workout overflow deletion                                       |
| FIT candidate                | Static local parser/contract, no upload           | Passed with Stage 2 fixture gate | SHA-256 recorded; parsed as running FIT dated `2026-05-05`; `node --import tsx ./scripts/validate-workout-evidence-comparison.ts` passed       |
| Mutation/browser execution   | Stage 1                                           | Not run by design                | Approval gate preserved; no runtime, fixture, database, upload, or browser mutation occurred                                                   |

**Issues:** none in Stage 1 scenario design. The admitted disposable browser lifecycle remains an
explicit Stage 2 prerequisite, not an inferred pass.

**Coverage gaps:** no Product browser behavior, authenticated durable mutation, responsive runtime,
or cleanup convergence was executed. Consequently this receipt proves only catalog completeness and
source-backed feasibility; it does not prove local user readiness.

**Stage 1 Verdict: Passed — catalog ready for Product/Ivan approval. Stage 2 remains unstarted.**

## Stage 2 Dispatch Prompt

```text
ROLE: QA

Task: Hito Workout Core Flow QA Scenario Catalog
Stage: Stage 2 — local acceptance execution and complete defect inventory
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md

Ivan explicitly approved and asked to start the complete local workout-flow test pass. Read
AGENTS.md, agents/qa.agent.md, and skills/hito-qa-browser-regression/SKILL.md, then reread the
full approved catalog and Stage 1 receipt in this item. QA owns verification only: do not edit
product code, Design System code, schemas, migrations, fixtures, hosted data, configuration, or
Git lifecycle; do not repair defects.

Perform the complete Exact Stage 2 Acceptance Inventory. First establish a healthy, fresh,
loopback-only managed `qa_fixture` runtime and a named disposable fixture lifecycle. The fixture
must be able to create and fully clean task-owned manual workouts, FIT results, activities,
comparisons, and logs without direct database shaping. Use only `sample-fit-from-zip.fit` for the
FIT scenario, and only after proving that its compatible `2026-05-05` workout and full cleanup are
available. No hosted service, real user identity, provider call, or retained review identity may
be used.

Run every Must scenario WC-01 through WC-08 and the desktop drag Move variant when the fixture
supports it. Do not stop the overall pass at the first product failure. For every independent
failure, capture a reproducible defect record: scenario, fixture precondition, exact steps,
expected versus actual visible and durable/readback outcome, browser/console evidence, severity,
first incorrect canonical owner or exact discriminator, and cleanup status. Restore or reseed the
disposable baseline before continuing a later scenario whenever the prior failure or action mutated
state. Continue all independent scenarios after a failure.

Stop only an affected mutation branch when fixture integrity, durable-truth readback, or cleanup
cannot be established; continue safe independent and read-only checks. If the managed runtime cannot
be admitted at all, exhaust the canonical local recovery route that QA owns, then report the exact
admission evidence and every scenario prevented by it. Do not substitute stale or ad hoc runtime
proof.

At the end, run final reset -> zero -> seed -> status -> reseed -> repeated-status convergence.
Update the same item with an English Tracked QA receipt: the full inventory, every discovered bug
(including subsequent ones after the first), all coverage gaps, artifact locations, cleanup result,
and `Verdict: Passed` only if all Must scenarios and final cleanup converge. Otherwise use
`Verdict: Failed` and state that this is a focused local core-workout readiness result, not Global
QA, hosted, release, deployment, or production acceptance.
```

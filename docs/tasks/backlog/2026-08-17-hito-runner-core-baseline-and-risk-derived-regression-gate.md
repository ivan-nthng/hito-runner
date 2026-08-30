# Hito Runner Core Baseline And Risk-Derived Regression Gate

## Work Item ID

13690e44-6cb9-44a6-9d05-d3f1cfc84f02

## Status

completed

## Type

Tracked — product readiness and QA gate adoption

## Priority

critical

## Owner

PRODUCT

## Epic

runner-core-readiness

## Parent

[Runner Core Roadmap](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Hito DS Factual Activity Sequence Display-Unit Deduplication](./2026-08-17-hito-ds-factual-activity-sequence-display-unit-deduplication.md)

[Runner Progress Factual Activity Sequence Frontend Adoption](./2026-08-17-hito-runner-progress-factual-activity-sequence-frontend-adoption.md)

## Evidence From

[Runner Core Full Local QA Audit And Defect Ledger](./2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md)

[Workout Core Flow QA Scenario Catalog](./2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md)

[Runner Core QA Fixture File-Flow Browser Bridge](./2026-08-16-hito-runner-core-qa-fixture-file-flow-browser-bridge.md)

## Supersedes

[Runner Core Full Local QA Audit And Defect Ledger](./2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md)

## Scope

After the remaining in-flight Runner Product work closes, establish one accepted Runner Core baseline
and a risk-derived regression gate before any new adaptive-planning, commercial, financial, or
owner-analytics feature begins. This item is the lifecycle owner for the adoption; existing scenario
records, test code, fixture commands, validators, and QA artifacts remain their own factual owners.

## Archive Intent

Retain until the Runner Core baseline is accepted and its ongoing feature/epic regression policy is
demonstrably executable. Then compact to the accepted gate, required Core flows, impact rules, and
remaining device boundary.

## Task

Make the Runner product safe to extend without recreating sources of truth or manually rediscovering
old flows. A completed feature declares the contracts and Core flows it affects; a completed epic
runs its full acceptance matrix plus the Runner Core regression suite. Small, local corrections run
only focused owner proof. No patch layer, alternate data model, second QA tracker, or blanket manual
retest is admitted.

## Accepted Product Direction

- The Runner Core is one source-of-truth product: an AI, imported, or manual source is used only for
  initial proposed placement; confirmed Calendar workouts are independently runner-owned. No active
  plan/container authority, product copy, fixture, validator, or compatibility path may return.
- A feature extends an existing contract or explicitly admitted new canonical contract. It cannot
  transform, cache, reconstruct, or silently repair another owner's truth in a downstream consumer.
- Every retained feature records its user-visible outcome, affected source/DS/Product boundaries,
  new scenarios, preserved Core scenarios, fixture state, and smallest risk-derived proof.
- A local styling/copy/one-component correction receives focused owner proof only. A completed
  feature runs its new scenario pack, all touched contract checks, and the bounded Core smoke for
  its blast radius. A completed epic runs its complete scenario matrix plus Runner Core regression.
  Release remains a distinct whole-candidate gate.
- The automated Core suite tests user-visible behavior against isolated local `qa_fixture` identities
  and canonical seeded facts. It uses stable user-facing locators and durable readback, not CSS,
  implementation internals, shared personal sessions, or test ordering.
- A discovered durable user-contract bug becomes a permanent regression scenario once its canonical
  owner and deterministic fixture condition are demonstrated. Transient environment failures are
  recorded separately and never encoded as false product regressions.

## Required Core Baseline

The accepted suite must cover these source-of-truth flows, including happy, denial, cancellation,
reload, and cleanup truth where applicable:

1. Create a manual, AI-authored, and imported source; review and explicitly materialise independent
   Calendar workouts without runner-facing plan/container authority.
2. Create a standalone manual workout; edit, move, occupied-target replace/Undo, copy, clear, and
   delete it, with durable reload and source/target preservation.
3. Present Rest, skipped, completed, and evidence-protected workout states truthfully.
4. Browse immutable Past Plans and reuse a selected source/block onto new dates through review and
   explicit conflict handling, without changing existing independent workouts.
5. Export future Calendar workouts as JSON and import a supported JSON source through its ordinary
   review/materialisation flow.
6. Upload and remove a local FIT result through the production ingestion path; preserve factual
   evidence/metrics and enforce allowed versus protected actions.
7. Render factual Progress: FIT-backed observations and records, scheduled-only completion without
   FIT, coverage/missing/error states, and existing factual metrics without invented inference.
8. Preserve accessible desktop/mobile Light/Dark behavior: keyboard, focus return, containment,
   console health, privacy boundaries, and fixture isolation. Real iPad/Safari remains a separately
   recorded device gate until an actual device path is available.

## Execution Model

1. PRODUCT reconciles the existing Runner Core QA ledger and scenario catalog into one current
   inventory without duplicating lifecycle truth.
2. QA maps each required flow to its existing deterministic fixture and executable proof. Missing
   automation is routed only to the first owning role; QA does not implement product repairs.
3. Each defect is fixed through one canonical owner at a time, then its scenario becomes a stable
   regression proof when it represents a durable contract.
4. QA runs the complete Runner Core matrix after all admitted repairs, records every issue rather
   than stopping at the first, and closes the gate only with clean reset/reseed/readback evidence.
5. Before any future feature/epic dispatch, PRODUCT states the impacted Core scenario set. After a
   feature, run its new scenarios, touched contracts, and applicable Core smoke; after an epic, run
   the full epic matrix plus Core regression.

## Demonstrated Current State

The repository has deterministic local fixture lifecycle, local Backend validators, focused product
proofs, DS validators, and browser acceptance artifacts. The FIT/upload and future-import browser
bridge is completed. However, the Core QA audit remains in progress and the historical scenario
catalog is blocked/stale relative to later repair receipts. Therefore Runner Core has not yet earned
a single accepted baseline gate; adding new complex product capabilities before reconciliation would
reopen already repaired boundaries.

## What Not To Touch

Do not create a patch framework, alternate product/store/data truth, generic test orchestration
service, duplicate tracker, synthetic production behavior, broad compatibility layer, hosted test
state, paid-provider tests, release process, adaptive planning, payments, financial model, owner
analytics, or implementation source under PRODUCT. Reuse the existing `qa_fixture`, test identities,
fixture commands, validators, source contracts, DS contracts, and canonical scenario/receipt owners
before proposing anything new.

## Validation Expectations

The gate is complete only when the current scenario inventory is traceable to executable proof,
every admitted Runner Core user flow passes against isolated deterministic state, source and Design
System contracts remain singular, stale ledger results are reconciled rather than copied, cleanup
converges, and the final QA receipt distinguishes executed proof from deferred physical-device or
hosted boundaries. No completion may claim Analytics, adaptive planning, payments, hosted, release,
or Global QA outside the assigned acceptance inventory.

## Stage

Local Runner Core baseline accepted after final full QA replay

## Next Recommended Role

PRODUCT

## Blocker

None. The current local Runner Core baseline, deterministic cleanup, and admitted browser matrix
passed. Hosted, deployment, release, production, real iPad/Safari, and native desktop drag remain
separate acceptance boundaries.

## PRODUCT Execution Preflight — 2026-08-17

The display-unit correction and its focused Progress replay are completed. The historical audit's
AUD-01, AUD-02, and AUD-06 failures have separate completed repair receipts; its former FIT/import/
export browser-control gaps now have the completed fixture and browser bridge. The prior audit and
the older workout catalog remain historical evidence only. This item is the one active Runner Core
baseline lifecycle owner and must record one consolidated current result rather than append another
parallel defect ledger.

No runtime source, schema, fixture contract, or Design System contract is changed by PRODUCT. QA is
standing-authorized to use and reset isolated local `qa_fixture` identities, control the managed
loopback runtime, and collect evidence. It must not use hosted data, providers, Ivan's session, or
retained FIT evidence.

## QA Execution And Browser Path Preflight — 2026-08-17

- **Validation layer:** Tracked local Runner Core baseline execution and risk-derived regression
  acceptance. This is not hosted, release, deployment, production, physical-device, or Global QA
  outside this explicitly bounded inventory.
- **Accepted current inputs:** both declared dependencies are `completed`; the completed local-only
  file-flow bridge is an implementation input only. The 2026-08-15 catalog and 2026-08-16 ledger
  remain historical scenario/replay evidence and are not current acceptance truth.
- **Checkout and writer boundary:** the Git index is empty. No managed build-output lock is active,
  the dependency owners are terminal, and no current canonical source writer was admitted. The
  intentionally dirty tracked/untracked Product, Backend, Design System, migration, documentation,
  and fixture bytes remain read-only. QA owns only this lifecycle/receipt and evidence under
  `qa-artifacts/screenshots/2026-08-17/hito-runner-core-baseline-and-risk-derived-regression-gate/`.
- **Runtime admission:** managed PID `66258` is rejected because it is incompatible, unhealthy,
  `stale/broken`, and missing the current private Admin artifact marker. QA will first restore only
  the repository-owned local Supabase lifecycle, then perform one serialized
  `qa:server:restart -- --provider-mode qa_fixture`. Browser evidence is admitted only from a
  managed, compatible, healthy, loopback-bound, fresh, `receipt_matches` artifact.
- **Named disposable lifecycle:** use only existing `qa-baseline`, `qa-isolation-a`,
  `qa-isolation-b`, and `qa-saved-plan` roles through `test-user`, runner-core file-flow, and
  design-profile reset/seed/status commands. The retained FIT review identity, protected Admin,
  personal sessions, hosted state, providers, direct SQL shaping, new identities, and fixture-source
  changes are excluded. The initial inventory currently cannot read local Auth because local
  Supabase is stopped; this is an environment admission condition, not a Product failure.
- **Browser path:** after fresh admission, use a supported non-prompting local browser controller at
  exact `1470x801` and `375x812`, in Light and Dark. Use stable visible roles/names and capture
  authentication, source review/materialisation, Calendar/workout mutations, file flows, Progress,
  keyboard/Enter/Escape/focus, durable reload, containment, console, privacy, and screenshots. A
  platform permission dialog ends only that tool path and triggers a safe local pivot.
- **Continuation policy:** record every independent defect and coverage gap and continue safe
  branches. Stop only the affected mutation family for authentication/privacy, fixture integrity,
  durable readback/cleanup, or a hard control boundary. QA does not repair Product, Backend, Design
  System, schema, migration, fixture, dependency, hosted, provider, or Git state.
- **Terminal gate:** reset every task-owned identity, prove empty cleanup candidates and leases,
  run canonical reset -> zero -> seed -> status -> reseed -> repeated status -> final reset without
  accumulation or provider dispatch, then record one English receipt and one next PRODUCT route.

## QA Replay Execution And Browser Path Preflight — 2026-08-17

- **Validation layer:** independent Tracked local Runner Core baseline replay after the completed
  current-date file-flow fixture repair. This is not hosted, deployment, release, production,
  physical-device, or broader Global QA acceptance.
- **Role and procedure:** `agents/qa.agent.md` with
  `skills/hito-qa-browser-regression/SKILL.md` and the scoped local fixture/readback procedure from
  `skills/hito-backend-supabase-contract/SKILL.md`. No subagent is used because this execution
  requires one serialized runtime and fixture owner.
- **Repair discriminator:** the completed Backend receipt is an implementation input, not QA
  acceptance. QA will independently require `runner-core-file-flow-seed --as-of-date 2026-08-17`
  to select Thursday `2026-08-20`, preserve the weekday-Rest invariant, create one independent
  `file_import` Calendar workout with immutable source provenance, create zero active/materialized
  plan authority, and converge through the normal proof/cleanup lifecycle.
- **Checkout and writer boundary:** `main` equals `origin/main` at
  `abd4fe8355e3c644095111a654c1560aa265d104`; the Git index is empty and `git diff --check` is
  clean. The large intentional tracked/untracked candidate is preserved read-only. Process and
  managed-runtime inspection found no active build writer; PID `72574` is the prior managed
  loopback runtime and is rejected as incompatible, unhealthy, `artifact_missing`, and stale. QA
  owns only this canonical receipt and replay evidence under
  `qa-artifacts/screenshots/2026-08-17/hito-runner-core-baseline-and-risk-derived-regression-gate/replay/`.
- **Fresh runtime admission:** before browser evidence, QA will use one serialized managed
  `qa:server:restart -- --provider-mode qa_fixture`, then require loopback binding, compatible and
  healthy status, a current successful production build/output-integrity receipt, and
  `receipt_matches` freshness. No stale or ad hoc runtime is accepted.
- **Named disposable lifecycle:** only existing `qa-baseline`, `qa-isolation-a`,
  `qa-isolation-b`, and `qa-saved-plan` roles are admitted through the canonical test-user,
  runner-core file-flow, and design-profile reset/seed/status commands. No direct SQL shaping, new
  identity, retained FIT/user evidence, hosted data, provider call, or personal session is
  permitted. Every task-owned row and raw storage object will be reset and read back at the end.
- **Browser path:** use a supported non-prompting local controller at exact `1470x801` and
  `375x812` in Light and Dark. Stable visible roles/names must prove authentication, standalone
  source admission, Calendar/workout mutations, imported/FIT and JSON flows, scheduled-only
  completion denial from FIT actuals, History/Progress, native Enter/Escape/focus, containment,
  console health, privacy, and reload durability. A platform permission dialog ends only that tool
  path and triggers a safe local pivot.
- **Continuation and terminal policy:** aggregate every reproducible failure and continue all safe
  independent branches. Stop only the affected family for authentication/privacy, fixture
  integrity, durable readback/cleanup, or a hard browser-control boundary. Close only after the
  complete inventory plus reset -> zero -> seed -> status -> reseed -> repeated status -> final
  reset converges without accumulation or provider dispatch.

## Final QA Execution And Browser Path Preflight — 2026-08-17

- **Validation layer:** final independent Tracked local Runner Core baseline replay after the
  completed current-date file-flow and scheduled-completion-copy repairs. This is not hosted,
  release, deployment, production, physical-device, or broader Global QA acceptance.
- **Role and procedures:** `agents/qa.agent.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the scoped fixture, local Supabase, and durable
  readback procedure from `skills/hito-backend-supabase-contract/SKILL.md`. No subagent is used: the
  complete replay requires one serialized runtime, browser, and disposable-fixture owner.
- **Repair discriminators:** the two completed implementation receipts are inputs, not acceptance.
  QA will independently require the current-date imported workout to land on Thursday
  `2026-08-20` without plan authority and the persisted scheduled-only result to render
  `Saved to this workout.` while remaining excluded from FIT-only History and Progress.
- **Checkout and ownership boundary:** `main` equals `origin/main` at
  `abd4fe8355e3c644095111a654c1560aa265d104`; the Git index is empty and `git diff --check` passes.
  The intentionally shared candidate currently contains 115 modified, two deleted, and 92
  untracked paths. QA will preserve every existing byte and may update only this canonical item.
  Process inspection found no active build writer or second runtime owner.
- **Runtime admission:** managed PID `98769` is compatible, healthy, loopback-bound, and
  `qa_fixture`, but its build is rejected as `stale/artifact_missing` against the current private
  Admin snapshot digest. QA will perform one serialized
  `qa:server:restart -- --provider-mode qa_fixture` and admit browser evidence only from a managed,
  compatible, healthy, loopback-only, `fresh/receipt_matches` artifact with a successful production
  build and output-integrity gate.
- **Named disposable lifecycle:** use only the existing `qa-baseline`, `qa-isolation-a`,
  `qa-isolation-b`, `qa-saved-plan`, and canonical design-profile roles through their normal
  reset/seed/status/readback paths. The retained FIT acceptance identity, personal sessions, hosted
  state, providers, direct database shaping, fixture-source changes, and new identities remain
  excluded. Every task-owned row and raw storage object must return to zero.
- **Browser path:** first use the supported non-prompting in-app browser at exact `1470x801` and
  `375x812` in Light and Dark. Native Enter and Escape plus post-confirmation FIT removal readback
  are explicit admission discriminators. If that control surface cannot emit the required native
  action, pivot to another supported non-prompting local surface; a platform permission dialog ends
  only that path and is never relayed to Ivan.
- **Continuation and terminal policy:** aggregate every reproducible Product, Backend, or Design
  System defect and continue safe independent branches. Stop only the affected family for
  authentication/privacy, fixture integrity, durable readback/cleanup, or a hard control boundary.
  Finish with reset -> zero -> seed -> status -> reseed -> repeated status -> final reset, storage
  cleanup, identity isolation, and zero provider dispatch, then record one English terminal receipt.

## Original QA Execution Prompt

```text
ROLE: QA

Task: Execute the current Runner Core baseline and risk-derived regression gate.

Canonical item: docs/tasks/backlog/2026-08-17-hito-runner-core-baseline-and-risk-derived-regression-gate.md
Stage: QA current-catalog baseline execution
Mode: Tracked local Runner Core acceptance
Epic: runner-core-readiness

Read AGENTS.md, agents/qa.agent.md, and skills/hito-qa-browser-regression/SKILL.md. Read
skills/hito-backend-supabase-contract/SKILL.md only for the scoped local fixture, local Supabase,
or durable readback procedure. Treat the old 2026-08-15 catalog and 2026-08-16 QA ledger as
historical evidence, not as the current lifecycle owner.

Outcome: establish one current, factual local Runner Core baseline. Execute every independent
admitted branch even when an earlier branch fails; stop only the affected branch for fixture
integrity, privacy/authentication, durable-cleanup, or a hard control boundary. Record every
independent defect, exact replay, first incorrect owner, and coverage consequence in this canonical
item. Do not implement any Product, Backend, or Design System repair.

Required inventory: source review/materialisation for manual, AI, and imported sources; standalone
manual create/edit/cancel/save/reload/repeat; empty, stored-Rest, and occupied Replace/Undo moves
across reload; Copy, Clear, and reviewed Delete; Rest/skipped/completed/evidence protection; Past
Plans immutable history and explicit reuse/conflict review; future Calendar JSON export and JSON
source import; durable local FIT upload/readback/removal and resulting action protection; factual
Progress FIT observations versus scheduled-only completion; desktop/mobile Light/Dark accessibility,
keyboard/focus, containment, console, privacy, and final reset/reseed/cleanup convergence.

Use only the existing qa_fixture, deterministic fixture commands, disposable local identities,
existing upload bridge, existing export/import actions, production ingestion path, and stable
user-facing locators. Rebuild/admit a fresh managed loopback artifact before browser evidence;
never use stale or ad hoc runtime proof. No hosted access, provider dispatch, personal sessions,
production source/schema/fixture edits, new test framework, new fixture contract, Git lifecycle,
or real iPad/Safari/native desktop-drag claim.

Definition of Done: one English tracked QA receipt in the canonical item with Check | Scenario /
environment | Result | Evidence inventory, all defects and gaps aggregated, deterministic cleanup evidence,
an explicit Passed/Failed verdict, and a single next Product route. If every admitted branch passes,
mark the baseline accepted for local Runner Core only; do not claim hosted, release, deployment,
or Global QA outside this task.
```

## Tracked QA Replay Receipt — 2026-08-17

### Task, stage, and validation layer

- **Task:** full Runner Core baseline replay after the completed current-date file-flow fixture
  repair.
- **Stage:** independent local QA baseline replay.
- **Validation layer:** bounded local Runner Core acceptance only. This is not hosted, deployment,
  production, release, physical-device, or broader Global QA acceptance.
- **Role and procedures:** `agents/qa.agent.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the scoped local fixture/readback procedure from
  `skills/hito-backend-supabase-contract/SKILL.md`.
- **Subagents:** none. One serialized managed runtime and fixture owner was required.

### Browser and runtime preflight

The stale managed PID `72574` was rejected. With no active build/runtime writer, QA admitted one
fresh managed artifact through `qa:server:restart -- --provider-mode qa_fixture`. PID `90432` is
managed, compatible, healthy, loopback-bound at `http://127.0.0.1:3000`, uses `qa_fixture`, passed
the production build plus post-build output-integrity gate, and remained `artifactFreshness:fresh`
with `freshnessReason:receipt_matches` through the completed browser and fixture replay. Writing
this final untracked canonical receipt then changed the private Admin repository snapshot digest;
the final status is still managed, compatible, healthy, and loopback-bound but correctly reports
`stale/artifact_missing`. No runtime source byte changed after the admitted build. The Git index
remained empty and the intentional dirty candidate was preserved read-only.

Browser replay used the non-prompting in-app browser with disposable local identities at exact
`1470x801` and `375x812` in Light and Dark. The Chrome extension path was attempted only as a safe
alternate native-key discriminator and did not admit a controllable tab. No hosted state, provider,
personal session, retained FIT review identity, direct SQL shaping, or source mutation was used.

### Executed inventory

| Check                                     | Scenario / environment                                                   | Result                                         | Evidence                                                                                                                                                                                                                                                                                                                                                                                        |
| ----------------------------------------- | ------------------------------------------------------------------------ | ---------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh runtime and build                   | Managed loopback `qa_fixture`; production build and post-build integrity | Passed for executed artifact                   | PID `90432`; compatible, healthy, loopback-only, fresh `receipt_matches` before and through browser replay. The final receipt write later made status `stale/artifact_missing`; no stale artifact supplied browser evidence.                                                                                                                                                                    |
| Backend and Product contracts             | Current checkout and local Supabase                                      | Passed                                         | `validate:backend:local-db` passed 21/21; `validate-product-contracts`, `validate-manual-workout-authoring`, and `validate-test-user-lifecycle` passed.                                                                                                                                                                                                                                         |
| Current-date imported fixture             | `runner-core-file-flow-seed --as-of-date 2026-08-17`                     | Passed                                         | Exactly one eligible `file_import` workout was placed on Thursday `2026-08-20`; archived source provenance, independent Calendar authority, and the weekday-Rest invariant all held.                                                                                                                                                                                                            |
| Imported edit and immutable source        | Authenticated desktop Light, `qa-isolation-a`                            | Passed                                         | Calendar/detail agreed on Aug 20. Edit Cancel discarded a temporary cue; reviewed Save persisted `QA reviewed imported cue` after reload while three-block source structure/provenance remained intact.                                                                                                                                                                                         |
| FIT upload and readback                   | Existing local upload bridge and `sample-fit-from-zip.fit` only          | Passed                                         | Browser attach persisted Garmin FIT, 5.42 km, 40 min, three steps, observed facts, and Plan vs Run after reload. Evidence then disabled Edit. Screenshot `02-fit-readback-desktop-light.png`.                                                                                                                                                                                                   |
| FIT removal durable contract              | Canonical production ingestion/removal proof                             | Passed with browser receipt gap                | `runner-core-file-flow-proof --as-of-date 2026-08-17` proved `rawFileAvailableBeforeRemoval:true`, `rawFileAvailableAfterRemoval:false`, preserved actual metrics/comparison, stable reseed, isolation, and zero cleanup. The browser confirm/receipt was not retained; see coverage gaps.                                                                                                      |
| Manual admission and standalone authority | `qa-baseline`, desktop Light                                             | Passed                                         | Manual admission opened Calendar without creating a plan container. The durable cleanup discriminator showed `planCycles:0` for the created Calendar workout and result.                                                                                                                                                                                                                        |
| Manual create/repeat/validation           | Desktop Light                                                            | Passed                                         | `QA Core Repeat` exercised unsupported-child and missing-recovery validation, then reviewed an `x3` repeat with explicit work/recovery, expanded to eight blocks/24 min, and persisted after reload. Screenshot `03-manual-repeat-review-desktop-light.png`.                                                                                                                                    |
| Manual edit/cancel/save/reload            | Manual detail                                                            | Passed                                         | Cancel discarded a temporary cue; reviewed Save persisted `QA reviewed manual cue` after reload without changing the eight-block structure.                                                                                                                                                                                                                                                     |
| Copy/Paste and stored Rest                | Future Calendar                                                          | Passed                                         | Copy exposed Paste only on the truly empty Aug 21 target. The explicitly stored Aug 20 Rest remained a Rest link and exposed no Paste path.                                                                                                                                                                                                                                                     |
| Clear and reviewed Delete                 | Future Calendar                                                          | Passed                                         | Clear Cancel and Delete Cancel were durable no-ops after reload. Positive Clear removed only the reviewed row; positive future Delete removed eligible rows and preserved protected-history copy.                                                                                                                                                                                               |
| Empty-target Move/Undo                    | Aug 18 -> Aug 19; reload -> Undo -> reload                               | Passed                                         | The moved workout persisted on Aug 19; the time-bounded Undo survived reload, restored Aug 18, and was consumed exactly once.                                                                                                                                                                                                                                                                   |
| Stored-Rest Move/Undo                     | Aug 18 -> stored Rest Aug 20; reload -> Undo -> reload                   | Passed                                         | Move replaced the Rest row; Undo restored both the source workout and the exact stored Rest after reload.                                                                                                                                                                                                                                                                                       |
| Occupied Replace/Undo                     | Aug 18 -> occupied Aug 21                                                | Passed                                         | Review Cancel was a durable no-op. Positive Replace persisted after reload; Undo restored both the source and displaced occupied workout and was consumed exactly once.                                                                                                                                                                                                                         |
| JSON export/import                        | Ordinary local Calendar action `Check Calendar JSON flow`                | Passed                                         | Product reported two future workouts exported and saved to Plans while Calendar remained unchanged.                                                                                                                                                                                                                                                                                             |
| Past Plans/source reuse                   | Export-created immutable source with three Calendar conflicts            | Passed                                         | Plans stated immutable/non-authoritative truth. Decline preserved all rows; positive replacement reported three eligible rows replaced, kept the library record unchanged, and created independently editable Calendar workouts.                                                                                                                                                                |
| Scheduled-only completion facts           | Manual result without FIT; reload, History, Progress                     | **Failed presentation / passed durable truth** | Save/reload produced a completed manual result; History stayed empty and Progress showed `No FIT-recorded runs`. However, the completion footer rendered `Saved to your plan.` with `planCycles:0`. Screenshot `04-scheduled-only-completion-desktop-light.png`; see RC-02.                                                                                                                     |
| Calendar completion/protection states     | Canonical 55-workout fixture                                             | Passed                                         | Calendar showed past skipped, 11 FIT-completed matched workouts, and future planned workouts. Completed FIT detail said `Completed from activity file`; Edit was disabled while Activity file remained available.                                                                                                                                                                               |
| Activity History                          | Canonical 30-activity fixture                                            | Passed                                         | Initial 20 plus Load more 10 rendered 30 activity buttons: 19 explicit `Unplanned run` rows and 11 matched rows named by workout. Source actions exposed available, removal-pending retry, and removed states truthfully. Screenshot `08-history-desktop-dark.png`.                                                                                                                             |
| Factual Progress                          | Desktop Dark and mobile Light                                            | Passed                                         | Product showed one current-week FIT point and future days as future, plus `15 runs · 12 h 43 min · 124.3 km`, 540 m, Gate 4 load 500 AU, and unavailable detailed metrics. Runtime status returned Gate 5 `normalized_stream_not_persisted`. Screenshots `09-progress-desktop-dark.png` and `12-progress-mobile-light.png`.                                                                     |
| Privacy and authentication                | Browser and runtime status                                               | Passed                                         | Signed-out Product rendered the login boundary; runtime status returned unauthenticated `401`; `rawPrivateFieldsExposed:false`; no raw storage key/bucket/path appeared in Product FIT dialogs.                                                                                                                                                                                                 |
| Desktop/mobile Light/Dark                 | `1470x801` and exact `375x812`                                           | Passed                                         | Manual Calendar/repeat/FIT in desktop Light, canonical Calendar/History/Progress in desktop Dark, manual Calendar/Plans in mobile Dark, and canonical Calendar/FIT/Progress in mobile Light all had `scrollWidth === innerWidth`. Plans used local table scrolling (`343px` viewport / `860px` table) without page overflow.                                                                    |
| Keyboard, Escape, and focus               | Authenticated detail/menus/dialogs                                       | **Coverage gap**                               | Textbox Enter and pointer/focus paths worked. The available browser's native-link/menu key injection did not activate either wrapped `Back to Calendar` or the plain sidebar `Calendar` link, so no Product-specific owner can be assigned. See coverage gaps.                                                                                                                                  |
| Browser console                           | Fresh recovered authenticated tab after cross-surface replay             | Passed                                         | Zero browser errors and zero warnings.                                                                                                                                                                                                                                                                                                                                                          |
| Fixture convergence and cleanup           | Design profile plus all task-owned disposable roles                      | Passed                                         | Reset -> zero -> seed -> status -> reseed -> status -> repeated status -> final reset remained 1 immutable source / 0 active authority / 55 workouts / 30 activities / 11 matched / 19 unplanned / 11 FIT-completed without accumulation. Final baseline, isolation-a/b, and saved-plan owned rows were zero; `cleanupCandidates:0`, `manualReview:0`, `leases:[]`, retained storage objects 0. |
| Provider and loopback isolation           | Latest 500 local runtime events                                          | Passed                                         | 0 provider dispatch events and 0 provider response IDs; two upload and two removal events remained local. Final runtime stayed loopback-only `qa_fixture`.                                                                                                                                                                                                                                      |

Saved browser evidence:
[replay screenshots](../../../qa-artifacts/screenshots/2026-08-17/hito-runner-core-baseline-and-risk-derived-regression-gate/replay/).

### Defect ledger

#### RC-02 — scheduled-only completion falsely claims plan authority

- **Severity:** High for this source-of-truth acceptance gate; persisted data remains correct.
- **Fixture precondition:** clean authenticated `qa-baseline` runner, manual standalone Calendar
  workout, `planCycles:0`, and no FIT evidence.
- **Replay:** create and save a manual workout -> open `Add result` -> choose `Complete` -> save ->
  reload the completed result page.
- **Expected:** completion copy describes a saved Calendar/workout result without a current, active,
  manual, or other runner-facing plan container.
- **Actual:** the footer renders `Saved to your plan.`. Durable readback remains a scheduled-only
  completion: History has no activity and Progress reports no FIT-recorded run.
- **First incorrect owner:** FRONTEND Product, `src/components/CompletionPanel.tsx`, persisted
  non-FIT footer copy at the `snapshot.source === "persisted"` branch. Backend persistence,
  Calendar authority, and Progress exclusion are correct and must not change.
- **Evidence:** `04-scheduled-only-completion-desktop-light.png`; final cleanup receipt shows the
  manual flow had `planCycles:0`, one Calendar workout, and one workout log before reset.
- **Continuation:** all independent mutation, fixture, Progress, responsive, privacy, provider, and
  cleanup branches continued and completed.

### Coverage gaps and consequences

- **Native keyboard activation:** two fresh in-app replays, including direct key injection and
  navigation expectation, did not activate either `Back to Calendar` or the plain sidebar
  `Calendar` link; pointer navigation succeeded. The second Chrome control surface did not admit a
  controllable tab, and the optional agent-browser CLI was not installed. Because the same behavior
  affects a plain semantic link, this is classified as a control-path gap rather than a proven
  Product defect. Native Enter plus menu Escape/focus return remains unaccepted and independently
  keeps this full gate from passing.
- **Browser-confirmed FIT removal receipt:** browser attach and reload readback passed, but accepting
  the JavaScript confirmation reset the browser-control session before a durable UI receipt could
  be observed. The canonical production proof independently passed raw-file removal, preserved
  metrics/comparison, and zero cleanup. The browser confirmation/receipt branch remains unaccepted.
- **Physical devices and drag:** real iPad/Safari and native desktop drag were explicitly deferred
  by scope and were not claimed.
- **Final managed-artifact reuse:** the canonical receipt itself changed the private Admin snapshot
  digest after the last fresh status. Final PID `90432` remains managed, compatible, healthy, and
  loopback-only, but is `stale/artifact_missing` and must be rebuilt before any later browser
  evidence. The executed Product bytes were admitted and remained fresh for this replay.
- **External boundaries:** hosted Supabase, providers, deployment, production, release, and broader
  Global QA were not run or claimed.

### Next Product route

PRODUCT should route RC-02 to the existing FRONTEND Product owner for a focused factual-copy repair
in `CompletionPanel`, preserving the correct scheduled-only result and FIT exclusion. After its
focused owner proof, return this same item to QA for RC-02 plus the native-keyboard and browser FIT
removal discriminators. No Backend, Design System, schema, fixture, provider, or hosted repair is
demonstrated by this replay.

**Verdict: Failed**

The repaired current-date file-flow fixture and all other executed local Runner Core branches
passed, and deterministic cleanup converged. The baseline remains unaccepted because one visible
Product authority statement is false and two required browser-only discriminators remain
unobserved. This verdict does not claim hosted, release, deployment, production, or broader Global
QA readiness.

## Historical Tracked QA Receipt — Initial 2026-08-17 Run

This receipt is preserved as historical evidence. Its RC-01 current-date fixture failure is
superseded by the completed Backend repair and the current replay receipt above.

### Task, stage, and validation layer

- **Task:** execute the current Runner Core baseline and risk-derived regression gate.
- **Stage:** QA current-catalog baseline execution.
- **Validation layer:** focused local Runner Core acceptance only. Hosted parity, deployment,
  production, release, whole-product Global QA, real iPad/Safari, and native desktop drag remain
  outside this result.
- **Role and procedure:** `agents/qa.agent.md` with
  `skills/hito-qa-browser-regression/SKILL.md` and the scoped local fixture/readback procedure from
  `skills/hito-backend-supabase-contract/SKILL.md`.
- **Subagents:** none. The assigned task did not require delegated evidence.

### Browser and runtime preflight

The previously recorded PID `66258` was rejected as unhealthy, incompatible, and missing its
current artifact. QA restored the repository-owned local Supabase lifecycle, terminated only that
exact orphaned managed process, and admitted one fresh managed artifact through
`qa:server:restart -- --provider-mode qa_fixture`. The admitted artifact used managed PID `72574`,
`http://127.0.0.1:3000`, loopback binding, `qa_fixture`, a successful production build and output
integrity gate, healthy status, and `receipt_matches` freshness before browser evidence began.

The browser path was the non-prompting in-app browser at exact `1470x801` and `375x812`. It used
only local disposable identities, user-facing roles/names, ordinary authenticated Product routes,
the existing local upload bridge, and the existing Calendar JSON bridge. Console logs were read
from the browser tab after the executed flows and contained zero errors and zero warnings.

### Executed inventory

| Check                                         | Scenario / environment                                                                          | Result                                     | Evidence                                                                                                                                                                                                                                                                                                                                         |
| --------------------------------------------- | ----------------------------------------------------------------------------------------------- | ------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Managed runtime and build                     | Fresh managed loopback `qa_fixture`; production build plus post-build output integrity          | Passed                                     | PID `72574` was compatible, healthy, loopback-only, freshly rebuilt, and `receipt_matches` before browser replay.                                                                                                                                                                                                                                |
| Backend and Product contracts                 | Local Supabase plus current checkout                                                            | Passed                                     | `validate:backend:local-db` passed 21/21; Product contracts, manual-workout authoring, and test-user lifecycle validators passed. The standalone Calendar-context command remained sandbox-network-limited, but the same persisted contract passed inside the 21/21 suite.                                                                       |
| Authentication, privacy, provider isolation   | Unauthenticated browser/API boundary; authenticated local identities; 500 latest runtime events | Passed                                     | Login boundary rendered before authentication; runtime status returned unauthenticated `401`, `rawPrivateFieldsExposed:false`, and Gate 5 `normalized_stream_not_persisted`. Runtime events contained 0 provider dispatches and 0 provider response IDs.                                                                                         |
| Manual source and standalone workout          | `qa-baseline`, desktop Light                                                                    | Passed                                     | Manual admission created no plan container. `QA Core Repeat` required warm-up/cooldown, reviewed a simple `x3` repeat, expanded to 8 blocks/24 min, persisted after reload, cancelled a draft edit without mutation, then saved and reloaded the edited title.                                                                                   |
| Move and durable Undo                         | Empty, stored-Rest, and occupied target; reload before and after Undo                           | Passed                                     | Empty Move exposed `Undo 29` and `Undo 20` after reload; stored-Rest and occupied Replace exposed `Undo 45/44`. Each Undo restored source plus displaced Rest/occupied workout after another reload. Occupied Cancel was a durable no-op.                                                                                                        |
| Copy, Clear, Delete                           | Future standalone Calendar rows                                                                 | Passed                                     | Copy/Paste appeared only on a truly empty date; stored Rest exposed no Paste. Clear Cancel preserved both rows and confirmed Clear removed only the reviewed row. Future Delete showed factual protected-history copy; Cancel was no-op and confirm removed all eligible future rows after reload.                                               |
| AI-authored source                            | Canonical design profile, authenticated Product                                                 | Passed                                     | Calendar/detail exposed AI-authored provenance. Eligible future Tempo edit preserved structure/provenance, Cancel discarded a temporary note, and Save persisted the reviewed note after reload. No runner-facing active/current plan authority appeared.                                                                                        |
| Current-date imported source fixture          | `runner-core-file-flow-seed --as-of-date 2026-08-17`                                            | **Failed**                                 | Seed aborted: `Easy aerobic run is scheduled on Wednesday, which is blocked.` See RC-01 below.                                                                                                                                                                                                                                                   |
| Imported source fallback replay               | Canonically admitted `2026-08-16` seed, future `2026-08-18` workout                             | Passed with current-date limitation        | Product rendered `originKind=file_import` as an independent Calendar workout with editable content. Reviewed edit persisted while source facts and three-block structure remained intact. This does not clear RC-01.                                                                                                                             |
| Rest, skipped, completed, evidence protection | Manual Rest plus canonical fixture Calendar/detail                                              | Passed                                     | Stored Rest persisted and excluded Paste. Calendar showed skipped and completed states. Completed FIT detail disabled Edit; evidence-backed Calendar actions retained Copy while Move/Clear were absent.                                                                                                                                         |
| Past Plans and source reuse                   | Export-created immutable saved source plus existing Calendar conflicts                          | Passed                                     | Plans stated that records are immutable and do not control Calendar. Declining `Replace future workouts?` preserved three rows. Positive reuse preserved the saved library record and independent Calendar presentation.                                                                                                                         |
| Calendar JSON export/import                   | Local fixture-only ordinary Product bridge                                                      | Passed                                     | `Check Calendar JSON flow` reported that two future workouts were exported and saved to Plans while Calendar was unchanged. The saved source remained available for explicit reuse/conflict review.                                                                                                                                              |
| Durable FIT lifecycle                         | `qa-isolation-a`; existing `sample-fit-from-zip.fit` bridge and production ingestion            | Passed                                     | Attach completed through the ordinary upload route; reload showed Garmin FIT, 5.42 km, 40 min, 3 structured steps, observed facts, and Plan vs Run. Raw-file removal removed the file only; reload preserved actual metrics/comparison and completion. Self-cleaning proof repeated upload/removal and returned isolation-a/isolation-b to zero. |
| History and factual Progress                  | Canonical 55-workout/30-activity design profile                                                 | Passed with one negative-discriminator gap | Product pagination rendered all 30 activities: 19 `Unplanned run` and 11 matched-by-difference. Progress rendered every supplied FIT observation for the selected period, future dates as future rather than missing, partial evidence, records/load, and unavailable detailed metrics without inference.                                        |
| Desktop/mobile themes and containment         | `1470x801` and exact `375x812`, Light and Dark                                                  | Passed                                     | Calendar, manual review, deletion review, canonical Calendar, Progress, and FIT detail remained usable with `scrollWidth === innerWidth` at both tested widths. Native menu Enter/Escape closed correctly and focus returned to the trigger.                                                                                                     |
| Browser console                               | Executed authenticated Calendar, workout, Plans, History, Progress, and FIT flows               | Passed                                     | Browser tab developer log: 0 errors, 0 warnings.                                                                                                                                                                                                                                                                                                 |
| Cleanup and convergence                       | All task-owned disposable identities                                                            | Passed                                     | Baseline, isolation-a, isolation-b, and saved-plan rows ended at zero; provider identity remained zero; `cleanupCandidates:0`, `manualReview:0`, and `leases:[]`. Design profile completed reset -> zero -> seed -> status -> reseed -> status -> repeated status -> final reset with stable 55/30/11/19 counts and no accumulation.             |

Saved browser evidence:
[2026-08-17 Runner Core baseline screenshots](../../../qa-artifacts/screenshots/2026-08-17/hito-runner-core-baseline-and-risk-derived-regression-gate/).

### Defect ledger

#### RC-01 — current-date file-flow fixture violates its own weekday-Rest invariant

- **Severity:** High; blocks the current deterministic imported/FIT baseline admission.
- **Fixture precondition:** clean `isolation-a`, local Supabase, loopback `qa_fixture`, as-of date
  `2026-08-17`.
- **Replay:** `npm run test-user -- runner-core-file-flow-seed --as-of-date 2026-08-17`.
- **Expected:** one future independently owned imported Calendar workout, stable seed/readback, and
  no active/materialised plan authority.
- **Actual:** the seed aborts in `validateWorkoutsAgainstWeekdayRestInvariant` because `Easy aerobic
run is scheduled on Wednesday, which is blocked`; the failure path cleans the disposable user.
- **First incorrect owner:** BACKEND fixture alignment in
  `scripts/lib/runner-design-profile-fixture.ts` / `seedRunnerCoreFileFlowFixture`. The weekday-Rest
  invariant in `src/lib/weekday-rest-invariants.ts` is correctly rejecting the incompatible date and
  is not the repair target.
- **Continuation:** the already admitted `2026-08-16` seed produced a still-future Tuesday workout,
  allowing independent imported-edit and FIT lifecycle browser proof. That fallback does not prove
  current-date convergence.

### Coverage gaps and consequences

- A scheduled-only manual completion without FIT was not separately created in the browser. The
  current Product showed one factual FIT point while numerous scheduled workouts were excluded, and
  the activity/read-model contracts passed, but the exact scheduled-only-completed negative
  discriminator remains unobserved. Therefore that narrow Progress denial branch is not eligible
  for a standalone browser-pass claim.
- Native Enter on the `Back to Calendar` link was unreliable in the in-app controller. Pointer
  navigation passed, and native Enter/Escape plus focus return passed on the Calendar actions menu;
  the specific link-key activation remains a controller evidence gap, not a demonstrated Product
  defect.
- Real iPad/Safari and native desktop drag were explicitly deferred by scope and were not claimed.
- After browser execution, the managed status became `stale/broken` only because five documentation
  or evidence paths changed the private Admin repository snapshot after the 13:06 UTC build. A
  timestamp audit found no runtime source file newer than the admitted build, so this does not
  invalidate the executed Runner Product bytes; it does mean final managed artifact freshness is
  no longer green and no stale artifact may be reused for later browser evidence.
- `validate-hito-ds-components` still reports an unrelated documentation invariant for the
  production-shipped `/hitoDS` role. It is outside this Runner Core contract and was not treated as
  a Runner defect.
- Hosted Supabase, providers, deployment, production, release, and broader Global QA were not run.

### Next route

PRODUCT should route only RC-01 to BACKEND for the smallest current-date fixture-alignment repair,
then return this same canonical item to QA for the failed seed discriminator plus the two explicit
browser gaps. No Product, Frontend, Design System, or weekday-invariant repair is demonstrated.

**Verdict: Failed**

The local Runner Core baseline is not accepted because the current-date imported fixture lifecycle
does not converge. The completed passing branches and deterministic cleanup remain valid focused
local evidence; they do not imply hosted, release, deployment, production, or broader Global QA
readiness.

## Historical Product Return Prompt

```text
ROLE: PRODUCT

The current local Runner Core baseline gate completed with Verdict: Failed. Route one demonstrated
defect only: BACKEND must align `seedRunnerCoreFileFlowFixture` so
`runner-core-file-flow-seed --as-of-date 2026-08-17` produces one compatible future imported workout
without violating the canonical weekday-Rest invariant, while preserving the existing archived
source, independent Calendar workout, upload bridge, isolation, and cleanup contracts. Do not route
a weekday-invariant relaxation or a Product workaround. After the Backend discriminator and its
focused lifecycle proof pass, return this same item to QA for the failed current-date seed replay
and the two recorded browser evidence gaps. All other passing branches and cleanup evidence remain
focused local evidence only.
```

## Final Tracked QA Baseline Receipt — 2026-08-17

### Task, stage, and validation layer

- **Task:** final full Runner Core baseline replay after the completed current-date file-flow and
  scheduled-completion authority-copy repairs.
- **Stage:** independent local QA baseline acceptance.
- **Validation layer:** bounded local Runner Core acceptance only. This is not hosted, deployment,
  production, release, physical-device, or broader Global QA acceptance.
- **Role and procedures:** `agents/qa.agent.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and the scoped local fixture/readback procedure from
  `skills/hito-backend-supabase-contract/SKILL.md`.
- **Subagents:** none. One serialized managed runtime, browser, and disposable-fixture owner was
  required.

### Browser and runtime preflight

QA rejected managed PID `98769` as `stale/artifact_missing`, confirmed that no competing build or
runtime owner was active, and admitted one fresh artifact through
`qa:server:restart -- --provider-mode qa_fixture`. PID `4193` completed the production build and
post-build output-integrity gate, then remained managed, compatible, healthy, loopback-bound at
`http://127.0.0.1:3000`, `providerMode:qa_fixture`, and `fresh/receipt_matches` through the final
pre-receipt status check.

The browser path used the non-prompting in-app browser with named disposable identities. Current
evidence covered exact `1470x801` and `375x812` in Light and Dark. Chrome control was attempted only
as an alternate native-key discriminator and did not admit a controllable tab. No hosted state,
provider, personal session, retained FIT review identity, direct database shaping, source write, or
stale artifact supplied acceptance evidence.

### Executed inventory

| Check                                               | Scenario / environment                                   | Result                                | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| --------------------------------------------------- | -------------------------------------------------------- | ------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Checkout and runtime freeze                         | `main`, empty index, managed loopback `qa_fixture`       | Passed                                | `HEAD` and `origin/main` both remained `abd4fe8355e3c644095111a654c1560aa265d104`; the shared dirty candidate was preserved. PID `4193` was fresh, healthy, compatible, loopback-only, and built with output integrity before browser proof.                                                                                                                                                                                                                             |
| Backend and Product contracts                       | Current checkout and local Supabase                      | Passed                                | `validate:backend:local-db` passed 21/21. `validate-product-contracts`, `validate-manual-workout-authoring`, and `validate-test-user-lifecycle` passed. The Backend suite retained zero active/materialised plan authority and passed standalone Calendar, mutation, activity, privacy, and fixture contracts.                                                                                                                                                           |
| Current-date imported fixture                       | `runner-core-file-flow-seed --as-of-date 2026-08-17`     | Passed                                | The fixture placed exactly one eligible future `file_import` workout on Thursday `2026-08-20`, retained archived immutable source provenance, and admitted independent edit/move/copy without active plan authority or weekday-Rest violation.                                                                                                                                                                                                                           |
| Imported edit and immutable source                  | `qa-isolation-a`, authenticated desktop                  | Passed                                | Calendar and detail agreed on Aug 20. Cancel discarded a temporary cue; reviewed Save persisted `QA reviewed imported cue` after reload while the three-block structure and source provenance remained intact.                                                                                                                                                                                                                                                           |
| FIT upload, evidence protection, and readback       | Existing local bridge and `sample-fit-from-zip.fit` only | Passed                                | Browser attach showed Garmin FIT, 5.42 km, 40 min, three structured intervals, observed facts, and Plan vs Run. Reload retained factual comparison and disabled source-incompatible editing. No private raw bucket, key, or path was exposed.                                                                                                                                                                                                                            |
| Browser FIT raw-file removal                        | Native Product confirmation, immediate UI, and reload    | Passed                                | The confirmation was accepted without resetting the browser session. The filename disappeared, `Attach local FIT sample` returned, and Product reported `Activity file removed. Your manual workout log is unchanged.` After reload the raw file remained absent while 5.42 km, 40 min, observed facts, Plan vs Run, and file-backed completion remained. Durable fixture cleanup returned asset/metric/comparison rows to zero.                                         |
| Manual admission and standalone authority           | Clean `qa-baseline`, desktop                             | Passed                                | `Build myself` stated that the runner creates independent workouts and opened Calendar without materialising a plan. The clean scheduled-only discriminator later read back `planCycles:0`.                                                                                                                                                                                                                                                                              |
| Manual create/repeat/validation                     | Desktop                                                  | Passed                                | `QA Core Repeat` began with disabled review, rejected an incomplete interval repeat, then reviewed and persisted a simple `x3` repeat with warm-up, work/recovery, cooldown, 54 minutes, and explicit non-invented guidance.                                                                                                                                                                                                                                             |
| Manual edit/cancel/save/reload                      | Workout detail                                           | Passed                                | Cancel discarded `TEMP QA DISCARDED`; reviewed Save persisted `QA reviewed repeat cue` after reload while the repeat structure stayed unchanged.                                                                                                                                                                                                                                                                                                                         |
| AI-authored source review/edit                      | Canonical design profile, authenticated desktop          | Passed                                | Future Aug 18 Tempo rendered AI-authored provenance and factual pace. Cancel discarded a temporary cue; reviewed Save persisted `QA reviewed AI cue` after reload while AI provenance, structure, and `4:45-4:55/km` remained intact.                                                                                                                                                                                                                                    |
| Copy/Paste and stored Rest                          | Future Calendar                                          | Passed                                | Copy exposed Paste on truly empty Aug 21 and the pasted workout persisted after reload. The explicit stored Aug 20 Rest remained a Rest link and exposed no Paste or add-menu path.                                                                                                                                                                                                                                                                                      |
| Empty-target Move/Undo                              | Aug 19 -> Aug 18; reload -> Undo -> reload               | Passed                                | Move persisted on Aug 18. After reload Product exposed `Undo move for QA Core Repeat. 30 seconds remaining.` Undo restored Aug 19, returned Aug 18 to empty, and was consumed exactly once.                                                                                                                                                                                                                                                                              |
| Stored-Rest Move/Undo                               | Aug 19 -> stored Rest Aug 20; reload -> Undo -> reload   | Passed                                | Move replaced the stored Rest. The reload-stable Undo restored both the source workout and the exact stored Rest, then disappeared.                                                                                                                                                                                                                                                                                                                                      |
| Occupied Replace/Undo                               | Aug 19 -> occupied Aug 21                                | Passed                                | Replacement review Cancel was a durable no-op. Positive Replace removed the source and retained one target workout after reload; Undo restored both source and displaced target and was consumed exactly once.                                                                                                                                                                                                                                                           |
| Clear and reviewed Delete                           | Individual row and all eligible future rows              | Passed                                | Clear Cancel preserved the copied row and positive Clear removed only it after reload. Future Delete Cancel preserved workout plus stored Rest; positive confirmation removed both eligible rows and exposed empty dates.                                                                                                                                                                                                                                                |
| Calendar JSON export/import                         | Ordinary `Check Calendar JSON flow` action               | Passed                                | Product reported that the future Calendar workout was exported and saved to Plans while Calendar remained unchanged. The saved record reported one factual workout and remained privately downloadable.                                                                                                                                                                                                                                                                  |
| Past Plans/source reuse                             | Export-created immutable record with Calendar conflicts  | Passed                                | Plans stated immutable/non-authoritative truth. Starting the record required `Replace future workouts?`; decline preserved the existing workout and Rest, while positive replacement refreshed Calendar and retained the same saved library record without active authority.                                                                                                                                                                                             |
| Scheduled-only completion truth                     | Clean browser-created manual workout without FIT         | Passed                                | Save/reload rendered `Saved to this workout.` and never `Saved to your plan.` The Product showed scheduled completion, not file-backed completion. Pre-cleanup durable readback was exactly `planCycles:0`, one Calendar workout, one workout log, zero assets, zero actual metrics, and zero comparisons.                                                                                                                                                               |
| History and factual Progress negative discriminator | Clean scheduled-only identity                            | Passed                                | Activity History rendered `No recorded activities`; Progress rendered `No FIT-recorded runs` / `No activity evidence`. The scheduled workout title was absent from both FIT-only surfaces.                                                                                                                                                                                                                                                                               |
| Canonical Calendar/detail/History/Progress          | 55 workouts and 30 activities                            | Passed                                | Calendar showed past skipped, 11 matched FIT-completed workouts, and future planned workouts; detail agreed. History pagination rendered 30 activities: 11 matched and 19 explicit `Unplanned run`. Progress showed all supplied factual observations, partial evidence, 500 AU Gate 4, and unavailable detailed metrics without inference.                                                                                                                              |
| Authentication and privacy                          | Signed-out boundary plus runtime status                  | Passed                                | Sign-out returned the real local login form. Runtime status returned unauthenticated `401`, `rawPrivateFieldsExposed:false`, and Gate 5 `normalized_stream_not_persisted`. Only disposable authenticated fixture sessions were used.                                                                                                                                                                                                                                     |
| Desktop/mobile themes and containment               | Exact `1470x801` and `375x812`, Light and Dark           | Passed                                | Calendar, workout/FIT detail, repeat authoring, Plans, confirmation, History, and Progress remained usable with page `scrollWidth === innerWidth`. At 375 px the Plans table used local horizontal scrolling without page overflow. The corrected scheduled-completion footer also fit at exact `375x812` Dark with `scrollWidth:375`.                                                                                                                                   |
| Native Escape and focus                             | Profile and Calendar menus                               | Passed                                | Native Escape closed the open menu and returned focus to its semantic trigger with `aria-expanded=false`; dialogs and cancel paths retained usable focus.                                                                                                                                                                                                                                                                                                                |
| Native Enter link activation                        | `Back to Calendar` on authenticated detail               | Environment gap, exhaustively bounded | Three in-app routes—locator `press("Enter")`, CUA `ENTER`, and DOM-CUA `ENTER`—left the focused real `<a href="/">` unchanged. Chrome `tabs.new()` and `openTabs()` each timed out without a controllable tab; the optional `agent-browser` CLI is not installed. Pointer navigation passed. No browser artifact reproduces a Product defect, so this is an inaccessible control-path gap rather than a failed Product check.                                            |
| Browser console                                     | All executed authenticated flows                         | Passed                                | Final in-app browser developer log query returned 0 errors and 0 warnings.                                                                                                                                                                                                                                                                                                                                                                                               |
| Fixture convergence and cleanup                     | Design profile and all task-owned disposable roles       | Passed                                | Reset -> zero -> seed -> runtime status -> reseed -> status -> repeated status -> final reset held 0 materialised / 0 active authority, 1 immutable source, 55 workouts, 30 activities, 11 matched, 19 unplanned, and 11 FIT-completed without accumulation. A final AI edit replay was reset again to all zero. Baseline and isolation-a/b ended at zero; inventory returned `cleanupCandidates:0`, `manualReview:0`, and `leases:[]`; retained storage objects were 0. |
| Provider and loopback isolation                     | Latest 500 local runtime events                          | Passed                                | 0 provider dispatch events and 0 provider response IDs. The observed upload/removal events stayed local; runtime remained loopback-only `qa_fixture`.                                                                                                                                                                                                                                                                                                                    |

### Defects

None reproduced in the current candidate. Historical RC-01 and RC-02 are superseded by the current
passing fixture-date and `Saved to this workout.` discriminators; their older failed receipts remain
retained as history rather than current truth.

### Coverage gaps and consequences

- **Native Enter control:** link activation is not accepted as executed browser proof because every
  available non-prompting native-control alternative was exhausted without a controllable
  navigation. Pointer navigation and the semantic link are healthy, and no Product-specific defect
  is demonstrated. A later environment with functioning native-key link injection may close this
  observation without reopening the accepted Product branches.
- **Physical devices and drag:** real iPad/Safari and native desktop drag were explicitly deferred by
  scope. Emulated responsive containment passed, but this receipt makes no physical-device or native
  drag claim.
- **Saved evidence:** the current run is retained in this canonical command/DOM receipt. No new
  screenshot file was written because QA was authorized to update only this canonical item; older
  screenshot directories remain historical evidence and were not substituted for current proof.
- **Post-receipt freeze recheck:** `HEAD` still equalled `origin/main`, the index remained empty,
  `git diff --check` passed, and the original candidate inventory remained 115 modified, two
  deleted, and 92 untracked paths. Writing and formatting this canonical receipt then changed the
  private Admin repository snapshot digest, so PID `4193` remained managed, compatible, healthy,
  loopback-only, and `qa_fixture` but correctly reported `stale/artifact_missing`. No browser proof
  was taken after that transition, and a later browser owner must rebuild rather than reuse it.
- **External boundaries:** hosted Supabase, providers, deployment, production, release, and broader
  Global QA were not run or claimed.

### Next Product route

PRODUCT may record this bounded local Runner Core baseline as accepted and use its risk-derived
inventory for future feature and epic routing. Any hosted, release, deployment, production,
physical-device, or whole-product acceptance remains a separate canonical gate.

**Verdict: Passed**

The current local Runner Core baseline is accepted. All admitted Product, persistence, privacy,
provider-isolation, responsive, and cleanup branches passed; the one native-Enter observation is an
explicitly exhausted environment gap rather than a reproducible Product failure.

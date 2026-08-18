# Hito Runner Core Full Local QA Audit And Defect Ledger

## Work Item ID

2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger

## Status

closed

## Type

Tracked — QA local acceptance audit

## Priority

high

## Owner

PRODUCT

## Epic

runner-core-readiness

## Stage

Historical local audit evidence reconciled into the superseding Runner Core baseline gate

## Next Recommended Role

None — subsequent baseline execution is owned by the superseding PRODUCT item

## Parent

[Runner Core Roadmap](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Runner Calendar Standalone Runtime Completion And Legacy Cleanup](./2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup.md)

[Runner Calendar Standalone Frontend Consumer Adoption](./2026-08-16-hito-runner-calendar-standalone-frontend-consumer-adoption.md)

## Evidence From

[Workout Core Flow QA Scenario Catalog](./2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md)

## Scope

One safe local, authenticated Runner Core acceptance audit: Calendar, workout detail, source
review/materialisation surfaces that are currently exposed, Past Plans reuse/navigation if exposed,
export/import paths if exposed, and workout evidence attachment where a safe non-prompting control
path exists. This item is the **one current defect ledger** for the audit; do not create one backlog
file per discovered issue during execution.

## Archive Intent

Retain through Product triage and the resulting fix batch, then compact to the executed catalog,
defect ledger, evidence directory, and final local acceptance verdict.

## Task

Audit the current runner product completely enough to identify every independently reproducible,
safe local defect before the next repair batch. Execute all safe scenarios even after a failure.
Stop only the affected branch when fixture integrity, authentication/privacy, durable cleanup, or a
hard capability boundary prevents safe continuation; continue all independent branches. Record every
failure, missing capability, and coverage gap in this one canonical item so PRODUCT can route a
single, evidence-led repair batch.

## Product Rule

Plan/source artifacts can propose initial workout placement only. Confirmed manual, AI-authored, and
imported workouts are independently runner-owned Calendar entities. Current Calendar state,
permissions, mutations, Undo, visibility, and copy must not depend on a global active/current plan
container. Past Plans may be immutable history and a source for a new explicit review, but do not
control current workouts.

## Audit Inventory

Run every admissible scenario and mark each **Passed**, **Failed**, **Blocked by fixture/control**,
or **Not exposed in current Product** with the exact reason.

1. Authentication boundary and authenticated Calendar readback; persisted shell/Today has no
   current-plan authority.
2. Calendar dates, Rest, empty-day Add/Paste, manual creation, simple repeat group, validation,
   Cancel, Save, reload, and durable readback.
3. Eligible manual, AI, and imported workout detail edits: review, confirm, cancel, stale review if
   reachable, rich document/repeat/target preservation, and origin-neutral provenance. Protected
   Rest, logged, skipped, FIT/evidence-backed branches retain their denials.
4. Copy, Clear/review/delete/cancel, and Move across empty, occupied, and stored-Rest targets;
   reload, Undo, second reload, exact-once outcome, and no cross-runner session leakage.
5. Current exposed source/Past Plans behaviour: navigation, history, explicit reuse/reactivation
   review, and date conflict handling. A source must not take authority over existing workouts.
6. Current export/import behaviour: if exposed, export selected future Calendar workouts in truthful
   chronological/week grouping and verify a supported imported JSON/template path end-to-end. If an
   intended capability is not exposed, record it as a Product capability gap with source evidence,
   not an invented implementation defect.
7. FIT result attachment/readback/removal using the existing safe local sample only if a
   non-prompting browser control path is available. If unavailable, record the exact control gap;
   do not fabricate a file or bypass the browser chooser.
8. Desktop `1470×801` and exact mobile `375×812`, Light/Dark: navigation, Enter/Escape/focus
   return, visible feedback, overflow/containment, and console health across the executed flows.

Real iPad/Safari and native desktop drag remain explicitly deferred to their separate device/control
audit. Do not use hosted data, providers, retained FIT evidence, or production accounts.

## Defect Ledger

| ID / severity                         | Classification and environment                                                                                  | Exact replay, durable state, and expected versus actual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  | Evidence / first incorrect owner                                                                                                                                                                                                                                                                       | Continuation                                                                                                                    |
| ------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| AUD-01 / Repaired historical finding  | Current retry pass; manual admission at `1470x801` Light and workout detail at `375x812` Dark                   | The former false footer/action/guard strings were absent. **Build myself** now says workouts are created independently, states that Calendar opens without adding workouts, and uses **Open Calendar**. Reload reached standalone Runner Calendar without active/current authority.                                                                                                                                                                                                                                                                                                                                                                                                                                      | Browser DOM/readback and `retry-01-onboarding-desktop-light.jpg`. The completed legacy-copy repair is accepted for its exact former discriminator.                                                                                                                                                     | Independent copy review continued and found AUD-06 in adjacent shared setup/Settings copy.                                      |
| AUD-02 / Repaired historical finding  | Current retry pass; occupied manual target at `1470x801` Light                                                  | Cancelled Replace was a durable no-op. Positive Replace moved source A, displaced target B, and exposed server-backed Undo whose countdown decreased from 45 to 33 seconds after reload. Undo plus two reloads restored A on `2026-08-17` and B on `2026-08-18` once each, with no remaining Undo.                                                                                                                                                                                                                                                                                                                                                                                                                       | Browser DOM/readback and `retry-03-occupied-replace-undo-desktop-light.jpg`. Current Backend mutation and Frontend adoption agree.                                                                                                                                                                     | Empty-target and stored-Rest Move/Undo also passed and the audit continued.                                                     |
| AUD-03 / High coverage consequence    | Fixture/control blocker, not a Product defect; exact-template workout `2026-05-05`; disposable `qa-isolation-a` | The exact dated workout exists and is protected/skipped. **Add activity file** opens, but managed `qa_fixture` explicitly says any chosen file is a deterministic preview and “nothing is uploaded or saved.” The in-app controller exposes no non-prompting file assignment method; hidden-input automation and safe DOM alternatives were exhausted, while opening a platform chooser is prohibited. Durable FIT upload -> reload/readback -> removal therefore remains unproved.                                                                                                                                                                                                                                      | `retry-09-fit-qa-fixture-capability-gap.jpg`; zero asset/result rows before and after cleanup. First boundary: **local fixture/browser-control capability**, not Product upload source.                                                                                                                | All non-FIT branches continued; no retained FIT identity, hosted state, or raw evidence was touched.                            |
| AUD-04 / Medium coverage consequence  | Fixture blocker; imported provenance                                                                            | The accepted template materializes only `2026-05-05`, `05-06`, `05-08`, and `05-10`, all past and protected at the current as-of date. Protected imported edit denial passed, while positive manual and AI edit/review/save/reload plus stale-review rejection passed. No ordinary lifecycle can expose an eligible future imported workout without manual data shaping.                                                                                                                                                                                                                                                                                                                                                 | CLI template receipt plus ordinary Calendar/detail readback. First boundary: **local fixture capability / future imported discriminator unavailable**.                                                                                                                                                 | All other edit/protection branches continued.                                                                                   |
| AUD-05 / Explicitly deferred          | Physical-device/control coverage gap                                                                            | Real iPad/Safari and native desktop drag were intentionally excluded. Exact `375x812` responsive/no-hover UI and keyboard/pointer Move fallback passed, but do not prove native device events.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           | Canonical scope boundary. First owner: separate device/control QA.                                                                                                                                                                                                                                     | No effect on the executed local responsive inventory; prevents a physical-device claim.                                         |
| AUD-06 / Repaired current finding     | Focused independent pass; shared onboarding/shell/Settings copy at `1470x801` Light and `375x812` Dark          | Complete runner facts, select **Build myself**, inspect the shared setup frame and Settings, then open Calendar. The former strings were absent. Setup now says **Choose how to start training**, **before training setup**, and **Training setup**; manual admission says workouts are created independently and opens Calendar without adding workouts; Settings says it updates the runner profile, **not existing Calendar workouts**. Desktop and mobile reached the standalone Calendar with no active/current/manual plan authority.                                                                                                                                                                              | `aud06-replay-01` through `aud06-replay-06` plus `aud06-replay-dom-and-readback.json`. Ordinary local readback showed `1` runner profile and `0 plan_cycles / 0 planned_workouts` for each admitted identity before cleanup. The completed Frontend owner repair is independently accepted for AUD-06. | AUD-06 is closed by this focused retry. AUD-03, AUD-04, AUD-05, and AUD-07 remain their existing capability/fixture boundaries. |
| AUD-07 / Medium coverage consequence  | Browser-control gap; exposed Calendar export/import                                                             | The authenticated **Download future workouts JSON** control was activated and the loopback request completed, but the in-app surface did not expose the downloaded body or filesystem artifact. Direct navigation was client-blocked, `downloadMedia` yielded no retrievable file, and no new local download appeared. **Upload plan JSON** exposes a hidden input, but the controller has no file-assignment API and its sandbox strips `File`/`DataTransfer`; opening the OS chooser is prohibited. Current chronological/week-grouped export content and current upload readback therefore were not independently captured in this retry. Saved-plan source Start/replacement/reuse was tested separately and passed. | Browser control attempts, `CalendarOverflowActions.tsx` orientation, and loopback request log. First boundary: **supported in-app download/file-input control unavailable**; no Product defect is assigned without a failing Product payload.                                                          | Past Plans and all independent Calendar mutations continued.                                                                    |
| AUD-08 / Resolved environment finding | Current focused replay; serialized managed-artifact admission                                                   | The prior stopped/missing shared artifact was not reused. With every source/build/runtime writer idle, QA completed one managed rebuild and admitted PID `90212` as compatible, healthy, loopback-bound, `providerMode: qa_fixture`, fresh, and `receipt_matches`. The same state remained current after browser evidence and cleanup.                                                                                                                                                                                                                                                                                                                                                                                   | `npm run qa:server:restart -- --provider-mode qa_fixture` and final `npm run qa:server:status`. This resolves the former environment admission gap for the AUD-06 replay only; it does not rewrite the historical failed receipt.                                                                      | Browser evidence was admitted from the fresh artifact; no stale, ad hoc, hosted, or provider-backed runtime was used.           |

## Historical Initial Findings

| ID / severity                        | Classification and environment                                                                                                                                                | Exact replay, durable state, and expected versus actual                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             | Evidence / first incorrect owner                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          | Continuation                                                                                                                              |
| ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| AUD-01 / Medium                      | Product defect; `/` at `1470x801` Light and `/workout/2026-05-05` at `375x812` Dark; `qa-baseline@local.test` and independently `qa-isolation-a@local.test`; manual admission | Complete runner basics, select **Build myself**, then read the final admission copy and activate its primary action. Also open a workout route after the disposable profile reset. Expected: the manual path opens the independently runner-owned Calendar without describing a plan, and the setup guard refers to runner/Calendar setup. Actual: admission says the baseline will be used “for this plan”, labels the action and onboarding shell **Create plan**, and the reset guard says **Create your plan first**. Reload reaches Runner Calendar and does not create active/current-plan authority, so the persisted Calendar result is correct but the presented contract is false.                        | [`OnboardingGate.tsx`](../../../src/components/OnboardingGate.tsx) owns the false footer/action copy; [`AppShell.tsx`](../../../src/components/AppShell.tsx) owns the false onboarding mode label; [`workout.$date.tsx`](../../../src/routes/workout.$date.tsx) owns the false setup guard. [Mobile Dark evidence](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/18-final-zero-mobile-dark.png). First incorrect owner: **FRONTEND — Product**.                                                                       | All Calendar and independent fixture branches continued.                                                                                  |
| AUD-02 / High                        | Product/data-loss defect; Calendar, `1470x801` Light; `qa-baseline@local.test`; manual source and occupied manual target                                                      | Create workout A on `2026-08-17`, create workout B on `2026-08-18`, choose Move on A, select the occupied target, cancel once to prove no-op, then repeat and confirm **Replace workout**. Expected: the reviewed destructive replacement has a durable exact-once Undo that restores A and B, consistent with the required occupied-target Move/Undo contract. Actual after reload: A is on the target, B is gone, the source date is empty, and no Undo is exposed; B cannot be recovered through the accepted lifecycle.                                                                                                                                                                                         | [`manual-calendar-actions.ts`](../../../src/components/calendar/manual-calendar-actions.ts) creates an undo candidate only for `rest_day`; the authoritative RPC in [`20260816004652_standalone_calendar_write_foundation.sql`](../../../supabase/migrations/20260816004652_standalone_calendar_write_foundation.sql) matches displaced state only when `workout_type = 'rest'`. First incorrect owner: **BACKEND**, server mutation/audit and displaced-workout restoration contract. Frontend omission is downstream of the missing authoritative undo. | Independent Clear/Delete, source reuse, export/import, AI, protection, privacy, viewport, and lifecycle checks continued after reseeding. |
| AUD-03 / High coverage consequence   | Fixture/control blocker, not a Product defect; workout detail `2026-05-05`, `375x812` Dark; `qa-isolation-a@local.test`; exact local template plus `sample-fit-from-zip.fit`  | Reset the disposable identity with the accepted template, verify the compatible dated workout and zero result/asset rows, open **Add activity file**, and choose only the approved sample through the non-prompting browser chooser. Expected for acceptance coverage: durable upload, reload/readback, and safe removal. Actual in managed `qa_fixture`: the UI explicitly produces a deterministic local preview, says nothing was uploaded or saved, and reload returns the workout to unlogged with zero result/asset rows. The preview was cleared and the identity reset to zero. The browser surface also did not provide a safe dismiss path for the native confirm, so removal-cancel remained unobserved. | [`CompletionPanel.tsx`](../../../src/components/CompletionPanel.tsx) intentionally short-circuits the local design fixture before `/api/workout-result/upload`. First boundary: **QA/runtime fixture capability owned by the local Frontend fixture path**; real Product upload is untested, not failed.                                                                                                                                                                                                                                                  | All non-FIT branches continued; no retained FIT identity, hosted data, provider, or raw evidence was touched.                             |
| AUD-04 / Medium coverage consequence | Fixture coverage gap; workout detail; disposable exact-template and design-profile fixtures; imported provenance                                                              | The admitted exact-template imported workouts are all past/skipped and correctly protected, while the design profile provides eligible future AI and manual workouts but no eligible future imported workout. Expected coverage: positive review/confirm/reload for an eligible imported workout. Actual: no safe supported fixture can reach that branch without manually shaping data or inventing an import. Positive manual and AI edits, stale-review rejection, protected imported denial, and origin-neutral exported-source reuse all passed, but they do not replace this exact proof.                                                                                                                     | Fixture inventories and ordinary Product readback. First boundary: **local fixture capability / exact imported-future discriminator unavailable**; no Product owner is assigned without a failing eligible case.                                                                                                                                                                                                                                                                                                                                          | All other edit and source-reuse branches continued.                                                                                       |
| AUD-05 / Explicitly deferred         | Environment coverage gap; physical-device and native-drag surfaces                                                                                                            | Real iPad/Safari and native desktop drag were excluded by the canonical item. Expected only in their separate device/control audit. Current emulated `375x812` no-hover-responsive behavior and pointer/keyboard Move fallback passed, but cannot prove native device event behavior.                                                                                                                                                                                                                                                                                                                                                                                                                               | Canonical scope boundary. First owner: **separate device/control QA**, not Product source.                                                                                                                                                                                                                                                                                                                                                                                                                                                                | No effect on the executed local desktop/mobile browser inventory; prevents any physical-device claim.                                     |

Do not fix source, amend historical receipts, create follow-up backlog items, or convert a fixture
gap into a product bug. PRODUCT owns the next triage and may split owner repair work from this one
ledger.

## Validation Expectations

Before browser work, admit a fresh, healthy, loopback-only managed `qa_fixture`; do not use a stale
or ad hoc runtime. Use disposable, named local identities and prove reset/cleanup after every
mutating family and at final convergence. Preserve unrelated data and source bytes. Capture browser
evidence under `qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/`.

At completion, run the whole inventory that remains safe after failures, verify final fixture
cleanup, console/overflow checks, Markdown formatting/links, and `git diff --check`. A passing
verdict is allowed only when every required exposed scenario passes; otherwise return the failed
result with the complete consolidated ledger and clear next owners. This is local focused QA, not
Global QA, hosted, release, deployment, or production readiness.

## QA Execution And Browser Path Preflight — 2026-08-16

- **Mode / validation layer:** Tracked focused local runner-core audit and consolidated defect
  inventory. This is not Global QA, hosted, release, deployment, production, real-iPad/Safari, or
  native-desktop-drag acceptance.
- **Accepted inputs:** the Backend standalone runtime/legacy-cleanup and Frontend Product consumer
  adoption items are completed owner-level inputs only. QA will independently replay the current
  assembled local Product and will not inherit either implementation verdict.
- **Checkout boundary:** the Git index is empty. The current tracked/untracked Backend, Frontend,
  Design System, documentation, migration, and proof changes belong to their existing owners and
  remain byte-for-byte read-only. QA owns only this canonical lifecycle/receipt and task evidence
  under `qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/`.
- **Runtime admission discriminator:** the prior managed record names dead PID `44958` and is
  incompatible, unhealthy, `providerMode: real`, and `stale/broken` with `artifact_missing`. The
  build-output lock is absent, no fixture lease is active, and no second admitted runtime owner is
  present. QA owns one serialized `qa:server:restart -- --provider-mode qa_fixture`, then must stop
  browser admission unless status is managed, compatible, healthy, loopback-bound, fresh, and
  receipt-matching.
- **Named disposable lifecycle:** `qa-baseline@local.test` has only its saved runner profile and zero
  task-owned rows; `qa-isolation-a@local.test`, `qa-isolation-b@local.test`, and
  `qa-saved-plan@local.test` are fully zero. Use only existing pool ensure/reset, Product UI,
  inventory, exact-template/design-profile lifecycle, and full cleanup paths. Direct SQL shaping,
  fixture-source edits, and new fixture identities are not admitted.
- **Privacy/provider boundary:** the retained `fit-product-acceptance@local.test` registry entry,
  protected Admin, hosted state, raw retained evidence, and every real/paid provider are excluded.
  Only loopback local Supabase and deterministic `qa_fixture` behaviour may be used.
- **Browser path:** use the fresh managed loopback artifact through a supported non-prompting local
  control surface at `1470x801` and exact `375x812`, in Light and Dark. Capture auth, DOM, durable
  reload, keyboard/Enter/Escape/focus return, feedback, overflow, console, and screenshots. Abandon
  any platform-prompting path and pivot locally; do not turn it into a user approval request.
- **Continuation policy:** record every independent defect, missing capability, fixture/control
  blocker, and coverage gap in the single `## Defect Ledger` below and continue all safe branches.
  Stop only an affected mutation family when authentication/privacy, fixture integrity, durable
  readback, or cleanup cannot be established. QA does not fix forward.
- **Final cleanup:** reset every task-owned identity, prove zero owned rows/objects and empty leases,
  then run the admitted seed/status/reseed/repeated-status/reset convergence without accumulation or
  provider dispatch before the terminal verdict.

## Tracked QA Receipt — 2026-08-16

### Task, Layer, And Operating Boundary

- **Task / mode:** Hito Runner Core Full Local QA Audit And Defect Ledger; Tracked.
- **Validation layer:** focused local runner-core acceptance and consolidated defect discovery. This
  is not Global QA, hosted, release, deployment, production, real-iPad/Safari, or native-drag
  acceptance.
- **Role instructions:** `agents/qa.agent.md`.
- **Skills used:** `skills/hito-qa-browser-regression/SKILL.md` and
  `skills/hito-backend-supabase-contract/SKILL.md` for the browser admission and named local fixture
  lifecycle. No subagent was used.
- **Write boundary:** only this canonical receipt/lifecycle and task evidence were written. Product,
  Backend, Design System, fixture source, schema/migrations, configuration, dependencies, hosted
  state, retained evidence, providers, and Git lifecycle were not changed.

### Browser And Runtime Preflight

The previous PID `44958` was dead and its managed record was incompatible, unhealthy,
`providerMode: real`, and `stale/broken` with `artifact_missing`. No build lock, fixture lease,
competing build owner, or second admitted runtime existed. QA performed one serialized managed
restart. The accepted artifact was PID `47984`, `managed`, `compatible`, `healthy`,
`loopbackBind: true`, `providerMode: qa_fixture`, `artifactFreshness: fresh`, and
`receiptState: receipt_matches` at `http://127.0.0.1:3000`. Its restart build completed successfully,
and the same status remained true through the final browser/fixture evidence and cleanup. Local
Supabase remained on loopback `127.0.0.1:54321`; no hosted endpoint was admitted.

The unauthenticated root presented only the sign-in boundary and the authenticated design-profile
status endpoint returned `401` without fixture credentials. All Product mutation/readback evidence
used the ordinary authenticated flows of named disposable local identities.

### Executed Inventory

| Check                                | Scenario / environment                                                                  | Result                     | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------------------------------------ | --------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed artifact admission           | Fresh serialized `qa_fixture` restart on loopback                                       | Passed                     | Admitted execution status: PID `47984`, healthy, compatible, fresh, receipt-matching, loopback-bound; no build lock or active fixture lease. The post-receipt state is recorded separately below.                                                                                                                                                                                                                                           |
| Authentication boundary              | Unauthenticated root and authenticated local fixture identity                           | Passed                     | Root was sign-in-only; runtime design-profile status rejected unauthenticated access with `401`; authenticated Product navigation reached Calendar, detail, Plans, History, Progress, and Settings.                                                                                                                                                                                                                                         |
| Manual Calendar admission            | `qa-baseline@local.test`, desktop Light                                                 | Failed                     | Admission opened the correct standalone Calendar without active/current authority, but AUD-01 records false plan-oriented copy. [Calendar evidence](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/01-desktop-light-standalone-calendar.png).                                                                                                                                                            |
| Manual create and repeat             | `2026-08-17`, desktop Light                                                             | Passed                     | Missing-cooldown review produced factual validation; the accepted workout persisted as 24 minutes, three authored blocks/eight expanded blocks, then survived reload. [Repeat review evidence](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/02-desktop-light-repeat-review-ready.png).                                                                                                                 |
| Rest, edit, cancel, durable readback | Manual workout plus stored Rest `2026-08-19`                                            | Passed                     | Cancelled title change reverted after reload; reviewed valid edit persisted with repeat/target structure; stored Rest persisted and remained distinct from an empty Add day.                                                                                                                                                                                                                                                                |
| Eligible manual and AI edits         | Manual workout and design-profile future AI workout                                     | Passed                     | Manual and AI review/confirm/reload preserved rich blocks, pace targets, and provenance; cancel was a no-op. A concurrent second session made the first review stale, and Save was rejected without overwriting authoritative truth.                                                                                                                                                                                                        |
| Protected workout denial             | Completed FIT-backed, skipped, Rest, and past imported examples                         | Passed                     | Completed `2026-08-11`, skipped `2026-07-27`, Rest, and exact-template past imported workouts exposed no enabled edit mutation. Completed detail agreed with History and persisted activity-file facts.                                                                                                                                                                                                                                     |
| Empty-target Move/Undo               | Manual source `2026-08-17` to empty `2026-08-18`                                        | Passed                     | Move persisted after reload; Undo remained available; Undo restored the source, second reload stayed restored, and no second Undo remained.                                                                                                                                                                                                                                                                                                 |
| Stored-Rest Move/Undo                | Manual source to stored Rest `2026-08-19`                                               | Passed                     | Move persisted, durable Undo restored the exact stored Rest and source, and the second reload proved exact-once completion.                                                                                                                                                                                                                                                                                                                 |
| Occupied Move cancellation           | Manual source to occupied manual target                                                 | Passed                     | Replacement review appeared; Cancel was a durable no-op after reload.                                                                                                                                                                                                                                                                                                                                                                       |
| Occupied Move positive replacement   | Manual source to occupied manual target                                                 | Failed                     | Confirmed replacement removed the displaced workout and exposed no durable Undo after reload. AUD-02 contains the minimized replay and Backend discriminator.                                                                                                                                                                                                                                                                               |
| Copy/Paste eligibility               | Manual source, empty date, and stored Rest date                                         | Passed                     | Copy exposed Paste only on the truly empty date; Paste created a distinct durable Calendar row; stored Rest exposed neither Add nor Paste.                                                                                                                                                                                                                                                                                                  |
| Clear and future Delete              | Single-workout Clear plus Calendar future-delete flow                                   | Passed                     | Both dialogs gave factual scope; Cancel was a durable no-op; positive Clear removed only the reviewed row; positive future Delete removed only eligible future rows and preserved the immutable Past Plan record.                                                                                                                                                                                                                           |
| Past Plans and explicit reuse        | Design profile and exported-source saved plans                                          | Passed                     | Past Plans remained immutable/Available source records. Start conflict review preserved state on decline; positive Start materialized independently editable future Calendar workouts, did not create active/current authority, and preserved protected past/FIT/history truth.                                                                                                                                                             |
| Export                               | Future workout plus Rest                                                                | Passed                     | Browser download contained two chronological days in one week, explicit privacy flags, and no auth/database/provider tokens. [Captured export](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/03-future-calendar-export.json).                                                                                                                                                                           |
| Import and source reuse              | Browser file chooser using only the captured local export                               | Passed                     | Import saved an immutable Plans record and explicitly left Calendar unchanged. Start decline was a no-op; positive replacement created independent Calendar rows. Editing the started workout did not mutate the saved source record.                                                                                                                                                                                                       |
| Imported eligible edit               | Exact-template and design-profile inventories                                           | Blocked by fixture         | AUD-04: all admitted imported workouts were past/protected; no safe future imported fixture existed. Positive manual/AI edit and protected imported denial passed, but the eligible positive imported branch is not proven.                                                                                                                                                                                                                 |
| FIT attachment/readback/removal      | `qa-isolation-a@local.test`, exact `2026-05-05`, `sample-fit-from-zip.fit`, mobile Dark | Blocked by fixture/control | AUD-03: the managed local design fixture intentionally generated an unsaved preview and never called durable upload. Reload returned zero result/asset rows; preview and identity were fully cleaned.                                                                                                                                                                                                                                       |
| History and Progress                 | Canonical design profile, authenticated browser                                         | Passed                     | History loaded 20 then all 30 activities: 11 matched and 19 visibly unplanned. Progress agreed with 15 runs/12h43m/124.3 km/540 m for the current 28-day facts, 500 AU reported load, partial-evidence messaging, and unavailable detailed metrics.                                                                                                                                                                                         |
| Fixture/read-model truth             | Canonical design-profile reset/seed/status                                              | Passed                     | One immutable saved source, zero active/current authority, 55 independent workouts, 30 activities, exactly 11 matched/19 unplanned, and 11 completed FIT projections; runtime-status verification passed. Source states were 2 removed, 1 removal-pending, and 27 available; Gate 4 and Gate 5 `normalized_stream_not_persisted` facts passed.                                                                                              |
| Cross-runner isolation               | Move/Undo created as `qa-baseline`, then authenticated `qa-saved-plan`                  | Passed                     | The second runner saw no Undo and did not change the first runner's design Calendar.                                                                                                                                                                                                                                                                                                                                                        |
| Privacy and provider isolation       | Managed runtime, Product DTO/status, observability event log                            | Passed                     | Raw/private fields were absent, unauthenticated status was rejected, `canRemoveOriginalFile` and removal-pending truth were preserved, and no real provider kind or dispatch appeared.                                                                                                                                                                                                                                                      |
| Desktop/mobile containment           | Exact `1470x801` and `375x812`, Light and Dark                                          | Passed                     | Calendar, Plans, History/Progress, workout detail, and FIT preview all measured `body.scrollWidth` and `documentElement.scrollWidth` equal to `innerWidth` (1470 or 375). [Final mobile Dark/reset evidence](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/18-final-zero-mobile-dark.png).                                                                                                              |
| Keyboard/focus/feedback              | Desktop and mobile Product controls                                                     | Passed                     | Native Enter changed Light/Dark menu choices; Escape closed the Plans action menu and returned focus to its trigger; reviewed validation, pending, success, stale-review, and destructive-confirmation feedback remained visible.                                                                                                                                                                                                           |
| Console health                       | Representative baseline, design-profile, and FIT branches                               | Passed                     | Browser warning/error logs were empty at each sampled checkpoint.                                                                                                                                                                                                                                                                                                                                                                           |
| Final convergence and cleanup        | All named disposable identities plus canonical design profile                           | Passed                     | `qa-baseline` retained only its reusable profile with zero task rows; `qa-isolation-a`, `qa-isolation-b`, provider-engine, and saved-plan pools ended at zero, leases were empty, and protected Admin/retained FIT evidence were untouched. Design profile completed reset to zero, seed `55/30/11/19`, passing status, reseed to the same counts, two passing statuses, and final reset to zero without accumulation or provider dispatch. |

### Issues And Coverage Gaps

- Two Product defects were reproduced: AUD-01 belongs first to **FRONTEND — Product** copy owners;
  AUD-02 belongs first to the **BACKEND** authoritative mutation/undo contract.
- AUD-03 prevents any claim for durable FIT attach/reload/remove or removal-cancel in managed
  `qa_fixture`; it does not establish a defect in the real upload path.
- AUD-04 leaves positive eligible imported-workout editing unproven. Manual and AI positive edits and
  imported protected denial do not close that exact branch.
- AUD-05 preserves the explicit real-iPad/Safari and native desktop-drag gap. Responsive emulation
  and supported local pointer/keyboard paths are not substituted for physical device evidence.
- Hosted state, real providers, retained real-user/FIT evidence, release, deployment, and production
  were intentionally not exercised; none is covered by this result.

### Post-Receipt Hygiene

`git diff --check` passed, the canonical Markdown formatting check passed after mechanical
formatting, and the four saved evidence artifacts were present and checksum-readable. Writing this
tracked lifecycle/receipt changed the private Admin snapshot digest after browser acceptance. The
still-loopback managed PID `47984` therefore truthfully reports `healthy: true` but
`artifactFreshness: stale`, `build: broken`, and `freshnessReason: artifact_missing` against the new
expected digest. No browser or fixture evidence above was taken from that post-receipt state. A
future browser owner must build a fresh managed artifact before reusing the runtime; QA did not
restart it into a receipt-write loop or present stale evidence as current.

### Final Outcome

The current local runner-core candidate is not ready to pass this focused audit. The occupied-target
replacement loses a displaced workout without the required durable Undo, and the admitted manual
entry/setup surfaces still present a plan as current authority. Fixture/control gaps also prevent
the complete imported-edit and durable FIT evidence inventory. All safe independent branches and
final disposable cleanup nevertheless completed.

**Verdict: Failed**

## Product Triage And Replay Admission — 2026-08-16

- **Resolved prior defects:** AUD-01 is completed by
  [Runner Legacy Plan Copy Removal](./2026-08-16-hito-runner-legacy-plan-copy-removal.md).
  AUD-02 is completed by the paired
  [Backend durable Undo](./2026-08-16-hito-runner-occupied-move-replace-durable-undo.md) and
  [Frontend Undo adoption](./2026-08-16-hito-runner-occupied-move-replace-undo-frontend-adoption.md)
  items.
- **Replay purpose:** independently re-run every safe inventory branch against the assembled current
  candidate. The historical failed receipt remains evidence; it is not rewritten into a pass.
- **Open acceptance conditions:** the retry must either prove the repaired AUD-01/AUD-02 outcomes and
  all other previously passing branches again, or record new exact defects. It must also re-evaluate
  the future-imported edit and durable FIT attachment/removal paths as fixture/control capability
  questions. Real iPad/Safari and native desktop drag stay deferred to their separate device audit.
- **Serialization boundary:** FRONTEND currently owns the Language Dropdown implementation and its
  managed-runtime/browser work. QA starts only after that owner is idle and the shared managed
  artifact can be freshly rebuilt/admitted; it must not reuse a stale artifact or overlap runtime
  ownership.

## QA Retry Execution And Browser Path Preflight — 2026-08-16

- **Mode / validation layer:** Tracked, focused local runner-core acceptance retry and consolidated
  defect ledger. This is not Global QA, hosted, release, deployment, production, real-iPad/Safari,
  or native-desktop-drag acceptance.
- **Historical versus current truth:** the earlier failed receipt and AUD-01 through AUD-05 remain
  replay evidence only. The completed legacy-copy, Backend occupied-Undo, and Frontend Undo-adoption
  receipts are entry inputs, not substitutes for this independent current Product replay.
- **Exclusive ownership admission:** the previously named Language Dropdown Product item is now
  `completed`; its Backend prerequisite is `completed`; the shared Design System item is `blocked`
  without an active build/runtime writer. No Vite/build/finalize process or fixture lease is active,
  the Git index is empty, and only the prior managed server process remains. QA now owns one
  serialized managed runtime and disposable-fixture lifecycle for this retry.
- **Current runtime discriminator:** managed PID `78842` is compatible, healthy, loopback-bound, and
  `providerMode: qa_fixture`, but its artifact is `stale/broken` with `artifact_missing` after a
  private Admin digest change. No browser evidence may use it. QA will restart only through
  `qa:server:restart -- --provider-mode qa_fixture` and proceed only if status is managed,
  compatible, healthy, loopback-bound, fresh, and `receipt_matches`.
- **Checkout/write boundary:** the large tracked/untracked candidate is intentionally dirty and
  belongs to its completed or active canonical owners. QA will not edit Product, Backend, Design
  System, source, schema/migrations, fixtures, configuration, dependencies, hosted state, or Git
  lifecycle. QA owns only this canonical retry lifecycle/receipt and new evidence under
  `qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/`.
- **Named disposable state:** `qa-baseline`, `qa-isolation-a`, `qa-isolation-b`, and the provider
  pool are at zero; `qa-saved-plan` currently holds the accepted canonical design profile
  (`55` workouts, `30` activities) and will be reset/reseeded only through its named lifecycle.
  The protected Admin and stale retained FIT registry identity are excluded. Direct database
  shaping, new identities, retained evidence, and real credentials are not admitted.
- **Browser path:** use the supported in-app browser against `http://127.0.0.1:3000`, ordinary local
  disposable sign-in, exact `1470x801` and `375x812`, Light/Dark, native Enter/Escape/focus,
  screenshots, DOM/readback, reload, overflow, console, and file chooser evidence. Abandon any
  platform-prompting path and pivot locally without asking Ivan.
- **Mutation and continuation policy:** after fresh admission, reset/seed only the named identities,
  execute every safe independent branch after a failure, and stop only the affected branch when
  fixture integrity, privacy, durable cleanup, or browser control cannot be established. QA will
  not fix source or convert a fixture/control limitation into a Product defect.
- **Terminal gate:** finish with task-owned cleanup plus canonical
  reset -> zero -> seed -> status -> reseed -> repeated status -> reset convergence, provider/privacy
  checks, Markdown formatting, and diff hygiene. The single Defect Ledger and retry receipt will
  distinguish current failures from repaired historical findings.

## Tracked QA Retry Receipt — 2026-08-16

### Task, stage, and validation layer

- **Task:** Hito Runner Core Full Local QA Audit And Defect Ledger.
- **Stage:** retry after AUD-01/AUD-02 repairs; complete safe local replay and consolidated findings.
- **Validation layer:** focused local Runner Core QA. This is not Global QA, hosted, release,
  deployment, production, real-iPad/Safari, or native-desktop-drag acceptance.
- **Role and procedures:** `agents/qa.agent.md` with
  `skills/hito-qa-browser-regression/SKILL.md` and
  `skills/hito-backend-supabase-contract/SKILL.md` for the local Supabase/auth lifecycle.
- **Subagents:** none. The assignment did not require delegation and the browser/runtime lifecycle
  was intentionally serialized.

### Browser/runtime preflight

- The retry began only after the Git index was confirmed empty, no build/finalize process or
  fixture lease was active, and QA owned one managed runtime lifecycle.
- `npm run qa:server:restart -- --provider-mode qa_fixture` admitted PID `81855` as managed,
  compatible, healthy, loopback-bound, `providerMode: qa_fixture`, `artifactFreshness: fresh`, and
  `freshnessReason: receipt_matches` before browser work.
- The unauthenticated Product boundary rendered the local login form and no Calendar; ordinary
  disposable Product sign-in then reached the authenticated Calendar. Credentials were neither
  printed nor reported.
- Browser evidence used the in-app browser at exact `1470x801` and `375x812`, Light and Dark.
  Platform file dialogs were not opened.

### Executed inventory

| Check                                    | Scenario / environment                                                                                | Result                     | Evidence                                                                                                                                                                                                                                                                                        |
| ---------------------------------------- | ----------------------------------------------------------------------------------------------------- | -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed runtime admission                | Fresh serialized loopback `qa_fixture` before browser execution                                       | Passed                     | PID `81855`; managed/compatible/healthy/loopback/fresh/`receipt_matches`; production build and postbuild integrity completed.                                                                                                                                                                   |
| Authentication boundary                  | Signed out root, then disposable `qa-baseline`, `qa-saved-plan`, and `qa-isolation-a` Product sign-in | Passed                     | Login-only unauthenticated DOM; authenticated Calendar/Progress/detail DOM; local runtime events show login/logout only.                                                                                                                                                                        |
| AUD-01 former discriminator              | Build myself, final admission, workout guard, reload                                                  | Passed                     | Independent-workout copy, “Calendar will open without adding workouts,” **Open Calendar**, no active/current authority; `retry-01`.                                                                                                                                                             |
| Shared standalone copy                   | Same onboarding frame, shell account detail, and Settings                                             | Failed                     | AUD-06: remaining **Choose how to start your plan**, **Plan setup**, and **active plan already on your calendar** copy contradicts standalone Calendar truth.                                                                                                                                   |
| Manual create and repeat                 | `qa-baseline`, Aug 17, Intervals, warm-up + `x3` Work/Recovery + cooldown                             | Passed                     | Reviewed 24 min / 3 authored blocks / 8 expanded blocks; reload preserved title, targets, notes, Manual Build provenance; `retry-02`.                                                                                                                                                           |
| Manual cancel/save/validation            | Unsaved title close/reload; reviewed saved title; incomplete draft normalization                      | Passed                     | Cancel restored the original title; save persisted **QA Retry Repeat Edited** and all eight blocks. Review supplied a factual cooldown rather than persisting an invalid document.                                                                                                              |
| Stored Rest                              | Aug 19 create/review/save/reload                                                                      | Passed                     | Persisted as a Rest link distinct from an empty Add day; no Paste affordance appeared.                                                                                                                                                                                                          |
| Copy/Paste                               | Aug 17 source -> genuinely empty Aug 18; stored-Rest exclusion                                        | Passed                     | Copy toast and Paste-only empty-day menu; reload showed an independent Aug 18 workout; stored Rest remained non-empty and offered no Paste.                                                                                                                                                     |
| AUD-02 occupied Replace/Undo             | A Aug 17, B Aug 18; decline, positive Replace, reload, Undo, two reloads                              | Passed                     | Decline was no-op. Positive Replace exposed decreasing server countdown and Undo restored A/B exactly once; `retry-03`.                                                                                                                                                                         |
| Empty and stored-Rest Move/Undo          | Aug 17 -> Aug 20 empty; Aug 17 -> Aug 19 stored Rest                                                  | Passed                     | Each move survived reload; Undo restored source plus exact empty/Rest target and disappeared after reload.                                                                                                                                                                                      |
| Clear and destructive confirmation       | Single-row Clear cancel/confirm; bulk future delete cancel/confirm                                    | Passed                     | Cancel paths were durable no-ops; confirmed Clear deleted one row only; confirmed bulk delete removed eligible future workouts while completed/skipped history remained.                                                                                                                        |
| Eligible manual/AI edits                 | Manual repeat and design-profile future AI workout                                                    | Passed                     | Review/confirm/reload preserved rich structure/provenance. Genuine stale review was rejected after a concurrent authoritative save and did not overwrite it.                                                                                                                                    |
| Protected-source denial                  | Completed activity-file, skipped, Rest, and exact-template imported past workouts                     | Passed                     | **Edit this training** was disabled in each protected case; completion/history facts remained unchanged.                                                                                                                                                                                        |
| Canonical History                        | `qa-saved-plan`, Load more                                                                            | Passed                     | 20 + 10 = 30 activities; 19 **Unplanned run** rows and 11 matched labels (Tempo 2, Easy 1, Long 3, Recovery 4, Intervals 1); `retry-07`.                                                                                                                                                        |
| Canonical Progress                       | Desktop Dark and mobile Light                                                                         | Passed                     | 15 current-28-day runs, partial running time/distance/elevation, factual record/load, and detailed metrics unavailable; no fake precision.                                                                                                                                                      |
| Past Plans/source reuse                  | Immutable 10K plan; Start conflict decline and positive replacement                                   | Passed                     | Library remained one immutable **Available** record. Decline was no-op; positive receipt stated 7 eligible future rows replaced and 32 non-Rest workouts across 55 days, independently editable with protected history intact.                                                                  |
| Fixture exactness and privacy            | Seed/status/reseed/repeated status against managed runtime                                            | Passed                     | `55` workouts, `30` activities, `11` matched/`19` unplanned, `11` FIT-completed matches, `materializedPlanCount: 0`, `activeAuthorityCount: 0`, unauthenticated API `401`, `rawPrivateFieldsExposed: false`, source lifecycle facts, Gate 4 load, and Gate 5 `normalized_stream_not_persisted`. |
| Calendar JSON export/import              | Exposed controls on authenticated Calendar                                                            | Blocked by control         | AUD-07: download body/file and hidden-input assignment were not retrievable through the non-prompting in-app surface; no OS dialog or manual shaping was used.                                                                                                                                  |
| Eligible future imported edit            | Exact-template plus design-profile fixture inventory                                                  | Blocked by fixture         | AUD-04: every imported example is past/protected; no ordinary future imported discriminator exists.                                                                                                                                                                                             |
| FIT attachment/removal                   | Exact `2026-05-05` compatible workout and approved sample path                                        | Blocked by fixture/control | AUD-03: `qa_fixture` explicitly previews without saving; supported controller cannot assign the file non-interactively; `retry-09`.                                                                                                                                                             |
| Desktop/mobile containment               | Calendar, detail/editor/dialog, History, Progress, Plans at `1470x801` and `375x812`, Light/Dark      | Passed                     | Page widths were exactly `1470/1470/1470` and `375/375/375`. Plans table remained locally scrollable without page overflow; `retry-04` through `retry-08`.                                                                                                                                      |
| Keyboard/focus/feedback                  | Tabs, dialog Escape, Plans menu Escape, destructive reviews                                           | Passed                     | Arrow-key tab selection worked; Escape closed edit/menu surfaces and returned focus to **Open workout actions** / **Open actions for 10K plan**; working/success/conflict/destructive feedback was visible.                                                                                     |
| Console and navigation                   | All retained browser tabs across executed routes                                                      | Passed                     | Final warning/error inventory was `[]` for both open tabs; normal Calendar/Progress/detail navigation remained usable.                                                                                                                                                                          |
| Provider isolation                       | Managed mode plus last 500 local runtime events                                                       | Passed                     | `providerMode: qa_fixture`; zero events with non-null `providerKind`; no provider identity/data rows after cleanup.                                                                                                                                                                             |
| Cleanup/convergence                      | Pool reset; design profile reset -> zero -> seed -> status -> reseed -> status -> status -> reset     | Passed                     | All disposable/pool-owned tables ended at zero, cleanup candidates `0`, leases `[]`, protected Admin untouched, retained stale FIT registry record excluded. Seed/reseed counts remained `55/30/11/19`.                                                                                         |
| Final fresh managed artifact             | Serialized post-evidence managed rebuild                                                              | Failed by shared ownership | AUD-08: two rebuilds stopped at private Admin snapshot postbuild integrity while an in-progress PRODUCT Admin item changed within the build window; final status is stopped/missing.                                                                                                            |
| Cross-runner pending-Undo browser replay | Switch identities while one server Undo is pending                                                    | Not run                    | The final fresh artifact could not be admitted after AUD-08. Identity data/readback stayed isolated, but this specific pending-Undo browser discriminator remains uncovered in the retry.                                                                                                       |

### Current issues and coverage consequences

- **Product defect:** AUD-06, remaining plan-authority copy in shared onboarding, shell, and Settings.
  First owner: **FRONTEND — Product**.
- **Fixture/control gaps:** AUD-03 durable FIT, AUD-04 eligible future imported edit, and AUD-07
  browser-captured export/import. These are not reported as Product failures without an admitted
  failing Product path.
- **Environment/shared-owner gap:** AUD-08 prevented the final fresh post-run artifact and the
  pending-Undo cross-runner browser discriminator. The already executed browser matrix began from
  a fresh admitted artifact; no stale/ad hoc browser proof was substituted after the final failure.
- **Explicit deferral:** AUD-05 real iPad/Safari and native desktop drag remain outside this audit.

### Saved evidence

Evidence directory:
`qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/`

- `retry-01-onboarding-desktop-light.jpg` — SHA-256 `644911a078b7d2cb5a6410fcd2984115f013f08e541040c43de635aef96cdbdd`
- `retry-02-repeat-ready-desktop-light.jpg` — SHA-256 `5d46509830b5200d8a2ededa1b685464ff28eb4e3a009da560c81bece754656b`
- `retry-03-occupied-replace-undo-desktop-light.jpg` — SHA-256 `66a54dd1efbdea2fc2e22b8027f38e2acd9688886fcf195bf2dd5edad698291b`
- `retry-04-calendar-mobile-light.jpg` — SHA-256 `9f369cde0335914e35d041739c879b2db73fcaf0f6207e7cbb08c7be6a8da285`
- `retry-05-workout-edit-mobile-dark.jpg` — SHA-256 `4534d67009ce27321d0ad8d5e1f73122d983f69069338498e0e1e14f179da633`
- `retry-06-design-profile-calendar-desktop-dark.jpg` — SHA-256 `2b67244c9cf014cf74d0e60738b6d93bed99b98f7a8112bf0b7e43a24c342527`
- `retry-07-history-desktop-dark.jpg` — SHA-256 `4a3866a51816d5cfa765ff0797a07c569648a2dbd92d1d62447f8453ab7e2b27`
- `retry-08-plans-mobile-light.jpg` — SHA-256 `aa0747310b046da309ce83eb6b2efbcbc8b55133902422559b19d13e76de63d8`
- `retry-09-fit-qa-fixture-capability-gap.jpg` — SHA-256 `fe93e34761a45c8c157433f9646f2f99509425dd79ee58ff921caf9dbb203f0a`

### Verdict

**Verdict: Failed**

AUD-01 and AUD-02 are independently closed by the current retry, and all executed mutation and
cleanup branches converged. The focused local Runner Core audit still fails because AUD-06 is a
current Product-truth defect and required FIT/import/export plus final managed-artifact evidence
remain incomplete. PRODUCT is the next owner for consolidated triage; QA did not repair source.

## Historical QA Handoff Prompt

```text
ROLE: QA

Task: Hito Runner Core Full Local QA Audit And Defect Ledger
Stage: Retry after AUD-01/AUD-02 repairs — execute every safe branch and consolidate findings
Mode: Tracked
Canonical item:
docs/tasks/backlog/2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md
Parent:
docs/plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md
Depends on:
docs/tasks/backlog/2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup.md
and docs/tasks/backlog/2026-08-16-hito-runner-calendar-standalone-frontend-consumer-adoption.md
Evidence from:
docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md
Epic: runner-core-readiness

The earlier failed audit remains historical evidence. AUD-01 plan-authority copy and AUD-02
occupied Move/Replace Undo are now completed by their canonical Frontend and Backend/Frontend
repair items. Re-run their exact durable outcomes; do not inherit those old failures as current
truth. Re-evaluate FIT and eligible imported-edit coverage as capability questions. Start only once
the currently active FRONTEND Language Dropdown task is idle and a fresh managed artifact can be
admitted; shared runtime ownership must not overlap.

Ivan explicitly authorized immediate execution and requires a full audit, not a first-failure stop.
Read AGENTS.md, agents/qa.agent.md, skills/hito-qa-browser-regression/SKILL.md, the complete
canonical item, the completed Backend and Frontend receipts, and the older QA catalog before any
runtime/fixture mutation. This is a QA-only assignment: do not edit production source, fixtures,
schemas, migrations, providers, hosted state, dependencies, or Git lifecycle.

The accepted product rule is mandatory: a source plan only proposes initial placement. Confirmed
manual, AI, and imported workouts are independently runner-owned Calendar entities. Current
Calendar permissions, mutations, Undo, visibility, and copy must not require a global plan
container; Past Plans are immutable history/source only.

Run every safe branch in the canonical inventory: authenticated Calendar/shell/Today; manual create
with a simple repeat group; manual/AI/imported detail edit where fixture evidence permits;
Rest/logged/skipped/evidence protection; Copy/Clear/Delete/Cancel; empty/occupied/stored-Rest Move
and durable exact-once Undo; exposed Past Plans/source reuse; exposed export/import; safe FIT
attachment/removal if a non-prompting control path exists; and desktop/mobile Light/Dark keyboard,
focus, feedback, overflow, and console health.

Do not stop the audit at the first defect. Stop only that affected branch if fixture integrity,
cleanup, authentication/privacy, or an unavailable browser control blocks safe continuation; keep
testing independent branches. Record every defect, missing capability, fixture/control blocker, and
coverage gap in the single `## Defect Ledger` section of this item with exact reproduction, durable
state, evidence, severity, first incorrect owner/unknown boundary, and continuation result. Do not
create a follow-up task per issue and do not fix anything.

Use only a fresh healthy loopback `qa_fixture`, named disposable local identities, and final reset
convergence. Save evidence under
qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/. Real iPad/Safari and
native desktop drag are explicitly deferred; do not claim them. Complete all safe scenarios, then
return one English tracked QA receipt with the full ledger and Verdict: Passed or Verdict: Failed.
Global QA, hosted, release, deployment, and production readiness remain out of scope.
```

## AUD-06 Focused QA Execution And Browser Path Preflight — 2026-08-16

- **Mode / validation layer:** Tracked, focused local AUD-06 acceptance retry. This replay verifies
  only the repaired standalone Calendar copy contract; it is not Global QA, hosted, release,
  deployment, production, real-iPad/Safari, or native-drag acceptance.
- **Accepted implementation input:** the completed Frontend Product copy item is an owner-level
  entry receipt only. QA will independently observe the current assembled browser artifact at the
  exact former discriminator and will not infer a browser pass from source or static validation.
- **Writer admission:** the Git index is empty; no Vite/build/finalize/runtime process, fixture
  lease, or active source owner is present. The only other recently touched canonical item is
  `ready` under PRODUCT and explicitly awaiting dispatch, not an active writer. The four AUD-06
  source seams and their completed Frontend receipt were stable before this preflight.
- **Current runtime discriminator:** the managed server is stopped and its cached artifact is
  `stale/broken` with `artifact_missing`; it is not admitted as evidence. QA owns one serialized
  `qa:server:restart -- --provider-mode qa_fixture` and will proceed only if status is managed,
  compatible, healthy, loopback-bound, `providerMode: qa_fixture`, fresh, and receipt-matching.
- **Fixture and privacy boundary:** every named disposable pool identity is at zero and leases are
  empty. QA may use only `qa-baseline` and `qa-isolation-b` through ordinary authenticated Product
  flow and the named cleanup lifecycle. Protected Admin, the retained FIT registry identity,
  hosted data, providers, real credentials, direct database shaping, and fixture-source changes are
  excluded.
- **Browser path:** use a supported non-prompting local controller against
  `http://127.0.0.1:3000` at exact `1470x801` Light and `375x812` Dark. Observe revised manual
  admission, AppShell setup detail, Settings copy, keyboard focus/Escape where exposed, standalone
  Calendar navigation, page containment, console health, and durable absence of a plan container.
  Any platform-prompting path will be abandoned rather than escalated.
- **Write boundary and terminal gate:** QA may write only this canonical lifecycle/receipt and new
  evidence in the existing task directory. Product/Backend/Design System source, fixture source,
  schema/migrations, dependencies, hosted state, providers, and Git lifecycle remain read-only.
  Finish by resetting both disposable identities to zero, proving empty leases and no plan/workout
  container rows, checking final managed status, Markdown formatting, and diff hygiene.

## 2026-08-16 Product Re-admission

The completed [Standalone Calendar Copy Completion](./2026-08-16-hito-runner-standalone-calendar-copy-completion.md)
addresses the exact AUD-06 source seams without introducing persistence, state, or Design System
changes. Its focused static evidence is accepted as implementation evidence; the remaining condition
is an independent browser replay of the revised copy on the same standalone Calendar admission
surface.

All historical results remain intact. This retry is deliberately narrow: it must not reclassify
AUD-03, AUD-04, AUD-05, or AUD-07 coverage boundaries as Product defects, and it must not replay
the entire catalog unless its focused check finds a regression. All repository and runtime writers
were idle when PRODUCT re-admitted QA.

## Exact Handoff Prompt

```text
ROLE: QA

Task: Hito Runner Core AUD-06 independent browser replay
Mode: Tracked, focused local acceptance retry
Canonical item:
docs/tasks/backlog/2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md
Parent:
docs/plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md
Stage: Independent AUD-06 browser replay after standalone Calendar copy completion
Epic: runner-core-readiness

Read AGENTS.md, agents/qa.agent.md, skills/hito-qa-browser-regression/SKILL.md, and
skills/hito-backend-supabase-contract/SKILL.md. QA owns acceptance only: do not edit production
source, fixtures source, schemas, migrations, providers, hosted state, dependencies, or Git
lifecycle. The local fixture reset/seed/cleanup lifecycle and disposable local identities are
already authorized; never request Ivan's approval for those safe local actions.

The completed Frontend item
docs/tasks/backlog/2026-08-16-hito-runner-standalone-calendar-copy-completion.md
claims AUD-06 is repaired in OnboardingGate, QuickSetupPlanSetupSections, AppShell, and Settings.
Independently verify the exact observable contract: manual admission and shared setup/Settings copy
describe runner setup and independently owned Calendar workouts, not a current/active/manual plan
container. Preserve truthful source-artifact/Past Plans language where exposed.

Before browser work, confirm every writer is idle and use the established managed-runtime procedure
to admit one fresh, healthy, compatible, loopback-only `qa_fixture` artifact. Do not use stale,
ad hoc, hosted, or provider-backed runtime. If a platform dialog appears, abandon that tool path
and use another supported local browser/control surface rather than asking Ivan.

Execute at minimum the revised manual admission path, AppShell setup detail, and Settings copy at
1470x801 Light and 375x812 Dark. Verify navigation into the standalone Calendar, no plan container
is created by the manual path, keyboard focus/Escape where the flow exposes it, page containment,
and console health. Retain the existing historical AUD-01/AUD-02 evidence; only record a new
defect if this focused replay reproduces a current failure.

Update this one ledger with the focused result, current runtime admission outcome, saved evidence,
and a truthful English tracked QA receipt. Record AUD-06 as passed or failed. Keep AUD-03, AUD-04,
AUD-05, and AUD-07 as their existing capability/fixture boundaries unless this replay establishes a
new first owner. Do not claim Global QA, hosted, release, deployment, or production readiness.
```

## 2026-08-16 Product Routing: File-Flow Evidence Enablement

AUD-06 is passed. Ivan accepted the remaining local capability work as part of Runner Core
readiness, excluding the separately deferred real-iPad/Safari/native-drag boundary. The two
evidence gaps must be enabled without changing the normal runner UI or introducing a second upload,
import, export, persistence, or plan-authority path:

1. [Backend QA Fixture FIT And Future Imported Workout Enablement](./2026-08-16-hito-runner-core-qa-fixture-fit-and-imported-workout-enablement.md)
   is active first. It owns deterministic fixture truth and server-path proof.
2. [Frontend QA Fixture File-Flow Browser Bridge](./2026-08-16-hito-runner-core-qa-fixture-file-flow-browser-bridge.md)
   is prepared and waits for the Backend result plus the current active Admin FRONTEND task.

The final independent QA replay returns here after both owners complete. No user-facing QA-only
control may be present outside local loopback `qa_fixture` mode.

## AUD-06 Focused Tracked QA Receipt — 2026-08-16

### Task, stage, and validation layer

- **Task / mode:** Hito Runner Core AUD-06 Independent Browser Replay; Tracked focused local
  acceptance retry.
- **Stage:** independent replay after the completed standalone Calendar copy correction.
- **Validation layer:** focused AUD-06 browser acceptance only. This is not a rerun of the complete
  Runner Core catalog and does not claim Global QA, hosted parity, release, deployment, production,
  real-iPad/Safari, or native-drag readiness.
- **Role and procedures:** `agents/qa.agent.md`,
  `skills/hito-qa-browser-regression/SKILL.md`, and
  `skills/hito-backend-supabase-contract/SKILL.md`; the in-app browser control procedure was used
  for exact viewport, DOM, focus, console, and screenshot evidence. No subagent was used.
- **Write boundary:** only this canonical QA lifecycle/receipt and evidence under the existing task
  directory were written. Product, Backend, Design System, fixture source, schema/migrations,
  dependencies, hosted state, providers, retained FIT evidence, and Git lifecycle were unchanged.

### Browser and runtime preflight

The Git index was empty, no build/finalize/runtime process or fixture lease was active, and the only
other recently touched canonical item was `ready` under PRODUCT and awaiting dispatch. The four
AUD-06 source seams were stable. The prior stopped `stale/broken` artifact was rejected. One
serialized managed restart built and admitted PID `90212` at `http://127.0.0.1:3000` as managed,
compatible, healthy, loopback-bound, `providerMode: qa_fixture`, `artifactFreshness: fresh`, and
`freshnessReason: receipt_matches`. Final status after browser work and cleanup retained the same
facts. Local Supabase inventory remained loopback-only; runtime events sampled for the replay had
`providerKind: null`.

### Executed inventory

| Check                         | Scenario / environment                                                     | Result | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ----------------------------- | -------------------------------------------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh managed artifact        | Serialized managed restart before browser work                             | Passed | PID `90212`; managed, compatible, healthy, loopback, `qa_fixture`, fresh, and receipt-matching before and after the replay.                                                                                                                                                                                                                                                                                                                                                               |
| Revised shared setup copy     | `qa-baseline`, `1470x801` Light                                            | Passed | Rendered **Choose how to start training**, **before training setup**, and AppShell **Training setup**. The former **start your plan / plan setup** strings were absent. [`aud06-replay-01`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-01-desktop-light-manual-admission.jpg)                                                                                                                                                         |
| Revised manual admission      | `qa-baseline`, `1470x801` Light                                            | Passed | **Build myself** said **Create workouts independently** and **Calendar will open without adding workouts**; **Open Calendar** reached the standalone Calendar. [`aud06-replay-01`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-01-desktop-light-manual-admission.jpg) and [`aud06-replay-02`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-02-desktop-light-standalone-calendar.jpg) |
| Settings copy                 | `qa-baseline`, `1470x801` Light                                            | Passed | Rendered **Settings update your runner profile, not existing Calendar workouts**; the former active-plan claim was absent. [`aud06-replay-03`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-03-desktop-light-settings.jpg)                                                                                                                                                                                                              |
| Mobile revised admission      | `qa-isolation-b`, exact `375x812` Dark                                     | Passed | The same setup/manual strings rendered without retired plan-authority copy. The compact mobile shell intentionally omits the desktop profile-detail label. [`aud06-replay-04`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-04-mobile-dark-manual-admission.jpg)                                                                                                                                                                        |
| Mobile Calendar and Settings  | `qa-isolation-b`, exact `375x812` Dark                                     | Passed | Standalone Calendar and the revised Settings sentence rendered with no active/current/manual-plan authority. [`aud06-replay-05`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-05-mobile-dark-standalone-calendar.jpg) and [`aud06-replay-06`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-06-mobile-dark-settings.jpg)                                                               |
| Durable no-container readback | Ordinary Product admission plus local fixture inventory                    | Passed | Before cleanup each exercised identity had `runner_profiles: 1`, `plan_cycles: 0`, `planned_workouts: 0`, and zero workout/log/result rows. Reloaded Calendar remained standalone. [`DOM/readback receipt`](../../../qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/aud06-replay-dom-and-readback.json)                                                                                                                                                         |
| Keyboard and focus            | Desktop setup tabs and profile menu                                        | Passed | Native ArrowRight selected and focused **Build myself**. Escape closed the profile menu, returned focus to its native button trigger, left `aria-expanded=false`, and hid the menu.                                                                                                                                                                                                                                                                                                       |
| Containment and theme         | All six checkpoints at `1470x801` Light and `375x812` Dark                 | Passed | `documentElement.scrollWidth` and `body.scrollWidth` equalled `innerWidth` (`1470` or `375`) at admission, Calendar, and Settings; requested Light/Dark classes were active.                                                                                                                                                                                                                                                                                                              |
| Console health                | Admission, Calendar, and Settings checkpoints                              | Passed | Browser warning/error inventories were `[]` at desktop and mobile checkpoints.                                                                                                                                                                                                                                                                                                                                                                                                            |
| Provider/privacy boundary     | Managed mode, runtime event sample, protected identities                   | Passed | `providerMode: qa_fixture`; sampled `providerKind` values were null; protected Admin, retained FIT registry identity, hosted data, and providers were not used.                                                                                                                                                                                                                                                                                                                           |
| Cleanup                       | `qa-baseline`, `qa-isolation-b`, and prior-session `qa-saved-plan` profile | Passed | Named pool resets returned every task-owned table to zero; final inventory had cleanup candidates `0`, leases `[]`, and all pool members at zero.                                                                                                                                                                                                                                                                                                                                         |

### Issues and coverage gaps

- **New defects:** none. The exact former AUD-06 Product-truth failure did not reproduce.
- The compact `375x812` shell does not render the desktop AppShell profile-detail label. Mobile
  admission, Calendar, and Settings were observed directly, and the compact shell exposed no
  contradictory plan-authority copy; no hidden desktop-label behaviour is claimed for mobile.
- The browser controller did not produce reliable verdict evidence for Enter/Space activation of
  **Open Calendar**; pointer activation completed the admission. Keyboard proof is limited to the
  required setup-tab ArrowRight path and profile-menu Escape/focus return. This is recorded as a
  control-surface evidence limit, not a Product defect.
- AUD-03, AUD-04, AUD-05, and AUD-07 remain exactly their existing fixture/control/device
  boundaries. AUD-01/AUD-02 historical replay evidence was preserved and not rerun.

### Saved evidence

Evidence directory:
`qa-artifacts/screenshots/2026-08-16/hito-runner-core-full-local-qa-audit/`

- `aud06-replay-01-desktop-light-manual-admission.jpg` — SHA-256
  `419d3adc5e9843e39a657e4a5ba0364cadc30568c09ac1f9d05c9a839be5ee46`
- `aud06-replay-02-desktop-light-standalone-calendar.jpg` — SHA-256
  `e85fd1d8b8d2fc86da069f3fac5087aead92c4eeaf268aac0975b8d2f6ca379d`
- `aud06-replay-03-desktop-light-settings.jpg` — SHA-256
  `f03f787c7531f160871022603e48d54c0be46e0ab268e997c6c52134971742e1`
- `aud06-replay-04-mobile-dark-manual-admission.jpg` — SHA-256
  `ac4def68baa9b82ab6eb1d876b6f98d02df0034d62f879e23a114bb0bccf649c`
- `aud06-replay-05-mobile-dark-standalone-calendar.jpg` — SHA-256
  `75b5ba165bf98e8b11a7f36f1816d6700b1f1a5eb91b89c124d3be1e2af95907`
- `aud06-replay-06-mobile-dark-settings.jpg` — SHA-256
  `f41e93867d4244c4874a10d6b3336e7e6cbe2b4571ff9d011f04028fa489df57`
- `aud06-replay-dom-and-readback.json` — SHA-256
  `6fe2ec519f54531a81ee97ba41a4086a88a5f6704a9314c0a8728cb4137d3d04`

### Post-receipt hygiene

The canonical Markdown formatting check and `git diff --check` passed, and the Git index remained
empty. Writing this focused receipt changed the private Admin repository snapshot digest after all
browser, readback, cleanup, and fresh-status evidence had completed. PID `90212` therefore remains
managed, healthy, loopback-bound, and `providerMode: qa_fixture`, but its post-receipt status is
truthfully `artifactFreshness: stale`, `build: broken`, and `freshnessReason: artifact_missing`
against expected digest `9a7c15b1741129a6f841c2a7e4b4ff676eca027d1e05c9d6e0e673f3fa0eef81`.
No evidence in this receipt was taken from that post-receipt state. A later browser owner must admit
a new fresh artifact; QA did not create a rebuild/receipt loop.

### Focused verdict

**AUD-06 Verdict: Passed**

The completed Frontend copy correction is independently accepted for the bounded AUD-06 contract.
The runner setup, manual admission, shell detail where rendered, Settings, standalone Calendar, and
durable readback now agree that Calendar workouts are independently owned and no current/active/
manual plan container is created. The broader historical audit and its retained capability gaps are
not converted into a Global QA or release pass.

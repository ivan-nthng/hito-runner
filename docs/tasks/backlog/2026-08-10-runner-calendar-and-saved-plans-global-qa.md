# Runner Calendar And Saved Plans Global QA

- **Work Item ID:** `runner-calendar-and-saved-plans-global-qa`
- **Status:** `completed`
- **Type:** `local-global-qa-acceptance`
- **Priority:** `high`
- **Owner:** `qa`
- **Scope:** `local authenticated runner Calendar, timezone, saved Plans, and shared slider acceptance`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Global QA Acceptance passed — bounded local Calendar and saved Plans slice`
- **Next Recommended Role:** `product`

## Task

Run one independent local Global QA Acceptance for the completed runner-facing Calendar and saved
Plans slice. Validate a real authenticated browser flow across the finished contracts; do not
implement fixes or turn local acceptance into a hosted/release claim.

## Accepted Implementation Slices

- [Personal runner timezone calendar truth](./2026-08-09-personal-runner-timezone-calendar-truth.md)
- [Calendar workouts independent from plans and Copy/Paste](./2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md)
- [Saved-plan library and future apply](./2026-08-10-saved-plan-library-and-future-apply.md)
- [Saved-plan Start with schedule alignment](./2026-08-10-saved-plan-start-schedule-alignment.md)
- [Saved Plan Library UI and Start](./2026-08-10-saved-plan-library-ui-and-start.md)
- [Hito DS slider baseline and size contract](./2026-08-10-hito-ds-slider-baseline-size-contract.md)

## Product Contract

- Calendar workouts are runner-owned materialized truth. A saved plan is only an immutable library
  record/provenance; it is never active/current Calendar authority.
- Every successful AI running-plan candidate remains in the user library. A user can browse, search,
  sort, privately download, hide, and Start a selected record.
- Start uses runner-local date and saved schedule preferences. It may omit incompatible leading plan
  days, but never changes source weekly workout count/order or calls OpenAI/providers.
- Future replacement requires an explicit positive choice. Declining leaves Calendar unchanged.
  Past, logged, FIT-backed, completed, skipped, or otherwise protected truth is never replaced.
- Copy is available from a non-Rest workout and Paste only to a genuinely empty future day. A stored
  Rest day is not an empty target and offers no Paste. Calendar workout mutation remains independent
  from plan provenance.
- The selected runner timezone determines calendar-date truth at midnight. The shared slider rail is
  visibly contrasting alpha neutral in both themes; handles remain solid signal and previous-value
  markers restore only through the existing controlled callback.

## Evidence And Current State

- Each implementation item above reports its focused Implementation DoD passed. Their individual
  checks do not substitute for this cross-flow acceptance.
- The Plans UI implementation verified Start/replace/cancel/download/hide and 375px locally, but
  its single-record fixture did not visually compare ordering among several rows.
- The slider item separately passed its focused keyboard, Heart Rate consumer, and light/dark rail
  checks. Its scope did not verify the broader runner flow.
- The canonical runner design profile and existing named local fixture/runtime commands are the only
  permitted source of local test state. Do not hand-shape database rows or use a hosted account.

## Validation Inventory

1. Perform Browser Path Preflight; use a fresh managed loopback runtime and an existing named local
   fixture lifecycle. Authenticate as its fixture runner and prove the unauthenticated protected
   boundary separately. Do not reuse a stale/unmanaged runtime as fresh evidence.
2. Verify runner-local timezone calendar behavior around the designated local date: Settings shows
   the persisted IANA zone, Calendar/Today remain coherent, and a temporary local preference change
   only if the existing fixture lifecycle can restore it exactly.
3. In Calendar, prove independent workout truth: Copy a non-Rest workout, show Paste only on a
   genuinely empty future date, paste once, and prove a persisted Rest date offers no Paste. Confirm
   normal workout detail/navigation after the mutation.
4. In Progress > Plans, use two or more existing fixture records if the standard lifecycle provides
   them to prove visible name search and ordering by newest/oldest, name, and workout count. Verify
   selected private download, logical hide, default Start with empty future, replacement-required
   dialog, decline/no-op, positive replacement, factual receipt, and Calendar refresh. Do not use
   an ad hoc database insert solely to make a table ordering screenshot.
5. Verify light and dark slider presentation in one representative rendered consumer and `/hitoDS`:
   contrasting alpha rail, solid handles, visible prior markers, pointer or native-keyboard restore,
   and no regression of focus/disabled behavior.
6. At exact 375px, repeat the user-critical Calendar, Plans, confirmation, and table-containment
   path. Prove no page-level horizontal overflow; an internally scrolling table is permitted.
7. Run only current focused validators/build/runtime integrity that establish the tested artifact;
   preserve provider isolation and capture screenshots under
   `qa-artifacts/screenshots/2026-08-10/runner-calendar-and-saved-plans-global-qa/`.
8. Reset/clean up all task-owned local fixture state through the existing lifecycle. Record the
   exact cleanup result. No hosted, paid-provider, deploy, release, stage, commit, or push action.

## Non-Goals

- Hosted Supabase, production user data, deployment/release parity, paid providers/OpenAI transport,
  external integrations, marketing, Inspector, Figma, and unrelated product areas.
- Code, schema, migration, fixture-source, validator-source, or Design System implementation edits.

## Verdict Rule

This item passes only when every required local user path above passes with exact evidence and the
fixture cleanup is complete. A missing fixture capability, browser inability, or observed defect is
reported as a precise coverage gap or failed check with the first incorrect owner; it is never
covered by source inspection. A Passed verdict means **local Global QA Acceptance for this bounded
runner Calendar and saved Plans slice only**. It is not a hosted, deployment, or release claim.

## Global QA Receipt — 2026-08-10

- **Mode:** Tracked
- **Validation layer:** Independent local Global QA Acceptance for the bounded runner Calendar,
  saved Plans, timezone, and shared-slider slice
- **Role file:** `agents/qa.agent.md`
- **Skills used:** `skills/hito-qa-browser-regression/SKILL.md`,
  `skills/hito-backend-supabase-contract/SKILL.md`, the local Supabase operating skill, and the
  in-app browser-control skill
- **Subagents:** none for this acceptance run; the primary QA owner executed and integrated the
  complete flow directly
- **Evidence root:**
  `qa-artifacts/screenshots/2026-08-10/runner-calendar-and-saved-plans-global-qa/`
- **Implementation DoD:** Passed in the six accepted implementation items; unchanged by this
  receipt
- **Global QA Acceptance:** Failed

### Execution And Browser Path Preflight

QA declared the fixture/runtime mutation boundary before starting. The run used the existing
`saved-plan-readback` identity and canonical `qa_fixture` lifecycle against loopback-only local
Supabase and one managed built runtime. No hosted access, paid-provider call, dependency change,
manual database shaping, source implementation edit, Git lifecycle action, deployment, or recovery
material change occurred. The in-app browser was the primary control surface at desktop and exact
375px; no platform approval dialog was presented.

### Issue

**First incorrect owner:** FRONTEND Product,
`src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx` factual status copy.

The ordinary 10K preview persisted an immutable saved-plan record before optional Calendar
materialization, but the rendered dialog stated `Not saved until you create the plan.` Closing the
dialog without pressing **Create plan** still left `10K plan` in Progress > Plans. Read-only local
inventory agreed with the library: `plan_cycles=1`, `planned_workouts=0` while the preview was open.
Backend persistence/readback was therefore correct; the first wrong truth was the Frontend copy.

**Minimized replay:** fresh managed `qa_fixture` runtime -> reset `saved-plan-readback` to its
preserved profile -> authenticate as `qa-saved-plan` -> generate the ordinary 10K preview -> observe
`Not saved until you create the plan.` -> close the preview without Create -> open Progress > Plans
-> observe the saved `10K plan` record.

### Test Inventory

| Check                            | Scenario / environment                                                                                 | Result                   | Evidence                                                                                                                                                                                                                                                                                                                                                             |
| -------------------------------- | ------------------------------------------------------------------------------------------------------ | ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed runtime preflight        | Existing managed server rebuilt from the current checkout, `127.0.0.1:3000`, `providerMode=qa_fixture` | Passed                   | Initial status was managed, healthy, loopback, and fresh; the final pre-cleanup rebuild/status was again `current`, `freshnessReason=receipt_matches`, PID `85288`; the QA-owned server was then stopped                                                                                                                                                             |
| Unauthenticated boundary         | Logged-out browser at Progress > Plans, desktop 1280x800                                               | Passed                   | Guest runner and Sign in were shown; private plan library was absent. `01-unauthenticated-plans-boundary-1280x800.png`                                                                                                                                                                                                                                               |
| Fixture authentication           | Existing `saved-plan-readback` auth identity after named profile-preserving reset                      | Passed                   | Browser showed `QA Saved Plan`; `02-authenticated-saved-plan-baseline-1280x800.png`                                                                                                                                                                                                                                                                                  |
| Runner timezone                  | Authenticated Settings and Calendar/Today on fixture date 2026-08-10                                   | Passed                   | Persisted `America/Sao_Paulo`; Settings and Calendar both resolved Today to Monday, August 10. No temporary timezone mutation was needed                                                                                                                                                                                                                             |
| Saved-plan candidate status      | Ordinary 10K preview, then close without Calendar creation                                             | **Failed**               | Preview said `Not saved until you create the plan`, yet Progress > Plans showed the retained record; `03-first-saved-plan-preview-1280x800.png`, `04-saved-plan-library-after-preview-close-1280x800.png`; read-only counts `plan_cycles=1`, `planned_workouts=0`                                                                                                    |
| Plan search                      | One standard saved-plan record                                                                         | Passed                   | `Marathon` produced no match; `10K` restored the row; clearing restored the default list                                                                                                                                                                                                                                                                             |
| Sort controls                    | Created newest/oldest, name, workout-count controls with the standard one-record lifecycle             | Passed for control state | Visible sort direction and `aria-sort` changed correctly. Relative multi-row ordering remained unproven because the failed preview path was stopped and no rows were hand-shaped                                                                                                                                                                                     |
| Private download                 | Authenticated saved-plan action                                                                        | Passed                   | Browser download event completed for Download JSON; no public or hosted URL was used                                                                                                                                                                                                                                                                                 |
| Default Start                    | Empty future Calendar, runner-local Aug 10 start                                                       | Passed                   | Receipt: 32 non-Rest workouts across 55 Calendar days; readback `55` workouts, `32` non-Rest, saved provenance retained, active authority `0`; `05-default-start-receipt-1280x800.png`                                                                                                                                                                               |
| Replacement required and decline | Second Start against existing future workouts                                                          | Passed                   | Positive-replacement dialog appeared; Cancel produced a no-op receipt and unchanged 55-row hash; `06-replacement-required-dialog-1280x800.png`                                                                                                                                                                                                                       |
| Positive replacement             | Explicit Replace future workouts                                                                       | Passed                   | Eligible future rows were replaced, factual receipt rendered, saved record remained immutable, Calendar refreshed; `07-positive-replacement-receipt-1280x800.png`, `08-calendar-after-positive-start-1280x800.png`                                                                                                                                                   |
| Copy/Paste source                | Calendar Aug 11 Tempo copied from a non-Rest workout                                                   | Passed                   | Copy confirmation rendered; `09-calendar-copy-source-1280x800.png`                                                                                                                                                                                                                                                                                                   |
| Stored Rest discriminator        | Persisted Rest on 2026-10-02                                                                           | Passed                   | Menu offered no Paste; `10-stored-rest-no-paste-1280x800.png`                                                                                                                                                                                                                                                                                                        |
| Empty-date Paste and detail      | Truly empty 2026-10-05 -> Paste -> persisted workout detail -> reload                                  | Passed                   | Paste appeared only on the empty date; Calendar and `/workout/2026-10-05` agreed on Tempo after reload; `11-empty-future-paste-menu-1280x800.png`, `12-pasted-tempo-calendar-1280x800.png`, `13-pasted-tempo-detail-1280x800.png`                                                                                                                                    |
| Logical hide                     | Hide one saved record, then inspect default and Hidden filters                                         | Passed                   | Available view became empty; Hidden view retained the immutable record; `19-plan-hidden-default-view-1280x800.png`, `20-plan-hidden-filter-view-1280x800.png`                                                                                                                                                                                                        |
| Protected runner history         | Canonical 55-workout / 30-activity design profile with 11 FIT-completed matches                        | Passed                   | Past workout, result asset, metrics, and comparison counts/hashes were unchanged after an attempted positive replacement; the action was atomically refused with the protected-history message; `21-design-profile-calendar-protected-history-1280x800.png`, `22-protected-history-positive-replacement-1280x800.png`                                                |
| Canonical runner readback        | `local:design-profile:status` against managed loopback before final reset                              | Passed                   | 55 workouts, 30 activities, 11 matched / 19 unplanned, 11 FIT-completed matches, unauthenticated runtime API `401`, private raw fields absent, Gate 5 `normalized_stream_not_persisted`                                                                                                                                                                              |
| Exact 375px Plans                | Plans table and replacement confirmation at 375x812                                                    | Passed                   | Page root/body/viewport each measured 375px; table owned internal horizontal scrolling; dialog stayed within 0..375; `15-plans-mobile-375x812.png`, `16-replacement-dialog-mobile-375x812.png`                                                                                                                                                                       |
| Exact 375px Calendar/detail      | Calendar and selected workout detail at 375x812                                                        | Passed                   | Root/body/viewport each measured 375px with no page-level overflow; `17-calendar-mobile-375x812.png`, `18-workout-detail-mobile-375x812.png`                                                                                                                                                                                                                         |
| Slider consumer                  | Settings Heart Rate dual-range, light and dark                                                         | Passed                   | Alpha-neutral rail contrasted in each theme, handles remained solid/opaque, prior lower endpoint restored independently, and focus-visible was retained; `23-settings-slider-light-1280x800.png`, `24-settings-slider-light-marker-1280x800.png`, `25-settings-slider-dark-1280x800.png`                                                                             |
| Slider reference                 | `/hitoDS/components#slider`, light/dark Demo and light Variants                                        | Passed                   | Dark rail `oklch(0.96 0.005 80 / 0.14)`, light rail `oklch(0.18 0.01 60 / 0.14)`, solid handles, pointer baseline restore `6 -> 4`, enabled `:focus-visible`, and native disabled attributes on the disabled range and marker; `26-hito-ds-slider-dark-1280x800.png`, `27-hito-ds-slider-light-marker-1280x800.png`, `28-hito-ds-slider-disabled-light-1280x800.png` |
| Provider/privacy boundary        | Local runtime observability and design-profile status                                                  | Passed                   | Runtime mode stayed `qa_fixture`; the only observed non-null provider kind was `local_dev_fixture`; no paid-provider or hosted call occurred; raw private fields were absent                                                                                                                                                                                         |
| Focused integrity                | Current checkout                                                                                       | Passed                   | `validate-hito-ds-components`, `validate-manual-workout-authoring`, and `validate-runner-calendar-context` passed; final production build/Nitro/postbuild passed with only the existing large-chunk warning                                                                                                                                                          |
| Fixture/runtime cleanup          | Canonical `local:design-profile:reset`, tester inventory, then managed server stop                     | Passed                   | All 20 owned row/object counts returned to zero, retained storage objects `0`, auth user preserved, `qa-saved-plan` owned rows all `0`, leases `[]`, and final server status `stopped`                                                                                                                                                                               |

### Omitted Checks And Coverage Consequence

- The standard lifecycle exposed one saved-plan record. A comparative two-or-more-row ordering
  matrix was not run after the factual-copy failure because QA stopped that preview-creation path and
  did not hand-shape database rows. Sort-control semantics passed, but relative multi-row ordering is
  not independently covered by this run.
- No temporary timezone change or midnight transition was exercised. The run proves persisted IANA
  timezone and Settings/Calendar/Today coherence on the canonical fixture date, not a second browser
  replay across a timezone-day boundary.
- The exact 375px pass repeated Calendar, workout detail, Plans table, and replacement confirmation;
  it did not perform a second Paste mutation. Mobile containment and critical navigation are covered,
  while mobile Paste persistence relies on the same already-proven mutation owner.
- The in-app browser control surface did not execute a native default change for a range key. Pointer
  restoration, focus-visible state, native disabled state, and actual consumer/DS rendering are
  covered; native keyboard restoration is not claimed by this Global QA receipt.
- Hosted Supabase, deployment, production, paid providers, and release parity were intentionally out
  of scope and remain completely unclaimed.

### Cleanup And Preserved Boundaries

The final named reset removed all task-owned runner profile, plan, workout, activity, snapshot,
match, result, metric, and storage state while preserving the local auth identity. The same managed
server was rebuilt once after generated build output became unavailable; the tested Product/DS file
hashes were unchanged, and its final pre-cleanup status returned to fresh/healthy loopback
`qa_fixture`. QA then stopped that managed process; no server remains listening on port 3000.
Existing unrelated dirty source, recovery material, compatibility topology, dependencies, Git
state, and hosted systems were not changed.

**Verdict: Failed.** Implementation DoD remains Passed. Independent local Global QA Acceptance is
blocked on the Frontend Product factual-status defect above. No hosted, deployment, production, or
release-readiness claim is made.

## Frontend Fix-Forward Handoff

```text
ROLE: FRONTEND

Lane: Product
Mode: Lite fix-forward inside the blocked Tracked Global QA item

Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, this
canonical Global QA item, and the cited browser evidence before writing:
docs/tasks/backlog/2026-08-10-runner-calendar-and-saved-plans-global-qa.md

Task: Correct the first-plan preview's factual persistence status. A successful ordinary plan
preview already creates an immutable saved-plan library record before optional Calendar
materialization. The dialog must not say `Not saved until you create the plan` or leave an
equivalent false persistence claim in an adjacent preview/refresh status.

Demonstrated evidence:
- Fresh managed `qa_fixture`: generate ordinary 10K preview -> dialog states `Not saved until you
  create the plan` -> close without Create -> Progress > Plans shows the retained record.
- Readback during preview: `plan_cycles=1`, `planned_workouts=0`.
- The first incorrect owner is Frontend Product copy in
  src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx:276. Inspect the immediately related
  lifecycle copy in src/components/OnboardingGate.tsx before editing, because stale wording there
  could present the same false state to the runner.

Product truth and boundary:
- A saved plan is immutable provenance. It is already in Plans after a successful review; it is not
  an active/current Calendar owner.
- The primary action only materializes independent Calendar workouts. Do not change the backend
  persistence timing, preview/create behavior, plan identity, server actions, Calendar ownership,
  fixtures, authentication, or generated-plan semantics.
- Make the smallest factual wording/action-label correction in the existing onboarding components.
  Do not perform a broad copy rewrite, add state, change routes, introduce a dialog, or touch
  persistence, schema, migrations, providers, or Design System source.

Focused proof:
1. Reproduce the ordinary preview against the existing safe local fixture. The preview must clearly
   distinguish saved library record from not-yet-materialized Calendar workouts; closing it must not
   create Calendar rows and Plans must retain the record.
2. Check the adjacent refresh/failed/primary-action states that share this lifecycle: they must not
   make a false claim about a successful saved record. Preserve truthful unavailable/failed behavior.
3. Run focused static checks and a proportionate local browser replay. No full Global QA rerun is
   required in this task; QA owns the independent replay after this receipt.

Update this item only with a narrow English Frontend correction receipt; do not overwrite the QA
failure receipt or claim Global QA. Ongoing commentary visible to Ivan is Russian; final formal
report and evidence table are English. Do not stage, commit, push, deploy, use hosted data, or call
providers. Stop only for a demonstrated contradiction in the persisted preview contract; route that
boundary to Product rather than adding a browser-side workaround.

```

## Frontend Correction Receipt — 2026-08-10

- **Mode:** Lite fix-forward inside this blocked Tracked Global QA item.
- **Outcome:** The successful first-plan preview now states that the immutable plan record is saved
  in Plans and that Calendar workouts have not yet been added. The materialization action is labeled
  `Add to Calendar`; adjacent refresh, closed-preview, working, success, and failure copy follows the
  same lifecycle truth.
- **Root cause:** Frontend Product copy described the already-retained preview as unsaved even though
  the successful preview action returned a saved record before optional Calendar materialization.
- **Reuse and change budget:** Reused the existing onboarding dialog, gate, and preset helper seams.
  New runtime artifacts: none. No state, route, action, persistence, Calendar, or Design System
  contract changed.

| Check                             | Scenario / environment                                                                                                           | Result | Evidence                                                                                                                                                                                                                                                                                                         |
| --------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted-preview discriminator   | Fresh managed loopback `qa_fixture`, ordinary 10K preview                                                                        | Passed | During the ready preview: `plan_cycles=1`, `planned_workouts=0`, one available retained payload.                                                                                                                                                                                                                 |
| Ready and refresh copy            | 1280x720 authenticated in-app browser                                                                                            | Passed | Ready dialog showed `Saved in Plans. Calendar workouts have not been added yet.` and `Add to Calendar`; refresh stated that the current saved plan remains in Plans. Screenshot: `qa-artifacts/screenshots/2026-08-10/runner-calendar-and-saved-plans-global-qa/29-first-plan-preview-factual-saved-status.png`. |
| Close without materialization     | Close preview, open Progress > Plans, then read back fixture state                                                               | Passed | Plans showed the retained `10K plan`; final state remained `plan_cycles=1`, `planned_workouts=0`.                                                                                                                                                                                                                |
| Adjacent lifecycle states         | Source audit of ready, refresh, closed, working, success, confirm-failure, and preview-unavailable branches                      | Passed | Successful-record states no longer claim the plan is unsaved; actual preview-unavailable paths retain their truthful no-saved-candidate wording.                                                                                                                                                                 |
| Focused static and runtime checks | Targeted ESLint, Prettier, `git diff --check`, exact false-copy search, production build, fresh managed runtime, browser console | Passed | No targeted static errors, no matching stale persistence claim in the changed components, current source served from a fresh artifact, and browser console errors were empty.                                                                                                                                    |
| Cleanup                           | Named `saved-plan-readback` fixture lifecycle and managed server                                                                 | Passed | Lease released, reset removed the task-owned plan and runner data, and the managed server was stopped.                                                                                                                                                                                                           |

The browser replay intentionally did not click `Add to Calendar`: this correction's discriminator was
closing a successful preview without materialization while retaining its saved library record. No
failure injection or full cross-flow rerun was performed; independent QA owns that replay.

**Frontend correction DoD: Passed. Global QA Acceptance remains Failed/blocked pending independent
QA replay. Next owner: QA.** No subagent was used for this correction.

## Global QA Replay Receipt — 2026-08-10

- **Mode:** Tracked
- **Validation layer:** Independent local Global QA replay of the corrected ordinary first-plan
  preview and Calendar materialization flow
- **Role file:** `agents/qa.agent.md`
- **Skills used:** `skills/hito-qa-browser-regression/SKILL.md`,
  `skills/hito-backend-supabase-contract/SKILL.md`, the local Supabase operating skill, and the
  in-app browser-control skill
- **Subagents:** none; no bounded subagent would have reduced risk or elapsed time for this isolated
  browser/persistence replay
- **Evidence root:**
  `qa-artifacts/screenshots/2026-08-10/runner-calendar-and-saved-plans-global-qa/`
- **Implementation DoD:** Passed in the accepted implementation items and Frontend correction;
  unchanged by this receipt
- **Global QA Acceptance:** Passed for this bounded local slice only

### Execution And Browser Path Preflight

QA published the runtime, identity, lifecycle, evidence, and stop boundaries before the first
fixture mutation. The replay used the existing `saved-plan-readback` identity, named local fixture
lifecycle, local Supabase, the in-app browser, and one fresh managed built server on
`127.0.0.1:3000` with `providerMode=qa_fixture`. No hosted access, paid-provider call, manual row
shaping, duplicate server, dependency mutation, source implementation edit, Git lifecycle action,
deployment, or recovery-material change occurred. The previously proved unauthenticated boundary
was accepted without rerun because the correction changed only authenticated onboarding copy/action
labels and did not touch authentication or route protection.

### Replay Test Inventory

| Check                                    | Scenario / environment                                                                                              | Result                                 | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Managed runtime preflight                | Fresh managed built loopback runtime, `qa_fixture`                                                                  | Passed                                 | Initial status was managed, healthy, loopback-only, build present, and `artifactFreshness=fresh`; after unrelated Admin snapshot drift appeared during the run, QA rebuilt the same managed runtime and the final status again returned `current`, `freshnessReason=receipt_matches`, PID `92394`                                                                                                                       |
| Authenticated fixture identity           | Existing `qa-saved-plan@local.test` / `saved-plan-readback` profile                                                 | Passed                                 | Browser rendered `QA Saved Plan`; only the named local lifecycle was used                                                                                                                                                                                                                                                                                                                                               |
| Ready-state factual status               | Ordinary 10K preview, desktop 1280x800                                                                              | Passed                                 | Dialog rendered `Saved in Plans. Calendar workouts have not been added yet.` with `Add to Calendar`; `30-qa-replay-ready-saved-status-1280x800.png`                                                                                                                                                                                                                                                                     |
| Refresh-state factual status             | Refresh the already-saved preview, desktop 1280x800                                                                 | Passed                                 | Refresh rendered `Your current saved plan stays in Plans while Hito prepares a new reviewed version.` and returned to the same factual ready state; `31-qa-replay-refresh-saved-status-1280x800.png`                                                                                                                                                                                                                    |
| Close without Calendar materialization   | Close preview, then Progress > Plans and Calendar                                                                   | Passed                                 | Readback remained one saved record and zero planned workouts; Plans showed `10K plan` and Calendar remained unmaterialized; `32-qa-replay-plan-retained-after-close-1280x800.png`, `33-qa-replay-calendar-unmaterialized-after-close-1280x800.png`                                                                                                                                                                      |
| Saved-record exactness before Add        | Read-only local Product persistence discriminator                                                                   | Passed                                 | Saved plan ID `2fc53998-9428-466d-a0cd-b747e49ad893`, status `archived`, payload hash `9cb1e13ee7655d48`, review checksum `a74e6e6358337417d86e4867e3a1d99afcfcce76b595d8cdff7eb7351e3ed143`, identical created/updated timestamps, and `planned_workouts=0`                                                                                                                                                            |
| Clean suitable fixture phase             | Canonical design-profile reset/seed/status, then profile-preserving `pool-reset-plan`                               | Passed                                 | The intermediate canonical status proved 55 workouts, 30 activities, 11 matched / 19 unplanned, and 11 FIT completions. The supported profile-preserving reset then produced one runner profile with every plan, workout, result, metric, activity, snapshot, and match count at zero before the Add replay                                                                                                             |
| Exact 375px primary action               | Ready dialog at 375x812                                                                                             | Passed                                 | Viewport/root/body each measured 375px; dialog bounds were `0..375`, action bounds `25..350`, and `Add to Calendar` was enabled; `34-qa-replay-add-to-calendar-ready-375x812.png`                                                                                                                                                                                                                                       |
| Add working state and completion         | Activate `Add to Calendar` at 375x812                                                                               | Passed                                 | Rendered `Adding workouts to Calendar` / `Adding to Calendar...`, then navigated to usable Calendar; root/body remained 375px; `35-qa-replay-add-working-375x812.png`, `36-qa-replay-calendar-materialized-375x812.png`                                                                                                                                                                                                 |
| Independent Calendar materialization     | Read-only local persistence readback after Add                                                                      | Passed                                 | A separate provenance row with no saved payload was created and exactly 55 independent `planned_workouts` materialized from 2026-08-10 through 2026-10-03; there were zero leading past rows and no accumulation after a clean replay                                                                                                                                                                                   |
| Saved-library immutability/non-authority | Compare saved record before/after Add and inspect Progress > Plans at 375x812                                       | Passed                                 | Original saved ID, payload hash, checksum, status, and timestamps were unchanged; Plans still showed exactly one `Available` saved record; `37-qa-replay-saved-plan-after-add-375x812.png`                                                                                                                                                                                                                              |
| Protected/FIT/history boundary           | Nonzero canonical profile discriminator before supported clean transition, then protected-table readback across Add | Passed with inherited nonzero coverage | The canonical 55/30/11/19 and 11-completion profile passed before the supported clean transition. During the Add phase, workout logs, result assets, actual metrics, comparisons, activity matches, and activities stayed zero before/after. The prior accepted nonzero protected-history Start/replace evidence remains the coverage for preservation of populated protected rows; it was not rerun or overstated here |
| Provider/privacy boundary                | Runtime observability plus accepted prior authenticated/private-field checks                                        | Passed                                 | The only non-null provider kind was `local_dev_fixture`; no hosted or paid provider was used. Prior unauthenticated `401` and private-field-absence evidence remains accepted and was not rerun                                                                                                                                                                                                                         |
| Focused static integrity                 | Corrected onboarding components                                                                                     | Passed                                 | Targeted ESLint and Prettier passed; exact stale unsaved-copy search returned no matches; the three corrected source hashes remained identical to the preflight hashes                                                                                                                                                                                                                                                  |
| Current build/runtime integrity          | Full production Vite client/SSR/Nitro build, postbuild, managed status                                              | Passed                                 | Rebuild completed with only the existing large-chunk warning; final pre-stop status was managed, healthy, loopback-only, build present, and fresh                                                                                                                                                                                                                                                                       |
| Fixture/runtime cleanup                  | `pool-reset-plan`, inventory, viewport restore, managed stop                                                        | Passed                                 | Final identity retained one runner profile and zero rows in every other owned table, leases were `[]`, viewport returned to desktop, and final server status was `stopped` with no listener on port 3000                                                                                                                                                                                                                |

### Inherited Evidence And Preserved Coverage Gaps

The prior Global QA receipt remains accepted evidence for timezone coherence, saved-plan
Start/replace/decline, Copy/Paste, stored-Rest eligibility, download/hide, sliders, provider/privacy,
and protected-history behavior because the Frontend correction was limited to onboarding factual
copy/action labels. Those paths were **not rerun** in this replay.

- The standard lifecycle exposed one saved-plan record. Comparative two-or-more-row ordering was not
  run and no rows were hand-shaped. Sort-control semantics are covered; relative multi-row ordering
  remains unproven.
- No temporary timezone change or midnight transition was exercised. Coverage remains limited to
  the persisted IANA timezone and Settings/Calendar/Today coherence on the canonical fixture date.
- The exact 375px replay did not perform a second Paste mutation. Mobile containment and critical
  navigation are covered; mobile Paste persistence relies on the already-proven mutation owner.
- Native keyboard slider restoration is not claimed by this Global QA receipt. Pointer restoration,
  focus-visible, disabled state, and rendered consumer/DS evidence remain accepted.
- The short-lived success toast did not remain in the DOM after the route transition and no success-
  toast screenshot is claimed. The same 375px run directly captured the factual ready and working
  states, the completed Calendar render, the retained Plans record, and the exact persisted 55-row
  result; therefore completion truth and containment are covered without fabricating toast evidence.
- Hosted Supabase, deployment, production, paid providers, and release parity were intentionally out
  of scope and remain completely unclaimed.

### Cleanup And Preserved Boundaries

The supported cleanup retained the existing authenticated profile while removing all task-owned
plan, workout, result, activity, snapshot, match, metric, insight, entitlement, and capability rows.
The managed runtime was rebuilt only to eliminate newly detected artifact drift, returned to fresh
loopback `qa_fixture`, and was then stopped. Existing unrelated dirty source, recovery material,
workspace topology, dependencies, lockfiles, Git state, hosted systems, and provider boundaries were
preserved.

**Verdict: Passed. Implementation DoD remains Passed. Global QA Acceptance: Passed for the bounded
local runner Calendar and saved Plans slice. Hosted, deployment, production, and release readiness
remain unclaimed.**

## Original QA Assignment

```text
ROLE: QA

Mode: Tracked
Validation layer: Independent local Global QA Acceptance for the bounded runner Calendar and saved
Plans slice; not hosted, release, or deployment acceptance.

Read AGENTS.md, agents/qa.agent.md, skills/hito-qa-browser-regression/SKILL.md, and this canonical
item before work:
docs/tasks/backlog/2026-08-10-runner-calendar-and-saved-plans-global-qa.md

Task: Independently validate the completed runner-facing timezone, Calendar mutation, saved Plans,
and shared-slider contracts as one authenticated local user flow. Do not implement product fixes.

Product truth to preserve:
- Calendar workouts are independent runner-owned truth; a saved plan is immutable provenance, never
  active/current authority.
- Plans may be listed, searched, sorted, privately downloaded, hidden, and Started. Start uses
  runner-local date/preferences, may omit leading incompatible source days, and never calls a
  provider.
- Only a positive explicit future-replacement choice may mutate eligible future workouts. Decline is
  no-op. Past/logged/FIT/evidence/completed/skipped/protected truth remains untouched.
- Copy comes from a non-Rest workout; Paste appears only for a genuinely empty future date, never a
  saved Rest date.
- Persisted runner timezone defines calendar-day truth. Sliders have a dark alpha rail in light
  theme and light alpha rail in dark theme, solid handles, and restorable prior markers.

Required browser acceptance:
1. Write Browser Path Preflight. Use a fresh managed loopback runtime plus existing named local
   fixture lifecycle; do not present platform approval dialogs, use hosted data, start duplicate
   servers, or treat a stale/unmanaged runtime as fresh evidence. Prove the unauthenticated boundary
   separately.
2. Verify timezone Settings and Calendar/Today coherence; make a temporary local preference change
   only when the existing lifecycle can restore it exactly.
3. Prove Calendar Copy -> truly empty future Paste -> persisted detail, and independently prove a
   stored Rest date offers no Paste.
4. Prove Progress > Plans across two or more existing fixture records when the standard lifecycle
   provides them: name search, newest/oldest/name/workout-count ordering, private download, logical
   hide, default Start, replacement-required dialog, decline/no-op, positive replacement, factual
   receipt, and Calendar refresh. Do not manually shape database rows to manufacture sort evidence.
5. Verify one rendered slider consumer and /hitoDS in light/dark: contrasting rail, solid handle,
   prior marker restore, focus/disabled preservation.
6. Repeat the user-critical Calendar/Plans/confirmation path at exact 375px. Prove no page-level
   horizontal overflow; table-internal scrolling is allowed.
7. Run proportionate current build/runtime integrity evidence and reset all task-owned fixture state
   with the existing lifecycle. Capture browser evidence under
   qa-artifacts/screenshots/2026-08-10/runner-calendar-and-saved-plans-global-qa/.

Do not edit source, schema, migrations, fixtures, validators, or task implementation. If a required
check fails, stop that acceptance path, record exact reproduction and first incorrect owner, then
complete independent safe checks. Use a bounded read-only subagent only if it materially accelerates
an independent source/evidence audit; do not create a subagent ceremony. Ongoing commentary visible
to Ivan is Russian. The canonical item update, final formal report, and Check | Scenario /
environment | Result | Evidence table are English. Do not stage, commit, push, deploy, access hosted
state, or call paid providers.
```

## Current QA Replay Handoff

```text
ROLE: QA

Mode: Tracked
Validation layer: Independent local Global QA replay after the only failed factual-status check was
corrected. This remains local acceptance for the bounded runner Calendar and saved Plans slice, not
hosted, release, or deployment acceptance.

Read AGENTS.md, agents/qa.agent.md, skills/hito-qa-browser-regression/SKILL.md, this canonical
item, its original Global QA failure receipt, and the Frontend correction receipt before work:
docs/tasks/backlog/2026-08-10-runner-calendar-and-saved-plans-global-qa.md

Task: Independently replay the failed ordinary first-plan preview flow against a fresh managed
loopback fixture and decide whether the blocked Global QA verdict can close. Do not implement fixes.

Required replay:
1. Browser Path Preflight: use the existing named local fixture lifecycle and a fresh managed
   loopback runtime. Do not use hosted data, manual database shaping, duplicate servers, or a stale
   process. Capture the unauthenticated boundary only if the new artifact does not otherwise prove
   it unchanged.
2. Generate the ordinary 10K preview. It must state that the reviewed plan is already saved in
   Plans while Calendar workouts have not been added. It must not make an equivalent false unsaved
   claim in the ready or refresh state.
3. Close the preview without Add to Calendar. Prove the saved record remains visible in Progress >
   Plans and that Calendar rows were not materialized.
4. Repeat from a clean suitable fixture state and activate Add to Calendar. Prove it materializes
   independent future Calendar workouts, keeps the saved library record immutable/non-active, and
   does not change protected past/FIT/history truth.
5. Recheck the factual primary-action/receipt rendering at exact 375px or explain why the existing
   375px layout evidence remains unaffected by a text-only component change. Run fresh build/runtime
   integrity evidence and clean up through the named lifecycle.

The prior Global QA receipts remain accepted evidence for timezone, saved-plan Start/replace,
Copy/Paste, Rest eligibility, sliders, provider/privacy, and their documented limitations because
the Frontend correction changed only onboarding factual copy/action labels. Do not claim that they
were rerun unless they were. Preserve their coverage gaps exactly.

If every replay check passes, update this item to completed with `Global QA Acceptance: Passed` for
this bounded local slice. If anything fails, leave it blocked with the exact first incorrect owner
and evidence. Keep commentary visible to Ivan in Russian. Write the canonical item update, final
formal report, and Check | Scenario / environment | Result | Evidence table in English. Do not edit
source, schema, migrations, fixtures, validators, hosted state, dependencies, or Git lifecycle.
```

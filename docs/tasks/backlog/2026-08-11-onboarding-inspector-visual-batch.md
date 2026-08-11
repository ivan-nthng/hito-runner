# Onboarding Start Choice And Running-Level Slider

## Work Item ID

2026-08-11-onboarding-inspector-visual-batch

## Status

completed

## Type

product_ui

## Priority

high

## Owner

frontend

## Frontend Lane

product

## Scope

authenticated-runner-onboarding-baseline-then-plan-method-composition

## Archive Intent

retain_in_place

## Task

Preserve the existing required runner baseline on authenticated route `/` before a route-local
plan-method card. After the shared profile fields are complete, the card exposes `Create a plan` and
`Build myself` through the existing enclosed tab treatment. `Create a plan` retains the existing
generated-plan UI unchanged. `Build myself` hides only generated-plan choices, explains that the
runner can create workouts independently or use a coach/friend workout, and enables the existing
manual empty-Calendar action. That action retains past workouts and otherwise opens an empty Calendar
for manual creation. No no-profile Calendar state is a Product requirement.

## Stage

FRONTEND Product baseline-first method-card correction complete; focused local proof passed.

## Product Scope Correction — 2026-08-11

This is the authoritative Product decision and supersedes every preceding statement in this item
about a no-profile, no-baseline, or first-screen manual Calendar flow. The existing shared runner
profile remains mandatory and is saved before method selection: height, weight, running level, and
every other existing required common baseline field remain part of onboarding. An absent fitness
level remains `running_regularly` exactly as before this task.

Only after that shared baseline is valid, show one existing route-local card. Its top uses the
existing second/enclosed Hito tab treatment: `Create a plan` is selected by default and leaves the
current generated-plan content unchanged, including distance and all downstream generated-plan
choices. `Build myself` is the alternate content tab, not a new onboarding flow: it hides those
generated-only choices, shows only the factual manual-workout/coach-upload explanation, and makes
the existing `Create plan` action available. Invoking it creates no workouts, retains all past
workouts and their FIT/history evidence, and opens the runner's empty Calendar when no history
exists. No backend persistence, eligibility, readback, auth, migration, RPC, or Calendar-truth
contract changes are authorized for this Product layout decision.

The backend implementation recorded below was based on a superseded interpretation and must be
restored to its immediately preceding profile-required behavior before Frontend integration begins.
Captured helper/title removals and the existing `running_regularly` default remain outside scope.

## Current Frontend Execution Preflight — 2026-08-11

- **Decision / source fact:** the Backend restoration is complete. The pre-existing manual creation
  action again requires the existing saved profile/baseline and produces a zero-workout Calendar;
  the first remaining owner is **FRONTEND Product** at `OnboardingGate` composition.
- **Existing seams to reuse:** `OnboardingGate`, the existing controlled shared setup sections,
  existing generated preview path, existing profile-backed manual creation caller, and the existing
  enclosed Hito tab treatment. Retain the previously adopted `HitoSlider` running-level consumer
  and its `running_regularly` default.
- **Smallest behavior change:** place the method control inside one route-local card directly after
  shared baseline completion and before generated-only content; branch only the card body. No
  backend payload, action, profile requirement, Calendar readback, or persistence semantics change.
- **New runtime artifacts:** **none**. No new file, helper, state layer, shared primitive/API/CSS,
  fixture, validator family, compatibility path, migration, RPC, or data shape.
- **Removal / simplification:** remove the current method-first arrangement and any duplicate or
  trailing manual-only presentation that becomes unreachable. Do not leave two competing method
  controls.
- **Focused proof:** source order/default audit; generated/manual selection replay; manual action
  enabled only after the existing baseline is valid; desktop and exact `375x812` light/dark,
  keyboard tabs, no overflow/console error; scoped static checks and production build.
- **Stop boundary:** a required Backend/persistence/DS change stops and returns to Product. Existing
  profile-backed manual action must be called unchanged.

The retained Inspector drafts are historical evidence for the visual/control request:

- `/Users/ivan/.codex/attachments/7dbb3b25-0872-4797-ab80-45b7ee618349/pasted-text.txt`
- `/Users/ivan/.codex/attachments/1594b7aa-1bff-4df6-a057-3f51fbb3f04e/pasted-text.txt`

## Historical Frontend Execution Preflight — Corrected 2026-08-11

- Existing seams: reuse `OnboardingGate` route composition and its generated-preview/manual actions;
  reuse `HitoChoiceToggle` with `useHitoRadioGroup`; reuse `QuickSetupPlanSetupSections`, its existing
  controlled `fitnessLevel` state, and the native discrete `HitoSlider`.
- Smallest change: place one route-local generated/manual choice before `QuickSetupPlanSetupSections`,
  render the existing matching branch, and replace the running-level `OptionGrid` consumer with a
  four-position slider. `buildOnboardingGeneratedPlanSetupState` remains unchanged and continues to
  default to `running_regularly`.
- New production runtime artifacts: **none**. No file, helper, store, mutation, persistence path,
  shared primitive/API/CSS, fixture, validator family, or compatibility layer is added.
- Superseded responsibility removed: the trailing manual-calendar row and the four-card running-level
  presentation. Generated and manual action implementations remain canonical and unchanged.
- Focused proof: exact source/default/ordering checks; scoped formatting/lint and production build;
  local generated/manual branch replay, slider pointer/keyboard selection, and desktop/exact
  `375x812` light/dark overflow and console checks.
- Stop boundary: any required backend/persistence or shared Design System change returns to its
  canonical owner rather than being patched locally.

## Evidence And Canonical Owner

`OnboardingGate` owned the manual-calendar row after the generated goal and had no explicit start
mode. `QuickSetupPlanSetupSections` rendered the four stored fitness values as `OptionButton` cards.
The existing choice-toggle/radio utilities and `HitoSlider` already provide the required semantics;
the first incorrect owner is therefore **FRONTEND Product** at those existing consumers.

The slider mapping is:

| Position | Existing value        | Display label       |
| -------- | --------------------- | ------------------- |
| 0        | `new_to_running`      | Neutral running     |
| 1        | `beginner`            | Beginning           |
| 2        | `running_regularly`   | Running regularly   |
| 3        | `performance_focused` | Performance focused |

The two internal dots are consumer-only visual markers. They add no DOM control, pointer target, or
focus stop.

## Reuse-First Boundary

- Reuse the existing generated preview/review action unchanged. The manual creation action now
  accepts only an empty request and reuses runner-owned Calendar persistence without baseline or
  profile writes; Frontend must remove its superseded setup gates and form-derived payload.
- Keep an absent fitness level at `running_regularly`; preserve every supplied value.
- Do not change plan/context helper copy, heading roles, heart-rate guidance presentation, backend
  actions, schema, auth, providers, saved-plan/Calendar/FIT truth, shared DS APIs/CSS, `/hitoDS`,
  Figma, or unrelated dirty work.

## Definition Of Done

1. The semantic `Create a plan for` / `Build myself` choice appears before baseline and running-level
   setup, is mutually exclusive, and retains keyboard radio behavior.
2. Generated selection preserves the existing goal, preview/review, advanced settings, and explicit
   Add-to-Calendar behavior. Manual selection hides generated-only content and invokes only the
   existing gated manual action when the runner chooses it.
3. The running-level selector is the existing four-position `HitoSlider` with exact stored-value
   mapping and two passive internal markers.
4. The absent default remains `running_regularly`; supplied values still use existing state without
   new persistence semantics.
5. Pointer and keyboard interaction select the four discrete slider values without additional
   focus targets.
6. Desktop and exact `375x812` light/dark presentation has no horizontal overflow or console error.
7. Focused static checks and a production build support Implementation DoD. Global QA Acceptance
   and release readiness remain unclaimed.

## Validation Expectations

| Check                   | Scenario / environment                       | Result | Evidence                                                                 |
| ----------------------- | -------------------------------------------- | ------ | ------------------------------------------------------------------------ |
| Source/default/order    | Focused onboarding source                    | Pass   | Choice precedes setup; unchanged absent default is `running_regularly`.  |
| Branch semantics        | Local generated and manual selections        | Pass   | Radio keyboard switching exposes only the matching existing action path. |
| Slider semantics        | Local pointer and keyboard interaction       | Pass   | Four exact values, passive markers, and one native focus target.         |
| Responsive visual proof | Desktop and exact 375x812, dark/light        | Pass   | No horizontal overflow or browser console/page errors.                   |
| Focused static/build    | Scoped source checks and production consumer | Pass   | Prettier, scoped ESLint, Product contracts, diff check, and build pass.  |

## Next Recommended Role

Product, only if a separate Global QA or release-readiness decision is requested.

## Blockers

None. The superseded no-profile premise is historical; the restored profile-backed contract and the
baseline-first Frontend composition are complete.

## Backend Execution Preflight — 2026-08-11

- **Red discriminator:** The existing no-input call returns `invalid_input` before persistence.
  `createEmptyManualActivePlanForUser` currently requires age, height, weight, and running level,
  saves a runner baseline, and sends a profile-bearing payload through reviewed-plan persistence.
- **First incorrect owner:** Backend manual-entry eligibility, persistence, and persisted snapshot
  readback. Frontend cannot remove its fields until this action accepts an empty request without
  manufacturing profile truth.
- **Existing seams reused:** `createEmptyManualActivePlanForUser`, the existing `plan_cycles`
  Calendar provenance, `apply_reviewed_future_schedule_persistence`, runner Calendar context,
  `getPersistedSnapshot`, and the existing manual-workout source and loopback persistence proofs.
- **New production runtime artifacts:** **none**. No file, migration, RPC, table, fixture family,
  state layer, fallback model, dependency, or compatibility wrapper is proposed.
- **Legacy responsibility to remove:** Required manual setup fields, baseline/profile persistence,
  setup/running-level provenance metadata, and the profile-only onboarding return when a manual
  Calendar provenance already exists.
- **Focused proof:** Prove no-input rejection red-to-green; authenticated no-profile persistence to
  zero Calendar rows; no runner profile, baseline, or heart-rate write; authenticated empty
  Calendar readback; ordinary reviewed manual Add plus existing edit/move/copy/protection behavior;
  auth/RLS, provider isolation, cleanup, scoped static checks, and the relevant local Backend suite.
- **Stop boundary:** Stop before any schema change if the existing atomic provenance and snapshot
  seams cannot represent this state without a new persisted shape.

## Historical Frontend Product Closure Receipt — Superseded 2026-08-11

- **Task and stage:** completed the corrected authenticated onboarding start-choice ordering and
  running-level slider presentation in Tracked mode.
- **Preflight and owner:** reused the existing `OnboardingGate`, generated-preview/manual actions,
  `QuickSetupPlanSetupSections`, `HitoChoiceToggle`, radio-group utility, and `HitoSlider` seams.
  The first incorrect owner was the FRONTEND Product consumer composition. New production runtime
  artifacts: none.
- **Product outcome:** the mutually exclusive plan-method choice now precedes runner setup. The
  generated and manual branches retain their existing actions and gates. The four running-level
  cards are one controlled discrete slider with passive internal markers. An absent fitness value
  still initializes to `running_regularly`; no persistence behavior changed.
- **Files changed:** `src/components/OnboardingGate.tsx`,
  `src/components/onboarding/QuickSetupPlanSetupSections.tsx`, and
  `src/components/onboarding/onboarding-form-model.ts`. This canonical item carries the task
  lifecycle and evidence receipt.
- **Preserved boundaries:** generated preview/Add-to-Calendar and manual Calendar mutations,
  baseline and heart-rate requirements, backend/persistence/auth, saved-plan/Calendar/FIT truth,
  shared Design System source, captured helper/title copy, and unrelated dirty work are unchanged.

| Check                         | Scenario / environment                                      | Result | Evidence                                                                                                                                                                                 |
| ----------------------------- | ----------------------------------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Corrected default             | Fresh local onboarding state                                | Pass   | Reload reported slider value `2` / `Running regularly`; the canonical setup-state source is unchanged.                                                                                   |
| Choice order and semantics    | Managed loopback fixture, desktop                           | Pass   | `Create a plan for` / `Build myself` appears before runner baseline; radio Space/Arrow switching is mutually exclusive.                                                                  |
| Generated/manual branches     | Managed loopback fixture                                    | Pass   | Generated content and action return on generated selection; manual selection hides generated-only content and shows the existing gated `Build myself` action. No mutation was invoked.   |
| Slider interaction            | Managed loopback fixture                                    | Pass   | Pointer selected position 3; keyboard reached 0, 1, 2, and 3; only the native range is interactive and both markers compute with `pointer-events: none`.                                 |
| Responsive/theme presentation | Headless Chrome, 1280 desktop and exact 375x812, light/dark | Pass   | Choice, slider, and branch actions remain readable with no horizontal overflow. Screenshots are retained under `qa-artifacts/screenshots/2026-08-11/onboarding-inspector-visual-batch/`. |
| Browser health                | Same local sessions                                         | Pass   | Browser console and page-error inventories were empty; ordinary focus and navigation within the controls remained available.                                                             |
| Focused static checks         | Task-owned TypeScript/TSX                                   | Pass   | Prettier check, scoped ESLint, `validate-product-contracts`, exact source/default/order check, and `git diff --check` passed.                                                            |
| Production build              | Fresh managed local artifact                                | Pass   | `npm run build` completed; only the repository's standard chunk and `use client` warnings were emitted.                                                                                  |
| Fixture cleanup               | Disposable loopback identities and managed server           | Pass   | Both exact local acceptance identities were deleted through the ordinary test-user command, the browser session closed, and the managed server stopped; hosted state was untouched.      |

The broad repository `tsc --noEmit` inventory was not green because of pre-existing diagnostics in
unrelated Admin, manual-workout, Design System, training, and route files; no task-owned diagnostic
was observed. The successful production build and scoped lint/source checks cover the compiled
consumer change, but do not convert those unrelated repository diagnostics into a passing claim.
The generated preview/Add-to-Calendar server mutation and the manual Calendar mutation were not
re-executed: this correction only reorders and conditionally exposes their existing callers, and the
browser proof stopped before mutation. Their end-to-end server effects therefore remain outside this
focused receipt.

Implementation DoD is met. Global QA Acceptance and release readiness remain unclaimed. The role
file was `agents/frontend.agent.md`; project skills used were
`skills/hito-frontend-design-system/SKILL.md` and
`skills/hito-qa-browser-regression/SKILL.md`. No subagent was used. Next owner is Product only if it
chooses to route a separate independent QA replay. There are no implementation blockers.

## Inspector Correction — 2026-08-11T02:20:03.637Z

- **Item ID:** `3ba0ec7e-c6be-4374-9291-83b78a75333d`
- **Route:** `/` — `Hito Running — Weekly plan`
- **Theme / viewport:** dark, `1470x801`
- **Captured target:** `div[aria-label="Plan\\ creation\\ method"]`, `div[role="radiogroup"]`,
  width `1024px`, height `64px`, two children
- **Inspector scope:** only this selected plan-creation-method component instance; no product or
  Design System mutation occurred in the Inspector.
- **Captured spacing evidence:** horizontal and vertical gap `12px`, mapped to existing
  `--space-3`; no token change was requested.
- **Faithful Product request:** this is the first top-level choice. `Create a plan` must reveal the
  `10K`, `21K`, and remaining generated-plan choices. `Build myself` behaves as the alternate tab:
  it reveals no further choices, enables the manual Calendar entry action, and shows only a brief
  explanation that the runner can create workouts personally or upload a workout from a coach or
  friend.

## Demonstrated Cross-Owner Discriminator

The current selected `Build myself` branch in `OnboardingGate` still renders
`QuickSetupPlanSetupSections` before the branch and disables its primary action using
`isManualProfileReady(constructorState) && runnerBaseline.isReady`. Its `createManualPlan` caller
builds a `ManualEmptyPlanSetupInput` and persists the heart-rate draft before invoking the server
action. Therefore a Frontend-only change that hides the fields would either leave the action blocked
or fabricate profile data. The first incorrect canonical owner for immediate no-input manual start
is **BACKEND** at the existing manual-workout authoring action and its eligibility/persistence seam.

## Backend Completion Receipt — 2026-08-11

- **Task and stage:** completed the Tracked Backend manual-start eligibility prerequisite. The
  overall Product item remains open and is ready for Frontend integration.
- **Product outcome:** the authenticated manual entry action now accepts only `{}`. It persists an
  archived manual Calendar provenance record with zero workouts through the existing atomic
  runner-owned Calendar seam. A no-profile runner receives the ordinary authenticated empty
  Calendar snapshot; no runner profile, baseline, heart-rate value, goal, schedule preference, or
  invented default is written.
- **Root cause discriminator:** before the change, the same no-input call returned `invalid_input`.
  The canonical Backend action required age, height, weight, and running level, saved a runner
  baseline, and used profile-bearing reviewed-plan persistence. Snapshot readback also returned
  onboarding solely because `runner_profiles` was absent. Those were the first incorrect owners.
- **Reuse-first result:** reused `createEmptyManualActivePlanForUser`, `plan_cycles` as provenance,
  `apply_reviewed_future_schedule_persistence`, runner Calendar context, `getPersistedSnapshot`, and
  the existing manual source and loopback proof. New production runtime artifacts: **none**. No
  migration, RPC, table, fixture family, state layer, provider seam, or dependency was added.
- **Deleted legacy responsibility:** removed manual setup validation and result fields, baseline and
  profile persistence, setup/running-level provenance metadata, and the profile-only snapshot gate
  when materialized Calendar provenance exists. A persisted workout still blocks empty-Calendar
  creation; protected workout behavior remains canonical.
- **Files changed:** `src/lib/manual-workout-authoring/schema.ts`, `index.ts`, `persistence.ts`,
  `actions.ts`, and `template-catalog.ts`; `src/lib/active-plan-persistence.ts`;
  `src/lib/training-api.ts`; `scripts/manual-workout-authoring/empty-plan-proof.ts` and
  `persistence-proof.ts`; and `scripts/validate-manual-workout-authoring.ts`.
- **Database lifecycle:** the focused proof used a disposable loopback QA-pool user, created the
  empty provenance and ordinary manual workout/template lifecycle through canonical actions, then
  removed task-owned rows and released the lease. The reusable auth user was preserved. No schema,
  migration history, hosted state, or arbitrary database shape changed.

| Check                                | Scenario / environment                                               | Result  | Evidence                                                                                                                                                                                                                                 |
| ------------------------------------ | -------------------------------------------------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Red discriminator                    | Source action with `{}` before implementation                        | Pass    | Returned `invalid_input` before any persistence, proving the setup schema was the first blocker.                                                                                                                                         |
| No-input source contract             | Existing manual authoring validator                                  | Pass    | `{}` creates zero-workout provenance; unexpected setup fields reject; no baseline/profile/setup metadata or provider call is present.                                                                                                    |
| Authenticated no-profile persistence | Local Supabase `http://127.0.0.1:54321`, disposable QA-pool identity | Pass    | Entry persisted with `emptyCalendarReadback: true`, `runnerProfileCreated: false`, zero initial workouts, and archived manual provenance.                                                                                                |
| Calendar readback and mutations      | Disposable loopback plus existing source contracts                   | Pass    | Authenticated snapshot returned `profile: null` and an empty Calendar; persisted Add/edit/move/clear plus long-run and personal-template lifecycles passed, and source copy/protection assertions remained green.                        |
| Atomicity and cleanup                | Same disposable loopback lifecycle                                   | Pass    | Mutation-failure atomicity passed; task-owned rows were cleaned, auth user preserved, and QA lease released.                                                                                                                             |
| Request auth                         | `scripts/validate-runner-auth-session.ts` source contract            | Pass    | Valid, missing, expired, revoked, and transient request-auth cases passed; the manual server action continues resolving the authenticated user before persistence.                                                                       |
| Provider isolation                   | Source contract and loopback receipt                                 | Pass    | Manual creation reports `callsOpenAi: false`; no provider or hosted endpoint was invoked.                                                                                                                                                |
| Focused static checks                | Task-owned Backend and proof files                                   | Pass    | Prettier, scoped ESLint, source validator, and `git diff --check` passed.                                                                                                                                                                |
| Production build                     | Local dirty checkout, repository build pipeline                      | Partial | Client, SSR, and Nitro builds passed after the behavior change. A final repeat after deleting two unused exports was terminated because three concurrent shared-workspace builds stopped progressing; final scoped source checks passed. |

Browser replay was not run because Frontend still owns the obsolete gate and form-derived payload;
there is no truthful no-input visible flow until that consumer is updated. Hosted, deployment,
release, and Global QA checks were not run and are not implied. A direct publishable-client RLS
isolation replay was also omitted because no schema, policy, grant, or client persistence path
changed; request-auth and canonical service persistence passed, but this receipt does not re-prove
database policy isolation independently. The production build's standard clean-output preflight
stopped the canonical local QA server on `127.0.0.1:3000`; it was not restarted because
runtime/browser acceptance belongs to the next Frontend phase. The final-state build repeat was
omitted after terminating only this task's stalled process tree; two unrelated concurrent builds
were left untouched. Therefore this receipt does not claim a fresh artifact after the final unused
export cleanup, although the behavior-bearing diff compiled successfully and the exact final source
passed its focused validator, Prettier, ESLint, and diff checks.

Backend Implementation DoD for this prerequisite is passed. Global QA Acceptance and release
readiness remain unclaimed. The role file was `agents/backend.agent.md`; project skills used were
`skills/hito-backend-supabase-contract/SKILL.md` and the installed Supabase procedure at
`/Users/ivan/.agents/skills/supabase/SKILL.md`. No subagent was used. Next owner is Frontend Product
to remove `isManualProfileReady` / `runnerBaseline.isReady`, the heart-rate draft write, and the
form-derived manual payload, then call the canonical action with `{}` and perform focused browser
replay. The old exported `ManualEmptyPlanSetupInput` name remains temporarily because that concurrent
Frontend consumer still imports it; its canonical schema now accepts only `{}`, and Frontend should
remove the obsolete name with the consumer gate rather than Backend adding a compatibility path.

## Product Supersession And Backend Restoration — 2026-08-11

The immediately preceding Backend receipt is historical evidence only and is **superseded**. It
implemented an incorrect no-profile manual-start premise. The existing profile-required manual
creation contract must be restored exactly at its canonical Backend seams; this is a restoration,
not a replacement design. In particular, do not retain the `{}`-only action contract, the
profile-null empty-Calendar readback, or any removal of the required baseline/heart-rate manual
setup persistence. No migration, table, RPC, provider, or new compatibility layer is authorized.

After restoration, the only remaining requested work is a Frontend Product composition change:
shared required baseline first; then the route-local method card; default generated content
unchanged; manual content explanatory only; existing profile-backed `Create plan` manual action
enabled after the shared baseline is complete. Backend is the current owner solely to restore its
task-owned mistaken diff. Frontend is the next owner after the Backend receipt.

## Backend Restoration Receipt — 2026-08-11

- **Task and stage:** completed the Tracked restoration of the superseded no-profile Backend slice.
  This receipt appends to, and does not rewrite, Product's existing canonical-item changes.
- **Restored contract:** `createEmptyManualActivePlanForUser` again requires validated age, height,
  weight, and running level; persists the runner baseline/profile; records
  `empty_manual_setup` provenance; creates zero planned workouts; and returns the existing
  profile-backed manual Calendar result. `{}` again rejects as `invalid_input`.
- **Restored paths:** `src/lib/manual-workout-authoring/schema.ts`, `index.ts`, `persistence.ts`,
  `actions.ts`, and `template-catalog.ts`; `src/lib/active-plan-persistence.ts`;
  `src/lib/training-api.ts`; `scripts/manual-workout-authoring/empty-plan-proof.ts` and
  `persistence-proof.ts`; and `scripts/validate-manual-workout-authoring.ts`.
- **Exact consolidation:** removed the superseded `{}`-only schema, no-profile baseline bypass,
  direct zero-row future-schedule persistence branch, profile-null persisted snapshot readback,
  no-profile template fallback, and their proof expectations. No compatibility path remains.
- **Preserved concurrent work:** the pre-existing archived materialized-provenance expectation in
  `empty-plan-proof.ts` remains unchanged. No Frontend, Design System, CSS, migration, generated
  type, dependency, lockfile, provider, hosted, or user-data source was changed.
- **New runtime artifacts:** **none**. No migration, RPC, table, helper, fixture family, state layer,
  provider path, or persisted shape was added.
- **Database lifecycle:** the focused proof used the existing disposable loopback QA-pool lifecycle,
  persisted the profile-backed manual setup and ordinary manual workout/template actions, then
  cleaned its owned rows and released the lease while preserving the reusable auth user.

| Check                             | Scenario / environment                                                  | Result               | Evidence                                                                                                                                                                   |
| --------------------------------- | ----------------------------------------------------------------------- | -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Supersession red discriminator    | Current source before restoration, injected non-persisting dependencies | Pass                 | `{}` succeeded while the complete profile payload returned `invalid_input`, proving the mistaken slice was active.                                                         |
| Restored source discriminator     | Exact restored action with injected non-persisting dependencies         | Pass                 | `{}` returned `invalid_input`; the complete payload succeeded with `empty_manual_setup` and echoed validated setup truth.                                                  |
| Focused source contract           | `scripts/validate-manual-workout-authoring.ts`                          | Pass                 | Required setup validation, baseline save, profile-bearing provenance, zero-workout creation, and ordinary manual protections passed.                                       |
| Profile-backed local persistence  | Loopback Supabase `http://127.0.0.1:54321`, disposable QA-pool identity | Pass                 | One runner profile and manual provenance were persisted before the first reviewed Add; the lifecycle reported one later workout and retained the expected source metadata. |
| Manual lifecycle and cleanup      | Same loopback proof                                                     | Pass                 | Add, edit, move, clear, mutation atomicity, long-run hydration, template visibility/lifecycle, owned-row cleanup, auth-user preservation, and lease release passed.        |
| Retired active-plan boundary      | `scripts/validate-active-plan-schedule-edit-preview.ts`                 | Pass                 | Calendar-authority retirement remained green; the restoration did not reintroduce an active/current plan requirement.                                                      |
| Superseded-marker search          | Restored Backend and proof seams                                        | Pass                 | No `empty_manual_calendar`, `calendar_not_empty`, profile-null readback, or no-profile proof marker remained.                                                              |
| Focused static checks             | All restored source/proof paths                                         | Pass                 | Prettier, scoped ESLint, and `git diff --check` passed.                                                                                                                    |
| Broader reviewed-plan persistence | Existing running-plan confirm loopback proof                            | Failed outside slice | The proof stopped at persisted row-count drift `55 !== 56` before its historical-preservation assertion; neither failing file is changed by this restoration.              |

The broader failure means this receipt does not newly prove the full generated-plan persistence or
historical FIT/evidence matrix. The restored manual action uses the exact pre-existing profile-backed
reviewed persistence owner, and no history/FIT/schema path was modified, but an independent local
protected-history replay remains outside this focused receipt. The full Backend suite, production
build, browser flow, hosted parity, deployment, release, and Global QA were not run; those broader
claims remain unavailable. Browser proof specifically belongs to the next Frontend Product phase.

Backend Implementation DoD for the restoration is passed. Global QA Acceptance and release
readiness remain unclaimed. The role file was `agents/backend.agent.md`; project skills used were
`skills/hito-backend-supabase-contract/SKILL.md` and the installed Supabase procedure at
`/Users/ivan/.agents/skills/supabase/SKILL.md`. No subagent was used. Per the append-only instruction,
Product's existing top-level lifecycle fields were not rewritten here. The next owner is **FRONTEND
Product** for the baseline-first method-card composition and focused Product/browser replay.

## Current Frontend Definition Of Done — 2026-08-11

This section supersedes earlier method-first, no-profile, and `{}`-payload requirements in this
historical item.

1. Existing shared profile/baseline inputs remain first and retain their current save/validation
   behavior. Height, weight, running level, and all already-required common values are not hidden,
   bypassed, or defaulted.
2. Once shared setup is valid, exactly one route-local plan-method card appears. Its existing
   enclosed tab treatment has `Create a plan` selected by default and `Build myself` as the second
   mutually exclusive tab with standard keyboard semantics.
3. `Create a plan` renders the current generated-plan content unchanged: distances, comments, and
   every existing generated-plan choice/action remain available.
4. `Build myself` renders only the factual explanation that the runner may create workouts
   independently or use a coach/friend workout. It hides generated-plan choices and enables the
   existing profile-backed `Create plan` action.
5. Invoking that existing action produces no new workouts, preserves past workout/FIT/history truth,
   and opens an empty Calendar when the runner has no previous workouts. Frontend changes neither
   its payload nor its persistence/readback contract.
6. The previous running-level slider and `running_regularly` default remain intact. No Design System
   source/API change is allowed.
7. One focused desktop and exact `375x812` replay proves generated/manual content, action
   eligibility, keyboard behavior, containment, and console health. Focused static checks and a
   production build support Implementation DoD; Global QA and release readiness remain unclaimed.

## Frontend Product Lite Correction Receipt — 2026-08-11

- **Task / mode:** baseline-first plan-method card composition; Frontend Product, Lite correction
  inside this retained item.
- **Outcome:** the existing shared runner baseline remains first. Once its existing readiness gate
  passes, `OnboardingGate` renders one route-local card with the existing enclosed Hito tabs:
  `Create a plan` is the default generated-plan view and `Build myself` is the manual view.
- **Canonical seam and removal:** reused `OnboardingGate`, `useHitoTabs`, the existing generated
  plan subtree, and the unchanged profile-backed manual caller. Removed the separate trailing
  manual-calendar row and did not leave a second method control.
- **Manual truth:** the manual panel contains the factual independent/coach-or-friend explanation,
  hides generated choices, and exposes the existing `Create plan` action only after ordinary
  baseline readiness. The caller, payload builder, heart-rate draft persistence, Backend action,
  and navigation semantics were not changed.
- **Artifacts:** no new production runtime artifact. Source/lifecycle files changed for this
  correction are `src/components/OnboardingGate.tsx` and this canonical item. The previously
  adopted slider files `QuickSetupPlanSetupSections.tsx` and `onboarding-form-model.ts` were
  inspected and preserved without a correction-owned write. Four ignored local screenshots were
  captured under `qa-artifacts/screenshots/2026-08-11/onboarding-baseline-method-card/`.

| Check                           | Scenario / environment                                               | Result | Evidence                                                                                                                                                                                                                                         |
| ------------------------------- | -------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Baseline-first gate and default | Fresh local tester on authenticated `/`                              | Pass   | Before saving age/height/weight and opening the existing BPM guidance, method-control count was `0`; after normal readiness it was `1`. The running-level slider remained value `2`, backed by the unchanged absent default `running_regularly`. |
| Source/order and single owner   | Focused `OnboardingGate` source/DOM audit                            | Pass   | DOM order was Runner baseline, Running level, Heart-rate guidance, Plan creation method, then generated content. Exactly one labelled method tablist and one active tabpanel rendered.                                                           |
| Generated/default branch        | Local production fixture, 1440x1000, resolved light theme            | Pass   | `Create a plan` was selected after load; goal distances, context, Advanced settings, preview/create surface, and generated footer remained present. No horizontal overflow.                                                                      |
| Manual and keyboard branch      | Same route; ArrowRight/ArrowLeft roving-tab replay                   | Pass   | Focus and selection moved between the two tabs. Manual selection removed generated goal content, showed the coach/friend explanation, and exposed an enabled `Create plan`; switching back restored generated content.                           |
| Exact mobile containment        | Local production fixture, 375x812, resolved dark theme               | Pass   | Card rectangle stayed within the viewport (`left 16`, `right 359`, viewport width `375`); document width was `375`, with no horizontal overflow. Generated and manual screenshots were inspected.                                                |
| Manual action truth             | Fresh local tester, ordinary profile-backed `Create plan` invocation | Pass   | Navigation reached Calendar. Local inventory read `plan_cycles: 1`, `planned_workouts: 0`, and zero workout/FIT/history/activity rows; no workout-detail link rendered.                                                                          |
| Console and page errors         | Desktop/light and 375x812/dark focused replay                        | Pass   | Browser console and page-error inventories were empty after both branch replays.                                                                                                                                                                 |
| Static and production checks    | Current shared checkout                                              | Pass   | Prettier, scoped ESLint, `git diff --check`, and the production build passed.                                                                                                                                                                    |
| Fixture cleanup                 | Disposable local identity only                                       | Pass   | The tester auth identity, local account, profile, and all owned rows were deleted; the canonical local QA server and browser session were stopped. Recreation is required to reuse that identity.                                                |

The fresh-account replay directly proves zero-workout empty-Calendar behavior. It did not seed and
replay pre-existing past workouts or FIT/history evidence, so this Lite receipt does not add an
independent protected-history acceptance claim; those persistence paths and their caller were
unchanged. Generated-plan provider execution, hosted parity, a broad browser matrix, Global QA, and
release readiness were not run or claimed.

Implementation DoD for this Frontend correction is passed. The role file was
`agents/frontend.agent.md`; project skills used were
`skills/hito-frontend-design-system/SKILL.md` and
`skills/hito-qa-browser-regression/SKILL.md`. The local agent-browser procedure supported the
focused replay. No subagent was used.

# Retire Active-Plan Calendar Authority

- **Work Item ID:** `retire-active-plan-calendar-authority`
- **Status:** `completed`
- **Type:** `source-of-truth-cleanup`
- **Priority:** `high`
- **Owner:** `backend`
- **Scope:** `retire-active-plan-calendar-authority`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Backend Implementation DoD complete; Global QA Acceptance pending`
- **Next Recommended Role:** `qa`

## Task

Remove the legacy runtime concept of an **active/current plan** and its old
apply/replacement lifecycle. A plan is a saved, user-visible provenance record
and library entry; calendar workouts are the runner-owned truth immediately
after they are materialized. A user may later start a saved plan, but that is a
new runner-calendar materialization action, not restoration of an active-plan
authority.

Every generated AI plan remains saved. User removal hides it from the library;
the record is retained for later backend retention work, which is out of scope.

## User Report / Product Decision

The old `active` plan status and "current plan" replacement flow are legacy
state. They make calendar operations appear dependent on a plan even though
the user expects each workout to behave like one created manually. Reuse useful
calendar and saved-plan code, but delete the obsolete authority and do not add
compatibility layers around it.

## Evidence and Demonstrated Cause

The saved-plan library slice is complete in
[`2026-08-10-saved-plan-library-and-future-apply.md`](./2026-08-10-saved-plan-library-and-future-apply.md),
but its focused proof found no active record only for the new path. Runtime
source still makes `plan_cycles.status = 'active'` authoritative:

- [`src/lib/active-plan-persistence.ts`](../../../src/lib/active-plan-persistence.ts)
  exposes `getActivePlan` and old plan-gated lifecycle context;
- [`src/lib/active-plan-lifecycle-actions.ts`](../../../src/lib/active-plan-lifecycle-actions.ts)
  clears a schedule through the current active plan;
- [`src/lib/active-plan-workout-editing/source-capabilities.ts`](../../../src/lib/active-plan-workout-editing/source-capabilities.ts)
  rejects otherwise valid workout actions when no active plan exists;
- [`src/lib/active-plan-schedule-edit-preview.ts`](../../../src/lib/active-plan-schedule-edit-preview.ts)
  and its database function implement active-plan schedule reflow;
- [`src/lib/training-api.ts`](../../../src/lib/training-api.ts) exports those
  legacy operations; validators and fixtures still require exactly one active
  plan.

The first incorrect owner is Backend: persisted/runtime authority and database
mutation policy. Frontend consumers are separate follow-up work; do not change
them in this slice.

## Outcome and Boundaries

After this work:

1. No runtime read, mutation, database function, policy, validator, or fixture
   treats `status = 'active'` as calendar authority or requires an active plan
   for calendar, copy/paste, move, clear-future, manual authoring, or saved-plan
   start.
2. Existing `active` rows are migrated in place to archived provenance without
   changing `planned_workouts`, their IDs, past workout logs, FIT assets, or
   history evidence. `plan_cycle_id` may remain only as provenance.
3. The legacy active-plan apply/replacement and schedule-reflow paths are
   removed, not wrapped or retained as a fallback. Historical migration files
   remain immutable history; current schema/functions must no longer expose the
   authority.
4. The saved-plan library payload, logical removal, selected export, and its
   existing archived records remain intact. Starting a saved record materializes
   independent future calendar workouts using runner-local preferences; it must
   not make the record active or mutate it. The later Product UI confirmation
   for replacing future workouts is not implemented here.

## Reuse-First Budget

Reuse runner-owned calendar reads/mutations, runner calendar context, existing
atomic persistence seams, and the saved-plan record already stored on
`plan_cycles`. Prefer deletion and consolidation in those owners. **Expected
new production runtime artifacts: none.** One current-schema migration is
allowed only to migrate live active rows and retire/replace current database
functions or indexes; do not add a table, second RPC, compatibility mode,
parallel state, generic helper, or new fixture framework.

If an existing seam cannot express the runner-wide operation, demonstrate that
constraint before adding anything. Do not redesign scheduling, call OpenAI or
providers, or invent merge/reflow behavior.

## Required Backend Proof

Run a local upgrade/replay with a pre-existing active provenance record and
materialized workouts, including protected past FIT/log evidence. Prove:

- zero active runtime records after upgrade;
- original workout, log, and asset identities and calendar rows are unchanged;
- calendar copy/paste and applicable manual operations are runner/workout based,
  not plan-status gated;
- generated saved plans remain archived library entries and starting one does
  not create active-plan authority;
- the old active-plan database/function/export surface is absent; and
- the full local Backend database suite is green, including the formerly stale
  active-plan assertion, with no weakened count or skipped check.

Run focused static checks and a production build. Browser, hosted Supabase,
providers, deployment, release parity, and Global QA are out of scope. Report
any frontend consumers left for the next owner; do not edit them.

## Backend Stop Receipt — 2026-08-10

- The mandatory Tracked preflight and reuse-first budget were published before any implementation
  write. No production source, migration, schema, fixture definition, or Frontend file was changed.
- The red local replay is confirmed: the canonical design-profile seed fails when its readback
  requires one `status = 'active'` plan. Live local schema still exposes the active-plan unique
  index plus active schedule-reflow, workout mutation/content-edit, and reviewed replacement
  functions.
- Deleting the required Backend export surface while preserving Frontend byte-for-byte cannot keep
  the required production build green. `AppShell` reaches `PlanManagementDialog` and
  `ActivePlanCreatePlanDialog`; those consumers import the schedule-reflow, clear-schedule, and
  active-plan-transition runtime exports and types that this item requires Backend to delete.
  `UploadJsonDialog` separately imports the legacy onboarding apply export.
- Retaining stubs, no-op actions, or compatibility wrappers would violate the explicit deletion and
  no-compatibility contract. Removing the Frontend consumers is outside BACKEND ownership. Product
  must authorize and sequence a bounded Frontend Product removal/replacement slice before Backend
  can delete the source surface and truthfully pass `npm run build`.
- The attempted standard design-profile seed created no runner-owned rows and left no QA lease or
  cleanup candidate. No incremental migration was created or applied; the local schema remains at
  its pre-task state.
- One bounded read-only dependency reviewer independently confirmed the same compiled-consumer
  boundary and made no source, fixture, or database mutations.

Implementation DoD: **not passed**. Global QA Acceptance: **Pending**.

## Product Resolution — 2026-08-10

The cross-owner boundary is accepted. Do not preserve the legacy active-plan
surface through stubs. First remove its reachable Frontend consumers, then
return the same item to Backend for final authority deletion and schema upgrade.

This Frontend slice removes the authenticated **Current Plan** menu, its
active-plan transition/review dialog, schedule-reflow/clear-schedule dialog,
legacy JSON-import entry point, and active-plan-bound export entry point. It
does not build the saved-plan library UI yet. The existing onboarding flow that
creates a first plan is not part of this removal; do not alter it. The temporary
absence of post-onboarding plan creation/import/export is intentional while the
saved-plan library UI is built separately against its already-completed Backend
contract.

The required outcome is a green production graph with no reachable Frontend
import of the legacy Backend exports. No Frontend persistence, schedule policy,
AI behavior, or backend contract is to be invented or changed.

## Frontend Execution Preflight — 2026-08-10

- **Existing seams reused:** the authenticated `AppShell` desktop header menu, mobile navigation
  Sheet, profile menu composition, and its existing dialog mounts. The smallest change is deletion
  of the Current Plan/import/export branches while leaving ordinary Calendar, Progress, Settings,
  Connections, authentication, theme, Local Inspector, timezone bootstrap, and first-plan
  onboarding composition in place.
- **Expected new production runtime artifacts:** `none`.
- **Obsolete AppShell state/responsibility to remove:** upload/create/management dialog state;
  active-plan return-focus refs and deferred-open timer; active-plan export status, iframe, reset
  timer, and handlers; Current Plan desktop and mobile triggers; legacy profile Import trigger; and
  the active-plan copy in the shell note/onboarding profile detail.
- **Exclusive files to remove:** `PlanManagementDialog.tsx`, `UploadJsonDialog.tsx`,
  `ActivePlanCreatePlanDialog.tsx`, `ActivePlanTransitionReviewDialog.tsx`,
  `active-plan-create-plan-model.ts`, `PlanLifecycleControls.tsx`,
  `PlanScheduleEditPanel.tsx`, `PlanSummaryHeader.tsx`, and `plan-export-download.ts`. Read-only
  incoming-import searches found no consumers outside the AppShell-owned tree.
- **Preserved concurrent work:** the existing runner-calendar-timezone imports, fallback preference,
  and bootstrap render in the already-dirty `AppShell`; all Backend, migration, Calendar,
  copy/paste, Settings, auth, Design System, and DevTools work remains untouched.
- **Focused proof:** exact legacy Frontend import/call search before and after deletion; orphan and
  AppShell Current Plan text/state search; focused Prettier, ESLint, and `git diff --check`; then a
  production build as the compiled consumer proof. Browser replay is omitted unless the source and
  production graph leave a material visibility ambiguity.

## Frontend Completion Receipt — 2026-08-10

Frontend Product removed the first incorrect reachable consumer owner without adding a replacement
flow or compatibility surface. `AppShell` no longer renders an authenticated Current Plan desktop
menu, mobile Sheet, profile Import action, active-plan export iframe, or any lifecycle dialog mount.
Preview authentication remains a direct desktop/mobile login link; initial onboarding remains owned
by its existing route components.

The exclusive deletion cluster was removed rather than retained as dead wrappers:

- `PlanManagementDialog.tsx` with `PlanLifecycleControls.tsx`, `PlanScheduleEditPanel.tsx`, and
  `PlanSummaryHeader.tsx`;
- `ActivePlanCreatePlanDialog.tsx` with `ActivePlanTransitionReviewDialog.tsx` and
  `active-plan-create-plan-model.ts`;
- `UploadJsonDialog.tsx`; and
- `plan-export-download.ts`.

| Check                         | Scenario / environment                                     | Result | Evidence                                                                                                                                                |
| ----------------------------- | ---------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AppShell authority removal    | Authenticated desktop/mobile render graph                  | Passed | No Current Plan trigger, Sheet, import/export, create-transition, schedule-reflow, or clear-upcoming state/action/mount remains                         |
| Legacy Frontend consumer map  | `src/components` and `src/routes` exact import/call search | Passed | Zero references to clear/reflow preview/apply, active-plan transition review/confirm, or legacy `completeOnboarding` apply                              |
| Exclusive-module reachability | Deleted module/path/name search                            | Passed | Zero incoming or orphan references remain after deletion                                                                                                |
| Preserved product seams       | Source review plus production compilation                  | Passed | Calendar, Progress, Settings, Connections, auth/sign-in, first-plan onboarding, timezone bootstrap, theme, and Local Inspector imports/rendering remain |
| Focused static checks         | Task-owned AppShell and deletion cluster                   | Passed | Prettier, focused ESLint, and `git diff --check` clean                                                                                                  |
| Compiled consumer proof       | `npm run build`                                            | Passed | Client, SSR, Nitro, and postbuild completed with exit 0                                                                                                 |
| Durable cleanup record        | Canonical item plus technical log                          | Passed | Preflight, deletion boundary, proof, omissions, and Backend resume gate recorded                                                                        |

Omitted checks and consequences:

- No browser replay or responsive matrix was run. The removed UI has no remaining render branch or
  import, and the production graph compiled; this receipt does not add screenshot-level visual
  evidence for the reduced authenticated shell.
- No Backend validator, local database replay, migration, schema, persistence, auth/RLS, hosted,
  provider, deployment, staging, commit, push, or release check was run. Backend remains responsible
  for deleting the source authority and proving the database/runtime upgrade.
- Global QA Acceptance was not run or claimed and remains Pending.

Frontend Product Implementation DoD for the consumer-retirement slice is complete with no blocker.
The item remains `in_progress` and returns to Backend. No subagent was used.

## Completed Backend Resume Handoff (Historical, Not Executable)

```text
ROLE: BACKEND

Mode: Tracked

Read AGENTS.md, agents/backend.agent.md, skills/hito-backend-supabase-contract/SKILL.md, and this canonical item completely before writing:
docs/tasks/backlog/2026-08-10-retire-active-plan-calendar-authority.md

Task: Remove the legacy runtime "active/current plan" authority and old active-plan apply/replacement lifecycle. This is deletion and consolidation, not a new plans feature.

Product decision:
- Every AI-generated plan is already a saved library/provenance record. User removal only hides it; retention cleanup is out of scope.
- Materialized calendar workouts are runner-owned truth immediately and must behave like manually created workouts.
- A later user-facing Start action may materialize a selected saved plan into future runner-calendar workouts. That is not legacy active-plan apply: it never makes a plan active, never makes calendar actions depend on plan status, and never mutates the saved record.
- Preserve plan_cycle_id only as provenance where it already exists. Do not clone, relink, delete, or alter past workouts, FIT assets, logs, metrics, comparisons, or history evidence.

Demonstrated source cause to remove: active-plan-persistence.ts getActivePlan and plan-gated lifecycle context; active-plan-lifecycle-actions.ts; active-plan-workout-editing/source-capabilities.ts; active-plan-schedule-edit-preview.ts and its active schedule-reflow database function; training-api.ts exports; and validators/fixtures that require exactly one active plan. The first incorrect owner is Backend. Frontend consumers are explicitly outside this slice.

Reuse-first budget:
- Reuse runner-owned calendar reads/mutations, runner calendar context, current atomic persistence seams, and the saved-plan record on plan_cycles.
- Expected new production runtime artifacts: none.
- A single current-schema migration is allowed only to migrate active rows in place and retire/replace current legacy functions/indexes. Do not add a table, second RPC, compatibility mode, new state layer, helper framework, validator framework, or fixture framework.
- Delete obsolete Backend code/exports/functions rather than wrapping them. Historical migration files are immutable history; do not edit/delete them.

Required result:
1. No current runtime/schema function/policy/validator/fixture treats status='active' as calendar authority or requires an active plan for calendar, copy/paste, move, clear future, manual authoring, or saved-plan start.
2. Upgrade existing active provenance rows to archived in place without changing planned_workouts, workout IDs, logs, FIT assets, or history evidence.
3. Delete legacy active-plan apply/replacement and schedule-reflow paths. Do not redesign scheduling or add merge/reflow behavior.
4. Keep saved-plan payload, logical removal, selected private export, and archived library records intact. Starting a saved plan uses runner-local preferences/calendar truth and creates no active authority.
5. Update only task-owned Backend validators/fixtures to reflect deleted authority; make the full local Backend DB suite green without weakening assertions or skipping the former active-plan check.

Before the first task-owned write, record the existing seam reused, new runtime artifacts (expected: none), what obsolete authority will be removed, and the focused proof. Preserve all unrelated dirty work byte-for-byte, including the completed saved-plan library and calendar-independence work.

Proof: perform an incremental local upgrade replay from an existing active record with materialized workouts and protected past FIT/log evidence. Demonstrate zero active runtime records, unchanged identities/rows, runner-owned copy/paste/manual capability, saved-plan materialization without active status, absence of old function/export surface, full local Backend DB suite green, focused static checks, and production build. Do not run hosted, paid-provider, deployment, or release actions. Browser and Global QA are not part of this Backend slice.

Use a subagent only if a bounded independent review materially saves time or confidence; do not create subagent ceremony. Do not change Frontend files. If a required outcome needs a new product decision rather than deletion/consolidation, stop with the exact evidence and boundary.

Update this item truthfully with a compact receipt. Return Implementation DoD separately from Global QA Acceptance; do not stage, commit, push, or deploy.
```

## Completed Frontend Handoff (Historical, Not Executable)

```text
ROLE: FRONTEND

Lane: Product
Mode: Tracked

Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, and this canonical item completely before writing:
docs/tasks/backlog/2026-08-10-retire-active-plan-calendar-authority.md

Task: Retire every reachable authenticated Frontend consumer of the legacy active/current-plan lifecycle so Backend can delete its authority with no compatibility shim and a green production build.

Product decision:
- A plan is a saved library/provenance record. Materialized calendar workouts are independent runner-owned truth.
- Remove the legacy Current Plan experience: active-plan replacement/create transition, schedule reflow, clear-upcoming-by-active-plan, JSON import through legacy onboarding apply, and export tied to the active plan.
- Do not build the saved-plan library UI in this task. Its Backend payload/list/search/sort/logical-removal/export contract already exists and will receive a separate UI task.
- Preserve the existing first-plan onboarding flow. The temporary absence of post-onboarding create/import/export actions is intentional; do not replace them with a new local flow, placeholder, compatibility wrapper, or disabled control.

Demonstrated cause: AppShell reaches PlanManagementDialog and ActivePlanCreatePlanDialog, which import the Backend lifecycle/reflow/transition exports scheduled for deletion. UploadJsonDialog imports the legacy onboarding apply. Those reachable imports make Backend-only deletion incompatible with a green production build. The first incorrect consumer owner is Frontend Product; Backend remains the owner of the source authority and will resume after this slice.

Inspect and reuse the existing AppShell menu/sheet composition and ordinary deletion paths. Expected new production runtime artifacts: none. Remove obsolete state, imports, triggers, dialogs, types, helpers, and files when they have no remaining consumers. Do not modify Backend files, migrations, persistence, auth, schedule policy, AI/provider flows, Design System primitives, or the Local Inspector. Do not create a new saved-plan page, route, dialog, store, API adapter, or feature flag.

Definition of Done:
1. The authenticated AppShell has no Current Plan menu/sheet branch or action bound to snapshot.planMeta/current active plan.
2. No reachable Frontend file imports or calls the legacy active-plan transition, lifecycle, schedule-reflow, or onboarding-apply exports listed in the canonical item.
3. Delete exclusive active-plan UI modules rather than retaining dead wrappers; preserve initial onboarding and unrelated Calendar, copy/paste, Settings, authentication, and shell navigation behavior.
4. The compiled consumer map and production build are green before Backend resumes.

Before the first task-owned write, record the exact existing UI seams, new runtime artifacts (expected: none), obsolete files/state to remove, and focused proof. Preserve all unrelated dirty work byte-for-byte, including Backend saved-plan and calendar work.

Validate source imports/reachability, focused lint/format/diff checks, and a production build. Use a local browser only if it materially proves the removed authenticated menu without blocking on a browser tool; no broad matrix or Global QA claim. A bounded independent review is optional only if it prevents real rediscovery. Update the canonical item with a compact truthful receipt, set next owner to Backend on success, and do not stage, commit, push, or deploy.
```

## Backend Completion Receipt — 2026-08-10

The Backend slice removed the legacy runtime authority rather than preserving it through a wrapper.
Runner Calendar reads and reviewed mutations now use runner-wide workout truth plus immutable
`plan_cycle_id` provenance. Saved-plan Start remains runner-local and future-only, and every newly
materialized provenance row is archived.

- **Reuse-first result:** existing runner-wide Calendar reads, advisory-lock mutation transactions,
  runner calendar context, saved-plan payload, and reviewed persistence were reused. New production
  runtime artifacts: `none`.
- **Current-schema change:**
  `20260810132840_retire_active_plan_calendar_authority.sql` migrated existing active rows to
  archived, changed the default to archived, dropped the one-active index and schedule-reflow
  function, renamed the canonical Calendar workout functions, and replaced reviewed initial/future
  materialization without active authority. No table or second store was added; historical
  migrations were not changed.
- **Deleted Backend authority:** active lifecycle actions, active transition/replacement and
  carry-forward owners, active schedule-edit contract/preview, the old import/replacement action,
  and the manual transition fixture. `training-api.ts` no longer exports clear/reflow lifecycle
  operations; selected saved-record export is the only plan export.
- **Incremental upgrade discriminator:** a disposable active row with two workouts, one protected
  log, FIT asset, actual metrics, and comparison upgraded to archived with exact identity hashes
  unchanged (`26b3020d5e3ab569ef2baa2ad5af4fa8`,
  `1d85999111c8e728eb259d39033d1bd4`,
  `42ed36c24ec093de297c047c381eda58`,
  `6a88001bb7908c84bbcfb0543435e268`,
  `18cda525126d0ad8f4b2d53f91fd2cdc`,
  `5d4a0be8f96a35a57fc5c7b74753b61a`). The seven disposable proof rows were then deleted by exact
  ID; final count is zero.
- **Fixture reconciliation:** the canonical historical design profile retains the successful AI
  candidate first, then materializes the already-reviewed canonical plan through the existing
  initial-materialization seam. This preserves 55 Calendar rows, 30 activities, 11 truthful
  matches, provider isolation, and zero active authority while Product Start remains future-only.

| Check                    | Scenario / environment                                                       | Result | Evidence                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Incremental upgrade      | Existing active provenance with protected workout/log/FIT/metrics/comparison | Passed | Status became archived; all six identity hashes and both workout IDs stayed unchanged                                                            |
| Current schema           | Local Supabase after migration                                               | Passed | `active_plan_rows=0`; default archived; no active index or `apply_active_plan_*` function; four canonical Calendar/reviewed functions remain     |
| Former active-plan check | Focused source/schema retirement validator                                   | Passed | Deleted files absent; old exports/functions absent; Calendar capabilities do not inspect plan status                                             |
| Saved-plan behavior      | Authenticated disposable persistence/RLS                                     | Passed | Candidate retention, logical removal, private selected export, immutable record, empty/replace future apply, protected history, zero active rows |
| Calendar mutations       | Authenticated manual persistence                                             | Passed | Runner-owned copy/move/edit/clear, Rest/evidence protection, atomic failure rollback, cleanup convergence                                        |
| Design profile           | Loopback local DB read model                                                 | Passed | 55 workouts, 30 activities, 11 matched, `activeAuthorityCount=0`, provider calls 0                                                               |
| Full Backend DB suite    | `npm run validate:backend:local-db`                                          | Passed | 19/19 including 3000-activity scale and the former active-plan assertion                                                                         |
| Final source suite       | `npm run validate:backend`                                                   | Passed | 15/15                                                                                                                                            |
| Static checks            | Task-owned Backend/source validator set                                      | Passed | Prettier, ESLint, and `git diff --check` clean                                                                                                   |
| Production build         | Fresh client, SSR, Nitro, postbuild                                          | Passed | `npm run build` exit 0                                                                                                                           |
| Build integrity          | Fresh local artifact                                                         | Passed | 207 server modules, 2976 relative imports, repository digest present                                                                             |

`supabase db lint --local --level warning` completed with four `warning extra` notices for legacy
arguments retained on the two canonical Calendar RPC signatures; no schema error was reported. The
arguments are not consulted for plan status or mutation authority. Removing them would require a
second signature migration and is intentionally outside this single-migration deletion slice.

Omitted checks: browser/runtime route replay, hosted Supabase/deployment parity, paid providers,
release actions, staging, commit, push, and deployment were not run. They provide no additional
Backend source/persistence coverage for this owner slice; hosted/release parity and Global QA remain
unproven. No new subagent was used during the resumed implementation; the earlier bounded read-only
dependency review was integrated, and its Frontend blocker was resolved by the completed Frontend
receipt above.

Backend Implementation DoD: **Passed**. Global QA Acceptance: **Pending**.

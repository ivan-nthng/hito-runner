# Saved Plan Library UI And Start

- **Work Item ID:** `saved-plan-library-ui-and-start`
- **Status:** `completed`
- **Type:** `frontend-product-integration`
- **Priority:** `high`
- **Owner:** `frontend`
- **Scope:** `Progress Plans tab, saved-plan table, selected-record download/hide/Start interaction`
- **Archive Intent:** `retain_in_place`
- **Stage:** `Frontend Product implementation and focused local proof complete`
- **Next Recommended Role:** `product`

## Task

Expose the already-persisted runner saved-plan library in Progress and let a runner download, hide,
or Start a selected record. This is a presentation and interaction slice over the completed Backend
contract; it must not reintroduce a current plan or give a plan authority over Calendar workouts.

## Product Decision

- Every successful AI plan is an immutable runner library record, whether or not it is ever started.
  It is provenance and a user-facing record, never Calendar authority.
- Progress receives a Plans area alongside its existing History and Progress views. It displays the
  factual saved-plan summary: name, created date, non-Rest workout count, and only other fields
  already returned by the canonical record summary.
- The library has only simple controls: search by plan name; sort by newest/oldest, name, or workout
  count; and the existing record-state visibility when useful. There is no search service, saved UI
  preference, filter framework, pagination system, plan editor, or new client truth store.
- A row can download its selected private export and hide it from the ordinary library. Hide affects
  only the library record's visible state; it never changes Calendar workouts or history.
- Start uses the runner's saved schedule preferences and runner-local date by default. The existing
  Backend alignment may select the first compatible future start and omit leading source days; the
  UI must show the factual receipt after success, not invent a scheduling explanation.
- When future workouts exist, the runner must explicitly choose `Replace future workouts` before
  any Calendar mutation. Declining leaves the future Calendar untouched. Past, logged, FIT-backed,
  completed, skipped, and other protected workout truth is never presented as replaceable.
- Starting a saved plan never edits the saved record. Materialized future workouts remain ordinary,
  independently editable Calendar truth.

## Evidence

- [`listSavedPlanLibrary`, `removeSavedPlanRecord`, and `startSavedPlanRecord`](../../../src/lib/active-plan-export-actions.ts)
  are authenticated, existing frontend-callable seams. Start returns either a factual
  `replacement_required` readback or a completed materialization receipt.
- [`applySavedPlanRecordForUser`](../../../src/lib/active-plan-persistence.ts) keeps the selected
  record immutable, applies only future Calendar truth, and preserves protected history.
- [`/progress`](../../../src/routes/progress.tsx) currently exposes only `history` and `progress`;
  it has no Plans area. [`RunnerActivityProgressExperience`](../../../src/components/progress/RunnerActivityProgressExperience.tsx)
  is its route-local presentation owner.
- The existing shared data-table presentation is already used by the Hito DS specimen through
  [`AdminOperationalComponents`](../../../src/components/admin/AdminOperationalComponents.tsx).
  Reuse its data-table mode and existing Hito controls where they fit; do not rebuild a table system.
- The completed Backend contracts are [saved-plan library](./2026-08-10-saved-plan-library-and-future-apply.md)
  and [schedule-aligned Start](./2026-08-10-saved-plan-start-schedule-alignment.md).

## Observed Behavior

The backend retains, lists, hides, exports, and starts selected records, but authenticated Progress
has no way to browse or act on that library. The route's two-tab view offers no truthful user
surface for the saved records.

## Expected Behavior

1. An authenticated runner can open Progress > Plans and see only factual saved-plan summaries in
   the existing responsive Hito table presentation, including a clear empty state.
2. Simple name search and the four product-decided sort orders change the visible existing records
   without new storage, infrastructure, or a second data source.
3. A selected record downloads through the existing private export path and can be hidden through
   the existing logical-removal action; a hide confirmation uses an existing dialog pattern if one
   is already suitable.
4. Start first uses the existing default runner-local alignment. If the Backend reports that future
   workouts require replacement, the UI asks the explicit replacement question and only the positive
   choice calls the existing replacement intent. It then displays the factual Start receipt,
   including resolved start and any omitted leading days where returned.
5. The view never labels a plan as active/current, never tries to edit a saved payload, and never
   adds a browser-side scheduler, preferences, AI call, or Calendar truth.

## Source Investigation

The visible missing surface is owned by the Frontend Product Progress route. The saved-record
server actions and schedule policy are already complete and are the only permitted data/mutation
seams. The shared data-table presentation exists; creating a Plans-specific table component or
client store before inspecting it would duplicate an existing owner.

## Reuse-First Budget

- Reuse the Progress route/experience, current Hito tabs, Hito data-table presentation, existing
  Button/Dialog/menu/empty-state patterns, `listSavedPlanLibrary`, `removeSavedPlanRecord`,
  `startSavedPlanRecord`, and the selected private export route.
- Expected new production runtime artifacts: **none unless a route-local Plans panel is genuinely
  needed as the smallest owner of the third tab**. No new shared primitive, persistence, API/RPC,
  backend module, migration, store, query framework, scheduler, or compatibility layer is allowed.
- Remove or simplify an obsolete Progress/plan UI branch only when it is demonstrably superseded;
  otherwise leave unrelated UI intact.

## What Not To Touch

- Backend persistence, saved-record schema/RLS, Start policy, runner Settings, provider/OpenAI
  boundaries, Calendar mutation/ownership, manual workout editing, history/FIT/evidence protection,
  or active-plan retirement contracts.
- Design System primitives, canonical DS CSS, Figma mappings, marketing, DevTools, hosted systems,
  dependencies, lockfiles, unrelated dirty work, staging, commits, pushes, or deployment.

## Validation Expectations

- Establish the existing Progress/data-table/server-action seams before writing. If a required
  action response is insufficient for the UI, stop at that Backend boundary rather than inventing
  browser truth.
- Use a safe local authenticated browser path to prove list/empty states, name search, each sort,
  private export trigger, logical hide, empty-future Start, explicit future-replacement confirmation,
  cancellation/no-op, receipt rendering, normal Progress tabs, and exact 375px containment.
- Use disposable local data only through an existing lifecycle and clean it up. Do not use hosted
  data, a provider, OpenAI, or hand-shaped database rows.
- Run focused static checks and a production build. State omitted checks and keep Global QA
  Acceptance separate.

## Execution Preflight — 2026-08-10

- **Existing seams:** extend the existing `/progress` search-param tabs and
  `RunnerActivityProgressExperience`; reuse the shared data-table toolbar, headers, cells, and
  scroll container; reuse the existing Hito Button, metadata tag, dropdown menu, product-dialog,
  empty/error/state-surface patterns; call only `listSavedPlanLibrary`,
  `removeSavedPlanRecord`, `startSavedPlanRecord`, and the selected private export route.
- **Smallest behavior change:** add a third `plans` tab whose route-local panel renders only the
  returned saved-record summaries, derives name search and the decided factual sorts from those
  summaries, and branches only on the Backend `replacement_required`, `not_applied`, or `applied`
  result.
- **New production runtime artifacts:** one route-local
  `src/components/progress/SavedPlanLibraryPanel.tsx`. This is the smallest owner for the new
  list/search/sort, selected-record actions, confirmations, refresh, and Start receipt; none of
  those responsibilities belongs in a shared primitive or in the existing activity panels.
- **Obsolete code/state:** none is superseded. Existing History and Progress state, loaders,
  actions, and panels remain unchanged; no current/active-plan branch, client scheduler, payload
  copy, store, compatibility wrapper, API/RPC, persistence, or Design System artifact is added.
- **Focused proof:** source reachability and exact action-result review; focused format/lint/diff
  checks; production build; authenticated managed-loopback browser proof for available/empty list,
  plan-name search, newest/oldest/name/workout-count sorts, private download trigger, logical hide,
  empty-future Start, replacement-required cancellation/no-op and positive confirmation, factual
  receipt, existing History/Progress tabs, and exact 375px page containment.
- **Stop boundary:** stop only if the existing Backend summary/result is insufficient or if the
  required behavior reaches persistence, scheduling policy, protected-history policy, auth,
  Calendar ownership, or a shared Design System contract. Global QA Acceptance remains separate.

## Browser Path Preflight — 2026-08-10

- **Validation authority:** focused Frontend Implementation DoD only; this is not Global QA
  Acceptance or release validation.
- **Runtime:** use the managed loopback server at `http://127.0.0.1:3000/`. The production build is
  current and the server is stopped after its clean-build lifecycle, so start exactly one managed
  runtime and require its current-source freshness/health receipt before navigation.
- **Browser path:** use the supported in-app browser selected for the loopback URL. If that path
  fails, switch to another supported non-prompting local browser surface; do not wait on or expose a
  platform permission dialog.
- **Authentication/data:** use the canonical loopback `baseline-no-plan` disposable QA pool identity
  and its existing authenticated local-login lifecycle. Reset that identity, save its ordinary
  runner baseline through the existing settings owner, retain one candidate through the existing
  reviewed local QA plan-preview lifecycle with provider dispatch disabled, lease it for the
  browser replay, and release plus fully reset it after evidence capture. This gives the empty
  future Calendar discriminator without deleting rows by hand. No hosted data, paid provider,
  hand-shaped database row, or production identity is permitted.
- **Matrix:** desktop proves list, name search, all four sort choices, selected private download,
  empty-future Start receipt, replacement-required cancel/no-op, positive future replacement,
  logical hide, hidden/empty visibility, and unchanged History/Progress tabs. Exact 375px proves
  page-level containment with the table overflow owned only by its scroll container.
- **Artifacts:** capture only UI-facing screenshots under
  `qa-artifacts/screenshots/2026-08-10/saved-plan-library-ui-and-start/`; record DOM/action receipts
  compactly in this canonical item and do not retain credentials or raw private payloads.

## Completed Frontend Handoff (Historical, Not Executable)

```text
ROLE: FRONTEND

Lane: Product
Mode: Tracked

Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, and this
canonical item before writing:
docs/tasks/backlog/2026-08-10-saved-plan-library-ui-and-start.md

Task: Implement the authenticated Progress Plans library and selected-record actions over the
completed saved-plan Backend contract. The outcome is one small factual runner view: browse saved
plans, search by name, use the decided sorts, download or hide a record, and Start a selected plan
with the existing future-replacement confirmation and factual receipt.

Product contract:
- A saved plan is immutable provenance, never an active/current Calendar owner. Workouts created by
  Start are independent Calendar truth and remain normally editable.
- Start defaults to saved runner preferences and runner-local date. Existing Backend policy aligns
  the first compatible future date and may omit leading source days. Do not recreate scheduling
  logic in the browser.
- If future workouts exist, only a positive explicit `Replace future workouts` confirmation may
  call the existing replacement intent. Cancel/decline leaves the Calendar untouched. Do not offer
  past, logged, FIT-backed, completed, skipped, or otherwise protected truth for replacement.
- Library controls are deliberately small: plan-name search and sort by newest/oldest, name, or
  workout count. Use existing record-state visibility only where it improves the factual library;
  do not add saved filters, query infrastructure, pagination, a plan editor, or new client state.

Evidence and existing seams:
- src/routes/progress.tsx and
  src/components/progress/RunnerActivityProgressExperience.tsx own the Progress surface, which
  currently has only History and Progress tabs.
- src/lib/active-plan-export-actions.ts already exposes listSavedPlanLibrary,
  removeSavedPlanRecord, and startSavedPlanRecord. Their returned data/errors are the source of
  truth; inspect them before rendering or branching.
- src/routes/api.plan.export.tsx is the selected private download seam.
- src/components/admin/AdminOperationalComponents.tsx already supplies the Hito data-table
  presentation used by the DS reference. Reuse it in its data-table form if it fits after direct
  inspection, together with existing Hito Buttons, dialogs, menus, tabs, and state surfaces.
- Completed backend contracts: docs/tasks/backlog/2026-08-10-saved-plan-library-and-future-apply.md
  and docs/tasks/backlog/2026-08-10-saved-plan-start-schedule-alignment.md.

Reuse-first boundary:
- Start by finding the existing route-local panel, table, dialog, menu, and action-call patterns.
  Expected new runtime artifacts: none, unless one route-local Plans panel is the smallest actual
  third-tab owner.
- Do not create a shared primitive, a Plans-specific table system, store, hook framework, API/RPC,
  backend code, migration, scheduler, compatibility path, or local copy of a plan payload.
- Do not modify backend persistence/policy, Calendar/manual-workout source, settings, DS canonical
  source, Figma, providers, auth, or unrelated dirty work.

Definition of Done:
1. Progress exposes a responsive Plans area with factual summaries, clear empty state, simple
   name search and the decided sorts, while preserving the existing History and Progress behavior.
2. Download, hide, Start, replacement-required confirmation, cancellation/no-op, successful Start
   receipt, and post-action refresh use only the existing backend-shaped seams.
3. No UI calls a record active/current, invents schedule truth, changes Settings, or makes an AI or
   provider call. The UI clearly preserves protected history.
4. Focused browser proof covers the action flow and exact 375px with no horizontal overflow, then
   focused static checks and a production build pass. Report Implementation DoD separately from
   Global QA Acceptance, which remains unclaimed.

Use a bounded read-only QA/browser subagent only if it materially reduces risk without conflicting
with other active work; do not create subagent ceremony. Keep commentary visible to Ivan in Russian.
Write the canonical item update, final formal receipt, and validation table in English. Do not
stage, commit, push, deploy, touch hosted data, or call paid providers.
```

## Frontend Completion Receipt — 2026-08-10

Frontend Product added the missing authenticated Progress consumer without adding a second plan or
Calendar truth. The existing Progress experience now exposes a third `Plans` tab whose one
route-local panel renders only saved-record summaries returned by the completed Backend contract.
It provides plan-name search, newest/oldest/name/workout-count sorts, useful record-state
visibility, selected private JSON download, logical hide, and Backend-shaped Start/Replace
interactions and receipts. History and Progress keep their existing lazy data paths.

The first incorrect owner was the Frontend Product Progress route, which had no reachable saved-plan
library consumer despite completed server actions. Browser replay also found that `createdAt` is an
ISO timestamp while the existing display formatter accepts a date-only value; the route-local row
now passes only its returned calendar-date prefix, so the factual created date renders instead of
`Invalid Date`.

- **Reused seams:** `/progress` search-param tabs, `RunnerActivityProgressExperience`, shared Hito
  table toolbar/headers/scroll container, existing Button/Dialog/dropdown/metadata/state patterns,
  `listSavedPlanLibrary`, `removeSavedPlanRecord`, `startSavedPlanRecord`, and the selected private
  export route.
- **New production runtime artifacts:** one route-local
  `src/components/progress/SavedPlanLibraryPanel.tsx`; no shared primitive, store, hook framework,
  API/RPC, scheduler, payload copy, persistence path, compatibility layer, or feature flag was
  added.
- **Obsolete code/state:** none. Existing History/Progress state and panels remain active; no
  active/current-plan branch was restored.
- **Preserved boundaries:** Backend persistence, Start alignment/replacement and protected-history
  policy, Calendar/manual-workout source, Settings, auth, providers/AI, Design System canonical
  source, DevTools, hosted state, and unrelated dirty work were not changed.

| Check                       | Scenario / environment                        | Result | Evidence                                                                                                                                                                                          |
| --------------------------- | --------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Progress consumer map       | Authenticated `/progress?tab=plans`           | Passed | Third search-param tab reaches one route-local panel; History and Progress continue to load only when selected                                                                                    |
| Library states and controls | Managed loopback desktop browser              | Passed | Available record and factual summary rendered; name hit/no-match/clear states passed; newest, oldest, name A-Z, and workout-count choices set the corresponding active `aria-sort` state          |
| Selected download           | Existing private export link in row actions   | Passed | `/api/plan/export?savedPlanId=2307928d-4a78-43d8-9c24-185095a0fbbf&format=json`; browser download trigger completed                                                                               |
| Empty-future Start          | Disposable `baseline-no-plan` user            | Passed | First Start materialized 55 Calendar rows with 32 non-Rest workouts; receipt reported no replacement and retained the saved record                                                                |
| Calendar refresh            | Calendar after positive Start and page reload | Passed | Monday, August 10 showed the materialized `Easy Run` and the future workout sequence                                                                                                              |
| Replacement cancellation    | Second Start with 55 future rows              | Passed | Explicit Replace dialog rendered; Cancel showed the no-mutation receipt and preserved row count `55` plus row-id hash `a2ee0fd15e5c4900`                                                          |
| Positive replacement        | Explicit `Replace future workouts`            | Passed | Receipt reported 55 eligible rows replaced; resulting count remained 55 with 32 non-Rest, row-id hash changed to `b38e72d39c59dd05`, and the selected saved payload stayed available and retained |
| Logical hide                | Available and Hidden library views            | Passed | Ordinary view removed the record, Hidden restored it as `Hidden`; Calendar retained 55 rows and hash `b38e72d39c59dd05`                                                                           |
| Existing Progress tabs      | Same authenticated browser session            | Passed | Activity history and Progress retained their existing empty/factual states and the Plans tab remained addressable                                                                                 |
| Exact 375px containment     | 375 × 812 viewport                            | Passed | `innerWidth=375`, root/body scroll width `375`, page overflow `false`; table scroller owned its `860px` content inside a `343px` `overflow-x:auto` container                                      |
| Browser diagnostics         | Managed loopback in-app browser               | Passed | No browser console errors; desktop, Start, Replace, and 375px screenshots retained under the task artifact directory                                                                              |
| Focused static checks       | Task-owned Frontend and canonical item        | Passed | Targeted ESLint, Prettier check, exact reachability search, and `git diff --check` passed                                                                                                         |
| Production build            | Current shared checkout                       | Passed | `npm run build` completed client, SSR, Nitro, and postbuild with exit 0; only the existing large-chunk warning remained                                                                           |
| Fixture cleanup             | Existing QA pool lifecycle                    | Passed | Lease released, `baseline-no-plan` reset from 55 workouts/3 provenance rows to zero owned rows, viewport reset, tabs finalized, and managed server stopped                                        |

Omitted checks and coverage consequences:

- The disposable lifecycle retained one canonical saved record, so browser proof exercised every
  sort choice and its active state but did not compare relative ordering across multiple rows. The
  route-local comparator and focused source/static checks cover the deterministic order logic; no
  pagination or backend query-order contract is claimed by this UI slice.
- No broad browser/device/theme matrix, exact mobile widths other than the required 375px, hosted
  environment, provider/OpenAI call, deployment, staging, commit, push, release, or destructive
  data action was run. These omissions do not extend Frontend Implementation DoD to release proof.
- Global QA Acceptance was not assigned, run, or claimed and remains Pending.

Frontend Product Implementation DoD: **Passed**. Next owner: **Product**. Blockers: **none**. No
subagent was used; the bounded owner/browser/static proof was sufficient and did not justify extra
review ceremony.

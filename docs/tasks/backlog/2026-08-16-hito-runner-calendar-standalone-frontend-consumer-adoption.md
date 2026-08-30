# Hito Runner Calendar Standalone Frontend Consumer Adoption

## Work Item ID

2026-08-16-hito-runner-calendar-standalone-frontend-consumer-adoption

## Status

completed

## Type

Tracked — Frontend Product contract adoption

## Priority

high

## Owner

FRONTEND

## Epic

runner-core-readiness

## Stage

Frontend Product implementation complete — independent focused QA passed

## Next Recommended Role

PRODUCT

## Parent

[Runner Core Roadmap](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Runner Calendar Standalone Runtime Completion And Legacy Cleanup](./2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup.md)

## Scope

The authenticated runner Calendar, workout detail, App Shell, Today messaging, and their existing
calendar action/edit state owners. This is the one Frontend Product adoption of the completed
runner-owned Backend read contract.

## Archive Intent

Retain through independent Calendar/workout browser acceptance, then compact to the no-current-plan
UI rule, consumer seams, and replay outcome.

## Task

Make the persisted Product UI consume runner-owned Calendar truth. A confirmed workout is the sole
current entity: its lifecycle and editing capability come from `calendarContext` and the workout's
own `sourceEditing` / optional `sourceProvenance`, never from `snapshot.planMeta` or a global
current-plan ID.

## Product Rule

A plan is an immutable manual, AI, or file-import source used only to propose initial placement.
After confirmation, Calendar workouts are independently runner-owned. Source provenance is optional
metadata per workout. It may explain origin or support a server request, but it cannot gate the
current Calendar, Add/Edit/Move/Copy/Clear, Undo, date visibility, shell status, or current product
copy. Preview remains a source-review state and may retain its separate source-specific behaviour.

## Source Investigation

The completed Backend item now returns `planMeta: null` for persisted snapshots, runner-level
`calendarContext.workoutEditing`, and per-workout `sourceEditing` / `sourceProvenance`.

The current Frontend still has persisted `snapshot.planMeta` authority in these exact seams:

- `src/components/calendar/calendar-projection.ts` gates Add/Move/Copy/Clear and pre-start dates on
  `planMeta.id`, `planMeta.workoutEditing`, `planMeta.startDate`, and an active-plan source kind.
- `src/components/Calendar.tsx` hides dates before the plan start.
- `src/components/calendar/manual-calendar-actions.ts` scopes durable Move Undo to `activePlanId`.
- `src/routes/workout.$date.tsx` gates edit availability, passes a global `provenancePlanId`, and
  detects manual rendering from global plan source metadata.
- `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx` already accepts optional
  provenance, but receives it from the obsolete global snapshot field.
- `src/components/AppShell.tsx` shows a persisted "Saved plan" / plan title as the current shell
  context.
- `src/components/TodayHero.tsx` names an upcoming independently scheduled workout a "current plan"
  window and uses plan-start terminology.

The demonstrated symptom is therefore not a new persistence defect: authenticated snapshots now
contain the runner-owned contract, while these consumers still require the retired container.

## Required Outcome

- Persisted Calendar Add/Edit/Move/Copy/Clear and target presentation use runner-level
  `calendarContext.workoutEditing` plus each workout's `sourceEditing`; no action is blocked merely
  because `planMeta` is null.
- All persisted Calendar dates are runner dates. Remove plan-start hiding/gating and allow the
  existing server capability/protection rules to decide legitimate actions.
- Edit requests pass only the selected workout's optional `sourceProvenance?.sourcePlanId`, never a
  snapshot-global source ID. Manual/AI/imported rendering is based on selected workout truth.
- Durable Move Undo remains exact-once across reload without an active-plan key. Its cache must be
  safely scoped to the authenticated runner through an existing truthful identity/context. If no
  such source exists without changing the Backend contract, stop and return that exact narrow
  backend requirement; do not use an unscoped cache, a plan ID, or a fake identity.
- Authenticated shell and Today states refer to the runner's Calendar or next scheduled workout,
  never a current/saved/manual plan. Preview source-review copy remains clearly distinct.
- Preview behaviour and immutable Past Plans/source history remain intact, but neither becomes
  current Calendar authority.

## What Not To Touch

Backend read/mutation contracts, database/schema/migrations, source-plan authoring or Past Plans
workflows, Design System primitives/tokens/CSS, Admin, provider paths, dependencies, fixtures,
hosted state, Git lifecycle, or unrelated dirty work. Do not add a compatibility `planMeta` branch,
new state layer, client-side permissions model, storage model, or visual redesign.

## Definition Of Done And Proof

- Source census proves no persisted Product decision depends on `snapshot.planMeta`; any remaining
  use is explicitly preview-only and source-review scoped.
- Manual, AI-authored, and imported future workouts each support their applicable Calendar actions
  without a current plan container; Rest and logged/evidence-protected rows retain their existing
  denials.
- Move to empty and stored-Rest targets, reload, Undo, and second reload preserve exact-once
  behavior with no cross-runner cache leakage.
- Workout detail edit review/confirm/reload succeeds for eligible manual, AI, and imported rows and
  retains optional provenance without global gating; preview remains distinct.
- App Shell and Today copy contain no persisted current-plan claim. Calendar date visibility and
  keyboard/focus behaviour remain functional.
- Run focused Product/Calendar/manual-authoring validation, formatting/lint/diff hygiene, production
  build, and a fresh browser matrix at `1470×801` and `375×812` in Light/Dark with clean console and
  no horizontal overflow.
- Use the existing named QA role for a bounded read-only independent replay after implementation.
  QA must not edit source, fixtures, runtime, or hosted state. Record any fixture/capability gap
  honestly; Global QA, real iPad/Safari, hosted, release, and deployment are out of scope.

## Frontend Execution Preflight — 2026-08-16

- **Mode / owner:** Tracked / FRONTEND Product. The Backend dependency is terminal and its complete
  receipt proves persisted `planMeta: null`, runner-level `calendarContext.workoutEditing`, and
  per-workout nullable `sourceProvenance`. The Git index is empty. No build writer is active; the
  existing managed PID `7448` is healthy but its old artifact is stale/broken and will not be used
  as acceptance evidence.
- **Demonstrated first incorrect consumers:** Calendar projection still requires `planMeta.id`,
  global editing capability, and a plan start; Calendar rendering hides earlier runner dates;
  Move/Copy/Clear/Add controls require a non-null `activePlanId` and reject successful standalone
  responses whose provenance ID is null; Workout detail gates edit/rendering on global plan
  metadata; App Shell and Today expose current/saved-plan copy.
- **Existing seams reused:** `calendarContext.workoutEditing`, each selected workout's
  `sourceEditing` and `sourceProvenance`, the current Calendar projection/action hooks, existing
  optional Backend provenance inputs, existing editor/action dialogs, existing shell/Today
  composition, and the already loaded authenticated `viewer.email` runner key used by App Shell.
- **Runner-scoped Undo discriminator:** `src/routes/index.tsx` receives the authenticated viewer and
  already passes the same email identity into the shell's runner-scoped timezone owner. Calendar
  can pass that truthful identity into the existing Undo cache owner. If it is absent, the cache
  remains disabled and inaccessible; a known mismatching or expired record is cleared, with no
  unscoped or plan-keyed fallback.
- **Reuse-first budget:** new runtime files, components, helpers, storage keys/models, state layers,
  compatibility branches, permissions models, tokens, CSS, fixtures, dependencies, and Backend
  artifacts: **none**. The existing session record replaces its plan scope with runner scope; the
  existing source objects carry optional provenance rather than a global plan ID.
- **Responsibilities removed/simplified:** delete plan-start date hiding/gating, global plan
  capability checks, persisted plan-title/manual-origin inference, non-null active-plan response
  assumptions, and persisted current/saved-plan copy. Preserve preview-only plan review language,
  source/Past Plans flows, protected workout denials, and all foreign dirty hunks.
- **Dirty boundary:** accepted concurrent hunks already exist in `Calendar.tsx`,
  `calendar-projection.ts`, `manual-calendar-actions.ts`, `workout.$date.tsx`,
  `ManualWorkoutPersistedEditControls.tsx`, and Backend/type owners. This task edits only separate
  consumer lines and preserves the Calendar hover correction, stored-Rest/Undo recovery, workout
  sidebar/focus work, unified editor adoption, and every Backend byte.
- **Focused proof:** zero persisted Product decision on `snapshot.planMeta`; focused Calendar/manual
  authoring/Product validators; Prettier, ESLint, target type/build and diff hygiene; fresh managed
  browser proof for mixed manual/AI/import actions, protected Rest/logged/evidence states,
  runner-scoped exact-once Move/Undo, detail edit/provenance, preview separation, shell/Today copy,
  keyboard/focus, `1470x801` plus exact `375x812`, Light/Dark, overflow, and console; then one named
  Hito QA read-only replay.
- **Stop boundary:** return to PRODUCT before any Backend/Design System change, missing authenticated
  runner identity contract, source/Past Plans decision, new state/persistence/compatibility layer,
  fixture rewrite, hosted/provider/dependency action, or Git/release lifecycle action.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Runner Calendar Standalone Frontend Consumer Adoption
Lane: Product
Mode: Tracked
Canonical item:
docs/tasks/backlog/2026-08-16-hito-runner-calendar-standalone-frontend-consumer-adoption.md
Parent:
docs/plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md
Depends on:
docs/tasks/backlog/2026-08-15-hito-runner-calendar-standalone-runtime-completion-and-legacy-cleanup.md
Epic: runner-core-readiness

Ivan explicitly authorized immediate execution. Read AGENTS.md, agents/frontend.agent.md,
skills/hito-frontend-design-system/SKILL.md, skills/hito-qa-browser-regression/SKILL.md, the complete
canonical item, the completed Backend receipt, and the affected source before the first write.
Re-check dirty/runtime ownership and preserve unrelated bytes.

Accepted product rule: a plan is only an immutable source artifact for initial placement. After
confirmation, manual, AI-authored, and imported workouts are the same independently runner-owned
Calendar entity. `calendarContext` supplies runner-level action capability; each workout supplies
`sourceEditing` and optional immutable `sourceProvenance`. Source provenance must never become a
current-plan container or UI gate.

Backend now returns `planMeta: null` for persisted snapshots. Remove the demonstrated persisted
`snapshot.planMeta` authority from Calendar projection/date visibility, Calendar Move Undo, workout
detail editing/provenance/manual rendering, App Shell, and Today messaging. Preserve preview-only
source-review behaviour where it is genuinely separate. Use the existing Calendar, action, edit,
and shell seams; no new state layer, storage model, compatibility branch, component, token, or
Design System recipe is admitted.

Specific constraints:
- Calendar Add/Edit/Move/Copy/Clear must use `calendarContext.workoutEditing` and selected
  workout `sourceEditing`; date protection remains server/canonical capability truth, not plan-start
  UI gating.
- Pass only `workout.sourceProvenance?.sourcePlanId` when an existing server edit request accepts
  optional provenance; never use `snapshot.planMeta?.id`.
- Persisted App Shell and Today copy must name the runner Calendar/next workout, not a current or
  saved plan. Preview source-review copy stays distinct.
- Replace active-plan-keyed Move Undo cache scope only with an existing truthful authenticated
  runner identity/context. If that is unavailable without changing Backend, stop and return the
  narrow contract requirement; do not introduce an unscoped cache or reuse a plan ID.
- Do not modify Backend contracts, schema/migrations, sources/Past Plans, DS primitives/CSS,
  fixtures, hosted state, dependencies, Git lifecycle, or unrelated work.

Definition of Done: source census shows no persisted Product action/current-copy gate on
`snapshot.planMeta`; manual/AI/imported applicable actions and detail edits work; Rest and
logged/evidence-protected rows retain denials; empty and stored-Rest Move -> reload -> Undo -> second
reload is exact-once and safely runner-scoped; preview remains distinct; desktop/mobile Light/Dark
browser replay is clean. Run focused checks, production build, and one independent bounded read-only
QA replay using the named QA role. Fix task-owned Frontend failures autonomously; return to PRODUCT
only for a demonstrated Backend/Design System boundary, a product decision, or an unadmitted
runtime/fixture condition.
```

## Tracked Implementation Receipt — 2026-08-16

- **Task / stage:** Hito Runner Calendar Standalone Frontend Consumer Adoption / Frontend Product
  implementation and focused independent QA complete.
- **Preflight:** read `AGENTS.md`, `agents/frontend.agent.md`, the Frontend Design System and browser
  regression skills, this item, the completed Backend dependency, the parent roadmap, current
  Product consumers, dirty boundaries, and managed runtime ownership. The existing authenticated
  viewer email was accepted as the truthful runner scope. New runtime artifacts: **none**.
- **Product outcome:** persisted Calendar rendering and actions now consume runner-level
  `calendarContext.workoutEditing`, selected-workout `sourceEditing`, and optional immutable
  `sourceProvenance`. Persisted App Shell and Today copy describe the runner Calendar/next workout;
  manual, AI-authored, and imported workouts do not gain an origin/current-plan policy branch.
- **Root cause and fix-forward:** the completed Backend contract returns persisted `planMeta: null`,
  while the Frontend still used snapshot-global plan identity, start date, source kind, and editing
  authority. Those gates were removed at the Calendar, workout-detail, shell, and Today consumers.
  Independent QA then proved that a successful Move could show Undo before reload but lose it after
  reload. The existing cache owner destructively treated a temporarily unavailable runner key and
  the seven-second visible timeout as reasons to delete the longer runner-scoped reload-grace
  record. The same cache seam now waits for a known runner before validating a record and hides an
  expired visible affordance without deleting an unexpired stored grace record. No second state or
  storage path was added.
- **Files changed:** `src/components/AppShell.tsx`, `src/components/Calendar.tsx`,
  `src/components/TodayHero.tsx`, `src/components/calendar/calendar-projection.ts`,
  `src/components/calendar/manual-calendar-actions.ts`,
  `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`,
  `src/components/manual-workout/ManualWorkoutMoveControls.tsx`,
  `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx`,
  `src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx`, `src/routes/index.tsx`,
  `src/routes/workout.$date.tsx`, and this lifecycle record. Existing overlapping Calendar hover,
  stored-Rest projection, unified editor, workout-detail, Backend, and unrelated dirty hunks were
  preserved.
- **Removed/simplified responsibility:** removed persisted plan-start date hiding, global
  plan-capability checks, plan-ID equality gates, non-null provenance assumptions, persisted
  current-plan copy, and plan-derived manual rendering. Existing server request fields named
  `activePlanId` remain only as optional legacy wire fields populated from the selected workout's
  provenance when present. Preview-only plan review remains distinct.

| Check                       | Scenario / environment                     | Result | Evidence                                                                                                                                                                                |
| --------------------------- | ------------------------------------------ | ------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Persisted authority census  | Task-owned Product consumers               | Passed | The only remaining `snapshot.planMeta` reference is the explicitly preview-only App Shell branch; persisted actions and copy have no global plan gate.                                  |
| Calendar/action contracts   | Focused source validators                  | Passed | `npm run validate-runner-calendar-context`; `npm run validate-manual-workout-authoring` in its non-mutating default mode.                                                               |
| Static hygiene              | Task-owned TSX/TS and repository diff      | Passed | Focused Prettier and ESLint passed; `git diff --check` passed.                                                                                                                          |
| Production build            | Current task source after Undo fix         | Passed | `npm run build` completed successfully.                                                                                                                                                 |
| Shell and Today             | `qa-saved-plan`, authenticated Calendar    | Passed | App Shell showed `Runner Calendar`; Calendar note and Today/next-workout copy contained no persisted current/saved-plan authority.                                                      |
| Rest versus empty           | Calendar month                             | Passed | Persisted Rest remained a detail link without Add/Paste; a truly empty date exposed the existing Add/Paste capability.                                                                  |
| Workout editing             | Manual and AI rows                         | Passed | Manual `Standalone Manual Easy` review/confirm/reload preserved the row; AI `Distance Intervals` review/cancel preserved ordered repeats, pace targets, rich structure, and provenance. |
| Protected actions           | Completed, skipped, and Rest rows          | Passed | Existing edit denials remained visible/disabled; Clear cancellation and Copy/Paste eligibility did not mutate protected or Rest targets.                                                |
| Empty-target Undo           | Independent QA, same tab/origin            | Passed | Aug 17 -> Aug 24; reload began after 72 ms, Undo hydrated after 1,074 ms, restore produced source=1/target=0/empty=1, and the second reload showed Undo=0.                              |
| Stored-Rest Undo            | Independent QA, same tab/origin            | Passed | Aug 17 -> persisted Rest Aug 19; reload began after 152 ms, Undo hydrated after 1,504 ms, restore produced source=1/Rest=1/target workout=0, and the second reload showed Undo=0.       |
| Responsive/themes/input     | `1470x801` and exact `375x812`, Light/Dark | Passed | Page width matched viewport, mobile navigation and desktop shell remained contained, menus opened with Enter, Escape returned focus, and browser console warnings/errors were empty.    |
| Managed runtime and cleanup | Loopback `qa_fixture`                      | Passed | Fresh `receipt_matches` PID `39553` was used for final QA and remained healthy/running; the disposable `qa-saved-plan` data was removed through `design-profile-reset` after proof.     |
| Independent QA              | Named Hito QA role                         | Passed | Initial failure was retained and fixed forward; the final bounded addendum returned **Verdict: Passed** for this Frontend implementation slice.                                         |

- **Omitted checks / consequence:** the prepared fixture had no rendered imported-origin workout,
  so imported-origin browser proof remains unavailable; source adoption is origin-neutral and has
  no origin branch, but that rendered case is not independently accepted here. The disposable reset
  removed the temporary manual row before the final Undo-only QA addendum; its manual editor proof
  came from the earlier fresh replay and the final source fix touched only the Undo cache seam.
  Repository-wide `tsc --noEmit` still reports the checkout's existing 154-error baseline, including
  pre-existing route/search and server-result typing families in touched dirty files; focused
  validators, ESLint, and production compilation are green, but this receipt does not claim a clean
  repository-wide typecheck. Real iPad/Safari, native drag, FIT attachment, Global QA, hosted,
  release, deployment, and Figma acceptance were not run or claimed.
- **Preserved boundaries:** no Backend, schema/migration, fixture-source, Design System, source-plan,
  Past Plans, provider, hosted, dependency, or Git lifecycle change was made. The runner-scoped Undo
  cache remains local/session-only and no live compatibility authority was introduced.
- **Role / skills / review:** role file `agents/frontend.agent.md`; skills
  `skills/hito-frontend-design-system/SKILL.md`, `skills/hito-qa-browser-regression/SKILL.md`, and
  the supported in-app browser control skill. The existing named `ROLE: QA` agent performed bounded
  read-only acceptance; no Frontend implementation subagent was used.
- **Next owner / blockers:** return to **PRODUCT** for the next roadmap slice or separately scoped
  imported-origin/Global QA coverage. Frontend implementation blockers: **none**.

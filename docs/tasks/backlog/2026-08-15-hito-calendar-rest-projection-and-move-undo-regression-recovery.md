# Hito Calendar Rest Projection And Move Undo Regression Recovery

## Work Item ID

2026-08-15-hito-calendar-rest-projection-and-move-undo-regression-recovery

## Status

completed

## Type

Bug — Frontend Product regression recovery

## Priority

high

## Owner

FRONTEND

## Stage

Frontend Product Implementation DoD completed; returned to PRODUCT

## Next Recommended Role

PRODUCT

## Evidence From

- [Workout Core Flow QA Scenario Catalog](./2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md)
- [Workout Move Undo Stored Rest Reversibility](./2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md)

## Scope

Only authenticated Calendar presentation of durable Rest rows and existing Move/Undo affordance hydration. Forward mutation, stored-Rest reversibility RPC, source-plan decoupling, FIT chooser, native desktop drag, and real-iPad/Safari evidence are outside this task.

## Archive Intent

Retain recovery evidence until the next full Workout Core catalog replay; then compact to the two repaired observable contracts and independent verdict.

## Task

Make durable stored Rest visibly distinct from a genuinely empty Calendar date, and make existing Move Undo survive the immediate-reload path for empty and stored-Rest targets. Reuse current Calendar projection and manual action state; add no parallel persistence, cache, or plan-container compatibility path.

## QA Evidence

Stage 3 local QA reproduced two Frontend Product defects against a fresh loopback fixture:

1. A reviewed/persisted Rest row reloaded in workout detail as `Rest day`, but Calendar displayed `Add workout` as though the date were empty.
2. Move to an empty target persisted but offered no Undo. Move onto a stored Rest offered Undo until immediate reload, then the affordance disappeared although the move stayed durable.

QA confirmed forward persistence and direct Rest detail readback. No Backend, schema, migration, or provider defect was indicated.

## Source Investigation

- `src/components/calendar/calendar-projection.ts` admits both `!workout` and `workout.type === "rest"` into the Rest/add-action presentation, losing stored-versus-empty identity in the Calendar consumer.
- `src/components/calendar/manual-calendar-actions.ts` owns transient Move Undo state and its projection/hydration. QA identified its missing or non-restored Undo affordance as the first incorrect owner; direct durable move state remained correct.

## Required Outcome

- A stored Rest renders as an explicit Calendar state and does not expose an empty-date Add action.
- A genuinely empty date retains existing Add/Paste behavior.
- Empty-target and stored-Rest Move both support `Move -> reload -> Undo -> reload` exactly once, return the same workout ID to its source, and restore displaced Rest without duplicates.
- Existing expiry, ownership, stale-event, cancellation, focus, Escape, and optimistic-feedback contracts remain truthful.

## What Not To Touch

Backend move/RPC logic, migrations, RLS, fixture source, direct database setup, plan-source decoupling, FIT/browser control paths, iPad/Safari work, shared Design System primitives, hosted state, providers, dependencies, Git lifecycle, and unrelated dirty hunks.

## Validation Expectations

Run focused source checks, the existing Product/Calendar validator, formatting, lint, diff hygiene, production build, and a fresh managed loopback replay at `1470x801` and `375x812` in Light/Dark. Use named QA for bounded read-only acceptance after implementation. Cover Rest versus empty presentation, both Move/reload/Undo branches, durable readback, keyboard/focus/Escape, overflow, console, and cleanup. Do not claim real-iPad/Safari, native desktop drag, FIT attachment, Global QA, hosted, release, or deployment.

## Frontend Execution Preflight — 2026-08-15

- **Mode / owner:** Tracked Frontend Product correction. The Git index is empty. The task reuses
  `calendar-projection.ts` and `manual-calendar-actions.ts`; no second production writer or
  cross-owner implementation is admitted.
- **Current source discriminator:** `resolveCalendarAddActionContext()` currently treats both an
  absent row and a persisted `workout.type === "rest"` row as addable. `CalendarDaySlot` therefore
  selects the Add-menu branch for durable Rest instead of the ordinary stored-state/detail branch.
  In the Move seam, both empty and stored-Rest direct targets are factually normalized to
  `rest_day`, but `refreshLastMoveUndoWindow()` overwrites the existing 30-second reload-grace
  record with the seven-second visible-window expiry before hydration can restore it reliably.
- **Existing seams / smallest change:** restrict ordinary Add to a genuinely absent row while
  retaining the separate existing Move-target capability; keep the existing session-storage key,
  cache, React state, mutation result, and projection, but preserve reload grace separately from
  the already established seven-second visible countdown within that same state owner.
- **Reuse-first budget:** new runtime artifacts, files, helpers, storage keys, caches, state maps,
  components, CSS, fixtures, persistence shapes, and compatibility paths: **none**. The superseded
  stored-Rest Add admission and short-lived storage overwrite are the only branches simplified.
- **Dirty boundary:** `manual-calendar-actions.ts` contains the accepted prior hydration correction
  from Workout Interaction Recovery; those bytes remain intact and this task changes only its
  expiry projection. `calendar-projection.ts` is otherwise clean. Backend, migrations, Calendar
  fixture data, shared Design System, FIT/iPad/drag work, and all unrelated dirty paths remain
  read-only.
- **Focused proof:** source projection assertions; Calendar/Product validators; Prettier, focused
  ESLint, diff hygiene, and production build; fresh managed loopback replay at `1470x801` and exact
  `375x812` in Light/Dark for explicit Rest versus empty, both Move/reload/Undo/reload branches,
  exact-once durable readback, focus/Escape, overflow, console, and cleanup; bounded named QA replay
  after implementation.
- **Stop boundary:** return to PRODUCT before any Backend, persistence, fixture, Design System,
  iPad/Safari, FIT, hosted/provider, dependency, or Git-lifecycle change.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito Calendar Rest Projection And Move Undo Regression Recovery
Stage: Frontend Product correction and focused independent QA
Mode: Tracked
Frontend lane: Product
Canonical item: docs/tasks/backlog/2026-08-15-hito-calendar-rest-projection-and-move-undo-regression-recovery.md
Evidence: docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md

Ivan explicitly authorized immediate execution. Read AGENTS.md, agents/frontend.agent.md, skills/hito-frontend-design-system/SKILL.md, skills/hito-qa-browser-regression/SKILL.md, the complete canonical item, and linked QA evidence before the first write. Re-check current dirty state and preserve unrelated bytes.

QA demonstrated two Frontend Product defects: Calendar projection renders a persisted Rest row as an empty Add-workout date; existing Move Undo is absent for an empty target and disappears after immediate reload for a stored-Rest target, while forward persistence remains correct.

Reuse `src/components/calendar/calendar-projection.ts` and `src/components/calendar/manual-calendar-actions.ts`. Establish the exact source discriminator before changing behavior. Restore a visible stored-Rest state distinct from a genuinely empty date, and make both existing Move branches satisfy Move -> reload -> Undo -> reload exactly once. Preserve the current Backend contract, Rest identity/provenance, expiry, ownership, stale-event protection, cancellation, focus/Escape, optimistic feedback, and existing Design System primitives. Do not add a cache, persistence path, plan-container compatibility path, fixture, schema/migration, helper, or new CSS recipe.

Do not modify Backend move/RPC logic, migrations, RLS, fixture source, direct database state, plan-source decoupling, FIT handling, iPad/Safari behavior, native desktop drag, hosted state, providers, dependencies, or Git lifecycle. Stop and return to PRODUCT if this requires a Backend or Design System change.

Use named QA for bounded read-only acceptance after implementation; do not delegate Frontend code. Run focused source/Product checks, formatting, lint, diff hygiene, production build, and a fresh managed loopback browser matrix at 1470x801 and 375x812 in Light/Dark. QA must replay explicit Rest versus empty presentation and both Move/reload/Undo branches, including durable readback, keyboard/focus/Escape, overflow, console, and cleanup.

Update only this canonical item with a compact English tracked implementation receipt. Do not claim real-iPad/Safari, native desktop drag, FIT attachment, Global QA, hosted, release, or deployment acceptance.
```

## Frontend Tracked Implementation Receipt — 2026-08-15

### Task, stage, and preflight

- **Role / lane / mode:** FRONTEND / Product / Tracked.
- **Stage completed:** Frontend Product correction plus focused independent QA. This is
  Implementation DoD, not Global QA Acceptance.
- **Role file:** `agents/frontend.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` for consumer/Design System
  boundaries and `skills/hito-qa-browser-regression/SKILL.md` for managed loopback proof.
- **Independent reviewer:** named Hito QA agent Godel, read-only. QA changed no source, CSS,
  lifecycle record, fixture source, Backend, dependency, or Git state.
- **Reuse-first result:** the implementation remained inside the existing Calendar projection and
  manual action-state owners. New runtime artifacts, files, helpers, caches, storage keys, state
  maps, components, CSS recipes, fixtures, persistence shapes, and compatibility paths: **none**.

### Demonstrated causes and correction

1. `resolveCalendarAddActionContext()` admitted both a missing workout and a persisted Rest
   workout to the Add menu. It now admits only a genuinely absent workout; the separate existing
   Move-target capability still permits an eligible stored-Rest target.
2. The existing 30-second same-session reload-grace record was repeatedly overwritten with the
   seven-second visible countdown expiry. The existing session-storage owner now retains reload
   grace while React state projects the established seven-second visible countdown.
3. A successful reverse move was being treated as a new forward move, which could create a redo
   affordance and hide the restored empty target. The existing request path now records an undo
   candidate only for the original forward move; Undo reuses the same move caller without recording
   a second candidate.

### Files changed

- `src/components/calendar/calendar-projection.ts` — distinguish persisted Rest from a genuinely
  empty Add target while preserving Move-target truth.
- `src/components/calendar/manual-calendar-actions.ts` — retain reload grace, hydrate a bounded
  visible countdown, and make reverse execution exact-once without a redo.
- This canonical item — preflight, terminal lifecycle, and this receipt.

The accepted earlier hydration hunk already present in `manual-calendar-actions.ts` and every
unrelated dirty path were preserved. Backend move/RPC logic, migrations, RLS, fixture source,
direct database state, plan-source decoupling, FIT handling, iPad/Safari/native drag, shared Design
System source, hosted state, providers, dependencies, and Git lifecycle were not changed.

### Validation

| Check                    | Scenario / environment                                    | Result | Evidence                                                                                                                                                                                                       |
| ------------------------ | --------------------------------------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator     | Empty and persisted-Rest projection plus Move-only target | Passed | Empty retained Add; stored Rest retained explicit state/detail, no Add, and remained an eligible `rest_day` Move target                                                                                        |
| Focused static checks    | Task-owned source                                         | Passed | Prettier, focused ESLint, `validate-runner-calendar-context`, `validate-manual-workout-authoring` source mode, `validate-product-contracts`, and `git diff --check` passed                                     |
| Production build/runtime | Managed `qa_fixture` at `127.0.0.1:3000`                  | Passed | Fresh production artifact; PID `7448`, healthy, loopback-only, `receipt_matches` during acceptance                                                                                                             |
| Empty-target durability  | `2026-08-16 -> 2026-08-18 -> reload -> Undo -> reload`    | Passed | Forward move persisted; Undo hydrated after reload; native Enter restored the same source workout; target became empty; no duplicate or redo remained                                                          |
| Stored-Rest durability   | `2026-08-16 -> 2026-08-17 -> reload -> Undo -> reload`    | Passed | Forward move persisted; Undo hydrated after reload; source and one stored Rest were restored; no duplicate or redo remained                                                                                    |
| Projection truth         | Stored Rest `2026-08-17`; empty `2026-08-18`              | Passed | Rest rendered as a detail link with no Add; empty date retained `Add workout`                                                                                                                                  |
| Responsive/themes        | `1470x801` and exact `375x812`, Light/Dark                | Passed | Body/document width equalled viewport; menus/countdown remained contained; no page-level horizontal overflow                                                                                                   |
| Keyboard/focus/cancel    | Calendar action and target menus                          | Passed | Native Enter activated Undo; Escape dismissed menus and returned focus after settlement; cancel preserved source, Rest, and empty-target truth                                                                 |
| Console                  | Full focused replay                                       | Passed | No browser warnings or errors                                                                                                                                                                                  |
| Independent QA           | Named Hito QA read-only replay                            | Passed | Completion-gated Undo appeared 440 ms after empty-target reload and 525 ms after stored-Rest reload; both exact-once branches, durable readback, themes/viewports, focus, Escape, overflow, and console passed |
| Cleanup/runtime end gate | `pool-reset-plan --role baseline-no-plan`                 | Passed | Profile preserved; plan/workout/result/activity/evidence counts returned to zero; no leases remained; PID `7448` stayed healthy, fresh, loopback-bound, and running                                            |

### Coverage and return

- The supported QA browser sandbox did not expose `sessionStorage`; internal key fields were not
  inspected through a disallowed raw bridge. The required observable hydration contract was proven
  through timed completion-gated reload replay. A 120 ms pre-completion snapshot was correctly
  excluded; successful move completion was followed by Undo hydration in 440–525 ms.
- QA did not separately capture the raw workout UUID before and after the browser replay. Stable-ID
  preservation is instead covered by the passing existing Move source validator and the task-owned
  chain `result.plannedWorkoutId -> undo.sourceWorkoutId -> reverse request.sourceWorkoutId`, while
  the durable browser readback proved exactly one source workout, one restored Rest row, and no
  duplicate or redo. The omitted raw-UUID browser assertion limits that one evidence layer and is
  not represented as independently observed browser proof.
- Real iPad/Safari, native desktop drag, FIT attachment, Global QA, hosted, release, deployment, and
  Figma acceptance were intentionally not run or claimed.
- A final status read after the documentation receipt still found PID `7448` healthy,
  loopback-bound, and running, but marked artifact freshness `stale` / `artifact_missing` because
  the build no longer contained the current private Admin repository snapshot marker. The full
  Product acceptance above ran while the artifact was fresh and `receipt_matches`; this later
  cross-owner snapshot drift was not rebuilt or absorbed into this task.
- **Blockers:** none inside this Frontend Product slice.
- **Next owner:** PRODUCT for the later independent Workout Core catalog replay and any separate
  deferred acceptance.

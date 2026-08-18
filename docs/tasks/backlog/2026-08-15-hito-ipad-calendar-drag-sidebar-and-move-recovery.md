# Hito iPad Calendar Drag, Sidebar, And Move Recovery

Work Item ID: `2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery`
Status: closed
Type: Bug
Priority: high
Owner: FRONTEND
Frontend Lane: Product
Scope: iPad/iPad-class Calendar movement and AppShell sidebar behavior only. Establish and repair
the reported touch drag, sidebar scroll, and Move failure from their first incorrect owner.
Archive Intent: Retain the source recovery and its deferred physical-device boundary; compact on
terminal history closeout.
Parent: [Workout Core Flow QA Scenario Catalog](./2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md)
Evidence From: [Workout Interaction Recovery](./2026-08-15-hito-workout-interaction-recovery.md)

## Task

Restore reliable Calendar movement on iPad-class touch devices and remove unintended AppShell sidebar
scroll behavior without regressing desktop or phone interaction. A user must be able to move an
eligible workout through a touch-accessible interaction, receive a clear actionable result, and
continue using the page without a phantom or competing sidebar scroll surface.

## User Report

On iPad:

1. Calendar drag and drop does not work.
2. The product sidebar unexpectedly becomes scrollable.
3. Selecting `Move` produced an error described as showing two values; the exact text and source
   were not captured.

Ivan requested root-cause investigation and repair of all three reported contracts, not a local
visual workaround.

## Source Investigation

- `src/components/calendar/manual-calendar-actions.ts` exposes Calendar movement through native
  HTML drag events only: `draggable`, `onDragStart`, `onDragEnter`, `onDragOver`, `onDrop`, and
  `dataTransfer`. That interaction model is not a sufficient touch-drag contract for iPad browsers.
- `src/components/calendar/calendar-projection.ts` already supplies movement capability, valid target
  state, and a menu-based `Move` action. Reuse that canonical move state rather than creating a
  second persistence path.
- `src/components/AppShell.tsx` renders the desktop/sidebar branch at `md` and makes its `aside`
  sticky with `h-screen`. The reported iPad scroll needs a same-viewport DOM/computed-style
  discriminator before any geometry change.
- The user report does not include the Move error text, console output, mutation response, source
  date/target date, or workout kind. The first incorrect owner for this symptom remains unproven.

## Required Discriminators

- Capture the exact Move error and its first source on an admitted local fixture: user action,
  source workout, target day kind, console/network/server evidence, and resulting projection.
- Reproduce touch movement on a real iPad browser when available. If only emulation is available,
  state that limitation and prove the actual event/interaction contract separately; do not present
  desktop HTML drag success as iPad evidence.
- Capture iPad-class sidebar geometry and scroll ownership at the reported orientation/viewport:
  root, main, aside, and intended content owner dimensions/overflow.

## Expected Behavior

- An eligible workout has a touch-accessible move flow on iPad. It may reuse the existing explicit
  `Move` flow when that is more reliable than direct drag, but it must be discoverable, operable,
  cancellable, and truthful; no fake drag affordance may remain.
- If direct touch drag is retained, it must use an input model that actually receives touch/pointer
  interaction and preserve native keyboard/menu movement as an equivalent fallback.
- Move to every supported target kind either succeeds exactly once or reports the specific canonical
  validation reason. It never presents duplicate/conflicting values, silently loses a workout, or
  corrupts Undo/reload behavior.
- The iPad sidebar has one intentional scroll owner. It neither introduces a phantom scrollbar nor
  competes with page/content scrolling when its own contents fit. Navigation remains reachable when
  content genuinely exceeds the viewport.
- Desktop and phone Calendar behavior, current Move Undo persistence, navigation, safe-area handling,
  and AppShell/Design System contracts remain intact.

## Boundaries

- Reuse `manual-calendar-actions.ts`, Calendar projection/state, `AppShell.tsx`, and existing shell
  CSS before adding any artifact. Proposed new runtime artifacts: none unless source proof shows an
  existing owner cannot represent touch movement.
- Do not change Backend move semantics, Rest/FIT lifecycle, server validation, database, fixtures,
  shared Design System primitives, route copy, hosted state, providers, or Git lifecycle unless a
  fresh discriminator proves that owner is first incorrect. Return that boundary to PRODUCT instead
  of masking it in the client.
- Preserve unrelated dirty hunks, including the completed Move Undo changes in
  `manual-calendar-actions.ts` and State Surface work in `overlays-feedback.css`.

## Definition Of Done

- The exact reported Move failure is reproduced and either fixed at its demonstrated owner or routed
  with source/log evidence; no vague error remains.
- iPad-class touch movement and explicit Move fallback are both verified for eligible Workout → empty
  day, Rest day, and occupied/replacement boundary as applicable.
- Sidebar scroll ownership is proven correct on the reported iPad-class layouts and does not add
  horizontal overflow.
- Existing Move → reload → Undo → reload remains intact.
- Focused replay covers iPad-class portrait and landscape, desktop, and 375px phone in Light/Dark;
  keyboard/pointer/touch-equivalent operation, focus, Escape/cancel, overflow, and console health
  are recorded. Actual-device versus emulation coverage is stated truthfully.
- Focused formatting, lint, relevant Product contract checks, production build when runtime changes,
  and `git diff --check` pass. The canonical item receives a concise English tracked receipt.

## Stage

Closed after the completed Backend Move/Undo repair and accepted local Runner Core regression.
Physical iPad/Safari and native desktop-drag evidence remain deferred under the separate Platform
and Operations acceptance item; they are not an open source defect or a Runner Core release gate.

## Frontend Execution Preflight — 2026-08-15

- **Mode and owner:** Tracked FRONTEND Product work. The admitted seams are the route-owned Calendar
  interaction composition, its existing manual move state/projection, and authenticated AppShell
  layout. Backend mutation truth and shared Design System contracts remain read-only.
- **Fresh runtime admission:** the managed loopback `qa_fixture` was rebuilt after writers were
  serialized and admitted as healthy, compatible, loopback-bound, and `receipt_matches` (PID 63213)
  before any fixture mutation or browser replay.
- **Current source discriminator:** eligible Calendar sources expose native HTML `draggable` and
  `DragEvent/dataTransfer` handlers only. The explicit Move menu already owns the accessible
  pointer/keyboard fallback, but its wide-calendar trigger is visually hidden until hover/focus.
  This does not establish a touch drag contract and may leave an iPad user with a fake drag cue.
  AppShell's desktop sidebar is sticky `h-screen` without an explicit overflow rule, so runtime
  root/main/aside geometry is required before changing scroll ownership. The reported two-value
  Move error still requires an exact UI/mutation/server replay.
- **Existing seams reused:** `CalendarDaySlot`, `manualMoveSourceDragProps`,
  `manualMoveTargetDragProps`, `Calendar` projection/state, `ManualWorkoutSourceActionMenu`, and the
  current `AppShell` aside/main structure. The same `onMoveWorkout` / `onMoveTargetSelected` path
  must remain the only mutation request owner.
- **Change budget:** new runtime artifacts: none. No pointer-drag framework, second move state,
  storage key, wrapper, helper file, CSS recipe, token, fixture path, compatibility layer, or client
  persistence is proposed. Any superseded fake touch affordance will be removed only if runtime
  evidence confirms the explicit Move path is the truthful iPad interaction.
- **Dirty boundary:** accepted Move Undo hunks already exist in
  `src/components/calendar/manual-calendar-actions.ts`; they are preserved. `Calendar.tsx` and
  `AppShell.tsx` are clean before this task. State Surface changes in
  `src/styles/overlays-feedback.css`, Workout Detail changes, and all other dirty paths are foreign.
- **Focused proof:** iPad-class 768x1024 portrait and 1024x768 landscape geometry/input
  discriminators; empty, persisted Rest, and occupied/replacement targets; cancel, explicit Move,
  reload/Undo, focus, page/sidebar overflow and console; desktop and exact 375x812 Light/Dark
  preservation. Real-device versus emulation coverage will be reported explicitly.
- **Stop boundary:** return the exact response/log to PRODUCT if the Move error is Backend-owned;
  return a shared primitive/CSS defect to DESIGN SYSTEM. Do not compensate across either boundary.

## Next Recommended Role

QA only when a physical iPad/Safari or native desktop-drag control surface is available.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito iPad Calendar Drag, Sidebar, And Move Recovery
Stage: Product implementation and iPad-class interaction recovery
Mode: Tracked
Frontend lane: Product
Canonical item: docs/tasks/backlog/2026-08-15-hito-ipad-calendar-drag-sidebar-and-move-recovery.md
Parent: docs/tasks/backlog/2026-08-15-hito-workout-core-flow-qa-scenario-catalog.md
Evidence: docs/tasks/backlog/2026-08-15-hito-workout-interaction-recovery.md

Ivan explicitly authorized investigation and repair. Read AGENTS.md, agents/frontend.agent.md,
skills/hito-frontend-design-system/SKILL.md, and skills/hito-qa-browser-regression/SKILL.md before
acting. Re-check the canonical item, source, managed fixture admission, and dirty boundary before
the first write.

Investigate and repair the iPad-class Calendar/Product contracts from their first incorrect owner:
1. Touch drag and drop does not move an eligible Calendar workout. Current source uses native HTML
   DragEvent/dataTransfer only, which is not by itself a touch interaction contract. Establish the
   actual input path and implement the smallest truthful interaction; retain an accessible explicit
   Move fallback and do not leave a fake drag affordance.
2. The AppShell sidebar unexpectedly scrolls on iPad. Reproduce the exact viewport/orientation and
   establish root/main/aside scroll ownership before changing geometry. Remove only unintended
   scrolling while keeping genuinely overflowing navigation reachable.
3. The menu Move flow produced an uncaptured conflicting/two-value error. Reproduce it and capture
   the exact first source (client, mutation response, or server). Fix only if it is Product-owned;
   otherwise stop with the source/log discriminator for PRODUCT.

Reuse Calendar move state/projection, AppShell, and existing shell CSS. New runtime artifacts are
none unless source proof demonstrates an existing owner cannot own the repair. Preserve completed
Move Undo behavior, Rest/FIT lifecycle, Backend semantics, fixtures, shared DS primitives, hosted
state, providers, and unrelated dirty work. Do not turn an unresolved Backend or Design System cause
into a client workaround.

Prove iPad-class portrait and landscape touch behavior plus desktop and 375px preservation in
Light/Dark. Cover eligible Workout to empty day, Rest day, and occupied/replacement boundary; cancel,
Undo/reload, explicit Move, focus, overflow, and console health. Use a real iPad browser when
available; otherwise state the emulation gap honestly. You may request the existing named QA role
for a bounded read-only independent browser review after implementation, but do not delegate Product
implementation.

Run proportionate formatting/lint/Product checks, build if runtime source changes, and git diff
hygiene. Update the canonical item with an English tracked receipt and return to PRODUCT for
independent QA. Do not claim Global QA, hosted, release, or production readiness.
```

## Frontend Product Tracked Implementation Receipt — 2026-08-15

### Stage And Outcome

- **Stage:** Product implementation and iPad-class interaction recovery.
- **Implemented Product outcome:** the existing Calendar source-action menu is now visible by
  default on no-hover input while remaining hover-revealed on hover-capable desktop layouts. The
  same `ManualWorkoutSourceActionMenu`, move projection, request controller, and Backend mutation
  path remain the only move owners. Native desktop drag remains available; no pointer-drag
  framework or second move state was added.
- **Lifecycle result:** blocked. The Product-owned touch-discoverability defect is corrected, the
  sidebar report is a geometry non-reproduction, and the reported two-value error did not reproduce.
  Focused replay instead demonstrated that Move -> stored Rest -> Undo permanently removes the
  stored Rest row. That required WC-04 contract is Backend-owned and is outside this task's write
  boundary.

### Demonstrated Causes And Ownership

- The Calendar's wide source-action trigger was route-locally `opacity-0` until hover/focus while
  the only direct movement handlers were native `DragEvent`/`dataTransfer`. That left an iPad
  landscape user without a discoverable truthful interaction when Safari did not supply native
  drag. The first incorrect Product owner was `CalendarDaySlot` in `src/components/Calendar.tsx`.
  It now uses the existing project arbitrary-media composition so no-hover input receives the
  explicit action and hover-capable input preserves the previous hover presentation.
- At `768x1024` and `1024x768`, document/root scroll moved to `320px` while the sticky AppShell
  aside remained `scrollTop: 0`, `top: 0`, `clientHeight === scrollHeight`, and
  `overflow-y: visible`. The report of a second sidebar scroll owner did not reproduce in either
  orientation; `src/components/AppShell.tsx` was not changed.
- The uncaptured two-value Move error did not reproduce. Empty-day direct Move, stored-Rest direct
  Move, and occupied-day review/confirm all returned successful action responses, produced the
  factual Calendar projection, and emitted no browser console error.
- A separate WC-04 boundary did reproduce: `resolveMoveTargetDay()` identifies a persisted Rest row
  as `targetReplacementWorkout`; `persistManualWorkoutMove()` supplies that row to the atomic move
  mutation, which replaces it. The browser-owned Undo candidate then contains only the moved workout
  identity and reverse dates, so its reverse move cannot recreate the original Rest row. After a
  final reload, `Add rest day` was offered again on the former stored-Rest target. The first owner
  capable of preserving atomic Rest reversibility is the Backend move contract in
  `src/lib/manual-workout-authoring/move-workout.ts`, not a Calendar presentation workaround.

### Files

- **Changed:** `src/components/Calendar.tsx` — one route-local class composition change.
- **Lifecycle only:** this canonical item.
- **Inspected and unchanged:** `src/components/AppShell.tsx`,
  `src/components/calendar/manual-calendar-actions.ts`,
  `src/components/manual-workout/ManualWorkoutMoveControls.tsx`,
  `src/components/calendar/calendar-projection.ts`, and
  `src/lib/manual-workout-authoring/move-workout.ts`.
- **New runtime artifacts:** none.
- Accepted Move Undo hunks and every unrelated dirty path were preserved byte-for-byte.

### Validation Inventory

| Check                                   | Scenario / environment                                        | Result                                 | Evidence                                                                                                                                                                                                                |
| --------------------------------------- | ------------------------------------------------------------- | -------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fresh artifact and build                | Managed loopback `qa_fixture`                                 | Passed                                 | Serialized production build completed; final managed runtime was healthy, loopback-bound, `artifactFreshness: fresh` / `receipt_matches` (PID 66038) before browser proof.                                              |
| No-hover action contract                | Built source and compiled CSS                                 | Passed                                 | The route composes base `opacity-100` with `[@media(hover:hover)]:opacity-0`; the production CSS contains the matching hover media rule, so no-hover input retains the visible base state without new CSS.              |
| Keyboard action fallback                | `1024x768`, Dark                                              | Passed                                 | Tab reached the existing action button; its focus-visible transition reached opacity 1, Enter opened the existing menu, and Escape returned focus to the same labelled trigger.                                         |
| Empty target and persisted Undo         | Aug 17 -> empty Aug 20 -> reload -> Undo -> reload            | Passed                                 | Reload returned `Undo ... 6 seconds remaining`; Undo restored one Aug 17 workout and zero Aug 20 workouts. No console error was recorded.                                                                               |
| Stored Rest discriminator               | Ordinary UI-created Aug 18 Rest                               | Passed before move                     | The target menu omitted `Add rest day`, distinguishing the persisted Rest row from an empty date without database shaping.                                                                                              |
| Stored Rest reversibility               | Aug 17 -> stored Rest Aug 18 -> Undo -> reload                | **Failed — Backend boundary**          | The workout returned once to Aug 17, but the target menu offered `Add rest day` after reload, proving the Rest row was absent. The acceptance Rest row was recreated afterward through the ordinary reviewed Rest flow. |
| Occupied replacement and reported error | Ordinary UI-created Aug 19 workout                            | Passed / original error not reproduced | Review opened the replacement dialog, confirm replaced exactly once, and the source was restored afterward. Browser console remained clean; recorded server-function POSTs returned HTTP 200.                           |
| Cancel and focus                        | Exact `375x812`, Dark                                         | Passed                                 | Cancel left the Aug 17 source in place, cleared move-target mode, returned focus to the Aug 20 day button, and kept page overflow at zero.                                                                              |
| Sidebar ownership                       | `768x1024` portrait and `1024x768` landscape                  | Passed as non-reproduction             | Root scroll was `320px`; aside scroll remained `0`, sticky at the viewport top, and `clientHeight === scrollHeight`. No horizontal overflow occurred.                                                                   |
| Responsive/theme containment            | `1470x801`, `1024x768`, `768x1024`, and `375x812`; Light/Dark | Passed                                 | Every measured viewport had `scrollWidth === clientWidth`; desktop sidebar geometry, phone bottom navigation, Calendar navigation, and the existing mobile 28x28 action rendering remained intact.                      |
| Console/runtime health                  | Final browser replay and local event readback                 | Passed for task-owned actions          | Browser warning/error logs were empty. Move/review/create action requests completed successfully; no two-value/conflict response was observed.                                                                          |
| Focused static checks                   | Changed and adjacent owners                                   | Passed                                 | Prettier check, focused ESLint, `validate-runner-calendar-context`, production build, and `git diff --check` passed.                                                                                                    |

### Coverage Gaps, Boundary, And Next Owner

- No real iPad/Safari device was available. Chromium responsive emulation proved geometry,
  responsive composition, keyboard/pointer operation, and the compiled no-hover contract, but it
  reports fine pointer/hover and is not actual iPad touch acceptance. This item must not claim
  device-level touch proof.
- The canonical receipt write occurred after the fresh browser replay. The managed process remains
  healthy and loopback-bound, but checkout-wide status subsequently reports
  `stale` / `artifact_missing` because the private Admin repository snapshot digest includes this
  documentation change. No runtime source changed after proof, and the server was not rebuilt in a
  documentation-only loop.
- Independent QA and Global QA were not claimed.
- **Blocker / next owner:** PRODUCT must route the stored-Rest atomic reversibility failure to
  BACKEND, then request independent QA on a real iPad when available. Frontend must not serialize a
  Rest row in browser Undo state or otherwise create a second persistence contract.

## Product Lifecycle Reconciliation — 2026-08-18

The original single bug record contained three independent contracts. They now have different
truthful terminal states:

- The no-hover Calendar Move affordance was implemented in `Calendar.tsx` through the existing
  action menu; it remains the only touch-accessible move path in the source.
- The stored-Rest Undo loss was repaired by the completed Backend
  [Workout Move Undo Stored Rest Reversibility](./2026-08-15-hito-workout-move-undo-stored-rest-reversibility.md)
  item and was re-exercised by the accepted
  [Runner Core Post-Parity Independent Local QA](./2026-08-18-hito-runner-core-post-parity-independent-qa.md).
- No real iPad/Safari or native desktop-drag surface was available. That is retained as a deferred
  evidence-only acceptance scope in
  [Calendar Move Performance And Legacy Acceptance](./2026-08-15-hito-calendar-move-performance-and-legacy-acceptance.md),
  now `backlog` under Platform and Operations.

This bug is therefore `closed`, not `completed` as a physical-device acceptance claim. Its
previous `blocked` status must not keep the completed Calendar source hunk nonterminal during a
Runner Core release freeze. A future physical-device defect reopens through the deferred QA item
with a captured device replay and first incorrect owner.

# Hito Runner Occupied Move Replace Undo Frontend Adoption

## Work Item ID

2026-08-16-hito-runner-occupied-move-replace-undo-frontend-adoption

## Status

completed

## Type

Bug — Frontend Product durable Undo adoption

## Priority

critical

## Owner

FRONTEND

## Stage

Frontend implementation and focused independent QA complete

## Depends On

[Occupied Move Replace Durable Undo](./2026-08-16-hito-runner-occupied-move-replace-durable-undo.md)

## Scope

The existing Calendar Move/Replace Undo state and affordance. Backend now durably restores both the
source and displaced workout and returns `undoExpiresAt`; the client must expose that exact window.

## Task

Make the existing visible Undo affordance use the returned server expiry for an occupied-target
replacement, as it does for empty and Rest targets. The server transaction remains the sole source
of displaced-workout truth. Client state may retain only the opaque undo event/reference needed to
call the existing reverse operation and must never reconstruct or cache a displaced workout.

## Evidence

- Backend confirmed all valid displaced workout types restore atomically with stable identity,
  provenance, and exact-once protection.
- `src/lib/manual-workout-authoring/move-workout.ts` already returns `undoExpiresAt` for successful
  direct and reviewed moves.
- `src/components/calendar/manual-calendar-actions.ts` contains the existing Calendar Undo window,
  hydration, and expiry affordance.

## Demonstrated Cause

Backend data loss is repaired. The remaining Product contract is that the visible timer must reflect
the durable server deadline rather than create or extend an independent client expiry window.

## Reuse And Boundaries

- Reuse the existing Calendar action state, existing Undo control, backend result, and reverse
  mutation. Add no component, API, storage model, persistence record, route, DS primitive, CSS
  recipe, backend code, fixture, or dependency.
- Preserve current empty-target and stored-Rest Move/Undo behavior, native menu keyboard/focus
  behavior, runner-scope isolation, and unrelated dirty hunks.
- Do not cache/rehydrate a displaced workout, create redo, predict a successful undo, or change the
  Backend expiry, atomic contract, provenance, Calendar projection, or plan-source model.

## Definition Of Done

1. After Move → Replace, the Undo affordance is visible until the Backend-returned `undoExpiresAt`.
2. Reload hydration respects that same deadline and never silently extends it.
3. Undo succeeds exactly once when eligible and, after reload, both original rows are visible with
   no duplicate; expired/stale/protected failure clears the affordance truthfully.
4. Empty-target and stored-Rest regression flows remain unchanged.
5. Focused source checks plus desktop/mobile Light/Dark browser proof pass; independent named QA
   performs one bounded read-only replay when a fresh managed artifact is admissible.

## Execution Preflight

- **Mode / owner:** Tracked / FRONTEND Product. The persistence mutation is complete and owned by
  BACKEND; this is limited to its existing UI consumer.
- **Existing seam:** `src/components/calendar/manual-calendar-actions.ts` and its existing Calendar
  Undo affordance. Use the present backend response's `undoExpiresAt` directly.
- **New runtime artifacts:** none.
- **Simplification:** remove any client-side expiry extension that conflicts with the server
  deadline; keep the reverse event opaque.
- **Stop condition:** return to PRODUCT if the current Backend response cannot identify one durable
  undo event/deadline without reconstructing displaced-row data, or if a new backend field is needed.
- **Current discriminator:** successful reviewed replacement already returns `undoExpiresAt`, but
  `ManualWorkoutMoveController` discards that successful result before `onMoved`, while
  `manual-calendar-actions.ts` records Undo only for the direct `rest_day` branch and refreshes its
  stored deadline from `Date.now()`. This leaves occupied replacement without Undo and can extend
  displaced-target truth beyond the Backend deadline.
- **Smallest existing seams:** pass the existing successful confirm/direct result through the
  existing Move-controller callbacks, then record the existing inverse identifiers and expiry in
  `useManualCalendarActions`. Empty-target Move keeps its existing local grace because the Backend
  correctly returns no displaced-row expiry; stored-Rest and occupied replacements use only a
  valid future server deadline.
- **Dirty/runtime boundary:** preserve all existing standalone-Calendar hunks in both touched files
  and every foreign dirty path byte-for-byte. The current managed PID is stale, broken, and in
  `real` provider mode; no runtime or fixture action is admitted until source checks are stable and
  the shared runtime is rechecked idle.
- **Focused proof:** result-shape/type guards, direct/reviewed callback reachability, focused Product
  validators, formatting/lint/diff hygiene, uncontended production build, then a fresh managed
  `qa_fixture` replay for occupied, empty, and stored-Rest Move/Undo plus responsive, keyboard,
  focus, overflow, and console checks. Named QA performs one bounded independent replay afterward.

## Handoff Prompt

```text
ROLE: FRONTEND

Lane: Product

Task: Hito Runner Occupied Move Replace Undo Frontend Adoption

Mode: Tracked. Read AGENTS.md, agents/frontend.agent.md,
skills/hito-frontend-design-system/SKILL.md, and
skills/hito-qa-browser-regression/SKILL.md before acting.

Canonical item:
docs/tasks/backlog/2026-08-16-hito-runner-occupied-move-replace-undo-frontend-adoption.md

Backend evidence:
docs/tasks/backlog/2026-08-16-hito-runner-occupied-move-replace-durable-undo.md
src/lib/manual-workout-authoring/move-workout.ts

Outcome:
Use Backend-returned `undoExpiresAt` in the existing Calendar Undo affordance after occupied Move
→ Replace. The server remains the sole source of displaced-workout data and expiry truth. Do not
reconstruct, cache, or persist a displaced workout on the client.

Reuse existing Calendar action state, Undo UI, backend response, and reverse mutation. Add no
component, API, storage model, route, Design System primitive, CSS recipe, backend change, fixture,
or dependency. Preserve empty-target and stored-Rest Undo behavior, exact-once semantics,
runner-scope isolation, keyboard/focus behavior, and unrelated dirty work.

Prove occupied Move → Replace → reload → Undo → reload restores exactly the source and displaced
rows once, with no duplicate. Verify visible expiry, expiry cleanup, empty-target/stored-Rest
regressions, Escape/focus return, desktop/mobile Light/Dark containment, and clean console. Use one
bounded read-only QA sidebar review when a fresh managed artifact is admissible; do not delegate
Frontend implementation. Return a precise Backend boundary if current response data cannot support
the server-owned deadline.

Update only this canonical item with a compact English receipt. Do not start Global QA or claim
release readiness.
```

## Tracked Implementation Receipt — 2026-08-16

- **Task / stage:** Hito Runner Occupied Move Replace Undo Frontend Adoption; Frontend Product
  implementation and focused independent QA complete.
- **Preflight / demonstrated cause:** the completed Backend confirm and direct success responses
  already returned `undoExpiresAt`. The Product controller discarded the reviewed-confirm success,
  the Calendar action state recorded Undo only for the direct Rest branch, and reload/readback rebuilt
  expiry from `Date.now()`. The first incorrect owner was therefore the existing Product Move-result
  callback and Calendar Undo state seam, not Backend or Design System.
- **Product outcome:** occupied Move → Replace now records the existing opaque inverse identifiers
  with the exact valid Backend deadline. Reload hydration preserves that deadline without extension;
  reverse Undo remains exact-once and stores no displaced-workout data. Empty targets retain their
  existing local grace because Backend factually returns no displaced-row expiry; stored Rest and
  occupied targets use the server deadline. The independent review also exposed and then accepted a
  focused fix-forward that returns Escape focus from the replacement dialog to the still-rendered
  source action.
- **Files changed:** `src/components/calendar/manual-calendar-actions.ts`,
  `src/components/manual-workout/ManualWorkoutMoveControls.tsx`, and this lifecycle record. No new
  runtime artifact, component, API, storage model, route, CSS recipe, dependency, fixture, Backend,
  or Design System change was added.
- **Preserved boundaries:** the server remains the sole displaced-row and expiry authority; empty and
  stored-Rest Undo, runner-scoped session isolation, reverse-mutation behavior, Calendar projection,
  source provenance, and all unrelated dirty hunks remain owned by their existing seams.

| Check                              | Scenario / environment                                                             | Result                   | Evidence                                                                                                                                                                                                                                                                                 |
| ---------------------------------- | ---------------------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator               | Direct and reviewed success paths                                                  | Passed                   | Both runtime guards accept `undoExpiresAt`; the reviewed success reaches the shared existing Undo recorder; removed client expiry-refresh functions have zero reachability.                                                                                                              |
| Occupied durability                | Aug 17 Easy Run with Strides → occupied Aug 18 Distance Intervals; same-tab reload | Passed                   | Owner replay observed `45→37`; independent QA observed `45→44→43` and delta smoke `44→42`, with no reset or extension.                                                                                                                                                                   |
| Occupied exact-once Undo           | Undo then second reload                                                            | Passed                   | Source and displaced target each restored once; moved target, Undo, duplicate, and redo counts were zero.                                                                                                                                                                                |
| Server expiry cleanup              | Occupied replacement, owner replay                                                 | Passed                   | Undo began at `45` and was absent after 46.5 seconds while the persisted moved row remained; no client extension occurred.                                                                                                                                                               |
| Empty regression                   | Empty Aug 23, reload → Undo → reload                                               | Passed                   | Local grace decreased across reload; source restored once, target returned to factual Add-workout state, Undo cleared.                                                                                                                                                                   |
| Stored-Rest regression             | Stored Rest Aug 19, reload → Undo → reload                                         | Passed                   | Server countdown persisted; source and stored Rest restored once, Undo cleared.                                                                                                                                                                                                          |
| Keyboard and focus                 | Source menu and replacement dialog                                                 | Passed after fix-forward | Enter/Escape menu behavior remained intact; replacement dialog starts on Cancel and Escape returns focus to `More activity actions for Easy Run with Strides`, with no persistence.                                                                                                      |
| Responsive / themes / console      | 1470×801 Light and 375×812 Dark                                                    | Passed                   | Document and body matched viewport width; no page overflow or browser warnings/errors.                                                                                                                                                                                                   |
| Focused static checks              | Touched source and lifecycle                                                       | Passed                   | Prettier, focused ESLint, `validate-runner-calendar-context`, `validate-manual-workout-authoring`, scoped and checkout-wide `git diff --check`.                                                                                                                                          |
| Production build / managed runtime | Fresh `qa_fixture`                                                                 | Passed at admission      | Production build completed; final independent delta replay used healthy PID 73964 with `fresh/receipt_matches` and left it running. After proof, an external private Admin snapshot-marker change made status `stale/broken: artifact_missing`; the accepted replay preceded that drift. |
| Target type diagnostics            | Checkout-wide TypeScript diagnostic filtered to touched source                     | Existing gap             | Three pre-existing blocked-result `message` narrowing diagnostics remain in `ManualWorkoutMoveControls.tsx`; no new callback or `undoExpiresAt` diagnostic was introduced. Production build and focused validators passed.                                                               |

- **Independent QA:** the first review passed occupied/empty/Rest durability but failed replacement-
  dialog Escape focus return. The Product owner fixed that demonstrated local seam and the same named
  QA role independently passed the delta focus and occupied exact-once replay.
- **Omitted-check consequences:** physical mobile hardware, hosted state, Global QA, release, and
  deployment acceptance were not run or claimed. Exact 375×812 browser emulation covers responsive
  containment, not physical-device behavior. The running managed PID must be rebuilt before reuse
  because its post-proof private Admin snapshot marker no longer matches current checkout inputs;
  this does not invalidate the fresh admitted task replay.
- **Next owner:** PRODUCT for any broader cross-flow or release acceptance. **Blockers:** none for this
  Frontend implementation slice.

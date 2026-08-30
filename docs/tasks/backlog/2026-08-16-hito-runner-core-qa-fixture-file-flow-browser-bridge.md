# Hito Runner Core QA Fixture File-Flow Browser Bridge

## Work Item ID

10903e26-1827-45bd-bd8a-c18c583d08cf

## Status

completed

## Type

Tracked — local acceptance enablement

## Priority

high

## Owner

FRONTEND

## Epic

runner-core-readiness

## Parent

[Runner Core Roadmap](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)

## Depends On

[Backend QA Fixture FIT And Future Imported Workout Enablement](./2026-08-16-hito-runner-core-qa-fixture-fit-and-imported-workout-enablement.md)

## Evidence From

[Runner Core QA Audit And Defect Ledger](./2026-08-16-hito-runner-core-full-local-qa-audit-and-defect-ledger.md)

## Scope

The existing local `qa_fixture` branches of `CompletionPanel` and
`CalendarOverflowActions`: give browser QA a deterministic way to observe the same admitted
FIT/JSON file flows without an OS file chooser. This is local acceptance infrastructure, not a
new runner-facing feature.

## Archive Intent

Retain through final Runner Core QA replay, then compact to the local-only guard, browser evidence,
and terminal verdict.

## Task

After the Backend fixture admission is complete, bridge the existing UI to the same canonical
durable FIT upload/remove and Calendar JSON export/import actions through a small, explicit,
local-only `qa_fixture` control or readback. The normal file picker remains unchanged for runners.

## Demonstrated Boundaries

- `CompletionPanel` returns a local unsaved preview under the existing fixture gate.
- `CalendarOverflowActions` uses a download anchor and hidden input; the supported browser controller
  cannot retrieve or populate them.
- The accepted sample and server-path contract are established by the Backend predecessor. This item
  must not invent a file payload, mock a response, or create a second mutation path.

## Required Outcome

QA can, on loopback `qa_fixture` only, observe a durable FIT upload/readback/removal and a truthful
future-Calendar JSON export plus import readback through the same admitted product actions. The
controls must be absent or inert outside `qa_fixture`, must not expose file bytes or private data,
and must not alter the ordinary runner file-picker/download experience.

## What Not To Touch

Backend persistence/read models, schema/migrations/RLS, production routes, hosted/provider paths,
Design System, Admin, iPad/native drag, general browser tooling, Git lifecycle, or a generic testing
framework. Do not add a plan container or client-derived Calendar substitute.

## Validation Expectations

Focused source validation and a local `qa_fixture` browser replay after serialized runtime admission:
FIT upload/reload/remove; imported future edit/review/confirm/reload; export shape and import
readback; keyboard/focus/containment/console; cleanup. Final independent QA owns the full ledger
verdict.

## Frontend Execution Preflight — 2026-08-16

- **Accepted outcome and discriminator:** the Backend predecessor already admits the exact
  `localQaFixture=sample-fit-from-zip.fit` multipart marker through the canonical workout-result
  upload route. The current Frontend fixture branch instead returns
  `buildLocalActivityFileDesignFixture()` and explicitly says that nothing was uploaded or saved.
  Calendar export/import is already owned by the future-Calendar download route and
  `uploadCalendarPlanJson`, but the current browser surface exposes them only through an attachment
  anchor and hidden file input.
- **Existing seams to reuse:** `WorkoutFeedbackPanel` and `WorkoutActivityFileDialog` for the
  durable upload/readback/remove lifecycle; the current home-route server fixture gate passed
  through `Index` and `Calendar`; and `CalendarOverflowActions` for the existing export route,
  imported-plan save action, menu, toast, focus, and busy-state composition.
- **Smallest behavior change:** replace the fixture-only file chooser preview with an explicit
  fixture-only button that submits the admitted marker through `/api/workout-result/upload`. Add one
  fixture-only Calendar menu action that fetches the exact existing future-Calendar JSON response
  and passes that unchanged response text to `uploadCalendarPlanJson`, reporting only the returned
  title/workout count and never the payload bytes.
- **New production runtime artifacts:** none. No route, component, helper file, state store,
  persistence path, payload model, fixture, token, CSS recipe, or dependency is proposed.
- **Removed or simplified responsibility:** remove the superseded unsaved FIT preview builder use,
  dialog-local preview state, preview-only removal branch, and false preview-only copy. Ordinary
  picker/download behavior remains unchanged outside the existing fixture gate.
- **Dirty boundary:** `Calendar.tsx`, `route-data-actions.ts`, and `routes/index.tsx` contain accepted
  standalone-Calendar/settings work. This item changes only separate gate-propagation call sites in
  those files. Backend predecessor hunks in the upload route and workout-result types are read-only.
- **Focused proof:** source reachability must show no active unsaved preview path; local controls
  must be gate-bound; focused Prettier, ESLint, Product validators, and diff hygiene must pass. After
  serialized fresh runtime admission, browser proof covers durable FIT upload/reload/remove and
  exact export-to-import readback, keyboard/focus, containment, console health, and ordinary cleanup.
- **Return condition:** stop for any required Backend, persistence, Design System, hosted, or
  non-`qa_fixture` behavior change. Final Runner Core ledger acceptance remains an independent QA
  handoff.

## Stage

FRONTEND Product implementation complete — returned to PRODUCT for the final Runner Core QA ledger

## Next Recommended Role

PRODUCT

## Frontend Tracked Implementation Receipt — 2026-08-17

### Preflight and outcome

- The accepted Backend marker already routed the canonical FIT sample through the durable ingestion
  owner, while the old Frontend fixture branch fabricated an unsaved preview and Calendar JSON was
  exposed only through OS-dependent attachment controls.
- The existing `WorkoutFeedbackPanel`, `WorkoutActivityFileDialog`, workout-actions menu,
  `CalendarOverflowActions`, home/workout loader gate, upload route, future-Calendar export route,
  and imported-plan save action remained the owners. New runtime artifacts: none.
- The local-only UI now submits the admitted FIT marker through the canonical upload route, exposes
  the existing dialog for the seeded future imported workout, and sends the exact existing Calendar
  export response text to the existing import action. No file bytes or JSON payload are rendered.
- The superseded fake preview builder/state/copy and preview-only remove branch were deleted.
  Normal runner picker/download behavior remains unchanged outside the authenticated loopback
  `qa_fixture` gate.

### Root-cause fix-forward

- Browser replay proved that the future fixture workout initially had no trigger for the existing
  Activity file dialog. One fixture-gated item was added to the existing workout-actions menu.
- The menu item disappeared before dialog auto-focus, so the fallback return target became
  `document.body`. The existing workout-actions trigger ref is now shared with the existing dialog
  close-focus seam.
- Durable removal correctly retained derived metrics while setting `rawFileAvailable=false`, but
  `AttachedEvidenceReadback` treated any retained asset row as a still-attached raw file. Attached
  chrome and removal affordances now require the existing `rawFileAvailable` fact; derived observed
  run and comparison readbacks remain visible.

### Files changed

- `src/components/CompletionPanel.tsx`
- `src/components/workout-completion/WorkoutActivityFileDialog.tsx`
- `src/components/Calendar.tsx`
- `src/components/calendar/CalendarOverflowActions.tsx`
- `src/lib/local-activity-file-design-fixture.ts`
- `src/lib/route-data-actions.ts`
- `src/routes/index.tsx`
- `src/routes/workout.$date.tsx`
- this canonical item

All overlapping standalone-Calendar/settings hunks and unrelated dirty paths were preserved.
Backend, schema, migrations, RLS, fixture source, provider behavior, Design System, Admin, hosted
state, dependencies, and Git lifecycle were not changed.

### Validation

| Check                         | Scenario / environment                                            | Result                    | Evidence                                                                                                                                                                                                               |
| ----------------------------- | ----------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source reachability           | Focused affected-source census                                    | Passed                    | No active fake preview builder/state/copy remains; local controls flow from one authenticated loopback fixture gate.                                                                                                   |
| Focused formatting/lint       | Prettier and ESLint on affected Product files                     | Passed                    | No formatting or lint errors.                                                                                                                                                                                          |
| Product contracts             | `validate-product-contracts`; `validate-manual-workout-authoring` | Passed                    | Workout comparison and manual review invariants passed; the manual harness remained non-mutating.                                                                                                                      |
| Diff hygiene                  | Task-scoped `git diff --check`                                    | Passed                    | No whitespace errors.                                                                                                                                                                                                  |
| Type diagnostics              | Full `tsc` output filtered to affected paths                      | Passed with checkout note | No new task-owned ref/raw-file diagnostics; unrelated pre-existing route diagnostics remain in the dirty checkout.                                                                                                     |
| Production build              | Serialized managed `qa_fixture` build                             | Passed                    | Client, SSR, Nitro, postbuild integrity, and fresh `receipt_matches` admission completed.                                                                                                                              |
| Imported workout              | Desktop Light                                                     | Passed                    | Seeded `file_import` workout completed edit, Backend review, save, and reload while structure/provenance passthrough remained.                                                                                         |
| Durable FIT lifecycle         | Desktop and exact 375×812, Light/Dark                             | Passed                    | Canonical marker upload returned 200; reload retained raw/reprocessing availability and factual metrics/comparison; ordinary remove returned 200; reload hid attached/remove chrome while preserving derived readback. |
| Calendar JSON bridge          | Desktop/mobile, keyboard and pointer                              | Passed                    | Exact future-Calendar export GET and existing import server action returned 200; Plans showed one factual record; Calendar remained unchanged; record was hidden through the ordinary action.                          |
| Accessibility and containment | Desktop/mobile dialogs and menus                                  | Passed                    | Escape returns focus to the exact workout/Calendar action triggers; viewport and document widths match; no console or page errors.                                                                                     |
| Cleanup                       | Disposable `isolation-a` fixture                                  | Passed                    | After the unrelated lease released, canonical pool reset returned every owned table to zero.                                                                                                                           |

### Coverage boundaries and next owner

- The named QA reviewer first found the focus and removed-file presentation defects; both were fixed
  forward and its fresh focused delta verdict was **Passed**.
- The managed server remains healthy, loopback, `qa_fixture`, and running. Later unrelated checkout
  movement changed freshness to `stale/executable_inputs_changed` after the accepted evidence; this
  does not replace the earlier receipt-matching proof and requires a fresh admission before any new
  browser claim.
- Real OS file chooser assignment, hosted/provider behavior, real iPad/Safari, the full Runner Core
  ledger, Global QA, release, and deployment were not claimed here.
- PRODUCT owns dispatch of the final independent Runner Core QA ledger replay.

Blockers: none for the assigned Frontend implementation slice.

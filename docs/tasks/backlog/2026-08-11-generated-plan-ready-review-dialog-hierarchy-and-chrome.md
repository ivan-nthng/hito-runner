# Generated Plan Ready Review Dialog Hierarchy And Chrome

## Work Item ID

2026-08-11-generated-plan-ready-review-dialog-hierarchy-and-chrome

## Status

completed

## Type

visual-polish

## Priority

medium

## Owner

frontend

## Frontend Lane

Product

## Mode

Lite

## Scope

Only the ready/review state of the generated-plan dialog in
`src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`: its one dialog header, title/date/
copy composition, and ready-state footer action. This does not authorize a shared Dialog, shared
Dialog CSS, generated-plan data, preview creation, or other dialog consumer change.

## Archive Intent

retain_in_place

## Task

Apply six compatible Inspector corrections to the existing generated-plan **ready/review** dialog
hierarchy. Make its title hierarchy cleaner, move the start date beneath the plan title, remove the
specified redundant labels/copy/action, and remove the header divider only on this one instance.
Use existing Hito typography and composition utilities. Preserve review, focus, keyboard, preview
data, loading/error, and Add-to-Calendar behaviour.

## User Report

Inspector captured `/`, dark, `1470×801`, in the generated-plan ready/review dialog. Ivan requests:

1. Remove the ready-state `Generated plan` micro-label.
2. Render `10K plan` with the existing UI page-title typography role.
3. Move `Starts Jun 29, 2026` directly below the plan title.
4. Remove `Review the saved plan before adding its workouts to Calendar.` from this ready header.
5. Remove the bottom divider from this header only.
6. Remove the ready-state `Refresh preview` button only.

## Evidence

- The original six-item Inspector packet is retained at
  `docs/tasks/backlog/assets/2026-08-11-generated-plan-ready-review-dialog-hierarchy-and-chrome/inspector-batch.txt`.
- Item IDs: `c4511a43-6a92-43dc-b7f1-9abaa390c8b3`,
  `0fc10638-4da1-4ca2-be04-53972c97b7e2`,
  `b72a6944-21ea-49e5-81b1-67f94d1d85c2`,
  `563cc232-0ab2-4750-aa7c-0754575a3bf6`,
  `e137b75e-ae73-48b2-9e63-c0b76103f2cf`, and
  `88a2c228-2e06-4006-a364-16c835393d71`.
- `SelectedTenKPlanPreviewDialog.tsx:335-389` owns the ready/review header. The micro-label is at
  `:360-362`; title at `:363`; right-column start copy at `:365-367`; ready-only description at
  `:373-382`.
- `SelectedTenKPlanPreviewDialog.tsx:284-310` owns the ready footer. Its secondary
  `Refresh preview` Button is at `:293-303`.
- `readyFocusTargetRef` currently attaches to the Refresh Button. Removing it must move that ref to
  the existing primary Add-to-Calendar Button, not remove focus restoration.
- `DialogHeader` adds no divider. Shared `.hito-product-dialog-header` CSS adds the divider at
  `src/styles/overlays-feedback.css:381-385` and has many consumers. This item must use the
  existing route instance's `border-b-0` utility instead; it must not change the shared class.
- The parent `description` prop remains used by compact/error header markup at `:202-211`.
  `onRefresh` remains used for error recovery (`Try again`) at `:314-326`.

## Source Investigation And Demonstrated Cause

These are route-local composition choices in one ready-review header/footer, not six Design System
defects. The border comes from a shared class, but the Inspector scope is only this instance and
the existing instance utility can own its removal. The first correct owner is FRONTEND Product;
shared Dialog, Button, typography, and CSS contracts must remain unchanged.

## Exact Existing Seams And Required Edits

Only `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx` may change.

1. **Ready header — lines 357-389**
   - Remove only the ready-state `p.hito-micro-label` whose text is `Generated plan`.
   - Change only the ready `DialogTitle` typography class from `hito-ui-modal-title` to existing
     `hito-ui-page-title`. Preserve DialogTitle semantics, `break-words`, and title text.
   - Move the unchanged start-copy paragraph into the same left `div.min-w-0`, directly after the
     title. Retain its text, `hito-ui-section-title`, and `break-words`; remove only its former
     desktop-right alignment utility and now-unneeded two-column grid composition.
   - Remove only the ready-header DialogDescription and the now-unused `description` parameter from
     `GeneratedPlanReadyReviewHeader` plus that function's call-site argument. Keep the parent
     dialog `description` prop and compact/error branch intact.
   - Add only existing `border-b-0` to this ready DialogHeader instance. Do not use `!important`,
     CSS, a custom selector, or change `.hito-product-dialog-header`.

2. **Ready footer — lines 284-310**
   - Remove only the `Refresh preview` HitoButton from the successful ready-review footer.
   - Move `readyFocusTargetRef` to the unchanged primary Add-to-Calendar HitoButton.
   - Retain `onRefresh`, loading state, error/retry branch, saved-plan caption, and all existing
     primary Button disabled/loading/click semantics.

## Expected Behavior

- Ready dialog: the plan title uses `hito-ui-page-title`; its start date is immediately beneath it;
  factual range/modifier copy follows.
- Ready dialog: no `Generated plan` label, descriptive sentence, header bottom divider, or Refresh
  preview action.
- Compact/loading/error branches retain current title, description, close/retry, and `onRefresh`
  behaviour.
- The existing primary Add-to-Calendar Button receives the review-ready focus target and remains
  fully functional.
- Dimensions, padding, close control, scrolling, focus trap, `aria-*` semantics, provider
  boundary, saved-plan persistence, and preview data remain unchanged.

## Reuse-First Change Budget

- Existing seam: SelectedTenKPlanPreviewDialog ready-header and ready-footer JSX.
- Existing DS contracts: DialogTitle, `hito-ui-page-title`, `hito-ui-section-title`, `border-b-0`,
  and the existing primary HitoButton.
- New production artifacts: none.
- Removed responsibility: four route-local ready-view nodes, one ready-only secondary action, and
  one unnecessary right-column composition. No shared component is retired.

## What Not To Touch

- `src/components/ui/dialog.tsx`, `src/styles/overlays-feedback.css`, shared Dialog/Button/
  typography source, Figma, `/hitoDS`, other Product dialogs, or generated-plan header model text.
- `onRefresh` error recovery, parent `description` prop, compact/loading/error branch copy, ready
  footer primary action, plan preview data, persistence, backend, auth, providers, or unrelated
  dirty work.
- Do not add a wrapper, helper, CSS, token, arbitrary value, compatibility path, replacement
  border, or substitute action.

## Focused Validation Expectations

| Check            | Scenario / environment                                           | Required evidence                                            |
| ---------------- | ---------------------------------------------------------------- | ------------------------------------------------------------ |
| Ready hierarchy  | Ready review, desktop and 375×812, light/dark                    | Requested nodes absent; title/date stack; no overflow        |
| Dialog behaviour | Keyboard focus, Escape, close, restoration                       | Primary action receives ready focus; focus trap stays usable |
| Branch isolation | Compact/loading/error states                                     | Description and `onRefresh` retry remain where they belong   |
| Static           | Focused formatter, lint, diff hygiene; build only if uncontended | Only this TSX and lifecycle item change                      |

## Promotion Condition

Promote and stop only if existing `border-b-0` cannot override this one header's shared border
without shared CSS, or if UI page-title conflicts with DialogTitle semantics/geometry and needs
Design System ownership.

## Exact Frontend Handoff

```text
ROLE: FRONTEND

Frontend Lane: Product
Mode: Lite

Execute the ready canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-generated-plan-ready-review-dialog-hierarchy-and-chrome.md`

Read `AGENTS.md`, `agents/frontend.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write. Read
`skills/hito-qa-browser-regression/SKILL.md` only for the required browser proof.

Change only `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`, at the exact
ready/review header and ready-footer seams stated in the item. Remove only the four requested
ready-view nodes, replace only the ready title's typography class with `hito-ui-page-title`, move
the unchanged start copy below that title, use only `border-b-0` on this ready DialogHeader instance,
and move `readyFocusTargetRef` to the unchanged primary Add-to-Calendar Button.

Do not edit shared Dialog, Button, typography, CSS, or generated-plan model sources. Do not change
compact/loading/error branches, error-retry `onRefresh`, provider/persistence behaviour, preview
data, or unrelated dirty work. Add no artifact, wrapper, helper, state, token, CSS, or compatibility
path.

Verify the ready hierarchy and primary-action focus at desktop and exact 375×812 in light/dark;
verify compact/loading/error branch isolation, keyboard focus/Escape/close, no overflow, and console
health. Run focused static checks. Build only if uncontended. Do not stage, commit, push, deploy,
access hosted state, call providers, or mutate product data. Russian commentary; English final receipt.
```

## Lite Closure Receipt

- **Outcome:** completed the six ready-review hierarchy/chrome corrections in the existing
  `SelectedTenKPlanPreviewDialog` seam. The ready title now uses `hito-ui-page-title`, the unchanged
  start date is directly beneath it, and the requested micro-label, description, divider, and
  ready-only refresh action are absent. The existing Add-to-Calendar action owns ready focus.
- **Focused fix-forward:** the first browser replay exposed Radix's missing-description warning
  after the visible ready description was removed. The ready `DialogContent` now explicitly omits
  `aria-describedby`; compact/loading/error states retain their existing `DialogDescription` links.
- **Files changed:**
  `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx` and this lifecycle item only.
- **New runtime artifacts:** none. Shared Dialog, Button, typography, CSS, model, provider, and
  persistence owners were not changed.

| Check                        | Scenario / environment                                             | Result                       | Evidence                                                                                                                                                                                                                                                               |
| ---------------------------- | ------------------------------------------------------------------ | ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ready hierarchy              | Local `qa_fixture`, `1470x801`, light and dark                     | Passed                       | `10K plan` remained an `h2` with `hito-ui-page-title`; `Starts Jun 29, 2026` was its immediate sibling; the micro-label, ready description, and ready refresh action each had zero rendered matches.                                                                   |
| Ready chrome and containment | Local `qa_fixture`, `1470x801` and exact `375x812`, light and dark | Passed                       | Header computed `border-bottom-width: 0px`; document and dialog horizontal overflow were both `0`; visual screenshots confirmed the title/date stack and single-column mobile containment.                                                                             |
| Focus and keyboard           | Ready open, Tab, Escape, and Close                                 | Passed                       | Add to Calendar received initial focus; Tab stayed inside the focus trap; Escape and Close dismissed the dialog and restored focus to Review plan. Add to Calendar was not invoked.                                                                                    |
| Branch isolation             | Source audit plus loading-state runtime observation                | Passed with bounded coverage | Loading and compact descriptions remain; `onRefresh` remains bound to error `Try again`. A failure was not fabricated, so the retry branch has source rather than forced runtime evidence.                                                                             |
| Console health               | Fresh bounded `qa_fixture` runtime after the ARIA fix              | Passed                       | Browser warning/error inventory was empty before and after ready transition.                                                                                                                                                                                           |
| Static and build             | Focused TSX checks and uncontended compile                         | Passed                       | Prettier, ESLint, and `git diff --check` passed. The production build compiled successfully; its final canonical server-start step declined because another owner already occupied port 3000, so proof used an isolated loopback runtime from the same fresh artifact. |

Two ordinary local `qa_fixture` ready-preview runs created their expected immutable saved-plan
provenance records for the named QA identity. The incompatible runtime attempt was cancelled and
reported `Nothing was created or saved.` No Add-to-Calendar action was invoked and no Calendar
workouts were materialized. The temporary proof runtime was stopped; the unrelated owner process
was not modified.

Implementation DoD is complete. Global QA Acceptance and release readiness remain unclaimed.

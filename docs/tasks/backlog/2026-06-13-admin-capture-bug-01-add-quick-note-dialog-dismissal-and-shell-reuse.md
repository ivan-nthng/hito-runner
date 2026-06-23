# Bug 01: Add Quick Note Dialog Dismissal And Reusable Product-Form Dialog Shell

## Status

backlog

## Type

bug

## Priority

high

## Next Recommended Role

frontend

## Task

Fix `Add quick note` dialog dismissal and extract a reusable product-form dialog shell with fixed
header/footer and customizable body content.

## Stage

FRONTEND implementation / admin quick-note dialog dismissal and shell reuse.

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Fix the `/admin/capture` Add quick note dialog so `Cancel` and outside-click dismissal both close
it correctly, then shape the same anatomy into a reusable product-form dialog shell with a fixed
header/footer and customizable body content.

Stage:
FRONTEND implementation / quick-note dialog dismissal and reusable product-form dialog shell.

Context:
The current Add quick note form has the right visual grammar: stable header, calm body, and footer
actions. But the dialog currently fails basic dismissal behavior: clicking `Cancel` does nothing,
and clicking outside the dialog also does nothing. The user wants this anatomy preserved and reused
as a general shell where only the middle content is customized.
```

## Severity

high

## Owner

FRONTEND

## Reported

2026-06-13

## User Report

In `/admin/capture`, opening `Add quick note` shows a dialog whose structure feels right, but:

- clicking `Cancel` does nothing
- clicking outside the dialog does nothing

The user likes this anatomy and wants to reuse it as a standard pattern:

- header stays
- footer stays
- middle content should be customizable

## Evidence

- Screenshot:
  [add-quick-note-dialog.png](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/backlog/assets/2026-06-13-admin-capture-bug-01-quick-note-dialog-dismissal-and-shell-reuse/add-quick-note-dialog.png)

## Observed Behavior

The `Add quick note` dialog appears visually coherent, but the dismissal contract is broken:

- `Cancel` does not close the dialog
- outside-click dismissal does not close the dialog

At the same time, the visual shell itself reads like a useful reusable pattern for product/admin
forms.

## Expected Behavior

- `Cancel` should close the dialog immediately
- outside click should dismiss the dialog when the product has not explicitly chosen a non-dismissable modal
- the visual shell should be reusable with:
  - fixed header
  - fixed footer/actions
  - customizable body content

## Source Investigation

- The current admin surface owns the `Add quick note` trigger and dialog in
  [admin.capture.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.capture.tsx).
- Existing modal normalization work already points toward one product-dialog contract using
  `Dialog`, `hito-dialog-overlay-stable`, and `hito-product-dialog`.
- The likely reusable name for this pattern is:
  - product language: `Product form dialog`
  - code/DS language: `HitoProductDialog` shell
- This bug should not invent a new modal framework. It should reuse the existing Hito dialog
  contract and, if needed, expose a small reusable shell around header/body/footer slots.

## Likely Root Cause

Frontend route-local dialog open/close wiring is likely fighting the shared `Dialog` dismissal
contract, while the reusable shell has not yet been formalized as one bounded DS/product wrapper.

## Recommended Fix Direction

Fix dismissal behavior first through the existing `Dialog` contract. Then, if the same anatomy is
already repeated enough, extract a small reusable shell around:

- header slot
- body/content slot
- footer/actions slot

Use the existing Hito modal naming and avoid creating a second visual system.

## What Not To Touch

- backend quick-note persistence semantics
- admin backlog importer/runtime contract
- route-spanning debugger/capture overlay future work
- unrelated `/admin/capture` runtime blockers outside this dialog behavior

## Validation Expectations

- `Add quick note` opens correctly
- clicking `Cancel` closes the dialog
- clicking outside the dialog closes it unless the accepted contract explicitly forbids outside dismissal
- the reused shell keeps the same header/footer grammar
- body/content can vary without rebuilding the full dialog structure each time

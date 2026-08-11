# Local Inspector Sidebar Layout Non-Interference

## Work Item ID

2026-08-09-local-inspector-sidebar-layout-noninterference

## Status

closed

## Type

bug

## Task

Establish and, only if the replay proves a defect, restore the invariant that enabling the local
Inspector is a visual overlay and does not move the product sidebar's lower menu group.

## Stage

Frontend DevTools geometry non-reproduction complete; no layout mutation made.

## Issue Category

layout_regression

## Severity

medium

## Priority

medium

## Human Priority

normal

## Owner

frontend

## Frontend Lane

DevTools

## Scope

local-ui-inspector-noninterference

## Archive Intent

retain_in_place

## Reported

2026-08-09

## User Report

Enabling DevTools appeared to shift the site menu upward. DevTools must overlay the product and
must never influence its layout.

## Evidence

- [Generated local Inspector batch](assets/2026-08-09-local-inspector-batch/inspector-batch-report.txt)
  records the selected product target `div.mt-auto.flex.flex-col` and the non-interference request.
- [Captured Inspector overlay](assets/2026-08-09-local-inspector-batch/button-and-overlay.png)
  shows the local composer over the Workout page and the lower sidebar group.
- The product target is the lower AppShell group at
  [AppShell.tsx:208](../../../src/components/AppShell.tsx:208), inside the fixed-height desktop
  sidebar at [lines 179–180](../../../src/components/AppShell.tsx:179).
- RootShell mounts `LocalDevtoolMount` as a body sibling after product children at
  [\_\_root.tsx:78](../../../src/routes/__root.tsx:78); the enabled Inspector portals to
  `document.body` and uses fixed positioning at
  [use-local-ui-inspector-portal-host.ts:3](../../../src/components/devtools/use-local-ui-inspector-portal-host.ts:3)
  and [LocalUiInspector.tsx:520](../../../src/components/devtools/LocalUiInspector.tsx:520).

## Observed Behavior

The batch reports vertical movement of the lower sidebar menu group when DevTools is enabled. The
provided capture alone does not contain before/after geometry, so it does not yet distinguish a real
layout mutation from an unrelated viewport, theme, shell-state, or capture-time difference.

## Expected Behavior

At the same route, viewport, and theme, the sidebar lower group keeps the same geometry before and
after enabling or disabling the Inspector. Inspector controls and panels overlay it without becoming
flex-layout participants.

## Source Investigation

Current source already fulfills the intended portal architecture: the Inspector is an independent
`document.body` portal whose root and hit layer are fixed. The selected AppShell group has no
Inspector conditional or dependency. Source therefore rules out a straightforward flex-child cause,
but cannot prove the reported before/after runtime geometry.

The completed [Local Inspector Viewport Launcher And Calendar Selection Regression](2026-07-24-local-inspector-viewport-launcher-and-calendar-selection-regression.md)
established portal independence for the launcher and product dialogs, but did not test the sidebar
group's rectangle. It is related, not a duplicate.

## Likely Root Cause

Non-reproduced. At the same route, viewport, and theme, the sidebar lower-group rectangle was
identical with Inspector off and on. The runtime also confirmed the Inspector root is a fixed child
of `document.body`. No incorrect AppShell, route-layout, or DevTools layout owner was demonstrated;
the original capture cannot establish product movement.

## Recommended Fix Direction

First add no layout workaround. Replay the reported toggle with geometry evidence, then correct only
the actual owner if the non-interference invariant fails.

## What Not To Touch

- Do not change `AppShell`, sidebar spacing, or product route layout before a failed geometry replay.
- Preserve the body portal, fixed overlay semantics, loopback-only gate, lazy load, and non-mutating
  local Inspector contract.
- Do not change product data, APIs, auth, fixtures, providers, hosted state, or deployment.

## Definition Of Done

A same-viewport replay establishes the sidebar geometry result. If a defect is reproduced, the
smallest demonstrated owner-level correction makes the lower sidebar group invariant across the
Inspector toggle while keeping Inspector controls usable as overlays; if not reproduced, the item is
closed with the rect evidence and no speculative product-layout change.

## Validation Expectations

- On the reported route, record `getBoundingClientRect()` for the sidebar lower group before and
  after the Inspector toggle at the same desktop viewport and theme.
- Record Inspector root parent and computed positioning in the same replay, then verify overlay
  controls remain usable and product sidebar interaction still works.
- Preserve the loopback-only availability boundary. Use an independent DevTools QA subagent for a
  reproduced correction; a non-reproduction must retain the geometry receipt.

## Next Recommended Role

none; the geometry discriminator closed as a non-reproduction.

## Frontend Evidence Receipt

- Source inspection shows the intended independent `document.body` portal, fixed Inspector root,
  hit layer, and highlights, with no Inspector dependency in the AppShell lower group. This task made
  no AppShell, sidebar, product-route, navigation-card, shared Design System, or layout CSS change.

| Check                            | Scenario / environment                                              | Result                    | Evidence                                                                                                                                    |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Inspector off                    | `/workout/2026-08-06?tab=overview`, Safari, 1280 x 145, light theme | Passed                    | Sidebar lower group `x=0, y=197.203125, w=239, h=282`; Inspector root absent.                                                               |
| Inspector on                     | Exact same route, viewport, and theme                               | Passed                    | Sidebar lower group `x=0, y=197.203125, w=239, h=282`; root parent `BODY`, computed `position: fixed`, root `x=1220, y=85, w=40, h=40`.     |
| Geometry delta                   | Off versus on                                                       | Passed / non-reproduction | `x`, `y`, `width`, and `height` deltas are all `0`; no product movement reproduced.                                                         |
| Overlay usability and boundaries | Toggle plus Pencil runtime replay                                   | Passed                    | Toggle, launcher, Pencil hit layer, composer, target highlights, and exit remained usable; loopback-boundary assertions passed.             |
| Independent review               | Read-only DevTools QA subagent                                      | Passed                    | Confirmed the zero-delta discriminator, body portal/fixed positioning, and that no Inspector-owned AppShell/layout correction is warranted. |

- The geometry receipt is intentionally one fixed route/viewport/theme discriminator, not a broad
  visual matrix or Global QA Acceptance. It is sufficient to close the reported movement as a
  non-reproduction under its stated conditions.
- The shared dirty tree contains unrelated concurrent AppShell work; the Inspector task neither
  authored nor modified it. No speculative product-layout compensation was made.
- After the receipts were captured, the managed runtime stopped because a concurrent private Admin
  snapshot digest made the build-integrity status stale. No post-stop replay was required for this
  already captured same-viewport comparison.

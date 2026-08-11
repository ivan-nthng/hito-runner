# Local Inspector Composite-Link Deep Selection

## Work Item ID

2026-08-09-local-inspector-composite-link-deep-selection

## Status

completed

## Type

bug

## Task

Make Pencil mode select the intended deepest auditable descendant inside a composite linked
surface when one exists, while preserving an intentional whole-link selection path for that
surface's own chrome.

## Stage

Frontend DevTools browser runtime evidence closure complete.

## Issue Category

interaction_defect

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

local-ui-inspector-target-resolution

## Archive Intent

retain_in_place

## Reported

2026-08-09

## User Report

When using the Inspector pencil on the Previous/Next workout card, the Inspector selects the
entire object and cannot select its nested parts.

## Evidence

- [Generated local Inspector batch](assets/2026-08-09-local-inspector-batch/inspector-batch-report.txt)
  records target `a.hito-nav-card` on `/workout/2026-08-06?tab=overview` and the request to select
  nested components.
- [Captured whole-card selection](assets/2026-08-09-local-inspector-batch/nav-card-selection.png)
  shows the Inspector highlight around the full Previous/Rest card.
- The route renders the complete card as one `<Link className="hito-nav-card">` with nested top and
  title elements at [workout.$date.tsx:908](../../../src/routes/workout.$date.tsx:908).
- Pencil resolves the target behind its fixed hit layer through `document.elementFromPoint` at
  [LocalUiInspector.tsx:881](../../../src/components/devtools/LocalUiInspector.tsx:881). Its resolver
  previously stopped precision traversal at an interactive host and then prioritized the nearest
  `a` or `button`; the corrected resolver is at
  [lines 721–825](../../../src/components/devtools/LocalUiInspector.tsx:721).

## Observed Behavior

Clicking non-text descendants such as the icon, layout container, padding, or chrome inside the
linked navigation card selects the wrapping `a.hito-nav-card`. The item compositor therefore cannot
describe the nested target independently.

## Expected Behavior

For a composite link, a click on a nested auditable descendant selects that deepest target when it
is meaningful; a deliberate click on the card's own surface/chrome can still select the full link.

## Source Investigation

`findPreciseInspectableDescendant` returns no descendant once it encounters the wrapping anchor,
and `resolveInspectableElement` then immediately chooses `target.closest("button, a, …")`. This is
why non-text descendants under the `hito-nav-card` deterministically resolve to the whole Link.
Text leaf selection has a different path and was not shown failing by this batch.

The completed [Local Inspector Viewport Launcher And Calendar Selection Regression](2026-07-24-local-inspector-viewport-launcher-and-calendar-selection-regression.md)
proved a nested calendar-text case, not descendants within an anchor host; it is related evidence,
not a duplicate.

## Likely Root Cause

Confirmed: the Inspector's target-resolution precedence treats the enclosing interactive host as an
atomic selection before considering non-text descendants. The first incorrect owner is the local
Inspector resolver/hit-testing seam.

## Recommended Fix Direction

Refine the Inspector's existing target-resolution contract to distinguish meaningful nested targets
inside composite interactive hosts from clicks on the host's surface itself. Keep normal product
navigation semantics independent from Pencil mode.

## What Not To Touch

- Do not change the Workout route, its Link semantics, navigation behavior, or `hito-nav-card` CSS.
- Do not change shared Hito DS primitives, product data, APIs, auth, fixtures, providers, or
  deployment.
- Preserve the Inspector's loopback-only, lazy, in-memory, non-mutating session and prompt contract.
- Preserve whole-card selection where the user intentionally targets card chrome.

## Definition Of Done

The Inspector distinguishes nested auditable descendants from the enclosing navigation card on the
reported route, without swallowing normal navigation after Inspector exit or regressing duplicate
draft detection and whole-card capture.

## Validation Expectations

- Replay Pencil selection on `/workout/2026-08-06?tab=overview` for title/label, icon or inner
  chrome, and intentional card-surface click points; record the selected selector and highlight
  rectangle for each.
- Verify normal Link navigation after Inspector exit, duplicate-item behavior, and local loopback
  isolation.
- Use exact 375px only if the resolved selection path differs by viewport; otherwise document why
  the desktop replay covers it.
- Include an independent bounded QA subagent review and proportional DevTools build/runtime proof.

## Next Recommended Role

none; Implementation DoD is complete. Global QA remains separate and unassigned.

## Frontend Implementation Receipt

- Execution preflight confirmed the first incorrect owner as the Local Inspector resolver/hit-testing
  seam. The correction keeps exact text-leaf selection, resolves a stable Hito-marked descendant
  inside a composite control before control fallback, and preserves direct host-surface selection.
  This task made no Workout Link, navigation-card DOM/CSS, AppShell/sidebar, shared Design System,
  product-data, auth, provider, persistence, or hosted-state change.
- Browser Path Preflight exhausted supported local surfaces without a user approval dependency. The
  built-in path's earlier reload policy failure was followed by Safari geometry evidence. A raw
  browser bridge was abandoned immediately when the platform presented a permission dialog. The
  supported browser-client surface then supplied the deep-selection and navigation receipts against
  the current managed loopback build.

| Check                           | Scenario / environment                                            | Result | Evidence                                                                                                                                                                                                                                                                        |
| ------------------------------- | ----------------------------------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Nested text target              | `/workout/2026-08-06?tab=overview`, 1280 x 720, real Pencil click | Passed | Selected `span.hito-nav-card-label`; selector `div > div > div:nth-of-type(3) > a:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(2)`. Target and highlight both measured `x=461.4453125, y=612.421875, w=61.1015625, h=12`.                                             |
| Meaningful inner chrome         | Same route and viewport, real Pencil click                        | Passed | Selected `span.hito-nav-card-arrow`; selector `div > div > div:nth-of-type(3) > a:nth-of-type(1) > div:nth-of-type(1) > span:nth-of-type(1)`. Target and highlight both measured `x=297, y=604.421875, w=28, h=28`.                                                             |
| Intentional whole-card surface  | Same route and viewport, real Pencil click at `x=285, y=640`      | Passed | Underlying hit target was `a.hito-nav-card[href="/workout/2026-08-05"]`; selected selector `div:nth-of-type(1) > main > div > div > div:nth-of-type(3) > a:nth-of-type(1)`. Target and highlight both measured `x=280, y=587.421875, w=474, h=100.6484375`.                     |
| Navigation after Inspector exit | Same browser session                                              | Passed | Exit removed the hit layer and selected highlight while preserving the launcher; the normal Link click navigated to `/workout/2026-08-05?tab=overview`.                                                                                                                         |
| Regression contracts            | Focused local checks                                              | Passed | Prettier, focused ESLint, `git diff --check`, duplicate selector/route identity, and loopback hostname assertions passed. The current Inspector build had already passed production build/integrity and served the evidence route before the concurrent Admin artifact changed. |
| Independent review              | Read-only DevTools QA subagent                                    | Passed | Confirmed descendant selection, whole-card selection, highlight parity, navigation preservation, resolver alignment, and no Inspector-owned AppShell/layout mutation.                                                                                                           |

- A 375px replay was not run because target resolution uses the same hit-testing seam and the
  reported desktop route produced all three required paths. A broader browser/viewport matrix and
  Global QA Acceptance were not assigned; this receipt proves only the focused Implementation DoD.
- After the receipts were captured, the managed runtime stopped and its current integrity status
  became stale because a concurrent, unrelated private Admin snapshot digest changed. No redundant
  rebuild or post-stop replay was performed; that gap does not invalidate the recorded served-runtime
  targets, selectors, geometry, or completed navigation.

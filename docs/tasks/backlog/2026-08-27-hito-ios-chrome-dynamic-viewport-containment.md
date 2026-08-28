# Fix iOS Chrome Dynamic Viewport Containment

## Work Item ID

HITO-284

## Status

in progress

## Type

Bug

## Priority

highest

## Owner

QA

## Primary Area

Runner

## Scope

Reproduce and eliminate user-visible clipping, unreachable actions and surfaces that no longer fit
inside the current visual viewport when Chrome browser controls expand or collapse during scrolling
on iPhone and iPad. Start from real iOS Chrome evidence, identify the first incorrect existing
Frontend owner, fix the canonical root on this same Task and replay the affected matrix.

## Archive Intent

Retain as the compact real-device dynamic-viewport acceptance contract and final proof. Do not keep
intermediate guesses, duplicate device Tasks or a general browser-research diary.

## Task

Prove the current iOS Chrome failure on supported iPhone and iPad form factors, determine whether the
incorrect owner is the Product shell, an existing overlay/sheet/dialog primitive or a bounded
consumer, and fix the smallest canonical geometry/overflow contract. The solution must remain
correct while the top/bottom browser controls resize, on rotation and after keyboard interaction,
without user-agent sniffing, a second viewport state owner or route-specific copies of the same fix.

## User Report

On 2026-08-27 Ivan reported that Chrome on both iPhone and iPad still changes the available viewport
as its browser controls resize during scrolling. Some Hito components then do not fit on screen or
behave incorrectly. Two same-day iPad Chrome screenshots then captured the first affected surface:
the onboarding submit footer overlapping the goal cards with browser controls collapsed and expanded.

## Evidence

- Current user report covering real Chrome on iPhone and iPad during scroll-driven browser-control
  expansion/collapse.
- Two user-supplied real-device screenshots from 2026-08-27 reproduce the failure on iPad Chrome in
  1280 x 960 landscape with the browser controls collapsed and expanded. In both states the fixed
  onboarding submit footer overlays the goal-card content below `Choose your goal`; the AppShell
  sidebar remains contained, so this is not the previously repaired rail defect.
- The completed
  [iPad dynamic viewport sidebar item](2026-08-17-hito-ipad-dynamic-viewport-sidebar-profile-discovery.md)
  fixed the persistent AppShell rail but explicitly omitted physical iPad Safari/Chrome,
  browser-control expansion/collapse, rotation, keyboard, non-zero safe-area and Stage Manager
  acceptance.
- Current source uses `100dvh` and safe-area composition in the AppShell and several full-height
  sheets/dialogs. That establishes the geometry seams but does not prove which one currently fails
  on a real iOS Chrome visual viewport.

## Observed Behavior

On the authenticated onboarding `Choose your goal` surface in iPad Chrome landscape, the bottom
submit footer stays fixed across the main content while the browser controls expand or collapse.
The footer covers the goal cards instead of occupying or reserving layout space. The user can see
different browser-control heights in the two real-device captures, but the page composition keeps
the same desktop fixed-footer contract and leaves content behind it.

## Expected Behavior

- Every active surface remains contained within the current visual viewport while Chrome controls
  expand or collapse.
- Required content and primary/close/confirm actions remain reachable without relying on a second
  page scroll, toolbar-collapse gesture or hidden overflow region.
- Fixed/sticky shell zones, dialogs, sheets, menus and their internal scroll regions have one clear
  height and overflow owner.
- Rotation, safe areas, keyboard open/dismiss, focus return and browser-control transitions do not
  leave stale height, phantom space, clipped content or horizontal overflow.
- The same contract remains valid in Safari where the WebKit/platform behavior is shared, while the
  reported Chrome interaction is accepted independently.

## Source Investigation

- `src/components/AppShell.tsx` owns the current shell height, sticky rail, mobile navigation and
  safe-area composition.
- `src/styles/overlays-feedback.css` owns shared dialog/sheet height and viewport containment rules.
- Current full-height consumers include Activity History and Unplanned Activity Review sheets.
- `src/components/ui/popover.tsx` already reads `visualViewport` for placement; it is not authority
  to introduce a global JavaScript viewport-height store.
- The prior iPad shell task accepted `100vh` fallback plus `100dvh`, zoned overflow and safe-area
  padding, but its receipt explicitly left the real-device gate unproved.

## Required Discriminator

The supplied real-iPad Chrome evidence is sufficient to return the demonstrated bounded onboarding
defect to FRONTEND. Terminal QA still requires a real-iPhone replay plus exact device/browser
metadata and geometry for both form factors; the screenshots alone do not prove the full matrix.
For each remaining or replayed failure record:

- exact device, iOS and Chrome versions, orientation, route, theme and authentication state;
- before/after screenshots or a short recording showing browser controls and the affected surface;
- `screen` dimensions, `innerHeight`, root `clientHeight`, `visualViewport.height` and
  `visualViewport.offsetTop`, document scroll width/height, page scroll position and the affected
  element rectangle;
- whether the failure occurs on initial load, toolbar expansion/collapse, rotation, keyboard
  dismissal, overlay open/close or focus return;
- a Safari cross-check on the same device to separate shared WebKit geometry from Chrome-specific
  browser UI behavior.

If no admitted execution host can expose dynamic iOS browser controls, QA must return that exact
device capability gap. Static Chromium emulation is not a PASS or a reproduction.

## Demonstrated Root Cause

The first incorrect owner is the existing onboarding footer composition, not AppShell or the shared
overlay primitives. `src/styles/forms-onboarding.css` keeps `.hito-onboarding-submit-footer` at
`position: fixed; bottom: 0` for every viewport wider than 767.98 px, including iPad landscape, while
`.hito-onboarding-surface` reserves only a constant 2.5 rem rather than the rendered footer block
size plus safe-area inset. The footer therefore paints over the scrolling goal content. Chrome's
expanded/collapsed browser controls change the available visual viewport, but do not make that
independent fixed overlay participate in layout.

The fix must stay inside the existing `OnboardingGate` / `forms-onboarding.css` seam and establish
one explicit footer/content geometry contract for tablet and short dynamic viewports. Prefer CSS
layout and the standard small/dynamic viewport and safe-area primitives; do not add user-agent
sniffing or a second JavaScript viewport store.

## Frontend Fix

- `src/styles/forms-onboarding.css` now keeps the submit footer in normal document flow on every
  viewport instead of maintaining a second fixed painting layer over the form.
- `src/components/OnboardingGate.tsx` removes the retired `md:pb-32` compensation that reserved
  space only at the end of the content but could not prevent an intermediate overlay.
- Desktop/tablet bottom spacing and the existing mobile-navigation reserve now compose
  `env(safe-area-inset-bottom)` through the owning onboarding surface.
- Button, copy, focus, localization, auth, persistence and provider behavior are unchanged.

This deliberately removes the always-visible fixed action bar. The primary action remains reachable
through the same single page scroll and participates in layout with its explanatory message, so
locale wrapping and future copy changes cannot silently invalidate a duplicated height constant.

## Focused Frontend Proof

- Production build: passed.
- Prettier for the two source files and this Task record: passed.
- ESLint for `OnboardingGate.tsx`: passed.
- `git diff --check`: passed.
- Local frozen `qa_fixture`: fresh `receipt_matches`, provider mode `qa_fixture`, profile `none`.
- Browser geometry at 1280 x 960 and a reduced 1280 x 840 viewport: footer computed position is
  `relative`, page width equals document width and the footer does not intersect any goal card.
- Browser geometry at 375 x 812: footer does not intersect the goal cards or sticky mobile
  navigation; page width remains 375.
- Browser geometry at 1470 x 801 and 1280 x 720: no footer/card intersection or horizontal
  overflow.
- English and Portuguese (`pt-BR`) footer copy passed desktop and mobile geometry; a clean browser
  run reported no console warnings or errors.
- The repository-wide Hito DS validator still reports its three pre-existing factual-chart and
  current-doc failures; none names or imports this changed onboarding boundary.
- Managed QA runtime and project-qualified local Supabase were stopped after the proof; no hosted
  data, personal session or provider was touched.

## Remaining QA Boundary

The same-task production fix-forward on 2026-08-28 corrected two additional 768 px containment
owners without changing the accepted viewport architecture:

- `src/components/onboarding/PlanPresetPanel.tsx` now sizes the Custom goal title from the semantic
  goal identity rather than the translated label and lets the existing title/status row wrap inside
  the card. The status pill remains intact and aligned without imposing its width on the title row.
- `src/styles/forms-onboarding.css` makes the existing heart-rate editor an inline-size container.
  Its established three-, two- and one-column layouts now switch at the editor's actual available
  width (`42rem` and `26rem`) instead of the outer viewport, so the 212 px tablet form column uses the
  one-column composition rather than clipping a 404 px two-column minimum.
- No viewport store, user-agent branch, component, token, fixture or runtime path was added. The
  original 375 px single-column rules and the wide three-column composition remain the same rendered
  responsibilities.

Focused source proof passed the plan-goal intent validator, heart-rate editor proof, scoped ESLint,
Prettier, `git diff --check` and a fresh isolated production build. The finalized build integrity
check passed with 229 server modules and 3,831 relative module imports, and the generated production
CSS contains both inline-size container thresholds. The shared Design System validator reached only
its three existing unrelated factual-chart/current-doc failures; the new card and heart-rate
assertions passed. The task-owned files are `src/components/onboarding/PlanPresetPanel.tsx`,
`src/styles/forms-onboarding.css`, `scripts/validate-hito-ds-component-contracts.ts` and this record.

The required current-source browser geometry at 375 x 812, 375 x 650, 768 x 566, 1024 x 700,
1280 x 801 and 1470 x 801 was not run by FRONTEND because this fix-forward explicitly prohibited
creating or modifying a runtime and required `qa_fixture` to remain stopped. QA must therefore prove
document/body width equality, CTA containment, bottom-navigation clearance, EN/PT-BR, Light/Dark and
keyboard focus on a fresh released or otherwise admitted candidate. Source/build proof is not a
substitute for that visual acceptance.

Static responsive proof demonstrates the repaired source geometry but is not physical iOS
acceptance. Independent QA must replay the released or otherwise device-reachable candidate on real
iPad Chrome with browser controls expanded and collapsed, and obtain the still-missing real-iPhone
Chrome evidence, exact versions/geometry, rotation, keyboard/focus and Safari cross-check before the
first and third Delivery steps can be checked.

## What Not To Touch

- Do not add user-agent or device sniffing.
- Do not add a global `resize`/`visualViewport` React store unless real-device evidence proves CSS
  cannot express the accepted contract and ARCHITECT re-admits that owner.
- Do not create a second AppShell, overlay primitive, scroll-lock owner or route-specific viewport
  utility.
- Do not change Calendar, auth, provider, FIT, persistence, plan or user-data semantics.
- Do not use Ivan's personal session or capture credentials/private payloads.
- Do not treat desktop Chrome responsive mode as physical iOS acceptance.

## Validation Expectations

1. QA reproduces and inventories the exact failing surfaces on real iPhone Chrome and iPad Chrome,
   reads current primary Apple/WebKit, Chrome iOS and CSS viewport/safe-area guidance, and names the
   first incorrect existing owner.
2. A reproduced bounded Product-Frontend defect returns directly to FRONTEND on this unchanged Task.
   If evidence instead proves a shared Design System primitive or a new architecture owner, return
   the exact discriminator to PRODUCT before changing area or lane.
3. FRONTEND removes the demonstrated root through the existing shell, overlay primitive or bounded
   consumer and introduces no parallel viewport authority.
4. Independent QA replays affected public/authenticated routes in English/Portuguese and Light/Dark
   on real iPhone/iPad Chrome, portrait/landscape, controls expanded/collapsed, keyboard/focus,
   initial load/reload, overlay open/close, scroll containment, horizontal overflow, console and HTTP
   health. Safari is the shared-engine cross-check, not a substitute for Chrome acceptance.
5. Release evidence binds the fix to an exact Git-backed production revision before closure.

## Stage

Tracked independent QA

## Next Recommended Role

QA

## Exact Handoff Prompt

```text
ROLE: QA

Task: Fix iOS Chrome Dynamic Viewport Containment
Mode: Tracked independent real-device replay

Replay the same HITO-284 candidate after the bounded Frontend fix. The submit footer now participates
in normal document flow, the retired md:pb-32 compensation is gone and the onboarding surface owns
safe-area bottom spacing. The later 768 px fix-forward also lets the Custom goal title/Preview pill
wrap within the existing card and makes the heart-rate editor choose its three-, two- or one-column
composition from available inline size instead of viewport width. Focused source validators,
Prettier, ESLint, diff hygiene and an isolated production build passed; the exact current-source
browser matrix remained intentionally deferred because FRONTEND was not allowed to create or modify
a runtime.

First replay the Create-plan surface at 375 x 812, 375 x 650, 768 x 566, 1024 x 700, 1280 x 801 and
1470 x 801 in EN/PT-BR and Light/Dark. Require document/body width to equal viewport width, the Custom
goal card and heart-rate inputs to remain fully reachable, the CTA to stay inside the viewport, no
bottom-navigation overlap and visible/usable keyboard focus.

Use real iPad Chrome to reproduce Ivan's original route and scroll position with browser controls
expanded and collapsed, then prove the fixed candidate in both states. Obtain the missing real-iPhone
Chrome discriminator. Record exact device, iOS/Chrome versions, orientation, route/theme/auth state,
screen/innerHeight/root clientHeight/visualViewport geometry, scroll position and affected rectangles.
Cover rotation, keyboard dismissal, focus return, reload, Light/Dark and English/Portuguese; cross-check
Safari on each device. Static emulation is supporting evidence only. Return any reproduced regression
directly to FRONTEND on this same Task. Do not commit, push, deploy, call providers or mutate hosted
data without a separately admitted release edge.
```

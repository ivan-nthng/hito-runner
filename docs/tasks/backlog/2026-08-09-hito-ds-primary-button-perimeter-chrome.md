# Hito DS Primary Button Perimeter Chrome

## Work Item ID

2026-08-09-hito-ds-primary-button-perimeter-chrome

## Status

completed

## Type

bug

## Task

Remove the resting and active perimeter chrome from the canonical Hito DS default primary Button in
both themes, so a primary action is presented as one signal-colored surface rather than a bordered
control.

## Stage

Design System implementation — completed

## Issue Category

visual_defect

## Severity

medium

## Priority

medium

## Human Priority

normal

## Owner

design_system

## Scope

hito-ds-button-primary

## Archive Intent

retain_in_place

## Reported

2026-08-09

## User Report

The visible border around a primary Button should not exist in either light or dark theme. The
reported instance is the `Add result` primary action on
`/workout/2026-08-06?tab=overview`.

## Evidence

- [Generated local Inspector batch](assets/2026-08-09-local-inspector-batch/inspector-batch-report.txt)
  records the selected `a.hito-button.hito-button-primary.hito-button-md` target and the
  design-system-level scope request.
- [Captured Button and Inspector state](assets/2026-08-09-local-inspector-batch/button-and-overlay.png)
  shows both the reported orange Button and a separate cyan Inspector selection treatment.
- The pre-fix source audit found a one-pixel perimeter `box-shadow` in the canonical default dark
  primary Button rule, the corresponding light-theme rule, and the light active state in
  [controls-lists.css](../../../src/styles/controls-lists.css); the closure receipt below records
  their shared-contract replacement.
- The route uses the canonical `HitoButton` primary variant at
  [workout.$date.tsx:729](../../../src/routes/workout.$date.tsx:729); it does not add a route-local
  border override.

## Observed Behavior

The default primary Button renders with an ambient one-pixel outer ring. The Inspector may also
show a cyan selection overlay, but that overlay is separate from the Button and is not the reported
DS chrome.

## Expected Behavior

The default primary Button is visually borderless at rest and active in both themes. Its semantic
signal fill, readable foreground, geometry, and accessible focus indication remain intact.

## Source Investigation

The default primary rule uses `box-shadow: 0 0 0 1px …`, not CSS `border`. The same resting visual
is intentionally reintroduced in the light-theme rule and active state. The cyan rectangle in the
capture belongs to the local Inspector's fixed selection highlight in
[LocalUiInspector.tsx:688](../../../src/components/devtools/LocalUiInspector.tsx:688), not to the
Button.

## Likely Root Cause

Confirmed: the canonical default primary Button's own one-pixel `box-shadow` is the visible
perimeter chrome. This is shared Hito DS styling, not a Workout-route or Inspector defect.

## Recommended Fix Direction

Change the canonical primary Button visual contract so default primary actions have no ordinary or
active perimeter ring in either theme. Retain a distinct focus-visible affordance and preserve
semantic success and error feedback unless their own states are independently demonstrated to have
the same requirement.

## What Not To Touch

- Do not remove or restyle the Inspector selection highlight.
- Do not add a page-local override to the Workout route.
- Do not change Button sizing, radius, spacing, text contrast, disabled behavior, or focus-visible
  accessibility.
- Do not change persistence, APIs, authentication, fixtures, providers, deployment, or product data.

## Definition Of Done

The shared default primary Button has no resting or active perimeter chrome in light or dark theme;
the target Workout action consumes that result without a route-local exception. Keyboard focus,
hover behavior, and semantic feedback remain discernible.

## Validation Expectations

- Inspect `/hitoDS/components#buttons` and the reported Workout action in light and dark theme with
  the Inspector disabled, distinguishing component chrome from Inspector overlay.
- Exercise default, hover, active, disabled, and keyboard `:focus-visible` states.
- Run the targeted Hito DS contract validator and an independent bounded UI review.
- Any shared Button correction requires proportional build/runtime proof chosen by the Design System
  owner; this item is not Global QA Acceptance.

## Closure Receipt

- Root-cause replay: before the CSS correction, the extended component validator failed the new
  default-primary perimeter and focus-visible assertions; the same assertions pass after the
  correction.
- Canonical result: dark primary rest, hover, and active have no `box-shadow`; light rest and hover
  retain only the existing diffuse elevation shadow, while light active has none. Keyboard
  `:focus-visible` uses a separate two-pixel `--color-ring` outline with a two-pixel offset.
- Shared consumption: `/hitoDS/components#buttons` and the Workout `Add result` action passed
  light/dark rendered and computed-style checks. The Workout action retains the shared
  `hito-button-primary` class without a route-local perimeter override.
- Inspector discriminator: the selected-highlight node count was zero during the DS and Workout
  checks, so the result does not confuse Button chrome with the cyan Inspector overlay.
- Preserved boundaries: success/error tone rules, Button geometry and API, Workout behavior,
  Inspector behavior, persistence, backend, providers, Figma, and product data were unchanged.
- Validation passed: `npm run validate-hito-ds-components`; generated manifest parity; Prettier;
  targeted `git diff --check`; `npm run build`; fresh managed loopback health; light/dark DS state
  matrix for rest, hover, active, disabled, and keyboard focus; light/dark Workout consumer focus;
  independent bounded QA review.
- Coverage boundary: the Workout action was not activated, avoiding product navigation; its shared
  active contract was proven in the canonical DS matrix. The route has no disabled instance, so
  disabled proof remains at the DS reference. Safari and Chrome were not run because the built-in
  browser proved this CSS contract. No persistence, backend, provider, Figma, hosted, or deployment
  validation was required because those surfaces were unchanged.
- Runtime continuity: the managed loopback artifact was healthy and fresh for the rendered checks.
  A later status-only probe still found the loopback process healthy but marked the shared artifact
  stale/broken because its private Admin snapshot marker was missing; no rebuild was forced over
  unrelated concurrent runtime artifacts. This does not replace or widen the completed rendered
  proof, and current-freshness reconfirmation remains outside this slice's closure claim.
- Acceptance: Implementation DoD Passed. Global QA Acceptance was not assigned and is not claimed.

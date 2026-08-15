# Hito DS Launch Surface Chrome Canonicalization

## Work Item ID

2026-08-13-hito-ds-launch-surface-chrome-canonicalization

## Status

closed

## Type

design-system shared-surface correction

## Priority

high

## Owner

design-system

## Mode

Tracked

## Evidence From

[Hub Mark Adoption And Access Label Hierarchy](./2026-08-13-hub-mark-adoption-and-access-label-hierarchy.md)

## Scope

The shared `.hito-launch-surface` recipe and its two current consumers only: the four `/hub`
destination cards and the Brand-reference example. Do not alter the adjacent legacy
`.hito-launcher-card` contract merely because it shares part of the current CSS selector.

## Archive Intent

retain_in_place

## Task

Make every `hito-launch-surface` use the canonical 16px corner tier and have no decorative
perimeter border in its resting or hover state. Preserve its content, theme-aware fill, interaction,
navigation, elevation, and accessible focus indication. Repair the shared Design System owner once;
do not add route-local class overrides or edit four Hub cards individually.

## User Report

- Inspector batch: `2ebb5de0-a29d-4483-be86-c3b8f0c120db`.
- Route: `/hub`; Dark; 1470×801.
- Target: fourth `a.hito-launch-surface`; Inspector scope: **all similar instances**.
- Observed: 20px padding/gap, 10px radius, `#0F0D0B9E` fill, and a 1px `--hairline` perimeter.
- Requested: the same previously requested card treatment here — remove the border and increase all
  corners to `--radius-2xl` (16px).
- The user clarified that the earlier Hub slice visibly changed Marks and access labels while
  leaving the card chrome behind; this request corrects that incomplete visible outcome.

## Observed And Expected Behavior

### Observed

- `/hub` cards render with the shared 10px `--radius-xl` and a 1px `--hairline` edge.
- On hover, the same recipe changes `border-color` and adds a 1px zero-spread signal edge, so the
  card continues to read as bordered.
- The Brand reference uses `article.hito-launch-surface`, so it receives the same chrome.

### Expected

- All `hito-launch-surface` consumers have 16px corners through `--radius-2xl`.
- Resting and hover cards have no decorative perimeter border or pseudo-border.
- Hover can retain its existing motion, fill, and elevation if they remain legible without an edge.
- `:focus-visible` retains a distinct, keyboard-accessible focus ring; that ring is not removed as
  card chrome.
- Existing surface fill and alpha are unchanged by this request.

## Source Investigation

- `src/styles/foundations.css:1220-1256` is the canonical owner of the launch recipe. It currently
  groups `.hito-launcher-card` and `.hito-launch-surface` for base, hover, and focus-visible rules.
- The base rule explicitly sets `border: 1px solid var(--color-hairline)` and
  `border-radius: var(--radius-xl)`.
- The hover rule sets `border-color` and appends `0 0 0 1px` signal shadow, which is the second
  source of a decorative perimeter edge.
- `src/routes/hub.tsx:105` is the sole Hub renderer of `hito-launch-surface`; its shared
  `HubDestinationCard` produces all four current cards.
- `src/components/hito-ds/reference-brand-page.tsx:97` is the only other current consumer and is
  a reference example, not a separate Product recipe.
- The companion `.hito-launcher-card` has no current rendered consumer in the inspected source,
  but it is a distinct declared contract. Conflating it with the requested `hito-launch-surface`
  update would broaden the task without evidence.

## Demonstrated Root Cause

The previous Hub item explicitly limited its scope to `src/routes/hub.tsx` and prohibited changes to
`hito-launch-surface`, `foundations.css`, and shared card chrome. The shared recipe therefore
correctly remained untouched. The visible mismatch is caused by that incomplete routing boundary,
not by the Mark or access-label implementation.

The first implementation owner for the correction is DESIGN SYSTEM: the common selector in
`foundations.css` owns the 10px radius and perimeter-border behavior for both Hub and the Brand
reference.

## Required Change

- Update the existing `hito-launch-surface` recipe at its canonical `foundations.css` owner to use
  `var(--radius-2xl)` (16px).
- Remove its resting `border`, hover `border-color`, and hover 1px zero-spread perimeter edge.
- Preserve a semantic, visible `:focus-visible` ring. Do not replace it with a border or suppress
  keyboard focus.
- Preserve the existing `hito-launch-surface` background/fill contract, padding, gap, min-height,
  typography, HitoMark, link destination, CTA, motion, and all access semantics.
- Preserve `.hito-launcher-card` unless source evidence proves it is the same canonical contract
  and an identical change is explicitly accepted. If the grouped selector must be separated, keep
  common declarations shared and isolate only the documented divergent chrome; do not copy the
  complete recipe into two independent CSS blocks.
- Do not add a token, a component family, a route-local override, a raw pixel radius, or a new
  card abstraction.

## What Not To Touch

- `src/routes/hub.tsx` markup, Hub destinations, access rules, labels, Marks, CTA wording, and link
  behavior already owned by the earlier Hub item.
- `hito-launcher-card` without the explicit evidence/decision above.
- Favicon, Brand-logo artwork, shared surface token values, global `hito-surface-flat`, Product,
  DevTools, Marketing, Backend, generated manifests, validators, Figma, Git lifecycle, hosted
  state, or deployment.
- The current alpha-based fill: Inspector reported it but requested no color change.

## Validation Expectations

- Source discriminator proves `hito-launch-surface` uses `--radius-2xl`, has no resting/hover
  perimeter border, and retains explicit keyboard focus evidence.
- `/hub`: all four cards at 1470×801 and exact 375×812 in Dark and Light have 16px corners,
  borderless resting/hover surfaces, readable access labels, working links, visible keyboard focus,
  no overflow, and no console errors.
- Brand reference: its `hito-launch-surface` shows the same canonical chrome in Dark and Light.
- `.hito-launcher-card` remains source-proven unchanged unless a documented decision expands scope.
- Run focused formatting, lint, relevant Design System validation, `git diff --check`, and a
  production build/browser replay appropriate to the shared rendered CSS change.

## Handoff Status

Closed before implementation because Ivan asked for one compatible DESIGN SYSTEM execution batch.
Its full evidence and acceptance boundary now live in
[Hito DS Visual Correction Batch — Components, Playgrounds, And Launch Surfaces](./2026-08-13-hito-ds-components-header-signal-cleanup.md).
No runtime source was changed by this intake item.

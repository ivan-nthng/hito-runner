# Hito DS Overview Header Top Border Removal

## Work Item ID

2026-08-11-hito-ds-overview-header-top-border-removal

## Status

closed

## Type

visual-polish

## Priority

low

## Owner

design_system

## Mode

Lite

## Scope

Superseded before execution by the broader, source-compatible `/hitoDS` Overview cleanup in
`docs/tasks/backlog/2026-08-11-hito-ds-overview-hierarchy-and-chrome-cleanup.md`. That item owns
the requested all-reference-page header-border removal together with the same Overview hierarchy
cleanup; this narrower item must not be executed separately.

## Archive Intent

retain_in_place

## Task

Historical intake only. Do not execute this standalone item.

## User Report

Inspector captured `/hitoDS`, dark, `1470×801`, targeting `header#overview`. Ivan reports that its
top border has no purpose and requests removal.

## Evidence

- Inspector item: `caa14ebe-b32a-410b-b355-e2bfd38a9bdd`, captured
  `2026-08-11T12:00:36.531Z`.
- Captured target: `#overview`, `hito-page-header`, with a `1px` border and `32px` top padding.
- `src/components/hito-ds/reference-overview-page.tsx:55` owns the exact local class list:
  `hito-page-header border-t border-hairline pt-8`.
- `hito-page-header` does not itself prove or own the border. Another reference-page header also
  uses its own local `border-t border-hairline`; it remains out of scope.

## Source Investigation And Demonstrated Cause

The visible line is directly caused by the two local utilities `border-t border-hairline` on the
Overview header. The first correct owner is DESIGN SYSTEM's `/hitoDS` Overview composition, not a
shared typography/header primitive.

## Expected Behavior

- `#overview` has no top border or replacement divider.
- Its existing `pt-8` spacing, content, anchor target, typography, metadata tag, links, and
  desktop/mobile layout remain unchanged.
- Other `/hitoDS` pages and every other `hito-page-header` consumer remain byte-for-byte unchanged.

## Reuse-First Change Budget

- Existing seam: one class list in `reference-overview-page.tsx:55`.
- Existing composition: retain `hito-page-header pt-8`.
- New production artifacts: none.
- Removed responsibility: only the local Overview top-border chrome.

## What Not To Touch

- `src/components/hito-ds/reference-page.tsx`, shared DS CSS/tokens/classes, Showcase cards,
  navigation, Figma, Product routes, backend, and unrelated dirty work.
- Do not add an alternate divider, CSS, a token, a helper, a wrapper, or a compatibility selector.

## Focused Validation Expectations

- `/hitoDS` Overview at desktop and exact 375×812 in light/dark: no top border, retained spacing,
  no overflow, and no console errors.
- Overview anchors/links stay usable; run focused formatting/lint/diff checks and build only if
  shared output is uncontended.

## Closure

No runtime or Design System source changed under this item. The user subsequently expanded the
request from Overview-only to every Hito DS reference-page header, so Product closed this item to
avoid two overlapping owners for the same local border utilities.

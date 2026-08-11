# Hito DS Overview Hierarchy And Chrome Cleanup

## Work Item ID

2026-08-11-hito-ds-overview-hierarchy-and-chrome-cleanup

## Status

completed

## Type

visual-polish

## Priority

high

## Owner

design_system

## Mode

Lite

## Scope

Only the existing `/hitoDS` reference-page and Overview composition seams:

- `src/components/hito-ds/reference-overview-page.tsx`;
- `src/components/hito-ds/reference-page.tsx`; and
- the already-present semantic card rule in `src/styles/reference-workbench.css`, only if the
  specified Overview link composition requires no shared-selector change.

This is not a Product-card migration, shared typography rewrite, new icon/component work, or
global gradient retirement.

## Archive Intent

retain_in_place

## Task

Simplify the Hito DS Overview catalogue using existing Hito primitives, typography roles, icons,
and semantic tokens only.

1. Replace the Overview `Open` text pills produced by the existing `ShowcaseCard` owner with the
   existing icon-only Hito Button and the existing `arrow-up-right` icon. Preserve each anchor's
   destination and accessible `aria-label`. Apply this only to `ShowcaseCard`; do not change the
   shared `hito-specimen-link` recipe, which also serves non-Overview reference/playground links.
2. Reduce each Overview group to one UI-font group heading and its cards. Remove the repeated
   `Showroom group` eyebrow and group blurb from `ShowcaseGroup`; change its heading from the
   editorial `hito-section-title` role to the existing same-geometry `hito-ui-section-title` role.
   Preserve the group `id`, semantic heading, each component-card title, and all live specimen
   labels and state feedback.
3. Remove the local `border-t border-hairline` utilities from both existing Hito DS reference-page
   header compositions: the Overview header and the non-Overview header. Preserve `pt-8`,
   `hito-page-header`, content, anchors, and all other dividers.

## User Report

Local Inspector batch captured `/hitoDS`, dark, `1470×801`, on 2026-08-11:

- `a3780be1-5196-4f3b-bf74-ae165966391a`: replace `Open Button & grouped actions reference` with
  an arrow-up-right icon button; add nothing because it already exists in Hito.
- `5ff57cee-459a-407b-aad7-99aeeb40fcd1`: remove the editorial/extra group typography, retaining
  a single UI-font group divider and component names inside cards.
- `67beddec-0342-40b9-a1de-7d9b084a9435`: remove the top border on every Hito DS page where this
  local header border appears.

Ivan's governing direction: fix the root owner, reuse only Hito Design System primitives and
tokens, and simplify rather than add machinery.

## Evidence And Source Investigation

- `ShowcaseCard` at `reference-overview-page.tsx:400-420` is the one owner of the Overview card
  deep links. Its current text pill is a raw `<a className="hito-specimen-link">`; that shared
  class also has live consumers in `playground.tsx` and `reference.tsx`, so changing its CSS would
  be an over-broad symptom fix.
- `HitoButton` already supports `asChild` plus `iconOnly` with a required accessible label in
  `src/components/ui/button.tsx:11-35`, and `src/components/ui/icon.tsx:71,378` already registers
  `arrow-up-right`.
- `ShowcaseGroup` at `reference-overview-page.tsx:374-397` creates every repeated `Showroom group`
  label, editorial heading, and blurb. `hito-ui-section-title` at
  `src/styles/layout-typography.css:268-276` preserves the existing 24px/1.15 geometry with
  `--font-sans`; no new typography role is needed.
- The observed header line is not a `hito-page-header` property. It is locally added by
  `border-t border-hairline` at `reference-overview-page.tsx:55` and
  `reference-page.tsx:140`.

The first incorrect canonical owner for all three requests is DESIGN SYSTEM's existing Hito DS
reference composition.

## Expected Behavior

- Every Overview card has a compact existing icon-only Hito Button with `arrow-up-right`; normal
  link navigation and accessible names remain intact.
- Overview groups contain only their UI-font heading and their component cards. Component names,
  examples, labels, values, controls, feedback, and deep links remain visible.
- Neither Overview nor a non-Overview Hito DS reference page has the unexplained top header line.
- No literal pixels, custom classes, icons, tokens, wrappers, variant APIs, or replacement Design
  System recipe are added.

## Reuse-First Change Budget

- Existing seams: `ShowcaseCard`, `ShowcaseGroup`, the two local header class lists, `HitoButton`,
  `Icon`, and `hito-ui-section-title`.
- New production artifacts: none.
- Removed responsibility: text-pill deep-link chrome limited to Overview, duplicated group
  metadata/copy, editorial group typography, and two local top-border utilities.

## What Not To Touch

- `hito-specimen-link` CSS or its non-Overview consumers.
- Shared `hito-page-header`, global typography roles, Product routes/components, Figma, backend,
  persistence, generated/readback truth, or unrelated dirty work.
- The Overview card's existing internal header divider, individual specimen content, and all
  interaction semantics.
- The `hito-canvas-atmosphere` retirement tracked separately in
  `2026-08-11-retire-hito-canvas-atmosphere.md`.

## Focused Validation Expectations

- `/hitoDS` Overview and one non-Overview Hito DS page at desktop and exact `375×812` in dark and
  light: correct icon affordance, no removed content beyond stated group metadata/copy, no header
  top border, no overflow, and no console errors.
- Verify an `Open` icon link navigates to its existing destination and one live Overview control
  retains interaction.
- Run focused DS validator, formatting/lint/diff checks, and a build only if the shared output is
  uncontended.

## Promotion Condition

Promote only if the existing Hito Button cannot satisfy the anchor semantics, if the card link
cannot be changed without modifying shared `hito-specimen-link`, or if a source owner outside the
listed Hito DS reference seams is required.

## Design System Implementation Receipt

Completed on 2026-08-11 as a focused Lite Design System source slice.

### Outcome And Candidate Review

- The pre-assignment helper candidate was inspected against this item and retained without a
  duplicate or replacement implementation. It changes only the specified composition seams.
- `ShowcaseCard` now composes the existing `HitoButton` with `asChild`, `iconOnly`, `size="sm"`,
  `variant="ghost"`, and the registered `arrow-up-right` icon. The original `href` and
  `aria-label` remain on the resulting anchor contract. Shared `hito-specimen-link` source and its
  non-Overview consumers are unchanged.
- `ShowcaseGroup` retains its generated group ID, semantic `h2`, and cards while removing only the
  repeated `Showroom group` eyebrow and group blurb. Its single heading uses the existing
  `hito-ui-section-title` role.
- The Overview and non-Overview Hito DS headers retain `hito-page-header`, `pt-8`, content, and
  anchors while removing only their local `border-t border-hairline` utilities. The internal
  `ShowcaseCard` header divider remains.
- New runtime artifacts: none. No primitive, token, wrapper, selector, icon, typography role,
  Product UI, Figma, backend, or persistence change was added.

### Files

- Accepted helper candidate:
  `src/components/hito-ds/reference-overview-page.tsx` and
  `src/components/hito-ds/reference-page.tsx`.
- Updated by this execution: this canonical item only.
- Inspected and left unchanged for this slice: `src/styles/reference-workbench.css`,
  `src/styles/layout-typography.css`, `src/components/ui/button.tsx`, and
  `src/components/ui/icon.tsx`.

### Focused Validation

| Check                | Scenario / environment                                               | Result                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                          |
| -------------------- | -------------------------------------------------------------------- | ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Candidate source map | Two named Hito DS composition files                                  | Passed                    | Seven `ShowcaseGroup` calls keep only `title`; no `Showroom group`, group blurb, Overview `hito-section-title`, Overview `hito-specimen-link`, or header-local top-border utility remains. `hito-ui-section-title`, `HitoButton asChild/iconOnly`, `arrow-up-right`, both `hito-page-header pt-8` owners, card titles, and internal divider remain.                                               |
| Shared DS validator  | `npm run validate-hito-ds-components`                                | Passed                    | Contract OK; 322 files scanned.                                                                                                                                                                                                                                                                                                                                                                   |
| Formatting           | Scoped Prettier check on both candidate files and this item          | Passed                    | All matched files use Prettier style.                                                                                                                                                                                                                                                                                                                                                             |
| Lint                 | Scoped ESLint on both candidate files                                | Passed                    | Exit 0.                                                                                                                                                                                                                                                                                                                                                                                           |
| Diff hygiene         | Focused `git diff --check`                                           | Passed                    | No whitespace errors; unrelated dirty hunks were not rewritten.                                                                                                                                                                                                                                                                                                                                   |
| Production build     | Shared output                                                        | Not run                   | Two unrelated `npm run build` / Vite build processes were already concurrently active for more than six minutes. The uncontended-build condition was false, so this role did not start a third build or alter those processes.                                                                                                                                                                    |
| Browser matrix       | `/hitoDS` Overview and non-Overview, desktop and 375×812, dark/light | Not run — environment gap | The canonical managed server remained stopped with `artifact_missing` while both external builds were active. No safe uncontended runtime was available. Consequently rendered icon navigation, live-control interaction, header chrome, responsive overflow, and console state are not claimed. Per the item boundary, the wider runtime/build condition was recorded rather than repaired here. |

Implementation source DoD is complete for this Lite slice. Browser acceptance remains an explicit
environment coverage gap; this receipt does not claim Global QA, release readiness, hosted
validation, or deployment readiness.

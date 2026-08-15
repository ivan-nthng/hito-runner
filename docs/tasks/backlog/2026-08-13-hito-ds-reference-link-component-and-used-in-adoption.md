# Hito DS Reference Link Component And Used-In Adoption

## Work Item ID

`2026-08-13-hito-ds-reference-link-component-and-used-in-adoption`

## Status

`closed`

## Type

Tracked — shared Design System reference-navigation component

## Priority

P1

## Owner

DESIGN SYSTEM

## Stage

Closed — superseded and fully adopted by the completed consolidated Design System batch.

## Scope

Turn the existing anonymous `hito-specimen-link` presentation into one documented Hito Design
System component named **Reference Link** (`HitoReferenceLink`). Use that owner for every existing
`Used in` route link and in-document specimen anchor. The component belongs to `/hitoDS` reference
navigation; it is not a Product navigation, Button, Metadata Tag, or Value Tag replacement.

## Archive Intent

retain_in_place

## Task

Create the smallest canonical Reference Link owner, document it physically in Hito DS, and replace
all live `hito-specimen-link` rendering paths with that owner. The visual contract is a compact,
technical route/anchor link with `--radius-sm`, existing canonical spacing, hairline edge, and
token-owned hover/focus states.

## User Report

Ivan selected `/settings` in a `Used in` group. The element looks like a component but is absent
from the Design System as a named, documented primitive. He requested that it be named, added to
the Design System, updated from the Inspector evidence, applied to all existing `Used in` links,
and given a clear hover state.

## Evidence

- Route: `/hitoDS/components`, Dark, 1470×801.
- Inspector item: `4adb3f72-f362-46ad-b927-528841478425`.
- Selected target: `<a class="hito-specimen-link">/settings</a>`.
- Selector: `div:nth-of-type(1) > div > div:nth-of-type(1) > div > span > a:nth-of-type(2)`.
- Current observed geometry: 8.8px horizontal / 4.8px vertical padding, pill radius, hairline
  border, 5% foreground-mix fill, Body SM text.
- Requested changes: Technical SM typography; `--radius-sm` (4px) instead of pill radius; a named
  Design System component used everywhere this pattern currently appears; visible hover treatment.

## Observed Behaviour

`hito-specimen-link` is a CSS class, not a component with an explicit API, metadata entry, or
physical reference. It has exactly two current rendering owners:

1. `src/components/hito-ds/reference.tsx` — `ProductLinks`, which renders route links inside
   `Used in` rows; and
2. `src/components/hito-ds/playground.tsx` — in-document specimen anchors that also select their
   owning Demo/Variants tab.

The shared recipe in `src/styles/reference-workbench.css` already contains CSS hover/focus styles,
but their contract is anonymous, uses raw `0.3rem` / `0.55rem`, `999px`, local color mixes, and
Body SM rather than the requested canonical component semantics.

## Expected Behaviour

- `HitoReferenceLink` is a named, documented DS component with native anchor semantics.
- It is physically visible in `/hitoDS` with normal, hover/focus-visible, route, and in-document
  anchor examples, including its `Used in` purpose.
- All current `Used in` route links and current specimen anchors reuse it. The old class has zero
  live rendering reachability.
- The compact treatment uses `hito-technical-sm`, `--radius-sm`, `--space-1` vertical and
  `--space-2` horizontal padding, and existing theme-aware hairline/surface/text tokens.
- Hover and focus-visible are both clear, token-owned states; focus remains visibly distinct and
  keyboard reachable. Hover is enhancement only, never the sole indication that a link is usable.

## Demonstrated Root Cause

The first incorrect owner is the anonymous presentation recipe
`src/styles/reference-workbench.css:.hito-specimen-link`. It has been duplicated as raw anchors in
both `ProductLinks` and `HitoDsPlayground`, so the inspector sees a styled element rather than a
discoverable DS component. The missing component/reference contract — not the individual `/settings`
link — is the cause.

## Existing Seams And Reuse First

- Reuse native `<a>` semantics and the existing direct-link/anchor behavior, including the
  `HitoDsPlayground` tab-selection callback and deep-link IDs.
- Reuse existing Hito typography, spacing, radius, hairline, surface, foreground, motion, and focus
  contracts. Do not create a Button, Tag, generic Chip, new token, route registry, or link state
  layer.
- `HitoButton` is not the owner: this is compact durable reference navigation, not a Product action.
- `HitoMetadataTag` and `HitoValueTag` are not the owner: their semantic/selectable tag contracts
  do not describe navigation links.
- A new `HitoReferenceLink` source file is justified only if no existing named component can own
  native route and in-document anchor semantics after preflight. If a present canonical owner is
  demonstrated, reuse it and record why.

## Admitted Source Investigation

Before the first write, FRONTEND (ds) must confirm current source reachability and choose the
smallest canonical seam. Expected candidates are:

- `src/components/hito-ds/reference.tsx`
- `src/components/hito-ds/playground.tsx`
- `src/styles/reference-workbench.css`
- the existing `/hitoDS/components` reference composition and metadata seam required to make the
  component physically discoverable
- one new `src/components/ui/hito-reference-link.tsx` only if the preflight justifies it

The owner must record source hashes and active-writer state. Preserve unrelated dirty work exactly.

## Required Work

1. Prove every live `hito-specimen-link` owner and its behavioral contract before editing.
2. Establish the named Reference Link primitive or a proven existing equivalent; its API must accept
   normal anchor props without adding a route registry, client state, tooltip, or analytics.
3. Replace both current raw anchor renderers with the canonical owner. Preserve anchor IDs, hash
   behavior, Demo/Variants tab selection, `aria-label` groups, and browser-native link behavior.
4. Replace the old anonymous class recipe with the canonical component recipe. Use only existing
   tokens: Technical SM; space 1/2 padding; radius sm; hairline edge; theme-aware quiet resting
   surface/text; existing motion/ring semantics.
5. Add one compact physical DS reference under the existing Components surface. It must demonstrate
   route and in-document examples plus default, hover/focus-visible, and long-label containment;
   it must not create a separate navigation/category page or repeat every consumer.
6. Update any existing reference metadata/Inspector registration only if that exact registry is the
   canonical way components become discoverable. Do not add a second registry or hand-authored
   manifest.
7. Delete the obsolete `hito-specimen-link` class and prove zero source reachability after adoption.

## Preserved Boundaries

- No Product, Admin, Marketing, DevTools, backend, persistence, route registry, browser history,
  external URL policy, token, generated manifest, Figma, hosted state, or Git lifecycle change.
- No conversion of ordinary prose supplied to `usedIn` into links; only existing route/anchor links
  use Reference Link.
- No change to `HitoButton`, `HitoMetadataTag`, `HitoValueTag`, generic Button/Tag styles, or card
  contracts.
- No arbitrary raw colors, alpha formulas, spacing, radius, or hover-only accessibility behavior.

## Validation Expectations

| Check              | Required evidence                                                                                                    |
| ------------------ | -------------------------------------------------------------------------------------------------------------------- |
| Source             | Two prior raw rendering paths migrate; old class has zero live reachability; no duplicate owner remains.             |
| Semantics          | Route links remain native anchors; in-document anchors retain ID, hash, and Demo/Variants tab behavior.              |
| Visual             | Dark/Light resting, hover, focus-visible, and long-label states use the specified tokens and remain contained.       |
| Interaction        | Pointer, Tab, Enter, focus-visible, deep-link and browser back/forward behavior remain correct.                      |
| Responsive         | 1470×801 and 375×812 Used-in groups and anchor groups wrap without page overflow.                                    |
| Static             | Focused Prettier, ESLint, existing relevant DS validation, `git diff --check`, and proportional build/runtime proof. |
| Independent review | Existing `ROLE: QA` may perform one bounded read-only final browser review after FRONTEND (ds)'s own proof.          |

## Definition Of Done

1. Reference Link is named, physically documented, and discoverable in Hito DS.
2. Every current Used-in route link and specimen anchor uses the same canonical owner.
3. The old anonymous recipe and all raw rendering reachability are gone.
4. The visual/interaction contract uses Technical SM, `--radius-sm`, canonical spacing, and visible
   token-owned hover/focus states.
5. The task contains a truthful English receipt that distinguishes focused implementation from
   Global QA or release acceptance.

## Next Recommended Role

PRODUCT for any later reference-navigation expansion or Global QA decision. The implementation is
owned by the completed [Hito DS Reference Contract And Table Density Batch](./2026-08-13-hito-ds-reference-contract-and-table-density-batch.md).

## Blockers

None. The exact source owner and requested component contract are demonstrated.

## Supersession Closure Receipt — 2026-08-14

- **Current ownership:** PRODUCT explicitly reconciled current `/hitoDS` ownership to DESIGN SYSTEM; the historical `FRONTEND (ds)` planning and handoff facts above remain unchanged.
- **Adoption proof:** the completed [Hito DS Reference Contract And Table Density Batch](./2026-08-13-hito-ds-reference-contract-and-table-density-batch.md) adopted the exact Reference Link responsibility. Current source has one named `HitoReferenceLink` owner used by `ProductLinks`, playground specimen anchors, and the physical Components reference; the anonymous `.hito-specimen-link` renderer has zero live reachability.
- **Independent evidence:** the completed [Reference Contract And Table Density Independent QA](./2026-08-13-hito-ds-reference-contract-and-table-density-independent-qa.md) passed route/hash links, browser history, pointer/keyboard focus and activation, long-label containment, Dark/Light desktop and 375×812 rendering, overflow, and console health.
- **Lifecycle result:** `closed` as superseded. Existing source bytes are adopted without a runtime edit and without claiming Global QA, release, deployment, hosted, or Figma acceptance.

# Hito DS Overview Specimen Intrinsic Sizing And Empty Stage Repair

## Work Item ID

2026-08-12-hito-ds-overview-specimen-intrinsic-sizing-and-empty-stage-repair

## Status

completed

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Repair the `/hitoDS` **Overview** showcase's unintentional specimen stretching at its canonical
Design System reference owner. The task covers only the existing `ShowcaseCard` preview slot and
the direct Overview specimen compositions that demonstrably inherit its stretching behaviour.

The task must distinguish a compact demonstration from a deliberately usable-width component. It
must make compact previews occupy their natural footprint and sit centred within a calm stage,
while preserving truthful bounded or full-width examples where their geometry is part of the
component contract. It also resolves the one captured Overview card that currently has no
understandable live demonstration.

This is not a Product-route, primitive, or global-control sizing migration.

## Archive Intent

retain_in_place

## User Report

Ivan reported that several `/hitoDS` Overview specimens are visibly stretched when they should
appear as normal-size live components centred inside their showcase field. He explicitly asked for
one root-cause repair across the Design System rather than route-local visual patches, and allowed
Design System ownership if the shared reference source proves it.

The target outcome is not that every component becomes small. Components that legitimately need
usable width must remain truthful; only components and preview wrappers that acquire meaningless
width or height from the showcase stage must stop doing so.

## Inspector Evidence

Local Inspector batch `b8e40eba-8242-41aa-b410-1281c0809e72`, captured on 2026-08-12 at
`/hitoDS`, Dark, `1470×801`. The batch is local-only and did not mutate Product or Design System
source.

| Item                                   | Selector / source target                                                                     | Scope                                          | Captured symptom                                                                                                                                                       |
| -------------------------------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `6e0eed64-95b3-4fe8-89a2-d77b4df2484c` | `div[aria-label="Workout intensity"]` / `hito-choice-toggle-group`                           | Only this instance                             | The two-choice group measured `496×84.05px` and looked stretched rather than like a compact selector.                                                                  |
| `ef9b1185-6786-45ae-95cd-9d641e11df3d` | `input[aria-label="Search plans"]` / `hito-field hito-field-primary hito-field-sm`           | All similar instances, subject to source proof | The Overview field measured `496×94.5px` and looked oversized for a visual specimen.                                                                                   |
| `4f9bc042-3428-4cf8-b820-19d39f924beb` | `div.hito-state-surface.py-3[role="status"]`                                                 | Only this instance                             | The banner specimen measured `496×236px`; Ivan asks that a component which does not need that field-sized footprint be centred at normal size.                         |
| `84cd2c1d-048f-477c-80c2-e78ce3ed6f67` | `#showroom > section:nth-of-type(5) > div > article:nth-of-type(2)` / Overview showcase card | Only this instance                             | The visible Shell Navigation menu items were vertically stretched; the ordinary menu should be normal-size and centred.                                                |
| `9e5dccd6-9e68-40f3-a48e-a195c2ab82c3` | `#showroom > section:nth-of-type(7) > div > article:nth-of-type(2)` / Overview showcase card | Only this instance                             | The card measured `528×753.08px` and was not understandable as a demonstration. Ivan requested a real minimal demonstration or removal of that card from the Overview. |

## Source Investigation

The route and positive source metadata confirm **DESIGN SYSTEM** ownership:

- `src/components/hito-ds/reference-overview-page.tsx:388-419` owns every Overview
  `ShowcaseCard`. Its lower body is a generic `grid min-h-64 min-w-0 pt-5` slot. CSS Grid's
  default stretch behaviour gives the slot's direct child the available cross-axis space even when
  the child is a compact specimen.
- `reference-overview-page.tsx:132-159` renders the captured **Selection Controls & Slider** card;
  the actual `hito-choice-toggle-group` is a direct grid child through
  `SelectionControlPreview`.
- `reference-overview-page.tsx:115-130` renders the captured **Field & Date-Time** card. The
  canonical shared `.hito-field` contract in `src/styles/controls-fields.css:2-14` deliberately
  has `width: 100%`; changing it would break actual forms and is not authorized.
- `reference-overview-page.tsx:162-170` renders the captured **Banner / Notice Surface**. The
  canonical `hito-state-surface` is an operational state-surface primitive, not an Overview-only
  size recipe.
- `reference-overview-page.tsx:240-252` renders **Shell Navigation**. The navigation itself is
  already bounded with `max-w-xs`; its vertical expansion is therefore an Overview-stage
  composition issue, not proof that global shell-navigation rows should change.
- `reference-overview-page.tsx:331-341` is the currently likely source for the final captured
  card, **Rows & Disclosure**. The executor must verify the live selector-to-card mapping before
  editing or removing it; the Inspector's section order alone is not sufficient proof.

The first incorrect owner is therefore the **shared Overview preview-stage composition** in
`ShowcaseCard`, plus the relevant direct specimen wrappers. The root-cause discriminator remains:
for each captured instance, establish whether the visible expansion comes from the generic grid
stage, an explicit direct wrapper, or the primitive's intentional own contract. Do not infer that
all instances of a class are wrong from this one Overview capture.

## Existing Decision To Preserve And Reconcile

The completed
[Showcase Card Surface And Preview Stage task](/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-showcase-card-borderless-surface.md)
already established a required distinction:

- self-contained actions, menus, status, and tooltips may be centred;
- field, slider, banner, App Shell, row, tabs, shell navigation, table, and disclosure examples
  must retain truthful usable width and intrinsic layout.

This task is a correction to the current **stage composition**, not permission to reverse that
decision with a blanket `place-items-center`, universal `w-fit`, universal `max-w-*`, or a global
primitive change. The Design System owner must use an independent Designer review to classify the
five reported specimens and any matching Overview siblings before implementation.

## Required Outcome

1. The Overview preview stage has one intentional sizing rule for each existing specimen category:
   **compact**, **bounded**, **usable-width**, or **rich composition**. It must not rely on default
   Grid stretching to decide a component's size.
2. The **Workout intensity** preview is a compact, content-hugging two-choice control, centred in
   its stage. The shared `hito-choice-toggle-group` behaviour for Product consumers remains
   unchanged.
3. The **Field & Date-Time** preview remains a truthful real field and date input. Its Overview
   composition is deliberately bounded and centred for catalogue scanning; `.hito-field` remains
   full-width within that bounded form context and is not changed globally.
4. The **Banner / Notice Surface** preview no longer occupies meaningless field height. The
   Designer-approved composition must either show a readable bounded notice at its natural content
   footprint or document why it needs usable width. It must not change the shared
   `hito-state-surface` contract.
5. **Shell Navigation** appears as a normal-size navigation fragment centred in the visual stage;
   its rows do not inherit stage height.
6. Before changing the final captured card, prove which Overview card it is. If its live primitive
   can be demonstrated factually with the smallest existing component state/content, keep it and
   make that demonstration understandable. If it cannot be understood without invented filler,
   remove only that `ShowcaseCard` entry from Overview while retaining the real component's canonical
   `/hitoDS/components` destination and all shared source. Do not add placeholder copy.
7. All remaining Overview cards are audited for the same **unintentional** stretching defect.
   Repair only the examples proved to be affected. Deliberately full-width/complex demonstrations
   remain readable and unwarped.

## Existing Seams And Change Budget

- Primary seam: `src/components/hito-ds/reference-overview-page.tsx:388-419`, the existing
  `ShowcaseCard` lower body slot and existing direct child compositions at the exact sections above.
- Read-only contracts to verify first: `src/styles/controls-fields.css` (`.hito-field`),
  `src/styles/controls-lists.css` (`.hito-choice-toggle-group` and shell navigation),
  `src/styles/overlays-feedback.css` (`.hito-state-surface`), and the current Overview card
  definitions.
- Existing primitives/tokens/composition utilities only: current `grid`, `flex`, `items-*`,
  `justify-*`, `self-*`, `min-w-0`, existing bounded-width utilities, current space/radius tokens,
  and the demonstrated components.
- New runtime artifacts, component APIs, tokens, CSS files/classes, raw values, registries,
  wrappers, compatibility paths, and product data: **none**.
- Default implementation target: existing TSX composition at the primary seam and existing direct
  Overview specimen wrappers. Change shared CSS only if source proof shows this same Overview
  showcase stage cannot truthfully own the rule; never add per-card CSS overrides.
- Delete the empty/untruthful Overview entry if the specified evidence test requires it. Delete no
  shared primitive, route, documentation page, or unrelated catalogue entry.

## What Not To Touch

- Product routes, authenticated UI, AppShell, backend, persistence, provider calls, Auth, Figma,
  generated manifests, dependencies, build configuration, hosted state, or unrelated dirty work.
- Shared `.hito-field`, `hito-choice-toggle-group`, `hito-state-surface`, `hito-shell-nav`,
  `hito-disclosure`, slider, Tabs, Data Table, App Shell, Row, or overlay contracts unless the
  root-cause discriminator proves their global owner itself is wrong. If it does, stop and return
  the boundary to Product; do not hide it with an Overview-only workaround.
- The existing showcase-card header, title, `Open` deep link, internal divider, background/radius
  contract, responsive grid, or currently accepted playground-stage task
  `2026-08-12-hito-ds-playground-stage-canonicalization`.
- Do not impose a universal min/max width or universal centring rule. Do not use clipping to hide
  overlays, table content, slider range, field values, or disclosure content.

## Required Specialist Review

Before source writes, the DESIGN SYSTEM owner must obtain one bounded read-only **DESIGNER** review
of the compact/bounded/usable-width/rich classification, especially for Banner and Disclosure.
After the focused implementation proof, obtain one independent read-only **QA** browser review.
Those reviews are evidence aids; the Design System owner remains accountable and must not delegate
the canonical source decision.

## Validation Expectations

| Check                           | Scenario / environment                                | Required evidence                                                                                                                                                                                                    |
| ------------------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Root-cause discriminator        | Source + live DOM                                     | Each of the five item IDs is mapped to its actual Overview card and classified by the source of width/height. The chosen repair is shown to affect the first incorrect owner rather than a global primitive symptom. |
| Compact and bounded specimens   | `/hitoDS`, `1470×801` and exact `375×812`, Dark/Light | Workout intensity is content-hugging and centred; Search plans/Date are bounded but usable; Banner is not needlessly field-height; no geometry is faked with literals.                                               |
| Rich and usable-width specimens | Same matrix                                           | Shell Navigation rows are normal-size and centred; Tabs, Slider, App Shell, Row, Data Table and any retained Disclosure remain readable, intrinsic where appropriate, and not clipped or falsely narrowed.           |
| Final card disposition          | Source + browser                                      | Selector `9e5dccd6-9e68-40f3-a48e-a195c2ab82c3` maps to one real card. It either shows the smallest factual live content or its Overview entry is removed under the stated boundary.                                 |
| Interaction/accessibility       | Browser                                               | Input/Date, choices, Slider, Tabs, Disclosure, Dropdown/Tooltip/Dialog/Sheet triggers and `Open` deep links retain current keyboard and pointer behaviour; overlays remain visible.                                  |
| Browser health                  | Desktop/mobile, Dark/Light                            | No page-level horizontal overflow and no console/page errors.                                                                                                                                                        |
| Static/integrity                | Current checkout                                      | Focused Prettier, ESLint, Design System validator, `git diff --check`, and production build unless a separately-owned build is contended; record the exact contention boundary if so.                                |

## Definition Of Done

- All five Inspector reports have a source-backed disposition.
- Overview stages no longer make compact or bounded specimens look like arbitrary full-card
  controls, while true usable-width/rich examples preserve their real contract.
- No global Product primitive changes, raw values, one-off style recipe, or duplicate wrapper
  system was added.
- The questionable final card is either a factual live example or removed only from the Overview,
  with its underlying component/library destination preserved.
- Designer classification and independent QA replay have passed, or an exact evidence-based blocker
  remains recorded.

## Execution Condition

Dispatched to the existing DESIGN SYSTEM owner on 2026-08-12.

## Next Recommended Role

PRODUCT — consume the focused implementation receipt and route any independent Global QA or
release work separately if required.

## Blockers

None for planning. Implementation must first resolve the source/DOM discriminator and Designer
classification; this task deliberately does not assume every currently broad component is defective.

## Design System Implementation Preflight — 2026-08-12

- **Existing seam and smallest change:** reuse the current `ShowcaseCard` lower stage and its direct
  Overview TSX compositions. Replace implicit Grid block-axis stretching with explicit content
  alignment, then apply only existing intrinsic/bounded/usable-width utilities at the affected
  specimen roots.
- **Demonstrated mapping:** `Workout intensity` is the compact choice group inside **Selection
  Controls & Slider**; `Search plans` is the full-width field inside the bounded **Field &
  Date-Time** form; the signal `role="status"` surface is **Banner / Notice Surface**; the
  Navigation card with `Calendar` and `Progress` is **Shell Navigation**; and the final captured
  card is **Rows & Disclosure**, positively identified by its `Advanced options` native
  `<details>` content and `Open Rows & Disclosure reference` link.
- **Classification:** Button, Dropdown, Status/Toast, Dialog/Sheet, and Tooltip are compact; Field,
  Banner, and Shell Navigation are bounded; Surface/Row, Tabs, and Rows/Disclosure are usable-width;
  App Shell and Data Table are rich compositions; Selection/Slider is mixed, with a compact choice
  group above a usable-width slider.
- **New runtime artifacts:** none. No component API, token, CSS class/file, registry, wrapper system,
  raw value, or compatibility path is proposed.
- **Simplification/removal:** remove reliance on the stage's default Grid stretch and redundant
  compact-wrapper `h-full` sizing. Retain the final Disclosure card because the existing native
  summary/body is already the smallest factual live demonstration; no filler or placeholder is
  required.
- **Proof and promotion boundary:** validate source/DOM mapping, the complete Dark/Light desktop and
  exact-mobile geometry/interaction matrix, static checks, and an uncontended build. A demonstrated
  defect in a shared Product primitive would stop this Overview-only repair and return to Product;
  current evidence shows no such boundary.

## Product Dispatch — 2026-08-12

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Stage: Overview specimen intrinsic sizing and empty-stage repair

Execute this canonical item exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-12-hito-ds-overview-specimen-intrinsic-sizing-and-empty-stage-repair.md`

Read `AGENTS.md`, `agents/design-system.agent.md`,
`skills/hito-frontend-design-system/SKILL.md`, and
`skills/hito-qa-browser-regression/SKILL.md` before the first task-owned write.

You own all Design System implementation. Reuse the existing Overview `ShowcaseCard` stage and
direct Overview specimen compositions; add no new runtime artifact, token, CSS file/class, raw
value, global primitive change, wrapper system, registry, or compatibility path.

First prove the source/DOM mapping and classify every captured specimen as compact, bounded,
usable-width, or rich composition. Fix the demonstrated first owner only. Do not use a blanket
centering or width rule and do not change shared Product primitives. The final questionable card
must be source-mapped before it is retained as a minimal factual demo or removed from Overview only.

Required bounded evidence aids:
- before source writes, use the existing named DESIGNER role for one read-only classification review;
- after your focused proof, use the existing named QA role for one independent read-only browser review.
Do not delegate Design System implementation to another implementation role. Each reviewer must
read AGENTS.md, its own canonical role file, and only its directly matching project skill.

Preserve all boundaries and run the complete validation matrix specified in the canonical item.
Update the item with an English preflight and tracked implementation receipt. Do not stage, commit,
push, deploy, access hosted state, mutate Figma, or claim Global QA/release readiness.
```

## Tracked Design System Implementation Receipt — 2026-08-12

### Task And Outcome

- **Mode / stage:** Tracked — Overview specimen intrinsic sizing and empty-stage repair.
- **Outcome:** the existing Overview showcase now gives compact, bounded, usable-width, and rich
  specimens explicit local composition instead of letting default Grid stretch decide their
  footprint. Compact controls are centred and content-hugging; bounded form/notice/navigation
  specimens retain usable width and natural height; rich examples keep their full composition.
- **Acceptance boundary:** focused Implementation DoD passed. This receipt does not claim Global QA,
  release readiness, deployment, hosted parity, Product adoption, or Figma parity.

### Demonstrated Root Cause And Source Mapping

The generic `ShowcaseCard` lower slot was a `grid min-h-64` with default Grid content stretching.
Direct children therefore inherited spare block-axis space, and nested full-width primitives could
look like arbitrary card-sized controls. The primitives' own contracts remained correct.

| Inspector item                         | Positive source / live DOM owner                                                                                      | Disposition                                                                                                                                                               |
| -------------------------------------- | --------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `6e0eed64-95b3-4fe8-89a2-d77b4df2484c` | **Selection Controls & Slider**; `Workout intensity`, `Easy pace` / `Tempo`, above the `Effort` slider                | Mixed card retained. Only the compact choice group now content-hugs and centres; Slider stays usable-width.                                                               |
| `ef9b1185-6786-45ae-95cd-9d641e11df3d` | **Field & Date-Time**; `Search plans` plus `Target date`                                                              | Shared full-width Field contract retained inside one centred, bounded Overview form context.                                                                              |
| `4f9bc042-3428-4cf8-b820-19d39f924beb` | **Banner / Notice Surface**; signal status `Plan ready to review`                                                     | Shared state surface retained at bounded usable width and natural content height.                                                                                         |
| `84cd2c1d-048f-477c-80c2-e78ce3ed6f67` | **Shell Navigation**; `Open Shell Navigation reference`, `Calendar` and `Progress` rows                               | Existing `max-w-xs` navigation is centred with natural row height; the shared shell contract is unchanged.                                                                |
| `9e5dccd6-9e68-40f3-a48e-a195c2ab82c3` | **Rows & Disclosure**; `Open Rows & Disclosure reference`, native `Advanced options` details/summary and factual body | Retained. This is already the smallest factual live disclosure; its natural-height content is centred in the stage instead of stretching beside the rich Data Table card. |

### Source Change And Reuse

- `src/components/hito-ds/reference-overview-page.tsx`
  - made the existing preview slot explicitly `content-center`;
  - removed redundant `h-full` from compact wrappers;
  - used existing `justify-self-*`, `self-*`, `w-full`, and existing bounded-width utilities only;
  - centred the compact sub-specimen inside the mixed Selection/Slider stack;
  - kept Field, Slider, Row, Tabs, App Shell, Data Table, and Disclosure width contracts truthful.
- This canonical item records the preflight, mapping, lifecycle, and receipt.
- **New runtime artifacts:** none. No CSS, token, raw value, component API, primitive, registry,
  wrapper system, compatibility path, Product route, generated manifest, or dependency was added.
- Existing unrelated dirty hunks in the shared checkout and in the Overview source were preserved.

### Validation Inventory

| Check                      | Scenario / environment                            | Result | Evidence                                                                                                                                                                                                                                                |
| -------------------------- | ------------------------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| DESIGNER classification    | Read-only source review                           | Passed | All 14 cards were classified; the mixed Selection/Slider case and bounded Banner/Disclosure decisions were confirmed before implementation.                                                                                                             |
| Focused formatting         | Prettier on changed source and item               | Passed | `All matched files use Prettier code style!`                                                                                                                                                                                                            |
| Focused lint               | ESLint on `reference-overview-page.tsx`           | Passed | Exit 0, no findings.                                                                                                                                                                                                                                    |
| Design System validator    | `npm run validate-hito-ds-components`             | Passed | Full contract validator returned `contract ok`; 324 files scanned.                                                                                                                                                                                      |
| Diff hygiene               | `git diff --check`                                | Passed | Exit 0.                                                                                                                                                                                                                                                 |
| Production build           | Fresh uncontended `npm run build`                 | Passed | Client, SSR, Nitro, and postbuild completed successfully; only existing non-fatal bundle/directive warnings were emitted.                                                                                                                               |
| Managed runtime            | Local canonical QA server                         | Passed | Fresh built runtime was restored on loopback and used for browser proof.                                                                                                                                                                                |
| Geometry and mapping       | `/hitoDS`, 1470×801 and exact 375×812, Dark/Light | Passed | All five Inspector targets mapped positively. Workout was `165.94×32`; Field capped at 384px desktop and used 295px mobile; Banner height was 68.4/87.9px; Shell Navigation was 320px desktop / 295px mobile and 82px high; Disclosure was 71.4px high. |
| Rich/usable specimens      | Same four-cell matrix                             | Passed | Slider, Tabs, App Shell, Surface/Row, Data Table and Disclosure remained readable. The 860px table stayed in its local scroller; page overflow was zero.                                                                                                |
| Interaction/accessibility  | Pointer plus physical keyboard                    | Passed | Search/Date edits, choice selection, Slider `6→7` plus restore to `4`, Tabs, Disclosure, Dropdown, Tooltip focus-visible/open, Dialog/Sheet Escape and focus restoration, toast, and an Open deep link all passed.                                      |
| Overlay and browser health | Desktop/mobile, Dark/Light                        | Passed | Dropdown, Tooltip, Dialog, Sheet and toast remained visible/unclipped; showcase perimeter stayed 0px, the internal divider stayed 1px, and console warn/error inventory was empty.                                                                      |
| Independent QA             | Read-only QA browser review                       | Passed | Focused Implementation DoD passed with no task-owned defect and no coverage gap. The initial semantic-locator misses for native range and Tooltip were independently proven to be browser-control-path limitations via physical key events.             |

### Preserved Boundaries, Omissions, And Next Owner

- Shared Field, choice, state-surface, shell navigation, disclosure, slider, Tabs, table, row, App
  Shell, overlay, Product, Backend, persistence, Auth, hosted, and Figma contracts were not changed.
- No required check was omitted; no task-owned blocker remains.
- **Next owner:** PRODUCT for receipt routing only. Any Global QA or release decision remains a
  separate explicitly assigned gate.

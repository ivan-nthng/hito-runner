# Hito DS Card Size Contract And Inspector Recognition Discovery

## Work Item ID

2026-08-13-hito-ds-card-size-contract-and-inspector-recognition-discovery

## Status

completed

## Type

design-system decision discovery

## Priority

high

## Owner

designer

## Mode

Tracked

## Scope

Research and specify a canonical Hito card-size contract only where actual card families share the
same semantic responsibility. Include the required future Inspector recognition contract and an
owner-separated implementation map. This discovery does not implement a token, component, CSS,
Inspector UI, Figma mutation, or consumer migration.

## Archive Intent

retain_in_place

## Task

Determine whether Hito should formalize three card sizes, which existing rendered card families
belong to that contract, and what each size means for padding, corner radius, internal gap,
minimum/maximum geometry, density, and responsive behavior. The decision must use existing Hito
primitives unless the audit proves an actual token gap. It must also define how a future Local
Inspector can truthfully identify an eligible card and offer its canonical size without inventing
an Inspector-only registry or treating every bordered/surfaced container as a card.

## User Report

- Inspector batch: `7ff98bcc-42bf-4276-a510-694c4f838280`.
- Route: `/hitoDS`; Dark; 1470×801.
- Target: `article.hito-ds-showcase-card` in the Overview showroom; Inspector scope: **all similar
  instances**.
- Observed: `--space-4` padding (16px), Background fill, no requested color change, and all
  corners computed as 10px. Inspector proposed 16px.
- User direction: establish an understandable card concept with three sizes — small, medium, and
  large — with correspondingly intentional padding/radius; audit card usage and modern Design
  System practice first; then make card size available in Local Inspector so a valid card can be
  intentionally reduced or enlarged.

## Source Facts

- `src/styles/reference-workbench.css:390-399` owns the current Overview showroom
  `.hito-ds-showcase-card`: `--radius-xl`, `--space-4`, and a theme-aware background.
- The current 10px is not a raw literal: with the active radius scale, it is the computed value of
  canonical `--radius-xl`. The evidence therefore does **not** prove a token violation.
- `src/components/hito-ds/reference-overview-page.tsx:405` is the shared renderer for the Overview
  showroom cards.
- Existing card-like names include `hito-ds-showcase-card`, `hito-launch-surface`,
  `hito-launcher-card`, `hito-nav-card`, `hito-choice-toggle-card`, token-specimen surfaces, row
  groups, and Manual Workout structural/step/repeat cards. They do not yet prove one shared visual
  contract; several are controls, domain rows, evidence specimens, overlays, or Product structures.
- Local Inspector currently exposes independent padding/radius controls from computed source-backed
  token evidence in `src/components/devtools/local-ui-inspector-targets.ts` and
  `src/components/devtools/LocalUiTokenControls.tsx`. It has no card-size semantic discriminator.
- Existing Inspector responsibilities must remain source-backed: a prior rejected approach used an
  Inspector-only applicability mapping. A future card-size selector needs one canonical DS owner,
  not a parallel DevTools list.

## Design Questions To Resolve

1. Is a three-size card scale the smallest durable Hito contract, or does the existing inventory
   support fewer/more semantic sizes? State the evidence and recommendation.
2. Which card families are true candidates for the contract, and which must remain excluded because
   they are navigation, rows, selectable controls, component specimens, tables, overlays, domain
   structure, or product-specific surfaces?
3. For every proposed size, what are the exact existing Hito spacing and radius primitives, internal
   gap/density rules, responsive treatment, and intended content capacity? Do not rely on raw pixel
   recipes. If 8px is proposed for a compact card, identify its existing token and demonstrate why
   that pairing is coherent with the current scale.
4. Does a card-size contract need a named reusable component recipe, existing semantic class/variant,
   source-generated metadata, or another single DS-owned representation? Compare the smallest viable
   choices and recommend one; do not choose an Inspector-only map.
5. What future Inspector behavior is truthful: eligibility display, current canonical size readback,
   selectable sizes, absent/mixed/custom state, nested-card behavior, no-size state, undo/remove,
   and generated task payload? The Inspector must never mutate live DOM/CSS.
6. What should happen on mobile: retain the semantic size while adapting layout, or map certain
   card sizes to a smaller token pair? State the visual reason and exact rules.
7. What migration order reduces risk and avoids converting every surface into an interchangeable
   generic card?

## Required Discovery Deliverable

Create the decision report in this canonical item, in English, with:

- an exhaustive inventory table of currently rendered Hito card-like families: route/reference,
  renderer/CSS owner, consumer count where source can prove it, interactive role, current padding,
  radius, gap, border/focus/elevation behavior, theme behavior, responsive behavior, and a clear
  `candidate` / `exclude` / `needs separate decision` classification;
- a concise review of current, authoritative or primary Design System guidance relevant to component
  density, sizing, responsive behavior, and accessible interactive surfaces, with direct links and
  a clear distinction between guidance and Hito decisions;
- an exact proposed card-size matrix, only after the inventory, using existing Hito primitives or a
  demonstrated gap; include `compact/default/spacious` or an evidence-backed alternative, plus
  names exposed to users versus source identifiers;
- the proposed single source of truth and future Inspector readback/selection contract, including
  all applicable non-eligible, inherited, mixed, custom, hover/focus, keyboard, touch, no-live-
  mutation, and generated-payload states;
- an accessibility/interaction analysis: focus ring must remain distinct from decorative border,
  touch targets, content truncation/wrapping, nested interactive controls, contrast, and mobile
  density;
- source-based migration slices with exact prospective owners. DESIGN SYSTEM owns shared
  primitives/tokens/canonical CSS and `/hitoDS`; FRONTEND DevTools owns Inspector UI only after a
  canonical DS contract exists; Product consumers require separate routed slices; and
- decision options, recommendation, explicit unknowns, rollback conditions, and the exact next
  DESIGN SYSTEM implementation task boundary. Do not make that next task active or dispatch it.

## What Not To Touch

- No runtime source, CSS, tokens, generated manifests, validators, Inspector code, Figma, Product,
  Backend, persistence, providers, Git lifecycle, hosted state, deployment, or local fixtures.
- Do not make an arbitrary global `10px → 16px` replacement; current `--radius-xl` is canonical
  even if it becomes inappropriate for a particular newly defined card size.
- Do not classify every `article`, `div`, bordered surface, row, menu, table cell, or specimen as a
  card.
- Do not invent a generic card framework, an Inspector-only registry, a duplicate token scale, or
  new responsive breakpoints merely to make three sizes possible.
- Do not claim Figma alignment without the exact approved file/key/node IDs, browser acceptance,
  Global QA, release, or implementation.

## Acceptance For This Discovery

- The inventory gives a source-backed inclusion/exclusion decision for each current card-like family
  instead of a name-based guess.
- The proposed scale is demonstrably tied to Hito primitives and differentiates component geometry
  from focus/state chrome.
- The future Inspector contract has one identified Design System source of truth and does not add
  parallel DevTools semantics.
- All cross-owner future work is split into separately routable slices.
- The report states any design decision still requiring Ivan and returns one exact next owner
  recommendation to PRODUCT.
- Documentation formatting and `git diff --check` pass. This discovery does not require a build or
  browser replay because rendered behavior must remain untouched.

## Stage

DESIGNER discovery and implementation specification complete; returned to PRODUCT for owner-bounded
routing.

## Next Recommended Role

PRODUCT

## Handoff Status

Ivan confirmed DESIGNER dispatch on 2026-08-13. This role owns the read-only discovery only; any
implementation recommendation returns to PRODUCT as a separate decision and handoff.

```text
ROLE: DESIGNER

Task: Hito DS Card Size Contract And Inspector Recognition Discovery
Mode: Tracked discovery — read-only
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-card-size-contract-and-inspector-recognition-discovery.md

Read AGENTS.md, agents/designer.agent.md, and skills/hito-frontend-design-system/SKILL.md before
work. This is a read-only design/research task: do not edit runtime source, CSS, tokens, manifests,
validators, DevTools, Figma, fixtures, or product data.

Investigate actual Hito card-like families before proposing any abstraction. The direct request is
to decide whether a three-size Card contract is warranted and, if so, define coherent token-based
padding/radius/density/responsive rules plus a truthful future Inspector readback/selection model.
The current `hito-ds-showcase-card` 10px value is `--radius-xl`, a canonical token; do not call it
a token violation or replace values by name alone.

Produce the required source-backed inventory, external guidance review, proposed size matrix,
eligibility/exclusion rules, single-source-of-truth recommendation, Inspector state/payload model,
accessibility/mobile analysis, migration map, risks, rollback, and exact next DESIGN SYSTEM
implementation boundary in the canonical item. Reuse existing Hito primitives wherever possible;
do not propose an Inspector-only registry or a universal generic-card framework.

Return to PRODUCT with the recommendation and every unresolved Ivan decision. Run documentation
formatting and `git diff --check`. Do not claim implementation, browser acceptance, Figma parity,
Global QA, release, or deployment.
```

## Designer Discovery Decision — 2026-08-13

### Accepted Decision

Adopt a three-size contract only for the existing non-interactive `/hitoDS` Overview showroom
family. The contract is **Hito DS Showcase Card**, not a universal Hito `Card` primitive and not a
license to convert every surfaced or rounded container into an interchangeable card.

The source evidence supports this boundary:

- one `ShowcaseCard` renderer owns 14 live Overview instances with the same responsibility: title,
  deep link, divider, and a live component preview;
- the 14 instances range from one compact action to composite App Shell and Data Table specimens,
  so three content-density choices are useful within one semantic family;
- every other audited card-like family has a different functional contract: navigation,
  selection, state/intent, rows, overlays, evidence specimens, authentication, or workout-domain
  structure; and
- the current Overview `16px` padding and `10px` radius are already canonical `--space-4` and
  `--radius-xl`. Medium must preserve that exact pair. There is no token violation to repair.

The three user-facing labels are **Small**, **Medium**, and **Large**. Source identifiers are
`sm`, `md`, and `lg`; their design meanings are compact, default, and spacious. Size controls
container density only. It does not imply a fixed width, grid span, preview height, interaction
mode, surface color, border, or elevation.

### Tracked Preflight And Source Snapshot

- Role: `DESIGNER`; role file read: `agents/designer.agent.md`.
- Project skill read: `skills/hito-frontend-design-system/SKILL.md`.
- Mode: Tracked read-only discovery. The only writable owner was this canonical item.
- Snapshot: `main` at `74607987885ca40f33658c79fba174d173d45646`.
- The task item was untracked at intake. Relevant concurrent source work was preserved:
  `reference-overview-page.tsx` had a Data Table specimen-prop diff,
  `reference-workbench.css` had a Playground tab-spacing diff, and `foundations.css` had a Launch
  Surface border/radius diff. `reference-metadata.ts`, `local-ui-inspector-targets.ts`, and
  `local-inline-change-target-utils.ts` were clean at the captured snapshot.
- No runtime source, CSS, token, manifest, validator, Inspector, Figma, fixture, Product data,
  Git lifecycle, hosted state, or dependency was changed.
- No subagent was used; the source and external-practice questions were bounded and directly
  verifiable without a second role.

### Inventory Method And Classification Rule

The audit began with the Foundation spacing/radius vocabulary, then traced exact rendered class or
component owners. Counts below are source declarations/call sites, not a claim about a particular
runtime dataset. A loop can render more instances than its source count; that distinction is
called out. Similar background, radius, or the word `card` is not inclusion evidence.

`candidate` means the family shares the Showcase Card responsibility and may enter this exact
contract. `exclude` means another semantic or interaction owner is already demonstrated.
`needs separate decision` means it may merit its own density contract later, but joining this one
would currently erase a real boundary.

### Current Hito Card-Like Family Inventory

| Family and reachability                                                                                                                                      | Renderer and CSS owner                                                                                                                                | Interaction role                                                                                                    | Current geometry and chrome                                                                                                                                                                                                          | Theme and responsive behavior                                                                                   | Decision                                                                                                                                          |
| ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Overview Showcase Card** — 14 `<ShowcaseCard>` calls in one source renderer on `/hitoDS`                                                                   | `reference-overview-page.tsx` owns anatomy; `.hito-ds-showcase-card` and `.hito-ds-showcase-grid` in `reference-workbench.css` own outer surface/grid | Root is a non-focusable `article`; the header has one deep-link Button and the body contains truthful live controls | Outer `--space-4`, `--radius-xl`, no perimeter border/shadow; header `gap-3`, retained hairline divider and `pb-3`; preview `pt-5`, `min-h-64`; grid gap `--space-4`                                                                 | Dark uses `--color-background`; Light uses `--color-surface`; one column below 768px and two columns from 768px | **candidate**, and the only family admitted now                                                                                                   |
| **Neutral token/evidence specimens** — 12 exact source declarations across Foundations and Brand; mapped collections expand them at runtime                  | `.hito-ds-token-specimen-surface` in `reference-workbench.css`; local renderers in `reference-foundations-page.tsx` and `reference-brand-page.tsx`    | Mostly static evidence; color swatches are whole buttons and some specimens expose copy actions                     | Outer border `0`, `--radius-3xl`, no owner padding; consumers independently use `p-3`, `p-4`, or `p-5` and `gap-2`, `gap-4`, or `gap-5`; inner lines often prove color/edge/provenance                                               | Semantic background; grid/layout behavior is renderer-specific                                                  | **needs separate decision**; content evidence and copy semantics differ, and current local padding variation is not a size API                    |
| **Generic structural surfaces** — exact TS/TSX evidence: `hito-surface` 3 calls/3 files, `hito-surface-flat` 25/11, `hito-surface-quiet` 3/2                 | `overlays-feedback.css` owns surface/flat; `reference-workbench.css` currently owns quiet                                                             | Structural containment; quiet can also be a button/link wrapper                                                     | Surface: border, `--radius-2xl`, gradient; Flat: border, `--radius-xl`, no owned padding; Quiet: transparent border, `--radius-xl`, alpha fill and focus ring for interactive hosts. Consumers choose `p-3` through responsive `p-8` | Semantic colors; consumer-specific responsive padding/layout                                                    | **needs separate decision**. These are appearance recipes without one content/anatomy contract; a card size cannot be inferred from local padding |
| **State Surface / Surface Wash** — 46 exact `hito-state-surface` calls in 19 files and 10 `hito-surface-wash` calls in 3 files                               | `overlays-feedback.css`                                                                                                                               | Status, notice, empty/loading/error/success, or semantic information                                                | Border, `--radius-2xl`, default `1.5rem` padding, intent fills; consumers sometimes override to `p-3`, `p-4`, `p-6`, or `py-3`                                                                                                       | Tone-resolved semantic colors in both themes; reduced-motion handling; responsive behavior is consumer-owned    | **exclude**. Tone/state is the primary contract, not interchangeable card density                                                                 |
| **Launch Surface** — one Hub renderer maps four destination links; one static Brand reference. Legacy `.hito-launcher-card` has no exact live class consumer | `HubDestinationCard` plus `.hito-launch-surface`/`.hito-launcher-card` in `foundations.css`                                                           | Whole-card navigation link with hover/focus/active expectations                                                     | Launch: `min-height: 18rem`, `1.25rem` gap/padding, `--radius-3xl`, no perimeter border, elevation/blur; legacy Launcher retains border and `--radius-xl`                                                                            | Hub grid moves 1→2→4 columns; semantic theme treatment and focus are interactive evidence                       | **exclude**. Navigation size and clickable-area semantics are separate; unreachable Launcher CSS is not proof for a shared card family            |
| **Workout Nav Card** — one `NavCard` renderer, up to previous and next instances on `/workout/$date`                                                         | `workout.$date.tsx`; `.hito-nav-card` in `calendar-state-surfaces.css`                                                                                | Whole-card route link                                                                                               | `padding: 1rem`, `--radius-xl`, border, hover/active motion, focus ring, `min-height: 5.75rem`, internal `1.15rem` gap                                                                                                               | Explicit Light treatment; mobile min-height becomes `5.25rem`; title alignment changes                          | **exclude**. Directional navigation, focus, date/title anatomy, and responsive height are its real contract                                       |
| **Choice Toggle Card** — 8 explicit `presentation="card"` TSX call sites across 5 files plus a dynamic reference preview path                                | `HitoChoiceToggle` and `hito-control-contract.ts`; `.hito-choice-toggle-card` in `controls-lists.css`                                                 | Button/radio/pressed selection with selected, hover, focus, disabled, and invalid states                            | `min-height: 4rem`, `--radius-xl`, `1rem 1.125rem` padding; selection and invalid borders/rings                                                                                                                                      | Theme-resolved selected/disabled colors; product consumers add their own min-height/layout                      | **exclude**. It is deliberately outside the inline control size ladder and is a selectable control, not a neutral content card                    |
| **Row Group and List Rows** — 61 exact `hito-row-group` calls across 26 files                                                                                | `controls-lists.css`, with product and reference row renderers                                                                                        | Grouped lists, disclosures, readbacks, date-time frames, and workout rows                                           | Group owns border, `--radius-xl`, overflow and fill; child rows own their own padding/dividers; some reference contexts intentionally remove group border/radius                                                                     | Consumer-specific layout; compact workout mode changes row geometry                                             | **exclude**. It is list anatomy and edge ownership, not one card                                                                                  |
| **Manual Workout structural cards** — editor/preview surface, one repeat renderer, one normal-step renderer, and nested rows                                 | `ManualWorkoutConstructorEditor`, `ManualWorkoutTrainingBlockGrammar`, and `forms-onboarding.css`                                                     | Drag/reorder, nested repeat structure, row actions, fields, hover/focus-within, and readback                        | Local contract maps surface padding `--space-4`, row padding `--space-3`, outer `--radius-2xl`, inner `--radius-xl`; step outer padding is `0`; multiple domain-specific backgrounds/edges                                           | Explicit Dark/Light local recipes; responsive action visibility and editing behavior                            | **exclude**. Domain structure and drag/focus states must not be changed through a generic card-size control                                       |
| **Auth, onboarding, and admin local surfaces** — `hito-auth-alpha-surface` 3 calls/3 files, one onboarding wrapper, one Admin quick-note form                | Auth entry/login, `OnboardingGate`, Admin Capture; Foundations/forms/admin stylesheet owners                                                          | Authentication containment, page wrapper/footer, or popover-like form                                               | Auth composes `hito-surface-flat` with local `p-5 lg:p-6`; onboarding surface is a max-width/page wrapper; quick note is `--radius-2xl`, `1rem` padding, border and shadow                                                           | Explicit theme/blur and layout behavior; onboarding footer becomes a mobile contained surface                   | **exclude**. These are page/overlay/auth responsibilities, not the showroom content card                                                          |
| **Dialog, Sheet, Popover, and Menu surfaces** — shared UI owners plus static export examples                                                                 | `components/ui/{dialog,sheet,popover,dropdown-menu,select}.tsx` and `overlays-feedback.css`                                                           | Modal/non-modal overlays with focus, Escape, portal, placement, and scroll contracts                                | Dialog/Sheet generally `p-6` and `--radius-2xl`; Popover/Menu have placement/available-size constraints and their own internal spacing                                                                                               | Viewport-aware Radix geometry, mobile Sheet behavior, theme/elevation, reduced motion                           | **exclude**. Overlay containment/elevation and focus management are primary                                                                       |
| **Other framed component specimens** — App Shell frame, data table/calendar geometry, disclosure, Playground stage                                           | Local `/hitoDS` reference renderers and their existing component owners                                                                               | Demonstration canvas or the component being demonstrated                                                            | Borders/radii/dividers are component or evidence geometry; Playground stage is explicitly borderless                                                                                                                                 | Each follows its real component/grid behavior                                                                   | **exclude**. An `article`, border, radius, or surfaced canvas is not sufficient eligibility                                                       |

### External Practice Review — Guidance, Not A Token Copy

| Primary source                                                                                                                                                                                                                                                 | Relevant guidance                                                                                                                                                                                                                                                                                         | Hito interpretation                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [Adobe Spectrum Cards](https://spectrum.adobe.com/page/cards/)                                                                                                                                                                                                 | Small, medium, and large are content/container choices; medium is the default, small is for constrained containers, large is for content-rich large views. Width can remain fluid and height follows content/grid.                                                                                        | Three sizes are defensible inside one demonstrated family, but should describe capacity/density rather than forcing universal width or height. Hito keeps its own tokens and non-interactive showroom anatomy. |
| [Carbon Tile usage](https://carbondesignsystem.com/components/tile/usage/)                                                                                                                                                                                     | Base, clickable, selectable, and expandable variants have distinct interaction contracts. Base containers are not focusable unless their children are; clickable containers should not contain competing nested actions. Carbon explicitly avoids pretending every complex card is one universal pattern. | Keep Showcase Card non-interactive and keep Nav, Choice Toggle, rows, and expandable/overlay families out. Size never erases interaction role.                                                                 |
| [Shopify Polaris Card layout](https://polaris-react.shopify.com/patterns/card-layout) and [Card reference](https://polaris-react.shopify.com/components/layout-and-structure/card)                                                                             | Card padding and internal stack gaps are different responsibilities; tokenized padding can be responsive, and clear header/body/footer hierarchy matters.                                                                                                                                                 | Hito maps outer inset and component-slot gap separately. Child component spacing stays child-owned. Responsive remapping is unnecessary for the modest Hito inset range.                                       |
| [WCAG 2.2 Target Size (Minimum)](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html), [Focus Visible](https://www.w3.org/WAI/WCAG22/Understanding/focus-visible.html), and [Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow.html) | Pointer targets normally need at least 24×24 CSS px or sufficient spacing; keyboard focus must remain visible; narrow layouts must reflow without two-dimensional scrolling for ordinary content.                                                                                                         | Size changes cannot shrink child controls, consume focus rings, or force horizontal overflow. The card root remains non-focusable; the Overview grid collapses rather than remapping the semantic size.        |

### Options Considered

1. **Universal generic `Card` primitive with three sizes — rejected.** It would collapse navigation,
   selection, state, evidence, overlay, list, and domain structures that have different anatomy and
   interaction contracts. The inventory does not prove a Product-wide owner.
2. **Keep only one unlabelled Overview recipe — rejected.** Fourteen same-owner specimens have
   materially different content capacity, and Ivan explicitly needs a truthful way to reduce or
   enlarge this valid card family.
3. **Three sizes on the bounded Showcase Card family — accepted.** It satisfies the demonstrated
   need, reuses the current renderer and tokens, and creates a truthful Inspector seam without a new
   framework.

### Proposed Showcase Card Size Matrix

| User label | Source ID | Density meaning | Outer inset        | Corner radius         | Component-slot gap | Intended content capacity                                                               |
| ---------- | --------- | --------------- | ------------------ | --------------------- | ------------------ | --------------------------------------------------------------------------------------- |
| **Small**  | `sm`      | compact         | `--space-3` = 12px | `--radius-lg` = 8px   | `--space-2` = 8px  | One concise live control/action or short status composition; no forced truncation       |
| **Medium** | `md`      | default         | `--space-4` = 16px | `--radius-xl` = 10px  | `--space-3` = 12px | Standard one-part interactive specimen; preserves the current Overview outer geometry   |
| **Large**  | `lg`      | spacious        | `--space-5` = 20px | `--radius-3xl` = 16px | `--space-4` = 16px | Composite or multi-region specimen such as Selection + Slider, App Shell, or Data Table |

Why these pairs:

- all six values already exist in Foundations; no token or duplicate scale is needed;
- `--space-2` is the exact existing 8px primitive used for the compact internal gap;
- Medium is byte-for-byte equivalent at the outer seam to today's `--space-4` /
  `--radius-xl` contract;
- Hito already uses `--space-5` with the visibly spacious, borderless Launch Surface and
  `--radius-3xl` on roomy reference specimens. Large reuses that established visual relationship;
  and
- `--radius-2xl` remains available to structural/state/overlay families. A numeric ladder does not
  require every radius token to be consumed by this component family.

The size contract intentionally does **not** own:

- width, max-width, column span, or aspect ratio;
- root min-height/max-height; the card grows with content;
- the existing showroom preview `min-h-64`, which remains the preview-stage layout owner, not a
  card-density value;
- child control sizes, child gaps, table/calendar geometry, or overlay dimensions;
- surface color, theme mapping, border, divider, focus ring, shadow, or elevation; or
- an interaction mode. The root remains a non-interactive `article` in all three sizes.

### Initial Overview Assignment

The first implementation should make every size reachable without inventing a separate demo
registry:

- `sm`: Button & grouped actions; Dropdown / Menu; Status & Async Toast; Tooltip.
- `md`: Field & Date-Time; Banner / Notice Surface; Surface & Row; Tabs; Shell Navigation;
  Dialog / Sheet; Rows & Disclosure.
- `lg`: Selection Controls & Slider; App Shell; Data Table & Headers.

This assignment changes only outer density and component-slot spacing. It must not change the
two-column grid, make Large span columns, shrink the preview stage, or alter the specimen itself.
If visual QA shows unequal paired cards becoming harder to scan, the safe fallback is to set the
affected pair or all 14 cards back to explicit `md`; no Foundation token changes.

### Inclusion And Expansion Rule

Eligible now:

- an element rendered by the existing `ShowcaseCard` owner;
- marked `data-hito-ds-pattern="showcase-card"`; and
- carrying one declared `data-hito-card-size="sm|md|lg"` value emitted from the component prop.

Not eligible by inference:

- generic `article`, `section`, `div`, border, shadow, radius, background, or padding evidence;
- descendants inside an eligible card;
- `hito-ds-token-specimen-surface`, `hito-surface*`, `hito-state-surface`, `hito-surface-wash`,
  `hito-launch-surface`, `hito-nav-card`, `hito-choice-toggle-card`, `hito-row-group`, Manual
  Workout structures, overlays, tables, calendar cells, App Shell frames, or Product surfaces; or
- a class name containing `card` without a confirmed DS ownership marker.

A later family may adopt the three labels only through a new source-backed decision proving the
same semantic responsibility, interaction role, and migration/deletion path. Visual similarity or
matching tokens alone are insufficient.

### One Design-System Source Of Truth

Use the existing DS-to-Inspector ownership bridge; do not add a file or registry:

1. Extend `src/components/hito-ds/reference-metadata.ts` with
   `HITO_DS_SHOWCASE_CARD_SIZES` and `HitoDsShowcaseCardSize`. Each entry owns `id`, user label,
   density description, `paddingToken`, `radiusToken`, and `gapToken`.
2. Add one `showcase-card` pattern entry to the existing `HITO_DS_REFERENCE_ENTRIES`, pointing to
   `reference-overview-page.tsx` / `reference-workbench.css` and the size metadata.
3. Make the existing local `ShowcaseCard` renderer require an explicit size prop and emit
   `data-hito-ds-pattern="showcase-card"` plus `data-hito-card-size={size}`. Do not create a generic
   `Card` component or a new runtime file.
4. Let `reference-workbench.css` implement the three marker selectors and named header/body slot
   spacing. Common background, borderless chrome, internal divider, preview stage, and grid remain
   in their current owner.
5. Extend the existing DS component validator to assert that every metadata entry has one selector,
   all 14 calls have an explicit valid size, Medium keeps `--space-4`/`--radius-xl`, and Product
   source does not import the reference-only contract.

The TypeScript metadata is the semantic source. CSS is its validated rendering implementation.
The existing DevTools boundary already permits importing `reference-metadata.ts`; the Inspector
therefore consumes the same contract instead of keeping another applicability or size list. The
generated Foundation manifest remains the source for primitive token definitions, but it does not
need a new component-size collection.

### Future Inspector Recognition And Selection Contract

The current Inspector's `surface` classification and `cardChrome` evidence remain useful
observation, not eligibility. They infer card-like chrome from background/border/shadow/radius and
therefore cannot safely enable a semantic Card Size selector. Eligibility begins only from the
confirmed `showcase-card` ownership marker and DS metadata.

The existing Inspector also currently duplicates radius arithmetic in `HITO_RADIUS_SCALE`; its
`--radius-xl` delta does not match the current Foundation/manifest definition. The later DevTools
slice must derive card-size options from `HITO_DS_SHOWCASE_CARD_SIZES` and Foundation token
resolution, not reuse or extend that local arithmetic as semantic truth.

#### Recognition states

| State        | Evidence and UI behavior                                                                                                                                                                                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `eligible`   | Direct selected element has confirmed `showcase-card` ownership and a valid declared size. Show current label and allow all three desired choices.                                                                                                                                   |
| `inherited`  | Selected descendant is inside an eligible card. Show read-only `Parent card: Medium` and an action to select/highlight the nearest card root; never apply size to the child.                                                                                                         |
| `mixed`      | `All similar instances` resolves the same confirmed pattern but finds more than one declared size. Show `Mixed`; selecting a size generates one owner-level request with per-size counts.                                                                                            |
| `custom`     | Marker and valid declared size exist, but computed outer inset/radius/slot gap do not match that size after token resolution. Show declared size plus `Custom computed values`; selecting a canonical size may request convergence, but the payload must preserve mismatch evidence. |
| `missing`    | Confirmed pattern exists but the size attribute is absent or invalid. Show `No canonical size`; a canonical selection can request repair. Do not infer current size from pixels.                                                                                                     |
| `ineligible` | No confirmed pattern, or a specifically excluded family. Hide the selector. Existing independent padding/radius observations may remain, but they do not become Card Size.                                                                                                           |
| `nested`     | When eligible cards are nested in a future composition, the nearest direct eligible root wins. Parent and child are never changed together unless the user separately targets the parent.                                                                                            |

Hover, focus, active, selected, disabled, and theme states must not change the declared size
readback. If a state changes the measured padding/radius/gap, Inspector reports `custom` drift; it
does not silently relabel the card. The Inspector UI control itself must be keyboard and touch
operable and must not depend on hover.

#### Selection and draft behavior

- `Keep current` creates no requested change.
- Choosing the current canonical size creates no no-op payload.
- Choosing another size records a semantic desired ID; it does not independently draft four
  radius plus four padding token edits.
- Clearing/undoing the pending selection returns the draft to `Keep current`. There is no `Remove
size` option because the eligible component requires an explicit size.
- `Only here` identifies the selected renderer call; `All similar instances` groups by confirmed
  pattern owner, not by visual CSS; `Design system level` requests a contract/default change and
  must remain distinct from migrating instances.
- Inspector never mutates live DOM, class names, inline style, stylesheet, token, or component prop.
  It only generates a task payload.
- When a batch contains different viewport captures, each item retains its own declared/computed
  evidence. The batch is not collapsed to `mixed` across unrelated routes or selectors.

#### Proposed payload extension

```json
{
  "target": {
    "componentId": "showcase-card",
    "cardSize": {
      "eligibility": "eligible",
      "ownerKind": "pattern",
      "declaredSize": "md",
      "declaredLabel": "Medium",
      "computedMatchesContract": true,
      "resolved": {
        "paddingToken": "--space-4",
        "radiusToken": "--radius-xl",
        "gapToken": "--space-3"
      }
    },
    "cardSizeSelection": {
      "currentSize": "md",
      "desiredSize": "sm"
    }
  }
}
```

For `mixed`, include `currentSize: null` and source counts such as `{ "sm": 4, "md": 7,
"lg": 3 }`. For `custom` or `missing`, include the declared/computed discrepancy rather than
manufacturing a current canonical size. The generated prompt must name the DS pattern owner,
source path, current state, desired ID, viewport/theme, and requested scope, then ask the routed
owner to change source and validate it. It must never instruct direct DOM or CSS mutation from the
Inspector.

### Accessibility, Interaction, Theme, And Mobile Contract

- **Focus:** the Showcase Card root is not focusable and receives no card-level hover/focus state.
  The header deep link and live child controls retain their own visible focus ring. Padding/radius
  changes must not clip `box-shadow` focus rings; preserve current overflow behavior.
- **Targets:** card size must not change HitoButton, field, menu, table, or other child-control
  dimensions. Existing interactive targets must continue to meet the 24×24 CSS-pixel minimum or
  its WCAG spacing exception.
- **Nested controls:** do not wrap the whole Showcase Card in a link/button. It already contains a
  deep link and often several live controls; one outer click target would create competing or
  invalid nested interaction.
- **Text and content:** titles and live specimen content wrap; the size contract adds no line clamp,
  ellipsis, fixed root height, or hidden overflow. If content no longer fits its assigned capacity,
  move that instance to a larger size rather than truncate evidence.
- **Contrast:** all sizes preserve the current Dark `--color-background`, Light `--color-surface`,
  and hairline internal divider. Size adds no border, alpha, color, shadow, or elevation recipe.
- **Mobile:** keep the declared `sm`/`md`/`lg` identity and exact token pair at every viewport. The
  existing grid collapses to one column below 768px, so no automatic `lg → md` remap is necessary.
  This keeps Inspector readback truthful. Validate at 375×812 and at a narrow 320px width; content
  must reflow without horizontal page scrolling.
- **Touch Inspector:** the future selector and parent-card targeting action remain visible/usable
  without hover. Card contents remain independently operable.

### Owner-Separated Migration And Rollout

#### Gate 0 — PRODUCT concurrency check

- Confirm no active writer owns `reference-overview-page.tsx`, `reference-workbench.css`,
  `reference-metadata.ts`, or the DS validator.
- Capture a fresh dirty snapshot. Preserve the current Data Table, Playground spacing, Launch
  Surface, Foundations, and other concurrent hunks byte-for-byte.
- If the Showcase renderer, Foundation token values, metadata bridge, or Inspector ownership model
  moved, re-run the relevant discriminator; do not apply this document mechanically.

#### Slice 1 — DESIGN SYSTEM: exact next implementation boundary

Implement only the bounded Showcase Card contract:

1. Add `HITO_DS_SHOWCASE_CARD_SIZES` and the `showcase-card` entry to existing
   `reference-metadata.ts`; add no file, token, manifest collection, registry, or generic Card.
2. Make the existing `ShowcaseCard` size prop explicit; emit the pattern and size markers.
3. Implement only the three size selectors/slot gaps in `reference-workbench.css`, preserving the
   borderless theme surface, internal divider, current preview min-height, and existing grid.
4. Assign the 14 existing calls using the initial map above. Do not change their live components,
   deep links, copy, grid span, width, preview height, or interaction.
5. Extend only the existing component-contract validator to bind metadata, selectors, explicit
   calls, token pairs, and the reference-only import boundary.
6. Prove source/validator/format/diff hygiene, then browser-check all three sizes at desktop and
   375×812 in Light/Dark, including keyboard focus, touch-equivalent target availability, wrap,
   equal-grid scanability, and horizontal overflow. This is implementation proof, not Global QA.

Stop and return to PRODUCT if the slice needs a new token, component file, generic Product Card,
generated-manifest component registry, responsive breakpoint, width/span API, or source owner
outside DESIGN SYSTEM. The slice is net-bounded: it replaces the one unlabelled Showcase geometry
with three declared variants and makes all 14 instances explicit; it does not migrate another
surface family.

#### Slice 2 — FRONTEND, DevTools lane: semantic Inspector support

Only after Slice 1 is accepted, PRODUCT may route a separate DevTools task to:

- import the existing `reference-metadata.ts` contract;
- add the recognition states and semantic payload fields above to the existing Inspector target,
  panel, session summary, and generated-prompt seams;
- derive resolved tokens from the DS metadata/Foundation truth, not a new DevTools list;
- keep independent padding/radius controls observational and separate;
- perform no live DOM/style mutation; and
- browser-prove direct, inherited, mixed, custom, missing, nested, keyboard, touch, undo, scope,
  and batch-payload behavior on `/hitoDS`.

If semantic recognition is unreliable, remove/disable only the Card Size selector and keep the
accepted DS component contract. Do not broaden heuristic `surface` classification to force
eligibility.

#### Slice 3 — Product consumers, only through new Product routing

No Product consumer is admitted by this discovery. A later Product/Designer audit may decide that a
specific neutral Product content-card family shares the same responsibility. Nav Card, Choice
Toggle Card, State Surface, Row Group, Manual Workout structure, auth, and overlays remain explicit
exceptions. Any Product migration needs its own owner, consumer map, behavior proof, and rollback.

#### Figma boundary

No approved Figma file key/node IDs were part of this task. Code remains canonical. A later DESIGN
SYSTEM INTEGRATION task may mirror the accepted code contract only after PRODUCT provides an exact
approved editable target. This absence does not block code/Inspector planning and does block any
Figma parity claim.

### Risks, Rollback, And Stop Conditions

| Risk                                       | Discriminator                                                                         | Rollback / stop                                                                                         |
| ------------------------------------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| “Size” is interpreted as width/height/span | A request or implementation changes grid columns, fixed height, or aspect ratio       | Stop; route a separate layout decision. Keep size density-only.                                         |
| Mixed sizes reduce showroom scanability    | Light/Dark desktop/mobile comparison shows awkward paired heights or hierarchy        | Reassign affected instances or all 14 to explicit `md`; keep tokens and grid unchanged.                 |
| Compact content clips focus/wraps poorly   | Keyboard focus ring is clipped, title/action collides, or horizontal overflow appears | Roll the instance to `md`/`lg`; do not shrink child controls or add truncation.                         |
| Large feels decoratively over-rounded      | Side-by-side implementation proof shows radius dominates content                      | Return to DESIGNER before changing the matrix. Do not globally change `--radius-3xl` or `--radius-xl`.  |
| Metadata and CSS drift                     | Declared size does not resolve to its exact token triple                              | Validator fails; Inspector reports `custom`; repair the DS owner before enabling semantic selection.    |
| Inspector recognizes unrelated surfaces    | An unmarked Nav/Choice/State/Row/Workout/overlay surface receives a size selector     | Fail the DevTools slice and remove the selector for that target; never add an Inspector-only allowlist. |
| Concurrent source movement                 | Relevant hashes/diffs move during implementation                                      | Stop and resnapshot; preserve concurrent work rather than absorbing it.                                 |
| Another family appears visually similar    | It lacks the same semantic role/anatomy/interaction owner                             | Keep excluded and route a separate discovery; matching pixels are not inclusion proof.                  |

### Explicit Unknowns And Ivan Decisions

- Browser/computed-value proof of the proposed Small and Large recipes does not exist yet because
  this task was documentation-only. Slice 1 owns that evidence.
- Runtime counts inside data-driven loops can exceed source counts. The inventory proves owners and
  call sites, not a hosted dataset snapshot.
- The exact future Inspector control placement and focus choreography remain a DevTools
  implementation detail, bounded by the state contract above.
- No Product consumer or Figma target has been admitted.
- **No Ivan decision is required for the bounded next Design System slice.** This report chooses
  density-only size, the exact token triples, persistent mobile identity, and the initial 14-card
  assignment. If Ivan wants Large to span columns, change preview height, or become a Product-wide
  card concept, that is a materially new layout/scope decision and must return to PRODUCT first.

### Final Planning Receipt

- **Task/stage:** Hito DS Card Size Contract And Inspector Recognition Discovery; Tracked DESIGNER
  research and implementation specification complete.
- **Product outcome:** a three-size contract is accepted for the 14-instance Overview Showcase Card
  family only. Medium preserves today's canonical 16px/10px geometry; no global radius correction
  is proposed.
- **Demonstrated seam:** existing `ShowcaseCard`, `.hito-ds-showcase-card`,
  `reference-metadata.ts`, Foundation primitives, and the existing component validator. No new
  framework or file is necessary.
- **Inspector discriminator:** confirmed DS ownership marker plus declared size; computed visual
  chrome alone is ineligible. Current duplicated Inspector radius arithmetic must not become the
  semantic source.
- **Files inspected:** Foundations/reference/component/Product surface owners, the `/hitoDS`
  renderer/model, shared control owners, relevant Manual Workout owners, and current Inspector
  target/metadata/payload seams.
- **Files changed:** this canonical item only.
- **Preserved boundaries:** all runtime/CSS/token/manifest/validator/DevTools/Figma/Product/source
  dirty work remained untouched; no browser acceptance, build, Global QA, hosted validation,
  release, or deployment is claimed.
- **Next recommended owner:** PRODUCT, to perform the concurrency gate and separately dispatch the
  bounded Slice 1 to DESIGN SYSTEM. Do not dispatch the DevTools slice until the DS contract is
  implemented and accepted.
- **Blockers:** none for Product routing of Slice 1. Product/Figma expansion remains outside scope.

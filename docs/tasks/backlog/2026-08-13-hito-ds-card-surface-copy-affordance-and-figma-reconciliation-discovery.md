# Hito DS Card Surface, Copy Affordance, And Figma Reconciliation Discovery

- **Work Item ID:** `2026-08-13-hito-ds-card-surface-copy-affordance-and-figma-reconciliation-discovery`
- **Status:** `completed`
- **Type:** Tracked — design discovery and implementation specification
- **Priority:** P1
- **Owner:** DESIGNER
- **Scope:** Hito DS reference/showroom card surfaces, token/provenance copy affordances, and a code-to-Figma update map.
- **Archive Intent:** Retain one decision and implementation-ready plan; do not duplicate a full card catalogue.
- **Stage:** DESIGNER discovery and implementation specification complete; returned to PRODUCT for
  owner-bounded routing.
- **Next Recommended Role:** PRODUCT. Route the code slices to DESIGN SYSTEM only after the active
  Foundations source is reconciled. Do not route Figma mutation until the exact approved standalone
  `Hito Running Library` file URL/key and editable node targets are available.

## User outcome

Make the design-system showroom feel like the implemented Hito Design System: reuse its existing card/surface primitives, remove decorative perimeter borders where they communicate nothing, and reserve lines for real separation, focus, selection, or an edge-token specimen. Where a card exposes a stable copyable fact such as a token name, hex value, class, or asset reference, reveal one copy affordance on hover/focus; touch must retain an accessible equivalent. The resulting plan must also say exactly what approved Figma export/file needs an update and how it maps to code.

## Evidence and starting seams

- [Completed narrow precedent](2026-08-11-hito-ds-showcase-card-borderless-surface.md).
- Current shared/reference seams include `hito-ds-showcase-card`, `hito-ds-token-specimen-surface`, existing reference renderers, shared `HitoDsPlayground`, and existing copy feedback behaviour.
- The request is broader than the completed Overview showcase-card slice. It is not evidence that every card, divider, focus ring, token edge specimen, or Product card should lose a border.

## Required discovery and plan

1. Inventory card-like surfaces in `/hitoDS`, grouping them by actual canonical owner rather than visual resemblance.
2. Classify each perimeter border as meaningful edge/selection/focus/contrast evidence, an internal divider, or decorative chrome that can be removed through its existing owner.
3. Find the existing reusable card and copy-feedback contracts. Specify where reuse is sufficient and where an approved shared primitive gap would need a separate DESIGN SYSTEM decision.
4. Define copy eligibility and feedback: only durable facts have a copy action; hover and keyboard focus reveal it without layout shift; touch has an equivalent; generic demo cards and arbitrary visual content do not acquire meaningless copy buttons.
5. Compare implemented code against the available Hito Figma export/file. Produce a concrete mapping of Figma targets, code owners, desired surface/copy states, and exact owner for later mutation. If no approved editable Figma target is discoverable, record that exact missing input rather than inventing one.
6. Write a single implementation-ready update plan in this canonical item: independently executable slices, source/Figma ownership, deletion/reuse path, visual states, acceptance matrix, rollout order, and stop conditions.

## Boundaries

- Discovery, design decision, and documentation only. Do not edit runtime code, CSS, tokens, manifests, validators, Figma, generated exports, public history, data, or Git lifecycle.
- Do not create a generic card family, arbitrary token, custom CSS recipe, copy registry, or an additional Figma library.
- Do not treat the existing `hito-ds-showcase-card` result as authorization to change every card. Preserve meaningful borders and every Product surface outside source-proven scope.
- DESIGN SYSTEM owns code-side shared primitives and showroom source. DESIGN SYSTEM INTEGRATION owns later approved Figma mutation. PRODUCT will route implementation after the plan is accepted.

## Definition of Done

- Every recommended change has a demonstrated canonical owner and a reason for change or preservation.
- The plan distinguishes code implementation from Figma mutation and names the next owner for each slice.
- Copy behaviour includes hover, keyboard focus, touch, success feedback, and non-copyable states.
- The plan contains no invented colour, radius, spacing, or component recipe.
- Markdown links resolve and `git diff --check` passes.

## Exact handoff prompt

```text
ROLE: DESIGNER

Task: Hito DS Card Surface, Copy Affordance, And Figma Reconciliation Discovery
Mode: Tracked — design discovery and implementation specification only.

Read before the first write:
- AGENTS.md
- agents/designer.agent.md
- skills/hito-frontend-design-system/SKILL.md
- skills/hito-plan-writing-and-closeout/SKILL.md
- docs/tasks/backlog/2026-08-13-hito-ds-card-surface-copy-affordance-and-figma-reconciliation-discovery.md
- docs/tasks/backlog/2026-08-11-hito-ds-showcase-card-borderless-surface.md

Outcome:
Prepare one implementation-ready plan making Hito DS reference/showroom card surfaces consistent with the canonical Design System: remove only decorative perimeter borders, reuse existing card/surface and copy-feedback contracts, and show a copy action only for durable facts such as token names, hex values, classes, or asset references. Produce an exact code-to-Figma update map.

Discovery:
1. Inventory `/hitoDS` card-like surfaces by actual owner.
2. Classify each border as meaningful edge/selection/focus/contrast evidence, internal divider, or removable decorative chrome.
3. Find existing card and copy-feedback seams; identify any real shared primitive gap without inventing a local recipe.
4. Specify copy eligibility and states: hover, keyboard focus, touch equivalent, success feedback, and no-action cases. No layout shift and no copy buttons on generic visual/demo cards.
5. Compare implemented code with the available Hito Figma export/file. Map exact Figma target, code owner, desired state, and later mutation owner. If an approved editable target is unavailable, report that precise blocker.
6. Add a single implementation-ready plan to the canonical item with independently executable slices, deletion/reuse path, responsive/accessibility requirements, acceptance matrix, rollout order, and stop conditions.

Boundaries:
- Documentation and design discovery only: do not edit runtime code, CSS, tokens, manifests, validators, Figma, generated exports, public history, data, or Git lifecycle.
- Do not create a card family, token, custom CSS recipe, copy registry, or second Figma library.
- Preserve meaningful borders, Product cards, active work, and unrelated dirty changes.
- DESIGN SYSTEM owns later code-side primitives/showroom work. DESIGN SYSTEM INTEGRATION owns later approved Figma mutation. Return implementation routing to PRODUCT.

Validate Markdown links and run git diff --check.

Final receipt (English): source/Figma inventory, accepted design decision, reusable seams, exact implementation slices and owners, Figma mapping or blocker, validation, and remaining boundary. Do not claim code, browser, Figma mutation, Global QA, or release readiness.
```

## Designer Discovery And Implementation Plan — 2026-08-13

### Accepted Design Decision

Hito needs no new card family and no universal “remove every border” migration. The canonical
reference grammar is:

1. A neutral showroom/reference card uses the existing borderless semantic surface owned by its
   current reference seam. It does not gain a decorative rest-state perimeter merely to look like a
   card.
2. A line remains when it communicates internal hierarchy, separates nested regions, proves an edge
   token, preserves component contrast, or represents selection/focus/state anatomy.
3. Copy is an affordance on a durable machine-readable fact, not a generic card action. Eligible
   values include an already displayed CSS variable/token expression, resolved hex value, reusable
   class, icon/asset identifier, or source reference. Titles, descriptions, live demo values,
   measured contrast, visual samples, and arbitrary card content are not copy targets.
4. Copy feedback reuses the existing Foundations clipboard fallback and Hito success/error toast.
   The action slot is present in layout at rest, revealed to hover-capable pointers on hover and to
   keyboard users on focus, and remains visible on no-hover/touch devices. Copy never changes card
   size or replaces the full value with an abbreviated clipboard payload.
5. Product cards, component specimens, pattern demonstrations, state surfaces, menus, overlays,
   App Shell frames, row groups, and visual evidence stay under their existing contracts.

This is a bounded consistency repair. Code and `/hitoDS` remain canonical; Figma is a downstream
mirror and cannot create a second card or copy pattern.

### Execution Snapshot And Concurrent Boundary

- Checkout: `/Users/ivan/Developer/hito-running`, branch `main`, `HEAD`
  `74607987885ca40f33658c79fba174d173d45646`.
- The initial dirty snapshot included unrelated Product/backlog/policy work and active `/hitoDS`
  changes in `playground.tsx`, `reference-foundations-page.tsx`, and
  `reference-brand-page.tsx`. It also included the completed validator reconciliation and current
  favicon reconciliation work. None was modified by this discovery.
- The current Foundations cleanup item is still marked `blocked` while its rendered-source work is
  present and its validator successor is completed. PRODUCT must reconcile that lifecycle before a
  new writer enters `reference-foundations-page.tsx`.
- `playground.tsx`, `reference-brand-page.tsx`, and `figma-export-board.tsx` remained stable at
  `fcb7d673…750adc`, `9e663d52…171d`, and `5f8abe97…10455`. The concurrent Foundations owner moved
  `reference-foundations-page.tsx` from `2cdafbdb…ca35b` to `c8b2fe65…44a6d` during final
  validation. The affected surface/copy symbols were re-read at the later snapshot; their ownership
  and this plan's classification did not change. The implementation owner must still take a fresh
  symbol-based snapshot rather than relying on these transient line numbers.
- Conclusions below distinguish the accepted `HEAD` copy seam from the concurrent Mark provenance
  enhancement. The latter may be reused only after its owning task is accepted; this plan does not
  absorb it.

### Source Surface Inventory And Border Classification

| Actual owner / route family             | Current surface and consumer evidence                                                                                                                                                                                                        | Border classification                                                                                                                                                                                         | Decision                                                                                                                                                                                                                           |
| --------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Overview showroom                       | `reference-overview-page.tsx:399-425` renders `ShowcaseCard`; `reference-workbench.css:384-399` owns `hito-ds-showcase-card`.                                                                                                                | Outer perimeter is already absent. The header `border-b` is an internal divider between navigation metadata and the live stage.                                                                               | Preserve the borderless outer card, semantic Dark/Light backgrounds, radius, padding, divider, 14 live previews, and `Open` action. Add no copy action: these are generic interactive demos, not durable facts.                    |
| Shared playground                       | `playground.tsx` renders `hito-ds-playground-stage`; `reference-workbench.css:133-190` owns its demo/variants surfaces.                                                                                                                      | Demo is already borderless; Variants intentionally removes all stage chrome.                                                                                                                                  | Preserve. It is a demonstration canvas, not a card or copy target.                                                                                                                                                                 |
| Neutral Foundations/Brand specimens     | `hito-ds-token-specimen-surface` is owned at `reference-workbench.css:2-6` and consumed by neutral colour, typography, spacing, radius, role, Mark, Icon usage, and Logo renderers.                                                          | Outer perimeter is already absent. Inner swatch boundaries, Mark provenance divider, role `border` slots, and deliberate sample frames are evidence or internal hierarchy.                                    | Keep one borderless outer contract. Preserve all factual inner lines. Do not broaden this selector to Product or generic component surfaces.                                                                                       |
| Foundations colour-copy cards           | `PrimitiveColorSwatchButton` and `SemanticColorCard` in the later snapshot at `reference-foundations-page.tsx:1766-1854`.                                                                                                                    | Outer is borderless; primitive swatch divider and preview hairline prove colour boundaries. Focus ring is interaction evidence.                                                                               | Preserve lines and full-card button semantics. Retain copy, but make the reserved icon visible on no-hover/touch just as the current Mark provenance work proposes.                                                                |
| Foundations durable-fact renderers      | `SemanticRoleCard`, `TypographyFamilyRow`, `SpacingPrimitiveRow`, `RadiusPrimitiveRow`, `TypographyRoleCard`, and `IconSpecimen` display stable token/class/identifier facts.                                                                | Their neutral outer surfaces are borderless or row-based; inner borders are role/scale/specimen evidence.                                                                                                     | Add copy only beside the already displayed durable identifier. Do not make the visual sample or entire noninteractive card clickable.                                                                                              |
| In-flight Mark provenance               | Current worktree `MarkTokenProvenance` exposes one copy action per Frame/Glyph/Content token with a reserved icon and no-hover visibility.                                                                                                   | Its `border-t` separates identity facts from provenance facts.                                                                                                                                                | Retain if the active Foundations task is accepted. Reuse its interaction grammar; do not implement a parallel Mark solution in this task.                                                                                          |
| Generic reference rows/lists            | `hito-reference-list`, `hito-reference-row`, and `hito-section-divider` at `reference-workbench.css:34-55`.                                                                                                                                  | Lines create list rhythm and section hierarchy; they are not card perimeters.                                                                                                                                 | Preserve. A row may expose a copy control only for a displayed durable fact, such as a typography class.                                                                                                                           |
| Product/shared component demonstrations | `hito-surface-flat`, `hito-surface-quiet`, `hito-state-surface`, `hito-row-group`, menu/sheet/dialog surfaces, App Shell frames, calendar grids, tables, dropdown panels, and disclosure examples across Components/Patterns/Brand/Overview. | Borders represent functional grouping, semantic state, focus, nested canvas contrast, overlay elevation, table/calendar geometry, or the component contract being demonstrated.                               | Preserve byte-for-byte unless a separate source-proven component task changes that owner. Never use this plan to flatten Product cards.                                                                                            |
| Atmospheric and Brand visual evidence   | Auth image frame, launch surface, alpha surface, editorial/state washes, deliberate light/dark/favicons in `reference-brand-page.tsx`.                                                                                                       | Border/fill/gradient is the subject of the example or provides image/elevation containment.                                                                                                                   | Preserve. Logo cards have no copy action because no asset path or component identifier is currently presented as a factual value.                                                                                                  |
| Code-owned Figma capture board          | `figma-export-board.tsx` owns deterministic capture matrices. Six wrappers at lines 315, 337, 353, 380, 986, and 1004 repeat `rounded-2xl border border-hairline bg-background/55`.                                                          | Those six outer strokes are decorative capture-board chrome. Section/header lines, typography row dividers, swatch borders, radius-shape edges, sheet/menu edges, and component state borders are meaningful. | Replace only the six decorative wrapper recipes with the existing borderless reference surface. Preserve capture determinism and every meaningful/internal edge. Do not add copy behavior to this downstream static capture route. |

No other source-proven perimeter removal is admitted. Similar radius, background, or hairline syntax
does not make two surfaces the same owner.

### Reusable Card And Copy Seams

- **Neutral reference surface:** `hito-ds-token-specimen-surface` already owns `border: 0`,
  `--radius-3xl`, and the semantic background. It is sufficient for the six capture-board wrappers;
  no selector or token gap exists.
- **Overview surface:** `hito-ds-showcase-card` already owns the accepted Overview-specific theme
  behavior and must remain separate because its Light mapping and layout responsibility differ from
  Foundation token cards.
- **Copy execution and feedback:** `copyColorValue` plus `copyTextWithLegacySelection` and
  `hitoToast.success/error` in the later snapshot at
  `reference-foundations-page.tsx:295-325,1877-1891` already covers
  clipboard fallback, success announcement, and failure recovery. Broaden its local name/purpose to
  reference values rather than creating another clipboard function or shared package.
- **Action chrome/focus:** existing `HitoButton` ghost/icon-only behavior is the canonical explicit
  action when a static card needs a separate button. Existing whole-card colour buttons retain their
  button semantics. Never nest a button inside a button.
- **Reveal grammar:** the current in-flight Mark action reserves icon space and uses
  hover-capability media behavior so no-hover/touch users see the action. Reuse that composition
  after the owning task lands; no custom CSS recipe is needed.
- **Shared primitive gap:** none is currently demonstrated. The interaction is reference-local,
  uses existing Button/Icon/Toast/focus contracts, and does not justify a Product-wide `CopyCard`,
  registry, hook, token, or card primitive.

### Copy Eligibility And State Contract

| Renderer                                                                       | Clipboard payload                                                                | Action shape                                                                          | No-action boundary                                                                                                   |
| ------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Primitive colour card                                                          | Existing raw primitive value, including hex/alpha exactly as declared.           | Whole card remains the copy button; icon is decorative and its slot remains reserved. | Do not copy the human step label, note, or computed preview.                                                         |
| Semantic colour card                                                           | Existing semantic CSS expression/token value.                                    | Whole card remains the copy button.                                                   | Computed active/composite hex remains visual truth unless a distinct displayed hex action is later requested.        |
| Workout/section semantic role                                                  | Displayed base token expression only.                                            | One explicit ghost/icon-only action beside the token.                                 | Do not add actions to every measured slot or contrast verdict.                                                       |
| Typography family                                                              | Displayed font CSS variable.                                                     | One explicit action beside the token.                                                 | Purpose, weights, guidance, and source prose remain non-copyable.                                                    |
| Spacing/radius primitive                                                       | Displayed CSS variable expression; the numeric value remains supporting context. | One explicit action in the fact row.                                                  | The visual gap/corner sample is not clickable.                                                                       |
| Reusable typography role                                                       | Displayed leading class, including its leading period.                           | One explicit action in `hito-reference-meta`.                                         | Sample sentence and computed spec remain non-copyable.                                                               |
| Icon registry specimen                                                         | Canonical icon name used by the `Icon` API.                                      | One explicit action associated with the name, not the glyph canvas.                   | Category and visual glyph are not copy targets. Icon usage/demo cards remain action-free.                            |
| Mark provenance                                                                | Existing Frame/Glyph/Content token string after active-task acceptance.          | Retain the current per-row action.                                                    | Mark title, workout family, optical-fit text, and artwork remain non-copyable.                                       |
| Overview, Playground, Brand visuals, Components, Patterns, Figma capture board | None.                                                                            | No copy action.                                                                       | These are demos, compositions, or downstream capture matrices rather than interactive durable-fact reference owners. |

Required states:

- **Rest on hover-capable pointer:** the action occupies its final geometry but is visually quiet;
  text truncation and card dimensions are unchanged.
- **Hover:** reveal only the action associated with the hovered durable fact/card; use existing ghost
  hover chrome and do not move the card.
- **Keyboard focus:** the actual button receives the canonical solid focus ring and the icon is
  visible. Tab order follows DOM order. Full-card colour buttons retain one stop each.
- **Touch/no-hover:** the icon/action is visible without requiring hover. The existing SM icon-only
  Button supplies a 32 px target, above the
  [WCAG 2.2 SC 2.5.8 minimum of 24 by 24 CSS pixels](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum.html);
  no separate mobile control is introduced.
- **Success:** copy the complete underlying payload and announce the existing short Hito success
  toast with label and value. The layout remains unchanged and focus stays on the trigger.
- **Failure:** retain the existing error toast and manually selectable visible value. Do not claim a
  copied state.
- **Truncation:** the visible value may ellipsize, but accessible name/title exposes the complete
  fact and the clipboard receives the complete fact.
- **No action:** no invisible focus stop, no hover-only icon, and no disabled placeholder control.

### Code-To-Figma Reconciliation Map

The available repository artifact is the code-owned `/hitoDS/export/figma` capture board, not an
editable Figma file. The
[code-to-Figma foundation record](2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md) names the
approved standalone destination **Hito Running Library**, but the exact file URL/key and destination
node IDs are absent. The Overview truthfully renders `Figma URL awaiting approval`. Historical links with file key
`RNcNPUpUgMcpeTk6UFwbn4` identify the older `hito-running` file and are not authorization to mutate
or infer the standalone library.

| Code/capture owner                                                                             | Desired code state                                                                                                   | Downstream Figma target                                                                                                                            | Later owner                                                  | Current gate                                                                                                                         |
| ---------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------ |
| `reference-overview-page.tsx` + `hito-ds-showcase-card`                                        | Borderless showroom outer surface; internal header divider; no copy action.                                          | Existing showroom/reference card frame in `Hito Running Library`, if one exists. Exact node ID unknown.                                            | DESIGN SYSTEM INTEGRATION                                    | Blocked on approved file URL/key and node discovery. Do not create a second card component.                                          |
| `reference-foundations-page.tsx` + `hito-ds-token-specimen-surface`                            | Borderless neutral specimen; meaningful swatch/divider/edge evidence retained.                                       | Existing Foundation specimen/card frames in `Hito Running Library`. Exact node IDs unknown.                                                        | DESIGN SYSTEM INTEGRATION                                    | Same target gate; reconcile existing nodes after code acceptance.                                                                    |
| Foundations durable-fact copy affordance                                                       | Default, hover, keyboard-focus, touch-visible, success-toast, and no-action examples exactly matching accepted code. | Existing reference-card/value examples, if present; otherwise no component-family creation without a separate Product admission.                   | DESIGN SYSTEM INTEGRATION                                    | Exact nodes and approved component-family scope are unavailable. Map behavior from code; never invent Figma-local interaction truth. |
| `data-figma-export-section="foundations"` (`TokenGrid`, `SpacingRadiusGrid`, `TypographyGrid`) | Six decorative capture wrappers converge on the existing borderless reference surface; internal evidence lines stay. | Admitted `Primitive / Color`, `Semantic / Color`, `Primitive / Spacing`, `Primitive / Radius`, and reusable Text Styles in `Hito Running Library`. | DESIGN SYSTEM for board; DESIGN SYSTEM INTEGRATION for Figma | Collections are named, but file key/nodes and editable parity remain unverified.                                                     |
| `data-figma-export-section="icons"` (`IconInventory`)                                          | Decorative icon-tile perimeters removed; glyph well border retained; capture stays static.                           | Existing Icon inventory/components in `Hito Running Library`, if admitted.                                                                         | DESIGN SYSTEM then DESIGN SYSTEM INTEGRATION                 | Component export was previously excluded pending family proof; PRODUCT must confirm admission and exact target.                      |

The missing target is a Figma-only blocker. It does not block code-side surface/copy cleanup, but it
does block any claim of exact node parity, Figma mutation, or library readiness.

### Implementation Slices And Rollout Order

#### Gate 0 — PRODUCT concurrency and target check

1. Reconcile the blocked Foundations cleanup against its completed validator successor and confirm
   no active writer remains in `reference-foundations-page.tsx` or `playground.tsx`.
2. Let the favicon reconciliation finish independently; this plan does not modify its source.
3. Preserve a fresh dirty/source snapshot. If the six Figma-board recipes or copy seam moved,
   re-run the owner classification rather than applying this plan mechanically.
4. Record the exact standalone `Hito Running Library` URL/key if available. Absence blocks only the
   later Integration slice.

#### Slice A — DESIGN SYSTEM: capture-board decorative perimeter reduction

- Change only `figma-export-board.tsx` and, only if genuinely required for existing selector reuse,
  its already imported stylesheet owner. Replace the six named outer wrapper recipes with
  `hito-ds-token-specimen-surface` plus their existing layout/padding utilities.
- Delete the repeated `rounded-2xl border border-hairline bg-background/55` responsibilities from
  those wrappers. Add no selector, token, component, prop, file, or compatibility class.
- Preserve `ExportSection` and page-header dividers; colour/radius/glyph well borders; typography
  row dividers; all component state surfaces; generated manifest input; deterministic capture
  content; and html.to.design semantics.
- Stop if the existing reference surface cannot provide readable Dark/Light containment without a
  new token or if a border proves part of a captured component contract.

This slice is independently auditable and net-reducing: six local decorative recipes become one
existing contract and no replacement recipe is added.

#### Slice B — DESIGN SYSTEM: Foundations copy contract adoption

- Start only after Gate 0. Work inside `reference-foundations-page.tsx`; reuse the existing copy
  callback/fallback/toasts, Icon, Button, focus, and the accepted Mark provenance grammar.
- Rename/generalize the local colour-only callback rather than adding another copy engine. Apply
  the eligibility table to the existing semantic-role, typography-family, spacing, radius,
  typography-role, and icon renderers. Preserve existing whole-card colour copy behavior.
- Make existing colour-card icons touch-visible with the same no-hover rule as accepted Mark
  provenance. Reserve action geometry at all times; do not add nested interactive elements.
- Retain every visible durable value. Remove only redundant local interaction classes or wrappers
  whose responsibility is replaced by the existing Button/action composition; keep full-value
  title/accessibility and manual text selection.
- New runtime artifacts: none. No shared copy registry, hook, component family, CSS recipe, token,
  manifest field, or Product consumer.
- Stop if implementation needs a cross-page clipboard owner, a global primitive, Product change,
  or a second active source writer. Return that demonstrated gap to PRODUCT.

This slice is independently auditable: all listed durable facts copy exact values; every excluded
card has zero copy controls; and the clipboard/toast implementation count does not increase.

#### Slice C — DESIGN SYSTEM INTEGRATION: approved Figma reconciliation

- Run only after Slices A/B are accepted and PRODUCT supplies the exact approved file URL/key plus
  scoped node/family permission.
- Read repository source and accepted browser evidence as canonical. Discover existing destination
  nodes before creating anything; update only the mapped existing frames/components/collections.
- Reconcile borderless outer surfaces and meaningful inner lines. Represent copy states only where
  an existing admitted reference/value component exists; do not invent a Figma-only Copy Card.
- Keep repository runtime source read-only. Record unresolved code/Figma conflicts and return them
  to PRODUCT; do not repair code from the Integration role.
- Stop on the legacy `hito-running` target, missing edit access, ambiguous/duplicate nodes,
  publication, destructive replacement, or a need for an unapproved component family.

### Responsive, Accessibility, And Acceptance Matrix

| Check                          | Routes / state                                                                    | Required result                                                                                                                                                                           | Evidence owner                                    |
| ------------------------------ | --------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| Overview preservation          | `/hitoDS`, Dark/Light, 1470×801 and exactly 375×812                               | 14 showroom cards retain zero outer perimeter, one internal header divider, intrinsic previews, working `Open` links, and no copy controls.                                               | DESIGN SYSTEM implementation; later QA if routed. |
| Foundation surface consistency | `/hitoDS/foundations`, same matrix                                                | Neutral specimens remain borderless and theme-correct; swatches, role edge slots, provenance divider, sample frames, and focus rings remain visible.                                      | DESIGN SYSTEM.                                    |
| Copy pointer states            | Each eligible renderer, hover-capable desktop                                     | Rest geometry is stable; only the relevant icon reveals on hover; exact full payload reaches clipboard; success/error toast is truthful.                                                  | DESIGN SYSTEM.                                    |
| Copy keyboard states           | Each eligible renderer, both themes                                               | Logical tab order, one stop per action, canonical visible focus ring, Enter/Space activation, focus retained after toast, no nested controls.                                             | DESIGN SYSTEM.                                    |
| Copy touch states              | 375×812 or no-hover emulation, both themes                                        | Action is visible without hover, tappable, does not overflow or shift content, and truncated values retain full accessible text.                                                          | DESIGN SYSTEM.                                    |
| No-action census               | Overview, Playground, Brand visuals, Component/Pattern demos, Figma capture board | No copy icon, invisible focus stop, or disabled placeholder appears on generic visual/demo content.                                                                                       | DESIGN SYSTEM.                                    |
| Capture-board surfaces         | `/hitoDS/export/figma`, Dark/Light desktop and mobile                             | The six decorative wrapper perimeters are absent; section/header/row/swatches/radius/glyph/component borders remain; no overflow; capture content and manifest parity stay deterministic. | DESIGN SYSTEM.                                    |
| Source/static                  | Task-owned source                                                                 | DS validator, manifest `--check`, focused Prettier/ESLint, source census for the six deleted recipes, and `git diff --check` pass. Build only if uncontended runtime policy requires it.  | DESIGN SYSTEM.                                    |
| Figma parity                   | Exact approved `Hito Running Library` file after Integration dispatch             | Mapped existing nodes match accepted code in surface, retained edges, and admitted copy states; no duplicate library/component; edit receipt names file key and node IDs.                 | DESIGN SYSTEM INTEGRATION.                        |

Browser proof is implementation validation, not part of this design-only discovery. Global QA,
hosted parity, publication, release readiness, and deployment remain separate Product decisions.

### Rollback And Stop Conditions

- **Code rollback unit:** Slice A and Slice B are separate owner-bounded diffs. If one fails its
  focused matrix, revert only that slice's task-owned changes; do not restore borders globally or
  introduce a compatibility selector.
- **Meaningful-edge stop:** if removing a named border loses nested-region separation, state/focus
  evidence, or contrast in either theme, restore that one edge and record the discriminator.
- **Copy-semantics stop:** do not ship a hover-only action, nested button, abbreviated payload,
  shifting layout, or success message without a successful copy.
- **Ownership stop:** Product/shared cards, a new token/component/file, or another source owner
  returns to PRODUCT before expansion.
- **Concurrency stop:** any movement in the admitted files after preflight invalidates line-based
  execution; refresh the snapshot and owner map.
- **Figma stop:** no exact standalone file URL/key, edit permission, or existing-node identity means
  no Figma mutation. Never substitute historical legacy nodes or create a second library.

### Validation Inventory For This Discovery

| Check                          | Scenario / environment                                                      | Result                          | Evidence / consequence                                                                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Required instruction preflight | Current checkout                                                            | Passed                          | Read `AGENTS.md`, `agents/designer.agent.md`, both assigned project skills, this canonical item, and the completed Overview card precedent before the first task-owned write.                                                               |
| Dirty/source snapshot          | Shared `main` checkout                                                      | Passed with concurrent boundary | Captured exact branch/HEAD/status and inspected active task ownership. Foundations moved once during final validation; the affected symbols were re-read and the movement is recorded instead of absorbed. No concurrent hunk was modified. |
| Card/border inventory          | `/hitoDS` reference, component, pattern, Brand, Overview, and export owners | Passed                          | Every recommendation is tied to an actual owner; decorative perimeter, internal divider, component edge, focus/selection/state, and visual-evidence borders are separated.                                                                  |
| Copy seam and eligibility      | Current and `HEAD` Foundations source                                       | Passed                          | Existing fallback + success/error toast and full-card colour actions prove reuse; the in-flight Mark action is recorded as a dependency rather than silently accepted.                                                                      |
| Figma inventory                | Repository export board, manifest programme, target records                 | Blocked only for mutation       | Exact capture sections and named collections are mapped. Standalone target name is known, but URL/key/editable node IDs are absent; legacy links are explicitly excluded.                                                                   |
| Runtime/browser/Figma mutation | Outside design-only scope                                                   | Not run                         | No code, CSS, token, manifest, validator, generated output, browser acceptance, Figma file, Global QA, hosted, release, or deployment claim is made.                                                                                        |
| Documentation hygiene          | Canonical item                                                              | Passed                          | Both relative task links resolve; the W3C guidance URL was opened successfully; scoped Prettier and `git diff --check` pass.                                                                                                                |

### Final Designer Receipt

- **Task and mode:** Hito DS Card Surface, Copy Affordance, And Figma Reconciliation Discovery;
  Tracked design discovery and implementation specification only.
- **Outcome:** one owner-backed implementation plan now preserves meaningful borders, removes only
  six demonstrated decorative capture-board wrapper recipes, extends the existing Foundations copy
  feedback only to displayed durable facts, and keeps generic demo cards action-free.
- **Reusable seams:** `hito-ds-showcase-card`, `hito-ds-token-specimen-surface`,
  `HitoDsPlayground`, the existing Foundations clipboard fallback/toasts, `HitoButton`, `Icon`, and
  the current in-flight Mark reveal grammar if its owning task is accepted.
- **Files changed:** this canonical item only.
- **Figma result:** source-to-capture/collection mapping is complete; Figma mutation is precisely
  blocked by the missing approved standalone file URL/key, editable node IDs, and confirmed Icon /
  reference-component admission. Historical `hito-running` nodes are not a substitute.
- **Next owner:** PRODUCT for routing. First later code owner: DESIGN SYSTEM after concurrent
  Foundations lifecycle reconciliation. Later Figma owner: DESIGN SYSTEM INTEGRATION only after the
  exact target gate is satisfied.
- **Remaining boundary:** no implementation, browser acceptance, Figma mutation, Global QA, hosted
  parity, publication, release readiness, or deployment was performed or claimed.
- **Role file:** `agents/designer.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-plan-writing-and-closeout/SKILL.md`.
- **Subagents:** none; source and retained records were sufficient for the decision.

# Hito DS Mobile Density And Responsive Typography Discovery

## Work Item ID

2026-08-13-hito-ds-mobile-density-and-responsive-typography-discovery

## Status

completed

## Type

design-system responsive-density discovery

## Priority

high

## Owner

DESIGNER

## Mode

Tracked

## Stage

DESIGNER read-only discovery and implementation specification completed; no runtime mutation.

## Next Recommended Role

PRODUCT

## Scope

Establish a source-backed, accessible Hito responsive-density recommendation for narrow viewports.
It must cover the spacing hierarchy of application shells, page containers, sections, cards or
specimens, lists, and Design System playgrounds, together with the relationship between mobile
density and Hito typography roles. This is a design/research task; it does not change CSS, tokens,
component APIs, product layouts, DevTools, Figma, or runtime behavior.

## Archive Intent

retain_in_place

## Task

Ivan reports that mobile Hito surfaces feel excessively spacious: padding and gaps consume too
much of the limited viewport. His current hypothesis is that mobile layout spacing should become
more compact while typography may retain or selectively increase its readability. It is not an
accepted prescription to scale every value down or every text role up.

Research contemporary responsive-density and accessibility practice, inspect the current Hito
token scale and actual mobile media rules, and produce one implementation-ready recommendation.
The outcome must say exactly which spacing relationships should compact on mobile, which must not,
how typography should behave by role, and whether the current primitives already express the
answer. Prefer responsive use of existing Hito tokens over a global token rewrite or a parallel
mobile token system.

## User Report

- On mobile devices, Hito pages and Design System references appear too open: outer padding,
  section spacing, internal gaps, and large specimen/playground spacing reduce usable content area.
- Ivan wants a researched Hito-specific recommendation rather than an arbitrary global reduction.
- He suspects that typography may become more prominent for small screens while spacing contracts,
  padding, and gaps become more compact; the task must evaluate this rather than assume it.

## Current Source Facts

- Canonical Hito space primitives in `src/styles/foundations.css:389-396` are `--space-1` through
  `--space-10` (4px through 40px). The task has no evidence that this scale itself is incorrect.
- `src/styles/reference-workbench.css` owns much of `/hitoDS` reference/playground geometry,
  including `.hito-ds-playground`, shell, stage, controls, reference layout, and narrow-screen
  rules.
- Existing responsive behavior is distributed across canonical CSS and consumer seams, including
  `reference-workbench.css`, `layout-typography.css`, `controls-lists.css`,
  `forms-onboarding.css`, `calendar-state-surfaces.css`, and `shell-admin-analytics.css`.
- The current inventory proves multiple existing narrow-screen rules, but not one coherent
  density contract or the correct change boundary. Browser observation and source census are still
  required before recommending any global rule.

## Questions To Resolve

1. Which mobile viewport range(s) are materially relevant to Hito, and is one breakpoint enough
   for density rules? Do not introduce a breakpoint merely to satisfy a matrix.
2. What is the Hito spacing hierarchy on desktop and narrow mobile for:
   - page canvas and App Shell content inset;
   - page title and section separation;
   - cards/specimens/playground stages and right-side controls;
   - list rows, fields, tables, chips/tags, and repeated action clusters?
     Distinguish visual whitespace from minimum interactive target geometry.
3. Which existing `--space-*` values can express each compact mobile rule, and which current
   mobile values already work and should be preserved? Identify any real token gap rather than
   inventing a mobile scale.
4. For each Hito text role, should mobile retain its desktop size, use a responsive step, or change
   only line length/line-height/placement? Explain why. Do not make a blanket "larger on mobile"
   rule that breaks hierarchy, containment, touch targets, localization, or product density.
5. How should display titles, body copy, labels, technical text, tables, fields, inline controls,
   and long/translated Portuguese strings behave at 375×812 and the narrowest supported viewport?
6. What is the least risky rollout order across shared DS CSS, `/hitoDS` references, App Shell,
   and Product consumers? Separate shared-contract changes from owner-specific adoption slices.

## Required Discovery Deliverable

Write an English implementation specification in this canonical item that includes:

1. a source and representative rendered-surface inventory for Desktop plus 375×812 Light/Dark,
   grouped by canonical owner and current spacing/typography behavior;
2. direct links to current authoritative guidance for responsive layout, text readability, reflow,
   and interactive target sizes; distinguish external guidance from Hito decisions;
3. a recommended mobile-density matrix using current Hito spacing and typography primitives:
   desktop baseline, narrow-screen value, rationale, exclusions, and the responsible source owner;
4. an explicit typography decision by role group, including whether any role becomes larger, the
   evidence for it, and handling of line-height, wrapping, localization, data-dense tables, and
   technical metadata;
5. accessibility constraints: 320px/375px containment, 44px target guidance or existing justified
   Hito control contracts, focus visibility, no color-only information, browser zoom/reflow, and
   reduced-motion implications where layout changes animate;
6. a migration map with independently auditable Design System and Product slices, deletions or
   simplifications, validation strategy, rollback, and stop conditions; and
7. a concise recommendation, alternatives rejected, remaining Ivan decisions, and one exact next
   owner recommendation. Do not dispatch that implementation.

## What Not To Touch

- Runtime source, CSS, tokens, manifests, validators, DevTools, Figma, product data, persistence,
  provider behavior, fixtures, Git lifecycle, hosted state, deployment, or browser runtime state.
- Existing semantic typography ownership or the completed typography-consolidation contract without
  source-backed evidence.
- Touch-target minimum sizes, field/row interaction contracts, table scrolling ownership, or the
  existing canonical desktop design merely to reduce whitespace.
- A universal global mobile multiplier, parallel mobile token scale, or component-size API without
  demonstrated recurrent need and replacement path.

## Acceptance For This Discovery

- The recommendation distinguishes global DS candidates from reference-only and Product-only
  changes; it does not treat every mobile gap as the same defect.
- Every proposed value maps to a current Hito primitive or names a demonstrated gap.
- Typography advice is role-specific, evidence-backed, and compatible with English and pt-BR
  content expansion.
- Accessibility and responsive containment are explicit, not assumed from screenshots.
- The result gives PRODUCT small, owner-true implementation slices rather than one broad rewrite.
- Documentation formatting and `git diff --check` pass. No browser/build proof is claimed because
  runtime behavior must remain unchanged.

## Designer Decision

### Recommendation

Hito should compact **large composition spacing below the existing 640px breakpoint while keeping
component density and the accepted typography scale stable**. The current `--space-*` vocabulary is
sufficient. There is no demonstrated need for a mobile token namespace, a global multiplier, a new
breakpoint, a new typography role, or a component-size API.

The report demonstrates three different situations that must not be collapsed into one global
fix:

1. The Product route gutter is already correct at `--space-4` (16px) on narrow screens and must be
   retained.
2. Shared route rhythm is too open on narrow screens and its mobile override is owned by the wrong
   stylesheet: generic `.hito-route-stack`, `.hito-page-header`, and `.hito-section-header` rules
   currently live in the Calendar owner.
3. `/hitoDS` adds several independent layers of reference-only whitespace: wrapper and heading
   padding, section separation, playground-tab separation, and a generic 320px minimum demo stage.
   Those layers, rather than the spacing scale itself, create the strongest observed density issue.

Typography must not become globally larger on mobile. Hito titles already use responsive `clamp()`
floors, while body, label, technical, table, and component-bound metric roles already encode their
semantic hierarchy. The layout should make room for those roles through reflow, wrapping, and
reduced composition spacing. A text role may change only when its semantic role is wrong across all
viewports; that is a separate typography-adoption correction, not a mobile override.

No unresolved Ivan decision blocks the recommended first implementation. An optional later Product
choice remains outside this slice: whether the newly enlarged **desktop** playground-tab separation
should also be compacted. This report preserves the current desktop value and changes only the
narrow contract.

## Preflight And Evidence Boundary

- Branch: `main`.
- Source snapshot inspected: `74607987885ca40f33658c79fba174d173d45646`.
- The checkout was already broadly dirty. In-scope runtime owners, including `AppShell.tsx`, Hito DS
  reference TSX, Foundations, layout, Calendar, shell, and workbench CSS, contain concurrent work.
  This discovery preserved every runtime byte and wrote only this canonical item.
- Existing August 12–13 QA screenshots were inspected as representative rendered evidence. They are
  not a fresh browser run against the dirty source snapshot and therefore do not prove current
  runtime acceptance.
- No browser, build, Figma, DevTools, fixture, data, provider, hosted, Global QA, release, or
  deployment claim is made.

## Canonical Source Inventory

| Owner                                                                | Current source contract                                                                                                                                                                                                                                                                                                                                                                   | Finding                                                                                                                                                                                                                                              | Decision                                                                                                                                                                                                                                       |
| -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Foundations / DESIGN SYSTEM                                          | [`foundations.css`](../../../src/styles/foundations.css) defines `--space-1/2/3/4/5/6/8/10` as 4/8/12/16/20/24/32/40px.                                                                                                                                                                                                                                                                   | The scale covers every recommended narrow value.                                                                                                                                                                                                     | Preserve values and names; add no mobile aliases.                                                                                                                                                                                              |
| Shared layout / DESIGN SYSTEM                                        | [`layout-typography.css`](../../../src/styles/layout-typography.css) owns typography roles, `.hito-route-gutter`, `.hito-route-stack`, `.hito-page-header`, `.hito-section-header`, and `.ds-section`. Route gutter is 16px below 640, 24px from 640, and 40px at the existing large composition breakpoint.                                                                              | The horizontal route contract is already compact. Raw 52px route-stack, 40px page-header, and the 48px + 32px DS section pair are the relevant large rhythms.                                                                                        | Preserve the gutter. Resolve the large rhythm responsively from existing tokens.                                                                                                                                                               |
| Calendar composition / DESIGN SYSTEM                                 | [`calendar-state-surfaces.css`](../../../src/styles/calendar-state-surfaces.css) applies generic narrow `.hito-route-stack` (36px), `.hito-page-header` (32px), and `.hito-section-header` rules inside `max-width: 640px`, alongside valid Calendar-only nav-card rules.                                                                                                                 | The generic rules are reachable Product-wide and are not Calendar facts. At exactly 640px they also overlap the `min-width: 640px` route-gutter step.                                                                                                | Move only the generic rules to the shared layout owner, use the existing `<640px` boundary, and leave nav-card rules in Calendar. This is ownership cleanup, not proof that Calendar caused all spaciousness.                                  |
| App Shell / FRONTEND Product consumer of DS                          | [`AppShell.tsx`](../../../src/components/AppShell.tsx) uses a 56px sticky header, 24px mobile header inset/gap, 40px large inset, and the shared Button contract. [`shell-admin-analytics.css`](../../../src/styles/shell-admin-analytics.css) defines a 60px bottom nav plus safe-area inset and 12px/4px row padding.                                                                   | The mobile topbar inset is wider than the 16px route gutter. The 56px header, bottom-nav geometry, safe area, focus treatment, and control sizes are functional containment/target facts.                                                            | Align only mobile topbar inset and major gap to 16px. Preserve header height, bottom nav, safe area, and controls.                                                                                                                             |
| `/hitoDS` shell / DESIGN SYSTEM                                      | [`reference-page.tsx`](../../../src/components/hito-ds/reference-page.tsx) uses mobile `px-6 py-8`, topbar `px-5`, and another `pt-8` before the H1. [`reference-overview-page.tsx`](../../../src/components/hito-ds/reference-overview-page.tsx) repeats `pt-8`, then adds `pt-10` and `gap-12` before/between showroom groups.                                                          | The reference heading begins after 64px of stacked content padding; Overview then combines a 40px header margin with another 40px showroom inset. These are reference composition layers, not component requirements.                                | Use 16px horizontal and 24px vertical wrapper spacing on narrow screens; remove the duplicate narrow heading/showroom top padding; use 32px between showroom groups. Preserve desktop.                                                         |
| `/hitoDS` sections and playground / DESIGN SYSTEM                    | [`playground.tsx`](../../../src/components/hito-ds/playground.tsx) composes `.ds-section`, specimen header, tabs, stage, and controls. [`reference-workbench.css`](../../../src/styles/reference-workbench.css) currently adds 48px before tabs, about 22px playground gap, 20px shell gap, a generic 320px minimum demo stage, and at least 28px stage padding.                          | A narrow screenshot can spend most of a viewport on empty generic stage height before the next reference fact. The current 48px tab offset is also a concurrent dirty change from the prior 16px value; it must not be silently reverted on desktop. | Make the generic narrow demo stage content-driven with 16px padding; use 16px for playground/tabs/shell gaps; restore current stage geometry from 640px upward. Preserve explicit child geometry where the demonstrated component needs space. |
| DS cards, controls, rows, tags, tabs, fields, tables / DESIGN SYSTEM | [`controls-lists.css`](../../../src/styles/controls-lists.css), [`controls-fields.css`](../../../src/styles/controls-fields.css), and `reference-workbench.css` own sizes and density. Buttons/fields span 28/32/40/44px, interactive tags are at least 28px, rows use 16px inset, enclosed tabs scroll locally below 640, and table reference densities use 8/12/16px cell padding.      | These values express control size, touch geometry, or data density—not excess page whitespace. Existing table evidence proves local horizontal scrolling instead of page overflow.                                                                   | Do not globally shrink controls, rows, tags, tabs, fields, or tables. Keep table density explicit and keep overflow local to the table/tab owner.                                                                                              |
| Product representative routes / FRONTEND Product                     | [`index.tsx`](../../../src/routes/index.tsx), [`RunnerActivityProgressExperience.tsx`](../../../src/components/progress/RunnerActivityProgressExperience.tsx), and [`settings.tsx`](../../../src/routes/settings.tsx) use 32–40px route vertical padding. [`workout.$date.tsx`](../../../src/routes/workout.$date.tsx) already uses 8px top padding plus a local topbar/hero composition. | Home, Progress, and Settings are appropriate first adopters of a 24px narrow route-canvas inset. Workout Detail is already compact and proves why a global route rewrite would be wrong.                                                             | FRONTEND adopts the DS decision route by route. Preserve state-specific and Workout geometry until direct visual evidence justifies a local change.                                                                                            |
| Locale truth / cross-owner input                                     | [The completed locale discovery](./2026-08-13-hito-ui-locale-and-brazilian-portuguese-contract-discovery.md) establishes `en`/`pt-BR`, typed catalogs, server resolution, and owner-separated consumers.                                                                                                                                                                                  | Translated text may be materially longer; fixed one-line assumptions are unsafe. Locale is not a reason to reduce type size.                                                                                                                         | Validate real `pt-BR` plus expansion/pseudo-localization. Wrap or reflow; do not solve overflow with smaller type, clipped copy, or route-local abbreviations.                                                                                 |

## Representative Rendered-Surface Inventory

These are existing artifacts, not newly generated evidence. They show the reported visual condition
and established containment behaviors, while the source inventory above identifies the current
owners that a later implementation must refresh.

| Surface and theme                                        | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Observation relevant to this decision                                                                                                                  |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Product App Shell, 375×812 Dark                          | [`app-dark-375x812.png`](../../../qa-artifacts/screenshots/2026-08-13/hito-logo-wordmark-symbol-and-favicon-update/app-dark-375x812.png)                                                                                                                                                                                                                                                                                                                                                                                        | The 16px route edge and sticky bottom navigation are coherent; repeated vertical route rhythm is the higher-value compaction target.                   |
| Product App Shell, 375×812 Light                         | [`app-light-375x812.png`](../../../qa-artifacts/screenshots/2026-08-13/hito-logo-wordmark-symbol-and-favicon-update/app-light-375x812.png)                                                                                                                                                                                                                                                                                                                                                                                      | Light theme preserves the same geometry; no theme-specific density token is justified.                                                                 |
| Product App Shell, desktop Dark/Light                    | [`dark`](../../../qa-artifacts/screenshots/2026-08-13/hito-logo-wordmark-symbol-and-favicon-update/app-dark-desktop.png) / [`light`](../../../qa-artifacts/screenshots/2026-08-13/hito-logo-wordmark-symbol-and-favicon-update/app-light-desktop.png)                                                                                                                                                                                                                                                                           | Desktop hierarchy and whitespace are not the reported problem and remain the baseline.                                                                 |
| Product typography adopters, 375×812 Light/Dark          | [`Today Light`](../../../qa-artifacts/screenshots/2026-08-12/typography-slice-3-product/mobile-375x812-light-today-calendar.png) / [`Today Dark`](../../../qa-artifacts/screenshots/2026-08-12/typography-slice-3-product/mobile-375x812-dark-today-calendar.png) / [`Settings Light`](../../../qa-artifacts/screenshots/2026-08-12/typography-slice-3-product/mobile-375x812-light-settings.png) / [`Settings Dark`](../../../qa-artifacts/screenshots/2026-08-12/typography-slice-3-product/mobile-375x812-dark-settings.png) | Accepted title/body hierarchy stays readable at 375. The evidence does not support making every text role larger.                                      |
| Contained App Shell reference, 375×812 Dark/Light        | [`dark`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-locale-menu/app-shell-dark-375x812.png) / [`light`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-locale-menu/app-shell-light-375x812.png)                                                                                                                                                                                                                                                                                                                 | Nested shell/reference insets consume height and width quickly; reference wrapper/stage compaction must not mutate the real AppShell control contract. |
| `/hitoDS` table, 375×812 Dark/Light                      | [`dark`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/375x812-dark-table.png) / [`light`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/375x812-light-tables.png)                                                                                                                                                                                                                                        | Large blank reference/stage separation is visible. Table cells remain readable and the table owns its horizontal overflow.                             |
| `/hitoDS` table local scroll, 375×812 Dark/Light         | [`dark`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/375x812-dark-table-local-scroll.png) / [`light`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/375x812-light-table-local-scroll.png)                                                                                                                                                                                                               | Preserve the local scroller; never compress columns or technical text to remove it.                                                                    |
| `/hitoDS` metadata, 375×812 Light and desktop Dark/Light | [`375 Light`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/375x812-light-metadata-tags-variants.png) / [`desktop Dark`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/1470x801-dark-app-shell.png) / [`desktop Light`](../../../qa-artifacts/screenshots/2026-08-13/hito-ds-reference-contract-and-table-density-independent-qa/1470x801-light-app-shell.png)                                            | Metadata wrapping and desktop reference hierarchy work; the opportunity is surrounding composition, not smaller labels/tags.                           |

## External Guidance And Hito Interpretation

- [WCAG 2.2 Reflow 1.4.10](https://www.w3.org/WAI/WCAG22/Understanding/reflow) requires
  non-excepted horizontal-language content to reflow at the equivalent of 320 CSS px without
  two-dimensional page scrolling. It explicitly supports keeping necessary two-dimensional content,
  such as a data table, in a local scrolling region. Hito therefore treats 320 as a robustness
  acceptance width and 375×812 as the primary mobile design viewport; neither is a new breakpoint.
- [WCAG 2.2 Resize Text 1.4.4](https://www.w3.org/WAI/WCAG22/Understanding/resize-text)
  requires text to reach 200% without loss of content or functionality. Hito must wrap and reflow
  text containers; mobile media queries must not cancel zoom by reducing semantic type roles.
- [WCAG 2.2 Target Size (Minimum) 2.5.8](https://www.w3.org/WAI/WCAG22/Understanding/target-size-minimum)
  sets the Level AA minimum at 24×24 CSS px, with defined exceptions. Hito's existing 28–44px
  control range can satisfy this contract when spacing and equivalent targets are truthful.
- [Apple accessibility guidance](https://developer.apple.com/design/human-interface-guidelines/accessibility)
  uses 44×44pt as the iOS/iPadOS default target and also emphasizes separation between controls.
  Hito adopts 44px as an ergonomic goal for primary standalone touch actions—not as a mandate to
  turn every compact secondary control into `lg`.
- [GOV.UK responsive spacing](https://design-system.service.gov.uk/styles/spacing/) keeps small
  spacing units stable and compacts only larger units below its existing 640px breakpoint. This
  supports Hito's choice to keep component internals stable and step down large composition gaps
  with the existing scale.
- [GOV.UK's maintained type scale](https://design-system.service.gov.uk/styles/type-scale/) shows
  that typography behavior must be role-specific: body roles can remain stable while large titles
  use responsive values. Hito does not copy its sizes; Hito retains its accepted semantic roles and
  current clamp floors.
- [USWDS spacing guidance](https://designsystem.digital.gov/design-tokens/spacing-units/) routes
  spacing through a bounded token vocabulary rather than arbitrary local values. This supports
  replacing demonstrated raw Hito layout values with existing `--space-*` primitives, without
  importing another system's API.
- [Microsoft localization guidance](https://learn.microsoft.com/en-us/globalization/localization/localization-overview)
  warns that translated strings can be considerably longer and create layout problems, while
  [pseudolocalization guidance](https://learn.microsoft.com/en-us/globalization/methodology/pseudolocalization)
  recommends padded strings and delimiters to expose clipping. Hito therefore tests actual `pt-BR`
  and an expanded pseudo case rather than assuming a fixed universal percentage.

External sources provide constraints and principles. Every value below is a Hito design decision
derived from current Hito owners and primitives, not copied from another design system.

## Responsive Density Contract

### Breakpoint contract

- Use the existing narrow density range: base/mobile styles below 640px and existing
  `min-width: 640px` enhancements. Prefer mobile-first declarations plus the existing enhancement
  query; otherwise use `max-width: 639px`, not `max-width: 640px`.
- Keep 768px and 1024px for existing composition changes such as two-column cards, sidebars, and
  playground controls. They are not additional density scales.
- Test 375×812 in Light and Dark as the primary mobile view and 320 CSS px as the reflow boundary.
  Do not add 320-, 375-, 390-, or device-specific CSS branches.

### Token-based density matrix

| Relationship                                      | Current desktop / wide baseline                                                    | Recommended narrow value (<640px)                          | Rationale and exclusions                                                                                                                                                                        | Canonical implementation owner                        |
| ------------------------------------------------- | ---------------------------------------------------------------------------------- | ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------- |
| Foundation space scale                            | `--space-1…10` = 4…40px                                                            | Unchanged                                                  | The scale already expresses all target values.                                                                                                                                                  | DESIGN SYSTEM / `foundations.css` (no write expected) |
| Product route horizontal inset                    | 24px from 640; 40px at large composition                                           | `--space-4` = 16px, unchanged                              | Already produces a 343px route width at 375 and 288px at 320.                                                                                                                                   | DESIGN SYSTEM / `.hito-route-gutter`                  |
| AppShell topbar horizontal inset and major gap    | 40px inset at large; current 24px mobile                                           | `--space-4` = 16px                                         | Aligns shell chrome with route edge. Preserve 56px header, right action gap, buttons, focus ring, and logo.                                                                                     | FRONTEND Product / `AppShell.tsx`                     |
| AppShell bottom navigation                        | 60px + safe area; 12px/4px row inset                                               | Unchanged                                                  | Functional navigation and touch geometry, not decorative whitespace.                                                                                                                            | DESIGN SYSTEM contract consumed by FRONTEND           |
| Generic route top/bottom canvas inset             | Common current 32–40px                                                             | `--space-6` = 24px; preserve 40px desktop                  | Increases first-screen content without changing internal components. Apply only to generic route canvases; preserve intentionally centered empty/error states and Workout-specific composition. | FRONTEND Product consumers                            |
| Route stack between major route sections          | Current 52px desktop; current mobile override 36px                                 | `--space-8` = 32px; preserve desktop 52px initially        | One bounded mobile step. If later tokenizing the preserved desktop value, express it from existing primitives; do not alter desktop in this slice.                                              | DESIGN SYSTEM / `layout-typography.css`               |
| Page header to following content                  | Current 40px desktop; current mobile override 32px                                 | `--space-6` = 24px                                         | Maintains hierarchy while avoiding a full mobile token step of empty space. `.hito-route-stack > .hito-page-header` remains zero because the parent gap owns it.                                | DESIGN SYSTEM / `layout-typography.css`               |
| Stacked narrow section header items               | Current raw 5.6px in Calendar owner                                                | `--space-1` = 4px                                          | Tokenizes and slightly reduces only the narrow stacked label/copy gap. Preserve flex reflow.                                                                                                    | DESIGN SYSTEM / `layout-typography.css`               |
| `/hitoDS` page wrapper                            | 40px horizontal/vertical desktop; current 24px horizontal and 32px vertical mobile | `--space-4` = 16px horizontal; `--space-6` = 24px vertical | Aligns with Product route inset and reclaims 16px content width.                                                                                                                                | DESIGN SYSTEM / `reference-page.tsx`                  |
| `/hitoDS` H1 pre-padding                          | Current extra 32px after wrapper padding                                           | 0; wrapper owns top inset                                  | Deletes a stacked duplicate. Restore current 32px only at the existing large reference breakpoint if desktop hierarchy still needs it.                                                          | DESIGN SYSTEM / reference page + overview             |
| Overview hero to showroom                         | Current 40px page-header margin + 40px local top padding                           | 24px page-header margin + 0 local duplicate                | One owner for separation. Preserve current desktop composition.                                                                                                                                 | DESIGN SYSTEM / overview reference                    |
| Overview showroom group gap                       | Current 48px                                                                       | `--space-8` = 32px                                         | Major document rhythm remains larger than card internals.                                                                                                                                       | DESIGN SYSTEM / overview reference                    |
| Generic DS section separator                      | Current 48px margin + 32px padding (80px total)                                    | `--space-8` + `--space-5` = 32px + 20px (52px total)       | Preserves divider hierarchy while removing 28px of repeated empty space. Internal component references can opt out only with source-backed geometry.                                            | DESIGN SYSTEM / `.ds-section`                         |
| Playground header to tabs                         | Current 48px                                                                       | `--space-4` = 16px                                         | The tab is part of the same specimen. Preserve the current concurrent desktop value from 640px upward until Product decides otherwise.                                                          | DESIGN SYSTEM / `reference-workbench.css`             |
| Playground internal and stacked stage/control gap | Current about 22px and 20px; 24px in the desktop two-column shell                  | `--space-4` = 16px                                         | Uses one existing compact relationship on narrow screens; desktop two-column gap remains 24px.                                                                                                  | DESIGN SYSTEM / `reference-workbench.css`             |
| Generic playground demo stage                     | Current min 320px; at least 28px padding                                           | Content-driven `min-height: 0`; `--space-4` = 16px padding | Removes empty generic canvas height. A preview whose meaning requires spatial geometry retains that geometry in its existing child owner; no stage-size API.                                    | DESIGN SYSTEM / `reference-workbench.css`             |
| Showcase/reference card inset                     | Current `--space-4` = 16px                                                         | Unchanged                                                  | Already matches the narrow surface contract.                                                                                                                                                    | DESIGN SYSTEM                                         |
| List row inset/gap                                | Current 16px/16px                                                                  | Unchanged                                                  | Row height and interactive containment are functional. Reflow metadata/actions rather than compressing hit areas.                                                                               | DESIGN SYSTEM                                         |
| Buttons and fields                                | 28/32/40/44px size families                                                        | Unchanged                                                  | Use 44px `lg` for primary standalone mobile actions when appropriate; compact secondary controls remain valid when they meet 24px and spacing/equivalent-target rules.                          | DESIGN SYSTEM; consumer chooses existing size         |
| Metadata tags/chips                               | 8px horizontal/4px vertical; interactive min 28px                                  | Unchanged                                                  | Wrap long labels and preserve target/focus behavior.                                                                                                                                            | DESIGN SYSTEM                                         |
| Tables                                            | Explicit 8/12/16px density, local horizontal scroller                              | Unchanged                                                  | Density is a user/fixture choice; horizontal table scrolling is a valid local exception. Never shrink typography to force all columns into 320px.                                               | DESIGN SYSTEM + owning consumer                       |

## Responsive Typography Contract

No existing role becomes larger **because the viewport is mobile**. No existing role is reduced to
create room. The completed Hito typography consolidation remains canonical.

| Role group                  | Narrow behavior                                                                                   | Wrapping and line-height decision                                                                                                  | Localization/data constraint                                                                                                      |
| --------------------------- | ------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `ui-title-xl/lg/md/sm/xs`   | Retain current role and `clamp()` floor where present. Do not add a mobile-only size.             | Preserve line height and balanced wrapping; container becomes wider through compact outer inset. Avoid fixed title height.         | Full pt-BR title may wrap. Never truncate a page/section title or swap to a smaller role only in Portuguese.                      |
| `display-title-xl/lg`       | Retain current responsive range; reserve for current expressive/brand contexts.                   | Allow balanced multi-line composition. Do not use a Display role to make ordinary mobile UI more prominent.                        | Validate diacritics and real display-font glyph coverage; fall back through the existing family contract, not a route-local font. |
| `body-lg`                   | Retain 18px. Use only for genuinely leading/supporting prose across all viewports.                | Preserve 1.55 line height and readable measure.                                                                                    | Longer prose reflows vertically; it is not placed inside fixed-height cards.                                                      |
| `body-md`                   | Retain 14px as default Product/DS copy.                                                           | Preserve 1.58 line height and `text-wrap: pretty`; do not tighten to reclaim vertical space.                                       | Primary pt-BR paragraphs wrap; no one-line constraint.                                                                            |
| `body-sm/xs`                | Retain 13/12px for secondary/helper content. Do not demote default copy to these roles on mobile. | Preserve current line heights. `body-xs` remains short support, not a substitute for dense paragraphs.                             | If a translated helper becomes multi-sentence, correct its semantic role or copy rather than clipping it.                         |
| `label-md/sm`               | Retain 12/11px for short labels and control metadata.                                             | Allow wrapping where the component contract permits. Do not force localized labels to uppercase or letter-spaced all caps.         | A long localized action label must grow/wrap/reflow its cluster; it must not be shortened locally without Product copy approval.  |
| `technical-sm`              | Retain 12px tabular/mono role.                                                                    | Numeric and identifier containers use `min-width: 0`, local overflow/wrapping, or disclosed truncation according to the component. | Domain values, IDs, and units remain canonical; surrounding human-readable labels localize. Tables keep local horizontal scroll.  |
| Component-bound Metric      | Retain the existing component role and responsive composition.                                    | Metrics may wrap to another row; do not shrink values independently.                                                               | Localize labels/units through their owner while preserving numeric truth.                                                         |
| Controls, tabs, table cells | Keep their canonical semantic type and size.                                                      | Reflow action groups, use existing local tab/table scrolling, and preserve focus indicators.                                       | Test the longest real pt-BR labels. A proven shared overflow returns to DESIGN SYSTEM; no route-local font reduction.             |

### pt-BR and expansion acceptance

- Test actual `pt-BR` catalogs once the owning locale slice exists, plus a pseudo-expanded catalog
  that pads every translatable string and adds visible start/end delimiters. Do not encode a
  supposedly universal English-to-Portuguese expansion percentage into CSS or acceptance.
- At 320 and 375px, headings, buttons, tabs, tags, state messages, date labels, field labels, and
  error/help copy must remain available without clipping. Natural-language text wraps; fixed
  technical values use their component's explicit overflow/disclosure contract.
- Action clusters may wrap from a row to multiple rows. DOM order, keyboard order, and accessible
  names remain unchanged.
- No fixed-height text container may be introduced. `text-overflow: ellipsis` is allowed only when
  the full value is available through the existing focus/activation/disclosure contract.
- Portuguese accents and punctuation must render in the canonical font stacks. A missing glyph is a
  typography/font support defect, not a spacing reason.

## Accessibility And Interaction Guardrails

1. **Containment:** At 320 and 375 CSS px, non-excepted content has no page-level horizontal
   scrolling. Tables and other meaningfully two-dimensional content may scroll only within their
   own labelled container.
2. **Zoom:** At 200% text resize and at the 320 CSS px reflow equivalent, no text, control, focus
   ring, menu, sheet, sticky header, or bottom navigation is clipped or obscured.
3. **Targets:** Every interactive target is at least 24×24 CSS px or satisfies a documented WCAG
   exception. Prefer the existing 44px `lg` size for primary standalone touch actions. Do not
   reduce hit areas when reducing visual whitespace.
4. **Focus:** Existing `:focus-visible` rings and offsets remain visible after reflow, including
   inside locally scrolling tabs/tables and near sticky edges.
5. **Semantics:** Density changes do not remove labels, status text, dividers needed for grouping,
   or non-colour indicators. No information becomes colour-only.
6. **Motion:** Padding/gap changes occur at responsive layout boundaries without animated layout
   transitions. Existing `prefers-reduced-motion` behavior remains unchanged; do not add movement
   to explain compaction.
7. **Sticky chrome:** The 56px AppShell header and 60px + safe-area bottom nav remain stable. Verify
   the remaining content viewport rather than shrinking navigation.

## Owner-Separated Migration Plan

### Slice 1 — DESIGN SYSTEM: restore shared responsive ownership

**Seams:** `layout-typography.css` and `calendar-state-surfaces.css`.

- Move the reachable generic narrow rules for `.hito-route-stack`, `.hito-page-header`, and
  `.hito-section-header` into the shared layout owner.
- Use the existing `<640px` contract without an overlapping `max-width: 640px` edge.
- Set route stack to `--space-8`, page-header margin to `--space-6`, and stacked section-header gap
  to `--space-1`.
- Delete the superseded generic rules from Calendar. Leave `.hito-nav-card*` rules and all
  Calendar-specific behavior in the Calendar owner.
- Add no token, selector family, component API, file, or compatibility path.

**Proof:** source reachability scan; `npm run validate-hito-ds-components`; changed-path lint; local
browser at desktop and 375/320 Light/Dark on Home, Settings, and `/hitoDS`; 200% resize and local
table-scroll check. Stop if a non-Calendar route depended on the exact 640 overlap or if moving the
rules changes desktop.

**Rollback:** restore the three declarations to their prior owner and values as one bounded slice;
no API or token rollback is required.

### Slice 2 — DESIGN SYSTEM: compact `/hitoDS` reference composition

**Seams:** `reference-page.tsx`, `reference-overview-page.tsx`, `playground.tsx` only if markup is
actually needed, `reference-workbench.css`, and the existing `.ds-section` owner.

- Apply the matrix values to the workbench wrapper, duplicate page/Overview top spacing, Overview
  group gap, generic DS section separation, playground tabs/gaps, and generic demo stage.
- Preserve the currently dirty desktop playground-tab value from 640px upward. Refresh the source
  snapshot before writing; never overwrite concurrent header/hierarchy work.
- Delete duplicate narrow `pt-8`/`pt-10` responsibility rather than layering a new utility or
  wrapper.
- Preserve showcase-card inset, all control sizes, tables, local scrollers, focus rings, component
  states, and explicit child preview geometry.
- Add no mobile stage prop, density registry, global card contract, or new breakpoint.

**Proof:** `npm run validate-hito-ds-components`; changed-path lint; `/hitoDS` Overview, Components
Button/Field/Tabs/Table, Patterns App Shell, Light/Dark at desktop, 375×812, and 320px; both Demo and
Variants; keyboard focus; 200% resize; actual/pseudo-expanded strings when available. Record the H1,
first showroom group, section divider, tabs, stage, and controls as visual landmarks. Page-level
overflow is zero; table overflow remains local.

**Stop conditions:** an overlay/dropdown preview clips because it genuinely requires stage geometry;
a component's focus or target box changes; a mobile exception recurs across multiple component
families and cannot be expressed by an existing owner; or a new token/API appears necessary. Keep
that preview's existing child geometry or return the demonstrated shared gap to PRODUCT—do not
restore the global 320px minimum for every specimen.

**Rollback:** revert only narrow workbench/media declarations and duplicate-spacing deletions.
Desktop and component APIs remain unchanged.

### Slice 3 — FRONTEND Product: align shell and representative route canvases

**Seams:** `AppShell.tsx`, Home, Progress experience plus matching pending state, and Settings.

- Set mobile AppShell topbar inset/major gap to `--space-4`; preserve the current large inset/gap,
  56px height, actions, and bottom navigation.
- Set generic active-route vertical canvas inset to `--space-6`, restoring current 40px at the
  existing large breakpoint. Keep the already-correct route horizontal gutter.
- For the Home pending state, align its major `space-y-12` mobile rhythm to `--space-8` while
  preserving desktop. Keep loading geometry paired with the loaded route.
- Do not change Workout Detail's compact top/hero composition, intentionally centered error/empty
  states, component internals, or control sizes without direct evidence.
- Continue consumer adoption route by route only after Home/Progress/Settings pass. Integrations,
  login/auth, onboarding, Manual Workout, Admin, and Marketing remain separate owner/lane audits.

**Proof:** changed-path lint and relevant source validators; 375×812 and 320px Light/Dark for loaded,
loading, empty/error where touched; keyboard; 200% resize; long dates and actual/pseudo-expanded
pt-BR; no content under sticky chrome; no page-level horizontal overflow.

**Stop conditions:** a route requires a new shared composition primitive, locale copy/product policy,
or another Frontend lane. Return the exact seam to PRODUCT. Do not add a route-local DS substitute.

**Rollback:** revert each route's responsive utility change independently. Shared DS ownership and
other routes remain intact.

### Slice 4 — PRODUCT routing and independent acceptance

- PRODUCT reviews Slice 1–3 evidence, then routes remaining Product/Admin/Marketing consumers by
  their canonical owner and lane. It does not bundle them into a universal migration.
- QA receives a later explicit cross-surface acceptance inventory only after the implementation
  owners complete their focused proof. Global QA and release remain separate.
- DESIGN SYSTEM INTEGRATION/Figma is not required for this behavior-first CSS adoption. If Product
  later approves a Figma density representation, it is a separate downstream mapping after code is
  canonical.

## Acceptance Matrix For Later Implementation

| Check                | Scenario / environment                          | Required result                                                                                                                                       |
| -------------------- | ----------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership     | Shared layout and Calendar CSS                  | Generic responsive layout rules exist once in `layout-typography.css`; Calendar retains only Calendar facts.                                          |
| Token adherence      | Changed responsive declarations                 | Every proposed spacing value resolves through existing `--space-*`; no mobile token aliases or raw multiplier.                                        |
| Desktop preservation | Current desktop widths, Light/Dark              | Header, route hierarchy, DS stage, two-column playground, cards, controls, and typography remain visually equivalent except separately approved work. |
| Primary mobile       | 375×812, Light/Dark                             | 16px canvas edges, compact large composition gaps, stable typography, no clipped content or page-level horizontal overflow.                           |
| Reflow boundary      | 320 CSS px, Light/Dark                          | Non-excepted content reflows in one dimension; sticky chrome and focus remain operable.                                                               |
| Zoom/text resize     | 200% and 320px-equivalent reflow                | No loss of content/functionality; breakpoint changes do not cancel text enlargement.                                                                  |
| DS playground        | Demo/Variants, representative controls/overlays | Generic stage is content-driven; explicit spatial previews remain usable; controls follow below the stage on narrow screens.                          |
| Tables/tabs          | Long columns and long labels                    | Overflow remains inside the owning scroller; table typography and density do not shrink.                                                              |
| Targets/focus        | Touch + keyboard                                | 24px WCAG minimum/exception is truthful, primary standalone action uses the appropriate existing size, and all focus rings remain visible.            |
| Localization         | Real `pt-BR` + padded pseudo locale             | Copy wraps/reflows; delimiters reveal no clipping; no mobile-only type demotion or unauthorized abbreviation.                                         |
| Motion               | Reduced motion and breakpoint resize            | No new animated layout shift; existing reduced-motion behavior is preserved.                                                                          |

## Alternatives Rejected

- **Global `0.75`/`0.8` mobile spacing multiplier:** loses semantic hierarchy, changes hit geometry,
  and cannot distinguish page whitespace from component containment.
- **A second `--space-mobile-*` scale:** duplicates values already present in Foundations and creates
  two sources of truth.
- **Making all mobile type larger:** titles already have large mobile floors and body/label roles are
  semantic. It would reduce first-screen information and increase localization pressure without
  evidence of unreadability.
- **Shrinking all mobile type:** violates the accepted hierarchy and uses type size to hide a layout
  ownership problem.
- **Changing base space tokens globally:** would mutate every desktop and component consumer rather
  than the demonstrated compositions.
- **Shrinking controls, list rows, tags, or table cells:** confuses interactive/data density with
  decorative whitespace and risks target/readability regressions.
- **A universal card/stage density API:** no repeated runtime need is demonstrated. Existing
  reference selectors and consumer geometry are sufficient.
- **A device-specific 375px breakpoint:** 375 is a test viewport, not a semantic layout boundary.

## Documentation Validation

| Check                           | Result                        | Evidence / consequence                                                                                                                                                  |
| ------------------------------- | ----------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Scoped Prettier write and check | Passed                        | The canonical item formats cleanly with the repository Prettier configuration.                                                                                          |
| Internal Markdown targets       | Passed                        | Every relative source, decision, and QA-artifact link in this item resolves to an existing local path.                                                                  |
| External guidance links         | Passed                        | All nine cited W3C, Apple, GOV.UK, USWDS, and Microsoft URLs returned HTTP 200 during this discovery.                                                                   |
| `git diff --check`              | Passed                        | The current tracked worktree has no whitespace errors.                                                                                                                  |
| Untracked-item whitespace check | Passed                        | `git diff --no-index --check /dev/null <canonical item>` produced no whitespace diagnostics; its exit status `1` denotes the expected file difference.                  |
| Runtime preservation            | Passed for this role boundary | No runtime, CSS, token, component, validator, manifest, Figma, fixture, data, or Git-lifecycle write was performed. Existing dirty source remains outside this receipt. |

## Final Planning Receipt

- **User outcome:** A small-screen Hito density contract is ready. It compacts large layout rhythm
  while retaining typography prominence, component geometry, and the existing desktop system.
- **Evidence:** Current source owners, dirty boundaries, completed typography/locale decisions, and
  existing Desktop plus 375×812 Light/Dark artifacts were inventoried. Maintained W3C, Apple,
  GOV.UK, USWDS, and Microsoft guidance was reviewed for principles.
- **Reused seams:** Existing `--space-*`, `<640px` responsive boundary, typography roles,
  `.hito-route-gutter`, shared layout selectors, workbench selectors, Button/Field/List/Tag/Tab/Table
  contracts, and local overflow behavior.
- **Files changed:** This canonical item only.
- **Intentionally unresolved:** No spacing value or type role is left for implementation-time
  invention. The optional desktop playground-tab compaction is outside scope and preserved.
- **Next owner:** PRODUCT for routing. The first implementation execution owner should be DESIGN
  SYSTEM for Slice 1, followed by Slice 2 only after Slice 1 proof. PRODUCT then separately routes
  the FRONTEND Product slice.
- **Boundary:** No implementation, browser acceptance, Figma mutation/parity, Global QA, release,
  deployment, or hosted proof is claimed.

## Deferred Implementation Handoff

PRODUCT may use the following exact first-owner prompt after current-discussion approval. It was
prepared but not dispatched by DESIGNER.

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Mobile Density — Shared Responsive Ownership Slice 1
Mode: Tracked implementation
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-mobile-density-and-responsive-typography-discovery.md

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md before
the first task-owned write. Re-read the complete canonical item and refresh the dirty/source
snapshot because the inspected CSS and AppShell/reference owners contain concurrent work.

Implement only Slice 1 from the accepted Designer specification: move the reachable generic narrow
rules for .hito-route-stack, .hito-page-header, and .hito-section-header from
calendar-state-surfaces.css to their existing shared owner in layout-typography.css; use the
existing <640px boundary; map mobile route stack to --space-8, page-header separation to --space-6,
and stacked section-header gap to --space-1; delete the superseded generic Calendar declarations.
Preserve Calendar-only nav-card behavior and every unrelated dirty hunk byte-for-byte.

Do not change Foundations values, typography roles, runtime components, AppShell, /hitoDS reference
composition, Product routes, control sizes, tables, manifests, validators, DevTools, Figma, data,
hosted state, dependencies, or Git lifecycle. Add no token, selector family, file, framework,
compatibility path, or mobile scale.

Run the focused source/validator checks and managed local browser proof required by Slice 1 at
desktop plus 375x812 and 320px in Light/Dark, including 200% text resize and local table overflow.
If the exact 640px overlap or a non-Calendar dependency prevents the bounded move, stop and return
the discriminator to PRODUCT rather than broadening the task. Update the same canonical item with
an English implementation receipt and return the next owner to PRODUCT; do not dispatch Slice 2.
```

## Frontend Product Slice 3 Execution Preflight — 2026-08-13

- **Assigned outcome:** adopt the accepted narrow composition density only in the authenticated
  Product shell, loaded Home/Calendar, loaded Progress, loaded Settings, and the Home/Progress
  pending compositions that share those route canvases. Preserve typography, controls, targets,
  route semantics, data, and desktop geometry.
- **Accepted decision and source discriminator:** the current `--space-*` scale is sufficient.
  `AppShell.tsx` still uses 24px mobile topbar inset/gap, while the admitted route canvases use
  32–40px vertical padding. `.hito-route-gutter` already owns the correct 16px mobile horizontal
  inset and remains unchanged.
- **Existing seams reused:** the existing AppShell header composition and existing route/pending
  wrappers in `AppShell.tsx`, `routes/index.tsx`, `routes/progress.tsx`,
  `components/progress/RunnerActivityProgressExperience.tsx`, and `routes/settings.tsx`; existing
  `--spacing-hito-*` utility mappings to `--space-4`, `--space-6`, and `--space-8`; and the existing
  `sm`/640px enhancement boundary.
- **Consumer reachability:** shared route utilities also reach Admin, Hito DS, Integrations, Login,
  Workout, and state surfaces outside this assignment. They are read-only here. Home onboarding and
  create-plan branches share the current route wrapper, so the Product edit must preserve their
  current padding explicitly rather than changing their geometry as a side effect. Centered
  Home/Progress errors and Settings preview/missing-profile states remain unchanged.
- **New production runtime artifacts:** none. No token, breakpoint, CSS rule, helper, wrapper,
  component, state, compatibility path, or Product-side preview control is admitted.
- **Removed/simplified responsibility:** replace only the admitted mobile 24px AppShell inset/gap,
  32–40px route vertical padding, and Home pending 48px major rhythm with token-backed 16px, 24px,
  and 32px values; restore each existing value from 640px upward.
- **Dirty/runtime boundary:** the checkout is broadly dirty. Existing AppShell surface-ladder and
  Product text-tone hunks are accepted unrelated work and must remain byte-for-byte. The managed
  `qa_fixture` server is current, healthy, loopback-bound, and has no active competing build owner
  before this slice writes source.
- **Focused proof:** source reachability; Prettier, focused ESLint, Product validators, build and
  task diff hygiene; then loaded Home, Progress, and Settings plus matching pending/source states at
  desktop, 375×812, and 320px in Dark/Light for computed spacing, sticky chrome, bottom navigation,
  keyboard focus, long/expanded text reflow, 200% text resize, overflow, and console health.
- **Design System dependency discriminator:** the current App Shell reference still separates the
  desktop Demo and narrow Variants presentation and exposes only Profile meta / Notice surface
  controls. It does not yet provide the required right-side Desktop/Mobile preview control. This is
  an exact separate DESIGN SYSTEM dependency for Product routing; this Frontend slice will not add
  a shadow Product control or edit `/hitoDS`.
- **Stop/return boundary:** return to Product if any admitted route needs a shared primitive or CSS
  change, locale/copy decision, another Frontend lane, persistence change, or Design System source
  mutation.

## Frontend Product Slice 3 Tracked Implementation Receipt — 2026-08-13

### Lifecycle Result

- **Product slice status:** source implementation complete; required browser acceptance blocked by
  checkout-wide runtime integrity outside the assigned Frontend Product owner.
- **Stage:** admitted Product consumer adoption and focused evidence.
- **Product outcome:** the authenticated Product topbar now uses the existing `--space-4` contract
  for its mobile inline inset and major gap. Loaded Home/Calendar, Progress, and Settings canvases
  use the existing `--space-6` mobile vertical inset, and the matching Home/Progress pending
  canvases use the same inset. Home pending uses the existing `--space-8` mobile major rhythm.
  Existing values resume at the established 640px enhancement boundary, with the existing large
  desktop route values preserved.
- **Root cause / accepted decision:** admitted Product owners composed 24px topbar inset/gap and
  32–40px route vertical padding at mobile widths even though the existing spacing registry already
  exposes the accepted 16px, 24px, and 32px contracts. The first incorrect owners were the existing
  AppShell header and route-local canvas wrappers, not Foundations or shared component geometry.

### Existing Seams Reused And Files Changed

- `src/components/AppShell.tsx` — reused the existing header composition; `gap-hito-4` and
  `px-hito-4` apply below 640px, while the existing `gap-6`, `px-6`, and `lg:px-10` values remain
  responsive enhancements. The 56px header, fixed/sticky shell behavior, logo, actions, sidebar,
  and mobile navigation were not changed. Accepted pre-existing shell-surface hunks were preserved.
- `src/routes/index.tsx` — reused the loaded Home route wrapper and pending wrapper. Calendar gets
  `py-hito-6` below 640px, Home pending gets `py-hito-6` plus `space-y-hito-8`, and existing desktop
  values resume from `sm`. The onboarding and explicit create-plan branches retain their existing
  `py-8 lg:py-10` composition and behavior.
- `src/routes/progress.tsx` — reused the existing pending wrapper and added only
  `py-hito-6 sm:py-10`.
- `src/components/progress/RunnerActivityProgressExperience.tsx` — reused the loaded Progress
  canvas and added only `py-hito-6 sm:py-10`.
- `src/routes/settings.tsx` — reused the loaded Settings canvas and added only
  `py-hito-6 sm:py-10`.
- This canonical item — preflight and this Product-slice receipt only.
- **New production runtime artifacts:** none. No CSS, token, breakpoint, component, wrapper, helper,
  state, compatibility path, or Product-side reference control was added.
- **Intentionally unchanged:** typography roles, control and target geometry, horizontal route
  gutters, centered error/empty states, Settings preview/missing-profile states, Workout Detail,
  onboarding internals, Manual Workout, Login/Auth, Admin, Marketing, data, persistence, and all
  unrelated dirty work.

### Validation Inventory

| Check                  | Scenario / environment                                                                                       | Result                    | Evidence                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source reachability    | AppShell plus Home, Progress, Settings loaded/pending owners                                                 | Passed                    | Only the five admitted Product source files changed. Onboarding/create-plan and centered error/empty branches retain their previous classes. No shared route utility or DS source changed.                                                                                                                                                                                                                                                                                    |
| Token adherence        | Changed class composition                                                                                    | Passed                    | `gap-hito-4`/`px-hito-4`, `py-hito-6`, and `space-y-hito-8` resolve through the existing spacing registry to `--space-4`, `--space-6`, and `--space-8`. No literal value or new token was introduced.                                                                                                                                                                                                                                                                         |
| Formatting             | Prettier on five source files and this canonical item                                                        | Passed                    | Repository Prettier reported all matched files formatted.                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Focused lint           | ESLint on five Product source files                                                                          | Passed                    | No ESLint diagnostics.                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Product contracts      | `npm run validate-product-contracts`                                                                         | Passed                    | Heart-rate guidance editor proof and Workout comparison readback contract both passed.                                                                                                                                                                                                                                                                                                                                                                                        |
| Diff hygiene           | Checkout-wide `git diff --check`                                                                             | Passed                    | No whitespace diagnostics at the final source-check point.                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Production compilation | `npm run qa:server:restart` build path                                                                       | Partial pass              | Vite client, SSR, and Nitro production compilation completed. `postbuild` then failed in `validate-build-output-integrity.mjs` because the output lacks private Admin repository snapshot digest `c413d194c64e6eb114eb286057e995636783b5c4ddcf6c0638689bf3e55cc1e4`. No Product compile error was reported.                                                                                                                                                                   |
| Desktop preservation   | Home, 1470×801, Dark, fresh source fallback                                                                  | Passed for sampled source | Header computed to 56px high, 40px inline inset and 24px gap; route canvas computed to 40px vertical and horizontal inset. Document width remained 1470/1470.                                                                                                                                                                                                                                                                                                                 |
| Mobile Home            | Home, 375×812, Dark, fresh source fallback                                                                   | Passed for sampled source | Header computed to 56px high with 16px inline inset and 16px gap. Route canvas computed to 24px vertical and 16px horizontal inset. Bottom navigation remained sticky, 60px high, and flush with viewport bottom. Document width remained 375/375.                                                                                                                                                                                                                            |
| Narrow Home            | Home, 320×812, Dark, fresh source fallback                                                                   | Passed for sampled source | Header retained 56px height and 16px inset/gap; route retained 24px vertical and 16px horizontal inset; bottom navigation retained 60px sticky geometry; document width remained 320/320. The rendered long date was 136.8px wide with no local text overflow.                                                                                                                                                                                                                |
| Narrow Progress        | Progress, 320×812, Dark, fresh source fallback                                                               | Passed for sampled source | Loaded route computed to 24px vertical and 16px horizontal inset; the simple tabs rail remained 288px inside the 320px canvas; document width remained 320/320.                                                                                                                                                                                                                                                                                                               |
| Settings reachability  | Settings, 375×812, Dark, fresh source fallback                                                               | Partial pass              | The loaded Settings surface and its existing tabs/fields rendered at the target viewport before the fallback runtime exposed an unrelated import-protection overlay. The route class and production bundle prove the 24px/40px responsive composition, but clean end-state computed/console evidence is unavailable.                                                                                                                                                          |
| Keyboard/focus         | Home mobile navigation, 375×812, Dark                                                                        | Passed for sampled source | Keyboard focus reached the existing Calendar link and retained the canonical inset focus treatment. No navigation or target geometry was changed by this slice.                                                                                                                                                                                                                                                                                                               |
| Managed runtime        | `qa_fixture`, `127.0.0.1:3000`                                                                               | Blocked outside Product   | The pre-existing managed runtime became correctly unavailable after the required stale rebuild. A single non-managed dev fallback was attempted only after confirming port 3000 was free; it was stopped when Vite exposed an existing client import-protection failure through `runner-calendar-context.ts` importing `@tanstack/react-start/server-only`. No overlay suppression or source workaround was applied. Final managed status is stopped with `artifact_missing`. |
| Full browser matrix    | Home, Progress, Settings; desktop/375/320; Light/Dark; loaded/pending/empty/error; 200% text resize; console | Not completed             | Clean Light, 200% resize, full pending/empty/error replay, final Settings metrics, and console-health acceptance require a fresh healthy managed artifact. The sampled Dark receipts above do not substitute for that matrix.                                                                                                                                                                                                                                                 |
| Localization stress    | Real or pseudo-expanded `pt-BR`                                                                              | Not run                   | The admitted authenticated Product surfaces do not currently expose a route-owned pt-BR/pseudo-locale switch in this checkout. Fabricating browser text or adding a Product locale path would cross the explicit locale/product-decision stop boundary.                                                                                                                                                                                                                       |

### Separate Design System Dependency

The required responsive reference contract is still absent. The current App Shell playground in
`src/components/hito-ds/reference-components-structure.tsx` keeps desktop in Demo and narrow in
Variants, while its right-side controls expose only `Profile meta` and `Notice surface`. It has no
Desktop/Mobile preview control. That exact addition, plus any remaining shared narrow composition
ownership, belongs to a separate DESIGN SYSTEM slice. This Product implementation did not create a
shadow control or edit `/hitoDS`.

### Return Boundary

- **Next owner:** PRODUCT, to route the demonstrated Admin/build-integrity runtime blocker to its
  canonical owner and the missing App Shell Desktop/Mobile reference control to DESIGN SYSTEM.
- **Blockers:** clean managed browser acceptance cannot resume until the private Admin repository
  snapshot integrity contract produces a fresh artifact. Actual/pseudo-expanded pt-BR proof also
  requires an accepted reachable locale consumer or separate Product decision.
- **Acceptance statement:** the admitted Product source slice and focused static checks are
  complete. Browser evidence is partial and this receipt does not claim full Implementation DoD,
  Global QA, release readiness, hosted proof, or deployment readiness.
- **Execution record:** FRONTEND Product read `agents/frontend.agent.md` and used
  `skills/hito-frontend-design-system/SKILL.md` plus
  `skills/hito-qa-browser-regression/SKILL.md`. No subagent was used because the shared runtime
  blocker prevented an independent clean replay from adding trustworthy evidence.

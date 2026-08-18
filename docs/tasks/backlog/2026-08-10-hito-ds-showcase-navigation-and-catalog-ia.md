# Hito DS Showcase Navigation And Catalog Information Architecture

## Work Item ID

2026-08-10-hito-ds-showcase-navigation-and-catalog-ia

## Status

blocked

## Type

change_request

## Priority

high

## Owner

design_system

## Epic

platform-and-operations

## Scope

shared-design-system

## Archive Intent

retain_in_place

## Task

Reorganize the public `/hitoDS` reference into a coherent, presentation-ready showcase of the
existing Hito Design System. Keep the accepted live `Demo / Variants` workbench and canonical
component owners, but replace the current policy-first Overview, split sidebar interaction, and
buried composition examples with a visual overview, one complete App Shell specimen, an
alphabetical component catalogue, and concise consistent component descriptions.

The accepted 2026-08-11 amendment below reopens the repository IA after the first implementation:
remove the user-facing `Reference` bucket; expose Foundations, Components, Patterns, Brand &
Visuals, and Figma Export as understandable first-class destinations; and rebuild the Foundations
family, spacing, and radius summaries as visual live specimens. The previous implementation
receipt remains historical evidence, not proof that this amendment is implemented.

This task is an information-architecture and reference-surface correction. It is not permission to
create another component library, redesign Hito's visual language, or change Product behavior.

## Stage

Focused independent QA passed every completed repository-owned amendment slice. Canonical
IA/Brand, Components/Patterns, Foundations actual-family/spacing/radius visual grammar, and direct
Figma Export discoverability are complete. The item is blocked only on the separately retained
typography-scale consolidation before final role-gallery/display acceptance and the exact approved
Hito Running Library URL before the external library action can be added.

## Next Recommended Role

product

## Focused Amended Repository QA Receipt — 2026-08-12

- **Validation layer:** focused Definition-of-Done verification for the amended repository-owned
  `/hitoDS` Showcase contract, not Global QA Acceptance.
- **Verdict:** Passed. Independent QA found no issue in the completed IA/Brand,
  Components/Patterns, Foundations actual-family/spacing/radius, or direct Figma Export slices.
- **Lifecycle:** `blocked`, not `completed`. The separately retained typography-scale consolidation
  remains unimplemented, and the exact approved external Hito Running Library URL remains unknown.
- **Runtime boundary:** browser proof completed against the relevant-owner-fresh compiled loopback
  output with no warning/error logs. The runtime was externally stopped afterward, and the
  unrelated private Admin snapshot marker prevents a final whole-workspace managed/fresh receipt.
- **Files changed by QA:** none. QA remained read-only.

| Check | Scenario / environment | Result | Evidence |
| --- | --- | --- | --- |
| Navigation IA | Desktop and mobile | Passed | Exact order is Overview, Foundations, Components, Patterns, Brand & Visuals, Figma Export; no user-facing `Reference`. |
| Interaction | Pointer, Chrome keyboard, search, Escape, mobile Sheet | Passed | Full-row native groups, truthful active/expanded states, group/child/keyword/no-match search, two-stage mobile Escape, focus-visible, and focus restoration passed. |
| Deep links | Current and legacy `/hitoDS` destinations | Passed | Foundations, Brand, Components, Patterns, App Shell, Data Table composition, and Figma Export resolved to one canonical owner; accepted legacy hashes redirected after route settlement. |
| Foundations | 1440x900 and exact 375x812, Light/Dark | Passed | Live Poppins, Fraunces, and JetBrains Mono specimens precede the role gallery; eight spacing and seven radius specimens resolve from canonical variables with equal responsive geometry; color, icon, and Motion truth remains live. |
| Brand ownership | Desktop/narrow, Light/Dark | Passed | Brand owns logo/mark, imagery, atmosphere, gradients, and overlays; the moved presentation no longer renders in Foundations. |
| Components/Patterns | Source and runtime | Passed | Components exposes 27 standalone A-Z destinations and owns Data Table anatomy; Patterns owns the single App Shell renderer and Data Table toolbar/filter composition. |
| Live workbenches | Button and Data Table | Passed | Demo/Variants and representative property, filter, search, and sort interactions remain live. |
| Figma Export | Direct route and capture board | Passed | Direct destination renders the one code-owned downstream capture board; no external or guessed library link exists. |
| Responsive/runtime | All affected routes, both themes/viewports | Passed | No page overflow, hydration, network, missing-anchor, console warning, or console error was observed. |
| DS/static | Validator, targeted ESLint, Prettier, scoped diff check | Passed | DS contract passed across 324 files with 43 primitive colors, 41 semantic colors, and 18 current Text Styles; focused source remained clean. |
| Whole-workspace managed freshness | Shared runtime | Coverage gap | An unrelated private Admin snapshot-marker failure prevents final managed/integrity finalization; no whole-workspace freshness claim is made. |

- **Remaining dependency 1:** complete
  `docs/tasks/backlog/2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md` before
  accepting the final display-role/gallery taxonomy criterion. Do not create an intermediate
  Showcase-only taxonomy.
- **Remaining dependency 2:** Product or DESIGN SYSTEM INTEGRATION must provide the factual exact
  approved standalone Hito Running Library URL. Do not infer it from legacy Figma targets.
- **Acceptance boundary:** completed repository-owned Showcase slices pass focused DoD. Hosted
  state, Figma parity, release readiness, deployment, and Global QA are not claimed.
- **QA role/skill:** `agents/qa.agent.md` and
  `skills/hito-qa-browser-regression/SKILL.md`; no subagents were used.

## Slice 6 Figma Export Repository Discoverability No-op Receipt — 2026-08-12

- **Mode and owner:** Tracked Design System source/proof slice owned by `design_system`.
- **Outcome:** no runtime source change was required. The completed IA slice already exposes Figma
  Export as the sixth direct first-class destination immediately after Brand & Visuals and routes
  to the existing code-owned capture board.
- **Source discriminator:** `HITO_DS_NAV_ITEMS` contains the exact six-item order and models Overview
  and Figma Export as direct `link` entries while Foundations, Components, Patterns, and Brand &
  Visuals remain groups. The Figma entry owns `/hitoDS/export/figma` and the existing
  `capture`/`downstream` search keywords.
- **Single capture-board owner:** `src/routes/hitoDS_.export.figma.tsx` imports and renders
  `HitoFigmaExportBoard` from `figma-export-board.tsx`; repository reachability found no second
  route or board renderer. The existing board labels itself `Hito DS export` and
  `html.to.design capture board`, describes `Code-owned Hito DS matrices`, and consumes the
  generated one-way manifest.
- **External boundary:** the model, route, and capture-board source contain no external URL,
  `Hito Running Library` action, or legacy-target inference. The exact approved library URL remains
  unknown; no Figma target was accessed or mutated.
- **Files changed for this slice:** this canonical lifecycle receipt only. Runtime source, routes,
  CSS, tokens, validators, and dependencies were unchanged.
- **Reuse budget:** new runtime artifacts `none`; no label correction, registry, wrapper,
  primitive, token, CSS, route, dependency, or compatibility path was needed. Focused screenshots
  are under
  `qa-artifacts/screenshots/2026-08-12/hito-ds-figma-export-discoverability/`.
- **Preserved boundaries:** Foundations/typography, Brand, Components/Patterns, Product,
  DevTools/Inspector, Backend/auth/persistence, shared primitives/tokens/CSS, Figma, hosted state,
  data, providers, and Git lifecycle were unchanged.

| Check                   | Scenario / environment                             | Result                | Evidence                                                                                                                                                                                                                      |
| ----------------------- | -------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Model order/type        | Canonical source and desktop rendered navigation   | Passed                | Exact order was Overview, Foundations, Components, Patterns, Brand & Visuals, Figma Export; item kinds were link/group/group/group/group/link and the final direct href was `/hitoDS/export/figma`.                           |
| Shared mobile model     | Exact 375x812 mobile Sheet, Light and Dark         | Passed                | The Sheet rendered the same six labels, kinds, order, and direct Figma href with document client/scroll/inner widths all 375.                                                                                                 |
| Search/Escape           | Desktop `downstream`; mobile `capture`             | Passed                | Each query exposed only Figma Export; desktop Escape cleared search and restored searchbox focus.                                                                                                                             |
| Keyboard/focus          | Desktop and mobile direct-link activation          | Passed                | The native Figma link received distinct focus-visible and Enter navigated to `/hitoDS/export/figma` in every exercised path.                                                                                                  |
| Capture-board ownership | Route and runtime board                            | Passed                | One route imported one `HitoFigmaExportBoard`; runtime title was `Hito DS Figma Export — Hito Running`, heading was `Figma export surface`, and capture/code-owned/one-way labels rendered.                                   |
| External-link absence   | Source and rendered capture board                  | Passed                | No external anchor, `Hito Running Library` text/action, guessed URL, or alternate target rendered.                                                                                                                            |
| Themes/containment      | Desktop 1440x900 and exact 375x812, Light and Dark | Passed                | Capture-board backgrounds resolved differently by theme; desktop widths were 1440/1440/1440 and mobile widths were 375/375/375 with no horizontal overflow.                                                                   |
| DS/static               | Validator, manifest parity, ESLint, Prettier       | Passed                | DS contract passed across 324 files; manifest parity remained 43 primitive colors, 41 semantic colors, and 18 current Text Styles; all focused source files passed lint and formatting.                                       |
| Browser/runtime health  | Relevant-owner-fresh compiled loopback artifact    | Passed for this slice | Focused CDP replay found no console errors, uncaught exceptions, hydration errors, failed network loads, route failures, or overflow. All relevant model/navigation/route/board source mtimes predated the compiled artifact. |
| Build                   | No runtime source changed in this no-op slice      | Not rerun             | The immediately preceding build compiled client, SSR, and Nitro with these unchanged owners; its unrelated private Admin snapshot marker/digest still prevents whole-workspace postbuild finalization.                        |

- **Omitted-check consequence:** no new build was warranted for a lifecycle-only no-op. Browser
  proof used the immediately preceding compiled artifact after confirming every relevant source
  owner predates it. This proves repository discoverability, not whole-workspace integrity, Figma
  parity, Global QA, hosted state, release readiness, or deployment.
- **Remaining task work:** the separate typography consolidation remains the repository dependency.
  The exact approved external library URL remains unknown and was not inferred.
- **Next owner:** Product, to sequence the typography dependency and retain the external URL as a
  factual stop condition.

## Slice 3 Foundations Visual Grammar Execution Preflight — 2026-08-12

- **Outcome:** replace the current role-bucket family summary and row-only spacing/radius
  presentation with live actual-family and equal-size token specimens, while leaving the current
  canonical role inventory and every unaffected Foundations family intact.
- **Exact source map:** `src/styles.css` owns the loaded Poppins, Fraunces, and JetBrains Mono
  weights; `src/styles/foundations.css` owns `--font-sans`, `--font-display`, and `--font-mono`;
  `src/lib/hito-typography-roles.ts` owns the current role purposes and specimens; and
  `HITO_DS_MANIFEST.collections.primitiveSpacing` / `primitiveRadius` own token names, CSS
  variables, and resolved source expressions.
- **Canonical seam:** reuse the existing `reference-foundations-page.tsx` family, spacing, and
  radius presentation owners. Current colour, icon, motion, Context/alpha, token-copy, surface,
  contrast, and addressability owners remain unchanged.
- **New runtime artifacts:** none. No registry, component family, wrapper, primitive, token,
  literal token value, CSS file/system/recipe, route, dependency, compatibility layer, or Product
  behavior is proposed.
- **Removal target:** replace the four-row role-bucket `TYPOGRAPHY_FAMILIES` summary, including its
  missing Fraunces truth, and replace the spacing/radius metadata-row anatomy after the live cards
  preserve every current token/use/value responsibility.
- **Typography boundary:** the separate typography-scale consolidation item remains `ready`; its
  registry, CSS, manifest, generator, validator, Inspector, and consumers are read-only here. The
  current detailed role gallery therefore remains unchanged and its final display/tier criterion
  remains an explicit dependency.
- **Focused proof:** source projection and token uniqueness; focused DS/static/build evidence; then
  Poppins/Fraunces/JetBrains rendering, spacing/radius equality and computed token truth, all seven
  Foundations addresses, copy/accessibility, exact 375x812 and desktop Light/Dark containment, and
  console/runtime health.

## Slice 3 Foundations Visual Grammar Implementation Receipt — 2026-08-12

- **Mode and owner:** Tracked Design System implementation owned by `design_system`.
- **Product outcome:** Typography now begins with three prominent live Poppins, Fraunces, and
  JetBrains Mono specimens. Spacing exposes eight equal-size visual cards whose object gaps resolve
  from the canonical spacing variables. Radius exposes seven equal-size cards and identical 80x80
  live shapes whose corners resolve from the canonical radius variables.
- **Root cause corrected:** the superseded family summary classified three Poppins role buckets and
  one Mono bucket instead of actual families, omitted Fraunces, and lived beside spacing/radius
  metadata rows that hid relative visual scale. The replacement projects existing font and token
  owners without creating a second role or token registry.
- **Source and metadata truth:** family tokens remain `--font-sans`, `--font-display`, and
  `--font-mono`; loaded weights remain Poppins 300/400/500/600, Fraunces 300/400/500, and JetBrains
  Mono 400/500 from the current canonical stylesheet. Spacing and radius names, CSS variables, and
  value expressions continue to come from `HITO_DS_MANIFEST`.
- **Typography dependency preserved:** `HITO_TYPOGRAPHY_GROUPS`, its current filtered role gallery,
  typography CSS, manifest/generator, Inspector, and validators were not migrated. The separate
  typography-scale consolidation must establish its accepted final tiered gallery and display-role
  story; this slice does not claim criteria 9 or final typography acceptance.
- **Cleanup:** the four-row `TYPOGRAPHY_FAMILIES` role-bucket summary and the spacing/radius row-only
  renderers were removed. Existing spacing usage guidance remains beneath the cards. Current color,
  workout semantic, Context/alpha, token-copy, surface, contrast, icon, and motion responsibilities
  were preserved.
- **Validator discriminator:** the direct Foundations surface-classification assertion changed from
  seven to ten accepted `hito-ds-token-specimen-surface` render owners because the three new family,
  spacing, and radius card templates deliberately reuse that canonical borderless surface. No
  typography role id/count, manifest/generator contract, or other validator expectation changed.
- **Files changed for this slice:** this canonical lifecycle record,
  `src/components/hito-ds/reference-foundations-page.tsx`, and the one direct count assertion in
  `scripts/validate-hito-ds-component-contracts.ts`.
- **Reuse budget:** new runtime artifacts `none`; no CSS file/system/recipe, registry, wrapper,
  primitive, token, route, dependency, compatibility layer, Product behavior, or literal token
  value was added. Browser screenshots are focused QA evidence under
  `qa-artifacts/screenshots/2026-08-12/hito-ds-foundations-visual-grammar/`.
- **Preserved boundaries:** Brand, Components/Patterns, Product routes/AppShell, DevTools/Inspector,
  Backend/auth/persistence, Figma and its unknown external URL, shared primitive APIs/tokens/CSS,
  hosted state, data, providers, and Git lifecycle were unchanged.

| Check                  | Scenario / environment                                   | Result                             | Evidence                                                                                                                                                                                                                                |
| ---------------------- | -------------------------------------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Family source truth    | Live Poppins, Fraunces, JetBrains specimens              | Passed                             | Computed families resolved to the three canonical stacks; `document.fonts.check` passed for rendered 400/400/500 samples; all source and active-weight labels matched current stylesheet owners.                                        |
| Family hierarchy       | Typography route, before current role inventory          | Passed                             | Three actual-family cards rendered before `type-ui-title`; Fraunces was visually distinct at display scale; the central current role gallery rendered afterward unchanged.                                                              |
| Spacing truth          | Eight manifest spacing tokens                            | Passed                             | Computed live gaps were exactly 4, 8, 12, 16, 20, 24, 32, and 40 px; every visual stage was 112 px high and every card in each responsive row had zero height spread.                                                                   |
| Radius truth           | Seven manifest radius tokens                             | Passed                             | Computed corners were exactly 4, 6, 8, 10, 12, 16, and 20 px on identical 80x80 shapes; every stage was 112 px high and responsive card rows had zero height spread.                                                                    |
| Addressability/model   | Foundations Overview plus six section destinations       | Passed                             | Overview, Colors & surfaces, Typography, Spacing, Radius, Icons, and Motion remained in the shared group model; all six section anchors resolved, the parent auto-expanded, and current child truth remained correct.                   |
| Themes and containment | Desktop 1440x900 and exact 375x812, Light and Dark       | Passed                             | All family/spacing/radius cards stayed within the viewport; document client/scroll/inner widths were 1440/1440/1440 and 375/375/375 in both themes.                                                                                     |
| Copy/accessibility     | Background semantic-token specimen                       | Passed                             | Existing accessible name remained `Copy background semantic token`; focus-visible was distinct and activation produced the existing copied-token toast.                                                                                 |
| DS/static              | Validator, manifest parity, ESLint, Prettier, diff check | Passed                             | DS contract passed across 323 files with 18 unchanged current Text Styles; manifest parity remained 43 primitive colors, 41 semantic colors, and 18 Text Styles; scoped lint/format/diff checks passed.                                 |
| Build                  | Fresh uncontended `npm run build`                        | Passed with external postbuild gap | Client, SSR, and Nitro compiled current source successfully. Final integrity finalization stopped only on unrelated private Admin snapshot marker/generation/digest `f2ec69c28fc501314484309c9953286dddaa26d9d54dae7bc732f69d53f35a50`. |
| Browser/runtime health | Fresh current-source compiled loopback artifact          | Passed for this slice              | Focused CDP replay found no console errors, uncaught exceptions, hydration errors, failed network loads, missing anchors, or page overflow across the four viewport/theme combinations.                                                 |

- **Omitted-check consequence:** the external Admin snapshot mismatch prevents a truthful
  whole-workspace finalized build receipt. The fresh compiled artifact proves this Design System
  slice only. No Global QA, release/hosted readiness, or Figma parity was assigned or claimed.
- **Remaining task work:** the separate typography consolidation must provide the accepted final
  role inventory/display story. The exact approved external Figma library URL remains unknown and
  was not inferred.
- **Next owner:** Product, to sequence the typography dependency and the remaining factual external
  URL gate without reopening the completed repository-owned slices.

## Slice 5 Components/Patterns Execution Preflight — 2026-08-11

- **Outcome:** keep standalone component anatomy in Components with predictable A–Z discovery,
  while moving the complete existing App Shell renderer and the source-proven Data Table
  toolbar/filter composition into Patterns.
- **Exact owner map:** `reference-components-structure.tsx` owns one contained App Shell renderer
  alongside unrelated Rows/Disclosure and Dropdown specimens. `reference-components-controls.tsx`
  owns one Data Table workbench whose `DataTableSpecimenPreview` composes an optional existing
  `AdminDataTableToolbar` around canonical standalone header/row anatomy. The Patterns page already
  owns page/section composition, route feedback/states, inline editing, and editorial/timeline
  composition.
- **Canonical seams:** reuse `reference-model.ts`, the existing Components modules,
  `reference-patterns-page.tsx`, `reference-overview-page.tsx`, `HitoDsPlayground`, the current App
  Shell renderer, and `DataTableSpecimenPreview`. Product `AppShell` remains read-only.
- **New runtime artifacts:** none. No registry, wrapper, primitive, token, API, CSS file/recipe,
  compatibility layer, dependency, route, or Product behavior is proposed.
- **Move and retention discriminator:** move the App Shell renderer rather than copy it; remove the
  toolbar anchor/state from the standalone Data Table workbench and render that existing toolbar
  composition from Patterns. Keep Button/grouped Button, Dropdown, Dialog/Sheet, Data Table and its
  header/row anatomy, Rows/Disclosure, and every other standalone owner in Components.
- **Intentionally unchanged:** no separate form-composition specimen exists outside the Inputs
  anatomy workbench, and grouped action composition is explicitly retained with Button. Neither is
  reclassified or duplicated merely to fill a taxonomy label.
- **Focused proof:** source/anchor uniqueness and redirect map, focused DS/static/build checks, then
  desktop and exact 375px Light/Dark Components/Patterns navigation, A–Z discovery, App Shell,
  Data Table composition/anatomy, representative Demo/Variants, keyboard/focus, containment, and
  console health.

## Slice 5 Components/Patterns Implementation Receipt — 2026-08-12

- **Mode and owner:** Tracked Design System implementation owned by `design_system`.
- **Product outcome:** Components now exposes 27 standalone destinations in predictable A–Z order.
  Patterns begins with the complete existing App Shell and contains the existing Data Table
  toolbar/filter composition plus the already-owned page/section, feedback/route-state, inline
  editing, and editorial/timeline compositions.
- **Root cause corrected:** the canonical model still assigned `app-shell` and
  `data-table-toolbar` to Components even though their rendered responsibilities are composition.
  The App Shell renderer also lived inside the Components structure return, and the standalone Data
  Table workbench owned an optional cross-family utility-row state.
- **App Shell move:** the existing contained App Shell `HitoDsPlayground`, its two local controls,
  desktop shell, narrow representation, and accessibility semantics moved as one renderer within
  the same existing source module. Components no longer invokes it; Patterns invokes it exactly
  once. Product `AppShell`, Product navigation, and Product routes were not read as mutable owners.
- **Data Table boundary:** Components retains `data-table`, interactive/static header, and row
  anatomy anchors with live Demo/Variants and sorting/filtering controls. Its obsolete utility-row
  state, toolbar anchor, and toolbar render were removed. Patterns reuses the existing
  `DataTableSpecimenPreview` with its canonical `AdminDataTableToolbar`; no table JSX, toolbar, or
  state owner was copied.
- **Existing Pattern owners retained:** Banner/Notice, page/section composition, feedback/route
  states, inline editing, editorial/timeline, summary truth, and workout taxonomy remain in their
  current page owners. Grouped Button remains with Button as explicitly required. No separate
  form-composition owner was invented from standalone Input anatomy.
- **Addressability:** Overview App Shell previews now link to `/hitoDS/patterns#app-shell`.
  `components#app-shell`, `components#shell`, and `components#data-table-toolbar` factually redirect
  to their single Patterns owners; Data Table header/row anchors remain on Components.
- **Files changed for this slice:** this lifecycle record, `reference-model.ts`,
  `reference-components-controls.tsx`, `reference-components-structure.tsx`,
  `reference-patterns-page.tsx`, and the two App Shell links in `reference-overview-page.tsx`.
  Concurrent typography and App Shell variant simplification hunks in these dirty files were
  preserved.
- **Reuse budget:** new runtime artifacts `none`; no registry, wrapper, shared API, primitive,
  token, CSS file/recipe, compatibility layer, dependency, route, or Product behavior was added.
- **Preserved boundaries:** Foundations visual grammar and typography task/registry/CSS/manifest,
  Brand content, Figma and its unknown external URL, Product AppShell/routes, DevTools/Inspector,
  Backend/auth/persistence, shared tokens/primitives/CSS, hosted state, data, providers, and Git
  lifecycle were unchanged.

| Check                  | Scenario / environment                                    | Result                             | Evidence                                                                                                                                                                                                                                                               |
| ---------------------- | --------------------------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership       | Render/import/anchor reachability                         | Passed                             | `app-shell` has one renderer and one Patterns invocation; the toolbar renders only through the Patterns composition; Components passes `showUtilityRow={false}` and retains the three standalone table anatomy anchors.                                                |
| Components discovery   | Desktop model and rendered navigation                     | Passed                             | Overview plus 27 source-proven standalone labels rendered A–Z; App Shell and table toolbar were absent; Data Table was current and its group auto-expanded.                                                                                                            |
| Patterns discovery     | `/hitoDS/patterns#app-shell`                              | Passed                             | App Shell is the first prominent child after Overview; Data Table Composition and all existing Pattern owners rendered from one page/model.                                                                                                                            |
| App Shell              | Desktop Dark; Demo/Variants                               | Passed                             | Contained sidebar/content frame, current navigation, profile utility, route content, local controls, and narrow representation remained live; Demo/Variants switched correctly.                                                                                        |
| Data Table boundary    | Components anatomy and Patterns composition               | Passed                             | Components retained native table, two rows, interactive header and Demo/Variants without a toolbar; Patterns rendered live search, filter summary, header sorting/filtering, rows, and the contained horizontal scroll owner.                                          |
| Deep links             | Old and new hashes                                        | Passed                             | `components#app-shell` and `components#shell` → `patterns#app-shell`; `components#data-table-toolbar` → `patterns#data-table-toolbar`; new composition and retained row-anatomy hashes resolved.                                                                       |
| Existing workbenches   | Button and Data Table                                     | Passed                             | Button retained Demo/Variants, grouped Button, icon-only anchors, and live controls; Data Table retained Demo/Variants and standalone anchors.                                                                                                                         |
| Keyboard/search/focus  | Desktop Enter, child search, Escape                       | Passed                             | Enter toggled the Components full-row group with focus-visible retained; App Shell search exposed its Patterns owner; Escape cleared search and restored searchbox focus.                                                                                              |
| Narrow and themes      | Exact 375×812, Light and Dark                             | Passed                             | App Shell and Data Table composition stayed within x=24–351 on the 375px canvas; page client/scroll widths were both 375; table overflow remained locally owned; the mobile Patterns group auto-expanded with truthful current App Shell and composition destinations. |
| DS/static              | DS validator; targeted ESLint, Prettier, diff check       | Passed                             | `validate-hito-ds-components` reported `ok` across 323 files; all scoped static checks passed after current dirty-file reconciliation.                                                                                                                                 |
| Build                  | Fresh full build and later current-source managed rebuild | Passed with external postbuild gap | The first `npm run build` completed client, SSR, Nitro, and postbuild. A later managed rebuild compiled current source through client/SSR/Nitro, then its unrelated Admin repository snapshot marker/digest changed and blocked only final integrity finalization.     |
| Browser/runtime health | Current-source loopback built output; all touched routes  | Passed for this slice              | Focused CDP replay reported no console errors, uncaught exceptions, hydration errors, failed network loads, missing anchors, or page overflow. Screenshots are under `qa-artifacts/screenshots/2026-08-12/hito-ds-showcase-components-patterns/`.                      |

- **Omitted-check consequence:** the concurrent Admin snapshot-marker drift prevented a truthful
  current-whole-workspace canonical managed-runtime receipt after browser proof. Browser checks ran
  against the current compiled loopback output from that rebuild; they prove this Design System
  slice, not Admin integrity. No independent Global QA, release acceptance, hosted proof, or Figma
  parity was assigned or claimed.
- **Remaining task work:** Foundations visual grammar and the separate typography sequencing still
  remain open. The exact approved external Figma library URL remains unknown and was not inferred.
- **Next owner:** Product, to select the next bounded repository-owned slice without conflating the
  external Figma URL gate.

## Combined IA And Brand Extraction Execution Preflight — 2026-08-11

- **Outcome:** replace the user-facing `Reference` group with the accepted six-destination browse
  order and establish a real Brand & Visuals destination by moving the existing brand and
  atmosphere specimens out of Foundations.
- **Atomic-slice reason:** the current route family has no Brand page. A model-only navigation
  change would require a placeholder, duplicate hrefs, or a broken destination, so Product combined
  the accepted IA-model and bounded Brand-extraction slices.
- **Canonical seams:** reuse `reference-model.ts`, `reference-navigation.tsx`,
  `reference-page.tsx`, the current Foundations page, and the existing file-route convention.
- **New runtime artifacts:** one Brand & Visuals page component and one matching route module only.
  No registry, navigation framework, CSS file/system, wrapper, primitive, token, dependency, or
  compatibility layer is proposed.
- **Cleanup:** move rather than copy the Logo/mark and gradient/atmosphere sections, delete their
  superseded Foundations rendering responsibility, and add only factual addressability at existing
  section owners required by the accepted navigation.
- **Preserved boundaries:** typography consolidation, specimen redesign, Product AppShell/routes,
  DevTools/Inspector, Backend, Figma, external URLs, shared primitives/tokens/CSS, and unrelated
  dirty hunks remain unchanged.
- **Focused proof:** source and deep-link map, DS/static checks, then desktop/mobile navigation,
  search/Escape/keyboard/focus, Brand route, legacy links, overflow, theme, and console evidence.

## Combined IA And Brand Extraction Implementation Receipt — 2026-08-11

- **Mode and owner:** Tracked implementation owned by `design_system`.
- **Product outcome:** `/hitoDS` now exposes the accepted top-level order: Overview, Foundations,
  Components, Patterns, Brand & Visuals, Figma Export. Overview and Figma Export are direct links;
  the other four destinations remain one native full-row expandable control each.
- **Root cause corrected:** the canonical model hid Foundations, Patterns, and Figma Export under a
  user-facing `Reference` group, while Brand and atmosphere content had no route outside
  Foundations. Product combined the model and extraction slices because either change alone would
  leave duplicate or broken destination truth.
- **Source hierarchy and reuse:** `reference-model.ts` remains the taxonomy and deep-link owner;
  `reference-navigation.tsx` still owns the shared desktop/mobile interaction; `reference-page.tsx`
  still renders the shell. The two approved Brand artifacts are the only new runtime files. Existing
  Logo/mark and atmosphere specimens were moved unchanged in presentation rather than copied.
- **Deletion and rehome:** the user-facing `Reference` group, its `secondary` model flag, and the
  old flattened component-family navigation machinery were removed. Brand and gradient/atmosphere
  sections no longer render from Foundations. Motion moved from Components to its factual
  Foundations owner. The existing validator's direct source assertions now follow the moved Brand
  owner without adding a second validation model.
- **Addressability:** Foundations owns Overview, Colors & surfaces, Typography, Spacing, Radius,
  Icons, and Motion. Brand & Visuals owns Overview, Logo & mark, Imagery, Atmosphere, and Gradients &
  overlays. Existing hash ownership redirects legacy Foundations Brand/gradient links and the old
  Components Motion link to their new canonical destinations; `components#shell` still resolves to
  App Shell without a compatibility layer.
- **Files changed for this slice:** existing reference model/navigation/page, Components and
  Foundations page composition, generated route tree, the existing DS validator's moved-owner
  assertions, this lifecycle record, and the two approved Brand page/route artifacts.
- **Preserved boundaries:** no typography registry/CSS/manifest change, specimen redesign, token,
  primitive, shared CSS, dependency, Product AppShell/route, DevTools/Inspector, Backend, Figma,
  external URL, hosted state, provider, data, staging, commit, push, or deploy action occurred.

| Check               | Scenario / environment                                             | Result                                        | Evidence                                                                                                                                                                                                                                                                                                                                                       |
| ------------------- | ------------------------------------------------------------------ | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership    | Destination, rendered-anchor, and duplicate-content map            | Passed                                        | Six top-level destinations have one canonical model; Brand/gradient specimens occur only in the new Brand page; Motion occurs only in Foundations.                                                                                                                                                                                                             |
| DS contract         | `npm run validate-hito-ds-components`                              | Passed                                        | Contract reported `ok` across 323 scanned files after moved-owner assertions were reconciled.                                                                                                                                                                                                                                                                  |
| Static quality      | Targeted ESLint, Prettier, and scoped `git diff --check`           | Passed                                        | All slice-owned source, route, validator, and lifecycle files passed.                                                                                                                                                                                                                                                                                          |
| Fresh build/runtime | `npm run build`; managed `127.0.0.1:3000` runtime                  | Passed for slice snapshot; later shared drift | Client, SSR, and Nitro builds completed; Brand route chunks were emitted; the browser replay used a current, compatible, healthy, loopback-bound runtime with `artifactFreshness: fresh` and `receipt_matches`. A final status check remained healthy but reported shared artifact drift after unrelated Admin snapshot-integrity source changed concurrently. |
| Desktop navigation  | 1440×900, Light and Dark                                           | Passed                                        | Exact order, two direct links, four group buttons, active Brand expansion/current Overview, no `Reference`, and no horizontal overflow passed.                                                                                                                                                                                                                 |
| Keyboard/search     | Desktop Enter, Space, focus-visible, child match, no-match, Escape | Passed                                        | Native buttons toggled, focus remained visible, Brand child search and live no-match status passed, and Escape cleared search and focused the searchbox.                                                                                                                                                                                                       |
| Deep links          | Old and new reference paths                                        | Passed                                        | `foundations#brand` → `brand#brand`; `foundations#gradient-overlays` → `brand#gradient-overlays`; `components#motion` → `foundations#motion`; `components#shell` → `components#app-shell`; new spacing and imagery hashes resolved.                                                                                                                            |
| Brand move          | Desktop/narrow, Light/Dark                                         | Passed                                        | Brand page rendered the existing logo, mark, imagery, atmosphere, gradient, and overlay specimens; Foundations retained no duplicate rendered owner.                                                                                                                                                                                                           |
| Mobile Sheet        | Exact 375×812, Light and Dark                                      | Passed                                        | Shared six-destination model, active expansion, Radius search, first-Escape clear/focus, second-Escape close/focus restoration, and containment passed.                                                                                                                                                                                                        |
| Existing workbench  | `/hitoDS/components#buttons`                                       | Passed                                        | Demo and Variants remain rendered with live controls.                                                                                                                                                                                                                                                                                                          |
| Runtime health      | All touched routes and redirects                                   | Passed                                        | No console errors, uncaught exceptions, hydration errors, network failures, broken anchors, or page overflow were observed.                                                                                                                                                                                                                                    |

- **Focused evidence artifacts:** `qa-artifacts/screenshots/2026-08-11/hito-ds-showcase-ia/`
  contains desktop and exact-narrow Brand/Sheet evidence in both themes.
- **Omitted-check consequence:** no independent Global QA or release acceptance was assigned or
  claimed. The browser proof covers only this completed IA/extraction slice. The shared runtime
  became stale after that replay because an unrelated concurrent Admin snapshot marker changed; no
  second build was started over the new owner, so current-whole-workspace artifact freshness is not
  claimed.
- **Remaining task work:** the Foundations family/typography/spacing/radius visual grammar and the
  fuller Components/Patterns content boundary remain open. Typography must still sequence against
  its separate canonical consolidation task. The external approved Figma library URL remains
  unknown and was not guessed.
- **Next owner:** Product, to route the next bounded Design System slice after reconciling the
  typography task and current role activity.

## Current Product Design Amendment — 2026-08-11

### Decision status

This later direct Product direction supersedes the earlier decision to hide Foundations, Patterns,
and Figma Export inside a secondary `Reference` group. It also supersedes the earlier placement of
App Shell as a top-level component destination where the new hierarchy below places it as a
first-class Pattern and keeps it prominent in Overview.

Preserve the previous implementation and validation receipt below as history. Do not describe the
new amendment as implemented until its own source and browser inventory passes.

### Current user report

Ivan finds the current `Reference` grouping illogical and too implementation-oriented for someone
learning or presenting the system. Foundations currently mixes primitive/token truth with logos,
atmosphere, typography-role inventory, spacing, and radius summaries. The typography-family summary
is not visual enough and fails to expose the distinctive Fraunces display family. Spacing and
radius read as metadata rows rather than memorable comparable specimens.

Ivan wants:

- Foundations, Patterns, and Figma Export to be visible destinations rather than hidden under
  `Reference`;
- Foundations to contain actual system primitives and semantic foundations: colours/surfaces,
  typography, spacing, radius, icons, and motion;
- a separate visual/brand destination for logos, imagery, atmosphere, gradients, and expressive
  brand application;
- Components to remain the direct A-Z inventory of standalone component owners;
- Patterns to explain source-proven compositions such as App Shell, headers, action/toolbars,
  table composition, route feedback/states, and inline editing;
- typography families, spacing, radius, and similar foundation material to use the same
  visual-first specimen grammar as component cards: live visual stage first, name and role below;
  and
- the result to reorganize current Hito truth rather than create a second documentation system or
  a new component framework.

### Confirmed current-source evidence

1. `reference-model.ts` currently exposes `Foundations`, `Patterns`, and `Figma Export` only as
   children of one `secondary: true` group labelled `Reference`.
2. `reference-foundations-page.tsx` currently owns three distinct responsibilities in one page:
   brand/logo specimens, gradient/atmosphere examples, and actual foundation/token inventories.
3. Its `TYPOGRAPHY_FAMILIES` data does not model font families. It models `UI titles`, `Body`, and
   `Label` as three Poppins role buckets plus `Mono`; Fraunces is absent.
4. The same page filters `HITO_TYPOGRAPHY_GROUPS` with `group.id !== "display"`, hiding the complete
   display-role family from the detailed gallery.
5. `foundations.css` still defines Fraunces as the canonical `--font-display`, and the canonical
   typography registry still contains Fraunces display roles. The missing accent family is therefore
   a reference-presentation defect, not evidence that the font was removed from Hito.
6. Spacing and radius currently render as compact explanatory rows. Their source data is canonical,
   but the presentation does not give each value a comparable visual specimen.
7. `reference-navigation.tsx` now correctly renders a group label and chevron inside one native
   full-row button. The amendment must preserve that corrected interaction rather than reopen the
   former split-control defect.
8. `/hitoDS/export/figma` already has its own truthful capture-board route. The navigation problem is
   discoverability, not missing export-board behavior.

### Demonstrated cause

The first incorrect owner is the reference information model and page composition, not global Hito
tokens or Product components:

- the navigation taxonomy is organized around a secondary internal `Reference` concept rather than
  the way a viewer learns and applies a design system;
- Foundations conflates token truth, brand expression, and tooling/evidence presentation;
- the local family summary substitutes role buckets for actual font families; and
- several foundation inventories prioritize metadata rows over live visual comparison.

### Accepted top-level information architecture

The public browse order is:

1. **Overview**
2. **Foundations**
3. **Components**
4. **Patterns**
5. **Brand & Visuals**
6. **Figma Export**

There is no user-facing `Reference` group. Internal filenames, helper names, or CSS classes that use
`reference` may remain when they are truthful implementation vocabulary; this task does not justify
a cosmetic repository-wide rename.

#### Overview

- Keep the live, presentation-ready showroom and direct component/pattern destinations.
- Add compact entry cards for Foundations and Brand & Visuals without replacing the live component
  gallery.
- Keep App Shell as one of the most prominent live previews.
- Keep governance secondary and concise.

#### Foundations

Use one expandable top-level navigation group with these children:

1. Foundations overview
2. Colors & surfaces
3. Typography
4. Spacing
5. Radius
6. Icons
7. Motion

Foundations contains canonical primitives, semantic tokens, scales, and rules. It does not contain
brand campaigns, atmosphere galleries, App Shell composition, or Figma capture mechanics.

#### Components

Keep standalone canonical owners and source-proven subcomponent families in A-Z order. Examples:
Button, grouped Button, Data Table and its header/row anatomy, Dialog, Sheet, Dropdown, Popover,
Field, Tabs, Status, and Slider. A component owns reusable anatomy or behavior.

#### Patterns

Use one expandable top-level group with source-proven composition destinations. Initial admitted
families are:

- App Shell and shell navigation;
- page and section headers;
- action groups and toolbars;
- form composition;
- Data Table composition, including toolbar + headers + rows;
- feedback and route states;
- inline editing; and
- editorial/timeline composition.

A Pattern combines existing owners to solve a repeated product problem. Do not move Dropdown,
Popover, Dialog, Button, or Data Table header out of Components merely because they are visually
complex. For example, Dropdown is a component; a table filter menu is a Pattern. Grouped Button is
a component/composition owner when already canonical; action hierarchy inside a toolbar is a
Pattern.

App Shell belongs here because it owns structural composition, navigation, responsive behavior,
and the content boundary. It must not be classified as Marketing or as a decorative visual asset.

#### Brand & Visuals

Use this label rather than `Marketing`: logo, display type, imagery, and atmosphere are also used by
Auth, editorial, and selected Product moments.

Initial children are:

1. Brand overview
2. Logo & mark
3. Brand typography
4. Imagery
5. Atmosphere
6. Gradients & overlays

Move the existing Logo and gradient/atmosphere specimens from Foundations; do not copy them. Brand
typography demonstrates expressive Poppins/Fraunces pairing and links back to canonical typography
roles. It does not maintain a second type scale or token inventory.

#### Figma Export

- Expose `/hitoDS/export/figma` as a direct first-class utility destination, visually separated near
  the end of the navigation if helpful but not hidden under another expandable group.
- Label it as downstream tooling/capture, not as a canonical source above code and `/hitoDS`.
- Keep the approved external Figma library action dependent on its exact factual URL.

### Content-to-destination map

| Existing content                                                          | Target destination               | Rule                                                                  |
| ------------------------------------------------------------------------- | -------------------------------- | --------------------------------------------------------------------- |
| Semantic and primitive colours, structural surfaces, workout colour roles | Foundations / Colors & surfaces  | Continue consuming canonical manifest/tokens.                         |
| Typography families and reusable roles                                    | Foundations / Typography         | Actual families first; role inventory second.                         |
| Spacing and radius primitives                                             | Foundations / Spacing and Radius | Live comparative specimens, then token metadata.                      |
| Icon registry and size rules                                              | Foundations / Icons              | Keep canonical icon registry and live size control.                   |
| Motion foundations and reduced-motion contract                            | Foundations / Motion             | Rehome existing source-proven motion truth; do not invent animations. |
| Logos and marks                                                           | Brand & Visuals / Logo & mark    | Move from Foundations with no duplicate source.                       |
| Atmosphere, imagery, gradients, overlays                                  | Brand & Visuals                  | Preserve only source-proven applications and restrictions.            |
| Button, Dropdown, Popover, Dialog, Field, Data Table anatomy              | Components                       | Standalone anatomy/behavior remains A-Z.                              |
| App Shell, page headers, toolbars, table/form composition, route states   | Patterns                         | Show composition from canonical components.                           |
| Capture board                                                             | Figma Export                     | Direct utility destination; code remains canonical.                   |

### Shared visual specimen contract for Foundations

Every admitted foundation family uses a common visual-first card anatomy:

1. **Live visual stage** — the value is perceptible before reading metadata.
2. **Name** — plain-language family or role name.
3. **Semantic purpose** — what job the value performs.
4. **Canonical token/class** — current source identifier, never a local duplicate.
5. **Usage note** — one concise `Use for` rule and, only when material, one `Avoid for` rule.

The visual stage is rendered from live HTML/CSS and current tokens. Static screenshots, manually
painted replicas, or duplicated raw values do not satisfy the contract. Cards must remain truthful
in both themes.

#### Typography Families

Show three large actual-family specimens before the semantic role inventory:

| Family         | Required specimen                                                         | Canonical purpose                             |
| -------------- | ------------------------------------------------------------------------- | --------------------------------------------- |
| Poppins        | Large UI/reading phrase plus alphabet/numerals or representative controls | Product UI, titles, labels, and reading.      |
| Fraunces       | Prominent editorial phrase rendered in Fraunces                           | Display and source-backed editorial emphasis. |
| JetBrains Mono | Technical or measured-truth sample such as pace/distance/identifier       | Technical readback and measured truth only.   |

Each card shows the family name, CSS owner, available active weights, semantic purpose, and concise
use/non-use guidance. Fraunces must be visually unmistakable without requiring the viewer to find a
small metadata line. The detailed role gallery below consumes the canonical typography registry
and includes the display group.

Coordinate the final role inventory with
`2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md`. Do not create an intermediate
parallel role taxonomy or preserve obsolete role cards merely to populate the page.

#### Spacing

- Give each canonical spacing value an equal-size card.
- Render the actual gap or inset between consistent objects so relative scale is visible.
- Show token name, resolved value, and one canonical use.
- Keep a combined comparison rail or matrix when it improves scale comprehension, but do not replace
  the individual source-backed cards with decoration.

#### Radius

- Render every radius on the same-size shape so the comparison is honest.
- Show token name, resolved value, and intended component/surface tier.
- Do not exaggerate a small radius by changing the specimen dimensions between cards.

#### Colours, icons, and motion

- Preserve existing strong colour provenance/context, icon registry, and motion evidence.
- Converge their outer card hierarchy on the shared visual-first anatomy only where doing so removes
  inconsistent presentation; do not rewrite functioning inventories for visual uniformity alone.

### Navigation interaction contract

- Overview and Figma Export are direct full-row links.
- Foundations, Components, Patterns, and Brand & Visuals are full-row expandable buttons containing
  label and chevron as one native control.
- Each expandable group contains an `Overview` child link plus addressable section/family children.
- Active children auto-expand their parent and preserve truthful `aria-current`.
- Search matches top-level groups, child labels, and keywords without destroying normal expansion
  state.
- The desktop sidebar and mobile Sheet consume the same canonical navigation model.
- Existing accepted routes and meaningful hashes resolve or redirect to one canonical destination;
  no duplicate page truth remains active.

### Reuse-first implementation budget

Reuse these existing owners:

- `reference-model.ts` for page/section/search taxonomy;
- `reference-navigation.tsx` for unified expandable-row behavior;
- `reference-page.tsx` and the existing route family for shared shell/page rendering;
- `reference-overview-page.tsx`, `reference-foundations-page.tsx`,
  `reference-patterns-page.tsx`, and current component specimen modules;
- `HitoDsPlayground`, current manifest/typography/icon/token registries, and generated export truth;
- current App Shell reference anatomy without changing Product `AppShell`; and
- `figma-export-board.tsx` as the only capture-board owner.

Expected new runtime artifacts are limited to the smallest conventional seam required for one
first-class Brand & Visuals route:

1. one Brand & Visuals page component; and
2. one matching route module.

They are justified only because the existing Foundations owner must lose a distinct brand/expression
responsibility. If the implementation proves the existing route/page model can express the same
first-class destination without these files, reuse it. Do not add a second registry, navigation
framework, card system, CSS file, token family, or documentation generator.

Required cleanup:

- delete the user-facing `Reference` group and its superseded navigation truth;
- move, not copy, Logo and atmosphere/gradient sections out of Foundations;
- replace the role-bucket `TYPOGRAPHY_FAMILIES` summary with actual family specimens derived from
  canonical owners;
- stop filtering the accepted display family from the visible typography gallery after reconciling
  the typography-consolidation task;
- replace superseded spacing/radius row-only presentation when the new cards prove parity; and
- remove obsolete destinations/anchors only after a complete consumer/deep-link map and canonical
  redirects or zero-reachability proof.

### Executable implementation slices

1. **Product routing gate.** Reconcile current sidebar-role activity and the typography task, then
   route one bounded Design System slice without interrupting active work.
2. **Design System — canonical IA model.** Replace `Reference` with the accepted top-level groups,
   preserve unified row behavior/search/mobile Sheet, establish direct destinations, and preserve or
   redirect existing deep links. Do not change page content beyond what the new model requires.
3. **Design System — Foundations visual grammar.** Implement actual family specimens and visual
   spacing/radius cards from current registries/manifests. Keep colour, icon, and motion truth intact.
4. **Design System — Brand & Visuals extraction.** Move existing brand/atmosphere content into the
   one new first-class page seam and delete the old duplicate responsibility from Foundations.
5. **Design System — Components/Patterns boundary.** Rehome App Shell and admitted composition
   examples while keeping standalone component anatomy A-Z and Product `AppShell` read-only.
6. **Design System — Figma Export discoverability.** Expose the current capture board directly. Add
   the external library action only after the exact approved URL is factual.
7. **QA — focused reference acceptance.** Validate the final integrated IA/specimen contract in
   desktop and exact narrow viewports, both themes, pointer/keyboard/search/deep links/mobile Sheet,
   and affected live specimens. This is not Global QA or release acceptance unless separately
   assigned.

Each Design System slice must be independently auditable and should remove or rehome more
superseded presentation responsibility than it adds. Product chooses and dispatches the immediate
owner; this Designer artifact does not dispatch implementation.

### Current success criteria

1. No user-facing sidebar item or expandable group is labelled `Reference`.
2. The primary discovery order is Overview, Foundations, Components, Patterns, Brand & Visuals,
   Figma Export.
3. Foundations exposes Overview, Colors & surfaces, Typography, Spacing, Radius, Icons, and Motion
   as addressable destinations.
4. Components remain source-proven, standalone owners in predictable A-Z discovery.
5. Patterns contain source-proven compositions; standalone Dropdown/Popover/Dialog/Button/Data
   Table anatomy is not misclassified.
6. App Shell is a prominent Overview preview and a complete Patterns destination, without changing
   Product `AppShell` behavior.
7. Logo, mark, imagery, atmosphere, gradients, and overlays live in Brand & Visuals and are not
   duplicated in Foundations.
8. Typography Families visibly shows Poppins, Fraunces, and JetBrains Mono as live actual-family
   specimens before the role inventory.
9. Fraunces/display roles are not filtered out of the visible canonical typography story.
10. Spacing and Radius use comparable visual cards derived from canonical tokens and resolved
    values.
11. Foundation cards use live theme-resolved HTML/CSS specimens, not screenshots or local literal
    recipes.
12. Figma Export is directly discoverable and the exact external library URL is never guessed.
13. Unified full-row group buttons, child links, active expansion, search, Escape, keyboard,
    focus-visible, mobile Sheet, and no-match behavior remain intact.
14. Accepted old URLs/hashes resolve or redirect without duplicate navigation truth.
15. The existing Demo / Variants workbench and source-proven component states remain intact.
16. No Product route behavior, Backend truth, persistence, tokens, Inspector, Figma file, hosted
    state, or unrelated dirty source is changed.

### Current validation expectations

| Check               | Scenario / environment                                                        | Required evidence                                                                                                    |
| ------------------- | ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| Source ownership    | Task diff and complete destination/consumer map                               | Existing canonical owners reused; two new Brand route artifacts justified or avoided; moved sections have one owner. |
| Navigation model    | Desktop and mobile navigation                                                 | Six accepted top-level destinations, no `Reference`, one full-row control per group, truthful active state.          |
| Search and keyboard | Group/child/keyword/no-match/Escape; Tab/Enter/Space                          | Filtering, expansion, focus, and announcements remain correct.                                                       |
| Deep links          | Current pages, old `Reference` children, admitted hashes                      | One canonical destination or explicit redirect; no broken links or duplicate truth.                                  |
| Foundations         | Desktop and exact 375px, Light/Dark                                           | All seven destinations render; family/spacing/radius cards remain legible, comparable, and overflow-free.            |
| Typography          | Poppins/Fraunces/JetBrains and reconciled role gallery                        | Actual fonts render; display is visible; no duplicate or stale typography registry.                                  |
| Brand & Visuals     | Desktop and exact 375px, Light/Dark                                           | Moved logo/atmosphere specimens render from existing owners; Foundations no longer duplicates them.                  |
| Components/Patterns | Representative families and App Shell                                         | Component vs composition boundary matches this decision; Demo / Variants remains interactive.                        |
| Figma Export        | Direct route and navigation                                                   | Existing capture board is reachable; external link appears only with exact approved URL.                             |
| DS validation       | Focused validator and manifest/export checks affected by the change           | No unsupported primitive, stale destination, registry drift, or export mismatch.                                     |
| Static/build        | Touched formatting/lint/diff check plus fresh build/integrity when applicable | Current source compiles and runtime artifacts are fresh; omitted broad checks have explicit consequences.            |
| Runtime health      | All affected `/hitoDS` routes                                                 | No console, hydration, missing-anchor, focus, or horizontal-overflow regression.                                     |
| Independent review  | Focused design/accessibility/QA review                                        | Accepted hierarchy and specimen grammar are recognizable without new visual-language drift.                          |

### Current boundaries and stop conditions

Do not touch:

- Product `AppShell`, Product routes, runner navigation, Backend, auth, persistence, hosted state, or
  Product data;
- token values, the accepted typography migration contract, icon registry, or component APIs except
  under their separately assigned canonical task;
- DevTools/Inspector behavior or its typography registry migration;
- Figma files, mapping, publication, provider state, or an unconfirmed external URL;
- unrelated dirty source, current active QA/release items, staging, commits, pushes, deployments, or
  destructive data; or
- internal `reference-*` implementation names solely to erase the word from source.

Stop and return to Product if:

- current dirty changes overlap a required source owner and cannot be reconciled byte-for-byte;
- the typography migration and this gallery require incompatible intermediate registries;
- a new shared Product primitive/API is required instead of a reference composition;
- Product `AppShell` must change to make the specimen truthful;
- preserving accepted links requires a broader routing/product decision;
- more than the bounded Brand page/route artifacts or a second registry/framework appear necessary;
- the exact approved Figma URL remains unknown when the external-link slice is reached; or
- a required check fails outside the Design System owner.

## Exact Current Handoff Prompt

```text
ROLE: PRODUCT

Mode: Tracked routing and lifecycle only — no implementation or QA

Use the current canonical item:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-10-hito-ds-showcase-navigation-and-catalog-ia.md`

The canonical IA/Brand, Components/Patterns, repository-owned Foundations visual-grammar, and
Figma Export repository-discoverability slices are complete with focused proof. Read their
receipts, the current dirty diff, and the ready typography dependency:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-typography-scale-consolidation-and-adoption.md`.

Reconcile the current state of the existing named sidebar roles, then select the next bounded owner
for the typography consolidation according to that task's accepted sequence. Do not reopen or copy
the completed family, spacing, radius, Brand, navigation, App Shell, Components/Patterns, or direct
capture-board discoverability work.
The exact approved Hito Running Library URL remains an independent factual gate and must not be
inferred, accessed, or sent to Figma work without Ivan's exact approved target.

Do not implement or QA in Product, mutate runtime source/Figma/hosted state/data/Git lifecycle, or
claim Global QA/release readiness. Report the current lifecycle and one exact next-role handoff only
when Product's dispatch rules permit it.
```

## Designer Amendment Receipt — 2026-08-11

- **Mode:** Tracked design-system planning and backlog retention; no implementation.
- **Product outcome:** the user-facing `Reference` layer is rejected. The current accepted IA makes
  Foundations, Components, Patterns, Brand & Visuals, and Figma Export first-class destinations and
  gives Foundations one visual-first live specimen grammar.
- **Demonstrated cause:** the canonical reference model hides three destinations under a secondary
  internal group; Foundations mixes token, brand, and atmosphere responsibilities; the local family
  summary omits Fraunces; and the detailed typography view filters the display group.
- **Canonical seam:** existing `/hitoDS` model, navigation, page, manifest/registry, specimen, and
  export-board owners. At most one conventional Brand page component and matching route are admitted
  if they replace the mixed Foundations responsibility.
- **File changed:** this canonical backlog item only.
- **Preserved boundaries:** runtime source, CSS, tokens, Product `AppShell`, DevTools, Figma,
  manifests, validators, current active QA/release items, hosted state, and unrelated dirty hunks
  were not changed.
- **Dirty-source gate:** current concurrent changes already touch Foundations, Patterns, generated
  manifest/validator, and typography owners. The implementation owner must inspect and preserve
  those hunks before the first source write.
- **Intentionally unresolved:** final sequencing against the typography migration, whether the two
  bounded Brand route artifacts are necessary after inspection, and the exact approved external
  Figma library URL.
- **Next owner:** Product must inspect role activity, propose the first bounded Design System slice,
  and wait for Ivan's explicit dispatch confirmation.

| Check                      | Scenario / environment                                                                               | Result  | Evidence                                                                                                                                                     |
| -------------------------- | ---------------------------------------------------------------------------------------------------- | ------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Canonical-item reuse       | Backlog search and predecessor reconciliation                                                        | Passed  | Existing showcase item was reopened; no parallel duplicate task was created.                                                                                 |
| Source-backed IA audit     | Current reference model, navigation, Foundations, Patterns, typography registry/CSS, and Figma route | Passed  | Each accepted move has a demonstrated current owner and deletion/reuse target.                                                                               |
| Artifact completeness      | Current amendment                                                                                    | Passed  | User report, evidence, cause, IA, specimen contract, slices, success criteria, validation, boundaries, stop conditions, and one current handoff are present. |
| Documentation quality      | Scoped Prettier and `git diff --check`                                                               | Passed  | Canonical item is formatted and whitespace-clean.                                                                                                            |
| Browser/runtime acceptance | `/hitoDS`                                                                                            | Not run | Documentation-only amendment; no browser-visible change or implementation claim was made.                                                                    |

## Execution Preflight — 2026-08-10

- **Outcome:** make `/hitoDS` a presentation-ready live showroom with one complete App Shell
  specimen, an A-Z component catalogue, unified family-row navigation, and secondary reference
  destinations while preserving the existing Demo / Variants workbench.
- **Demonstrated cause:** `HitoDsNestedNav` renders the page label link and chevron toggle as sibling
  controls; the reference navigation model also keeps policy-first Overview sections and page-first
  grouping as its primary browse truth.
- **Canonical seams:** reuse `reference-model.ts`, `reference-navigation.tsx`,
  `reference-overview-page.tsx`, `reference-page.tsx`, the existing component specimen modules,
  `HitoDsPlayground`, the existing App Shell anatomy, and canonical Hito UI/Admin owners.
- **New production runtime artifacts:** none. The accepted hierarchy can be absorbed by existing
  reference modules without a new registry, route framework, primitive, token, or component family.
- **Cleanup:** remove the split label/chevron interaction, demote policy/governance material from the
  Overview first layer, and delete or consolidate reference-only presentation made obsolete by live
  canonical previews. Preserve accepted URLs through the existing route/hash seam.
- **Preserved boundaries:** no Product `AppShell` or route behavior, Backend, persistence, tokens,
  Figma mutation/mapping, Inspector, unrelated dirty source, commit, push, deploy, or hosted action.
- **Validation:** focused DS validator, static quality, fresh build/integrity, desktop and exact
  375px light/dark browser proof, navigation/search/deep-link/keyboard/mobile-Sheet checks, complete
  App Shell and representative workbench proof, runtime health, and independent architecture,
  design/accessibility, and QA review.
- **Open discriminator:** repository search confirms the standalone target name `Hito Running
Library`, but no approved external URL. Work may proceed; the Figma-link criterion stays open
  until Product or DESIGN SYSTEM INTEGRATION supplies the exact factual URL.

## User Report

Ivan wants `/hitoDS` to be as easy to explain and demonstrate as the Astryx component library:

- Overview should contain live component previews and direct destinations, not primarily internal
  governance notes.
- A real App Shell example should show the left navigation and right content region together.
- The component catalogue should be easy to scan alphabetically after Overview and App Shell.
- A grouped sidebar row must behave as one control: label and chevron expand or collapse together.
- Component descriptions should quickly explain what a component is, when to use it, its important
  states, and where it appears in Hito.
- Existing examples such as banners/notice surfaces, button groups/compositions, table headers, and
  other product-proven subcomponents should become easy to find.
- The Overview should link briefly to the approved Hito Figma library.
- The result must reuse the current system and must not become a new documentation framework or a
  larger parallel Design System.

Reference supplied by Ivan:

- [Astryx Components](https://astryx.atmeta.com/components)
- [Astryx App Shell](https://astryx.atmeta.com/components/AppShell)

## Evidence

### Current Hito runtime

- `/hitoDS` returns a healthy public reference surface.
- The Overview headline says `Find, try, compare`, but the page contains Figma export governance,
  wrapper notes, and local exceptions rather than live component previews.
- `/hitoDS/components` already has a strong live `Demo / Variants` workbench with interactive
  settings. This is accepted behavior to preserve.
- The current Shell navigation specimen shows navigation, profile, and utility fragments, but not a
  complete left-navigation plus right-content App Shell composition.
- The current Data table specimen already demonstrates interactive and static table-header owners;
  these examples are present but buried inside one long Components page.

### Demonstrated sidebar cause

`HitoDsNestedNav` renders each top-level row as two sibling controls:

- an anchor containing the page label; and
- a separate 32px button containing only the chevron.

Runtime DOM confirms that the label and arrow have separate accessible roles and click targets. The
visible split interaction is therefore caused by the reference navigation owner, not by a general
Button, Icon, browser, or CSS-token defect.

Relevant owners:

- [`reference-navigation.tsx`](../../../src/components/hito-ds/reference-navigation.tsx)
- [`reference-model.ts`](../../../src/components/hito-ds/reference-model.ts)
- [`reference-overview-page.tsx`](../../../src/components/hito-ds/reference-overview-page.tsx)
- [`reference-page.tsx`](../../../src/components/hito-ds/reference-page.tsx)
- [`playground.tsx`](../../../src/components/hito-ds/playground.tsx)
- [`reference-components-controls.tsx`](../../../src/components/hito-ds/reference-components-controls.tsx)
- [`reference-components-structure.tsx`](../../../src/components/hito-ds/reference-components-structure.tsx)
- [`AppShell.tsx`](../../../src/components/AppShell.tsx)
- [`AdminOperationalComponents.tsx`](../../../src/components/admin/AdminOperationalComponents.tsx)

### External reference finding

Astryx separates two discovery modes:

1. an alphabetical sidebar for direct lookup; and
2. a semantically grouped visual Overview with live examples.

Its grouped sidebar family uses one full-row button containing both the label and chevron. The main
component destination appears inside the expanded group. Its App Shell page combines a complete
visual example, a short usage description, best-practice guidance, and distinct configurations.

Hito should adopt this discoverability logic, not Astryx's visual language, framework, package
model, generic component breadth, or public-library documentation volume.

## Supporting Context

- [Completed Hito DS IA and specimen contract](../../plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md)
- [Hito DS discoverability and safe reuse plan](../../plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md)
- [Completed reference simplification history](../frontend-specs/2026-05-24-hito-ds-reference-simplification-spec.md)
- [Code-to-Figma foundation task](2026-08-04-hito-ds-code-to-figma-foundation-cleanup.md)

The completed IA plan remains accepted history for source hierarchy, specimen grammar, and
ownership. This task supersedes only its presentation order for the public browse experience. The
operational lifecycle lives in this backlog item.

## Observed Behavior

1. Overview is policy-first and cannot act as a quick visual demonstration of Hito components.
2. A user must know that interactive examples live on the long Components page.
3. The sidebar groups are not single interaction targets; clicking the label navigates while
   clicking the adjacent arrow expands or collapses.
4. Component order mixes families and patterns rather than offering a predictable alphabetical
   lookup path.
5. App Shell is represented as separate fragments instead of the complete product frame Ivan wants
   to demonstrate.
6. Existing subcomponent owners such as table column headers are difficult to address directly.
7. Component sections have good live demos but inconsistent explanations of purpose, correct use,
   non-use, states, and accessibility behavior.
8. The Overview links to the internal `/hitoDS/export/figma` capture board, not visibly to the
   approved external Hito Figma library.

## Historical Accepted Design Decision — Superseded By 2026-08-11 Amendment

The existing Hito DS, product primitives, visual language, and specimen workbench remain canonical.
The implementation should reorganize and expose that truth through four discovery layers:

1. **Overview** — a visual showroom of live, product-proven examples grouped by user meaning.
2. **App Shell** — a complete composed shell reference immediately after Overview.
3. **Components A-Z** — an alphabetical lookup of canonical families and source-proven children.
4. **Reference** — secondary access to Foundations, Patterns, Figma export, and necessary ownership
   notes without letting those notes dominate the showcase.

Overview grouping and sidebar ordering intentionally solve different jobs. Overview may group by
purpose; the sidebar remains alphabetical after App Shell.

## Historical Target Information Architecture — Implemented Previous Slice

### Primary sidebar order

1. Overview
2. App Shell
3. Alphabetical component families
4. Secondary Reference group

The initial A-Z catalogue should expose the existing admitted owners and compositions, including:

- Async Action Toasts
- Banner / Notice Surface
- Button
- Calendar
- Data Table
- Dialog / Sheet
- Dropdown / Menu
- Editable Value Field
- Input / Date-Time Fields
- Motion
- Rows & Disclosure
- Selection Controls
- Slider
- Status / Metadata
- Tabs

This list is a discoverability inventory, not permission to create a runtime component for every
label. The owner must keep only source-proven families and may refine labels when current canonical
names differ.

### Family children

Expose useful source-proven children underneath a family when they help direct lookup. Required
examples include:

- **Button:** Button, icon-only Button, and grouped Button composition.
- **Data Table:** Data Table, Toolbar, interactive Column Header, Static Header, and Row anatomy.
- **Dialog / Sheet:** existing overlay owners and their materially different compositions.
- **Input / Date-Time Fields:** existing Field, native select, textarea, date, and time owners.
- **Status / Metadata:** current status, marker, metadata-tag, and notice/state-surface roles where
  their canonical distinction is already implemented.

Do not expose internal hooks, compatibility wrappers, or implementation-only helpers merely to make
the tree look complete.

## Overview Contract

Overview must become the fastest way to show the Hito Design System to another person.

Required anatomy:

1. A concise Hito DS title and one-sentence purpose.
2. A compact `View Figma` action using the approved external Hito library URL.
3. A responsive live-preview gallery grouped by purpose rather than alphabetically.
4. Each preview links to one addressable component family or child example.
5. A small code-canonical boundary note may remain, but technical governance must not dominate the
   first viewport.

Required gallery groups:

- **Action:** Button, grouped Button composition, Dropdown/Menu.
- **Data Input:** Input/Field, Selection Controls, Slider, Date-Time field.
- **Feedback & Status:** Banner/Notice Surface, Status/Metadata, Async Action Toast.
- **Layout:** App Shell and one reusable surface/row composition.
- **Navigation:** Tabs and shell navigation.
- **Overlay:** Dialog/Sheet and relevant Popover/Tooltip examples when already canonical.
- **Table & List:** Data Table, interactive/static header distinction, and Rows & Disclosure.

Preview cards use real canonical owners or already-accepted compositions. Static screenshots,
hand-drawn replicas, and manually restyled fake controls do not satisfy this contract.

## Sidebar Interaction Contract

### Grouped family

- The entire visible row, including label and chevron, is one button.
- Pointer activation anywhere on the row expands or collapses the group.
- The button exposes truthful `aria-expanded` and `aria-controls` state.
- The chevron rotates as a visual consequence of the same state; it is not a second control.
- The expanded group contains an addressable link to the main family and any admitted children.
- The active destination keeps its parent expanded automatically.

### Leaf destination

- The entire row is one link.
- It does not display a false expansion affordance.

### Search

- Search filters family and child labels/keywords.
- Matching groups expand for the search result without destroying the user's normal expansion
  state.
- Escape clears a non-empty query.
- A no-match state is announced and does not leave empty interactive groups.

### Mobile and keyboard

- The mobile browse Sheet uses the same navigation model and interaction semantics.
- Tab, Enter, and Space behavior follows native link/button expectations.
- Focus-visible treatment remains clear in dark and light themes.
- Opening, closing, searching, and following a child destination must not trap focus or leave the
  Sheet open over the new destination.

## App Shell Showcase Contract

App Shell receives a dedicated addressable destination immediately after Overview.

Required outcome:

- Show one complete contained desktop composition with left navigation and right content together.
- Demonstrate product identity, active/inactive navigation, content region hierarchy, and the
  profile/utility boundary without requiring authentication or persisted runner state.
- Show the current narrow/mobile navigation behavior or a truthful contained representation of the
  same canonical contract.
- Include materially useful configurations only, such as the base shell and a shell with an
  existing Banner/Notice Surface when that composition is source-proven.
- Explain what App Shell owns and what remains route content.

The reference must consume or truthfully represent the existing product-owned App Shell anatomy.
It must not introduce a second App Shell component, alter product routing, invent runner data, or
change the production `AppShell` contract merely to make the reference easier to embed. If a
product-source change is genuinely required, stop and return the exact Frontend Product boundary to
Product.

## Component Description Contract

Every admitted component family must use one concise, consistent information hierarchy:

1. **Name and ownership status** — existing status vocabulary only.
2. **Purpose** — one or two sentences describing the problem owned by the component.
3. **Use when / avoid when** — short product guidance, not generic marketing copy.
4. **Live Demo** — preserve the current interactive workbench behavior.
5. **Variants and states** — preserve current supported variants; do not expand the API for the
   reference.
6. **Interaction and accessibility** — only the material keyboard, focus, announcement, overlay,
   disabled, loading, error, or reduced-motion behavior.
7. **Used in** — current product routes or compositions backed by source.

Do not add package-version chrome, generated prop tables, copy-ready installation flows, public npm
documentation, or long code examples unless Hito later becomes an external library through a
separate Product decision.

## Banner, Button Group, And Table Header Boundaries

### Banner / Notice Surface

Use the existing state/notice surface and current product consumers as the source seam. A catalogue
label may call the presentation `Banner / Notice Surface`, but this task does not authorize a new
`Banner` runtime primitive unless reachability proves one repeated contract that the current owner
cannot express.

### Grouped Buttons

Demonstrate an existing connected or grouped Button composition using canonical Hito Buttons. Do
not create a `ButtonGroup` API solely to match Astryx terminology. If current Product source proves
a repeated component-level owner, the implementation owner must record that discriminator before
adding a shared artifact.

### Table Header

Expose the existing interactive `AdminDataTableColumnHeader` and static
`AdminDataTableStaticHeader` as directly discoverable examples under Data Table. Do not duplicate
their sorting, filtering, menu, typography, or accessibility behavior in `/hitoDS`.

## Figma Boundary

- The Overview should contain one concise link to the approved Hito Figma library.
- The repository identifies the selected standalone target as `Hito Running Library`, but the
  canonical external URL is not currently present on the Overview.
- Product or DESIGN SYSTEM INTEGRATION must confirm the exact approved URL. The implementation must
  not guess from older `hito-running` node links or silently link a legacy file.
- Adding a read-only link to the confirmed target is in scope for `/hitoDS`.
- Figma discovery, mutation, mapping, publication, library hygiene, and Figma-side validation remain
  exclusively owned by DESIGN SYSTEM INTEGRATION and are out of scope.
- Code and `/hitoDS` remain canonical for implemented component behavior.

The task may progress before the URL is confirmed, but it cannot satisfy the final external Figma
link criterion until the exact target is factual.

## Reuse-First Budget

Reuse:

- `HitoDsPlayground` and its live `Demo / Variants` behavior;
- the current reference route/page model, deep links, mobile browse Sheet, and search capability;
- Hito Button, Field, Choice, Tabs, Dialog, Sheet, Dropdown, Slider, Status, Metadata, Row, Icon,
  typography, surface, spacing, radius, and theme contracts;
- current Data Table toolbar/header/row owners;
- current App Shell anatomy and product presentation patterns without changing Product behavior;
- current generated manifest and validators only where their existing contract applies.

Expected new production runtime artifacts: **none by default**.

The implementation may reorganize existing reference modules when the current large-file shape
makes ownership unclear, but a new runtime component, component family, helper, registry, metadata
model, route framework, documentation generator, token, CSS recipe, or compatibility path requires
a source-backed responsibility that an existing owner cannot absorb.

Required cleanup:

- Remove the split label/chevron interaction once the single-row navigation contract replaces it.
- Move or compact Overview governance material that no longer belongs in the visual first layer.
- Remove reference-only replicas made obsolete by canonical live previews.
- Keep old URLs working through the smallest truthful preservation or redirect seam; do not retain
  two navigation models.

## Implementation Process

### Gate 1 — Reconfirm owners and lifecycle

- Update this item to `in_progress` before the first implementation write.
- Reconfirm the current reference routes, canonical component owners, current product consumers,
  and exact external Figma-link discriminator.
- Record every proposed new runtime artifact or `none` before adding source.
- Stop if the work reaches Product App Shell behavior, a new primitive decision, or Figma mutation.

### Gate 2 — Establish the discovery model

- Make Overview, App Shell, A-Z families, children, and secondary Reference destinations
  addressable.
- Preserve or truthfully redirect accepted deep links.
- Make grouped sidebar rows one interaction target and preserve search/mobile behavior.

### Gate 3 — Build the visual Overview from existing owners

- Replace policy-first presentation with the required grouped live-preview gallery.
- Keep the first viewport legible and demonstrative.
- Add the confirmed Figma link and compact code-canonical boundary.

### Gate 4 — Complete App Shell and catalogue coverage

- Add the complete contained App Shell destination.
- Expose the required source-proven families and children.
- Add Banner/Notice, grouped Button, and Table Header examples through their existing owners.
- Keep unsupported or merely theoretical component families out of the public catalogue.

### Gate 5 — Normalize descriptions and remove superseded reference paths

- Apply the concise component description contract.
- Preserve the existing workbench interaction grammar.
- Remove split navigation, duplicate replicas, and Overview material superseded by the new
  hierarchy.

### Gate 6 — Focused implementation acceptance

- Run the required source, build, browser, responsive, theme, navigation, accessibility, and deep
  link inventory below.
- Obtain a bounded independent visual/interaction review when available.
- Fix forward inside the Design System owner boundary.
- Update this item to its truthful terminal or waiting state before final reporting.

## Historical Definition Of Done — Previous Slice

The task is complete only when all of the following are true:

1. Overview visibly functions as a live Hito component showroom rather than a governance page.
2. App Shell has a dedicated, complete, contained left-navigation plus right-content example.
3. The primary sidebar order is Overview, App Shell, then alphabetical component families, followed
   by a clearly secondary Reference group.
4. Every grouped sidebar family uses one full-row expand/collapse button; no separate label and
   chevron click targets remain.
5. Leaf destinations remain full-row links, active destinations are clear, and active families
   expand automatically.
6. Search, no-match, Escape clear, keyboard, focus, mobile Sheet, and deep-link behavior remain
   functional.
7. The current `Demo / Variants` workbench and supported interactive component states remain intact.
8. Required source-proven examples include the existing Banner/Notice composition, grouped Button
   composition, Data Table headers, and other admitted canonical children without inventing new
   APIs.
9. Component descriptions consistently cover purpose, correct use/non-use, material states,
   accessibility behavior, and real product usage.
10. Overview links to the exact approved `Hito Running Library` URL and does not guess or expose a
    legacy target.
11. Dark and light themes remain coherent at desktop and exact narrow/mobile widths with no page or
    contained-specimen horizontal overflow.
12. No Product route behavior, backend truth, authentication, persistence, token contract, Figma
    file, or shared primitive API changes outside the demonstrated Design System owner are absorbed.
13. Obsolete split-navigation and duplicate reference-only presentation paths are removed or their
    factual temporary retention is recorded.
14. Every required check passes; a failed, omitted, or unavailable required check keeps the task
    open with its exact coverage consequence.

## Historical Validation Expectations — Previous Slice

The implementation owner must derive the final inventory from the changed contract. At minimum it
must cover:

| Check               | Scenario / environment                                                                | Required evidence                                                                                    |
| ------------------- | ------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Source ownership    | Reference model, navigation, Overview, App Shell specimen, admitted child examples    | Existing canonical owners are reused; proposed new artifacts and cleanup are recorded                |
| DS contract         | Existing focused Hito DS validator                                                    | No unsupported primitive/variant/reference recipe is introduced                                      |
| Static quality      | Touched source and task lifecycle diff                                                | Formatting/lint and `git diff --check` pass                                                          |
| Build               | Fresh production build and existing build-integrity seam when applicable              | Current source produces fresh executable output                                                      |
| Overview            | Desktop dark and light                                                                | Live grouped previews, direct destinations, concise Figma action, no governance-first first viewport |
| Sidebar interaction | Pointer and keyboard                                                                  | Whole family row toggles; label/chevron are one control; leaf rows navigate; focus remains visible   |
| Search              | Match, child match, no match, Escape clear                                            | Results and expansion are truthful and announced                                                     |
| Deep links          | Existing Overview, Foundations, Components, Patterns, and admitted child destinations | Old accepted destinations resolve or redirect without duplicate navigation truth                     |
| App Shell           | Desktop contained specimen                                                            | Left navigation and right content render together with truthful canonical anatomy                    |
| Component workbench | Representative Button, Table Header, Field, Overlay, and state/notice examples        | Demo/Variants and supported controls remain interactive                                              |
| Narrow/mobile       | Exact 375px-class viewport in dark and light                                          | Mobile browse Sheet, previews, App Shell, and controls remain reachable with no horizontal overflow  |
| Runtime health      | All touched `/hitoDS` routes                                                          | No new console errors, hydration errors, broken anchors, or missing destinations                     |
| Independent review  | Focused visual/interaction review                                                     | Accepted hierarchy and interaction match this task without visual-language drift                     |

Global QA Acceptance and release readiness are not implied by this implementation inventory.

## What Not To Touch

- Hito's visual language, token values, typography contract, control size scale, radius scale, or
  theme policy unless a separate source-proven Design System defect is assigned.
- Product `AppShell` behavior, route state, navigation destinations, runner identity, persisted plan
  data, profile behavior, or authentication.
- Backend, database, Supabase, RLS, provider, AI, import/export, entitlement, or persistence logic.
- Figma mutation, mapping, publication, target discovery, or library hygiene.
- Local Inspector, DevTools, Admin workflow behavior, or unrelated product-route UI.
- The separate responsive-composition backlog item except where this reference must preserve its
  current accepted narrow-screen contract.
- Unrelated dirty working-tree files, commits, staging, pushes, deployments, hosted data, or release
  actions.
- Astryx source code, StyleX, packages, visual recipes, generic templates, or public-library
  infrastructure.

## Stop Conditions

Stop and return the exact boundary to Product when any of the following occurs:

- a new shared runtime primitive or API is required rather than a reference composition;
- the complete App Shell specimen cannot be truthful without changing product `AppShell` behavior;
- the external Figma target URL cannot be confirmed or points to a conflicting/legacy library;
- accepted deep links cannot be preserved without a broader routing decision;
- the catalogue requires a second metadata registry or documentation framework;
- a required browser/build/accessibility check fails outside the Design System owner;
- implementation scope expands into Product routes, Backend, persistence, Figma mutation, or an
  unrelated Design System contract.

## Implementation Receipt — 2026-08-11

- **Mode and owner:** Tracked implementation owned by `design_system`.
- **Outcome:** the `/hitoDS` runtime implementation is complete. Overview is now a grouped live
  showroom; App Shell has a complete contained desktop and narrow specimen; the catalogue is
  Overview, App Shell, admitted component families A-Z, then a secondary Reference group; grouped
  sidebar rows are one native full-row control; and component descriptions use one consistent
  existing `HitoDsPlayground` contract.
- **Root cause corrected:** the canonical reference navigation previously rendered one family as a
  sibling label link and chevron button, while the page-first model and governance-first Overview
  obscured the accepted component and composition destinations. The fix stays in the existing
  reference model, navigation, page, Overview, specimen, playground, and reference CSS seams.
- **Files changed:** existing modules under `src/components/hito-ds/` and
  `src/styles/reference-workbench.css`, plus this lifecycle record. No production runtime file,
  registry, route artifact, primitive, API, token, validator, or fixture was added.
- **Reuse evidence:** Banner / Notice remains the existing `.hito-state-surface` recipe; grouped
  actions compose canonical Buttons without a `ButtonGroup` API; interactive and static table
  headers render the existing Admin owners; and the App Shell specimen follows Product anatomy
  without importing or changing Product behavior.
- **Independent fix-forward:** final architecture, design/accessibility, and QA review removed the
  invented Admin shell context, made Runner desktop/narrow navigation truthful, labelled the
  Overview search field, made Escape clear search from any focused catalogue descendant, replaced
  false menu commands with real destinations, and added contained overflow and child-anchor
  corrections before the final browser replay.
- **Preserved boundaries:** Product `AppShell`, Product routes, Backend, persistence, tokens,
  Inspector, Figma, hosted state, and unrelated concurrent dirty work were not changed. No staging,
  commit, push, deploy, paid-provider call, or destructive action occurred.

| Check                              | Scenario / environment                                   | Result                | Evidence                                                                                                                                                                                                                                                                                                         |
| ---------------------------------- | -------------------------------------------------------- | --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership and reuse         | Task-owned diff review                                   | Passed                | Existing reference seams only; no new runtime artifacts or cross-owner source changes.                                                                                                                                                                                                                           |
| Design System contract             | `npm run validate-hito-ds-components`                    | Passed                | Contract reported `ok` across the final task source.                                                                                                                                                                                                                                                             |
| Static quality                     | Targeted ESLint, Prettier, and scoped `git diff --check` | Passed                | All task-owned TS/TSX/CSS and this work item passed.                                                                                                                                                                                                                                                             |
| Fresh build and integrity          | Canonical managed runtime at `127.0.0.1:3000`            | Passed                | Production client/SSR build completed; integrity reported `local ok`; status is `current`, `managed`, `compatible`, `healthy`, `loopbackBind: true`, and `artifactFreshness: fresh` with `receipt_matches`.                                                                                                      |
| Overview and catalogue             | 1440x900 and exact 375x812, Light and Dark               | Passed                | Seven live showroom groups, accepted order, one-column mobile layout, canonical destinations, and no outer overflow were verified.                                                                                                                                                                               |
| Navigation, search, and deep links | Desktop and mobile controlled browsers                   | Passed                | Full-row native family controls, leaf links, child `aria-current=location`, auto-expansion, family/child/keyword/no-match search, state restoration, retained routes, new child hashes, and legacy hash redirects passed.                                                                                        |
| Keyboard and mobile Sheet          | Chrome keyboard replay at 375x812                        | Passed                | Enter and Space toggle native family buttons; Escape from a filtered child clears search, focuses the searchbox, and keeps the Sheet open; the next Escape closes it and restores focus to `Browse DS pages`.                                                                                                    |
| App Shell and workbench            | Desktop/narrow, Light/Dark                               | Passed                | Complete Runner shell, real Calendar/Progress current-link semantics, truthful profile destinations, 32px narrow utility control, bottom navigation, representative workbench interactions, and zero page/frame overflow passed.                                                                                 |
| Browser runtime health             | In-app browser and Chrome                                | Passed                | No console, hydration, broken-anchor, or uncaught interaction errors were observed on touched routes.                                                                                                                                                                                                            |
| Independent focused review         | Architecture, design/accessibility, and QA subagents     | Passed                | Read-only findings were integrated; architecture and design re-review cleared the Runner shell and responsive fixes, QA isolated the concurrent Admin snapshot race, and affected browser checks were replayed. This is implementation DoD evidence, not Global QA Acceptance.                                   |
| Full repository typecheck          | `npx tsc --noEmit`                                       | Not passed; unrelated | The shared dirty workspace reports broad existing/concurrent errors across scripts, Product, DevTools, workout, route, and unchanged Hito DS owners, including Calendar specimen lines 233, 257, 298, and 325 outside this task's description edit. Targeted lint, DS validation, and the production build pass. |
| Approved Figma action              | External `Hito Running Library` URL                      | Blocked               | No factual approved URL is present. The Overview states that approval is pending and does not guess from legacy links.                                                                                                                                                                                           |

- **Waiting condition:** Product must provide the exact approved standalone `Hito Running Library`
  URL or dispatch DESIGN SYSTEM INTEGRATION to confirm it. DESIGN SYSTEM can then replace the
  pending notice with one concise `View Figma` action and replay the focused link/static checks.
- **Acceptance boundary:** all repository-owned implementation checks pass, but the task remains
  open and blocked because the required external Figma-link criterion is unavailable. Global QA and
  release readiness are not claimed.

## Superseded Figma-Blocker Handoff Prompt — Historical

```text
ROLE: PRODUCT

Task:
Resolve the only remaining blocker in
docs/tasks/backlog/2026-08-10-hito-ds-showcase-navigation-and-catalog-ia.md.

Boundary:
Confirm the exact approved standalone Hito Running Library URL from factual Product ownership, or
dispatch DESIGN SYSTEM INTEGRATION to confirm that exact URL. Do not guess from legacy hito-running
node links, mutate Figma, or reopen the completed repository implementation.

Next action:
Once the URL is factual, route the same work item back to DESIGN SYSTEM for the one-link insertion
and focused static/browser link verification. The task remains blocked until that criterion passes.
```

## Executed DESIGN SYSTEM Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task:
Implement the high-priority Hito DS Showcase Navigation And Catalog Information Architecture task
defined in docs/tasks/backlog/2026-08-10-hito-ds-showcase-navigation-and-catalog-ia.md.

Stage:
DESIGN SYSTEM implementation / Tracked work, accepted design direction, ready for execution.

Outcome:
Make /hitoDS presentation-ready without creating a new Design System. Preserve the current live
Demo / Variants workbench and canonical component owners. Replace the policy-first Overview with a
grouped live-preview showroom, provide one complete contained App Shell destination, order the
primary catalogue as Overview, App Shell, then source-proven component families A-Z, and move
Foundations, Patterns, Figma export, and necessary governance into a secondary Reference layer.

Required interaction:
A grouped sidebar family is one full-row button containing both label and chevron. It expands and
collapses as one native control, contains addressable child links, auto-expands for the active
destination, and preserves search, no-match, Escape, keyboard, focus-visible, mobile Sheet, and deep
link behavior. Leaf destinations remain full-row links.

Required examples:
Use existing owners to expose a complete App Shell composition, Banner / Notice Surface, grouped
Button composition, interactive and static Data Table headers, and the admitted canonical component
families and children listed in the work item. Do not create a component API merely to match Astryx
terminology or catalogue breadth.

Reuse and boundaries:
Reuse HitoDsPlayground, the current reference routes and search, current Hito DS primitives,
Data Table owners, existing App Shell anatomy, and current validators. Expected new production
runtime artifacts are none by default. Do not change Product AppShell behavior, Product routes,
Backend, persistence, tokens, Figma files, Inspector, or unrelated dirty work. Remove superseded
split-navigation and duplicate reference-only presentation paths after the canonical replacement is
proved.

Figma:
Add one concise View Figma action only after Product or DESIGN SYSTEM INTEGRATION confirms the exact
approved Hito Running Library URL. Do not guess from legacy node links and do not perform Figma
discovery, mutation, mapping, or publication.

Definition of Done:
Complete the full task-level source, build, desktop/narrow, dark/light, pointer/keyboard, search,
deep-link, App Shell, representative workbench, overflow, runtime-health, and focused independent
review inventory defined in the work item. Fix forward within the Design System owner boundary.
Implementation DoD may pass only when every required check passes; do not claim Global QA or release
readiness.

Lifecycle:
Update the canonical work item to in_progress before the first implementation write and to its
truthful terminal or waiting state before the final report. Stop and return the exact owner boundary
if a new primitive decision, Product AppShell change, routing decision, or Figma target conflict is
required.
```

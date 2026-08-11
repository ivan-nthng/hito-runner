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

This task is an information-architecture and reference-surface correction. It is not permission to
create another component library, redesign Hito's visual language, or change Product behavior.

## Stage

DESIGN SYSTEM implementation complete / waiting for the approved Hito Running Library URL.

## Next Recommended Role

product

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

## Accepted Design Decision

The existing Hito DS, product primitives, visual language, and specimen workbench remain canonical.
The implementation should reorganize and expose that truth through four discovery layers:

1. **Overview** — a visual showroom of live, product-proven examples grouped by user meaning.
2. **App Shell** — a complete composed shell reference immediately after Overview.
3. **Components A-Z** — an alphabetical lookup of canonical families and source-proven children.
4. **Reference** — secondary access to Foundations, Patterns, Figma export, and necessary ownership
   notes without letting those notes dominate the showcase.

Overview grouping and sidebar ordering intentionally solve different jobs. Overview may group by
purpose; the sidebar remains alphabetical after App Shell.

## Target Information Architecture

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

## Definition Of Done

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

## Validation Expectations

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

## Exact Handoff Prompt

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

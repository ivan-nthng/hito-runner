# Hito DS Compact Header And Inline Search Composition

## Work Item ID

2026-08-13-hito-ds-compact-header-and-inline-search-composition

## Status

completed

## Type

design-system reference-shell interaction and visual hierarchy

## Priority

high

## Owner

frontend (DS specialization)

## Mode

Tracked

## Depends On

[Hito DS Shared Locale Catalog And Language Menu Contract](2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract.md)

## Supersedes

[Hito DS Header Search And Context Navigation](2026-08-13-hito-ds-header-search-and-context-navigation.md)
for this narrower header hierarchy and search-composition decision only.

## Task

Refine the completed `/hitoDS` header into a compact, low-noise reference header using existing
Hito primitives and tokens. The left side contains only the concise `Hito DS` identity; remove the
redundant `Reference library` and current-page breadcrumb text. The right side uses icon-button
controls, not text-style secondary controls.

The closed Search control is one named icon button. When opened, it must smoothly be replaced in
the same right-side slot by the real controlled search input; there must not be a second Search
button alongside the input. The input retains its leading search icon and an accessible reversible
close/clear path, with outside-click, Escape, pointer, keyboard, focus-return, filtering, and
query-state behavior made coherent through the existing single DS query owner.

Reduce the header height using existing Hito spacing, typography, Button, Input, Icon, motion,
focus, surface, and breakpoint contracts. Do not introduce raw CSS values, new tokens, a second
query state, a parallel header/search component, or a new animation system.

## Source Evidence And Root Cause

- `src/components/hito-ds/reference-page.tsx:113-214` currently renders a multi-line header with
  `Hito DS`, `Reference library`, the page/section breadcrumb, and right-side `secondary`
  controls. Its desktop search renders either a separate trigger or input rather than the newly
  accepted compact presentation.
- `src/components/hito-ds/reference-navigation.tsx:30-214` is the existing DS query/filter/group
  owner and must remain the only query model.
- The previous Header Search task proved the header search behavior and active-location model. Ivan
  has now made a later visual hierarchy decision: only the short Hito DS identity remains on the
  left; header controls are compact icon buttons; search morphs into its own single inline field.
- The active Locale Catalog task may currently write `reference-page.tsx` and shared dropdown
  source. This task must serialize after it rather than absorb, overwrite, or validate concurrent
  work.

## Scope

- Reuse and refine the existing `/hitoDS` reference header and its controlled desktop/mobile query
  composition.
- Remove only the redundant header breadcrumb presentation requested above; preserve canonical page
  identity in navigation, deep links, document content, and accessible labels where needed.
- Reuse the existing shared language/theme menu slot and preserve its active task-owned locale
  composition byte-for-byte unless the completed owner supplies an intentional shared API.
- Make the visual transition reduced-motion-safe and responsive without creating a second mobile
  search or navigation state.

## Explicit Non-Goals

- No locale persistence, Root SSR, `<html lang>`, catalog wording, language-menu implementation,
  profile settings, Product AppShell, Admin, Marketing, DevTools, Figma, Backend, generated
  artifacts, token/primitive changes, Git lifecycle, hosted action, or release work.
- No sidebar information architecture rewrite, search matching change, query index/data change, or
  new responsive breakpoint framework.
- No change to the shared `DropdownMenuRadioItem` check-indicator decision owned by the dependency.

## Definition Of Done

- The header is visibly shorter through existing token-backed composition; it contains only `Hito
DS` on the left and compact accessible icon controls on the right.
- The closed Search trigger becomes the real input in the same slot on open, with no duplicate
  Search trigger. Leading search and existing clear/close affordances remain useful and named.
- Open, typing/filtering, clear/close, outside click, Escape, focus return, theme/language menu
  access, deep links, and mobile browsing all retain one truthful state owner.
- Light/Dark at 1470×801 and exact 375×812 have no clipped controls, horizontal page overflow, or
  browser console regressions.
- The completed locale-menu composition and unrelated dirty hunks are preserved byte-for-byte.

## Validation Inventory

| Check                | Scenario                                                                              | Required result                                         |
| -------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| Source ownership     | Header, desktop/mobile query, Locale task diff                                        | One query owner; no overwrite or duplicate header state |
| Interaction          | Closed/open search, typing, clear/close, outside click, Escape, keyboard focus return | One coherent reversible search flow                     |
| Responsive visual    | `/hitoDS`, Light/Dark, 1470×801 and 375×812                                           | Compact header, valid controls, containment             |
| Preservation         | Navigation matching, groups, deep links, theme/language menu                          | No behavior/data ownership regression                   |
| Static/runtime       | Focused formatting/lint, DS validation, build/runtime when affected, diff hygiene     | Clean task-owned result                                 |
| Independent evidence | QA and/or DESIGNER, read-only and bounded only if materially useful                   | Focused conclusion without a second writer              |

## Serialization Gate

The active Design System item `2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract`
owns overlapping `reference-page.tsx` and shared menu work. Before any task-owned source read,
write, runtime, or validation side effect, the assigned owner must inspect that item's current
thread status and dirty-file ownership. If it is still active or overlapping work is unstable, make
no changes and return the exact overlap to PRODUCT. Resume only after the owner has completed/idle
status and the relevant diff is stable.

## Stage

FRONTEND (DS specialization) implementation and focused acceptance completed.

## Execution Preflight — 2026-08-13

- **Serialization result:** passed. The canonical DESIGN SYSTEM sidebar task completed and became
  idle before this item read or changed task-owned runtime source. Its final dependency item is
  `completed`; `reference-page.tsx`, the shared radio-menu primitive, and the locale receipt were
  re-hashed after handoff and remained stable through ownership mapping.
- **Accepted decision and demonstrated current composition:** the current header still renders
  `Reference library` plus page/section breadcrumbs, keeps a second desktop Search trigger beside
  the open controlled field, omits the field's leading Search icon, and retains a separate
  full-width textual mobile Browse row. The existing shell already owns one `query`, and both
  desktop and mobile `HitoDsNestedNav` consume it.
- **First owner and existing seam:** `src/components/hito-ds/reference-page.tsx` owns the responsive
  header composition. `reference-navigation.tsx` remains the single matching, group-expansion, and
  destination owner and needs no new state or matching change.
- **Smallest behavior change:** keep the shell-owned `query` and current refs; conditionally render
  either the desktop Search icon button or the actual controlled Input in one slot; compose its
  leading Search and trailing clear/close actions from existing Hito field/icon/button classes;
  remove the meta trail; and move the existing mobile Browse Sheet trigger into the same compact
  icon-control row.
- **Reuse:** existing `HitoButton`, `Input`, `Icon`, `DropdownMenu`, `Sheet`, field-icon classes,
  token-backed spacing utilities, and motion-safe animation utilities. No shared playground,
  navigation index, query contract, locale component, theme state, or radio indicator is replaced.
- **New runtime artifacts:** none. No file, component, helper, state owner, CSS rule, token, raw
  value, animation system, breakpoint, route, dependency, persistence path, or compatibility layer
  is proposed.
- **Removed responsibility:** the redundant breadcrumb/meta presentation, duplicate open-state
  Search trigger, and separate textual mobile Browse row are removed. Existing deep-link identity
  stays in navigation, page content, accessible names, and the document route.
- **Preservation boundary:** the completed locale catalog/menu files, shared
  `DropdownMenuRadioItem` check indicator, theme/language behavior, Product/AppShell, Backend,
  Figma, and all unrelated dirty hunks remain byte-for-byte outside this implementation.
- **Stop condition:** return to PRODUCT if the accepted composition requires shared primitive/CSS,
  locale persistence/root SSR, a second query/mobile model, or another implementation owner.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused FRONTEND (DS specialization) Implementation DoD only; not Global QA,
  hosted, release, deployment, or Figma acceptance.
- **Runtime path:** use only the canonical managed loopback `qa_fixture` after task source and this
  receipt settle and status proves healthy, compatible, loopback-bound, and fresh. Do not use an ad
  hoc server or hosted data.
- **Browser path:** use the supported in-app browser selected for
  `http://127.0.0.1:3000/hitoDS`; abandon a prompting/blocked path rather than requesting approval.
- **Matrix:** 1470×801 and exact 375×812 in Light/Dark; closed/open Search, typing/filtering,
  clear/close, empty outside click, two-step Escape, focus return, theme menu, preserved language
  menu reference, direct deep links, mobile Search/Browse Sheet, reduced-motion source contract,
  horizontal containment, and console/runtime health.

## Next Recommended Role

PRODUCT, for lifecycle routing only. No successor implementation is required by this item.

## Consumed Handoff Prompt

```text
ROLE: FRONTEND

Task: Hito DS Compact Header And Inline Search Composition
Mode: Tracked implementation
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-compact-header-and-inline-search-composition.md
Depends on: docs/tasks/backlog/2026-08-13-hito-ds-shared-locale-catalog-and-language-menu-contract.md

You are the FRONTEND (DS specialization) owner. Read AGENTS.md, agents/frontend.agent.md,
skills/hito-frontend-design-system/SKILL.md, this item, the completed Header Search receipt, and
the active Locale task before work. Run the required Tracked preflight and preserve unrelated dirty
work byte-for-byte.

First enforce the Serialization Gate. The active DESIGN SYSTEM locale task may own
`src/components/hito-ds/reference-page.tsx` and shared dropdown/menu source. Inspect its current
sidebar-thread status and dirty-file ownership before any task-owned read, write, runtime, or
validation side effect. If it remains active or the overlap is unstable, make no source/backlog/
runtime changes; report the exact overlap to PRODUCT and wait for a stable completed/idle handoff.

After that gate clears, implement this accepted `/hitoDS` header decision at its existing source
owners. Make the header compact using existing Hito token-backed composition. The left side shows
only `Hito DS`; remove `Reference library` and the current page/section breadcrumb presentation.
On the right use accessible icon-button controls, not textual secondary buttons.

Search has one controlled owner and one visual slot. When closed, show the named Search icon button.
On activation, smoothly replace that button in the same slot with the actual existing controlled
search input, including its leading Search icon and the existing useful clear/close route. Do not
leave a second Search button beside it. Keep filtering, group expansion, clear/close, outside-click,
Escape, pointer/keyboard focus return, deep links, reduced motion, and responsive navigation
truthful through the current query owner. Do not create query state, a header/search component,
raw CSS values, a token, an animation system, or a second mobile model.

Preserve the completed dependency's controlled theme/language menu composition and the canonical
shared radio check indicator. Do not implement locale persistence, root SSR, settings, catalogs,
Product/AppShell, Backend, or Figma work.

You implement all FRONTEND source work yourself. You may use an existing named Hito QA or DESIGNER
role only for a bounded read-only browser or visual review when it materially improves evidence; do
not delegate FRONTEND implementation or introduce a second writer.

Validate source ownership, focused formatting/lint, DS validation, build/runtime where affected,
and `/hitoDS` Light/Dark at 1470×801 and exact 375×812. Cover closed/open Search, typing/filtering,
clear/close, outside click, Escape, focus return, theme/language menu access, deep links, mobile
navigation, overflow, and console health. Update only this canonical item with a truthful English
receipt. Return any cross-owner boundary to PRODUCT. Do not claim Global QA, hosted, release,
deployment, or Figma acceptance.
```

## Tracked Implementation Receipt — 2026-08-13

### Product Outcome And Root Cause

- The accepted compact hierarchy is implemented at the existing reference-shell owner. The header
  is 49px high in the checked desktop and mobile compositions, exposes only `Hito DS` on the left,
  and uses named icon-only Hito Buttons for Search, Browse, and Theme on the responsive surfaces
  where each control applies.
- The demonstrated composition defect was route-local: the header owner retained redundant
  breadcrumb/meta text and, when desktop Search was open, rendered both the controlled field and a
  second visible Search trigger. Mobile Browse also retained a separate textual row. The navigation
  matching model was already correct and was not replaced.
- Desktop Search now conditionally renders either its trigger or the actual controlled Input in one
  slot. The Input reuses the existing leading field-icon contract, named clear/close action,
  shell-owned `query`, and reduced-motion-safe transition utilities.
- The first browser replay exposed a route-local focus-timing defect: the close handler tried to
  focus the Search trigger before conditional rendering had remounted it. The existing trigger ref
  is now focused on the next task after close; no state owner, component, or compatibility path was
  added.

### Files Inspected And Changed

- Changed `src/components/hito-ds/reference-page.tsx`: compact responsive header composition,
  single desktop Search slot, leading Search icon, reversible clear/close behavior, focus return,
  and icon-only mobile Browse trigger.
- Changed this canonical item for preflight, lifecycle, validation inventory, and receipt.
- Inspected but did not change `src/components/hito-ds/reference-navigation.tsx`; it remains the
  sole matching, filtering, group-expansion, and destination owner.
- Re-hashed and preserved the completed Locale dependency owners byte-for-byte after serialization:
  `dropdown-menu.tsx`, `hito-language-menu.tsx`, `ui-locale-messages.ts`,
  `reference-components-structure.tsx`, and the dependency receipt.
- New runtime artifacts, files, components, helpers, state paths, CSS rules, tokens, routes,
  dependencies, persistence, and compatibility layers: none.

### Preserved Boundaries

- Theme and Language menu composition, the shared radio check indicator, the App Shell reference,
  the DS navigation catalog, shared primitives/CSS/tokens, Product/AppShell, Backend, Figma, and all
  unrelated dirty work were not modified by this item.
- Mobile Search and Browse continue to use the same existing Sheet and shell-owned query rather than
  introducing another responsive model.

### Validation Inventory

| Check                    | Scenario / environment                                       | Result                 | Evidence                                                                                                                                                                    |
| ------------------------ | ------------------------------------------------------------ | ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Serialization            | Locale sidebar owner, overlapping files, dependency receipt  | Passed                 | DESIGN SYSTEM completed and became idle before source work; stable dependency hashes were rechecked after implementation.                                                   |
| Source ownership         | `reference-page.tsx` and `reference-navigation.tsx`          | Passed                 | One shell-owned `query`; navigation matching/group ownership unchanged; no parallel header/search component or CSS owner.                                                   |
| Focused static           | Prettier, targeted ESLint, scoped `git diff --check`         | Passed                 | Task-owned source and canonical item are formatted; no lint error or whitespace defect.                                                                                     |
| DS validator             | `npm run validate-hito-ds-components`                        | External failure       | The only assertion is the separate Brand background/favicon specimen contract; no header, Search, navigation, theme, or locale assertion failed.                            |
| Production build/runtime | Canonical managed `qa_fixture`                               | Passed for task source | One uncontended rebuild completed; pid 33346 was managed, compatible, loopback-bound, healthy, fresh, and `receipt_matches` during owner and QA browser proof.              |
| Desktop interaction      | `/hitoDS`, 1470×801, Light/Dark                              | Passed                 | 49px header; one closed Search trigger; one open focused field with leading icon; filtering, clear, close, outside click, two-step Escape, and trigger focus return passed. |
| Mobile interaction       | `/hitoDS`, exact 375×812, Light/Dark                         | Passed                 | Search and Browse icon controls use one full-height Sheet; filtering, two-step Escape, close, navigation, and opener focus return passed.                                   |
| Menus and navigation     | Theme menu, contained App Shell Language menu, direct hashes | Passed                 | Theme choices applied; Language choices remained reachable with Escape focus return; exact Component and Pattern deep links resolved with canonical active state.           |
| Responsive/console       | Both viewports and themes                                    | Passed                 | `clientWidth === scrollWidth`; no clipped header/Sheet controls; zero browser warning or error entries.                                                                     |
| Independent QA           | Existing QA sidebar role, read-only                          | Passed                 | QA independently replayed the focused matrix and reported no in-scope issue.                                                                                                |

### Omitted-Proof Consequences And Residual Boundary

- Repository-wide TypeScript remains red on unrelated existing Product/Backend/Admin diagnostics;
  the touched reference owners produced no diagnostic. This item does not claim a repository-wide
  type gate.
- After the completed fresh browser matrix and tab cleanup, concurrent repository movement made the
  managed artifact stale through the private Admin snapshot digest assertion
  `02bd693c83bee2bdb37783d1ac318b0095fe3ee459357f993a222999fa6de823`. QA did not rebuild or
  mutate runtime. This prevents an end-of-review whole-workspace freshness claim but does not
  invalidate the captured fresh-artifact browser evidence.
- Global QA, hosted, release, deployment, production, and Figma acceptance were not run or claimed.

### Blockers

None for this focused implementation slice. The Brand validator assertion and later Admin snapshot
freshness movement remain outside this task's owner and source boundary.

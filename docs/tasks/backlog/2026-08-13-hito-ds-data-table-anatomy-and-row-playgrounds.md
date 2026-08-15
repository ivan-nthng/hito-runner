# Hito DS Data Table Anatomy And Row Playgrounds

- **Work Item ID:** `2026-08-13-hito-ds-data-table-anatomy-and-row-playgrounds`
- **Status:** `completed`
- **Type:** `Tracked — Design System reference information architecture`
- **Priority:** `P1`
- **Initial owner:** `DESIGNER` (read-only discovery and decision)
- **Implementation owner after approved decision:** `DESIGN SYSTEM`
- **Current execution owner:** `FRONTEND` — Design System reference specialization, per direct
  assignment
- **Stage:** Focused implementation and browser acceptance complete
- **Next recommended role:** `PRODUCT` — review the completed reference slice; any Global QA,
  Figma mapping, or Product adoption remains separate
- **Route:** `/hitoDS/components#data-table`
- **Source request:** Local Inspector batch `a4fb572c-710d-4bf5-8b90-b38fa7ed17f0`, captured 2026-08-13 at 04:01:32, Dark, 1470×801.
- **Archive intent:** Retain as the canonical decision and implementation receipt for Data Table reference anatomy.

## Owner

DESIGN SYSTEM

## Task

Replace the current mixed Data Table reference with two clearly distinct, purposeful playgrounds:

1. **Table headers & controls** — a focused playground for header/toolbar anatomy and its real
   interactive states.
2. **Table rows & values** — a focused playground for data-cell anatomy in a compact 3–4 column
   table, with controls that change the rendered representative rows.

The result must make it immediately clear what a header/control demonstrates and what a row/value
demonstrates. It must retain real Hito component contracts, be usable at desktop and 375px, and
avoid a mock Product table, a second table framework, or unbounded lists of invented variants.

## Product Outcome

The present `/hitoDS/components#data-table` specimen combines interactive/static headers, row
anatomy, state controls, and a two-row generic preview inside one `HitoDsPlayground`. This makes
the relationship between each control and the visible result difficult to understand; the user
reported that the header/data demonstration is a “мешанина”, and that borders, buttons, and
composition do not read as one coherent example.

The desired reference has two named learning goals rather than one overloaded demo:

| Playground             | It explains                             | It must show                                                                                                                                                                                                       |
| ---------------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Headers & controls** | How a table is organized and controlled | static, sortable, active-sort direction, filtered, selection affordance where valid, search/filter/column/action controls where a real current contract exists                                                     |
| **Rows & values**      | How real table values are composed      | identity with avatar/name and a two-line secondary value, email/technical identifier, date/time, status, metric or count, selection checkbox where valid, compact row action, and overflow-menu action where valid |

The actual final family list is a DESIGNER decision. It must be small enough to teach the current
system, but broad enough to cover durable table patterns that a consumer may need. A category that
has no canonical Hito component or safe source-backed behavior may be displayed only as a static
reference decision; it must not create a fake Product workflow or silently establish a new shared
primitive.

## Evidence And Demonstrated Root Cause

### Inspector evidence to preserve

- **Target:** `div.hito-ds-playground`
- **Selector:** `#data-table > div:nth-of-type(2)`
- **Observed:** grid, two children, top padding `32px`; horizontal and vertical gap `22.4px`;
  rendered dimensions `1072px × 560.99px`.
- **Requested scope:** selected Data Table reference only. Do not use this selector as authority to
  alter every `HitoDsPlayground` or every table in Product/Admin.
- **User requirements:** two playgrounds; 3–4 demo columns; right-side controls that visibly change
  the relevant preview; purposeful header and row variants; inspect the weak border/button
  composition rather than retaining it by default.

### Source evidence

`src/components/hito-ds/reference-components-controls.tsx` currently owns one `HitoDsPlayground`
with `id="data-table"`. Its `Demo` and `Variants` panels render the same
`DataTableSpecimenPreview` for interactive header, static header, and row anatomy. The local state
model combines `sortable`, `activeSort`, `sortDirection`, `filtered`, and `staticMode`.

`src/components/hito-ds/specimen-previews.tsx` owns `DataTableSpecimenPreview`. It combines:

- optional `AdminDataTableToolbar` behavior;
- interactive/static headers;
- hard-coded three columns; and
- two generic rows that do not expose distinct cell-anatomy families.

`src/components/admin/AdminOperationalComponents.tsx` is the existing canonical owner for
`AdminDataTableToolbar`, `AdminDataTableColumnHeader`, and `AdminDataTableStaticHeader`. Real
Admin consumer evidence already includes multi-line identity/email, status, numbers, dates, and
table actions. That source is evidence for a bounded reference taxonomy, not permission to modify
Admin routes.

**Demonstrated first incorrect reference owner:** the single combined `data-table`
composition/control model in `reference-components-controls.tsx`, together with its mixed
`DataTableSpecimenPreview` fixture. The shared `HitoDsPlayground` shell is not presumed incorrect.

## Existing Seams To Reuse

1. `HitoDsPlayground` remains the sole Demo/Variants shell.
2. `DataTableSpecimenPreview` is the existing reference-only renderer to refine or split only if
   source proof shows one renderer cannot express two clear teaching responsibilities.
3. `AdminDataTableToolbar`, `AdminDataTableColumnHeader`, and
   `AdminDataTableStaticHeader` remain the header/control contracts.
4. Existing `HitoButton`, `Icon`, checkbox, dropdown/menu, field, status, typography, spacing,
   surface, and responsive table-scroll contracts remain authoritative.
5. The current `reference-workbench.css` stage contract remains intact unless a demonstrated
   table-specific composition cannot use it. Do not reopen the completed global playground-stage
   work merely because this reference changes.

## DESIGNER Discovery And Decision Scope

The first stage is read-only. The DESIGNER must inspect current reference source and representative
live consumers, then record a concrete, limited table taxonomy and visual contract in this item.

Required decisions:

1. Define the exact header/control variants, each with a reason and current source owner.
2. Define the exact row/value variants, each with a reason, semantic cell role, and whether it is
   interactive, static, or unavailable pending a real component contract.
3. Choose the two playground titles, one-sentence purpose text only where it explains the section,
   Demo/Variants anchor labels, and the minimal right-side controls for each playground.
4. Specify the desktop 3–4-column compositions and the 375px presentation: local table scroller,
   priority columns, truncation, and action reachability. Do not rely on horizontal page overflow.
5. Diagnose the screenshot’s border/button concern against computed canonical rules. Preserve
   meaningful table dividers, focus/selection/error states, menu boundaries, and container edges;
   identify only decorative or contradictory chrome for removal or replacement.
6. State whether avatar+name, two-line value, e-mail, date/time, status, metric/count, checkbox,
   button action, and overflow action already have a canonical Hito owner. Any proposed new shared
   primitive or API is a stop condition and returns to PRODUCT with evidence.

The decision must distinguish _anatomy reference_ from _Product capability_: showing a row action
does not add deletion, persistence, bulk editing, avatars, loading, or empty-state behavior to a
live product route.

## Implementation Scope After The Decision

DESIGN SYSTEM implements only the approved decision in the `/hitoDS` reference surface:

- replace the one mixed Data Table playground with the two approved sibling playgrounds;
- give each playground its own local state so a control changes the visible demo in that same
  playground and never changes its tab or the other playground;
- render a real 3–4-column table in the row/value demo from a bounded local reference data set;
- reuse existing semantic tokens and components for tables, header cells, controls, actions,
  feedback, menus, selection, typography, surfaces, spacing, radius, and responsive containment;
- remove superseded mixed controls/branches from the old reference composition when safe.

### Explicit non-goals

- No Product/Admin route changes, backend, persistence, fixture, service data, migration, or API
  work.
- No generic `Table`, `TableRow`, `TableCell`, “table variant registry”, new token, or parallel
  reference framework.
- No fake destructive action, fake bulk selection workflow, or invented dropdown behavior.
- No modification to the global `HitoDsPlayground` shell, its shared gap, or unrelated playgrounds
  unless a source discriminator proves an existing shared contract is the first incorrect owner.
- No Figma mutation. Figma mapping is separate and only after an approved DESIGN SYSTEM INTEGRATION
  handoff.
- Do not remove meaningful borders or buttons solely because they are visible; act only on the
  Designer-approved computed-rule classification.

## Reuse-First Change Budget

- **Existing seam and smallest change:** refine the Data Table composition and its current
  reference preview, using existing table/header/control primitives.
- **New runtime artifacts:** none expected.
- **If a new artifact is proposed:** stop and show why `DataTableSpecimenPreview` or the existing
  canonical owner cannot own the responsibility.
- **Removal/simplification:** the former combined header/row controls and stale branches must be
  deleted or collapsed into one of the two clear playground responsibilities. The implementation
  receipt must name the removed path or explain why it is temporarily retained.

## Acceptance Criteria

### Information architecture

1. `/hitoDS/components#data-table` renders exactly two separately titled Data Table playgrounds:
   one header/control reference and one row/value reference.
2. A reader can identify each playground’s purpose without reading implementation prose.
3. Each Demo uses 3–4 purposeful columns. The row/value playground includes only DESIGNER-approved
   cell families and identifies the relationship between its controls and visible cells.

### Interaction and accessibility

1. A header/control choice updates only the header/control preview.
2. A row/value choice updates only the row/value preview.
3. A choice must not activate `Variants`, change a hash unexpectedly, or select a different
   playground tab.
4. Sort/filter/menu/checkbox/action examples use existing keyboard and focus contracts; an action
   that is static is not presented as a working destructive Product mutation.
5. Desktop and 375px retain local table-scroll containment where required; page-level horizontal
   overflow is zero.

### Visual and source contracts

1. Every spacing, radius, foreground, fill, border, focus, and state decision uses an existing
   canonical Hito token/component contract or is listed as an approved structural exception.
2. The final reference does not recreate headers, buttons, controls, or menus with route-local CSS
   recipes.
3. No decorative border/button treatment remains without an identified meaning.
4. Existing Data Table consumers retain their source/API behavior.

### Validation inventory

| Check                | Required evidence                                                                                                                             |
| -------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Source discriminator | The prior mixed single-playground branches are removed/replaced; each new playground has independent state and maps controls to its own demo. |
| Static               | Prettier, focused ESLint, DS validator, and `git diff --check`.                                                                               |
| Browser              | `/hitoDS/components#data-table` at 1470×801 and exact 375×812 in Dark and Light.                                                              |
| Interaction          | Demo/Variants navigation, each right-side control, sort/menu/checkbox/action case when approved, keyboard focus/Escape where applicable.      |
| Layout/health        | No page horizontal overflow; table overflow stays locally owned; no console errors.                                                           |
| Independent review   | DESIGNER confirms approved taxonomy/visual decision; QA performs a bounded final browser review when the implementation risk warrants it.     |

## Stages And Ownership

1. **Design discovery — DESIGNER, read-only.** Produce the bounded taxonomy and computed-rule
   border/button decision above. Return the decision, source evidence, exclusions, and any Product
   decision required. Do not edit runtime source.
2. **Implementation — DESIGN SYSTEM.** Begins only after Product accepts the discovery decision.
   Reuse the named canonical seams and keep `/hitoDS` production-source edits in DESIGN SYSTEM.
3. **Focused acceptance — QA.** Begins after implementation receipt and validates the matrix above.

## Exact Future Handoff Prompt — DESIGNER

```text
ROLE: DESIGNER

Task: Hito DS Data Table Anatomy And Row Playgrounds
Mode: Tracked — read-only Design System discovery
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-data-table-anatomy-and-row-playgrounds.md

Read AGENTS.md, agents/designer.agent.md, and skills/hito-frontend-design-system/SKILL.md before work.

Goal:
Turn the currently mixed /hitoDS/components#data-table reference into an approved, bounded design
decision for two sibling playgrounds: Headers & controls and Rows & values. Do not implement.

Inspect only the demonstrated owners and representative current consumers:
- src/components/hito-ds/reference-components-controls.tsx
- src/components/hito-ds/specimen-previews.tsx
- src/components/admin/AdminOperationalComponents.tsx
- representative read-only Admin table consumers and the existing canonical table CSS/token owners

Return in the canonical item:
1. the exact small header/control and row/value taxonomy, with a reason and source owner per item;
2. each playground’s titles, purpose, 3–4 columns, Demo/Variants anchors, and minimum controls;
3. responsive 375px and keyboard/menu/action principles;
4. computed-rule classification of the reported borders/buttons: preserve, replace, or remove;
5. a strict list of existing components/tokens to reuse, explicit exclusions, and any real stop
   condition.

Constraints:
- Read-only: do not alter runtime source, CSS, validators, manifests, Product/Admin routes, Figma,
  fixtures, or provider state.
- Do not invent a generic table component, registry, token, fake product behavior, deletion flow,
  or unbounded variant catalogue.
- The shared HitoDsPlayground shell is not in scope unless evidence proves it is the first incorrect
  owner.
- Preserve all concurrent dirty work byte-for-byte.

Return condition:
Write only the task-owned discovery/decision update, validate its formatting and diff hygiene, and
return the exact later DESIGN SYSTEM implementation boundary to PRODUCT.
```

## Current State And Blockers

The directly assigned Frontend Design System reference slice is complete. No task-owned blocker
remains. No Figma, Product/Admin route, shared primitive/CSS, fixture, persistence, provider, or
hosted work was performed.

## Current Frontend Execution Preflight — 2026-08-13

- **Demonstrated cause:** `reference-components-controls.tsx` owns one mixed Data Table playground
  and one combined boolean state model. `specimen-previews.tsx` then mixes toolbar/header behavior
  with generic rows in the same preview. Controls therefore do not teach one clear visible result.
  `HitoDsPlayground` is not the incorrect owner.
- **Existing seams reused:** `HitoDsPlayground`, `DataTableSpecimenPreview`,
  `AdminDataTableToolbar`, `AdminDataTableColumnHeader`, `AdminDataTableStaticHeader`, `Avatar`,
  Hito Button/Icon/DropdownMenu, status pill, typography, semantic surfaces, spacing/radius, focus,
  and `hito-data-table-scroll`.
- **Smallest implementation:** replace the single `#data-table` composition with two sibling
  playgrounds backed by explicit header and row preview modes, each with its own local state.
- **New runtime artifacts:** none. No file, shared primitive, token, CSS recipe, registry, data
  path, or compatibility layer is proposed.
- **Removed/simplified path:** delete the combined sortable/active-sort/direction/filtered/static
  control model, its generic mixed rows, and the decorative route-local variant dividers. Update
  existing `/hitoDS` preview consumers to the explicit preview API so the old mixed source of truth
  does not remain active.
- **Focused proof:** source reachability, Prettier, focused ESLint, DS validator,
  `git diff --check`, then `/hitoDS/components#data-table` at 1470×801 and 375×812 in Light/Dark,
  including independent controls, Demo/Variants, keyboard/menu Escape, local-only table overflow,
  hash stability, and console health.
- **Stop boundary:** return to PRODUCT if table-level selection semantics, sticky/responsive table
  API, a new shared cell/action abstraction, or shared primitive/CSS changes become necessary.

## DESIGNER Read-Only Decision — 2026-08-13

- **Headers & controls:** static label (`AdminDataTableStaticHeader`); sortable idle, active sort
  ascending/descending, and filtered (`AdminDataTableColumnHeader`); search, filter summary/menu,
  active-filter removal, and row count (`AdminDataTableToolbar`). The right-side controls are one
  `Header state` choice and one `Show toolbar` toggle.
- **Rows & values:** Facts uses four columns — Runner (Avatar, name, technical email secondary),
  Last activity (date/time), Workouts (tabular count), Status (existing pill). Actions uses three
  columns — Record (two-line identity), Quick action (compact Hito Button with local explanatory
  disclosure only), and More (existing overflow menu with non-destructive reference actions). The
  right-side control is one `Row view` choice.
- **Selection:** excluded. The checkbox primitive exists, but no inspected table consumer owns
  select-all or row-selection semantics; inventing them would create a new contract.
- **Variants:** Headers compares static, sortable-idle, active-sort, and filtered header states.
  Rows compares two-line, technical, date/time, and status/metric value anatomy without duplicating
  the action view.
- **Responsive:** preserve 3–4 columns in `hito-data-table-scroll`, identity first and actions last;
  reuse existing truncation/nowrap/code-width behavior and keep actions reachable by local scroll.
  Do not add sticky columns or card collapse.
- **Chrome:** preserve row semantic surfaces/radii, meaningful header and menu states, focus rings,
  filter dot, `aria-sort`, field boundary, status/menu borders, and playground stage chrome. Remove
  only the old route-local `border-t border-hairline` wrappers between mixed Variants. Do not edit
  canonical Button/menu/table CSS.
- **Mutation confirmation:** DESIGNER made no source, task, lifecycle, fixture, runtime, Figma, or
  Git mutation.

## Tracked Frontend Implementation Receipt — 2026-08-13

### Outcome and demonstrated cause

The mixed `Data table` reference was replaced by exactly two sibling playgrounds:
`Headers & controls` and `Rows & values`. The demonstrated cause was the combined boolean control
model in `reference-components-controls.tsx` and the preview that mixed toolbar/header behavior
with generic row content in `specimen-previews.tsx`. The shared `HitoDsPlayground`, Admin header
owners, table CSS, and Design System tokens were not incorrect and remain unchanged.

The initial browser discriminator also found stale route-local Components navigation entries for
the removed mixed anchors. The existing `reference-model.ts` owner now exposes the two factual
playground destinations and no longer advertises the obsolete interactive-header, row-anatomy, or
static-header hashes.

### Files changed

- `src/components/hito-ds/reference-components-controls.tsx` — owns the two sibling playgrounds
  and their independent header and row local state.
- `src/components/hito-ds/specimen-previews.tsx` — owns explicit header and row compositions using
  existing Admin headers/toolbar, Avatar, Hito Button, DropdownMenu, status, typography, and table
  scroll contracts.
- `src/components/hito-ds/reference-model.ts` — replaces stale mixed Data Table navigation with
  `Headers & controls` and `Rows & values` destinations.
- `src/components/hito-ds/reference-patterns-page.tsx` and
  `src/components/hito-ds/reference-overview-page.tsx` — adopt the explicit preview API without
  changing their route meaning.
- This canonical item — preflight, Designer decision, lifecycle, validation, and receipt only.

### Reuse and net simplification

- **New production runtime artifacts:** none.
- Removed the former sortable/active-sort/direction/filtered/static boolean state family, generic
  mixed rows, duplicated decorative Variants dividers, and stale navigation anchors.
- Selection remains intentionally absent because no current table consumer establishes row or
  select-all semantics. No fake delete, persistence, bulk edit, loading, or Product workflow was
  introduced.
- The bounded row actions update only a local explanatory live region; they explicitly state that
  no Product data changed.

### Validation

| Check                    | Scenario / environment                   | Result | Evidence                                                                                                                                                                       |
| ------------------------ | ---------------------------------------- | ------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source discriminator     | Task-owned `/hitoDS` sources             | Passed | Exactly two playground owners exist; old combined state and obsolete Data Table hashes have zero reachability in `src/components/hito-ds`                                      |
| Designer decision        | Read-only `DESIGNER` review              | Passed | Approved header/row taxonomy, local-scroll behavior, meaningful chrome preservation, selection exclusion, and no shared CSS/API change                                         |
| Prettier                 | Five changed TSX/TS files and this item  | Passed | `npx prettier --check ...`                                                                                                                                                     |
| Focused ESLint           | Five changed TSX/TS files                | Passed | `npx eslint ...`                                                                                                                                                               |
| Diff hygiene             | Checkout                                 | Passed | `git diff --check`                                                                                                                                                             |
| Production build/runtime | Managed `qa_fixture`, loopback           | Passed | Fresh `vite build`/postbuild completed; server current and healthy at `127.0.0.1:3000`                                                                                         |
| Playground IA            | `/hitoDS/components#data-table`          | Passed | Exactly two headings and navigation entries: `Headers & controls` and `Rows & values`                                                                                          |
| Header controls          | 1470×801, Light/Dark                     | Passed | Static, Sortable, Sorted ascending, Sorted descending, Filtered, and toolbar On/Off each updated only the header preview; hash and Rows state stayed unchanged                 |
| Row controls             | 1470×801, Light/Dark                     | Passed | Facts/Actions and Demo/Variants updated only the row playground; four factual value families and bounded actions remained distinct                                             |
| Keyboard and focus       | Header menu, row overflow, both tablists | Passed | Arrow-key tab/radio operation worked; Escape closed each menu and returned focus to its named trigger                                                                          |
| Responsive containment   | Exact 375×812, Light/Dark                | Passed | Page width remained `375/375`; `860px` tables remained inside `271–288px` local `overflow-x:auto` scrollers; action column remained reachable by local scroll                  |
| Browser health           | Full focused matrix                      | Passed | No console errors or warnings and no page horizontal overflow                                                                                                                  |
| Independent QA           | Read-only `QA` replay                    | Passed | Reconfirmed both playgrounds, all controls, tab/hash isolation, menu Escape/focus return, honest local actions, four viewport/theme combinations, overflow, and console health |

### Omitted or externally blocked proof

- The Hito DS validator was run but stops on the unrelated concurrent Brand/favicon assertion:
  `Brand background samples must own one truthful on-light and one on-dark tone while the favicon specimen reuses the canonical asset directly.`
  No Data Table validator failure was reported, and this task did not modify Brand owners.
- Checkout-wide `tsc --noEmit` remains red across unrelated dirty work. Filtering its output to the
  task-owned files found only the pre-existing `SelectionControlPreview` error at
  `specimen-previews.tsx:733`, which is present in `HEAD` and outside the Data Table diff.
- No physical assistive-technology session was run. Browser semantic roles, accessible names,
  `aria-sort`, keyboard behavior, Escape, and focus return were verified.

### Boundaries, next owner, and acceptance

All Product/Admin behavior, shared table/Button/menu primitives and CSS, Backend, APIs,
persistence, fixtures/data, providers, Figma, hosted state, and Git lifecycle remained unchanged.
The managed `qa_fixture` server was left running. Implementation DoD and bounded QA review passed;
Global QA, Figma parity, release readiness, hosted parity, and deployment are not claimed.

**Next owner:** PRODUCT for review of this completed reference slice and any separately authorized
successor.

**Blockers:** none within this task.

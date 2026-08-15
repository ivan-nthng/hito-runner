# Hito DS Data Table Four-Part Reference IA

## Work Item ID

2026-08-13-hito-ds-data-table-four-part-reference-ia

## Status

completed

## Type

design-system reference information-architecture replacement

## Priority

high

## Owner

frontend (DS)

## Mode

Tracked

## Supersedes

2026-08-13-hito-ds-data-table-anatomy-and-row-playgrounds

## Scope

Replace only the completed two-playground Data Table teaching composition at
`/hitoDS/components#data-table` with a four-part reference IA: Headers, Controls, Rows & values,
and Table. Preserve the earlier completed task as historical evidence; this item owns the new
reference responsibility and does not modify Product/Admin consumers, shared table primitives, or
global playground behavior without a demonstrated first-owner cause.

## Product Outcome

The reference should make it obvious where to look and what is being demonstrated. It must no
longer combine table anatomy, controls, full-table integration, and variants in the same visual
field.

| Reference subject | Teaching responsibility                                                  | Required views                                                                        |
| ----------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| **Headers**       | One table header and its states                                          | Demo, Sandbox, Variants                                                               |
| **Controls**      | Search, filters, sort/filter summary, and other current toolbar controls | Demo and Variants; add Sandbox only if it teaches a distinct real control interaction |
| **Rows & values** | Body-cell anatomy and value composition                                  | Demo and Variants; no Sandbox unless a demonstrated row interaction needs it          |
| **Table**         | A complete composed table                                                | Dedicated full-table Sandbox and comprehensive table Variants                         |

### Headers

- **Demo** shows one isolated header in the visual center. A compact local state selector changes
  only that header's visible state; it must not navigate to `Variants` or alter another subject.
- **Sandbox** removes the separate right properties panel. It shows one live, contained table
  context where users can click a header and use relevant current search/filter controls to observe
  actual behavior.
- **Variants** presents all approved header states together for visual comparison.

### Controls

Search and filters are their own reference subject rather than header decoration. Use only existing
Hito control contracts and actual current table-toolbar behavior. The reference must not imply that
every filter/action exists in a live Product table.

### Rows & values

- **Demo** shows the bounded row/body composition without a visually competing table header.
  If retaining a semantic table requires hidden headings, preserve accessible table semantics while
  removing the visual header as requested.
- Retain the existing local `hito-data-table-scroll` containment: horizontal overflow belongs to
  the scroll container, never the page canvas.
- **Variants** compares all approved value families; it does not repeat headers, toolbar controls,
  or a fake full-table workflow.

### Table

The full Table subject is where header, controls, values, local horizontal scrolling, selection or
actions only when already canonical, and responsive table composition can be tried together. It has
its own dedicated Sandbox. Its Variants view is the one place to compare complete table
compositions; do not duplicate every partial cell/header example there.

## Presentation Rules

- Remove explanatory descriptions and generic instructional paragraphs from this Data Table
  reference. Retain only truthful labels, column names, state names, control names, accessible
  names, and the minimal line of available variants needed to operate/understand the current view.
- A Sandbox fills its useful reference area. It does not carry a detached right-side property panel;
  live controls belong within the demonstrated table/toolbar composition.
- Demo/Variants/Sandbox must each have a distinct teaching purpose. Do not render an empty or
  duplicate tab merely for uniformity.
- Preserve meaningful table boundaries, field/menu edges, focus rings, semantic status chrome,
  action reachability, and local scroll containment. Do not remove borders as a blanket visual
  cleanup.
- All geometry, color, motion, typography, focus, and responsive behavior must reuse existing
  Hito primitives/tokens. No route-local table CSS recipe, new token, generic table framework, or
  mock Product capability is permitted.

## Source Facts

- The superseded completed task established two sibling compositions in
  `src/components/hito-ds/reference-components-controls.tsx`: `Headers & controls` and `Rows &
values`.
- `src/components/hito-ds/specimen-previews.tsx` owns the current bounded header, toolbar, row,
  cell, and local `hito-data-table-scroll` reference compositions.
- `src/components/hito-ds/reference-model.ts` owns the related navigation destinations and must not
  retain stale anchors after the new IA is introduced.
- `AdminDataTableToolbar`, `AdminDataTableColumnHeader`, and
  `AdminDataTableStaticHeader` remain the evidence-backed table control/header owners. They are not
  permission to change Admin behavior or to present fake destructive workflows.
- The former task proved that page-level horizontal overflow is zero when tables use their local
  scroll container. That containment remains an explicit preserved contract.

## Demonstrated Root Cause

The current reference separates headers and rows, but it still makes the reader split attention
between a central preview, a right-side control panel, a nested `Demo / Variants` model, and
combined teaching responsibilities. This is a reference information-architecture problem in the
Data Table composition, not a defect in shared `HitoDsPlayground`, Product tables, Admin table
contracts, or the browser scroll model.

## Required Preflight And Implementation Boundaries

- Inspect the current Data Table source and rendered reference before editing. Record the exact
  files/branches that will be removed or recomposed; preserve unrelated concurrent work.
- Reuse the existing `HitoDsPlayground`, tab semantics, Data Table preview owners, Hito Button,
  Input, Icon, DropdownMenu, field, status, focus, table, and responsive-scroll contracts before
  proposing any artifact.
- Do not change global Demo/Variants/Sandbox behavior for every DS component. Any shared-tab shell
  change requires its own demonstrated first-owner discriminator and a separate Product decision.
- Do not invent selection, bulk actions, deletion, profile records, data fetching, or persistence.
  A static/clickable reference action must be truthfully local and non-mutating.
- If the desired four-part composition cannot be expressed by the current reference seams without a
  new shared abstraction, return to PRODUCT with evidence instead of adding it.

## Acceptance Evidence

| Check                        | Expected outcome                                                                                                                                                                         |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Information architecture     | Exactly four clear Data Table subjects: Headers, Controls, Rows & values, and Table. Stale two-subject anchors and labels are gone.                                                      |
| Headers                      | Demo has one centered header with local state selection; Sandbox has integrated live header/filter behavior and no detached right panel; Variants compares approved header states.       |
| Controls                     | Search/filter/toolbar teaching is separate from header and row anatomy and only shows canonical controls.                                                                                |
| Rows                         | Demo foregrounds row/value anatomy with no visible header distraction; semantic table/accessibility and local horizontal scroll remain truthful.                                         |
| Table                        | One dedicated full-table Sandbox composes current headers, controls, values, responsive scrolling, and only approved local interactions. Variants compare complete table configurations. |
| Presentation                 | Descriptions are removed; remaining labels are factual; tabs never switch unexpectedly; no duplicate or empty teaching view exists.                                                      |
| Responsive and accessibility | Desktop and exact 375×812 in Dark/Light maintain local horizontal overflow, keyboard focus/escape, accessible names and table semantics, no page overflow, and no console errors.        |
| Preservation                 | Product/Admin source behavior, shared primitives/CSS, persistence, fixtures, Backend, Figma, and unrelated `/hitoDS` references remain unchanged.                                        |

## Validation Expectations

Run a source discriminator proving the old two-subject composition and stale navigation anchors are
removed or deliberately superseded; Prettier, focused ESLint, DS validator, `git diff --check`,
production build when runtime source changes, and fresh browser replay at 1470×801 and exact
375×812 in Dark/Light. Exercise every rendered view, header state, actual Sandbox behavior,
search/filter interaction, tab isolation, keyboard focus/Escape, local scroll, deep links, and
console health. Use an independent read-only QA review if it materially improves confidence.

## Stage

FRONTEND (DS) implementation completed; focused acceptance passed.

## Next Recommended Role

product

## Execution Preflight

- **Accepted outcome:** replace the rendered two-subject Data Table reference with four factual,
  independently addressable subjects: Headers, Controls, Rows & values, and Table.
- **Demonstrated current state:** the fresh managed `qa_fixture` render at
  `/hitoDS/components#data-table` exposed `Headers & controls` and `Rows & values`; both used a
  detached details panel, the rows Demo rendered visible headers, and navigation still exposed the
  two-subject model plus `data-table-toolbar`, `data-table-header-states`,
  `data-table-row-actions`, and `data-table-row-values` example anchors.
- **First incorrect owner:** the route-local Data Table composition in
  `reference-components-controls.tsx`, `specimen-previews.tsx`, and `reference-model.ts`. The
  shared `HitoDsPlayground` and Admin table components are not defective and remain unchanged.
- **Existing seam and smallest change:** reuse `useHitoTabs`, the current playground classes, the
  current Data Table specimen owner, and `AdminDataTableToolbar` /
  `AdminDataTableColumnHeader` / `AdminDataTableStaticHeader` in one local four-subject renderer.
  The fixed two-tab global playground API is not widened; the route-local composition owns only
  the accepted subject modes.
- **New runtime artifacts:** none. No file, CSS rule, token, primitive, route, dependency,
  fixture, registry, shared abstraction, or persistence path is added.
- **Removed responsibility:** delete the two obsolete Data Table playground branches, their
  detached control panels/descriptive prose/stale anchors, and the single cross-subject preview
  switch after the four explicit specimen owners replace them.
- **Preservation boundary:** Product/Admin table behavior, shared primitives/CSS, global
  playground behavior, Backend, persistence, fixtures, Figma, and all unrelated dirty hunks remain
  byte-for-byte outside this implementation.
- **Focused proof:** source discriminators; Prettier; focused ESLint; DS validator;
  `git diff --check`; one uncontended production build; then fresh managed `qa_fixture` browser
  replay at 1470×801 and exact 375×812 in Light/Dark covering every subject mode, local state,
  search/filter/sort, keyboard/focus/Escape, deep links, local scroll containment, page overflow,
  and console health.
- **Open condition:** return to PRODUCT without expanding if the four-part composition needs a
  shared playground API/CSS change, a Product/Admin behavior change, or an invented data-table
  capability.

## Handoff Status

Returned to PRODUCT after the assigned FRONTEND (DS) implementation and focused acceptance. No
cross-owner implementation successor is required.

## Implementation Receipt

### Product Outcome

The former two-subject Data Table reference is replaced by four separately addressable subjects:

| Subject       | Implemented views       | Teaching boundary                                     |
| ------------- | ----------------------- | ----------------------------------------------------- |
| Headers       | Demo, Sandbox, Variants | One header, real integrated behavior, five states     |
| Controls      | Demo, Variants          | Existing search/filter toolbar contracts only         |
| Rows & values | Demo, Variants          | Body/cell anatomy with semantic hidden headings       |
| Table         | Sandbox, Variants       | Complete interactive and read-only table compositions |

Every rendered mode contains a distinct, working specimen. The reference contains no detached
properties panel, explanatory prose, empty compatibility tab, or invented Product capability.

### Root Cause And Resolution

The first incorrect owner was the route-local Data Table reference composition: it coupled two
teaching subjects to a fixed preview/details layout and a cross-subject preview switch. The shared
playground, Admin table primitives, and responsive scroll contract were not defective.

The resolution keeps the accepted behavior local to the existing reference seams. It reuses
`useHitoTabs`, current playground presentation classes, `AdminDataTableToolbar`,
`AdminDataTableColumnHeader`, `AdminDataTableStaticHeader`, Hito controls, and
`hito-data-table-scroll`. The obsolete two-subject branches, detached panels, descriptions, stale
Component anchors, and cross-subject specimen switch were removed. No shared playground API or CSS
was changed.

### Files Changed

- `src/components/hito-ds/reference-components-controls.tsx` — owns the four subjects and their
  exact mode sets.
- `src/components/hito-ds/specimen-previews.tsx` — owns the focused header, controls, rows, and
  full-table specimens using existing table contracts.
- `src/components/hito-ds/reference-model.ts` — exposes the four current Component destinations and
  removes the superseded Component anchors.
- This canonical item — records the preflight, implementation, proof, and lifecycle result.

The narrow `DataTableSpecimenPreview` header adapter remains because Overview and Patterns still
consume it at runtime. It no longer owns the four-subject switch. No file, route, dependency,
token, primitive, CSS recipe, fixture, framework, registry, persistence path, or other runtime
artifact was added.

### Demonstrated Behavior

- Headers Demo changes one centered header through its local five-state selector.
- Headers Sandbox performs real local search, filter, sort, and row-action interactions without a
  complementary side panel.
- Controls contains the toolbar contract and renders no table.
- Rows & values uses semantic `thead.sr-only` headings, keeps body/value anatomy visible, and keeps
  horizontal overflow inside `hito-data-table-scroll`.
- Table owns the full interactive Sandbox plus interactive and read-only complete variants.
- Arrow keys, Home/End, Enter, Escape, focus restoration, direct deep links, active-location state,
  Light/Dark themes, and local responsive scrolling remain functional.

### Validation Inventory

| Check                           | Scenario / environment                                             | Result                   | Evidence                                                                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------ | ------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline discriminator          | Fresh pre-change managed `qa_fixture`                              | Passed                   | Confirmed two old subjects, detached details panels, visible row headers, and stale Component anchors before editing.                                                                                             |
| Source discriminator            | Three task-owned reference files                                   | Passed                   | Exactly four subjects and nine non-empty modes; old two-subject labels/branches and superseded Component anchors are absent; two semantic hidden-heading owners remain.                                           |
| Formatting and lint             | Prettier plus focused ESLint                                       | Passed                   | Task source and canonical item format clean; focused ESLint reports zero errors.                                                                                                                                  |
| Diff hygiene                    | Scoped and repository `git diff --check`                           | Passed                   | No whitespace errors introduced.                                                                                                                                                                                  |
| DS validator                    | `npm run validate-hito-ds-components`                              | Not passed outside scope | The only failure is the concurrent Brand/favicon assertion; no Data Table assertion failed and the validator was not changed for this task.                                                                       |
| TypeScript                      | Repository `npx tsc --noEmit` plus touched-symbol filter           | Not passed outside scope | The repository has existing unrelated diagnostics; no Data Table symbol diagnostic was found. A separate Selection Controls diagnostic remains in the already-dirty specimen file.                                |
| Production build                | Two uncontended canonical builds                                   | Passed                   | Client, SSR, Nitro, and postbuild stages completed successfully.                                                                                                                                                  |
| Focused browser proof           | Managed fresh `qa_fixture`; 1470×801 and exact 375×812; Light/Dark | Passed                   | All subjects/modes, five header states, search/filter/sort/action behavior, tabs, keyboard/focus/Escape, direct links, local scroll, page containment, and console health passed.                                 |
| Independent QA                  | Existing named QA role, read-only                                  | Passed                   | Replayed the four-part IA and all nine modes, state/control interactions, semantic headings, keyboard behavior, deep links, both themes/viewports, local scroll, and zero warning/error console events.           |
| Final whole-workspace freshness | Managed runtime after browser proof                                | Not claimed              | A concurrent backlog write changed the private Admin snapshot digest after the fresh proof; this does not invalidate the captured Data Table replay but prevents a final repository-wide `receipt_matches` claim. |

### Omitted-Proof Consequence

The task does not claim Global QA, hosted behavior, release readiness, deployment readiness, Figma
parity, or final whole-workspace managed-runtime freshness. The focused Data Table implementation
and independent browser acceptance are complete; repository-wide validator/TypeScript failures and
the later Admin snapshot digest movement remain outside this owner and scope.

### Next Owner And Blockers

- **Next owner:** PRODUCT for lifecycle integration only.
- **Blockers:** none for this completed FRONTEND (DS) slice.
- **Independent reviewer:** QA, read-only; no source or runtime lifecycle mutation.

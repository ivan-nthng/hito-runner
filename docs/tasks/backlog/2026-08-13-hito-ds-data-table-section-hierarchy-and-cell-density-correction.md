# Hito DS Data Table Section Hierarchy And Cell Density Correction

## Work Item ID

`2026-08-13-hito-ds-data-table-section-hierarchy-and-cell-density-correction`

## Status

`completed`

## Type

Tracked — Design System reference IA, density, and interaction correction

## Priority

P1

## Owner

DESIGN SYSTEM

## Stage

Completed — current source already satisfies the accepted Headers Demo centering correction; no redundant source edit was required.

## Next Recommended Role

PRODUCT for any later Global QA or Product/Admin table decision.

## Evidence From

- `2026-08-13-hito-ds-data-table-anatomy-and-row-playgrounds`
- `2026-08-13-hito-ds-data-table-four-part-reference-ia`
- Ivan's review of `/hitoDS/components#data-table`, 2026-08-13

## Supersedes

`2026-08-13-hito-ds-data-table-four-part-reference-ia` for the Data Table reference hierarchy, right-panel interaction model, row demo composition, and table-density presentation. The earlier item remains the historical record of the first successful Data Table separation and its evidence.

## Route And Scope

`/hitoDS/components#data-table`

Correct only the Hito DS reference seams:

- `src/components/hito-ds/reference-components-controls.tsx`
- `src/components/hito-ds/specimen-previews.tsx`
- `src/components/hito-ds/reference-model.ts` only if navigation/metadata must change to match the accepted hierarchy.

Product/Admin table routes, data, persistence, APIs, fixtures, Figma, global playground behaviour, and unrelated reference sections are preserved. A shared table-cell owner may be changed only if preflight proves it is the first incorrect owner, and only after preserving its consumer default.

## Product Outcome

The page reads as a single **Tables** section, not four competing component sections. It starts with one large `Tables` heading and a short factual description. Inside that family are smaller headings:

1. `Headers`
2. `Controls`
3. `Rows & values`
4. `Table`

The next large page heading remains `Inputs`.

| Subject       | Teaching responsibility                            | Required presentation                                                                                                           |
| ------------- | -------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Headers       | One clear header and its actual states             | Central Demo has one header. Header-state controls belong to the normal right property panel. Variants compare approved states. |
| Controls      | Current search/filter/sort/column/action contracts | Separate reference using only existing toolbar behaviour.                                                                       |
| Rows & values | Cell and row anatomy                               | Directly show approved value families. No artificial `Row view`, `Facts`, or `Actions` switch.                                  |
| Table         | Coherent whole-table composition                   | One sandbox composes an actual existing toolbar, headers, values, and locally owned scroll. No generic facts/actions choice.    |

## Demonstrated Root Cause

The preceding four-part replacement correctly separated concepts but rendered all four as equal `DataTableReferenceSubject` blocks, breaking the intended section hierarchy. It also retains two misplaced interaction models:

- `DataTableHeadersReference` puts `Header state` in the central Demo as a `ChoiceSelector` rather than the shared right configuration panel.
- `DataTableRowsReference` puts `Row view` into the central stage and passes a fake `facts` / `actions` condition to its preview.

In `specimen-previews.tsx`, the email is treated with a specialised code/container recipe where this reference needs plain subdued technical/secondary text. Current cell geometry looks oversized, but the canonical cell owner must be demonstrated before it is edited.

**First incorrect owner:** the route-local Data Table reference composition and preview branches. `HitoDsPlayground`, Admin tables, and global table CSS are not presumed incorrect without proof.

## Reuse-First Contract

Reuse the current `HitoDsPlayground` tab and property-panel contract, current Data Table reference renderer, `AdminDataTableToolbar`, `AdminDataTableColumnHeader`, `AdminDataTableStaticHeader`, plus established Hito table/scroll, field, Icon, Button, Menu, Checkbox, status, typography, surface, spacing, radius, focus, and responsive primitives.

No arbitrary pixels, local CSS recipe, new token, component family, `Table` framework, registry, mock workflow, dependency, fixture, or persistence path is permitted.

## Required Work

### Hierarchy

- Restore `Tables` as one large title with one concise description.
- Make Headers, Controls, Rows & values, and Table internal, smaller headings; they must not read as four equal page-level components.
- Remap or remove stale deep links/metadata rather than leaving links to retired structures.

### Headers

- Show one centered, legible header in Demo.
- Put Header state in the ordinary right property panel. A change updates only that demo and must not switch tabs, mutate another subject, or alter the hash unexpectedly.
- Keep Sandbox/Variants only if each has a distinct factual teaching purpose; remove redundant modes rather than retaining uniform empty structures.

### Rows & values

- Delete the `Row view`, `Facts`, and `Actions` chooser and its conditional branch.
- Directly show the approved identity, email/technical identifier, date/time, status, metric/count, checkbox and/or local action anatomy only where an existing canonical source contract exists.
- Render `mara@hito.test` as plain secondary/technical text: never as a badge, boxed sub-surface, or decorative container. Keep name/avatar only where it teaches an identity cell.
- Preserve semantic table/caption/header accessibility even if visual column headers are omitted.

### Cell density

- Inspect existing table-cell owners and all current size seams first.
- Establish a small, token-backed set of referenceable densities only where an existing Hito contract can own it. Reuse spacing, type, line-height, hit-target, and radius contracts.
- Preserve the default for existing Admin/Product consumers. If shared geometry is demonstrated as the cause, repair it at that owner and validate known consumers. Otherwise keep the correction bounded to the reference.
- If the task needs a new shared table API, token, primitive, or cross-owner Product/Admin change, stop and return the evidence to PRODUCT.

### Full Table sandbox

- Compose true existing search/filter/sort/selection/menu contracts in one 3–4-column table.
- Keep those controls in the table/toolbar itself. Do not place a generic facts/actions switch or a detached fake control panel in this sandbox.
- Wide-table overflow remains owned by the existing local scroll container, never the page canvas.
- Do not invent destructive action, bulk-edit workflow, data fetch, persistence, or Product feature.

## Explicit Non-Goals

- No blanket change to every `HitoDsPlayground`, tab, table, Product or Admin consumer.
- No new CSS file, token, component, API, state registry, dependency, fixture, backend, Figma, or localisation work.
- Do not remove meaningful dividers, focus rings, selection states, field/menu boundaries, or status chrome merely for visual minimalism.

## Execution Preflight

Before task-owned source changes, record in this item:

1. source/DOM discriminator for the broken hierarchy, misplaced controls, email treatment, and density owner;
2. existing seam, smallest change, proposed runtime artifacts (`none` is expected);
3. exact obsolete branch, selector, mode, and navigation anchor to remove; and
4. whether density belongs to a shared canonical table owner or this reference only.

Treat the previously completed four-part Data Table source changes as admitted baseline. Preserve their bytes unless this task explicitly replaces a named branch; never revert them wholesale.

## Design System Execution Preflight — 2026-08-13

- **Visible symptom and demonstrated source cause:** the accepted four-part source renders four
  sibling `DataTableReferenceSubject` sections, each with `ds-section`, `hito-ui-title-lg`, and its
  own tabbed workbench. `DataTableHeadersReference` renders `ChoiceSelector` inside the central
  Demo; `DataTableRowsReference` renders `Row view` there and passes `facts | actions` into a
  conditional preview branch. The page therefore presents four equal page-level sections instead
  of one Tables family, and the two selectors compete with the specimen they configure.
- **Email and density discriminator:** `RunnerIdentityCell` wraps the email in
  `hito-data-table-code`, which adds background, radius, and padding. All reference cells otherwise
  inherit the shared `.hito-data-table-cell { padding: 1rem }` contract while the identity cell also
  carries a 36px avatar. That shared cell selector is live in Admin Analytics and Product Saved
  Plans, so its default is not changed. The first incorrect density owner is the local reference
  composition: use the existing `p-3` spacing tier on its cells, a current compact avatar size, and
  plain `hito-technical-sm text-secondary` email text.
- **Existing seam and smallest change:** retain the local `DataTableReferenceSubject`, existing
  `useHitoTabs`, playground stage/control classes, table primitives, toolbar/header owners, local
  scroll container, and bounded rows. Nest the four subjects under one `#data-table` family header,
  give subjects smaller headings, and let only Header Demo use the existing right-side property
  panel for `Header state`.
- **New runtime artifacts:** none. No file, CSS rule, token, primitive, shared API, registry,
  framework, fixture, state owner, compatibility path, or Product/Admin change is proposed.
- **Obsolete responsibility removed:** remove the route-local `DATA_TABLE_ROW_VIEWS` /
  `DataTableRowView`, central `Row view` selector, `facts | actions` conditional branch, duplicated
  row Variants table, redundant Header Sandbox, duplicated whole-table Variants, and the three
  public Component navigation destinations `data-table-controls`, `data-table-rows`, and
  `data-table-table`. `#data-table` becomes the sole public Tables destination; internal subjects
  remain labelled sections rather than public page-level anchors.
- **Full-table contract:** retain one four-column live Sandbox using the existing toolbar, sortable
  and filterable headers, values, status, and local scroll. Header/filter menus provide the real
  menu interaction; no detached facts/actions chooser, row mutation, selection workflow, or fake
  destructive action is introduced.
- **Preservation and stop:** global `HitoDsPlayground`, shared table CSS, Admin/Product source,
  Inputs and every unrelated dirty hunk remain unchanged. Return to PRODUCT if focused proof shows
  that reference-only existing-token composition cannot achieve the requested density or if a
  shared API/token/owner change becomes necessary.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused Design System Implementation DoD followed by the required
  independent read-only QA review; not Global QA, release, hosted, deployment, or Figma acceptance.
- **Runtime/path:** use only a healthy current managed loopback `qa_fixture`; rebuild through the
  managed procedure after source changes. Use a supported non-prompting local browser path and
  abandon that exact path if a platform permission prompt appears.
- **Pre-change discriminator:** capture the current DOM at `/hitoDS/components#data-table` before
  implementation, including heading levels, central selectors, public navigation, reference tabs,
  computed cell geometry, and local/page overflow ownership.
- **Captured pre-change DOM:** the live local render contained four separate
  `ds-section hito-ds-playground-section` owners, four `H2.hito-ui-title-lg` headings, and nine tabs
  (`Demo / Sandbox / Variants`, `Demo / Variants`, `Demo / Variants`, `Sandbox / Variants`). Both
  `Header state` and `Row view` radiogroups were descendants of a central
  `.hito-ds-playground-stage`. Navigation exposed four page-level destinations. The first Mara cell
  computed to `padding: 16px`, `height: 90.5px`; its `CODE` child added a tinted background and
  `4px 8px` padding. Page overflow was zero and the wide table already owned its local
  `1072px -> 1240px` scroll, proving neither the page canvas nor scroll primitive is the cause.
- **Final matrix:** exact 1470x801 and 375x812 in Light/Dark; hierarchy, Header property control,
  tab/hash isolation, row anatomy, Sandbox search/filter/sort/menu keyboard and Escape/focus return,
  deep link, local scroll, page overflow, and console health.

## Definition Of Done

1. The route has one large Tables title, concise description, four internal subjects, and the next large Inputs title unchanged.
2. Header Demo has one centered header; its state comes from the right panel without tab/hash drift.
3. Rows & values contains no Row view/Facts/Actions selector or conditional branch and uses subdued plain email treatment.
4. The Table Sandbox is one coherent live composition with no facts/actions switch and local scroll.
5. Cell density is token-backed and implemented at the proven source owner with current consumers preserved, or is truthfully returned to PRODUCT as a cross-owner boundary.
6. No new unapproved table system, visual recipe, or Product behaviour is introduced.

## Validation Inventory

| Check          | Required evidence                                                                                                                                              |
| -------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source         | Current top-level four-subject composition, central Header state chooser, and facts/actions branch are correctly replaced; stale anchors are removed/remapped. |
| Static         | Prettier, focused ESLint, full DS validator, `git diff --check`.                                                                                               |
| Runtime        | Fresh production build and managed `qa_fixture` admission when source changes.                                                                                 |
| Browser        | `/hitoDS/components#data-table` at 1470×801 and exact 375×812 in Light and Dark.                                                                               |
| Interaction    | Header right-panel state, tab/hash isolation, actual sandbox search/filter/sort/check/menu cases, keyboard, Escape, focus return, deep links.                  |
| Visual health  | Density review, local table scrolling, zero page horizontal overflow, and no console warnings/errors.                                                          |
| Independent QA | Existing `ROLE: QA`, read-only, validates the bounded browser matrix after Design System's own proof.                                                          |

## Stop Conditions

Return to PRODUCT before proceeding if proof requires a new shared Table contract/API/token, a shared playground change, Product/Admin source, persistence, an invented workflow, or an unmade design decision. Fix the demonstrated root owner; never hide it with a local workaround.

## Exact Execution Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Data Table Section Hierarchy And Cell Density Correction
Mode: Tracked
Stage: execution preflight, root-cause repair, focused implementation, independent QA review
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-data-table-section-hierarchy-and-cell-density-correction.md
Route: /hitoDS/components#data-table

Read AGENTS.md, agents/design-system.agent.md, this canonical item, and the two superseded Data Table items. Use only skills/hito-frontend-design-system/SKILL.md and skills/hito-qa-browser-regression/SKILL.md. Preserve unrelated dirty work byte-for-byte.

Outcome:
Correct the existing four-part Data Table reference so it reads as one Tables section with a short description and four internal subjects — Headers, Controls, Rows & values, Table — followed by the existing large Inputs section. Make the teaching hierarchy and cell density coherent using current Hito primitives/tokens only.

Cause and scope:
The route-local composition makes four equal DataTableReferenceSubject blocks. Header state is a central demo ChoiceSelector; Row view (Facts/Actions) is a central demo selector and drives a fake conditional row branch. specimen-previews.tsx has the related email/container treatment. First prove whether large cells are caused by a shared canonical owner or only the reference. Do not blame or change HitoDsPlayground, global table CSS, Admin or Product tables without evidence.

Required changes:
- Restore one Tables heading/short description and four smaller internal headings. Remove/remap stale navigation honestly.
- Header Demo: one centered header; Header state lives in the standard right property panel and updates only the active demonstration without tab/hash drift.
- Rows & values: remove Row view/Facts/Actions chooser and branch. Directly show approved row anatomy. Render mara@hito.test as unboxed secondary/technical text.
- Full Table Sandbox: one real existing toolbar/header/value composition with local overflow ownership and no abstract facts/actions chooser or fake detached panel.
- Resolve cell density at the proven owner using existing tokens and component contracts. Preserve Product/Admin defaults, or return to PRODUCT if a cross-owner shared change is actually needed.

Non-goals:
No new CSS file, arbitrary values, token, primitive, Table framework, registry, dependency, fixture, persistence, Product/Admin behaviour, Figma, invented destructive or bulk workflow, or global playground change. Keep meaningful table/focus/menu/status boundaries.

Preflight and proof:
Record the source/DOM discriminator, smallest seam, artifacts (none expected), obsolete modes/anchors to remove, and density owner before writing. Run source assertions, Prettier, focused ESLint, full DS validator, git diff --check, fresh build/runtime, then exact browser proof at 1470x801 and 375x812 in Light/Dark. Cover hierarchy, header-panel control, tab/hash isolation, rows, sandbox interactions, keyboard/Escape/focus, deep links, local scroll, page overflow, and console health.

Subagents:
Implement all DESIGN SYSTEM source yourself. You must request the existing ROLE: QA for one bounded read-only final browser review after your own proof. Its prompt must name its read-only boundary, the exact route/matrix/interactions, preservation boundaries, and return condition. You may request ROLE: DESIGNER only for a narrow read-only density decision if source/token evidence cannot decide; never delegate implementation or invent a role.

Stop and return to PRODUCT if a new shared Table API/token/primitive, Product/Admin change, persistence, shared playground change, or unmade design decision is required. Repair the root owner, not a downstream symptom.
```

## Product Correction — 2026-08-13 (Rows, Values, And Density)

### Stage

Superseded for execution by the consolidated Design System batch. That batch fixes the accepted
three density labels as `SM / MD / LG`; do not dispatch this item alone.

### Latest User Outcome

The `Tables` H2 and its short description remain the one family introduction. `Headers`,
`Controls`, `Rows & values`, and `Table` remain smaller internal subjects rather than separate
peer pages. The current Rows & values Demo is not legible enough: it must show the factual anatomy
of a row, including possible actions, and make the effect of table density inspectable.

For `Headers`, `Rows & values`, and whole `Table`, the right properties panel must expose **only**
the density/size selection. It must update the selected subject's Demo without changing tabs or
hash. Density changes only canonical cell padding, appropriate radius, and the assigned text roles;
it must not create arbitrary font scaling, alter Product/Admin table defaults, or turn the page
canvas into the scrolling element. Where the selected specimen needs more columns than its stage,
the existing local table scroll container owns horizontal scrolling.

Rows & values must show the meaningful possibilities together in the specimen rather than a
`facts | actions` mode: identity/avatar, primary and secondary text, date/time, number/metric,
status, selection checkbox, and an action affordance such as an overflow menu or destructive
action. It must retain native table semantics and an accessible label for every icon-only action.

Each internal subject header needs token-based vertical breathing room above and below its title,
without altering the global playground gap or adding raw-pixel margins.

### Preserved Boundaries

- Do not reopen the retired row-mode chooser, recreate detached Facts/Actions modes, or split
  Tables back into four peer H2 sections.
- Do not change shared Product/Admin `.hito-data-table-cell` defaults, user data, route behavior,
  global `HitoDsPlayground`, or page-level horizontal overflow ownership.
- Do not create a second table component, bespoke density token family, or arbitrary CSS values.

### Required Product Decision

Ivan described **three** density sizes but listed four labels (`S`, `M`, `MD`, `LG`). PRODUCT must
confirm the exact three canonical labels before source work. The recommendation is `SM / MD / LG`,
using existing spacing/radius/typography tokens only.

## Tracked Implementation Receipt — 2026-08-13

### Stage And Outcome

Design System implementation and focused rendered Implementation DoD are complete. The Components
reference now exposes one `Tables` family with one concise description, four internal subjects
(`Headers`, `Controls`, `Rows & values`, `Table`), and the existing `Inputs` family as the next H2.
No Global QA, release, hosted, deployment, Product/Admin consumer, or Figma acceptance is claimed.

### Demonstrated Root Cause And Owner

- The pre-change DOM/source rendered four sibling page-level H2 sections and nine local tabs. Both
  `Header state` and `Row view` lived in central stages, while the row preview branched between
  invented `facts` and `actions` modes.
- Shared `.hito-data-table-cell` padding is a live canonical default used by Product/Admin and was
  not changed. The oversized reference row was compounded locally by 16px cells, a 36px avatar,
  and boxed `hito-data-table-code` email treatment. The first incorrect owner was therefore the
  Hito DS reference composition, not shared table CSS or `HitoDsPlayground`.
- The reference now uses the existing `p-3` tier, compact existing Avatar geometry, and plain
  `hito-technical-sm text-secondary` email text. Rendered cells compute to 12px padding and a
  67.5px row height in all required themes/viewports.

### Files Changed

- `src/components/hito-ds/reference-components-controls.tsx`
  - nests the four Data Table subjects under one `#data-table` family;
  - renders the internal subjects as H3 titles;
  - moves Header state into the existing right property-panel composition;
  - removes redundant Header Sandbox, row chooser/Variants, and whole-table Variants modes.
- `src/components/hito-ds/specimen-previews.tsx`
  - deletes the `facts | actions` row branch and detached row-action anatomy;
  - renders one semantic four-cell row with hidden headers/caption and unboxed email text;
  - composes one live four-column toolbar/header/value/status table with local scrolling.
- `src/components/hito-ds/reference-model.ts`
  - replaces four stale table destinations with one truthful `Tables` destination at
    `/hitoDS/components#data-table`.
- This canonical item records preflight, evidence, lifecycle, and closure. No CSS, token, shared
  primitive, Product/Admin source, fixture, dependency, persistence, or runtime artifact was added.

### Deleted Or Simplified Responsibility

Removed the route-local `DATA_TABLE_ROW_VIEWS` / `DataTableRowView`, `Row view` selector,
`Facts` / `Actions` conditional rendering, duplicate row/table comparison modes, redundant Header
Sandbox, and the `data-table-controls`, `data-table-rows`, and `data-table-table` public navigation
destinations. No compatibility path remains.

### Validation Inventory

| Check                      | Scenario / environment                                                    | Result           | Evidence                                                                                                                                                                                                                                                                                               |
| -------------------------- | ------------------------------------------------------------------------- | ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source discriminator       | Exact Data Table owners and removed symbols/anchors                       | Passed           | No retired row-view, row/table variants, Header Sandbox, or stale navigation owner remains; shared table CSS is byte-preserved.                                                                                                                                                                        |
| Prettier                   | Three task-owned TypeScript/TSX source files                              | Passed           | `npx prettier --check ...` reported all matched files formatted.                                                                                                                                                                                                                                       |
| Focused ESLint             | Three task-owned TypeScript/TSX source files                              | Passed           | `npx eslint ...` exited 0.                                                                                                                                                                                                                                                                             |
| Diff hygiene               | Entire dirty checkout                                                     | Passed           | `git diff --check` exited 0 after source proof.                                                                                                                                                                                                                                                        |
| Full DS validator          | `npm run validate-hito-ds-components`                                     | External failure | Data Table assertions did not fail. The only reported failure is the unrelated existing Brand-background assertion: one truthful on-light/on-dark pair plus canonical favicon reuse. No Brand source or validator was changed here. Consequence: this receipt does not claim a globally green DS gate. |
| Full TypeScript diagnostic | `npx tsc --noEmit --pretty false`                                         | External failure | The dirty integration checkout has broad pre-existing cross-domain errors. The only diagnostic in `specimen-previews.tsx` is outside the Data Table range; no task-owned Data Table diagnostic was emitted. This is not used as a passing task gate.                                                   |
| Production build           | Fresh uncontended `npm run build`                                         | Passed           | Client, SSR, Nitro, and postbuild completed with exit 0.                                                                                                                                                                                                                                               |
| Managed runtime admission  | Canonical loopback QA procedure                                           | Passed at proof  | `managed: true`, compatible/healthy, `artifactFreshness: fresh`, `receipt_matches` before the browser matrix. A later concurrent private Admin receipt-digest movement made status stale without changing the served Data Table bundle; no foreign runtime/source was repaired.                        |
| Own browser matrix         | 1470x801 and 375x812, Light/Dark                                          | Passed           | All four cells showed one Tables H2, four H3 subjects, next Inputs H2, one nav destination, 12px cells, unboxed email, zero page overflow, and zero console warnings/errors. Mobile table scroll measured 327px client / 860px content.                                                                |
| Own interactions           | Header Demo/Variants, live search, filter/sort menus, Escape/focus return | Passed           | Filtered Header state updated only Demo with stable `#data-table`; Variants remained five states; search reduced to Mara/one row; filter and status menus restored trigger focus.                                                                                                                      |
| Independent QA             | Existing `ROLE: QA`, read-only                                            | Passed           | Exact four-cell matrix, physical ArrowLeft, Home/End/Arrow/Enter, search, Active filter, Workouts sorting, Escape/focus return, 375px local scroll, overflow, and console health all passed.                                                                                                           |

### Preserved Boundaries And Remaining Facts

- Shared Product/Admin table geometry and routes were intentionally not changed or browser-replayed;
  source reachability proves their default CSS owner was preserved. This receipt claims the local
  Design System reference correction only.
- The repository-wide DS validator remains red solely on the unrelated Brand tone-count contract.
  That existing failure is a separate owner/item boundary and does not justify weakening the
  validator or restoring stale Data Table structure.
- The independent reviewer observed the task-matching served bundle. Subsequent Admin receipt
  digest movement is infrastructure freshness drift, not a rendered Data Table defect.

### Reviewer Verdict And Next Owner

Independent QA verdict: **Passed** for focused rendered Implementation DoD. The next owner is
**PRODUCT** for any separate Brand-validator routing or later Global QA/release decision. There is
no Data Table implementation blocker.

## Product Correction — 2026-08-13

### Stage

FRONTEND (ds) Lite correction — center the rendered Headers Demo object inside its own stage only.

### User Report And Evidence

- Inspector item: `760571a0-3ea4-48e6-bd5c-1c7711e18f30`.
- Route: `/hitoDS/components#data-table`, Dark, 1470×801.
- Target: the first `article.hito-ds-playground-stage` under the Data Table `Headers` subject.
- User-visible symptom: the demonstrated Header object does not appear centered in its 680×464px
  stage. Ivan requested that the object be centered.
- Scope: only this selected Data Table Headers stage; no request to alter other stages or mobile.

### Current Source Facts And Required Discriminator

- `DataTableHeadersReference` renders the selected subject through the route-local
  `DataTableReferenceSubject` in `src/components/hito-ds/reference-components-controls.tsx`.
- Its Demo child is `DataTableHeaderDemo` from `src/components/hito-ds/specimen-previews.tsx`; the
  child begins with `hito-data-table-scroll w-full max-w-sm`.
- The shared `.hito-ds-playground-stage[data-mode="demo"]` already declares `display: grid` and
  `place-items: center` in `src/styles/reference-workbench.css`. It is therefore not proven to be
  the incorrect owner and is excluded from this correction.
- Before a source write, measure the selected stage, direct panel, scroll wrapper, and table's
  computed/inset rectangles at the captured viewport. The first source owner is whichever local
  Headers composition causes the observed offset; do not infer it from the shared class name.

### Accepted Outcome

The one Header Demo table/header is visibly centered horizontally and vertically in its own Demo
stage at desktop. It remains a factual one-header specimen, preserves Header-state controls in the
right panel, and does not change Data Table Controls, Rows & values, Table, shared playground
stages, global table CSS, Product/Admin tables, tabs, hash behavior, or mobile composition.

### Lite Boundary

- **Existing seam:** route-local Data Table Headers composition and/or its existing Header Demo
  preview only after the geometry discriminator identifies one of them.
- **Smallest change:** align the local header preview/wrapper in that one stage using existing
  layout utilities or tokens.
- **New runtime artifacts:** none.
- **Do not touch:** `reference-workbench.css`, generic `HitoDsPlayground`, other data-table
  subjects, table primitives/CSS, Product/Admin source, tokens, Figma, validators, or unrelated
  dirty work.
- **Promotion:** promote to Tracked if centering requires a shared-stage contract, global table
  CSS, another owner, or a new layout API/token.

### Focused Proof

1. Desktop browser evidence at the captured route confirms equal visual horizontal margins and
   centered vertical placement for the Header Demo object.
2. Header-state choice remains in the right panel and continues to update the Demo only, with no
   tab/hash regression.
3. Other Data Table subjects and one representative non-Data-Table demo stage remain unchanged.
4. Focused Prettier, ESLint, and `git diff --check` pass. Rebuild/browser matrix is only required
   if source behavior or the existing managed artifact boundary makes it necessary; record any
   omitted coverage without elevating the claim.

### Exact Follow-up Prompt

```text
ROLE: FRONTEND

Specialization: DS

Task: Data Table Headers Demo Centering
Mode: Lite correction in the existing canonical task
docs/tasks/backlog/2026-08-13-hito-ds-data-table-section-hierarchy-and-cell-density-correction.md.

Read AGENTS.md, agents/frontend.agent.md, and
skills/hito-frontend-design-system/SKILL.md before editing.

Outcome: Center only the rendered Header Demo object in Tables → Headers → Demo at
/hitoDS/components#data-table, desktop. Preserve its right-panel Header-state control and all
other table/playground subjects.

Source fact: the shared demo stage already uses grid place-items:center. Before any edit, measure
the stage, panel, scroll wrapper, and table at the captured viewport to prove the first local owner
of the offset. Do not change reference-workbench.css, generic HitoDsPlayground, global table CSS,
Product/Admin tables, tokens, or mobile without new evidence.

Make the smallest local existing-token/layout correction, add no artifact, and preserve Header
state, tabs, hash behavior, local scroll, and semantics. Prove desktop centering plus focused
formatting, lint, and diff hygiene; return to PRODUCT if the fix requires a shared owner.
```

## Tracked Geometry And Lifecycle Reconciliation Receipt — 2026-08-14

### Current Discriminator

Fresh managed browser measurement at `/hitoDS/components#data-table`, Dark and Light, 1470×801 proves the accepted Headers Demo outcome is already present in current integrated source:

- stage: 680×464px;
- panel: 568px wide with equal 56px stage insets;
- local `hito-data-table-scroll` wrapper: 384px wide with equal 148px stage insets;
- wrapper and panel share the same vertical center; and
- the wrapper's local scrollbar ownership accounts for its own measured height without shifting the centered object.

The first local incorrect owner therefore no longer exists. Adding `mx-auto`, `justify-self-center`, a route wrapper, or a shared-stage override would duplicate the already effective contract, so no runtime source was changed.

### Focused Proof And Lifecycle

| Check                   | Scenario / environment             | Result | Evidence                                                                                                                                       |
| ----------------------- | ---------------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| Geometry                | Headers Demo, 1470×801, Dark/Light | Passed | Exact equal 148px wrapper insets and 56px panel insets inside the 680×464 stage.                                                               |
| Property control        | Density MD → LG                    | Passed | Active Demo remained selected, cell padding changed to the existing 16px LG tier, wrapper stayed centered, and the URL remained `#data-table`. |
| Tab isolation           | Demo → Variants → Demo             | Passed | Variants rendered the static five-header matrix without a properties aside; returning restored the Demo aside; hash remained stable.           |
| Hierarchy               | Tables section                     | Passed | One Tables H2 and four H3 subjects remain: Headers, Controls, Rows & values, and Table.                                                        |
| Comparison specimen     | Button Demo stage                  | Passed | The representative non-Data-Table stage retained the shared centered 680×464 stage and symmetric panel/preview insets.                         |
| Containment and console | Current local browser              | Passed | No page overflow and no console warnings/errors.                                                                                               |

- **Current owner:** DESIGN SYSTEM. The historical `FRONTEND (ds)` implementation receipt above remains execution history.
- **Lifecycle result:** `completed`. The existing source already satisfies the final Product Correction; this closure intentionally creates no source diff. No Global QA, release, Product/Admin table, deployment, hosted, or Figma acceptance is claimed.

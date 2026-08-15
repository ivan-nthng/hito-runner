# Hito DS Reference Contract And Table Density Batch

## Work Item ID

2026-08-13-hito-ds-reference-contract-and-table-density-batch

## Status

completed

## Type

Tracked — consolidated Design System reference, primitive, and canonical-reference cleanup

## Priority

high

## Owner

DESIGN SYSTEM

## Parent

[Hito DS Visual Correction Batch — Components, Playgrounds, And Launch Surfaces](./2026-08-13-hito-ds-components-header-signal-cleanup.md)

## Evidence From

- [Metadata Tag shared contract and reference adoption](./2026-08-13-hito-ds-metadata-tag-shared-contract-and-reference-adoption.md)
- [Reference Link component and Used-in adoption](./2026-08-13-hito-ds-reference-link-component-and-used-in-adoption.md)
- [Contained App Shell header Product-anatomy alignment](./2026-08-13-hito-ds-contained-app-shell-header-product-anatomy-alignment.md)
- [Data Table section hierarchy and cell-density correction](./2026-08-13-hito-ds-data-table-section-hierarchy-and-cell-density-correction.md)

## Supersedes

- [Metadata Tag shared contract and reference adoption](./2026-08-13-hito-ds-metadata-tag-shared-contract-and-reference-adoption.md)
- [Reference Link component and Used-in adoption](./2026-08-13-hito-ds-reference-link-component-and-used-in-adoption.md)
- [Contained App Shell header Product-anatomy alignment](./2026-08-13-hito-ds-contained-app-shell-header-product-anatomy-alignment.md)
- [Data Table section hierarchy and cell-density correction](./2026-08-13-hito-ds-data-table-section-hierarchy-and-cell-density-correction.md)

## Mode

Tracked

## Stage

Completed — Design System source/build implementation accepted by the completed independent focused
QA retry on a fresh managed artifact.

## Next Recommended Role

PRODUCT — use this terminal implementation/QA chain for later release mapping; any Figma-library,
Global QA, hosted, release, or deployment work remains separate.

## Scope

Complete one coherent `/hitoDS` reference cleanup in existing canonical seams:

1. restore the borderless Light Metadata Tag as the default status-label presentation;
2. turn anonymous `Used in` and specimen route anchors into one named, physically documented
   Reference Link contract;
3. make the desktop contained App Shell reference show the real Product header anatomy, without
   changing Product `AppShell`; and
4. make the Tables reference legible as one family with accurate Headers, Controls, Rows & values,
   and Table subjects, using exactly three reference-only density modes: `SM`, `MD`, and `LG`.

The batch concerns Design System source, canonical CSS/primitive seams, and `/hitoDS` reference
composition only. Product/Admin routes, data, persistence, Figma mutation, generated manifests,
and unrelated dirty work remain outside scope unless a preflight proves a different first owner and
PRODUCT separately routes that owner.

## Archive Intent

retain_in_place

## Task

Repair the demonstrated canonical owners rather than papering over each screenshot with local
styles. Reuse existing Hito components, semantic tokens, spacing, radius, typography, focus, menu,
table, and shell contracts before adding anything. Before a new source file, helper, variant, token,
or CSS recipe, prove that an existing owner cannot carry the responsibility and identify the
obsolete path that will be removed.

### A. Metadata Tag: Light By Default

`HitoMetadataTag` already has the accepted additive `light | accent` visual contract. The remaining
defect is its shared playground fan-out: Signal status labels implicitly select Accent. Restore
borderless `light` wherever `variant` is omitted. Preserve existing semantic `tone` values and
explicit Accent examples. Do not change the public API, migrate Product/Admin/DevTools callers, or
create a second tag family.

Primary seam: `src/components/hito-ds/playground.tsx`, after confirming current reachability. The
existing primitive and `src/styles/controls-lists.css` remain the visual owners.

### B. Reference Link: All Used-in And Specimen Anchors

Replace anonymous `.hito-specimen-link` presentation plus its raw route/anchor renderers with one
named, physically documented **Reference Link** contract. Every existing `Used in` route link and
in-document specimen anchor must use it, while retaining native `<a>` semantics, deep links, tab
selection, and browser back/forward behaviour.

The contract is technical navigation, not a Button or Tag: `hito-technical-sm`, `--space-1` block
and `--space-2` inline padding, `--radius-sm`, existing theme-aware surface/text/hairline/focus
tokens, and visible token-owned hover plus focus-visible feedback. Do not use raw decimal spacing,
pill radius, raw alpha formulas, or a hover-only affordance.

Expected seams: `src/components/hito-ds/reference.tsx`,
`src/components/hito-ds/playground.tsx`, `src/styles/reference-workbench.css`, and the existing
reference metadata/composition seam. A new component file is admitted only if preflight proves no
existing named owner can support both native route and in-document anchors.

### C. Contained App Shell: Real Header Anatomy

In the desktop contained App Shell Demo only, remove the fictional `Training` eyebrow, `Training
week` title, and language menu. Render a static, truthful reference of the Product AppShell header:
Today/date on the start side and Week status on the end side. Reuse the established
`hito-workbench-topbar` material, including its blur/background/edge contract.

Primary seam: `src/components/hito-ds/reference-components-structure.tsx`. Do not edit
`src/components/AppShell.tsx`, Product routes, shared header material CSS, language-menu behaviour,
or the narrow/mobile contained specimen.

### D. Tables: Family Hierarchy, Row Anatomy, Actions, And Density

Keep a single `Tables` H2 and concise family description. Under it, use smaller internal subjects
in this order: `Headers`, `Controls`, `Rows & values`, `Table`. Do not restore four peer H2 sections,
retired row modes, detached Facts/Actions views, redundant descriptive prose, or stale anchors.

- **Headers:** truthful header states. Its right properties panel contains only density; it updates
  the currently visible Demo without changing tab or hash.
- **Controls:** show table search, filters, sorting, and applicable control states through existing
  Hito controls; do not invent a second control primitive.
- **Rows & values:** show factual table-cell anatomy together in one specimen: avatar/identity,
  primary and secondary text, plain unboxed subdued `mara@hito.test`, date/time, metric, status,
  checkbox, and an accessible action affordance such as overflow menu or destructive action. No
  Facts/Actions chooser exists.
- **Table:** one real live table with multiple columns and existing search/filter/sort/action
  behaviour. Its local scroll container, never the page canvas, owns horizontal overflow.

Use `SM / MD / LG` as the exact three density labels. Density affects only the reference
specimen's existing token-backed cell padding, appropriate radius, and assigned text roles. It must
not introduce arbitrary font scaling, custom raw values, a new density-token family, or a shared
Product/Admin table default change. If source proves that a shared table primitive is the true owner,
stop and return the cross-owner boundary to PRODUCT rather than altering consumer defaults.

Each internal subject title receives existing-token vertical breathing room above and below; do not
change the global playground gap merely to solve this local hierarchy issue.

Expected seams: `src/components/hito-ds/reference-components-controls.tsx`,
`src/components/hito-ds/specimen-previews.tsx`, and `src/components/hito-ds/reference-model.ts`.

## Demonstrated Causes

| Subject             | Visible symptom                                                        | Demonstrated first incorrect owner                                                                                               |
| ------------------- | ---------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| Metadata Tag        | Status examples appear Accent by default                               | Shared `HitoDsPlayground` status handoff selects Accent for Signal instead of leaving the visual variant omitted/Light.          |
| Used in             | Route links look like anonymous pills and are absent as a DS component | Anonymous `.hito-specimen-link` recipe plus two raw reference renderers.                                                         |
| Contained App Shell | Reference says Training rather than showing the real Product header    | The contained reference hard-codes `Training`, `Training week`, and `HitoLanguageMenu`.                                          |
| Tables              | Hierarchy, row anatomy, actions, and density are difficult to inspect  | Route-local Data Table reference composition and preview branches; shared Product/Admin table defaults are not proven incorrect. |

## What Not To Touch

- Product `AppShell`, authenticated product routing, Admin tables, persistence, backend truth,
  fixtures, provider calls, and user data.
- Figma files, Figma export mutation, hosted state, Git staging/commit/push/deployment, or release.
- `InlineEditableText` header work, State Surface gradients/sizing, generic card contracts, and
  other independent visual-correction items.
- Global `HitoDsPlayground` layout, page-level overflow ownership, or shared Product/Admin table
  defaults without a fresh source/DOM discriminator and separate Product routing.
- New parallel primitives, new tokens, compatibility paths, or local CSS exceptions that duplicate
  existing Design System ownership.

## Execution Preflight

Before the first task-owned write, record in this item:

1. current file hashes and active-writer state for every admitted seam;
2. live consumer census for `HitoMetadataTag`, `.hito-specimen-link`, contained App Shell header,
   table reference subjects, and shared table-cell defaults;
3. existing owner to reuse and smallest change for each subject;
4. new runtime artifacts: `none`, unless the Reference Link census proves a named component file is
   necessary;
5. exact obsolete selectors, raw renderers, modes, anchors, and conditional branches to delete; and
6. whether any required change crosses into Product/Admin ownership. Stop and return that boundary
   before writing it.

## Definition Of Done

1. Metadata Tag status labels default to Light; every Accent presentation is explicit and approved.
2. One physically documented Reference Link owner renders every existing Used-in route link and
   specimen anchor; the anonymous recipe/raw renderer has zero live reachability.
3. The desktop contained App Shell reference truthfully mirrors Product header hierarchy without
   touching Product AppShell.
4. Tables has one family heading and four internal subjects, no retired Facts/Actions mode, and a
   factual all-in-one row specimen with accessible actions.
5. `SM / MD / LG` updates only reference table specimen density and preserves Product/Admin defaults.
6. All changed visual states use existing Design System tokens/components; no raw one-off recipe or
   duplicate source of truth remains.
7. The batch has an English implementation receipt distinguishing source/static/build/browser proof
   from Global QA and release acceptance.

## Validation Expectations

| Check               | Required proof                                                                                                                                                                                   |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Source and deletion | Before/after consumer census; obsolete anonymous Reference Link renderers, implicit Accent handoff, stale table modes/anchors, and retired reference branches have zero task-owned reachability. |
| Semantics           | Native route/anchor navigation; table header/cell semantics; accessible labels for icon-only actions; no fake interactive hosts.                                                                 |
| Interaction         | Hover/focus-visible Reference Link, deep links and browser history, table search/filter/sort/actions, keyboard navigation, Escape, and focus return.                                             |
| Browser             | `/hitoDS/components` and `/hitoDS/patterns`, exact 1470×801 and 375×812, Dark/Light; hierarchy, density, scroll containment, no page overflow, and console health.                               |
| Static              | Focused Prettier, ESLint, relevant existing DS validator/manifest parity, `git diff --check`, and production build for changed runtime source.                                                   |
| Independent QA      | Existing named `ROLE: QA` performs a bounded read-only final browser review against a fresh healthy loopback artifact.                                                                           |

## Stop Conditions

- A Product/Admin source, shared consumer default, new shared API/token/primitive, persistence,
  generated artifact, or Figma mutation becomes required.
- A fresh runtime cannot be admitted for browser evidence; record the coverage gap rather than
  claiming visual closure from stale output.
- A genuine visual-contract ambiguity cannot be decided from accepted task evidence and existing
  tokens. In that limited case, request an existing named DESIGNER role for a read-only decision;
  do not delegate implementation.

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Reference Contract And Table Density Batch
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-reference-contract-and-table-density-batch.md

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md
before acting. Also read the four Evidence From items listed in the canonical task. This is one
Design System implementation batch; you own all task-owned source edits. Do not delegate any
Design System implementation to a Frontend or same-role subagent.

Implement the accepted root-owner corrections together:
1. Metadata Tags default to borderless Light; Accent remains explicit only.
2. Replace anonymous Used-in/specimen link rendering with one documented Reference Link contract.
3. Make the desktop contained App Shell reference show the real Product header anatomy, without
   changing Product AppShell.
4. Make Tables one readable family with Headers, Controls, Rows & values, and Table; expose only
   SM/MD/LG reference density, retain all row anatomy/actions together, and keep local table scroll
   ownership.

Work from existing primitives, tokens, CSS, and reference seams. Search for reuse before writing
new code. A new file, helper, token, variant, or recipe is prohibited unless preflight proves an
existing owner cannot carry the responsibility and you delete the superseded path. Do not fix
symptoms with route-local overrides. Do not change Product/Admin defaults, Product AppShell,
persistence, Figma, generated artifacts, or unrelated dirty work.

Run the execution preflight in the canonical task before the first write. Then implement and
validate the complete batch with source/deletion checks, focused formatting/lint, relevant existing
DS checks, build, and fresh browser replay at exact 1470×801 and 375×812 in Dark/Light. Cover
links/deep links, table controls/actions, keyboard/Escape/focus return, scroll containment,
overflow, and console health.

Use the existing named ROLE: QA for one bounded read-only independent final browser review after
your own proof. You may ask the existing named ROLE: DESIGNER for one bounded read-only visual
decision only if the accepted evidence cannot resolve a real ambiguity. Their prompts must state
their role, read-only scope, evidence, non-goals, and return condition. Do not make them implement.

Return a truthful English Tracked implementation receipt in the same canonical item. Stop and
return to PRODUCT if any cross-owner change or unresolved product/design decision is required.
```

## Historical Blockers At Implementation

No source blocker. The sidebar DESIGN SYSTEM role is the required executor; a Product-created
subagent is explicitly not an acceptable substitute. The existing Brand/favicon validator assertion and unrelated private Admin
snapshot freshness gate are external baseline conditions: do not weaken them or repair their owners
inside this batch. Record any resulting validation coverage gap truthfully.

## Execution Preflight — 2026-08-13

### Source snapshot and active-writer state

The admitted source is already dirty from accepted prior Design System work. No active subagent is
writing any admitted file; the existing named QA agent is idle and will be reused only after the
primary implementation proof. Current SHA-256 values before this batch's first production write:

- `src/components/hito-ds/reference.tsx` —
  `b556266d3a491359d2cbb803c6dba691d63a12521b9b6c8219e37a42f6099d4c`;
- `src/components/hito-ds/playground.tsx` —
  `0faba0818cc921f719cefcfcb25dad169630ef8e6606772356894579eec0dffc`;
- `src/styles/reference-workbench.css` —
  `d605ac0b506b352d99f1c896407d110a8459ccc64dd59289506cc1422723ecad`;
- `src/components/hito-ds/reference-components-structure.tsx` —
  `4aaf6aad933b5b2ad1e25eca3232f93965fa2ce69e68b53a52fc9f05f3ad2c17`;
- `src/components/hito-ds/reference-components-controls.tsx` —
  `d37428cefcf9fd87ce5ca9c3a92d0c984b35f16ccad5cc79144b5e25cb67e651`;
- `src/components/hito-ds/specimen-previews.tsx` —
  `e8e78780a4af648c68a27a35c71e93a78a6e287ab1d5e2b3a751abe5b2404688`;
- `src/components/hito-ds/reference-model.ts` —
  `16bc8d75cae4ae48738b34d4203fe3401f92a4a8acd8005e0fc6577dd2526871`;
- `src/components/ui/metadata-tag.tsx` —
  `0132ba5df567a1744489733af4cc940b232efd81661e2aaf7d284662ea72651c`;
- `src/styles/controls-lists.css` —
  `b08ce8285c9a23c021156164ad6eb7c42a03976b50d3b2cedddd17473c62c650`.

Unrelated hunks in those dirty files remain outside this batch and will be preserved. The canonical
batch item itself is new/untracked and is the sole lifecycle owner for this execution.

### Live consumer census and demonstrated owners

- **Metadata Tag:** 35 direct JSX calls exist: 19 Design System calls across four `/hitoDS`
  files and 16 direct Product/Admin/DevTools calls across four cross-owner files. The single shared
  playground fan-out currently makes every Signal status Accent through
  `variant={statusTone === "signal" ? "accent" : "light"}`. The primitive and canonical CSS
  already implement borderless default Light and explicit safe Accent; they require no change.
- **Reference Link:** `.hito-specimen-link` has exactly two live renderers — `ProductLinks` in
  `reference.tsx` and specimen anchors in `playground.tsx` — plus its anonymous CSS recipe. There
  are 14 `ProductLinks` call sites in seven `/hitoDS` files and six playground `anchors` call sites.
  `reference.tsx` is already the shared native-reference-navigation seam and can own a named
  `HitoReferenceLink` for both route and hash anchors; no new source file is justified.
- **Contained App Shell:** one desktop contained header in
  `reference-components-structure.tsx` hard-codes `Training`, `Training week`, and
  `HitoLanguageMenu`. Its locale state plus two controls reach only that fictional header. The
  Product `AppShell.tsx` remains read-only evidence for Today/date plus Week status anatomy; the
  existing `hito-workbench-topbar` CSS is correct.
- **Tables:** the accepted source already has one `Tables` H2, four H3 subjects, no Facts/Actions
  branch, and one truthful navigation destination. Shared `.hito-data-table-cell` remains a live
  Product/Admin default: 28 production JSX usages across `SavedPlanLibraryPanel.tsx` and
  `admin.analytics.tsx`. The missing three-density contract and incomplete selection/action cell
  anatomy belong only to `reference-components-controls.tsx` and `specimen-previews.tsx`; shared
  Product/Admin defaults are not incorrect.

### Reuse-first decision and smallest changes

- **Metadata:** omit the playground `variant` handoff entirely so every shared status uses the
  primitive's canonical default Light. Existing explicit Accent specimens remain explicit.
- **Reference Link:** add the named native-anchor owner inside existing `reference.tsx`, adopt it in
  both raw renderers, rename the anonymous container/recipe to the documented contract, and add one
  compact physical Components playground plus one existing reference-model destination. Reuse
  Technical SM, `--space-1/2`, `--radius-sm`, hairline, surface/chrome, motion, and ring tokens.
- **App Shell:** replace only the desktop contained header body with static Today/date and Week
  status anatomy; remove now-unreachable locale state/import/controls. Product AppShell, shared
  topbar CSS, narrow specimen, and the language-menu component remain byte-preserved.
- **Tables:** retain the current hierarchy and interactive controls. Add exactly `SM / MD / LG` to
  the existing right property-panel composition for Headers, Rows & values, and Table. The existing
  local table preview functions receive that reference-only value; fixed `p-3` classes are removed.
  Rows and the live Table reuse native Hito checkbox, Hito Button/Menu, Avatar, status, toolbar,
  headers, and local scroll contracts to show selection, identity/email, primary/secondary copy,
  date/time, metric, status, and accessible actions together.

### Change budget and obsolete responsibility

New runtime artifacts: **none**. No file, token, generated output, component family, route registry,
shared table API, compatibility path, fixture, or dependency is proposed. One compact
reference-only density selector is admitted in the existing `reference-workbench.css` owner because
the reused Admin header owns fixed `th` padding and changing it would require a forbidden shared API
or Product/Admin default change. That selector maps only `data-hito-reference-table-density` to
existing spacing/radius tokens; it is not a new token family or Product recipe.

The batch deletes the implicit Signal-to-Accent branch; `.hito-specimen-link` and
`.hito-specimen-links`; both raw anchor renderers; the fictional contained Training/language header
and its dead locale controls; fixed reference `p-3` density; and the incomplete four-cell row/table
anatomy. Existing native navigation, browser history, table interaction, Product/Admin geometry,
and all unrelated dirty source remain.

No required change crosses Product/Admin, persistence, generated, Figma, hosted, release, or Git
lifecycle ownership. No unresolved design decision remains; the accepted `SM / MD / LG` labels and
token-only visual contract are sufficient.

## Browser Path Preflight — 2026-08-13

- **Validation layer:** focused Design System Implementation DoD for this batch, followed by the
  required independent read-only QA review. This is not Global QA, release, hosted, deployment, or
  Figma acceptance.
- **Fresh artifact:** `npm run build` completed successfully after the task-owned source changes.
  Its canonical prebuild step intentionally stopped the managed QA server; admit the resulting
  artifact only through the existing `qa_fixture` managed runtime procedure and restore that
  server before closure.
- **Browser/control path:** use a supported non-prompting local browser path against the managed
  loopback runtime. Abandon any path that raises a platform permission prompt; do not start an ad
  hoc server or substitute stale output.
- **Matrix:** `/hitoDS/components#reference-link`, `/hitoDS/components#data-table`, and
  `/hitoDS/patterns` at exact `1470x801` and `375x812` in Dark and Light. Inspect the contained App
  Shell desktop anatomy at desktop and preserve the existing narrow specimen at mobile.
- **Interaction inventory:** native route/hash Reference Link navigation plus browser back/forward;
  focus-visible; Data Table density controls, Demo/Variants hash isolation, search, filter, sort,
  row selection, overflow action menu, Escape/focus return, and local horizontal scroll; default
  Light Metadata Tags; heading hierarchy; page overflow and console health.
- **Stop condition:** if the managed artifact is not current and healthy, record the exact coverage
  gap rather than claiming visual closure. Do not repair Product/Admin, Brand/favicon validation,
  private Admin snapshot admission, or another owner's runtime source inside this task.

## Tracked Implementation Receipt — 2026-08-13

### Task, mode, and outcome

- **Task:** Hito DS Reference Contract And Table Density Batch.
- **Mode / stage:** Tracked Design System implementation; source and build slice complete, required
  browser acceptance blocked by the external managed-runtime admission gate.
- **Product outcome:** the shared Hito DS status handoff now preserves Metadata Tag's default Light
  presentation; one named Reference Link owns Used-in and specimen navigation; the contained
  desktop App Shell documents Today/date and Week status; and Tables is one family with four
  internal subjects plus reference-only `SM / MD / LG` density.
- **Root causes repaired:** removed the playground's implicit Signal-to-Accent branch, the anonymous
  specimen-link recipe/raw renderers, the fictional contained desktop Training/language header,
  and the incomplete/fixed-density reference table composition. Shared Product/Admin defaults were
  not the first incorrect owner and remain unchanged.

### Files changed

Task-owned edits were integrated narrowly into already-dirty shared Design System files:

- `src/components/hito-ds/reference.tsx` — named native `HitoReferenceLink` owner and ProductLinks
  adoption;
- `src/components/hito-ds/playground.tsx` — Reference Link anchor adoption and default-Light
  Metadata Tag handoff;
- `src/styles/reference-workbench.css` — documented Reference Link chrome and reference-only
  token-backed `SM / MD / LG` table density;
- `src/components/hito-ds/reference-components-controls.tsx` — Reference Link playground, one
  Tables hierarchy, three density property controls, and one live Table Demo;
- `src/components/hito-ds/specimen-previews.tsx` — complete seven-cell anatomy, native selection,
  accessible action menus, live toolbar/search/filter/sort, and density-aware text roles;
- `src/components/hito-ds/reference-components-structure.tsx` — truthful contained desktop App
  Shell header anatomy and deletion of unreachable local locale state/controls;
- `src/components/hito-ds/reference-model.ts` — one Reference Link destination; and
- this canonical item — preflight, browser preflight, lifecycle, and receipt.

New runtime artifacts: **none**. No Product/Admin/DevTools source, shared table default, Product
AppShell, locale component, token, manifest, generated file, fixture, dependency, Figma source, or
hosted state was changed.

### Source and deletion census

| Contract              | Before                                                                                             | After                                                                                                                                                              | Result    |
| --------------------- | -------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ | --------- |
| Metadata Tag handoff  | Shared playground implicitly made every Signal status Accent                                       | `variant` is omitted; default Light is inherited; explicit approved Accent examples remain explicit                                                                | Passed    |
| Metadata consumers    | 35 calls at preflight: 19 DS / 16 cross-owner                                                      | Refreshed integration census: 36 calls, 19 DS / 17 cross-owner; the extra cross-owner call is outside admitted files and the semantic `tone` API remains unchanged | Preserved |
| Reference Link        | Two raw renderers plus anonymous `.hito-specimen-link(s)` CSS                                      | One `HitoReferenceLink`; all 15 ProductLinks call sites and all six playground anchor owners fan through it; old selectors have zero reachability                  | Passed    |
| Contained App Shell   | Desktop `Training`, `Training week`, language menu, and two dead locale controls                   | Today/date at start and Week/On track at end; locale/header fiction has zero reachability; narrow specimen unchanged                                               | Passed    |
| Table modes/branches  | Accepted hierarchy but incomplete four-cell anatomy, fixed `p-3`, and whole-table `Sandbox` naming | One H2, four H3 subjects, no retired Facts/Actions/row-view/table-sandbox symbols, seven real cell types, one live Demo, and exact `sm/md/lg` control vocabulary   | Passed    |
| Shared table defaults | 28 production `.hito-data-table-cell` usages in Product/Admin evidence                             | Same shared consumers and defaults; density applies only when the DS reference data attribute is present                                                           | Preserved |

The row and live table now place selection, identity/avatar, primary/secondary plan copy, plain
unboxed Technical SM email, date/time, metric, status, and an icon-only action menu in the same
semantic row. Search, filtering, sortable headers, native checkbox state, Radix menu semantics, and
local horizontal-scroll ownership reuse existing contracts.

### Validation inventory

| Check                         | Scenario / environment                                                                                     | Result                                    | Evidence                                                                                                                                                                                                                                                                         |
| ----------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Focused source discriminators | Removed selectors, implicit Accent, fictional header, retired table modes/anchors; current consumer counts | Passed                                    | `.hito-specimen-link(s)`, implicit Signal variant, Training/language locals, and retired table symbols all return zero task-owned matches; Reference Link and density owners are singular.                                                                                       |
| Focused formatting            | Prettier check for seven changed runtime/CSS files                                                         | Passed                                    | All matched files use Prettier style.                                                                                                                                                                                                                                            |
| Focused lint                  | ESLint for six changed TS/TSX owners                                                                       | Passed                                    | Exit 0, no findings.                                                                                                                                                                                                                                                             |
| Manifest parity               | `node scripts/generate-hito-ds-manifest.mjs --check`                                                       | Passed                                    | `primitiveColors=43`, `semanticColors=41`, `textStyles=14`.                                                                                                                                                                                                                      |
| Full DS validator             | `npm run validate-hito-ds-components`                                                                      | External baseline failure                 | No task-owned assertion failed. The only failure is the pre-existing Brand-background on-light/on-dark assertion named in this item's blocker boundary; it was not weakened or repaired here.                                                                                    |
| Diff hygiene                  | `git diff --check`                                                                                         | Passed                                    | No whitespace errors before receipt; repeated after receipt below.                                                                                                                                                                                                               |
| Production build              | `npm run build`                                                                                            | Passed                                    | Vite client, SSR, Nitro, and `finalize-build-output` completed successfully. Existing chunk-size and third-party directive warnings were non-fatal.                                                                                                                              |
| Managed runtime admission     | `npm run qa:server:status` after build                                                                     | Blocked                                   | Server stopped; `managed:false`, `compatible:false`, `healthy:false`, `build: broken`, `artifactFreshness: stale`, `freshnessReason: artifact_missing`. The required private Admin snapshot digest `26d403fe90662a2186108b9574cffe702311f216bb372affe9b639417fb88fad` is absent. |
| Own browser matrix            | Components and Patterns; exact desktop/mobile, Dark/Light                                                  | Not run                                   | No current healthy fresh managed loopback artifact was admissible. No stale bundle, ad hoc server, gate bypass, or hosted path was used.                                                                                                                                         |
| Independent QA                | Existing `ROLE: QA`, read-only runtime-status review                                                       | Blocked by environment, not failed source | QA independently confirmed the same stopped/stale `artifact_missing` discriminator and correctly made no browser acceptance claim.                                                                                                                                               |

### Coverage gap, preservation, and next owner

Because the managed artifact could not be admitted, native route/hash history, visible browser focus,
contained App Shell rendering, table pointer/keyboard/Escape/focus-return interactions, exact
responsive scroll containment, page overflow, and console health remain unverified in a fresh
browser. The source/static/build evidence is valid, but the complete focused Implementation DoD is
not claimed.

The DESIGN SYSTEM implementation does not require a Product/Admin source change or an unresolved
design decision. PRODUCT must route the existing private Admin snapshot/runtime-admission boundary,
then return the unchanged candidate to QA for the specified browser matrix. No Global QA, release,
hosted, deployment, Product adoption, or Figma acceptance is claimed.

Role file: `agents/design-system.agent.md`. Skills used:
`skills/hito-frontend-design-system/SKILL.md` and
`skills/hito-qa-browser-regression/SKILL.md`. Subagent used: existing named `ROLE: QA`, bounded and
read-only; no implementation was delegated.

## Terminal Lifecycle Reconciliation Receipt — 2026-08-14

- **Historical fact preserved:** the implementation receipt above completed source/static/build
  work but truthfully stopped browser acceptance at the then-missing managed artifact. Its blocker,
  evidence, coverage gap, and `DESIGN SYSTEM` ownership remain unchanged as historical facts.
- **Current completion evidence:** the completed
  [independent QA retry](./2026-08-13-hito-ds-reference-contract-and-table-density-independent-qa.md)
  admitted a fresh, healthy, loopback `qa_fixture` artifact and passed the full assigned Light/Dark
  desktop/mobile matrix. It found no task-owned defect and no focused coverage gap across default-
  Light Metadata Tags, explicit Accent examples, Reference Links, contained App Shell anatomy,
  Tables hierarchy/anatomy/actions/density, responsive containment, keyboard interaction, or
  console health.
- **Linked child closure:** the superseded
  [Metadata Tag shared contract](./2026-08-13-hito-ds-metadata-tag-shared-contract-and-reference-adoption.md)
  is terminalized from the same accepted implementation/QA chain. Its historic `FRONTEND (ds)`
  execution facts are preserved rather than rewritten.
- **Figma export boundary:** current `figma-export-board.tsx` remains byte-stable at
  `2c03b47d30060beed8acbf86b2978030acc6f9bda04f97ddb1cdd329d116b263`.
  The completed
  [Figma Export Surface Canonicalization](./2026-08-13-hito-ds-figma-export-surface-canonicalization.md)
  owns the six wrapper replacements; the child Metadata Tag record owns the static tag specimens.
- **Adopted bytes and boundaries:** this closure changes lifecycle documentation only and adopts
  the exact existing implementation bytes. It does not mutate runtime source, build output, Figma,
  hosted state, or Git state and does not claim Figma parity, Global QA, release readiness, or
  deployment.
- **Current blockers:** none for this focused Design System implementation/QA scope. PRODUCT owns
  any later fresh release freeze; DESIGN SYSTEM INTEGRATION remains separately gated by an approved
  editable Figma target.

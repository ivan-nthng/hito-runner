# Hito DS Card Zero-Border Policy

## Work Item ID

5c246e21-2ae7-480a-8b75-13c874d7428a

## Status

completed

## Type

Tracked — shared Design System chrome policy

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Scope

Establish and apply one Hito rule for reusable card/surface recipes: decorative perimeter borders
are absent by default. A border remains an explicit semantic choice, not a hidden default. This is
the DESIGN SYSTEM card-recipe census and canonical borderless implementation only.

## Archive Intent

Retain through the shared card-policy proof. Compact the terminal record to the admitted card
recipes, preserved structural/control edges, the two-layer elevation rule, and evidence.

## Task

Remove decorative borders from every admitted reusable Hito card/surface recipe in resting and
ordinary hover states so Ivan can assess the borderless product clearly. Do not replace every
border with a shadow. Flat cards stay flat; only a surface that is genuinely detached from its
parent uses the existing two-layer `--hito-elevation-xs` or its already-approved semantic depth.

## User Report

Ivan asked to remove borders from all card chrome first, so the actual borderless hierarchy can be
reviewed. He reiterated that the smallest shadow must still consist of two quiet layers.

## Source Investigation

- `.hito-ds-showcase-card` in `src/styles/reference-workbench.css` is already borderless; the
  new policy must not add a second recipe or regress it.
- Other visual card recipes still set a decorative hairline border, including `.hito-row-group` in
  `src/styles/controls-lists.css`, `.hito-nav-card` in
  `src/styles/calendar-state-surfaces.css`, and `.hito-launcher-card` in
  `src/styles/foundations.css`. These are not one shared selector and must be admitted by source
  role before removal.
- The accepted depth contract already defines `--hito-elevation-xs` as exactly two outer shadows.
  It deliberately does not turn elevation into a universal replacement for borders.

## Expected Behavior

- A card/surface that is purely decorative at its perimeter resolves to `border: 0`; its fill,
  radius, content hierarchy, and interaction remain coherent in Light and Dark.
- Detached overlays continue to use only their admitted two-layer elevation token. Ordinary cards
  do not gain universal shadows.
- Inputs, buttons, selection, validation, focus rings, data/table separators, calendar grid lines,
  navigation/state semantics, and meaningful structural boundaries retain their independently
  owned chrome until source evidence proves they are decorative card borders.

## Stage Plan

1. **DESIGN SYSTEM — active:** census existing reusable card/surface recipes and their consumers;
   remove only decorative perimeter borders at the canonical recipe; preserve the listed exclusions;
   use existing two-layer elevation tokens only for already-detached surfaces; update physical
   `/hitoDS` references and focused validation.
2. **PRODUCT:** review any card recipe that cannot be classified as decorative versus structural,
   and dispatch the correct Product/DS owner rather than applying a blanket selector.
3. **QA:** independently replay the admitted shared card references. Global QA is not part of this
   item.

## What Not To Touch

Do not add a global `border: 0` reset; a generic card abstraction; literal colours; a shadow-only
card system; Material Design values; Local Inspector code; Backend, calendar/workout truth, fixture
data, persistence, Figma, hosted state, dependencies, staging, commit, push, or deployment. Do not
absorb the separate Light token-specimen fill bug in
`2026-08-17-hito-ds-foundations-light-token-specimen-surface-contrast-batch`.

## Validation Expectations

DESIGN SYSTEM proves a source-backed recipe/consumer matrix; zero computed decorative border at
each admitted Light/Dark card reference; existing focus, selected/error states and structural edges;
the exact two-layer computed elevation where detachment remains admitted; desktop/mobile
containment; focused Design System checks, manifest parity, formatting, and diff hygiene. If a
required consumer belongs to another production owner, stop with its first owner and do not patch
it locally. QA then independently verifies the accepted shared result with a fresh loopback
`qa_fixture`.

## Stage

DESIGN SYSTEM implementation completed

## Next Recommended Role

PRODUCT

## Blocker

None for this Design System slice. The unrelated current-documentation assertion in the full Design
System validator and the Product-owned legacy `.hito-nav-card` adoption remain outside this item.

## Execution Preflight — 2026-08-17

- **Outcome:** make admitted reusable visual cards borderless at their canonical Design System
  owners while retaining structural, control, state, selection, validation, and detached-overlay
  edges.
- **Existing seams:** `src/styles/overlays-feedback.css`,
  `src/styles/reference-workbench.css`, `src/styles/foundations.css`, the existing
  `HitoNavigationCard`, its `/hitoDS/patterns#navigation-card` reference, and the existing Design
  System validator.
- **New runtime artifacts:** none.
- **Obsolete responsibility:** remove decorative perimeter declarations from the admitted recipes
  and delete the unreachable outer `.hito-launcher-card` recipe now superseded by
  `.hito-launch-surface`. No compatibility selector remains.
- **Dirty boundary:** preserve all unrelated working-tree hunks; do not edit Local Inspector or
  Product-route source/CSS.

### Source-backed recipe / consumer matrix

| Recipe / owner                                                                                             | Reachability and role                                                                              | Decision                                                                                                                                                                     |
| ---------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `.hito-surface` / `overlays-feedback.css`                                                                  | Two ordinary content-card consumers plus the shared Popover composition                            | Remove the decorative default border; preserve Popover's meaningful detached edge explicitly at the existing `.hito-ui-popover-surface` owner. Keep the ordinary cards flat. |
| `.hito-surface-flat` / `overlays-feedback.css`                                                             | Shared across Product, Admin, Auth, Completion, and `/hitoDS`; perimeter communicates no state     | Remove the decorative default border; add no shadow. Remove the one redundant DS Brand border utility.                                                                       |
| `.hito-surface-quiet` / `reference-workbench.css`                                                          | Reference-only quiet card/interactive surface; current border is transparent and has no state role | Resolve to `border: 0`; retain hover fill and focus ring. Shell profile trigger keeps its independently owned control geometry.                                              |
| `HitoNavigationCard` / `src/components/ui/hito-navigation-card.tsx`                                        | Canonical native-anchor primitive with two physical Pattern specimens                              | Remove only `border border-hairline`; retain fill, hover, native link, and whole-card focus ring. Keep it flat.                                                              |
| `.hito-launcher-card` / `foundations.css`                                                                  | Zero outer-card consumers; `.hito-launch-surface` is the live borderless Hub/Brand owner           | Delete only the unreachable outer recipe and its hover branch. Retain live icon/footer anatomy and `.hito-launch-surface` depth.                                             |
| `.hito-ds-showcase-card`, `.hito-ds-token-specimen-surface`, `.hito-state-surface`, `.hito-launch-surface` | Live canonical references already resolve to `border: 0`                                           | Preserve as accepted zero-border baselines.                                                                                                                                  |
| `.hito-row-group`                                                                                          | Shared clipped row/list container with child separators and broad Product/Admin/DS reach           | Retain its structural perimeter; it is not an ordinary decorative card.                                                                                                      |
| `.hito-nav-card` / `calendar-state-surfaces.css`                                                           | Sole consumer is the Product Workout route; separate Product adoption item owns retirement         | Do not edit. Return the Product-owned legacy boundary rather than masking it in DS.                                                                                          |
| Overlay, field, control, table, shell, calendar, selected/invalid/focus edges                              | Independent semantic or structural owners                                                          | Retain. Detached overlays keep their admitted two-layer elevations; no ordinary card receives a shadow.                                                                      |

### Explicit card-border semantic role

- The approved explicit perimeter for an eligible card remains exactly `1px solid
var(--color-hairline)` (the existing `border border-hairline` contract). This is an opt-in card
  presentation, not the reusable recipes' default and not a substitute for focus, selection,
  validation, data, or structural edges.
- Eligible recipes are only the canonical borderless visual-card owners established by this
  census: `.hito-surface`, `.hito-surface-flat`, `.hito-surface-quiet`, `HitoNavigationCard`,
  `.hito-ds-showcase-card`, `.hito-ds-token-specimen-surface`, `.hito-state-surface`, and
  `.hito-launch-surface`. A future caller must positively identify one of these roles; generic
  rounded elements, overlays, fields, controls, tables, calendar cells, timeline segments,
  `.hito-row-group`, and the Product-owned legacy `.hito-nav-card` are not eligible by inference.
- This item defines only the Design System role and its eligible owners. Local Inspector behavior,
  intent capture, and any side-specific control are owned by the separate FRONTEND DevTools item
  and remain unimplemented here.

### Browser Path Preflight

- **Validation layer:** focused Design System Implementation DoD for the admitted card/surface
  recipes; this is not Global QA or release acceptance.
- **Runtime:** repository-managed loopback `qa_fixture`, freshly rebuilt and admitted with
  `managed=true`, `compatible=true`, `healthy=true`, build present, and
  `artifactFreshness=fresh` / `receipt_matches` before navigation.
- **Routes and matrix:** `/hitoDS/patterns#surfaces`,
  `/hitoDS/patterns#navigation-card`, `/hitoDS/brand#gradient-overlays`, and
  `/hitoDS/foundations#motion` at 1470x801 and 375x812 in Light and Dark.
- **Checks:** zero computed perimeter on admitted flat/quiet/navigation/launch surfaces; preserved
  structural row edge; preserved Popover hairline plus admitted two-layer elevation; pointer and
  keyboard focus; containment; and clean console.
- **Preservation:** no Product, fixture/data, Local Inspector, hosted, Figma, or Git-lifecycle
  mutation.

## Tracked Implementation Receipt — 2026-08-17

### Task and stage

- **Task:** Hito DS Card Zero-Border Policy.
- **Stage:** Design System source census, canonical recipe correction, focused static/build proof, and
  browser replay completed.
- **Validation layer:** focused Design System Implementation DoD only; no Global QA, release,
  deployment, hosted, or Figma acceptance is claimed.

### Preflight and root cause

- The source census proved that decorative card chrome was distributed across canonical recipes,
  so a global reset or route-local workaround would have removed meaningful structural edges.
- The first incorrect owners were the shared `.hito-surface`, `.hito-surface-flat`, and
  `.hito-surface-quiet` recipes plus the canonical `HitoNavigationCard` composition. The live
  `.hito-launch-surface`, token specimen, showcase, and State Surface recipes were already
  borderless baselines.
- The current consumer map independently confirmed that the outer `.hito-launcher-card` recipe had
  zero consumers. It was deleted with its hover branch; the live `.hito-launch-surface` and the
  still-reachable icon/footer anatomy remain.
- **New runtime artifacts:** none. No generic Card family, token, compatibility selector, global
  reset, or universal shadow replacement was introduced.

### Files changed

- `src/styles/overlays-feedback.css` — removed decorative borders from `.hito-surface` and
  `.hito-surface-flat`; preserved the detached Popover's explicit Hairline edge and existing
  two-layer elevation at its canonical owner.
- `src/styles/reference-workbench.css` — removed the transparent perimeter from
  `.hito-surface-quiet`; retained hover and focus behavior.
- `src/components/ui/hito-navigation-card.tsx` — removed only the decorative Hairline utility from
  the native-anchor card; retained fill, hover, navigation, and whole-card focus-visible behavior.
- `src/styles/foundations.css` — deleted the unreachable outer `.hito-launcher-card` recipe and its
  hover branch; retained `.hito-launch-surface` and live launcher icon/footer anatomy.
- `src/components/hito-ds/reference-brand-page.tsx` — removed one redundant direct Hairline utility
  from the already canonical `.hito-surface-flat` specimen.
- `scripts/validate-hito-ds-component-contracts.ts` — added focused assertions for admitted
  borderless owners, retained Popover/row structural edges, the dead launcher selector, and the
  redundant Brand class.
- This canonical item — recorded the source-backed matrix, explicit Hairline eligibility rule,
  validation, and closure.

### Removed and retained chrome

- Removed only proven decorative perimeters from ordinary flat/quiet/navigation surfaces. Flat
  cards remain flat; no generic card received elevation as a border substitute.
- Retained control, focus, selected, validation, table/data, calendar, timeline, and shell edges.
  `.hito-row-group` retains its structural perimeter and child separators.
- Retained the Popover's explicit `1px solid var(--color-hairline)` edge and its existing exact
  two-layer `--hito-elevation-sm` output because it is a detached overlay.
- The approved future explicit card-border role is the existing canonical Hairline:
  `1px solid var(--color-hairline)` / `border border-hairline`. It is opt-in only for the eligible
  borderless visual-card owners listed in the preflight, never inferred from generic rounding or
  used instead of semantic/interactive structure.

### Validation

| Check                       | Scenario / environment                                                                                              | Result                     | Evidence                                                                                                                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source and consumer census  | Canonical recipes and repository reachability                                                                       | Passed                     | Every admitted recipe has a documented role/consumer decision; `.hito-launcher-card` had zero outer consumers before deletion; `.hito-nav-card` remained Product-owned and untouched.                                                                                                                                                                   |
| Focused formatting and lint | Changed TypeScript/TSX/Markdown seams                                                                               | Passed                     | Focused Prettier and ESLint completed without task-owned errors.                                                                                                                                                                                                                                                                                        |
| Manifest parity             | Existing Hito DS generator in check mode                                                                            | Passed                     | Generated truth remained current: 43 primitive colours, 41 semantic colours, and 14 text styles.                                                                                                                                                                                                                                                        |
| Design System validator     | Full existing validator plus the new focused card-policy assertion                                                  | Partial, unrelated gate    | The task-owned zero-border/retained-edge assertion passed. The full command remains red only on the unrelated current-documentation assertion: `Current product, system, and state docs must record the production-shipped /hitoDS role.` No validator weakening or cross-owner repair was made.                                                        |
| Diff hygiene                | `git diff --check`                                                                                                  | Passed                     | No whitespace errors were reported.                                                                                                                                                                                                                                                                                                                     |
| Production build            | Repository-managed `qa_fixture` rebuild                                                                             | Passed                     | A fresh managed build/runtime was admitted with `managed`, `compatible`, `healthy`, build present, `qa_fixture`, and `fresh/receipt_matches` before browser navigation.                                                                                                                                                                                 |
| Browser matrix              | `/hitoDS`, Patterns, Brand, Foundations Popover, and representative Login surface; 1470x801 and 375x812; Light/Dark | Passed                     | Admitted showcase, navigation, flat, quiet, State Surface, token specimen, launch, and ordinary surface owners computed to zero perimeter; all pages remained contained. Structural row groups retained their 1px edge. Popover retained a 1px Hairline plus exactly two outer shadow layers.                                                           |
| Interaction and console     | Navigation/launch hover and focus-visible; reference routes                                                         | Passed with closeout drift | Hover fill/elevation and visible focus rings were preserved with zero perimeter, and console warn/error output was empty. The final redundant focus retry occurred after the loopback process had stopped (`ERR_CONNECTION_REFUSED`); it adds no fresh claim and does not replace the completed interaction evidence on unchanged runtime-source bytes. |

### Boundaries and next owner

- The Product-owned legacy `.hito-nav-card` remains untouched and is governed by the separate
  Product adoption item. No Product route CSS was modified.
- Local Inspector border intent and side selection are wholly owned by the separate FRONTEND
  DevTools task; no Inspector behavior or documentation was implemented here.
- The separate Light token-specimen fill defect remains untouched.
- **Next owner:** PRODUCT may route the Product navigation-card adoption and the independent
  documentation-validator gate separately. No further Design System implementation is required for
  this item.

### Operating record

- **Role file:** `agents/design-system.agent.md`.
- **Project skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md` for the focused local browser procedure.
- **Subagents:** none; implementation and evidence integration remained with DESIGN SYSTEM.

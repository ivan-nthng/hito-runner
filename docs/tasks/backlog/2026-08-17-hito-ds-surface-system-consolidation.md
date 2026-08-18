# Hito DS Surface System Consolidation

## Work Item ID

2026-08-17-hito-ds-surface-system-consolidation

## Status

backlog

## Type

Tracked — shared Design System surface consolidation

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Depends On

- [Hito DS Navigation Card Quiet Surface Composition](./2026-08-17-hito-ds-navigation-card-quiet-surface-composition.md)
- [Hito Local Inspector Side-Specific Border Intent Controls](./2026-08-17-hito-local-inspector-semantic-add-border-intent.md)

## Scope

Consolidate ordinary reusable Hito card/surface chrome into one canonical Design System surface
contract, rather than allowing independent card-like recipes to grow. The contract must cover
neutral visual surfaces, bounded `sm` / `md` / `lg` geometry, and the already-approved two-layer
elevation scale; semantic messages remain explicit state compositions, not generic cards.

## Archive Intent

Retain through the source-backed migration and independent browser acceptance. Compact the terminal
record to the adopted surface contract, migrated/deleted recipes, preserved semantic exceptions,
and evidence.

## Task

After both dependencies are complete, establish one visual Surface system for reusable card chrome.
Ordinary content must no longer choose from unrelated radius, fill, hover, padding, shadow, and
border recipes. A surface can be neutral/quiet, have bounded size, and opt into an admitted depth;
its default is borderless and unelevated.

`HitoStateSurface` remains the canonical message contract with explicit tone and action semantics.
Audit `hito-surface-wash` against it: if both express the same message role, migrate every proven
consumer to the canonical state contract and remove the duplicate recipe. Retain a separate wash
only if source-backed semantics cannot be represented by State Surface, documenting the exact
distinction and avoiding overlapping APIs.

`HitoNavigationCard` remains a semantic native-anchor composition over the shared quiet visual
surface. `hito-row-group`, tables, calendar grids, fields, buttons, dialogs, sheets, popovers, and
other structural or overlay owners are not ordinary cards and must not be forced into this system.

## User Report

Ivan wants one source of styles for ordinary cards, not many near-identical card recipes. He wants
consistent size and quiet two-layer depth choices, while messages remain understandable and
Navigation Card reuses a shared visual card style instead of creating a new one.

## Source Investigation

- [styles.css](../../../src/styles.css) is the sole stylesheet entry point. It imports focused
  owner files; the source-of-truth rule is one owner per contract, not one monolithic CSS file.
- `hito-surface-flat` and `hito-surface-quiet` are ordinary visual recipes. State Surface already
  carries bounded `sm` / `md` / `lg` geometry and semantic tones/actions.
- The approved `--hito-elevation-xs` through `--hito-elevation-xl` tokens are exactly two outer
  shadows, but ordinary card recipes do not yet expose one bounded depth contract.
- `hito-surface-wash` and `hito-state-surface` both represent whole-surface state treatment; their
  semantic overlap must be resolved by a consumer/behavior audit before a migration.
- `hito-row-group` is a clipped structural list; Popover/Dialog/Sheet are detached overlays;
  neither is evidence for a generic Card API.

## Expected Behavior

- One canonical surface contract owns ordinary card fill, radius, border default, bounded size, and
  admitted depth. No route or semantic component carries a second ordinary-card recipe.
- `flat` and `quiet` remain the only admitted ordinary visual treatments unless the audit proves a
  missing non-overlapping role.
- Standard geometry is `sm` / `md` / `lg`; responsive narrowing follows the existing small-screen
  surface rule rather than adding per-caller padding overrides.
- Depth is `none` by default; `xs` through `xl` use only existing two-layer elevation tokens and
  only when a surface is genuinely detached. It is never a universal decoration.
- State messages use one canonical State Surface semantic contract, with truthful tone/action
  behavior. Navigation is a semantic composition, not a new visual card family.

## What Not To Touch

- Do not make a global `Card` abstraction, arbitrary variant API, route-local compatibility
  classes, raw colours, literal shadows, a global border reset, or an unbounded padding/depth
  picker.
- Do not alter the User-facing Runner model, Product-owned `.hito-nav-card`, Local Inspector
  intent/payload behavior, Backend, fixtures, persistence, Figma, hosted state, dependencies, Git
  lifecycle, or release state.
- Do not merge structural list/table/calendar/field/control edges or detached overlay semantics into
  ordinary surfaces merely because they are rectangular.

## Stage Plan

1. **Dependencies:** DESIGN SYSTEM finishes Navigation Card quiet composition; FRONTEND DevTools
   finishes the border-intent contract. No work on this item overlaps either write boundary.
2. **DESIGN SYSTEM:** produce one recipe → consumer → semantic-role matrix, choose the smallest
   canonical Surface implementation using existing owners/tokens, migrate admissible consumers,
   and delete every proven superseded recipe rather than leaving compatibility duplicates.
3. **QA:** independently replay the migrated ordinary surfaces, State Surface messages, and
   Navigation Card on the admitted shared references. Global QA remains separate.

## Execution Preconditions

- Both `Depends On` items are terminal `completed` with their focused proof.
- The current checkout and canonical Design System references are inspected freshly; no deprecated
  or reference-only selector is silently promoted without consumer evidence.
- DESIGN SYSTEM confirms that the full task is inside its canonical CSS/component/reference/validator
  ownership. If Product-route consumers require behavior changes, stop with their first owner.

## Definition Of Done

1. A source-backed matrix classifies each card-like recipe and all consumers as ordinary Surface,
   semantic State Surface, structural container, overlay, or an explicitly preserved exception.
2. One canonical ordinary Surface contract supplies flat/quiet treatment, `sm` / `md` / `lg`
   geometry, borderless default, and bounded existing elevation tokens; superseded ordinary-card
   chrome is removed.
3. Navigation Card composes the quiet treatment and owns no duplicate ordinary-card chrome.
4. State Surface is the single canonical message contract, or the retained wash distinction is
   evidenced with non-overlapping semantics and no duplicated configuration API.
5. Light/Dark desktop/mobile references prove surface size, depth, hover/focus, message tone/action,
   native navigation, containment, and console health; focused static/manifest/build/diff checks
   and independent QA acceptance are recorded.

## Deferred Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Surface System Consolidation
Mode: Tracked
Canonical item: docs/tasks/backlog/2026-08-17-hito-ds-surface-system-consolidation.md

Do not start until both listed dependencies are terminal and PRODUCT confirms their current receipts.
Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md.
Re-check the canonical item, current worktree, style entry point, all current card-like recipes,
their consumers, and existing `/hitoDS` references before writing.

Ivan's accepted outcome is one bounded ordinary Surface system, not a monolithic Card component or
an unbounded variant API. First build one recipe → consumer → semantic-role matrix. Classify each
candidate as ordinary Surface, semantic State Surface, structural container, overlay, or a proven
exception. Use existing tokens and owners. The default ordinary surface is borderless and has no
depth; admitted depth uses only the existing two-layer elevation tokens.

Consolidate ordinary card chrome into one canonical flat/quiet Surface contract with sm/md/lg
geometry. Migrate only source-proven admissible consumers and delete each superseded recipe; do not
leave compatibility selectors. HitoNavigationCard remains a native-anchor composition over quiet,
not a visual card family. Audit hito-surface-wash against HitoStateSurface. If their whole-surface
message semantics overlap, migrate all admitted consumers to State Surface and remove wash. Retain
wash only with evidence of a non-overlapping semantic responsibility that State Surface cannot
represent; do not create parallel tone/action APIs.

Do not touch Product-owned hito-nav-card, Local Inspector, Backend/persistence, fixture data,
Figma, hosted state, dependencies, or Git lifecycle. Do not fold rows, tables, grids, fields,
controls, Popover/Dialog/Sheet, or other structural/overlay owners into ordinary Surface. Return to
PRODUCT if Product behavior changes, a new token/API, or another implementation owner is needed.

Run a risk-derived Design System matrix in Light/Dark at desktop and 375px for ordinary surfaces,
depth, State Surface messages/actions, and Navigation Card. Prove hover/focus, native navigation,
containment, console health, source reachability/deletions, focused Prettier/ESLint/DS validator/
manifest checks, production build, and diff hygiene. Use independent QA for browser acceptance.
Record the English tracked receipt in this canonical item; do not claim Global QA or release
readiness.
```

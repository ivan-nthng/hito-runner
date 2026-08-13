# Hito DS Foundations Color Information Architecture

## Work Item ID

2026-08-11-hito-ds-foundations-color-information-architecture

## Status

completed

## Type

design-system-information-architecture

## Priority

high

## Owner

design_system

## Scope

Make `/hitoDS` Foundations a clear live reference for existing Hito color roles and primitives.
This task changes documentation presentation and manifest coverage only after an accepted Designer
direction; it does not redesign Hito colors or product UI.

## Archive Intent

retain_in_place

## Task

Replace the current mixed Foundations color gallery with one concise theme-reactive reference that
answers where each existing color role is used.

## User Report

The existing Foundations page is visually and conceptually mixed: semantic roles, raw primitives,
and a separate static light palette compete with each other. Ivan needs direct visual hierarchy,
not explanatory prose:

1. Surfaces
2. Borders
3. Typography
4. Neutral chrome / overlays
5. Actions
6. Status / intent

Primitives must show every real Hito primitive token, grouped by hue and ordered from `100` to
`950` where defined. Missing shades must not be fabricated. A third Context tab must show existing
roles working together on real layers and typography under the global theme control.

## Evidence And Existing Seams

- `src/components/hito-ds/reference-foundations-page.tsx` currently has only `semantic` and
  `primitive` tabs, explanatory cards, and a mixed grouping unrelated to the requested usage
  hierarchy.
- The page imports and renders `src/components/hito-ds/light-palette-reference.tsx`, a static
  `data-hito-theme="light"` palette that duplicates the live global theme control.
- `scripts/generate-hito-ds-manifest.mjs` currently exports only the primitive alias closure used
  by semantic mappings, so `/hitoDS` cannot display every defined primitive token.
- `scripts/validate-hito-ds-component-contracts.ts` still has a dedicated
  `light-palette-reference.tsx` source expectation.
- `src/styles/foundations.css` is the canonical existing color source. Its semantic Dark/Light
  resolution and current accessibility decisions remain authoritative.

## Demonstrated Cause

Foundations presentation currently combines a semantic API list, a filtered primitive export, and a
second static theme snapshot. That structure does not map colors to their product use and makes the
same theme appear as two competing palette systems.

## Accepted Product Direction

- One existing global System / Dark / Light control governs every semantic and Context specimen.
- Remove explanatory intro copy and per-card `maps to dark/light` prose. A specimen may contain
  only role name, live swatch, token code, and essential contrast pairing.
- Semantic sections appear in exactly this order: Surfaces; Borders; Typography; Neutral chrome /
  overlays; Actions; Status / intent.
- Primitive colors are a raw token inventory grouped by hue and numerically ordered. They never
  become a Product consumption API.
- Delete the standalone static Light semantic palette and its rendering/imports.
- Add a third `Context` tab that demonstrates real existing semantic combinations: structural
  layers, borders, text hierarchy, neutral chrome, actions, and status colors. It is not an editor,
  palette picker, or new component family.

## What Not To Touch

- Do not alter Hito primitive values, semantic Dark/Light mappings, accessibility contracts, Product
  routes/styles, shared component APIs, Figma, Backend, persistence, manifests beyond truthful full
  primitive coverage, or unrelated dirty work.
- Do not invent absent `100`–`950` steps, a second palette, a new token system, a color editor, or
  route-local colors.
- The older `2026-06-08-light-dark-mode-and-color-palette-expansion.md` is historical backlog
  context, not a current implementation source or alternate owner.

## Stage

Design System implementation using the accepted Designer direction below.

## Validation Expectations For The Later Design System Stage

- Manifest parity includes every actual primitive color definition.
- DS validator is updated for the deleted static palette and the live Context surface.
- `/hitoDS` desktop and exact `375×812` render in Dark and Light without overflow.
- Context proves contrast-critical existing role pairings; no color-value redesign is claimed.

## Next Recommended Role

design_system

## Completed Designer Scope

The accepted Designer direction is recorded below. It defines the three-tab information
architecture and does not alter a color value, token map, primitive, Product route, or Figma file.

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Implement the accepted Hito DS Foundations Color Information Architecture.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-foundations-color-information-architecture.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item, including the accepted Designer Direction
- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/components/hito-ds/light-palette-reference.tsx`
- `src/styles/foundations.css`
- `scripts/generate-hito-ds-manifest.mjs`
- `scripts/validate-hito-ds-component-contracts.ts`
- `src/generated/hito-ds-manifest.ts` and `.json`

Outcome:
Turn Foundations into one live, quiet, three-tab reference: Semantic Colors, Primitives, and
Context. Implement the accepted section order and deletion list exactly. Reuse the existing
Foundations page, `useHitoTabs`, enclosed tabs, semantic-card/swatches, typography, field, choice,
button, status, and focus primitives. Do not create a new component family, a second theme switch,
an editor, a palette, token values, or any Product-facing UI.

Required implementation:
1. Semantic Colors has exactly these ordered headers: Surfaces; Borders; Typography; Neutral chrome
   / overlays; Actions; Status / intent. Remove visible intro prose, `maps to dark/light` prose,
   primitive meta prose, and non-token gradient/overlay entries from this tab.
2. Keep the existing global System / Dark / Light preference as the only theme control. Delete
   `src/components/hito-ds/light-palette-reference.tsx` and its imports/rendering; do not retain a
   compatibility wrapper or replacement static Light snapshot.
3. Make the manifest primitive-color collection expose every actual existing `primitive-color`
   export token, excluding only already-explicit non-public workout-domain bases. Regenerate both
   checked-in manifest files. Do not add, rename, or fabricate any Foundation shade.
4. Present primitives by actual hue family and ascending numeric token step. Preserve actual
   intermediate values and alpha variants; absent scale steps remain absent.
5. Add Context in the existing Foundations page only. It uses real semantic roles and existing
   compositions to show layers, type hierarchy, neutral chrome, actions, status/intent, and focus
   without a new runtime file or custom color recipe.
6. Update only task-owned DS validator expectations: complete primitive coverage, deleted static
   palette, requested Semantic order, and Context reachability.

Boundaries:
- Do not change `src/styles/foundations.css` color values or semantic Dark/Light mappings.
- Do not touch Product routes/styles, Backend, persistence, Figma, dependencies, or unrelated dirty
  work.
- Do not stage, commit, push, deploy, access hosted state, or call providers.
- Preserve existing semantic token names unless a source-backed zero-reachability deletion is
  required by the accepted Designer direction.

Reuse-first budget:
- Existing owner: `reference-foundations-page.tsx`; smallest UI change is recomposition inside that
  page.
- New runtime artifacts: none.
- Remove the static Light palette and obsolete validator expectation instead of retaining a second
  documentation path.

Validation:
- Manifest generation/parity and `npm run validate-hito-ds-components`.
- Focused ESLint, Prettier, and `git diff --check`.
- Fresh production build.
- Desktop and exact 375×812 in Dark and Light: three tabs, live theme resolution, no page overflow,
  Semantic section order, full actual primitive inventory, Context role pairings, copy/focus, tab
  keyboard behavior, and clean browser console.
- Use one bounded read-only QA/browser subagent after your focused check. Reuse the accepted
  Designer Direction; do not request a second design decision unless source proves a conflict.

Use Russian for in-progress commentary. Append an English implementation receipt to this canonical
item. State changed/deleted owners, manifest coverage, browser evidence, omitted coverage, and the
Global QA boundary.
```

## Blockers

None.

## Designer Direction — Compact Live Color Reference

### Decision

Foundations will become one live, three-tab reference driven exclusively by the existing global
System / Dark / Light preference. It will distinguish **semantic roles** (the Product API),
**raw primitives** (the inspected source inventory), and **Context** (the real combinations users
need to judge). It will not add a palette, an editor, a second theme switch, or a component family.

The current confusion has a demonstrated presentation cause: `Semantic Colors` interleaves role
names, source-alias prose, and non-token overlays; `Primitive` is a filtered alias closure; and
`HitoDsLightPaletteReference` adds a competing, hard-scoped Light snapshot. The corrective
information architecture is therefore reduction and separation, not a colour redesign.

### Tab 1 — Semantic Colors

Keep the existing `useHitoTabs` owner and enclosed Hito tab primitive. Add `Context` to its existing
tab list; no second navigation control is needed. The active tab has no intro paragraph or
theme-mapping explanation.

Show exactly these section headers, in this order. Each semantic token appears once only:

| Section                       | Tokens                                                                                                                                                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Surfaces**                  | `background`, `surface`, `surface-elevated`, `card`, `popover`, `muted`                                                                                                                                            |
| **Borders**                   | `border`, `hairline`, `input`, `ring`                                                                                                                                                                              |
| **Typography**                | `foreground`, `card-foreground`, `popover-foreground`, `muted-foreground`, `text-secondary`, `text-tertiary`, `text-disabled`, `text-accent`, `text-positive`, `text-negative`, `text-informative`, `text-warning` |
| **Neutral chrome / overlays** | `chrome-clear`, `chrome-subtle`, `chrome-standard`, `chrome-strong`, `chrome-edge-default`, `chrome-edge-emphasis`                                                                                                 |
| **Actions**                   | `primary`, `primary-foreground`, `accent`, `accent-foreground`, `signal`, `signal-foreground`                                                                                                                      |
| **Status / intent**           | `success`, `success-foreground`, `warn`, `info`, `info-foreground`, `destructive`, `destructive-foreground`                                                                                                        |

Each copyable specimen retains the existing semantic-card interaction and focus contract, but its
visible content is reduced to: role name, a live swatch, `var(--token)`, and, only where a paired
foreground exists, a compact `on var(--…-foreground)` pairing. It must not show group names inside
the card, `maps to dark/light`, alias narratives, descriptions, or a separate Light value.

`hito-auth-photo-overlay` and `hito-editorial-signal-wash` are presentation recipes rather than
semantic color tokens. Remove them from this tab; retain their existing isolated `#gradient-overlays`
documentation outside the color-token reference.

### Tab 2 — Primitives

This is an inspection inventory, not a Product consumption guide. It displays every actual token in
the `primitive-color` export section of `src/styles/foundations.css`, excluding the explicitly
non-public workout-domain bases. The generated manifest must expose that complete existing export
instead of only the current semantic alias closure.

Render one hue-family section per actual source family, with only its family header and swatches:

- Stone, Sand, Amber, Blue, Terracotta, Green, Orange, Red;
- Warm white, Linen, Ink, and Taupe as distinct light-theme families;
- alpha variants remain inside their owning Sand or Taupe family after opaque values.

Within each family, order numeric steps ascending (`50`, `75`, `100`, … `950`), preserving real
intermediate steps such as `825`, `850`, and `750`. Non-numeric `warm-white` precedes its light
neutral relatives. Missing values remain absent: no fabricated Tailwind-like ramps, no empty
placeholders, and no generic “Signal and feedback” or “Light theme analogs” catch-all group.

The existing swatch-button composition remains appropriate: live fill, token code, copy affordance,
and an accessible name. Remove the current `meta` prose. Raw values may be inspectable but do not
change the rule that Product code consumes semantic roles.

### Tab 3 — Context

Context is one concise composition specimen, not three more galleries. It uses only real semantic
tokens and existing Hito typography/component compositions. It reacts instantly to the global theme
preference because it creates no local `data-hito-theme` wrapper.

Its content is limited to three visually distinct modules:

1. **Layers** — a nested, labelled structural stack: Canvas → Surface → Elevated / Card → Popover.
   Each layer shows its semantic token code. The stack is the sole demonstration of containment and
   elevation; it does not duplicate every surface as a card grid.
2. **Type** — the existing Hito UI page/section/panel, body, label, caption, and technical-mono
   roles on their real semantic layers. The text ladder shows `foreground`, secondary, tertiary,
   and disabled content together, rather than applying arbitrary opacity to one body sample.
3. **Interactive and intent** — existing `HitoButton`, Field/Input, choice, status-pill/marker, and
   focus-ring compositions showing action, neutral chrome, and success/warn/info/destructive roles.
   The specimen uses labels and text in addition to hue; it never makes a state colour-only.

Use existing `hito-surface-flat`, `hito-surface-quiet`, `hito-reference-note`, Hito typography,
Buttons, Field/Input, choice, tabs, status, and icon primitives where they already match. This task
does not authorize a `FoundationContext` runtime component, a new CSS recipe, simulated product
state, or a color-control interface.

### Required Removals

- Delete `src/components/hito-ds/light-palette-reference.tsx` and its import/rendering from
  `reference-foundations-page.tsx`.
- Delete its dedicated validator expectation; update the validator to require the three live tabs
  and the Context specimen instead.
- Remove the visible `Color documentation`, Semantic Colors, and Primitive explanatory paragraphs,
  current primitive metadata labels, and semantic `maps to dark/light` output.
- Remove the two non-token gradient/overlay entries from `SEMANTIC_COLOR_TOKENS`; do not remove
  their existing dedicated documentation.

### Responsive And Accessibility Constraints

- Preserve the existing tabs’ roving keyboard focus, `aria-selected`, labelled panels, and mobile
  horizontal containment. At `375×812`, the three labels may use the existing scrollable enclosed
  tabs contract; the page itself must not overflow.
- Semantic and primitive grids use one column at narrow widths, two where existing grid space
  permits, and three or four only at the current wider breakpoints. Do not introduce pixel-specific
  layout constants.
- Every interactive swatch remains a native button with a token-specific accessible name. Focus
  uses the existing semantic ring; color alone is never the only copy/state cue.
- Context text and indicators must use their intended semantic foreground/ring pairs. Required
  contrast remains the current Hito accessibility contract: no local alpha or raw primitive text
  workaround is permitted.
- The global sidebar/mobile `ThemePreferenceChoiceGroup` is the only visible System / Dark / Light
  chooser. The `System` option must continue to resolve naturally; Context and all semantic swatches
  follow the resolved document theme.

### Bounded Design System Recommendation

**Next owner: DESIGN SYSTEM.** Reuse `reference-foundations-page.tsx`, the existing manifest
generator, generated manifest, DS validator, and current tabs/primitive-card compositions. Add no
runtime artifact, token, foundation value, Product CSS change, Figma mutation, or dependency.

The smallest implementation sequence is:

1. Change manifest primitive collection from the semantic alias closure to the complete existing
   `primitive-color` export, regenerate it, and retain the semantic Dark/Light mode contract.
2. Recompose the existing Foundations color block around the three tabs and the token allocation
   above; delete the static Light reference rather than retaining a compatibility wrapper.
3. Update only the task-owned DS validation assertions for complete primitive coverage, removed
   Light reference, requested semantic section order, and a live Context specimen.
4. Prove Dark/Light at desktop and exact `375×812`, tab keyboard navigation, copy affordances,
   focus visibility, Context contrast pairings, manifest parity, and zero page overflow.

No Product, Backend, Figma, or color-value implementation is required to realize this page
information architecture.

## Designer Receipt

**Stage:** Designer direction complete.

**Outcome:** A source-backed, reduction-first specification now separates live semantic roles,
complete raw primitives, and real color context. It preserves the current semantic Dark/Light
resolution and makes the static Light snapshot removable rather than giving it a new visual form.

**Files inspected:** `src/components/hito-ds/reference-foundations-page.tsx`,
`src/components/hito-ds/light-palette-reference.tsx`, `src/components/hito-ds/reference-page.tsx`,
`src/components/settings/theme-preference-controls.tsx`, `src/styles/foundations.css`,
`src/styles/reference-workbench.css`, `scripts/generate-hito-ds-manifest.mjs`,
`scripts/validate-hito-ds-component-contracts.ts`, and `src/generated/hito-ds-manifest.ts`.

**Validation:** Source mapping completed. No runtime, token, manifest, CSS, Figma, Product, or
browser mutation was performed in this Designer stage.

**Next owner:** DESIGN SYSTEM, after Product routes the accepted direction.

## Implementation Receipt

**Stage:** Completed
**Implementation DoD:** Passed

### Outcome

Foundations now has one theme-reactive color reference instead of a semantic gallery plus a
competing Light snapshot. The existing global System / Dark / Light choice controls all live
semantic swatches and the new Context view.

- Semantic Colors are grouped only as Surfaces, Borders, Typography, Neutral chrome / overlays,
  Actions, and Status / intent.
- Every actual exported primitive is visible: 43 specimens across Stone, Sand, Amber, Blue,
  Terracotta, Green, Orange, Red, Warm white, Linen, Ink, and Taupe. Actual shade steps remain
  numerically ordered; no shades were invented.
- Context reuses existing Hito surfaces, typography, actions, choice, field, focus, and status
  primitives to show `layers`, `type`, and `interactive-intent` under the active theme.
- The static `light-palette-reference.tsx` component and its import/rendering are deleted.

### Reuse And Scope

Reused the existing Foundations page, enclosed tabs, token cards, generated manifest, and DS
validator. No Foundation token value, CSS recipe, product route/style, runtime component family,
dependency, Figma artifact, or second theme switch was added. The manifest now exposes the full
existing `primitive-color` export rather than a narrower semantic-alias closure.

### Files Changed

- `src/components/hito-ds/reference-foundations-page.tsx`
- `src/components/hito-ds/light-palette-reference.tsx` (deleted)
- `scripts/generate-hito-ds-manifest.mjs`
- `scripts/validate-hito-ds-component-contracts.ts`
- `src/generated/hito-ds-manifest.ts`
- `src/generated/hito-ds-manifest.json`
- this canonical work item

### Validation

| Check             | Scenario / environment           | Result | Evidence                                                                                                                          |
| ----------------- | -------------------------------- | ------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Manifest parity   | Current Foundation source        | Passed | Complete primitive export: 43 primitives, 41 semantic colors, 18 text styles                                                      |
| DS contract       | Current checkout                 | Passed | `npm run validate-hito-ds-components` scanned 321 files                                                                           |
| Static hygiene    | Task-owned source                | Passed | Prettier, focused ESLint, and `git diff --check` passed                                                                           |
| Production build  | Fresh local build                | Passed | Client, SSR, Nitro, and postbuild completed                                                                                       |
| Desktop reference | 1470x801, Dark and Light         | Passed | Exact semantic order; live dark/light token resolution; no page overflow or console errors                                        |
| Narrow reference  | 375x812, Dark and Light          | Passed | One global theme control, keyboard Semantic -> Primitives navigation, Context modules, and no page overflow                       |
| Independent QA    | Bounded read-only browser review | Passed | Desktop and 375x812 Dark/Light, semantic order, all 43 primitives, Context, keyboard tabs, containment, and console checks passed |

### Preserved Boundaries And Handoff

Global QA, hosted/release readiness, forced-colors emulation, Figma parity, and Product adoption
are not claimed. No staging, commit, push, deployment, hosted mutation, provider call, or material
data mutation occurred. Clipboard readback is not separately claimed: token-copy buttons retained
their existing native button and callback path, but the in-app browser clipboard did not expose a
reliable readback.

**Next recommended role:** Product.
**Blockers:** None for the implemented Design System slice.

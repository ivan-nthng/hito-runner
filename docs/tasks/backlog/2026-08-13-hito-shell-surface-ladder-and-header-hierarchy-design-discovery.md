# Hito Shell Surface Ladder And Header Hierarchy Design Discovery

- **Work Item ID:** `2026-08-13-hito-shell-surface-ladder-and-header-hierarchy-design-discovery`
- **Status:** `completed`
- **Type:** `cross-shell visual-system discovery`
- **Priority:** `high`
- **Owner:** `designer`
- **Mode:** `Tracked`
- **Evidence From:** `2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas`
- **Archive Intent:** `retain_in_place`

## Task And Outcome

Research one semantic sidebar/canvas/card/header hierarchy for the live Hito DS workbench, its
contained App Shell reference, Admin workbenches, and runner `AppShell`, without changing runtime
source. The decision had to distinguish a true token/owner conflict from Local Inspector alias
ambiguity and split later DESIGN SYSTEM and FRONTEND Product implementation.

The accepted Hito contextual-polarity contract is:

| Layer                   | Dark                                                 | Light                                                |
| ----------------------- | ---------------------------------------------------- | ---------------------------------------------------- |
| Structural sidebar      | `sidebar` / `stone-950`                              | `sidebar` / `linen-75`                               |
| Working canvas          | `surface` / `stone-850`                              | `background` / `linen-100`                           |
| Deliberate nested stage | `background` / `stone-900`                           | `surface` / `linen-50`                               |
| Card/component          | Existing card, state, field, table, or overlay owner | Existing card, state, field, table, or overlay owner |
| True elevation          | `surface-elevated` or `popover`                      | `surface-elevated` or `popover`                      |

The canonical header material is sticky `top: 0`, `z-index: 30`, semantic `background` at 76%
alpha, 18px backdrop blur, a 1px `hairline` bottom edge, no shadow, and an opaque `background`
fallback. Header content remains host-specific; this decision does not create a generic shell
component or new token.

## Evidence And Decision Boundary

- `src/styles/foundations.css` already owned every required semantic role; no palette change was
  justified.
- `src/components/hito-ds/reference-page.tsx` and `src/styles/reference-workbench.css` already
  expressed the accepted live DS/Admin ladder.
- The first incorrect DS seam was the contained App Shell in
  `src/components/hito-ds/reference-components-structure.tsx`, whose background-only canvas and
  static header did not demonstrate the live contract.
- The separate Product divergence was `src/components/AppShell.tsx`: translucent desktop sidebar,
  implicit background canvas, and a 90%/`blur-xl` header without the separation edge.
- `Surface` and `Card` intentionally resolve to the same Dark value. Inspector
  `Custom (computed)` is truthful when multiple semantic aliases match and is not evidence of a
  literal/token bypass.
- Structural layer contrast is intentionally subtle, so the sidebar divider, header hairline,
  spacing, focus rings, reflow, and opaque blur fallback remain required.

The decision reused the existing semantic owners rather than a shell framework. It was informed by
[Carbon layer guidance](https://carbondesignsystem.com/elements/color/usage/),
[Fluent semantic tokens](https://fluent2.microsoft.design/design-tokens),
[Apple material guidance](https://developer.apple.com/design/human-interface-guidelines/materials),
and [WCAG Reflow](https://www.w3.org/WAI/WCAG22/Understanding/reflow). Those sources informed
principles; the token assignments above are Hito decisions.

## Downstream Ownership And Evidence

DESIGN SYSTEM had to correct the shared/contained reference first while keeping Foundations,
Runner, Inspector, and Admin behavior unchanged. FRONTEND Product then had to adopt the contract in
the existing runner `AppShell` without changing route-owned cards, data, navigation, or the separate
mobile bottom navigation.

Both owner slices now have their own terminal records:

- [Hito DS Canonical App Shell Surface And Header Contract](./2026-08-13-hito-ds-canonical-app-shell-surface-and-header-contract.md)
  owns the DS/Admin/reference implementation and focused browser/build evidence.
- [Product App Shell Surface Ladder Alignment](./2026-08-13-product-app-shell-surface-ladder-alignment.md)
  owns the runner adoption and its focused Product evidence.

This discovery changed only this document. Source inspection and documentation formatting/link/diff
hygiene passed; it ran no browser, build, runtime, Figma, hosted, release, deployment, or Global QA
validation. Later implementation receipts must not be retroactively claimed as discovery proof.

## Residual Boundary

No Ivan decision remains for this contract. A different blur/alpha aesthetic, Inspector alias
wording change, or header-content redesign is new scope. Rollback stays owner-local: DS reference
CSS/specimen and Product `AppShell` adoption revert independently without changing semantic tokens,
Admin data, route surfaces, or mobile navigation. Global QA and release acceptance remain separate.

# Hito DS Showcase Card Surface And Preview Stage

## Work Item ID

2026-08-11-hito-ds-showcase-card-borderless-surface

## Status

completed

## Type

design-system-contract

## Priority

medium

## Owner

design_system

## Mode

Lite

## Scope

The existing `/hitoDS` Overview `hito-ds-showcase-card` pattern only.

## Stage

Design System showcase-card chrome and preview-stage implementation, with bounded Design, Copy, and
post-implementation QA review.

## Next Recommended Role

PRODUCT

## Archive Intent

retain_in_place

## Task

Make the existing DS showcase-card pattern borderless and make its existing lower preview slot the
visually primary, calm demonstration stage. Preserve the internal header divider and use existing
semantic surfaces so the card reads as black/background in dark mode and remains visibly separate
from page background in light mode. The result should make the Overview quicker to scan: a
component name and its destination remain clear, while the live specimen has generous, intentional
space rather than reading as another dense paragraph.

Reuse the existing `ShowcaseCard` body slot for all card previews. Do not add a card family,
registry, prop API, token, wrapper component, or Product-facing behavior.

## User Report

Inspector captured `/hitoDS`, dark, `1470×801`, targeting
`article.hito-ds-showcase-card`. Ivan requests that cards of this exact pattern lose their perimeter
borders while retaining dividers; dark mode should read black, and light mode should use an existing
contrasting semantic background.

Follow-up Inspector report, same target/scope: the lower live-preview portion should be more
expressive, spacious, and image-like. Small control demos may be centered or composed with
deliberate space; complex demos must remain readable. Ivan supplied Astryx Components as an
information-architecture reference for simpler catalogue scanning, not as a source to copy.

## Evidence

- Inspector item: `2870afc9-7a1c-40e2-af0b-4cf71a6c04b9`.
- Follow-up Inspector item: `de2bee16-ec9d-474b-a1e7-0dfc0fba4485`, captured `/hitoDS`, dark,
  `1470×801`, with scope **All cards like this**.
- User-supplied visual reference is retained at
  `docs/tasks/backlog/assets/2026-08-11-hito-ds-showcase-card-borderless-surface/astryx-components-reference.png`.
- [Astryx Components](https://astryx.atmeta.com/components) is a directional IA reference only:
  large, calm visual stages support scanning; Hito must retain its own primitives, semantics,
  theme tokens, routes, and behaviour.
- `src/styles/reference-workbench.css:426-432` is the sole shared definition. It currently uses a
  hairline perimeter border, `--radius-xl`, and a transparent surface mix.
- `src/components/hito-ds/reference-overview-page.tsx:396-416` is the only consumer and canonical
  layout owner. Its existing lower body slot is at line 414.
- `src/components/hito-ds/reference-overview-page.tsx:407` owns the internal header
  `border-b border-hairline`; it must remain.
- The body slot currently contains 14 different real specimens. Simple action/menu/status/tooltip
  specimens can safely centre inside a stage; Field, Slider, Banner, App Shell, Row, Tabs, Shell
  Navigation, Data Table, and Disclosure specimens must retain their truthful usable width and
  intrinsic layout.
- Existing semantic tokens are `--color-background` (dark black/background) and `--color-surface`
  (the light-theme contrasting surface). No arbitrary color is required.

## Demonstrated Owner And Boundary

The first incorrect owner is DESIGN SYSTEM: the target is a positive shared DS showcase class,
though it currently has one consumer. This task changes only its own canonical showcase-card chrome;
it does not authorize a global change to `hito-surface-flat`, `hito-state-surface`, Product cards, or
other borders.

## Expected Behavior

- No perimeter border on any `hito-ds-showcase-card` instance.
- Existing header divider remains visible.
- Dark card background reads as the existing semantic background, without a new black value.
- Light card background remains visibly distinct from its page background using an existing semantic
  surface token.
- Current padding, responsive grid, typography, links, internal divider, and current
  `--radius-xl` radius remain unchanged; the Inspector did not request a radius change.
- Each card has one calmer, more generous lower live-preview stage that makes the specimen visually
  primary without obscuring its component title or `Open` deep link.
- Centre small, self-contained action/menu/status/tooltip specimens in that stage using existing
  composition utilities. Do not centre, narrow, or otherwise distort complex/full-width specimens.
- Keep the Overview as a navigable Hito catalogue, not a copied Astryx page: no new copy system,
  no hidden route destinations, and no replacement interaction model.

## Reuse-First Change Budget

- Existing seams: `hito-ds-showcase-card` in `reference-workbench.css` and the existing body slot
  in `ShowcaseCard` at `reference-overview-page.tsx:414`.
- Existing tokens: `--color-background`, `--color-surface`, `--radius-xl`, `--space-4`.
- New production artifacts: none.
- Removed responsibility: only the perimeter-border chrome and the currently uncomposed lower
  preview layout of the existing showcase-card pattern.

## What Not To Touch

- Product routes/components, `hito-surface-flat`, `hito-state-surface`, State Surface work,
  global radius tokens, other DS card/surface classes, Figma, backend, data, or unrelated dirty
  work.
- Do not remove the internal `border-b` at `reference-overview-page.tsx:407`.
- Do not add a literal color, a one-off opacity, a new token, a separate showcase-card component,
  a broad catalogue rewrite, or a compatibility selector.
- Do not collapse all 14 specimens into the same centred/narrow layout. Preserve each real
  primitive's intrinsic geometry and interaction.

## Focused Validation Expectations

- `/hitoDS` Overview at desktop and exact 375×812 in dark/light: no perimeter border, retained
  header divider, semantic contrast, more legible preview hierarchy, no overflow, and no console
  errors.
- Browser-check one simple centred preview and one full-width/complex preview at each viewport so
  both layout classes are evidenced. Confirm existing deep links and live preview interactions
  remain usable.
- Existing DS validator, focused formatting/lint/diff hygiene, and build only if uncontended.

This Lite task does not claim Global QA, release readiness, or Product-wide card migration.

## Promotion Condition

Promote and stop only if the existing semantic tokens cannot produce both required theme outcomes
without a new token, if a preview requires a new component/prop API, or if preserving a complex
specimen needs a source owner outside this Overview seam.

## Execution Preflight

- Reuse the existing `ShowcaseCard` body slot, `.hito-ds-showcase-card`, semantic theme tokens, and
  current composition utilities; make only the existing preview stage more generous and complete
  the compact Button specimen's centring.
- New runtime artifacts: none.
- Remove only the superseded perimeter chrome and the cramped/uncomposed responsibility of the
  existing lower slot. The active integration set already contains the borderless semantic
  background seam, so this execution preserves it instead of adding duplicate styling.
- Focused proof remains the four required local viewport/theme renders, representative compact and
  complex specimens, live interactions/overlays, focused DS/static checks, and independent QA.
- Promote only if a new token, component/prop API, or owner outside this Overview seam is required.

## Design System Implementation Receipt

Completed on 2026-08-11 as a focused Lite Design System slice.

### Outcome

- The active integration set already contained the canonical borderless theme seam: every
  `.hito-ds-showcase-card` uses `--color-background` in dark theme and `--color-surface` in light
  theme, with no perimeter border. This execution preserved that owner instead of adding duplicate
  CSS.
- The existing lower `ShowcaseCard` slot now uses a `min-h-64` preview stage, while its current
  padding, `--radius-xl`, title, `Open` link, deep links, semantics, and internal `border-b`
  divider remain unchanged.
- The compact Button specimen's status line now centres with its controls. Existing compact
  Dropdown, Status/Toast, Dialog/Sheet, and Tooltip compositions remain centred; complex Field,
  Slider, Banner, App Shell, Row, Tabs, Shell Navigation, Data Table, and Disclosure specimens keep
  their intrinsic/full usable width.
- Design review kept the outer stroke absent and retained the divider as the only structural line.
  Copy review found no factual text deletion that would preserve the specimens' interaction
  evidence, so no catalogue copy was removed.
- New runtime artifacts: none. No token, prop API, component, wrapper, compatibility selector,
  Product UI, or Figma change was introduced.

### Files

- Changed: `src/components/hito-ds/reference-overview-page.tsx` (two existing composition classes)
  and this canonical item.
- Inspected/preserved: `src/styles/reference-workbench.css`; its current borderless semantic theme
  owner already met the requested chrome contract, so this slice added no duplicate style rule.
- Browser evidence:
  `qa-artifacts/screenshots/2026-08-11/hito-ds-showcase-card-borderless-surface/`.

### Validation

| Check                      | Scenario / environment                                              | Result                   | Evidence                                                                                                                                                                                                                                                                                                                                                                                 |
| -------------------------- | ------------------------------------------------------------------- | ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Shared DS validator        | `npm run validate-hito-ds-components`                               | Passed                   | Contract OK; 320 files scanned, including current reference owners.                                                                                                                                                                                                                                                                                                                      |
| Formatting                 | Scoped `npx prettier --check` on the changed TSX and canonical item | Passed                   | Both files match Prettier style.                                                                                                                                                                                                                                                                                                                                                         |
| Lint                       | Scoped ESLint on `reference-overview-page.tsx`                      | Passed                   | Exit 0.                                                                                                                                                                                                                                                                                                                                                                                  |
| Diff hygiene               | Focused `git diff --check`                                          | Passed                   | No whitespace errors; unrelated dirty hunks were not rewritten.                                                                                                                                                                                                                                                                                                                          |
| Desktop chrome/layout      | `/hitoDS`, exact 1470×801, dark and light                           | Passed                   | 14 cards; all perimeter widths `0px`; divider `1px solid`; dark card/page backgrounds match; light card/page backgrounds differ; stage height 256px; compact controls centred; complex child and stage widths match; no horizontal overflow.                                                                                                                                             |
| Mobile chrome/layout       | `/hitoDS`, exact 375×812, dark and light                            | Passed                   | Same border/divider/theme results; 295px usable stage width inside a 327px card; compact centre aligned; complex preview remains full width; no horizontal overflow.                                                                                                                                                                                                                     |
| Interactions and overlays  | Local compiled production output                                    | Passed                   | Button state changed; Dropdown menu stayed inside the viewport; Slider restore changed 6→4 and native Chrome keyboard changed 6→7; visible Tooltip surface measured 166.8×50px inside the viewport; Dialog and Sheet opened unclipped at desktop and 375px; 14 `Open` links retained and the Button link navigated to `/hitoDS/components#buttons`; production Chrome console errors: 0. |
| Independent read-only QA   | Same four viewport/theme states                                     | Passed with bounded gaps | QA independently passed the surface/layout, deep-link, Button, Dropdown, Dialog, Sheet, overflow, and console contract. Its browser path did not mutate Slider or surface Tooltip; the separate root Chrome proof above closes those two interaction gaps for this implementation receipt.                                                                                               |
| Production build lifecycle | `npm run qa:server:restart`                                         | Coverage gap             | Client, SSR, and Nitro compilation completed, but the manager refused to mark the artifact fresh because executable inputs changed concurrently during the build. Per the task's uncontended-build boundary, no second build was run. Browser proof used that compiled output directly; there is no fresh managed-runtime receipt.                                                       |
| Provider isolation         | Direct compiled-output fallback runtime                             | Coverage gap             | Runtime shutdown logged two aborted `requestOpenAiFirstPlanDraft` stacks. No successful provider response or hosted mutation was observed, but zero-provider-call proof is unavailable for that fallback. The runtime was stopped and not restarted.                                                                                                                                     |

Implementation DoD is complete for this Lite slice. This receipt does not claim Global QA,
release readiness, hosted validation, or Product-wide card migration.

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Lite

Execute the ready canonical item exactly as written:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-showcase-card-borderless-surface.md`

Read `AGENTS.md`, `agents/design-system.agent.md`, and
`skills/hito-frontend-design-system/SKILL.md` before the first write. Read
`skills/hito-qa-browser-regression/SKILL.md` only for the required visual proof.

Change only the existing showcase-card seams:

- `src/styles/reference-workbench.css:426-432` (`hito-ds-showcase-card`); and
- `src/components/hito-ds/reference-overview-page.tsx:396-416` (`ShowcaseCard`, especially its
  existing lower body slot at line 414), plus only the existing simple specimen groups that must be
  centred inside that slot.

Remove the perimeter-border chrome, preserve the existing radius/padding, preserve the internal
Overview header divider at `reference-overview-page.tsx:407`, and use only existing semantic
background and surface tokens to meet dark/light contrast. Turn the existing lower body slot into a
more generous, calm live-preview stage. Centre only self-contained action/menu/status/tooltip
examples; retain full width and intrinsic geometry for field, slider, banner, App Shell, row, tabs,
shell navigation, table, and disclosure examples.

The retained Astryx reference is for hierarchy only: use no Astryx code, tokens, classes, copy, or
interaction. Do not add a component, token, wrapper component, prop API, custom color, Product
change, or broad card migration. Do not change any other surface class. Verify `/hitoDS` Overview
at desktop and exact 375×812 in dark/light, including one simple centred and one complex/full-width
specimen, deep links, live interactions, focused DS/static checks. Do not stage, commit, push,
deploy, access hosted state, or change Figma. Russian commentary; English final receipt.
```

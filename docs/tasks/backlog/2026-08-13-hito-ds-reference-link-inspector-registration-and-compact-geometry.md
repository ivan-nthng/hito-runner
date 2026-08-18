# Hito DS Reference Link Inspector Registration And Compact Geometry

## Work Item ID

2026-08-13-hito-ds-reference-link-inspector-registration-and-compact-geometry

## Status

ready

## Type

Lite — shared Reference Link ownership registration and compact Used-in geometry

## Priority

high

## Owner

DESIGN SYSTEM

## Epic

platform-and-operations

## Scope

Correct the one existing Hito Reference Link contract so Local Inspector reports it as a confirmed
Design System component and Used-in/specimen anchors use a smaller visual inset without reducing
their accessible target. The component remains one native anchor contract; no new component, token,
Inspector-only registry, or route-specific variant is admitted.

## Archive Intent

retain_in_place

## Task

Make every `HitoReferenceLink` physically discoverable by the Local Inspector as the confirmed
**Reference link** DS component. Its existing DOM marker must resolve through the existing
`HITO_DS_REFERENCE_ENTRIES` ownership registry, so the Inspector shows component provenance and
does not offer "Add to design system" for an already canonical component.

Also make the shared Reference Link visual inset more compact for Used-in metadata and specimen
anchors: use 2px block inset and `--space-1` inline inset, while retaining a 24px minimum target
and the current native-anchor, hover, focus-visible, wrapping, and route/hash behavior. The 2px
optical inset is a component-local custom geometry exception, not a request for a global 2px
spacing token.

## User Report

- On `/hitoDS/patterns`, Inspector titles an inspected `/progress` anchor "Reference link" yet the
  panel only says `control · a`; it does not display a confirmed component identity.
- Ivan asked why a component already added to `/hitoDS/components#reference-link` is absent from
  inline Inspector component provenance.
- The Used-in links feel too large. Ivan confirmed that a 2px value must remain custom rather than
  introducing a new global spacing token.

## Demonstrated Root Cause

- `src/components/hito-ds/reference.tsx` already renders
  `data-hito-component="reference-link"` on the shared native anchor.
- `src/components/hito-ds/reference-metadata.ts` resolves declared markers only through
  `HITO_DS_REFERENCE_ENTRIES`, which has no `component:reference-link` entry.
- The Inspector therefore sees a declared but unresolved marker. Its panel derives the visible
  title from `.hito-reference-link`, but `LocalUiComponentIdentity` renders nothing when
  `ownership.entry` is absent. This is why the screenshot can say "Reference link" without showing
  it as a confirmed DS component.
- `src/styles/reference-workbench.css` owns the present `--space-1` block / `--space-2` inline
  inset. No Product route owns this chrome.

## Existing Seams

- `src/components/hito-ds/reference.tsx` — existing native Reference Link and marker.
- `src/components/hito-ds/reference-metadata.ts` — existing canonical component/pattern ownership
  registry consumed by Inspector.
- `src/styles/reference-workbench.css` — existing Reference Link geometry, hover, focus, and
  wrapping contract.
- `src/components/hito-ds/reference-components-controls.tsx` — existing physical Components
  reference; inspect only if a truthfulness adjustment is required.

## What Not To Touch

- Local Inspector target-selection, persistence, batch prompts, radius/spacing option catalogues,
  Product links/routes, App Shell, typography registry, tokens, generated manifests, Figma, hosted
  state, or Git lifecycle.
- Native `<a>` semantics, Enter navigation, browser history, focus-visible outline, hover state,
  long-link wrapping, reference link text, or source/copy ownership.
- A new global `--space-*` 2px token, a second ownership registry, a Reference Link variant API,
  or a route-local padding override.

## Lite Preflight

- **Outcome / evidence:** one declared marker is missing exactly one existing registry entry; the
  current shared 4px/8px geometry is source-proven.
- **Existing seam:** the current Reference Link marker, shared ownership registry, and shared CSS.
- **Smallest change:** register `component:reference-link` in the existing registry; compact the
  one existing CSS recipe and preserve a 24px target.
- **New runtime artifacts:** none.
- **Simplification:** remove the declared-but-unresolved ownership state for all Reference Link
  instances; no duplicate Inspector mapping is created.
- **Focused proof:** confirmed component identity and no Add-to-DS option for Reference Link;
  layout/hover/focus/navigation proof at desktop and mobile; target dimensions remain at least 24px.
- **Promotion:** promote to Tracked if the shared registry cannot truthfully own the marker, a
  Product caller needs a behavior change, or the 24px target requires a new component/primitive.

## Definition Of Done

1. `data-hito-component="reference-link"` resolves to one `component:reference-link` registry
   entry with its real source path and `/hitoDS/components#reference-link` reference path.
2. The Inspector displays the explicit confirmed identity **Reference link** and does not offer an
   action to add the already canonical component to DS.
3. All Used-in and specimen links share 2px block / 4px inline visual inset, a 24px minimum target,
   and their current border, typography, hover, focus, wrap, and native navigation contracts.
4. No 2px global spacing token, secondary Reference Link renderer, or DevTools-only lookup is
   introduced.

## Focused Validation

- Registry/source reachability shows exactly one matching canonical entry and zero unresolved
  Reference Link markers.
- Local Inspector replay against `/hitoDS/components#reference-link`: confirmed component identity,
  Actions menu, focused link, and generated readback remain truthful.
- Desktop and 375×812 Light/Dark Reference Link replay: Used-in link, long anchor, hover,
  focus-visible, Enter navigation, browser history, 24px target, containment, and console health.
- Focused Prettier, ESLint, relevant existing DS validator/manifest check, and `git diff --check`.

## Handoff Prompt

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Reference Link Inspector Registration And Compact Geometry
Mode: Lite
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-reference-link-inspector-registration-and-compact-geometry.md

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md.
Do not begin until your current active task has a terminal handoff; re-check the worktree and this
item before the first write.

Fix the demonstrated ownership registration gap: HitoReferenceLink already declares
data-hito-component="reference-link", but its marker is absent from the existing
HITO_DS_REFERENCE_ENTRIES registry. Inspector therefore titles it from the CSS class yet cannot
show a confirmed component identity. Add the one truthful existing registry entry; do not create a
second Inspector mapping or alter target selection/persistence.

Then compact the one shared Reference Link visual recipe for Used-in/specimen anchors from 4px/8px
to 2px block and --space-1 inline. Preserve a 24px minimum hit target, the native anchor, its
Technical SM role, hairline/chrome, hover, focus-visible, wrapping, and route/hash history.
Treat 2px only as a component-local optical inset: do not add a global spacing token, API variant,
or route override.

Prove registry reachability and Inspector provenance, then replay the physical Reference Link
reference in desktop and 375×812 Dark/Light. Verify identity, Actions behavior, keyboard/native
navigation, hover/focus, long wrapping, target size, overflow, and console health. Run focused
formatting, lint, relevant DS validation/manifest parity, and diff hygiene. Return an English Lite
receipt in this item. Do not stage, commit, deploy, alter hosted state, or claim Global QA.
```

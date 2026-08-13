# Hito DS Reference UI Typography Adoption

## Work Item ID

2026-08-11-hito-ds-reference-ui-typography-adoption

## Status

completed

## Type

design-system-adoption

## Priority

high

## Owner

design_system

## Mode

Tracked

## Scope

Replace all rendered Fraunces/display title use inside `/hitoDS` with the existing Poppins UI title
family or the existing `font-sans` utility when no same-geometry UI role exists. Preserve the
established size, line-height, weight, tracking, semantics, layout, and interaction of each title.

Fraunces remains available for source-backed marketing/editorial routes outside `/hitoDS`; this is
not a global font or typography-token migration.

## Archive Intent

retain_in_place

## Task

Make the Hito Design System reference use the same quiet Poppins heading language as the
authenticated Hito UI. Reuse the four existing matching UI roles:
`hito-ui-page-title`, `hito-ui-modal-title`, `hito-ui-section-title`, and
`hito-ui-panel-title`. Where the reference has a rendered display-scale heading without an exact
UI counterpart, retain its current geometry and change only its family to existing `font-sans`.

Do not add a `hito-ui-display-title`, alter title role definitions, or change marketing/editorial
surfaces.

## User Report

Ivan reports that serif headings still appear throughout the Design System reference and asks that
they all use their existing UI/Poppins versions instead. The desired result is the same scale and
line-height, not a new typography system. The existing Fraunces display face remains valid for
marketing materials only.

## Existing Decision And Evidence

- `docs/tasks/backlog/2026-08-06-hito-ds-typography-and-quiet-surface-foundation.md` established
  four Poppins UI title counterparts with matching editorial geometry. It explicitly rejected a
  speculative `hito-ui-display-title` because no Product renderer required one.
- `src/lib/hito-typography-roles.ts:27-68` owns the four existing UI roles and their truthful
  provenance.
- `src/styles/layout-typography.css:164-270` defines both editorial roles and the matching UI
  variants. The UI variants retain the existing title line boxes while using `--font-sans`.
- The completed Product migration deliberately excluded `/hitoDS`; that exclusion is now
  superseded only for this Design System reference surface.

## Initial Consumer Map

The Design System owner must refresh this map before writing and account for every rendered match.
Known `/hitoDS` consumers include:

| Reference owner                                                                                                                                                                                                                                                  | Existing serif/display consumer                                                                       | Required migration                                                                                                                                                                                                                  |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `src/components/hito-ds/reference-page.tsx`                                                                                                                                                                                                                      | `hito-page-title`                                                                                     | matching `hito-ui-page-title`                                                                                                                                                                                                       |
| `src/components/hito-ds/reference-overview-page.tsx`                                                                                                                                                                                                             | `hito-page-title`                                                                                     | matching `hito-ui-page-title`                                                                                                                                                                                                       |
| `src/components/hito-ds/playground.tsx`, `reference.tsx`, `reference-patterns-page.tsx`, `reference-components-structure.tsx`, `reference-components-overlays.tsx`, `reference-foundations-page.tsx`, `workout-library-playground.tsx`, `figma-export-board.tsx` | `hito-section-title` and/or `hito-panel-title`                                                        | matching UI role with identical geometry                                                                                                                                                                                            |
| `src/components/hito-ds/specimen-previews.tsx`, `dropdown-family-playground.tsx`                                                                                                                                                                                 | `hito-modal-title`                                                                                    | matching `hito-ui-modal-title`                                                                                                                                                                                                      |
| `src/components/hito-ds/figma-export-board.tsx`                                                                                                                                                                                                                  | `hito-display-title`                                                                                  | retain display geometry; use existing `font-sans`, not a new UI display role                                                                                                                                                        |
| `src/styles/reference-workbench.css`                                                                                                                                                                                                                             | `.hito-workbench-location-title { font-family: var(--font-display) }`                                 | existing sans family while preserving its local geometry                                                                                                                                                                            |
| `src/components/hito-ds/reference-foundations-page.tsx`                                                                                                                                                                                                          | visible Typography foundations data/specimens including a direct `var(--font-display)` custom example | remove or migrate only rendered serif reference content so Foundations no longer presents Fraunces as an in-reference UI choice; preserve truthful central registry/manifest data outside the rendered DS reference when still live |

The initial source search also finds `.hito-admin-brand` in `reference-workbench.css`; it is an
Admin consumer, outside this task, and must remain unchanged.

## Demonstrated Cause

The central Poppins UI title counterparts were created and adopted by the authenticated Product,
but the Design System reference was intentionally excluded from that prior migration. Its pages and
specimens consequently still render the editorial title classes and direct `--font-display` styling.

The first incorrect owner is DESIGN SYSTEM reference consumption, not the shared typography
foundation: the exact UI roles and the `font-sans` utility already exist.

## Expected Behavior

- No rendered `/hitoDS` heading or typography specimen resolves to Fraunces/`--font-display`.
- Page, modal, section, and panel title consumers resolve to the matching existing `hito-ui-*`
  roles and preserve their current CSS geometry.
- The display-scale export heading keeps its existing size/line-height/weight/tracking but uses
  existing `font-sans`; no new role is registered.
- Foundations continues to describe actual Hito contracts truthfully without presenting an
  editorial serif option as part of the DS reference UI.
- Marketing/editorial routes, global editorial role definitions, generated manifest truth, Figma,
  Product, Admin, DevTools, and all non-DS consumers remain unchanged.

## Reuse-First Change Budget

- Existing owners: the four `hito-ui-*` roles, `font-sans`, the existing title markup, and
  `reference-workbench.css`.
- New production artifacts: none.
- Removed responsibility: only the superseded `/hitoDS` use of editorial title roles and direct
  display-family styling.
- Do not manufacture a fifth UI title role, typography wrapper, alias, CSS token, manifest entry,
  component family, or compatibility rule.

## What Not To Touch

- Do not change `--font-display`, `--font-sans`, font loading, typography-role geometry, existing
  UI-role definitions, or semantic typography tokens.
- Do not edit Product, Marketing, Auth, Admin, DevTools, backend, persistence, migrations,
  dependencies, Figma, hosted state, or unrelated dirty work.
- Do not change copy, heading hierarchy, DOM semantics, navigation, preview behavior,
  keyboard/focus behavior, Figma export content, or the typography picker interaction except where
  its own rendered serif demonstration must become the existing sans presentation.
- Do not remove the editorial font from the repository: it remains a valid marketing/editorial
  contract outside the scoped reference.

## Definition Of Done

1. A refreshed source map proves every rendered `/hitoDS` serif/display consumer is migrated or
   is an explicit exclusion backed by a current source owner.
2. Every migrated semantic title has its matching existing Poppins UI role and unchanged declared
   geometry; the display-scale exception changes only family to `font-sans`.
3. No `/hitoDS` rendered typography resolves to Fraunces, while all excluded non-DS consumers stay
   byte-for-byte unchanged.
4. No new runtime artifact, token, typography role, or compatibility path is introduced.

## Validation Expectations

| Check                    | Scenario / environment                                                                          | Required evidence                                                                              |
| ------------------------ | ----------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Reachability             | Source before/after                                                                             | Zero rendered `/hitoDS` serif/display consumers; documented exclusions intact.                 |
| Geometry/provenance      | Existing role CSS and computed styles                                                           | Same size, line-height, weight, tracking, and semantic heading elements; Poppins resolved.     |
| Reference browser matrix | `/hitoDS`, `/hitoDS/foundations`, `/hitoDS/components`, and export board where route-accessible | Desktop and exact `375×812`, Dark and Light; headings readable, no overflow or console errors. |
| Interaction              | Existing Dialog/Dropdown/Tabs and deep links                                                    | Title migrations preserve accessible names, focus, keyboard behavior, and navigation.          |
| DS static contract       | Existing validator and manifest parity                                                          | No false new typography role or stale DS consumer assertion.                                   |
| Hygiene                  | Focused format, lint, diff                                                                      | Task-owned source only.                                                                        |
| Build                    | Fresh production build if uncontended                                                           | Build result or factual contention boundary.                                                   |

## Stage

Completed.

## Next Recommended Role

design_system — the already-queued Foundations color-provenance and Context-readability item.

## Exact Design System Handoff

```text
ROLE: DESIGN SYSTEM

Mode: Tracked
Task: Migrate every rendered `/hitoDS` serif/display title consumer to the existing Poppins UI
typography contract, preserving its exact geometry and leaving all non-DS editorial use intact.

Execute exactly:
`/Users/ivan/Developer/hito-running/docs/tasks/backlog/2026-08-11-hito-ds-reference-ui-typography-adoption.md`

Read before the first write:
- `AGENTS.md`
- `agents/design-system.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-qa-browser-regression/SKILL.md`
- the complete canonical item
- `src/lib/hito-typography-roles.ts`
- `src/styles/foundations.css`
- `src/styles/layout-typography.css`
- `src/styles/reference-workbench.css`
- every current `src/components/hito-ds/` consumer found by the required reachability audit.

Outcome:
All rendered `/hitoDS` headings and typography specimens use Poppins. Reuse
`hito-ui-page-title`, `hito-ui-modal-title`, `hito-ui-section-title`, and
`hito-ui-panel-title` wherever the current editorial role has that exact peer. For a display-scale
reference heading with no existing peer, preserve all geometry and replace only its family with
the existing `font-sans` utility. Do not add `hito-ui-display-title` or any other typography
primitive, token, component, wrapper, alias, or compatibility path.

First use one bounded read-only subagent to produce the current `/hitoDS` reachability map:
rendered title classes, direct `font-display` styles, typography data/specimens, and excluded
non-DS consumers. Treat `hito-admin-brand` as an explicit Admin exclusion. Before code, reconcile
the map against the canonical item; do not leave a second serif path visible in the reference.

Then implement through the existing title classes/markup and `reference-workbench.css` only. Keep
the title elements, hierarchy, text, dimensions, responsive layout, navigation, overlays,
keyboard/focus behavior, typography picker behavior, central editorial registry, font-loading,
manifest truth, Product/Marketing/Auth/Admin/DevTools source, Figma, Backend, and unrelated dirty
work unchanged.

After your focused validation, use one independent read-only QA subagent. Verify source
reachability/provenance; exact geometry; `/hitoDS`, Foundations, Components, and the accessible
export board at desktop and exact 375×812 in Dark and Light; title readability, no overflow,
console health, keyboard tabs, a Dialog/Dropdown title, and deep-link navigation. Run the existing
DS validator, manifest parity, focused formatting/lint/diff, and an uncontended production build.
If proof stops the fixture QA server, restart it before the final receipt. Do not stage, commit,
push, deploy, access hosted state, alter Figma, call providers, or delete material data.

Use Russian for visible in-progress commentary. Record the final formal receipt in English in the
canonical item, including consumer map, changed files, checks, explicit exclusions, and omitted
proof consequences.
```

## Implementation Receipt

**Stage:** Completed
**Implementation DoD:** Passed
**Global QA / release readiness:** Not claimed

### Preflight and root cause

The required read-only reachability audit found 40 scoped title/display matches across 14 reference
files. The first incorrect owner was the Design System reference: it still consumed retained
editorial title classes even though same-geometry Poppins UI peers already existed. No new
typography role, token, component, wrapper, alias, or compatibility path was needed.

### Outcome

Every rendered `/hitoDS` page, specimen, overlay, and accessible export-board title now resolves
to Poppins. Page, modal, section, and panel titles reuse their matching existing `hito-ui-*` roles.
The one display-scale export heading keeps `hito-display-title` geometry and uses existing
`font-sans` only.

Foundations no longer renders its Fraunces family row, global `display` group, or direct
display-family specimen. The central registry and generated manifest remain truthful and unchanged.
The export board filters the five editorial title entries only from its rendered grid, preventing a
visible serif path.

### Consumer map and changed owners

| Reference concern              | Existing seam                                                              | Result                                                   |
| ------------------------------ | -------------------------------------------------------------------------- | -------------------------------------------------------- |
| Page titles                    | `reference-page.tsx`, `reference-overview-page.tsx`                        | `hito-ui-page-title`                                     |
| Section titles                 | `reference.tsx`, `playground.tsx`, patterns, workout library, export board | `hito-ui-section-title`                                  |
| Panel titles                   | Patterns, motion, overlay, structure, Foundations specimens                | `hito-ui-panel-title`                                    |
| Modal titles                   | Dropdown, specimen previews, shared Dialog/Sheet primitive                 | Poppins through existing UI modal contracts              |
| Display/local exceptions       | Export heading, timeline labels, DS workbench location                     | Existing `font-sans`; geometry retained                  |
| Foundations dynamic typography | `reference-foundations-page.tsx`                                           | Render-only editorial data suppressed; registry retained |

Task-owned source changes are in `src/components/hito-ds/` reference consumers,
`src/styles/layout-typography.css`, and `src/styles/overlays-feedback.css`. The timeline selector
now accepts the UI panel class without changing local geometry. The shared Dialog/Sheet title was an
additional demonstrated root path: it had a UI selector but still specified `--font-display`; it
now resolves to Poppins with the same size, weight, tracking, and line-height.

### Preserved boundaries

- `hito-admin-brand`, the Admin workbench consumer, non-DS editorial/Product/Marketing/Auth
  consumers, global editorial role definitions, font loading, central registry, generated manifest,
  Figma, Backend, and unrelated dirty work remain unchanged.
- The export-board code changed only to keep its own rendered reference truthful; no Figma file or
  mapping was accessed or changed.

### Validation inventory

| Check                   | Scenario / environment                                   | Result | Evidence                                                                                                           |
| ----------------------- | -------------------------------------------------------- | -----: | ------------------------------------------------------------------------------------------------------------------ |
| Reachability            | Current `/hitoDS` source                                 | Passed | 40-match map reconciled; no dynamic class construction.                                                            |
| Static serif audit      | Current `/hitoDS` source                                 | Passed | No direct rendered `Fraunces`/`font-display` owner; only the Poppins display exception and filter literals remain. |
| Geometry/provenance     | Existing role CSS and primitive styles                   | Passed | UI peers retain prior size, weight, tracking, line-height, width, and semantics; family is deliberate difference.  |
| DS contracts / manifest | Existing validator                                       | Passed | 321 files; 43 primitive colors, 41 semantic colors, 18 text styles, four UI title roles.                           |
| Hygiene                 | Task owners                                              | Passed | Focused Prettier, ESLint, and `git diff --check`.                                                                  |
| Production build        | Fresh local artifact                                     | Passed | Client, SSR, Nitro, and postbuild completed before browser replay.                                                 |
| Browser matrix          | Managed reference, desktop and exact 375×812, Dark/Light | Passed | `/hitoDS`, Foundations, Components, export board: Poppins, no overflow, no console errors.                         |
| Interaction             | Components reference                                     | Passed | ArrowRight moved Demo to Variants; Dialog, dropdown, `#modals`, and `#dropdowns` remained functional.              |
| Independent QA          | Read-only source/provenance review                       | Passed | No source defect; reviewer did not inspect the transient stale runtime.                                            |

The in-app browser later refused a local navigation, so the owner used the already-authorized Chrome
control surface. It verified a Poppins Dialog title at `28px / 30.8px`, a Poppins dropdown label,
no visible computed serif family, and no horizontal overflow at either required viewport. The task
receipt is an Admin snapshot input; the owner restarts the fixture runtime after this write so the
artifact is current.

No staging, commit, push, deployment, hosted access, provider call, or material-data deletion
occurred.

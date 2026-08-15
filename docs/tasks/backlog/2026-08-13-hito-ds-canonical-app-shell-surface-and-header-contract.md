# Hito DS Canonical App Shell Surface And Header Contract

## Work Item ID

2026-08-13-hito-ds-canonical-app-shell-surface-and-header-contract

## Status

completed

## Type

design-system shell contract reconciliation

## Priority

high

## Owner

design system

## Mode

Tracked

## Evidence From

2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas

## Depends On

2026-08-13-hito-shell-surface-ladder-and-header-hierarchy-design-discovery

## Scope

Establish and implement one canonical visual App Shell contract for existing desktop shells that
have a sidebar, a right-hand working canvas, and a sticky blurred header. The admitted DS-owned
seams are the live Hito DS workbench, the shared workbench shell consumed by Admin, and the Hito DS
App Shell reference pattern. Runner `AppShell` is a read-only adoption consumer in this task and
must be updated separately by FRONTEND Product after this contract is accepted.

## User Report

On 2026-08-13 Ivan accepted the Hito DS visual direction and requested it become consistent wherever
Hito presents a sidebar, right-hand content field, and header: Hito DS itself, its App Shell
reference, Admin workbench consumers, and the runner product. The blurred header is accepted as an
interaction/visual treatment; it must become intentional and consistent rather than a separate
recipe per shell.

## Accepted Two-Theme Surface Ladder

| Theme | Sidebar                 | Right-hand working canvas  | Inner content surfaces                                                        |
| ----- | ----------------------- | -------------------------- | ----------------------------------------------------------------------------- |
| Dark  | `sidebar` / `stone-950` | `surface` / `stone-850`    | `background`, `card`, state, or overlay roles owned by the rendered component |
| Light | `sidebar` / `linen-75`  | `background` / `linen-100` | `surface`, `card`, state, or overlay roles owned by the rendered component    |

The header remains a sticky, blurred view over its working canvas, with a meaningful separation
edge. Its translucency must resolve from existing semantic roles and must be structurally identical
where this shell contract applies. Do not create a new colour or blur token merely to name an
existing composition.

## Source Facts

- `src/styles/foundations.css` owns the existing semantic roles and already defines the accepted
  Dark/Light values.
- `src/components/hito-ds/reference-page.tsx` plus `src/styles/reference-workbench.css` own the
  live Hito DS workbench: opaque `hito-workbench-sidebar`, theme-aware
  `hito-workbench-main`, and `hito-workbench-topbar` with a blurred semantic background.
- `src/routes/admin.analytics.tsx` and `src/routes/admin.capture.tsx` consume
  `hito-workbench-shell`, `hito-workbench-sidebar`, `hito-workbench-main`, and their Admin header
  through `AdminWorkspaceNav.tsx`. Those routes are consumers of the existing shared DS shell
  contract, not independent shell recipes.
- `src/components/hito-ds/reference-components-structure.tsx` plus
  `reference-workbench.css` own the contained App Shell reference pattern. It must accurately
  demonstrate, not fork from, the live contract.
- `src/components/AppShell.tsx` is a separate Runner Product consumer: its `bg-background` outer
  field, `bg-sidebar/60` sidebar, and `bg-background/90` header do not yet express the same shell
  composition. It is read-only until the separate Product adoption item executes.

## Demonstrated Root Cause

Hito has a canonical token ladder but more than one shell composition expressing it. The DS/Admin
workbench and the Runner AppShell use different canvas/sidebar/header recipes, while the DS App
Shell reference has not been made an explicit conformance point. The first correction belongs to
DESIGN SYSTEM: make the shared contract explicit and make its own live/reference consumers agree.
Updating Runner first would make Product choose a parallel interpretation of a contract that the
shared owner has not fully consolidated.

## Task

Inspect every admitted shell seam before editing and source-map the current sidebar, main canvas,
header backdrop, border/separation, and mobile boundary. Then make the Hito DS workbench and its
contained App Shell reference resolve exactly to the accepted two-theme ladder and one intentional
sticky blurred-header composition. Preserve Admin as a consumer of the shared workbench contract;
only change an Admin route if a source map proves it owns a shell override that prevents adoption.

Reuse existing foundations semantic roles, `hito-workbench-*` seams, focus, navigation, menu, Sheet,
and mobile patterns. Prefer consolidating/removing a proven duplicate recipe at its existing owner
over adding a wrapper, generic shell component, new token, alpha ladder, global CSS framework, or
compatibility class. The result must leave one exact, documented DS-owned adoption contract for
Runner `AppShell`.

## What Not To Touch

- Runner `AppShell` runtime source, runner Product routes, data, auth, navigation, or mobile flow;
  that is a separate FRONTEND Product slice.
- Local Inspector selection/provenance behavior. Its `Custom (computed)` Surface/Card alias result
  is not a shell-colour defect.
- Foundations token values, generated manifests, Admin data/behavior, Marketing/Auth/Hub surfaces,
  Figma, Backend, persistence, fixtures, Git lifecycle, hosted state, or unrelated dirty work.
- Do not globally flatten cards, remove all blur, or replace route-owned state/overlay/card surfaces
  with the canvas role.

## Acceptance Evidence

| Check              | Expected outcome                                                                                                                  |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- |
| Shell ownership    | The source map identifies every admitted DS/Admin/reference shell and no parallel sidebar/canvas/header visual authority remains. |
| Theme ladder       | Dark and Light use the accepted sidebar/canvas pair; inner component surfaces retain their own semantic roles.                    |
| Header             | All admitted shell headers retain sticky blur and use the same DS-owned semantic backdrop/separation contract.                    |
| Reference truth    | The contained App Shell reference demonstrates the live contract instead of an approximate visual fork.                           |
| Admin preservation | Admin continues to consume the shared workbench contract without data, navigation, keyboard, or overlay regression.               |
| Adoption handoff   | The completed receipt provides the exact smallest Runner `AppShell` consumer change for FRONTEND Product.                         |

## Validation Expectations

Run an exact source/reachability discriminator, the DS validator, focused formatting/lint, and
`git diff --check`. Browser-check the live Hito DS workbench, contained App Shell reference, and
one Admin workbench view at desktop and exact 375×812 in Dark/Light for computed ladder values,
header blur/separation, navigation/menu/Sheet focus, overflow, and console health. Use a bounded
read-only DESIGNER review only if a visual decision is genuinely unresolved, and a bounded read-only
QA review only if it materially improves proof. Do not delegate DESIGN SYSTEM implementation.

## Stage

DESIGN SYSTEM Implementation DoD complete; Runner Product adoption remains separate.

## Next Recommended Role

PRODUCT

## Handoff Status

Closed by DESIGN SYSTEM on 2026-08-13. Return the demonstrated Runner `AppShell` adoption boundary
to PRODUCT for a separate FRONTEND Product handoff.

## Execution Preflight — 2026-08-13

- **Accepted decision:** use the existing contextual shell ladder: Dark `sidebar → surface canvas →
background stage`; Light `sidebar → background canvas → surface/card stage`. The canonical sticky
  header material is semantic `background` at 76% alpha, 18px blur, a persistent hairline edge, an
  opaque `background` fallback, and no shadow.
- **First owner and existing seam:** `src/styles/reference-workbench.css` already owns
  `hito-workbench-*` for live Hito DS and the Admin Analytics/Capture consumers. The contained App
  Shell is owned by `src/components/hito-ds/reference-components-structure.tsx` plus its existing
  `hito-ds-app-shell-*` rules. Admin has no separate shell override requiring a route edit.
- **Smallest behavior change:** retain the accepted live/Admin sidebar and canvas rules, add the
  missing opaque fallback before the existing header alpha material, and make the contained desktop
  and narrow reference reuse the same canvas/header contract instead of its background-only/static
  approximation.
- **New runtime artifacts:** none. No CSS file, token, component family, wrapper, registry, helper,
  compatibility selector, alpha ladder, calculated-color recipe, Product dependency, or state owner
  is proposed.
- **Superseded responsibility:** remove only the contained specimen's contradictory background-only
  canvas and static header composition. Inner notice/card/menu/navigation roles remain owned by their
  existing components.
- **Dirty-work boundary:** preserve the existing playground-tab spacing and every unrelated source,
  receipt, Product, Admin-data, favicon, validator, policy, and generated hunk byte-for-byte. Runner
  `src/components/AppShell.tsx` is read-only.
- **Sequential gate and stop condition:** first admit a fresh managed `qa_fixture` artifact and close
  the related Header Search item only if its complete desktop/mobile Dark/Light contract passes.
  Return to PRODUCT if the shell contract needs Admin behavior/TSX changes, a new abstraction/token,
  or any Runner Product write.

```text
ROLE: DESIGN SYSTEM

Task: Hito DS Canonical App Shell Surface And Header Contract
Mode: Tracked implementation
Canonical item: docs/tasks/backlog/2026-08-13-hito-ds-canonical-app-shell-surface-and-header-contract.md

Read AGENTS.md, agents/design-system.agent.md, and skills/hito-frontend-design-system/SKILL.md.
Run a Tracked preflight and preserve unrelated dirty work byte-for-byte.

Establish one canonical DS-owned App Shell visual contract for every admitted desktop shell with a
sidebar, right-hand working canvas, and sticky blurred header: the live Hito DS workbench, the
shared workbench shell consumed by Admin, and the contained Hito DS App Shell reference. Dark must
resolve sidebar / stone-950 with surface / stone-850 working canvas; Light must resolve sidebar /
linen-75 with background / linen-100 working canvas. Inner cards, states, tables, and overlays keep
their current component-owned semantic roles.

Consolidate the existing sidebar/canvas/header recipes at their real DS-owned seams. Keep the sticky
blurred header and meaningful separation edge, but make its semantic backdrop structurally
consistent across admitted shell hosts. Make the contained App Shell reference truthful to the live
contract. Reuse foundations roles and existing workbench/navigation/menu/Sheet contracts. Do not add
a shell framework, wrapper, token, literal colour, new alpha scale, compatibility class, or generic
component.

Do not edit Runner AppShell or Product routes; return one exact consumer adoption boundary for the
separate FRONTEND Product task. Do not touch Inspector, Admin data/behavior, Marketing/Auth/Hub,
tokens/manifests, Backend, Figma, hosted state, or unrelated work.

Prove ownership and duplicate-recipe removal; validate live DS, the contained App Shell reference,
and one Admin workbench at desktop and 375×812 in Dark/Light for computed values, header blur,
focus, menus/Sheet, overflow, and console health. Use only a bounded read-only reviewer when it
materially adds evidence. Update this item with a truthful English receipt and return the Product
adoption handoff to PRODUCT.
```

## Tracked Implementation Receipt — 2026-08-13

### Task, stage, and preflight result

- **Task:** Hito DS Canonical App Shell Surface And Header Contract.
- **Stage:** DESIGN SYSTEM Implementation DoD complete after the Header Search closure gate and a
  fresh managed `qa_fixture` replay.
- **Role file:** `agents/design-system.agent.md`.
- **Skills used:** `skills/hito-frontend-design-system/SKILL.md` and
  `skills/hito-qa-browser-regression/SKILL.md`.
- **Subagents:** none. The accepted Designer decision was already canonical evidence; the primary
  Design System owner implemented and replayed the full focused matrix.
- **Reuse budget:** the existing `hito-workbench-*`, `hito-ds-app-shell-*`, semantic surface tokens,
  reference pattern, menu, focus, and responsive contracts were sufficient. New runtime artifacts:
  **none**.

### Product outcome and demonstrated root cause

The shared shell now has one Design System-owned visual authority. Dark resolves an opaque
`sidebar` beside a `surface` working canvas; Light resolves the same sidebar role beside a
`background` working canvas. The live Hito DS and Admin consumers continue to consume that shared
contract. The contained desktop and narrow App Shell specimens now demonstrate the same ladder
instead of using a background-only canvas and a separate static header recipe.

Every admitted header uses the existing `background` role with an opaque fallback followed by the
accepted 76% alpha composition, 18px blur, persistent hairline edge, sticky positioning, and no
shadow. Browser replay also demonstrated that the former desktop anchor offset could place a deep
linked section beneath the sticky header. The same workbench owner now composes an 80px offset from
existing spacing tokens; no raw dimension or second navigation rule was introduced.

The first incorrect owners were the contained reference's background-only canvas and static header
composition in `reference-workbench.css` and `reference-components-structure.tsx`. Admin had no
separate shell visual override and required no route edit. Foundations tokens, Header Search state,
Admin data/navigation, and component-owned cards, states, menus, and overlays remain unchanged.

### Source hierarchy and files changed

- `src/styles/foundations.css` — inspected read-only; remains the canonical semantic source for
  `sidebar`, `surface`, `background`, `card`, and `hairline`.
- `src/styles/reference-workbench.css` — retained the live/Admin shell ladder, added the opaque
  header fallback and WebKit-equivalent 18px blur, made contained desktop/narrow canvases
  theme-aware, removed obsolete content-layout responsibility, and corrected the workbench anchor
  offset with existing spacing tokens.
- `src/components/hito-ds/reference-components-structure.tsx` — made desktop and narrow reference
  headers consume `hito-workbench-topbar`; retained route content in its own padded composition and
  preserved every existing card/state/navigation/menu owner.
- `src/components/hito-ds/reference-page.tsx`, `src/routes/admin.analytics.tsx`,
  `src/routes/admin.capture.tsx`, `src/components/admin/AdminWorkspaceNav.tsx`, and
  `src/components/AppShell.tsx` — inspected read-only for ownership and consumer reachability.
- `docs/tasks/backlog/2026-08-13-hito-ds-header-search-and-context-navigation.md` — closed after its
  fresh managed replay passed; the historical blocked evidence remains intact.
- `docs/tasks/backlog/2026-08-13-hito-ds-canonical-app-shell-surface-and-header-contract.md` — records
  this preflight, implementation evidence, lifecycle, and Product boundary.

### Validation inventory

| Check                            | Scenario / environment                                                      | Result           | Evidence                                                                                                                                                                                                                                                                                |
| -------------------------------- | --------------------------------------------------------------------------- | ---------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Ownership and provenance         | Current DS, contained reference, Admin, and Runner source map               | Passed           | One shared `hito-workbench-*` visual owner serves live Hito DS and Admin; contained specimens reuse it; Foundations semantic roles remain unchanged; Runner `AppShell` remains a separate read-only consumer.                                                                           |
| Header Search closure gate       | Fresh managed `qa_fixture`; 1470×801 and exact 375×812; Dark/Light          | Passed           | Existing location, controlled Search, filter/group expansion, clear, two-step Escape, focus return, theme menu, Browse Sheet, deep links, containment, and console health passed. The related item is completed.                                                                        |
| Live Hito DS ladder/header       | `/hitoDS/patterns#app-shell`; 1470×801 and exact 375×812; Dark/Light        | Passed           | Computed sidebar/canvas values match the accepted ladder. Header computes to 76% `background`, 18px blur, 1px hairline, sticky `top: 0`, and no shadow. Real long-page scrolling retained the header at `top: 0`; direct desktop deep links clear the header.                           |
| Contained App Shell reference    | Demo and Variants; same four viewport/theme cells                           | Passed           | Desktop frame and narrow specimen use Dark `surface` / Light `background`, preserve the `sidebar` role, and reuse the same header material. The contained sticky header remains bounded by its specimen frame. Profile menu keyboard open/Escape returned visible focus to its trigger. |
| Admin shared consumer            | Analytics and Capture fixture views; 1470×801 and exact 375×812; Dark/Light | Passed           | Admin computes the same sidebar/canvas/header contract, retains navigation and account/theme menu behavior, returns visible focus after Escape, hides the desktop sidebar coherently at 375px, and has zero horizontal overflow or error overlay.                                       |
| Browser health                   | All claimed cells                                                           | Passed           | No console warnings/errors, blank content, clipped shell controls, runtime error overlay, or horizontal document overflow.                                                                                                                                                              |
| Focused formatting               | Changed TSX, CSS, and canonical receipts                                    | Passed           | Prettier check passed.                                                                                                                                                                                                                                                                  |
| Focused lint                     | Changed runtime TSX                                                         | Passed           | ESLint passed with no findings.                                                                                                                                                                                                                                                         |
| Diff hygiene                     | Current working tree                                                        | Passed           | `git diff --check` reports no whitespace errors.                                                                                                                                                                                                                                        |
| Managed production build/runtime | Canonical `npm run local:fixture` after implementation                      | Passed           | Fresh, current, healthy, compatible loopback artifact admitted in `qa_fixture` mode.                                                                                                                                                                                                    |
| Full DS validator                | Existing repository validator                                               | External finding | The validator still reports only the separate Brand on-light/on-dark favicon assertion. No shell or Header Search assertion failed, and this task did not alter rendered Brand source or weaken that invariant.                                                                         |

The Admin fixture pages contained no document taller than the desktop viewport, so an Admin-specific
scroll transition could not be observed. This does not reduce the computed Admin material/source
claim: Admin consumes the exact shared sticky class, while real scrolling was exercised on the live
Hito DS workbench and within the bounded contained specimen. No ad hoc content or harness was added.

### Preserved boundaries, Product handoff, and claims

Runner Product `src/components/AppShell.tsx`, Product routes, persistence, Local Inspector matching,
Figma, hosted state, Git lifecycle, tokens/manifests, Admin data, and unrelated dirty work were not
changed. The smallest separate FRONTEND Product adoption is now explicit: preserve Runner behavior
and mobile navigation while replacing its translucent sidebar with the opaque `sidebar` role,
resolving its desktop working canvas to Dark `surface` / Light `background`, and aligning its sticky
header from the current 90%/`blur-xl` shadowless recipe to the canonical 76% `background`, 18px blur,
hairline edge, opaque fallback, and no-shadow material.

Next owner: **PRODUCT**, to dispatch that bounded Runner adoption to **FRONTEND Product**. There is no
remaining Design System blocker. This receipt proves focused Implementation DoD only; it does not
claim Global QA, release readiness, deployment, hosted acceptance, Product adoption, or Figma parity.

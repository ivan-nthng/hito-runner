# Product App Shell Surface Ladder Alignment

## Work Item ID

2026-08-13-product-app-shell-surface-ladder-alignment

## Status

completed

## Type

product shell visual alignment

## Priority

high

## Owner

frontend

## Frontend Lane

Product

## Mode

Tracked

## Evidence From

2026-08-11-hito-ds-foundations-color-truth-context-and-reference-canvas

## Depends On

2026-08-13-hito-ds-canonical-app-shell-surface-and-header-contract

## Scope

Adopt the completed canonical Hito DS App Shell surface/header contract in the authenticated runner
`AppShell`. This covers every runner route rendered inside `AppShell`; it does not redesign
individual route content, Admin workbenches, Hito DS reference pages, tokens, or the Local
Inspector.

## User Report

On 2026-08-13 Ivan compared `/hitoDS/componentsinputs` in Dark theme with the runner product. The
Hito DS hierarchy is accepted as the visual reference. He requested the Product sidebar and right
content field use the same semantic structure rather than an ad-hoc or visually collapsed canvas.
The Inspector showed `Custom (computed) · #161312` for the selected Hito DS field and listed both
Surface and Card as possible semantic fills; Ivan asked whether that proves token misuse.

## Accepted Surface Contract

| Theme | Sidebar                 | Right-hand working canvas  | Inner content surfaces                                                       |
| ----- | ----------------------- | -------------------------- | ---------------------------------------------------------------------------- |
| Dark  | `sidebar` / `stone-950` | `surface` / `stone-850`    | Existing component/route-owned `background`, `card`, state, or overlay roles |
| Light | `sidebar` / `linen-75`  | `background` / `linen-100` | Existing component/route-owned `surface`, `card`, state, or overlay roles    |

This is the existing Hito DS ladder, not a new colour decision. It intentionally keeps meaningful
inner surfaces owner-specific; it is not permission to replace every Product background with one
token.

## Source Investigation

- `src/styles/foundations.css` canonically defines Dark `background → stone-900`, `surface →
stone-850`, `surface-elevated → stone-800`, `sidebar → stone-950`, and Light equivalents.
- `src/components/hito-ds/reference-page.tsx` and `src/styles/reference-workbench.css` implement
  the accepted reference ladder: opaque `sidebar`, Dark working canvas `surface`, and Light working
  canvas `background`.
- `src/components/AppShell.tsx` owns every authenticated runner shell. Its outer wrapper is
  `bg-background`; its desktop sidebar is `bg-sidebar/60 backdrop-blur`; and its `<main>` has no
  explicit semantic working-canvas background. Those source facts explain why Product does not
  currently express the same ladder as the reference.
- The Inspector result does **not** prove a raw/non-token colour. In
  `local-ui-inspector-targets.ts`, a current value receives a token label only when exactly one
  eligible semantic option has the same resolved RGBA. `surface` and `card` intentionally resolve
  to the same `#161312` in Dark, so the matching set has two entries and is displayed as `Custom
(computed)` rather than guessing which alias authored the fill.

## Demonstrated Root Cause

The runner AppShell has an implicit working field inherited from `bg-background` and a translucent
sidebar treatment, while the accepted DS reference explicitly owns an opaque sidebar and a
theme-aware right-hand canvas. The Inspector wording is a separate provenance-ambiguity behavior;
it is not evidence that the selected Hito DS fill lacks a canonical token.

## Task

After the Design System dependency completes, adopt its exact accepted sidebar/canvas/header
contract at the existing `AppShell` and canonical shell-style seam. Reuse existing semantic tokens
and existing shell structure; add no literal colour, alpha recipe, token, wrapper layer, or new
shared component.

Before changing source, inspect every route rendered by `AppShell` and distinguish the shell canvas
from route-owned cards, tables, states, sheets, and component surfaces. Preserve those inner owners
unless the source map proves an AppShell-owned background is masking them. Preserve runner data,
auth/navigation, layout geometry, mobile navigation, header behavior, focus, scroll containment,
and all existing Product interactions.

The implementation must make desktop sidebar fill resolve to the canonical `sidebar` role without
the current generic translucency, and make the `<main>` working field resolve to the accepted Dark
`surface` / Light `background` canvas roles. Do not modify tokens or Hito DS reference source to
make Product appear aligned. Do not change Local Inspector behavior in this task; its alias-label
behavior is a separately owned DevTools improvement only if Ivan later requests it.

## What Not To Touch

- `src/components/devtools/**`, Inspector colour-option heuristics, generated manifests, or DS
  colour metadata.
- Admin shells, Hub/Marketing/Auth/Changelog pages, Hito DS reference source, shared tokens,
  primitives, CSS migration work owned by DESIGN SYSTEM, Backend, persistence, providers, fixtures,
  Figma, Git lifecycle, hosted state, or unrelated dirty work.
- Route-level card/state/overlay semantics, mobile-navigation behavior, or header interactions.

## Validation Expectations

Prove the exact `AppShell` source change and absence of prior translucent sidebar composition;
format, focused lint, Product validation, build when runtime source changes, and `git diff --check`.
Browser-replay Calendar, Progress, Settings, and a Workout route at desktop and exact `375×812` in
Dark and Light. Check computed shell/sidebar/canvas values, semantic inner-surface preservation,
navigation, keyboard focus, fixed header/mobile navigation, overflow, and console health. This is
implementation proof only, not Global QA or release readiness.

## Frontend Product Execution Preflight — 2026-08-13

- **Outcome and accepted decision:** adopt the completed Design System shell ladder in the existing
  authenticated runner `AppShell`: opaque `sidebar` for the desktop navigation rail, Dark `surface`
  / Light `background` for the right-hand working canvas, and the accepted sticky header material.
- **Demonstrated cause and owner:** `AppShell.tsx` currently combines `bg-sidebar/60` plus backdrop
  blur with an implicit `bg-background` working field. The component is the first incorrect Product
  owner; the Inspector `Custom (computed)` label remains a documented Surface/Card alias ambiguity,
  not a token defect.
- **Consumer/source map:** the only route owners rendering `AppShell` are Home/Calendar,
  Progress, Settings, Workout detail, Integrations, and the already-authenticated Login branch.
  Their `hito-route-gutter`, `hito-surface`, `hito-state-surface`, Calendar, table/list, form, dialog,
  and overlay compositions remain route/component-owned and unchanged.
- **Existing seams reused:** `src/components/AppShell.tsx`; existing semantic `sidebar`, `surface`,
  and `background` utilities; and the already accepted `hito-workbench-topbar` shell-header contract
  for its exact opaque fallback, 76% background, 18px blur, hairline, sticky, and no-shadow material.
- **New production runtime artifacts:** none. No new CSS recipe, token, wrapper, component, helper,
  state, persistence path, or compatibility layer is admitted.
- **Removed/simplified responsibility:** remove the route-independent translucent desktop-sidebar
  recipe, make the existing main element the explicit theme-aware working canvas, and replace the
  old inline 90%/`blur-xl` header recipe with the existing canonical header class. Route content and
  all shell interactions remain intact.
- **Focused proof:** exact source/diff ownership; focused formatting, lint/Product checks, build when
  uncontended, and `git diff --check`; then Calendar, Progress, Settings, and Workout at desktop and
  exact 375×812 in Dark/Light for computed sidebar/canvas/header roles, inner-surface preservation,
  navigation/focus, sticky header/mobile navigation, overflow, and console health.
- **Stop/return boundary:** return to Product if the accepted result requires changing shared
  Design System source, Admin/Marketing/Auth/DevTools, a route-owned surface, or Product behavior.

### Browser Path Preflight

- **Validation layer:** focused Frontend Product Implementation DoD only; Global QA, hosted,
  release, deployment, and Figma acceptance remain unclaimed.
- **Runtime/data boundary:** reuse the managed `qa_fixture` origin at `http://127.0.0.1:3000`; rebuild
  or restart it through the fixture manager only because the visible AppShell source changed. Do not
  create fixture accounts, mutate persisted fixture truth, or start a duplicate server.
- **Matrix:** Calendar, Progress, Settings, and one existing Workout route at 1470×801 and exact
  375×812 in Dark and Light. Inspect computed desktop sidebar, main canvas, and sticky header values;
  representative route-owned inner surfaces; desktop/mobile navigation and keyboard focus; sticky
  positioning; page overflow; and browser console health.
- **Open condition:** keep the item nonterminal if either theme fails the accepted semantic ladder,
  a route-owned surface is masked, navigation/focus/containment regresses, or a required browser
  discriminator cannot be completed safely.

## Stage

FRONTEND Product Implementation DoD completed on 2026-08-13. The accepted Design System shell
contract is adopted in the authenticated runner `AppShell`; Global QA and release acceptance remain
separate and unclaimed.

## Next Recommended Role

PRODUCT — retain the completed consumer slice and route the unrelated private Admin snapshot
postbuild-integrity mismatch only if a green checkout-wide finalized artifact is required next.

## Handoff Status

Returned to Product with the Frontend Product consumer slice completed. The shared Design System
source remains unchanged by this task.

## Frontend Product Tracked Implementation Receipt — 2026-08-13

### Outcome and demonstrated cause

The authenticated runner shell now expresses the accepted semantic ladder without adding a second
visual authority. The former `bg-sidebar/60 backdrop-blur` desktop rail obscured the opaque
`sidebar` role, while the unstyled `<main>` inherited the outer `background` role in both themes.
`AppShell` was the first incorrect Product owner. The existing structure now resolves the desktop
rail to opaque `sidebar`, the working canvas to Dark `surface` / Light `background`, and the sticky
header through the accepted canonical header class.

### Files changed

- `src/components/AppShell.tsx` — removed generic sidebar translucency, made the existing `<main>`
  the explicit theme-aware canvas, and reused `hito-workbench-topbar` for the accepted header
  material.
- `docs/tasks/backlog/2026-08-13-product-app-shell-surface-ladder-alignment.md` — recorded preflight,
  browser path, lifecycle, and this receipt.

No shared CSS, token, route component, runtime file, helper, wrapper, state, data, fixture, Backend,
Admin, Marketing/Auth/Hub, DevTools, Inspector, Figma, hosted, or Git lifecycle source was changed.
All unrelated dirty work was preserved.

### Validation

| Check                  | Scenario / environment                                                                                  | Result               | Evidence                                                                                                                                                                                                                                                                                    |
| ---------------------- | ------------------------------------------------------------------------------------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Source ownership       | `AppShell.tsx` and all six route owners rendering it                                                    | Passed               | Home/Calendar, Progress, Settings, Workout, Integrations, and authenticated Login remain route-owned below the unchanged shell boundary; old `bg-sidebar/60`, `bg-background/90`, and `backdrop-blur-xl` compositions are absent from `AppShell`.                                           |
| Semantic ladder        | Calendar, Progress, Settings, Workout; 1470×801; Dark/Light                                             | Passed               | Dark computed sidebar `oklch(0.14 0.005 60)` and main `oklch(0.19 0.005 60)` match `sidebar`/`surface`; Light computed sidebar `oklch(0.982 0.008 80)` and main `oklch(0.972 0.01 78)` match `sidebar`/`background`. Sidebar backdrop is `none`.                                            |
| Header contract        | Same four routes and both desktop themes                                                                | Passed               | Header computed to semantic `background` at 0.76 alpha, `blur(18px)`, 1px hairline, `position: sticky`, `top: 0`, and `box-shadow: none`; it remained at viewport top after document scroll.                                                                                                |
| Inner surfaces         | Representative Calendar grid, Progress list/table state, Settings state surface, and Workout row groups | Passed               | Existing route classes and their transparent, bordered, background-alpha, card/list, and state treatments remained distinct from the shell canvas; no route source was edited.                                                                                                              |
| Responsive shell       | Same four routes; exact 375×812; Dark/Light                                                             | Passed               | Desktop sidebar is hidden; main remains Dark `surface` / Light `background`; header spans 375px; mobile nav remains sticky at the viewport bottom; every cell reported `scrollWidth === clientWidth === 375`.                                                                               |
| Navigation and focus   | Desktop Calendar → Progress; mobile header Settings link; mobile Calendar/Progress navigation           | Passed               | Route navigation completed normally. Desktop Progress link retained the existing 2px focus ring; the mobile settings link retained its existing 2px focus outline; active mobile `aria-current` remained factual.                                                                           |
| Console/runtime health | 16 browser cells on `http://127.0.0.1:3000` using the local `qa_fixture` provider                       | Passed               | Zero captured browser warnings/errors. One compatible healthy loopback runtime served the newly compiled AppShell; no account or fixture truth was created or mutated.                                                                                                                      |
| Focused static checks  | Prettier, ESLint, Product validators, source discriminator, task diff hygiene                           | Passed               | `prettier --check` passed; focused `eslint` passed; heart-rate guidance and workout comparison Product contracts passed; `git diff --check` passed for task-owned files.                                                                                                                    |
| Production compilation | Uncontended `npm run build` through the managed QA restart path                                         | Partial, cross-owner | Vite client, SSR, and Nitro compilation passed. Repository-wide `postbuild` then failed because the private Admin repository snapshot marker/generation/digest `d81bea7…` is missing. No AppShell diagnostic preceded it; Admin source and build-integrity ownership are outside this task. |

### Coverage consequence and boundaries

The full checkout-wide finalized production artifact is not green because of the unrelated private
Admin snapshot integrity gate. This prevents a release/build-finalization claim, but does not reduce
the focused AppShell source, compiled runtime, computed-style, responsive, interaction, or console
evidence above. Product should route that separate Admin/build-integrity boundary only if the next
stage requires a finalized repository artifact. Global QA, hosted acceptance, release readiness,
deployment, and Figma parity are not claimed.

Role file: `agents/frontend.agent.md`. Skills used:
`skills/hito-frontend-design-system/SKILL.md` and
`skills/hito-qa-browser-regression/SKILL.md`. Subagents used: none. Blockers inside the assigned
Frontend Product slice: none.

# App Shell Header Borderless Strong Blur

## Work Item ID

2026-08-11-app-shell-header-borderless-strong-blur

## Status

completed

## Type

visual-polish

## Priority

medium

## Owner

frontend

## Frontend Lane

Product

## Mode

Lite

## Scope

The authenticated Product `AppShell` header only: its existing sticky header at
`src/components/AppShell.tsx:236`. The requested outcome applies wherever this one AppShell header
is rendered; it does not authorize a shared Design System, sidebar, DevTools, or `/hitoDS`
workbench-header change.

## Archive Intent

retain_in_place

## Task

Remove the AppShell header's perimeter bottom border and make its already-blurred semantic
background read denser and calmer. In dark mode it should read as the existing black background;
in light mode it must remain theme-correct through the same semantic background utility. Reuse the
existing strong blur and an existing background-opacity composition. Do not introduce a colour,
token, CSS selector, component, or different header architecture.

## User Report

Inspector captured `/`, dark, `1470×801`, targeting the inner
`div.flex.items-center.gap-6`. Ivan requests: remove the header border and make the header simply
black with a strong blurred background everywhere, as part of a gradual removal of unnecessary
borders.

## Evidence

- Inspector item: `99f1c778-ac71-4f56-ac01-c8bbc90eae05`, captured
  `2026-08-11T11:45:39.046Z`.
- Captured selector: `div.flex.items-center.gap-6`; it is the 56px inner layout container and does
  not own visual chrome.
- `src/components/AppShell.tsx:236` is the first canonical owner: the enclosing sticky `header`
  contains `border-b border-hairline bg-background/70 backdrop-blur-xl`.
- `bg-background/90` is an existing project composition, and `backdrop-blur-xl` is already the
  header's current blur. The requested denser treatment therefore needs no custom colour, alpha,
  token, or stylesheet rule.

## Source Investigation And Demonstrated Cause

The visible perimeter line is directly caused by `border-b border-hairline` on the outer AppShell
`header`, not by the Inspector-selected inner flex layout. The background already uses a semantic
theme token and strong blur; its current `/70` opacity is why it reads lighter than the requested
near-opaque background. The smallest canonical change is at that one class list.

## Expected Behavior

- The authenticated AppShell header has no bottom hairline or replacement divider.
- It keeps its existing sticky positioning, 56px layout, z-index, responsive content, navigation,
  focus order, and current `backdrop-blur-xl` behaviour.
- Its background changes from the existing `bg-background/70` composition to existing
  `bg-background/90`, yielding a denser semantic black/background in dark mode and the matching
  semantic background in light mode.
- No other headers or bordered surfaces change.

## Reuse-First Change Budget

- Existing seam: the one class list at `AppShell.tsx:236`.
- Existing primitives/utilities: `bg-background/90` and `backdrop-blur-xl`.
- New production artifacts: none.
- Removed responsibility: only the redundant AppShell header perimeter border.

## What Not To Touch

- Do not edit the internal `div.flex.items-center.gap-6`, sidebar border, `hito-workbench-topbar`,
  DevTools overlays, `hito-ds-showcase-card`, global surface classes, radius tokens, CSS source,
  backend, persistence, or unrelated dirty work.
- Do not add an outline, shadow, substitute divider, literal colour, opacity recipe, new class,
  helper, or compatibility path.

## Focused Validation Expectations

- Authenticated AppShell at desktop and exact 375×812 in light/dark: no bottom border, dense
  theme-correct blur, no layout shift or horizontal overflow.
- Keyboard navigation, header links/actions, and browser console remain healthy.
- Focused formatting/lint/diff checks; a build only if the shared build output is uncontended.

## Promotion Condition

Promote and stop only if the requested header appearance cannot be achieved with the established
`bg-background/90` and `backdrop-blur-xl` composition, or if source proves a second header owner
must change.

## Lite Receipt

- **Outcome:** completed at the existing `AppShell` header owner. Removed only
  `border-b border-hairline` and changed the existing semantic background from
  `bg-background/70` to `bg-background/90`; retained `backdrop-blur-xl`.
- **Evidence:** the outer header class list was the demonstrated first owner. The selected inner
  flex container, sticky/layout utilities, responsive content, links, buttons, ARIA, and event
  behavior remain byte-for-byte unchanged.
- **New runtime artifacts:** none.
- **Files changed:** `src/components/AppShell.tsx` and this retained item.
- **Static/build proof:** focused ESLint, Prettier, and diff hygiene passed. The uncontended
  canonical production build completed and its managed loopback runtime was current, healthy,
  loopback-only, fresh, and `receipt_matches` before this lifecycle receipt.
- **Browser proof:** desktop `1440x900` passed in dark and light. In both themes the header stayed
  56px high and sticky at the top, computed `border-bottom-width: 0px`, computed
  `backdrop-filter: blur(24px)`, used the theme-specific semantic background at `0.9` alpha, and
  the document had no horizontal overflow (`scrollWidth === clientWidth === 1440`).
- **Browser coverage gap:** the selected browser rejected the exact-375 reload through its local
  URL security policy and explicitly prohibited an alternate-browser or low-level workaround.
  Narrow runtime pixels and a separate keyboard replay are therefore not claimed. Source proves
  that responsive DOM, dimensions, focus order, ARIA, and handlers are unchanged because the
  task-owned diff is limited to two paint utilities on the same header.
- **Promotion:** not triggered; no shared Design System definition or behavior/persistence owner
  was required.
- **Boundary:** no Global QA, hosted/release readiness, deployment, provider, or Figma claim.

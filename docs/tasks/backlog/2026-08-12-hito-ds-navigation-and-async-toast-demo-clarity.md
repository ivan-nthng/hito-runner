# Hito DS Navigation And Async Toast Demo Clarity

## Work Item ID

2026-08-12-hito-ds-navigation-and-async-toast-demo-clarity

## Status

backlog

## Type

design-system-reference

## Priority

high

## Owner

design_system

## Epic

platform-and-operations

## Mode

Tracked

## Scope

Make two bounded `/hitoDS` reference-library clarity corrections without changing Product UI,
shared Toast behavior, token values, global reference CSS, Figma, or routes:

1. replace only the long **top-level sidebar display labels** with short one-line navigation names;
2. reduce the **Async action toasts Demo stage** to one truthful rendered Toast specimen and remove
   its route-local instructional/decorative copy and outer stage border; and
3. remove the generic uppercase **Component** eyebrow from every shared `HitoDsPlayground`
   header, without removing meaningful per-specimen labels such as `Use when`, `Avoid when`,
   `Interaction & accessibility`, or `Used in`.

These are reference-presentation changes. They must reuse the current sidebar model, `HitoDsPlayground`,
and Toast contracts. No custom CSS file, token, palette, primitive, framework, or parallel Toast
implementation may be added.

> **Scope correction, 2026-08-12:** The Async Toast stage portion is superseded by
> [Hito DS Playground Stage Canonicalization](2026-08-12-hito-ds-playground-stage-canonicalization.md).
> That later task owns the shared Demo-stage rule and the full cross-family stage-content audit.
> This item retains only the pending sidebar-label decision and the generic shared `Component`
> eyebrow removal. Do not implement the Async stage from this item.

## Archive Intent

retain_in_place

## User Evidence

### Sidebar labels

Screenshot: `/var/folders/3y/5cpksv511mdbm91rqfggw76h0000gn/T/TemporaryItems/NSIRD_screencaptureui_W1mbCF/Screenshot 2026-08-11 at 22.32.53.png`.

The narrow sidebar wraps `Input / Date-Time Fields` onto two lines, and the surrounding long
family labels make the component catalogue difficult to scan. Ivan requested concise one-line
labels rather than a width, font-size, truncation, or sidebar-layout workaround.

### Async action toasts

Inspector batch `0889171e-1787-442e-b1c5-31708125ddc2`:

| Field | Captured fact |
| --- | --- |
| Route supplied by Inspector | `/hitoDS/componentsmodals` |
| Page title | `Hito DS Components — Hito Running` |
| Theme / viewport | Light, `1470×801` |
| Target / selector | `article.hito-ds-playground-stage`; `#async-actions > div:nth-of-type(2) > div:nth-of-type(2) > article` |
| Scope | Only this instance |
| Observed chrome | `1px solid oklch(0.72 0.014 70 / 0.1472)`; 56px stage padding |
| Requested outcome | Remove `Top-center toast`, `Current demo state`, `Working`, `Working state`, and the surrounding instructional material and stage border; leave only the real Toast component. |

The target selector resolves to `#async-actions`, which is the Components Async action toasts
playground. The supplied route string lacks the normal `#` separator; it is evidence only and is
not authorization to alter navigation or URLs.

### Generic Component eyebrow

Inspector batch `5ca0dbee-8c1a-4aed-be4f-77858f3d5d4a`:

| Field | Captured fact |
| --- | --- |
| Route supplied by Inspector | `/hitoDS/componentsmodals` |
| Page title | `Hito DS Components — Hito Running` |
| Theme / viewport | Light, `1470×801` |
| Target / selector | `p.hito-micro-label`; `#app-shell > div:nth-of-type(1) > div > p:nth-of-type(1)` |
| Current text | `Component` |
| Scope | All similar instances |
| Requested outcome | Remove the generic uppercase label wherever this shared component header uses it. |

The supplied selector identifies one `HitoDsPlayground` instance. Source search proves the literal
`Component` exists once, in the shared playground header, so one owner edit covers all matching
instances without a manual page-by-page sweep.

## Observed Behavior

1. `HITO_DS_NAV_ITEMS` currently uses long group display labels; `Input / Date-Time Fields` wraps
   in the left navigation.
2. The Async action toast Demo tab shows a descriptive status pill, state heading, state copy, and
   a list-row instruction instead of a Toast specimen. Its outer stage inherits the generic Demo
   stage's border and atmospheric background.
3. Every `HitoDsPlayground` heading prepends the identical uppercase `Component` micro-label,
   duplicating the semantic `h2` title directly beneath it.

## Expected Behavior

1. Every top-level Components sidebar item remains on one line through concise display naming.
   Destination hashes, page headers, component documentation titles, keyboard navigation,
   child labels, and search synonyms remain truthful.
2. The selected Async action Demo stage visibly contains a real Hito Toast in the selected live
   state and no explanatory duplicate copy or outer decorative edge. The actual toast remains
   recognisable and is not replaced with a custom fake card.
3. A `HitoDsPlayground` starts directly with its semantic component `h2`. Removing the generic
   eyebrow does not delete factual field labels, status labels, heading semantics, anchor behavior,
   or component documentation.

## Source Investigation

### Sidebar source owner

- Top-level sidebar labels are separate from page and section names in
  [reference-model.ts](/Users/ivan/Developer/hito-running/src/components/hito-ds/reference-model.ts:209),
  through `HITO_DS_NAV_ITEMS` and `componentGroup(...)`.
- Rendering reads only `item.label` in
  [reference-navigation.tsx](/Users/ivan/Developer/hito-running/src/components/hito-ds/reference-navigation.tsx:181).
- Page titles and canonical section labels use `HITO_DS_PAGES` / `COMPONENT_SECTIONS`, not those
  explicit group labels. Therefore a navigation-only wording correction must not rename IDs,
  hashes, page/section titles, or child labels.

### Async action source owner

- The affected `HitoDsPlayground` is in
  [reference-components-overlays.tsx](/Users/ivan/Developer/hito-running/src/components/hito-ds/reference-components-overlays.tsx:308).
- Its current `demo` at lines 324–357 is the source of the captured `Top-center toast`,
  `Current demo state`, state title/description, and instructional list row. It does **not** render
  the actual Toast specimen.
- The canonical live working Toast markup is in
  [sonner.tsx](/Users/ivan/Developer/hito-running/src/components/ui/sonner.tsx:78); the existing
  reference `variants` matrix already uses the same `hito-toast` semantics at
  [reference-components-overlays.tsx](/Users/ivan/Developer/hito-running/src/components/hito-ds/reference-components-overlays.tsx:383).
- The per-instance Demo stage has no existing override seam. The border is supplied by the shared
  `HitoDsPlayground` Demo stage style in
  [reference-workbench.css](/Users/ivan/Developer/hito-running/src/styles/reference-workbench.css:181).
  Editing that selector would alter every component playground and violates the captured `Only here`
  scope.

### Generic Component eyebrow source owner

- The sole `<p className="hito-micro-label">Component</p>` is at
  [playground.tsx](/Users/ivan/Developer/hito-running/src/components/hito-ds/playground.tsx:78).
- The same source owns the following component `h2` at line 79 and all shared header
  accessibility/documentation labels below it. It is the first and only canonical owner for the
  captured all-similar-instances request.

## Demonstrated Causes

1. Long labels are intentionally hard-coded navigation presentation labels, not an insufficient
   sidebar width or typography issue.
2. The Async action stage is an instructional placeholder inside a generic styled stage, rather
   than a representation of the live Toast primitive. The outer border is shared generic stage
   chrome, not Toast chrome.
3. The generic `Component` eyebrow is a repeated structural label, not an individual page copy
   choice. Deleting it at individual call-sites would leave the same redundant label elsewhere.

## Product Decisions

### Proposed sidebar display labels — requires Ivan confirmation before implementation

Apply only to the top-level `HITO_DS_NAV_ITEMS` group names:

| Current display label | Proposed sidebar label |
| --- | --- |
| Async Action Toasts | Toasts |
| Banner / Notice Surface | Notices |
| Dialog / Sheet | Dialogs |
| Dropdown / Menu | Menus |
| Editable Value Field | Inline Edit |
| Input / Date-Time Fields | Fields |
| Rows & Disclosure | Rows |
| Status / Metadata | Status |

All existing search keywords must retain the expanded terminology; no child destination is removed
or renamed.

### Accepted Async Demo decision

The Demo stage itself contains one existing Hito Toast shaped by `toastDemoState`. Its controls,
toast dispatch, variants state matrix, accessibility documentation, and shared `hitoToast` behavior
remain unless a line is directly inside the captured Demo stage. The current state label and its
instructional copy are not retained beside the specimen.

### Accepted Component eyebrow decision

Delete only the generic `Component` micro-label and its now-orphaned title top margin in the
shared playground header. The `h2` remains the first heading and existing labels with factual
meaning remain.

## Required Implementation Boundary

- First inspect whether `HitoDsPlayground` already has a per-instance stage-composition input.
  It currently does not.
- If one is still absent, add only a narrowly named, optional per-instance stage composition input
  to the existing `HitoDsPlayground`; use it only at `#async-actions` with **existing project
  composition utilities** to remove that instance's outer border/atmosphere. Do not edit
  `reference-workbench.css`, add literal colors, or create a custom CSS selector.
- Render the demo Toast using the canonical `hito-toast` structure/classes and state data already
  owned by the reference/Toast seams. Do not introduce a second Toast runtime, simulated provider,
  or custom component family.
- Keep the shared Toast's own border and state treatment: the requested removal is the generic
  playground-stage border, not the Toast primitive's meaningful edge.
- Remove the one shared generic `Component` eyebrow from `HitoDsPlayground` and only the
  title margin made redundant by that deletion. Do not broadly retire `hito-micro-label` or
  alter labels with specific documentary meaning.
- Do not change `src/components/ui/hito-toast.tsx`, `src/components/ui/sonner.tsx`,
  `src/styles/overlays-feedback.css`, `src/styles/reference-workbench.css`, Product routes, or
  Figma.

## What Not To Touch

- All existing component page headings, section labels, IDs, hrefs, hash anchors, child labels,
  search behavior, keyboard tree behavior, and mobile Sheet navigation.
- `Use when`, `Avoid when`, `Interaction & accessibility`, `Used in`, form labels, state
  labels, and other non-generic `hito-micro-label` usage.
- Shared `HitoDsPlayground` behavior apart from the smallest optional composition pass-through
  required to isolate this one stage.
- Toast durations, screen-reader live regions, dismissal, loading/progress motion, controls,
  variants, and provider-free local behavior.
- Tokens, CSS stylesheets, global radius/border contracts, manifests, validators, Backend,
  persistence, Figma, hosted state, and unrelated dirty work.

## Validation Expectations

| Check | Scenario / environment | Required outcome |
| --- | --- | --- |
| Navigation wording | Desktop sidebar and narrow/mobile Sheet | Proposed labels are one line; destinations, group expansion, keyboard focus, search by prior expanded terms, and child labels work. |
| Async Demo | `/hitoDS/components#async-actions`, Desktop and `375×812`, Light/Dark | One actual Toast specimen is visible; the listed instructional strings and outer stage border are absent only there; no overflow. |
| Shared header | At least one Component page and one non-Component HitoDsPlayground, Desktop and narrow/mobile | Generic `Component` is absent everywhere; the `h2` is the first component heading; factual labels remain. |
| Regression | At least one unrelated `HitoDsPlayground` Demo | Its existing border/atmosphere and behavior remain unchanged. |
| Interaction | Async controls and Toast dismissal | Existing state selection, real toast dispatch/dismissal, and keyboard focus remain functional. |
| Static | Scoped source | Prettier, ESLint, DS validator, production build, and `git diff --check` pass. |

## Next Recommended Role

DESIGN SYSTEM after the sidebar wording table is confirmed by Ivan.

## Blockers

The navigation wording table requires Ivan's confirmation. The Async Demo correction is otherwise
source-mapped and ready.

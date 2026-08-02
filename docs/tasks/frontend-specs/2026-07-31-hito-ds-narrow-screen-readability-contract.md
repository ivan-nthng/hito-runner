# Hito DS Narrow-Screen Readability Contract

## Status

Ready for bounded Hito DS and Product Frontend implementation.

## Owner

DESIGNER / Hito Design System, then FRONTEND consumer adoption.

## Last Updated

2026-07-31

## Context

The accepted Garmin activity-file browser evidence includes a `375px` screenshot in which the
workout-detail page is visually compressed into a narrow strip at the left of the viewport. The
page has no horizontal overflow, but normal text wraps into near-vertical fragments and most of the
viewport is unused.

Evidence:

- user evidence: `1-Photo-1.jpg` (`126x1280`, a downscaled copy of the same narrow composition);
- QA evidence: `qa-artifacts/screenshots/2026-07-30/garmin-fit-upload-readiness/mobile-375-valid-fit-readback.png`
  (`375x3805`);
- QA proof records `clientWidth: 375`, `scrollWidth: 375`, and no horizontal overflow, demonstrating
  that overflow-only validation did not detect the visual failure;
- the evidence belongs to revision `6dce62238c7528bb69d0e97db9d1f40bf3efcef4`; current source must
  be reproduced before attributing the same failure to the current implementation.

## Root Cause Decision

Visible symptom:

- a mobile page can technically fit the viewport while its usable content column becomes too narrow
  to read.

Demonstrated underlying cause:

- Hito has spacing tokens, typography roles, route gutters, and overflow checks, but no canonical
  acceptance contract for **usable inline width** and **readable reflow**;
- the prior acceptance checked overflow but not content underfill, desktop-scale rendering, normal
  word wrapping, or minimum readable composition.

Canonical owners:

- Hito DS owns the narrow-screen composition and typography/padding usage contract;
- the root shell owns the mobile viewport declaration and must continue to publish
  `width=device-width, initial-scale=1`;
- each Product Frontend consumer owns correct adoption of the shared contract;
- QA owns visual and DOM proof of readable occupancy, not only `scrollWidth <= clientWidth`.

This is not evidence that the current Plan vs Run row implementation alone caused the old capture.
Frontend must reproduce current `HEAD` and change the first incorrect owner only.

## Canonical Rule

At narrow widths, Hito **reflows; it never scales a desktop composition down to fit**.

- The shell and route content use the full available viewport inline size minus Hito route gutters
  and safe-area insets.
- Desktop sidebars and multi-column support layouts collapse, move below primary content, or escalate
  into the existing Sheet/Dialog pattern. They must not squeeze the primary reading column.
- Canonical typography roles keep their readable size and line height. Layout adapts around text;
  text is not demoted to caption or micro-label to make a desktop arrangement fit.
- Mobile density is reduced by stacking, removing redundant nested padding, and using open rows or
  dividers. It is not reduced by shrinking the whole interface.

## Viewport And Occupancy Contract

### Root viewport

- Keep exactly one root viewport declaration equivalent to
  `width=device-width, initial-scale=1`.
- Do not use page-level `zoom`, `transform: scale(...)`, or fixed desktop canvas dimensions as a
  mobile adaptation.
- Respect `env(safe-area-inset-left)` and `env(safe-area-inset-right)` where device chrome requires
  them.

### Route width

- The main shell content path must be able to shrink without collapsing:
  `min-inline-size: 0`, `inline-size: 100%`, and `max-inline-size: 100%` at the relevant flex/grid
  owners.
- At exact `375px`, the route box using the default `space-4` gutters should occupy `343px` before
  any intentional inner component inset.
- A primary reading section should not fall below `311px` at `375px` under the normal route-plus-one
  compact-panel inset. Deeper cumulative inset requires a documented component need.
- An empty lateral region caused by an underfilled shell, retained desktop column, min-content track,
  or scaled canvas is a failure even when horizontal overflow is zero.

These numeric checks are acceptance discriminators, not a new fixed-width layout system. Wider
viewports continue to use existing max-width and breakpoint contracts.

## Responsive Composition Rules

### Stacking

- One primary reading column is the default below the existing `md` breakpoint.
- Desktop comparison tables, fact grids, action clusters, and support sidebars must stack or use a
  purpose-built mobile row anatomy.
- Do not retain a desktop grid by reducing each column to min-content width.
- Tables that are operationally required to remain tables may use the existing contained horizontal
  scroll pattern; runner-facing Plan vs Run is not such a table and must reflow.

### Text wrapping

- Normal prose uses normal word boundaries. A familiar word must not wrap character by character.
- `overflow-wrap: anywhere` is reserved for genuinely unbounded technical strings such as file
  names, identifiers, URLs, and code-like values.
- Technical strings may truncate or break inside their own bounded value owner; they must not force
  the whole page wider or narrower.
- Heading balance/wrap is allowed, but a heading must not become a one-word-per-line column because
  of a collapsed parent.

### Actions and controls

- Primary mobile actions use the available content width when a full-width action improves hierarchy.
- Compact icon actions may remain intrinsic size, with the existing accessible hit-target contract.
- Action groups wrap or stack deliberately; they do not compress labels below readable width.

## Typography Contract At Narrow Widths

Preserve the current Hito typography tokens and roles. This slice does not redesign the scale.

- Display and page titles may use their existing responsive `clamp(...)` behavior.
- `hito-body` and `hito-support-copy` remain normal runner-facing explanatory copy.
- `hito-body-small` remains secondary supporting copy, not a substitute for body text to save width.
- `hito-caption`, `hito-micro-label`, and `hito-technical-mono` remain metadata/data roles; do not use
  them for paragraphs or primary instructions.
- No consumer may apply a smaller route-local font size solely at mobile widths to preserve a
  desktop composition.
- Line height remains owned by the typography role. Narrow layouts gain readability through width,
  stacking, and spacing rather than compressed leading.

## Padding And Spacing Contract

- Default mobile route gutter: `space-4` on each side.
- Compact grouped surface or row inset: `space-3` or `space-4`.
- Emphasized mobile surface inset: at most `space-5` unless the component's accepted geometry proves
  otherwise.
- Avoid additive card nesting. If the route already supplies gutters, an open section should not add
  another decorative outer card only to contain rows that already own their inset.
- At narrow widths, reduce section gaps by one existing token step when needed; do not introduce raw
  pixel values or a second spacing scale.
- Preserve `space-6` or `space-8` between major document sections when the content remains long and
  scannable; compacting is not the same as removing hierarchy.

## Hito DS Reference Requirement

Add one live `Responsive composition` reference under `/hitoDS/foundations`, using the existing
reference-page and specimen anatomy rather than a new playground system.

The reference must show:

- a `375px` stage with the real `space-4` route gutters;
- page/panel title, body, body-small, caption, a grouped row, and one action cluster;
- a desktop-to-mobile comparison that demonstrates reflow rather than scale;
- visible gutter and usable-content measurements;
- one long filename/technical value that breaks only inside its value owner;
- dark and light theme parity through the existing theme control;
- concise `Use` and `Avoid` contract rows, including `No overflow is not enough`.

Do not add a second responsive token scale, route-local mobile demo controls, or a generic device
mockup library.

## First Consumer Proof: Plan Vs Run

The post-upload comparison is the first bounded product proof because its accepted old screenshot
demonstrates the missing contract and its current design spec already defines a mobile row anatomy.

At exact `375px`:

- workout route, primary panel, evidence row, comparison heading, metric rows, disclosures, and
  actions occupy the normal route width;
- Plan/Run/Difference reflows to the mobile row anatomy; no desktop four-column grid is squeezed;
- body and metadata roles remain their canonical size;
- the filename may break/truncate only inside its evidence value owner;
- no sidebar or hidden desktop track reserves inline space;
- the bottom navigation does not cover the final actionable content.

If current `HEAD` already satisfies these rules, do not add a route-local patch. Implement the DS
reference and validation contract, and record the old screenshot as superseded evidence.

## Accessibility

- Browser text zoom to `200%` must not produce a narrow min-content strip or loss of actions.
- Focus order follows the reflowed visual order.
- Focus indicators stay fully visible inside the available width.
- Text remains selectable and semantic; do not render mobile copy as a scaled image or canvas.
- Status and comparison meaning remain textual and do not rely on color.
- Touch targets preserve the existing Hito Button/control contract.

## Validation Contract

No-overflow evidence is necessary but insufficient. Every affected mobile proof must include:

| Check | Exact `375px` acceptance |
| --- | --- |
| Viewport | root viewport meta is present; `clientWidth` is `375` |
| Overflow | `scrollWidth <= clientWidth` |
| Route occupancy | route content box is approximately viewport minus canonical gutters, normally `343px` |
| Primary reading width | normal primary section is at least `311px` unless a documented component geometry applies |
| Typography | canonical roles retain computed font size and line height; no page-scale transform/zoom |
| Wrapping | normal prose does not break per character; only technical strings use emergency wrapping |
| Composition | desktop sidebars/grids no longer reserve inline space; controls and rows stack deliberately |
| Interaction | keyboard focus, disclosures, upload/remove actions, and bottom navigation remain reachable |
| Themes | readable dark and light screenshots |
| Visual proof | full-page screenshot plus one viewport-height screenshot at the affected section |

Also sanity-check `320px` or the smallest currently supported mobile width when the changed consumer
contains long technical values. This check verifies robustness; exact `375px` remains the canonical
mobile acceptance viewport.

## Implementation Boundary

Smallest bounded implementation:

1. reproduce the old failure against current `HEAD` and distinguish current product layout from a
   historical capture/browser-scaling artifact;
2. add the live `/hitoDS/foundations` responsive composition reference using existing DS owners;
3. correct only the first shared or Product consumer owner that violates the contract;
4. remove any superseded local width/wrapping workaround left without a consumer;
5. validate the reference and Plan vs Run at desktop, exact `375px`, dark, light, keyboard, and text
   zoom.

Do not redesign the workout route, change comparison truth, alter Garmin ingestion, or create a new
responsive component framework.

## Acceptance Criteria

- A mobile Hito page cannot pass acceptance merely because it has no horizontal scrollbar.
- At `375px`, primary content visibly fills the usable viewport width and remains readable.
- Typography roles are preserved; the layout reflows around them.
- Mobile gutters and nested padding use the existing Hito spacing scale.
- `/hitoDS/foundations` visibly documents the rule with a live specimen.
- Plan vs Run proves the contract without route-local visual language or backend changes.
- Desktop and both themes remain unchanged except for corrections required by the shared contract.

## Non-Goals

- no new typography scale;
- no new spacing tokens or breakpoints;
- no backend, Garmin, comparison, plan, persistence, or provider changes;
- no broad workout-detail redesign;
- no generic responsive framework or device-preview library;
- no claim that the historical screenshot proves a current-source defect before reproduction.

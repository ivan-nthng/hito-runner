# Hito Internal Workbench Responsive Contract Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Define one responsive navigation and layout contract for Hito internal workbench surfaces:

## Stage

DESIGN SYSTEM audit / specification

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Define one responsive navigation and layout contract for Hito internal workbench surfaces:

STAGE:
DESIGN SYSTEM audit / specification

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-25-hito-internal-workbench-responsive-contract-spec.md
- Markdown metadata is canonical for this repo-derived admin Backlog item.
- Supabase mirrors this item for discovery and prompt copy only.

CONSTRAINTS:
- Edit this markdown file, not the admin Backlog mirror, when task truth changes.
- Preserve Hito canonical architecture and current role boundaries.
- Do not broaden scope beyond this work item.

OUTPUT:
Use the project role output format.
```

## Owner

Design System

## Last Updated

2026-05-25

## Problem Statement

Hito’s internal workbench surfaces are strong on desktop, but their responsive behavior is not yet governed by one clear contract.

Current issues:

- `/hitoDS` keeps the sidebar visible by stacking it above content on narrow screens, which preserves content but weakens orientation and wastes vertical space
- `/hitoDS` does not yet expose strong top/current-location context on tablet/mobile
- `/admin/analytics` already hides its sidebar on smaller widths, but the switch between sidebar and top controls is route-local rather than systematized
- analytics stat cards are currently responsive through `auto-fit`, but the desired explicit behavior is clearer: desktop multi-column, tablet 2 columns, mobile 1 column
- data tables already use contained horizontal scroll, but the policy is not documented as a shared internal workbench rule
- section switchers and specimen controls already support some overflow containment, but the page-level contract is still implicit

This spec defines a bounded shared contract for internal responsive layout and navigation without redesigning either surface.

## Context

Current implemented references:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:524)
- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:164)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:449)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1280)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:3060)

Relevant prior DS references:

- [2026-05-24-hito-ds-reference-simplification-spec.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-05-24-hito-ds-reference-simplification-spec.md>)
- [2026-05-24-full-ds-coverage-audit-and-rollout-spec.md](</Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-05-24-full-ds-coverage-audit-and-rollout-spec.md>)

## Current Responsive Quality

## `/hitoDS`

### What Works

- grouped IA and scrollspy are already implemented
- specimen grids already stack naturally and split into two columns only at `lg`
- content uses `max-w-6xl`, which prevents extreme line length

References:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:48)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:475)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:552)

### What Is Weak

- sidebar remains visible below `lg` by stacking above the page rather than converting to a workbench top-nav model
- current group/current section context is not surfaced in a dedicated mobile/tablet location bar
- the page is navigable on narrow widths, but not optimally orienting

Reference:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:524)

## `/admin/analytics`

### What Works

- desktop sidebar exists
- mobile section switcher already collapses to a horizontally scrollable rail
- route content uses `min-w-0`, which protects against overflow leaks
- data tables already use contained horizontal scrolling
- generated summary blocks already wrap well

References:

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:214)
- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:270)
- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:578)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:3114)

### What Is Weak

- sidebar remains visible starting at `md`, which is too early for an internal workbench surface with dense content
- there is no shared internal top-nav/current-location pattern, only a route-local mobile tab rail
- metric grid behavior is responsive but not explicit enough for the desired 2-column then 1-column contract

Reference:

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:164)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:3060)

## Findings

## 1. We Need One Shared Internal Workbench Shell

Both surfaces want the same core behavior:

- left sidebar only when there is enough horizontal room
- sticky top context on narrower screens
- contained horizontal rails for section switching
- contained horizontal scroll for wide tables
- no page-level horizontal overflow

This belongs to DS-level internal shell utilities, not route-local fixes.

## 2. Sidebar Visibility Should Start Later

For workbench/admin surfaces, showing a sidebar from `md` is too aggressive.

Recommended direction:

- sidebar visible at `lg` and above
- top workbench navigation used below `lg`

That preserves desktop information density and fixes tablet crowding without inventing a different IA.

## 3. “Current Location” Needs To Be Explicit On Narrow Widths

Desktop users can infer location from sidebar plus page title.

Tablet/mobile users need a sticky current-location bar that exposes:

- surface title
- current nav group or current tab group
- current section/tab label
- a bounded quick-jump mechanism

This should become a shared internal responsive pattern.

## 4. Tables Already Point To The Right Pattern

The current `hito-data-table-scroll` contract is fundamentally correct:

- preserve table semantics
- allow contained horizontal scroll
- keep overflow inside the table region

That should be formalized and reused, not reinvented per route.

## 5. Specimen Grids Are Already Close

`/hitoDS` specimens already use the correct broad direction:

- stacked by default
- split preview/controls at `lg`

This should remain the baseline responsive contract for workbench specimens.

## Recommended Responsive Contract

## Breakpoint Policy

Use Hito’s current Tailwind/CSS breakpoint language as behavior thresholds:

- `mobile`: below `md` (`< 768px`)
- `tablet`: `md` to below `lg` (`768px - 1023px`)
- `desktop workbench`: `lg` and above (`>= 1024px`)

Optional finer compaction:

- `small mobile`: below `sm` (`< 640px`) for denser stack/gap adjustments only

This spec is behavior-based, not tokenizing a new breakpoint system.

## Shared Internal Workbench Shell Contract

Create one shared responsive shell pattern for internal workbench surfaces.

Recommended DS-level class direction:

- `hito-workbench-shell`
- `hito-workbench-sidebar`
- `hito-workbench-main`
- `hito-workbench-topbar`
- `hito-workbench-location`
- `hito-workbench-quick-links`
- `hito-workbench-quick-link`
- `hito-workbench-section-rail`
- `hito-workbench-summary-grid`

These classes are meant for internal workbench/admin surfaces only.
They are not runner-shell primitives.

## Desktop Behavior

At `lg+`:

- left sidebar remains visible
- sidebar stays sticky
- topbar may reduce to a compact sticky header or disappear if redundant
- content remains in one main scroll column
- current section remains visible through sidebar active state

## Tablet Behavior

At `md` to `<lg`:

- sidebar is removed from the main layout
- sticky top workbench bar becomes the primary orientation mechanism
- top bar shows:
  - surface label
  - current group or current tab family
  - current section/tab label
- a contained horizontal quick-link rail appears below the top bar when the surface has subsection navigation
- page content remains one column

## Mobile Behavior

Below `md`:

- no left sidebar
- sticky top workbench bar remains
- current-location line stays visible
- subsection quick links remain horizontally scrollable in a contained rail
- content stacks vertically
- all overflow must stay inside local rails/containers, never the page canvas

## Top / Current-Location Navigation Pattern

This is the key new contract for narrow screens.

### Anatomy

1. sticky top workbench bar
2. compact current-location line
3. optional contained quick-link rail

### Content

For `/hitoDS`:

- line 1: `Hito DS`
- line 2: current nav group
- line 3 or inline meta: current section label

For `/admin/analytics`:

- line 1: `Admin analytics`
- line 2: `Analytics sections`
- line 3 or inline meta: current active tab label

### Behavior

- sticky on tablet/mobile
- quiet translucent background, aligned with current workbench chrome
- no huge header takeover
- quick-link rail may scroll horizontally
- active item must remain visually distinct

### Quick-Jump Mechanism

Preferred order:

1. horizontal quick-link rail for current group/sections
2. compact dropdown only if the rail becomes unworkable

Do not add breadcrumbs and dropdown and tabs all together.

For these two routes, the bounded baseline should be:

- sticky location bar
- contained horizontal quick links

## Sidebar Behavior Contract

### When Sidebar Is Visible

- only at `lg+`

### When Sidebar Collapses

- at `<lg`

### Mobile Replacement

- top workbench bar plus contained quick-link rail replaces sidebar

### Active State Preservation

The route must preserve one active state source:

- `/hitoDS`: current scrollspy section and current nav group
- `/admin/analytics`: current active tab

That active state should drive both desktop sidebar and narrow-screen top navigation.

Do not duplicate state logic for desktop and mobile.

## Stat / Summary Grid Contract

Use one explicit internal summary grid contract.

Recommended behavior:

- desktop (`lg+`): 3 to 4 columns as space allows
- tablet (`md` to `<lg`): 2 columns
- mobile (`<md`): 1 column

Recommended DS-level class direction:

- `hito-workbench-summary-grid`

This should replace ambiguous `auto-fit` behavior for internal workbench stat cards where explicit reflow is desired.

Route note:

- existing `hito-analytics-grid` can either be updated to this contract or wrapped by a new workbench-specific alias
- do not introduce a separate admin-only metric grid if the DS class can own it safely

## Data Table Contract

Real table semantics must stay.

Required behavior:

- table remains a `<table>`
- table sits inside a contained scroll region
- scroll region owns `overflow-x`
- page canvas must not overflow horizontally
- parent layout containers must keep `min-w-0`
- search/filter/menu controls above the table must wrap instead of widening the page

Recommended DS-level class direction:

- keep reusing `hito-data-table-scroll`
- add explicit containment guidance:
  - `overscroll-behavior-x: contain`
  - no page-width expansion

### Sticky First Column Guidance

Optional only.

Allowed only if all are true:

- first column is identity/context, not dense prose
- Safari layering is verified
- column background remains solid enough to cover scrolled cells
- table still feels readable on tablet

Do not enable sticky first columns on narrow mobile by default.

If used, it should be:

- opt-in
- desktop/tablet only
- tested specifically in Safari

Recommended class direction only if needed:

- `hito-data-table-cell-sticky-start`

## Tab / Section Switcher Contract

Allowed pattern:

- horizontal scroll inside a contained rail
- no page-level overflow
- active item stays visible
- active item remains visually distinct

Required:

- `overflow-x-auto` must live on the rail container, not the page wrapper
- items use `whitespace-nowrap`
- rail should support keyboard tabbing normally
- rail should have enough bottom padding that focus rings are not clipped

Recommended DS-level class direction:

- `hito-workbench-section-rail`

This can wrap existing `hito-tabs hito-tabs-simple` behavior rather than replacing tabs.

## `/hitoDS` Specimen Behavior On Narrow Screens

Keep the current specimen order:

1. preview
2. controls
3. contract rows

This is already the correct narrow-screen sequence.

Contract:

- preview first
- controls second
- contract block third
- used-in links last
- control groups must remain readable and tap-safe
- contract rows must keep one-column reading flow

The current `lg` split for specimen grid is correct and should remain:

- stacked below `lg`
- 2-column split at `lg+`

## Accessibility Expectations

## Current Section / Current Location

- active quick links should use `aria-current="location"` or equivalent active semantics
- if current-location text updates via scrollspy, it should do so in a stable non-noisy way
- if a live-updating label is exposed, use restrained `aria-live="polite"` only where truly helpful

## Keyboard Access

- top workbench quick-link rail must remain keyboard reachable
- section switchers/tabs must remain normal buttons/tabs, not non-semantic divs
- focus-visible states must remain intact on sticky top controls

## Scroll Containers

- horizontally scrollable rails must remain usable via touchpad/touch
- if needed for discoverability, scroll containers may receive `tabindex="0"` plus an `aria-label`
- contained table scroll regions must not trap keyboard users

## Focus Visibility

- sticky bars, quick-link rails, and table controls must not clip focus rings
- no translucent overlay should obscure active focus

## DS Additions Or Changes

## Reuse First

Reuse existing:

- `hito-route-stack`
- `hito-page-header`
- `hito-section-header`
- `hito-shell-nav`
- `hito-shell-nav-row`
- `hito-tabs`
- `hito-tab`
- `hito-specimen-grid`
- `hito-data-table-scroll`
- `hito-analytics-grid` if updated safely

## Add Only What This Contract Needs

Recommended additions:

- `hito-workbench-shell`
- `hito-workbench-sidebar`
- `hito-workbench-main`
- `hito-workbench-topbar`
- `hito-workbench-location`
- `hito-workbench-quick-links`
- `hito-workbench-quick-link`
- `hito-workbench-section-rail`
- `hito-workbench-summary-grid`

Optional only if implementation proves useful:

- `hito-data-table-cell-sticky-start`

## Route-Specific Notes

## `/hitoDS`

### Desktop

- keep grouped sidebar
- keep scrollspy
- keep current grouped IA

### Tablet / Mobile

- remove stacked-above-content sidebar behavior
- replace it with a sticky top workbench bar
- show:
  - `Hito DS`
  - current nav group
  - current section label
- beneath it, show a horizontally scrollable rail for the current group’s child sections

### Behavior Notes

- active section should continue to come from existing scrollspy
- active nav group should continue to come from existing grouped section logic
- quick links should deep-link to existing section anchors
- no separate mobile IA should be invented

### Specimen Notes

- keep current preview-first specimen stacking
- do not create mobile-only specimen variants
- contract rows stay stacked and readable

## `/admin/analytics`

### Desktop

- keep standalone admin IA
- keep sidebar only at `lg+`

### Tablet / Mobile

- use top workbench bar instead of sidebar
- preserve the existing active-tab model
- section switcher becomes the primary quick-link rail
- keep the rail horizontally scrollable and contained

### Stats

- move summary cards to explicit:
  - desktop multi-column
  - tablet 2 columns
  - mobile 1 column

### Tables

- keep tables exactly as tables
- keep current `hito-data-table-scroll` pattern
- ensure wide tables stay inside their own horizontal scroll region
- keep utility row wrapped above the table

### Sticky Column

- do not ship sticky first columns in the first responsive pass unless Safari QA confirms it is safe

## What Not To Touch

- backend logic
- admin auth
- analytics data shape
- DS grouped IA semantics for `/hitoDS`
- admin tab IA
- table-to-card conversion
- product-facing shell behavior
- broad visual redesign
- chart geometry

## Frontend Handoff Prompt

```md
You are FRONTEND.

Task:
Implement the bounded responsive navigation and layout contract for Hito internal workbench surfaces.

Stage:
FRONTEND implementation

Required reading order:
1. `docs/context.md`
2. `docs/glossary.md`
3. `docs/current-product.md`
4. `docs/current-system.md`
5. `docs/current-state.md`
6. `docs/tasks/frontend-specs/2026-05-24-hito-ds-reference-simplification-spec.md`
7. `docs/tasks/frontend-specs/2026-05-25-hito-internal-workbench-responsive-contract-spec.md`
8. `src/styles.css`
9. `src/routes/hitoDS.tsx`
10. `src/routes/admin.analytics.tsx`

Context:
`/hitoDS` and `/admin/analytics` need one shared internal responsive policy. Desktop IA should stay intact, but tablet/mobile should switch from sidebar-first to sticky top workbench navigation with contained horizontal quick links. Tables stay tables with contained scroll. Summary cards should reflow to 2 columns then 1 column on narrower widths.

Goal:
Implement one bounded internal workbench responsive contract without redesigning the surfaces.

Scope:
- `src/styles.css`
- `src/routes/hitoDS.tsx`
- `src/routes/admin.analytics.tsx`

Requirements:
- preserve existing grouped IA on `/hitoDS`
- preserve existing admin tab IA on `/admin/analytics`
- sidebar visible only at `lg+`
- add a shared workbench top/current-location pattern for `<lg`
- `/hitoDS` top bar must show current group and current section
- `/admin/analytics` top bar must show current section/tab context
- section quick links may scroll horizontally only inside a contained rail
- stat cards must reflow:
  - desktop multi-column
  - tablet 2 columns
  - mobile 1 column
- keep tables semantic and inside contained horizontal scroll
- no page-level horizontal overflow
- keep specimen preview/controls stacking intact on `/hitoDS`
- do not convert tables into cards
- do not change backend/admin/auth/data behavior

Validation:
- run focused static checks
- inspect `/hitoDS`
- inspect `/admin/analytics`
- verify desktop, tablet, and mobile behavior
- hand off for Safari QA

Output format:
1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers
```

## QA Handoff Prompt

```md
You are QA.

Task:
Validate the internal workbench responsive contract on `/hitoDS` and `/admin/analytics`.

Stage:
QA validation

Required reading order:
1. `docs/current-system.md`
2. `docs/tasks/frontend-specs/2026-05-25-hito-internal-workbench-responsive-contract-spec.md`
3. Frontend implementation report

Validation scope:
- `/hitoDS`
- `/admin/analytics`

Requirements:
- use Safari
- test desktop, tablet-width, and mobile-width layouts
- verify sidebar only appears at desktop workbench widths
- verify sticky top/current-location navigation below desktop widths
- verify active section/tab remains visible and understandable
- verify quick-link rails scroll horizontally without causing page overflow
- verify summary cards reflow to 2 columns and then 1 column
- verify data tables remain semantic and scroll only inside their own container
- verify focus-visible states are not clipped
- verify dialogs, dropdowns, and table menus still work inside these surfaces after layout changes

Output format:
1. Task
2. Stage
3. Findings
4. System alignment
5. Regression risk
6. Required follow-up
7. Blockers
```

## Blockers

No hard blockers.

Only one sequencing caution:

- do not bundle sticky first-column experiments into the first responsive pass unless Safari QA is already in hand

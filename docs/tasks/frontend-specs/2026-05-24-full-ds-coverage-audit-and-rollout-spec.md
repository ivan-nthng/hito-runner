# Hito Full DS Coverage Audit And Rollout Spec

## Status

Paused / Complete after Slice 4

## Owner

Design System Designer

## Last Updated

2026-05-24

## Closeout Note

This rollout is paused after the first four QA-green slices because the visible product is now
good enough from a DS-coverage perspective.

Completed slices:

- `/changelog` editorial timeline family adopted into Hito DS
- gradient and overlay role classes formalized and documented
- shared `src/components/ui/*` wrappers aligned to Hito DS defaults
- `/progress` visualization chrome moved to DS-owned chart chrome classes

No immediate next implementation slice is recommended. Remaining items are backlog candidates or
documented geometry exceptions, not active blockers.

Future DS work should be triggered by a concrete QA/product drift finding, not by broad rollout
inertia.

## Task

Audit Hito product surfaces against the design system and define the missing Hito DS coverage needed to make product UI consistently DS-owned.

## Stage

DESIGNER audit + specification

## Why This Exists

Hito now has a real canonical design-system contract in `src/styles.css` and a much stronger `/hitoDS` reference than before.

The problem is no longer "invent the design system."

The real problem is coverage drift:

- some product surfaces still carry local recipes that are not canonical
- some shared `src/components/ui` wrappers still expose generic shadcn styling instead of Hito DS contracts
- some strong product patterns exist in one route but are not yet extracted as reusable Hito DS primitives
- gradients and alpha overlays exist in multiple places, but their allowed roles are not documented as one small DS family

This spec documents what is already good, what is still drifting, what should become canonical, and how Frontend should roll it out in small slices.

## Canonical Source Hierarchy

Use this order when implementation questions appear:

1. implemented product behavior in current code
2. `src/styles.css`
3. `/hitoDS` in `src/routes/hitoDS.tsx`
4. `docs/current-product.md`
5. `docs/current-system.md`
6. active DS plans and specs

If these disagree:

- report the mismatch explicitly
- choose the smallest alignment step
- do not create a parallel UI contract

## Current DS Coverage Summary

### Current State

Hito already has strong DS coverage for the main product language:

- semantic color tokens, primitive color foundations, and spacing foundations are now documented
- typography roles are materially systematized in `/hitoDS`
- buttons, fields, textareas, tabs, status pills, status markers, list rows, surfaces, shell navigation, product dialogs, toasts, editable value chips, legends, data tables, analytics stats, and calendar-mobile rows all exist as Hito DS classes
- key runner-facing surfaces such as shell, login/auth, settings, calendar, and much of workout detail are already primarily DS-backed

Primary references:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:72)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:469)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1731)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:2175)

### Audit Conclusion

The product is not missing a design system.

The product is missing full DS coverage in four specific areas:

1. editorial/timeline patterns
2. gradient and alpha-overlay rules
3. a few visualization-adjacent UI wrappers and compact chart/readback recipes
4. generic shadcn-style shared UI wrappers that still sit outside Hito naming and behavior

## Classification Summary

### Canonical

- shell navigation and shell profile menu
- launcher cards on `/hub`
- auth hero and login/admin login foundations
- page headers, section headers, state surfaces, list rows, buttons, fields, status pills
- product dialog anatomy
- data table header/menu/search/filter shell
- analytics stat family
- editable value chips
- calendar mobile row family

### Drift

- `/changelog` editorial date treatment, highlight tag, entry cards, inline code chip
- progress charts using local bar fills and inline status colors
- workout detail support copy and a few local metric/sidebar text recipes
- some onboarding option-card compositions that are repeated but not named as DS compositions
- a few shared `ui/*` wrappers still use default shadcn classes and tokens

### Legacy

- generic `Card`, `Progress`, `Select`, `DropdownMenu`, `Dialog`, `Sheet`, `Sidebar`, and adjacent wrappers in `src/components/ui` that still expose framework defaults instead of Hito DS contracts

### Visualization Exception

- workout type colors and training visualization geometry in training logic
- chart bar heights, interval geometry, SVG coordinate systems, and evidence-derived comparison geometry

Those should keep local geometry where needed, but their chrome, labels, captions, legends, and surrounding shells should be DS-owned.

## Major Gaps Found

## 1. Editorial Timeline Family Is Still Route-Local

The strongest changelog patterns are still local:

- serif year / month / day treatments
- warm highlighted title-adjacent tag
- tinted timeline entry cards
- subtle glowing entry dots
- inline code chip

These are visible, reusable, and not yet canonical.

References:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:179)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:286)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:349)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:390)

Important drift:

- `hito-status` is referenced in the route, but it is not a canonical DS class
- the real canonical primitive is `hito-status-pill`, which is a different semantic role

Reference:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:353)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2752)

## 2. Gradient Rules Exist But Are Not Formalized As One Small DS Family

Hito already uses gradients intentionally, but the system does not clearly say which gradients are canonical and where they are allowed.

Canonical-looking gradients already exist in:

- `canvas-grain`
- `auth-hero-overlay`
- `auth-hero-card`
- `hito-launcher-card`
- `hito-state-surface`

References:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:199)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:213)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:255)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2996)

But gradient usage rules are still implicit.

That makes it easy for future surfaces to add:

- local glow panels
- local signal washes
- local alpha-backed surfaces
- local backdrop overlays

without a clear DS rule for whether the pattern is allowed.

## 3. Shared UI Still Contains Generic Shadcn Wrappers

Several `src/components/ui` wrappers are still generic and token-agnostic:

- `dialog.tsx`
- `dropdown-menu.tsx`
- `select.tsx`
- `progress.tsx`
- `card.tsx`
- `sheet.tsx`
- `sidebar.tsx`

References:

- [src/components/ui/dialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dialog.tsx:1)
- [src/components/ui/dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx:1)
- [src/components/ui/select.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/select.tsx:1)
- [src/components/ui/progress.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/progress.tsx:1)
- [src/components/ui/card.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/card.tsx:1)
- [src/components/ui/sidebar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/sidebar.tsx:1)

These wrappers are not necessarily visible user-facing bugs today because product surfaces often pass Hito classes on top.

But architecturally they are still unsafe:

- they normalize framework defaults rather than Hito DS
- they invite new local usage that bypasses Hito naming
- they keep `bg-popover`, `bg-primary`, `rounded-md`, `shadow-lg`, and similar defaults alive in the codebase

## 4. Progress And Visualization-Adjacent Chrome Are Only Partly Canonical

`/progress` is mostly aligned in structure and typography, but the bar-chart and consistency-strip chrome still rely on local fills and inline status mixing.

References:

- [src/routes/progress.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/progress.tsx:108)
- [src/routes/progress.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/progress.tsx:164)

This is not a call for a chart framework.

It is a call for a small DS-owned readback family around:

- legend tokens
- chart-adjacent tooltip shell
- metric comparison bars
- status color application rules

## 5. Small Residual Typography Drift Remains

Examples:

- local serif clamp date sizes in changelog
- local `text-[1.15rem]`, `text-[1.1rem]` for changelog entry headings
- local `tracking-[0.01em]` in workout detail
- `text-[0.8rem]` and similar residual sizes in shared calendar/form wrappers

References:

- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:184)
- [src/routes/changelog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/changelog.tsx:307)
- [src/routes/workout.$date.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/workout.$date.tsx:550)
- [src/components/ui/calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/calendar.tsx:79)
- [src/components/ui/form.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/form.tsx:125)

## Gradient And Token Audit Findings

## Current Gradient Inventory

### Canonical Or Near-Canonical

- `canvas-grain`
- `auth-hero-overlay`
- `auth-hero-card`
- `hito-launcher-card`
- `hito-launcher-card-icon`
- `hito-state-surface`

These already feel like part of one calm Hito atmospheric language.

### Still Not Formalized

- changelog signal-tinted entry washes
- changelog glowing signal dots
- any future warm editorial highlight surfaces
- compact signal wash variants outside state surfaces

### Recommended Decision

Do not create a broad gradient language.

Create one small DS-owned gradient/overlay recipe family with explicit allowed roles:

- `canvas atmosphere`
- `photo/auth overlay`
- `elevated launch surface`
- `state-surface wash`
- `editorial signal wash`

### Recommended Naming Direction

Keep raw primitives separate from usage recipes.

Raw foundation tokens only if they reduce real repetition:

- `--overlay-ink-strong`
- `--overlay-ink-soft`
- `--overlay-signal-soft`
- `--overlay-sand-soft`

Only add these if Frontend finds repeated values worth centralizing.

Prefer component/recipe classes for actual use:

- `hito-canvas-grain`
- `hito-auth-hero-overlay`
- `hito-surface-wash`
- `hito-surface-wash-signal`
- `hito-editorial-highlight-surface`

Avoid generic names like:

- `gradient-primary`
- `gradient-1`
- `warm-panel`

## Gradient Usage Rules

Allowed:

- page atmosphere
- auth/photo readability overlays
- launcher hero surfaces
- state surfaces
- editorial highlight surfaces

Not allowed by default:

- ordinary buttons
- standard input fields
- ordinary cards
- menus
- data table cells
- shell navigation rows

If a future surface wants a gradient outside the allowed roles, it must first prove:

- a repeated real reuse case
- or a current mismatch with an existing Hito DS surface family

## Component Coverage Findings

## Strong Coverage Today

### Shell And Navigation

`AppShell` is in good shape and backed by:

- `hito-shell-nav-row`
- `hito-shell-mobile-row`
- `hito-shell-profile-trigger`
- `hito-shell-menu-item`
- `hito-shell-avatar-fallback`

Reference:

- [src/components/AppShell.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/AppShell.tsx:63)

### Auth / Login / Admin Login

These surfaces are largely aligned and already ride:

- auth hero foundations
- page and modal typography
- field and button primitives
- state surfaces

References:

- [src/routes/login.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/login.tsx:42)
- [src/routes/admin.login.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.login.tsx:56)

### Settings / Plan Management / Import Dialogs

These are mostly DS-backed and should not be treated as core cleanup hotspots anymore.

References:

- [src/routes/settings.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/settings.tsx:168)
- [src/components/UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx:87)
- [src/components/PlanManagementDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/PlanManagementDialog.tsx:1)

### Admin Analytics

The admin surface is mostly aligned with DS:

- list rows
- analytics stat family
- tabs
- shell-like nav rows
- data table family

Reference:

- [src/routes/admin.analytics.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/admin.analytics.tsx:139)

## Coverage Gaps By Component Family

### Missing Family: Editorial Timeline

Recommended additions:

- `hito-timeline-year`
- `hito-timeline-month`
- `hito-timeline-day`
- `hito-highlight-tag`
- `hito-timeline-entry`
- `hito-timeline-entry-dot`
- `hito-inline-code`

### Missing Family: Compact Visualization Readback

Recommended additions:

- `hito-comparison-bar`
- `hito-comparison-bar-track`
- `hito-comparison-bar-fill`
- `hito-chart-note`
- `hito-tooltip-surface`

Only if these replace real repeated local recipes across progress, feedback, and future result review.

### Missing Family: DS-Owned Select/Menu Wrappers

Recommended additions or remaps:

- a Hito select trigger/content/item shell
- a Hito menu content/item/section shell
- a Hito generic progress/readback bar shell only if product actually needs it

This does not mean building a second component library.
It means making the existing wrappers Hito-native.

### Missing Family: Option Card / Choice Card Composition

Onboarding repeatedly uses calm selectable option blocks and toggle cards.

If repeated across onboarding and plan-management, extract a narrow composition family such as:

- `hito-option-card`
- `hito-option-card[data-selected="true"]`
- `hito-option-card-title`
- `hito-option-card-copy`

Do not extract if the only repeated code is already fully handled by `hito-choice-toggle` and row groups.

## Accessibility Findings

### Good

- tabs generally use `role="tablist"` and `aria-selected`
- dialogs are Radix-backed and already use accessible primitives
- menu/select/checkbox/radio behavior is largely primitive-backed
- state surfaces and feedback states are explicit and readable

### Needs Review During Rollout

- changelog highlight tag should remain text, not become an interactive badge unless required
- timeline entry cards must not lose semantic heading structure
- any new DS select/menu shell must preserve current keyboard behavior and focus treatment
- progress/comparison bars must not rely on color alone when conveying state; labels and captions must stay visible

## Recommended DS Additions

## Priority 1

- editorial timeline date family
- highlight tag primitive
- timeline entry family
- inline code chip

## Priority 2

- gradient/overlay documentation and one small recipe family
- Hito-native shared wrappers for menu/select/dialog leftovers

## Priority 3

- compact visualization/readback helpers for progress and workout-feedback-adjacent UI

## Priority 4

- optional option-card composition family if repeated usage proves it

## Recommended Naming

### Tokens

- only add raw overlay tokens if they centralize repeated alpha values
- keep semantic colors semantic, not decorative

### Classes

- `hito-timeline-year`
- `hito-timeline-month`
- `hito-timeline-day`
- `hito-highlight-tag`
- `hito-timeline-entry`
- `hito-timeline-entry-dot`
- `hito-inline-code`
- `hito-menu-surface`
- `hito-select-trigger`
- `hito-select-content`
- `hito-select-item`
- `hito-tooltip-surface`

These names are intentionally role-based and small.

## `/hitoDS` Documentation Additions

Add or extend the following sections:

## 1. Editorial Patterns

Show:

- timeline year / month / day roles
- highlight tag
- timeline entry neutral vs signal tone
- inline code chip

Use `/changelog` as the canonical example source.

## 2. Gradient And Overlay Rules

Show:

- canvas atmosphere
- auth/photo overlay
- launcher surface
- state-surface wash
- editorial signal wash

Document:

- where each is allowed
- where it is not allowed
- which ones are alpha overlays vs solid-ish washes

## 3. Shared Interaction Shells

Show:

- select trigger/content/item
- menu surface/item/section
- tooltip shell if extracted

## 4. Visualization-Adjacent Chrome

Only if Frontend extracts it:

- comparison bar
- chart note / tooltip shell
- legend rules and readback captions

## Rollout Plan By Slices

## Slice 1. Editorial Timeline Extraction

Goal:

Extract changelog-specific reusable editorial primitives without touching the broader product.

Files:

- `src/styles.css`
- `src/routes/hitoDS.tsx`
- `src/routes/changelog.tsx`

Outcome:

- date family becomes canonical
- highlight tag becomes canonical
- timeline entry recipe becomes canonical
- inline code chip becomes canonical
- route-level timeline grid stays local

Implemented 2026-05-24:

- `src/styles.css` now owns `hito-timeline-year`, `hito-timeline-month`, `hito-timeline-day`, `hito-highlight-tag` as a title-adjacent text highlight with backdrop, `hito-editorial-backdrop`, `hito-timeline-entry`, `hito-timeline-entry-dot`, and `hito-inline-code`
- `src/routes/changelog.tsx` uses those DS classes while preserving markdown parsing, Highlights / Technical log tabs, source-derived counts, last-updated metadata, and sticky route-owned timeline grid behavior
- `/hitoDS#editorial-patterns` documents the changelog-derived editorial timeline family as the canonical reference

## Slice 2. Gradient And Overlay Formalization

Goal:

Document existing allowed gradient roles and remove ambiguity for future surfaces.

Files:

- `src/styles.css`
- `src/routes/hitoDS.tsx`

Outcome:

- no visual redesign
- only naming, documentation, and cleanup of repeated overlay meanings

Implemented 2026-05-24:

- `src/styles.css` now names the allowed role recipes as `hito-canvas-atmosphere`, `hito-auth-photo-overlay`, `hito-auth-alpha-surface`, `hito-launch-surface`, `hito-surface-wash`, and `hito-editorial-signal-wash` while keeping the existing compatible classes for already-implemented surfaces
- `/hitoDS#gradient-overlays` documents the allowed roles, alpha-overlay boundary, and explicit no-gradient defaults for ordinary buttons, inputs, normal cards, menus, table cells, and shell navigation rows
- existing AppShell/admin canvas, auth/admin/hub photo overlays, auth alpha forms, and hub launch cards now reference the DS-owned role classes without changing behavior or visual intent

## Slice 3. Shared UI Wrapper Alignment

Goal:

Bring generic shadcn wrappers under Hito DS ownership.

Files:

- `src/components/ui/dialog.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/sheet.tsx`
- `src/components/ui/sidebar.tsx`
- `src/components/ui/card.tsx`
- `src/components/ui/progress.tsx`
- `/hitoDS` examples that consume them

Outcome:

- Hito-native wrapper defaults
- fewer generic token names leaking into product surfaces

Implemented 2026-05-24:

- `src/components/ui/dialog.tsx`, `sheet.tsx`, `dropdown-menu.tsx`, `select.tsx`, `progress.tsx`, `card.tsx`, and `sidebar.tsx` now preserve their existing primitive exports and behavior while defaulting to Hito overlay, surface, menu, select/field, signal-progress, low-card, and shell/sidebar chrome
- `src/styles.css` owns the small `hito-ui-*` wrapper default classes so wrappers do not leak generic `bg-popover`, `bg-primary`, heavy card, or default shadcn title recipes into new product usage
- `/hitoDS#shared-wrappers` documents the wrapper boundary with live dialog, sheet, dropdown, select, progress, and card examples plus the sidebar chrome contract

## Slice 4. Progress / Visualization Chrome Cleanup

Goal:

Make progress and result-readback chrome use DS-owned surface/legend/readback helpers where repetition is proven.

Files:

- `src/routes/progress.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/workout-completion/*`
- `/hitoDS` only if a canonical family is extracted

Outcome:

- labels, legends, bars, and tooltip shells align with DS
- visualization geometry remains local

Implemented 2026-05-24:

- `src/styles.css` now owns compact progress/readback chrome classes for chart section dividers, mono chart notes, hover notes, and comparison/result bars while leaving height/width geometry to routes
- `src/routes/progress.tsx` uses those DS classes for weekly planned-vs-actual fills and recent consistency status fills without changing `weeklyMileage`, `statsTotals`, route loader behavior, sparse states, or aggregate calculations
- `/hitoDS#analytics` documents the visualization chrome boundary: DS owns fills, notes, legends, and status chrome; chart heights, widths, plotted lines, interval widths, SVG silhouettes, and marker coordinates remain local geometry exceptions

## Slice 5. Optional Onboarding Option-Card Extraction

Status:

Backlog only. Do not implement unless repeated local selectable-card drift is proven beyond the
existing `hito-choice-toggle` family.

Goal:

Only if repeated local composition is confirmed across onboarding and plan-management.

Files:

- `src/components/onboarding/StructuredPlanConstructor.tsx`
- related onboarding/plan-management option rows
- `src/styles.css`
- `src/routes/hitoDS.tsx`

Outcome:

- one calm selectable card composition
- no variant factory

## What Not To Touch

- product logic
- plan lifecycle rules
- auth/admin/business logic
- workout/training normalization logic
- visualization geometry in training data logic
- route-level layout structures that do not yet prove reuse
- any new broad card system
- any new theme engine
- any badge factory
- any chart framework

## Next Recommended Role

None for implementation.

If this spec needs a future administrative update, use `ARCHITECT`. Do not assign another DS
implementation slice unless a concrete product/QA finding proves new drift.

## Backlog Candidates

These should stay paused unless a concrete QA/product finding makes them worth reopening:

- workout-feedback readback helper cleanup, only if repeated local panel drift returns across multiple
  feedback surfaces
- residual typography cleanup, only if it affects live visible product surfaces rather than demo,
  wrapper-internal, or geometry labels
- onboarding option-card extraction, only if repeated composition is proven beyond
  `hito-choice-toggle`

## Geometry Exceptions

The following remain intentionally outside broad DS abstraction:

- chart heights and widths
- plotted lines
- interval widths
- SVG silhouettes
- marker coordinates

Their surrounding chrome, notes, legends, status fills, and tooltip shells should continue to use
Hito DS classes where already available.

## Blockers

No hard blockers. The track is paused because the main visible DS coverage goal has been met.

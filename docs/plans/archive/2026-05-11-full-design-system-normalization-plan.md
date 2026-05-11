Status: Archived
Owner: Designer Agent
Last Updated: 2026-05-11

Archive Note: Final Safari QA in the visible runner-facing scope found no obvious stray custom UI drift. The normalization track is considered effectively complete from the visible product perspective, with `/hitoDS` retained as the reference baseline and documented visualization geometry exceptions left intentionally outside shared Hito component families.

# 2026-05-11 Full Design System Normalization Plan

## Context

Hito Running already has a real Hito design-system baseline in production-adjacent code. The product direction is fixed:

- calm
- editorial
- athletic
- premium
- low-chrome
- low-card

The next step is not a redesign. The next step is normalization: drive the interface to a state where no visual element is effectively “unowned” by the shared Hito system.

For this plan, `custom UI` means any element whose styling, spacing, status treatment, or behavior is still route-local, one-off, or semantically inconsistent with the shared Hito primitives.

## Current DS Baseline

What is already canonicalized and working:

- tokenized warm graphite canvas, surface, hairline, signal, success, warn, destructive, and workout semantic colors in [styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css)
- typography roles for display, support copy, labels, captions, and mono values
- size-tiered controls for buttons, fields, and textareas
- shared button families: primary, secondary, outlined, ghost
- shared field primitives, helper text, error text, and success text
- shared tab treatment
- shared low-card surfaces and flat surfaces
- shared grouped row, list row, metric row, and compact status-pill primitives
- dedicated `/hitoDS` internal reference surface with component playground usage

Approved Hito primitive and pattern families today:

- page header family
- section header family
- low-card surface family
- tiered button family
- tiered field and textarea family
- label, caption, support-copy, and helper-text family
- grouped row and list-row family
- metric row and metric-value family
- compact status pill family
- tooltip shell family
- tab-list family
- divider family
- DS playground-only navigation family for `/hitoDS`

## Non-Negotiable No-Custom-UI Rules

- No new runner-facing control may ship with route-local sizing if an Hito tier already exists.
- No new runner-facing surface may invent its own card language outside shared Hito surface primitives.
- No new status marker may invent a new color rule or badge structure without mapping to Hito status semantics.
- No page may keep local helper/error/caption styling once a shared Hito text primitive exists for that need.
- No one-off metric composition is allowed if the content can be expressed as a Hito metric row or Hito grouped row.
- `/hitoDS` is the inspection surface for primitives, not a second design language.

## Remaining Custom UI Audit

### Custom Local Buttons

- Already canonical:
  auth buttons, onboarding buttons, import dialog buttons, calendar controls, shell utility buttons, most completion actions, and body severity scale controls
- Partially normalized:
  some route-local button compositions in preserved-shell utility actions
- Still custom / drift risk:
  some tiny utility icon/button shapes in charts and day-cell micro-actions
- Intentionally deferred:
  none

### Custom Local Inputs And Fields

- Already canonical:
  auth inputs, onboarding textarea, import fields, completion notes, completion numeric fields
- Partially normalized:
  body textarea and a few preserved-shell local fields
- Still custom / drift risk:
  any remaining field padding or height that is not using `hito-field-*` tiers
- Intentionally deferred:
  select/search families that are not yet needed product-wide

### Custom Tabs And Nav Treatments

- Already canonical:
  auth tabs, calendar view tabs, workout tabs
- Partially normalized:
  sidebar and route links still combine DS typography with local nav-specific structure
- Still custom / drift risk:
  runner shell navigation row states and bottom mobile nav are still product-shell-specific rather than documented DS families
- Intentionally deferred:
  DS-specific sidebar for `/hitoDS`, because it is intentionally internal-only

### Custom Cards And Surfaces

- Already canonical:
  auth panel, onboarding surface, import dialog, home support module, many workout grouped panels, progress/built shell sections, body/integrations shell framing
- Partially normalized:
  workout error surface, some preserved-shell stats and charts, some local open-section wrappers
- Still custom / drift risk:
  any route-local emergency/error block that still uses bespoke border/background values, some chart wrappers, body map container specifics
- Intentionally deferred:
  specialty visualization canvas containers when tied directly to SVG or interactive graph geometry

### Custom Labels, Captions, And Helper Text

- Already canonical:
  most form labels, support copy, captions, helper/error/success text, and progress chart legends
- Partially normalized:
  a few route-local uppercase metadata lines outside the progress analytics slice
- Still custom / drift risk:
  remaining ad hoc tiny uppercase text that does not use Hito label or caption primitives
- Intentionally deferred:
  none

### Custom Metric Compositions

- Already canonical:
  Today hero metrics, calendar tooltip metrics, many workout detail metrics, progress large summary stats, and body severity summaries
- Partially normalized:
  some workout-adjacent counts
- Still custom / drift risk:
  interval count chips
- Intentionally deferred:
  visualization axis and chart tick values if they remain chart-native rather than layout primitives

### Custom List, Row, And Group Treatments

- Already canonical:
  grouped support modules, dropdown-like rows on `/hitoDS`, workout structure list rows, many preserved-shell grouped lists
- Partially normalized:
  shell nav rows, body log rows, integration rows, progress explanatory rows
- Still custom / drift risk:
  any row that still carries local border, padding, or hover semantics outside `hito-list-row` and `hito-row-group`
- Intentionally deferred:
  structural nav rows that remain shell-specific but should still inherit Hito typography and spacing

### Custom Status, Badge, And Marker Treatments

- Already canonical:
  compact status pills, week status tone mapping, many saved-state labels, and body severity bars
- Partially normalized:
  completed/partial/skipped markers in calendar, workout identity markers, some preserved-shell status chips
- Still custom / drift risk:
  check/dash/cross day-cell markers, progress legend states, icon-with-text status hybrids
- Intentionally deferred:
  visualization-only legend marks that are tightly coupled to chart meaning

### Custom Dialog, Overlay, And Modal Treatments

- Already canonical:
  `UploadJsonDialog`
- Partially normalized:
  dropdown rows borrow DS text and spacing but rely on external component internals
- Still custom / drift risk:
  dropdown content padding, separators, and item affordances remain only partially owned by Hito DS
- Intentionally deferred:
  broader overlay families beyond the import dialog and shell dropdown

### Custom Empty And Error States

- Already canonical:
  most empty/setup states on home, progress, and workout entry points
- Partially normalized:
  route-level error states share DS typography and CTA but still vary in surface tone and severity framing
- Still custom / drift risk:
  bespoke destructive error surface on workout route, shell-specific empty copy framing
- Intentionally deferred:
  none

### Custom Visualization-Adjacent Micro-UI

- Already canonical:
  `IntervalsViz` labels, captions, shared tooltip shell, grouped rows, and calendar tooltip shell
- Partially normalized:
  weekly mileage legend, consistency strips, body-map markers
- Still custom / drift risk:
  chart bars, body map marker coordinates, day-cell layout geometry, timeline block widths
- Intentionally deferred:
  visualization geometry, plotted bars, SVG silhouettes, and chart mechanics that are not meaningful as reusable DS primitives

### Runner-Shell And DS-Playground Inconsistencies

- Already canonical:
  shell copy, profile trigger text rhythm, runner-facing support modules
- Partially normalized:
  shell nav interactions, mobile nav, and some utility affordances
- Still custom / drift risk:
  AppShell navigation items and `/hitoDS` internal sidebar are two different navigation treatments by design
- Intentionally deferred:
  `/hitoDS` internal sidebar, because it is intentionally not runner chrome

## Canonical Mapping Plan

### Buttons

- Map remaining body severity and local utility buttons to `hito-button` tiers where possible.
- Extend Hito only with a documented `segmented-chip` or `scale-button` micro-family if body severity and interval-count buttons cannot cleanly use existing button tiers.
- Delete any route-local button sizing that duplicates `xs`, `sm`, `md`, `lg`, or `xl`.

### Inputs

- Map every remaining field to `hito-field`, `hito-textarea-*`, and shared helper/error text.
- Delete route-local input padding/height classes once mapped.

### Tabs And Navigation

- Map all product view-switching tabs to the Hito tab family.
- Keep shell nav as a product-shell family, but document it explicitly as owned Hito shell navigation rather than leaving it as incidental route styling.
- Keep `/hitoDS` sidebar outside runner-shell normalization, but document it as internal tooling-only.

### Surfaces

- Map all standard framed content to `hito-surface` or `hito-surface-flat`.
- Delete local card borders and route-local gradient containers when the content is not hero-grade.
- Allow specialized visualization containers to remain outside shared surface primitives only when geometry or interaction truly requires it.

### Labels, Captions, Helper Text

- Map all micro-labels to `hito-label`.
- Map all support microcopy to `hito-caption`, `hito-support-copy`, `hito-field-helper`, `hito-field-error`, or `hito-field-success`.
- Delete stray route-local tiny uppercase styles.

### Metrics

- Map route-local metrics to `hito-metric`, `hito-metric-row`, and shared metric-value/label patterns.
- Extend Hito only if a large-stat family is needed repeatedly across progress and later trusted analytics.
- Delete bespoke “hero number card” patterns if they do not belong in the calmer Hito language.

### Rows And Groups

- Map grouped support content to `hito-row-group` and `hito-list-row`.
- Extend with a documented `shell-nav-row` family and `settings-row` family only if multiple surfaces genuinely need them.
- Delete mini-card stacks that only simulate row grouping.

### Status And Semantic UI

- Map all text-plus-status chips to Hito status pills and shared semantic tones.
- Keep check/dash/cross as allowed compact status markers, but document them as one owned Hito marker family instead of ad hoc icons.
- Delete any newly invented badge colors or local pill shapes.

### Dialogs And Overlays

- Keep `UploadJsonDialog` as the canonical dialog baseline.
- Extend Hito with documented dropdown item and dropdown section primitives if shell menus keep growing.
- Do not build a large overlay family until a second real dialog or menu complexity requires it.

### Empty And Error States

- Map all route empty/setup/error states to a Hito state-surface family using existing surface, title, copy, and CTA primitives.
- Extend only with one explicit `error-tone surface` rule if route-level destructive states keep repeating.
- Delete route-local alert styling once that family exists.

### Visualization-Adjacent UI

- Map labels, captions, legends, row summaries, and tooltips to Hito primitives.
- Leave geometry, chart bars, silhouette shapes, and plotted SVG behavior outside DS normalization for now.

## Ownership Rules

- Reuse an existing primitive when the element solves the same semantic job with only superficial visual differences.
- Approve a tiny extension only when the semantic job already exists but the current primitive cannot serve it without awkward overrides.
- Approve a new primitive family only when the product uses the same new pattern in at least two meaningful runner-facing contexts or one critical shell context plus `/hitoDS`.
- Forbid one-off custom treatment when the request is only about local taste, local spacing preference, or route-specific visual novelty.
- Require every new primitive or extension to be demonstrated on `/hitoDS` before it becomes the new default.
- If a route-local element cannot be named as part of the Hito system, it is not ready to ship as a permanent pattern.

## Allowed Exceptions

- Visualization geometry that is inseparable from the chart or SVG logic
- Internal-only `/hitoDS` navigation chrome
- Shell-specific structural navigation while it is explicitly documented as a Hito shell family
- Rare transitional wrappers during a short-lived normalization phase, only if they have a documented removal target

## What We Still Refuse To Normalize

- speculative AI insight panels
- device-sync provider chrome
- weather-specific UI
- broad analytics framework components beyond current preserved needs
- body-map specialty logic as a full shared DS family
- ornamental marketing surfaces that do not belong to the product

## Highest-Leverage Next Slice

Normalize the remaining product-facing status and state family:

- check/dash/cross status markers
- route-level error/empty state surfaces
- shell nav row ownership
- progress large-stat and legend treatment

This slice is highest-leverage because it closes the largest remaining drift between “shared primitives exist” and “all visible interface elements are visibly owned by Hito DS.”

## Rollout Phases

### Phase 1: State And Marker Consolidation

Goal:

- eliminate stray status semantics

Status:

- Implemented in the first Frontend normalization slice:
  shared `hito-status-marker` now owns compact check/dash/cross status expression across calendar and workout result contexts, while existing `hito-status-pill` remains the text-plus-status family

Exact target surfaces/components:

- [Calendar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/Calendar.tsx)
- [TodayHero.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/TodayHero.tsx)
- [workout.$date.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/workout.$date.tsx)
- [CompletionPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/CompletionPanel.tsx)

What gets deleted or consolidated:

- local status-mark styling
- route-local result-badge variations not yet owned by Hito
- duplicated status-tone logic

Validation expectation:

- one documented Hito marker family and one documented Hito status-pill family cover all runner-facing status communication

Risk:

- low

Rollback posture:

- keep route logic intact and revert only marker styling if needed

### Phase 2: State Surface Normalization

Goal:

- remove bespoke empty/error/setup treatments

Status:

- Implemented in the first Frontend normalization slice:
  shared `hito-state-surface` now owns route-level setup, empty, and error surfaces on home, progress, and workout detail, with destructive and signal tones mapped through the same state-surface family

Exact target surfaces/components:

- [index.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/index.tsx)
- [workout.$date.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/workout.$date.tsx)
- [progress.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/progress.tsx)
- [body.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/body.tsx)
- [integrations.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/integrations.tsx)

What gets deleted or consolidated:

- bespoke destructive error surfaces
- route-specific empty-state wrappers
- ad hoc setup CTA blocks

Validation expectation:

- all route-level state surfaces can be named as Hito setup, empty, error, or preview-state families

Risk:

- low-to-medium because tone may drift if destructive/error states are over-softened

Rollback posture:

- keep copy and layout, revert only surface treatment if clarity drops

### Phase 3: Shell And Navigation Ownership

Goal:

- make shell navigation and dropdown behavior explicitly owned

Status:

- Implemented in the shell normalization slice:
  shared `hito-shell-nav`, `hito-shell-nav-row`, `hito-shell-mobile-nav`, `hito-shell-profile-trigger`, and `hito-shell-menu` primitives now own desktop nav, mobile nav, the profile trigger, and shell dropdown menu rows; `/hitoDS` demonstrates the shell navigation family

Exact target surfaces/components:

- [AppShell.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/AppShell.tsx)
- dropdown-related shell rows
- mobile nav treatment

What gets deleted or consolidated:

- incidental nav spacing and hover behavior
- partially-owned dropdown row variants
- preserved integration data-flow utility rows now reuse grouped Hito rows instead of route-local mini flow boxes

Validation expectation:

- shell nav row, profile trigger row, and dropdown item become documented Hito shell families

Risk:

- medium because shell touches every route

Rollback posture:

- ship shell-only styling changes in isolation and revert shell family classes if navigation clarity regresses

### Phase 4: Preserved-Shell Secondary Route Cleanup

Goal:

- remove remaining preserved-shell drift without over-polishing deferred product areas

Status:

- Progress analytics normalization is now partially implemented:
  shared `hito-analytics-stat` owns `/progress` large summary stats, shared `hito-legend` owns chart legends, and `/hitoDS` demonstrates both live primitives
- Body severity micro-UI normalization is now implemented:
  shared `hito-scale-control` plus `hito-scale-button` own `/body` severity selectors, shared `hito-severity-bars` owns active-log severity summaries, and body-map SVG geometry remains an allowed visualization-specific exception
- Near-final visualization-adjacent cleanup is now implemented:
  shared `hito-tooltip` owns calendar and workout-structure tooltip chrome, the calendar workout-type legend uses `hito-legend`, and `/hitoDS` documents chart bars, plotted lines, interval block widths, SVG silhouettes, and marker coordinates as intentional geometry exceptions

Exact target surfaces/components:

- [progress.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/progress.tsx)
- [body.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/body.tsx)
- [integrations.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/integrations.tsx)

What gets deleted or consolidated:

- leftover local stat-card idioms
- ad hoc row separators
- special-case helper or preview copy styling
- repeated tooltip chrome and local workout-type legend wrappers

Validation expectation:

- these routes visibly read as Hito, even while remaining preserved or deferred in product scope
- remaining custom visualization pieces can be named as geometry exceptions, not stray UI

Risk:

- medium because preserved shells can tempt overbuilding

Rollback posture:

- prioritize deletion and simplification; revert any change that broadens scope or implies fake readiness

### Phase 5: Final No-Stray Audit

Goal:

- certify that no runner-facing UI element remains unowned

Exact target surfaces/components:

- full route sweep
- `/hitoDS`
- shared stylesheet

What gets deleted or consolidated:

- final stray utility classes
- undocumented route-local micro-patterns
- old examples that do not map to live Hito families

Validation expectation:

- every visible element can be mapped to a named Hito primitive, Hito shell family, or allowed exception

Risk:

- low if earlier phases are complete

Rollback posture:

- doc-led, not redesign-led; restore only if the audit incorrectly collapses a real necessary exception

## QA Implications

QA should check:

- every button, field, textarea, tab, metric, row, pill, and state surface matches a named Hito family
- no new route-local hover, focus, or padding behavior appears without a DS mapping
- every runner-facing status expression uses approved Hito pill, marker, or text-semantic rules
- preserved secondary routes feel like simplified Hito, not legacy holdouts
- `/hitoDS` reflects the real current primitives rather than stale examples
- new UI additions are either present on `/hitoDS` or explicitly documented as allowed exceptions
- route-level error and empty states do not regress back to bespoke alert boxes or random card styles

## `/hitoDS` Role

What `/hitoDS` should include:

- every live primitive family used by runner-facing surfaces
- representative variants and size tiers
- realistic product-adjacent examples for rows, metrics, buttons, fields, pills, and dropdown-style items
- any newly approved shell-specific primitive families that need inspection

What `/hitoDS` should not try to become:

- a giant enterprise catalog
- a marketing page
- a second product surface
- a place for speculative future components that do not yet exist in Hito

How `/hitoDS` should be used during final normalization:

- as the inspection surface before rollout
- as the proof that a new primitive family is real and reusable
- as the final audit surface when claiming that custom drift has been removed

## Risks

- The team could mistake preserved-shell breadth for a need to normalize speculative product features.
- Visualization-adjacent UI may create false pressure to productize chart geometry as a full DS family.
- Shell navigation is now owned by a Hito shell family; future risk is small route-local utility drift reappearing around preserved or visualization-adjacent surfaces.
- Without a final route sweep, small utility overrides could survive even after most primitives are normalized.

## Exit Criteria

The interface no longer contains stray custom UI when:

- every runner-facing control maps to a named Hito control family
- every runner-facing surface maps to a named Hito surface family or a documented state family
- every visible status expression maps to a named Hito semantic family
- no route contains undocumented local button, field, row, pill, metric, or card styling that duplicates existing Hito primitives
- every remaining exception is documented in `Allowed Exceptions`

The Hito DS is the single source of visual truth when:

- `/hitoDS` demonstrates the live shared families
- shared CSS or shared component primitives own the visible patterns
- route files compose Hito primitives instead of inventing new local ones
- future UI reviews can reject local styling by referencing this plan and the Hito component-system spec

## Next Recommended Role

FRONTEND

## Suggested Next Step

Run one final visual QA sweep on the runner-facing routes and `/hitoDS`; if no new stray UI drift appears, mark this normalization plan ready for archive.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created and near-fully executed the canonical full design-system normalization plan for Hito Running, including shared status/state families, progress analytics, body severity, deeper workout micro-primitives, shell navigation ownership, and the final tooltip/legend cleanup around visualization-adjacent UI.

### Key Decisions

- The product should finish normalization by deleting drift, not by expanding the design system into a giant generic catalog.
- Tooltip and legend chrome belongs to Hito primitives; chart bars, plotted lines, interval widths, SVG silhouettes, and marker coordinates remain documented visualization geometry exceptions.

### Current State

- Hito owns core primitives plus status markers, state surfaces, analytics stats, legends, body severity controls, deeper workout micro-UI, and shell navigation/profile/menu rows.
- Hito now also owns compact tooltip chrome around calendar and workout-structure surfaces.
- Remaining custom visual code is primarily justified geometry, not repeated runner-facing UI chrome.

### Constraints

- Keep the calmer editorial Hito direction intact and do not re-open broad redesign work.
- Do not normalize speculative AI, weather, or provider-specific future capability UI.

### Risks / Open Questions

- A final visual QA pass may still find isolated local wrappers, but the known repeated tooltip and legend drift has been consolidated.
- Geometry exceptions should stay narrowly documented so they do not become a loophole for new custom UI chrome.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Run one final route-level visual QA sweep; if it stays green, archive this normalization plan and treat `/hitoDS` plus the component-system spec as the review baseline for future UI work.
```

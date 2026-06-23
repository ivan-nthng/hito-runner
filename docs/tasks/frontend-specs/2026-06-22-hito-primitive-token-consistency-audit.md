# Hito Primitive Token Consistency Audit

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

product

## Task

Primitive-token consistency audit is complete; no further primitive-token execution role is needed.

## Stage

ARCHITECT closeout / primitive-token audit completed and residual lanes separated.

## Exact Handoff Prompt

```text
No further execution role is needed for the primitive-token cleanup track.

If new issues appear later, open a separate task with fresh source proof and the correct owner.
```

## Owner

DESIGNER

## Last Updated

2026-06-23

## Closeout — 2026-06-23

Status: completed / QA-passed autonomous closure batch accepted.

Accepted outcome:

- FRONTEND closed the remaining primitive-token route chrome batch with shared/named Hito
  primitives in `src/styles.css`.
- QA passed desktop and exact `375px` checks for `/login`, `/admin/login`,
  `/admin/analytics?section=users` auth gate, authenticated `/`, reachable onboarding/create-plan
  surface, `/settings`, `/workout/2026-06-23?tab=overview`, authenticated
  `/admin/analytics?section=users`, and the admin users header menu.
- `qa-artifacts/screenshots/2026-06-23/primitive-token-closure-batch-qa/primitive-token-closure-proof.json`
  reports `consoleWarnErrorCount: 0`, `16` viewport metrics, and no page-level horizontal overflow.
- Admin analytics table width remains intentionally contained inside `.hito-data-table-scroll`; it
  is not page-level overflow and not a leftover token bug.

Source closeout:

- Original offender families are resolved through named/shared primitives: dialog presets,
  data-table width/menu tiers, shell/menu widths, manual-workout primitives, route support grids,
  readback value widths, and route skeleton classes.
- `--radius-hito-md` no longer appears in `src`.
- Remaining matches are expected exclusions: dynamic semantic colors, drag mechanics, progress
  width, skeleton/sparse content sizing, logo variable sizing, selected-plan review layout,
  `/hitoDS`/specimen scaffolding, shared wrapper internals, and visualization geometry.

Residual lanes:

- No true primitive-token cleanup lane remains.
- Future runtime/hydration/auth/backend/mutation issues must open as separate non-token work with
  fresh source proof.
- Future content-layout anatomy cleanup should be scoped separately if repeated product drift
  reappears; it is not part of this completed primitive-token audit.

## Context

Product review is still finding suspicious legacy numeric geometry in the visible UI. The issue is
larger than one value: Hito has an accepted design-system direction, but spacing, sizing, radius,
menu width, dialog size, and border-compensation rules are not yet enforced consistently across
product consumers.

This audit is intentionally source-led. Browser/render proof was not needed for this pass because
the root problem is ownership of numeric geometry in source, not a disputed visual screenshot state.
Future Frontend and QA cleanup must still verify the changed surfaces visually after implementation.

## Root Cause

Visible symptom:

- Product surfaces still contain route-local numeric geometry such as arbitrary widths, min-widths,
  dialog heights, local radii, inline drag-preview styles, and copied menu/table dimensions.

Likely underlying cause:

- Hito DS has canonical primitives, but the service lacks a single service-wide primitive table,
  exception policy, and rollout sequence for moving product consumers off route-local values.
- Some hardcoded values are legitimate because they live inside shared primitive anatomy,
  visualization geometry, specimen/export scaffolding, or browser compensation. Others are legacy
  imported drift or missing shared variants.

Canonical owner:

- Hito DS primitive/shared component layer owns the visual contract.
- Architecture owns cleanup sequencing.
- Frontend later owns implementation of the selected normalization batch.

## Source Inspection Method

Inspected:

- `AGENTS.md`
- `agents/designer.agent.md`
- `skills/hito-frontend-design-system/SKILL.md`
- `skills/hito-plan-writing-and-closeout/SKILL.md`
- `docs/current-product.md`
- `docs/current-system.md`
- `docs/tasks/frontend-specs/2026-05-06-hito-ds-spec.md`
- `docs/plans/active/2026-06-15-hito-ds-information-architecture-and-specimen-contract.md`
- `src/styles.css`
- `src/routes/hitoDS.tsx`
- `src/routes/index.tsx`
- `src/routes/workout.$date.tsx`
- `src/routes/settings.tsx`
- `src/routes/admin.analytics.tsx`
- `src/routes/admin.capture.tsx`
- `src/components/AppShell.tsx`
- `src/components/Calendar.tsx`
- `src/components/TodayHero.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/PlanManagementDialog.tsx`
- `src/components/UploadJsonDialog.tsx`
- `src/components/plan-management/*`
- `src/components/manual-workout/*`
- `src/components/onboarding/*`
- `src/components/workout-completion/*`
- `src/components/ui/*`
- `src/components/hito-ds/*`

Parallel read-only subagent buckets used:

- Product routes/pages geometry.
- Shared UI and `/hitoDS` primitive definitions.
- Admin tables/dense surfaces.
- Dialog/menu/dropdown source scan was completed locally after its subagent timed out.

## Audit Summary

Hito does not need a new design system. The current primitives are real and useful:

- `--space-*` and `--spacing-hito-*` exist in `src/styles.css`.
- `--radius-*` exists in `src/styles.css`.
- `hito-button`, `hito-field`, `hito-tabs`, `hito-checkbox`, `hito-radio`,
  `hito-choice-toggle`, `hito-product-dialog`, `hito-data-table`, `hito-ui-menu-surface`,
  `hito-calendar-*`, `hito-tooltip`, and the Hito `Icon` primitive already own large parts of
  the visual system.

The drift is narrower and more useful to fix:

- Product consumers repeat dialog size and backdrop recipes instead of selecting named dialog size
  presets.
- Admin tables use shared table classes, but table min-width tiers and generic admin toolbar rows
  still live as route-local values.
- Manual workout construction/editor UI contains repeated segment/step geometry that should become
  a shared manual-workout editor primitive rather than a local cluster.
- Shell/menu widths are hardcoded differently across runner and admin surfaces.
- Calendar drag-preview styling is created imperatively with inline numeric values and should not
  remain route-local mini-UI.
- Some old generic `src/components/ui/*` shadcn-style defaults remain. They are acceptable as
  low-level wrappers, but product-facing Hito surfaces should prefer Hito classes and primitives.

No literal `7.99` value was found in the audited source. The same class of risk appears through
arbitrary values such as `h-[min(...)]`, `grid-cols-[...]`, `w-[240px]`, `w-[208px]`,
`w-[224px]`, `min-w-[1280px]`, `rounded-[var(--radius-hito-md)]`, `text-[10px]`,
`bg-foreground/[0.035]`, and inline `10px 12px` / `16px` / `240px` drag-preview geometry.

## Canonical Primitive Table Recommendation

### Spacing

Canonical source:

- `--space-1: 0.25rem`
- `--space-2: 0.5rem`
- `--space-3: 0.75rem`
- `--space-4: 1rem`
- `--space-5: 1.25rem`
- `--space-6: 1.5rem`
- `--space-8: 2rem`
- `--space-10: 2.5rem`
- Tailwind aliases `--spacing-hito-1/2/3/4/5/6/8/10`

Policy:

- Product consumers should use existing Hito route stacks, rows, fields, tables, dialogs, and
  surface classes before adding raw `p-*`, `gap-*`, or arbitrary bracket spacing.
- `p-4`, `p-5`, `gap-5`, and similar Tailwind scale values are not automatically wrong, but
  repeated use in the same anatomy should be promoted to a named Hito class.
- Fractional values such as `0.35rem`, `0.45rem`, `0.625rem`, and `0.8125rem` are allowed only
  inside shared primitive anatomy when they solve density, optical alignment, or typography roles.

### Radius

Canonical source:

- `--radius-sm`
- `--radius-md`
- `--radius-lg`
- `--radius-xl`
- `--radius-2xl`
- `--radius-3xl`
- `--radius-4xl`
- pill radius `999px` for pills/dots only

Policy:

- Route code must not reference undefined or non-canonical radius variables.
- `rounded-[var(--radius-hito-md)]` is suspicious because the audited token family is
  `--radius-*`, not `--radius-hito-*`.
- Product surfaces should use Hito classes or canonical radius tokens instead of inventing local
  token names.

### Border And Hairline

Canonical source:

- `border-hairline`
- `var(--color-hairline)`
- 1px hairline borders inside shared surfaces, dialogs, table cells, and menu surfaces
- 2px focus rings where shared primitives already define them

Policy:

- Borders are allowed when they define a real grouping boundary, table cell seam, modal footer/header
  seam, focus state, or interaction target.
- Nested borders and local "card soup" should not re-enter product consumers.
- Border compensation values such as negative outline offsets or 1px seam fixes are allowed only in
  shared primitives.

### Control Heights

Canonical source:

- `hito-field-xs` / `hito-button-xs`: `1.75rem`
- `hito-field-sm` / `hito-button-sm`: `2rem`
- `hito-field-md` / `hito-button-md`: `2.5rem`
- `hito-field-lg` / `hito-button-lg`: `2.75rem`
- `hito-field-xl` / `hito-button-xl`: `3.25rem`

Policy:

- Buttons, fields, search controls, choice toggles, select triggers, and compact admin controls
  should align to these tiers.
- Local heights are allowed only for visualization cells, charts, calendar cells, and route-level
  skeleton placeholders when those heights represent content geometry rather than control chrome.

### Dialog Geometry

Canonical source today:

- `hito-product-dialog`
- `hito-product-dialog-header`
- `hito-product-dialog-body`
- `hito-product-dialog-body-scroll-fill`
- `hito-product-dialog-footer`
- `hito-dialog-stable`

Recommended missing primitive:

- Named dialog size presets such as `hito-dialog-size-compact`, `hito-dialog-size-standard`,
  `hito-dialog-size-wide`, `hito-dialog-size-workflow`, and `hito-dialog-size-review`.

Policy:

- Product dialogs should keep the existing anatomy but stop repeating raw combinations such as
  `h-[min(44rem,calc(100dvh-2rem))] max-w-3xl border-hairline bg-background/95 p-0 backdrop-blur-xl`.
- Size presets must not change product logic, scroll ownership, or footer reachability.

### Menu And Dropdown Geometry

Canonical source today:

- `hito-ui-menu-surface`
- `hito-shell-menu`
- `hito-shell-menu-item`
- `hito-shell-menu-separator`
- `hito-data-table-column-menu`

Recommended missing primitive:

- Menu width presets, for example compact, standard, wide, and data-table-filter.

Policy:

- Raw `w-56`, `w-64`, `w-72`, `w-[208px]`, `w-[224px]`, and `w-[min(...)]` should be replaced
  when they are repeated product chrome.
- Dynamic Radix available-height constraints may stay in shared wrappers.

### Table Geometry

Canonical source today:

- `hito-data-table-scroll`
- `hito-data-table`
- `hito-data-table-cell`
- `hito-data-table-cell-start`
- `hito-data-table-cell-end`
- `hito-data-table-utility-row`
- `hito-data-table-search`
- `hito-data-table-header-button`
- `hito-data-table-column-menu`

Recommended missing primitive:

- Table width tiers, such as `hito-data-table-min-md`, `hito-data-table-min-lg`, and
  `hito-data-table-min-xl`.
- A generic `hito-admin-utility-row` alias if the same toolbar rhythm is valid outside actual
  `<table>` contexts.

Policy:

- Wide admin data remains a true table with contained horizontal scroll.
- Route-local min-widths are acceptable only until named tiers exist.
- Do not squeeze operational admin tables into wrapped columns to avoid horizontal scroll.

### Calendar And Visualization Geometry

Canonical source today:

- `HitoCalendarDayCell`
- `HitoWorkoutDayRow`
- `hito-calendar-grid-*`
- `hito-calendar-mobile-*`
- `hito-calendar-type-glyph`
- `hito-calendar-feedback-marker`
- `IntervalsViz`
- chart-specific geometry in progress/DS specimens

Policy:

- Visualization geometry may use precise widths/heights, dynamic color, and content-driven math.
- This is not a license to add route-local chrome. The numeric value must belong to the shape being
  visualized, not a generic card, panel, button, menu, or field.
- Calendar day-cell min-heights and seam compensation are acceptable because they live in shared
  calendar primitives.

## Allowed Exception / Compensation Primitive Policy

Allowed exception buckets:

1. Primitive anatomy:
   Hardcoded or fractional values inside `src/styles.css` or shared primitive components may stay
   when they define the primitive itself.

2. Browser/platform compensation:
   Values such as `767.98px`, Radix transform origins, available-height constraints, search-input
   WebKit reset, focus-ring offsets, and 1px seam compensation may stay when they live in a shared
   wrapper.

3. Visualization geometry:
   Chart bars, interval segment widths, calendar cell min-heights, glyph geometry, body-map SVG
   dimensions, progress bars, and Figma export specimens may use precise values when those values
   represent the visualized data or specimen.

4. Specimen scaffolding:
   `/hitoDS` and Figma export boards may have layout scaffolding that product routes should not copy.
   These must be clearly owned by DS/specimen components, not route-local product components.

5. Utility DOM offscreen elements:
   Clipboard hidden textareas and drag infrastructure may use offscreen positioning, but visible
   drag previews must use Hito classes rather than inline product chrome.

Forbidden or high-risk buckets:

1. Route-local card/surface geometry that repeats Hito surface anatomy.
2. Route-local dialog height/width/backdrop recipes.
3. Route-local shell/menu widths that differ by surface without a named owner.
4. Undefined token references such as `--radius-hito-md`.
5. Inline visible component styles for product UI.
6. Native/select/control wrappers when a Hito DS control exists.
7. Reusing table-specific classes as generic admin layout semantics without a deliberate alias.

## Offender Inventory By Surface / Component

### High Severity

#### Calendar drag preview

Source:

- `src/components/Calendar.tsx`
- Function `setManualMoveDragImage`

Observed values:

- `top = "-1000px"`
- `left = "-1000px"`
- `zIndex = "2147483647"`
- `maxWidth = "240px"`
- `padding = "10px 12px"`
- `borderRadius = "16px"`
- `boxShadow = "0 18px 42px rgb(0 0 0 / 0.22)"`
- inline title/body `font-size: 13px` and `11px`
- `setDragImage(..., 24, 18)`

Classification:

- Legacy drift / missing shared primitive.

Why it matters:

- This is visible product UI built imperatively with local numeric design decisions.
- It bypasses Hito DS typography, spacing, radius, surface, shadow, and density tokens.

Recommended normalization:

- Extract the visible drag preview into a Hito-owned class or helper, for example
  `hito-drag-preview`, `hito-drag-preview-title`, `hito-drag-preview-meta`.
- Keep offscreen positioning as utility infrastructure, but move visible style to shared CSS.

#### Product dialog size recipes

Sources:

- `src/components/PlanManagementDialog.tsx`
- `src/components/UploadJsonDialog.tsx`
- `src/components/plan-management/ActivePlanTransitionReviewDialog.tsx`
- `src/components/plan-management/ActivePlanCreatePlanDialog.tsx`
- `src/components/workout-completion/BodyNotesEditor.tsx`
- `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx`
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx`
- `src/components/test-calendar/test-calendar-sandbox.tsx`

Observed values:

- `h-[min(40rem,calc(100dvh-2rem))]`
- `h-[min(42rem,calc(100dvh-2rem))]`
- `h-[min(44rem,calc(100dvh-2rem))]`
- `h-[min(46rem,calc(100dvh-2rem))]`
- `h-[min(48rem,calc(100dvh-2rem))]`
- `h-[min(52rem,calc(100dvh-2rem))]`
- `max-w-xl`, `max-w-2xl`, `max-w-3xl`, `max-w-5xl`
- repeated `border-hairline bg-background/95 p-0 backdrop-blur-xl`

Classification:

- Missing shared primitive / repeated route-local recipe.

Why it matters:

- The anatomy is canonical, but size and backdrop decisions are copied into every consumer.
- Future modal fixes will keep chasing local strings unless size modes become named.

Recommended normalization:

- Keep `hito-product-dialog`.
- Add named size/body-mode presets that encode width, height, backdrop, and viewport cap.
- Document these presets in `/hitoDS#modals`.

#### Suspicious radius token in plan schedule metrics

Source:

- `src/components/plan-management/PlanScheduleEditPanel.tsx`

Observed value:

- `rounded-[var(--radius-hito-md)] border border-border/60 bg-card/45 p-3`

Classification:

- Legacy drift / likely invalid token reference.

Why it matters:

- The audited canonical radius family is `--radius-*`, not `--radius-hito-*`.
- The same row also uses older `border-border` / `bg-card` language instead of Hito semantic
  surface classes.

Recommended normalization:

- Replace with an existing Hito metric row, list row, or surface wash pattern.
- If this compact metric block is repeated elsewhere, promote a small `hito-metric-tile` primitive.

#### Admin data-table width and toolbar semantics

Sources:

- `src/routes/admin.analytics.tsx`
- `src/routes/admin.capture.tsx`
- `src/components/hito-ds/specimen-previews.tsx`
- `src/styles.css`

Observed values:

- Users table: `min-w-[1280px]`
- Test accounts table: `min-w-[1240px]`
- DS specimen table: `min-w-[860px]`
- Column menus: `w-72`, `w-64`, `w-56`
- Backlog list uses `hito-data-table-utility-row` and `hito-data-table-column-menu` in non-table
  utility/list contexts.

Classification:

- Missing DS/admin table width tiers.
- Semantic drift where table utility classes are reused as generic admin utility rows.

Why it matters:

- Admin tables must remain operationally wide, but the width contract should be named and reusable.
- Generic admin filter/search rows need a shared owner if used outside data tables.

Recommended normalization:

- Add named table min-width tiers.
- Add or alias a generic admin utility-row pattern if the same layout is intentionally shared.
- Preserve contained horizontal scroll.

### Medium Severity

#### Manual workout constructor/editor geometry

Source:

- `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`

Observed values:

- repeated `rounded-2xl`
- `bg-surface/25`
- `bg-background/25`
- `p-4`
- `min-w-[14rem]`
- `min-w-[12rem]`
- `h-12`
- `text-[10px]`
- `grid-cols-[minmax(...)]`
- menu widths such as `w-[min(20rem,calc(100vw-2rem))]`,
  `w-[min(24rem,calc(100vw-2rem))]`

Classification:

- Mixed: some values are visualization/editor geometry, some are local surface/control drift.

Why it matters:

- Manual workout authoring is becoming a real product surface. Its segment/step anatomy should not
  remain a route-local micro design system.

Recommended normalization:

- Define shared manual-workout editor primitives for step card, segment preview bar, compact add
  menu, and editor row spacing.
- Keep segment proportional widths and block colors as visualization geometry.

#### Shell and account menu widths

Sources:

- `src/components/AppShell.tsx`
- `src/components/admin/AdminWorkspaceNav.tsx`
- `src/routes/admin.analytics.tsx`
- `src/routes/admin.capture.tsx`

Observed values:

- runner sidebar: `w-[240px]`
- runner profile menu: `w-[208px]`
- runner mobile/dropdown menu: `w-56`
- admin menu: `w-[224px]`
- admin workspace variable override: `[--hito-workbench-sidebar-width:240px]`
- CSS default workbench sidebar width: `260px`

Classification:

- Missing shell/menu width token or named size preset.

Why it matters:

- Shell feels stable visually, but width ownership is not stable in source.

Recommended normalization:

- Define shell sidebar width tokens/classes for runner and admin.
- Define shell menu width presets.
- Do not visually redesign shell navigation in this cleanup.

#### Workout detail route-local layout values

Source:

- `src/routes/workout.$date.tsx`

Observed values:

- `lg:grid-cols-[1fr_320px]`
- `gap-10`
- skeleton `h-[460px]`
- local right-side max-width labels such as `max-w-[11rem]`, `max-w-[12rem]`
- dynamic progress width style

Classification:

- Mixed: route layout drift plus acceptable dynamic progress value.

Why it matters:

- Workout detail is a primary product surface and should consume named route/detail layout classes
  where patterns repeat with home/today/detail layouts.

Recommended normalization:

- Prefer a shared detail-grid/sidebar-width class if this layout repeats.
- Leave progress width as dynamic state rendering.

#### Admin quick-note panel and compact select

Source:

- `src/routes/admin.capture.tsx`

Observed values:

- `details/summary` custom panel
- `w-[min(36rem,calc(100vw-2.5rem))]`
- native/select wrapper classes such as `hito-field hito-field-sm max-w-44 rounded-full`

Classification:

- Missing admin popover/select primitive, but not the first table cleanup batch.

Why it matters:

- This crosses from geometry into interaction and disclosure behavior, so it should not be bundled
  into the first table width cleanup unless Architecture explicitly chooses admin capture panel
  cleanup as the first batch.

Recommended normalization:

- Later: use Hito dropdown/popover/select primitives.
- Keep `Add quick note` behavior unchanged.

### Low Severity / Watchlist

#### Generic shadcn-style wrappers

Sources:

- `src/components/ui/button.tsx`
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/dialog.tsx`
- `src/components/ui/alert-dialog.tsx`
- `src/components/ui/select.tsx`
- `src/components/ui/dropdown-menu.tsx`
- `src/components/ui/context-menu.tsx`
- `src/components/ui/menubar.tsx`
- `src/components/ui/sidebar.tsx`

Classification:

- Shared wrapper internals, not automatically product drift.

Policy:

- These may keep Radix/shadcn positioning and transition geometry as low-level wrappers.
- Hito product chrome should still consume `hito-*` classes and avoid treating base wrappers as the
  visual contract.

#### `/hitoDS` and Figma export geometry

Sources:

- `src/routes/hitoDS.tsx`
- `src/components/hito-ds/*`

Classification:

- Mostly acceptable specimen/export scaffolding.

Policy:

- `/hitoDS` may use local demonstration geometry when it is clearly specimen scaffolding.
- If the same specimen layout repeats, it should become a shared `HitoDsPlayground` or specimen
  helper rather than copied arbitrary values.

#### Changelog timeline rails

Source:

- `src/routes/changelog.tsx`

Classification:

- Intentional editorial layout exception.

Policy:

- Timeline column widths and rails are acceptable as route-specific editorial composition unless
  the same timeline pattern is reused elsewhere.

## Suspicious Numeric Values Found

Definitely legacy drift or missing primitive:

- `rounded-[var(--radius-hito-md)]`
- visible drag-preview `maxWidth = "240px"`
- visible drag-preview `padding = "10px 12px"`
- visible drag-preview `borderRadius = "16px"`
- visible drag-preview `font-size: 13px` / `11px`
- visible drag-preview `boxShadow = "0 18px 42px rgb(0 0 0 / 0.22)"`
- repeated dialog `h-[min(40rem..52rem,calc(100dvh-2rem))]`
- admin tables `min-w-[1280px]`, `min-w-[1240px]`
- runner shell `w-[240px]`
- runner shell menu `w-[208px]`
- admin shell menu `w-[224px]`
- admin capture panel `w-[min(36rem,calc(100vw-2.5rem))]`
- manual editor `min-w-[12rem]`, `min-w-[14rem]`, `text-[10px]`

Probably acceptable when kept in shared primitive/specimen owners:

- `767.98px` breakpoint compensation.
- Radix transform-origin / available-height values.
- `min-w-[8rem]` menu wrapper defaults.
- `outline-offset-[-1px]` / `outline-offset-[-2px]` in shared calendar cells or focus seams.
- `translateY(-2px)` inside shared hover animation.
- `text-[0.625rem]` inside dense calendar labels.
- `min-h-[8rem]`, `min-h-[170px]`, `p-2.5`, `xl:p-3` inside `HitoCalendarDayCell`.
- chart/interval/body-map widths, heights, and proportional dynamic styles.
- offscreen clipboard textarea positioning.

## What Must Be Normalized First

Recommended first candidates for Architecture to choose from:

1. Product dialog size presets.
   Best when the goal is broad visible consistency with low behavior risk.
   This removes many repeated modal strings while preserving existing anatomy.

2. Admin data-table and utility-row geometry tiers.
   Best when the goal is to stabilize operational admin surfaces and `/hitoDS` table specimens.
   This should cover table min-width tiers, column menu widths, and a non-table admin utility-row
   alias.

3. Calendar drag-preview extraction.
   Best when the goal is to eliminate the clearest visible inline mini-component.
   This is smaller than the dialog/table batch but very high-signal for DS discipline.

Do not start with:

- Chart/visualization geometry.
- Calendar day-cell min-heights that already live in `HitoCalendarDayCell`.
- Changelog timeline rails.
- Broad `/hitoDS` redesign.
- Generic shadcn wrapper rewrite.

Designer recommendation:

- Start with product dialog size presets if Architecture wants the broadest route-local reduction.
- Start with admin table/toolbar tiers if Architecture wants the most operational cleanup.
- Start with calendar drag preview if Architecture wants the smallest crisp proof that visible
  inline geometry is no longer allowed.

## Severity / Prioritization

High:

- Visible inline drag-preview styles in `Calendar.tsx`.
- Repeated product dialog size/backdrop recipes.
- Suspicious undefined radius token in `PlanScheduleEditPanel.tsx`.
- Admin table min-width and generic utility-row ownership.

Medium:

- Manual workout constructor/editor local geometry.
- Shell/sidebar/menu width drift.
- Workout detail route-local side panel/grid values.
- Admin quick-note panel/select geometry.

Low:

- Generic UI wrapper internal geometry.
- `/hitoDS` specimen scaffolding that does not leak into product routes.
- Visualization/chart/calendar-cell geometry already owned by shared primitives.

## State Geometry Requirements

Future cleanup must preserve state clarity:

- Loading states:
  Use existing skeletons and Hito route stack spacing. Do not replace loading states with new local
  card wrappers.

- Empty states:
  Use quiet Hito support copy, list rows, or sparse route sections. Avoid adding bordered empty
  cards unless the empty state needs a real action boundary.

- Error states:
  Use Hito field error text, alert/message primitives, or existing route error layouts. Error
  geometry must align with the same field/button/tile spacing as neutral states.

- Success states:
  Use Hito success/status tone and existing button/field/table primitives. Success should not create
  one-off green cards or local border recipes.

- Review states:
  Use `hito-product-dialog` anatomy, Hito dialog size presets once defined, Hito row groups, and
  existing footer action hierarchy. Review dialogs should not invent per-route modal geometry.

## Acceptance Criteria

The primitive-token normalization track can be considered successful when:

- Product consumers no longer repeat the same dialog size/backdrop string patterns.
- Visible product UI does not use inline style objects for surface, radius, padding, typography, or
  shadow unless the value is dynamic data visualization or documented infrastructure.
- Route-local arbitrary widths for shell menus, admin table menus, and table min-widths are replaced
  by named shared classes or documented variables.
- Undefined token references such as `--radius-hito-md` are removed or replaced with canonical
  `--radius-*` tokens.
- Admin table/list toolbar geometry has a semantic owner that is not misleadingly table-only when
  used outside tables.
- Manual workout editor geometry has either a shared primitive plan or a clearly documented
  temporary exception.
- `/hitoDS` documents the canonical primitive table and exception policy enough that future
  Frontend work can classify a hardcoded number as allowed or forbidden without guessing.
- QA can verify changed surfaces at desktop and `375px` without new overflow, clipped menus,
  detached modal footers, or changed product behavior.

## Validation Expectations

For Architect:

- Select one bounded cleanup batch and name the exact owner seam.
- Do not ask Frontend for broad "normalize all spacing" work.

For Frontend after Architecture selection:

- Run source grep before and after for the targeted offender family.
- Run targeted `git diff --check`.
- Run lint/build if product code changes.
- Inspect touched surfaces in browser at desktop and `375px`.
- Verify no product behavior changed.
- Document any remaining custom geometry as either allowed exception or deferred drift.

For QA after implementation:

- Validate the touched surfaces only, not the whole product.
- Check loading, empty, error, success, and review states if the selected batch touches those
  surfaces.
- For dialogs, prove footer reachability and no dead body zone.
- For tables, prove horizontal scroll and header menus remain usable.
- For drag preview, prove visible preview remains legible and styled through Hito classes.

## What Should Stay Intentional

- Dynamic colors for workout family/status markers.
- Progress and chart heights/widths derived from data.
- Interval segment proportional widths.
- Calendar day-cell sizing inside `HitoCalendarDayCell`.
- Body-map SVG dimensions.
- Radix wrapper positioning internals.
- Offscreen clipboard textarea positioning.
- `/hitoDS` specimen scaffolding that is clearly owned by DS display, not product chrome.
- Changelog timeline rails.

## What Must Not Be Touched

- Backend schedule, plan, workout, admin, auth, Supabase, OpenAI, or persistence contracts.
- Product logic or route lifecycle behavior.
- Calendar/workout editability rules.
- Manual workout data contracts.
- Admin classification/analytics semantics.
- Broad `/hitoDS` IA redesign.
- Figma export behavior.
- Generic wrapper rewrite unless Architecture selects that explicitly.

## Risks

- Over-normalizing visualization geometry would make calendar, charts, and interval views less
  legible.
- Replacing all arbitrary values at once would create a large risky diff with low product value.
- Dialog size presets could accidentally change scroll behavior if Frontend treats this as a modal
  redesign rather than a class extraction.
- Admin table width normalization could reduce operational scanability if it tries to avoid
  horizontal scroll.
- Leaving the exception policy implicit will keep producing arguments about whether a hardcoded
  value is legitimate.

## Next Recommended Role

ARCHITECT

## Suggested Next Step

Architecture should select one first cleanup batch from this audit, write a bounded execution plan,
and hand off only that batch to Frontend. The strongest first candidates are:

- product dialog size preset extraction;
- admin data-table/utility-row geometry tiers;
- calendar drag-preview shared-class extraction.

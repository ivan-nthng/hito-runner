# Hito DS Component Adoption And Custom UI Audit

## Status
ready_for_handoff

## Type
frontend_spec

## Priority
high

## Owner
DESIGNER

## Last Updated
2026-06-23

## Next Recommended Role
ARCHITECT

## Task
Run a service-wide Hito DS component-adoption audit and define the component ownership gaps that still create custom UI drift risk.

## Stage
DESIGNER audit / service-wide DS component ownership, adoption gaps, and exception-policy spec

## Exact Handoff Prompt
```text
ROLE: ARCHITECT

Task: Select the first implementation batch for Hito DS component adoption cleanup.

Stage: ARCHITECT cleanup planning / component ownership batch selection.

Use this designer audit as the source spec:
docs/tasks/frontend-specs/2026-06-23-hito-ds-component-adoption-and-custom-ui-audit.md

Root-cause requirement:
- Do not reopen the completed primitive-token cleanup lane.
- Treat the visible symptom as route-local component anatomy and uneven shared-component ownership.
- Select the first bounded batch that removes custom UI drift by reusing or extracting existing Hito DS/admin primitives.

Required decisions:
1. Choose exactly one first implementation batch.
2. Prefer the highest-leverage batch that is safe to validate without product behavior changes.
3. Define target files/components.
4. Define what must be reused from existing Hito DS primitives.
5. Define which new shared component wrappers are allowed, if any.
6. Define what must remain an intentional domain exception.
7. Provide one execution-ready FRONTEND prompt.

Do not:
- redesign product flows
- change backend, persistence, auth, admin data, OpenAI, or provider behavior
- add a broad component library
- create one-off route-local replacements
- touch unrelated visual polish outside the selected batch

Report using the standard Architecture / Cleanup / Plan Report format.
```

## Context
The primitive-token consistency track is already complete. The current problem is narrower: several product/admin surfaces still compose UI locally even when Hito DS already owns the primitive language. This creates a future drift risk because a developer can copy a local component shape instead of the shared Hito owner.

This audit focuses on component adoption and ownership, not on new visual direction. The goal is to make the interface smaller and more consistent by reusing current Hito DS primitives, extracting repeated route-local anatomy only when proven, and preserving true product-domain exceptions.

## Root Cause
Visible symptom: the live product has some custom/local UI anatomy even after token cleanup, especially around admin tables/work items, completion logging controls, status pills, select fields, tooltip/popover defaults, and route-local metric/readback rows.

Likely underlying cause: Hito DS classes and primitives exist, but some product-facing React component owners are uneven. Some screens use `hito-*` classes directly, some old low-level wrappers still ship shadcn-style defaults, and some repeated route-local compositions have not been promoted into shared admin/product components.

Canonical owner: Hito DS primitive / shared component ownership, not token cleanup and not backend/product logic.

## Files Inspected
- `docs/current-product.md`
- `docs/current-system.md`
- `docs/tasks/frontend-specs/2026-06-22-hito-primitive-token-consistency-audit.md`
- `src/styles.css`
- `src/routes/hitoDS.tsx`
- `src/components/ui/*`
- `src/components/hito-ds/*`
- `src/components/admin/AdminWorkspaceNav.tsx`
- `src/routes/admin.analytics.tsx`
- `src/routes/admin.capture.tsx`
- `src/components/CompletionPanel.tsx`
- `src/components/workout-completion/BodyNotesEditor.tsx`
- `src/components/workout-completion/WorkoutComparisonReadback.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/components/onboarding/TrainingPreferenceFields.tsx`
- `src/components/onboarding/PlanPresetPanel.tsx`
- `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`
- `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- `src/components/Calendar.tsx`
- `src/components/TodayHero.tsx`
- `src/routes/workout.$date.tsx`
- `src/routes/settings.tsx`
- `src/routes/integrations.tsx`

## Audit Summary
Hito DS is healthy at the primitive-token layer. The remaining issues are mostly adoption and shared-component ownership gaps.

The strongest current Hito DS owners are:

| Area | Current owner | Adoption judgment |
| --- | --- | --- |
| Buttons | `hito-button*` classes | Canonical. No new button system needed. |
| Fields and textareas | `hito-field*`, `hito-textarea-*`, field helper/error classes | Canonical at consumer level, but low-level `Input` / `Textarea` wrappers still have legacy defaults. |
| Dialogs and sheets | `Dialog`, `Sheet`, `hito-product-dialog`, size/height presets | Canonical enough. Do not redesign. |
| Dropdowns and select menus | `DropdownMenu`, `Select`, `hito-ui-menu-*`, width tiers | Mostly canonical. Some route-local width/tone exceptions remain. |
| Tabs and choice toggles | `hito-tabs`, `hito-tab`, `hito-choice-toggle*` | Canonical. Some richer choice-card patterns remain route-local. |
| Surfaces/cards | `hito-surface`, `hito-surface-flat`, `hito-state-surface`, `hito-surface-wash` | Canonical. Avoid adding more card primitives. |
| Status/metadata | `hito-status-pill`, `hito-status-marker`, `HitoMetadataTag` | CSS owner exists; React wrapper ownership is uneven. |
| Tables | `hito-data-table*` classes | Style owner exists; React table toolbar/header/menu composition is route-local. |
| Calendar day cells | `HitoCalendarDayCell`, `HitoWorkoutDayRow` | Canonical for day visual anatomy. Some action wrappers around them remain local. |
| Icons | `Icon`, `HITO_ICON_META`, `HITO_ICON_SIZES` | Canonical. Do not merge workout glyphs into generic icon registry. |

## Component Ownership Table
| Component family | Canonical owner today | Current gap | Decision |
| --- | --- | --- | --- |
| Button | `hito-button*` | Product code often uses native `button` plus class, which is acceptable. | Do not add a large Button API. A thin wrapper is optional only if it removes repeated local anatomy. |
| Text input | `hito-field*`; legacy `Input` wrapper exists | `Input` defaults still look shadcn-like while product uses `hito-field` directly. | Either make `Input` Hito-native or mark it legacy infra and add `HitoInput`. |
| Textarea | `hito-textarea-*`; legacy `Textarea` wrapper exists | Same as input. | Either make `Textarea` Hito-native or mark it legacy infra and add `HitoTextarea`. |
| Select | `Select` wrapper plus `hito-ui-select-*`; native select class fallback | `SelectField` / `NoteSelectField` wrappers exist locally. | Add or bless `HitoSelectField` only if native select remains needed; otherwise migrate to `Select`. |
| Tooltip | `Tooltip` wrapper; `hito-tooltip` class | `TooltipContent` default remains legacy, consumers patch `className="hito-tooltip"`. | Normalize wrapper default to Hito tooltip. |
| Popover | `Popover` wrapper; specialized date picker popover | `PopoverContent` default remains legacy, specialized consumers patch locally. | Normalize wrapper default to Hito popover while preserving overrides. |
| Status pill | `hito-status-pill` CSS; `HitoMetadataTag` for metadata | Many local `StatusChip`, `StatusPill`, `BooleanPill`, `ResultBadge` wrappers. | Add `HitoStatusPill` if Frontend finds repeated tone/icon mapping drift. |
| Metadata menu | `HitoMetadataTag` plus `DropdownMenu` | Admin Work Items builds editable metadata dropdowns locally. | Promote `AdminMetadataMenu` or `HitoMetadataSelectTag`. |
| Data table toolbar/header | `hito-data-table*` CSS | `DataTableUtilityRow`, header sorting/filter menus, active filter summaries are route-local. | Promote shared admin data-table components. |
| Work item list/detail | `hito-row-group`, `hito-list-row`, `HitoMetadataTag`, disclosures | Work Items route owns row, detail, prompt block, technical detail, notes locally. | Promote admin work-item components only if Work Items keep expanding. |
| Disclosure | `hito-disclosure*` CSS | Some product readback details use bare border/summary patterns. | Prefer a small `HitoDisclosure` wrapper if repeated; otherwise migrate local details to classes. |
| Rich choice cards | `hito-choice-toggle*` covers segmented choices | Onboarding option cards and completion outcome cards use local surface-card buttons. | Add `HitoChoiceCardGroup` / `HitoChoiceCard` if the pattern repeats beyond one flow. |
| Metric/readback rows | `hito-metric*`, `hito-list-row*`, technical text roles | Multiple local `Metric`, `Stat`, `ReadbackRow`, `ComparisonMetaItem` wrappers. | Watchlist. Promote only if repeated cleanup touches 2+ surfaces. |
| Manual workout editor | `hito-manual-workout-*` classes | Large domain editor components still contain local anatomy. | Do not genericize now. Document as DS-backed domain family and extract when touched. |
| Body map | Domain SVG and body note controls | Custom geometry is necessary. | Intentional exception. Keep using Hito controls around it. |
| Calendar action overlays | `HitoCalendarDayCell` visual owner | Add/move/copy/drag/feedback affordances wrap locally around day cells. | Future calendar-authoring cleanup should extend shared calendar action API carefully. |

## Offender Inventory
### P1 - Shared Owner Gap
Admin data table controls are DS-styled but route-local.

Evidence: `src/routes/admin.analytics.tsx` owns `DataTableUtilityRow`, `DataTableColumnHeader`, static header behavior, filter menus, search expansion, and active filter summaries locally. `src/routes/admin.capture.tsx` has similar utility/filter/search/menu behavior.

Fix direction: promote shared `AdminDataTableToolbar`, `AdminDataTableColumnHeader`, and related active-filter summary primitives. Reuse existing `hito-data-table*`, `DropdownMenu`, `Icon`, `hito-field`, and button classes. Do not redesign table behavior.

### P1 - Shared Owner Gap
Tooltip and popover wrapper defaults are not Hito-native.

Evidence: `src/components/ui/tooltip.tsx`, `src/components/ui/popover.tsx` still carry legacy shadcn-style defaults. Product consumers patch this with `hito-tooltip` or specialized classes.

Fix direction: normalize the wrapper defaults to Hito DS, preserving `className` overrides and Radix behavior. Keep specialized `hito-date-picker-popover` for date picker.

### P1 - Shared Owner Gap
Low-level `Input` and `Textarea` wrappers are still legacy-looking while product uses Hito field classes directly.

Evidence: `src/components/ui/input.tsx` and `src/components/ui/textarea.tsx` default to `rounded-md border-input bg-transparent shadow-sm`. Runtime product fields mostly use `hito-field` / `hito-textarea-*`.

Fix direction: either update these wrappers to emit Hito defaults or explicitly classify them as legacy infra and add Hito-native replacements. Do not force all raw inputs into wrappers in one pass.

### P1 - Route-Local Composition
Admin Work Items is becoming a local mini-system.

Evidence: `src/routes/admin.capture.tsx` owns backlog rows, metadata strips, detail panels, prompt blocks, technical details, note panels, quick-note header behavior, and metadata menus locally.

Fix direction: extract only repeated and admin-owned anatomy first: `AdminWorkItemRow`, `AdminWorkItemDetail`, `AdminQuickNotePanel`, and `AdminMetadataMenu`. Keep Work Items product logic and data model unchanged.

### P2 - Route-Local Composition
Workout completion controls build choice cards, actual metric fields, interval completion, and RPE controls locally.

Evidence: `src/components/CompletionPanel.tsx` builds outcome choice cards with `hito-surface-flat`, numeric fields through `NumField`, interval buttons, and local `Slider`.

Fix direction: normalize to DS-backed components or patterns: `HitoChoiceCardGroup` for outcome, `HitoActualMetricField` for actual vs planned metrics, existing `hito-scale-control` / `hito-scale-button` for RPE-like choices. Do not change result persistence or saved-result behavior.

### P2 - Wrapper/Width Drift
Some dropdown menu widths and destructive item tones remain local.

Evidence: manual workout step action menu still uses `className="w-48"` and direct destructive text class. Most other menus already use named Hito menu width tiers.

Fix direction: add or reuse a named compact menu width tier and expose a destructive menu item tone. Avoid arbitrary Tailwind width utilities in product menu content.

### P2 - Native Select Wrappers
Native select fields appear in Work Items and Body Notes.

Evidence: `SelectField` in `src/routes/admin.capture.tsx`; `NoteSelectField` in `src/components/workout-completion/BodyNotesEditor.tsx`.

Fix direction: migrate to `Select` where accessible interaction allows it, or create a small `HitoNativeSelectField` exception with documented Safari/native rationale. Do not leave ad hoc local select wrappers.

### P2 - Disclosure Drift
Some details/readback sections use local `details` anatomy instead of the Hito disclosure contract.

Evidence: workout comparison notes use `details` with border classes; admin and import surfaces have stronger `hito-disclosure` adoption.

Fix direction: migrate local detail sections to `hito-disclosure` classes or add a thin `HitoDisclosure` wrapper. Do not redesign content.

### P3 - Watchlist
Metric/readback/fact rows are repeated in several route-local wrappers.

Evidence: local `Metric`, `Stat`, `ReadbackRow`, `ComparisonMetaItem`, `SummaryMetric`, and similar helper components appear across Today, workout detail, comparison, admin analytics, and plan preview surfaces.

Fix direction: watch for repetition in the next cleanup. Promote `HitoMetricValue`, `HitoMetricGroup`, or `HitoReadbackRow` only when a bounded batch touches multiple surfaces.

## Recommended DS Additions
Only add these if the first implementation batch confirms repeated adoption value.

| Proposed addition | Why it may be needed | Scope boundary |
| --- | --- | --- |
| `HitoInput` / Hito-native `Input` defaults | Prevent future legacy field styling from low-level wrapper imports. | No broad form redesign. Preserve existing props/ref behavior. |
| `HitoTextarea` / Hito-native `Textarea` defaults | Same as input. | No copy or validation behavior changes. |
| Hito-native `TooltipContent` default | Remove repeated `className="hito-tooltip"` patches. | Preserve Radix behavior, side offsets, portals, overrides. |
| Hito-native `PopoverContent` default | Remove legacy popover surface drift. | Keep date picker specialized popover class as valid override. |
| `HitoStatusPill` | Reduce local status wrapper drift. | Thin wrapper only; tones stay the existing CSS contract. |
| `AdminDataTableToolbar` | Shared search/filter/row count anatomy for admin tables. | Admin-only. No new metrics. |
| `AdminDataTableColumnHeader` | Shared sortable/filterable header menu anatomy. | Admin-only. Preserve table semantics. |
| `AdminMetadataMenu` / `HitoMetadataSelectTag` | Shared editable metadata tag with dropdown. | No data mutation rules inside the component. |
| `HitoSelectField` or `HitoNativeSelectField` | Replace ad hoc select field wrappers. | Use native only when explicitly justified. |
| `HitoDisclosure` | Prevent bare `details` patterns from drifting. | Thin wrapper over existing `hito-disclosure` classes. |
| `HitoChoiceCardGroup` | Normalize richer card-like selection choices. | Only if used by both onboarding/completion or another repeated product surface. |
| `HitoActualMetricField` | Reuse planned-vs-actual field anatomy. | Workout-result domain; do not make generic data-entry framework. |

## Migration Categories
### Migrate To Existing Primitive
- Native buttons with correct `hito-button*` classes can stay unless repeated anatomy warrants a wrapper.
- Raw inputs/textareas already using `hito-field` can stay in place for now.
- Local details should migrate to `hito-disclosure` before adding a new component.
- Menu width utilities should migrate to named Hito menu width tiers.
- Status spans should use `hito-status-pill` consistently; add a wrapper only when local mapping logic repeats.

### Extract Or Promote Into DS
- Admin data table toolbar/header/menu patterns.
- Admin metadata dropdown tag pattern.
- Hito-native low-level Input/Textarea/Tooltip/Popover defaults.
- Completion outcome and actual metric field patterns if they stay repeated.

### Leave As Intentional Exception
- `/hitoDS` specimen/playground scaffolding.
- Figma/export board geometry.
- `HitoCalendarDayCell` internal geometry.
- `WorkoutGlyph` custom workout identity glyphs.
- Manual workout structure geometry and editor domain semantics.
- Body map SVG/point selection.
- Changelog editorial timeline.
- `test-calendar` fake sandbox surfaces.
- Auth/hero visual art where it is not repeated as product control anatomy.

## State Requirements
Every promoted component must carry the same state contract as the surface it replaces.

| Component family | Loading | Empty | Error | Success / review |
| --- | --- | --- | --- | --- |
| Admin data table toolbar/header | Search/filter controls remain stable while table data loads. | Row count reads zero; filters remain editable. | Filter/search error is inline or page-level, not hidden inside header. | Active filters and sort state are visible and removable. |
| Admin work item row/detail | Skeleton or muted loading row if data is pending. | Work Items empty state uses existing admin empty surface. | Failed import/read state remains admin unavailable state. | Selected item detail shows prompt/copy/review without extra card soup. |
| Input/Textarea/Select field | Disabled/loading state if parent form is busy. | Placeholder only, not fake values. | `hito-field-error` and `aria-describedby` required. | Success/helper text uses `hito-field-success` or neutral helper. |
| Tooltip/Popover | Trigger remains focusable while content is unavailable. | No empty popover shell. | Do not use popover as primary error container. | Popover content reads as Hito low-chrome surface. |
| Status pill | Not applicable unless async status. | No pill if no status is meaningful. | Error tone uses destructive only for real failure. | Success/review tones remain semantic, not decorative. |
| Completion choice/metric controls | Save/upload loading remains owned by parent form. | Skipped/rest states do not expose irrelevant metrics. | Field-level validation appears near field. | Saved/dirty/review state remains visible in completion panel header. |

## Batching Guidance
Do not attempt one global "replace every custom component" pass. Use bounded batches with clear validation.

### Batch A - Admin Operational Components
Goal: remove duplicated admin table/work-item component anatomy.

Targets:
- `src/routes/admin.analytics.tsx`
- `src/routes/admin.capture.tsx`
- `src/components/admin/*`
- existing `hito-data-table*`, `hito-admin-*`, `DropdownMenu`, `HitoMetadataTag`

Allowed additions:
- `AdminDataTableToolbar`
- `AdminDataTableColumnHeader`
- `AdminMetadataMenu`
- `AdminQuickNotePanel` if route-local header/inline variants remain repeated

Validation:
- Users/Test accounts table behavior unchanged.
- Work Items list/detail behavior unchanged.
- Search, filters, sorting, metadata editing, prompt copy, empty/error states still work.

### Batch B - Low-Level Wrapper Normalization
Goal: make common wrapper imports Hito-native by default.

Targets:
- `src/components/ui/input.tsx`
- `src/components/ui/textarea.tsx`
- `src/components/ui/tooltip.tsx`
- `src/components/ui/popover.tsx`
- `/hitoDS` examples that document these wrappers

Allowed additions:
- Hito-native defaults or explicitly named Hito wrappers.

Validation:
- No visual regression in existing tooltip/popover/date picker/onboarding metadata usage.
- No product form loses focus/disabled/error behavior.

### Batch C - Workout Completion Controls
Goal: reduce local control anatomy in `CompletionPanel` without changing result behavior.

Targets:
- `src/components/CompletionPanel.tsx`
- `src/components/workout-completion/BodyNotesEditor.tsx`
- existing `hito-choice-toggle`, `hito-scale-control`, `hito-field`, `hito-status-pill`

Allowed additions:
- `HitoChoiceCardGroup`
- `HitoActualMetricField`
- optional status wrapper if repeated.

Validation:
- Completed, partial, skipped, dirty, saved, error, preview-only, and rest-day states still behave the same.

### Batch D - Calendar Action Ownership
Goal: keep calendar authoring affordances from drifting around `HitoCalendarDayCell`.

Targets:
- `src/components/Calendar.tsx`
- `src/components/ui/hito-calendar-day.tsx`
- `src/components/test-calendar/test-calendar-sandbox.tsx` only if fake sandbox needs parity.

Allowed additions:
- Shared drag-preview/action-affordance helper only if it reduces repeated wrappers.

Validation:
- Month/week scanability unchanged.
- Manual workout action affordances remain accessible.
- No schedule/persistence semantics move into the visual cell component.

## Highest-Value First Batch
Recommended first batch: Batch A, Admin Operational Components.

Why:
- It has clear duplication across `admin.analytics` and `admin.capture`.
- It removes real route-local component ownership, not just cosmetic class drift.
- It reuses existing Hito DS table/menu/status/tag primitives.
- It can be validated without backend or product behavior changes.
- It reduces two large route files before they become harder to review.

Architecture should still confirm exact extraction boundaries because these files are large and mix data shaping, interaction state, and presentational anatomy.

## What Not To Touch
- Do not reopen primitive-token cleanup.
- Do not change backend-owned admin classification, analytics metrics, work-item import, or Supabase behavior.
- Do not change workout completion persistence.
- Do not change plan generation, calendar schedule truth, active-plan lifecycle, or provider ingest.
- Do not convert domain components like body map, workout glyphs, manual workout structure geometry, or changelog timeline into generic DS primitives.
- Do not add a broad enterprise component library.
- Do not introduce new colors, radii, typography scales, or card systems.
- Do not treat `/hitoDS` specimens as product runtime components.

## Risks
- Promoting too many wrappers at once could create an accidental mini-framework.
- Updating low-level wrappers could affect dormant imports; Frontend must inspect import usage before changing defaults.
- Extracting admin table/work-item anatomy from large files can become behavior refactor if not kept presentational.
- Completion controls are product-sensitive because they sit on saved-result behavior; keep that as a separate later batch.
- Manual workout editor has real domain complexity; genericizing it too early would add abstraction without reducing drift.

## Exit Criteria
- The selected first batch removes at least one repeated route-local component family.
- No new one-off local UI class family is added.
- New shared components reuse existing Hito DS classes and primitives.
- Domain exceptions are explicitly documented in the final implementation report.
- Loading, empty, error, success, and review states remain equivalent or clearer than before.
- `/hitoDS` is updated only when it documents a new reusable component owner, not for decorative showcase expansion.

## Suggested Next Step
ARCHITECT should select the first cleanup batch, with Designer recommending Batch A: Admin Operational Components. After Architecture fixes the boundary, FRONTEND can implement the chosen shared component extraction and migration in one bounded pass.

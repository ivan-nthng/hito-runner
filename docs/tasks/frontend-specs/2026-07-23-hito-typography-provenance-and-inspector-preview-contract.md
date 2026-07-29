# Hito Typography Provenance Completion And Inspector Preview Contract

## Work Item ID

2026-07-23-hito-typography-provenance-and-inspector-preview-contract

## Status

completed

## Type

frontend_spec

## Priority

high

## Owner

design_system

## Scope

hito-ds-reference-figma-export-surface

## Archive Intent

retain_in_place

## Task

Record the accepted Hito typography-provenance completion and Local Inspector preview contract.

## Stage

FRONTEND implementation and integrated QA complete. Broader Global QA remains a separate release
gate.

## Historical Handoff Status

None. The typography provenance and Inspector preview contract are implemented and accepted at the
owner level.

## Track Tags

`hito-ds`, `typography`, `local-inspector`

## Parent Plan

`docs/plans/active/2026-06-29-hito-ds-external-reuse-and-theme-contract.md`

The plan header still describes an older backend Settings gate. It is not the live stage of this
completed child task.

## Accepted Implementation

- `src/lib/hito-typography-roles.ts` remains the one 19-role inventory and its existing 14-role safe
  Inspector replacement subset remains unchanged.
- Proven shared aliases now publish only inherited `--hito-typography-role` provenance; their visual
  typography declarations did not change.
- Inspector previews the selected element's actual computed typography first, including truthful
  confirmed, component-owned, and `Custom` states. The following 14 options use real shared role
  classes and samples without technical-detail subrows.
- `/hitoDS` exercises the live Inspector consumer, and Figma/reference output still derives from the
  same inventory.
- Independent desktop, exact-375px, light/dark, keyboard, WebKit, build, runtime, cleanup, and
  scoped-hygiene evidence passed.

Implementation DoD: Passed.

Global QA Acceptance: Pending as a separate release gate.

## Problem Statement

The Hito typography source hierarchy is already correct:

1. `src/lib/hito-typography-roles.ts` owns one central role inventory.
2. Shared CSS owners declare confirmed role provenance through
   `--hito-typography-role`.
3. `/hitoDS`, Figma/reference output, and Local Inspector consume the same inventory.
4. Inspector confirms a role only from the inherited provenance property.

Two bounded gaps remain.

First, several shared CSS recipes are semantically existing Hito roles but do not publish the
provenance signal. Inspector therefore reports those known shared recipes as `Custom`, even though
the source already gives enough evidence to assign an existing role.

Second, the Inspector typography menu is diagnostic rather than visual. It currently renders a role
label and a second technical row containing font details and class names. The selected element's
actual typography is reduced to text metadata instead of being previewed. A user cannot compare the
current style with Hito roles by looking at the type itself.

The correction must complete truthful provenance only where source ownership is clear and make the
Inspector menu a direct typography preview. It must not create a new type scale, a second role
registry, or a computed-style ownership matcher.

## Root-Cause Evidence

### Central inventory

`src/lib/hito-typography-roles.ts` defines:

- 19 canonical Hito typography roles;
- stable role ids;
- canonical classes;
- labels, usage descriptions, specifications, and samples;
- `HITO_INSPECTOR_TYPOGRAPHY_ROLES`, the existing safe replacement subset;
- `HITO_TYPOGRAPHY_PROVENANCE_PROPERTY`, the single provenance property.

The inventory contains 14 Inspector-selectable text roles. The five component-owned roles marked
`inspectorSelectable: false` are:

- `button`;
- `nav-menu`;
- `metric`;
- `status`;
- `error-success`.

Those five roles remain recognizable as current typography. They are not general replacement
choices.

### Provenance discriminator

`src/components/devtools/local-ui-inspector-targets.ts` reads the inherited computed value of
`--hito-typography-role` and resolves it through the central role map. Matching font values do not
confirm ownership. The `/hitoDS` unresolved-lookalike specimen in
`src/components/hito-ds/reference-foundations-page.tsx` explicitly documents that rule.

This discriminator is accepted and must not change.

### Current menu rendering

`src/components/devtools/LocalUiPropertyControlPrimitives.tsx` currently renders each typography
option as:

- a plain role label;
- a second `hito-caption` row;
- `technicalDetails`;
- the CSS class name.

`src/components/devtools/LocalUiTypographyControls.tsx` also converts the current selected style into
a diagnostic string composed from family, size, weight, line height, and letter spacing.

This proves the presentation problem: real computed typography is collected, but the menu displays
descriptions of typography rather than typography samples.

### Reference consumers

- `src/components/hito-ds/reference-foundations-page.tsx` renders all roles from
  `HITO_TYPOGRAPHY_ROLES`.
- `src/components/hito-ds/figma-export-board.tsx` renders the same role inventory and each role's
  canonical sample.
- Local Inspector derives recognition and replacement options from the same source.

No second registry is needed.

## Canonical Typography Inventory

The role ids and the selectable/non-selectable split remain unchanged.

| Role family | Role ids | Canonical source evidence |
|---|---|---|
| Editorial titles | `display-title`, `page-title`, `modal-title`, `section-title`, `panel-title` | `src/styles/layout-typography.css` |
| Operational text | `body`, `body-small`, `caption`, `label`, `form-label`, `micro-label` | `src/styles/layout-typography.css` |
| List and field support | `list-row-title`, `helper`, `error-success` | `src/styles/controls-lists.css`, `src/styles/forms-onboarding.css` |
| Technical text | `technical-mono`, `metric` | `src/styles/layout-typography.css`, `src/styles/shell-admin-analytics.css` |
| Component-owned text | `button`, `nav-menu`, `status` | `src/styles/controls-lists.css`, `src/styles/shell-admin-analytics.css` |

There is no source-backed reason to add another role in this slice.

The inventory remains the only maintained metadata source. Inspector-specific option data must be a
derived view of this inventory, not another hand-written list.

`spec` remains the technical reference string for documentation. The current
`technicalDetails` field largely duplicates `spec` and exists for the Inspector's diagnostic
presentation. Frontend should retain duplicate metadata only if a live non-visual consumer still
requires it after the preview correction. Otherwise, delete the duplicate field and its transport
types instead of preserving two near-identical descriptions.

## Service-Wide Classification

### 1. Confirmed Canonical Hito Roles

These owners already publish truthful provenance and require no role or visual change.

| Source owner | Confirmed roles | Decision |
|---|---|---|
| `src/styles/layout-typography.css` | `label`, `display-title`, `page-title`, `modal-title`, `panel-title`, `section-title`, `body`, `body-small`, `caption`, `form-label`, `micro-label`, `technical-mono` | Canonical. Preserve. |
| `src/styles/controls-lists.css` | `button`, `list-row-title` | Canonical. Preserve component inheritance. |
| `src/styles/forms-onboarding.css` | `helper`, `error-success` | Canonical. Error and success correctly share one feedback typography role while color carries state. |
| `src/styles/shell-admin-analytics.css` | `nav-menu`, `metric`, `status` | Canonical. Preserve recognition-only status for Inspector replacement. |

Nested descendants inherit the nearest role. A nested canonical role overrides the ancestor. The
Inspector must continue resolving the nearest inherited property value.

### 2. Missing Provenance Adoption

The following shared recipes have clear semantic and source-backed alignment with existing roles.
They need the provenance property only. Their computed typography, layout, color, and behavior must
not change.

| Shared owner | Existing role | Source evidence | Required decision |
|---|---|---|---|
| `.hito-page-copy` | `body` | Same shared page-copy purpose and `0.875rem / 1.58` recipe; used across `/`, Settings, Progress, Integrations, workout detail, and `/hitoDS`. | Publish `body` provenance without restyling. |
| `.hito-support-copy` | `body` | Same readable support-copy purpose and `0.875rem / 1.58` recipe; used across product and reference surfaces. | Publish `body` provenance without restyling. |
| `.hito-list-row-copy` | `body-small` | Same secondary row-copy purpose and `0.8125rem / 1.5` recipe; used by list, plan-management, onboarding, workout, and reference owners. | Publish `body-small` provenance without restyling. |
| `.hito-section-subtitle` | `micro-label` | Repeated uppercase micro-orientation recipe with the same size, weight, and tracking family. | Publish `micro-label` provenance; preserve its current line-height variant. |
| `.hito-shell-brand-kicker` | `label` | Same compact `0.75rem / 600 / 0.01em / 1.25` role and orientation purpose in AppShell and `/hitoDS`. | Publish `label` provenance without changing shell chrome. |
| `.hito-ui-dialog-title`, `.hito-ui-sheet-title` | `modal-title` | Shared Radix title defaults use Fraunces, `1.75rem`, weight 400, `-0.02em`, and `1.1`; explicit product dialogs already apply `hito-modal-title`. | Publish `modal-title` provenance so default shared titles are truthful. Do not alter explicit title classes. |
| `.hito-ui-dialog-description`, `.hito-ui-sheet-description` | `body` | Shared Radix description defaults use the body `0.875rem / 1.58` recipe; product dialogs already apply `hito-body`. | Publish `body` provenance without changing description styling. |
| `.hito-ui-menu-item` | `nav-menu` | Shared dropdown/select rows use the same `0.8125rem / 500 / 1.3` menu recipe as canonical Hito menu text. | Publish recognition-only `nav-menu` provenance. It must not become selectable. |
| `.hito-ui-menu-label` | `micro-label` | Shared dropdown labels use the canonical uppercase micro-label family. | Publish `micro-label` provenance; preserve the menu-specific line height. |
| `.hito-editable-value-field-error` | `error-success` | Shared Editable Value Field error uses the same bounded feedback `0.875rem / 500 / 1.45` recipe and semantics. | Publish `error-success` provenance. It remains recognition-only. |

This is one provenance-completion batch because all changes attach existing ids to existing shared
owners. It does not authorize visual typography normalization.

### 3. Intentional Domain, Route, Component, Or Reference Typography

The following groups must remain unconfirmed unless a separate source-backed design decision adopts
them. A visual similarity is insufficient.

| Owner group | Source evidence | Classification and boundary |
|---|---|---|
| Calendar date, drag preview, feedback marker, and workout navigation typography | `src/styles/calendar-state-surfaces.css`, `src/components/ui/hito-calendar-day.tsx`, `src/components/calendar/manual-calendar-actions.ts` | Intentional calendar geometry and compact state language. Do not promote to generic roles. |
| Changelog year/month/day timeline | `src/styles/layout-typography.css`, `src/routes/changelog.tsx` | Intentional editorial timeline typography. It is a reusable changelog pattern, not a generic title role. |
| Analytics values, table headers, legends, chart notes, and scale controls | `src/styles/shell-admin-analytics.css`, `src/components/admin/*`, `src/routes/progress.tsx` | Intentional analytics and visualization typography. `hito-metric-value` remains the only confirmed generic metric role. |
| Workout hero title | `src/routes/workout.$date.tsx`, `src/components/TodayHero.tsx` | Repeated workout-domain hero recipe. It does not match the current page or panel role contract. Keep it custom in this slice; a future normalization must use a workout-domain owner rather than invent a generic role. |
| Workout structure and manual-authoring grammar | `src/components/workout-structure/*`, `src/components/manual-workout/*`, `src/styles/forms-onboarding.css` | Intentional structured-workout geometry and compact authoring grammar. Numeric or dense overrides are not general text roles. |
| Field, textarea, select, tab, choice-toggle, disclosure, and date-picker size tiers | `src/styles/forms-onboarding.css`, `src/styles/controls-lists.css`, `src/styles/overlays-feedback.css`, `src/components/ui/calendar.tsx` | Component-owned typography. Size and anatomy determine the recipe. Do not create generic replacement roles for each control tier. |
| Tooltip, toast, info-window, menu-meta, and window-note recipes | `src/styles/shell-admin-analytics.css`, `src/styles/overlays-feedback.css` | Shared component-pattern typography with distinct semantics. Similar values do not prove `caption`, `body-small`, or `error-success` ownership. Leave unconfirmed. |
| Reference workbench location, navigation, and specimen chrome | `src/styles/reference-workbench.css`, `src/components/hito-ds/*` | Internal reference/workbench typography. Do not add it to the product type scale. |
| Font-family helpers and diagnostic code | `.font-display`, `.font-mono-num`, `src/router.tsx` | Low-level family utility or diagnostic output, not semantic role provenance. |

`.hito-ui-sidebar-row` has no current TypeScript/TSX usage in the inspected source. Do not add
provenance merely because its computed recipe resembles `nav-menu`. Treat it as a separate stale
selector candidate and delete it only after Frontend proves there is no generated or runtime
consumer.

## Provenance Completion Rules

1. Provenance is assigned by the CSS owner that already owns the role recipe.
2. The value must be an existing stable id from `HITO_TYPOGRAPHY_ROLES`.
3. Adding provenance must not change computed typography or component behavior.
4. Descendants inherit the nearest owner.
5. A nested canonical role overrides an inherited role.
6. Component-owned roles remain recognizable even when they are not replacement choices.
7. Class-name presence may remain evidence, but it cannot confirm ownership.
8. Matching family, size, weight, line height, tracking, case, or numeric features cannot confirm
   ownership.
9. Unknown property values remain unconfirmed rather than being coerced to a nearby role.
10. Domain-specific typography remains custom until a separate accepted decision gives it an owner.

## Inspector Typography Preview Contract

### Closed Property Row

The closed Inspector property row remains compact and stable.

- Keep the existing `Typography` property label and the compact Hito Value Tag trigger.
- Do not render the trigger itself in the selected typography; doing so would make the Inspector row
  jump when changing between display, body, and micro roles.
- The trigger may show the current or pending role's short label.
- `Custom` remains an honest trigger label when provenance is unresolved.
- Existing current-to-desired pending-change behavior, removal, and generated-prompt semantics remain
  unchanged.

### Dropdown Ordering

The open dropdown has one fixed order:

1. Current selected typography.
2. The existing 14 safe Hito replacement roles in central inventory order.

The first item is always present, including when:

- the current role is a selectable Hito role;
- the current role is a recognition-only component role;
- the selected typography is custom or unresolved;
- the selected element has no useful short label.

The first item represents `Keep current`. Selecting it clears the pending typography change.

Do not hide the canonical role option later in the list merely because the current item already uses
that role. The first item represents the selected element's actual computed state; later items
represent canonical replacement contracts.

### Current Typography Item

The first item must visually render the selected element's current computed typography.

Preview text priority:

1. normalized visible text from the selected element;
2. the current confirmed role's central `sample`;
3. a short neutral fallback such as `Current typography`.

The preview must use the selected element's computed:

- font family;
- font size;
- font weight;
- font style;
- line height;
- letter spacing;
- text transform;
- font feature settings;
- font variant numeric;
- font variation settings when present.

The computed snapshot is observational evidence. It must not be written into the role inventory,
used to infer a Hito role, or emitted as a reusable token.

The menu should use its own foreground color and background for readability. Selected text color,
opacity, gradient, shadow, and surrounding layout are not part of the typography preview.

Responsive `clamp()` roles are previewed at the computed size of the inspected viewport. Re-selecting
or re-inspecting after a viewport change refreshes the snapshot.

Visually:

- show one quiet `Current` marker;
- show the preview text as the dominant content;
- do not show family, pixel size, weight, line height, tracking, class name, or provenance id as a
  second row;
- do not visually label unresolved typography with a diagnostic paragraph.

Accessibility may announce whether the current item is a confirmed Hito role or custom. That
truthful announcement does not need a visible diagnostic subrow.

### Hito Role Items

Every subsequent item is a direct typography sample.

- Source the item from `HITO_INSPECTOR_TYPOGRAPHY_ROLES`.
- Use the role's central `sample` as the primary visible text.
- Render that sample through the role's real shared `className`.
- Show the short role `label` once in the same row as quiet orientation text.
- Do not render `technicalDetails`, `spec`, CSS class names, role ids, font metrics, or usage
  descriptions inside the dropdown.
- Do not override font family, font size, weight, line height, letter spacing, or text transform to
  make different roles look uniform.
- Large roles may use more vertical space. The menu may clip or truncate long sample text at the
  viewport boundary, but it must not scale the typography down.

The five recognition-only component roles do not appear as replacement options. If one is current,
its computed typography still appears in the first item.

### Selection Semantics

- Opening the menu does not create a pending change.
- Selecting a different safe role creates the same explicit pending role change used today.
- Selecting the current item clears the pending role change.
- Selecting the same canonical role as the confirmed current role also resolves to no change.
- Removing a pending change returns the trigger and menu to the current computed state.
- No typography changes are applied live to the product.
- Generated prompts continue naming only the explicit desired Hito role.
- The computed preview snapshot remains evidence and must not become a mutation payload.

### Compactness And Responsive Behavior

The menu is compact because each item has one visual row and no technical-detail subrow. It does not
need equal-height role rows.

- Reuse the existing Hito Select/menu surface, item, focus, selected, and containment behavior.
- Keep menu width bounded to the viewport.
- Keep menu height bounded with contained vertical scroll.
- Do not create page-level horizontal overflow.
- On exact `375px`, the menu remains fully reachable, the sample is readable, and the role label
  does not force the sample outside the viewport.
- Long current text and long role samples truncate or clip inside the item, not at page level.
- The active item remains visible when the menu opens and after keyboard navigation.

## Accessibility Contract

- The trigger has an accessible name that states it changes the desired typography role.
- The current item is announced as `Keep current typography` plus either the confirmed role label or
  `custom typography`.
- Each replacement item is announced as `Use Hito typography role <label>`.
- Visual sample text must not be the only accessible identification of the option.
- `aria-selected` or the underlying Select selected state remains truthful.
- Arrow keys move through options; Enter/Space selects; Escape closes without changing the pending
  state.
- Focus-visible treatment uses the existing Hito menu/select contract.
- Contained scrolling must remain keyboard- and pointer-usable.
- Screen-reader output must not announce technical metadata that is no longer visible.

## `/hitoDS` Coverage

The Foundations > Typography section remains the canonical live reference.

It must continue showing:

- all 19 roles from the central inventory;
- real role samples;
- role usage boundaries;
- inherited role provenance;
- nested role override;
- unresolved lookalike remaining `Custom`.

Add one compact internal-tool specimen for the Inspector typography picker:

- render the real Inspector picker owner, not a static imitation;
- show a confirmed current Hito role;
- show a custom/unresolved current computed preview;
- demonstrate the first current item followed by the safe role samples;
- state that component-owned roles can be recognized but are not general replacement options;
- state that computed previews never establish provenance.

This specimen belongs inside Typography as consumer proof. It is not a new generic product
component and must not be added to the public component catalog.

The existing unresolved-lookalike specimen must remain. It is the negative discriminator that proves
the implementation did not restore computed-style matching.

## Figma And Reference Coverage

`src/components/hito-ds/figma-export-board.tsx` must continue rendering all 19 role samples directly
from `HITO_TYPOGRAPHY_ROLES`.

No Figma variable, text style, component set, or new Inspector component is required by this slice.
The Inspector picker is internal tooling behavior, not a reusable Figma product primitive.

If the central role type is simplified:

- the Figma/reference grid must continue compiling from the same inventory;
- role ids, classes, samples, specifications, and selectable flags must remain stable;
- no Inspector-only metadata list may be introduced beside the inventory.

Figma/reference parity is a validation requirement, not permission to make Figma the runtime source
of truth.

## Smallest FRONTEND Implementation Owner

Primary owner: FRONTEND, in one bounded shared-typography and local-Inspector batch.

Expected source scope:

- `src/lib/hito-typography-roles.ts`;
- `src/components/devtools/local-ui-inspector-targets.ts`;
- `src/components/devtools/local-inline-change-target-utils.ts`;
- `src/components/devtools/LocalUiTypographyControls.tsx`;
- `src/components/devtools/LocalUiPropertyControlPrimitives.tsx`;
- the existing shared CSS owner files named in the missing-adoption table;
- `src/components/hito-ds/reference-foundations-page.tsx`;
- `src/components/hito-ds/figma-export-board.tsx` only if central-type compatibility requires a
  source-alignment change.

Frontend owns the implementation design. The required outcome is one derived inventory, truthful
provenance, visual preview behavior, and removal of obsolete diagnostic menu metadata. Do not create
a parallel registry, a new generic control family, or route-local preview CSS.

## Rollout Order

1. Preserve the accepted provenance discriminator and inventory ids.
2. Complete provenance on the proven shared aliases only.
3. Make the Inspector current item render the computed typography snapshot.
4. Make replacement items render real samples from the safe central subset.
5. Remove visible technical-detail subrows and delete obsolete duplicate metadata when no live
   consumer remains.
6. Add the bounded `/hitoDS` consumer-proof specimen.
7. Verify Figma/reference parity without exporting the devtool control as a new primitive.
8. Run integrated FRONTEND and independent QA proof, fixing same-owner regressions before reporting.

## What Not To Touch

- Do not add, rename, merge, or reorder canonical role ids.
- Do not expand the 14-role safe replacement subset.
- Do not make Button, Nav/Menu, Metric, Status, or Error/Success general replacement choices.
- Do not infer provenance from computed values, tag names, class names, or visual similarity.
- Do not adopt calendar, changelog, analytics, chart, workout, manual-authoring, control-size, toast,
  tooltip, info-window, or reference-workbench typography into generic roles.
- Do not change product copy, typography recipes, colors, route layout, or backend behavior.
- Do not mutate selected product typography live.
- Do not create route-local role metadata, data attributes, a second role list, a registry service,
  or a Figma-owned runtime contract.
- Do not turn the internal Inspector picker into a public product component.

## Definition Of Done

Implementation is complete only when:

- the proven shared aliases resolve to existing Hito role ids through inherited provenance without
  any computed-style change;
- all intentional domain/component typography remains unconfirmed;
- the first menu item always previews the selected element's actual computed typography;
- confirmed, recognition-only, and custom current states all preview truthfully;
- the next 14 items are direct samples rendered through the real shared role classes;
- no technical-detail subrows remain in the menu;
- replacement and generated-prompt behavior remains explicit and unchanged;
- `/hitoDS` proves positive, inherited, override, component-owned, and unresolved cases;
- Figma/reference output still derives from the single inventory;
- desktop, exact `375px`, light/dark, keyboard, focus, scrolling, and Safari-visible behavior pass;
- no new registry, generic role, route-local metadata, or live mutation path exists.

The task remains open if any required preview uses a diagnostic text substitute, any custom style is
misidentified as Hito, any intentional domain recipe is promoted without a separate decision, or
any required browser/build check fails.

## Required Validation Inventory

| Check | Scenario / environment | Required evidence |
|---|---|---|
| Root-cause discriminator | Unresolved lookalike with matching body values | Inspector reports Custom and previews the computed style. |
| Central inventory | Source inspection | 19 canonical roles, existing 14-role selectable subset, no second registry. |
| Provenance completion | Each shared alias in the adoption table | Correct existing id resolves; computed typography before/after is unchanged. |
| Intentional custom boundary | Calendar, changelog, analytics/chart, workout hero, control tier | Remains unconfirmed unless nested inside a real canonical owner. |
| Current confirmed preview | Direct and inherited canonical text | First item visually matches computed typography and announces the role. |
| Current component preview | Button or Nav/Menu target | First item previews current type; component role does not appear in replacement options. |
| Current custom preview | Unresolved selected text | First item previews the exact computed typography and remains Custom. |
| Role samples | All 14 safe options | Each sample uses its central sample and real shared class; no technical subrow. |
| Selection lifecycle | Open, choose role, choose current, remove pending, Escape | No implicit change; pending/generated prompt truth remains correct. |
| Responsive containment | Desktop and exact `375px` | Contained menu scroll, no page overflow, active option visible. |
| Themes | Light and dark | Samples remain readable without importing selected foreground/background. |
| Accessibility | Keyboard and screen-reader semantics | Correct names, selected state, focus-visible, Escape behavior. |
| `/hitoDS` | Foundations > Typography | Existing provenance proofs plus real Inspector consumer specimen. |
| Figma/reference | Figma export typography grid | All 19 roles still derive from the central inventory; no devtool primitive promotion. |
| Runtime health | Affected product, Inspector, `/hitoDS` routes | No new client errors or failed current requests. |
| Static/build | Targeted lint, production build, build integrity, scoped diff check | Every executed required check passes. |

Frontend must use one reusable QA subagent for independent browser acceptance and integrate the
complete inventory before returning. Broader release-wide Global QA Acceptance remains pending.

## Stop Conditions

Stop and report rather than implementing when:

- a candidate provenance adoption needs a new generic role;
- a domain-specific recipe must be relabelled to make coverage appear complete;
- exact current preview would require mutating the inspected product element;
- the safe replacement subset must expand;
- the implementation requires backend, persistence, schema, or product-state changes;
- central inventory and live CSS ownership disagree in a way that needs a Product or Design System
  decision.

## Closeout

The implementation stayed within the accepted shared typography, Inspector, `/hitoDS`, and
Figma/reference boundaries. It did not add roles, expand the replacement subset, infer ownership
from visual similarity, mutate selected product UI, or cross into backend/persistence work.

The reported 155px Figma `InlineEditableText` header-size overflow is outside this task's typography
grid and Inspector containment proof. It remains a separate visual-owner follow-up.

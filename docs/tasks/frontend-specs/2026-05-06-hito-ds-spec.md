# Hito DS Spec

## Status

backlog

## Type

frontend_spec

## Priority

medium

## Next Recommended Role

FRONTEND

## Task

Advance Hito DS Spec.

## Stage

FRONTEND implementation spec

## Exact Handoff Prompt

```text
ROLE: FRONTEND

TASK:
Advance Hito DS Spec.

STAGE:
FRONTEND implementation spec

CONTEXT:
- Source path: docs/tasks/frontend-specs/2026-05-06-hito-ds-spec.md
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

Designer Agent

## Last Updated

2026-05-06

## Purpose

`Hito DS` is the first internal design-system definition for Hito Running. Its job is to turn the current imported baseline plus the implemented auth, onboarding, weekly-plan, and workout flows into one consistent visual and interaction language for the service.

`Hito DS` exists to solve the current consistency gap:

- the product already has a strong visual mood, but many surfaces are still styled locally rather than through one canonical system
- the shared `src/components/ui` layer exists, but its defaults do not yet fully reflect the live Hito product tone
- route-level screens often hand-roll buttons, inputs, tabs, state panels, and cards instead of reusing one normalized pattern set
- loading, empty, error, preview, and saved-mode states are conceptually strong, but their visual treatment is not yet systematized

What `Hito DS` should standardize first:

- foundations used across all current surfaces
- the small set of components already active in login, onboarding, home, calendar, workout detail, and progress
- honest state communication patterns
- component rules that reduce local styling drift

What `Hito DS` should not standardize first:

- speculative enterprise token systems
- large component families not present in the product
- advanced data-viz grammar beyond the currently implemented surfaces
- AI-themed components, integration surfaces, or body-tracking widgets that are not part of the product core

## Design Principles

- Calm first
  The system should feel composed, quiet, and deliberate rather than loud or promotional.
- Editorial, not ornamental
  The current Fraunces-plus-Inter baseline is a strength. Use it with restraint and clear hierarchy.
- One signal accent
  Warm amber remains the primary attention and action color. The interface should not compete with it.
- Honest states
  Saved, preview, setup-required, loading, and error states must look intentional and trustworthy.
- Product over gallery
  Components should be shaped by real Hito flows: login, setup, weekly planning, workout review, and result logging.
- Reuse over local styling
  If the same pattern appears twice, it should graduate into Hito DS.
- Smaller system, better system
  Normalize what exists and simplify where possible rather than expanding the component surface area.

## Foundations

### Color Palette

Canonical palette direction:

- `background`
  Warm graphite canvas
  Current base: `oklch(0.16 0.005 60)`
- `foreground`
  Soft near-white text
  Current base: `oklch(0.96 0.005 80)`
- `surface`
  Primary dark panel background
  Current base: `oklch(0.19 0.005 60)`
- `surface-elevated`
  Slightly lifted panel background
  Current base: `oklch(0.22 0.006 60)`
- `muted-foreground`
  Secondary text for helper and metadata copy
  Current base: `oklch(0.62 0.01 70)`
- `signal`
  Warm amber for primary actions and active emphasis
  Current base: `oklch(0.78 0.14 65)`
- `success`
  Clear but restrained green
  Current base: `oklch(0.72 0.13 155)`
- `warn`
  Amber-orange warning tone
  Current base: `oklch(0.75 0.15 50)`
- `destructive`
  Burnt red error or blocked tone
  Current base: `oklch(0.62 0.18 25)`
- workout type accents
  `easy`, `long`, `quality`, `rest` remain domain colors, not generic UI status colors

### Semantic Color Roles

- `primary action`
  Use `signal` with dark foreground text
- `secondary action`
  Use surface-border treatment with hover fill
- `selected state`
  Use `accent` fill or subtle `signal` emphasis depending on component importance
- `info/meta`
  Use muted text plus hairline borders, not new bright colors
- `success state`
  Use `success` for saved or confirmed states only
- `warning state`
  Use `warn` for partial, caution, or in-between outcomes
- `error state`
  Use `destructive` for failures, blocked states, and critical corrections
- `preview state`
  Use neutral or muted treatment plus explicit copy, not a special new color family
- `saved/authenticated state`
  Use standard surface treatment plus content language, not badge overload

### Typography System

- `display`
  `Fraunces`
  Use for page titles, hero titles, prominent metrics, and key status moments
- `body`
  `Inter`
  Use for all primary UI copy, controls, labels, and helper text
- `mono`
  `JetBrains Mono`
  Use for dates, numeric badges, compact metrics, and machine-like metadata

Canonical type roles:

- `display-xl`
  landing, hero, and large state headings
- `display-lg`
  section titles and workout titles
- `title`
  card titles and modal titles
- `body`
  main copy and standard controls
- `body-sm`
  helper text and secondary descriptions
- `meta`
  uppercase micro-labels with tracking
- `mono-sm`
  compact status values, dates, and small numeric metadata

Typography rules:

- Do not use display typography for dense UI labels.
- Do not use uppercase tracking labels as body copy.
- Use mono only where numeric stability or structured metadata matters.
- Keep copy concise and direct; the interface should not sound like a coach bot.

### Spacing Scale

First canonical spacing scale:

- `4`
  micro gaps inside compact controls
- `8`
  close control spacing and icon gaps
- `12`
  compact panel internals
- `16`
  default small block spacing
- `20`
  medium control group spacing
- `24`
  standard card padding start point
- `32`
  section spacing inside pages
- `40`
  generous block separation
- `48+`
  hero and page-level breathing room

Rules:

- Prefer a tight, repeatable scale over many one-off values.
- Page sections may remain generous, but control internals should tighten.

### Radius, Border, Shadow, Surface Rules

- `radius-sm`
  utility chips and compact elements
- `radius-md`
  inputs, small buttons, tabs, menu items
- `radius-lg`
  default interactive containers
- `radius-xl`
  cards and state panels
- `radius-2xl`
  hero surfaces and large gates

Border rules:

- hairline borders are the default panel and divider treatment
- stronger borders are reserved for form focus, selected states, or error emphasis
- do not stack heavy borders plus heavy shadows on the same component

Shadow rules:

- shadows should remain soft and rare
- use shadow mostly for floating layers: menus, tooltips, dialogs
- cards should rely more on surface tone and border than on deep shadows

Surface rules:

- base canvas uses gradient atmosphere and warm graphite
- standard panels use `surface`
- premium or emphasized panels use `surface-elevated`
- floating content uses `popover` with blur where appropriate

### Icon Usage Rules

- Use one icon size family per component size.
- Default small UI icon: `16px`
- Compact utility icon: `14px`
- Large leading visual icon: `20px` to `24px`
- Icons support labels; they should not replace them in core product actions.
- Use the Hito Tabler-backed icon stroke weight consistently around `1.5`
- Do not introduce decorative icon noise into already information-dense panels.

### Motion And Interaction Principles

- Motion should confirm state change, not entertain.
- Use short fade, subtle scale, and panel-slide patterns already present in menus and overlays.
- Avoid large bouncy transitions.
- Hover should feel gentle and immediate.
- Focus must be visible and consistent across primitives.
- Loading states should preserve layout and reduce jump.

## Component Inventory

### Inventory Decision

The current repo contains many imported primitives, but the first canonical `Hito DS` component set should cover only the components that are already active or clearly needed by current product flows.

### First Canonical Set

- `Button`
  Primary, secondary, ghost, destructive, and text-link actions
- `Input`
  Single-line fields for email, username, password, and compact numeric entry
- `PasswordField`
  Composite pattern built from input plus trailing visibility toggle
- `Textarea`
  Notes, JSON text entry, and longer helper input
- `Tabs`
  Used in login and workout detail
- `DropdownMenu`
  Used in shell profile and app-level account controls
- `Card / Surface`
  Standard panels, elevated panels, state panels, and hero panels
- `Alert / Message`
  Inline error, warning, success, preview, and setup-required communication
- `Badge / StatusPill`
  Small semantic labels for backend mode, week status, preview, later, and saved state
- `Calendar / DayCell`
  Product-specific planning component family
- `NavigationItem / SidebarItem`
  App-shell navigation rows and mobile equivalents
- `Avatar`
  Small profile marker in app chrome
- `Dialog`
  Canonical desktop modal primitive for future app use
- `Drawer`
  Canonical mobile bottom-sheet primitive for future app use
- `Skeleton`
  Canonical loading placeholder primitive
- `StatePanel`
  Product-level empty, loading, error, setup-required, and plan-unavailable blocks

### Components Present But Not In First Normalization Scope

- chart primitives
- command palette
- OTP input
- carousel
- table
- accordion
- menubar
- advanced sidebar framework

These may remain in the codebase, but they are not first-wave Hito DS priorities.

## States And Variants

### Buttons

Canonical variants:

- `primary`
  amber fill, dark text
- `secondary`
  bordered, dark surface background, hover fill
- `ghost`
  minimal emphasis for utility actions
- `destructive`
  destructive fill for irreversible or critical actions
- `text`
  underline or low-chrome text action

States:

- default
  clear label, medium weight, balanced padding
- hover
  slight fill or opacity shift
- focus
  visible ring, not only border change
- active
  slightly darker pressed state
- disabled
  reduced opacity and no hover implication
- error
  not a button variant by default; reserve for destructive context only
- success
  not needed as a general button family
- with icon
  icon leads or trails with fixed gap
- without icon
  text-only baseline

Sizes:

- `sm`
  compact utility or dense panels
- `md`
  default form and page action size
- `lg`
  hero and key conversion actions

### Inputs

Canonical variants:

- `default`
  standard single-line field
- `numeric`
  mono-friendly numeric field
- `inline-compact`
  used in compact plan or logging contexts

States:

- default
  surface-backed field with hairline border
- hover
  subtle border or background lift
- focus
  clear focus ring plus border emphasis
- active
  same as focus
- disabled
  reduced contrast and blocked cursor
- error
  destructive border plus inline helper text
- success
  use sparingly, mostly after validation or accepted upload
- with icon
  leading or trailing icon slot
- without icon
  clean text field

Sizes:

- `sm`
- `md`
- `lg` only for auth-first or landing-like entry fields

### Password Field Behavior

Canonical pattern:

- password field is not a special visual family
- it uses the same input shell as standard text fields
- trailing icon button toggles visible/hidden state
- toggle target must be easy to hit and visually quiet
- `Show password` and `Hide password` labels must exist for accessibility

Do not:

- create a separate password style
- use heavy chrome or novelty icons

### Textareas

States:

- default
- focus
- disabled
- error
- success only for validated or accepted content flows

Rules:

- default to medium height
- allow resize where content length is expected
- preserve mono styling only for structured text like JSON

### Tabs

Canonical use:

- mode switching inside one surface
- never for major app navigation

Variants:

- `segmented`
  current login pattern
- `underline`
  current workout detail pattern

States:

- default
- hover
- focus
- active
- disabled
- with icon only if meaningfully needed, not by default

Normalization note:

- Hito DS should define these as two explicit tab families instead of letting each screen style tabs locally.

### Dropdown / Menu

Canonical roles:

- account menu
- overflow actions
- small contextual menu

States:

- default
- hover
- focus
- active or selected
- disabled
- destructive item
- with icon
- without icon

Rules:

- menu surfaces use elevated popover treatment with blur
- shortcuts and `Later` badges should have one consistent secondary style
- menus should not become settings dashboards

### Cards / Surfaces

Canonical surface families:

- `hero-surface`
- `standard-card`
- `elevated-card`
- `state-panel`
- `floating-surface`

States:

- default
- hover where interactive
- focus where clickable
- active where selected
- disabled only if truly non-interactive
- error
- success
- preview
- setup-required

Rules:

- state changes should rely on border, tone, and copy first
- not every surface needs hover
- state panels should be content-led, not badge-led

### Alerts / Messages

Canonical variants:

- `info`
- `success`
- `warning`
- `error`
- `preview`
- `setup-required`

States:

- default
- with icon
- without icon
- dismissible only when the product truly benefits from dismissal

Normalization note:

- the current app uses many handcrafted message blocks instead of one alert family
- Hito DS should define one consistent message anatomy:
  eyebrow
  title
  body
  optional actions

### Badges / Status Pills

Canonical families:

- `status-pill`
  app-shell metadata, backend state, week state
- `inline-badge`
  compact content annotations such as `Later`, `Preview`, `Saved`

States:

- neutral
- active
- success
- warning
- destructive
- preview
- disabled
- with icon
- without icon

Rules:

- keep them compact
- use them to support text, not replace text
- do not flood pages with many badge colors at once

### Calendar / Day Cells

This is a Hito product-specific component, not a generic DS calendar.

Canonical subparts:

- plan header
- view switch
- calendar grid
- day cell
- rest day cell
- selected or today day cell
- day-cell tooltip
- completion bar
- workout glyph

Day-cell states:

- default
- hover
- today
- upcoming
- completed
- partial
- skipped
- rest
- outside-current-month
- focus

Rules:

- today highlight must remain easy to find
- workout status should rely on one consistent combination of glyph, text, and bottom completion bar
- tooltip is supportive, not required for comprehension

### Navigation / Sidebar Items

Canonical variants:

- `primary-nav-item`
- `secondary-account-item`
- `mobile-nav-item`

States:

- default
- hover
- focus
- active
- disabled
- with icon
- without icon only in rare secondary contexts

Rules:

- active state should be obvious but restrained
- keep icon alignment and row height consistent
- sidebar metadata should not look like a separate product

### Modal / Drawer

Relevance:

- not a first-wave product surface, but relevant as canonical overlay primitives
- dialogs should cover desktop interruption cases
- drawers should cover mobile action and settings cases

States:

- closed
- open
- focus trapped
- destructive confirm
- loading action
- error inside overlay

Rules:

- overlays should inherit Hito dark-surface language
- use sparingly
- prefer inline flow over overlay when the task already fits the page

### Empty / Loading / Error States

These are first-class system components, not ad hoc route content.

Canonical state families:

- `loading-state`
- `empty-state`
- `error-state`
- `setup-required-state`
- `plan-unavailable-state`
- `preview-boundary-state`

Rules:

- all have one shared anatomy:
  eyebrow
  title
  body
  optional supporting metadata
  primary action
  optional secondary action
- loading uses skeleton plus preserved layout
- empty explains why the content is absent
- error gives one clear recovery path
- preview or setup-required states use neutral or signal tone, not destructive tone

## Showcase Definition

The future `Hito DS` showcase page or file should be the first implementation artifact after this spec. It should function as both a visual reference and a normalization checklist.

### Required Sections

- `Foundations`
  palette swatches with semantic labels
  typography specimens
  spacing rhythm examples
  radius, border, and shadow examples
- `Buttons`
  all variants
  all sizes
  icon and non-icon states
  disabled and loading examples
- `Inputs`
  default
  focus
  error
  success
  numeric field
  password field with visibility toggle
- `Tabs`
  segmented family
  underline family
- `Menus`
  dropdown examples with active, disabled, destructive, and shortcut rows
- `Cards And Surfaces`
  standard card
  elevated card
  hero panel
  state panel
- `Messages`
  info, success, warning, error, preview, and setup-required examples
- `Badges And Status Pills`
  all semantic roles
- `Calendar`
  realistic weekly-plan and day-cell examples
  today, completed, partial, skipped, rest, and out-of-range examples
- `Navigation`
  sidebar item and top-chrome status pill examples
- `Overlays`
  dialog and drawer examples if implemented in this pass
- `State Library`
  loading, empty, error, setup-required, and no-plan examples

### Showcase Interaction Requirements

- clickable state toggles where relevant
- variant toggles for buttons, pills, and alerts
- size toggles for buttons and fields
- icon on or off toggles where useful
- realistic copy from Hito product surfaces rather than lorem ipsum
- at least one example each from:
  login
  onboarding
  weekly plan
  workout detail
  workout logging

### Showcase Purpose

- verify that primitives match the real product
- expose style drift quickly
- help future contributors choose the right component instead of restyling locally
- act as the normalization acceptance surface before broad component adoption

## Normalization Notes

### What Is Already Strong

- the warm graphite palette and restrained amber signal
- display and body typography pairing
- hero-panel composition
- app-shell hierarchy
- weekly planning surface structure
- route-level loading and error state honesty
- compact metadata language using mono and uppercase labels

### What Should Be Normalized Next

- button styling
  currently split between local class strings and `ui/button`
- input styling
  currently often hand-authored in auth, onboarding, and logging forms
- tab families
  currently implemented as at least two local patterns
- message blocks
  currently many local panels replicate alert behavior
- status pills
  currently ad hoc in shell and detail surfaces
- card and state-panel anatomy
  currently repeated with slightly different padding, borders, and tone
- password-field pattern
  currently custom in auth, but should become canonical
- calendar day-cell rules
  currently strong, but need a named and reusable product component definition

### What Should Be Simplified

- excessive baseline primitive surface area from the imported set
- one-off class compositions for similar states
- local hover and focus treatments that do not align with DS rules
- mixing generic `shadcn` defaults with the stronger Hito-specific visual language

### Product Fit Rules

- `Hito DS` should feel like a running product with editorial calm, not a generic SaaS admin skin
- avoid glossy AI-product tropes
- preserve the current strong baseline rather than replacing it with a brighter or flatter system
- use honest state language as part of the visual system

## Risks / Open Questions

- The current product still carries some baseline screens that are broader than the MVP core, so the first DS pass must avoid normalizing every imported shell equally.
- The current auth and onboarding flows are implementation-real but may evolve, so DS should normalize the form patterns rather than overfitting the exact copy layout.
- Some existing `ui` primitives are generic enough to keep, but their visual defaults may need retuning to match Hito instead of generic `shadcn`.
- The showcase should probably become the first proving ground for replacing local button, input, and message styles with DS-backed components, but the exact rollout order still needs implementation judgment.

## Next Recommended Role

FRONTEND

## Suggested Next Step

Build the first `Hito DS` showcase page and use it to normalize the currently active component set first: buttons, inputs including password field, tabs, dropdown menu, cards or surfaces, status pills, alerts or state panels, calendar day cells, and loading or empty or error blocks across the existing Hito product surfaces.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the first canonical design-system spec for Hito Running under the internal name `Hito DS`, defining the product-aligned foundations, first component inventory, state rules, and the future showcase scope.

### Key Decisions

- Kept `Hito DS` intentionally small and product-shaped, centered on the currently implemented auth, onboarding, weekly-plan, workout-detail, and logging surfaces.
- Preserved the strongest parts of the imported baseline such as the warm graphite palette, restrained amber signal, editorial typography, and planning-surface hierarchy while identifying where local component styling must be normalized.

### Current State

- A canonical design-system artifact now exists in `docs/tasks/frontend-specs/`.
- Frontend now has a concrete target for the first Hito DS showcase and the first normalization pass across active shared components.

### Constraints

- Do not turn this into a broad enterprise design system or standardize speculative components that are not part of the current product.
- Do not discard the existing Hito visual tone in favor of generic UI defaults or AI-product styling.

### Risks / Open Questions

- Some current shared primitives still reflect generic imported defaults and will need careful retuning to match Hito without creating parallel component systems.
- The rollout order for replacing local route-level styling with DS-backed primitives still needs implementation judgment during the first frontend pass.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the first Hito DS showcase page and use it to normalize the active component set before expanding into less-used primitives.
```

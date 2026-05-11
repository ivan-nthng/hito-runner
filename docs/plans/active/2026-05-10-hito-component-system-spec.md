Status: Active
Owner: Designer Agent
Last Updated: 2026-05-10

# 2026-05-10 Hito Component System Spec

## Context

Hito Running now has an approved visual direction and a first implementation slice:
- calm
- editorial
- athletic
- premium
- low-chrome
- low-card

That direction is already visible in auth, text-first onboarding, advanced import, shell chrome, and the internal `/hitoDS` surface. What is still missing is one canonical component and primitive inventory that Frontend can implement systematically without inventing route-local behavior.

This spec defines the current Hito component system for the product as it exists now. It is not a generic brand bible and it does not extend the product into speculative capability areas.

## Reference Systems

Useful reference influences for rigor and consistency:

- Radix UI:
  strong interaction-state discipline, accessibility-minded primitives, and composable overlay/menu patterns
- shadcn/ui:
  pragmatic component layering and implementation realism for app teams shipping quickly
- Apple Health:
  restraint, semantic emphasis, calm data presentation, and strong scanability without dashboard clutter
- Linear:
  disciplined spacing, quiet chrome, and crisp status communication

What Hito should borrow:
- from Radix UI: predictable interaction states and overlay behavior
- from shadcn/ui: implementation practicality, not ornamental abstraction
- from Apple Health: quiet data framing and premium restraint
- from Linear: row density, hierarchy clarity, and low-noise controls

What Hito should avoid:
- copying bright SaaS color systems
- turning every primitive into a generic enterprise token exercise
- flattening the product into sterile monochrome minimalism
- creating many stylistic variants that the current app does not need

## Non-Negotiable Consistency Rules

- One size tier must mean the same control height across buttons and inputs.
- One label style must be reused across forms, support panels, and metadata labels.
- Metric composition is always value first, label second.
- Grouped support content uses one frame plus dividers, not stacked mini-cards.
- Semantic color must indicate meaning, not decoration.
- Display typography stays scarce; body and control typography stay disciplined.
- Rest-day sparsity is a supported design state, not a missing-content failure.

## Token Foundation

### Spacing Scale

Canonical spacing tokens:
- `2`: micro separation inside tight icon or chip layouts
- `4`: icon-to-label spacing, tight inline grouping
- `8`: compact control grouping
- `12`: row separation inside grouped support surfaces
- `16`: default control padding and compact surface padding
- `20`: medium internal padding
- `24`: section spacing inside a major surface
- `32`: top-level section spacing
- `40`: hero separation only

Rules:
- `12` and `16` should do most of the product work
- avoid ad hoc `14`, `18`, `22` spacing unless a component truly needs it

### Size Scale

Canonical size tiers:
- `XS`
- `S`
- `M`
- `L`
- `XL`

Use:
- `M` as default for most controls
- `L` for primary CTA or hero-adjacent controls
- `S` for dense utility actions
- `XL` only for major auth or onboarding entry actions
- `XS` only for compact utility contexts

### Radius Scale

Canonical radius tokens:
- `r-xs`: 8px
- `r-s`: 10px
- `r-m`: 12px
- `r-l`: 16px
- `r-xl`: 20px
- `r-2xl`: 24px

Rules:
- buttons, tabs, inputs, pills: `r-s` to `r-m`
- grouped support surfaces and cards: `r-l`
- major hero or feature surfaces: `r-xl` to `r-2xl`

### Border Thickness Rules

Canonical border rules:
- default hairline: `1px`
- no heavy `2px` framing for ordinary components
- `2px` may be used only for focus ring simulation or explicit active emphasis

### Shadow And Glow Rules

Canonical effects:
- no default component drop shadow
- subtle atmospheric hero glow allowed
- subtle signal glow allowed for primary CTA emphasis
- semantic glow allowed only for chart or interval emphasis where it improves readability

### Semantic Color Tokens

Core tokens:
- `canvas`
- `foreground`
- `muted-foreground`
- `surface`
- `surface-elevated`
- `hairline`
- `accent-surface`
- `signal`
- `signal-foreground`
- `success`
- `warn`
- `destructive`

Workout semantics:
- `easy`
- `long`
- `quality`
- `rest`

Rules:
- `signal` is the main action accent
- `success` is for completion or confirmed positive state
- `warn` is for caution, blocked continuity, or plan risk
- `destructive` is for errors and harmful actions

### Typography Scale

Canonical type sizes:
- `display-xl`: hero titles
- `display-l`: page titles
- `title-l`: section emphasis
- `title-m`: card/support title
- `body-m`: default body copy
- `body-s`: support copy
- `label`: metadata and field labels
- `caption`: compact support and tiny context
- `metric-xl`: hero metric values
- `metric-l`: standard metric values
- `metric-s`: compact numeric values

### Font-Role Rules

- `Fraunces`: display and title emphasis only
- `Inter`: body, labels, controls, rows, tabs, menus
- `JetBrains Mono`: dates, durations, counts, compact metrics, validation-like values

### Line-Height Rules

- display: tight, around `1.0` to `1.08`
- titles: `1.1` to `1.2`
- body: `1.45` to `1.6`
- labels and captions: `1.2` to `1.35`
- metrics: `1.0` to `1.15`

### Letter-Spacing Rules

- display: slightly tightened
- body: default
- labels/captions: uppercase tracking with deliberate spacing
- buttons/tabs: neutral to slight tracking only
- mono metrics: no decorative tracking expansion

## Size Tiers

### XS

- button height: 28px
- input height: 28px
- icon size: 12px
- horizontal padding: 8px
- text size: 11px
- use for: compact toolbar utility, tiny status actions

### S

- button height: 32px
- input height: 32px
- icon size: 14px
- horizontal padding: 10px to 12px
- text size: 12px
- use for: dense utility controls, shell actions, compact pill-adjacent controls

### M

- button height: 40px
- input height: 40px
- icon size: 16px
- horizontal padding: 14px to 16px
- text size: 14px
- use for: default form controls and everyday CTA

### L

- button height: 44px
- input height: 44px
- icon size: 16px
- horizontal padding: 16px to 18px
- text size: 14px
- use for: primary route-level CTA, dialog primary action

### XL

- button height: 52px
- input height: 52px
- icon size: 18px
- horizontal padding: 18px to 20px
- text size: 15px to 16px
- use for: auth-first or onboarding-first entry actions only

Rules:
- same tier means same visual height across button and input
- textarea does not use fixed height, but its padding and text size follow the nearest tier

## Button System

### Primary / Accent

Purpose:
- one primary action per surface

Use for:
- `Build my first plan`
- `Apply plan`
- `Log in`

Behavior:
- default: signal fill, signal-foreground text
- hover: slight opacity or tonal lift only
- active: slightly darker press state
- focus: visible signal-related ring
- disabled: reduced opacity, no fake emphasis

Icon rules:
- optional leading icon
- icon-only primary buttons are discouraged outside compact utilities

Sizes:
- default `M` or `L`

### Secondary

Purpose:
- quiet supporting action

Use for:
- `Download JSON template`
- `Open login`
- non-destructive alternate action

Behavior:
- default: quiet surface fill plus hairline border
- hover: accent-surface shift
- active: slightly darker fill
- focus: same ring behavior as primary
- disabled: reduced opacity

### Outlined

Purpose:
- rare emphasis where border-led clarity is needed without fill

Use for:
- low-frequency neutral actions inside dense grouped panels

Behavior:
- default: transparent or nearly transparent fill, hairline border
- hover: subtle surface tint
- active: slightly stronger tint

Note:
- if `secondary` already solves the use case, do not add `outlined`

### Ghost

Purpose:
- tertiary action

Use for:
- inline tool actions
- row actions
- calm non-primary navigation

Behavior:
- default: no border, minimal fill
- hover: light accent surface
- active: slightly stronger accent surface

### Destructive / Error

Purpose:
- confirm harmful or irreversible actions

Use for:
- future dangerous replace/delete/reset actions only

Behavior:
- default: destructive emphasis with clear contrast
- hover: stronger destructive tone
- disabled: visibly unavailable without implying success

### Success

Purpose:
- state acknowledgement, not a default CTA family

Use for:
- rare confirmed utility states only

Rule:
- do not add a broad “success button family” unless a concrete product action requires it

## Input System

### Text Input

Use:
- email
- username
- short settings fields

Behavior:
- default: quiet dark field with hairline border
- hover: slight border-contrast lift
- focus: signal-adjacent ring and clearer border
- error: destructive text plus border/state support
- disabled: dimmed fill and subdued text

### Textarea

Use:
- text-first onboarding
- notes
- JSON content

Rules:
- minimum comfortable height for primary authoring
- no ornamental resize affordances beyond practical vertical resize
- long-form input is a first-class primitive in Hito

### Select

Relevant:
- yes, but not yet a priority primitive in current surfaces

Rule:
- when added, it should match text-input height tiers exactly

### Search Field

Relevant:
- not yet for product rollout

Rule:
- do not define a separate visual family; inherit from text input when needed later

### Helper / Error / Success Text

- helper text: muted, concise, never longer than needed
- error text: destructive, direct, specific
- success text: success color, short acknowledgement

### Label Treatment

- uppercase micro-label style is canonical for fields and metadata
- use sentence labels only when a component would become unnatural with uppercase metadata styling

### Placeholder Rules

- placeholders are hints, not instructions walls
- muted enough to step aside from entered content
- example-heavy placeholders allowed only in long-form onboarding or JSON import

## Selection Controls

### Checkbox

Relevant:
- future settings or filters only

Specification:
- `M` control default
- label aligned to text baseline
- hit target must remain comfortable even if visual box is compact

### Radio

Relevant:
- future bounded mutually exclusive choices

Specification:
- same tier logic as checkbox
- use when the decision is explicit and immediately meaningful

### Toggle / Switch

Relevant:
- not justified for the current primary product slice

Rule:
- do not introduce until a real binary preference exists in the live product

## List And Row Primitives

### List Item

Purpose:
- default dense informational unit

Rules:
- use alignment and spacing first
- use divider between peers when they belong to one grouped frame

### Menu Item

Purpose:
- shell profile dropdown and similar overlays

Rules:
- icon optional
- label primary
- shortcut/status secondary
- hover state quiet, not flashy

### Settings Row

Purpose:
- future preferences/account patterns

Rules:
- left: label plus support text
- right: value, control, or `Later`

### Selectable Row

Purpose:
- future list selection and picker behavior

Rules:
- current selection needs clear but quiet emphasis
- do not rely only on color

### Metric Row

Purpose:
- canonical product-native primitive

Structure:
- value
- label
- optional qualifier

Rules:
- value carries the first visual weight
- label is smaller and calmer
- multiple metric rows should align vertically

### Grouped Support Panel Row

Purpose:
- canonical right-side support pattern for home/workout

Structure:
- optional micro-label
- one main content line or block
- optional support line
- optional status/pill/value

Rules:
- rows live inside one frame
- rows are separated by dividers or `12` spacing
- do not wrap each row in its own card

### Divider And Row Spacing Logic

- divider when rows belong to one logical support block
- spacing-only separation when content needs more softness and less segmentation
- avoid both thick borders and large spacing together

## Status And Semantic UI

### Pills / Badges

Canonical pill families:
- neutral
- success
- warning
- destructive
- workout-state

Use for:
- week state
- workout result state
- preview/setup/saved tags where genuinely useful

Do not use for:
- decorative metadata filler

### Status Labels

Use compact status text plus optional dot/icon when:
- clarity improves
- scanability matters more than prose

### Semantic Color Use

Info:
- calm neutral or muted accent use, not bright blue default SaaS behavior

Success:
- completed, confirmed, applied, saved

Warning:
- blocked continuity, partially off track, cautious next step

Error:
- invalid input, failed apply, harmful action

Workout semantics:
- easy
- long
- quality
- rest

Rules:
- never let workout semantic color replace system status color
- today/current attention uses signal, not success
- completion uses success, not signal

## Typography System

### Page Title

- font: display
- purpose: one primary route identity
- rule: only one per page section of consequence

### Section Title

- font: display or strong sans depending on density
- purpose: section orientation

### Card / Support Title

- font: usually sans or restrained display
- purpose: local emphasis, not headline drama

### Body

- font: sans
- purpose: default reading text

### Secondary / Support Text

- font: sans
- quieter contrast
- used for helper copy, explanatory text, and deferred-state truth

### Label / Caption

- font: sans
- uppercase tracked micro-label for metadata and field labels

### Metric Value

- font: mono or strong sans depending on context
- weight and scale must clearly outrank the label

### Metric Label

- smaller than metric value
- calmer than surrounding prose

### Button Text

- sans
- medium emphasis
- never oversized relative to the control

### Tab Text

- sans
- compact and calm
- active state depends more on contrast and fill than weight alone

Hierarchy rules:
- display is for identity
- sans is for operation
- mono is for measured truth
- one surface should not mix all three without purpose

## Composition Rules

### Dialogs

- one title
- one short description
- one main body
- one primary CTA plus one safe exit
- footer actions align to size-tier system

### Forms

- labels above fields
- helper/error text below fields
- one clear submission action
- field rhythm must feel even across auth, onboarding, and import

### Hero / Header Sections

- one display title
- one short support line
- optional metric/status line
- no stacked explanatory paragraphs

### Metric Groups

- use rows or aligned triplets before separate cards
- rest-day groups may collapse to zero or one contextual item

### Tabs

- use only for tightly related view modes
- tabs stay inside the surface they control

### Cards Vs Non-Cards

- use cards for hero framing or grouped support
- use non-card rows for dense informational content
- default to fewer containers

### Grouped Support Blocks

- this is a first-class primitive family
- one frame
- divider-led row separation
- calm internal spacing
- supports note, tomorrow, week status, and similar right-rail content

### Empty States

- one short explanation
- one valid next action if needed
- no decorative filler
- sparse can be intentional

## Primitive Mapping To Current Hito Surfaces

- `/login`:
  display title, `L`/`XL` entry actions, `M` inputs, tab primitive, helper/error text, auth panel surface
- text-first onboarding:
  major surface, long-form textarea, primary CTA, divider-led advanced import reveal
- advanced import dialog:
  dialog primitive, `M` fields, secondary and primary button hierarchy, validation/error text, grouped summary rows
- shell chrome:
  navigation row, profile trigger row, compact utility CTA, status pill, grouped note surface
- `/hitoDS`:
  living primitive reference and realistic usage seam
- next home/workout rollout:
  grouped support block, metric row, status pill, semantic state row, compact header actions

## Do Not Systematize Yet

- deep analytics chart language
- weather-specific UI
- AI insight panels beyond honest placeholders
- body-map specialty controls
- integration-brand components
- broad toggle/filter systems not present in current product
- large marketing-style illustration system

## Fastest High-Leverage Frontend Slice

Build the next shared primitive family for:
- grouped support blocks
- metric rows
- status pills and semantic state rows

Then demonstrate them on `/hitoDS` and apply them to:
- home support column
- workout detail right-side grouped panel
- shell plan note and compact week-state display

## Rollout Recommendation

Best next implementation slice:
- grouped support, metric, and status primitives for primary product-detail surfaces

Why:
- the current system already covers basic surfaces, fields, buttons, labels, and tabs
- the main remaining inconsistency risk is in home and workout information density
- solving that next will make later progress/body/integrations cleanup simpler rather than broader

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement the grouped support block, metric row, and status primitive family in the shared DS layer, show each variant on `/hitoDS`, and then roll that exact family into home/calendar and workout detail before broadening the system further.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the canonical Hito component-system specification, covering token foundations, size tiers, buttons, inputs, rows, status semantics, typography, and composition rules for the current calmer editorial product direction.

### Key Decisions

- The system should stay small, low-chrome, and product-shaped rather than becoming a generic enterprise design bible.
- The next implementation priority is the shared primitive family for grouped support blocks, metric rows, and status semantics.

### Current State

- Hito already has a strong first DS slice for surfaces, fields, buttons, tabs, labels, and dividers.
- The main missing canonical layer is the product-native component family for grouped support, metrics, and compact status communication.

### Constraints

- Do not broaden the system into speculative analytics, AI, weather, or integrations UI.
- Keep shared size tiers and typography rules consistent across controls and real product surfaces.

### Risks / Open Questions

- Without the next grouped-support primitive pass, home and workout detail may continue to drift into route-local patterns.
- `/hitoDS` should grow through realistic Hito usage examples, not through abstract component sprawl.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the grouped support block, metric row, and status primitive family in the shared DS layer and demonstrate it on `/hitoDS` before applying it to home/calendar and workout detail.
```

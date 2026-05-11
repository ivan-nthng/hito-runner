Status: Active
Owner: Designer Agent
Last Updated: 2026-05-11

# 2026-05-10 Hito Design System Spec And Rollout Plan

## Context

Hito Running now has a real implemented product shape:

- auth entry on `/login`
- text-first onboarding plus advanced JSON import
- saved home/calendar on `/`
- workout detail on `/workout/$date`
- preserved but secondary surfaces on `/progress`, `/body`, and `/integrations`

Recent hero and header cleanup is already QA-green and should be treated as the current direction, not as an experiment. The product already performs best when it feels calm, editorial, athletic, premium, and low-chrome. The design system should formalize that implemented reality, remove migration-era clutter over time, and give Frontend one practical rollout order.

This artifact is canonical for the current product. It does not redefine product logic, backend behavior, or speculative future features.

## Design Direction

Hito Running should feel like a premium running companion with restraint. The product should look composed rather than loud, useful rather than performative, and athletic without becoming aggressive. The implemented best direction is:

- calm
- editorial
- athletic
- premium
- low-chrome
- low-card

The UI should prioritize orientation and momentum:

- open the app and understand the current state quickly
- find today’s workout quickly
- understand completion status without scanning noise
- keep future-facing seams honest without pretending they already work

The product should not become:

- a generic SaaS dashboard full of boxed widgets
- a fake AI coach with over-promised insight language
- a neon sports app with decorative intensity
- a dense enterprise system with token complexity disconnected from the actual app
- a migration diary that explains internal constraints to the runner on every screen

## Non-Negotiable UI Rules

- Prefer one strong surface over multiple nested containers.
- Use color only when it carries semantic meaning, status, or workout-type emphasis.
- Preserve the current calmer hero/header direction across new work.
- Keep metric presentation consistent: value first, label second, no ad hoc rearrangements.
- Rest days must feel intentionally sparse, not like broken workouts.
- Future AI or upload seams must be framed as placeholders or support steps, never as implemented intelligence unless the behavior exists.
- Preserved secondary surfaces may remain simpler than the home and workout surfaces until their product role is tightened.

## Core Primitives

### Typography Hierarchy

Canonical type roles:

- Display: `Fraunces` for page identity, hero titles, and major sectional emphasis only
- UI text: `Inter` for all controls, body copy, labels, rows, tabs, and forms
- Numeric/technical values: `JetBrains Mono` for durations, dates where needed, workout structure counts, compact metrics, and validation-oriented values

Hierarchy rules:

- Display is sparse. Use it for one primary title per surface, not for repeated subheads.
- Section labels should use uppercase micro-label styling only when they add orientation.
- Body copy should stay short, especially on preserved or migration-era pages.
- Metric rows should visually privilege the value, then the label, then optional hint text.

### Spacing Scale

Use a compact but breathable scale:

- `4` for tight icon-to-label spacing
- `8` for compact control grouping
- `12` for small section separation inside grouped surfaces
- `16` for default internal padding on compact surfaces
- `20` to `24` for page-section spacing
- `32`+ only for hero/top-level separation

Rules:

- Avoid large dead zones inside already bounded panels.
- Right-side support surfaces should use tight internal rhythm with dividers, not isolated padded mini-cards.
- Preserve more air in auth and onboarding than in dashboard-like surfaces.

### Radius Rules

Canonical radius behavior:

- Inputs, tabs, pills, compact buttons: small-to-medium radius
- Standard grouped surfaces and cards: medium-to-large radius
- Hero and primary framing surfaces: large radius

Rules:

- Do not mix many radius sizes inside one small surface.
- Rounded corners should support softness, not novelty.

### Border Rules

Borders are hairlines, not heavy dividers.

Rules:

- Default surface separation should use subtle hairline borders.
- Prefer internal dividers over stacked bordered cards when content belongs together.
- Do not use borders only to “prove” a component exists.
- Remove decorative outlines from informational surfaces like fueling/recovery guidance where a darker backdrop carries the structure more cleanly.

### Background And Surface Rules

Canonical surface stack:

- warm graphite page canvas
- slightly elevated surfaces for grouped content
- restrained gradient or atmospheric glow only on hero-grade surfaces or premium emphasis moments

Rules:

- Page background does most of the mood-setting work.
- Not every content block needs its own elevated container.
- Use grouped frames for related support content.
- Secondary surfaces may be flatter than current legacy card stacks.

### Shadow And Glow Rules

Shadows and glows are subtle and should reinforce depth or emphasis, not create spectacle.

Rules:

- Warm signal glow is allowed for primary call-to-action emphasis and select hero accents.
- Workout semantic glow may appear in charts, interval visualization, and state emphasis where it improves legibility.
- Do not apply glow to ordinary cards, menus, or repeated layout pieces.

### Color Roles

Canonical roles already exist in the implemented app and should be standardized instead of replaced:

- canvas/background
- foreground
- muted foreground
- surface
- elevated surface
- hairline
- signal
- destructive
- warn
- success

Usage rules:

- `signal` is the primary accent and should stay rare enough to matter
- muted text should support context, not dominate content blocks
- destructive and warn tones are for real validation, blocked actions, or risky states only

### Semantic Workout-State Colors

Workout semantics should remain restrained and functional:

- easy: cool, softer emphasis
- long: warm signal-aligned emphasis
- quality: stronger intensity accent
- rest: low-contrast graphite treatment
- success/completed: green
- skipped/missed: destructive or muted-destructive
- today/current attention: signal-led emphasis, not green

Rules:

- Semantic workout color should never compete with global CTA hierarchy.
- Completed state should layer with selection/today state carefully; completion is status, not the main attention driver.

### Metric And Value-Label Composition Rules

Metrics should be composed consistently:

- value first
- label second
- optional hint or qualifier third

Examples of supported compositions:

- large key metric row in hero or workout summary
- compact triplet of `Distance`, `Duration`, `Target`
- mono-formatted secondary values where precision matters

Avoid:

- labels above some metrics and below others within the same surface
- mixing dense prose and metric blocks without separation
- decorative metric boxes when a simple inline or row group is enough

### Empty And Sparse-State Rules

Sparse is a valid state, not an unfinished state.

Rules:

- rest days should use intentional emptiness
- placeholder surfaces should explain the current truth briefly and stop
- empty states should point to the next valid action
- do not fill absent data with speculative advice, decorative charts, or fake coach copy

## Surface Rules

### Page Headers And Hero Sections

Headers should orient, not narrate.

Rules:

- one clear title
- one short supporting line at most
- metrics or state beneath when needed
- preserve current calmer hero/header cleanup on home and workout detail

Do not:

- stack multiple explanatory paragraphs above the fold
- reintroduce loud badges or duplicate controls in the hero area

### Cards Vs Non-Cards

Use cards only when a bounded container genuinely improves scanability.

Rules:

- hero surfaces and grouped support surfaces may be framed
- related support content should share one container with dividers
- preserved pages with legacy stacks should be gradually reduced
- use non-card rows, metric groups, and sectional spacing wherever possible

### Dialogs And Modals

Dialogs should feel like focused utility surfaces.

Rules:

- one title
- one short description
- one primary action and one safe exit
- validation and confirmation should appear inside the same flow when the task is bounded

Current fit:

- `UploadJsonDialog` is the right pattern baseline, but copy and structure should stay compact and explicit

### Forms And Inputs

Forms should be text-first, quiet, and confidence-building.

Rules:

- use one clear input rhythm across login, onboarding, and import
- preserve large text authoring area for text onboarding
- validation messages should be direct and specific
- password reveal is acceptable as an inline affordance, not a separate action row

### Tabs

Tabs should switch content mode, not mimic route navigation.

Rules:

- use tabs for tightly related content states like `Overview`, `Log result`, and preview panels
- keep tabs compact and visually subordinate to page title and core actions
- active tab emphasis should rely on fill/background and text contrast, not heavy chrome

### Lists And Rows

Rows should be the default for dense informational content.

Rules:

- use row patterns for weekly summaries, sidebar sections, legends, completion summaries, and dropdown items
- prefer thin separators and alignment over repeated boxed rows

### Metric Groups

Metric groups are preferred over card triplets unless the surface is hero-grade.

Rules:

- keep labels consistent
- align values predictably
- use mono numerals where precision helps comparison
- rest-day metric groups may collapse almost entirely

### Timeline And Legend Interaction Surfaces

Interaction-heavy visual surfaces like `IntervalsViz` should feel precise, not playful.

Rules:

- hover and focus may temporarily dim non-active segments
- tooltip content should prioritize the most decision-relevant fields
- color should explain structure, not decorate it
- avoid introducing a second visual language for charts elsewhere

### Status Pills And Badges

Status pills should stay compact and semantic.

Rules:

- reserve pills for week state, workout result state, and similar short statuses
- do not use badges as decorative metadata filler
- keep completed/success states green, warnings amber, blocked/risky states destructive, neutral states muted

## Interaction Rules

### Hover, Focus, And Active

Interaction should feel calm and exact.

Rules:

- hover: slight contrast lift, slight background shift, no large motion
- focus: clear visible ring or contrast edge on interactive controls
- active: a small press or opacity change is enough
- selected/current states must remain visible without requiring hover

### Dim And Highlight Behavior

Dim non-primary content only when it improves focus.

Rules:

- interval blocks may dim non-active blocks
- surrounding layout should not fade dramatically on simple hover
- use highlight for current selection, current day, or current tab with restraint

### Tooltips

Tooltips are for compressed explanation, not hidden requirements.

Rules:

- keep them short
- use for chart/legend density, not basic CTA explanation
- ensure keyboard-triggered visibility where the surface is interactive

### CTA Hierarchy

One surface should usually have one primary CTA.

Rules:

- primary CTA uses signal treatment
- secondary CTA uses quieter border or text treatment
- tertiary actions should usually look like rows, inline links, or menu items

### Destructive Vs Safe Actions

Rules:

- safe exits like `Cancel` remain quiet
- apply/confirm actions become primary only when the user has enough information
- blocked destructive or state-resetting actions must explain why they are blocked

### Loading And Saving Feedback

Feedback should be explicit and local to the action.

Rules:

- label the exact action in progress where possible
- preserve existing content structure during save states when practical
- use skeletons for page-entry loading, not for every small interaction

### Empty-State Behavior

Empty states should describe truth, show the next step, and stop.

Rules:

- avoid apology-heavy copy
- avoid implementation or migration jargon
- preserve calm tone even when data is missing or a feature is intentionally deferred

## Product Mapping

### Login

Current fit:

- already aligned with the calmer direction
- strong split layout
- restrained brand expression
- good use of tabs and form hierarchy

Design-system application:

- keep as premium low-chrome auth baseline
- normalize input, button, tab, and validation rules here first

### Text-First Onboarding

Current fit:

- close to canonical direction
- strong big-text authoring prompt
- advanced import appropriately secondary

Design-system application:

- preserve one strong surface
- reduce any extra internal framing if it starts to feel nested
- treat authoring text area as the canonical long-form input pattern

### Advanced Import

Current fit:

- appropriate utility dialog model
- validation and apply flow is honest

Design-system application:

- keep it compact and operational
- standardize dialog, status, validation, and summary patterns
- avoid making import feel more “featured” than core onboarding

### Home / Calendar

Current fit:

- strongest current DS baseline
- main Today card works
- grouped right-side support card is the right direction
- calendar remains a functional planning surface

Design-system application:

- this should define the default product tone
- keep the card count low
- standardize hero, grouped support, metric rows, and completed-day semantics

### Workout Detail

Current fit:

- strongest interaction-rich surface
- grouped right-side panel works better than separated support cards
- rest-day simplification is aligned with the design direction

Design-system application:

- use this surface to define tabs, sidebar grouping, metric blocks, interval visualization, and result-state behavior

### Progress

Current fit:

- valuable but visually older
- still contains explanatory and card-heavy preserved-shell behavior

Design-system application:

- normalize later
- reduce dashboard density
- preserve the product truth without forcing full parity with home/workout polish immediately

### Body

Current fit:

- clearly secondary
- more placeholder-like and card-boxed than the primary flow

Design-system application:

- keep functional and honest
- normalize only enough to remove visual mismatch and excessive chrome

### Integrations

Current fit:

- explicitly not a primary active capability
- explanatory placeholder surface

Design-system application:

- keep minimal
- standardize empty/deferred-state patterns
- avoid over-polishing a deferred product area

## Anti-Patterns To Remove

- unnecessary card containers around already related content
- nested chrome inside framed surfaces
- migration-era explanatory clutter that teaches internal context instead of runner value
- technical or internal copy leakage
- inconsistent metric layouts between routes
- decorative color without semantic purpose
- repeated bordered mini-panels in sidebars
- placeholder sections that look more “real” than the feature actually is
- over-wide spacing that weakens scanability in support panels

## Do Not Normalize Yet

- Deep progress analytics language or chart framework beyond basic visual cleanup
- speculative AI insight modules beyond explicit placeholders
- decorative weather treatment
- complex body/injury mapping patterns not central to the current flow
- integration-brand treatments for providers that are still deferred
- a giant component catalog for surfaces the product does not actually use yet

## Rollout Phases

### Phase 1: Primitive Alignment On Primary Flow

Goal:

- establish the first real Hito design-system slice where the user spends core time

Target surfaces:

- `/login`
- onboarding in `/`
- advanced import dialog
- home/calendar main hero and grouped support surface
- workout detail header, tab bar, grouped right panel, state patterns

Risk:

- low-to-medium because these surfaces are already closest to the desired direction

Rollback posture:

- route-level visual rollback is straightforward because product logic stays unchanged

Next likely role:

- FRONTEND

### Phase 2: Shared Component Normalization

Goal:

- collapse repeated route-level patterns into stable DS primitives after the visual rules are proven

Target surfaces:

- buttons
- inputs
- tabs
- grouped surface container
- status pills
- metric rows
- empty/loading/error panels

Risk:

- medium because shared primitives can unintentionally affect multiple routes

Rollback posture:

- normalize incrementally by primitive family, not through one broad sweep

Next likely role:

- FRONTEND

### Phase 3: Secondary Surface Reduction

Goal:

- bring `/progress`, `/body`, and `/integrations` into the calmer system without pretending they are equally mature

Target surfaces:

- secondary routes only

Risk:

- medium because these pages still carry preserved-shell responsibilities and explanatory content

Rollback posture:

- prefer selective card removal and copy reduction over full layout rewrites

Next likely role:

- FRONTEND

### Phase 4: Design QA Hardening

Goal:

- turn the system into a repeatable review standard rather than one-off cleanup

Target surfaces:

- full primary flow plus preserved secondary routes

Risk:

- low if earlier phases stay incremental

Rollback posture:

- QA findings should map to primitives and rules, not trigger a new visual redesign

Next likely role:

- QA

## Smallest Viable First Implementation Slice

The smallest viable slice is:

- normalize the shared visual language across `/login`, text-first onboarding, the home Today hero plus grouped right-side support card, and the workout detail grouped sidebar/tabs/status patterns

Why this slice first:

- it covers the core first-run and repeat-run flow
- it includes the strongest existing surfaces
- it establishes typography, spacing, grouped-surface behavior, buttons, tabs, forms, and semantic statuses without touching lower-value routes first

## QA Implications

Future visual QA should check:

- one clear primary CTA per surface
- no reintroduced nested card stacks on primary routes
- consistent metric composition and label order
- calm rest-day presentation with intentional sparsity
- consistent tab, input, and button behavior across auth, onboarding, import, and workout flows
- grouped support panels using dividers instead of repeated bordered sub-cards
- completed, current, rest, and future calendar states remaining distinguishable without overload
- placeholder copy staying honest on deferred or future-facing surfaces
- preserved secondary routes looking aligned, even if less polished than home and workout detail

QA should treat the current hero/header cleanup as the accepted baseline.

## Risks

- Secondary preserved pages may lag visually if Phase 1 improvements are overfitted to the core flow.
- Shared primitive extraction too early could create accidental regressions across routes.
- The product may drift back toward card-heavy layouts if grouped-surface rules are not enforced during implementation review.
- Future AI or import work could reintroduce promise-heavy copy unless placeholder rules remain explicit.

## Checklist

- [x] Confirm this spec as the canonical DS and rollout reference
- [x] Implement first Phase 1 foundation slice:
      shared low-card surface, field, button, tab, label, and divider primitives; auth/onboarding/import/shell application; and internal `/hitoDS` living reference page
- [x] Implement first component-system refinement slice:
      tiered button variants, tiered field/textarea sizing, helper/error/success text, grouped rows, metric rows, compact status pills, and `/hitoDS` examples using the real primitives
- [x] Complete remaining Phase 1 primitive alignment on home/workout primary flow after the foundation slice is QA-reviewed:
      home support panels, calendar controls/status, workout-detail tabs, hero metrics, right-side grouped support, and result status now use shared primitives where they fit
- [x] Correct the home/calendar Phase 1 application after visual QA:
      the Today hero and calendar grid now avoid oversized card framing, the right-side support module uses light divided rows, today is primarily outline-driven, and week/day status uses compact check/dash/cross markers instead of bulky per-day pills
- [x] Correct the remaining Safari-visible home/calendar DS issues:
      prose pace guidance now sits outside the value-first metric row, and week cards no longer duplicate status markers in the narrow distance/duration footer
- [x] Normalize secondary preserved surfaces selectively:
      `/progress`, `/body`, and `/integrations` now use shared Hito surfaces, grouped rows, controls, fields, and compact status treatment where they fit, while workout-detail preview support uses the same surface/status primitives without changing the hero direction
- [x] Add mirrored workout navigation cards to the shared component language:
      workout-detail previous/next links now use one darker low-chrome `hito-nav-card` pattern with mirrored arrow, label, date, and title alignment, and `/hitoDS` demonstrates the pattern
- [x] Normalize typography hierarchy and spacing rhythm across runner-facing surfaces:
      shared page-title, page-copy, section-header, section-subtitle, support-copy, caption, and route-stack primitives now reduce local type and spacing drift across home/calendar, workout detail, progress, body, integrations, and `/hitoDS`
- [x] Split `/hitoDS` from runner-facing shell chrome:
      the internal reference page now has dedicated design-system navigation and component playground examples for buttons, inputs, surfaces, list items, and dropdown-style rows instead of Calendar/Progress navigation and Today/Week/Open Plan controls
- [x] Normalize deeper micro-primitives in workout support components:
      `IntervalsViz` structure labels, block rows, tooltip text, and `CompletionPanel` save feedback, skipped/rest notes, actual metric inputs, interval count support, notes field, and upload-result placeholder now reuse shared labels, captions, fields, buttons, flat surfaces, and grouped rows instead of component-local micro styles
- [x] Normalize shared status and state families:
      compact check/dash/cross status expression now uses one `hito-status-marker` family, route-level setup/empty/error surfaces now use one `hito-state-surface` family, and `/hitoDS` demonstrates both patterns as live primitives
- [x] Normalize progress analytics primitives:
      `/progress` large summary stats now use one `hito-analytics-stat` family, chart legends now use one `hito-legend` family, and `/hitoDS` demonstrates both as live low-card analytics primitives without changing progress data behavior
- [x] Normalize body severity micro-UI:
      `/body` severity selectors now use one `hito-scale-control` and `hito-scale-button` family, active-log summaries use one `hito-severity-bars` family, and `/hitoDS` demonstrates the live severity pattern while leaving body-map geometry route-specific
- [ ] Review shared primitives after Phase 1 visual behavior is proven
- [ ] Add DS-aligned visual QA checks to the ongoing QA pass

## Exit Criteria

- Primary flow surfaces share one consistent visual language
- Design decisions for typography, spacing, surface grouping, and status semantics are no longer route-specific guesses
- Frontend can implement the first DS slice without inventing new local rules
- QA can evaluate visual regressions against explicit DS rules instead of taste alone

## Next Recommended Role

FRONTEND

## Suggested Next Step

Review the shared primitives after the primary and secondary rollout slices are visually proven, then add DS-aligned visual QA checks without expanding the product scope.

## 🔁 HANDOFF BLOCK (MANDATORY)

```md
## Handoff Context

### Summary

Created the canonical Hito design-system specification and rollout plan for the current implemented product, grounded in the live primary flow and preserved secondary surfaces.

### Key Decisions

- The design-system direction is calm, editorial, athletic, premium, and low-chrome rather than dashboard-heavy or AI-forward.
- The first implementation slice should cover login, onboarding, home, and workout detail before secondary preserved surfaces are normalized.

### Current State

- The product already has a strong calmer baseline on auth, home, and workout detail surfaces.
- Secondary surfaces like progress, body, and integrations still carry more legacy card density and explanatory clutter.

### Constraints

- Do not change product logic while implementing this design-system pass.
- Do not expand scope into speculative AI, analytics, or integration experiences during Phase 1.

### Risks / Open Questions

- Shared primitive extraction too early could create regressions if done before Phase 1 visual patterns are validated.
- Secondary surfaces may need selective exceptions until their product roles are further tightened.

### Next Recommended Role

FRONTEND

### Suggested Next Step

Implement the smallest viable first slice across login, onboarding, home, and workout detail using this spec as the canonical visual reference, then run targeted visual QA before broader rollout.
```

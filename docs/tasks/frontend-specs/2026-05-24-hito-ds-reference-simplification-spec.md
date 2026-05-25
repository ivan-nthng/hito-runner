# Hito DS Reference Simplification Spec

## Status

Paused / Complete after Data table

## Owner

Design System Designer

## Last Updated

2026-05-24

## Closeout Note

This `/hitoDS` workbench simplification wave is paused after the Data table conversion because the
main usability goal has been met.

Completed work:

- grouped IA: Overview / Foundations / Components / Patterns / Backlog
- sidebar active state and scrollspy preserved
- standardized specimens for Buttons, Inputs, Tabs, Status, Selection controls, Modals / Window
  anatomy, and Data table controls
- Backlog exists and documents known gaps and exceptions

No immediate frontend implementation slice is recommended. Remaining work is backlog or polish, not
a blocker.

Future `/hitoDS` work should be triggered by concrete DS-consumer pain, a QA finding, or real product
drift.

## Task

Simplify `/hitoDS` so it becomes easier to navigate, easier to understand, and more useful as a live design-system workbench instead of a long internal catalog.

## Stage

DESIGNER implementation spec

## Context

Hito already has a stronger design-system contract than before:

- foundations are documented
- editorial patterns are now represented
- gradients and overlays are named
- buttons already have an interactive builder

Primary reference:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:33)

The problem is not lack of DS content.

The problem is reference usability.

The page is still too long, too equal-weighted, and too difficult to scan as a working tool for Frontend, Designer, and QA.

## Problem Definition

`/hitoDS` is currently useful, but it still behaves more like a large reference document than a tight internal component explorer.

Main problems:

- navigation is too long and too flat
- too many sections compete for attention
- core primitives and secondary patterns feel equally important
- some sections still read like documentation blocks instead of interactive inspection tools
- the “one component + knobs on the right” model exists, but not consistently enough
- the page is better than before, but still too heavy for repeated day-to-day use

## Goal

Turn `/hitoDS` into a clearer internal tool with:

- smaller top-level navigation
- stronger hierarchy between foundations, components, patterns, and backlog
- a consistent “preview + controls + rules” format for core primitives
- faster scanning for engineers and QA
- better linkage between DS examples and real product surfaces

This is not a product redesign.
This is not a new component library.
This is not a second documentation site.

It is a simplification pass on the existing `/hitoDS` route.

## Canonical Constraints

- preserve Hito’s calm, editorial, athletic, premium, low-chrome direction
- preserve current product behavior
- prefer deletion over adding more reference chrome
- keep `/hitoDS` aligned with live product truth
- do not expand the system just to make the docs look more complete
- avoid introducing a docs framework inside the route

## Current State Audit

### What Already Works

The current `/hitoDS` already has several strong parts:

- sticky sidebar navigation
- foundations sections for raw colors, semantic tokens, spacing, and typography
- explicit editorial and gradient sections
- existing interactive builder for buttons
- explicit DS sections for tabs, tables, wrappers, dialogs, states, shell, and dropdowns

References:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:362)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:469)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:688)

### What Feels Too Heavy

The current section list is too broad and too equal-weighted:

- `Overview`
- `Brand`
- `Editorial`
- `Gradients`
- `Foundations`
- `Typography`
- `Icons`
- `Buttons`
- `Tabs`
- `Tables`
- `Wrappers`
- `Inputs`
- `Selection`
- `Composition`
- `Modals`
- `Async toasts`
- `States`
- `Summary truth`
- `Rows & disclosure`
- `Shell nav`
- `Dropdowns`

Reference:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:33)

This is too much for a first-pass mental model.

## Core Recommendation

Rebuild `/hitoDS` around five top-level groups:

1. `Overview`
2. `Foundations`
3. `Components`
4. `Patterns`
5. `Backlog`

These groups should become the primary navigation and reading model.

All current sections should be remapped under them.

## Proposed Information Architecture

## 1. Overview

Purpose:

- explain what Hito DS is
- explain what it is not
- set the product direction
- define the rules of use

Keep only:

- page intro
- 5 to 7 system principles
- “how to use this page”
- one short “current status” summary

Add:

- `Core / Pattern / Exception / Legacy / In rollout` markers
- one short “How to inspect a component” note

Do not keep:

- long explanatory prose
- secondary examples
- repetitive implementation guidance

## 2. Foundations

Move here:

- brand
- raw color primitives
- semantic color mapping
- gradient and overlay rules
- spacing primitives
- typography families
- icon sizing rules
- radius and border rules if not already visible enough

This section should teach the chain:

`primitive -> semantic -> component -> product usage`

Recommended sub-order:

1. Brand
2. Color primitives
3. Semantic tokens
4. Typography
5. Spacing
6. Radius and hairline
7. Overlay and gradient rules
8. Icons

## 3. Components

Move here:

- buttons
- inputs
- selects
- tabs
- status pills
- status markers
- selection controls
- menus / dropdowns
- dialogs
- wrappers

This is the most important section to convert into interactive explorers.

## 4. Patterns

Move here:

- editorial timeline
- surfaces and composition
- state surfaces
- table toolbar and table header behaviors
- analytics summary
- shell navigation
- rows and disclosure
- async toasts

These are not single primitives.
They are multi-part compositions built from DS primitives.

## 5. Backlog

Purpose:

- list known gaps
- show rollout status
- expose what is intentionally still local

This should include:

- current DS rollout gaps
- legacy wrappers still awaiting cleanup
- documented visualization exceptions
- “not in DS yet” items

This section keeps the page honest and reduces ambiguity.

## Section Remapping

Recommended remap from current structure:

- `Brand` -> `Foundations`
- `Editorial` -> `Patterns`
- `Gradients` -> `Foundations`
- `Typography` -> `Foundations`
- `Buttons` -> `Components`
- `Tabs` -> `Components`
- `Tables` -> `Patterns`
- `Wrappers` -> `Components`
- `Inputs` -> `Components`
- `Selection` -> `Components`
- `Composition` -> `Patterns`
- `Modals` -> `Components`
- `Async toasts` -> `Patterns`
- `States` -> `Patterns`
- `Summary truth` -> `Patterns`
- `Rows & disclosure` -> `Patterns`
- `Shell nav` -> `Patterns`
- `Dropdowns` -> `Components`

## New Page Model

Each major item inside `Components` and `Patterns` should use one standard layout:

1. Title and role
2. Live preview on the left
3. Controls on the right
4. Contract block below
5. Real product usage links

This becomes the canonical DS specimen layout.

## Standard Specimen Anatomy

Every component specimen should use this anatomy:

### A. Header

- component name
- short one-line purpose
- status marker:
  - `Core`
  - `Pattern`
  - `Legacy`
  - `In rollout`

### B. Demo Area

Left side:

- one canonical preview
- optionally one secondary comparison preview

Right side:

- controls / toggles / radios / selects

### C. Contract Block

Use exactly these rows:

- `Use for`
- `Do not use for`
- `Variants`
- `States`
- `Used in`

Optional:

- `Notes`

### D. Reference Links

Show real product surfaces where the primitive or pattern exists.

Examples:

- `/login`
- `/settings`
- `/workout/$date`
- `/progress`
- `/changelog`
- `/admin/analytics`

## Component Explorer Model

## Why

The user’s preferred model is correct:

- one canonical component
- one set of controls beside it
- inspect allowed permutations without reading long prose

The page should behave more like a small internal Storybook, but still remain Hito-native and route-based.

## Components That Must Use This Model First

Priority group:

- button
- input / textarea
- select
- tabs
- status pill
- selection controls
- dialog
- dropdown/menu row

Secondary group:

- data table header shell
- toast
- shell row
- timeline entry

## Required Controls By Component

## Button

Controls:

- variant
- tone
- size
- left icon on/off
- right icon on/off
- disabled on/off
- loading on/off
- full-width on/off only if this is a real supported mode

Required states shown:

- default
- hover
- focus-visible
- disabled
- loading

## Input / Textarea

Controls:

- field kind
- size
- variant
- left icon on/off
- right icon on/off
- help text on/off
- error state
- success state
- disabled
- readonly

Required states shown:

- default
- focus-visible
- invalid
- success
- disabled
- readonly

## Select

Controls:

- trigger size
- placeholder vs selected value
- disabled
- menu open / closed
- long option text on/off

Required states shown:

- trigger resting state
- trigger focus-visible
- menu item hover
- selected item
- disabled trigger

## Tabs

Controls:

- visual style: simple / enclosed
- with icon on/off
- with badge on/off
- with dot on/off
- disabled tab on/off

Required states shown:

- active
- inactive
- hover
- focus-visible
- disabled

## Status Pill

Controls:

- tone
- icon on/off
- short vs long label

Required states shown:

- neutral
- signal
- success
- warning
- destructive

## Dialog

Controls:

- content mode: short / scroll-fill
- header meta on/off
- footer alignment
- destructive vs neutral scenario
- status pill on/off

Required states shown:

- open
- overflow content
- keyboard focus target visibility

## Dropdown / Menu

Controls:

- row count
- with meta
- with destructive row
- with separator
- with icon on/off

Required states shown:

- resting
- hovered row
- focused row
- destructive row

## Pattern Explorer Model

Patterns should use the same structure, but with fewer controls.

Patterns are not configuration-heavy components.

Priority patterns:

- editorial timeline
- shell nav
- state surface
- analytics summary
- data table toolbar
- rows and disclosure
- async toast lifecycle

Recommended controls:

- tone
- density
- presence/absence of secondary metadata
- current state marker

Do not turn patterns into giant parameter matrices.

## Navigation Simplification

## Current Problem

The left rail currently behaves like a long flat inventory.

That makes it difficult to answer simple questions like:

- “where are core components?”
- “where are pattern-level examples?”
- “what is new?”
- “what is still not canonical?”

## Recommended Navigation Model

### Level 1

Five group anchors only:

- Overview
- Foundations
- Components
- Patterns
- Backlog

### Level 2

Only show child links for the currently active top-level group.

That means the sidebar becomes shorter and easier to scan.

### Optional Enhancements

If lightweight enough:

- `Show core only`
- `Show interactive only`
- `Show rollout gaps`

Do not build a large filtering system unless it stays tiny.

## Visual Hierarchy Simplification

## Main Rule

Reduce the number of surfaces that compete for attention.

### Keep visually strong:

- current active specimen
- live preview
- control panel
- contract block

### Keep visually quiet:

- explanatory copy
- section framing
- sidebar labels
- implementation notes

### Delete or reduce:

- repeated intro blocks
- unnecessary framed notes
- any card whose border is not part of a real DS contract

## Documentation Style Rules

### Replace long prose with compact contract rows

Every core component should answer these five questions quickly:

- what is it for
- what is it not for
- what are its allowed variants
- what states matter
- where is it already used

### Use short labels for section metadata

Recommended metadata tags:

- `Core`
- `Pattern`
- `Exception`
- `Legacy`
- `In rollout`

### Add “Not in DS” guidance

This should appear in `Backlog` or `Overview`.

Examples:

- chart geometry remains local
- timeline grid layout remains local
- certain visualization coordinates remain local
- compatibility wrappers remain temporary

This reduces false expectations.

## Recommended Content Reductions

These are good candidates for reduction or consolidation:

- repetitive explanatory copy across adjacent sections
- separate sections whose content can live inside a broader group
- duplicated notes about “calm / low chrome / not a card system”
- too many standalone rows that do not change how someone implements

## Required New Content

## 1. “How to use Hito DS”

A compact block near the top:

- start with Foundations if you need tokens
- start with Components if you need a primitive
- start with Patterns if you need a composed surface
- check Backlog if something still looks local

## 2. “Used in” product links

Every major component or pattern specimen should show real usages.

## 3. “Status / rollout” visibility

Each important family should show whether it is:

- fully live
- in rollout
- partially legacy

## 4. “Next cleanup candidates”

This can live in `Backlog`.

It helps the page act as an architecture tool, not just a gallery.

## Implementation Plan

## Slice 1. Navigation And IA Restructure

Goal:

Reduce the top-level navigation from a long flat list to five clear groups.

Scope:

- `src/routes/hitoDS.tsx`

Changes:

- introduce grouped section model
- collapse sidebar into top-level groups plus current child list
- reorder sections into the new IA
- keep current content mostly intact for this slice

Success condition:

- easier first scan
- no content loss
- no visual redesign yet

## Slice 2. Standardize Specimen Layout

Goal:

Give all core component sections one consistent internal format.

Scope:

- `src/routes/hitoDS.tsx`
- any minimal DS helper classes in `src/styles.css` only if really needed for the layout

Changes:

- add a shared specimen layout pattern
- convert component sections to:
  - preview
  - controls
  - contract block
  - used in

Success condition:

- button becomes the reference model
- at least inputs, tabs, and status are converted

## Slice 3. Expand Interactive Coverage

Goal:

Bring more core primitives into the interactive inspector model.

Scope:

- `src/routes/hitoDS.tsx`

Priority:

- select
- dialog
- dropdown/menu
- selection controls

Success condition:

- engineers can inspect supported configurations without scrolling through static duplicates

## Slice 4. Simplify Patterns And Backlog

Goal:

Separate pattern examples from primitive components and expose known gaps clearly.

Scope:

- `src/routes/hitoDS.tsx`

Changes:

- move pattern families into `Patterns`
- add `Backlog`
- explicitly list exceptions and local patterns

Success condition:

- `/hitoDS` becomes both a design reference and rollout tracker

## Slice 5. Content Pruning

Goal:

Reduce unnecessary copy and frame noise after the new structure lands.

Scope:

- `src/routes/hitoDS.tsx`

Changes:

- remove duplicated notes
- compress intros
- reduce unnecessary cards
- keep only the explanations that change implementation decisions

Success condition:

- the page is shorter, calmer, and easier to use repeatedly

## Frontend Requirements

- preserve all existing real DS examples unless they are being consolidated intentionally
- do not change product-facing DS behavior while reorganizing the reference
- do not invent new DS primitives just to make the page more complete
- keep the page working on desktop and mobile
- keep anchor-based deep linking usable
- maintain current low-chrome direction

## QA Expectations

QA should verify in Safari:

- sidebar navigation and anchor jumps
- section grouping clarity
- sticky sidebar behavior
- interactive controls update previews correctly
- focus-visible states remain inspectable
- dialogs, dropdowns, and selects still open and render correctly inside `/hitoDS`
- mobile layout remains readable
- no specimen becomes visually louder than the real product

## Risks

- overbuilding controls and accidentally turning `/hitoDS` into a mini-app
- introducing too many filters and recreating the same complexity in a different shape
- preserving every old section verbatim and ending up with grouped clutter instead of true simplification
- mixing reference cleanup with actual DS behavior changes in one large pass

## What Not To Touch

- product route logic
- product copy outside `/hitoDS`
- DS token semantics unless a separate DS task requires it
- large product visual changes
- any second docs framework

## Exit Criteria

- `/hitoDS` has five clear top-level groups
- sidebar navigation is meaningfully shorter and easier to scan
- at least the core primitives use the standard `preview + controls + contract` pattern
- a `Backlog` or equivalent section clearly documents known gaps and exceptions
- the page feels simpler to navigate without reducing DS truth

## Next Recommended Role

None for implementation.

## Suggested Next Step

Pause the workbench conversion wave. Do not continue converting sections by inertia.

## Backlog Candidates

Reopen only with a concrete DS-consumer pain point, QA finding, or product drift:

- Shared wrappers refinement, only if a specific wrapper becomes hard to inspect.
- Foundations cleanup, only if readability becomes a real blocker.
- Patterns cleanup, only as separate bounded slices.
- Used-in links cleanup, only as opportunistic hygiene.
- Async toast specimen conversion, only if QA or Frontend needs deeper inspection.

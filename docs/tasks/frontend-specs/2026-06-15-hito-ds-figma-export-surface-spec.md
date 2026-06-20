# Hito DS Figma Export Surface Spec

## Status

completed

## Type

frontend_spec

## Priority

high

## Next Recommended Role

product

## Task

Build a code-owned Hito DS export surface that can be imported into Figma through html.to.design as
`.h2d`, `.html`, or `.zip`, with explicit component matrices for buttons, inputs, dropdowns,
menu/list items, status surfaces, and color foundations.

## Stage

DESIGN SYSTEM / implemented and QA-passed export surface

## Owner

Design System

## Last Updated

2026-06-15

## Closeout Status

This spec is no longer describing open implementation work.

Implemented and QA-passed:

- `/hitoDS#dropdowns` now acts as one canonical dropdown/list-item family
- XS-XL trigger tiers are visible
- button, list-item, and settings-style triggers are visible
- real interactive dropdown open state is present
- selected, destructive, disabled, submenu, and footer row anatomies are present
- checkbox/radio-like row anatomy is present
- matching expanded dropdown trigger/menu states are present on `/hitoDS/export/figma`

This remains a design-system/specimen/export-board track, not a runner-facing shipped product
feature.

## Changelog Decision

No changelog entry was added.

Reason:

- this slice is internal Hito DS specimen/export-surface coverage
- it improves design-system documentation and Figma capture readiness
- it does not represent a user-facing product release or runtime feature switch

## Why This Exists

The user wants a practical Hito DS-to-Figma bridge:

- a file or page that can be inserted into Figma
- complete button/input/dropdown/menu coverage
- all sizes
- all relevant states
- all tones/colors
- one consistent source that also remains aligned with Hito DS in code

The attached example file is a `.h2d` capture. That is not a general-purpose source format; it is
the import format used by html.to.design after webpage capture.

Current html.to.design behavior confirms:

- local `.h2d` files can be dragged into the Figma plugin or selected from the plugin file picker
- the plugin also supports `.html`, `.htm`, and `.zip` containing webpages
- `.h2d` is the recommended import format when using their browser extension

Sources:

- [html.to.design: Open an .h2d file](https://html.to.design/docs/open-h2d-file/)
- [html.to.design: Import local files](https://html.to.design/docs/file-tab/)
- [html.to.design: Import directly from your browser with the extension](https://html.to.design/docs/extension-tab/)

For Hito, the safest architecture is:

`Hito code + Hito DS reference -> dedicated export page -> html.to.design capture/import -> Figma`

Not:

- reverse-engineering `.h2d`
- hand-authoring `.h2d`
- building a parallel Figma-only DS source of truth

## Canonical Architecture Decision

Hito runtime code remains the source of truth.

The export surface is:

- a read-only DS artifact page
- purpose-built for Figma capture/import
- generated from the same live Hito DS classes and wrappers used in product

Figma import is downstream of code truth.

This means:

- no custom `.h2d` generator
- no new second design system
- no Figma-only token truth hidden outside Hito DS

## Export Workflow

## Primary workflow

1. Frontend builds the Hito export surface in the app.
2. User opens that route locally or in a safe environment.
3. User captures it using the html.to.design browser extension, or imports the exported `.html` /
   `.zip` through the html.to.design Figma plugin.
4. Figma receives editable imported layers.

## Acceptable file targets

- Preferred: `.h2d` via html.to.design extension
- Acceptable fallback: `.html`
- Acceptable fallback for asset safety: `.zip` containing HTML/CSS/assets

## Non-goals

- generating `.h2d` directly from repo code
- maintaining a binary artifact in git
- building a bidirectional sync in this slice

## Route And Ownership

Add one dedicated export route owned by Hito DS.

Recommended route:

- `/hitoDS/export/figma`

Optional future child routes only if the page becomes too heavy:

- `/hitoDS/export/figma/foundations`
- `/hitoDS/export/figma/buttons`
- `/hitoDS/export/figma/inputs`
- `/hitoDS/export/figma/menus`
- `/hitoDS/export/figma/status`

Default recommendation for this slice:

- start with one single page
- split only if html.to.design or browser performance becomes a real problem

## Export Surface Principles

The page must be optimized for design import, not for narrative documentation.

That means:

- explicit matrices, not interactive toggles only
- visible states rendered side by side
- deterministic layout
- no hover-only content as the only representation of a state
- minimal route chrome
- compact captions
- stable section spacing
- no lazy-hidden specimens behind accordions

The export page should feel closer to a specimen board than to a docs page.

## Sections Required

## 1. Foundations

Include:

- raw color primitives
- semantic color tokens
- spacing scale
- radius scale
- typography roles

Show as:

- labeled swatch grids
- token name
- semantic role
- one short usage note

Do not include:

- every compatibility alias from `@theme inline`
- raw implementation helper aliases that are only for Tailwind wiring

Canonical source:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1)

## 2. Buttons

Must include the full visible matrix for:

- variants:
  - `primary`
  - `secondary`
  - `outlined`
  - `ghost`
- sizes:
  - `xs`
  - `sm`
  - `md`
  - `lg`
  - `xl`
- tones:
  - `default`
  - `success`
  - `error`

Required rendered states:

- default
- hover
- focus
- active/pressed
- disabled
- loading
- with left icon
- with right icon
- icon-only only if truly canonical and already used

Important:

- states like hover/focus/active must be explicitly rendered as specimens
- do not rely on the user hovering during capture

Canonical sources:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:154)
- [src/components/hito-ds/specimen-previews.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/specimen-previews.tsx:1)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2985)

## 3. Inputs And Fields

Must include:

- field variants:
  - `primary`
  - `secondary`
- field sizes:
  - `xs`
  - `sm`
  - `md`
  - `lg`
  - `xl`
- text input
- textarea
- helper/error/success text
- left icon
- right icon
- placeholder
- readonly
- disabled

Required rendered states:

- default
- hover
- focus
- error
- success
- disabled
- readonly
- filled
- empty

Canonical sources:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:158)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1838)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:2425)

## 4. Selects / Dropdown Triggers

Must include trigger states for:

- default
- open
- hover
- focus
- disabled
- placeholder
- with selected value

Use the real shared wrappers:

- `SelectTrigger`
- `SelectContent`
- `SelectItem`
- Hito menu family classes

Canonical sources:

- [src/components/ui/select.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/select.tsx:1)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1086)

## 5. Dropdown / Menu Items

This section must use the normalized Hito dropdown family.

Required row anatomies:

1. simple label
2. left icon + label
3. left icon + label + description
4. left icon + label + trailing meta
5. left icon + label + description + trailing meta
6. selected item
7. destructive item
8. disabled item
9. submenu trigger

Trailing meta examples:

- shortcut text
- utility/status label
- compact count
- chevron/right affordance

Canonical sources:

- [src/components/ui/dropdown-menu.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dropdown-menu.tsx:1)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3552)
- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:694)

## 6. Status And Tags

Must include:

- `hito-status-pill` tones:
  - neutral
  - signal
  - success
  - warning
  - destructive
  - rollout
  - muted
- with icon
- without icon

Also include:

- metadata tag examples if they are part of the accepted DS family

Canonical sources:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:4634)
- [src/components/ui/metadata-tag.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/metadata-tag.tsx:1)

## 7. Optional But Useful

If Frontend can include them cheaply without expanding scope too much:

- tabs
- selection controls
- modal header/footer combinations

But this slice should not get stuck trying to export the entire product.

Buttons, inputs, dropdowns/menu items, and foundations are the required core.

## Layout Rules

The page should be built as one vertical export board with repeated section frames.

Recommended layout:

- max width around desktop capture width
- stable inner padding
- each section in one bounded specimen area
- matrices in grids, not carousels or accordions

Recommended capture width:

- desktop-first, around 1440-1600px canvas width

Why:

- the attached example filename suggests a desktop capture width pattern
- larger grids are easier to import cleanly into Figma as editable blocks

## State Rendering Rule

This is critical:

Hover, focus, pressed, open, selected, error, success, and disabled states must be rendered as
explicit static specimens.

Do not rely on:

- mouse hover during capture
- open dropdown being user-triggered at import time
- focus ring only through keyboard interaction in the live page

The export page should render state demos intentionally using the same demo-state patterns already
used in `/hitoDS`, or equivalent static proof.

## Capture Hygiene Rules

The export page should avoid:

- sticky product nav
- app shell sidebars
- noisy explanatory prose
- hidden sections
- async-only content
- browser-only hover reveal as the only state representation

The export page should include:

- one small top note saying it is an internal Hito DS export board
- section anchors only if they do not disturb import
- no private user data
- no backend-only admin data

## What Not To Include

- runner-specific real data
- admin tables
- fake product routes
- workout detail content
- large playgrounds unrelated to the requested export families
- tokens that are only compatibility aliases
- route-local experiments

## Frontend Implementation Guidance

Historical implementation guidance retained below as the canonical source-of-truth for what this
surface was required to include.

## Preferred approach

Reuse existing DS specimens and wrap them in one export route.

Do not rebuild every matrix from scratch if the current `/hitoDS` examples already prove the family.

Recommended implementation pattern:

1. Create one dedicated export route.
2. Reuse existing specimen components where possible.
3. Replace interactive-only knobs with rendered matrices where capture requires all states visible at once.
4. Keep the route mostly static and deterministic.

## Files Likely In Scope

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:1)
- new export route under `src/routes/`
- [src/components/hito-ds/specimen-previews.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/specimen-previews.tsx:1)
- possibly one new focused export component under `src/components/hito-ds/`
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1) only if a tiny export-only layout helper is truly needed

## Validation

- `git diff --check -- src/routes src/components src/styles.css docs/tasks/frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md`
- `npm exec eslint -- src/routes src/components`
- inspect the export route locally
- confirm all required states are visible without interaction
- confirm the page is clean enough to capture via html.to.design
- optionally dry-run capture:
  - open export route
  - use html.to.design extension to download `.h2d`
  - or save/import `.html` through the plugin file tab

## Acceptance Criteria

This slice is done when:

1. Hito has one export route intended for Figma/html.to.design capture.
2. Buttons are visible in all canonical sizes, variants, tones, and required states.
3. Inputs are visible in all canonical sizes, variants, and required states.
4. Select/dropdown triggers and menu/list items are visible in all required canonical forms.
5. Core foundations are visible as importable swatch/type boards.
6. No one needs to hand-build `.h2d`; the route can be captured/imported through html.to.design.

Closeout result:

- all six acceptance criteria are implemented
- dropdown-family expansion and matching export-board states are QA-passed

## Exact Handoff Prompt

```text
ROLE: PRODUCT

Task:
Preserve the closed state of the Hito DS dropdown family and Figma export surface unless a fresh implementation or QA regression appears.

Stage:
PRODUCT maintenance / closeout preservation

Context:
- This spec is implementation-complete and QA-passed.
- `/hitoDS#dropdowns` and `/hitoDS/export/figma` now contain the canonical dropdown family and matching export-board states.
- This item should no longer be routed as open frontend implementation work.

Scope:
- Keep this spec aligned with implemented truth.
- Reopen only if a new regression or new DS scope is intentionally added.

Validation:
- `git diff --check -- docs/tasks/frontend-specs/2026-06-15-hito-ds-figma-export-surface-spec.md`

Output:
Use the standard Architecture / Cleanup / Plan Report format from AGENTS.md.
Use the project role output format.
```

## Blockers

No hard blockers.

The only caution is scope:

- keep this as one export surface for the requested DS families, not a full “export the whole product to Figma” project.

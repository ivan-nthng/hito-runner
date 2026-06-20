# Hito Modal And Sheet Consistency Spec

## Status

Ready for Frontend implementation.

## Type

frontend_spec

## Priority

high

## Next Recommended Role

FRONTEND

## Task

Audit Hito modal and sheet behavior, then normalize one canonical overlay and window contract across `/hitoDS` and product surfaces.

## Stage

DESIGN SYSTEM audit / modal consistency specification

## Owner

Design System

## Last Updated

2026-06-13

## Related Sources

- [src/components/ui/dialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dialog.tsx:1)
- [src/components/ui/sheet.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/sheet.tsx:1)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:939)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3012)
- [src/components/hito-ds/specimen-previews.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/hito-ds/specimen-previews.tsx:150)
- [src/components/PlanManagementDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/PlanManagementDialog.tsx:742)
- [src/components/UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx:111)
- [src/components/workout-completion/BodyNotesEditor.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/workout-completion/BodyNotesEditor.tsx:133)
- [src/components/onboarding/StructuredPlanConstructor.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/StructuredPlanConstructor.tsx:591)
- [src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx:77)
- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:1246)
- [Radix Dialog docs](https://www.radix-ui.com/primitives/docs/components/dialog)

## Why This Exists

The user requirement is correct:

- when a modal opens, the background must become inactive/inert
- a dimmed or blurred overlay must appear
- the close control must restore the underlying screen
- Hito needs one calm modal family, not a set of route-local dialog recipes
- `/hitoDS` must document the real contract with header/footer/body combinations and viewport-safe scrolling

Hito already has the beginnings of this system, but the implementation is only partially normalized.

## Current Modal State

## 1. Wrapper-level foundation already exists

The shared wrappers are real and good:

- `DialogOverlay` and `SheetOverlay` use the same overlay family
- `DialogContent` and `SheetContent` already share elevated surface tone
- close button, title, description, and footer/header defaults already exist

References:

- [src/components/ui/dialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dialog.tsx:1)
- [src/components/ui/sheet.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/sheet.tsx:1)
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:939)

The current base overlay already uses a darkened blurred backdrop:

- `hito-ui-overlay`

Reference:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:939)

## 2. Product dialog anatomy also already exists

There is already a product-level dialog contract:

- `hito-product-dialog`
- `hito-product-dialog-header`
- `hito-product-dialog-body`
- `hito-product-dialog-body-scroll-fill`
- `hito-product-dialog-footer`

References:

- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:1171)
- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3012)

`/hitoDS` also already documents three useful dimensions:

- body mode: `content-fit` / `scroll-fill`
- header mode: `compact` / `large`
- footer mode: `none` / `actions` / `note-actions`

Reference:

- [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3012)

## 3. Product uses this contract inconsistently

Some product dialogs are already clean:

- [src/components/PlanManagementDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/PlanManagementDialog.tsx:742)
- [src/components/UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx:111)
- [src/components/workout-completion/BodyNotesEditor.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/workout-completion/BodyNotesEditor.tsx:133)

These already use:

- stable overlay class
- stable dialog class
- bounded height
- zero outer padding
- header/body/footer separation
- internal scroll-fill body

But other dialogs still drift:

- [src/components/onboarding/StructuredPlanConstructor.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/StructuredPlanConstructor.tsx:591)
- [src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx:77)
- [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:1246)

Visible drift patterns:

- `DialogContent` itself carries `overflow-y-auto`
- height logic is expressed route-locally instead of through one stable contract
- some dialogs use `hito-dialog-stable` / `hito-dialog-overlay-stable`, others do not
- some dialogs use `hito-product-dialog-overlay`, but that class is not defined in `src/styles.css`

## Root Cause

The design system normalized dialog chrome, but not the full product modal contract.

So today Hito has:

- one wrapper-level dialog primitive
- one emerging product-dialog anatomy
- several route-local height/overflow/overlay choices

This creates three kinds of inconsistency:

1. overlay consistency
2. body scrolling consistency
3. specimen/documentation consistency

## External Behavior Rule

Hito modal behavior should follow the actual modal semantics already expected by Radix Dialog:

- dialog overlays the page
- underlying content becomes inert while open
- focus remains trapped inside modal
- `Esc` closes by default
- close button restores the underlying view

Reference:

- Radix documents Dialog as content rendered over the page, with the content underneath inert, plus trapped focus and automatic `Esc` close behavior. See [Radix Dialog docs](https://www.radix-ui.com/primitives/docs/components/dialog).

This is the contract Hito should reinforce visually and structurally.

## Hito Canonical Window Contract

## 1. One overlay family

Use one canonical modal overlay:

- background dimmed
- subtle blur
- pointer-blocking over the rest of the screen
- same visual family for dialog and sheet

Canonical owner:

- `hito-ui-overlay`

For stable/no-animation cases, use one documented stable override:

- `hito-dialog-overlay-stable`

Do not keep a second undocumented overlay alias like `hito-product-dialog-overlay`.

Required cleanup:

- either define `hito-product-dialog-overlay` as an explicit alias to the stable overlay family
- or delete its usage and standardize all product dialogs on `hito-dialog-overlay-stable`

Smallest preferred fix:

- standardize on `hito-dialog-overlay-stable`

## 2. One product dialog family

Keep one canonical product modal family for bounded centered dialogs:

- `Dialog`
- `DialogContent`
- `hito-product-dialog`
- `hito-product-dialog-header`
- one body mode
- one footer mode

Product dialogs should not invent outer card chrome, second overlays, or route-local close patterns.

## 3. Sheet stays a sibling family, not a second modal language

Sheets remain valid, but they should follow the same overlay and surface language:

- same overlay family
- same title/description rhythm
- same close affordance family
- own layout semantics because they slide from an edge

The DS should explicitly say:

- use dialog for centered interruption/review/confirmation/import/replacement tasks
- use sheet for side-attached contextual tools only when a centered dialog would be less readable

## Modal Anatomy Modes

## Header modes

Canonical modes:

1. `compact`
   - title
   - optional short description
   - close button

2. `large`
   - micro-label or status pill
   - title
   - fuller description or review framing
   - close button

Hito already documents these; Frontend should normalize their real product usage.

## Footer modes

Canonical modes:

1. `none`
   - read-only or fully self-contained content

2. `actions`
   - primary + secondary actions

3. `note-actions`
   - support copy or constraints on one side
   - actions on the other

Rules:

- footer should stay reachable
- destructive meaning belongs in copy and button tone, not in louder chrome
- footer controls should not float inside scrolling content when the task requires persistent actions

## Body modes

Canonical modes:

1. `content-fit`
   - short content
   - natural height
   - no forced empty area

2. `scroll-fill`
   - tall content
   - bounded viewport height
   - internal body scroll
   - footer remains visible

This is already the right Hito decision and should be made universal.

## Scroll And Viewport Rules

Hito must support both cases safely:

### Short dialogs

- content fits inside viewport
- no unnecessary internal scroll
- window remains centered and compact

### Tall dialogs

- content area scrolls internally
- header and footer remain accessible
- dialog height is bounded to viewport
- page itself should not become a second scrolling layer behind the modal

Preferred contract:

- height cap belongs on the dialog window
- scrolling belongs on the body region
- do not put `overflow-y-auto` on `DialogContent` unless that dialog truly chooses the overlay-scroll pattern intentionally

Default Hito recommendation:

- centered product dialogs should prefer `scroll-fill` body over full-content scrolling on `DialogContent`

## Close And Disabled-Screen Rules

Required behavior:

- opening dialog blocks normal page interaction
- clicking close button restores page access
- overlay visually signals disabled background
- focus returns predictably after close

DS documentation must explicitly show:

- overlay on
- close button
- background inert intent

## Findings

## Canonical

- wrapper overlay/surface/title/description contract exists
- product dialog anatomy exists
- `/hitoDS` already has a modal playground concept

## Drift

- mixed overlay class names
- undefined `hito-product-dialog-overlay` usage
- route-local `max-h` + `overflow-y-auto` on `DialogContent`
- some dialogs use stable no-animation classes, some do not
- `/hitoDS` does not yet clearly prove the real overlay/inert/bounded-scroll contract with enough explicit combinations

## Exact Product Surfaces To Normalize First

Highest-value first:

1. [src/components/onboarding/StructuredPlanConstructor.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/StructuredPlanConstructor.tsx:591)
2. [src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx:77)
3. [src/components/manual-workout/ManualWorkoutAuthoringControls.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:1246)
4. `/hitoDS` modal specimens in [src/routes/hitoDS.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/routes/hitoDS.tsx:3012)

These show the largest consistency gaps without requiring a product redesign.

## Exact DS Corrections

## 1. Normalize overlay class ownership

Frontend should choose one product overlay override name and use it everywhere.

Preferred result:

- `hito-dialog-overlay-stable` is the single stable product override
- remove `hito-product-dialog-overlay` usage

## 2. Normalize stable dialog window usage

For product dialogs that intentionally avoid motion drift:

- `DialogContent` should consistently use the stable class choice
- product dialogs should reuse the same window shell recipe

Preferred result:

- `hito-dialog-stable hito-product-dialog ... p-0`

## 3. Move scrolling into body mode, not random outer overflow

Dialogs that are tall should use:

- bounded dialog height
- `hito-product-dialog-body-scroll-fill`

Avoid:

- `overflow-y-auto` directly on `DialogContent` as the default pattern

## 4. Clarify size tiers

Do not create a huge size matrix.

Recommended bounded dialog width tiers:

- `sm` / `max-w-lg`
- `md` / `max-w-xl`
- `lg` / `max-w-2xl`
- `xl` / `max-w-3xl`
- `review` / `max-w-5xl` only for genuinely broad review content

The DS should document these as usage guidance, not as a new variant factory.

## 5. Improve `/hitoDS` modal explorer

The DS explorer should explicitly prove:

- overlay behavior visually
- compact header
- large header
- no footer
- action footer
- note-actions footer
- content-fit
- scroll-fill

It should also explicitly state:

- background becomes inactive while dialog is open
- dialog content owns the interaction
- internal body scroll is the preferred tall-content pattern

## What Not To Do

- do not build a modal framework
- do not redesign every dialog layout at once
- do not change backend behavior or mutation boundaries
- do not merge dialogs and sheets into one configurable mega-component
- do not add many width variants beyond the bounded proven set
- do not put every local content block into the DS if it is just dialog body content

## Frontend Implementation Order

### Slice 1

DS and primitive normalization:

- normalize overlay alias usage
- tighten `/hitoDS` modal explorer and modal guidance

### Slice 2

Product modal cleanup:

- onboarding review dialogs
- selected plan preview dialog
- manual workout dialogs with route-local overflow drift

### Slice 3

Sheet confirmation:

- confirm sheet stays aligned visually with overlay/surface/close contract
- update `/hitoDS` if sheet guidance needs a clearer bounded note

## Validation

- `git diff --check -- src/components/ui/dialog.tsx src/components/ui/sheet.tsx src/routes/hitoDS.tsx src/components/hito-ds/specimen-previews.tsx src/components/onboarding/StructuredPlanConstructor.tsx src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx src/components/manual-workout/ManualWorkoutAuthoringControls.tsx src/styles.css`
- `npm exec eslint -- src/components/ui/dialog.tsx src/components/ui/sheet.tsx src/routes/hitoDS.tsx src/components/hito-ds/specimen-previews.tsx src/components/onboarding/StructuredPlanConstructor.tsx src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- inspect `/hitoDS#modals`
- verify at least one short content-fit dialog and one tall scroll-fill dialog
- verify close button restores interaction to the page
- verify background is visibly dimmed/blurred and non-interactive while open
- Safari QA required after implementation

## Exact Handoff Prompt

```text
ROLE: FRONTEND

Task:
Normalize Hito modal and sheet behavior so `/hitoDS` and product surfaces use one consistent overlay and bounded window contract.

Stage:
FRONTEND implementation / modal consistency

Context:
- Source path: docs/tasks/frontend-specs/2026-06-13-modal-and-sheet-consistency-spec.md
- Hito already has dialog/sheet wrapper primitives and a product-dialog anatomy, but several product dialogs still drift in overlay naming, body scroll ownership, and height treatment.

Root cause and architecture fit:
- The visible symptom is inconsistent modals and unclear DS modal guidance.
- The deeper cause is partial normalization: wrapper chrome exists, but the full product modal contract is not applied consistently.
- Reuse the existing `Dialog`, `Sheet`, `hito-ui-overlay`, `hito-product-dialog`, header/footer/body classes, and `/hitoDS` modal explorer before adding anything new.
- Do not build a new modal framework or generic variant factory.
- Fix the canonical owner first: overlay naming, body scroll ownership, stable dialog shell usage, and DS documentation.

Required reading:
1. AGENTS.md
2. skills/hito-frontend-design-system/SKILL.md
3. docs/context.md
4. docs/glossary.md
5. docs/current-product.md
6. docs/current-system.md
7. docs/current-state.md
8. docs/tasks/frontend-specs/2026-06-13-modal-and-sheet-consistency-spec.md
9. src/components/ui/dialog.tsx
10. src/components/ui/sheet.tsx
11. src/styles.css
12. src/routes/hitoDS.tsx
13. src/components/hito-ds/specimen-previews.tsx
14. src/components/PlanManagementDialog.tsx
15. src/components/UploadJsonDialog.tsx
16. src/components/workout-completion/BodyNotesEditor.tsx
17. src/components/onboarding/StructuredPlanConstructor.tsx
18. src/components/onboarding/SelectedTenKPlanPreviewDialog.tsx
19. src/components/manual-workout/ManualWorkoutAuthoringControls.tsx

Scope:
- dialog/sheet wrapper normalization only where needed
- `/hitoDS#modals`
- onboarding/manual-workout dialogs with current overflow/overlay drift

Requirements:
- one canonical overlay family
- one consistent centered product dialog shell
- internal body scroll for tall dialogs
- compact and large header modes
- footer modes: none, actions, note-actions
- preserve real product behavior
- preserve close, escape, focus trap, and bounded mutation flows
- keep sheets aligned visually but separate semantically

Validation:
- run the spec commands
- inspect `/hitoDS#modals`
- inspect affected product dialogs
- confirm background is visibly blocked/inactive while modals are open
- hand off to Safari QA

Output:
Use the project role output format.
```

## Blockers

No hard blockers.

Main caution:

- do not broaden this into a full dialog-content redesign wave. The slice is about contract consistency first.

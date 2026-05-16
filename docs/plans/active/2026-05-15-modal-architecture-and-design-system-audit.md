# Modal Architecture And Design-System Audit

## Status

Frontend consolidation slice implemented

## Owner

Architect

## Last Updated

2026-05-15

## Context

Hito now has several meaningful dialog surfaces that have been touched by:

- plan-management expansion
- advanced import simplification
- Safari stabilization fixes
- body-note modal migration
- app-wide simplification and Hito DS normalization

That makes this a good time to ask whether modals still behave like one system, or whether recent bug fixes have created a family of near-equivalent local exceptions.

This audit is about the **current implemented product**, not an abstract modal library exercise.

## Modal Inventory

### Primary product dialogs

#### 1. `Open plan`

File:
- [src/components/PlanManagementDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/PlanManagementDialog.tsx)

Role:
- top-level saved-mode plan lifecycle surface
- active plan summary
- text-first replacement
- advanced JSON import
- clear upcoming schedule
- delete plan
- export entry

This is the heaviest and most important runner-facing dialog in the current product.

#### 2. `Import plan`

File:
- [src/components/UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx)

Role:
- advanced import surface
- no-plan onboarding and secondary saved-mode import support

This is a real product dialog, but clearly secondary to text-first creation and to `Open plan`.

#### 3. `Body notes`

File:
- [src/components/CompletionPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/CompletionPanel.tsx)

Role:
- workout-scoped modal inside `Log result`
- bounded workout body-note editing

This is a focused workflow modal rather than a lifecycle modal.

### Secondary shell dialog-family surfaces

#### 4. Mobile sidebar sheet

Files:
- [src/components/ui/sheet.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/sheet.tsx)
- [src/components/ui/sidebar.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/sidebar.tsx)

Role:
- shell navigation on mobile

This is a live overlay surface, but it belongs to the sidebar/sheet family, not to the runner workflow modal family.

### Present but not meaningful current product surfaces

#### 5. `alert-dialog`

File:
- [src/components/ui/alert-dialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/alert-dialog.tsx)

Current reality:
- present as UI scaffolding
- not part of meaningful current runner-facing flows

#### 6. `CommandDialog`

File:
- [src/components/ui/command.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/command.tsx)

Current reality:
- present as UI scaffolding
- not part of meaningful current runner-facing flows

## Shared Primitive Reality

### What is truly shared today

All three real product dialogs share the same Radix wrapper primitive:

- [src/components/ui/dialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dialog.tsx)

They also share the same conceptual product recipe:

- centered modal
- header / scrollable body / footer grid
- internal scroll rather than page scroll
- footer actions kept inside the modal viewport
- calm low-card Hito surface language
- quiet support copy
- destructive actions demoted behind disclosure when present

### What is only superficially shared

The core product dialogs are not actually sharing one fully canonical Hito modal component yet.

Instead, they share:

- Radix `Dialog`
- `DialogHeader`
- `DialogFooter`
- `DialogTitle`
- `DialogDescription`

But they repeat the most important product-level dialog recipe through copied class strings:

- `grid-rows-[auto,minmax(0,1fr),auto]`
- `overflow-hidden`
- `min-h-0`
- `px-6 py-5`
- `border-hairline bg-background/95 p-0 backdrop-blur-xl`
- internal `overflow-y-auto overscroll-contain`
- footer divider treatment

So the current system is:

- structurally shared
- visually converged
- but not fully canonicalized at the product-dialog level

### Where local one-off fixes exist

#### Safari-stable classes

Defined in:
- [src/styles.css](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/styles.css:264)

Used in:
- [src/components/PlanManagementDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/PlanManagementDialog.tsx:296)
- [src/components/CompletionPanel.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/CompletionPanel.tsx:1100)

Not used in:
- [src/components/UploadJsonDialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/UploadJsonDialog.tsx:111)

This is the clearest real drift.

## Consistency Findings

### Layout structure

Healthy overall.

The three real dialogs all follow the same high-value structure:

- top header
- constrained scrollable center
- footer that stays reachable

This is strong and coherent.

### Sizing

Mostly coherent, but not fully canonical.

Observed:

- `Open plan`:
  `max-w-2xl`, `h-[min(44rem,calc(100dvh-2rem))]`
- `Body notes`:
  `max-w-3xl`, `h-[min(46rem,calc(100dvh-2rem))]`
- `Import plan`:
  `max-w-xl`, `max-h-[calc(100dvh-2rem)]`, `sm:max-h-[85dvh]`

Interpretation:

- the width differences are justified by content
- the height model is conceptually similar
- but the implementation is not yet one canonical sizing contract

### Height constraints

Mostly good.

All three meaningful dialogs avoid free-growing page-height behavior and use bounded height plus internal scroll.

The product already learned the right lesson here.

The inconsistency is that two dialogs use the newer explicit stable-height recipe while `Import plan` still uses an earlier max-height variant.

### Internal scroll model

Good and coherent.

All meaningful product dialogs now use:

- internal content scrolling
- `min-h-0`
- `overflow-y-auto`
- `overscroll-contain`

This is one of the strongest parts of the current system.

### Header/footer treatment

Good and aligned.

All three product dialogs use:

- bordered top header
- padded calm editorial intro
- footer separated by a divider

The body-note modal and `Open plan` are especially aligned here.

### Action hierarchy

Mostly coherent.

Good patterns already in place:

- primary action visible
- cancel/close quiet
- destructive actions demoted
- expert/exceptional actions placed behind disclosure

Remaining variation:

- `Open plan` embeds more action logic inside the scroll area because it is a multi-purpose lifecycle surface
- `Import plan` still feels a bit denser and more form-driven

This is acceptable, but it is the dialog most likely to keep drifting if untouched.

### Destructive sections

Healthy overall.

`Open plan` handles destructive behavior correctly:

- quiet disclosure
- explicit confirmation checkbox
- honest preserved-history copy

This is currently the canonical Hito destructive-dialog behavior.

`Import plan` also handles destructive replacement correctly as a quieter override, not as a peer primary action.

### Overlay behavior

Not fully canonical.

The core primitive in [src/components/ui/dialog.tsx](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/components/ui/dialog.tsx:21) still ships generic animated overlay/content behavior.

Two product dialogs now override that with:

- `hito-dialog-stable`
- `hito-dialog-overlay-stable`

But `UploadJsonDialog` does not.

So overlay behavior is currently:

- conceptually solved
- but only partially promoted into canonical product truth

### Safari stabilization strategy

Effective, but only partially systematized.

Current canonical reality in product code:

- Safari-specific stabilization exists
- it solved real overlay and footer-reachability issues
- but it was applied locally to the dialogs that broke visibly first

This means the strategy is valid, but its system ownership is incomplete.

### Copy density

Mixed, but understandable.

Strong:

- `Body notes` is focused and readable
- `Open plan` is heavy but intentionally layered

Weakest:

- `Import plan` is still the densest and most implementation-shaped dialog

It is not broken, but it is the least calm member of the family.

### Calm editorial tone

Mostly aligned.

The modal family already reflects the broader Hito simplification direction:

- low chrome
- dividers over nested cards
- short support copy
- no loud dashboard framing

The system is much healthier than it was before the recent cleanup stream.

## Architectural Risks

### 1. The shared primitive is too generic to be the real product truth

`ui/dialog.tsx` is a baseline Radix wrapper, not yet a Hito product dialog contract.

Risk:

- product-level modal rules keep living in copied className strings
- future dialogs may copy the wrong variant

### 2. Safari stabilization is canonical in practice but not in ownership

Right now the stable classes are the real product answer, but only some dialogs opt into them.

Risk:

- the next dialog may accidentally use the older animated/default overlay behavior
- Safari regressions could reappear surface by surface

### 3. `UploadJsonDialog` is the most likely drift point

Why:

- it still uses a slightly older variant
- it is secondary and easier to forget
- it mixes advanced import, chosen start date, validation, and destructive override in a smaller canvas

### 4. Shared recipe duplication is real, but a giant abstraction would be the wrong fix

There is duplicated structure across:

- `PlanManagementDialog`
- `UploadJsonDialog`
- `BodyNotesModal`

But the right response is **not** a giant configurable modal framework.

Risk of over-abstraction:

- one huge `HitoDialog` with many switches
- opaque props for every layout variation
- harder-to-read product files

### 5. `/hitoDS` does not currently document modal truth

This is the biggest design-system documentation gap.

The live product now has a real modal family, but `/hitoDS` documents:

- buttons
- inputs
- composition
- rows/disclosure
- shell
- dropdowns

and does **not** show the bounded modal recipe that the product actually relies on.

## Design-System Alignment

### Does `/hitoDS` reflect actual modal truth?

Not enough.

Current answer:

- it reflects the language around rows, disclosure, and calm grouping
- it does not reflect the actual runner-facing dialog recipe

### What is missing

`/hitoDS` should eventually document:

- bounded centered dialog anatomy
- header / internal scroll / footer structure
- stable overlay expectation
- action hierarchy inside dialogs
- destructive disclosure pattern

### What belongs in DS docs

- one modal anatomy example
- one destructive disclosure example inside a dialog
- one note that internal scroll and footer reachability are product requirements, not optional polish

### What should stay local implementation notes

- exact height for `Body notes`
- exact width for `Open plan`
- file-import-specific validation states
- iframe export behavior in `Open plan`

## What Is Already Good Enough

- one meaningful runner-facing modal family clearly exists
- internal scroll and footer reachability are already treated correctly
- destructive actions are demoted rather than over-promoted
- `Open plan` and `Body notes` already share the best current dialog recipe
- the system does not need a broad modal redesign

## What Is Drifting

- `UploadJsonDialog` still reflects an older lighter variant
- stable overlay/content behavior is not consistently applied across product dialogs
- `/hitoDS` does not yet document actual modal truth
- the product-level dialog recipe is copied, not canonically owned

## What Should Become Canonical

1. The Safari-stable overlay/content behavior.
2. The bounded three-row modal structure:
   header / scroll body / footer.
3. Internal scroll plus footer reachability as non-negotiable product behavior.
4. Quiet destructive disclosure as the default dialog exception model.
5. One DS-documented Hito dialog recipe.

## What Should Stay Local

1. Modal width by task:
   `Open plan`, `Import plan`, and `Body notes` do not need identical widths.
2. Modal body content complexity by task.
3. Local copy density and action wording.
4. Specialized implementation details like export iframe handling.

## What We Should Not Abstract Yet

1. Do not merge `Dialog`, `Sheet`, `AlertDialog`, and `CommandDialog` into one mega overlay system.
2. Do not create a giant prop-driven `HitoDialog` with switches for every footer/header/body variant.
3. Do not force identical dialog sizes across unrelated tasks.
4. Do not promote unused `alert-dialog` or `command` scaffolding into product-system priorities.

## Recommended Next Move

One bounded consolidation slice is needed.

### Why this choice

The system is not broken enough to justify multiple modal tracks.

But it is also not healthy enough to leave as-is, because:

- the stable modal behavior is only half-canonical
- one product dialog is already drifting
- DS docs do not reflect the real modal family

### Smallest safe next move

1. Promote the current stable Hito product dialog recipe into canonical shared ownership.
2. Align `UploadJsonDialog` to the same stable overlay/content contract used by `Open plan` and `Body notes`.
3. Add one small modal section to `/hitoDS` that documents the real product dialog anatomy and destructive disclosure pattern.

This is a bounded consolidation slice, not a redesign.

## Exit Criteria

- modal inventory is explicit
- real product modal family is distinguished from unused UI scaffolding
- current shared truth vs copied recipe drift is documented honestly
- one smallest safe consolidation slice is defined
- one next recommended role is chosen

## Next Recommended Role

FRONTEND

## Suggested Next Step

Run one bounded frontend consolidation slice that treats `Open plan` and `Body notes` as the canonical Hito dialog recipe, aligns `UploadJsonDialog` to the same stable overlay/height structure, and adds one matching modal anatomy reference to `/hitoDS`.

## Implementation Update - 2026-05-15

- `UploadJsonDialog` now follows the same stable product-dialog recipe as `Open plan` and `Body notes`.
- `hito-product-dialog` owns the shared bounded three-row panel structure.
- `hito-product-dialog-body` owns the shared internal scroll region.
- stable overlay/content behavior remains opt-in for real product dialogs instead of changing sheet, alert-dialog, or command scaffolding.
- `/hitoDS` now includes a small modal anatomy section that reflects the live product modal truth.

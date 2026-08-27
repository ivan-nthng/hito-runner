# Unified Button and Debugger Action Contract

## Task

- Canonical Task: `Unify Icon-Only Button and Dialog Close Controls`
- Current design owner: `DESIGNER`
- Next implementation owner: `FRONTEND / Design System`
- Changed boundary: button composition, dialog/sheet close controls, local Debugger action hierarchy, and `/hitoDS` documentation

## Problem

Hito already has one capable `HitoButton` implementation, including an `iconOnly` configuration, but the product does not expose that contract consistently:

- `/hitoDS` presents icon-only buttons only as a low-discoverability variant rather than as a first-class composition of Button;
- Dialog and Sheet close controls maintain separate visual button recipes;
- local Debugger surfaces render ordinary actions through raw `<button>` elements and present Task, Bug, Content bug, and prompt-copy actions as competing peers;
- `Generate prompt` describes internal work even though the user-visible outcome is copying the prompt.

This creates multiple visual ownership paths for the same control and makes the Debugger harder to scan and operate.

## Accepted Design Decision

`HitoButton` is the only visual button entity. Do not add an `IconButton` component.

The following are compositions of `HitoButton`, not separate components:

- text only;
- leading icon;
- trailing icon;
- leading and trailing icons;
- icon only;
- Dialog and Sheet close actions;
- menu triggers.

Semantic composites such as tabs, menu items, sliders, disclosure rows, and switches retain their own Design System primitives. They must not borrow raw `.hito-button*` class recipes to imitate Button.

## Canonical Button Contract

### Component API

Use the existing `HitoButton` API and `hitoButtonClasses` control contract. The accepted dimensions remain:

- variants: `primary`, `secondary`, `outlined`, `ghost`;
- sizes: `xs`, `sm`, `md`, `lg`;
- tones: default, success, error;
- states: default, hover, focus-visible, pressed, loading, success, error, disabled, timed progress.

`iconOnly` is a square configuration of the same component. It must require a localized accessible name. An optional tooltip may explain unfamiliar icons, but a tooltip never replaces the accessible name.

### Dialog and Sheet Close

Radix close behavior remains authoritative. Compose it through `asChild` with `HitoButton`:

```tsx
<DialogPrimitive.Close asChild>
  <HitoButton aria-label={closeLabel} iconOnly size="sm" variant="ghost">
    <X aria-hidden="true" />
  </HitoButton>
</DialogPrimitive.Close>
```

The overlay may own only positioning. Visual chrome, dimensions, motion, focus, disabled, and feedback styling come from `HitoButton`. Delete the legacy `.hito-ui-dialog-close` and `.hito-ui-sheet-close` recipes once direct consumers are zero.

## Local Debugger Action Hierarchy

The Debugger exposes exactly two user outcomes:

1. `Send to Notion` — primary action and menu trigger.
2. `Copy prompt` — secondary fallback action.

The Notion action opens one menu with three explicit submission types:

- Task
- Bug
- Content bug

There is no default submission type. Choosing a menu item is the explicit submit action. The accepted HITO-246 backend route, exact-source deduplication, artifact retention, and Notion lifecycle semantics remain unchanged.

### Layout

- Desktop: one action row, `Send to Notion` first and `Copy prompt` second.
- Mobile at 375px: stack both actions full width.
- `Retake`, `Continue`, `Cancel`, and Clear remain separate supporting actions and do not compete with the two output actions.
- Replace `Generate prompt` with `Copy prompt`; generating is implementation detail, copying is the user outcome.

### Interaction States

| State        | Send to Notion                                                        | Copy prompt                                                |
| ------------ | --------------------------------------------------------------------- | ---------------------------------------------------------- |
| Idle         | Primary menu trigger with trailing chevron                            | Secondary action with copy icon                            |
| Menu open    | Task, Bug, Content bug; Arrow keys, Enter/Space, Escape               | Remains available                                          |
| Submitting   | Trigger shows `Sending…`; menu items and repeated submission disabled | Remains available because it is local-only and independent |
| Created      | Inline live region: `Created <ID> · Open`                             | Remains available                                          |
| Deduplicated | Inline live region: `Already exists <ID> · Open`                      | Remains available                                          |
| Submit error | Inline error: `Couldn’t send. Draft preserved.`; explicit retry only  | Remains available                                          |
| Copying      | Unchanged                                                             | `Copying…`                                                 |
| Copied       | Unchanged                                                             | Brief `Copied` success feedback                            |
| Copy error   | Unchanged                                                             | Reveal/select the manual prompt textarea                   |

Do not navigate automatically after submission. The inline `Open` link is the explicit navigation action. Preserve the draft and capture artifact across errors.

### Accessibility

- `Send to Notion` uses native menu-trigger keyboard behavior: Enter, Space, and ArrowDown open; menu arrows navigate; Escape closes and returns focus.
- `Copy prompt` uses native button behavior.
- All icon-only actions have localized accessible names and visible focus.
- Dialog/Sheet close keeps Radix Escape and focus-return behavior.
- Status and error messages use an appropriate live region without moving focus unexpectedly.

## `/hitoDS` Documentation

Keep one sidebar entity named `Button`. Do not add a separate Icon Button navigation item.

The Button page must make these sections directly discoverable:

- Compositions: text, leading icon, trailing icon, both icons, icon-only, close, menu trigger;
- States: all accepted motion and semantic states;
- Debugger action composition: `Send to Notion` plus `Copy prompt` on desktop and mobile.

At least one icon-only specimen must appear in the default Demo, not only in Variants. The page must state that close is behaviorally owned by Radix but visually owned by `HitoButton`.

## Consumer Census and Migration Order

1. `src/components/ui/button.tsx` and `src/components/ui/hito-control-contract.ts` remain canonical.
2. Migrate Dialog and Sheet close actions to `HitoButton` through Radix `asChild`.
3. Remove the two legacy close visual recipes from `src/styles/overlays-feedback.css` after zero-consumer proof.
4. Replace ordinary local Debugger action buttons with `HitoButton`.
5. Replace the three peer Notion buttons with the accepted menu composition.
6. Publish the accepted compositions and states in `/hitoDS`.
7. Run a negative census for raw `.hito-button*` action recipes. Classify remaining matches as owned semantic primitives, export-only specimens, or defects; migrate defects without widening behavior.

## Acceptance Matrix

- One component owns text and icon-only button chrome.
- Dialog and Sheet close actions preserve click, Escape, accessible name, visible focus, and focus return.
- Debugger has only two top-level outcomes and retains Task/Bug/Content bug submission semantics.
- Duplicate, success, error, loading, retry, and copy-fallback states are explicit and independent.
- `/hitoDS` shows the icon-only and debugger compositions in the default discoverable surface.
- Desktop and 375px layouts contain all controls without horizontal overflow.
- Keyboard-only operation works for menu, copy, and close controls.
- Existing Notion submission backend and deduplication behavior are unchanged.

## Out of Scope

- No new submission route, persistence model, Notion schema, or automatic submission.
- No separate IconButton abstraction.
- No redesign of tabs, switches, sliders, disclosures, or menu items.
- No product-runtime exposure of the local-only Debugger.

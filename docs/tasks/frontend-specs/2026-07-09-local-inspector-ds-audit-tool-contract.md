# Local Inspector DS Audit Tool Contract

## Task

Make the local-only UI inspector useful as a Hito DS audit and prompt-generation tool.

## Stage

FRONTEND implementation specification / local inspector DS-audit behavior.

## Product Decision

The local inspector is not a backlog persistence tool and not a live UI editor.

It is a local-only prompt generator that lets Product/Design/Frontend select a UI element, inspect
its real layout and typography evidence, make explicit pending changes, and generate a precise
Frontend prompt.

The inspector should also help reveal local drift from Hito DS tokens. If a selected element uses a
custom spacing value such as `5.6px`, the tool should expose that value and guide the user toward the
nearest Hito spacing token instead of hiding it.

## Root Cause

Visible symptoms:

- Some selected containers show no padding, gap, width, height, or typography evidence even when the
  UI visibly has spacing.
- Property rows can look too large and too rounded for a dense inspector tool.
- Grouped rows such as `Horizontal padding` hide how to edit only left or right.
- `Radius` hides how to edit individual corners.
- Typography targets do not expose Hito typography-role changes.
- Custom values such as `5.6px` can disappear because they do not cleanly map to a Hito token.

Likely underlying causes:

- The DOM evidence collector reads only a narrow set of mapped padding/gap/radius controls.
- The panel filters out uncertain/custom values from the default UI.
- Width and height are not collected at all.
- Hit-layer selection can pick an inner wrapper rather than the nearest layout owner.
- Property row grouping is visually useful but lacks side/corner expansion.
- Typography is not part of the local inspector property model.

Canonical owner:

- `src/components/devtools/local-ui-inspector-targets.ts`
- `src/components/devtools/LocalUiTaskDraftPanel.tsx`
- `src/components/devtools/LocalUiInspector.tsx`
- `src/components/devtools/local-inline-change-target-utils.ts`

## Product Model

1. User enables local `Dev tool`.
2. User selects `Pencil`.
3. User clicks an element.
4. Inspector selects the real editable/auditable target owner.
5. Panel shows current observed properties only.
6. User may add a comment.
7. User may choose desired token values for spacing/radius/typography.
8. Pending changes appear as explicit old-to-new rows.
9. User can remove any pending change before prompt generation.
10. `Generate Prompt` creates a precise prompt and copies it when possible.
11. If clipboard is blocked or unverified, show a selectable manual-copy textarea.

No live UI mutation happens at any point.

## Target Resolution

The clicked DOM node is not always the right inspected owner.

Rules:

- Prefer the clicked element when it has observable layout, surface, text, or control evidence.
- If the clicked element is an empty/inner wrapper with no useful properties, inspect nearby parents
  until a real layout owner is found.
- A layout owner is an element with meaningful `display: flex/grid`, child spacing, gap, padding,
  radius, dimensions, Hito DS classes, or visible surface chrome.
- The selected highlight must match the final inspected target whose properties appear in the panel.
- Do not jump all the way to the page or unrelated ancestor just because it has styles.
- If the target choice is ambiguous, prefer the smallest ancestor that explains the visible spacing.

## Observed Property Evidence

The panel should show observed properties when they exist.

Spacing:

- padding-left
- padding-right
- padding-top
- padding-bottom
- column gap / horizontal gap
- row gap / vertical gap

Radius:

- top-left
- top-right
- bottom-right
- bottom-left

Dimensions:

- width
- height

Typography:

- tag, for example `h1`, `h2`, `p`, `span`
- Hito typography classes where present
- computed font size / line height / weight when useful
- inferred Hito typography role only when there is safe evidence

Custom values:

- Do not hide values just because they are not clean token matches.
- Show the observed value.
- Show nearest Hito token guidance quietly.
- Do not claim a custom value is a Hito token.

Example:

- `5.6px`
- nearest `--space-1`
- prompt guidance: align custom gap with the nearest Hito spacing token.

## Read-Current-First Rule

Initial state is always observational.

- Show current values only.
- Do not preselect desired values.
- Do not show red/green old-new chips before user action.
- Do not enable `Generate Prompt` unless there is a comment or explicit pending change.
- Passive observed values must never become prompt changes by themselves.

## Property Row Anatomy

Rows should feel like lightweight Hito DS inspector controls, not debug cards.

Recommended anatomy:

```text
[icon] Label        [current tag]
       token note
```
After explicit change:

```text
[icon] Label        [current tag] -> [desired tag x]
       current token     desired token
```

Visual rules:

- value chips should be small tags, not large buttons;
- small controls should have smaller radius than large product controls;
- the arrow should sit close to the values;
- token labels should attach to their own value;
- remove `x` appears on the desired tag and removes only that pending change;
- keep tap/click targets accessible even if the visual chip is compact.

## Grouping And Precision

Grouping is useful, but it must not remove precision.

Padding:

- If left/right match, show `Horizontal padding`.
- If top/bottom match, show `Vertical padding`.
- Each grouped row needs a quiet way to reveal side-specific controls.
- Side controls must allow changing only left, right, top, or bottom.

Radius:

- If all corners match, show `Radius`.
- The grouped row needs a quiet way to reveal individual corners.
- Corner controls must allow changing only one corner.

Gap:

- Show horizontal and vertical gap separately when both exist.
- If only one gap exists, show only that one.

## Typography Controls

Text and hierarchy targets should support typography prompt generation.

Rules:

- Show current typography evidence when safe.
- Offer Hito typography-role choices only from existing Hito DS typography primitives.
- Do not invent arbitrary font-size values or a new type scale.
- Do not mutate text or typography live.
- Typography changes are included in the prompt only after explicit user choice.

Examples of allowed prompt intents:

- change this heading to the Hito `hito-page-title` role;
- demote this label to helper/caption role;
- align this paragraph with the Hito body text role.

## DS Drift Audit Behavior

The inspector should help find values that are not aligned with Hito DS.

When a custom spacing/radius value is found:

- show the raw observed value;
- show nearest-token guidance;
- let the user choose the desired Hito token;
- generate a prompt that says the current value is custom and should be aligned to the selected Hito
  token.

Do not automatically treat every custom value as a bug. The user still decides whether to generate a
prompt.

## Example: Plan Note Surface

Observed problem:

- selected Plan note surface likely has padding/radius;
- close `x` placement feels too low/inset;
- Product wants to reduce padding and move the close action higher/right.

Expected inspector support:

- select the note surface or nearest surface owner;
- show current radius and any real padding values;
- show width/height as observed evidence;
- let Product choose reduced Hito spacing tokens when padding exists;
- allow a comment such as: `Move the close button higher and farther right inside this note surface.`;
- generated prompt should identify the selected element, route, observed evidence, pending token
  changes, and comment.

Do not invent padding if the selected owner truly has none. If a child/parent owns the relevant
spacing, the target resolution should select or clearly evidence that owner.

## Generate Prompt Contract

`Generate Prompt` should include:

- role, usually `ROLE: FRONTEND`;
- route URL/path;
- selected element selector/component evidence;
- target kind;
- observed evidence;
- explicit pending changes only;
- user comment, if present;
- scope guidance, defaulting to `Only here` unless the user chooses otherwise;
- local-only note.

Clipboard:

- success shows `Prompt copied.`;
- blocked/unverified copy shows visible manual-copy textarea;
- prompt remains inspectable after generation.

## Non-Goals

- No backend/Admin/Supabase/Work Items persistence.
- No live UI mutation.
- No production-visible inspector.
- No new design-token scale.
- No broad browser devtools clone.
- No generated-plan/readback editability changes.
- No `/hitoDS` mobile navigation work in this slice.

## Frontend Implementation Scope

Implement this as one bounded local-inspector slice if safe:

1. Expand DOM evidence collection.
2. Show mapped and custom/uncertain values.
3. Add width/height observed evidence.
4. Add typography evidence/actions.
5. Improve target owner resolution.
6. Refine property row anatomy.
7. Add grouped row side/corner expansion.
8. Preserve read-current-first behavior and Generate Prompt fallback.

Stop and report if the work requires a new token scale, a broad DOM-inspector rewrite, or backend
persistence.

## QA Acceptance

QA should prove:

- selecting a layout container shows current padding/gap/radius when present;
- selecting a target with custom value such as `5.6px` still shows it with nearest-token guidance;
- width and height appear as observed evidence for a visual block;
- text/heading targets expose typography evidence/actions;
- current values show before any desired values;
- desired values appear only after explicit user choice;
- pending changes can be removed and disappear from generated prompt;
- grouped horizontal padding can reveal left/right controls;
- grouped radius can reveal individual corner controls;
- Generate Prompt includes only comments and explicit pending changes;
- exact `375px` has no horizontal overflow;
- no backlog/Admin/Supabase/Work Items language appears.

## Exact Frontend Prompt

```text
ROLE: FRONTEND

Task:
Implement the local inspector DS audit tool contract for layout, typography, and token-alignment prompt generation.

Stage:
FRONTEND implementation / local inspector DS audit tool.

Spec:
Read /Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-07-09-local-inspector-ds-audit-tool-contract.md.

Context:
The local inspector should help Product/Design/Frontend select a UI element, inspect real layout and typography evidence, align custom values to Hito DS tokens, and generate a precise local-only Frontend prompt. It is not a live editor and not a backlog/Admin/Supabase persistence tool.

Root cause:
The current inspector evidence model is too narrow. It can hide padding/gap/radius when values are custom or uncertain, does not collect width/height, does not expose typography roles, and grouped property rows hide side/corner precision.

Scope:
Follow the spec exactly. Keep the fix in the local inspector/devtools owner files. Reuse existing Hito DS primitives and tokens. Preserve read-current-first behavior and Generate Prompt fallback. Do not add backend persistence or live UI mutation.

Validation:
Run targeted ESLint for touched devtools files, `npm run build`, `node scripts/validate-build-output-integrity.mjs`, and scoped `git diff --check`. Use built-in Codex Browser first; do not use Chrome. Capture desktop and exact 375px browser proof for mapped values, custom values, width/height evidence, typography evidence, side/corner expansion, pending-change removal, and Generate Prompt content.
```

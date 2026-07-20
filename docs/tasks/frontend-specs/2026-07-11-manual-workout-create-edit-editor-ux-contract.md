# Hito Manual Workout Create/Edit Editor UX Contract

## Status

ready_for_frontend

## Owner

DESIGNER / Hito DS

## Last Updated

2026-07-19

## Type

frontend_spec

## Priority

high

## Source Of Truth

- Active plan:
  `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`
- Functional map:
  `docs/current-functional-map.md`
- Product brief:
  `docs/tasks/product-briefs/2026-06-11-unified-plan-creation-lifecycle.md`
- Shared current implementation:
  `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`
  `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
  `src/components/manual-workout/ManualWorkoutPersistedEditControls.tsx`
- Backend manual workout authoring owner:
  `src/lib/manual-workout-authoring/*`
- Hito DS primitives:
  `src/components/ui/*`, `src/components/hito-ds/*`, `src/styles/*`, and `/hitoDS`.
- Product sketch:
  the provided Figma-style workout editor sketch showing a dialog editor with date/title/status
  header, workout structure preview, editable segment and repeat rows, Add Section insertion
  controls, notes, Close, and Save Workout.
- Product-provided filled-mode Figma node:
  `https://www.figma.com/design/RNcNPUpUgMcpeTk6UFwbn4/hito-running?node-id=7647-715`
  used as visual direction for compact filled editor anatomy. Figma MCP access was blocked by file
  permissions during this pass, so this spec relies on the user's linked direction plus provided
  screenshots and must be implemented with Hito DS primitives rather than copied raw Figma tokens.
- Product-provided workout preview Figma node:
  `https://www.figma.com/design/RNcNPUpUgMcpeTk6UFwbn4/hito-running?node-id=7648-1278`
  used as visual direction for the compact workout preview/readback state. Figma MCP access was
  again blocked by file permissions, so the comparison is grounded in source inspection plus the
  user's screenshots and stated direction.

## Current Editability Override

The source/manual-only/future-only availability statements in the detailed design record below are
superseded by `docs/current-product.md`. The same editor grammar must support every confirmed
non-rest workout on today or a future date regardless of source, logs, completion, or evidence;
past workouts remain non-editable. Passive readback stays non-inline-editable, and save remains a
reviewed server mutation that preserves history.

## Root Cause

Visible symptom:

- Workout creation and workout editing can drift into separate route-local UI systems.

Likely underlying cause:

- Hito has backend-reviewed manual workout constructor truth and a first persisted-edit seam, but no
  current DS-backed editor UX contract for a shared create/edit shell, nested repeat editing,
  drag/drop reorder states, and consistent save/review behavior.

Canonical owners:

- DESIGNER / Hito DS owns this UX and component contract.
- FRONTEND owns implementation using existing Hito DS primitives.
- BACKEND/manual workout authoring owns validation, review, persistence, reconstruction, editability
  safety, and mutation truth.

## Decision

Use one shared manual workout editor pattern for:

- creating a manual workout from scratch, a built-in structural template, or a personal saved
  template;
- editing any confirmed non-rest workout on today or a future date through backend review/confirm.

The editor should feel like one workout document that can be in draft, review, or save states. It
must not become two separate products named "create workout" and "edit workout."

## Screenshot-Faithful Visual Contract

The provided `Dialog.png` reference is the v1 anatomy target, not loose inspiration.

The editor must preserve this exact hierarchy:

1. Dialog header with date, large workout title, small status pill, and close affordance.
2. Document title/input row with a small left icon control and a same-height header input/readback.
3. Workout structure preview.
4. First Add Section insertion control directly below the structure preview.
5. Editable segment or repeat document blocks.
6. Notes or cues.
7. Sticky footer with Close and Save/Review action.

Key visual rules from the editable screenshot:

- The lead icon is a quiet icon control without a heavy border.
- The lead icon control and the ghost/header input must be the same height. They read as one
  aligned document lead row.
- The header input/readback reads like a document heading, not a normal form field.
- `Workout structure` stays above all editable blocks and uses the existing timeline/readback
  language.
- Add Section is a real inline insertion control. It appears below the structure preview, between
  editable blocks, and at the bottom of repeat groups. It is not hidden only inside row menus.
- Segment blocks have a compact row header first, then the editable fields below: visible label,
  duration, and target.
- Repeat blocks start with `Repeats` controls, then contain the same draggable segment blocks as the
  top-level document.
- Row ellipsis/delete actions are hover/focus affordances on the right side of the row header.
- Notes or cues stay near the bottom, after the editable workout structure.

Do not deviate in v1 by moving structure below segments, turning Add Section into only a dropdown
inside the footer, making every field its own bordered card, creating separate create/edit layouts,
or replacing the document rhythm with a generic form wizard.

## Product Review Correction: Compact Section Editor

The Product review compared two visible directions:

- rejected direction: oversized form-builder block with a large top-right `Add Section`, `Block
  label`, `Quantity` mode chips, large target option cards, excessive vertical space, and a section
  header that reads like a separate form surface;
- accepted direction: compact Hito section editor with one low-surface row header, `Visible label`,
  compact `Duration` and `Target` select fields, and a centered Add Section control below the block.

The accepted direction wins.

Correction rules:

- Do not use the large `Quantity` chip group shown in the rejected screenshot.
- Do not use large target option cards such as `No target`, `Pace`, `Pace range`, `HR cap`,
  `HR range`, and `RPE` inside the section body.
- Do not label the field `Block label`; use `Visible label`.
- Do not put the primary Add Section CTA at the top-right of the section body.
- Do not render the row as a huge form-builder card with oversized controls.
- Do use compact Hito DS secondary fields/selects for duration mode, duration value, target mode,
  and target value.
- Do split editable duration and distance values into small compound inputs when useful instead of
  requiring a formatted string.
- Do keep Add Section centered below the active section or revealed between sections on hover/focus.
- Do keep the row header compact: semantic marker, ordinal, title/type dropdown, summary, and
  right-side row menu only when needed.

Key visual rules from the filled compact editor screenshot:

- The same dialog, header, document lead row, structure preview, notes, and footer remain in place.
- The lead icon still matches the ghost/header input height.
- Segment form fields collapse into compact rows by default: title/target summary on the left and
  duration on the right.
- Repeat groups show the repeat count in the left gutter, e.g. `x3`, aligned to the repeated child
  row stack.
- The repeat count is not shown as a large top control in filled compact mode.
- Compact rows keep the same semantic color markers as editable rows.
- Hover/focus exposes section affordances: Add Section between blocks, row action ellipsis, drag
  handle/reorder affordance, and editable-row entry when editing is allowed.
- Filled compact mode should feel like the filled version of the same editor, not a separate
  workout-detail design and not a read-only card list.

## Workout Preview Comparison Decision

The workout preview must be the compact readback state of the same workout document, not a separate
route-local presentation.

Current implemented reality from source inspection:

- `src/components/workout-structure/WorkoutDocumentReadback.tsx` is a generic structure readback:
  heading, `WorkoutStructureTimeline`, and notes in a row group.
- `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx` already contains compact
  manual workout readback rows, repeat gutter, semantic markers, and document lead anatomy.
- If these remain separate visual systems, the product will drift: create/edit will look like the
  Figma-style workout document while workout detail preview will look like a different timeline-only
  component.

Target preview behavior:

- Use the same document shell and compact row grammar as filled compact editor mode.
- Keep the same order: dialog/header context, quiet document lead row, `Workout structure`, timeline,
  compact segment/repeat readback rows, `Notes or cues`, footer or contextual actions.
- Segment preview rows show semantic marker, ordinal, title, target summary, and right-aligned
  duration.
- Repeat preview rows show the repeat count in the left gutter, e.g. `x3`, aligned with the child
  stack.
- Preview rows do not show expanded `Visible label`, `Duration`, or `Target` form fields unless the
  user enters an allowed edit mode.
- Editable manual previews may reveal Add Section, row ellipsis, and drag/reorder affordances on
  hover/focus.
- Past workout and Rest-placeholder previews stay read-only. Generated/imported origin, logs,
  completion, or evidence do not deny the separate reviewed edit action for today/future workouts.

Design decision:

- Normalize toward one shared `ManualWorkoutDocumentPreview` / `ManualWorkoutReadbackStack` seam
  rather than keeping a generic timeline-only readback for the manual workout preview.
- `WorkoutDocumentReadback` may remain useful for simple generated/read-only summaries, but it is
  not sufficient as the visual target for the manual workout document preview shown in the Figma
  reference.
- The preview should reuse `WorkoutStructureTimeline` inside the document, not replace the compact
  segment/repeat row stack with only the timeline.

## Product Scope

In scope:

- create a manual workout for an eligible active-plan date;
- edit any confirmed non-rest planned workout on today or a future date through the shared draft
  shape;
- edit title, visible labels, durations/distances, target mode/values, notes, repeat count, repeat
  child rows, and row order;
- add sections before, between, or after rows;
- duplicate/delete/reorder editable rows where backend review still validates the result;
- review before saving when backend requires review/confirm.

Out of scope:

- generated, selected, imported, AI-authored, today, past, logged, evidence-backed, comparison-backed,
  rest, protected, or unsupported workout content editing unless backend capability metadata
  explicitly allows it later;
- calendar date move from this dialog;
- recurrence, batch editing, restore/redo, plan replacement, provider/FIT comparison, OpenAI
  mutation, fake pace, fake personal HR, and schema changes;
- copying raw Figma colors/tokens or creating a separate editor visual kit.

## Editor Container Decision

Desktop and tablet:

- Use the existing Hito product workflow dialog pattern.
- Base classes should stay aligned with `hito-product-dialog`,
  `hito-dialog-size-workflow` or a slightly wider workflow/review size if the current editor cannot
  fit without cramped rows.
- Body uses internal scroll; footer remains reachable.
- The dialog should feel like a focused document editor, not a dashboard of nested cards.

Mobile and narrow screens:

- Use the same dialog family escalated to a full-height workflow sheet/dialog.
- Header remains at the top; body scrolls; footer stays sticky/reachable.
- Controls must not depend on hover. Add Section, row action menu, drag handle or reorder menu must
  be reachable by touch.
- Exact `375px` must avoid horizontal overflow and must not require a desktop-like two-column field
  layout.

Do not create a separate page-like editor unless later QA proves the dialog cannot support mobile
editing safely.

## Canonical Information Architecture

The shared editor has nine ordered zones:

1. Dialog header
   - date;
   - large workout title;
   - status pill such as `Draft`, `Reviewing`, `Ready`, `Saving`, `Blocked`;
   - close affordance.
2. Document lead row
   - quiet left icon control with no heavy border;
   - same-height header input/readback for the workout title;
   - icon control height must match the ghost/header input height;
   - hover/focus backdrop only when the title is editable;
   - no secondary explanatory card around this row.
3. Workout structure preview
   - section label `Workout structure`;
   - right-aligned total duration and step count when available;
   - horizontal structure bar;
   - compact readback for warm-up, repeats, cooldown, and notes.
4. Structure-level insertion
   - Add Section dropdown immediately below the structure preview when adding the first or next
     top-level block.
5. Editable top-level segment block
   - compact draggable row header;
   - visible label field;
   - duration controls;
   - target controls;
   - local Add Section insertion after the block.
6. Repeat group block
   - `Repeats` label and count/summary controls at the top;
   - draggable child segment blocks using the same segment anatomy;
   - child-level Add Section insertion at the bottom and between children.
7. Additional top-level segments or repeat groups
   - same anatomy repeated without creating a new visual system.
8. Notes or cues
   - one textarea using Hito DS textarea styles.
9. Footer
   - `Close` / `Cancel`;
   - primary action based on state: `Review workout`, `Save Workout`, `Save edited workout`,
     `Saving...`;
   - secondary review/status copy only when needed.

## Component Inventory

Reuse existing Hito DS primitives first:

- `Dialog`, `DialogContent`, `DialogHeader`, `DialogTitle`, `DialogDescription`, `DialogFooter`;
- `hito-product-dialog`, `hito-product-dialog-header`, `hito-product-dialog-body-scroll-fill`,
  `hito-product-dialog-footer`;
- `hito-button` variants for primary, secondary, ghost, and destructive row actions;
- `hito-field`, `hito-field-secondary`, `hito-field-header`, `hito-textarea-md`;
- `Select`, `DropdownMenu`, mobile-adaptive picker/dialog patterns;
- `InlineEditableText` variant `header` for title/header-like text;
- `Icon` primitive;
- `hito-status-pill`, `HitoValueTag`, `MetadataTag` where needed;
- `hito-row-group`, `hito-list-row`, `hito-list-row-title`, `hito-list-row-copy`;
- `WorkoutStructureTimeline`;
- `hitoToast` for review/save async feedback;
- existing workout glyph/color token families.

Shared editor component anatomy to implement or normalize:

- `ManualWorkoutEditorDialog` or equivalent shared shell for create and edit.
- `ManualWorkoutEditorHeader` for date/title/status.
- `ManualWorkoutDocumentLead` for the top icon plus header-input row.
- `ManualWorkoutStructurePreview` wrapping the existing `WorkoutStructureTimeline` for draft and
  reviewed states.
- `ManualWorkoutDocumentPreview` or shared preview/readback state for the filled workout document.
- `ManualWorkoutSegmentCard` for a normal segment.
- `ManualWorkoutRepeatGroupCard` for repeat parent plus children.
- `ManualWorkoutRepeatChildRow` for work/recovery rows inside a repeat.
- `ManualWorkoutReadbackRow` for filled/saved compact rows when not actively editing.
- `ManualWorkoutRepeatGutter` for the left-side repeat count marker in readback mode.
- `ManualWorkoutInsertionControl` for Add Section between rows.
- `ManualWorkoutDragHandle` and `ManualWorkoutDropIndicator` for reorder states.
- `ManualWorkoutRowActionMenu` using existing dropdown/menu primitives.

These names are implementation guidance, not a requirement to create a new component for every line.
The goal is one shared anatomy, not a new UI kit.

## Missing DS Primitive / Upgrade List

Frontend should avoid inventing local visual styling by promoting the following as small Hito
DS-backed patterns if no reusable equivalent exists:

1. Draggable row primitive
   - drag handle;
   - keyboard reorder controls;
   - dragging, overlay, valid drop, invalid drop, disabled states.
2. Insertion divider/action
   - Add Section control that can appear between rows;
   - visible on hover/focus for pointer users;
   - reachable without hover on touch/mobile and keyboard.
3. Repeat group surface
   - parent card with repeat count and summary;
   - child-row stack with internal dividers;
   - nested Add Section inside group.
4. Segment type marker
   - narrow color marker tied to existing workout/section semantic colors;
   - must not create a separate icon system.
5. Compact row action menu
   - use existing `DropdownMenu`;
   - normalize labels, destructive treatment, and disabled reasons.
6. Header input / editable heading row
   - text reads like a title in the document;
   - hover backdrop reveals edit affordance only when editing is real;
   - no heavy input border by default;
   - leading icon control and ghost/header input share one height rhythm;
   - should reuse or extend `InlineEditableText` / `hito-field-header` instead of creating a
     route-local title field.

Do not introduce raw Figma `--dl-color-*` tokens or hardcoded sketch colors. All visuals resolve
through Hito DS semantic tokens and current workout color primitives.

## Segment Card Anatomy

Default normal segment block:

- row header first;
- left semantic color marker;
- drag affordance or draggable region, exposed with keyboard fallback;
- ordinal such as `01`;
- segment title/type with a small caret when type can change, e.g. `Warm-up`, `Tempo`, `Walk`;
- compact summary under the title, e.g. `15 min`, `5:35 min/km`, `No target`;
- right ellipsis row action menu that appears on hover/focus for pointer users and is always
  reachable on touch/mobile;
- selected/active row may use a quiet signal hairline or outline like the screenshot, not a heavy
  permanent border on every row.

Expanded fields:

- visible label;
- duration/distance quantity mode and value;
- target mode and target value;
- optional helper/error copy.

Field layout:

- `Visible label` is full-width below the row header.
- `Duration` and `Target` sit as a two-column grid on desktop.
- `Duration` contains compact controls: quantity type, then compound quantity value.
- `Target` contains two compact controls where applicable: target type, then target value.
- On `375px`, `Duration` and `Target` stack as single-column groups.
- Use secondary Hito fields/selects; avoid bright form labels or heavy input chrome.
- Do not use large segmented/chip groups for `Duration`/`Distance`/`No quantity` or target modes in
  the normal section body.
- If a mode menu needs more choices, open a dropdown/popover/sheet from the compact field instead of
  expanding all options inline.

The default editing state should show the row header plus its core fields. Do not collapse the
fields behind a generic accordion wall in v1 unless Product explicitly scopes a compact mode later.

## Compound Quantity Input Contract

Use compound quantity inputs for values that runners naturally think of in two units.

Time quantity:

- When quantity type is `Time`, show two compact inputs/selectable number fields:
  - minutes;
  - seconds.
- Example: `15` minutes + `00` seconds, or `1` minute + `30` seconds.
- Seconds should be optional but visible as a paired field, not hidden behind advanced controls.
- Seconds should accept `0-59`; invalid values show the normal Hito field error state.
- In compact readback, display the normalized value as runner-facing text such as `15 min`,
  `1 min 30 sec`, or the existing product-approved short equivalent.

Distance quantity:

- When quantity type is `Distance`, show two compact inputs/selectable number fields:
  - kilometers;
  - meters.
- Example: `1` kilometer + `500` meters.
- Meters should accept `0-999`; invalid values show the normal Hito field error state.
- In compact readback, display the normalized value as runner-facing text such as `1.5 km` or the
  existing product-approved short equivalent.

No quantity:

- When quantity type is `No quantity`, hide the compound value inputs and keep the area compact.
- Do not show disabled empty minutes/seconds or kilometers/meters fields just to preserve layout.

Design rules:

- Compound inputs use Hito DS secondary input/select sizing and share one visual group.
- Labels can be compact suffixes (`min`, `sec`, `km`, `m`) inside or beside each field.
- Do not use one freeform text field that requires the runner to type `15 min` or `1.5 km`.
- Do not introduce a new route-local numeric input family; if Hito DS lacks a compound field
  primitive, promote this as a small reusable Hito DS pattern.

Data rules:

- Frontend may compose the two inputs into the existing draft quantity shape for backend review.
- Backend remains the validation and normalization authority.
- Frontend must not invent new stored units, schema fields, or persistence truth for the compound
  inputs.

## Repeat Group Anatomy

Repeat group block:

- begins with a compact `Repeats` control row, not a large parent card;
- includes count selector such as `3`;
- may include a compact duration/summary control when supported, e.g. `15 min`;
- then shows child segment blocks using the same segment anatomy as top-level blocks;
- keeps child blocks visually grouped through spacing, a low surface, and internal dividers rather
  than nested border cards;
- exposes group-level row action menu only when there are true group actions.

Repeat children:

- ordered child rows inside the group;
- child drag handles or reorder handles for reordering within the same group;
- work/recovery visual markers;
- visible label, duration/distance, and target controls;
- nested Add Section between children and at group end;
- optional Add Section at the top of the group only if Frontend can keep the visual rhythm calm.

Repeat parent is structural. It does not own pace/HR/RPE target truth; child rows own targets.

## Filled Compact Editor Anatomy

Filled compact editor mode is used when a workout already has sections populated and the UI should
look like the `filed.png` / Figma filled-mode reference instead of a fully expanded form.

Compact segment rows:

- use the same low-surface row shape as editable segment headers;
- keep the left semantic color marker;
- show ordinal and segment title on the left;
- show target summary beneath the title, e.g. `132 bpm`, `4:45 min/km`, or `No Target`;
- show duration on the right, e.g. `15 min`, `8 min`, `2 min`;
- hide visible label/duration/target form fields until the user enters row edit mode;
- reveal row hover state, action ellipsis, and drag/reorder affordance when editing is allowed;
- keep the row tappable/clickable into edit mode if the backend says this workout is editable;
- stay read-only with no edit affordances only when backend capability marks the workout protected.

Compact repeat groups:

- show repeated child rows as a compact stack;
- place the repeat count in the left gutter, e.g. `x3`, vertically aligned with the repeated child
  stack;
- keep the child rows visually connected with subtle spacing/dividers;
- avoid a large repeat parent card or top `Repeats` control in this mode;
- reveal Add Section insertion between child rows and at group bottom on hover/focus when editable;
- if the user switches the group into edit mode, it may expand back into the editable `Repeats`
  controls plus child segment fields described above.

Notes or cues:

- remain below the readback rows;
- can appear as a textarea-like readback surface when saving/editing is still available;
- should not move above the workout structure or repeated rows.

Read-only protected mode:

- uses the same compact rows and repeat gutter;
- does not show Add Section, drag handles, edit affordances, or destructive actions;
- explains the protection reason through the existing disabled/read-only pattern, not through a new
  visual system.

## Hover And Interaction State Contract

Every interactive editor layer needs visible states. Do not ship only a static filled view.

Required states by layer:

- Document lead row:
  default, hover, focus-visible, editing, disabled/read-only, validation error.
- Structure preview:
  default, hover when it has actions, focus-visible when keyboard reachable, disabled/read-only.
- Top-level block gap:
  default quiet gap, hover section with Add Section, focus-visible Add Section, menu open, disabled.
- Segment row:
  default, section hover/backdrop, row hover, focus-visible, selected/active, editing expanded,
  dragging, drag overlay, valid drop target, invalid drop target, menu open, validation error,
  disabled/read-only.
- Repeat group:
  default, group hover, child row hover, left-gutter repeat count stable, group menu open,
  child insertion hover, dragging whole group, dragging child row, invalid cross-group target,
  disabled/read-only.
- Notes or cues:
  default, hover, focus-visible, editing, validation error, disabled/read-only.
- Footer actions:
  default, hover, focus-visible, pressed, loading/saving, disabled.

Hover section means the surrounding section/backdrop becomes subtly visible enough to communicate
where the action will apply. It must not create a heavy card outline around every block at rest.

## Add Section Behavior

Pointer users:

- Add Section appears as a quiet divider/dropdown button below the structure preview, between rows,
  and after the last row.
- Inside repeat groups, Add Section appears between child rows and at the group bottom.
- In filled compact editor mode, Add Section is hidden at rest and appears on hover/focus between
  blocks, matching the Figma direction.
- It may be always visible in the current active editing area and hover-revealed in inactive gaps,
  matching the screenshot's lightweight insertion rhythm.
- It can reveal a menu of allowed block types and repeat group where supported.
- It should not create heavy extra cards or permanent clutter.
- The menu should create either a normal section or a repeat group, based on backend-supported draft
  block types.

Keyboard users:

- Add Section must be reachable via tab/focus, not hover-only.
- Each row action menu should include `Add section before` and `Add section after` as a fallback.

Touch/mobile:

- Add Section should be visible as a compact button after each row/group or in a persistent local
  row action area.
- Do not require hover to add sections.

When backend or validation blocks adding a block, show a disabled state with a concise reason.

## Row Actions And Delete Behavior

Row actions live in the right ellipsis menu on the row header.

V1 row actions should include only actions that are true and safe for that row:

- Delete section;
- Duplicate section if supported by the current draft model;
- Add section before;
- Add section after;
- Move up;
- Move down.

Destructive delete stays quiet until the menu is opened. Do not show a loud delete button on every
row by default. If a row cannot be deleted because it would make the workout invalid, keep the menu
item disabled with a short reason and let backend review remain the final authority.

## Drag And Drop Rules

V1 allowed reorder:

- reorder top-level normal segments within the workout;
- move a whole repeat group as one top-level item;
- reorder child rows within the same repeat group.

V1 not allowed:

- move a repeat child out of its repeat group;
- move a top-level segment into a repeat group;
- move child rows across repeat groups;
- drag between workouts;
- drag to another calendar date;
- drag to change plan source/provenance;
- drag persisted rows directly without review when the backend contract requires review/confirm.

Drop behavior:

- valid drop target shows one clear insertion line and enough spacing to preview placement;
- invalid target shows a quiet blocked state and optional tooltip/helper;
- drag overlay should be compact and readable, not a full card screenshot;
- after drop, focus returns to the moved row and an accessible announcement states the new position;
- if keyboard reorder is used, use move up/down controls with the same state update.

Persistence behavior:

- reorder changes remain local draft state until backend review/confirm.
- Frontend must not persist row order as trusted truth without backend review.

## State Matrix

| State | UX treatment | Notes |
| --- | --- | --- |
| Loading / reconstructing | Dialog opens with skeleton/list row and `Reconstructing saved workout` copy | Edit path only; no empty white body. |
| Empty draft | Show structure preview empty state plus prominent Add Section | Scratch create only; rest/no-run is separate and should not fake run targets. |
| Default | Segment cards are compact, low-card, readable | Use surfaces/dividers, not nested border soup. |
| Hover | Row backdrop strengthens; row action menu and Add Section become more visible | Pointer-only enhancement. |
| Focus-visible | Strong Hito focus ring; action/menu/drag handle visible | Must be distinct from selected. |
| Selected / active row | Slight surface lift or signal hairline; fields remain readable | Do not overuse orange fill. |
| Collapsed row | Summary remains visible; editable fields may be hidden only if user can re-expand clearly | Avoid hiding required controls in v1 unless implemented intentionally. |
| Editing | Fields use Hito DS input/select/textarea states | Header title uses `InlineEditableText`. |
| Filled compact editor | Compact segment rows, duration on the right, repeat count in left gutter, hover affordances available | Same document shell, not a separate display component. |
| Hover section | The section/gap backdrop appears and exposes Add Section or row actions | Required for filled compact mode. |
| Dirty / unsaved | Status pill `Draft` or `Unsaved`; primary action is review/save path | Avoid scary warnings while editing normally. |
| Reviewing | Primary disabled/loading; toast says Hito is validating | No persistence yet. |
| Review success | Status `Ready`; show compact review readback; primary becomes `Save Workout` or `Save edited workout` | Keep deterministic backend review primary. |
| Validation error | Inline field errors near the responsible field plus compact blocked summary | Do not rely only on toast. |
| Saving | Footer primary shows saving; close disabled if save in flight | Prevent accidental close during mutation. |
| Save success | Toast success; close dialog and refresh from saved truth | Do not trust local optimistic row as final. |
| Disabled/read-only | Controls visible as read-only or replaced by readback; explain why edit is blocked | Used for protected/unsupported states. |
| Dragging | Drag overlay compact; original row dimmed; valid targets highlighted | Works in dark/light themes. |
| Invalid drop | Target rejects with disabled cursor/helper | No silent no-op. |
| Mobile/narrow | Single-column fields; touch-visible actions; sticky footer | Exact 375px no horizontal overflow. |

## Create Flow

1. User chooses Add activity / template / scratch from an eligible date.
2. Editor opens with the selected date and draft title.
3. User edits title, structure, targets, notes, row order, and added sections.
4. User clicks `Review workout`.
5. Backend validates and returns review or blocked state.
6. User confirms `Save Workout` / add to plan.
7. Frontend closes editor and refreshes from saved plan truth.

## Edit Flow

1. User opens `Edit training` from any confirmed non-rest workout on today or a future date.
2. Editor opens in loading/reconstructing state.
3. Backend reconstructs the persisted row into manual draft input.
4. User edits through the same editor controls used by create.
5. User clicks `Review edit`.
6. Backend validates edited draft and returns review token/checksum.
7. User confirms `Save edited workout`.
8. Backend updates the same `planned_workouts` row and returns refreshed truth.

If reconstruction fails, show `Edit unavailable` with the backend reason and no fake editor.

## Backend-Shaped View Model Expectations

Frontend may hold draft UI state, but backend owns:

- whether edit is allowed;
- reconstructing persisted workout into draft input;
- valid block types and target modes;
- review issues and conflicts;
- review token/checksum;
- save/confirm mutation;
- refreshed plan/calendar truth;
- protected-state reasons.

Frontend must not send persisted row metadata, week numbers, source kind/status, or generated
targets as mutation authority.

## Accessibility Requirements

- Dialog has labelled title and description.
- Header title edit button/input has clear accessible name.
- Drag handles expose labels such as `Move Warm-up` and keyboard alternatives.
- Keyboard reorder supports move up/down at minimum; drag-only is not acceptable.
- Announce reorder results through an `aria-live` region or equivalent.
- Row action menu items include object names, e.g. `Duplicate Warm-up`, `Delete Walk`.
- Focus returns to the moved/edited row after reorder, add, duplicate, delete, review, or validation.
- Touch targets are at least 44px where practical, especially drag handles, Add Section, and row menus.
- Status colors are paired with text labels or icons; do not rely on color only.
- Dark and light theme states must both preserve contrast for labels, helper/error copy, focus rings,
  row backdrops, and drop indicators.

## Responsive Rules

Desktop:

- Dialog can use a two-column field grid inside rows where space permits.
- Structure preview remains near the top.
- Footer actions stay right-aligned.

Tablet:

- Keep dialog width comfortable; avoid compressing target fields into illegible columns.

Mobile / 375px:

- Full-height workflow dialog/sheet behavior.
- Single-column segment fields.
- Add Section and row action menu are visible/reachable without hover.
- Drag/drop may fall back to keyboard/tap reorder controls if pointer dragging is unreliable.
- Footer uses stacked or full-width buttons if needed.
- No horizontal scroll.

## Light And Dark Theme Rules

- Use Hito DS semantic tokens only.
- Do not copy raw Figma colors or Figma token names.
- Segment/repeat colors use existing workout and section color tokens.
- Hover backdrops, drop indicators, and card surfaces must be checked in both dark and corrected
  light theme.
- Orange/signal is for selected/review/action emphasis; do not turn every row into an orange card.

## Copy Intent

Keep copy operational and short:

- `Draft`
- `Review workout`
- `Review edit`
- `Save Workout`
- `Save edited workout`
- `Add Section`
- `Reconstructing saved workout`
- `Edit unavailable`
- `Hito is validating the edited workout before anything is saved.`

COPY may refine labels later, but Frontend should not introduce long explanatory paragraphs in the
editor.

## What Must Stay Primary

- The workout title and date.
- The structure preview.
- The ordered segment/repeat document.
- The backend review/save action.

## What Must Stay Secondary

- Template/source explanation.
- Advanced row actions.
- Technical backend/review details.
- Raw validation payloads.
- Saved-template management beyond the current picker/action surface.

## Acceptance Criteria

- Create and eligible persisted edit use the same editor anatomy and shared components.
- Existing backend manual workout constructor/review contracts remain the mutation authority.
- The visual order matches the screenshot: dialog header, document lead icon/header input, workout
  structure, Add Section, editable segments/repeats, notes, footer.
- The top document lead uses a quiet no-border icon control and same-height header input/readback.
- The filled compact editor state uses the same shell and lead-row height rhythm.
- Filled compact segment rows show title/target summary on the left and duration on the right.
- Filled compact repeat groups show repeat count in the left gutter, e.g. `x3`, aligned with the
  repeated child row stack.
- Workout preview/readback uses the same compact document grammar as filled compact editor mode:
  structure timeline plus compact segment/repeat rows, not a separate timeline-only presentation.
- Filled compact mode exposes hover/focus section states, row action ellipsis, drag/reorder
  affordances, and Add Section between blocks when editing is allowed.
- Workout detail preview does not show edit affordances unless the backend says the workout is an
  editable manual workout in a safe future/editable state.
- Expanded editable section blocks use compact `Visible label`, `Duration`, and `Target` fields.
- Time quantity uses compound minute + second inputs; distance quantity uses compound kilometer +
  meter inputs.
- The rejected oversized form-builder layout is not present: no top-right Add Section CTA, no
  `Block label` wording, no big `Quantity` chip group, and no large inline target option cards.
- The editor supports visible Add Section insertion before, between, and after rows.
- Add Section appears below the structure preview and inside repeat groups, not only in row menus.
- Repeat groups begin with compact `Repeats` controls and contain same-anatomy draggable child
  segment blocks.
- Every interactive layer has states: default, hover section, row hover, focus-visible,
  selected/active, menu open, disabled/read-only, validation error, dragging, valid drop, and invalid
  drop where relevant.
- Reordering works for top-level rows and same-group repeat children, with keyboard fallback.
- Cross-group, cross-workout, date move, recurrence, and generated/imported content editing are not
  exposed.
- Loading, empty, error, review-ready, saving, success, disabled/read-only, dragging, valid-drop,
  invalid-drop, and mobile states are implemented.
- The editor is usable at exact `375px` without horizontal overflow.
- Dark theme remains aligned with the existing Figma-inspired sketch direction.
- Corrected light theme uses semantic tokens and remains readable.
- `/hitoDS` documents any new reusable DnD/insertion/row primitive states added for this work.

## Frontend Implementation Notes

- Prefer extracting a shared editor shell rather than duplicating create and edit dialogs.
- Reuse `ManualWorkoutConstructorEditor` as the starting seam; normalize visual anatomy rather than
  replacing it wholesale.
- If DnD requires a library, keep it frontend-only draft interaction and report why existing Hito
  primitives are insufficient.
- Add row action fallbacks for reorder and insertion even when drag/drop exists.
- Keep the current async toast pattern for review/save operations.
- If a backend edit capability or reason code is missing, stop and route to BACKEND instead of
  inventing frontend eligibility.

## Exact Next Frontend Prompt

```text
ROLE: FRONTEND

Task:
Implement the shared Hito manual workout create/edit editor UX contract.

Stage:
FRONTEND implementation / manual workout create-edit shared editor and drag-drop states.

Spec:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-07-11-manual-workout-create-edit-editor-ux-contract.md

Context:
Designer has defined one shared editor UX for creating a manual workout and editing confirmed
non-rest workouts on today or a future date. Product wants the editor to follow the provided Figma-style sketch:
dialog-style editor, date/title/status header, workout structure preview, editable segment and
repeat cards, visible label/duration/target/notes fields, Add Section insertion controls, Close,
Save Workout, and row actions. This must extend Hito DS primitives, not create a separate editor UI
kit.

The screenshot is the v1 anatomy target, not loose inspiration. Preserve the visible order:
dialog header -> quiet icon plus same-height header input -> Workout structure -> Add Section ->
editable segment/repeat blocks -> Notes or cues -> sticky footer.

Also preserve the filled compact editor behavior from `filed.png` and the Product-provided Figma
node: the lead icon remains the same height as the ghost/header input, compact rows show target
summaries and right-aligned durations, repeat count appears in the left gutter as `x3` beside the
repeated child stack, and Add Section appears on hover/focus between blocks when editing is allowed.

Also align the workout preview/readback state with the Product-provided preview Figma node. Current
source has a generic `WorkoutDocumentReadback` timeline+notes component and a separate compact
manual readback stack inside `ManualWorkoutConstructorEditor`. Do not leave manual workout preview
as a separate timeline-only surface. The target preview is the filled/read-only state of the same
manual workout document: document lead, structure timeline, compact segment/repeat rows, repeat
gutter, notes, and only truthful edit affordances.

Product explicitly rejected the oversized form-builder direction. Do not implement the section body
with a top-right Add Section button, `Block label` wording, large `Quantity` chips, or large target
option cards. The accepted section body is compact: row header, `Visible label`, compact `Duration`
fields, compact `Target` fields, then centered/revealed Add Section below the block.

For editable quantities, use compound Hito DS fields instead of formatted string inputs: `Time`
shows minutes plus seconds, and `Distance` shows kilometers plus meters. Compose those fields into
the existing backend-reviewed draft quantity shape; do not add new stored units or frontend-owned
normalization truth.

Root-cause requirement:
Fix the shared frontend editor anatomy. Do not patch create and edit separately. Reuse backend
manual workout constructor/review/persisted-edit contracts and existing Hito DS primitives before
adding anything new.

Required reading:
1. `AGENTS.md`
2. `agents/frontend.agent.md`
3. `skills/hito-frontend-design-system/SKILL.md`
4. `docs/tasks/frontend-specs/2026-07-11-manual-workout-create-edit-editor-ux-contract.md`
5. `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`
6. `docs/current-functional-map.md`
7. `src/components/manual-workout/*`
8. `src/lib/manual-workout-authoring/*`
9. `src/components/ui/*`
10. `src/components/hito-ds/*`
11. `src/styles/*`

Scope:
1. Create one shared editor shell/anatomy for manual workout create and eligible persisted manual
   edit. Use the current `ManualWorkoutConstructorEditor` seam as the starting point.
2. Preserve backend mutation truth:
   - create reviews/adds through existing manual workout draft review/add actions;
   - persisted edit reconstructs, reviews, and confirms through existing persisted edit actions;
   - frontend draft state is not persistence truth.
3. Update the editor visual hierarchy toward the sketch:
   - compact date/title/status header;
   - quiet left icon control with no heavy border;
   - icon control and `InlineEditableText` / header-input row have the same height;
   - structure preview near the top;
   - Add Section immediately below the structure preview;
   - segment and repeat rows as calm low-card surfaces;
   - segment row header first, then visible label, duration, and target fields;
   - use `Visible label`, not `Block label`;
   - use compact Hito DS select/field pairs for duration and target;
   - when duration quantity is `Time`, show minute and second inputs;
   - when duration quantity is `Distance`, show kilometer and meter inputs;
   - hide compound value inputs when quantity type is `No quantity`;
   - do not show large inline mode cards/chips for quantity or target modes;
   - repeat groups with compact `Repeats` controls first, then same-anatomy draggable child rows;
   - visible label/duration/target fields;
   - notes/cues textarea;
   - Close and primary Review/Save footer actions.
4. Implement filled compact editor mode using the same shell:
   - compact segment rows;
   - title and target summary on the left;
   - duration on the right;
   - repeat count in the left gutter as `x3` beside repeated child rows;
   - hover/focus section states reveal Add Section between blocks;
   - row hover reveals row action ellipsis and drag/reorder affordance;
   - no edit-only fields, Add Section, drag affordances, or destructive row actions when backend
     marks the workout protected/read-only.
5. Normalize manual workout preview/readback to the same compact document grammar:
   - reuse the document lead and structure preview;
   - show compact segment/repeat rows under the timeline;
   - keep repeat count in the left gutter;
   - keep past workouts and Rest placeholders read-only; preserve a separate reviewed edit action
     for generated/imported/logged/evidence-backed today/future workouts;
   - do not replace the compact rows with only the generic timeline+notes readback.
6. Implement Add Section insertion controls before, between, and after rows:
   - below the structure preview;
   - between top-level blocks;
   - inside repeat groups between child rows and at group bottom;
   - hover/focus-revealed on pointer devices;
   - always reachable on touch/mobile and via row action menus.
7. Implement or normalize drag/drop reordering for:
   - top-level segment rows;
   - whole repeat groups as top-level rows;
   - child rows within the same repeat group.
8. Provide keyboard-accessible reorder fallback and focus return after moves.
9. Keep cross-group moves, moving children out of repeat groups, dragging to another date, recurrence,
   and generated/selected/imported content editing out of scope.
10. Use existing Hito DS primitives/classes for dialog, buttons, fields, selects, textarea,
   dropdowns, inline editable text, status pills, row groups, icons, timeline, toasts, color tokens,
   and mobile adaptive menu/dialog behavior.
11. Implement and verify states for each interactive layer:
   - default;
   - hover section;
   - row hover;
   - focus-visible;
   - selected/active;
   - menu open;
   - disabled/read-only;
   - validation error;
   - dragging;
   - valid drop;
   - invalid drop.
12. If new reusable DnD/insertion/filled-row primitives are needed, make them small Hito DS-backed
   patterns and document their states in `/hitoDS`.

Validation:
- `git diff --check -- <touched files>`
- targeted lint/typecheck for touched frontend files
- run relevant manual workout validators if behavior or data shape changes
- browser inspect create and eligible persisted edit paths in dark and light themes
- capture desktop and exact `375px` screenshots for:
  - empty/scratch create;
  - template create with segment + repeat rows;
  - persisted edit reconstructing/loading;
  - review-ready state;
  - filled compact editor state with repeat `x3` in the left gutter;
  - validation blocked state;
  - drag/drop active state;
  - mobile Add Section/reorder fallback.
- verify no horizontal overflow at `375px`.
- verify generated/selected/imported today/future workouts receive the reviewed edit action without
  turning passive document text into inline controls.
- verify the screenshot-critical hierarchy is present:
  - no bordered lead icon button;
  - no structure preview below rows;
  - no Add Section hidden only inside menus;
  - no separate create/edit visual shells;
  - no card-per-field explosion.
- verify the rejected form-builder direction is absent:
  - no top-right Add Section as the main section insertion control;
  - no `Block label` wording;
  - no large `Quantity` chip group;
  - no large inline target mode cards.
- verify compound quantity input behavior:
  - `Time` uses minute and second inputs;
  - `Distance` uses kilometer and meter inputs;
  - invalid seconds/meters show normal Hito field errors;
  - backend review remains the final normalization authority.
- verify the filled compact editor screenshot-critical hierarchy is present:
  - icon height matches ghost/header input height;
  - row duration is right-aligned;
  - repeat count appears in the left gutter, not as a large top form control.
  - Add Section appears on hover/focus between blocks when editing is allowed.
- verify the workout preview screenshot-critical hierarchy is present:
  - preview uses the same compact document readback stack as the filled editor;
  - structure timeline is present but not the only readback content;
  - repeat gutter appears for repeat groups;
  - edit/add/reorder inline affordances stay hidden in passive readback; past/Rest remain unavailable,
    while today/future content editing opens through the reviewed action.

Stop conditions:
- Stop if the implementation would enable past workout or Rest-placeholder editing, bypass
  review/confirm, or discard logs, evidence, completion, provenance, or prior planned truth.
- Stop if backend editability metadata, reconstruction, review, or confirm semantics are missing for
  the requested edit path.
- Stop if the design would require a new visual system instead of Hito DS primitives.

Report:
Use the standard FRONTEND report. Include root cause, DS primitives reused, any new DS-backed
patterns added, backend contracts reused, validation evidence, screenshots/artifact paths, and
blockers.
```

## Blockers

The shared editor design is not blocked. Runtime availability still depends on backend reconciliation
of the canonical today/future cross-origin contract and durable pre-edit history.

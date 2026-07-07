# Hito Inline Editable Text Pattern Contract

## Status

proposed

## Owner

Designer

## Last Updated

2026-07-07

## Type

frontend_spec

## Priority

high

## Next Recommended Role

frontend

## Source Of Truth

- Active plan: `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- Accepted generated-plan UX spec: `docs/tasks/frontend-specs/2026-07-07-generated-plan-real-user-experience-design-pass.md`
- Product truth: `docs/current-product.md`
- System truth: `docs/current-system.md`
- Functional map: `docs/current-functional-map.md`
- Accepted QA evidence: `qa-artifacts/screenshots/2026-07-07/generated-plan-workout-document-readback-polish-qa/`
- Current pilot component: `src/components/ui/editable-heading.tsx`
- Current pilot usage: `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`
- Workout readback reference: `src/components/workout-structure/WorkoutDocumentReadback.tsx`
- DS reference surface: `src/routes/hitoDS.tsx`
- Admin work-item seam: `src/routes/admin.capture.tsx`, `src/lib/admin-capture.ts`

## Root-Cause Check

Visible symptom:

- Hito now has a useful inline editable-heading pilot in the manual workout constructor, but the
  pattern is not yet centrally documented. Future surfaces could add one-off pencil icons, hover
  editors, or visual-change menus with different states and unsafe edit boundaries.

Likely underlying cause:

- Inline text editing, read-only affordances, and visual change-task capture are not yet owned by a
  shared Hito DS interaction contract.

Canonical owner:

- Hito DS interaction pattern and Frontend component contract first. Admin Capture / Work Items own
  any future persisted change-task creation. Backend plan-generation semantics and generated workout
  truth are not the owner of this slice.

Root-cause direction:

- Promote the accepted editable-heading pilot into a documented Hito DS pattern, then add a separate
  non-mutating "create change task" affordance for admin/design-debug contexts. Do not treat generated
  workout readback as directly editable unless backend capability metadata later explicitly allows it.

## Context

Generated-plan creation and workout-document readback are now accepted for first real-user use. The
accepted UX polish introduced a safe editable-heading pilot only inside an editable manual workout
constructor context. Generated rows remain read-only, backend generated-plan truth is unchanged, and
QA passed desktop plus exact `375px`.

The next risk is not visual polish of that one pilot. The risk is pattern drift:

- one surface edits text directly;
- another surface creates a task to change text;
- another uses a pencil icon for read-only generated content;
- another silently implies a component can be deleted or its spacing changed.

Hito needs one inline editable text/editor contract that separates direct content mutation from
admin/design work-item capture.

## Accepted Pilot Evidence

Accepted QA evidence used:

- `manual-intervals-editable-heading/03-constructor-desktop.png`
- `manual-intervals-editable-heading/04-constructor-375.png`
- `generated-10k-ready/04-endpoint-detail-desktop.png`
- `generated-10k-ready/06-endpoint-detail-375.png`
- `logging-affordance-fixture/01-today-workout-lifecycle-desktop.png`
- `logging-affordance-fixture/03-today-workout-lifecycle-375.png`

What the evidence proves:

- The manual constructor can show a heading-like value that gains a soft backdrop and edit affordance
  only where editing is real.
- The generated workout readback can remain compact and read-only at desktop and `375px`.
- The workout-document visual family can carry both readback and editable manual contexts without
  making generated rows mutable.

What the evidence does not prove:

- It does not prove generated workout rows can be edited.
- It does not prove inline edits can be persisted in every route.
- It does not prove Admin Capture can already create element-targeted visual tasks from any product
  surface.
- It does not validate a broad inline editor rollout across the product.

## Pattern Purpose

The Hito inline editable text pattern has two related but distinct purposes.

1. Direct edit

- The user changes a text value that is genuinely editable in the current product context.
- Example: manual workout title inside the manual constructor draft.
- The edit is a product mutation or local draft mutation.

2. Create change task

- The admin/designer creates a work item about a piece of UI or text.
- Example: "change this label", "remove this card", "reduce padding here", or "replace this custom
  field with a Hito DS input".
- This is not direct product mutation. It creates a task for another owner.

These two modes may share visual affordance anatomy, but they must not share product meaning.

## Pattern Families

### Inline Editable Text

Use when the current user can actually change the value.

Examples:

- editable manual workout title;
- editable manual workout section label when the manual constructor owns that draft field;
- saved template name if a backend-supported rename path exists;
- admin-created quick-note title/body if the Admin Capture seam owns the row.

### Inline Read-Only Text

Use when the text is product truth or generated truth and cannot be changed in this context.

Examples:

- generated plan preview rows;
- saved generated workout detail rows;
- imported plan truth without an approved edit path;
- provider/FIT evidence readback;
- backend validation or review facts.

Read-only text must not show an edit pencil in normal runner mode.

### Inline Change Target

Use only in admin/design-debug/capture contexts where the action creates a work item rather than
mutating the product value.

Examples:

- change this copy;
- delete this visible component;
- remove card chrome;
- reduce padding;
- fix alignment;
- replace a route-local control with a Hito DS primitive.

This pattern may target read-only product text because the action is a task, not a mutation.

## Allowed V1 Surfaces

Direct edit is allowed in v1 only where editability is already real:

- manual workout constructor title;
- manual workout constructor section/block labels if the current draft model owns those labels;
- future manual workout template names if an existing persistence path supports rename;
- admin-created quick notes or work-item text fields if Admin Capture owns the row mutation.

Change-task capture is allowed in v1 only as:

- `/hitoDS` specimen documentation;
- admin/internal capture mode if the existing Admin Capture / Work Items seam can accept the task
  without schema changes;
- a disabled or copy-only example when persistence is not yet wired.

Generated plan preview/detail rows stay read-only in normal product mode.

## Not Allowed In V1

Do not add direct inline editing to:

- generated plan preview rows;
- saved generated workout rows;
- provider/FIT comparison results;
- backend feasibility, validation, or review facts;
- logged workout evidence;
- system-owned plan metrics;
- route titles that do not already have a persistence contract.

Do not show a normal edit pencil where the only possible action is "create task". Use distinct copy,
icon, and menu language so users do not confuse task capture with live editing.

## Anatomy

### Direct Editable Text Anatomy

- Text/value slot: renders as normal Hito typography first, not as a bordered field.
- Optional meta/status: small pill or caption when needed, for example `Draft`.
- Hover/focus backdrop: soft, low-chrome wash that makes the editable target discoverable.
- Edit affordance: trailing icon or small `Edit` action, visible on hover/focus and always reachable
  on touch.
- Edit field: existing `hito-field` / Hito input primitive, matching text size as closely as possible.
- Helper/error row: optional and quiet.
- Commit/cancel controls: explicit for multi-line or async edits; implicit is acceptable only for
  simple local single-line draft edits.

### Change-Task Target Anatomy

- Target outline/backdrop: soft highlight of the text/component being referenced.
- Action affordance: `Create task`, `Suggest change`, or equivalent task-language action.
- Action menu: task categories, not product-edit controls.
- Optional selected-target summary: route, component label, current text, and category.
- Confirmation: quiet success toast/message after the task is created or copied.

The visual target can be text, a section, a component, a card/surface, or a spacing area. The action
must create a work item, not mutate UI live.

## States

### Normal / Read

- Looks like normal Hito text.
- No permanent border.
- No input chrome.
- Text hierarchy stays aligned with the surrounding surface.

### Hover

- Show soft backdrop using existing Hito surface/accent tokens.
- Reveal the relevant affordance:
  - `Edit` / pencil only for direct edit;
  - `Create task` / task marker only for capture mode.
- Do not change layout width or cause text reflow.

### Focus-Visible

- Match Hito focus-visible treatment.
- Focus ring must be distinct from hover backdrop and selected state.
- Keyboard users must reach the action without relying on hover.

### Edit

- Replace the read text with a Hito field that preserves the surrounding scale.
- Single-line title edits use a text input.
- Multi-line notes/cues use textarea behavior.
- The field must not create a new card or nested frame around the target.

### Disabled / Read-Only

- No edit affordance in normal product mode.
- Optional read-only explanation only when needed, for example in `/hitoDS`, admin debug, or a
  disabled action menu.
- Do not use disabled styling on ordinary read-only product copy if it would reduce readability.

### Validation / Error

- Keep the field open.
- Preserve the user's draft.
- Show error text with canonical Hito field error/helper rhythm.
- Do not silently revert invalid input.

### Saving / Pending

- Preserve the edited value visually.
- Disable duplicate commit while pending.
- Use a quiet spinner/pending indicator or toast only if persistence is async.
- Do not close the edit state if the save fails.

### Success / Review

- For local draft edits, return to read state quietly.
- For async persisted edits, a small success toast is acceptable.
- For changes that require review/confirm, show a `Review needed` or equivalent status, not a fake
  saved state.

### Empty

- Empty editable values show a quiet placeholder.
- Empty read-only generated truth should not show an editable placeholder.

## Interaction Rules

### Direct Edit

- Click/tap on the affordance enters edit mode.
- Single-line field:
  - `Enter` commits when the edit is safe and local/draft-owned;
  - `Escape` cancels;
  - blur may commit only for existing safe draft patterns.
- Multi-line field:
  - `Enter` inserts a line break;
  - `Cmd/Ctrl+Enter` may commit if implemented consistently;
  - explicit Save/Cancel controls are required.
- Async persisted edits require explicit Save/Cancel unless the current product already uses a safe
  local draft model.

### Change Task

- `Create task` opens a compact menu or dialog for the requested change.
- The menu must make it clear this is a work item, not a live mutation.
- The task should include enough target context for Frontend/Copy/Designer to act later.
- If persistence is not available, the action may be disabled in `/hitoDS` or copy a structured
  prompt only in internal/admin contexts. Do not ship a fake persisted task state.

## Keyboard And Accessibility Rules

- The read target or affordance must be keyboard reachable.
- Use a real `button` for entering edit mode or opening the change-task menu.
- Provide an accessible label, for example `Edit workout title` or `Create change task for section
  heading`.
- `Escape` cancels edit or closes the menu/dialog.
- Focus returns to the read target after commit/cancel.
- Validation errors connect through `aria-describedby`.
- Read-only generated content should not be announced as editable.
- Touch targets should remain at least `44px` even if the visual icon is smaller.

## Mobile And Touch Behavior

- Do not rely on hover for discoverability.
- On touch surfaces, show a compact trailing affordance or reveal actions on first tap with a stable
  second-tap path.
- Avoid long-press as the only entry point.
- The edit field must not overflow at `375px`.
- Change-task menus/dialogs should use existing Hito dialog/sheet/popover behavior rather than a
  custom mobile panel.

## Save / Cancel Policy

Use implicit commit only for:

- single-line local draft fields;
- existing safe manual constructor fields;
- no network/persistence latency;
- easy undo/cancel by `Escape` while editing.

Use explicit Save/Cancel for:

- persisted mutations;
- multi-line fields;
- destructive or broad changes;
- edits that may trigger validation;
- anything that creates a work item.

## Visual Change Task Categories

The change-task action should support a small, reusable taxonomy. The labels are implementation
placeholders and should receive COPY review before broad rollout.

### Text / Copy

- Change text.
- Shorten copy.
- Fix typo.
- Fix casing.
- Rename label.
- Make copy more human.

Default likely owner: `copy` when wording is the only change, `frontend` when the string is hardcoded
and no copy decision is needed.

### Component Presence

- Remove component.
- Hide section.
- Remove duplicate control.
- Move action into menu.
- Disable unavailable action.

Default likely owner: `designer` when the product hierarchy is unclear, `frontend` when the design
decision is already accepted.

### Surface / Chrome

- Remove card.
- Remove border.
- Replace card with divider.
- Reduce nested chrome.
- Make surface flatter.

Default likely owner: `frontend` if Hito DS already has the target primitive, `designer` if the
surface hierarchy decision is new.

### Spacing / Layout

- Reduce padding.
- Tighten gap.
- Align row.
- Fix vertical rhythm.
- Fix mobile stacking.
- Fix overflow or clipping.

Default likely owner: `frontend`.

### Hierarchy

- Demote heading.
- Raise heading.
- Make primary action clearer.
- Make secondary action quieter.
- Reduce badge emphasis.
- Move metadata near title.

Default likely owner: `designer` if hierarchy is ambiguous, `frontend` if a spec already exists.

### Hito DS Adoption

- Replace custom input with Hito field.
- Replace custom button with Hito button.
- Replace custom select/dropdown with Hito DS control.
- Replace custom icon with Hito icon.
- Normalize typography role.
- Normalize status/badge treatment.

Default likely owner: `frontend`.

### State / Behavior

- Add loading state.
- Add empty state.
- Add error state.
- Clarify disabled state.
- Clarify read-only state.
- Fix hover/focus behavior.

Default likely owner: `frontend`, with `designer` review if the state meaning is unclear.

### Accessibility

- Add accessible label.
- Fix keyboard focus.
- Increase hit target.
- Improve contrast.
- Fix truncation/readability.

Default likely owner: `frontend`.

## Change-Task Payload Contract

Do not invent a new persistence model in this spec. When the existing Admin Capture / Work Items seam
can accept the task, the UI should provide a bounded payload shaped like:

- route/path;
- surface name;
- component or element label if known;
- current text if text exists;
- selected task category;
- requested change;
- optional proposed replacement text;
- optional screenshot/file path if already available;
- target role;
- priority;
- source: `inline_change_task`;
- read-only/generated truth flag if the target is not directly editable.

If the current backend/admin seam cannot persist this payload without schema work, Frontend should
document the gap and keep the task action as `/hitoDS` specimen or disabled internal affordance.

## Hito DS Reuse Rules

Reuse existing Hito DS primitives before adding anything:

- typography roles: page title, section title, panel title, body, label, helper text;
- fields: `hito-field`, field helper/error rhythm, textarea where needed;
- buttons/icon buttons: existing primary/secondary/ghost/icon behavior;
- menu/popover/dialog patterns from current DS/admin surfaces;
- status pills/badges for draft/review/read-only status;
- focus-visible and hover tokens from `src/styles.css`;
- admin work-item patterns for task capture and copy prompt behavior.

Do not introduce:

- a route-local inline editor family;
- a special generated-plan editor;
- a new visual issue tracker UI kit;
- a new icon system;
- custom browser-native inputs outside Hito DS;
- hover-only controls.

## `/hitoDS` Documentation Requirements

Add a small, low-card Hito DS section for inline editable text.

It should show:

- Direct editable heading: normal, hover, focus-visible, edit, error, disabled/read-only.
- Direct editable small label/value.
- Multi-line editable note with explicit Save/Cancel.
- Read-only generated row example with no edit affordance.
- Change-task target example with `Create task` affordance and task-category menu.
- Mobile/touch note: no hover-only affordance.
- A short "Use for / Do not use for" footer row using existing playground anatomy.

Do not make the DS example a giant card gallery. Use the accepted `/hitoDS` playground anatomy:
neutral preview/stage, compact controls, and reusable footer/caption rows.

## First Frontend Rollout Batch

Recommended first batch:

`Promote editable heading pilot into Hito DS documentation and add a non-mutating change-task specimen`

Scope:

1. Keep the existing manual constructor editable-heading behavior working.
2. Rename/extract only if needed so the primitive reads as Hito-owned, not route-local.
3. Add `/hitoDS` examples for direct editable text and read-only text.
4. Add a `/hitoDS` example for change-task targeting that does not mutate generated content.
5. Do not wire broad runtime capture unless the existing Admin Capture seam supports it without
   backend/schema changes.
6. Do not add inline edit affordances to generated workout readback.

Why this is the smallest safe batch:

- It preserves the accepted pilot.
- It documents the pattern before broader rollout.
- It gives Frontend a shared component/state contract.
- It gives Product/Admin a place to decide later whether element-targeted work-item creation needs
  a backend extension.

## QA Expectations

Frontend QA for the first batch should prove:

- manual constructor editable heading still edits where editability is real;
- generated workout readback remains read-only;
- `/hitoDS` examples show normal, hover/focus, edit, disabled/read-only, validation/error, and
  change-task states;
- keyboard entry, `Escape`, commit, and focus-return behavior work;
- exact `375px` does not overflow;
- no fake persisted work item is shown when persistence is not wired;
- no route-local custom editor is added outside the shared primitive/pattern.

## Risks

- If the edit icon appears on generated readback, runners may think generated plan truth is mutable.
- If change-task capture looks like direct editing, admin/debug tooling will blur product behavior.
- If hover is the only affordance, mobile and keyboard users will miss the action.
- If task categories are too broad, the tool becomes a fake issue tracker instead of a lightweight
  Hito work-item capture seam.
- If `/hitoDS` demonstrates too much chrome, product teams may copy a heavy editor pattern.

## Out Of Scope

- Generated workout content editing.
- Backend plan semantics.
- Provider/FIT comparison acceptance.
- Supabase schema changes.
- Live OpenAI behavior.
- Broad Work Items redesign.
- Visual capture overlay implementation.
- Manual workout CRUD beyond already accepted editable manual contexts.
- Copy-final naming for every task category.

## Acceptance Criteria

- Hito has one documented inline editable text pattern.
- The spec separates direct edit from create-change-task behavior.
- V1 allowed surfaces are explicit.
- Generated rows remain read-only unless future backend capability metadata says otherwise.
- `/hitoDS` can document the pattern without a new UI kit.
- The first Frontend batch is bounded to one owner and one validation story.

## Exact Frontend Handoff Prompt

```text
ROLE: FRONTEND

Task:
Promote the accepted editable-heading pilot into a Hito DS inline editable text pattern and document the non-mutating change-task affordance.

Stage:
FRONTEND implementation / Hito DS inline editable text pattern slice 1.

Plan/spec:
/Users/ivan/Library/Mobile Documents/com~apple~CloudDocs/4-web/hito-running/docs/tasks/frontend-specs/2026-07-07-hito-inline-editable-text-pattern-contract.md

Context:
Generated-plan creation and workout-document readback are accepted. The manual workout constructor has a QA-passed editable-heading pilot, but inline editing is not yet a shared Hito DS pattern. The root issue is pattern ownership: direct editable text, read-only generated truth, and admin/design change-task capture must not become route-local one-off editors.

Root cause and architecture fit:
- Visible symptom: one editable-heading pilot exists, but future surfaces could add inconsistent pencil icons and unsafe inline editors.
- Underlying cause: Hito DS does not yet own inline editable text states, read-only boundaries, mobile discoverability, and change-task affordances.
- Canonical owner: Hito DS/shared Frontend primitive and `/hitoDS` documentation. Admin Capture / Work Items owns any future persisted task creation. Backend generated-plan semantics are not in scope.
- Reuse first: inspect `src/components/ui/editable-heading.tsx`, `src/components/manual-workout/ManualWorkoutConstructorEditor.tsx`, `src/routes/hitoDS.tsx`, `src/components/hito-ds/*`, `src/styles.css`, and existing Hito DS field/button/menu/dialog primitives before adding anything.

Scope:
1. Preserve the existing manual constructor editable-heading behavior.
2. Promote, rename, or document the pilot as a Hito-owned inline editable text primitive only if that is the smallest safe implementation.
3. Add `/hitoDS` examples for:
   - direct editable heading normal/read, hover, focus-visible, edit, disabled/read-only, and validation/error states;
   - read-only generated row with no edit affordance;
   - non-mutating `Create task` / change-task target specimen with categories such as change text, remove card, reduce padding, and replace custom control with Hito DS primitive.
4. The change-task specimen must not claim persisted task creation unless the existing Admin Capture seam already supports it without backend/schema changes. If persistence is not available, keep it as a documented specimen/disabled internal affordance and report the gap.
5. Do not add direct edit affordances to generated plan preview/detail rows.
6. Do not create a new route-local editor family, visual bug tracker kit, icon system, or custom inputs.

Validation:
- Run targeted lint/type/build checks required by the touched files.
- Verify `/hitoDS` renders the new examples.
- Verify the manual constructor editable heading still works.
- Verify generated workout readback remains read-only.
- Verify exact 375px does not overflow.
- Report Hito DS primitives reused and any custom element left behind.

Stop conditions:
- Stop if implementation requires backend schema changes, generated workout editing, new plan semantics, provider/FIT comparison, live OpenAI behavior, or a broad Work Items redesign.
- Stop if the first implementation batch cannot remain one Frontend-owned slice with one validation story.
```

## Blockers

none

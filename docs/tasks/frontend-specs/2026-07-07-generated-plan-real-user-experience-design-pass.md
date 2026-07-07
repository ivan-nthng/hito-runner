# Generated Plan Real-User Experience Design Pass

## Status

completed

## Owner

Designer

## Last Updated

2026-07-07

## Type

frontend_spec

## Priority

high

## Next Recommended Role

designer

## Source Of Truth

- Active plan: `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- Product truth: `docs/current-product.md`
- System truth: `docs/current-system.md`
- Functional map: `docs/current-functional-map.md`
- Workout lifecycle IA: `docs/tasks/frontend-specs/2026-06-15-workout-detail-lifecycle-ia-spec.md`
- Manual constructor IA: `docs/tasks/frontend-specs/2026-06-10-manual-user-built-plan-flow-spec.md`
- Backend QA evidence: `qa-artifacts/screenshots/2026-07-06/generated-plan-early-phase-dosing-qa/`
- User reference, editable constructor: `/Users/ivan/Desktop/Dialog.png`
- User reference, filled/readback workout: `/Users/ivan/Desktop/filed.png`
- User reference, editable heading hover: `/var/folders/3y/5cpksv511mdbm91rqfggw76h0000gn/T/TemporaryItems/NSIRD_screencaptureui_29TrFz/Screenshot 2026-07-07 at 08.56.52.png`
- Accepted QA evidence: `qa-artifacts/screenshots/2026-07-07/generated-plan-workout-document-readback-polish-qa/`

## Acceptance Closeout

Implemented and QA-accepted on 2026-07-07 as:

- shared generated-plan workout-document readback for preview/detail;
- compact structure strip, semantic stripes, child rows, and secondary notes/cues;
- proof/debug copy demoted out of normal runner-facing hierarchy;
- generated rows kept read-only;
- safe editable heading validated only in editable manual constructor context;
- Today generated-row lifecycle CTA still opens completion;
- desktop and exact 375px overflow, console/pageerror/bad HTTP, and disposable cleanup proof passed.

This spec is now historical implementation guidance plus accepted product/DS boundary. The next
design gap is the broader Hito inline editable text/editor pattern, not another generated-plan
readback polish pass.

## Root-Cause Check

Visible symptom:

- Generated-plan creation is backend/product-ready, but the first real-user UI still reads too much
  like a proof surface: preview facts, endpoint proof, validation labels, and long workout-detail
  instruction lists are technically correct but not yet calm enough for normal runners.

Likely underlying cause:

- Backend now returns rich child-first workout truth, but frontend readback still mixes older
  diagnostic review UI with saved workout detail UI instead of using one reusable workout-document
  anatomy.

Canonical owner:

- Frontend rendering view model plus Hito DS primitive coverage.

Root-cause direction:

- Keep backend plan semantics fixed. Reuse backend-shaped generated-plan truth and existing Hito DS
  controls to create one clearer readback/editing visual family across preview, saved detail, and
  manual edit contexts.

## Accepted Backend Boundary

Do not change:

- `planGoalIntent` semantics.
- Generated-plan feasibility rules.
- Review token/checksum or confirm exactness.
- Saved plan persistence.
- Source kind or goal metadata.
- Metric truth rules.
- No-fake executable pace or HR rules.
- Child-first repeat structure.
- OpenAI/local fixture generation behavior.
- Provider/FIT upload or comparison acceptance.

Design may improve only how accepted truth is displayed and acted on.

## Evidence Used

QA evidence confirms the backend path is product-ready:

- `beginner-10k-110/02-preview-desktop.png` shows reviewed 10K preview with dense fact panels,
  calendar preview, endpoint proof, goal readback, and segment readback.
- `beginner-10k-110/03-saved-calendar-desktop.png` shows saved calendar readback with correct
  generated rows and no desktop overflow.
- `beginner-10k-110/04-endpoint-detail-desktop.png` and `06-endpoint-detail-375.png` show saved
  generated workout detail with child-first repeat structure and long segment instructions.
- `boundary-aggressive-10k-45-from-36-5k/03-nonready-dialog-desktop.png` and
  `boundary-impossible-marathon-week/03-nonready-dialog-desktop.png` show clear non-mutating
  nonready states.
- `manual-authoring-smoke/03-constructor-desktop.png` confirms the current manual constructor path
  exists, but its visual language does not yet match the user-provided constructor target.

User reference images add the desired visual direction:

- `Dialog.png`: editable workout-document dialog with a compact header, top structure strip, DS
  inputs/selects, row-based block editing, hover/focus insertion controls, notes, and sticky footer.
- `filed.png`: compact filled/readback workout-document dialog with the same structure strip and
  simplified rows.
- `Screenshot 2026-07-07 at 08.56.52.png`: editable heading/value pattern where a normal heading
  gains a soft backdrop and edit affordance on hover/focus.

## Original UX Problems

1. The preview dialog is trustworthy but too diagnostic.

- Labels like `Validation`, `Endpoint proof`, `No fake pace`, `No fake personal HR`, and backend
  fallback wording are useful proof for us, but too prominent for a first runner review.
- The runner needs to answer: what plan am I about to create, when does it start, what does the goal
  day look like, and what assumptions matter?

2. Workout detail is rich but visually over-explains the workout.

- The endpoint detail page shows good child-first structure, but the long `Segment instructions`
  list reads like a source audit.
- Repeated labels `GUIDANCE`, `EFFORT`, `FOCUS`, and `NOTE` are useful but should be secondary
  disclosure, not the dominant page rhythm.

3. Preview and saved detail do not yet share one clear workout-document language.

- Preview segment cards, workout detail rows, and manual constructor rows all solve similar anatomy
  problems differently.
- This creates avoidable drift where one canonical generated workout truth has several visual
  grammars.

4. Edit affordance risk exists around generated rows.

- The lifecycle spec and current functional map keep generated/selected/preset/imported content
  editing out of scope unless backend has explicitly approved that row source.
- If an `Edit training` affordance appears for generated rows, Frontend must prove it is backed by
  existing source capability metadata. Otherwise it should not appear as a live action.

5. A small Hito DS primitive gap is now visible.

- The editable heading/value pattern in the user screenshot is reusable: it looks like normal text
  until hover/focus, then shows a soft backdrop and edit affordance.
- This should be a Hito DS-owned pattern, not a route-local input hack.

## Design Goals

- Make the accepted generated-plan path feel understandable for first real users.
- Keep deterministic backend truth primary while reducing proof/audit noise.
- Reuse one workout-document anatomy for generated preview, saved workout detail, and manual edit
  contexts.
- Keep editable controls only where the backend already allows editing.
- Preserve Hito's calm, editorial, athletic, premium, low-card direction.
- Use existing Hito DS primitives before adding anything new.

## Accepted Frontend Batch

Accepted bounded polish batch:

`Generated plan workout-document readback and safe editable heading pattern`

This batch implemented:

- Create or extract one shared workout-document readback anatomy from existing preview/detail/manual
  pieces.
- Apply compact readback anatomy to generated-plan preview sample/endpoint workout and saved
  generated workout detail.
- Add the Hito DS `editable heading/value` pattern only where a heading or label is truly editable.
- Keep manual constructor Add block/insertion behavior aligned with the user reference only in
  editable manual contexts.
- Keep generated-plan preview and generated saved detail read-only unless current backend capability
  metadata explicitly allows editing that source row.

This is not a full onboarding redesign, not a generation semantics change, and not provider/FIT
work.

## Information Hierarchy

### Quick Setup

Keep the current setup shell. Do not redesign onboarding in this batch.

Recommended hierarchy:

1. Runner baseline and setup fields.
2. Goal cards / custom distance selection.
3. Race day and finish time as optional goal intent.
4. Primary action: `Create plan` / preview generation.
5. Generated preview opens as review-before-create.

Do not add plan quality claims locally. Do not label cards as product programs.

### Preview Dialog

Primary runner question:

- "Is this the plan I want to create?"

Top hierarchy:

1. Goal label and title, for example `10K plan preview`.
2. Short review copy: reviewed draft, not saved yet.
3. Compact plan summary: duration, start date, running days, long run day, goal date/time, metric
   truth.
4. A compact calendar preview.
5. A workout-document readback for the selected/endpoint day and one representative day.
6. Footer: `Refresh preview`, `Create plan`, status pills.

Demote:

- endpoint proof ids,
- validator wording,
- checksum/review mechanics,
- repeated no-fake labels,
- backend fallback/source labels.

These can remain as quiet supporting copy or debug-only details if already needed for support.

### Saved Calendar Readback

Keep the current calendar grid and saved shell. No calendar redesign in this batch.

Small polish target:

- Make generated-plan confidence come from the selected day/workout detail, not from extra calendar
  chrome.
- Calendar cells should continue using backend family/icon truth.

### Generated Workout Detail

Primary runner question:

- "What should I do on this day?"

Top hierarchy:

1. Date, week/phase, type, title.
2. Distance/duration/load metrics if already supplied.
3. Lifecycle action: future action, today completion, or completed readback.
4. Workout structure strip.
5. Compact workout-document rows.
6. Secondary details/disclosure for execution assumptions, metric mode, and goal context.
7. Previous/next navigation.

Replace the current audit-like segment instruction emphasis with a calmer readback:

- top structure strip first,
- compact rows next,
- guidance/cues inside row detail or secondary disclosure,
- right-side panels stay supportive, not dominant.

### First-Workout Logging Affordance

Keep logging lifecycle truth:

- Today's planned workout shows `Mark as done`.
- Past unlogged shows `Add result`.
- Feedback remains gated to actual evidence/comparison truth.

Do not add Garmin/FIT comparison prompts as part of this generated-plan batch.

## Workout Document Anatomy

This is the core reusable UI grammar.

### Readback Mode

Use for:

- generated-plan preview sample/endpoint workout,
- saved generated workout detail,
- review state after a manual workout draft is ready,
- any non-editable planned workout readback.

Anatomy:

- compact header with date/title/status if inside a dialog;
- workout identity row with glyph/type/title;
- `Workout structure` label and right-aligned meta, for example `55 min · 3 steps`;
- existing `WorkoutStructureTimeline` / `IntervalsViz` style segmented strip;
- compact row list:
  - ordinal,
  - semantic color stripe,
  - runner-facing label,
  - target or cue summary,
  - duration/distance on the right;
- repeat groups show one `xN` marker outside or beside nested rows, not a separate heavy card;
- notes/cues use a single quiet block.

Do not use:

- a bordered card per segment,
- a proof/debug tile per metric,
- repeated all-caps diagnostic labels as primary content,
- `Add block` / `Add section` controls in readback mode.

### Editable Mode

Use only for:

- manual workout creation,
- backend-approved persisted future manual workout edit,
- any later generated edit only after backend explicitly accepts generated-row reconstruction/edit
  semantics.

Anatomy:

- same bounded dialog/sheet family as the reference;
- title/date/status header;
- Hito DS editable heading/value for title when editable;
- structure strip at the top;
- row-based block editor with Hito DS inputs/selects;
- Add block insertion affordance above/between blocks and inside repeat groups;
- notes/cues textarea;
- sticky footer with safe secondary action and primary review/save action.

Do not expose editable mode for generated rows just because the UI can render the editor.

## Hito DS Reuse

Reuse existing primitives/patterns:

- `hito-product-dialog`, `hito-product-dialog-header`, `hito-product-dialog-body-scroll-fill`,
  `hito-product-dialog-footer`.
- `hito-button` variants for primary, secondary, ghost, and icon-like actions.
- `hito-field`, `hito-field-primary`, `hito-textarea-md`, `Select`, dropdown/menu primitives.
- `hito-status-pill`, `hito-row-group`, `hito-list-row`, dividers, and row groups.
- Hito typography roles: `hito-modal-title`, `hito-panel-title`, `hito-list-row-title`,
  `hito-body-small`, `hito-field-helper`, `hito-label`.
- `WorkoutStructureTimeline` and `IntervalsViz` for segmented structure visualization.
- `WorkoutGlyph` and backend-provided workout family/icon truth.
- Manual constructor helpers/components where they already own block editing.

Potential new Hito DS primitive:

- `Editable heading/value`

Rationale:

- Current Hito DS covers fields and buttons, but not a heading-like value that reads as plain text
  until hover/focus and then reveals an edit affordance.
- The pattern is useful for workout titles, section labels, saved template names, and future admin
  work-item titles.

The primitive must remain small and reusable. It should not create a new form system.

## Editable Heading / Value Pattern

Normal state:

- Looks like the assigned typography role, usually a panel/title scale.
- No visible border.
- No input chrome.

Hover/focus-visible state:

- Soft Hito surface/backdrop appears behind the value.
- Edit icon or text action appears on the trailing edge.
- Cursor/interaction target is clear.

Edit state:

- Uses a real Hito DS input/textarea, not custom browser-default styling.
- Preserves the surrounding height as much as possible.
- Escape/cancel and blur/save behavior must be explicit and accessible.

Accessibility:

- Must be reachable by keyboard.
- Hover reveal cannot be the only way to discover editing.
- Focus-visible ring must be distinct from selected/active visual state.
- Announce edit action with a clear label, for example `Edit workout title`.

## Add Block / Add Section Affordance

Use the product-facing label `Add block` unless existing copy is already accepted elsewhere.

Where it appears:

- at the top of an empty editable block list;
- between top-level blocks on hover/focus;
- inside repeat groups between child blocks on hover/focus;
- persistently enough on touch/mobile that the action is not hidden.

Visual treatment:

- small Hito DS secondary or ghost button;
- centered divider/insertion line;
- no heavy card wrapper;
- menu/dropdown can expose block types if multiple choices exist;
- disabled or unavailable states must explain why review/editing is blocked.

Do not show this affordance:

- in generated-plan preview readback;
- in saved generated workout detail unless backend capability metadata says this source row is
  editable;
- in completed, logged, evidence-backed, protected, rest, or unsupported rows.

## State Specs

### Loading

Quick setup preview:

- Keep current loading state but make copy runner-facing: `Building preview` / `Preparing reviewed
  plan`.
- Disable create while preview is loading.
- Do not show fake progress percentages.

Workout document:

- Structure strip may show skeleton or quiet placeholder.
- Footer actions remain disabled until required backend review data exists.

### Empty

Preview:

- Before any draft exists, keep focus on setup fields and goal selection.
- Custom goal cannot preview until distance is valid.

Workout document:

- Readback mode: no rows means show `No workout structure available` only if backend actually
  returned no non-rest structure.
- Editable mode: empty means `Add block`, not generated filler.

### Error / Nonready

Impossible/aggressive preview states:

- Keep non-mutating dialog.
- Show one clear reason and one next action.
- Avoid backend error codes or internal terms as primary text.
- `Review required` remains disabled if no valid review token/checksum exists.

Copy intent:

- `This setup needs adjustment before Hito can create a safe plan.`
- `Adjust the goal details. Nothing has been created.`

### Success / Review

Preview ready:

- Show `Reviewed` and `Not saved yet`.
- Show compact plan summary, calendar preview, and workout-document readback.
- Primary footer action creates the reviewed draft.

Saved plan:

- Calendar opens with persisted plan truth.
- Workout detail uses saved data, not preview-only labels.
- Completion logging uses existing lifecycle action.

### Completed / Logged

- Manual result/completion readback stays in completion/result surfaces.
- Feedback appears only when evidence/comparison truth exists.
- Generated-plan polish must not imply provider evidence exists.

## Copy Reduction Rules

Keep primary:

- goal, duration, start date, running days,
- metric truth in runner terms,
- exact target date/finish-time readback where supplied,
- workout structure,
- completion/logging action.

Make quieter:

- `backend default/open`,
- `backend_fallback`,
- `Endpoint and workout-structure checks passed`,
- row ids,
- proof language,
- repeated no-fake labels,
- source model/provider labels.

Remove from normal runner-facing primary hierarchy:

- debug-like proof ids,
- validation gate names,
- source kind internals,
- exact contract/version labels.

Technical/support copy may remain in hidden details or QA/support-only areas if the product already
needs it.

## Responsive Behavior

Desktop:

- Preview dialog can stay wide, but the main review content should group into readable bands rather
  than multiple equal diagnostic cards.
- Workout-document readback should use full width for structure and rows.
- Sidebars remain secondary.

Mobile 375px:

- Dialog/sheet body scrolls internally.
- Footer stays reachable.
- Structure strip must not overflow.
- Row summaries should stack: label/target first, duration/distance second.
- Add block controls in editable mode must be visible through a tap-accessible action, not hover-only.

## What To Keep

- Current backend-shaped Quick setup flow.
- Review-before-create.
- Calendar preview and saved calendar route.
- Existing no-overflow behavior from accepted QA.
- Current lifecycle gating for today/future/completed/evidence-backed workouts.
- Existing manual constructor backend review/confirm boundary.
- Current Hito DS dark, low-chrome visual direction.

## What To Change

- Convert preview segment/workout readback from proof-card style to compact workout-document
  readback.
- Convert saved generated workout detail segment instructions from audit-like long list to compact
  rows plus secondary details.
- Add or document a Hito DS editable heading/value pattern and use it where editing is real.
- Align manual constructor title/add-block interaction with the reference only in editable manual
  contexts.
- Demote internal proof copy in generated preview/detail.

## What Must Not Change

- No backend generation semantics.
- No new frontend feasibility rules.
- No fake pace, fake personal HR, or fake target truth.
- No deterministic builder resurrection.
- No Plan Preset product-program framing.
- No provider/FIT comparison acceptance.
- No generated-row content editing unless existing backend capability metadata allows it.
- No broad onboarding redesign.
- No new component system outside Hito DS.

## Acceptance Criteria

- Quick setup still creates only through backend review/confirm.
- 10K, Half Marathon, Marathon, and Custom 15K preview/create flows still work.
- Impossible/aggressive states remain non-mutating and clear.
- Preview ready state shows a compact workout-document readback and no longer foregrounds backend
  proof terms.
- Saved generated workout detail shows the same workout-document visual language as preview.
- First-workout logging affordance remains lifecycle-honest and does not expose Feedback unless
  evidence exists.
- Editable heading/value is keyboard accessible and uses Hito DS input styling when editing.
- Add block affordances appear only in editable contexts and are reachable on mobile.
- No 375px horizontal overflow.
- `/hitoDS` is updated only if Frontend introduces the new editable heading/value primitive.

## Risks

- If Frontend treats the reference constructor as permission to edit generated workouts, the UI will
  cross backend truth.
- If the compact readback hides too much detail, runners may miss important metric-truth assumptions.
  Keep secondary disclosure for assumptions.
- If the editable heading pattern is route-local, Hito DS drift will grow. Make it a small shared
  primitive or class contract.
- If the preview keeps all current proof sections plus new readback, the dialog will get heavier
  instead of clearer.

## Resolved Implementation Questions

- Generated selected-plan rows remain read-only in the accepted UI proof.
- Frontend introduced shared workout-document readback presentation for generated preview/detail.
- The safe editable-heading pilot was validated only in editable manual constructor context. A broader
  Hito inline editable text/editor design-system contract remains the next design gate.

## Accepted Frontend Slice

Implemented:

1. Shared generated workout-document readback presentation for selected-plan preview and saved
   generated workout detail.
2. Hito DS editable heading/value pattern if needed by the constructor/title owner.
3. Constructor Add block insertion affordance alignment only for existing editable manual contexts.
4. Copy demotion of proof/debug wording in preview/detail.

Not implemented:

- generated workout content editing,
- backend changes,
- provider/FIT changes,
- new generation validation,
- broad onboarding restructure.

## Closeout Result

Accepted QA artifact:

`qa-artifacts/screenshots/2026-07-07/generated-plan-workout-document-readback-polish-qa/`

No further FRONTEND execution is needed for this spec. If additional inline editing work is desired,
start from a separate Hito DS inline editable text/editor design contract so future implementation
does not expand the route-local editable-heading pilot blindly.

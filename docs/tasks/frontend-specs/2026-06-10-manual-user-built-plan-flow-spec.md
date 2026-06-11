# Manual User-Built Plan Flow Spec

## Status
Draft, implementation-driving after architecture checkpoint.

## Owner
DESIGNER

## Last Updated
2026-06-10

## Source Of Truth
- Active plan: `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`
- Backlog source: `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`
- Running coach taxonomy: `docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md`
- Implemented calendar primitives: `src/components/ui/hito-calendar-day.tsx`
- Implemented calendar surface: `src/components/Calendar.tsx`
- Implemented DS playground reference: `src/components/hito-ds/calendar-workout-playground.tsx`
- Implemented manual authoring review seam: `src/lib/manual-workout-authoring/*`

## Root Cause Fit
Visible symptom: runners who do not want an AI/generated preset path need a way to build a plan themselves directly on the calendar.

Underlying cause: the product currently has generated-plan and review seams, but no canonical manual authoring interaction layer that maps user day actions to backend-reviewed workout drafts.

Canonical owner:
- Product truth and persistence: backend validation, normalization, review, confirm, and plan mutation.
- Interaction and rendering: frontend calendar, Hito DS day cells, dialogs/sheets, menus, and review states.
- Training structure: running-coach taxonomy and template library.

This spec does not patch the generated plan engine. It defines the manual authoring UI layer that reuses the existing calendar and calls backend-owned review/confirm seams.

## Design Direction
Manual plan creation should feel like editing a calendar, not filling a giant plan form.

The primary new entry is `Build my plan myself` when there is no active plan. The runner lands in an empty draft plan calendar and adds activities day by day. The visual language remains the current Hito calendar: calm, low-card, editorial, athletic, and operational.

Do not redesign:
- the saved-mode calendar visual system
- workout detail pages
- generated preset onboarding
- Hito DS primitives
- backend plan generation

Do reuse:
- Hito calendar day cells and rows
- Hito DS buttons, dropdowns, dialogs/sheets, inputs, choice toggles, status pills, dividers, and toasts
- manual workout authoring backend review output
- running-coach template taxonomy

## End-To-End Flow Map
1. No active plan state
   - User sees existing no-plan onboarding options.
   - Primary generated/preset paths may remain, but `Build my plan myself` is available as a clear manual alternative.
   - Choosing it creates a frontend draft workspace only. It does not persist a plan until backend confirm exists and the user explicitly saves.

2. Empty manual draft calendar
   - Calendar opens around the selected or default start date.
   - Days inside the draft horizon are empty, not rest days.
   - Empty days expose `Add activity` on hover/focus on desktop and as a row/action on mobile.
   - Outside-month and outside-plan dates remain muted and non-authoring.

3. Add activity
   - User opens the day action menu.
   - User chooses `Create workout`, `Choose template`, `Add rest day`, or `Paste copied workout` when a copy buffer exists.
   - Recurrence appears only as disabled/future copy if shown at all.

4. Template picker
   - User selects a backend-owned template view model.
   - Templates are grouped by runner-facing purpose, not by implementation key.
   - Selecting a template opens the constructor with the template prefilled.

5. Workout constructor
   - User edits title, workout type, blocks, duration/distance where supported, target guidance where truthful, and notes/cues.
   - Frontend sends structured draft input to backend review.
   - Backend returns either `draft_ready` review or `draft_rejected` issues.

6. Review and save
   - User reviews the normalized draft before it is added.
   - When confirm/persist exists, user can save the reviewed workout into the manual plan draft/active plan.
   - Until confirm/persist exists, UI must not claim the workout is saved.

7. Calendar after adding
   - The day now shows a workout/rest identity using the existing calendar day grammar.
   - The day has a more menu for edit, copy, save as template, delete/clear, and future recurrence.

8. Plan-level save
   - For a no-active-plan manual draft, the product needs an explicit plan creation boundary.
   - The first valid manual workout may open a plan-start review, or the user may use a draft-level `Save plan` action once at least one valid item exists.
   - The exact confirm boundary is backend/architecture owned.

## Entry Surface
### User Goal
Start building a plan manually without using a generated preset or free-text AI path.

### Primary Action
`Build my plan myself`

### Secondary Actions
- Continue with preset/generated path if still present.
- Advanced/custom path remains separate and secondary.

### Required Content Blocks
- Short explanation: manual plans start as an editable calendar.
- Clear note: Hito still checks workouts before saving.
- One primary manual action.

### Visible Status Language
- Neutral: `Build an empty plan calendar and add workouts yourself.`
- Review-aware: `Hito will review each workout before it is saved.`
- No fake promise: do not say `Saved` or `Active plan created` before confirm/persist exists.

### States
- Loading: use existing skeleton or subdued spinner while initial template eligibility/draft context loads.
- Empty: no active plan, show the manual entry alongside existing onboarding choices.
- Error: if draft workspace cannot initialize, show inline Hito error state with retry.
- Success/review: entering manual draft shows empty calendar plus draft status, not a completion toast.

## Draft Calendar Model
Manual draft calendar uses the same calendar surface, but changes the meaning of blank dates:
- Empty in manual draft means `no activity planned yet`.
- Rest means `user intentionally added a rest day`.
- Pre-start/outside-plan means `not part of this draft plan`.

The calendar must not render unfilled manual draft days as generated rest placeholders.

### Draft Header
Use a compact header:
- Title: `Build your plan`
- Supporting copy: `Add workouts to the calendar. Hito checks each workout before it is saved.`
- Right action slot: draft-level action when available, for example `Review plan` or `Save plan`.
- If confirm/persist is not wired, the draft-level save action must be disabled or omitted.

### Month Context
Show a subtle draft marker in the month header only when useful:
- `Manual draft`
- `0 workouts added`
- `3 workouts added`

Avoid a large hero or separate card above the calendar.

## Day-Cell States
### Empty Authorable Day
Purpose: a valid calendar date inside the draft horizon with no planned activity.

Desktop treatment:
- date number remains visible
- no workout glyph
- no `Rest` label
- no result or feedback marker
- hover/focus reveals a quiet `+` or `Add` affordance using existing action visual language
- active click opens the add menu

Mobile treatment:
- row or cell shows date plus a compact `Add` action
- no hover-only affordance
- tap target remains accessible

### Draft Workout Day
Purpose: a reviewed or locally edited workout exists for the day.

Treatment:
- use existing workout day state
- show broad-family workout glyph
- show short type label/title using existing calendar hierarchy
- show result/feedback markers only if backend truth exists
- show more menu affordance on hover/focus or persistently on mobile

### Draft Rest Day
Purpose: the user explicitly added rest as an intentional item.

Treatment:
- keep quiet, lower-density rest styling
- distinguish it from blank empty days with a small rest glyph/label only where the existing calendar can support it without clutter
- allow more menu actions: edit note if supported, copy if meaningful, delete/clear

### Outside Month Day
Purpose: calendar grid filler, not an authoring target.

Treatment:
- muted date
- no add affordance
- no workout/rest marker
- no workout detail link

### Outside Plan / Pre-Start Day
Purpose: real calendar date outside the manual draft plan range.

Treatment:
- follows existing outside-plan/pre-start DS contract
- no `Rest`
- no workout glyph
- no feedback/result marker
- no authoring menu unless architecture explicitly allows expanding the draft range

### Protected Existing Day
Purpose: a date cannot be changed because it has logged workout, provider evidence, actual metrics, comparison, AI insight, or another backend-owned protection.

Treatment:
- show the existing day truth
- authoring actions are disabled or replaced with a backend-shaped explanation
- do not let frontend infer the protection reason locally

### Copied Paste Target
Purpose: a day can receive a copied workout draft.

Treatment:
- do not add a permanent paste badge to every cell
- show paste in the add menu or mobile action sheet when a copy buffer exists
- optional subtle draft toolbar can say `Copied: <workout title> from <date>` with `Clear`

## Menu States
### Empty Day Add Menu
Trigger:
- desktop: hover/focus action or click on empty authorable day
- mobile: tap `Add` or day row action

Items:
- `Create workout`
- `Choose template`
- `Add rest day`
- `Paste copied workout` only when a copy buffer exists
- `Recurring workout` disabled/future-only if present

Rules:
- menu uses Hito DS dropdown/menu primitives
- menu items include optional Hito icons only if they improve scanability
- disabled future items must be visually quiet and not appear as available features

### Existing Day More Menu
Trigger:
- desktop: more affordance on workout/rest day
- mobile: persistent more button or long-press alternative only if accessible click path remains

Items:
- `Edit`
- `Copy`
- `Save as template`
- `Delete from draft` or `Clear day`
- `Make recurring` disabled/future-only

Rules:
- destructive actions stay visually quieter until selected, then use confirmation if persisted or protected
- existing doc/task-backed generated plans should not gain manual mutation controls in this slice unless explicitly in manual authoring mode

### Menu Loading / Error
- If menu data depends on backend template eligibility, show a small loading row.
- If template/menu data fails, keep `Create workout` available only if backend review can still run.
- If no safe actions exist, show disabled explanatory row.

## Template Picker Behavior
### User Goal
Start from a safe, coach-approved workout structure without authoring every block from scratch.

### Layout
Use a dialog or sheet, not a card wall:
- compact header
- search/filter only if template count becomes hard to scan
- grouped rows by purpose
- right or inline detail preview for selected template on desktop
- bottom sheet or single-column list on mobile

### Groups
Initial groups should map to the running-coach taxonomy:
- Rest and recovery
- Easy aerobic
- Long run
- Quality
- Hills and terrain
- Adaptation
- Saved templates, future-ready

### Row Anatomy
Each row:
- workout glyph
- template name
- short purpose line
- compact metadata pills, for example `Easy`, `Structure only`, `Editable HR default`
- disabled/ineligible reason if backend marks it unavailable

### Selection
Selecting a template opens the constructor with that template prefilled.

### States
- Loading: skeleton rows or `Loading templates...`
- Empty: `No templates available for this context.`
- Error: `Templates could not load. Try again.`
- Success: grouped rows visible
- Review: selected template transitions into constructor/review flow

## Workout Constructor Anatomy
### Container
Desktop:
- use Hito product dialog or right-side sheet depending on available app pattern
- keep one bounded surface with dividers, not nested cards
- allow internal scroll for long block lists

Mobile:
- full-height sheet or dialog
- sticky footer actions
- no two-column layout

### Header
- Title: editable workout title or template name
- Date metadata
- Workout type glyph/label
- Review status pill: `Draft`, `Needs review`, `Ready`, `Rejected`

### Body Sections
1. Identity
   - workout title
   - workout type
   - optional notes/cues

2. Structure
   - ordered workout blocks
   - block type
   - duration or distance
   - target guidance only if backend supports truth mode
   - repeat group presentation for supported repeat templates

3. Target Truth
   - show `Structure only`, `Editable HR default`, or equivalent backend-shaped wording
   - do not show precise pace or personal HR targets unless backend returns them as truthful

4. Backend Review
   - normalized summary
   - warnings/issues
   - conflicts/protections
   - review checksum/token remains technical and hidden unless needed for support/debug

### Footer
Before backend review:
- secondary `Cancel`
- primary `Review workout`

After `draft_ready`:
- secondary `Back to edit`
- primary `Add to plan` or `Save workout` only when confirm/persist exists
- if confirm/persist is not implemented, use `Reviewed draft` state and do not fake saving

After `draft_rejected`:
- secondary `Back to edit`
- primary remains disabled until issues are corrected

## Review State Contract
The review state is the core trust boundary.

Show:
- normalized workout title
- date
- type
- block summary
- target truth mode
- warnings or caveats
- whether anything will be persisted

Do not show:
- raw JSON
- backend checksum/token
- fake coach confidence
- fake AI adaptation
- precise pace/HR values not returned by backend truth

## Save As Template Behavior
Status: future-ready unless backend personal template persistence exists.

Entry points:
- existing day more menu
- constructor after `draft_ready`

Dialog anatomy:
- title: `Save as template`
- input: template name
- optional type/glyph inherited from workout
- preview of workout structure
- action: `Save template`

Rules:
- saved templates appear in the Template Picker under `Saved templates`
- do not allow saving invalid or rejected drafts
- do not present saved templates as global Hito templates unless backend owns that scope

States:
- Loading: saving template
- Empty: no saved templates yet
- Error: save failed with retry
- Success: template saved toast and picker row available
- Review: confirm template name/scope before save if needed

## Copy / Paste Behavior
Status: manual authoring convenience, still backend-reviewed before persistence.

Copy:
- available from existing day more menu
- copies a draft reconstruction, not a raw persisted row
- visible feedback: toast or subtle draft toolbar

Paste:
- available only when copy buffer exists
- appears in empty day add menu or mobile action sheet
- opens review/constructor for the target date before save
- backend validates target date and protections again

Rules:
- never paste over protected/logged/evidence days without backend-confirmed override flow
- never duplicate provider evidence, actual metrics, comparisons, or AI insights
- if source workout used future-only recurrence or unsupported structure, paste must route through backend review and may be rejected

## Delete / Clear Behavior
Delete and clear must match persistence risk.

Draft-only item:
- `Clear day` can remove the local draft item with lightweight confirmation only if unsaved edits would be lost

Persisted manual workout:
- `Delete from plan` requires confirmation
- backend owns whether delete is allowed

Protected item:
- delete disabled
- show explanation from backend conflict/protection state

Generated active plan item:
- not part of this manual first slice unless architecture explicitly expands manual editing to generated plans

## Desktop State Inventory
- `no_active_plan_entry`: manual entry visible
- `manual_draft_initializing`: draft workspace loading
- `manual_draft_empty`: calendar visible, no authored workouts
- `empty_day_idle`: empty authorable cell, date only
- `empty_day_hover`: add affordance visible
- `empty_day_focus`: focus ring plus add affordance
- `add_menu_open`: day menu visible
- `template_picker_loading`
- `template_picker_empty`
- `template_picker_error`
- `template_picker_success`
- `constructor_editing`
- `constructor_review_loading`
- `constructor_draft_ready`
- `constructor_draft_rejected`
- `constructor_save_loading`: only after confirm/persist exists
- `constructor_save_error`: only after confirm/persist exists
- `workout_added_success`: day updates, optional toast
- `copy_buffer_active`
- `paste_review`
- `delete_confirm`
- `protected_day_readonly`

## Mobile State Inventory
- `no_active_plan_entry_mobile`: stacked options, manual action visible without scrolling too far
- `manual_draft_empty_mobile`: calendar or day list uses touch-visible add actions
- `day_action_sheet_open`: add/more actions in sheet
- `template_picker_sheet`: single-column grouped rows
- `constructor_sheet_editing`: full-height sheet
- `constructor_sheet_review`: sticky footer actions
- `copy_buffer_bar`: compact, dismissible
- `protected_day_message`: inline in sheet, not tiny cell copy

Mobile rules:
- no hover-only controls
- no cramped 7-column authoring if labels/actions cannot fit
- key authoring actions must be reachable by tap
- sheets must keep footer actions reachable

## Hito DS / Component Reuse Map
Use existing primitives and patterns first:
- Calendar cell and row: `HitoCalendarDayCell`, `HitoWorkoutDayRow`
- Day action visual: existing `action` slot and `hito-button-xs` patterns
- Menus: existing dropdown/menu primitives
- Dialogs/sheets: existing Hito product dialog/sheet anatomy
- Buttons: `hito-button`, `hito-button-primary`, `hito-button-secondary`, `hito-button-ghost`, `hito-button-outline`
- Inputs: Hito field classes and input primitives
- Selects: existing Hito select/dropdown
- Choice controls: `hito-choice-toggle` where one-of-many choice is needed
- Status: `hito-status-pill`, metadata tags, semantic workout-state colors
- Toasts: existing Hito async/toast pattern for transient copy/save feedback
- Icons: Hito `Icon` primitive for generic UI icons; `WorkoutGlyph` remains the workout identity glyph family
- Playground reference: `/hitoDS#calendar-workout-playground`

Do not introduce:
- route-local calendar cell styling
- custom one-off dropdowns
- a separate manual-plan UI kit
- card-heavy template galleries
- local workout validation logic in React

## Backend Ownership
Backend owns:
- manual workout schema
- template registry and eligibility
- validation and normalization
- workout draft review
- review token/checksum
- target truth mode
- protected date and mutation safety
- confirm/persist for manual workouts
- active plan creation for `manual_user_built_plan_v1`
- source metadata
- copy/paste validation before save
- delete/clear permissions after persistence
- future personal template persistence
- future recurrence expansion

Backend must return UI-consumable reasons for:
- rejected draft
- disabled template
- protected target date
- unsupported target truth
- failed confirm/persist

## Frontend Ownership
Frontend owns:
- manual entry selection
- draft workspace rendering
- calendar state rendering from backend-shaped data
- opening menus, pickers, dialogs, and sheets
- collecting structured form input
- showing loading, empty, error, review, and success states
- transient copy buffer UI
- calling backend review and confirm actions
- preserving Hito DS visual grammar
- preventing fake saved states when backend persistence is not available

Frontend must not:
- compute training safety rules
- invent template eligibility
- silently create active plans
- persist manual workouts without backend confirm
- duplicate provider evidence, actual metrics, comparisons, or AI insights
- infer protected history from client-only state
- show future recurrence as available

## Corner Case Matrix
| Case | Expected UX | Owner |
| --- | --- | --- |
| No active plan, manual entry clicked | Opens empty draft calendar, no persisted claim | Frontend interaction, backend draft context |
| Empty authorable day | Date only, add action available | Frontend rendering |
| Empty non-authorable day | Muted, no add action | Backend range/protection, frontend rendering |
| User adds rest | Rest becomes explicit day item, not placeholder | Backend review, frontend rendering |
| Template list fails | Show error and retry; do not show fake templates | Frontend state, backend data |
| Template unavailable | Row disabled with backend reason | Backend eligibility |
| Draft rejected | Show issues in constructor, disable save | Backend review |
| Fake pace/HR would be implied | Show structure-only/editable-default language instead | Backend truth mode, frontend copy |
| User copies workout | Copy buffer set, no persistence mutation | Frontend transient |
| User pastes to protected day | Paste disabled or review rejects with reason | Backend protection |
| User clears unsaved draft day | Remove local draft item | Frontend draft state |
| User deletes persisted day | Confirmation and backend permission required | Backend mutation |
| Logged workout exists on date | Manual edits disabled unless backend supports safe override | Backend protection |
| Provider evidence exists | Do not copy/delete evidence through manual actions | Backend protection |
| Outside month day | No authoring action | Frontend rendering |
| Pre-start/outside-plan day | No rest label, no add unless range expansion exists | Backend range, frontend rendering |
| Recurrence requested | Disabled/future-only path | Product/backend future |
| Mobile narrow width | Use tap-visible actions and sheets | Frontend responsive |

## Future-Only Boundaries
These must not be presented as available in this slice:
- recurrence expansion
- save personal templates unless backend persistence exists
- editing generated active plans
- replacing logged/protected history
- copying actual result evidence
- AI-authored manual workouts from free text
- automatic coach adaptation
- detailed strength programming
- full schedule editor
- drag-and-drop calendar editing

## Acceptance Criteria
- `Build my plan myself` starts a manual draft workspace without claiming persistence.
- Empty manual draft dates do not look like rest days.
- Empty authorable days expose clear add affordances on desktop and mobile.
- Template picker uses compact Hito DS rows, not a new card gallery.
- Workout constructor routes through backend review before save.
- Review state clearly separates `draft_ready` from persisted success.
- Copy/paste reconstructs a draft and revalidates the target date before save.
- Delete/clear behavior respects draft vs persisted vs protected states.
- All controls reuse existing Hito DS primitives.
- Future-only recurrence/template persistence is not faked.
- Mobile flow is touch-reachable and does not rely on hover.

## Next Recommended Role
ARCHITECT

## Suggested Next Step
Run an architecture checkpoint against this spec and the implemented non-mutating manual authoring review seam. Decide whether the next execution slice should be Backend Slice 2 confirm/persist, or a Frontend Slice 1 draft-calendar scaffold that explicitly remains review-only until persistence is available.

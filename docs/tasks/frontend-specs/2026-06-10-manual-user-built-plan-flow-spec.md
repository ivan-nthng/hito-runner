# Manual User-Built Plan Flow Spec

## Status
Draft, implementation-driving after architecture checkpoint. Updated with no-active-plan onboarding
IA simplification and manual workout constructor UI contract.

## Owner
DESIGNER

## Last Updated
2026-06-12

## Source Of Truth
- Active plan: `docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md`
- Backlog source: `docs/tasks/backlog/2026-06-04-manual-workout-creation-edit-copy-recurrence.md`
- Running coach taxonomy: `docs/tasks/running-coach/2026-06-09-manual-workout-constructor-taxonomy-and-template-library.md`
- Implemented calendar primitives: `src/components/ui/hito-calendar-day.tsx`
- Implemented calendar surface: `src/components/Calendar.tsx`
- Implemented DS playground reference: `src/components/hito-ds/calendar-workout-playground.tsx`
- Implemented manual authoring review seam: `src/lib/manual-workout-authoring/*`
- Current onboarding owner: `src/components/OnboardingGate.tsx`
- Manual onboarding panel: `src/components/onboarding/ManualUserBuiltPlanPanel.tsx`
- Manual workout constructor controls: `src/components/manual-workout/ManualWorkoutAuthoringControls.tsx`
- Manual workout constructor utils: `src/components/manual-workout/manual-workout-authoring-utils.ts`
- Manual workout schema: `src/lib/manual-workout-authoring/schema.ts`
- Manual workout templates: `src/lib/manual-workout-authoring/templates.ts`
- Quick/generated setup panel: `src/components/onboarding/StructuredPlanConstructor.tsx`
- Talk setup panel: `src/components/onboarding/DictateToPlanPanel.tsx`
- Preset cards: `src/components/onboarding/PlanPresetPanel.tsx`
- Functional map: `docs/current-functional-map.md`

## Root Cause Fit
Visible symptom: `Build my plan myself` can read like a separate third product entity beside
onboarding instead of one setup mode inside the same active-plan lifecycle.

Underlying cause: the no-active-plan onboarding information architecture does not yet express that
manual, quick/generated, advanced, imported, and future conversational starts are setup/provenance
paths for the same active-plan calendar lifecycle.

Canonical owner:
- Product truth and persistence: backend validation, normalization, review, confirm, and plan mutation.
- Interaction and rendering: frontend calendar, Hito DS day cells, dialogs/sheets, menus, and review states.
- Onboarding information architecture: `OnboardingGate` and its mode hierarchy.
- Training structure: running-coach taxonomy and template library.

This spec does not patch the generated plan engine or create a second calendar product. It defines
manual setup as one first-class onboarding mode that reuses the existing calendar and calls
backend-owned review/confirm seams.

## Design Direction
Manual plan creation should feel like choosing the lightest setup mode, then editing the same Hito
calendar lifecycle.

The top-level no-active-plan surface should stop presenting `Build my plan myself` as a separate
block below Quick setup. Instead, use one setup-mode hierarchy:
- `Manual setup`
- `Quick setup`
- `Advanced setup`
- `Talk it through`, future/unavailable

`Manual setup` is the fastest path: the runner enters the smallest profile basics, clicks
`Start building`, lands in the empty manual-building calendar workspace, and adds activities day by
day. The visual language remains the current Hito calendar: calm, low-card, editorial, athletic,
and operational.

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

## No-Active-Plan Onboarding IA
### Product Model
There is one active-plan calendar lifecycle. Setup modes only describe how the first active plan is
started:
- Manual setup starts from an empty calendar workspace.
- Quick setup starts from current guided/generated Plan Presets and review-before-create.
- Advanced setup handles target dates, target times, unusual constraints, detailed comments, and
  import fallback.
- Talk it through is a future conversational setup entry and must not be active in this IA pass.

### Recommended Mode Order
1. `Manual setup`
2. `Quick setup`
3. `Advanced setup`
4. `Talk it through` with a quiet `Later` or `Unavailable` badge

Manual setup should be first because it is the lowest cognitive path into the product: give Hito the
minimum runner context, then start building on the calendar. Quick setup stays prominent, but it no
longer owns the whole no-plan surface by default.

### Default Selection
Default selected mode:
- `Manual setup` for a generic no-active-plan entry.
- Preserve a deep-linked or explicit user-selected mode if the route/state already has one.

Do not auto-open Advanced or Talk. Do not auto-run generation or AI review from the mode selector.

### Mode Control
Use the existing Hito DS tabs/segmented hierarchy, preferably `hito-tabs hito-tabs-simple`.

Rules:
- One tablist controls all setup modes.
- Active mode is unmistakable but quiet.
- Tabs are not large cards.
- Mode content appears below the tablist in one consistent content area.
- Switching modes preserves shared profile fields where possible.
- Disabled/future Talk tab remains focusable only if it can expose an accessible explanation; if not,
  render it disabled with a nearby `Later` status.

### First-Glance Content By Mode
Manual setup:
- one short intro line
- age, height, weight
- running level
- primary CTA: `Start building`
- no weekly schedule, goal distance, target time, target date, comments, or JSON import

Quick setup:
- current fast guided/generated setup path
- profile basics can reuse values already entered in Manual setup
- availability and preset discovery remain here
- Plan Preset cards remain compact and backend-shaped

Advanced setup:
- route for target time/date, unusual constraints, caution/injury context, detailed comments,
  execution/guidance nuance, and JSON import fallback
- should be one mode in the same onboarding family, not a disclosure hanging below all modes

Talk it through:
- visible as future/unavailable only
- no textarea, review button, or active transcript flow in the normal top-level IA
- copy should say the conversational setup is coming later or not available for this account/runtime
- do not invite the runner into a broken or fake path

### Visual Hierarchy
Use hierarchy before containers:
- page title and one short helper sentence
- simple mode tabs
- one content area with open spacing and dividers
- minimal surface wash only for status/readback, not for the mode selector itself

Avoid:
- one big chooser card per mode
- separate `Build my plan myself` banner below Quick setup
- duplicated mode explanations
- a card-heavy "three product choices" layout
- `Talk it through` competing visually with active modes

### Implementation Impact
Frontend should treat setup mode as an explicit IA state, not as Quick setup plus injected panels.

Expected conceptual mode enum:
- `manual`
- `quick`
- `advanced`
- `talk_future`

This is an IA contract, not a demand for a new backend model. The mode switch controls rendering and
input grouping only. Active plan creation remains backend-owned.

## End-To-End Flow Map
1. No active plan state
   - User sees one onboarding family with setup modes.
   - `Manual setup` is a first-class mode, not a separate section below Quick setup.
   - Choosing `Start building` opens the manual calendar through the backend-owned empty manual
     active-plan seam when available. Do not create a frontend-only calendar product.

2. Empty manual calendar workspace
   - Calendar opens around the selected or default start date.
   - Days inside the manual active-plan range are empty, not rest days.
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

6. Review and save workout
   - User reviews the normalized draft before it is added.
   - User can save the reviewed workout into the active manual plan only through backend confirm.
   - UI must not claim the workout is saved before confirm succeeds.

7. Calendar after adding
   - The day now shows a workout/rest identity using the existing calendar day grammar.
   - The day has a more menu for edit, copy, save as template, delete/clear, and future recurrence.

8. Empty plan lifecycle
   - Manual setup creates or opens the empty manual active plan through the backend seam.
   - Workout constructor drafts are the reviewed objects after the calendar exists.
   - Do not add a second plan-level `Save plan` affordance on the manual calendar.

## Entry Surface
### User Goal
Choose the fastest setup mode and start building a manual plan inside the same active-plan calendar
lifecycle.

### Primary Action
`Start building`

### Secondary Actions
- Switch to `Quick setup`.
- Switch to `Advanced setup`.
- See `Talk it through` as future/unavailable.

### Required Content Blocks
- Setup mode tabs.
- Manual setup intro.
- Profile basics: age, height, weight.
- Running level.
- One primary CTA.
- Quiet review note: the empty calendar opens first; each added workout is still reviewed before it
  is saved.

### Visible Status Language
- Neutral: `Start with an empty calendar and add workouts yourself.`
- Review-aware: `Hito will review each workout before it is saved.`
- No fake promise: do not say a workout is saved before its backend confirm succeeds.

### States
- Loading: use existing skeleton or subdued spinner while initial template eligibility/draft context loads.
- Empty: no active plan, show setup modes in one onboarding family.
- Error: if the empty manual calendar cannot be opened, show inline Hito error state with retry.
- Success/review: entering manual setup opens the empty manual calendar; workout review happens only
  after the runner starts adding an activity.

## Manual Setup Mode
### Purpose
Manual setup lets the runner start building immediately without answering a full plan questionnaire.

### Field Set
Required at first glance:
- Age
- Height
- Weight
- Running level

Use existing Hito controls:
- `EditableValueChip` group for age, height, and weight.
- Existing running-level option controls, simplified into a compact choice row/grid.

Do not ask in Manual setup:
- goal distance
- target time
- target date
- weekly availability
- fixed rest days
- long-run day
- recent 5K benchmark
- terrain
- strength preference
- detailed comment
- JSON import

Those belong to Quick or Advanced setup.

### CTA Behavior
Primary CTA: `Start building`.

Behavior:
- enabled only when required profile basics are valid enough for the existing frontend shape checks
- opens the empty manual active-plan calendar through the backend-owned seam
- does not create a workout by itself
- does not call OpenAI
- does not run preset generation
- does not claim profile persistence unless backend owns that save

If backend profile persistence is not part of this transition, the values remain in onboarding state
and are included only through backend-approved manual setup context.

### Manual Mode States
Loading:
- if defaults/profile basics are loading, use compact skeleton chips or disabled fields.

Empty:
- show the four fields and `Start building`.

Error:
- show field-level errors for invalid basics.
- show one inline form error if the manual workspace cannot initialize.

Success/review:
- successful CTA opens the empty manual active-plan calendar.
- the next review state belongs to workout review, not this setup mode.

### Copy Intent
Use concise working copy until COPY finalizes:
- Mode label: `Manual setup`
- Intro: `Start with an empty calendar. Add workouts yourself.`
- CTA: `Start building`
- Safety note: `Hito reviews workouts before they become your active plan.`

Avoid:
- `Build my plan myself` as the visible mode title
- `Manual plan product`
- `Manual draft product`
- copy that suggests the calendar is separate from normal Hito

## Quick Setup Mode
### Purpose
Quick setup remains the fast guided/generated path using current Plan Presets and backend-owned
review-before-create.

### First-Glance Content
- profile basics if not already supplied
- running level
- optional availability/rhythm controls
- compact Plan Presets
- review-before-create CTA

### Hierarchy
Quick setup should not monopolize the entire onboarding surface. It is a sibling mode to Manual and
Advanced, with the same page header and mode tabs.

### State Rules
- Loading: preset cards loading.
- Empty/needs-info: ask for only the fields required to show cards.
- Error: backend preset eligibility or preview failure.
- Success/review: selected preset review modal.

## Advanced Setup Mode
### Purpose
Advanced setup is for runners whose setup cannot be expressed by Manual or Quick setup.

Use for:
- target date
- target time
- unusual constraints
- injury/pain/caution signals
- uncommon goals
- detailed comments
- execution/guidance nuance
- JSON import fallback for existing Hito plan files

### First-Glance Content
Use a compact intro plus grouped disclosures:
- `Custom program`
- `Import existing plan`

Custom program may expose the current Advanced custom structured fields. Import should remain a
secondary fallback inside Advanced, not a separate disclosure below all modes.

### State Rules
- Loading: advanced review/import operation in progress.
- Empty: show the available advanced options.
- Error: field/import/review errors inline.
- Success/review: review-before-create or import apply review as owned by existing backend seams.

## Talk It Through Future Mode
### Purpose
Keep the future conversational setup discoverable without inviting the runner into an unfinished
path.

### Treatment
- Show as a disabled/future tab or quiet unavailable row in the setup mode list.
- Add a small `Later` or `Unavailable` badge.
- Do not render the transcript textarea as a normal active mode.
- Do not show `Review draft` or `Yes, create plan` actions in this IA pass.

### If Existing Runtime Still Has Voice/Transcript Capability
If the current runtime has a working Dictate/Talk panel, this IA correction should still demote it
out of the normal active mode selector until Product explicitly re-approves it as a live top-level
mode. Do not leave it visually equal to Manual/Quick/Advanced while the product direction says it is
future-only.

## Copy Surfaces For Later COPY Pass
These surfaces need a focused COPY pass after the IA is accepted:
- page kicker `Create a plan`
- page title `Let's build your plan.`
- page helper sentence
- mode labels and disabled/future badges
- Manual setup intro and safety note
- Manual `Start building` CTA and disabled helper
- running-level option labels/descriptions
- Quick setup intro and Plan Preset helper copy
- Advanced setup intro, custom program label, import label
- Talk it through unavailable explanation
- toasts for manual review/create
- manual workspace empty-state helper

This DESIGNER pass defines hierarchy and copy intent only. It is not final runner-facing copy.

## Manual Calendar Workspace Model
Manual setup opens the same active-plan calendar lifecycle. When the backend empty manual active-plan
creation seam is available, the empty calendar is persisted as `manual_user_built_plan_v1` with zero
rows. Workout drafts happen inside the constructor before Add/Review/Confirm.

The manual calendar uses the same calendar surface, but changes the meaning of blank dates:
- Empty in the manual calendar means `no activity planned yet`.
- Rest means `user intentionally added a rest day`.
- Pre-start/outside-plan means `not part of this manual plan range`.

The calendar must not render unfilled manual days as generated rest placeholders.

### Manual Workspace Header
Use a compact header:
- Title: `Build your plan`
- Supporting copy: `Add workouts to the calendar. Hito checks each workout before it is saved.`
- Right action slot: only actions backed by current backend seams, for example export or plan
  management where available.
- Do not show a draft-level `Save plan` if the empty manual active plan is already persisted.

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
Purpose: real calendar date outside the manual active-plan range.

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
- Saved templates

### Row Anatomy
Each row:
- workout glyph
- template name
- short purpose line
- compact metadata pills, for example `Easy`, `Structure only`, `Editable HR default`
- disabled/ineligible reason if backend marks it unavailable

### Selection
Selecting a template opens the constructor with that template prefilled.

Start from scratch:
- appears as a first row or quiet action above grouped templates
- opens the same constructor surface with no visible blocks and a required identity/type selection
- is not a separate scratch-product surface
- must still resolve to backend-supported manual workout draft input before review
- if the current backend cannot validate a scratch shape, the review CTA stays disabled with a clear
  reason instead of pretending arbitrary blocks are supported

### States
- Loading: skeleton rows or `Loading templates...`
- Empty: `No templates available for this context.`
- Error: `Templates could not load. Try again.`
- Success: grouped rows visible
- Review: selected template transitions into constructor/review flow

## Add Menu To Constructor Flow
### Template-Picked Flow
1. User chooses `Add activity` from an empty eligible calendar day.
2. User chooses a concrete backend template, for example `Easy aerobic run` or `Time intervals`.
3. Constructor opens with:
   - date fixed to the selected calendar day
   - title prefilled from template
   - icon/type prefilled from `calendarIconKey` and template identity
   - target truth mode prefilled from template
   - block list prefilled from `defaultEntries`
   - mini-preview already populated
4. User may edit user-editable fields.
5. User asks Hito to review.
6. Backend review returns `draft_ready` or `draft_rejected`.

### Start-From-Scratch Flow
1. User chooses `Add activity`.
2. User chooses `Start from scratch`.
3. Constructor opens with:
   - date fixed
   - empty title field
   - required workout identity/type selector
   - target truth defaulted to `structure_only`
   - zero block list
   - mini-preview empty state: `0 min - 0 blocks`
   - first row action: `Add block`
4. User chooses a canonical workout identity/type before review.
5. User builds one or more blocks, or a rest/no-run structure where appropriate.
6. Review CTA remains disabled until the draft can be represented as existing backend-supported
   `ManualWorkoutDraftInput`.

Scratch is a UI starting mode only. It does not create a new backend workout taxonomy or bypass the
manual authoring validator.

### Icon / Type Selection Location
Icon/type selection lives in the constructor identity area:
- template-picked flow: type is prefilled and can be changed only through an explicit `Change type`
  affordance if Frontend can safely remap to another supported template anchor
- scratch flow: type is required before review
- saved-template flow: saved template icon is shown as presentation, while backend review still
  reconstructs the workout from the saved draft payload

Do not make icon selection a free decorative picker for canonical workout drafts. Icon follows
workout identity first.

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
- title: `Add workout`, `Edit draft`, or template label depending on context
- date metadata, for example `Fri, Jun 12`
- workout type glyph/label
- source note: `Template`, `Scratch`, or `Saved template`
- review status pill: `Draft`, `Needs review`, `Ready`, `Rejected`
- close affordance follows existing product dialog rules

Header should stay compact. Do not turn the header into a hero or large card.

### Top Structure Mini-Preview
Place the structure preview directly below the header and above detailed fields.

Purpose:
- give the runner a fast scan of what the workout contains
- make repeat/work/recovery anatomy visible before reading rows
- reinforce that the constructor is a workout structure builder, not a normal text form

Preview anatomy:
- left label: `Workout structure`
- right meta: `<total duration> - <block count>` or `0 min - 0 blocks`
- one horizontal segmented bar
- optional compact line below only when review returns a warning

Segment rules:
- each top-level block becomes one segment
- each repeat group becomes one compressed grouped segment with internal work/recovery striping
- segment length is proportional to duration when duration exists
- distance-only blocks get proportional fallback based on relative distance
- note-only blocks get a tiny minimum segment and should not dominate
- rest/no-run drafts show a quiet empty/rest treatment rather than a fake duration bar
- if no blocks exist, show no segmented bar and one open row: `Add block`

Color/tone rules:
- warmup/opener/support: muted/info tone
- work/tempo/interval/hill: warning or quality tone
- recovery: muted or cool tone
- long-run body/finish: signal tone
- cooldown: muted tone
- notes/cues: low-contrast neutral

Use existing Hito semantic tokens. Do not introduce bright chart colors or a second visualization
palette.

Live behavior:
- preview updates as local draft fields change
- backend review remains authoritative for final normalized totals
- if local preview and backend review differ after review, show the backend-reviewed summary in the
  review state

Mobile:
- preview stays visible near the top
- bar can be shorter but must not overflow
- if space is tight, show the bar plus total meta and hide per-segment labels until rows

### Body Sections
1. Identity
   - workout title
   - workout type/glyph selection where allowed
   - source label: template, scratch, saved template
   - optional notes/cues

2. Structure
   - top mini-preview
   - ordered interactive workout blocks
   - block type selector
   - duration or distance editor
   - target guidance only if backend supports truth mode
   - one repeat group presentation for supported repeat templates
   - empty state row: `Add block`

3. Target Truth
   - show `Structure only`, `Editable HR default`, or equivalent backend-shaped wording
   - do not show precise pace or personal HR targets unless backend returns them as truthful

4. Backend Review
   - normalized summary
   - warnings/issues
   - conflicts/protections
   - review checksum/token remains technical and hidden unless needed for support/debug

### Block List Anatomy
Use rows and dividers, not cards.

Each simple block row includes:
- drag/reorder handle when reorderable
- ordinal, for example `01`
- block color marker
- block label, for example `Warmup`, `Work`, `Recovery`, `Cooldown`
- editable duration or distance summary
- target truth snippet, if relevant
- row actions: edit, duplicate if supported, delete

Expanded block edit state includes:
- block type selector
- duration or distance fields
- optional label field
- optional cue/target helper only if supported
- delete action in a quiet destructive position

Rows should support compact editing in place. Avoid opening a separate modal for every block unless
mobile space requires a sheet.

### Empty Zero-State
When a scratch constructor has no blocks:
- show top meta `0 min - 0 blocks`
- show one bordered-low/row-like action: `Add block`
- do not show a large blank card
- do not show generated filler blocks
- do not allow review until the draft has a valid rest/no-run state or executable structure

The visual reference screenshot uses `Add Sector`; Hito should use `Add block`.

## Block Authoring Model
### Add Simple Block
Primary row action: `Add block`.

Allowed block choices come from the existing backend block taxonomy:
- warmup
- cooldown
- easy run
- steady run
- progression
- tempo
- threshold
- interval work
- interval recovery
- hill work
- downhill control
- rest/walk/jog recovery
- long-run body
- long-run finish
- strides
- drills/mobility note
- coach cue note

Frontend may group these into runner-facing categories:
- Preparation
- Run blocks
- Quality work
- Recovery
- Endurance
- Notes and cues

Frontend must not expose block types that the backend schema cannot validate.

### Reorder Blocks
Top-level rows may be reordered when backend/running-coach rules allow it.

Visual behavior:
- show a quiet drag handle on pointer hover/focus and always on touch edit mode
- keep ordinal numbers updated
- show a light drop indicator while dragging
- keep warmup/cooldown constraints visible if a move would be invalid
- if drag-and-drop is not implemented yet, expose `Move up` and `Move down` row menu actions

Safety:
- frontend may prevent obviously invalid local moves for clarity
- backend review remains final authority
- invalid reorder attempts should surface as review issues, not silent correction

### Repeat / Loop Group
V1 supports one visible repeat group per workout constructor unless backend later approves more.

Repeat group row anatomy:
- group header: `Repeat`
- repeat count stepper/input, for example `6 rounds`
- group summary, for example `2 min work / 1 min recovery`
- collapse/expand affordance
- group-level drag handle when the whole group is reorderable
- group-level delete

Expanded repeat group:
- work block row
- recovery block row when required or present
- optional group label
- repeat safety kind, shown as quiet readback unless editable

Important rule:
- warmup and cooldown stay top-level blocks in v1
- repeat groups should not allow nested repeat groups
- repeated intensity requires explicit recovery
- internal work/recovery order is editable only through supported fields, not arbitrary nested
  drag-and-drop

Add repeat group:
- offered from `Add block` as `Add repeat group`
- choosing it opens a compact repeat setup state:
  - safety kind
  - repeat count
  - work block
  - recovery block when required
- once added, the group appears as one row in the top-level block list

### What Is Visibly Draggable
Draggable:
- top-level simple blocks where reorderable
- top-level repeat group as one unit

Not draggable in v1:
- nested repeats
- warmup into the middle of a quality repeat
- cooldown before substantive work
- recovery row outside its repeat group when recovery is required
- individual internal work/recovery rows as independent top-level blocks unless user explicitly
  breaks the repeat group

### Footer
Before backend review:
- secondary `Cancel`
- primary `Review workout`

After `draft_ready`:
- secondary `Back to edit`
- primary `Add to plan`, `Create manual plan`, or `Save workout` depending on context and existing
  backend confirm seam
- save-as-template remains secondary and only after a valid reviewed draft

After `draft_rejected`:
- secondary `Back to edit`
- primary remains disabled until issues are corrected

## Template Vs Scratch Behavior
### Template-Owned
Template owns:
- initial workout identity/family
- initial icon
- safety class
- required warmup/cooldown policy
- whether repeat group is required
- whether recovery is required
- default target truth mode
- default block anatomy

### User-Editable
Runner can edit:
- title
- notes/cues
- allowed target truth mode
- allowed block duration/distance
- allowed repeat count
- work/recovery sizes
- optional labels where supported
- block order where allowed

### Scratch-Owned By User
Scratch starts empty, but must become a backend-valid manual draft before review.

Scratch requires:
- selected canonical workout identity/type
- valid block list or explicit rest/no-run state
- target truth mode compatible with selected identity
- no fake pace or personal HR
- no nested repeats

### One Surface Rule
Template, saved-template, and scratch flows must use one constructor surface:
- same header anatomy
- same mini-preview
- same block list
- same review footer
- same backend review notices

Do not build:
- a read-only template detail product
- a separate scratch builder product
- a separate repeat editor product
- a separate icon customization product

## Iconography Contract
### Canonical Workout Glyph Set
Manual constructor should use the existing `WorkoutGlyph` family and current `CalendarIconKey`
values first:
- `easy`
- `recovery`
- `steady`
- `long`
- `tempo`
- `intervals`
- `progression`
- `race`
- `hills`
- `trail`
- `quality`
- `rest`

### Template Icon Mapping
Template-picked workouts inherit `calendarIconKey` from the backend template registry.

Current examples:
- `rest_day` -> `rest`
- `recovery_jog` -> `recovery`
- `easy_aerobic_run` -> `easy`
- `steady_aerobic_run` -> `steady`
- `easy_run_with_strides` -> `easy`
- `progression_run` -> `progression`
- `controlled_tempo_session` -> `tempo`
- `half_marathon_threshold_durability` -> `tempo`
- `time_intervals` -> `intervals`
- `distance_intervals` -> `intervals`
- `long_aerobic_run` -> `long`
- `long_run_with_steady_finish` -> `long`
- `cutback_long_run` -> `long`
- `taper_long_run` -> `long`
- `uphill_repeats` -> `hills`
- `rolling_hills_session` -> `hills`
- `run_walk_adaptation` -> `recovery`
- `technical_trail_easy` -> `trail`

### Runner-Selectable Icons
For canonical workout drafts:
- runner chooses workout identity/type, not arbitrary icon decoration
- icon follows the selected canonical identity
- changing icon alone must not change backend workout taxonomy

For personal saved templates:
- runner may choose a presentation icon from the existing canonical icon set if the backend already
  stores `iconKey`
- helper copy must say this changes how the personal template appears in the picker
- it does not create a new workout family

### Extra Neutral / Custom Icons
Do not add extra neutral/custom icons in v1.

If a future design needs neutral/custom choices, treat them as a separate DS/backend enum extension
proposal. Candidate future-only presentation icons could be:
- custom
- mobility
- strength
- note

Those must not be saved as `calendarIconKey` or presented as workout families until backend accepts
the values.

## Constructor Ownership Boundaries
### Already Canonical From Backend / Running Coach Truth
- manual setup input: age, height, weight, running level
- manual active-plan source kind: `manual_user_built_plan_v1`
- manual workout source kind: `manual_workout_authoring_v1`
- template registry and template keys
- block key taxonomy
- repeat group schema
- target truth modes
- review result states: `draft_ready`, `draft_rejected`
- review token/checksum authority
- active-plan Add/Clear/Move capability checks
- personal saved template persistence when using existing backend seams
- `CalendarIconKey` canonical values

### Rendering / Interaction Guidance Only
- constructor layout
- mini-preview shape
- block-row density
- reorder affordance style
- empty `Add block` row
- icon placement
- mobile sheet behavior
- copy tone placeholders
- local live preview before backend review

These must not become business truth. Backend review remains the authority for whether a draft can
be saved.

### Future-Only From This Constructor Pass
- new workout families
- extra `calendarIconKey` values
- nested repeat groups
- more than one repeat group if backend policy does not allow it
- arbitrary pace targets
- personal HR targets without real HR-zone truth
- recurrence authoring
- full drag-drop implementation details
- strength/mobility programming as a first-class workout taxonomy
- editing persisted workout content beyond already accepted Add/Clear/Move/Copy/Paste/Move seams

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
Status: available through the existing personal saved-template backend seam where the current
product exposes it.

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
- icon choice for a saved template is presentation only and must use existing accepted icon keys

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
- `manual_draft_initializing`: manual calendar workspace loading
- `manual_calendar_empty`: persisted or backend-shaped manual calendar visible, no authored workouts
- `empty_day_idle`: empty authorable cell, date only
- `empty_day_hover`: add affordance visible
- `empty_day_focus`: focus ring plus add affordance
- `add_menu_open`: day menu visible
- `template_picker_loading`
- `template_picker_empty`
- `template_picker_error`
- `template_picker_success`
- `constructor_editing`
- `constructor_scratch_empty`
- `constructor_template_prefilled`
- `constructor_saved_template_prefilled`
- `constructor_identity_required`
- `constructor_block_add_menu`
- `constructor_block_editing`
- `constructor_repeat_group_collapsed`
- `constructor_repeat_group_expanded`
- `constructor_reorder_active`
- `constructor_preview_empty`
- `constructor_preview_live`
- `constructor_review_loading`
- `constructor_draft_ready`
- `constructor_draft_rejected`
- `constructor_save_loading`: backend confirm in progress
- `constructor_save_error`: backend confirm failed
- `workout_added_success`: day updates, optional toast
- `copy_buffer_active`
- `paste_review`
- `delete_confirm`
- `protected_day_readonly`

## Mobile State Inventory
- `no_active_plan_entry_mobile`: stacked options, manual action visible without scrolling too far
- `manual_calendar_empty_mobile`: calendar or day list uses touch-visible add actions
- `day_action_sheet_open`: add/more actions in sheet
- `template_picker_sheet`: single-column grouped rows
- `constructor_sheet_editing`: full-height sheet
- `constructor_sheet_add_block`: block picker appears as sheet section or nested sheet
- `constructor_sheet_repeat_group`: repeat group editor keeps footer reachable
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
- Structure preview: small DS-owned composition using dividers, semantic tokens, and row rhythm;
  not a new charting subsystem
- Block list: `hito-row-group`, `hito-list-row`, `hito-status-pill`, field classes, and existing
  menu/select primitives
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
- manual calendar and workout draft rendering
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
| No active plan, manual setup confirmed | Opens empty manual active-plan calendar through backend seam | Backend empty-plan create, frontend transition |
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
- editing generated active plans
- replacing logged/protected history
- copying actual result evidence
- AI-authored manual workouts from free text
- automatic coach adaptation
- detailed strength programming
- full schedule editor
- drag-and-drop calendar editing
- arbitrary custom workout families
- extra custom `calendarIconKey` values
- nested repeat groups
- repeat groups without explicit recovery when backend requires recovery
- fake pace or fake personal HR

## Acceptance Criteria
- No-active-plan onboarding uses one setup-mode hierarchy: `Manual setup`, `Quick setup`,
  `Advanced setup`, and future/unavailable `Talk it through`.
- `Manual setup` is first, lightweight, and no longer appears as a separate banner/card below Quick
  setup.
- `Manual setup` asks only for age, height, weight, and running level before `Start building`.
- `Start building` opens the empty manual active-plan calendar through the backend seam.
- `Quick setup` remains the current guided/generated Plan Preset path.
- `Advanced setup` contains custom-program and import fallback paths inside the same onboarding
  family.
- `Talk it through` is visible as future/unavailable and does not render an active broken/fake path.
- Empty manual calendar dates do not look like rest days.
- Empty authorable days expose clear add affordances on desktop and mobile.
- Template picker uses compact Hito DS rows, not a new card gallery.
- Template-picked workouts and start-from-scratch workouts use the same constructor surface.
- Scratch starts empty but must resolve to backend-supported manual draft input before review.
- Constructor header, mini-preview, identity fields, block list, review notices, and footer follow
  one anatomy.
- Top mini-preview reflects current block anatomy and repeat groups without becoming a charting
  subsystem.
- Block list supports add, edit, reorder affordances, and one visible repeat group contract within
  backend taxonomy limits.
- Iconography uses existing `WorkoutGlyph` / `CalendarIconKey` values and does not create a new
  backend workout taxonomy.
- Workout constructor routes through backend review before save.
- Review state clearly separates `draft_ready` from persisted success.
- Copy/paste reconstructs a draft and revalidates the target date before save.
- Delete/clear behavior respects draft vs persisted vs protected states.
- All controls reuse existing Hito DS primitives.
- Future-only recurrence/template persistence is not faked.
- Mobile flow is touch-reachable and does not rely on hover.

## Next Recommended Role
FRONTEND

## Suggested Next Step
Refactor the no-active-plan onboarding IA so manual, quick, advanced, and future talk are rendered as
one Hito DS-native setup-mode family. Keep product behavior backend-shaped, reuse existing controls,
and do not change calendar/product persistence logic beyond the approved manual authoring seams.

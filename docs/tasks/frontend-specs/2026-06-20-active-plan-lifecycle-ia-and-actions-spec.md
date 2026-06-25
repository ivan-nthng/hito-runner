# Active-Plan Lifecycle IA And Plan Actions Spec

## Status

in_progress

## Type

frontend_spec

## Priority

high

## Next Recommended Role

qa

## Task

Define the active-plan lifecycle IA for runners who already have a manual active plan and want to
start a generated or preset plan, while making plan-management actions easier to find.

## Stage

BACKEND implemented / reviewed active-plan transition pending QA.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task:
Implement the reviewed active-plan transition seam for starting a generated or preset plan from an
existing active manual plan.

Stage:
BACKEND implementation / reviewed active-plan transition lifecycle.

Context:
Architecture accepted that `Create a plan` from an active `manual_user_built_plan_v1` is a new
backend-owned reviewed active-plan transition seam. It is not a frontend shortcut, not active-plan
refresh, not raw clear-upcoming-then-create, and not silent replacement. The runner must preview the
candidate generated/preset plan, review what changes and what remains preserved, then explicitly
confirm before any active-plan mutation happens.

Root cause and architecture fit:
Visible symptom: the accepted saved-mode IA exposes `Create a plan`, but there is no safe mutation
path behind it for runners who already have a manual active plan.
Underlying cause: active-plan transition semantics are a backend lifecycle risk class, not a route
layout issue.
Canonical owner: backend owns review generation, protected-history classification, token/checksum
exactness, persistence, lifecycle audit metadata, stale-state rejection, and final confirm.

Required reading:
- AGENTS.md
- agents/backend.agent.md
- skills/hito-backend-supabase-contract/SKILL.md
- docs/tasks/frontend-specs/2026-06-20-active-plan-lifecycle-ia-and-actions-spec.md
- docs/tasks/backlog/2026-06-07-plan-preset-active-plan-replacement-refresh.md
- docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
- docs/current-product.md
- docs/current-system.md
- src/lib/running-plan-engine-actions.ts
- src/lib/first-plan-actions.ts
- src/lib/active-plan-lifecycle-actions.ts
- src/lib/active-plan-refresh-actions.ts
- src/lib/persisted-plan-replacement.ts
- src/lib/training-api.ts

Scope:
1. Add a non-mutating review action for active manual plan -> generated/preset plan transition.
2. Reuse the existing selected/generated plan preview/build contract for candidate plan truth.
3. Reuse existing active-plan lifecycle/archive/persistence seams where possible.
4. Return backend-shaped review data for frontend rendering: current plan, candidate plan, affected
   date range, upcoming manual workouts affected, preserved history, manual templates preserved,
   metric honesty, and review exactness data.
5. Add an explicit confirm action that revalidates review exactness and active-plan revision before
   mutating.
6. On confirm, supersede/archive the old active manual plan and create the new active
   generated/preset plan while preserving logs, provider evidence, comparisons, protected history,
   and manual templates.

Do not:
- Do not implement code.
- Do not silently replace an active plan.
- Do not delete workout history.
- Do not make Frontend compute replacement safety.
- Do not merge this with JSON import, Clear upcoming schedule, Delete plan, active-plan refresh,
  QR/share-import, recurrence, Restore UI, Admin, Hito DS, Supabase migrations, or OpenAI live calls.

Output:
Use the Implementation Report format from AGENTS.md.
```

## Context

The no-active-plan creation experience is now much clearer than the saved-mode active-plan
experience. Manual setup, Quick setup, selected running-plan previews, and plan presets all support
the first-plan mental model. The accepted saved-mode answer is now one calendar with a primary
`Add plan` action plus adjacent safe overflow utilities. Older `Open plan` analysis below is kept as
historical context only.

This spec defines the interaction and information architecture only. It does not define backend
replacement semantics.

## Root Cause

Visible symptom:

- Runners with a manual active plan can manage the current plan, but cannot easily discover how to
  start a generated or preset plan from the saved-mode product.

Likely underlying cause:

- The previous saved-mode IA treated `Open plan` as the main active-plan action, while generated-plan
  creation remained mostly scoped to no-active-plan onboarding.
- The accepted correction is `Add plan` plus overflow utilities, with backend-owned review/confirm
  for any future/upcoming schedule replacement.

Canonical owner:

- Designer owns the action hierarchy, placement, state model, and DS reuse contract.
- Architect owns the mutation semantics: replacement, refresh, clear-then-create, protected history,
  review/confirm, and backend-owned safety.
- Frontend should not implement a create/replacement mutation until Architect defines the backend
  lifecycle contract.

## Design Goals

- Make `Create a plan` discoverable for a runner who already has an active manual plan.
- Keep the current active plan visible and trusted; do not make replacement feel accidental.
- Reuse known runner facts instead of re-asking profile basics.
- Offer a fast generated path with plan-family choices: `10K`, `21K`, and `42K`.
- Provide a more detailed/custom path for target date, target time, unusual constraints, comments,
  or unsafe preset fit.
- Make destructive and advanced actions easier to discover without making them primary.
- Preserve the single active-plan calendar lifecycle. Manual, preset, generated, imported, and
  refresh starts are provenance/setup paths, not separate calendar products.
- Use Hito DS primitives and existing product/admin patterns first. Do not introduce a new action
  system, local chooser UI kit, or custom modal grammar.

## Current Accepted One-Calendar IA

This spec's earlier `Create a plan` / `Open plan` split has been superseded by the QA-passed
one-calendar header IA. Current product truth is:

- the calendar header primary action is `Add plan`;
- the adjacent overflow owns safe utilities only: `Export JSON`, `Edit schedule`, and
  `Clear upcoming schedule`;
- `Open plan` is not a current product concept;
- visible `Update plan` is not shipped now;
- `Delete active plan` is not shown;
- calendar history is sacred, and replacement/clearing may affect only future mutable schedule
  through backend-owned review/confirm semantics.

The older variant analysis below remains historical design context only and must not be used as the
current implementation target.

## Current Product Reality

Implemented or documented realities this spec depends on:

- The accepted saved-mode calendar header exposes `Add plan` plus an adjacent overflow.
- The accepted overflow utilities are `Export JSON`, `Edit schedule`, and `Clear upcoming schedule`.
- `Open plan`, visible `Update plan`, and `Delete active plan` are historical/unsupported current
  IA, even when old implementation modules or archive docs still use those names internally.
- Plan Presets are currently a no-active-plan discovery path. Selecting a card enters selected
  running-plan preview/create, and active-plan creation is blocked when an active plan exists.
- Active-plan refresh exists as a reviewed proposal/apply flow for the remaining schedule.
- Active-plan replacement/import/text replacement have backend-owned seams.
- On 2026-06-20, Architecture accepted that starting a generated/preset plan from an active
  `manual_user_built_plan_v1` is a new backend-owned reviewed active-plan transition seam, not
  refresh, raw clear-upcoming-then-create, or silent replacement.
- On 2026-06-20, Backend implemented that reviewed transition seam in
  `src/lib/active-plan-transition-actions.ts`; runner-facing saved-mode UI wiring remains a separate
  frontend/QA gate.
- Deleting or clearing active plan history must preserve logs/history according to backend-owned
  lifecycle rules.

## Historical Recommended IA Superseded By One-Calendar IA

The former recommended variant was **Header action cluster + `Open plan` management modal + reviewed
create flow**. It is no longer the current implementation target.

The saved-mode header should express two different jobs:

- `Create a plan`: start a new generated/preset/custom plan flow.
- `Open plan`: inspect and manage the current active plan.

On desktop, show both as sibling actions in the header action cluster:

- Primary or stronger secondary: `Create a plan`
- Secondary: `Open plan`
- Overflow icon button: advanced/destructive management shortcuts if needed

On mobile, keep the header compact:

- visible `Open plan` or plan icon remains;
- `Create a plan` appears in the account/plan action menu or as the first item in a compact
  header overflow;
- destructive/advanced actions stay inside `Open plan` or the same overflow, below a divider.

Why this is preferred:

- It avoids burying the generated-plan entry inside a plan-management modal.
- It does not make destructive/import actions compete with everyday plan creation.
- It preserves the current `Open plan` surface as the plan-management owner.
- It gives Frontend a small action hierarchy change without requiring a new shell.

## IA Variants Considered

### Variant A — Header Action Cluster

Desktop:

- Header right side: `Create a plan`, `Open plan`, optional overflow.

Mobile:

- Header right side: one compact `Plan` or overflow trigger; first menu item is `Create a plan`,
  second is `Open plan`.

Pros:

- Fastest discovery.
- Clear separation between creation and management.
- Low implementation surface if existing header/menu/dialog primitives are reused.

Cons:

- Requires Architecture to define what happens after `Create a plan` review.

Decision:

- Recommended.

### Variant B — `Open plan` Modal As Single Entry

Desktop/mobile:

- Header still only shows `Open plan`.
- Inside `Open plan`, add a prominent `Create a plan` section near the plan summary.

Pros:

- Keeps header simple.
- No new top-level action in saved mode.

Cons:

- Keeps the discoverability problem partially alive.
- Makes `Open plan` carry both management and new-plan intent.
- Can become modal-heavy because runner must open one modal to start another creation flow.

Decision:

- Acceptable fallback if Architecture does not want header action growth.

### Variant C — Calendar Hero Create CTA

Desktop/mobile:

- Add `Create a plan` into the calendar/home hero near current plan status.

Pros:

- The action appears near the planning surface.

Cons:

- Risks looking like a content CTA rather than a lifecycle action.
- Could fight with day/workout actions.
- Harder to keep consistent on workout detail pages.

Decision:

- Not recommended for v1.

## Action Hierarchy

### Always Visible

`Create a plan`

- Purpose: start a generated/preset/custom plan flow from saved mode.
- Tone: strong secondary or primary depending on final shell density.
- Must not imply instant replacement.
- Suggested helper in the creation modal: `You will review the new plan before anything changes.`

`Open plan`

- Purpose: current active-plan management, export, update, schedule, import, clear, delete.
- Tone: secondary.
- Keep current plan trust: runner can always inspect what exists now.

### Visible Inside `Open plan`

`Update plan`

- Purpose: modify the remaining current active schedule through the existing reviewed refresh flow.
- Placement: quiet disclosure near plan summary.
- Remains distinct from creating a new plan family.

`Edit schedule`

- Purpose: fixed-rest/running-day schedule reflow through current reviewed preview/apply contract.
- Placement: quiet disclosure.

`Export`

- Purpose: JSON/Markdown active-plan export.
- Placement: summary/header action, as today.

`Import JSON`

- Purpose: advanced technical replacement/import path.
- Placement: advanced disclosure or overflow group.
- Must not compete with `Create a plan`.

`Clear upcoming schedule`

- Purpose: remove current upcoming schedule while preserving history.
- Placement: lifecycle/destructive management group.
- Tone: secondary/destructive-adjacent, behind disclosure/confirmation.

`Delete active plan`

- Purpose: archive the active plan and leave no active plan.
- Placement: lifecycle/destructive management group, after `Clear upcoming schedule`.
- Tone: destructive outlined or error tone.

### Overflow / More Actions

Use overflow for actions that are not everyday primary planning:

- `Import JSON`
- `Clear upcoming schedule`
- `Delete plan`
- maybe `Export` on constrained/mobile surfaces

Do not put `Create a plan` only in overflow on desktop. It must be visible.

## Desktop Placement

Header right action cluster:

1. `Create a plan`
2. `Open plan`
3. optional `More` icon button if direct shortcuts are added

Rules:

- Use `hito-button` variants.
- Keep `Create a plan` and `Open plan` visually related; avoid one looking like a separate product.
- If both actions cannot fit, collapse into one `Plan` menu with `Create a plan` first.
- Do not place destructive actions directly in the header as standalone buttons.

`Open plan` dialog:

- Keep `PlanSummaryHeader` first.
- Keep management sections as disclosures/row groups.
- Add a small cross-link if useful: `Want a new generated plan? Create a plan`.
- This cross-link must use an existing button/link style and should close or transition cleanly
  into the create flow.

Create flow container:

- Use the stable Hito product dialog pattern if launched modally.
- If Architecture later chooses a route or sheet, preserve the same anatomy:
  header, compact body, review panel, footer actions.

## Mobile Placement

Mobile header should avoid three visible actions.

Recommended mobile model:

- one compact `Plan` action or overflow icon in the sticky header;
- menu items:
  1. `Create a plan`
  2. `Open plan`
  3. divider
  4. `Import JSON`
  5. `Clear upcoming schedule`
  6. `Delete plan`

Rules:

- Use existing Hito dropdown/menu primitives.
- Destructive items stay below a divider and use error/destructive tone.
- If the create flow is longer than one screen, use a full-height product dialog/sheet pattern with
  sticky footer review actions.
- Keep plan-family cards stacked and compact; do not use desktop multi-column density at 375px.

## Create-A-Plan From Existing Manual Plan Flow

### Entry

Runner clicks `Create a plan`.

Initial create surface must not ask for profile facts Hito already knows unless data is missing or
stale.

Known data to reuse when available:

- age;
- height;
- weight;
- running level;
- fixed rest days;
- default running days/week;
- preferred long-run day;
- recent benchmark / metric-policy truth when available;
- current active plan source/type, especially `manual_user_built_plan_v1`.

### Step 1 — Choose Creation Mode

Show two main choices:

- `Quick plan`
- `Custom plan`

`Quick plan` is the default.

Use simple tabs or segmented control:

- `Quick`
- `Custom`

Do not show `Manual setup` here. The runner already has a manual active plan.

### Step 2A — Quick Plan Family

Show compact generated/preset family choices:

- `10K`
- `21K`
- `42K`

Optional labels:

- `Foundation`
- `Balanced`
- `Base`

Card content should be compact:

- large distance identity;
- short family label;
- days/week or horizon if backend provides it;
- fit reason from backend-shaped eligibility;
- status pill: `Available`, `Recommended`, `Needs review`, or `Not enough info`.

Do not show long data dumps or inline date ranges.

If a family is disabled:

- show quiet disabled state;
- show one short reason;
- offer `Custom plan` if the reason suggests unusual constraints or insufficient fit.

### Step 2B — Custom Plan

Custom plan handles details that do not belong in quick family cards:

- target date;
- target time;
- unusual constraints;
- injury/pain/discomfort context;
- schedule changes;
- detailed comments;
- uncommon goal;
- any case where quick family eligibility is unsafe.

Do not make custom look like failure. It is secondary, not bad.

### Step 3 — Review Before Change

Any generated/preset/custom output must land in a review state before mutation.

Review should show:

- selected family/name;
- current active plan summary;
- what date range would change;
- whether current plan would be archived/replaced/cleared/refreshed, once Architect defines it;
- protected-history statement;
- preserved logs/evidence statement;
- days/week;
- fixed rest days;
- long-run day;
- metric honesty summary;
- assumptions or missing truth;
- primary action: `Apply reviewed plan` or Architect-approved wording;
- secondary action: `Keep current plan`;
- optional action: `Back to choices`.

Until Architecture defines semantics, use placeholder language in design only:

- `Review required before changing your active plan.`
- `Hito will show what changes and what stays preserved before anything is applied.`

Do not use:

- `Replace now`
- `Create instantly`
- `Start over` without confirmation context

## Review / Confirm Boundary

This spec requires a review/confirm boundary. Architecture accepted the backend lifecycle contract on
2026-06-20:

- The final model is a backend-owned reviewed active-plan transition.
- The current active manual plan is superseded/archived only after explicit confirm.
- The new generated/preset plan becomes active only after backend confirm.
- Logged workouts, provider evidence, comparison-backed results, completed/partial/skipped truth,
  and protected historical records are preserved.
- Upcoming manual workouts do not merge into the generated/preset plan by default; they remain with
  the superseded/archived manual plan history unless a later explicit merge feature is designed.
- Manual saved templates remain user-owned library truth and carry forward unchanged.

Frontend must not:

- archive the current plan;
- clear upcoming workouts;
- replace future workouts;
- attach logs to a new plan;
- decide which history is protected;
- infer replacement safety;
- silently call a first-plan creation action that blocks active plans.

Backend must provide review data that Frontend can render before mutation:

- current active plan summary;
- candidate generated/preset plan summary;
- date range affected;
- upcoming manual workout count affected;
- protected-history statement;
- preserved logs/evidence statement;
- manual-template preservation statement;
- metric honesty summary;
- review token/checksum or equivalent exactness guard.

## Plan Action Menu Structure

If a header overflow/menu is added, use this structure:

Primary group:

- `Create a plan`
- `Open plan`

Support group:

- `Export`
- `Import JSON`

Lifecycle group:

- `Clear upcoming schedule`
- `Delete active plan`

Rules:

- Do not put `Delete active plan` beside `Create a plan` without a divider.
- Do not hide `Create a plan` under an advanced group.
- Do not make `Import JSON` louder than quick/custom plan creation.
- Do not duplicate all `Open plan` controls in the header menu unless Product chooses a fully
  menu-first model later.

## State Model

### Loading

Use existing Hito loading primitives:

- `hito-skeleton` / subdued loading rows;
- working toast for long-running proposal/generation only when implementation owns async duration;
- disabled buttons with clear loading text.

Loading cases:

- loading runner facts;
- loading plan-family eligibility;
- generating a reviewed proposal;
- applying a reviewed change.

### Empty

Empty here means missing facts, not no plan.

Examples:

- no benchmark: show `Missing benchmark` as a quiet helper, not a blocker unless backend says so;
- unknown fixed rest days: allow editing inside custom path or link to settings;
- unsupported plan family: show disabled card with reason.

### Error

Use Hito field/error states near the affected control:

- profile fact load failed;
- family eligibility failed;
- review generation failed;
- apply/review token stale;
- backend says active-plan lifecycle is not supported yet.

Global error copy should be bounded:

- `Could not prepare this plan review. Your current plan was not changed.`

### Success

Success should confirm the lifecycle outcome after backend apply:

- `Reviewed plan applied.`
- `Your current plan was preserved as history.`
- route back to saved calendar after a fresh data load.

Do not show success before backend confirms.

### Review

Review is the key state for active-plan runners.

The UI should feel like a checkpoint, not a warning wall:

- one summary header;
- one list of what changes;
- one list of what stays preserved;
- metric/rest-day assumptions;
- final primary action.

## Hito DS Reuse Contract

Frontend must reuse existing Hito DS and product patterns first:

- Buttons: `hito-button`, `hito-button-primary`, `hito-button-secondary`, `hito-button-ghost`,
  `hito-button-outlined`, existing size classes.
- Icons: `Icon` primitive only; no direct icon-library usage in new UI.
- Dialogs: stable `hito-product-dialog` anatomy, `hito-product-dialog-header`,
  `hito-product-dialog-body-scroll-fill`, `hito-product-dialog-footer`.
- Menus: existing Hito dropdown/menu wrappers and `hito-shell-menu` / menu item classes.
- Tabs/segmented choice: existing `hito-tabs-simple` or existing choice-toggle treatment.
- Surfaces: `hito-surface-wash`, `hito-row-group`, `hito-list-row`, dividers before new cards.
- Status: `hito-status-pill`, `HitoMetadataTag` where metadata needs static/read-only tags.
- Forms: `hito-field`, `hito-form-label`, `hito-field-helper`, `hito-field-error`,
  Hito checkbox/radio/select/date picker primitives where available.
- Typography: `hito-modal-title`, `hito-section-title`, `hito-panel-title`, `hito-body`,
  `hito-body-small`, `hito-caption`, `hito-micro-label`, `hito-technical-mono`.
- Toasts: existing Hito toast pattern for long-running async actions when real async lifecycle is
  wired.

Do not introduce:

- route-local card family for plan choices;
- custom dropdown/select controls;
- native browser confirm for destructive lifecycle;
- a new modal/sheet visual grammar;
- a separate "generated plan app" surface.

If an existing primitive cannot support plan-family cards, propose a narrow reusable
`plan-family option` composition using existing surface, status pill, button, and typography
classes. Do not create a general-purpose card system.

## Copy Intent

This is not a final COPY pass. Copy should communicate these ideas:

- creation is available even when a manual active plan exists;
- known runner data will be reused;
- nothing changes until review/confirm;
- destructive actions are available but deliberately separated;
- JSON import is advanced and technical;
- custom plan is for more specific constraints, not a failure path.

Temporary labels:

- Header action: `Create a plan`
- Current-plan action: `Open plan`
- Quick tab: `Quick plan`
- Custom tab: `Custom plan`
- Review helper: `You will review the new plan before anything changes.`
- Keep action: `Keep current plan`
- Final apply placeholder: `Apply reviewed plan`

COPY should later refine:

- active-plan review promise;
- disabled card reasons;
- protected-history explanation;
- destructive action labels;
- custom plan intro.

## Business Process Flow

```text
Runner has active manual plan
  -> sees saved calendar header
  -> chooses Create a plan
  -> Hito loads known runner/profile/plan context
  -> runner chooses Quick or Custom
  -> Quick: choose 10K / 21K / 42K family
  -> Custom: provide target/date/time/constraints/comment
  -> backend prepares reviewed plan/change proposal
  -> runner reviews what changes and what stays preserved
  -> runner confirms or keeps current plan
  -> backend applies only the reviewed mutation
  -> runner returns to saved calendar
```

If Architecture has not defined the mutation seam yet:

```text
Runner chooses Create a plan
  -> runner can choose family/custom intent
  -> UI stops at "review unavailable / lifecycle not ready"
  -> runner's current plan is unchanged
```

## Edge Cases

- Runner has active manual plan but missing profile facts: ask only for missing facts inline.
- Runner has active generated/imported plan: same IA may apply later, but this spec focuses on
  manual active plan.
- Runner has protected completed/logged/evidence-backed history: review must explain preserved
  history; Frontend must not decide this locally.
- Runner chooses import/create from `Add plan`: route into existing supported plan-add/create
  surfaces using the same backend-owned review/confirm boundaries.
- Runner chooses `Clear upcoming schedule`: use existing lifecycle confirmation pattern.
- `Delete active plan` is not shown in the accepted current IA.
- Plan-family eligibility cannot load: show recoverable error; current plan stays unchanged.
- Plan-family eligibility/card discovery loads even when the runner has an active manual plan; it
  remains non-mutating discovery only.
- Backend returns `active_plan_exists` from direct selected-plan confirm: this remains expected
  unless the saved-mode flow is using the reviewed active-plan transition seam; show
  review-unavailable copy instead of pretending creation succeeded.

## Acceptance Criteria

- A runner with a manual active plan can discover `Add plan` without opening a hidden advanced
  import path.
- `Add plan` and the overflow utilities have different, understandable jobs.
- Desktop and mobile placement keep `Add plan` reachable without cramping the header.
- Generated/preset creation reuses known runner facts and asks only for missing or custom-specific
  details.
- `10K`, `21K`, and `42K` plan-family choices are represented as compact Hito DS option surfaces,
  not new local cards.
- `Export JSON`, `Edit schedule`, and `Clear upcoming schedule` are available from overflow as safe
  utilities; `Delete active plan` is not shown.
- The review/confirm boundary is explicit before any plan mutation.
- No copy or layout implies silent replacement.
- No backend lifecycle, persistence, protected-history, or active-plan mutation semantics are
  invented by Frontend.
- The design uses existing Hito DS primitives and names any exception explicitly.

## Out Of Scope

- Implementing frontend active-plan replacement before Backend ships the reviewed transition seam.
- Changing backend persistence.
- Changing protected-history rules.
- Replacing the current active plan silently.
- Redesigning no-active-plan onboarding.
- Redesigning saved calendar day cells.
- Reopening manual Add / constructor simplification.
- Adding recurrence, restore UI, coach assignment, or provider sync.

## Risks

- If `Create a plan` appears primary but backend replacement is not ready, users may expect an
  immediate apply path. Mitigation: the first implementation must either stop at a clear
  review-unavailable state or wait for Architecture's mutation contract.
- If too many actions enter the header, saved mode can feel like a control panel. Mitigation:
  visible `Create a plan` + `Open plan`; everything else in `Open plan` or overflow.
- If `Custom plan` is framed as an error fallback, runners with real constraints may feel punished.
  Mitigation: present it as a deliberate detailed setup mode.
- If JSON import is too prominent, it competes with normal generated setup. Mitigation: advanced
  placement only.

## Frontend Notes

- Do not start the live apply implementation until Backend ships the reviewed active-plan transition
  seam.
- Frontend can safely prepare action hierarchy and placeholder review-unavailable states only if
  Product/Architecture explicitly accepts that interim behavior.
- If implementation touches `AppShell`, preserve the existing Hito logo/account/nav rhythm.
- If implementation touches `PlanManagementDialog`, keep the stable product-dialog anatomy and avoid
  adding another nested modal unless transition behavior is designed.
- If implementation touches selected running-plan preview, ensure active-plan blocked state stays
  honest until backend supports replacement.

## Validation Expectations

For the future implementation slice:

- Source proof that no native/custom controls were introduced when Hito DS equivalents exist.
- Source proof that `Create a plan` does not call first-plan confirm directly while an active plan
  exists.
- Browser proof on desktop and 375px mobile that action placement is discoverable and not cramped.
- Browser proof that destructive/import actions remain secondary and separated.
- Browser proof that review/confirm language appears before any active-plan mutation.
- `git diff --check`.
- Targeted lint/build as required for touched files.

## Suggested Next Step

Route to Backend to implement the reviewed active-plan transition seam before Frontend wires the
live generated-plan apply path.

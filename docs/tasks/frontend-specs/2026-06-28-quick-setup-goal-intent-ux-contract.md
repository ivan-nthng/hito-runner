# Quick Setup Goal Intent UX Contract

## Status
ready_for_handoff

## Type
frontend_spec

## Priority
high

## Next Recommended Role
frontend

## Task
Redesign Quick setup goal-intent UX so distance, optional finish time, optional race day, and derived pace are collected in a runner-safe order before preview.

## Stage
FRONTEND implementation / Quick setup goal-intent UX correction

## Exact Handoff Prompt
```text
ROLE: FRONTEND

Task:
Implement the Quick setup goal-intent UX correction.

Stage:
FRONTEND implementation / Quick setup goal-intent UX correction.

Source spec:
docs/tasks/frontend-specs/2026-06-28-quick-setup-goal-intent-ux-contract.md

Active plan:
docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md

Root cause and architecture fit:
Visible symptom: a runner can open a selected-plan preview that fails with backend-shaped copy such as "Marathon Base preview cannot be built from this setup", target finish-time range copy, and internal reason `invalid_plan_goal_intent`.
Underlying cause: the current Quick setup UI exposes low-level goal intent fields before the runner has a coherent distance/goal model, and it treats direct outcome pace as a normal field.
Canonical owner for this slice: frontend interaction and rendering over the existing backend `planGoalIntent` contract. Backend remains the final validator and feasibility owner.

Required behavior:
1. Keep Basic setup focused on age, height, weight, running level, and available running days.
2. Replace the current "Use selected card distance / Custom distance" control with a runner-facing Goal section:
   - 10K
   - Half Marathon
   - Marathon
   - Custom
3. After a preset distance is selected, show optional Race day and optional Finish time.
4. For Custom, require Custom distance first, then show optional Race day and optional Finish time.
5. Remove direct Outcome pace entry from the main Quick setup flow.
6. Show derived pace only as readback when distance plus valid finish time are both present.
7. If finish time is invalid, block preview at the field/card level with friendly copy before calling preview.
8. Do not open the preview dialog for local goal-intent validation errors.
9. Never show backend reason strings such as `invalid_plan_goal_intent` to runners.
10. Preserve backend validation, review/confirm exactness, planGoalIntent persistence, and generated-plan behavior.

Important backend-fit rule:
- If the selected backend card still maps to `Marathon Base`, do not let Race day or Finish time submit into that preview. Either suppress target fields for Marathon Base with clear base-building copy, or route race-day/finish-time marathon intent to Advanced setup until a backend race-marathon builder is available.
- If true Custom distance cannot build a Quick setup preview through the current backend selected-plan seam, route Custom to Advanced setup or show a clear non-preview state. Do not submit a preview that is known to be unsupported.

Hito DS reuse:
- Reuse existing Hito DS buttons/cards/choice controls, `HitoDateField`, `HitoMaskedTimeField`, helper/error copy, status/readback pills, existing selected-plan preview dialog patterns, and the existing low-card onboarding rhythm.
- Do not introduce a new local UI kit.

Validation:
- Run targeted type/lint checks for touched files.
- Run `git diff --check`.
- If product code changes affect visible onboarding, use the built-in browser first for a desktop and 375px sanity check.
- Prove preview does not open for invalid local finish time, missing Custom distance, unsupported Marathon Base target fields, or backend `invalid_plan_goal_intent` leakage.
- Prove 10K and Half Marathon still reach preview with omitted optional fields.

Stop conditions:
- Stop and route BACKEND/PRODUCT if Product insists Custom must produce a real Quick setup preview but the backend cannot build true custom distance plans.
- Stop and route BACKEND/PRODUCT if Product insists Marathon target time/race day must stay in Quick setup while the only available selected backend card is still Marathon Base.
- Stop and route DESIGNER/COPY if the existing DS primitives cannot express the needed hierarchy without adding a new visual pattern.
```

## Owner
DESIGNER

## Last Updated
2026-06-28

## Source Of Truth
- Active plan: `docs/plans/active/2026-06-08-running-plan-creation-engine-rebuild.md`
- Current UI: `src/components/onboarding/PlanPresetPanel.tsx`
- Current flow utilities: `src/components/onboarding/selected-running-plan-flow-utils.ts`
- Current preview controller: `src/components/onboarding/use-selected-plan-preset-preview-controller.ts`
- Current structured constructor: `src/components/onboarding/StructuredPlanConstructor.tsx`
- Current backend contract: `src/lib/plan-creation-engine/plan-goal-intent.ts`
- Current selected-plan action: `src/lib/running-plan-engine-actions.ts`

## Problem Summary
The current Quick setup goal-intent surface can let a runner build a nonsensical preview request. The screenshot evidence shows a `Marathon Base` preview failing because target finish time was supplied to a builder that explicitly treats Marathon Base as base-building, not race-day or target-time preparation. The runner then sees a scary backend-shaped failure state and an internal reason string.

The root UX issue is not the backend validator. The backend is doing its job. The UI is exposing low-level fields too early and treating them as generic controls instead of guiding the runner through a coherent goal model.

## UX Verdict On Current Flow
Changes requested.

What works:
- Basic profile inputs exist.
- Plan cards exist.
- `planGoalIntent` backend shape exists.
- Hito date/time fields exist.
- Preview/review before create exists.

What fails:
- Goal intent appears as a technical block before the selected distance context is clear.
- `Outcome pace` is a primary input even though runners can easily read it as training pace truth.
- `Use selected card distance` is system language, not runner language.
- Custom distance is presented as a toggle rather than a goal path.
- Invalid combinations can reach the preview dialog.
- Backend reason strings can leak into runner-facing UI.
- Marathon Base can be visually treated like a target marathon race plan even when backend explicitly cannot support race-day/finish-time promises for that card.

## Proposed V1 Goal-Intent Flow
### 1. Basic Setup
Keep the first section light and close to the current Quick setup structure.

Required before card loading/selection:
- Age
- Height
- Weight
- Running level

Useful but optional before preview:
- Available running days per week
- Fixed rest days
- Preferred long-run day
- Recent 5K benchmark
- Plan start date

Design rule: do not make the runner complete a large goal form before seeing plan choices.

### 2. Goal Section
Replace the current technical `Goal intent` panel with a runner-facing section named `What are you training for?`.

Visible choices:
- `10K`
- `Half Marathon`
- `Marathon`
- `Custom`

Each choice should read as goal identity first, not backend recipe identity. The backend card/preset can still provide eligibility and exact plan source after selection.

### 3. Refinement After Distance Selection
After a goal is selected, show only refinements that make sense for that goal.

For `10K` and `Half Marathon`:
- Race day: optional
- Finish time: optional
- Derived pace readback: visible only after valid finish time

For `Marathon`:
- If current backend route is `Marathon Base`, treat it as base-building:
  - show copy: `Marathon Base builds durability. It does not promise a race day or finish time.`
  - hide or disable Race day / Finish time in this path
  - provide a quiet link/button: `Use Advanced setup for a race-day marathon goal`
- If frontend can route to backend `Marathon Completion`, then Race day and Finish time may be shown as optional with the same rules as other presets.

For `Custom`:
- Custom distance is required before preview.
- Distance label is optional.
- Race day is optional.
- Finish time is optional.
- Derived pace readback appears only after valid custom distance and valid finish time.
- If current backend selected-plan preview cannot generate true custom distance plans, do not call preview. Route to Advanced setup or show an explanatory unavailable state.

### 4. Preview Gate
Preview can open only when:
- required basics are valid
- a goal/distance is selected
- custom distance is valid when Custom is selected
- finish time is either empty or valid
- race day is either empty or valid
- the selected goal/refinement combination is supported by the backend builder

Preview must not open when local validation already knows the request is invalid.

## Field Order
Quick setup should appear in this order:

1. Basic setup
2. Running level
3. Available running days per week
4. Optional schedule rhythm
5. Optional benchmark
6. Goal section
7. Optional refinements for selected goal
8. Plan cards / preview CTA

The current Plan Preset cards can remain below the goal/refinement controls, but the runner should not have to understand a separate "selected card distance" toggle.

## Goal Card Anatomy
Each goal card should include:
- large distance identity
- short label
- short support copy
- available/unavailable/advanced-needed state
- selected state
- compact reason when unavailable

Suggested labels:
- `10K`
  `A compact goal for building rhythm and confidence.`
- `Half Marathon`
  `A longer build with steady endurance and quality work.`
- `Marathon`
  `A full-distance build. Hito will show whether this is Base or Completion.`
- `Custom`
  `Choose your own distance. Best when your race or goal is unusual.`

Do not show:
- backend source kind
- internal recipe id
- internal reason code
- target pace fields on the card
- dense data dump

## Field Behavior
### Race Day
Use `HitoDateField`.

Copy:
- Label: `Race day`
- Helper: `Optional. Leave blank if you just want a normal preparation horizon.`
- Empty state: no error
- Invalid state: `Use a real date.`

### Finish Time
Use `HitoMaskedTimeField`.

Copy:
- Label: `Finish time`
- Helper: `Optional. Add this only if you have a result goal.`
- Placeholder examples: `45:00`, `1:45:00`, `3:30:00`

Invalid state:
- `Use a realistic finish time for this distance.`
- If frontend uses the backend global range as local precheck, keep the runner copy human:
  `Finish time should be between 5 minutes and 48 hours.`

### Derived Pace
This is readback only.

Display only when:
- distance is known
- finish time is valid

Copy:
- `That means about 4:59/km on race day.`
- `This is goal readback, not your workout pace target.`

Do not show derived pace:
- when finish time is empty
- when finish time is invalid
- when custom distance is missing/invalid
- as an editable field

### Custom Distance
Use a Hito field with decimal input.

Copy:
- Label: `Custom distance`
- Helper: `Kilometers. For example: 12.5.`
- Error: `Enter a distance between 0 and 500 km.`

Distance label:
- Label: `Goal name`
- Helper: `Optional. For example: City 12.5K.`

## Running Coach Notes
Accepted coaching rules for this UX:
- Finish time can be optional.
- Race day can be optional.
- Direct pace should not be a normal Quick setup input in v1.
- Derived pace is acceptable as explanatory readback from distance plus finish time.
- Derived pace must not become executable workout pace.
- Backend feasibility must remain authoritative.
- If a goal looks aggressive, short-horizon, or unsupported, the UI should say that Hito needs a different setup path rather than promising readiness.
- Marathon Base must not be described as a race-readiness or target-time marathon plan.
- Marathon target-time/race-day goals require a builder that honestly supports that promise, or they should route to Advanced setup.

No medical/injury or performance-guarantee claims should be added in this slice.

## Copy Recommendations
### Selected Distance
- `Selected goal: Half Marathon`
- `Selected goal: Custom distance`
- `This distance shapes the plan preview.`

### Optional Finish Time
- `Optional. Add a finish time only if you have a result goal.`
- `Leave this blank for a finish-oriented plan.`

### Derived Pace
- `That means about 4:59/km on race day.`
- `Hito uses this as goal readback, not as workout pace truth.`

### Invalid Time
- `Adjust the finish time before previewing this plan.`
- `Use a realistic finish time for this distance.`

### Custom Distance
- `Choose your distance first. Then you can add a race day or finish time.`
- `Custom goals may use Advanced setup when Hito cannot build a safe quick preview yet.`

### Marathon Base
- `Marathon Base builds durability. It does not promise a race day or finish time.`
- `Use Advanced setup for a race-day or target-time marathon goal.`

### Preview Blocked
- `Adjust the goal details before previewing.`
- `This setup needs Advanced setup before Hito can review it safely.`

## State Specs
### Loading
- Card loading uses the existing `hito-surface-wash` pattern.
- Keep the selected goal controls visible while cards load.
- Do not clear the runner's valid goal fields during loading.

### Empty
- Before basics are complete, show:
  `Add Age, Height, and Weight to see plan options.`
- Before goal selection, show:
  `Choose what you are training for.`
- If Custom is selected without distance:
  `Enter a custom distance to continue.`

### Error
- Field errors appear next to the field.
- Goal-level errors appear below the selected goal/refinement block.
- Preview dialog should not open for known local errors.
- If backend still rejects after local validation, show friendly copy:
  `This setup cannot be previewed yet. Adjust the goal details or use Advanced setup.`
- Never show `invalid_plan_goal_intent`.

### Success / Review
- Valid selected goal + valid optional fields unlocks preview.
- Preview shows backend-normalized goal intent.
- If finish time produced derived pace, preview may show it as `Derived race-day pace`.
- Preview must repeat that this is goal readback, not executable workout pace.

## Mobile Behavior
At 375px:
- Goal cards stack in one column or a tight two-card rhythm only if labels remain readable.
- Refinement fields stack vertically.
- Derived pace readback sits directly below Finish time.
- Preview CTA stays reachable without forcing the user through a large card grid.
- Error copy should wrap naturally and not create horizontal overflow.

## Hito DS Reuse Rules
Reuse:
- existing Hito button classes
- existing Hito card/surface patterns
- `hito-row-group`
- `hito-section-divider`
- `hito-choice-toggle` or current plan preset card pattern where already accepted
- `HitoDateField`
- `HitoMaskedTimeField`
- `hito-field-helper`
- `hito-field-error`
- `hito-status-pill`
- existing selected-plan preview dialog anatomy

Do not introduce:
- new card system
- new date/time controls
- custom local select/toggle primitives
- new typography scale
- new route-local error panel style

## Frontend Implementation Checklist
- Remove direct `Outcome pace` from the main Quick setup goal-intent controls.
- Replace `Use selected card distance` wording with runner-facing goal choice.
- Add `Custom` as a clear goal choice.
- Require valid custom distance before preview when Custom is selected.
- Show Race day / Finish time only when supported by selected goal/backend route.
- Show derived pace readback only after valid distance + finish time.
- Block preview locally for invalid finish time, invalid custom distance, unsupported Marathon Base target fields, and unsupported Custom preview.
- Keep backend validation as final authority.
- Hide backend reason strings from runner-facing UI.
- Preserve selected-plan review/confirm exactness.
- Preserve no mutation before confirm.
- Preserve current Plan Preset card loading and selected-plan preview architecture.

## What Not To Change
- Do not change backend validators.
- Do not change persisted `planGoalIntent`.
- Do not change generated plan richness, repeat children, or plan creation engine behavior.
- Do not add fake pace or fake HR.
- Do not treat derived pace as executable workout target truth.
- Do not make feasibility frontend-owned.
- Do not redesign all onboarding.
- Do not remove Advanced setup.

## Acceptance Criteria
- A runner cannot open a preview that is already known to have invalid goal-intent fields.
- `Outcome pace` is not shown as a normal Quick setup input.
- Distance is selected before finish time/race day refinements matter.
- Custom requires distance before preview.
- Derived pace appears only as readback.
- Marathon Base cannot be previewed with target finish time or race day unless frontend routes to a backend-supported marathon race builder.
- Backend failure reason `invalid_plan_goal_intent` never appears in runner copy.
- Desktop and 375px layouts are readable and do not overflow.
- Existing 10K and Half Marathon preview flow still works with omitted optional fields.

## Risks
- Current backend selected-plan `marathon` card maps to `Marathon Base`. If Product expects race-day marathon goals in Quick setup now, this is a backend/product capability gap, not a frontend copy issue.
- Current backend can normalize custom distance, but selected-plan preview may still generate a preset endpoint. If Product expects true custom distance generation in Quick setup, this requires backend support or routing to Advanced setup.
- Removing direct outcome pace from main flow may require preserving backend support for existing internal/advanced callers without exposing it in Quick setup.

## Blockers
None for the Designer spec. Frontend must stop if implementation proves that Product expects true Custom or marathon target-time preview in Quick setup without a backend-supported builder.

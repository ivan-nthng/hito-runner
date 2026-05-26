# Active Plan Schedule Edit

## Status

In progress

## Owner

ARCHITECT / BACKEND / FRONTEND / QA

## Last Updated

2026-05-25

## Context

Hito already has strong backend-owned plan creation, saved-mode refresh proposal/apply, fixed weekday rest-day invariants, runner-level training preferences, and exact reviewed draft safety for larger future-plan regeneration.

The current runner-facing `Update plan` flow is too heavy for a simple scheduling request such as:

- change fixed rest days
- change the preferred long-run day
- move future workouts to different weekdays

Those changes should not require the runner to write a free-text prompt or wait for AI when the content of future workouts can be preserved.

## Product Goal

Add a simple `Edit schedule` option for the active plan.

The runner should be able to:

- choose fixed rest days
- choose the preferred long-run day
- keep the same number of running days and simply reflow future workouts across the new week
- understand when a change would alter weekly training frequency and therefore needs future workout regeneration
- import a JSON plan without inheriting impossible source weekdays when Hito already knows the runner's rest-day and long-run-day truth

This must feel like schedule editing, not like a second planner.

## Problem Definition

Today Hito has two scheduling concepts:

- runner-level defaults in Settings, used for future plans
- active-plan truth, used by the current saved plan

The missing product seam is a bounded way to edit active-plan scheduling truth without pretending it is only a Settings change.

Important distinction:

- Changing runner Settings should not silently rewrite the active plan.
- Editing the active plan schedule should not silently rewrite runner-level defaults unless the runner explicitly asks to save them as defaults too.

## Architecture Decision

Create one backend-owned active-plan schedule edit seam with two modes.

### Mode A: Deterministic Schedule Reflow

Use this when the runner keeps the same running-day count.

Behavior:

- preserve future workout content
- preserve workout identity, rich fields, segments, metric targets, and coaching copy
- preserve past, completed, logged, Garmin/evidence-backed, comparison-backed, and AI-insight-backed workouts
- move only future mutable workouts to the new allowed weekdays
- keep fixed rest days empty of non-rest workouts
- prefer placing each week's long run on the selected long-run day when possible
- preserve relative workout order within each week as much as possible
- no OpenAI call
- no doctrine regeneration
- review before apply

This is the "just move the days" path.

### Mode B: Future Plan Regeneration

Use this when the runner changes weekly running frequency.

Examples:

- 3 running days/week to 4 running days/week
- 5 running days/week to 3 running days/week
- fixed rest-day selection leaves a different number of available training slots than the active plan can fit

Behavior:

- show a clear warning that Hito must regenerate future mutable workouts
- route through the existing active-plan refresh proposal/draft/apply safety model
- preserve past/logged/evidence-backed history
- apply only the exact reviewed draft
- keep deterministic fallback and rich draft metadata behavior

This is not a manual day-shuffle. It is a schedule-driven refresh.

## Canonical Pipeline

`runner schedule input -> backend validation -> active-plan mutable-window resolution -> schedule edit preview -> explicit review/confirm -> transactional future-workout date update or reviewed refresh apply -> UI rendering`

Rules:

- Backend owns validation, preview, date movement, refresh routing, and persistence.
- Frontend only collects choices and renders the backend preview.
- No frontend-only calendar shuffling.
- No AI for same-frequency schedule reflow.
- No mutation before explicit confirm.

## JSON Import Scheduling Policy

Imported JSON should not be treated as absolute weekday authority when Hito already knows the runner's schedule truth.

When importing a `training-plan-v2` JSON file, Hito should preserve source content:

- workout order
- workout identity
- workout family
- rich segment content
- phase and goal context

Hito should treat these source fields as layout hints that may be remapped:

- source weekday labels
- source rest-day placement
- source long-run weekday placement

Required policy:

- runner/active-plan fixed rest days win over imported weekday placement
- imported non-rest workouts must not land on fixed rest days
- imported rest days may be inserted, removed, or moved as needed to satisfy fixed rest days
- imported long-run workouts should land on the preferred or derived long-run day when feasible
- if the imported long run is on Wednesday but the runner's long-run day is Saturday, preserve the long-run workout content and move it to Saturday when the week can support it
- if the imported long-run day conflicts with fixed rest days, use the same fallback rule as Settings and setup: Sunday, else Saturday, else latest available weekday
- if multiple durability/long sessions exist in one week, preserve their relative order and avoid silently stacking them onto one day
- if the imported plan's frequency cannot fit the runner's fixed rest days, return a bounded review/error instead of silently corrupting the schedule

Current implementation note:

- `mapImportedSeedAcrossAllowedWeekdays` already remaps imported non-rest workouts across allowed weekdays and inserts fixed rest days.
- This plan extends the same idea so preferred long-run day becomes explicit canonical placement truth, not a side effect of sequence order.

The same schedule placement helper should support both active-plan same-frequency schedule reflow and JSON import remapping. Do not create separate import-only weekday logic.

## Schedule Edit Input Contract

Suggested product input:

```ts
type ActivePlanScheduleEditInput = {
  fixedRestDays: WeekdayName[];
  preferredLongRunDay: WeekdayName | null;
  runningDaysPerWeek: number;
  saveAsDefaultTrainingPreferences?: boolean;
};
```

Validation:

- `fixedRestDays` allows `0..6` days.
- all seven fixed rest days are invalid.
- `runningDaysPerWeek` is required.
- `runningDaysPerWeek` must be `1..(7 - fixedRestDays.length)`.
- `preferredLongRunDay` is optional.
- `preferredLongRunDay` cannot be a fixed rest day.
- if no preferred long-run day is selected, derive Sunday, else Saturday, else latest available weekday.

Reuse the shared `runner-training-preferences.ts` weekday validation and fallback rules instead of creating another policy.

## Preview Contract

Add a non-mutating backend preview.

Suggested result:

```ts
type ActivePlanScheduleEditPreview =
  | {
      ok: true;
      mode: "schedule_reflow";
      changes: {
        affectedDateRange: { startDate: string; endDate: string };
        movedWorkoutCount: number;
        preservedWorkoutCount: number;
        fixedRestDays: WeekdayName[];
        preferredLongRunDay: WeekdayName | null;
        derivedLongRunDay: WeekdayName | null;
      };
      examples: Array<{
        workoutId: string;
        title: string;
        fromDate: string;
        toDate: string;
      }>;
      warnings: string[];
      previewToken: string;
    }
  | {
      ok: true;
      mode: "requires_regeneration";
      reason: "running_day_count_changed" | "schedule_no_longer_fits";
      message: string;
      suggestedRefreshPrompt: string;
    }
  | {
      ok: false;
      reason: "invalid_input" | "no_active_plan" | "no_mutable_workouts" | "protected_history_conflict";
      message: string;
    };
```

Preview must include enough information for the runner to understand:

- what dates will move
- what stays protected
- whether no workout content changes
- whether future regeneration is required

## Apply Contract

### Schedule Reflow Apply

Apply only if the preview is still current.

Backend should verify:

- active plan id still matches
- mutable-window fingerprint still matches
- protected workouts are unchanged
- no moved workout gained a log/evidence row after preview
- no non-rest workout lands on a fixed rest day
- long-run day is valid or derived

Apply behavior:

- transactionally update only future mutable `planned_workouts` dates/display order/week metadata as needed
- preserve workout content and rich workout fields
- update active plan scheduling metadata / `plan_preferences` with fixed rest days and long-run preference
- optionally update runner-level `training_preferences` only if `saveAsDefaultTrainingPreferences` is true
- return refreshed saved-mode snapshot

### Regeneration Apply

Do not create a second apply path.

If preview returns `requires_regeneration`, frontend should route the runner into the existing active-plan refresh proposal/apply flow with a generated prompt, for example:

> Change my active plan to 4 running days per week, keep fixed rest days on Wednesday and Sunday, and prefer Saturday for the long run. Regenerate only future workouts and preserve completed/logged history.

The existing refresh safety model remains the mutation boundary.

## Frontend Surface

Recommended location:

- `Open plan` dialog
- new focused panel: `Edit schedule`
- separate from the current free-text `Update plan`

UI structure:

- show current active-plan schedule summary
- fixed rest-day weekday selector
- running days/week selector
- preferred long-run day selector
- optional checkbox: `Also save as my default for future plans`
- primary action: `Review schedule changes`
- preview state:
  - if `schedule_reflow`: show moved workout count, affected range, example moves, fixed rest days, long-run day, and `Apply schedule changes`
  - if `requires_regeneration`: show warning and CTA `Review regenerated future plan`

Copy policy:

- Same running-day count:
  - "Hito will only move future workouts. Workout content will stay the same."
- Running-day count changed:
  - "Changing weekly frequency means Hito needs to regenerate future workouts. Completed and logged workouts stay protected."

## Backend Responsibilities

- Add one active-plan schedule edit contract module.
- Reuse shared weekday/training-preference validation.
- Resolve current active-plan scheduling truth.
- Determine mutable workout window.
- Build deterministic reflow preview.
- Build stale-safe apply mutation.
- Preserve rich workout fields during date movement.
- Route frequency changes to existing refresh proposal flow, not a new planner.

Suggested files to inspect:

- `src/lib/runner-training-preferences.ts`
- `src/lib/weekday-rest-invariants.ts`
- `src/lib/plan-apply-policy.ts`
- `src/lib/imported-plan.ts`
- `src/lib/active-plan-refresh-actions.ts`
- `src/lib/active-plan-refresh-draft.ts`
- `src/lib/active-plan-persistence.ts`
- `src/lib/training-api.ts`
- Supabase schema for `plan_cycles`, `planned_workouts`, and `runner_profiles.training_preferences`

## Frontend Responsibilities

- Add `Edit schedule` inside `PlanManagementDialog` through a focused child component.
- Reuse existing Hito weekday controls where possible.
- Do not implement local schedule movement.
- Render backend preview modes exactly.
- Preserve `Update plan` as the broader AI/request-based refresh flow.
- Keep mobile layout and sticky/action visibility safe.

Suggested files to inspect:

- `src/components/PlanManagementDialog.tsx`
- `src/components/plan-management/PlanRefreshPanel.tsx`
- `src/components/onboarding/TrainingPreferenceFields.tsx`
- `src/components/onboarding/onboarding-form-model.ts`
- `src/components/ui/*`

## QA Expectations

Minimum QA matrix:

- same running-day count, new fixed rest days, future workouts move and content stays unchanged
- preferred long-run day changes, future long runs move where feasible
- JSON import with a long run on the wrong weekday moves the long run to the active/runner preferred long-run day where feasible
- JSON import with source workouts on fixed rest days remaps non-rest workouts away from blocked days and inserts/restores rest days as needed
- JSON import whose workout frequency cannot fit the resolved fixed rest days returns a bounded review/error instead of silently applying a broken schedule
- past/completed/logged workouts stay unchanged
- Garmin/evidence-backed workouts stay unchanged
- fixed rest days have no non-rest workouts after apply
- preview becomes stale if a mutable workout is logged before apply
- increasing running days/week returns `requires_regeneration`
- decreasing running days/week returns `requires_regeneration`
- regeneration CTA routes into existing refresh review/apply flow
- optional `saveAsDefaultTrainingPreferences` updates Settings defaults only when selected
- mobile `Open plan` dialog has no horizontal overflow

## Risks

- Moving dates in place can surprise users if review copy is too vague.
- Week-level long-run placement can be ambiguous when a week has multiple long/trail durability sessions.
- Updating runner defaults accidentally would violate the active-plan vs profile-default boundary.
- A frontend-only drag/drop implementation would duplicate backend scheduling truth.

## Non-Goals

- per-workout drag/drop editor
- full calendar editor
- AI rewrite for same-frequency day changes
- changing workout content during schedule reflow
- rewriting completed/logged/evidence-backed history
- changing Voice or text authoring
- new scheduling subsystem outside existing plan entities

## Implementation Slices

### Slice 1: Backend Preview Contract

Status: Implemented 2026-05-25.

- [x] create deterministic schedule edit preview
- [x] define the shared placement helper foundation for active-plan weekday/long-run reflow
- [x] validate input through shared training-preference rules
- [x] classify `schedule_reflow` vs `requires_regeneration`
- [x] add fixture coverage for moved days, long-run placement, protected history, fixed rest-day proof, rich-field preservation, and frequency-change warning
- [ ] wire JSON import long-run remapping into the same placement helper in a later backend slice

### Slice 2: Backend Apply Contract

Status: Slice 2B implemented 2026-05-25.

- [x] apply reviewed schedule reflow from the backend preview token
- [x] reload/revalidate active-plan, workout, log, and evidence truth before mutation
- [x] reject stale preview, regeneration-required preview, protected-history, and fixed-rest violations
- [x] update only reviewed future non-rest date/weekday/week/display metadata
- [x] preserve protected history, workout content, rich fields, metric targets, goal context, and source metadata
- [x] update active-plan scheduling metadata in `plan_preferences`
- [x] add stale/protected-history/fixed-rest/rich-preservation fixture coverage
- [x] replace guarded update plus rollback with one transaction-backed Supabase RPC for atomic workout-date and plan-preference persistence
- [x] add fixture coverage proving failed apply leaves workout dates and plan preferences unchanged
- [ ] optionally save runner defaults only after the later explicit opt-in slice
- [ ] add route/UI integration after the frontend `Edit schedule` panel exists

### Slice 3: Frontend `Edit Schedule` Panel

Status: Implemented 2026-05-25.

- [x] add focused panel inside `Open plan`
- [x] render active-plan schedule summary, fixed rest days, running days/week, and optional long-run day inputs
- [x] call backend preview from `Review schedule changes`
- [x] render backend `schedule_reflow` review with affected range, moved/preserved counts, fixed rest days, effective long-run day, example moves, warnings, and explicit not-applied boundary
- [x] call backend apply only with the reviewed preview token and original input
- [x] show stale/blocked apply failures with a `Review again` recovery
- [x] route `requires_regeneration` cases toward the existing `Update plan` refresh prompt path without applying from the schedule panel
- [x] return to the refreshed saved-mode plan after successful apply
- [x] keep runner Settings/profile defaults unchanged in this slice
- [x] prefill edit controls from active-plan `plan_preferences` when available, with safe workout-derived fallback when scheduling preferences are absent

### Slice 4: QA Closeout

- run browser flow on disposable active plan
- verify no mutation before apply
- verify same-count reflow and frequency-change refresh boundary
- verify Settings default opt-in behavior

## Exit Criteria

- Runner can change fixed rest days for an active plan without free-text prompting.
- Runner can change preferred long-run day for an active plan.
- Same-frequency edits move only future mutable workouts and preserve workout content.
- Frequency changes clearly route to future-workout regeneration with review/apply safety.
- Protected history remains untouched.
- Runner-level defaults are updated only by explicit opt-in.
- No parallel planner, frontend schedule logic, or silent mutation is introduced.

## Next Recommended Role

QA

## Suggested Next Step

Run browser QA for the `Open plan` -> `Edit schedule` preview/apply flow with a disposable active-plan tester.

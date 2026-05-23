# Runner Profile And Training Preferences Settings

## Status

Complete / Closed

## Owner

Architect / Backend / Frontend / QA

## Last Updated

2026-05-22

## Closeout Note

This plan is closed and archived. Backend storage/settings contract, shared training-preference mapping, Settings/Onboarding progressive controls, Quick setup prefill, structured review modal, explicit confirm, and core QA for persistence/rest-day/non-mutating flows are complete.

Residual QA hygiene items were source-verified and are non-blocking follow-ups, not reasons to reopen implementation:

- invalid/correction UI and custom 5K invalid-range Safari exercise
- voice-to-plan and Advanced JSON end-to-end re-smoke

## Context

Hito already persists first-plan profile basics into `runner_profiles`:

- first name
- last name
- display name
- avatar metadata
- age
- weight
- height

The current settings route can read and update those fields.

The missing product layer is stable runner-level training preferences. Today, preferences such as fixed rest days and preferred long-run day mostly live in active-plan `plan_preferences`. That helps an active plan, but it does not fully solve the runner expectation:

- “I entered this once; Hito should remember it.”
- “When I create a new plan, don’t make me fill the same basics again.”
- “My rest days and long-run day are personal constraints, not just one plan’s metadata.”

## Problem Definition

New plan creation should start from saved runner truth when available.

The runner should be able to maintain:

- personal data used by plan generation
- training preferences used by future plan creation, import, and refresh

This must not become a full account/settings redesign or a weekly schedule editor.

## Product Rule

Runner-level profile truth should prefill future plan creation.

Canonical rule:

- personal data belongs to the runner profile
- stable weekly training preferences belong to the runner profile
- active-plan preferences remain the truth for the currently active plan
- when creating a new plan, Hito should prefer saved runner defaults unless the runner explicitly changes them in the constructor

## Settings Information Architecture

Settings should be organized into two clear product sections.

### Personal Data

Fields:

- first name
- last name
- display name
- email readback
- avatar
- age
- weight
- height

Purpose:

- identify the runner
- size plan generation inputs
- avoid asking for the same body/profile data every time

### Training Preferences

Fields for v1:

- default running days per week
- fixed rest days
- preferred long-run day

Optional later fields, not required for this slice:

- preferred guidance mode
- watch/app availability
- preferred terrain
- strength/mobility preference
- HR zone settings

Purpose:

- provide stable defaults for new plans
- feed weekday rest-day invariants
- reduce repeated onboarding input
- avoid plan-specific preferences becoming lost when a plan is deleted, replaced, or refreshed

## Persistence Model

Smallest safe backend model:

- keep existing personal-data columns on `runner_profiles`
- add one bounded runner-level training preferences shape on `runner_profiles`

Recommended storage:

- `runner_profiles.training_preferences jsonb`

The JSON object should reuse the same keys already understood by plan preferences where possible:

- `blocked_days`
- `preferred_long_run_day`
- `max_running_days_per_week`
- optional later `preferred_run_days`

Reason:

- weekday invariant code already understands profile-shaped preference objects
- active plan `plan_preferences` already uses similar keys
- this avoids creating a second naming system for the same scheduling truth
- it keeps the first slice small without adding a large preference table

Validation rules:

- `blocked_days` must be an array of valid weekday names
- `preferred_long_run_day` must be a valid weekday or null
- `max_running_days_per_week` must be integer `1..7`
- preferred long-run day cannot be one of the blocked days
- running days per week must fit outside blocked days

## Onboarding / Plan Creation Prefill

When a signed-in runner opens the structured constructor and profile settings exist:

- age should prefill from `runner_profiles.age`
- weight should prefill from `runner_profiles.weight_kg`
- height should prefill from `runner_profiles.height_cm`
- fixed rest days should prefill from `runner_profiles.training_preferences.blocked_days`
- running days per week should prefill from `max_running_days_per_week` when the UI exposes it
- preferred long-run day should prefill from `preferred_long_run_day` when the UI exposes it

If the runner changes values during plan creation:

- the confirmed plan should use the changed values
- personal data updates should persist back to `runner_profiles`
- training preference changes should persist back to `runner_profiles.training_preferences`
- active-plan `plan_preferences` should still receive the resolved preferences for that specific plan

## Current Plan Vs Runner Defaults

Active plan preferences and runner defaults are related but not identical.

Runner defaults answer:

- “What does this runner usually want?”

Active plan preferences answer:

- “What constraints did this specific plan use?”

Rules:

- editing settings should affect future plan creation
- editing settings should not silently rewrite the current active plan
- future `Update plan` / refresh work may read the latest runner defaults, but must still use explicit proposal/apply safety before mutating a plan
- imported or refreshed plans should persist the resolved preference snapshot into `plan_preferences`

## Backend Responsibilities

Backend owns:

- schema migration for bounded runner training preferences
- settings read/write validation
- merging onboarding-confirmed preference changes into runner profile defaults
- prefill data shaping for no-plan setup route
- feeding runner-level preferences into weekday rest-day invariant resolution
- ensuring active-plan mutation remains explicit
- the shared training-preference validation/mapping contract
- fitness-level to structured-authoring mapping

Backend must not:

- let frontend invent scheduling rules
- silently change existing active plan workouts when settings change
- create a broad scheduling CMS
- store free-form preference blobs without validation

## Implementation Progress

- [x] Add `runner_profiles.training_preferences jsonb` migration.
- [x] Align local Supabase database types with the linked schema.
- [x] Validate settings read/write payloads for `blocked_days`, `preferred_long_run_day`, and `max_running_days_per_week`.
- [x] Preserve existing personal-data save behavior when training preferences are omitted.
- [x] Persist structured first-plan weekly defaults into runner-level training preferences after explicit plan creation.
- [x] Add visible `/settings` training-preference controls.
- [x] Prefill the structured constructor UI from saved training preferences.
- [x] Align `/settings` personal data and training preference controls with existing Hito tabs, editable value chips, and structured-onboarding weekday choice patterns.
- [x] Add one shared validation/mapping contract for Settings and structured setup.
- [x] Tighten fixed rest-day / running-day / long-run preference rules to match the progressive product model.
- [x] Add backend-compatible `fitnessLevel` mapping where only `custom + recent5kTime` produces numeric benchmark truth.
- [x] Replace current benchmark choices with the `fitnessLevel` model in structured setup.
- [x] Show `draft_ready` structured setup reviews in a modal; keep `correction_required` inline.

## Shared Training Preference Contract Update

The next implementation slice should consolidate preference rules across Settings and structured setup.

Product-facing names:

- `fixedRestDays`
- `defaultRunningDaysPerWeek`
- `preferredLongRunDay`

Storage names:

- `blocked_days`
- `max_running_days_per_week`
- `preferred_long_run_day`

Canonical decision:

- keep the existing snake_case stored keys
- do not migrate or rename the JSON storage shape
- map product-facing camelCase names at UI/request boundaries
- preserve compatibility with `plan_preferences`, imported-plan metadata, and weekday rest-day invariants

Reason:

- the snake_case keys already match `plan_preferences` and existing import/refresh invariant logic
- renaming storage now would create unnecessary migration risk and duplicate compatibility code
- the product can still speak in runner-facing language while backend storage stays compatible

## Progressive Preference UX Rules

Fixed rest days:

- allow `0..6` fixed rest days
- do not allow all seven weekdays to be fixed rest days
- expose an explicit `No fixed rest days` state
- empty `blocked_days: []` is valid only when the user intentionally chose no fixed rest days or when a legacy value is absent and the UI asks them to choose

Default running days per week:

- appears only after the fixed-rest-day step has an answered state
- required when saving the training-preference bundle
- must be `1..(7 - fixedRestDays.length)`
- stores as `max_running_days_per_week`

Preferred long-run day:

- optional
- cannot be one of the fixed rest days
- stores as `preferred_long_run_day` when explicitly chosen
- stores as `null` when not chosen

Default long-run fallback when empty:

1. Sunday if available
2. else Saturday if available
3. else latest remaining available weekday

The fallback should be applied for plan generation and review display, not stored as if the runner explicitly chose it.

## Fitness Benchmark Contract

Structured setup should replace the current visible benchmark model with:

- `new_to_running`
- `beginner`
- `running_regularly`
- `performance_focused`
- `custom`

Rules:

- only `custom` produces numeric benchmark truth
- `recent5kTime` is required only when `fitnessLevel === "custom"`
- custom 5K input uses a direct time field, not a slider
- recommended accepted custom 5K range is `18:00` to `55:00`
- non-custom levels inform generation/readiness conservatively but must not emit fake precise pace truth
- non-custom levels must not create `recent5kTime`, `recent5kPace`, or `pace_min_per_km_range` by themselves
- do not invent HR targets from fitness level

Persistence decision:

- do not store `fitnessLevel` or `recent5kTime` inside `runner_profiles.training_preferences` in this rollout
- fitness benchmark remains structured-authoring context only
- later, if Hito needs persistent benchmark history, create a separate runner performance/benchmark concept instead of overloading training preferences

Mapping to existing authoring seam:

- `custom + recent5kTime` maps to the existing recent-5K time authoring path
- all non-custom values map to non-numeric benchmark mode while influencing `experienceLevel`, baseline load, and review copy conservatively
- existing recent-5K pace support can remain as backend compatibility, but it should not be the normal visible structured setup path for this rollout

## Shared Validation / Mapping Owner

Create one shared pure contract module for training preferences and use it from:

- `src/lib/user-settings-actions.ts`
- `src/lib/structured-first-plan-onboarding.ts`
- `src/components/onboarding/onboarding-form-model.ts`
- `src/components/onboarding/TrainingPreferenceFields.tsx`

Implemented backend owner:

- `src/lib/runner-training-preferences.ts`

Implemented in this backend slice:

- settings and structured setup now share backend validation/mapping for storage and product preference names
- seven fixed rest days are rejected; zero fixed rest days remains valid
- default running days are required when saving a preference bundle and must fit available weekdays
- preferred long-run day cannot be one of the fixed rest days
- plan generation/review can derive Sunday, then Saturday, then latest available weekday when no explicit long-run preference exists
- the derived long-run fallback is not stored as if the runner explicitly selected it
- backend-compatible `fitnessLevel` input can map `custom + recent5kTime` to existing recent-5K authoring truth, while non-custom levels stay non-numeric

Recommended owner:

- `src/lib/runner-training-preferences.ts`

Responsibilities:

- weekday constants/types re-export or reuse
- parse product-facing preference input
- normalize stored snake_case preferences
- validate `0..6` fixed rest days
- validate required default running days when saving a bundle
- validate preferred long-run day against fixed rest days
- derive available weekdays
- derive default long-run day fallback
- map UI/product names to storage names
- map storage names back to UI defaults

The module must stay pure and safe for frontend import. It must not import Supabase clients, server request state, or route/action code.

## Settings To Structured Draft Mapping

Settings stored preferences map into structured setup defaults as:

- `training_preferences.blocked_days` -> `fixedRestDays`
- `training_preferences.max_running_days_per_week` -> `defaultRunningDaysPerWeek`
- `training_preferences.preferred_long_run_day` -> `preferredLongRunDay`

When values are missing:

- fixed rest day step should show unanswered or explicit `No fixed rest days`, depending on UX state
- default running days should not silently save until the runner has answered the bundle
- structured setup may prefill a safe derived value for convenience, but backend confirm must still validate the request payload

When structured setup is confirmed:

- profile basics persist back to `runner_profiles`
- stable weekly preferences persist back to `runner_profiles.training_preferences`
- active plan `plan_preferences` receives the resolved plan-specific snapshot
- optional fitness benchmark remains generation context only

## Voice-To-Plan Later Alignment

Voice-to-plan should eventually use stored preferences as supplements:

- fixed rest days
- default running days per week
- preferred long-run day

This is not required in the current rollout.

Do not change the voice UI in this slice. The current voice draft/confirm boundary must stay unchanged.

## Structured Review Modal Boundary

Current structured review already uses backend draft/confirm. The next UI correction is presentation and interaction shape:

- `Review setup` calls `generateStructuredFirstPlanDraft` only
- `correction_required` renders inline near the form, not in a modal
- `draft_ready` opens a modal review
- modal primary action is `Yes, create plan`
- modal secondary/cancel/X closes the modal, clears the draft review state, returns to the editable form, and creates nothing
- `confirmStructuredFirstPlanDraft` is called only by the modal primary action
- Advanced JSON behavior remains unchanged
- voice-to-plan review/confirm remains unchanged

Implementation boundary:

- `OnboardingGate` should continue owning draft state and server actions
- a focused presentational review dialog can own review layout and buttons
- use the existing Hito dialog/modal primitive; do not add a new modal framework

## Frontend Responsibilities

Frontend owns:

- settings page grouping into `Personal data` and `Training preferences`
- progressive controls for fixed rest days, default running days per week, and preferred long-run day
- prefilled structured constructor state from backend-provided defaults
- clear copy that settings affect future plans, not the already active schedule
- structured setup review modal for `draft_ready`
- inline correction handling for `correction_required`

Frontend must not:

- calculate final training weekdays independently
- update active plans directly from settings
- turn this into a drag/drop weekly calendar editor

## QA Expectations

QA should verify:

- first-plan age, weight, and height still persist to settings
- `/settings` shows saved personal data
- updating personal data in settings persists and reloads
- `No fixed rest days` can be selected explicitly
- fixed rest days can be saved as runner-level preferences
- 0 fixed rest days and 6 fixed rest days are valid
- 7 fixed rest days are blocked
- default running days appears only after rest-day state is answered
- default running days is required when saving training preferences
- default running days cannot exceed available non-rest days
- preferred long-run day cannot be saved on a fixed rest day
- empty preferred long-run day falls back to Sunday, else Saturday, else latest available weekday for generation/review
- new plan creation pre-fills saved personal data
- new plan creation pre-fills saved fixed rest days
- new plan creation uses saved preferences unless runner changes them
- `fitnessLevel=custom` requires direct recent 5K time input
- custom recent 5K rejects values outside `18:00..55:00`
- non-custom fitness levels do not emit numeric benchmark truth
- `draft_ready` opens a modal review
- closing/cancelling the modal creates nothing and returns to the editable form
- `correction_required` stays inline near the form
- changing settings does not mutate the active plan silently
- weekday rest-day invariants still win during import and refresh

## Risks

- If settings changes silently affect active plans, runners may lose trust.
- If runner defaults and plan preferences use different key names, the scheduling system will drift.
- If the preferences object is too broad, it can become an untyped junk drawer.
- If the constructor prefill is frontend-only, backend safety can diverge.
- If fitness benchmark is persisted into training preferences, stale performance data can masquerade as a stable scheduling default.
- If review is inline instead of modal, the runner can miss the explicit create confirmation boundary.

## Non-Goals

- full account redesign
- billing/profile management
- per-workout drag/drop schedule editing
- automatic active-plan rewrite after settings save
- HR-zone implementation
- device connection settings
- medical profile
- persistent benchmark history
- voice-to-plan UI changes
- Advanced JSON behavior changes

## Exit Criteria

- Settings has clear personal-data and training-preference sections.
- Runner-level training preferences are backend-owned and validated.
- Structured plan creation can prefill from saved profile/settings truth.
- Confirmed first-plan creation updates saved profile defaults where appropriate.
- Current active plans are not silently mutated by settings edits.
- Weekday rest-day invariant resolution can consume runner-level preferences.
- Structured setup uses the progressive preference model and modal review boundary.
- Fitness benchmark follows the bounded `fitnessLevel` model without fake pace or HR precision.

## Implementation Slices

### Slice 1 - Backend Shared Contract

Owner: `BACKEND`

Goal:

- centralize training-preference validation/mapping and fitness-level mapping before more UI changes

Likely files:

- `src/lib/runner-training-preferences.ts`
- `src/lib/user-settings-actions.ts`
- `src/lib/structured-first-plan-onboarding.ts`
- `src/lib/first-plan-authoring-utils.ts`
- `src/lib/weekday-rest-invariants.ts`

Requirements:

- keep stored snake_case keys
- accept product-facing request names where appropriate only at API/UI boundaries
- validate fixed rest days `0..6`
- require default running days when saving a complete preference bundle
- enforce max running days as `7 - fixedRestDays.length`
- preserve optional preferred long-run day and fallback rule
- add/align `fitnessLevel` contract
- map `custom + recent5kTime` to existing recent-5K authoring truth
- keep non-custom fitness levels non-numeric

### Slice 2 - Frontend Shared Controls

Owner: `FRONTEND`

Goal:

- make Settings and structured setup use the same progressive preference model

Likely files:

- `src/components/onboarding/TrainingPreferenceFields.tsx`
- `src/components/onboarding/onboarding-form-model.ts`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- `src/routes/settings.tsx`

Requirements:

- explicit `No fixed rest days`
- show default running days only after rest-day state is answered
- require default running days before saving/reviewing
- limit running-day options to available non-rest days
- keep preferred long-run day optional and disabled on fixed rest days
- add visible `fitnessLevel` options and custom direct 5K time field
- remove normal visible 5K pace branch from structured setup unless kept behind compatibility only

### Slice 3 - Frontend Review Modal

Owner: `FRONTEND`

Goal:

- migrate structured `draft_ready` review from inline replacement to modal review

Likely files:

- `src/components/OnboardingGate.tsx`
- `src/components/onboarding/StructuredPlanConstructor.tsx`
- optional new focused review-dialog component under `src/components/onboarding/`

Requirements:

- `Review setup` remains non-mutating
- `draft_ready` opens modal
- `Yes, create plan` is modal primary action
- cancel/X closes modal and creates nothing
- `correction_required` stays inline near form
- voice-to-plan and Advanced JSON remain unchanged

### Slice 4 - QA Matrix

Owner: `QA`

Goal:

- verify preference contract, modal boundary, benchmark mapping, and no-regression paths

Required checks:

- Settings save/load
- Quick setup prefill
- no fixed rest days
- six fixed rest days
- seven blocked rest days
- default running-day max changes with fixed rest days
- preferred long-run fallback
- custom 5K validation
- non-custom levels do not produce pace targets
- modal cancel creates nothing
- modal confirm creates exactly one active plan
- voice-to-plan unchanged
- Advanced JSON unchanged

## Next Recommended Role

FRONTEND

## Suggested Next Step

Implement Slice 2: make Settings and structured setup consume the shared training-preference contract from one visible progressive control model, including explicit no fixed rest days, bounded running-day options, optional long-run day, and visible `fitnessLevel` choices without changing voice-to-plan or Advanced JSON behavior.

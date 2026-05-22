# Runner Profile And Training Preferences Settings

## Status

Active - implementation task ready

## Owner

Architect / Backend / Frontend / QA

## Last Updated

2026-05-22

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

Backend must not:

- let frontend invent scheduling rules
- silently change existing active plan workouts when settings change
- create a broad scheduling CMS
- store free-form preference blobs without validation

## Frontend Responsibilities

Frontend owns:

- settings page grouping into `Personal data` and `Training preferences`
- compact controls for fixed rest days and preferred long-run day
- prefilled structured constructor state from backend-provided defaults
- clear copy that settings affect future plans, not the already active schedule

Frontend must not:

- calculate final training weekdays independently
- update active plans directly from settings
- turn this into a drag/drop weekly calendar editor

## QA Expectations

QA should verify:

- first-plan age, weight, and height still persist to settings
- `/settings` shows saved personal data
- updating personal data in settings persists and reloads
- fixed rest days can be saved as runner-level preferences
- preferred long-run day cannot be saved on a fixed rest day
- new plan creation pre-fills saved personal data
- new plan creation pre-fills saved fixed rest days
- new plan creation uses saved preferences unless runner changes them
- changing settings does not mutate the active plan silently
- weekday rest-day invariants still win during import and refresh

## Risks

- If settings changes silently affect active plans, runners may lose trust.
- If runner defaults and plan preferences use different key names, the scheduling system will drift.
- If the preferences object is too broad, it can become an untyped junk drawer.
- If the constructor prefill is frontend-only, backend safety can diverge.

## Non-Goals

- full account redesign
- billing/profile management
- per-workout drag/drop schedule editing
- automatic active-plan rewrite after settings save
- HR-zone implementation
- device connection settings
- medical profile

## Exit Criteria

- Settings has clear personal-data and training-preference sections.
- Runner-level training preferences are backend-owned and validated.
- Structured plan creation can prefill from saved profile/settings truth.
- Confirmed first-plan creation updates saved profile defaults where appropriate.
- Current active plans are not silently mutated by settings edits.
- Weekday rest-day invariant resolution can consume runner-level preferences.

## Next Recommended Role

BACKEND

## Suggested Next Step

Add the backend persistence and settings action slice first: introduce bounded `runner_profiles.training_preferences`, validate fixed rest days / preferred long-run day / max running days per week, expose those values in settings route data, and make structured first-plan confirmation persist the runner-level defaults alongside the active plan preferences.


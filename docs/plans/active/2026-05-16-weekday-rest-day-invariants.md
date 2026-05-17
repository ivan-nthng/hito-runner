Status

In progress - first backend invariant slice implemented

Owner

Architect / Backend

Last Updated

2026-05-16

Implementation Update

2026-05-16 backend slice:

- added one canonical weekday rest-day invariant helper in [src/lib/weekday-rest-invariants.ts](/Users/ivan/Library/Mobile%20Documents/com~apple~CloudDocs/4-web/hito-running/src/lib/weekday-rest-invariants.ts)
- import/apply now resolves fixed off weekdays from runner/profile-shaped preferences, active-plan preferences, then imported metadata, with active-plan truth taking priority when present
- saved-mode JSON import/apply now rejects a chosen start date on a blocked weekday and maps incoming non-rest workouts in original sequence across allowed weekdays instead of blind date-offset replay
- blocked weekdays are inserted as rest days in the applied schedule mapping
- `RunnerCoachContext` now exposes the resolved invariant for refresh proposal generation
- active-plan refresh proposal review includes fixed rest days in `What stays the same` when known
- active-plan refresh stale fingerprints now include the weekday invariant signature, and explicit refresh apply validates generated future workouts against fixed off-days before archive/replace persistence
- refresh apply now also repairs model-generated availability against resolved fixed rest days before canonical validation, so a schema-valid model response cannot keep a blocked weekday as a preferred or long-run day
- the final refresh apply hardening pass verified repeated archive/replace applies preserve Wednesday/Sunday fixed rest days while malformed unsafe output still blocks without mutation

Still deferred:

- runner-facing missing-truth weekday-off question
- runner-level persisted off-day settings UI/schema beyond existing profile-shaped preference support
- full schedule editor or off-day change workflow

Context

Hito now has:

- canonical `training-plan-v2` import
- user-chosen start date for import/apply
- text-first plan generation with explicit availability inputs
- proposal-only `Update plan` from saved history
- a planned explicit confirm/apply loop for refresh proposals

But current apply logic is still too sequence-driven.

Today the backend primarily:

- shifts imported day 1 / day 2 / day 3 from an effective start date
- preserves or replaces only the first conflicting day
- treats weekday names on workouts as derived output

That is not enough for real runner expectations when weekly off-days are intentional and stable.

Problem Definition

The current model can break fixed rest-day intent.

Example failure:

- a runner wants Wednesday and Sunday off
- a plan was originally generated or authored around that pattern
- the runner reloads or refreshes the plan from a different start date
- Hito remaps the sequence linearly
- workouts now land on Wednesday or Sunday

That is not acceptable runner-facing behavior.

The product needs one stronger invariant:

- stable runner weekday rest-day constraints must survive import, restart, refresh, and approved update apply

Canonical Rest-Day Rule

Explicit runner weekday rest-day constraints are stronger than simple linear date shift.

Canonical priority:

1. fixed runner off-day weekdays
2. preserved original workout sequence and training intent
3. simple calendar offset from chosen start date

This means:

- Hito must not blindly replay imported day N onto chosen date plus N minus 1 if that would violate fixed off-days
- simple date shift is only valid when it does not break the runner’s weekday rest-day invariants

What Must Override Simple Date Shift

- explicit runner blocked weekdays
- canonical saved plan preferences that already define blocked weekdays
- explicit imported-plan rest-day metadata when that is the only available source of runner intent

Where Rest-Day Intent Comes From

Hito should resolve weekday rest-day intent from one canonical backend-owned priority order:

1. runner-level saved weekday off-day preference when available
2. current active-plan saved preferences when those are already canonical for the runner
3. imported plan metadata:
   - `plan_preferences.blocked_days`
   - `plan_preferences.unavailable_days`
   - `training_constraints.full_rest_days`
   - inverse interpretation of explicit preferred running days when necessary
4. explicit import/apply question only when no canonical rest-day truth exists

AI refresh context should consume the already resolved canonical weekday off-day set.

AI should not invent a new off-day pattern unless the runner explicitly asks to change it.

Import And Start-Date Semantics

Import should no longer mean:

- take imported dated workouts
- anchor day 1 to the chosen start
- replay all later days linearly regardless of weekday intent

Import should mean:

- validate the imported plan
- resolve canonical off-day weekdays
- ask for a chosen start date
- map the workout sequence onto the calendar while preserving those off-days

Canonical start-date rule when fixed off-days exist:

- the chosen start date must be an allowed training day in v1
- if the runner picks a blocked weekday, apply should stop and require a different start date

This keeps the contract small and understandable:

- the chosen day is the first active training day
- fixed off-days remain off

Canonical mapping rule for import/apply:

- imported non-rest workout order remains authoritative
- blocked weekdays are reserved as rest days
- non-rest workouts are placed onto the next allowed training weekdays in original sequence order
- explicit rest days may remain on blocked weekdays or on naturally inserted recovery gaps when the source plan already contains them

This means the plan may no longer preserve raw source calendar spacing exactly.

That is acceptable because:

- the runner’s stable off-day pattern is the stronger truth
- imported absolute dates are not the primary runner-facing contract

What We Preserve From The Original Plan

- workout sequence order
- workout type and session intent
- long-run intent and preferred long-run weekday when compatible
- progression shape as much as practical
- goal and target context

What we do not preserve as stronger than off-day invariants:

- naive day-by-day date offset from the source file
- source weekday placement when it conflicts with fixed runner off-days

Refresh And Apply Semantics

Refresh proposal generation must preserve weekday rest-day constraints by default.

That means:

- `RunnerCoachContext` should expose canonical blocked weekdays as part of the runner/planning context
- refresh proposal prompts should instruct the model to keep those weekdays off unless the runner explicitly asks to change them
- proposal review should treat preserved off-days as part of `What stays the same` whenever they are fixed truth

Approved refresh apply must also preserve those constraints.

Canonical rule for refresh apply:

- only the remaining active schedule is replaceable
- past and logged history stay fixed
- rebuilt future schedule must validate against canonical blocked weekdays before persistence

If the approved refresh proposal implies a remaining schedule that breaks fixed off-days:

- apply must fail validation
- current plan stays untouched
- the runner must review a regenerated proposal rather than receiving a silent compromise

Conflict Rules

If source plan sequence conflicts with desired off-days:

- desired off-days win over simple date shift
- preserve workout order where possible
- remap workouts onto allowed weekdays

If a refresh proposal conflicts with fixed off-days:

- the proposal is invalid for apply
- do not auto-relax off-days
- require proposal regeneration or explicit runner preference change in a later dedicated flow

If there is no clean mapping without materially changing spacing or workout order:

- do not silently force a distorted schedule
- block apply and return an honest message that the chosen weekday constraints and the source structure cannot be reconciled safely

V1 should prefer blocking over clever hidden schedule surgery.

Smallest UX Contract

Smallest good v1:

- do not introduce a full weekly schedule editor
- do not ask every runner about off-days at every step

Instead:

1. If Hito already has canonical blocked weekdays, reuse them silently and explain them in compact copy when relevant.
2. If Hito does not have canonical blocked weekdays, ask one explicit question during import/apply:
   - `Which weekdays should stay off?`
3. Persist that answer as canonical backend truth for later import and refresh reuse.

When to ask in v1:

- import/apply only when no canonical off-day truth exists

When not to ask in v1:

- not on every proposal review
- not as a separate settings product before this invariant exists

Chosen start-date UX rule in v1:

- if blocked weekdays exist, the date picker must only allow or must explicitly require a non-blocked chosen start date

Backend Responsibilities

- define one canonical weekday off-day resolution function
- read off-day truth from runner profile, active plan preferences, imported plan metadata, or explicit runner input in that order
- enforce that chosen start date is compatible with fixed off-days
- replace simple linear remap with invariant-aware schedule mapping when off-day truth exists
- validate refresh proposals and approved refresh apply against the same weekday constraints
- expose canonical blocked weekdays in `RunnerCoachContext`
- keep deterministic apply rejection when invariants cannot be preserved safely

Frontend Responsibilities

- show the off-day question only when backend indicates canonical rest-day truth is missing
- collect blocked weekdays and chosen start date
- show compact explanatory copy:
  - chosen start date is your first training day
  - these weekdays stay off
- do not invent local remap logic
- do not infer which conflicts are acceptable

QA Expectations

- importing a plan with canonical blocked weekdays must preserve those weekdays as rest days after apply
- choosing a new start date must not place workouts onto blocked weekdays
- choosing a blocked weekday as start must fail cleanly in v1
- refresh proposal generation must retain fixed weekday off-days in its proposal assumptions
- approved refresh apply must reject stale or off-day-breaking future schedules
- source plans with no canonical off-day truth must trigger the one explicit weekday-off question

Risks

- if off-day truth is allowed to live separately in runner settings, active plan metadata, and proposal context without one resolver, split truth will return immediately
- if the team tries to preserve both exact source spacing and fixed off-days in every case, the system will become overcomplicated
- if AI refresh is allowed to silently rewrite weekday availability, the coaching loop will feel untrustworthy

What We Leave For Later

- full weekly schedule editor
- explicit UI for changing recurring off-days after they are saved
- per-workout drag/drop repair
- advanced rescheduling heuristics that bend both spacing and weekday intent
- coach-chat negotiation around schedule preferences

Exit Criteria

- one canonical weekday off-day resolution rule exists in docs and backend design
- import/apply semantics clearly prioritize fixed off-days over raw date offset
- refresh proposal/apply semantics clearly preserve fixed off-days
- smallest missing-truth UX is defined without creating a schedule editor
- no parallel rest-day policy remains in import vs refresh

Next Recommended Role

BACKEND

Suggested Next Step

Define one backend-owned `resolveRestDayConstraints` plus invariant-aware apply/refresh validation contract, then hand frontend a minimal API for missing off-day capture and blocked-start-date rejection.

# Calendar Eligible Copy/Paste Beyond Manual Plans (Superseded)

## Work Item ID

2026-08-10-calendar-eligible-copy-paste

## Status

closed

## Type

change_request

## Priority

high

## Owner

backend

## Scope

active-plan-workout-editing / calendar copy-paste eligibility

## Archive Intent

retain_in_place

## Task

Let a runner copy an eligible planned workout from its Calendar overflow menu and paste it into an
eligible current or future Rest/no-workout calendar day. Eligibility, source reconstruction, and
persistence remain canonical Backend truth; Calendar renders only the resulting capabilities.

## Stage

Superseded before Implementation DoD. The in-progress checkpoint is retained but not accepted.

## Next Recommended Role

none; superseded by [Calendar Workouts Independent From Plans And Simple Copy/Paste](2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md).

## Supersession Receipt

On 2026-08-10, Product replaced this broad task with one unified product contract. The previous
task admitted every active-plan origin and a persisted `Rest` target, which grew it into a new RPC,
migration, and broad proof surface. That is not the accepted Copy/Paste model.

The interrupted Backend diff, local migration, disposable proof data, fixture state, and QA
artifacts remain preserved as an unaccepted checkpoint. They must not be extended or treated as
shipped behavior. The replacement task permits Paste only to an actually empty editable day and
does not allow replacing a persisted `Rest` row.

## User Report

The runner expects to use the Calendar overflow menu to copy a training session, then choose Paste
on an empty workout day.

## Evidence

- [Calendar.tsx](/Users/ivan/Developer/hito-running/src/components/Calendar.tsx:473) already holds
  a copied-workout buffer and passes it to the Rest/no-workout add menu.
- [ManualWorkoutSourceActionMenu.tsx](/Users/ivan/Developer/hito-running/src/components/manual-workout/ManualWorkoutSourceActionMenu.tsx:237)
  already renders `Copy workout`; [ManualWorkoutAuthoringControls.tsx](/Users/ivan/Developer/hito-running/src/components/manual-workout/ManualWorkoutAuthoringControls.tsx:600)
  already renders `Paste copied workout`.
- [active-plan editing policy](/Users/ivan/Developer/hito-running/src/lib/active-plan-workout-editing/policy.ts:91)
  deliberately limits content copy to `manual_user_built_plan_v1`; the historical product record
  explicitly retained universal Copy/Paste as a future boundary
  ([product-history-digest.md](/Users/ivan/Developer/hito-running/docs/history/product-history-digest.md:145)).

## Observed Behavior

Manual user-built plans can expose the existing Copy/Paste lifecycle. A planned workout whose active
plan does not satisfy the manual-only policy receives no copy capability, so the runner cannot
start the requested Calendar flow.

## Expected Behavior

For every active-plan/workout origin that the canonical server contract can safely admit, an
eligible planned workout exposes `Copy workout`; an eligible current or future Rest/no-workout day
then exposes `Paste copied workout`. One accepted paste is persisted through the existing
reviewed/canonical lifecycle and Calendar refreshes from saved truth.

Past dates, logged/skipped/evidence-backed workouts, Rest-only sources, unsafe metric truth,
foreign plans, occupied targets, and unsupported source forms remain honestly blocked by Backend
capability/reason rather than by a Frontend guess.

## Source Investigation

The visible absence is not a missing Calendar control. The Calendar already consumes
`sourceEditing.canDirectCopy` and an in-memory copied source. The first restrictive owner is the
Backend active-plan editing policy and its reconstruction/copy contract: copy eligibility is
manual-source-only, and the direct mutation returns manual source identity.

## Demonstrated Cause

`MANUAL_CONTENT_COPY_ACTIVE_PLAN_SOURCE_KINDS` contains only `manual_user_built_plan_v1`; therefore
`resolveActivePlanWorkoutEditability(..., "copy_workout")` denies the already-built Calendar flow
for other active-plan origins.

## What Not To Touch

- Calendar buffer/menu interaction except to consume an already-confirmed Backend capability.
- Workout history, logs, FIT/evidence, provider dispatch, timezone truth, plan generation, or
  unrelated manual authoring flows.
- Client-supplied workout rows, direct persistence bypasses, hosted systems, staging, commits,
  deployments, or paid providers.

## Validation Expectations

- A red replay for the requested non-manual eligible-origin copy path, followed by canonical
  capability/readback proof.
- Source and target eligibility proof for admitted and blocked cases, including source-plan/user
  isolation, logged/evidence/past/rest denial, occupied-target denial, and no client-row trust.
- Browser proof through the existing Calendar overflow → copied state → eligible target Paste path,
  plus Calendar refresh/readback after success.
- Independent bounded QA or Frontend Product review inside the Backend task where it materially
  verifies the consumer contract.

## Historical Superseded Prompt — Do Not Dispatch

```text
ROLE: BACKEND

Mode: Tracked

Task: Enable canonical Calendar Copy/Paste for every active-plan/workout origin that Backend can
safely admit, so a runner can copy an eligible planned workout from its Calendar overflow menu and
paste it into an eligible current or future Rest/no-workout day.

Stage: BACKEND implementation / eligibility and persisted copy contract

Canonical work item:
docs/tasks/backlog/2026-08-10-calendar-eligible-copy-paste.md

Demonstrated evidence:
- Calendar already has the copied-source buffer, overflow `Copy workout`, and target `Paste copied
  workout` consumer path.
- The first restrictive owner is Backend: `MANUAL_CONTENT_COPY_ACTIVE_PLAN_SOURCE_KINDS` limits
  copy eligibility to `manual_user_built_plan_v1`; the historical product record calls universal
  Copy/Paste a future boundary.

Required outcome:
- Backend is the sole authority for which active-plan origins and persisted workout forms are safe
  to copy. Every admitted source returns the canonical capability consumed by Calendar; every
  unsafe or protected source/target returns an honest existing-style denial.
- A successful paste is persisted through the canonical reviewed lifecycle and returns Calendar
  readback truth. The runner can use the existing overflow-to-target Calendar flow without a
  Frontend eligibility workaround.

Preserve:
- protections for past, logged, skipped, evidence-backed, Rest-only, foreign-plan, unsafe-metric,
  occupied, and unsupported source/target cases;
- existing plan ownership, RLS/auth, mutation provenance, review/exactness, Activity/FIT/provider
  boundaries, timezone truth, and the manual Copy/Paste flow;
- all unrelated dirty work and the active Frontend DevTools task.

Do not:
- accept client-sent workout rows, add a parallel persistence path, weaken a blocker merely to show
  a menu item, change Calendar styling/interaction, alter providers/hosted systems, stage, commit,
  push, deploy, or call paid providers.

Definition of Done:
The requested Calendar flow is server-authorized for each safely supported origin, persists exactly
once through canonical truth, and remains unavailable with a bounded reason for every protected or
unsupported case. Update the work item lifecycle and provide an integrated root-cause replay,
contract/readback, focused Calendar consumer, and independent-review receipt. Global QA Acceptance
is not claimed.

Stop condition:
Stop only for a demonstrated product-policy or cross-owner contract decision that changes which
origins are admissible. Do not stop for routine local implementation, fixture, browser, or review
work; use bounded subagents when independent consumer or QA evidence materially reduces risk.

Approval policy:
Routine local source work, loopback fixtures, local browser/runtime proof, lifecycle updates, and
safe bounded subagents are authorized. Do not access hosted/production systems or take publishing
or irreversible actions.
```

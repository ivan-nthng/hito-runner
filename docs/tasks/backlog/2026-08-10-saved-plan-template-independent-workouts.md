# Saved Plan Template And Independent Workouts (Superseded)

## Work Item ID

2026-08-10-saved-plan-template-independent-workouts

## Status

closed

## Type

product-contract-refactor

## Priority

high

## Owner

backend

## Scope

saved-plan-template-independent-workouts

## Archive Intent

retain_in_place

## Task

Make a saved plan an immutable user-facing record that is used to create a set of future workouts
once. Once materialized, every calendar workout must be an independent persisted workout with the
same lifecycle and editability as a manually created workout. A plan must not remain a governing
`current` entity, nor own, move, relink, modify, or delete its materialized workouts.

## Stage

Superseded before dispatch by one smaller combined task.

## Product Decision

- A plan explains and records how the runner created a set of workouts. It is not a live programme
  that subsequently controls the calendar.
- The saved-plan library retains records of created, earlier, and user-removed plans. A library
  removal is archival/hiding of the plan record; it never removes calendar workouts.
- Materialized workouts may be moved, copied, edited, skipped, or explicitly deleted just like
  manually created workouts. Their origin may be retained as provenance only; it must never be a
  lifecycle or mutability authority.
- Applying another saved plan is a separate explicit future-schedule action. It may replace only
  the runner-approved future schedule. It must never alter past workouts or logs, FIT assets,
  parsed evidence, comparisons, feedback, or other completed-workout truth. Removing a past or
  FIT-backed workout remains possible only through the runner's explicit `Delete training` action.
- There is no product concept of a governing current plan after creation. A temporary read-only
  projection for existing consumers is acceptable only if it cannot drive workout ownership,
  mutation permissions, replacement, or history handling.

## Source Investigation

- [`plan_cycles`](../../../src/lib/active-plan-persistence.ts:41) is the existing persisted saved-plan
  record, while [`planned_workouts`](../../../src/lib/active-plan-persistence.ts:42) currently
  references it as an owner.
- The current replacement seam builds an `active` plan and uses
  [`historyDisposition`](../../../src/lib/active-plan-persistence.ts:297) with a `carry_forward`
  path. Its persistence payload includes logs and evidence relinks
  ([`active-plan-persistence.ts`](../../../src/lib/active-plan-persistence.ts:312),
  [`active-plan-persistence.ts`](../../../src/lib/active-plan-persistence.ts:366)). That is the
  existing model that contradicts this product decision.
- Calendar already has backend-owned editing and copy/paste seams. They must continue to operate on
  the independent persisted workout, not on a still-active plan container.

## Required Outcome

The Backend canonical contract treats a saved plan as immutable library/provenance data and treats
materialized workouts as independent calendar truth. Existing or new plan application may create a
future schedule, but no plan transition may mutate, delete, carry forward, or relink protected
historical workout truth.

## What Not To Touch

- Do not create a second plan store, a parallel scheduler, a new state-management layer, or a
  compatibility framework when the existing persistence model can be simplified in place.
- Do not change Calendar, Progress, Settings, workout-detail presentation, Design System, or build
  the Plans-library/download/apply UI in this item.
- Do not weaken auth/RLS, timezone truth, explicit Delete-training protections, FIT/evidence,
  Activity, provider, or AI boundaries.
- Do not access hosted or production data, stage, commit, push, deploy, call paid providers, or
  modify unrelated concurrent work.

## Definition Of Done

- Creating a plan produces a durable saved-plan record and independently durable future workout
  rows; subsequent row-level calendar operations have the same canonical authority as manual
  workout operations.
- No plan status, replacement, archive, or library removal can cascade into materialized workouts
  or rewrite/relink their logs, FIT assets, evidence, comparisons, feedback, or completion truth.
- The existing replacement/apply seam has an explicit future-only decision and preserves every
  protected historical fact. A saved-plan origin may be readable as provenance but cannot govern
  the workout lifecycle.
- Existing server consumers keep receiving honest backend-shaped read truth without a new parallel
  model. Any required later Frontend adaptation is reported as a bounded follow-up, not silently
  implemented here.

## Validation Expectations

- Establish a deterministic before/after persistence discriminator for the present owner-coupling
  and carry-forward/evidence-relink behavior.
- Verify creation, independent manual-style move/copy/edit/delete behavior, plan archival, and a
  future-plan replacement through authenticated local persistence/readback and RLS boundaries.
- Prove that past, logged, skipped, FIT/evidence-backed, comparison-backed, feedback-backed, and
  otherwise protected workouts remain byte-for-byte and relationally unchanged when a later plan is
  applied or removed.
- Run targeted local Backend, migration, and runtime checks that cover changed contracts; use one
  independent read-only persistence/architecture subagent and one independent QA subagent where
  they materially accelerate the proof. Do not claim Global QA Acceptance or hosted/release parity.

## Next Recommended Role

none; superseded by [Calendar Workouts Independent From Plans And Simple Copy/Paste](2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste.md).

## Supersession Receipt

On 2026-08-10, Product combined this record with the stopped Copy/Paste work. The replacement
retains the same plan-to-workout independence decision but limits execution to existing Backend
seams and simple Calendar copy/paste. It does not authorize a new plan subsystem, scheduler,
library UI, RPC, or migration merely to achieve the requested behavior.

## Historical Superseded Prompt — Do Not Dispatch

```text
ROLE: BACKEND

Mode: Tracked

Task: Make a saved plan an immutable record that creates independent calendar workouts once.

Stage: Backend product-contract refactor

Canonical work item:
docs/tasks/backlog/2026-08-10-saved-plan-template-independent-workouts.md

Product contract:
- A plan only explains and retains how a runner created future workouts. After creation, each
  workout is equivalent to one created manually: independently movable, copyable, editable,
  skippable, and explicitly deletable.
- There is no governing current plan. A plan may remain only as immutable library/provenance data;
  it must not own a workout or decide that workout's lifecycle or editability.
- Plan archive/removal never deletes workouts. Applying another plan is an explicit future-only
  schedule action and must never alter past workouts, logs, FIT assets, evidence, comparisons,
  feedback, or completion truth. An old/FIT-backed workout changes only through explicit Delete
  training.

Evidence before code:
- plan_cycles currently owns planned_workouts, and active-plan replacement can carry forward or
  relink historical data. Establish a local persistence discriminator for that coupling first.

Required outcome:
Simplify the canonical Backend model in place so plans are immutable saved records and materialized
workouts are independent calendar truth. Reuse existing persistence, auth, reviewed mutation, and
calendar readback seams. Do not add a second plan store, scheduler, or compatibility framework.

Scope and non-goals:
- Backend persistence/lifecycle/read-write contracts, validators, fixture proof, and the work-item
  lifecycle only. Do not build the library/download/apply UI or change product presentation.
- Preserve auth/RLS, runner-local timezone, independent Calendar operations, explicit Delete
  training, Activity/FIT/evidence/comparison boundaries, and unrelated dirty work.

Definition of Done:
- Plan creation materializes independently durable future workouts.
- No plan status or transition cascades into workouts or rewrites/relinks historical truth.
- Later application preserves protected history; origin is provenance only, never authority.
- Existing consumers receive honest canonical readback without parallel truth.

Required proof:
Use one bounded read-only persistence subagent to map old ownership and one bounded QA subagent for
the final local review. Integrate both. Run the discriminator, authenticated local
persistence/RLS/readback checks, relevant migration checks, and targeted Backend/runtime checks.
Update this item before implementation and at closeout. Do not claim Global QA Acceptance.

Stop condition:
Stop only for a demonstrated product-policy conflict or required Frontend/Design System contract
change that cannot be represented as truthful existing read data.

Approval policy:
Routine local source work, loopback fixtures, disposable local data/cleanup, validation, and safe
bounded subagents are authorized. Do not access hosted/production systems, stage, commit, push,
deploy, call paid providers, or perform material deletion.
```

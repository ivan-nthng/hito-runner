# Plan Preset Active-Plan Replacement And Refresh

## Status

in_progress

## Type

change_request

## Priority

medium

## Next Recommended Role

qa

## Task

Implement the reviewed active-plan transition seam for starting a generated or preset plan from an
existing active manual plan.

## Stage

QA validation / reviewed active-plan transition lifecycle

## Exact Handoff Prompt

```text
ROLE: QA

Task:
Validate the reviewed active-plan transition seam for starting a generated or preset plan from an
existing active manual plan.

Stage:
QA validation / reviewed active-plan transition lifecycle.

Context:
Backend implemented a new reviewed transition seam for `manual_user_built_plan_v1` active plan ->
selected generated/preset plan. It is non-mutating at review time, requires explicit confirm, signs
stable transition payload, revalidates the selected-plan candidate and active-plan revision
server-side, archives/supersedes the old manual active plan, creates the reviewed selected plan as
the new active plan, and does not merge upcoming manual workouts into the generated/preset plan.

Required reading:
- AGENTS.md
- agents/qa.agent.md
- skills/hito-backend-supabase-contract/SKILL.md
- skills/hito-qa-browser-regression/SKILL.md
- docs/tasks/frontend-specs/2026-06-20-active-plan-lifecycle-ia-and-actions-spec.md
- docs/tasks/backlog/2026-06-07-plan-preset-active-plan-replacement-refresh.md
- docs/plans/active/2026-06-09-manual-workout-authoring-and-user-built-plans.md
- docs/current-product.md
- docs/current-system.md
- src/lib/active-plan-transition-actions.ts
- src/lib/running-plan-engine-actions.ts
- src/lib/active-plan-persistence.ts
- scripts/validate-running-plan-engine-confirm.ts

Scope:
1. Run source/CLI validation for the new transition owner and persistence helper.
2. Prove review is non-mutating and returns current plan, candidate plan, affected upcoming manual
   workouts, preserved-history statement, manual-template preservation statement, metric honesty,
   and token/checksum.
3. Prove confirm rejects stale active-plan revision, stale candidate input, invalid transition token,
   non-manual active plans, and missing active plan.
4. Prove confirm uses server-rebuilt selected-plan truth and does not trust client rows.
5. Prove confirm archives/supersedes the old manual active plan, creates the selected generated plan
   as active, preserves protected history/templates, and does not merge upcoming manual workouts.
6. Prove selected-plan no-active-plan confirm still blocks existing active plans through the existing
   `active_plan_exists` path.

What not to touch:
- Do not implement frontend UI.
- Do not silently replace active plans.
- Do not delete protected workout history, logs, provider evidence, or comparison-backed truth.
- Do not weaken fake pace, fake personal HR, race-pace, target-time, or metric-truth guardrails.
- Do not change manual Add/Move/Copy/Delete/Clear/Edit semantics.
- Do not merge this with JSON import, Clear upcoming schedule, Delete plan, active-plan refresh, QR
  share/import, recurrence, Restore UI, Admin, Hito DS, Supabase migrations, or OpenAI live calls.

Validation:
- Source proof for the new review/confirm owner and reused lifecycle/persistence seams.
- `node --import tsx ./scripts/validate-running-plan-engine-confirm.ts`.
- `node --import tsx ./scripts/validate-manual-workout-authoring.ts`.
- `npm run build`.
- Scoped `git diff --check`.

Stop conditions:
- Stop if persistence proof indicates the old manual plan is deleted instead of archived.
- Stop if upcoming manual workouts merge into the generated/preset active plan.
- Stop if token/checksum exactness or active-plan revision exactness can be bypassed.
```

## Context

Plan Presets and selected/generated plans are reusable when a runner has no active plan. They never
silently replace an existing active plan. Starting a generated or preset plan from an active manual
plan is now accepted as a separate reviewed active-plan transition risk class.

## Architecture Decision — 2026-06-20

Accepted model:

- Use a new backend-owned reviewed active-plan transition seam.
- Treat the path as `active manual plan -> reviewed generated/preset candidate -> explicit confirm
  -> old active plan superseded/archived -> new generated/preset active plan`.
- Do not model this as active-plan refresh. Refresh modifies the remaining schedule of the current
  active plan; this path changes plan provenance/source/family.
- Do not model this as raw `Clear upcoming schedule` followed by normal first-plan creation. That
  would expose two separate mutations and a no-plan gap instead of one reviewed transition.
- Do not model this as silent replacement or frontend-owned restart.

Canonical mutation owner:

- Backend owns review generation, protected-history classification, token/checksum exactness,
  persistence, lifecycle audit metadata, stale-state rejection, and final confirm.
- Frontend owns only interaction and rendering of backend-shaped review/confirm state.

Protected-history and preservation rules:

- Logged workouts, provider evidence, comparison-backed results, completed/partial/skipped truth,
  and any protected historical records are never deleted or rewritten by this transition.
- Past history remains attached to the runner and historical/superseded plan truth.
- The previous manual active plan is preserved as superseded/archived history.
- Upcoming manual workouts do not merge into the generated/preset plan by default. They stop being
  active as part of the old plan snapshot/history unless a later explicit merge feature is designed.
- Manual saved templates remain user-owned library truth and carry forward unchanged.
- Manual workout source metadata does not carry into generated/preset plan rows except bounded audit
  metadata identifying the superseded active plan.
- If confirm sees a stale active-plan revision, stale token/checksum, or changed protected-history
  state, it must reject and require a fresh review.

Review/confirm contract:

- Review is non-mutating.
- Review must show the current active manual plan, candidate generated/preset plan summary, date
  range affected, upcoming workout count affected, preserved-history statement, manual-template
  preservation statement, metric honesty summary, and clear confirm/keep-current actions.
- Confirm must revalidate server-side from reviewed truth, not client rows.
- Success copy should communicate that the reviewed plan was applied and the previous plan was kept
  as history.

Relationship to adjacent lifecycle actions:

- `Delete plan` remains separate: it archives the active plan and returns the runner to no-plan
  state.
- `Clear upcoming schedule` remains separate: it removes the active upcoming schedule while
  preserving history and returns to no-plan state.
- `Import JSON` remains the advanced import/replacement path with its own selected start-day and
  import validation semantics. It may reuse lower-level lifecycle helpers later, but this slice
  should not merge the user flows.
- Active-plan refresh remains separate and is only for updating the current active plan's remaining
  schedule.

## Acceptance

- Architecture decision is complete.
- Backend implementation is complete and QA is selected as the next owner.
- Protected history, logs, evidence, manual templates, and active-plan lifecycle are explicitly
  handled.
- Frontend does not invent replacement rules.
- Any approved implementation reuses canonical lifecycle/persistence seams before adding new ones.

## Backend Implementation Result — 2026-06-20

- Added `src/lib/active-plan-transition-actions.ts` as the focused reviewed transition owner.
- Reused selected running-plan preview/review exactness for candidate truth.
- Added `transitionActiveManualPlanToReviewedCanonicalPlanForUser(...)` in
  `src/lib/active-plan-persistence.ts` so the old manual active plan is archived/superseded and the
  new reviewed selected plan is activated without deleting the previous plan row.
- Preserved the existing no-active-plan selected-plan confirm path: `confirmRunningPlanDraftForUser`
  still returns `active_plan_exists` when any active plan exists.
- Extended `scripts/validate-running-plan-engine-confirm.ts` with deterministic transition proof for
  non-mutating review, explicit confirm, stale revision/input rejection, invalid transition token,
  non-manual/no-active-plan rejection, no client row trust, no upcoming manual workout merge, and no
  fake pace/personal HR.

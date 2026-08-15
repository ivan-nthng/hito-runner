# Calendar Overflow Actions For Future Workouts And Plans

- **Work Item ID:** `2026-08-11-calendar-overflow-future-workout-actions`
- **Status:** `completed`
- **Type:** `product_workflow`
- **Priority:** `high`
- **Owner:** `BACKEND`; Frontend lane `Product`
- **Scope:** `Calendar overflow export, upload, Start-new-plan, and future-workout deletion`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Keep the Calendar header controls in their existing order and add one far-right ghost ellipsis
menu with four factual actions: download current future Calendar JSON, upload a valid Hito plan as
an immutable saved record, Start a new plan after clearing eligible future workouts, and delete
eligible future workouts after explicit destructive confirmation.

## Demonstrated Cause And Result

The missing backend owner was an atomic pure future clear. The reviewed-future schedule function
always materialized a plan, while the existing Calendar mutation owned one row; neither could
express a bulk clear without bypassing protected-record transaction safety.

[Migration `20260811125538_clear_calendar_future_workouts.sql`](../../../supabase/migrations/20260811125538_clear_calendar_future_workouts.sql)
adds one service-role-only, runner-local atomic clear and updates the existing reviewed-plan
persistence signature to carry `currentDate`. The operation refuses protected future evidence
before mutation and preserves past, FIT, log, metric, comparison, feedback, and insight truth.

The Calendar keeps Month, Week, Previous, Today, and Next in place and adds the one approved menu.
Download exports actual eligible future Calendar truth through the canonical `training-plan-v2`
document owner, distinct from selected saved-plan export. Upload reuses the existing parser and
retains one immutable saved-plan record without touching Calendar. Start and Delete share the
atomic clear; both require explicit confirmation, Cancel is a no-op, and Start opens the existing
`?createPlan=true` experience. No active/current plan authority, second parser, plan store,
provider path, or compatibility layer was introduced.

## Task-Owned Sources

- [Backend action owner](../../../src/lib/calendar-overflow-actions.ts)
- [Calendar header](../../../src/components/Calendar.tsx)
- [Route-local menu consumer](../../../src/components/calendar/CalendarOverflowActions.tsx)
- [Private export route](../../../src/routes/api.plan.export.tsx)
- [Persistence owner](../../../src/lib/active-plan-persistence.ts)
- [Focused validator](../../../scripts/validate-calendar-overflow-future-actions.ts)
- [Atomic clear migration](../../../supabase/migrations/20260811125538_clear_calendar_future_workouts.sql)

## Validation

| Check                        | Result | Durable fact                                                                                                                                                                           |
| ---------------------------- | ------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Upload and retention         | Passed | Invalid JSON created nothing; valid `training-plan-v2` created one archived record and left the 55-row Calendar unchanged                                                              |
| Download                     | Passed | Private browser download contained 54 future rows for 2026-08-11 through 2026-10-03 and no raw FIT/storage markers                                                                     |
| Clear safety                 | Passed | Delete cleared 54 eligible future rows; protected past identity/hash remained unchanged; protected future evidence caused a pre-mutation refusal                                       |
| Auth/concurrency             | Passed | Runner isolation held; advisory-locked concurrent clear converged once to zero                                                                                                         |
| Plan/manual entry            | Passed | Generated and Build-myself entry worked with protected past history and no active-plan authority                                                                                       |
| Browser                      | Passed | Chrome desktop 1470×801 and exact 375×812 System/Light/Dark covered menu order, upload, download, both confirmations, Cancel no-op, focus return, containment, and zero console errors |
| Focused Backend/static/build | Passed | Task validator, all 15 Backend source checks, affected regressions, format/lint/diff, and the original production build/integrity check passed                                         |
| Fixture restoration          | Passed | Existing saved-plan Start restored exactly 54 Admin future rows without a provider call                                                                                                |

The independent QA reviewer found no Product defect and covered the source and most browser
inventory, but its Chrome bridge could not attach a file and its Admin fixture lacked protected
past evidence. The owner subsequently executed those two exact gaps through the in-app browser and
the FIT fixture; this remains implementation evidence, not independent Global QA.

## Coverage Gap And Residual Boundary

The repository-wide local DB run passed checks 1–14, then stopped on pre-existing
running-plan-confirm fixture drift `55 !== 56`; checks 16–20 did not run in that invocation. The
task-specific database replay and all 15 source checks passed. Later unrelated repository writes
made the managed artifact receipt stale after the fresh build and browser matrix had completed, so
no claim is made that the later shared checkout stayed frozen.

Hosted Supabase, paid providers, production data, deployment, release actions, and Global QA
Acceptance were not run or claimed. Global QA remains pending and QA-owned.

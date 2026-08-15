# Calendar Workouts Independent From Plans And Simple Copy/Paste

- **Work Item ID:** `2026-08-10-calendar-workouts-independent-from-plans-and-simple-copy-paste`
- **Status:** `completed`
- **Type:** `product-contract-correction`
- **Priority:** `high`
- **Owner:** `FRONTEND`; Backend and Frontend Product owned their respective implementation slices
- **Scope:** `calendar-workout-independence-and-simple-copy-paste`
- **Archive Intent:** `retain_in_place`

## Original Outcome

Make a confirmed plan a one-time creator of Calendar workouts rather than their continuing owner.
Allow every persisted non-Rest workout to copy its prescription into a truly empty editable day,
without copying result evidence or treating a persisted Rest row as empty.

## Result

Materialized workouts are runner-owned Calendar truth. `plan_cycles` remains immutable creation
provenance only: its status cannot govern Calendar reads or row actions, and later plan
materialization cannot clone, relink, rewrite, or hide earlier workout/history identities.

The existing atomic workout mutation was reconciled runner-wide. Copy accepts any persisted
non-Rest source and reconstructs only prescription fields. It never copies logs, FIT assets,
metrics, comparisons, feedback, AI insight, or completion truth. Paste is exactly-once into an
unoccupied runner/date and refuses past, Rest, occupied, or otherwise protected targets unchanged.

Frontend now distinguishes absence from a persisted Rest row before exposing Paste. It no longer
uses active-plan identity as a Paste condition. Existing Copy, Move, Clear, manual-add, Calendar
invalidation, and materialized workout navigation remain in their canonical owners.

## Task-Owned Sources

- [Calendar read model](../../../src/components/Calendar.tsx)
- [Manual workout authoring controls](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx)
- [Runner Calendar read contract](../../../src/lib/training-api.ts)
- [Canonical persistence owner](../../../src/lib/active-plan-persistence.ts)
- [Reconciled mutation migration](../../../supabase/migrations/20260810034530_canonical_active_plan_workout_copy.sql)

No table, second RPC, store, scheduler, runtime file, compatibility path, or proof framework was
added. The interrupted dedicated Copy RPC and Rest-replacement proof path were removed rather than
retained beside the canonical mutation.

## Validation

| Check                      | Result | Durable fact                                                                                                                                                                 |
| -------------------------- | ------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Migration and live schema  | Passed | Fresh replay through `20260810034530`; only the canonical mutation/content-edit functions remained, service-role-only                                                        |
| Backend persistence        | Passed | All 19 local Backend DB checks; auth/RLS, archived provenance, universal non-Rest Copy, exactly-once target protection, immutable plan provenance, and zero evidence copying |
| Existing regressions       | Passed | Manual authoring persistence, runner activity readback, canonical fixture convergence at 55 workouts / 30 activities / 11 matched / 19 unplanned                             |
| Frontend browser           | Passed | Copy from non-Rest, Paste into an empty date, post-refresh persistence/navigation, and Paste absence on a persisted Rest row                                                 |
| Focused static/build       | Passed | Targeted format/lint/diff checks and the original fresh production build                                                                                                     |
| Independent Backend review | Passed | Confirmed runner-owned truth, no dedicated Copy RPC, immutable provenance, and untouched evidence                                                                            |

## Coverage Gap And Residual Boundary

The Backend receipt did not run browser proof; the later Frontend slice closed that exact
empty-versus-Rest consumer gap. The Frontend receipt did not run a separate mobile replay because
the eligibility seam has no viewport branch. Hosted Supabase, provider, deployment, staging,
commit, push, release verification, and Global QA Acceptance were not run or claimed. Global QA
remains a separate QA-owned gate.

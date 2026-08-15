# Calendar Overflow Actions For Future Workouts And Plans

- **Status:** `completed`
- **Owner:** BACKEND; FRONTEND (Product lane)
- **Outcome:** Added one Calendar overflow menu for current-future export, immutable plan upload, Start-new-plan, and explicit future-workout deletion; Start/Delete reuse one service-role-only atomic clear that refuses protected evidence and preserves historical/FIT truth.
- **Sources:** [20260811125538_clear_calendar_future_workouts.sql](../../../supabase/migrations/20260811125538_clear_calendar_future_workouts.sql); [validate-calendar-overflow-future-actions.ts](../../../scripts/validate-calendar-overflow-future-actions.ts); [active-plan-persistence.ts](../../../src/lib/active-plan-persistence.ts)
- **Validation:** Browser, Focused Backend/static/build, Fixture restoration passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** Global QA remains pending and QA-owned.

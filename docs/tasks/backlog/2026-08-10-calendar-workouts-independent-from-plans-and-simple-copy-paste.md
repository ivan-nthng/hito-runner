# Calendar Workouts Independent From Plans And Simple Copy/Paste

- **Status:** `completed`
- **Owner:** FRONTEND; BACKEND and FRONTEND (Product lane) owned their respective implementation slices
- **Outcome:** Made materialized workouts runner-owned Calendar truth and reconciled exactly-once prescription-only Copy/Paste through the existing atomic mutation; plan-cycle provenance remains immutable and a persisted Rest row remains occupied.
- **Sources:** [20260810034530_canonical_active_plan_workout_copy.sql](../../../supabase/migrations/20260810034530_canonical_active_plan_workout_copy.sql); [active-plan-persistence.ts](../../../src/lib/active-plan-persistence.ts); [training-api.ts](../../../src/lib/training-api.ts)
- **Validation:** Frontend browser, Focused static/build, Independent Backend review passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** No work or acceptance beyond the recorded terminal scope is claimed; any successor remains separately owned.

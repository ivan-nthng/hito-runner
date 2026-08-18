# Workout Semantic Content Product Consumer Migration

- **Status:** `completed`
- **Owner:** FRONTEND
- **Epic:** runner-core-readiness
- **Outcome:** workoutTypeMeta now exposes the accepted shared content slot while retaining color as the unchanged shared base identity value. Today and workout detail render their workout labels through content; their adjacent identity dots remain on base. The…
- **Sources:** [ManualWorkoutAuthoringControls.tsx](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx); [manual-workout-authoring-utils.ts](../../../src/components/manual-workout/manual-workout-authoring-utils.ts); [calendar-projection.ts](../../../src/components/calendar/calendar-projection.ts)
- **Validation:** Design System validator, Diff hygiene, Production build passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** No work or acceptance beyond the recorded terminal scope is claimed; any successor remains separately owned.

# Bug 04: Non-Rest Template Selection Closes Without Opening Constructor

- **Status:** `closed`
- **Owner:** PRODUCT
- **Epic:** runner-core-readiness
- **Outcome:** Closed. QA proved that non-rest template selection now opens the constructor directly and no longer fails through a submenu-close no-op. Reopen only if a fresh browser regression shows that selecting non-rest templates stops opening the constructor again.
- **Sources:** [manual-workout-authoring-utils.ts](../../../src/components/manual-workout/manual-workout-authoring-utils.ts); [ManualWorkoutConstructorEditor.tsx](../../../src/components/manual-workout/ManualWorkoutConstructorEditor.tsx); [ManualWorkoutAuthoringControls.tsx](../../../src/components/manual-workout/ManualWorkoutAuthoringControls.tsx)
- **Validation:** Closure is supported by the recorded decision/evidence; no implementation, runtime, or release acceptance is inferred.
- **Residual boundary:** No work or acceptance beyond the recorded terminal scope is claimed; any successor remains separately owned.

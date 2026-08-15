# Optional Weekly Running Capacity And Fixed Rest Days

- **Status:** `completed`
- **Owner:** FRONTEND
- **Outcome:** Onboarding and Settings independently preserve all four combinations of weekly ceiling and fixed rest days, including clearing either preference back to absence. Preview and saved-plan readback distinguish runner preferences from plan-author decisions…
- **Sources:** [settings.tsx](../../../src/routes/settings.tsx); [TrainingPreferenceFields.tsx](../../../src/components/onboarding/TrainingPreferenceFields.tsx); [structured-plan-authoring-schema.ts](../../../src/lib/structured-plan-authoring-schema.ts)
- **Validation:** The original terminal receipt records focused validation for the completed scope; detailed commands remain available in Git history.
- **Residual boundary:** Preserve the accepted nullable backend schema, provider/compiler/review/confirm contract, and profile revision behavior. Preserve fixed-rest safety and over-ceiling rejection when a runner did provide those…

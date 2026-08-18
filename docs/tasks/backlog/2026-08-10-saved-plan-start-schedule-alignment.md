# Saved Plan Start With Schedule Alignment

- **Status:** `completed`
- **Owner:** BACKEND
- **Epic:** adaptive-blueprint-planning
- **Outcome:** Let an authenticated runner Start an immutable saved-plan record using runner-local date and schedule preferences, with explicit future replacement and deterministic weekday alignment. The projection must preserve source workouts, avoid providers, and never…
- **Sources:** [active-plan-export-actions.ts](../../../src/lib/active-plan-export-actions.ts); [active-plan-persistence.ts](../../../src/lib/active-plan-persistence.ts); [weekday-rest-invariants.ts](../../../src/lib/weekday-rest-invariants.ts)
- **Validation:** The original terminal receipt records focused validation for the completed scope; detailed commands remain available in Git history.
- **Residual boundary:** Global QA acceptance; Global QA remains pending.

# Retire Active-Plan Calendar Authority

- **Status:** `completed`
- **Owner:** BACKEND
- **Epic:** runner-core-readiness
- **Outcome:** The Backend slice removed the legacy runtime authority rather than preserving it through a wrapper. Runner Calendar reads and reviewed mutations now use runner-wide workout truth plus immutable plan_cycle_id provenance. Saved-plan Start remains runner-local…
- **Sources:** [training-api.ts](../../../src/lib/training-api.ts); [source-capabilities.ts](../../../src/lib/active-plan-workout-editing/source-capabilities.ts); [active-plan-persistence.ts](../../../src/lib/active-plan-persistence.ts)
- **Validation:** Static checks, Production build, Build integrity passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** Global QA Acceptance was not run or claimed and remains Pending.

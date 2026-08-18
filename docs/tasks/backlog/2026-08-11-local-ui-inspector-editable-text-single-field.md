# Local UI Inspector Editable Text Single Field

- **Status:** `completed`
- **Owner:** FRONTEND
- **Epic:** platform-and-operations
- **Outcome:** Replaced the duplicate read-only Current and editable Proposed controls with one controlled Textarea prefilled from the captured target text. Reused the existing typography icon, HitoButton ghost/icon-only composition, close icon, one draft.proposedText…
- **Sources:** [local-ui-inspector-batch-prompt.ts](../../../src/components/devtools/local-ui-inspector-batch-prompt.ts); [local-inline-change-target-utils.ts](../../../src/components/devtools/local-inline-change-target-utils.ts); [local-ui-task-draft-view-model.ts](../../../src/components/devtools/local-ui-task-draft-view-model.ts)
- **Validation:** No live mutation, Static/build, Fixture lifecycle passed as recorded in the terminal receipt; omitted layers remain outside this closeout.
- **Residual boundary:** it does not claim Global QA Acceptance, hosted verification, release readiness, or deployment.

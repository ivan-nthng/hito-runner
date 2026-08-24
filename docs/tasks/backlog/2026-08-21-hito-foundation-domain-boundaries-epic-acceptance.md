# Hito Foundation Domain Boundaries Epic Acceptance

Work Item ID: `2026-08-21-hito-foundation-domain-boundaries-epic-acceptance`
Notion Task: [HITO-241](https://app.notion.com/p/Accept-Foundation-Domain-Boundaries-3c4fe5f58cf5810785c6d462a7533880)
Type: Maintenance
Parent: [Hito Modular Monolith Domain-Boundary Transformation Implementation](./2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md)
Depends On: [Hito Current-System Modular Boundary Reconciliation](./2026-08-21-hito-current-system-modular-boundary-reconciliation.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md#acceptance-and-rollback)

## Scope

Independently accept the completed Foundation domain-boundary programme in the local disposable
environment. This is a focused Epic acceptance, not Global QA, release, hosted parity or deployment
readiness.

## Archive Intent

Retain the cross-domain acceptance evidence and remaining coverage limits as technical input for
HITO-218. Operational lifecycle, delivery steps, handoffs and history live only in the linked
Notion task.

## Task

Verify the accepted public boundaries together without replaying unrelated product areas:

- Calendar owns the runner-confirmed workout; source remains immutable provenance only.
- Result/Evidence produces provider-neutral factual evidence and feedback state without a Calendar
  or Progress private import.
- Progress consumes only its factual Product contract, not provider-private read models.
- Identity owns actor classification; Admin and Runner consume the explicit result.
- Feedback-marker labels belong to the Frontend presentation mapper, while factual marker state
  remains Result/Evidence-owned.

Use the existing focused validators and one disposable local cross-boundary fixture/readback journey
only where it proves the integration above. Reuse accepted domain proof rather than rerunning
unrelated authoring, marketing, commercial, Admin visual or release suites.

## What Not To Touch

Do not implement fixes, change production source, schema/RLS/RPC, migrations, fixtures, provider
logic, hosted state, credentials, Git lifecycle or deployment. QA may use only the canonical local
`qa_fixture`, task-owned disposable data and project-qualified runtime lifecycle. A reproduced
defect returns to its implementation owner in the same task; QA never patches it.

## Proof

Prove the five boundary assertions, reverse-import/removal conditions, relevant focused validators,
task-owned fixture isolation/reload/cleanup and one risk-derived browser or route readback only if
the fresh managed artifact supports it. State all omitted checks and their coverage consequence.
Stop before a stale/missing artifact, environment identity conflict, provider/hosted requirement or
unrelated baseline diagnostic; do not weaken the accepted contracts.

# Hito Modular Monolith Domain-Boundary Transformation

## Authority And Result

This is the terminal technical plan for [HITO-218](../../tasks/backlog/2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation.md).
Live status, phase, owner, delivery steps and handoffs exist only in Notion. The implementation
programme reached its finite Foundation outcome after independent
[HITO-241 acceptance](../../tasks/backlog/2026-08-21-hito-foundation-domain-boundaries-epic-acceptance.md).

Hito remains one modular monolith: one TanStack/Supabase/Vercel deployable, one database and no
microservices, compatibility facades, duplicate product models or replacement plan container.

## Final Domain Direction

| Domain                      | Public responsibility                                                                                          | Private boundary and permitted direction                                                                                                                      |
| --------------------------- | -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Identity/profile            | Authenticated subject, actor classification and runner preferences                                             | Provider/admin clients and classification mechanics remain private; Runner and Admin consume the explicit result.                                             |
| Source authoring/provenance | Reviewed `WorkoutDocument`, immutable source history and materialisation request                               | AI/file/template/manual origins supply initial content only and call one Calendar materialisation command after confirmation.                                 |
| Runner Calendar             | Confirmed workout identity, snapshot, Add/Edit/Move/Copy/Clear/Undo and protection context                     | Current row/RLS/RPC names remain private implementation facts; Calendar may read source provenance and Result/Evidence protection but never plan authority.   |
| Result/Evidence             | Provider-neutral action results, completion/evidence markers, comparisons, availability and persisted insights | Upload, parser, storage, provider and observability mechanics remain private; Calendar consumes protection/completion and Progress consumes factual evidence. |
| Progress                    | Factual Product history, missingness and visualization inputs                                                  | Read models, fact selection, formulas, FIT joins and scale mechanics remain Backend-private.                                                                  |
| Presentation                | Route composition, domain DTO rendering and accessible labels                                                  | Frontend consumes public contracts and does not reconstruct persistence, evidence or identity policy.                                                         |
| Platform/QA/release         | Focused owner proof, independent acceptance and exact candidate evidence                                       | These layers consume terminal contracts; they do not repair another domain during a release freeze.                                                           |

## Completed Programme

| Phase                               | Final result and evidence                                                                                                                                                                                                                                                                                                                                                             |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1 — Workout sidebar                 | [Semantic sidebar contract isolated](../../tasks/backlog/2026-08-18-hito-workout-detail-sidebar-contract-isolation.md).                                                                                                                                                                                                                                                               |
| 2A-0 — source provenance            | [Narrow provenance lookup owner established](../../tasks/backlog/2026-08-18-hito-source-plan-provenance-lookup-owner-extraction.md).                                                                                                                                                                                                                                                  |
| 2A — Calendar query                 | [Calendar row/query/context ownership isolated](../../tasks/backlog/2026-08-18-hito-runner-calendar-query-owner-extraction.md).                                                                                                                                                                                                                                                       |
| 2B — Calendar mutations             | [Atomic Calendar mutation ownership isolated](../../tasks/backlog/2026-08-21-hito-runner-calendar-mutation-owner-extraction.md).                                                                                                                                                                                                                                                      |
| 2C — Calendar snapshot              | [Persisted snapshot assembly moved behind the Calendar owner](../../tasks/backlog/2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md).                                                                                                                                                                                                                                        |
| 3 — Result/Evidence                 | [Provider-neutral public contract isolated](../../tasks/backlog/2026-08-21-hito-result-evidence-public-contract.md).                                                                                                                                                                                                                                                                  |
| 4 — Progress                        | [Product/Design System consumers moved to the factual Product contract](../../tasks/backlog/2026-08-21-hito-evidence-progress-product-contract.md).                                                                                                                                                                                                                                   |
| 5 — Identity/Admin                  | [Identity-owned actor classification replaced the Admin-named owner](../../tasks/backlog/2026-08-21-hito-identity-owned-actor-classification.md).                                                                                                                                                                                                                                     |
| 6 — shared responsibility and truth | [Frontend feedback presentation](../../tasks/backlog/2026-08-21-hito-feedback-marker-presentation-owner-extraction.md), [current-system reconciliation](../../tasks/backlog/2026-08-21-hito-current-system-modular-boundary-reconciliation.md) and [focused Foundation acceptance](../../tasks/backlog/2026-08-21-hito-foundation-domain-boundaries-epic-acceptance.md) are accepted. |

HITO-241 found one remaining full runtime-plus-type cycle between signed-out preview and
`training.ts`. The bounded Backend fix made preview import canonical `WorkoutDocument` types
directly. Independent QA then accepted the full dependency direction, unchanged preview payload,
Calendar snapshot discrimination, plan neutrality and focused validators. This was the final
Foundation implementation condition, not a reason to reopen an earlier owner.

## Reusable Slice Contract

The accepted [delivery-cost decision](../../tasks/backlog/2026-08-21-hito-delivery-context-cost-and-modular-efficiency-audit.md)
remains the operating boundary for later domain work:

1. Map direct production and proof consumers plus recursive runtime and type-only direction before
   extracting an owner.
2. Make the provider's final public contract, lossless initializer and command readiness explicit
   before transferring a consumer to Frontend.
3. Migrate consumers directly and remove the superseded export or responsibility; do not leave an
   alias, re-export, fallback, shadow projection or second writer.
4. Admit Notion lifecycle access, the exact environment and a fresh managed artifact before
   Verification ownership changes.
5. After ownership is stable, validate the changed contract, its direct boundary and risk-derived
   integration cases. Cross-product replay belongs to an Epic or release, not every slice.

These are dependency and evidence rules, not token, file, time or test-count quotas.

## Foundation Exit

The finite programme meets every material exit signal:

- `training-api.ts` is transport/composition for the accepted Calendar path;
- cross-domain Product and Design System imports resolve through accepted public contracts;
- retired deep imports and duplicate owners are absent in the accepted receipts;
- `docs/current-system.md` and `docs/current-state.md` describe the implemented owners and qualify
  legacy physical names as temporary facts;
- focused domain proofs and independent HITO-241 acceptance passed, including full runtime and
  type-only dependency direction.

No next extraction is admitted by this plan. Shared modules are not work merely because they are
large or shared. A later product outcome may justify one bounded extraction only when its direct
consumers, one-way dependency, removal condition and focused proof are demonstrated.

Commercial/finance, Admin operations, locale and Marketing remain separate product outcomes rather
than unfinished HITO-218 phases.

## Acceptance Boundary

HITO-218 can return to PRODUCT for final acceptance. Global QA, release admission, hosted parity and
deployment are not architecture-exit conditions and remain separate. No source, runtime, database,
provider, hosted or Git action is authorized by this closeout.

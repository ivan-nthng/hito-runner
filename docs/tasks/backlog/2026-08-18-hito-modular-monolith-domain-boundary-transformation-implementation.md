# Hito Modular Monolith Domain-Boundary Transformation Implementation

Work Item ID: `2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation`
Notion Task: [HITO-218](https://app.notion.com/p/Isolate-Hito-Product-Domains-3c2fe5f58cf5812e8e0fd1de5b2b494f)
Type: Tracked
Parent: [Hito Product Roadmap: Runner Core, Evidence And Progress, And Commercial Readiness](../../plans/archive/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation](../../plans/archive/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md), [Hito Delivery Context Cost And Modular Efficiency Audit](./2026-08-21-hito-delivery-context-cost-and-modular-efficiency-audit.md)

## Outcome

Hito now has accepted public boundaries for the Foundation domains without a rewrite, microservice
split, compatibility authority or duplicate product model. Runner Calendar owns confirmed workouts;
sources are immutable provenance. Result/Evidence, Progress, Identity and Frontend presentation each
own their factual or display decisions behind direct public contracts.

Operational status, phase, owner and handoff truth live only in Notion HITO-218. This record retains
the final technical contract, direct evidence and residual acceptance boundary.

## Final Architecture Receipt — 2026-08-21

### Terminal Phase Evidence

| Phase | Accepted outcome                                                                                                                           | Direct technical evidence                                                                                                                                                                                                                                                                           |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1     | The Workout sidebar consumes a semantic contract rather than a server query owner.                                                         | [Workout detail sidebar contract isolation](./2026-08-18-hito-workout-detail-sidebar-contract-isolation.md)                                                                                                                                                                                         |
| 2A-0  | Source-provenance lookup has a narrow owner below Calendar/source materialisation.                                                         | [Source-plan provenance lookup extraction](./2026-08-18-hito-source-plan-provenance-lookup-owner-extraction.md)                                                                                                                                                                                     |
| 2A    | Runner Calendar owns persisted workout rows, queries and mutation context.                                                                 | [Runner Calendar query owner extraction](./2026-08-18-hito-runner-calendar-query-owner-extraction.md)                                                                                                                                                                                               |
| 2B    | Runner Calendar owns atomic Calendar mutations without plan lifecycle authority.                                                           | [Runner Calendar mutation owner extraction](./2026-08-21-hito-runner-calendar-mutation-owner-extraction.md)                                                                                                                                                                                         |
| 2C    | Calendar owns persisted snapshot assembly; transport no longer publishes plan-shaped signed-in authority.                                  | [Runner Calendar public snapshot cleanup](./2026-08-21-hito-runner-calendar-public-snapshot-cleanup.md)                                                                                                                                                                                             |
| 3     | Result/Evidence exposes provider-neutral facts while ingestion, parser, storage and provider mechanics remain private.                     | [Result/Evidence public contract](./2026-08-21-hito-result-evidence-public-contract.md)                                                                                                                                                                                                             |
| 4     | Progress and shared factual UI consume one Product contract rather than provider-private read models.                                      | [Evidence/Progress Product contract](./2026-08-21-hito-evidence-progress-product-contract.md)                                                                                                                                                                                                       |
| 5     | Identity owns actor classification; Runner and Admin consume its explicit result.                                                          | [Identity-owned actor classification](./2026-08-21-hito-identity-owned-actor-classification.md)                                                                                                                                                                                                     |
| 6     | Feedback labels have one Frontend owner, current architecture documents match the accepted boundaries, and focused Epic acceptance passed. | [Feedback presentation owner](./2026-08-21-hito-feedback-marker-presentation-owner-extraction.md), [current-system reconciliation](./2026-08-21-hito-current-system-modular-boundary-reconciliation.md), [Foundation acceptance](./2026-08-21-hito-foundation-domain-boundaries-epic-acceptance.md) |

### Phase 6 Exit Decision

| Exit signal                                                                            | Result                                                                                           |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ |
| Shared transport/composition does not own Calendar policy                              | Met by HITO-232 and reflected in `docs/current-system.md`.                                       |
| Cross-domain UI consumes public contracts                                              | Met by HITO-236 and HITO-239.                                                                    |
| Retired deep imports and owners are absent                                             | Met by the accepted removal/reverse-import proofs for HITO-235, HITO-236, HITO-237 and HITO-239. |
| Current documentation names accepted owners and treats legacy names as temporary facts | Met by HITO-240.                                                                                 |
| Runtime and type-only dependency direction is accepted across the Foundation boundary  | Met by HITO-241 after the bounded signed-out-preview type-cycle fix and independent QA replay.   |
| Epic acceptance is distinct from release                                               | Met: HITO-241 is accepted; Global QA, release, hosted parity and deployment remain separate.     |

No demonstrated responsibility remains that prevents this finite Foundation outcome from closing.
`training.ts`, `training-api.ts` or another shared seam must not be split further merely because it
still has multiple consumers. A future extraction requires a separately admitted product outcome,
one canonical owner, a complete runtime and type-only consumer map, a removable old responsibility
and focused proof.

### Retained Boundary

- One TanStack/Supabase/Vercel modular monolith and one runner-owned Calendar workout truth remain.
- Source plans and legacy physical names retain provenance or implementation history only.
- Notion is lifecycle truth; Markdown is technical evidence; Git is code history; Supabase is
  runtime truth.
- Global QA, release admission, hosted parity and deployment were not performed or claimed here.

HITO-218 is technically complete and returns to PRODUCT for final lifecycle acceptance. No
successor extraction Task is created or dispatched by this reconciliation.

## Documentation Validation

- Local Markdown links, scoped Prettier, direct whitespace and whole-worktree `git diff --check`:
  PASS.
- The 58 unrelated dirty/untracked paths were preserved byte-for-byte; their aggregate fingerprint
  remained `307e3a60fcbde0fa64ddfecc25561c36c5265f9e2605ad0f0d82f2d22719fac5`.
- Runtime, source, tests, generated output, database, browser, providers, hosted state, Git lifecycle
  and completed Task lifecycles were not changed or claimed.

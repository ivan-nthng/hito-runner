# Hito Modular Monolith Domain-Boundary Transformation Implementation

Work Item ID: `2026-08-18-hito-modular-monolith-domain-boundary-transformation-implementation`
Status: in_progress
Type: Tracked
Priority: highest
Owner: PRODUCT
Epic: platform-and-operations
Parent: [Hito Product Roadmap: Runner Core, Evidence And Progress, And Commercial Readiness](../../plans/active/2026-08-15-hito-runner-product-readiness-and-progressive-materialization-roadmap.md)
Depends On: [Hito Hosted Runner Core Migration Parity And Production Deploy](./2026-08-18-hito-hosted-runner-core-migration-parity-and-production-deploy.md)
Evidence From: [Hito Modular Monolith Domain-Boundary Transformation Plan](../../plans/active/2026-08-18-hito-modular-monolith-domain-boundary-transformation.md), [Hito Scalable Delivery Architecture Rewrite Decision](./2026-08-18-hito-scalable-delivery-architecture-rewrite-decision.md)

## Scope

Implement the approved incremental extraction of bounded business-domain contracts in six serial
phases: Workout sidebar, Calendar/source provenance, result/evidence, Progress, Identity/Admin,
and shared-facade reduction. Each slice changes one demonstrated owner, moves its consumers through
an explicit public contract, removes the superseded responsibility, and extends only its focused
proof. Hito remains one modular monolith; no rewrite, microservice split, framework, compatibility
authority, or duplicate product model is admitted.

## Archive Intent

Retain through all six terminal slices and their Epic-level acceptance. This parent records only the
approved outcome and serial sequencing; each implementation slice retains its own owner, evidence,
status, and receipt.

## Task

After the hosted Runner Core reconciliation and deployment chain is terminal, dispatch Phase 1 from
the approved plan to BACKEND. Keep each later phase serialized behind the prior phase's truthful
completion and required Product boundary review. Do not restart the repository-wide architecture
audit, reread unrelated domains, or turn this parent into a second task tracker.

## Stage

Phase 2A independent QA rerun after duplicate Calendar row-type ownership removal

## Next Recommended Role

QA

## Blockers

None. The hosted Runner Core reconciliation and deployment chain is terminal, and Phase 1 contract
isolation plus its static-panel consumer cleanup are complete. Phase 2A starts with the bounded
Calendar query owner extraction.

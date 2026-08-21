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

Phase 2B Calendar mutation-owner extraction — tracked in
[Hito Runner Calendar Mutation Owner Extraction](./2026-08-21-hito-runner-calendar-mutation-owner-extraction.md)

## Next Recommended Role

BACKEND

## Blockers

None. Phase 2A's focused independent QA acceptance is complete after the duplicate Calendar
row-type ownership repair. Phase 2B may now move only the three Calendar atomic mutations and their
demonstrated policy inputs; reviewed source-materialisation commands remain outside that boundary.

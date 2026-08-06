# Backend Codebase Reduction Cycle

## Work Item ID

2026-08-05-backend-codebase-reduction-cycle

## Status

completed

## Type

change_request

## Priority

medium

## Owner

backend

## Scope

backend-simplification

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Run one post-release, evidence-gated Backend reduction cycle across runtime, API, auth, build/tooling,
validators, fixtures, and proofs. Remove only zero-consumer residue or exact duplicated ownership,
reuse the surviving canonical owner, and preserve accepted Product, persistence, security, provider,
and release behavior.

## Stage

The post-release source and consumer inventory is complete. The runtime value-import graph has no
cycle and every Backend module has a live consumer, so no whole-file deletion or broad module split
was admitted from size alone. The completed cycle removed zero-consumer declarations, consolidated
exact weekday, authentication, entitlement, build-path, and proof-setup ownership, and closed one
demonstrated redirect-separator vulnerability without changing Product contracts.

## Parent

[Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)

## Admission And Retention Rule

- Delete a candidate only with zero-consumer proof or a same-slice exact replacement.
- Retain generated exports, externally consumed contracts, operation-specific safety checks, and
  semantically distinct proofs with their current consumer evidence.
- Count runtime, proofs/scripts, generated artifacts, documentation, and lockfiles separately.
- Do not move code merely to redistribute lines or create another helper, framework, fixture store,
  cache, compatibility path, or proof system.

## Completion Receipt

The exact source boundary removed 379 net lines from `src/**` and 88 net lines from maintained
proof/build tooling: 467 net code lines in total. Generated artifacts and lockfiles changed by zero.
The surviving owners are the existing weekday/rest invariant, persisted-request user, entitlement
readback, managed build/runtime, and proof assertion seams; no replacement framework or helper layer
was introduced.

The minimized auth discriminator proves literal and percent-encoded backslashes cannot become an
external redirect while valid internal paths remain exact. Backend source (13/13), local persistence
(16/16), runtime (15/15), release (16/16), Vercel production build, scoped lint, graph/reachability,
build integrity, and independent QA all passed. The managed runtime was rebuilt and independently
verified healthy, loopback-only, and in `qa_fixture` mode after the release builds.

Retained boundaries are deliberate: `training-api.ts`, the manual-authoring index, generated
Supabase types, and service-role lookup helpers have current semantically distinct consumers;
Nitro's optional deployment dependency graph remains lockfile-owned; unique proof assertions remain
separate; and `scripts/finalize-build-output.mjs` remains under its concurrent owner. Route-level
multipart-auth ordering and raw database error-message candidates require a separately admitted API
security slice because Product routes were explicitly outside this cleanup boundary.

The commit containing this receipt is the exact release manifest. Deployment and production smoke
evidence are recorded in the owner report. Global QA Acceptance remains separate.

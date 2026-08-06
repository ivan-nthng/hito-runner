# Product API Request-Boundary Hardening

## Work Item ID

2026-08-05-product-api-request-boundary-hardening

## Status

completed

## Type

bug

## Priority

high

## Owner

backend

## Scope

backend-api-security

## Batch

hito-stack-simplification

## Archive Intent

retain_in_place

## Task

Harden Product API request ordering and public error serialization without changing successful
Product behavior, persistence lifecycle, or frontend DTOs.

## Stage

Backend security implementation and integrated QA completed.

## Parent

[Hito Stack Complexity Reduction Program](2026-08-04-hito-stack-complexity-reduction-program.md)

## Related Records

[Backend Codebase Reduction Cycle](2026-08-05-backend-codebase-reduction-cycle.md)

## Execution Preflight

- Task and bounded outcome: reject unauthenticated avatar uploads before multipart parsing and
  serialize direct Product API failures with stable public messages.
- Evidence before code: the built loopback replay returned avatar validation `400` before runner
  authentication, while the direct avatar and plan-export catch boundaries returned raw caught
  infrastructure messages.
- Canonical owner: the existing direct API request/auth and response-serialization boundaries.
- Smallest root-cause outcome: share the existing bounded multipart read with Garmin intake, move
  avatar authentication ahead of it, and replace only unknown direct-route error responses.
- Required proof: built-runtime authenticated/unauthenticated multipart and export replay, source
  reachability, FIT preservation, local persistence/RLS regressions, build/integrity, and independent
  QA.
- Stop condition: a required public error mapping that changes a Frontend DTO or an accepted Product
  workflow is a separate cross-owner contract decision.

## Revised Execution Preflight

- Evidence before code: the direct-route inventory also traced raw persistence `Error.message` values
  through four runner mutation server functions and imported-plan confirmation into existing Product
  error presentation.
- Canonical owner: the existing server-function response handlers, not their shared persistence
  owners or Product components.
- Smallest root-cause outcome: preserve known runner-safe domain/auth errors and replace unknown
  thrown infrastructure failures with stable operation-specific errors plus server diagnostics.
- Required proof: source reachability for each boundary, existing mutation regression suites, fresh
  built runtime, and independent QA.
- Stop condition: any domain failure whose public meaning cannot be allowlisted without changing an
  accepted Product workflow.

## Demonstrated Root Cause

`/api/profile-avatar/upload` parsed multipart input before resolving the persisted runner, and it
serialised caught Supabase/storage error text. `/api/plan/export` likewise returned unknown caught
error text. The existing Garmin upload boundary already proves the intended auth-before-body and
runner-safe-error pattern.

## Intended Outcome

- Reject unauthenticated Product mutations before multipart parsing where auth is required.
- Preserve documented public validation, authentication, and not-found responses.
- Return stable safe failures for unexpected Product API errors while retaining server diagnostics.
- Reuse existing request-auth, runner-safe error, validator, runtime, and release seams.

## Completion Receipt

- Completed request and response scope: avatar upload now authenticates before bounded multipart
  parsing; direct avatar/export routes retain only documented public `400`/`401`/`404` failures;
  and five runner mutation server functions preserve allowlisted domain/auth messages while mapping
  unknown failures to stable safe responses with server-side diagnostics.
- Reused and consolidated: the FIT upload bounded multipart reader is now the single shared helper;
  the duplicate private FIT-only reader was deleted.
- Regression proof: source and built loopback `qa_fixture` checks cover unauthenticated normal and
  oversized avatar bodies, authenticated oversize and malformed bodies, export `400`/`401`/`404`,
  direct error-redaction source invariants, FIT ordering, local persistence/RLS, and full Backend
  source/runtime/release suites.
- Retained boundary: raw database errors remain available only to their lower server owners and logs;
  they are no longer Product-facing transport values. No second error system or lower persistence
  rewrite was added.
- Final state: `completed`; Implementation DoD passed for direct Product API routes and the admitted
  runner server-function response boundaries.

## Exact Handoff Prompt

```text
ROLE: BACKEND

Task: Complete Product API request-boundary and error-serialization hardening through the existing
auth, route, validation, runtime, and release seams. Preserve Product behavior and release only the
exact task-owned manifest after independent QA.
```

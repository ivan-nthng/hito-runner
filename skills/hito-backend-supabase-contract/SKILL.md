---
name: hito-backend-supabase-contract
description: Use for Hito backend implementation involving Supabase schema, server actions, auth/admin guards, canonical persistence, imports, exports, entitlements, integrations, or AI context builders.
---

# Hito Backend Supabase Contract

## Purpose

Implement backend-owned truth safely while preserving Hito's canonical persisted model.

## Required Reading

1. `docs/current-system.md`
2. relevant active plan
3. current Supabase migration/type files when schema is touched
4. existing backend module patterns near the target slice

## Workflow

1. Confirm the canonical table/entity owner.
2. Validate inputs at server boundaries.
3. Persist raw provider/input truth before normalized truth when provenance matters.
4. Normalize into existing canonical entities instead of creating provider-specific product models.
5. Keep mutation safety explicit: stale checks, admin checks, entitlement checks, review/confirm boundaries.
6. Return bounded result/error shapes for frontend and QA.
7. Update generated/local database types only when schema actually changes.
8. Update permanent docs only for implemented behavior.

## Hard Reuse And Cleanup Gate

- Existing backend owners, validators, server actions, persistence helpers, scripts, and canonical entities must be reused before adding new ones.
- Before creating a module, table, migration, RPC, script, helper, or abstraction, search for the existing owner and extend it if that keeps the system smaller.
- New storage or a new subsystem requires a concrete plan-backed reason; do not add it because it is convenient for one slice.
- If an implementation attempt is abandoned, reverted, or replaced, remove the stale code/config/script in the same slice whenever safe.
- Temporary compatibility layers, fallbacks, diagnostic helpers, or legacy bridges must include a removal condition or follow-up cleanup note.
- After replacing a legacy path, delete or hard-block the old path once QA proves the replacement, unless an active plan explicitly keeps it for compatibility.

## Minimal Diff And Reuse Rule

- For one-field, one-copy, or one-condition requests, make the smallest direct change that satisfies the request.
- Before adding a module, action, helper, schema, migration, or table, search for an existing owner and reuse or extend it.
- Do not turn a small behavior change into a broad backend decomposition.
- If the likely implementation touches many files, changes public contracts, adds storage, or introduces a new abstraction for a small request, stop and get explicit confirmation first.
- Consolidate repeated backend patterns only when duplication is proven and the consolidation removes more code or risk than it adds.
- Prefer existing canonical entities and server-action patterns over parallel models.
- In the final report, call out when the diff stayed intentionally minimal or when a larger diff was unavoidable.

## Hito Backend Rules

- Supabase canonical truth must not be bypassed by local fallback truth.
- Service/admin keys stay server-only.
- Entitlement and admin checks are backend-owned.
- AI receives compact backend-built context, not unrestricted database access.
- Compatibility exports may remain only when useful and should not re-own logic.
- Do not duplicate canonical lifecycle, validation, persistence, admin, entitlement, or AI-context logic in a parallel seam.
- Do not leave dead code behind for "maybe later"; move it to a documented backlog/plan or delete it.

## Validation

Run the smallest relevant check set:

- typecheck/lint/build when product code changed and feasible
- targeted scripts/tests when available
- `git diff --check`
- schema verification when migrations/types change

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers

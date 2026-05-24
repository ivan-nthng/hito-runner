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

## Hito Backend Rules

- Supabase canonical truth must not be bypassed by local fallback truth.
- Service/admin keys stay server-only.
- Entitlement and admin checks are backend-owned.
- AI receives compact backend-built context, not unrestricted database access.
- Compatibility exports may remain only when useful and should not re-own logic.

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

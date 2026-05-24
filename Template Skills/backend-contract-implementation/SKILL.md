---
name: backend-contract-implementation
description: Use for backend/API/server-action/schema implementation slices that must preserve canonical architecture and server-owned validation.
---

# Backend Contract Implementation

## Purpose

Implement server-owned behavior safely and in the smallest useful slice.

## Workflow

1. Read the canonical architecture plan and active task plan.
2. Inspect existing backend patterns before adding new modules.
3. Define or confirm request/response shapes.
4. Keep validation at the backend/service boundary.
5. Persist raw input/provider truth first when auditability matters.
6. Normalize into existing canonical entities instead of creating parallel models.
7. Return bounded, user-facing error states.
8. Add migration/rollback notes when schema changes.
9. Run targeted tests/checks and report gaps.

## Rules

- Backend owns final validation, authorization, persistence, lifecycle, and mutation safety.
- UI checks are never security or entitlement authority.
- Do not store secrets, raw prompts, raw transcripts, provider tokens, or large payloads unless explicitly planned.
- Do not add a broad permission/event/framework layer unless the plan requires it.
- Preserve compatibility exports only with a removal plan.

## Validation

Use project checks first. If unavailable, run targeted unit/integration smoke checks and explain residual risk.

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers

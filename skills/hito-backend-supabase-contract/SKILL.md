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
2. Use subagents when safe for independent read-only import/source audits, validator inventory,
   non-mutating command checks, or disjoint implementation subtasks. Reuse open subagents for
   related follow-ups, close them when done, and integrate findings yourself.
3. Validate inputs at server boundaries.
4. Persist raw provider/input truth before normalized truth when provenance matters.
5. Normalize into existing canonical entities instead of creating provider-specific product models.
6. Keep mutation safety explicit: stale checks, admin checks, entitlement checks, review/confirm boundaries.
7. Return bounded result/error shapes for frontend and QA.
8. Update generated/local database types only when schema actually changes.
9. Update permanent docs only for implemented behavior.

## Backend / Frontend Boundary

- Treat frontend route/component/style/Hito DS/copy files as read-only consumer context.
- Backend may inspect frontend consumers to understand contract impact, but must not edit them.
- If a backend-owned contract cleanup creates required frontend compile, rendering, or copy changes,
  stop at the backend boundary after backend proof is green or clearly blocked, then route one
  FRONTEND follow-up with exact consumer-impact notes.
- Do not hide frontend work inside a backend batch as "small compile-impact updates".
- Backend may use QA, ARCHITECT, or FRONTEND subagents for read-only audits and validation evidence,
  but the backend agent remains responsible only for backend-owned edits.

## Bolder Backend Batch Rule

- If a backend defect is a class of failures, fix the class in the canonical owner instead of only
  the first visible repro.
- Take the adjacent same-owner seams in one batch when they share validation and risk.
- Reuse existing implemented flows before adding helpers, scripts, tables, or abstractions.
- Tighten validators/source contracts and then fix the failures they expose.
- Do not write a new Markdown plan/report for routine backend cleanup when a compact plan note or
  final report is enough.

## Root-Cause Backend Fix Gate

- Backend bug fixes must start by naming the failing source-of-truth boundary: request parsing,
  validation, normalization, canonical persistence, auth/admin/entitlement, AI context/contract,
  import/export, lifecycle, or response/view-model shaping.
- Do not patch only the downstream symptom. Trace upstream to the first incorrect backend owner and
  fix that owner when the slice can safely cover it.
- If the same bug can still occur through a nearby route, server function, script, import path, or
  persistence seam, the fix is not done.
- If the real problem is duplicated truth, a missing canonical contract, legacy compatibility drift,
  or a repeated workaround, prefer a bounded consolidation over another local branch.
- If the systemic fix is too large for the current slice, report it explicitly with a proposed owner
  and do not present the symptom patch as the complete solution.
- Final reports must state the root cause, the canonical backend owner changed, and which existing
  seams were reused.

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
- This rule applies to isolated small requests. If source proof shows a class of failures across
  adjacent same-owner backend seams, use the Bolder Backend Batch Rule instead of stopping only
  because the diff is non-trivial.
- If the likely implementation touches many unrelated files, changes public contracts, adds storage,
  or introduces a new abstraction for a small request, stop implementation and get bounded
  Architect/Product confirmation first; use available local or subagent audit before returning to
  the user.
- Consolidate repeated backend patterns only when duplication is proven and the consolidation removes more code or risk than it adds.
- Prefer existing canonical entities and server-action patterns over parallel models.
- In the final report, call out when the diff stayed intentionally minimal or when a larger diff was unavoidable.

## Large File Decomposition Gate

- Before adding substantial backend logic, check whether the target file is already large or mixed-responsibility.
- If a file is roughly 700+ lines and the change adds a new responsibility, either extract a focused seam or explicitly justify why that file remains the correct owner.
- Files around 1000+ lines should not receive new responsibility without an architecture reason in the plan or final report.
- Files around 1500+ lines are active decomposition candidates unless they are generated, fixture-only, or intentionally consolidated documentation.
- Extract by stable backend responsibility: schema/types, validation, normalization, persistence, orchestration, metrics/policy, AI prompt/schema, fixtures, or script assertions.
- Keep public facades stable during decomposition unless the active plan explicitly changes the import contract.
- Do not split by arbitrary line count, and do not combine broad decomposition with behavior changes unless the active plan explicitly scopes both.

## Hito Backend Rules

- Supabase canonical truth must not be bypassed by local fallback truth.
- Service/admin keys stay server-only.
- Entitlement and admin checks are backend-owned.
- AI receives compact backend-built context, not unrestricted database access.
- Compatibility exports may remain only when useful and should not re-own logic.
- Do not duplicate canonical lifecycle, validation, persistence, admin, entitlement, or AI-context logic in a parallel seam.
- Do not leave dead code behind for "maybe later"; move it to a documented backlog/plan or delete it.
- Do not edit frontend-owned files from this backend skill; route frontend consumer changes to
  FRONTEND after backend contract proof.

## Validation

Run the smallest relevant check set:

- typecheck/lint/build when product code changed and feasible
- targeted scripts/tests when available
- `git diff --check`
- schema verification when migrations/types change

### Definition Of Done, Test Inventory, And Acceptance Gate

Apply this gate only to implementation, debugging, or validation work. A pure explanatory or
reference response needs no test inventory. For debugging, include a safe repro or discriminator
that proves the first incorrect owner, not only the post-fix happy path.

Before final validation, define the observable backend outcome, preserved boundaries, and compact
required inventory from the changed contract, persistence/mutation risk, and consumer impact. If QA
contributes evidence, the owning Backend agent must integrate QA's complete executed-test list, not
merely its verdict. The final report must list each executed command or scenario with
result/evidence in `Check | Scenario / environment | Result | Evidence` form, plus each required
check not run and why. Report `Implementation DoD: Passed` only when that inventory passes;
otherwise fix-forward and rerun it, or return `FAIL`/`BLOCKED`. If broad independent QA is outside
this task, report `Global QA Acceptance: Pending` rather than claiming release acceptance.

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Required test inventory and validation results
7. Required checks not run / coverage consequences
8. Blockers

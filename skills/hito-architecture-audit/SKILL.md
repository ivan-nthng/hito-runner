---
name: hito-architecture-audit
description: Use for Hito architecture audits, hotspot selection, cleanup checkpoints, product-track prioritization, and any task that asks whether the current system is structurally coherent before implementation.
---

# Hito Architecture Audit

## Purpose

Produce evidence-based architecture recommendations without drifting into speculative rewrites.

## Required Reading

For non-trivial Hito architecture work, read in order:

1. `docs/context.md`
2. `docs/glossary.md`
3. `docs/current-system.md`
4. `docs/current-product.md`
5. `docs/current-state.md`
6. relevant active plan in `docs/plans/active/`
7. relevant source files named by the task

## Workflow

1. Inspect current code/docs before recommending.
2. Use read-only subagents when independent source/import scans, docs drift checks, file-size
   inventories, validation-command audits, or candidate comparisons can run safely without user
   attention. Reuse open subagents for similar follow-ups, close them when done, and integrate their
   findings yourself.
3. Identify canonical pipeline ownership:
   `runner/provider input -> backend validation -> normalization -> canonical persisted entities -> deterministic product truth -> optional AI/enrichment -> explicit review/confirm when mutation is risky -> UI rendering`
4. Find duplicated paths, oversized files, mixed responsibilities, frontend-owned rules, unsafe mutations, and stale compatibility layers.
5. Separate:
   - immediate next slice
   - backlog
   - no longer worth touching
6. Recommend exactly one next action unless the user asks for a broader comparison.

## Hito Architecture Rules

- Supabase-backed saved mode is canonical persisted truth.
- Backend owns validation, normalization, persistence, lifecycle, entitlement, and mutation safety.
- Frontend renders and collects backend-shaped truth.
- AI never gets raw authority over canonical mutation.
- Hito DS comes before route-local styling.
- Prefer deletion/simplification over abstraction.

## Output

1. Task
2. Stage
3. Current state
4. Findings
5. Recommendation
6. Why
7. What not to touch
8. Next recommended role
9. Blockers

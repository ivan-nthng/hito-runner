---
name: hito-architecture-audit
description: Use for Hito architecture audits, hotspot selection, cleanup checkpoints, product-track prioritization, and any task that asks whether the current system is structurally coherent before implementation.
---

# Hito Architecture Audit

## Purpose

Produce evidence-based architecture recommendations without drifting into speculative rewrites.

## Evidence, Replay, And Lessons

Follow `AGENTS.md` section 2.45 before selecting a defect fix: recommend from an artifact that
distinguishes the root cause, not from the report alone. For a deterministic recurring failure,
prefer a minimized redacted replay in an existing validator/test seam; do not create a workflow
engine, knowledge base, or standalone process layer. Record a reusable lesson only after a passing
artifact names the failure pattern and the rejected approach; use the existing technical log, plan,
role rule, validator, or fixture owner.

For a claimed release or finalization checkpoint, apply the `AGENTS.md` section 0.1 receipt gate to
the included slices. This is a compact source/evidence reconciliation, not a new audit artifact or
an excuse to reopen already accepted, unrelated work.

This skill does not turn an orchestration/router agent into an implementation owner. Unless the
current task is explicitly addressed to `ROLE: ARCHITECT` and scopes architecture-owned
source-of-truth edits, use this skill to audit, select/hold the next gate, and write the exact
prompt for the correct execution owner. BACKEND, FRONTEND, QA, DESIGNER, and RUNNING COACH work must
be executed by those role agents, with their own subagents where useful.

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

## Bolder Audit Bias

- Do not select a micro-gate when one same-owner batch can remove the root cause.
- Prefer implemented source truth, validators, and executable checks over new prose artifacts.
- Treat duplicated paths and unused compatibility layers as deletion/consolidation candidates, not
  permanent risk to route around.
- If the next useful step mostly writes Markdown, challenge whether a code/tooling/validator batch
  would reduce more real complexity.
- Accept reasonable local implementation risk when validation can catch breakage; name the stop
  conditions instead of blocking by default.
- Authorize the execution role to take that risk inside its own boundary; do not perform another
  role's implementation or QA from the architecture/router layer.

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

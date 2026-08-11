---
name: hito-architecture-audit
description: Use for Hito architecture, cleanup, ownership, hotspot, and prioritization decisions.
---

# Hito Architecture Audit

## Purpose

Make an evidence-backed structural decision without turning an audit into a speculative rewrite or
an implementation task.

## Read

Read only the current docs and source needed for the decision: normally current-system,
current-product, current-state, the canonical backlog item if Tracked, and the named seam.

## Workflow

1. Classify Lite or Tracked under AGENTS.md.
2. Identify the observed system shape, source-of-truth owner, duplicated/stale path, and evidence.
3. For a defect, prove the first incorrect owner or name the exact missing discriminator.
4. Select one outcome: safe next slice, hold, deletion/consolidation candidate, or no-change.
5. Use bounded read-only subagents only when they materially reduce independent source or import
   analysis.

## Rules

- Preserve the Hito pipeline: input -> backend validation -> normalization -> canonical persisted
  entities -> deterministic product truth -> optional AI -> explicit review/confirm -> UI.
- Prefer deletion, reuse, and a coherent same-owner batch over parallel systems or a framework.
- Do not implement Backend, Frontend, QA, or Design System work from this skill.
- Do not create a plan, dashboard, registry, or new process layer unless it is the smallest durable
  source of truth.

## Output

State evidence, owner, decision, what not to touch, next recommended role, and blocker. PRODUCT
dispatches the next role.

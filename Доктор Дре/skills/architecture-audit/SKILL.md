---
name: architecture-audit
description: Use for architecture audits, duplication and hotspot analysis, cleanup checkpoints, source-of-truth tracing, and selecting the next bounded engineering slice.
---

# Architecture Audit

## Purpose

Produce evidence-based architecture recommendations without drifting into speculative rewrites.

## Read First

1. repository-level operating rules;
2. current architecture, product, and state documents;
3. active plan or task;
4. relevant source owners and latest implementation/QA reports.

## Workflow

1. Trace the visible symptom to the first incorrect owner.
2. Map the canonical pipeline and source-of-truth boundaries.
3. Inspect for duplicated paths, mixed responsibilities, unused compatibility layers, large hotspots,
   unsafe mutation, stale docs, and missing validation.
4. Separate immediate work, backlog, and work that should remain untouched.
5. Recommend exactly one next action unless a broader comparison is requested.

## Rules

- Prefer deletion and consolidation over new abstraction.
- Do not turn a read-only audit into implementation.
- Do not propose broad rewrites without measured evidence and a bounded validation story.
- Keep data/service truth, UI interaction, and domain doctrine in their proper owners.

## Output

Task, Stage, Current state, Findings, Recommendation, Why, What not to touch, Next role, Blockers.

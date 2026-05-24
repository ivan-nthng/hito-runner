---
name: architecture-audit
description: Use when starting a new project, reviewing an existing codebase, or deciding whether the current system architecture is coherent before implementation.
---

# Architecture Audit

## Purpose

Find the real system shape before planning or implementation.

## Workflow

1. Read the project README, docs, dependency files, runtime config, routes/entry points, schema/persistence files, and main feature modules.
2. Identify the canonical product pipeline: intake, validation, normalization, canonical entities, enrichment, UI/readback, and publication/export if applicable.
3. Map source-of-truth ownership:
   - backend/service truth
   - client/UI truth
   - local/cache truth
   - external provider truth
   - AI/generated truth
4. Find architecture risks:
   - duplicated product paths
   - large mixed-responsibility files
   - frontend-only business rules
   - hidden mutations
   - unclear confirmation boundaries
   - unbounded AI or automation behavior
   - unsafe credential or local-only assumptions
5. Recommend one next architecture plan or one bounded cleanup slice.

## Rules

- Prefer deletion and consolidation over abstraction.
- Do not recommend a rewrite unless current architecture prevents safe work.
- Do not introduce a framework, queue, tracker, or event system without proven need.
- Keep findings evidence-based with file references.

## Output

1. Task
2. Stage
3. Current architecture health
4. Key findings
5. Highest-risk gaps
6. Recommended next slice
7. What not to touch
8. Next recommended role
9. Blockers

---
name: design-system-audit
description: Use when auditing UI consistency, token usage, component reuse, modal/dialog patterns, typography roles, spacing, and design-system drift.
---

# Design-System Audit

## Purpose

Find UI drift and recommend bounded cleanup without redesigning the product.

## Workflow

1. Read design-system docs and the canonical architecture plan.
2. Inventory the target surfaces/components.
3. Compare against shared tokens, typography roles, spacing, buttons, form controls, dialogs, status pills, cards, and dividers.
4. Identify:
   - what is already good enough
   - what is drifting
   - what should become canonical
   - what should stay local
   - what not to abstract yet
5. Recommend one smallest safe rollout slice.

## Rules

- Prefer reuse and deletion over abstraction.
- Do not recommend broad redesign.
- Do not change product behavior to satisfy visual consistency.
- Keep design-system docs aligned with actual production truth.

## Output

1. Task
2. Stage
3. Current state
4. Findings
5. Recommendation
6. What not to touch
7. Next recommended role
8. Blockers

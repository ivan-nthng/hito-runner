---
name: frontend-design-system-implementation
description: Use for frontend implementation that must reuse existing design-system components, tokens, typography roles, spacing, and interaction patterns instead of adding local UI drift.
---

# Frontend Design-System Implementation

## Purpose

Build UI slices that preserve product truth and design-system consistency.

## Workflow

1. Read the canonical architecture plan, design guidance, and current design-system docs.
2. Inspect nearby existing surfaces and reusable components before writing UI.
3. Reuse design-system tokens, typography roles, spacing, buttons, fields, cards, tabs, dialogs, and status patterns.
4. Add new local UI only when an existing pattern cannot serve the interaction.
5. Keep backend-shaped data as the source of truth.
6. Handle states: loading, empty, error, disabled, success, and destructive confirmation.
7. Verify desktop and mobile layout.

## Rules

- Do not invent business rules in frontend code.
- Do not add route-local typography, color, spacing, or modal recipes when design-system roles exist.
- Do not create a second component family for one surface.
- Prefer removing local drift over adding abstractions.
- Keep accessibility basics: labels, focus, keyboard behavior, semantic controls.

## Browser Verification

After meaningful frontend changes, verify in the built-in browser when practical. Use Safari/Computer Use when QA policy or user request requires Safari.

## Output

1. Task
2. Stage
3. Root cause
4. Files changed
5. What changed
6. Validation results
7. Blockers

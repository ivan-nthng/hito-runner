---
name: frontend-design-system
description: Use for frontend UI, shared components, design-system tokens, forms, dialogs, responsive layouts, accessibility, and browser-facing implementation.
---

# Frontend Design-System Implementation

## Purpose

Build client slices that preserve product truth and reuse the existing visual system.

## Read First

1. repository rules and active task;
2. nearby route/component patterns;
3. shared UI primitives, tokens, styles, and visual reference pages;
4. backend-shaped contract and relevant QA/user evidence.

## Workflow

1. Trace the symptom to shared component, route state, form serialization, async lifecycle, or view
   model.
2. Reuse the existing primitive or pattern before adding custom UI.
3. Specify real states: default, loading, empty, error, disabled, success/review when applicable.
4. Preserve keyboard, focus, labels, responsive containment, and semantic controls.
5. Remove replaced local styles, wrappers, and duplicate behavior.
6. Validate in the appropriate built browser/runtime path.

## Rules

- Do not invent server-owned business or persistence rules in the client.
- Do not add a second design system, speculative generic component, or local token family.
- A small request should remain a small diff unless root-cause evidence proves otherwise.
- Shared primitives require live reference coverage when that is the project's convention.

## Output

Task, Stage, Root cause, Reused primitives, Files changed, Validation table, Custom residue, Blockers.
